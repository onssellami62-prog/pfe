"""
El Fatoora BI Dashboard — Power BI Style
Filtres connectés · Page unique dense · Drill-down
Port 8050
"""
import os, warnings
warnings.filterwarnings('ignore')
import dash
from dash import dcc, html, Input, Output, State, callback_context
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import mysql.connector, pandas as pd, numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

# ══════════════════════════════════════════════════════
#  DB
# ══════════════════════════════════════════════════════
def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST","localhost"),
        port=int(os.getenv("DB_PORT",3306)),
        database=os.getenv("DB_NAME","efacturation_db"),
        user=os.getenv("DB_USER","pfe"),
        password=os.getenv("DB_PASSWORD",""),
        auth_plugin='caching_sha2_password')

MOIS=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

def qry(sql, params=None):
    try:
        db=get_db(); cur=db.cursor(dictionary=True)
        cur.execute(sql, params or []); r=cur.fetchall()
        cur.close(); db.close(); return r
    except Exception as e:
        print(f"DB ERR: {e}"); return []

def fmtk(v):
    v=float(v or 0)
    return f"{v/1e6:.2f}M" if v>=1e6 else f"{v/1e3:.1f}k" if v>=1e3 else f"{v:.0f}"
def fmt3(v): return f"{float(v or 0):,.3f}".replace(',',' ')

# ══════════════════════════════════════════════════════
#  COULEURS
# ══════════════════════════════════════════════════════
BG='#f0f2f5'; CARD='#ffffff'
ACC='#2196f3'; GRN='#00b894'; ORG='#e67e22'
RED='#e74c3c'; PRP='#9b59b6'; CYN='#00cec9'
YLW='#f39c12'; TXT='#2d3436'; MUT='#636e72'
PAL=[ACC,GRN,ORG,RED,PRP,CYN,YLW,'#fd79a8','#6c5ce7','#a29bfe']

def make_fig(h=210,**kw):
    base=dict(paper_bgcolor='white',plot_bgcolor='#f8fafc',
        font=dict(family='Inter,sans-serif',color=TXT,size=11),
        height=h,autosize=True,
        margin=dict(l=50,r=20,t=35,b=40),
        xaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                   tickfont=dict(color=MUT,size=10),showgrid=True,zeroline=False,showline=True),
        yaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                   tickfont=dict(color=MUT,size=10),showgrid=True,zeroline=False,showline=True),
        showlegend=True,colorway=PAL,
        legend=dict(orientation='h',yanchor='bottom',y=1.02,xanchor='right',x=1,
                    bgcolor='rgba(0,0,0,0)',font=dict(size=11,color=TXT)))
    base.update(kw); return base

def G(fig,h='260px'):
    return dcc.Graph(figure=fig,
        config={'displayModeBar':False,'responsive':True},
        style={'width':'100%','height':h})

# ══════════════════════════════════════════════════════
#  BUILD SQL FILTERS
# ══════════════════════════════════════════════════════
def build_where(periode, d1, d2, cl, vi, ty, st, tv, mn, mx, alias='f', talias='t'):
    """
    Construit WHERE pour les données globales.
    Le filtre statut s'applique UNIQUEMENT si l'utilisateur l'a choisi.
    Les KPIs CA/TVA restent toujours sur AcceptéeTTN sauf si statut explicitement filtré.
    """
    clauses=[]; params=[]

    # Période
    if d1 and d2:
        clauses.append(f"{alias}.DateFacture BETWEEN %s AND %s")
        params+=[d1,d2]
    elif periode and periode!='tout':
        mp={'7j':'7 DAY','30j':'30 DAY','90j':'90 DAY','6mois':'6 MONTH','1an':'1 YEAR'}
        if periode in mp:
            clauses.append(f"{alias}.DateFacture >= DATE_SUB(NOW(), INTERVAL {mp[periode]})")

    # Client
    if cl and cl!='__all__':
        clauses.append(f"{alias}.TiersId=%s"); params.append(int(cl))

    # Gouvernorat
    if vi and vi!='__all__':
        clauses.append(f"{talias}.Ville=%s"); params.append(vi)

    # Type identifiant
    if ty and ty!='__all__':
        clauses.append(f"{talias}.TypeIdentifiant=%s"); params.append(ty)

    # Statut (filtre additionnel — ne remplace pas le filtre AcceptéeTTN des KPIs)
    if st and st!='__all__':
        if st=='avoir':
            clauses.append(f"{alias}.TypeDocument='I-14'")
        else:
            clauses.append(f"{alias}.Statut=%s"); params.append(st)

    # TVA
    if tv and tv!='__all__':
        clauses.append(f"EXISTS(SELECT 1 FROM lignefactures lf2 WHERE lf2.NumeroFacture={alias}.NumeroFacture AND lf2.TauxTVA=%s)")
        params.append(float(tv))

    # Montant
    if mn:
        try: clauses.append(f"{alias}.MontantTTC>=%s"); params.append(float(mn))
        except: pass
    if mx:
        try: clauses.append(f"{alias}.MontantTTC<=%s"); params.append(float(mx))
        except: pass

    where = "WHERE "+(" AND ".join(clauses)) if clauses else ""
    return where, params

# ══════════════════════════════════════════════════════
#  DATA FETCHERS (avec filtres)
# ══════════════════════════════════════════════════════
def fetch_kpis(w,p):
    r=qry(f"""SELECT COUNT(*) total,
        SUM(CASE WHEN f.Statut='AcceptéeTTN' THEN 1 ELSE 0 END) val,
        SUM(CASE WHEN f.Statut='Brouillon'   THEN 1 ELSE 0 END) brou,
        SUM(CASE WHEN f.Statut='Rejetée'     THEN 1 ELSE 0 END) rej,
        SUM(CASE WHEN f.Statut='AcceptéeTTN' THEN f.TotalHT    ELSE 0 END) ca,
        SUM(CASE WHEN f.Statut='AcceptéeTTN' THEN f.TotalTVA   ELSE 0 END) tva,
        SUM(CASE WHEN f.Statut='AcceptéeTTN' THEN f.MontantTimbre ELSE 0 END) timbre,
        AVG(CASE WHEN f.Statut='AcceptéeTTN' THEN f.MontantTTC ELSE NULL END) panier
        FROM factures f JOIN tiers t ON f.TiersId=t.Id {w}""", p)
    return {k:float(v or 0) for k,v in (r[0] if r else {}).items()} if r else {}

def fetch_evo(w,p):
    rows=qry(f"""SELECT YEAR(f.DateFacture) an,MONTH(f.DateFacture) mo,
        SUM(f.TotalHT) ca,SUM(f.MontantTTC) ttc,COUNT(*) nb,SUM(f.TotalTVA) tva
        FROM factures f JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY an,mo ORDER BY an,mo""", p)
    df=pd.DataFrame(rows)
    if not df.empty:
        df['label']=df.apply(lambda r:f"{MOIS[int(r.mo)-1]}",axis=1)
        for c in ['ca','ttc','tva']: df[c]=df[c].astype(float)
    return df

def fetch_clients(w,p,limit=8):
    rows=qry(f"""SELECT t.Nom cl,t.Id tid,COUNT(f.NumeroFacture) nb,
        SUM(f.TotalHT) ca,AVG(f.MontantTTC) pan,t.Ville vi
        FROM factures f JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY t.Id,t.Nom,t.Ville ORDER BY ca DESC LIMIT {limit}""", p)
    df=pd.DataFrame(rows)
    if not df.empty:
        for c in ['ca','pan']: df[c]=df[c].astype(float).round(3)
    return df

def fetch_produits(w,p,limit=8):
    rows=qry(f"""SELECT p.Nom pr,p.Id pid,SUM(lf.Quantite) qte,
        SUM(lf.MontantHT) ca,AVG(lf.PrixUnitaire) pu
        FROM lignefactures lf JOIN produits p ON lf.ProduitId=p.Id
        JOIN factures f ON lf.NumeroFacture=f.NumeroFacture
        JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY p.Id,p.Nom ORDER BY ca DESC LIMIT {limit}""", p)
    df=pd.DataFrame(rows)
    if not df.empty:
        for c in ['ca','pu']: df[c]=df[c].astype(float).round(3)
    return df

def fetch_tva(w,p):
    rows=qry(f"""SELECT lf.TauxTVA tx,SUM(lf.MontantHT) base,SUM(lf.MontantTVA) tva
        FROM lignefactures lf JOIN factures f ON lf.NumeroFacture=f.NumeroFacture
        JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY lf.TauxTVA ORDER BY lf.TauxTVA""", p)
    df=pd.DataFrame(rows)
    if not df.empty:
        for c in ['base','tva']: df[c]=df[c].astype(float)
    return df

def fetch_villes(w,p):
    rows=qry(f"""SELECT COALESCE(NULLIF(t.Ville,''),'Non renseigné') vi,
        SUM(f.TotalHT) ca,COUNT(*) nb,COUNT(DISTINCT t.Id) ncl
        FROM factures f JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY vi ORDER BY ca DESC LIMIT 10""", p)
    df=pd.DataFrame(rows)
    if not df.empty: df['ca']=df['ca'].astype(float)
    return df

def fetch_statuts_trend(w,p):
    """Évolution du taux de validation par mois"""
    rows=qry(f"""SELECT YEAR(f.DateFacture) an,MONTH(f.DateFacture) mo,
        SUM(CASE WHEN f.Statut='AcceptéeTTN' THEN 1 ELSE 0 END) val,
        SUM(CASE WHEN f.Statut='Rejetée' THEN 1 ELSE 0 END) rej,
        COUNT(*) tot
        FROM factures f JOIN tiers t ON f.TiersId=t.Id {w}
        GROUP BY an,mo ORDER BY an,mo""", p)
    df=pd.DataFrame(rows)
    if not df.empty:
        df['label']=df.apply(lambda r:f"{MOIS[int(r.mo)-1]}",axis=1)
        df['taux_val']=df.apply(lambda r: round(r['val']/r['tot']*100,1) if r['tot']>0 else 0,axis=1)
    return df

def fetch_predict(w,p):
    rows=qry(f"""SELECT YEAR(f.DateFacture) an,MONTH(f.DateFacture) mo,
        SUM(f.TotalHT) ca FROM factures f JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY an,mo ORDER BY an,mo""", p)
    if len(rows)<2: return None
    df=pd.DataFrame(rows); df['idx']=range(len(df))
    X=df[['idx']].values; y=df['ca'].astype(float).values
    model=LinearRegression().fit(X,y)
    pred=max(0,float(model.predict([[len(df)]])[0]))
    r2=max(0,min(100,model.score(X,y)*100))
    trend='hausse' if model.coef_[0]>0 else 'baisse' if model.coef_[0]<0 else 'stable'
    return dict(pred=round(pred,3),r2=round(r2,1),trend=trend,
                coef=round(float(model.coef_[0]),3),df=df,model=model)

