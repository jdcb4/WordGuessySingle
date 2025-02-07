import { Category } from "@shared/schema";

const wordsByCategory: Record<Category, string[]> = {
  Action: [
    "Running", "Dancing", "Jumping", "Swimming", "Singing",
    "Laughing", "Sleeping", "Eating", "Writing", "Reading"
  ],
  Category: [
    "Animals", "Colors", "Foods", "Sports", "Countries",
    "Movies", "Music", "Books", "Jobs", "Weather"
  ],
  Nature: [
    "Mountain", "Ocean", "Forest", "Desert", "River",
    "Volcano", "Island", "Valley", "Beach", "Lake"
  ],
  Person: [
    "Teacher", "Doctor", "Artist", "Chef", "Athlete",
    "Scientist", "Musician", "Writer", "Actor", "Farmer"
  ],
  Random: [], // Will be populated from other categories
  World: [
    "Paris", "Tokyo", "London", "Rome", "New York",
    "Egypt", "Brazil", "India", "China", "Australia"
  ]
};

// Populate Random category
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
