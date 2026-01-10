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

# 2. Premium Dark Theme CSS
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

:root {
    --bg-primary: #0a0a0f;
    --bg-secondary: #12121a;
    --bg-card: rgba(22, 22, 32, 0.8);
    --accent-cyan: #00d4ff;
    --accent-emerald: #10b981;
    --accent-amber: #f59e0b;
    --accent-rose: #f43f5e;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --border-color: rgba(255,255,255,0.08);
}

.stApp {
    background: linear-gradient(135deg, var(--bg-primary) 0%, #0d1117 50%, #0a0a12 100%);
    background-attachment: fixed;
}

/* Hide default streamlit elements */
#MainMenu, footer, header {visibility: hidden;}
.block-container {padding-top: 2rem; padding-bottom: 2rem;}

/* Typography */
h1, h2, h3, p, span, div, label {
    font-family: 'Outfit', sans-serif !important;
}

/* Hero Section */
.hero-container {
    background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(16,185,129,0.05) 100%);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    padding: 3rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
}

.hero-container::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%);
    pointer-events: none;
}

.hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff 0%, var(--accent-cyan) 50%, var(--accent-emerald) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: -2px;
}

.hero-subtitle {
    font-size: 1.2rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    font-weight: 400;
}

/* Signal Cards */
.signal-card {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.signal-card:hover {
    transform: translateY(-4px);
    border-color: rgba(0,212,255,0.3);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.signal-card.buy {
    border-left: 4px solid var(--accent-emerald);
}

.signal-card.sell {
    border-left: 4px solid var(--accent-rose);
}

.signal-card.hold {
    border-left: 4px solid var(--accent-amber);
}

/* Metric Cards */
.metric-card {
    background: linear-gradient(145deg, rgba(22,22,32,0.9) 0%, rgba(15,15,22,0.95) 100%);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
}

.metric-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--accent-cyan);
    margin: 0;
}

.metric-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 0.5rem;
}

/* Custom Table */
.stock-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 8px;
}

.stock-table th {
    background: transparent;
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.stock-table tr {
    background: var(--bg-card);
    transition: all 0.2s ease;
}

.stock-table tr:hover {
    background: rgba(0,212,255,0.05);
    transform: scale(1.01);
}

.stock-table td {
    padding: 1rem;
    color: var(--text-primary);
    font-weight: 500;
}

.stock-table td:first-child {
    border-radius: 12px 0 0 12px;
}

.stock-table td:last-child {
    border-radius: 0 12px 12px 0;
}

/* Signal Badges */
.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    gap: 6px;
}

.badge-buy {
    background: rgba(16,185,129,0.15);
    color: var(--accent-emerald);
    border: 1px solid rgba(16,185,129,0.3);
}

.badge-sell {
    background: rgba(244,63,94,0.15);
    color: var(--accent-rose);
    border: 1px solid rgba(244,63,94,0.3);
}

.badge-hold {
    background: rgba(245,158,11,0.15);
    color: var(--accent-amber);
    border: 1px solid rgba(245,158,11,0.3);
}

.badge-up {
    background: rgba(16,185,129,0.1);
    color: var(--accent-emerald);
}

.badge-down {
    background: rgba(244,63,94,0.1);
    color: var(--accent-rose);
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
    border-right: 1px solid var(--border-color);
}

section[data-testid="stSidebar"] .stSelectbox label {
    color: var(--text-secondary) !important;
}

/* Spinner */
.stSpinner > div {
    border-color: var(--accent-cyan) transparent transparent transparent !important;
}

/* Info boxes */
.stAlert {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 12px !important;
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--bg-primary);
}

::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.2);
}

/* Pulse animation for signals */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.pulse {
    animation: pulse 2s infinite;
}

/* Live indicator */
.live-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 20px;
    font-size: 0.8rem;
    color: var(--accent-emerald);
}

