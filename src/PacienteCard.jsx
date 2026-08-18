/**
 * PacienteCard.jsx
 * Tarjeta de paciente con dos modos:
 * - individual: datos ocultos tras botón "i" (flotante)
 * - todos: todos los datos expandidos en la tarjeta
 */
import { memo, useState, useRef, useEffect } from 'react';

/**
 * Formatea fecha ISO a dd/mm/yyyy
 */
function formatFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/**
 * Color determinístico según posición
 */
function posColor(n) {
  if (!n) return '#999';
  const hue = (n * 47) % 360;
  return `hsl(${hue}, 68%, 46%)`;
}

/**
 * Abre ficha del paciente en nueva ventana para imprimir
 */
function imprimirFicha(paciente) {
  const ventana = window.open('', '_blank', 'width=600,height=800');
  if (!ventana) {
    alert('El navegador bloqueó la ventana. Habilitá pop-ups para este sitio.');
    return;
  }

  const estudiosHTML =
    paciente.estudios && paciente.estudios.length
      ? `<div class="fila"><span class="etiqueta">Estudios</span>${paciente.estudios
          .map((e) => e.n + (e.estado === 'pendiente' ? ' (pend.)' : ''))
          .join(', ')}</div>`
      : '';

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
        ${estudiosHTML}
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 150);
}

/**
 * Pills de estudios/órdenes
 */
function EstudioPills({ estudios }) {
  if (!estudios || estudios.length === 0) {
    return <span style={{ color: '#999' }}>—</span>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {estudios.map((e, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '12px',
            background: e.estado === 'pendiente' ? '#FBEAE2' : '#E6EFEC',
            color: e.estado === 'pendiente' ? '#D9714B' : '#4C7A72',
            fontWeight: '500',
          }}
        >
          {e.n}
        </span>
      ))}
    </div>
  );
}

/**
 * Contenido expandido (vista "todos")
 */
function DetalleContenido({ paciente }) {
  return (
    <div
      style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px dashed #ddd',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        fontSize: '13px',
      }}
    >
      <div>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#B7405E', marginBottom: '4px' }}>
          DIRECCIÓN
        </div>
        {paciente.direccion || '—'}
      </div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#B7405E', marginBottom: '4px' }}>
          TELÉFONO
        </div>
        {paciente.telefono || '—'}
      </div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#B7405E', marginBottom: '4px' }}>
          MUTUAL
        </div>
        {paciente.mutual || '—'}
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#4C7A72', marginBottom: '4px' }}>
          ESTUDIOS
        </div>
        <EstudioPills estudios={paciente.estudios} />
      </div>
    </div>
  );
}

/**
 * Botón de información flotante
 */
function BtnInfo({ paciente, abierto, btnRef, onAbrir, pos, cardRef }) {
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={onAbrir}
        aria-label="Ver datos"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: abierto ? '2px solid #B7405E' : '1px solid #ddd',
          background: abierto ? '#F4E3E8' : 'white',
          color: abierto ? '#B7405E' : '#999',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          transition: 'all 0.2s',
        }}
      >
        ⓘ
      </button>

      {abierto && (
        <div
          style={{
            position: 'fixed',
            width: '260px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '12px',
            zIndex: 250,
            top: pos.top,
            left: pos.left,
            fontSize: '13px',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
            {paciente.nombre}
          </h4>
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#B7405E' }}>DIRECCIÓN</div>
            {paciente.direccion || '—'}
          </div>
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#B7405E' }}>TELÉFONO</div>
            {paciente.telefono || '—'}
          </div>
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#B7405E' }}>MUTUAL</div>
            {paciente.mutual || '—'}
          </div>
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ddd' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#4C7A72', marginBottom: '4px' }}>
              ESTUDIOS
            </div>
            <EstudioPills estudios={paciente.estudios} />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Componente PacienteCard - memoizado para optimizar renders
 */
function PacienteCard({
  paciente,
  vista = 'individual',
  reorderEnabled = false,
  isSelected = false,
  isDragging = false,
  onEdit = () => {},
  onDelete = () => {},
  onToggleRoute = () => {},
  onDragStart = () => {},
}) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const cardRef = useRef(null);

  // Cierra el flotante cuando se hace click afuera
  useEffect(() => {
    if (!abierto) return;

    function handleClickAfuera(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }

    document.addEventListener('pointerdown', handleClickAfuera);
    return () => document.removeEventListener('pointerdown', handleClickAfuera);
  }, [abierto]);

  const abrirFlotante = () => {
    if (!btnRef.current) return;

    const rect = btnRef.current.getBoundingClientRect();
    let left = rect.left - 260;
    let top = rect.bottom + 8;

    // Ajusta posición si se sale de pantalla
    if (left < 8) left = Math.min(rect.right + 8, window.innerWidth - 268);
    if (top + 200 > window.innerHeight) top = window.innerHeight - 210;

    setPos({ top, left });
    setAbierto(true);
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #ddd',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '12px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        transition: 'all 0.2s',
        opacity: isDragging ? 0.4 : 1,
        background: isDragging ? '#F4E3E8' : 'white',
      }}
    >
      {/* Botón de reordenamiento */}
      <button
        type="button"
        onPointerDown={() => reorderEnabled && onDragStart(paciente.id)}
        title={reorderEnabled ? 'Arrastrá para reordenar' : 'Limpiá filtros para reordenar'}
        style={{
          flexShrink: 0,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: 'none',
          background: posColor(paciente.posicion),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px',
          cursor: reorderEnabled ? 'grab' : 'not-allowed',
          opacity: reorderEnabled ? 1 : 0.5,
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {paciente.posicion}
      </button>

      {/* Checkbox de ruta */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleRoute(paciente.id)}
        title="Incluir en el recorrido"
        style={{
          marginTop: '6px',
          width: '16px',
          height: '16px',
          cursor: 'pointer',
          accentColor: '#4C7A72',
        }}
      />

      {/* Contenido principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: '0 0 4px 0',
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#1C2B39',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {paciente.nombre}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
              {formatFecha(paciente.fecha_visita)}
              {paciente.turno && ` · ${paciente.turno}`}
              {paciente.edad && paciente.edad !== '' ? ` · ${paciente.edad} años` : ''}
            </p>
          </div>

          {/* Botones de acciones */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {vista === 'individual' && (
              <BtnInfo
                paciente={paciente}
                abierto={abierto}
                btnRef={btnRef}
                onAbrir={abrirFlotante}
                pos={pos}
                cardRef={cardRef}
              />
            )}

            <button
              type="button"
              onClick={() => onEdit(paciente)}
              title="Editar"
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s',
                color: '#999',
              }}
            >
              ✎
            </button>

            <button
              type="button"
              onClick={() => onDelete(paciente.id)}
              title="Eliminar"
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s',
                color: '#999',
              }}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Mutual */}
        {paciente.mutual && (
          <div
            style={{
              marginTop: '8px',
              display: 'inline-block',
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '4px 8px',
              borderRadius: '6px',
              background: '#E6EFEC',
              color: '#4C7A72',
            }}
          >
            {paciente.mutual}
          </div>
        )}

        {/* Detalles en vista "todos" */}
        {vista === 'todos' && <DetalleContenido paciente={paciente} />}

        {/* Botón imprimir */}
        <button
          type="button"
          onClick={() => imprimirFicha(paciente)}
          style={{
            marginTop: '10px',
            display: 'block',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '8px 12px',
            borderRadius: '8px',
            background: '#1C2B39',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🖨️ Imprimir Ficha A4
        </button>
      </div>
    </div>
  );
}

export default memo(PacienteCard);