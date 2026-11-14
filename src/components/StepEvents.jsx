import React, { useState } from "react";
import { useFormContext } from "../context/FormContext";
import {
  Music,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Navigation,
  X,
  Check,
  CalendarCheck,
} from "lucide-react";
import { validateEvent } from "../utils/validation";
import { formatDatePretty } from "../utils/formatters";

const COMMON_EVENTS = [
  "Engagement",
  "Haldi",
  "Mehendi",
  "Sangeet",
  "Wedding",
  "Reception",
  "Custom Event",
];

export default function StepEvents() {
  const { formData, addEvent, updateEvent, removeEvent } = useFormContext();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [eventForm, setEventForm] = useState({
    eventName: "",
    date: "",
    time: "",
    venueName: "",
    venueAddress: "",
    locationLink: "",
    description: "",
  });
  const [eventErrors, setEventErrors] = useState({});

  const handleOpenNew = (suggestedName = "") => {
    setEditingId(null);
    setEventForm({
      eventName: suggestedName === "Custom Event" ? "" : suggestedName,
      date: formData.weddingDate || "",
      time: "",
      venueName: formData.venueName || "",
      venueAddress: formData.venueAddress || "",
      locationLink: formData.venueLocation || "",
      description: "",
    });
    setEventErrors({});
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (event) => {
    setEditingId(event.id);
    setEventForm({
      eventName: event.eventName || "",
      date: event.date || "",
      time: event.time || "",
      venueName: event.venueName || "",
      venueAddress: event.venueAddress || "",
      locationLink: event.locationLink || "",
      description: event.description || "",
    });
    setEventErrors({});
    setIsEditorOpen(true);
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    const errors = validateEvent(eventForm);
    if (Object.keys(errors).length > 0) {
      setEventErrors(errors);
      return;
    }

    if (editingId) {
      updateEvent(editingId, eventForm);
    } else {
      addEvent(eventForm);
    }

    setIsEditorOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="border-b border-[#EEDEB3]/50 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
            <Music size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#25201A]">
              Section C: Wedding Events & Schedule
            </h2>
            <p className="text-xs text-[#665C51]">
              Add Haldi, Mehendi, Sangeet, Reception, or other celebration ceremonies
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Step 3 of 5
        </span>
      </div>

      {/* Quick Add Suggestions */}
      <div>
        <label className="block text-xs font-semibold text-[#8B6E32] uppercase tracking-wider mb-2">
          Quick-Add Event Suggestions:
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_EVENTS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleOpenNew(name)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#EEDEB3] text-xs font-medium text-[#25201A] hover:bg-[#FDF9EE] hover:border-[#D4AF37] hover:text-[#93611D] transition-all shadow-xs"
            >
              <Plus size={12} className="text-[#D4AF37]" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Added Events Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#25201A]">
            Celebration Events ({formData.events.length})
          </span>
          <button
            type="button"
            onClick={() => handleOpenNew("")}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#FAF0D7] hover:bg-[#F3E5AB] text-[#93611D] font-semibold text-xs rounded-xl transition-colors"
          >
            <Plus size={14} />
            <span>Add Event</span>
          </button>
        </div>

        {formData.events.length === 0 ? (
          <div className="border-2 border-dashed border-[#EEDEB3] rounded-2xl p-6 sm:p-8 text-center bg-white/40">
            <div className="w-12 h-12 rounded-full bg-[#FAF0D7] text-[#93611D] mx-auto flex items-center justify-center mb-2">
              <CalendarCheck size={22} />
            </div>
            <p className="text-sm font-semibold text-[#25201A]">No celebration events added yet</p>
            <p className="text-xs text-[#665C51] max-w-sm mx-auto mt-1 mb-4">
              Click any quick-suggestion above or the &ldquo;Add Event&rdquo; button to include Haldi, Sangeet, Mehendi, or Reception details.
            </p>
            <button
              type="button"
              onClick={() => handleOpenNew("")}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-xs font-semibold rounded-xl shadow-md hover:brightness-105 transition-all"
            >
              <Plus size={14} />
              <span>Add Your First Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formData.events.map((ev, index) => (
              <div
                key={ev.id || index}
                className="relative bg-white/95 rounded-2xl p-4 border border-[#EEDEB3]/70 shadow-xs hover:border-[#D4AF37] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-[#FAF0D7] text-[#93611D] text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#25201A]">
                      {ev.eventName}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ev)}
                      className="p-1.5 rounded-lg text-[#665C51] hover:text-[#93611D] hover:bg-[#FCF9F0] transition-colors"
                      title="Edit Event"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEvent(ev.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Remove Event"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-xs text-[#665C51]">
                  <div className="flex items-center space-x-1.5">
                    <Calendar size={13} className="text-[#93611D] shrink-0" />
                    <span>{formatDatePretty(ev.date)}</span>
                    {ev.time && (
                      <>
                        <span className="text-[#EEDEB3]">•</span>
                        <Clock size={13} className="text-[#93611D] shrink-0 ml-1" />
                        <span>{ev.time}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <MapPin size={13} className="text-[#93611D] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{ev.venueName} — {ev.venueAddress}</span>
                  </div>
                  {ev.description && (
                    <p className="mt-1 text-[11px] text-[#8B6E32] italic bg-[#FCF9F0] p-1.5 rounded-lg border border-[#EEDEB3]/40">
                      &ldquo;{ev.description}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Add/Edit Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#EEDEB3] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EEDEB3]/50 pb-3 mb-4">
              <h3 className="font-serif text-xl font-bold text-[#25201A]">
                {editingId ? "Edit Event Details" : "Add Wedding Event"}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 text-[#665C51] hover:text-[#25201A] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
                  Event Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sangeet & Cocktail Night"
                  value={eventForm.eventName}
                  onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    eventErrors.eventName ? "border-rose-400" : "border-[#EEDEB3]"
                  }`}
                />
                {eventErrors.eventName && (
                  <p className="text-xs text-rose-600 mt-1">{eventErrors.eventName}</p>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
                    Event Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                      eventErrors.date ? "border-rose-400" : "border-[#EEDEB3]"
                    }`}
                  />
                  {eventErrors.date && (
                    <p className="text-xs text-rose-600 mt-1">{eventErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
                    Event Time <span className="text-xs font-normal text-[#8B6E32] lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 06:30 PM onwards"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#EEDEB3] rounded-xl text-sm text-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Venue Name */}
              <div>
                <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
                  Venue Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Palace Banquet Hall"
                  value={eventForm.venueName}
                  onChange={(e) => setEventForm({ ...eventForm, venueName: e.target.value })}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    eventErrors.venueName ? "border-rose-400" : "border-[#EEDEB3]"
                  }`}
                />
                {eventErrors.venueName && (
                  <p className="text-xs text-rose-600 mt-1">{eventErrors.venueName}</p>
                )}
              </div>

              {/* Venue Address */}
              <div>
                <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
                  Venue Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Full street address, city, and landmarks"
                  value={eventForm.venueAddress}
                  onChange={(e) => setEventForm({ ...eventForm, venueAddress: e.target.value })}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    eventErrors.venueAddress ? "border-rose-400" : "border-[#EEDEB3]"
                  }`}
                />
                {eventErrors.venueAddress && (
                  <p className="text-xs text-rose-600 mt-1">{eventErrors.venueAddress}</p>
                )}
              </div>

              {/* Google Maps link */}
              <div>
                <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
                  Google Maps Link <span className="text-xs font-normal text-[#8B6E32] lowercase">(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={eventForm.locationLink}
                  onChange={(e) => setEventForm({ ...eventForm, locationLink: e.target.value })}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    eventErrors.locationLink ? "border-rose-400" : "border-[#EEDEB3]"
                  }`}
                />
                {eventErrors.locationLink && (
                  <p className="text-xs text-rose-600 mt-1">{eventErrors.locationLink}</p>
                )}
              </div>

              {/* Additional Description */}
              <div>
                <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
                  Additional Description <span className="text-xs font-normal text-[#8B6E32] lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dress code: Yellow / Traditional, Dinner served"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#EEDEB3] rounded-xl text-sm text-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#EEDEB3]/50">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#665C51] hover:text-[#25201A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-xs font-semibold rounded-xl shadow-md hover:brightness-105"
                >
                  <Check size={14} />
                  <span>{editingId ? "Update Event" : "Save Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
