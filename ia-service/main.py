import smtplib
import re
import json
import subprocess
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, Query, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import mysql.connector
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from dotenv import load_dotenv
import os
from datetime import datetime, date
from typing import Optional
import tempfile
from io import BytesIO

load_dotenv()

app = FastAPI(title="El Fatoora IA Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5170"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lancement automatique du Dashboard Dash ───────────────────────────────────
def _start_dashboard():
    try:
        dashboard_path = os.path.join(os.path.dirname(__file__), "dashboard.py")
        if os.path.exists(dashboard_path):
            subprocess.Popen(
                [sys.executable, dashboard_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            print("✅ Dashboard BI démarré sur http://localhost:8050")
        else:
            print("⚠️  dashboard.py introuvable")
    except Exception as e:
        print(f"⚠️  Impossible de démarrer le dashboard : {e}")

_start_dashboard()

# ── Endpoint export PDF ───────────────────────────────
@app.get("/bi/export-pdf")
def export_pdf(
    periode: str = Query(default="tout"),
    client_id: Optional[int] = Query(default=None)):
    """Génère et télécharge le résumé BI en PDF"""
    try:
        from export_pdf import generate_pdf
        pdf_bytes = generate_pdf(periode=periode, client_id=client_id)
        filename = f"ElFatoora_BI_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur PDF : {str(e)}")

def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        database=os.getenv("DB_NAME", "efacturation_db"),
        user=os.getenv("DB_USER", "pfe"),
        password=os.getenv("DB_PASSWORD", ""),
        auth_plugin='caching_sha2_password'
    )

def build_date_filter(
    periode=None, date_debut=None, date_fin=None,
    mois=None, annee=None, nb_mois=None
):
    if date_debut and date_fin:
        return f"AND DateFacture BETWEEN '{date_debut}' AND '{date_fin}'"
    if periode:
        if periode == "7j":      return "AND DateFacture >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        elif periode == "30j":   return "AND DateFacture >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        elif periode == "90j":   return "AND DateFacture >= DATE_SUB(NOW(), INTERVAL 90 DAY)"
        elif periode == "6mois": return "AND DateFacture >= DATE_SUB(NOW(), INTERVAL 6 MONTH)"
        elif periode == "1an":   return "AND DateFacture >= DATE_SUB(NOW(), INTERVAL 1 YEAR)"
        elif periode == "tout":  return ""
    if mois and annee:
        return f"AND MONTH(DateFacture) = {mois} AND YEAR(DateFacture) = {annee}"
    if annee and not mois:
        return f"AND YEAR(DateFacture) = {annee}"
    if nb_mois:
        return f"AND DateFacture >= DATE_SUB(NOW(), INTERVAL {nb_mois} MONTH)"
    return "AND DateFacture >= DATE_SUB(NOW(), INTERVAL 30 DAY)"


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok", "service": "El Fatoora IA", "version": "2.0.0",
        "filtres_disponibles": ["periode", "date_debut+date_fin", "mois+annee", "annee", "nb_mois"]
    }


# ═════════════════════════════════════════════════════════════════════════════
#  IMPORT PDF — Extraction automatique avec pdfplumber
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/import/pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """
    Extraction universelle via OpenRouter (Gemini Flash).
    Fonctionne avec tous types de PDFs tunisiens.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Fichier PDF requis.")

    content = await file.read()

    try:
        import base64, json, re, httpx

        OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")
        pdf_b64 = base64.b64encode(content).decode()

        prompt = """Tu es un expert en factures tunisiennes. Analyse ce PDF et extrais les informations.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans balises markdown.

{
  "client": "nom complet du client destinataire (pas le fournisseur émetteur)",
  "date": "date de facture au format YYYY-MM-DD",
  "numeroFacture": "numéro de facture",
  "totalHT": 0.000,
  "tva": 0.000,
  "timbre": 0.600,
  "totalTTC": 0.000,
  "designation": "description du service ou produit principal",
  "tauxTVA": 19
}

