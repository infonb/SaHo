import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

export default function RemindersPage() {
  return (
    <div>
      <PageHeader
        title="Event Management"
        subtitle="Manage events and student reminders"
        actions={
          <Link to="/reminders/create">
            <Button size="sm">
              <svg
                width="16"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              &nbsp;Create Event
            </Button>
          </Link>
        }
      />
      <div className="panel">
        <h3 className="panelTitle">Events</h3>
        <p className="sub">Event management page. Create new events to engage with students and the community.</p>
        <div style={{ marginTop: '16px' }}>
          <Link to="/reminders/create">
            <Button>Create New Event</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
