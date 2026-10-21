import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";
import { subtotalDe, unidadesTotales } from "../especificacion/reglas.js";

/**
 * Regla probada: «Carrito» — Cada producto se agrega una vez desde el catálogo,
 * y la cantidad se cambia en el carrito. El contador del encabezado muestra el
 * total de unidades.
 *
 * Técnica de diseño: TRANSICIÓN DE ESTADOS por producto (fuera del carrito →
 * dentro del carrito → fuera otra vez) y PARTICIONES DE EQUIVALENCIA sobre el
 * estado del carrito (vacío frente a con productos) para decidir si se puede
 * continuar al pago.
 */
test.describe("Regla «Carrito» | Técnica: transición de estados", () => {
  test("un producto se agrega una vez: el catálogo pasa a ofrecer «Quitar»", async ({
    tiendaConSesion,
  }) => {
    const { catalogo } = tiendaConSesion;

    await expect(
      catalogo.botonDeAgregar(PRODUCTOS.prensa),
      "Regla «Carrito»: antes de agregarlo, el producto tiene que ofrecer «Agregar al carrito»."
    ).toBeVisible();

    await catalogo.agregar(PRODUCTOS.prensa);

    await expect(
      catalogo.botonDeQuitar(PRODUCTOS.prensa),
      "Regla «Carrito»: cada producto se agrega una vez, así que después de agregarlo el catálogo tiene que ofrecer «Quitar»."
    ).toBeVisible();
    await expect(
      catalogo.contadorDeUnidades(),
      "Regla «Carrito»: el contador del encabezado tiene que mostrar 1 unidad."
    ).toHaveText("1");
  });

  test("quitar desde el catálogo devuelve el producto al estado inicial", async ({
    tiendaConSesion,
  }) => {
    const { catalogo } = tiendaConSesion;
    await catalogo.agregar(PRODUCTOS.taza);
    await catalogo.quitar(PRODUCTOS.taza);

    await expect(
      catalogo.botonDeAgregar(PRODUCTOS.taza),
      "Regla «Carrito»: al quitarlo, el producto vuelve a ofrecer «Agregar al carrito»."
    ).toBeVisible();
    await expect(
      catalogo.contadorDeUnidades(),
      "Regla «Carrito»: el contador tiene que volver a 0."
    ).toHaveText("0");
  });

  test("el contador del encabezado muestra el total de unidades, no de productos", async ({
    tiendaConSesion,
  }) => {
    const lineas = [
      { producto: PRODUCTOS.cafeHuehuetenango, cantidad: 3 },
      { producto: PRODUCTOS.filtros, cantidad: 2 },
      { producto: PRODUCTOS.taza, cantidad: 1 },
    ];

    await tiendaConSesion.llenarCarrito(lineas);

    await expect(
      tiendaConSesion.carrito.contadorDeUnidades(),
      `Regla «Carrito»: el contador tiene que mostrar ${unidadesTotales(lineas)} unidades.`
    ).toHaveText(String(unidadesTotales(lineas)));
  });

  test("la cantidad se cambia en el carrito y recalcula la línea y el subtotal", async ({
    tiendaConSesion,
  }) => {
    const lineas = [{ producto: PRODUCTOS.cafeAntigua, cantidad: 4 }];

    await tiendaConSesion.llenarCarrito(lineas);

    expect(
      await tiendaConSesion.carrito.cantidadDe(PRODUCTOS.cafeAntigua),
      "Regla «Carrito»: la cantidad se cambia en el carrito."
    ).toBe(4);
    expect(
      await tiendaConSesion.carrito.totalDeLinea(PRODUCTOS.cafeAntigua),
      "Regla «Carrito»: el total de la línea es precio por cantidad."
    ).toBe(PRODUCTOS.cafeAntigua.precio * 4);
    expect(
      await tiendaConSesion.carrito.subtotalMostrado(),
      "Regla «Total»: el subtotal es la suma de las líneas."
    ).toBe(subtotalDe(lineas));
  });

  test("quitar desde el carrito saca la línea y deja el carrito vacío", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.llenarCarrito([{ producto: PRODUCTOS.molino, cantidad: 2 }]);

    await tiendaConSesion.carrito.quitar(PRODUCTOS.molino);

    await expect(
      tiendaConSesion.carrito.productosEnElCarrito(),
      "Regla «Carrito»: al quitar el único producto, el carrito queda sin líneas."
    ).toHaveCount(0);
    await expect(
      tiendaConSesion.carrito.avisoDeCarritoVacio(),
      "Regla «Carrito»: el carrito vacío tiene que avisarlo."
    ).toBeVisible();
    await expect(
      tiendaConSesion.carrito.contadorDeUnidades(),
      "Regla «Carrito»: el contador tiene que volver a 0."
    ).toHaveText("0");
  });

  test("partición «carrito vacío»: no se puede continuar al pago", async ({ tiendaConSesion }) => {
    await tiendaConSesion.catalogo.irAlCarrito();
    await tiendaConSesion.carrito.esperarAEstarVisible();

    await expect(
      tiendaConSesion.carrito.botonDeContinuar(),
      "Regla «Carrito»: con el carrito vacío no se puede continuar al pago."
    ).toBeDisabled();
  });

  test("partición «carrito con productos»: se puede continuar al pago", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.llenarCarrito([{ producto: PRODUCTOS.filtros, cantidad: 1 }]);

    await expect(
      tiendaConSesion.carrito.botonDeContinuar(),
      "Regla «Carrito»: con productos en el carrito se tiene que poder continuar al pago."
    ).toBeEnabled();

    await tiendaConSesion.carrito.continuarAlPago();
    await expect
      .poll(
        async () => tiendaConSesion.datosDeEnvio.sigueEnDatosDeEnvio(),
        { message: "Regla «Carrito»: continuar al pago tiene que llevar a los datos de envío." }
      )
      .toBe(true);
  });

  test("las cantidades del carrito sobreviven al volver al catálogo", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.llenarCarrito([{ producto: PRODUCTOS.prensa, cantidad: 3 }]);

    await tiendaConSesion.catalogo.abrir();

    await expect(
      tiendaConSesion.catalogo.contadorDeUnidades(),
      "Regla «Carrito»: el contador tiene que seguir mostrando 3 unidades."
    ).toHaveText("3");
    await expect(
      tiendaConSesion.catalogo.botonDeQuitar(PRODUCTOS.prensa),
      "Regla «Carrito»: el producto ya agregado tiene que seguir ofreciendo «Quitar»."
    ).toBeVisible();
  });
});
