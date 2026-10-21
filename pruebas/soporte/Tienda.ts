import { PaginaIngreso } from "../paginas/PaginaIngreso.js";
import { PaginaCatalogo } from "../paginas/PaginaCatalogo.js";
import { PaginaCarrito } from "../paginas/PaginaCarrito.js";
import { PaginaDatosDeEnvio, type DatosDeEnvio } from "../paginas/PaginaDatosDeEnvio.js";
import { PaginaResumen } from "../paginas/PaginaResumen.js";
import { PaginaConfirmacion } from "../paginas/PaginaConfirmacion.js";
import type { Usuario } from "../especificacion/usuarios.js";
import type { LineaDeCarrito } from "../especificacion/reglas.js";
import type { Page } from "@playwright/test";

/**
 * Fachada sobre los page objects con los recorridos que varias pruebas repiten.
 *
 * Solo compone llamadas a los page objects: ningún localizador vive aquí ni en
 * las pruebas.
 */
export class Tienda {
  readonly ingreso: PaginaIngreso;
  readonly catalogo: PaginaCatalogo;
  readonly carrito: PaginaCarrito;
  readonly datosDeEnvio: PaginaDatosDeEnvio;
  readonly resumen: PaginaResumen;
  readonly confirmacion: PaginaConfirmacion;

  constructor(page: Page) {
    this.ingreso = new PaginaIngreso(page);
    this.catalogo = new PaginaCatalogo(page);
    this.carrito = new PaginaCarrito(page);
    this.datosDeEnvio = new PaginaDatosDeEnvio(page);
    this.resumen = new PaginaResumen(page);
    this.confirmacion = new PaginaConfirmacion(page);
  }

  /** Ingresa con la contraseña válida y espera el catálogo. */
  async entrarComo(usuario: Usuario, timeout?: number): Promise<void> {
    await this.ingreso.abrir();
    await this.ingreso.ingresarComo(usuario);
    await this.catalogo.esperarAEstarVisible(timeout);
  }

  /**
   * Agrega los productos desde el catálogo y ajusta las cantidades en el
   * carrito, como pide la regla «Carrito». Termina en la página del carrito.
   */
  async llenarCarrito(lineas: readonly LineaDeCarrito[]): Promise<void> {
    await this.catalogo.esperarAEstarVisible();
    for (const linea of lineas) await this.catalogo.agregar(linea.producto);
    await this.catalogo.irAlCarrito();
    await this.carrito.esperarAEstarVisible();
    for (const linea of lineas) {
      if (linea.cantidad === 1) continue;
      await this.carrito.cambiarCantidadDe(linea.producto, linea.cantidad);
    }
  }

  /** Recorrido completo desde el catálogo hasta el resumen del pedido. */
  async irAlResumen(
    lineas: readonly LineaDeCarrito[],
    datos: DatosDeEnvio
  ): Promise<void> {
    await this.llenarCarrito(lineas);
    await this.carrito.continuarAlPago();
    await this.datosDeEnvio.esperarAEstarVisible();
    await this.datosDeEnvio.enviar(datos);
    await this.resumen.esperarAEstarVisible();
  }

  /** Recorrido desde el catálogo hasta la página de datos de envío. */
  async irADatosDeEnvio(lineas: readonly LineaDeCarrito[]): Promise<void> {
    await this.llenarCarrito(lineas);
    await this.carrito.continuarAlPago();
    await this.datosDeEnvio.esperarAEstarVisible();
  }
}
