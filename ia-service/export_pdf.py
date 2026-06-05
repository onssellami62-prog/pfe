"""
export_pdf.py — Rapport BI El Fatoora
Rapport analytique complet avec texte d'analyse
"""
import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, KeepTogether, PageBreak)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
import mysql.connector
from dotenv import load_dotenv
load_dotenv()

# ── Couleurs ─────────────────────────────────────────
BLUE  = colors.HexColor('#2196f3')
DBLUE = colors.HexColor('#1565c0')
GREEN = colors.HexColor('#00b894')
RED   = colors.HexColor('#e74c3c')
ORNG  = colors.HexColor('#e67e22')
PRP   = colors.HexColor('#9b59b6')
GREY  = colors.HexColor('#636e72')
LGREY = colors.HexColor('#f5f7fa')
BK    = colors.HexColor('#2d3436')
W     = colors.white

# ── DB ───────────────────────────────────────────────
def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST","localhost"),
        port=int(os.getenv("DB_PORT",3306)),
        database=os.getenv("DB_NAME","efacturation_db"),
        user=os.getenv("DB_USER","pfe"),
        password=os.getenv("DB_PASSWORD",""),
        auth_plugin='caching_sha2_password')

def qry(sql, params=None):
    try:
        db=get_db(); cur=db.cursor(dictionary=True)
        cur.execute(sql, params or [])
        r=cur.fetchall(); cur.close(); db.close(); return r
    except Exception as e:
        print(f"DB: {e}"); return []

def fmtk(v):
    v=float(v or 0)
    return f"{v/1e6:.2f}M" if v>=1e6 else f"{v/1e3:.1f}k" if v>=1e3 else f"{v:.0f}"
def fmt3(v): return f"{float(v or 0):,.3f}".replace(',',' ')
def pct(a,b): return round(float(a)/float(b)*100,1) if b else 0

MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin',
        'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
MOIS_C = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

# ── Fetch ────────────────────────────────────────────
def get_data(periode='tout'):
    mp={'7j':'7 DAY','30j':'30 DAY','90j':'90 DAY',
        '6mois':'6 MONTH','1an':'1 YEAR'}
    w = f"WHERE f.DateFacture >= DATE_SUB(NOW(), INTERVAL {mp[periode]})" \
        if periode in mp else ""
    wa = w + (" AND" if w else "WHERE") + " f.Statut='AcceptéeTTN'"

    k = qry(f"""SELECT COUNT(*) total,
        SUM(CASE WHEN Statut='AcceptéeTTN' THEN 1 ELSE 0 END) val,
        SUM(CASE WHEN Statut='Brouillon'   THEN 1 ELSE 0 END) brou,
        SUM(CASE WHEN Statut='Rejetée'     THEN 1 ELSE 0 END) rej,
        SUM(CASE WHEN Statut='AcceptéeTTN' THEN TotalHT    ELSE 0 END) ca,
        SUM(CASE WHEN Statut='AcceptéeTTN' THEN TotalTVA   ELSE 0 END) tva,
        SUM(CASE WHEN Statut='AcceptéeTTN' THEN MontantTimbre ELSE 0 END) timbre,
        AVG(CASE WHEN Statut='AcceptéeTTN' THEN MontantTTC ELSE NULL END) panier
        FROM factures f {w}""")
    k = {key:float(val or 0) for key,val in (k[0] if k else {}).items()} if k else {}

    clients = qry(f"""SELECT t.Nom cl,COUNT(f.NumeroFacture) nb,
        SUM(f.TotalHT) ca, MAX(f.DateFacture) last_d
        FROM factures f JOIN tiers t ON f.TiersId=t.Id {wa}
        GROUP BY t.Id,t.Nom ORDER BY ca DESC LIMIT 5""")

    produits = qry(f"""SELECT p.Nom pr,SUM(lf.Quantite) qte,
        SUM(lf.MontantHT) ca,AVG(lf.PrixUnitaire) pu,
        COUNT(DISTINCT f.TiersId) nb_cl
        FROM lignefactures lf JOIN produits p ON lf.ProduitId=p.Id
        JOIN factures f ON lf.NumeroFacture=f.NumeroFacture {wa.replace('f.Statut','f.Statut')}
        GROUP BY p.Id,p.Nom ORDER BY ca DESC LIMIT 5""")

    evo = qry(f"""SELECT YEAR(f.DateFacture) an,MONTH(f.DateFacture) mo,
        SUM(f.TotalHT) ca,COUNT(*) nb,SUM(f.TotalTVA) tva
        FROM factures f {wa} GROUP BY an,mo ORDER BY an,mo""")

    tva = qry(f"""SELECT lf.TauxTVA tx,SUM(lf.MontantHT) base,
        SUM(lf.MontantTVA) tva
        FROM lignefactures lf JOIN factures f ON lf.NumeroFacture=f.NumeroFacture
        {wa} GROUP BY lf.TauxTVA ORDER BY lf.TauxTVA""")

    return k, clients, produits, evo, tva

