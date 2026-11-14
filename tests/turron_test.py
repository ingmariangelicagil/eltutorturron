from playwright.sync_api import sync_playwright
SAMPLE="""Object.assign((m,o)=>{window.__msgs=m;return new Promise(r=>setTimeout(()=>r({text:(m.length===1?'EN: Hello! I would like to book a room, please.\\nES: Hola, quisiera reservar una habitacion.\\nFIX: OK\\nTIP: Empecemos.':(/wrong|is\\?$/.test(m[m.length-1].content)?'EN: For next weekend. Two adults.\\nES: Para el proximo fin de semana.\\nFIX: What dates are you looking for?\\nTIP: La pregunta lleva el verbo antes del sujeto.':'EN: Great, thank you!\\nES: Genial, gracias.\\nFIX: OK\\nTIP: Muy bien dicho.'))}),60))},{})"""
CL="window.__log=[];window.claude={use:n=>Promise.resolve(n==='tts'?{speak:(t,o)=>{__log.push(JSON.stringify(t));return new Promise(r=>setTimeout(r,80))},stop(){}}:n==='sample'?%s:n==='dictation'?{start(){this.s({state:'listening'});setTimeout(()=>{this.f({text:'what dates you are looking wrong'})},120);return Promise.resolve()},stop(){this.s({state:'idle'});return Promise.resolve()},onPartial(){},onFinal(f){this.f=f},onState(f){this.s=f}}:null)};"%SAMPLE
WEB="""window.__log=[];window.TUTOR_API='/api/tutor';window.fetch=(u,o)=>{window.__req=JSON.parse(o.body);return Promise.resolve({ok:!!window.__passok||(__req.clave==='abc'),status:401,json:()=>Promise.resolve({text:'EN: Hi there! How is work today?\\nES: Hola, como va el trabajo?\\nFIX: OK\\nTIP: Bien.'})})};
window.SpeechRecognition=window.webkitSpeechRecognition=function(){var r=this;r.start=()=>{setTimeout(()=>r.onstart(),10);setTimeout(()=>{r.onresult({resultIndex:0,results:[Object.assign([{transcript:'It is busy today'}],{isFinal:true})]});r.onend()},80)};r.stop=r.abort=()=>{}};"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    def page(init,scheme='light',w=390):
        pg=b.new_page(viewport={'width':w,'height':844},color_scheme=scheme); pg.errs=[]
        pg.on('pageerror',lambda e:pg.errs.append(str(e))); pg.on('console',lambda m:pg.errs.append(m.text) if m.type=='error' else None)
        pg.add_init_script(init); pg.goto('file://'+__import__('os').path.abspath('dist/claude.html')+''); pg.wait_for_timeout(400); return pg
    # inside Claude
    pg=page(CL); pg.click('[data-tab=tutor]'); pg.wait_for_timeout(400); pg.screenshot(path='t1.png')
    pg.click('[data-tsc="0"]'); pg.wait_for_timeout(500); pg.screenshot(path='t2.png')
    pg.click('#tMic'); pg.wait_for_timeout(700); pg.screenshot(path='t3.png')
    pg.fill('#tIn2','What dates are you looking for?'); pg.click('#tSend2'); pg.wait_for_timeout(500)
    pg.evaluate('window.scrollTo(0,document.body.scrollHeight)'); pg.wait_for_timeout(200); pg.screenshot(path='t4.png')
    print('spoken:',pg.evaluate('__log')); print('msgs sent roles:',pg.evaluate('__msgs.map(m=>m.role).join()'),'| state',pg.get_attribute('#dog','data-state'),'| msgs',len(pg.query_selector_all('.msg')))
    pg.click('#tFix'); pg.click('#tVoice'); pg.click('#tNew'); pg.wait_for_timeout(100); assert pg.query_selector('[data-tsc]')
    pg.click('[data-tab=trabajo]'); pg.click('[data-go=tutor]'); pg.click('[data-tab=practicar]'); pg.click('.mode[data-start=tutor]'); pg.wait_for_timeout(200); assert pg.query_selector('#dog')
    pg.click('[data-who=el]'); pg.wait_for_timeout(100); print('first for el:',pg.inner_text('.tlist .mode b'))
    print('claude errs',pg.errs,'overflow',pg.evaluate('document.documentElement.scrollWidth')); pg.close()
    # standalone website (Firebase): fetch + browser speech recognition, password flow
    pg=page(WEB,'dark'); pg.click('[data-tab=tutor]'); pg.wait_for_timeout(200); pg.click('[data-tsc="9"]'); pg.wait_for_timeout(300)
    print('needs pass:',bool(pg.query_selector('#tPass'))); pg.fill('#tPass','abc'); pg.click('#tPassOk'); pg.wait_for_timeout(500)
    pg.click('#tMic'); pg.wait_for_timeout(500); print('web msgs',len(pg.query_selector_all('.msg')),'req msgs',pg.evaluate('__req.messages.length'),'lang btn',bool(pg.query_selector('#tLang')))
    pg.screenshot(path='t5.png'); print('web errs',pg.errs); pg.close()
    # no AI at all
    pg=page("window.__x=1"); pg.click('[data-tab=tutor]'); pg.wait_for_timeout(300); print('no-AI:',pg.inner_text('.box.warn .t')); pg.screenshot(path='t6.png'); print(pg.errs)
    pg=page(CL,w=320); pg.click('[data-tab=tutor]'); pg.click('[data-tsc="0"]'); pg.wait_for_timeout(400); print('320 overflow',pg.evaluate('document.documentElement.scrollWidth'))
    b.close()
