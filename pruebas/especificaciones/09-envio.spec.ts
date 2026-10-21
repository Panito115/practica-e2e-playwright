import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";
import {
  CUPON_ENVIO_GRATIS,
  ENVIO_CAPITAL,
  ENVIO_INTERIOR,
  costoEnvio,
  subtotalConDescuento,
  subtotalDe,
  type LineaDeCarrito,
} from "../especificacion/reglas.js";

/**
 * Reglas probadas: «Envío» — Q25 si el código postal empieza con `01` (Ciudad
 * de Guatemala), y Q40 en cualquier otro caso. Y «Envío gratis» — El envío
 * cuesta Q0 si el subtotal con descuento es de Q300 o más, o si se usa el cupón
 * `ENVIOGRATIS`. El cupón vale para cualquier código postal.
 *
 * Técnica de diseño: TABLA DE DECISIÓN sobre tres condiciones independientes
 * (código postal de la capital, subtotal con descuento de Q300 o más y cupón
 * `ENVIOGRATIS`), más ANÁLISIS DE VALORES LÍMITE sobre el umbral de Q300.
 */
test.describe("Reglas «Envío» y «Envío gratis» | Técnica: tabla de decisión", () => {
  const DATOS_BASE = { nombre: "Ana", apellido: "López" };

  /** Subtotal Q120, sin descuento: la base queda muy por debajo de Q300. */
  const CARRITO_BARATO: LineaDeCarrito[] = [{ producto: PRODUCTOS.taza, cantidad: 2 }];
  /** Subtotal Q350 con 5 % de descuento: la base queda en Q332.50, sobre Q300. */
  const CARRITO_CARO: LineaDeCarrito[] = [{ producto: PRODUCTOS.molino, cantidad: 1 }];

  /**
   * | # | ¿CP empieza con 01? | ¿Base ≥ Q300? | ¿Cupón ENVIOGRATIS? | Envío esperado |
   * |---|---------------------|---------------|---------------------|----------------|
   * | 1 | sí                  | no            | no                  | Q25            |
   * | 2 | no                  | no            | no                  | Q40            |
   * | 3 | sí                  | sí            | no                  | Q0             |
   * | 4 | no                  | sí            | no                  | Q0             |
   * | 5 | sí                  | no            | sí                  | Q0             |
   * | 6 | no                  | no            | sí                  | Q0             |
   * | 7 | no                  | sí            | sí                  | Q0             |
   */
  const casos: {
    caso: number;
    descripcion: string;
    lineas: LineaDeCarrito[];
    codigoPostal: string;
    cupon: string;
    envio: number;
  }[] = [
    {
      caso: 1,
      descripcion: "CP de la capital, base bajo el umbral y sin cupón",
      lineas: CARRITO_BARATO,
      codigoPostal: "01001",
      cupon: "",
      envio: ENVIO_CAPITAL,
    },
    {
      caso: 2,
      descripcion: "CP del interior, base bajo el umbral y sin cupón",
      lineas: CARRITO_BARATO,
      codigoPostal: "07001",
      cupon: "",
      envio: ENVIO_INTERIOR,
    },
    {
      caso: 3,
      descripcion: "CP de la capital, base sobre el umbral y sin cupón",
      lineas: CARRITO_CARO,
      codigoPostal: "01001",
      cupon: "",
      envio: 0,
    },
    {
      caso: 4,
      descripcion: "CP del interior, base sobre el umbral y sin cupón",
      lineas: CARRITO_CARO,
      codigoPostal: "07001",
      cupon: "",
      envio: 0,
    },
    {
      caso: 5,
      descripcion: "CP de la capital, base bajo el umbral y con cupón",
      lineas: CARRITO_BARATO,
      codigoPostal: "01001",
      cupon: CUPON_ENVIO_GRATIS,
      envio: 0,
    },
    {
      caso: 6,
      descripcion: "CP del interior, base bajo el umbral y con cupón",
      lineas: CARRITO_BARATO,
      codigoPostal: "07001",
      cupon: CUPON_ENVIO_GRATIS,
      envio: 0,
    },
    {
      caso: 7,
      descripcion: "CP del interior, base sobre el umbral y con cupón",
      lineas: CARRITO_CARO,
      codigoPostal: "07001",
      cupon: CUPON_ENVIO_GRATIS,
      envio: 0,
    },
  ];

  for (const { caso, descripcion, lineas, codigoPostal, cupon, envio } of casos) {
    test(`caso ${caso}: ${descripcion} cobra Q${envio} de envío`, async ({ tiendaConSesion }) => {
      const subtotal = subtotalDe(lineas);
      expect(
        costoEnvio(subtotal, codigoPostal, cupon),
        "El caso tiene que coincidir con la regla de envío de la especificación."
      ).toBe(envio);

      await tiendaConSesion.irAlResumen(lineas, { ...DATOS_BASE, codigoPostal, cupon });

      expect(
        await tiendaConSesion.resumen.envioMostrado(),
        `Reglas «Envío» y «Envío gratis»: con subtotal Q${subtotal} (base Q${subtotalConDescuento(
          subtotal
        ).toFixed(2)}), CP «${codigoPostal}» y cupón «${cupon}» el envío tiene que ser Q${envio}.`
      ).toBe(envio);
    });
  }

  test("el cupón ENVIOGRATIS vale para cualquier código postal", async ({ tiendaConSesion }) => {
    await tiendaConSesion.irAlResumen(CARRITO_BARATO, {
      ...DATOS_BASE,
      codigoPostal: "99999",
      cupon: "enviogratis",
    });

    expect(
      await tiendaConSesion.resumen.envioMostrado(),
      "Regla «Envío gratis»: el cupón ENVIOGRATIS vale para cualquier código postal, así que el envío tiene que ser Q0."
    ).toBe(0);
  });

  /**
   * Técnica: PARTICIONES DE EQUIVALENCIA sobre el prefijo del código postal.
   * `10100` contiene `01` pero no empieza con `01`, así que cae en la clase del
   * interior.
   */
  const prefijos = [
    { codigoPostal: "01001", clase: "empieza con 01", envio: ENVIO_CAPITAL },
    { codigoPostal: "01999", clase: "empieza con 01", envio: ENVIO_CAPITAL },
    { codigoPostal: "07001", clase: "no empieza con 01", envio: ENVIO_INTERIOR },
    { codigoPostal: "10100", clase: "contiene 01 pero no empieza con 01", envio: ENVIO_INTERIOR },
    { codigoPostal: "00101", clase: "contiene 01 pero no empieza con 01", envio: ENVIO_INTERIOR },
  ];

  for (const { codigoPostal, clase, envio } of prefijos) {
    test(`CP «${codigoPostal}» (${clase}) cobra Q${envio} de envío`, async ({ tiendaConSesion }) => {
      await tiendaConSesion.irAlResumen(CARRITO_BARATO, { ...DATOS_BASE, codigoPostal });

      expect(
        await tiendaConSesion.resumen.envioMostrado(),
        `Regla «Envío»: con el CP «${codigoPostal}» el envío tiene que ser Q${envio}.`
      ).toBe(envio);
    });
  }

  /**
   * Técnica: ANÁLISIS DE VALORES LÍMITE sobre el umbral de Q300 del subtotal con
   * descuento. Con 5 % de descuento, un subtotal de Q315 deja la base en Q299.25
   * (justo por debajo) y uno de Q320 la deja en Q304 (justo por encima). Son los
   * dos subtotales alcanzables más pegados al umbral.
   */
  const limitesDelUmbral: { subtotal: number; base: number; lineas: LineaDeCarrito[]; envio: number }[] = [
    {
      subtotal: 315,
      base: 299.25,
      envio: ENVIO_CAPITAL,
      lineas: [
        { producto: PRODUCTOS.cafeAntigua, cantidad: 1 },
        { producto: PRODUCTOS.cafeHuehuetenango, cantidad: 1 },
        { producto: PRODUCTOS.filtros, cantidad: 4 },
      ],
    },
    {
      subtotal: 320,
      base: 304,
      envio: 0,
      lineas: [
        { producto: PRODUCTOS.taza, cantidad: 3 },
        { producto: PRODUCTOS.cafeAntigua, cantidad: 1 },
      ],
    },
  ];

  for (const { subtotal, base, lineas, envio } of limitesDelUmbral) {
    test(`límite del umbral: subtotal Q${subtotal} deja la base en Q${base} y cobra Q${envio}`, async ({
      tiendaConSesion,
    }) => {
      expect(subtotalDe(lineas)).toBe(subtotal);
      expect(subtotalConDescuento(subtotal)).toBeCloseTo(base, 2);

      await tiendaConSesion.irAlResumen(lineas, { ...DATOS_BASE, codigoPostal: "01001" });

      expect(
        await tiendaConSesion.resumen.envioMostrado(),
        `Regla «Envío gratis»: con una base de Q${base} el envío tiene que ser Q${envio}.`
      ).toBe(envio);
    });
  }
});
