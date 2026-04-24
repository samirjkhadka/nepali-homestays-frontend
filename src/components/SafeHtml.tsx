import DOMPurify from 'dompurify';

/** Allowed tags for listing rich text (must match backend RICH_TEXT_OPTIONS). */
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'h2', 'h3', 'h4'];

type SafeHtmlProps = {
  html: string;
  className?: string;
  as?: 'div' | 'span';
};

/**
 * Renders sanitized HTML from listing description, directions, or about sections.
 * Use on the frontend so bold, lists, etc. display correctly.
 */
export function SafeHtml({ html, className = '', as: Tag = 'div' }: SafeHtmlProps) {
  if (!html?.trim()) return null;
  // Legacy plain text: wrap in <p> and turn newlines into <br> so it displays correctly
  const normalized = html.includes('<') ? html : `<p>${html.replace(/\n/g, '<br>')}</p>`;
  const clean = DOMPurify.sanitize(normalized, {
    ALLOWED_TAGS: [...ALLOWED_TAGS, 'br'],
    ALLOWED_ATTR: [],
  });
  return (
    <Tag
      className={`prose prose-sm max-w-none text-foreground/80 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_p]:my-2 [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mt-4 [&_h3]:font-semibold [&_h3]:mt-3 ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
