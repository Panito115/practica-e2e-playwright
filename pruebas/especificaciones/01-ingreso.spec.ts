import { test, expect } from "../soporte/fixtures.js";
import { CLAVE_VALIDA, USUARIOS } from "../especificacion/usuarios.js";

/**
 * Regla probada: «Ingreso» — El usuario y la contraseña son obligatorios. Si
 * falta uno, si no coinciden o si el usuario está bloqueado, la tienda muestra
 * un mensaje de error y no deja entrar.
 *
 * Técnica de diseño: TABLA DE DECISIÓN sobre cuatro condiciones (usuario
 * escrito, contraseña escrita, credenciales que coinciden y usuario bloqueado),
 * más PARTICIONES DE EQUIVALENCIA en el campo de usuario (existente frente a
 * inexistente).
 */
test.describe("Regla «Ingreso» | Técnica: tabla de decisión", () => {
  /**
   * | # | ¿Usuario? | ¿Contraseña? | ¿Coinciden? | ¿Bloqueado? | Acción esperada |
   * |---|-----------|--------------|-------------|-------------|-----------------|
   * | 1 | sí        | sí           | sí          | no          | entra al catálogo |
   * | 2 | no        | sí           | —           | —           | error, no entra |
   * | 3 | sí        | no           | —           | —           | error, no entra |
   * | 4 | no        | no           | —           | —           | error, no entra |
   * | 5 | sí        | sí           | no (usuario)| —           | error, no entra |
   * | 6 | sí        | sí           | no (clave)  | —           | error, no entra |
   * | 7 | sí        | sí           | sí          | sí          | error, no entra |
   */
  const casosQueNoDejanEntrar = [
    { caso: 2, titulo: "sin usuario y con contraseña válida", usuario: "", clave: CLAVE_VALIDA },
    { caso: 3, titulo: "con usuario válido y sin contraseña", usuario: USUARIOS.estandar, clave: "" },
    { caso: 4, titulo: "sin usuario y sin contraseña", usuario: "", clave: "" },
    { caso: 5, titulo: "con un usuario que no existe", usuario: "inexistente", clave: CLAVE_VALIDA },
    { caso: 6, titulo: "con contraseña incorrecta", usuario: USUARIOS.estandar, clave: "incorrecta" },
    { caso: 7, titulo: "con el usuario bloqueado", usuario: USUARIOS.bloqueado, clave: CLAVE_VALIDA },
  ];

  test("caso 1: el usuario estandar con su contraseña entra al catálogo", async ({ tienda }) => {
    await tienda.ingreso.abrir();
    await tienda.ingreso.ingresarComo(USUARIOS.estandar);

    await tienda.catalogo.esperarAEstarVisible();
    await expect(
      tienda.catalogo.productos(),
      'Regla «Ingreso»: con credenciales válidas la tienda tiene que dejar entrar al catálogo.'
    ).toHaveCount(6);
  });

  for (const { caso, titulo, usuario, clave } of casosQueNoDejanEntrar) {
    test(`caso ${caso}: ${titulo} muestra error y no deja entrar`, async ({ tienda }) => {
      await tienda.ingreso.abrir();
      await tienda.ingreso.ingresarCon(usuario, clave);

      await expect(
        tienda.ingreso.mensajeDeError(),
        'Regla «Ingreso»: la tienda tiene que mostrar un mensaje de error.'
      ).not.toBeEmpty();
      await expect(
        tienda.ingreso.botonIngresar,
        'Regla «Ingreso»: la tienda no tiene que dejar entrar; debería seguir en el ingreso.'
      ).toBeVisible();
    });
  }

  test("el usuario bloqueado no entra ni con la contraseña correcta", async ({ tienda }) => {
    await tienda.ingreso.abrir();
    await tienda.ingreso.ingresarComo(USUARIOS.bloqueado);

    await expect(
      tienda.ingreso.mensajeDeError(),
      'Regla «Ingreso»: un usuario bloqueado tiene que recibir un mensaje de error.'
    ).not.toBeEmpty();
    expect(
      await tienda.ingreso.sigueEnElIngreso(),
      'Regla «Ingreso»: un usuario bloqueado no tiene que llegar al catálogo.'
    ).toBe(true);
  });
});
