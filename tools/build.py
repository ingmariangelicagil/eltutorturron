# Construye el sitio a partir de src/. Uso: python3 tools/build.py
# Salidas: index.html (GitHub Pages, con Gemini y PWA), dist/claude.html (artifact de Claude),
# icons/*.png, manifest.webmanifest y sw.js (generados a partir del sprite de Turrón).
import json, os, sys, hashlib
from urllib.parse import quote
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'src'))
from content_extra import EXTRA
from content_camila import CAMILA, KID_SCENARIOS, KID_CANDO, STAGES
from content_adult import ADULT, ADULT_STAGES, ADULT_PATH, ADULT_SCENARIOS

def rd(*p): return open(os.path.join(ROOT, *p), encoding='utf-8').read()
def wr(text, *p):
    os.makedirs(os.path.dirname(os.path.join(ROOT, *p)), exist_ok=True)
    open(os.path.join(ROOT, *p), 'w', encoding='utf-8', newline='\n').write(text)

# ---------- Turrón: el sprite como fuente de la marca ----------
DOG = json.loads(rd('src', 'turron_sprite.json'))
HEAD_ROWS = 14  # cabeza y collar: filas 0-13
# las tres mascotas: Turrón (turron_sprite.json) + Sam y Roma (pets.json)
PETS = {'turron': {'n': 'Turrón', 'breed': 'Beagle', 'age': 0, 'f': False, 'en': 'a friendly, playful beagle',
                   'pal': DOG['pal'], 'rows': DOG['rows'], 'base': []}}
PETS.update(json.loads(rd('src', 'pets.json')))
# variantes por filas -> diferencias de píxel respecto a Turrón, así sirven para las tres mascotas
def rowdiff(rowmod):
    out = []
    for i, r in rowmod.items():
        for x, c in enumerate(r):
            if c != DOG['rows'][int(i)][x]: out.append([x, int(i), c])
    return out
MODS = {k: (rowdiff(v) if isinstance(v, dict) else v) for k, v in DOG.items() if k not in ('pal', 'rows')}
JSDOG = dict(MODS, pal=DOG['pal'], rows=DOG['rows'], pets=PETS)

def grid(mods=(), tail='tailA', pet='turron'):
    P = PETS[pet]
    rows = [list(r) for r in P['rows']]
    for x, y, c in P['base']: rows[y][x] = c
    for m in mods:
        for x, y, c in MODS[m]: rows[y][x] = c
    if tail:
        for x, y, c in MODS[tail]: rows[y][x] = c
    return rows

def svg(mods=(), head=False, label=None, pet='turron'):
    pal = PETS[pet]['pal']
    rows = grid(mods, None if head else 'tailA', pet)[:HEAD_ROWS if head else 22]
    h = len(rows)
    a = ' role="img" aria-label="%s"' % label if label else ' aria-hidden="true"'
    out = '<svg viewBox="0 0 22 %d" shape-rendering="crispEdges"%s>' % (h, a)
    for y, r in enumerate(rows):
        x = 0
        while x < 22:
            c = r[x]
            if c == '.': x += 1; continue
            x0 = x
            while x < 22 and r[x] == c: x += 1
            out += '<rect x="%d" y="%d" width="%d" height="1" fill="%s"/>' % (x0, y, x - x0, pal[c])
    return out + '</svg>'

def uri(s):
    s = s.replace(' aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"').replace('"', "'")
    return 'url("data:image/svg+xml,%s")' % quote(s, safe=" =:/';,")

