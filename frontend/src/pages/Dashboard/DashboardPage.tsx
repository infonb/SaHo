import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import '../../styles/dashboard-visual.css';

type PieSlice = { label: string; value: number; color: string };

const studentCategory = [
  { label: 'Orphans', value: 68, color: '#6d28d9' },
  { label: 'Semi Orphans', value: 45, color: '#ff7a1a' },
];

const sponsorshipStatus = [
  { label: 'Sponsored Students', value: 186, color: '#10b981' },
  { label: 'Unsponsored Students', value: 62, color: '#fb5579' },
];

const yearWise = [
  { year: '2021', students: 150, sponsors: 30 },
  { year: '2022', students: 165, sponsors: 35 },
  { year: '2023', students: 180, sponsors: 40 },
  { year: '2024', students: 210, sponsors: 50 },
  { year: '2025', students: 248, sponsors: 57 },
];

const events = [
  { day: '25', month: 'MAY', title: 'Scholarship Program', location: 'Warangal, Telangana', time: '10:00 AM' },
  { day: '02', month: 'JUN', title: 'Health Camp', location: 'Karimnagar, Telangana', time: '11:00 AM' },
  { day: '15', month: 'JUN', title: 'Education Workshop', location: 'Hyderabad, Telangana', time: '09:30 AM' },
];

const recentStudents = [
  { initials: 'PR', name: 'Priya Reddy', grade: '8th Class' },
  { initials: 'AK', name: 'Anjali Kumari', grade: '9th Class' },
  { initials: 'SD', name: 'Sandhya Devi', grade: '7th Class' },
  { initials: 'MR', name: 'Mamatha Rao', grade: '10th Class' },
  { initials: 'VS', name: 'Vivek Singh', grade: '6th Class' },
];

const recentSponsors = [
  { initials: 'SU', name: 'Sunita Foundation', amount: '₹2,50,000', ago: '2 days ago' },
  { initials: 'RK', name: 'Ramesh Kumar', amount: '₹1,00,000', ago: '1 week ago' },
  { initials: 'TS', name: 'Tech Solutions Ltd.', amount: '₹3,00,000', ago: '2 weeks ago' },
  { initials: 'GH', name: 'Global Helping Hands', amount: '₹2,00,000', ago: '3 weeks ago' },
  { initials: 'VR', name: 'Priya Reddy', amount: '₹75,000', ago: '1 month ago' },
];

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg className="chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StudentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 20c0-3.3 2.7-6 6-6h1c2.5 0 4.7 1.5 5.6 3.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14.2 16.2c1.1-1.1 2.5-1.7 4-1.7 2.8 0 4.3 1.6 4.3 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SponsorsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.7 20c0-3 2.2-5 5.3-5 1.8 0 3.1.6 4 1.7 1-1.1 2.4-1.7 4.3-1.7 3 0 4.7 1.8 4.7 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M10 7h7v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ slices }: { slices: PieSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 25;

  return (
    <svg className="donutSvg" viewBox="0 0 42 42" aria-hidden="true">
      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#edf1fa" strokeWidth="5" />
      {slices.map(slice => {
        const dash = (slice.value / total) * 100;
        const element = (
          <circle
            key={slice.label}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={slice.color}
            strokeWidth="5"
            strokeLinecap="butt"
            strokeDasharray={`${dash} ${100 - dash}`}
            strokeDashoffset={offset}
          />
        );
        offset -= dash;
        return element;
      })}
      <circle cx="21" cy="21" r="10.2" fill="#fff" />
    </svg>
  );
}

