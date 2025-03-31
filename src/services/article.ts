import puppeteer from 'puppeteer';
import { OpenAI } from 'openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import { Article } from '../types/index.js';
import config from '../config/index.js';

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

export async function processArticle(url: string): Promise<void> {
  try {
    if (!pinecone) {
      await initPinecone();
    }

    // Extract content using Puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    const content = await page.evaluate(() => {
      // Remove unwanted elements
      const selectors = ['script', 'style', 'nav', 'header', 'footer', 'iframe'];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
      
      return {
        title: document.title,
        content: document.body.innerText,
        date: new Date().toISOString(),
      };
    });
    
    await browser.close();

    // Clean and structure content using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that cleans and structures news article content. Extract the main content, remove any noise, and format it properly."
        },
        {
          role: "user",
          content: `Clean and structure this article content:\n\nTitle: ${content.title}\n\nContent: ${content.content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const cleanedContent = JSON.parse(completion.choices[0].message.content || '{}');

    // Create article object
    const article: Article = {
      title: cleanedContent.title || content.title,
      content: cleanedContent.content || content.content,
      url,
      date: cleanedContent.date || content.date,
    };

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${article.title}\n${article.content}`,
    });

    article.embedding = embeddingResponse.data[0].embedding;

    // Store in Pinecone
    const index = pinecone.Index(config.pinecone.indexName);
    await index.upsert({
      upsertRequest: {
        vectors: [{
          id: url,
          values: article.embedding,
          metadata: {
            title: article.title,
            content: article.content,
            url: article.url,
            date: article.date,
          }
        }]
      }
    });

  } catch (error) {
    console.error('Error processing article:', error);
    throw error;
  }
} 