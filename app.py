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
# 2. DESIGN (Inspirert av det nye designet)
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

/* Sidebar Styling - Minimalist */
section[data-testid="stSidebar"] {
    background-color: #ffffff !important;
    border-right: 1px solid #f0f0f0;
    min-width: 80px !important;
}

/* Sidebar Nav Buttons as Icons */
.stSidebar button {
    background: transparent !important;
    border: none !important;
    font-size: 1.5rem !important;
    margin-bottom: 20px !important;
    color: #888 !important;
}
.stSidebar button:hover {
    color: #1a1a1a !important;
}

/* Header */
.top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.search-bar {
    background: white;
    border-radius: 12px;
    padding: 8px 15px;
    border: 1px solid #eee;
    width: 300px;
    color: #888;
    font-size: 0.9rem;
}

/* Status Cards - Vibrant Colors */
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
    transition: transform 0.2s;
}
.card-lime { background-color: #E2FF3B; }
.card-teal { background-color: #A3E7D8; }
.card-pink { background-color: #FFB5B5; }

.status-number { font-size: 3rem; font-weight: 800; line-height: 1; }
.status-label { font-size: 1rem; font-weight: 600; color: #444; }
.status-icon { position: absolute; top: 20px; right: 20px; font-size: 1.5rem; opacity: 0.6; }

/* Content Cards (Stock Opportunities) */
.stock-card {
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 24px;
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
}
.stock-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }

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

.card-body { padding: 20px; }

.progress-container { margin-top: 15px; }
.progress-bar-bg { background-color: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease-in-out; }

/* Widget Styles */
.widget-box {
    background: white;
    border-radius: 24px;
    padding: 25px;
    margin-bottom: 20px;
    border: 1px solid #f0f0f0;
}

/* Clicking Hack */
.card-wrapper { position: relative; }
.card-wrapper .stButton > button {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    opacity: 0 !important;
    z-index: 10 !important;
}

/* Analysis Massive Header */
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
# 4. SIDEBAR (Ikon-basert)
# ============================================
with st.sidebar:
    st.markdown("<div style='text-align: center; padding: 20px 0;'>🏝️</div>", unsafe_allow_html=True)
    if st.button("🏠"):
        st.session_state.page = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
    if st.button("📊"):
        st.session_state.page = 'Overview'
        st.rerun()
    if st.button("📁"): pass
    if st.button("👤"): pass
    if st.button("⚙️"): pass

# ============================================
# 5. DATA LASTING
# ============================================
data = fetch_and_analyze()

# Layout: Main Content | Widgets
c_main, c_side = st.columns([3, 1])

with c_main:
    # --- Top Header ---
    st.markdown("""
        <div class="top-header">
            <div class="search-bar">🔍 Søk aksjer, trender...</div>
            <div style="background: black; color: white; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer;">
                + Ny Analyse
            </div>
        </div>
    """, unsafe_allow_html=True)

    # --- Dashbord Oversikt ---
    if st.session_state.page == 'Dashboard' and not st.session_state.selected_ticker:
        st.markdown("<h1 style='font-size: 2.5rem; font-weight: 800; margin-bottom: 30px;'>Oversikt</h1>", unsafe_allow_html=True)
        
        # User Card
        st.markdown("""
            <div style="background: white; border-radius: 24px; padding: 30px; display: flex; align-items: center; gap: 20px; border: 1px solid #f0f0f0; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">👤</div>
                <div>
                    <h2 style="margin:0; font-size: 1.5rem;">K-man Trader</h2>
                    <p style="margin:0; color: #888;">Strategisk Portefølje · Oslo & Viken</p>
                </div>
            </div>
        """, unsafe_allow_html=True)

        # Status Cards
        c1, c2, c3 = st.columns(3)
        buys = len([d for d in data if d['signal'] == 'BUY'])
        with c1: st.markdown(f'<div class="status-card card-lime"><span class="status-icon">🕒</span><div class="status-number">{buys}</div><div class="status-label">Hot Kjøp Nå</div></div>', unsafe_allow_html=True)
        with c2: st.markdown(f'<div class="status-card card-teal"><span class="status-icon">✔️</span><div class="status-number">{len(data)-buys}</div><div class="status-label">Stabile Hold</div></div>', unsafe_allow_html=True)
        with c3: st.markdown(f'<div class="status-card card-pink"><span class="status-icon">📝</span><div class="status-number">0</div><div class="status-label">Salg / Risk</div></div>', unsafe_allow_html=True)

        st.markdown("<h2 style='font-size: 1.5rem; font-weight: 800; margin: 40px 0 20px 0;'>Dagens Muligheter</h2>", unsafe_allow_html=True)
        
        # Grid med aksjer (Kick-arse cards)
        cols = st.columns(2)
        for i, stock in enumerate(data[:4]):
            with cols[i % 2]:
                badge_class = "badge-buy" if stock['signal'] == "BUY" else "badge-hold"
                prog_color = "#E2FF3B" if stock['prob'] > 70 else "#A3E7D8"
                
                st.markdown(f"""
                <div class="card-wrapper">
                    <div class="stock-card">
                        <div class="card-image-section">
                            <span class="card-badge {badge_class}">{stock['signal']}</span>
                            <div class="card-title-area">
                                <h3 style="margin:0; font-size: 1.5rem; font-weight: 800;">{stock['ticker']}</h3>
                                <span style="font-size: 0.8rem;">Oslo Børs · #{i+1} Hotlist</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; align-items: end;">
                                <div>
                                    <div style="font-size: 0.7rem; color: #888; text-transform: uppercase;">Pris</div>
                                    <div style="font-size: 1.25rem; font-weight: 800;">{stock['pris']} NOK</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.7rem; color: #888; text-transform: uppercase;">Potensial</div>
                                    <div style="font-size: 1.25rem; font-weight: 800; color: #34c759;">+10.5%</div>
                                </div>
                            </div>
                            <div class="progress-container">
                                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 5px;">
                                    <span>Gevinst-sannsynlighet</span>
                                    <span>{stock['prob']}%</span>
                                </div>
                                <div class="progress-bar-bg">
                                    <div class="progress-bar-fill" style="width: {stock['prob']}%; background-color: {prog_color};"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                if st.button("", key=f"btn_{stock['ticker']}"):
                    st.session_state.selected_ticker = stock['ticker']
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)

    # --- Dypanalyse ---
    elif st.session_state.selected_ticker:
        stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
        if st.button("⬅️ Tilbake"):
            st.session_state.selected_ticker = None
            st.rerun()
        
        st.markdown(f"<h1 class='massive-header'>{stock['ticker']}</h1>", unsafe_allow_html=True)
        st.markdown(f"<p style='font-size: 2rem; color: #888;'>{stock['pris']} NOK · <span style='color: #34c759;'>{stock['prob']}% Prob.</span></p>", unsafe_allow_html=True)
        
        df_p = stock['df'].tail(90)
        fig = go.Figure(data=[go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'])])
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
        fig.update_layout(height=600, xaxis_rangeslider_visible=False, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)

    # --- Full Oversikt ---
    elif st.session_state.page == 'Overview':
        st.markdown("<h1 style='font-size: 2.5rem; font-weight: 800;'>Børsoversikt</h1>", unsafe_allow_html=True)
        df_disp = pd.DataFrame([{ "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], "Sannsynlighet": f"{d['prob']}%" } for d in data])
        st.table(df_disp)

with c_side:
    st.markdown("<br><br><br><br>", unsafe_allow_html=True)
    # Agenda Widget
    st.markdown("""
        <div class="widget-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin:0; font-size: 1rem; font-weight: 800;">Min Agenda</h3>
                <span style="font-size: 0.7rem; color: #888;">☀️ 14°C Oslo</span>
            </div>
            <div style="padding: 15px; background: #F8F7F4; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #1a1a1a;">
                <div style="font-size: 0.7rem; color: #888;">NESTE TRADE</div>
                <div style="font-weight: 800;">Åpne Oslo Børs</div>
                <div style="font-size: 0.8rem; color: #555;">09:00 Mandag</div>
            </div>
        </div>
    """, unsafe_allow_html=True)

    # Lagringsplass/Portefølje Widget
    st.markdown("""
        <div class="widget-box">
            <h3 style="margin:0; font-size: 1rem; font-weight: 800; margin-bottom: 15px;">Portefølje</h3>
            <div style="font-size: 0.8rem; color: #888; display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Eksponering</span>
                <span>100% Totalt</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 75%; background-color: #1a1a1a;"></div>
            </div>
            <div style="text-align: center; margin-top: 15px; font-size: 0.8rem; font-weight: 700; color: #2563EB;">Oppgrader Plan</div>
        </div>
    """, unsafe_allow_html=True)

    # Help Widget
    st.markdown("""
        <div style="background: linear-gradient(135deg, #2563EB, #1E40AF); border-radius: 24px; padding: 25px; color: white;">
            <h3 style="margin:0; font-size: 1.1rem; font-weight: 800; margin-bottom: 10px;">Trenger du hjelp?</h3>
            <p style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 20px;">Få support med AI-generering eller analyser.</p>
            <div style="background: #E2FF3B; color: #1a1a1a; padding: 12px; border-radius: 12px; text-align: center; font-weight: 800;">
                Kontakt Support
            </div>
        </div>
    """, unsafe_allow_html=True)

st.caption("K-man Island © 2026 | Strategisk Intelligence Center.")
