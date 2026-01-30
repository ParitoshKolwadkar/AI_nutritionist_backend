const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

try {
  // Check if already initialized
  if (!admin.apps.length) {
    // Try to load service account from file - use __dirname for correct path
    const serviceAccountPath = path.join(__dirname, 'genuine-ember-454418-t1-56f0eec59f19.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId
      });
      console.log('✅ Firebase Admin initialized successfully');
      console.log(`✅ Firebase Admin projectId: ${projectId}`);
    } else {
      console.warn('⚠️ Firebase service account file not found at:', serviceAccountPath);
      console.warn('⚠️ Firebase features will be disabled.');
    }
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Routes
const nutritionRoutes = require('./routes/nutrition');
const mealPlanRoutes = require('./routes/mealPlan');
const healthProfileRoutes = require('./routes/healthProfile');
const foodAnalysisRoutes = require('./routes/foodAnalysis');
const voiceAssistantRoutes = require('./routes/voiceAssistant');
const workoutRoutes = require('./routes/workout');

app.use('/api/nutrition', nutritionRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/health-profile', healthProfileRoutes);
app.use('/api/food-analysis', foodAnalysisRoutes);
app.use('/api/voice-assistant', voiceAssistantRoutes);
app.use('/api/workout', workoutRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI Nutrition Assistant API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
