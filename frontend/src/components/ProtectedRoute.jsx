import { Navigate } from "react-router-dom";
import { STORAGE_KEYS } from "../constants/auth";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  return token ? children : <Navigate to="/" />;
}

export default ProtectedRoute;