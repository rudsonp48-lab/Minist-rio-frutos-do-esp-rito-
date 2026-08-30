import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { getCachedUserPhoto } from './userService';

export interface CallParticipant {
  uid: string;
  name: string;
  photoURL?: string;
  role?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
  handRaised?: boolean;
  joinedAt: number;
}

export interface CallSession {
  id: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'rejected' | 'ended' | 'missed';
  caller: {
    uid: string;
    name: string;
    photoURL?: string;
  };
  receiver: {
    uid: string;
    name: string;
    photoURL?: string;
  };
  channelId?: string;
  isDirect: boolean;
  offer?: {
    type: string;
    sdp: string;
  } | null;
  answer?: {
    type: string;
    sdp: string;
  } | null;
  createdAt: any;
  answeredAt?: any;
  endedAt?: any;
  endReason?: string;
}

export interface CallRoomData {
  id: string;
  title: string;
  channelId?: string;
  isDirect?: boolean;
  type: 'audio' | 'video';
  hostUid: string;
  hostName: string;
  maxParticipants: number;
  active: boolean;
  participants: CallParticipant[];
  startedAt: any;
}

/**
 * WebRTC Free Public STUN configuration
 */
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ]
};

/**
 * Plays realistic audio chimes for call ringing, connecting, and disconnecting
 */
export function playCallSound(type: 'ring' | 'connect' | 'disconnect' | 'raise_hand' | 'incoming_ring') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (type === 'ring' || type === 'incoming_ring') {
      // Modern soft melodic telephone ring (Instagram / FaceTime style)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.65);
      osc2.stop(ctx.currentTime + 0.65);
    } else if (type === 'connect') {
      // Joyful upward 3-tone chime (G5 -> C6 -> E6)
      const tones = [783.99, 1046.50, 1318.51];
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.4);
      });
    } else if (type === 'disconnect') {
      // Descending soft tones
      const tones = [587.33, 440.00];
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } else if (type === 'raise_hand') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.debug('[CallService] Sound chime notice:', e);
  }
}

/**
 * Starts a repeating ring chime (Instagram style incoming ring)
 */
export function startRingingLoop(type: 'incoming' | 'outgoing' = 'incoming'): () => void {
  let isStopped = false;
  
  const playOnce = () => {
    if (isStopped) return;
    playCallSound(type === 'incoming' ? 'incoming_ring' : 'ring');
  };

  playOnce();
  const interval = setInterval(playOnce, 2200);

  return () => {
    isStopped = true;
    clearInterval(interval);
  };
}

// ----------------------------------------------------
// 1-ON-1 DIRECT CALL SIGNALING (INSTAGRAM STYLE)
// ----------------------------------------------------

/**
 * Creates and initiates a 1-on-1 direct call to a specific user in Firestore
 */
export async function createDirectCall(params: {
  receiverUid: string;
  receiverName: string;
  receiverPhoto?: string;
  type: 'audio' | 'video';
  channelId?: string;
}): Promise<CallSession> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário precisa estar logado para iniciar chamada.');

  const cachedPhoto = getCachedUserPhoto(user.uid);
  const callerPhoto = cachedPhoto || user.photoURL || '';

  const callId = `call_${user.uid}_${params.receiverUid}_${Date.now()}`;
  const callRef = doc(db, 'calls', callId);

  const callSession: CallSession = {
    id: callId,
    type: params.type,
    status: 'ringing',
    caller: {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Irmão(ã)',
      photoURL: callerPhoto
    },
    receiver: {
      uid: params.receiverUid,
      name: params.receiverName,
      photoURL: params.receiverPhoto || ''
    },
    channelId: params.channelId,
    isDirect: true,
    offer: null,
    answer: null,
    createdAt: serverTimestamp()
  };

  await setDoc(callRef, callSession);
  return callSession;
}

/**
 * Subscribes to incoming 1-on-1 calls for the current user
 */
export function subscribeToIncomingCalls(receiverUid: string, callback: (call: CallSession | null) => void) {
  if (!receiverUid) return () => {};

  const callsQuery = query(
    collection(db, 'calls'),
    where('receiver.uid', '==', receiverUid),
    where('status', '==', 'ringing')
  );

  return onSnapshot(callsQuery, (snapshot) => {
    if (!snapshot.empty) {
      // Get most recent ringing call
      const docData = snapshot.docs[0].data() as CallSession;
      callback(docData);
    } else {
      callback(null);
    }
  }, (err) => {
    console.debug('[CallService] Error subscribing to incoming calls:', err);
    callback(null);
  });
}

