import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# 1. Inspirerende UI/UX Konfigurasjon
st.set_page_config(page_title="K-man Island v8", layout="wide", initial_sidebar_state="collapsed")

# Egendefinert CSS for et friskt, moderne og intuitivt design
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
    
    html, body, [class*="st-"] { font-family: 'Poppins', sans-serif; color: #333; }
    .main { background: linear-gradient(to bottom right, #e0f2f7, #f0f8ff); } /* Lys og luftig bakgrunn */

    /* Dashboard Cards */
    .dashboard-card {
        background: #ffffff;
        border-radius: 15px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08); /* Myk skygge */
        padding: 25px;
        transition: all 0.3s ease-in-out;
        cursor: pointer;
        border: 1px solid transparent;
    }
    .dashboard-card:hover { 
        transform: translateY(-5px); 
        box-shadow: 0 12px 30px rgba(0,0,0,0.12);
        border-color: #4CAF50; /* Grønn ramme ved hover */
    }
    .card-title { font-size: 20px; font-weight: 700; color: #2c3e50; margin-bottom: 5px; }
    .card-price { font-size: 32px; font-weight: 700; color: #1abc9c; margin-bottom: 10px; }
    .card-change { font-size: 18px; font-weight: 600; }
    .card-signal { font-size: 16px; font-weight: 600; padding: 5px 10px; border-radius: 8px; margin-top: 10px; display: inline-block; }
    
    /* Trade Plan Box */
    .trade-plan-box {
        background: linear-gradient(45deg, #e8f5e9, #ffffff);
        border-left: 6px solid #4CAF50; /* Klar grønn for handling */
        padding: 25px;
        border-radius: 12px;
        margin-top: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .trade-plan-box h4 { color: #2e7d32; margin-bottom: 15px; }
    .trade-plan-box p { margin: 5px 0; font-size: 15px; line-height: 1.6; }
    .trade-plan-box b { color: #2c3e50; }

    /* Signal Colors */
    .signal-buy { background-color: #e8f5e9; color: #2e7d32; } /* Lys grønn */
    .signal-sell { background-color: #ffebee; color: #c62828; } /* Lys rød */
    .signal-watch { background-color: #fffde7; color: #f9a825; } /* Lys gul */

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] { gap: 15px; }
    .stTabs [data-baseweb="tab"] { 
        height: 45px; white-space: pre-wrap; background-color: #f0f4f8; 
        border-radius: 10px 10px 0 0; color: #555; padding: 10px 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stTabs [data-baseweb="tab"]:hover { color: #2e7d32; }
    .stTabs [aria-selected="true"] { 
        background-color: #ffffff; color: #2e7d32; border-bottom: 3px solid #2e7d32; 
        box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
    }
    </style>
    """, unsafe_allow_html=True)

# 2. Data Motor for Smart Analyse
@st.cache_data(ttl=300) # Cacher data for 5 minutter for lynrask oppdatering
def get_intelligent_analysis(tickers):
    all_data = []
    for t in tickers:
        try:
            df = yf.download(t, period="1y", interval="1d", progress=False)
            if df.empty or len(df) < 60: continue # Trenger minst 60 dager for SMA50 og momentum

            # Tekniske Beregninger
            df['RSI'] = ta.rsi(df['Close'], length=14)
            df['SMA20'] = ta.sma(df['Close'], length=20)
            df['SMA50'] = ta.sma(df['Close'], length=50)
            df['EMA12'] = ta.ema(df['Close'], length=12)
            df['EMA26'] = ta.ema(df['Close'], length=26)
            df['ATR'] = ta.atr(df['High'], df['Low'], df['Close'], length=14)
            df['Volume_SMA20'] = df['Volume'].rolling(20).mean()

            last = df.iloc[-1]
            prev = df.iloc[-2]

            # Avansert Signal Logikk (Konsekvent og streng)
            signal = "WATCH"
            if (last['RSI'] < 55 and last['Close'] > last['SMA20'] and last['Close'] > last['SMA50'] and
                last['EMA12'] > last['EMA26'] and ((last['Close'] / prev['Close']) - 1) > 0 and 
                last['Volume'] > (1.2 * last['Volume_SMA20'])): # Volumeksplosjon
                signal = "BUY"
            elif (last['RSI'] > 75 or last['Close'] < last['SMA20'] or last['Close'] < last['SMA50']):
                signal = "SELL"
            
            # Handelsplan Beregninger
            entry_price = last['Close']
            stop_loss = round(entry_price - (last['ATR'] * 2.5), 2) # Litt større SL enn før
            target_price = round(entry_price * 1.15, 2) # Første target 15% opp
            potential_gain_percent = round(((target_price - entry_price) / entry_price) * 100, 1)
            potential_loss_percent = round(((entry_price - stop_loss) / entry_price) * 100, 1)

            # K-Score (Vekter BUY-signal og straffer høy RSI)
            momentum_3m = ((last['Close'] / df['Close'].iloc[-60]) - 1) * 100
            k_score = (momentum_3m * 0.7) # Mer vekt på momentum
            if signal == "BUY": k_score += 50 # Stor bonus for BUY-signal
            if last['RSI'] > 65: k_score -= 100 # Stor straff for høy RSI

            # Kortfattet Analyse Tekst
            analysis_text = f"Aksjen viser en sterk oppadgående trend, bekreftet av pris over både SMA20 og SMA50. RSI er på et sunt nivå ({last['RSI']:.1f}) som indikerer rom for videre vekst. Et nylig 'golden cross' på EMA-linjene og et økende volum støtter kjøpssignalet. Dette er en ideell setting for et swingtrade over de neste ukene."
            if signal == "SELL": analysis_text = f"Advarsel: Aksjen viser svakhet. RSI er overkjøpt ({last['RSI']:.1f}) eller prisen har brutt viktige støttenivåer (SMA20/SMA50). Vurder gevinstsikring eller salg."
            if signal == "WATCH": analysis_text = f"Aksjen er i en konsolideringsfase eller mangler sterke signaler. Overvåk nøye for trendbrudd eller økende volum som kan gi et fremtidig kjøpssignal."


            all_data.append({
                "Ticker": t, "Pris": round(last['Close'], 2), 
                "Endring_Dag": round(((last['Close'] / prev['Close']) - 1) * 100, 2),
                "RSI": round(last['RSI'], 1), "K-Score": round(k_score, 1),
                "Signal": signal, "Trend": "Bullish" if is_bullish else "Bearish",
                "StopLoss_Kr": stop_loss, "Target_Kr": target_price,
                "Potensiell_Gevinst_%": potential_gain_percent,
                "Potensiell_Tap_%": potential_loss_percent,
                "Analyse_Tekst": analysis_text,
                "df": df # Full dataframe for grafer
            })
        except Exception as e:
            # st.error(f"Feil ved henting av {t}: {e}") # Debugging
            continue
    return all_data

# 3. Sidebar for Watchlist (Få aksjer for å holde oversikten)
st.sidebar.image("https://www.flaticon.com/svg/static/icons/svg/3070/3070440.svg", width=100)
st.sidebar.title("K-man Island")
st.sidebar.markdown("---")
active_watchlist = ["NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", "FRO.OL", "GOGL.OL", "NAS.OL", "KOG.OL", "BORR.OL", "MPCC.OL", "IDEX.OL", "VOW.OL", "OKEA.OL"]
selected_assets = st.sidebar.multiselect("Dine overvåkede aksjer:", active_watchlist, default=active_watchlist[:5])

# 4. Hoved-Dashboard (Friske Faner og Visuell Info)
st.title("🏝️ K-man Island v8")
st.subheader("Your Personal AI-Powered Trading Edge")

if not selected_assets:
    st.info("Velg aksjer i sidemenyen for å starte analysen.")
else:
    all_analysis_data = get_intelligent_analysis(selected_assets)
    
    # Sorterer data for Top Opportunities
    top_opportunities = sorted([d for d in all_analysis_data if d['Signal'] == 'BUY'], key=lambda x: x['K-Score'], reverse=True)[:3]

    tab1, tab2, tab3 = st.tabs(["🚀 Dashboard", "📊 Market Scanner", "🔍 Deep Dive Analysis"])

    with tab1:
        st.header("✨ Top Opportunities Right Now")
        if top_opportunities:
            cols = st.columns(len(top_opportunities))
            for i, stock in enumerate(top_opportunities):
                with cols[i]:
                    signal_class = f"signal-{stock['Signal'].lower()}"
                    st.markdown(f"""
                        <div class="dashboard-card {signal_class}">
                            <div class="card-title">{stock['Ticker']}</div>
                            <div class="card-price">{stock['Pris']:.2f} NOK</div>
                            <div class="card-change" style="color: {'#2e7d32' if stock['Endring_Dag'] > 0 else '#c62828'};">
                                {stock['Endring_Dag']:.2f}% {("▲" if stock['Endring_Dag'] > 0 else "▼")}
                            </div>
                            <div class="card-signal {signal_class}">Signal: {stock['Signal']}</div>
                            <p style="font-size: 14px; margin-top: 10px;">Potensiell Gevinst: <b>{stock['Potensiell_Gevinst_%']:.1f}%</b></p>
                            <p style="font-size: 14px;">Potensiell Tap: <b>{stock['Potensiell_Tap_%']:.1f}%</b></p>
                        </div>
                    """, unsafe_allow_html=True)
        else:
            st.info("Ingen klare 'BUY'-signaler funnet i din watchlist akkurat nå. Overvåk videre.")
            
        st.header("📈 Din Overvåkingsliste")
        watch_stocks = sorted([d for d in all_analysis_data if d['Signal'] == 'WATCH'], key=lambda x: x['K-Score'], reverse=True)
        if watch_stocks:
            watch_cols = st.columns(min(len(watch_stocks), 4)) # Vis maks 4 i bredden
            for i, stock in enumerate(watch_stocks):
                if i < 4: # Begrens til første rad for å holde oversikten
                    with watch_cols[i]:
                        st.markdown(f"""
                            <div class="dashboard-card signal-watch">
                                <div class="card-title">{stock['Ticker']}</div>
                                <div class="card-price">{stock['Pris']:.2f} NOK</div>
                                <div class="card-change" style="color: {'#2e7d32' if stock['Endring_Dag'] > 0 else '#c62828'};">
                                    {stock['Endring_Dag']:.2f}% {("▲" if stock['Endring_Dag'] > 0 else "▼")}
                                </div>
                                <div class="card-signal signal-watch">Signal: {stock['Signal']}</div>
                            </div>
                        """, unsafe_allow_html=True)
        else:
            st.info("Ingen aksjer på overvåkingslisten. Systemet er klart for å finne nye muligheter!")


    with tab2:
        st.header("📊 Detaljert Markeds Skanner")
        if all_analysis_data:
            df_scanner = pd.DataFrame([{k: v for k, v in d.items() if k not in ['df', 'Analyse_Tekst']} for d in all_analysis_data])
            df_scanner = df_scanner.sort_values(by="K-Score", ascending=False)
            
            st.dataframe(df_scanner, use_container_width=True)
        else:
            st.warning("Ingen data å vise i skanneren.")

    with tab3:
        st.header("🔍 Dypdykk & Handelsplan")
        if all_analysis_data:
            ticker_options = [d['Ticker'] for d in all_analysis_data]
            selected_ticker_detail = st.selectbox("Velg aksje for dyp analyse:", ticker_options)
            
            selected_stock_data = next(d for d in all_analysis_data if d['Ticker'] == selected_ticker_detail)

            # Handelsplan boks
            st.markdown(f"""
                <div class="trade-plan-box">
                    <h4>HANDELSPLAN FOR {selected_stock_data['Ticker']}</h4>
                    <p><b>Strategi:</b> Swingtrade ({'2-8 uker'})</p>
                    <p><b>Inngang:</b> {selected_stock_data['Pris']:.2f} NOK</p>
                    <p><b>Stop Loss:</b> {selected_stock_data['StopLoss_Kr']:.2f} NOK (ca. -{selected_stock_data['Potensiell_Tap_%']:.1f}%)</p>
                    <p><b>Mål:</b> {selected_stock_data['Target_Kr']:.2f} NOK (ca. +{selected_stock_data['Potensiell_Gevinst_%']:.1f}%)</p>
                    <p><b>Risiko/Belønning:</b> {(selected_stock_data['Target_Kr'] - selected_stock_data['Pris']) / (selected_stock_data['Pris'] - selected_stock_data['StopLoss_Kr']):.1f}x</p>
                </div>
            """, unsafe_allow_html=True)
            
            st.subheader("Kort Analyse:")
            st.write(selected_stock_data['Analyse_Tekst'])

            st.subheader("Prisutvikling & Signaler")
            fig = go.Figure(data=[go.Candlestick(x=selected_stock_data['df'].index[-120:],
                                                open=selected_stock_data['df']['Open'][-120:],
                                                high=selected_stock_data['df']['High'][-120:],
                                                low=selected_stock_data['df']['Low'][-120:],
                                                close=selected_stock_data['df']['Close'][-120:],
                                                name="Candlesticks")])
            # Legg til Stop Loss og Target på grafen
            fig.add_hline(y=selected_stock_data['StopLoss_Kr'], line_dash="dash", line_color="#c62828", annotation_text="Stop Loss", annotation_position="bottom right")
            fig.add_hline(y=selected_stock_data['Target_Kr'], line_dash="dash", line_color="#2e7d32", annotation_text="Target", annotation_position="top right")

            fig.update_layout(template="plotly_white", height=550, xaxis_rangeslider_visible=False)
            st.plotly_chart(fig, use_container_width=True)

            st.subheader("Nyheter & Innsidehandel")
            st.info("Integrasjon for eksterne nyhetsfeeds og sanntids innsidehandel er komplekst og vil kreve en egen API-løsning. For nå, sjekk alltid **Newsweb.no** for siste børsmeldinger om relevante selskaper for internkjøp (se etter 'primærinnsider'). En økning på 10%+ i eierandel er et sterkt signal!")
        else:
            st.info("Velg en aksje for dyp analyse fra listen.")