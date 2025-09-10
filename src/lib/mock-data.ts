import { Movie } from './movie-service';

// Mock movie data for demonstration
export const mockMovies: Movie[] = [
  {
    movieId: 1,
    title: "Toy Story",
    genres: ["Animation", "Children", "Comedy"],
    year: 1995,
    averageRating: 3.9,
    ratingCount: 215,
    posterUrl: "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg"
  },
  {
    movieId: 2,
    title: "Jumanji",
    genres: ["Adventure", "Children", "Fantasy"],
    year: 1995,
    averageRating: 3.3,
    ratingCount: 110,
    posterUrl: "https://image.tmdb.org/t/p/w500/vzmL6fP7aPKNKPRTFnZmiUfciyV.jpg"
  },
  {
    movieId: 3,
    title: "Grumpier Old Men",
    genres: ["Comedy", "Romance"],
    year: 1995,
    averageRating: 3.2,
    ratingCount: 52,
    posterUrl: "https://image.tmdb.org/t/p/w500/1FSWyODaLRNbxvVcHbdAzJOlKKx.jpg"
  },
  {
    movieId: 4,
    title: "Waiting to Exhale",
    genres: ["Comedy", "Drama", "Romance"],
    year: 1995,
    averageRating: 2.9,
    ratingCount: 27,
    posterUrl: "https://image.tmdb.org/t/p/w500/16XOMpEaLWkrcPqSQqhTmeJuqQl.jpg"
  },
  {
    movieId: 5,
    title: "Father of the Bride Part II",
    genres: ["Comedy"],
    year: 1995,
    averageRating: 3.1,
    ratingCount: 49,
    posterUrl: "https://image.tmdb.org/t/p/w500/e64sOI48hQXyru0nAvPmUOoQKnC.jpg"
  },
  {
    movieId: 6,
    title: "Heat",
    genres: ["Action", "Crime", "Thriller"],
    year: 1995,
    averageRating: 4.0,
    ratingCount: 112,
    posterUrl: "https://image.tmdb.org/t/p/w500/zMyfPUelumio3tiDKPffaUpsQTD.jpg"
  },
  {
    movieId: 7,
    title: "Sabrina",
    genres: ["Comedy", "Romance"],
    year: 1995,
    averageRating: 3.4,
    ratingCount: 35,
    posterUrl: "https://image.tmdb.org/t/p/w500/z1W9kzZhKdlvOuVOIhZh1WhmJer.jpg"
  },
  {
    movieId: 8,
    title: "Tom and Huck",
    genres: ["Adventure", "Children"],
    year: 1995,
    averageRating: 3.0,
    ratingCount: 22,
    posterUrl: "https://image.tmdb.org/t/p/w500/sGO5Qa55p7wTu7FJcX4H4xIVKvS.jpg"
  },
  {
    movieId: 9,
    title: "Sudden Death",
    genres: ["Action"],
    year: 1995,
    averageRating: 2.8,
    ratingCount: 18,
    posterUrl: "https://image.tmdb.org/t/p/w500/tGZsLd4rkcaKcwAIUr6JehsJagI.jpg"
  },
  {
    movieId: 10,
    title: "GoldenEye",
    genres: ["Action", "Adventure", "Thriller"],
    year: 1995,
    averageRating: 3.8,
    ratingCount: 132,
    posterUrl: "https://image.tmdb.org/t/p/w500/5c0ovjT41KnYIHYuF4AWsTe3sKh.jpg"
  },
  {
    movieId: 11,
    title: "American President, The",
    genres: ["Comedy", "Drama", "Romance"],
    year: 1995,
    averageRating: 3.7,
    ratingCount: 91,
    posterUrl: "https://image.tmdb.org/t/p/w500/9HVjKCBEOzaUmgbvvFHbNGaaq7q.jpg"
  },
  {
    movieId: 12,
    title: "Dracula: Dead and Loving It",
    genres: ["Comedy", "Horror"],
    year: 1995,
    averageRating: 2.9,
    ratingCount: 23,
    posterUrl: "https://image.tmdb.org/t/p/w500/gNi4LM4n4AIRbvdapHFoSLYL1yE.jpg"
  },
  {
    movieId: 13,
    title: "Balto",
    genres: ["Animation", "Children"],
    year: 1995,
    averageRating: 3.4,
    ratingCount: 41,
    posterUrl: "https://image.tmdb.org/t/p/w500/gipTWgcMKQWKmHN2lYJNKZz8lCR.jpg"
  },
  {
    movieId: 14,
    title: "Nixon",
    genres: ["Drama"],
    year: 1995,
    averageRating: 3.6,
    ratingCount: 28,
    posterUrl: "https://image.tmdb.org/t/p/w500/7RBBAtqMZjqZdK8HjJbstCOxGZj.jpg"
  },
  {
    movieId: 15,
    title: "Cutthroat Island",
    genres: ["Action", "Adventure", "Romance"],
    year: 1995,
    averageRating: 2.8,
    ratingCount: 19,
    posterUrl: "https://image.tmdb.org/t/p/w500/yGjJ1OXWWqvbetUnz8F0ZSCgiCo.jpg"
  },
  {
    movieId: 16,
    title: "Casino",
    genres: ["Crime", "Drama"],
    year: 1995,
    averageRating: 4.2,
    ratingCount: 144,
    posterUrl: "https://image.tmdb.org/t/p/w500/4TS5O1IP42bY2BvgMxL156EENy.jpg"
  },
  {
    movieId: 17,
    title: "Sense and Sensibility",
    genres: ["Drama", "Romance"],
    year: 1995,
    averageRating: 3.8,
    ratingCount: 76,
    posterUrl: "https://image.tmdb.org/t/p/w500/3pMCLHrwXzaONbLlvKmhWyZsrpn.jpg"
  },
  {
    movieId: 18,
    title: "Four Rooms",
    genres: ["Thriller"],
    year: 1995,
    averageRating: 3.0,
    ratingCount: 34,
    posterUrl: "https://image.tmdb.org/t/p/w500/75aHn1NOYXh4M7L5shoeQ6NGykP.jpg"
  },
  {
    movieId: 19,
    title: "Ace Ventura: When Nature Calls",
    genres: ["Comedy"],
    year: 1995,
    averageRating: 3.1,
    ratingCount: 55,
    posterUrl: "https://image.tmdb.org/t/p/w500/pqiRuETmuSybfnVZ7qyeoqtKF5b.jpg"
  },
  {
    movieId: 20,
    title: "Money Train",
    genres: ["Action", "Comedy"],
    year: 1995,
    averageRating: 2.9,
    ratingCount: 25,
    posterUrl: "https://image.tmdb.org/t/p/w500/3JfTJTf5jdJOCvS3nLkqEWyWZbL.jpg"
  },
  // Additional popular movies for better testing
  {
    movieId: 21,
    title: "The Dark Knight",
    genres: ["Action", "Crime", "Drama"],
    year: 2008,
    averageRating: 4.7,
    ratingCount: 2500,
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    tmdbId: 155
  },
  {
    movieId: 22,
    title: "Inception",
    genres: ["Action", "Sci-Fi", "Thriller"],
    year: 2010,
    averageRating: 4.8,
    ratingCount: 2200,
    posterUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    tmdbId: 27205
  },
  {
    movieId: 23,
    title: "The Avengers",
    genres: ["Action", "Adventure", "Sci-Fi"],
    year: 2012,
    averageRating: 4.2,
    ratingCount: 1800,
    posterUrl: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
    tmdbId: 24428
  },
  {
    movieId: 24,
    title: "Interstellar",
    genres: ["Drama", "Sci-Fi"],
    year: 2014,
    averageRating: 4.6,
    ratingCount: 1900,
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    tmdbId: 157336
  },
  {
    movieId: 25,
    title: "The Shawshank Redemption",
    genres: ["Drama"],
    year: 1994,
    averageRating: 4.9,
    ratingCount: 2800,
    posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    tmdbId: 278
  },
  {
    movieId: 26,
    title: "Pulp Fiction",
    genres: ["Crime", "Drama"],
    year: 1994,
    averageRating: 4.8,
    ratingCount: 2600,
    posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    tmdbId: 680
  },
  {
    movieId: 27,
    title: "The Godfather",
    genres: ["Crime", "Drama"],
    year: 1972,
    averageRating: 4.9,
    ratingCount: 2900,
    posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    tmdbId: 238
  },
  {
    movieId: 28,
    title: "Forrest Gump",
    genres: ["Drama", "Romance"],
    year: 1994,
    averageRating: 4.7,
    ratingCount: 2400,
    posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    tmdbId: 13
  },
  {
    movieId: 29,
    title: "The Matrix",
    genres: ["Action", "Sci-Fi"],
    year: 1999,
    averageRating: 4.6,
    ratingCount: 2100,
    posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    tmdbId: 603
  },
  {
    movieId: 30,
    title: "Titanic",
    genres: ["Drama", "Romance"],
    year: 1997,
    averageRating: 4.3,
    ratingCount: 2000,
    posterUrl: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    tmdbId: 597
  }
];

