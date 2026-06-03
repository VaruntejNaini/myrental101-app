import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/LandingPage";
import VerifyOtp from "./pages/verifyotp";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import SavedPage from "./pages/SavedPage";
import RentCatalogPage from "./pages/RentCatalogPage";
import SecondHandCatalogPage from "./pages/SecondHandCatalogPage";
import RequestedCatalogPage from "./pages/RequestedCatalogPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verifyotp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/rent-catalog" element={<RentCatalogPage />} />
        <Route path="/second-hand-catalog" element={<SecondHandCatalogPage />} />
        <Route path="/requested-catalog" element={<RequestedCatalogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

