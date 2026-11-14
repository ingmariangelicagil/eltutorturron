# Construye el sitio a partir de src/. Uso: python3 tools/build.py
import json,re,sys,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,os.path.join(ROOT,'src'))
from content_extra import EXTRA
s=open(os.path.join(ROOT,'src/base.html')).read()
d=json.load(open(os.path.join(ROOT,'src/guide_data.json')))
d['rec']+=EXTRA
js=json.dumps(d,ensure_ascii=False).replace('</','<\\/')
a=s.index('<script id="data" type="application/json">')+len('<script id="data" type="application/json">'); b=s.index('</script>',a)
s=s[:a]+js+s[b:]
s=s.replace('</style>',open(os.path.join(ROOT,'src/learning.css')).read()+open(os.path.join(ROOT,'src/design.css')).read()+open(os.path.join(ROOT,'src/turron.css')).read()+'</style>',1)
assert s.count('function render(keep){')==1
s=s.replace('function render(keep){','function renderV1(keep){')
m='var VIEWS={inicio:vInicio'
assert s.count(m)==1
v4=open(os.path.join(ROOT,'src/turron.js')).read().replace('__DOG__',open(os.path.join(ROOT,'src/turron_sprite.json')).read())
v4+="\nfunction stopMic(){ mic.cb=null; if(mic.on){ if(caps.dictation){ try{ caps.dictation.stop(); }catch(e){} } if(T.rec){ try{ T.rec.abort(); }catch(e){} } } mic.on=false; }\n"
s=s.replace(m,open(os.path.join(ROOT,'src/learning.js')).read()+v4+'\nvar VIEWS={tutor:vTutor,inicio:vInicio')
nav='<button data-tab="practicar">'
assert s.count(nav)==1
s=s.replace(nav,'<button data-tab="tutor"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="4.5" ry="3.5"/><circle cx="5.5" cy="11" r="1.8"/><circle cx="9.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18.5" cy="11" r="1.8"/></svg>Turrón</button>'+nav)
P=[
("replace(/\[[^\]]*\]/g,'')", "replace(/\[[^\]]*\]/g,'').replace(/\s*\([^)]*\)/g,'')"),
("if(!voice) pickVoice(); if(voice) u.voice=voice;", "if(!voice) pickVoice(); if(voice&&!/Android/i.test(navigator.userAgent)) u.voice=voice;"),
("finish(false,NOAUDIO); } },4000);", "finish(false,NOAUDIO); } },7000);"),
("    cap.speak(txt,{language:'en',rate:slow?0.7:1}).then(", "    var sp; try{ sp=Promise.resolve(cap.speak(txt,{language:'en',rate:slow?0.7:1})); }catch(e){ sp=Promise.reject(e); }\n    sp.then("),
("window.claude.use('tts').then(function(t){ ttsCap=t||null; }).catch(function(){});", "Promise.resolve(window.claude.use('tts')).then(function(t){ ttsCap=t||null; }).catch(function(){});"),
("--flamingo:#E4487A", "--flamingo:#D6336C"), ("--aloe:#2F8F5B", "--aloe:#1F7A49"), ("--soft:#5C7680", "--soft:#4F6872"),
(".slow{border:0;background:none;font-size:.82rem;color:var(--lagoon)", ".slow{border:0;background:none;font-size:.85rem;min-height:36px;min-width:44px;color:var(--deep)"),
]
for a,c in P:
    assert s.count(a)==1,(a,s.count(a)); s=s.replace(a,c)
os.makedirs(os.path.join(ROOT,'dist'),exist_ok=True)
open(os.path.join(ROOT,'dist','claude.html'),'w').write(s)
# version for the public site (GitHub Pages): adds Gemini
a='<title>Inglés para la vida en Aruba</title>'
assert a in s
web=s.replace(a,'<title>El Tutor Turrón: inglés para la vida en Aruba</title>\n'+open(os.path.join(ROOT,'src','gemini.html')).read())
open(os.path.join(ROOT,'index.html'),'w').write(web)
print('built index.html (GitHub Pages) and dist/claude.html (Claude artifact)')
