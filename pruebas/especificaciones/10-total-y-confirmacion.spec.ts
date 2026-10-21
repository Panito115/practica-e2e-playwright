import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";
import {
  PATRON_NUMERO_DE_PEDIDO,
  moneda,
  subtotalDe,
  totalesEsperados,
  type LineaDeCarrito,
} from "../especificacion/reglas.js";

/**
 * Reglas probadas: «Total» — Subtotal, menos el descuento, más el envío. Y
 * «Confirmación» — Confirmar la compra muestra un número de pedido de 6 dígitos
 * y deja el carrito vacío.
 *
 * Técnicas de diseño: PARTICIONES DE EQUIVALENCIA para el total, con un carrito
 * representativo de cada combinación de tramo de descuento y de envío, y
 * TRANSICIÓN DE ESTADOS para la confirmación (resumen → pedido confirmado →
 * carrito vacío).
 */
test.describe("Reglas «Total» y «Confirmación» | Técnicas: particiones de equivalencia y transición de estados", () => {
  const DATOS_BASE = { nombre: "Ana", apellido: "López" };

  const carritos: {
    titulo: string;
    lineas: LineaDeCarrito[];
    codigoPostal: string;
    cupon: string;
  }[] = [
    {
      titulo: "sin descuento y con envío de la capital",
      lineas: [{ producto: PRODUCTOS.filtros, cantidad: 3 }],
      codigoPostal: "01001",
      cupon: "",
    },
    {
      titulo: "sin descuento y con envío del interior",
      lineas: [{ producto: PRODUCTOS.taza, cantidad: 2 }],
      codigoPostal: "07001",
      cupon: "",
    },
    {
      titulo: "con 5 % de descuento y envío gratis por el umbral",
      lineas: [{ producto: PRODUCTOS.molino, cantidad: 1 }],
      codigoPostal: "07001",
      cupon: "",
    },
    {
      titulo: "con 5 % de descuento y envío cobrado",
      lineas: [
        { producto: PRODUCTOS.cafeAntigua, cantidad: 1 },
        { producto: PRODUCTOS.taza, cantidad: 1 },
      ],
      codigoPostal: "01001",
      cupon: "",
    },
    {
      titulo: "con 10 % de descuento y envío gratis",
      lineas: [{ producto: PRODUCTOS.molino, cantidad: 2 }],
      codigoPostal: "07001",
      cupon: "",
    },
    {
      titulo: "sin descuento y con envío gratis por el cupón",
      lineas: [{ producto: PRODUCTOS.cafeHuehuetenango, cantidad: 1 }],
      codigoPostal: "07001",
      cupon: "ENVIOGRATIS",
    },
  ];

  for (const { titulo, lineas, codigoPostal, cupon } of carritos) {
    test(`total de un carrito ${titulo}`, async ({ tiendaConSesion }) => {
      const esperado = totalesEsperados(lineas, codigoPostal, cupon);

      await tiendaConSesion.irAlResumen(lineas, { ...DATOS_BASE, codigoPostal, cupon });
      const mostrado = await tiendaConSesion.resumen.totalesMostrados();

      expect(
        mostrado.subtotal,
        `Regla «Total»: el subtotal tiene que ser ${moneda(esperado.subtotal)}.`
      ).toBeCloseTo(esperado.subtotal, 2);
      expect(
        mostrado.porcentajeDescuento,
        `Regla «Descuento»: el porcentaje tiene que ser ${esperado.porcentajeDescuento} %.`
      ).toBe(esperado.porcentajeDescuento);
      expect(
        mostrado.descuento,
        `Regla «Descuento»: el descuento tiene que ser ${moneda(esperado.descuento)}.`
      ).toBeCloseTo(esperado.descuento, 2);
      expect(
        mostrado.envio,
        `Regla «Envío»: el envío tiene que ser ${moneda(esperado.envio)}.`
      ).toBeCloseTo(esperado.envio, 2);
      expect(
        mostrado.total,
        `Regla «Total»: subtotal menos descuento más envío tiene que dar ${moneda(esperado.total)}.`
      ).toBeCloseTo(esperado.total, 2);
    });
  }

  test("el total mostrado es exactamente subtotal menos descuento más envío", async ({
    tiendaConSesion,
  }) => {
    const lineas: LineaDeCarrito[] = [
      { producto: PRODUCTOS.prensa, cantidad: 1 },
      { producto: PRODUCTOS.filtros, cantidad: 2 },
    ];

    await tiendaConSesion.irAlResumen(lineas, { ...DATOS_BASE, codigoPostal: "02001" });
    const mostrado = await tiendaConSesion.resumen.totalesMostrados();

    expect(
      mostrado.total,
      "Regla «Total»: el total tiene que cuadrar con los otros tres valores del propio resumen."
    ).toBeCloseTo(mostrado.subtotal - mostrado.descuento + mostrado.envio, 2);
  });

  test("el resumen lista cada producto con su cantidad y su total de línea", async ({
    tiendaConSesion,
  }) => {
    const lineas: LineaDeCarrito[] = [
      { producto: PRODUCTOS.cafeHuehuetenango, cantidad: 2 },
      { producto: PRODUCTOS.taza, cantidad: 3 },
    ];

    await tiendaConSesion.irAlResumen(lineas, { ...DATOS_BASE, codigoPostal: "01001" });

    const esperadas = lineas.map(
      ({ producto, cantidad }) =>
        `${cantidad} x ${producto.nombre}: ${moneda(producto.precio * cantidad)}`
    );
    expect(
      (await tiendaConSesion.resumen.lineasDelPedido()).sort(),
      "Regla «Total»: el resumen tiene que listar cada producto con su cantidad y su total de línea."
    ).toEqual(esperadas.sort());
    expect(
      await tiendaConSesion.resumen.subtotalMostrado(),
      "Regla «Total»: el subtotal del resumen es la suma de las líneas."
    ).toBe(subtotalDe(lineas));
  });

  test("confirmar la compra muestra un número de pedido de 6 dígitos", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.irAlResumen([{ producto: PRODUCTOS.prensa, cantidad: 1 }], {
      ...DATOS_BASE,
      codigoPostal: "01001",
    });

    await tiendaConSesion.resumen.confirmarCompra();
    await tiendaConSesion.confirmacion.esperarAEstarVisible();

    await expect(
      tiendaConSesion.confirmacion.numeroDePedido(),
      "Regla «Confirmación»: el número de pedido tiene que tener 6 dígitos."
    ).toHaveText(PATRON_NUMERO_DE_PEDIDO);
  });

  test("confirmar la compra deja el carrito vacío", async ({ tiendaConSesion }) => {
    await tiendaConSesion.irAlResumen(
      [
        { producto: PRODUCTOS.prensa, cantidad: 2 },
        { producto: PRODUCTOS.filtros, cantidad: 1 },
      ],
      { ...DATOS_BASE, codigoPostal: "01001" }
    );

    await tiendaConSesion.resumen.confirmarCompra();
    await tiendaConSesion.confirmacion.esperarAEstarVisible();

    await expect(
      tiendaConSesion.confirmacion.contadorDeUnidades(),
      "Regla «Confirmación»: después de confirmar, el contador tiene que estar en 0."
    ).toHaveText("0");

    await tiendaConSesion.confirmacion.irAlCarrito();
    await tiendaConSesion.carrito.esperarAEstarVisible();

    await expect(
      tiendaConSesion.carrito.productosEnElCarrito(),
      "Regla «Confirmación»: confirmar la compra tiene que dejar el carrito vacío."
    ).toHaveCount(0);
    await expect(
      tiendaConSesion.carrito.avisoDeCarritoVacio(),
      "Regla «Confirmación»: el carrito tiene que avisar que está vacío."
    ).toBeVisible();
  });

  test("una segunda compra vuelve a generar un número de pedido de 6 dígitos", async ({ tiendaConSesion }) => {
    await tiendaConSesion.irAlResumen([{ producto: PRODUCTOS.taza, cantidad: 1 }], {
      ...DATOS_BASE,
      codigoPostal: "01001",
    });
    await tiendaConSesion.resumen.confirmarCompra();
    await tiendaConSesion.confirmacion.esperarAEstarVisible();
    const primero = await tiendaConSesion.confirmacion.textoDelNumeroDePedido();

    await tiendaConSesion.confirmacion.volverAlCatalogo();
    await tiendaConSesion.catalogo.esperarAEstarVisible();
    await tiendaConSesion.irAlResumen([{ producto: PRODUCTOS.filtros, cantidad: 1 }], {
      ...DATOS_BASE,
      codigoPostal: "01001",
    });
    await tiendaConSesion.resumen.confirmarCompra();
    await tiendaConSesion.confirmacion.esperarAEstarVisible();
    const segundo = await tiendaConSesion.confirmacion.textoDelNumeroDePedido();

    expect(
      primero,
      "Regla «Confirmación»: el número de pedido tiene 6 dígitos."
    ).toMatch(PATRON_NUMERO_DE_PEDIDO);
    expect(
      segundo,
      "Regla «Confirmación»: el número de pedido tiene 6 dígitos."
    ).toMatch(PATRON_NUMERO_DE_PEDIDO);
  });
});
