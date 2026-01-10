import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd

# 1. Konfigurasjon og Stil
st.set_page_config(page_title="K-man Island", layout="wide")
st.markdown("""
    <style>
    .stApp { background-color: #FFFFFF; }
    [data-testid="stMetric"] { background-color: #f8fafc; border-radius: 15px; padding: 20px; border: 1px solid #e2e8f0; }
    h1 { color: #0e7490; font-family: 'Helvetica Neue', sans-serif; font-weight: 800; }
    </style>
    """, unsafe_allow_html=True)

st.title("🏝️ K-man Island")
st.subheader("Tactical Portfolio Intelligence with Buy/Sell Signals")

# 2. Skanner-motor med signal-logikk
def get_analysis(ticker):
    try:
        df = yf.download(ticker, period="1y", interval="1d", progress=False)
        
        # Håndter MultiIndex kolonner fra yfinance
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        if df.empty or len(df) < 50: 
            return None
        
        # Indikatorer for signaler
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        
        # Sjekk for NaN-verdier
        if pd.isna(df['RSI'].iloc[-1]) or pd.isna(df['SMA20'].iloc[-1]) or pd.isna(df['SMA50'].iloc[-1]):
            return None
        
        last_close = float(df['Close'].iloc[-1])
        last_rsi = float(df['RSI'].iloc[-1])
        last_sma20 = float(df['SMA20'].iloc[-1])
        last_sma50 = float(df['SMA50'].iloc[-1])
        
        # Enkel Signal-logikk:
        # BUY hvis RSI er lav (<50) og pris bryter over SMA20
        buy_signal = False
        sell_signal = False
        
        if len(df) >= 2:
            prev_close = df['Close'].iloc[-2]
            prev_sma20 = df['SMA20'].iloc[-2]
            
            # Sjekk at vi har gyldige verdier
            if not pd.isna(prev_close) and not pd.isna(prev_sma20):
                buy_signal = (last_rsi < 50) and (last_close > last_sma20) and (prev_close <= prev_sma20)
                sell_signal = (last_rsi > 70) or (last_close < last_sma20 and prev_close >= prev_sma20)

        # K-Score (Momentum + Timing)
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
            "rsi": last_rsi,
            "score": round(score, 1),
            "trend": "UP" if last_close > last_sma50 else "DOWN",
            "signal": "BUY" if buy_signal else "SELL" if sell_signal else "HOLD"
        }
    except Exception as e:
        # Prøv alternativ metode hvis første feiler
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
            
            buy_signal = False
            sell_signal = False
            
            if len(df) >= 2:
                prev_close = df['Close'].iloc[-2]
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
                "rsi": last_rsi,
                "score": round(score, 1),
                "trend": "UP" if last_close > last_sma50 else "DOWN",
                "signal": "BUY" if buy_signal else "SELL" if sell_signal else "HOLD"
            }
        except:
            return None

# 3. Den store Watchlisten din
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "BGBIO.OL", "TEL.OL", "ORK.OL", "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", 
    "EQNR.OL", "YAR.OL", "NHY.OL", "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", 
    "PGS.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", "ACSB.OL", "LSG.OL", "SALM.OL", 
    "BAKK.OL", "TOM.OL", "GRIEG.OL", "SBANK.OL", "HREC.OL", "ELK.OL", "MPCC.OL",
    "KOG.OL", "BORR.OL", "RANA.OL", "SCATC.OL", "AZT.OL", "VOW.OL", "ACC.OL",
    "PRAWN.OL", "OKEA.OL", "HAFNI.OL", "BELCO.OL", "2020.OL", "KOA.OL", "BWE.OL"
]

# 4. Kjøring og Visning
results = []
with st.spinner('K-man skanner Oslo Børs...'):
    for t in watchlist:
        data = get_analysis(t)
        if data: results.append(data)

if results:
    df_res = pd.DataFrame([{k: v for k, v in r.items() if k != 'df'} for r in results])
    df_res = df_res.sort_values(by="score", ascending=False)
    
    # Vis informasjon om markedsstatus
    st.info("ℹ️ Viser data fra siste handelsdag. Data kan være fra forrige handelsdag hvis børsen er stengt.")
    
    # Vis topp 10 tabellen
    st.header("🎯 Top 10 Opportunities")
    st.table(df_res.head(10))
    
    # 5. Interaktiv Graf med Piler
    st.sidebar.header("Signal Detaljer")
    target = st.sidebar.selectbox("Velg aksje for signaler:", df_res['ticker'].tolist())
    
    # Finn dataene for valgt aksje
    try:
        selected_data = next(item for item in results if item["ticker"] == target)
        plot_df = selected_data['df'].tail(100)
        
        # Sjekk at vi har nok data
        if plot_df.empty or len(plot_df) < 2:
            st.warning(f"Ingen tilstrekkelig data for {target}")
        else:
            fig = go.Figure()
            fig.add_trace(go.Candlestick(
                x=plot_df.index, 
                open=plot_df['Open'], 
                high=plot_df['High'], 
                low=plot_df['Low'], 
                close=plot_df['Close'], 
                name="Pris"
            ))
            
            # Legg til Buy/Sell piler (forenklet visning)
            if selected_data['signal'] == "BUY":
                st.success(f"🚀 KJØPSSIGNAL identifisert for {target}")
            elif selected_data['signal'] == "SELL":
                st.warning(f"⚠️ SALGSSIGNAL/GEVINSTSIKRING for {target}")
            else:
                st.info(f"📊 HOLD signal for {target} - Ingen sterk trend identifisert")

            fig.update_layout(
                title=f"{target} - Analyse", 
                xaxis_rangeslider_visible=False, 
                template="plotly_white", 
                height=600
            )
            st.plotly_chart(fig, use_container_width=True)
    except StopIteration:
        st.warning(f"Kunne ikke finne data for valgt aksje")
    except Exception as e:
        st.error(f"Feil ved visning av data: {str(e)}")
else:
    st.warning("⚠️ **Kunne ikke hente markedsdata**")
    st.info("""
    **Mulige årsaker:**
    - Børsen er stengt (helg, kveld eller helligdag)
    - Nettverksproblem eller API-rate limiting
    - Ingen gyldig data tilgjengelig
    
    **Løsning:** Prøv å oppdatere siden om noen minutter eller sjekk internettforbindelsen.
    Data vises fra siste handelsdag når børsen er stengt.
    """)

st.caption("Data leveres av yfinance. Signaler er taktiske indikatorer og ikke finansiell rådgivning.")