def fetch_count_clients(w,p):
    r=qry(f"""SELECT COUNT(DISTINCT t.Id) n FROM factures f
        JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'""",p)
    return r[0]['n'] if r else 0

def fetch_count_produits(w,p):
    r=qry(f"""SELECT COUNT(DISTINCT p.Id) n FROM lignefactures lf
        JOIN produits p ON lf.ProduitId=p.Id
        JOIN factures f ON lf.NumeroFacture=f.NumeroFacture
        JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'""",p)
    return r[0]['n'] if r else 0

def get_lists():
    cl=[{'label':'Tous les clients','value':'__all__'}]
    vi=[{'label':'Tous gouvernorats','value':'__all__'}]
    try:
        for r in qry("SELECT Id,Nom FROM tiers ORDER BY Nom LIMIT 100"):
            cl.append({'label':r['Nom'],'value':str(r['Id'])})
        for r in qry("SELECT DISTINCT Ville FROM tiers WHERE Ville IS NOT NULL AND Ville!='' ORDER BY Ville"):
            vi.append({'label':r['Ville'],'value':r['Ville']})
    except: pass
    return cl,vi

CL_LIST,VI_LIST=get_lists()

# ══════════════════════════════════════════════════════
#  UI HELPERS
# ══════════════════════════════════════════════════════
def card(children,extra=None):
    s=dict(background=CARD,borderRadius='12px',padding='12px',
           boxShadow='0 1px 4px rgba(0,0,0,0.07)',border='1px solid #e8ecef')
    if extra: s.update(extra)
    return html.Div(children,style=s)

def kpi(icon,label,val,sub,color,pct=None,trend=None):
    bar=[]
    if pct is not None:
        bar=[html.Div(style={'height':'3px','background':'#ecf0f1','borderRadius':'3px',
            'overflow':'hidden','marginTop':'8px'},
            children=[html.Div(style={'height':'100%','width':f"{min(float(pct),100):.0f}%",
                'background':color,'borderRadius':'3px'})])]
    te=[]
    if trend is not None:
        tc='#27ae60' if trend>=0 else RED
        te=[html.Span(f"{'▲' if trend>=0 else '▼'} {abs(trend):.1f}%",
            style={'fontSize':'10px','fontWeight':'700','color':tc,
                   'background':'#eafaf1' if trend>=0 else '#fdf3f2',
                   'padding':'2px 7px','borderRadius':'20px','marginLeft':'8px',
                   'border':f"1px solid {'#a9dfbf' if trend>=0 else '#f5b7b1'}"})]
    return html.Div([
        html.Div(icon,style={'position':'absolute','top':'12px','right':'12px',
            'width':'38px','height':'38px','borderRadius':'10px',
            'background':f"{color}15",'border':f"1px solid {color}25",
            'display':'flex','alignItems':'center','justifyContent':'center','fontSize':'18px'}),
        html.Div(label,style={'fontSize':'10px','color':MUT,'textTransform':'uppercase',
            'letterSpacing':'0.07em','marginBottom':'4px','fontWeight':'600'}),
        html.Div([html.Span(val,style={'fontSize':'22px','fontWeight':'800','color':TXT,
            'letterSpacing':'-0.5px'}),*te],
            style={'display':'flex','alignItems':'center','flexWrap':'wrap'}),
        html.Div(sub,style={'fontSize':'10px','color':MUT,'marginTop':'3px'}),
        *bar,
        html.Div(style={'position':'absolute','bottom':'0','left':'0','right':'0',
            'height':'3px','background':color,'borderRadius':'0 0 12px 12px'}),
    ],style={'background':CARD,'borderRadius':'10px','padding':'12px',
             'boxShadow':'0 1px 4px rgba(0,0,0,0.07)',
             'border':'1px solid #e8ecef','position':'relative','overflow':'hidden'})

TH={'padding':'8px 12px','textAlign':'left','color':MUT,'fontWeight':'700',
    'fontSize':'10px','textTransform':'uppercase','letterSpacing':'0.06em',
    'borderBottom':'2px solid #f0f2f5','background':'#f8f9fa'}
TD={'padding':'8px 12px','color':TXT,'borderBottom':'1px solid #f0f2f5','fontSize':'12px'}

def _alert(icon,title,sub,badge,clr,bg,brd):
    return html.Div([
        html.Span(icon,style={'fontSize':'18px','flexShrink':'0'}),
        html.Div([
            html.Div(title,style={'fontSize':'12px','fontWeight':'700','color':TXT}),
            html.Div(sub,style={'fontSize':'10px','color':MUT,'marginTop':'2px'}),
        ],style={'flex':'1'}),
        html.Span(badge,style={'fontSize':'10px','fontWeight':'800','color':clr,
            'background':bg,'padding':'2px 8px','borderRadius':'20px',
            'border':f"1px solid {brd}",'flexShrink':'0','whiteSpace':'nowrap'}),
    ],style={'display':'flex','alignItems':'center','gap':'10px','padding':'8px 12px',
        'borderRadius':'8px','background':bg,'border':f"1px solid {brd}",
        'marginBottom':'6px'})

def voir_plus_btn(label="👁 Voir plus"):
    return html.Button(label,style={
        'padding':'6px 16px','borderRadius':'20px','border':f"1px solid {ACC}",
        'background':'white','color':ACC,'fontSize':'11px','fontWeight':'600',
        'cursor':'pointer','fontFamily':'inherit','marginTop':'10px',
        'display':'block','width':'100%','textAlign':'center'})

DD_STYLE={'background':CARD,'border':'1px solid #dfe6e9','borderRadius':'8px','fontSize':'12px'}
INP_STYLE={'background':CARD,'border':'1px solid #dfe6e9','borderRadius':'8px',
           'padding':'5px 8px','color':TXT,'fontSize':'11px','fontFamily':'Inter,sans-serif'}

PERIODS=[('7j','7J'),('30j','1M'),('90j','3M'),('6mois','6M'),('1an','1An'),('tout','Tout')]

# ══════════════════════════════════════════════════════
#  APP
# ══════════════════════════════════════════════════════
app=dash.Dash(__name__,title='El Fatoora BI',
    suppress_callback_exceptions=True,update_title=None,
    meta_tags=[{'name':'viewport','content':'width=device-width,initial-scale=1'}])
server=app.server

app.index_string='''<!DOCTYPE html>
<html lang="fr">
<head>
{%metas%}<title>{%title%}</title>{%favicon%}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#f0f2f5!important;color:#2d3436!important;
  font-family:'Inter',system-ui,sans-serif!important;height:100%!important}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#bdc3c7;border-radius:5px}
input{background:white!important;color:#2d3436!important;border:1px solid #dfe6e9!important;
  border-radius:8px!important;font-family:inherit!important;outline:none!important;padding:5px 9px!important}
button{font-family:inherit!important;transition:all 0.15s!important;cursor:pointer!important}
.btn-period{padding:5px 12px!important;border-radius:18px!important;border:1px solid #dfe6e9!important;
  background:white!important;color:#636e72!important;font-size:11px!important;font-weight:600!important}
.btn-period:hover{background:#f0f7ff!important;border-color:#2196f3!important;color:#2196f3!important}
.btn-period.active{background:#2196f3!important;border-color:#2196f3!important;color:white!important;
  box-shadow:0 2px 8px rgba(33,150,243,0.4)!important}
.Select-control{background:white!important;border:1px solid #dfe6e9!important;
  border-radius:8px!important;min-height:32px!important;box-shadow:none!important}
.Select-control:hover,.Select.is-focused>.Select-control{border-color:#2196f3!important;
  box-shadow:0 0 0 3px rgba(33,150,243,0.1)!important}
.Select.is-open>.Select-control{border-radius:8px 8px 0 0!important;border-color:#2196f3!important}
.Select-value-label,.Select-placeholder{color:#2d3436!important;font-size:12px!important}
.Select-placeholder{color:#b2bec3!important}
.Select-arrow{border-top-color:#b2bec3!important}
.Select-menu-outer{background:white!important;border:1px solid #dfe6e9!important;
  border-top:none!important;border-radius:0 0 8px 8px!important;
  box-shadow:0 8px 24px rgba(0,0,0,0.12)!important;z-index:9999!important}
.Select-menu{background:white!important;max-height:200px!important}
.Select-option{background:white!important;color:#2d3436!important;font-size:12px!important;padding:7px 12px!important}
.Select-option:hover,.Select-option.is-focused{background:#f0f7ff!important;color:#2196f3!important}
.Select-option.is-selected{background:#e3f2fd!important;color:#1565c0!important;font-weight:600!important}
.modebar{display:none!important}
/* Animations */
@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeInLeft{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes countUp{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(33,150,243,0.3)}70%{box-shadow:0 0 0 6px rgba(33,150,243,0)}}
/* Appliquer animations au chargement */
#main-content > div > div{animation:fadeInUp 0.4s ease both}
#main-content > div > div:nth-child(1){animation-delay:0s}
#main-content > div > div:nth-child(2){animation-delay:0.08s}
#main-content > div > div:nth-child(3){animation-delay:0.16s}
#main-content > div > div:nth-child(4){animation-delay:0.24s}
#main-content > div > div:nth-child(5){animation-delay:0.32s}
/* KPI hover */
#main-content .kpi-card{transition:transform 0.2s,box-shadow 0.2s}
#main-content .kpi-card:hover{transform:translateY(-3px)!important;box-shadow:0 8px 24px rgba(0,0,0,0.12)!important}
/* Card hover */
#main-content > div > div > div[style*="border-radius"]{transition:box-shadow 0.2s,transform 0.2s}
#main-content > div > div > div[style*="border-radius"]:hover{box-shadow:0 6px 20px rgba(0,0,0,0.1)!important}
/* Bouton période actif */
.btn-period.active{animation:pulse 1.5s infinite}
/* Filtres slide in */
#filter-bar{animation:fadeInLeft 0.3s ease both}
/* Modal animation */
#modal-overlay > div{animation:fadeInUp 0.25s ease both}
.badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;
  font-size:10px;font-weight:700;margin-right:4px}
</style>
</head>
<body style="background:#f0f2f5!important">
{%app_entry%}
<footer>{%config%}{%scripts%}{%renderer%}</footer>
</body></html>'''

