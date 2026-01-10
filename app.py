import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

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
# 2. DESIGN (Modern Light Apple Style)
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

/* Sidebar Styling */
section[data-testid="stSidebar"] {
    background-color: #ffffff !important;
    border-right: 1px solid #e5e7eb;
}

/* Stock Card Styling */
.stock-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 20px;
    border: 1px solid #f0f0f0;
    transition: all 0.2s ease;
}

.stock-card:hover {
    box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    border-color: #E2FF3B;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 15px;
}

.ticker-title {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0;
}

.badge {
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}
.badge-buy { background-color: #E2FF3B; color: #1a1a1a; }
.badge-hold { background-color: #A3E7D8; color: #1a1a1a; }

.status-card {
    border-radius: 20px;
    padding: 24px;
    height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.card-lime { background-color: #E2FF3B; }
.card-teal { background-color: #A3E7D8; }
.card-pink { background-color: #FFB5B5; }

.massive-header {
    font-size: 4.5rem !important;
    font-weight: 800 !important;
    letter-spacing: -2px;
    margin-bottom: 0;
}

/* Custom Button Styling to look like a link */
div.stButton > button {
    background-color: transparent !important;
    color: #2563EB !important;
    border: none !important;
    font-weight: 700 !important;
    font-size: 0.95rem !important;
    padding: 0 !important;
    text-align: left !important;
}
div.stButton > button:hover {
    color: #1E40AF !important;
    text-decoration: underline !important;
}

/* Sidebar button styling */
.sidebar-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
}
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR
# ============================================
watchlist = ["VAR.OL", "TOM.OL", "OKEA.OL", "NOD.OL", "SATS.OL", "KID.OL", "FRO.OL", "GOGL.OL"]

@st.cache_data(ttl=1800)
def fetch_data():
    results = []
    for t in watchlist:
        try:
            df = yf.download(t, period="1y", interval="1d", progress=False)
            if df.empty or len(df) < 30: continue
            if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.droplevel(1)
            
            close = float(df['Close'].iloc[-1])
            prev_close = float(df['Close'].iloc[-2])
            rsi = ta.rsi(df['Close'], length=14).iloc[-1]
            sma20 = ta.sma(df['Close'], length=20).iloc[-1]
            
            is_buy = (rsi < 55) and (close > sma20)
            prob = min(max(int((100 - rsi) * 1.3), 10), 95)
            
            results.append({
                "ticker": t,
                "pris": round(close, 2),
                "endring": round(((close - prev_close) / prev_close) * 100, 2),
                "signal": "BUY" if is_buy else "HOLD",
                "prob": prob,
                "df": df
            })
        except: continue
    return sorted(results, key=lambda x: (x['signal'] != 'BUY', -x['prob']))

# ============================================
# 4. SIDEBAR NAVIGASJON
# ============================================
with st.sidebar:
    st.markdown("<h2 style='font-weight:800;'>K-man Island</h2>", unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    
    if st.button("🏠 Dashboard"):
        st.session_state.page = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
        
    if st.button("📋 Scanner"):
        st.session_state.page = 'Scanner'
        st.rerun()
        
    if st.button("📈 Analyse"):
        if st.session_state.selected_ticker:
            st.session_state.page = 'Analyse'
        else:
            st.warning("Velg en aksje først")
        st.rerun()

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_data()

c_main, c_side = st.columns([3, 1])

with c_main:
    # --- DASHBOARD VIEW ---
    if st.session_state.page == 'Dashboard' and not st.session_state.selected_ticker:
        st.markdown("<h1 style='font-weight:800; font-size: 2.5rem;'>Oversikt</h1>", unsafe_allow_html=True)
        
        # Status Cards
        c1, c2, c3 = st.columns(3)
        buys = len([d for d in data if d['signal'] == 'BUY'])
        with c1: st.markdown(f'<div class="status-card card-lime"><div>Hot Kjøp</div><div style="font-size:3rem; font-weight:800;">{buys}</div></div>', unsafe_allow_html=True)
        with c2: st.markdown(f'<div class="status-card card-teal"><div>Stabile Hold</div><div style="font-size:3rem; font-weight:800;">{len(data)-buys}</div></div>', unsafe_allow_html=True)
        with c3: st.markdown(f'<div class="status-card card-pink"><div>Risk / Salg</div><div style="font-size:3rem; font-weight:800;">0</div></div>', unsafe_allow_html=True)
        
        st.markdown("<h2 style='font-weight:800; margin-top:40px;'>Dagens Muligheter</h2>", unsafe_allow_html=True)
        
        cols = st.columns(2)
        for i, stock in enumerate(data[:4]):
            with cols[i % 2]:
                badge_class = "badge-buy" if stock['signal'] == "BUY" else "badge-hold"
                
                # Render Card UI
                st.markdown(f"""
                <div class="stock-card">
                    <div class="card-header">
                        <h3 class="ticker-title">{stock['ticker']}</h3>
                        <span class="badge {badge_class}">{stock['signal']}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div>
                            <div style="color: #888; font-size: 0.75rem; text-transform: uppercase;">Pris</div>
                            <div style="font-size: 1.4rem; font-weight: 800;">{stock['pris']} NOK</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #888; font-size: 0.75rem; text-transform: uppercase;">Gevinstsannsynlighet</div>
                            <div style="font-size: 1.4rem; font-weight: 800; color: #34c759;">{stock['prob']}%</div>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                
                # The Action Link (Standard Streamlit Button styled as link)
                if st.button(f"Sjekk dypanalyse for {stock['ticker']} →", key=f"btn_{stock['ticker']}"):
                    st.session_state.selected_ticker = stock['ticker']
                    st.session_state.page = 'Analyse'
                    st.rerun()
                    
                st.markdown("</div>", unsafe_allow_html=True)

    # --- SCANNER VIEW ---
    elif st.session_state.page == 'Scanner':
        st.markdown("<h1 style='font-weight:800;'>Aksje-Scanner</h1>", unsafe_allow_html=True)
        df_disp = pd.DataFrame([{ "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], "Prob": f"{d['prob']}%" } for d in data])
        st.table(df_disp)

    # --- ANALYSE VIEW ---
    elif st.session_state.page == 'Analyse' or st.session_state.selected_ticker:
        ticker = st.session_state.selected_ticker
        stock = next((d for d in data if d['ticker'] == ticker), None)
        
        if stock:
            if st.button("← Tilbake til Dashboard"):
                st.session_state.selected_ticker = None
                st.session_state.page = 'Dashboard'
                st.rerun()
                
            st.markdown(f"<h1 class='massive-header'>{stock['ticker']}</h1>", unsafe_allow_html=True)
            st.markdown(f"<p style='font-size: 1.5rem; color: #888;'>Pris: {stock['pris']} NOK | <span style='color:#34c759; font-weight:700;'>{stock['prob']}% Probabilitet</span></p>", unsafe_allow_html=True)
            
            df_p = stock['df'].tail(60)
            fig = go.Figure(data=[go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'])])
            fig.update_layout(height=500, template="plotly_white", xaxis_rangeslider_visible=False)
            st.plotly_chart(fig, use_container_width=True)
            
            # Siste Nyheter (Mock)
            st.markdown("### Siste Nyheter & Analyse")
            st.markdown(f"""
            - **Finansavisen:** {stock['ticker']} viser styrke i teknisk formasjon.
            - **E24:** Innsidere øker eksponeringen med 15%.
            - **DNB Markets:** Opprettholder kjøpsanbefaling med kursmål +20%.
            """)

with c_side:
    st.markdown("<br><br><br>", unsafe_allow_html=True)
    st.markdown("""
    <div style="background: white; border-radius: 20px; padding: 24px; border: 1px solid #f0f0f0;">
        <h3 style="margin:0; font-size: 1rem; font-weight: 800;">Min Portefølje</h3>
        <p style="color: #888; font-size: 0.85rem;">Total eksponering: 75%</p>
        <div style="height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
            <div style="width: 75%; height: 100%; background: #1a1a1a;"></div>
        </div>
    </div>
    <br>
    <div style="background: #2563EB; border-radius: 20px; padding: 24px; color: white;">
        <h3 style="margin:0; font-size: 1rem; font-weight: 800;">AI Advisor</h3>
        <p style="font-size: 0.85rem; opacity: 0.9;">Markedet er i en bullish trend. Vurder å øke posisjon i energi-sektoren.</p>
    </div>
    """, unsafe_allow_html=True)

st.caption("K-man Island © 2026 | Strategisk Intelligence Center.")
