import { useState, useCallback, useMemo } from 'react';
import { parsePacientes, parseFile } from './parser';

export default function ImportPacientes({ onGuardarPacientes }) {
  const [texto, setTexto] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState('texto'); // 'texto' | 'archivo'
  const [cargando, setCargando] = useState(false);

  const mostrarMensaje = useCallback((msg, duracion = 2000) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), duracion);
  }, []);

  const handlePegarDesdePortapapeles = useCallback(async () => {
    try {
      const textoPegado = await navigator.clipboard.readText();
      setTexto(textoPegado);
      mostrarMensaje('✅ Pegado desde portapapeles');
    } catch (error) {
      mostrarMensaje('❌ Permiso denegado. Habilita acceso al portapapeles.');
    }
  }, [mostrarMensaje]);

  const handleParsearTexto = useCallback(() => {
    if (!texto.trim()) {
      mostrarMensaje('⚠️ Pegá algo primero');
      return;
    }

    try {
      const parseados = parsePacientes(texto);
      if (parseados.length === 0) {
        mostrarMensaje('⚠️ No se encontraron pacientes válidos');
        return;
      }
      setPacientes(parseados);
      mostrarMensaje(`✅ ${parseados.length} pacientes encontrados`);
    } catch (error) {
      mostrarMensaje(`❌ Error al parsear: ${error.message}`);
    }
  }, [texto, mostrarMensaje]);

  const handleArchivoSeleccionado = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCargando(true);
    try {
      const parseados = await parseFile(file);
      if (parseados.length === 0) {
        mostrarMensaje('⚠️ El archivo no contiene pacientes válidos');
        setCargando(false);
        return;
      }
      setPacientes(parseados);
      setTexto('');
      mostrarMensaje(`✅ ${parseados.length} pacientes cargados desde archivo`);
    } catch (error) {
      mostrarMensaje(`❌ Error: ${error.message}`);
    } finally {
      setCargando(false);
      e.target.value = '';
    }
  }, [mostrarMensaje]);

  const handleGuardar = useCallback(() => {
    if (pacientes.length === 0) {
      mostrarMensaje('⚠️ No hay pacientes para guardar');
      return;
    }
    onGuardarPacientes(pacientes);
    setTexto('');
    setPacientes([]);
    mostrarMensaje(`✅ ${pacientes.length} pacientes guardados`);
  }, [pacientes, onGuardarPacientes, mostrarMensaje]);

  const handleLimpiar = useCallback(() => {
    setTexto('');
    setPacientes([]);
    setMensaje('');
  }, []);

  const totalPacientes = pacientes.length;
  const estadisticas = useMemo(() => {
    if (totalPacientes === 0) return null;
    const conTelefono = pacientes.filter((p) => p.telefono).length;
    const conDireccion = pacientes.filter((p) => p.direccion).length;
    const conOrden = pacientes.filter((p) => p.orden_medica).length;
    return { conTelefono, conDireccion, conOrden };
  }, [pacientes]);

  return (
    <div style={{ padding: '20px', maxWidth: '720px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1C2B39' }}>
        📥 Importar Pacientes
      </h2>

      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
        Pegá el texto de WhatsApp tal como está, o cargá un archivo CSV/XLSX.
        <br />
        <span style={{ fontSize: '12px', color: '#999' }}>
          Se extraen: nombre, teléfono, dirección, fecha, orden médica, DNI
        </span>
      </p>

      {/* Tabs de tipo de importación */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={() => setTipo('texto')}
          style={{
            padding: '10px 16px',
            background: tipo === 'texto' ? '#2563eb' : 'transparent',
            color: tipo === 'texto' ? 'white' : '#666',
            border: 'none',
            borderBottom: tipo === 'texto' ? '3px solid #2563eb' : 'none',
            cursor: 'pointer',
            fontWeight: tipo === 'texto' ? 'bold' : 'normal',
          }}
        >
          📝 Pegar Texto
        </button>
        <button
          onClick={() => setTipo('archivo')}
          style={{
            padding: '10px 16px',
            background: tipo === 'archivo' ? '#2563eb' : 'transparent',
            color: tipo === 'archivo' ? 'white' : '#666',
            border: 'none',
            borderBottom: tipo === 'archivo' ? '3px solid #2563eb' : 'none',
            cursor: 'pointer',
            fontWeight: tipo === 'archivo' ? 'bold' : 'normal',
          }}
        >
          📁 Cargar Archivo
        </button>
      </div>

      {/* Sección de texto */}
      {tipo === 'texto' && (
        <div style={{ marginBottom: '20px' }}>
          <textarea
            rows="10"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Ejemplo de WhatsApp:
[12/8, 22:25] Carina: 
1. Faustino Chacoma
Tel: 2966471292
Dirección: Rawson 1234
Fecha: 12/08/2024
Orden: Análisis completo

[12/8, 22:26] Tomás:
2. Justo José de Urquiza
Tel: 2966471293
...`}
            style={{
              width: '100%',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              resize: 'vertical',
              lineHeight: '1.4',
            }}
          />

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePegarDesdePortapapeles}
              style={{
                padding: '10px 16px',
                background: '#4C7A72',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              📋 Pegar
            </button>

            <button
              onClick={handleParsearTexto}
              disabled={!texto.trim()}
              style={{
                padding: '10px 16px',
                background: texto.trim() ? '#2563eb' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: texto.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              🔍 Parsear
            </button>

            {texto && (
              <button
                onClick={() => setTexto('')}
                style={{
                  padding: '10px 16px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sección de archivo */}
      {tipo === 'archivo' && (
        <div
          style={{
            padding: '20px',
            border: '2px dashed #2563eb',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px',
            background: '#f0f8ff',
          }}
        >
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Selecciona un archivo</div>
            <div style={{ fontSize: '12px', color: '#666' }}>CSV, XLSX o XLS</div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleArchivoSeleccionado}
              disabled={cargando}
              style={{ display: 'none' }}
            />
          </label>
          {cargando && (
            <div style={{ marginTop: '12px', color: '#2563eb', fontWeight: 'bold' }}>
              ⏳ Cargando...
            </div>
          )}
        </div>
      )}

      {/* Mensaje de estado */}
      {mensaje && (
        <div
          style={{
            padding: '12px 16px',
            background: mensaje.includes('❌') ? '#fee' : mensaje.includes('⚠️') ? '#ffe' : '#efe',
            border: `1px solid ${
              mensaje.includes('❌') ? '#fcc' : mensaje.includes('⚠️') ? '#ffc' : '#cfc'
            }`,
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {mensaje}
        </div>
      )}

      {/* Vista previa */}
      {pacientes.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e0e0e0',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
              📋 Vista Previa: {totalPacientes} pacientes
            </h3>
            {estadisticas && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                ☎️ {estadisticas.conTelefono} | 📍 {estadisticas.conDireccion} | 📋{' '}
                {estadisticas.conOrden}
              </div>
            )}
          </div>

          <div
            style={{
              maxHeight: '350px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            {pacientes.map((p, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid #ddd',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#fafafa',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ color: '#2563eb' }}>
                    {i + 1}. {p.nombre}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#999' }}>ID: {i}</span>
                </div>

                {p.telefono && (
                  <div style={{ color: '#555', margin: '2px 0' }}>
                    📱 <span style={{ fontFamily: 'monospace' }}>{p.telefono}</span>
                  </div>
                )}
                {p.direccion && (
                  <div style={{ color: '#555', margin: '2px 0' }}>
                    📍 {p.direccion}
                  </div>
                )}
                {p.fecha_visita && (
                  <div style={{ color: '#555', margin: '2px 0' }}>
                    📅 {p.fecha_visita}
                  </div>
                )}
                {p.orden_medica && (
                  <div style={{ color: '#555', margin: '2px 0' }}>
                    📋 {p.orden_medica}
                  </div>
                )}
                {p.dni && (
                  <div style={{ color: '#555', margin: '2px 0' }}>
                    🆔 {p.dni}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGuardar}
              style={{
                flex: 1,
                minWidth: '150px',
                background: '#22c55e',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              ✅ Guardar {totalPacientes}
            </button>

            <button
              onClick={handleLimpiar}
              style={{
                flex: 1,
                minWidth: '150px',
                background: '#ef4444',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}