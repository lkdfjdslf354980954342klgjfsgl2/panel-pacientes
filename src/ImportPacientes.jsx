import { useState } from 'react';
import { WhatsAppCleaner } from './utils/whatsappCleaner';

export default function ImportPacientes({ onGuardarPacientes }) { // onGuardarPacientes es tu función para guardar en DB
  const [texto, setTexto] = useState('');
  const [pacientes, setPacientes] = useState([]); // Nuevo: guardamos el array parseado
  const [mensaje, setMensaje] = useState('');

  const handlePegarDesdePortapeles = async () => {
    try {
      const textoPegado = await navigator.clipboard.readText();
      setTexto(textoPegado);
      setMensaje('Pegado ✅');
      setTimeout(() => setMensaje(''), 2000);
    } catch (error) { setMensaje('No se pudo pegar. Da permisos'); }
  };

  const handleParsear = () => {
    const parseados = WhatsAppCleaner.limpiarYParsear(texto);
    setPacientes(parseados);
    setMensaje(`${parseados.length} pacientes encontrados ✅`);
    setTimeout(() => setMensaje(''), 2000);
  };

  const toggleCheck = (index, campo) => {
    const nuevos = [...pacientes];
    nuevos[index][campo] =!nuevos[index][campo];
    setPacientes(nuevos);
  };

  const handleFechaReprog = (index, valor) => {
    const nuevos = [...pacientes];
    nuevos[index].nueva_fecha = valor;
    setPacientes(nuevos);
  };

  const handleGuardar = () => {
    onGuardarPacientes(pacientes); // Le pasas el array completo a tu lógica
    setMensaje(`${pacientes.length} pacientes guardados ✅`);
    setTexto(''); setPacientes([]);
  };

  return (
    <div style={{ padding: '16px', maxWidth: '700px' }}>
      <h2>Importar Pacientes desde WhatsApp</h2>
      <p style={{ fontSize: '14px', color: '#666' }}>Pega la lista tal cual. Se borra fecha/nombre y se agrupa solo.</p>

      <textarea
        rows="8" value={texto} onChange={(e) => setTexto(e.target.value)}
        placeholder={`[12/8, 22:25] Carina: 2. Faustino Chacoma (Rawson) 2966471292\n[12/8, 22:25] Tomás: Justo José de Urquiza 1051`}
        style={{ width: '100%', padding: '10px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid #ccc', borderRadius: '8px' }}
      />

      {mensaje && <p style={{ color: 'green', marginTop: '8px' }}>{mensaje}</p>}

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" onClick={handlePegarDesdePortapeles}>Pegar</button>
        <button type="button" onClick={handleParsear} style={{ background: '#2563eb', color: 'white' }}>Parsear Pacientes</button>
      </div>

      {/* VISTA PREVIA + BOTONES */}
      {pacientes.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Vista Previa: {pacientes.length} pacientes</h3>
          {pacientes.map((p, i) => (
            <div key={i} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
              <b>{p.id}) {p.nombre}</b> - {p.localidad} - {p.telefono}<br/>
              <small>{p.direccion}</small><br/>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                <label><input type="checkbox" checked={p.orina} onChange={() => toggleCheck(i, 'orina')} /> Orina</label>
                <label><input type="checkbox" checked={p.orden} onChange={() => toggleCheck(i, 'orden')} /> Orden</label>
                <label><input type="checkbox" checked={p.abono} onChange={() => toggleCheck(i, 'abono')} /> Abono</label>
                <label>
                  <input type="checkbox" checked={p.reprogramado} onChange={() => toggleCheck(i, 'reprogramado')} /> Reprogramó
                </label>
                {p.reprogramado && (
                  <input
                    type="datetime-local"
                    value={p.nueva_fecha}
                    onChange={(e) => handleFechaReprog(i, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}
          <button onClick={handleGuardar} style={{ background: 'green', color: 'white', padding: '10px 20px', borderRadius: '8px' }}>
            Guardar {pacientes.length} Pacientes
          </button>
        </div>
      )}
    </div>
  );
}
