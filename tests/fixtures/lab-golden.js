// Engineering-reviewed expected outputs. Publisher source is reused from the
// existing owner fixtures; synthetic cases are explicitly labelled.
export const canonicalGoldens = [
  {
    id: 'lab-ordered-actions',
    layout: 'synthetic method segmentation contract',
    raw: 'Onion sauce\nServes 2\nIngredients\n1 tbsp oil\n2 onions\n1 garlic clove\n400g tomatoes\nMethod\nHeat the oil and cook the onions for five minutes then add the garlic and cook for another minute before adding the tomatoes.',
    expected: {
      name: 'Onion sauce',
      servings: '2',
      ingredients: [
        '1 tbsp oil',
        '2 onions',
        '1 garlic clove',
        '400g tomatoes',
      ],
    },
    canonicalExpected: {
      steps: [
        'Heat the oil',
        'Cook the onions for five minutes',
        'Add the garlic and cook for another minute',
        'Add the tomatoes.',
      ],
    },
    defects: [
      'Preserve actions, times and order while removing paragraph walls.',
    ],
    review: 'engineering-reviewed; owner acceptance pending',
  },
  {
    id: 'lab-decimals-and-heat',
    layout: 'synthetic decimal and abbreviation contract',
    raw: 'Roast carrots\nServes 2\nIngredients\n1.5 tbsp oil\n500g carrots\nMethod\nPreheat the oven to 180°C/160°C fan. Mix 1.5 tbsp. oil with the carrots. Roast for 20 minutes, stirring occasionally. Serve.',
    expected: {
      name: 'Roast carrots',
      servings: '2',
      ingredients: ['1.5 tbsp oil', '500g carrots'],
    },
    canonicalExpected: {
      steps: [
        'Preheat the oven to 180°C/160°C fan.',
        'Mix 1.5 tbsp. oil with the carrots.',
        'Roast for 20 minutes, stirring occasionally.',
        'Serve.',
      ],
    },
    defects: ['Decimal points, units and dual oven settings must survive.'],
    review: 'engineering-reviewed; owner acceptance pending',
  },
  {
    id: 'lab-groups-and-options',
    layout: 'synthetic ingredient groups contract',
    raw: 'Bean wraps\nServes 2\nIngredients\nFor the filling\n1 tin beans, drained\nFor the sauce\n100g yoghurt or cream\nTo serve:\n2 wraps\n1 lime (optional)\nMethod\nMix the beans and yoghurt in a bowl. Fill the wraps. Serve with lime.',
    expected: {
      name: 'Bean wraps',
      servings: '2',
      ingredients: [
        '1 tin beans, drained',
        '100g yoghurt or cream',
        '2 wraps',
        '1 lime (optional)',
      ],
    },
    canonicalExpected: {
      steps: [
        'Mix the beans and yoghurt in a bowl.',
        'Fill the wraps.',
        'Serve with lime.',
      ],
      groups: ['For the filling', 'For the sauce', 'To serve'],
    },
    defects: [
      'Alternative and optional ingredients retain original wording and groups.',
    ],
    review: 'engineering-reviewed; owner acceptance pending',
  },
]

export const ownerPaneerSteps = [
  'Heat the oil in a deep frying pan over a medium heat.',
  'Add the onion and cook for 3-4 mins until soft.',
  'Stir through the ginger and garlic along with all the spices and chilli.',
  'Cook for 1-2 mins until fragrant',
  'Stir in the paneer and chickpeas.',
  'Add the coconut milk, spinach and stock.',
  'Bring to the boil then reduce to a simmer and cook for 20 mins until reduced and thickened.',
  'Stir through the mango chutney then season to taste with salt, pepper and the lemon juice.',
  'Serve with rice, fresh coriander on top and some sliced chilli, if you like.',
]

export const ownerExpectedSteps = {
  'owner-paneer-phone': ownerPaneerSteps,
  'owner-curry-plain': [
    'Heat the oil in a sauté pan',
    'Gently fry the curry paste with the onions, lemongrass, cardamom and mustard seed for 2-3 mins until fragrant.',
    'Stir the pumpkin or squash into the pan and coat in the paste, then pour in the stock and coconut milk.',
    'Bring everything to a simmer, add the chickpeas, then cook for about 10 mins until the pumpkin is tender. The curry can now be cooled and frozen for up to 1 month.',
    'Squeeze the juice of one lime into the curry',
    'Cut the other lime into wedges to serve alongside.',
    'Just before serving, tear over mint leaves, then bring to the table with the lime wedges and warm naan breads.',
  ],
  'owner-sprouts-two-tab-phone': [
    'In a bowl, whisk the egg with 1 tsp water, then season with a pinch of salt.',
    'Set a wok or high-sided frying pan over a medium-high heat. Have all your ingredients portioned out next to the wok in the order of cooking.',
    'Add 1 tbsp oil to the pan and, when shimmering, add the seasoned egg and cook for 1 minute, folding the edges in, until just set. Using a spatula, break the egg into smaller pieces, then quickly transfer from the wok to a small bowl and set aside.',
    'Add 1 tbsp oil to the wok and increase the heat to high.',
    'Tip in the sprouts and cook for 1 minute until lightly charred, then flip and cook for 1 minute more.',
    'Add the garlic and salad onion whites, sprinkle over the mushroom seasoning, then stir fry for about 30 seconds (move quickly so the garlic doesn’t burn) until smelling sweet and aromatic.',
    'Add 2 tbsp water and the soy sauce, turn the heat down to medium and let everything steam for 2 minutes, until the liquid evaporates and the sprouts soften.',
    'Turn the heat back to high, add the remaining oil, then quickly add the sliced pigs in blankets and cooked egg, stir frying as you go.',
    'Tip in the rice, pour over the oyster and chilli and garlic sauces, then toss everything together over a high heat for 2 minutes, until the rice is piping hot and everything is well combined.',
    'Add most of the salad onion greens and toss together. Finish with the remaining salad onion greens and a splash more oyster sauce and chilli and garlic sauce, if you like.',
    'Serve immediately.',
  ],
}
