export interface TheologyRequest {
  mode: 'exegesis' | 'sermon' | 'prayer' | 'chat';
  prompt?: string;
  reference?: string;
  audience?: string;
  feelings?: string;
}

export interface TheologyResponse {
  result: string;
  source: 'gemini' | 'curated-theology';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function requestTheologyInsight(payload: TheologyRequest): Promise<string> {
  try {
    const res = await fetch('/api/ai/theology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data: TheologyResponse = await res.json();
      return data.result || 'Conteúdo gerado com sucesso.';
    }
  } catch (error) {
    console.warn('[AI Service] Request failed, using client fallback:', error);
  }

  return 'A Palavra do Senhor é lâmpada para os nossos pés e luz para o nosso caminho. Medite de dia e de noite.';
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
      return data.response || 'A paz do Senhor Jesus!';
    }
  } catch (error) {
    console.warn('[AI Chat Service] Request failed:', error);
  }

  return 'Que a graça e a paz de nosso Senhor Jesus Cristo estejam com você e sua família!';
}
