import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api";
import { STORAGE_KEYS } from "../constants/auth";

function decodeTokenRole(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function AdminRoute({ children }) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const [status, setStatus] = useState(token ? "loading" : "guest");

  useEffect(() => {
    if (!token) {
      setStatus("guest");
      return;
    }

    const jwtRole = decodeTokenRole(token);
    if (jwtRole === "ADMIN") {
      setStatus("admin");
      return;
    }
    if (jwtRole && jwtRole !== "ADMIN") {
      setStatus("user");
      return;
    }

    API.get("/auth/me")
      .then((res) => {
        if (res.data?.role === "ADMIN") {
          setStatus("admin");
        } else {
          setStatus("user");
        }
      })
      .catch(() => setStatus("guest"));
  }, [token]);

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
