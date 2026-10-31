export const recipes = [
  {
    name: 'Spaghetti Bolognese',
    mealType: 'Dinner',
    time: '20 mins',
    servings: 4,
    description: 'Classic family favourite with rich beef sauce and tomato.',
    badges: ['Family Favourite'],
    method:
      '1. Soften the chopped onion in a large pan. Add the mince and cook until browned.\n2. Stir in the tomatoes and simmer gently until the sauce is rich. Season to taste.\n3. Cook the spaghetti following the packet instructions. Drain, toss with the sauce and serve.',
    image: '/food/pasta.jpg',
    parsedIngredients: [
      {
        rawText: '500g beef mince',
        quantity: '500',
        unit: 'g',
        name: 'beef mince',
      },
      {
        rawText: '400g chopped tomatoes',
        quantity: '400',
        unit: 'g',
        name: 'chopped tomatoes',
      },
      { rawText: '1 onion', quantity: '1', unit: '', name: 'onion' },
      {
        rawText: '1 pack spaghetti',
        quantity: '1',
        unit: 'pack',
        name: 'spaghetti',
      },
    ],
  },
  {
    name: 'Chicken Curry',
    mealType: 'Dinner',
    time: '35 mins',
    servings: 4,
    description: 'Creamy coconut curry with tender chicken and warm spices.',
    badges: ['Medium Spice'],
    method:
      '1. Cut the chicken into bite-sized pieces and brown in a large pan.\n2. Stir in the curry paste, then the coconut milk. Simmer until the chicken is cooked through.\n3. Cook the rice following the packet instructions and serve with the curry.',
    image: '/food/curry.jpg',
    parsedIngredients: [
      {
        rawText: '500g chicken breast',
        quantity: '500',
        unit: 'g',
        name: 'chicken breast',
      },
      {
        rawText: '1 jar curry paste',
        quantity: '1',
        unit: 'jar',
        name: 'curry paste',
      },
      {
        rawText: '400ml coconut milk',
        quantity: '400',
        unit: 'ml',
        name: 'coconut milk',
      },
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
    method:
      '1. Whisk the flour, eggs and milk into a smooth batter.\n2. Cook small ladlefuls in a lightly greased frying pan, turning when bubbles appear.\n3. Stack and drizzle with maple syrup.',
    image: '/food/pancakes.jpg',
    parsedIngredients: [
      { rawText: '200g flour', quantity: '200', unit: 'g', name: 'flour' },
      { rawText: '2 eggs', quantity: '2', unit: '', name: 'eggs' },
      { rawText: '250ml milk', quantity: '250', unit: 'ml', name: 'milk' },
      {
        rawText: '1 tbsp maple syrup',
        quantity: '1',
        unit: 'tbsp',
        name: 'maple syrup',
      },
    ],
  },
  {
    name: 'Tuna Salad Wrap',
    mealType: 'Lunch',
    time: '10 mins',
    servings: 2,
    description: 'Quick and fresh lunch wrap with tuna and crunchy veggies.',
    method:
      '1. Drain the tuna. Wash and chop the lettuce and cucumber.\n2. Divide between the wraps, fold in the sides and roll up firmly.',
    badges: ['High Protein'],
    image: '/food/wrap.jpg',
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
    method:
      '1. Heat the oven to 200°C / 180°C fan. Toss the vegetables with the oil and crushed garlic in a roasting tray.\n2. Roast until nearly tender, then add the salmon and cook until the fish is cooked through. Serve straight from the tray.',
    badges: ['High Protein'],
    image: '/food/salmon.jpg',
    parsedIngredients: [
      {
        rawText: '2 salmon fillets',
        quantity: '2',
        unit: '',
        name: 'salmon fillets',
      },
      {
        rawText: '1 garlic clove',
        quantity: '1',
        unit: 'clove',
        name: 'garlic',
      },
      {
        rawText: '300g mixed vegetables',
        quantity: '300',
        unit: 'g',
        name: 'mixed vegetables',
      },
      {
        rawText: '1 tbsp olive oil',
        quantity: '1',
        unit: 'tbsp',
        name: 'olive oil',
      },
    ],
  },
  {
    name: 'Chicken Fajitas',
    mealType: 'Dinner',
    time: '25 mins',
    servings: 4,
    description:
      'Colourful peppers, gently spiced chicken and warm wraps. A help-yourself family favourite.',
    badges: ['Family Favourite'],
    image: '/food/fajitas.jpg',
    ingredients:
      '500g chicken breast\n3 peppers\n1 onion\n8 tortilla wraps\n2 tsp smoked paprika\n1 tbsp olive oil',
    method:
      '1. Slice the chicken, peppers and onion into strips.\n2. Heat the oil in a large pan. Cook the chicken, then add the peppers, onion and paprika. Cook until the chicken is cooked through and the vegetables are tender.\n3. Warm the wraps and let everyone fill their own.',
  },
  {
    name: 'Jacket Potatoes',
    mealType: 'Dinner',
    time: '1 hr',
    servings: 4,
    description:
      'Crisp skins, fluffy middles and your favourite toppings. Simple comfort food.',
    badges: ['Vegetarian'],
    icon: '🥔',
    ingredients:
      '4 baking potatoes\n20g butter\n150g cheddar cheese\n400g baked beans',
    method:
      '1. Heat the oven to 220°C / 200°C fan. Scrub and prick the potatoes.\n2. Bake until the skins are crisp and the centres are soft, about an hour depending on size.\n3. Warm the beans, split the potatoes and top with butter, cheese and beans.',
  },
  {
    name: 'Homemade Pizza',
    mealType: 'Dinner',
    time: '30 mins',
    servings: 4,
    description: 'A Friday favourite. Let everyone choose their own toppings.',
    badges: ['Family Favourite', 'Vegetarian'],
    image: '/food/pizza.jpg',
    ingredients:
      '2 pizza bases\n200g passata\n200g mozzarella\n1 pepper\n1 tsp dried oregano',
    method:
      '1. Heat the oven following the pizza-base packet instructions.\n2. Spread the passata over the bases. Add torn mozzarella, sliced pepper and oregano.\n3. Bake until the bases are crisp and the cheese is bubbling.',
  },
  {
    name: 'Roast Chicken',
    mealType: 'Dinner',
    time: '1 hr 30',
    servings: 4,
    description:
      'A comforting weekend roast, with plenty of vegetables around the table.',
    badges: ['Family Favourite'],
    image: '/food/roast.jpg',
    ingredients:
      '1 whole chicken\n800g potatoes\n4 carrots\n1 onion\n2 tbsp olive oil',
    method:
      '1. Heat the oven to 200°C / 180°C fan. Put the chicken in a roasting tray, drizzle with a little oil and season.\n2. Roast following the chicken’s weight and packet instructions. Add the prepared potatoes, carrots and onion to a separate oiled tray.\n3. Check the chicken is cooked through, rest before carving and serve with the roasted vegetables.',
  },
]
