import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";
import { CANTIDAD_MAXIMA, CANTIDAD_MINIMA } from "../especificacion/reglas.js";

/**
 * Regla probada: «Cantidad» — Un número entero de 1 a 5 por producto. Con un
 * número fuera de ese rango, negativo o con decimales, la tienda muestra un
 * error y no deja continuar al pago.
 *
 * Técnica de diseño: ANÁLISIS DE VALORES LÍMITE sobre el rango [1, 5], con los
 * valores justo por debajo y por encima de cada límite, más PARTICIONES DE
 * EQUIVALENCIA para las clases inválidas que la regla nombra aparte: negativos
 * y decimales.
 */
test.describe("Regla «Cantidad» | Técnica: análisis de valores límite", () => {
  const producto = PRODUCTOS.cafeHuehuetenango;

  /**
   * | Valor | Clase                               | Esperado |
   * |-------|-------------------------------------|----------|
   * | -1    | negativo                            | error    |
   * |  0    | justo por debajo del límite inferior| error    |
   * |  1    | límite inferior                     | válido   |
   * |  3    | valor nominal dentro del rango      | válido   |
   * |  5    | límite superior                     | válido   |
   * |  6    | justo por encima del límite superior| error    |
   * | 10    | muy por encima del rango            | error    |
   * |  2.5  | decimal dentro del rango            | error    |
   * |  0.5  | decimal fuera del rango             | error    |
   */
  const valoresValidos = [
    { valor: CANTIDAD_MINIMA, clase: "límite inferior" },
    { valor: 3, clase: "valor nominal dentro del rango" },
    { valor: CANTIDAD_MAXIMA, clase: "límite superior" },
  ];

  const valoresInvalidos = [
    { valor: "-1", clase: "negativo" },
    { valor: "0", clase: "justo por debajo del límite inferior" },
    { valor: "6", clase: "justo por encima del límite superior" },
    { valor: "10", clase: "muy por encima del rango" },
    { valor: "2.5", clase: "decimal dentro del rango" },
    { valor: "0.5", clase: "decimal fuera del rango" },
  ];

  for (const { valor, clase } of valoresValidos) {
    test(`cantidad ${valor} (${clase}) se acepta y deja continuar al pago`, async ({
      tiendaConSesion,
    }) => {
      await tiendaConSesion.llenarCarrito([{ producto, cantidad: 1 }]);
      await tiendaConSesion.carrito.cambiarCantidadDe(producto, valor);

      await expect(
        tiendaConSesion.carrito.mensajeDeError(),
        `Regla «Cantidad»: ${valor} está dentro de 1 a 5, así que no tiene que haber error.`
      ).toBeEmpty();
      expect(
        await tiendaConSesion.carrito.totalDeLinea(producto),
        `Regla «Carrito»: el total de la línea con cantidad ${valor} es precio por cantidad.`
      ).toBe(producto.precio * valor);
      await expect(
        tiendaConSesion.carrito.botonDeContinuar(),
        `Regla «Cantidad»: con la cantidad ${valor} la tienda tiene que dejar continuar al pago.`
      ).toBeEnabled();
    });
  }

  for (const { valor, clase } of valoresInvalidos) {
    test(`cantidad ${valor} (${clase}) muestra error y no deja continuar al pago`, async ({
      tiendaConSesion,
    }) => {
      await tiendaConSesion.llenarCarrito([{ producto, cantidad: 1 }]);
      await tiendaConSesion.carrito.cambiarCantidadDe(producto, valor);

      await expect(
        tiendaConSesion.carrito.mensajeDeError(),
        `Regla «Cantidad»: con la cantidad ${valor} la tienda tiene que mostrar un error.`
      ).not.toBeEmpty();
      await expect(
        tiendaConSesion.carrito.botonDeContinuar(),
        `Regla «Cantidad»: con la cantidad ${valor} la tienda no tiene que dejar continuar al pago.`
      ).toBeDisabled();
    });
  }

  test("el error de cantidad desaparece al corregir el valor", async ({ tiendaConSesion }) => {
    await tiendaConSesion.llenarCarrito([{ producto, cantidad: 1 }]);

    await tiendaConSesion.carrito.cambiarCantidadDe(producto, 9);
    await expect(tiendaConSesion.carrito.mensajeDeError()).not.toBeEmpty();

    await tiendaConSesion.carrito.cambiarCantidadDe(producto, CANTIDAD_MAXIMA);

    await expect(
      tiendaConSesion.carrito.mensajeDeError(),
      "Regla «Cantidad»: al corregir la cantidad a un valor válido el error tiene que desaparecer."
    ).toBeEmpty();
    await expect(
      tiendaConSesion.carrito.botonDeContinuar(),
      "Regla «Cantidad»: al corregir la cantidad la tienda tiene que dejar continuar al pago."
    ).toBeEnabled();
  });

  test("la cantidad inválida se aplica por producto y no bloquea el resto del carrito", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.llenarCarrito([
      { producto, cantidad: 1 },
      { producto: PRODUCTOS.filtros, cantidad: 2 },
    ]);

    await tiendaConSesion.carrito.cambiarCantidadDe(producto, 7);

    await expect(
      tiendaConSesion.carrito.botonDeContinuar(),
      "Regla «Cantidad»: una cantidad fuera de rango no tiene que dejar continuar al pago."
    ).toBeDisabled();
    expect(
      await tiendaConSesion.carrito.cantidadDe(PRODUCTOS.filtros),
      "Regla «Cantidad»: la cantidad válida de otro producto no tiene que cambiar."
    ).toBe(2);
  });
});
