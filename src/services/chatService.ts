import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  deleteDoc,
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  getDoc,
  increment
} from 'firebase/firestore';
import { sendTheologicalChat, ChatMessage as AIChatMessage } from './aiService';
import { notifyChatMessage } from './notificationService';
import { getCachedUserPhoto } from './userService';

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  category: 'public' | 'ministry' | 'special';
  icon: string; // emoji or icon name
  badge?: string;
  isPrivate?: boolean;
}

export interface BibleVerseSnippet {
  reference: string;
  text: string;
  version?: string;
  theme?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  senderRole?: string;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  bibleVerse?: BibleVerseSnippet;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions?: Record<string, string[]>; // { '❤️': ['uid1', 'uid2'], '🙏': ['uid3'] }
  isDirectMessage?: boolean;
  participants?: string[];
  createdAt?: any;
  createdAtIso?: string;
}

export interface TypingIndicator {
  uid: string;
  name: string;
  channelId: string;
  timestamp: number;
}

export interface ConversationSummary {
  id: string; // channelId, e.g. "dm_uidA_uidB"
  channelId: string;
  participants: string[];
  lastMessage: string;
  lastMessageSenderId: string;
  lastMessageSenderName: string;
  lastMessageSenderPhoto?: string;
  lastMessageTime?: any;
  lastMessageIso?: string;
  unreadCounts?: Record<string, number>;
  updatedAt?: any;
}

export const CHAT_CHANNELS: ChatChannel[] = [
  {
    id: 'general',
    name: 'Comunhão Geral',
    description: 'Espaço principal para toda a congregação conversar, saudar e confraternizar',
    category: 'public',
    icon: '🕊️',
    badge: 'Igreja Toda'
  },
  {
    id: 'intercession',
    name: 'Sala de Clamor & Intercessão',
    description: 'Pedidos de oração ao vivo, motivos de jejum e apoio espiritual mútuo',
    category: 'public',
    icon: '🙏',
    badge: '24/7'
  },
  {
    id: 'studies',
    name: 'Escola Bíblica & Discipulado',
    description: 'Perguntas teológicas, versículos da semana e reflexões sobre a Palavra',
    category: 'public',
    icon: '📖',
    badge: 'Estudos'
  },
  {
    id: 'youth',
    name: 'Juventude & Conectados',
    description: 'Encontros de jovens, acampamentos, retiros e comunhão jovem',
    category: 'ministry',
    icon: '🔥',
    badge: 'Mocidade'
  },
  {
    id: 'worship',
    name: 'Ministério de Louvor & Coral',
    description: 'Cifras, ensaios de sábado, novos louvores e arranjos espirituais',
    category: 'ministry',
    icon: '🎸',
    badge: 'Levitas'
  },
  {
    id: 'family',
    name: 'Famílias & Casais',
    description: 'Edificação do lar cristão, princípios para pais e filhos',
    category: 'ministry',
    icon: '🏡',
    badge: 'Lares'
  },
  {
    id: 'leaders',
    name: 'Liderança & Diaconia',
    description: 'Avisos da diretoria, escalas de obreiros e planejamento pastoral',
    category: 'special',
    icon: '🛡️',
    badge: 'Líderes'
  }
];

export const INITIAL_CHANNEL_SEEDS: Record<string, Omit<ChatMessage, 'id'>[]> = {
  general: [],
  intercession: [],
  studies: [],
  youth: [],
  worship: [],
  family: [],
  leaders: []
};

/**
 * Get unified DM channel ID between two users
 */
export function getDirectMessageChannelId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

/**
 * Subscribes to messages for a specific channel or direct message thread
 */
export function subscribeToChatMessages(
  channelId: string, 
  callback: (messages: ChatMessage[]) => void
) {
  const messagesRef = collection(db, 'chat_messages');
  const q = query(
    messagesRef,
    where('channelId', '==', channelId),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const firestoreMessages: ChatMessage[] = [];
    snapshot.docs.forEach((docSnapshot) => {
      firestoreMessages.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as ChatMessage);
    });

    // If channel has seed messages and no firestore messages exist yet, merge seeds
    if (firestoreMessages.length === 0 && INITIAL_CHANNEL_SEEDS[channelId]) {
      const defaultSeeds = INITIAL_CHANNEL_SEEDS[channelId].map((m, idx) => ({
        id: `seed_${channelId}_${idx}`,
        ...m,
        createdAt: null
      }));
      callback(defaultSeeds);
      return;
    }

    callback(firestoreMessages);
  }, (err) => {
    console.debug('[ChatService] Fallback to local channel seeds:', err);
    if (INITIAL_CHANNEL_SEEDS[channelId]) {
      const defaultSeeds = INITIAL_CHANNEL_SEEDS[channelId].map((m, idx) => ({
        id: `seed_${channelId}_${idx}`,
        ...m,
        createdAt: null
      }));
      callback(defaultSeeds);
    } else {
      callback([]);
    }
  });
}