# ── Analyse textuelle ────────────────────────────────
def analyse_perf(k, evo):
    ca=k.get('ca',0); tot=int(k.get('total',0))
    val=int(k.get('val',0)); rej=int(k.get('rej',0))
    brou=int(k.get('brou',0)); pan=k.get('panier',0)
    txv=pct(val,tot); txr=pct(rej,tot)

    # Tendance CA
    if len(evo)>=2:
        dernier=float(evo[-1]['ca'] or 0)
        avant=float(evo[-2]['ca'] or 0)
        var_ca=pct(dernier-avant,avant) if avant else 0
        mois_d=f"{MOIS_C[int(evo[-1]['mo'])-1]} {int(evo[-1]['an'])}"
        mois_av=f"{MOIS_C[int(evo[-2]['mo'])-1]} {int(evo[-2]['an'])}"
        if var_ca>0:
            tendance=f"Le CA du mois de {mois_d} s'établit à <b>{fmtk(dernier)} DT</b>, "\
                     f"en <b>hausse de {var_ca:.1f}%</b> par rapport à {mois_av} ({fmtk(avant)} DT). "\
                     f"Cette progression positive témoigne d'une dynamique commerciale favorable."
        elif var_ca<0:
            tendance=f"Le CA du mois de {mois_d} s'établit à <b>{fmtk(dernier)} DT</b>, "\
                     f"en <b>baisse de {abs(var_ca):.1f}%</b> par rapport à {mois_av} ({fmtk(avant)} DT). "\
                     f"Cette régression mérite une attention particulière et une analyse des causes."
        else:
            tendance=f"Le CA reste stable à <b>{fmtk(dernier)} DT</b> sur les deux derniers mois."
    else:
        tendance=f"Le chiffre d'affaires HT validé sur la période s'élève à <b>{fmtk(ca)} DT</b>."

    # Analyse validation
    if txv>=80:
        valid_txt=f"Le taux de validation TTN est <b>excellent à {txv}%</b>, dépassant l'objectif "\
                  f"réglementaire de 80%. Sur {tot} factures émises, {val} ont été acceptées par "\
                  f"la plateforme Tunisie TradeNet."
    elif txv>=60:
        valid_txt=f"Le taux de validation TTN est <b>satisfaisant à {txv}%</b>, mais reste "\
                  f"en dessous de l'objectif de 80%. Des efforts supplémentaires sont nécessaires "\
                  f"pour améliorer la conformité TEIF."
    else:
        valid_txt=f"Le taux de validation TTN est <b>insuffisant à {txv}%</b>, bien en dessous "\
                  f"de l'objectif de 80%. Une révision urgente des processus de facturation "\
                  f"et de la conformité TEIF s'impose."

    # Analyse rejet
    if rej==0:
        rej_txt="Aucune facture rejetée sur la période. La conformité TEIF est optimale."
    elif txr<=5:
        rej_txt=f"{rej} facture{'s' if rej>1 else ''} rejetée{'s' if rej>1 else ''} ({txr}%). "\
                f"Taux de rejet faible et maîtrisé."
    elif txr<=15:
        rej_txt=f"{rej} facture{'s' if rej>1 else ''} rejetée{'s' if rej>1 else ''} ({txr}%). "\
                f"Ce taux de rejet modéré nécessite une vérification des formats TEIF et "\
                f"des matricules fiscaux des destinataires."
    else:
        rej_txt=f"<b>Attention : {rej} factures rejetées ({txr}%)</b>. Ce taux élevé indique "\
                f"des problèmes structurels de conformité. Il est recommandé de revoir "\
                f"les contrôles avant soumission à TTN."

    # Brouillons
    if brou==0:
        brou_txt="Tous les brouillons ont été soumis. Aucun document en attente."
    else:
        brou_txt=f"{brou} brouillon{'s' if brou>1 else ''} non soumis {'sont' if brou>1 else 'est'} "\
                 f"en attente de signature électronique et d'envoi à TTN. "\
                 f"Ces documents représentent un CA potentiel non comptabilisé."

    return tendance, valid_txt, rej_txt, brou_txt

def analyse_clients(clients, ca_total):
    if not clients: return "Aucun client avec des factures validées sur la période."
    top=clients[0]
    ca_top=float(top['ca'] or 0)
    pct_top=pct(ca_top,ca_total)
    txt=f"Le portefeuille client est composé de <b>{len(clients)} clients actifs</b> "\
        f"avec des factures validées TTN. "\
        f"Le client principal est <b>{top['cl']}</b> qui représente "\
        f"<b>{pct_top:.1f}% du CA total</b> avec {fmtk(ca_top)} DT. "
    if pct_top>40:
        txt+=f"Cette concentration élevée ({pct_top:.1f}%) sur un seul client constitue "\
             f"un <b>risque de dépendance</b> à surveiller. "\
             f"Il est recommandé de diversifier le portefeuille client."
    elif pct_top>25:
        txt+=f"La concentration est modérée et acceptable, "\
             f"mais une diversification reste conseillée."
    else:
        txt+=f"Le portefeuille client est bien diversifié, "\
             f"avec une répartition équilibrée du CA."
    return txt

