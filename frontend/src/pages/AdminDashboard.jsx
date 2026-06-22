import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const TABS = [
  { id: "disputes", label: "Disputes", icon: "⚖️" },
  { id: "audit", label: "Audit Logs", icon: "📋" },
  { id: "metrics", label: "System Metrics", icon: "📊" },
  { id: "users", label: "Users", icon: "👥" },
];

function SkeletonCard() {
  return <div className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />;
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-black text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 mb-6">
      <p className="text-sm text-red-400 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-xs font-black hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function DisputesTab() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({
    adminDecision: "",
    outcome: "RELEASE_TO_OWNER",
    ownerPercentage: 50,
    borrowerPercentage: 50,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/admin/disputes");
      setDisputes(res.data.disputes || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load disputes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const selected = disputes.find((d) => d._id === selectedId);
  const splitSum = Number(form.ownerPercentage) + Number(form.borrowerPercentage);
  const splitValid = form.outcome !== "SPLIT" || splitSum === 100;

  const handleResolve = async (e) => {
    e.preventDefault();
    setFormError("");
    if (form.adminDecision.trim().length < 10) {
      setFormError("Resolution reason must be at least 10 characters.");
      return;
    }
    if (!splitValid) {
      setFormError("Owner and borrower percentages must sum to exactly 100.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        adminDecision: form.adminDecision.trim(),
        outcome: form.outcome,
      };
      if (form.outcome === "SPLIT") {
        body.ownerPercentage = Number(form.ownerPercentage);
        body.borrowerPercentage = Number(form.borrowerPercentage);
      }
      await API.post(`/admin/disputes/${selectedId}/resolve`, body);
      setSelectedId(null);
      setForm({ adminDecision: "", outcome: "RELEASE_TO_OWNER", ownerPercentage: 50, borrowerPercentage: 50 });
      await loadDisputes();
    } catch (err) {
      setFormError(err.response?.data?.msg || "Failed to resolve dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onRetry={loadDisputes} />;

  if (!disputes.length) {
    return <EmptyState icon="✅" title="No open disputes" subtitle="All escrow disputes have been resolved." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        {disputes.map((d) => (
          <button
            key={d._id}
            onClick={() => setSelectedId(d._id)}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${
              selectedId === d._id
                ? "border-indigo-500/50 bg-indigo-500/10"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-sm text-white">{d.product?.title || "Unknown product"}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {d.borrower?.name} vs {d.owner?.name}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {d.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{d.disputeReason || d.damageReport || "No reason provided"}</p>
            <p className="text-xs text-emerald-400 mt-2 font-bold">Held: ₹{d.totalPaid?.toLocaleString()}</p>
          </button>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        {!selected ? (
          <EmptyState icon="👈" title="Select a dispute" subtitle="Choose a disputed transaction to review and resolve." />
        ) : (
          <form onSubmit={handleResolve} className="space-y-4">
            <h3 className="text-lg font-black text-white">Resolve Dispute</h3>
            <p className="text-xs text-slate-500">
              Product: <span className="text-slate-300">{selected.product?.title}</span>
            </p>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">Outcome</label>
              <select
                value={form.outcome}
                onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
              >
                <option value="RELEASE_TO_OWNER">Release to Owner</option>
                <option value="REFUND_BORROWER">Refund Borrower</option>
                <option value="SPLIT">Split Payout</option>
              </select>
            </div>

            {form.outcome === "SPLIT" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Owner %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.ownerPercentage}
                    onChange={(e) => setForm((f) => ({ ...f, ownerPercentage: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Borrower %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.borrowerPercentage}
                    onChange={(e) => setForm((f) => ({ ...f, borrowerPercentage: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                  />
                </div>
                <p className={`col-span-2 text-xs font-bold ${splitValid ? "text-emerald-400" : "text-red-400"}`}>
                  Total: {splitSum}% {splitValid ? "✓" : "(must equal 100%)"}
                </p>
                {selected.totalPaid && (
                  <p className="col-span-2 text-xs text-slate-500">
                    Owner payout: ₹{((Number(form.ownerPercentage) / 100) * selected.totalPaid).toFixed(2)} · Borrower refund: ₹
                    {((Number(form.borrowerPercentage) / 100) * selected.totalPaid).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">Resolution Reason (min 10 chars)</label>
              <textarea
                value={form.adminDecision}
                onChange={(e) => setForm((f) => ({ ...f, adminDecision: e.target.value }))}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white resize-none"
                placeholder="Explain the resolution decision..."
              />
            </div>

            {formError && <p className="text-xs text-red-400 font-medium">{formError}</p>}

            <button
              type="submit"
              disabled={submitting || !splitValid}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Resolving..." : "Resolve Dispute"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (actionType) params.actionType = actionType;
      const res = await API.get("/admin/audit-logs", { params });
      setLogs(res.data.logs || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionType]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search summaries..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <select
          value={actionType}
          onChange={(e) => { setActionType(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
        >
          <option value="">All action types</option>
          <option value="DISPUTE_RESOLVED">DISPUTE_RESOLVED</option>
          <option value="DISPUTE_RESOLUTION_FAILED">DISPUTE_RESOLUTION_FAILED</option>
          <option value="INVALID_SPLIT_REQUEST">INVALID_SPLIT_REQUEST</option>
          <option value="UNAUTHORIZED_ADMIN_ACCESS">UNAUTHORIZED_ADMIN_ACCESS</option>
          <option value="METRICS_QUERY_FAILURE">METRICS_QUERY_FAILURE</option>
        </select>
        <button onClick={loadLogs} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black hover:bg-slate-700">
          Refresh
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadLogs} />}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : !logs.length ? (
        <EmptyState icon="📋" title="No audit logs" subtitle="Administrative actions will appear here." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-black">Time</th>
                  <th className="text-left px-4 py-3 font-black">Actor</th>
                  <th className="text-left px-4 py-3 font-black">Action</th>
                  <th className="text-left px-4 py-3 font-black">Target</th>
                  <th className="text-left px-4 py-3 font-black">Summary</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-t border-slate-800/60 hover:bg-slate-900/40">
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{log.actor?.name || "System"}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-slate-800 text-indigo-400">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{log.targetType}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-black disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-black disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricsTab() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/admin/metrics");
      setMetrics(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onRetry={loadMetrics} />;

  const cards = [
    { label: "Total Users", value: metrics.totalUsers, icon: "👥", color: "text-indigo-400" },
    { label: "Active Listings", value: metrics.activeListings, icon: "📦", color: "text-emerald-400" },
    { label: "Active Rentals", value: metrics.activeRentals, icon: "🔄", color: "text-amber-400" },
    { label: "Settled Rentals", value: metrics.settledRentals, icon: "✅", color: "text-blue-400" },
    { label: "Disputed Transactions", value: metrics.disputedTransactions, icon: "⚠️", color: "text-red-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{card.icon}</span>
            <span className={`text-3xl font-black ${card.color}`}>{card.value?.toLocaleString()}</span>
          </div>
          <p className="text-xs font-black uppercase text-slate-500 tracking-wider">{card.label}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      const res = await API.get("/admin/users", { params });
      setUsers(res.data.users || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <button onClick={loadUsers} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black hover:bg-slate-700">
          Search
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadUsers} />}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : !users.length ? (
        <EmptyState icon="👥" title="No users found" subtitle="Try adjusting your search query." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-black">Name</th>
                  <th className="text-left px-4 py-3 font-black">Email</th>
                  <th className="text-left px-4 py-3 font-black">Role</th>
                  <th className="text-left px-4 py-3 font-black">Reputation</th>
                  <th className="text-left px-4 py-3 font-black">Registered</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-800/60 hover:bg-slate-900/40">
                    <td className="px-4 py-3 text-white font-bold">{user.name}</td>
                    <td className="px-4 py-3 text-slate-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                          user.role === "ADMIN"
                            ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{user.reputationScore ?? 100}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-black disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-black disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("disputes");
  const isNight = localStorage.getItem("theme") === "night";

  return (
    <div className={`min-h-screen ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-sm text-slate-500 mt-1">Platform oversight, dispute resolution, and audit history</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs font-black hover:bg-slate-800 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 p-1.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          {activeTab === "disputes" && <DisputesTab />}
          {activeTab === "audit" && <AuditTab />}
          {activeTab === "metrics" && <MetricsTab />}
          {activeTab === "users" && <UsersTab />}
        </div>
      </div>
    </div>
  );
}
