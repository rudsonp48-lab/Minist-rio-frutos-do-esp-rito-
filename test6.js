async function run() {
  const url = 'https://www.youtube.com/@ministeriofrutodoespirito9132/streams';
  const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
  };
  const response = await fetch(url, { headers });
  const html = await response.text();
  const match = html.match(/ytInitialData\s*=\s*({.*?});/);
  if (match) {
     const json = JSON.parse(match[1]);
     const tabs = json?.contents?.twoColumnBrowseResultsRenderer?.tabs;
     const streamTab = tabs.find(t => t.tabRenderer?.title === 'Ao vivo' || t.tabRenderer?.title === 'Live' || t.tabRenderer?.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes('/streams'));
     const items = streamTab?.tabRenderer?.content?.richGridRenderer?.contents;
     console.log(JSON.stringify(items[0], null, 2));
  }
}
run();
