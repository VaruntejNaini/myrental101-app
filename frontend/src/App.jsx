import React, { useEffect } from "react";
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
import MyOrders from "./pages/MyOrders";
import ProductDetailPage from "./pages/ProductDetailPage";
import AddressManagement from "./pages/AddressManagement";
import MyListings from "./pages/MyListings";
import DesktopChatbox from "./components/DesktopChatbox";
import RentCheckout from "./pages/RentCheckout";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import BlockedPage from "./pages/BlockedPage";
import { connectSocket, disconnectSocket, getSocket, reconnectSocketWithAuth } from "./services/socket";
import { STORAGE_KEYS } from "./constants/auth";

function App() {
  useEffect(() => {
    const isNight = localStorage.getItem("theme") === "night";
    if (isNight) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }

    // ── Global socket connection for authenticated users ──────────────────
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      connectSocket();
    }

    const handleAuthChange = () => {
      const newToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (newToken) {
        reconnectSocketWithAuth();
      } else {
        disconnectSocket();
      }
    };

    window.addEventListener("authStateChanged", handleAuthChange);

    // ── Global unread count updates from socket ──────────────────────────
    const socket = getSocket();
    const handleUnreadCountUpdated = () => {
      window.dispatchEvent(new Event("refreshUnreadChatCount"));
    };

    if (socket) {
      socket.on("chat:unread_count_updated", handleUnreadCountUpdated);
    }

    return () => {
      disconnectSocket();
      window.removeEventListener("authStateChanged", handleAuthChange);
      if (socket) {
        socket.off("chat:unread_count_updated", handleUnreadCountUpdated);
      }
    };
  }, []);

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
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/addresses" element={<AddressManagement />} />
        <Route path="/rent-catalog" element={<RentCatalogPage />} />
        <Route path="/second-hand-catalog" element={<SecondHandCatalogPage />} />
        <Route path="/requested-catalog" element={<RequestedCatalogPage />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/rent/checkout/:id" element={<RentCheckout />} />
        <Route path="/blocked" element={<BlockedPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DesktopChatbox />
    </BrowserRouter>
  );
}

export default App;

