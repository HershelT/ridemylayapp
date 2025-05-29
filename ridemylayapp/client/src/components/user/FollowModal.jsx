import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const FollowModal = ({ isOpen, onClose, userId, type }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const followUser = useAuthStore(state => state.followUser);
  const isFollowingUser = useAuthStore(state => state.isFollowingUser);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!isOpen || !userId) return;
        setLoading(true);
        
        // Fetch the appropriate list based on type
        const response = type === 'followers'
          ? await userAPI.getUserFollowers(userId)
          : await userAPI.getUserFollowing(userId);

        setUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  const handleFollowToggle = async (username) => {
    try {
      const result = await followUser(username);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update follow status');
      }

      // Update the local state
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.username === username) {
            return { ...user, isFollowing: !user.isFollowing };
          }
          return user;
        })
      );
    } catch (error) {
      toast.error(error.message || 'Failed to update follow status');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-96 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No {type} yet
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => {
                      navigate(`/profile/${user.username}`);
                      onClose();
                    }}
                  >
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/9.x/icons/svg?seed=${user.username}`}
                      alt={`${user.username}'s avatar`}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium flex items-center">
                        {user.username}
                        {user.verified && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                          </svg>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Win Rate: {user.winRate}%
                      </div>
                    </div>
                  </div>
                  {user.username !== useAuthStore.getState().user?.username && (
                    <button
                      onClick={() => handleFollowToggle(user.username)}
                      className={`px-4 py-1 rounded-full text-sm font-medium ${
                        isFollowingUser(user._id)
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                      }`}
                    >
                      {isFollowingUser(user._id) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowModal;
