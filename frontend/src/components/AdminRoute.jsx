import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api";

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    API.get("/auth/me")
      .then((res) => {
        if (cancelled) return;
        setStatus(res.data?.role === "ADMIN" ? "admin" : "user");
      })
      .catch(() => { if (!cancelled) setStatus("guest"); });
    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="animate-pulse text-sm font-bold">Verifying admin access...</div>
      </div>
    );
  }

  if (status === "guest") return <Navigate to="/login" replace />;
  if (status === "user") return <Navigate to="/dashboard" replace />;
  return children;
}
