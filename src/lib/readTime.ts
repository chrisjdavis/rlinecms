export function calculateReadTime(content: string): number {
  // Average reading speed (words per minute)
  const wordsPerMinute = 200;

  // Remove HTML tags if present
  const text = content.replace(/<[^>]*>/g, '');

  // Count words (split by whitespace)
  const words = text.trim().split(/\s+/).length;

  // Calculate reading time in minutes
  const readTime = Math.ceil(words / wordsPerMinute);

  // Return at least 1 minute
  return Math.max(1, readTime);
} 