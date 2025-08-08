/**
 * @fileoverview A TypeScript class for parsing and managing a Chinese-English dictionary.
 * The class is implemented as a singleton to ensure the dictionary is loaded and
 * parsed only once for the entire application, optimizing performance and memory usage.
 */

// The interface for a single dictionary entry.
// It matches the structure of the CC-CEDICT format.
export interface DictionaryEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitions: string[];
}

/**
 * The Dictionary class provides functionality to parse a raw CC-CEDICT file
 * and store the entries in a usable format.
 * This class uses the singleton pattern.
 */
export class Dictionary {
  // The private static instance of the class.
  private static instance: Dictionary;
  // A private map to store the dictionary entries.
  private entries = new Map<string, DictionaryEntry>();
  // A flag to check if the dictionary has been initialized.
  private isInitialized = false;
  // The length of the longest word in the dictionary, for parsing optimization.
  private maxKeyLength = 0;

  // The constructor is private to prevent direct instantiation with `new Dictionary()`.
  // The singleton must be created via the `getInstance` method.
  private constructor() {}

  /**
   * Initializes the dictionary asynchronously by fetching data from a given URL.
   * This method should only be called once by the `getInstance` method.
   * @param dataUrl The URL to the CC-CEDICT data file (e.g., '/cc-cedict.txt').
   * @returns A promise that resolves when the dictionary is initialized.
   */
  private async initialize(dataUrl: string): Promise<void> {
    try {
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch dictionary data from ${dataUrl}`);
      }
      const rawData = await response.text();
      const lines = rawData.split('\n');
      for (const line of lines) {
        const entry = Dictionary.parseLine(line);
        if (entry) {
          // Store the entry using both traditional and simplified characters as keys for fast lookup.
          this.entries.set(entry.traditional, entry);
          this.entries.set(entry.simplified, entry);
        }
      }
      this.isInitialized = true;

      // Find the longest key to optimize findLongestMatch
      let maxLen = 0;
      for (const key of this.entries.keys()) {
        if (key.length > maxLen) maxLen = key.length;
      }
      this.maxKeyLength = maxLen;
    } catch (error) {
      console.error("Initialization failed:", error);
      // Re-throw the error to be handled by the caller.
      throw error;
    }
  }

  /**
   * Provides the single, globally accessible instance of the Dictionary class.
   * The first call to this method will asynchronously create and initialize the dictionary.
   * Subsequent calls will return the same, already-initialized instance.
   * @param dataUrl The URL to the dictionary data file.
   * @returns A promise that resolves with the singleton instance of the Dictionary.
   */
  public static async getInstance(): Promise<Dictionary> {
    const dataUrl = '/cedict_ts.u8';
    // If no instance exists, or it's not initialized, create and initialize it.
    if (!Dictionary.instance) {
      Dictionary.instance = new Dictionary();
      await Dictionary.instance.initialize(dataUrl);
    }
    return Dictionary.instance;
  }

  /**
   * Parses a single line of CC-CEDICT data into a DictionaryEntry object.
   * @param line The single line of text to parse.
   * @returns A DictionaryEntry object if the line is valid, otherwise null.
   */
  public static parseLine(line: string): DictionaryEntry | null {
    // A robust regular expression to parse CC-CEDICT lines.
    // It captures:
    // 1. traditional characters (Group 1)
    // 2. simplified characters (Group 2)
    // 3. pinyin with tone numbers (Group 3)
    // 4. definitions (Group 4)
    // The negative lookahead `(?!#)` correctly ignores comment lines.
    const regex = /^(?!#)(.+?)\s(.+?)\s\[(.+?)\]\s\/(.+?)\/$/;
    const match = line.trim().match(regex);

    if (match) {
      // Extract the captured groups from the regex match.
      const [, traditional, simplified, pinyin, definitionsStr] = match;
      
      // Split the definitions string by the '/' delimiter to create an array.
      const definitions = definitionsStr.split('/').filter(def => def.length > 0);

      // Return the parsed DictionaryEntry object.
      return {
        traditional,
        simplified,
        pinyin,
        definitions,
      };
    }

    // Return null for invalid lines (e.g., comments or malformed lines).
    return null;
  }

  /**
   * Retrieves a dictionary entry by its traditional or simplified character.
   * @param character The traditional or simplified Chinese character to look up.
   * @returns The DictionaryEntry object, or undefined if not found.
   */
  public get(character: string): DictionaryEntry | undefined {
    if (!this.isInitialized) {
      console.error("Attempted to access dictionary before it was initialized.");
      return undefined;
    }
    return this.entries.get(character);
  }

  /**
   * Finds the longest word in the dictionary that exists in a text starting at a given index.
   * @param text The text to search within.
   * @param startIndex The index in the text to start searching from.
   * @returns The longest matching word, or null if no match is found.
   */
  public findLongestMatch(text: string, startIndex: number): string | null {
    if (!this.isInitialized) {
      return null;
    }
    // Check for matches of decreasing length, from maxKeyLength down to 1.
    for (let length = this.maxKeyLength; length > 0; length--) {
      if (startIndex + length <= text.length) {
        const substring = text.substring(startIndex, startIndex + length);
        if (this.entries.has(substring)) {
          return substring;
        }
      }
    }
    return null;
  }
}
