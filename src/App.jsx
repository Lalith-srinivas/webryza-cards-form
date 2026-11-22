import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PartnerAuthProvider } from "./context/PartnerAuthContext";
import PublicFormPage from "./pages/PublicFormPage";
import PartnerLoginPage from "./pages/PartnerLoginPage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import TemplatePreviewPage from "./pages/TemplatePreviewPage";
import PublicInvitationPage from "./pages/PublicInvitationPage";

export default function App() {
  return (
    <PartnerAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Wedding Registration & Generation Form */}
          <Route path="/" element={<PublicFormPage />} />

          {/* Public Dynamic Wedding Invitation URLs (e.g., https://cards.webryza.in/card=0001) */}
          <Route path="/card=:cardId" element={<PublicInvitationPage />} />
          <Route path="/card/:cardId" element={<PublicInvitationPage />} />
          <Route path="/card" element={<PublicInvitationPage />} />

          {/* Wedding Invitation Template Previews */}
          <Route path="/templates/royal-gold" element={<TemplatePreviewPage initialTemplate="royal-gold" />} />
          <Route path="/templates/temple-heritage" element={<TemplatePreviewPage initialTemplate="temple-heritage" />} />
          <Route path="/templates/vishu-kavya" element={<TemplatePreviewPage initialTemplate="temple-heritage" />} />
          <Route path="/templates/elegant-pastel" element={<TemplatePreviewPage initialTemplate="elegant-pastel" />} />
          <Route path="/templates/elegant-pastel-romance" element={<TemplatePreviewPage initialTemplate="elegant-pastel" />} />
          <Route path="/templates/pastel-romance" element={<TemplatePreviewPage initialTemplate="elegant-pastel" />} />
          <Route path="/templates/lake-como-letters" element={<TemplatePreviewPage initialTemplate="lake-como-letters" />} />
          <Route path="/templates/lakecomo-letters" element={<TemplatePreviewPage initialTemplate="lake-como-letters" />} />
          <Route path="/templates/lake-como" element={<TemplatePreviewPage initialTemplate="lake-como-letters" />} />
          <Route path="/preview" element={<TemplatePreviewPage />} />

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
