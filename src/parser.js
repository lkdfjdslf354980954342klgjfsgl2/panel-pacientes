/**
 * parser.js
 * Extrae pacientes desde texto pegado (WhatsApp) o desde archivos CSV/XLSX.
 * Sin dependencias pesadas: xlsx se importa de forma dinámica solo si hace falta.
 *
 * @typedef {Object} PacienteRaw
 * @property {string} nombre
 * @property {string} telefono
 * @property {string} direccion
 * @property {string} fecha_visita  Normalizada a YYYY-MM-DD
 * @property {string} orden_medica
 * @property {string} dni
 */

/** Patrones de campo, en orden de prioridad. Soportan "Etiqueta: valor" con o sin ":" */
const FIELD_PATTERNS = [
  { key: 'telefono', regex: /^(?:tel[eé]fono|tel|cel(?:ular)?|whats\s*app)\s*:?\s*(.+)$/i },
  { key: 'direccion', regex: /^(?:direcci[oó]n|domicilio|dom\.?)\s*:?\s*(.+)$/i },
  { key: 'fecha_visita', regex: /^(?:fecha(?:\s+de)?\s*visita|visita)\s*:?\s*(.+)$/i },
  { key: 'orden_medica', regex: /^(?:orden(?:\s+m[eé]dica)?|estudios?|pedido)\s*:?\s*(.+)$/i },
  { key: 'dni', regex: /^(?:dni|documento|doc\.?)\s*:?\s*(.+)$/i },
  { key: 'nombre', regex: /^(?:nombre|paciente)\s*:?\s*(.+)$/i },
];

const NUMBERING_RE = /^\s*\d+[\).\-]\s*/;
const LOOSE_PHONE_RE = /^[\d\s\-+()]{6,}$/;
const DATE_RE = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;

/** Convierte dd/mm/yyyy (o variantes) a YYYY-MM-DD. Si no matchea, devuelve null. */
function normalizeDate(str) {
  if (!str) return null;
  const m = String(str).match(DATE_RE);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = '20' + y;
  return `${y.padStart(4, '0')}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Separa el texto pegado en bloques (uno por paciente), por numeración o líneas en blanco. */
function splitBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = [];
  lines.forEach((line) => {
    const isNumberedStart = NUMBERING_RE.test(line);
    if (isNumberedStart && current.length) {
      blocks.push(current);
      current = [line];
    } else if (line.trim() === '' && current.length) {
      blocks.push(current);
      current = [];
    } else if (line.trim() !== '') {
      current.push(line);
    }
  });
  if (current.length) blocks.push(current);
  return blocks.map((b) => b.join('\n').trim()).filter(Boolean);
}

/** Convierte un bloque de texto (un paciente) en un objeto PacienteRaw. */
function blockToPaciente(block) {
  const lines = block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const data = { nombre: '', telefono: '', direccion: '', fecha_visita: '', orden_medica: '', dni: '' };
  const usedLines = new Set();

  lines.forEach((rawLine, idx) => {
    const line = rawLine.replace(NUMBERING_RE, '');
    for (const { key, regex } of FIELD_PATTERNS) {
      if (key === 'nombre') continue; // el nombre se resuelve al final, por descarte
      const m = line.match(regex);
      if (m && !data[key]) {
        data[key] = m[1].trim();
        usedLines.add(idx);
        break;
      }
    }
  });

  // Nombre: primera línea no usada por otro campo (soporta con o sin numeración/etiqueta)
  const nameLineIdx = lines.findIndex((_, idx) => !usedLines.has(idx));
  if (nameLineIdx >= 0) {
    const nameMatch = lines[nameLineIdx].match(FIELD_PATTERNS.find((f) => f.key === 'nombre').regex);
    data.nombre = (nameMatch ? nameMatch[1] : lines[nameLineIdx]).replace(NUMBERING_RE, '').trim();
  }

  // Fallback: teléfono suelto sin etiqueta (solo dígitos/espacios/guiones)
  if (!data.telefono) {
    const phoneLine = lines.find((l, idx) => idx !== nameLineIdx && LOOSE_PHONE_RE.test(l));
    if (phoneLine) data.telefono = phoneLine.trim();
  }

  data.fecha_visita = normalizeDate(data.fecha_visita) || todayISO();

  return data;
}

/**
 * Parsea texto pegado (ej. desde WhatsApp) con uno o varios pacientes.
 * Soporta campos desordenados, con o sin ":", con o sin numeración.
 * @param {string} rawText
 * @returns {PacienteRaw[]}
 */
export function parsePacientes(rawText) {
  if (!rawText || !rawText.trim()) return [];
  return splitBlocks(rawText)
    .map(blockToPaciente)
    .filter((p) => p.nombre);
}

/** Detecta el índice de columna cuyo encabezado contiene alguno de los alias dados. */
function findColumn(headers, aliases) {
  return headers.findIndex((h) => aliases.some((a) => h.includes(a)));
}

/** Convierte filas tipo hoja de cálculo (array de arrays, primera fila = encabezado) en pacientes. */
function rowsToPacientes(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h || '').toLowerCase().trim());
  const idx = {
    nombre: findColumn(headers, ['nombre', 'paciente']),
    telefono: findColumn(headers, ['telefono', 'teléfono', 'tel', 'celular', 'whatsapp']),
    direccion: findColumn(headers, ['direccion', 'dirección', 'domicilio']),
    fecha_visita: findColumn(headers, ['fecha', 'visita']),
    orden_medica: findColumn(headers, ['orden', 'estudio', 'pedido']),
    dni: findColumn(headers, ['dni', 'documento']),
  };

  const cell = (row, i) => (i >= 0 ? String(row[i] ?? '').trim() : '');

  return rows
    .slice(1)
    .filter((row) => row.some((c) => String(c ?? '').trim()))
    .map((row) => ({
      nombre: cell(row, idx.nombre),
      telefono: cell(row, idx.telefono),
      direccion: cell(row, idx.direccion),
      fecha_visita: normalizeDate(cell(row, idx.fecha_visita)) || todayISO(),
      orden_medica: cell(row, idx.orden_medica),
      dni: cell(row, idx.dni),
    }))
    .filter((p) => p.nombre);
}

/** Parser liviano de CSV (separador , o ; autodetectado). No soporta comillas con comas internas. */
function parseCSVText(text) {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  const rows = text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((line) => line.split(delimiter).map((c) => c.trim()));
  return rowsToPacientes(rows);
}

/**
 * Parsea un archivo .csv o .xlsx/.xls y devuelve pacientes.
 * Para xlsx, importa la librería `xlsx` de forma dinámica (no se incluye en el bundle inicial).
 * @param {File} file
 * @returns {Promise<PacienteRaw[]>}
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    return parseCSVText(text);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx'); // carga diferida: no infla el bundle si no se usa
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return rowsToPacientes(rows);
  }

  throw new Error('Formato de archivo no soportado. Usá .csv, .xlsx o .xls.');
}
