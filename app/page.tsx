"use client";

import React, { useState, useEffect } from "react";
import Sidebar, { ChatSession } from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import { Message } from "@/components/MessageBubble";
import { AddressFormData } from "@/components/AddressForm";

interface SessionData {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  cart: any[];
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Sync theme selection to document element class list
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
    localStorage.setItem("kapruka_theme", theme);
  }, [theme]);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem("kapruka_theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedSessionsJson = localStorage.getItem("kapruka_sessions");
    if (savedSessionsJson) {
      try {
        const loadedSessions: SessionData[] = JSON.parse(savedSessionsJson);
        if (loadedSessions.length > 0) {
          // Map to ChatSession list for sidebar
          const sidebarSessions: ChatSession[] = loadedSessions.map((s) => ({
            id: s.id,
            title: s.title,
            timestamp: s.timestamp,
          }));
          setSessions(sidebarSessions);

          // Select the first session
          const activeSession = loadedSessions[0];
          setActiveSessionId(activeSession.id);
          setMessages(activeSession.messages || []);
          setCart(activeSession.cart || []);
          return;
        }
      } catch (e) {
        console.error("Error loading sessions:", e);
      }
    }

    // Fallback: Start a fresh session
    startNewSession([]);
  }, []);

  // 2. Helper to start a fresh chat session
  const startNewSession = (currentSessionsList: ChatSession[] = sessions) => {
    const newId = `session_${Date.now()}`;
    const newSession: SessionData = {
      id: newId,
      title: "New Conversation",
      timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      messages: [],
      cart: [],
    };

    // Update sessions state
    const updatedSessionsList: ChatSession[] = [
      { id: newSession.id, title: newSession.title, timestamp: newSession.timestamp },
      ...currentSessionsList,
    ];
    setSessions(updatedSessionsList);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setCart([]);

    // Save to LocalStorage
    saveSessionToStorage(newSession.id, [], [], updatedSessionsList);
  };

  // 3. Helper to save active session data to LocalStorage
  const saveSessionToStorage = (
    sessionId: string,
    currentMessages: Message[],
    currentCart: any[],
    sessionsList: ChatSession[] = sessions
  ) => {
    if (!sessionId) return;
    
    try {
      const savedSessionsJson = localStorage.getItem("kapruka_sessions");
      let allSessionsData: SessionData[] = [];
      if (savedSessionsJson) {
        allSessionsData = JSON.parse(savedSessionsJson);
      }

      // Check if session already exists
      const existingIdx = allSessionsData.findIndex((s) => s.id === sessionId);
      const sessionTitle =
        currentMessages.find((m) => m.role === "user")?.content.substring(0, 30) + "..." ||
        "New Conversation";

      const updatedSessionData: SessionData = {
        id: sessionId,
        title: sessionTitle === "..." ? "New Conversation" : sessionTitle,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        messages: currentMessages,
        cart: currentCart,
      };

      if (existingIdx > -1) {
        allSessionsData[existingIdx] = updatedSessionData;
      } else {
        allSessionsData.unshift(updatedSessionData);
      }

      localStorage.setItem("kapruka_sessions", JSON.stringify(allSessionsData));

      // Sync the sidebar titles state
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: updatedSessionData.title } : s))
      );
    } catch (e) {
      console.error("Error saving session:", e);
    }
  };

  // 4. Switch between sessions
  const handleSelectSession = (sessionId: string) => {
    try {
      const savedSessionsJson = localStorage.getItem("kapruka_sessions");
      if (savedSessionsJson) {
        const allSessions: SessionData[] = JSON.parse(savedSessionsJson);
        const selected = allSessions.find((s) => s.id === sessionId);
        if (selected) {
          setActiveSessionId(sessionId);
          setMessages(selected.messages || []);
          setCart(selected.cart || []);
        }
      }
    } catch (e) {
      console.error("Error selecting session:", e);
    }
  };

  // 5. Delete session
  const handleDeleteSession = (sessionId: string) => {
    const filteredSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(filteredSessions);

    try {
      const savedSessionsJson = localStorage.getItem("kapruka_sessions");
      if (savedSessionsJson) {
        const allSessions: SessionData[] = JSON.parse(savedSessionsJson);
        const filteredAll = allSessions.filter((s) => s.id !== sessionId);
        localStorage.setItem("kapruka_sessions", JSON.stringify(filteredAll));
      }
    } catch (e) {
      console.error("Error deleting session:", e);
    }

    // If we deleted the active one, start fresh
    if (sessionId === activeSessionId) {
      if (filteredSessions.length > 0) {
        handleSelectSession(filteredSessions[0].id);
      } else {
        startNewSession([]);
      }
    }
  };

  // 6. Action: Send Message
  const handleSendMessage = async (textText?: string) => {
    const messageText = textText || input;
    if (!messageText.trim() || isTyping) return;

    // Create user message
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: messageText,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    // Save user message in storage
    saveSessionToStorage(activeSessionId, newMessages, cart);

    try {
      // Prepare request payload
      // Send chat history and current cart selection
      const reqPayload = {
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        cart: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          title: item.name,
          price: item.price.amount,
          image_url: item.image_url,
        })),
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with shopping agent API");
      }

      const responseData = await response.json();

      // Create assistant message with metadata
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: responseData.content,
        type: responseData.metadata?.type || "text",
        products: responseData.metadata?.products || [],
        quoteData: responseData.metadata?.quoteData || null,
        checkoutData: responseData.metadata?.checkoutData || null,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      setIsTyping(false);

      // Save updated history in storage
      saveSessionToStorage(activeSessionId, finalMessages, cart);
    } catch (error: any) {
      console.error("Send message error:", error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: "assistant",
        content: `Sorry, I encountered an error checking our store catalog. Make sure the OpenAI API key is configured correctly.\n\nDetails: ${error.message || "Network Error"}`,
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      setIsTyping(false);
      saveSessionToStorage(activeSessionId, finalMessages, cart);
    }
  };

  // 7. Shopping Cart modifiers
  const handleSelectProduct = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      let nextCart;
      if (existing) {
        nextCart = prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        nextCart = [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1,
          },
        ];
      }
      // Save session state with new cart
      saveSessionToStorage(activeSessionId, messages, nextCart);
      return nextCart;
    });
  };

  const handleDeselectProduct = (productId: string) => {
    setCart((prev) => {
      const nextCart = prev.filter((item) => item.product_id !== productId);
      saveSessionToStorage(activeSessionId, messages, nextCart);
      return nextCart;
    });
  };

  const handleUpdateProductQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const nextCart = prev.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      );
      saveSessionToStorage(activeSessionId, messages, nextCart);
      return nextCart;
    });
  };

  // 8. Proceed to Delivery form injection
  const handleProceedToDelivery = () => {
    if (cart.length === 0) return;

    // Manually inject an assistant bubble containing the Address Form
    const addressFormMessage: Message = {
      id: `msg_${Date.now()}_address_prompt`,
      role: "assistant",
      content: "Please provide your delivery information below so I can calculate your shipping fee and prepare your checkout link.",
      type: "address_form",
    };

    const nextMessages = [...messages, addressFormMessage];
    setMessages(nextMessages);
    saveSessionToStorage(activeSessionId, nextMessages, cart);
  };

  // 9. Address Form submission hook
  const handleSubmitAddress = (addressData: AddressFormData) => {
    // 1. Mark the address form as submitted by attaching values
    const updatedMessages = messages.map((m) => {
      if (m.type === "address_form" && !m.addressFormData) {
        return { ...m, addressFormData: addressData };
      }
      return m;
    });

    // 2. Append user message showing details
    const userSubmitMessage: Message = {
      id: `msg_${Date.now()}_address_submit`,
      role: "user",
      content: `Here are my delivery details:
- **Recipient Name:** ${addressData.name}
- **Phone Number:** ${addressData.phone}
- **City/District:** ${addressData.city}
- **Address:** ${addressData.address}
- **Location Type:** ${addressData.location_type}
- **Delivery Date:** ${addressData.date}
${addressData.instructions ? `- **Instructions:** ${addressData.instructions}` : ""}`,
    };

    const nextMessages = [...updatedMessages, userSubmitMessage];
    setMessages(nextMessages);
    setIsTyping(true);

    // Save before sending
    saveSessionToStorage(activeSessionId, nextMessages, cart);

    // 3. Immediately send to agent to check delivery quote
    (async () => {
      try {
        const reqPayload = {
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          cart: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            title: item.name,
            price: item.price.amount,
            image_url: item.image_url,
          })),
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqPayload),
        });

        if (!response.ok) throw new Error("Failed to calculate quote");

        const responseData = await response.json();

        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: responseData.content,
          type: responseData.metadata?.type || "text",
          products: responseData.metadata?.products || [],
          quoteData: responseData.metadata?.quoteData || null,
          checkoutData: responseData.metadata?.checkoutData || null,
        };

        const finalMessages = [...nextMessages, assistantMessage];
        setMessages(finalMessages);
        setIsTyping(false);
        saveSessionToStorage(activeSessionId, finalMessages, cart);
      } catch (error: any) {
        console.error("Quote fetch error:", error);
        const errorMessage: Message = {
          id: `msg_${Date.now()}_error`,
          role: "assistant",
          content: `Sorry, I failed to fetch a delivery quote for ${addressData.city}. Please check the city name and try again.`,
        };
        const finalMessages = [...nextMessages, errorMessage];
        setMessages(finalMessages);
        setIsTyping(false);
        saveSessionToStorage(activeSessionId, finalMessages, cart);
      }
    })();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans antialiased text-foreground">
      {/* Sidebar (Conversations list & active cart panel) */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={() => startNewSession()}
        onDeleteSession={handleDeleteSession}
        cartItems={cart}
        onRemoveCartItem={handleDeselectProduct}
        onProceedToDelivery={handleProceedToDelivery}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      />

      {/* Main chat window */}
      <ChatWindow
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        onOpenSidebar={() => setSidebarOpen(true)}
        cartItems={cart}
        onSelectProduct={handleSelectProduct}
        onDeselectProduct={handleDeselectProduct}
        onUpdateProductQuantity={handleUpdateProductQuantity}
        onSubmitAddress={handleSubmitAddress}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      />
    </div>
  );
}
