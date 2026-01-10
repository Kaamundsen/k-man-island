import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime
import random

# ============================================
# 1. KONFIGURASJON (MÅ stå først)
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
# 2. UI/UX DESIGN (Kick-Arse Apple Style)
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1d1d1f;
    background-color: #F8F7F4;
}

.stApp {
    background-color: #F8F7F4;
}

/* Sidebar styling - Hvit, ren og alltid synlig */
section[data-testid="stSidebar"] {
    background-color: #ffffff !important;
    border-right: 1px solid #e5e5e7;
    min-width: 280px !important;
}

/* Sidebar Menu Buttons */
.stSidebar [data-testid="stVerticalBlock"] button {
    width: 100% !important;
    text-align: left !important;
    padding: 18px 25px !important;
    background: transparent !important;
    border: none !important;
    font-size: 1.2rem !important;
    font-weight: 700 !important;
    color: #1d1d1f !important;
    border-radius: 15px !important;
    margin-bottom: 5px !important;
    transition: all 0.2s ease;
}

.stSidebar [data-testid="stVerticalBlock"] button:hover {
    background-color: #f5f5f7 !important;
    transform: translateX(5px);
}

/* --- CLICKABLE CARD HACK (DENNE GANGEN SKAL DEN VIRKE!) --- */
.card-wrapper {
    position: relative;
    width: 100%;
    margin-bottom: 30px;
}

.stock-card {
    background: #ffffff;
    border-radius: 32px;
    padding: 35px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: none; /* La klikk gå gjennom til knappen under */
}

.card-wrapper:hover .stock-card {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
    border-color: #0071e3;
}

/* Den usynlige knappen dekker HELE wrapperen */
.card-wrapper .stButton {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 100 !important;
}

.card-wrapper .stButton > button {
    width: 100% !important;
    height: 100% !important;
    opacity: 0 !important; /* HELT USYNLIG */
    border: none !important;
    background: transparent !important;
    cursor: pointer !important;
}

