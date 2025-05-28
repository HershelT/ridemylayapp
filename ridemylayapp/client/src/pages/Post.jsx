import React from 'react';
import { motion } from 'framer-motion';
import CreateBetForm from '../components/bets/CreateBetForm';
import useAuthStore from '../store/authStore';
import { Navigate } from 'react-router-dom';

const Post = () => {
  const { isAuthenticated } = useAuthStore();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto py-6"
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create a New Bet</h1>
      <CreateBetForm />
    </motion.div>
  );
};
      updatedLegs[activeLegIndex] = { ...updatedLegs[activeLegIndex], betType };
      setBetForm({ ...betForm, legs: updatedLegs });
      setShowBetTypes(false);
      setActiveLegIndex(null);
    }
  };

  const handleInputChange = (e, field, index = null) => {
    if (index !== null) {
      const updatedLegs = [...betForm.legs];
      updatedLegs[index] = { ...updatedLegs[index], [field]: e.target.value };
      setBetForm({ ...betForm, legs: updatedLegs });
    } else {
      setBetForm({ ...betForm, [field]: e.target.value });
    }
  };

  const addLeg = () => {
    setBetForm({
      ...betForm,
      legs: [...betForm.legs, { team: '', betType: '', odds: '' }]
    });
  };

  const removeLeg = (index) => {
    const updatedLegs = [...betForm.legs];
    updatedLegs.splice(index, 1);
    setBetForm({ ...betForm, legs: updatedLegs });
  };

  const calculatePotentialWinnings = () => {
    const stake = parseFloat(betForm.stake) || 0;
    
    // Calculate combined odds for parlay
    let totalOdds = 1;
    betForm.legs.forEach(leg => {
      const legOdds = parseFloat(leg.odds) || 0;
      if (legOdds > 0) {
        totalOdds *= (1 + legOdds / 100);
      } else if (legOdds < 0) {
        totalOdds *= (1 + 100 / Math.abs(legOdds));
      }
    });
    
    const potentialWinnings = stake * totalOdds;
    return potentialWinnings.toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // TODO: Add validation
    
    console.log('Submitting bet:', betForm);
    
    // TODO: Submit to API
    // api.post('/api/bets', betForm)
    //   .then(response => {
    //     // Handle success
    //   })
    //   .catch(error => {
    //     // Handle error
    //   });
  };

  const getSelectedBettingSite = () => {
    return bettingSites.find(site => site._id === betForm.bettingSiteId);
  };

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-4">Create New Bet</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Betting Site Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Betting Site
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                onClick={() => setShowBettingSites(!showBettingSites)}
              >
                {getSelectedBettingSite() ? (
                  <div className="flex items-center">
                    <img 
                      src={getSelectedBettingSite().logoUrl} 
                      alt={getSelectedBettingSite().name} 
                      className="w-5 h-5 mr-2" 
                    />
                    <span>{getSelectedBettingSite().name}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Select a betting site</span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showBettingSites && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                  {bettingSites.map(site => (
                    <button
                      key={site._id}
                      type="button"
                      className="w-full flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleBettingSiteSelect(site._id)}
                    >
                      <img 
                        src={site.logoUrl} 
                        alt={site.name} 
                        className="w-5 h-5 mr-2" 
                      />
                      <span>{site.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Stake */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stake Amount ($)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              placeholder="Enter stake amount"
              value={betForm.stake}
              onChange={(e) => handleInputChange(e, 'stake')}
              min="1"
              step="0.01"
            />
          </div>
          
          {/* Legs */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Parlay Legs
            </label>
            
            {betForm.legs.map((leg, index) => (
              <div key={index} className="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Leg {index + 1}</h4>
                  {betForm.legs.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeLeg(index)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="mb-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    placeholder="Team or Player"
                    value={leg.team}
                    onChange={(e) => handleInputChange(e, 'team', index)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      onClick={() => {
                        setActiveLegIndex(index);
                        setShowBetTypes(!showBetTypes);
                      }}
                    >
                      {leg.betType ? (
                        <span>{leg.betType}</span>
                      ) : (
                        <span className="text-gray-500">Bet Type</span>
                      )}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {showBetTypes && activeLegIndex === index && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                        {betTypes.map((type, i) => (
                          <button
                            key={i}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => handleBetTypeSelect(type)}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="Odds (+/-)"
                      value={leg.odds}
                      onChange={(e) => handleInputChange(e, 'odds', index)}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-500"
              onClick={addLeg}
            >
              + Add Another Leg
            </button>
          </div>
          
          {/* Potential Winnings Preview */}
          {betForm.stake && betForm.legs.some(leg => leg.odds) && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
              <h4 className="font-medium mb-1">Potential Winnings</h4>
              <div className="flex justify-between">
                <div>
                  <div className="text-sm">Stake</div>
                  <div className="font-medium">${parseFloat(betForm.stake).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Potential Return</div>
                  <div className="font-medium">${calculatePotentialWinnings()}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-primary-500 text-white py-3 rounded-md font-medium hover:bg-primary-600"
          >
            Post Bet
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Post;
