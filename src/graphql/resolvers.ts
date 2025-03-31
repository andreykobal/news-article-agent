import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { Langfuse } from 'langfuse';
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

// Initialize Langfuse
const langfuse = new Langfuse({
  publicKey: config.langfuse.publicKey,
  secretKey: config.langfuse.secretKey,
  baseUrl: config.langfuse.host,
});

export const resolvers = {
  Query: {
    queryNews: async (_: unknown, { query }: { query: string }): Promise<QueryResponse> => {
      // Create a new trace for this query
      const trace = await langfuse.trace({
        name: 'news-query',
        metadata: { query }
      });

      // Create a span for the embedding generation
      const embeddingSpan = await trace.span({
        name: 'generate-embedding'
      });

      try {
        if (!pinecone) {
          await initPinecone();
        }

        // Generate query embedding
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: query,
        });

        await embeddingSpan.end();

        // Create a span for Pinecone search
        const searchSpan = await trace.span({
          name: 'pinecone-search'
        });

        const queryEmbedding = embeddingResponse.data[0].embedding;

        // Search in Pinecone
        const index = pinecone.index(config.pinecone.indexName);
        const searchResponse = await index.query({
          vector: queryEmbedding,
          topK: 5,
          includeMetadata: true
        });

        await searchSpan.end();

        // Format sources
        const sources = searchResponse.matches?.map((match: any) => ({
          title: match.metadata?.title || '',
          content: match.metadata?.content || '',
          url: match.metadata?.url || '',
          date: match.metadata?.date || '',
        })) || [];

        // Create a span for OpenAI completion
        const completionSpan = await trace.span({
          name: 'generate-completion'
        });

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

        await completionSpan.end();

        // Update trace with success
        await trace.update({
          name: 'news-query',
          metadata: {
            sourcesCount: sources.length,
            answerLength: answer.length,
            status: 'success'
          }
        });

        return {
          answer,
          sources,
        };
      } catch (error) {
        // Update trace with error
        await trace.update({
          name: 'news-query',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'error'
          }
        });
        
        console.error('Error processing query:', error);
        throw error;
      }
    },
  },
}; 