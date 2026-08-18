/**
 * PacienteFormModal.jsx
 * Modal de alta/edición de pacientes con validación
 * Incluye: nombre, edad, DNI, turno, mutual, dirección, teléfono,
 * fecha de visita, y gestor de estudios/órdenes
 */
import { useState, useEffect } from 'react';

const vacio = {
  nombre: '',
  edad: '',
  turno: '',
  mutual: '',
  dni: '',
  direccion: '',
  telefono: '',
  fecha_visita: '',
  estudios: [],
};

/**
 * Componente de campo de formulario
 */
function Campo({ label, required, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: '#B7405E',
          display: 'block',
          marginBottom: '6px',
          letterSpacing: '0.05em',
        }}
      >
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function PacienteFormModal({ paciente, onSave, onClose }) {
  const [form, setForm] = useState(vacio);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (paciente) {
      setForm({
        nombre: paciente.nombre || '',
        edad: paciente.edad ?? '',
        turno: paciente.turno || '',
        mutual: paciente.mutual || '',
        dni: paciente.dni || '',
        direccion: paciente.direccion || '',
        telefono: paciente.telefono || '',
        fecha_visita: paciente.fecha_visita || '',
        estudios: paciente.estudios && Array.isArray(paciente.estudios) ? paciente.estudios : [],
      });
    } else {
      setForm(vacio);
    }
    setErrores({});
  }, [paciente]);

  const setCampo = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    // Limpia error del campo al editar
    if (errores[campo]) {
      setErrores((prev) => {
        const nuevo = { ...prev };
        delete nuevo[campo];
        return nuevo;
      });
    }
  };

  const addEstudio = () =>
    setForm((f) => ({ ...f, estudios: [...f.estudios, { n: '', estado: 'pendiente' }] }));

  const rmEstudio = (i) =>
    setForm((f) => ({ ...f, estudios: f.estudios.filter((_, idx) => idx !== i) }));

  const setEstudio = (i, campo, valor) =>
    setForm((f) => ({
      ...f,
      estudios: f.estudios.map((e, idx) => (idx === i ? { ...e, [campo]: valor } : e)),
    }));

  const validar = () => {
    const nuevosErrores = {};

    if (!form.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!form.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es obligatoria';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = () => {
    if (!validar()) return;

    onSave({
      ...form,
      edad: form.edad ? Number(form.edad) : '',
      estudios: form.estudios.filter((e) => e.n.trim()),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleGuardar();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 57, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1C2B39', marginBottom: '20px' }}>
          {paciente ? '✏️ Editar paciente' : '➕ Nuevo paciente'}
        </h3>

        {/* Nombre */}
        <Campo label="Nombre completo" required>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setCampo('nombre', e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: errores.nombre ? '2px solid #ef4444' : '1px solid #E3DDCF',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
          {errores.nombre && (
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
              {errores.nombre}
            </div>
          )}
        </Campo>

        {/* Edad y DNI */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <Campo label="Edad">
            <input
              type="number"
              value={form.edad}
              onChange={(e) => setCampo('edad', e.target.value)}
              min="0"
              max="150"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E3DDCF',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </Campo>
          <Campo label="DNI">
            <input
              type="text"
              value={form.dni}
              onChange={(e) => setCampo('dni', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E3DDCF',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </Campo>
        </div>

        {/* Turno y Mutual */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <Campo label="Turno">
            <input
              type="time"
              value={form.turno}
              onChange={(e) => setCampo('turno', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E3DDCF',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </Campo>
          <Campo label="Mutual">
            <input
              type="text"
              placeholder="OSDE / PAMI..."
              value={form.mutual}
              onChange={(e) => setCampo('mutual', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E3DDCF',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </Campo>
        </div>

        {/* Dirección */}
        <Campo label="Dirección" required>
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => setCampo('direccion', e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: errores.direccion ? '2px solid #ef4444' : '1px solid #E3DDCF',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
          {errores.direccion && (
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
              {errores.direccion}
            </div>
          )}
        </Campo>

        {/* Teléfono */}
        <Campo label="Teléfono">
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setCampo('telefono', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #E3DDCF',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </Campo>

        {/* Fecha de visita */}
        <Campo label="Fecha de visita">
          <input
            type="date"
            value={form.fecha_visita}
            onChange={(e) => setCampo('fecha_visita', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #E3DDCF',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </Campo>

        {/* Estudios / órdenes */}
        <div
          style={{
            borderTop: '2px dashed #E3DDCF',
            marginTop: '20px',
            paddingTop: '16px',
          }}
        >
          <label
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#4C7A72',
              display: 'block',
              marginBottom: '12px',
              letterSpacing: '0.05em',
            }}
          >
            Estudios / órdenes
          </label>

          {form.estudios.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
              <input
                type="text"
                placeholder="Nombre del estudio"
                value={e.n}
                onChange={(ev) => setEstudio(i, 'n', ev.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E3DDCF',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                }}
              />
              <select
                value={e.estado}
                onChange={(ev) => setEstudio(i, 'estado', ev.target.value)}
                style={{
                  width: '100px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E3DDCF',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                }}
              >
                <option value="listo">✓ Listo</option>
                <option value="pendiente">⏳ Pendiente</option>
              </select>
              <button
                type="button"
                onClick={() => rmEstudio(i)}
                style={{
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#999',
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addEstudio}
            style={{
              marginTop: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #E3DDCF',
              background: 'white',
              cursor: 'pointer',
              color: '#4C7A72',
            }}
          >
            + Agregar estudio
          </button>
        </div>

        {/* Botones de acciones */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #E3DDCF',
              background: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#1C2B39',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}