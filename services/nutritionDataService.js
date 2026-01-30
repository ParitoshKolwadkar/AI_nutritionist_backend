const geminiService = require('./geminiService');

class NutritionDataService {
  constructor() {
    this.foodDatabase = {};
  }

  normalizeFoodName(foodName) {
    return foodName.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  async getNutritionData(foodName) {
    // Always fetch from AI directly (no database check)
    console.log(`🤖 Fetching nutrition data for "${foodName}" from AI`);
    const nutritionData = await this.fetchNutritionFromAI(foodName);

    return nutritionData;
  }

  async fetchNutritionFromAI(foodName) {
    try {
      const prompt = `Provide ONLY nutritional information for: "${foodName}"

Return ONLY a JSON object with this EXACT structure (no explanation, no markdown, just JSON):
{
  "name": "food name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "serving": "description"
}

Rules:
- Use standard serving size (e.g., "1 medium apple", "100g", "1 cup", "1 slice") 
- If the user specifies quantity (like "1 kg", "2 plates"), calculate nutrition for that amount
- If there are foods which contain multiple items like "chicken sandwich with fries" then provide nutrition for the entire item as a whole, not separately
- All macro values in grams (except calories)
- Use realistic estimates based on common serving sizes, your data should be from a verified source of nutrition information
- For dishes like biryani, curry, etc., provide nutrition for the complete dish, not individual ingredients
- Return ONLY the JSON object, nothing else - no backticks, no markdown`;

      const response = await geminiService.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      console.log('🔍 AI Response received:', response.substring(0, 200));

      // Try multiple methods to extract JSON
      let nutritionData = null;
      
      // Method 1: Direct JSON match
      let jsonMatch = response.match(/\{[\s\S]*?\}/);
      
      // Method 2: Try to find JSON in code blocks
      if (!jsonMatch) {
        const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonMatch = codeBlockMatch[1].match(/\{[\s\S]*?\}/);
        }
      }
      
      // Method 3: Clean up response and try parsing
      if (!jsonMatch) {
        // Remove common prefixes/suffixes
        const cleaned = response
          .replace(/^[\s\S]*?(\{)/m, '{')
          .replace(/\}[\s\S]*$/m, '}')
          .trim();
        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
          jsonMatch = [cleaned];
        }
      }
      
      if (!jsonMatch) {
        console.error('❌ Could not extract JSON from response:', response);
        throw new Error('No JSON found in AI response');
      }

      try {
        nutritionData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // Try to fix common JSON issues
        let fixedJson = jsonMatch[0]
          .replace(/'/g, '"')  // Single quotes to double
          .replace(/(\w+):/g, '"$1":')  // Unquoted keys
          .replace(/,\s*}/g, '}')  // Trailing commas
          .replace(/,\s*]/g, ']');
        
        try {
          nutritionData = JSON.parse(fixedJson);
        } catch (e) {
          console.error('❌ Failed to parse even after fixing:', jsonMatch[0]);
          throw new Error('Invalid JSON in AI response');
        }
      }

      // Validate data structure
      return {
        name: nutritionData.name || foodName,
        calories: parseFloat(nutritionData.calories) || 0,
        protein: parseFloat(nutritionData.protein) || 0,
        carbs: parseFloat(nutritionData.carbs) || 0,
        fat: parseFloat(nutritionData.fat) || 0,
        serving: nutritionData.serving || '1 serving',
        source: 'ai',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching nutrition from AI:', error.message);
      throw new Error(`Failed to get nutrition data from AI: ${error.message}`);
    }
  }

  async getNutritionForMultipleFoods(foodNames) {
    const results = await Promise.all(
      foodNames.map(foodName => this.getNutritionData(foodName))
    );

    // Calculate totals
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    results.forEach(food => {
      totals.calories += food.calories;
      totals.protein += food.protein;
      totals.carbs += food.carbs;
      totals.fat += food.fat;
    });

    return {
      foods: results,
      totals: totals
    };
  }
}

module.exports = new NutritionDataService();
