// Engineering-reviewed expected outputs. Publisher source is reused from the
// existing owner fixtures; synthetic cases are explicitly labelled.
export const canonicalGoldens = [
  {
    id: 'lab-ordered-actions', layout: 'synthetic method segmentation contract',
    raw: 'Onion sauce\nServes 2\nIngredients\n1 tbsp oil\n2 onions\n1 garlic clove\n400g tomatoes\nMethod\nHeat the oil and cook the onions for five minutes then add the garlic and cook for another minute before adding the tomatoes.',
    expected: { name: 'Onion sauce', servings: '2', ingredients: ['1 tbsp oil', '2 onions', '1 garlic clove', '400g tomatoes'] },
    canonicalExpected: { steps: ['Heat the oil', 'Cook the onions for five minutes', 'Add the garlic and cook for another minute', 'Add the tomatoes.'] },
    defects: ['Preserve actions, times and order while removing paragraph walls.'], review: 'engineering-reviewed; owner acceptance pending',
  },
  {
    id: 'lab-decimals-and-heat', layout: 'synthetic decimal and abbreviation contract',
    raw: 'Roast carrots\nServes 2\nIngredients\n1.5 tbsp oil\n500g carrots\nMethod\nPreheat the oven to 180°C/160°C fan. Mix 1.5 tbsp. oil with the carrots. Roast for 20 minutes, stirring occasionally. Serve.',
    expected: { name: 'Roast carrots', servings: '2', ingredients: ['1.5 tbsp oil', '500g carrots'] },
    canonicalExpected: { steps: ['Preheat the oven to 180°C/160°C fan.', 'Mix 1.5 tbsp. oil with the carrots.', 'Roast for 20 minutes, stirring occasionally.', 'Serve.'] },
    defects: ['Decimal points, units and dual oven settings must survive.'], review: 'engineering-reviewed; owner acceptance pending',
  },
  {
    id: 'lab-groups-and-options', layout: 'synthetic ingredient groups contract',
    raw: 'Bean wraps\nServes 2\nIngredients\nFor the filling\n1 tin beans, drained\nFor the sauce\n100g yoghurt or cream\nTo serve:\n2 wraps\n1 lime (optional)\nMethod\nMix the beans and yoghurt in a bowl. Fill the wraps. Serve with lime.',
    expected: { name: 'Bean wraps', servings: '2', ingredients: ['1 tin beans, drained', '100g yoghurt or cream', '2 wraps', '1 lime (optional)'] },
    canonicalExpected: { steps: ['Mix the beans and yoghurt in a bowl.', 'Fill the wraps.', 'Serve with lime.'], groups: ['For the filling', 'For the sauce', 'To serve'] },
    defects: ['Alternative and optional ingredients retain original wording and groups.'], review: 'engineering-reviewed; owner acceptance pending',
  },
]

export const ownerPaneerSteps = [
  'Heat the oil in a deep frying pan over a medium heat.',
  'Add the onion and cook for 3-4 mins until soft.',
  'Stir through the ginger and garlic along with all the spices and chilli.',
  'Cook for 1-2 mins until fragrant',
  'Stir in the paneer and chickpeas.',
  'Add the coconut milk, spinach and stock.',
  'Bring to the boil',
  'Reduce to a simmer and cook for 20 mins until reduced and thickened.',
  'Stir through the mango chutney',
  'Season to taste with salt, pepper and the lemon juice.',
  'Serve with rice, fresh coriander on top and some sliced chilli, if you like.',
]
