import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaMinus, FaTimes } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import { betAPI, bettingSiteAPI } from '../../services/api';

const CreateBetForm = ({ existingBet, isEditing, isRiding }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
    // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stake: '',
    odds: '',
    sport: '',
    bettingSiteId: '',
    legs: [{ team: '', betType: 'moneyline', odds: '', outcome: 'pending' }]
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bettingSites, setBettingSites] = useState([]);
  const [potentialWinnings, setPotentialWinnings] = useState(0);
  
  // Pre-fill form with existing bet data if editing or riding
  useEffect(() => {
    if (existingBet) {
      const betData = {
        title: isEditing ? existingBet.title : `Riding: ${existingBet.title}`,
        description: isEditing ? existingBet.description : `Riding ${existingBet.userId.username}'s bet`,
        stake: isEditing ? existingBet.stake.toString() : '',
        odds: existingBet.odds.toString(),
        sport: existingBet.sport,
        bettingSiteId: existingBet.bettingSiteId._id || existingBet.bettingSiteId,
        legs: existingBet.legs.map(leg => ({
          team: leg.team,
          betType: leg.betType,
          odds: leg.odds.toString(),
          outcome: isRiding ? 'pending' : leg.outcome
        }))
      };
      
      setFormData(betData);
    }
  }, [existingBet, isEditing, isRiding]);
  
  // Fetch betting sites on component mount
  useEffect(() => {
    const loadBettingSites = async () => {
      try {
        const response = await bettingSiteAPI.getBettingSites();
        setBettingSites(response.data.bettingSites);
        
        // Set default betting site if user has preferences
        if (user?.preferredBettingSites?.length > 0) {
          setFormData(prev => ({
            ...prev,
            bettingSiteId: user.preferredBettingSites[0]
          }));
        } else if (response.data.bettingSites.length > 0) {
          setFormData(prev => ({
            ...prev,
            bettingSiteId: response.data.bettingSites[0]._id
          }));
        }
      } catch (error) {
        setError('Failed to load betting sites');
      }
    };
    
    loadBettingSites();
  }, [user]);
  
  // Calculate potential winnings when stake or odds change
  useEffect(() => {
    const calculateWinnings = () => {
      const stake = parseFloat(formData.stake) || 0;
      const odds = parseFloat(formData.odds) || 0;
      
      let winnings = 0;
      
      // American odds calculation
      if (odds > 0) {
        // Positive odds (underdog)
        winnings = stake * (odds / 100);
      } else if (odds < 0) {
        // Negative odds (favorite)
        winnings = stake * (100 / Math.abs(odds));
      }
      
      setPotentialWinnings(stake + winnings);
    };
    
    calculateWinnings();
  }, [formData.stake, formData.odds]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle leg changes
  const handleLegChange = (index, field, value) => {
    const updatedLegs = [...formData.legs];
    updatedLegs[index] = {
      ...updatedLegs[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      legs: updatedLegs
    }));
  };
  
  // Add a new leg
  const addLeg = () => {
    setFormData(prev => ({
      ...prev,
      legs: [...prev.legs, { team: '', betType: 'moneyline', odds: '', outcome: 'pending' }]
    }));
  };
  
  // Remove a leg
  const removeLeg = (index) => {
    if (formData.legs.length === 1) return; // Keep at least one leg
    
    const updatedLegs = formData.legs.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      legs: updatedLegs
    }));
  };
    // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate form
      if (!formData.title || !formData.stake || !formData.odds || !formData.sport || !formData.bettingSiteId) {
        throw new Error('Please fill in all required fields');
      }
      
      // Validate legs
      for (const leg of formData.legs) {
        if (!leg.team || !leg.betType || !leg.odds) {
          throw new Error('Please fill in all leg details');
        }
      }
      
      const betPayload = {
        ...formData,
        stake: parseFloat(formData.stake),
        odds: parseFloat(formData.odds),
        potentialWinnings: potentialWinnings,
        legs: formData.legs.map(leg => ({
          ...leg,
          odds: parseFloat(leg.odds)
        }))
      };
      
      let response;
      
      if (isEditing && existingBet) {
        // Update existing bet
        response = await betAPI.updateBet(existingBet._id, betPayload);
      } else if (isRiding && existingBet) {
        // Create a new bet as a ride of an existing bet
        response = await betAPI.createBet({
          ...betPayload,
          isRide: true,
          originalBetId: existingBet._id
        });
      } else {
        // Create a new bet
        response = await betAPI.createBet(betPayload);
      }
      
      // Navigate to the created/updated bet page
      if (response.data && (response.data.bet || response.data._id)) {
        const betId = response.data.bet?._id || response.data._id;
        navigate(`/bets/${betId}`);
      } else {
        throw new Error('Failed to create/update bet');
      }
      navigate(`/bets/${response.data.bet._id}`);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to create bet');
    } finally {
      setLoading(false);
    }
  };
  
  const sportOptions = [
    { value: 'football', label: 'Football' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'baseball', label: 'Baseball' },
    { value: 'hockey', label: 'Hockey' },
    { value: 'soccer', label: 'Soccer' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'golf', label: 'Golf' },
    { value: 'mma', label: 'MMA' },
    { value: 'other', label: 'Other' }
  ];
  
  const betTypeOptions = [
    { value: 'moneyline', label: 'Moneyline' },
    { value: 'spread', label: 'Spread' },
    { value: 'over', label: 'Over' },
    { value: 'under', label: 'Under' },
    { value: 'prop', label: 'Prop' }
  ];
  
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create a New Bet</h2>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Bet Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title*
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="E.g., NFL Sunday Parlay"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sport*
              </label>
              <select
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select a sport</option>
                {sportOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Describe your bet..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stake Amount ($)*
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="stake"
                value={formData.stake}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Odds*
              </label>
              <input
                type="number"
                name="odds"
                value={formData.odds}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="E.g., -110, +150"
                required
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                Use American odds format (e.g., -110, +200)
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Potential Winnings ($)
              </label>
              <input
                type="text"
                readOnly
                value={potentialWinnings.toFixed(2)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Betting Site*
            </label>
            <select
              name="bettingSiteId"
              value={formData.bettingSiteId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select a betting site</option>
              {bettingSites.map(site => (
                <option key={site._id} value={site._id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Bet Legs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bet Legs</h3>
              <button
                type="button"
                onClick={addLeg}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 focus:outline-none"
              >
                <FaPlus className="mr-1" />
                Add Leg
              </button>
            </div>
            
            {formData.legs.map((leg, index) => (
              <div 
                key={index} 
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    Leg {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeLeg(index)}
                    disabled={formData.legs.length === 1}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Team/Player*
                    </label>
                    <input
                      type="text"
                      value={leg.team}
                      onChange={(e) => handleLegChange(index, 'team', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="E.g., Kansas City Chiefs"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bet Type*
                    </label>
                    <select
                      value={leg.betType}
                      onChange={(e) => handleLegChange(index, 'betType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      {betTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Odds*
                    </label>
                    <input
                      type="number"
                      value={leg.odds}
                      onChange={(e) => handleLegChange(index, 'odds', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="E.g., -110, +150"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
            <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isEditing ? 'Updating...' : isRiding ? 'Riding...' : 'Creating...') 
                : (isEditing ? 'Update Bet' : isRiding ? 'Ride This Bet' : 'Create Bet')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateBetForm;
