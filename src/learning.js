
/* ================= v2: sistema de aprendizaje ================= */
function today(){ var d=new Date(); return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5); }
function me(){ var m=mem[mem.who]; ['known','weeks','track','goals','srs','days','sess','cando'].forEach(function(k){ if(!m[k]||typeof m[k]!=='object') m[k]={}; }); if(!Array.isArray(m.mine)) m.mine=[]; return m; }
function touch(){ var m=me(), t=today(); if(!m.days[t]){ m.days[t]=1; save(); } }
function streak(){ var d=me().days, t=today(), n=0; if(!d[t]) t--; while(d[t]){ n++; t--; } return n; }
var NAME={el:'Eduardo',ella:'Mariana'};
var PAW='<svg viewBox="0 0 7 6" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 0h1v2H2zM4 0h1v2H4zM0 1h1v2H0zM6 1h1v2H6zM2 3h3v1H2zM1 4h5v2H1z"/></svg>';
function dogMood(nd,sk){ if(nd===4) return 'happy'; if(!sk&&Object.keys(me().days).length) return 'sleep'; return 'idle'; }
function sess(){ var m=me(); if(m.sess.d!==today()) m.sess={d:today()}; return m.sess; }
function stepDone(k){ var s=sess(); if(!s[k]){ s[k]=1; save(); } touch(); }

/* capabilities: tutor con IA y micrófono */
var caps={sample:undefined,dictation:undefined};
function hookCaps(late){ var ok=false; try{ ok=!!(window.claude&&window.claude.use); }catch(e){}
  if(!ok&&!late&&document.readyState!=='complete'){ window.addEventListener('load',function(){ hookCaps(true); }); return; }
  ['sample','dictation'].forEach(function(n){
    if(!ok){ caps[n]=null; if(st.tab==='tutor'&&n==='sample'&&!T.sc) render(true); return; }
    var pr; try{ pr=Promise.resolve(window.claude.use(n)); }catch(e){ pr=Promise.resolve(null); }
    pr.then(function(v){ caps[n]=v||null; },function(){ caps[n]=null; }).then(function(){
      if(n==='dictation'&&caps[n]) wireMic();
      if(st.tab==='tutor'){ if(!T.sc) render(true); else if(n==='dictation'&&!T.busy&&!mic.on){ var tc=$('#tCtl'); if(tc){ tc.innerHTML=''; tDraw(); } } }
      if(st.tab==='practicar'&&st.mode==='tutor'&&n==='sample'&&!(G&&G.chat)) startGame();
    });
  }); }

TOPICS=[
 {k:'surv',n:'Supervivencia',s:[4]},{k:'num',n:'Números y hora',s:[15]},{k:'super',n:'Supermercado',s:[5]},{k:'casa',n:'En casa',s:[6]},
 {k:'vec',n:'Vecinos y trámites',s:[7]},{k:'med',n:'Médico y emergencias',s:[8]},{k:'tel',n:'Por teléfono',s:[16]},{k:'serv',n:'Carro y servicios',s:[17]},
 {k:'cort',n:'Cortesía',s:[22]},{k:'pron',n:'Pronunciación',s:[2],nopool:1},{k:'gram',n:'Gramática',s:[3]},{k:'verbs',n:'Verbos',s:[19]},{k:'err',n:'Errores típicos',s:[18],nopool:1},
 {k:'tec',n:'Técnico',s:[9,20],work:1},{k:'res',n:'Reservaciones',s:[10,21],work:1}];
function pool(k,noMine){ var out=[], seen={};
  TOPICS.forEach(function(t){ if((k!=='all'&&t.k!==k)||t.nopool) return;
    [].concat(t.s).forEach(function(i){ SECS[i].blocks.forEach(function(b){
      if(b.t==='phrases') b.rows.forEach(function(r){ var en=plain(r[0]); if(seen[en]) return; seen[en]=1; out.push({en:en,pr:r[1],es:plain(r[2]),ph:1}); });
      if(b.t==='vocab') b.rows.forEach(function(r){ var en=plain(r[0]); if(seen[en]) return; seen[en]=1; out.push({en:en,pr:'',es:plain(r[1])}); });
    }); }); });
  if(!noMine&&mem&&(k==='all'||k==='mio')) me().mine.forEach(function(x){ if(!seen[x.en]){ seen[x.en]=1; out.push({en:x.en,pr:'',es:x.es,ph:1,mine:1}); } });
  return out; }
ALLPH=pool('all',true).filter(function(x){return x.ph;});

function block(b){
  switch(b.t){
    case 'h2': return '<h2>'+b.title+'</h2>';
    case 'h3': return '<h3>'+b.title+'</h3>';
    case 'p': return '<p>'+b.text+'</p>';
    case 'bullets': return '<ul class="bl">'+b.items.map(function(i){return '<li>'+i+'</li>';}).join('')+'</ul>';
    case 'box': return '<aside class="box '+b.kind+'">'+(b.title?'<strong class="t">'+b.title.replace(/^[★♥⚠]\s*/,'')+'</strong>':'')+b.items.map(function(i){return '<p>'+i+'</p>';}).join('')+'</aside>';
    case 'phrases': return b.rows.map(function(r){return phraseRow(r[0],r[1],r[2]);}).join('');
    case 'vocab': return '<div class="vgrid">'+b.rows.map(function(r){ var m=/^([A-Z]) – /.exec(r[0]); var s=m?(m[1]+', as in '+r[1]):r[0].replace(/\s*\([^)]*\)/g,'');
        return '<button class="v" data-say="'+esc(s)+'"><b lang="en">'+r[0]+'</b><span>'+r[1]+'</span></button>'; }).join('')+'</div>';
    case 'table': return '<div class="tscroll"><table class="t"><tr>'+b.head.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr>'+b.rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';}).join('')+'</table></div>';
    case 'dialog': return '<div class="dlg"><h4><span>Diálogo: '+b.title+'</span><span class="row"><button class="btn small" data-dlg="all">Escuchar todo</button><button class="btn small" data-dlg="es">Ocultar español</button></span></h4>'+
        b.lines.map(function(l){return '<div class="ln"><button class="play" data-say="'+esc(l[1])+'" aria-label="Escuchar">'+PLAY+'</button><div><div class="whoL">'+l[0]+'</div><div lang="en"><b>'+l[1]+'</b></div><div class="es">'+l[2]+'</div></div></div>';}).join('')+'</div>';
    default: return '';
  } }
function secs(t){ return [].concat(t.s).map(function(i,n){ return (n?'<h2 class="part">'+SECS[i].title+'</h2>'+(SECS[i].sub?'<p class="note">'+SECS[i].sub+'</p>':''):'')+section(i); }).join(''); }
function counts(){ var k=me().known, n=0; ALLPH.forEach(function(p){ if(k[p.en]) n++; }); var w=0; for(var i in me().weeks) if(me().weeks[i]) w++;
  var s=me().srs, t=today(), due=0; for(var e in s) if(s[e].d<=t) due++; return {k:n,t:ALLPH.length,w:w,due:due}; }

