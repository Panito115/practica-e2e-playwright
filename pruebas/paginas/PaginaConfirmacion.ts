import type { Locator } from "@playwright/test";
import { PaginaBase } from "./PaginaBase.js";

/** Página de confirmación (`confirmacion.html`). Regla «Confirmación». */
export class PaginaConfirmacion extends PaginaBase {
  readonly ruta = "/confirmacion";
  readonly patronDeUrl = /\/confirmacion(\.html)?$/;

  numeroDePedido(): Locator {
    return this.page.getByTestId("pedido");
  }

  async textoDelNumeroDePedido(): Promise<string> {
    return (await this.numeroDePedido().innerText()).trim();
  }

  async volverAlCatalogo(): Promise<void> {
    await this.page.getByTestId("volver").click();
  }
}
