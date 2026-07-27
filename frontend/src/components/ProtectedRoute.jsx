import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | authed | guest

  useEffect(() => {
    let cancelled = false;
    API.get("/auth/me")
      .then(() => { if (!cancelled) setStatus("authed"); })
      .catch(() => { if (!cancelled) setStatus("guest"); });
    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return null;
  }
  return status === "authed" ? children : <Navigate to="/" />;
}

export default ProtectedRoute;
