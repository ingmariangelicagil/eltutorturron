
/* ================= v4: Turrón, tutor IA con voz ================= */
var DOG=__DOG__;
var T={chat:[],busy:false,sc:null,dog:'idle',voice:true,fix:true,micLang:'en',noSR:false,heard:''};
function dogSVG(mods,tail){ var rows=DOG.rows.map(function(r){return r.split('');});
  mods.forEach(function(m){ var o=DOG[m]; for(var i in o) rows[+i]=o[i].split(''); });
  DOG[tail].forEach(function(p){ rows[p[1]][p[0]]=p[2]; });
  var out='<svg viewBox="0 0 22 22" shape-rendering="crispEdges" role="img" aria-label="Turrón, un beagle pixelado">';
  rows.forEach(function(r,y){ var x=0; while(x<22){ var c=r[x]; if(c==='.'){ x++; continue; } var x0=x; while(x<22&&r[x]===c) x++; out+='<rect x="'+x0+'" y="'+y+'" width="'+(x-x0)+'" height="1" fill="'+DOG.pal[c]+'"/>'; } });
  return out+'</svg>'; }
var dogTick=0, dogKey='', noMotion=false; try{ noMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
function dogDraw(){ var el=$('#dog'); if(!el) return; var s=T.dog, mods=[], tail='tailA';
  if(s==='happy') mods.push('happy'); else if(!noMotion&&dogTick%16===0) mods.push('blink');
  if(s==='talk'&&(noMotion||dogTick%2===0)) mods.push('talk');
  if(!noMotion&&s!=='think'&&Math.floor(dogTick/(s==='happy'?1:2))%2===1) tail='tailB';
  var key=mods.join()+tail; el.setAttribute('data-state',s); if(key!==dogKey||!el.firstChild){ dogKey=key; el.innerHTML=dogSVG(mods,tail); } }
function setDog(s){ T.dog=s; dogDraw(); var l=$('#dogLab'); if(l) l.textContent={idle:'',listen:'Te escucho…',think:'Pensando…',talk:'',happy:'¡Muy bien!'}[s]||''; }
if(!noMotion) setInterval(function(){ if(st.tab!=='tutor') return; dogTick++; dogDraw(); },230);

var TSC=[
 {who:'ella',t:'Tomar una reserva por teléfono',p:'Role-play: you are a tourist calling to book a hotel room in Aruba. The learner is the reservations agent taking the call.'},
 {who:'ella',t:'Cambiar o cancelar una reserva',p:'Role-play: you are a guest calling to change the dates of a reservation, and then asking about the cancellation policy. The learner is the reservations agent.'},
 {who:'ella',t:'Cliente molesto',p:'Role-play: you are an upset but reasonable guest calling because the room is not what you booked. The learner is the reservations agent. Calm down when they apologize and offer a solution.'},
 {who:'ella',t:'Cobrar y confirmar datos',p:'Role-play: you are a customer finishing a booking. The learner is the reservations agent and must ask for your name spelling, dates, card details and confirm the total.'},
 {who:'el',t:'Visita por falla de internet',p:'Role-play: you are a customer in Aruba whose home internet stopped working yesterday. The learner is the telecom technician who just arrived at your door.'},
 {who:'el',t:'Instalación nueva',p:'Role-play: you are a customer getting a new fiber internet installation. The learner is the technician. Ask where the modem should go, how long it takes and what the Wi-Fi password is.'},
 {who:'el',t:'Explicar una demora al cliente',p:'Role-play: you are a customer waiting for a repair. The learner is the telecom technician and must explain that a part is missing and someone will come back tomorrow.'},
 {who:'el',t:'Pedir materiales a un compañero',p:'Role-play: you are a co-worker at the telecom warehouse. The learner is a field technician asking for cable, connectors and tools.'},
 {who:'both',t:'Hablar con mi supervisor',p:'Role-play: you are the learner\'s supervisor at work in Aruba. Ask how today is going, what problems came up, and discuss tomorrow\'s schedule.'},
 {who:'both',t:'Charla libre sobre mi trabajo',p:'Have a relaxed conversation about the learner\'s job and work day. Ask simple questions about what they do, their co-workers, schedule and customers.'},
 {who:'both',t:'Pregúntale a Turrón: ¿cómo se dice…?',ask:1,p:'The learner will ask, in Spanish or broken English, how to say things they need at work. In EN give the best natural English phrase for work and one short example. Then ask what else they need.'}];
function jobLine(){ return mem.who==='el'?'a telecommunications field technician':'a reservations agent'; }
function tPrompt(sc){ return 'You are Turrón, a friendly beagle who tutors English. Your student is a Spanish-speaking adult beginner (CEFR A1-A2) who recently moved to Aruba and works as '+jobLine()+'. The goal is the English they need at work.\n\nTask: '+sc.p+'\n\nRules:\n- Use short, simple, natural spoken English: one or two sentences, common words. It will be read aloud.\n- Always end with something the student can answer.\n- Check the student\'s last message. Small typos, missing capitals or punctuation do not count as mistakes (it may be voice transcription).\n- Reply in EXACTLY this format, four lines, nothing else:\nEN: <your next line in English>\nES: <Spanish translation of your EN line>\nFIX: <the student\'s last message rewritten in correct, natural English; write OK if it was already fine or if this is your first turn>\nTIP: <one short sentence in Spanish explaining the correction, or a short praise in Spanish if it was fine>\n\nStart now with your first line.'; }
function tParse(t){ function pick(k){ var m=new RegExp('(?:^|\\n)\\s*'+k+':\\s*([\\s\\S]*?)(?=\\n\\s*(?:EN|ES|FIX|TIP):|$)').exec(t); return m?m[1].trim():''; }
  var en=pick('EN'), fix=pick('FIX'); if(/^ok\.?$/i.test(fix)) fix=''; return {en:en||t.trim(),es:pick('ES'),fix:fix,tip:pick('TIP')}; }
function aiState(){ if(caps.sample) return 'ok'; try{ if(window.TUTOR_GEMINI||window.TUTOR_API) return 'ok'; }catch(e){} return caps.sample===undefined?'wait':'none'; }
function askAI(msgs){ if(caps.sample){ try{ return Promise.resolve(caps.sample(msgs,{modelTier:'quick',cache:false})).then(function(r){ return (r&&r.text)||''; }); }catch(e){ return Promise.reject(e); } }
  var gem=null; try{ gem=window.TUTOR_GEMINI; }catch(e){} if(gem){ try{ return Promise.resolve(gem(msgs)); }catch(e){ return Promise.reject(e); } }
  var api=null; try{ api=window.TUTOR_API; }catch(e){} if(!api) return Promise.reject({code:'none'});
  var pass=''; try{ pass=localStorage.getItem('turron-clave')||''; }catch(e){}
  return fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,clave:pass})}).then(function(r){ if(!r.ok) throw {code:r.status===401?'clave':r.status===429?'rate_limited':'http'}; return r.json(); }).then(function(j){ return (j&&j.text)||''; }); }

