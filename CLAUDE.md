# English Dog (antes El Tutor Turrón) — guía para Claude Code

App web para que una pareja hispanohablante recién llegada a Aruba aprenda el
inglés que necesita en casa, en la calle y en el trabajo. Ella es agente de
reservaciones; él es técnico de telecomunicaciones. Todo el texto de la interfaz
va en español; el contenido de práctica, en inglés.

Publicada en: https://ingmariangelicagil.github.io/eltutorturron/ (GitHub Pages,
rama `main`, archivo `index.html` en la raíz).

## Estado: English Dog (v6)

La app se llama **English Dog** («Aprendiendo inglés con {mascota}») y tiene tres mascotas a elegir:
**Turrón** (beagle, la original; es el perro real de la familia), **Sam** (cocker spaniel beige, 9 años) y
**Roma** (poodle blanca, hembra, 3 años). Sprites de Sam y Roma en `src/pets.json`; las variantes (ojos,
boca, cola, casco, auriculares, gorro) son las mismas para las tres. `setPet()` en `turron.js` cambia nombre,
logo, botón central, caras de los avisos y título; `PN()` da el nombre y `PET.f` el género. La mascota se
guarda por persona (`pet`). Perfiles: Eduardo (`el`), Mariana (`ella`), Camila (`camila`, la hija) y
invitados (`inv`). El ícono de la app muestra las tres cabezas.

### Caminos de aprendizaje (v7)

- **Mi camino** (pestaña central-derecha, antes «Trabajo»): 20 unidades en 5 etapas con puntaje de 0 a 100 (cada unidad vale 5; sube con las frases marcadas ✓; una unidad está lista al 80 %). `pathTopics()`, `kidScore()`, `vCamino()` en `learning.js`.
- **Camila** (`src/content_camila.py`): 20 unidades propias, Pre-A1 a B1, sobre su vida (salón Montessori, casa, amigos, Aruba), con trucos para errores de hispanohablantes, retos y notas «Para mamá y papá»; 12 situaciones de conversación (`KID_SCENARIOS`) y su «Ya puedo…» (`KID_CANDO`). Siempre son las **últimas 20 secciones** (`KID0`).
- **Eduardo y Mariana** (`src/content_adult.py`): camino A1 a B1 con 13 secciones de la guía + 7 unidades nuevas (small talk, pasado, futuro, quejas, mensajes, reuniones, entrevistas). Las 2 unidades de trabajo cambian por persona (técnico 9/20 o reservaciones 10/21). Las 7 nuevas van justo antes de las de Camila (`AD0`) y también aparecen en Frases. «Todo el inglés de trabajo» sigue a un toque desde el camino.
- **Selector de mascota**: tocar el logo de arriba (o «Cambiar de mascota» en la pestaña de la mascota) abre `openPicker()`. La **paleta cambia con la mascota** (`html[data-pet=sam|roma]` en `identity.css`, claro y oscuro, contraste AA comprobado) y la barra del teléfono la sigue (`theme-color`).

### Juego «Camino a casa» (v8)

- Primer modo de **Practicar** (`data-start="aventura"`). Código en `src/game.js` (motor en canvas, 320×180 lógicos; el ancho se adapta a la pantalla, mínimo 192) y estilos en `src/game.css`. `window.ADV.start(host)` / `ADV.stop()`; `render()` lo detiene al salir de Practicar.
- Plataformas con salto y ladrido (el ladrido es el disparo). 4 mundos × 2 niveles (playa, pueblo, desierto, noche en el barrio), generados con semilla fija (`gen(L)`); cada nivel es más largo y trae más abuelos, más rápidos, que lanzan chancletas (desde 2-1), en scooter y cactus (desde 3-1). El último nivel termina con un vecino gruñón (jefe) frente a la casa; al vencerlo se abre la puerta y se gana.
- Los malos son **abuelos gruñones de diseño original** (no usar personajes de series). Hablan en inglés con traducción («Get off my lawn!»).
- Curas: Turrón con calcetines, Roma con croquetas, Sam con su plato de comida (`HEAL`). 3 vidas, punto de control a mitad de nivel.
- Controles: flechas/WASD, arriba o espacio para saltar, X para ladrar, P o Esc para pausar; en táctil, botones grandes con varios dedos a la vez.
- Avance por persona en `localStorage` `english-dog-juego` (nunca en `aruba-ingles-v1`). `ADV._dbg` existe para las pruebas.

