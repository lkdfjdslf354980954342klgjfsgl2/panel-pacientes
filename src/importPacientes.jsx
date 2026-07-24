/**
 * ImportPacientes.jsx
 * Componente de importación: textarea para pegar texto de WhatsApp,
 * o input de archivo .csv/.xlsx. No bloquea el hilo principal: el parseo
 * de archivos ocurre de forma asíncrona y muestra estado de carga.
 */
import { useState, useCallback } from 'react';
import { parsePacientes, parseFile } from './parser';

/**
 * @param {{ onImport: (pacientes: import('./parser').PacienteRaw[]) => void }} props
 */
export default function ImportPacientes({ onImport }) {
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resumen, setResumen] = useState(null);

  const handleImportarTexto = useCallback(() => {
    const detectados = parsePacientes(texto);
    if (detectados.length) {
      onImport(detectados);
      setResumen(`${detectados.length} paciente(s) importado(s) desde el texto.`);
      setTexto('');
    } else {
      setResumen('No se detectaron pacientes en el texto pegado. Revisá el formato.');
    }
  }, [texto, onImport]);

  const handleArchivo = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setCargando(true);
      setResumen(null);
      try {
        const detectados = await parseFile(file);
        if (detectados.length) {
          onImport(detectados);
          setResumen(`${detectados.length} paciente(s) importado(s) desde "${file.name}".`);
        } else {
          setResumen('El archivo no tiene filas reconocibles (revisá los encabezados de columna).');
        }
      } catch (err) {
        console.error(err);
        setResumen(err.message || 'No se pudo leer el archivo.');
      } finally {
        setCargando(false);
        e.target.value = ''; // permite volver a subir el mismo archivo si hace falta
      }
    },
    [onImport]
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
      <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide font-mono">
        Importar pacientes
      </h2>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={
          'Pegá acá el texto copiado de WhatsApp, por ejemplo:\n\n1) Gregorio López\nTeléfono: 2966227890\nDirección: Los Alelos y 50\nFecha Visita: 22/07/2026'
        }
        rows={5}
        className="w-full text-sm border border-stone-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={handleImportarTexto}
          disabled={!texto.trim()}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold disabled:opacity-40 active:scale-95 transition"
        >
          Importar desde texto
        </button>

        <label
          className={`px-4 py-2 rounded-lg border border-stone-200 text-sm font-semibold cursor-pointer hover:border-rose-400 transition ${
            cargando ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {cargando ? 'Leyendo archivo…' : 'Subir CSV / Excel'}
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleArchivo}
            disabled={cargando}
          />
        </label>
      </div>

      {resumen && <p className="text-xs text-slate-500">{resumen}</p>}
    </div>
  );
}