Règles importantes:
- Le CLIENT est le DESTINATAIRE (celui qui reçoit la facture et paie), PAS l'émetteur/fournisseur
- Les montants sont en dinars tunisiens
- Pour totalTTC: cherche "montant TTC", "total TTC", "montant à payer", "net facture", "montant TTC"
- Pour totalHT: cherche "total HT", "hors taxes", "total H.T.", "total hors taxes"
- Si timbre absent, mets 0.600
- tauxTVA: 7, 13 ou 19
"""

        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "El Fatoora PFE",
            },
            json={
                "model": "google/gemini-2.5-flash-lite",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "document",
                                "source": {
                                    "type": "base64",
                                    "media_type": "application/pdf",
                                    "data": pdf_b64
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 500,
            },
            timeout=120.0
        )

        # Log debug si erreur OpenRouter
        if response.status_code != 200:
            print(f"DEBUG OpenRouter PDF: {response.text}")

        if response.status_code != 200:
            raise Exception(f"OpenRouter error {response.status_code}: {response.text}")


        result = response.json()
        text = result["choices"][0]["message"]["content"].strip()

        # Nettoyer la réponse
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)

        data = json.loads(text)

        # Valeurs extraites
        client_nom   = str(data.get("client") or "Client inconnu").strip()
        raw_date     = data.get("date") or ""
        # Convertir tous les formats de date en YYYY-MM-DD
        date_facture = datetime.now().strftime("%Y-%m-%d")
        if raw_date:
            for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%m/%d/%Y"]:
                try:
                    parsed = datetime.strptime(raw_date, fmt)
                    # Si date > 1 an → aujourd'hui
                    if parsed < datetime.now().replace(year=datetime.now().year - 1):
                        date_facture = datetime.now().strftime("%Y-%m-%d")
                    else:
                        date_facture = parsed.strftime("%Y-%m-%d")
                    break
                except:
                    continue
        montant_ht   = float(data.get("totalHT")  or 0)
        tva_val      = float(data.get("tva")       or 0)
        timbre_val   = float(data.get("timbre")    or 0.6)
        ttc_val      = float(data.get("totalTTC")  or 0)
        designation  = str(data.get("designation") or "Service importé")[:200]
        taux_tva     = int(data.get("tauxTVA")     or 19)
        num_origine  = data.get("numeroFacture")

        # Calculs si manquants
        if montant_ht <= 0 and ttc_val > 0:
            montant_ht = round(ttc_val / (1 + taux_tva / 100), 3)
        if tva_val <= 0 and montant_ht > 0:
            tva_val = round(montant_ht * taux_tva / 100, 3)
        montant_ht = round(montant_ht, 3)
        tva_val    = round(tva_val, 3)
        timbre_val = round(timbre_val, 3)
        ttc_final  = round(montant_ht + tva_val + timbre_val, 3)

        if montant_ht <= 0:
            return {
                "success": False,
                "message": "Impossible de détecter les montants dans ce PDF.",
                "nbFacturesCreees": 0, "factures": [],
                "debug": text
            }

        # Créer en BD
        db  = get_db()
        cur = db.cursor()

        cur.execute("SELECT Id FROM tiers WHERE Nom = %s LIMIT 1", (client_nom,))
        row = cur.fetchone()
        if row:
            tiers_id = row[0]
        else:
            cur.execute("INSERT INTO tiers (Nom, Adresse, DateCreation, TypeIdentifiant) VALUES (%s, '', NOW(), 'I-01')", (client_nom,))
            db.commit()
            tiers_id = cur.lastrowid

        cur.execute("SELECT Id FROM produits LIMIT 1")
        pr = cur.fetchone()
        produit_id = pr[0] if pr else 1

        cur.execute("""
            INSERT INTO factures
                (DateFacture, DateValidation, TypeDocument, TimbreFiscal, MontantTimbre,
                 RemiseGlobale, MontantRemise, TotalHTAvantRemise, TotalHT, TotalTVA,
                 MontantTTC, MontantEnLettres, Statut, TiersId)
            VALUES (%s, NULL, 'I-11', 1, %s, 0.00, 0.000, %s, %s, %s, %s, 'IMPORTÉ PDF', 'Brouillon', %s)
        """, (date_facture, timbre_val, montant_ht, montant_ht, tva_val, ttc_final, tiers_id))
        db.commit()
        facture_id = cur.lastrowid

        cur.execute("""
            INSERT INTO lignefactures
                (Designation, Quantite, PrixUnitaire, RemiseLigne,
                 MontantHT, TauxTVA, MontantTVA, MontantTTC, NumeroFacture, ProduitId)
            VALUES (%s, 1, %s, 0.00, %s, %s, %s, %s, %s, %s)
        """, (designation, montant_ht, montant_ht, float(taux_tva), tva_val,
              round(montant_ht + tva_val, 3), facture_id, produit_id))
        db.commit()
        cur.close()
        db.close()

        return {
            "success": True,
            "message": "1 facture créée en brouillon via IA.",
            "nbFacturesCreees": 1,
            "factures": [{
                "numeroFacture": facture_id,
                "client":        client_nom,
                "date":          date_facture,
                "numOrigine":    num_origine,
                "totalHT":       montant_ht,
                "montantTTC":    ttc_final,
                "nbLignes":      1,
            }],
        }

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON invalide: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")





@app.post("/import/excel")
async def import_excel(file: UploadFile = File(...)):
    """
    Import Excel/CSV universel — détection automatique des colonnes via IA (OpenRouter).
    Fonctionne avec n'importe quel format de colonnes client.
    """
    allowed = [".xlsx", ".xls", ".csv"]
    ext     = os.path.splitext(file.filename.lower())[1]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Fichier Excel (.xlsx, .xls) ou CSV requis.")

    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        import httpx

        # ── 1. Lire le fichier ──────────────────────────────────────────
        if ext == ".csv":
            try:    df = pd.read_csv(tmp_path, encoding="utf-8")
            except: df = pd.read_csv(tmp_path, encoding="latin-1")
        else:
            df = pd.read_excel(tmp_path)

        df.columns = [str(c).strip() for c in df.columns]
        df = df.dropna(how="all")

        if df.empty:
            return {"success": False, "message": "Fichier vide.", "nbFacturesCreees": 0}

        # ── 2. Détecter colonnes via OpenRouter IA ─────────────────────
        headers     = list(df.columns)
        sample_rows = df.head(3).to_dict(orient="records")

        OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")

        prompt = f"""Tu es un expert en facturation tunisienne. Voici les colonnes d'un fichier Excel et quelques exemples de données.