var RETOS=['Hagan la lista del supermercado en inglés.','Saluden a un vecino o compañero en inglés y pregunten «How are you?».','Pidan algo en una tienda o restaurante solo en inglés.','Pongan el teléfono en inglés durante todo el día.','Cuenten en la cena tres cosas que hicieron hoy, en pasado.','Vean diez minutos de una serie con subtítulos en inglés y anoten dos frases.','Deletreen su nombre y su correo en voz alta sin leer.','Aprendan una frase nueva de un compañero de trabajo y anótenla en «Mi cuaderno».','Narren en voz alta lo que hacen durante cinco minutos: «I\'m making coffee…».','Pregunten un precio y digan el total en inglés.','Digan su dirección y su teléfono en inglés, de memoria.','Escriban un mensaje corto de WhatsApp en inglés a su pareja.','Hagan un role-play de esta guía sin mirar las frases.','Hagan la «hora en inglés» durante la cena.'];

function vInicio(){ var p=dayPhrase(), c=counts(), who=NAME[mem.who], s=sess(), sk=streak();
  function step(k,label,sub,start){ var d=s[k]; return '<div class="step'+(d?' done':'')+'"><span class="tick" aria-hidden="true">'+(d?'✓':'')+'</span><span><b>'+label+'</b><small>'+sub+'</small></span>'+(start?'<button class="btn small'+(d?'':' fill')+'" data-start="'+start+'" data-deck="all">'+(d?'Repetir':'Empezar')+'</button>':'<input type="checkbox" id="retoChk" aria-label="Reto cumplido"'+(d?' checked':'')+'>')+'</div>'; }
  var nd=[s.shadow,s.cards,s.quiz,s.reto].filter(Boolean).length, mood=dogMood(nd,sk);
  var moodTxt={happy:'Sesión completa. Turrón está feliz; nos vemos mañana.',sleep:'¡Qué bueno verlos! Turrón tomaba una siesta. Con un paso se despierta.',idle:nd?'Van bien: '+(4-nd===1?'falta un paso.':'faltan '+(4-nd)+' pasos.'):'Unos diez minutos, cuatro pasos.'}[mood];
  return '<section class="hero"><div class="wrap"><p class="kicker">La frase de hoy. Díganla en voz alta tres veces.</p>'+
   '<div class="bubble"><p class="daily" lang="en">'+esc(p.en)+'</p><p class="daily-es">'+esc(p.es)+'</p><p class="daily-pr">'+esc(p.pr)+'</p></div>'+
   '<div class="hrow">'+pdog(mood==='happy'?['happy']:mood==='sleep'?['sleep']:[],'hdog',mood)+'<div class="row"><button class="bigplay" data-say="'+esc(p.en)+'">'+PLAY.replace('<svg','<svg width="18" height="18" fill="currentColor"')+' Escuchar</button><button class="bigplay ghost" data-say="'+esc(p.en)+'" data-slow="1">Más lento</button></div></div></div></section>'+
   '<div class="wrap"><div class="today"><div><h2>Hoy, '+who+'</h2><p class="note">'+moodTxt+'</p></div><div class="paws" role="img" aria-label="'+nd+' de 4 pasos hechos">'+[0,1,2,3].map(function(i){ return '<span class="paw'+(i<nd?' on':'')+'">'+PAW+'</span>'; }).join('')+'</div></div>'+
   '<div class="steps">'+step('shadow','Escuchar y repetir','Cinco frases, en voz alta','shadow')+step('cards','Repasar tarjetas',c.due?c.due+' pendientes de repaso hoy':'Frases nuevas y repaso','cards')+step('quiz','Quiz rápido','Diez preguntas','quiz')+step('reto','Reto en la vida real',RETOS[today()%RETOS.length],null)+'</div>'+
   '<div class="stats"><div class="stat streak">'+pdog(sk?['happy']:mood==='sleep'?['sleep']:[],'sdog',sk?'happy':mood==='sleep'?'sleep':'idle',true)+'<div><b>'+sk+(sk===1?' día':' días')+'</b><span>seguidos practicando</span></div></div>'+
   '<div class="stat"><b>'+c.k+' de '+c.t+'</b><span>frases que ya sabe</span><div class="meter"><i style="width:'+(100*c.k/c.t)+'%"></i></div></div>'+
   '<div class="stat"><b>'+c.w+' de 12</b><span>semanas del plan</span><div class="meter"><i style="width:'+(100*c.w/12)+'%"></i></div></div></div>'+
   '<p class="note">Cada uno tiene su propio progreso. Cambien de persona arriba, en «Eduardo / Mariana».</p>'+
   '<h2>Ir a</h2><div class="modes">'+
   '<button class="mode" data-go="frases"><b>Frases por situación</b><span>13 temas con audio y un buscador.</span></button>'+
   '<button class="mode" data-go="trabajo"><b>Inglés para el trabajo</b><span>Técnico de telecomunicaciones y agente de reservaciones.</span></button>'+
   '<button class="mode" data-go="tutor"><b>Hablar con Turrón</b><span>El tutor con IA: conversa y te corrige por voz.</span></button>'+
   '<button class="mode" data-go="practicar"><b>Todos los juegos</b><span>Números al oído, sonidos difíciles, tarjetas y más.</span></button>'+
   '<button class="mode" data-go="plan"><b>Plan y nivel</b><span>12 semanas, «Ya puedo…» y el método.</span></button></div>'+
   '<div class="sos"><b>Emergencias en Aruba</b><p>Ambulancia y bomberos: <b>911</b><br>Policía: <b>100</b></p><p>Practiquen decir su dirección: <span lang="en">«My address is…»</span>. Las frases están en Frases, en «Médico y emergencias».</p></div>'+
   '<details><summary>Cómo usar esta guía</summary>'+section(0)+'</details>'+
   '<p class="note">Toquen cualquier botón de escuchar para oír la frase en inglés. El progreso se guarda en este navegador; en otro teléfono empieza de cero.</p></div>'; }

