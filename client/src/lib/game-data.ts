import { Category, Difficulty } from "@shared/schema";
import Papa from 'papaparse';

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

// Function to load and parse CSV data
const loadWordsFromCSV = async () => {
  try {
    const response = await fetch('/WordGuessySingle/words.csv');
    const csvText = await response.text();
    
    return new Promise<WordData[]>((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const words = results.data as WordData[];
          resolve(words);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading words:', error);
    return [];
  }
};

// Initialize words data
let isInitialized = false;

const initializeWords = async () => {
  if (isInitialized) return;
  
  const words = await loadWordsFromCSV();
  
  // Reset categories
  Object.keys(wordsByCategory).forEach(category => {
    wordsByCategory[category as Category] = [];
  });
  
  // Populate categories
  words.forEach(word => {
    if (word.category in wordsByCategory) {
      wordsByCategory[word.category as Category].push(word);
    }
  });
  
  isInitialized = true;
};

// Modified getRandomWord to handle async initialization
export const getRandomWord = async (
  category: Category,
  includedDifficulties: string[],
  usedWords: Set<string>
): Promise<string> => {
  await initializeWords();
  
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