import { 
  TheologyRequest, 
  TheologyResponse, 
  ChatMessage, 
  generateContextualTheologyFallback 
} from './theologyEngine';

export type { TheologyRequest, TheologyResponse, ChatMessage };

export async function requestTheologyInsight(payload: TheologyRequest): Promise<string> {
  try {
    const res = await fetch('/api/ai/theology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data: TheologyResponse = await res.json();
      if (data.result && data.result.trim().length > 20) {
        return data.result;
      }
    }
  } catch (error) {
    console.warn('[AI Service] Request failed, using dynamic theological generator:', error);
  }

  // Rich dynamic context-aware fallback (never a short static phrase)
  return generateContextualTheologyFallback(payload);
}

export async function sendTheologicalChat(messages: ChatMessage[]): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.response && data.response.trim().length > 10) {
        return data.response;
      }
    }
  } catch (error) {
    console.warn('[AI Chat Service] Request failed, using dynamic response:', error);
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || 'Dúvida bíblica';
  return generateContextualTheologyFallback({ mode: 'chat', prompt: lastUserMsg });
}
