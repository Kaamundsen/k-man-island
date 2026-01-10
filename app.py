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

# 2. Lys, moderne stil
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.stApp {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
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
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    text-align: center;
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
    padding: 1.5rem 1rem;
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
}

.nav-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    color: #94a3b8;
    font-size: 1.5rem;
}

.nav-icon:hover {
    background: #334155;
    color: white;
}

.nav-icon.active {
    background: #0ea5e9;
    color: white;
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

# 5. Left Navigation Sidebar
st.markdown("""
<div class="left-sidebar">
    <div class="nav-icon active" style="font-size: 1.8rem;">🏝️</div>
    <div class="nav-icon">📊</div>
    <div class="nav-icon">📈</div>
    <div class="nav-icon">📋</div>
    <div class="nav-icon">👥</div>
    <div class="nav-icon">⚙️</div>
    <div class="toggle-switch">ON</div>
</div>
""", unsafe_allow_html=True)

# Top Header Bar
header_col1, header_col2, header_col3, header_col4 = st.columns([3, 1, 1, 1])
with header_col1:
    st.markdown(f"""
    <div style="padding: 1rem 0;">
        <input type="text" placeholder="Søk globalt..." style="
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            background: white;
            font-size: 0.9rem;
        ">
    </div>
    """, unsafe_allow_html=True)

with header_col2:
    st.markdown("""
    <div style="text-align: center; padding: 1rem 0;">
        <span style="font-size: 1.5rem;">💬</span>
    </div>
    """, unsafe_allow_html=True)

with header_col3:
    st.markdown("""
    <div style="text-align: center; padding: 1rem 0;">
        <span style="font-size: 1.5rem;">🔔</span>
    </div>
    """, unsafe_allow_html=True)

with header_col4:
    st.markdown(f"""
    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 1rem 0;">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: #0ea5e9; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">KN</div>
        <div>
            <div style="font-weight: 600; font-size: 0.9rem;">K-man Island</div>
            <div style="font-size: 0.75rem; color: #64748b;">Investor</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

# Main Title Section
col_title, col_live = st.columns([4, 1])
with col_title:
    st.markdown("# 🏝️ K-man Island")
    st.markdown("**Tactical Portfolio Intelligence** • Oslo Børs Scanner")

with col_live:
    st.markdown(f"""
    <div style="text-align: right; padding-top: 1rem;">
        <span class="live-badge">
            <span class="live-dot"></span>
            {datetime.now().strftime('%H:%M')}
        </span>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# 6. Data Loading
results = []
with st.spinner('🔍 Skanner Oslo Børs...'):
    for t in watchlist:
        data = get_analysis(t)
        if data: 
            results.append(data)

if results:
    df_res = pd.DataFrame([{k: v for k, v in r.items() if k != 'df'} for r in results])
    df_res = df_res.sort_values(by="score", ascending=False)
    
    # Stats
    buy_count = len([r for r in results if r['signal'] == 'BUY'])
    sell_count = len([r for r in results if r['signal'] == 'SELL'])
    up_count = len([r for r in results if r['trend'] == 'UP'])
    
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
