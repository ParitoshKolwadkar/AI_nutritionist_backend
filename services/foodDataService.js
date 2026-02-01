const { MongoClient } = require('mongodb');
require('dotenv').config();

class FoodDataService {
  constructor() {
    this.db = null;
    this.collection = null;
    this.connectToMongoDB();
  }

  async connectToMongoDB() {
    try {
      console.log('📡 Connecting to MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      
      this.db = client.db('nutritionist');
      this.collection = this.db.collection('foods');
      
      const count = await this.collection.countDocuments();
      console.log(`✅ Connected to MongoDB - ${count} food items available`);
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error.message);
    }
  }

  async searchFoods(query, limit = 20) {
    if (!this.collection) {
      return [];
    }

    try {
      const searchTerm = query.toLowerCase();
      const results = await this.collection
        .find({
          description: { $regex: searchTerm, $options: 'i' }
        })
        .limit(limit)
        .toArray();

      return results.map(food => this.formatFoodItem(food));
    } catch (error) {
      console.error('Error searching foods:', error.message);
      return [];
    }
  }

  async getFoodById(fdcId) {
    if (!this.collection) {
      return null;
    }

    try {
      const food = await this.collection.findOne({ fdcId: parseInt(fdcId) });
      return food ? this.formatFoodItem(food) : null;
    } catch (error) {
      console.error('Error getting food by ID:', error.message);
      return null;
    }
  }

  formatFoodItem(food) {
    const nutrients = {};
    
    if (food.foodNutrients) {
      food.foodNutrients.forEach(nutrient => {
        if (nutrient.nutrient) {
          nutrients[nutrient.nutrient.name] = {
            amount: nutrient.amount || 0,
            unit: nutrient.nutrient.unitName || 'g'
          };
        }
      });
    }

    return {
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      category: food.foodCategory?.description || 'Unknown',
      nutrients: nutrients,
      servingSize: food.servingSize || 100,
      servingSizeUnit: food.servingSizeUnit || 'g'
    };
  }

  getNutrientValue(food, nutrientName) {
    if (!food.nutrients || !food.nutrients[nutrientName]) {
      return 0;
    }
    return food.nutrients[nutrientName].amount || 0;
  }

  calculateNutrition(foods, servings = []) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    foods.forEach((food, index) => {
      const serving = servings[index] || 1;
      const multiplier = serving * (food.servingSize / 100);

      totalCalories += this.getNutrientValue(food, 'Energy') * multiplier;
      totalProtein += this.getNutrientValue(food, 'Protein') * multiplier;
      totalCarbs += this.getNutrientValue(food, 'Carbohydrate, by difference') * multiplier;
      totalFat += this.getNutrientValue(food, 'Total lipid (fat)') * multiplier;
      totalFiber += this.getNutrientValue(food, 'Fiber, total dietary') * multiplier;
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbohydrates: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10
    };
  }

  getRecommendedCalories(userProfile) {
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (userProfile.gender === 'male') {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5;
    } else {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };

    const tdee = bmr * (activityMultipliers[userProfile.activityLevel] || 1.55);

    // Adjust based on goal
    let targetCalories = tdee;
    if (userProfile.goal === 'weight_loss') {
      targetCalories = tdee - 500; // 500 calorie deficit
    } else if (userProfile.goal === 'weight_gain') {
      targetCalories = tdee + 500; // 500 calorie surplus
    }

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      macros: this.calculateMacros(targetCalories, userProfile.goal)
    };
  }

  calculateMacros(calories, goal) {
    let proteinRatio, carbRatio, fatRatio;

    switch (goal) {
      case 'weight_loss':
        proteinRatio = 0.35;
        carbRatio = 0.35;
        fatRatio = 0.30;
        break;
      case 'weight_gain':
        proteinRatio = 0.30;
        carbRatio = 0.45;
        fatRatio = 0.25;
        break;
      case 'muscle_gain':
        proteinRatio = 0.35;
        carbRatio = 0.40;
        fatRatio = 0.25;
        break;
      default: // maintenance
        proteinRatio = 0.30;
        carbRatio = 0.40;
        fatRatio = 0.30;
    }

    return {
      protein: Math.round((calories * proteinRatio) / 4), // 4 cal per gram
      carbohydrates: Math.round((calories * carbRatio) / 4),
      fat: Math.round((calories * fatRatio) / 9) // 9 cal per gram
    };
  }

  async getSimilarFoods(fdcId, limit = 5) {
    if (!this.collection) {
      return [];
    }

    try {
      const targetFood = await this.getFoodById(fdcId);
      if (!targetFood) {
        return [];
      }

      const similar = await this.collection
        .find({
          fdcId: { $ne: parseInt(fdcId) },
          'foodCategory.description': targetFood.category
        })
        .limit(limit)
        .toArray();

      return similar.map(food => this.formatFoodItem(food));
    } catch (error) {
      console.error('Error getting similar foods:', error.message);
      return [];
    }
  }
}

module.exports = new FoodDataService();
