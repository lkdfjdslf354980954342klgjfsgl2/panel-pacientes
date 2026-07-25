/**
 * PacienteCard.jsx
 * Tarjeta de un paciente. Restaura el comportamiento de la versión HTML:
 * - Modo "individual": dirección/teléfono/mutual/estudios quedan ocultos
 *   detrás de un ícono "i" — al tocarlo aparece una tarjeta flotante.
 * - Modo "todos": esos mismos datos se muestran siempre expandidos en la
 *   propia tarjeta (sin necesidad de tocar nada).
 * Memoizada para que reordenar o editar un paciente no vuelva a dibujar
 * el resto de la lista (rendimiento en Android gama media).
 */
import { memo, useState, useRef, useEffect } from 'react';

function formatFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/** Color determinístico y prolijo por número de posición. */
function posColor(n) {
  const hue = (n * 47) % 360;
  return `hsl(${hue}, 68%, 46%)`;
}

function imprimirFicha(paciente) {
  const ventana = window.open('', '_blank', 'width=600,height=800');
  if (!ventana) {
    alert('El navegador bloqueó la ventana de impresión. Permití pop-ups para este sitio.');
    return;
  }
  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Ficha - ${paciente.nombre}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #1C2B39; }
          h1 { font-size: 20px; border-bottom: 2px solid #1C2B39; padding-bottom: 8px; margin-bottom: 18px; }
          .fila { margin: 12px 0; font-size: 14px; }
          .etiqueta { font-weight: bold; text-transform: uppercase; font-size: 11px; color: #B7405E; display: block; letter-spacing: .04em; }
        </style>
      </head>
      <body>
        <h1>Ficha de paciente</h1>
        <div class="fila"><span class="etiqueta">Nombre</span>${paciente.nombre || '-'}</div>
        <div class="fila"><span class="etiqueta">Edad</span>${paciente.edad || '-'}</div>
        <div class="fila"><span class="etiqueta">Teléfono</span>${paciente.telefono || '-'}</div>
        <div class="fila"><span class="etiqueta">Dirección</span>${paciente.direccion || '-'}</div>
        <div class="fila"><span class="etiqueta">Mutual</span>${paciente.mutual || '-'}</div>
        <div class="fila"><span class="etiqueta">Fecha de visita</span>${formatFecha(paciente.fecha_visita) || '-'}</div>
        ${paciente.dni ? `<div class="fila"><span class="etiqueta">DNI</span>${paciente.dni}</div>` : ''}
        ${
          paciente.estudios?.length
            ? `<div class="fila"><span class="etiqueta">Estudios</span>${paciente.estudios
                .map((e) => e.n + (e.estado === 'pendiente' ? ' (pend.)' : ''))
                .join(', ')}</div>`
            : ''
        }
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 150);
}

function EstudioPills({ estudios }) {
  if (!estudios?.length) return <span className="text-slate-400">—</span>;
  return estudios.map((e, i) => (
    <span
      key={i}
      className={`inline-block text-[11px] px-2 py-0.5 rounded-full mr-1 mb-1 ${
        e.estado === 'pendiente' ? 'bg-coral-tint text-coral' : 'bg-teal-tint text-teal'
      }`}
    >
      {e.n}
    </span>
  ));
}

function DetalleContenido({ paciente }) {
  return (
    <div className="mt-2 pt-2 border-t border-dashed border-stone-200 grid grid-cols-2 gap-2 text-sm">
      <div>
        <span className="block text-[10.5px] font-mono uppercase text-rose">Dirección</span>
        {paciente.direccion || '—'}
      </div>
      <div>
        <span className="block text-[10.5px] font-mono uppercase text-rose">Teléfono</span>
        {paciente.telefono || '—'}
      </div>
      <div>
        <span className="block text-[10.5px] font-mono uppercase text-rose">Mutual</span>
        {paciente.mutual || '—'}
      </div>
      <div className="col-span-2">
        <span className="block text-[10.5px] font-mono uppercase text-teal">Estudios</span>
        <EstudioPills estudios={paciente.estudios} />
      </div>
    </div>
  );
}

/**
 * @param {{
 *   paciente: import('./usePacientes').Paciente,
 *   vista: 'individual' | 'todos',
 *   reorderEnabled: boolean,
 *   isSelected: boolean,
 *   isDragging: boolean,
 *   onEdit: (p: import('./usePacientes').Paciente) => void,
 *   onDelete: (id: string) => void,
 *   onToggleRoute: (id: string) => void,
 *   onDragStart: (id: string) => void,
 * }} props
 */
function PacienteCard({
  paciente,
  vista,
  reorderEnabled,
  isSelected,
  isDragging,
  onEdit,
  onDelete,
  onToggleRoute,
  onDragStart,
}) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    function onFuera(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('pointerdown', onFuera);
    return () => document.removeEventListener('pointerdown', onFuera);
  }, [abierto]);

  const abrirFlotante = () => {
    const rect = btnRef.current.getBoundingClientRect();
    let left = rect.left - 230;
    let top = rect.bottom + 6;
    if (left < 8) left = Math.min(rect.right + 8, window.innerWidth - 260);
    if (top + 200 > window.innerHeight) top = window.innerHeight - 210;
    setPos({ top, left });
    setAbierto(true);
  };

  return (
    <div
      ref={cardRef}
      className={`relative bg-white rounded-xl border border-stone-200 shadow-sm p-3 flex gap-3 items-start transition ${
        isDragging ? 'opacity-40 bg-rose-tint' : ''
      }`}
    >
      <button
        type="button"
        onPointerDown={() => reorderEnabled && onDragStart(paciente.id)}
        title={reorderEnabled ? 'Arrastrá para reordenar' : 'Limpiá filtros para reordenar'}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-mono font-bold text-xs shadow ${
          reorderEnabled ? 'cursor-grab active:cursor-grabbing' : 'opacity-40 cursor-not-allowed'
        }`}
        style={{ backgroundColor: posColor(paciente.posicion) }}
      >
        {paciente.posicion}
      </button>

      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleRoute(paciente.id)}
        className="mt-2 shrink-0 accent-teal w-4 h-4"
        title="Incluir en el recorrido"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 text-sm truncate">{paciente.nombre}</h3>
            <p className="text-xs text-slate-500 font-mono">
              {formatFecha(paciente.fecha_visita)}
              {paciente.turno && ` · ${paciente.turno}`}
              {paciente.edad !== '' && paciente.edad != null && ` · ${paciente.edad} años`}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            {vista === 'individual' && (
              <button
                ref={btnRef}
                type="button"
                onClick={abrirFlotante}
                aria-label="Ver datos"
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
                  abierto ? 'bg-rose border-rose text-white' : 'border-stone-200 text-slate-500 hover:border-rose hover:text-rose'
                }`}
              >
                ⓘ
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(paciente)}
              aria-label="Editar paciente"
              className="w-8 h-8 rounded-lg border border-stone-200 text-slate-500 hover:border-rose hover:text-rose flex items-center justify-center transition"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => onDelete(paciente.id)}
              aria-label="Eliminar paciente"
              className="w-8 h-8 rounded-lg border border-stone-200 text-slate-500 hover:border-rose hover:text-rose flex items-center justify-center transition"
            >
              🗑
            </button>
          </div>
        </div>

        {paciente.mutual && (
          <span className="inline-block mt-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-tint text-teal">
            {paciente.mutual}
          </span>
        )}

        {vista === 'todos' && <DetalleContenido paciente={paciente} />}

        <button
          type="button"
          onClick={() => imprimirFicha(paciente)}
          className="mt-2 block text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink text-white active:scale-95 transition"
        >
          Imprimir Ficha A4
        </button>
      </div>

      {vista === 'individual' && abierto && (
        <div
          className="fixed w-64 bg-white border border-stone-200 rounded-xl shadow-lg p-4 z-[250] text-sm"
          style={{ top: pos.top, left: pos.left }}
        >
          <h4 className="font-bold text-sm mb-2">{paciente.nombre}</h4>
          <p className="mb-1">
            <span className="block text-[10.5px] font-mono uppercase text-rose">Dirección</span>
            {paciente.direccion || '—'}
          </p>
          <p className="mb-1">
            <span className="block text-[10.5px] font-mono uppercase text-rose">Teléfono</span>
            {paciente.telefono || '—'}
          </p>
          <p className="mb-1">
            <span className="block text-[10.5px] font-mono uppercase text-rose">Mutual</span>
            {paciente.mutual || '—'}
          </p>
          <div className="mt-2 pt-2 border-t border-dashed border-stone-200">
            <span className="block text-[10.5px] font-mono uppercase text-teal mb-1">Estudios</span>
            <EstudioPills estudios={paciente.estudios} />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PacienteCard);