.live-dot {
    width: 8px;
    height: 8px;
    background: var(--accent-emerald);
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}
</style>
""", unsafe_allow_html=True)

# 3. Skanner-motor med signal-logikk
def get_analysis(ticker):
    try:
        df = yf.download(ticker, period="1y", interval="1d", progress=False)
        
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        if df.empty or len(df) < 50: 
            return None
        
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        
        if pd.isna(df['RSI'].iloc[-1]) or pd.isna(df['SMA20'].iloc[-1]) or pd.isna(df['SMA50'].iloc[-1]):
            return None
        
        last_close = float(df['Close'].iloc[-1])
        last_rsi = float(df['RSI'].iloc[-1])
        last_sma20 = float(df['SMA20'].iloc[-1])
        last_sma50 = float(df['SMA50'].iloc[-1])
        
        # Beregn endring
        prev_close = float(df['Close'].iloc[-2]) if len(df) >= 2 else last_close
        change_pct = ((last_close - prev_close) / prev_close) * 100
        
        buy_signal = False
        sell_signal = False
        
        if len(df) >= 2:
            prev_sma20 = df['SMA20'].iloc[-2]
            if not pd.isna(prev_close) and not pd.isna(prev_sma20):
                buy_signal = (last_rsi < 50) and (last_close > last_sma20) and (prev_close <= prev_sma20)
                sell_signal = (last_rsi > 70) or (last_close < last_sma20 and prev_close >= prev_sma20)

        if len(df) >= 60:
            old_price = float(df['Close'].iloc[-60])
            returns_3m = (last_close / old_price) - 1
        else:
            old_price = float(df['Close'].iloc[0])
            returns_3m = (last_close / old_price) - 1
        
        score = (returns_3m * 50) + (20 if 35 < last_rsi < 55 else 0)
        
        return {
            "df": df,
            "ticker": ticker,
            "pris": last_close,
            "change": change_pct,
            "rsi": last_rsi,
            "score": round(score, 1),
            "trend": "UP" if last_close > last_sma50 else "DOWN",
            "signal": "BUY" if buy_signal else "SELL" if sell_signal else "HOLD"
        }
    except Exception:
        try:
            ticker_obj = yf.Ticker(ticker)
            df = ticker_obj.history(period="1y")
            if df.empty or len(df) < 50:
                return None
            
            df['RSI'] = ta.rsi(df['Close'], length=14)
            df['SMA20'] = ta.sma(df['Close'], length=20)
            df['SMA50'] = ta.sma(df['Close'], length=50)
            
            if pd.isna(df['RSI'].iloc[-1]) or pd.isna(df['SMA20'].iloc[-1]) or pd.isna(df['SMA50'].iloc[-1]):
                return None
            
            last_close = float(df['Close'].iloc[-1])
            last_rsi = float(df['RSI'].iloc[-1])
            last_sma20 = float(df['SMA20'].iloc[-1])
            last_sma50 = float(df['SMA50'].iloc[-1])
            
            prev_close = float(df['Close'].iloc[-2]) if len(df) >= 2 else last_close
            change_pct = ((last_close - prev_close) / prev_close) * 100
            
            buy_signal = False
            sell_signal = False
            
            if len(df) >= 2:
                prev_sma20 = df['SMA20'].iloc[-2]
                if not pd.isna(prev_close) and not pd.isna(prev_sma20):
                    buy_signal = (last_rsi < 50) and (last_close > last_sma20) and (prev_close <= prev_sma20)
                    sell_signal = (last_rsi > 70) or (last_close < last_sma20 and prev_close >= prev_sma20)
            
            if len(df) >= 60:
                old_price = float(df['Close'].iloc[-60])
                returns_3m = (last_close / old_price) - 1
            else:
                old_price = float(df['Close'].iloc[0])
                returns_3m = (last_close / old_price) - 1
            
            score = (returns_3m * 50) + (20 if 35 < last_rsi < 55 else 0)
            
            return {
                "df": df,
                "ticker": ticker,
                "pris": last_close,
                "change": change_pct,
                "rsi": last_rsi,
                "score": round(score, 1),
                "trend": "UP" if last_close > last_sma50 else "DOWN",
                "signal": "BUY" if buy_signal else "SELL" if sell_signal else "HOLD"
            }
        except:
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

# 5. Hero Section
st.markdown(f"""
<div class="hero-container">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
            <h1 class="hero-title">🏝️ K-man Island</h1>
            <p class="hero-subtitle">Tactical Portfolio Intelligence • Oslo Børs Scanner</p>
        </div>
        <div class="live-indicator">
            <span class="live-dot"></span>
            <span>{datetime.now().strftime('%H:%M')} • Siste data</span>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# 6. Data Loading
results = []
progress_placeholder = st.empty()

with st.spinner(''):
    progress_placeholder.markdown("""
    <div style="text-align: center; padding: 2rem;">
        <p style="color: #94a3b8; font-size: 1rem;">🔍 Skanner Oslo Børs...</p>
    </div>
    """, unsafe_allow_html=True)
    
    for t in watchlist:
        data = get_analysis(t)
        if data: 
            results.append(data)

progress_placeholder.empty()

