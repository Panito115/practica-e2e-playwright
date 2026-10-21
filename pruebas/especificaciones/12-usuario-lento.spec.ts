import { test, expect } from "../soporte/fixtures.js";
import { PRODUCTOS } from "../especificacion/productos.js";
import { USUARIOS } from "../especificacion/usuarios.js";

/**
 * Regla probada: «Ingreso», en la clase de usuario `lento`, que según el README
 * entra después de unos segundos.
 *
 * Técnica de diseño: PARTICIONES DE EQUIVALENCIA sobre la clase de usuario. El
 * retraso no es un defecto, así que la prueba lo absorbe con esperas por
 * condición (`waitForURL` y aserciones web-first), sin un solo
 * `waitForTimeout`.
 */
test.describe("Usuario `lento` | Técnica: particiones de equivalencia por clase de usuario", () => {
  const PLAZO_PARA_EL_INGRESO_LENTO = 15_000;

  test("el usuario lento entra al catálogo sin esperas fijas", async ({ tienda }) => {
    await tienda.entrarComo(USUARIOS.lento, PLAZO_PARA_EL_INGRESO_LENTO);

    await expect(
      tienda.catalogo.productos(),
      "Regla «Ingreso»: el usuario lento entra después de unos segundos, así que tiene que llegar al catálogo."
    ).toHaveCount(6);
  });

  test("el usuario lento completa una compra", async ({ tienda }) => {
    await tienda.entrarComo(USUARIOS.lento, PLAZO_PARA_EL_INGRESO_LENTO);

    await tienda.irAlResumen([{ producto: PRODUCTOS.cafeAntigua, cantidad: 2 }], {
      nombre: "Ana",
      apellido: "López",
      codigoPostal: "01001",
    });
    await tienda.resumen.confirmarCompra();
    await tienda.confirmacion.esperarAEstarVisible();

    await expect(
      tienda.confirmacion.numeroDePedido(),
      "Regla «Confirmación»: el usuario lento también tiene que poder confirmar su compra."
    ).toHaveText(/^\d{6}$/);
  });
});
