import { useEffect, useRef, type RefObject } from 'react';
import { FiPaperclip, FiSend } from 'react-icons/fi';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLTextAreaElement>;
};

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask anything about your data...',
  inputRef,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? ref;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [textareaRef, value]);

  const submit = () => {
    if (disabled || !value.trim()) {
      return;
    }
    onSend();
  };

  return (
    <form
      className={`aiInputShell${disabled ? ' isDisabled' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <button type="button" className="aiAttachButton" aria-label="Attach file">
        <FiPaperclip />
      </button>

      <textarea
        ref={textareaRef}
        className="aiTextarea"
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />

      <button
        type="submit"
        className="aiSendButton"
        aria-label="Send message"
        disabled={disabled || !value.trim()}
      >
        <FiSend />
      </button>
    </form>
  );
}
