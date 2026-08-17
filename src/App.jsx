import { useState } from 'react';
import PacienteList from './PacienteList.jsx';
import ImportPacientes from './ImportPacientes.jsx';

export default function App() {
  const [pacientes, setPacientes] = useState([]);
  const [mostrarImportar, setMostrarImportar] = useState(false);

  const guardarPacientes = (listaNueva) => {
    setPacientes(prev => [...prev, ...listaNueva]); 
    setMostrarImportar(false);
    alert(`${listaNueva.length} pacientes importados ✅`);
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestor de Pacientes</h1>
      
      <button 
        onClick={() => setMostrarImportar(true)}
        style={{ background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', marginBottom: '20px' }}
      >
        IMPORTAR DESDE WHATSAPP
      </button>

      {mostrarImportar && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <button onClick={() => setMostrarImportar(false)} style={{ float: 'right', border: 'none', background: 'red', color: 'white', borderRadius: '50%' }}>X</button>
            <ImportPacientes onGuardarPacientes={guardarPacientes} />
          </div>
        </div>
      )}

      <PacienteList pacientes={pacientes} />
    </div>
  );
}
