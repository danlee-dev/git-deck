'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useProfileEditorStore } from '@/store/profileEditorStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { FileText, Loader2 } from 'lucide-react';
import { blocksAPI } from '@/lib/api';
import SnippetsPanel from './snippets/SnippetsPanel';
import ScrollIndicator from './ScrollIndicator';
import MarkdownEditor from './MarkdownEditor';
import { addPositionDataToHTML } from '@/lib/markdownPositionMapper';
import type { EditorView } from '@codemirror/view';

export default function ProfilePreview() {
  const { markdownContent, setMarkdownContent, rawHTML, setRawHTML, renderedHTML, setRenderedHTML } = useProfileEditorStore();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const editorViewRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRenderingRef = useRef(false);

  const handleEditorReady = useCallback((view: EditorView) => {
    editorViewRef.current = view;
  }, []);

  const insertSnippet = useCallback((markdown: string) => {
    const view = editorViewRef.current;
    if (!view) {
      // Fallback: append to end
      setMarkdownContent(markdownContent + '\n\n' + markdown + '\n\n');
      return;
    }

    const state = view.state;
    const { from, to } = state.selection.main;

    const insert = '\n\n' + markdown + '\n\n';
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + insert.length }
    });
    view.focus();
  }, [markdownContent, setMarkdownContent]);

  const handlePreviewClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const view = editorViewRef.current;

    // Find closest element with line data
    let element = target;
    while (element && element !== previewRef.current) {
      const lineStart = element.getAttribute('data-line-start');
      const lineEnd = element.getAttribute('data-line-end');

      if (lineStart && lineEnd) {
        const start = parseInt(lineStart);
        const end = parseInt(lineEnd);

        if (view && !isNaN(start) && !isNaN(end)) {
          // Set selection first
          view.dispatch({
            selection: { anchor: start, head: end },
          });

          // Calculate center scroll position
          const coords = view.coordsAtPos(start);
          if (coords) {
            const scroller = view.scrollDOM;
            const scrollerRect = scroller.getBoundingClientRect();
            const viewportHeight = scrollerRect.height;

            // Target: center the selection in viewport
            const targetScrollTop = scroller.scrollTop + (coords.top - scrollerRect.top) - (viewportHeight / 2);

            // Clamp to valid scroll range
            const maxScroll = scroller.scrollHeight - viewportHeight;
            const clampedScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));

            scroller.scrollTo({
              top: clampedScrollTop,
              behavior: 'smooth'
            });
          }

          view.focus();
        }

        break;
      }

      element = element.parentElement as HTMLElement;
    }
  }, []);

  const processThemeAwareImages = useCallback((html: string) => {
    if (!user?.github_username) return html;

    // Add position data using AST-based mapping
    let processedHtml = addPositionDataToHTML(html, markdownContent);

    const makeAbsolute = (src: string) => {
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('//')) {
        return src;
      }
      const cleanSrc = src.startsWith('./') ? src.slice(2) : src.startsWith('/') ? src.slice(1) : src;
      return `https://raw.githubusercontent.com/${user.github_username}/${user.github_username}/main/${cleanSrc}`;
    };

    const pictureRegex = /<picture>([\s\S]*?)<\/picture>/gi;
    processedHtml = processedHtml.replace(pictureRegex, (match) => {
      const darkSourceMatch = match.match(/<source[^>]*media=["'][^"']*dark[^"']*["'][^>]*srcset=["']([^"']+)["']/i);
      const lightSourceMatch = match.match(/<source[^>]*media=["'][^"']*light[^"']*["'][^>]*srcset=["']([^"']+)["']/i);
      const imgMatch = match.match(/<img([^>]*)>/i);

      if (imgMatch) {
        let imgAttrs = imgMatch[1];
        imgAttrs = imgAttrs.replace(/\s*src=["'][^"']*["']/gi, '');

        if (darkSourceMatch && lightSourceMatch) {
          const darkSrc = makeAbsolute(darkSourceMatch[1]);
          const lightSrc = makeAbsolute(lightSourceMatch[1]);

          return `<span class="theme-aware-image-wrapper" style="display: inline-block;"><img${imgAttrs} src="${lightSrc}" class="light-theme-only"><img${imgAttrs} src="${darkSrc}" class="dark-theme-only"></span>`;
        } else if (darkSourceMatch || lightSourceMatch) {
          const srcset = darkSourceMatch?.[1] || lightSourceMatch?.[1];
          const absoluteSrc = makeAbsolute(srcset!);
          return `<img${imgAttrs} src="${absoluteSrc}">`;
        }
      }

      return match;
    });

    const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    processedHtml = processedHtml.replace(imgRegex, (match, before, src, after) => {
      if (match.includes('light-theme-only') || match.includes('dark-theme-only')) {
        return match;
      }

      let absoluteSrc = makeAbsolute(src);

      const hasThemeParam = absoluteSrc.includes('?') && absoluteSrc.includes('theme=');
      const hasDarkInPath = absoluteSrc.includes('-dark') || absoluteSrc.includes('_dark') || absoluteSrc.includes('dark-');
      const hasLightInPath = absoluteSrc.includes('-light') || absoluteSrc.includes('_light') || absoluteSrc.includes('light-');

      if (hasThemeParam || hasDarkInPath || hasLightInPath) {
        const lightSrc = hasThemeParam
          ? absoluteSrc.replace(/([?&])theme=[^&]+/, '$1theme=light')
          : absoluteSrc.replace(/(-dark|_dark|dark-)/g, '-light');

        const darkSrc = hasThemeParam
          ? absoluteSrc.replace(/([?&])theme=[^&]+/, '$1theme=dark')
          : absoluteSrc.replace(/(-light|_light|light-)/g, '-dark');

        return `<span class="theme-aware-image-wrapper" style="display: inline-block;"><img${before}src="${lightSrc}"${after} class="light-theme-only"><img${before}src="${darkSrc}"${after} class="dark-theme-only"></span>`;
      }

      return `<img${before}src="${absoluteSrc}"${after}>`;
    });

    return processedHtml;
  }, [user?.github_username, markdownContent]);

  const renderMarkdown = useCallback(async (markdown: string) => {
    if (!user?.github_username || !markdown.trim() || isRenderingRef.current) {
      return;
    }

    isRenderingRef.current = true;

    try {
      const response = await blocksAPI.renderMarkdown({
        markdown,
        repo_owner: user.github_username,
        repo_name: user.github_username,
      });

      if (response.data.status === 'success') {
        const raw = response.data.rendered_html;
        setRawHTML(raw);
        const processedHTML = processThemeAwareImages(raw);
        setRenderedHTML(processedHTML);
      }
    } catch (error) {
      console.error('Failed to render markdown:', error);
    } finally {
      isRenderingRef.current = false;
    }
  }, [user?.github_username, setRawHTML, setRenderedHTML, processThemeAwareImages, theme]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (markdownContent.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        renderMarkdown(markdownContent);
      }, 500);
    } else {
      setRenderedHTML(null);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [markdownContent, renderMarkdown, setRenderedHTML]);

  useEffect(() => {
    if (rawHTML) {
      const processedHTML = processThemeAwareImages(rawHTML);
      setRenderedHTML(processedHTML);
    }
  }, [theme, rawHTML, processThemeAwareImages, setRenderedHTML]);

  return (
    <div className="w-full max-w-[1920px] h-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(280px,1fr)] gap-4 h-full">
        <div
          ref={editorContainerRef}
          className="relative card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 overflow-hidden flex flex-col"
        >
          <MarkdownEditor
            value={markdownContent}
            onChange={setMarkdownContent}
            onEditorReady={handleEditorReady}
          />
          <ScrollIndicator containerRef={editorContainerRef} className="top-2" />
        </div>

        <div className="relative card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 overflow-hidden">
          <div
            ref={previewRef}
            className="p-8 md:p-12 h-full overflow-auto cursor-pointer"
            onClick={handlePreviewClick}
          >
            {!markdownContent.trim() ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-12 h-12 text-github-gray-400 dark:text-github-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-2">
                  Start Writing Your Profile
                </h3>
                <p className="text-sm text-github-gray-600 dark:text-github-gray-400 max-w-md">
                  Use the Quick Insert panel to add GitHub stats, badges, and sections
                </p>
              </div>
            ) : !renderedHTML ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="w-8 h-8 text-github-gray-400 dark:text-github-gray-600 animate-spin mb-4" />
                <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
                  Rendering preview...
                </p>
              </div>
            ) : (
              <article
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: renderedHTML }}
              />
            )}
          </div>
          <ScrollIndicator containerRef={previewRef} className="top-2" />
        </div>

        <div className="hidden lg:flex flex-col card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 p-0 overflow-hidden">
          <SnippetsPanel
            username={user?.github_username || ''}
            onInsert={insertSnippet}
          />
        </div>
      </div>
    </div>
  );
}
