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
    <div className="actions">
      <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
        Edit
      </Button>
      {a.user_id !== 1 && (
        <Button size="sm" variant="danger" onClick={() => setRevoke(a)}>
          Revoke
        </Button>
      )}
    </div>,
  ]);
  return (
    <div>
      <PageHeader
        title="Admin Access"
        subtitle="Manage system users and permissions"
        actions={<Button className="btn btnGreen" onClick={startAdd}>Add Admin</Button>}
      />
      <div
        className="statGrid"
        style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 14 }}
      >
        <StatCard label="Super Admins" value={1} note="Full system access" />
        <StatCard
          label="Admins"
          value={admins.length}
          note="Manage records"
          accentColor="var(--blue)"
        />
        <StatCard
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
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Admin" : "Grant Access"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                document.getElementById("admin-form-submit")?.click()
              }
            >
              {editing ? "Save Changes" : "Grant Access"}
            </Button>
          </>
        }
      >
        <form id="admin-form" onSubmit={submit}>
          <div className="formGrid">
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
