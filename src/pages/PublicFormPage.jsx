import React from "react";
import { FormProvider, useFormContext } from "../context/FormContext";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import ProgressStepper from "../components/ProgressStepper";
import StepTemplateSelection from "../components/StepTemplateSelection";
import StepCoupleDetails from "../components/StepCoupleDetails";
import StepWeddingDetails from "../components/StepWeddingDetails";
import StepEvents from "../components/StepEvents";
import StepPackagePricing from "../components/StepPackagePricing";
import StepPayment from "../components/StepPayment";
import StepReview from "../components/StepReview";
import SuccessModal from "../components/SuccessModal";
import PartnerLoginFloatingButton from "../components/PartnerLoginFloatingButton";
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck, Loader2 } from "lucide-react";

function FormContent() {
  const { step, nextStep, prevStep, isSubmitted, isSubmitting } = useFormContext();

  if (isSubmitted) {
    return <SuccessModal />;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-20 relative">
      <HeroBanner />
      <ProgressStepper />

      {/* Main Glassmorphic Form Card */}
      <div className="card-luxury rounded-3xl p-5 sm:p-8 relative">
        {/* Step 7: Generating Overlay when form is being submitted */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-3xl z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#FAF0D7] border-2 border-[#D4AF37] flex items-center justify-center text-[#93611D] mb-4 shadow-md animate-pulse">
              <Sparkles size={32} className="animate-spin text-[#C9972C]" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#25201A]">
              Creating Your Wedding Website...
            </h3>
            <p className="text-xs text-[#665C51] mt-2 max-w-sm">
              Allocating your unique wedding ID, configuring your template, and preparing your live invitation link and QR code.
            </p>
            <div className="mt-6 flex items-center space-x-2 text-xs font-semibold text-[#8B6E32]">
              <Loader2 size={16} className="animate-spin" />
              <span>Step 7: Publishing Live Website</span>
            </div>
          </div>
        )}

        {/* 7 Steps Form Workflow */}
        {step === 1 && <StepTemplateSelection />}
        {step === 2 && <StepCoupleDetails />}
        {step === 3 && <StepWeddingDetails />}
        {step === 4 && <StepEvents />}
        {step === 5 && <StepPackagePricing />}
        {step === 6 && <StepPayment />}
        {step === 7 && <StepReview />}

        {/* Step Navigation Controls (Steps 1 to 6) */}
        {step < 7 && (
          <div className="mt-8 pt-5 border-t border-[#EEDEB3]/50 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-[#EEDEB3] bg-white text-xs font-semibold text-[#25201A] hover:bg-[#FAF0D7] transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>
                {step === 1
                  ? "Continue with Selected Template"
                  : step === 5
                  ? "Proceed to UPI Payment"
                  : step === 6
                  ? "Proceed to Final Review"
                  : "Next Step"}
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Trust Badges Footer */}
      <div className="mt-8 text-center text-xs text-[#8B6E32] space-y-2">
        <div className="flex items-center justify-center space-x-4">
          <span className="inline-flex items-center space-x-1">
            <ShieldCheck size={14} className="text-[#93611D]" />
            <span>Secure WebRyza Firestore</span>
          </span>
          <span>•</span>
          <span className="inline-flex items-center space-x-1">
            <Sparkles size={14} className="text-[#93611D]" />
            <span>Premium Handcrafted Invitations</span>
          </span>
        </div>
        <p className="text-[11px] text-[#A39788]">
          © {new Date().getFullYear()} WebRyza. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default function PublicFormPage() {
  return (
    <FormProvider>
      <div className="min-h-screen bg-wedding-pattern flex flex-col justify-between relative">
        <Header />
        <FormContent />
        {/* Floating Partner Login Button at bottom-right */}
        <PartnerLoginFloatingButton />
      </div>
    </FormProvider>
  );
}
