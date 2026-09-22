use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Book {
    pub id: i64,
    pub uuid: String,
    pub title: String,
    pub author: String,
    pub rating: Option<i64>,
    pub notes: Option<String>,
    pub status: String,
    pub cover_url: Option<String>,
    pub google_books_id: Option<String>,
    pub added_year: Option<i64>,
    pub added_month: Option<i64>,
    pub page_count: Option<i64>,
    #[serde(default)]
    pub current_page: Option<i64>,
    pub publication_year: Option<i64>,
    pub language: Option<String>,
    pub series_name: Option<String>,
    pub series_index: Option<f64>,
    pub reread_count: i64,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewBook {
    pub title: String,
    pub author: String,
    pub rating: Option<i64>,
    pub notes: Option<String>,
    pub status: String,
    pub cover_url: Option<String>,
    pub google_books_id: Option<String>,
    pub added_year: Option<i64>,
    pub added_month: Option<i64>,
    pub page_count: Option<i64>,
    pub current_page: Option<i64>,
    pub publication_year: Option<i64>,
    pub language: Option<String>,
    pub series_name: Option<String>,
    pub series_index: Option<f64>,
    #[serde(default)]
    pub tag_ids: Vec<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookUpdate {
    pub title: String,
    pub author: String,
    pub rating: Option<i64>,
    pub notes: Option<String>,
    pub status: String,
    pub cover_url: Option<String>,
    pub google_books_id: Option<String>,
    pub added_year: Option<i64>,
    pub added_month: Option<i64>,
    pub page_count: Option<i64>,
    pub current_page: Option<i64>,
    pub publication_year: Option<i64>,
    pub language: Option<String>,
    pub series_name: Option<String>,
    pub series_index: Option<f64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookFilter {
    #[serde(default)]
    pub search_text: Option<String>,
    #[serde(default)]
    pub tag_id: Option<i64>,
    #[serde(default)]
    pub min_rating: Option<i64>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub only_undefined_date: Option<bool>,
    #[serde(default)]
    pub sort_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Quote {
    pub id: i64,
    pub book_id: i64,
    pub text: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthCount {
    pub month: i64,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthPages {
    pub month: i64,
    pub pages: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WrappedSummary {
    pub year: i32,
    pub total_books: i64,
    pub total_pages: i64,
    pub top_tag: Option<String>,
    pub top_author: Option<String>,
    pub best_rated_book_title: Option<String>,
    pub best_rated_book_rating: Option<i64>,
    pub longest_streak_months: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YearStats {
    pub year: i32,
    pub books: i64,
    pub pages: i64,
    pub avg_rating: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YearMetrics {
    pub monthly_counts: Vec<MonthCount>,
    pub undefined_date_count: i64,
    pub wrapped: WrappedSummary,
    pub reading_velocity: Vec<MonthPages>,
    /// Estadísticas de este año y de los cuatro anteriores, en orden ascendente.
    pub year_history: Vec<YearStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Summary {
    pub total_books: i64,
    pub avg_rating: Option<f64>,
    pub total_rereads: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorCount {
    pub author: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagCount {
    pub tag: Tag,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeatmapCell {
    pub year: i32,
    pub month: i64,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalMetrics {
    pub summary: Summary,
    pub author_ranking: Vec<AuthorCount>,
    pub rating_histogram: [i64; 5],
    pub tag_distribution: Vec<TagCount>,
    pub heatmap: Vec<HeatmapCell>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoverAsset {
    pub data: String,
    pub mime_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupBook {
    pub book: Book,
    pub quotes: Vec<String>,
    #[serde(default)]
    pub cover_asset: Option<CoverAsset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupData {
    pub tags: Vec<Tag>,
    pub books: Vec<BackupBook>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportReport {
    pub imported: i64,
    pub updated: i64,
}
