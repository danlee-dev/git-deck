export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  githubClientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
} as const;
