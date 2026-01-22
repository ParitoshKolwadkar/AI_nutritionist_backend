const axios = require('axios');

class WatsonxService {
  constructor() {
    this.apiKey = process.env.IBM_WATSONX_API_KEY;
    this.projectId = process.env.IBM_WATSONX_PROJECT_ID;
    this.url = process.env.IBM_WATSONX_URL || 'https://us-south.ml.cloud.ibm.com';
    this.modelId = process.env.WATSONX_MODEL_ID || 'ibm/granite-13b-chat-v2';
    this.token = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Check if token is still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(
        'https://iam.cloud.ibm.com/identity/token',
        new URLSearchParams({
          grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
          apikey: this.apiKey
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.token = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
      return this.token;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with IBM Cloud');
    }
  }

  async generateText(prompt, options = {}) {
    try {
      const token = await this.getAccessToken();

      const payload = {
        model_id: this.modelId,
        input: prompt,
        parameters: {
          max_new_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
          top_k: options.topK || 50,
          repetition_penalty: options.repetitionPenalty || 1.1
        },
        project_id: this.projectId
      };

      const response = await axios.post(
        `${this.url}/ml/v1/text/generation?version=2023-05-29`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return response.data.results[0].generated_text;
    } catch (error) {
      console.error('Error generating text:', error.response?.data || error.message);
      throw new Error('Failed to generate response from Watsonx AI');
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
For each food: **Original** → **Better Choice** with brief reason
3. Nutritional comparison
4. How to make the transition easier

Make it practical and achievable.`;

    return await this.generateText(prompt, { maxTokens: 1500 });
  }
}

module.exports = new WatsonxService();
