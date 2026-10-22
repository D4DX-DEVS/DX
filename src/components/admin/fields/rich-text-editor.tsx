"use client";

import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useImageUpload } from "./image-field";

interface RichTextEditorProps {
  id: string;
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
  /** Allow inserting uploaded images (blog posts). */
  images?: boolean;
}

interface ToolProps {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function Tool({ label, icon: Icon, active, disabled, onClick }: ToolProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-11 place-items-center rounded-lg text-soft transition-colors md:size-8",
        "hover:bg-accent hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-40",
        active && "bg-accent text-ink",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

/** Headings, emphasis, lists, quotes, links and (optionally) images. The server sanitises the HTML on save. */
export function RichTextEditor({ id, value, onChange, invalid, images = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      Image.configure({ inline: false }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        // The site's own article styles, so the editor reads like the published page.
        class: "prose-d4 min-h-56 max-w-none px-4 py-3 text-[0.9375rem] focus:outline-none [&_img]:rounded-lg",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  const upload = useImageUpload((media) => {
    let chain = editor?.chain().focus();
    for (const m of media) chain = chain?.setImage({ src: m.url, alt: m.alt });
    chain?.run();
  });

  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  const hrefValid = /^(https?:\/\/\S+|mailto:\S+|\/\S*)$/.test(href.trim());

  function applyLink() {
    if (!editor || !hrefValid) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
    setLinkOpen(false);
  }

  function onLinkTool() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    setHref("");
    setLinkOpen(true);
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-input bg-input/30", invalid && "border-destructive")}>
      {images ? upload.input() : null}
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
        <Tool label="Heading" icon={Heading2} active={state?.h2} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
        <Tool label="Subheading" icon={Heading3} active={state?.h3} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} />
        <Tool label="Bold" icon={Bold} active={state?.bold} onClick={() => editor?.chain().focus().toggleBold().run()} />
        <Tool label="Italic" icon={Italic} active={state?.italic} onClick={() => editor?.chain().focus().toggleItalic().run()} />
        <Tool label="Bulleted list" icon={List} active={state?.bullet} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
        <Tool label="Numbered list" icon={ListOrdered} active={state?.ordered} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
        <Tool label="Quote" icon={Quote} active={state?.quote} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverAnchor asChild>
            <span>
              <Tool label={state?.link ? "Remove link" : "Add link"} icon={Link2} active={state?.link} onClick={onLinkTool} />
            </span>
          </PopoverAnchor>
          <PopoverContent align="start" className="w-80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyLink();
              }}
              className="flex flex-col gap-2"
            >
              <label htmlFor={`${id}-href`} className="text-sm font-medium">
                Link address
              </label>
              <Input id={`${id}-href`} value={href} onChange={(e) => setHref(e.target.value)} placeholder="https://…" autoFocus />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setLinkOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!hrefValid}>
                  Add link
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
        {images ? <Tool label="Insert image" icon={upload.busy ? Loader2 : ImagePlus} disabled={upload.busy} onClick={upload.open} /> : null}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <Tool label="Undo" icon={Undo2} disabled={!state?.canUndo} onClick={() => editor?.chain().focus().undo().run()} />
        <Tool label="Redo" icon={Redo2} disabled={!state?.canRedo} onClick={() => editor?.chain().focus().redo().run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
