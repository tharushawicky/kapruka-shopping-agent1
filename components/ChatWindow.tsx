"use client";
 
import React, { useRef, useEffect } from "react";
import { Send, Menu, Sparkles, MessageSquare, Sun, Moon } from "lucide-react";
import MessageBubble, { Message } from "./MessageBubble";
import { AddressFormData } from "./AddressForm";
 
export interface ChatWindowProps {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: (text?: string) => void;
  isTyping: boolean;
  onOpenSidebar: () => void;
  cartItems: any[];
  onSelectProduct: (product: any) => void;
  onDeselectProduct: (productId: string) => void;
  onUpdateProductQuantity: (productId: string, quantity: number) => void;
  onSubmitAddress: (data: AddressFormData) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}
 
const QUICK_PROMPTS = [
  { label: "🎁 Gift for Mom", text: "I need a birthday gift for my mother under Rs.5000" },
  { label: "🌹 Flowers for Wife", text: "I need flowers for my wife" },
  { label: "🍫 Chocolates for Colleague", text: "I need chocolates for a colleague" },
  { label: "🧸 Gift for a Boy", text: "I need a gift for a 10 year old boy" },
];
 
export default function ChatWindow({
  messages,
  input,
  onInputChange,
  onSendMessage,
  isTyping,
  onOpenSidebar,
  cartItems,
  onSelectProduct,
  onDeselectProduct,
  onUpdateProductQuantity,
  onSubmitAddress,
  theme = "dark",
  onToggleTheme,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
 
  // Auto-scroll to bottom when messages list changes or agent is typing
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
 
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
 
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };
 
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
      {/* Top Header */}
      <header className="glass-panel border-b border-border h-14 flex items-center justify-between px-4 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h1 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Shopping Concierge
            </h1>
          </div>
        </div>
 
        {/* Live Status indicator + Theme toggle */}
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-300 active:scale-90 cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
              Kapruka MCP Online
            </span>
          </div>
        </div>
      </header>
 
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
        {messages.length === 0 ? (
          /* Empty Chat Splash screen */
          <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Shopping Assistant</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Discover gifts, chocolates, cakes, and flowers from Kapruka's catalog. Select items directly in the chat and generate one-click checkout links.
              </p>
            </div>
 
            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt.text)}
                  className="glass-card hover:border-indigo-500/30 p-4 rounded-xl text-left text-sm transition-all duration-300 text-foreground/85 hover:text-foreground flex items-center gap-2.5 group cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-transform" />
                  <span>{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages list */
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                cartItems={cartItems}
                onSelectProduct={onSelectProduct}
                onDeselectProduct={onDeselectProduct}
                onUpdateProductQuantity={onUpdateProductQuantity}
                onSubmitAddress={onSubmitAddress}
              />
            ))}
 
            {/* Agent Typing Indicator */}
            {isTyping && (
              <div className="flex w-full gap-3 my-4 justify-start animate-pulse">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white border border-indigo-400/20">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="glass-panel text-foreground rounded-2xl rounded-bl-none border border-border px-4 py-3 flex items-center gap-1.5 h-9">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
 
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
 
      {/* Chat Input form area */}
      <footer className="p-4 bg-gradient-to-t from-background via-background/95 to-transparent flex-shrink-0">
        <div className="max-w-3xl mx-auto w-full relative">
          <div className="glass-panel border border-border rounded-2xl p-2 flex items-end gap-2 focus-within:border-indigo-500/40 transition-colors">
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              rows={1}
              placeholder="Message Shopping Assistant..."
              className="flex-1 max-h-36 min-h-[2.5rem] bg-transparent border-0 outline-none text-sm text-foreground placeholder-muted-foreground/60 px-3.5 py-2.5 resize-none overflow-y-auto"
            />
            <button
              onClick={() => onSendMessage()}
              disabled={isTyping || !input.trim()}
              className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center h-10 w-10 flex-shrink-0 cursor-pointer btn-animated ${
                input.trim() && !isTyping
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
 
          <div className="text-xs text-muted-foreground/50 text-center mt-2.5">
            Kapruka Shopping Agent is integrated directly with live products from mcp.kapruka.com.
          </div>
        </div>
      </footer>
    </div>
  );
}
