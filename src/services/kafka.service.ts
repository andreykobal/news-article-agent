import { Kafka, Consumer, Producer } from 'kafkajs';
import { config } from '../config/config.js';
import { processArticle } from './article.service.js';

export class KafkaService {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;

  constructor() {
    console.log('Initializing Kafka service with broker:', config.kafka.broker);
    this.kafka = new Kafka({
      clientId: 'news-article-agent',
      brokers: [config.kafka.broker],
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: config.kafka.username,
        password: config.kafka.password,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: `${config.kafka.groupIdPrefix}${Date.now()}`,
    });

    this.producer = this.kafka.producer();
  }

  async connect() {
    console.log('Connecting to Kafka...');
    await this.consumer.connect();
    await this.producer.connect();
    console.log('Successfully connected to Kafka');
  }

  async disconnect() {
    console.log('Disconnecting from Kafka...');
    await this.consumer.disconnect();
    await this.producer.disconnect();
    console.log('Successfully disconnected from Kafka');
  }

  async startConsuming() {
    console.log(`Subscribing to topic: ${config.kafka.topicName}`);
    await this.consumer.subscribe({ topic: config.kafka.topicName });

    console.log('Starting to consume messages...');
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const articleUrl = message.value?.toString();
          if (!articleUrl) {
            console.error('Received empty message from Kafka');
            return;
          }

          console.log(`Received article URL from Kafka: ${articleUrl}`);
          console.log('Processing article...');
          const result = await processArticle(articleUrl);
          console.log('Successfully processed article:', result);
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      },
    });
  }

  async sendMessage(topic: string, message: string) {
    console.log(`Sending message to topic: ${topic}`);
    await this.producer.send({
      topic,
      messages: [{ value: message }],
    });
    console.log('Message sent successfully');
  }
}

// Create and export a singleton instance
export const kafkaService = new KafkaService(); 