// Generate more movies for demonstration
export function generateMockMovies(count: number = 100): Movie[] {
  const genres = [
    "Action", "Adventure", "Animation", "Children", "Comedy", "Crime", 
    "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical", 
    "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"
  ];

  const titles = [
    "The Great Adventure", "Mystery of the Lost City", "Space Warriors", "Love in Paris",
    "The Dark Knight Returns", "Ocean's Mystery", "The Last Stand", "Romantic Getaway",
    "Alien Invasion", "The Comedy Club", "Horror House", "Musical Dreams",
    "The Detective Story", "Fantasy World", "War Heroes", "Western Showdown",
    "The Thriller Night", "Animation Magic", "Children's Adventure", "Crime Scene",
    "Documentary Life", "Drama Queen", "Film Noir Classic", "Musical Theater",
    "Mystery Solver", "Romance Novel", "Sci-Fi Future", "Thriller Chase",
    "War Stories", "Western Frontier", "Action Hero", "Adventure Quest"
  ];

  const additionalMovies: Movie[] = [];

  for (let i = 31; i <= count + 30; i++) {
    const randomGenres = genres.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const year = 1990 + Math.floor(Math.random() * 34); // 1990-2024
    const rating = 1 + Math.random() * 4; // 1-5 rating
    const ratingCount = Math.floor(Math.random() * 500) + 10;

    additionalMovies.push({
      movieId: i,
      title: `${randomTitle} ${i}`,
      genres: randomGenres,
      year,
      averageRating: parseFloat(rating.toFixed(1)),
      ratingCount,
      posterUrl: `https://image.tmdb.org/t/p/w500/placeholder${i % 10}.jpg`
    });
  }

  return [...mockMovies, ...additionalMovies];
}

