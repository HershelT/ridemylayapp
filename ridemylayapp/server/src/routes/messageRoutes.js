const express = require('express');
const router = express.Router();
const { 
  getMessages, 
  sendMessage, 
  markMessagesAsRead, 
  deleteMessage 
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All message routes are protected
router.use(protect);

router.get('/:chatId', getMessages);
router.post('/', sendMessage);
router.put('/read/:chatId', markMessagesAsRead);
router.delete('/:id', deleteMessage);

module.exports = router;
