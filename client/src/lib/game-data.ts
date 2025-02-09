import { Category, Difficulty } from "@shared/schema";
import wordsData from "../../../attached_assets/words.json";

// Create a map to store words by category and difficulty
const wordsByCategory: Record<Category, Record<Difficulty, string[]>> = {
  Action: { Easy: [], Medium: [], Hard: [] },
  Nature: { Easy: [], Medium: [], Hard: [] },
  Thing: { Easy: [], Medium: [], Hard: [] },
  Person: { Easy: [], Medium: [], Hard: [] },
  Random: { Easy: [], Medium: [], Hard: [] },
  Place: { Easy: [], Medium: [], Hard: [] }
};

// Populate categories from JSON data
wordsData.forEach(item => {
  const category = item.category as Category;
  const difficulty = item.difficulty as Difficulty;
  if (wordsByCategory[category] && wordsByCategory[category][difficulty]) {
    wordsByCategory[category][difficulty].push(item.word);
  }
});

// Populate Random category with words from all other categories
Object.entries(wordsByCategory).forEach(([category, difficultyMap]) => {
  if (category !== "Random") {
    Object.entries(difficultyMap).forEach(([difficulty, words]) => {
      wordsByCategory.Random[difficulty as Difficulty].push(...words);
    });
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

export const getRandomCategory = (excludedCategories: string[]): Category => {
  const availableCategories = Object.keys(wordsByCategory).filter(
    cat => !excludedCategories.includes(cat)
  ) as Category[];
  return availableCategories[Math.floor(Math.random() * availableCategories.length)];
};