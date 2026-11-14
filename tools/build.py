# Construye el sitio a partir de src/. Uso: python3 tools/build.py
# Salidas: index.html (GitHub Pages, con Gemini y PWA), dist/claude.html (artifact de Claude),
# icons/*.png, manifest.webmanifest y sw.js (generados a partir del sprite de Turrón).
import json, os, sys, hashlib
from urllib.parse import quote
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'src'))
from content_extra import EXTRA

def rd(*p): return open(os.path.join(ROOT, *p), encoding='utf-8').read()
def wr(text, *p):
    os.makedirs(os.path.dirname(os.path.join(ROOT, *p)), exist_ok=True)
    open(os.path.join(ROOT, *p), 'w', encoding='utf-8', newline='\n').write(text)

# ---------- Turrón: el sprite como fuente de la marca ----------
DOG = json.loads(rd('src', 'turron_sprite.json'))
HEAD_ROWS = 14  # cabeza y collar: filas 0-13

def grid(mods=(), tail='tailA'):
    rows = [list(r) for r in DOG['rows']]
    for m in mods:
        o = DOG[m]
        if isinstance(o, list):
            for x, y, c in o: rows[y][x] = c
        else:
            for i, r in o.items(): rows[int(i)] = list(r)
    if tail:
        for x, y, c in DOG[tail]: rows[y][x] = c
    return rows

def svg(mods=(), head=False, label=None):
    rows = grid(mods, None if head else 'tailA')[:HEAD_ROWS if head else 22]
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
            out += '<rect x="%d" y="%d" width="%d" height="1" fill="%s"/>' % (x0, y, x - x0, DOG['pal'][c])
    return out + '</svg>'

def uri(s):
    s = s.replace(' aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"').replace('"', "'")
    return 'url("data:image/svg+xml,%s")' % quote(s, safe=" =:/';,")

def icons():
    from PIL import Image
    BG = (255, 200, 58, 255)  # placa del collar
    def head(scale):
        rows = grid((), None)[:HEAD_ROWS]
        im = Image.new('RGBA', (22, HEAD_ROWS), (0, 0, 0, 0))
        for y, r in enumerate(rows):
            for x, c in enumerate(r):
                if c != '.':
                    h = '#B7791F' if c == 'Y' else DOG['pal'][c]  # la placa, más oscura para que se vea sobre el fondo amarillo
                    im.putpixel((x, y), tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,))
        return im.resize((22 * scale, HEAD_ROWS * scale), Image.NEAREST)
    for size, scale, name in [(512, 16, 'icon-512.png'), (192, 6, 'icon-192.png'), (180, 6, 'apple-touch-icon.png'), (512, 14, 'icon-maskable-512.png')]:
        im = Image.new('RGBA', (size, size), BG)
        h = head(scale)
        im.paste(h, ((size - h.width) // 2, (size - h.height) // 2 + scale), h)
        os.makedirs(os.path.join(ROOT, 'icons'), exist_ok=True)
        im.save(os.path.join(ROOT, 'icons', name), optimize=True)

# ---------- página ----------
s = rd('src', 'base.html')
d = json.loads(rd('src', 'guide_data.json'))
d['rec'] += EXTRA
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
v4 = rd('src', 'turron.js').replace('__DOG__', json.dumps(DOG, ensure_ascii=False))
v4 += "\nfunction stopMic(){ mic.cb=null; if(mic.on){ if(caps.dictation){ try{ caps.dictation.stop(); }catch(e){} } if(T.rec){ try{ T.rec.abort(); }catch(e){} } } mic.on=false; }\n"
s = s.replace(m, rd('src', 'learning.js') + v4 + '\nvar VIEWS={tutor:vTutor,inicio:vInicio')

# barra inferior: cinco botones, Turrón al centro (el Plan vive dentro de Inicio)
a = s.index('<nav class="tabs"'); b = s.index('</nav>', a) + len('</nav>')
old = s[a:b]
def tab(k):
    i = old.index('<button data-tab="%s">' % k); return old[i:old.index('</button>', i) + 9]
nav = ('<nav class="tabs" aria-label="Secciones">\n  ' + tab('inicio') + '\n  ' + tab('frases') +
       '\n  <button data-tab="tutor" class="tcenter"><span class="tdog">' + svg(head=True) + '</span>Turrón</button>\n  ' +
       tab('trabajo') + '\n  ' + tab('practicar') + '\n</nav>')
s = s[:a] + nav + s[b:]
# ícono de pestaña incrustado (funciona también dentro de Claude, donde no hay carpeta icons/)
fav = '<link rel="icon" href="icons/icon-192.png">'
assert s.count(fav) == 1
s = s.replace(fav, '<link rel="icon" href="%s">' % uri(svg(head=True))[4:-1].strip('"'))
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
a = '<title>Turrón: aprendiendo con el Jeirer</title>'
assert a in s
web = s.replace(a, a + '\n' + rd('src', 'gemini.html') + rd('src', 'pwa.html'))
assert web.count('</head>\n<body>') == 1
web = web.replace('</head>\n<body>', '</head>\n<body>\n<div id="splash" aria-hidden="true"><span>' + svg() + '</span><b>Turrón</b></div>', 1)
wr(web, 'index.html')
icons()
h = hashlib.sha256((web + rd('src', 'sw.js') + rd('src', 'manifest.webmanifest')).encode('utf-8'))
for f in sorted(os.listdir(os.path.join(ROOT, 'icons'))): h.update(open(os.path.join(ROOT, 'icons', f), 'rb').read())
ver = h.hexdigest()[:10]
wr(rd('src', 'sw.js').replace('__VERSION__', ver), 'sw.js')
wr(rd('src', 'manifest.webmanifest'), 'manifest.webmanifest')
print('built index.html (GitHub Pages + PWA %s) and dist/claude.html (Claude artifact)' % ver)