Identifie à quelle colonne correspond chaque champ de facture.

Colonnes disponibles : {headers}

Exemples de données :
{sample_rows[:2]}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown), avec les clés suivantes.
Si une colonne n'existe pas, mets null.

{{
  "client": "nom exact de la colonne client/acheteur/destinataire",
  "matricule": "nom exact de la colonne matricule fiscal/identifiant",
  "date": "nom exact de la colonne date de facture",
  "designation": "nom exact de la colonne désignation/article/produit/service/description",
  "quantite": "nom exact de la colonne quantité/qté/nb",
  "prix": "nom exact de la colonne prix unitaire HT/PU/tarif",
  "tva": "nom exact de la colonne taux TVA/%",
  "remise": "nom exact de la colonne remise/%",
  "numeroFacture": "nom exact de la colonne numéro de facture"
}}"""

        mapping = {}
        try:
            response = httpx.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={{
                    "Authorization": f"Bearer {{OPENROUTER_KEY}}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "El Fatoora PFE",
                }},
                json={{
                    "model": "mistralai/mistral-7b-instruct:free",
                    "messages": [{{"role": "user", "content": prompt}}],
                    "max_tokens": 300,
                }},
                timeout=30.0
            )
            if response.status_code == 200:
                text = response.json()["choices"][0]["message"]["content"].strip()
                import re as _re
                text = _re.sub(r'^\`\`\`(?:json)?\s*', '', text)
                text = _re.sub(r'\s*\`\`\`$', '', text)
                mapping = json.loads(text)
        except Exception as e:
            print(f"OpenRouter mapping failed: {e}, falling back to heuristic")

        # ── 3. Fallback heuristique si IA échoue ──────────────────────
        def find_col(keywords):
            for col in df.columns:
                if any(k.lower() in col.lower() for k in keywords):
                    return col
            return None

        col_client  = mapping.get("client")      or find_col(["client","acheteur","tiers","société","nom client","destinataire","raison","customer","buyer","company","entreprise","nom"])
        col_mat     = mapping.get("matricule")   or find_col(["matricule","mf","identifiant","fiscal","tax id","taxid","vat","siret","rc"])
        col_date    = mapping.get("date")        or find_col(["date","date facture","date de facturation","invoice date","factdate"])
        col_desig   = mapping.get("designation") or find_col(["désignation","designation","produit","article","service","libellé","description","item","item description","libelle","prestation"])
        col_qty     = mapping.get("quantite")    or find_col(["quantité","quantite","qté","qty","qte","nb","nombre","quantity","quantit"])
        col_prix    = mapping.get("prix")        or find_col(["prix unitaire","prix ht","pu","unit price","tarif","prix","price","pu ht","unitprice","p.u"])
        col_tva     = mapping.get("tva")         or find_col(["tva","vat","taxe","taux tva","tax rate","tax%","vat rate","vatrate","taux"])
        col_remise  = mapping.get("remise")      or find_col(["remise","discount","rabais","réduction","reduction","remise%"])
        col_numfact = mapping.get("numeroFacture") or find_col(["numéro","numero","n° facture","num facture","facture n°","ref","invoice number","invoicenumber","invoice no","facnum"])

        if not col_desig and not col_prix:
            return {
                "success": False,
                "message": f"Colonnes non reconnues même après analyse IA. Colonnes détectées : {headers}",
                "colonnesDetectees": headers,
                "nbFacturesCreees": 0
            }

        # ── 4. Construire les factures ─────────────────────────────────
        db  = get_db()
        cur = db.cursor()
        factures_creees = []

        # Grouper par client si possible, sinon une seule facture
        if col_client:
            groupes = df.groupby(col_client, sort=False)
        else:
            df["__client__"] = "Client importé"
            groupes = df.groupby("__client__", sort=False)

        for client_nom, groupe in groupes:
            client_nom = str(client_nom).strip()
            if not client_nom or client_nom.lower() in ["nan", "none", ""]:
                client_nom = "Client inconnu"

            # Chercher/créer le tiers
            matricule_val = None
            if col_mat and not groupe[col_mat].isna().all():
                matricule_val = str(groupe[col_mat].iloc[0]).strip()
                if matricule_val.lower() in ["nan", "none", ""]:
                    matricule_val = None

            cur.execute("SELECT Id FROM tiers WHERE Nom = %s LIMIT 1", (client_nom,))
            row = cur.fetchone()
            if row:
                tiers_id = row[0]
                # Mettre à jour le matricule si disponible
                if matricule_val:
                    cur.execute("UPDATE tiers SET MatriculeFiscal = %s WHERE Id = %s AND (MatriculeFiscal IS NULL OR MatriculeFiscal = '')", (matricule_val, tiers_id))
                    db.commit()
            else:
                cur.execute("""
                    INSERT INTO tiers (Nom, MatriculeFiscal, Adresse, DateCreation, TypeIdentifiant)
                    VALUES (%s, %s, '', NOW(), 'I-01')
                """, (client_nom, matricule_val))
                db.commit()
                tiers_id = cur.lastrowid

            cur.execute("SELECT Id FROM produits LIMIT 1")
            pr = cur.fetchone()
            produit_id = pr[0] if pr else 1

            lignes      = []
            total_ht    = 0.0
            total_tva   = 0.0
            date_fact   = datetime.now().strftime("%Y-%m-%d")
            num_fact_src = None

            for _, row in groupe.iterrows():
                # Désignation
                designation = str(row[col_desig]).strip() if col_desig else "Service"
                if not designation or designation.lower() in ["nan", "none"]:
                    continue

                # Quantité
                quantite = 1
                if col_qty:
                    try: quantite = max(1, int(float(str(row[col_qty]).replace(",", "."))))
                    except: quantite = 1

                # Prix unitaire
                prix_unitaire = 0.0
                if col_prix:
                    try: prix_unitaire = float(str(row[col_prix]).replace(",", ".").replace(" ","").replace("DT","").replace("TND","").replace("€",""))
                    except: prix_unitaire = 0.0

                # TVA
                taux_tva = 19.0
                if col_tva:
                    try:
                        tv = float(str(row[col_tva]).replace(",",".").replace("%","").strip())
                        taux_tva = tv if tv > 1 else tv * 100
                    except: taux_tva = 19.0

                # Remise
                remise = 0.0
                if col_remise:
                    try: remise = float(str(row[col_remise]).replace(",",".").replace("%","").strip())
                    except: remise = 0.0

                # Date
                if col_date:
                    try:
                        dv = pd.to_datetime(row[col_date], dayfirst=True)
                        an_avant = datetime.now().replace(year=datetime.now().year - 1)
                        if dv.to_pydatetime() > an_avant:
                            date_fact = dv.strftime("%Y-%m-%d")
                    except: pass

                # Numéro facture source
                if col_numfact and num_fact_src is None:
                    try: num_fact_src = str(row[col_numfact]).strip()
                    except: pass

                montant_ht  = round(prix_unitaire * quantite * (1 - remise/100), 3)
                montant_tva = round(montant_ht * (taux_tva / 100), 3)
                montant_ttc = round(montant_ht + montant_tva, 3)
                total_ht   += montant_ht
                total_tva  += montant_tva

                lignes.append({
                    "designation":  designation,
                    "quantite":     quantite,
                    "prixUnitaire": round(prix_unitaire, 3),
                    "remiseLigne":  remise,
                    "montantHT":    montant_ht,
                    "tauxTVA":      taux_tva,
                    "montantTVA":   montant_tva,
                    "montantTTC":   montant_ttc,
                    "produitId":    produit_id,
                })

            if not lignes:
                continue

            total_ht    = round(total_ht, 3)
            total_tva   = round(total_tva, 3)
            montant_ttc = round(total_ht + total_tva + 0.6, 3)

            cur.execute("""
                INSERT INTO factures
                    (DateFacture, DateValidation, TypeDocument, TimbreFiscal, MontantTimbre,
                     RemiseGlobale, MontantRemise, TotalHTAvantRemise, TotalHT, TotalTVA,
                     MontantTTC, MontantEnLettres, Statut, TiersId)
                VALUES (%s, NULL, 'I-11', 1, 0.600, 0.00, 0.000, %s, %s, %s, %s, 'IMPORTÉ EXCEL', 'Brouillon', %s)
            """, (date_fact, total_ht, total_ht, total_tva, montant_ttc, tiers_id))
            db.commit()
            facture_id = cur.lastrowid

            for ligne in lignes:
                cur.execute("""
                    INSERT INTO lignefactures
                        (Designation, Quantite, PrixUnitaire, RemiseLigne,
                         MontantHT, TauxTVA, MontantTVA, MontantTTC, NumeroFacture, ProduitId)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (ligne["designation"], ligne["quantite"], ligne["prixUnitaire"],
                      ligne["remiseLigne"], ligne["montantHT"], ligne["tauxTVA"],
                      ligne["montantTVA"], ligne["montantTTC"], facture_id, ligne["produitId"]))
            db.commit()

            factures_creees.append({
                "numeroFacture": facture_id,
                "client":        client_nom,
                "matricule":     matricule_val,
                "date":          date_fact,
                "numOrigine":    num_fact_src,
                "totalHT":       total_ht,
                "montantTTC":    montant_ttc,
                "nbLignes":      len(lignes),
            })

        cur.close()
        db.close()

        return {
            "success":          True,
            "message":          f"{len(factures_creees)} facture(s) créée(s) en brouillon.",
            "nbFacturesCreees": len(factures_creees),
            "nbLignesTraitees": sum(f["nbLignes"] for f in factures_creees),
            "mappingDetecte": {
                "client": col_client, "designation": col_desig,
                "quantite": col_qty, "prix": col_prix,
                "tva": col_tva, "remise": col_remise,
                "date": col_date, "matricule": col_mat,
            },
            "factures": factures_creees,
        }

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: os.unlink(tmp_path)
        except: pass


