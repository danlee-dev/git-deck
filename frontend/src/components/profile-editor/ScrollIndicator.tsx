'use client';

import { useEffect, useState, RefObject } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollIndicatorProps {
  containerRef: RefObject<HTMLElement | null>;
  className?: string;
}

export default function ScrollIndicator({ containerRef, className = '' }: ScrollIndicatorProps) {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find the actual scrollable element (could be CodeMirror's .cm-scroller or the container itself)
    const cmScroller = container.querySelector('.cm-scroller') as HTMLElement | null;
    const actualContainer = cmScroller || container;
    setScrollContainer(actualContainer);

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = actualContainer;
      setCanScrollUp(scrollTop > 10);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10);
    };

    checkScroll();
    actualContainer.addEventListener('scroll', checkScroll);

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(actualContainer);

    // Also observe content changes
    const mutationObserver = new MutationObserver(checkScroll);
    mutationObserver.observe(actualContainer, { childList: true, subtree: true });

    return () => {
      actualContainer.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef]);

  const scrollTo = (direction: 'up' | 'down') => {
    if (!scrollContainer) return;

    const scrollAmount = scrollContainer.clientHeight * 0.8;
    scrollContainer.scrollBy({
      top: direction === 'up' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!canScrollUp && !canScrollDown) return null;

  return (
    <div className={`absolute right-2 flex flex-col gap-1 z-10 ${className}`}>
      <button
        onClick={() => scrollTo('up')}
        className={`p-1 rounded bg-github-gray-100/80 dark:bg-github-gray-700/80 backdrop-blur-sm border border-github-gray-200 dark:border-github-gray-600 transition-all duration-200 ${
          canScrollUp
            ? 'opacity-100 hover:bg-github-gray-200 dark:hover:bg-github-gray-600'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll up"
      >
        <ChevronUp className="w-3.5 h-3.5 text-github-gray-500 dark:text-github-gray-400" />
      </button>
      <button
        onClick={() => scrollTo('down')}
        className={`p-1 rounded bg-github-gray-100/80 dark:bg-github-gray-700/80 backdrop-blur-sm border border-github-gray-200 dark:border-github-gray-600 transition-all duration-200 ${
          canScrollDown
            ? 'opacity-100 hover:bg-github-gray-200 dark:hover:bg-github-gray-600'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll down"
      >
        <ChevronDown className="w-3.5 h-3.5 text-github-gray-500 dark:text-github-gray-400" />
      </button>
    </div>
  );
}
