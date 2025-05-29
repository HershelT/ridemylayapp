// Simple helper to process the replyToUserId consistently across the app
export const processReplyToUserId = (replyToUserId) => {
  if (!replyToUserId) return null;
  
  // Handle MongoDB extended JSON format or populated user object
  return replyToUserId?.$oid || 
         (replyToUserId._id ? replyToUserId._id.$oid || replyToUserId._id : replyToUserId);
};
