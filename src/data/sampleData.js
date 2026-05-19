export const weekPlan = [
  {
    day: 'Monday',
    meal: 'Lemon herb chicken bowls',
    note: 'Use the leftover rice in the fridge.',
  },
  {
    day: 'Tuesday',
    meal: 'Tomato basil pasta',
    note: 'Quick dinner before errands.',
  },
  {
    day: 'Wednesday',
    meal: 'Green veggie stir fry',
    note: 'Add cashews for crunch.',
  },
]

export const plannerDays = [
  {
    weekday: 'MON',
    date: '12',
    isToday: true,
    meals: {
      breakfast: [{ name: 'Greek Yogurt & Berries', icon: '🥣' }],
      lunch: [{ name: 'Chicken Sandwich', icon: '🥪' }],
      dinner: [
        { name: 'Spaghetti Bolognese', icon: '🍝' },
        { name: 'Garlic Bread', icon: '🥖' },
      ],
    },
  },
  {
    weekday: 'TUE',
    date: '13',
    meals: {
      breakfast: [{ name: 'Overnight Oats & Banana', icon: '🥣' }],
      lunch: [{ name: 'Tuna Salad Wrap', icon: '🌯' }],
      dinner: [{ name: 'Chicken Curry & Rice', icon: '🥣' }],
    },
  },
  {
    weekday: 'WED',
    date: '14',
    meals: {
      breakfast: [{ name: 'Porridge & Berries', icon: '🥣' }],
      lunch: [{ name: 'Tomato Soup & Toast', icon: '🍲' }],
      dinner: [{ name: 'Beef Tacos', icon: '🌮' }],
    },
  },
  {
    weekday: 'THU',
    date: '15',
    meals: {
      breakfast: [{ name: 'Smoothie', icon: '🥤' }],
      lunch: [{ name: 'Leftover Spaghetti', icon: '🥣' }],
      dinner: [
        { name: 'Salmon Fillet & Veg', icon: '🐟' },
        { name: 'Quinoa', icon: '🥣' },
      ],
    },
  },
  {
    weekday: 'FRI',
    date: '16',
    meals: {
      breakfast: [{ name: 'Scrambled Eggs & Toast', icon: '🍳' }],
      lunch: [{ name: 'Chicken Caesar Salad', icon: '🥗' }],
      dinner: [{ name: 'Vegetable Stir Fry', icon: '🍳' }],
    },
  },
  {
    weekday: 'SAT',
    date: '17',
    meals: {
      breakfast: [{ name: 'Pancakes & Maple Syrup', icon: '🥞' }],
      lunch: [{ name: 'BLT Sandwich', icon: '🥓' }],
      dinner: [{ name: 'Homemade Pizza', icon: '🍕' }],
    },
  },
  {
    weekday: 'SUN',
    date: '18',
    meals: {
      breakfast: [{ name: 'Fruit Salad', icon: '🍎' }],
      lunch: [{ name: 'BBQ Chicken Wrap', icon: '🌯' }],
      dinner: [{ name: 'Roast Chicken & Veg', icon: '🍗' }],
    },
  },
]