export const allMockMovies = generateMockMovies(200);

export function searchMockMovies(query: string, movies: Movie[] = allMockMovies): Movie[] {
  const lowerQuery = query.toLowerCase();
  return movies.filter(movie => 
    movie.title.toLowerCase().includes(lowerQuery) ||
    movie.genres.some(genre => genre.toLowerCase().includes(lowerQuery))
  );
}

export function filterMockMovies(
  movies: Movie[] = allMockMovies,
  filters: {
    genre?: string;
    year?: number;
    minRating?: number;
    maxRating?: number;
    sortBy?: 'popularity' | 'rating' | 'year' | 'title';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Movie[] {
  let filtered = [...movies];

  // Apply filters
  if (filters.genre) {
    filtered = filtered.filter(movie => 
      movie.genres.some(g => g.toLowerCase() === filters.genre!.toLowerCase())
    );
  }

  if (filters.year) {
    filtered = filtered.filter(movie => movie.year === filters.year);
  }

  if (filters.minRating) {
    filtered = filtered.filter(movie => (movie.averageRating || 0) >= filters.minRating!);
  }

  if (filters.maxRating) {
    filtered = filtered.filter(movie => (movie.averageRating || 0) <= filters.maxRating!);
  }

  // Apply sorting
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (filters.sortBy) {
        case 'title':
          aVal = a.title;
          bVal = b.title;
          break;
        case 'year':
          aVal = a.year;
          bVal = b.year;
          break;
        case 'rating':
          aVal = a.averageRating || 0;
          bVal = b.averageRating || 0;
          break;
        case 'popularity':
          aVal = a.ratingCount || 0;
          bVal = b.ratingCount || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return filters.sortOrder === 'desc' ? 1 : -1;
      if (aVal > bVal) return filters.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return filtered;
}

export function paginateMockMovies(movies: Movie[], page: number = 1, limit: number = 20) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    movies: movies.slice(startIndex, endIndex),
    total: movies.length,
    hasMore: endIndex < movies.length,
    page,
    limit,
    totalPages: Math.ceil(movies.length / limit)
  };
}
