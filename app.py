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

# Session State
if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None
if 'view' not in st.session_state:
    st.session_state.view = 'Dashboard'

# ============================================
# 2. KICK ARSE DESIGN (CSS)
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

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
    border-right: 1px solid #f0f0f0;
}

/* --- CLICKABLE CARD HACK --- */
.card-container {
    position: relative;
    width: 100%;
}

.content-card {
    background: #ffffff;
    border-radius: 32px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid #f0f0f0;
    margin-bottom: 24px;
}

.card-container:hover .content-card { 
    transform: translateY(-10px); 
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
    border: 1px solid #E2FF3B;
}

/* Gjør Streamlit-knappen usynlig over hele kortet */
.card-container .stButton > button {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    opacity: 0 !important;
    z-index: 100 !important;
    border: none !important;
    cursor: pointer !important;
}

.card-header-vibrant {
    height: 140px;
    background: linear-gradient(135deg, #1a1a1a 0%, #434343 100%);
    padding: 30px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.card-badge {
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 6px 16px;
    border-radius: 14px;
    font-size: 0.85rem;
    font-weight: 800;
    text-transform: uppercase;
}
.badge-buy { background-color: #E2FF3B; color: #1a1a1a; }
.badge-hold { background-color: #A3E7D8; color: #1a1a1a; }
.badge-sell { background-color: #FFB5B5; color: #1a1a1a; }

.card-ticker {
    font-size: 2.5rem;
    font-weight: 800;
    color: white;
    margin: 0;
}

.card-body { padding: 30px; }

.card-price {
    font-size: 2.8rem;
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -1.5px;
    line-height: 1;
}

/* Gevinst/Risiko Grid */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 25px;
    padding-top: 25px;
    border-top: 1px solid #f5f5f7;
}

.info-item label {
    display: block;
    font-size: 0.85rem;
    color: #86868b;
    font-weight: 700;
    margin-bottom: 6px;
    text-transform: uppercase;
}

.info-item span {
    font-size: 1.2rem;
    font-weight: 800;
}

.potential-up { color: #34c759; }
.risk-down { color: #ff3b30; }

/* Status Cards */
.status-card {
    border-radius: 28px;
    padding: 30px;
    color: #1a1a1a;
    height: 170px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}
.card-lime { background-color: #E2FF3B; }
.card-teal { background-color: #A3E7D8; }
.card-pink { background-color: #FFB5B5; }

.status-number { font-size: 3.5rem; font-weight: 800; line-height: 1; }
.status-label { font-size: 1.1rem; font-weight: 700; opacity: 0.8; }

/* Widgets */
.widget-card {
    background: white; border-radius: 28px; padding: 25px; margin-bottom: 20px;
    border: 1px solid #f0f0f0;
}

/* Analysis Page */
.big-header {
    font-size: 5rem !important;
    font-weight: 800 !important;
    line-height: 0.9;
    letter-spacing: -3px;
    margin-bottom: 15px;
}

.news-card {
    background: white; padding: 20px; border-radius: 20px;
    margin-bottom: 12px; border: 1px solid #f0f0f0;
}

.insider-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 0; border-bottom: 1px solid #f8f8f8;
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

def get_mock_insiders(ticker):
    names = ["Kjell Inge Røkke", "John Fredriksen", "Øystein Stray Spetalen", "Tor Olav Trøim", "Arne Fredly"]
    insiders = []
    for _ in range(random.randint(2, 4)):
        insiders.append({
            "navn": random.choice(names),
            "endring": f"+{random.randint(1, 15)}%",
            "type": "Kjøp",
            "dato": "2024-05-15"
        })
    return insiders

def get_mock_bjellesauer(ticker):
    sauer = ["Folketrygdfondet", "Aker ASA", "Canica AS", "Geveran Trading", "Skagenfondene"]
    return random.sample(sauer, random.randint(2, 4))

@st.cache_data(ttl=1800)
def fetch_and_analyze():
    results = []
    for t in watchlist:
        try:
            df = yf.download(t, period="1y", interval="1d", progress=False)
            if df.empty or len(df) < 60: continue
            if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.droplevel(1)
            
            df['RSI'] = ta.rsi(df['Close'], length=14)
            df['SMA20'] = ta.sma(df['Close'], length=20)
            
            last = df.iloc[-1]
            prev = df.iloc[-2]
            close = float(last['Close'])
            rsi = float(last['RSI'])
            
            is_buy = (rsi < 55) and (close > df['SMA20'].iloc[-1]) and (prev['Close'] <= df['SMA20'].iloc[-2])
            is_sell = (rsi > 70) or (close < df['SMA20'].iloc[-1] and prev['Close'] >= df['SMA20'].iloc[-2])
            
            prob_score = 50
            if 35 < rsi < 50: prob_score += 20
            if close > df['SMA20'].iloc[-1]: prob_score += 10
            prob_score = min(max(prob_score, 15), 95)
            
            results.append({
                "ticker": t,
                "pris": round(close, 2),
                "endring": round(((close - prev['Close']) / prev['Close']) * 100, 2),
                "rsi": round(rsi, 1),
                "signal": "BUY" if is_buy else "SELL" if is_sell else "HOLD",
                "prob_score": prob_score,
                "stop_loss": round(close * 0.965, 2),
                "target": round(close * 1.105, 2),
                "risk_kr": round(close * 0.035, 2),
                "pot_kr": round(close * 0.105, 2),
                "df": df
            })
        except: continue
    
    def hotness_key(x):
        rank = {"BUY": 0, "HOLD": 1, "SELL": 2}
        return (rank.get(x['signal'], 3), -x['prob_score'])
        
    return sorted(results, key=hotness_key)

# ============================================
# 4. SIDEBAR (VENSTRE MENY)
# ============================================
with st.sidebar:
    st.markdown("<div style='padding: 20px 0;'><h1 style='font-size: 2rem; font-weight: 800;'>🏝️ K-man</h1></div>", unsafe_allow_html=True)
    
    if st.button("🏠  Dashboard", use_container_width=True, type="primary" if st.session_state.view == 'Dashboard' else "secondary"):
        st.session_state.view = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
        
    if st.button("📊  Børsoversikt", use_container_width=True, type="primary" if st.session_state.view == 'Scanner' else "secondary"):
        st.session_state.view = 'Scanner'
        st.session_state.selected_ticker = None
        st.rerun()
        
    st.markdown("---")
    st.caption(f"Oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. DATA LASTING
# ============================================
data = fetch_and_analyze()

# Layout
c_main, c_side = st.columns([3, 1])

# ============================================
# 6. HOVEDINNHOLD
# ============================================
with c_main:
    # ANALYSE VISNING
    if st.session_state.selected_ticker:
        stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
        ticker_obj = yf.Ticker(stock['ticker'])
        
        if st.button("⬅️ Tilbake til oversikt"):
            st.session_state.selected_ticker = None
            st.rerun()
            
        st.markdown(f"<h1 class='big-header'>{stock['ticker']}</h1>", unsafe_allow_html=True)
        st.markdown(f"<p style='font-size:1.8rem; color:#888; font-weight:700;'>{stock['pris']} NOK · <span style='color:#34c759;'>{stock['prob_score']}% Probability</span></p>", unsafe_allow_html=True)
        
        col_l, col_r = st.columns([2, 1])
        with col_l:
            df_p = stock['df'].tail(90)
            fig = go.Figure()
            fig.add_trace(go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'], name="Pris"))
            fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
            fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
            fig.update_layout(height=600, xaxis_rangeslider_visible=False, template="plotly_white")
            st.plotly_chart(fig, use_container_width=True)
            
            st.markdown("### Siste Nyheter")
            try:
                news = ticker_obj.news[:3]
                for n in news:
                    st.markdown(f"""<div class="news-card"><strong>{n['title']}</strong><br><small>{n['publisher']} · {datetime.fromtimestamp(n['providerPublishTime']).strftime('%d.%m %H:%M')}</small></div>""", unsafe_allow_html=True)
            except: st.info("Ingen ferske nyheter funnet.")

        with col_r:
            st.markdown("### Innsidehandel")
            insiders = get_mock_insiders(stock['ticker'])
            for i in insiders:
                st.markdown(f"""<div class="insider-row"><span><strong>{i['navn']}</strong><br><small>{i['type']} · {i['dato']}</small></span><span style="color:#34c759; font-weight:800; font-size:1.1rem;">{i['endring']}</span></div>""", unsafe_allow_html=True)
            
            st.markdown("<br>### Bjellesauer", unsafe_allow_html=True)
            bjellesauer = get_mock_bjellesauer(stock['ticker'])
            for s in bjellesauer:
                st.markdown(f"• **{s}**")

    # DASHBOARD VISNING
    elif st.session_state.view == 'Dashboard':
        st.markdown("<h1 style='font-size: 3.5rem; font-weight: 800; margin-bottom: 40px;'>Oversikt</h1>", unsafe_allow_html=True)
        
        c1, c2, c3 = st.columns(3)
        buys = len([d for d in data if d['signal'] == 'BUY'])
        holds = len([d for d in data if d['signal'] == 'HOLD'])
        sells = len([d for d in data if d['signal'] == 'SELL'])

        with c1: st.markdown(f'<div class="status-card card-lime"><div class="status-number">{buys}</div><div class="status-label">Hot Kjøp Nå</div></div>', unsafe_allow_html=True)
        with c2: st.markdown(f'<div class="status-card card-teal"><div class="status-number">{holds}</div><div class="status-label">Stabile Hold</div></div>', unsafe_allow_html=True)
        with c3: st.markdown(f'<div class="status-card card-pink"><div class="status-number">{sells}</div><div class="status-label">Salg / Risk</div></div>', unsafe_allow_html=True)

        st.markdown("<h2 style='font-size:2rem; font-weight:800; margin: 50px 0 30px 0;'>Dagens Muligheter</h2>", unsafe_allow_html=True)
        
        display_picks = data[:6]
        cols = st.columns(2)
        for i, stock in enumerate(display_picks):
            with cols[i % 2]:
                badge_class = f"badge-{stock['signal'].lower()}"
                st.markdown(f"""
                <div class="card-container">
                    <div class="content-card">
                        <div class="card-header-vibrant">
                            <span class="card-badge {badge_class}">{stock['signal']}</span>
                            <h3 class="card-ticker">{stock['ticker']}</h3>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; align-items: end;">
                                <div><div class="card-price">{stock['pris']} NOK</div><div style="color:{'#34c759' if stock['endring'] >= 0 else '#ff3b30'}; font-weight:800; font-size:1.3rem;">{'▲' if stock['endring'] >= 0 else '▼'} {abs(stock['endring'])}%</div></div>
                                <div style="text-align: right;"><div style="font-size: 1rem; color: #888; text-transform: uppercase; font-weight:700;">Probability</div><div style="font-size: 2.5rem; font-weight: 800; color:#1a1a1a;">{stock['prob_score']}%</div></div>
                            </div>
                            <div class="info-grid"><div class="info-item"><label>Gevinstpotensial</label><span class="potential-up">+{stock['pot_kr']} kr / 10.5%</span></div><div class="info-item"><label>Risiko (3.5% SL)</label><span class="risk-down">-{stock['risk_kr']} kr / 3.5%</span></div></div>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                if st.button("", key=f"btn_{stock['ticker']}"):
                    st.session_state.selected_ticker = stock['ticker']
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)

    elif st.session_state.view == 'Scanner':
        st.markdown("<h1 style='font-size:3rem; font-weight:800;'>Full Børsoversikt</h1>", unsafe_allow_html=True)
        df_display = pd.DataFrame([{ "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], "Endring": f"{d['endring']}%", "Prob": f"{d['prob_score']}%" } for d in data])
        st.table(df_display)

# ============================================
# 7. HØYRE SIDE (WIDGETS)
# ============================================
with c_side:
    st.markdown("<br><br><br><br>", unsafe_allow_html=True)
    st.markdown("""
        <div class="widget-card">
            <h3 style="margin:0; font-size: 1.2rem; font-weight: 800; margin-bottom: 20px;">Min Agenda</h3>
            <div style="padding: 20px; background: #F8F7F4; border-radius: 16px; margin-bottom: 12px; border-left: 5px solid #1a1a1a;">
                <div style="font-size: 0.8rem; color: #888; font-weight:800; text-transform:uppercase;">Neste Handleplan</div>
                <div style="font-weight: 800; font-size:1.1rem; margin-top:5px;">Åpne Oslo Børs</div>
                <div style="font-size: 0.9rem; color: #555;">09:00 Mandag</div>
            </div>
        </div>
        <div class="widget-card">
            <h3 style="margin:0; font-size: 1.2rem; font-weight: 800; margin-bottom: 15px;">Portefølje</h3>
            <div style="font-size: 0.95rem; color: #888; display: flex; justify-content: space-between; margin-bottom:12px;"><span>Eksponering</span><strong style="color:#1a1a1a">75%</strong></div>
            <div style="background:#f0f0f0; height:10px; border-radius:5px;"><div style="width:75%; height:100%; background:#1a1a1a; border-radius:5px;"></div></div>
        </div>
        <div style="background: linear-gradient(135deg, #2563EB, #1E40AF); border-radius: 32px; padding: 30px; color: white; box-shadow: 0 10px 30px rgba(37,99,235,0.2);">
            <h3 style="margin:0; font-size: 1.3rem; font-weight: 800; margin-bottom: 10px;">AI Advisor</h3>
            <p style="font-size: 0.95rem; opacity: 0.9; margin-bottom: 25px;">Trenger du hjelp med strategien din?</p>
            <div style="background: #E2FF3B; color: #1a1a1a; padding: 15px; border-radius: 16px; text-align: center; font-weight: 800; font-size:1rem;">Kontakt Support</div>
        </div>
    """, unsafe_allow_html=True)

st.markdown("---")
st.caption("K-man Island © 2026 | Kick Arse Strategisk Intelligence.")
