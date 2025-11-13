interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return <div className="h-8" />;
  }

  const displayText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : `${typingUsers.length} people are typing`;

  return (
    <div className="h-8 px-6 flex items-center" data-testid="text-typing-indicator">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{displayText}</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dots" />
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dots [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dots [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
