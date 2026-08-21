import { useEffect, useRef } from 'react';
import { FiCpu } from 'react-icons/fi';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import type { AIMessage } from './types';

type Props = {
  messages: AIMessage[];
  isLoading?: boolean;
  onGraphDrilldown?: (prompt: string) => void;
};

export default function ConversationContainer({ messages, isLoading = false, onGraphDrilldown }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  if (!messages.length && !isLoading) {
    return null;
  }

  return (
    <section className="aiConversationViewport" aria-label="Conversation">
      <div className="aiConversationScroll" aria-live="polite" aria-relevant="additions text">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onGraphDrilldown={onGraphDrilldown} />
        ))}

        {isLoading ? (
          <article className="aiMessageRow isAssistant isTyping">
            <div className="aiAvatar" aria-hidden="true">
              <FiCpu />
            </div>
            <div className="aiMessageBubble assistantBubble">
              <TypingIndicator />
            </div>
          </article>
        ) : null}
        <div ref={endRef} />
      </div>
    </section>
  );
}