# ══════════════════════════════════════════════════════
#  LAYOUT
# ══════════════════════════════════════════════════════
def serve_layout():
    try: initial=render_dashboard('tout',None,None,'__all__','__all__','__all__','__all__','__all__',None,None)
    except Exception as e:
        print(f"Init err: {e}")
        initial=html.Div(str(e),style={'color':RED,'padding':'20px'})

    return html.Div([
        dcc.Store(id='st-per',data='tout'),
        dcc.Store(id='st-manual',data=False),
        dcc.Store(id='st-modal-type',data=None),
        dcc.Interval(id='auto-ref',interval=5*60*1000,n_intervals=0),
        # ── Modal Voir Plus ────────────────────────────
        html.Div(id='modal-overlay',n_clicks=0,
            style={'position':'fixed','inset':'0','background':'rgba(0,0,0,0.5)',
                   'zIndex':'9999','display':'none','alignItems':'center','justifyContent':'center'},
            children=[
                html.Div([
                    html.Div([
                        html.Div(id='modal-title',style={'fontSize':'15px','fontWeight':'800','color':TXT}),
                        html.Button('✕',id='btn-modal-close',n_clicks=0,
                            style={'border':'none','background':'none','fontSize':'18px',
                                   'cursor':'pointer','color':MUT,'fontFamily':'inherit'}),
                    ],style={'display':'flex','justifyContent':'space-between','alignItems':'center',
                              'padding':'14px 18px','borderBottom':'1px solid #e8ecef'}),
                    html.Div(id='modal-body',
                        style={'padding':'16px 18px','overflowY':'auto','maxHeight':'70vh'}),
                ],id='modal-content',
                 style={'background':'white','borderRadius':'14px','width':'90%','maxWidth':'1100px',
                        'boxShadow':'0 20px 60px rgba(0,0,0,0.2)','maxHeight':'85vh',
                        'display':'flex','flexDirection':'column','cursor':'default'}),
            ]),

        # ── Barre de filtres ──────────────────────────
        html.Div([
            # Ligne 1 : Période (temps réel) + Date
            html.Div([
                html.Span('⏱',style={'color':ACC,'fontSize':'14px','marginRight':'4px'}),
                html.Span('PÉRIODE :',style={'fontSize':'10px','color':MUT,'fontWeight':'700',
                          'letterSpacing':'0.07em','marginRight':'8px'}),
                *[html.Button(lb,id=f'btn-{k}',n_clicks=0,className='btn-period',
                    **{'data-period':k})
                  for k,lb in PERIODS],
                html.Span('│',style={'color':'#dfe6e9','margin':'0 10px','fontSize':'18px'}),
                html.Span('📅',style={'fontSize':'13px','marginRight':'4px'}),
                dcc.Input(id='d1',type='date',style={**INP_STYLE,'width':'130px'}),
                html.Span('→',style={'color':MUT,'margin':'0 4px'}),
                dcc.Input(id='d2',type='date',style={**INP_STYLE,'width':'130px'}),
            ],style={'display':'flex','alignItems':'center','gap':'4px','flexWrap':'wrap'}),

            # Ligne 2 : Filtres manuels
            html.Div([
                *[html.Div([
                    html.Span(ic,style={'fontSize':'13px','marginRight':'3px'}),
                    dcc.Dropdown(id=fid,options=opts,value='__all__',clearable=False,
                        style={**DD_STYLE,'width':w})
                  ],style={'display':'flex','alignItems':'center'})
                  for ic,fid,opts,w in [
                    ('👤','f-cl',CL_LIST,'155px'),
                    ('📍','f-vi',VI_LIST,'150px'),
                    ('🏢','f-ty',[{'label':'Tous types','value':'__all__'},
                                   {'label':'Sté TN (MF)','value':'I-01'},
                                   {'label':'Personne physique','value':'I-02'},
                                   {'label':'Étranger','value':'I-03'},
                                   {'label':'Sté Étrangère','value':'I-04'}],'140px'),
                    ('📋','f-st',[{'label':'Tous statuts','value':'__all__'},
                                   {'label':'✅ Acceptées TTN','value':'AcceptéeTTN'},
                                   {'label':'⏳ Brouillons','value':'Brouillon'},
                                   {'label':'❌ Rejetées','value':'Rejetée'},
                                   {'label':'🔄 Avoirs (I-14)','value':'avoir'}],'148px'),
                    ('🏷️','f-tv',[{'label':'Tous taux TVA','value':'__all__'},
                                   {'label':'0% (exonéré)','value':'0'},
                                   {'label':'7%','value':'7'},
                                   {'label':'13%','value':'13'},
                                   {'label':'19%','value':'19'}],'130px'),
                  ]],
                html.Div([
                    html.Span('💰',style={'fontSize':'13px','marginRight':'4px'}),
                    dcc.Input(id='f-mn',type='number',placeholder='Min DT',
                        style={**INP_STYLE,'width':'80px'}),
                    html.Span('—',style={'color':MUT,'margin':'0 3px'}),
                    dcc.Input(id='f-mx',type='number',placeholder='Max DT',
                        style={**INP_STYLE,'width':'80px'}),
                ],style={'display':'flex','alignItems':'center'}),
            ],style={'display':'flex','alignItems':'center','gap':'8px','flexWrap':'wrap'}),

            # Ligne 3 : Badges actifs + Actions
            html.Div([
                html.Div(id='active-badges',
                    style={'flex':'1','display':'flex','gap':'4px','flexWrap':'wrap',
                           'alignItems':'center'}),
                html.Button('✕ Reset',id='btn-rst',n_clicks=0,
                    style={'padding':'6px 14px','borderRadius':'8px',
                           'border':'1px solid #dfe6e9','background':CARD,
                           'color':MUT,'fontSize':'11px','fontFamily':'inherit'}),
                html.Button('🔍 Appliquer filtres',id='btn-apl',n_clicks=0,
                    style={'padding':'6px 18px','borderRadius':'8px','border':'none',
                           'background':ACC,'color':'white','fontSize':'11px','fontWeight':'700',
                           'fontFamily':'inherit','boxShadow':'0 4px 12px rgba(33,150,243,0.3)'}),
                html.Button('⟳',id='btn-ref',n_clicks=0,
                    style={'width':'32px','height':'32px','borderRadius':'8px',
                           'border':'1px solid #dfe6e9','background':CARD,
                           'color':TXT,'fontSize':'16px','fontFamily':'inherit'}),
                html.Button('⬇ PDF',
                    id='btn-pdf', n_clicks=0,
                    style={'padding':'6px 16px','borderRadius':'8px',
                           'border':'1px solid #e74c3c','background':'#fdf3f2',
                           'color':'#e74c3c','fontSize':'11px','fontWeight':'700',
                           'cursor':'pointer','fontFamily':'inherit'}),
                dcc.Download(id='download-pdf'),
            ],style={'display':'flex','alignItems':'center','gap':'6px'}),

        ],id='filter-bar',style={
            'display':'flex','flexDirection':'column','gap':'8px',
            'padding':'10px 16px','background':CARD,
            'borderBottom':'1px solid #e8ecef','flexShrink':'0',
            'boxShadow':'0 2px 6px rgba(0,0,0,0.05)',
            'position':'sticky','top':'0','zIndex':'100'}),

        # ── Contenu principal ─────────────────────────
        html.Div(id='main-content',children=initial,
            style={'padding':'14px 16px','background':BG}),

    ],style={'fontFamily':"'Inter',system-ui,sans-serif",
             'background':BG,'color':TXT,'minHeight':'100vh'})

app.layout=serve_layout

# ══════════════════════════════════════════════════════
#  CALLBACKS
# ══════════════════════════════════════════════════════

# ── Mise à jour badges ────────────────────────────────
@app.callback(
    Output('active-badges','children'),
    Input('st-per','data'),
    Input('d1','value'),Input('d2','value'),
    Input('f-cl','value'),Input('f-vi','value'),
    Input('f-ty','value'),Input('f-st','value'),
    Input('f-tv','value'),Input('f-mn','value'),Input('f-mx','value'))
def cb_badges(per,d1,d2,cl,vi,ty,st,tv,mn,mx):
    def b(txt,c,ic=''):
        return html.Span(f"{ic} {txt}".strip(),className='badge',
            style={'color':c,'background':f"{c}15",'border':f"1px solid {c}40"})
    out=[]
    if d1 and d2: out.append(b(f"{d1} → {d2}",CYN,'📅'))
    else:
        lbl={'7j':'7 derniers jours','30j':'30 derniers jours','90j':'3 mois',
             '6mois':'6 mois','1an':'1 an','tout':'Toute la période'}
        out.append(b(lbl.get(per,'Tout'),ACC,'⏱'))
    if cl and cl!='__all__':
        opts=dict((o['value'],o['label']) for o in CL_LIST)
        out.append(b(opts.get(cl,'Client'),GRN,'👤'))
    if vi and vi!='__all__': out.append(b(vi,ORG,'📍'))
    if ty and ty!='__all__':
        lbl={'I-01':'Sté TN','I-02':'Physique','I-03':'Étranger','I-04':'Sté Étr.'}
        out.append(b(lbl.get(ty,ty),PRP,'🏢'))
    if st and st!='__all__':
        lbl={'AcceptéeTTN':'Validées TTN','Brouillon':'Brouillons',
             'Rejetée':'Rejetées','avoir':'Avoirs'}
        out.append(b(lbl.get(st,st),RED,'📋'))
    if tv and tv!='__all__': out.append(b(f"TVA {tv}%",YLW,'🏷️'))
    if mn: out.append(b(f"≥ {mn} DT",CYN,'💰'))
    if mx: out.append(b(f"≤ {mx} DT",CYN,'💰'))
    return out

# ── Période active (classe CSS) ───────────────────────
@app.callback(
    Output('st-per','data'),
    [Input(f'btn-{k}','n_clicks') for k,_ in PERIODS],
    Input('btn-rst','n_clicks'),
    prevent_initial_call=False)
def cb_period(*args):
    ctx=callback_context
    if not ctx.triggered: return 'tout'
    tid=ctx.triggered[0]['prop_id'].split('.')[0]
    # Ignorer si c'est le chargement initial (n_clicks=0)
    if ctx.triggered[0].get('value',0)==0 and tid.startswith('btn-') and tid!='btn-rst':
        return 'tout'
    m={f'btn-{k}':k for k,_ in PERIODS}
    m['btn-rst']='tout'
    return m.get(tid,'tout')

