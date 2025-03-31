import { Kafka } from 'kafkajs';
import config from '../config/index.js';
import { KafkaMessage } from '../types/index.js';
import { processArticle } from './article.js';

const kafka = new Kafka({
  clientId: 'news-article-agent',
  brokers: [config.kafka.broker],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: config.kafka.username,
    password: config.kafka.password,
  },
});

const consumer = kafka.consumer({ groupId: `${config.kafka.groupIdPrefix}${Date.now()}` });

export async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: config.kafka.topicName });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const kafkaMessage: KafkaMessage = JSON.parse(message.value?.toString() || '{}');
        await processArticle(kafkaMessage.url);
      } catch (error) {
        console.error('Error processing Kafka message:', error);
      }
    },
  });
}

export async function stopKafkaConsumer() {
  await consumer.disconnect();
} 