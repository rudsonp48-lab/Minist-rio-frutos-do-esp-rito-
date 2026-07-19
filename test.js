async function run() {
  const url = 'https://www.youtube.com/@igrejafrutosdoespiritomfe/streams';
  const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
  };
  const response = await fetch(url, { headers });
  const html = await response.text();
  const match = html.match(/ytInitialData\s*=\s*({.*?});/);
  if (match) {
     const json = JSON.parse(match[1]);
     console.log("Found JSON with keys:", Object.keys(json));
     const contents = json?.contents?.twoColumnBrowseResultsRenderer?.tabs;
     console.log("Has tabs:", !!contents);
     // print the first video
  } else {
     console.log("Not found");
  }
}
run();
