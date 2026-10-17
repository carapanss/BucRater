---
name: BucRater
description: Diario de lectura personal como un libro impreso — papel y tinta en blanco y negro, tramas en lugar de colores, hojas que se pasan.
colors:
  ink: "#121212"
  ink-muted: "#555555"
  paper: "#f7f6f1"
  paper-sunken: "#ecebe5"
  paper-hover: "#e1e0d9"
  desk: "#cdcdc8"
  rule: "rgba(18, 18, 18, 0.3)"
  night-ink: "#ecebe4"
  night-paper: "#161616"
  night-desk: "#090909"
  cloth-green: "#24412f"
  cloth-oxblood: "#7b2d26"
  cloth-ink: "#22365a"
  cloth-ochre: "#9a6c22"
  cloth-plum: "#4f2e4a"
typography:
  display:
    fontFamily: "IM Fell English, Georgia, serif"
    fontSize: "46px"
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: "IM Fell English, Georgia, serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "IM Fell English, Georgia, serif"
    fontSize: "17.5px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Literata Variable, Georgia, serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Literata Variable, Georgia, serif"
    fontSize: "11.5px"
    fontWeight: 600
    letterSpacing: "0.09em"
rounded:
  sheet: "2px"
  book: "1px 3px 3px 1px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "18px"
  lg: "28px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sheet}"
    height: "38px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    height: "38px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.paper-sunken}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    height: "40px"
    padding: "0 10px"
  book-cover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.book}"
---

# Design System: BucRater

## Overview

**Creative North Star: "El libro impreso"**

La app es un libro abierto sobre una mesa, no un panel. Papel blanco roto, una sola tinta negra, filetes finos. Donde antes había color, hay **tramas**: cada tag, cada sección y cada serie de gráfica tiene su dibujo (rayas, diagonales, puntos, cruzado, verticales, cuadros). El color existe solo como opción: un botón en la cabecera devuelve a las portadas la tela de su tag.

Es una superficie de trabajo (modo Operate) para una sola persona. El movimiento vive en un momento memorable, el giro de hoja, y en pocos detalles; encontrar, abrir y editar un libro nunca queda tapado.

**Key Characteristics:**
- Cabecera corrida (título, capítulo en cursiva, acciones) con filete doble, como en un libro impreso.
- Secciones como cintas marcapáginas en el borde derecho (arriba en ventanas estrechas); la activa va en tinta llena y todas llevan su trama en el extremo.
- Baldas dibujadas con filete grueso-fino; portadas de frente o lomos cuyo grosor sale de las páginas.
- Tapas sin imagen: trama de su tag con una etiqueta de papel de doble filete donde va el título. Portadas con imagen: escala de grises con semitono.
- Estado codificado por relleno de la marca (lleno / medio / vacío), nunca por color.

## Colors

Blanco y negro. Un papel cálido apenas, una tinta casi negra y filetes con transparencia.

- **Tinta** (#121212) / **tinta apagada** (#555555): texto, filetes, botón principal, barras y cintas activas. Noche: tinta #ecebe4 sobre papel #161616.
- **Papel** (#f7f6f1), **papel hundido** (#ecebe5) y **papel de apoyo** (#e1e0d9): hoja, campos y hover. La **mesa** (#cdcdc8) lleva una trama de puntos de semitono.
- **Telas** (verde, burdeos, azul, ocre, ciruela, pizarra): solo en el modo con color, para tapas, lomos y portadas sin imagen. Nunca en la interfaz.

**The Pattern Is The Color Rule.** Lo que necesite distinguirse (tags, secciones, series) se distingue por trama. Si dos cosas piden color, una pide otra trama.

**The One Ink Rule.** Hay una sola tinta. El peligro se marca con borde discontinuo, el error con filete doble; ninguno cambia de color.

## Typography

**Display Font:** IM Fell English (autoalojada, @fontsource): títulos, nombres de libro, cifras grandes. Su tinta irregular da el carácter de impreso antiguo; nunca por debajo de 17 px.
**Body Font:** Literata Variable (autoalojada): texto, campos y botones. Cifras de oldstyle en prosa y lining tabular en datos.
**Labels:** Literata en versalitas simuladas (mayúsculas 11–12 px, tracking 0.09–0.1 em) para etiquetas de campos, fichas técnicas y estados.

**The Italic Is The Margin Rule.** La cursiva es la voz del margen: capítulo en cabecera, autor, notas, ayudas y estados vacíos.

## Elevation

Plano. La profundidad es de objeto: el canto de las hojas (líneas de papel apiladas a derecha y abajo), la sombra del libro sobre la mesa y la de las láminas (modales). No hay sombras decorativas en controles.

## Components

- **Botón principal:** tinta llena con texto de papel; secundario: filete de tinta y fondo transparente; peligro: filete discontinuo. Campos: renglón con línea de escribir debajo; foco con una línea de tinta de 2 px.
- **Cintas:** pestañas de papel con filete, trama en el extremo; la activa se invierte. Rebotan al activarse.
- **Estantería paginada:** cada hoja lleva dos o tres baldas según la altura de la ventana; folio numerado al pie, con teclado (← →).
- **Etiquetas de tapa y lomo:** papel con doble filete; en lomos, etiquetas verticales de título y autor.
- **Láminas:** modales como hoja suelta con filete interior y guarda con la trama del libro.

## Motion

**The Page Turn.** Al cambiar de sección la hoja se levanta por el borde derecho y gira sobre el lomo con perspectiva, inclinación y sombra; debajo ya está la siguiente. Si se saltan varias secciones pasan hojas en blanco en cadena. En las estanterías la hoja gira sobre el lomo del libro. La nueva hoja imprime su contenido en orden (encabezado, herramientas, libros). Con `prefers-reduced-motion` no hay giro.

## Do's and Don'ts

**Do:** distinguir por trama; mantener la cursiva para el margen; usar el filete doble para jerarquía; conservar el botón de color como escape.
**Don't:** añadir color a la interfaz, usar sombras decorativas, poner títulos sobre tramas sin etiqueta de papel, ni encadenar más de un giro de hoja a la vez.
