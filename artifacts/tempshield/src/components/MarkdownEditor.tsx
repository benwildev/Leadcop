import React from "react";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "## Start writing your content in Markdown...",
  minHeight = 440,
}: Props) {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div data-color-mode={isDark ? "dark" : "light"} className="rounded-xl overflow-hidden border border-border shadow-sm">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={minHeight}
        preview="live"
        visibleDragbar={false}
        textareaProps={{
          placeholder,
        }}
        style={{
          borderRadius: 0,
          border: "none",
        }}
      />
    </div>
  );
}
