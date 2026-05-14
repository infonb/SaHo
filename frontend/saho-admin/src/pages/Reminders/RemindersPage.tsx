import PageHeader from '../../components/common/PageHeader';

export default function RemindersPage() {
  return (
    <div>
      <PageHeader title="Reminders" subtitle="Event and student reminder management" />
      <div className="panel">
        <h3 className="panelTitle">Reminders</h3>
        <p className="sub">Reminder management can be connected here when the backend endpoints are ready.</p>
      </div>
    </div>
  );
}