def icon_grid(total, m):
    """Ícono de English Dog en píxeles lógicos: cuadrícula 2x2 con Turrón, Sam, Roma y «EG».
    total = lado en píxeles lógicos; m = margen exterior. Devuelve una lista de filas de colores (None = fondo)."""
    g = 2; c = (total - 2 * m - g) // 2
    px = [[None] * total for _ in range(total)]
    def hx(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    INK = hx('#2B1A12'); SHADOW = hx('#B7791F'); TAG = hx('#FFC83A')
    tiles = [('turron', '#FFF8EE'), ('sam', '#E1ECF8'), ('roma', '#FCE8F0'), ('EG', '#2B1A12')]
    E = ['11111', '10000', '10000', '11110', '10000', '10000', '11111']
    G = ['01111', '10000', '10000', '10111', '10001', '10001', '01110']
    for n, (what, bg) in enumerate(tiles):
        x0 = m + (n % 2) * (c + g); y0 = m + (n // 2) * (c + g)
        for y in range(c):
            for x in range(c):
                # esquinas redondeadas de píxel, como los botones de la app
                if (x in (0, c - 1) and y in (0, 1, c - 2, c - 1)) or (y in (0, c - 1) and x in (0, 1, c - 2, c - 1)): continue
                px[y0 + y][x0 + x] = hx(bg)
        # sombra de 1 píxel bajo cada baldosa (la sombra sólida de los botones)
        if y0 + c < total:
            for x in range(2, c - 2): px[y0 + c][x0 + x] = SHADOW
        if what == 'EG':
            ox = x0 + (c - 22) // 2; oy = y0 + (c - 14) // 2
            for li, L in enumerate((E, G)):
                for y, r in enumerate(L):
                    for x, v in enumerate(r):
                        if v == '1':
                            for dy in (0, 1):
                                for dx in (0, 1): px[oy + y * 2 + dy][ox + li * 12 + x * 2 + dx] = TAG
        else:
            pal = PETS[what]['pal']
            ox = x0 + (c - 22) // 2; oy = y0 + (c - HEAD_ROWS) // 2
            for y, r in enumerate(grid((), None, what)[:HEAD_ROWS]):
                for x, ch in enumerate(r):
                    if ch != '.': px[oy + y][ox + x] = hx(pal[ch])
    return px

def icons():
    from PIL import Image
    BG = (255, 200, 58, 255)  # placa del collar
    def render(total, m, scale):
        px = icon_grid(total, m); im = Image.new('RGBA', (total, total), BG)
        for y, r in enumerate(px):
            for x, col in enumerate(r):
                if col: im.putpixel((x, y), col + (255,))
        return im.resize((total * scale, total * scale), Image.NEAREST)
    os.makedirs(os.path.join(ROOT, 'icons'), exist_ok=True)
    for name, total, m, scale, size in [('icon-512.png', 64, 3, 8, 512), ('icon-192.png', 64, 3, 3, 192),
                                        ('apple-touch-icon.png', 60, 2, 3, 180), ('icon-maskable-512.png', 58, 0, 6, 512)]:
        im = Image.new('RGBA', (size, size), BG); g = render(total, m, scale)
        im.paste(g, ((size - g.width) // 2, (size - g.height) // 2))
        im.save(os.path.join(ROOT, 'icons', name), optimize=True)

def icon_svg():
    px = icon_grid(64, 3)
    out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges"><rect width="64" height="64" fill="#FFC83A"/>'
    for y, r in enumerate(px):
        x = 0
        while x < 64:
            col = r[x]
            if not col: x += 1; continue
            x0 = x
            while x < 64 and r[x] == col: x += 1
            out += '<rect x="%d" y="%d" width="%d" height="1" fill="#%02X%02X%02X"/>' % ((x0, y, x - x0) + col)
    return out + '</svg>'

# ---------- página ----------
s = rd('src', 'base.html')
d = json.loads(rd('src', 'guide_data.json'))
d['rec'] += EXTRA + ADULT + CAMILA  # orden fijo: adultos nuevos (7) y luego Camila (20), contadas desde el final en learning.js
assert sum(1 for b in CAMILA if b['t'] == 'h1') == 20
d['kid'] = {'scen': KID_SCENARIOS, 'cando': KID_CANDO, 'stages': STAGES}
NEW_ADULT = sum(1 for b in ADULT if b['t'] == 'h1'); assert NEW_ADULT == 7
d['adult'] = {'stages': ADULT_STAGES, 'path': ADULT_PATH, 'scen': ADULT_SCENARIOS, 'n': NEW_ADULT}
js = json.dumps(d, ensure_ascii=False).replace('</', '<\\/')
a = s.index('<script id="data" type="application/json">') + len('<script id="data" type="application/json">'); b = s.index('</script>', a)
s = s[:a] + js + s[b:]

dogvars = ':root{--dog-head:%s;--dog-ok:%s;--dog-sleep:%s}\n' % (
    uri(svg(head=True)), uri(svg(('happy',), head=True)), uri(svg(('sleep',), head=True)))
css = rd('src', 'learning.css') + rd('src', 'design.css') + rd('src', 'turron.css') + rd('src', 'identity.css') + dogvars
s = s.replace('</style>', css + '</style>', 1)
assert s.count('function render(keep){') == 1
s = s.replace('function render(keep){', 'function renderV1(keep){')
m = 'var VIEWS={inicio:vInicio'
assert s.count(m) == 1
v4 = rd('src', 'turron.js').replace('__DOG__', json.dumps(JSDOG, ensure_ascii=False))
v4 += "\nfunction stopMic(){ mic.cb=null; if(mic.on){ if(caps.dictation){ try{ caps.dictation.stop(); }catch(e){} } if(T.rec){ try{ T.rec.abort(); }catch(e){} } } mic.on=false; }\n"
s = s.replace(m, rd('src', 'learning.js') + v4 + '\nvar VIEWS={tutor:vTutor,inicio:vInicio')

# barra inferior: cinco botones, Turrón al centro (el Plan vive dentro de Inicio)
a = s.index('<nav class="tabs"'); b = s.index('</nav>', a) + len('</nav>')
old = s[a:b]
def tab(k):
    i = old.index('<button data-tab="%s">' % k); return old[i:old.index('</button>', i) + 9]
nav = ('<nav class="tabs" aria-label="Secciones">\n  ' + tab('inicio') + '\n  ' + tab('frases') +
       '\n  <button data-tab="tutor" class="tcenter"><span class="tdog">' + svg(head=True) + '</span><span class="petname">Turrón</span></button>\n  ' +
       tab('trabajo') + '\n  ' + tab('practicar') + '\n</nav>')
s = s[:a] + nav + s[b:]
# ícono de pestaña incrustado (funciona también dentro de Claude, donde no hay carpeta icons/)
fav = '<link rel="icon" href="icons/icon-192.png">'
assert s.count(fav) == 1
s = s.replace(fav, '<link rel="icon" href="data:image/svg+xml,%s">' % quote(icon_svg().replace('"', "'"), safe=" =:/';,"))
# logo en la barra superior
s = s.replace('<span class="logo"></span>', '<span class="logo">' + svg(head=True) + '</span>', 1)

P = [
    (r"replace(/\[[^\]]*\]/g,'')", r"replace(/\[[^\]]*\]/g,'').replace(/\s*\([^)]*\)/g,'')"),
    ("if(!voice) pickVoice(); if(voice) u.voice=voice;", "if(!voice) pickVoice(); if(voice&&!/Android/i.test(navigator.userAgent)) u.voice=voice;"),
    ("finish(false,NOAUDIO); } },4000);", "finish(false,NOAUDIO); } },7000);"),
    ("    cap.speak(txt,{language:'en',rate:slow?0.7:1}).then(", "    var sp; try{ sp=Promise.resolve(cap.speak(txt,{language:'en',rate:slow?0.7:1})); }catch(e){ sp=Promise.reject(e); }\n    sp.then("),
    ("window.claude.use('tts').then(function(t){ ttsCap=t||null; }).catch(function(){});", "Promise.resolve(window.claude.use('tts')).then(function(t){ ttsCap=t||null; }).catch(function(){});"),
    (".slow{border:0;background:none;font-size:.82rem;color:var(--lagoon)", ".slow{border:0;background:none;font-size:.85rem;min-height:36px;min-width:44px;color:var(--deep)"),
]
for a, c in P:
    assert s.count(a) == 1, (a, s.count(a)); s = s.replace(a, c)

wr(s, 'dist', 'claude.html')

# ---------- sitio público (GitHub Pages): Gemini + app instalable ----------
a = '<title>English Dog: aprendiendo inglés con Turrón</title>'
assert a in s
web = s.replace(a, a + '\n' + rd('src', 'gemini.html') + rd('src', 'pwa.html') + rd('src', 'sync.html'))
assert web.count('</head>\n<body>') == 1
web = web.replace('</head>\n<body>', '</head>\n<body>\n<div id="splash" aria-hidden="true"><span>' + svg() + '</span><b>English Dog</b></div>', 1)
wr(web, 'index.html')
icons()
h = hashlib.sha256((web + rd('src', 'sw.js') + rd('src', 'manifest.webmanifest')).encode('utf-8'))
for f in sorted(os.listdir(os.path.join(ROOT, 'icons'))): h.update(open(os.path.join(ROOT, 'icons', f), 'rb').read())
ver = h.hexdigest()[:10]
wr(rd('src', 'sw.js').replace('__VERSION__', ver), 'sw.js')
wr(rd('src', 'manifest.webmanifest'), 'manifest.webmanifest')
print('built index.html (GitHub Pages + PWA %s) and dist/claude.html (Claude artifact)' % ver)
