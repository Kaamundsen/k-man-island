// Email-varsler tjeneste
// Støtter Resend, SendGrid, eller SMTP

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'smtp';
  apiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface DailyReportData {
  date: string;
  portfolioValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  topMovers: Array<{
    ticker: string;
    name: string;
    change: number;
    changePercent: number;
  }>;
  alerts: Array<{
    type: 'buy' | 'sell' | 'stoploss' | 'target';
    ticker: string;
    message: string;
  }>;
  buyRecommendations: Array<{
    ticker: string;
    name: string;
    kScore: number;
    signal: string;
  }>;
}

// Generer HTML for daglig rapport
export function generateDailyReportEmail(data: DailyReportData): EmailTemplate {
  const isPositive = data.dailyChangePercent >= 0;
  const changeColor = isPositive ? '#10B981' : '#EF4444';
  const changeSign = isPositive ? '+' : '';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 30px; }
    .stat-box { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .stat-box h3 { margin: 0 0 10px; color: #64748b; font-size: 12px; text-transform: uppercase; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1e293b; }
    .stat-change { font-size: 16px; font-weight: 600; }
    .section { margin-top: 30px; }
    .section h2 { font-size: 18px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .stock-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .stock-name { font-weight: 600; color: #1e293b; }
    .stock-meta { color: #64748b; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #d1fae5; color: #059669; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
    .footer { background: #1e293b; color: white; padding: 20px; text-align: center; font-size: 12px; }
    .footer a { color: #10B981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 K-man Island</h1>
      <p>Daglig Porteføljerapport - ${data.date}</p>
    </div>
    
    <div class="content">
      <div class="stat-box">
        <h3>Porteføljeverdi</h3>
        <div class="stat-value">${data.portfolioValue.toLocaleString('nb-NO')} kr</div>
        <div class="stat-change" style="color: ${changeColor}">
          ${changeSign}${data.dailyChange.toLocaleString('nb-NO')} kr (${changeSign}${data.dailyChangePercent.toFixed(2)}%)
        </div>
      </div>
      
      ${data.alerts.length > 0 ? `
      <div class="section">
        <h2>⚠️ Varsler (${data.alerts.length})</h2>
        ${data.alerts.map(alert => `
          <div class="stock-row">
            <div>
              <div class="stock-name">${alert.ticker}</div>
              <div class="stock-meta">${alert.message}</div>
            </div>
            <span class="badge ${alert.type === 'buy' ? 'badge-green' : alert.type === 'sell' ? 'badge-red' : 'badge-blue'}">
              ${alert.type.toUpperCase()}
            </span>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <div class="section">
        <h2>🔥 Dagens bevegelser</h2>
        ${data.topMovers.map(stock => `
          <div class="stock-row">
            <div>
              <div class="stock-name">${stock.ticker}</div>
              <div class="stock-meta">${stock.name}</div>
            </div>
            <span style="color: ${stock.changePercent >= 0 ? '#10B981' : '#EF4444'}; font-weight: 600;">
              ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
            </span>
          </div>
        `).join('')}
      </div>
      
      ${data.buyRecommendations.length > 0 ? `
      <div class="section">
        <h2>💡 Kjøpsanbefalinger</h2>
        ${data.buyRecommendations.map(stock => `
          <div class="stock-row">
            <div>
              <div class="stock-name">${stock.ticker}</div>
              <div class="stock-meta">${stock.name}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-green">K-Score: ${stock.kScore}</span>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>Generert av K-man Island Investment Dashboard</p>
      <p><a href="http://localhost:3000">Åpne Dashboard →</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  const text = `
K-man Island - Daglig Rapport (${data.date})

Porteføljeverdi: ${data.portfolioValue.toLocaleString('nb-NO')} kr
Endring i dag: ${changeSign}${data.dailyChange.toLocaleString('nb-NO')} kr (${changeSign}${data.dailyChangePercent.toFixed(2)}%)

${data.alerts.length > 0 ? `VARSLER:\n${data.alerts.map(a => `- ${a.ticker}: ${a.message}`).join('\n')}\n` : ''}

DAGENS BEVEGELSER:
${data.topMovers.map(s => `- ${s.ticker}: ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`).join('\n')}

${data.buyRecommendations.length > 0 ? `KJØPSANBEFALINGER:\n${data.buyRecommendations.map(s => `- ${s.ticker} (K-Score: ${s.kScore})`).join('\n')}` : ''}
  `.trim();
  
  return {
    subject: `📈 K-man Island: ${isPositive ? '+' : ''}${data.dailyChangePercent.toFixed(2)}% i dag`,
    html,
    text,
  };
}

// Send email via Resend
async function sendViaResend(to: string, template: EmailTemplate, apiKey: string, fromEmail: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Resend email error:', error);
    return false;
  }
}

// Hovedfunksjon for å sende email
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  config?: Partial<EmailConfig>
): Promise<boolean> {
  const provider = config?.provider || process.env.EMAIL_PROVIDER || 'resend';
  const apiKey = config?.apiKey || process.env.EMAIL_API_KEY;
  const fromEmail = config?.fromEmail || process.env.EMAIL_FROM || 'noreply@k-man-island.no';
  
  if (!apiKey) {
    console.warn('⚠️ No email API key configured. Email not sent.');
    console.log('Would send email to:', to);
    console.log('Subject:', template.subject);
    return false;
  }
  
  switch (provider) {
    case 'resend':
      return sendViaResend(to, template, apiKey, fromEmail);
    default:
      console.warn(`Email provider "${provider}" not implemented`);
      return false;
  }
}

// Send daglig rapport
export async function sendDailyReport(to: string, data: DailyReportData): Promise<boolean> {
  const template = generateDailyReportEmail(data);
  return sendEmail(to, template);
}