# ── Reset : réinitialise tous les dropdowns + période ─
@app.callback(
    Output('f-cl','value'), Output('f-vi','value'),
    Output('f-ty','value'), Output('f-st','value'),
    Output('f-tv','value'), Output('f-mn','value'),
    Output('f-mx','value'), Output('d1','value'),
    Output('d2','value'),
    Input('btn-rst','n_clicks'),
    prevent_initial_call=True)
def cb_reset(_):
    return '__all__','__all__','__all__','__all__','__all__',None,None,None,None

# ── Rendu principal ────────────────────────────────────
@app.callback(
    Output('main-content','children'),
    Input('st-per','data'),
    Input('auto-ref','n_intervals'),
    Input('btn-apl','n_clicks'),
    Input('btn-ref','n_clicks'),
    Input('btn-rst','n_clicks'),
    State('d1','value'),State('d2','value'),
    State('f-cl','value'),State('f-vi','value'),
    State('f-ty','value'),State('f-st','value'),
    State('f-tv','value'),State('f-mn','value'),State('f-mx','value'))
def cb_main(per,_auto,_apl,_ref,_rst,d1,d2,cl,vi,ty,st,tv,mn,mx):
    ctx=callback_context
    tid=ctx.triggered[0]['prop_id'].split('.')[0] if ctx.triggered else ''
    # Reset → tout à __all__
    if tid=='btn-rst':
        return render_dashboard('tout',None,None,'__all__','__all__','__all__','__all__','__all__',None,None)
    try:
        return render_dashboard(per,d1,d2,cl,vi,ty,st,tv,mn,mx)
    except Exception as e:
        print(f"Render err: {e}")
        import traceback; traceback.print_exc()
        return html.Div(f"⚠️ Erreur : {e}",style={'color':RED,'padding':'20px'})

# ══════════════════════════════════════════════════════
#  RENDER PRINCIPAL
# ══════════════════════════════════════════════════════
def _make_donut_produits(prs, top=7):
    """Donut produits top 7 + Autres"""
    if prs.empty:
        return go.Figure()
    top_df = prs.head(top).copy()
    reste = prs.iloc[top:]['ca'].sum()
    labels = list(top_df['pr'].str.slice(0,22)) + (['Autres'] if reste>0 else [])
    values = list(top_df['ca']) + ([reste] if reste>0 else [])
    colors = PAL[:len(top_df)] + (['#bdc3c7'] if reste>0 else [])
    fig = go.Figure(go.Pie(
        labels=labels, values=values,
        marker=dict(colors=colors, line=dict(color='white', width=3)),
        hole=0.58, textinfo='none',
        hovertemplate='<b>%{label}</b><br>%{value:,.3f} DT (%{percent})<extra></extra>'))
    total = sum(values)
    fig.add_annotation(text=f"<b>{fmtk(total)}</b>", x=0.5, y=0.58,
        showarrow=False, font=dict(size=15,color=TXT,family='Inter'))
    fig.add_annotation(text="CA HT total", x=0.5, y=0.42,
        showarrow=False, font=dict(size=9,color=MUT,family='Inter'))
    fig.update_layout(paper_bgcolor='white', plot_bgcolor='white',
        height=160, showlegend=False,
        margin=dict(l=5,r=5,t=5,b=5),
        font=dict(family='Inter',color=TXT))
    return fig

