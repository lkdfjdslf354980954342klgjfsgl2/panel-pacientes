/**
 * PacienteFormModal.jsx
 * Modal de alta/edición con todos los campos (edad, turno, mutual, dirección,
 * teléfono, DNI, fecha de visita) y un editor de estudios/órdenes — restaura
 * el formulario completo que tenía la versión HTML, en vez del prompt() básico.
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

export default function PacienteFormModal({ paciente, onSave, onClose }) {
  const [form, setForm] = useState(vacio);

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
        estudios: paciente.estudios?.length ? paciente.estudios : [],
      });
    } else {
      setForm(vacio);
    }
  }, [paciente]);

  const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const addEstudio = () => setForm((f) => ({ ...f, estudios: [...f.estudios, { n: '', estado: 'pendiente' }] }));
  const rmEstudio = (i) => setForm((f) => ({ ...f, estudios: f.estudios.filter((_, idx) => idx !== i) }));
  const setEstudio = (i, campo, valor) =>
    setForm((f) => ({
      ...f,
      estudios: f.estudios.map((e, idx) => (idx === i ? { ...e, [campo]: valor } : e)),
    }));

  const handleGuardar = () => {
    if (!form.nombre.trim() || !form.direccion.trim()) {
      alert('Nombre y dirección son obligatorios.');
      return;
    }
    onSave({
      ...form,
      edad: Number(form.edad) || '',
      estudios: form.estudios.filter((e) => e.n.trim()),
    });
  };

  return (
    <div className="fixed inset-0 bg-ink/45 flex items-center justify-center z-[300] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <h3 className="text-lg font-bold text-ink mb-4">{paciente ? 'Editar paciente' : 'Nuevo paciente'}</h3>

        <Campo label="Nombre completo">
          <input className="input" value={form.nombre} onChange={(e) => setCampo('nombre', e.target.value)} />
        </Campo>

        <div className="grid grid-cols-2 gap-2">
          <Campo label="Edad">
            <input type="number" className="input" value={form.edad} onChange={(e) => setCampo('edad', e.target.value)} />
          </Campo>
          <Campo label="DNI">
            <input className="input" value={form.dni} onChange={(e) => setCampo('dni', e.target.value)} />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Campo label="Turno">
            <input className="input" placeholder="06:20" value={form.turno} onChange={(e) => setCampo('turno', e.target.value)} />
          </Campo>
          <Campo label="Mutual">
            <input className="input" placeholder="OSDE / PAMI..." value={form.mutual} onChange={(e) => setCampo('mutual', e.target.value)} />
          </Campo>
        </div>

        <Campo label="Dirección">
          <input className="input" value={form.direccion} onChange={(e) => setCampo('direccion', e.target.value)} />
        </Campo>
        <Campo label="Teléfono">
          <input className="input" value={form.telefono} onChange={(e) => setCampo('telefono', e.target.value)} />
        </Campo>
        <Campo label="Fecha de visita">
          <input type="date" className="input" value={form.fecha_visita} onChange={(e) => setCampo('fecha_visita', e.target.value)} />
        </Campo>

        <div className="border-t border-dashed border-stone-200 mt-3 pt-3">
          <label className="text-[10.5px] font-mono uppercase tracking-wide text-teal">Estudios / órdenes</label>
          {form.estudios.map((e, i) => (
            <div key={i} className="flex gap-1.5 mt-2">
              <input
                className="input flex-1"
                placeholder="Nombre del estudio"
                value={e.n}
                onChange={(ev) => setEstudio(i, 'n', ev.target.value)}
              />
              <select className="input w-28" value={e.estado} onChange={(ev) => setEstudio(i, 'estado', ev.target.value)}>
                <option value="listo">Listo</option>
                <option value="pendiente">Pendiente</option>
              </select>
              <button type="button" onClick={() => rmEstudio(i)} className="text-coral px-2 text-lg">
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={addEstudio} className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200">
            + Agregar estudio
          </button>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-stone-200 text-sm font-semibold">
            Cancelar
          </button>
          <button type="button" onClick={handleGuardar} className="px-4 py-2 rounded-lg bg-ink text-white text-sm font-semibold">
            Guardar
          </button>
        </div>
      </div>

      <style>{`.input { width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid #E3DDCF; font-size: 13.5px; margin-top: 4px; }`}</style>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div className="mb-3">
      <label className="text-[10.5px] font-mono uppercase tracking-wide text-rose">{label}</label>
      {children}
    </div>
  );
}