export const recipes = [
  {
    name: 'Spaghetti Bolognese',
    mealType: 'Dinner',
    time: '20 mins',
    servings: 4,
    description: 'Classic family favourite with rich beef sauce and tomato.',
    badges: ['Family Favourite'],
    image: '/recipe-images/spaghetti.svg',
    parsedIngredients: [
      { rawText: '500g beef mince', quantity: '500', unit: 'g', name: 'beef mince' },
      { rawText: '400g chopped tomatoes', quantity: '400', unit: 'g', name: 'chopped tomatoes' },
      { rawText: '1 onion', quantity: '1', unit: '', name: 'onion' },
      { rawText: '1 pack spaghetti', quantity: '1', unit: 'pack', name: 'spaghetti' },
    ],
  },
  {
    name: 'Chicken Curry',
    mealType: 'Dinner',
    time: '35 mins',
    servings: 4,
    description: 'Creamy coconut curry with tender chicken and warm spices.',
    badges: ['Medium Spice'],
    image: '/recipe-images/curry.svg',
    parsedIngredients: [
      { rawText: '500g chicken breast', quantity: '500', unit: 'g', name: 'chicken breast' },
      { rawText: '1 jar curry paste', quantity: '1', unit: 'jar', name: 'curry paste' },
      { rawText: '400ml coconut milk', quantity: '400', unit: 'ml', name: 'coconut milk' },
      { rawText: '1 pack rice', quantity: '1', unit: 'pack', name: 'rice' },
    ],
  },
  {
    name: 'Pancakes & Maple Syrup',
    mealType: 'Breakfast',
    time: '15 mins',
    servings: 2,
    description: 'Fluffy pancakes perfect for a weekend morning.',
    badges: ['Vegetarian'],
    image: '/recipe-images/pancakes.svg',
    parsedIngredients: [
      { rawText: '200g flour', quantity: '200', unit: 'g', name: 'flour' },
      { rawText: '2 eggs', quantity: '2', unit: '', name: 'eggs' },
      { rawText: '250ml milk', quantity: '250', unit: 'ml', name: 'milk' },
      { rawText: '1 tbsp maple syrup', quantity: '1', unit: 'tbsp', name: 'maple syrup' },
    ],
  },
  {
    name: 'Tuna Salad Wrap',
    mealType: 'Lunch',
    time: '10 mins',
    servings: 2,
    description: 'Quick and fresh lunch wrap with tuna and crunchy veggies.',
    badges: ['High Protein'],
    image: '/recipe-images/wrap.svg',
    parsedIngredients: [
      { rawText: '1 tin tuna', quantity: '1', unit: 'tin', name: 'tuna' },
      { rawText: '2 wraps', quantity: '2', unit: '', name: 'wraps' },
      { rawText: '1 lettuce', quantity: '1', unit: '', name: 'lettuce' },
      { rawText: '1 cucumber', quantity: '1', unit: '', name: 'cucumber' },
    ],
  },
  {
    name: 'Salmon Fillet & Veg',
    mealType: 'Dinner',
    time: '25 mins',
    servings: 2,
    description: 'Easy baked salmon with garlic and roasted vegetables.',
    badges: ['High Protein'],
    image: '/recipe-images/salmon.svg',
    parsedIngredients: [
      { rawText: '2 salmon fillets', quantity: '2', unit: '', name: 'salmon fillets' },
      { rawText: '1 garlic clove', quantity: '1', unit: 'clove', name: 'garlic' },
      { rawText: '300g mixed vegetables', quantity: '300', unit: 'g', name: 'mixed vegetables' },
      { rawText: '1 tbsp olive oil', quantity: '1', unit: 'tbsp', name: 'olive oil' },
    ],
  },
]

export const shoppingItems = [
  'Chicken breast',
  'Lemons',
  'Fresh basil',
  'Cherry tomatoes',
  'Broccoli',
  'Cashews',
  'Brown rice',
]

export const shoppingGroups = [
  {
    name: 'Fresh Produce',
    color: 'green',
    items: [
      {
        name: 'Onions',
        quantity: '2',
        note: 'For bolognese and curry',
        checked: true,
      },
      { name: 'Garlic', quantity: '1 bulb', checked: false },
      { name: 'Bananas', quantity: '4', checked: true },
    ],
  },
  {
    name: 'Meat & Fish',
    color: 'red',
    items: [
      { name: 'Chicken Breast', quantity: '2 packs', checked: false },
      { name: 'Beef Mince', quantity: '500g', checked: false },
      {
        name: 'Salmon Fillet',
        quantity: '2 fillets',
        note: 'Use within two days',
        checked: false,
      },
    ],
  },
  {
    name: 'Dairy',
    color: 'amber',
    items: [
      { name: 'Milk', quantity: '1 litre', checked: false },
      { name: 'Greek Yogurt', quantity: '1 tub', checked: true },
    ],
  },
  {
    name: 'Pantry',
    color: 'violet',
    items: [
      { name: 'Spaghetti', quantity: '1 pack', checked: false },
      { name: 'Curry Paste', quantity: '1 jar', checked: false },
    ],
  },
  {
    name: 'Frozen',
    color: 'blue',
    items: [
      { name: 'Mixed Vegetables', quantity: '1 bag', checked: false },
      { name: 'Frozen Berries', quantity: '1 bag', checked: false },
    ],
  },
]
