import { FormEvent, useEffect, useState } from "react";
import {
  createAdmin,
  deactivateAdmin,
  getAdmins,
  updateAdmin,
} from "../../api/userApi";
import { getVolunteers } from "../../api/volunteerApi";
import Avatar from "../../components/common/Avatar";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import type { User } from "../../types";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [revoke, setRevoke] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "",
    email_id: "",
    password: "",
    role: "Admin" as User["role"],
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const load = () => {
    getAdmins().then(setAdmins);
    getVolunteers().then(setVolunteers);
  };
  useEffect(load, []);
  const startAdd = () => {
    setEditing(null);
    setForm({ username: "", email_id: "", password: "", role: "Admin" });
    setOpen(true);
  };
  const startEdit = (u: User) => {
    setEditing(u);
    setForm({
      username: u.username,
      email_id: u.email_id,
      password: "",
      role: u.role,
    });
    setOpen(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (editing) await updateAdmin(editing.user_id, form);
    else await createAdmin({ ...form, created_by: user?.username ?? "admin" });
    toast(editing ? "Access updated." : "Access granted.", "success");
    setOpen(false);
    load();
  };
  const rows = admins.map((a) => [
    <div className="rowFlex">
      <Avatar name={a.username} />
      <strong>{a.username}</strong>
    </div>,
    a.email_id,
    <Badge variant="admin">{a.role}</Badge>,
    new Date(a.created_at).toLocaleDateString(),
    <div className="actions student-actions">
      <Button
        size="sm"
        variant="outline"
        className="iconBtn editActionButton"
        onClick={() => startEdit(a)}
        aria-label={`Edit ${a.username}`}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 20h4.5L20.5 8l-4.5-4.5L4 15.5V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 4l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
      {a.user_id !== 1 && (
        <Button
          size="sm"
          variant="outline"
          className="iconBtn deleteActionButton"
          onClick={() => setRevoke(a)}
          aria-label={`Delete ${a.username}`}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      )}
    </div>,
  ]);
  return (
    <div className="admin-access-page">
      <PageHeader
        title="Admin Access"
        subtitle="Manage system users and permissions"
        actions={<Button className="btn btnGreen" onClick={startAdd}>Add Admin</Button>}
      />
      <div
        className="statGrid"
        style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 14 }}
      >
        <StatCard
          className="reminderRecordCard"
          label="Super Admins"
          value={1}
          note="Full system access"
        />
        <StatCard
          className="reminderRecordCard"
          label="Admins"
          value={admins.length}
          note="Manage records"
          accentColor="var(--blue)"
        />
        <StatCard
          className="reminderRecordCard"
          label="Volunteers"
          value={volunteers.length}
          note="View & update only"
          accentColor="var(--green)"
        />
      </div>
      <DataTable
        columns={[
          { key: "u", label: "User" },
          { key: "e", label: "Email" },
          { key: "r", label: "Role" },
          { key: "a", label: "Added On" },
          { key: "x", label: "Actions" },
        ]}
        rows={rows}
        rowClassName="studentTableRow"
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Admin" : "Grant Access"}
        width={760}
        footer={
          <>
            <Button className="btnRed" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btnGreen"
              onClick={() =>
                document.getElementById("admin-form-submit")?.click()
              }
            >
              {editing ? "Save Changes" : "Grant Access"}
            </Button>
          </>
        }
      >
        <form id="admin-form" className="studentWizardForm" onSubmit={submit}>
          <section className="studentFormSection">
            <div className="formGrid studentStepGrid">
              <label className="field">
                <span>Username*</span>
                <input
                  required
                  className="input"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Email*</span>
                <input
                  required
                  className="input"
                  value={form.email_id}
                  onChange={(e) => setForm({ ...form, email_id: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Password{editing ? "" : "*"}</span>
                <input
                  required={!editing}
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Role*</span>
                <select
                  className="select"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as User["role"] })
                  }
                >
                  <option>Admin</option>
                  <option>Volunteer</option>
                  <option>Student</option>
                </select>
              </label>
            </div>
          </section>
          <button id="admin-form-submit" hidden type="submit" />
        </form>
      </Modal>
      <ConfirmModal
        open={!!revoke}
        onClose={() => setRevoke(null)}
        onConfirm={async () => {
          if (revoke) {
            await deactivateAdmin(revoke.user_id);
            toast("Access revoked.", "success");
            setRevoke(null);
            load();
          }
        }}
        title="Revoke Access"
        message={`Revoke access for ${revoke?.username}?`}
        confirmLabel="Yes, Revoke Access"
      />
    </div>
  );
}
