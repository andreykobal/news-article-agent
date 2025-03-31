export interface Article {
  title: string;
  content: string;
  url: string;
  date: string;
  embedding?: number[];
}

export interface QueryResponse {
  answer: string;
  sources: Article[];
}

export interface KafkaMessage {
  url: string;
  timestamp: string;
}

export interface LangfuseTrace {
  traceId: string;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface PineconeMetadata {
  title: string;
  content: string;
  url: string;
  date: string;
}

export interface SearchResult {
  article: Article;
  score: number;
  metadata: PineconeMetadata;
} 