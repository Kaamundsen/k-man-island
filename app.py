import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
from plotly.subplots import make_subplots
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
if 'page' not in st.session_state:
    st.session_state.page = 'Dashboard'

# ============================================
# 2. DESIGN (Kick-Arse Apple Style)
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Main Overrides */
html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1a1a1a;
    background-color: #F8F7F4;
}

.stApp {
    background-color: #F8F7F4;
}

/* Sidebar Styling - Clean and White */
section[data-testid="stSidebar"] {
    background-color: #ffffff !important;
    border-right: 1px solid #f0f0f0;
    min-width: 80px !important;
}

/* Sidebar Nav Buttons as Icons */
.stSidebar [data-testid="stVerticalBlock"] button {
    background: transparent !important;
    border: none !important;
    font-size: 1.8rem !important;
    margin-bottom: 25px !important;
    color: #888 !important;
    width: 100% !important;
    transition: all 0.2s ease;
}
.stSidebar [data-testid="stVerticalBlock"] button:hover {
    color: #1a1a1a !important;
    transform: scale(1.1);
}

/* --- CLICKABLE CARD HACK --- */
.card-wrapper {
    position: relative;
    width: 100%;
}

.stock-card {
    background: #ffffff;
    border-radius: 28px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 24px;
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
}

.card-wrapper:hover .stock-card { 
    transform: translateY(-8px); 
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    border: 1px solid #E2FF3B;
}

/* Gjør den usynlige knappen dekkende for hele kortet */
.card-wrapper .stButton {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 10 !important;
}

.card-wrapper .stButton > button {
    width: 100% !important;
    height: 100% !important;
    opacity: 0 !important; /* HELT USYNLIG */
    border: none !important;
    background: transparent !important;
    cursor: pointer !important;
}