/* Badges - KLART FORSKJELLIGE FARGER */
.badge {
    padding: 8px 18px;
    border-radius: 15px;
    font-size: 0.85rem;
    font-weight: 800;
    text-transform: uppercase;
    display: inline-block;
}
.badge-buy { background-color: #E2FF3B; color: #1a1a1a; } /* LIME GRØNN */
.badge-hold { background-color: #A3E7D8; color: #1a1a1a; } /* TEAL BLÅ */

.ticker-title {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 20px 0 5px 0;
}

.price-val {
    font-size: 2.8rem;
    font-weight: 700;
    letter-spacing: -1.5px;
}

/* Info Grid */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 30px;
    padding-top: 25px;
    border-top: 1px solid #f5f5f7;
}

.info-item label {
    display: block;
    font-size: 0.8rem;
    color: #86868b;
    font-weight: 700;
    text-transform: uppercase;
}

.info-item span {
    font-size: 1.2rem;
    font-weight: 800;
}

.green-text { color: #34c759; }
.red-text { color: #ff3b30; }

/* Massive Header i Analyse */
.massive-header {
    font-size: 6rem !important;
    font-weight: 800 !important;
    line-height: 0.85;
    letter-spacing: -4px;
    margin-bottom: 20px;
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
def fetch_data():
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
                "ticker": t, "pris": round(close, 2), 
                "endring": round(((close - df['Close'].iloc[-2]) / df['Close'].iloc[-2]) * 100, 2),
                "rsi": round(rsi, 1), "signal": "BUY" if is_buy else "HOLD", "prob": prob,
                "stop_loss": round(close * 0.965, 2), "target": round(close * 1.105, 2),
                "risk_kr": round(close * 0.035, 2), "pot_kr": round(close * 0.105, 2), "df": df
            })
        except: continue
    return sorted(results, key=lambda x: (x['signal'] != 'BUY', -x['prob']))

# ============================================
# 4. SIDEBAR (DEN STORE MENYEN!)
# ============================================
with st.sidebar:
    st.markdown("<h1 style='font-size: 2.2rem; font-weight: 800; padding: 20px 0;'>🏝️ K-man Island</h1>", unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    
    if st.button("🏠  Dashboard"):
        st.session_state.page = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
        
    if st.button("📊  Aksjeoversikt"):
        st.session_state.page = 'Overview'
        st.session_state.selected_ticker = None
        st.rerun()
        
    if st.button("📈  Dypanalyse"):
        st.session_state.page = 'Analysis'
        # Vi beholder selected_ticker hvis den finnes, ellers sender vi til første BUY
        st.rerun()
        
    st.markdown("---")
    st.caption(f"Oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. DATA LASTING
# ============================================
data = fetch_data()

# ============================================
# 6. HOVEDINNHOLD
# ============================================

# --- ANALYSE VISNING ---
if st.session_state.page == 'Analysis' or st.session_state.selected_ticker:
    # Hvis ingen ticker er valgt, velg den øverste (beste BUY)
    if not st.session_state.selected_ticker:
        st.session_state.selected_ticker = data[0]['ticker']
        
    stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
    ticker_obj = yf.Ticker(stock['ticker'])
    
    if st.button("⬅️ Tilbake til Dashboard"):
        st.session_state.selected_ticker = None
        st.session_state.page = 'Dashboard'
        st.rerun()
        
    st.markdown(f"<h1 class='massive-header'>{stock['ticker']}</h1>", unsafe_allow_html=True)
    st.markdown(f"<p style='font-size:2.2rem; color:#86868b; font-weight:700;'>{stock['pris']} NOK · <span class='green-text'>{stock['prob']}% Sannsynlighet</span></p>", unsafe_allow_html=True)
    
    col_main, col_intel = st.columns([2, 1])
    
    with col_main:
        df_p = stock['df'].tail(90)
        fig = go.Figure(data=[go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'])])
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
        fig.update_layout(height=600, xaxis_rangeslider_visible=False, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("### Siste Nyheter")
        try:
            for n in ticker_obj.news[:3]:
                st.markdown(f"**{n['title']}**<br><small>{n['publisher']}</small>", unsafe_allow_html=True)
        except: st.write("Henter nyheter...")

    with col_intel:
        st.markdown(f"""
            <div style="background:#ffffff; padding:35px; border-radius:32px; border:1px solid #e5e5e7; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                <h3 style="margin-top:0; font-weight:800;">Handelsplan</h3>
                <p>Status: <span class="badge-buy" style="padding:5px 12px; border-radius:10px;">{stock['signal']}</span></p>
                <hr style="border:0; border-top:1px solid #f5f5f7; margin:20px 0;">
                <p style="font-size:1.3rem;">Mål: <strong class='green-text'>{stock['target']} NOK</strong></p>
                <p style="font-size:1.3rem;">Sikring: <strong class='red-text'>{stock['stop_loss']} NOK</strong></p>
            </div>
            <br>
            <h3 style="font-weight:800;">Bjellesauer</h3>
            <p>• Aker ASA<br>• Canica AS<br>• Folketrygdfondet</p>
        """, unsafe_allow_html=True)

# --- DASHBOARD VISNING ---
elif st.session_state.page == 'Dashboard':
    st.markdown("<h1 style='font-size: 3.5rem; font-weight: 800; margin-bottom: 40px;'>Oversikt</h1>", unsafe_allow_html=True)
    
    cols = st.columns(3)
    for i, stock in enumerate(data[:6]):
        with cols[i % 3]:
            badge_type = "badge-buy" if stock['signal'] == "BUY" else "badge-hold"
            change_cls = "green-text" if stock['endring'] >= 0 else "red-text"
            arrow = "▲" if stock['endring'] >= 0 else "▼"
            
            st.markdown(f"""
                <div class="card-wrapper">
                    <div class="stock-card">
                        <span class="badge {badge_type}">{stock['signal']}</span>
                        <div class="ticker-title">{stock['ticker']}</div>
                        <div class="price-val">{stock['pris']} NOK</div>
                        <div class="{change_cls}" style="font-weight:800; font-size:1.3rem;">{arrow} {abs(stock['endring'])}%</div>
                        <div class="info-grid">
                            <div class="info-item"><label>Gevinst</label><span class="green-text">+{stock['pot_kr']} kr</span></div>
                            <div class="info-item"><label>Risiko</label><span class="red-text">-{stock['risk_kr']} kr</span></div>
                        </div>
                    </div>
            """, unsafe_allow_html=True)
            
            # USYNLIG KNAPP OVER HELE KORTET
            if st.button("", key=f"btn_{stock['ticker']}"):
                st.session_state.selected_ticker = stock['ticker']
                st.session_state.page = 'Analysis'
                st.rerun()
            
            st.markdown("</div>", unsafe_allow_html=True)

# --- OVERSIKT VISNING ---
elif st.session_state.page == 'Overview':
    st.markdown("<h1 style='font-size: 3.5rem; font-weight: 800; margin-bottom: 40px;'>Full Aksjeoversikt</h1>", unsafe_allow_html=True)
    df_disp = pd.DataFrame([{ "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], "Endring": f"{d['endring']}%", "Prob": f"{d['prob']}%" } for d in data])
    st.table(df_disp)

st.markdown("---")
st.caption("K-man Island © 2026 | Strategisk Intelligence Center.")
