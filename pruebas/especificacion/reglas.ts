/**
 * Las reglas de negocio del README, escritas como funciones.
 *
 * Este módulo es el oráculo de la suite: cada prueba calcula aquí el resultado
 * esperado y lo compara con lo que la tienda muestra. Nunca se mira `tienda/app.js`
 * para decidir qué es correcto; si la tienda y este módulo no coinciden, la prueba
 * se queda en rojo y el desacuerdo se anota en `DEFECTOS.md`.
 */
import type { Producto } from "./productos.js";

export const CUPON_ENVIO_GRATIS = "ENVIOGRATIS";
export const ERROR_CUPON_INEXISTENTE = "El cupón no existe.";

/** Regla «Cantidad»: un número entero de 1 a 5 por producto. */
export const CANTIDAD_MINIMA = 1;
export const CANTIDAD_MAXIMA = 5;

/** Regla «Envío gratis»: umbral del subtotal con descuento. */
export const UMBRAL_ENVIO_GRATIS = 300;

/** Regla «Envío»: prefijo de código postal de Ciudad de Guatemala. */
export const PREFIJO_CAPITAL = "01";
export const ENVIO_CAPITAL = 25;
export const ENVIO_INTERIOR = 40;

export type LineaDeCarrito = { producto: Producto; cantidad: number };

export type Totales = {
  subtotal: number;
  porcentajeDescuento: number;
  descuento: number;
  envio: number;
  total: number;
};

/** Formato de dinero que usa la tienda: `Q75.00`. */
export function moneda(monto: number): string {
  return "Q" + monto.toFixed(2);
}

function aDosDecimales(monto: number): number {
  return Math.round(monto * 100) / 100;
}

/** Regla «Carrito»: el contador del encabezado muestra el total de unidades. */
export function unidadesTotales(lineas: readonly LineaDeCarrito[]): number {
  return lineas.reduce((suma, l) => suma + l.cantidad, 0);
}

/** Subtotal del carrito: suma de precio por cantidad. */
export function subtotalDe(lineas: readonly LineaDeCarrito[]): number {
  return aDosDecimales(lineas.reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0));
}

/** Regla «Cantidad»: qué cantidades son válidas. */
export function cantidadEsValida(valor: number): boolean {
  return Number.isInteger(valor) && valor >= CANTIDAD_MINIMA && valor <= CANTIDAD_MAXIMA;
}

/**
 * Regla «Datos de envío»: el código postal tiene exactamente 5 dígitos.
 */
export function codigoPostalEsValido(cp: string): boolean {
  return /^\d{5}$/.test(cp.trim());
}

/**
 * Regla «Cupón»: el único cupón válido es `ENVIOGRATIS`, en mayúsculas o en
 * minúsculas, y los espacios al inicio y al final no cuentan. Es opcional, así
 * que el texto vacío también se acepta.
 */
export function cuponEsAceptado(cupon: string): boolean {
  const normalizado = cupon.trim();
  return normalizado === "" || normalizado.toUpperCase() === CUPON_ENVIO_GRATIS;
}

export function cuponDaEnvioGratis(cupon: string): boolean {
  return cupon.trim().toUpperCase() === CUPON_ENVIO_GRATIS;
}

/**
 * Regla «Descuento»: subtotal menor de Q200, sin descuento; de Q200 a Q499,
 * 5 %; de Q500 en adelante, 10 %.
 */
export function porcentajeDescuento(subtotal: number): number {
  if (subtotal < 200) return 0;
  if (subtotal < 500) return 5;
  return 10;
}

export function montoDescuento(subtotal: number): number {
  return aDosDecimales((subtotal * porcentajeDescuento(subtotal)) / 100);
}

/** Subtotal con descuento aplicado: la base sobre la que se decide el envío. */
export function subtotalConDescuento(subtotal: number): number {
  return aDosDecimales(subtotal - montoDescuento(subtotal));
}

/**
 * Reglas «Envío» y «Envío gratis»: Q25 si el código postal empieza con `01` y
 * Q40 en cualquier otro caso, pero Q0 si el subtotal con descuento es de Q300 o
 * más, o si se usa el cupón `ENVIOGRATIS`. El cupón vale para cualquier código
 * postal.
 */
export function costoEnvio(subtotal: number, codigoPostal: string, cupon = ""): number {
  if (subtotalConDescuento(subtotal) >= UMBRAL_ENVIO_GRATIS) return 0;
  if (cuponDaEnvioGratis(cupon)) return 0;
  return codigoPostal.trim().startsWith(PREFIJO_CAPITAL) ? ENVIO_CAPITAL : ENVIO_INTERIOR;
}

/** Regla «Total»: subtotal, menos el descuento, más el envío. */
export function totalesEsperados(
  lineas: readonly LineaDeCarrito[],
  codigoPostal: string,
  cupon = ""
): Totales {
  const subtotal = subtotalDe(lineas);
  const descuento = montoDescuento(subtotal);
  const envio = costoEnvio(subtotal, codigoPostal, cupon);
  return {
    subtotal,
    porcentajeDescuento: porcentajeDescuento(subtotal),
    descuento,
    envio,
    total: aDosDecimales(subtotal - descuento + envio),
  };
}

/** Regla «Confirmación»: el número de pedido tiene 6 dígitos. */
export const PATRON_NUMERO_DE_PEDIDO = /^\d{6}$/;
