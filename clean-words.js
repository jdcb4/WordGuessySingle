import { readFileSync, writeFileSync } from 'fs';

// Read the words.json file
const wordsJson = readFileSync('attached_assets/words.json', 'utf8');
const words = JSON.parse(wordsJson);

// Function to remove non-printable characters
const cleanString = (str) => {
  // Remove any character that isn't alphanumeric, space, or basic punctuation
  return str.replace(/[^\x20-\x7E]/g, '').trim();
};

// Clean each word
const cleanedWords = words.map(item => ({
  category: cleanString(item.category),
  word: cleanString(item.word)
}));

// Write back to file with proper formatting
writeFileSync(
  'attached_assets/words.json',
  JSON.stringify(cleanedWords, null, 2)
);