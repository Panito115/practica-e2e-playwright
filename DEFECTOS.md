# Defectos encontrados en Café de Altura

Cada defecto de esta lista lo encontró una prueba de la suite y la prueba se queda
en rojo a propósito: la tienda no se modificó para que la suite pase. El resultado
esperado sale de las reglas del [README](README.md), que están escritas como código
en [`pruebas/especificacion/reglas.ts`](pruebas/especificacion/reglas.ts).

Todos los pasos usan la contraseña `calidad2026`.

| # | Regla | Usuario | Resumen | Pruebas en rojo |
|---|-------|---------|---------|-----------------|
| [D-01](#d-01) | Descuento | `estandar` | Con un subtotal de exactamente Q500 aplica 5 % en lugar de 10 % | 1 |
| [D-02](#d-02) | Envío gratis | `estandar` | El cupón `ENVIOGRATIS` solo da envío gratis si el código postal empieza con `01` | 3 |
| [D-03](#d-03) | Catálogo | `problema` | El orden por precio no se aplica | 2 |
| [D-04](#d-04) | Carrito | `problema` | Agregar «Taza de barro» mete «Filtros de papel (100)» en el carrito | 1 |
| [D-05](#d-05) | Datos de envío | `problema` | El apellido nunca se toma, así que la compra no se puede completar | 1 |

Total: 5 defectos, 8 pruebas en rojo. El mismo resultado se repite en Chromium,
Firefox y WebKit.

---

## D-01

**Regla:** «Descuento» — Subtotal menor de Q200, sin descuento. De Q200 a Q499, 5 %.
De Q500 en adelante, 10 %.

**Usuario:** `estandar`

**Técnica que lo encontró:** análisis de valores límite sobre el límite de Q500.

**Pasos:**

1. Ingresar como `estandar`.
2. En el catálogo, agregar «Molino manual» (Q350) y «Café de Huehuetenango 250 g» (Q75).
3. Ir al carrito y poner cantidad `2` en «Café de Huehuetenango 250 g». El subtotal queda en Q500.00.
4. Continuar al pago con nombre `Ana`, apellido `López`, código postal `01001` y sin cupón.

**Resultado esperado:** el resumen muestra un descuento de 10 % y de −Q50.00. El
subtotal con descuento es Q450.00, que pasa el umbral de Q300, así que el envío es
Q0.00 y el total Q450.00.

**Resultado obtenido:** el resumen muestra un descuento de 5 % y de −Q25.00, y un
total de Q475.00. El tramo del 10 % empieza en Q501 y no en Q500, así que el límite
de la regla está corrido en una unidad.

**Prueba:** `pruebas/especificaciones/08-descuento.spec.ts` → «subtotal Q500 (el
límite inferior del tramo de 10 %) aplica 10 % de descuento».

---

## D-02

**Regla:** «Envío gratis» — El envío cuesta Q0 si el subtotal con descuento es de
Q300 o más, o si se usa el cupón `ENVIOGRATIS`. El cupón vale para cualquier código
postal.

**Usuario:** `estandar`

**Técnica que lo encontró:** tabla de decisión sobre las tres condiciones del envío
(código postal de la capital, subtotal con descuento de Q300 o más y cupón
`ENVIOGRATIS`). El defecto aparece en la fila donde el cupón es la única condición
verdadera y el código postal no es de la capital.

**Pasos:**

1. Ingresar como `estandar`.
2. Agregar «Taza de barro» y poner cantidad `2` en el carrito. El subtotal queda en Q120.00.
3. Continuar al pago con nombre `Ana`, apellido `López`, código postal `07001` y cupón `ENVIOGRATIS`.

**Resultado esperado:** el cupón se acepta y el envío es Q0.00, con un total de
Q120.00.

**Resultado obtenido:** el cupón se acepta, pero el envío es Q40.00 y el total
Q160.00. El cupón solo da envío gratis cuando el código postal empieza con `01`:
con el código postal `01001` y el mismo carrito el envío sí baja a Q0.00.

**Pruebas:**

- `pruebas/especificaciones/09-envio.spec.ts` → «caso 6: CP del interior, base bajo el umbral y con cupón cobra Q0 de envío».
- `pruebas/especificaciones/09-envio.spec.ts` → «el cupón ENVIOGRATIS vale para cualquier código postal» (código postal `99999` y cupón en minúsculas).
- `pruebas/especificaciones/10-total-y-confirmacion.spec.ts` → «total de un carrito sin descuento y con envío gratis por el cupón» (subtotal Q75.00, esperado Q75.00, obtenido Q115.00).

---

## D-03

**Regla:** «Catálogo» — Se ordena por nombre (A a Z y Z a A) o por precio (de menor
a mayor y de mayor a menor).

**Usuario:** `problema`

**Técnica que lo encontró:** particiones de equivalencia sobre la clase de usuario.
Las reglas del README no tienen excepciones por usuario, así que las cuatro
particiones del criterio de orden se probaron también con `problema`.

**Pasos:**

1. Ingresar como `problema`.
2. En «Ordenar por», elegir «Precio (menor a mayor)».
3. Repetir con «Precio (mayor a menor)».

**Resultado esperado:** con «Precio (menor a mayor)», los precios en pantalla son
Q25, Q60, Q75, Q140, Q225, Q350. Con «Precio (mayor a menor)», Q350, Q225, Q140,
Q75, Q60, Q25.

**Resultado obtenido:** con los dos criterios de precio el catálogo queda en el
orden Q75, Q140, Q60, Q225, Q350, Q25, que no es ascendente ni descendente. El
selector no tiene ningún efecto para este usuario. Los dos criterios por nombre sí
funcionan.

**Pruebas:**

- `pruebas/especificaciones/11-usuario-problema.spec.ts` → «ordena el catálogo por precio de menor a mayor».
- `pruebas/especificaciones/11-usuario-problema.spec.ts` → «ordena el catálogo por precio de mayor a menor».

---

## D-04

**Regla:** «Carrito» — Cada producto se agrega una vez desde el catálogo.

**Usuario:** `problema`

**Técnica que lo encontró:** particiones de equivalencia sobre la clase de usuario.

**Pasos:**

1. Ingresar como `problema`.
2. En el catálogo, agregar «Taza de barro» (Q60).
3. Ir al carrito.

**Resultado esperado:** el carrito tiene una línea con «Taza de barro» y un subtotal
de Q60.00.

**Resultado obtenido:** el carrito tiene una línea con «Filtros de papel (100)» y un
subtotal de Q25.00. La tienda cambia el producto agregado por otro, así que el
cliente no puede comprar la taza.

**Prueba:** `pruebas/especificaciones/11-usuario-problema.spec.ts` → «agregar «Taza
de barro» mete esa taza en el carrito».

---

## D-05

**Regla:** «Datos de envío» — Nombre, apellido y código postal son obligatorios.

**Usuario:** `problema`

**Técnica que lo encontró:** particiones de equivalencia sobre la clase de usuario,
en la partición válida de los tres campos obligatorios.

**Pasos:**

1. Ingresar como `problema`.
2. Agregar «Prensa francesa» y continuar al pago.
3. Llenar nombre `Ana`, apellido `López` y código postal `01001`, y pulsar «Continuar».

**Resultado esperado:** los tres campos están llenos y válidos, así que la tienda
pasa al resumen del pedido sin mostrar ningún error.

**Resultado obtenido:** la tienda muestra «Falta el apellido.» y se queda en
`/checkout`, con cualquier apellido que se escriba. Para este usuario no hay forma de
completar una compra.

**Prueba:** `pruebas/especificaciones/11-usuario-problema.spec.ts` → «completa los
datos de envío con nombre, apellido y código postal válidos».

---

## Reglas que la tienda cumple

Las demás pruebas de la suite están en verde, así que estas reglas quedaron
cubiertas y sin defectos:

- **Ingreso:** las siete filas de la tabla de decisión, incluido el usuario `bloqueado`.
- **Sesión:** las cinco páginas protegidas llevan al ingreso sin sesión, y cerrar sesión vacía el carrito.
- **Catálogo** con `estandar`: los cuatro criterios de orden, el orden por nombre A a Z al entrar y los seis precios de la tabla de productos.
- **Carrito:** agregar una vez por producto, el contador de unidades del encabezado, el cambio de cantidad y quitar productos.
- **Cantidad:** los límites 1 y 5 se aceptan; −1, 0, 6, 10, 2.5 y 0.5 dan error y no dejan continuar al pago.
- **Datos de envío** con `estandar`: los tres campos obligatorios y las longitudes 4, 5 y 6 del código postal.
- **Cupón:** las seis variantes aceptadas de `ENVIOGRATIS` y las seis rechazadas con «El cupón no existe.».
- **Descuento:** los tramos de 0 %, 5 % y 10 % en todos los subtotales probados menos el de exactamente Q500 (D-01).
- **Envío:** Q25 con código postal que empieza con `01`, Q40 en el resto, incluidos `10100` y `00101`, que contienen `01` sin empezar con él; y el umbral de Q300, con base Q299.25 cobrando envío y base Q304.00 sin cobrarlo.
- **Total:** subtotal menos descuento más envío en seis combinaciones de tramo y envío.
- **Confirmación:** número de pedido de 6 dígitos y carrito vacío después de confirmar.
- **Usuario `lento`:** entra y completa una compra, con esperas por condición y sin esperas fijas.
