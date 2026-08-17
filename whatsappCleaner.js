/********************************************
 * MÓDULO: LIMPIADOR DE WHATSAPP v2.0
 ********************************************/
export const WhatsAppCleaner = {

  limpiarYParsear: function(textoCrudo) {
    if (!textoCrudo) return [];
    const lineas = textoCrudo.split('\n');
    const pacientes = [];
    let pacienteActual = null;

    const regexInicio = /^(\d+)\.\s*(.+?)\s*\((.+?)\)\s*([\d\-\s]+)$/;
    const regexHeader = /^\[.*?\]\s*.*?:\s*/;

    lineas.forEach(lineaCruda => {
      const linea = lineaCruda.replace(regexHeader, '').trim();
      if (!linea) return;

      const matchInicio = linea.match(regexInicio);
      if (matchInicio) {
        if (pacienteActual) pacientes.push(pacienteActual);
        pacienteActual = {
          id: matchInicio[1], nombre: matchInicio[2].trim(), localidad: matchInicio[3].trim(),
          telefono: matchInicio[4].replace(/[^0-9]/g, ''), direccion: '', notas: '',
          orina: /orina/i.test(linea), orden: false, abono: false, reprogramado: false, nueva_fecha: ''
        };
        return;
      }
      if (pacienteActual) {
        if (/orina/i.test(linea)) { pacienteActual.notas += (pacienteActual.notas? ' : '') + linea; pacienteActual.orina = true; }
        else { pacienteActual.direccion += (pacienteActual.direccion? ', ' : '') + linea; }
      }
    });
    if (pacienteActual) pacientes.push(pacienteActual);
    return pacientes;
  }
};
