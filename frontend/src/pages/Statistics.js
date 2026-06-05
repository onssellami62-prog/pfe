import React, { useState, useEffect, useRef } from 'react';
import './Statistics.css';

const DASH_URL = 'http://localhost:8050';

export default function Statistics() {
    const [loaded, setLoaded]   = useState(false);
    const [ping,   setPing]     = useState(null); // 'ok' | 'down'
    const iframeRef             = useRef(null);

    /* ── Vérifier que Dash tourne ─────────────────── */
    useEffect(() => {
        const check = async () => {
            try {
                await fetch(DASH_URL, { mode: 'no-cors', cache: 'no-store' });
                setPing('ok');
            } catch {
                setPing('down');
            }
        };
        check();
        const t = setInterval(check, 10_000);
        return () => clearInterval(t);
    }, []);

    const handleLoad  = () => setLoaded(true);
    const handleError = () => setLoaded(true);
    const reload      = () => {
        setLoaded(false);
        if (iframeRef.current) iframeRef.current.src = DASH_URL;
    };

    return (
        <div style={S.wrap} className="stats-page">

            {/* Contenu */}
            <div style={S.body}>

                {/* Dash DOWN → message d'aide */}
                {ping === 'down' && (
                    <div style={S.downOverlay}>
                        <div style={S.downCard}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                            <div style={S.downTitle}>Dashboard Dash non démarré</div>
                            <div style={S.downSub}>
                                Ouvrez un terminal dans votre dossier Python et lancez :
                            </div>
                            <div style={S.codeBlock}>
                                <code style={{ color: '#34d399', fontSize: 14 }}>
                                    python dashboard.py
                                </code>
                            </div>
                            <div style={S.downSub} >
                                Puis revenez ici — la page se recharge automatiquement.
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
                                <button onClick={reload} style={S.btnPrimary}>
                                    ⟳ Réessayer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Spinner de chargement */}
                {!loaded && ping === 'ok' && (
                    <div style={S.spinnerWrap}>
                        <div style={S.spinner}/>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 14 }}>
                            Chargement du dashboard BI...
                        </div>
                    </div>
                )}

                {/* iFrame Dash */}
                {ping === 'ok' && (
                    <iframe
                        ref={iframeRef}
                        src={DASH_URL}
                        title="El Fatoora BI Dashboard"
                        onLoad={handleLoad}
                        onError={handleError}
                        style={{
                            ...S.iframe,
                            opacity: loaded ? 1 : 0,
                            transition: 'opacity 0.4s ease',
                        }}
                        allow="fullscreen"
                    />
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.4; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

/* ── Styles ───────────────────────────────────────────── */
const S = {
    wrap: {
        display:        'flex',
        flexDirection:  'column',
        height:         '100%',
        background:     '#070d1a',
        borderRadius:   12,
        overflow:       'hidden',
        border:         '1px solid #1a2740',
    },

    /* Barre du haut */
    bar: {
        display:         'flex',
        justifyContent:  'space-between',
        alignItems:      'center',
        padding:         '10px 16px',
        background:      '#0d1526',
        borderBottom:    '1px solid #1a2740',
        flexShrink:      0,
        gap:             12,
        flexWrap:        'wrap',
    },
    barLeft: {
        display:     'flex',
        alignItems:  'center',
        gap:         10,
    },
    logo: {
        width:           34,
        height:          34,
        borderRadius:    10,
        background:      'linear-gradient(135deg,#818cf8,#6366f1)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        12,
        fontWeight:      900,
        color:           'white',
        flexShrink:      0,
    },
    barTitle: {
        fontSize:    13,
        fontWeight:  700,
        color:       'white',
    },
    barSub: {
        fontSize:  10,
        color:     'rgba(255,255,255,0.35)',
        marginTop: 1,
    },
    barRight: {
        display:     'flex',
        alignItems:  'center',
        gap:         8,
    },
    statusPill: {
        display:       'flex',
        alignItems:    'center',
        gap:           7,
        background:    'rgba(255,255,255,0.04)',
        border:        '1px solid rgba(255,255,255,0.07)',
        borderRadius:  20,
        padding:       '5px 12px',
    },
    dot: {
        width:        8,
        height:       8,
        borderRadius: '50%',
        display:      'inline-block',
        flexShrink:   0,
    },

    /* Boutons */
    btnGhost: {
        padding:         '6px 12px',
        borderRadius:    9,
        border:          '1px solid rgba(255,255,255,0.1)',
        background:      'rgba(255,255,255,0.04)',
        color:           'rgba(255,255,255,0.6)',
        fontSize:        12,
        fontWeight:      600,
        cursor:          'pointer',
        fontFamily:      'inherit',
        transition:      'all 0.2s',
    },
    btnPrimary: {
        padding:         '6px 14px',
        borderRadius:    9,
        border:          '1px solid rgba(129,140,248,0.4)',
        background:      'rgba(129,140,248,0.18)',
        color:           '#818cf8',
        fontSize:        12,
        fontWeight:      700,
        cursor:          'pointer',
        fontFamily:      'inherit',
        transition:      'all 0.2s',
    },

    /* Zone principale */
    body: {
        flex:     1,
        position: 'relative',
        overflow: 'hidden',
    },

    /* iFrame */
    iframe: {
        width:        '100%',
        height:       '100%',
        border:       'none',
        display:      'block',
        background:   '#070d1a',
        colorScheme:  'dark',
    },

    /* Spinner */
    spinnerWrap: {
        position:        'absolute',
        inset:           0,
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        background:      '#070d1a',
        zIndex:          10,
    },
    spinner: {
        width:        36,
        height:       36,
        border:       '3px solid rgba(129,140,248,0.15)',
        borderTop:    '3px solid #818cf8',
        borderRadius: '50%',
        animation:    'spin 0.8s linear infinite',
    },

    /* Dash DOWN */
    downOverlay: {
        position:        'absolute',
        inset:           0,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        background:      '#070d1a',
        zIndex:          20,
        padding:         24,
    },
    downCard: {
        background:    '#0d1526',
        border:        '1px solid #1a2740',
        borderRadius:  16,
        padding:       '36px 40px',
        textAlign:     'center',
        maxWidth:      480,
        width:         '100%',
    },
    downTitle: {
        fontSize:    20,
        fontWeight:  800,
        color:       'white',
        marginBottom: 10,
    },
    downSub: {
        fontSize:   13,
        color:      'rgba(255,255,255,0.4)',
        lineHeight: 1.6,
        marginTop:  8,
    },
    codeBlock: {
        background:    '#070d1a',
        border:        '1px solid #1a2740',
        borderRadius:  10,
        padding:       '14px 20px',
        margin:        '16px 0',
        fontFamily:    'monospace',
        textAlign:     'left',
    },
};