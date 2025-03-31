import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const envSchema = z.object({
  // Kafka Configuration
  KAFKA_BROKER: z.string(),
  KAFKA_USERNAME: z.string(),
  KAFKA_PASSWORD: z.string(),
  KAFKA_TOPIC_NAME: z.string(),
  KAFKA_GROUP_ID_PREFIX: z.string(),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string(),

  // Pinecone Configuration
  PINECONE_API_KEY: z.string(),
  PINECONE_ENVIRONMENT: z.string(),
  PINECONE_INDEX_NAME: z.string(),

  // Langfuse Configuration
  LANGFUSE_PUBLIC_KEY: z.string(),
  LANGFUSE_SECRET_KEY: z.string(),
  LANGFUSE_HOST: z.string(),

  // Server Configuration
  PORT: z.string().transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const env = envSchema.parse(process.env);

export const config = {
  kafka: {
    broker: env.KAFKA_BROKER,
    username: env.KAFKA_USERNAME,
    password: env.KAFKA_PASSWORD,
    topicName: env.KAFKA_TOPIC_NAME,
    groupIdPrefix: env.KAFKA_GROUP_ID_PREFIX,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },
  pinecone: {
    apiKey: env.PINECONE_API_KEY,
    environment: env.PINECONE_ENVIRONMENT,
    indexName: env.PINECONE_INDEX_NAME,
  },
  langfuse: {
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    host: env.LANGFUSE_HOST,
  },
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  },
} as const; 