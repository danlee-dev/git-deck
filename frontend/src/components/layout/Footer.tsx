'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex-shrink-0 py-3">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-github-gray-500 dark:text-github-gray-500">
        <span>&copy; {currentYear} GitDeck</span>
        <span className="text-github-gray-300 dark:text-github-gray-600">|</span>
        <Link href="/profile" className="hover:text-github-gray-700 dark:hover:text-github-gray-300 transition-colors">
          Editor
        </Link>
        <Link href="/settings" className="hover:text-github-gray-700 dark:hover:text-github-gray-300 transition-colors">
          Settings
        </Link>
        <a
          href="https://github.com/danlee-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-github-gray-700 dark:hover:text-github-gray-300 transition-colors"
        >
          GitHub
        </a>
        <a
          href="https://github.com/danlee-dev/git-deck/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-github-gray-700 dark:hover:text-github-gray-300 transition-colors"
        >
          Feedback
        </a>
      </div>
    </footer>
  );
}
