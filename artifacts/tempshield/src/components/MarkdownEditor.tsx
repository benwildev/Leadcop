import React, { useRef, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Link,
  Image,
  Minus,
  Eye,
  Edit3,
  Columns2,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type ViewMode = "write" | "preview" | "split";

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  action: () => void;
  shortcut?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "## Start writing your content in Markdown...",
  minHeight = 400,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  const insertText = useCallback(
    (before: string, after = "", defaultText = "") => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = ta.value.slice(start, end) || defaultText;
      const newValue =
        ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        ta.focus();
        const newCursor = start + before.length + selected.length;
        ta.setSelectionRange(
          start + before.length,
          start + before.length + selected.length
        );
        if (!selected) {
          ta.setSelectionRange(newCursor - after.length - defaultText.length, newCursor - after.length);
        }
      });
    },
    [onChange]
  );

  const insertLine = useCallback(
    (prefix: string, defaultText = "Text") => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = ta.value.indexOf("\n", start);
      const end = lineEnd === -1 ? ta.value.length : lineEnd;
      const lineText = ta.value.slice(lineStart, end);
      const trimmed = lineText.trimStart();
      const hasPrefix = trimmed.startsWith(prefix.trim());
      let newValue: string;
      let newCursorStart: number;
      let newCursorEnd: number;

      if (hasPrefix) {
        const withoutPrefix = lineText.replace(prefix.trim(), "").trimStart();
        newValue = ta.value.slice(0, lineStart) + withoutPrefix + ta.value.slice(end);
        newCursorStart = lineStart;
        newCursorEnd = lineStart + withoutPrefix.length;
      } else {
        const inserted = prefix + (trimmed || defaultText);
        newValue = ta.value.slice(0, lineStart) + inserted + ta.value.slice(end);
        newCursorStart = lineStart + prefix.length;
        newCursorEnd = lineStart + inserted.length;
      }
      onChange(newValue);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(newCursorStart, newCursorEnd);
      });
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "b") { e.preventDefault(); insertText("**", "**", "bold text"); }
      if (ctrl && e.key === "i") { e.preventDefault(); insertText("*", "*", "italic text"); }
      if (ctrl && e.key === "k") { e.preventDefault(); insertText("[", "](url)", "link text"); }
      if (ctrl && e.key === "`") { e.preventDefault(); insertText("`", "`", "code"); }
      if (e.key === "Tab") {
        e.preventDefault();
        insertText("  ");
      }
    },
    [insertText]
  );

  const actions: (ToolbarAction | "separator")[] = [
    {
      icon: Bold,
      label: "Bold (Ctrl+B)",
      action: () => insertText("**", "**", "bold text"),
    },
    {
      icon: Italic,
      label: "Italic (Ctrl+I)",
      action: () => insertText("*", "*", "italic text"),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      action: () => insertText("~~", "~~", "strikethrough text"),
    },
    "separator",
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => insertLine("# ", "Heading 1"),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => insertLine("## ", "Heading 2"),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      action: () => insertLine("### ", "Heading 3"),
    },
    "separator",
    {
      icon: List,
      label: "Bullet List",
      action: () => insertLine("- ", "List item"),
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => insertLine("1. ", "List item"),
    },
    {
      icon: Quote,
      label: "Blockquote",
      action: () => insertLine("> ", "Blockquote text"),
    },
    "separator",
    {
      icon: Code,
      label: "Inline Code (Ctrl+`)",
      action: () => insertText("`", "`", "code"),
    },
    {
      icon: Code2,
      label: "Code Block",
      action: () => insertText("```\n", "\n```", "code here"),
    },
    "separator",
    {
      icon: Link,
      label: "Link (Ctrl+K)",
      action: () => insertText("[", "](url)", "link text"),
    },
    {
      icon: Image,
      label: "Image",
      action: () => insertText("![", "](url)", "alt text"),
    },
    {
      icon: Minus,
      label: "Horizontal Rule",
      action: () => {
        const ta = textareaRef.current;
        if (!ta) return;
        const pos = ta.selectionStart;
        const newValue = ta.value.slice(0, pos) + "\n\n---\n\n" + ta.value.slice(pos);
        onChange(newValue);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(pos + 7, pos + 7);
        });
      },
    },
  ];

  const viewModes: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
    { mode: "write", icon: Edit3, label: "Write" },
    { mode: "preview", icon: Eye, label: "Preview" },
    { mode: "split", icon: Columns2, label: "Split" },
  ];

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-2 py-1.5 flex-wrap gap-1">
        {/* Formatting buttons */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {actions.map((action, i) =>
            action === "separator" ? (
              <div key={i} className="mx-1 h-5 w-px bg-border/60" />
            ) : (
              <button
                key={action.label}
                type="button"
                title={action.label}
                onClick={action.action}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <action.icon className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-border/60 bg-background/50 overflow-hidden">
          {viewModes.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              title={label}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor / Preview area */}
      <div
        className="flex"
        style={{ minHeight }}
      >
        {/* Write pane */}
        {(viewMode === "write" || viewMode === "split") && (
          <div className={`flex flex-col ${viewMode === "split" ? "w-1/2 border-r border-border" : "w-full"}`}>
            {viewMode === "split" && (
              <div className="border-b border-border/50 bg-muted/20 px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Markdown</span>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 w-full resize-none bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
              style={{ minHeight: viewMode === "split" ? minHeight - 33 : minHeight }}
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview pane */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={`flex flex-col ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
            {viewMode === "split" && (
              <div className="border-b border-border/50 bg-muted/20 px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Preview</span>
              </div>
            )}
            <div
              className="flex-1 overflow-y-auto px-5 py-4"
              style={{ minHeight: viewMode === "split" ? minHeight - 33 : minHeight }}
            >
              {value.trim() ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {value}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">
                  Nothing to preview yet. Start writing on the left.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer status bar */}
      <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-1.5">
        <span className="text-[10px] text-muted-foreground">
          {value.split(/\s+/).filter(Boolean).length} words &nbsp;·&nbsp; {value.length} chars
        </span>
        <span className="text-[10px] text-muted-foreground">
          Markdown &nbsp;·&nbsp; <kbd className="rounded bg-muted px-1 py-0.5 text-[9px]">Ctrl+B</kbd> Bold &nbsp;
          <kbd className="rounded bg-muted px-1 py-0.5 text-[9px]">Ctrl+I</kbd> Italic &nbsp;
          <kbd className="rounded bg-muted px-1 py-0.5 text-[9px]">Ctrl+K</kbd> Link
        </span>
      </div>
    </div>
  );
}
