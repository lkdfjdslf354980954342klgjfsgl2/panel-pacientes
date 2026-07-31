import { useState } from 'react';
import { WhatsAppCleaner } from './utils/whatsappCleaner'; // Ajusta la ruta si tu utils está en otra carpeta

export default function ImportPacientes() {
  const [texto, setTexto] = useState('');
  const [mensaje, setMensaje] = useState(''); // Para mostrar feedback sin alert

  const handleLimpiar = () => {
    const limpio = WhatsAppCleaner.limpiarTexto(texto);
    setTexto(limpio);
    setMensaje('Texto limpiado ✅');
    setTimeout(() => setMensaje(''), 2000);
  };

  const handleCopiar = async () => {
    await WhatsAppCleaner.copiarAlPortapeles(texto);
    setMensaje('Copiado al portapeles ✅');
    setTimeout(() => setMensaje(''), 2000);
  };

  const handlePegarDesdePortapeles = async () => {
    try {
      const textoPegado = await navigator.clipboard.readText();
      setTexto(textoPegado);
      setMensaje('Pegado desde portapeles ✅');
      setTimeout(() => setMensaje(''), 2000);
    } catch (error) {
      setMensaje('No se pudo pegar. Da permisos al navegador');
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '600px' }}>
      <h2>Importar Pacientes desde WhatsApp</h2>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Pega la lista tal cual te la mandan. Se eliminará la fecha y el nombre del remitente automáticamente.
      </p>
      
      <textarea 
        id="textareaImportPacientes"
        rows="10" 
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={`Ejemplo:
[29/7, 22:19] Amor: 5. Luis Ibañez (Trinidad) 2966453428
[29/7, 22:21] jose Amor: 6. Azucena Vega (Rawson) 2966234543`}
        style={{
          width: '100%',
          padding: '10px',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '14px',
          border: '1px solid #ccc',
          borderRadius: '8px'
        }}
      />

      {mensaje && <p style={{ color: 'green', marginTop: '8px' }}>{mensaje}</p>}

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" onClick={handlePegarDesdePortapeles}>Pegar</button>
        <button type="button" onClick={handleLimpiar}>Limpiar WhatsApp</button>
        <button type="button" onClick={handleCopiar}>Copiar Limpio</button>
      </div>

      {/* Aquí va tu lógica actual para procesar y guardar los pacientes */}
      {/* Ej: <button onClick={procesarYGuardar}>Guardar Pacientes</button> */}
    </div>
  );
}
