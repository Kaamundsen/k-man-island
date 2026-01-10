import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd

# 1. K-man Island Style
st.set_page_config(page_title="K-man Island", layout="wide")
st.markdown("""
    <style>
    .stApp { background-color: #FFFFFF; }
    [data-testid="stMetric"] { background-color: #f8fafc; border-radius: 15px; padding: 20px; border: 1px solid #e2e8f0; }
    h1 { color: #0e7490; font-family: 'Helvetica Neue', sans-serif; font-weight: 800; }
    </style>
    """, unsafe_allow_html=True)

st.title("🏝️ K-man Island")
st.subheader("Tactical Portfolio Intelligence")

# 2. Skanner-motor (Her definerer vi vinner-kriteriene)
def get_k_score(ticker):
    try:
        df = yf.download(ticker, period="6mo", interval="1d", progress=False)
        if len(df) < 50: return None
        
        # Algoritmen:
        rsi = ta.rsi(df['Close'], length=14).iloc[-1]
        returns_3m = (df['Close'].iloc[-1] / df['Close'].iloc[-60]) - 1
        vol_ratio = df['Volume'].iloc[-5:].mean() / df['Volume'].rolling(20).mean().iloc[-1]
        
        # K-Score logikk (Vi vil ha momentum + ok RSI)
        score = (returns_3m * 50) + (vol_ratio * 10)
        if 30 < rsi < 55: score += 20 # Bonus for "sweet spot" timing
        
        return {
            "Ticker": ticker, 
            "Pris": round(float(df['Close'].iloc[-1]), 2),
            "RSI": round(float(rsi), 1), 
            "K-Score": round(float(score), 1),
            "Trend": "UP" if df['Close'].iloc[-1] > ta.sma(df['Close'], length=50).iloc[-1] else "DOWN"
        }
    except:
        return None

# 3. Listen over aksjer vi vil overvåke (Vi kan legge til alle på OB senere)
watchlist = ["NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", "BGBIO.OL", "TEL.OL", "ORK.OL", "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL"]

# 4. Kjør skanneren
st.header("🎯 K-man Top 10 Opportunities")
with st.spinner('Skanner markedet for Alpha...'):
    results = []
    for t in watchlist:
        res = get_k_score(t)
        if res: results.append(res)
    
    # Sorter etter høyest score
    df_results = pd.DataFrame(results).sort_values(by="K-Score", ascending=False)

# Vis topp 10 i en pen tabell
st.table(df_results.head(10))

# 5. Detaljert innsyn
st.sidebar.header("Island Navigator")
selected_stock = st.sidebar.selectbox("Gå dypere i aksje:", df_results['Ticker'].tolist())

# (Her legger du inn graf-koden vi hadde i forrige app.py)