def render_dashboard(per,d1,d2,cl,vi,ty,st,tv,mn,mx):
    # Construire le WHERE
    w,p = build_where(per,d1,d2,cl,vi,ty,st,tv,mn,mx)

    # Charger toutes les données avec les filtres
    k    = fetch_kpis(w,p)
    evo  = fetch_evo(w,p)
    cls  = fetch_clients(w,p,5)    # tableau top 5
    cls_chart = fetch_clients(w,p,20)  # graphe top 8 + autres
    prs  = fetch_produits(w,p,5)
    tv_  = fetch_tva(w,p)
    vls  = fetch_villes(w,p)
    trnd = fetch_statuts_trend(w,p)
    pred = fetch_predict(w,p)

    ca   = k.get('ca',0); tva=k.get('tva',0); timb=k.get('timbre',0)
    tot  = int(k.get('total',0)); val=int(k.get('val',0))
    brou = int(k.get('brou',0)); rej=int(k.get('rej',0))
    pan  = k.get('panier',0)
    txv  = round(val/tot*100,1) if tot else 0
    txr  = round(rej/tot*100,1) if tot else 0

    # ── Tendance CA ──────────────────────────────────
    trend_ca = None
    if len(evo)>=2:
        trend_ca=(float(evo['ca'].iloc[-1])-float(evo['ca'].iloc[-2]))/max(float(evo['ca'].iloc[-2]),1)*100

    # ════════════════════════════════════════════════
    #  GRAPHIQUES
    # ════════════════════════════════════════════════

    # 1. CA Mensuel + Ligne TTC
    fig_ca=go.Figure()
    if not evo.empty:
        fig_ca.add_trace(go.Bar(x=evo['label'],y=evo['ca'],name='CA HT',
            marker=dict(color=ACC,opacity=0.85),
            text=[fmtk(v) for v in evo['ca']],textposition='auto',
            textfont=dict(color='white',size=9)))
        fig_ca.add_trace(go.Scatter(x=evo['label'],y=evo['ttc'],name='CA TTC',
            mode='lines+markers',line=dict(color=ORG,width=2.5),
            marker=dict(size=7,color=ORG,line=dict(color='white',width=2))))
        ymax=max(float(evo['ttc'].max()),float(evo['ca'].max()))*1.2
        fig_ca.update_layout(**make_fig(240,yaxis_range=[0,ymax]))
    else:
        fig_ca.add_annotation(text="Aucune donnée validée",x=0.5,y=0.5,
            xref='paper',yref='paper',showarrow=False,font=dict(size=13,color=MUT))
        fig_ca.update_layout(**make_fig(240))

    # 2. Donut statuts
    fig_do=go.Figure(go.Pie(
        labels=['Validées','Brouillons','Rejetées'],
        values=[max(val,0.01),max(brou,0.01),max(rej,0.01)],
        marker=dict(colors=[GRN,ORG,RED],line=dict(color='white',width=3)),
        hole=0.62,textinfo='none',pull=[0.04,0,0],
        hovertemplate='<b>%{label}</b> : %{value:.0f} (%{percent})<extra></extra>'))
    fig_do.add_annotation(text=f"<b>{tot}</b>",x=0.5,y=0.56,showarrow=False,
        font=dict(size=24,color=TXT,family='Inter'))
    fig_do.add_annotation(text="total",x=0.5,y=0.41,showarrow=False,
        font=dict(size=11,color=MUT,family='Inter'))
    fig_do.update_layout(paper_bgcolor='white',plot_bgcolor='white',
        height=200,showlegend=False,margin=dict(l=10,r=10,t=10,b=10),
        font=dict(family='Inter',color=TXT))

    # 3. Donut produits
    fig_pr=go.Figure(go.Pie(
        labels=prs['pr'].str.slice(0,16) if not prs.empty else ['Aucun'],
        values=prs['ca'] if not prs.empty else [1],
        marker=dict(colors=PAL[:len(prs)] if not prs.empty else [MUT],
                    line=dict(color='white',width=3)),
        hole=0.52,textinfo='none',
        hovertemplate='<b>%{label}</b><br>%{value:,.3f} DT (%{percent})<extra></extra>'))
    if not prs.empty:
        fig_pr.add_annotation(text=f"<b>{fmtk(prs['ca'].sum())}</b>",
            x=0.5,y=0.56,showarrow=False,font=dict(size=14,color=TXT,family='Inter'))
        fig_pr.add_annotation(text="DT HT",x=0.5,y=0.42,showarrow=False,
            font=dict(size=10,color=MUT,family='Inter'))
    fig_pr.update_layout(paper_bgcolor='white',plot_bgcolor='white',
        height=200,showlegend=False,margin=dict(l=10,r=10,t=10,b=10),
        font=dict(family='Inter',color=TXT))

    # 4. Top clients barres horizontales
    fig_cl=go.Figure()
    if not cls_chart.empty:
        # Top 8 triés par CA desc + Autres en bas
        top_cls = cls_chart.sort_values('ca',ascending=False).head(8).copy()
        reste_ca = cls_chart.sort_values('ca',ascending=False).iloc[8:]['ca'].sum() if len(cls_chart)>8 else 0
        # Pour barres horizontales : ordre ascending → plus grand en haut
        # Autres doit être TOUT en bas = premier dans la liste (categoryorder=total ascending)
        labels_cl = (['Autres'] if reste_ca>0 else []) + list(reversed(top_cls['cl'].str.slice(0,22)))
        values_cl = ([reste_ca] if reste_ca>0 else []) + list(reversed(top_cls['ca']))
        clrs_ = (['#bdc3c7'] if reste_ca>0 else []) + [
            f"rgba(33,150,243,{0.45+0.55*i/max(len(top_cls)-1,1)})"
            for i in range(len(top_cls)-1,-1,-1)]
        fig_cl.add_trace(go.Bar(
            y=labels_cl, x=values_cl, orientation='h',
            marker=dict(color=clrs_),
            text=[fmtk(v)+' DT' for v in values_cl],
            textposition='outside',textfont=dict(color=TXT,size=9)))
        fig_cl.update_layout(**make_fig(max(160,(len(labels_cl))*25),
            xaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                       tickfont=dict(color=MUT,size=9),showgrid=True,zeroline=False),
            yaxis=dict(tickfont=dict(color=TXT,size=10),showgrid=False,
                       automargin=True,categoryorder='trace'),
            margin=dict(l=10,r=65,t=5,b=15),showlegend=False))

    # 5. TVA barres
    tc_map={0:MUT,7:CYN,13:YLW,19:ACC}
    fig_tv=go.Figure()
    if not tv_.empty:
        for _,row in tv_.iterrows():
            c=tc_map.get(int(row['tx']),PRP)
            fig_tv.add_trace(go.Bar(name=f"TVA {int(row['tx'])}%",
                x=[f"TVA {int(row['tx'])}%"],y=[row['tva']],
                marker=dict(color=c,opacity=0.9),
                text=[f"{row['tva']:,.0f} DT"],textposition='outside',
                textfont=dict(color=TXT,size=10)))
        fig_tv.update_layout(**make_fig(210,showlegend=False,
            margin=dict(l=50,r=20,t=20,b=30)))

    # 6. Taux de validation tendance
    fig_trnd=go.Figure()
    if not trnd.empty:
        fig_trnd.add_trace(go.Scatter(x=trnd['label'],y=trnd['taux_val'],
            mode='lines+markers+text',
            line=dict(color=GRN,width=2.5),
            marker=dict(size=8,color=GRN,line=dict(color='white',width=2)),
            text=[f"{v}%" for v in trnd['taux_val']],
            textposition='top center',textfont=dict(size=9,color=GRN),
            fill='tozeroy',fillcolor='rgba(0,184,148,0.08)',
            name='Taux validation'))
        fig_trnd.add_hline(y=80,line=dict(color=ORG,width=1.5,dash='dash'),
            annotation_text="Objectif 80%",annotation_font_color=ORG,
            annotation_font_size=10)
        fig_trnd.update_layout(**make_fig(200,yaxis_range=[0,105],
            margin=dict(l=50,r=20,t=20,b=30),showlegend=False,
            yaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                       tickfont=dict(color=MUT,size=10),showgrid=True,
                       zeroline=False,ticksuffix='%')))

    # 7. Géographie treemap
    fig_geo=go.Figure()
    if not vls.empty:
        fig_geo=go.Figure(go.Treemap(
            labels=vls['vi'],parents=['']*len(vls),values=vls['ca'],
            texttemplate="<b>%{label}</b><br>%{value:,.0f} DT",
            textfont=dict(size=11),
            marker=dict(colors=vls['ca'].tolist(),
                        colorscale=[[0,'#bbdefb'],[0.5,'#1976d2'],[1,'#0d47a1']],
                        line=dict(color='white',width=2)),
            hovertemplate='<b>%{label}</b><br>CA : %{value:,.3f} DT<extra></extra>'))
        fig_geo.update_layout(paper_bgcolor='white',height=220,
            margin=dict(l=0,r=0,t=5,b=0),font=dict(family='Inter',color='white'))

    # 8. Prédiction IA
    fig_pred=go.Figure()
    pred_val="—"; pred_trend="—"; pred_r2=0
    if pred:
        pred_val=fmtk(pred['pred'])+" DT"
        pred_trend=pred['trend']
        pred_r2=pred['r2']
        df_p=pred['df']; model_p=pred['model']
        X=df_p[['idx']].values; y=df_p['ca'].astype(float).values
        x_ext=np.arange(len(df_p)+3); y_line=model_p.predict(x_ext.reshape(-1,1))
        lbl=[f"{MOIS[int(r.mo)-1]} {str(int(r.an))[2:]}" for _,r in df_p.iterrows()]
        now=datetime.now()
        for i in range(1,4):
            m=(now.month+i-1)%12+1; a=now.year+(now.month+i-1)//12
            lbl.append(f"{MOIS[m-1]} {str(a)[2:]} ★")
        fig_pred.add_trace(go.Bar(x=lbl[:len(df_p)],y=y,name='CA réel',
            marker=dict(color=ACC,opacity=0.75),
            text=[fmtk(v) for v in y],textposition='auto',
            textfont=dict(color='white',size=9)))
        fig_pred.add_trace(go.Scatter(x=lbl,y=y_line,name='Tendance',
            mode='lines',line=dict(color=ORG,width=2,dash='dot')))
        fig_pred.add_trace(go.Scatter(x=lbl[len(df_p):],y=y_line[len(df_p):],
            name='Prédiction ★',mode='markers+lines',
            marker=dict(symbol='star',size=16,color=GRN,line=dict(color='white',width=1)),
            line=dict(color=GRN,width=2)))
        fig_pred.update_layout(**make_fig(230,
            margin=dict(l=50,r=20,t=30,b=40),
            xaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                       tickfont=dict(color=MUT,size=9),showgrid=True,
                       zeroline=False,tickangle=-30),
            yaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                       tickfont=dict(color=MUT,size=9),showgrid=True,zeroline=False)))

    # ════════════════════════════════════════════════
    #  ASSEMBLAGE DU LAYOUT
    # ════════════════════════════════════════════════

    # Alertes intelligentes (non redondantes avec KPIs)
    alert_items=[]

    # Alerte rejet élevé
    if txr > 20:
        alert_items.append(_alert('🚨',f"Taux de rejet critique : {txr}%",
            f"{rej} factures à corriger — au-dessus du seuil TTN (20%)","CRITIQUE",RED,'#fdf3f2','#f5b7b1'))
    elif rej > 0:
        alert_items.append(_alert('❌',f"{rej} facture{'s' if rej>1 else ''} rejetée{'s' if rej>1 else ''} par TTN",
            "Corriger et re-soumettre avant la clôture mensuelle","URGENT",RED,'#fdf3f2','#f5b7b1'))

    # Alerte brouillons
    if brou > 10:
        alert_items.append(_alert('⚠️',f"{brou} brouillons non signés",
            "Volume élevé — risque de retard de paiement","À traiter",ORG,'#fef9f0','#fad7a0'))
    elif brou > 0:
        alert_items.append(_alert('⏳',f"{brou} brouillon{'s' if brou>1 else ''} en attente",
            "Signer électroniquement et envoyer à TTN","À faire",ORG,'#fef9f0','#fad7a0'))

    # Alerte taux de validation
    if txv < 60 and tot > 0:
        alert_items.append(_alert('📉',f"Taux validation faible : {txv}%",
            "Objectif TTN : 80% — vérifier la conformité TEIF","Attention",'#9b59b6','#f5eef8','#d7bde2'))

    # Alerte panier moyen faible
    if pan > 0 and pan < 500:
        alert_items.append(_alert('💡',"Panier moyen inférieur à 500 DT",
            "Opportunité : regrouper les petites factures","Conseil",ACC,'#ebf5fb','#aed6f1'))

    if not alert_items:
        alert_items=[_alert('✅','Tout est en ordre','Aucune anomalie détectée · TTN conforme','OK',GRN,'#eafaf1','#a9dfbf')]

    # Prédiction items
    pred_items=[]
    if pred:
        pred_items=[
            html.Div([
                html.Span('Prochain mois :',style={'fontSize':'11px','color':MUT}),
                html.Span(f" {pred_val}",style={'fontSize':'22px','fontWeight':'900',
                    'color':TXT,'letterSpacing':'-0.5px','marginLeft':'8px'}),
            ],style={'display':'flex','alignItems':'baseline','marginBottom':'8px'}),
            html.Div([
                html.Span('📈' if pred_trend=='hausse' else '📉' if pred_trend=='baisse' else '➡️',
                          style={'fontSize':'18px'}),
                html.Span(f" {pred_trend.upper()}",style={'fontWeight':'700','marginLeft':'6px',
                    'color':'#27ae60' if pred_trend=='hausse' else RED if pred_trend=='baisse' else ORG}),
                html.Span(f" · R² : {pred_r2:.1f}%",
                    style={'fontSize':'11px','color':MUT,'marginLeft':'8px'}),
            ],style={'display':'flex','alignItems':'center','marginBottom':'10px'}),
            html.Div(style={'height':'6px','background':'#f0f2f5','borderRadius':'6px',
                'overflow':'hidden','marginBottom':'10px'},
                children=[html.Div(style={'height':'100%','width':f"{pred_r2:.0f}%",
                    'background':f'linear-gradient(90deg,{ACC},{PRP})','borderRadius':'6px'})]),
            G(fig_pred,'180px'),
        ]

    return html.Div([

        # ── ROW 2 : CA + Produits (légende 4+4 sur 2 colonnes) ──
        html.Div([
            card([
                html.Div([
                    html.Span('ÉVOLUTION DU CA',style={'fontSize':'11px','fontWeight':'700',
                        'color':MUT,'letterSpacing':'0.07em'}),
                    html.Span(f" {'↑' if trend_ca and trend_ca>=0 else '↓'} {abs(trend_ca):.1f}%" if trend_ca else "",
                        style={'fontSize':'11px','fontWeight':'700','marginLeft':'8px',
                               'color':'#27ae60' if trend_ca and trend_ca>=0 else RED}),
                ],style={'marginBottom':'4px','display':'flex','alignItems':'center'}),
                G(fig_ca,'200px'),
            ],{'flex':'2.5'}),
            card([
                html.Div('RÉPARTITION PRODUITS',style={'fontSize':'11px','fontWeight':'700',
                    'color':MUT,'letterSpacing':'0.07em','marginBottom':'4px'}),
                G(_make_donut_produits(prs),'160px') if not prs.empty
                else html.Div("Aucun produit",style={'color':MUT,'padding':'30px','textAlign':'center'}),
                # Légende propre 2 colonnes
                *([html.Div([
                    # Colonne gauche
                    html.Div([
                        html.Div([
                            html.Div(style={'width':'8px','height':'8px','borderRadius':'50%',
                                'background':PAL[i%len(PAL)],'flexShrink':'0','marginTop':'2px'}),
                            html.Div([
                                html.Div(str(r['pr'])[:18],style={'fontSize':'9px','color':TXT,
                                    'fontWeight':'600','overflow':'hidden',
                                    'textOverflow':'ellipsis','whiteSpace':'nowrap'}),
                                html.Div(f"{r['ca']/prs['ca'].sum()*100:.0f}%",
                                    style={'fontSize':'10px','fontWeight':'800',
                                           'color':PAL[i%len(PAL)]}),
                            ],style={'flex':'1','minWidth':'0'}),
                        ],style={'display':'flex','alignItems':'flex-start',
                                  'gap':'5px','marginBottom':'5px'})
                        for i,r in prs.head(7).reset_index(drop=True).iterrows() if i%2==0
                    ],style={'flex':'1','minWidth':'0'}),
                    # Colonne droite
                    html.Div([
                        html.Div([
                            html.Div(style={'width':'8px','height':'8px','borderRadius':'50%',
                                'background':PAL[i%len(PAL)],'flexShrink':'0','marginTop':'2px'}),
                            html.Div([
                                html.Div(str(r['pr'])[:18],style={'fontSize':'9px','color':TXT,
                                    'fontWeight':'600','overflow':'hidden',
                                    'textOverflow':'ellipsis','whiteSpace':'nowrap'}),
                                html.Div(f"{r['ca']/prs['ca'].sum()*100:.0f}%",
                                    style={'fontSize':'10px','fontWeight':'800',
                                           'color':PAL[i%len(PAL)]}),
                            ],style={'flex':'1','minWidth':'0'}),
                        ],style={'display':'flex','alignItems':'flex-start',
                                  'gap':'5px','marginBottom':'5px'})
                        for i,r in prs.head(7).reset_index(drop=True).iterrows() if i%2==1
                    ] + ([html.Div([
                        html.Div(style={'width':'8px','height':'8px','borderRadius':'50%',
                            'background':'#bdc3c7','flexShrink':'0','marginTop':'2px'}),
                        html.Div([
                            html.Div('Autres',style={'fontSize':'9px','color':MUT,'fontWeight':'600'}),
                            html.Div(f"{prs.iloc[7:]['ca'].sum()/prs['ca'].sum()*100:.0f}%",
                                style={'fontSize':'10px','fontWeight':'800','color':'#bdc3c7'}),
                        ],style={'flex':'1'}),
                    ],style={'display':'flex','alignItems':'flex-start','gap':'5px','marginBottom':'5px'})]
                    if len(prs)>7 else []),
                    style={'flex':'1','minWidth':'0'}),
                ],style={'display':'flex','gap':'10px','marginTop':'8px',
                          'padding':'8px','background':'#f8f9fa','borderRadius':'8px'})]
                if not prs.empty else []),
            ],{'flex':'1.5'}),
        ],style={'display':'flex','gap':'8px','marginBottom':'8px'}),


        # ── ROW 3 : Top clients + TVA + Taux validation ──
        html.Div([
            card([
                html.Div('TOP CLIENTS — CA HT',style={'fontSize':'11px','fontWeight':'700',
                    'color':MUT,'letterSpacing':'0.07em','marginBottom':'6px'}),
                G(fig_cl,f"{max(160,len(cls.head(8))*26+26)}px") if not cls.empty
                else html.Div("Aucun client",style={'color':MUT,'padding':'20px','textAlign':'center'}),
            ],{'flex':'1.5'}),
            card([
                html.Div('TVA PAR TAUX',style={'fontSize':'11px','fontWeight':'700',
                    'color':MUT,'letterSpacing':'0.07em','marginBottom':'6px'}),
                G(fig_tv,'170px') if not tv_.empty
                else html.Div("Aucune TVA",style={'color':MUT,'padding':'20px','textAlign':'center'}),
                *([html.Div([
                    html.Span(f"TVA {int(r['tx'])}%",style={'fontSize':'10px','fontWeight':'700',
                        'color':tc_map.get(int(r['tx']),PRP)}),
                    html.Span('·',style={'color':MUT,'margin':'0 5px'}),
                    html.Span(f"Base : {fmtk(r['base'])} DT",style={'fontSize':'10px','color':MUT}),
                    html.Span(f"→ {fmtk(r['tva'])} DT TVA",
                        style={'fontSize':'10px','fontWeight':'700',
                               'color':tc_map.get(int(r['tx']),PRP),'marginLeft':'5px'}),
                ],style={'padding':'4px 0','borderBottom':'1px solid #f0f2f5'})
                for _,r in tv_.iterrows()] if not tv_.empty else []),
            ],{'flex':'1'}),
            card([
                html.Div('TAUX DE VALIDATION TTN',style={'fontSize':'11px','fontWeight':'700',
                    'color':MUT,'letterSpacing':'0.07em','marginBottom':'6px'}),
                G(fig_trnd,'170px') if not trnd.empty
                else html.Div("Aucune donnée",style={'color':MUT,'padding':'20px','textAlign':'center'}),
                html.Div([
                    html.Div([
                        html.Span('Actuel',style={'fontSize':'10px','color':MUT}),
                        html.Span(f"{txv}%",style={'fontSize':'18px','fontWeight':'800',
                            'color':GRN if txv>=80 else ORG if txv>=60 else RED,
                            'marginLeft':'8px'}),
                    ],style={'display':'flex','alignItems':'center'}),
                    html.Div(style={'flex':'1','height':'8px','background':'#f0f2f5',
                        'borderRadius':'8px','overflow':'hidden','marginLeft':'12px'},
                        children=[html.Div(style={'height':'100%',
                            'width':f"{txv}%",
                            'background':GRN if txv>=80 else ORG if txv>=60 else RED,
                            'borderRadius':'8px'})]),
                    html.Span('/ 80%',style={'fontSize':'10px','color':MUT,'marginLeft':'8px'}),
                ],style={'display':'flex','alignItems':'center','marginTop':'8px'}),
            ],{'flex':'1'}),
        ],style={'display':'flex','gap':'8px','marginBottom':'8px'}),

        # ── ROW 4 : Géographie + Prédiction IA + Alertes ──
        html.Div([
            card([
                html.Div('CA PAR GOUVERNORAT',style={'fontSize':'11px','fontWeight':'700',
                    'color':MUT,'letterSpacing':'0.07em','marginBottom':'6px'}),
                G(fig_geo,'180px') if not vls.empty
                else html.Div("Aucune donnée géographique",
                    style={'color':MUT,'padding':'20px','textAlign':'center'}),
                *([html.Div([
                    html.Span(str(r['vi'])[:20],style={'fontSize':'10px','color':TXT,
                        'fontWeight':'600','flex':'1'}),
                    html.Span(f"{r['ncl']} clients",style={'fontSize':'9px','color':MUT,'marginRight':'8px'}),
                    html.Span(f"{fmtk(r['ca'])} DT",style={'fontSize':'10px',
                        'fontWeight':'700','color':ACC}),
                ],style={'display':'flex','alignItems':'center','padding':'3px 0',
                          'borderBottom':'1px solid #f0f2f5'})
                for _,r in vls.head(5).iterrows()] if not vls.empty else []),
            ],{'flex':'1'}),
            card([
                html.Div([
                    html.Span('🤖 PRÉDICTION IA',style={'fontSize':'11px','fontWeight':'700',
                        'color':MUT,'letterSpacing':'0.07em'}),
                    html.Span(' · Régression linéaire scikit-learn',
                        style={'fontSize':'10px','color':MUT}),
                ],style={'marginBottom':'8px'}),
                *(pred_items if pred else [
                    html.Div("⚠️ Minimum 2 mois de données requis pour la prédiction.",
                        style={'color':ORG,'fontSize':'12px','padding':'20px','textAlign':'center'}),
                ]),
            ],{'flex':'2'}),

        ],style={'display':'flex','gap':'8px','marginBottom':'8px'}),

        # ── ROW 5 : Tableaux détaillés ───────────────
        html.Div([
            card([
                html.Div('TOP CLIENTS — DÉTAIL',style={'fontSize':'11px','fontWeight':'700',
                    'color':MUT,'letterSpacing':'0.07em','marginBottom':'10px'}),
                html.Div([html.Table([
                    html.Thead(html.Tr([html.Th(h,style=TH) for h in
                        ['#','Client','Gouvernorat','Factures','CA HT (DT)','Panier','Part']])),
                    html.Tbody([html.Tr([
                        html.Td(html.Span(f"#{i+1}",style={'background':f"{PAL[i%len(PAL)]}18",
                            'color':PAL[i%len(PAL)],'padding':'1px 7px','borderRadius':'20px',
                            'fontSize':'10px','fontWeight':'800'}),style=TD),
                        html.Td(r['cl'],style={**TD,'fontWeight':'600'}),
                        html.Td(str(r.get('vi','—') or '—'),style={**TD,'color':MUT}),
                        html.Td(str(int(r['nb'])),style={**TD,'textAlign':'center'}),
                        html.Td(f"{r['ca']:,.3f}",style={**TD,'fontWeight':'800','color':ACC}),
                        html.Td(f"{r['pan']:,.3f}",style={**TD,'color':PRP}),
                        html.Td([
                            html.Div(style={'height':'4px','background':'#f0f2f5',
                                'borderRadius':'4px','overflow':'hidden','marginBottom':'2px'},
                                children=[html.Div(style={'height':'100%',
                                    'width':f"{r['ca']/cls['ca'].sum()*100:.0f}%",
                                    'background':PAL[i%len(PAL)],'borderRadius':'4px'})]),
                            html.Span(f"{r['ca']/cls['ca'].sum()*100:.1f}%",
                                style={'fontSize':'9px','color':PAL[i%len(PAL)],'fontWeight':'700'}),
                        ],style={**TD,'minWidth':'70px'}),
                    ]) for i,r in cls.reset_index(drop=True).iterrows()]),
                ],style={'width':'100%','borderCollapse':'collapse','fontSize':'12px'})
                ],style={'overflowX':'auto'}),
                html.Button(f"👁 Voir tous les clients ({int(fetch_count_clients(w,p))})",
                    id='btn-voir-clients',n_clicks=0,
                    style={'padding':'7px 16px','borderRadius':'20px','border':f"1px solid {ACC}",
                           'background':'white','color':ACC,'fontSize':'11px','fontWeight':'600',
                           'cursor':'pointer','fontFamily':'inherit','marginTop':'10px',
                           'display':'block','width':'100%','textAlign':'center'})
            ] if not cls.empty else [html.Div("Aucun client",style={'color':MUT,'padding':'20px'})],
            {'flex':'1.3'}),
            card([
                html.Div('TOP PRODUITS — DÉTAIL',style={'fontSize':'11px','fontWeight':'700',
                    'color':MUT,'letterSpacing':'0.07em','marginBottom':'10px'}),
                html.Div([html.Table([
                    html.Thead(html.Tr([html.Th(h,style=TH) for h in
                        ['#','Produit','Qté','Prix moy.','CA HT (DT)','Part']])),
                    html.Tbody([html.Tr([
                        html.Td(html.Span(f"#{i+1}",style={'background':f"{PAL[i%len(PAL)]}18",
                            'color':PAL[i%len(PAL)],'padding':'1px 7px','borderRadius':'20px',
                            'fontSize':'10px','fontWeight':'800'}),style=TD),
                        html.Td(r['pr'],style={**TD,'fontWeight':'600'}),
                        html.Td(str(int(r['qte'])),style={**TD,'textAlign':'center'}),
                        html.Td(f"{r['pu']:,.3f}",style={**TD,'color':YLW}),
                        html.Td(f"{r['ca']:,.3f}",style={**TD,'fontWeight':'800','color':ACC}),
                        html.Td([
                            html.Div(style={'height':'4px','background':'#f0f2f5',
                                'borderRadius':'4px','overflow':'hidden','marginBottom':'2px'},
                                children=[html.Div(style={'height':'100%',
                                    'width':f"{r['ca']/prs['ca'].sum()*100:.0f}%",
                                    'background':PAL[i%len(PAL)],'borderRadius':'4px'})]),
                            html.Span(f"{r['ca']/prs['ca'].sum()*100:.1f}%",
                                style={'fontSize':'9px','color':PAL[i%len(PAL)],'fontWeight':'700'}),
                        ],style={**TD,'minWidth':'70px'}),
                    ]) for i,r in prs.reset_index(drop=True).iterrows()]),
                ],style={'width':'100%','borderCollapse':'collapse','fontSize':'12px'})
                ],style={'overflowX':'auto'}),
                html.Button(f"👁 Voir tous les produits ({int(fetch_count_produits(w,p))})",
                    id='btn-voir-produits',n_clicks=0,
                    style={'padding':'7px 16px','borderRadius':'20px','border':f"1px solid {GRN}",
                           'background':'white','color':GRN,'fontSize':'11px','fontWeight':'600',
                           'cursor':'pointer','fontFamily':'inherit','marginTop':'10px',
                           'display':'block','width':'100%','textAlign':'center'})
            ] if not prs.empty else [html.Div("Aucun produit",style={'color':MUT,'padding':'20px'})],
            {'flex':'1'}),
        ],style={'display':'flex','gap':'8px'}),

        # ── ROW 6 : Analyse par produit ───────────────
        *(_render_produit_analytics(w, p)),

    ],style={'display':'flex','flexDirection':'column','gap':'0'})