/* voz en dos idiomas: la corrección en español, la frase en inglés */
function speakLines(lines,done){ var tok=++sayTok, fin=false; lines=lines.filter(function(l){return l&&l.text;});
  function finish(ok){ if(fin) return; fin=true; if(done) done(!!ok&&tok===sayTok); }
  if(!lines.length){ finish(true); return; }
  function browser(){ if(!synth){ finish(false); return; } try{ if(synth.speaking||synth.pending) synth.cancel(); }catch(e){}
    var i=0; (function next(){ if(tok!==sayTok){ finish(false); return; } if(i>=lines.length){ finish(true); return; }
      try{ var l=lines[i++], u=new SpeechSynthesisUtterance(clean(l.text)); u.lang=l.lang==='es'?'es-ES':'en-US'; if(l.lang!=='es'){ if(!voice) pickVoice(); if(voice&&!/Android/i.test(navigator.userAgent)) u.voice=voice; } u.rate=0.95;
        u.onend=function(){ next(); }; u.onerror=function(){ finish(false); }; curU=u; try{ synth.resume(); }catch(e){} synth.speak(u); }catch(e){ finish(false); } })(); }
  if(ttsCap){ var pr; try{ pr=Promise.resolve(ttsCap.speak(lines.map(function(l){ return {text:clean(l.text),language:l.lang==='es'?'es':'en'}; }))); }catch(e){ pr=Promise.reject(e); }
    pr.then(function(){ finish(true); }).catch(function(err){ var c=err&&err.code; if(tok!==sayTok){ finish(false); return; } if(c==='not_granted'){ ttsCap=null; browser(); } else if(c==='rate_limited'||c==='busy'){ finish(false); } else browser(); }); }
  else browser(); }

