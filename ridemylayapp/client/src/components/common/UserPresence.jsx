import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const UserPresence = ({ isOnline, lastActive }) => {
  if (isOnline) {
    return (
      <div className="flex items-center">
        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center">
      <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {lastActive ? `Last seen ${formatDistanceToNow(new Date(lastActive), { addSuffix: true })}` : 'Offline'}
      </span>
    </div>
  );
};

export default UserPresence;