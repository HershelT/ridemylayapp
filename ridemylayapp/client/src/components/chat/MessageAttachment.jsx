import React from 'react';
import { Link } from 'react-router-dom';
import { FaExternalLinkAlt } from 'react-icons/fa';

const MessageAttachment = ({ attachment }) => {
  if (!attachment) return null;
  
  switch (attachment.type) {
    case 'image':
      return (
        <div className="mt-2 max-w-xs">
          <img 
            src={attachment.url} 
            alt="Attachment" 
            className="rounded-lg max-w-full h-auto max-h-48 object-cover"
            onClick={() => window.open(attachment.url, '_blank')}
          />
        </div>
      );
      
    case 'video':
      return (
        <div className="mt-2 max-w-xs">
          <video 
            src={attachment.url} 
            controls
            className="rounded-lg max-w-full h-auto max-h-48"
          />
        </div>
      );
      
    case 'bet':
      return (
        <div className="mt-2">
          <Link 
            to={`/bets/${attachment.betId}`}
            className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-indigo-600 dark:text-indigo-400">
                Shared Bet
              </div>
              <FaExternalLinkAlt className="text-gray-400" />
            </div>
            {attachment.betData && (
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {attachment.betData.status && (
                  <>
                    {attachment.betData.status === 'won' && (
                      <span className="text-green-500 font-medium">Won</span>
                    )}
                    {attachment.betData.status === 'lost' && (
                      <span className="text-red-500 font-medium">Lost</span>
                    )}
                    {attachment.betData.status === 'pending' && (
                      <span className="text-yellow-500 font-medium">Pending</span>
                    )}
                    <span className="mx-1">·</span>
                  </>
                )}
                {attachment.betData.odds && (
                  <>
                    <span>{attachment.betData.odds > 0 ? `+${attachment.betData.odds}` : attachment.betData.odds}</span>
                    <span className="mx-1">·</span>
                  </>
                )}
                {attachment.betData.stake && (
                  <span>${attachment.betData.stake}</span>
                )}
              </div>
            )}
          </Link>
        </div>
      );
      
    default:
      return null;
  }
};

export default MessageAttachment;