@app.get("/predict/ca")
def predict_ca(
    nb_mois: Optional[int] = Query(None),
    annee:   Optional[int] = Query(None),
    periode: Optional[str] = Query(None)
):
    try:
        filtre = build_date_filter(periode=periode, annee=annee, nb_mois=nb_mois)
        db  = get_db(); cur = db.cursor(dictionary=True)
        cur.execute(f"""
            SELECT YEAR(DateFacture) AS annee, MONTH(DateFacture) AS mois, SUM(TotalHT) AS caHT
            FROM factures
            WHERE Statut = 'AcceptéeTTN' {filtre}
            GROUP BY YEAR(DateFacture), MONTH(DateFacture)
            ORDER BY annee, mois
        """)
        rows = cur.fetchall(); cur.close(); db.close()

        if len(rows) < 2:
            return {"prediction": 0, "message": "Données insuffisantes (minimum 2 mois requis)",
                    "historique": rows, "confiance": 0, "tendance": "neutre"}

        df = pd.DataFrame(rows)
        df["index"] = range(len(df))
        X = df[["index"]].values; y = df["caHT"].values.astype(float)
        model = LinearRegression(); model.fit(X, y)
        prediction = max(0, round(float(model.predict(np.array([[len(df)]]))[0]), 3))
        confiance  = round(max(0, min(100, model.score(X, y) * 100)), 1)
        tendance   = "hausse" if model.coef_[0] > 0 else ("baisse" if model.coef_[0] < 0 else "stable")
        now        = datetime.now()

        return {
            "prediction": prediction,
            "moisProchain": now.month % 12 + 1,
            "anneeProchaine": now.year + (1 if now.month == 12 else 0),
            "confiance": confiance, "tendance": tendance,
            "historique": rows, "nbMoisAnalyses": len(rows),
            "message": f"Prédiction basée sur {len(rows)} mois d'historique"
        }
    except Exception as e:
        return {"error": str(e), "prediction": 0}


