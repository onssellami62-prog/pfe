/**
 * useInactivityLogout.js — src/hooks/useInactivityLogout.js
 *
 * Déconnecte automatiquement l'utilisateur après 5 minutes
 * sans aucune interaction (souris, clavier, scroll, touch).
 *
 * Usage dans App.js :
 *   useInactivityLogout(user, handleLogout);
 */

import { useEffect, useRef } from 'react';

const INACTIVITY_DELAY = 10 * 60 * 1000; // 5 minutes en millisecondes

export default function useInactivityLogout(user, onLogout) {
    const timerRef    = useRef(null);
    const warningRef  = useRef(null);

    useEffect(() => {
        // N'active le timer que si l'utilisateur est connecté
        if (!user) return;

        const resetTimer = () => {
            // Annule les timers existants
            clearTimeout(timerRef.current);
            clearTimeout(warningRef.current);

            // Cache la bannière si elle est affichée
            hideWarning();

            // Avertissement 1 minute avant (à 4 min d'inactivité)
            warningRef.current = setTimeout(() => {
                showWarning();
            }, INACTIVITY_DELAY - 60 * 1000);

            // Déconnexion à 5 min d'inactivité
            timerRef.current = setTimeout(() => {
                hideWarning();
                localStorage.removeItem('token');
                onLogout();
            }, INACTIVITY_DELAY);
        };

        // Événements qui réinitialisent le timer
        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(e => window.addEventListener(e, resetTimer));

        // Démarre le timer au montage
        resetTimer();

        // Nettoyage
        return () => {
            clearTimeout(timerRef.current);
            clearTimeout(warningRef.current);
            events.forEach(e => window.removeEventListener(e, resetTimer));
            hideWarning();
        };
    }, [user, onLogout]);
}

// ── Bannière d'avertissement (sans dépendance externe) ────────────────────────

function showWarning() {
    if (document.getElementById('inactivity-warning')) return;

    const banner = document.createElement('div');
    banner.id = 'inactivity-warning';
    banner.innerHTML = `
        <div style="
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            background: #1a3db5; color: #fff;
            padding: 14px 24px; border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.18);
            font-family: 'DM Sans', sans-serif; font-size: 14px;
            display: flex; align-items: center; gap: 12px;
            z-index: 99999; white-space: nowrap;
        ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#facc15" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Session inactive — déconnexion dans <strong style="margin:0 4px;" id="inactivity-countdown">60s</strong>
        </div>
    `;
    document.body.appendChild(banner);

    // Compte à rebours
    let seconds = 60;
    const interval = setInterval(() => {
        seconds--;
        const el = document.getElementById('inactivity-countdown');
        if (el) el.textContent = `${seconds}s`;
        if (seconds <= 0) clearInterval(interval);
    }, 1000);

    banner._interval = interval;
}

function hideWarning() {
    const banner = document.getElementById('inactivity-warning');
    if (banner) {
        clearInterval(banner._interval);
        banner.remove();
    }
}