# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                PageBreak, Table, TableStyle, KeepTogether, NextPageTemplate)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping
from reportlab.lib.enums import TA_CENTER

D = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("DV", D + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DV-B", D + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DV-I", D + "DejaVuSans-Oblique.ttf"))
pdfmetrics.registerFont(TTFont("DV-BI", D + "DejaVuSans-BoldOblique.ttf"))
addMapping("DV", 0, 0, "DV"); addMapping("DV", 1, 0, "DV-B")
addMapping("DV", 0, 1, "DV-I"); addMapping("DV", 1, 1, "DV-BI")

TEAL = colors.HexColor("#0E7C86")
TEAL_L = colors.HexColor("#E3F4F5")
CORAL = colors.HexColor("#F2665A")
CORAL_L = colors.HexColor("#FDECEA")
SUN = colors.HexColor("#F6B93B")
SUN_L = colors.HexColor("#FEF6E4")
INK = colors.HexColor("#1F2A33")
GREY = colors.HexColor("#6B7780")
LINE = colors.HexColor("#D5DEE2")

S = {}
S["body"] = ParagraphStyle("body", fontName="DV", fontSize=10, leading=14.5, textColor=INK, spaceAfter=6)
S["small"] = ParagraphStyle("small", parent=S["body"], fontSize=8.8, leading=12, spaceAfter=0)
S["h1"] = ParagraphStyle("h1", fontName="DV-B", fontSize=21, leading=26, textColor=TEAL, spaceAfter=4)
S["h1sub"] = ParagraphStyle("h1sub", fontName="DV-I", fontSize=10.5, leading=14, textColor=GREY, spaceAfter=14)
S["h2"] = ParagraphStyle("h2", fontName="DV-B", fontSize=13.5, leading=18, textColor=CORAL, spaceBefore=10, spaceAfter=6)
S["h3"] = ParagraphStyle("h3", fontName="DV-B", fontSize=11, leading=15, textColor=TEAL, spaceBefore=6, spaceAfter=4)
S["bullet"] = ParagraphStyle("bullet", parent=S["body"], leftIndent=14, bulletIndent=2, spaceAfter=3)
S["cell"] = ParagraphStyle("cell", fontName="DV", fontSize=9, leading=12, textColor=INK)
S["cellb"] = ParagraphStyle("cellb", parent=S["cell"], fontName="DV-B")
S["cellh"] = ParagraphStyle("cellh", parent=S["cell"], fontName="DV-B", textColor=colors.white)
S["pron"] = ParagraphStyle("pron", parent=S["cell"], fontName="DV-I", textColor=GREY)
S["dlg"] = ParagraphStyle("dlg", parent=S["body"], fontSize=9.6, leading=13.5, spaceAfter=2)

REC=[]
def RP(t, s="body"):
    REC.append({"t":"p","text":t}); return P(t, s)
def P(t, s="body"):
    p=Paragraph(t, S[s]); p._raw=t; return p
def H1(t, sub=None):
    REC.append({"t":"h1","title":t,"sub":sub})
    out = [P(t, "h1")]
    if sub: out.append(P(sub, "h1sub"))
    return out
def H2(t):
    REC.append({"t":"h2","title":t}); return P(t, "h2")
def H3(t):
    REC.append({"t":"h3","title":t}); return P(t, "h3")
def bullets(items):
    REC.append({"t":"bullets","items":items})
    return [Paragraph(i, S["bullet"], bulletText="•") for i in items]

W = letter[0] - 1.5 * inch  # usable width

def box(content, bg=TEAL_L, border=TEAL, title=None, rec=True):
    if rec: REC.append({"t":"box","kind":{SUN:"tip",CORAL:"warn"}.get(border,"info"),"title":title,"items":[getattr(c,"_raw","") for c in (content if isinstance(content,list) else [content])]})
    inner = []
    if title:
        inner.append(Paragraph(title, ParagraphStyle("bt", parent=S["body"], fontName="DV-B", textColor=border, spaceAfter=4)))
    inner += content if isinstance(content, list) else [content]
    t = Table([[inner]], colWidths=[W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 4, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return KeepTogether([t, Spacer(1, 8)])

def tip(t, title="💡 Tip"): return box([P(t, "body")], SUN_L, SUN, title.replace("💡 ", "★ "))

def phrases(rows, head=("Inglés", "Cómo suena (aprox.)", "Español"), widths=(0.38, 0.27, 0.35)):
    REC.append({"t":"phrases","rows":[list(r) for r in rows]})
    data = [[Paragraph(h, S["cellh"]) for h in head]]
    for r in rows:
        data.append([Paragraph(r[0], S["cellb"]), Paragraph(r[1], S["pron"]), Paragraph(r[2], S["cell"])])
    t = Table(data, colWidths=[W * w for w in widths], repeatRows=1)
    st = [("BACKGROUND", (0, 0), (-1, 0), TEAL),
          ("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE),
          ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
          ("LEFTPADDING", (0, 0), (-1, -1), 6)]
    for i in range(1, len(data)):
        if i % 2 == 0: st.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#F6FAFB")))
    t.setStyle(TableStyle(st))
    return [t, Spacer(1, 10)]

def vocab(rows, cols=2):
    REC.append({"t":"vocab","rows":[list(r) for r in rows]})
    data = []
    per = (len(rows) + cols - 1) // cols
    for i in range(per):
        line = []
        for c in range(cols):
            k = c * per + i
            if k < len(rows):
                line += [Paragraph(rows[k][0], S["cellb"]), Paragraph(rows[k][1], S["cell"])]
            else:
                line += ["", ""]
        data.append(line)
    cw = W / cols
    t = Table(data, colWidths=[cw * 0.5, cw * 0.5] * cols)
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                           ("LINEBEFORE", (2, 0), (2, -1), 0.8, LINE) if cols > 1 else ("TOPPADDING", (0, 0), (0, 0), 3)]))
    return [t, Spacer(1, 10)]

def dialog(title, lines):
    REC.append({"t":"dialog","title":title,"lines":[list(l) for l in lines]})
    inner = []
    for who, en, es in lines:
        inner.append(Paragraph(f"<b>{who}:</b> {en}", S["dlg"]))
        inner.append(Paragraph(f"<font color='#6B7780'><i>{es}</i></font>", ParagraphStyle("dl2", parent=S["dlg"], leftIndent=12, spaceAfter=5, fontSize=8.8)))
    return box(inner, colors.HexColor("#F4F7F8"), TEAL, "Diálogo: " + title, rec=False)

def exercise(title, items, note=None):
    REC.append({"t":"exercise","title":title,"items":items,"note":note})
    inner = []
    if note: inner.append(P(f"<i>{note}</i>", "small")); inner.append(Spacer(1, 4))
    for i, it in enumerate(items, 1):
        inner.append(Paragraph(f"<b>{i}.</b> {it}", ParagraphStyle("ex", parent=S["body"], spaceAfter=5)))
    return box(inner, CORAL_L, CORAL, "✎ " + title, rec=False)

def checkgrid(rows, head):
    data = [[Paragraph(h, S["cellh"]) for h in head]]
    for r in rows:
        data.append([Paragraph(r, S["cell"])] + ["☐"] * (len(head) - 1))
    cw = [W * 0.44] + [W * 0.56 / (len(head) - 1)] * (len(head) - 1)
    t = Table(data, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL),
                           ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                           ("ALIGN", (1, 1), (-1, -1), "CENTER"),
                           ("FONTNAME", (1, 1), (-1, -1), "DV"), ("FONTSIZE", (1, 1), (-1, -1), 12),
                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    return [t, Spacer(1, 10)]