if results:
    df_res = pd.DataFrame([{k: v for k, v in r.items() if k != 'df'} for r in results])
    df_res = df_res.sort_values(by="score", ascending=False)
    
    # Stats
    buy_signals = len([r for r in results if r['signal'] == 'BUY'])
    sell_signals = len([r for r in results if r['signal'] == 'SELL'])
    up_trends = len([r for r in results if r['trend'] == 'UP'])
    
    # Metrics Row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value">{len(results)}</p>
            <p class="metric-label">Aksjer Analysert</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value" style="color: #10b981;">{buy_signals}</p>
            <p class="metric-label">Kjøpssignaler</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value" style="color: #f43f5e;">{sell_signals}</p>
            <p class="metric-label">Salgssignaler</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value" style="color: #00d4ff;">{up_trends}</p>
            <p class="metric-label">Opptrend</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Top Opportunities Table
    st.markdown("""
    <h2 style="color: #f8fafc; font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">
        🎯 Top 10 Opportunities
    </h2>
    """, unsafe_allow_html=True)
    
    # Build HTML table
    top10 = df_res.head(10)
    
    def get_signal_badge(signal):
        if signal == "BUY":
            return '<span class="badge badge-buy">🚀 KJØP</span>'
        elif signal == "SELL":
            return '<span class="badge badge-sell">⚠️ SELG</span>'
        return '<span class="badge badge-hold">📊 HOLD</span>'
    
    def get_trend_badge(trend):
        if trend == "UP":
            return '<span class="badge badge-up">↑ Opptrend</span>'
        return '<span class="badge badge-down">↓ Nedtrend</span>'
    
    def format_change(change):
        color = "#10b981" if change >= 0 else "#f43f5e"
        sign = "+" if change >= 0 else ""
        return f'<span style="color: {color}; font-weight: 600;">{sign}{change:.2f}%</span>'
    
    table_html = """
    <table class="stock-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Ticker</th>
                <th>Pris</th>
                <th>Endring</th>
                <th>RSI</th>
                <th>K-Score</th>
                <th>Trend</th>
                <th>Signal</th>
            </tr>
        </thead>
        <tbody>
    """
    
    for idx, row in enumerate(top10.itertuples(), 1):
        table_html += f"""
        <tr>
            <td style="color: #94a3b8;">{idx}</td>
            <td style="font-weight: 700; color: #00d4ff;">{row.ticker.replace('.OL', '')}</td>
            <td>{row.pris:.2f} NOK</td>
            <td>{format_change(row.change)}</td>
            <td>{row.rsi:.1f}</td>
            <td style="font-weight: 700;">{row.score}</td>
            <td>{get_trend_badge(row.trend)}</td>
            <td>{get_signal_badge(row.signal)}</td>
        </tr>
        """
    
    table_html += "</tbody></table>"
    st.markdown(table_html, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Sidebar for stock selection
    with st.sidebar:
        st.markdown("""
        <h2 style="color: #f8fafc; font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;">
            📊 Detaljert Analyse
        </h2>
        """, unsafe_allow_html=True)
        
        target = st.selectbox(
            "Velg aksje:",
            df_res['ticker'].tolist(),
            format_func=lambda x: x.replace('.OL', '')
        )
        
        # Find selected data
        selected_data = next((item for item in results if item["ticker"] == target), None)
        
        if selected_data:
            signal_class = selected_data['signal'].lower()
            signal_emoji = "🚀" if signal_class == "buy" else "⚠️" if signal_class == "sell" else "📊"
            signal_text = "KJØP" if signal_class == "buy" else "SELG" if signal_class == "sell" else "HOLD"
            
            st.markdown(f"""
            <div class="signal-card {signal_class}" style="margin-top: 1rem;">
                <h3 style="color: #f8fafc; font-size: 1.5rem; margin: 0;">{target.replace('.OL', '')}</h3>
                <p style="color: #94a3b8; margin: 0.5rem 0;">Signal: <strong style="color: {'#10b981' if signal_class == 'buy' else '#f43f5e' if signal_class == 'sell' else '#f59e0b'}">{signal_emoji} {signal_text}</strong></p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 1rem 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <p style="color: #94a3b8; font-size: 0.75rem; margin: 0;">PRIS</p>
                        <p style="color: #f8fafc; font-size: 1.2rem; font-weight: 700; margin: 0;">{selected_data['pris']:.2f}</p>
                    </div>
                    <div>
                        <p style="color: #94a3b8; font-size: 0.75rem; margin: 0;">RSI</p>
                        <p style="color: #f8fafc; font-size: 1.2rem; font-weight: 700; margin: 0;">{selected_data['rsi']:.1f}</p>
                    </div>
                    <div>
                        <p style="color: #94a3b8; font-size: 0.75rem; margin: 0;">K-SCORE</p>
                        <p style="color: #00d4ff; font-size: 1.2rem; font-weight: 700; margin: 0;">{selected_data['score']}</p>
                    </div>
                    <div>
                        <p style="color: #94a3b8; font-size: 0.75rem; margin: 0;">TREND</p>
                        <p style="color: {'#10b981' if selected_data['trend'] == 'UP' else '#f43f5e'}; font-size: 1.2rem; font-weight: 700; margin: 0;">{'↑' if selected_data['trend'] == 'UP' else '↓'} {selected_data['trend']}</p>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    # Main Chart
    if selected_data:
        plot_df = selected_data['df'].tail(100)
        
        if not plot_df.empty and len(plot_df) >= 2:
            fig = go.Figure()
            
            # Candlestick
            fig.add_trace(go.Candlestick(
                x=plot_df.index,
                open=plot_df['Open'],
                high=plot_df['High'],
                low=plot_df['Low'],
                close=plot_df['Close'],
                name="Pris",
                increasing_line_color='#10b981',
                decreasing_line_color='#f43f5e',
                increasing_fillcolor='#10b981',
                decreasing_fillcolor='#f43f5e'
            ))
            
            # SMA lines
            fig.add_trace(go.Scatter(
                x=plot_df.index,
                y=plot_df['SMA20'],
                mode='lines',
                name='SMA 20',
                line=dict(color='#00d4ff', width=1.5, dash='dot')
            ))
            
            fig.add_trace(go.Scatter(
                x=plot_df.index,
                y=plot_df['SMA50'],
                mode='lines',
                name='SMA 50',
                line=dict(color='#f59e0b', width=1.5, dash='dot')
            ))
            
            fig.update_layout(
                title=dict(
                    text=f"{target.replace('.OL', '')} • Siste 100 dager",
                    font=dict(size=20, color='#f8fafc', family='Outfit')
                ),
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                xaxis=dict(
                    gridcolor='rgba(255,255,255,0.05)',
                    showgrid=True,
                    zeroline=False,
                    tickfont=dict(color='#94a3b8', family='Outfit')
                ),
                yaxis=dict(
                    gridcolor='rgba(255,255,255,0.05)',
                    showgrid=True,
                    zeroline=False,
                    tickfont=dict(color='#94a3b8', family='Outfit'),
                    side='right'
                ),
                xaxis_rangeslider_visible=False,
                height=500,
                margin=dict(l=20, r=60, t=60, b=20),
                legend=dict(
                    bgcolor='rgba(0,0,0,0)',
                    font=dict(color='#94a3b8', family='Outfit'),
                    orientation='h',
                    yanchor='bottom',
                    y=1.02,
                    xanchor='right',
                    x=1
                ),
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
                line=dict(color='#00d4ff', width=2),
                fill='tozeroy',
                fillcolor='rgba(0,212,255,0.1)'
            ))
            
            # Overkjøpt/oversolgt linjer
            fig_rsi.add_hline(y=70, line_dash="dash", line_color="#f43f5e", opacity=0.5)
            fig_rsi.add_hline(y=30, line_dash="dash", line_color="#10b981", opacity=0.5)
            
            fig_rsi.update_layout(
                title=dict(
                    text="RSI Indikator",
                    font=dict(size=16, color='#f8fafc', family='Outfit')
                ),
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                xaxis=dict(
                    gridcolor='rgba(255,255,255,0.05)',
                    showgrid=True,
                    zeroline=False,
                    tickfont=dict(color='#94a3b8', family='Outfit')
                ),
                yaxis=dict(
                    gridcolor='rgba(255,255,255,0.05)',
                    showgrid=True,
                    zeroline=False,
                    tickfont=dict(color='#94a3b8', family='Outfit'),
                    range=[0, 100]
                ),
                height=200,
                margin=dict(l=20, r=60, t=40, b=20),
                showlegend=False
            )
            
            st.plotly_chart(fig_rsi, use_container_width=True)

else:
    st.markdown("""
    <div style="text-align: center; padding: 4rem 2rem; background: rgba(22,22,32,0.8); border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);">
        <h2 style="color: #f8fafc; font-size: 1.5rem;">⚠️ Ingen data tilgjengelig</h2>
        <p style="color: #94a3b8; max-width: 400px; margin: 1rem auto;">
            Børsen kan være stengt (helg/kveld) eller det er et midlertidig problem med datahentingen. 
            Prøv igjen om noen minutter.
        </p>
    </div>
    """, unsafe_allow_html=True)

# Footer
st.markdown("""
<div style="text-align: center; padding: 2rem; margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05);">
    <p style="color: #64748b; font-size: 0.8rem;">
        Data fra yfinance • K-Score er en taktisk indikator, ikke finansiell rådgivning
    </p>
</div>
""", unsafe_allow_html=True)