/* micrófono: dictado de Claude o reconocimiento del navegador */
function SRClass(){ try{ return window.SpeechRecognition||window.webkitSpeechRecognition||null; }catch(e){ return null; } }
function micAvail(){ return !!caps.dictation||(!!SRClass()&&!T.noSR); }
function wireMic(){ var d=caps.dictation; if(!d||mic.wired) return; mic.wired=true;
  try{ d.onPartial(function(x){ var tx=(x&&x.text)||''; if(mic.cb){ var h=$('#tHeard'); if(h) h.textContent=(mic.text+' '+tx).trim(); return; } var f=$('#micFb'); if(f&&mic.on){ f.className='fb'; f.textContent=tx; } });
    d.onFinal(function(x){ mic.text+=' '+((x&&x.text)||''); if(mic.on){ try{ d.stop(); }catch(e){} } });
    d.onState(function(x){ if(x&&x.state==='listening'){ mic.on=true; micBtn(); tMicUI(); } else if(x&&x.state==='idle'){ var was=mic.on; mic.on=false; micBtn(); tMicUI(); if(was){ if(mic.cb){ var cb=mic.cb; mic.cb=null; cb(mic.text.trim()); } else micScore(); } } }); }catch(e){} }
function tMicUI(){ var b=$('#tMic'); if(b){ b.classList.toggle('on',mic.on); b.setAttribute('aria-pressed',mic.on?'true':'false'); var s=b.querySelector('span'); if(s) s.textContent=mic.on?'Toca para terminar':'Toca para hablar'; } if(st.tab==='tutor'&&!T.busy) setDog(mic.on?'listen':'idle'); }
function tListen(){ if(T.busy) return; stopAll();
  if(mic.on){ if(caps.dictation){ try{ caps.dictation.stop(); }catch(e){} } else if(T.rec){ try{ T.rec.stop(); }catch(e){} } return; }
  mic.text=''; var h=$('#tHeard'); if(h) h.textContent='';
  if(caps.dictation){ mic.cb=tHeard; var pr; try{ pr=Promise.resolve(caps.dictation.start()); }catch(e){ pr=Promise.reject(e); }
    pr.catch(function(err){ mic.on=false; mic.cb=null; tMicUI(); if(err&&err.code==='not_granted'){ caps.dictation=null; render(true); } toast('No se pudo usar el micrófono. Pueden escribir su respuesta.'); }); return; }
  var SR=SRClass(); if(!SR) return;
  try{ var r=new SR(), finalT=''; T.rec=r; r.lang=T.micLang==='es'?'es-ES':'en-US'; r.interimResults=true; r.continuous=false;
    r.onstart=function(){ mic.on=true; tMicUI(); };
    r.onresult=function(ev){ var it=''; for(var i=ev.resultIndex;i<ev.results.length;i++){ if(ev.results[i].isFinal) finalT+=ev.results[i][0].transcript+' '; else it+=ev.results[i][0].transcript; } var h2=$('#tHeard'); if(h2) h2.textContent=(finalT+it).trim(); };
    r.onerror=function(ev){ var c=ev&&ev.error; if(c==='not-allowed'||c==='service-not-allowed'){ T.noSR=true; mic.on=false; render(true); toast('El micrófono no está permitido aquí. Pueden escribir su respuesta.'); } };
    r.onend=function(){ var was=mic.on; mic.on=false; T.rec=null; tMicUI(); if(was) tHeard(finalT.trim()); };
    r.start(); }catch(e){ T.noSR=true; render(true); } }
