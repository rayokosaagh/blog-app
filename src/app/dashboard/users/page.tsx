"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";

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

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modals
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

  // Success
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
    if (!file) return;
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
          className={`${dim} rounded-full object-cover ring-2 ring-white transition-transform group-hover:scale-110`}
        />
      );
    }
    return (
      <div className={`${dim} rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium transition-transform group-hover:scale-110`}>
        {user.name?.charAt(0).toUpperCase()}
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading users...</p></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">
            {filteredUsers.length} of {users.length} users
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all duration-200 font-medium shadow-sm"
        >
          + Add User
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
        </div>

        <div className="sm:w-56 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="w-full border border-gray-300 rounded-3xl px-6 py-4 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-left flex items-center justify-between text-gray-900"
          >
            <span>
              {roleFilter === "ALL" && "All Roles"}
              {roleFilter === "ADMIN" && "Admin Only"}
              {roleFilter === "EDITOR" && "Editor Only"}
            </span>
            <span className={`transition-transform duration-300 ${showRoleDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>

          {showRoleDropdown && (
            <div className="absolute mt-3 w-full bg-white rounded-3xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {[
                { value: "ALL", label: "All Roles" },
                { value: "ADMIN", label: "Admin Only" },
                { value: "EDITOR", label: "Editor Only" }
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setRoleFilter(option.value as "ALL" | Role);
                    setShowRoleDropdown(false);
                  }}
                  className={`px-6 py-3.5 hover:bg-gray-100 cursor-pointer transition-colors ${
                    roleFilter === option.value ? "bg-blue-50 text-blue-700 font-medium" : ""
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successAction && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="text-xl">✅</span>
          <span>
            <strong>"{successName}"</strong>{" "}
            {successAction === "added" && "has been added successfully."}
            {successAction === "updated" && "has been updated successfully."}
            {successAction === "deleted" && "has been deleted successfully."}
          </span>
        </div>
      )}

      {/* Table with Liquid Animation */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-5 text-sm font-medium text-gray-600">User</th>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Email</th>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Role</th>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Posts</th>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Joined</th>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400">No users found</td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr 
                  key={user.id} 
                  className="group hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar user={user} />
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</p>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-gray-600">{user.email}</td>
                  <td className="p-5">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-5 text-sm text-gray-600">{user._count.posts} posts</td>
                  <td className="p-5 text-sm text-gray-600">
                    {new Date(user.createdAt).toDateString()}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-4 opacity-80 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Edit</button>
                      <button onClick={() => openDeleteModal(user)} className="text-red-600 hover:text-red-700 font-medium transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🗑️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Delete User?</h2>
              <p className="text-gray-600 text-center mt-3">
                Are you sure you want to delete <strong>"{userToDelete.name}"</strong>?
              </p>
            </div>
            <div className="border-t flex">
              <button
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                className="flex-1 py-5 text-gray-600 font-medium hover:bg-gray-100 active:scale-95 transition-all rounded-bl-3xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-5 bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all rounded-br-3xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {form.image ? (
                        <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-blue-700 font-medium text-xl">
                          {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                        <span>{uploading ? "Uploading..." : form.image ? "Change photo" : "Upload photo"}</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </label>
                      {form.image && (
                        <button type="button" onClick={() => setForm((prev) => ({ ...prev, image: "" }))} className="text-sm text-red-500 hover:text-red-700">Remove photo</button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingUser && <span className="text-gray-400">(leave blank to keep current)</span>}
                  </label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500" autoComplete="new-password" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={saving || uploading} className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-medium active:scale-[0.985] transition-all disabled:opacity-70">
                    {saving ? "Saving..." : editingUser ? "Save Changes" : "Add User"}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-2xl font-medium text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}