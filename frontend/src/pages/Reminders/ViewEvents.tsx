import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import PageHeader from '../../components/common/PageHeader';
import { getDistricts, getMandals, getSchools, getStates, getVillages } from '../../api/locationApi';
import { cancelReminder, getReminders, type ReminderDto } from '../../api/remindersApi';
import { usePagination } from '../../hooks/usePagination';
import closeIcon from '../../assets/clera cross favicon.png';
import arrowIcon from '../../assets/Go arrow favicon.png';
import { useToast } from '../../hooks/useToast';
import EventDetailModal from './EventDetailModal';

// Event status type
type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
type ReminderPanelFilter = EventStatus | 'all';
type FilterOption = { value: string; label: string };

const csvValues = (value?: string | null) =>
  (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const toggleCsvValue = (value: string | undefined, next: string) => {
  const values = csvValues(value);
  return values.includes(next)
    ? values.filter((v) => v !== next).join(',')
    : [...values, next].join(',');
};

const limitText = (value: string | null | undefined, maxLength: number) => {
  const text = String(value ?? '').trim();
  if (!text) return '-';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
};

const EVENT_CARD_TITLE_LIMIT = 30;
const EVENT_CARD_LOCATION_LIMIT = 25;
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const CALENDAR_STATUS_LEGEND: { status: EventStatus; label: string }[] = [
  { status: 'upcoming', label: 'Upcoming' },
  { status: 'ongoing', label: 'Ongoing' },
  { status: 'completed', label: 'Completed' },
  { status: 'cancelled', label: 'Cancelled' },
];
const REMINDER_PANEL_FILTERS: { value: ReminderPanelFilter; label: string }[] = [
  { value: 'all', label: 'All Reminders' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
const REMINDER_PANEL_FILTER_COLORS: Record<ReminderPanelFilter, string> = {
  all: '#64748b',
  upcoming: '#2563eb',
  ongoing: '#d97706',
  completed: '#16a34a',
  cancelled: '#dc2626',
};

const uniqueCsvValues = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.flatMap((value) => csvValues(value))));

const optionId = (item: any, camelKey: string, snakeKey: string) =>
  String(item?.[camelKey] ?? item?.[snakeKey] ?? '');

const optionName = (item: any, camelKey: string, snakeKey: string) =>
  String(item?.[camelKey] ?? item?.[snakeKey] ?? '');

const csvNames = (
  value: string | null | undefined,
  options: any[],
  idKeys: [string, string],
  nameKeys: [string, string],
) => {
  const ids = csvValues(value);
  if (!ids.length) return '-';

  const names = ids.map((id) => {
    const found = options.find((option) => optionId(option, idKeys[0], idKeys[1]) === id);
    return found ? optionName(found, nameKeys[0], nameKeys[1]) : id;
  });

  return names.filter(Boolean).join(', ') || '-';
};

const stateNamesForEvent = (event: EventData, states: any[], districts: any[]) => {
  const directStateNames = csvNames(event.state, states, ['stId', 'st_id'], ['stName', 'st_name']);
  if (directStateNames !== '-') return directStateNames;

  const derivedStateIds = csvValues(event.district)
    .map((districtId) => {
      const district = districts.find((item) => optionId(item, 'distId', 'dist_id') === districtId);
      return district ? optionId(district, 'stId', 'st_id') : '';
    })
    .filter(Boolean);

  if (!derivedStateIds.length) return '-';
  return csvNames(derivedStateIds.join(','), states, ['stId', 'st_id'], ['stName', 'st_name']);
};

// Event data type
interface EventData {
  id: number;
  title: string;
  description: string;
  date: string;
  venue: string;
  state: string;
  district: string;
  mandal: string;
  village: string;
  school: string;
  status: EventStatus;
}

const inferStatus = (eventDate: string): EventStatus => {
  const today = new Date();
  const d = new Date(eventDate);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (d0.getTime() === t0.getTime()) return 'ongoing';
  if (d0.getTime() > t0.getTime()) return 'upcoming';
  return 'completed';
};

const getReminderStatus = (reminder: ReminderDto): EventStatus =>
  reminder.status === false ? 'cancelled' : inferStatus(reminder.eventDate);

const reminderMatchesStatusFilter = (reminder: ReminderDto, statusFilter?: string) => {
  const selectedStatuses = csvValues(statusFilter);
  return selectedStatuses.length === 0 || selectedStatuses.includes(getReminderStatus(reminder));
};

// Filter state interface
interface EventFilters {
  search: string;
  stateId: string;
  districtId?: string;
  mandalId?: string;
  villageId?: string;
  schId?: string;
  status?: string;
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
function ActionButtons({
  event,
  onEdit,
  onDelete,
}: {
  event: EventData;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="actions student-actions" onClick={(event) => event.stopPropagation()}>
      <Button
        size="sm"
        variant="outline"
        className="iconBtn editActionButton"
        title="Edit Event"
        aria-label="Edit event"
        onClick={(clickEvent) => {
          clickEvent.stopPropagation();
          onEdit(event.id);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 20h4.5L20.5 8l-4.5-4.5L4 15.5V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 4l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="iconBtn deleteActionButton"
        title="Cancel Event"
        aria-label="Cancel event"
        onClick={(clickEvent) => {
          clickEvent.stopPropagation();
          onDelete(event.id);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
    </div>
  );
}

function MultiSelectFilter({
  filterKey,
  label,
  value,
  options,
  openFilter,
  setOpenFilter,
  onChange,
}: {
  filterKey: string;
  label: string;
  value: string;
  options: FilterOption[];
  openFilter: string | null;
  setOpenFilter: (value: string | null) => void;
  onChange: (value: string) => void;
}) {
  const selected = csvValues(value);
  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);
  const summary =
    selectedLabels.length === 0
      ? label
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;
  const isOpen = openFilter === filterKey;

  return (
    <details className={`multiSelectFilter${selected.length ? ' hasValue' : ''}`} open={isOpen}>
      <summary
        className="multiSelectTrigger"
        onClick={(event) => {
          event.preventDefault();
          setOpenFilter(isOpen ? null : filterKey);
        }}
      >
        <span>{summary}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="multiSelectMenu">
        <div className="multiSelectMenuHead">
          <span>{label}</span>
          {selected.length ? <button type="button" onClick={() => onChange('')}>Clear</button> : null}
        </div>
        <div className="multiSelectOptions">
          {options.length ? (
            options.map((option) => (
              <label className="multiSelectOption" key={option.value}>
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => onChange(toggleCsvValue(value, option.value))}
                />
                <span>{option.label}</span>
              </label>
            ))
          ) : (
            <div className="multiSelectEmpty">No options available</div>
          )}
        </div>
      </div>
    </details>
  );
}

const initialFilters: EventFilters = {
  search: '',
  stateId: '',
  districtId: '',
  mandalId: '',
  villageId: '',
  schId: '',
  status: '',
};

export default function ViewEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pending, setPending] = useState<EventFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ReminderDto[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [reminderPanelFilter, setReminderPanelFilter] = useState<ReminderPanelFilter>('all');
  const reminderPanelFilterRef = useRef<HTMLDetailsElement | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<ReminderDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [displayDistricts, setDisplayDistricts] = useState<any[]>([]);
  const [displayMandals, setDisplayMandals] = useState<any[]>([]);
  const [displayVillages, setDisplayVillages] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    getStates().then(data => { if (mounted) setStates(data); }).catch(() => { });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!pending.stateId) {
      setDistricts([]);
      return;
    }
    const ids = csvValues(pending.stateId).map(Number).filter(Boolean);
    Promise.all(ids.map((id) => getDistricts(id)))
      .then((results) =>
        setDistricts(
          Array.from(
            new Map(
              results.flat().map((d) => [d.distId ?? d.dist_id, d]),
            ).values(),
          ),
        ),
      )
      .catch(() => setDistricts([]));
  }, [pending.stateId]);

  useEffect(() => {
    if (!pending.districtId) {
      setMandals([]);
      return;
    }
    const ids = csvValues(pending.districtId).map(Number).filter(Boolean);
    Promise.all(ids.map((id) => getMandals(id)))
      .then((results) =>
        setMandals(
          Array.from(
            new Map(
              results.flat().map((m) => [m.mndlId ?? m.mndl_id, m]),
            ).values(),
          ),
        ),
      )
      .catch(() => setMandals([]));
  }, [pending.districtId]);

  useEffect(() => {
    if (!pending.mandalId) {
      setVillages([]);
      return;
    }
    const ids = csvValues(pending.mandalId).map(Number).filter(Boolean);
    Promise.all(ids.map((id) => getVillages(id)))
      .then((results) =>
        setVillages(
          Array.from(
            new Map(
              results.flat().map((v) => [v.vilId ?? v.vil_id, v]),
            ).values(),
          ),
        ),
      )
      .catch(() => setVillages([]));
  }, [pending.mandalId]);

  useEffect(() => {
    if (!pending.villageId) {
      setSchools([]);
      return;
    }
    const ids = csvValues(pending.villageId).map(Number).filter(Boolean);
    if (!ids.length) {
      setSchools([]);
      return;
    }
    let cancelled = false;
    Promise.all(ids.map((id) => getSchools(id)))
      .then((results) => {
        if (cancelled) return;
        setSchools(
          Array.from(
            new Map(
              results.flat().map((s) => [s.schId ?? s.sch_id, s]),
            ).values(),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setSchools([]);
      });
    return () => { cancelled = true; };
  }, [pending.villageId]);

  const load = async (apiFilters?: import('../../api/remindersApi').ReminderFilterParams, statusFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReminders(apiFilters);
      setReminders(data.filter(reminder => reminderMatchesStatusFilter(reminder, statusFilter)));
    } catch {
      setError('Unable to load events from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!openFilter) return;

    const closeOpenFilter = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.multiSelectFilter')) return;
      setOpenFilter(null);
    };

    document.addEventListener('mousedown', closeOpenFilter);
    return () => document.removeEventListener('mousedown', closeOpenFilter);
  }, [openFilter]);

  useEffect(() => {
    const closeReminderPanelFilter = (event: MouseEvent) => {
      const filterElement = reminderPanelFilterRef.current;
      if (!filterElement?.open) return;
      if (filterElement.contains(event.target as Node)) return;
      filterElement.removeAttribute('open');
    };

    document.addEventListener('mousedown', closeReminderPanelFilter);
    return () => document.removeEventListener('mousedown', closeReminderPanelFilter);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDisplayLocations = async () => {
      const stateIds = uniqueCsvValues(reminders.map((reminder) => reminder.stIdCsv));
      const districtIds = uniqueCsvValues(reminders.map((reminder) => reminder.distIdsCsv));
      const mandalIds = uniqueCsvValues(reminders.map((reminder) => reminder.mndlIdsCsv));

      try {
        const districtLists = await Promise.all(stateIds.map((id) => getDistricts(Number(id))));
        const mandalLists = await Promise.all(districtIds.map((id) => getMandals(Number(id))));
        const villageLists = await Promise.all(mandalIds.map((id) => getVillages(Number(id))));

        if (!mounted) return;
        setDisplayDistricts(districtLists.flat());
        setDisplayMandals(mandalLists.flat());
        setDisplayVillages(villageLists.flat());
      } catch {
        if (!mounted) return;
        setDisplayDistricts([]);
        setDisplayMandals([]);
        setDisplayVillages([]);
      }
    };

    if (reminders.length) {
      loadDisplayLocations();
    } else {
      setDisplayDistricts([]);
      setDisplayMandals([]);
      setDisplayVillages([]);
    }

    return () => {
      mounted = false;
    };
  }, [reminders]);

  const handleEdit = (id: number) => {
    const eventSnapshot = reminders.find(reminder => reminder.remId === id) ?? null;
    navigate(`/reminders/create?remId=${id}`, { state: { eventSnapshot } });
  };

  const handleView = (id: number) => {
    setSelectedReminder(reminders.find(reminder => reminder.remId === id) ?? null);
  };

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await cancelReminder(id);
      toast('Event cancelled successfully', 'success');
      await load();
    } catch (e) {
      toast('Failed to cancel event. Please try again.', 'error');
    }
  };

  const events = useMemo(() => reminders.map(r => ({
    id: r.remId,
    title: r.title,
    description: r.description ?? '',
    date: r.eventDate,
    venue: r.venue,
    state: r.stIdCsv ?? '',
    district: r.distIdsCsv ?? '',
    mandal: r.mndlIdsCsv ?? '',
    village: r.vilIdsCsv ?? '',
    school: r.schIdsCsv ?? '',
    status: r.status === false ? 'cancelled' : inferStatus(r.eventDate),
  })), [reminders]);
  const filteredEvents = useMemo(() => events, [events]);
  const pager = usePagination(filteredEvents, 5);

  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    setPending(f => {
      const newFilters = { ...f, [key]: value };
      if (key === 'search') return newFilters;
      if (key === 'stateId') {
        newFilters.districtId = '';
        newFilters.mandalId = '';
        newFilters.villageId = '';
        newFilters.schId = '';
      } else if (key === 'districtId') {
        newFilters.mandalId = '';
        newFilters.villageId = '';
        newFilters.schId = '';
      } else if (key === 'mandalId') {
        newFilters.villageId = '';
        newFilters.schId = '';
      } else if (key === 'villageId') {
        newFilters.schId = '';
      }
      return newFilters;
    });
  };

  const applyFilters = () => {
    setOpenFilter(null);
    const apiFilters: import('../../api/remindersApi').ReminderFilterParams = {};
    if (pending.search) apiFilters.search = pending.search;
    if (pending.schId) {
      apiFilters.schIdsCsv = pending.schId;
    } else if (pending.villageId) {
      apiFilters.vilIdsCsv = pending.villageId;
    } else if (pending.districtId) {
      apiFilters.distIdsCsv = pending.districtId;
    } else if (pending.stateId) {
      apiFilters.stateIdsCsv = pending.stateId;
    }
    apiFilters.pageSize = 10000;
    load(apiFilters, pending.status);
  };

  const handleClearFilters = () => {
    setPending(initialFilters);
    setOpenFilter(null);
    load();
  };

  const hasActiveFilters = pending.search || pending.stateId || pending.districtId || pending.mandalId || pending.villageId || pending.schId || pending.status;
  const upcomingCount = filteredEvents.filter(event => event.status === 'upcoming').length;
  const ongoingCount = filteredEvents.filter(event => event.status === 'ongoing').length;
  const completedCount = filteredEvents.filter(event => event.status === 'completed').length;
  const cancelledCount = filteredEvents.filter(event => event.status === 'cancelled').length;
  const stateOptions: FilterOption[] = states.map((state: any) => ({
    value: String(state.stId ?? state.st_id),
    label: state.stName ?? state.st_name,
  }));
  const districtOptions: FilterOption[] = districts.map((district: any) => ({
    value: String(district.distId ?? district.dist_id),
    label: district.distName ?? district.dist_name,
  }));
  const mandalOptions: FilterOption[] = mandals.map((mandal: any) => ({
    value: String(mandal.mndlId ?? mandal.mndl_id),
    label: mandal.mndlName ?? mandal.mndl_name,
  }));
  const villageOptions: FilterOption[] = villages.map((village: any) => ({
    value: String(village.vilId ?? village.vil_id),
    label: village.vilName ?? village.vil_name,
  }));
  const schoolOptions: FilterOption[] = schools.map((school: any) => ({
    value: String(school.schId ?? school.sch_id),
    label: school.schName ?? school.sch_name,
  }));
  const statusOptions: FilterOption[] = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const eventsByDate = filteredEvents.reduce<Record<string, EventData[]>>((acc, event) => {
    if (event.status === 'cancelled') return acc;
    const eventDate = new Date(event.date);
    if (
      eventDate.getFullYear() !== calendarYear ||
      eventDate.getMonth() !== calendarMonthIndex
    ) {
      return acc;
    }
    acc[event.date] = [...(acc[event.date] ?? []), event];
    return acc;
  }, {});
  const firstCalendarDate = new Date(calendarYear, calendarMonthIndex, 1);
  const daysInCalendarMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const monthDayOffset = firstCalendarDate.getDay();
  const calendarWeekCount = Math.ceil((monthDayOffset + daysInCalendarMonth) / 7);
  const calendarCellCount = calendarWeekCount * 7;
  const calendarDays = Array.from({ length: calendarCellCount }, (_, index) => {
    const monthDay = index - monthDayOffset + 1;
    if (monthDay < 1 || monthDay > daysInCalendarMonth) {
      return {
        dateKey: `blank-${calendarYear}-${calendarMonthIndex}-${index}`,
        day: null,
      };
    }

    const date = new Date(calendarYear, calendarMonthIndex, monthDay);
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    return {
      dateKey,
      day: date.getDate(),
    };
  });
  const calendarTitle = calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const goCalendarMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };
  const visibleReminders = filteredEvents
    .filter(event => reminderPanelFilter === 'all' || event.status === reminderPanelFilter);
  const reminderPanelCountLabel = reminderPanelFilter === 'all'
    ? 'Total'
    : REMINDER_PANEL_FILTERS.find((filter) => filter.value === reminderPanelFilter)?.label ?? 'Reminders';
  const eventRows = pager.current.map(event => [
    <span className="reminderTablePlainDate">
      {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
    </span>,
    <div className="eventTableTitle">
      <strong>{event.title}</strong>
    </div>,
    <StatusBadge status={event.status} />,
    <span className="reminderTableVenue" title={event.venue || '-'}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      </svg>
      {limitText(event.venue, 28)}
    </span>,
    <ActionButtons event={event} onEdit={handleEdit} onDelete={handleDelete} />,
  ]);
  const eventLocationOptions = useMemo(() => ({
    states,
    districts: displayDistricts.length ? displayDistricts : districts,
    mandals: displayMandals.length ? displayMandals : mandals,
    villages: displayVillages.length ? displayVillages : villages,
    schools,
  }), [states, displayDistricts, districts, displayMandals, mandals, displayVillages, villages, schools]);

  return (
    <div className="page-enter">
      <PageHeader
        title="Events"
        subtitle="Calendar, reminders, and community event planning"
        actions={
          <Link to="/reminders/create">
            <Button className="btn btnGreen" size="sm">Create Event</Button>
          </Link>
        }
      />

      <div className="student-stats-grid" style={{ marginBottom: 24 }}>
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Total Events</div>
            <div className="stat-card-value">{filteredEvents.length}</div>
            <div className="stat-card-note">Matching current filters</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Upcoming</div>
            <div className="stat-card-value">{upcomingCount}</div>
            <div className="stat-card-note">Scheduled ahead</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v5l3 3"></path>
            </svg>
          </div>
        </div>
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Ongoing</div>
            <div className="stat-card-value">{ongoingCount}</div>
            <div className="stat-card-note">Active programs</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        </div>
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Completed</div>
            <div className="stat-card-value">{completedCount}</div>
            <div className="stat-card-note">Finished events</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
          </div>
        </div>
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Cancelled</div>
            <div className="stat-card-value">{cancelledCount}</div>
            <div className="stat-card-note">Cancelled events</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="student-filters-section">
        <p className="filters-name-tag">Filters</p>
        <div className="container-fluid">
          <div className="row g-2">
            <div className="col-2">
              <MultiSelectFilter
                filterKey="state"
                label="All States"
                value={pending.stateId}
                options={stateOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) => handleFilterChange('stateId', value)}
              />
            </div>
            <div className="col-2">
              <MultiSelectFilter
                filterKey="district"
                label="All Districts"
                value={pending.districtId ?? ''}
                options={districtOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) => handleFilterChange('districtId', value)}
              />
            </div>
            <div className="col-2">
              <MultiSelectFilter
                filterKey="mandal"
                label="All Mandals"
                value={pending.mandalId ?? ''}
                options={mandalOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) => handleFilterChange('mandalId', value)}
              />
            </div>
            <div className="col-2">
              <MultiSelectFilter
                filterKey="village"
                label="All Villages"
                value={pending.villageId ?? ''}
                options={villageOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) => handleFilterChange('villageId', value)}
              />
            </div>
            <div className="col-4">
              <div className="filter-search-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
                <input
                  className="filter-search-input"
                  placeholder="Search events..."
                  value={pending.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') applyFilters(); }}
                />
              </div>
            </div>
          </div>
          <div className="row g-2 mt-1">
            <div className="col-2">
              <MultiSelectFilter
                filterKey="school"
                label="All Schools"
                value={pending.schId ?? ''}
                options={schoolOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) => handleFilterChange('schId', value)}
              />
            </div>
            <div className="col-2">
              <MultiSelectFilter
                filterKey="status"
                label="All Status"
                value={pending.status ?? ''}
                options={statusOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) => handleFilterChange('status', value)}
              />
            </div>
            <div className="col-2" />
            <div className="col-2" />
            <div className="col-4 d-flex justify-content-end gap-2">
              <button type="button" className="clearbtn" onClick={handleClearFilters}>
                <img src={closeIcon} alt="Clear" className="filterBtnIcon" />
                Clear
              </button>
              <button type="button" className="gobtn" onClick={applyFilters}>
                <img src={arrowIcon} alt="Go" className="filterBtnIcon" />
                Go
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="eventsWorkspace">
        <section className="panel eventCalendarPanel">
          <div className="calendarHeader">
            <button type="button" className="calendarNavButton" aria-label="Previous month" onClick={() => goCalendarMonth(-1)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h3 className="calendarTitle">{calendarTitle}</h3>
            <button type="button" className="calendarNavButton" aria-label="Next month" onClick={() => goCalendarMonth(1)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="calendarStatusLegend" aria-label="Event status legend">
              {CALENDAR_STATUS_LEGEND.map((item) => (
                <span key={item.status} className={`calendarLegendItem is-${item.status}`}>
                  <span aria-hidden="true" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="eventCalendarWeekdays">
            {WEEKDAYS.map(day => <span key={day}>{day}</span>)}
          </div>
          <div className={`eventCalendarGrid calendarWeeks-${calendarWeekCount}`}>
            {calendarDays.map(({ dateKey, day }) => (
              <div
                key={dateKey}
                className={`eventCalendarDay ${day === null ? 'isBlank' : ''} ${eventsByDate[dateKey]?.length ? 'hasEvent' : ''}`}
                aria-hidden={day === null}
              >
                {day !== null ? (
                  <>
                    <span>{day}</span>
                    {eventsByDate[dateKey]?.slice(0, 2).map((event) => (
                      <small key={event.id} className={`calendarEventStatus-${event.status}`}>{event.title}</small>
                    ))}
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <div className="panel reminderPanel">
          <div className="table-header">
            <h3 className="panelTitle">Reminders</h3>
            <span className={`event-count status-${reminderPanelFilter}`}>{visibleReminders.length} {reminderPanelCountLabel}</span>
          </div>
          <details className="reminderPanelFilter" ref={reminderPanelFilterRef}>
            <summary>
              <span className={`reminderPanelFilterDot status-${reminderPanelFilter}`} aria-hidden="true" />
              <span>{REMINDER_PANEL_FILTERS.find((filter) => filter.value === reminderPanelFilter)?.label}</span>
            </summary>
            <div className="reminderPanelFilterMenu" role="menu" aria-label="Filter reminders by status">
              {REMINDER_PANEL_FILTERS.map((filter) => {
                const isSelected = reminderPanelFilter === filter.value;
                const filterColor = REMINDER_PANEL_FILTER_COLORS[filter.value];

                return (
                  <button
                    key={filter.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    className={`reminderPanelFilterOption status-${filter.value} ${isSelected ? 'active' : ''}`}
                    onClick={(event) => {
                      setReminderPanelFilter(filter.value);
                      event.currentTarget.closest('details')?.removeAttribute('open');
                    }}
                  >
                    <span
                      className={`reminderPanelFilterDot status-${filter.value}`}
                      style={{
                        background: isSelected ? filterColor : 'transparent',
                        border: `1.5px solid ${filterColor}`,
                        boxSizing: 'border-box',
                      }}
                      aria-hidden="true"
                    />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </details>
          <div className="reminderList">
            {visibleReminders.length ? visibleReminders.map((event) => (
              <div key={event.id} className={`reminderItem reminderStatus-${event.status}`}>
                <span className="reminderDot" aria-hidden />
                <div className="reminderItemBody">
                  <strong>{event.title}</strong>
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                    {limitText(event.venue, 24)}
                  </span>
                </div>
                <StatusBadge status={event.status} />
              </div>
            )) : <div className="empty-state"><p>No reminders found.</p></div>}
          </div>
        </div>
      </div>

      <div className={`panel studentRecordsPanel eventRecordsPanel ${viewMode === 'table' ? 'student-table-section' : ''}`}>
        <div className="sponsorRecordsHeader">
          <h3 className="panelTitle">Event Records <span style={{ fontSize: '13px', color: 'var(--color-text3)', fontWeight: 500, marginLeft: '10px' }}>{filteredEvents.length} results</span></h3>
          <div className="viewToggle" aria-label="Event view mode">
            <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
            <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>Cards</button>
          </div>
        </div>

        <div className="eventRecordsContent">
        {error ? <div className="toast error" style={{ position: 'static', marginBottom: 12 }}>{error}</div> : null}

        {viewMode === 'cards' ? (
          <div className="eventCardsOuter">
            {loading ? (
              <div className="sponsorCardGrid">
                {[0, 1, 2].map(i => <div key={i} className="sponsorCard"><div className="skeleton" style={{ height: 120 }} /></div>)}
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <p>No events found matching your filters.</p>
                {hasActiveFilters && <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>}
              </div>
            ) : (
              <>
                <div className="sponsorCardGrid">
                  {pager.current.map(event => (
                    <article key={event.id} className="sponsorCard reminderRecordCard" onClick={() => handleView(event.id)} role="button" tabIndex={0} onKeyDown={(keyEvent) => { if (keyEvent.key === 'Enter' || keyEvent.key === ' ') { keyEvent.preventDefault(); handleView(event.id); } }}>
                      <div className="sponsorCardTop">
                        <div className="eventDateBadge">
                          <strong>{new Date(event.date).getDate()}</strong>
                          <span>{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</span>
                        </div>
                        <div className="sponsorCardIdentity">
                          <div className="sponsorNameCell reminderCardTitle" title={event.title}>{limitText(event.title, EVENT_CARD_TITLE_LIMIT)}</div>
                        </div>
                      </div>
                      <div className="sponsorCardMetric">
                        <span>Status</span>
                        <strong><StatusBadge status={event.status} /></strong>
                      </div>
                      <div className="sponsorCountCard">
                        <span>Venue</span>
                        <strong title={event.venue || '-'}>
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
                          </svg>
                          {limitText(event.venue, EVENT_CARD_LOCATION_LIMIT)}
                        </strong>
                      </div>
                      <ActionButtons event={event} onEdit={handleEdit} onDelete={handleDelete} />
                    </article>
                  ))}
                </div>
                <Pagination total={events.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} onPageSizeChange={pager.setPageSize} />
              </>
            )}
          </div>
        ) : (
          <div className="eventTableOuter">
            {!loading && events.length === 0 ? (
              <div className="empty-state">
                <p>No events found matching your filters.</p>
                {hasActiveFilters && <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>}
              </div>
            ) : (
              <DataTable
                loading={loading}
                columns={[
                  { key: 'date', label: 'Date', width: '140px' },
                  { key: 'event', label: 'Event Name', width: '280px' },
                  { key: 'status', label: 'Status', width: '140px' },
                  { key: 'venue', label: 'Venue', width: '220px' },
                  { key: 'actions', label: '', width: '92px' },
                ]}
                rows={eventRows}
                rowClassName="studentTableRow"
                onRowClick={(index) => {
                  const event = pager.current[index];
                  if (event) handleView(event.id);
                }}
                footer={
                  <Pagination
                    total={events.length}
                    page={pager.page}
                    pageSize={pager.pageSize}
                    onChange={pager.setPage}
                    onPageSizeChange={pager.setPageSize}
                  />
                }
              />
            )}
          </div>
        )}
        {/* {viewMode === 'cards' ? (
          <Pagination total={events.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} onPageSizeChange={pager.setPageSize} />
        ) : null} */}
        </div>
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
          color: #475569;
        }

        .status-ongoing {
          background: var(--amber-bg);
          color: #475569;
        }

        .status-completed {
          background: var(--green-bg);
          color: #475569;
        }

        .status-cancelled {
          background: var(--red-bg);
          color: #475569;
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

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Cancel Event"
        message="Are you sure you want to cancel this event?"
        confirmLabel="Confirm"
        danger
      />
      <EventDetailModal
        eventId={selectedReminder?.remId ?? null}
        eventSnapshot={selectedReminder}
        onClose={() => setSelectedReminder(null)}
        locationOptions={eventLocationOptions}
      />
    </div>
  );
}
