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
    console.log('Attempting to fetch words.csv...');
    const response = await fetch('/WordGuessySingle/words.csv');
    console.log('Fetch response:', response.status, response.statusText);
    
    const csvText = await response.text();
    console.log('CSV text first 100 chars:', csvText.substring(0, 100));
    
    return new Promise<WordData[]>((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          console.log('Processing header:', header);
          return header.trim().toLowerCase();
        },
        complete: (results) => {
          console.log('Parse complete. First few rows:', results.data.slice(0, 3));
          console.log('Headers:', results.meta.fields);
          
          const words = results.data as WordData[];
          const words_normalized = words.map(word => {
            const normalized = {
              ...word,
              category: normalizeCategory(word.category),
              difficulty: word.difficulty?.charAt(0).toUpperCase() + word.difficulty?.slice(1) || 'Easy'
            };
            return normalized;
          });

          const filteredWords = words_normalized.filter(word => {
            const isValid = word.category && 
                          word.word && 
                          word.difficulty && 
                          word.category in wordsByCategory;
            if (!isValid) {
              console.log('Filtered out word:', word);
            }
            return isValid;
          });

          console.log('Normalized and filtered words count:', filteredWords.length);
          resolve(filteredWords);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading words:', error);
    return [];
  }
};

// Helper function to normalize category names
const normalizeCategory = (category: string): string => {
  if (!category) {
    console.log('Received empty category to normalize');
    return '';
  }
  
  const categoryMap: Record<string, string> = {
    'action': 'Actions',
    'actions': 'Actions',
    'thing': 'Things',
    'things': 'Things',
    'place': 'Places',
    'places': 'Places',
    'food': 'Food & Drink',
    'food & drink': 'Food & Drink',
    'food and drink': 'Food & Drink',
    'hobby': 'Hobbies',
    'hobbies': 'Hobbies',
    'entertainment': 'Entertainment'
  };
  
  const normalized = categoryMap[category.toLowerCase()] || category;
  console.log(`Normalizing category: "${category}" -> "${normalized}"`);
  return normalized;
};

// Initialize words data
let isInitialized = false;

const initializeWords = async () => {
  if (isInitialized) {
    console.log('Words already initialized');
    return;
  }
  
  console.log('Starting word initialization...');
  const words = await loadWordsFromCSV();
  
  // Reset all category arrays
  Object.keys(wordsByCategory).forEach(category => {
    wordsByCategory[category as Category] = [];
  });

  // Add words to their respective categories
  words.forEach(word => {
    if (word.category in wordsByCategory) {
      wordsByCategory[word.category as Category].push(word);
      console.log(`Added word "${word.word}" to category "${word.category}"`);
    } else {
      console.log(`Skipped word "${word.word}" - invalid category "${word.category}"`);
    }
  });

  console.log('Words by category counts:', 
    Object.entries(wordsByCategory).map(([cat, words]) => `${cat}: ${words.length}`)
  );
  
  isInitialized = true;
};

export const getRandomWord = async (
  category: Category,
  includedDifficulties: string[],
  usedWords: Set<string>
): Promise<string> => {
  await initializeWords();
  
  console.log('Getting random word for:', category, 'Difficulties:', includedDifficulties);
  console.log('Used words count:', usedWords.size);
  
  const availableWords = wordsByCategory[category]
    .filter(word => {
      const isAvailable = !usedWords.has(word.word) && 
                         includedDifficulties.includes(word.difficulty);
      if (!isAvailable) {
        console.log('Filtered out:', word.word, 
          'Used:', usedWords.has(word.word), 
          'Difficulty match:', includedDifficulties.includes(word.difficulty)
        );
      }
      return isAvailable;
    })
    .map(word => word.word);

  console.log('Available words:', availableWords);

  if (availableWords.length === 0) return "NO MORE WORDS";
  return availableWords[Math.floor(Math.random() * availableWords.length)];
};

export const getRandomCategory = (includedCategories: string[]): Category => {
  console.log('Getting random category from:', includedCategories);
  const availableCategories = Object.keys(wordsByCategory).filter(
    cat => includedCategories.includes(cat)
  ) as Category[];

  console.log('Available categories:', availableCategories);

  if (availableCategories.length === 0) {
    throw new Error("No categories selected");
  }
  return availableCategories[Math.floor(Math.random() * availableCategories.length)];
};