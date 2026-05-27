import { useEffect, useMemo, useState } from 'react';
import { getDashboardStats } from '../../api/dashboardApi';
import Badge from './Badge';
import type { DashboardStats, StudentView } from '../../types';

const iconPaths = {
  clipboard: 'M9 4h6l1 2h3v15H5V6h3l1-2Zm0 6h6m-6 4h6m-6 4h4',
  chart: 'M4 19V5m0 14h16M8 16v-5m5 5V8m5 8v-7',
  users: 'M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19m15 0v-1a3 3 0 0 0-2.1-2.86M13 5.2A3.5 3.5 0 1 1 6.5 8.8 3.5 3.5 0 0 1 13 5.2Zm3.5 6.3A3 3 0 1 0 15 5.9',
  send: 'M4 12 20 4l-4 16-3.5-6.5L4 12Zm8.5 1.5L20 4',
};

function WidgetIcon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={iconPaths[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AIAssistantWidget({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  const students = useMemo(() => {
    if (!stats) return [];
    const activeGirls = stats.recent_students.filter(student => student.gender === 'Female' && student.is_active).slice(0, 4);
    return activeGirls.length ? activeGirls : stats.recent_students.slice(0, 4);
  }, [stats]);

  return (
    <>
      {!open && (
        <button className="chatLauncher" type="button" onClick={() => onOpenChange(true)} aria-label="Open SaHo AI Assistant">
          <span className="botAvatar" />
          <strong>Ask me anything!</strong>
        </button>
      )}
      {open && <AIAssistant onClose={() => onOpenChange(false)} students={students} />}
    </>
  );
}

function AIAssistant({ onClose, students }: { onClose: () => void; students: StudentView[] }) {
  return (
    <div className="chatOverlay" role="dialog" aria-modal="true" aria-label="SaHo AI Assistant">
      <aside className="aiPanel">
        <div className="aiHead">
          <button className="aiRoundBtn" type="button" aria-label="Close assistant" onClick={onClose}>x</button>
          <div className="aiBrand"><span>SaHo.AI</span><small>beta</small></div>
          <button className="aiRoundBtn" type="button" aria-label="More options">...</button>
        </div>
        <div className="aiIntro">
          <h2>Hi, There</h2>
          <p><strong>I'm SaHo AI</strong> - your foundation assistant. Ask questions, generate reports, and find student insights.</p>
        </div>
        <p className="tryLabel">You may try asking</p>
        <div className="promptList">
          <button type="button"><span className="promptIcon"><WidgetIcon name="clipboard" /></span><span className="promptText">Show all girls from Warangal studying in 8th class</span></button>
          <button type="button"><span className="promptIcon"><WidgetIcon name="chart" /></span><span className="promptText">Generate sponsorship report for 2025</span></button>
          <button type="button"><span className="promptIcon"><WidgetIcon name="users" /></span><span className="promptText">Which students don't have sponsors?</span></button>
        </div>
        <div className="chatBubble user">Show all active girl students from Warangal studying in 8th class <time>11:30 AM</time></div>
        <div className="chatResult">
          <p>Here are the active students from Warangal studying in 8th class:</p>
          <table>
            <thead><tr><th>Name</th><th>School</th><th>Status</th></tr></thead>
            <tbody>
              {students.map(student => (
                <tr key={student.student_id}><td>{student.full_name}</td><td>{student.sch_name.replace('Warangal', '').trim()}</td><td><Badge variant="active">Active</Badge></td></tr>
              ))}
            </tbody>
          </table>
          <strong>Total: {students.length} students found</strong>
        </div>
        <div className="aiExport"><button type="button">Download PDF</button><button type="button">Export Excel</button></div>
        <div className="askBox">
          <input placeholder="Ask anything..." aria-label="Ask SaHo AI" />
          <button type="button" aria-label="Send"><WidgetIcon name="send" /></button>
        </div>
        <small className="aiNote">SaHo AI can make mistakes. Please verify important data.</small>
      </aside>
    </div>
  );
}