# ---------------------------------------------------------------- page decor
def cover(canv, doc):
    w, h = letter
    canv.saveState()
    canv.setFillColor(TEAL); canv.rect(0, 0, w, h, fill=1, stroke=0)
    canv.setFillColor(colors.HexColor("#13939E")); canv.circle(w - 60, h - 40, 190, fill=1, stroke=0)
    canv.setFillColor(SUN); canv.circle(w - 110, h - 120, 62, fill=1, stroke=0)
    # waves
    canv.setFillColor(colors.HexColor("#0B6970"))
    p = canv.beginPath(); p.moveTo(0, 170)
    for x in range(0, int(w) + 40, 40):
        p.curveTo(x + 10, 190, x + 30, 150, x + 40, 170)
    p.lineTo(w, 0); p.lineTo(0, 0); p.close(); canv.drawPath(p, fill=1, stroke=0)
    canv.setFillColor(CORAL); canv.rect(0.75 * inch, h - 4.1 * inch, 70, 6, fill=1, stroke=0)
    canv.setFillColor(colors.white)
    canv.setFont("DV-B", 13); canv.drawString(0.75 * inch, h - 3.75 * inch, "GUÍA DE ESTUDIO PARA DOS")
    canv.setFont("DV-B", 40)
    canv.drawString(0.75 * inch, h - 4.85 * inch, "English for")
    canv.drawString(0.75 * inch, h - 5.5 * inch, "Daily Life")
    canv.setFont("DV-B", 40); canv.setFillColor(SUN)
    canv.drawString(0.75 * inch, h - 6.15 * inch, "in Aruba")
    canv.setFillColor(colors.white); canv.setFont("DV", 13)
    canv.drawString(0.75 * inch, h - 6.75 * inch, "Inglés práctico para la casa, el supermercado y el trabajo")
    canv.setFont("DV-I", 11)
    canv.drawString(0.75 * inch, h - 7.1 * inch, "Técnico de telecomunicaciones  +  Agente de reservaciones")
    canv.setFont("DV", 9.5)
    canv.drawString(0.75 * inch, 0.75 * inch, "Tips · Frases · Pronunciación · Diálogos · Ejercicios con respuestas · Plan de 12 semanas")
    canv.restoreState()

def normal(canv, doc):
    w, h = letter
    canv.saveState()
    canv.setFillColor(TEAL); canv.rect(0, h - 10, w, 10, fill=1, stroke=0)
    canv.setFillColor(CORAL); canv.rect(0, h - 10, 90, 10, fill=1, stroke=0)
    canv.setFont("DV", 8); canv.setFillColor(GREY)
    canv.drawString(0.75 * inch, 0.45 * inch, "English for Daily Life in Aruba")
    canv.drawRightString(w - 0.75 * inch, 0.45 * inch, f"{doc.page}")
    canv.restoreState()

doc = BaseDocTemplate("/home/claude/Guia_Ingles_Aruba.pdf", pagesize=letter,
                      leftMargin=0.75 * inch, rightMargin=0.75 * inch, topMargin=0.75 * inch, bottomMargin=0.75 * inch,
                      title="English for Daily Life in Aruba – Guía de estudio", author="Guía para pareja")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
doc.addPageTemplates([PageTemplate(id="cover", frames=[frame], onPage=cover),
                      PageTemplate(id="normal", frames=[frame], onPage=normal)])

st = [NextPageTemplate("normal"), PageBreak()]

# ---------------------------------------------------------------- 1. Bienvenida
st += H1("Bienvenidos", "Cómo usar esta guía (léanla juntos primero)")
st.append(RP("Esta guía está hecha para dos personas que acaban de llegar a Aruba y necesitan comunicarse en inglés <b>desde ya</b>: en el supermercado, con los vecinos, en el banco y, sobre todo, en el trabajo. No es un libro de gramática: es una caja de herramientas para hablar."))
st.append(RP("En Aruba los idiomas oficiales son el papiamento y el neerlandés, pero el inglés y el español se usan muchísimo, sobre todo en turismo, servicio al cliente y comercio. Eso es una ventaja: van a escuchar inglés todos los días y mucha gente tendrá paciencia con ustedes."))
st.append(H2("Cómo está organizada"))
st += bullets([
    "<b>Parte 1 – Tips para aprender rápido:</b> hábitos que funcionan para adultos ocupados.",
    "<b>Parte 2 – Pronunciación:</b> los errores típicos de los hispanohablantes y cómo corregirlos.",
    "<b>Parte 3 – Gramática mínima:</b> solo lo necesario para armar frases.",
    "<b>Parte 4 – Situaciones del día a día:</b> supermercado, casa, vecinos, banco, médico, transporte, restaurante y emergencias.",
    "<b>Parte 5 – Inglés para el trabajo:</b> una sección para el técnico de telecomunicaciones y otra para la agente de reservaciones.",
    "<b>Parte 6 – Ejercicios y juegos en pareja</b>, con respuestas al final.",
    "<b>Parte 7 – Plan de 12 semanas</b> y hoja de seguimiento.",
])
st.append(H2("Cómo leer la columna «Cómo suena»"))
st.append(RP("Para ayudarles al principio, muchas frases traen una pronunciación aproximada escrita «a la española». Es una muleta, no una regla: no es exacta. Úsenla para arrancar y luego escuchen el audio real (Google Translate, un diccionario en línea o YouTube) y repitan imitando."))
st.append(tip("Lean esta guía con un lápiz en la mano. Marquen las frases que usan cada semana y tachen las que ya dicen sin pensar. Ver el progreso motiva muchísimo.", "★ Antes de empezar"))
st.append(PageBreak())

# ---------------------------------------------------------------- 2. Tips
st += H1("Parte 1 · Tips para aprender más rápido", "Hábitos pequeños, todos los días, valen más que horas sueltas el fin de semana")
tips = [
    ("1. Poco, pero todos los días", "15 a 30 minutos diarios funcionan mejor que 3 horas el domingo. Elijan un momento fijo: el café de la mañana, el viaje al trabajo o después de cenar."),
    ("2. La «hora en inglés» en casa", "Escojan una hora al día (por ejemplo, la cena) en la que solo se habla inglés entre ustedes. Si no saben una palabra, la dicen en español y la buscan juntos. Sin burlas: los dos están aprendiendo."),
    ("3. Etiqueten la casa", "Peguen papelitos con el nombre en inglés: <i>fridge, stove, sink, door, window, mirror, closet</i>. Cada vez que toquen algo, díganlo en voz alta."),
    ("4. Cambien el idioma del teléfono", "Pongan el celular, WhatsApp y Netflix en inglés. Ya saben dónde está cada botón, así que aprenderán las palabras sin esfuerzo."),
    ("5. Aprendan frases, no palabras sueltas", "En vez de memorizar «receipt = recibo», memoricen «<i>Can I have the receipt, please?</i>». Las frases completas se usan de inmediato."),
    ("6. Hablen solos (en serio)", "Narren lo que hacen: «<i>I'm making coffee. I'm opening the door. I'm going to work.</i>» Esto entrena la boca y el cerebro a la vez."),
    ("7. Técnica del «shadowing» (sombra)", "Pongan un audio corto en inglés, pausen después de cada frase y repítanla imitando el ritmo y la entonación, como un eco. 5 minutos al día mejoran mucho la pronunciación."),
    ("8. Series con subtítulos en inglés", "Primero con subtítulos en español, luego en inglés. Elijan comedias o series del día a día (no de época ni ciencia ficción). Vean el mismo episodio dos veces."),
    ("9. Preparen antes de salir", "Antes de ir al banco, al médico o a una cita, escriban 3 a 5 frases que van a necesitar y practíquenlas en el carro. Así llegan con confianza."),
    ("10. Un cuaderno compartido", "Cada vez que escuchen una frase nueva en el trabajo o en la calle, anótenla. El domingo se enseñan mutuamente lo que aprendió cada uno."),
    ("11. Equivocarse es parte del plan", "La gente entiende un inglés imperfecto. Lo importante es comunicar. Si no entienden, digan: «<i>Sorry, my English is not very good. Can you speak slowly, please?</i>»"),
    ("12. Usen apps como complemento", "Apps de vocabulario y de repetición espaciada (tarjetas) ayudan 10 minutos al día, pero no reemplazan hablar con personas."),
    ("13. Aprovechen el trabajo", "Su trabajo es su mejor clase: cada día escuchan el mismo vocabulario. Pidan a un compañero que les corrija una frase al día."),
    ("14. Celebren los logros", "Primera llamada en inglés, primer correo sin traductor, primera conversación con un vecino: ¡celébrenlo! La motivación es combustible."),
]
for t, d in tips:
    st.append(KeepTogether([P(f"<b><font color='#0E7C86'>{t}</font></b>", "body"), P(d, "body")]))