function tHeard(text){ if(st.tab!=='tutor') return; if(!text){ toast('No se escuchó nada. Prueben otra vez, más cerca del micrófono.'); return; } tSend(text); }

function tStart(i){ T.chat=[]; T.sc=TSC[i]; T.busy=false; T.over=false; if(window.TUTOR_KEY&&!caps.sample&&!window.TUTOR_KEY.get()){ T.needPass=true; render(true); return; } render(true); tTurn(); }
function tSend(text){ if(T.busy||!T.sc) return; text=String(text).trim().slice(0,400); if(!text) return; T.chat.push({role:'user',text:text}); tTurn(); }
function tTurn(){ var sc=T.sc; T.busy=true; tDraw(); setDog('think');
  var msgs=[{role:'user',content:tPrompt(sc)}]; T.chat.forEach(function(m){ msgs.push({role:m.role,content:m.role==='user'?m.text:m.raw}); });
  askAI(msgs).then(function(raw){ if(T.sc!==sc) return; if(!raw) throw {code:'empty'}; T.busy=false; var p=tParse(raw), first=!T.chat.length; T.chat.push({role:'assistant',raw:raw,p:p}); touch(); tDraw();
      var lines=[]; if(!first&&T.fix){ if(p.fix){ lines.push({text:'Casi. Se dice así:',lang:'es'},{text:p.fix,lang:'en'}); if(p.tip) lines.push({text:p.tip,lang:'es'}); } else if(p.tip&&p.tip.length<60) lines.push({text:p.tip,lang:'es'}); }
      lines.push({text:p.en,lang:'en'});
      if(T.voice&&canSpeak()){ setDog(!first&&!p.fix?'happy':'talk'); setTimeout(function(){ if(T.sc===sc&&T.dog==='happy') setDog('talk'); },700); speakLines(lines,function(){ if(T.sc===sc&&!T.busy&&!mic.on) setDog('idle'); }); }
      else { setDog(!first&&!p.fix?'happy':'idle'); if(T.dog==='happy') setTimeout(function(){ if(T.sc===sc&&T.dog==='happy') setDog('idle'); },1400); }
      if(T.chat.filter(function(m){return m.role==='user';}).length>=15) T.over=true; tDraw(); })
   .catch(function(err){ if(T.sc!==sc) return; T.busy=false; var c=err&&err.code, last=T.chat[T.chat.length-1], back=''; if(last&&last.role==='user'){ back=T.chat.pop().text; }
     setDog('idle'); if(c==='not_granted'){ caps.sample=null; T.sc=null; render(true); return; }
     if(c==='clave'){ T.needPass=true; }
     if(!T.chat.length&&c!=='clave'){ T.sc=null; render(true); } else tDraw();
     var i=$('#tIn2'); if(i&&back) i.value=back;
     if(c==='clave'&&window.TUTOR_KEY&&window.TUTOR_KEY.get()){ window.TUTOR_KEY.set(''); }
     toast(c==='rate_limited'?'Se alcanzó el límite gratuito de Gemini por ahora. Esperen un minuto.':c==='clave'?(window.TUTOR_KEY?'Falta la clave de Gemini o no es válida.':'Hace falta la clave del tutor.'):'Turrón no pudo responder. Prueben otra vez.'); }); }
function tBubble(){ var last=null; for(var i=T.chat.length-1;i>=0;i--) if(T.chat[i].role==='assistant'){ last=T.chat[i].p; break; }
  if(T.busy) return '<p class="en"><i>…</i></p>';
  if(last) return '<p class="en" lang="en">'+esc(last.en)+'</p>'+(last.es?'<p class="es">'+esc(last.es)+'</p>':'')+'<button class="play" data-say="'+esc(last.en)+'" aria-label="Escuchar otra vez">'+PLAY+'</button>';
  return '<p class="en" lang="en">Woof! I\'m Turrón. Let\'s practice your work English.</p><p class="es">¡Guau! Soy Turrón. Practiquemos tu inglés para el trabajo.</p>'; }
