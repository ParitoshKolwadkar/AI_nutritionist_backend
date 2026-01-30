const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || 'AIzaSyCvth_gRdzgiqQpNvgSNEcxxIFCf6s_Onw';
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    
    if (!this.apiKey) {
      console.warn('Warning: GOOGLE_GEMINI_API_KEY not set in .env, using default key');
    }
  }

  async generateText(prompt, options = {}) {
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
        
        const requestBody = {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            topK: options.topK || 50,
            topP: options.topP || 1,
            maxOutputTokens: options.maxTokens || 1000,
          }
        };

        const response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        });

        // Extract text from response
        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
          const candidate = response.data.candidates[0];
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            return candidate.content.parts[0].text;
          }
        }

        throw new Error('No valid response from Gemini API');
      } catch (error) {
        const isOverloaded = error.response?.data?.error?.code === 503 || 
                            error.response?.data?.error?.status === 'UNAVAILABLE';
        const isRateLimited = error.response?.data?.error?.code === 429;
        
        // If overloaded or rate limited and not last attempt, retry
        if ((isOverloaded || isRateLimited) && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Gemini API overloaded. Retrying in ${delay/1000}s... (Attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Log error and throw
        console.error('Error generating text with Gemini:', error.response?.data || error.message);
        
        if (isOverloaded || isRateLimited) {
          throw new Error('Gemini API is currently overloaded. Please try again in a few moments.');
        }
        
        throw new Error('Failed to generate response from Gemini AI');
      }
    }
  }

  async generateNutritionAdvice(userProfile, foodItems) {
    const prompt = `You are an expert AI nutritionist from Cwrazzy Log(x), helping the team members Hardik, Paritosh, and Rohan achieve their health goals.

CRITICAL INSTRUCTIONS:
- Do NOT include phrases like "Here's a response", "Based on your profile", "Let me analyze", or any introductory text
- Start DIRECTLY with the analysis using markdown formatting
- Use proper markdown: ## for headings, ** for bold, - for lists
- Be concise, direct, and professional

User Profile:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Goal: ${userProfile.goal}
- Activity Level: ${userProfile.activityLevel}
- Dietary Restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Health Conditions: ${userProfile.healthConditions?.join(', ') || 'None'}

Food Items: ${foodItems.join(', ')}

Provide markdown-formatted analysis with these sections:
## Nutritional Breakdown
## Alignment with Your Goals
## Key Insights
## Healthier Alternatives
## Portion Recommendations

Start immediately with "## Nutritional Breakdown"`;

    return await this.generateText(prompt, { maxTokens: 1500 });
  }

  async generateMealPlan(userProfile, preferences = {}) {
    const prompt = `You are an expert AI nutritionist from Cwrazzy Log(x), creating meal plans for team members Hardik, Paritosh, and Rohan.

CRITICAL INSTRUCTIONS:
- Do NOT include introductions like "Here's your meal plan", "I'll create", "Let me", or any conversational starters
- Start DIRECTLY with "# 🍽️ Your ${preferences.duration || 7}-Day Meal Plan"
- Use proper markdown formatting: # for main title, ## for day headings, ### for meal times, ** for bold, - for lists
- Be professional, direct, and well-structured
- if the user adds non edible items, ignore them and do not mention them in the meal plan

User Profile:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Goal: ${userProfile.goal}
- Activity Level: ${userProfile.activityLevel}
- Dietary Restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Health Conditions: ${userProfile.healthConditions?.join(', ') || 'None'}

Preferences:
- Meals: ${preferences.mealsPerDay || 3} per day
- Duration: ${preferences.duration || 7} days
- Cuisines: ${preferences.cuisinePreferences?.join(', ') || 'Any'}

Create markdown-formatted meal plan with:
- ## Day 1, Day 2, etc.
- ### Breakfast, ### Lunch, ### Dinner
- Include specific dishes, portions, and approximate calories
- End with ## 🛒 Shopping List and ## 💡 Meal Prep Tips

Start immediately with the title.`;

    return await this.generateText(prompt, { maxTokens: 2000 });
  }

  async analyzeFoodImage(imageDescription, userProfile) {
    const prompt = `You are an AI nutritionist from Cwrazzy Log(x).

CRITICAL: Start DIRECTLY with "## Food Identification" - no introductions.

Image: "${imageDescription}"

User Goal: ${userProfile.goal}
Restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
Allergies: ${userProfile.allergies?.join(', ') || 'None'}

Provide markdown analysis:
## Food Identification
## Nutritional Content
## Health Assessment
## Recommendations
## Portion Guidance`;

    return await this.generateText(prompt, { maxTokens: 1200 });
  }

  async explainFoodChoice(foodItem, comparison, userProfile) {
    const prompt = `You are an AI nutritionist from Cwrazzy Log(x).

CRITICAL: Start DIRECTLY with "## ${foodItem} vs ${comparison}" - no intro text.

User Goal: ${userProfile.goal}
Conditions: ${userProfile.healthConditions?.join(', ') || 'None'}

Provide markdown comparison:
## ${foodItem} vs ${comparison}
## Nutritional Comparison
## Impact on Your Goals
## Final Recommendation`;

    return await this.generateText(prompt, { maxTokens: 1000 });
  }

  async generateSmartFoodSwaps(currentFoods, userProfile) {
    const prompt = `You are an AI nutritionist from Cwrazzy Log(x).

CRITICAL: Start DIRECTLY with "## Smart Food Swaps" - no intro.

Foods: ${currentFoods.join(', ')}
Goal: ${userProfile.goal}
Restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}

Provide markdown swaps:
## Smart Food Swaps
For each food: **Original** → **Better Choice** with brief reason`;

    return await this.generateText(prompt, { maxTokens: 1200 });
  }
}

// Export singleton instance
module.exports = new GeminiService();