st.append(box([P("Ustedes tienen algo que los estudiantes solos no tienen: un compañero de práctica en casa. Úsenlo. Corríjanse con cariño, hagan los role-plays de esta guía y compitan sanamente (¿quién aprende más palabras esta semana?).")], CORAL_L, CORAL, "♥ La ventaja de aprender en pareja"))
st.append(PageBreak())

# ---------------------------------------------------------------- 3. Pronunciación
st += H1("Parte 2 · Pronunciación para hispanohablantes", "Los 8 errores más comunes y cómo arreglarlos")
pron = [
    ("La «e» antes de S", "En español decimos «estudent», «espeak». En inglés se empieza directo con la S: <b>s-tudent, s-peak, s-chool, s-pain</b>. Truco: hagan un «ssss» de serpiente y luego la palabra."),
    ("Vocales cortas y largas", "<b>ship</b> (barco, «i» corta) vs. <b>sheep</b> (oveja, «ii» larga). <b>live</b> vs. <b>leave</b>; <b>full</b> vs. <b>fool</b>. Alarguen la vocal cuando hay «ee» o «ea»."),
    ("La TH", "Pongan la punta de la lengua entre los dientes y soplen: <b>think, thank you, three</b>. En <b>this, that, the, mother</b> es igual pero con vibración (como una «d» suave)."),
    ("V y B son distintas", "La <b>V</b> se hace con los dientes de arriba tocando el labio de abajo: <b>very, van, five</b>. La <b>B</b> con los dos labios: <b>bed, bus</b>."),
    ("Las consonantes finales", "No se comen el final: <b>work-ed, ask-ed, cost-s, want-s</b>. En inglés el final cambia el significado (<i>want</i> vs. <i>won't</i>)."),
    ("La terminación -ED", "Suena «t» después de sonidos sordos (<i>worked</i> = «uorkt»), «d» en la mayoría (<i>called</i> = «cold»), e «id» solo después de t/d (<i>wanted</i> = «uántid»)."),
    ("La H suena", "La H en inglés se pronuncia como una «j» suave: <b>hello</b> («jelóu»), <b>house</b> («jáus»), <b>help</b> («jelp»)."),
    ("La J y la Y", "<b>J</b> suena «ll» fuerte o «dy»: <b>job</b> («dyob»). <b>Y</b> suena «i»: <b>yes</b> («iés»). Nunca confundan <b>yes</b> con <b>Jess</b>."),
]
data = [[Paragraph("Problema", S["cellh"]), Paragraph("Cómo corregirlo", S["cellh"])]]
for a, b in pron: data.append([Paragraph(a, S["cellb"]), Paragraph(b, S["cell"])])
t = Table(data, colWidths=[W * 0.25, W * 0.75])
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                       ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE), ("TOPPADDING", (0, 0), (-1, -1), 5),
                       ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
st += [t, Spacer(1, 10)]
st.append(H2("El alfabeto en inglés (¡vital para deletrear nombres!)"))
st.append(RP("En el trabajo de reservaciones y en el técnico van a deletrear nombres, correos y números de serie todo el tiempo. Aprendan el alfabeto y el código fonético internacional:"))
alpha = [("A – ei", "Alpha"), ("B – bi", "Bravo"), ("C – si", "Charlie"), ("D – di", "Delta"), ("E – i", "Echo"),
         ("F – ef", "Foxtrot"), ("G – dyi", "Golf"), ("H – eich", "Hotel"), ("I – ai", "India"), ("J – dyei", "Juliet"),
         ("K – kei", "Kilo"), ("L – el", "Lima"), ("M – em", "Mike"), ("N – en", "November"), ("O – ou", "Oscar"),
         ("P – pi", "Papa"), ("Q – kiu", "Quebec"), ("R – ar", "Romeo"), ("S – es", "Sierra"), ("T – ti", "Tango"),
         ("U – iu", "Uniform"), ("V – vi", "Victor"), ("W – dábel-iu", "Whiskey"), ("X – ex", "X-ray"),
         ("Y – uái", "Yankee"), ("Z – zi / zed", "Zulu")]
st += vocab(alpha, cols=3)
st.append(tip("Las letras que más confunden: <b>E</b> («i») vs. <b>I</b> («ai»); <b>G</b> («dyi») vs. <b>J</b> («dyei»); <b>A</b> («ei») vs. <b>E</b> («i»). Al deletrear un correo: <b>@</b> = «at», <b>.</b> = «dot», <b>_</b> = «underscore», <b>-</b> = «dash».", "★ Cuidado"))
st.append(PageBreak())

# ---------------------------------------------------------------- 4. Gramática
st += H1("Parte 3 · Gramática mínima para sobrevivir", "Con estas 6 estructuras pueden decir casi todo")
st.append(H3("1. Verbo TO BE (ser / estar)"))
st += phrases([("I <b>am</b> from Venezuela. / I'm tired.", "ái am from... / áim táierd", "Soy de Venezuela. / Estoy cansado(a)."),
               ("He <b>is</b> a technician. / She's at work.", "ji is a teknishan", "Él es técnico. / Ella está en el trabajo."),
               ("We <b>are</b> new in Aruba.", "uí ar niú in arúba", "Somos nuevos en Aruba."),
               ("<b>Is</b> it open? / <b>Are</b> you busy?", "is it óupen?", "¿Está abierto? / ¿Estás ocupado?")])
st.append(H3("2. Presente simple (rutinas)"))
st.append(RP("Igual para todos, pero con <b>he/she/it</b> se agrega <b>-s</b>: <i>I work / he work<b>s</b></i>. Negativo: <i>I <b>don't</b> work / she <b>doesn't</b> work</i>. Pregunta: <i><b>Do</b> you work here? <b>Does</b> he speak Spanish?</i>"))
st.append(H3("3. Presente continuo (lo que pasa ahora)"))
st.append(RP("<b>am/is/are + verbo-ing</b>: <i>I'm cooking. He's installing the modem. We're looking for an apartment.</i>"))
st.append(H3("4. Pasado simple"))
st.append(RP("Regular: verbo + <b>-ed</b> (<i>worked, called, booked</i>). Irregulares importantes: <i>go → went, have → had, buy → bought, pay → paid, get → got, see → saw, do → did, make → made, say → said, come → came</i>. Pregunta y negativo con <b>did</b>: <i>Did you call? I didn't see it.</i>"))
st.append(H3("5. Futuro"))
st.append(RP("<b>going to</b> para planes: <i>We're going to visit the beach on Sunday.</i> <b>will</b> para decisiones y promesas en el momento: <i>I'll check that for you. I'll call you back.</i> (¡Muy útil en el trabajo!)"))
st.append(H3("6. Pedir con cortesía: can / could / would"))
st += phrases([("<b>Can</b> I pay with card?", "kan ái péi uiz kard?", "¿Puedo pagar con tarjeta?"),
               ("<b>Could</b> you repeat that, please?", "kud iú ripít dat, plis?", "¿Podría repetir eso, por favor?"),
               ("<b>Would</b> you like a receipt?", "uud iú láik a risít?", "¿Le gustaría un recibo?"),
               ("I <b>would like</b> / I'd like a coffee.", "áid láik a cófi", "Quisiera un café.")])
