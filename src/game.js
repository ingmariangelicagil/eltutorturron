
/* ===================== Camino a casa (v8): juego de plataformas =====================
   Correr, saltar y ladrar por 4 mundos de Aruba (8 niveles, cada uno más difícil) hasta llegar a casa.
   Los malos son abuelos gruñones (diseño original). Cada perro se cura con lo suyo:
   Turrón con calcetines, Roma con croquetas y Sam con su plato de comida.
   Todo se dibuja en un canvas de 320x180 escalado en píxeles; la interfaz (vidas, mensajes, controles) es HTML.
   El avance se guarda aparte, en localStorage 'english-dog-juego', para no tocar el progreso de inglés. */
(function(){
var CW=320, CH=180, CWMAX=320, CWMIN=192, TS=16, ROWS=11, OY=CH-ROWS*TS, NLV=8, KEY='english-dog-juego';
var WORLDS=[
  {en:'The beach',es:'La playa',sky:['#7FD3E8','#D4F3F7'],far:'sea',g:['#F4DDA4','#E2BE7A','#C99A52'],plat:'wood'},
  {en:'Downtown',es:'El pueblo',sky:['#8CC8F2','#E6F3FB'],far:'houses',g:['#7DBA5A','#9A6B47','#7A5236'],plat:'brick'},
  {en:'The desert',es:'El desierto',sky:['#F3B76E','#FCE7C4'],far:'hills',g:['#E0A86C','#B9783F','#93592E'],plat:'rock'},
  {en:'Night in the neighborhood',es:'Noche en el barrio',sky:['#17203D','#34436E'],far:'night',g:['#4E7A3A','#5A4636','#3E2F25'],plat:'brick'}];
var HEAL={turron:['Yum! A sock!','¡Ñam! Un calcetín','sock','calcetines'],
          roma:['Yum! A croquette!','¡Ñam! Una croqueta','croq','croquetas'],
          sam:['Yum! Dog food!','¡Ñam! Comida para perros','bowl','su plato de comida']};
var SAYS=[['Get off my lawn!','¡Fuera de mi jardín!'],['Bad dog!','¡Perro malo!'],['Shoo! Shoo!','¡Fuera, fuera!'],
          ['Go home!','¡Vete a casa!'],['Too much noise!','¡Cuánto ruido!'],['In my day, dogs were quiet!','¡En mis tiempos los perros no ladraban!'],
          ['Stop right there!','¡Alto ahí!'],['Not on my porch!','¡En mi porche no!']];

/* ---------- pixel art ---------- */
var K='#2B1A12';
var OLD=['...kkkkkkk....','..kcccccccck..','.kccccccccccck','.kkkkkkkkkkkkk','.hksssssssskh.','hhkkkkskkkkhh.','hhkgwkskgwkkh.','.hksssssssskh.',
  '..ksssooossk..','..kmmmmmmmmk..','..ksmmkkmmsk..','...kssssssk...','..kjjjjjjjjk..','.kjjjbjjbjjjk.','.ksjjjjjjjjsk.','.kkjjjbjjjjkk.','..kttttttttk..'];
var LEGA=['..kttk..kttk..','..kttk..kttk..','.krrrk..krrrk.','.kkkkk..kkkkk.'], LEGB=['...kttkkttk...','...kttkkttk...','..krrrkkrrrk..','..kkkkkkkkkk..'];
var OPAL={k:K,c:'#6B4E2E',h:'#EDEDED',s:'#E8B48A',g:'#BFE3F0',w:'#FFFFFF',o:'#C9785A',m:'#F7F7F7',j:'#7A8F4A',b:'#E8D27A',t:'#5A5A6A',r:'#B83A3A'};
var MAPS={
  sock:['..kkkk....','..kwwk....','..krrk....','..kwwk....','..krrk....','..kwwwk...','.kwwwwwkk.','kwwwwwwwwk','kwwwwwwwwk','.kkkkkkkk.'],
  croq:['...kkkk...','.kkyoyokk.','kyoooyooyk','koyoodooyk','kooyoooodk','kdoooyoodk','.kddoodkk.','..kkkkkk..'],
  bowl:['..n.nn.n..','.nnnnnnnn.','kBBBBBBBBk','kBwBBBBBBk','.kBBBBBBk.','..kkkkkk..'],
  bone:['.kk...kk.','kwwkkkwwk','.kwwwwwk.','kwwkkkwwk','.kk...kk.'],
  slip:['.kkkkkk.','krrrrrrk','krrwwrrk','.kkkkkk.'],
  heart:['.kk.kk.','krrkrrk','krrrrrk','.krrrk.','..krk..','...k...']};
var IPAL={k:K,w:'#FFFFFF',r:'#D6336C',o:'#C98A3A',y:'#E7B25A',d:'#8E5A22',n:'#8A4B17',B:'#2F6FB5'};
IPAL.w2='#9CC3EE';
function bake(map,pal,sc){ sc=sc||1; var w=0; map.forEach(function(r){ w=Math.max(w,r.length); });
  var c=document.createElement('canvas'); c.width=w*sc; c.height=map.length*sc; var x=c.getContext('2d');
  map.forEach(function(r,y){ for(var i=0;i<r.length;i++){ var ch=r[i]; if(ch==='.'||!pal[ch]) continue; x.fillStyle=pal[ch]; x.fillRect(i*sc,y*sc,sc,sc); } }); return c; }
function flip(c){ var f=document.createElement('canvas'); f.width=c.width; f.height=c.height; var x=f.getContext('2d'); x.translate(c.width,0); x.scale(-1,1); x.drawImage(c,0,0); return f; }
function both(c){ return [c,flip(c)]; }
function dogMap(pet,mods,tail){ var P=DOG.pets[pet], rows=P.rows.map(function(r){ return r.split(''); });
  (P.base||[]).forEach(function(p){ rows[p[1]][p[0]]=p[2]; });
  (mods||[]).forEach(function(m){ var o=DOG[m]; if(!o) return; if(Array.isArray(o)) o.forEach(function(p){ rows[p[1]][p[0]]=p[2]; }); else for(var i in o) rows[+i]=o[i].split(''); });
  if(tail&&DOG[tail]) DOG[tail].forEach(function(p){ rows[p[1]][p[0]]=p[2]; });
  return rows.map(function(r){ return r.join(''); }); }
function px2svg(map,pal,cls){ var w=map[0].length, out='<svg class="'+(cls||'')+'" viewBox="0 0 '+w+' '+map.length+'" shape-rendering="crispEdges" aria-hidden="true">';
  map.forEach(function(r,y){ for(var x=0;x<r.length;x++){ var c=r[x]; if(c!=='.'&&pal[c]) out+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+pal[c]+'"/>'; } }); return out+'</svg>'; }
var SPR=null;
function sprites(){ if(SPR) return SPR; SPR={dog:{},en:{},it:{}};
  function om(pal,leg){ return bake(OLD.concat(leg),Object.assign({},OPAL,pal)); }
  var V={walk:{},throw:{j:'#8E3B46',c:'#3E5A7A'},scoot:{j:'#4A7FA8',c:'#7A6A4E'},boss:{j:'#5C4B8A',c:'#3A2A55',t:'#3A2A55'}};
  for(var k in V){ SPR.en[k]=[both(om(V[k],LEGA)),both(om(V[k],LEGB))]; }
  SPR.en.boss=[both(bake(OLD.concat(LEGA),Object.assign({},OPAL,V.boss),2)),both(bake(OLD.concat(LEGB),Object.assign({},OPAL,V.boss),2))];
  var ip=Object.assign({},IPAL); SPR.it.sock=bake(MAPS.sock,ip); SPR.it.croq=bake(MAPS.croq,ip); SPR.it.bone=bake(MAPS.bone,Object.assign({},ip,{w:'#FFF8EE'}));
  SPR.it.bowl=bake(MAPS.bowl,Object.assign({},ip,{w:'#9CC3EE'})); SPR.it.slip=both(bake(MAPS.slip,ip));
  return SPR; }
function dogSpr(pet){ var S=sprites(); if(S.dog[pet]) return S.dog[pet]; var pal=Object.assign({},DOG.pal,DOG.pets[pet].pal);
  S.dog[pet]={a:both(bake(dogMap(pet,[],'tailA'),pal)),b:both(bake(dogMap(pet,[],'tailB'),pal)),hap:both(bake(dogMap(pet,['happy'],'tailA'),pal)),ouch:both(bake(dogMap(pet,['blink'],'tailB'),pal))};
  return S.dog[pet]; }

/* ---------- niveles ---------- */
function rng(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function topY(h){ return OY+(ROWS-h)*TS; }
function mk(t,x,gy,L){ var e={t:t,x:x,y:0,vx:0,vy:0,dir:-1,hp:1,w:12,h:20,cd:50+((x*13)%60),an:0,step:0,dead:0,said:0,sp:0,fl:0,on:0};
  if(t==='walk') e.sp=0.34+0.05*L;
  if(t==='scoot'){ e.sp=0.85+0.08*Math.max(0,L-4); e.w=20; e.hp=2; }
  if(t==='boss'){ e.w=24; e.h=40; e.hp=e.max=20; e.sp=0.55; e.cd=90; }
  e.y=gy-e.h; return e; }
function gen(L){
  var R=rng(L*7919+101), fin=L===NLV-1, endLen=fin?34:12, W=84+L*14+(fin?22:0);
  var map=new Uint8Array(ROWS*W), en=[], it=[], gh=2, x=0, healEvery=Math.max(20,32-L*2), lastHeal=0, check=null;
  function col(c,h){ for(var r=0;r<ROWS;r++) map[r*W+c]=r>=ROWS-h?1:0; }
  function flat(n){ for(var i=0;i<n;i++) col(x+i,gh); var x0=x; x+=n; return x0; }
  flat(10);
  while(x<W-endLen){
    var r=R(), room=W-endLen-x, i;
    if(r<0.13+0.03*L&&room>8){ var g=2+(R()<Math.min(0.7,0.2+L*0.08)?1:0); for(i=0;i<g;i++) col(x+i,0); x+=g;
      if(g<3&&R()<0.3) gh=Math.min(4,gh+1); else if(R()<0.3) gh=Math.max(2,gh-1); flat(3); continue; }
    if(r<0.36) gh=Math.max(2,Math.min(4,gh+(R()<0.5?-1:1)));
    var n=Math.min(room,4+Math.floor(R()*6)), x0=flat(n), y=topY(gh), mid=x0+(n>>1), used={};
    if(!check&&x0>W*0.5&&n>=3){ check={x:x0*TS+4,y:y}; it.push({t:'flag',x:x0*TS+2,y:y-26,w:12,h:26}); used[x0]=1; }
    if(n>=4&&R()<0.22+0.05*L){ en.push(mk('walk',mid*TS,y,L)); used[mid]=1; }
    else if(L>=2&&n>=4&&R()<0.14+0.04*L){ en.push(mk('throw',(x0+n-2)*TS,y,L)); used[x0+n-2]=1; }
    else if(L>=4&&n>=6&&R()<0.14+0.04*(L-4)){ en.push(mk('scoot',mid*TS,y,L)); used[mid]=1; }
    if(L>=4&&n>=5&&R()<0.32){ var sc=x0+1+Math.floor(R()*(n-2)); if(!used[sc]&&!used[sc-1]&&!used[sc+1]) map[(ROWS-gh-1)*W+sc]=3; }
    if(n>=5&&R()<0.36){ var pr=ROWS-gh-3, pl=Math.min(n-3,3+Math.floor(R()*2)), px0=x0+1, py=OY+pr*TS;  /* deja libres las 2 últimas columnas: ahí se salta el hueco */
      for(i=0;i<pl&&px0+i<x0+n;i++) map[pr*W+px0+i]=2;
      if(x0-lastHeal>=healEvery){ it.push({t:'heal',x:(px0+1)*TS+3,y:py-12,w:10,h:10}); lastHeal=x0; }
      else for(i=0;i<pl&&px0+i<x0+n;i++) it.push({t:'bone',x:(px0+i)*TS+4,y:py-9,w:9,h:5}); }
    else if(R()<0.42){ for(i=0;i<3;i++) it.push({t:'bone',x:(x0+i)*TS+(n>3?TS:0)+4,y:y-15-(i===1?7:0),w:9,h:5}); }
    if(x0-lastHeal>=healEvery+8){ it.push({t:'heal',x:mid*TS+3,y:y-13,w:10,h:10}); lastHeal=x0; }
  }
  gh=2; var e0=flat(W-x);
  var lv={L:L,w:W,map:map,en:en,it:it,check:check,fin:fin,start:{x:3*TS,y:topY(2)},shots:[],proj:[],parts:[],bossHits:0,bossDown:0};
  if(fin){ lv.arena=e0*TS; en.push(mk('boss',(W-15)*TS,topY(2),L)); lv.house={x:(W-8)*TS,y:topY(2)}; lv.door={x:(W-8)*TS+20,y:topY(2)-22,w:12,h:22}; }
  else lv.goal={x:(W-5)*TS,y:topY(2)};
  return lv; }

/* ---------- estado ---------- */
var A={sv:null,pet:null,lv:null,P:null,run:false,raf:0,acc:0,last:0,cam:0,tick:0,K:{},bones:0,ui:null,mute:false,say:0,hidden:false,msg:null};
function who(){ try{ return (typeof mem!=='undefined'&&mem&&mem.who)||'inv'; }catch(e){ return 'inv'; } }
function load(){ var all={}; try{ all=JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){}
  var s=all[who()]; if(!s||typeof s!=='object') s={}; if(!(s.un>=1)) s.un=1; s.un=Math.min(NLV,Math.floor(s.un)); if(!DOG.pets[s.pet]) s.pet=null; s.best=+s.best||0; A.mute=!!all.mute; A.sv=s; }
function save(){ try{ var all=JSON.parse(localStorage.getItem(KEY)||'{}')||{}; all[who()]=A.sv; all.mute=A.mute; localStorage.setItem(KEY,JSON.stringify(all)); }catch(e){} }

/* ---------- sonido (WebAudio, muy bajito) ---------- */
var AC=null;
function sfx(k){ if(A.mute) return; try{ if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume();
  var S={jump:[520,780,0.11,'square'],bark:[320,150,0.12,'sawtooth'],pick:[880,1320,0.1,'square'],hurt:[240,90,0.25,'triangle'],pop:[640,200,0.14,'square'],win:[660,1320,0.4,'square']}[k]; if(!S) return;
  var o=AC.createOscillator(), g=AC.createGain(), t=AC.currentTime; o.type=S[3]; o.frequency.setValueAtTime(S[0],t); o.frequency.exponentialRampToValueAtTime(S[1],t+S[2]);
  g.gain.setValueAtTime(0.05,t); g.gain.exponentialRampToValueAtTime(0.001,t+S[2]); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+S[2]+0.02); }catch(e){} }

/* ---------- física ---------- */
function tile(c,r){ var lv=A.lv; if(c<0||c>=lv.w) return 1; if(r<0||r>=ROWS) return 0; return lv.map[r*lv.w+c]; }
function solidAt(px,py){ var t=tile(Math.floor(px/TS),Math.floor((py-OY)/TS)); return t===1||t===2; }
function moveBody(b){ var hit={x:0,y:0};
  b.x+=b.vx;
  if(b.vx>0&&(solidAt(b.x+b.w,b.y+1)||solidAt(b.x+b.w,b.y+b.h/2)||solidAt(b.x+b.w,b.y+b.h-1))){ b.x=Math.floor((b.x+b.w)/TS)*TS-b.w-0.01; b.vx=0; hit.x=1; }
  else if(b.vx<0&&(solidAt(b.x,b.y+1)||solidAt(b.x,b.y+b.h/2)||solidAt(b.x,b.y+b.h-1))){ b.x=(Math.floor(b.x/TS)+1)*TS+0.01; b.vx=0; hit.x=-1; }
  b.y+=b.vy; b.on=0;
  if(b.vy>0&&(solidAt(b.x+1,b.y+b.h)||solidAt(b.x+b.w-1,b.y+b.h))){ b.y=Math.floor((b.y+b.h-OY)/TS)*TS+OY-b.h; b.vy=0; b.on=1; hit.y=1; }
  else if(b.vy<0&&(solidAt(b.x+1,b.y)||solidAt(b.x+b.w-1,b.y))){ b.y=(Math.floor((b.y-OY)/TS)+1)*TS+OY; b.vy=0; hit.y=-1; }
  return hit; }
function over(a,b){ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }
function say(en,es){ if(!A.ui) return; A.ui.say.innerHTML='<b lang="en">'+esc(en)+'</b> <span>'+esc(es)+'</span>'; A.ui.say.classList.add('on'); A.say=150; }
function part(x,y,c,n){ for(var i=0;i<n;i++) A.lv.parts.push({x:x,y:y,vx:(Math.random()-0.5)*3,vy:-Math.random()*3,l:30+Math.random()*20,c:c}); }

function spawn(at){ var P=A.P, s=at||A.lv.start; P.x=s.x; P.y=s.y-P.h-1; P.vx=0; P.vy=0; P.inv=90; A.cam=Math.max(0,P.x-CW*0.35); }
function hurt(){ var P=A.P; if(P.inv>0||A.state!=='play') return; P.hp--; P.inv=100; P.vx=-P.face*2.2; P.vy=-3; sfx('hurt'); hud(); try{ if(navigator.vibrate) navigator.vibrate(40); }catch(e){} if(P.hp<=0) lose(); }
function kill(e){ e.dead=1; e.vy=-3; e.vx=(A.P.x<e.x?1:-1)*0.8; sfx('pop'); part(e.x+e.w/2,e.y+6,'#F7F7F7',8); A.bones+=e.t==='boss'?0:1;
  if(e.t==='boss'){ A.lv.bossDown=1; say('Hmph! Fine. Go home!','¡Bah! Está bien. Vete a casa.'); hud(); } }

function step(){ var lv=A.lv, P=A.P, K=A.K; A.tick++;
  /* jugador */
  var ax=(K.l?-1:0)+(K.r?1:0);
  if(ax){ P.vx+=ax*0.28; P.face=ax; } else P.vx*=P.on?0.72:0.93;
  if(P.vx>1.9) P.vx=1.9; if(P.vx<-1.9) P.vx=-1.9; if(Math.abs(P.vx)<0.02) P.vx=0;
  P.vy=Math.min(P.vy+0.32,6.5);
  if(K.jp){ P.buf=8; K.jp=0; }
  if(P.buf>0&&P.coy>0){ P.vy=-6.1; P.buf=0; P.coy=0; sfx('jump'); }
  if(!K.j&&P.vy<-2.6) P.vy=-2.6;
  var wasOn=P.on; moveBody(P); P.coy=P.on?7:Math.max(0,P.coy-1); if(P.buf>0) P.buf--;
  if(P.on&&!wasOn) part(P.x+P.w/2,P.y+P.h,'#FFF8EE',3);
  if(P.x<0) P.x=0; if(P.x>lv.w*TS-P.w) P.x=lv.w*TS-P.w;
  if(P.inv>0) P.inv--; if(P.cd>0) P.cd--;
  if((K.b||K.bp)&&P.cd<=0){ K.bp=0; lv.shots.push({x:P.face>0?P.x+P.w:P.x-6,y:P.y+5,vx:P.face*3.6,l:42,dir:P.face}); P.cd=16; sfx('bark'); }
  /* pinchos (cactus) */
  var c0=Math.floor((P.x+3)/TS), c1=Math.floor((P.x+P.w-3)/TS), r0=Math.floor((P.y+4-OY)/TS), r1=Math.floor((P.y+P.h-1-OY)/TS);
  for(var c=c0;c<=c1;c++) for(var r=r0;r<=r1;r++) if(tile(c,r)===3) hurt();
  /* caída */
  if(P.y>CH+24&&A.state==='play'){ P.hp--; sfx('hurt'); hud(); if(P.hp<=0){ lose(); return; } spawn(lv.respawn); say('Oops! Careful!','¡Uy! Con cuidado.'); }
  /* ladridos */
  lv.shots=lv.shots.filter(function(s){ s.x+=s.vx; s.l--; if(s.l<=0||solidAt(s.x+3,s.y+3)) return false;
    for(var i=0;i<lv.en.length;i++){ var e=lv.en[i]; if(!e.dead&&over({x:s.x,y:s.y,w:6,h:8},e)){ e.hp--; e.fl=10; part(s.x,s.y+3,'#FFC83A',4); if(e.hp<=0) kill(e); else sfx('pop'); return false; } } return true; });
  /* chancletas */
  lv.proj=lv.proj.filter(function(p){ p.vy+=0.16; p.x+=p.vx; p.y+=p.vy; p.l--; if(p.l<=0||p.y>CH+10||solidAt(p.x+4,p.y+2)) return false;
    if(over({x:p.x,y:p.y,w:8,h:4},{x:P.x+2,y:P.y+2,w:P.w-4,h:P.h-2})){ hurt(); return false; } return true; });
  /* abuelos */
  lv.en.forEach(function(e){
    if(e.dead){ e.vy+=0.3; e.x+=e.vx; e.y+=e.vy; return; }
    if(e.t!=='boss'&&(e.x<A.cam-80||e.x>A.cam+CW+80)) return;
    var dx=P.x-e.x; if(e.an>0) e.an--; if(e.fl>0) e.fl--;
    if(!e.said&&Math.abs(dx)<120&&A.say<=0){ e.said=1; var s=SAYS[(e.x/TS|0)%SAYS.length]; say(s[0],s[1]); }
    if(e.t==='throw'){ e.dir=dx<0?-1:1; e.vx=0; if(Math.abs(dx)<170&&--e.cd<=0){ throwS(e,1); e.cd=Math.max(55,125-lv.L*9); e.an=16; } }
    else if(e.t==='boss'){ if(P.x<lv.arena-30){ e.vx=0; } else { if(--e.cd<=0){ throwS(e,3); e.cd=Math.max(70,120-lv.bossHits*3); e.an=18; }
        if(e.x<lv.arena+10) e.dir=1; if(e.x>lv.house.x-e.w-36) e.dir=-1; e.vx=e.dir*e.sp; if(e.on&&(A.tick%150)===0) e.vy=-5.2; } }
    else e.vx=e.dir*e.sp;
    e.vy=Math.min(e.vy+0.32,6); var h=moveBody(e); if(h.x){ e.dir*=-1; }
    if(e.on&&e.t!=='throw'){ var fx=e.dir>0?e.x+e.w+1:e.x-1; if(!solidAt(fx,e.y+e.h+2)) e.dir*=-1; }
    if(e.vx) e.step++;
    if(e.y>CH+40){ e.dead=1; return; }
    if(over({x:P.x+1,y:P.y,w:P.w-2,h:P.h},e)){
      if(P.vy>0&&P.y+P.h-P.vy<=e.y+6){ P.vy=K.j?-6:-4.6; if(e.t==='boss'){ e.hp-=2; e.fl=12; lv.bossHits=(lv.bossHits||0)+1; sfx('pop'); if(e.hp<=0) kill(e); hud(); } else kill(e); }
      else hurt(); } });
  /* premios */
  lv.it.forEach(function(it){ if(it.got||!over(P,it)) return;
    if(it.t==='bone'){ it.got=1; A.bones++; sfx('pick'); if(!A.sawBone){ A.sawBone=1; say('A bone!','¡Un hueso!'); } part(it.x+4,it.y,'#FFF8EE',4); }
    else if(it.t==='heal'){ it.got=1; P.hp=Math.min(P.max,P.hp+1); var hh=HEAL[A.pet]; say(hh[0],hh[1]); sfx('pick'); part(it.x+5,it.y,'#D6336C',8); }
    else if(it.t==='flag'){ it.got=1; lv.respawn={x:it.x,y:it.y+it.h}; say('Halfway home!','¡Mitad del camino!'); sfx('pick'); }
    hud(); });
  lv.parts=lv.parts.filter(function(p){ p.vy+=0.15; p.x+=p.vx; p.y+=p.vy; return --p.l>0; });
  if(A.say>0&&--A.say===0&&A.ui) A.ui.say.classList.remove('on');
  /* meta */
  if(lv.goal&&P.x+P.w>lv.goal.x+6) done();
  if(lv.fin&&lv.bossDown&&over(P,lv.door)) win();
  /* cámara */
  var tx=P.x-CW*0.38+P.face*24; tx=Math.max(0,Math.min(lv.w*TS-CW,tx)); A.cam+=(tx-A.cam)*0.12; }
function throwS(e,n){ var dir=e.dir; for(var i=0;i<n;i++) A.lv.proj.push({x:e.x+e.w/2-4,y:e.y+4,vx:dir*(1.3+i*0.6),vy:-3.3-i*0.35,l:220,dir:dir}); }

/* ---------- dibujo ---------- */
var ctx=null;
function R(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); }
function palm(x,y){ R(x+6,y,4,46,'#8A5A2A'); R(x+7,y+4,2,40,'#A8743A'); for(var i=-1;i<=1;i+=2){ R(x+8,y-2,12*i,4,'#3E8E4A'); R(x+8+10*i-(i<0?6:0),y+1,6,4,'#3E8E4A'); R(x+8,y-6,9*i,3,'#5BAE5E'); } R(x+4,y-4,8,6,'#5BAE5E'); }
function cactus(x,y,c){ R(x+5,y,6,22,c); R(x,y+6,4,8,c); R(x,y+12,6,3,c); R(x+12,y+4,4,9,c); R(x+10,y+11,6,3,c); }
function lamp(x,y){ ctx.globalAlpha=0.16; ctx.fillStyle='#FFE38A'; ctx.beginPath(); ctx.moveTo(x+1,y+4); ctx.lineTo(x+7,y+4); ctx.lineTo(x+20,y+52); ctx.lineTo(x-12,y+52); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
  R(x+3,y,2,52,'#0E1326'); R(x,y-4,8,5,'#0E1326'); R(x+1,y+1,6,3,'#FFE38A'); }
function disc(cx,cy,r,c){ for(var yy=-r;yy<=r;yy++){ var w=Math.round(Math.sqrt(r*r-yy*yy)); R(cx-w,cy+yy,w*2,1,c); } }
function drawBg(){ var lv=A.lv, w=WORLDS[lv.L>>1], cam=A.cam, g=ctx.createLinearGradient(0,0,0,CH), i, x;
  g.addColorStop(0,w.sky[0]); g.addColorStop(1,w.sky[1]); ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  var ox=cam*0.15;
  if(w.far==='sea'){ disc(CW-58,34,13,'#FFE38A'); R(0,112,CW,70,'#3FA7C9'); R(0,112,CW,3,'#8FD6E8');
    for(i=0;i<12;i++){ x=((i*41-ox*2)%CW+CW)%CW; R(x,124+(i%3)*12,10,2,'#BFEAF3'); } }
  else if(w.far==='houses'){ var C=['#F28C8C','#F2C14E','#7FC8A9','#6FA8DC','#E59AC6'];
    for(i=-1;i<9;i++){ x=Math.round(i*48-(ox%48)); var k=(i+Math.floor(ox/48)+50)%5, hh=34+((i+Math.floor(ox/48)+50)%3)*8;
      R(x+4,128-hh,40,hh,C[k]); R(x+2,128-hh-8,44,8,'#B5523A'); R(x+12,128-hh+8,8,10,'#FFF8EE'); R(x+28,128-hh+8,8,10,'#FFF8EE'); } }
  else if(w.far==='hills'){ for(i=-1;i<6;i++){ x=Math.round(i*80-(ox%80)); ctx.fillStyle='#D99A5E'; ctx.beginPath(); ctx.ellipse(x+40,132,56,36,0,Math.PI,0); ctx.fill(); }
    disc(50,30,12,'#FFF2C9'); }
  else { for(i=0;i<34;i++){ x=((i*67+i*i*7)%CW); R(x,(i*37)%100,1,1,'#FFF8EE'); } disc(CW-50,28,10,'#FFF2C9'); R(CW-54,24,3,3,'#E3D9B0'); R(CW-47,31,4,3,'#E3D9B0'); R(CW-52,33,2,2,'#E3D9B0');
    for(i=-1;i<9;i++){ x=Math.round(i*48-(ox%48)); var hh2=30+((i+Math.floor(ox/48)+50)%3)*10; R(x+4,128-hh2,40,hh2,'#24304F'); R(x+2,128-hh2-6,44,6,'#1A2340');
      if((i+Math.floor(ox/48))%2===0) R(x+14,128-hh2+8,8,8,'#FFD76A'); } }
  /* capa media */
  var mo=cam*0.5, sp=150;
  for(i=Math.floor(mo/sp)-1;i<=Math.floor((mo+CW)/sp)+1;i++){ x=Math.round(i*sp-mo+30);
    if(w.far==='sea'||w.far==='houses') palm(x,OY+ROWS*TS-2*TS-46); else if(w.far==='hills') cactus(x,OY+ROWS*TS-2*TS-22,'#5E8F4A'); else lamp(x,OY+ROWS*TS-2*TS-52); } }
function drawTiles(){ var lv=A.lv, w=WORLDS[lv.L>>1], cam=Math.round(A.cam), c0=Math.max(0,Math.floor(cam/TS)), c1=Math.min(lv.w-1,Math.floor((cam+CW)/TS));
  for(var c=c0;c<=c1;c++) for(var r=0;r<ROWS;r++){ var t=lv.map[r*lv.w+c]; if(!t) continue; var x=c*TS-cam, y=OY+r*TS;
    if(t===1){ R(x,y,TS,TS,w.g[1]); if((c+r)%2===0){ R(x+3,y+9,2,2,w.g[2]); R(x+11,y+4,2,2,w.g[2]); } else R(x+7,y+11,2,2,w.g[2]);
      if(r===0||lv.map[(r-1)*lv.w+c]!==1){ R(x,y,TS,5,w.g[0]); R(x,y+5,TS,1,w.g[2]); if(w.far!=='sea'){ R(x+2,y-1,2,1,w.g[0]); R(x+9,y-1,3,1,w.g[0]); } } }
    else if(t===2){ if(w.plat==='wood'){ R(x,y,TS,7,'#B9783E'); R(x,y,TS,2,'#D9A066'); R(x,y+6,TS,1,'#6E3F17'); R(x+7,y+2,1,4,'#8A4B17'); }
      else if(w.plat==='brick'){ R(x,y,TS,TS,'#C0533A'); R(x,y+7,TS,1,'#F2D2B6'); R(x,y+15,TS,1,'#F2D2B6'); R(x+7,y,1,7,'#F2D2B6'); R(x+3,y+8,1,7,'#F2D2B6'); R(x+12,y+8,1,7,'#F2D2B6'); R(x,y,TS,2,'#D9735A'); }
      else { R(x,y,TS,TS,'#9C8670'); R(x,y,TS,3,'#BBA68D'); R(x+4,y+8,3,2,'#7E6A56'); R(x+10,y+11,3,2,'#7E6A56'); } }
    else if(t===3){ cactus(x,y-6,'#3F7F3A'); R(x+7,y-4,1,1,'#E8F0C0'); R(x+9,y+2,1,1,'#E8F0C0'); R(x+1,y+8,1,1,'#E8F0C0'); } } }
function drawThings(){ var lv=A.lv, cam=Math.round(A.cam), S=sprites(), P=A.P, t=A.tick;
  if(lv.goal){ var gx=lv.goal.x-cam, gy=lv.goal.y; R(gx+10,gy-30,3,30,'#6E3F17'); R(gx,gy-34,26,14,'#FFF8EE'); R(gx,gy-34,26,1,K); R(gx,gy-21,26,1,K); R(gx,gy-34,1,14,K); R(gx+25,gy-34,1,14,K);
    R(gx+4,gy-28,7,5,'#D6336C'); R(gx+5,gy-31,5,3,'#D6336C'); R(gx+7,gy-26,2,3,'#6E3F17'); R(gx+14,gy-28,7,2,K); R(gx+19,gy-30,2,6,K); R(gx+21,gy-28,1,2,K); }
  if(lv.house){ var hx=lv.house.x-cam, hy=lv.house.y; R(hx,hy-40,52,40,'#F2C14E'); R(hx-4,hy-52,60,12,'#D6336C'); R(hx+4,hy-60,44,8,'#D6336C'); R(hx+14,hy-66,24,6,'#D6336C');
    R(hx+20,hy-22,12,22,lv.bossDown?'#5BAE5E':'#8A4B17'); R(hx+29,hy-12,2,2,'#FFC83A'); R(hx+5,hy-32,10,10,'#FFF8EE'); R(hx+37,hy-32,10,10,'#FFF8EE'); R(hx+9,hy-32,2,10,K); R(hx+41,hy-32,2,10,K);
    if(lv.bossDown&&t%40<20){ R(hx+24,hy-30,4,4,'#FFC83A'); } }
  lv.it.forEach(function(it){ if(it.got) return; var x=it.x-cam, y=it.y+Math.round(Math.sin((t+it.x)/12)*1.5); if(x<-20||x>CW+20) return;
    if(it.t==='bone') ctx.drawImage(S.it.bone,x,y);
    else if(it.t==='heal') ctx.drawImage(S.it[HEAL[A.pet][2]],x,y);
    else if(it.t==='flag'){ R(x+1,it.y,2,26,'#6E3F17'); R(x+3,it.y,10,7,'#D6336C'); R(x+6,it.y+2,3,3,'#FFF8EE'); } });
  lv.en.forEach(function(e){ var x=Math.round(e.x-cam), y=Math.round(e.y); if(x<-60||x>CW+60) return; if(e.fl>0&&t%4<2) return;
    var f=(e.vx&&!e.dead)?Math.floor(e.step/10)%2:0, d=e.dir>0?0:1, spr;
    if(e.dead){ ctx.save(); ctx.translate(x+e.w/2,y+e.h/2); ctx.scale(1,-1); ctx.translate(-(x+e.w/2),-(y+e.h/2)); }
    if(e.t==='boss'){ spr=S.en.boss[f][d]; ctx.drawImage(spr,x-2,y+e.h-spr.height); R(x+(e.dir>0?28:-6),y+10,3,30,'#8A5A2A'); if(e.an>0) ctx.drawImage(S.it.slip[d],x+8,y-10); }
    else if(e.t==='scoot'){ spr=S.en.scoot[0][d]; ctx.drawImage(spr,0,0,14,16,x+3,y+e.h-24,14,16); R(x,y+e.h-9,e.w,6,'#C0392B'); R(x,y+e.h-9,e.w,2,'#E36B5A'); R(x+(e.dir>0?e.w-3:1),y+e.h-20,2,12,'#2C2F3E');
      R(x+2,y+e.h-4,5,4,K); R(x+e.w-7,y+e.h-4,5,4,K); R(x+3,y+e.h-3,2,2,'#9AA0A6'); R(x+e.w-6,y+e.h-3,2,2,'#9AA0A6'); }
    else { spr=S.en[e.t][f][d]; ctx.drawImage(spr,x-1,y+e.h-spr.height);
      if(e.t==='walk'){ var cx=e.dir>0?x+13:x-3; R(cx,y+11,2,10,'#8A5A2A'); R(e.dir>0?cx-2:cx,y+10,4,2,'#8A5A2A'); }
      if(e.t==='throw'&&e.an>0) ctx.drawImage(S.it.slip[d],x+2,y-6); }
    if(e.dead) ctx.restore(); });
  lv.proj.forEach(function(p){ ctx.drawImage(S.it.slip[p.dir>0?0:1],Math.round(p.x-cam),Math.round(p.y)); });
  lv.shots.forEach(function(s){ var x=Math.round(s.x-cam), y=Math.round(s.y); for(var k=0;k<3;k++){ var h=3+k*3, xx=x+(s.dir>0?k*3:-k*3); R(xx,y+4-h/2,2,h,k===1?'#FFC83A':'#FFF8EE'); } });
  /* perro */
  var D=dogSpr(A.pet), fr=P.inv>70?D.ouch:(!P.on?D.hap:(Math.abs(P.vx)>0.3&&Math.floor(t/7)%2?D.b:D.a)), bob=(P.on&&Math.abs(P.vx)>0.3&&Math.floor(t/7)%2)?-1:0;
  if(!(P.inv>0&&t%6<3)) ctx.drawImage(fr[P.face>0?0:1],Math.round(P.x-4-cam),Math.round(P.y-4+bob));
  lv.parts.forEach(function(p){ R(p.x-cam,p.y,2,2,p.c); }); }
function draw(){ if(!ctx) return; drawBg(); drawTiles(); drawThings(); }

/* ---------- bucle ---------- */
function loop(ts){ if(!A.run) return; A.raf=requestAnimationFrame(loop);
  if(document.hidden){ A.last=ts; return; }
  var dt=Math.min(100,ts-(A.last||ts)); A.last=ts; A.acc+=dt; var n=0;
  while(A.acc>=1000/60&&n<5){ if(A.state==='play') step(); A.acc-=1000/60; n++; }
  draw(); }
function hud(){ if(!A.ui) return; var P=A.P, h='';
  for(var i=0;i<P.max;i++) h+='<span class="ah'+(i<P.hp?'':' off')+'">'+HEARTSVG+'</span>';
  A.ui.hp.innerHTML=h; A.ui.hp.setAttribute('aria-label','Vidas: '+P.hp+' de '+P.max);
  A.ui.bones.textContent=A.bones;
  var b=A.lv&&A.lv.fin&&A.lv.en.filter(function(e){return e.t==='boss';})[0];
  A.ui.boss.hidden=!(b&&!b.dead&&A.P.x>A.lv.arena-60); if(b) A.ui.boss.firstChild.style.width=Math.max(0,b.hp/b.max*100)+'%'; }
var HEARTSVG='';

/* ---------- pantallas ---------- */
function lvName(L){ var w=WORLDS[L>>1]; return 'Mundo '+((L>>1)+1)+'-'+((L&1)+1); }
function dogBig(pet,mods){ return dogSVG(mods||[],'tailA',null,null,pet); }
function vPick(){ return '<div class="adv"><p class="adv-lead">¿Con qué perro quieres jugar?</p><div class="adv-pets">'+Object.keys(DOG.pets).map(function(k){ var p=DOG.pets[k];
    return '<button class="adv-pet'+(A.sv.pet===k?' on':'')+'" data-adv="pet" data-k="'+k+'"><span class="adv-pd">'+dogBig(k)+'</span><b>'+esc(p.n)+'</b><small>Se cura con '+HEAL[k][3]+'</small></button>'; }).join('')+'</div></div>'; }
function vMap(){ var s=A.sv, p=DOG.pets[s.pet];
  var worlds=WORLDS.map(function(w,wi){ return '<div class="adv-w"><h3>'+(wi+1)+'. '+w.es+' <span lang="en">'+w.en+'</span></h3><div class="adv-lv">'+[0,1].map(function(j){ var L=wi*2+j, open=L<s.un;
      return '<button class="adv-l'+(open?'':' lock')+(L===s.un-1&&!s.won?' next':'')+'" data-adv="play" data-l="'+L+'"'+(open?'':' disabled aria-label="'+lvName(L)+', bloqueado"')+'><b>'+lvName(L).replace('Mundo ','')+'</b><small>'+(L===NLV-1?'¡Casa!':(NLV-L)+' km a casa')+'</small></button>'; }).join('')+'</div></div>'; }).join('');
  return '<div class="adv"><div class="adv-top"><span class="adv-pd">'+dogBig(s.pet)+'</span><div><b>Juegas con '+esc(p.n)+'</b><small>Se cura con '+HEAL[s.pet][3]+'</small></div><button class="btn small" data-adv="pick">Cambiar de perro</button></div>'+
    '<p>Llega a casa en 8 niveles. Salta encima de los abuelos gruñones o ládrales. '+(s.won?'<b>¡Ya llegaste a casa! Puedes volver a jugar cualquier nivel.</b>':'')+'</p>'+
    '<div class="adv-ws">'+worlds+'</div>'+
    '<p class="note adv-keys">En la computadora: flechas para moverte, flecha arriba o espacio para saltar, X para ladrar, P para pausar.</p></div>'; }
function paint(){ var g=A.host; if(!g||!document.body.contains(g)) return; g.innerHTML=A.sv.pet?vMap():vPick(); }

function play(L){ stopLoop(); A.pet=A.sv.pet; A.lv=gen(L); A.lv.respawn=null; A.bones=0; A.sawBone=0; A.tick=0;
  A.P={x:0,y:0,w:14,h:18,vx:0,vy:0,face:1,on:0,hp:3,max:3,inv:0,coy:0,buf:0,cd:0}; spawn(); A.K={};
  open(); hud(); var w=WORLDS[L>>1];
  msg('<p class="am-k">'+lvName(L)+'</p><h2>'+w.es+' <span lang="en">'+w.en+'</span></h2><p>'+(L===NLV-1?'¡Ya casi! Un vecino muy gruñón cuida la puerta de casa.':'Faltan '+(NLV-L)+' km para llegar a casa.')+'</p>',
    [['go','¡A jugar!',1]]);
  A.state='msg'; A.run=true; A.last=0; A.raf=requestAnimationFrame(loop); }
function done(){ if(A.state!=='play') return; A.state='msg'; sfx('win'); var L=A.lv.L; A.sv.un=Math.max(A.sv.un,Math.min(NLV,L+2)); save();
  msg('<h2>¡Nivel superado!</h2><p>Faltan '+(NLV-L-1)+' km para llegar a casa. Huesos: <b>'+A.bones+'</b></p>',[['next','Siguiente nivel',1],['map','Ver el mapa']]); }
function lose(){ A.state='msg'; msg('<h2>¡Te atraparon!</h2><p>Los abuelos gruñones ganaron esta vez. ¿Lo intentas otra vez?</p>',[['retry','Intentar otra vez',1],['map','Ver el mapa']]); }
function win(){ if(A.state!=='play') return; A.state='msg'; sfx('win'); A.sv.won=1; A.sv.un=NLV; A.sv.best=Math.max(A.sv.best,A.bones); save();
  msg('<span class="am-dog">'+dogBig(A.pet,['happy'])+'</span><h2>¡Llegaste a casa!</h2><p lang="en"><b>Home sweet home.</b></p><p>'+esc(DOG.pets[A.pet].n)+' ya está en casa. Huesos: <b>'+A.bones+'</b></p>',[['again','Jugar otra vez',1],['map','Ver el mapa']]); }
function pause(){ if(A.state!=='play') return; A.state='msg'; msg('<h2>Pausa</h2>',[['go','Seguir',1],['map','Salir al mapa']]); }
function msg(html,btns){ var m=A.ui.msg; m.innerHTML='<div class="am-in">'+html+'<div class="am-b">'+btns.map(function(b){ return '<button class="btn'+(b[2]?' fill':'')+'" data-adv="'+b[0]+'">'+b[1]+'</button>'; }).join('')+'</div></div>'; m.hidden=false;
  var f=m.querySelector('.btn'); try{ f.focus({preventScroll:true}); }catch(e){} }
function go(){ A.ui.msg.hidden=true; A.state='play'; A.K={}; try{ A.ui.root.focus({preventScroll:true}); }catch(e){} }

var PADS=[['l','Izquierda','<path d="M15 5l-7 7 7 7"/>'],['r','Derecha','<path d="M9 5l7 7-7 7"/>'],['b','Ladrar','<path d="M6 9c2 2 2 4 0 6M10 7c3 3 3 7 0 10M14 5c4 4 4 10 0 14"/>'],['j','Saltar','<path d="M12 19V6M6 11l6-6 6 6"/>']];
function open(){ if(A.ui) return; var el=document.createElement('div'); el.className='advp'; el.tabIndex=-1; el.setAttribute('role','application'); el.setAttribute('aria-label','Juego Camino a casa');
  HEARTSVG=px2svg(MAPS.heart,{k:K,r:'#E5484D'});
  el.innerHTML='<div class="advp-hud"><span class="advp-hp" role="img"></span><span class="advp-bn" aria-label="Huesos">'+px2svg(MAPS.bone,{k:K,w:'#FFF8EE'},'abn')+'<b>0</b></span>'+
    '<span class="advp-boss" hidden aria-label="Vecino gruñón"><i></i></span><span class="advp-sp"></span>'+
    '<button class="advp-ic" data-adv="mute" aria-label="Sonido" aria-pressed="'+(!A.mute)+'"><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/>'+(A.mute?'<path d="M17 9l4 6M21 9l-4 6"/>':'<path d="M17 8a5 5 0 0 1 0 8"/>')+'</svg></button>'+
    '<button class="advp-ic" data-adv="pause" aria-label="Pausa"><svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg></button>'+
    '<button class="advp-ic" data-adv="map" aria-label="Salir del juego"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
    '<div class="advp-st"><canvas width="'+CW+'" height="'+CH+'"></canvas><p class="advp-say" aria-live="polite"></p><div class="advp-msg" hidden></div></div>'+
    '<div class="advp-pad">'+PADS.map(function(p){ return '<button class="pb pb-'+p[0]+'" data-pad="'+p[0]+'" aria-label="'+p[1]+'"><svg viewBox="0 0 24 24">'+p[2]+'</svg><span>'+(p[0]==='j'||p[0]==='b'?p[1]:'')+'</span></button>'; }).join('')+'</div>';
  document.body.appendChild(el); document.documentElement.classList.add('advlock');
  var cv=el.querySelector('canvas'); ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
  A.ui={root:el,cv:cv,hp:el.querySelector('.advp-hp'),bones:el.querySelector('.advp-bn b'),boss:el.querySelector('.advp-boss'),say:el.querySelector('.advp-say'),msg:el.querySelector('.advp-msg')};
  /* controles táctiles: varios dedos a la vez */
  [].forEach.call(el.querySelectorAll('[data-pad]'),function(b){ var k=b.getAttribute('data-pad');
    function on(e){ e.preventDefault(); try{ b.setPointerCapture(e.pointerId); }catch(x){} b.classList.add('down'); A.K[k]=1; if(k==='j') A.K.jp=1; if(k==='b') A.K.bp=1; }
    function off(){ b.classList.remove('down'); A.K[k]=0; }
    b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off); b.addEventListener('pointercancel',off); b.addEventListener('lostpointercapture',off);
    b.addEventListener('contextmenu',function(e){ e.preventDefault(); }); });
  window.addEventListener('keydown',onKey); window.addEventListener('keyup',onKey); window.addEventListener('resize',fit); window.addEventListener('blur',clearKeys);
  fit(); try{ el.focus({preventScroll:true}); }catch(e){} }
