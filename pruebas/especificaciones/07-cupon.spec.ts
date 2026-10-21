import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";
import { ERROR_CUPON_INEXISTENTE } from "../especificacion/reglas.js";

/**
 * Regla probada: «Cupón» — Es opcional. El único cupón válido es `ENVIOGRATIS`,
 * en mayúsculas o en minúsculas. Los espacios al inicio y al final no cuentan.
 * Cualquier otro texto, incluido `ENVIOGRATIS` con letras de más, da el error
 * "El cupón no existe."
 *
 * Técnica de diseño: PARTICIONES DE EQUIVALENCIA sobre el texto del cupón. Las
 * clases válidas son: vacío (es opcional), `ENVIOGRATIS` en mayúsculas, en
 * minúsculas, en mayúsculas y minúsculas mezcladas y con espacios alrededor.
 * Las clases inválidas son: el cupón con letras de más, con letras de menos,
 * con un espacio en medio y cualquier otro texto.
 */
test.describe("Regla «Cupón» | Técnica: particiones de equivalencia", () => {
  const CARRITO = [{ producto: PRODUCTOS.filtros, cantidad: 1 }];
  const DATOS = { nombre: "Ana", apellido: "López", codigoPostal: "01001" };

  test.beforeEach(async ({ tiendaConSesion }) => {
    await tiendaConSesion.irADatosDeEnvio(CARRITO);
  });

  const cuponesAceptados = [
    { cupon: "", clase: "vacío: el cupón es opcional" },
    { cupon: "ENVIOGRATIS", clase: "en mayúsculas" },
    { cupon: "enviogratis", clase: "en minúsculas" },
    { cupon: "EnvioGratis", clase: "en mayúsculas y minúsculas mezcladas" },
    { cupon: "   ENVIOGRATIS   ", clase: "con espacios al inicio y al final" },
    { cupon: "  enviogratis ", clase: "en minúsculas y con espacios alrededor" },
  ];

  const cuponesRechazados = [
    { cupon: "ENVIOGRATISS", clase: "ENVIOGRATIS con una letra de más" },
    { cupon: "XENVIOGRATIS", clase: "ENVIOGRATIS con una letra de más al inicio" },
    { cupon: "ENVIOGRATI", clase: "ENVIOGRATIS con una letra de menos" },
    { cupon: "ENVIO GRATIS", clase: "ENVIOGRATIS con un espacio en medio" },
    { cupon: "DESCUENTO10", clase: "otro texto cualquiera" },
    { cupon: "0", clase: "un solo carácter que no es el cupón" },
  ];

  for (const { cupon, clase } of cuponesAceptados) {
    test(`cupón «${cupon}» (${clase}) se acepta y pasa al resumen`, async ({ tiendaConSesion }) => {
      await tiendaConSesion.datosDeEnvio.enviar({ ...DATOS, cupon });

      expect(
        await tiendaConSesion.datosDeEnvio.errorTrasEnviar(),
        `Regla «Cupón»: «${cupon}» tiene que aceptarse sin error y pasar al resumen.`
      ).toBe("");
    });
  }

  for (const { cupon, clase } of cuponesRechazados) {
    test(`cupón «${cupon}» (${clase}) da el error "El cupón no existe."`, async ({
      tiendaConSesion,
    }) => {
      await tiendaConSesion.datosDeEnvio.enviar({ ...DATOS, cupon });

      await expect(
        tiendaConSesion.datosDeEnvio.mensajeDeError(),
        `Regla «Cupón»: «${cupon}» no es el cupón válido, así que tiene que dar "${ERROR_CUPON_INEXISTENTE}".`
      ).toHaveText(ERROR_CUPON_INEXISTENTE);
      expect(
        await tiendaConSesion.datosDeEnvio.sigueEnDatosDeEnvio(),
        `Regla «Cupón»: con «${cupon}» la tienda no tiene que pasar al resumen.`
      ).toBe(true);
    });
  }
});