# ── Top 5 clients ─────────────────────────────────────────────────────────────
@app.get("/bi/top-clients")
def top_clients(
    periode: Optional[str] = Query(None), date_debut: Optional[str] = Query(None),
    date_fin: Optional[str] = Query(None), mois: Optional[int] = Query(None),
    annee: Optional[int] = Query(None), nb_mois: Optional[int] = Query(None),
    limit: int = Query(5)
):
    try:
        filtre = build_date_filter(periode, date_debut, date_fin, mois, annee, nb_mois)
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute(f"""
            SELECT t.Nom AS nomClient, COUNT(f.NumeroFacture) AS nbFactures,
                   SUM(f.TotalHT) AS caTotal, SUM(f.MontantTTC) AS ttcTotal, AVG(f.MontantTTC) AS panierMoyen
            FROM factures f JOIN tiers t ON f.TiersId = t.Id
            WHERE f.Statut = 'AcceptéeTTN' {filtre}
            GROUP BY t.Id, t.Nom ORDER BY caTotal DESC LIMIT {limit}
        """)
        rows = cur.fetchall(); cur.close(); db.close()
        for r in rows:
            r["caTotal"]     = round(float(r["caTotal"]     or 0), 3)
            r["ttcTotal"]    = round(float(r["ttcTotal"]    or 0), 3)
            r["panierMoyen"] = round(float(r["panierMoyen"] or 0), 3)
        return {"topClients": rows, "filtre": filtre or "tout"}
    except Exception as e:
        return {"error": str(e), "topClients": []}


# ── Top produits vendus ───────────────────────────────────────────────────────
@app.get("/bi/top-produits")
def top_produits(
    periode: Optional[str] = Query(None), date_debut: Optional[str] = Query(None),
    date_fin: Optional[str] = Query(None), mois: Optional[int] = Query(None),
    annee: Optional[int] = Query(None), nb_mois: Optional[int] = Query(None),
    limit: int = Query(5)
):
    try:
        filtre = build_date_filter(periode, date_debut, date_fin, mois, annee, nb_mois)
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute(f"""
            SELECT p.Nom AS nomProduit, SUM(lf.Quantite) AS qteTotale,
                   SUM(lf.MontantHT) AS caHT, COUNT(DISTINCT f.NumeroFacture) AS nbFactures,
                   AVG(lf.PrixUnitaire) AS prixMoyen
            FROM lignefactures lf
            JOIN produits p ON lf.ProduitId = p.Id
            JOIN factures f ON lf.NumeroFacture = f.NumeroFacture
            WHERE f.Statut = 'AcceptéeTTN' {filtre}
            GROUP BY p.Id, p.Nom ORDER BY qteTotale DESC LIMIT {limit}
        """)
        rows = cur.fetchall(); cur.close(); db.close()
        for r in rows:
            r["caHT"]      = round(float(r["caHT"]      or 0), 3)
            r["prixMoyen"] = round(float(r["prixMoyen"] or 0), 3)
        return {"topProduits": rows, "filtre": filtre or "tout"}
    except Exception as e:
        return {"error": str(e), "topProduits": []}


