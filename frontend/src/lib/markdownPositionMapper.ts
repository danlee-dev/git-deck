import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

export interface BlockPosition {
  type: string;
  start: number;
  end: number;
  text: string;
  depth?: number; // for headings
  hasImage?: boolean; // contains image (badges, etc.)
}

/**
 * Parse markdown and extract block-level element positions
 * Returns array of blocks with their exact character positions
 */
export function parseMarkdownBlocks(markdown: string): BlockPosition[] {
  const blocks: BlockPosition[] = [];
  const lines = markdown.split('\n');

  try {
    const tree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(markdown);

    // Helper to convert line/column to character position
    const toCharPos = (line: number, column: number): number => {
      let pos = 0;
      for (let i = 0; i < line - 1; i++) {
        pos += lines[i].length + 1;
      }
      return pos + column - 1;
    };

    // Helper to extract plain text from node
    const extractText = (node: any): string => {
      if (node.value) return node.value;
      if (node.children) {
        return node.children.map((child: any) => extractText(child)).join('');
      }
      return '';
    };

    // Helper to check if node contains an image
    const containsImage = (node: any): boolean => {
      if (node.type === 'image') return true;
      // Check for <img> or <picture> in raw HTML blocks
      if (node.type === 'html' && node.value) {
        return /<img\s|<picture>/i.test(node.value);
      }
      if (node.children) {
        return node.children.some((child: any) => containsImage(child));
      }
      return false;
    };

    visit(tree, (node: any) => {
      // Only process block-level elements at depth 1 (direct children of root)
      if (!node.position) return;

      const blockTypes = ['heading', 'paragraph', 'list', 'blockquote', 'code', 'table', 'thematicBreak', 'html'];

      if (blockTypes.includes(node.type)) {
        const start = toCharPos(node.position.start.line, node.position.start.column);
        const end = toCharPos(node.position.end.line, node.position.end.column);
        const text = extractText(node).trim().substring(0, 100); // First 100 chars for matching
        const hasImage = containsImage(node);

        blocks.push({
          type: node.type,
          start,
          end,
          text,
          depth: node.depth, // for headings (h1=1, h2=2, etc.)
          hasImage,
        });
      }
    });
  } catch (error) {
    console.error('Failed to parse markdown:', error);
  }

  return blocks;
}

/**
 * Map HTML tag to markdown block type
 */
function htmlTagToBlockType(tag: string): string | null {
  const mapping: Record<string, string> = {
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'p': 'paragraph',
    'ul': 'list',
    'ol': 'list',
    'blockquote': 'blockquote',
    'pre': 'code',
    'table': 'table',
    'hr': 'thematicBreak',
  };
  return mapping[tag.toLowerCase()] || null;
}

/**
 * Get heading depth from tag
 */
function getHeadingDepth(tag: string): number | null {
  const match = tag.match(/^h([1-6])$/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Normalize text for comparison (remove extra whitespace, lowercase)
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 50);
}

/**
 * Extract text content from HTML string
 */
function extractTextFromHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if content contains image (badges, etc.)
 */
function hasImageContent(htmlContent: string): boolean {
  return /<img\s/i.test(htmlContent);
}

/**
 * Check if markdown block contains image (badges, etc.)
 */
function isImageBlock(block: BlockPosition): boolean {
  return block.hasImage === true;
}

/**
 * Find best matching block - prioritize same type (image/text), then fallback to sequential
 */
function findMatchingBlock(
  htmlContent: string,
  blocks: BlockPosition[],
  usedIndices: Set<number>,
  imageIndices: Set<number>
): { block: BlockPosition | null; index: number } {
  const htmlText = normalizeText(extractTextFromHTML(htmlContent));
  const htmlHasImage = hasImageContent(htmlContent);

  // First, try text-based matching if there's text content
  if (htmlText && htmlText.length >= 3) {
    let bestMatch: BlockPosition | null = null;
    let bestScore = 0;
    let bestIndex = -1;

    for (let i = 0; i < blocks.length; i++) {
      if (usedIndices.has(i)) continue;

      const blockText = normalizeText(blocks[i].text);
      if (!blockText) continue;

      const shorter = htmlText.length < blockText.length ? htmlText : blockText;
      const longer = htmlText.length < blockText.length ? blockText : htmlText;

      if (longer.includes(shorter) || shorter.includes(longer.substring(0, 20))) {
        const score = shorter.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = blocks[i];
          bestIndex = i;
        }
      }
    }

    if (bestMatch && bestIndex >= 0) {
      usedIndices.add(bestIndex);
      return { block: bestMatch, index: bestIndex };
    }
  }

  // For image content, match with image blocks first (in order)
  if (htmlHasImage) {
    for (let i = 0; i < blocks.length; i++) {
      if (usedIndices.has(i)) continue;
      if (!imageIndices.has(i)) continue;

      usedIndices.add(i);
      return { block: blocks[i], index: i };
    }
  }

  // Fallback: match with any unused block in order
  for (let i = 0; i < blocks.length; i++) {
    if (usedIndices.has(i)) continue;

    usedIndices.add(i);
    return { block: blocks[i], index: i };
  }

  return { block: null, index: -1 };
}

/**
 * Add position data attributes to HTML based on markdown AST
 * Uses text content matching for more accurate mapping
 */
export function addPositionDataToHTML(html: string, markdown: string): string {
  const blocks = parseMarkdownBlocks(markdown);

  if (blocks.length === 0) return html;

  // Group blocks by type and track image blocks
  const blocksByType: Record<string, BlockPosition[]> = {};
  const imageByType: Record<string, Set<number>> = {};

  blocks.forEach(block => {
    const key = block.type + (block.depth || '');
    if (!blocksByType[key]) {
      blocksByType[key] = [];
      imageByType[key] = new Set();
    }
    const idx = blocksByType[key].length;
    blocksByType[key].push(block);

    if (isImageBlock(block)) {
      imageByType[key].add(idx);
    }
  });

  // Track used blocks per type
  const usedByType: Record<string, Set<number>> = {};

  const blockTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote', 'pre', 'table', 'hr'];

  let result = html;

  blockTags.forEach(tag => {
    const blockType = htmlTagToBlockType(tag);
    if (!blockType) return;

    const headingDepth = getHeadingDepth(tag);
    const key = blockType + (headingDepth || '');

    if (!blocksByType[key]) return;
    if (!usedByType[key]) usedByType[key] = new Set();

    // Match full elements to extract content for matching
    const fullElementRegex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)</${tag}>`, 'gi');

    result = result.replace(fullElementRegex, (match, attrs = '', content) => {
      const blocksOfType = blocksByType[key];
      const usedIndices = usedByType[key];
      const imageIndices = imageByType[key];

      // Try to find matching block by content
      const { block: matchingBlock } = findMatchingBlock(
        content,
        blocksOfType,
        usedIndices,
        imageIndices
      );

      if (matchingBlock) {
        const dataAttrs = ` data-line-start="${matchingBlock.start}" data-line-end="${matchingBlock.end}"`;
        return `<${tag}${attrs}${dataAttrs}>${content}</${tag}>`;
      }

      return match;
    });
  });

  return result;
}
