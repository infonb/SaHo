import { FormEvent, useEffect, useState } from "react";
import {
  createAdmin,
  deactivateAdmin,
  getAdminCount,
  getAdmins,
  updateAdmin,
} from "../../api/userApi";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import type { User } from "../../types";
import { SponsorSelect } from "../Sponsors/SponsorFormPage";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [adminCount, setAdminCount] = useState(0);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [revoke, setRevoke] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    email_id: "",
    password: "",
    role: "Admin" as User["role"],
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const load = async () => {
    const [adminList, count] = await Promise.all([getAdmins(), getAdminCount()]);
    setAdmins(adminList);
    setAdminCount(count);
  };

  useEffect(() => { load(); }, []);

  const startAdd = () => {
    setEditing(null);
    setForm({ email_id: "", password: "", role: "Admin" });
    setShowPassword(false);
    setFormError("");
    setOpen(true);
  };

  const startEdit = (u: User) => {
    setEditing(u);
    setForm({
      email_id: u.email_id,
      password: "",
      role: u.role,
    });
    setShowPassword(false);
    setFormError("");
    setOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.email_id.trim()) { setFormError("Email is required."); return; }
    if (!form.password.trim() && !editing) { setFormError("Password is required."); return; }
    if (!form.role) { setFormError("Role is required."); return; }

    const duplicate = admins.find(
      (a) => a.email_id.toLowerCase() === form.email_id.toLowerCase() && a.user_id !== editing?.user_id
    );
    if (duplicate) { setFormError("An admin with this email already exists."); return; }

    setSaving(true);
    try {
      if (editing) {
        await updateAdmin(editing.user_id, {
          email_id: form.email_id,
          password: form.password || undefined,
          role: form.role,
          created_by: user?.email_id || "admin",
        });
        toast("Access updated.", "success");
      } else {
        await createAdmin({
          email_id: form.email_id,
          password: form.password,
          role: form.role,
          created_by: user?.email_id || "admin",
        });
        toast("Access granted.", "success");
      }
      setOpen(false);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Operation failed.";
      setFormError(msg);
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const rows = admins.map((a) => [
    a.email_id,
    <span className="orphanStatusBadge semi">{a.role}</span>,
    new Date(a.created_at).toLocaleDateString(),
    <div className="actions student-actions" style={{ justifyContent: "center" }}>
      <Button
        size="sm"
        variant="outline"
        className="iconBtn editActionButton"
        onClick={() => startEdit(a)}
        title="Edit Admin"
        aria-label={`Edit ${a.email_id}`}
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
        onClick={() => setRevoke(a)}
        title="Delete Admin"
        aria-label={`Delete ${a.email_id}`}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
    </div>,
  ]);

  return (
    <div className="admin-access-page student-list-page">
      <PageHeader
        title="Admin Access"
        subtitle="Manage system users and permissions"
        actions={<Button className="btnGreen" onClick={startAdd}><svg
              width="16"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>Add Admin</Button>}
      />
      <div className="student-stats-grid sponsor-stats-grid">
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Total Admins</div>
            <div className="stat-card-value">{adminCount}</div>
            <div className="stat-card-note">Users with admin privileges</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
      </div>
      <DataTable
        columns={[
          { key: "e", label: "Email" },
          { key: "r", label: "Role" },
          { key: "a", label: "Created On" },
          { key: "x", label: "Actions" },
        ]}
        rows={rows}
        rowClassName="studentTableRow"
      />
      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit Admin" : "Grant Access"}
        width={760}
        footer={
          <>
            <Button className="btnRed" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="btnGreen"
              disabled={saving}
              onClick={() =>
                document.getElementById("admin-form-submit")?.click()
              }
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Grant Access"}
            </Button>
          </>
        }
      >
        <form id="admin-form" className="adminModalForm studentWizardForm" onSubmit={submit}>
          <div className="formGrid adminFormGrid student-form-grid">
            <div className="field formField has-default">
              <input
                required
                className="input"
                type="email"
                value={form.email_id}
                onChange={(e) => setForm({ ...form, email_id: e.target.value })}
                placeholder="Email"
              />
            </div>
            <div className="field formField has-default">
              <div className="passwordField">
                <input
                  required={!editing}
                  className="input passwordInput"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                />
                {form.password && (
                  <button
                    type="button"
                    className="passwordToggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                )}
              </div>
            </div>
              <SponsorSelect
                fieldKey={"role" as any}
                label="Role *"
                placeholder="Role"
                value={form.role}
                onChange={(v) => setForm({ ...form, role: v as User["role"] })}
                options={["Admin", "Volunteer"]}
              />
          </div>
          {formError && <div className="adminFormError">{formError}</div>}
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
        message={`Revoke access for ${revoke?.email_id}?`}
        confirmLabel="Yes, Revoke Access"
      />
    </div>
  );
}
