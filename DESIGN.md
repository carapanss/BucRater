---
name: BucRater
description: Diario de lectura personal encuadernado en tela — estantería, lomos y pan de oro.
colors:
  cloth-green: "#24412f"
  cloth-oxblood: "#7b2d26"
  cloth-ink: "#22365a"
  cloth-ochre: "#9a6c22"
  cloth-plum: "#4f2e4a"
  cloth-slate: "#3e4a4f"
  foil: "#d8b66a"
  foil-bright: "#ecd394"
  foil-ink: "#8a6418"
  on-cloth: "#f3efe2"
  on-cloth-muted: "#b9c3b4"
  linen: "#e7e8e0"
  paper: "#fbfbf7"
  paper-sunken: "#efefe8"
  ink: "#1c2420"
  ink-muted: "#56615a"
  border: "#cfd2c6"
  danger: "#9c3a2e"
  night-linen: "#141815"
  night-paper: "#1d221e"
  night-ink: "#ebe8dd"
typography:
  display:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.18
  body:
    fontFamily: "Schibsted Grotesk Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Schibsted Grotesk Variable, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "4px"
  md: "8px"
  lg: "14px"
  book: "2px 4px 4px 2px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "18px"
  lg: "28px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.cloth-oxblood}"
    textColor: "{colors.on-cloth}"
    rounded: "{rounded.md}"
    height: "38px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "38px"
    padding: "0 16px"
  button-foil:
    backgroundColor: "{colors.foil}"
    textColor: "#1d1a10"
    rounded: "{rounded.md}"
    height: "34px"
    padding: "0 11px"
  input:
    backgroundColor: "{colors.paper-sunken}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "38px"
    padding: "0 12px"
  header-band:
    backgroundColor: "{colors.cloth-green}"
    textColor: "{colors.on-cloth-muted}"
    height: "64px"
  book-cover:
    backgroundColor: "{colors.cloth-green}"
    textColor: "{colors.foil}"
    rounded: "{rounded.book}"
---

# Design System: BucRater

## Overview

**Creative North Star: "La encuadernación en tela"**

La biblioteca es una tirada de libros encuadernados en tela, no un panel de tarjetas. La app es la estantería y el libro: telas lisas de color de encuadernación (verde botella, burdeos, azul tinta, ocre) como planos sólidos; lino como suelo; pan de oro para todo lo estampado (marca, títulos sobre tela, estrellas, estado activo); controles "hundidos en seco" en el papel. El único ornamento es la cabezada rayada que remata lomos, la cabecera y las barras de las gráficas.

Es una superficie de trabajo (modo Operate) para una sola persona, a menudo en ventana estrecha y tema claro. La expresión vive en los materiales y en unos pocos momentos de movimiento; la tarea (encontrar, abrir, editar un libro) nunca queda tapada.

**Key Characteristics:**
- Portadas de frente sobre baldas continuas; alternativa de lomos cuyo grosor sale de las páginas.
- Libros sin portada = tapa de tela de su primer tag con el título estampado en oro.
- Ficha del libro abierta bajo una guarda con patrón; formularios con la misma guarda.
- Estado codificado por relleno (lleno / medio / vacío), no solo por color.

## Colors

Telas saturadas sobre un lino neutro gris-verdoso, con oro como único metal.

