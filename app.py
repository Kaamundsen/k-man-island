import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from datetime import datetime

# 1. Konfigurasjon
st.set_page_config(
    page_title="K-man Island Intelligence", 
    layout="wide", 
    initial_sidebar_state="expanded"
)

# Initialiser session state
if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = "NOD.OL"
if 'current_page' not in st.session_state:
    st.session_state.current_page = "Dashboard"

# Custom CSS for et ultra-moderne utseende
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #1e293b;
    }
    
    .stApp {
        background-color: #f8fafc;
    }
    
    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: white !important;
        border-right: 1px solid #e2e8f0;
    }
    
    /* Card styling */
    .k-card {
        background-color: white;
        border-radius: 16px;
        padding: 24px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s, box-shadow 0.2s;
        margin-bottom: 1rem;
    }
    .k-card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }
    
    /* Header styling */
    .k-header {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.05em;
        margin-bottom: 0.25rem;
    }
    
    .k-sub {
        color: #64748b;
        font-weight: 500;
        margin-bottom: 2rem;
    }
    
    /* Signal badges */
    .k-badge {
        padding: 6px 14px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
        display: inline-block;
    }
    .k-buy { background-color: #dcfce7; color: #15803d; }
    .k-sell { background-color: #fee2e2; color: #b91c1c; }
    .k-hold { background-color: #f1f5f9; color: #475569; }
    
    /* Buttons styling */
    .stButton > button {
        border-radius: 12px;
        font-weight: 600;
        transition: all 0.2s;
    }
    .stButton > button:hover {
        border-color: #0f172a;
        color: #0f172a;
    }
    
    /* Metric styling */
    [data-testid="stMetricValue"] {
        font-size: 1.8rem !important;
        font-weight: 800 !important;
    }
    </style>
    """, unsafe_allow_html=True)

# 2. Skanner-motor
@st.cache_data(ttl=3600)
def get_analysis(ticker):
    try:
        df = yf.download(ticker, period="1y", interval="1d", progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        if df.empty or len(df) < 50: return None
        
        # Indikatorer
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        
        if pd.isna(df['RSI'].iloc[-1]): return None
        
        last_close = float(df['Close'].iloc[-1])
        last_rsi = float(df['RSI'].iloc[-1])
        last_sma20 = float(df['SMA20'].iloc[-1])
        last_sma50 = float(df['SMA50'].iloc[-1])
        prev_close = float(df['Close'].iloc[-2])
        prev_sma20 = float(df['SMA20'].iloc[-2])
        
        buy_signal = (last_rsi < 55) and (last_close > last_sma20) and (prev_close <= prev_sma20)
        sell_signal = (last_rsi > 70) or (last_close < last_sma20 and prev_close >= prev_sma20)
        
        returns_3m = (last_close / df['Close'].iloc[-60]) - 1 if len(df) >= 60 else (last_close / df['Close'].iloc[0]) - 1
        score = (returns_3m * 50) + (25 if 40 < last_rsi < 60 else 0) + (10 if last_close > last_sma50 else -10)
        
        return {
            "df": df,
            "ticker": ticker,
            "pris": round(last_close, 2),
            "endring": round(((last_close - prev_close) / prev_close) * 100, 2),
            "rsi": round(last_rsi, 1),
            "score": round(score, 1),
            "trend": "Bullish" if last_close > last_sma50 else "Bearish",
            "signal": "BUY" if buy_signal else "SELL" if sell_signal else "HOLD"
        }
    except:
        return None

# 3. Datahenting
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "BGBIO.OL", "TEL.OL", "ORK.OL", "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", 
    "EQNR.OL", "YAR.OL", "NHY.OL", "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", 
    "PGS.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", "ACSB.OL", "LSG.OL", "SALM.OL", 
    "BAKK.OL", "TOM.OL", "GRIEG.OL", "ELK.OL", "MPCC.OL", "KOG.OL", "BORR.OL", 
    "RANA.OL", "SCATC.OL", "AZT.OL", "VOW.OL", "ACC.OL", "OKEA.OL", "HAFNI.OL", 
    "BELCO.OL", "2020.OL", "KOA.OL", "BWE.OL"
]

results = []
with st.spinner('🏝️ Oppdaterer markedskart...'):
    for t in watchlist:
        data = get_analysis(t)
        if data: results.append(data)

if not results:
    st.error("Kunne ikke hente data. Sjekk internett.")
    st.stop()

df_res = pd.DataFrame([{k: v for k, v in r.items() if k != 'df'} for r in results])
df_res = df_res.sort_values(by="score", ascending=False)

# 4. Sidebar Navigasjon
with st.sidebar:
    st.markdown('<p style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem;">🏝️ K-man Island</p>', unsafe_allow_html=True)
    
    # Finn index for gjeldende side
    page_options = ["🏠 Dashboard", "🔍 Markedsskanner", "📈 Dypanalyse"]
    current_idx = 0
    if st.session_state.current_page in page_options:
        current_idx = page_options.index(st.session_state.current_page)
    
    page = st.radio("Navigasjon", page_options, index=current_idx, label_visibility="collapsed")
    st.session_state.current_page = page
    
    st.markdown("---")
    st.markdown("### Hurtigvalg")
    selected_from_list = st.selectbox("Velg aksje:", df_res['ticker'].tolist(), index=df_res['ticker'].tolist().index(st.session_state.selected_ticker))
    if selected_from_list != st.session_state.selected_ticker:
        st.session_state.selected_ticker = selected_from_list
        st.rerun()
    
    st.markdown("---")
    st.caption(f"Sist oppdatert: {datetime.now().strftime('%H:%M:%S')}")

# 5. Hovedinnhold
if "🏠" in page:
    # Header
    st.markdown('<p class="k-header">Velkommen til Island Intelligence</p>', unsafe_allow_html=True)
    st.markdown('<p class="k-sub">Strategisk oversikt over Oslo Børs</p>', unsafe_allow_html=True)

    # Top Cards Row
    st.markdown("### 🏆 Top Opportunities")
    top_cols = st.columns(3)
    for i in range(3):
        row = df_res.iloc[i]
        with top_cols[i]:
            st.markdown(f"""
            <div class="k-card">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <p style="color: #64748b; font-size: 0.875rem; font-weight: 600; margin-bottom: 0;">#{i+1} RANK</p>
                        <p style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0;">{row['ticker']}</p>
                    </div>
                    <span class="k-badge k-{row['signal'].lower()}">{row['signal']}</span>
                </div>
                <div style="margin-top: 1rem;">
                    <p style="font-size: 2rem; font-weight: 800; margin-bottom: 0;">{row['pris']} <span style="font-size: 1rem; color: #64748b;">NOK</span></p>
                    <p style="color: {'#15803d' if row['endring'] >= 0 else '#b91c1c'}; font-weight: 700; font-size: 0.875rem;">
                        {'▲' if row['endring'] >= 0 else '▼'} {abs(row['endring'])}%
                    </p>
                </div>
                <div style="margin-top: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
                    <p style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">K-SCORE: {row['score']}</p>
                </div>
            </div>
            """, unsafe_allow_html=True)
            if st.button(f"Analyser {row['ticker']}", key=f"btn_{row['ticker']}"):
                st.session_state.selected_ticker = row['ticker']
                # Navigate to deep dive - in Streamlit we can just use session state to change view
                st.session_state.current_page = "📈 Dypanalyse"
                st.rerun()

    # Stats Summary
    st.markdown("### 📊 Markedsstatus")
    s1, s2, s3, s4 = st.columns(4)
    with s1:
        st.metric("Kjøpssignaler", len(df_res[df_res['signal'] == 'BUY']))
    with s2:
        st.metric("Salgssignaler", len(df_res[df_res['signal'] == 'SELL']))
    with s3:
        st.metric("Trend: Bullish", len(df_res[df_res['trend'] == 'Bullish']))
    with s4:
        st.metric("Trend: Bearish", len(df_res[df_res['trend'] == 'Bearish']))

elif "🔍" in page:
    st.markdown('<p class="k-header">Markedsskanner</p>', unsafe_allow_html=True)
    st.markdown('<p class="k-sub">Sanntidsfiltrering av taktiske signaler</p>', unsafe_allow_html=True)
    
    # Filter
    f1, f2 = st.columns([1, 3])
    with f1:
        sig_filter = st.multiselect("Filtrer på signal:", ["BUY", "SELL", "HOLD"], default=["BUY", "SELL"])
    
    filtered_df = df_res[df_res['signal'].isin(sig_filter)] if sig_filter else df_res
    
    # Table
    st.dataframe(
        filtered_df[['ticker', 'pris', 'endring', 'rsi', 'score', 'trend', 'signal']],
        use_container_width=True,
        height=600,
        column_config={
            "ticker": "Ticker",
            "pris": st.column_config.NumberColumn("Pris", format="%.2f NOK"),
            "endring": st.column_config.NumberColumn("Endring (%)", format="%.2f%%"),
            "rsi": "RSI (14)",
            "score": "K-Score",
            "trend": "Trend",
            "signal": "Signal"
        }
    )

elif "📈" in page:
    st.markdown(f'<p class="k-header">{st.session_state.selected_ticker} Dypanalyse</p>', unsafe_allow_html=True)
    st.markdown('<p class="k-sub">Teknisk gjennomgang og signalbekreftelse</p>', unsafe_allow_html=True)
    
    selected_data = next(item for item in results if item["ticker"] == st.session_state.selected_ticker)
    df_plot = selected_data['df'].tail(150)
    
    # Info Row
    i1, i2, i3, i4 = st.columns(4)
    i1.metric("Siste Pris", f"{selected_data['pris']} NOK", f"{selected_data['endring']}%")
    i2.metric("RSI (14)", selected_data['rsi'])
    i3.metric("K-Score", selected_data['score'])
    with i4:
        st.markdown(f"""
        <div style="text-align: center; padding: 10px;">
            <p style="margin:0; font-size: 0.75rem; font-weight: 700; color: #64748b;">SIGNAL</p>
            <span class="k-badge k-{selected_data['signal'].lower()}" style="font-size: 1.25rem; padding: 10px 20px;">{selected_data['signal']}</span>
        </div>
        """, unsafe_allow_html=True)

    # Chart
    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, 
                       vertical_spacing=0.08, 
                       row_width=[0.3, 0.7])

    fig.add_trace(go.Candlestick(
        x=df_plot.index, open=df_plot['Open'], high=df_plot['High'], 
        low=df_plot['Low'], close=df_plot['Close'], name="Pris"
    ), row=1, col=1)
    
    fig.add_trace(go.Scatter(x=df_plot.index, y=df_plot['SMA20'], name="SMA 20", line=dict(color='#3b82f6', width=1.5)), row=1, col=1)
    fig.add_trace(go.Scatter(x=df_plot.index, y=df_plot['SMA50'], name="SMA 50", line=dict(color='#f59e0b', width=2)), row=1, col=1)

    fig.add_trace(go.Scatter(x=df_plot.index, y=df_plot['RSI'], name="RSI", fill='tozeroy', line=dict(color='#8b5cf6', width=2)), row=2, col=1)
    fig.add_hline(y=70, line_dash="dash", line_color="#ef4444", row=2, col=1)
    fig.add_hline(y=30, line_dash="dash", line_color="#10b981", row=2, col=1)

    fig.update_layout(
        height=700, 
        xaxis_rangeslider_visible=False, 
        template="plotly_white",
        margin=dict(l=0, r=0, t=30, b=0),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    st.plotly_chart(fig, use_container_width=True)
    
    # Analysis Verdict
    st.markdown("### 📝 Vurdering")
    if selected_data['signal'] == "BUY":
        st.success(f"**KJØP:** {st.session_state.selected_ticker} viser et sterkt momentum-breakout. Prisen har brutt over SMA20, og RSI er fortsatt i et sunt område ({selected_data['rsi']}).")
    elif selected_data['signal'] == "SELL":
        st.error(f"**SELG:** {st.session_state.selected_ticker} viser tegn til utmattelse eller trendbrudd. Vurder gevinstsikring eller stop-loss.")
    else:
        st.info(f"**HOLD:** {st.session_state.selected_ticker} er i en nøytral fase. Ingen klare tekniske triggere for øyeblikket.")

st.markdown("---")
st.caption("© 2026 K-man Island Intelligence | Strategiske taktiske signaler for Oslo Børs")
