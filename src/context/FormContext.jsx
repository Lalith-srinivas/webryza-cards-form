import React, { createContext, useContext, useState, useEffect } from "react";
import { verifyPartner } from "../services/partnerService";
import { submitRegistration } from "../services/registrationService";
import {
  validateCoupleDetails,
  validateWeddingDetails,
  validateEvent,
  validateAmount,
} from "../utils/validation";

const FormContext = createContext(null);

const INITIAL_FORM_STATE = {
  // Step 1: Template Selection
  templateId: "royal-gold",

  // Step 2: Couple Details
  brideName: "",
  groomName: "",
  brideParents: "",
  groomParents: "",
  phone: "",
  email: "",

  // Step 3: Wedding Details
  weddingDate: "",
  weddingTime: "",
  venueName: "",
  venueAddress: "",
  venueLocation: "",
  additionalDetails: "",

  // Step 4: Wedding Events
  events: [],

  // Step 5: AI Video & Package Pricing
  aiVideoRequired: false,
  amountCharged: "1500",
};

export const FormProvider = ({ children }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [partnerInfo, setPartnerInfo] = useState({
    status: "loading",
    isValid: false,
    isDirect: true,
    partnerId: "",
    partnerShopName: "Direct",
    source: "direct",
    message: "Verifying partner...",
    partnerData: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Read ?ref= query parameter on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");

    const checkPartner = async () => {
      try {
        const result = await verifyPartner(refCode);
        setPartnerInfo(result);
      } catch (err) {
        console.error("Failed to verify partner:", err);
        setPartnerInfo({
          status: "error",
          isValid: false,
          isDirect: true,
          partnerId: "",
          partnerShopName: "Direct",
          source: "direct",
          message: "Unable to verify partner code. Defaulting to direct registration.",
          partnerData: null,
        });
      }
    };

    checkPartner();
  }, []);

  // Update a single form field
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for that field as user types
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Event handlers for Step 4
  const addEvent = (newEvent) => {
    setFormData((prev) => ({
      ...prev,
      events: [...prev.events, { ...newEvent, id: Date.now().toString() }],
    }));
  };

  const updateEvent = (id, updatedFields) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.map((ev) => (ev.id === id ? { ...ev, ...updatedFields } : ev)),
    }));
  };

  const removeEvent = (id) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.filter((ev) => ev.id !== id),
    }));
  };

  // Step Validation logic
  const validateCurrentStep = (stepNumber = step) => {
    let stepErrors = {};

    if (stepNumber === 1) {
      if (!formData.templateId) {
        stepErrors.templateId = "Please choose a wedding template to proceed";
      }
    } else if (stepNumber === 2) {
      stepErrors = validateCoupleDetails(formData);
    } else if (stepNumber === 3) {
      stepErrors = validateWeddingDetails(formData);
    } else if (stepNumber === 4) {
      // Events are optional to add, but if any event has empty required fields, flag it
      formData.events.forEach((ev, idx) => {
        const evErr = validateEvent(ev);
        if (Object.keys(evErr).length > 0) {
          stepErrors[`event_${idx}`] = evErr;
        }
      });
    } else if (stepNumber === 5) {
      // Package and amount
      const amtErr = validateAmount(formData.amountCharged);
      if (amtErr) {
        stepErrors.amountCharged = amtErr;
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Navigation handlers
  const nextStep = () => {
    if (validateCurrentStep(step)) {
      setStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (targetStep) => {
    if (targetStep < step) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (validateCurrentStep(step)) {
        setStep(targetStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Form submission (Step 6 -> Step 7 Generating -> Step 8 Result)
  const submitForm = async () => {
    // Validate all steps
    const coupleErrors = validateCoupleDetails(formData);
    const weddingErrors = validateWeddingDetails(formData);
    const amountError = validateAmount(formData.amountCharged);

    const allErrors = {
      ...coupleErrors,
      ...weddingErrors,
    };
    if (amountError) allErrors.amountCharged = amountError;
    if (!formData.templateId) allErrors.templateId = "Please choose a wedding template.";

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setSubmissionError("Please review and fix highlighted fields before generating your website.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await submitRegistration(formData, partnerInfo);
      setSubmissionResult(result);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmissionError(err.message || "Failed to generate wedding website. Your entered details have been saved, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setIsSubmitted(false);
    setSubmissionResult(null);
    setSubmissionError(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <FormContext.Provider
      value={{
        step,
        formData,
        errors,
        partnerInfo,
        isSubmitting,
        submissionError,
        submissionResult,
        isSubmitted,
        updateField,
        addEvent,
        updateEvent,
        removeEvent,
        validateCurrentStep,
        nextStep,
        prevStep,
        goToStep,
        submitForm,
        resetForm,
        setPartnerInfo,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};
