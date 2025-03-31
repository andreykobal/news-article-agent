import { OpenAI } from 'openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import { Langfuse } from 'langfuse';
import config from '../config/index.js';
import { QueryResponse } from '../types/index.js';
import { LangfuseTraceUpdate, LangfuseSpanUpdate } from '../types/langfuse.js';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

let pinecone: PineconeClient;

async function initPinecone() {
  pinecone = new PineconeClient();
  await pinecone.init({
    apiKey: config.pinecone.apiKey,
    environment: config.pinecone.environment,
  });
}

const langfuse = new Langfuse({
  publicKey: config.langfuse.publicKey,
  secretKey: config.langfuse.secretKey,
  baseUrl: config.langfuse.host,
});

export const resolvers = {
  Query: {
    queryNews: async (_: unknown, { query }: { query: string }): Promise<QueryResponse> => {
      const trace = await langfuse.trace({ name: 'news-query' });
      const span = await trace.span({ name: 'query-processing' });

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
        const index = pinecone.Index(config.pinecone.indexName);
        const searchResponse = await index.query({
          queryRequest: {
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true
          }
        });

        // Format sources
        const sources = searchResponse.matches?.map(match => ({
          title: (match.metadata as Record<string, string>)?.title || '',
          content: (match.metadata as Record<string, string>)?.content || '',
          url: (match.metadata as Record<string, string>)?.url || '',
          date: (match.metadata as Record<string, string>)?.date || '',
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
              content: `Question: ${query}\n\nRelevant articles:\n${sources.map(source => 
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

        await span.end();
        const traceUpdate: LangfuseTraceUpdate = {
          name: 'news-query',
          status: 'success'
        };
        await trace.update(traceUpdate);

        return {
          answer,
          sources,
        };
      } catch (error) {
        const spanUpdate: LangfuseSpanUpdate = {
          statusMessage: error instanceof Error ? error.message : 'Unknown error',
          level: 'ERROR'
        };
        await span.end(spanUpdate);
        
        const traceUpdate: LangfuseTraceUpdate = {
          name: 'news-query',
          status: 'error'
        };
        await trace.update(traceUpdate);
        
        throw error;
      }
    },
  },
}; 