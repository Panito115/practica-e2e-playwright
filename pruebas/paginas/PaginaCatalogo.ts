import type { Locator } from "@playwright/test";
import { PaginaBase } from "./PaginaBase.js";
import type { Producto } from "../especificacion/productos.js";

/** Criterios de orden que ofrece la regla «Catálogo». */
export const ORDEN = {
  nombreAZ: "az",
  nombreZA: "za",
  precioAscendente: "precio-asc",
  precioDescendente: "precio-desc",
} as const;

export type CriterioDeOrden = (typeof ORDEN)[keyof typeof ORDEN];

/** Página de catálogo (`catalogo.html`). Reglas «Catálogo» y «Carrito». */
export class PaginaCatalogo extends PaginaBase {
  readonly ruta = "/catalogo";
  readonly patronDeUrl = /\/catalogo(\.html)?$/;

  private get selectorDeOrden(): Locator {
    return this.page.getByTestId("orden");
  }

  private get tarjetas(): Locator {
    return this.page.getByTestId("producto");
  }

  private tarjetaDe(producto: Producto): Locator {
    return this.page.locator(`[data-test="producto"][data-id="${producto.id}"]`);
  }

  private botonAgregarDe(producto: Producto): Locator {
    return this.page.getByTestId(`agregar-${producto.id}`);
  }

  private botonQuitarDe(producto: Producto): Locator {
    return this.page.getByTestId(`quitar-${producto.id}`);
  }

  /** Cuántos productos muestra el catálogo. */
  productos(): Locator {
    return this.tarjetas;
  }

  /** Valor del selector de orden, para comprobar el orden inicial. */
  async criterioDeOrdenSeleccionado(): Promise<string> {
    return this.selectorDeOrden.inputValue();
  }

  async ordenarPor(criterio: CriterioDeOrden): Promise<void> {
    await this.selectorDeOrden.selectOption(criterio);
  }

  /** Nombres de los productos en el orden en que el catálogo los pinta. */
  async nombresEnPantalla(): Promise<string[]> {
    const nombres = await this.tarjetas.locator("h2").allInnerTexts();
    return nombres.map((n) => n.trim());
  }

  /** Precios de los productos en el orden en que el catálogo los pinta. */
  async preciosEnPantalla(): Promise<number[]> {
    const textos = await this.tarjetas.getByTestId("precio").allInnerTexts();
    return textos.map((t) => PaginaBase.aMonto(t));
  }

  /** Precio que el catálogo muestra para un producto. */
  async precioDe(producto: Producto): Promise<number> {
    const texto = await this.tarjetaDe(producto).getByTestId("precio").innerText();
    return PaginaBase.aMonto(texto);
  }

  /** Regla «Carrito»: cada producto se agrega una vez desde el catálogo. */
  async agregar(producto: Producto): Promise<void> {
    await this.botonAgregarDe(producto).click();
  }

  async agregarVarios(productos: readonly Producto[]): Promise<void> {
    for (const producto of productos) await this.agregar(producto);
  }

  async quitar(producto: Producto): Promise<void> {
    await this.botonQuitarDe(producto).click();
  }

  /** El catálogo ofrece «Quitar» cuando el producto ya está en el carrito. */
  botonDeQuitar(producto: Producto): Locator {
    return this.botonQuitarDe(producto);
  }

  botonDeAgregar(producto: Producto): Locator {
    return this.botonAgregarDe(producto);
  }

  async estaEnElCarrito(producto: Producto): Promise<boolean> {
    return this.botonQuitarDe(producto).isVisible();
  }
}
