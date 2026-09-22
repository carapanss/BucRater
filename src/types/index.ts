export type BookStatus = 'pending' | 'reading' | 'read';

export interface Tag {
  id: number;
  name: string;
  color: string | null;
}

export interface Book {
  id: number;
  uuid: string;
  title: string;
  author: string;
  rating: number | null;
  notes: string | null;
  status: BookStatus;
  coverUrl: string | null;
  googleBooksId: string | null;
  addedYear: number | null;
  addedMonth: number | null;
  pageCount: number | null;
  currentPage: number | null;
  publicationYear: number | null;
  language: string | null;
  seriesName: string | null;
  seriesIndex: number | null;
  rereadCount: number;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface NewBook {
  title: string;
  author: string;
  rating: number | null;
  notes: string | null;
  status: BookStatus;
  coverUrl: string | null;
  googleBooksId: string | null;
  addedYear: number | null;
  addedMonth: number | null;
  pageCount: number | null;
  currentPage: number | null;
  publicationYear: number | null;
  language: string | null;
  seriesName: string | null;
  seriesIndex: number | null;
  tagIds: number[];
}

export type BookUpdate = Omit<NewBook, 'tagIds'>;

export type BookSortBy = 'created_desc' | 'rating_desc' | 'pages_desc' | 'title_asc';

export interface BookFilter {
  searchText?: string | null;
  tagId?: number | null;
  minRating?: number | null;
  status?: BookStatus | null;
  onlyUndefinedDate?: boolean | null;
  sortBy?: BookSortBy | null;
}

export interface Quote {
  id: number;
  bookId: number;
  text: string;
  createdAt: string;
}

export interface MonthCount {
  month: number;
  count: number;
}

export interface MonthPages {
  month: number;
  pages: number;
}

export interface WrappedSummary {
  year: number;
  totalBooks: number;
  totalPages: number;
  topTag: string | null;
  topAuthor: string | null;
  bestRatedBookTitle: string | null;
  bestRatedBookRating: number | null;
  longestStreakMonths: number;
}

export interface YearStats {
  year: number;
  books: number;
  pages: number;
  avgRating: number | null;
}

export interface YearMetrics {
  monthlyCounts: MonthCount[];
  undefinedDateCount: number;
  wrapped: WrappedSummary;
  readingVelocity: MonthPages[];
  yearHistory: YearStats[];
}

export interface Summary {
  totalBooks: number;
  avgRating: number | null;
  totalRereads: number;
}

export interface AuthorCount {
  author: string;
  count: number;
}

export interface TagCount {
  tag: Tag;
  count: number;
}

export interface HeatmapCell {
  year: number;
  month: number;
  count: number;
}

export interface GlobalMetrics {
  summary: Summary;
  authorRanking: AuthorCount[];
  ratingHistogram: number[];
  tagDistribution: TagCount[];
  heatmap: HeatmapCell[];
}

export interface ImportReport {
  imported: number;
  updated: number;
}

export interface GoogleBooksSuggestion {
  googleBooksId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  pageCount: number | null;
  publicationYear: number | null;
  language: string | null;
}
