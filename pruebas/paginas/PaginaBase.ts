import type { Locator, Page } from "@playwright/test";

/**
 * Base de todos los page objects.
 *
 * Aquí viven la navegación y el encabezado que comparten las páginas con sesión
 * iniciada. Las pruebas nunca escriben localizadores: solo llaman a estos métodos.
 */
export abstract class PaginaBase {
  constructor(protected readonly page: Page) {}

  /** Ruta de la página dentro de la tienda, ya sin la extensión `.html`. */
  abstract readonly ruta: string;

  /** Expresión que reconoce la URL de la página, con o sin `.html`. */
  abstract readonly patronDeUrl: RegExp;

  async abrir(): Promise<void> {
    await this.page.goto(this.ruta);
  }

  /**
   * Espera hasta que el navegador esté en esta página. Es una espera por
   * condición, no un `waitForTimeout`, así que sirve también para el usuario
   * `lento` con solo ampliar el plazo.
   */
  async esperarAEstarVisible(timeout?: number): Promise<void> {
    await this.page.waitForURL(this.patronDeUrl, timeout === undefined ? undefined : { timeout });
  }

  urlActual(): string {
    return this.page.url();
  }

  // --- Encabezado con sesión iniciada ---

  private get contadorDelCarrito(): Locator {
    return this.page.getByTestId("contador-carrito");
  }

  private get enlaceAlCarrito(): Locator {
    return this.page.getByTestId("enlace-carrito");
  }

  private get botonCerrarSesion(): Locator {
    return this.page.getByTestId("cerrar-sesion");
  }

  /** Regla «Carrito»: el contador del encabezado muestra el total de unidades. */
  contadorDeUnidades(): Locator {
    return this.contadorDelCarrito;
  }

  async unidadesEnElContador(): Promise<number> {
    return Number((await this.contadorDelCarrito.innerText()).trim());
  }

  async irAlCarrito(): Promise<void> {
    await this.enlaceAlCarrito.click();
  }

  /** Regla «Sesión»: cerrar sesión vacía el carrito. */
  async cerrarSesion(): Promise<void> {
    await this.botonCerrarSesion.click();
  }

  async tieneEncabezadoDeSesion(): Promise<boolean> {
    return this.botonCerrarSesion.isVisible();
  }

  // --- Utilidades compartidas ---

  /** Convierte el formato de la tienda (`Q75.00`, `-Q11.25`) en un número. */
  protected static aMonto(texto: string): number {
    const limpio = texto.replace(/\s/g, "").replace("Q", "");
    const valor = Number.parseFloat(limpio);
    if (Number.isNaN(valor)) throw new Error(`No se pudo leer un monto en «${texto}»`);
    return Math.abs(valor);
  }
}
