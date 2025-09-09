import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VoiceSearchResult {
  query: string;
  intent: 'search' | 'recommend' | 'filter' | 'unknown';
  parameters: {
    genre?: string;
    year?: number;
    rating?: number;
    mood?: string;
    actor?: string;
    director?: string;
  };
}

export interface MovieRecommendation {
  reasoning: string;
  confidence: number;
  movieIds: number[];
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async processVoiceSearch(transcript: string): Promise<VoiceSearchResult> {
    // For now, let's use a simple pattern matching approach
    // since Gemini API might not be available or configured properly
    console.log('Processing voice search with simple pattern matching:', transcript);

    const lowerTranscript = transcript.toLowerCase();
    const result: VoiceSearchResult = {
      query: transcript,
      intent: 'search',
      parameters: {}
    };

    // Extract genre
    const genreMap: Record<string, string> = {
      'action': 'Action',
      'comedy': 'Comedy',
      'drama': 'Drama',
      'horror': 'Horror',
      'romance': 'Romance',
      'romantic': 'Romance',
      'thriller': 'Thriller',
      'sci-fi': 'Sci-Fi',
      'science fiction': 'Sci-Fi',
      'animation': 'Animation',
      'animated': 'Animation',
      'adventure': 'Adventure',
      'crime': 'Crime',
      'fantasy': 'Fantasy',
      'mystery': 'Mystery',
      'western': 'Western',
      'war': 'War',
      'musical': 'Musical'
    };

    for (const [key, value] of Object.entries(genreMap)) {
      if (lowerTranscript.includes(key)) {
        result.parameters.genre = value;
        result.intent = 'filter';
        break;
      }
    }

    // Extract year
    const yearMatch = lowerTranscript.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      result.parameters.year = parseInt(yearMatch[0]);
      result.intent = 'filter';
    }

    // Check for recommendation intent
    if (lowerTranscript.includes('recommend') ||
        lowerTranscript.includes('suggest') ||
        lowerTranscript.includes('what should i watch') ||
        lowerTranscript.includes('good movie')) {
      result.intent = 'recommend';
    }

    // Check for search intent (specific titles or actors)
    if (lowerTranscript.includes('find') ||
        lowerTranscript.includes('search') ||
        lowerTranscript.includes('with') ||
        lowerTranscript.includes('starring')) {
      result.intent = 'search';
    }

    // Extract mood-based parameters
    if (lowerTranscript.includes('funny') || lowerTranscript.includes('hilarious')) {
      result.parameters.genre = 'Comedy';
      result.intent = 'filter';
    }
    if (lowerTranscript.includes('scary') || lowerTranscript.includes('frightening')) {
      result.parameters.genre = 'Horror';
      result.intent = 'filter';
    }
    if (lowerTranscript.includes('exciting') || lowerTranscript.includes('thrilling')) {
      result.parameters.genre = 'Action';
      result.intent = 'filter';
    }

    console.log('Voice search result:', result);
    return result;
  }

  async generateMovieRecommendations(
    userPreferences: any,
    watchHistory: any[],
    availableMovies: any[]
  ): Promise<MovieRecommendation> {
    try {
      const prompt = `
        As a movie recommendation expert, analyze the user's preferences and watch history to recommend movies.
        
        User Preferences: ${JSON.stringify(userPreferences)}
        Watch History (last 10 movies with ratings): ${JSON.stringify(watchHistory.slice(0, 10))}
        Available Movies (sample): ${JSON.stringify(availableMovies.slice(0, 50))}
        
        Based on this data, recommend 5-10 movies that the user would likely enjoy.
        Consider:
        1. Genre preferences from watch history
        2. Rating patterns (what ratings they give to different types of movies)
        3. Recency of watches
        4. Diversity in recommendations
        5. Popular and critically acclaimed movies they haven't seen
        
        Return a JSON response:
        {
          "reasoning": "Detailed explanation of why these movies were recommended",
          "confidence": 0.85,
          "movieIds": [1, 2, 3, 4, 5]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse Gemini recommendation response:', text);
        return {
          reasoning: 'Unable to generate personalized recommendations at this time.',
          confidence: 0.5,
          movieIds: availableMovies.slice(0, 5).map(m => m.movieId)
        };
      }
    } catch (error) {
      console.error('Gemini recommendation error:', error);
      return {
        reasoning: 'Error generating recommendations. Showing popular movies instead.',
        confidence: 0.3,
        movieIds: availableMovies.slice(0, 5).map(m => m.movieId)
      };
    }
  }

  async generateMovieSummary(movieData: any): Promise<string> {
    try {
      const prompt = `
        Create an engaging, concise movie summary for: ${movieData.title}
        
        Movie Data: ${JSON.stringify(movieData)}
        
        Write a 2-3 sentence summary that:
        1. Captures the essence of the movie
        2. Mentions key themes or plot points without spoilers
        3. Highlights what makes it special or noteworthy
        4. Uses engaging, cinematic language
        
        Return only the summary text, no JSON or formatting.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini summary generation error:', error);
      return movieData.overview || 'A captivating movie experience awaits.';
    }
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number }> {
    try {
      const prompt = `
        Analyze the sentiment of this text: "${text}"
        
        Return a JSON response:
        {
          "sentiment": "positive|negative|neutral",
          "score": 0.75
        }
        
        Score should be between 0 and 1, where:
        - 0.0-0.3: negative
        - 0.3-0.7: neutral  
        - 0.7-1.0: positive
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text_response = response.text();
      
      try {
        return JSON.parse(text_response);
      } catch (parseError) {
        return { sentiment: 'neutral', score: 0.5 };
      }
    } catch (error) {
      console.error('Gemini sentiment analysis error:', error);
      return { sentiment: 'neutral', score: 0.5 };
    }
  }

  async generateSearchSuggestions(partialQuery: string): Promise<string[]> {
    try {
      const prompt = `
        Generate 5 movie search suggestions based on this partial query: "${partialQuery}"
        
        Suggestions should be:
        1. Relevant to movies and entertainment
        2. Complete the user's likely intent
        3. Include popular movies, genres, actors, or directors
        4. Be diverse and helpful
        
        Return a JSON array of strings:
        ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        return [
          `${partialQuery} movies`,
          `${partialQuery} recommendations`,
          `best ${partialQuery}`,
          `${partialQuery} 2024`,
          `${partialQuery} classics`
        ];
      }
    } catch (error) {
      console.error('Gemini search suggestions error:', error);
      return [];
    }
  }

  async textToSpeech(text: string): Promise<string> {
    // Note: Google Gemini doesn't have built-in TTS
    // This would typically use Google Cloud Text-to-Speech API
    // For now, we'll return the text and handle TTS on the frontend
    return text;
  }
}

export const geminiService = new GeminiService();
export default geminiService;
