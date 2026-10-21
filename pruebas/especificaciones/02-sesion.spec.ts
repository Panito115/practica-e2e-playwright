import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";

/**
 * Regla probada: «Sesión» — Sin sesión iniciada, cualquier página lleva al
 * ingreso. Cerrar sesión vacía el carrito.
 *
 * Técnica de diseño: TRANSICIÓN DE ESTADOS. La tienda tiene dos estados de
 * sesión (sin sesión y con sesión) y dos transiciones (ingresar y cerrar
 * sesión). Se prueba cada transición y, en el estado «sin sesión», el intento
 * de entrar directo a cada página protegida.
 */
test.describe("Regla «Sesión» | Técnica: transición de estados", () => {
  test.describe("estado «sin sesión»: toda página protegida lleva al ingreso", () => {
    const paginasProtegidas = ["catalogo", "carrito", "checkout", "resumen", "confirmacion"] as const;

    for (const nombre of paginasProtegidas) {
      test(`abrir /${nombre} sin sesión lleva al ingreso`, async ({ tienda }) => {
        const pagina = {
          catalogo: tienda.catalogo,
          carrito: tienda.carrito,
          checkout: tienda.datosDeEnvio,
          resumen: tienda.resumen,
          confirmacion: tienda.confirmacion,
        }[nombre];

        await pagina.abrir();

        await expect(
          tienda.ingreso.botonIngresar,
          `Regla «Sesión»: sin sesión iniciada, /${nombre} tiene que llevar al ingreso.`
        ).toBeVisible();
      });
    }
  });

  test("transición ingresar: el catálogo queda accesible y el carrito arranca vacío", async ({
    tiendaConSesion,
  }) => {
    await expect(
      tiendaConSesion.catalogo.contadorDeUnidades(),
      "Regla «Carrito»: una sesión nueva empieza con el carrito vacío."
    ).toHaveText("0");
  });

  test("transición cerrar sesión: vacía el carrito", async ({ tiendaConSesion }) => {
    await tiendaConSesion.catalogo.agregarVarios([PRODUCTOS.molino, PRODUCTOS.taza]);
    await expect(tiendaConSesion.catalogo.contadorDeUnidades()).toHaveText("2");

    await tiendaConSesion.catalogo.cerrarSesion();
    await tiendaConSesion.ingreso.esperarAEstarVisible();
    await tiendaConSesion.entrarComo("estandar");

    await expect(
      tiendaConSesion.catalogo.contadorDeUnidades(),
      "Regla «Sesión»: cerrar sesión tiene que vaciar el carrito."
    ).toHaveText("0");

    await tiendaConSesion.catalogo.irAlCarrito();
    await tiendaConSesion.carrito.esperarAEstarVisible();
    await expect(
      tiendaConSesion.carrito.productosEnElCarrito(),
      "Regla «Sesión»: después de cerrar sesión el carrito tiene que quedar sin líneas."
    ).toHaveCount(0);
  });

  test("transición cerrar sesión: deja el estado «sin sesión» y bloquea las páginas", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.catalogo.cerrarSesion();
    await tiendaConSesion.ingreso.esperarAEstarVisible();

    await tiendaConSesion.carrito.abrir();

    await expect(
      tiendaConSesion.ingreso.botonIngresar,
      "Regla «Sesión»: después de cerrar sesión las páginas tienen que llevar al ingreso."
    ).toBeVisible();
  });
});
