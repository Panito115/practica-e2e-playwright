import { test, expect } from "../soporte/fixtures.js";
import { ORDEN } from "../paginas/PaginaCatalogo.js";
import { PRECIOS_ASCENDENTES, PRECIOS_DESCENDENTES, PRODUCTOS } from "../especificacion/productos.js";
import { USUARIOS } from "../especificacion/usuarios.js";

/**
 * Reglas probadas: «Catálogo», «Carrito» y «Datos de envío», con el usuario
 * `problema`.
 *
 * Técnica de diseño: PARTICIONES DE EQUIVALENCIA sobre el usuario. El README
 * define cuatro clases de usuario y dice que `problema` entra, así que para él
 * valen exactamente las mismas reglas que para `estandar`: la especificación no
 * tiene excepciones por usuario. Estas pruebas repiten contra `problema` las
 * reglas del catálogo, del carrito y del pago.
 */
test.describe("Usuario `problema` | Técnica: particiones de equivalencia por clase de usuario", () => {
  test.beforeEach(async ({ tienda }) => {
    await tienda.entrarComo(USUARIOS.problema);
  });

  test("el usuario problema entra al catálogo", async ({ tienda }) => {
    await expect(
      tienda.catalogo.productos(),
      "Regla «Ingreso»: el usuario problema entra, así que tiene que ver el catálogo."
    ).toHaveCount(6);
  });

  test("ordena el catálogo por precio de menor a mayor", async ({ tienda }) => {
    await tienda.catalogo.ordenarPor(ORDEN.precioAscendente);

    expect(
      await tienda.catalogo.preciosEnPantalla(),
      "Regla «Catálogo»: el catálogo se ordena por precio de menor a mayor para cualquier usuario."
    ).toEqual([...PRECIOS_ASCENDENTES]);
  });

  test("ordena el catálogo por precio de mayor a menor", async ({ tienda }) => {
    await tienda.catalogo.ordenarPor(ORDEN.precioDescendente);

    expect(
      await tienda.catalogo.preciosEnPantalla(),
      "Regla «Catálogo»: el catálogo se ordena por precio de mayor a menor para cualquier usuario."
    ).toEqual([...PRECIOS_DESCENDENTES]);
  });

  test("agregar «Taza de barro» mete esa taza en el carrito", async ({ tienda }) => {
    await tienda.catalogo.agregar(PRODUCTOS.taza);
    await tienda.catalogo.irAlCarrito();
    await tienda.carrito.esperarAEstarVisible();

    await expect(
      tienda.carrito.productosEnElCarrito(),
      "Regla «Carrito»: al agregar un producto el carrito tiene que tener una sola línea."
    ).toHaveCount(1);
    expect(
      await tienda.carrito.nombresEnElCarrito(),
      "Regla «Carrito»: al agregar «Taza de barro» el carrito tiene que contener ese producto y no otro."
    ).toEqual([PRODUCTOS.taza.nombre]);
    await expect(
      tienda.carrito.filaDe(PRODUCTOS.taza),
      "Regla «Carrito»: el carrito tiene que tener la línea de «Taza de barro»."
    ).toHaveCount(1);
  });

  test("completa los datos de envío con nombre, apellido y código postal válidos", async ({
    tienda,
  }) => {
    await tienda.irADatosDeEnvio([{ producto: PRODUCTOS.prensa, cantidad: 1 }]);
    await tienda.datosDeEnvio.enviar({
      nombre: "Ana",
      apellido: "López",
      codigoPostal: "01001",
    });

    expect(
      await tienda.datosDeEnvio.errorTrasEnviar(),
      "Regla «Datos de envío»: con nombre, apellido y código postal válidos la tienda tiene que pasar al resumen sin error."
    ).toBe("");
  });

});
