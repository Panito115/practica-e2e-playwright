import type { Locator } from "@playwright/test";
import { PaginaBase } from "./PaginaBase.js";

export type DatosDeEnvio = {
  nombre?: string;
  apellido?: string;
  codigoPostal?: string;
  cupon?: string;
};

/** Página de datos de envío (`checkout.html`). Reglas «Datos de envío» y «Cupón». */
export class PaginaDatosDeEnvio extends PaginaBase {
  readonly ruta = "/checkout";
  readonly patronDeUrl = /\/checkout(\.html)?$/;

  private get campoNombre(): Locator {
    return this.page.getByTestId("nombre");
  }

  private get campoApellido(): Locator {
    return this.page.getByTestId("apellido");
  }

  private get campoCodigoPostal(): Locator {
    return this.page.getByTestId("cp");
  }

  private get campoCupon(): Locator {
    return this.page.getByTestId("cupon");
  }

  private get botonContinuar(): Locator {
    return this.page.getByTestId("continuar");
  }

  mensajeDeError(): Locator {
    return this.page.getByTestId("error");
  }

  async textoDelError(): Promise<string> {
    return (await this.mensajeDeError().innerText()).trim();
  }

  /** Llena solo los campos que se le pasen; los demás quedan como estén. */
  async llenar(datos: DatosDeEnvio): Promise<void> {
    if (datos.nombre !== undefined) await this.campoNombre.fill(datos.nombre);
    if (datos.apellido !== undefined) await this.campoApellido.fill(datos.apellido);
    if (datos.codigoPostal !== undefined) await this.campoCodigoPostal.fill(datos.codigoPostal);
    if (datos.cupon !== undefined) await this.campoCupon.fill(datos.cupon);
  }

  async continuar(): Promise<void> {
    await this.botonContinuar.click();
  }

  async enviar(datos: DatosDeEnvio): Promise<void> {
    await this.llenar(datos);
    await this.continuar();
  }

  async cancelar(): Promise<void> {
    await this.page.getByTestId("cancelar").click();
  }

  async sigueEnDatosDeEnvio(): Promise<boolean> {
    return this.botonContinuar.isVisible();
  }

  /**
   * Espera a que el formulario resuelva y devuelve el texto del error, o la
   * cadena vacía si la tienda pasó al resumen. Sirve para que una prueba del
   * camino feliz falle diciendo qué error apareció, en lugar de solo que la
   * navegación no ocurrió.
   */
  async errorTrasEnviar(timeout = 7_000): Promise<string> {
    const llegoAlResumen = await this.page
      .waitForURL(/\/resumen(\.html)?$/, { timeout })
      .then(() => true)
      .catch(() => false);
    return llegoAlResumen ? "" : this.textoDelError();
  }
}
