import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime


# Page config
st.set_page_config(
    page_title="K-man Island",
    page_icon="🏝️",
    layout="wide",
)

# Global style
st.markdown(
    """
    <style>
    :root {
        --bg: #0b1224;
        --card: #111a33;
        --card-2: #0f172a;
        --accent: #22d3ee;
        --accent-2: #a855f7;
        --text: #e2e8f0;
        --muted: #94a3b8;
        --success: #22c55e;
        --warning: #f59e0b;
        --danger: #ef4444;
    }
    .stApp {
        background: radial-gradient(circle at 10% 20%, #112143 0%, #0b1224 35%, #0b1224 100%);
        color: var(--text);
    }
    h1, h2, h3, h4, h5, h6 {
        color: #f8fafc !important;
        font-family: "Inter", "Helvetica Neue", sans-serif;
        letter-spacing: -0.03em;
    }
    .k-card {
        background: linear-gradient(145deg, rgba(17,26,51,0.9), rgba(15,23,42,0.92));
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 18px;
        padding: 18px 18px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.35);
    }
    .k-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 12px;
        background: rgba(255,255,255,0.05);
        color: var(--muted);
        font-size: 13px;
        border: 1px solid rgba(255,255,255,0.08);
    }
    .metric-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }
    .metric-card {
        flex: 1 1 180px;
        background: var(--card);
        border-radius: 16px;
        padding: 14px 16px;
        border: 1px solid rgba(255,255,255,0.06);
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    }
    .metric-label { color: var(--muted); font-size: 13px; }
    .metric-value { color: #f8fafc; font-size: 24px; font-weight: 700; }
    .metric-sub { color: var(--muted); font-size: 12px; }
    .stDataFrame { border-radius: 12px; overflow: hidden; }
    .stDataFrame table { color: var(--text); }
    .stDataFrame thead th { background: #0f172a !important; }
    .stDataFrame td, .stDataFrame th { border-color: rgba(255,255,255,0.04) !important; }
    .sidebar .sidebar-content { background: var(--card-2); }
    </style>
    """,
    unsafe_allow_html=True,
)


# --- Data utilities ---------------------------------------------------------
def fetch_stock(ticker: str):
    """
    Download 1y daily data with sensible defaults and fallbacks.
    Returns a DataFrame or None.
    """
    try:
        df = yf.download(ticker, period="1y", interval="1d", auto_adjust=True, progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        if df.empty or len(df) < 40:
            return None
        return df
    except Exception:
        return None


def analyze_ticker(ticker: str):
    df = fetch_stock(ticker)
    if df is None or df.empty:
        return None

    df["RSI"] = ta.rsi(df["Close"], length=14)
    df["SMA20"] = ta.sma(df["Close"], length=20)
    df["SMA50"] = ta.sma(df["Close"], length=50)

    # Ensure indicators exist
    if any(col not in df or df[col].isna().all() for col in ["RSI", "SMA20", "SMA50"]):
        return None

    last_close = float(df["Close"].iloc[-1])
    last_rsi = float(df["RSI"].iloc[-1])
    last_sma20 = float(df["SMA20"].iloc[-1])
    last_sma50 = float(df["SMA50"].iloc[-1])

    buy_signal = False
    sell_signal = False
    if len(df) >= 2:
        prev_close = df["Close"].iloc[-2]
        prev_sma20 = df["SMA20"].iloc[-2]
        if not pd.isna(prev_close) and not pd.isna(prev_sma20):
            buy_signal = (last_rsi < 50) and (last_close > last_sma20) and (prev_close <= prev_sma20)
            sell_signal = (last_rsi > 70) or (last_close < last_sma20 and prev_close >= prev_sma20)

    if len(df) >= 60:
        old_price = float(df["Close"].iloc[-60])
    else:
        old_price = float(df["Close"].iloc[0])
    returns_3m = (last_close / old_price) - 1
    score = (returns_3m * 50) + (20 if 35 < last_rsi < 55 else 0)

    return {
        "df": df,
        "ticker": ticker,
        "pris": round(last_close, 2),
        "rsi": round(last_rsi, 1),
        "score": round(score, 1),
        "trend": "UP" if last_close > last_sma50 else "DOWN",
        "signal": "BUY" if buy_signal else "SELL" if sell_signal else "HOLD",
    }


def analyze_watchlist(watchlist):
    results = []
    for t in watchlist:
        res = analyze_ticker(t)
        if res:
            results.append(res)
    return results


# --- Watchlist --------------------------------------------------------------
WATCHLIST = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL",
    "BGBIO.OL", "TEL.OL", "ORK.OL", "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL",
    "EQNR.OL", "YAR.OL", "NHY.OL", "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL",
    "PGS.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", "ACSB.OL", "LSG.OL", "SALM.OL",
    "BAKK.OL", "TOM.OL", "GRIEG.OL", "SBANK.OL", "HREC.OL", "ELK.OL", "MPCC.OL",
    "KOG.OL", "BORR.OL", "RANA.OL", "SCATC.OL", "AZT.OL", "VOW.OL", "ACC.OL",
    "PRAWN.OL", "OKEA.OL", "HAFNI.OL", "BELCO.OL", "2020.OL", "KOA.OL", "BWE.OL",
]


