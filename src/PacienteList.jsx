/**
 * PacienteList.jsx
 * Pantalla principal: import, búsqueda, filtro por mutual/fecha, vista
 * individual/todos (restaurada de la versión HTML), reordenamiento manual
 * (arrastrar), selección para recorrido en Google Maps, impresión de la
 * planilla completa, panel de "Tareas de hoy", y paginado de 50 por página.
 *
 * Regla de orden: sin búsqueda ni filtro de fecha/mutual, la lista se ordena
 * por posición manual (arrastrable). Con algún filtro activo, se ordena por
 * fecha de visita descendente y el arrastre se desactiva.
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { usePacientes } from './usePacientes';
import ImportPacientes from './ImportPacientes';
import PacienteCard from './PacienteCard';
import PacienteFormModal from './PacienteFormModal';

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
      <td>${p.nombre}</td><td>${p.edad || ''}</td><td>${p.telefono}</td><td>${p.direccion}</td>
      <td>${p.mutual || ''}</td><td>${p.fecha_visita}</td>
      <td>${(p.estudios || []).map((e) => e.n + (e.estado === 'pendiente'? ' (pend.)' : '')).join(', ')}</td>
      <td>${p.dni || ''}</td>
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
          <thead><tr><th>Nombre</th><th>Edad</th><th>Teléfono</th><th>Dirección</th><th>Mutual</th><th>Fecha visita</th><th>Estudios</th><th>DNI</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 150);
}

export default function PacienteList() { // 1. NO recibe props, usa usePacientes
  const { pacientes, addPaciente, addManyPacientes, updatePaciente, deletePaciente, reorderPacientes } =
    usePacientes();

  const [vista, setVista] = useState('individual'); // 'individual' | 'todos'
  const [busqueda, setBusqueda] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [mutualFiltro, setMutualFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(new Set());
  const [draggingId, setDraggingId] = useState(null);
  const [ordenVisual, setOrdenVisual] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [mostrarImportar, setMostrarImportar] = useState(false); // 2. NUEVO: para el modal de importar
  const listaRef = useRef(null);

  const busquedaDebounced = useDebounced(busqueda, 200);
  const sinFiltros =!busquedaDebounced.trim() &&!fechaFiltro &&!mutualFiltro;

  // 3. NUEVO: Función para recibir los pacientes del import
  const handleGuardarImportados = (listaNueva) => {
    addManyPacientes(listaNueva); // Usa tu hook que ya guarda en localStorage/supabase
    setMostrarImportar(false);
  }

  useEffect(() => {
    setPagina(1);
  }, [busquedaDebounced, fechaFiltro, mutualFiltro]);

  const mutuales = useMemo(
    () => [...new Set(pacientes.map((p) => p.mutual).filter(Boolean))],
    [pacientes]
  );

  const filtrados = useMemo(() => {
    const q = busquedaDebounced.trim().toLowerCase();
    let lista = pacientes.filter((p) => {
      const matchQ =!q || p.nombre.toLowerCase().includes(q) || (p.dni || '').includes(q);
      const matchFecha =!fechaFiltro || p.fecha_visita === fechaFiltro;
      const matchMutual =!mutualFiltro || p.mutual === mutualFiltro;
      return matchQ && matchFecha && matchMutual;
    });

    // Si no hay filtros, usa orden manual. Si hay filtros, ordena por fecha
    if (!sinFiltros) {
      lista.sort((a, b) => new Date(b.fecha_visita) - new Date(a.fecha_visita));
    } else if (ordenVisual) {
      lista = ordenVisual;
    }

    return lista;
  }, [pacientes, busquedaDebounced, fechaFiltro, mutualFiltro, sinFiltros, ordenVisual]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  //... ACA VA TODO TU CODIGO DE DRAG, SELECCION, ETC QUE YA TENIAS...

  return (
    <div style={{ padding: '16px' }}>
      {/* 4. NUEVO: BOTÓN DE IMPORTAR */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setMostrarImportar(true)} style={{ background: '#2563eb', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none' }}>
          IMPORTAR DESDE WHATSAPP
        </button>
        <button onClick={() => imprimirPlanilla(filtrados)}>IMPRIMIR PLANILLA</button>
      </div>

      {/* 5. NUEVO: MODAL DE IMPORTAR */}
      {mostrarImportar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <button onClick={() => setMostrarImportar(false)} style={{ float: 'right', border: 'none', background: 'red', color: 'white', borderRadius: '50%', cursor: 'pointer' }}>X</button>
            <ImportPacientes onGuardarPacientes={handleGuardarImportados} />
          </div>
        </div>
      )}

      {/* ACA SIGUE TODO TU RENDER DE BUSQUEDA, FILTROS, LISTA, ETC */}
      {/* Ejemplo: */}
      <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." />

      <div ref={listaRef}>
        {paginados.map(p => (
          <PacienteCard key={p.id} paciente={p} onEdit={() => {setPacienteEditando(p); setModalAbierto(true)}} />
        ))}
      </div>

      {modalAbierto && <PacienteFormModal paciente={pacienteEditando} onClose={() => setModalAbierto(false)} onSave={updatePaciente} />}
    </div>
  );
}
