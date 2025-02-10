import { Category, Difficulty } from "@shared/schema";
import wordsData from "../../../attached_assets/words.json";

type WordData = {
  category: string;
  word: string;
  difficulty: string;
};

// Create a map to store words by category
const wordsByCategory: Record<Category, WordData[]> = {
  "Actions": [],
  "Things": [],
  "Places": [],
  "Food & Drink": [],
  "Hobbies": [],
  "Entertainment": []
};

// Populate categories from JSON data
(wordsData as WordData[]).forEach((item: WordData) => {
  const category = item.category as Category;
  if (wordsByCategory[category]) {
    wordsByCategory[category].push(item);
  }
});

export const getRandomWord = (
  category: Category,
  includedDifficulties: string[],
  usedWords: Set<string>
): string => {
  const availableWords = wordsByCategory[category]
    .filter(word => !usedWords.has(word.word) && includedDifficulties.includes(word.difficulty))
    .map(word => word.word);

  if (availableWords.length === 0) return "NO MORE WORDS";
  return availableWords[Math.floor(Math.random() * availableWords.length)];
};

export const getRandomCategory = (includedCategories: string[]): Category => {
  const availableCategories = Object.keys(wordsByCategory).filter(
    cat => includedCategories.includes(cat)
  ) as Category[];

  if (availableCategories.length === 0) {
    throw new Error("No categories selected");
  }
  return availableCategories[Math.floor(Math.random() * availableCategories.length)];
};