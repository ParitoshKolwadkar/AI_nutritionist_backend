const express = require('express');
const router = express.Router();

// In-memory storage (in production, use a database)
const healthProfiles = new Map();

// Create or update health profile
router.post('/', (req, res) => {
  try {
    const profile = req.body;
    
    // Validate required fields
    const required = ['userId', 'age', 'gender', 'weight', 'height', 'activityLevel', 'goal'];
    const missing = required.filter(field => !profile[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missing: missing 
      });
    }

    // Add timestamp
    profile.updatedAt = new Date().toISOString();
    
    // Store profile
    healthProfiles.set(profile.userId, profile);
    
    res.json({ 
      success: true, 
      message: 'Health profile saved successfully',
      data: profile 
    });
  } catch (error) {
    console.error('Error saving health profile:', error);
    res.status(500).json({ 
      error: 'Failed to save health profile', 
      message: error.message 
    });
  }
});

// Get health profile
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const profile = healthProfiles.get(userId);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Health profile not found',
        message: 'Please create a health profile first'
      });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error getting health profile:', error);
    res.status(500).json({ 
      error: 'Failed to get health profile', 
      message: error.message 
    });
  }
});

// Update specific fields
router.patch('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const profile = healthProfiles.get(userId);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Health profile not found' 
      });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        profile[key] = updates[key];
      }
    });

    profile.updatedAt = new Date().toISOString();
    healthProfiles.set(userId, profile);
    
    res.json({ 
      success: true, 
      message: 'Health profile updated successfully',
      data: profile 
    });
  } catch (error) {
    console.error('Error updating health profile:', error);
    res.status(500).json({ 
      error: 'Failed to update health profile', 
      message: error.message 
    });
  }
});

// Delete health profile
router.delete('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!healthProfiles.has(userId)) {
      return res.status(404).json({ 
        error: 'Health profile not found' 
      });
    }

    healthProfiles.delete(userId);
    
    res.json({ 
      success: true, 
      message: 'Health profile deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting health profile:', error);
    res.status(500).json({ 
      error: 'Failed to delete health profile', 
      message: error.message 
    });
  }
});

module.exports = router;