### Correr las pruebas

```
pip install playwright
CHROME="%LOCALAPPDATA%/Google/Chrome/Application/chrome.exe" python tests/turron_test.py
CHROME=... python -u tests/audit_test.py
```
Desde la raíz del repo, después de construir. La barra inferior solo se oculta al escribir en pantallas táctiles (`pointer:coarse`).

## Antes: identidad Turrón (v5)

La app ya gira en torno a **Turrón**: paleta del sprite, títulos en Pixelify Sans,
Turrón al centro de la barra inferior, sus estados en todas las pantallas, e
instalable como app (PWA). El sistema visual está en `DESIGN.md`; el producto, en
`PRODUCT.md`. El brief original queda al final de este archivo como referencia.
Usuarios: Eduardo (técnico, `el`) y Mariana (reservaciones, `ella`).

## Cómo está construido

Es una página HTML única, sin framework ni dependencias de npm. Se genera con
Python a partir de piezas en `src/`:

```
python3 tools/build.py
```

(En Windows: `python tools/build.py`. Necesita Pillow para los íconos.) Produce:

| Archivo | Para qué |
|---|---|
| `index.html` | Sitio público (GitHub Pages). Incluye `src/gemini.html`: Turrón usa Gemini con la clave que cada usuario pega en su teléfono (localStorage). |
| `dist/claude.html` | Versión que vive como artifact dentro de claude.ai. Usa las capacidades de Claude (`window.claude.use('tts' / 'sample' / 'dictation')`) en vez de Gemini. Sin PWA. |
| `icons/*.png`, `manifest.webmanifest`, `sw.js` | Íconos de la app (cabeza de Turrón sobre amarillo), manifest y service worker. Se generan a partir de `src/`; no editarlos a mano. |

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
| `turron_sprite.json` | Sprite de Turrón: cuadrícula 22×22, paleta de 10 colores, y variantes. Por filas: `blink`, `talk`, `happy`. Por píxeles `[x,y,color]`: `tailA`, `tailB`, `sleep`, `helmet` (técnico), `headset` (reservaciones). El build saca de aquí el logo, la cabeza de la barra, los íconos y las caras de los avisos. |
| `gemini.html` | Conexión con Gemini (`gemini-3.5-flash-lite`) por REST, solo en el sitio público. |
| `identity.css` | v5: tokens de la identidad Turrón (claro y oscuro) y todos los estilos nuevos. Va al final de la cascada y manda sobre `design.css`. |
| `pwa.html`, `manifest.webmanifest`, `sw.js` | App instalable, solo en el sitio público. `sw.js` lleva `__VERSION__`, que el build reemplaza con un hash: cada publicación renueva la caché. Gemini nunca se guarda en caché. |

### Estado y datos

- El progreso se guarda en `localStorage`, clave `aruba-ingles-v1`, separado por persona (`el` / `ella`). No sincroniza entre dispositivos.
- La clave de Gemini se guarda en `localStorage`, clave `turron-gemini-key`. **Nunca** debe quedar en el código ni en el repositorio.
- Nombres: `NAME={el:'Eduardo',ella:'Mariana'}` en `learning.js`; las claves de almacenamiento siguen siendo `el` / `ella`.
- Motor de estados de Turrón (`turron.js`): `idle`, `listen`, `think`, `talk`, `fix` (corrección suave), `happy`, `party` (celebración), `sleep`. `setDog(estado)` fija el estado; `flashDog(estado, ms)` hace un momento que vuelve solo. Glifos de píxel en 8 filas sobre la cabeza (SVG 22×30), gorro de dormir, gags al azar cada 30–45 s en reposo, boca por palabra (`onboundary`), mirada hacia donde tocan, acariciarlo lo pone feliz, y modo compacto (barrita fija) cuando la escena sale de pantalla. Todo respeta `prefers-reduced-motion`.
- Teléfonos: `viewport-fit=cover` + `env(safe-area-inset-*)`, `theme-color` por tema, barra de estado translúcida en iOS instalada, hover solo con mouse, la barra inferior se oculta mientras escriben. Revisado en 320–430 px, 768 y 1366, pero falta probar en un iPhone y un Android de verdad (voz, micrófono, teclado, instalación).
- Turrón fuera de su pestaña: `pdog(variantes, clase, estado, soloCabeza)` en `turron.js`. Su ánimo en Inicio sale de `dogMood()`: feliz con la sesión completa, dormido si se cortó la racha.
- Todo texto que venga del usuario o de la IA se escapa con `esc()` antes de insertarlo; `plain()` usa un documento inerte (`DOMParser`). Hubo un fallo de seguridad por esto: no lo reintroduzcas.

