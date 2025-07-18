"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { Send } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProps } from "@/types/chat";

import { useChat } from "@ai-sdk/react";
import { createIdGenerator, Message } from "ai";
import { useAppLayoutContext } from "@/context/AppLayoutContext";
import { PageHeader } from "./page-header";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";

import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function Chat({ userId, initialMessages, isAuthenticated }: ChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { headerSlot } = useAppLayoutContext();
  const { disconnect } = useWallet();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [visibleMessagesCount] = useState(20); // Reduced for smaller space
  const [, setShowModal] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    id: userId,
    initialMessages,
    generateId: createIdGenerator({
      prefix: "user",
      size: 32,
    }),
    sendExtraMessageFields: true,
    body: {
      chainId: 1,
    },
    onResponse: async (res) => {
      if (res.status === 401) disconnect();
    },
    onFinish: async (res) => {
      try {
        // Check for prep data
        const prepToolsInvocated = res.parts?.filter(
          (part) =>
            part.type === "tool-invocation" &&
            part.toolInvocation.toolName === "prep"
        );

        // Run transaction signing with current wallet (currently only support MetaMask)
        if (prepToolsInvocated?.length) {
          const prepedDataType = prepToolsInvocated[0].type;
          const prepedData =
            prepedDataType === "tool-invocation"
              ? prepToolsInvocated[0].toolInvocation
              : null;
          if (prepedData?.state === "result") {
            setShowModal(true);
            const swapData = prepedData.result.preparedData;
            const {
              fromTokenAddress,
              toTokenAddress,
              amountIn,
              estimatedAmountOutMin: amountOutMin,
            } = swapData;
            // const txnHash = await swapTokensWithMetaMask(
            //   fromTokenAddress,
            //   toTokenAddress,
            //   amountIn,
            //   amountOutMin,
            //   1
            // );
            // console.log(txnHash);
            setShowModal(false);
          }
        }
      } catch (error) {
        setShowModal(false);
        console.log(
          "Unexpected error: ",
          error instanceof Error ? error.message : error
        );
      }
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages.length, scrollToBottom]);

  // Updates stream
  useEffect(() => {
    let eventSource: EventSource;

    const connectSSE = () => {
      console.log("Connecting to SSE...");
      eventSource = new EventSource("/api/updates");

      eventSource.onopen = () => {
        console.log("SSE connection opened");
      };

      eventSource.onmessage = (event) => {
        console.log("SSE message received:", event.data);
        const data = JSON.parse(event.data);
        if (data.messages) {
          setMessages((prevMessages) => {
            const [newMessage] = data.messages;

            // Handle streaming updates
            if (newMessage.streaming) {
              const existingIndex = prevMessages.findIndex(
                (msg) => msg.id === newMessage.id
              );

              if (existingIndex !== -1) {
                // Update existing message
                const updatedMessages = [...prevMessages];
                updatedMessages[existingIndex] = {
                  ...updatedMessages[existingIndex],
                  ...newMessage,
                  // Preserve any existing tool invocations
                  toolInvocations:
                    updatedMessages[existingIndex].toolInvocations,
                };
                return updatedMessages;
              } else {
                // Add as new message
                return [...prevMessages, newMessage];
              }
            }

            // For non-streaming messages (e.g., tool results)
            return [...prevMessages, ...data.messages];
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        eventSource.close();
        setTimeout(connectSSE, 1000);
      };
    };

    connectSSE();

    return () => {
      console.log("Cleaning up SSE connection...");
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [setMessages]);

  const uniqueMessages = useMemo(
    () =>
      messages
        .reduce((unique: Message[], message, index) => {
          // Find the last occurrence of this message ID
          let lastIndex = -1;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].id === message.id) {
              lastIndex = i;
              break;
            }
          }

          if (index === lastIndex) {
            unique.push(message);
          }
          return unique;
        }, [])
        .slice(-visibleMessagesCount),
    [messages, visibleMessagesCount]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing) return;
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  if (headerSlot) {
    return <PageHeader title="AI Assistant" />;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col w-full h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#3A3A3A] bg-[#1A1A1A]">
          <h3
            className="text-white text-sm font-semibold"
            style={{ fontFamily: "Montserrat" }}
          >
            AI Trading Assistant
          </h3>
          <div className="w-2 h-2 bg-[#01B792] rounded-full animate-pulse"></div>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto pb-[100px] w-full scrollbar scrollbar-w-1 scrollbar-thumb-[#27272A] scrollbar-track-transparent hover:scrollbar-thumb-[#3f3f46]">
          <div className="w-full px-2 py-2">
            <ChatMessageList messages={uniqueMessages} isLoading={isLoading} />
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#27272A] bg-[#121212]/95 backdrop-blur-sm z-10">
          <div className="p-2">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative rounded-md border bg-card">
                  <ChatInput
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isLoading ? "Loading..." : "Ask about trading..."
                    }
                    className="min-h-10 max-h-20 resize-none rounded-md bg-[#1a1a1a] border-[#27272A] focus:border-[#7f00ff] focus:ring-[#7f00ff] p-2 text-sm shadow-none focus-visible:ring-0"
                    disabled={isLoading || !isAuthenticated}
                  />
                </div>

                <div className="flex gap-1">
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading || !isAuthenticated}
                    className="h-10 w-10 gap-1.5 bg-[#7f00ff] text-white hover:bg-[#7f00ff]/90 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
