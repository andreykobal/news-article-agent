import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article } from '../types/index.js';

export async function crawlArticle(url: string): Promise<Article> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    $('iframe').remove();
    
    // Try to find the main content
    let content = '';
    let title = '';
    
    // Try common article title selectors
    const titleSelectors = [
      'h1',
      'article h1',
      '.article-title',
      '.post-title',
      '.entry-title',
      'header h1'
    ];
    
    for (const selector of titleSelectors) {
      const titleElement = $(selector).first();
      if (titleElement.length) {
        title = titleElement.text().trim();
        break;
      }
    }
    
    // Try common article content selectors
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main',
      '#content'
    ];
    
    for (const selector of contentSelectors) {
      const contentElement = $(selector);
      if (contentElement.length) {
        content = contentElement.text().trim();
        break;
      }
    }
    
    // If no specific content found, get all text from body
    if (!content) {
      content = $('body').text().trim();
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    return {
      title: title || 'Untitled Article',
      content,
      url,
      date: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error crawling article:', error);
    throw new Error('Failed to crawl article');
  }
} 