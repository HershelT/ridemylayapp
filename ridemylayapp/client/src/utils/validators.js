// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  
  if (password.length < 8) {
    return { 
      valid: false, 
      message: 'Password must be at least 8 characters long' 
    };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one number' 
    };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one uppercase letter' 
    };
  }
  
  return { valid: true, message: 'Password is valid' };
};

// Validate username
export const validateUsername = (username) => {
  if (!username) return { valid: false, message: 'Username is required' };
  
  if (username.length < 3) {
    return { 
      valid: false, 
      message: 'Username must be at least 3 characters long' 
    };
  }
  
  if (username.length > 20) {
    return { 
      valid: false, 
      message: 'Username must be at most 20 characters long' 
    };
  }
  
  // Check for valid characters (letters, numbers, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { 
      valid: false, 
      message: 'Username can only contain letters, numbers, underscores, and hyphens' 
    };
  }
  
  return { valid: true, message: 'Username is valid' };
};

// Validate bet data
export const validateBet = (betData) => {
  const { bettingSiteId, stake, legs } = betData;
  
  if (!bettingSiteId) {
    return { valid: false, message: 'Please select a betting site' };
  }
  
  if (!stake || parseFloat(stake) <= 0) {
    return { valid: false, message: 'Please enter a valid stake amount' };
  }
  
  if (!legs || legs.length === 0) {
    return { valid: false, message: 'Please add at least one leg to your bet' };
  }
  
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    
    if (!leg.team || leg.team.trim() === '') {
      return { valid: false, message: `Please enter a team for leg ${i + 1}` };
    }
    
    if (!leg.betType || leg.betType.trim() === '') {
      return { valid: false, message: `Please select a bet type for leg ${i + 1}` };
    }
    
    if (!leg.odds || isNaN(leg.odds)) {
      return { valid: false, message: `Please enter valid odds for leg ${i + 1}` };
    }
  }
  
  return { valid: true, message: 'Bet is valid' };
};

// Check if URL is valid
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};
