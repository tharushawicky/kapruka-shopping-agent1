"use client";
 
import React, { useState } from "react";
import { MapPin, Phone, User, Calendar, Home, ArrowRight } from "lucide-react";
 
export interface AddressFormData {
  name: string;
  phone: string;
  city: string;
  address: string;
  location_type: "house" | "apartment" | "office" | "other";
  date: string;
  instructions?: string;
}
 
export interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void;
  initialData?: Partial<AddressFormData>;
  isSubmitted?: boolean;
}
 
export default function AddressForm({ onSubmit, initialData, isSubmitted = false }: AddressFormProps) {
  // Get tomorrow's date in YYYY-MM-DD for minimum date picker
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
 
  const [formData, setFormData] = useState<AddressFormData>({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    city: initialData?.city || "",
    address: initialData?.address || "",
    location_type: initialData?.location_type || "house",
    date: initialData?.date || getTomorrowString(),
    instructions: initialData?.instructions || "",
  });
 
  const [errors, setErrors] = useState<Record<string, string>>({});
 
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Recipient name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(?:\+94|0)?7[0-9]{8}$/.test(formData.phone.trim()) && formData.phone.length < 9) {
      newErrors.phone = "Please enter a valid Sri Lankan phone number (e.g. 0771234567)";
    }
    if (!formData.city.trim()) newErrors.city = "City/District is required";
    if (!formData.address.trim()) newErrors.address = "Street address is required";
    if (!formData.date) newErrors.date = "Delivery date is required";
 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };
 
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted) return;
    if (validate()) {
      onSubmit(formData);
    }
  };
 
  return (
    <div className="glass-panel rounded-2xl border border-border p-5 shadow-xl max-w-md w-full animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
        <MapPin className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-foreground text-sm">Delivery Information</h3>
      </div>
 
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Recipient Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitted}
            placeholder="e.g. Priyantha Silva"
            className={`w-full glass-input rounded-xl px-3.5 py-2 text-sm text-foreground ${
              errors.name ? "border-red-500/50 focus:border-red-500" : ""
            } ${isSubmitted ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
 
        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> Recipient Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={isSubmitted}
            placeholder="e.g. 0771234567"
            className={`w-full glass-input rounded-xl px-3.5 py-2 text-sm text-foreground ${
              errors.phone ? "border-red-500/50 focus:border-red-500" : ""
            } ${isSubmitted ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>
 
        <div className="grid grid-cols-2 gap-4">
          {/* City / District */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> City / District
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={isSubmitted}
              placeholder="e.g. Colombo 03"
              className={`w-full glass-input rounded-xl px-3.5 py-2 text-sm text-foreground ${
                errors.city ? "border-red-500/50 focus:border-red-500" : ""
              } ${isSubmitted ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>
 
          {/* Delivery Date */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Delivery Date
            </label>
            <input
              type="date"
              name="date"
              min={getTomorrowString()}
              value={formData.date}
              onChange={handleChange}
              disabled={isSubmitted}
              className={`w-full glass-input rounded-xl px-3.5 py-2 text-sm text-foreground ${
                errors.date ? "border-red-500/50 focus:border-red-500" : ""
              } ${isSubmitted ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>
        </div>
 
        {/* Street Address */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> Street Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={isSubmitted}
            placeholder="e.g. 12/A, Galle Road"
            className={`w-full glass-input rounded-xl px-3.5 py-2 text-sm text-foreground ${
              errors.address ? "border-red-500/50 focus:border-red-500" : ""
            } ${isSubmitted ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>
 
        <div className="grid grid-cols-2 gap-4">
          {/* Location Type */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Location Type
            </label>
            <select
              name="location_type"
              value={formData.location_type}
              onChange={handleChange}
              disabled={isSubmitted}
              className={`w-full glass-input rounded-xl px-3 py-2 text-sm text-foreground appearance-none ${
                isSubmitted ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <option value="house" className="bg-background text-foreground">House</option>
              <option value="apartment" className="bg-background text-foreground">Apartment</option>
              <option value="office" className="bg-background text-foreground">Office</option>
              <option value="other" className="bg-background text-foreground">Other</option>
            </select>
          </div>
 
          {/* Optional instructions */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Instructions (Optional)
            </label>
            <input
              type="text"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              disabled={isSubmitted}
              placeholder="e.g. ring bell twice"
              className={`w-full glass-input rounded-xl px-3 py-2 text-sm text-foreground ${
                isSubmitted ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
          </div>
        </div>
 
        {/* Submit button */}
        {!isSubmitted && (
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer mt-2.5 btn-animated group"
          >
            Calculate Delivery & Quote <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        )}
      </form>
    </div>
  );
}