def analyse_produits(produits, ca_total):
    if not produits: return "Aucun produit avec des ventes validées sur la période."
    top=produits[0]
    ca_top=float(top['ca'] or 0)
    pct_top=pct(ca_top,ca_total)
    txt=f"Le catalogue actif comprend <b>{len(produits)} produits/services</b>. "\
        f"Le produit phare est <b>{top['pr']}</b> qui génère "\
        f"<b>{pct_top:.1f}% du CA</b> ({fmtk(ca_top)} DT). "
    if pct_top>50:
        txt+=f"La dépendance à ce produit unique ({pct_top:.1f}%) est <b>critique</b>. "\
             f"Le développement d'autres offres est fortement recommandé."
    else:
        txt+=f"La répartition du CA entre les produits est acceptable."
    return txt

# ── Build PDF ────────────────────────────────────────
def generate_pdf(periode='tout', client_id=None) -> bytes:
    k, clients, produits, evo, tva = get_data(periode)
    ca=k.get('ca',0); tva_t=k.get('tva',0); timb=k.get('timbre',0)
    tot=int(k.get('total',0)); val=int(k.get('val',0))
    brou=int(k.get('brou',0)); rej=int(k.get('rej',0))
    pan=k.get('panier',0)
    txv=pct(val,tot); txr=pct(rej,tot)

    tendance_txt,valid_txt,rej_txt,brou_txt = analyse_perf(k,evo)
    cl_txt   = analyse_clients(clients, ca)
    prod_txt = analyse_produits(produits, ca)

    periode_lbl = {'7j':'7 derniers jours','30j':'30 derniers jours',
        '90j':'3 derniers mois','6mois':'6 derniers mois',
        '1an':'Dernière année','tout':'Toute la période'}.get(periode,'Toute la période')

    buf = BytesIO()
    W_PAGE = A4[0] - 3*cm

    doc = SimpleDocTemplate(buf, pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.5*cm, bottomMargin=2*cm,
        title=f"Rapport BI El Fatoora — {periode_lbl}",
        author="El Fatoora Platform",
        subject="Tableau de bord BI — Facturation électronique Tunisie")

    # ── Styles texte ──────────────────────────────────
    def S(name,sz=10,bold=False,color=BK,align=TA_LEFT,sb=0,sa=4,leading=None):
        return ParagraphStyle(name, fontSize=sz,
            fontName='Helvetica-Bold' if bold else 'Helvetica',
            textColor=color, alignment=align,
            spaceBefore=sb, spaceAfter=sa,
            leading=leading or sz*1.4)

    TITLE   = S('ti',  20, True,  DBLUE, TA_LEFT,  0, 4)
    SUBTITLE= S('st',  10, False, GREY,  TA_LEFT,  0, 16)
    H1      = S('h1',  13, True,  DBLUE, TA_LEFT,  14, 5)
    H2      = S('h2',  11, True,  BK,    TA_LEFT,  10, 4)
    BODY    = S('bo',  9,  False, BK,    TA_JUSTIFY,0, 4, 13)
    BODY_L  = S('bl',  9,  False, BK,    TA_LEFT,   0, 4, 13)
    CAPTION = S('ca',  8,  False, GREY,  TA_LEFT,   0, 8)
    FOOTER  = S('ft',  7,  False, GREY,  TA_CENTER, 0, 0)
    TH_S    = S('th',  9,  True,  W,     TA_LEFT,   0, 0)
    TD_S    = S('td',  9,  False, BK,    TA_LEFT,   0, 0)
    TD_R    = S('tr',  9,  False, BK,    TA_RIGHT,  0, 0)
    TD_B    = S('tb',  9,  True,  BLUE,  TA_RIGHT,  0, 0)
    ALERT_R = S('ar',  9,  True,  RED,   TA_LEFT,   0, 0)
    ALERT_G = S('ag',  9,  True,  GREEN, TA_LEFT,   0, 0)
    ALERT_O = S('ao',  9,  True,  ORNG,  TA_LEFT,   0, 0)

    story = []

    # ════════════════════════════════════════════════
    #  PAGE DE GARDE
    # ════════════════════════════════════════════════
    story.append(Spacer(1, 1.5*cm))

    # Logo + titre
    logo_tbl = Table([[
        Paragraph('<b>EF</b>', ParagraphStyle('lg', fontSize=22,
            fontName='Helvetica-Bold', textColor=W,
            alignment=TA_CENTER, leading=28)),
        Paragraph(
            '<b>El Fatoora</b><br/>'
            '<font size="10" color="#636e72">Plateforme de Facturation Électronique Tunisienne</font>',
            ParagraphStyle('lt', fontSize=16, fontName='Helvetica-Bold',
                textColor=DBLUE, leading=22)),
    ]], colWidths=[1.4*cm, W_PAGE-1.4*cm])
    logo_tbl.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(0,0), DBLUE),
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
        ('TOPPADDING',   (0,0),(0,0), 8),
        ('BOTTOMPADDING',(0,0),(0,0), 8),
        ('LEFTPADDING',  (0,0),(0,0), 8),
        ('RIGHTPADDING', (0,0),(0,0), 8),
        ('LEFTPADDING',  (1,0),(1,0), 12),
    ]))
    story.append(logo_tbl)
    story.append(Spacer(1, 0.8*cm))
    story.append(HRFlowable(width=W_PAGE, thickness=2, color=DBLUE))
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("RAPPORT DE TABLEAU DE BORD", S('rp',14,True,GREY,TA_LEFT,0,2)))
    story.append(Paragraph("Analyse Financière & Conformité TTN", TITLE))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        f"Période d'analyse : <b>{periode_lbl}</b>  ·  "
        f"Date de génération : <b>{datetime.now().strftime('%d %B %Y à %H:%M')}</b>  ·  "
        f"Version TEIF : <b>v1.8.7</b>",
        SUBTITLE))

    story.append(HRFlowable(width=W_PAGE, thickness=0.5, color=colors.HexColor('#e8ecef')))
    story.append(Spacer(1, 0.6*cm))

    # Résumé exécutif (encadré)
    exec_txt = (
        f"Ce rapport présente une analyse complète de l'activité de facturation électronique "
        f"sur la période <b>{periode_lbl}</b>. "
        f"Il couvre les indicateurs de performance clés, la conformité à la plateforme "
        f"Tunisie TradeNet (TTN), l'analyse des clients et des produits, "
        f"ainsi que les recommandations pour optimiser le taux de validation TEIF."
    )
    exec_box = Table([[Paragraph(exec_txt, BODY)]],
        colWidths=[W_PAGE])
    exec_box.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), colors.HexColor('#ebf5fb')),
        ('LEFTPADDING',  (0,0),(-1,-1), 12),
        ('RIGHTPADDING', (0,0),(-1,-1), 12),
        ('TOPPADDING',   (0,0),(-1,-1), 10),
        ('BOTTOMPADDING',(0,0),(-1,-1), 10),
        ('LINEAFTER',    (0,0),(0,-1),  4, DBLUE),
        ('BOX',          (0,0),(-1,-1), 0.5, colors.HexColor('#aed6f1')),
    ]))
    story.append(exec_box)
    story.append(Spacer(1, 0.8*cm))

    # Table des matières simple
    toc_data = [
        ['1.', 'Indicateurs de Performance (KPIs)'],
        ['2.', 'Analyse de la Conformité TTN'],
        ['3.', 'Évolution du Chiffre d\'Affaires'],
        ['4.', 'Analyse Fiscale et TVA'],
        ['5.', 'Analyse du Portefeuille Client'],
        ['6.', 'Analyse des Produits & Services'],
        ['7.', 'Recommandations & Actions'],
    ]
    story.append(Paragraph("Table des Matières", H1))
    for num, titre in toc_data:
        story.append(Paragraph(
            f'<font color="#2196f3"><b>{num}</b></font>  {titre}',
            S('toc', 9, False, BK, TA_LEFT, 0, 3)))
    story.append(Spacer(1, 0.3*cm))
    story.append(HRFlowable(width=W_PAGE, thickness=0.5, color=colors.HexColor('#e8ecef')))

    story.append(PageBreak())

    # ════════════════════════════════════════════════
    #  1. KPIs
    # ════════════════════════════════════════════════
    story.append(Paragraph("1. Indicateurs de Performance (KPIs)", H1))
    story.append(Paragraph(
        f"Les indicateurs suivants synthétisent l'activité de facturation "
        f"sur la période <b>{periode_lbl}</b>.",
        BODY))
    story.append(Spacer(1, 0.3*cm))

    def kpi_row(label, value, comment, color):
        return [
            Paragraph(label, ParagraphStyle('kl',fontSize=8,fontName='Helvetica',
                textColor=GREY,leading=10)),
            Paragraph(f'<b>{value}</b>', ParagraphStyle('kv',fontSize=13,
                fontName='Helvetica-Bold',textColor=color,leading=16)),
            Paragraph(comment, ParagraphStyle('kc',fontSize=8,fontName='Helvetica',
                textColor=BK,leading=11)),
        ]

    kpi_data = [
        [Paragraph('INDICATEUR', TH_S), Paragraph('VALEUR', TH_S), Paragraph('DÉTAIL', TH_S)],
        kpi_row('CA HT Validé TTN', f"{fmtk(ca)} DT",
                f"Montant exact : {fmt3(ca)} DT — Chiffre d'affaires hors taxe des factures acceptées par TTN", BLUE),
        kpi_row('Nombre total de factures', str(tot),
                f"Dont {val} validées · {brou} brouillons · {rej} rejetées", BK),
        kpi_row('Taux de validation TTN', f"{txv}%",
                f"Objectif réglementaire : 80% — {'✓ Atteint' if txv>=80 else '✗ Non atteint'}", GREEN if txv>=80 else RED),
        kpi_row('Taux de rejet TTN', f"{txr}%",
                f"{rej} facture{'s' if rej>1 else ''} rejetée{'s' if rej>1 else ''} — {'Faible' if txr<=5 else 'Modéré' if txr<=15 else 'Élevé'}", GREEN if txr<=5 else ORNG if txr<=15 else RED),
        kpi_row('Panier moyen (TTC)', f"{fmtk(pan)} DT",
                f"Valeur moyenne par facture acceptée", PRP),
        kpi_row('TVA collectée', f"{fmtk(tva_t)} DT",
                f"Montant total TVA sur factures AcceptéeTTN", ORNG),
        kpi_row('Net fiscal à payer', f"{fmt3(tva_t+timb)} DT",
                f"TVA ({fmt3(tva_t)}) + Timbre ({fmt3(timb)} DT)", RED),
    ]
    kpi_tbl = Table(kpi_data, colWidths=[W_PAGE*0.28, W_PAGE*0.20, W_PAGE*0.52])
    kpi_tbl.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,0), DBLUE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [W, LGREY]),
        ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#e8ecef')),
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
        ('TOPPADDING',   (0,0),(-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING',  (0,0),(-1,-1), 8),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
        ('LINEAFTER',    (0,0),(0,-1), 2, colors.HexColor('#e8ecef')),
    ]))
    story.append(kpi_tbl)
    story.append(Spacer(1, 0.8*cm))

    # ════════════════════════════════════════════════
    #  2. CONFORMITÉ TTN
    # ════════════════════════════════════════════════
    story.append(Paragraph("2. Analyse de la Conformité TTN", H1))
    story.append(Paragraph("2.1 Performance de Validation", H2))
    story.append(Paragraph(valid_txt, BODY))
    story.append(Spacer(1, 0.2*cm))

    story.append(Paragraph("2.2 Analyse des Rejets", H2))
    story.append(Paragraph(rej_txt, BODY))
    story.append(Spacer(1, 0.2*cm))

    story.append(Paragraph("2.3 Brouillons en Attente", H2))
    story.append(Paragraph(brou_txt, BODY))
    story.append(Spacer(1, 0.5*cm))

    # Tableau statuts
    st_data = [
        [Paragraph('STATUT', TH_S), Paragraph('NB FACTURES', TH_S),
         Paragraph('% DU TOTAL', TH_S), Paragraph('ACTION REQUISE', TH_S)],
        [Paragraph('✓ Acceptées TTN', ParagraphStyle('g',fontSize=9,fontName='Helvetica-Bold',textColor=GREEN)),
         Paragraph(str(val), TD_R),
         Paragraph(f"{txv}%", ParagraphStyle('gp',fontSize=9,fontName='Helvetica-Bold',textColor=GREEN,alignment=TA_RIGHT)),
         Paragraph('Aucune — Conformes TEIF', TD_S)],
        [Paragraph('⏳ Brouillons', ParagraphStyle('o',fontSize=9,fontName='Helvetica-Bold',textColor=ORNG)),
         Paragraph(str(brou), TD_R),
         Paragraph(f"{pct(brou,tot)}%", ParagraphStyle('op',fontSize=9,fontName='Helvetica-Bold',textColor=ORNG,alignment=TA_RIGHT)),
         Paragraph('Signer et envoyer à TTN', TD_S)],
        [Paragraph('✗ Rejetées', ParagraphStyle('r',fontSize=9,fontName='Helvetica-Bold',textColor=RED)),
         Paragraph(str(rej), TD_R),
         Paragraph(f"{txr}%", ParagraphStyle('rp',fontSize=9,fontName='Helvetica-Bold',textColor=RED,alignment=TA_RIGHT)),
         Paragraph('Corriger et re-soumettre', TD_S)],
        [Paragraph('TOTAL', TH_S), Paragraph(str(tot), ParagraphStyle('tt',fontSize=9,fontName='Helvetica-Bold',textColor=W,alignment=TA_RIGHT)),
         Paragraph('100%', ParagraphStyle('tp',fontSize=9,fontName='Helvetica-Bold',textColor=W,alignment=TA_RIGHT)),
         Paragraph('', TH_S)],
    ]
    st_tbl = Table(st_data, colWidths=[W_PAGE*0.25,W_PAGE*0.18,W_PAGE*0.18,W_PAGE*0.39])
    st_tbl.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,0), DBLUE),
        ('BACKGROUND',   (0,4),(-1,4), colors.HexColor('#2d3436')),
        ('ROWBACKGROUNDS',(0,1),(-1,3), [W, LGREY, W]),
        ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#e8ecef')),
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
        ('TOPPADDING',   (0,0),(-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING',  (0,0),(-1,-1), 8),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
    ]))
    story.append(st_tbl)
    story.append(Spacer(1, 0.8*cm))

    # ════════════════════════════════════════════════
    #  3. ÉVOLUTION CA
    # ════════════════════════════════════════════════
    story.append(Paragraph("3. Évolution du Chiffre d'Affaires", H1))
    story.append(Paragraph(tendance_txt, BODY))
    story.append(Spacer(1, 0.3*cm))

    if evo:
        evo_data = [[Paragraph(h, TH_S) for h in ['Période','CA HT (DT)','Nb Fac.','TVA (DT)','Variation']]]
        for i,r in enumerate(evo):
            lbl=f"{MOIS_C[int(r['mo'])-1]} {int(r['an'])}"
            ca_r=float(r['ca'] or 0)
            if i>0:
                ca_prev=float(evo[i-1]['ca'] or 0)
                var=pct(ca_r-ca_prev,ca_prev) if ca_prev else 0
                var_txt=f"{'▲' if var>=0 else '▼'} {abs(var):.1f}%"
                var_color=GREEN if var>=0 else RED
            else:
                var_txt="—"; var_color=GREY
            evo_data.append([
                Paragraph(lbl, TD_S),
                Paragraph(f"{ca_r:,.3f}", ParagraphStyle('er',fontSize=9,fontName='Helvetica-Bold',textColor=BLUE,alignment=TA_RIGHT)),
                Paragraph(str(int(r['nb'])), ParagraphStyle('ec',fontSize=9,textColor=BK,alignment=TA_RIGHT)),
                Paragraph(f"{float(r.get('tva',0) or 0):,.3f}", ParagraphStyle('et',fontSize=9,textColor=ORNG,alignment=TA_RIGHT)),
                Paragraph(var_txt, ParagraphStyle('ev',fontSize=9,fontName='Helvetica-Bold',textColor=var_color,alignment=TA_RIGHT)),
            ])
        evo_tbl = Table(evo_data, colWidths=[W_PAGE*0.22,W_PAGE*0.25,W_PAGE*0.13,W_PAGE*0.25,W_PAGE*0.15])
        evo_tbl.setStyle(TableStyle([
            ('BACKGROUND',   (0,0),(-1,0), DBLUE),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [W,LGREY]),
            ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#e8ecef')),
            ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',   (0,0),(-1,-1), 5),
            ('BOTTOMPADDING',(0,0),(-1,-1), 5),
            ('LEFTPADDING',  (0,0),(-1,-1), 7),
            ('RIGHTPADDING', (0,0),(-1,-1), 7),
        ]))
        story.append(evo_tbl)
    else:
        story.append(Paragraph("Aucune donnée d'évolution disponible pour cette période.", CAPTION))
    story.append(Spacer(1, 0.8*cm))

    # ════════════════════════════════════════════════
    #  4. FISCAL & TVA
    # ════════════════════════════════════════════════
    story.append(Paragraph("4. Analyse Fiscale et TVA", H1))
    story.append(Paragraph(
        f"Le montant total de TVA collectée s'élève à <b>{fmt3(tva_t)} DT</b> "
        f"et le timbre fiscal cumulé à <b>{fmt3(timb)} DT</b>, "
        f"soit un net fiscal à payer de <b>{fmt3(tva_t+timb)} DT</b>. "
        f"Ces montants concernent uniquement les factures ayant obtenu le statut "
        f"<i>AcceptéeTTN</i> sur la plateforme Tunisie TradeNet.",
        BODY))
    story.append(Spacer(1, 0.3*cm))

    if tva:
        tva_data = [[Paragraph(h, TH_S) for h in ['Taux TVA','Base HT (DT)','Montant TVA (DT)','% de la TVA totale']]]
        for r in tva:
            tva_r=float(r['tva'] or 0)
            tva_data.append([
                Paragraph(f"TVA {int(r['tx'])}%", TD_S),
                Paragraph(f"{float(r.get('base',0) or 0):,.3f}", TD_R),
                Paragraph(f"{tva_r:,.3f}", ParagraphStyle('tv',fontSize=9,fontName='Helvetica-Bold',textColor=PRP,alignment=TA_RIGHT)),
                Paragraph(f"{pct(tva_r,tva_t):.1f}%", ParagraphStyle('tp2',fontSize=9,textColor=GREY,alignment=TA_RIGHT)),
            ])
        tva_tbl = Table(tva_data, colWidths=[W_PAGE*0.22,W_PAGE*0.28,W_PAGE*0.28,W_PAGE*0.22])
        tva_tbl.setStyle(TableStyle([
            ('BACKGROUND',   (0,0),(-1,0), DBLUE),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [W,LGREY]),
            ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#e8ecef')),
            ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',   (0,0),(-1,-1), 5),
            ('BOTTOMPADDING',(0,0),(-1,-1), 5),
            ('LEFTPADDING',  (0,0),(-1,-1), 7),
            ('RIGHTPADDING', (0,0),(-1,-1), 7),
        ]))
        story.append(tva_tbl)
    story.append(Spacer(1, 0.8*cm))

    # ════════════════════════════════════════════════
    #  5. CLIENTS
    # ════════════════════════════════════════════════
    story.append(Paragraph("5. Analyse du Portefeuille Client", H1))
    story.append(Paragraph(cl_txt, BODY))
    story.append(Spacer(1, 0.3*cm))

    if clients:
        total_ca_cl = sum(float(r['ca'] or 0) for r in clients)
        cl_data = [[Paragraph(h, TH_S) for h in ['Rang','Client','Nb Fac.','CA HT (DT)','Dernière fact.','Part CA']]]
        for i,r in enumerate(clients):
            ca_r=float(r['ca'] or 0)
            cl_data.append([
                Paragraph(f"#{i+1}", ParagraphStyle('rk',fontSize=9,fontName='Helvetica-Bold',
                    textColor=[BLUE,GREEN,ORNG,RED,PRP][i%5],alignment=TA_CENTER)),
                Paragraph(str(r['cl'])[:25], TD_S),
                Paragraph(str(int(r['nb'])), ParagraphStyle('cn',fontSize=9,textColor=BK,alignment=TA_RIGHT)),
                Paragraph(f"{ca_r:,.3f}", ParagraphStyle('cc',fontSize=9,fontName='Helvetica-Bold',textColor=BLUE,alignment=TA_RIGHT)),
                Paragraph(str(r.get('last_d','—'))[:10] if r.get('last_d') else '—',
                    ParagraphStyle('cd',fontSize=8,textColor=GREY)),
                Paragraph(f"{pct(ca_r,total_ca_cl):.1f}%",
                    ParagraphStyle('cp',fontSize=9,fontName='Helvetica-Bold',textColor=GREEN,alignment=TA_RIGHT)),
            ])
        cl_tbl = Table(cl_data, colWidths=[1.0*cm,W_PAGE*0.33,1.2*cm,W_PAGE*0.22,2.0*cm,1.5*cm])
        cl_tbl.setStyle(TableStyle([
            ('BACKGROUND',   (0,0),(-1,0), DBLUE),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [W,LGREY]),
            ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#e8ecef')),
            ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',   (0,0),(-1,-1), 6),
            ('BOTTOMPADDING',(0,0),(-1,-1), 6),
            ('LEFTPADDING',  (0,0),(-1,-1), 7),
            ('RIGHTPADDING', (0,0),(-1,-1), 7),
        ]))
        story.append(cl_tbl)
    story.append(Spacer(1, 0.8*cm))

    # ════════════════════════════════════════════════
    #  6. PRODUITS
    # ════════════════════════════════════════════════
    story.append(Paragraph("6. Analyse des Produits & Services", H1))
    story.append(Paragraph(prod_txt, BODY))
    story.append(Spacer(1, 0.3*cm))

    if produits:
        total_ca_pr = sum(float(r['ca'] or 0) for r in produits)
        pr_data = [[Paragraph(h, TH_S) for h in ['Rang','Produit / Service','Qté','Prix Moy. (DT)','CA HT (DT)','Part CA']]]
        for i,r in enumerate(produits):
            ca_r=float(r['ca'] or 0)
            pr_data.append([
                Paragraph(f"#{i+1}", ParagraphStyle('rk2',fontSize=9,fontName='Helvetica-Bold',
                    textColor=[BLUE,GREEN,ORNG,RED,PRP][i%5],alignment=TA_CENTER)),
                Paragraph(str(r['pr'])[:25], TD_S),
                Paragraph(str(int(r['qte'])),
                    ParagraphStyle('pq',fontSize=9,textColor=BK,alignment=TA_RIGHT)),
                Paragraph(f"{float(r['pu'] or 0):,.3f}",
                    ParagraphStyle('pp',fontSize=9,textColor=ORNG,alignment=TA_RIGHT)),
                Paragraph(f"{ca_r:,.3f}",
                    ParagraphStyle('pc',fontSize=9,fontName='Helvetica-Bold',textColor=BLUE,alignment=TA_RIGHT)),
                Paragraph(f"{pct(ca_r,total_ca_pr):.1f}%",
                    ParagraphStyle('ppp',fontSize=9,fontName='Helvetica-Bold',textColor=GREEN,alignment=TA_RIGHT)),
            ])
        pr_tbl = Table(pr_data, colWidths=[1.0*cm,W_PAGE*0.35,1.2*cm,W_PAGE*0.2,W_PAGE*0.2,1.5*cm])
        pr_tbl.setStyle(TableStyle([
            ('BACKGROUND',   (0,0),(-1,0), DBLUE),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [W,LGREY]),
            ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#e8ecef')),
            ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',   (0,0),(-1,-1), 6),
            ('BOTTOMPADDING',(0,0),(-1,-1), 6),
            ('LEFTPADDING',  (0,0),(-1,-1), 7),
            ('RIGHTPADDING', (0,0),(-1,-1), 7),
        ]))
        story.append(pr_tbl)
    story.append(Spacer(1, 0.8*cm))

    # ════════════════════════════════════════════════
    #  7. RECOMMANDATIONS
    # ════════════════════════════════════════════════
    story.append(Paragraph("7. Recommandations & Actions Prioritaires", H1))

    recs = []
    if txv < 80:
        recs.append(('PRIORITÉ HAUTE', RED,
            f"Améliorer le taux de validation TTN ({txv}% → objectif 80%). "
            f"Vérifier la conformité TEIF : formats de matricule fiscal, "
            f"calcul TVA (0/7/13/19%), cohérence HT+TVA+Timbre=TTC."))
    if rej > 0:
        recs.append(('PRIORITÉ HAUTE', RED,
            f"Traiter les {rej} facture{'s' if rej>1 else ''} rejetée{'s' if rej>1 else ''} "
            f"avant la clôture du mois. Identifier les motifs de rejet sur la plateforme TTN "
            f"et corriger les anomalies TEIF identifiées."))
    if brou > 0:
        recs.append(('PRIORITÉ MOYENNE', ORNG,
            f"Signer et soumettre les {brou} brouillon{'s' if brou>1 else ''} en attente. "
            f"Ces documents représentent un CA non encore reconnu et une TVA non collectée."))
    if clients and pct(float(clients[0]['ca'] or 0), ca) > 40:
        recs.append(('RECOMMANDATION', BLUE,
            f"Diversifier le portefeuille client. Le client {clients[0]['cl']} "
            f"représente plus de 40% du CA, ce qui constitue un risque de dépendance."))
    if produits and pct(float(produits[0]['ca'] or 0), ca) > 50:
        recs.append(('RECOMMANDATION', BLUE,
            f"Développer de nouvelles offres. Le produit '{produits[0]['pr']}' "
            f"représente plus de 50% du CA."))
    recs.append(('BONNE PRATIQUE', GREEN,
        "Effectuer un contrôle TEIF automatique avant chaque soumission à TTN. "
        "Utiliser le module Anti-Fraude intégré (9 règles métier) pour prévenir "
        "les rejets et garantir la conformité réglementaire."))

    for niveau, clr, txt in recs:
        rec_row = Table([[
            Paragraph(niveau, ParagraphStyle('nv',fontSize=8,fontName='Helvetica-Bold',
                textColor=clr,leading=10)),
            Paragraph(txt, BODY_L),
        ]], colWidths=[2.8*cm, W_PAGE-2.8*cm])
        rec_row.setStyle(TableStyle([
            ('BACKGROUND',   (0,0),(0,0), colors.Color(clr.red,clr.green,clr.blue,0.08)),
            ('BACKGROUND',   (1,0),(1,0), W),
            ('BOX',          (0,0),(-1,-1), 0.5, colors.Color(clr.red,clr.green,clr.blue,0.3)),
            ('LINEAFTER',    (0,0),(0,0), 3, clr),
            ('VALIGN',       (0,0),(-1,-1), 'TOP'),
            ('TOPPADDING',   (0,0),(-1,-1), 7),
            ('BOTTOMPADDING',(0,0),(-1,-1), 7),
            ('LEFTPADDING',  (0,0),(-1,-1), 8),
            ('RIGHTPADDING', (0,0),(-1,-1), 8),
        ]))
        story.append(rec_row)
        story.append(Spacer(1, 0.2*cm))

    story.append(Spacer(1, 0.8*cm))

    # ════════════════════════════════════════════════
    #  FOOTER
    # ════════════════════════════════════════════════
    story.append(HRFlowable(width=W_PAGE, thickness=1, color=DBLUE))
    story.append(Spacer(1, 0.3*cm))
    footer_tbl = Table([[
        Paragraph('<b>El Fatoora</b> — Plateforme de Facturation Électronique',
            ParagraphStyle('fl',fontSize=8,fontName='Helvetica-Bold',textColor=DBLUE)),
        Paragraph(
            f'TEIF v1.8.7 · Tunisie TradeNet TTN · '
            f'Généré le {datetime.now().strftime("%d/%m/%Y")}',
            ParagraphStyle('fr',fontSize=7,textColor=GREY,alignment=TA_RIGHT)),
    ]], colWidths=[W_PAGE*0.55, W_PAGE*0.45])
    footer_tbl.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
    story.append(footer_tbl)

    def add_page_number(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFont('Helvetica', 7)
        canvas_obj.setFillColor(GREY)
        canvas_obj.drawRightString(
            A4[0]-1.5*cm, 1.0*cm,
            f"Page {doc_obj.page}")
        canvas_obj.restoreState()

    doc.build(story, onLaterPages=add_page_number, onFirstPage=add_page_number)
    return buf.getvalue()