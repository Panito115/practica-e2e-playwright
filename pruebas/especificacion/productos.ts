/**
 * Catálogo de la tienda tal como lo define la tabla de productos del README.
 *
 * Esta es la fuente de verdad para nombres y precios: las pruebas comparan la
 * tienda contra estos datos y no contra lo que la tienda muestre hoy.
 */
export type Producto = {
  /** Identificador que la tienda usa en sus atributos `data-test`. */
  readonly id: string;
  readonly nombre: string;
  readonly precio: number;
};

export const PRODUCTOS = {
  cafeHuehuetenango: { id: "cafe-250", nombre: "Café de Huehuetenango 250 g", precio: 75 },
  cafeAntigua: { id: "cafe-500", nombre: "Café de Antigua 500 g", precio: 140 },
  taza: { id: "taza", nombre: "Taza de barro", precio: 60 },
  prensa: { id: "prensa", nombre: "Prensa francesa", precio: 225 },
  molino: { id: "molino", nombre: "Molino manual", precio: 350 },
  filtros: { id: "filtros", nombre: "Filtros de papel (100)", precio: 25 },
} as const satisfies Record<string, Producto>;

export const CATALOGO: readonly Producto[] = Object.values(PRODUCTOS);

/** Nombres del catálogo ordenados de A a Z, según la regla «Catálogo». */
export const NOMBRES_AZ: readonly string[] = CATALOGO.map((p) => p.nombre).sort((a, b) =>
  a.localeCompare(b, "es")
);

/** Nombres del catálogo ordenados de Z a A, según la regla «Catálogo». */
export const NOMBRES_ZA: readonly string[] = [...NOMBRES_AZ].reverse();

/** Precios del catálogo de menor a mayor, según la regla «Catálogo». */
export const PRECIOS_ASCENDENTES: readonly number[] = CATALOGO.map((p) => p.precio).sort(
  (a, b) => a - b
);

/** Precios del catálogo de mayor a menor, según la regla «Catálogo». */
export const PRECIOS_DESCENDENTES: readonly number[] = [...PRECIOS_ASCENDENTES].reverse();
