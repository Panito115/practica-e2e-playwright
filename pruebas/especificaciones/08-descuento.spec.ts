import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";
import {
  montoDescuento,
  porcentajeDescuento,
  subtotalDe,
  type LineaDeCarrito,
} from "../especificacion/reglas.js";

/**
 * Regla probada: «Descuento» — Subtotal menor de Q200, sin descuento. De Q200 a
 * Q499, 5 %. De Q500 en adelante, 10 %.
 *
 * Técnica de diseño: ANÁLISIS DE VALORES LÍMITE sobre los dos límites del
 * rango (Q200 y Q500), con un valor dentro de cada partición y los valores
 * pegados a cada límite por abajo y por arriba.
 *
 * Nota sobre los límites: todos los precios del catálogo son múltiplos de Q5,
 * así que el subtotal también lo es. Q195 y Q495 son los subtotales alcanzables
 * más cercanos por debajo de Q200 y de Q500.
 */
test.describe("Regla «Descuento» | Técnica: análisis de valores límite", () => {
  /**
   * | Subtotal | Clase                                      | % esperado |
   * |----------|--------------------------------------------|------------|
   * | Q25      | muy por debajo de Q200                     | 0 %        |
   * | Q195     | pegado por debajo del límite de Q200       | 0 %        |
   * | Q200     | el límite inferior del tramo de 5 %        | 5 %        |
   * | Q350     | dentro del tramo de 5 %                    | 5 %        |
   * | Q495     | pegado por debajo del límite de Q500       | 5 %        |
   * | Q500     | el límite inferior del tramo de 10 %       | 10 %       |
   * | Q505     | pegado por encima del límite de Q500       | 10 %       |
   * | Q700     | muy por encima de Q500                     | 10 %       |
   */
  const casos: { subtotal: number; clase: string; porcentaje: number; lineas: LineaDeCarrito[] }[] = [
    {
      subtotal: 25,
      clase: "muy por debajo de Q200",
      porcentaje: 0,
      lineas: [{ producto: PRODUCTOS.filtros, cantidad: 1 }],
    },
    {
      subtotal: 195,
      clase: "pegado por debajo del límite de Q200",
      porcentaje: 0,
      lineas: [
        { producto: PRODUCTOS.cafeHuehuetenango, cantidad: 1 },
        { producto: PRODUCTOS.taza, cantidad: 2 },
      ],
    },
    {
      subtotal: 200,
      clase: "el límite inferior del tramo de 5 %",
      porcentaje: 5,
      lineas: [
        { producto: PRODUCTOS.cafeAntigua, cantidad: 1 },
        { producto: PRODUCTOS.taza, cantidad: 1 },
      ],
    },
    {
      subtotal: 350,
      clase: "dentro del tramo de 5 %",
      porcentaje: 5,
      lineas: [{ producto: PRODUCTOS.molino, cantidad: 1 }],
    },
    {
      subtotal: 495,
      clase: "pegado por debajo del límite de Q500",
      porcentaje: 5,
      lineas: [
        { producto: PRODUCTOS.cafeHuehuetenango, cantidad: 1 },
        { producto: PRODUCTOS.cafeAntigua, cantidad: 3 },
      ],
    },
    {
      subtotal: 500,
      clase: "el límite inferior del tramo de 10 %",
      porcentaje: 10,
      lineas: [
        { producto: PRODUCTOS.molino, cantidad: 1 },
        { producto: PRODUCTOS.cafeHuehuetenango, cantidad: 2 },
      ],
    },
    {
      subtotal: 505,
      clase: "pegado por encima del límite de Q500",
      porcentaje: 10,
      lineas: [
        { producto: PRODUCTOS.cafeAntigua, cantidad: 2 },
        { producto: PRODUCTOS.prensa, cantidad: 1 },
      ],
    },
    {
      subtotal: 700,
      clase: "muy por encima de Q500",
      porcentaje: 10,
      lineas: [{ producto: PRODUCTOS.molino, cantidad: 2 }],
    },
  ];

  for (const { subtotal, clase, porcentaje, lineas } of casos) {
    test(`subtotal Q${subtotal} (${clase}) aplica ${porcentaje} % de descuento`, async ({
      tiendaConSesion,
    }) => {
      // El caso de prueba se construye desde la especificación, no desde la tienda.
      expect(subtotalDe(lineas), "El carrito del caso tiene que dar el subtotal buscado.").toBe(
        subtotal
      );
      expect(porcentajeDescuento(subtotal)).toBe(porcentaje);

      await tiendaConSesion.irAlResumen(lineas, {
        nombre: "Ana",
        apellido: "López",
        codigoPostal: "01001",
      });

      expect(
        await tiendaConSesion.resumen.subtotalMostrado(),
        `Regla «Total»: el subtotal del resumen tiene que ser Q${subtotal}.`
      ).toBe(subtotal);
      expect(
        await tiendaConSesion.resumen.porcentajeDescuentoMostrado(),
        `Regla «Descuento»: con un subtotal de Q${subtotal} el descuento tiene que ser de ${porcentaje} %.`
      ).toBe(porcentaje);
      expect(
        await tiendaConSesion.resumen.descuentoMostrado(),
        `Regla «Descuento»: con un subtotal de Q${subtotal} el descuento tiene que ser de Q${montoDescuento(
          subtotal
        ).toFixed(2)}.`
      ).toBeCloseTo(montoDescuento(subtotal), 2);
    });
  }
});
