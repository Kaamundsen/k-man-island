import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd

# 1. UI Oppsett
st.set_page_config(page_title="K-man Island v8", layout="wide")
st.markdown("""
    <style>
    .stApp { background-color: #f8fafc; }
    .card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-left: 5px solid #3b82f6; margin-bottom: 20px; }
    .buy-card { border-left-color: #10b981; }
    .sell-card { border-left-color: #ef4444; }
    h1, h2, h3 { color: #1e293b; font-family: 'Inter', sans-serif; }
    </style>
    """, unsafe_allow_html=True)

st.title("🏝️ K-man Island v8")
st.subheader("Your Personal AI-Powered Trading Edge")

# 2. Den fulle watchlisten din (Viktig!)
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", "EQNR.OL", "YAR.OL", "NHY.OL", 
    "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", 
    "LSG.OL", "SALM.OL", "BAKK.OL", "TOM.OL", "KOG.OL", "BORR.OL", "OKEA.OL"
]

# 3. Data-motor
@st.cache_data(ttl=600)
def get_data(tickers):
    results = []
    for t in tickers:
        try:
            df = yf.download(t, period="1y", interval="1d", progress=False)
            if df.empty: continue
            
            # Beregninger
            close = df['Close'].iloc[-1]
            rsi = ta.rsi(df['Close'], length=14).iloc[-1]
            sma20 = ta.sma(df['Close'], length=20).iloc[-1]
            sma50 = ta.sma(df['Close'], length=50).iloc[-1]
            
            # Logikk for signaler
            signal = "WATCH"
            if rsi < 55 and close > sma20 and close > sma50: signal = "BUY"
            elif rsi > 70 or close < sma20: signal = "SELL"
            
            results.append({
                "Ticker": t, "Pris": round(float(close), 2), 
                "RSI": round(float(rsi), 1), "Signal": signal, "df": df
            })
        except: continue
    return results

# 4. Visning
data = get_data(watchlist)

tab1, tab2, tab3 = st.tabs(["🚀 Dashboard", "📊 Market Scanner", "🔍 Deep Dive"])

with tab1:
    st.markdown("### Top Opportunities")
    buy_stocks = [d for d in data if d['Signal'] == "BUY"]
    if buy_stocks:
        cols = st.columns(3)
        for i, stock in enumerate(buy_stocks[:3]):
            with cols[i]:
                st.markdown(f"""
                <div class="card buy-card">
                    <h3>{stock['Ticker']}</h3>
                    <p style="font-size: 24px; font-weight: bold;">{stock['Pris']} NOK</p>
                    <p style="color: #10b981;">🚀 SIGNAL: BUY</p>
                    <p>RSI: {stock['RSI']}</p>
                </div>
                """, unsafe_allow_html=True)
    else:
        st.info("Søker etter nye kjøpssignaler...")

with tab2:
    if data:
        df_display = pd.DataFrame([{k: v for k, v in d.items() if k != 'df'} for d in data])
        st.dataframe(df_display, use_container_width=True)

with tab3:
    selected = st.selectbox("Velg aksje for analyse:", [d['Ticker'] for d in data])
    s_data = next(item for item in data if item["Ticker"] == selected)
    
    st.markdown(f"### Handelsplan for {selected}")
    col1, col2 = st.columns(2)
    col1.metric("Anbefalt inngang", f"{s_data['Pris']} NOK")
    col2.metric("Stop Loss (ca -3.5%)", f"{round(s_data['Pris'] * 0.965, 2)} NOK")
    
    st.plotly_chart(go.Figure(data=[go.Candlestick(x=s_data['df'].index[-60:], open=s_data['df']['Open'][-60:], high=s_data['df']['High'][-60:], low=s_data['df']['Low'][-60:], close=s_data['df']['Close'][-60:])]), use_container_width=True)
    