function clearKeys(){ A.K={}; }
function fit(){ if(!A.ui) return; var st=A.ui.cv.parentNode.getBoundingClientRect();
  var want=Math.max(CWMIN,Math.min(CWMAX,Math.round(CH*st.width/Math.max(1,st.height)/2)*2)); if(want!==CW){ CW=want; A.ui.cv.width=CW; ctx.imageSmoothingEnabled=false; if(A.lv) draw(); }
  var s=Math.min(st.width/CW,st.height/CH); if(s>=2) s=Math.floor(s*4)/4;
  A.ui.cv.style.width=Math.floor(CW*s)+'px'; A.ui.cv.style.height=Math.floor(CH*s)+'px'; }
var KM={ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r',ArrowUp:'j',w:'j',W:'j',' ':'j',z:'j',Z:'j',x:'b',X:'b',j:'b',J:'b',k:'b',K:'b'};
function onKey(e){ if(!A.ui) return; var k=KM[e.key], dn=e.type==='keydown';
  if(dn&&(e.key==='Escape'||e.key==='p'||e.key==='P')){ if(A.state==='play'){ e.preventDefault(); pause(); } else if(e.key==='Escape'&&A.state==='msg'&&A.ui.msg.querySelector('[data-adv=go]')){ e.preventDefault(); go(); } return; }
  if(!k) return; if(A.state!=='play'){ return; } e.preventDefault();
  if(dn&&!A.K[k]){ if(k==='j') A.K.jp=1; if(k==='b') A.K.bp=1; } A.K[k]=dn?1:0; }
function stopLoop(){ A.run=false; cancelAnimationFrame(A.raf); }
function close(){ stopLoop(); if(A.ui){ A.ui.root.remove(); A.ui=null; ctx=null; } document.documentElement.classList.remove('advlock');
  window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKey); window.removeEventListener('resize',fit); window.removeEventListener('blur',clearKeys); A.state=null; }

