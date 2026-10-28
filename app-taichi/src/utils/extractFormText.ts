import type { ContentSection } from '@/data/types';

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/[#~_]/g, '')
    .trim();
}

/** Extract clean plain text from a form's sections for TTS. */
export function extractFormText(sections: ContentSection[]): string {
  const parts: string[] = [];
  for (const s of sections) {
    switch (s.type) {
      case 'heading':
      case 'paragraph': {
        const clean = stripMarkdown(s.text);
        if (clean) parts.push(clean);
        break;
      }
      case 'list': {
        s.items.forEach((item, i) => {
          const clean = stripMarkdown(item);
          if (clean) parts.push(s.ordered ? `${i + 1}. ${clean}` : clean);
        });
        break;
      }
      case 'callout': {
        const clean = stripMarkdown(s.text);
        if (clean) parts.push(clean);
        break;
      }
      case 'image':
        parts.push('Có hình minh họa tư thế.');
        break;
      case 'video':
        parts.push(`Có video hướng dẫn: ${stripMarkdown(s.title)}.`);
        break;
    }
  }
  return parts.join('. ');
}
