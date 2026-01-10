import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd

# 1. K-man Island Theme & Config
st.set_page_config(page_title="K-man Island", layout="wide")

st.markdown("""
    <style>
    .stApp { background-color: #FFFFFF; }
    [data-testid="stMetric"] {
        background-color: #ffffff;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        border: 1px solid #f0f2f6;
    }
    h1 { color: #0e7490; font-family: 'Helvetica Neue', sans-serif; font-weight: 800; }
    </style>
    """, unsafe_allow_html=True)

st.title("🏝️ K-man Island")
st.subheader("Tactical Intelligence Terminal")

# 2. Funksjon for å hente data
@st.cache_data(ttl=3600)
def get_data(ticker):
    try:
        df = yf.download(ticker, period="1y", interval="1d")
        if df.empty: return None
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        return df
    except:
        return None

# 3. Scanner-logikk for Oslo Børs (Eksempelutvalg)
# Her kan vi senere legge inn en komplett liste over alle 300 aksjer
market_watch = ["NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", "BGBIO.OL", "TEL.OL", "ORK.OL"]

st.sidebar.header("K-man Controls")
selected = st.sidebar.selectbox("Fokuser på objekt:", market_watch)

# 4. Hovedvisning for valgt aksje
df = get_data(selected)
if df is not None:
    col1, col2, col3 = st.columns(3)
    curr = df['Close'].iloc[-1]
    rsi = df['RSI'].iloc[-1]
    
    col1.metric("Kurs", f"{curr:.2f} NOK")
    col2.metric("RSI (Timing)", f"{rsi:.1f}", "Billig" if rsi < 40 else "Dyr" if rsi > 70 else "Nøytral")
    col3.metric("K-Score", f"{int(100-rsi)}/100") # Enkel foreløpig score

    fig = go.Figure()
    fig.add_trace(go.Candlestick(x=df.index, open=df['Open'], high=df['High'], low=df['Low'], close=df['Close'], name="Pris"))
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA50'], line=dict(color='#0e7490', width=2), name="Trend (50D)"))
    fig.update_layout(plot_bgcolor='white', paper_bgcolor='white', height=500, xaxis_rangeslider_visible=False)
    st.plotly_chart(fig, use_container_width=True)

# 5. Top 10 Rangering
st.markdown("---")
st.header("🎯 K-man Top 10 Watchlist")
scan_data = []
for t in market_watch:
    d = get_data(t)
    if d is not None:
        scan_data.append({
            "Ticker": t,
            "Pris": d['Close'].iloc[-1],
            "RSI": d['RSI'].iloc[-1],
            "Trend": "OPP" if d['Close'].iloc[-1] > d['SMA50'].iloc[-1] else "NED"
        })
st.table(pd.DataFrame(scan_data))