import { z } from "zod";
import natural from "natural";
import {
  ApiError,
  HttpStatus,
  createResponse,
  createErrorResponse,
} from "@repo/ui/lib/api";

// Define the schema for validating the input using Zod
const InputSchema = z.object({
  text: z
    .string()
    .min(1, "Text input cannot be empty")
    .max(10000, "Text input exceeds the maximum allowed length"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the input using Zod
    const result = InputSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.errors
        .map((err) => err.message)
        .join(", ");
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        "VALIDATION_ERROR",
        errorMessage,
      );
    }

    // Extract validated input
    const { text } = result.data;

    // Initialize tokenizer and analyzer
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(text);

    // Calculate word and character counts
    const wordCount = words.length;
    const charCount = text.length;

    // Sentiment analysis using natural
    const analyzer = new natural.SentimentAnalyzer(
      "English",
      natural.PorterStemmer,
      "afinn",
    );
    const sentimentScore = analyzer.getSentiment(words);

    // Find the most frequent word
    const mostFrequentWord = findMostFrequentWord(words);

    const response: any = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      analysis: {
        wordCount,
        charCount,
        mostFrequentWord,
        sentimentScore,
      },
    };

    return createResponse(response);
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

// Helper function to find the most frequent word
function findMostFrequentWord(words: string[]): string | null {
  if (words.length === 0) return null;

  const frequencyMap: Record<string, number> = {};
  words.forEach((word) => {
    const normalizedWord = word.toLowerCase();
    frequencyMap[normalizedWord] = (frequencyMap[normalizedWord] ?? 0) + 1;
  });

  return Object.keys(frequencyMap).reduce(
    (a, b) => ((frequencyMap[a] || 0) > (frequencyMap[b] || 0) ? a : b),
    "",
  );
}