### Pruebas

`tests/` tiene pruebas con Playwright (Chrome) que simulan la voz, la IA y el micrófono:

- `tests/turron_test.py`: conversación con Turrón, corrección hablada, micrófono, modo sin IA, pantalla de 320 px.
- `tests/audit_test.py`: recorrido completo en 4 tamaños de pantalla, 19 fallos provocados (sin almacenamiento, datos dañados, sin audio, IA que rechaza), XSS, formatos de números, repaso espaciado con viaje en el tiempo.

Se escribieron en otro entorno: pueden necesitar ajustar la ruta de Chrome (`executable_path`) antes de correr. Tras cualquier cambio, como mínimo: construir, abrir `index.html` en un ancho de 390 px y recorrer todas las pestañas sin errores en la consola.

### PDF

`pdf/build_guide.py` genera `pdf/Guia_Ingles_Aruba.pdf` (ReportLab, fuente DejaVu) y `guide_data.json`. El PDF no tiene el contenido de v2 en adelante.

## Publicar

- **Principal: https://jeirer.web.app** (Firebase, proyecto `jeirer`). Construir y luego `firebase deploy --only hosting,firestore:rules`. `firebase.json` publica solo los archivos construidos.
- **Respaldo: GitHub Pages.** Subir a `main` `index.html`, `sw.js`, `manifest.webmanifest` e `icons/`. Ahí la tarjeta de Inicio manda a jeirer.web.app y ofrece «Llevar mi progreso» (lo pasa en el `#importar=` de la URL, que no llega a ningún servidor).

### Firebase (`src/sync.html`, solo en el sitio público)

- Entrada: «Entrar con Google» o el botón **CAMILA** (inicio de sesión anónimo, sin cuenta). El perfil sale del correo (`personOf()`): ejesil@gmail.com o «eduardo» → `el`; «mariana»/«mariangelica» → `ella`; cualquier otro → invitado con su propio progreso (`g_{uid}`). Luego, si la persona no tiene mascota, elige una. No hay «hogar» ni códigos.
- Firestore: un documento por perfil, `perfiles/{el|ella|camila|g_uid}` con el progreso como JSON en `data`. Reglas en `firestore.rules` (por correo verificado; Camila por inicio anónimo). Es una app familiar: cualquiera con un correo que contenga esos nombres entra a ese perfil, y cualquiera que toque CAMILA entra al de Camila.
- El progreso sigue en `localStorage`; `mergeP()` une teléfono y nube sin perder nada (frases, días, tarjetas, cuaderno se suman; plan, metas y mascota gana el más reciente, campo `u`).
- Con sesión, Turrón usa Gemini por **Firebase AI Logic** (`firebase-ai.js`, modelo en `AIM`). La clave propia de Gemini queda solo como respaldo.
- La config web de Firebase en `sync.html` es pública por diseño. Gemini está protegido con App Check (Fraud Defense, clave `APPCHECK_KEY`, en el proyecto `jeirer`, dominios jeirer.web.app y jeirer.firebaseapp.com): sin token válido, Firebase rechaza la llamada. En localhost App Check no se inicia, así que Gemini no responde ahí.

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
