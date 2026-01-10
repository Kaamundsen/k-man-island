import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime
import random

# ============================================
# 1. KONFIGURASJON & APP SETUP
# ============================================
st.set_page_config(
    page_title="K-man Island | Intelligence",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Session State for interaktivitet
if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None
if 'view' not in st.session_state:
    st.session_state.view = 'Dashboard'

# ============================================
# 2. DESIGN (Inspirert av bildet)
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Hovedoverstyring */
html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1a1a1a;
    background-color: #F8F7F4;
}

.stApp {
    background-color: #F8F7F4;
}

/* Sidebar styling */
section[data-testid="stSidebar"] {
    background-color: #ffffff !important;
    border-right: 1px solid #f0f0f0;
}

/* Profilkort-stil */
.profile-card {
    background: white;
    border-radius: 32px;
    padding: 30px;
    display: flex;
    align-items: center;
    gap: 25px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    margin-bottom: 30px;
    border: 1px solid #f0f0f0;
}
.profile-img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: #f0f0f0;
    overflow: hidden;
}

/* Status-kort (Lime, Teal, Pink) */
.status-card {
    border-radius: 28px;
    padding: 30px;
    color: #1a1a1a;
    height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s;
    position: relative;
}
.status-card:hover { transform: translateY(-5px); }
.card-lime { background-color: #E2FF3B; }
.card-teal { background-color: #A3E7D8; }
.card-pink { background-color: #FFB5B5; }

.status-number { font-size: 3.5rem; font-weight: 800; line-height: 1; }
.status-label { font-size: 1.1rem; font-weight: 700; }
.status-icon-bg {
    position: absolute;
    top: 25px;
    right: 25px;
    width: 40px;
    height: 40px;
    background: rgba(0,0,0,0.05);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Innholdskort (Aksjer) */
.content-card {
    background: #ffffff;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 24px;
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
}
.content-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }

.card-img-top {
    height: 160px;
    background: linear-gradient(135deg, #2d3436 0%, #000000 100%);
    position: relative;
}
.badge-top {
    position: absolute;
    top: 15px;
    left: 15px;
    padding: 6px 14px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 800;
}
.badge-ongoing { background-color: #E2FF3B; color: #1a1a1a; }
.badge-done { background-color: #A3E7D8; color: #1a1a1a; }

.card-body { padding: 25px; }
.card-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 10px; }

/* Progress bar fra bildet */
.prog-container { margin-top: 20px; }
.prog-bar-bg { background-color: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; }
.prog-bar-fill { height: 100%; border-radius: 4px; transition: width 1s; }

/* Høyre widgets */
.widget-box {
    background: white;
    border-radius: 28px;
    padding: 25px;
    margin-bottom: 20px;
    border: 1px solid #f0f0f0;
}
.help-card {
    background: linear-gradient(135deg, #2563EB, #1E40AF);
    border-radius: 28px;
    padding: 30px;
    color: white;
}

/* Navigasjons-knapper */
.stButton > button {
    border-radius: 14px;
    font-weight: 700;
    border: none;
    transition: all 0.2s;
}
.btn-black { background-color: #1a1a1a !important; color: white !important; }
.btn-lime { background-color: #E2FF3B !important; color: #1a1a1a !important; }

/* Filter bar */
.filter-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
    align-items: center;
}
.filter-item {
    padding: 10px 20px;
    background: white;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    gap: 8px;
}
.filter-active { background: #1a1a1a; color: white; }

/* Analyse visning */
.big-ticker { font-size: 4rem; font-weight: 800; letter-spacing: -2px; line-height: 1; }
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR
# ============================================
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", "EQNR.OL", "YAR.OL", "NHY.OL", 
    "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", 
    "LSG.OL", "SALM.OL", "BAKK.OL", "TOM.OL", "KOG.OL", "BORR.OL", "OKEA.OL"
]

@st.cache_data(ttl=1800)
def fetch_and_analyze():
    results = []
    for t in watchlist:
        try:
            df = yf.download(t, period="1y", interval="1d", progress=False)
            if df.empty or len(df) < 60: continue
            if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.droplevel(1)
            
            close = float(df['Close'].iloc[-1])
            rsi = ta.rsi(df['Close'], length=14).iloc[-1]
            sma20 = ta.sma(df['Close'], length=20).iloc[-1]
            
            is_buy = (rsi < 55) and (close > sma20)
            prob = min(max(int((100 - rsi) * 1.3), 15), 95)
            
            results.append({
                "ticker": t, "pris": round(close, 2), "endring": round(((close - df['Close'].iloc[-2]) / df['Close'].iloc[-2]) * 100, 2),
                "rsi": round(rsi, 1), "signal": "BUY" if is_buy else "HOLD", "prob": prob,
                "stop_loss": round(close * 0.965, 2), "target": round(close * 1.105, 2),
                "risk_kr": round(close * 0.035, 2), "pot_kr": round(close * 0.105, 2), "df": df
            })
        except: continue
    return sorted(results, key=lambda x: (x['signal'] != 'BUY', -x['prob']))

# ============================================
# 4. SIDEBAR MENY
# ============================================
with st.sidebar:
    st.markdown("<div style='padding: 20px 0;'><h1 style='font-size: 1.8rem; font-weight: 800;'>🏝️ K-man</h1></div>", unsafe_allow_html=True)
    if st.button("🏠  Dashboard", use_container_width=True):
        st.session_state.view = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
    if st.button("📊  Børsoversikt", use_container_width=True):
        st.session_state.view = 'Scanner'
        st.session_state.selected_ticker = None
        st.rerun()
    st.markdown("---")
    st.caption(f"Oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

# Layout (Hovedfelt vs Høyre felt)
c_main, c_side = st.columns([3, 1])

with c_main:
    # --- DASHBOARD VISNING ---
    if st.session_state.view == 'Dashboard' and not st.session_state.selected_ticker:
        # Header og toppknapp
        col_title, col_btn = st.columns([2, 1])
        with col_title:
            st.markdown("<h1 style='font-size: 2.5rem; font-weight: 800; margin-bottom: 40px;'>Oversikt</h1>", unsafe_allow_html=True)
        with col_btn:
            st.markdown("<div style='text-align: right; margin-top: 10px;'><span style='background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700;'>+ Ny Analyse</span></div>", unsafe_allow_html=True)

        # Bruker-profil kort
        st.markdown(f"""
            <div class="profile-card">
                <div class="profile-img"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ola" style="width:100%"></div>
                <div style="flex-grow: 1;">
                    <h2 style="margin:0; font-weight:800;">K-man Investor</h2>
                    <p style="margin:0; color:#86868b; font-weight:600;">Strategisk Porteføljestyring · Oslo Børs</p>
                    <div style="display:flex; gap:20px; margin-top:10px; font-size:0.9rem; color:#444;">
                        <span>📍 Oslo & Viken</span>
                        <span>📈 Aktiv nå</span>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)

        # Status-kort rad
        buys = len([d for d in data if d['signal'] == 'BUY'])
        holds = len([d for d in data if d['signal'] == 'HOLD'])
        
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown(f'<div class="status-card card-lime"><div class="status-icon-bg">🕒</div><div class="status-number">{buys}</div><div class="status-label">Hot Kjøp Nå</div></div>', unsafe_allow_html=True)
        with c2:
            st.markdown(f'<div class="status-card card-teal"><div class="status-icon-bg">✔️</div><div class="status-number">{holds}</div><div class="status-label">Stabile Hold</div></div>', unsafe_allow_html=True)
        with c3:
            st.markdown(f'<div class="status-card card-pink"><div class="status-icon-bg">📝</div><div class="status-number">0</div><div class="status-label">Risiko / Salg</div></div>', unsafe_allow_html=True)

        # Featured Seksjon (Siste Befaringer style)
        st.markdown("<h2 style='font-size: 1.8rem; font-weight: 800; margin: 40px 0 20px 0;'>Dagens Muligheter</h2>", unsafe_allow_html=True)
        
        # Filter bar
        st.markdown("""
            <div class="filter-bar">
                <div class="filter-item filter-active">📅 Dato</div>
                <div class="filter-item">📊 Status</div>
                <div class="filter-item">📍 Område</div>
            </div>
        """, unsafe_allow_html=True)

        # Grid med aksjekort
        display_picks = data[:4]
        cols = st.columns(2)
        for i, stock in enumerate(display_picks):
            with cols[i % 2]:
                badge_type = "badge-ongoing" if stock['signal'] == "BUY" else "badge-done"
                prog_color = "#E2FF3B" if stock['prob'] > 70 else "#A3E7D8" if stock['prob'] > 50 else "#FFB5B5"
                
                st.markdown(f"""
                    <div class="content-card">
                        <div class="card-img-top">
                            <span class="badge-top {badge_type}">{stock['signal']}</span>
                            <div style="position: absolute; bottom: 20px; left: 25px; color: white;">
                                <h3 style="margin:0; font-size: 1.8rem; font-weight: 800;">{stock['ticker']}</h3>
                                <span style="font-size: 0.9rem; opacity: 0.8;">Oslo Børs · #{i+1} Hotlist</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; align-items: end;">
                                <div><div style="font-size: 0.8rem; color:#888; text-transform:uppercase;">Pris</div><div style="font-size: 1.5rem; font-weight: 800;">{stock['pris']} NOK</div></div>
                                <div style="text-align: right;"><div style="font-size: 0.8rem; color:#888; text-transform:uppercase;">Gevinst</div><div style="font-size: 1.5rem; font-weight: 800; color:#34c759;">+{stock['pot_kr']} kr</div></div>
                            </div>
                            <div class="prog-container">
                                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">
                                    <span>Sannsynlighet</span>
                                    <span>{stock['prob']}%</span>
                                </div>
                                <div class="prog-bar-bg">
                                    <div class="prog-bar-fill" style="width: {stock['prob']}%; background-color: {prog_color};"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                if st.button(f"Åpne {stock['ticker']}", key=f"dash_{stock['ticker']}", use_container_width=True):
                    st.session_state.selected_ticker = stock['ticker']
                    st.rerun()

    # --- ANALYSE VISNING ---
    elif st.session_state.selected_ticker:
        stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
        if st.button("⬅️ Tilbake til oversikt"):
            st.session_state.selected_ticker = None
            st.rerun()
            
        st.markdown(f"<h1 class='big-ticker'>{stock['ticker']}</h1>", unsafe_allow_html=True)
        
        col_l, col_r = st.columns([2, 1])
        with col_l:
            df_p = stock['df'].tail(90)
            fig = go.Figure(data=[go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'])])
            fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
            fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
            fig.update_layout(height=600, xaxis_rangeslider_visible=False, template="plotly_white")
            st.plotly_chart(fig, use_container_width=True)

    # --- SCANNER VISNING ---
    elif st.session_state.view == 'Scanner':
        st.markdown("<h1 style='font-size: 2.5rem; font-weight: 800; margin-bottom: 40px;'>Børsoversikt</h1>", unsafe_allow_html=True)
        df_display = pd.DataFrame([{ "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], "Gevinst Prob": f"{d['prob']}%" } for d in data])
        st.table(df_display)

with c_side:
    # Høyre widgets (Min Agenda, Lagringsplass etc)
    st.markdown("<br><br><br><br>", unsafe_allow_html=True)
    
    st.markdown("""
        <div class="widget-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin:0; font-size: 1.1rem; font-weight: 800;">Min Agenda</h3>
                <span style="font-size: 0.8rem; color: #888;">☀️ 14°C Oslo</span>
            </div>
            <div style="padding: 15px; background: #F8F7F4; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #1a1a1a;">
                <div style="font-size: 0.75rem; color: #888; font-weight:700;">NESTE ANALYSE</div>
                <div style="font-weight: 800;">Oslo Børs Åpner</div>
                <div style="font-size: 0.85rem; color: #555;">09:00 Mandag</div>
            </div>
        </div>
        
        <div class="widget-box">
            <h3 style="margin:0; font-size: 1.1rem; font-weight: 800; margin-bottom: 15px;">Eksponering</h3>
            <div style="font-size: 0.85rem; color: #888; display: flex; justify-content: space-between; margin-bottom:10px;">
                <span>75% Brukt</span>
                <span>100% Totalt</span>
            </div>
            <div class="prog-bar-bg">
                <div class="prog-bar-fill" style="width: 75%; background-color: #1a1a1a;"></div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <span style="font-size: 0.85rem; font-weight: 700; color: #2563EB;">Oppgrader Strategi</span>
            </div>
        </div>
        
        <div class="help-card">
            <h3 style="margin:0; font-size: 1.3rem; font-weight: 800; margin-bottom: 10px;">Trenger du hjelp?</h3>
            <p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 25px;">Få support med AI-generering eller analyser.</p>
            <div style="background: #E2FF3B; color: #1a1a1a; padding: 15px; border-radius: 16px; text-align: center; font-weight: 800; font-size:1rem;">
                Kontakt Support
            </div>
        </div>
    """, unsafe_allow_html=True)

st.markdown("---")
st.caption("K-man Island © 2026 | Kick Arse Strategy for Oslo Børs.")
