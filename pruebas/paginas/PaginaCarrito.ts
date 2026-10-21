import type { Locator } from "@playwright/test";
import { PaginaBase } from "./PaginaBase.js";
import type { Producto } from "../especificacion/productos.js";

/** Página del carrito (`carrito.html`). Reglas «Carrito» y «Cantidad». */
export class PaginaCarrito extends PaginaBase {
  readonly ruta = "/carrito";
  readonly patronDeUrl = /\/carrito(\.html)?$/;

  private get lineas(): Locator {
    return this.page.getByTestId("linea");
  }

  private lineaDe(producto: Producto): Locator {
    return this.page.locator(`[data-test="linea"][data-id="${producto.id}"]`);
  }

  private campoCantidadDe(producto: Producto): Locator {
    return this.page.getByTestId(`cantidad-${producto.id}`);
  }

  private get botonContinuar(): Locator {
    return this.page.getByTestId("continuar");
  }

  /** Filas del carrito, para contar productos. */
  productosEnElCarrito(): Locator {
    return this.lineas;
  }

  filaDe(producto: Producto): Locator {
    return this.lineaDe(producto);
  }

  /** Aviso de carrito vacío. */
  avisoDeCarritoVacio(): Locator {
    return this.page.getByTestId("vacio");
  }

  /** Mensaje de error de la validación de cantidad. */
  mensajeDeError(): Locator {
    return this.page.getByTestId("error");
  }

  async textoDelError(): Promise<string> {
    return (await this.mensajeDeError().innerText()).trim();
  }

  async nombresEnElCarrito(): Promise<string[]> {
    const nombres = await this.lineas.locator("td:first-child").allInnerTexts();
    return nombres.map((n) => n.trim());
  }

  async contieneA(producto: Producto): Promise<boolean> {
    return (await this.lineaDe(producto).count()) > 0;
  }

  async cantidadDe(producto: Producto): Promise<number> {
    return Number(await this.campoCantidadDe(producto).inputValue());
  }

  /**
   * Regla «Cantidad»: la cantidad se cambia en el carrito. Se escribe el valor
   * tal cual (incluidos decimales o negativos) para probar las particiones
   * inválidas, y se provoca el `change` saliendo del campo.
   */
  async cambiarCantidadDe(producto: Producto, valor: string | number): Promise<void> {
    const campo = this.campoCantidadDe(producto);
    await campo.fill(String(valor));
    await campo.blur();
  }

  /** Total de una línea: precio por cantidad. */
  async totalDeLinea(producto: Producto): Promise<number> {
    const texto = await this.lineaDe(producto).getByTestId("total-linea").innerText();
    return PaginaBase.aMonto(texto);
  }

  async subtotalMostrado(): Promise<number> {
    return PaginaBase.aMonto(await this.page.getByTestId("subtotal").innerText());
  }

  async quitar(producto: Producto): Promise<void> {
    await this.lineaDe(producto).getByTestId(`quitar-${producto.id}`).click();
  }

  /** Botón «Continuar al pago», para comprobar si la tienda deja avanzar. */
  botonDeContinuar(): Locator {
    return this.botonContinuar;
  }

  async puedeContinuarAlPago(): Promise<boolean> {
    return this.botonContinuar.isEnabled();
  }

  async continuarAlPago(): Promise<void> {
    await this.botonContinuar.click();
  }
}
