import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useAuth from '../../hooks/useAuth';
import FollowModal from './FollowModal';

const ProfileHeader = ({ user, isOwnProfile, onFollowToggle }) => {  const [followerCount, setFollowerCount] = useState(user?.followers?.length || 0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'followers' or 'following'
  const followUser = useAuthStore(state => state.followUser);
  const isFollowingUser = useAuthStore(state => state.isFollowingUser);
  const isFollowing = !!user?._id && isFollowingUser(user._id);
  const { logout } = useAuth();

  // Update follower count when user prop changes
  useEffect(() => {
    if (user) {
      setFollowerCount(user.followers?.length || 0);
    }
  }, [user]);
  const handleFollow = async () => {
    if (!user?.username) return;

    try {
      const newFollowState = !isFollowing;
      const originalCount = followerCount;
      
      // Optimistic UI update for follower count only
      setFollowerCount(prev => newFollowState ? prev + 1 : prev - 1);
      
      // Call the global store action to follow/unfollow
      const result = await followUser(user.username);
        // Validate the result
      if (!result.success) {
        // Revert follower count if the action failed
        setFollowerCount(originalCount);
        throw new Error(result.error || 'Failed to update follow status');
      }

      // Show success toast
      toast.success(result.isFollowing ? 'Started following user' : 'Unfollowed user');
      
      // Notify parent component about the change
      if (onFollowToggle) {
        onFollowToggle(result.isFollowing);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update follow status');
      console.error('Follow toggle error:', error);
    }
  };
  
  const handleEditProfile = () => {
    setShowEditModal(true);
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start">
        <img 
          src={user?.avatarUrl || `https://api.dicebear.com/9.x/icons/svg?seed=${user?.username || 'anonymous'}`} 
          alt="User Avatar" 
          className="w-20 h-20 rounded-full"
        />
        
        <div className="ml-4 flex-1">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">{user?.username || 'User'}</h1>
            {user?.verified && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {user?.streak > 0 ? 
              <span className="text-green-500">🔥 {user.streak} Win Streak</span> : 
              user?.streak < 0 ? 
              <span className="text-red-500">❄️ {Math.abs(user.streak)} Loss Streak</span> : 
              'No active streak'
            }
          </div>            <div className="flex space-x-4 text-sm mb-3">
            <div>
              <span className="font-bold">{user?.betCount || user?.stats?.betsCount || 0}</span> Bets
            </div>
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => {
                    setModalType('followers');
                    setShowFollowModal(true);
                  }}
                  className="hover:opacity-75"
                >
                  <span className="font-bold">{followerCount}</span> Followers
                </button>
                <button
                  onClick={() => {
                    setModalType('following');
                    setShowFollowModal(true);
                  }}
                  className="hover:opacity-75"
                >
                  <span className="font-bold">{user?.following?.length || 0}</span> Following
                </button>
              </>
            ) : (
              <>
                <div>
                  <span className="font-bold">{followerCount}</span> Followers
                </div>
                <div>
                  <span className="font-bold">{user?.following?.length || 0}</span> Following
                </div>
              </>
            )}
          </div>
          
          {isOwnProfile ? (
            <div className="space-x-2">
              <button 
                onClick={handleEditProfile}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Edit Profile
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={handleFollow}
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                isFollowing ? 
                'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' : 
                'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-80 max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Edit Profile</h3>
            
            <form className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avatar URL
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/avatar.jpg"
                  defaultValue={user?.avatarUrl}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Username"
                  defaultValue={user?.username}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tell us about yourself"
                  defaultValue={user?.bio}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="showBio" 
                  className="mr-2"
                  defaultChecked={user?.settings?.showBio}
                />
                <label htmlFor="showBio" className="text-sm text-gray-700 dark:text-gray-300">
                  Display bio on profile
                </label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button"
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>      )}

      {/* Follow Modal */}
      <FollowModal
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        userId={user?._id}
        type={modalType}
      />
    </div>
  );
};

export default ProfileHeader;
