import { ProfileBlock } from '@/types/profile-blocks';

export function convertBlocksToMarkdown(blocks: ProfileBlock[]): string {
  return blocks
    .filter(block => block.isBlockLevel)
    .sort((a, b) => a.order - b.order)
    .map(block => convertBlockToMarkdown(block))
    .join('\n\n');
}

function convertBlockToMarkdown(block: ProfileBlock): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(block.content, 'text/html');

  switch (block.type) {
    case 'heading-1': {
      const h1 = doc.querySelector('h1');
      return h1 ? `# ${h1.textContent || ''}` : '';
    }

    case 'heading-2': {
      const h2 = doc.querySelector('h2');
      return h2 ? `## ${h2.textContent || ''}` : '';
    }

    case 'heading-3': {
      const h3 = doc.querySelector('h3');
      return h3 ? `### ${h3.textContent || ''}` : '';
    }

    case 'paragraph': {
      const p = doc.querySelector('p');
      return p ? p.textContent || '' : '';
    }

    case 'quote': {
      const blockquote = doc.querySelector('blockquote');
      if (!blockquote) return '';
      const lines = (blockquote.textContent || '').split('\n');
      return lines.map(line => `> ${line}`).join('\n');
    }

    case 'code': {
      const pre = doc.querySelector('pre code');
      if (!pre) return '';
      const code = pre.textContent || '';
      const language = block.properties.language || '';
      return `\`\`\`${language}\n${code}\n\`\`\``;
    }

    case 'list': {
      const ul = doc.querySelector('ul');
      const ol = doc.querySelector('ol');

      if (ul) {
        const items = Array.from(ul.querySelectorAll('li'));
        return items.map(li => `- ${li.textContent || ''}`).join('\n');
      }

      if (ol) {
        const items = Array.from(ol.querySelectorAll('li'));
        return items.map((li, i) => `${i + 1}. ${li.textContent || ''}`).join('\n');
      }

      return '';
    }

    case 'image': {
      const imageUrl = block.properties.imageUrl || '';
      const imageAlt = block.properties.imageAlt || 'Image';
      return imageUrl ? `![${imageAlt}](${imageUrl})` : '';
    }

    case 'badge': {
      const badgeUrl = block.properties.badgeUrl || '';
      const badgeLink = block.properties.badgeLink || '';

      if (!badgeUrl) return '';

      if (badgeLink) {
        return `[![Badge](${badgeUrl})](${badgeLink})`;
      }

      return `![Badge](${badgeUrl})`;
    }

    case 'github-stats': {
      const statsType = block.properties.statsType || 'overview';
      const username = block.properties.username || '{username}';

      switch (statsType) {
        case 'overview':
          return `![GitHub Stats](https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true)`;
        case 'languages':
          return `![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact)`;
        case 'streak':
          return `![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?user=${username})`;
        default:
          return '';
      }
    }

    case 'divider': {
      return '---';
    }

    default:
      return '';
  }
}
