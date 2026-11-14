# Design: identidad Turrón

La app es de Eduardo y Mariana, y Turrón (beagle pixelado original, `src/turron_sprite.json`)
es la marca, el guía y el termómetro del progreso. Todo lo visual sale del sprite.
Los tokens viven en `src/identity.css`.

## Color

Estrategia: comprometida. El caramelo y el cacao del pelaje cubren el marco (barra superior,
escena de Turrón en Inicio y en su pestaña); el fondo es crema. El turquesa del mar de Aruba
queda solo para el audio (botones de escuchar).

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--foam` | `#FBF3E6` | `#1C120C` | fondo |
| `--paper` | `#FFFDF8` | `#2A1C14` | tarjetas, barra inferior |
| `--ink` | `#2B1A12` | `#FFF1DF` | texto |
| `--soft` | `#6E5444` | `#CDB49C` | texto secundario |
| `--line` | `#EBDCC7` | `#47321F` | bordes, huellas vacías |
| `--sea` | `#5A2F0E` | `#8A4B17` | barra superior, botones llenos |
| `--hero` | `#C47A2C` | `#4A2C17` | escena de Turrón |
| `--deep` | `#8A4B17` | `#E7A25A` | texto y bordes de botones |
| `--flamingo` | `#D6336C` | `#D6336C` | acción principal (collar) |
| `--sun` | `#FFC83A` | `#FFC83A` | destacado, persona activa, pestaña de Turrón (placa) |
| `--lagoon` | `#0B7F8C` | `#0B7F8C` | audio |
| `--aloe` | `#1F7A49` | `#1F7A49` | correcto |

Contraste comprobado: todo el texto ≥ 4.5:1 en claro y oscuro (texto oscuro sobre caramelo: 4.9:1;
blanco sobre rosa: 4.6:1).

## Tipografía

- **Pixelify Sans** (500/700): marca, `h1`, números grandes. Guiño al sprite, solo en títulos.
- **Atkinson Hyperlegible** (400/700): todo lo demás, incluido el inglés de práctica, que debe
  leerse sin esfuerzo.

## Turrón como sistema

- Siempre escalado en múltiplos enteros, `shape-rendering: crispEdges`, sin trazo.
- Logo y barra: solo la cabeza (filas 0–13, 22×14). Escena: cuerpo entero (22×22).
- Estados: `idle`, `happy` (salta dos veces), `sleep` (ojos cerrados y «Zzz»), `listen`, `think`,
  `talk`. Variantes de trabajo: `helmet` (Eduardo, técnico) y `headset` (Mariana, reservaciones).
- Dónde aparece: logo, botón central de la barra, frase del día en Inicio (su ánimo refleja la
  sesión y la racha), racha, encabezado de Trabajo, cuaderno vacío, sin conexión, avisos (toast)
  y la respuesta de cada ejercicio (feliz si acierta).
- Movimiento propio: la sesión del día se cuenta con **cuatro huellas** en zigzag que se llenan.

## Forma

- Botones táctiles con canto inferior de 3–4 px (se hunden al tocar). Objetivos ≥ 44 px.
- Borde inferior de la escena de Turrón: almenas de 8 px (pixel).
- Viñeta de `h2`: cuadrado de 9 px con sombra de píxel en cacao.
- Cajas de aviso: borde fino teñido, sin franja lateral.
- Barra inferior flotante de cinco botones con Turrón al centro, elevado; en ≥ 760 px pasa arriba.

## Movimiento

Una entrada corta por vista; Turrón salta al acertar o al completar la sesión; las huellas hacen
«pop» al llenarse. Con `prefers-reduced-motion` no hay animaciones ni pantalla de inicio.
