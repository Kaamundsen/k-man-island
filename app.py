import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime
import random

# ============================================
# 1. KONFIGURASJON
# ============================================
st.set_page_config(
    page_title="K-man Island | Intelligence",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Session State for navigering
if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None
if 'page' not in st.session_state:
    st.session_state.page = 'Dashboard'

# ============================================
# 2. APPLE-STYLE UI/UX (CSS)
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1d1d1f;
    background-color: #ffffff;
}

.stApp {
    background-color: #ffffff;
}

/* Sidebar Styling */
section[data-testid="stSidebar"] {
    background-color: #f5f5f7 !important;
    border-right: 1px solid #d2d2d7;
}

/* Sidebar Nav Buttons */
.stSidebar button {
    width: 100% !important;
    text-align: left !important;
    justify-content: flex-start !important;
    background: transparent !important;
    border: none !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    padding: 15px 25px !important;
}
.stSidebar button:hover {
    background-color: #e8e8ed !important;
}

/* --- CLICKABLE CARD HACK --- */
.card-wrapper {
    position: relative;
    margin-bottom: 25px;
}

.stock-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 30px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    transition: all 0.3s cubic-bezier(0, 0, 0.5, 1);
}

.card-wrapper:hover .stock-card {
    transform: scale(1.02);
    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
    border-color: #0071e3;
}

/* Usynlig dekkende knapp over hele kortet */
.card-wrapper .stButton > button {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    opacity: 0 !important;
    z-index: 10 !important;
}

/* Badges med riktige farger */
.badge {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    color: white;
}
.badge-buy { background-color: #34c759; }
.badge-hold { background-color: #86868b; }

.ticker-text {
    font-size: 2rem;
    font-weight: 800;
    margin: 15px 0 5px 0;
}

.price-text {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -1.5px;
}

/* Info Grid */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid #f5f5f7;
}

.info-item label {
    display: block;
    font-size: 0.85rem;
    color: #86868b;
    font-weight: 600;
}

.info-item span {
    font-size: 1.1rem;
    font-weight: 700;
}

.up { color: #34c759; }
.down { color: #ff3b30; }

/* Stor Header i Analyse */
.big-header {
    font-size: 5rem !important;
    font-weight: 800 !important;
    letter-spacing: -3px;
}
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR & MOCK DATA
# ============================================
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", "EQNR.OL", "YAR.OL", "NHY.OL", 
    "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", 
    "LSG.OL", "SALM.OL", "BAKK.OL", "TOM.OL", "KOG.OL", "BORR.OL", "OKEA.OL"
]

def get_intel(ticker):
    return {
        "insiders": [{"navn": "Kjell Inge Røkke", "endring": "+12%", "dato": "10.05.24"}, {"navn": "John Fredriksen", "endring": "+5%", "dato": "12.05.24"}],
        "bjellesauer": ["Folketrygdfondet", "Aker ASA", "Canica AS"]
    }

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
            prob = min(max(int((100 - rsi) * 1.2), 15), 95)
            
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
    st.markdown("<h1 style='font-size: 2rem; font-weight: 800; padding: 20px;'>🏝️ K-man</h1>", unsafe_allow_html=True)
    
    if st.button("🏠  Dashboard"):
        st.session_state.page = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
        
    if st.button("📊  Full Børsoversikt"):
        st.session_state.page = 'Overview'
        st.session_state.selected_ticker = None
        st.rerun()
        
    st.markdown("---")
    st.caption(f"Live Oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

# --- ANALYSE VISNING ---
if st.session_state.selected_ticker:
    stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
    intel = get_intel(stock['ticker'])
    
    if st.button("⬅️ Tilbake til Dashboard"):
        st.session_state.selected_ticker = None
        st.rerun()
        
    st.markdown(f"<h1 class='big-header'>{stock['ticker']}</h1>", unsafe_allow_html=True)
    st.markdown(f"<p style='font-size:1.8rem; color:#86868b;'>{stock['pris']} NOK · <span class='up'>{stock['prob']}% Sannsynlighet</span></p>", unsafe_allow_html=True)
    
    col_l, col_r = st.columns([2, 1])
    with col_l:
        df_p = stock['df'].tail(90)
        fig = go.Figure(data=[go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'])])
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
        fig.update_layout(height=600, xaxis_rangeslider_visible=False, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("### Siste Nyheter")
        st.info(f"Henter siste markedsoppdateringer for {stock['ticker']}...")

    with col_r:
        st.markdown(f"""
            <div style="background:#f5f5f7; padding:30px; border-radius:24px; border:1px solid #e5e5e7;">
                <h3 style="margin-top:0;">Handelsplan</h3>
                <p>Status: <strong class='up'>{stock['signal']}</strong></p>
                <hr>
                <p>Inngang: <strong>{stock['pris']} NOK</strong></p>
                <p>Target: <strong class='up'>{stock['target']} NOK</strong></p>
                <p>Stop Loss: <strong class='down'>{stock['stop_loss']} NOK</strong></p>
            </div>
            <br>
            <h3>Innsidehandel</h3>
        """, unsafe_allow_html=True)
        for i in intel['insiders']:
            st.write(f"• **{i['navn']}**: {i['endring']} ({i['dato']})")
        
        st.markdown("<br><h3>Bjellesauer</h3>", unsafe_allow_html=True)
        for b in intel['bjellesauer']:
            st.write(f"• {b}")

# --- DASHBOARD VISNING ---
elif st.session_state.page == 'Dashboard':
    st.markdown("<h1 style='font-size: 3rem; font-weight: 800; margin-bottom: 40px;'>Oversikt</h1>", unsafe_allow_html=True)
    
    cols = st.columns(3)
    for i, stock in enumerate(data[:6]):
        with cols[i % 3]:
            badge_class = "badge-buy" if stock['signal'] == "BUY" else "badge-hold"
            change_color = "up" if stock['endring'] >= 0 else "down"
            arrow = "▲" if stock['endring'] >= 0 else "▼"
            
            st.markdown(f"""
                <div class="card-wrapper">
                    <div class="stock-card">
                        <span class="badge {badge_class}">{stock['signal']}</span>
                        <div class="ticker-text">{stock['ticker']}</div>
                        <div class="price-text">{stock['pris']} NOK</div>
                        <div class="{change_color}" style="font-weight:700;">{arrow} {abs(stock['endring'])}%</div>
                        <div class="info-grid">
                            <div class="info-item"><label>Gevinst</label><span class="up">+{stock['pot_kr']} kr</span></div>
                            <div class="info-item"><label>Risiko</label><span class="down">-{stock['risk_kr']} kr</span></div>
                        </div>
                    </div>
            """, unsafe_allow_html=True)
            
            if st.button("", key=f"card_btn_{stock['ticker']}"):
                st.session_state.selected_ticker = stock['ticker']
                st.rerun()
            
            st.markdown("</div>", unsafe_allow_html=True)

# --- OVERSIKT VISNING ---
elif st.session_state.page == 'Overview':
    st.markdown("<h1 style='font-size: 3rem; font-weight: 800; margin-bottom: 40px;'>Full Børsoversikt</h1>", unsafe_allow_html=True)
    df_display = pd.DataFrame([{ "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], "Endring": f"{d['endring']}%", "Gevinst Prob": f"{d['prob']}%" } for d in data])
    st.table(df_display)

st.markdown("---")
st.caption("K-man Island © 2026 | Kick Arse Strategy for Oslo Børs.")
