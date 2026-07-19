function extractVideos(obj) {
  const videos = [];
  
  function traverse(item) {
    if (!item || typeof item !== "object") return;
    
    const r = item.videoRenderer || item.playlistVideoRenderer || item.compactVideoRenderer || item.gridVideoRenderer;
    const lvm = item.lockupViewModel;
    
    if (r) {
      const videoId = r.videoId;
      const title = r.title?.runs?.[0]?.text || r.title?.simpleText;
      const thumbnail = r.thumbnail?.thumbnails?.[0]?.url;
      const author = r.ownerText?.runs?.[0]?.text || r.shortBylineText?.runs?.[0]?.text || r.longBylineText?.runs?.[0]?.text;
      
      if (videoId && title) {
        videos.push({
          id: videoId,
          title,
          thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          author: author || "YouTube"
        });
      }
    } else if (lvm && lvm.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
      const videoId = lvm.contentId;
      const title = lvm.metadata?.lockupMetadataViewModel?.title?.content;
      // You can also extract thumbnails and authors from lvm
      const thumbnail = lvm.image?.contentImageViewModel?.image?.sources?.[0]?.url;
      const author = lvm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content;
      
      if (videoId && title) {
        videos.push({
          id: videoId,
          title,
          thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          author: author || "YouTube"
        });
      }
    }
    
    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        traverse(item[key]);
      }
    }
  }
  
  traverse(obj);
  
  // deduplicate by id
  return videos.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
}

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
     console.log(extractVideos(json).slice(0, 5));
  } else {
     console.log("Not found");
  }
}
run();