function tDraw(){ var b=$('#tBub'); if(b) b.innerHTML=tBubble(); var c=$('#tLog'); if(!c) return;
  c.innerHTML=T.chat.map(function(m,i){ if(m.role==='user') return '<div class="msg me" lang="en">'+esc(m.text)+'</div>'; var p=m.p, out='';
    if(i>0&&p.fix) out+='<div class="msg tipm"><b>Se dice así:</b> <span lang="en">'+esc(p.fix)+'</span> <button class="slow" data-say="'+esc(p.fix)+'">escuchar</button>'+(p.tip?'<br>'+esc(p.tip):'')+'</div>';
    else if(i>0&&p.tip) out+='<div class="msg okm">'+esc(p.tip)+'</div>';
    return out+'<div class="msg bot"><button class="play" data-say="'+esc(p.en)+'" aria-label="Escuchar">'+PLAY+'</button><div><div lang="en"><b>'+esc(p.en)+'</b></div>'+(p.es?'<div class="es">'+esc(p.es)+'</div>':'')+'</div></div>'; }).join('');
  var f=$('#tCtl'); if(f){ var dis=T.busy?' disabled':'';
    if(T.needPass){ if(!f.querySelector('#tPass')) f.innerHTML=window.TUTOR_KEY?'<div class="ex" style="text-align:left"><h3 style="margin-top:0">Conecta a Turrón con Gemini</h3><ol><li>Abre <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> con tu cuenta de Google.</li><li>Toca «Create API key» y copia la clave.</li><li>Pégala aquí. Se guarda solo en este teléfono.</li></ol><div class="bar"><input class="inp" id="tPass" type="password" autocomplete="off" style="flex:1;min-width:0" aria-label="Clave de Gemini"><button class="btn fill" id="tPassOk">Guardar</button></div></div>':'<p>Escriban la clave del tutor:</p><div class="bar"><input class="inp" id="tPass" type="password" style="flex:1;min-width:0" aria-label="Clave del tutor"><button class="btn fill" id="tPassOk">Guardar</button></div>'; }
    else if(T.over){ f.innerHTML='<p><b>Buena práctica.</b> Lean otra vez las correcciones y anoten una frase en «Mi cuaderno».</p><button class="btn pink" id="tNew">Otra conversación</button>'; }
    else if(!f.querySelector('#tIn2')){ f.innerHTML=(micAvail()?'<button class="micbig" id="tMic" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg><span>Toca para hablar</span></button><p class="heard" id="tHeard" aria-live="polite"></p>':'<p class="note">El micrófono no está disponible en esta vista. Escriban su respuesta; Turrón igual responde y corrige.</p>')+
        '<div class="bar"><input class="inp" id="tIn2" style="flex:1;min-width:0" lang="en" autocomplete="off" placeholder="O escriban aquí en inglés" aria-label="Su respuesta"><button class="btn fill" id="tSend2">Enviar</button></div>'+
        '<div class="row tset"><button class="btn small" id="tVoice" aria-pressed="'+T.voice+'">Voz de Turrón: '+(T.voice?'sí':'no')+'</button><button class="btn small" id="tFix" aria-pressed="'+T.fix+'">Corregir en voz alta: '+(T.fix?'sí':'no')+'</button>'+(!caps.dictation&&SRClass()&&!T.noSR?'<button class="btn small" id="tLang">Hablo en: '+(T.micLang==='es'?'español':'inglés')+'</button>':'')+'<button class="btn small" id="tNew">Cambiar de tema</button>'+(window.TUTOR_KEY&&window.TUTOR_KEY.get()?'<button class="btn small" id="tKey">Cambiar clave de Gemini</button>':'')+'</div>'; }
    var bs=f.querySelectorAll('#tMic,#tSend2'); for(var k=0;k<bs.length;k++) bs[k].disabled=!!T.busy; }
  var end=$('#tEnd'); if(end&&T.chat.length>1){ try{ end.scrollIntoView({block:'end'}); }catch(e){} } }
