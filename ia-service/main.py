from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from dotenv import load_dotenv
import os
from datetime import datetime, date

load_dotenv()

app = FastAPI(title="El Fatoora IA Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5170"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        database=os.getenv("DB_NAME", "efacturation_db"),
        user=os.getenv("DB_USER", "pfe"),
        password=os.getenv("DB_PASSWORD", "")
    )

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "El Fatoora IA"}

# ── Prédiction CA mois prochain ──────────────────────────────────────────────
@app.get("/predict/ca")
def predict_ca():
    try:
        db  = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT 
                YEAR(DateFacture)  AS annee,
                MONTH(DateFacture) AS mois,
                SUM(TotalHT)       AS caHT
            FROM factures
            WHERE Statut = 'AcceptéeTTN'
            GROUP BY YEAR(DateFacture), MONTH(DateFacture)
            ORDER BY annee, mois
        """)
        rows = cur.fetchall()
        cur.close()
        db.close()

        if len(rows) < 2:
            return {
                "prediction":    0,
                "message":       "Données insuffisantes pour la prédiction (minimum 2 mois requis)",
                "historique":    rows,
                "confiance":     0,
                "tendance":      "neutre"
            }

        df = pd.DataFrame(rows)
        df["index"] = range(len(df))

        X = df[["index"]].values
        y = df["caHT"].values.astype(float)

        model = LinearRegression()
        model.fit(X, y)

        next_index     = np.array([[len(df)]])
        prediction     = float(model.predict(next_index)[0])
        prediction     = max(0, round(prediction, 3))

        # Score de confiance basé sur R²
        r2             = model.score(X, y)
        confiance      = round(max(0, min(100, r2 * 100)), 1)

        # Tendance
        if model.coef_[0] > 0:
            tendance = "hausse"
        elif model.coef_[0] < 0:
            tendance = "baisse"
        else:
            tendance = "stable"

        # Mois prochain
        now         = datetime.now()
        mois_suivant = now.month % 12 + 1
        annee_suivante = now.year + (1 if now.month == 12 else 0)

        return {
            "prediction":      prediction,
            "moisProchain":    mois_suivant,
            "anneeProchaine":  annee_suivante,
            "confiance":       confiance,
            "tendance":        tendance,
            "historique":      rows,
            "message":         f"Prédiction basée sur {len(rows)} mois d'historique"
        }

    except Exception as e:
        return {"error": str(e), "prediction": 0}

# ── Top 5 clients ─────────────────────────────────────────────────────────────
@app.get("/bi/top-clients")
def top_clients():
    try:
        db  = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT 
                t.Nom          AS nomClient,
                COUNT(f.NumeroFacture) AS nbFactures,
                SUM(f.TotalHT)         AS caTotal,
                SUM(f.MontantTTC)      AS ttcTotal,
                AVG(f.MontantTTC)      AS panierMoyen
            FROM factures f
            JOIN tiers t ON f.TiersId = t.Id
            WHERE f.Statut = 'AcceptéeTTN'
            GROUP BY t.Id, t.Nom
            ORDER BY caTotal DESC
            LIMIT 5
        """)
        rows = cur.fetchall()
        cur.close()
        db.close()

        for r in rows:
            r["caTotal"]    = round(float(r["caTotal"] or 0), 3)
            r["ttcTotal"]   = round(float(r["ttcTotal"] or 0), 3)
            r["panierMoyen"]= round(float(r["panierMoyen"] or 0), 3)

        return {"topClients": rows}

    except Exception as e:
        return {"error": str(e), "topClients": []}

# ── Top 5 produits vendus ─────────────────────────────────────────────────────
@app.get("/bi/top-produits")
def top_produits():
    try:
        db  = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT 
                p.Nom                  AS nomProduit,
                SUM(lf.Quantite)       AS qteTotale,
                SUM(lf.MontantHT)      AS caHT,
                COUNT(DISTINCT f.NumeroFacture) AS nbFactures,
                AVG(lf.PrixUnitaire)   AS prixMoyen
            FROM lignefactures lf
            JOIN produits p ON lf.ProduitId = p.Id
            JOIN factures f ON lf.NumeroFacture = f.NumeroFacture
            WHERE f.Statut = 'AcceptéeTTN'
            GROUP BY p.Id, p.Nom
            ORDER BY qteTotale DESC
            LIMIT 5
        """)
        rows = cur.fetchall()
        cur.close()
        db.close()

        for r in rows:
            r["caHT"]      = round(float(r["caHT"] or 0), 3)
            r["prixMoyen"] = round(float(r["prixMoyen"] or 0), 3)

        return {"topProduits": rows}

    except Exception as e:
        return {"error": str(e), "topProduits": []}

# ── Évolution CA mensuelle ────────────────────────────────────────────────────
@app.get("/bi/evolution-ca")
def evolution_ca():
    try:
        db  = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT 
                YEAR(DateFacture)  AS annee,
                MONTH(DateFacture) AS mois,
                SUM(TotalHT)       AS caHT,
                SUM(MontantTTC)    AS caTTC,
                COUNT(*)           AS nbFactures
            FROM factures
            WHERE Statut = 'AcceptéeTTN'
            GROUP BY YEAR(DateFacture), MONTH(DateFacture)
            ORDER BY annee, mois
        """)
        rows = cur.fetchall()
        cur.close()
        db.close()

        for r in rows:
            r["caHT"]  = round(float(r["caHT"] or 0), 3)
            r["caTTC"] = round(float(r["caTTC"] or 0), 3)

        return {"evolution": rows}

    except Exception as e:
        return {"error": str(e), "evolution": []}

# ── Panier moyen par client ───────────────────────────────────────────────────
@app.get("/bi/panier-moyen")
def panier_moyen():
    try:
        db  = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT 
                t.Nom              AS nomClient,
                COUNT(f.NumeroFacture) AS nbFactures,
                AVG(f.MontantTTC)  AS panierMoyen,
                MIN(f.MontantTTC)  AS minFacture,
                MAX(f.MontantTTC)  AS maxFacture
            FROM factures f
            JOIN tiers t ON f.TiersId = t.Id
            WHERE f.Statut = 'AcceptéeTTN'
            GROUP BY t.Id, t.Nom
            HAVING nbFactures > 0
            ORDER BY panierMoyen DESC
            LIMIT 10
        """)
        rows = cur.fetchall()
        cur.close()
        db.close()

        for r in rows:
            r["panierMoyen"] = round(float(r["panierMoyen"] or 0), 3)
            r["minFacture"]  = round(float(r["minFacture"] or 0), 3)
            r["maxFacture"]  = round(float(r["maxFacture"] or 0), 3)

        # Panier moyen global
        db2  = get_db()
        cur2 = db2.cursor(dictionary=True)
        cur2.execute("""
            SELECT AVG(MontantTTC) AS panierGlobal
            FROM factures
            WHERE Statut = 'AcceptéeTTN'
        """)
        global_row   = cur2.fetchone()
        cur2.close()
        db2.close()

        panier_global = round(float(global_row["panierGlobal"] or 0), 3) if global_row else 0

        return {
            "panierMoyenGlobal": panier_global,
            "parClient":         rows
        }

    except Exception as e:
        return {"error": str(e), "parClient": []}