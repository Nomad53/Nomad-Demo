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
  const [loading, setLoading] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      text: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        text: data.reply || "Sorry, I couldn't respond. Please try again.",
      };

      const conversationWithReply = [
        ...updatedMessages,
        assistantMessage,
      ];

      setMessages(conversationWithReply);

      // Extract structured lead data from the full conversation
      const extractionResponse = await fetch("/api/extract-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationWithReply.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });

      const extractionData = await extractionResponse.json();

      if (
        extractionData.success &&
        extractionData.lead?.lead_status === "Qualified" &&
        !leadSaved
      ) {
        const leadToSave = {
          ...extractionData.lead,
          conversation: conversationWithReply,
        };

        // Save lead to Supabase
        const saveResponse = await fetch("/api/save-lead", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(leadToSave),
        });

        const saveData = await saveResponse.json();

        if (saveData.success) {
          setLeadSaved(true);
          console.log("Lead saved successfully");

          // Send email notification
          try {
            const notifyResponse = await fetch("/api/notify-lead", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(extractionData.lead),
            });

            const notifyData = await notifyResponse.json();

            if (notifyData.success) {
              console.log("Lead notification sent");
            } else {
              console.error("Lead notification failed:", notifyData);
            }
          } catch (notifyError) {
            console.error("Notification request failed:", notifyError);
          }
        } else {
          console.error("Lead save failed:", saveData);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
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
            {loading ? "Typing..." : "Online"}
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
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "20px",
              border: "1px solid #ddd",
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              border: "none",
              background: "#075e54",
              color: "white",
              padding: "0 18px",
              borderRadius: "20px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}