def _render_produit_analytics(w, p):
    """Section dédiée : évolution CA par produit + top clients par produit"""

    # Évolution mensuelle par produit (top 5)
    rows_evo = qry(f"""
        SELECT p.Nom pr, YEAR(f.DateFacture) an, MONTH(f.DateFacture) mo,
               SUM(lf.MontantHT) ca
        FROM lignefactures lf
        JOIN produits p ON lf.ProduitId=p.Id
        JOIN factures f ON lf.NumeroFacture=f.NumeroFacture
        JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY p.Id, p.Nom, an, mo
        ORDER BY ca DESC""", p)

    # Top clients par produit
    rows_cl_pr = qry(f"""
        SELECT p.Nom pr, t.Nom cl, SUM(lf.MontantHT) ca,
               SUM(lf.Quantite) qte, COUNT(DISTINCT f.NumeroFacture) nb
        FROM lignefactures lf
        JOIN produits p ON lf.ProduitId=p.Id
        JOIN factures f ON lf.NumeroFacture=f.NumeroFacture
        JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY p.Id, p.Nom, t.Id, t.Nom
        ORDER BY p.Nom, ca DESC""", p)

    if not rows_evo or not rows_cl_pr:
        return []

    df_evo = pd.DataFrame(rows_evo)
    df_evo['ca'] = df_evo['ca'].astype(float)
    df_evo['label'] = df_evo.apply(lambda r: f"{MOIS[int(r.mo)-1]} {str(int(r.an))[2:]}", axis=1)

    df_cl_pr = pd.DataFrame(rows_cl_pr)
    df_cl_pr['ca'] = df_cl_pr['ca'].astype(float)

    # Top 5 produits par CA total
    top5_pr = df_evo.groupby('pr')['ca'].sum().nlargest(5).index.tolist()

    # ── Graphe 1 : Évolution CA par produit (lignes) ──
    fig_evo_pr = go.Figure()
    for i, pr_name in enumerate(top5_pr):
        df_p = df_evo[df_evo['pr']==pr_name].sort_values(['an','mo'])
        fig_evo_pr.add_trace(go.Scatter(
            x=df_p['label'], y=df_p['ca'],
            name=pr_name[:20], mode='lines+markers',
            line=dict(color=PAL[i%len(PAL)], width=2.5),
            marker=dict(size=7, color=PAL[i%len(PAL)],
                       line=dict(color='white',width=2)),
            hovertemplate=f'<b>{pr_name[:20]}</b><br>%{{x}}<br>%{{y:,.3f}} DT<extra></extra>'))
    fig_evo_pr.update_layout(**make_fig(200,
        margin=dict(l=50,r=20,t=30,b=40),
        legend=dict(orientation='h',yanchor='bottom',y=1.02,
                    xanchor='right',x=1,bgcolor='rgba(0,0,0,0)',
                    font=dict(size=10,color=TXT))))

    # ── Graphe 2 : CA total par produit (barres) ──
    df_total_pr = df_evo.groupby('pr')['ca'].sum().reset_index().sort_values('ca',ascending=True)
    fig_bar_pr = go.Figure(go.Bar(
        y=df_total_pr['pr'].str.slice(0,22),
        x=df_total_pr['ca'],
        orientation='h',
        marker=dict(color=[PAL[i%len(PAL)] for i in range(len(df_total_pr))],
                    opacity=0.85),
        text=[fmtk(v)+' DT' for v in df_total_pr['ca']],
        textposition='outside',
        textfont=dict(color=TXT,size=9)))
    fig_bar_pr.update_layout(**make_fig(max(160,len(df_total_pr)*28),
        xaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                   tickfont=dict(color=MUT,size=9),showgrid=True,zeroline=False),
        yaxis=dict(tickfont=dict(color=TXT,size=10),showgrid=False,automargin=True),
        margin=dict(l=10,r=65,t=5,b=15),showlegend=False))

    # ── Graphe 3 : Top clients par produit (bubble/bar groupé) ──
    top3_pr = df_cl_pr.groupby('pr')['ca'].sum().nlargest(4).index.tolist()
    fig_cl_pr = go.Figure()
    for i, pr_name in enumerate(top3_pr):
        df_p = df_cl_pr[df_cl_pr['pr']==pr_name].head(4)
        fig_cl_pr.add_trace(go.Bar(
            name=pr_name[:18],
            x=df_p['cl'].str.slice(0,16),
            y=df_p['ca'],
            marker=dict(color=PAL[i%len(PAL)],opacity=0.85),
            text=[fmtk(v) for v in df_p['ca']],
            textposition='outside',
            textfont=dict(color=TXT,size=9),
            hovertemplate='<b>%{x}</b><br>%{y:,.3f} DT<extra></extra>'))
    fig_cl_pr.update_layout(**make_fig(200,
        barmode='group',
        margin=dict(l=20,r=20,t=30,b=50),
        xaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                   tickfont=dict(color=MUT,size=9),showgrid=False,
                   zeroline=False,tickangle=-20),
        yaxis=dict(gridcolor='#e2e8f0',linecolor='#94a3b8',
                   tickfont=dict(color=MUT,size=9),showgrid=True,zeroline=False)))

    # ── Tableau : Top 2 clients par produit ──
    rows_tbl=[]
    for i_pr, pr_name in enumerate(top5_pr):
        df_p = df_cl_pr[df_cl_pr['pr']==pr_name].head(2)
        total_pr = df_cl_pr[df_cl_pr['pr']==pr_name]['ca'].sum()
        clr_pr = PAL[i_pr%len(PAL)]
        rows_tbl.append(html.Tr([
            html.Td([
                html.Div(style={'width':'3px','height':'100%','background':clr_pr,
                    'position':'absolute','left':'0','top':'0','bottom':'0','borderRadius':'3px'}),
                html.Span(pr_name[:24],style={'fontWeight':'700','color':TXT,
                    'fontSize':'10px','paddingLeft':'8px'}),
            ],style={'background':'#f8f9fa','borderBottom':'2px solid #e8ecef',
                     'padding':'6px 8px','position':'relative'},
               colSpan=4),
        ]))
        for j,(_,r) in enumerate(df_p.iterrows()):
            rows_tbl.append(html.Tr([
                html.Td(html.Span(f"#{j+1}",style={'background':f"{PAL[j%3]}18",
                    'color':PAL[j%3],'padding':'1px 5px','borderRadius':'20px',
                    'fontSize':'9px','fontWeight':'800'}),
                    style={**TD,'padding':'5px 8px','paddingLeft':'18px'}),
                html.Td(str(r['cl'])[:20],style={**TD,'padding':'5px 8px'}),
                html.Td(f"{r['ca']:,.0f} DT",style={**TD,'fontWeight':'700',
                    'color':ACC,'padding':'5px 8px','whiteSpace':'nowrap'}),
                html.Td([
                    html.Div(style={'height':'3px','background':'#f0f2f5','borderRadius':'3px',
                        'overflow':'hidden','marginBottom':'1px'},
                        children=[html.Div(style={'height':'100%',
                            'width':f"{r['ca']/total_pr*100:.0f}%",
                            'background':clr_pr,'borderRadius':'3px'})]),
                    html.Span(f"{r['ca']/total_pr*100:.0f}%",
                        style={'fontSize':'9px','color':clr_pr,'fontWeight':'700'}),
                ],style={**TD,'padding':'5px 8px','minWidth':'55px'}),
            ]))

    return [
        # Séparateur
        html.Div(style={'borderTop':'2px solid #e8ecef','margin':'8px 0'}),

        # Titre section
        html.Div([
            html.Span('📦',style={'fontSize':'16px','marginRight':'8px'}),
            html.Span('ANALYSE PAR PRODUIT',style={'fontSize':'12px','fontWeight':'800',
                'color':TXT,'letterSpacing':'0.08em'}),
            html.Span(f" · {len(df_evo['pr'].unique())} produits actifs",
                style={'fontSize':'11px','color':MUT,'marginLeft':'8px'}),
        ],style={'padding':'4px 0 8px 0','display':'flex','alignItems':'center'}),

        # Row A : Évolution + Barres totales
        html.Div([
            card([
                html.Div('ÉVOLUTION CA PAR PRODUIT (TOP 5)',
                    style={'fontSize':'11px','fontWeight':'700','color':MUT,
                           'letterSpacing':'0.07em','marginBottom':'4px'}),
                G(fig_evo_pr,'200px'),
            ],{'flex':'2'}),
            card([
                html.Div('CA TOTAL PAR PRODUIT',
                    style={'fontSize':'11px','fontWeight':'700','color':MUT,
                           'letterSpacing':'0.07em','marginBottom':'4px'}),
                G(fig_bar_pr, f"{max(160,len(df_total_pr)*28)}px"),
            ],{'flex':'1'}),
        ],style={'display':'flex','gap':'8px','marginBottom':'8px'}),

        # Row B : Top clients par produit + tableau
        html.Div([
            card([
                html.Div('TOP CLIENTS PAR PRODUIT (TOP 4 PRODUITS)',
                    style={'fontSize':'11px','fontWeight':'700','color':MUT,
                           'letterSpacing':'0.07em','marginBottom':'4px'}),
                G(fig_cl_pr,'200px'),
            ],{'flex':'1.4'}),
            card([
                html.Div('DÉTAIL CLIENTS PAR PRODUIT',
                    style={'fontSize':'11px','fontWeight':'700','color':MUT,
                           'letterSpacing':'0.07em','marginBottom':'8px'}),
                html.Div([html.Table([
                    html.Thead(html.Tr([html.Th(h,style=TH) for h in
                        ['#','Client','CA HT','Part']])),
                    html.Tbody(rows_tbl),
                ],style={'width':'100%','borderCollapse':'collapse','fontSize':'11px'})],
                style={'overflowY':'auto','maxHeight':'230px'}),
            ],{'flex':'1'}),
        ],style={'display':'flex','gap':'8px','marginBottom':'8px'}),
    ]



