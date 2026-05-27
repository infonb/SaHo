import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../api/dashboardApi';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import type { DashboardStats, StudentView } from '../../types';

const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const iconPaths = {
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H7a3 3 0 0 0-3 3V5.5Zm0 0V21m4-14h8m-8 4h8',
  users: 'M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19m15 0v-1a3 3 0 0 0-2.1-2.86M13 5.2A3.5 3.5 0 1 1 6.5 8.8 3.5 3.5 0 0 1 13 5.2Zm3.5 6.3A3 3 0 1 0 15 5.9',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H19v4H7a3 3 0 0 0 0 6h12v4H6.5A2.5 2.5 0 0 1 4 16.5v-9Zm13 5h3m-1.5-1.5v3',
  clipboard: 'M9 4h6l1 2h3v15H5V6h3l1-2Zm0 6h6m-6 4h6m-6 4h4',
  chart: 'M4 19V5m0 14h16M8 16v-5m5 5V8m5 8v-7',
  plus: 'M12 5v14M5 12h14',
  report: 'M7 3h7l4 4v14H7V3Zm7 0v5h5M10 13h6m-6 4h4',
  arrow: 'M9 6l6 6-6 6',
};

function Icon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={iconPaths[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Donut({ active, total }: { active: number; total: number }) {
  const pct = total ? Math.round((active / total) * 100) : 0;
  return (
    <div className="dashDonut" style={{ '--pct': `${pct}%` } as React.CSSProperties}>
      <div>
        <strong>{pct}%</strong>
        <span>Active</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  if (!stats) return <div className="skeleton dashboardSkeleton" />;

  const inactive = stats.inactive_students;
  const left = Math.max(stats.total_students - stats.active_students - inactive, 0);
  const statusTotal = stats.active_students + inactive + left;
  const events = [
    { day: '25', month: 'MAY', title: 'Scholarship Program', place: 'Warangal, Telangana', time: '10:00 AM' },
    { day: '02', month: 'JUN', title: 'Health Camp', place: 'Karimnagar, Telangana', time: '11:00 AM' },
    { day: '15', month: 'JUN', title: 'Education Workshop', place: 'Hyderabad, Telangana', time: '09:30 AM' },
  ];

  return (
    <div className="dashboardV2">
      <section className="dashboardMain">
        <div className="dashboardHead">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.username ?? 'Admin'}!</p>
          </div>
        </div>

        <div className="metricGrid">
          <MetricCard label="Total Students" value={stats.total_students} note="Enrolled students" change="12%" icon="book" tone="purple" />
          <MetricCard label="Active Students" value={stats.active_students} note="Currently active" change="8%" icon="users" tone="green" />
          <MetricCard label="Total Sponsors" value={stats.total_sponsors} note="Supporting students" change="20%" icon="users" tone="blue" />
          <MetricCard label="Total Pledged" value={money(stats.total_pledged)} note="Total contributions" change="15%" icon="wallet" tone="orange" />
          <MetricCard label="Pending Reviews" value={stats.pending_students} note="Requires attention" change={stats.pending_students ? 'Review' : '-'} icon="clipboard" tone="rose" />
        </div>

        <div className="dashboardGrid">
          <section className="dashPanel growthPanel">
            <div className="dashPanelHead">
              <div>
                <h2>Growth Overview</h2>
                <div className="legend">
                  <span><i className="purpleDot" />Students</span>
                  <span><i className="greenDot" />Sponsors</span>
                </div>
              </div>
              <select aria-label="Growth range">
                <option>Last 5 Years</option>
              </select>
            </div>
            <GrowthChart rows={stats.year_wise_growth} />
          </section>

          <section className="dashPanel statusPanel">
            <h2>Student Status</h2>
            <div className="statusBody">
              <Donut active={stats.active_students} total={statusTotal} />
              <div className="statusLegend">
                <StatusRow color="green" label="Active" value={stats.active_students} total={statusTotal} />
                <StatusRow color="rose" label="Inactive" value={inactive} total={statusTotal} />
                <StatusRow color="purple" label="Left" value={left} total={statusTotal} />
              </div>
            </div>
          </section>

          <Link className="dashPanel sponsorAlert" to="/students">
            <div>
              <span>Students Without Sponsors</span>
              <strong>{stats.unsponsored_students}</strong>
              <small>Needs attention</small>
            </div>
            <Icon name="arrow" />
          </Link>
        </div>

        <section className="dashPanel quickActions">
          <h2>Quick Actions</h2>
          <div className="quickActionGrid">
            <QuickAction to="/students/add" icon="plus" label="Add Student" note="Register new student" tone="purple" />
            <QuickAction to="/sponsors/add" icon="users" label="Add Sponsor" note="Add new sponsor" tone="green" />
            <QuickAction to="/sponsors/assign" icon="report" label="Generate Report" note="AI powered reports" tone="blue" />
            <QuickAction to="/dashboard" icon="chart" label="View Analytics" note="Deep insights" tone="orange" />
          </div>
        </section>

        <div className="bottomDashboardGrid">
          <ListPanel title="Recent Students" action="/students">
            {stats.recent_students.map(student => (
              <StudentRow key={student.student_id} student={student} />
            ))}
          </ListPanel>
          <ListPanel title="Recent Sponsors" action="/sponsors">
            {stats.top_sponsors.slice(0, 3).map(sponsor => (
              <div className="compactRow" key={sponsor.sponsor_id}>
                <Avatar name={sponsor.full_name} size="sm" />
                <div>
                  <strong>{sponsor.full_name}</strong>
                  <span>{sponsor.type} Sponsor</span>
                </div>
                <div className="rightText">
                  <strong>{/^\d/.test(sponsor.contrib_amt) ? money(Number(sponsor.contrib_amt)) : sponsor.contrib_amt}</strong>
                  <span>{sponsor.students_count} students</span>
                </div>
              </div>
            ))}
          </ListPanel>
          <ListPanel title="Upcoming Events" action="/reminders">
            {events.map(event => (
              <div className="eventRow" key={event.title}>
                <div className="dateTile"><strong>{event.day}</strong><span>{event.month}</span></div>
                <div>
                  <strong>{event.title}</strong>
                  <span>{event.place}</span>
                </div>
                <time>{event.time}</time>
              </div>
            ))}
          </ListPanel>
        </div>
      </section>

    </div>
  );
}

function MetricCard({ label, value, note, change, icon, tone }: { label: string; value: ReactNode; note: string; change: string; icon: keyof typeof iconPaths; tone: string }) {
  return (
    <article className={`metricCard ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
        <em>{change === '-' ? '-' : `+ ${change}`}</em>
      </div>
      <div className="metricIcon"><Icon name={icon} /></div>
    </article>
  );
}

function GrowthChart({ rows }: { rows: DashboardStats['year_wise_growth'] }) {
  const maxStudents = Math.max(...rows.map(row => row.students), 1);
  const maxSponsors = Math.max(...rows.map(row => row.sponsors), 1);
  return (
    <div className="growthChart">
      <div className="chartLines">{[100, 75, 50, 25, 0].map(value => <span key={value}>{value}</span>)}</div>
      <div className="bars">
        {rows.map(row => (
          <div className="barGroup" key={row.year}>
            <div className="barPair">
              <div className="barWrap"><span>{row.students}</span><i className="studentBar" style={{ height: `${Math.max((row.students / maxStudents) * 150, 12)}px` }} /></div>
              <div className="barWrap"><span>{row.sponsors}</span><i className="sponsorBar" style={{ height: `${Math.max((row.sponsors / maxSponsors) * 92, 12)}px` }} /></div>
            </div>
            <strong>{row.year}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return <div><i className={color} /><span>{label}</span><strong>{value} ({pct}%)</strong></div>;
}

function QuickAction({ to, icon, label, note, tone }: { to: string; icon: keyof typeof iconPaths; label: string; note: string; tone: string }) {
  return (
    <Link className={`quickAction ${tone}`} to={to}>
      <span><Icon name={icon} /></span>
      <div><strong>{label}</strong><small>{note}</small></div>
    </Link>
  );
}

function ListPanel({ title, action, children }: { title: string; action: string; children: ReactNode }) {
  return (
    <section className="dashPanel listPanel">
      <div className="listHead">
        <h2>{title}</h2>
        <Link to={action}>View all</Link>
      </div>
      {children}
    </section>
  );
}

function StudentRow({ student }: { student: StudentView }) {
  return (
    <div className="compactRow">
      <Avatar name={student.full_name} size="sm" />
      <div>
        <strong>{student.full_name}</strong>
        <span>{student.class_id} Class - {student.dist_name}</span>
      </div>
      <Badge variant="active">Active</Badge>
    </div>
  );
}
