import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import config from '../config/index.js';
import { QueryResponse } from '../types/index.js';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

let pinecone: Pinecone;

async function initPinecone() {
  pinecone = new Pinecone({
    apiKey: config.pinecone.apiKey,
  });
}

export const resolvers = {
  Query: {
    queryNews: async (_: unknown, { query }: { query: string }): Promise<QueryResponse> => {
      try {
        if (!pinecone) {
          await initPinecone();
        }

        // Generate query embedding
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: query,
        });

        const queryEmbedding = embeddingResponse.data[0].embedding;

        // Search in Pinecone
        const index = pinecone.index(config.pinecone.indexName);
        const searchResponse = await index.query({
          vector: queryEmbedding,
          topK: 5,
          includeMetadata: true
        });

        // Format sources
        const sources = searchResponse.matches?.map((match: any) => ({
          title: match.metadata?.title || '',
          content: match.metadata?.content || '',
          url: match.metadata?.url || '',
          date: match.metadata?.date || '',
        })) || [];

        // Generate response using OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides accurate and concise answers based on the provided news articles. Always cite your sources."
            },
            {
              role: "user",
              content: `Question: ${query}\n\nRelevant articles:\n${sources.map((source: any) => 
                `Title: ${source.title}\nContent: ${source.content}\nURL: ${source.url}\nDate: ${source.date}\n`
              ).join('\n')}`
            }
          ],
          stream: true,
        });

        let answer = '';
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          answer += content;
        }

        return {
          answer,
          sources,
        };
      } catch (error) {
        console.error('Error processing query:', error);
        throw error;
      }
    },
  },
}; 