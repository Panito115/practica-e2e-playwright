import type { Locator } from "@playwright/test";
import { PaginaBase } from "./PaginaBase.js";
import { CLAVE_VALIDA, type Usuario } from "../especificacion/usuarios.js";

/** Página de ingreso (`index.html`). Regla «Ingreso». */
export class PaginaIngreso extends PaginaBase {
  readonly ruta = "/";
  readonly patronDeUrl = /\/(index\.html)?(\?.*)?$/;

  get campoUsuario(): Locator {
    return this.page.getByTestId("usuario");
  }

  get campoClave(): Locator {
    return this.page.getByTestId("clave");
  }

  get botonIngresar(): Locator {
    return this.page.getByTestId("ingresar");
  }

  /** Mensaje de error del formulario de ingreso. */
  mensajeDeError(): Locator {
    return this.page.getByTestId("error");
  }

  async textoDelError(): Promise<string> {
    return (await this.mensajeDeError().innerText()).trim();
  }

  /** Escribe las credenciales que se le pasen y envía el formulario. */
  async ingresarCon(usuario: string, clave: string): Promise<void> {
    await this.campoUsuario.fill(usuario);
    await this.campoClave.fill(clave);
    await this.botonIngresar.click();
  }

  /** Ingresa con un usuario de prueba y la contraseña válida. */
  async ingresarComo(usuario: Usuario): Promise<void> {
    await this.ingresarCon(usuario, CLAVE_VALIDA);
  }

  async sigueEnElIngreso(): Promise<boolean> {
    return this.botonIngresar.isVisible();
  }
}