/**
 * Subscribes to a specific call session status changes
 */
export function subscribeToCallSession(callId: string, callback: (call: CallSession | null) => void) {
  if (!callId) return () => {};
  const callRef = doc(db, 'calls', callId);

  return onSnapshot(callRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as CallSession);
    } else {
      callback(null);
    }
  }, (err) => {
    console.debug('[CallService] Error subscribing to call session:', err);
    callback(null);
  });
}

/**
 * Accepts an incoming call
 */
export async function acceptDirectCall(callId: string) {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    status: 'connected',
    answeredAt: serverTimestamp()
  });
}

/**
 * Rejects an incoming call
 */
export async function rejectDirectCall(callId: string, reason = 'Recusada pelo contato') {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    status: 'rejected',
    endedAt: serverTimestamp(),
    endReason: reason
  });
}

/**
 * Ends an ongoing call
 */
export async function endDirectCall(callId: string) {
  const callRef = doc(db, 'calls', callId);
  try {
    await updateDoc(callRef, {
      status: 'ended',
      endedAt: serverTimestamp()
    });
  } catch (e) {
    console.debug('[CallService] End call update notice:', e);
  }
}

/**
 * WebRTC SDP Offer / Answer exchange
 */
export async function saveCallOffer(callId: string, offer: RTCSessionDescriptionInit) {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    offer: {
      type: offer.type,
      sdp: offer.sdp
    }
  });
}

export async function saveCallAnswer(callId: string, answer: RTCSessionDescriptionInit) {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    answer: {
      type: answer.type,
      sdp: answer.sdp
    }
  });
}

/**
 * WebRTC ICE Candidate exchange
 */
export async function addCallIceCandidate(callId: string, role: 'caller' | 'receiver', candidate: RTCIceCandidate) {
  const candidatesCol = collection(db, 'calls', callId, `${role}_candidates`);
  await addDoc(candidatesCol, candidate.toJSON());
}

export function subscribeCallIceCandidates(
  callId: string, 
  listenToRole: 'caller' | 'receiver', 
  onCandidate: (candidate: RTCIceCandidateInit) => void
) {
  const candidatesCol = collection(db, 'calls', callId, `${listenToRole}_candidates`);
  return onSnapshot(candidatesCol, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        onCandidate(data as RTCIceCandidateInit);
      }
    });
  });
}

// ----------------------------------------------------
// GROUP CALL ROOMS (COMMUNITY / CHANNEL WIDE)
// ----------------------------------------------------

/**
 * Creates or updates a group call room in Firestore
 */
export async function createCallRoom(params: {
  roomId: string;
  title: string;
  type: 'audio' | 'video';
  channelId?: string;
  isDirect?: boolean;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário precisa estar logado para iniciar chamada.');

  const cachedPhoto = getCachedUserPhoto(user.uid);
  const roomRef = doc(db, 'call_rooms', params.roomId);

  const initialParticipant: CallParticipant = {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Irmão(ã)',
    photoURL: cachedPhoto || user.photoURL || '',
    role: user.email === 'rudson.p48@gmail.com' ? 'Pastor / Administrador' : 'Membro',
    isVideoEnabled: params.type === 'video',
    isAudioEnabled: true,
    joinedAt: Date.now()
  };

  await setDoc(roomRef, {
    id: params.roomId,
    title: params.title,
    channelId: params.channelId || null,
    isDirect: !!params.isDirect,
    type: params.type,
    hostUid: user.uid,
    hostName: user.displayName || 'Irmão(ã)',
    maxParticipants: 20,
    active: true,
    participants: [initialParticipant],
    startedAt: serverTimestamp()
  }, { merge: true });

  return params.roomId;
}

/**
 * Subscribes to active group call room state in Firestore
 */
export function subscribeToCallRoom(roomId: string, callback: (room: CallRoomData | null) => void) {
  const roomRef = doc(db, 'call_rooms', roomId);
  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as CallRoomData);
    } else {
      callback(null);
    }
  }, (err) => {
    console.debug('[CallService] Error subscribing to call room:', err);
    callback(null);
  });
}

