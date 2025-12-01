export type BlockType =
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'paragraph'
  | 'image'
  | 'badge'
  | 'github-stats'
  | 'code'
  | 'quote'
  | 'list'
  | 'divider';

export interface BlockProperties {
  align?: 'left' | 'center' | 'right';
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  badgeUrl?: string;
  badgeLink?: string;
  language?: string;
  listType?: 'bullet' | 'numbered';
  statsType?: 'overview' | 'languages' | 'streak';
  githubUsername?: string;
}

export interface ProfileBlock {
  id: string;
  type: BlockType;
  content: string;
  properties: BlockProperties;
  order: number;
  isBlockLevel: boolean;
}

export interface BlockCategory {
  id: string;
  name: string;
  blocks: BlockTemplate[];
}

export interface BlockTemplate {
  type: BlockType;
  name: string;
  description: string;
  icon: string;
  defaultContent: string;
  defaultProperties: BlockProperties;
  isBlockLevel: boolean;
  previewImage?: string;
}

export const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    id: 'text',
    name: 'Text',
    blocks: [
      {
        type: 'heading-1',
        name: 'Heading 1',
        description: 'Large heading',
        icon: 'H1',
        defaultContent: 'Heading 1',
        defaultProperties: { align: 'left' },
        isBlockLevel: true,
      },
      {
        type: 'heading-2',
        name: 'Heading 2',
        description: 'Medium heading',
        icon: 'H2',
        defaultContent: 'Heading 2',
        defaultProperties: { align: 'left' },
        isBlockLevel: true,
      },
      {
        type: 'heading-3',
        name: 'Heading 3',
        description: 'Small heading',
        icon: 'H3',
        defaultContent: 'Heading 3',
        defaultProperties: { align: 'left' },
        isBlockLevel: true,
      },
      {
        type: 'paragraph',
        name: 'Paragraph',
        description: 'Text paragraph',
        icon: 'T',
        defaultContent: 'Start typing...',
        defaultProperties: { align: 'left' },
        isBlockLevel: true,
      },
      {
        type: 'quote',
        name: 'Quote',
        description: 'Block quote',
        icon: '❝',
        defaultContent: 'Quote text',
        defaultProperties: {},
        isBlockLevel: true,
      },
    ],
  },
  {
    id: 'media',
    name: 'Media',
    blocks: [
      {
        type: 'image',
        name: 'Image',
        description: 'Add an image',
        icon: '🖼',
        defaultContent: '',
        defaultProperties: {
          imageUrl: '',
          imageAlt: 'Image',
          imageWidth: 500,
          align: 'center',
        },
        isBlockLevel: false,
      },
    ],
  },
  {
    id: 'code',
    name: 'Code',
    blocks: [
      {
        type: 'code',
        name: 'Code Block',
        description: 'Code with syntax highlighting',
        icon: '</>',
        defaultContent: 'console.log("Hello World");',
        defaultProperties: { language: 'javascript' },
        isBlockLevel: true,
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    blocks: [
      {
        type: 'badge',
        name: 'Badge',
        description: 'Shields.io badge',
        icon: '🏷',
        defaultContent: '',
        defaultProperties: {
          badgeUrl: 'https://img.shields.io/badge/Status-Active-success',
          badgeLink: '',
        },
        isBlockLevel: false,
      },
      {
        type: 'github-stats',
        name: 'GitHub Stats',
        description: 'GitHub statistics card',
        icon: '📊',
        defaultContent: '',
        defaultProperties: {
          statsType: 'overview',
          githubUsername: '',
        },
        isBlockLevel: true,
      },
    ],
  },
  {
    id: 'formatting',
    name: 'Formatting',
    blocks: [
      {
        type: 'divider',
        name: 'Divider',
        description: 'Horizontal line',
        icon: '─',
        defaultContent: '',
        defaultProperties: {},
        isBlockLevel: true,
      },
      {
        type: 'list',
        name: 'List',
        description: 'Bullet or numbered list',
        icon: '•',
        defaultContent: '- Item 1\n- Item 2\n- Item 3',
        defaultProperties: { listType: 'bullet' },
        isBlockLevel: true,
      },
    ],
  },
];
