import express from 'express';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema.js';
import { kafkaService } from './services/kafka.service.js';
import { config } from './config/config.js';
import { Pinecone } from '@pinecone-database/pinecone';

const app = express();

// Create GraphQL Yoga instance
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: true,
});

// Use GraphQL Yoga middleware
app.use('/graphql', yoga);

const port = config.server.port;

async function verifyPineconeIndex() {
  try {
    const pinecone = new Pinecone({
      apiKey: config.pinecone.apiKey,
    });
    
    const index = pinecone.Index(config.pinecone.indexName);
    const stats = await index.describeIndexStats();
    console.log('Pinecone index stats:', stats);
    return true;
  } catch (error) {
    console.error('Error verifying Pinecone index:', error);
    return false;
  }
}

async function startServer() {
  try {
    // Verify Pinecone index
    console.log('Verifying Pinecone index...');
    const pineconeVerified = await verifyPineconeIndex();
    if (!pineconeVerified) {
      throw new Error('Failed to verify Pinecone index');
    }

    // Connect to Kafka
    await kafkaService.connect();
    console.log('Connected to Kafka');

    // Start consuming messages
    await kafkaService.startConsuming();
    console.log('Started consuming Kafka messages');

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await kafkaService.disconnect();
  process.exit(0);
});

startServer(); 