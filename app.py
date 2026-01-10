import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

# 1. Konfigurasjon
st.set_page_config(
    page_title="K-man Island", 
    page_icon="🏝️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state for navigation
if 'page' not in st.session_state:
    st.session_state.page = 'Oversikt'
if 'selected_nav' not in st.session_state:
    st.session_state.selected_nav = 'home'

# 2. Lys, moderne stil
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.stApp {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Modern glassmorphism header */
.top-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    padding: 1rem 2rem;
    margin: -1rem -1rem 2rem -1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 100;
}

/* Search input styling */
.stTextInput > div > div > input {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
}

.stTextInput > div > div > input:focus {
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

[data-testid="stAppViewContainer"] {
    margin-left: 80px;
}

[data-testid="stHeader"] {
    margin-left: 80px;
}

/* Hide default elements */
#MainMenu, footer, header {visibility: hidden;}

/* Typography */
h1, h2, h3, p, span, div, label {
    font-family: 'DM Sans', sans-serif !important;
}

/* Main title styling */
.main-title {
    font-size: 2.8rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #64748b;
    font-size: 1.1rem;
    margin-bottom: 2rem;
}

/* Cards */
.stat-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(226, 232, 240, 0.8);
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #0ea5e9, #22c55e, #8b5cf6, #ef4444);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.stat-card:hover::before {
    opacity: 1;
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
}

.stat-label {
    color: #64748b;
    font-size: 0.85rem;
    margin-top: 0.25rem;
}

/* Signal badges */
.signal-buy {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    color: #166534;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85rem;
    display: inline-block;
}

.signal-sell {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85rem;
    display: inline-block;
}

.signal-hold {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85rem;
    display: inline-block;
}

/* Trend badges */
.trend-up {
    color: #16a34a;
    font-weight: 600;
}

.trend-down {
    color: #dc2626;
    font-weight: 600;
}

/* Table styling */
.dataframe {
    border: none !important;
}

.dataframe th {
    background: #f1f5f9 !important;
    color: #475569 !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    font-size: 0.75rem !important;
    letter-spacing: 0.5px;
}

.dataframe td {
    background: white !important;
    border-bottom: 1px solid #e2e8f0 !important;
}

/* Right Sidebar */
section[data-testid="stSidebar"] {
    background: white;
    border-right: 1px solid #e2e8f0;
}

/* Left Navigation Sidebar */
.left-sidebar {
    background: #1e293b;
    color: white;
    padding: 2rem 1rem;
    min-height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    width: 80px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.nav-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #94a3b8;
    font-size: 1.5rem;
    position: relative;
}

.nav-icon:hover {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    color: white;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.nav-icon.active {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
}

.nav-icon.active::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    background: white;
    border-radius: 0 2px 2px 0;
}

@media (max-width: 768px) {
    .left-sidebar {
        width: 60px;
    }
    [data-testid="stAppViewContainer"] {
        margin-left: 60px;
    }
    [data-testid="stHeader"] {
        margin-left: 60px;
    }
}

.toggle-switch {
    margin-top: auto;
    padding: 0.5rem;
    background: #fbbf24;
    border-radius: 20px;
    color: #000;
    font-weight: 600;
    font-size: 0.75rem;
    text-align: center;
    cursor: pointer;
}

/* Tab styling */
.stTabs [data-baseweb="tab-list"] {
    gap: 8px;
    background: white;
    padding: 0.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.stTabs [data-baseweb="tab"] {
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
}

.stTabs [aria-selected="true"] {
    background: #0ea5e9 !important;
    color: white !important;
}

/* Info card in sidebar */
.info-card {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
}

/* Live indicator */
.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #dcfce7;
    color: #166534;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}

.live-dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
}

/* Quick stats cards */
.quick-stat {
    background: white;
    border-radius: 16px;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    cursor: pointer;
}

.quick-stat:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #0ea5e9;
}

.quick-stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
}

.quick-stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0.5rem 0;
}