.card-image-section {
    height: 180px;
    background: linear-gradient(135deg, #2d3436 0%, #000000 100%);
    position: relative;
}
.card-badge {
    position: absolute;
    top: 15px;
    left: 15px;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}
.badge-buy { background-color: #E2FF3B; color: #1a1a1a; }
.badge-hold { background-color: #A3E7D8; color: #1a1a1a; }

.card-title-area {
    position: absolute;
    bottom: 15px;
    left: 15px;
    color: white;
}

.card-body { padding: 25px; }

.analysis-link {
    color: #2563EB;
    font-weight: 700;
    font-size: 0.9rem;
    margin-top: 15px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.progress-container { margin-top: 15px; }
.progress-bar-bg { background-color: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease-in-out; }

/* Status Cards */
.status-card {
    border-radius: 24px;
    padding: 30px;
    color: #1a1a1a;
    position: relative;
    overflow: hidden;
    height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.card-lime { background-color: #E2FF3B; }
.card-teal { background-color: #A3E7D8; }
.card-pink { background-color: #FFB5B5; }

.status-number { font-size: 3rem; font-weight: 800; line-height: 1; }
.status-label { font-size: 1rem; font-weight: 600; color: #444; }

/* Massive Header in Analysis */
.massive-header {
    font-size: 5rem !important;
    font-weight: 800 !important;
    letter-spacing: -3px;
    line-height: 0.9;
}
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
            prob = min(max(int((100 - rsi) * 1.3), 10), 95)
            
            results.append({
                "ticker": t,
                "pris": round(close, 2),
                "endring": round(((close - df['Close'].iloc[-2]) / df['Close'].iloc[-2]) * 100, 2),
                "signal": "BUY" if is_buy else "HOLD",
                "prob": prob,
                "stop_loss": round(close * 0.965, 2),
                "target": round(close * 1.105, 2),
                "df": df
            })
        except: continue
    return sorted(results, key=lambda x: (x['signal'] != 'BUY', -x['prob']))

# ============================================
# 4. SIDEBAR (Ikoner for Hjem, Scanner, Analyse)
# ============================================
with st.sidebar:
    st.markdown("<div style='text-align: center; padding: 20px 0; font-size: 2rem;'>🏝️</div>", unsafe_allow_html=True)
    
    # Dashboard Icon
    if st.button("🏠", key="nav_home", help="Dashboard"):
        st.session_state.page = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
        
    # Scanner Icon
    if st.button("📋", key="nav_scan", help="Aksjeoversikt"):
        st.session_state.page = 'Overview'
        st.rerun()
        
    # Analysis Icon (Deep Dive)
    if st.button("📈", key="nav_analysis", help="Dypanalyse"):
        if st.session_state.selected_ticker:
            st.session_state.page = 'Analysis'
        else:
            st.warning("Velg en aksje først!")
        st.rerun()
        
    st.markdown("<div style='margin-top: 100px;'></div>", unsafe_allow_html=True)
    if st.button("👤", key="nav_profile"): pass
    if st.button("⚙️", key="nav_settings"): pass

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

c_main, c_side = st.columns([3, 1])

with c_main:
    # --- Top Search Bar Area ---
    st.markdown("""
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div style="background: white; border-radius: 12px; padding: 10px 20px; border: 1px solid #eee; width: 350px; color: #888;">
                🔍 Søk aksjer, trender...
            </div>
            <div style="background: black; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer;">
                + Ny Analyse
            </div>
        </div>
    """, unsafe_allow_html=True)

    # --- Dashbord / Dypanalyse Logikk ---
    if st.session_state.selected_ticker:
        # VIS ANALYSE
        stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
        if st.button("⬅️ Tilbake til oversikt"):
            st.session_state.selected_ticker = None
            st.rerun()
            
        st.markdown(f"<h1 class='massive-header'>{stock['ticker']}</h1>", unsafe_allow_html=True)
        st.markdown(f"<p style='font-size: 2rem; color: #888;'>{stock['pris']} NOK · <span style='color: #34c759;'>{stock['prob']}% Probabilitet</span></p>", unsafe_allow_html=True)
        
        df_p = stock['df'].tail(90)
        fig = go.Figure(data=[go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'])])
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
        fig.update_layout(height=600, xaxis_rangeslider_visible=False, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)

    elif st.session_state.page == 'Dashboard':
        st.markdown("<h1 style='font-size: 2.5rem; font-weight: 800; margin-bottom: 30px;'>Oversikt</h1>", unsafe_allow_html=True)
        
        # User Header Card
        st.markdown("""
            <div style="background: white; border-radius: 24px; padding: 30px; display: flex; align-items: center; gap: 25px; border: 1px solid #f0f0f0; margin-bottom: 30px;">
                <div style="width: 70px; height: 70px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">👤</div>
                <div>
                    <h2 style="margin:0; font-size: 1.4rem; font-weight: 800;">K-man Trader</h2>
                    <p style="margin:0; color: #888; font-size: 0.9rem;">Strategisk Portefølje · Oslo & Viken</p>
                </div>
            </div>
        """, unsafe_allow_html=True)

        # Status Row
        c1, c2, c3 = st.columns(3)
        buys = len([d for d in data if d['signal'] == 'BUY'])
        with c1: st.markdown(f'<div class="status-card card-lime"><div class="status-number">{buys}</div><div class="status-label">Hot Kjøp Nå</div></div>', unsafe_allow_html=True)
        with c2: st.markdown(f'<div class="status-card card-teal"><div class="status-number">{len(data)-buys}</div><div class="status-label">Stabile Hold</div></div>', unsafe_allow_html=True)
        with c3: st.markdown(f'<div class="status-card card-pink"><div class="status-number">0</div><div class="status-label">Salg / Risk</div></div>', unsafe_allow_html=True)

        st.markdown("<h2 style='font-size: 1.6rem; font-weight: 800; margin: 45px 0 25px 0;'>Dagens Muligheter</h2>", unsafe_allow_html=True)
        
        # Grid med aksjer
        cols = st.columns(2)
        for i, stock in enumerate(data[:4]):
            with cols[i % 2]:
                badge_class = "badge-buy" if stock['signal'] == "BUY" else "badge-hold"
                prog_color = "#E2FF3B" if stock['prob'] > 75 else "#A3E7D8"
                
                st.markdown(f"""
                <div class="card-wrapper">
                    <div class="stock-card">
                        <div class="card-image-section">
                            <span class="card-badge {badge_class}">{stock['signal']}</span>
                            <div class="card-title-area">
                                <h3 style="margin:0; font-size: 1.6rem; font-weight: 800;">{stock['ticker']}</h3>
                                <span style="font-size: 0.85rem; opacity: 0.8;">Oslo Børs · #{i+1} Hotlist</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; align-items: end;">
                                <div>
                                    <div style="font-size: 0.75rem; color: #888; text-transform: uppercase;">Siste Pris</div>
                                    <div style="font-size: 1.4rem; font-weight: 800;">{stock['pris']} NOK</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.75rem; color: #888; text-transform: uppercase;">Potensial</div>
                                    <div style="font-size: 1.4rem; font-weight: 800; color: #34c759;">+10.5%</div>
                                </div>
                            </div>
                            
                            <div class="progress-container">
                                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px;">
                                    <span>Gevinst-sannsynlighet</span>
                                    <span>{stock['prob']}%</span>
                                </div>
                                <div class="progress-bar-bg">
                                    <div class="progress-bar-fill" style="width: {stock['prob']}%; background-color: {prog_color};"></div>
                                </div>
                            </div>
                            
                            <div class="analysis-link">
                                Sjekk dypanalyse for {stock['ticker']} →
                            </div>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                # Den usynlige knappen som gjør hele kortet klikkbart
                if st.button("", key=f"btn_{stock['ticker']}"):
                    st.session_state.selected_ticker = stock['ticker']
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)

    elif st.session_state.page == 'Overview':
        st.markdown("<h1 style='font-size: 2.5rem; font-weight: 800; margin-bottom: 30px;'>Børsoversikt</h1>", unsafe_allow_html=True)
        df_disp = pd.DataFrame([{ "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], "Sannsynlighet": f"{d['prob']}%" } for d in data])
        st.table(df_disp)

with c_side:
    st.markdown("<br><br><br><br>", unsafe_allow_html=True)
    # Agenda Widget
    st.markdown("""
        <div class="widget-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="margin:0; font-size: 1rem; font-weight: 800;">Min Agenda</h3>
                <span style="font-size: 0.75rem; color: #888;">☀️ 14°C Oslo</span>
            </div>
            <div style="padding: 18px; background: #F8F7F4; border-radius: 16px; margin-bottom: 12px; border-left: 5px solid #1a1a1a;">
                <div style="font-size: 0.7rem; color: #888; font-weight: 700;">NESTE TRADE</div>
                <div style="font-weight: 800; font-size: 1.1rem; margin-top: 5px;">Åpne Oslo Børs</div>
                <div style="font-size: 0.85rem; color: #555;">09:00 Mandag</div>
            </div>
        </div>
        
        <div class="widget-box">
            <h3 style="margin:0; font-size: 1.1rem; font-weight: 800; margin-bottom: 15px;">Portefølje</h3>
            <div style="font-size: 0.85rem; color: #888; display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Eksponering</span>
                <span style="color: #1a1a1a; font-weight: 800;">75%</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 75%; background-color: #1a1a1a;"></div>
            </div>
            <div style="text-align: center; margin-top: 18px; font-size: 0.8rem; font-weight: 800; color: #2563EB; cursor: pointer;">
                Oppgrader Strategi
            </div>
        </div>

        <div style="background: linear-gradient(135deg, #2563EB, #1E40AF); border-radius: 28px; padding: 30px; color: white; box-shadow: 0 10px 30px rgba(37,99,235,0.2);">
            <h3 style="margin:0; font-size: 1.2rem; font-weight: 800; margin-bottom: 12px;">Trenger du hjelp?</h3>
            <p style="font-size: 0.9rem; opacity: 0.85; margin-bottom: 25px;">Få support med AI-generering eller analyser.</p>
            <div style="background: #E2FF3B; color: #1a1a1a; padding: 14px; border-radius: 14px; text-align: center; font-weight: 800; cursor: pointer;">
                Kontakt Support
            </div>
        </div>
    """, unsafe_allow_html=True)

st.caption("K-man Island © 2026 | Strategisk Intelligence Center.")