st.append(tip("Las preguntas con palabra interrogativa: <b>What</b> (qué), <b>Where</b> (dónde), <b>When</b> (cuándo), <b>Who</b> (quién), <b>Why</b> (por qué), <b>How</b> (cómo), <b>How much</b> (cuánto cuesta), <b>How many</b> (cuántos), <b>What time</b> (a qué hora), <b>Which</b> (cuál).", "★ Las palabras «W»"))
st.append(PageBreak())

# ---------------------------------------------------------------- 5. Supervivencia
st += H1("Parte 4 · Situaciones del día a día", "Empiecen por aquí: las frases que más van a usar")
st.append(H2("Frases de supervivencia (memorícenlas esta semana)"))
st += phrases([
    ("Hello! / Good morning / Good afternoon", "jelóu / gud mórning / gud áfternun", "¡Hola! / Buenos días / Buenas tardes"),
    ("How are you? — Fine, thanks. And you?", "jáu ar iú? — fáin, zenks. end iú?", "¿Cómo está? — Bien, gracias. ¿Y usted?"),
    ("Sorry, I don't understand.", "sóri, ái dóunt anderstánd", "Disculpe, no entiendo."),
    ("Can you speak slowly, please?", "kan iú spik slóuli, plis?", "¿Puede hablar despacio, por favor?"),
    ("Can you repeat that, please?", "kan iú ripít dat, plis?", "¿Puede repetir, por favor?"),
    ("How do you say ... in English?", "jáu du iú séi ... in ínglish?", "¿Cómo se dice ... en inglés?"),
    ("What does ... mean?", "uát das ... min?", "¿Qué significa ...?"),
    ("Do you speak Spanish?", "du iú spik spánish?", "¿Habla español?"),
    ("My English is not very good, I'm learning.", "mái ínglish is not véri gud, áim lérning", "Mi inglés no es muy bueno, estoy aprendiendo."),
    ("Can you write it down, please?", "kan iú ráit it dáun, plis?", "¿Me lo puede escribir, por favor?"),
    ("Excuse me, where is ...?", "ekskiús mi, uér is...?", "Disculpe, ¿dónde está...?"),
    ("Thank you very much! / You're welcome.", "zenk iú véri mach / iór uélcam", "¡Muchas gracias! / De nada."),
    ("No problem. / Of course.", "nou próblem / of cors", "No hay problema. / Claro."),
    ("Have a nice day! — You too!", "jav a náis déi — iú tu", "¡Que tenga buen día! — ¡Igualmente!"),
])
st.append(tip("En Aruba también escucharán papiamento. Unas palabras para quedar bien: <b>Bon dia</b> (buenos días), <b>Bon tardi</b> (buenas tardes), <b>Danki</b> (gracias), <b>Con ta bai?</b> (¿cómo estás?), <b>Mi ta bon</b> (estoy bien). Los arubianos aprecian mucho el esfuerzo.", "★ Bonus local"))
st.append(PageBreak())

# ---- Supermercado
st += H1("En el supermercado", "At the supermarket / grocery store")
st.append(H3("Vocabulario"))
st += vocab([("cart / basket", "carrito / cesta"), ("aisle", "pasillo"), ("checkout / cashier", "caja / cajero(a)"),
             ("receipt", "recibo"), ("bag (plastic / paper)", "bolsa"), ("price / on sale", "precio / en oferta"),
             ("cash / card", "efectivo / tarjeta"), ("change", "vuelto / cambio"), ("produce", "frutas y verduras"),
             ("dairy", "lácteos"), ("meat / chicken / fish", "carne / pollo / pescado"), ("bakery", "panadería"),
             ("frozen food", "congelados"), ("cleaning products", "productos de limpieza"), ("a pound / a kilo", "una libra / un kilo"),
             ("a dozen eggs", "una docena de huevos"), ("a loaf of bread", "un pan (de molde)"), ("a bottle of water", "una botella de agua"),
             ("a can of beans", "una lata de frijoles"), ("expiration date", "fecha de vencimiento")])
st.append(H3("Frases útiles"))
st += phrases([
    ("Excuse me, where can I find the rice?", "ekskiús mi, uér kan ái fáind de ráis?", "Disculpe, ¿dónde encuentro el arroz?"),
    ("Is it in aisle 5?", "is it in áil fáiv?", "¿Está en el pasillo 5?"),
    ("How much is this?", "jáu mach is dis?", "¿Cuánto cuesta esto?"),
    ("Do you have ... ?", "du iú jav...?", "¿Tienen ...?"),
    ("Can I get half a pound of ham, please?", "kan ái guet jaf a páund of jam, plis?", "¿Me da media libra de jamón?"),
    ("Sliced, please. / Thin, please.", "sláist, plis / zin, plis", "En rebanadas / Delgado, por favor."),
    ("Can I pay with card?", "kan ái péi uiz kard?", "¿Puedo pagar con tarjeta?"),
    ("Do you accept US dollars?", "du iú aksépt iú-es dólars?", "¿Aceptan dólares?"),
    ("I don't need a bag, thanks.", "ái dóunt nid a bag, zenks", "No necesito bolsa, gracias."),
    ("Can I have the receipt?", "kan ái jav de risít?", "¿Me da el recibo?"),
])
st.append(dialog("en la caja", [
    ("Cashier", "Hi! Did you find everything okay?", "¡Hola! ¿Encontró todo bien?"),
    ("You", "Yes, thank you. Do you accept credit cards?", "Sí, gracias. ¿Aceptan tarjetas de crédito?"),
    ("Cashier", "Yes, we do. Do you need a bag?", "Sí. ¿Necesita bolsa?"),
    ("You", "Yes, two bags, please.", "Sí, dos bolsas, por favor."),
    ("Cashier", "Your total is 85 florins. Insert or tap your card.", "Su total es 85 florines. Inserte o acerque su tarjeta."),
    ("You", "Thank you! Have a nice day.", "¡Gracias! Que tenga buen día."),
]))
st.append(tip("Antes de ir al súper, escriban la lista de compras <b>en inglés</b>. Es el ejercicio más fácil y útil de toda la semana. En Aruba la moneda es el florín arubeño (AWG), y en muchos lugares también aceptan dólares: pregunten siempre en qué moneda les dan el vuelto (<i>«Is the change in florins or dollars?»</i>).", "★ Ejercicio de la vida real"))
st.append(PageBreak())

# ---- Casa
st += H1("En la casa", "At home: rutina, cocina, mantenimiento y conversación en pareja")
st.append(H3("Partes de la casa y objetos (¡para etiquetar!)"))
st += vocab([("living room", "sala"), ("bedroom", "dormitorio"), ("bathroom", "baño"), ("kitchen", "cocina"),
             ("fridge", "nevera"), ("stove / oven", "estufa / horno"), ("microwave", "microondas"), ("sink", "fregadero / lavamanos"),
             ("washing machine", "lavadora"), ("dryer", "secadora"), ("air conditioner (AC)", "aire acondicionado"),
             ("fan", "ventilador"), ("light switch", "interruptor"), ("outlet", "enchufe (pared)"),
             ("faucet / tap", "grifo / llave"), ("trash can", "bote de basura"), ("closet", "clóset"), ("key / lock", "llave / cerradura"),
             ("broom / mop", "escoba / trapeador"), ("dishes", "platos")])
