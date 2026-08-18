/**
 * usePacientes.js
 * Hook de estado para pacientes con persistencia en localStorage.
 * Manejo completo: crear, editar, eliminar, reordenar.
 *
 * @typedef {Object} Estudio
 * @property {string} n        Nombre del estudio/orden
 * @property {string} estado   'listo' | 'pendiente'
 *
 * @typedef {Object} Paciente
 * @property {string} id
 * @property {number} posicion       Orden manual (1..N)
 * @property {string} nombre
 * @property {number} [edad]
 * @property {string} [turno]
 * @property {string} [mutual]
 * @property {string} telefono
 * @property {string} direccion
 * @property {string} fecha_visita   YYYY-MM-DD
 * @property {string} [dni]
 * @property {Estudio[]} estudios
 * @property {number} createdAt
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'panel_pacientes_v1';
const DEBOUNCE_SAVE_MS = 250;

/**
 * Genera un ID único para cada paciente
 */
function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Carga pacientes desde localStorage
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [];
  }
}

/**
 * Guarda pacientes en localStorage con manejo de errores
 */
function saveToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    // localStorage lleno u otros errores: la app continúa funcionando en memoria
    console.warn('localStorage no disponible. Funcionando solo en memoria.', error);
  }
}

/**
 * Normaliza datos importados a estructura de Paciente
 */
function normalizarPaciente(data, posicion) {
  const estudios =
    data.estudios && Array.isArray(data.estudios) && data.estudios.length
      ? data.estudios
      : data.orden_medica
      ? [{ n: data.orden_medica, estado: 'pendiente' }]
      : [];

  return {
    id: makeId(),
    posicion,
    nombre: String(data.nombre || '').trim(),
    edad: Number(data.edad) || '',
    turno: String(data.turno || '').trim(),
    mutual: String(data.mutual || '').trim(),
    telefono: String(data.telefono || '').trim(),
    direccion: String(data.direccion || '').trim(),
    fecha_visita: data.fecha_visita || new Date().toISOString().slice(0, 10),
    dni: String(data.dni || '').trim(),
    estudios,
    createdAt: Date.now(),
  };
}

/**
 * Hook principal de gestión de pacientes
 */
export function usePacientes() {
  const [pacientes, setPacientes] = useState(loadFromStorage);
  const saveTimer = useRef(null);

  // Auto-save con debounce
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToStorage(pacientes);
    }, DEBOUNCE_SAVE_MS);

    return () => clearTimeout(saveTimer.current);
  }, [pacientes]);

  /**
   * Calcula la siguiente posición disponible
   */
  const nextPosicion = useCallback((lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return 1;
    return Math.max(...lista.map((p) => p.posicion || 0)) + 1;
  }, []);

  /**
   * Agrega un único paciente
   */
  const addPaciente = useCallback(
    (data) => {
      if (!data || !data.nombre) {
        console.warn('addPaciente: datos inválidos', data);
        return;
      }
      setPacientes((prev) => [...prev, normalizarPaciente(data, nextPosicion(prev))]);
    },
    [nextPosicion]
  );

  /**
   * Agrega múltiples pacientes (importación)
   */
  const addManyPacientes = useCallback(
    (lista) => {
      if (!Array.isArray(lista) || lista.length === 0) {
        console.warn('addManyPacientes: lista vacía o inválida');
        return;
      }

      setPacientes((prev) => {
        let pos = nextPosicion(prev);
        const nuevos = lista
          .filter((data) => data && data.nombre) // Valida cada item
          .map((data) => normalizarPaciente(data, pos++));
        return [...prev, ...nuevos];
      });
    },
    [nextPosicion]
  );

  /**
   * Actualiza un paciente por ID
   */
  const updatePaciente = useCallback((id, cambios) => {
    if (!id || !cambios) {
      console.warn('updatePaciente: id o cambios inválidos');
      return;
    }

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...cambios,
              id: p.id, // Protege el ID
              createdAt: p.createdAt, // Protege la fecha de creación
            }
          : p
      )
    );
  }, []);

  /**
   * Elimina un paciente por ID y renumera posiciones
   */
  const deletePaciente = useCallback((id) => {
    if (!id) {
      console.warn('deletePaciente: id inválido');
      return;
    }

    setPacientes((prev) => {
      const restantes = prev.filter((p) => p.id !== id);
      if (restantes.length === 0) return [];

      // Renumera posiciones para no dejar huecos
      return restantes
        .sort((a, b) => (a.posicion || 0) - (b.posicion || 0))
        .map((p, i) => ({ ...p, posicion: i + 1 }));
    });
  }, []);

  /**
   * Reordena pacientes según nuevo array de IDs
   */
  const reorderPacientes = useCallback((idsEnNuevoOrden) => {
    if (!Array.isArray(idsEnNuevoOrden) || idsEnNuevoOrden.length === 0) {
      console.warn('reorderPacientes: array inválido');
      return;
    }

    setPacientes((prev) => {
      const porId = new Map(prev.map((p) => [p.id, p]));
      const reordenados = idsEnNuevoOrden
        .map((id, i) => {
          const p = porId.get(id);
          return p ? { ...p, posicion: i + 1 } : null;
        })
        .filter(Boolean);

      return reordenados.length > 0 ? reordenados : prev;
    });
  }, []);

  return {
    pacientes,
    addPaciente,
    addManyPacientes,
    updatePaciente,
    deletePaciente,
    reorderPacientes,
  };
}