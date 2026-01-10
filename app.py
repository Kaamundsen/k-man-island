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
# 2. KICK ARSE DESIGN (CSS) - Inspired by image
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
}

/* Status Cards - Vibrant Colors from image */
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
.status-card:hover { transform: translateY(-5px); }
.card-lime { background-color: #E2FF3B; } /* Aktive Oppdrag style */
.card-teal { background-color: #A3E7D8; } /* Fullførte style */
.card-pink { background-color: #FFB5B5; } /* Kladd style */

.status-number { font-size: 3rem; font-weight: 800; line-height: 1; }
.status-label { font-size: 1rem; font-weight: 600; color: #444; }
.status-icon { position: absolute; top: 20px; right: 20px; font-size: 1.5rem; opacity: 0.6; }

/* Content Cards - "Siste Befaringer" style */
.content-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 24px;
    transition: all 0.3s ease;
}
.content-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }

.card-image-placeholder {
    height: 180px;
    background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
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
.card-meta { font-size: 0.85rem; color: #888; margin-bottom: 15px; display: flex; align-items: center; gap: 5px; }

.progress-container { margin-top: 15px; }
.progress-bar-bg { background-color: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease-in-out; }

/* Utility Styles */
.section-title { font-size: 1.75rem; font-weight: 800; margin: 30px 0 20px 0; }
.btn-cta { 
    background-color: #1a1a1a; color: white; border-radius: 12px; 
    padding: 12px 24px; font-weight: 700; border: none; cursor: pointer;
}

/* Right Sidebar Style Widgets */
.widget-card {
    background: white; border-radius: 20px; padding: 20px; margin-bottom: 20px;
    border: 1px solid #f0f0f0;
}
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR & PROBABILITY SCORE
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
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.droplevel(1)
            
            if df.empty or len(df) < 60: continue
            
            # Indikatorer
            df['RSI'] = ta.rsi(df['Close'], length=14)
            df['SMA20'] = ta.sma(df['Close'], length=20)
            df['SMA50'] = ta.sma(df['Close'], length=50)
            
            last = df.iloc[-1]
            prev = df.iloc[-2]
            
            close = float(last['Close'])
            rsi = float(last['RSI'])
            sma20 = float(last['SMA20'])
            sma50 = float(last['SMA50'])
            
            # Logikk for signaler
            is_buy = (rsi < 55) and (close > sma20) and (prev['Close'] <= prev['SMA20'])
            is_sell = (rsi > 70) or (close < sma20 and prev['Close'] >= prev['SMA20'])
            
            # Sannsynlighetsberegning for kortsiktig gevinst (0-100)
            # Enkel modell basert på RSI sweetspot, trendstyrke og SMA-posisjon
            prob_score = 50 # Base
            if 35 < rsi < 50: prob_score += 20
            if close > sma20: prob_score += 10
            if close > sma50: prob_score += 10
            if last['Volume'] > df['Volume'].tail(20).mean(): prob_score += 10
            prob_score = min(max(prob_score, 10), 95)
            
            # Beregninger
            stop_loss = close * 0.965
            target_price = close * 1.105
            
            results.append({
                "ticker": t,
                "pris": round(close, 2),
                "endring": round(((close - prev['Close']) / prev['Close']) * 100, 2),
                "rsi": round(rsi, 1),
                "signal": "BUY" if is_buy else "SELL" if is_sell else "HOLD",
                "prob_score": prob_score,
                "stop_loss": round(stop_loss, 2),
                "target": round(target_price, 2),
                "potential_pct": 10.5,
                "risk_pct": 3.5,
                "df": df
            })
        except: continue
    
    # Sorter etter "Hotness": BUY -> HOLD -> SELL, og deretter prob_score
    def hotness_key(x):
        rank = {"BUY": 0, "HOLD": 1, "SELL": 2}
        return (rank.get(x['signal'], 3), -x['prob_score'])
        
    return sorted(results, key=hotness_key)

# ============================================
# 4. SIDEBAR (NAVIGASJON)
# ============================================
with st.sidebar:
    st.markdown("""
        <div style='padding: 20px 0;'>
            <h1 style='font-size: 1.5rem; font-weight: 800;'>🏝️ K-man</h1>
        </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### Menyen")
    if st.button("🏠  Oversikt", use_container_width=True):
        st.session_state.view = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
    if st.button("📊  Børsen", use_container_width=True):
        st.session_state.view = 'Scanner'
        st.rerun()
    if st.button("👤  Profil", use_container_width=True): pass
    if st.button("⚙️  Innstillinger", use_container_width=True): pass

    st.markdown("---")
    st.caption(f"Sist oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

# Topp Layout med "kick arse" feel
c_main, c_side = st.columns([3, 1])

with c_main:
    if st.session_state.view == 'Dashboard':
        # 5a. Top Header
        st.markdown("""
            <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;'>
                <h1 style='font-size: 2.5rem; font-weight: 800;'>Oversikt</h1>
                <div style='background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700;'>
                    + Ny Analyse
                </div>
            </div>
        """, unsafe_allow_html=True)

        # 5b. Status Cards Row
        c1, c2, c3 = st.columns(3)
        buys = len([d for d in data if d['signal'] == 'BUY'])
        holds = len([d for d in data if d['signal'] == 'HOLD'])
        sells = len([d for d in data if d['signal'] == 'SELL'])

        with c1:
            st.markdown(f"""
                <div class="status-card card-lime">
                    <span class="status-icon">🕒</span>
                    <div class="status-number">{buys}</div>
                    <div class="status-label">Hot Kjøp Nå</div>
                </div>
            """, unsafe_allow_html=True)
        with c2:
            st.markdown(f"""
                <div class="status-card card-teal">
                    <span class="status-icon">✔️</span>
                    <div class="status-number">{holds}</div>
                    <div class="status-label">Stabile Hold</div>
                </div>
            """, unsafe_allow_html=True)
        with c3:
            st.markdown(f"""
                <div class="status-card card-pink">
                    <span class="status-icon">📝</span>
                    <div class="status-number">{sells}</div>
                    <div class="status-label">Salg / Advarsler</div>
                </div>
            """, unsafe_allow_html=True)

        # 5c. Top Picks (Siste Befaringer style)
        st.markdown("<h2 class='section-title'>Dagens Hotte Muligheter</h2>", unsafe_allow_html=True)
        
        # Vis topp 4 hotte aksjer
        display_picks = data[:4]
        cols = st.columns(2)
        for i, stock in enumerate(display_picks):
            with cols[i % 2]:
                badge_class = "badge-ongoing" if stock['signal'] == "BUY" else "badge-completed"
                # Bruker en farget gradient basert på prob_score for progress baren
                prog_color = "#E2FF3B" if stock['prob_score'] > 70 else "#A3E7D8" if stock['prob_score'] > 50 else "#FFB5B5"
                
                st.markdown(f"""
                <div class="content-card">
                    <div class="card-image-placeholder">
                        <span class="card-badge {badge_class}">{stock['signal']}</span>
                        <div style="position: absolute; bottom: 15px; left: 15px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                            <h3 style="margin:0; font-size: 1.5rem; font-weight: 800;">{stock['ticker']}</h3>
                            <span style="font-size: 0.8rem;">Oslo Børs · #{i+1} Hotlist</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: end; margin-bottom: 15px;">
                            <div>
                                <div style="font-size: 0.75rem; color: #888; text-transform: uppercase;">Pris</div>
                                <div style="font-size: 1.25rem; font-weight: 800;">{stock['pris']} NOK</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.75rem; color: #888; text-transform: uppercase;">Potensial</div>
                                <div style="font-size: 1.25rem; font-weight: 800; color: #34c759;">+{stock['potential_pct']}%</div>
                            </div>
                        </div>
                        <div class="progress-container">
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 5px;">
                                <span>Sannsynlighet for gevinst</span>
                                <span>{stock['prob_score']}%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: {stock['prob_score']}%; background-color: {prog_color};"></div>
                            </div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                if st.button(f"Sjekk {stock['ticker']}", key=f"dash_{stock['ticker']}", use_container_width=True):
                    st.session_state.selected_ticker = stock['ticker']
                    st.rerun()

    elif st.session_state.view == 'Scanner':
        st.markdown("<h1 class='section-title'>📊 Full Børsoversikt</h1>", unsafe_allow_html=True)
        # Sexy Ranked List
        st.markdown("""
            <div style='background: white; padding: 20px; border-radius: 20px; border: 1px solid #f0f0f0;'>
                <table style='width: 100%; border-collapse: collapse;'>
                    <tr style='border-bottom: 2px solid #f8f8f8; color: #888; font-size: 0.8rem; text-transform: uppercase;'>
                        <th style='text-align: left; padding: 15px;'>Ticker</th>
                        <th style='text-align: left; padding: 15px;'>Signal</th>
                        <th style='text-align: right; padding: 15px;'>Pris</th>
                        <th style='text-align: right; padding: 15px;'>RSI</th>
                        <th style='text-align: right; padding: 15px;'>Probability</th>
                        <th style='text-align: center; padding: 15px;'>Handling</th>
                    </tr>
        """, unsafe_allow_html=True)
        
        for stock in data:
            color = "#34c759" if stock['signal'] == "BUY" else "#ff3b30" if stock['signal'] == "SELL" else "#888"
            st.markdown(f"""
                    <tr style='border-bottom: 1px solid #f8f8f8;'>
                        <td style='padding: 15px; font-weight: 800;'>{stock['ticker']}</td>
                        <td style='padding: 15px;'><span style='color: {color}; font-weight: 700;'>{stock['signal']}</span></td>
                        <td style='padding: 15px; text-align: right;'>{stock['pris']}</td>
                        <td style='padding: 15px; text-align: right;'>{stock['rsi']}</td>
                        <td style='padding: 15px; text-align: right; font-weight: 800;'>{stock['prob_score']}%</td>
                        <td style='padding: 15px; text-align: center;'>
                            <a href='#' style='color: #2563EB; text-decoration: none; font-weight: 700;'>Detaljer</a>
                        </td>
                    </tr>
            """, unsafe_allow_html=True)
        st.markdown("</table></div>", unsafe_allow_html=True)

    # 5d. Deep Dive Analyse (vises når valgt)
    if st.session_state.selected_ticker:
        st.markdown("---")
        stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
        
        st.markdown(f"<h2 class='section-title'>📈 Deep Dive: {stock['ticker']}</h2>", unsafe_allow_html=True)
        
        df_plot = stock['df'].tail(60)
        fig = go.Figure()
        fig.add_trace(go.Candlestick(x=df_plot.index, open=df_plot['Open'], high=df_plot['High'], low=df_plot['Low'], close=df_plot['Close'], name="Pris"))
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
        fig.update_layout(height=500, xaxis_rangeslider_visible=False, template="plotly_white", margin=dict(l=0, r=0, t=30, b=0))
        st.plotly_chart(fig, use_container_width=True)

with c_side:
    # Right Sidebar Widgets from image
    st.markdown("<br><br><br>", unsafe_allow_html=True)
    
    st.markdown("""
        <div class="widget-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin:0; font-size: 1rem; font-weight: 800;">Min Agenda</h3>
                <span style="font-size: 0.7rem; color: #888;">☀️ 14°C Oslo</span>
            </div>
            <div style="padding: 15px; background: #F8F7F4; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #1a1a1a;">
                <div style="font-size: 0.7rem; color: #888;">NESTE HANDLEPLAN</div>
                <div style="font-weight: 800;">Åpne Oslo Børs</div>
                <div style="font-size: 0.8rem; color: #555;">09:00 Mandag</div>
            </div>
        </div>
        
        <div class="widget-card">
            <h3 style="margin:0; font-size: 1rem; font-weight: 800; margin-bottom: 15px;">Porteføljekapasitet</h3>
            <div style="font-size: 0.8rem; color: #888; display: flex; justify-content: space-between;">
                <span>75% Brukt</span>
                <span>100% Totalt</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: 75%; background-color: #1a1a1a;"></div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: #2563EB;">Oppgrader Strategi</span>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #2563EB, #1E40AF); border-radius: 24px; padding: 25px; color: white;">
            <h3 style="margin:0; font-size: 1.1rem; font-weight: 800; margin-bottom: 10px;">Trenger du hjelp?</h3>
            <p style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 20px;">Få support med AI-generering eller analyser.</p>
            <div style="background: #E2FF3B; color: #1a1a1a; padding: 12px; border-radius: 12px; text-align: center; font-weight: 800;">
                Kontakt Support
            </div>
        </div>
    """, unsafe_allow_html=True)

st.markdown("---")
st.caption("K-man Island © 2026 | Kick Arse Design for Oslo Børs.")
