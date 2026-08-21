import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { sendAIChatMessage } from '../../../api/aiApi';
import { exportRemindersCsv } from '../../../api/remindersApi';
import { exportStudentsCsv } from '../../../api/studentApi';
import { exportSponsorsCsv } from '../../../api/sponsorApi';
import { useToast } from '../../../hooks/useToast';
import AIHeader from './AIHeader';
import ChatInput from './ChatInput';
import ConversationContainer from './ConversationContainer';
import SuggestedQuestions from './SuggestedQuestions';
import WelcomeSection from './WelcomeSection';
import type { AIMessage, AIMessageBlock, AIMessageGraphPayload, SuggestedQuestion } from './types';
import '../../../styles/AiSidebar.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

const suggestedQuestions: SuggestedQuestion[] = [
  { label: 'Show all active students', prompt: 'Show all active students' },
  { label: 'Students without sponsors', prompt: 'Students without sponsors' },
  { label: 'Generate sponsorship report', prompt: 'Generate sponsorship report' },
  { label: 'Show district-wise students', prompt: 'Show district-wise students' },
  { label: 'Show upcoming reminders', prompt: 'Show upcoming reminders' },
  { label: 'Show gender distribution', prompt: 'Show gender distribution' },
  { label: 'Monthly sponsor registrations', prompt: 'Show monthly sponsor registrations' },
  { label: 'Reminder status distribution', prompt: 'Show reminder status distribution' },
];

const AI_SESSION_STORAGE_KEY = 'saho-ai-session-id';

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getOrCreateSessionId = () => {
  const existing = window.localStorage.getItem(AI_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextSessionId = window.crypto?.randomUUID?.() ?? createMessageId();
  window.localStorage.setItem(AI_SESSION_STORAGE_KEY, nextSessionId);
  return nextSessionId;
};

const buildAssistantBlocks = (response: {
  type: 'text' | 'table' | 'card' | 'download' | 'graph';
  title?: string;
  columns?: string[];
  rows?: string[][];
  data?: Record<string, unknown>;
}): AIMessageBlock[] | undefined => {
  if (response.type === 'card') {
    const cards = Object.entries(response.data ?? {}).map(([label, value], index) => ({
      label,
      value: value == null ? '-' : String(value),
      tone: (['purple', 'green', 'blue', 'amber'] as const)[index % 4],
    }));

    return [
      {
        type: 'card',
        title: response.title || 'Details',
        cards,
      },
    ];
  }

  if (response.type !== 'table') {
    if (response.type === 'graph' && isGraphPayload(response.data)) {
      return [
        {
          type: 'graph',
          payload: response.data,
        },
      ];
    }

    return undefined;
  }

  const columns = (response.columns ?? []).map((column, index) => ({
    key: `column-${index}`,
    label: column,
  }));

  const rows = (response.rows ?? []).map((cells, index) => ({
    id: `row-${index}`,
    cells,
  }));

  return [
    {
      type: 'table',
      title: response.title || 'Students',
      columns,
      rows,
    },
  ];
};

const isGraphPayload = (data: unknown): data is AIMessageGraphPayload => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const payload = data as Record<string, unknown>;
  return payload.kind === 'graph'
    && typeof payload.title === 'string'
    && typeof payload.chartType === 'string'
    && typeof payload.xAxis === 'string'
    && typeof payload.yAxis === 'string'
    && Array.isArray(payload.categories)
    && Array.isArray(payload.values)
    && Array.isArray(payload.points);
};

const isStudentExportPayload = (
  data: unknown,
): data is {
  kind: 'student_export';
  fileName?: string;
  studentIds?: number[];
  count?: number;
} => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const payload = data as Record<string, unknown>;
  return payload.kind === 'student_export';
};

const isSponsorExportPayload = (
  data: unknown,
): data is {
  kind: 'sponsor_export';
  fileName?: string;
  sponsorIds?: number[];
  count?: number;
  filters?: {
    search?: string;
    type?: string;
    nationality?: string;
  };
} => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const payload = data as Record<string, unknown>;
  return payload.kind === 'sponsor_export';
};