# ── Évolution CA mensuelle ────────────────────────────────────────────────────
@app.get("/bi/evolution-ca")
def evolution_ca(
    periode: Optional[str] = Query(None), date_debut: Optional[str] = Query(None),
    date_fin: Optional[str] = Query(None), annee: Optional[int] = Query(None),
    nb_mois: Optional[int] = Query(None)
):
    try:
        filtre = build_date_filter(periode, date_debut, date_fin, None, annee, nb_mois)
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute(f"""
            SELECT YEAR(DateFacture) AS annee, MONTH(DateFacture) AS mois,
                   SUM(TotalHT) AS caHT, SUM(MontantTTC) AS caTTC, COUNT(*) AS nbFactures
            FROM factures
            WHERE Statut = 'AcceptéeTTN' {filtre}
            GROUP BY YEAR(DateFacture), MONTH(DateFacture)
            ORDER BY annee, mois
        """)
        rows = cur.fetchall(); cur.close(); db.close()
        for r in rows:
            r["caHT"]  = round(float(r["caHT"]  or 0), 3)
            r["caTTC"] = round(float(r["caTTC"] or 0), 3)
        return {"evolution": rows, "filtre": filtre or "tout", "nbMois": len(rows)}
    except Exception as e:
        return {"error": str(e), "evolution": []}


# ── Panier moyen par client ───────────────────────────────────────────────────
@app.get("/bi/panier-moyen")
def panier_moyen(
    periode: Optional[str] = Query(None), date_debut: Optional[str] = Query(None),
    date_fin: Optional[str] = Query(None), mois: Optional[int] = Query(None),
    annee: Optional[int] = Query(None), nb_mois: Optional[int] = Query(None)
):
    try:
        filtre = build_date_filter(periode, date_debut, date_fin, mois, annee, nb_mois)
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute(f"""
            SELECT t.Nom AS nomClient, COUNT(f.NumeroFacture) AS nbFactures,
                   AVG(f.MontantTTC) AS panierMoyen,
                   MIN(f.MontantTTC) AS minFacture, MAX(f.MontantTTC) AS maxFacture
            FROM factures f JOIN tiers t ON f.TiersId = t.Id
            WHERE f.Statut = 'AcceptéeTTN' {filtre}
            GROUP BY t.Id, t.Nom HAVING COUNT(f.NumeroFacture) > 0
            ORDER BY panierMoyen DESC LIMIT 10
        """)
        rows = cur.fetchall(); cur.close(); db.close()
        for r in rows:
            r["panierMoyen"] = round(float(r["panierMoyen"] or 0), 3)
            r["minFacture"]  = round(float(r["minFacture"]  or 0), 3)
            r["maxFacture"]  = round(float(r["maxFacture"]  or 0), 3)

        db2 = get_db(); cur2 = db2.cursor(dictionary=True)
        cur2.execute(f"SELECT AVG(MontantTTC) AS panierGlobal FROM factures WHERE Statut = 'AcceptéeTTN' {filtre}")
        global_row    = cur2.fetchone(); cur2.close(); db2.close()
        panier_global = round(float(global_row["panierGlobal"] or 0), 3) if global_row and global_row["panierGlobal"] else 0

        return {"panierMoyenGlobal": panier_global, "parClient": rows, "filtre": filtre or "tout"}
    except Exception as e:
        return {"error": str(e), "parClient": []}


