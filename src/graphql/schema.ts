import { makeExecutableSchema } from '@graphql-tools/schema';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { config } from '../config/config.js';

const pinecone = new Pinecone({
  apiKey: config.pinecone.apiKey,
});

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

const typeDefs = `
  type Article {
    title: String!
    content: String!
    url: String!
    date: String!
  }

  type QueryResponse {
    answer: String!
    sources: [Article!]!
  }

  type Query {
    queryNews(query: String!): QueryResponse!
  }
`;

const resolvers = {
  Query: {
    queryNews: async (_: any, { query }: { query: string }) => {
      try {
        // Create embedding for the query
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: query,
        });

        const queryEmbedding = embeddingResponse.data[0].embedding;

        // Search in Pinecone
        const index = pinecone.Index(config.pinecone.indexName);
        const searchResponse = await index.query({
          vector: queryEmbedding,
          topK: 3,
          includeMetadata: true,
        });

        // Format sources
        const sources = searchResponse.matches?.map(match => ({
          title: match.metadata?.title || '',
          content: match.metadata?.content || '',
          url: match.metadata?.url || '',
          date: match.metadata?.date || '',
        })) || [];

        // Generate answer using OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that answers questions based on the provided news articles."
            },
            {
              role: "user",
              content: `Question: ${query}\n\nRelevant articles:\n${sources.map(source => 
                `Title: ${source.title}\nContent: ${source.content}\nURL: ${source.url}\nDate: ${source.date}\n`
              ).join('\n')}`
            }
          ],
        });

        return {
          answer: completion.choices[0].message.content || 'No answer available.',
          sources,
        };
      } catch (error) {
        console.error('Error processing query:', error);
        throw new Error('Failed to process query');
      }
    },
  },
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
}); 