function vTutor(){ var a=aiState(), mine=mem.who, list=TSC.map(function(s,i){return {s:s,i:i};}).sort(function(x,y){ function r(z){ return z.s.who===mine?0:z.s.who==='both'?1:2; } return r(x)-r(y)||x.i-y.i; });
  var head='<div class="tstage"><div><div class="dog" id="dog" data-state="'+T.dog+'"></div><p class="doglab" id="dogLab" aria-live="polite"></p></div><div class="tb" id="tBub">'+tBubble()+'</div></div>';
  var body;
  if(a==='wait') body='<p>Buscando a Turrón…</p>';
  else if(a==='none') body='<aside class="box warn"><strong class="t">Turrón necesita conexión con la IA</strong><p>En esta vista no hay un servicio de IA disponible. Dentro de Claude funciona al abrir la guía con sesión iniciada. Mientras tanto pueden practicar las mismas situaciones en «Role-plays y juegos».</p></aside><button class="btn" data-start="role">Ir a los role-plays</button>';
  else if(!T.sc) body='<h1>Turrón, tu tutor de inglés</h1><p>Elige una situación de tu trabajo. Turrón hace el otro papel, te habla en inglés sencillo y corrige cada respuesta, por voz y por escrito.</p><div class="tlist">'+list.map(function(x){ return '<button class="mode" data-tsc="'+x.i+'"><b>'+x.s.t+'</b><span>'+(x.s.who==='el'?'Técnico':x.s.who==='ella'?'Reservaciones':'Para los dos')+'</span></button>'; }).join('')+'</div><p class="note">La primera vez puede pedir permiso para usar la IA y el micrófono. Turrón es una IA y puede equivocarse.</p>';
  else body='<p class="note" style="margin-top:0">'+esc(T.sc.t)+'</p><div id="tLog" class="chat tchat" aria-live="polite"></div><div id="tCtl" class="tctl"></div><div id="tEnd"></div>';
  return '<div class="wrap tutor">'+head+body+'</div>'; }

document.addEventListener('click',function(e){ var t=e.target.closest('button'); if(!t||st.tab!=='tutor') return; var d=t.dataset;
  if(d.tsc!==undefined){ tStart(+d.tsc); return; }
  if(t.id==='tMic'){ tListen(); return; }
  if(t.id==='tSend2'){ var i=$('#tIn2'), v=i.value.trim(); if(!v) return; i.value=''; stopAll(); tSend(v); return; }
  if(t.id==='tVoice'){ T.voice=!T.voice; if(!T.voice) stopAll(); $('#tCtl').innerHTML=''; tDraw(); return; }
  if(t.id==='tFix'){ T.fix=!T.fix; $('#tCtl').innerHTML=''; tDraw(); return; }
  if(t.id==='tLang'){ T.micLang=T.micLang==='es'?'en':'es'; $('#tCtl').innerHTML=''; tDraw(); return; }
  if(t.id==='tKey'){ window.TUTOR_KEY.set(''); T.needPass=true; $('#tCtl').innerHTML=''; tDraw(); return; }
  if(t.id==='tNew'){ stopAll(); stopMic(); T.sc=null; T.chat=[]; T.busy=false; T.over=false; T.dog='idle'; render(); return; }
  if(t.id==='tPassOk'){ var pv=$('#tPass').value.trim(); if(!pv) return; if(window.TUTOR_KEY) window.TUTOR_KEY.set(pv); else { try{ localStorage.setItem('turron-clave',pv); }catch(x){} } T.needPass=false; $('#tCtl').innerHTML=''; if(T.chat.length&&T.chat[T.chat.length-1].role==='user') tTurn(); else if(!T.chat.length) tTurn(); else tDraw(); return; }
});
document.addEventListener('keydown',function(e){ if(e.key!=='Enter') return; if(e.target.id==='tIn2'){ e.preventDefault(); $('#tSend2').click(); } if(e.target.id==='tPass'){ $('#tPassOk').click(); } });
/* el modo «tutor» de Practicar lleva a la pestaña de Turrón */
function tutor(){ st.mode=null; setTimeout(function(){ go('tutor'); },0); var g=$('#game'); if(g) g.innerHTML='<p>Abriendo a Turrón…</p>'; }
function afterRender(){ if(st.tab!=='tutor') return; dogKey=''; dogDraw(); if(T.sc) tDraw(); }
