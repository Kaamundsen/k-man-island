import { Newspaper, ExternalLink } from 'lucide-react';

interface NewsItem {
  title: string;
  date: string;
  source: string;
  url: string;
}

interface NewsWidgetProps {
  ticker: string;
}

export default function NewsWidget({ ticker }: NewsWidgetProps) {
  // Mock news data - in production this would come from an API
  const mockNews: NewsItem[] = [
    {
      title: `${ticker}: Melding om tildeling av opsjoner til ansatte`,
      date: '2 timer siden',
      source: 'Newsweb',
      url: 'https://newsweb.oslobors.no'
    },
    {
      title: `Analytikere oppjusterer kursmål for ${ticker}`,
      date: '1 dag siden',
      source: 'E24',
      url: '#'
    },
    {
      title: `${ticker} - Kvartalsrapport overgår forventningene`,
      date: '3 dager siden',
      source: 'DN',
      url: '#'
    },
  ];

  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <Newspaper className="w-5 h-5 text-brand-slate" />
        <h3 className="text-xl font-bold text-brand-slate">Siste Nyheter</h3>
      </div>

      <div className="space-y-4">
        {mockNews.map((news, index) => (
          <a
            key={index}
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-brand-slate mb-2 group-hover:text-brand-emerald transition-colors">
                  {news.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>📅 {news.date}</span>
                  <span>•</span>
                  <span>📰 {news.source}</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            </div>
          </a>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-bold text-brand-slate mb-3">Eksterne kilder</h4>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://newsweb.oslobors.no/search?issuer=${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-brand-slate text-white rounded-lg text-sm font-semibold hover:bg-brand-slate/90 transition-colors"
          >
            📊 Newsweb
          </a>
          <a
            href={`https://www.e24.no/sok?q=${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            📰 E24
          </a>
          <a
            href={`https://www.dn.no/sok/?query=${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            📈 DN
          </a>
        </div>
      </div>
    </div>
  );
}