.quick-stat-label {
    font-size: 0.85rem;
    color: #64748b;
}
</style>
""", unsafe_allow_html=True)

# 3. Skanner-motor med BREDERE signal-logikk
def get_analysis(ticker):
    try:
        df = yf.download(ticker, period="1y", interval="1d", progress=False, auto_adjust=True)
        
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        if df.empty or len(df) < 50: 
            # Prøv alternativ metode
            ticker_obj = yf.Ticker(ticker)
            df = ticker_obj.history(period="1y")
            if df.empty or len(df) < 50:
                return None
        
        # Håndter kolonner
        if 'Close' not in df.columns:
            if 'Adj Close' in df.columns:
                df = df.rename(columns={'Adj Close': 'Close'})
            else:
                return None
        
        # Indikatorer
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        df['EMA12'] = ta.ema(df['Close'], length=12)
        df['EMA26'] = ta.ema(df['Close'], length=26)
        df['ATR'] = ta.atr(df['High'], df['Low'], df['Close'], length=14)
        
        if pd.isna(df['RSI'].iloc[-1]) or pd.isna(df['SMA20'].iloc[-1]) or pd.isna(df['SMA50'].iloc[-1]):
            return None
        
        last_close = float(df['Close'].iloc[-1])
        last_rsi = float(df['RSI'].iloc[-1])
        last_sma20 = float(df['SMA20'].iloc[-1])
        last_sma50 = float(df['SMA50'].iloc[-1])
        last_ema12 = float(df['EMA12'].iloc[-1])
        last_ema26 = float(df['EMA26'].iloc[-1])
        last_atr = float(df['ATR'].iloc[-1]) if not pd.isna(df['ATR'].iloc[-1]) else last_close * 0.02
        
        # Beregn endring
        prev_close = float(df['Close'].iloc[-2]) if len(df) >= 2 else last_close
        change_pct = ((last_close - prev_close) / prev_close) * 100
        
        # Beregn motstandsnivåer (target) - finn lokale maksima
        recent_highs = df['High'].tail(60).values
        resistance_levels = []
        for i in range(1, len(recent_highs) - 1):
            if recent_highs[i] > recent_highs[i-1] and recent_highs[i] > recent_highs[i+1]:
                resistance_levels.append(recent_highs[i])
        
        # Teknisk target: neste motstandsnivå over nåværende pris, eller 10% opp hvis ingen
        if resistance_levels:
            next_resistance = min([r for r in resistance_levels if r > last_close], default=last_close * 1.10)
        else:
            next_resistance = last_close * 1.10
        
        # Stop Loss: 2x ATR under nåværende pris
        stop_loss = last_close - (2 * last_atr)
        
        # Risiko/Belønning ratio
        risk = last_close - stop_loss
        reward = next_resistance - last_close
        rr_ratio = reward / risk if risk > 0 else 0
        
        # Strammere BUY/SELL-logikk (unngå 30+ BUY):
        buy_signal = False
        sell_signal = False

        five_day_return = (last_close / float(df['Close'].iloc[-5])) - 1 if len(df) >= 5 else 0

        # BUY krever alle: RSI < 55, pris > SMA20 og SMA50, EMA12 > EMA26, og positiv 5-dagers
        if (
            last_rsi < 55
            and last_close > last_sma20
            and last_close > last_sma50
            and last_ema12 > last_ema26
            and five_day_return > 0
        ):
            buy_signal = True

        # SELL: kraftig overkjøpt eller under begge glidende
        if last_rsi > 75 or (last_close < last_sma20 and last_close < last_sma50):
            sell_signal = True

        # K-Score beregning (BUY belønnes, høy RSI straffes)
        if len(df) >= 60:
            old_price = float(df['Close'].iloc[-60])
            returns_3m = (last_close / old_price) - 1
        else:
            old_price = float(df['Close'].iloc[0])
            returns_3m = (last_close / old_price) - 1

        score = (returns_3m * 40)  # Momentum
        if 30 < last_rsi < 55:
            score += 25  # RSI sweet spot, strammere tak enn før
        if last_close > last_sma50:
            score += 15
        if last_ema12 > last_ema26:
            score += 10
        if buy_signal:
            score += 25  # Bonus for kjøpssignal
        if last_rsi > 65:
            score -= 200  # Høyrisiko skal ikke toppe listen
        
        # Generer forklarende tekst basert på signal
        explanation = ""
        if buy_signal:
            reasons = []
            if last_rsi < 55:
                reasons.append("RSI er i kjøpssone")
            if last_close > last_sma20 and last_close > last_sma50:
                reasons.append("pris er over både SMA20 og SMA50")
            if last_ema12 > last_ema26:
                reasons.append("EMA12 over EMA26 viser bullish momentum")
            if five_day_return > 0:
                reasons.append("positiv 5-dagers avkastning")
            
            explanation = f"Trendstyrken er økende og støttes av: {', '.join(reasons)}. Tekniske indikatorer peker mot fortsatt oppside."
        elif sell_signal:
            explanation = "Tekniske indikatorer viser svakhet: RSI er overkjøpt eller pris har falt under viktige støttenivåer. Vurder gevinstsikring."
        else:
            explanation = "Aksjen konsoliderer eller mangler klar retning. Avvent bekreftet breakout eller nedbrytning før handel."
        
        return {
            "df": df,
            "ticker": ticker,
            "pris": last_close,
            "change": change_pct,
            "rsi": last_rsi,
            "score": round(score, 1),
            "trend": "UP" if last_close > last_sma50 else "DOWN",
            "signal": "BUY" if buy_signal else "SELL" if sell_signal else "HOLD",
            "atr": last_atr,
            "stop_loss": round(stop_loss, 2),
            "target": round(next_resistance, 2),
            "rr_ratio": round(rr_ratio, 2),
            "explanation": explanation
        }
    except Exception as e:
        # Prøv alternativ metode
        try:
            ticker_obj = yf.Ticker(ticker)
            hist = ticker_obj.history(period="1y")
            if not hist.empty and len(hist) >= 50:
                hist['RSI'] = ta.rsi(hist['Close'], length=14)
                hist['SMA20'] = ta.sma(hist['Close'], length=20)
                hist['SMA50'] = ta.sma(hist['Close'], length=50)
                hist['EMA12'] = ta.ema(hist['Close'], length=12)
                hist['EMA26'] = ta.ema(hist['Close'], length=26)
                hist['ATR'] = ta.atr(hist['High'], hist['Low'], hist['Close'], length=14)
                
                last_close = float(hist['Close'].iloc[-1])
                last_rsi = float(hist['RSI'].iloc[-1])
                last_sma20 = float(hist['SMA20'].iloc[-1])
                last_sma50 = float(hist['SMA50'].iloc[-1])
                last_ema12 = float(hist['EMA12'].iloc[-1])
                last_ema26 = float(hist['EMA26'].iloc[-1])
                last_atr = float(hist['ATR'].iloc[-1]) if not pd.isna(hist['ATR'].iloc[-1]) else last_close * 0.02
                
                prev_close = float(hist['Close'].iloc[-2]) if len(hist) >= 2 else last_close
                change_pct = ((last_close - prev_close) / prev_close) * 100
                
                recent_highs = hist['High'].tail(60).values
                resistance_levels = []
                for i in range(1, len(recent_highs) - 1):
                    if recent_highs[i] > recent_highs[i-1] and recent_highs[i] > recent_highs[i+1]:
                        resistance_levels.append(recent_highs[i])
                
                if resistance_levels:
                    next_resistance = min([r for r in resistance_levels if r > last_close], default=last_close * 1.10)
                else:
                    next_resistance = last_close * 1.10
                
                stop_loss = last_close - (2 * last_atr)
                risk = last_close - stop_loss
                reward = next_resistance - last_close
                rr_ratio = reward / risk if risk > 0 else 0
                
                buy_signal = False
                sell_signal = False
                five_day_return = (last_close / float(hist['Close'].iloc[-5])) - 1 if len(hist) >= 5 else 0
                
                if (last_rsi < 55 and last_close > last_sma20 and last_close > last_sma50 and last_ema12 > last_ema26 and five_day_return > 0):
                    buy_signal = True
                
                if last_rsi > 75 or (last_close < last_sma20 and last_close < last_sma50):
                    sell_signal = True
                
                if len(hist) >= 60:
                    old_price = float(hist['Close'].iloc[-60])
                    returns_3m = (last_close / old_price) - 1
                else:
                    old_price = float(hist['Close'].iloc[0])
                    returns_3m = (last_close / old_price) - 1
                
                score = (returns_3m * 40)
                if 30 < last_rsi < 55:
                    score += 25
                if last_close > last_sma50:
                    score += 15
                if last_ema12 > last_ema26:
                    score += 10
                if buy_signal:
                    score += 25
                if last_rsi > 65:
                    score -= 200
                
                explanation = ""
                if buy_signal:
                    reasons = []
                    if last_rsi < 55:
                        reasons.append("RSI er i kjøpssone")
                    if last_close > last_sma20 and last_close > last_sma50:
                        reasons.append("pris er over både SMA20 og SMA50")
                    if last_ema12 > last_ema26:
                        reasons.append("EMA12 over EMA26 viser bullish momentum")
                    if five_day_return > 0:
                        reasons.append("positiv 5-dagers avkastning")
                    explanation = f"Trendstyrken er økende og støttes av: {', '.join(reasons)}. Tekniske indikatorer peker mot fortsatt oppside."
                elif sell_signal:
                    explanation = "Tekniske indikatorer viser svakhet: RSI er overkjøpt eller pris har falt under viktige støttenivåer. Vurder gevinstsikring."
                else:
                    explanation = "Aksjen konsoliderer eller mangler klar retning. Avvent bekreftet breakout eller nedbrytning før handel."
                
                return {
                    "df": hist,
                    "ticker": ticker,
                    "pris": last_close,
                    "change": change_pct,
                    "rsi": last_rsi,
                    "score": round(score, 1),
                    "trend": "UP" if last_close > last_sma50 else "DOWN",
                    "signal": "BUY" if buy_signal else "SELL" if sell_signal else "HOLD",
                    "atr": last_atr,
                    "stop_loss": round(stop_loss, 2),
                    "target": round(next_resistance, 2),
                    "rr_ratio": round(rr_ratio, 2),
                    "explanation": explanation
                }
        except:
            pass
        return None

# 4. Watchlist
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "BGBIO.OL", "TEL.OL", "ORK.OL", "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", 
    "EQNR.OL", "YAR.OL", "NHY.OL", "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", 
    "PGS.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", "ACSB.OL", "LSG.OL", "SALM.OL", 
    "BAKK.OL", "TOM.OL", "GRIEG.OL", "SBANK.OL", "HREC.OL", "ELK.OL", "MPCC.OL",
    "KOG.OL", "BORR.OL", "RANA.OL", "SCATC.OL", "AZT.OL", "VOW.OL", "ACC.OL",
    "PRAWN.OL", "OKEA.OL", "HAFNI.OL", "BELCO.OL", "2020.OL", "KOA.OL", "BWE.OL"
]

# 5. Left Navigation Sidebar med klikkbar funksjonalitet
nav_items = [
    {'icon': '🏝️', 'id': 'home', 'label': 'Oversikt'},
    {'icon': '📊', 'id': 'dashboard', 'label': 'Dashboard'},
    {'icon': '📈', 'id': 'analytics', 'label': 'Analytics'},
    {'icon': '📋', 'id': 'watchlist', 'label': 'Watchlist'},
    {'icon': '👥', 'id': 'portfolio', 'label': 'Portfolio'},
    {'icon': '⚙️', 'id': 'settings', 'label': 'Innstillinger'}
]

# Bygg navigasjons-HTML på en trygg måte
nav_html_parts = ['<div class="left-sidebar">']
for item in nav_items:
    active_class = 'active' if st.session_state.selected_nav == item['id'] else ''
    nav_html_parts.append(f'<a href="?nav={item["id"]}" style="text-decoration:none;color:inherit;">')
    nav_html_parts.append(f'<div class="nav-icon {active_class}" title="{item["label"]}" style="font-size:1.5rem;cursor:pointer;">{item["icon"]}</div>')
    nav_html_parts.append('</a>')
nav_html_parts.append('<div class="toggle-switch">ON</div></div>')
st.markdown(''.join(nav_html_parts), unsafe_allow_html=True)

# Håndter navigasjon - bruk try/except for kompatibilitet
try:
    if hasattr(st, 'query_params'):
        nav_param = st.query_params.get('nav', None)
        if nav_param:
            if isinstance(nav_param, list) and len(nav_param) > 0:
                st.session_state.selected_nav = nav_param[0]
            elif isinstance(nav_param, str):
                st.session_state.selected_nav = nav_param
except Exception as e:
    # Fallback hvis query_params ikke er tilgjengelig
    pass

# Top Header Bar - Ren og kompakt design
header_col1, header_col2, header_col3, header_col4, header_col5 = st.columns([3, 0.8, 0.8, 1.2, 1])
with header_col1:
    search_query = st.text_input("", placeholder="🔍 Søk globalt...", label_visibility="collapsed", key="global_search")

with header_col2:
    st.markdown(f'<div style="text-align:center;padding-top:0.5rem;position:relative;"><span style="font-size:1.5rem;">💬</span><span style="position:absolute;top:2px;right:2px;background:#ef4444;color:white;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600;">3</span></div>', unsafe_allow_html=True)

with header_col3:
    st.markdown(f'<div style="text-align:center;padding-top:0.5rem;position:relative;"><span style="font-size:1.5rem;">🔔</span><span style="position:absolute;top:2px;right:2px;background:#f59e0b;color:white;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600;">5</span></div>', unsafe_allow_html=True)

with header_col4:
    st.markdown(f'<div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 1rem;"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1rem;">KN</div><div><div style="font-weight:600;font-size:0.9rem;color:#0f172a;">K-man Island</div><div style="font-size:0.75rem;color:#64748b;">Premium Investor</div></div></div>', unsafe_allow_html=True)

with header_col5:
    if st.button("🔄 Oppdater Data", use_container_width=True):
        st.rerun()

# Main Title
st.markdown("## Oversikt")
st.markdown("<br>", unsafe_allow_html=True)

# 6. Data Loading
results = []
with st.spinner('🔍 Skanner Oslo Børs...'):
    for t in watchlist:
        data = get_analysis(t)
        if data: 
            results.append(data)

# Quick Stats Overview - Klikkbare kort (oppdateres med faktiske data)
st.markdown("### 📊 Rask Oversikt")
quick_col1, quick_col2, quick_col3, quick_col4 = st.columns(4)

if results:
    df_res = pd.DataFrame([{k: v for k, v in r.items() if k != 'df'} for r in results])
    buy_count = len([r for r in results if r['signal'] == 'BUY'])
    sell_count = len([r for r in results if r['signal'] == 'SELL'])
    top_opportunities = len(df_res[df_res['score'] > 20])
else:
    buy_count = 0
    sell_count = 0
    top_opportunities = 0

active_signals = buy_count + sell_count if results else 0
watchlist_count = len(watchlist)

with quick_col1:
    st.markdown(f'<a href="?nav=dashboard" style="text-decoration:none;color:inherit;"><div class="quick-stat"><div class="quick-stat-icon" style="background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%);">📊</div><div class="quick-stat-value" style="color:#0ea5e9;">{active_signals}</div><div class="quick-stat-label">Aktive Signaler</div></div></a>', unsafe_allow_html=True)

with quick_col2:
    st.markdown(f'<a href="?nav=analytics" style="text-decoration:none;color:inherit;"><div class="quick-stat"><div class="quick-stat-icon" style="background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);">📈</div><div class="quick-stat-value" style="color:#22c55e;">{top_opportunities}</div><div class="quick-stat-label">Top Opportunities</div></div></a>', unsafe_allow_html=True)

with quick_col3:
    st.markdown(f'<a href="?nav=watchlist" style="text-decoration:none;color:inherit;"><div class="quick-stat"><div class="quick-stat-icon" style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);">📋</div><div class="quick-stat-value" style="color:#8b5cf6;">{watchlist_count}</div><div class="quick-stat-label">Watchlist Aksjer</div></div></a>', unsafe_allow_html=True)

with quick_col4:
    st.markdown('<a href="?nav=portfolio" style="text-decoration:none;color:inherit;"><div class="quick-stat"><div class="quick-stat-icon" style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);">💼</div><div class="quick-stat-value" style="color:#f59e0b;">-</div><div class="quick-stat-label">Portfolio Verdi</div></div></a>', unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

if results:
    df_res = pd.DataFrame([{k: v for k, v in r.items() if k != 'df'} for r in results])
    df_res = df_res.sort_values(by="score", ascending=False)
    
    # Stats
    buy_count = len([r for r in results if r['signal'] == 'BUY'])
    sell_count = len([r for r in results if r['signal'] == 'SELL'])
    up_count = len([r for r in results if r['trend'] == 'UP'])
    
    # Oppdater quick stats hvis de ikke allerede er satt
    if 'quick_stats_updated' not in st.session_state:
        st.session_state.quick_stats_updated = True
    
    # Metrics row
    c1, c2, c3, c4 = st.columns(4)
    
    with c1:
        st.markdown(f"""
        <div class="stat-card">
            <p class="stat-value" style="color: #0ea5e9;">{len(results)}</p>
            <p class="stat-label">Aksjer analysert</p>
        </div>
        """, unsafe_allow_html=True)
    
    with c2:
        st.markdown(f"""
        <div class="stat-card">
            <p class="stat-value" style="color: #22c55e;">{buy_count}</p>
            <p class="stat-label">Kjøpssignaler</p>
        </div>
        """, unsafe_allow_html=True)
    
    with c3:
        st.markdown(f"""
        <div class="stat-card">
            <p class="stat-value" style="color: #ef4444;">{sell_count}</p>
            <p class="stat-label">Salgssignaler</p>
        </div>
        """, unsafe_allow_html=True)
    
    with c4:
        st.markdown(f"""
        <div class="stat-card">
            <p class="stat-value" style="color: #8b5cf6;">{up_count}</p>
            <p class="stat-label">I opptrend</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # TABS
    tab1, tab2, tab3 = st.tabs(["🎯 Top 10", "📊 Alle signaler", "📈 Analyse"])
    
    with tab1:
        st.subheader("Top 10 Opportunities")
        
        # Formater dataframe for visning
        display_df = df_res.head(10).copy()
        display_df['Ticker'] = display_df['ticker'].str.replace('.OL', '')
        display_df['Pris'] = display_df['pris'].apply(lambda x: f"{x:.2f} kr")
        display_df['Endring'] = display_df['change'].apply(lambda x: f"+{x:.2f}%" if x >= 0 else f"{x:.2f}%")
        display_df['RSI'] = display_df['rsi'].apply(lambda x: f"{x:.1f}")
        display_df['K-Score'] = display_df['score']
        display_df['Trend'] = display_df['trend'].apply(lambda x: "📈 UP" if x == "UP" else "📉 DOWN")
        display_df['Signal'] = display_df['signal'].apply(lambda x: "🟢 KJØP" if x == "BUY" else "🔴 SELG" if x == "SELL" else "🟡 HOLD")
        
        st.dataframe(
            display_df[['Ticker', 'Pris', 'Endring', 'RSI', 'K-Score', 'Trend', 'Signal']],
            hide_index=True,
            use_container_width=True
        )
    
    with tab2:
        st.subheader("Alle signaler")
        
        # Filter options
        signal_filter = st.multiselect(
            "Filtrer på signal:",
            ["BUY", "SELL", "HOLD"],
            default=["BUY", "SELL", "HOLD"]
        )
        
        filtered_df = df_res[df_res['signal'].isin(signal_filter)].copy()
        filtered_df['Ticker'] = filtered_df['ticker'].str.replace('.OL', '')
        filtered_df['Pris'] = filtered_df['pris'].apply(lambda x: f"{x:.2f} kr")
        filtered_df['Endring'] = filtered_df['change'].apply(lambda x: f"+{x:.2f}%" if x >= 0 else f"{x:.2f}%")
        filtered_df['RSI'] = filtered_df['rsi'].apply(lambda x: f"{x:.1f}")
        filtered_df['K-Score'] = filtered_df['score']
        filtered_df['Trend'] = filtered_df['trend'].apply(lambda x: "📈 UP" if x == "UP" else "📉 DOWN")
        filtered_df['Signal'] = filtered_df['signal'].apply(lambda x: "🟢 KJØP" if x == "BUY" else "🔴 SELG" if x == "SELL" else "🟡 HOLD")
        
        st.dataframe(
            filtered_df[['Ticker', 'Pris', 'Endring', 'RSI', 'K-Score', 'Trend', 'Signal']],
            hide_index=True,
            use_container_width=True,
            height=400
        )
    
    with tab3:
        st.subheader("Detaljert analyse")
        
        # Velg aksje
        selected_ticker = st.selectbox(
            "Velg aksje for analyse:",
            df_res['ticker'].tolist(),
            format_func=lambda x: x.replace('.OL', '')
        )
        
        selected_data = next((item for item in results if item["ticker"] == selected_ticker), None)
        
        if selected_data:
            # Info cards
            info_col1, info_col2, info_col3, info_col4 = st.columns(4)
            
            with info_col1:
                signal_class = "signal-buy" if selected_data['signal'] == "BUY" else "signal-sell" if selected_data['signal'] == "SELL" else "signal-hold"
                signal_text = "🟢 KJØP" if selected_data['signal'] == "BUY" else "🔴 SELG" if selected_data['signal'] == "SELL" else "🟡 HOLD"
                st.markdown(f'<div class="{signal_class}">{signal_text}</div>', unsafe_allow_html=True)
                st.caption("Signal")
            
            with info_col2:
                st.metric("Pris", f"{selected_data['pris']:.2f} kr")
            
            with info_col3:
                st.metric("RSI", f"{selected_data['rsi']:.1f}")
            
            with info_col4:
                st.metric("K-Score", f"{selected_data['score']}")
            
            # Chart
            plot_df = selected_data['df'].tail(100)
            
            if not plot_df.empty:
                fig = go.Figure()
                
                # Candlestick
                fig.add_trace(go.Candlestick(
                    x=plot_df.index,
                    open=plot_df['Open'],
                    high=plot_df['High'],
                    low=plot_df['Low'],
                    close=plot_df['Close'],
                    name="Pris",
                    increasing_line_color='#22c55e',
                    decreasing_line_color='#ef4444',
                    increasing_fillcolor='#22c55e',
                    decreasing_fillcolor='#ef4444'
                ))
                
                # SMA lines
                fig.add_trace(go.Scatter(
                    x=plot_df.index,
                    y=plot_df['SMA20'],
                    mode='lines',
                    name='SMA 20',
                    line=dict(color='#0ea5e9', width=1.5)
                ))
                
                fig.add_trace(go.Scatter(
                    x=plot_df.index,
                    y=plot_df['SMA50'],
                    mode='lines',
                    name='SMA 50',
                    line=dict(color='#f59e0b', width=1.5)
                ))
                
                fig.update_layout(
                    title=f"{selected_ticker.replace('.OL', '')} - Siste 100 dager",
                    plot_bgcolor='white',
                    paper_bgcolor='white',
                    xaxis=dict(gridcolor='#f1f5f9', showgrid=True),
                    yaxis=dict(gridcolor='#f1f5f9', showgrid=True, side='right'),
                    xaxis_rangeslider_visible=False,
                    height=500,
                    legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1),
                    hovermode='x unified'
                )
                
                st.plotly_chart(fig, use_container_width=True)
                
                # RSI Chart
                fig_rsi = go.Figure()
                
                fig_rsi.add_trace(go.Scatter(
                    x=plot_df.index,
                    y=plot_df['RSI'],
                    mode='lines',
                    name='RSI',
                    line=dict(color='#8b5cf6', width=2),
                    fill='tozeroy',
                    fillcolor='rgba(139,92,246,0.1)'
                ))
                
                fig_rsi.add_hline(y=70, line_dash="dash", line_color="#ef4444", opacity=0.7)
                fig_rsi.add_hline(y=30, line_dash="dash", line_color="#22c55e", opacity=0.7)
                
                fig_rsi.update_layout(
                    title="RSI Indikator",
                    plot_bgcolor='white',
                    paper_bgcolor='white',
                    xaxis=dict(gridcolor='#f1f5f9', showgrid=True),
                    yaxis=dict(gridcolor='#f1f5f9', showgrid=True, range=[0, 100]),
                    height=200,
                    showlegend=False
                )
                
                st.plotly_chart(fig_rsi, use_container_width=True)
                
                # Handelsplan og analyse
                st.markdown("---")
                st.subheader("📋 Handelsplan")
                
                plan_col1, plan_col2, plan_col3 = st.columns(3)
                
                with plan_col1:
                    st.markdown("""
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h4 style="color: #64748b; margin-bottom: 0.5rem;">Anbefalt Inngang</h4>
                        <p style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0;">
                            {:.2f} kr
                        </p>
                    </div>
                    """.format(selected_data['pris']), unsafe_allow_html=True)
                
                with plan_col2:
                    st.markdown("""
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h4 style="color: #64748b; margin-bottom: 0.5rem;">Stop Loss</h4>
                        <p style="font-size: 1.5rem; font-weight: 700; color: #ef4444; margin: 0;">
                            {:.2f} kr
                        </p>
                        <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
                            (2x ATR under)
                        </p>
                    </div>
                    """.format(selected_data['stop_loss']), unsafe_allow_html=True)
                
                with plan_col3:
                    st.markdown("""
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h4 style="color: #64748b; margin-bottom: 0.5rem;">Teknisk Target</h4>
                        <p style="font-size: 1.5rem; font-weight: 700; color: #22c55e; margin: 0;">
                            {:.2f} kr
                        </p>
                        <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
                            (Neste motstandsnivå)
                        </p>
                    </div>
                    """.format(selected_data['target']), unsafe_allow_html=True)
                
                # Risiko/Belønning og Tidsestimat
                st.markdown("<br>", unsafe_allow_html=True)
                rr_col1, rr_col2 = st.columns(2)
                
                with rr_col1:
                    rr_ratio = selected_data['rr_ratio']
                    rr_color = "#22c55e" if rr_ratio >= 2.0 else "#f59e0b" if rr_ratio >= 1.0 else "#ef4444"
                    rr_status = "✅ God" if rr_ratio >= 2.0 else "⚠️ Moderat" if rr_ratio >= 1.0 else "❌ Lav"
                    
                    st.markdown("""
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h4 style="color: #64748b; margin-bottom: 0.5rem;">Risiko/Belønning Ratio</h4>
                        <p style="font-size: 2rem; font-weight: 700; color: {}; margin: 0;">
                            {:.2f}
                        </p>
                        <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">
                            {} • Anbefalt: over 2.0
                        </p>
                    </div>
                    """.format(rr_color, rr_ratio, rr_status), unsafe_allow_html=True)
                
                with rr_col2:
                    st.markdown("""
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h4 style="color: #64748b; margin-bottom: 0.5rem;">Tidsestimat</h4>
                        <p style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0;">
                            Swing: 3-6 uker
                        </p>
                        <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">
                            Basert på teknisk analyse og trendstyrke
                        </p>
                    </div>
                    """, unsafe_allow_html=True)
                
                # Forklarende tekst
                st.markdown("<br>", unsafe_allow_html=True)
                explanation_text = selected_data.get('explanation', 'Ingen forklaring tilgjengelig.')
                
                st.markdown("""
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                            padding: 1.5rem; border-radius: 12px; border: 1px solid #bae6fd; margin-top: 1rem;">
                    <h4 style="color: #0f172a; margin-bottom: 0.75rem;">📝 Signalanalyse</h4>
                    <p style="color: #0f172a; line-height: 1.6; margin: 0;">
                        {}
                    </p>
                </div>
                """.format(explanation_text), unsafe_allow_html=True)
                
                # Innside-sjekk
                st.markdown("<br>", unsafe_allow_html=True)
                st.markdown("""
                <div style="background: #fef3c7; padding: 1.25rem; border-radius: 12px; border: 2px solid #fbbf24; margin-top: 1rem;">
                    <h4 style="color: #92400e; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        ⚠️ Innside-sjekk
                    </h4>
                    <p style="color: #78350f; line-height: 1.6; margin: 0;">
                        <strong>Viktig:</strong> Sjekk siste meldinger på 
                        <a href="https://www.newsweb.no" target="_blank" style="color: #92400e; text-decoration: underline;">Newsweb</a> 
                        for økning i eierandel over 10%. Innsidehandel kan påvirke kursutviklingen betydelig.
                    </p>
                </div>
                """, unsafe_allow_html=True)
    
    # Sidebar info
    with st.sidebar:
        st.markdown("### 📋 Signal Guide")
        
        st.markdown("""
        <div class="info-card">
            <p><strong>🟢 KJØP</strong></p>
            <p style="font-size: 0.85rem; color: #64748b;">RSI under 55, pris over SMA20/50, positiv momentum</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="info-card" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-color: #fecaca;">
            <p><strong>🔴 SELG</strong></p>
            <p style="font-size: 0.85rem; color: #64748b;">RSI over 75 eller pris under begge MA</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="info-card" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border-color: #fde68a;">
            <p><strong>🟡 HOLD</strong></p>
            <p style="font-size: 0.85rem; color: #64748b;">Ingen klar retning, avvent</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        st.markdown("### 📊 K-Score")
        st.caption("Kombinerer momentum, RSI og trendstyrke. Høyere = bedre mulighet.")
        
        st.markdown("---")
        
        st.info("ℹ️ Viser data fra siste handelsdag. Data kan være fra forrige handelsdag hvis børsen er stengt (helg/etter stengetid).")

else:
    st.warning("⚠️ **Kunne ikke hente markedsdata**")
    st.info("""
    **Mulige årsaker:**
    - Børsen er stengt (helg, kveld eller helligdag)
    - Tidsavhengig API-rate limiting
    - Midlertidig nettverksproblem
    
    **Løsning:** Prøv å oppdatere siden om noen minutter eller sjekk at internettforbindelsen fungerer.
    Data vises fra siste handelsdag når børsen er stengt.
    """)

# Footer
st.markdown("---")
st.caption("Data fra yfinance • K-Score er en taktisk indikator, ikke finansiell rådgivning")
