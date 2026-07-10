import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronDown,
  FiClock,
  FiMapPin,
  FiPlus,
  FiUserPlus,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { getSponsors } from '../../api/sponsorApi';
import { getStudents } from '../../api/studentApi';
import { getDashboardStats } from '../../api/dashboardApi';
import DataTable from '../../components/common/DataTable';
import type { DashboardData, SponsorView, StudentView } from '../../types';
import '../../styles/dashboard.css';

const EMPTY_DASHBOARD: DashboardData = {
  studentSummary: { totalStudents: 0, boysCount: 0, girlsCount: 0 },
  villageSummary: { totalVillages: 0, totalMandals: 0, totalDistricts: 0 },
  studentCategory: { orphanCount: 0, semiOrphanCount: 0 },
  upcomingEvents: [],
  ageDistribution: { age10To11: 0, age12To13: 0, age14To15: 0, age16Plus: 0 },
  studentsByLocation: [],
  yearlyStudentData: [],
};

type Tone = 'blue' | 'green' | 'pink' | 'orange' | 'purple';

function normalizeDashboardData(data?: Partial<DashboardData> | null): DashboardData {
  return {
    studentSummary: {
      totalStudents: data?.studentSummary?.totalStudents ?? 0,
      boysCount: data?.studentSummary?.boysCount ?? 0,
      girlsCount: data?.studentSummary?.girlsCount ?? 0,
    },
    villageSummary: {
      totalVillages: data?.villageSummary?.totalVillages ?? 0,
      totalMandals: data?.villageSummary?.totalMandals ?? 0,
      totalDistricts: data?.villageSummary?.totalDistricts ?? 0,
    },
    studentCategory: {
      orphanCount: data?.studentCategory?.orphanCount ?? 0,
      semiOrphanCount: data?.studentCategory?.semiOrphanCount ?? 0,
    },
    upcomingEvents: data?.upcomingEvents ?? [],
    ageDistribution: {
      age10To11: data?.ageDistribution?.age10To11 ?? 0,
      age12To13: data?.ageDistribution?.age12To13 ?? 0,
      age14To15: data?.ageDistribution?.age14To15 ?? 0,
      age16Plus: data?.ageDistribution?.age16Plus ?? 0,
    },
    studentsByLocation: data?.studentsByLocation ?? [],
    yearlyStudentData: data?.yearlyStudentData ?? [],
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatPercent(value: number, total: number) {
  if (!total) {
    return '0%';
  }
  return `${Math.round((value / total) * 100)}%`;
}

function formatMonthDay(dateValue?: string | null) {
  if (!dateValue) {
    return { month: '--', day: '--' };
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return { month: '--', day: '--' };
  }

  return {
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

function formatLongDate(dateValue?: string | null) {
  if (!dateValue) {
    return 'Date not available';
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeValue?: string | null) {
  return timeValue?.trim() ;
}

function getLocationLabel(item: { mandalName?: string | null }) {
  return item.mandalName?.trim() || 'Unnamed location';
}

function buildLegend(
  items: Array<{ label: string; value: number; tone: Tone }>,
  total: number,
) {
  return items.map((item) => ({
    label: item.label,
    tone: item.tone,
    value: `${formatNumber(item.value)} (${formatPercent(item.value, total)})`,
  }));
}

function LineChart({ data }: { data: DashboardData['yearlyStudentData'] }) {
  const width = 740;
  const height = 260;
  const chartLeft = 56;
  const chartRight = width - 22;
  const chartTop = 20;
  const chartBottom = height - 32;
  const series = data ?? [];

  if (!series.length) {
    return (
      <div className="dashboardEmptyState">
        Yearly trends will appear here once the dashboard data is available.
      </div>
    );
  }

  const lineYears = series.map((item) => String(item.year));
  const boyValues = series.map((item) => item.boysCount ?? 0);
  const girlValues = series.map((item) => item.girlsCount ?? 0);
  const totalValues = series.map((item) => item.totalStudents ?? 0);
  const allValues = [...boyValues, ...girlValues, ...totalValues, 0];
  const scaleMax = Math.max(10, ...allValues);
  const ticks = Array.from({ length: 6 }, (_, index) => Math.round((scaleMax * index) / 5));
  const usableWidth = chartRight - chartLeft;
  const usableHeight = chartBottom - chartTop;

  const formatPoint = (value: number, index: number) => {
    const x =
      series.length === 1
        ? (chartLeft + chartRight) / 2
        : chartLeft + (usableWidth * index) / (series.length - 1);
    const y = chartBottom - (value / scaleMax) * usableHeight;
    return { x, y };
  };

  const buildPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const point = formatPoint(value, index);
        return `${point.x},${point.y}`;
      })
      .join(' ');

  return (
    <svg
      className="dashboardLineChart"
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Year wise student count chart"
    >
      <line
        className="chartAxisLine"
        x1={chartLeft}
        x2={chartLeft}
        y1={chartTop}
        y2={chartBottom}
      />
      {ticks.map((tick) => {
        const y = chartBottom - (tick / scaleMax) * (chartBottom - chartTop);
        return (
          <g key={tick}>
            <line className="chartGrid" x1={chartLeft} x2={chartRight} y1={y} y2={y} />
            <text className="chartAxisLabel" x="34" y={y + 4} textAnchor="end">
              {tick}
            </text>
          </g>
        );
      })}
      {lineYears.map((year, index) => {
        const x =
          series.length === 1
            ? (chartLeft + chartRight) / 2
            : chartLeft + (usableWidth * index) / (series.length - 1);
        return (
          <text
            key={year}
            className="chartYear"
            x={x}
            y={height - 6}
            textAnchor="middle"
          >
            {year}
          </text>
        );
      })}
      <polyline className="chartLine blue" points={buildPoints(boyValues)} />
      <polyline className="chartLine pink" points={buildPoints(girlValues)} />
      <polyline className="chartLine green" points={buildPoints(totalValues)} />
      {boyValues.map((value, index) => {
        const point = formatPoint(value, index);
        return (
          <g key={`boys-${lineYears[index]}`}>
            <circle className="chartDot blue" cx={point.x} cy={point.y} r="5" />
            <text className="chartValue blue" x={point.x} y={point.y - 12} textAnchor="middle">
              {value}
            </text>
          </g>
        );
      })}
      {girlValues.map((value, index) => {
        const point = formatPoint(value, index);
        return (
          <g key={`girls-${lineYears[index]}`}>
            <circle className="chartDot pink" cx={point.x} cy={point.y} r="5" />
            <text className="chartValue pink" x={point.x} y={point.y + 20} textAnchor="middle">
              {value}
            </text>
          </g>
        );
      })}
      {totalValues.map((value, index) => {
        const point = formatPoint(value, index);
        return (
          <g key={`total-${lineYears[index]}`}>
            <circle className="chartDot green" cx={point.x} cy={point.y} r="5" />
            <text className="chartValue green" x={point.x} y={point.y - 12} textAnchor="middle">
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({
  title,
  center,
  segments,
  legend,
}: {
  title: string;
  center: string;
  segments: Array<{ value: number; tone: string }>;
  legend: Array<{ label: string; value: string; tone: Tone }>;
}) {
  const size = 184;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0);
  const gapSize = 1;
  let offset = 0;

  return (
    <article className="dashboardCard dashboardDonutCard">
      <h3>{title}</h3>
      <div className="donutLayout">
        <div className="donutWrap">
          <svg viewBox={`0 0 ${size} ${size}`}>
            <circle
              className="donutTrack"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            {sum > 0 ? (
              <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                {segments.map((segment, index) => {
                  const rawDash = (segment.value / sum) * circumference;
                  const dash = Math.max(1, rawDash - gapSize);
                  const node = (
                    <circle
                      key={index}
                      className="donutSeg"
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={segment.tone}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += rawDash;
                  return node;
                })}
              </g>
            ) : null}
          </svg>
          <div className="donutCenter">
            <strong>{center}</strong>
            <span>Students</span>
          </div>
        </div>
        <div className="donutLegend">
          {legend.length ? (
            legend.map((item) => (
              <div key={item.label} className="donutLegendRow">
                <span>
                  <i className={`legendDot ${item.tone}`} />
                  {item.label}
                </span>
                <strong>{item.value}</strong>
              </div>
            ))
          ) : (
            <div className="dashboardEmptyState">No breakdown available.</div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentStudents, setRecentStudents] = useState<StudentView[]>([]);
  const [recentSponsors, setRecentSponsors] = useState<SponsorView[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardStats();
        if (!active) {
          return;
        }
        setDashboard(normalizeDashboardData(data));
      } catch {
        if (active) {
          setError('Unable to load dashboard data from the server.');
          setDashboard(EMPTY_DASHBOARD);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadRecentRecords = async () => {
      setRecentLoading(true);
      try {
        const [studentsResult, sponsorsResult] = await Promise.allSettled([
          getStudents({
            pageNumber: 1,
            pageSize: 5,
            sortColumn: 'student_id',
            sortDirection: 'DESC',
          }),
          getSponsors(undefined, {
            pageNumber: 1,
            pageSize: 5,
            sortColumn: 'sponsor_id',
            sortDirection: 'DESC',
          }),
        ]);

        if (!active) {
          return;
        }

        setRecentStudents(
          studentsResult.status === 'fulfilled' ? studentsResult.value.students.slice(0, 5) : [],
        );
        setRecentSponsors(
          sponsorsResult.status === 'fulfilled' ? sponsorsResult.value.slice(0, 5) : [],
        );
      } finally {
        if (active) {
          setRecentLoading(false);
        }
      }
    };

    void loadRecentRecords();

    return () => {
      active = false;
    };
  }, []);

  const totalStudents = dashboard.studentSummary.totalStudents;
  const totalVillages = dashboard.villageSummary.totalVillages;
  const totalMandals = dashboard.villageSummary.totalMandals;
  const totalDistricts = dashboard.villageSummary.totalDistricts;
  const orphanCount = dashboard.studentCategory.orphanCount;
  const semiOrphanCount = dashboard.studentCategory.semiOrphanCount;
  const totalAgeCount =
    dashboard.ageDistribution.age10To11 +
    dashboard.ageDistribution.age12To13 +
    dashboard.ageDistribution.age14To15 +
    dashboard.ageDistribution.age16Plus;
  const totalLocationCount = dashboard.studentsByLocation.reduce(
    (sum, item) => sum + (item.studentCount ?? 0),
    0,
  );

  const ageLegend = buildLegend(
    [
      { label: '10 - 11 Years', value: dashboard.ageDistribution.age10To11, tone: 'blue' },
      { label: '12 - 13 Years', value: dashboard.ageDistribution.age12To13, tone: 'green' },
      { label: '14 - 15 Years', value: dashboard.ageDistribution.age14To15, tone: 'pink' },
      { label: '16+ Years', value: dashboard.ageDistribution.age16Plus, tone: 'orange' },
    ],
    totalAgeCount,
  );

  const locationLegend = buildLegend(
    dashboard.studentsByLocation.map((item, index) => ({
      label: getLocationLabel(item),
      value: item.studentCount ?? 0,
      tone: ['blue', 'green', 'pink', 'purple', 'orange'][index % 5] as Tone,
    })),
    totalLocationCount,
  );

  const eventRows = dashboard.upcomingEvents.map((event, index) => {
    const date = formatMonthDay(event.eventDate);
    const dateTone = ['green', 'amber', 'purple'][index % 3];
    return {
      key: `${event.remId ?? index}-${event.title}`,
      date,
      dateTone,
      title: event.title || 'Untitled event',
      venue: event.venue || 'Venue not set',
      fullDate: formatLongDate(event.eventDate),
      time: formatTime(event.eventTime),
    };
  });

  const recentStudentRows = recentStudents.map((student) => [
    student.student_id,
    <span
      key={`student-${student.student_id}-name`}
      className="dashboardRecentCell"
      title={student.studentName ?? student.full_name}
    >
      {student.studentName ?? student.full_name}
    </span>,
    <span
      key={`student-${student.student_id}-school`}
      className="dashboardRecentCell"
      title={student.sch_name}
    >
      {student.sch_name}
    </span>,
  ]);

  const recentSponsorRows = recentSponsors.map((sponsor) => [
    sponsor.sponsor_id,
    <span
      key={`sponsor-${sponsor.sponsor_id}-name`}
      className="dashboardRecentCell"
      title={sponsor.sponsorName}
    >
      {sponsor.sponsorName}
    </span>,
    <span
      key={`sponsor-${sponsor.sponsor_id}-nationality`}
      className="dashboardRecentCell"
      title={sponsor.nationality}
    >
      {sponsor.nationality}
    </span>,
  ]);

  const isRecentLoading = loading || recentLoading;

  return (
    <div className="dashboardScreen">
      <section className="dashboardHero">
        <div className="dashboardGreeting">
          <h1>Welcome back, Admin!</h1>
          <p>
            Here&apos;s the latest snapshot from your live dashboard
            {loading ? ' while we load the data...' : '.'}
          </p>
        </div>
      </section>

      {error ? <div className="toast error">{error}</div> : null}

      <section className="student-stats-grid grid-cols-4 ">
        <article className="reminderRecordCard ">
          <div className="statHeader">
            <div className="stat-card-icon">
              <FiUsers />
            </div>
            <div className="stat-card-label">Total Students</div>
          </div>
          <strong className="statValue">
            {loading ? '...' : formatNumber(totalStudents)}
          </strong>
          <div className="statSplit">
            <div className="stat-card-note">
              Boys{' '}
              <strong className="tone-blue">
                {loading ? '...' : formatNumber(dashboard.studentSummary.boysCount)}
              </strong>
            </div>
            <span className="dividerLine" />
            <div className="stat-card-note">
              Girls{' '}
              <strong className="tone-pink">
                {loading ? '...' : formatNumber(dashboard.studentSummary.girlsCount)}
              </strong>
            </div>
          </div>
        </article>

        <article className="reminderRecordCard ">
          <div className="statHeader">
            <div className="stat-card-icon">
              <FiMapPin />
            </div>
            <div className="stat-card-label">Total Villages </div>
          </div>
          <strong className="statValue tone-green">
            {loading ? '...' : formatNumber(totalVillages)}
          </strong>
          <div className="statSplit">
            <div className="stat-card-note">
              Mandals
              {' '}
              <strong className="tone-green">
                {loading ? '...' : formatNumber(totalMandals)}
              </strong>
            </div>
            <span className="dividerLine" />
            <div className="stat-card-note">
              Districts
              {' '}
              <strong className="tone-green">
                {loading ? '...' : formatNumber(totalDistricts)}
              </strong>
            </div>
          </div>
        </article>

        <article className="reminderRecordCard ">
          <div className="statHeader">
            <div className="stat-card-icon purple">
              <FiUser />
            </div>
            <div className="stat-card-label">Student Category</div>
          </div>
          <div className="categoryRows">
            <div>
              <div className="stat-card-note">Orphans</div>
              <strong className="tone-black">{loading ? '...' : formatNumber(orphanCount)}</strong>
            </div>
            <div>
              <div className="stat-card-note">Semi-Orphans</div>
              <strong className="tone-black">{loading ? '...' : formatNumber(semiOrphanCount)}</strong>
            </div>
          </div>
        </article>

        <article className="reminderRecordCard">
          <div className="statHeader">
            <div className="stat-card-icon">
              <FiUserPlus />
            </div>
            <div className="stat-card-label">Add Student</div>
          </div>
          <p className="addStudentDescription"></p>
          <div className="add-student-action">
            <button type="button" className="btn btnGreen" onClick={() => navigate('/students/add')}>
            <FiPlus size={18} />
            &nbsp;Add Student
            </button>
          </div>
        </article>
      </section>

      <section className="dashboardMiddleRow">
        <article className="dashboardCard chartCard">
          <div className="cardHeader">
            <h2>Year Wise Student Count</h2>
            <button type="button" className="pillButton">
              Last {dashboard.yearlyStudentData.length || 0} Years <FiChevronDown />
            </button>
          </div>
          <div className="chartLegend">
            <span>
              <i className="legendDot blue" />
              Boys
            </span>
            <span>
              <i className="legendDot pink" />
              Girls
            </span>
            <span>
              <i className="legendDot green" />
              Total
            </span>
          </div>
          <div className="chartWrap">
            <LineChart data={dashboard.yearlyStudentData} />
          </div>
        </article>

        <article className="dashboardCard eventsCard">
          <div className="cardHeader">
            <h2 className="eventsTitle">Upcoming Events</h2>
            <button
              type="button"
              className="linkButton"
              onClick={() => navigate('/reminders')}
            >
              View All
            </button>
          </div>
          <div className="eventList">
            {eventRows.length ? (
              eventRows.map((event) => (
                <div className="eventRow" key={event.key}>
                  <div className={`eventDateBox tone-${event.dateTone}`}>
                    <span className="eventMonth">{event.date.month}</span>
                    <strong className="eventDay">{event.date.day}</strong>
                  </div>
                  <div className="eventInfo">
                    <h3 className="eventTitle">{event.title}</h3>
                    <p className="eventVenue">{event.venue}</p>
                  </div>
                  <div className="eventDateTime">
                    <FiClock className="eventClockIcon" />
                    <div className="eventDateTimeInner">
                      <span className="eventFullDate">{event.fullDate}</span>
                      <span className="eventTime">{event.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboardEmptyState">
                No upcoming events found in the dashboard payload.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="dashboardBottomRow">
        <DonutChart
          title="Age Group Distribution"
          center={loading ? '...' : formatNumber(totalStudents)}
          segments={[
            { value: dashboard.ageDistribution.age10To11, tone: '#4f71e6' },
            { value: dashboard.ageDistribution.age12To13, tone: '#3fb34f' },
            { value: dashboard.ageDistribution.age14To15, tone: '#f04a7d' },
            { value: dashboard.ageDistribution.age16Plus, tone: '#f5a524' },
          ]}
          legend={ageLegend}
        />
        <DonutChart
          title="Students by Location"
          center={loading ? '...' : formatNumber(totalStudents)}
          segments={dashboard.studentsByLocation.map((item, index) => ({
            value: item.studentCount ?? 0,
            tone: ['#4f71e6', '#3fb34f', '#f04a7d', '#8b5cf6', '#f5a524'][index % 5],
          }))}
          legend={locationLegend}
        />
      </section>

      <section className="dashboardBottomRow dashboardRecentRow">
        <article className="dashboardCard dashboardRecentCard">
          <div className="cardHeader">
            <h2>Recent Students</h2>
            <button
              type="button"
              className="linkButton"
              onClick={() => navigate('/students')}
            >
              View All
            </button>
          </div>
          <DataTable
            loading={isRecentLoading}
            loadingRowCount={5}
            columns={[
              { key: 'id', label: 'ID', width: '72px' },
              { key: 'student', label: 'Student', width: '52%' },
              { key: 'school', label: 'School', width: '48%' },
            ]}
            rows={recentStudentRows}
          />
        </article>

        <article className="dashboardCard dashboardRecentCard">
          <div className="cardHeader">
            <h2>Recent Sponsors</h2>
            <button
              type="button"
              className="linkButton"
              onClick={() => navigate('/sponsors')}
            >
              View All
            </button>
          </div>
          <DataTable
            loading={isRecentLoading}
            loadingRowCount={5}
            columns={[
              { key: 'id', label: 'ID', width: '72px' },
              { key: 'sponsor', label: 'Sponsor', width: '52%' },
              { key: 'nationality', label: 'Nationality', width: '48%' },
            ]}
            rows={recentSponsorRows}
          />
        </article>
      </section>
    </div>
  );
}
