import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PartnerAuthProvider } from "./context/PartnerAuthContext";
import PublicFormPage from "./pages/PublicFormPage";
import PartnerLoginPage from "./pages/PartnerLoginPage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <PartnerAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Wedding Registration Form */}
          <Route path="/" element={<PublicFormPage />} />

          {/* Partner Portal Routes */}
          <Route path="/admin/login" element={<PartnerLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <PartnerDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect /admin to dashboard (will redirect to login if unauthenticated) */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PartnerAuthProvider>
  );
}
