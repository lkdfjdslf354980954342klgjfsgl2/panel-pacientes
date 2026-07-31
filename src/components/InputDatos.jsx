import { useState } from 'react';
import { WhatsAppCleaner } from '../utils/whatsappCleaner'; // 1. Lo importas

export default function InputDatos() {
  const [texto, setTexto] = useState('');

  const handleLimpiar = () => {
    const limpio = WhatsAppCleaner.limpiarTexto(texto); // 2. Lo usas
    setTexto(limpio);
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(texto);
    alert('Copiado ✅');
  };

  return (
    <div>
      <h2>Pegar datos de WhatsApp</h2>
      
      {/* 3. Tu textarea actual */}
      <textarea 
        id="miTextareaDeLaApp"
        rows="8" 
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Pega aquí lo de WhatsApp..."
        style={{width: '100%'}}
      />

      {/* 4. Los 2 botones nuevos */}
      <button type="button" onClick={handleLimpiar}>Limpiar WhatsApp</button>
      <button type="button" onClick={handleCopiar}>Copiar Limpio</button>
    </div>
  );
}
