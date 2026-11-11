/* Registros compartidos sin dependencias: así cualquier módulo puede agregar
   acciones de botones (ACT), entradas (INP) o avisos (HOOKS) sin problemas de orden al cargar. */
export const ACT = {};
export const INP = {};
export const HOOKS = { closeModal: [] };
