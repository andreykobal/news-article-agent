import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config/config.js';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

const pinecone = new Pinecone({
  apiKey: config.pinecone.apiKey,
});

export async function processArticle(url: string) {
  try {
    console.log(`Fetching article content from URL: ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Extract title and content
    const title = $('title').text().trim();
    const content = $('article').text().trim() || $('main').text().trim() || $('body').text().trim();
    
    console.log('Extracted title:', title);
    console.log('Content length:', content.length);
    
    // Clean and structure the content using OpenAI
    console.log('Cleaning and structuring content with OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that structures article content into a clean format."
        },
        {
          role: "user",
          content: `Please clean and structure this article content:\n\nTitle: ${title}\n\nContent: ${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const structuredContent = JSON.parse(completion.choices[0].message.content || '{}');
    console.log('Structured content:', structuredContent);
    
    // Create embedding for the article
    console.log('Creating embedding for the article...');
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: structuredContent.content,
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log('Embedding created successfully');

    // Store in Pinecone
    console.log('Storing article in Pinecone...');
    const index = pinecone.Index(config.pinecone.indexName);
    await index.upsert([{
      id: url,
      values: embedding,
      metadata: {
        title: structuredContent.title,
        content: structuredContent.content,
        url: url,
        date: new Date().toISOString(),
      }
    }]);
    console.log('Article stored successfully in Pinecone');

    return {
      title: structuredContent.title,
      content: structuredContent.content,
      url: url,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error processing article:', error);
    throw error;
  }
} 