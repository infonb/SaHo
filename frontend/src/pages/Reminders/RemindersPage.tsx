import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { FiPlus } from 'react-icons/fi';

export default function RemindersPage() {
  return (
    <div>
      <PageHeader
        title="Event Management"
        subtitle="Manage events and student reminders"
        actions={
          <Link to="/reminders/create">
            <Button size="sm">
              <FiPlus size={18} />
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
