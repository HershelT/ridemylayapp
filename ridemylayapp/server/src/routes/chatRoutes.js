const express = require('express');
const router = express.Router();
const { 
  getUserChats, 
  accessChat, 
  createGroupChat, 
  updateGroupChat, 
  addToGroup, 
  removeFromGroup 
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All chat routes are protected
router.use(protect);

router.get('/', getUserChats);
router.post('/', accessChat);
router.post('/group', createGroupChat);
router.put('/group/:id', updateGroupChat);
router.put('/group/:id/add', addToGroup);
router.put('/group/:id/remove', removeFromGroup);

module.exports = router;
