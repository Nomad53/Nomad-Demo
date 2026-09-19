"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! 👋 I'm your property assistant.\n\nAre you looking to buy or rent a property in Dubai?",
    },
  ]);

  const [input, setInput] = useState("");

  function sendMessage() {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentInput = input;
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Got it. You said: "${currentInput}"\n\nWhat budget are you working with?`,
        },
      ]);
    }, 500);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "420px",
          background: "white",
          borderRadius: "18px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#075e54",
            color: "white",
            padding: "20px",
          }}
        >
          <strong>NOMAD Property Assistant</strong>
          <div style={{ fontSize: "13px", marginTop: "4px" }}>
            Online
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            minHeight: "400px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent:
                  message.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  background:
                    message.role === "user" ? "#dcf8c6" : "#f0f2f5",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  maxWidth: "80%",
                  whiteSpace: "pre-line",
                }}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "16px",
            borderTop: "1px solid #eee",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "20px",
              border: "1px solid #ddd",
            }}
          />

          <button
            onClick={sendMessage}
            style={{
              border: "none",
              background: "#075e54",
              color: "white",
              padding: "0 18px",
              borderRadius: "20px",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
