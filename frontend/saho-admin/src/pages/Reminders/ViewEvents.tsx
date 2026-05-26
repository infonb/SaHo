import { useState, useMemo, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import {
  MOCK_EVENT_STATES,
  MOCK_EVENT_DISTRICTS,
  MOCK_EVENT_MANDALS,
  MOCK_EVENT_VILLAGES,
  getDistrictsByState,
} from '../../api/mockEventData';
import type { StateMaster, DistrictMaster, MandalMaster, VillageMaster } from '../../types';

// Event status type
type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

// Event data type
interface EventData {
  id: number;
  title: string;
  date: string;
  venue: string;
  state: string;
  district: string;
  mandal: string;
  village: string;
  status: EventStatus;
}

// Mock events data
const MOCK_EVENTS: EventData[] = [
  {
    id: 1,
    title: 'Annual Sports Day',
    date: '2026-06-15',
    venue: 'ZPHS Chunchuluru',
    state: 'Andhra Pradesh',
    district: 'Nellore',
    mandal: 'Marripadu',
    village: 'Chunchuluru',
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'Health Checkup Camp',
    date: '2026-05-10',
    venue: 'Community Hall',
    state: 'Andhra Pradesh',
    district: 'Nellore',
    mandal: 'Marripadu',
    village: 'Brahmanapalli',
    status: 'completed',
  },
  {
    id: 3,
    title: 'Parent Teacher Meeting',
    date: '2026-05-25',
    venue: 'ZPHS Brahmanapalli',
    state: 'Andhra Pradesh',
    district: 'Nellore',
    mandal: 'Marripadu',
    village: 'Brahmanapalli',
    status: 'ongoing',
  },
  {
    id: 4,
    title: 'Science Exhibition',
    date: '2026-07-01',
    venue: 'Govt High School Chunchuluru',
    state: 'Andhra Pradesh',
    district: 'Nellore',
    mandal: 'Marripadu',
    village: 'Chunchuluru',
    status: 'upcoming',
  },
  {
    id: 5,
    title: 'Books Distribution',
    date: '2026-04-20',
    venue: 'ZPHS Thummalapenta',
    state: 'Andhra Pradesh',
    district: 'Nellore',
    mandal: 'Atmakur',
    village: 'Thummalapenta',
    status: 'completed',
  },
  {
    id: 6,
    title: 'Yoga Training',
    date: '2026-05-22',
    venue: 'Dharmasagar',
    state: 'Telangana',
    district: 'Warangal',
    mandal: 'Hanamkonda',
    village: 'Dharmasagar',
    status: 'ongoing',
  },
];

// Filter state interface
interface EventFilters {
  stateId: string;
  districtId: string;
  mandalId: string;
  villageId: string;
  status: string;
}

// Status badge component
function StatusBadge({ status }: { status: EventStatus }) {
  const statusClasses: Record<EventStatus, string> = {
    upcoming: 'status-upcoming',
    ongoing: 'status-ongoing',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  };

  const statusLabels: Record<EventStatus, string> = {
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`status-badge ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

// Action buttons component
function ActionButtons({ event }: { event: EventData }) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to cancel the event "${event.title}"?`)) {
      console.log('Delete/Cancel event:', event.id);
      alert(`Event "${event.title}" has been cancelled.`);
    }
  };

  return (
    <div className="action-buttons">
      <button
        className="action-btn edit"
        title="Edit Event"
        onClick={() => console.log('Edit event:', event.id)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        className="action-btn delete"
        title="Cancel Event"
        onClick={handleDelete}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

const initialFilters: EventFilters = {
  stateId: '',
  districtId: '',
  mandalId: '',
  villageId: '',
  status: '',
};

export default function ViewEvents() {
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [loading] = useState(false);

  // Filtered events based on selection
  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter(event => {
      // State filter
      if (filters.stateId && event.state !== MOCK_EVENT_STATES.find(s => s.st_id === Number(filters.stateId))?.st_name) {
        return false;
      }
      // District filter
      if (filters.districtId && event.district !== MOCK_EVENT_DISTRICTS.find(d => d.dist_id === Number(filters.districtId))?.dist_name) {
        return false;
      }
      // Mandal filter
      if (filters.mandalId && event.mandal !== MOCK_EVENT_MANDALS.find(m => m.mndl_id === Number(filters.mandalId))?.mndl_name) {
        return false;
      }
      // Village filter
      if (filters.villageId && event.village !== MOCK_EVENT_VILLAGES.find(v => v.vil_id === Number(filters.villageId))?.vil_name) {
        return false;
      }
      // Status filter
      if (filters.status && event.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [filters]);

  // Options for dropdowns
  const districts = useMemo(() => {
    if (!filters.stateId) return [];
    return getDistrictsByState(Number(filters.stateId));
  }, [filters.stateId]);

  const mandals = useMemo(() => {
    if (!filters.districtId) return [];
    return MOCK_EVENT_MANDALS.filter(m => m.dist_id === Number(filters.districtId));
  }, [filters.districtId]);

  const villages = useMemo(() => {
    if (!filters.mandalId) return [];
    return MOCK_EVENT_VILLAGES.filter(v => v.mndl_id === Number(filters.mandalId));
  }, [filters.mandalId]);

  // Handle filter changes
  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    setFilters(f => {
      const newFilters = { ...f, [key]: value };
      // Reset dependent filters
      if (key === 'stateId') {
        newFilters.districtId = '';
        newFilters.mandalId = '';
        newFilters.villageId = '';
      } else if (key === 'districtId') {
        newFilters.mandalId = '';
        newFilters.villageId = '';
      } else if (key === 'mandalId') {
        newFilters.villageId = '';
      }
      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = filters.stateId || filters.districtId || filters.mandalId || filters.villageId || filters.status;
  const upcomingCount = filteredEvents.filter(event => event.status === 'upcoming').length;
  const ongoingCount = filteredEvents.filter(event => event.status === 'ongoing').length;
  const completedCount = filteredEvents.filter(event => event.status === 'completed').length;
  const monthDays = Array.from({ length: 30 }, (_, index) => index + 1);
  const eventsByDay = filteredEvents.reduce<Record<number, EventData[]>>((acc, event) => {
    const day = new Date(event.date).getDate();
    acc[day] = [...(acc[day] ?? []), event];
    return acc;
  }, {});
  const nextReminders = filteredEvents
    .filter(event => event.status !== 'completed' && event.status !== 'cancelled')
    .slice(0, 4);

  return (
    <div className="page-enter">
      <PageHeader
        title="Events"
        subtitle="Calendar, reminders, and community event planning"
        actions={
          <Link to="/reminders/create">
            <Button variant="primary" size="sm">Create Event</Button>
          </Link>
        }
      />

      <div className="statGrid eventStatsGrid" style={{ marginBottom: 14 }}>
        <div className="statCard eventStatCard"><div className="statLabel">TOTAL EVENTS</div><div className="statValue">{filteredEvents.length}</div><div className="statNote">Matching current filters</div></div>
        <div className="statCard eventStatCard"><div className="statLabel">UPCOMING</div><div className="statValue">{upcomingCount}</div><div className="statNote">Scheduled ahead</div></div>
        <div className="statCard eventStatCard"><div className="statLabel">ONGOING</div><div className="statValue">{ongoingCount}</div><div className="statNote">Active programs</div></div>
        <div className="statCard eventStatCard"><div className="statLabel">COMPLETED</div><div className="statValue">{completedCount}</div><div className="statNote">Finished events</div></div>
      </div>

      {/* Filters Section */}
      <div className="panel">
        <div className="filters-header">
          <h3 className="panelTitle">Filters</h3>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <div className="filters-grid">
          {/* State Filter */}
          <div className="filter-group">
            <label className="filter-label">State</label>
            <select
              className="filter-select"
              value={filters.stateId}
              onChange={e => handleFilterChange('stateId', e.target.value)}
            >
              <option value="">All States</option>
              {MOCK_EVENT_STATES.map(state => (
                <option key={state.st_id} value={state.st_id}>
                  {state.st_name}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div className="filter-group">
            <label className="filter-label">District</label>
            <select
              className="filter-select"
              value={filters.districtId}
              onChange={e => handleFilterChange('districtId', e.target.value)}
              disabled={!filters.stateId}
            >
              <option value="">All Districts</option>
              {districts.map(district => (
                <option key={district.dist_id} value={district.dist_id}>
                  {district.dist_name}
                </option>
              ))}
            </select>
          </div>

          {/* Mandal Filter */}
          <div className="filter-group">
            <label className="filter-label">Mandal</label>
            <select
              className="filter-select"
              value={filters.mandalId}
              onChange={e => handleFilterChange('mandalId', e.target.value)}
              disabled={!filters.districtId}
            >
              <option value="">All Mandals</option>
              {mandals.map(mandal => (
                <option key={mandal.mndl_id} value={mandal.mndl_id}>
                  {mandal.mndl_name}
                </option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div className="filter-group">
            <label className="filter-label">Village</label>
            <select
              className="filter-select"
              value={filters.villageId}
              onChange={e => handleFilterChange('villageId', e.target.value)}
              disabled={!filters.mandalId}
            >
              <option value="">All Villages</option>
              {villages.map(village => (
                <option key={village.vil_id} value={village.vil_id}>
                  {village.vil_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="eventsWorkspace">
        <section className="panel eventCalendarPanel">
          <div className="table-header">
            <h3 className="panelTitle">Event Calendar</h3>
            <span className="event-count">May 2026</span>
          </div>
          <div className="eventCalendarGrid">
            {monthDays.map(day => (
              <div key={day} className={`eventCalendarDay ${eventsByDay[day]?.length ? 'hasEvent' : ''}`}>
                <span>{day}</span>
                {eventsByDay[day]?.slice(0, 2).map(event => <small key={event.id}>{event.title}</small>)}
              </div>
            ))}
          </div>
        </section>

        <aside className="panel reminderPanel">
          <div className="table-header">
            <h3 className="panelTitle">Reminders</h3>
            <span className="event-count">{nextReminders.length} active</span>
          </div>
          {nextReminders.length ? nextReminders.map(event => (
            <div key={event.id} className="reminderItem">
              <div>
                <strong>{event.title}</strong>
                <span>{event.date} - {event.venue}</span>
              </div>
              <StatusBadge status={event.status} />
            </div>
          )) : <div className="empty-state"><p>No active reminders.</p></div>}
        </aside>
      </div>

      <div className="panel eventCardsPanel">
        <div className="table-header">
          <h3 className="panelTitle">Event Cards</h3>
          <span className="event-count">{filteredEvents.length} event(s) found</span>
        </div>

        {loading ? (
          <div className="eventCardGrid">
            {[0, 1, 2].map(i => <div key={i} className="eventCard"><div className="skeleton" style={{ height: 160 }} /></div>)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <p>No events found matching your filters.</p>
            {hasActiveFilters && <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>}
          </div>
        ) : (
          <div className="eventCardGrid">
            {filteredEvents.map(event => (
              <article key={event.id} className="eventCard">
                <div className="eventCardHeader">
                  <div className="eventDateBadge">
                    <strong>{new Date(event.date).getDate()}</strong>
                    <span>{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</span>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
                <h3>{event.title}</h3>
                <p>{event.venue}</p>
                <div className="eventMeta">
                  <span>{event.village}</span>
                  <span>{event.mandal}, {event.district}</span>
                </div>
                <div className="eventCardFooter">
                  <span>{event.state}</span>
                  <ActionButtons event={event} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {false && <style>{`
        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .clear-filters-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
        }

        .clear-filters-btn:hover {
          text-decoration: underline;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text2);
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--r-md);
          font-size: 14px;
          color: var(--color-text);
          background: var(--color-surface);
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .filter-select:disabled {
          background: var(--br-50);
          color: var(--color-muted);
          cursor: not-allowed;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .event-count {
          font-size: 13px;
          color: var(--color-text3);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--color-border);
        }

        .data-table th {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: var(--br-50);
        }

        .data-table tr:hover {
          background: var(--br-50);
        }

        .event-title {
          font-weight: 500;
          color: var(--color-text);
        }

        .location-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .location-detail {
          font-size: 12px;
          color: var(--color-text3);
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-upcoming {
          background: var(--blue-bg);
          color: var(--blue);
        }

        .status-ongoing {
          background: var(--amber-bg);
          color: var(--amber);
        }

        .status-completed {
          background: var(--green-bg);
          color: var(--green);
        }

        .status-cancelled {
          background: var(--red-bg);
          color: var(--red);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: var(--r-sm);
          cursor: pointer;
          transition: background 0.15s;
        }

        .action-btn.edit {
          background: var(--blue-bg);
          color: var(--blue);
        }

        .action-btn.edit:hover {
          background: var(--blue-border);
        }

        .action-btn.delete {
          background: var(--red-bg);
          color: var(--red);
        }

        .action-btn.delete:hover {
          background: var(--red-border);
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--color-text3);
        }

        .empty-state p {
          margin-bottom: 16px;
        }

        .table-loading {
          padding: 20px 0;
        }

        @media (max-width: 1024px) {
          .filters-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>}
    </div>
  );
}
