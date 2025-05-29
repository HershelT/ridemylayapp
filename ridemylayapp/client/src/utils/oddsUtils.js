export const parseAmericanOdds = (oddsStr) => {
  if (!oddsStr || oddsStr === '-' || oddsStr === '+') return null;
  
  // Handle the plus sign explicitly
  if (oddsStr.startsWith('+')) {
    const num = parseInt(oddsStr.substring(1));
    return isNaN(num) ? null : num;
  }
  
  // Handle negative numbers
  if (oddsStr.startsWith('-')) {
    const num = -parseInt(oddsStr.substring(1));
    return isNaN(num) ? null : num;
  }
  
  // Handle plain numbers (treated as positive)
  const num = parseInt(oddsStr);
  return isNaN(num) ? null : num;
};

export const convertAmericanToDecimal = (americanOdds) => {
  if (typeof americanOdds !== 'number') return null;
  return americanOdds > 0 
    ? (americanOdds / 100.0) + 1.0 
    : (100.0 / Math.abs(americanOdds)) + 1.0;
};

export const calculateParlayOdds = (legs) => {
  if (!legs?.length) return 0;
  
  // Validate all legs have valid odds first
  const validLegs = legs.filter(leg => leg.odds && leg.odds.trim() !== '' && leg.odds !== '-' && leg.odds !== '+');
  if (validLegs.length === 0) return 0;
  if (validLegs.length < legs.length) return 0; // Don't calculate if any leg is invalid
  
  // Convert all legs to decimal and multiply
  const decimalOdds = validLegs.reduce((acc, leg) => {
    const legOdds = parseAmericanOdds(leg.odds);
    if (!legOdds) return acc;
    const decimal = convertAmericanToDecimal(legOdds);
    return decimal ? acc * decimal : acc;
  }, 1);

  // Convert back to American odds with proper rounding
  if (decimalOdds <= 1) return 0;
  if (decimalOdds >= 2) {
    const americanOdds = (decimalOdds - 1) * 100;
    return Math.round(americanOdds);
  }
  const americanOdds = -100 / (decimalOdds - 1);
  return Math.round(americanOdds);
};

export const calculateWinnings = (stake, odds) => {
  if (!odds || isNaN(stake) || stake <= 0) return 0;
  
  // Convert odds to decimal format
  const decimalOdds = convertAmericanToDecimal(odds);
  if (!decimalOdds) return 0;
  
  // Calculate winnings with more precision
  const winnings = stake * (decimalOdds - 1);
  
  // Return formatted to 2 decimal places
  return Number(Math.round(winnings * 100) / 100);
};

export const calculateImpliedProbability = (odds) => {
  if (!odds) return 0;
  return odds > 0
    ? (100 / (odds + 100))
    : (Math.abs(odds) / (Math.abs(odds) + 100));
};

export const validateOdds = (odds) => {
  const parsed = parseAmericanOdds(odds);
  if (!parsed) return false;
  if (parsed > 10000 || parsed < -10000) return false; // Reasonable limits
  return true;
};