function DashboardCard({
  className,
  style,
  children,
}: {
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return <section className={`dashCard ${className}`} style={style}>{children}</section>;
}

export default function DashboardPage() {
  const totalStudents = 248;
  const totalSponsors = 57;
  const totalContribution = '₹12,45,000';

  const chartBars = useMemo(() => yearWise, []);

  return (
    <div className="sahoDashboard">
      <div className="dashboardGrid">
        <DashboardCard className="statsStudents">
          <div className="cardTopRow">
            <div className="smallIcon purpleBg"><StudentIcon /></div>
            <div style={{ flex: 1 }}>
              <p className="dashCardTitle">Total Students</p>
              <div className="statValue">{totalStudents}</div>
            </div>
          </div>
          <div className="subStatGrid">
            <div className="miniStat">
              <div className="smallIcon pinkBg" style={{ width: 44, height: 44 }}><StudentIcon /></div>
              <div>
                <strong>126</strong>
                <span>Girls</span>
              </div>
            </div>
            <div className="miniStat">
              <div className="smallIcon blueBg" style={{ width: 44, height: 44 }}><StudentIcon /></div>
              <div>
                <strong>122</strong>
                <span>Boys</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="statsSponsors">
          <div className="cardTopRow">
            <div className="smallIcon greenBg"><SponsorsIcon /></div>
            <div style={{ flex: 1 }}>
              <p className="dashCardTitle">Total Sponsors</p>
              <div className="statValue" style={{ fontSize: 34, marginTop: 14 }}>{totalSponsors}</div>
            </div>
          </div>
          <div className="metricDivider" />
          <p className="metricLabel">Total Contribution Amount</p>
          <div className="metricAmount">{totalContribution}</div>
        </DashboardCard>

        <DashboardCard className="statsCategory">
          <p className="dashCardTitle">Student Category</p>
          <div className="donutWrap" style={{ marginTop: 14 }}>
            <DonutChart slices={studentCategory} />
            <div className="legendList">
              {studentCategory.map(slice => (
                <div className="legendItem" key={slice.label}>
                  <div className="left">
                    <span className="legendDot" style={{ background: slice.color }} />
                    <span>{slice.label}</span>
                  </div>
                  <strong>{slice.label === 'Orphans' ? '68 (27.4%)' : '45 (18.1%)'}</strong>
                </div>
              ))}
              <div className="chartDivider" />
              <div className="legendItem">
                <span>Total</span>
                <strong>113 (45.5%)</strong>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="sponsorship">
          <p className="dashCardTitle">Sponsorship Status</p>
          <div className="donutWrap" style={{ marginTop: 20 }}>
            <DonutChart slices={sponsorshipStatus} />
            <div className="chartBreakdown">
              <div className="summaryRow">
                <div className="summaryLabel">
                  <span className="legendDot" style={{ background: '#10b981' }} />
                  <span>Sponsored Students</span>
                </div>
                <strong>186 (75%)</strong>
              </div>
              <div className="summaryRow">
                <div className="summaryLabel">
                  <span className="legendDot" style={{ background: '#fb5579' }} />
                  <span>Unsponsored Students</span>
                </div>
                <strong>62 (25%)</strong>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="growth">
          <div className="chartHead">
            <div>
              <p className="dashCardTitle">Year Wise Students &amp; Sponsors</p>
              <div className="chartLegend" style={{ marginTop: 12 }}>
                <div className="chartLegendItem"><span className="legendDot" style={{ background: '#6d28d9' }} />Students</div>
                <div className="chartLegendItem"><span className="legendDot" style={{ background: '#10b981' }} />Sponsors</div>
              </div>
            </div>
            <button type="button" className="selectPill">Last 5 Years <ChevronDown /></button>
          </div>
          <div className="chartArea">
            <div className="barGrid">
              {chartBars.map(row => (
                <div className="barGroup" key={row.year}>
                  <div className="bars">
                    <div className="barCol">
                      <div className="barValue">{row.students}</div>
                      <div className="bar students" style={{ height: `${row.students * 0.56}px` }} />
                    </div>
                    <div className="barCol">
                      <div className="barValue">{row.sponsors}</div>
                      <div className="bar sponsors" style={{ height: `${row.sponsors * 1.45}px` }} />
                    </div>
                  </div>
                  <div className="barLabel">{row.year}</div>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="events">
          <div className="listCard">
            <div className="listHeader">
              <p className="dashCardTitle" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="smallIcon purpleBg" style={{ width: 28, height: 28, borderRadius: 8 }}><CalendarIcon /></span>
                Upcoming Events
              </p>
              <span className="viewAll">View All</span>
            </div>
            {events.map(event => (
              <div className="eventItem" key={event.title}>
                <div className="dateTile">
                  <strong style={{ fontSize: 16 }}>{event.day}</strong>
                  <span>{event.month}</span>
                </div>
                <div className="listText">
                  <strong>{event.title}</strong>
                  <p>{event.location}</p>
                </div>
                <div className="timeText">{event.time}</div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard className="studentsRecent">
          <div className="listCard">
            <div className="listHeader">
              <p className="dashCardTitle" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="smallIcon purpleBg" style={{ width: 28, height: 28, borderRadius: 8 }}><StudentIcon /></span>
                Recent Students
              </p>
              <span className="viewAll">View All</span>
            </div>
            {recentStudents.map(student => (
              <div className="studentItem" key={student.name}>
                <div className="studentAvatar">{student.initials}</div>
                <div className="studentMeta">
                  <strong>{student.name}</strong>
                  <span>{student.grade}</span>
                </div>
                <span className="statusPill">Active</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard className="sponsorsRecent">
          <div className="listCard">
            <div className="listHeader">
              <p className="dashCardTitle" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="smallIcon greenBg" style={{ width: 28, height: 28, borderRadius: 8 }}><SponsorsIcon /></span>
                Recent Sponsors
              </p>
              <span className="viewAll">View All</span>
            </div>
            {recentSponsors.map(sponsor => (
              <div className="sponsorItem" key={sponsor.name}>
                <div className="studentAvatar" style={{ background: '#eff6ff', color: '#2563eb' }}>{sponsor.initials}</div>
                <div className="sponsorMeta">
                  <strong>{sponsor.name}</strong>
                </div>
                <div className="sponsorAmount">
                  <strong>{sponsor.amount}</strong>
                  <span>{sponsor.ago}</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
