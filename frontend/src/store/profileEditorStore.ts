import { create } from 'zustand';

const STORAGE_KEY = 'gitdeck-profile-markdown';
const SHA_STORAGE_KEY = 'gitdeck-last-synced-sha';

const loadMarkdownFromStorage = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || '';
  } catch (error) {
    console.error('Failed to load markdown from localStorage:', error);
    return '';
  }
};

const saveMarkdownToStorage = (markdown: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, markdown);
  } catch (error) {
    console.error('Failed to save markdown to localStorage:', error);
  }
};

export const loadLastSyncedSha = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SHA_STORAGE_KEY);
  } catch (error) {
    return null;
  }
};

export const saveLastSyncedSha = (sha: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (sha) {
      localStorage.setItem(SHA_STORAGE_KEY, sha);
    } else {
      localStorage.removeItem(SHA_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save SHA to localStorage:', error);
  }
};

interface ProfileEditorState {
  markdownContent: string;
  rawHTML: string | null;
  renderedHTML: string | null;

  setMarkdownContent: (markdown: string) => void;
  setRawHTML: (html: string | null) => void;
  setRenderedHTML: (html: string | null) => void;
  clearContent: () => void;
}

export const useProfileEditorStore = create<ProfileEditorState>((set) => ({
  markdownContent: loadMarkdownFromStorage(),
  rawHTML: null,
  renderedHTML: null,

  setMarkdownContent: (markdown) => {
    saveMarkdownToStorage(markdown);
    set({ markdownContent: markdown });
  },

  setRawHTML: (html) => {
    set({ rawHTML: html });
  },

  setRenderedHTML: (html) => {
    set({ renderedHTML: html });
  },

  clearContent: () => {
    saveMarkdownToStorage('');
    set({ markdownContent: '', rawHTML: null, renderedHTML: null });
  },
}));
