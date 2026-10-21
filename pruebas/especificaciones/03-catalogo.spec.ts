import { test, expect } from "../soporte/fixtures.js";
import { ORDEN } from "../paginas/PaginaCatalogo.js";
import {
  CATALOGO,
  NOMBRES_AZ,
  NOMBRES_ZA,
  PRECIOS_ASCENDENTES,
  PRECIOS_DESCENDENTES,
} from "../especificacion/productos.js";

/**
 * Regla probada: «Catálogo» — Se ordena por nombre (A a Z y Z a A) o por precio
 * (de menor a mayor y de mayor a menor). Al entrar, el orden es por nombre de A
 * a Z. Y la tabla de productos y precios del README.
 *
 * Técnica de diseño: PARTICIONES DE EQUIVALENCIA sobre el criterio de orden
 * —una clase por cada uno de los cuatro criterios, que son las únicas entradas
 * válidas del selector— más una prueba del VALOR POR DEFECTO al entrar.
 */
test.describe("Regla «Catálogo» | Técnica: particiones de equivalencia", () => {
  test("al entrar, el orden es por nombre de A a Z", async ({ tiendaConSesion }) => {
    expect(
      await tiendaConSesion.catalogo.criterioDeOrdenSeleccionado(),
      "Regla «Catálogo»: al entrar, el criterio seleccionado tiene que ser nombre A a Z."
    ).toBe(ORDEN.nombreAZ);

    expect(
      await tiendaConSesion.catalogo.nombresEnPantalla(),
      "Regla «Catálogo»: al entrar, el orden tiene que ser por nombre de A a Z."
    ).toEqual([...NOMBRES_AZ]);
  });

  test("partición «nombre A a Z»: ordena los nombres de A a Z", async ({ tiendaConSesion }) => {
    await tiendaConSesion.catalogo.ordenarPor(ORDEN.nombreAZ);

    expect(
      await tiendaConSesion.catalogo.nombresEnPantalla(),
      "Regla «Catálogo»: el orden por nombre A a Z está mal."
    ).toEqual([...NOMBRES_AZ]);
  });

  test("partición «nombre Z a A»: ordena los nombres de Z a A", async ({ tiendaConSesion }) => {
    await tiendaConSesion.catalogo.ordenarPor(ORDEN.nombreZA);

    expect(
      await tiendaConSesion.catalogo.nombresEnPantalla(),
      "Regla «Catálogo»: el orden por nombre Z a A está mal."
    ).toEqual([...NOMBRES_ZA]);
  });

  test("partición «precio de menor a mayor»: ordena los precios de forma ascendente", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.catalogo.ordenarPor(ORDEN.precioAscendente);

    expect(
      await tiendaConSesion.catalogo.preciosEnPantalla(),
      "Regla «Catálogo»: el orden por precio de menor a mayor está mal."
    ).toEqual([...PRECIOS_ASCENDENTES]);
  });

  test("partición «precio de mayor a menor»: ordena los precios de forma descendente", async ({
    tiendaConSesion,
  }) => {
    await tiendaConSesion.catalogo.ordenarPor(ORDEN.precioDescendente);

    expect(
      await tiendaConSesion.catalogo.preciosEnPantalla(),
      "Regla «Catálogo»: el orden por precio de mayor a menor está mal."
    ).toEqual([...PRECIOS_DESCENDENTES]);
  });

  test("el catálogo muestra los seis productos de la especificación", async ({ tiendaConSesion }) => {
    await expect(
      tiendaConSesion.catalogo.productos(),
      "Tabla de productos: el catálogo tiene que mostrar los seis productos."
    ).toHaveCount(CATALOGO.length);

    expect(
      (await tiendaConSesion.catalogo.nombresEnPantalla()).sort(),
      "Tabla de productos: los nombres del catálogo no coinciden con la especificación."
    ).toEqual(CATALOGO.map((p) => p.nombre).sort());
  });

  for (const producto of CATALOGO) {
    test(`el precio de «${producto.nombre}» es Q${producto.precio}`, async ({ tiendaConSesion }) => {
      expect(
        await tiendaConSesion.catalogo.precioDe(producto),
        `Tabla de productos: «${producto.nombre}» tiene que costar Q${producto.precio}.`
      ).toBe(producto.precio);
    });
  }
});
