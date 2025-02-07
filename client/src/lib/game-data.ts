import { Category } from "@shared/schema";
import wordsData from "../../../attached_assets/words.json";

// Create a map to store words by category
const wordsByCategory: Record<Category, string[]> = {
  Action: [],
  Nature: [],
  Thing: [],
  Person: [],
  Random: [],
  Place: []
};

// Populate categories from JSON data
wordsData.forEach(item => {
  const category = item.category as Category;
  if (wordsByCategory[category]) {
    wordsByCategory[category].push(item.word);
  }
});

// Populate Random category with words from all other categories
wordsByCategory.Random = Object.entries(wordsByCategory)
  .filter(([category]) => category !== "Random")
  .flatMap(([_, words]) => words);

export const getRandomWord = (category: Category, usedWords: Set<string>): string => {
  const availableWords = wordsByCategory[category].filter(word => !usedWords.has(word));
  if (availableWords.length === 0) return "NO MORE WORDS";
  return availableWords[Math.floor(Math.random() * availableWords.length)];
};

export const getRandomCategory = (excludedCategories: string[]): Category => {
  const availableCategories = Object.keys(wordsByCategory).filter(
    cat => !excludedCategories.includes(cat)
  ) as Category[];
  return availableCategories[Math.floor(Math.random() * availableCategories.length)];
};