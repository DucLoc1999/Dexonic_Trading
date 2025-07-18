import { memo, useRef, useEffect, useState } from "react";
import { Message } from "ai";
import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from "./chat-bubble";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyButton from "@/components/ai-swap/copy-button";
import { moment } from "@/lib/ai-swap-utils";

interface MessageProps {
  isLoading: boolean;
  isLastMessage?: boolean;
}

const ChatMessage = memo(
  ({ message, isLoading }: { message: Message } & MessageProps) => {
    return (
      <ChatBubble
        key={`${message.id}-${message.content}`}
        variant={message.role === "user" ? "sent" : "received"}
      >
        <ChatBubbleMessage isLoading={false}>
          {message.role === "user" ? (
            <div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ ...props }) => (
                    <p
                      className="mb-2 last:mb-0 whitespace-pre-line"
                      {...props}
                    />
                  ),
                  a: ({ ...props }) => (
                    <a
                      className="text-[#7f00ff] hover:underline cursor-pointer"
                      {...props}
                    />
                  ),
                  ul: ({ ...props }) => (
                    <ul className="list-disc list-inside mb-2" {...props} />
                  ),
                  ol: ({ ...props }) => (
                    <ol className="list-decimal list-inside mb-2" {...props} />
                  ),
                  li: ({ ...props }) => <li className="mb-1" {...props} />,
                  code: ({
                    inline,
                    ...props
                  }: {
                    inline?: boolean;
                  } & React.HTMLProps<HTMLElement>) =>
                    inline ? (
                      <code
                        className="bg-black/30 rounded px-1 py-0.5"
                        {...props}
                      />
                    ) : (
                      <code
                        className="block bg-black/30 rounded p-2 my-2 overflow-x-auto"
                        {...props}
                      />
                    ),
                  pre: ({ ...props }) => (
                    <pre
                      className="bg-black/30 rounded p-2 my-2 overflow-x-auto"
                      {...props}
                    />
                  ),
                  h1: ({ ...props }) => (
                    <h1 className="text-lg font-bold mb-2" {...props} />
                  ),
                  h2: ({ ...props }) => (
                    <h2 className="text-base font-bold mb-2" {...props} />
                  ),
                  h3: ({ ...props }) => (
                    <h3 className="text-sm font-bold mb-2" {...props} />
                  ),
                  blockquote: ({ ...props }) => (
                    <blockquote
                      className="border-l-2 border-[#7f00ff] pl-4 my-2 italic"
                      {...props}
                    />
                  ),
                  table: ({ ...props }) => (
                    <div className="overflow-x-auto my-2">
                      <table
                        className="min-w-full divide-y divide-[#27272A]"
                        {...props}
                      />
                    </div>
                  ),
                  th: ({ ...props }) => (
                    <th
                      className="px-3 py-2 text-left text-sm font-semibold"
                      {...props}
                    />
                  ),
                  td: ({ ...props }) => (
                    <td className="px-3 py-2 text-sm" {...props} />
                  ),
                  div: ({
                    className,
                    ...props
                  }: React.HTMLProps<HTMLDivElement>) => {
                    if (
                      className?.includes("Position Summary") ||
                      className?.includes("Account Status")
                    ) {
                      return (
                        <div
                          className="bg-black/20 rounded-lg p-3 my-2 space-y-1"
                          {...props}
                        />
                      );
                    }
                    return <div {...props} />;
                  },
                  strong: ({
                    children,
                    ...props
                  }: React.HTMLProps<HTMLElement>) => {
                    const text = String(children);
                    if (text.startsWith("Successfully")) {
                      return (
                        <strong
                          className="text-green-400 font-medium"
                          {...props}
                        >
                          {children}
                        </strong>
                      );
                    }
                    return (
                      <strong className="font-medium" {...props}>
                        {children}
                      </strong>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </ChatBubbleMessage>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {!isLoading && <CopyButton text={message.content} />}
          </div>
          <ChatBubbleTimestamp
            variant={message.role === "user" ? "sent" : "received"}
          >
            {moment().format("LT")}
          </ChatBubbleTimestamp>
        </div>
      </ChatBubble>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

const ChatMessageList = memo(
  ({ messages, isLoading }: { messages: Message[] } & MessageProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    // const lastMessageRef = useRef<HTMLDivElement>(null);

    // Check if we're at the bottom of the chat
    const checkIfAtBottom = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      setIsAtBottom(isBottom);
    };

    // Handle scroll events
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => {
        checkIfAtBottom();
      };

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // Auto-scroll when new content is added
    useEffect(() => {
      if (isAtBottom && containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, [messages, isLoading, isAtBottom]);

    return (
      <div
        ref={containerRef}
        className="flex flex-col space-y-6 w-full h-full overflow-y-auto"
      >
        {messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLoading={isLoading}
              />
            ))}
            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleMessage isLoading={true}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {""}
                    </ReactMarkdown>
                  </div>
                </ChatBubbleMessage>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1" />
                  <ChatBubbleTimestamp variant="received">
                    {moment().format("LT")}
                  </ChatBubbleTimestamp>
                </div>
              </ChatBubble>
            )}
          </>
        ) : (
          <div className="h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="text-muted-foreground text-center">
              No messages yet. Start a conversation!
            </div>
          </div>
        )}
      </div>
    );
  }
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
