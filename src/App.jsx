import React from "react";
import { FormProvider, useFormContext } from "./context/FormContext";
import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import ProgressStepper from "./components/ProgressStepper";
import StepCoupleDetails from "./components/StepCoupleDetails";
import StepWeddingDetails from "./components/StepWeddingDetails";
import StepEvents from "./components/StepEvents";
import StepPackagePricing from "./components/StepPackagePricing";
import StepReview from "./components/StepReview";
import SuccessModal from "./components/SuccessModal";
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";

function FormContent() {
  const { step, nextStep, prevStep, isSubmitted } = useFormContext();

  if (isSubmitted) {
    return <SuccessModal />;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-20">
      <HeroBanner />
      <ProgressStepper />

      {/* Main Glassmorphic Form Card */}
      <div className="card-luxury rounded-3xl p-5 sm:p-8 relative">
        {step === 1 && <StepCoupleDetails />}
        {step === 2 && <StepWeddingDetails />}
        {step === 3 && <StepEvents />}
        {step === 4 && <StepPackagePricing />}
        {step === 5 && <StepReview />}

        {/* Step Navigation Controls (Steps 1 to 4) */}
        {step < 5 && (
          <div className="mt-8 pt-5 border-t border-[#EEDEB3]/50 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-[#EEDEB3] bg-white text-xs font-semibold text-[#25201A] hover:bg-[#FAF0D7] transition-all"
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
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              <span>{step === 4 ? "Proceed to Review" : "Next Step"}</span>
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

export default function App() {
  return (
    <FormProvider>
      <div className="min-h-screen bg-wedding-pattern flex flex-col justify-between">
        <Header />
        <FormContent />
      </div>
    </FormProvider>
  );
}