st.append(H3("Rutina diaria — para practicar juntos"))
st += phrases([
    ("I wake up at 6. / I take a shower.", "ái uéik ap at six / ái téik a sháuer", "Me despierto a las 6. / Me ducho."),
    ("What do you want for breakfast?", "uát du iú uánt for brékfast?", "¿Qué quieres desayunar?"),
    ("I'm going to work. See you later!", "áim góing tu uork. si iú léiter", "Me voy al trabajo. ¡Nos vemos!"),
    ("How was your day?", "jáu uas iór déi?", "¿Cómo te fue hoy?"),
    ("It was good / busy / long / stressful.", "it uas gud / bísi / long / strésful", "Fue bueno / ocupado / largo / estresante."),
    ("Can you help me with the dishes?", "kan iú jelp mi uiz de díshis?", "¿Me ayudas con los platos?"),
    ("Let's cook dinner together.", "lets kuk díner tuguéder", "Cocinemos la cena juntos."),
    ("We need to buy milk and eggs.", "uí nid tu bái milk end egs", "Tenemos que comprar leche y huevos."),
    ("Don't forget to pay the electricity bill.", "dóunt forguét tu péi de electrísiti bil", "No olvides pagar la luz."),
    ("Turn on / turn off the AC, please.", "tern on / tern of de ei-si", "Prende / apaga el aire, por favor."),
    ("I'm tired. Let's go to bed.", "áim táierd. lets gou tu bed", "Estoy cansado(a). Vamos a dormir."),
])
st.append(H3("Con el casero o un técnico en casa"))
st += phrases([
    ("The AC is not working.", "de ei-si is not uórking", "El aire no funciona."),
    ("There is a leak in the bathroom.", "der is a lik in de bázrum", "Hay una fuga en el baño."),
    ("When can you come to fix it?", "uén kan iú kam tu fix it?", "¿Cuándo puede venir a arreglarlo?"),
    ("The rent is due on the first of the month.", "de rent is du on de ferst of de manz", "La renta se paga el primero de cada mes."),
])
st.append(tip("Cada noche, durante la cena, cada uno cuenta en inglés <b>tres cosas</b> que hizo en el día, usando el pasado: <i>«Today I worked a lot. I talked to a customer. I bought bread.»</i> El otro hace una pregunta: <i>«Who did you talk to?»</i>", "★ Juego de la cena: «Three things»"))
st.append(PageBreak())

# ---- Vecinos / small talk
st += H1("Vecinos, compañeros y «small talk»", "Conversación corta y amable: la clave para hacer amigos")
st += phrases([
    ("Hi, I'm María. We just moved in next door.", "jái, áim maría. uí yast muvd in next dor", "Hola, soy María. Nos acabamos de mudar al lado."),
    ("Nice to meet you!", "náis tu mit iú", "¡Mucho gusto!"),
    ("Where are you from? — I'm from ...", "uér ar iú from? — áim from...", "¿De dónde eres? — Soy de ..."),
    ("How long have you lived in Aruba?", "jáu long jav iú livd in arúba?", "¿Cuánto tiempo llevas viviendo en Aruba?"),
    ("We've been here for two months.", "uív bin jíer for tu manz", "Llevamos dos meses aquí."),
    ("What do you do? — I work in telecommunications.", "uát du iú du? — ái uork in télecomiunikéishons", "¿A qué te dedicas? — Trabajo en telecomunicaciones."),
    ("I'm a reservations agent.", "áim a reservéishons éiyent", "Soy agente de reservaciones."),
    ("It's so hot today! / What a beautiful day!", "its sou jot tudéi / uát a biútiful déi", "¡Qué calor hace hoy! / ¡Qué día tan bonito!"),
    ("Can you recommend a good restaurant / beach?", "kan iú rekoménd a gud réstorant / bich?", "¿Me recomiendas un buen restaurante / playa?"),
    ("What do you like to do on weekends?", "uát du iú láik tu du on uíkends?", "¿Qué te gusta hacer los fines de semana?"),
    ("Let me know if you need anything.", "let mi nóu if iú nid énizing", "Avísame si necesitas algo."),
])
st.append(H2("Banco, gobierno y trámites"))
st += phrases([
    ("I'd like to open a bank account.", "áid láik tu óupen a bank akáunt", "Quisiera abrir una cuenta bancaria."),
    ("What documents do I need?", "uát dókiuments du ái nid?", "¿Qué documentos necesito?"),
    ("Here is my passport and my work permit.", "jíer is mái pásport end mái uork pérmit", "Aquí está mi pasaporte y mi permiso de trabajo."),
    ("I have an appointment at 10.", "ái jav an apóintment at ten", "Tengo una cita a las 10."),
    ("Where do I sign? / Do I fill out this form?", "uér du ái sáin? / du ái fil áut dis form?", "¿Dónde firmo? / ¿Lleno este formulario?"),
    ("How long does it take?", "jáu long das it téik?", "¿Cuánto tiempo tarda?"),
    ("Can I take a number?", "kan ái téik a námber?", "¿Puedo sacar un número / turno?"),
])
st.append(PageBreak())

# ---- Médico / farmacia
st += H1("Médico y farmacia", "At the doctor / pharmacy")
st += vocab([("headache", "dolor de cabeza"), ("stomachache", "dolor de estómago"), ("sore throat", "dolor de garganta"),
             ("fever", "fiebre"), ("cough", "tos"), ("cold / flu", "resfriado / gripe"), ("allergy", "alergia"),
             ("prescription", "receta médica"), ("pill / tablet", "pastilla"), ("insurance", "seguro"),
             ("appointment", "cita"), ("blood test", "examen de sangre")])
st += phrases([
    ("I need to see a doctor.", "ái nid tu si a dóctor", "Necesito ver a un médico."),
    ("I'd like to make an appointment.", "áid láik tu méik an apóintment", "Quisiera hacer una cita."),
    ("I have a headache and a fever.", "ái jav a jédeik end a fíver", "Tengo dolor de cabeza y fiebre."),
    ("It hurts here.", "it jerts jíer", "Me duele aquí."),
    ("Since yesterday / for three days.", "sins iésterdei / for zri déis", "Desde ayer / desde hace tres días."),
    ("I'm allergic to penicillin.", "áim alérgic tu penisílin", "Soy alérgico(a) a la penicilina."),
    ("How many times a day?", "jáu méni táims a déi?", "¿Cuántas veces al día?"),
    ("Do I need a prescription for this?", "du ái nid a prescrípshon for dis?", "¿Necesito receta para esto?"),
    ("Here is my insurance card.", "jíer is mái inshúrans kard", "Aquí está mi tarjeta del seguro."),
])
st.append(H2("Transporte, restaurante y emergencias"))
st += phrases([
    ("Does this bus go to Oranjestad?", "das dis bas gou tu oranyestad?", "¿Este bus va a Oranjestad?"),
    ("How much is the fare?", "jáu mach is de fer?", "¿Cuánto es el pasaje?"),
    ("Please take me to this address.", "plis téik mi tu dis adrés", "Por favor lléveme a esta dirección."),
    ("A table for two, please.", "a téibol for tu, plis", "Una mesa para dos, por favor."),
    ("Can we see the menu? / The check, please.", "kan uí si de méniu? / de chek, plis", "¿Nos trae el menú? / La cuenta, por favor."),
    ("Is the tip included?", "is de tip inclúded?", "¿La propina está incluida?"),
    ("<b>Help!</b> / Call an ambulance!", "jelp / col an ámbiulans", "¡Ayuda! / ¡Llame una ambulancia!"),
    ("There's been an accident.", "ders bin an áksident", "Hubo un accidente."),
    ("My address is ...", "mái adrés is...", "Mi dirección es ..."),
])
st.append(box([P("En Aruba, para ambulancia y bomberos se marca el <b>911</b>; para la policía, el <b>100</b>. Practiquen juntos, en voz alta, cómo decir su dirección completa en inglés y cómo describir la emergencia en una frase: <i>«My husband fell and he is hurt. We are at [address].»</i> Escríbanla y péguenla en la nevera.")], CORAL_L, CORAL, "⚠ Importante"))
st.append(PageBreak())

