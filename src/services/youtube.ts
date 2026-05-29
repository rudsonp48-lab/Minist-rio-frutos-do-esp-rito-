const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  type: 'video' | 'live' | 'music' | 'podcast';
  author?: string;
}

export async function checkChannelLive(channelId: string = CHANNEL_ID): Promise<YouTubeVideo[] | null> {
  if (!API_KEY || !channelId) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${API_KEY}`
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        type: 'live'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error checking live status:', error);
    return null;
  }
}

export async function fetchVideosFromPlaylist(playlistId: string): Promise<YouTubeVideo[]> {
  if (!API_KEY) return [];

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${playlistId}&key=${API_KEY}`
    );
    const data = await response.json();

    if (data.items) {
      return data.items.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        type: 'video'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching playlist items:', error);
    return [];
  }
}

export async function fetchRelatedVideo(videoId: string): Promise<YouTubeVideo | null> {
  if (!API_KEY) {
    const randomFallback = MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)];
    return randomFallback;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=5&key=${API_KEY}`
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Get the first valid related video
      for (const item of data.items) {
        if (item.id?.videoId && item.id.videoId !== videoId) {
          return {
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            publishedAt: item.snippet.publishedAt,
            type: 'music',
            author: item.snippet.channelTitle
          };
        }
      }
    }
  } catch (error) {
    console.error('Error fetching related video:', error);
  }
  
  // Fallback to random mock if fails
  return MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)];
}

export const MOCK_VIDEOS: YouTubeVideo[] = [
  {
    id: 'kQOOS35sBhc',
    title: 'PODES MORAR AQUI // FOGO E GLÓRIA // ADORAÇÃO PROFÉTICA',
    thumbnail: 'https://i.ytimg.com/vi/kQOOS35sBhc/hqdefault.jpg',
    publishedAt: new Date().toISOString(),
    type: 'music',
    author: 'Ecclesia Stream'
  },
  {
    id: 'tN8pA0L_q8c',
    title: 'GABRIELA ROCHA - ME ATRAIU (AO VIVO)',
    thumbnail: 'https://i.ytimg.com/vi/tN8pA0L_q8c/hqdefault.jpg',
    publishedAt: new Date().toISOString(),
    type: 'music',
    author: 'Gabriela Rocha'
  },
  {
    id: '9Yf-7K_rF0o',
    title: 'JEFERSON E SUELLEN - VEM ME BUSCAR',
    thumbnail: 'https://i.ytimg.com/vi/9Yf-7K_rF0o/hqdefault.jpg',
    publishedAt: new Date().toISOString(),
    type: 'music',
    author: 'Jeferson e Suellen'
  },
  {
    id: 'I-M-oA5E440',
    title: 'KLEBER LUCAS E CAETANO VELOSO - DEUS CUIDA DE MIM',
    thumbnail: 'https://i.ytimg.com/vi/I-M-oA5E440/hqdefault.jpg',
    publishedAt: new Date().toISOString(),
    type: 'music',
    author: 'Kleber Lucas'
  },
  {
    id: 'M2q208B2-dM',
    title: 'PODER DO TEU AMOR - ALINE BARROS',
    thumbnail: 'https://i.ytimg.com/vi/M2q208B2-dM/hqdefault.jpg',
    publishedAt: new Date().toISOString(),
    type: 'music',
    author: 'Aline Barros'
  }
];

export async function searchGospelContent(query: string): Promise<YouTubeVideo[]> {
  if (!API_KEY) {
    if (query.toLowerCase().includes('pode morar aqui')) {
      return [MOCK_VIDEOS[0]];
    }
    return MOCK_VIDEOS;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items
        .filter((item: any) => item.id?.videoId || typeof item.id === 'string')
        .map((item: any) => ({
        id: item.id?.videoId || item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        type: 'video',
        author: item.snippet.channelTitle || 'Ecclesia Stream'
      }));
    }
    return MOCK_VIDEOS;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return MOCK_VIDEOS;
  }
}

