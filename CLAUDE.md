# El Tutor Turrón — guía para Claude Code

App web para que una pareja hispanohablante recién llegada a Aruba aprenda el
inglés que necesita en casa, en la calle y en el trabajo. Ella es agente de
reservaciones; él es técnico de telecomunicaciones. Todo el texto de la interfaz
va en español; el contenido de práctica, en inglés.

Publicada en: https://ingmariangelicagil.github.io/eltutorturron/ (GitHub Pages,
rama `main`, archivo `index.html` en la raíz).

## Siguiente trabajo: rediseño de identidad centrado en Turrón

La dueña quiere convertir la guía en **su app para aprender inglés**, con una
identidad visual que gire en torno a **Turrón**, el beagle pixelado. Ver el brief
al final de este archivo.

## Cómo está construido

Es una página HTML única, sin framework ni dependencias de npm. Se genera con
Python a partir de piezas en `src/`:

```
python3 tools/build.py
```

Produce dos salidas:

| Archivo | Para qué |
|---|---|
| `index.html` | Sitio público (GitHub Pages). Incluye `src/gemini.html`: Turrón usa Gemini con la clave que cada usuario pega en su teléfono (localStorage). |
| `dist/claude.html` | Versión que vive como artifact dentro de claude.ai. Usa las capacidades de Claude (`window.claude.use('tts' / 'sample' / 'dictation')`) en vez de Gemini. |

Ambas deben seguir funcionando. El código detecta en tiempo de ejecución qué
servicio de IA hay (`aiState()` en `src/turron.js`).

### Piezas (`src/`)

| Archivo | Contenido |
|---|---|
| `base.html` | Página base (v1): HTML, CSS original, vistas Inicio/Frases/Trabajo/Practicar/Plan, voz del navegador. `tools/build.py` le aplica parches de texto exacto (`P=[...]`, `R=[...]`); si cambias `base.html`, revisa que esos parches sigan encontrando su texto (hay `assert`). |
| `guide_data.json` | Contenido de la guía original (secciones 0–14: frases, vocabulario, diálogos, ejercicios, plan, tips). Generado por `pdf/build_guide.py`. |
| `content_extra.py` | Secciones nuevas 15–22 (números, teléfono, servicios, errores típicos, verbos, técnico avanzado, reservaciones avanzado, cortesía). |
| `learning.js` / `learning.css` | Sistema de aprendizaje (v2): sesión diaria, racha, tarjetas con repaso espaciado (Leitner 1-2-4-8-16 días), quiz, juegos (números al oído, sonidos difíciles, dictado, deletreo, ordenar), buscador, «Mi cuaderno», nivel «Ya puedo…». |
| `design.css` | Rediseño v3: tema claro/oscuro, botones táctiles con sombra, barra inferior flotante, anillo de progreso, animaciones con `prefers-reduced-motion`. |
| `turron.js` / `turron.css` | Turrón (v4): sprite animado en SVG, 11 situaciones de trabajo, conversación por voz/texto, corrección en voz alta (español + inglés). |
| `turron_sprite.json` | Sprite de Turrón: cuadrícula 22×22, paleta de 10 colores, y variantes (`blink`, `talk`, `happy`, `tailA`, `tailB`). |
| `gemini.html` | Conexión con Gemini (`gemini-3.5-flash-lite`) por REST, solo en el sitio público. |

### Estado y datos

- El progreso se guarda en `localStorage`, clave `aruba-ingles-v1`, separado por persona (`el` / `ella`). No sincroniza entre dispositivos.
- La clave de Gemini se guarda en `localStorage`, clave `turron-gemini-key`. **Nunca** debe quedar en el código ni en el repositorio.
- Todo texto que venga del usuario o de la IA se escapa con `esc()` antes de insertarlo; `plain()` usa un documento inerte (`DOMParser`). Hubo un fallo de seguridad por esto: no lo reintroduzcas.

### Pruebas

`tests/` tiene pruebas con Playwright (Chrome) que simulan la voz, la IA y el micrófono:

- `tests/turron_test.py`: conversación con Turrón, corrección hablada, micrófono, modo sin IA, pantalla de 320 px.
- `tests/audit_test.py`: recorrido completo en 4 tamaños de pantalla, 19 fallos provocados (sin almacenamiento, datos dañados, sin audio, IA que rechaza), XSS, formatos de números, repaso espaciado con viaje en el tiempo.

Se escribieron en otro entorno: pueden necesitar ajustar la ruta de Chrome (`executable_path`) antes de correr. Tras cualquier cambio, como mínimo: construir, abrir `index.html` en un ancho de 390 px y recorrer todas las pestañas sin errores en la consola.

### PDF

`pdf/build_guide.py` genera `pdf/Guia_Ingles_Aruba.pdf` (ReportLab, fuente DejaVu) y `guide_data.json`. El PDF no tiene el contenido de v2 en adelante.

## Publicar

Subir `index.html` a la rama `main`. GitHub Pages lo publica en 1–2 minutos.

---

## Brief: identidad visual centrada en Turrón

**Objetivo.** Que deje de sentirse como «una guía» y se sienta como *su* app: una
compañera de aprendizaje con personalidad, donde Turrón es la marca, el guía y el
termómetro de progreso. Debe seguir siendo cálida y fácil para principiantes
adultos, y rápida en un teléfono.

**Turrón como sistema, no como adorno.**
- Logo e ícono de app a partir del sprite (cabeza de Turrón, 22×22, escalado en múltiplos enteros).
- Turrón aparece en cada estado importante: bienvenida, sesión del día, acierto, error, racha, sin conexión, pantallas vacías. Hoy solo vive en la pestaña «Turrón».
- Sus estados ya existen en el sprite (idle, listen, think, talk, happy); hay espacio para más (dormido para la racha perdida, con casco de técnico, con auriculares de agente de reservaciones).

**Paleta desde el sprite** (`turron_sprite.json` → `pal`):

| Token sugerido | Hex | Origen |
|---|---|---|
| turron-caramel | `#C47A2C` | pelaje |
| turron-cocoa | `#8A4B17` | orejas |
| turron-cream | `#FFF8EE` | hocico y pecho |
| turron-ink | `#2B1A12` | contorno |
| collar | `#D6336C` | collar |
| tag | `#FFC83A` | placa |

La paleta actual (mar de Aruba: `#073B52`, `#0B8A99`) puede quedar como acento o
desaparecer; decidirlo en el rediseño. Mantener contraste AA en claro y oscuro.

**Tipografía.** Hoy: Bricolage Grotesque (títulos) + Atkinson Hyperlegible
(texto). Explorar un título con guiño pixel que combine con el sprite, sin perder
legibilidad para principiantes; el cuerpo debe seguir siendo muy legible.

**Convertirla en app.**
- PWA instalable: `manifest.webmanifest` con nombre «Turrón», íconos de Turrón, `theme_color`; service worker para funcionar sin conexión (todo menos Gemini).
- Pantalla de inicio de app (splash) con Turrón.
- Revisar navegación: hoy son 6 pestañas abajo; en una app quizá Turrón sea el centro.

**Restricciones.**
- Sin dependencias pesadas; el archivo debe seguir cargando rápido en datos móviles.
- Respetar `prefers-reduced-motion` y el tema del sistema.
- Objetivos táctiles de 44 px o más; botones con nombre accesible.
- No romper el progreso guardado de los usuarios (`aruba-ingles-v1`).
- No reproducir personajes con derechos de autor: Turrón es un diseño original y debe seguir siéndolo («tipo Pokémon» se refiere solo al estilo pixel).