# ---------------------------------------------------------------- 6. Trabajo – Técnico
st += H1("Parte 5 · Inglés para el trabajo", "A. Técnico de telecomunicaciones (para él)")
st.append(RP("Buenas noticias: gran parte del vocabulario técnico ya está en inglés (router, modem, Wi-Fi, fiber, switch). El reto es la conversación con clientes, supervisores y compañeros. Aquí está lo esencial."))
st.append(H3("Vocabulario técnico"))
st += vocab([("fiber optic cable", "cable de fibra óptica"), ("splice / splicing", "empalme / empalmar"), ("connector", "conector"),
             ("router / modem", "router / módem"), ("ONT (optical network terminal)", "terminal óptica (ONT)"),
             ("signal / signal strength", "señal / potencia de señal"), ("outage", "caída del servicio"),
             ("installation / setup", "instalación / configuración"), ("troubleshooting", "diagnóstico de fallas"),
             ("work order / ticket", "orden de trabajo / ticket"), ("cabinet / box", "gabinete / caja"),
             ("pole / ladder", "poste / escalera"), ("wall jack / outlet", "toma de pared"), ("drill", "taladro"),
             ("cable tester / power meter", "probador / medidor de potencia"), ("bandwidth / speed", "ancho de banda / velocidad"),
             ("password / network name", "contraseña / nombre de red"), ("reboot / reset", "reiniciar / restablecer"),
             ("damaged / broken / loose", "dañado / roto / flojo"), ("safety gear / harness", "equipo de seguridad / arnés"),
             ("helmet / gloves", "casco / guantes"), ("the field / on site", "en campo / en sitio"),
             ("customer premises", "domicilio del cliente"), ("downtime", "tiempo sin servicio")])
st.append(H3("Con el cliente (llegar, explicar, terminar)"))
st += phrases([
    ("Good morning, I'm the technician from [company].", "gud mórning, áim de teknishan from...", "Buenos días, soy el técnico de [empresa]."),
    ("I'm here to install your internet service.", "áim jíer tu instól iór ínternet sérvis", "Vengo a instalar su servicio de internet."),
    ("I'm here to check the problem with your connection.", "áim jíer tu chek de próblem uiz iór konékshon", "Vengo a revisar el problema con su conexión."),
    ("Can you show me where the modem is?", "kan iú shou mi uér de móudem is?", "¿Me muestra dónde está el módem?"),
    ("What is the problem exactly?", "uát is de próblem eksáktli?", "¿Cuál es el problema exactamente?"),
    ("When did the problem start?", "uén did de próblem start?", "¿Cuándo empezó el problema?"),
    ("I need to drill a small hole here. Is that okay?", "ái nid tu dril a smol jóul jíer. is dat okéi?", "Necesito hacer un hoyito aquí. ¿Está bien?"),
    ("It will take about one hour.", "it uil téik abáut uan áuer", "Tardará más o menos una hora."),
    ("The cable was damaged. I replaced it.", "de kéibol uas dámeyd. ái ripléist it", "El cable estaba dañado. Lo cambié."),
    ("Everything is working now.", "évrizing is uórking náu", "Ya todo funciona."),
    ("This is your Wi-Fi name and password.", "dis is iór uái-fai néim end pásuord", "Este es su nombre de Wi-Fi y contraseña."),
    ("If you have any problem, please call customer service.", "if iú jav éni próblem, plis col cástomer sérvis", "Si tiene algún problema, llame a servicio al cliente."),
    ("Can you sign here, please?", "kan iú sáin jíer, plis?", "¿Puede firmar aquí, por favor?"),
])
st.append(H3("Con el supervisor y los compañeros"))
st += phrases([
    ("I finished the job at [address].", "ái fínisht de yob at...", "Terminé el trabajo en [dirección]."),
    ("I need more cable / another connector.", "ái nid mor kéibol / anóder konéktor", "Necesito más cable / otro conector."),
    ("The customer wasn't home.", "de cástomer uásent jóum", "El cliente no estaba en casa."),
    ("There's no signal at the box.", "ders nou sígnal at de box", "No hay señal en la caja."),
    ("I think the problem is in the main line.", "ái zink de próblem is in de méin láin", "Creo que el problema está en la línea principal."),
    ("I'm on my way. / I'm running late.", "áim on mái uéi / áim rániŋ léit", "Voy en camino. / Voy con retraso."),
    ("Can you help me with this? / Can you show me how?", "kan iú jelp mi uiz dis? / ... shou mi jáu?", "¿Me ayudas con esto? / ¿Me enseñas cómo?"),
    ("Sorry, can you say that again more slowly?", "sóri, kan iú séi dat aguén mor slóuli?", "Perdón, ¿lo repites más despacio?"),
    ("Be careful! / Watch out!", "bi kérful / uách áut", "¡Ten cuidado! / ¡Cuidado!"),
])
st.append(dialog("una visita técnica", [
    ("Customer", "Hi! The internet has been down since yesterday.", "¡Hola! El internet no funciona desde ayer."),
    ("Tech", "Good morning. I'm sorry about that. Can I see the modem, please?", "Buenos días. Lo siento. ¿Puedo ver el módem?"),
    ("Customer", "Sure, it's in the living room.", "Claro, está en la sala."),
    ("Tech", "The red light is on. I'm going to check the cable outside.", "La luz roja está prendida. Voy a revisar el cable afuera."),
    ("Tech", "The connector was loose. I fixed it. Can you check your phone now?", "El conector estaba flojo. Lo arreglé. ¿Puede revisar su teléfono ahora?"),
    ("Customer", "Yes! It's working. Thank you so much!", "¡Sí! Ya funciona. ¡Muchas gracias!"),
    ("Tech", "You're welcome. Please sign here. Have a nice day!", "De nada. Por favor firme aquí. ¡Que tenga buen día!"),
]))
st.append(tip("Prepara una «tarjeta de bolsillo» (o nota en el celular) con tus 10 frases de cliente más usadas. Léela en el carro antes de cada visita. En un mes las dirás de memoria. También practica decir números de teléfono, direcciones y números de serie en voz alta: es lo que más se usa en campo.", "★ Tip para el técnico"))
st.append(PageBreak())

# ---------------------------------------------------------------- 6B. Reservaciones
st += H1("Inglés para el trabajo", "B. Agente de reservaciones (para ella)")
st.append(RP("Las reservaciones siguen un guion bastante repetitivo. Esa es una gran ventaja: si dominas el guion, dominas el 80% de tus llamadas. Aquí hay frases útiles para hotel, aerolínea, tours o alquiler de autos; adapta las que correspondan a tu empresa."))
st.append(H3("Vocabulario"))
st += vocab([("booking / reservation", "reserva"), ("availability", "disponibilidad"), ("to book", "reservar"),
             ("confirmation number", "número de confirmación"), ("check-in / check-out", "entrada / salida"),
             ("arrival / departure", "llegada / salida"), ("rate / price per night", "tarifa / precio por noche"),
             ("deposit", "depósito"), ("cancellation policy", "política de cancelación"), ("refund", "reembolso"),
             ("fully booked / sold out", "lleno / agotado"), ("single / double room", "habitación sencilla / doble"),
             ("ocean view", "vista al mar"), ("guest", "huésped"), ("adults / children", "adultos / niños"),
             ("flight number", "número de vuelo"), ("round trip / one way", "ida y vuelta / solo ida"),
             ("upgrade", "mejora de categoría"), ("special request", "solicitud especial"), ("taxes and fees", "impuestos y cargos"),
             ("to hold / on hold", "esperar / en espera"), ("to transfer a call", "transferir una llamada")])
