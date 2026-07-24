/**
 * usePacientes.js
 * Estado de pacientes con persistencia en localStorage. 100% client-side.
 *
 * @typedef {Object} Paciente
 * @property {string} id
 * @property {number} posicion       Orden manual (1..N), para arrastrar y reordenar
 * @property {string} nombre
 * @property {string} telefono
 * @property {string} direccion
 * @property {string} fecha_visita   YYYY-MM-DD
 * @property {string} [orden_medica]
 * @property {string} [dni]
 * @property {number} createdAt
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'panel_pacientes';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // almacenamiento no disponible: la app sigue funcionando en memoria
  }
}

function normalizarPaciente(data, posicion) {
  return {
    id: makeId(),
    posicion,
    nombre: data.nombre || '',
    telefono: data.telefono || '',
    direccion: data.direccion || '',
    fecha_visita: data.fecha_visita || new Date().toISOString().slice(0, 10),
    orden_medica: data.orden_medica || '',
    dni: data.dni || '',
    createdAt: Date.now(),
  };
}

export function usePacientes() {
  const [pacientes, setPacientes] = useState(loadFromStorage);
  const saveTimer = useRef(null);

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveToStorage(pacientes), 250);
    return () => clearTimeout(saveTimer.current);
  }, [pacientes]);

  const nextPosicion = useCallback(
    (lista) => lista.reduce((max, p) => Math.max(max, p.posicion || 0), 0) + 1,
    []
  );

  const addPaciente = useCallback(
    (data) => {
      setPacientes((prev) => [...prev, normalizarPaciente(data, nextPosicion(prev))]);
    },
    [nextPosicion]
  );

  const addManyPacientes = useCallback(
    (lista) => {
      setPacientes((prev) => {
        let pos = nextPosicion(prev);
        const nuevos = lista.map((data) => normalizarPaciente(data, pos++));
        return [...prev, ...nuevos];
      });
    },
    [nextPosicion]
  );

  const updatePaciente = useCallback((id, cambios) => {
    setPacientes((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  }, []);

  const deletePaciente = useCallback((id) => {
    setPacientes((prev) => {
      const restantes = prev.filter((p) => p.id !== id);
      // renumera para no dejar huecos en la posición
      return restantes
        .sort((a, b) => a.posicion - b.posicion)
        .map((p, i) => ({ ...p, posicion: i + 1 }));
    });
  }, []);

  /** Reordena según un array de ids en el nuevo orden deseado (arrastrar y soltar). */
  const reorderPacientes = useCallback((idsEnNuevoOrden) => {
    setPacientes((prev) => {
      const porId = new Map(prev.map((p) => [p.id, p]));
      return idsEnNuevoOrden
        .map((id, i) => ({ ...porId.get(id), posicion: i + 1 }))
        .filter((p) => p.id);
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