# ── Modal callbacks ───────────────────────────────────
@app.callback(
    Output('modal-overlay','style'),
    Output('modal-title','children'),
    Output('modal-body','children'),
    Input('btn-modal-close','n_clicks'),
    Input('modal-overlay','n_clicks'),
    prevent_initial_call=True)
def cb_modal_close(n_close, n_ov):
    hidden={'position':'fixed','inset':'0','background':'rgba(0,0,0,0.5)',
            'zIndex':'9999','display':'none','alignItems':'center','justifyContent':'center'}
    return hidden,'',''

@app.callback(
    Output('modal-overlay','style',allow_duplicate=True),
    Output('modal-title','children',allow_duplicate=True),
    Output('modal-body','children',allow_duplicate=True),
    Input('btn-voir-clients','n_clicks'),
    State('st-per','data'),
    State('f-cl','value'),State('f-vi','value'),
    State('f-ty','value'),State('f-st','value'),
    State('f-tv','value'),State('f-mn','value'),State('f-mx','value'),
    prevent_initial_call=True)
def cb_modal_clients(n,per,cl,vi,ty,st,tv,mn,mx):
    if not n: raise dash.exceptions.PreventUpdate
    shown={'position':'fixed','inset':'0','background':'rgba(0,0,0,0.5)',
           'zIndex':'9999','display':'flex','alignItems':'center','justifyContent':'center'}
    w,p=build_where(per,None,None,cl,vi,ty,st,tv,mn,mx)
    rows=qry(f"""SELECT t.Nom cl,t.Ville vi,t.MatriculeFiscal mf,
        COUNT(f.NumeroFacture) nb,SUM(f.TotalHT) ca,
        AVG(f.MontantTTC) pan,MAX(f.DateFacture) last_date
        FROM factures f JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY t.Id,t.Nom,t.Ville,t.MatriculeFiscal
        ORDER BY ca DESC""",p)
    df=pd.DataFrame(rows)
    if df.empty:
        return shown,'Tous les clients',[html.Div("Aucun client",style={'color':MUT,'padding':'20px','textAlign':'center'})]
    total=df['ca'].astype(float).sum()
    body=html.Div([
        html.Div(f"{len(df)} clients · CA total : {fmtk(total)} DT",
            style={'fontSize':'12px','color':MUT,'marginBottom':'8px'}),
        html.Table([
            html.Thead(html.Tr([html.Th(h,style=TH) for h in
                ['#','Client','Gouvernorat','Mat. Fiscal','Factures','CA HT (DT)','Panier moy.','Dernière fact.','Part']])),
            html.Tbody([html.Tr([
                html.Td(html.Span(f"#{i+1}",style={'background':f"{PAL[i%len(PAL)]}18",
                    'color':PAL[i%len(PAL)],'padding':'1px 7px','borderRadius':'20px',
                    'fontSize':'10px','fontWeight':'800'}),style=TD),
                html.Td(str(r['cl']),style={**TD,'fontWeight':'600'}),
                html.Td(str(r.get('vi','—') or '—'),style={**TD,'color':MUT}),
                html.Td(str(r.get('mf','—') or '—'),style={**TD,'color':MUT,'fontSize':'10px'}),
                html.Td(str(int(r['nb'])),style={**TD,'textAlign':'center'}),
                html.Td(f"{float(r['ca']):,.3f}",style={**TD,'fontWeight':'800','color':ACC}),
                html.Td(f"{float(r['pan']):,.3f}",style={**TD,'color':PRP}),
                html.Td(str(r.get('last_date','—'))[:10] if r.get('last_date') else '—',
                    style={**TD,'fontSize':'11px','color':MUT}),
                html.Td([
                    html.Div(style={'height':'4px','background':'#f0f2f5','borderRadius':'4px',
                        'overflow':'hidden','marginBottom':'2px'},
                        children=[html.Div(style={'height':'100%',
                            'width':f"{float(r['ca'])/total*100:.1f}%",
                            'background':PAL[i%len(PAL)],'borderRadius':'4px'})]),
                    html.Span(f"{float(r['ca'])/total*100:.1f}%",
                        style={'fontSize':'9px','color':PAL[i%len(PAL)],'fontWeight':'700'}),
                ],style={**TD,'minWidth':'70px'}),
            ]) for i,r in df.reset_index(drop=True).iterrows()])
        ],style={'width':'100%','borderCollapse':'collapse','fontSize':'12px'})
    ])
    return shown,f"👥 Tous les clients ({len(df)})",body

