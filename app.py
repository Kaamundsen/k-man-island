import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd

# 1. K-man Island Konfigurasjon
st.set_page_config(page_title="K-man Island", layout="wide")

st.markdown("""
    <style>
    .stApp { background-color: #FFFFFF; }
    [data-testid="stMetric"] { 
        background-color: #f8fafc; 
        border-radius: 15px; 
        padding: 20px; 
        border: 1px solid #e2e8f0; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    h1 { color: #0e7490; font-family: 'Helvetica Neue', sans-serif; font-weight: 800; letter-spacing: -1px; }
    .stTable { background-color: white; border-radius: 10px; overflow: hidden; }
    </style>
    """, unsafe_allow_html=True)

st.title("🏝️ K-man Island")
st.subheader("Strategic Portfolio Intelligence")

# 2. Skanner-motor (Forsterket for helg/stengt børs)
def get_k_score(ticker):
    try:
        # Henter data for det siste året for å ha nok historikk
        df = yf.download(ticker, period="1y", interval="1d", progress=False)
        
        if df.empty or len(df) < 50:
            return None
            
        # Finn siste gyldige lukkekurs (f.eks. fra fredag)
        last_close = float(df['Close'].iloc[-1])
        
        # Indikatorer
        rsi = ta.rsi(df['Close'], length=14).iloc[-1]
        sma50 = ta.sma(df['Close'], length=50).iloc[-1]
        
        # Beregn Momentum (Siste 3 måneder / 60 handelsdager)
        old_price = float(df['Close'].iloc[-60]) if len(df) > 60 else float(df['Close'].iloc[0])
        returns_3m = (last_close / old_price) - 1
        
        # Volum-analyse
        avg_vol = df['Volume'].rolling(20).mean().iloc[-1]
        curr_vol = df['Volume'].iloc[-5:].mean() # Snitt siste uke
        vol_ratio = curr_vol / avg_vol if avg_vol > 0 else 1
        
        # K-Score Algoritme (Siktet mot 100-200% caser)
        # Vi belønner positiv trend + moderat RSI (ikke overkjøpt) + økende volum
        score = (returns_3m * 50) + (vol_ratio * 15)
        if 35 < rsi < 55: score += 25 # "The Sweet Spot" for entry
        if last_close > sma50: score += 10 # Trend-bekreftelse
        
        return {
            "Ticker": ticker, 
            "Pris": round(last_close, 2),
            "RSI": round(float(rsi), 1), 
            "K-Score": round(float(score), 1),
            "Trend": "📈 UP" if last_close > sma50 else "📉 DOWN"
        }
    except Exception as e:
        return None

# 3. Watchlist (Dine utvalgte + noen volative OB-aksjer for test)
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", 
    "AKSO.OL", "NEL.OL", "BGBIO.OL", "TEL.OL", "ORK.OL", 
    "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", "EQNR.OL", "YAR.OL"
]

# 4. Hovedseksjon: Topplisten
st.header("🎯 K-man Top 10 Opportunities")

with st.spinner('Analyserer siste markedsdata fra Oslo Børs...'):
    results = []
    for t in watchlist:
        res = get_k_score(t)
        if res:
            results.append(res)
    
    if results:
        df_results = pd.DataFrame(results).sort_values(by="K-Score", ascending=False)
        
        # Vis Metrics for den øverste rangerte aksjen
        top_pick = df_results.iloc[0]
        c1, c2, c3 = st.columns(3)
        c1.metric("Top Island Pick", top_pick['Ticker'])
        c2.metric("K-Score", f"{top_pick['K-Score']}")
        c3.metric("Status", top_pick['Trend'])
        
        # Tabellen
        st.table(df_results.head(10))
        
        # 5. Detaljvisning i Sidebar
        st.sidebar.header("Island Navigator")
        selected_stock = st.sidebar.selectbox("Velg objekt for dypanalyse:", df_results['Ticker'].tolist())
        
        # Enkel graf for valgt aksje
        detail_df = yf.download(selected_stock, period="6mo", progress=False)
        fig = go.Figure()
        fig.add_trace(go.Candlestick(
            x=detail_df.index,
            open=detail_df['Open'], high=detail_df['High'],
            low=detail_df['Low'], close=detail_df['Close'],
            name=selected_stock
        ))
        fig.update_layout(
            title=f"Prisutvikling: {selected_stock}",
            plot_bgcolor='white',
            paper_bgcolor='white',
            xaxis_rangeslider_visible=False,
            height=450
        )
        st.plotly_chart(fig, use_container_width=True)
        
    else:
        st.error("Kunne ikke hente data. Sjekk internettforbindelsen eller prøv igjen senere.")

st.caption("Data leveres av yfinance. K-Score er en taktisk indikator og ikke finansiell rådgivning.")