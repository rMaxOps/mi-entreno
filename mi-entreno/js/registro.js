/* Registros compartidos sin dependencias: así cualquier módulo puede agregar
   acciones de botones (ACT), entradas (INP) o avisos (HOOKS) sin problemas de orden al cargar. */
export const ACT = {};
export const INP = {};
export const HOOKS = {
  closeModal: [],        // antes de cerrar una hoja
  antesDeGuardar: [],    // (S, uid) justo antes de guardar: la sincronización marca lo que cambió
  despuesDeGuardar: [],  // (S, uid) después de guardar: la sincronización programa una subida
};