@app.callback(
    Output('modal-overlay','style',allow_duplicate=True),
    Output('modal-title','children',allow_duplicate=True),
    Output('modal-body','children',allow_duplicate=True),
    Input('btn-voir-produits','n_clicks'),
    State('st-per','data'),
    State('f-cl','value'),State('f-vi','value'),
    State('f-ty','value'),State('f-st','value'),
    State('f-tv','value'),State('f-mn','value'),State('f-mx','value'),
    prevent_initial_call=True)
def cb_modal_produits(n,per,cl,vi,ty,st,tv,mn,mx):
    if not n: raise dash.exceptions.PreventUpdate
    shown={'position':'fixed','inset':'0','background':'rgba(0,0,0,0.5)',
           'zIndex':'9999','display':'flex','alignItems':'center','justifyContent':'center'}
    w,p=build_where(per,None,None,cl,vi,ty,st,tv,mn,mx)
    rows=qry(f"""SELECT p.Nom pr,p.ItemCode code,p.UniteMessure um,
        SUM(lf.Quantite) qte,SUM(lf.MontantHT) ca,
        AVG(lf.PrixUnitaire) pu,COUNT(DISTINCT f.NumeroFacture) nb_f,
        COUNT(DISTINCT f.TiersId) nb_cl
        FROM lignefactures lf JOIN produits p ON lf.ProduitId=p.Id
        JOIN factures f ON lf.NumeroFacture=f.NumeroFacture
        JOIN tiers t ON f.TiersId=t.Id
        {w} {'AND' if w else 'WHERE'} f.Statut='AcceptéeTTN'
        GROUP BY p.Id,p.Nom,p.ItemCode,p.UniteMessure
        ORDER BY ca DESC""",p)
    df=pd.DataFrame(rows)
    if df.empty:
        return shown,'Tous les produits',[html.Div("Aucun produit",style={'color':MUT,'padding':'20px','textAlign':'center'})]
    total=df['ca'].astype(float).sum()
    body=html.Div([
        html.Div(f"{len(df)} produits · CA total : {fmtk(total)} DT",
            style={'fontSize':'12px','color':MUT,'marginBottom':'8px'}),
        html.Table([
            html.Thead(html.Tr([html.Th(h,style=TH) for h in
                ['#','Produit','Code','Unité','Qté','Factures','Clients','Prix moy.','CA HT (DT)','Part']])),
            html.Tbody([html.Tr([
                html.Td(html.Span(f"#{i+1}",style={'background':f"{PAL[i%len(PAL)]}18",
                    'color':PAL[i%len(PAL)],'padding':'1px 7px','borderRadius':'20px',
                    'fontSize':'10px','fontWeight':'800'}),style=TD),
                html.Td(str(r['pr']),style={**TD,'fontWeight':'600'}),
                html.Td(str(r.get('code','—') or '—'),style={**TD,'color':MUT,'fontSize':'10px'}),
                html.Td(str(r.get('um','—') or '—'),style={**TD,'color':MUT,'fontSize':'10px'}),
                html.Td(str(int(r['qte'])),style={**TD,'textAlign':'center'}),
                html.Td(str(int(r['nb_f'])),style={**TD,'textAlign':'center'}),
                html.Td(str(int(r['nb_cl'])),style={**TD,'textAlign':'center'}),
                html.Td(f"{float(r['pu']):,.3f}",style={**TD,'color':YLW}),
                html.Td(f"{float(r['ca']):,.3f}",style={**TD,'fontWeight':'800','color':ACC}),
                html.Td([
                    html.Div(style={'height':'4px','background':'#f0f2f5','borderRadius':'4px',
                        'overflow':'hidden','marginBottom':'2px'},
                        children=[html.Div(style={'height':'100%',
                            'width':f"{float(r['ca'])/total*100:.1f}%",
                            'background':PAL[i%len(PAL)],'borderRadius':'4px'})]),
                    html.Span(f"{float(r['ca'])/total*100:.1f}%",
                        style={'fontSize':'9px','color':PAL[i%len(PAL)],'fontWeight':'700'}),
                ],style={**TD,'minWidth':'70px'}),
            ]) for i,r in df.reset_index(drop=True).iterrows()])
        ],style={'width':'100%','borderCollapse':'collapse','fontSize':'12px'})
    ])
    return shown,f"📦 Tous les produits ({len(df)})",body


# ── Callback PDF ──────────────────────────────────────
@app.callback(
    Output('download-pdf','data'),
    Input('btn-pdf','n_clicks'),
    State('st-per','data'),
    prevent_initial_call=True)
def cb_pdf(n, per):
    if not n:
        raise dash.exceptions.PreventUpdate
    try:
        from export_pdf import generate_pdf
        import base64
        pdf_bytes = generate_pdf(periode=per or 'tout')
        filename = f"ElFatoora_BI_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        return dict(
            content=base64.b64encode(pdf_bytes).decode(),
            filename=filename,
            base64=True,
            type='application/pdf')
    except Exception as e:
        print(f"PDF err: {e}")
        import traceback; traceback.print_exc()
        raise dash.exceptions.PreventUpdate


if __name__=='__main__':
    print("="*55)
    print("  El Fatoora BI Dashboard — Power BI Style")
    print("  Filtres connectés · Page unique dense")
    print("  http://localhost:8050")
    print("="*55)
    app.run(debug=False,host='0.0.0.0',port=8050)