import React from 'react';
import { Plus } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { UserStoryGroup } from '../../services/socialService';
import { getCachedUserPhoto } from '../../services/userService';

interface StoriesBarProps {
  storyGroups: UserStoryGroup[];
  onOpenStory: (group: UserStoryGroup, index?: number) => void;
  onCreateStory: () => void;
}

export default function StoriesBar({
  storyGroups,
  onOpenStory,
  onCreateStory
}: StoriesBarProps) {
  const currentUser = auth.currentUser;
  const cachedPhoto = currentUser?.uid ? getCachedUserPhoto(currentUser.uid) : '';
  const userPhoto = cachedPhoto || currentUser?.photoURL;
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Você';

  // Check if current user has an active story in the list
  const myStoryGroup = storyGroups.find(g => g.userId === currentUser?.uid);
  const otherStoryGroups = storyGroups.filter(g => g.userId !== currentUser?.uid);

  return (
    <div className="w-full bg-[#0D0D12]/80 backdrop-blur-md border-b border-white/5 py-3 px-2 sm:px-4 overflow-hidden">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1 px-1">
        {/* Your Story Button */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
          <div 
            onClick={() => {
              if (myStoryGroup && myStoryGroup.stories.length > 0) {
                onOpenStory(myStoryGroup);
              } else {
                onCreateStory();
              }
            }}
            className="relative"
          >
            {/* Gradient ring if has active story */}
            <div className={`w-[68px] h-[68px] rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 ${
              myStoryGroup && myStoryGroup.stories.length > 0
                ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md shadow-rose-500/20'
                : 'bg-white/10'
            }`}>
              <div className="w-full h-full rounded-full bg-black p-[2px] overflow-hidden">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-700 to-indigo-800 flex items-center justify-center text-white font-bold text-lg">
                    {userName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Plus Icon Badge to Add Story */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateStory();
              }}
              title="Adicionar Novo Story"
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border-2 border-black flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
          <span className="text-[11px] font-medium text-white/80 truncate max-w-[70px] text-center">
            {myStoryGroup && myStoryGroup.stories.length > 0 ? 'Seu Story' : 'Criar Story'}
          </span>
        </div>

        {/* Community Members Stories */}
        {otherStoryGroups.map((group) => {
          return (
            <div
              key={group.userId}
              onClick={() => onOpenStory(group)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div className="relative">
                {/* Instagram Gradient Ring */}
                <div className={`w-[68px] h-[68px] rounded-full p-[2.5px] transition-all duration-300 group-hover:scale-105 ${
                  group.hasUnseen
                    ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md shadow-rose-500/20 animate-none'
                    : 'bg-white/20'
                }`}>
                  <div className="w-full h-full rounded-full bg-black p-[2px] overflow-hidden">
                    {group.userPhoto ? (
                      <img
                        src={group.userPhoto}
                        alt={group.userName}
                        className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white font-bold text-lg">
                        {group.userName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-white/90 truncate max-w-[72px] text-center">
                {group.userName.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