document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('[data-adv]'); if(!b) return; var a=b.getAttribute('data-adv');
  if(a==='pet'){ A.sv.pet=b.getAttribute('data-k'); save(); paint(); }
  else if(a==='pick'){ A.sv.pet=null; paint(); }
  else if(a==='play'){ play(+b.getAttribute('data-l')); }
  else if(a==='go'){ sfx('pick'); go(); }
  else if(a==='next'){ play(Math.min(NLV-1,A.lv.L+1)); }
  else if(a==='retry'){ play(A.lv.L); }
  else if(a==='again'){ play(0); }
  else if(a==='map'){ close(); paint(); }
  else if(a==='pause'){ pause(); }
  else if(a==='mute'){ A.mute=!A.mute; save(); b.setAttribute('aria-pressed',String(!A.mute)); b.querySelector('svg').innerHTML='<path d="M4 9h4l5-4v14l-5-4H4z"/>'+(A.mute?'<path d="M17 9l4 6M21 9l-4 6"/>':'<path d="M17 8a5 5 0 0 1 0 8"/>'); } });

window.ADV={
  start:function(g){ A.host=g; load(); if(!A.ui) paint(); },
  stop:function(){ close(); },
  _dbg:{ A:A, gen:gen, step:function(n){ for(var i=0;i<(n||1);i++) if(A.state==='play') step(); draw(); }, done:function(){ done(); }, win:function(){ if(A.lv){ A.lv.bossDown=1; win(); } } }
};
})();
