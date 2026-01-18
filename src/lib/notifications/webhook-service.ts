// Webhook-tjeneste for Telegram og Discord varsler

export interface WebhookConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  discordWebhookUrl?: string;
}

export interface AlertMessage {
  type: 'buy' | 'sell' | 'stoploss' | 'target' | 'news' | 'info';
  ticker?: string;
  title: string;
  message: string;
  url?: string;
  value?: number;
  change?: number;
}

// Emoji-mapping for meldingstyper
const TYPE_EMOJIS: Record<string, string> = {
  buy: '🟢',
  sell: '🔴',
  stoploss: '⚠️',
  target: '🎯',
  news: '📰',
  info: 'ℹ️',
};

// Formater melding for Telegram (Markdown)
function formatTelegramMessage(alert: AlertMessage): string {
  const emoji = TYPE_EMOJIS[alert.type] || '📢';
  let text = `${emoji} *${alert.title}*\n\n`;
  
  if (alert.ticker) {
    text += `📈 Ticker: \`${alert.ticker}\`\n`;
  }
  
  text += alert.message;
  
  if (alert.value !== undefined) {
    text += `\n💰 Verdi: ${alert.value.toLocaleString('nb-NO')} kr`;
  }
  
  if (alert.change !== undefined) {
    const changeSign = alert.change >= 0 ? '+' : '';
    text += `\n📊 Endring: ${changeSign}${alert.change.toFixed(2)}%`;
  }
  
  if (alert.url) {
    text += `\n\n[Se mer →](${alert.url})`;
  }
  
  return text;
}

// Formater melding for Discord (embed)
function formatDiscordEmbed(alert: AlertMessage): object {
  const colors: Record<string, number> = {
    buy: 0x10B981,    // Grønn
    sell: 0xEF4444,   // Rød
    stoploss: 0xF59E0B, // Gul
    target: 0x8B5CF6,  // Lilla
    news: 0x3B82F6,    // Blå
    info: 0x6B7280,    // Grå
  };
  
  const embed: Record<string, unknown> = {
    title: `${TYPE_EMOJIS[alert.type]} ${alert.title}`,
    description: alert.message,
    color: colors[alert.type] || 0x6B7280,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'K-man Island',
    },
    fields: [] as Array<{ name: string; value: string; inline: boolean }>,
  };
  
  if (alert.ticker) {
    (embed.fields as Array<{ name: string; value: string; inline: boolean }>).push({
      name: '📈 Ticker',
      value: `\`${alert.ticker}\``,
      inline: true,
    });
  }
  
  if (alert.value !== undefined) {
    (embed.fields as Array<{ name: string; value: string; inline: boolean }>).push({
      name: '💰 Verdi',
      value: `${alert.value.toLocaleString('nb-NO')} kr`,
      inline: true,
    });
  }
  
  if (alert.change !== undefined) {
    const changeSign = alert.change >= 0 ? '+' : '';
    (embed.fields as Array<{ name: string; value: string; inline: boolean }>).push({
      name: '📊 Endring',
      value: `${changeSign}${alert.change.toFixed(2)}%`,
      inline: true,
    });
  }
  
  if (alert.url) {
    embed.url = alert.url;
  }
  
  return embed;
}

// Send til Telegram
export async function sendTelegramMessage(
  alert: AlertMessage,
  botToken?: string,
  chatId?: string
): Promise<boolean> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chat) {
    console.warn('⚠️ Telegram not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)');
    return false;
  }
  
  try {
    const text = formatTelegramMessage(alert);
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    
    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

// Send til Discord
export async function sendDiscordMessage(
  alert: AlertMessage,
  webhookUrl?: string
): Promise<boolean> {
  const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
  
  if (!url) {
    console.warn('⚠️ Discord not configured (missing DISCORD_WEBHOOK_URL)');
    return false;
  }
  
  try {
    const embed = formatDiscordEmbed(alert);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Discord send error:', error);
    return false;
  }
}

// Send til alle konfigurerte kanaler
export async function broadcastAlert(
  alert: AlertMessage,
  config?: WebhookConfig
): Promise<{ telegram: boolean; discord: boolean }> {
  const [telegramResult, discordResult] = await Promise.all([
    sendTelegramMessage(alert, config?.telegramBotToken, config?.telegramChatId),
    sendDiscordMessage(alert, config?.discordWebhookUrl),
  ]);
  
  return {
    telegram: telegramResult,
    discord: discordResult,
  };
}

// Ferdig-definerte varselmeldinger
export const AlertTemplates = {
  buySignal: (ticker: string, kScore: number, price: number): AlertMessage => ({
    type: 'buy',
    ticker,
    title: 'Kjøpssignal!',
    message: `${ticker} har utløst et kjøpssignal med K-Score ${kScore}.`,
    value: price,
    url: `http://localhost:3000/analyse/${ticker}`,
  }),
  
  sellSignal: (ticker: string, reason: string, change: number): AlertMessage => ({
    type: 'sell',
    ticker,
    title: 'Salgssignal',
    message: `${ticker}: ${reason}`,
    change,
    url: `http://localhost:3000/analyse/${ticker}`,
  }),
  
  stopLossTriggered: (ticker: string, stopPrice: number, currentPrice: number): AlertMessage => ({
    type: 'stoploss',
    ticker,
    title: 'Stop-Loss Utløst!',
    message: `${ticker} har falt under stop-loss på ${stopPrice} kr. Nåværende pris: ${currentPrice} kr.`,
    value: currentPrice,
    change: ((currentPrice - stopPrice) / stopPrice) * 100,
    url: `http://localhost:3000/portefolje`,
  }),
  
  targetReached: (ticker: string, targetPrice: number, currentPrice: number): AlertMessage => ({
    type: 'target',
    ticker,
    title: 'Kursmål Nådd! 🎉',
    message: `${ticker} har nådd kursmålet på ${targetPrice} kr!`,
    value: currentPrice,
    url: `http://localhost:3000/analyse/${ticker}`,
  }),
  
  dailySummary: (portfolioValue: number, change: number): AlertMessage => ({
    type: 'info',
    title: 'Daglig Oppsummering',
    message: `Porteføljeverdi: ${portfolioValue.toLocaleString('nb-NO')} kr`,
    value: portfolioValue,
    change,
    url: 'http://localhost:3000/rapport',
  }),
  
  newsAlert: (ticker: string, headline: string): AlertMessage => ({
    type: 'news',
    ticker,
    title: 'Viktig Nyhet',
    message: headline,
    url: `http://localhost:3000/analyse/${ticker}`,
  }),
};
