/********************************************
 * MÓDULO: LIMPIADOR DE WHATSAPP v2.0
 * Ahora parsea y agrupa pacientes + agrega botones
 ********************************************/
const WhatsAppCleaner = {
  
  // Función 1: Limpia Y convierte a objetos
  limpiarYParsear: function(textoCrudo) {
    if (!textoCrudo) return [];
    
    const lineas = textoCrudo.split('\n');
    const pacientes = [];
    let pacienteActual = null;
    
    // Regex para detectar inicio de paciente: "2. Nombre (Localidad) Tel"
    const regexInicio = /^(\d+)\.\s*(.+?)\s*\((.+?)\)\s*([\d\-\s]+)$/;
    // Regex para borrar [fecha hora] Nombre:
    const regexHeader = /^\[.*?\]\s*.*?:\s*/;

    lineas.forEach(lineaCruda => {
      // 1. Borrar [fecha hora] Nombre: de la línea
      const linea = lineaCruda.replace(regexHeader, '').trim();
      if (!linea) return;

      // 2. ¿Es el inicio de un nuevo paciente?
      const matchInicio = linea.match(regexInicio);
      if (matchInicio) {
        // Guardar el anterior si existe
        if (pacienteActual) pacientes.push(pacienteActual);
        
        pacienteActual = {
          id: matchInicio[1],
          nombre: matchInicio[2].trim(),
          localidad: matchInicio[3].trim(),
          telefono: matchInicio[4].replace(/[^0-9]/g, ''), // solo numeros
          direccion: '',
          notas: '',
          orina: /orina/i.test(linea), // si en la misma linea dice orina
          orden: false,
          abono: false,
          reprogramado: false,
          nueva_fecha: ''
        };
        return;
      }
      
      // 3. Si no es inicio, es dirección, referencia o nota del paciente actual
      if (pacienteActual) {
        if (/orina/i.test(linea)) {
          pacienteActual.notas += (pacienteActual.notas ? ' ' : '') + linea;
          pacienteActual.orina = true; // auto-marcar si dice "tiene orina"
        } else {
          // Todo lo demás va a dirección
          pacienteActual.direccion += (pacienteActual.direccion ? ', ' : '') + linea;
        }
      }
    });
    
    // Guardar el último paciente
    if (pacienteActual) pacientes.push(pacienteActual);
    
    return pacientes;
  },

  // Función 2: Convierte a texto para pegar en tu app actual
  aFormatoApp: function(pacientes) {
    return pacientes.map(p => {
      return `${p.id}) ${p.nombre}
Teléfono: ${p.telefono}
Localidad: ${p.localidad}
Dirección: ${p.direccion}
Notas: ${p.notas}
Orina: ${p.orina ? 'Si' : 'No'}
Orden: ${p.orden ? 'Si' : 'No'}
Abono: ${p.abono ? 'Si' : 'No'}
Reprogramado: ${p.reprogramado ? 'Si para ' + p.nueva_fecha : 'No'}`;
    }).join('\n\n');
  },

  // Función 3: Copiar al portapapeles
  copiarAlPortapeles: function(idTextarea) {
    const textarea = document.getElementById(idTextarea);
    textarea.select();
    document.execCommand('copy');
    alert('Datos limpios copiados ✅');
  }
};
/* FIN DEL MÓDULO */
