/**
 * PacienteList.jsx
 * Pantalla principal: conecta import, búsqueda, filtro por mutual/fecha,
 * reordenamiento manual (arrastrar), selección para recorrido en Google Maps,
 * impresión de la planilla completa, y paginado de 50 por página.
 *
 * Regla de orden: sin búsqueda ni filtro de fecha, la lista se ordena por
 * posición manual (arrastrable). Con algún filtro activo, se ordena por
 * fecha de visita descendente y el arrastre se desactiva (evita reordenar
 * sobre una lista parcial).
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { usePacientes } from './usePacientes';
import ImportPacientes from './ImportPacientes';
import PacienteCard from './PacienteCard';

const POR_PAGINA = 50;

function useDebounced(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function imprimirPlanilla(lista) {
  const ventana = window.open('', '_blank');
  if (!ventana) {
    alert('El navegador bloqueó la ventana de impresión. Permití pop-ups para este sitio.');
    return;
  }
  const filas = lista
    .map(
      (p) => `
    <tr>
      <td>${p.nombre}</td><td>${p.telefono}</td><td>${p.direccion}</td>
      <td>${p.fecha_visita}</td><td>${p.orden_medica || ''}</td><td>${p.dni || ''}</td>
    </tr>`
    )
    .join('');
  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Planilla de pacientes</title>
        <style>
          @page { size: A4 landscape; margin: 14mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #1C2B39; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
          th { background: #eee; }
        </style>
      </head>
      <body>
        <h1>Planilla de pacientes — ${new Date().toLocaleDateString('es-AR')}</h1>
        <table>
          <thead><tr><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Fecha visita</th><th>Orden médica</th><th>DNI</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 150);
}

export default function PacienteList() {
  const { pacientes, addManyPacientes, updatePaciente, deletePaciente, reorderPacientes } = usePacientes();

  const [busqueda, setBusqueda] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(new Set());
  const [draggingId, setDraggingId] = useState(null);
  const [ordenVisual, setOrdenVisual] = useState(null); // array de ids mientras se arrastra
  const listaRef = useRef(null);

  const busquedaDebounced = useDebounced(busqueda, 200);
  const sinFiltros = !busquedaDebounced.trim() && !fechaFiltro;

  useEffect(() => {
    setPagina(1);
  }, [busquedaDebounced, fechaFiltro]);

  const filtrados = useMemo(() => {
    const q = busquedaDebounced.trim().toLowerCase();
    let lista = pacientes.filter((p) => {
      const matchQ = !q || p.nombre.toLowerCase().includes(q) || (p.dni || '').includes(q);
      const matchFecha = !fechaFiltro || p.fecha_visita === fechaFiltro;
      return matchQ && matchFecha;
    });
    if (sinFiltros) {
      const orden = ordenVisual || lista.map((p) => p.id);
      const porId = new Map(lista.map((p) => [p.id, p]));
      lista = orden.map((id) => porId.get(id)).filter(Boolean);
    } else {
      lista = lista.slice().sort((a, b) => (a.fecha_visita < b.fecha_visita ? 1 : -1));
    }
    return lista;
  }, [pacientes, busquedaDebounced, fechaFiltro, sinFiltros, ordenVisual]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pageItems = useMemo(() => {
    const start = (pagina - 1) * POR_PAGINA;
    return filtrados.slice(start, start + POR_PAGINA);
  }, [filtrados, pagina]);

  const handleEdit = useCallback(
    (paciente) => {
      const nombre = prompt('Nombre', paciente.nombre);
      if (nombre === null) return;
      const telefono = prompt('Teléfono', paciente.telefono) ?? paciente.telefono;
      const direccion = prompt('Dirección', paciente.direccion) ?? paciente.direccion;
      updatePaciente(paciente.id, { nombre, telefono, direccion });
    },
    [updatePaciente]
  );

  const handleDelete = useCallback(
    (id) => {
      if (confirm('¿Eliminar este paciente?')) {
        deletePaciente(id);
        setRutaSeleccionada((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [deletePaciente]
  );

  const toggleRuta = useCallback((id) => {
    setRutaSeleccionada((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const abrirRecorrido = useCallback(() => {
    const direcciones = pacientes.filter((p) => rutaSeleccionada.has(p.id)).map((p) => p.direccion);
    if (!direcciones.length) return;
    const destino = encodeURIComponent(direcciones[direcciones.length - 1]);
    const origen = direcciones.length > 1 ? encodeURIComponent(direcciones[0]) : '';
    const paradas = direcciones.length > 2 ? direcciones.slice(1, -1).map(encodeURIComponent).join('|') : '';
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`;
    if (origen) url += `&origin=${origen}`;
    if (paradas) url += `&waypoints=${paradas}`;
    window.open(url, '_blank');
  }, [pacientes, rutaSeleccionada]);

  // --- arrastrar para reordenar (pointer events, funciona con mouse y dedo) ---
  const handleDragStart = useCallback(
    (id) => {
      if (!sinFiltros) return;
      setDraggingId(id);
      setOrdenVisual(pageItems.map((p) => p.id));
    },
    [sinFiltros, pageItems]
  );

  useEffect(() => {
    if (!draggingId) return;

    function onMove(e) {
      const container = listaRef.current;
      if (!container) return;
      const cards = [...container.querySelectorAll('[data-card-id]')];
      const y = e.clientY;
      setOrdenVisual((prev) => {
        if (!prev) return prev;
        const order = [...prev];
        const fromIdx = order.indexOf(draggingId);
        for (const card of cards) {
          const id = card.dataset.cardId;
          if (id === draggingId) continue;
          const rect = card.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          const toIdx = order.indexOf(id);
          if (y < mid && toIdx < fromIdx) {
            order.splice(fromIdx, 1);
            order.splice(toIdx, 0, draggingId);
            return order;
          }
          if (y >= mid && toIdx > fromIdx) {
            order.splice(fromIdx, 1);
            order.splice(toIdx, 0, draggingId);
            return order;
          }
        }
        return order;
      });
    }

    function onUp() {
      setOrdenVisual((prev) => {
        if (prev) reorderPacientes(prev);
        return null;
      });
      setDraggingId(null);
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp, { once: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [draggingId, reorderPacientes]);

  return (
    <div className="min-h-screen bg-paper p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <header className="space-y-1">
        <p className="text-[11px] font-mono uppercase tracking-widest text-rose">
          Laboratorio · Gestión de pacientes
        </p>
        <h1 className="text-lg font-bold text-ink">Panel de Pacientes</h1>
      </header>

      <ImportPacientes onImport={addManyPacientes} />

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o DNI..."
          className="flex-1 min-w-[140px] text-sm border border-stone-200 rounded-lg px-3 py-2"
        />
        <input
          type="date"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-2"
        />
        <button
          type="button"
          onClick={() => imprimirPlanilla(filtrados)}
          className="px-3 py-2 rounded-lg border border-stone-200 text-sm font-semibold hover:border-rose hover:text-rose transition"
        >
          Imprimir planilla
        </button>
      </div>

      <p className="text-xs text-slate-500 font-mono">
        {filtrados.length} paciente(s) · página {pagina} de {totalPaginas}
        {!sinFiltros && ' · orden por fecha (limpiá los filtros para reordenar manualmente)'}
      </p>

      <div ref={listaRef} className="space-y-3">
        {pageItems.map((p) => (
          <div key={p.id} data-card-id={p.id}>
            <PacienteCard
              paciente={p}
              reorderEnabled={sinFiltros}
              isSelected={rutaSeleccionada.has(p.id)}
              isDragging={draggingId === p.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleRoute={toggleRuta}
              onDragStart={handleDragStart}
            />
          </div>
        ))}
        {pageItems.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Sin pacientes para mostrar.</p>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}

      {rutaSeleccionada.size > 0 && (
        <div className="fixed left-1/2 bottom-5 -translate-x-1/2 bg-ink text-white rounded-full shadow-lg px-4 py-3 flex items-center gap-3 text-sm z-50">
          <span>
            <b className="font-mono text-rose-tint">{rutaSeleccionada.size}</b> domicilios seleccionados
          </span>
          <button
            type="button"
            onClick={abrirRecorrido}
            className="bg-rose px-3 py-1.5 rounded-full font-semibold"
          >
            Abrir en Google Maps
          </button>
          <button
            type="button"
            onClick={() => setRutaSeleccionada(new Set())}
            className="opacity-70 text-xs"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
  }
        
