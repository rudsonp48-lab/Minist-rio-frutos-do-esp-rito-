import React, { useState } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Reply, 
  Smile, 
  Trash2, 
  Copy, 
  Check, 
  BookOpen, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  Flame,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, toggleMessageReaction, deleteChatMessage } from '../../services/chatService';
import VoicePrayerPlayer from '../VoicePrayerPlayer';
import { auth } from '../../lib/firebase';
import { Link } from 'react-router-dom';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onReply: (message: ChatMessage) => void;
  isAdmin?: boolean;
}

const SPIRITUAL_REACTION_EMOJIS = [
  { emoji: '❤️', label: 'Amém' },
  { emoji: '🙏', label: 'Oração' },
  { emoji: '🔥', label: 'Glória' },
  { emoji: '🕊️', label: 'Paz' },
  { emoji: '👏', label: 'Aleluia' },
  { emoji: '✝️', label: 'Graça' }
];

export default function ChatMessageBubble({
  message,
  onReply,
  isAdmin = false
}: ChatMessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const currentUser = auth.currentUser;
  const isMe = currentUser?.uid === message.senderId;
  const isAIPastor = message.senderId === 'system_ai_pastor';

  const handleCopy = () => {
    const textToCopy = message.text || message.bibleVerse?.text || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReactionClick = (emoji: string) => {
    toggleMessageReaction(message.id, emoji, message.reactions);
    setShowEmojiPicker(false);
  };

  const formatTimestamp = (dateVal: any, isoVal?: string) => {
    try {
      let d: Date;
      if (dateVal?.toDate) {
        d = dateVal.toDate();
      } else if (isoVal) {
        d = new Date(isoVal);
      } else {
        d = new Date();
      }
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex gap-1.5 sm:gap-2.5 my-1.5 w-full max-w-full min-w-0 ${isMe ? 'flex-row-reverse pl-3 sm:pl-8' : 'flex-row pr-3 sm:pr-8'}`}
    >
      {/* Sender Avatar */}
      <div className="shrink-0 flex flex-col items-center">
        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl p-[2px] shadow-md relative ${
          isAIPastor 
            ? 'bg-gradient-to-tr from-amber-400 to-indigo-500' 
            : isMe 
              ? 'bg-gradient-to-tr from-purple-500 to-emerald-400' 
              : 'bg-white/10'
        }`}>
          {message.senderPhoto ? (
            <img
              src={message.senderPhoto}
              alt={message.senderName}
              className="w-full h-full object-cover rounded-[10px] sm:rounded-[14px]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-[#1e1e24] rounded-[10px] sm:rounded-[14px] flex items-center justify-center font-bold text-white text-[11px] sm:text-xs">
              {message.senderName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {isAIPastor && (
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-black flex items-center justify-center text-[8px] text-black">
              ✨
            </span>
          )}
        </div>
      </div>

      {/* Message Body & Actions Container */}
      <div className={`flex flex-col min-w-0 max-w-[85%] sm:max-w-[78%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender metadata bar */}
        <div className={`flex items-center gap-1.5 mb-1 text-xs max-w-full flex-wrap ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="font-bold text-white/90 truncate max-w-[110px] sm:max-w-[160px]">
            {isMe ? 'Você' : message.senderName}
          </span>
          {message.senderRole && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold shrink-0 ${
              message.senderRole.includes('Pastor') || message.senderRole.includes('Aconselhamento')
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : message.senderRole.includes('Líder') || message.senderRole.includes('Admin')
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/5 text-white/50'
            }`}>
              {message.senderRole}
            </span>
          )}
          <span className="text-[10px] text-white/40 shrink-0">
            {formatTimestamp(message.createdAt, message.createdAtIso)}
          </span>
        </div>

        {/* Message Bubble Card */}
        <div
          className={`relative rounded-[18px] sm:rounded-[22px] p-2.5 sm:p-3.5 shadow-md border transition-all text-sm max-w-full overflow-hidden ${
            isMe
              ? 'bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-800 text-white border-purple-500/30 rounded-br-sm'
              : isAIPastor
                ? 'bg-[#181824] text-white border-amber-500/30 rounded-bl-sm ring-1 ring-amber-500/20'
                : 'bg-[#181822] text-white/90 border-white/10 rounded-bl-sm'
          }`}
        >
          {/* Quoted Reply if present */}
          {message.replyTo && (
            <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-black/40 border-l-3 border-amber-400 text-xs max-w-full overflow-hidden">
              <span className="font-bold text-amber-300 block text-[11px] truncate">
                {message.replyTo.senderName}
              </span>
              <p className="text-white/70 truncate text-[11px]">
                {message.replyTo.text}
              </p>
            </div>
          )}

          {/* Regular Text content */}
          {message.text && (
            <p className="whitespace-pre-wrap leading-relaxed break-words text-[13px] sm:text-sm font-normal">
              {message.text}
            </p>
          )}

          {/* Bible Verse Rich Card */}
          {message.bibleVerse && (
            <div className="mt-2 p-2.5 sm:p-3 rounded-xl bg-black/40 border border-amber-500/25 shadow-inner w-full max-w-full overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 text-[11px] sm:text-xs font-bold shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{message.bibleVerse.reference}</span>
                  {message.bibleVerse.version && (
                    <span className="text-[10px] text-amber-400/60 font-normal">
                      ({message.bibleVerse.version})
                    </span>
                  )}
                </div>
                {message.bibleVerse.theme && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-semibold truncate max-w-[120px]">
                    {message.bibleVerse.theme}
                  </span>
                )}
              </div>
              <blockquote className="text-[11px] sm:text-[13px] text-white/95 italic border-l-2 border-amber-400/60 pl-2 py-0.5 leading-relaxed font-serif break-words">
                "{message.bibleVerse.text}"
              </blockquote>
            </div>
          )}

          {/* Attached Image */}
          {message.imageUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-h-72">
              <img
                src={message.imageUrl}
                alt="Imagem compartilhada"
                onClick={() => setShowImageModal(true)}
                className="w-full h-auto object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Voice Audio Message */}
          {message.audioUrl && (
            <div className="mt-2 w-full max-w-full">
              <VoicePrayerPlayer
                audioUrl={message.audioUrl}
                duration={message.audioDuration}
                authorName={message.senderName}
                compact={true}
              />
            </div>
          )}

          {/* Message Sent indicator for current user */}
          {isMe && (
            <div className="flex justify-end mt-1">
              <CheckCheck className="w-3 h-3 text-purple-200" />
            </div>
          )}
        </div>

        {/* Reaction Counters Display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(message.reactions).map(([emoji, uids]) => {
              if (!uids || uids.length === 0) return null;
              const hasReacted = currentUser ? uids.includes(currentUser.uid) : false;
              return (
                <button
                  key={emoji}
                  onClick={() => toggleMessageReaction(message.id, emoji, message.reactions)}
                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all active:scale-95 border ${
                    hasReacted
                      ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                      : 'bg-[#181820] border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-bold">{uids.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Action Floating Menu (for desktop hover / inline) */}
        <div className={`hidden md:flex absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1 bg-[#121218] border border-white/10 rounded-xl px-1.5 py-1 shadow-xl z-20 ${
          isMe ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'
        }`}>
          {/* Reaction Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Reagir"
            >
              <Smile className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Reaction picker popover */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1C1C24] border border-white/15 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1 z-30"
                >
                  {SPIRITUAL_REACTION_EMOJIS.map((item) => (
                    <button
                      key={item.emoji}
                      onClick={() => handleReactionClick(item.emoji)}
                      className="p-1.5 hover:bg-white/10 rounded-xl text-base transition-transform hover:scale-125"
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reply Button */}
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Responder"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Copiar mensagem"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Delete Button (if owner or admin) */}
          {(isMe || isAdmin) && !message.id.startsWith('seed_') && (
            <button
              onClick={() => deleteChatMessage(message.id)}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
              title="Excluir mensagem"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {showImageModal && message.imageUrl && (
        <div
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={message.imageUrl}
              alt="Ampliação da imagem"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
