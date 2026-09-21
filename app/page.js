"use client";

import { useEffect, useRef, useState } from "react";

const initialMessages = [
  {
    role: "assistant",
    text: "Hi! 👋 I'm your property assistant.\n\nAre you looking to buy or rent a property in Dubai?",
  },
];

export default function Home() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  function startNewConversation() {
    if (loading) return;

    setMessages(initialMessages);
    setInput("");
    setLoading(false);
    setLeadSaved(false);
  }

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
      const formattedMessages = updatedMessages.map((message) => ({
        role: message.role,
        content: message.text,
      }));

      // STEP 1:
      // Extract the latest lead data and structured state
      const extractionResponse = await fetch("/api/extract-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: formattedMessages,
        }),
      });

      let extractionData = {
        success: false,
        lead: null,
        state: {
          location_options: [],
          property_type_options: [],
          property_status_options: [],
          uncertainties: [],
          missing_fields: [],
        },
      };

      try {
        extractionData = await extractionResponse.json();
      } catch (error) {
        console.error("Could not read extraction response:", error);
      }

      if (!extractionResponse.ok || !extractionData.success) {
        console.error("Lead extraction failed:", extractionData);
      }

      // IMPORTANT:
      // Send both the actual lead values AND the structured state to chat
      const currentState =
        extractionData.success
          ? {
              lead: extractionData.lead || {},
              location_options:
                extractionData.state?.location_options || [],
              property_type_options:
                extractionData.state?.property_type_options || [],
              property_status_options:
                extractionData.state?.property_status_options || [],
              uncertainties:
                extractionData.state?.uncertainties || [],
              missing_fields:
                extractionData.state?.missing_fields || [],
            }
          : {
              lead: {},
              location_options: [],
              property_type_options: [],
              property_status_options: [],
              uncertainties: [],
              missing_fields: [],
            };

      // STEP 2:
      // Generate NOMAD response using structured lead state
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: formattedMessages,
          state: currentState,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Chat API failed:", data);
        throw new Error("Chat API request failed");
      }

      const assistantMessage = {
        role: "assistant",
        text:
          data.reply ||
          "Sorry, I couldn't respond. Please try again.",
      };

      const conversationWithReply = [
        ...updatedMessages,
        assistantMessage,
      ];

      setMessages(conversationWithReply);

      // STEP 3:
      // If the latest customer message completed qualification,
      // save the lead and send the notification
      if (
        extractionData.success &&
        extractionData.lead?.lead_status === "Qualified" &&
        !leadSaved
      ) {
        const leadToSave = {
          ...extractionData.lead,
          conversation: conversationWithReply,
        };

        // Save qualified lead to Supabase
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
              console.error(
                "Lead notification failed:",
                notifyData
              );
            }
          } catch (notifyError) {
            console.error(
              "Notification request failed:",
              notifyError
            );
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
        background:
          "linear-gradient(135deg, #edf4f1 0%, #f8faf9 48%, #eef3f1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "min(720px, calc(100vh - 40px))",
          minHeight: "580px",
          background: "#ffffff",
          borderRadius: "24px",
          boxShadow:
            "0 24px 70px rgba(20, 55, 45, 0.14), 0 3px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(7, 94, 84, 0.08)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #064e46 0%, #075e54 55%, #087467 100%)",
            color: "white",
            padding: "18px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                marginRight: "12px",
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(0,0,0,0.10)",
              }}
            >
              N
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  letterSpacing: "-0.1px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                NOMAD Property Assistant
              </div>

              <div
                style={{
                  fontSize: "12px",
                  marginTop: "4px",
                  color: "rgba(255,255,255,0.82)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: loading ? "#ffd166" : "#65e6a7",
                    display: "inline-block",
                    boxShadow: loading
                      ? "0 0 0 3px rgba(255,209,102,0.12)"
                      : "0 0 0 3px rgba(101,230,167,0.12)",
                  }}
                />

                {loading ? "Typing..." : "Online"}
              </div>
            </div>
          </div>

          <button
            onClick={startNewConversation}
            disabled={loading}
            title="Start new conversation"
            style={{
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "20px",
              lineHeight: 1,
              fontWeight: "300",
              opacity: loading ? 0.55 : 1,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ↻
          </button>
        </div>

        {/* CHAT AREA */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "22px 18px 28px",
            backgroundColor: "#f7f9f8",
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(7,94,84,0.025) 0, rgba(7,94,84,0.025) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "22px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                color: "#87948f",
                background: "rgba(255,255,255,0.85)",
                border: "1px solid #e6ebe9",
                borderRadius: "20px",
                padding: "6px 10px",
              }}
            >
              Property Concierge
            </span>
          </div>

          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: isUser
                    ? "flex-end"
                    : "flex-start",
                  marginBottom: "14px",
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#075e54",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "800",
                      marginRight: "8px",
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    N
                  </div>
                )}

                <div
                  style={{
                    background: isUser
                      ? "linear-gradient(135deg, #d9fdd3 0%, #e4fbdc 100%)"
                      : "#ffffff",
                    color: "#1f2d29",
                    padding: "11px 14px",
                    borderRadius: isUser
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    maxWidth: "78%",
                    whiteSpace: "pre-line",
                    fontSize: "14px",
                    lineHeight: "1.55",
                    boxShadow: isUser
                      ? "0 2px 7px rgba(30,90,65,0.06)"
                      : "0 2px 9px rgba(20,45,37,0.06)",
                    border: isUser
                      ? "1px solid rgba(79,159,103,0.08)"
                      : "1px solid rgba(0,0,0,0.035)",
                  }}
                >
                  {message.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "2px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#075e54",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "800",
                  marginRight: "8px",
                }}
              >
                N
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: "16px 16px 16px 4px",
                  padding: "11px 14px",
                  border: "1px solid rgba(0,0,0,0.035)",
                  boxShadow: "0 2px 9px rgba(20,45,37,0.06)",
                  color: "#77827e",
                  fontSize: "13px",
                  letterSpacing: "2px",
                }}
              >
                •••
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT AREA */}
        <div
          style={{
            padding: "14px 14px 16px",
            background: "#ffffff",
            borderTop: "1px solid #edf0ef",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#f5f7f6",
              border: "1px solid #e1e6e4",
              borderRadius: "24px",
              padding: "5px 5px 5px 16px",
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
                padding: "10px 0",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#26332f",
                fontSize: "14px",
                minWidth: 0,
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              title="Send message"
              style={{
                border: "none",
                width: "42px",
                height: "42px",
                background: "#075e54",
                color: "white",
                borderRadius: "50%",
                cursor:
                  loading || !input.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loading || !input.trim()
                    ? 0.45
                    : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "17px",
                transition: "opacity 0.2s ease",
              }}
            >
              ➤
            </button>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "9px",
              fontSize: "10px",
              color: "#9aa39f",
            }}
          >
            AI-powered property assistance
          </div>
        </div>
      </div>
    </main>
  );
}
