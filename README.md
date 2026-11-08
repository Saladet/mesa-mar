# Mesa · Mar

El menú de la semana, la lista de la compra compartida y las recetas de casa, para una familia con peques.

**App:** https://saladet.github.io/mesa-mar/ (se puede añadir a la pantalla de inicio del móvil).

Es una Mesa independiente, hecha a partir de [Mesa](https://github.com/Saladet/Mesa): su propio enlace, sus propios datos (proyecto de Supabase `mesa-mar`) y sus colores. Lo que cambia respecto a Mesa: los peques cuentan media ración, hay un mínimo de pescado a la semana y los colores son «Mar» (azul y albaricoque).

## Qué hace

- **Semana**: comida y cena de cada día, con un plato dibujado hasta que le hagáis foto. Cada plato se puede cambiar por otro que encaje con las reglas de la semana, o moverse a otro día desde la semana entera.
- **Plato especial**: una receta más elaborada a la semana (por defecto, el domingo a mediodía). Dos días antes avisa de lo que hay que preparar (remojos, adobos, qué pedir en la carnicería).
- **Lista**: se monta sola con los ingredientes de la semana, agrupada por secciones del súper. Lo que marca uno lo ve el otro al momento. Avisa de lo que hay que congelar al llegar.
- **Recetas**: el recetario, con modo cocina paso a paso y temporizadores. Pegando el enlace de una receta de una web, se lee sola y se añade (foto, ingredientes, pasos y temporizadores).
- **Valoraciones**: cada uno puntúa los platos (1-5 estrellas) y deja un comentario. Lo de la última vez sale en el plato y al empezar a cocinar; lo que gustó aparece más en las semanas y lo de «No lo repetimos» deja de salir solo.
- **Hogar**: quién come (los peques cuentan media ración en la lista y en las recetas), qué no come cada uno (datos estructurados, no texto libre), día de compra, reglas (legumbre, pescado si en la casa se come, carne, huevo, caprichos) y colores de la app («Huerta» o «Mar»).
- **Varias casas**: cada casa tiene su menú, su lista, su recetario y sus colores; con el mismo enlace, cada uno solo ve la suya. Una cuenta solo puede estar en una casa.
- **Bienvenida guiada** (casas con `hogares.bienvenida`, como la de Aina y Manu): la primera persona que entra elige con botones grandes el día de compra y qué comidas planificar, se prepara su primera semana y después hay una explicación paso a paso sobre la propia app (se puede repetir desde Hogar). La segunda persona solo ve la explicación.
- **Tester** (`personas.oculta`): entra a una casa a mirar sin contar para las raciones ni salir en «Quiénes comen». Su bienvenida no cambia nada de la casa; lo que haga antes de que la casa se configure se borra al configurarla.

## Cómo está hecha

- Web app (React + Vite) publicada con GitHub Pages; funciona sin conexión con lo último cargado.
- Datos, cuentas y tiempo real en Supabase (proyecto `mesa-mar`). Cada tabla tiene políticas de seguridad: solo ve los datos quien está en el hogar.
- Importar recetas: al pegar un enlace, una función de Supabase (`leer-receta`) lee los datos de receta que publican casi todas las webs de cocina (schema.org/Recipe) y la app la guarda con los ingredientes reconocidos del catálogo. Si una web no los publica, el enlace queda pendiente y Claude la añade a mano. Recetas nuevas o repasos de una receta leída: se los pides a Claude.

## Desarrollo

```bash
npm install
npm run dev
```

`seed/` contiene el recetario (inicial, importado, especiales y las recetas propias de la segunda casa, con pescado y para 4 raciones) y los scripts que generan el SQL de cada carga (`seed/sql.mjs`, `seed/sql-recetas.mjs`).

Los colores están en `src/tema.js` (variables en `src/estilos.css`, iconos y manifiesto con sufijo `-mar` o `-rock` en `public/`). «Rock» (rock psicodélico de los 60, con la letra Shrikhand y el plato como vinilo) es exclusivo de la casa de Aina y Manu: no se ofrece en Hogar a las demás. En `src/config.js` van el proyecto de Supabase, los colores con los que abre la app y el prefijo de lo que se guarda en el móvil (`mesa-mar`), que evita pisarse con otras Mesas del mismo dominio.

`supabase/functions/leer-receta/` es la función que lee las recetas de las webs (solo responde a usuarios con sesión y solo a webs públicas). La lógica que convierte lo leído en una receta de Mesa está en `src/logic/importar.js`.
