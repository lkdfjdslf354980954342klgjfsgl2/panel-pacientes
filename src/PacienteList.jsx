/**
 * PacienteList.jsx
 * Pantalla principal: gestión completa de pacientes
 * - Importación desde WhatsApp/archivos
 * - Búsqueda y filtros (fecha, mutual)
 * - Vista individual/expandida
 * - Reordenamiento manual (arrastrar)
 * - Selección para recorrido en Google Maps
 * - Impresión de planilla
 * - Paginación
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { usePacientes } from './usePacientes';
import ImportPacientes from './ImportPacientes';
import PacienteCard from './PacienteCard';
import PacienteFormModal from './PacienteFormModal';

const POR_PAGINA = 50;

/**
 * Hook para debounce de búsqueda
 */
function useDebounced(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Abre una nueva ventana para imprimir la planilla completa
 */
function imprimirPlanilla(lista) {
  const ventana = window.open('', '_blank');
  if (!ventana) {
    alert('El navegador bloqueó la ventana de impresión. Habilitá pop-ups para este sitio.');
    return;
  }

  const filas = lista
    .map(
      (p) => `
    <tr>
      <td>${p.nombre}</td><td>${p.edad || ''}</td><td>${p.telefono}</td><td>${p.direccion}</td>
      <td>${p.mutual || ''}</td><td>${p.fecha_visita}</td>
      <td>${(p.estudios || []).map((e) => e.n + (e.estado === 'pendiente' ? ' (pend.)' : '')).join(', ')}</td>
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
      </body>\n    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 150);
}

export default function PacienteList() {
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
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const listaRef = useRef(null);

  const busquedaDebounced = useDebounced(busqueda, 200);
  const sinFiltros = !busquedaDebounced.trim() && !fechaFiltro && !mutualFiltro;

  /**
   * Callback para guardar pacientes importados
   */
  const handleGuardarImportados = useCallback((listaNueva) => {
    addManyPacientes(listaNueva);
    setMostrarImportar(false);
  }, [addManyPacientes]);

  /**
   * Reset de paginación cuando cambian filtros
   */
  useEffect(() => {
    setPagina(1);
  }, [busquedaDebounced, fechaFiltro, mutualFiltro]);

  /**
   * Extrae lista única de mutuales
   */
  const mutuales = useMemo(
    () => [...new Set(pacientes.map((p) => p.mutual).filter(Boolean))],
    [pacientes]
  );

  /**
   * Filtra y ordena pacientes
   */
  const filtrados = useMemo(() => {
    const q = busquedaDebounced.trim().toLowerCase();
    let lista = pacientes.filter((p) => {
      const matchQ = !q || p.nombre.toLowerCase().includes(q) || (p.dni || '').includes(q);
      const matchFecha = !fechaFiltro || p.fecha_visita === fechaFiltro;
      const matchMutual = !mutualFiltro || p.mutual === mutualFiltro;
      return matchQ && matchFecha && matchMutual;
    });

    // Si no hay filtros, usa orden manual (draggable). Si hay filtros, ordena por fecha descendente
    if (!sinFiltros) {
      lista.sort((a, b) => new Date(b.fecha_visita) - new Date(a.fecha_visita));
    } else if (ordenVisual) {
      lista = ordenVisual;
    } else {
      lista.sort((a, b) => (a.posicion || 0) - (b.posicion || 0));
    }

    return lista;
  }, [pacientes, busquedaDebounced, fechaFiltro, mutualFiltro, sinFiltros, ordenVisual]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  /**
   * Drag & Drop: inicia arrastre
   */
  const handleDragStart = useCallback((id) => {
    setDraggingId(id);
  }, []);

  /**
   * Drag & Drop: permite drop
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  /**
   * Drag & Drop: completa la reordenación
   */
  const handleDrop = useCallback(
    (targetId) => {
      if (draggingId === targetId || !sinFiltros || !draggingId) return;

      const nuevaLista = [...filtrados];
      const dragIdx = nuevaLista.findIndex((p) => p.id === draggingId);
      const dropIdx = nuevaLista.findIndex((p) => p.id === targetId);

      if (dragIdx === -1 || dropIdx === -1) return;

      // Intercambia posiciones
      [nuevaLista[dragIdx], nuevaLista[dropIdx]] = [nuevaLista[dropIdx], nuevaLista[dragIdx]];
      setOrdenVisual(nuevaLista);
      reorderPacientes(nuevaLista.map((p) => p.id));
      setDraggingId(null);
    },
    [draggingId, sinFiltros, filtrados, reorderPacientes]
  );

  /**
   * Selección/deselección de paciente para recorrido
   */
  const toggleRuta = useCallback((id) => {
    setRutaSeleccionada((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  }, []);

  /**
   * Abre Google Maps con las direcciones seleccionadas
   */
  const abrirRecorrido = useCallback(() => {
    if (rutaSeleccionada.size === 0) {
      alert('Selecciona al menos un paciente');
      return;
    }
    const direcciones = paginados
      .filter((p) => rutaSeleccionada.has(p.id))
      .map((p) => p.direccion)
      .filter(Boolean)
      .join(' | ');

    if (!direcciones) {
      alert('Los pacientes seleccionados no tienen dirección');
      return;
    }

    window.open(`https://www.google.com/maps/dir/${encodeURIComponent(direcciones)}`, '_blank');
  }, [rutaSeleccionada, paginados]);

  /**
   * Abre modal de edición
   */
  const handleEditar = useCallback((p) => {
    setPacienteEditando(p);
    setModalAbierto(true);
  }, []);

  /**
   * Guarda cambios de edición
   */
  const handleGuardarEdicion = useCallback(
    (cambios) => {
      if (pacienteEditando) {
        updatePaciente(pacienteEditando.id, cambios);
        setModalAbierto(false);
        setPacienteEditando(null);
      }
    },
    [pacienteEditando, updatePaciente]
  );

  /**
   * Elimina un paciente
   */
  const handleEliminar = useCallback(
    (id) => {
      if (window.confirm('¿Eliminar este paciente?')) {
        deletePaciente(id);
      }
    },
    [deletePaciente]
  );

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1C2B39' }}>
          📋 Gestor de Pacientes
        </h1>
        <p style={{ margin: '0', fontSize: '13px', color: '#999' }}>
          {filtrados.length} pacientes
          {busquedaDebounced && ` · Búsqueda: "${busquedaDebounced}"`}
          {fechaFiltro && ` · Fecha: ${fechaFiltro}`}
          {mutualFiltro && ` · Mutual: ${mutualFiltro}`}
        </p>
      </div>

      {/* Botones principales */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setMostrarImportar(true)}
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          📥 IMPORTAR
        </button>

        <button
          onClick={() => imprimirPlanilla(filtrados)}
          disabled={filtrados.length === 0}
          style={{
            background: filtrados.length > 0 ? '#1C2B39' : '#ccc',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: filtrados.length > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          🖨️ IMPRIMIR
        </button>

        <button
          onClick={abrirRecorrido}
          disabled={rutaSeleccionada.size === 0}
          style={{
            background: rutaSeleccionada.size > 0 ? '#D9714B' : '#ccc',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: rutaSeleccionada.size > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          🗺️ RECORRIDO ({rutaSeleccionada.size})
        </button>
      </div>

      {/* Modal de importar */}
      {mostrarImportar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <button
              onClick={() => setMostrarImportar(false)}
              style={{
                float: 'right',
                border: 'none',
                background: '#999',
                color: 'white',
                borderRadius: '50%',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                fontSize: '18px',
              }}
            >
              ✕
            </button>
            <ImportPacientes onGuardarPacientes={handleGuardarImportados} />
          </div>
        </div>
      )}

      {/* Controles de búsqueda y filtro */}
      <div
        style={{
          marginBottom: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
        }}
      >
        <div>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
            Buscar
          </label>
          <input
            type="text"
            placeholder="Nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
            Fecha
          </label>
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
            Mutual
          </label>
          <select
            value={mutualFiltro}
            onChange={(e) => setMutualFiltro(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <option value="">Todas</option>
            {mutuales.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
            Vista
          </label>
          <select
            value={vista}
            onChange={(e) => setVista(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <option value="individual">Individual</option>
            <option value="todos">Expandida</option>
          </select>
        </div>
      </div>

      {/* Botón limpiar filtros */}
      {!sinFiltros && (
        <button
          onClick={() => {
            setBusqueda('');
            setFechaFiltro('');
            setMutualFiltro('');
          }}
          style={{
            marginBottom: '16px',
            padding: '8px 12px',
            background: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Limpiar filtros
        </button>
      )}

      {/* Info de paginación */}
      {filtrados.length > 0 && (
        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
          Mostrando{' '}
          {paginados.length > 0 ? (pagina - 1) * POR_PAGINA + 1 : 0} a{' '}
          {Math.min(pagina * POR_PAGINA, filtrados.length)} de {filtrados.length} pacientes
        </div>
      )}

      {/* Lista de pacientes */}
      <div
        ref={listaRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {paginados.length > 0 ? (
          paginados.map((p) => (
            <div
              key={p.id}
              draggable={sinFiltros}
              onDragStart={() => handleDragStart(p.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(p.id)}
              style={{ cursor: sinFiltros ? 'grab' : 'default' }}
            >
              <PacienteCard
                paciente={p}
                vista={vista}
                reorderEnabled={sinFiltros}
                isSelected={rutaSeleccionada.has(p.id)}
                isDragging={draggingId === p.id}
                onEdit={handleEditar}
                onDelete={handleEliminar}
                onToggleRoute={toggleRuta}
                onDragStart={handleDragStart}
              />
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999',
              background: '#f9f9f9',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {filtrados.length === 0 && pacientes.length > 0
              ? 'No hay pacientes que coincidan con los filtros'
              : 'No hay pacientes. ¡Importá algunos!'}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPagina(p)}
              style={{
                padding: '8px 12px',
                background: pagina === p ? '#2563eb' : '#f0f0f0',
                color: pagina === p ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: pagina === p ? 'bold' : 'normal',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {modalAbierto && (
        <PacienteFormModal
          paciente={pacienteEditando}
          onClose={() => {
            setModalAbierto(false);
            setPacienteEditando(null);
          }}
          onSave={handleGuardarEdicion}
        />
      )}
    </div>
  );
}