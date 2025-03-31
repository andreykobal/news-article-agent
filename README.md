# News Article Agent

A powerful RAG (Retrieval-Augmented Generation) system that processes news articles and provides intelligent responses to user queries. Built with Node.js, TypeScript, and modern AI technologies.

## Features

- Real-time news article ingestion via Kafka
- Intelligent content extraction and cleaning
- Vector-based storage using Pinecone
- GraphQL API with Yoga
- LLM-powered query responses
- Langfuse integration for monitoring
- Response streaming support

## Prerequisites

- Node.js (v18 or higher)
- Docker (optional, for containerized deployment)
- Access to:
  - OpenAI API
  - Pinecone Vector Database
  - Langfuse (for monitoring)
  - Kafka (provided credentials)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd news-article-agent
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. Start the development server:
```bash
npm run dev
```

## Docker Deployment

Build and run with Docker:

```bash
docker build -t news-article-agent .
docker run -p 3000:3000 --env-file .env news-article-agent
```

## API Usage

### GraphQL Endpoint

The API is available at `http://localhost:3000/graphql`

Example query:
```graphql
query {
  queryNews(query: "Tell me about recent developments in AI") {
    answer
    sources {
      title
      url
      date
    }
  }
}
```

## Architecture

### Components

1. **Data Ingestion**
   - Kafka consumer for real-time article processing
   - Content extraction using Puppeteer
   - Text cleaning and structuring with LLM

2. **Storage**
   - Vector database (Pinecone) for semantic search
   - Structured article storage

3. **Query Processing**
   - RAG pipeline for context retrieval
   - LLM integration for response generation
   - Response streaming for better UX

### Optimizations

1. **Quality Improvements**
   - Hybrid search combining semantic and keyword matching
   - Context window optimization
   - Response validation using Zod schemas

2. **Cost Optimization**
   - Efficient token usage through prompt engineering
   - Caching frequently accessed articles
   - Batch processing for article ingestion

3. **Latency Optimization**
   - Parallel processing of article extraction
   - Response streaming
   - Vector search optimization

## Monitoring

The application integrates with Langfuse for:
- Query performance monitoring
- Token usage tracking
- Response quality metrics
- Error tracking

## Development

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run tests
- `npm run lint`: Run linter

## License

MIT 