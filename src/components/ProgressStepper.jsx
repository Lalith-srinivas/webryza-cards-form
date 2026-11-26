import React from "react";
import { useFormContext } from "../context/FormContext";
import { Check, Sparkles, Heart, Calendar, Music, Gift, CreditCard, ShieldCheck } from "lucide-react";

export default function ProgressStepper() {
  const { step, goToStep } = useFormContext();

  const steps = [
    { id: 1, title: "Template", icon: Sparkles },
    { id: 2, title: "Couple", icon: Heart },
    { id: 3, title: "Wedding", icon: Calendar },
    { id: 4, title: "Events", icon: Music },
    { id: 5, title: "Package", icon: Gift },
    { id: 6, title: "Payment", icon: CreditCard },
    { id: 7, title: "Review", icon: ShieldCheck },
  ];

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 mb-6">
      <div className="relative flex items-center justify-between">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-[2px] bg-[#EEDEB3]/60 -z-0">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {steps.map((s) => {
          const isDone = s.id < step;
          const isCurrent = s.id === step;
          const Icon = s.icon;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              disabled={s.id > step}
              className={`relative z-10 flex flex-col items-center group focus:outline-none transition-transform duration-200 ${
                isCurrent ? "scale-105" : ""
              } ${s.id > step ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  isDone
                    ? "bg-[#D4AF37] text-white"
                    : isCurrent
                    ? "bg-[#FAF7F2] text-[#93611D] border-2 border-[#D4AF37] ring-4 ring-[#D4AF37]/20 font-bold"
                    : "bg-white text-[#998F81] border border-[#EEDEB3]"
                }`}
              >
                {isDone ? (
                  <Check size={15} strokeWidth={2.5} />
                ) : (
                  <Icon size={15} className={isCurrent ? "text-[#93611D]" : "text-[#998F81]"} />
                )}
              </div>

              <span
                className={`mt-1.5 text-[10px] sm:text-xs font-medium tracking-tight whitespace-nowrap transition-colors duration-200 ${
                  isCurrent
                    ? "text-[#25201A] font-semibold"
                    : isDone
                    ? "text-[#8B6E32]"
                    : "text-[#998F81]"
                }`}
              >
                {s.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
