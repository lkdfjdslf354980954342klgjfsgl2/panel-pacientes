/**
 * supabaseClient.js
 * Configuración y cliente de Supabase
 * 
 * Para usar esto:
 * 1. Crea una cuenta en https://supabase.com
 * 2. Crea un proyecto
 * 3. Copia tu URL y API KEY desde Settings > API
 * 4. Crea un archivo .env.local con:
 *    VITE_SUPABASE_URL=tu_url_aqui
 *    VITE_SUPABASE_ANON_KEY=tu_key_aqui
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase no está configurado. Las funcionalidades de base de datos estarán deshabilitadas.\n' +
    'Para habilitarlo, crea un archivo .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Guarda pacientes en Supabase
 */
export async function guardarPacientesEnSupabase(pacientes) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('⚠️ Supabase no configurado. Datos guardados solo en localStorage.');
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { data, error } = await supabase.from('pacientes').upsert(
      pacientes.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        edad: p.edad,
        turno: p.turno,
        mutual: p.mutual,
        telefono: p.telefono,
        direccion: p.direccion,
        fecha_visita: p.fecha_visita,
        dni: p.dni,
        estudios: JSON.stringify(p.estudios || []),
        posicion: p.posicion,
        created_at: new Date(p.createdAt).toISOString(),
      }))
    );

    if (error) {
      console.error('Error guardando en Supabase:', error);
      return { success: false, message: error.message };
    }

    console.log('✅ Pacientes guardados en Supabase');
    return { success: true, message: 'Guardado en Supabase' };
  } catch (err) {
    console.error('Error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Carga pacientes desde Supabase
 */
export async function cargarPacientesDeSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('posicion', { ascending: true });

    if (error) {
      console.error('Error cargando de Supabase:', error);
      return { success: false, data: [] };
    }

    const pacientes = data.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      edad: p.edad,
      turno: p.turno,
      mutual: p.mutual,
      telefono: p.telefono,
      direccion: p.direccion,
      fecha_visita: p.fecha_visita,
      dni: p.dni,
      estudios: p.estudios ? JSON.parse(p.estudios) : [],
      posicion: p.posicion,
      createdAt: new Date(p.created_at).getTime(),
    }));

    console.log('✅ Pacientes cargados desde Supabase');
    return { success: true, data: pacientes };
  } catch (err) {
    console.error('Error:', err);
    return { success: false, data: [] };
  }
}