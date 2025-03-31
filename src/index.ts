import express from 'express';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema.js';
import { startKafkaConsumer } from './services/kafka.js';
import config from './config/index.js';

const app = express();

// Create GraphQL Yoga instance
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: true,
});

// Use GraphQL Yoga middleware
app.use('/graphql', yoga);

// Start Kafka consumer
startKafkaConsumer().catch(console.error);

// Start server
const port = config.server.port;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
}); 