### Primary
- **Verde botella** (#24412f): la tela de la casa. Cabecera, resumen anual, tela por defecto, barras de libros.
- **Burdeos** (#7b2d26): solo la acción principal (Añadir libro, Guardar, Editar) y la tela de algunos libros.

### Secondary
- **Pan de oro** (#d8b66a; #ecd394 brillante; #8a6418 sobre papel): lo estampado. Sobre tela usa `foil`; sobre papel claro usa `foil-ink` para mantener contraste.
- **Azul tinta / Ocre / Ciruela / Pizarra**: telas de libros y tags, segunda serie de gráficas.

### Neutral
- **Lino** (#e7e8e0): suelo de la app, con trama de urdimbre y trama al 4,5 %.
- **Papel** (#fbfbf7) y **papel hundido** (#efefe8): hojas (modales) y campos.
- **Tinta** (#1c2420) / **tinta apagada** (#56615a): texto y etiquetas.
- Noche: lino #141815, papel #1d221e, tinta #ebe8dd; las telas se oscurecen y el burdeos sube a #a8473b.

**The One Oxblood Rule.** El burdeos marca una sola acción por pantalla. Si dos botones lo piden, uno no es el principal.

**The Foil Is Stamped Rule.** El oro solo aparece donde algo está estampado: marca, títulos sobre tela, valoración, pestaña activa, cabezadas. Nunca como relleno de fondo.

## Typography

**Display Font:** Gloock (Georgia de respaldo), autoalojada vía @fontsource.
**Body Font:** Schibsted Grotesk Variable (system-ui de respaldo).

**Character:** Gloock es el rotulado estampado de un lomo: contraste alto, un solo peso. Schibsted es la letra de trabajo: compacta y legible a 12–14 px.

### Hierarchy
- **Display** (Gloock 400, 34px, -0.02em): títulos de vista (Biblioteca, Métricas, Tags).
- **Headline** (Gloock 400, 24–30px): título de modal y de la ficha; resumen anual hasta 46px.
- **Title** (Gloock 400, 15.5–19px): títulos de libros, de gráficas y de secciones.
- **Body** (Schibsted 400, 14px/1.45): texto general; notas a 14.5px/1.65, máximo 68ch.
- **Label** (Schibsted 550–600, 11.5–12.5px): etiquetas de campos y del documento segmentado; cifras siempre `tabular-nums`.

**The Stamp Only Rule.** Gloock solo en títulos y cifras protagonistas; jamás en párrafos, botones ni etiquetas.

## Layout

Contenido centrado hasta 1320px con 32px de margen (18px por debajo de 900px). Estantería en rejilla `auto-fill minmax(156px, 1fr)` (128px en ventana estrecha) sin separación horizontal, para que la balda sea continua; 40px entre baldas. Métricas en dos columnas separadas por filetes, una columna por debajo de 820px. Por debajo de 900px la cabecera pasa a dos filas (marca + acciones, pestañas debajo) y las acciones se quedan solo con el icono.

## Elevation & Depth

La profundidad es física: los libros proyectan sombra hacia abajo sobre la balda; las hojas (modales) flotan con una sombra larga y suave; los campos están hundidos (`inset`). No hay tarjetas con borde y sombra a la vez.

### Shadow Vocabulary
- **Libro** (`0 1px 2px rgba(0,0,0,.18), 0 10px 18px -10px rgba(0,0,0,.45)`): portadas sobre la balda.
- **Hoja** (`0 2px 6px rgba(0,0,0,.12), 0 40px 80px -24px rgba(0,0,0,.5)`): modales.
- **Hundido** (`inset 0 1px 2px rgba(28,36,32,.12), inset 0 -1px 0 rgba(255,255,255,.6)`): campos y conmutadores.

## Shapes

Esquinas de libro: 2px en el lomo y 4px en el corte (`2px 4px 4px 2px`), con una bisagra en degradado junto al lomo. Controles a 8px, hojas a 14px, cintas de estado y marcas de tag casi cuadradas (2px). Las píldoras solo en chips de tag.

## Components

### Buttons
- **Primario:** tela burdeos con trama vertical, texto blanco roto, 38px de alto, brillo interior de 1px; hover aclara un 8 %, active baja 1px.
- **Secundario:** papel con borde de 1px.
- **Sobre tela (cabecera):** transparentes, texto `on-cloth-muted`, hover oscurece la tela; la variante dorada (`is-foil`) para acciones pendientes (actualizar, exportar imagen).

### Inputs / Fields
- **Estilo:** papel hundido, borde de 1px, 8px de radio.
- **Foco:** borde `foil-ink` y halo dorado de 3px; el cursor de texto también es dorado.

### Navigation
Pestañas en la banda de tela; la activa en `foil-bright` con un filete dorado de 2px que se desliza entre pestañas (muelle firme).

### Libro (portada / lomo)
Portada 2:3 con bisagra; sin imagen, tapa de tela con marco estampado en seco, título Gloock en oro y autor en versalitas. Lomo con cabezada rayada, título vertical (dos columnas si mide ≥40px de grueso) y puntos de valoración en blanco roto.

### Movimiento
Muelle firme (420/38) para las tapas, los modales y las reordenaciones; muelle vivo (520/22) para estrellas y contadores; salida exponencial `cubic-bezier(0.16, 1, 0.3, 1)` en las entradas. Momentos de autor: la portada vuela de la balda a la ficha; los lomos caen al estante; el cambio de tema se despliega en círculo; las cifras del resumen ruedan dígito a dígito. Todo respeta la preferencia de reducir movimiento.

## Do's and Don'ts

### Do:
- **Do** dar a cada libro sin portada su tela (primer tag o reparto estable) con el título estampado.
- **Do** codificar el estado con el relleno de la marca además del color.
- **Do** usar iconos de trazo de `Icon.tsx` (24×24, trazo 1.7).
- **Do** mantener las cifras en `tabular-nums` y las barras de gráficas como lomos con cabezada.

### Don't:
- **Don't** usar glifos Unicode (★ ✕ ☀) como iconos.
- **Don't** usar etiquetas pequeñas en versalitas encima de un título (eyebrows).
- **Don't** poner borde y sombra a la vez en un mismo contenedor, ni bordes laterales de color en tarjetas o avisos.
- **Don't** usar fondo crema con serif "de librería antigua": el suelo es lino gris-verdoso y el oro solo es estampado.
