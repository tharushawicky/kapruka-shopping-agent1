"use client";
 
import React from "react";
import { Bot, User, ShoppingBag, MapPin, CheckCircle, CreditCard, ExternalLink } from "lucide-react";
import ProductCard from "./ProductCard";
import AddressForm, { AddressFormData } from "./AddressForm";
 
export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  type?: "text" | "products" | "address_form" | "checkout_quote" | "payment_link";
  products?: any[];
  quoteData?: any;
  checkoutData?: any;
  addressFormData?: any;
}
 
export interface MessageBubbleProps {
  message: Message;
  cartItems: any[];
  onSelectProduct: (product: any) => void;
  onDeselectProduct: (productId: string) => void;
  onUpdateProductQuantity: (productId: string, quantity: number) => void;
  onSubmitAddress: (data: AddressFormData) => void;
}
 
// Simple, lightweight regex markdown parser
const parseMarkdown = (text: string) => {
  if (!text) return "";
  
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
 
  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
 
  // Links ([text](url))
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-500 hover:text-indigo-600 font-semibold underline inline-flex items-center gap-0.5">$1 <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>');
 
  // Bullet points
  const lines = html.split("\n");
  let inList = false;
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      if (!inList) {
        inList = true;
        return `<ul class="list-disc pl-5 space-y-1 my-1.5"><li>${content}</li>`;
      }
      return `<li>${content}</li>`;
    } else {
      if (inList) {
        inList = false;
        return `</ul><p class="my-2">${line}</p>`;
      }
      return trimmed === "" ? "<br/>" : `<p class="my-2">${line}</p>`;
    }
  });
 
  if (inList) {
    processedLines.push("</ul>");
  }
 
  return processedLines.join("");
};
 
export default function MessageBubble({
  message,
  cartItems,
  onSelectProduct,
  onDeselectProduct,
  onUpdateProductQuantity,
  onSubmitAddress,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
 
  return (
    <div className={`flex w-full gap-3.5 my-5 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8.5 h-8.5 rounded-full bg-indigo-650 flex items-center justify-center text-white border border-indigo-400/20 shadow-md shadow-indigo-600/10">
          <Bot className="w-4.5 h-4.5" />
        </div>
      )}
 
      {/* Message Content Area */}
      <div className={`max-w-[85%] flex flex-col gap-3.5 ${isUser ? "items-end" : "items-start"}`}>
        {/* Text bubble */}
        {message.content && (
          <div
            className={`rounded-2xl px-4.5 py-3 text-sm leading-relaxed transition-all duration-300 ${
              isUser
                ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-650/15 border border-indigo-500/20"
                : "glass-panel text-foreground rounded-bl-none border border-border"
            }`}
          >
            <div
              className="prose prose-invert prose-sm text-inherit"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
            />
          </div>
        )}
 
        {/* Dynamic Custom UI Layout components */}
 
        {/* 1. Products Grid */}
        {message.type === "products" && message.products && message.products.length > 0 && (
          <div className="w-full mt-2 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3 px-1 text-muted-foreground text-sm">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              <span>Discovered Products ({message.products.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {message.products.map((product: any) => {
                const cartItem = cartItems.find((item) => item.product_id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={!!cartItem}
                    quantity={cartItem ? cartItem.quantity : 0}
                    onSelect={onSelectProduct}
                    onDeselect={onDeselectProduct}
                    onUpdateQuantity={onUpdateProductQuantity}
                  />
                );
              })}
            </div>
          </div>
        )}
 
        {/* 2. Address Form */}
        {message.type === "address_form" && (
          <div className="w-full mt-2 animate-fade-in-up">
            <AddressForm
              onSubmit={onSubmitAddress}
              initialData={message.addressFormData}
              isSubmitted={!!message.addressFormData}
            />
          </div>
        )}
 
        {/* 3. Delivery Quote Summary */}
        {message.type === "checkout_quote" && message.quoteData && (
          <div className="w-full max-w-sm mt-2 glass-panel border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl p-4.5 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-border">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h4 className="font-semibold text-foreground text-sm">Delivery Quote Calculated</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-semibold text-foreground/90">{message.quoteData.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Availability:</span>
                <span
                  className={`font-semibold ${
                    message.quoteData.available ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {message.quoteData.available ? "Deliverable" : "Not Deliverable"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span className="font-bold text-emerald-500">
                  {message.quoteData.currency} {message.quoteData.rate?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {message.quoteData.checked_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Date:</span>
                  <span className="font-semibold text-foreground/90">{message.quoteData.checked_date}</span>
                </div>
              )}
              {message.quoteData.perishable_warning && (
                <p className="text-xs text-amber-600 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mt-2.5">
                  ⚠️ {message.quoteData.perishable_warning}
                </p>
              )}
            </div>
          </div>
        )}
 
        {/* 4. Payment Link / Checkout details */}
        {message.type === "payment_link" && message.checkoutData && (
          <div className="w-full max-w-sm mt-2 glass-panel border border-indigo-500/20 bg-indigo-505/5 dark:bg-indigo-950/10 rounded-2xl p-5 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-border">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              <h4 className="font-semibold text-foreground text-sm">Guest Checkout Ready</h4>
            </div>
 
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Reference:</span>
                <span className="font-semibold text-foreground/90">{message.checkoutData.order_ref}</span>
              </div>
              
              {message.checkoutData.summary && (
                <div className="space-y-2 bg-secondary/35 p-3.5 rounded-xl border border-border my-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Items Total:</span>
                    <span className="text-foreground/90">
                      {message.checkoutData.summary.currency} {message.checkoutData.summary.items_total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Delivery Fee:</span>
                    <span className="text-foreground/90">
                      {message.checkoutData.summary.currency} {message.checkoutData.summary.delivery_fee?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold text-indigo-500">
                    <span>Grand Total:</span>
                    <span>
                      {message.checkoutData.summary.currency} {message.checkoutData.summary.grand_total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
 
              {message.checkoutData.expires_at && (
                <div className="text-xs text-muted-foreground">
                  Payment link locks prices until:{" "}
                  {new Date(message.checkoutData.expires_at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
 
              {message.checkoutData.checkout_url && (
                <a
                  href={message.checkoutData.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer mt-4 btn-animated group"
                >
                  Proceed to Secure Payment <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
 
      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8.5 h-8.5 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-md">
          <User className="w-4.5 h-4.5" />
        </div>
      )}
    </div>
  );
}
