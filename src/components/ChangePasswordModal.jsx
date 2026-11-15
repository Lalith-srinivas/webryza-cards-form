import React, { useState } from "react";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import { Lock, Eye, EyeOff, X, Check, AlertCircle, Loader2, KeyRound } from "lucide-react";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { changePassword } = usePartnerAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(newPassword);
      setSuccessMessage("Password updated successfully! You can use your new password next time you log in.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onClose();
        setSuccessMessage("");
      }, 2200);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#12100E] border border-[#39FF14]/40 rounded-3xl p-6 w-full max-w-md shadow-[0_15px_50px_rgba(0,0,0,0.85)] relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#26211C] mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] flex items-center justify-center">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#FAF7F2]">
                Change Partner Password
              </h3>
              <p className="text-[11px] text-[#A89F91]">
                Update your login credentials securely
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#A89F91] hover:text-[#FAF7F2] hover:bg-[#1C1814] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/70 border border-rose-600/70 rounded-xl text-rose-200 text-xs flex items-start space-x-2 animate-fadeIn">
            <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/70 border border-[#39FF14]/70 rounded-xl text-[#39FF14] text-xs flex items-start space-x-2 animate-fadeIn">
            <Check size={15} className="text-[#39FF14] shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-[#D8CDBF] uppercase tracking-wider mb-1.5">
              New Password <span className="text-xs text-[#7A7165] lowercase">(min 6 chars)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7165]">
                <Lock size={15} />
              </div>
              <input
                type={showNew ? "text" : "password"}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-10 py-2.5 bg-[#0A0908] border border-[#26211C] rounded-xl text-sm text-[#FAF7F2] placeholder-[#665C51] focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-[#39FF14] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A7165] hover:text-[#39FF14]"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[#D8CDBF] uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7165]">
                <Lock size={15} />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-10 py-2.5 bg-[#0A0908] border border-[#26211C] rounded-xl text-sm text-[#FAF7F2] placeholder-[#665C51] focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-[#39FF14] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A7165] hover:text-[#39FF14]"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#A89F91] hover:text-[#FAF7F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(57,255,20,0.25)] ${
                isSubmitting
                  ? "bg-[#26211C] text-[#7A7165] cursor-not-allowed"
                  : "bg-[#39FF14] text-[#0A0908] hover:bg-[#32e012]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#0A0908]" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
