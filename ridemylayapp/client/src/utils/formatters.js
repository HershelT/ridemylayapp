// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

// Format odds in American format
export const formatOdds = (odds) => {
  if (odds > 0) {
    return `+${odds}`;
  }
  return odds.toString();
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Format time
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

// Format date and time
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  }
  
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
  
  return formatDate(dateString);
};

// Calculate potential winnings from stake and odds
export const calculatePotentialWinnings = (stake, odds) => {
  const stakeAmount = parseFloat(stake) || 0;
  
  if (odds > 0) {
    return stakeAmount * (odds / 100);
  } else if (odds < 0) {
    return stakeAmount * (100 / Math.abs(odds));
  }
  
  return 0;
};

// Calculate parlay odds from individual leg odds
export const calculateParlayOdds = (legOdds) => {
  if (!legOdds || legOdds.length === 0) {
    return 0;
  }
  
  let decimalOdds = 1;
  
  legOdds.forEach(odds => {
    if (odds > 0) {
      decimalOdds *= (1 + odds / 100);
    } else if (odds < 0) {
      decimalOdds *= (1 + 100 / Math.abs(odds));
    }
  });
  
  // Convert back to American odds
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};
