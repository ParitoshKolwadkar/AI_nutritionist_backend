const { VertexAI } = require('@google-cloud/vertexai');

class VertexAIService {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    this.modelName = process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash';
    
    // Initialize Vertex AI with Google Cloud credentials
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location
    });
    
    // Get the generative model
    this.model = this.vertexAI.getGenerativeModel({
      model: this.modelName,
    });
  }

  async generateText(prompt, options = {}) {
    try {
      const generationConfig = {
        maxOutputTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        topP: options.topP || 1,
        topK: options.topK || 50,
      };

      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: generationConfig,
      };

      const result = await this.model.generateContent(request);
      const response = result.response;
      return response.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating text with Vertex AI:', error.message);
      throw new Error('Failed to generate response from Vertex AI');
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
module.exports = new VertexAIService();
