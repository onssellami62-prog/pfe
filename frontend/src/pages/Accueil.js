import React, { useEffect, useState, useCallback } from 'react';

const API = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

export default function Accueil({ user }) {
    const [kpis,       setKpis]       = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [activeStep, setActiveStep] = useState(0);

    const userName = user?.name || user?.email?.split('@')[0] || 'Utilisateur';
    const dateStr  = new Date().toLocaleDateString('fr-TN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const loadData = useCallback(() => {
        fetch(`${API}/factures/stats`, { headers: authHeaders() })
            .then(r => r.ok ? r.json() : null)
            .then(stats => {
                if (stats) setKpis({
                    nbRejetes:  stats.nbRejetees  ?? 0,
                    nbAttente:  stats.nbBrouillon ?? 0,
                    nbValidees: stats.nbValidees  ?? 0,
                    total:      stats.total       ?? 0,
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const t = setInterval(() => setActiveStep(s => (s + 1) % 6), 1800);
        return () => clearInterval(t);
    }, []);

    const steps = [
        { icon:'📝', label:'Création\nde Facture',    color:'#2563eb', glow:'rgba(37,99,235,0.2)'   },
        { icon:'🤖', label:'Analyse\nAnti-Fraude',    color:'#7c3aed', glow:'rgba(124,58,237,0.2)'  },
        { icon:'✍️', label:'Signature\nÉlectronique', color:'#0891b2', glow:'rgba(8,145,178,0.2)'   },
        { icon:'📄', label:'Génération\nTEIF XML',    color:'#059669', glow:'rgba(5,150,105,0.2)'   },
        { icon:'🚀', label:'Envoi\nau TTN',           color:'#d97706', glow:'rgba(217,119,6,0.2)'   },
        { icon:'✅', label:'Validation\n',     color:'#16a34a', glow:'rgba(22,163,74,0.2)'   },
    ];

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:12, fontFamily:"'Inter',sans-serif" }}>

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <div style={{
                background:'linear-gradient(135deg,#0c1e4a 0%,#0f2d6b 30%,#1a4db8 65%,#2563eb 100%)',
                backgroundImage:'url(/hero-bg.png)', backgroundSize:'cover', backgroundPosition:'center',
                borderRadius:16, overflow:'hidden', minHeight:160,
                display:'flex', alignItems:'stretch',
                boxShadow:'0 4px 20px rgba(37,99,235,0.2)', position:'relative',
            }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(12,30,74,0.88) 0%,rgba(15,45,107,0.80) 40%,rgba(37,99,235,0.65) 100%)', zIndex:1 }}/>
                <div style={{ flex:1, padding:'24px 36px', zIndex:3, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.22)', borderRadius:20, padding:'4px 14px', fontSize:11, color:'rgba(255,255,255,0.9)', marginBottom:12, width:'fit-content' }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', display:'inline-block', boxShadow:'0 0 6px #4ade80' }}/>
                        Connecté · Conforme TEIF v1.8.7 · TTN Tunisie
                    </div>
                    <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', lineHeight:1.1, marginBottom:8, letterSpacing:'-0.5px' }}>
                        Bonjour, <span style={{ color:'#93c5fd' }}>{userName}</span> 👋
                    </h1>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.5, maxWidth:420, marginBottom:8 }}>
                        Plateforme de facturation électronique conforme TEIF · Gérez, signez et soumettez vos factures à TTN.
                    </p>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>{dateStr}</div>
                </div>
            </div>

            {/* ── WORKFLOW ──────────────────────────────────────────────── */}
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', padding:'18px 24px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                    Workflow du Circuit de Facturation
                    <span style={{ marginLeft:'auto', fontSize:10, color:'#9ca3af', fontWeight:400, background:'#f9fafb', padding:'2px 10px', borderRadius:20, border:'1px solid #e5e7eb' }}>
                        E-Facturation · Usage Interne
                    </span>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:0 }}>
                    {steps.map((step, i) => (
                        <React.Fragment key={i}>
                            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                                <div style={{
                                    width:50, height:50, borderRadius:'50%',
                                    background: activeStep === i ? step.color : '#f8fafc',
                                    border:`2px solid ${activeStep === i ? step.color : '#e5e7eb'}`,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:20, transition:'all 0.4s ease',
                                    boxShadow: activeStep === i ? `0 0 0 5px ${step.glow}` : 'none',
                                    transform: activeStep === i ? 'scale(1.1)' : 'scale(1)',
                                }}>{step.icon}</div>
                                <div style={{ width:18, height:18, borderRadius:'50%', background: activeStep >= i ? step.color : '#e5e7eb', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.4s' }}>{i+1}</div>
                                <div style={{ fontSize:11, fontWeight: activeStep === i ? 700 : 500, color: activeStep === i ? step.color : '#6b7280', textAlign:'center', lineHeight:1.4, whiteSpace:'pre-line', transition:'color 0.3s' }}>{step.label}</div>
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{ display:'flex', alignItems:'center', paddingTop:16, flexShrink:0 }}>
                                    <div style={{ width:36, height:2, background: activeStep > i ? `linear-gradient(to right,${steps[i].color},${steps[i+1].color})` : '#e5e7eb', borderRadius:2, position:'relative', transition:'background 0.4s' }}>
                                        <div style={{ position:'absolute', right:-5, top:'50%', transform:'translateY(-50%)', width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', borderLeft:`6px solid ${activeStep > i ? steps[i+1].color : '#e5e7eb'}`, transition:'border-left-color 0.4s' }}/>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* ── ALERTES ───────────────────────────────────────────────── */}
            <div style={{ ...card, padding:'16px 20px' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                    <span>🎯</span> Ce qui nécessite ton attention
                </div>
                {loading ? <Spinner /> : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {(kpis?.nbRejetes ?? 0) > 0 && (
                            <AlertItem
                                bg="#fef2f2" border="#fecaca" iconBg="#fee2e2" icon="❌"
                                title={`${kpis.nbRejetes} facture${kpis.nbRejetes > 1 ? 's' : ''} rejetée${kpis.nbRejetes > 1 ? 's' : ''} par TTN`}
                                sub="Vérifier les anomalies et corriger avant re-soumission"
                                badge="Urgent" badgeColor="#dc2626" badgeBg="#fee2e2"
                            />
                        )}
                        {(kpis?.nbAttente ?? 0) > 0 && (
                            <AlertItem
                                bg="#fffbeb" border="#fde68a" iconBg="#fef3c7" icon="⏳"
                                title={`${kpis.nbAttente} brouillon${kpis.nbAttente > 1 ? 's' : ''} non soumis à TTN`}
                                sub="Signer électroniquement et envoyer pour validation"
                                badge="En attente" badgeColor="#d97706" badgeBg="#fef3c7"
                            />
                        )}
                        {!(kpis?.nbRejetes) && !(kpis?.nbAttente) && (
                            <AlertItem
                                bg="#f0fdf4" border="#bbf7d0" iconBg="#dcfce7" icon="✅"
                                title="Tout est en ordre"
                                sub="Aucune action urgente requise"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Composants ───────────────────────────────────────────────────── */
function Spinner() {
    return <div style={{ padding:'20px 0', color:'#9ca3af', fontSize:13 }}>Chargement…</div>;
}

function AlertItem({ bg, border, iconBg, icon, title, sub, badge, badgeColor, badgeBg }) {
    return (
        <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:10, padding:'10px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{icon}</div>
            <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:11, color:'#6b7280' }}>{sub}</div>
            </div>
            {badge && (
                <span style={{ fontSize:10, fontWeight:700, color:badgeColor, background:badgeBg, padding:'3px 8px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>{badge}</span>
            )}
        </div>
    );
}

const card = {
    background:'#fff', borderRadius:16,
    border:'1px solid #e5e7eb', padding:'22px 24px',
    boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
};