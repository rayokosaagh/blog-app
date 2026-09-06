"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { Users as UsersIcon, Search, ChevronDown, CheckCircle2, Plus } from "lucide-react";
import { EmptyStateRow } from "@/components/ui/EmptyState";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import { useFileDrop } from "@/components/dashboard/useFileDrop";

type Role = "ADMIN" | "EDITOR";
type ActionType = "added" | "updated" | "deleted" | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
  createdAt: string;
  _count: { posts: number };
}

export default function UsersPage() {
  const { data: session, update: updateSession } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EDITOR" as Role,
    image: "",
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [successAction, setSuccessAction] = useState<ActionType>(null);
  const [successName, setSuccessName] = useState("");

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || "Failed to load users");
        return;
      }
      setUsers(data);
      setFetchError("");
    } catch {
      setFetchError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  function openAddModal() {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "EDITOR", image: "" });
    setError("");
    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      image: user.image ?? "",
    });
    setError("");
    setShowModal(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar(file);
    e.target.value = "";
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const avatarDrop = useFileDrop({
    onFiles: (files) => uploadAvatar(files[0]),
    disabled: uploading,
    onReject: setError,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!editingUser && !form.password.trim()) {
      setError("Password is required");
      setSaving(false);
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          image: form.image || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      const action: ActionType = editingUser ? "updated" : "added";
      setSuccessName(form.name);
      setShowModal(false);
      await fetchUsers();
      setSuccessAction(action);
      setTimeout(() => setSuccessAction(null), 1800);

      if (editingUser && session?.user?.id === editingUser.id) {
        await updateSession({ image: form.image || null });
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal(user: User) {
    setUserToDelete({ id: user.id, name: user.name });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete user");
        return;
      }
      setSuccessName(userToDelete.name);
      await fetchUsers();
      setSuccessAction("deleted");
      setTimeout(() => setSuccessAction(null), 1800);
    } catch {
      setError("Failed to delete user");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  }

  function Avatar({ user, size = "sm" }: { user: User; size?: "sm" | "lg" }) {
    const dim = size === "lg" ? "w-20 h-20 text-2xl" : "w-8 h-8 text-sm";
    if (user.image) {
      return (
        <img
          src={user.image}
          alt={user.name}
          className={`${dim} rounded-full object-cover ring-2 ring-white dark:ring-zinc-900 transition-transform group-hover:scale-110`}
        />
      );
    }
    return (
      <div className={`${dim} rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold transition-transform group-hover:scale-110`}>
        {user.name?.charAt(0).toUpperCase()}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Users
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add user</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative sm:w-52" ref={dropdownRef}>
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 flex justify-between items-center hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <span>
              {roleFilter === "ALL" && "All roles"}
              {roleFilter === "ADMIN" && "Admin only"}
              {roleFilter === "EDITOR" && "Editor only"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-full bg-white dark:bg-zinc-800 rounded-xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-700 py-1.5 z-50">
              {[
                { value: "ALL", label: "All roles" },
                { value: "ADMIN", label: "Admin only" },
                { value: "EDITOR", label: "Editor only" },
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setRoleFilter(option.value as "ALL" | Role);
                    setShowRoleDropdown(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    roleFilter === option.value
                      ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
          {fetchError}
        </div>
      )}

      {successAction && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>
            <strong>{successName}</strong>{" "}
            {successAction === "added" && "has been added."}
            {successAction === "updated" && "has been updated."}
            {successAction === "deleted" && "has been deleted."}
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">User</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Email</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Role</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Posts</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Joined</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <EmptyStateRow
                  colSpan={6}
                  icon={UsersIcon}
                  title={users.length === 0 ? "No users yet" : "No users match your filters"}
                  description={
                    users.length === 0
                      ? "Accounts with dashboard access will be listed here."
                      : "Try a different role filter or search term."
                  }
                />
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{user.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${
                          user.role === "ADMIN"
                            ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400">{user._count.posts} posts</td>
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(user.createdAt).toDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteModal && !!userToDelete}
        title="Delete user?"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-zinc-700 dark:text-zinc-300">{userToDelete?.name}</strong>?
          </>
        }
        onConfirm={confirmDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? "Edit user" : "Add new user"}
      >
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Profile photo</label>
                  <div className="flex items-center gap-4">
                    <div
                      {...avatarDrop.dropProps}
                      title="Drop an image here to set the photo"
                      className={`w-16 h-16 rounded-full overflow-hidden bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 transition-all ${
                        avatarDrop.isDragging
                          ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900"
                          : ""
                      }`}
                    >
                      {form.image ? (
                        <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xl">
                          {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        <span>{uploading ? "Uploading..." : form.image ? "Change photo" : "Upload photo"}</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </label>
                      {form.image && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                          className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-left"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Password{" "}
                    {editingUser && (
                      <span className="text-zinc-400 dark:text-zinc-500 normal-case font-normal">
                        (leave blank to keep current)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                    className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70"
                  >
                    {saving ? "Saving..." : editingUser ? "Save changes" : "Add user"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
      </Modal>
    </div>
  );
}