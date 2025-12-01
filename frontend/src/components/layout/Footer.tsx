'use client';

import { Github } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex-shrink-0 bg-github-gray-50 dark:bg-github-gray-900">
      <div className="w-full px-4 md:px-6 lg:px-8 pt-1 pb-3">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-github-gray-600 dark:text-github-gray-400">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            <span>&copy; {currentYear} GitDeck</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/profile" className="hover:text-github-blue dark:hover:text-blue-400 transition-colors">
              Editor
            </Link>
            <Link href="/settings" className="hover:text-github-blue dark:hover:text-blue-400 transition-colors">
              Settings
            </Link>
            <a
              href="https://github.com/danlee-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-github-blue dark:hover:text-blue-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/danlee-dev/git-deck/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-github-blue dark:hover:text-blue-400 transition-colors"
            >
              Feedback
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
