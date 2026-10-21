import { test as base } from "@playwright/test";
import { Tienda } from "./Tienda.js";
import { USUARIOS } from "../especificacion/usuarios.js";

type Fixtures = {
  /** Los page objects de la tienda, sin sesión iniciada. */
  tienda: Tienda;
  /** Los page objects con el usuario `estandar` ya dentro del catálogo. */
  tiendaConSesion: Tienda;
};

/**
 * `test` de la suite. Entrega los page objects ya construidos para que las
 * pruebas no instancien nada ni toquen `page` directamente.
 */
export const test = base.extend<Fixtures>({
  tienda: async ({ page }, use) => {
    await use(new Tienda(page));
  },
  tiendaConSesion: async ({ page }, use) => {
    const tienda = new Tienda(page);
    await tienda.entrarComo(USUARIOS.estandar);
    await use(tienda);
  },
});

export { expect } from "@playwright/test";
