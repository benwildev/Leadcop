import React, { useState, useEffect } from "react";
import { UserPlus, Settings, AlertTriangle, Loader2 } from "lucide-react";

export function TeamTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowedSubUsers, setAllowedSubUsers] = useState<number>(0);
  
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");

  const fetchTeam = () => {
    fetch("/api/user/team", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load team");
        return res.json();
      })
      .then(data => {
        setMembers(data.members || []);
        setAllowedSubUsers(data.allowedSubUsers || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);

    try {
      const res = await fetch("/api/user/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, password: invitePassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite user");

      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      fetchTeam();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    
    try {
      const res = await fetch(`/api/user/team/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to remove user");
      fetchTeam();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Team Management</h2>
        <p className="mt-2 text-sm text-slate-500">
          Invite members to share your current subscription plan and API limits.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {allowedSubUsers !== -1 && members.length >= allowedSubUsers ? (
        <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg shrink-0">
            <UserPlus className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Seat Limit Reached</h3>
            <p className="text-sm text-amber-700 mt-1">
              Your current plan allows {allowedSubUsers + 1} total seats, which means you can invite {allowedSubUsers} sub-user(s). You have reached this limit.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleInvite} className="p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="text-sm font-semibold mb-4">Invite New Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email address"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Assign a Password (min 8 chars)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={invitePassword}
              onChange={e => setInvitePassword(e.target.value)}
              min={8}
              required
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={inviting}
              className="px-4 py-2 bg-[#584d84] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {inviting ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Added On</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                  No team members added yet.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{m.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
