// Specific product families precede broad ingredient keywords. A sauce made
// with garlic belongs with sauces; mushroom seasoning belongs with spices.
// Exact aliases deliberately avoid turning every product containing a food
// word (or every household oil) into a grocery item of that type.
const productFamilies = [
  { category: 'Pantry / Tins / Dry Goods', aliases: ['chopped tomatoes', 'tinned tomatoes', 'canned tomatoes'],
    baseNames: ['tomato', 'tomatoes'], sourcePhrases: ['chopped tomato', 'tinned tomato', 'canned tomato'] },
  { category: 'Condiments & Sauces', types: ['sauce', 'chutney', 'paste', 'dressing', 'relish', 'mayonnaise', 'ketchup', 'pesto', 'vinegar'] },
  { category: 'Herbs & Spices', types: ['seasoning', 'spice mix', 'spice blend', 'masala'] },
  { category: 'Oils & Cooking', aliases: ['groundnut oil', 'peanut oil', 'sesame oil', 'rapeseed oil', 'avocado oil', 'coconut oil'] },
  { category: 'Dairy & Eggs', aliases: ['paneer', 'halloumi', 'feta'] },
  { category: 'Meat & Fish', aliases: ['pigs in blankets', 'cooked pigs in blankets'] },
  { category: 'Fresh Produce', aliases: ['ginger', 'fresh ginger', 'chilli', 'chili', 'red chilli', 'green chilli', 'red chili', 'green chili', 'brussels sprouts', 'brussel sprouts', 'coriander', 'coriander leaves', 'mint', 'mint leaves', 'lemongrass', 'aubergine', 'eggplant'] },
]

export function getSpecificShoppingCategory(name, source = '') {
  return productFamilies.find((family) => family.aliases?.includes(name) ||
    (family.baseNames?.includes(name) && family.sourcePhrases?.some((phrase) => matchesShoppingKeyword(source, phrase))) ||
    family.types?.some((type) => (' ' + name).endsWith(' ' + type) || (' ' + name).endsWith(' ' + type + 's')))?.category
}

function matchesWord(word, keyword) {
  return word === keyword || word === keyword + 's' || word === keyword + 'es' ||
    (keyword.endsWith('y') && word === keyword.slice(0, -1) + 'ies')
}

export function matchesShoppingKeyword(name, keyword) {
  const words = name.split(' ')
  const phrase = keyword.split(' ')
  return words.some((_, index) => phrase.every((word, offset) => matchesWord(words[index + offset], word)))
}
