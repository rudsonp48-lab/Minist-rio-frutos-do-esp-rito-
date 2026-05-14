const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  type: 'video' | 'live';
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

export async function searchGospelContent(query: string): Promise<YouTubeVideo[]> {
  if (!API_KEY) return [];

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
    );
    const data = await response.json();

    if (data.items) {
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        type: 'video'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}