/**
 * Sends a chat message to Firestore
 */
export async function sendChatMessage(params: {
  channelId: string;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  bibleVerse?: BibleVerseSnippet;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  isDirectMessage?: boolean;
  participants?: string[];
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Usuário precisa estar logado para enviar mensagens.');

  const cachedPhoto = getCachedUserPhoto(currentUser.uid);
  const senderPhotoUrl = cachedPhoto || currentUser.photoURL || '';

  const payload = {
    channelId: params.channelId,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Irmão em Cristo',
    senderPhoto: senderPhotoUrl,
    senderRole: currentUser.email === 'rudson.p48@gmail.com' ? 'Administrador' : 'Membro',
    text: params.text.trim(),
    imageUrl: params.imageUrl || null,
    audioUrl: params.audioUrl || null,
    audioDuration: params.audioDuration || null,
    bibleVerse: params.bibleVerse || null,
    replyTo: params.replyTo || null,
    reactions: {},
    isDirectMessage: !!params.isDirectMessage,
    participants: params.participants || null,
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'chat_messages'), payload);

  // Update conversation record for instant sorting and unread badges
  try {
    const senderDisplayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Irmão em Cristo';
    const messagePreview = params.text 
      ? params.text 
      : params.audioUrl 
        ? '🎤 Mensagem de áudio' 
        : params.imageUrl 
          ? '🖼️ Foto enviada' 
          : params.bibleVerse 
            ? `📖 ${params.bibleVerse.reference}` 
            : 'Nova mensagem';

    // Case 1: Direct Message between two users
    if (params.isDirectMessage || params.channelId.startsWith('dm_')) {
      let recipientUid = '';
      if (params.participants && params.participants.length > 0) {
        recipientUid = params.participants.find(p => p !== currentUser.uid) || '';
      }
      
      if (!recipientUid && params.channelId.startsWith('dm_')) {
        const withoutPrefix = params.channelId.replace(/^dm_/, '');
        const parts = withoutPrefix.split('_');
        if (parts.length === 2) {
          recipientUid = parts.find(p => p !== currentUser.uid) || '';
        } else if (withoutPrefix.includes(currentUser.uid)) {
          recipientUid = withoutPrefix.replace(currentUser.uid, '').replace(/^_+|_+$/g, '');
        }
      }

      const allParticipants = params.participants && params.participants.length > 0
        ? Array.from(new Set(params.participants))
        : (recipientUid ? Array.from(new Set([currentUser.uid, recipientUid])) : [currentUser.uid]);

      // Save/update conversation summary for real-time contact list sorting
      try {
        const convRef = doc(db, 'conversations', params.channelId);
        await setDoc(convRef, {
          id: params.channelId,
          channelId: params.channelId,
          participants: allParticipants,
          lastMessage: messagePreview,
          lastMessageSenderId: currentUser.uid,
          lastMessageSenderName: senderDisplayName,
          lastMessageSenderPhoto: senderPhotoUrl,
          lastMessageTime: serverTimestamp(),
          lastMessageIso: new Date().toISOString(),
          ...(recipientUid ? {
            [`unreadCounts.${recipientUid}`]: increment(1),
            [`unreadCounts.${currentUser.uid}`]: 0
          } : {}),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (convErr) {
        console.debug('[ChatService] Conversation tracking update note:', convErr);
      }

      // Send Push / In-App Notification to recipient (Always executed)
      if (recipientUid && recipientUid !== currentUser.uid && !recipientUid.startsWith('system_')) {
        try {
          await notifyChatMessage({
            recipientUid,
            senderUid: currentUser.uid,
            senderName: senderDisplayName,
            senderPhoto: senderPhotoUrl,
            channelId: params.channelId,
            message: messagePreview,
            isDirect: true
          });
        } catch (notifErr) {
          console.debug('[ChatService] Notification dispatch note:', notifErr);
        }
      }
    }
  } catch (err) {
    console.debug('[ChatService] Post-message actions error:', err);
  }

  // If this is a direct chat with the AI Pastor, trigger AI response
  if (params.channelId.includes('ai_pastor') || params.channelId === 'dm_ai_pastor') {
    handleAIPastorResponse(params.channelId, params.text, currentUser.uid);
  }

  return docRef.id;
}

/**
 * Real-time subscription to conversations list for a user (sorted by most recent message at the top)
 */
export function subscribeToUserConversations(
  userId: string,
  callback: (conversations: ConversationSummary[]) => void
) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const convsRef = collection(db, 'conversations');
  const q = query(
    convsRef,
    where('participants', 'array-contains', userId),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as ConversationSummary[];

    // Sort descending by lastMessageIso or updatedAt
    list.sort((a, b) => {
      const timeA = a.lastMessageIso ? new Date(a.lastMessageIso).getTime() : 0;
      const timeB = b.lastMessageIso ? new Date(b.lastMessageIso).getTime() : 0;
      return timeB - timeA;
    });

    callback(list);
  }, (err) => {
    console.debug('[ChatService] Fallback reading user conversations:', err);
    callback([]);
  });
}

/**
 * Clears unread counter for a user in a conversation
 */
export async function markConversationAsRead(channelId: string, userUid: string) {
  if (!channelId || !userUid) return;
  try {
    const convRef = doc(db, 'conversations', channelId);
    await updateDoc(convRef, {
      [`unreadCounts.${userUid}`]: 0
    });
  } catch (err) {
    // Document may not exist yet or merge failure
    console.debug('[ChatService] Error marking conversation as read:', err);
  }
}

/**
 * Handles AI Pastor automatic pastoral response in chat
 */
async function handleAIPastorResponse(channelId: string, userPrompt: string, userUid?: string) {
  try {
    const aiContext: AIChatMessage[] = [
      {
        role: 'user',
        content: userPrompt
      }
    ];

    const aiText = await sendTheologicalChat(aiContext);

    await addDoc(collection(db, 'chat_messages'), {
      channelId,
      senderId: 'system_ai_pastor',
      senderName: 'Pastor Virtual IA 🕊️',
      senderPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      senderRole: 'Aconselhamento Bíblico',
      text: aiText,
      reactions: { '🕊️': ['system'] },
      isDirectMessage: true,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });

    if (userUid) {
      await notifyChatMessage({
        recipientUid: userUid,
        senderUid: 'system_ai_pastor',
        senderName: 'Pastor Virtual IA 🕊️',
        senderPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        channelId,
        message: aiText.slice(0, 100) + '...',
        isDirect: true
      });
    }
  } catch (err) {
    console.error('[ChatService] AI Pastor response error:', err);
  }
}

/**
 * Toggles a spiritual reaction on a message
 */
export async function toggleMessageReaction(messageId: string, emoji: string, currentReactions?: Record<string, string[]>) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  // Don't modify seeds in firestore
  if (messageId.startsWith('seed_')) return;

  try {
    const msgRef = doc(db, 'chat_messages', messageId);
    const reactions = { ...(currentReactions || {}) };
    const userList = reactions[emoji] ? [...reactions[emoji]] : [];
    const userIdx = userList.indexOf(currentUser.uid);

    if (userIdx > -1) {
      userList.splice(userIdx, 1);
    } else {
      userList.push(currentUser.uid);
    }

    if (userList.length > 0) {
      reactions[emoji] = userList;
    } else {
      delete reactions[emoji];
    }

    await updateDoc(msgRef, { reactions });
  } catch (err) {
    console.error('[ChatService] Error toggling reaction:', err);
  }
}

