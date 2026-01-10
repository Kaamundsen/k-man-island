import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from datetime import datetime

# 1. Konfigurasjon og Lys Stil (mer “spenstig”)
st.set_page_config(
    page_title="K-man Island | Strategic Intelligence",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS – lys fintech stil med tydelige faner
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
    .main { background: linear-gradient(180deg, #f8fbff 0%, #f1f5f9 40%, #f8fbff 100%); }
    .stApp { color: #0f172a; }
    /* Hero card */
    .hero {
        background: linear-gradient(120deg, rgba(14,165,233,0.15), rgba(168,85,247,0.18));
        border: 1px solid #dbeafe;
        border-radius: 18px;
        padding: 18px 20px;
        box-shadow: 0 15px 40px rgba(59,130,246,0.12);
    }
    /* Metric Cards */
    [data-testid="stMetric"] {
        background: white;
        border-radius: 14px;
        padding: 18px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 8px 20px -6px rgba(15,23,42,0.18);
    }
    /* Headings */
    .main-header { font-size: 2.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; margin: 0 0 0.25rem 0; }
    .sub-header  { font-size: 1.05rem; color: #475569; margin-bottom: 0; }
    /* Signal Badges */
    .badge { padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.02em; }
    .badge-buy { background-color: #dcfce7; color: #166534; }
    .badge-sell { background-color: #fee2e2; color: #991b1b; }
    .badge-hold { background-color: #e0f2fe; color: #075985; }
    /* Tabs – gjør dem tydelige og luftige */
    .stTabs [data-baseweb="tab-list"] { gap: 16px; border-bottom: 1px solid #e2e8f0; }
    .stTabs [data-baseweb="tab"] {
        height: 52px; white-space: pre-wrap; font-weight: 700; font-size: 1rem;
        color: #334155; border-radius: 12px 12px 0 0; padding: 10px 16px;
    }
    .stTabs [aria-selected="true"] {
        background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-bottom: 2px solid white;
        box-shadow: 0 -2px 8px rgba(15,23,42,0.08);
    }
    /* Tables */
    .stDataFrame { border-radius: 12px; overflow: hidden; }
    .stDataFrame table { color: #0f172a; }
    .stDataFrame thead th { background: #e2e8f0 !important; }
    .stDataFrame td, .stDataFrame th { border-color: #e2e8f0 !important; }
    </style>
    """, unsafe_allow_html=True)

# 2. Skanner-motor med caching for ytelse
@st.cache_data(ttl=3600) # Casher i 1 time
def get_analysis(ticker):
    try:
        # Henter data
        df = yf.download(ticker, period="1y", interval="1d", progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        if df.empty or len(df) < 50: 
            return None
        
        # Beregn Indikatorer
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        df['EMA20'] = ta.ema(df['Close'], length=20)
        
        # Sjekk for gyldige verdier
        if pd.isna(df['RSI'].iloc[-1]): return None
        
        last_close = float(df['Close'].iloc[-1])
        last_rsi = float(df['RSI'].iloc[-1])
        last_sma20 = float(df['SMA20'].iloc[-1])
        last_sma50 = float(df['SMA50'].iloc[-1])
        prev_close = float(df['Close'].iloc[-2])
        prev_sma20 = float(df['SMA20'].iloc[-2])
        
        # Signal Logikk
        buy_signal = (last_rsi < 55) and (last_close > last_sma20) and (prev_close <= prev_sma20)
        sell_signal = (last_rsi > 70) or (last_close < last_sma20 and prev_close >= prev_sma20)
        
        # K-Score (Momentum + RSI optimalisering)
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

# 3. Watchlist
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "BGBIO.OL", "TEL.OL", "ORK.OL", "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", 
    "EQNR.OL", "YAR.OL", "NHY.OL", "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", 
    "PGS.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", "ACSB.OL", "LSG.OL", "SALM.OL", 
    "BAKK.OL", "TOM.OL", "GRIEG.OL", "ELK.OL", "MPCC.OL", "KOG.OL", "BORR.OL", 
    "RANA.OL", "SCATC.OL", "AZT.OL", "VOW.OL", "ACC.OL", "OKEA.OL", "HAFNI.OL", 
    "BELCO.OL", "2020.OL", "KOA.OL", "BWE.OL"
]

# 4. App Header
with st.container():
    col_header, col_status = st.columns([3, 1])
    with col_header:
        st.markdown(
            f"""
            <div class="hero">
                <div class="main-header">🏝️ K-man Island</div>
                <div class="sub-header">Tactical Portfolio Intelligence & Advanced Signal Scanner</div>
            </div>
            """,
            unsafe_allow_html=True
        )
    with col_status:
        st.info(f"Oslo Børs • Oppdatert: {datetime.now().strftime('%H:%M:%S')}")

# 5. Scanning prosess
results = []
with st.spinner('K-man skanner markedet for muligheter...'):
    for t in watchlist:
        data = get_analysis(t)
        if data: results.append(data)

if results:
    df_res = pd.DataFrame([{k: v for k, v in r.items() if k != 'df'} for r in results])
    df_res = df_res.sort_values(by="score", ascending=False)

    # 6. Tabs layout
    tab1, tab2, tab3 = st.tabs(["📊 Dashboard", "🔍 Market Scanner", "📈 Deep Dive Analysis"])

    with tab1:
        # Topp muligheter cards
        st.markdown("### Top Ranked Opportunities")
        top_3 = df_res.head(3)
        cols = st.columns(3)
        for i, (idx, row) in enumerate(top_3.iterrows()):
            with cols[i]:
                st.metric(
                    label=f"#{i+1} {row['ticker']}", 
                    value=f"{row['pris']} NOK", 
                    delta=f"{row['endring']}%",
                    help=f"K-Score: {row['score']}"
                )
                st.markdown(f"**Signal:** {row['signal']} | **Trend:** {row['trend']}")

        st.markdown("---")
        # Oversikt over signaler
        c1, c2, c3 = st.columns(3)
        buys = len(df_res[df_res['signal'] == 'BUY'])
        sells = len(df_res[df_res['signal'] == 'SELL'])
        c1.metric("Kjøpssignaler", buys, delta=None)
        c2.metric("Salgssignaler", sells, delta=None)
        c3.metric("Analyserte Aksjer", len(df_res), delta=None)

    with tab2:
        st.markdown("### Market Scanner Results")
        
        # Formatering av tabellen
        def color_signal(val):
            if val == 'BUY': return 'color: #166534; font-weight: bold'
            if val == 'SELL': return 'color: #991b1b; font-weight: bold'
            return 'color: #475569'

        display_df = df_res[['ticker', 'pris', 'endring', 'rsi', 'score', 'trend', 'signal']].copy()
        st.dataframe(
            display_df.style.applymap(color_signal, subset=['signal']),
            use_container_width=True,
            height=600
        )

    with tab3:
        st.sidebar.markdown("---")
        st.sidebar.header("Deep Dive Settings")
        target = st.sidebar.selectbox("Velg aksje for dypanalyse:", df_res['ticker'].tolist())
        
        selected_data = next(item for item in results if item["ticker"] == target)
        df_plot = selected_data['df'].tail(150)
        
        # Avansert Plotly Graf
        fig = make_subplots(rows=2, cols=1, shared_xaxes=True, 
                           vertical_spacing=0.1, subplot_titles=(f'{target} Pris & SMA', 'RSI (14)'),
                           row_width=[0.3, 0.7])

        # Candlestick
        fig.add_trace(go.Candlestick(
            x=df_plot.index, open=df_plot['Open'], high=df_plot['High'], 
            low=df_plot['Low'], close=df_plot['Close'], name="Pris"
        ), row=1, col=1)
        
        # SMA Lines
        fig.add_trace(go.Scatter(x=df_plot.index, y=df_plot['SMA20'], name="SMA 20", line=dict(color='blue', width=1)), row=1, col=1)
        fig.add_trace(go.Scatter(x=df_plot.index, y=df_plot['SMA50'], name="SMA 50", line=dict(color='orange', width=1.5)), row=1, col=1)

        # RSI
        fig.add_trace(go.Scatter(x=df_plot.index, y=df_plot['RSI'], name="RSI", line=dict(color='purple', width=1.5)), row=2, col=1)
        fig.add_hline(y=70, line_dash="dash", line_color="red", row=2, col=1)
        fig.add_hline(y=30, line_dash="dash", line_color="green", row=2, col=1)
        fig.add_hrect(y0=30, y1=70, fillcolor="gray", opacity=0.1, row=2, col=1)

        fig.update_layout(height=800, xaxis_rangeslider_visible=False, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)
        
        # Info box under grafen
        col_inf1, col_inf2 = st.columns(2)
        with col_inf1:
            if selected_data['signal'] == "BUY":
                st.success(f"🚀 **KJØPSSIGNAL identifisert!** {target} bryter opp gjennom SMA20 med RSI på {selected_data['rsi']}.")
            elif selected_data['signal'] == "SELL":
                st.error(f"⚠️ **SALGSSIGNAL/GEVINSTSIKRING!** {target} viser svakhet eller er overkjøpt (RSI: {selected_data['rsi']}).")
            else:
                st.info(f"📊 **HOLD status.** {target} konsoliderer eller mangler bekreftet breakout.")
        
        with col_inf2:
            st.markdown(f"""
            **Tekniske Nøkkeltall for {target}:**
            - Siste lukkekurs: **{selected_data['pris']} NOK**
            - RSI (14): **{selected_data['rsi']}**
            - K-Score: **{selected_data['score']}**
            - Trend: **{selected_data['trend']}**
            """)

else:
    st.error("Kunne ikke hente markedsdata for øyeblikket. Vennligst prøv igjen senere.")

st.markdown("---")
st.caption("© 2026 K-man Island Intelligence. Data levert av yfinance. Alle signaler er kun til informasjonsformål.")
