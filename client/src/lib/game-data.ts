import { Category, Difficulty } from "@shared/schema";
import wordsData from "../../../attached_assets/words.json";

// Create a map to store words by category and difficulty
const wordsByCategory: Record<Category, Record<Difficulty, string[]>> = {
  Things: { Easy: [], Medium: [], Hard: [] },
  Places: { Easy: [], Medium: [], Hard: [] },
  "Food & Drink": { Easy: [], Medium: [], Hard: [] },
  Hobbies: { Easy: [], Medium: [], Hard: [] },
  Entertainment: { Easy: [], Medium: [], Hard: [] },
  People: { Easy: [], Medium: [], Hard: [] }
};

// Populate categories from JSON data
wordsData.forEach(item => {
  const category = item.category as Category;
  const difficulty = item.difficulty as Difficulty;
  if (wordsByCategory[category] && wordsByCategory[category][difficulty]) {
    wordsByCategory[category][difficulty].push(item.word);
  }
});

export const getRandomWord = (
  category: Category,
  selectedDifficulties: string[],
  usedWords: Set<string>
): string => {
  // Get all words from the category that match selected difficulties
  const availableWords = selectedDifficulties.flatMap(difficulty =>
    wordsByCategory[category][difficulty as Difficulty]
  ).filter(word => !usedWords.has(word));

  if (availableWords.length === 0) return "NO MORE WORDS";
  return availableWords[Math.floor(Math.random() * availableWords.length)];
};

export const getRandomCategory = (includedCategories: string[]): Category => {
  // Only select from included categories
  const availableCategories = includedCategories as Category[];
  return availableCategories[Math.floor(Math.random() * availableCategories.length)];
};