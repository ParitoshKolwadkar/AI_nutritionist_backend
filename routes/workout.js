const express = require('express');
const router = express.Router();

// Firebase admin - import it, check initialization at runtime
let admin;
try {
  admin = require('firebase-admin');
} catch (error) {
  console.warn('⚠️ firebase-admin module not available:', error.message);
}

// Helper function to check if Firebase is initialized (called at runtime)
const isFirebaseReady = () => {
  return admin && admin.apps && admin.apps.length > 0;
};

// Exercise calorie burn rates (calories per rep - research-based values)
// Based on average 70kg person, adjusted by user profile later
const CALORIE_RATES = {
  squat: 0.5,           // Compound movement, high calorie burn
  bench: 0.45,          // Upper body compound
  deadlift: 0.65,       // Full body, highest calorie burn
  pushup: 0.4,          // Bodyweight compound
  pullup: 0.7,          // Challenging bodyweight movement
  shoulderpress: 0.4,   // Overhead pressing
  lateralraise: 0.25,   // Isolation movement
  lunge: 0.5            // Single leg compound
};

/**
 * POST /api/workout/calculate-calories
 * Calculate calories burned from workout data using AI
 */
router.post('/calculate-calories', async (req, res) => {
  try {
    const { userId, workouts, userProfile } = req.body;

    if (!workouts || workouts.length === 0) {
      return res.status(400).json({ 
        error: 'No workout data provided' 
      });
    }

    console.log('💪 Calculating calories for workout:', workouts);
    console.log('👤 User profile received:', userProfile);

    // Calculate base calories using standard rates
    let totalCalories = 0;
    const workoutDetails = workouts.map(workout => {
      const caloriesForExercise = (CALORIE_RATES[workout.exercise] || 0.3) * workout.reps;
      totalCalories += caloriesForExercise;
      
      return {
        exercise: workout.name,
        reps: workout.reps,
        estimatedCalories: Math.round(caloriesForExercise * 10) / 10
      };
    });

    // Adjust calories based on user profile
    if (userProfile) {
      console.log('🔄 Adjusting calories based on user profile...');
      
      // Weight factor: Heavier people burn more calories
      const weightFactor = userProfile.weight ? (userProfile.weight / 70) : 1; // 70kg as baseline
      
      // Activity level multiplier
      const activityMultiplier = {
        'sedentary': 0.9,
        'lightly_active': 1.0,
        'moderately_active': 1.1,
        'very_active': 1.2,
        'extremely_active': 1.3
      };
      
      const activityFactor = activityMultiplier[userProfile.activityLevel] || 1.0;
      
      // Age factor: Younger people tend to burn slightly more
      let ageFactor = 1.0;
      if (userProfile.age) {
        if (userProfile.age < 25) ageFactor = 1.05;
        else if (userProfile.age > 50) ageFactor = 0.95;
      }
      
      // Gender factor: Men typically burn more calories
      const genderFactor = userProfile.gender === 'male' ? 1.1 : 1.0;
      
      totalCalories = totalCalories * weightFactor * activityFactor * ageFactor * genderFactor;
      
      console.log(`📊 Factors - Weight: ${weightFactor.toFixed(2)}x, Activity: ${activityFactor}x, Age: ${ageFactor}x, Gender: ${genderFactor}x`);
      console.log(`🔥 Base calories: ${totalCalories.toFixed(1)}`);
    }

    // Use formula-only calculation (no AI)
    const finalCalories = Math.round(totalCalories);
    console.log('🔥 Final calories to save (formula only):', finalCalories);

    // Client-side handles Firebase writes (same path as dashboard reads: users/{userId}/nutrition/{date})
    // Backend only calculates and returns the calorie value

    res.json({
      totalCalories: finalCalories,
      workoutDetails,
      message: 'Workout completed successfully!'
    });

  } catch (error) {
    console.error('Error calculating calories:', error);
    res.status(500).json({ 
      error: 'Failed to calculate calories',
      message: error.message 
    });
  }
});

/**
 * GET /api/workout/history
 * Get workout history for a user
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, startDate, endDate, limit = 30 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!admin) {
      return res.status(503).json({ error: 'Firebase not available' });
    }

    const db = admin.firestore();
    let query = db.collection('users')
      .doc(userId)
      .collection('workouts')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    const snapshot = await query.get();
    const workouts = [];

    snapshot.forEach(doc => {
      workouts.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      });
    });

    res.json({ workouts });

  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workout history',
      message: error.message 
    });
  }
});

/**
 * GET /api/workout/stats
 * Get workout statistics for a user
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId, period = '30' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!admin) {
      return res.status(503).json({ error: 'Firebase not available' });
    }

    const db = admin.firestore();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const snapshot = await db.collection('users')
      .doc(userId)
      .collection('workouts')
      .where('timestamp', '>=', daysAgo)
      .get();

    let totalCalories = 0;
    let totalWorkouts = 0;
    const exerciseStats = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      totalCalories += data.totalCalories || 0;
      totalWorkouts++;

      // Aggregate exercise stats
      if (data.workouts) {
        data.workouts.forEach(workout => {
          if (!exerciseStats[workout.exercise]) {
            exerciseStats[workout.exercise] = {
              totalReps: 0,
              totalCalories: 0,
              count: 0
            };
          }
          exerciseStats[workout.exercise].totalReps += workout.reps;
          exerciseStats[workout.exercise].totalCalories += workout.estimatedCalories;
          exerciseStats[workout.exercise].count++;
        });
      }
    });

    res.json({
      period: parseInt(period),
      totalCalories,
      totalWorkouts,
      averageCaloriesPerWorkout: totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0,
      exerciseStats
    });

  } catch (error) {
    console.error('Error fetching workout stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workout statistics',
      message: error.message 
    });
  }
});

module.exports = router;