const isReminderExportPayload = (
  data: unknown,
): data is {
  kind: 'reminder_export';
  fileName?: string;
  reminderIds?: number[];
  count?: number;
  filters?: {
    search?: string;
    status?: string;
  };
} => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const payload = data as Record<string, unknown>;
  return payload.kind === 'reminder_export';
};

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function AIAssistantDrawer({ open, onClose }: Props) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => getOrCreateSessionId());
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const hasMessages = messages.length > 0;

  const appendMessage = (message: AIMessage) => {
    setMessages((current) => [...current, message]);
  };

  const handleGraphDrilldown = (prompt: string) => {
    void sendMessage(prompt);
  };

  const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const responseError =
        (error.response?.data as { error?: string; message?: string } | undefined)?.error ||
        (error.response?.data as { error?: string; message?: string } | undefined)?.message;

      return responseError || 'Sorry, the AI backend is unavailable right now. Please try again.';
    }

    return 'Sorry, the AI backend is unavailable right now. Please try again.';
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const createdAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    appendMessage({
      id: createMessageId(),
      role: 'user',
      content: trimmed,
      createdAt,
    });
    setDraft('');
    setIsLoading(true);

    try {
      const response = await sendAIChatMessage(trimmed, sessionId);
      if (response.type === 'download' && isStudentExportPayload(response.data)) {
        const blob = await exportStudentsCsv({
          studentIds: response.data.studentIds,
        });
        triggerDownload(blob, response.data.fileName || 'students.xlsx');
        toast(`Downloaded ${response.data.fileName || 'students.xlsx'}`, 'success');
      } else if (response.type === 'download' && isSponsorExportPayload(response.data)) {
        const blob = await exportSponsorsCsv(response.data.filters);
        triggerDownload(blob, response.data.fileName || 'sponsors.csv');
        toast(`Downloaded ${response.data.fileName || 'sponsors.csv'}`, 'success');
      } else if (response.type === 'download' && isReminderExportPayload(response.data)) {
        const blob = await exportRemindersCsv(response.data.filters);
        triggerDownload(blob, response.data.fileName || 'reminders.csv');
        toast(`Downloaded ${response.data.fileName || 'reminders.csv'}`, 'success');
      }

      const blocks = buildAssistantBlocks(response);
      appendMessage({
        id: createMessageId(),
        role: 'assistant',
        content: response.message?.trim() ?? (response.type === 'download' ? 'Your export is ready.' : ''),
        blocks,
        createdAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      });
    } catch (error) {
      appendMessage({
        id: createMessageId(),
        role: 'assistant',
        content: getErrorMessage(error),
        createdAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = () => {
    sendMessage(draft);
  };

  return (
    <>
      <button
        className={`aiSidebarOverlay ${open ? 'isVisible' : ''}`}
        type="button"
        aria-label="Close AI assistant"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <aside
        className={`aiSidebar${open ? ' isOpen' : ''}`}
        aria-label="AI Assistant"
        aria-labelledby="ai-assistant-title"
        aria-modal="true"
        role="dialog"
        aria-hidden={!open}
      >
        <AIHeader onClose={onClose} />

        <div className="aiDrawerBody">
          <div className={`aiEmptyState${hasMessages ? ' isHidden' : ''}`} aria-hidden={hasMessages}>
            <WelcomeSection />
            <SuggestedQuestions
            items={suggestedQuestions}
            onSelect={(prompt) => {
              void sendMessage(prompt);
            }}
            />
          </div>

          <ConversationContainer
            messages={messages}
            isLoading={isLoading}
            onGraphDrilldown={handleGraphDrilldown}
          />
        </div>

        <footer className="aiFooter">
          <ChatInput
            inputRef={inputRef}
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            disabled={isLoading}
            placeholder="Ask anything about students, sponsors, schools or reminders..."
          />
          <div className="aiFooterNote">Press Enter to send, Shift + Enter for a new line.</div>
        </footer>
      </aside>
    </>
  );
}
