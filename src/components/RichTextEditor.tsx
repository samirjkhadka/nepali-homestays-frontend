import { useRef, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  minHeight?: string;
};

/**
 * WYSIWYG editor for listing description, directions, and about sections.
 * Outputs safe HTML (p, strong, em, ul, ol, li, h2, h3, etc.) for display on frontend and app.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here…',
  id,
  className = '',
  minHeight = '120px',
}: RichTextEditorProps) {
  const skipNextOnUpdate = useRef(false);
  const extensions = useMemo(
    () => [StarterKit, Placeholder.configure({ placeholder })],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (skipNextOnUpdate.current) {
        skipNextOnUpdate.current = false;
        return;
      }
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const normalized = (value || '').trim();
    const currentNorm = current.trim();
    if (normalized !== currentNorm) {
      skipNextOnUpdate.current = true;
      editor.commands.setContent(normalized || '<p></p>', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      id={id}
      className={`rounded-md border border-input bg-background overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      {/* Toolbar - user-friendly for non-tech users */}
      <div className="flex items-center gap-0.5 border-b border-input bg-muted/40 px-1 py-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 hover:bg-muted ${editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
          title="Bold"
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 hover:bg-muted ${editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
          title="Italic"
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 hover:bg-muted ${editor.isActive('bulletList') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
          title="Bullet list"
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 hover:bg-muted ${editor.isActive('orderedList') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        [data-tiptap-editor] .ProseMirror {
          min-height: 80px;
        }
        [data-tiptap-editor] .ProseMirror p,
        [data-tiptap-editor] .ProseMirror ul,
        [data-tiptap-editor] .ProseMirror ol {
          margin: 0.5em 0;
        }
        [data-tiptap-editor] .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
        [data-tiptap-editor] .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
      `}</style>
    </div>
  );
}
