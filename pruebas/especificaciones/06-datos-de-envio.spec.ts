import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";

/**
 * Regla probada: «Datos de envío» — Nombre, apellido y código postal son
 * obligatorios. El código postal tiene exactamente 5 dígitos.
 *
 * Técnica de diseño: PARTICIONES DE EQUIVALENCIA para los tres campos
 * obligatorios (vacío frente a con valor) y ANÁLISIS DE VALORES LÍMITE sobre la
 * longitud del código postal (4, 5 y 6 dígitos), más la clase inválida de
 * caracteres que no son dígitos.
 */
test.describe("Regla «Datos de envío» | Técnicas: particiones de equivalencia y valores límite", () => {
  const CARRITO = [{ producto: PRODUCTOS.filtros, cantidad: 1 }];
  const DATOS_VALIDOS = { nombre: "Ana", apellido: "López", codigoPostal: "01001" };

  test.beforeEach(async ({ tiendaConSesion }) => {
    await tiendaConSesion.irADatosDeEnvio(CARRITO);
  });

  test("con nombre, apellido y código postal válidos pasa al resumen", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.datosDeEnvio.enviar(DATOS_VALIDOS);

    expect(
      await tiendaConSesion.datosDeEnvio.errorTrasEnviar(),
      "Regla «Datos de envío»: con los tres campos válidos la tienda tiene que pasar al resumen sin error."
    ).toBe("");
  });

  const camposObligatorios = [
    { campo: "nombre", datos: { ...DATOS_VALIDOS, nombre: "" } },
    { campo: "apellido", datos: { ...DATOS_VALIDOS, apellido: "" } },
    { campo: "código postal", datos: { ...DATOS_VALIDOS, codigoPostal: "" } },
  ];

  for (const { campo, datos } of camposObligatorios) {
    test(`partición inválida: sin ${campo} muestra error y no pasa al resumen`, async ({
      tiendaConSesion,
    }) => {
      await tiendaConSesion.datosDeEnvio.enviar(datos);

      await expect(
        tiendaConSesion.datosDeEnvio.mensajeDeError(),
        `Regla «Datos de envío»: ${campo} es obligatorio, así que tiene que mostrar un error.`
      ).not.toBeEmpty();
      expect(
        await tiendaConSesion.datosDeEnvio.sigueEnDatosDeEnvio(),
        `Regla «Datos de envío»: sin ${campo} la tienda no tiene que pasar al resumen.`
      ).toBe(true);
    });
  }

  test("solo espacios en el nombre cuenta como vacío", async ({ tiendaConSesion }) => {
    await tiendaConSesion.datosDeEnvio.enviar({ ...DATOS_VALIDOS, nombre: "   " });

    await expect(
      tiendaConSesion.datosDeEnvio.mensajeDeError(),
      "Regla «Datos de envío»: un nombre con solo espacios no cumple el campo obligatorio."
    ).not.toBeEmpty();
  });

  /**
   * | Código postal | Clase                                  | Esperado |
   * |---------------|----------------------------------------|----------|
   * | `0100`        | 4 dígitos, justo por debajo del límite | error    |
   * | `01001`       | 5 dígitos, el valor exacto             | válido   |
   * | `010011`      | 6 dígitos, justo por encima del límite | error    |
   * | `ABCDE`       | 5 caracteres que no son dígitos        | error    |
   * | `0100a`       | 5 caracteres, uno no es dígito         | error    |
   * | `01 01`       | 5 caracteres con un espacio            | error    |
   */
  const codigosPostalesInvalidos = [
    { cp: "0100", clase: "4 dígitos, justo por debajo del límite" },
    { cp: "010011", clase: "6 dígitos, justo por encima del límite" },
    { cp: "ABCDE", clase: "5 caracteres que no son dígitos" },
    { cp: "0100a", clase: "5 caracteres, uno no es dígito" },
    { cp: "01 01", clase: "5 caracteres con un espacio" },
  ];

  for (const { cp, clase } of codigosPostalesInvalidos) {
    test(`código postal «${cp}» (${clase}) muestra error`, async ({ tiendaConSesion }) => {
      await tiendaConSesion.datosDeEnvio.enviar({ ...DATOS_VALIDOS, codigoPostal: cp });

      await expect(
        tiendaConSesion.datosDeEnvio.mensajeDeError(),
        `Regla «Datos de envío»: el código postal tiene exactamente 5 dígitos, así que «${cp}» tiene que dar error.`
      ).not.toBeEmpty();
      expect(
        await tiendaConSesion.datosDeEnvio.sigueEnDatosDeEnvio(),
        `Regla «Datos de envío»: con el código postal «${cp}» la tienda no tiene que pasar al resumen.`
      ).toBe(true);
    });
  }

  for (const cp of ["01001", "99999", "00000"]) {
    test(`código postal «${cp}» (5 dígitos) se acepta`, async ({ tiendaConSesion }) => {
      await tiendaConSesion.datosDeEnvio.enviar({ ...DATOS_VALIDOS, codigoPostal: cp });

      expect(
        await tiendaConSesion.datosDeEnvio.errorTrasEnviar(),
        `Regla «Datos de envío»: «${cp}» tiene 5 dígitos, así que se tiene que aceptar y pasar al resumen.`
      ).toBe("");
    });
  }

  test("cancelar en datos de envío vuelve al carrito sin perder el carrito", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.datosDeEnvio.cancelar();
    await tiendaConSesion.carrito.esperarAEstarVisible();

    await expect(
      tiendaConSesion.carrito.productosEnElCarrito(),
      "Regla «Carrito»: cancelar el pago no tiene que vaciar el carrito."
    ).toHaveCount(1);
  });
});
