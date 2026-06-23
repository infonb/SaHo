import { FormEvent, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiBell,
  FiChevronRight,
  FiFileText,
  FiSend,
  FiTrendingUp,
  FiX,
  FiZap,
} from 'react-icons/fi';
import '../../styles/AiSidebar.css';

type AiSidebarProps = {
  open: boolean;
  onClose: () => void;
};

const quickActions = [
  {
    icon: <FiZap />,
    title: 'Student Insights',
    description: 'Get AI insights on students',
  },
  {
    icon: <FiTrendingUp />,
    title: 'Academic Performance',
    description: 'Analyze student performance',
  },
  {
    icon: <FiBarChart2 />,
    title: 'Attendance Summary',
    description: 'Check attendance trends',
  },
  {
    icon: <FiBell />,
    title: 'Identify At-Risk Students',
    description: 'Find students needing support',
  },
  {
    icon: <FiFileText />,
    title: 'Generate Report',
    description: 'Create AI powered reports',
  },
];

const recentConversations = [
  { title: 'Students with orphan status', time: '2h ago' },
  { title: 'Low attendance students', time: '5h ago' },
  { title: 'Performance of class 7', time: '1d ago' },
];

export default function AiSidebar({ open, onClose }: AiSidebarProps) {
  const [message, setMessage] = useState('');

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
  };

  return (
    <>
      <button
        className={`aiSidebarOverlay ${open ? 'isVisible' : ''}`}
        type="button"
        aria-label="Close AI assistant"
        onClick={onClose}
      />

      <aside className={`aiSidebar ${open ? 'isOpen' : ''}`} aria-label="AI Assistant">
        <div className="aiSidebarHeader">
          <div>
            <h2>AI Assistant</h2>
            <p>Your intelligent education partner</p>
          </div>
          <button className="aiSidebarClose" type="button" aria-label="Close AI assistant" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="aiGreeting">
          <div className="aiGreetingIcon">
            <FiActivity />
          </div>
          <div>
            <strong>Hello, Admin!</strong>
            <span>How can I help you today?</span>
          </div>
        </div>

        <section className="aiSidebarSection">
          <div className="aiSectionTitle">Quick Actions</div>
          <div className="aiActionList">
            {quickActions.map((action) => (
              <button className="aiActionButton" type="button" key={action.title}>
                <span className="aiActionIcon">{action.icon}</span>
                <span className="aiActionText">
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </span>
                <FiChevronRight className="aiActionChevron" />
              </button>
            ))}
          </div>
        </section>

        <section className="aiSidebarSection">
          <div className="aiSectionHeader">
            <div className="aiSectionTitle">Recent Conversations</div>
            <button className="aiViewAllButton" type="button">View all</button>
          </div>
          <div className="aiRecentList">
            {recentConversations.map((conversation) => (
              <button className="aiRecentButton" type="button" key={conversation.title}>
                <span>{conversation.title}</span>
                <time>{conversation.time}</time>
              </button>
            ))}
          </div>
        </section>

        <form className="aiPromptBox" onSubmit={submitMessage}>
          <label className="srOnly" htmlFor="aiPromptInput">Ask AI assistant</label>
          <input
            id="aiPromptInput"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask anything about your data..."
          />
          <button className="btnGreen" type="submit" aria-label="Send message">
            <FiSend />
          </button>
        </form>

        <div className="aiDisclaimer">AI responses may not be 100% accurate</div>
      </aside>
    </>
  );
}