st.append(H3("El guion de una llamada"))
st += phrases([
    ("Thank you for calling [company], this is [name]. How may I help you?", "zenk iú for cóling..., dis is... jáu mei ái jelp iú?", "Gracias por llamar a [empresa], habla [nombre]. ¿En qué puedo ayudarle?"),
    ("I'd be happy to help you with that.", "áid bi jápi tu jelp iú uiz dat", "Con gusto le ayudo con eso."),
    ("May I have your full name, please?", "méi ái jav iór ful néim, plis?", "¿Me da su nombre completo, por favor?"),
    ("Could you spell that for me, please?", "kud iú spel dat for mi, plis?", "¿Me lo podría deletrear?"),
    ("What dates are you looking for?", "uát déits ar iú lúking for?", "¿Qué fechas busca?"),
    ("How many guests will be staying?", "jáu méni guests uil bi stéiing?", "¿Cuántos huéspedes se hospedarán?"),
    ("Let me check the availability for you.", "let mi chek de aveilabíliti for iú", "Permítame revisar la disponibilidad."),
    ("Could you hold for a moment, please?", "kud iú jóuld for a móument, plis?", "¿Puede esperar un momento, por favor?"),
    ("Thank you for holding.", "zenk iú for jóulding", "Gracias por esperar."),
    ("We have a double room available for those dates.", "uí jav a dábel rum avéilabol for dóus déits", "Tenemos una habitación doble disponible para esas fechas."),
    ("The rate is 180 dollars per night, plus taxes.", "de réit is uán-éiti dólars per náit, plas táxes", "La tarifa es 180 dólares por noche, más impuestos."),
    ("Would you like me to book it for you?", "uud iú láik mi tu buk it for iú?", "¿Desea que se la reserve?"),
    ("Your confirmation number is ...", "iór konferméishon námber is...", "Su número de confirmación es ..."),
    ("You will receive a confirmation email shortly.", "iú uil risív a konferméishon ímeil shórtli", "Recibirá un correo de confirmación en breve."),
    ("Is there anything else I can help you with?", "is der énizing els ái kan jelp iú uiz?", "¿Hay algo más en que pueda ayudarle?"),
    ("Thank you for choosing us. Have a great day!", "zenk iú for chúsing as. jav a gréit déi", "Gracias por elegirnos. ¡Que tenga un gran día!"),
])
st.append(H3("Cuando no entiendes o hay un problema"))
st += phrases([
    ("I'm sorry, the line is not clear. Could you repeat that?", "áim sóri, de láin is not clíer...", "Disculpe, la línea no está clara. ¿Puede repetir?"),
    ("Just to confirm, that's March 15th to the 20th?", "yast tu konférm, dats march fiftínz tu de tuéntiez?", "Para confirmar, ¿del 15 al 20 de marzo?"),
    ("I apologize for the inconvenience.", "ái apóloyais for de inconvíniens", "Le pido disculpas por el inconveniente."),
    ("Unfortunately, we are fully booked on those dates.", "anfórchunetli, uí ar fúli bukt...", "Lamentablemente estamos llenos esas fechas."),
    ("I can offer you an alternative.", "ái kan ófer iú an oltérnativ", "Le puedo ofrecer una alternativa."),
    ("Let me transfer you to my supervisor.", "let mi transfér iú tu mái supervaisor", "Le transfiero con mi supervisor(a)."),
    ("There is a cancellation fee of ...", "der is a canseléishon fi of...", "Hay un cargo por cancelación de ..."),
])
st.append(H3("Correos electrónicos: frases listas"))
st += bullets([
    "<b>Saludo:</b> <i>Dear Mr. / Ms. [Apellido],</i> — <i>Thank you for your email.</i>",
    "<b>Confirmar:</b> <i>I am pleased to confirm your reservation for [dates].</i>",
    "<b>Adjuntar:</b> <i>Please find attached your booking confirmation.</i>",
    "<b>Pedir información:</b> <i>Could you please send us your flight details?</i>",
    "<b>Disculpa:</b> <i>We apologize for any inconvenience this may cause.</i>",
    "<b>Cierre:</b> <i>Please do not hesitate to contact us if you have any questions. We look forward to welcoming you. Kind regards, [Nombre]</i>",
])
st.append(dialog("una reserva por teléfono", [
    ("Agent", "Thank you for calling. This is Ana. How may I help you?", "Gracias por llamar. Habla Ana. ¿En qué puedo ayudarle?"),
    ("Caller", "Hi, I'd like to book a room for next weekend.", "Hola, quisiera reservar una habitación para el próximo fin de semana."),
    ("Agent", "Of course. What are your arrival and departure dates?", "Claro. ¿Cuáles son sus fechas de llegada y salida?"),
    ("Caller", "Arriving Friday the 20th, leaving Sunday the 22nd.", "Llego el viernes 20, salgo el domingo 22."),
    ("Agent", "Let me check... Yes, we have an ocean-view room at 210 dollars per night. Would you like to book it?", "Déjeme revisar... Sí, tenemos una con vista al mar a 210 dólares la noche. ¿Desea reservarla?"),
    ("Caller", "Yes, please.", "Sí, por favor."),
    ("Agent", "May I have your full name? Could you spell your last name, please?", "¿Su nombre completo? ¿Podría deletrear su apellido?"),
    ("Caller", "Smith. S-M-I-T-H.", "Smith. S-M-I-T-H."),
    ("Agent", "Thank you, Mr. Smith. Your confirmation number is A-7-4-2-9.", "Gracias, Sr. Smith. Su número de confirmación es A-7-4-2-9."),
]))
st.append(tip("Escribe tu guion completo de llamada en una hoja y tenlo junto a la computadora. Practica con tu esposo en casa: él hace de cliente (¡y que a veces sea un cliente difícil!). Graba tu voz en el celular diciendo el saludo de bienvenida y compárala con la de una compañera nativa.", "★ Tip para la agente"))
st.append(PageBreak())

# ---------------------------------------------------------------- 7. Ejercicios
st += H1("Parte 6 · Ejercicios para practicar", "Háganlos con lápiz; las respuestas están al final")
st.append(exercise("Ejercicio 1 · Completa con am / is / are", [
    "I ______ a technician.", "She ______ at work now.", "We ______ from Colombia.",
    "The store ______ closed on Sunday.", "______ you busy?", "My husband and I ______ new in Aruba."]))
st.append(exercise("Ejercicio 2 · Traduce al inglés", [
    "¿Cuánto cuesta esto?", "No entiendo. ¿Puede hablar despacio?", "Quisiera abrir una cuenta bancaria.",
    "El internet no funciona desde ayer.", "Permítame revisar la disponibilidad.", "Tengo dolor de cabeza."]))
st.append(exercise("Ejercicio 3 · Pasado simple: escribe el pasado", [
    "go → ______", "buy → ______", "work → ______", "pay → ______", "have → ______", "call → ______", "fix → ______", "book → ______"]))
st.append(exercise("Ejercicio 4 · Ordena las palabras", [
    "you / help / How / I / may / ?", "the / Where / rice / is / ?", "card / pay / I / Can / with / ?",
    "number / Your / confirmation / is / B-325", "cable / damaged / The / was"]))
st.append(exercise("Ejercicio 5 · ¿Qué dirías? (situaciones)", [
    "Estás en la caja y quieres saber si aceptan dólares.",
    "Llegas a casa de un cliente para instalar internet. Preséntate.",
    "Un cliente te llama y no entendiste su apellido.",
    "Tu vecino te saluda por primera vez.",
    "Tienes que decirle al casero que el aire acondicionado no funciona."]))
st.append(exercise("Ejercicio 6 · Deletrea en voz alta (en pareja)", [
    "Tu nombre completo y apellidos.", "Tu correo electrónico (con «at» y «dot»).",
    "Tu número de teléfono, número por número.", "Tu dirección en Aruba.",
    "Un número de confirmación inventado: K7-Q2-J9-G4 (¡cuidado con G y J!)."],
    "Uno deletrea y el otro escribe. Después cambien de rol y comparen."))
st.append(PageBreak())