function fold(s){ return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
function searchHTML(q){ q=fold(q.trim()); if(q.length<2) return ''; var r=pool('all').filter(function(x){ return fold(x.en).indexOf(q)>=0||fold(x.es).indexOf(q)>=0; }).slice(0,30);
  return r.length? '<p class="note">'+r.length+(r.length===30?' o más':'')+' resultados</p>'+r.map(function(x){ return phraseRow(esc(x.en),x.pr,esc(x.es)); }).join('') : '<p>No hay frases con esa palabra. Pueden agregarla en «Mi cuaderno».</p>'; }
function mineView(){ var m=me().mine;
  return '<p>Anoten aquí las frases que escuchan en el trabajo o en la calle. Entran en las tarjetas y en los quizzes.</p>'+
   '<div class="ex"><p><label>En inglés<br><input class="inp w100" id="mEn" lang="en" autocomplete="off" autocapitalize="off"></label></p><p><label>En español<br><input class="inp w100" id="mEs" autocomplete="off"></label></p><div class="bar"><button class="btn fill" id="mAdd">Guardar frase</button><span class="fb" id="mFb" style="margin:0"></span></div></div>'+
   (m.length? m.map(function(x,i){ return phraseRow(esc(x.en),'',esc(x.es))+'<p style="margin:0 0 10px;text-align:right"><button class="slow" data-mdel="'+i+'">Borrar esta frase</button></p>'; }).join('') : '<div class="empty">'+pdog([],'edog','idle')+'<p>Todavía no hay frases en el cuaderno de '+NAME[mem.who]+'. Turrón espera la primera.</p></div>'); }
function vFrases(){ var list=TOPICS.filter(function(t){return !t.work;}), all=list.concat([{k:'mio',n:'Mi cuaderno'}]);
  var t=all.filter(function(x){return x.k===st.topic;})[0]||all[0], title, body;
  if(t.k==='mio'){ title='Mi cuaderno'; body=mineView(); }
  else { title=SECS[t.s[0]].title.replace(/^Parte \d+ · /,''); body=(SECS[t.s[0]].sub?'<p class="note">'+SECS[t.s[0]].sub+'</p>':'')+(t.k==='pron'?pronTable():'')+secs(t); }
  return '<div class="wrap"><p style="margin:18px 0 0"><input class="inp w100" id="q" type="search" enterkeyhint="search" placeholder="Buscar una frase en español o inglés" aria-label="Buscar una frase" autocomplete="off"></p><div id="sres"></div>'+
   '<div id="tbody">'+chips(all,t.k,'data-topic')+'<h1>'+title+'</h1><p class="note">Toquen el botón redondo para escuchar. Marquen ✓ cuando ya la digan sin leer.</p>'+body+'</div></div>'; }
function vTrabajo(){ var k= st.work || (mem.who==='el'?'tec':'res'); var t=TOPICS.filter(function(x){return x.k===k;})[0];
  return '<div class="wrap"><div class="jobhead">'+pdog(k==='tec'?['helmet']:['headset'],'jdog','idle')+'<h1>'+(k==='tec'?'Técnico de telecomunicaciones':'Agente de reservaciones')+'</h1></div>'+
   chips(TOPICS.filter(function(x){return x.work;}),k,'data-work')+
   '<div class="row" style="margin:6px 0 4px"><button class="btn pink small" data-go="tutor">Practicar con Turrón</button><button class="btn small" data-start="quiz" data-deck="'+k+'">Quiz</button><button class="btn small" data-start="cards" data-deck="'+k+'">Tarjetas</button></div>'+secs(t)+'</div>'; }

/* ---------- practicar ---------- */
var ICONS={shadow:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
 cards:'<rect x="7" y="4" width="13" height="13" rx="2"/><path d="M4 8v10a2 2 0 0 0 2 2h10"/>',
 tutor:'<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01"/>',
 quiz:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
 nums:'<text x="12" y="16" text-anchor="middle">123</text>',
 pairs:'<path d="M3 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/>',
 order:'<path d="M4 7h10M4 12h16M4 17h7"/><path d="M17 15l3 2.5-3 2.5"/>',
 dict:'<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/>',
 spell:'<text x="12" y="16" text-anchor="middle">Aa</text>',
 guide:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/>',
 role:'<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M14 20a4.2 4.2 0 0 1 7.5-2.5"/>'};
MODES=[['shadow','Escuchar y repetir','Imiten la frase en voz alta. Tiene modo manos libres para el carro.','--sun'],
 ['cards','Tarjetas con repaso','Vuelven justo cuando están por olvidarse: al día, a los 2, 4, 8 y 16 días.','--sun-t'],
 ['tutor','Turrón, el tutor con IA','Conversen por voz o por escrito y reciban correcciones.','--flamingo-t'],
 ['quiz','Quiz de 10 preguntas','Elijan la respuesta correcta. Incluye preguntas de escuchar.','--flamingo-t'],
 ['nums','Números al oído','Precios, horas, fechas, teléfonos y el 13 contra el 30.','--lagoon-t'],
 ['pairs','Sonidos difíciles','¿Dijo ship o sheep? Entrenen el oído con pares de palabras.','--aloe-t'],
 ['order','Ordenar la frase','Toquen las palabras en el orden correcto.','--lagoon-t'],
 ['dict','Dictado','Escuchen y escriban lo que oyen.','--aloe-t'],
 ['spell','Deletrear','Letras, códigos de confirmación y el alfabeto fonético.','--sun-t'],
 ['guide','Ejercicios escritos','Seis ejercicios de gramática y traducción, con corrección.','--flamingo-t'],
 ['role','Role-plays y juegos','Escenarios para practicar los dos juntos.','--lagoon-t']];
function deckSel(){ var opts=TOPICS.filter(function(t){return !t.nopool;}).map(function(t){return [t.k,t.n];}); if(me().mine.length) opts.push(['mio','Mi cuaderno']);
  return '<label>Tema: <select class="inp" id="deck"><option value="all">Todos</option>'+opts.map(function(o){return '<option value="'+o[0]+'"'+(st.deck===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></label>'; }
function vPracticar(){
  if(!st.mode) return '<div class="wrap"><h1 style="margin-top:22px">Practicar</h1><p>Diez minutos al día valen más que dos horas el domingo. Si no saben por dónde empezar, hagan la sesión de hoy en Inicio.</p><div class="modes">'+
    MODES.map(function(m,i){return '<button class="mode" data-start="'+m[0]+'"><i style="background:var('+m[3]+')" aria-hidden="true"><svg viewBox="0 0 24 24">'+ICONS[m[0]]+'</svg></i><b>'+m[1]+'</b><span>'+m[2]+'</span></button>';}).join('')+'</div></div>';
  var m=MODES.filter(function(x){return x[0]===st.mode;})[0];
  return '<div class="wrap"><div class="bar" style="margin-top:18px"><button class="btn small" data-start="">Volver a los juegos</button>'+(/^(cards|quiz|order|dict|shadow)$/.test(st.mode)?deckSel():'')+'</div><h1>'+m[1]+'</h1><div id="game"></div></div>'; }
function startGame(){ var g=$('#game'); if(!g) return; stopMic(); var P=pool(st.deck);
  if(st.deck!=='all'&&!P.length){ st.deck='all'; P=pool('all'); }
  switch(st.mode){
    case 'cards': cardsStart(P); break;
    case 'quiz': G={qs:shuffle(P).slice(0,10),i:0,ok:0,P:P,done:false}; quiz(); break;
    case 'order': G={list:shuffle(P.filter(function(x){var n=x.en.split(' ').length;return simple(x)&&n>=3&&n<=9;})),i:0}; order(); break;
    case 'dict': G={list:shuffle(P.filter(function(x){return simple(x)&&x.en.split(' ').length<=9;})),i:0}; dict(); break;
    case 'spell': spell(); break;
    case 'guide': guide(); break;
    case 'shadow': shadowStart(P); break;
    case 'nums': G={i:0,ok:0}; nums(); break;
    case 'pairs': G={list:shuffle(PAIRS).slice(0,10),i:0,ok:0}; pairs(); break;
    case 'tutor': tutor(); break;
    case 'role': G={}; g.innerHTML='<div class="stage"><p class="sub">Escenario al azar</p><p class="q" id="rpT">Toquen el botón</p><p id="rpD"></p><button class="btn pink" id="rpB">Elegir un escenario</button></div><h2>Todos los escenarios</h2><table class="t">'+D.rp.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>';}).join('')+'</table>'+section(12).replace(/<h2>Role-plays[^<]*<\/h2>/,''); break;
  } }
var BIGP=PLAY.replace('<svg','<svg width="18" height="18" fill="#fff"');
function quiz(){ var g=$('#game'); if(G.i>=G.qs.length){ stepDone('quiz'); var msg=G.ok>=9?'Excelente.':G.ok>=6?'Van muy bien. Repasen las que fallaron.':'Repasen el tema con las tarjetas y vuelvan a intentarlo.';
    g.innerHTML='<div class="stage"><p class="sub">Resultado</p><p class="q">'+G.ok+' de '+G.qs.length+'</p><p>'+msg+'</p><div class="row" style="justify-content:center"><button class="btn pink" data-again>Otro quiz</button><button class="btn" data-go="inicio">Volver al inicio</button></div></div>'; return; }
  var q=G.qs[G.i], type=['en2es','es2en','listen'][Math.floor(Math.random()*3)]; if(!canSpeak() && type==='listen') type='en2es';
  var wrong=shuffle(G.P.filter(function(x){return x.en!==q.en && x.es!==q.es;})).slice(0,3), opts=shuffle([q].concat(wrong)); G.cur={q:q,type:type,ans:false};
  var show= type==='es2en'?function(x){return x.en;}:function(x){return x.es;};
  g.innerHTML='<div class="stage"><p class="sub">Pregunta '+(G.i+1)+' de '+G.qs.length+'</p>'+
    (type==='listen'?'<p class="sub">Escuchen y elijan qué significa</p><button class="bigplay" data-say="'+esc(q.en)+'">'+BIGP+' Escuchar</button>'
      :'<p class="sub">'+(type==='en2es'?'¿Qué significa?':'¿Cómo se dice en inglés?')+'</p><p class="q">'+esc(type==='en2es'?q.en:q.es)+'</p>')+
    '<div class="opts">'+opts.map(function(o){return '<button class="opt" data-ok="'+(o===q?1:0)+'">'+esc(show(o))+'</button>';}).join('')+'</div><p class="fb" id="fb"></p><button class="btn fill" id="next" disabled>Siguiente</button></div>'; }

/* tarjetas con repetición espaciada (cajas de Leitner) */
var IV=[0,1,2,4,8,16];
function cardsStart(P){ var s=me().srs, t=today();
  var due=shuffle(P.filter(function(p){return s[p.en]&&s[p.en].d<=t;})).slice(0,20);
  var fresh=shuffle(P.filter(function(p){return !s[p.en];})); fresh=fresh.filter(function(p){return p.ph;}).concat(fresh.filter(function(p){return !p.ph;})).slice(0,due.length>=12?4:8);
  G={list:due.concat(fresh),i:0,flip:false,nDue:due.length,nNew:fresh.length,total:P.length}; cards(); }
function cards(){ var g=$('#game'), c=G.list[G.i];
  if(!c){ if(!G.list.length){ g.innerHTML='<div class="stage"><p class="q">Hoy no hay tarjetas pendientes en este tema</p><p>Ya vieron todas y ninguna toca repaso hoy. Vuelvan mañana o elijan otro tema.</p><button class="btn" data-start="">Otros juegos</button></div>'; return; }
    stepDone('cards'); g.innerHTML='<div class="stage"><p class="sub">Repaso terminado</p><p class="q">'+G.nDue+' repasadas y '+G.nNew+' nuevas</p><p>Las que sabían volverán en unos días; las que no, mañana.</p><div class="row" style="justify-content:center"><button class="btn pink" data-again>Más tarjetas</button><button class="btn" data-go="inicio">Volver al inicio</button></div></div>'; return; }
  var e=me().srs[c.en], lvl=e?e.b:0;
  g.innerHTML='<p class="note">Tarjeta '+(G.i+1)+' de '+G.list.length+(lvl?'. Nivel '+lvl+' de 5':'. Nueva')+'</p><div class="card'+(G.flip?' flip':'')+'"><button id="flip">'+
   (G.flip?'<span style="display:block;font-family:var(--display);font-size:1.6rem;font-weight:700" lang="en">'+esc(c.en)+'</span><i style="color:var(--soft)">'+esc(c.pr)+'</i><br><span>'+esc(c.es)+'</span>'
          :'<span style="color:var(--soft)">Díganlo en inglés en voz alta</span><br><span style="font-family:var(--display);font-size:1.6rem;font-weight:700">'+esc(c.es)+'</span><br><span class="note">Luego toquen para comprobar</span>')+'</button></div>'+
   '<div class="row" style="justify-content:center">'+(G.flip?'<button class="btn" data-say="'+esc(c.en)+'">Escuchar</button><button class="btn" id="srsNo">No la sabía</button><button class="btn pink" id="srsYes">La sabía</button>':'')+'</div>'; }

/* escuchar y repetir (shadowing) */
function shadowStart(P){ var k=me().known, L=P.filter(function(x){return x.ph&&simple(x);}); if(!L.length) L=P;
  G={list:shuffle(L.filter(function(x){return !k[x.en];})).concat(shuffle(L.filter(function(x){return k[x.en];}))).slice(0,5),i:0,auto:false}; shadow(); }
function shadow(){ var g=$('#game'), c=G.list[G.i]; if(!g) return;
  if(!c){ G.auto=false; stepDone('shadow'); g.innerHTML='<div class="stage"><p class="sub">Listo</p><p class="q">Cinco frases repetidas en voz alta</p><div class="row" style="justify-content:center"><button class="btn pink" data-again>Cinco más</button><button class="btn" data-go="inicio">Volver al inicio</button></div></div>'; return; }
  g.innerHTML='<div class="stage"><p class="sub">Frase '+(G.i+1)+' de '+G.list.length+'. Escuchen, imiten el ritmo y repitan tres veces.</p><p class="q" lang="en">'+esc(c.en)+'</p><p class="sub"><i>'+esc(c.pr)+'</i><br>'+esc(c.es)+'</p>'+
   '<div class="row" style="justify-content:center"><button class="bigplay" data-say="'+esc(c.en)+'">'+BIGP+' Escuchar</button><button class="btn" data-say="'+esc(c.en)+'" data-slow="1">Más lento</button></div>'+
   (caps.dictation?'<div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="micBtn" data-target="'+esc(c.en)+'">Decirla al micrófono</button></div><p class="fb" id="micFb"></p>':'')+
   '<div class="row" style="justify-content:center;margin-top:14px"><button class="btn" id="shAuto" aria-pressed="'+(G.auto?'true':'false')+'">'+(G.auto?'Detener manos libres':'Modo manos libres')+'</button><button class="btn fill" id="shNext">Ya la repetí, siguiente</button></div>'+
   '<p class="note">En manos libres cada frase suena lento y luego normal, con una pausa para que la repitan.</p></div>'; }
function autoRun(){ var g0=G, c=G.list[G.i]; function alive(){ return G===g0&&g0.auto&&st.mode==='shadow'; }
  if(!alive()) return; if(!c){ shadow(); return; } var gap=1600+c.en.length*85;
  say(c.en,true,null,function(ok){ if(!ok||!alive()){ g0.auto=false; if(G===g0) shadow(); return; }
    setTimeout(function(){ if(!alive()) return; say(c.en,false,null,function(ok2){ if(!ok2||!alive()){ g0.auto=false; if(G===g0) shadow(); return; }
      setTimeout(function(){ if(!alive()) return; g0.i++; shadow(); autoRun(); },gap); }); },gap); }); }

/* micrófono */
var mic={on:false,text:'',target:'',heardAt:0};
function wireMic(){ var d=caps.dictation; if(!d||mic.wired) return; mic.wired=true;
  try{ d.onPartial(function(x){ var f=$('#micFb'); if(f&&mic.on){ f.className='fb'; f.textContent=(x&&x.text)||''; } });
    d.onFinal(function(x){ mic.text+=' '+((x&&x.text)||''); if(mic.on){ try{ d.stop(); }catch(e){} } });
    d.onState(function(x){ if(x&&x.state==='listening'){ mic.on=true; micBtn(); } else if(x&&x.state==='idle'){ var was=mic.on; mic.on=false; micBtn(); if(was) micScore(); } }); }catch(e){} }
function micBtn(){ var b=$('#micBtn'); if(b) b.textContent=mic.on?'Escuchando… toquen para terminar':'Decirla al micrófono'; }
function stopMic(){ if(mic.on&&caps.dictation){ try{ caps.dictation.stop(); }catch(e){} } mic.on=false; }
function micScore(){ var f=$('#micFb'); if(!f) return; var heard=norm(mic.text).split(' ').filter(Boolean), want=norm(mic.target).split(' ').filter(Boolean);
  if(!heard.length){ f.className='fb bad'; f.textContent='No se escuchó nada. Acérquense al micrófono y prueben otra vez.'; return; }
  var hit=0, left=heard.slice(); want.forEach(function(w){ var i=left.indexOf(w); if(i>=0){ hit++; left.splice(i,1); } }); var pct=Math.round(100*hit/want.length);
  f.className='fb '+(pct>=80?'ok':'bad'); f.textContent='Se entendió: «'+mic.text.trim()+'». Coincide '+pct+'%.'+(pct>=80?' Muy bien.':' Escuchen la frase lenta y prueben otra vez.'); touch(); }

/* números al oído */
var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function ord(n){ var s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function rnd(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
function numQ(){ var k=['num','teen','price','time','phone','date','room'][rnd(0,6)], n,m;
  if(k==='num'){ n=rnd(11,99); return {l:'Un número',say:String(n),a:String(n),hint:'Ej: 47'}; }
  if(k==='teen'){ n=[13,30,14,40,15,50,16,60,17,70,18,80,19,90][rnd(0,13)]; return {l:'¿Terminó en -teen o en -ty?',say:String(n),a:String(n),hint:'Ej: 13 o 30'}; }
  if(k==='price'){ n=rnd(2,199); m=[0,25,50,75,99][rnd(0,4)]; return {l:'Un precio en dólares',say:n+' dollars'+(m?' and '+m+' cents':''),a:n+'.'+(m<10?'0'+m:m),hint:'Ej: 45.50'}; }
  if(k==='time'){ n=rnd(1,12); m=[0,15,30,45,5,10,20,40,50][rnd(0,8)]; var ap=rnd(0,1)?'a.m.':'p.m.'; return {l:'Una hora',say:n+(m===0?" o'clock ":(m<10?' oh '+m+' ':' '+m+' '))+ap,a:n+':'+(m<10?'0'+m:m),hint:'Ej: 3:45'}; }
  if(k==='phone'){ var d=''; for(var i=0;i<7;i++) d+=rnd(0,9); return {l:'Un teléfono de 7 dígitos',say:d.split('').join(', ').replace(/0/g,'zero'),a:d,slow:1,hint:'Ej: 5601234'}; }
  if(k==='date'){ n=rnd(1,28); m=rnd(0,11); return {l:'Una fecha',say:MONTHS[m]+' '+ord(n),a:n+'/'+(m+1),hint:'Día/mes. Ej: 15/3'}; }
  n=rnd(101,699); return {l:'Un número de habitación',say:'Room '+n,a:String(n),hint:'Ej: 215'}; }
function nums(){ var g=$('#game'); if(!canSpeak()){ g.innerHTML='<p>Este juego necesita audio, y aquí no está disponible. Abran la guía en Chrome o Safari.</p>'; return; }
  G.cur=numQ(); G.i++;
  g.innerHTML='<div class="stage"><p class="sub">Aciertos: '+G.ok+' de '+(G.i-1)+'</p><p class="q">'+G.cur.l+'</p><div class="row" style="justify-content:center"><button class="bigplay" id="nSay">'+BIGP+' Escuchar</button><button class="btn" id="nSlow">Más lento</button></div>'+
   '<p><input class="inp" id="nIn" style="text-align:center;margin-top:16px;font-size:1.3rem;width:11em" inputmode="text" autocomplete="off" placeholder="'+G.cur.hint+'" aria-label="Escriban lo que oyen"></p><p class="fb" id="fb"></p>'+
   '<div class="row" style="justify-content:center"><button class="btn" id="nCheck">Comprobar</button><button class="btn fill" id="nNext">Siguiente</button></div></div>'; }

/* sonidos difíciles */
var PAIRS=[['ship','sheep','barco / oveja'],['live','leave','vivir / salir'],['full','fool','lleno / tonto'],['it','eat','eso / comer'],['bed','bad','cama / malo'],['cut','cat','cortar / gato'],
 ['vest','best','chaleco / mejor'],['very','berry','muy / baya'],['three','tree','tres / árbol'],['think','sink','pensar / fregadero'],['chair','share','silla / compartir'],['watch','wash','mirar / lavar'],
 ['yes','Jess','sí / Jess'],['price','prize','precio / premio'],['walk','work','caminar / trabajar'],['can','can\'t','puedo / no puedo'],['thirteen','thirty','13 / 30'],['fifteen','fifty','15 / 50'],['fill','feel','llenar / sentir'],['hat','hot','sombrero / caliente']];
function pairs(){ var g=$('#game'); if(!canSpeak()){ g.innerHTML='<p>Este juego necesita audio, y aquí no está disponible. Abran la guía en Chrome o Safari.</p>'; return; }
  var p=G.list[G.i]; if(!p){ g.innerHTML='<div class="stage"><p class="sub">Resultado</p><p class="q">'+G.ok+' de '+G.list.length+'</p><p>Si fallaron varios, es normal: estos sonidos no existen en español. El oído se entrena con repetición.</p><button class="btn pink" data-again>Otra ronda</button></div>'; return; }
  G.cur={t:rnd(0,1),ans:false};
  g.innerHTML='<div class="stage"><p class="sub">Par '+(G.i+1)+' de '+G.list.length+'. ¿Cuál de las dos palabras suena?</p><div class="row" style="justify-content:center"><button class="bigplay" id="ppSay">'+BIGP+' Escuchar</button><button class="btn" id="ppSlow">Más lento</button></div>'+
   '<div class="opts" style="grid-template-columns:1fr 1fr">'+[0,1].map(function(i){return '<button class="opt2" data-pp="'+i+'" lang="en" style="text-align:center;font-weight:700;font-size:1.2rem">'+esc(p[i])+'</button>';}).join('')+'</div><p class="note">'+p[2]+'</p><p class="fb" id="fb"></p>'+
   '<div class="row" style="justify-content:center"><button class="btn" id="ppBoth">Escuchar las dos</button><button class="btn fill" id="ppNext" disabled>Siguiente</button></div></div>'; }

/* tutor con IA */
var SCEN=[
 ['Cliente sin internet (técnico)','You are a customer in Aruba whose home internet stopped working yesterday. The learner is the telecom technician who has just arrived at your door.'],
 ['Instalación nueva (técnico)','You are a customer getting a new fiber internet installation at home. The learner is the technician. Ask where the modem should go and how long it will take.'],
 ['Reportar al supervisor (técnico)','You are the field supervisor of a telecom company calling the learner, a technician, to ask for a status update on today\'s jobs.'],
 ['Llamada para reservar (reservaciones)','You are a tourist calling to book a hotel room in Aruba for 3 nights for 2 adults. The learner is the reservations agent.'],
 ['Cambiar una reserva (reservaciones)','You are a guest calling to change the dates of an existing reservation. The learner is the reservations agent.'],
 ['Cliente molesto (reservaciones)','You are an upset but reasonable guest calling because the room is not what you booked. The learner is the reservations agent. Calm down if they apologize and offer a solution.'],
 ['En el supermercado','You are a cashier at a supermarket in Aruba. The learner is a customer paying for groceries and asking where to find a product.'],
 ['Vecino nuevo','You are a friendly neighbor in Aruba meeting the learner, who just moved in next door. Make small talk.'],
 ['En el médico','You are a doctor at a clinic. The learner is a patient describing how they feel.'],
 ['En el banco','You are a bank employee. The learner wants to open a bank account.'],
 ['Llamar al 911','You are a 911 emergency operator. The learner is calling to report that a family member fell and is hurt. Ask what happened and for the address.']];
function tutorPrompt(sc){ return 'You are an English conversation partner for a Spanish-speaking adult beginner (CEFR A1-A2) who just moved to Aruba. Role-play this situation: '+sc+'\n\nRules:\n- Stay in character. Use short, simple, natural English: one or two sentences, common words.\n- Always end your turn with something the learner can answer.\n- After each learner message, check their English.\n- Reply in EXACTLY this format, three lines, nothing else:\nEN: <your line in the role-play, in English>\nES: <Spanish translation of your line>\nTIP: <in Spanish: if the learner\'s last message had a mistake, show the corrected sentence in English and explain it in one short sentence; if it was fine, say "Muy bien." and optionally a more natural way to say it; on your first turn write "Empiecen cuando quieran.">\n\nStart now with your first line.'; }
function parseTutor(t){ function pick(k){ var m=new RegExp('(?:^|\\n)\\s*'+k+':\\s*([\\s\\S]*?)(?=\\n\\s*(?:EN|ES|TIP):|$)').exec(t); return m?m[1].trim():''; } var en=pick('EN'); return {en:en||t.trim(),es:pick('ES'),tip:pick('TIP')}; }
function tutor(){ var g=$('#game'); G={};
  if(caps.sample===undefined){ g.innerHTML='<p>Comprobando si el tutor está disponible…</p>'; return; }
  if(!caps.sample){ g.innerHTML='<aside class="box warn"><strong class="t">El tutor no está disponible en esta vista</strong><p>Funciona al abrir la guía desde claude.ai con sesión iniciada. Mientras tanto, practiquen las mismas situaciones entre ustedes en «Role-plays y juegos».</p></aside><button class="btn" data-start="role">Ir a los role-plays</button>'; return; }
  var def= mem.who==='el'?0:3;
  g.innerHTML='<p>Elijan una situación. El tutor hace el otro papel, escribe en inglés sencillo y corrige cada mensaje. Escriban como puedan: equivocarse aquí no cuesta nada.</p>'+
   '<div class="bar"><label>Situación: <select class="inp" id="scSel">'+SCEN.map(function(s,i){return '<option value="'+i+'"'+(i===def?' selected':'')+'>'+s[0]+'</option>';}).join('')+'</select></label><button class="btn pink" id="tStart">Empezar</button></div><div id="chat" class="chat" aria-live="polite"></div><div id="tForm"></div>'+
   '<p class="note">La primera vez pedirá permiso para usar Claude. El tutor es una IA y puede equivocarse.</p>'; }
function chatDraw(pending){ var c=$('#chat'); if(!c||!G.chat) return;
  c.innerHTML=G.chat.map(function(m){ if(m.role==='user') return '<div class="msg me" lang="en">'+esc(m.text)+'</div>'; var p=m.p;
    return (p.tip&&!/^Empiecen/.test(p.tip)?'<div class="msg tipm"><b>Corrección:</b> '+esc(p.tip)+'</div>':'')+'<div class="msg bot"><button class="play" data-say="'+esc(p.en)+'" aria-label="Escuchar">'+PLAY+'</button><div><div lang="en"><b>'+esc(p.en)+'</b></div>'+(p.es?'<div class="es">'+esc(p.es)+'</div>':'')+'</div></div>'; }).join('')+(pending?'<div class="msg bot"><i>'+esc(pending)+'</i></div>':'');
  var f=$('#tForm'); if(f){ var n=G.chat.filter(function(m){return m.role==='user';}).length;
    if(G.over||n>=12){ f.innerHTML='<p><b>Buena práctica.</b> Lean otra vez las correcciones y anoten una frase en «Mi cuaderno».</p><button class="btn pink" data-again>Otra situación</button>'; }
    else if(!f.querySelector('#tIn')){ f.innerHTML='<div class="bar"><input class="inp" id="tIn" enterkeyhint="send" style="flex:1;min-width:0" lang="en" autocomplete="off" autocapitalize="sentences" placeholder="Escriban su respuesta en inglés" aria-label="Su respuesta en inglés"><button class="btn fill" id="tSend">Enviar</button></div>'; } }
  c.scrollTop=c.scrollHeight; }
function tutorTurn(){ var g0=G; if(g0.busy) return; g0.busy=true; chatDraw('Escribiendo…');
  var msgs=[{role:'user',content:tutorPrompt(g0.sc)}]; g0.chat.forEach(function(m){ msgs.push({role:m.role,content:m.role==='user'?m.text:m.raw}); });
  var pr; try{ pr=caps.sample(msgs,{modelTier:'quick',cache:false}); }catch(e){ pr=Promise.reject(e); }
  Promise.resolve(pr).then(function(r){ if(G!==g0) return; g0.busy=false; var raw=(r&&r.text)||''; if(!raw){ throw {code:'empty'}; } var p=parseTutor(raw); g0.chat.push({role:'assistant',raw:raw,p:p}); chatDraw(); touch(); say(p.en); var i=$('#tIn'); if(i) i.focus(); })
   .catch(function(err){ if(G!==g0) return; g0.busy=false; var c=err&&err.code; if(g0.chat.length&&g0.chat[g0.chat.length-1].role==='user'){ var last=g0.chat.pop(); var i=$('#tIn'); if(i) i.value=last.text; }
     if(c==='not_granted'){ caps.sample=null; tutor(); return; }
     chatDraw(); if(!g0.chat.length){ var sb=$('#tStart'), ss=$('#scSel'); if(sb) sb.disabled=false; if(ss) ss.disabled=false; var tf=$('#tForm'); if(tf) tf.innerHTML=''; } toast(c==='rate_limited'?'Demasiados mensajes seguidos. Esperen un momento y envíen otra vez.':'El tutor no respondió. Prueben enviar otra vez.'); }); }

/* ---------- plan y nivel ---------- */
var CANDO=[['A1: primeros pasos',['Puedo saludar, presentarme y decir de dónde soy.','Puedo deletrear mi nombre y mi correo.','Puedo decir y entender números, precios y horas.','Puedo pedir que repitan o hablen más despacio.','Puedo comprar en el supermercado y pagar.','Puedo decir mi dirección y mi teléfono.','Puedo entender instrucciones cortas si me hablan despacio.','Puedo llenar un formulario con mis datos.']],
 ['A2: independencia básica',['Puedo contar qué hice ayer con frases en pasado.','Puedo hacer una cita por teléfono.','Puedo describir un problema en casa o de salud.','Puedo conversar unos minutos con un vecino o compañero.','Puedo pedir y entender direcciones.','Puedo escribir un mensaje o correo corto.','Puedo explicar mis planes para la semana.','Puedo manejar un cambio o una queja sencilla en una tienda.']],
 ['En mi trabajo',['Puedo presentarme a un cliente y explicar a qué vengo o en qué ayudo.','Puedo hacer las preguntas de rutina de mi trabajo sin leerlas.','Puedo entender lo que pide el cliente la mayoría de las veces.','Puedo explicar un problema y su solución con palabras simples.','Puedo atender una llamada completa en inglés.','Puedo manejar a un cliente molesto con calma.']]];
var METODO=[['Recordar en vez de releer','Cada tarjeta les pide decir la frase antes de verla. Ese esfuerzo de recordar es lo que fija la memoria; releer una lista da sensación de saber, pero se olvida rápido.'],
 ['Repaso espaciado','Una frase que acertaron vuelve al día siguiente, luego a los 2, 4, 8 y 16 días. Si fallan, vuelve a empezar. Así repasan solo lo que están por olvidar.'],
 ['Escuchar e imitar (shadowing)','Repetir en voz alta imitando ritmo y entonación mejora la fluidez y la pronunciación, y baja el miedo a hablar. Por eso la sesión diaria empieza ahí.'],
 ['Frases completas','Las frases hechas («Could you repeat that, please?») se usan desde el primer día y traen la gramática incluida.'],
 ['Su vida real primero','El vocabulario del trabajo y de sus trámites se repite todos los días, así que se aprende más rápido que el de un libro general.'],
 ['Poco y diario','Diez o quince minutos todos los días rinden más que una sesión larga a la semana. La racha de días en Inicio es para cuidar ese hábito.'],
 ['Hablar aunque sea mal','El tutor con IA y los role-plays son para equivocarse sin costo. La corrección inmediata es la que más enseña.']];
function vPlan(){ var m=me(); var days=['L','M','X','J','V','S','D'];
  var acts=['Sesión de hoy en la guía','Hora en inglés en casa','Juego «Three things» en la cena','Una frase nueva en «Mi cuaderno»','Usé inglés en el trabajo o la calle'];
  var id=0, lvl='', cd=CANDO.map(function(grp,gi){ var n=0, rows=grp[1].map(function(c){ var k='c'+(id++), on=m.cando[k]; if(on) n++; return '<label class="wk'+(on?' done':'')+'"><input type="checkbox" data-cando="'+k+'"'+(on?' checked':'')+'><span>'+c+'</span></label>'; }).join('');
    if(gi<2&&n>=grp[1].length-1) lvl=gi===0?'A1':'A2'; return '<h3>'+grp[0]+' ('+n+' de '+grp[1].length+')</h3>'+rows; }).join('');
  return '<div class="wrap"><h1 style="margin-top:22px">Plan y nivel</h1>'+
   '<h2>Ya puedo…</h2><p>Marquen lo que ya logran hacer en la vida real, no lo que «saben». Revísenlo cada dos semanas.'+(lvl?' Según sus marcas, van por el nivel <b>'+lvl+'</b>.':'')+'</p><p class="note">A1 y A2 son los dos primeros niveles del Marco Común Europeo, la escala más usada para medir idiomas.</p>'+cd+
   '<h2>Plan de 12 semanas</h2><p>Una meta por semana. Marquen cada semana cuando la terminen.</p>'+
   D.plan.map(function(p){ var d=m.weeks[p[0]]; return '<label class="wk'+(d?' done':'')+'"><input type="checkbox" data-week="'+p[0]+'"'+(d?' checked':'')+'><span><b>Semana '+p[0]+': '+p[1]+'</b><small>'+p[2]+'</small></span></label>'; }).join('')+
   '<h2>Hábitos de esta semana</h2><div class="tscroll"><table class="trk"><tr><th>Actividad</th>'+days.map(function(d){return '<th>'+d+'</th>';}).join('')+'</tr>'+
   acts.map(function(a,i){return '<tr><td>'+a+'</td>'+days.map(function(d,j){var k=i+'-'+j;return '<td><input type="checkbox" aria-label="'+esc(a)+' '+d+'" data-track="'+k+'"'+(m.track[k]?' checked':'')+'></td>';}).join('')+'</tr>';}).join('')+'</table></div>'+
   '<p><button class="btn small" id="trkReset">Empezar una semana nueva</button></p>'+
   '<h2>Nuestra meta</h2><p>Tres frases que quieren decir con confianza en tres meses:</p>'+[0,1,2].map(function(i){return '<p><input class="inp" style="width:100%" data-goal="'+i+'" value="'+esc(m.goals[i]||'')+'" placeholder="Meta '+(i+1)+'" aria-label="Meta '+(i+1)+'"></p>';}).join('')+
   '<h2>Por qué esta guía funciona así</h2>'+METODO.map(function(t){return '<details><summary>'+t[0]+'</summary><p>'+t[1]+'</p></details>';}).join('')+
   '<h2>14 tips para el día a día</h2>'+D.tips.map(function(t){return '<details><summary>'+t[0]+'</summary><p>'+t[1]+'</p></details>';}).join('')+
   '<aside class="box warn"><strong class="t">Un último consejo</strong><p>Habrá días en que sientan que no avanzan: es normal. Sigan con la sesión diaria y hablen aunque sea con errores.</p><p><b>You can do it! ¡Ustedes pueden! Boso por!</b></p></aside></div>'; }

/* ---------- eventos v2 ---------- */
document.addEventListener('click',function(e){ var t=e.target.closest('button'); if(!t) return; var d=t.dataset, c, f;
  if(st.tab==='practicar'&&st.mode&&t.closest('#game')&&(t.classList.contains('opt')||/Check$|^srs|^shNext$/.test(t.id))) touch();
  if(t.id==='srsYes'||t.id==='srsNo'){ c=G.list[G.i]; var s=me().srs, en=s[c.en]||{b:0};
    if(t.id==='srsYes'){ if(c.again){ en={b:1,d:today()+1}; } else { en.b=Math.min(5,en.b+1); en.d=today()+IV[en.b]; } if(c.ph&&!c.again) me().known[c.en]=true; }
    else { en={b:1,d:today()}; delete me().known[c.en]; if(!c.again){ c.again=true; } G.list.push(c); }
    s[c.en]=en; save(); G.i++; G.flip=false; cards(); return; }
  if(t.id==='shNext'){ G.auto=false; stopAll(); stopMic(); G.i++; shadow(); return; }
  if(t.id==='shAuto'){ G.auto=!G.auto; if(G.auto){ shadow(); autoRun(); } else { stopAll(); shadow(); } return; }
  if(t.id==='micBtn'){ var dc=caps.dictation; if(!dc) return; if(mic.on){ try{ dc.stop(); }catch(x){} return; }
    mic.text=''; mic.target=d.target; stopAll(); f=$('#micFb'); if(f){ f.className='fb'; f.textContent=''; }
    var pr; try{ pr=dc.start(); }catch(x){ pr=Promise.reject(x); }
    Promise.resolve(pr).catch(function(err){ mic.on=false; micBtn(); var f2=$('#micFb'); if(err&&err.code==='not_granted'){ caps.dictation=null; if(t.parentNode) t.parentNode.hidden=true; } if(f2){ f2.className='fb bad'; f2.textContent='No se pudo usar el micrófono.'; } }); return; }
  if(t.id==='nSay'||t.id==='nSlow'){ say(G.cur.say, t.id==='nSlow'||G.cur.slow); return; }
  if(t.id==='nCheck'){ var inp=$('#nIn'), v=inp.value.trim().replace(',','.'), a=G.cur.a, parts=function(x){ return x.split(/\D+/).filter(Boolean).map(Number).join('|'); }, ok=!!v&&(v.replace(/\D/g,'')===a.replace(/\D/g,'')||(/[:\/]/.test(a)&&parts(v)===parts(a))||(/^\d+(\.\d+)?$/.test(v)&&/^\d+\.\d+$/.test(a)&&parseFloat(v)===parseFloat(a)));
    f=$('#fb'); inp.className='inp '+(ok?'ok':'bad'); f.className='fb '+(ok?'ok':'bad'); f.textContent=ok?'Correcto: '+a:'Era '+a+'. Escúchenlo otra vez.'; if(!G.cur.done){ G.cur.done=true; if(ok) G.ok++; } return; }
  if(t.id==='nNext'){ if(G.cur&&!G.cur.done){ /* sin responder: no cuenta */ G.i--; } nums(); say(G.cur.say,G.cur.slow); return; }
  if(t.id==='ppSay'||t.id==='ppSlow'){ say(G.list[G.i][G.cur.t], t.id==='ppSlow'); return; }
  if(t.id==='ppBoth'){ var p=G.list[G.i]; say(p[0],true,null,function(ok){ if(ok) setTimeout(function(){ say(p[1],true); },500); }); return; }
  if(d.pp!==undefined&&!G.cur.ans){ G.cur.ans=true; var good=(+d.pp===G.cur.t); if(good) G.ok++; t.classList.add(good?'ok':'bad'); document.querySelectorAll('.opt2').forEach(function(o){ if(+o.dataset.pp===G.cur.t) o.classList.add('ok'); o.disabled=true; });
    f=$('#fb'); f.className='fb '+(good?'ok':'bad'); f.textContent=good?'Correcto.':'Era «'+G.list[G.i][G.cur.t]+'». Toquen «Escuchar las dos» para comparar.'; $('#ppNext').disabled=false; touch(); return; }
  if(t.id==='ppNext'){ G.i++; pairs(); if(G.list[G.i]) say(G.list[G.i][G.cur.t]); return; }
  if(t.id==='tStart'){ var sel=$('#scSel'); G={chat:[],sc:SCEN[+sel.value][1]}; sel.disabled=true; t.disabled=true; tutorTurn(); return; }
  if(t.id==='tSend'){ var ti=$('#tIn'), txt=ti.value.trim(); if(!txt||!G.chat||G.busy) return; G.chat.push({role:'user',text:txt.slice(0,400)}); ti.value=''; tutorTurn(); return; }
  if(t.id==='mAdd'){ var a1=$('#mEn').value.trim(), b1=$('#mEs').value.trim(); f=$('#mFb'); if(!a1||!b1){ f.className='fb bad'; f.textContent='Escriban la frase en los dos idiomas.'; return; }
    me().mine.unshift({en:a1.slice(0,160),es:b1.slice(0,160)}); save(); render(true); toast('Frase guardada en el cuaderno.'); return; }
  if(d.mdel!==undefined){ me().mine.splice(+d.mdel,1); save(); render(true); return; }
});
document.addEventListener('input',function(e){ var t=e.target; if(t.id!=='q') return; var r=$('#sres'), b=$('#tbody'), h=searchHTML(t.value); r.innerHTML=h; b.hidden=!!h; });
document.addEventListener('change',function(e){ var t=e.target, d=t.dataset;
  if(t.id==='retoChk'){ var s=sess(); if(t.checked){ stepDone('reto'); } else { delete s.reto; save(); } render(true); return; }
  if(d.cando){ me().cando[d.cando]=t.checked; save(); render(true); return; }
});
document.addEventListener('keydown',function(e){ if(e.key!=='Enter') return; var id=e.target.id; if(id==='nIn'){ $('#nCheck').click(); } if(id==='tIn'){ e.preventDefault(); $('#tSend').click(); } if(id==='mEs'){ $('#mAdd').click(); } });
function render(keep){ var y=window.scrollY; stopAll(); stopMic();
  view.innerHTML=VIEWS[st.tab]();
  document.querySelectorAll('.tabs button').forEach(function(b){ if(b.dataset.tab===st.tab) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  document.querySelectorAll('.who button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.who===mem.who); });
  if(st.tab==='practicar'&&st.mode) startGame();
  if(!keep){ view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter'); }
  window.scrollTo(0, keep?y:0); afterRender(); }
/* vibración corta al acertar o fallar (solo donde el teléfono lo permite) */
try{ new MutationObserver(function(ms){ ms.forEach(function(m){ var c=m.target.classList; if(!c||!c.contains('fb')) return; try{ if(c.contains('ok')&&navigator.vibrate) navigator.vibrate(18); else if(c.contains('bad')&&navigator.vibrate) navigator.vibrate([28,40,28]); }catch(e){} }); }).observe(view,{subtree:true,attributes:true,attributeFilter:['class']}); }catch(e){}
/* texto plano sin ejecutar nada: documento inerte */
function plain(s){ try{ return new DOMParser().parseFromString('<!DOCTYPE html><body>'+String(s),'text/html').body.textContent||''; }catch(e){ return String(s).replace(/<[^>]*>/g,''); } }
hookCaps();
