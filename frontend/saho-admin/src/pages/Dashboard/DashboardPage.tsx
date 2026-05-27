import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../api/dashboardApi';
import StatCard from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import type { DashboardStats } from '../../types';

const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const greeting = () => new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

function Donut({ values, colors, total }: { values: number[]; colors: string[]; total: number }) {
  let acc = 0;
  return (
    <svg width="126" height="126" viewBox="0 0 42 42">
      {values.map((value, index) => {
        const dash = total ? (value / total) * 100 : 0;
        const circle = <circle key={index} cx="21" cy="21" r="15.9" fill="transparent" stroke={colors[index]} strokeWidth="5" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={25 - acc} />;
        acc += dash;
        return circle;
      })}
      <text x="21" y="23" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--color-text)">{total}</text>
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  if (!stats) return <div className="skeleton" style={{ height: 420 }} />;

  const totalGender = stats.gender_split.male + stats.gender_split.female + stats.gender_split.other;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <PageGreeting title={`${greeting()}, ${user?.username}`} date={today} />
      <div className="statGrid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard label="Total Students" value={stats.total_students} note="Enrolled" />
        <StatCard label="Active Students" value={stats.active_students} accentColor="var(--green)" />
        <StatCard label="Total Sponsors" value={stats.total_sponsors} accentColor="var(--blue)" />
        <StatCard label="Total Pledged" value={money(stats.total_pledged)} accentColor="var(--amber)" />
        <StatCard label="Pending Reviews" value={stats.pending_students} accentColor="var(--red)" />
      </div>

      <h3 className="panelTitle" style={{ marginTop: 24 }}>Demographics</h3>
      <div className="chartGrid">
        <ChartCard title="Gender Split" donut={<Donut total={totalGender} values={[stats.gender_split.male, stats.gender_split.female, stats.gender_split.other]} colors={['var(--blue)', 'var(--purple)', 'var(--amber)']} />} rows={[['Male', stats.gender_split.male], ['Female', stats.gender_split.female], ['Other', stats.gender_split.other]]} />
        <ChartCard title="Student Status" donut={<Donut total={stats.total_students + stats.inactive_students} values={[stats.active_students, stats.inactive_students]} colors={['var(--green)', 'var(--red)']} />} rows={[['Active', stats.active_students], ['Inactive', stats.inactive_students]]} />
        <ChartCard title="Sponsorship" donut={<Donut total={stats.total_students} values={[stats.sponsored_students, stats.unsponsored_students]} colors={['var(--green)', 'var(--amber)']} />} rows={[['Sponsored', stats.sponsored_students], ['Unsponsored', stats.unsponsored_students]]} />
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="between">
          <h3 className="panelTitle">Growth Analytics</h3>
          <span className="sub">Students / Sponsors</span>
        </div>
        <svg width="100%" height="230" viewBox="0 0 620 230">
          {stats.year_wise_growth.map((row, index) => {
            const x = 40 + index * 112;
            return (
              <g key={row.year}>
                <rect x={x} y={190 - row.students * 4} width="28" height={row.students * 4} fill="var(--color-primary)" rx="4" />
                <rect x={x + 34} y={190 - row.sponsors * 10} width="28" height={row.sponsors * 10} fill="var(--blue)" rx="4" />
                <text x={x + 14} y={184 - row.students * 4} textAnchor="middle" fontSize="10">{row.students}</text>
                <text x={x + 48} y={184 - row.sponsors * 10} textAnchor="middle" fontSize="10">{row.sponsors}</text>
                <text x={x + 30} y="214" textAnchor="middle" fontSize="11" fill="var(--color-text3)">{row.year}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 className="panelTitle">Geographic Distribution</h3>
        {stats.district_breakdown.map(district => (
          <div key={district.dist_name} style={{ marginBottom: 12 }}>
            <div className="between sub">
              <span>{district.dist_name}</span>
              <span>{district.student_count}</span>
            </div>
            <div className="barTrack">
              <div className="barFill" style={{ width: `${(district.student_count / stats.total_students) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageGreeting({ title, date }: { title: string; date: string }) {
  return <div className="pageHeader"><div><h1>{title}</h1><p>{date}</p><p>Here's what's happening with SaHo Foundation today.</p></div></div>;
}

function ChartCard({ title, donut, rows }: { title: string; donut: React.ReactNode; rows: [string, number][] }) {
  return <div className="panel"><h3 className="panelTitle">{title}</h3><div className="rowFlex">{donut}<div>{rows.map(row => <div className="between" style={{ width: 140, marginBottom: 8 }} key={row[0]}><span className="sub">{row[0]}</span><strong>{row[1]}</strong></div>)}</div></div></div>;
}
