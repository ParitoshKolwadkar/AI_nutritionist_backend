const express = require('express');
const router = express.Router();
const foodDataService = require('../services/foodDataService');

// Search foods
router.get('/search', async (req, res) => {
  try {
    const { query, limit } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await foodDataService.searchFoods(query, parseInt(limit) || 20);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('Error searching foods:', error);
    res.status(500).json({ error: 'Failed to search foods', message: error.message });
  }
});

// Get food by ID
router.get('/:fdcId', async (req, res) => {
  try {
    const { fdcId } = req.params;
    const food = await foodDataService.getFoodById(fdcId);
    
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }

    res.json({ success: true, data: food });
  } catch (error) {
    console.error('Error getting food:', error);
    res.status(500).json({ error: 'Failed to get food details', message: error.message });
  }
});

// Get similar foods
router.get('/:fdcId/similar', async (req, res) => {
  try {
    const { fdcId } = req.params;
    const { limit } = req.query;
    
    const similar = await foodDataService.getSimilarFoods(fdcId, parseInt(limit) || 5);
    res.json({ success: true, data: similar, count: similar.length });
  } catch (error) {
    console.error('Error getting similar foods:', error);
    res.status(500).json({ error: 'Failed to get similar foods', message: error.message });
  }
});

// Calculate nutrition for multiple foods
router.post('/calculate', async (req, res) => {
  try {
    const { foodIds, servings } = req.body;
    
    if (!foodIds || !Array.isArray(foodIds)) {
      return res.status(400).json({ error: 'Food IDs array is required' });
    }

    const foodPromises = foodIds.map(id => foodDataService.getFoodById(id));
    const foodsWithNulls = await Promise.all(foodPromises);
    const foods = foodsWithNulls.filter(f => f);
    const nutrition = foodDataService.calculateNutrition(foods, servings);
    
    res.json({ success: true, data: nutrition });
  } catch (error) {
    console.error('Error calculating nutrition:', error);
    res.status(500).json({ error: 'Failed to calculate nutrition', message: error.message });
  }
});

// Get recommended calories and macros
router.post('/recommendations', (req, res) => {
  try {
    const userProfile = req.body;
    
    // Validate required fields
    const required = ['age', 'gender', 'weight', 'height', 'activityLevel', 'goal'];
    const missing = required.filter(field => !userProfile[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missing: missing 
      });
    }

    const recommendations = foodDataService.getRecommendedCalories(userProfile);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations', message: error.message });
  }
});

module.exports = router;
