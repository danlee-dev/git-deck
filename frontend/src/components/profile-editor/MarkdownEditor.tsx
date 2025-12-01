'use client';

import { useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { useThemeStore } from '@/store/themeStore';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEditorReady?: (view: EditorView) => void;
}

// Custom key handler for markdown list continuation
const markdownListContinuation = EditorView.domEventHandlers({
  keydown(event, view) {
    if (event.key === 'Enter' && !event.shiftKey) {
      const state = view.state;
      const { from } = state.selection.main;
      const line = state.doc.lineAt(from);
      const lineText = line.text;

      // Check for unordered list (-, *, +)
      const unorderedMatch = lineText.match(/^(\s*)([-*+])\s+(.*)$/);
      if (unorderedMatch) {
        const [, indent, bullet, content] = unorderedMatch;
        // If line has content, continue list
        if (content.trim()) {
          event.preventDefault();
          const insert = `\n${indent}${bullet} `;
          view.dispatch({
            changes: { from, to: from, insert },
            selection: { anchor: from + insert.length }
          });
          return true;
        }
        // If line is empty bullet, remove it
        if (!content.trim()) {
          event.preventDefault();
          view.dispatch({
            changes: { from: line.from, to: line.to, insert: '' },
          });
          return true;
        }
      }

      // Check for ordered list (1., 2., etc.)
      const orderedMatch = lineText.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        const [, indent, num, content] = orderedMatch;
        // If line has content, continue list with incremented number
        if (content.trim()) {
          event.preventDefault();
          const nextNum = parseInt(num) + 1;
          const insert = `\n${indent}${nextNum}. `;
          view.dispatch({
            changes: { from, to: from, insert },
            selection: { anchor: from + insert.length }
          });
          return true;
        }
        // If line is empty, remove it
        if (!content.trim()) {
          event.preventDefault();
          view.dispatch({
            changes: { from: line.from, to: line.to, insert: '' },
          });
          return true;
        }
      }

      // Check for blockquote
      const quoteMatch = lineText.match(/^(\s*)(>+)\s*(.*)$/);
      if (quoteMatch) {
        const [, indent, quotes, content] = quoteMatch;
        if (content.trim()) {
          event.preventDefault();
          const insert = `\n${indent}${quotes} `;
          view.dispatch({
            changes: { from, to: from, insert },
            selection: { anchor: from + insert.length }
          });
          return true;
        }
      }

      // Check for checkbox list
      const checkboxMatch = lineText.match(/^(\s*)([-*+])\s+\[([ x])\]\s+(.*)$/);
      if (checkboxMatch) {
        const [, indent, bullet, , content] = checkboxMatch;
        if (content.trim()) {
          event.preventDefault();
          const insert = `\n${indent}${bullet} [ ] `;
          view.dispatch({
            changes: { from, to: from, insert },
            selection: { anchor: from + insert.length }
          });
          return true;
        }
      }
    }
    return false;
  }
});

// Editor theme customization
const editorTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    padding: '16px',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
});

// Light theme colors
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#24292f',
  },
  '.cm-content': {
    caretColor: '#24292f',
  },
  '.cm-cursor': {
    borderLeftColor: '#24292f',
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#b4d5fe !important',
  },
}, { dark: false });

// Dark theme colors
const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
  },
  '.cm-content': {
    caretColor: '#c9d1d9',
  },
  '.cm-cursor': {
    borderLeftColor: '#c9d1d9',
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#264f78 !important',
  },
}, { dark: true });

export default function MarkdownEditor({ value, onChange, onEditorReady }: MarkdownEditorProps) {
  const { theme } = useThemeStore();

  const handleChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  const handleCreateEditor = useCallback((view: EditorView) => {
    if (onEditorReady) {
      onEditorReady(view);
    }
  }, [onEditorReady]);

  const isDark = theme === 'dark';

  return (
    <CodeMirror
      onCreateEditor={handleCreateEditor}
      value={value}
      onChange={handleChange}
      theme={isDark ? 'dark' : 'light'}
      extensions={[
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of([indentWithTab]),
        markdownListContinuation,
        editorTheme,
        isDark ? darkTheme : lightTheme,
        EditorView.lineWrapping,
      ]}
      placeholder="# Write your markdown here...

Use Quick Insert panel to add stats, badges, and sections!"
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        dropCursor: true,
        allowMultipleSelections: true,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        rectangularSelection: true,
        crosshairCursor: false,
        highlightActiveLine: false,
        highlightSelectionMatches: true,
        closeBracketsKeymap: true,
        searchKeymap: true,
        historyKeymap: true,
        defaultKeymap: true,
      }}
      className="h-full"
    />
  );
}
