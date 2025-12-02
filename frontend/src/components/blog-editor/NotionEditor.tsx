'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import {
  BlockNoteView,
  darkDefaultTheme,
  lightDefaultTheme,
  Theme,
} from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useThemeStore } from '@/store/themeStore';
import { blogAPI } from '@/lib/api';

// Custom light theme - Notion style
const notionLightTheme: Theme = {
  colors: {
    editor: {
      text: '#37352f',
      background: 'transparent',
    },
    menu: {
      text: '#37352f',
      background: '#ffffff',
    },
    tooltip: {
      text: '#37352f',
      background: '#f7f6f3',
    },
    hovered: {
      text: '#37352f',
      background: '#f7f6f3',
    },
    selected: {
      text: '#37352f',
      background: '#e9e9e7',
    },
    disabled: {
      text: '#9b9a97',
      background: '#f7f6f3',
    },
    shadow: 'rgba(15, 15, 15, 0.05)',
    border: '#e9e9e7',
    sideMenu: '#9b9a97',
    highlights: lightDefaultTheme.colors!.highlights,
  },
  borderRadius: 4,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

// Custom dark theme - Notion dark style
const notionDarkTheme: Theme = {
  colors: {
    editor: {
      text: '#e6e6e6',
      background: 'transparent',
    },
    menu: {
      text: '#e6e6e6',
      background: '#252525',
    },
    tooltip: {
      text: '#e6e6e6',
      background: '#373737',
    },
    hovered: {
      text: '#e6e6e6',
      background: '#373737',
    },
    selected: {
      text: '#e6e6e6',
      background: '#454545',
    },
    disabled: {
      text: '#6b6b6b',
      background: '#373737',
    },
    shadow: 'rgba(0, 0, 0, 0.3)',
    border: '#373737',
    sideMenu: '#6b6b6b',
    highlights: darkDefaultTheme.colors!.highlights,
  },
  borderRadius: 4,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

interface NotionEditorProps {
  initialContent?: PartialBlock[];
  onChange?: (blocks: PartialBlock[], markdown: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  editable?: boolean;
  className?: string;
}

export default function NotionEditor({
  initialContent,
  onChange,
  onImageUpload,
  editable = true,
  className = '',
}: NotionEditorProps) {
  const { theme } = useThemeStore();

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    if (onImageUpload) {
      return onImageUpload(file);
    }

    try {
      const response = await blogAPI.uploadImage(file);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      return `${apiUrl}${response.data.url}`;
    } catch (error) {
      console.error('Image upload failed:', error);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }, [onImageUpload]);

  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: initialContent || undefined,
    uploadFile: handleImageUpload,
  });

  // Handle content changes
  useEffect(() => {
    if (!editor || !onChange) return;

    const handleChange = async () => {
      const blocks = editor.document;
      const markdown = await editor.blocksToMarkdownLossy(blocks);
      onChange(blocks, markdown);
    };

    editor.onEditorContentChange(handleChange);
  }, [editor, onChange]);

  // Add keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Option + Cmd + 8 for code block (Mac)
      // Alt + Ctrl + 8 for code block (Windows/Linux)
      if ((e.altKey && e.metaKey && e.key === '8') ||
          (e.altKey && e.ctrlKey && e.key === '8')) {
        e.preventDefault();
        const currentBlock = editor.getTextCursorPosition().block;
        if (currentBlock) {
          editor.updateBlock(currentBlock, {
            type: 'codeBlock',
            props: { language: 'typescript' },
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const editorTheme = useMemo(() => {
    return theme === 'dark' ? notionDarkTheme : notionLightTheme;
  }, [theme]);

  return (
    <div className={`notion-editor-wrapper ${className}`} data-theme={theme}>
      <BlockNoteView
        editor={editor}
        theme={editorTheme}
        editable={editable}
      />
      <style jsx global>{`
        .notion-editor-wrapper {
          min-height: 400px;
        }

        /* Force transparent backgrounds */
        .notion-editor-wrapper,
        .notion-editor-wrapper .bn-container,
        .notion-editor-wrapper .bn-editor,
        .notion-editor-wrapper .bn-block-outer,
        .notion-editor-wrapper .bn-block,
        .notion-editor-wrapper .bn-block-content,
        .notion-editor-wrapper .bn-block-group,
        .notion-editor-wrapper .bn-inline-content,
        .notion-editor-wrapper .ProseMirror {
          background: transparent !important;
          background-color: transparent !important;
        }

        .notion-editor-wrapper .bn-editor {
          padding: 0;
          min-height: 400px;
        }

        /* Light mode code block - Notion style */
        .notion-editor-wrapper [data-content-type="codeBlock"] {
          font-family: 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', monospace !important;
          font-size: 0.875em;
          background-color: #f7f6f3 !important;
          border-radius: 4px;
          padding: 1rem !important;
        }

        .notion-editor-wrapper [data-content-type="codeBlock"] pre,
        .notion-editor-wrapper [data-content-type="codeBlock"] code,
        .notion-editor-wrapper [data-content-type="codeBlock"] textarea {
          background-color: #f7f6f3 !important;
          color: #37352f !important;
          font-family: inherit !important;
        }

        /* Dark mode code block */
        .notion-editor-wrapper[data-theme="dark"] [data-content-type="codeBlock"] {
          background-color: #2f3437 !important;
        }

        .notion-editor-wrapper[data-theme="dark"] [data-content-type="codeBlock"] pre,
        .notion-editor-wrapper[data-theme="dark"] [data-content-type="codeBlock"] code,
        .notion-editor-wrapper[data-theme="dark"] [data-content-type="codeBlock"] textarea {
          background-color: #2f3437 !important;
          color: #e6e6e6 !important;
        }

        /* Quote block styling */
        .notion-editor-wrapper [data-content-type="paragraph"][data-quote="true"] {
          border-left: 3px solid #37352f;
          padding-left: 14px;
          margin-left: 2px;
        }

        .notion-editor-wrapper[data-theme="dark"] [data-content-type="paragraph"][data-quote="true"] {
          border-left-color: rgba(255, 255, 255, 0.5);
        }

        /* Nested block indentation */
        .notion-editor-wrapper .bn-block-group .bn-block-group {
          margin-left: 24px;
          border-left: 1px solid rgba(55, 53, 47, 0.1);
          padding-left: 12px;
        }

        .notion-editor-wrapper[data-theme="dark"] .bn-block-group .bn-block-group {
          border-left-color: rgba(255, 255, 255, 0.1);
        }

        /* Placeholder styling */
        .notion-editor-wrapper .bn-inline-content[data-is-empty-and-focused]::before {
          color: #9b9a97;
        }

        /* Side menu styling */
        .notion-editor-wrapper .bn-side-menu {
          background: transparent !important;
        }

        /* Formatting toolbar */
        .notion-editor-wrapper .bn-toolbar,
        .notion-editor-wrapper .bn-formatting-toolbar {
          border-radius: 6px;
          box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px;
        }

        .notion-editor-wrapper[data-theme="dark"] .bn-toolbar,
        .notion-editor-wrapper[data-theme="dark"] .bn-formatting-toolbar {
          box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 0px 1px, rgba(0, 0, 0, 0.4) 0px 3px 6px;
        }

        /* Slash menu */
        .notion-editor-wrapper .bn-suggestion-menu {
          border-radius: 6px;
          box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px;
        }

        .notion-editor-wrapper[data-theme="dark"] .bn-suggestion-menu {
          box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 0px 1px, rgba(0, 0, 0, 0.4) 0px 3px 6px;
        }

        /* List styling */
        .notion-editor-wrapper [data-content-type="bulletListItem"],
        .notion-editor-wrapper [data-content-type="numberedListItem"] {
          background: transparent !important;
        }

        /* Inline code */
        .notion-editor-wrapper code:not([data-content-type="codeBlock"] code) {
          background-color: rgba(135, 131, 120, 0.15) !important;
          color: #eb5757 !important;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 85%;
        }

        .notion-editor-wrapper[data-theme="dark"] code:not([data-content-type="codeBlock"] code) {
          background-color: rgba(135, 131, 120, 0.3) !important;
          color: #ff7b72 !important;
        }
      `}</style>
    </div>
  );
}
