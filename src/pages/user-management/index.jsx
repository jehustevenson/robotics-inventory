// src/pages/user-management/index.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchUsers,
  createUserThunk,
  updateUserThunk,
  deleteUserThunk,
  clearUsersError,
} from "../../store/usersSlice";
import TabNavigation from "components/ui/TabNavigation";
import LoadingIndicator from "components/ui/LoadingIndicator";
import Icon from "components/AppIcon";
import Input from "components/ui/Input";
import Select from "components/ui/Select";
import Button from "components/ui/Button";

const ROLE_OPTIONS = [
  { value: "user",  label: "Teacher (user)" },
  { value: "admin", label: "Admin" },
];

const EMPTY_NEW = { username: "", password: "", role: "user" };

const UserManagement = () => {
  const dispatch = useDispatch();
  const { items: users, loading, actionLoading, error } = useSelector((s) => s.users);
  const { username: myUsername } = useSelector((s) => s.auth);

  const [newUser,   setNewUser]   = useState(EMPTY_NEW);
  const [formErrs,  setFormErrs]  = useState({});
  const [toast,     setToast]     = useState(null);

  // Per-row "reset password" state
  const [resetFor,  setResetFor]  = useState(null);    // user id
  const [resetPw,   setResetPw]   = useState("");

  // Confirm delete
  const [deleteFor, setDeleteFor] = useState(null);    // user object

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearUsersError());
    }
  }, [error, dispatch]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Handlers ────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!newUser.username.trim())  errs.username = "Username required.";
    if (!newUser.password)         errs.password = "Password required.";
    else if (newUser.password.length < 6) errs.password = "At least 6 characters.";
    if (!newUser.role)             errs.role = "Role required.";
    setFormErrs(errs);
    if (Object.keys(errs).length) return;

    const res = await dispatch(createUserThunk({
      username: newUser.username.trim(),
      password: newUser.password,
      role:     newUser.role,
    }));
    if (!res.error) {
      showToast(`User "${newUser.username.trim()}" created.`);
      setNewUser(EMPTY_NEW);
      setFormErrs({});
    }
  };

  const handleRoleChange = async (user, role) => {
    if (role === user.role) return;
    const res = await dispatch(updateUserThunk({ id: user.id, role }));
    if (!res.error) showToast(`"${user.username}" is now ${role}.`);
  };

  const handlePasswordReset = async (user) => {
    if (!resetPw || resetPw.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    const res = await dispatch(updateUserThunk({ id: user.id, password: resetPw }));
    if (!res.error) {
      showToast(`Password reset for "${user.username}".`);
      setResetFor(null);
      setResetPw("");
    }
  };

  const handleDelete = async (user) => {
    const res = await dispatch(deleteUserThunk(user.id));
    if (!res.error) {
      showToast(`User "${user.username}" deleted.`, "error");
      setDeleteFor(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <TabNavigation />
      <LoadingIndicator isLoading={loading || actionLoading} bar />

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium"
          style={{
            background: toast.type === "error" ? "var(--color-error)" : "var(--color-success)",
            color: "#fff", fontFamily: "var(--font-caption)", maxWidth: 320,
          }}
        >
          <Icon name={toast.type === "error" ? "AlertCircle" : "CheckCircle"} size={16} color="#fff" />
          {toast.message}
        </div>
      )}

      <main className="px-4 md:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-primary)" }}>
              <Icon name="Users" size={18} color="#fff" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
              User Management
            </h1>
          </div>
          <p className="text-sm md:text-base ml-12" style={{ color: "var(--color-muted-foreground)" }}>
            Add, remove, and manage teacher and admin accounts.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Users list */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl p-4 md:p-5"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-md)" }}>
              <h2 className="text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
                Existing Users ({users.length})
              </h2>

              {loading && users.length === 0 ? (
                <LoadingIndicator isLoading message="Loading users…" />
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Icon name="Users" size={40} color="var(--color-muted-foreground)" />
                  <p className="mt-3 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    No users yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => {
                    const isSelf = u.username === myUsername;
                    return (
                      <div key={u.id} className="rounded-lg p-3 md:p-4"
                        style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: u.role === "admin" ? "rgba(33,82,33,0.12)" : "rgba(45,90,61,0.10)" }}>
                              <Icon name={u.role === "admin" ? "ShieldCheck" : "User"} size={16} color="var(--color-primary)" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>
                                  {u.username}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                                {u.role === "admin" ? "Admin" : "Teacher"}
                                {u.createdAt && ` · added ${new Date(u.createdAt).toLocaleDateString()}`}
                              </span>
                            </div>
                          </div>

                          {/* Role select + actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="min-w-[150px]">
                              <Select
                                options={ROLE_OPTIONS}
                                value={u.role}
                                onChange={(val) => handleRoleChange(u, val)}
                                disabled={isSelf || actionLoading}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              iconName="KeyRound"
                              iconPosition="left"
                              onClick={() => { setResetFor(u.id); setResetPw(""); }}
                              disabled={actionLoading}
                            >
                              Reset
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              iconName="Trash2"
                              iconPosition="left"
                              onClick={() => setDeleteFor(u)}
                              disabled={isSelf || actionLoading}
                              title={isSelf ? "You can't delete your own account." : "Delete user"}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Inline reset-password row */}
                        {resetFor === u.id && (
                          <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-end">
                            <div className="flex-1">
                              <Input
                                label="New password"
                                type="password"
                                value={resetPw}
                                onChange={(e) => setResetPw(e.target.value)}
                                placeholder="At least 6 characters"
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="default" size="sm" onClick={() => handlePasswordReset(u)} disabled={actionLoading}>
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setResetFor(null); setResetPw(""); }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Inline delete confirmation */}
                        {deleteFor?.id === u.id && (
                          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded"
                            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
                            <span className="text-sm flex-1" style={{ color: "var(--color-error)" }}>
                              Delete <strong>{u.username}</strong>? This cannot be undone.
                            </span>
                            <div className="flex gap-2">
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(u)} disabled={actionLoading}>
                                Yes, delete
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setDeleteFor(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add user */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="rounded-xl p-5"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-md)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(30,58,95,0.10)" }}>
                  <Icon name="UserPlus" size={16} color="var(--color-primary)" strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
                  Add New User
                </h2>
              </div>
              <form onSubmit={handleCreate} noValidate className="flex flex-col gap-4">
                <Input
                  label="Username"
                  type="text"
                  placeholder="e.g. mr-smith"
                  value={newUser.username}
                  onChange={(e) => setNewUser((f) => ({ ...f, username: e.target.value }))}
                  error={formErrs.username}
                  autoComplete="username"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))}
                  error={formErrs.password}
                  autoComplete="new-password"
                  required
                />
                <Select
                  label="Role"
                  options={ROLE_OPTIONS}
                  value={newUser.role}
                  onChange={(val) => setNewUser((f) => ({ ...f, role: val }))}
                  error={formErrs.role}
                  required
                />
                <Button type="submit" variant="default" fullWidth loading={actionLoading} iconName="UserPlus" iconPosition="left">
                  Add User
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
