const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// Generate personalized meal plan
router.post('/generate', async (req, res) => {
  try {
    const { userProfile, preferences } = req.body;
    
    if (!userProfile) {
      return res.status(400).json({ error: 'User profile is required' });
    }

    const mealPlan = await geminiService.generateMealPlan(userProfile, preferences);
    
    res.json({ 
      success: true, 
      data: {
        mealPlan: mealPlan,
        generatedAt: new Date().toISOString(),
        duration: preferences?.duration || 7,
        mealsPerDay: preferences?.mealsPerDay || 3
      }
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ 
      error: 'Failed to generate meal plan', 
      message: error.message 
    });
  }
});

// Get smart food swaps
router.post('/food-swaps', async (req, res) => {
  try {
    const { currentFoods, userProfile } = req.body;
    
    if (!currentFoods || !Array.isArray(currentFoods)) {
      return res.status(400).json({ error: 'Current foods array is required' });
    }

    if (!userProfile) {
      return res.status(400).json({ error: 'User profile is required' });
    }

    const swaps = await geminiService.generateSmartFoodSwaps(currentFoods, userProfile);
    
    res.json({ 
      success: true, 
      data: {
        swaps: swaps,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating food swaps:', error);
    res.status(500).json({ 
      error: 'Failed to generate food swaps', 
      message: error.message 
    });
  }
});

// Explain food choice
router.post('/explain', async (req, res) => {
  try {
    const { foodItem, comparison, userProfile } = req.body;
    
    if (!foodItem || !comparison) {
      return res.status(400).json({ 
        error: 'Both foodItem and comparison are required' 
      });
    }

    if (!userProfile) {
      return res.status(400).json({ error: 'User profile is required' });
    }

    const explanation = await geminiService.explainFoodChoice(
      foodItem, 
      comparison, 
      userProfile
    );
    
    res.json({ 
      success: true, 
      data: {
        explanation: explanation,
        foodItem: foodItem,
        comparison: comparison,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error explaining food choice:', error);
    res.status(500).json({ 
      error: 'Failed to explain food choice', 
      message: error.message 
    });
  }
});

module.exports = router;
