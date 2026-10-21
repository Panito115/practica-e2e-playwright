/** Usuarios de prueba y su comportamiento, según la tabla del README. */
export const CLAVE_VALIDA = "calidad2026";

export const USUARIOS = {
  /** Usuario normal. */
  estandar: "estandar",
  /** No puede entrar. */
  bloqueado: "bloqueado",
  /** Entra, pero el catálogo y el pago tienen fallas visibles. */
  problema: "problema",
  /** Entra después de unos segundos. */
  lento: "lento",
} as const;

export type Usuario = (typeof USUARIOS)[keyof typeof USUARIOS];
