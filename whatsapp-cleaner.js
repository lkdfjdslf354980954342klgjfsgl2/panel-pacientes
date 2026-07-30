/********************************************
 * MÓDULO: LIMPIADOR DE WHATSAPP v1.0
 * NO TOCAR NADA DE ABAJO. ES INDEPENDIENTE
 ********************************************/
const WhatsAppCleaner = {
  
  // Función 1: La que hace toda la magia
  limpiarTexto: function(textoCrudo) {
    if (!textoCrudo) return "";
    
    const regex = /^\[.*?\]\s*.*?:\s*/gm; // g=multiples lineas, m=^$ por linea
    
    // Borra [fecha hora] Nombre: de cada linea
    let textoLimpio = textoCrudo.replace(regex, '');
    
    // Borra lineas vacías que puedan quedar
    return textoLimpio.split('\n').filter(linea => linea.trim() !== '').join('\n');
  },

  // Función 2: Copiar al portapeles
  copiarAlPortapeles: function(idTextarea) {
    const textarea = document.getElementById(idTextarea);
    textarea.select();
    document.execCommand('copy');
    alert('Datos limpios copiados ✅');
  }
};
/* FIN DEL MÓDULO */
