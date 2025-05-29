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
  
  // Convert all legs to decimal and multiply
  const decimalOdds = legs.reduce((acc, leg) => {
    const legOdds = parseAmericanOdds(leg.odds);
    if (!legOdds) return acc;
    const decimal = convertAmericanToDecimal(legOdds);
    return acc * decimal;
  }, 1);

  // Convert back to American odds
  if (decimalOdds <= 1) return 0;
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  }
  return Math.round(-100 / (decimalOdds - 1));
};

export const calculateWinnings = (stake, odds) => {
  if (!odds || isNaN(stake) || stake <= 0) return 0;
  const decimalOdds = convertAmericanToDecimal(odds);
  if (!decimalOdds) return 0;
  return Number((stake * (decimalOdds - 1)).toFixed(2));
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