st += H1("Juegos y role-plays en pareja", "La práctica más divertida y la que más resultados da")
st.append(H2("Role-plays (10 minutos cada uno)"))
st.append(RP("Uno hace de cliente/empleado y el otro de ustedes mismos. Usen las frases de esta guía. Luego cambien de rol. La segunda vez, intenten hacerlo <b>sin mirar la guía</b>."))
rp = [
    ("Supermercado", "Uno es el cajero, el otro compra 5 productos. Pregunten precios, paguen y pidan el recibo."),
    ("Técnico en casa", "Ella es una clienta molesta porque no tiene internet; él llega, pregunta, revisa y explica la solución."),
    ("Llamada de reserva", "Él llama para reservar un hotel de 3 noches para 2 adultos y 1 niño; ella sigue el guion completo."),
    ("Cliente difícil", "Él llama para cancelar una reserva y pide reembolso; ella explica la política de cancelación con cortesía."),
    ("Nuevos vecinos", "Preséntense, digan de dónde son, a qué se dedican y pidan una recomendación de playa."),
    ("En el médico", "Uno es el doctor; el otro describe síntomas: desde cuándo, dónde duele, alergias."),
    ("Llamada de emergencia", "Practiquen decir al 911 qué pasó y su dirección completa, claro y despacio."),
]
data = [[Paragraph("Escenario", S["cellh"]), Paragraph("Instrucciones", S["cellh"])]]
for a, b in rp: data.append([Paragraph(a, S["cellb"]), Paragraph(b, S["cell"])])
t = Table(data, colWidths=[W * 0.24, W * 0.76])
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                       ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
st += [t, Spacer(1, 10)]
st.append(H2("Juegos rápidos"))
st += bullets([
    "<b>«What's this?»</b> — Uno señala un objeto de la casa; el otro tiene 3 segundos para decir el nombre en inglés. Punto por respuesta correcta.",
    "<b>20 preguntas</b> — Uno piensa en un objeto; el otro adivina solo con preguntas de sí/no en inglés: <i>«Is it in the kitchen? Is it big?»</i>",
    "<b>El día al revés</b> — Cuenten su día del final al principio, en pasado.",
    "<b>Dictado de compras</b> — Uno dicta la lista del súper en inglés y el otro la escribe sin ver.",
    "<b>La palabra del día</b> — Cada mañana uno elige una palabra nueva. Quien la use más veces en el día gana (el perdedor lava los platos 😉).",
    "<b>Noticias de 1 minuto</b> — Cada uno cuenta en inglés algo que pasó en su trabajo. El otro hace dos preguntas.",
])
st.append(PageBreak())

# ---------------------------------------------------------------- 8. Plan 12 semanas
st += H1("Parte 7 · Plan de 12 semanas", "Una meta clara por semana")
plan = [
    ("1", "Supervivencia", "Frases de supervivencia + saludos. Cambiar el teléfono a inglés. Etiquetar la casa."),
    ("2", "Pronunciación y alfabeto", "Alfabeto y código fonético. Deletrear nombres, correos y teléfonos."),
    ("3", "Supermercado", "Vocabulario de comida. Lista de compras en inglés. Ir y pagar hablando solo inglés."),
    ("4", "Casa y rutina", "Presente simple. Juego «Three things» en cada cena. Primera «hora en inglés»."),
    ("5", "Trabajo I", "Cada uno memoriza sus 15 frases de trabajo más importantes."),
    ("6", "Pasado simple", "Verbos irregulares. Contar el día en pasado. Role-play de vecinos."),
    ("7", "Trabajo II", "Diálogos completos: visita técnica y llamada de reserva. Grabarse y escucharse."),
    ("8", "Trámites y salud", "Banco, médico, farmacia, emergencias. Escribir la frase del 911 y pegarla en la nevera."),
    ("9", "Futuro y cortesía", "going to / will / could / would. Correos de trabajo con frases listas."),
    ("10", "Escuchar", "Un episodio de serie a la semana con subtítulos en inglés. Shadowing 5 min/día."),
    ("11", "Clientes difíciles", "Quejas, disculpas, alternativas, cancelaciones. Role-play de «cliente difícil»."),
    ("12", "Repaso y celebración", "Repetir todos los ejercicios sin mirar. Salir a cenar y pedir todo en inglés. ¡Celebrar!"),
]
data = [[Paragraph(h, S["cellh"]) for h in ("Sem.", "Tema", "Qué hacer", "✓")]]
for a, b, c in plan: data.append([Paragraph(f"<b>{a}</b>", S["cell"]), Paragraph(b, S["cellb"]), Paragraph(c, S["cell"]), "☐"])
t = Table(data, colWidths=[W * 0.07, W * 0.22, W * 0.63, W * 0.08], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                       ("GRID", (0, 0), (-1, -1), 0.4, LINE), ("ALIGN", (3, 1), (3, -1), "CENTER"),
                       ("FONTNAME", (3, 1), (3, -1), "DV"), ("FONTSIZE", (3, 1), (3, -1), 12),
                       ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
st += [t, Spacer(1, 12)]
st.append(H2("Hoja de seguimiento semanal"))
st.append(RP("Imprímanla (o cópienla en el cuaderno) y marquen cada día lo que hicieron. Una para cada uno."))
st += checkgrid(["15 min de estudio con la guía", "Hora en inglés en casa", "Juego «Three things» en la cena",
                 "5 min de shadowing / audio", "1 frase nueva anotada en el cuaderno", "Usé inglés en el trabajo / la calle"],
                ("Actividad", "L", "M", "M", "J", "V", "S", "D"))
st.append(box([P("Escriban aquí 3 frases que quieren poder decir con confianza dentro de 3 meses:"),
               P("1. ____________________________________________________________"),
               P("2. ____________________________________________________________"),
               P("3. ____________________________________________________________")], TEAL_L, TEAL, "Nuestra meta"))
st.append(PageBreak())

# ---------------------------------------------------------------- 9. Respuestas
st += H1("Respuestas de los ejercicios", "Revisen juntos y repitan en voz alta las que fallaron")
ans = [
    ("Ejercicio 1", "1. am · 2. is · 3. are · 4. is · 5. Are · 6. are"),
    ("Ejercicio 2", "1. How much is this? · 2. I don't understand. Can you speak slowly, please? · 3. I'd like to open a bank account. · 4. The internet hasn't worked since yesterday. / The internet has been down since yesterday. · 5. Let me check the availability. · 6. I have a headache."),
    ("Ejercicio 3", "went · bought · worked · paid · had · called · fixed · booked"),
    ("Ejercicio 4", "1. How may I help you? · 2. Where is the rice? · 3. Can I pay with card? · 4. Your confirmation number is B-325. · 5. The cable was damaged."),
    ("Ejercicio 5", "(Respuestas posibles) 1. Do you accept US dollars? · 2. Good morning, I'm the technician from [company]. I'm here to install your internet. · 3. I'm sorry, could you spell your last name, please? · 4. Hi! Nice to meet you. I'm [name]. We just moved in. · 5. Hi, the AC is not working. When can you come to fix it?"),
    ("Ejercicio 6", "Respuesta libre. Revisen especialmente: E («i») / I («ai»), G («dyi») / J («dyei»), @ = «at», . = «dot». K7-Q2-J9-G4 = «kei-seven, kiu-tu, dyei-náin, dyi-for»."),
]
data = [[Paragraph(a, S["cellb"]), Paragraph(b, S["cell"])] for a, b in ans]
t = Table(data, colWidths=[W * 0.18, W * 0.82])
t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
                       ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
st += [t, Spacer(1, 16)]
st.append(box([P("Aprender un idioma de adulto, en un país nuevo y trabajando, es difícil, y ustedes lo están haciendo juntos. Habrá días en que sientan que no avanzan: es normal. Sigan con los 15 minutos diarios, hablen aunque sea con errores, y en unos meses se van a sorprender de todo lo que entienden y dicen."),
               P("<b>You can do it! — ¡Ustedes pueden! — Boso por! 🌴</b>".replace(" 🌴", ""))], CORAL_L, CORAL, "♥ Un último consejo"))

import json
json.dump({"rec":REC,"tips":tips,"pron":pron,"plan":plan,"rp":rp,"ans":ans}, open("/home/claude/data.json","w"), ensure_ascii=False)
doc.build(st)
print("ok")
