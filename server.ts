import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Resolve keys either from process.env or import.meta.env equivalents
const API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.VITE_YOUTUBE_CHANNEL_ID || process.env.YOUTUBE_CHANNEL_ID;

// Helper to scrape any YouTube page and extract video/playlist recommendations
function extractVideos(obj: any): any[] {
  const videos: any[] = [];
  
  function traverse(item: any) {
    if (!item || typeof item !== "object") return;
    
    const r = item.videoRenderer || item.playlistVideoRenderer || item.compactVideoRenderer;
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
          publishedAt: new Date().toISOString(),
          type: "video",
          author: author || "YouTube"
        });
      }
    } else {
      for (const key of Object.keys(item)) {
        traverse(item[key]);
      }
    }
  }
  
  traverse(obj);
  return videos;
}

// Scrape helper for standard search
async function scrapeYouTubeSearch(query: string): Promise<any[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const html = await response.text();
    const match = html.match(/ytInitialData\s*=\s*({.*?});/);
    if (!match) return [];
    
    const json = JSON.parse(match[1]);
    
    // Attempt precise extraction of actual search result videos to avoid sidebar recommendations
    const videos: any[] = [];
    try {
      const contents = json?.contents?.twoColumnSearchResultRenderer?.primaryContents?.sectionListRenderer?.contents;
      if (contents && Array.isArray(contents)) {
        for (const section of contents) {
          if (section.itemSectionRenderer?.contents) {
            for (const item of section.itemSectionRenderer.contents) {
              if (item.videoRenderer) {
                const r = item.videoRenderer;
                const videoId = r.videoId;
                const title = r.title?.runs?.[0]?.text || r.title?.simpleText;
                const thumbnail = r.thumbnail?.thumbnails?.[0]?.url;
                const author = r.ownerText?.runs?.[0]?.text || r.shortBylineText?.runs?.[0]?.text || r.longBylineText?.runs?.[0]?.text;
                if (videoId && title) {
                  videos.push({
                    id: videoId,
                    title,
                    thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    publishedAt: new Date().toISOString(),
                    type: "video",
                    author: author || "YouTube"
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Precise search extraction failed, using fallback:", e);
    }

    if (videos.length > 0) {
      return videos;
    }
    
    return extractVideos(json);
  } catch (error) {
    console.error("Error in scrapeYouTubeSearch:", error);
    return [];
  }
}

// Scrape channel live status (resolves when there is active live redirection)
async function scrapeYouTubeChannelLive(channelId: string): Promise<any[] | null> {
  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    const finalUrl = response.url;
    if (finalUrl.includes("watch?v=")) {
      const videoId = new URL(finalUrl).searchParams.get("v");
      if (videoId) {
        const html = await response.text();
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "Culto Ao Vivo";
        
        return [{
          id: videoId,
          title: title,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: new Date().toISOString(),
          type: "live",
          author: "Ecclesia Live"
        }];
      }
    }
    return [];
  } catch (error) {
    console.error("Error in scrapeYouTubeChannelLive:", error);
    return null;
  }
}

// Scrape related videos or playlist
async function scrapeYouTubePlaylist(playlistId: string): Promise<any[]> {
  try {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });
    const html = await response.text();
    const match = html.match(/ytInitialData\s*=\s*({.*?});/);
    if (!match) return [];
    
    const json = JSON.parse(match[1]);
    return extractVideos(json);
  } catch (error) {
    console.error("Error in scrapeYouTubePlaylist:", error);
    return [];
  }
}

async function scrapeYouTubeRelated(videoId: string): Promise<any[]> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });
    const html = await response.text();
    const match = html.match(/ytInitialData\s*=\s*({.*?});/);
    if (!match) return [];
    
    const json = JSON.parse(match[1]);
    return extractVideos(json);
  } catch (error) {
    console.error("Error in scrapeYouTubeRelated:", error);
    return [];
  }
}

// REST APIs
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Search API
app.get("/api/youtube-search", async (req, res) => {
  const query = (req.query.q as string) || "";
  if (!query) {
    return res.json([]);
  }

  // If API Key is present, try standard search, otherwise fall back to scraping
  if (API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          const videos = data.items
            .filter((item: any) => item.id?.videoId)
            .map((item: any) => ({
              id: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
              publishedAt: item.snippet.publishedAt,
              type: "video",
              author: item.snippet.channelTitle || "YouTube"
            }));
          return res.json(videos);
        }
      }
    } catch (apiError) {
      console.error("YouTube Search API failed, using scraper fallback:", apiError);
    }
  }

  // No API key or API failed - use high quality scraper!
  const scraped = await scrapeYouTubeSearch(query);
  res.json(scraped);
});

// Channel Live status check API
app.get("/api/youtube-live", async (req, res) => {
  const cId = (req.query.channelId as string) || CHANNEL_ID;
  if (!cId) {
    return res.json(null);
  }

  if (API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${cId}&type=video&eventType=live&key=${API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const liveVideos = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            publishedAt: item.snippet.publishedAt,
            type: "live",
            author: item.snippet.channelTitle || "Live"
          }));
          return res.json(liveVideos);
        }
      }
    } catch (apiError) {
      console.error("YouTube Live API failed, using scraper fallback:", apiError);
    }
  }

  const scrapedLive = await scrapeYouTubeChannelLive(cId);
  res.json(scrapedLive);
});

// Playlist API
app.get("/api/youtube-playlist", async (req, res) => {
  const pId = (req.query.playlistId as string) || "";
  if (!pId) {
    return res.json([]);
  }

  if (API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=${pId}&key=${API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          const videos = data.items.map((item: any) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            publishedAt: item.snippet.publishedAt,
            type: "video",
            author: item.snippet.channelTitle || "YouTube"
          }));
          return res.json(videos);
        }
      }
    } catch (apiError) {
      console.error("YouTube Playlist API failed, using scraper:", apiError);
    }
  }

  const scrapedPlaylist = await scrapeYouTubePlaylist(pId);
  res.json(scrapedPlaylist);
});

// Related API
app.get("/api/youtube-related", async (req, res) => {
  const vId = (req.query.videoId as string) || "";
  if (!vId) {
    return res.json(null);
  }

  if (API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${vId}&type=video&maxResults=5&key=${API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            if (item.id?.videoId && item.id.videoId !== vId) {
              return res.json({
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
                publishedAt: item.snippet.publishedAt,
                type: "video",
                author: item.snippet.channelTitle
              });
            }
          }
        }
      }
    } catch (apiError) {
      console.error("YouTube Related API failed, using scraper:", apiError);
    }
  }

  const scrapedRelatedList = await scrapeYouTubeRelated(vId);
  if (scrapedRelatedList && scrapedRelatedList.length > 0) {
    const filtered = scrapedRelatedList.filter(v => v.id !== vId);
    if (filtered.length > 0) {
      return res.json(filtered[0]);
    }
  }
  res.json(null);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Ecclesia Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
