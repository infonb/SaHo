import { FiCpu, FiX } from 'react-icons/fi';

type Props = {
  onClose: () => void;
};

export default function AIHeader({ onClose }: Props) {
  return (
    <header className="aiHeader">
      <div className="aiHeaderTitleBlock">
        <div className="aiHeaderBadge" aria-hidden="true">
          <FiCpu />
        </div>
        <div className="aiHeaderText">
          <h2 id="ai-assistant-title">SaHo AI Assistant</h2>
          <p>Ask anything about students, sponsors, schools, reminders and dashboard data.</p>
        </div>
      </div>

      <button className="aiIconButton" type="button" aria-label="Close AI assistant" onClick={onClose}>
        <FiX />
      </button>
    </header>
  );
}
