const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// Analyze food from text description
router.post('/analyze-text', async (req, res) => {
  try {
    const { foodItems, userProfile } = req.body;
    
    if (!foodItems || !Array.isArray(foodItems)) {
      return res.status(400).json({ 
        error: 'Food items array is required' 
      });
    }

    if (!userProfile) {
      return res.status(400).json({ 
        error: 'User profile is required' 
      });
    }

    const analysis = await geminiService.generateNutritionAdvice(
      userProfile, 
      foodItems
    );
    
    res.json({ 
      success: true, 
      data: {
        analysis: analysis,
        foodItems: foodItems,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error analyzing food:', error);
    res.status(500).json({ 
      error: 'Failed to analyze food', 
      message: error.message 
    });
  }
});

// Get nutrition insights for a meal
router.post('/meal-insights', async (req, res) => {
  try {
    const { mealName, foodItems, userProfile } = req.body;
    
    if (!foodItems || !Array.isArray(foodItems)) {
      return res.status(400).json({ 
        error: 'Food items array is required' 
      });
    }

    if (!userProfile) {
      return res.status(400).json({ 
        error: 'User profile is required' 
      });
    }

    const prompt = `Analyze this ${mealName || 'meal'} and provide insights: ${foodItems.join(', ')}`;
    const insights = await geminiService.generateNutritionAdvice(
      userProfile, 
      foodItems
    );
    
    res.json({ 
      success: true, 
      data: {
        mealName: mealName || 'Meal',
        insights: insights,
        foodItems: foodItems,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting meal insights:', error);
    res.status(500).json({ 
      error: 'Failed to get meal insights', 
      message: error.message 
    });
  }
});

module.exports = router;
