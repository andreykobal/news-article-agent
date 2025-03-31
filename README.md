# News Article Agent

A RAG-based news article query system that ingests news articles from Kafka, processes them using LLMs, and provides answers to user queries.

## Features

- Real-time news article ingestion from Kafka
- Article content extraction and cleaning using LLMs
- Vector storage using Pinecone for efficient similarity search
- GraphQL API for querying news articles
- RAG-based question answering using OpenAI's GPT-4

## Prerequisites

- Node.js (v18 or higher)
- Kafka credentials (provided)
- OpenAI API key
- Pinecone API key and environment
- Langfuse credentials (optional, for monitoring)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Kafka Configuration
KAFKA_BROKER=pkc-ewzgj.europe-west4.gcp.confluent.cloud:9092
KAFKA_USERNAME=your_kafka_username
KAFKA_PASSWORD=your_kafka_password
KAFKA_TOPIC_NAME=news
KAFKA_GROUP_ID_PREFIX=test-task-

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=news-articles

# Langfuse Configuration
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_HOST=https://cloud.langfuse.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd news-article-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create and configure your `.env` file:
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. The server will start and begin consuming messages from Kafka. You can query the news articles using the GraphQL API at `http://localhost:3000/graphql`.

Example GraphQL query:
```graphql
query {
  queryNews(query: "Tell me the latest news about Justin Trudeau") {
    answer
    sources {
      title
      content
      url
      date
    }
  }
}
```

## Architecture

The system consists of the following components:

1. **Kafka Consumer**: Continuously ingests news article URLs from Kafka
2. **Article Processor**: Extracts and cleans article content using LLMs
3. **Vector Database**: Stores article embeddings in Pinecone for similarity search
4. **GraphQL API**: Provides an interface for querying news articles
5. **RAG Pipeline**: Uses relevant articles to generate answers to user queries

## Optimizations

1. **Quality Improvements**:
   - Uses GPT-4 Turbo for better answer quality
   - Implements structured output for consistent responses
   - Includes source attribution for transparency

2. **Cost Optimization**:
   - Uses text-embedding-3-small for efficient embeddings
   - Implements caching for frequently accessed articles
   - Optimizes token usage by cleaning and structuring content

3. **Latency Optimization**:
   - Parallel processing of articles
   - Efficient vector search with Pinecone
   - Streaming responses for better user experience

## Monitoring

The system integrates with Langfuse for monitoring:
- Query performance
- Token usage
- Response quality
- Error rates

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 