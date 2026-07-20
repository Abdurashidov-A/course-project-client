import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Typography } from "antd";

const { Text } = Typography;

export function MarkdownText({ children, className = "", emptyText, compact = false }) {
  const source = typeof children === "string" ? children.trim() : "";

  if (!source) {
    return <Text type="secondary">{emptyText || "—"}</Text>;
  }

  return (
    <div
      className={[
        "markdown-text",
        compact ? "markdown-text--compact" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noreferrer noopener" />
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
