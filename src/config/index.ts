import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  kafka: z.object({
    broker: z.string(),
    username: z.string(),
    password: z.string(),
    topicName: z.string(),
    groupIdPrefix: z.string(),
  }),
  openai: z.object({
    apiKey: z.string(),
  }),
  pinecone: z.object({
    apiKey: z.string(),
    environment: z.string(),
    indexName: z.string(),
  }),
  langfuse: z.object({
    publicKey: z.string(),
    secretKey: z.string(),
    host: z.string(),
  }),
  server: z.object({
    port: z.string().transform(Number),
    nodeEnv: z.string(),
  }),
});

const config = configSchema.parse({
  kafka: {
    broker: process.env.KAFKA_BROKER,
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
    topicName: process.env.KAFKA_TOPIC_NAME,
    groupIdPrefix: process.env.KAFKA_GROUP_ID_PREFIX,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    indexName: process.env.PINECONE_INDEX_NAME,
  },
  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    host: process.env.LANGFUSE_HOST,
  },
  server: {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
  },
});

export default config; 