# --- UI ---------------------------------------------------------------------
st.markdown(
    """
    <div class="k-card" style="padding: 20px; margin-bottom: 18px; background: linear-gradient(120deg, rgba(34,211,238,0.12), rgba(168,85,247,0.10));">
      <div style="display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <div class="k-badge">🏝️ K-man Island · Tactical Signals</div>
          <h1 style="margin: 6px 0 4px 0;">Strategic Portfolio Intelligence</h1>
          <p style="color: var(--muted); margin: 0;">Taktiske kjøp/selg-signaler, momentum-score og rask markedsstatus.</p>
        </div>
        <div style="display:flex; gap: 8px; flex-wrap: wrap;">
          <div class="k-badge">⚡ Real-time pulling via yfinance</div>
          <div class="k-badge">📊 Oslo Børs watchlist</div>
          <div class="k-badge">🎯 Signals & Momentum</div>
        </div>
      </div>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.spinner("K-man skanner Oslo Børs..."):
    results = analyze_watchlist(WATCHLIST)

if not results:
    st.warning("⚠️ Ingen data funnet. Prøv igjen litt senere eller sjekk nettverk.")
    st.info(
        "Typiske årsaker: børsen er stengt (helg/helligdag), midlertidig API-problem, eller ingen datapunkter tilgjengelig."
    )
    st.caption("Data leveres av yfinance. Signaler er ikke finansiell rådgivning.")
    st.stop()

# Prepare dataframe for table
df_res = pd.DataFrame([{k: v for k, v in r.items() if k != "df"} for r in results])
df_res = df_res.sort_values(by="score", ascending=False).reset_index(drop=True)
top_pick = df_res.iloc[0]

# Market status info
st.markdown(
    f"""
    <div class="k-card" style="margin-bottom:12px; display:flex; gap:14px; align-items:center;">
        <div style="width:10px; height:10px; border-radius:50%; background: #22c55e; box-shadow:0 0 10px rgba(34,197,94,0.8);"></div>
        <div>
            <div style="color: var(--muted); font-size:13px;">Sist oppdatert</div>
            <div style="color:#f8fafc; font-weight:700;">{datetime.now().strftime("%Y-%m-%d %H:%M")} (viser siste handelsdag ved stengt børs)</div>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# Hero metrics
c1, c2, c3 = st.columns([1.2, 1, 1])
with c1:
    st.markdown(
        f"""
        <div class="k-card">
            <div class="metric-label">Top Opportunity</div>
            <div class="metric-value">{top_pick['ticker']}</div>
            <div class="metric-sub">Høyeste K-score i watchlisten</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with c2:
    st.markdown(
        f"""
        <div class="k-card">
            <div class="metric-label">K-Score</div>
            <div class="metric-value">{top_pick['score']}</div>
            <div class="metric-sub">Momentum + timing</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with c3:
    st.markdown(
        f"""
        <div class="k-card">
            <div class="metric-label">Signal</div>
            <div class="metric-value">{top_pick['signal']}</div>
            <div class="metric-sub">Trend: {top_pick['trend']}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("### 🎯 Top 12 Opportunities")
styled = (
    df_res.head(12)
    .style.hide(axis="index")
    .bar(subset=["score"], color="#22d3ee", vmin=df_res["score"].min(), vmax=df_res["score"].max())
    .applymap(lambda v: "color:#22c55e" if v == "BUY" else "color:#f59e0b" if v == "HOLD" else "color:#ef4444" if v == "SELL" else "")
)
st.dataframe(styled, use_container_width=True)

# Sidebar selection
st.sidebar.header("Signal-detaljer")
target = st.sidebar.selectbox("Velg aksje", df_res["ticker"].tolist(), index=0)
selected = next(item for item in results if item["ticker"] == target)
plot_df = selected["df"].tail(120).copy()

# Chart
fig = go.Figure()
fig.add_trace(
    go.Candlestick(
        x=plot_df.index,
        open=plot_df["Open"],
        high=plot_df["High"],
        low=plot_df["Low"],
        close=plot_df["Close"],
        name="Pris",
    )
)
fig.add_trace(go.Scatter(x=plot_df.index, y=plot_df["SMA20"], mode="lines", name="SMA20", line=dict(color="#22d3ee", width=1.4)))
fig.add_trace(go.Scatter(x=plot_df.index, y=plot_df["SMA50"], mode="lines", name="SMA50", line=dict(color="#a855f7", width=1.4)))

# Signal markers (last point)
last_idx = plot_df.index[-1]
last_price = plot_df["Close"].iloc[-1]
if selected["signal"] == "BUY":
    fig.add_trace(go.Scatter(x=[last_idx], y=[last_price], mode="markers+text", text=["BUY"], textposition="top center",
                             marker=dict(color="#22c55e", size=12, symbol="triangle-up")))
elif selected["signal"] == "SELL":
    fig.add_trace(go.Scatter(x=[last_idx], y=[last_price], mode="markers+text", text=["SELL"], textposition="bottom center",
                             marker=dict(color="#ef4444", size=12, symbol="triangle-down")))

fig.update_layout(
    title=f"{target} · Pris og signaler",
    template="plotly_dark",
    height=520,
    margin=dict(l=10, r=10, t=50, b=10),
    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0),
    xaxis_rangeslider_visible=False,
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
)
st.plotly_chart(fig, use_container_width=True)

# RSI mini strip
with st.expander("Se RSI og volumtrender", expanded=False):
    rsi_fig = go.Figure()
    rsi_fig.add_trace(go.Scatter(x=plot_df.index, y=plot_df["RSI"], mode="lines", name="RSI", line=dict(color="#22d3ee")))
    rsi_fig.add_hrect(y0=30, y1=70, fillcolor="rgba(255,255,255,0.06)", line_width=0)
    rsi_fig.update_layout(
        height=200,
        template="plotly_dark",
        margin=dict(l=10, r=10, t=30, b=10),
        yaxis=dict(range=[0, 100]),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(rsi_fig, use_container_width=True)

st.caption("Data leveres av yfinance. Signaler er taktiske indikatorer og ikke finansiell rådgivning.")