/**
 * Deletes a chat message (if owner or admin)
 */
export async function deleteChatMessage(messageId: string) {
  if (messageId.startsWith('seed_')) return;
  try {
    await deleteDoc(doc(db, 'chat_messages', messageId));
  } catch (err) {
    console.error('[ChatService] Error deleting message:', err);
  }
}

/**
 * Quick Popular Bible Verses for Instant Sharing in Chat
 */
export const POPULAR_BIBLE_VERSES: BibleVerseSnippet[] = [
  {
    reference: 'Salmos 23:1',
    text: 'O Senhor é o meu pastor; de nada terei falta.',
    version: 'NVI',
    theme: 'Confiança e Provisão'
  },
  {
    reference: 'Filipenses 4:13',
    text: 'Tudo posso naquele que me fortalece.',
    version: 'ARC',
    theme: 'Força e Vitória'
  },
  {
    reference: 'João 3:16',
    text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    version: 'NVI',
    theme: 'Amor e Salvação'
  },
  {
    reference: 'Jeremias 29:11',
    text: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.',
    version: 'NVI',
    theme: 'Futuro e Esperança'
  },
  {
    reference: 'Isaías 41:10',
    text: 'Não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.',
    version: 'NVI',
    theme: 'Coragem contra o Medo'
  },
  {
    reference: 'Romanos 8:28',
    text: 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.',
    version: 'NVI',
    theme: 'Propósito Divino'
  },
  {
    reference: 'Salmos 91:1-2',
    text: 'Aquele que habita no abrigo do Altíssimo e descansa à sombra do Todo-Poderoso pode dizer ao Senhor: "Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio."',
    version: 'NVI',
    theme: 'Proteção Celestial'
  },
  {
    reference: 'Provérbios 3:5-6',
    text: 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.',
    version: 'NVI',
    theme: 'Direção e Sabedoria'
  }
];
