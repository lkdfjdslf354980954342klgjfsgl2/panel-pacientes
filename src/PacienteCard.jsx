/**
 * PacienteCard.jsx
 * Tarjeta de un paciente: posición (arrastrable), datos clave, editar/eliminar,
 * selección para ruta, e impresión de ficha A4. Memoizada para que reordenar o
 * editar un paciente no vuelva a dibujar el resto de la lista.
 */
import { memo } from 'react';

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
        <div class="fila"><span class="etiqueta">Teléfono</span>${paciente.telefono || '-'}</div>
        <div class="fila"><span class="etiqueta">Dirección</span>${paciente.direccion || '-'}</div>
        <div class="fila"><span class="etiqueta">Fecha de visita</span>${formatFecha(paciente.fecha_visita) || '-'}</div>
        ${paciente.orden_medica ? `<div class="fila"><span class="etiqueta">Orden médica</span>${paciente.orden_medica}</div>` : ''}
        ${paciente.dni ? `<div class="fila"><span class="etiqueta">DNI</span>${paciente.dni}</div>` : ''}
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 150);
}

/**
 * @param {{
 *   paciente: import('./usePacientes').Paciente,
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
  reorderEnabled,
  isSelected,
  isDragging,
  onEdit,
  onDelete,
  onToggleRoute,
  onDragStart,
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-stone-200 shadow-sm p-3 flex gap-3 items-start transition ${
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
            <p className="text-xs text-slate-500 font-mono">{formatFecha(paciente.fecha_visita)}</p>
          </div>
          <div className="flex gap-1 shrink-0">
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

        <div className="text-sm text-slate-600 space-y-0.5 mt-1">
          <p className="truncate">
            <span className="text-rose font-mono text-[11px] uppercase mr-1">Tel</span>
            {paciente.telefono || '—'}
          </p>
          <p className="truncate">
            <span className="text-rose font-mono text-[11px] uppercase mr-1">Dir</span>
            {paciente.direccion || '—'}
          </p>
          {paciente.orden_medica && (
            <p className="truncate">
              <span className="text-teal font-mono text-[11px] uppercase mr-1">Orden</span>
              {paciente.orden_medica}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => imprimirFicha(paciente)}
          className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink text-white active:scale-95 transition"
        >
          Imprimir Ficha A4
        </button>
      </div>
    </div>
  );
}

export default memo(PacienteCard);
