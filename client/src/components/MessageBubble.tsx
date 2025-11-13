import { Message } from "@shared/schema";
import { useMemo } from "react";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formattedTime = useMemo(() => {
    const date = new Date(message.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp]);

  if (message.type === 'system') {
    return (
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground opacity-70" data-testid={`text-system-message-${message.id}`}>
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mb-4 flex flex-col animate-fade-in ${
        isOwnMessage ? 'items-end' : 'items-start'
      }`}
      data-testid={`message-${message.id}`}
    >
      <div className="mb-1 flex items-center gap-2 px-1">
        <span
          className="text-sm font-semibold"
          style={{ color: message.userColor }}
        >
          {message.username}
        </span>
        <span className="text-xs opacity-60">
          {formattedTime}
        </span>
      </div>
      <div
        className={`rounded-2xl px-4 py-3 inline-block max-w-md md:max-w-md break-words ${
          isOwnMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
        style={
          !isOwnMessage && message.userColor
            ? {
                borderLeft: `3px solid ${message.userColor}`,
              }
            : undefined
        }
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
}