# ── Envoi email credentials employé ──────────────────────────────────────────
@app.post("/send-email")
def send_email(data: dict):
    try:
        email_host     = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        email_port     = int(os.getenv("EMAIL_PORT", 587))
        email_user     = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD", "").replace(" ", "")

        msg            = MIMEMultipart("alternative")
        msg["Subject"] = "🔐 Vos accès El Fatoora"
        msg["From"]    = email_user
        msg["To"]      = data["email"]

        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
            <div style="background:#1e429f;padding:16px;border-radius:8px;text-align:center;margin-bottom:20px;">
                <h2 style="color:white;margin:0;">EF El Fatoora</h2>
                <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Plateforme de facturation électronique</p>
            </div>
            <p style="color:#1e293b;">Bonjour <strong>{data["nom"]}</strong>,</p>
            <p style="color:#475569;">Votre compte a été créé sur <strong>El Fatoora</strong>. Voici vos informations de connexion :</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
                <p style="margin:4px 0;"><strong>🌐 Plateforme :</strong> http://localhost:3000</p>
                <p style="margin:4px 0;"><strong>📧 Email :</strong> {data["email"]}</p>
                <p style="margin:4px 0;"><strong>🔑 Mot de passe :</strong> <span style="font-family:monospace;background:#eff6ff;padding:2px 8px;border-radius:4px;color:#1e429f;">{data["motDePasse"]}</span></p>
            </div>
            <p style="color:#475569;">Pages auxquelles vous avez accès :</p>
            <ul style="color:#1e429f;">
                {"".join([f"<li>{p}</li>" for p in data.get("permissions", [])])}
            </ul>
            <p style="color:#94a3b8;font-size:12px;margin-top:20px;text-align:center;">
                El Fatoora — Plateforme conforme TEIF TTN Tunisie
            </p>
        </div>
        """
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(email_host, email_port) as server:
            server.starttls()
            server.login(email_user, email_password)
            server.sendmail(email_user, data["email"], msg.as_string())
        return {"success": True, "message": f"Email envoyé à {data['email']}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ── Anti-fraude Isolation Forest ──────────────────────────────────────────────

# ── Anti-fraude renforcé ───────────────────────────────────────────────────────
@app.post("/fraud/analyser")
def analyser_fraude(data: dict):
    """
    Analyse anti-fraude basée sur les règles TTN El Fatoora.
    Règles alignées avec les spécifications TEIF v1.8.8.
    Score: 0-20 = Autorisé | 21-50 = Rejeté (moyen) | >50 = Rejeté (élevé)
    """
    try:
        from sklearn.ensemble import IsolationForest
        import re as _re

        numeroFacture  = data.get("numeroFacture")
        montantTTC     = float(data.get("montantTTC", 0))
        totalHT        = float(data.get("totalHT", 0))
        totalTVA       = float(data.get("totalTVA", 0))
        tiersId        = int(data.get("tiersId", 0))
        nbLignes       = int(data.get("nbLignes", 0))
        dateFacture    = data.get("dateFacture", "")
        matricule      = data.get("matriculeFiscal", "")
        lignes         = data.get("lignes", [])
        tiersNom       = data.get("tiersNom", "")

        db  = get_db(); cur = db.cursor(dictionary=True)

        # Historique client
        cur.execute("""
            SELECT MontantTTC, TotalHT, TotalTVA FROM factures
            WHERE TiersId = %s AND Statut = 'AcceptéeTTN'
            ORDER BY DateFacture DESC LIMIT 50
        """, (tiersId,))
        historique = cur.fetchall()

        # Doublon — même numéro facture déjà soumis (pas même montant/jour)
        cur.execute("""
            SELECT COUNT(*) as nb FROM factures
            WHERE NumeroFacture != %s
            AND TiersId = %s
            AND ABS(MontantTTC - %s) < 0.001
            AND DATE(DateFacture) = DATE(%s)
            AND Statut NOT IN ('Annulée', 'Brouillon')
        """, (
            int(numeroFacture) if numeroFacture else 0,
            tiersId, montantTTC,
            dateFacture[:10] if dateFacture else datetime.now().strftime("%Y-%m-%d")
        ))
        doublon = cur.fetchone()

        # Stats historique client
        cur.execute("""
            SELECT AVG(MontantTTC) as avg_ttc, MAX(MontantTTC) as max_ttc,
                   COUNT(*) as nb_factures
            FROM factures WHERE TiersId = %s AND Statut = 'AcceptéeTTN'
        """, (tiersId,))
        stats_client = cur.fetchone()
        cur.close(); db.close()

        anomalies = []; score = 0

        # ── Règle 1 : Montant TTC = 0 ou négatif ─────────────────────────
        # TTN rejette tout document avec montant invalide
        if montantTTC <= 0:
            anomalies.append("❌ Montant TTC invalide (≤ 0) — document rejeté par TTN")
            score += 60

        # ── Règle 2 : Cohérence HT + TVA = TTC ───────────────────────────
        # TTN vérifie l'équation : TotalHT + TotalTVA + Timbre ≈ MontantTTC
        if totalHT > 0 and totalTVA >= 0:
            ttc_calcule = round(totalHT + totalTVA + 0.6, 3)  # timbre standard
            ecart = abs(ttc_calcule - montantTTC)
            if ecart > 1.0:  # tolérance 1 DT
                anomalies.append(f"❌ Incohérence HT+TVA+Timbre ({ttc_calcule:.3f}) ≠ TTC ({montantTTC:.3f}) — écart {ecart:.3f} DT")
                score += 40

        # ── Règle 3 : Taux TVA non conforme TEIF ─────────────────────────
        # Seuls 7%, 13% et 19% sont acceptés par TTN (+ 0% exonéré)
        if totalHT > 0 and totalTVA > 0:
            ratio_tva    = round((totalTVA / totalHT) * 100, 1)
            taux_valides = [0, 7, 13, 19]
            taux_proche  = any(abs(ratio_tva - t) <= 1.0 for t in taux_valides)
            if not taux_proche:
                anomalies.append(f"❌ Taux TVA {ratio_tva}% non conforme TEIF (valeurs: 0%, 7%, 13%, 19%)")
                score += 35

        # ── Règle 4 : Aucune ligne de facture ─────────────────────────────
        # Une facture sans lignes est rejetée par TTN
        if nbLignes == 0:
            anomalies.append("❌ Aucune ligne de facture — document incomplet")
            score += 50

        # ── Règle 5 : Prix unitaire = 0 sur une ligne ─────────────────────
        # Ligne avec prix = 0 indique une erreur de saisie
        for i, ligne in enumerate(lignes):
            prix = float(ligne.get("prixUnitaire", 1) or 0)
            if prix <= 0:
                desig = str(ligne.get("designation", f"Ligne {i+1}"))[:40]
                anomalies.append(f"⚠️ Prix unitaire = 0 pour '{desig}' — vérification requise")
                score += 20
                break

        # ── Règle 6 : Identification client ───────────────────────────────
        # Cohérent avec TEIF : MF(I-01), CIN(I-02), Carte séjour(I-03), MF étranger(I-04)
        if not matricule or matricule.strip() == "":
            mots = [m for m in (tiersNom or "").split() if len(m) > 1]
            formes_juridiques = ["SARL","SA","SNC","SCS","GIE","SUARL","SOCIETE","SOCIÉTÉ",
                                 "ENTREPRISE","ETS","CABINET","PHARMACIE","CLINIQUE","HOPITAL",
                                 "HOTEL","GROUPE","HOLDING","OFFICE","DIRECTION","MINISTERE"]
            est_entreprise = any(f in (tiersNom or "").upper() for f in formes_juridiques)

            if est_entreprise:
                # Entreprise sans MF → bloquant comme TEIF
                anomalies.append("❌ Entreprise sans matricule fiscal — rejeté par TEIF (I-01 requis)")
                score += 40
            else:
                # Personne physique sans CIN/Passeport → bloquant comme TEIF
                anomalies.append("❌ Personne physique sans CIN/Passeport — rejeté par TEIF (I-02 ou I-03 requis)")
                score += 40

        # ── Règle 7 : Format matricule fiscal tunisien ────────────────────
        # Format TEIF: 7 chiffres + Clef(sauf I,O,U) + CodeTVA(A/P/B/F/N) + CodeCat(M/P/C/N/E) + 3 chiffres
        if matricule and matricule.strip():
            mf = str(matricule).replace(" ", "").upper()
            # Format: 1234567A/A/M/000 ou 1234567B/P/000 (ancien format)
            pattern_mf_new = r'^\d{7}[A-HJ-NP-TV-Z][/][A-HJ-NP-TV-Z][/][MPECN][/]\d{3}$'
            pattern_mf_old = r'^\d{7}[A-HJ-NP-TV-Z][/][A-HJ-NP-TV-Z][/]\d{3}$'
            if not (_re.match(pattern_mf_new, mf) or _re.match(pattern_mf_old, mf)):
                anomalies.append(f"⚠️ Format matricule non conforme TEIF (ex: 1234567A/A/M/000) : {matricule}")
                score += 10

        # ── Règle 8 : Doublon strict ──────────────────────────────────────
        # Même client + même montant + même date = facture dupliquée
        if doublon and doublon["nb"] > 0:
            anomalies.append("❌ Doublon détecté — facture identique déjà soumise (même client, montant et date)")
            score += 45

        # ── Règle 9 : Anomalie statistique (Isolation Forest) ────────────
        # Détection de montant inhabituel vs historique du client
        if len(historique) >= 10:
            X_hist = [[float(h["MontantTTC"]), float(h["TotalHT"])] for h in historique]
            model  = IsolationForest(contamination=0.05, random_state=42)
            model.fit(X_hist)
            prediction = model.predict([[montantTTC, totalHT]])[0]
            if prediction == -1:
                avg = stats_client["avg_ttc"] if stats_client else 0
                anomalies.append(f"🤖 IA : Montant statistiquement atypique vs historique client (moyenne: {float(avg or 0):.3f} DT)")
                score += 20  # Avertissement, pas bloquant seul

        # ── Calcul final ──────────────────────────────────────────────────
        score    = min(score, 100)
        niveau   = "faible" if score <= 20 else ("moyen" if score <= 50 else "élevé")
        decision = "autoriser" if score <= 20 else ("avertir" if score <= 50 else "bloquer")

        return {
            "numeroFacture": numeroFacture,
            "score":    score,
            "niveau":   niveau,
            "decision": decision,
            "anomalies": anomalies,
            "message": f"Score de risque : {score}/100 — Niveau {niveau}",
            "details": {
                "regle1_montant_invalide":    "Montant TTC ≤ 0 → +60",
                "regle2_coherence_calcul":    "HT + TVA + Timbre ≠ TTC (tolérance 1 DT) → +40",
                "regle3_tva_non_conforme":    "TVA hors 0/7/13/19% (TEIF réf. I-1602) → +35",
                "regle4_facture_vide":        "Aucune ligne (LinSection obligatoire TEIF) → +50",
                "regle5_prix_zero":           "Prix unitaire = 0 → +20",
                "regle6_identification":      "Entreprise sans MF (I-01) → +25 | Personne physique sans CIN (I-02) → +10",
                "regle7_format_matricule":    "Format MF non conforme TEIF: 7chiffres+Clef/CodeTVA/CodeCat/3chiffres → +10",
                "regle8_doublon":             "Même client + montant + date → +45",
                "regle9_isolation_forest":    "Anomalie statistique IA (min 10 factures historique) → +20",
                "seuils_decision":            "≤20 Autorisé ✅ | 21-50 Rejeté ⚠️ | >50 Rejeté ❌",
                "ref_teif":                   "Conforme TEIF v1.8.8 — Tunisie TradeNet (TTN)"
            }
        }
    except Exception as e:
        return {"error": str(e), "score": 0, "decision": "autoriser", "anomalies": []}