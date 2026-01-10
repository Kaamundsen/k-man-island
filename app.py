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
    page_title="K-man Island",
    layout="wide",
    initial_sidebar_state="expanded"
)

if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None
if 'view' not in st.session_state:
    st.session_state.view = 'Dashboard'

# ============================================
# 2. DESIGN - Rent og profesjonelt
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    color: #1a1a1a;
    background-color: #F8F7F4;
}

.stApp { background-color: #F8F7F4; }

section[data-testid="stSidebar"] {
    background-color: #ffffff !important;
    border-right: 1px solid #e5e7eb;
}

/* Status-kort */
.stat-box {
    background: white;
    border-radius: 16px;
    padding: 20px 24px;
    border: 1px solid #e5e7eb;
}

.stat-value {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
}

.stat-label {
    font-size: 0.85rem;
    color: #6b7280;
    font-weight: 500;
}

/* Aksje-kort */
.stock-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #e5e7eb;
    margin-bottom: 16px;
    transition: all 0.2s ease;
}

.stock-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    transform: translateY(-2px);
}

.ticker-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a1a1a;
}

.signal-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
}

.signal-buy { background: #dcfce7; color: #166534; }
.signal-hold { background: #fef3c7; color: #92400e; }
.signal-sell { background: #fee2e2; color: #991b1b; }

.metric-row {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
}

.metric-item {
    text-align: center;
}

.metric-value {
    font-size: 1rem;
    font-weight: 700;
}

.metric-label {
    font-size: 0.7rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.positive { color: #16a34a; }
.negative { color: #dc2626; }

/* Progress bar */
.prog-bg {
    background: #f3f4f6;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 8px;
}

.prog-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
}

/* Tabell */
.clean-table {
    width: 100%;
    border-collapse: collapse;
}

.clean-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e5e7eb;
    background: #f9fafb;
}

.clean-table td {
    padding: 16px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.9rem;
}

.clean-table tr:hover td {
    background: #f9fafb;
}
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR - Forbedret analyse
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
            if df.empty or len(df) < 60: 
                continue
            if isinstance(df.columns, pd.MultiIndex): 
                df.columns = df.columns.droplevel(1)
            
            # Grunnleggende data
            close = float(df['Close'].iloc[-1])
            prev_close = float(df['Close'].iloc[-2])
            change_pct = ((close - prev_close) / prev_close) * 100
            
            # Tekniske indikatorer
            rsi = ta.rsi(df['Close'], length=14).iloc[-1]
            sma20 = ta.sma(df['Close'], length=20).iloc[-1]
            sma50 = ta.sma(df['Close'], length=50).iloc[-1]
            atr = ta.atr(df['High'], df['Low'], df['Close'], length=14).iloc[-1]
            ema12 = ta.ema(df['Close'], length=12).iloc[-1]
            ema26 = ta.ema(df['Close'], length=26).iloc[-1]
            
            if pd.isna(rsi) or pd.isna(sma20) or pd.isna(sma50) or pd.isna(atr):
                continue
            
            # Finn motstandsnivå (target)
            recent_highs = df['High'].tail(60).values
            resistance_levels = []
            for i in range(1, len(recent_highs) - 1):
                if recent_highs[i] > recent_highs[i-1] and recent_highs[i] > recent_highs[i+1]:
                    resistance_levels.append(recent_highs[i])
            
            above_current = [r for r in resistance_levels if r > close]
            if above_current:
                target = min(above_current)
            else:
                target = close * 1.08  # Default 8% opp
            
            # Stop loss basert på ATR
            stop_loss = close - (2 * atr)
            
            # Beregn gevinstpotensial og risiko
            pot_kr = target - close
            pot_pct = (pot_kr / close) * 100
            risk_kr = close - stop_loss
            risk_pct = (risk_kr / close) * 100
            
            # R:R ratio
            rr_ratio = pot_kr / risk_kr if risk_kr > 0 else 0
            
            # Signal-logikk
            five_day_return = (close / float(df['Close'].iloc[-5])) - 1 if len(df) >= 5 else 0
            
            is_buy = (
                rsi < 55 and 
                close > sma20 and 
                close > sma50 and 
                ema12 > ema26 and 
                five_day_return > 0
            )
            
            is_sell = rsi > 75 or (close < sma20 and close < sma50)
            
            signal = "BUY" if is_buy else "SELL" if is_sell else "HOLD"
            
            results.append({
                "ticker": t.replace('.OL', ''),
                "ticker_full": t,
                "pris": round(close, 2),
                "endring": round(change_pct, 2),
                "rsi": round(rsi, 1),
                "signal": signal,
                "target": round(target, 2),
                "stop_loss": round(stop_loss, 2),
                "pot_kr": round(pot_kr, 2),
                "pot_pct": round(pot_pct, 1),
                "risk_kr": round(risk_kr, 2),
                "risk_pct": round(risk_pct, 1),
                "rr_ratio": round(rr_ratio, 2),
                "df": df
            })
        except Exception:
            continue
    
    # SORTER: Høyest gevinstpotensial (%) først, men prioriter BUY signaler
    return sorted(results, key=lambda x: (
        0 if x['signal'] == 'BUY' else 1 if x['signal'] == 'HOLD' else 2,  # Signal prioritet
        -x['pot_pct']  # Høyest gevinstpotensial først
    ))

# ============================================
# 4. SIDEBAR
# ============================================
with st.sidebar:
    st.markdown("### 🏝️ K-man Island")
    st.markdown("---")
    
    if st.button("🏠 Dashboard", use_container_width=True):
        st.session_state.view = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
    
    if st.button("📋 Alle aksjer", use_container_width=True):
        st.session_state.view = 'Scanner'
        st.session_state.selected_ticker = None
        st.rerun()
    
    st.markdown("---")
    st.caption(f"Sist oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

if not data:
    st.warning("Kunne ikke hente data. Børsen kan være stengt.")
    st.stop()

# Statistikk
buys = len([d for d in data if d['signal'] == 'BUY'])
holds = len([d for d in data if d['signal'] == 'HOLD'])
sells = len([d for d in data if d['signal'] == 'SELL'])

# ============================================
# DASHBOARD VIEW
# ============================================
if st.session_state.view == 'Dashboard' and not st.session_state.selected_ticker:
    
    st.markdown("## Oversikt")
    st.markdown(f"<p style='color: #6b7280;'>Oslo Børs · {datetime.now().strftime('%d. %B %Y')}</p>", unsafe_allow_html=True)
    
    # Status-kort
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="stat-box">
            <div class="stat-value" style="color: #16a34a;">{buys}</div>
            <div class="stat-label">Kjøpssignaler</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="stat-box">
            <div class="stat-value" style="color: #f59e0b;">{holds}</div>
            <div class="stat-label">Hold</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="stat-box">
            <div class="stat-value" style="color: #dc2626;">{sells}</div>
            <div class="stat-label">Salgssignaler</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="stat-box">
            <div class="stat-value">{len(data)}</div>
            <div class="stat-label">Aksjer analysert</div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Top muligheter tabell
    st.markdown("### 🎯 Top Muligheter")
    st.markdown("<p style='color: #6b7280; font-size: 0.9rem;'>Sortert etter høyest gevinstpotensial</p>", unsafe_allow_html=True)
    
    # Bygg tabell HTML
    table_html = """
    <table class="clean-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Ticker</th>
                <th>Pris</th>
                <th>Signal</th>
                <th>Gevinstpotensial</th>
                <th>Risiko</th>
                <th>R:R</th>
                <th>RSI</th>
            </tr>
        </thead>
        <tbody>
    """
    
    for i, stock in enumerate(data[:15], 1):
        signal_class = "signal-buy" if stock['signal'] == "BUY" else "signal-sell" if stock['signal'] == "SELL" else "signal-hold"
        signal_text = "KJØP" if stock['signal'] == "BUY" else "SELG" if stock['signal'] == "SELL" else "HOLD"
        
        rr_color = "#16a34a" if stock['rr_ratio'] >= 2 else "#f59e0b" if stock['rr_ratio'] >= 1 else "#dc2626"
        
        table_html += f"""
        <tr>
            <td style="color: #9ca3af; font-weight: 600;">{i}</td>
            <td style="font-weight: 700;">{stock['ticker']}</td>
            <td>{stock['pris']:.2f} kr</td>
            <td><span class="signal-badge {signal_class}">{signal_text}</span></td>
            <td class="positive">+{stock['pot_kr']:.2f} kr / +{stock['pot_pct']:.1f}%</td>
            <td class="negative">-{stock['risk_kr']:.2f} kr / -{stock['risk_pct']:.1f}%</td>
            <td style="font-weight: 700; color: {rr_color};">{stock['rr_ratio']:.1f}</td>
            <td>{stock['rsi']:.1f}</td>
        </tr>
        """
    
    table_html += "</tbody></table>"
    st.markdown(table_html, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Detaljkort for top 4
    st.markdown("### 📊 Detaljerte kort")
    
    cols = st.columns(2)
    for i, stock in enumerate(data[:4]):
        with cols[i % 2]:
            signal_class = "signal-buy" if stock['signal'] == "BUY" else "signal-sell" if stock['signal'] == "SELL" else "signal-hold"
            signal_text = "KJØP" if stock['signal'] == "BUY" else "SELG" if stock['signal'] == "SELL" else "HOLD"
            
            st.markdown(f"""
            <div class="stock-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="ticker-name">{stock['ticker']}</span>
                    <span class="signal-badge {signal_class}">{signal_text}</span>
                </div>
                <div style="font-size: 1.8rem; font-weight: 800; margin: 12px 0;">{stock['pris']:.2f} <span style="font-size: 1rem; color: #6b7280;">NOK</span></div>
                
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-value positive">+{stock['pot_pct']:.1f}%</div>
                        <div class="metric-label">Gevinstpotensial</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value negative">-{stock['risk_pct']:.1f}%</div>
                        <div class="metric-label">Risiko</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">{stock['rr_ratio']:.1f}</div>
                        <div class="metric-label">R:R Ratio</div>
                    </div>
                </div>
                
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 0.85rem;">
                    <span><strong>Target:</strong> {stock['target']:.2f} kr</span>
                    <span><strong>Stop:</strong> {stock['stop_loss']:.2f} kr</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button(f"Se analyse → {stock['ticker']}", key=f"btn_{stock['ticker']}", use_container_width=True):
                st.session_state.selected_ticker = stock['ticker_full']
                st.rerun()

# ============================================
# ANALYSE VIEW
# ============================================
elif st.session_state.selected_ticker:
    stock = next((d for d in data if d['ticker_full'] == st.session_state.selected_ticker), None)
    
    if not stock:
        st.error("Fant ikke aksjen")
        st.stop()
    
    if st.button("← Tilbake"):
        st.session_state.selected_ticker = None
        st.rerun()
    
    st.markdown(f"## {stock['ticker']}")
    
    # Info-kort
    col1, col2, col3, col4 = st.columns(4)
    
    signal_class = "signal-buy" if stock['signal'] == "BUY" else "signal-sell" if stock['signal'] == "SELL" else "signal-hold"
    signal_text = "KJØP" if stock['signal'] == "BUY" else "SELG" if stock['signal'] == "SELL" else "HOLD"
    
    with col1:
        st.markdown(f'<span class="signal-badge {signal_class}" style="font-size: 1rem; padding: 8px 16px;">{signal_text}</span>', unsafe_allow_html=True)
        st.caption("Signal")
    
    with col2:
        st.metric("Pris", f"{stock['pris']:.2f} kr", f"{stock['endring']:+.2f}%")
    
    with col3:
        st.metric("Gevinstpotensial", f"+{stock['pot_pct']:.1f}%", f"+{stock['pot_kr']:.2f} kr")
    
    with col4:
        st.metric("Risiko", f"-{stock['risk_pct']:.1f}%", f"-{stock['risk_kr']:.2f} kr")
    
    # Graf
    df_plot = stock['df'].tail(100)
    
    fig = go.Figure()
    
    fig.add_trace(go.Candlestick(
        x=df_plot.index,
        open=df_plot['Open'],
        high=df_plot['High'],
        low=df_plot['Low'],
        close=df_plot['Close'],
        name="Pris",
        increasing_line_color='#16a34a',
        decreasing_line_color='#dc2626'
    ))
    
    # Target og Stop Loss linjer
    fig.add_hline(y=stock['target'], line_dash="dash", line_color="#16a34a", 
                  annotation_text=f"Target: {stock['target']:.2f}")
    fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#dc2626", 
                  annotation_text=f"Stop: {stock['stop_loss']:.2f}")
    
    fig.update_layout(
        height=500,
        xaxis_rangeslider_visible=False,
        template="plotly_white",
        margin=dict(l=0, r=0, t=40, b=0)
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Handelsplan
    st.markdown("### 📋 Handelsplan")
    
    plan_col1, plan_col2, plan_col3 = st.columns(3)
    
    with plan_col1:
        st.markdown(f"""
        <div class="stat-box">
            <div class="stat-label">Inngang</div>
            <div class="stat-value">{stock['pris']:.2f} kr</div>
        </div>
        """, unsafe_allow_html=True)
    
    with plan_col2:
        st.markdown(f"""
        <div class="stat-box">
            <div class="stat-label">Stop Loss</div>
            <div class="stat-value" style="color: #dc2626;">{stock['stop_loss']:.2f} kr</div>
        </div>
        """, unsafe_allow_html=True)
    
    with plan_col3:
        st.markdown(f"""
        <div class="stat-box">
            <div class="stat-label">Target</div>
            <div class="stat-value" style="color: #16a34a;">{stock['target']:.2f} kr</div>
        </div>
        """, unsafe_allow_html=True)

# ============================================
# SCANNER VIEW
# ============================================
elif st.session_state.view == 'Scanner':
    st.markdown("## Alle aksjer")
    st.markdown(f"<p style='color: #6b7280;'>Sortert etter gevinstpotensial</p>", unsafe_allow_html=True)
    
    # Filter
    filter_col1, filter_col2 = st.columns([1, 3])
    with filter_col1:
        signal_filter = st.selectbox("Filtrer signal:", ["Alle", "KJØP", "HOLD", "SELG"])
    
    filtered_data = data
    if signal_filter == "KJØP":
        filtered_data = [d for d in data if d['signal'] == 'BUY']
    elif signal_filter == "HOLD":
        filtered_data = [d for d in data if d['signal'] == 'HOLD']
    elif signal_filter == "SELG":
        filtered_data = [d for d in data if d['signal'] == 'SELL']
    
    # Tabell
    table_html = """
    <table class="clean-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Ticker</th>
                <th>Pris</th>
                <th>Signal</th>
                <th>Gevinstpotensial</th>
                <th>Risiko</th>
                <th>R:R</th>
                <th>RSI</th>
            </tr>
        </thead>
        <tbody>
    """
    
    for i, stock in enumerate(filtered_data, 1):
        signal_class = "signal-buy" if stock['signal'] == "BUY" else "signal-sell" if stock['signal'] == "SELL" else "signal-hold"
        signal_text = "KJØP" if stock['signal'] == "BUY" else "SELG" if stock['signal'] == "SELL" else "HOLD"
        
        rr_color = "#16a34a" if stock['rr_ratio'] >= 2 else "#f59e0b" if stock['rr_ratio'] >= 1 else "#dc2626"
        
        table_html += f"""
        <tr>
            <td style="color: #9ca3af; font-weight: 600;">{i}</td>
            <td style="font-weight: 700;">{stock['ticker']}</td>
            <td>{stock['pris']:.2f} kr</td>
            <td><span class="signal-badge {signal_class}">{signal_text}</span></td>
            <td class="positive">+{stock['pot_kr']:.2f} kr / +{stock['pot_pct']:.1f}%</td>
            <td class="negative">-{stock['risk_kr']:.2f} kr / -{stock['risk_pct']:.1f}%</td>
            <td style="font-weight: 700; color: {rr_color};">{stock['rr_ratio']:.1f}</td>
            <td>{stock['rsi']:.1f}</td>
        </tr>
        """
    
    table_html += "</tbody></table>"
    st.markdown(table_html, unsafe_allow_html=True)

# Footer
st.markdown("---")
st.caption("K-man Island © 2026 · Data fra yfinance · Ikke finansiell rådgivning")
