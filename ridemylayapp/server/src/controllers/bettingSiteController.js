const BettingSite = require('../models/BettingSite');
const logger = require('../utils/logger');

/**
 * @desc    Get all betting sites
 * @route   GET /api/betting-sites
 * @access  Public
 */
exports.getBettingSites = async (req, res, next) => {
  try {
    const { country, sport } = req.query;

    // Build query
    const query = { isActive: true };

    if (country) {
      query.countryAvailability = country;
    }

    if (sport) {
      query.supportedSports = sport;
    }

    const bettingSites = await BettingSite.find(query).sort('name');

    res.status(200).json({
      success: true,
      count: bettingSites.length,
      bettingSites
    });
  } catch (error) {
    logger.error('Get betting sites error:', error);
    next(error);
  }
};

/**
 * @desc    Get single betting site
 * @route   GET /api/betting-sites/:id
 * @access  Public
 */
exports.getBettingSite = async (req, res, next) => {
  try {
    const bettingSite = await BettingSite.findById(req.params.id);

    if (!bettingSite) {
      return res.status(404).json({
        success: false,
        error: 'Betting site not found'
      });
    }

    res.status(200).json({
      success: true,
      bettingSite
    });
  } catch (error) {
    logger.error(`Get betting site error for ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Create betting site (Admin only)
 * @route   POST /api/betting-sites
 * @access  Private/Admin
 */
exports.createBettingSite = async (req, res, next) => {
  try {
    const {
      name,
      logoUrl,
      websiteUrl,
      apiEndpoint,
      apiKey,
      supportedSports,
      bonusOffers,
      countryAvailability
    } = req.body;

    // Create betting site
    const bettingSite = await BettingSite.create({
      name,
      logoUrl,
      websiteUrl,
      apiEndpoint,
      apiKey,
      supportedSports,
      bonusOffers,
      countryAvailability
    });

    res.status(201).json({
      success: true,
      bettingSite
    });
  } catch (error) {
    logger.error('Create betting site error:', error);
    next(error);
  }
};

/**
 * @desc    Update betting site (Admin only)
 * @route   PUT /api/betting-sites/:id
 * @access  Private/Admin
 */
exports.updateBettingSite = async (req, res, next) => {
  try {
    const {
      name,
      logoUrl,
      websiteUrl,
      apiEndpoint,
      apiKey,
      supportedSports,
      bonusOffers,
      countryAvailability,
      isActive
    } = req.body;

    let bettingSite = await BettingSite.findById(req.params.id);

    if (!bettingSite) {
      return res.status(404).json({
        success: false,
        error: 'Betting site not found'
      });
    }

    // Update fields
    bettingSite.name = name || bettingSite.name;
    bettingSite.logoUrl = logoUrl || bettingSite.logoUrl;
    bettingSite.websiteUrl = websiteUrl || bettingSite.websiteUrl;
    bettingSite.apiEndpoint = apiEndpoint || bettingSite.apiEndpoint;
    
    if (apiKey) {
      bettingSite.apiKey = apiKey;
    }
    
    if (supportedSports) {
      bettingSite.supportedSports = supportedSports;
    }
    
    if (bonusOffers) {
      bettingSite.bonusOffers = bonusOffers;
    }
    
    if (countryAvailability) {
      bettingSite.countryAvailability = countryAvailability;
    }
    
    if (isActive !== undefined) {
      bettingSite.isActive = isActive;
    }

    // Save updates
    bettingSite = await bettingSite.save();

    res.status(200).json({
      success: true,
      bettingSite
    });
  } catch (error) {
    logger.error(`Update betting site error for ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Delete betting site (Admin only)
 * @route   DELETE /api/betting-sites/:id
 * @access  Private/Admin
 */
exports.deleteBettingSite = async (req, res, next) => {
  try {
    const bettingSite = await BettingSite.findById(req.params.id);

    if (!bettingSite) {
      return res.status(404).json({
        success: false,
        error: 'Betting site not found'
      });
    }

    await bettingSite.remove();

    res.status(200).json({
      success: true,
      message: 'Betting site deleted'
    });
  } catch (error) {
    logger.error(`Delete betting site error for ID ${req.params.id}:`, error);
    next(error);
  }
};
