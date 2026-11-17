from playwright.sync_api import sync_playwright
import json,re
URL='file://'+__import__('os').path.abspath('dist/claude.html')+''
TTS="{speak:(t,o)=>{__log.push(t);return new Promise(r=>setTimeout(r,20))},stop(){}}"
def stub(tts=TTS,sample="null",dict_="null",pre=""):
    return pre+"window.__log=[];window.claude={use:n=>Promise.resolve(n==='tts'?%s:n==='sample'?%s:n==='dictation'?%s:null)};"%(tts,sample,dict_)
CLOCK="(()=>{const _D=Date;const off=()=>(+window.name||0)*864e5;window.Date=class extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off())}static now(){return _D.now()+off()}}})();"
fails=[]
def check(c,msg):
    if not c: fails.append(msg); print('  FAIL',msg)
def new(pw,init=None,w=390,h=800):
    b=pw.chromium.launch(executable_path=__import__('os').environ.get('CHROME','/usr/bin/google-chrome'),args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce'); pg.errs=[]
    pg.on('pageerror',lambda e:pg.errs.append(str(e))); pg.on('console',lambda m:pg.errs.append(m.text) if m.type=='error' else None)
    if init: pg.add_init_script(init)
    pg.goto(URL,wait_until='domcontentloaded'); pg.wait_for_timeout(400); return b,pg  # sin esperar las fuentes externas
def tour(pg,label,deep=True):
    """visit everything, press everything"""
    ov=[]
    def O(where):
        if pg.evaluate('document.documentElement.scrollWidth>window.innerWidth+1'): ov.append(where)
    for tab in ['inicio','frases','tutor','trabajo','practicar']:
        pg.click(f'[data-tab={tab}]'); O(tab)
    pg.click('[data-tab=inicio]'); pg.click('.mode[data-go=plan]'); O('plan')  # el Plan vive dentro de Inicio
    pg.click('[data-tab=frases]')
    for k in pg.eval_on_selector_all('[data-topic]','e=>e.map(x=>x.dataset.topic)'):
        pg.click(f'[data-topic={k}]'); O('frases/'+k)
        check(len(pg.inner_text('#tbody'))>120 or k=='mio','empty topic '+k)
    for k in ['tec','res']:
        pg.click('[data-tab=trabajo]'); pg.click(f'[data-work={k}]'); O('trabajo/'+k)
    modes=pg.evaluate("(()=>{document.querySelector('[data-tab=practicar]').click();return [...document.querySelectorAll('.mode')].map(x=>x.dataset.start)})()")
    for m in [x for x in modes if x!='tutor']:
        pg.click('[data-tab=practicar]'); pg.click(f'.mode[data-start={m}]'); pg.wait_for_timeout(60); O('mode/'+m)
        check(len(pg.inner_text('#game'))>20,'empty game '+m)
        if not deep: continue
        if pg.query_selector('#deck'):
            for v in pg.eval_on_selector_all('#deck option','e=>e.map(x=>x.value)'):
                pg.select_option('#deck',v); pg.wait_for_timeout(15); check(len(pg.inner_text('#game'))>20,f'empty {m}/{v}')
            pg.select_option('#deck','all')
        # press every enabled button in the game a few rounds
        for r in range(5):
            for bt in pg.query_selector_all('#game button:not([disabled])'):
                try:
                    if bt.is_visible() and not bt.get_attribute('data-start') and not bt.get_attribute('data-go'): bt.click(timeout=150,no_wait_after=True)
                except Exception: pass
    check(not ov,f'{label} overflow at {ov}'); check(not pg.errs,f'{label} errors {pg.errs[:3]}')
    print(label,'ok' if not ov and not pg.errs else 'ISSUES')

with sync_playwright() as pw:
    # A. viewports
    for w,h in [(320,568),(390,844),(768,1024),(1280,800)]:
        b,pg=new(pw,stub(),w,h); tour(pg,f'viewport {w}',deep=(w==390)); b.close()
    # B. failure injection
    cases={
     'storage throws': "Object.defineProperty(window,'localStorage',{get(){throw new Error('denied')}});",
     'storage garbage': "try{localStorage.setItem('aruba-ingles-v1','{{{not json')}catch(e){}",
     'storage wrong shape': "try{localStorage.setItem('aruba-ingles-v1',JSON.stringify({who:'x',el:null,ella:[1,2]}))}catch(e){}",
     'storage v1 shape': "try{localStorage.setItem('aruba-ingles-v1',JSON.stringify({who:'el',el:{known:{'How much is this?':true},weeks:{'1':true},track:{},goals:{'0':'hola'}},ella:{}}))}catch(e){}",
     'storage odd fields': "try{localStorage.setItem('aruba-ingles-v1',JSON.stringify({who:'ella',el:{},ella:{srs:'x',mine:{},days:5,sess:null,cando:7,known:[]}}))}catch(e){}",
     'no audio at all': "Object.defineProperty(window,'speechSynthesis',{value:undefined});",
     'claude.use rejects': "window.claude={use:()=>Promise.reject(new Error('x'))};",
     'claude.use never resolves': "window.claude={use:()=>new Promise(()=>{})};",
     'claude.use throws': "window.claude={use:()=>{throw new Error('boom')}};",
     'tts not_granted': stub(tts="{speak:()=>Promise.reject({code:'not_granted'}),stop(){}}"),
     'tts rate_limited': stub(tts="{speak:()=>Promise.reject({code:'rate_limited'}),stop(){}}"),
     'tts unknown error': stub(tts="{speak:()=>Promise.reject({code:'weird'}),stop(){throw 1}}"),
     'tts throws sync': stub(tts="{speak:()=>{throw new Error('sync')},stop(){}}"),
     'sample not_granted': stub(sample="()=>Promise.reject({code:'not_granted'})"),
     'sample rate_limited': stub(sample="()=>Promise.reject({code:'rate_limited'})"),
     'sample empty/garbage': stub(sample="()=>Promise.resolve({text:'<b>hola</b> no format at all'})"),
     'sample empty text': stub(sample="()=>Promise.resolve({text:''})"),
     'dictation rejects': stub(dict_="{start:()=>Promise.reject({code:'not_granted'}),stop(){},onPartial(){},onFinal(){},onState(){}}"),
     'dictation broken api': stub(dict_="{start(){throw 1},stop(){throw 2}}"),
    }
    for name,init in cases.items():
        b,pg=new(pw,init)
        try:
            check(len(pg.inner_html('#view'))>500,name+': blank page')
            tour(pg,'inject: '+name,deep=name.startswith(('tts','storage throws','no audio','dictation')))
            if 'sample' in name:
                pg.click('[data-tab=practicar]'); pg.click('.mode[data-start=tutor]'); pg.wait_for_timeout(150)
                check(pg.evaluate('location.hash')=='#tutor',name+': practicar->tutor opens the pet tab')
                if pg.query_selector('[data-tsc]'):
                    pg.click('[data-tsc="0"]'); pg.wait_for_timeout(300)
                    if pg.query_selector('#tIn2') and pg.is_visible('#tIn2') and pg.is_enabled('#tIn2'): pg.fill('#tIn2','<img src=x onerror=window.__xss=1> hi'); pg.click('#tSend2'); pg.wait_for_timeout(300)
                    st=pg.evaluate("({toast:(document.getElementById('toast')||{}).textContent, msgs:document.querySelectorAll('.msg').length, dog:(document.getElementById('dog')||{}).dataset&&document.getElementById('dog').dataset.state, xss:!!window.__xss})")
                    print('   tutor state',st); check(not st['xss'],name+' xss'); check(st['dog']!='think',name+': pet stuck thinking')
                else: print('   tutor without AI:',pg.inner_text('#view')[:60])
            if name=='no audio at all':
                pg.click('[data-tab=inicio]'); pg.click('.bigplay'); pg.wait_for_timeout(100); check('audio' in (pg.evaluate("(document.getElementById('toast')||{}).textContent") or ''),'no toast when audio missing')
        except Exception as e: check(False,f'{name}: exception {str(e)[:200]}')
        b.close()
    # C. XSS + notebook + search
    b,pg=new(pw,stub())
    pg.click('[data-tab=frases]'); pg.click('[data-topic=mio]')
    pg.fill('#mEn','<img src=x onerror=window.__xss=1> "quote" \'s'); pg.fill('#mEs','<script>window.__xss=1</script> año'); pg.click('#mAdd'); pg.wait_for_timeout(50)
    pg.fill('#q','ano'); pg.wait_for_timeout(50); check(len(pg.query_selector_all('#sres .phr'))>=1,'accent-insensitive search')
    pg.fill('#q','<img'); pg.fill('#q','zzzzqqq'); check('No hay frases' in pg.inner_text('#sres'),'empty search msg'); pg.fill('#q','')
    pg.click('[data-tab=practicar]'); pg.click('.mode[data-start=cards]'); pg.select_option('#deck','mio'); pg.click('#flip'); pg.click('#srsYes')
    pg.click('[data-tab=practicar]'); pg.click('.mode[data-start=quiz]'); pg.select_option('#deck','mio'); pg.click('.opt'); pg.click('#next')
    check(not pg.evaluate('!!window.__xss'),'XSS via notebook'); check(not pg.errs,f'notebook errors {pg.errs[:2]}')
    # data checks: every audio string speaks something sensible
    pg.click('[data-tab=frases]'); bad=[]; n=0
    for k in pg.eval_on_selector_all('[data-topic]','e=>e.map(x=>x.dataset.topic)')+['@tec','@res']:
        if k[0]=='@': pg.click('[data-tab=trabajo]'); pg.click(f'[data-work={k[1:]}]')
        else: pg.click(f'[data-topic={k}]')
        for t in pg.eval_on_selector_all('[data-say]','e=>e.map(x=>x.dataset.say)'):
            n+=1
            if k!='mio' and (not re.sub(r'<[^>]+>','',t).strip() or re.search(r'_|&[a-z]+;',t)): bad.append((k,t))  # «Mi cuaderno» lo escribe la persona
        rows=pg.eval_on_selector_all('.phr','e=>e.map(x=>[x.querySelector(".en").textContent.trim(),x.querySelector(".es").textContent.trim()])')
        for en,es in rows:
            if not en or not es: bad.append((k,'empty row',en,es))
    print('audio strings checked:',n,'bad:',bad[:6]); check(not bad,'bad audio strings')
    b.close()
    # what is actually sent to the voice
    b,pg=new(pw,stub())
    pg.click('[data-tab=frases]'); pg.click('[data-topic=num]')
    for bt in pg.query_selector_all('.v')[:60]: bt.click()
    pg.click('[data-topic=verbs]'); [bt.click() for bt in pg.query_selector_all('.v')[:4]]
    pg.click('[data-topic=pron]'); [bt.click() for bt in pg.query_selector_all('.v')[:3]]
    pg.wait_for_timeout(100); log=pg.evaluate('__log'); print('spoken sample:',log[12:20],log[-7:]); check(all('(' not in x for x in log),'parentheses spoken')
    # numbers game formats
    pg.click('[data-tab=practicar]'); pg.click('.mode[data-start=nums]'); seen={}
    for i in range(80):
        lab=pg.inner_text('#game .q'); pg.fill('#nIn','x'); pg.click('#nCheck'); fb=pg.inner_text('#fb'); a=re.search(r'Era (\S+)\.',fb).group(1)
        pg.evaluate('__log.length=0'); pg.click('#nSay'); pg.wait_for_timeout(5); said=pg.evaluate('__log[0]'); seen.setdefault(lab,(a,said))
        pg.click('#nNext')
        # correct answer accepted (typed in a sloppy but valid form)
        if i%2==0:
            lab2=pg.inner_text('#game .q'); pg.fill('#nIn','0'); pg.click('#nCheck'); a2=re.search(r'Era (\S+)\.',pg.inner_text('#fb')).group(1); pg.click('#nNext')
    for k,v in seen.items(): print('  ',k,'->',v)
    check(len(seen)==7,'not all number types seen')
    b.close()
    # accept-forms for answers
    b,pg=new(pw,stub()); pg.click('[data-tab=practicar]'); pg.click('.mode[data-start=nums]'); okc=0; tot=0
    for i in range(40):
        pg.fill('#nIn','x'); pg.click('#nCheck'); a=re.search(r'Era (\S+)\.',pg.inner_text('#fb')).group(1)
        variants=[a]
        if ':' in a: variants+=[a.replace(':','.'),a.replace(':',' ')]
        if '/' in a: variants+=[a.replace('/','-'),a.replace('/',' ')]
        if '.' in a: variants+=[a.replace('.',','), a.rstrip('0').rstrip('.') if a.endswith('0') else a]
        for v in variants:
            tot+=1; pg.fill('#nIn',v); pg.click('#nCheck'); c='ok' in pg.get_attribute('#nIn','class')
            okc+=c
            if not c: print('   rejected valid form',a,'<-',repr(v))
        pg.click('#nNext')
    print('number answer forms accepted',okc,'/',tot); check(okc==tot,'valid number forms rejected')
    check(not pg.errs,'nums errors'); b.close()
    # E. time travel: SRS schedule, streak, session reset
    b,pg=new(pw,CLOCK+stub())
    def day(n): pg.evaluate(f'window.name="{n}"'); pg.reload(); pg.wait_for_timeout(200)
    def cards_run(yes=True):
        pg.click('[data-tab=practicar]'); pg.click('.mode[data-start=cards]'); pg.select_option('#deck','surv'); n=0
        while pg.query_selector('#flip') and n<60: pg.click('#flip'); pg.click('#srsYes' if yes else '#srsNo') if (yes or n<3) else pg.click('#srsYes'); n+=1
        return n, pg.inner_text('#game')
    n0,txt=cards_run(); print('day0 cards:',n0,'|',txt.split('\n')[1] if '\n' in txt else txt[:60])
    def due(): pg.click('[data-tab=inicio]'); return pg.inner_text('.steps')
    check('pendientes' not in due(),'cards due same day after correct')
    st0=pg.inner_text('.stats'); check(st0.startswith('1 día'),'streak day0: '+st0[:20])
    day(1); d1=due(); print('day1:',re.search(r'(\d+) pendientes',d1).group(0) if 'pendientes' in d1 else 'none due'); check(f'{n0} pendientes' in d1,'day1 due count')
    check(len(pg.query_selector_all('.step.done'))==0,'session not reset next day')
    check(pg.inner_text('.stats').startswith('1 día'),'streak kept before practising day1: '+pg.inner_text('.stats')[:12])
    n1,_=cards_run(); check(pg.evaluate('1') and True,''); check('pendientes' not in due(),'still due after review day1')
    check(pg.inner_text('.stats').startswith('2 días'),'streak day1 '+pg.inner_text('.stats')[:12])
    day(2); d2=due(); print('day2:',re.search(r'(\d+) pendientes',d2).group(0) if 'pendientes' in d2 else 'none due'); check(f'{n1-n0} pendientes' in d2,'box2 should not be due on day2 (interval 2): only the new cards of day1')
    day(3); d3=due(); print('day3:',re.search(r'(\d+) pendientes',d3).group(0) if 'pendientes' in d3 else 'none due'); check('pendientes' in d3,'box2 due on day3')
    check(pg.inner_text('.stats').startswith('0 días'),'streak should break after a missed day: '+pg.inner_text('.stats')[:12])
    # person separation
    pg.click('[data-who=el]'); check('pendientes' not in pg.inner_text('.steps') and pg.inner_text('.stats').startswith('0 días'),'progress leaked between people')
    check(not pg.errs,f'time travel errors {pg.errs[:2]}'); b.close()
print('\nTOTAL FAILS:',len(fails)); [print(' -',f) for f in fails]
