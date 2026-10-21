import type { Locator } from "@playwright/test";
import { PaginaBase } from "./PaginaBase.js";
import type { Totales } from "../especificacion/reglas.js";

/** Página de resumen (`resumen.html`). Reglas «Descuento», «Envío» y «Total». */
export class PaginaResumen extends PaginaBase {
  readonly ruta = "/resumen";
  readonly patronDeUrl = /\/resumen(\.html)?$/;

  private get botonConfirmar(): Locator {
    return this.page.getByTestId("confirmar");
  }

  /** Líneas del pedido, en el formato «2 x Taza de barro: Q120.00». */
  async lineasDelPedido(): Promise<string[]> {
    const textos = await this.page.getByTestId("lineas").locator("li").allInnerTexts();
    return textos.map((t) => t.trim());
  }

  async subtotalMostrado(): Promise<number> {
    return PaginaBase.aMonto(await this.page.getByTestId("subtotal").innerText());
  }

  async porcentajeDescuentoMostrado(): Promise<number> {
    return Number((await this.page.getByTestId("descuento-pct").innerText()).trim());
  }

  async descuentoMostrado(): Promise<number> {
    return PaginaBase.aMonto(await this.page.getByTestId("descuento").innerText());
  }

  async envioMostrado(): Promise<number> {
    return PaginaBase.aMonto(await this.page.getByTestId("envio").innerText());
  }

  async totalMostrado(): Promise<number> {
    return PaginaBase.aMonto(await this.page.getByTestId("total").innerText());
  }

  /** Los cinco valores del resumen, listos para comparar con el oráculo. */
  async totalesMostrados(): Promise<Totales> {
    return {
      subtotal: await this.subtotalMostrado(),
      porcentajeDescuento: await this.porcentajeDescuentoMostrado(),
      descuento: await this.descuentoMostrado(),
      envio: await this.envioMostrado(),
      total: await this.totalMostrado(),
    };
  }

  async confirmarCompra(): Promise<void> {
    await this.botonConfirmar.click();
  }

  async cancelar(): Promise<void> {
    await this.page.getByTestId("cancelar").click();
  }
}
