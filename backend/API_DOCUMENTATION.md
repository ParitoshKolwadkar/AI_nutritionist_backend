# Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, the API does not require authentication. In production, implement JWT or OAuth2 authentication.

---

## Health Profile Endpoints

### Create or Update Profile
**POST** `/health-profile`

Creates a new health profile or updates an existing one.

**Request Body:**
```json
{
  "userId": "user123",
  "age": 30,
  "gender": "male",
  "weight": 75,
  "height": 175,
  "activityLevel": "moderate",
  "goal": "weight_loss",
  "dietaryRestrictions": ["vegetarian"],
  "allergies": ["peanuts"],
  "healthConditions": ["diabetes"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Health profile saved successfully",
  "data": { /* profile object */ }
}
```

### Get Profile
**GET** `/health-profile/:userId`

Retrieves a user's health profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "age": 30,
    // ... other profile fields
  }
}
```

---

## Nutrition Endpoints

### Search Foods
**GET** `/nutrition/search?query=chicken&limit=20`

Search for foods in the USDA database.

**Query Parameters:**
- `query` (required): Search term
- `limit` (optional): Number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fdcId": 171477,
      "description": "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
      "category": "Poultry Products",
      "nutrients": {
        "Energy": { "amount": 165, "unit": "kcal" },
        "Protein": { "amount": 31, "unit": "g" }
      },
      "servingSize": 100,
      "servingSizeUnit": "g"
    }
  ],
  "count": 1
}
```

### Get Food Details
**GET** `/nutrition/:fdcId`

Get detailed information about a specific food.

**Response:**
```json
{
  "success": true,
  "data": {
    "fdcId": 171477,
    "description": "Chicken breast",
    "nutrients": { /* detailed nutrients */ }
  }
}
```

### Calculate Nutrition
**POST** `/nutrition/calculate`

Calculate total nutrition for multiple foods.

**Request Body:**
```json
{
  "foodIds": [171477, 169238],
  "servings": [1, 2]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "calories": 450,
    "protein": 55,
    "carbohydrates": 30,
    "fat": 12,
    "fiber": 5
  }
}
```

### Get Recommendations
**POST** `/nutrition/recommendations`

Get personalized calorie and macro recommendations.

**Request Body:**
```json
{
  "age": 30,
  "gender": "male",
  "weight": 75,
  "height": 175,
  "activityLevel": "moderate",
  "goal": "weight_loss"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bmr": 1650,
    "tdee": 2557,
    "targetCalories": 2057,
    "macros": {
      "protein": 180,
      "carbohydrates": 180,
      "fat": 68
    }
  }
}
```

---

## Meal Plan Endpoints

### Generate Meal Plan
**POST** `/meal-plan/generate`

Generate an AI-powered personalized meal plan.

**Request Body:**
```json
{
  "userProfile": {
    "age": 30,
    "gender": "male",
    "weight": 75,
    "height": 175,
    "goal": "weight_loss",
    "activityLevel": "moderate",
    "dietaryRestrictions": ["vegetarian"],
    "allergies": [],
    "healthConditions": []
  },
  "preferences": {
    "duration": 7,
    "mealsPerDay": 3,
    "cuisinePreferences": ["Indian", "Mediterranean"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mealPlan": "Day 1:\n\nBreakfast:\n- Oatmeal with berries...",
    "generatedAt": "2025-01-15T10:30:00.000Z",
    "duration": 7,
    "mealsPerDay": 3
  }
}
```

### Get Food Swaps
**POST** `/meal-plan/food-swaps`

Get healthier alternatives for current foods.

**Request Body:**
```json
{
  "currentFoods": ["white rice", "butter", "regular pasta"],
  "userProfile": { /* user profile object */ }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swaps": "1. White Rice → Brown Rice or Quinoa\nWhy: Higher fiber...",
    "generatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Explain Food Choice
**POST** `/meal-plan/explain`

Get AI explanation comparing two food options.

**Request Body:**
```json
{
  "foodItem": "sweet potato",
  "comparison": "regular potato",
  "userProfile": { /* user profile object */ }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "explanation": "Sweet potato vs Regular potato:\n\n1. Nutritional Comparison...",
    "foodItem": "sweet potato",
    "comparison": "regular potato",
    "generatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Food Analysis Endpoints

### Analyze Food (Text)
**POST** `/food-analysis/analyze-text`

Analyze food items from text description.

**Request Body:**
```json
{
  "foodItems": ["grilled chicken", "brown rice", "steamed broccoli"],
  "userProfile": { /* user profile object */ }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "Nutritional Analysis:\n\n1. Grilled Chicken Breast...",
    "foodItems": ["grilled chicken", "brown rice", "steamed broccoli"],
    "analyzedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Analyze Food (Image)
**POST** `/food-analysis/analyze-image`

Analyze food from image description.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image`: File (optional)
- `imageDescription`: String (required)
- `userProfile`: JSON string (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "Based on the image description...",
    "analyzedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Get Meal Insights
**POST** `/food-analysis/meal-insights`

Get comprehensive insights for a meal.

**Request Body:**
```json
{
  "mealName": "Lunch",
  "foodItems": ["salmon", "quinoa", "asparagus"],
  "userProfile": { /* user profile object */ }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mealName": "Lunch",
    "insights": "Your lunch analysis:\n\nNutritional Breakdown...",
    "foodItems": ["salmon", "quinoa", "asparagus"],
    "analyzedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (missing or invalid parameters)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

Currently, there are no rate limits. In production, implement rate limiting using packages like `express-rate-limit`.

---

## Data Models

### User Profile
```typescript
{
  userId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // in kg
  height: number; // in cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'general_health';
  dietaryRestrictions?: string[];
  allergies?: string[];
  healthConditions?: string[];
  updatedAt?: string;
}
```

### Food Item
```typescript
{
  fdcId: number;
  description: string;
  dataType: string;
  category: string;
  nutrients: {
    [nutrientName: string]: {
      amount: number;
      unit: string;
    }
  };
  servingSize: number;
  servingSizeUnit: string;
}
```

---

## Testing the API

### Using cURL

**Search Foods:**
```bash
curl "http://localhost:5000/api/nutrition/search?query=chicken&limit=5"
```

**Create Profile:**
```bash
curl -X POST http://localhost:5000/api/health-profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "age": 30,
    "gender": "male",
    "weight": 75,
    "height": 175,
    "activityLevel": "moderate",
    "goal": "weight_loss"
  }'
```

### Using Postman

1. Import the collection (create a Postman collection with the endpoints above)
2. Set base URL to `http://localhost:5000/api`
3. Test each endpoint with sample data

---

## Best Practices

1. **Always include user profile** when making AI-powered requests
2. **Handle errors gracefully** in your client application
3. **Cache food search results** to reduce API calls
4. **Validate input** on client side before sending requests
5. **Use appropriate timeouts** for AI-powered endpoints (may take 10-20 seconds)

---

## IBM Watsonx Integration

The following endpoints use IBM Watsonx AI:
- `/meal-plan/generate`
- `/meal-plan/food-swaps`
- `/meal-plan/explain`
- `/food-analysis/analyze-text`
- `/food-analysis/analyze-image`
- `/food-analysis/meal-insights`

**Note:** These endpoints may take 10-20 seconds to respond as they make calls to IBM Watsonx AI service.

---

For more information, see the main [README.md](../README.md)
