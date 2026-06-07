
import React from 'react';
import { NearbyUser } from '../types';

interface UserListViewProps {
  nearbyUsers: NearbyUser[];
  onUserClick: (user: NearbyUser) => void;
  isLoading: boolean;
  unreadCounts: Record<string, number>;
  onSimulate?: () => void;
}

const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

const LANGUAGE_FLAGS: Record<string, string> = {
    'Italian': '🇮🇹',
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Portuguese': '🇵🇹',
    'Chinese': '🇨🇳',
    'Japanese': '🇯🇵',
    'Russian': '🇷🇺',
    'Arabic': '🇸🇦',
    'Hindi': '🇮🇳',
    'English': '🇬🇧',
};

export const UserListView: React.FC<UserListViewProps> = ({ nearbyUsers, onUserClick, isLoading, unreadCounts, onSimulate }) => {
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-gray-400">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise-500 mb-4"></div>
         <p>Scanning area...</p>
      </div>
    );
  }

  if (nearbyUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-gray-400 px-6 text-center">
        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        <p className="text-lg font-medium text-gray-600">No one nearby yet.</p>
        <p className="text-sm text-gray-400 mb-6">Try moving around or wait for others.</p>
        
        {onSimulate && (
            <button 
                onClick={onSimulate}
                className="px-6 py-3 bg-white border-2 border-turquoise-500 text-turquoise-600 rounded-xl font-bold hover:bg-turquoise-50 transition shadow-sm active:scale-95"
            >
                Simulate Nearby Users
            </button>
        )}
      </div>
    );
  }

  // Sort by unread count first, then distance
  const sortedUsers = [...nearbyUsers].sort((a, b) => {
      const unreadA = unreadCounts[a.id] || 0;
      const unreadB = unreadCounts[b.id] || 0;
      if (unreadA !== unreadB) return unreadB - unreadA; // Unread first
      return a.distance - b.distance;
  });

  return (
    <div className="w-full h-full bg-gray-50 overflow-y-auto pb-24 pt-20 px-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">Nearby People ({sortedUsers.length})</h2>
      <div className="space-y-3">
        {sortedUsers.map((user) => {
          const unread = unreadCounts[user.id] || 0;
          return (
            <div 
                key={user.id}
                onClick={() => onUserClick(user)}
                className={`rounded-xl p-4 shadow-sm border flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer relative ${unread > 0 ? 'bg-white border-red-200 ring-1 ring-red-100' : 'bg-white border-gray-100'}`}
            >
                <div className="relative">
                    <img src={user.avatar} alt={user.nickname} className="w-14 h-14 rounded-full bg-gray-200 object-cover" />
                    {user.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                             <h3 className={`font-bold truncate text-lg ${unread > 0 ? 'text-gray-900' : 'text-gray-800'}`}>{user.nickname}</h3>
                             {user.isBot && (
                                 <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-mono uppercase">BOT</span>
                             )}
                             {unread > 0 && (
                                <div className="ml-2 bg-red-600 text-white rounded-lg px-2 py-0.5 text-xs font-bold shadow-md flex items-center gap-1 animate-pulse">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                                    <span>{unread}</span>
                                </div>
                             )}
                        </div>
                        <span className="text-xs font-bold text-turquoise-600 bg-turquoise-50 px-2 py-1 rounded-full whitespace-nowrap">
                            {formatDistance(user.distance)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl leading-none">
                            {LANGUAGE_FLAGS[user.language] || '🌍'}
                        </span>
                        <p className={`text-sm truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                           {unread > 0 ? 'New Message!' : `Speaks ${user.language}`}
                        </p>
                    </div>
                </div>

                <div className="text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
