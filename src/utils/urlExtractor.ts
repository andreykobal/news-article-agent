export function extractUrl(text: string): string | null {
  // URL regex pattern that matches common URL formats
  const urlPattern = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlPattern);
  return match ? match[1] : null;
} 