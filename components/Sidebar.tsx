"use client";
 
import React from "react";
import { MessageSquare, Plus, ShoppingCart, Trash2, MapPin, X, ArrowRight, Sun, Moon } from "lucide-react";
 
export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
}
 
export interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  cartItems: any[];
  onRemoveCartItem: (productId: string) => void;
  onProceedToDelivery: () => void;
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}
 
export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  cartItems,
  onRemoveCartItem,
  onProceedToDelivery,
  isOpen,
  onClose,
  theme = "dark",
  onToggleTheme,
}: SidebarProps) {
  // Calculate cart subtotal
  const cartSubtotal = cartItems.reduce((acc, item) => {
    const price = item.price.amount || 0;
    return acc + price * item.quantity;
  }, 0);
 
  const cartCurrency = cartItems[0]?.price.currency || "LKR";
 
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
 
      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 glass-panel border-r border-border flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:z-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Session List */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm tracking-wide text-foreground">KAPRUKA AGENT</span>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Theme Toggle Switch */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-300 active:scale-90 cursor-pointer"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
                  )}
                </button>
              )}

              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
 
          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="w-full bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer group btn-animated"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> New Conversation
            </button>
          </div>
 
          {/* Conversations History */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Recent Chats
            </div>
 
            {sessions.length === 0 ? (
              <div className="text-sm text-muted-foreground/60 text-center py-4 italic">No previous chats</div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer border ${
                    session.id === activeSessionId
                      ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20 font-medium"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border-transparent"
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 truncate pr-2 flex-1">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
 
        {/* Bottom Cart Summary */}
        <div className="border-t border-border p-4 bg-background/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
              <ShoppingCart className="w-4.5 h-4.5 text-indigo-400" />
              <span>Shopping Cart</span>
            </div>
            <span className="bg-indigo-600/20 text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {cartItems.length} items
            </span>
          </div>
 
          {cartItems.length === 0 ? (
            <div className="text-xs text-muted-foreground/70 italic py-4 text-center bg-secondary/30 rounded-xl border border-border">
              Cart is empty. Ask the agent for products!
            </div>
          ) : (
            <div className="space-y-3">
              {/* Selected Items List */}
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between text-xs bg-secondary/40 p-2.5 rounded-xl border border-border"
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="text-xs text-foreground font-medium truncate">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Qty: {item.quantity} × {item.price.currency} {item.price.amount?.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveCartItem(item.product_id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-secondary transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
 
              {/* Subtotal */}
              <div className="flex justify-between text-sm border-t border-border pt-2.5 font-semibold text-foreground">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-indigo-500 font-bold">
                  {cartCurrency} {cartSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
 
              {/* Proceed to Checkout button */}
              <button
                onClick={() => {
                  onProceedToDelivery();
                  onClose();
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 shadow-md shadow-indigo-600/20 cursor-pointer h-10 mt-1 btn-animated group"
              >
                Checkout Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
