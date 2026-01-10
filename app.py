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
if 'view' not in st.session_state:
    st.session_state.view = 'Dashboard'

# ============================================
# 2. KICK ARSE DESIGN (CSS)
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
    border-right: 1px solid #f0f0f0;
}

/* Clickable Card Hack */
div[data-testid="stVerticalBlock"] div[style*="flex-direction: column"] > div[data-testid="stVerticalBlock"] {
    gap: 0rem;
}

.content-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 24px;
    transition: all 0.3s ease;
    border: 1px solid transparent;
}
.content-card:hover { 
    transform: translateY(-8px); 
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    border: 1px solid #E2FF3B;
}

.card-image-placeholder {
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
.badge-ongoing { background-color: #E2FF3B; color: #1a1a1a; }
.badge-completed { background-color: #A3E7D8; color: #1a1a1a; }

.card-body { padding: 20px; }
.card-title { font-size: 1.25rem; font-weight: 800; margin-bottom: 4px; }

.progress-container { margin-top: 15px; }
.progress-bar-bg { background-color: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease-in-out; }

/* Analysis Page Styles */
.analysis-header {
    background: white;
    padding: 30px;
    border-radius: 24px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.news-card {
    background: white;
    padding: 15px;
    border-radius: 16px;
    margin-bottom: 10px;
    border: 1px solid #f0f0f0;
}

.insider-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f8f8f8;
}

/* Status Cards */
.status-card {
    border-radius: 24px;
    padding: 30px;
    color: #1a1a1a;
    position: relative;
    overflow: hidden;
    height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s;
}
.card-lime { background-color: #E2FF3B; }
.card-teal { background-color: #A3E7D8; }
.card-pink { background-color: #FFB5B5; }

.section-title { font-size: 1.75rem; font-weight: 800; margin: 30px 0 20px 0; }
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR & MOCK DATA FOR EXTENDED INFO
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
            df['SMA50'] = ta.sma(df['Close'], length=50)
            
            last = df.iloc[-1]
            prev = df.iloc[-2]
            close = float(last['Close'])
            rsi = float(last['RSI'])
            sma20 = float(last['SMA20'])
            sma50 = float(last['SMA50'])
            
            is_buy = (rsi < 55) and (close > sma20) and (prev['Close'] <= prev['SMA20'])
            is_sell = (rsi > 70) or (close < sma20 and prev['Close'] >= prev['SMA20'])
            
            prob_score = 50
            if 35 < rsi < 50: prob_score += 20
            if close > sma20: prob_score += 10
            if close > sma50: prob_score += 10
            prob_score = min(max(prob_score, 10), 95)
            
            results.append({
                "ticker": t,
                "pris": round(close, 2),
                "endring": round(((close - prev['Close']) / prev['Close']) * 100, 2),
                "rsi": round(rsi, 1),
                "signal": "BUY" if is_buy else "SELL" if is_sell else "HOLD",
                "prob_score": prob_score,
                "stop_loss": round(close * 0.965, 2),
                "target": round(close * 1.105, 2),
                "df": df
            })
        except: continue
    
    def hotness_key(x):
        rank = {"BUY": 0, "HOLD": 1, "SELL": 2}
        return (rank.get(x['signal'], 3), -x['prob_score'])
        
    return sorted(results, key=hotness_key)

# ============================================
# 4. SIDEBAR
# ============================================
with st.sidebar:
    st.markdown("<div style='padding: 20px 0;'><h1 style='font-size: 1.5rem; font-weight: 800;'>🏝️ K-man</h1></div>", unsafe_allow_html=True)
    if st.button("🏠  Oversikt", use_container_width=True):
        st.session_state.view = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
    if st.button("📊  Børsen", use_container_width=True):
        st.session_state.view = 'Scanner'
        st.rerun()
    st.markdown("---")
    st.caption(f"Sist oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

c_main, c_side = st.columns([3, 1])

with c_main:
    if st.session_state.view == 'Dashboard' and not st.session_state.selected_ticker:
        st.markdown("<div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;'><h1 style='font-size: 2.5rem; font-weight: 800;'>Oversikt</h1><div style='background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700;'>+ Ny Analyse</div></div>", unsafe_allow_html=True)
        
        # Stats
        c1, c2, c3 = st.columns(3)
        buys = len([d for d in data if d['signal'] == 'BUY'])
        holds = len([d for d in data if d['signal'] == 'HOLD'])
        sells = len([d for d in data if d['signal'] == 'SELL'])

        with c1: st.markdown(f'<div class="status-card card-lime"><div class="status-number">{buys}</div><div class="status-label">Hot Kjøp Nå</div></div>', unsafe_allow_html=True)
        with c2: st.markdown(f'<div class="status-card card-teal"><div class="status-number">{holds}</div><div class="status-label">Stabile Hold</div></div>', unsafe_allow_html=True)
        with c3: st.markdown(f'<div class="status-card card-pink"><div class="status-number">{sells}</div><div class="status-label">Salg / Advarsler</div></div>', unsafe_allow_html=True)

        st.markdown("<h2 class='section-title'>Dagens Hotte Muligheter</h2>", unsafe_allow_html=True)
        
        display_picks = data[:4]
        cols = st.columns(2)
        for i, stock in enumerate(display_picks):
            with cols[i % 2]:
                badge_class = "badge-ongoing" if stock['signal'] == "BUY" else "badge-completed"
                prog_color = "#E2FF3B" if stock['prob_score'] > 70 else "#A3E7D8" if stock['prob_score'] > 50 else "#FFB5B5"
                
                # Card UI
                st.markdown(f"""
                <div class="content-card">
                    <div class="card-image-placeholder">
                        <span class="card-badge {badge_class}">{stock['signal']}</span>
                        <div style="position: absolute; bottom: 15px; left: 15px; color: white;">
                            <h3 style="margin:0; font-size: 1.5rem; font-weight: 800;">{stock['ticker']}</h3>
                            <span style="font-size: 0.8rem;">Oslo Børs · #{i+1} Hotlist</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: end; margin-bottom: 15px;">
                            <div><div style="font-size: 0.75rem; color: #888; text-transform: uppercase;">Pris</div><div style="font-size: 1.25rem; font-weight: 800;">{stock['pris']} NOK</div></div>
                            <div style="text-align: right;"><div style="font-size: 0.75rem; color: #888; text-transform: uppercase;">Sannsynlighet</div><div style="font-size: 1.25rem; font-weight: 800; color: #34c759;">{stock['prob_score']}%</div></div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                # Click logic via transparent button on top or just below
                if st.button(f"Klikk for Analyse av {stock['ticker']}", key=f"card_{stock['ticker']}", use_container_width=True):
                    st.session_state.selected_ticker = stock['ticker']
                    st.rerun()

    elif st.session_state.view == 'Scanner':
        st.markdown("<h1 class='section-title'>📊 Full Børsoversikt</h1>", unsafe_allow_html=True)
        for stock in data:
            if st.button(f"{stock['ticker']} | {stock['signal']} | {stock['pris']} NOK | Prob: {stock['prob_score']}%", key=f"list_{stock['ticker']}", use_container_width=True):
                st.session_state.selected_ticker = stock['ticker']
                st.session_state.view = 'Dashboard'
                st.rerun()

    # DETALJERT ANALYSE VIEW
    if st.session_state.selected_ticker:
        stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
        ticker_obj = yf.Ticker(stock['ticker'])
        
        # Header Area
        st.markdown(f"""
            <div class="analysis-header">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h1 style="margin:0; font-size: 3rem; font-weight: 800;">{stock['ticker']}</h1>
                        <p style="color:#888; font-size: 1.2rem;">{stock['pris']} NOK · <span style="color:{'#34c759' if stock['endring'] >= 0 else '#ff3b30'}">{'▲' if stock['endring'] >= 0 else '▼'} {abs(stock['endring'])}%</span></p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.8rem; color: #888; text-transform: uppercase;">K-Score Sannsynlighet</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: #E2FF3B;">{stock['prob_score']}%</div>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        col_left, col_right = st.columns([2, 1])
        
        with col_left:
            # Chart
            st.markdown("### Teknisk Formasjon")
            df_plot = stock['df'].tail(90)
            fig = go.Figure()
            fig.add_trace(go.Candlestick(x=df_plot.index, open=df_plot['Open'], high=df_plot['High'], low=df_plot['Low'], close=df_plot['Close'], name="Pris"))
            fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
            fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
            fig.update_layout(height=500, xaxis_rangeslider_visible=False, template="plotly_white", margin=dict(l=0, r=0, t=0, b=0))
            st.plotly_chart(fig, use_container_width=True)
            
            # Nyheter
            st.markdown("### Siste Nyheter")
            try:
                news = ticker_obj.news[:3]
                for n in news:
                    st.markdown(f"""<div class="news-card"><strong>{n['title']}</strong><br><small>{n['publisher']} · {datetime.fromtimestamp(n['providerPublishTime']).strftime('%d.%m %H:%M')}</small></div>""", unsafe_allow_html=True)
            except: st.info("Ingen ferske nyheter funnet.")

        with col_right:
            # Innsidehandel
            st.markdown("### Innsidehandel")
            insiders = get_mock_insiders(stock['ticker'])
            for i in insiders:
                st.markdown(f"""<div class="insider-row"><span><strong>{i['navn']}</strong><br><small>{i['type']} · {i['dato']}</small></span><span style="color:#34c759; font-weight:800;">{i['endring']}</span></div>""", unsafe_allow_html=True)
            
            # Analytikere
            st.markdown("### Analytiker-konsensus")
            st.markdown("""
                <div style="background:#f0f0f0; padding:20px; border-radius:16px; text-align:center;">
                    <div style="font-size:0.8rem; color:#888;">ANBEFALING</div>
                    <div style="font-size:1.5rem; font-weight:800; color:#1a1a1a;">OVERWEIGHT</div>
                    <div style="font-size:0.8rem; color:#888; margin-top:10px;">Gjennomsnittlig kursmål: <strong>+12%</strong></div>
                </div>
            """, unsafe_allow_html=True)
            
            # Bjellesauer
            st.markdown("### Bjellesauer & Storeiere")
            bjellesauer = get_mock_bjellesauer(stock['ticker'])
            for s in bjellesauer:
                st.markdown(f"• {s}")

with c_side:
    st.markdown("<br><br><br>", unsafe_allow_html=True)
    st.markdown("""
        <div class="widget-card">
            <h3 style="margin:0; font-size: 1rem; font-weight: 800; margin-bottom: 15px;">Min Strategi</h3>
            <div style="padding: 15px; background: #E2FF3B; border-radius: 12px; font-weight: 800; text-align: center;">Høy Risiko / Høy Gevinst</div>
        </div>
        <div class="widget-card">
            <h3 style="margin:0; font-size: 1rem; font-weight: 800; margin-bottom: 10px;">Bjellesau-alarm</h3>
            <p style="font-size:0.8rem; color:#888;">Spetalen økte i 2 aksjer i dag.</p>
        </div>
    """, unsafe_allow_html=True)

st.markdown("---")
st.caption("K-man Island © 2026 | Kick Arse Intelligence.")
