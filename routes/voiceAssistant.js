const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const nutritionDataService = require('../services/nutritionDataService');

/**
 * Voice Assistant API
 * Handles natural language commands from voice assistant
 */

router.post('/', async (req, res) => {
  try {
    const { prompt, agentName, intent, payload } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`[Voice Assistant] Processing ${intent} for ${agentName}`);

    // For nutrition logging, get data from database/AI directly (no conversational response)
    if (intent === 'nutrition_log' && payload.foods && payload.foods.length > 0) {
      try {
        const nutritionData = await nutritionDataService.getNutritionForMultipleFoods(payload.foods);
        
        // Return ONLY macro data, no conversation
        return res.json({
          success: true,
          response: `Logged ${payload.foods.join(', ')}!`,
          data: nutritionData,
          intent: intent,
          agentName: agentName
        });
      } catch (error) {
        console.error('Error getting nutrition data:', error);
        // Return error response instead of falling through
        return res.json({
          success: false,
          response: `Sorry, I couldn't get nutrition data for ${payload.foods.join(', ')}. Please try again.`,
          data: null,
          intent: intent,
          agentName: agentName,
          error: error.message
        });
      }
    }
    
    // For workout logging
    if (intent === 'workout_log' && payload.workouts && payload.workouts.length > 0) {
      try {
        // Return success for workout logging - actual saving happens in workout route
        return res.json({
          success: true,
          response: `Great workout! I've logged your exercises.`,
          data: { workouts: payload.workouts },
          intent: intent,
          agentName: agentName
        });
      } catch (error) {
        console.error('Error processing workout:', error);
        return res.json({
          success: false,
          response: `Sorry, I couldn't log your workout. Please try again.`,
          data: null,
          intent: intent,
          agentName: agentName,
          error: error.message
        });
      }
    }

    // For other intents, use conversational AI
    const geminiResponse = await geminiService.generateText(prompt);

    res.json({
      success: true,
      response: geminiResponse,
      data: {},
      intent: intent,
      agentName: agentName
    });

  } catch (error) {
    console.error('Error in voice assistant:', error);
    res.status(500).json({ 
      error: 'Failed to process voice command',
      message: error.message 
    });
  }
});

module.exports = router;
