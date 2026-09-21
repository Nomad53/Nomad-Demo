"use client";

import { useEffect, useRef, useState } from "react";

const initialMessages = [
  {
    role: "assistant",
    text: "Hi! 👋 I'm your property assistant.\n\nAre you looking to buy or rent a property in Dubai?",
  },
];

const initialLeadMemory = {
  lead: {},
  state: {
    location_options: [],
    property_type_options: [],
    property_status_options: [],
    uncertainties: [],
    missing_fields: [],
  },
};

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const [leadMemory, setLeadMemory] = useState(initialLeadMemory);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!showDemo) return;

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, showDemo]);

  function openDemo() {
    setShowDemo(true);
  }

  function backToLanding() {
    if (loading) return;
    setShowDemo(false);
  }

  function startNewConversation() {
    if (loading) return;

    setMessages(initialMessages);
    setInput("");
    setLoading(false);
    setLeadSaved(false);
    setLeadMemory(initialLeadMemory);
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
      // Extract/update structured lead memory
      const extractionResponse = await fetch("/api/extract-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: formattedMessages,
          previous: leadMemory,
        }),
      });

      let extractionData = {
        success: false,
        lead: leadMemory.lead || {},
        state: leadMemory.state || initialLeadMemory.state,
      };

      try {
        extractionData = await extractionResponse.json();
      } catch (error) {
        console.error("Could not read extraction response:", error);
      }

      if (!extractionResponse.ok || !extractionData.success) {
        console.error("Lead extraction failed:", extractionData);
      }

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
              lead: leadMemory.lead || {},
              location_options:
                leadMemory.state?.location_options || [],
              property_type_options:
                leadMemory.state?.property_type_options || [],
              property_status_options:
                leadMemory.state?.property_status_options || [],
              uncertainties:
                leadMemory.state?.uncertainties || [],
              missing_fields:
                leadMemory.state?.missing_fields || [],
            };

      if (extractionData.success) {
        setLeadMemory({
          lead: extractionData.lead || {},
          state: extractionData.state || initialLeadMemory.state,
        });
      }

      // STEP 2:
      // Generate conversational response
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
      // Save only once deterministic extractor says Qualified
      if (
        extractionData.success &&
        extractionData.lead?.lead_status === "Qualified" &&
        !leadSaved
      ) {
        const leadToSave = {
          ...extractionData.lead,
          conversation: conversationWithReply,
        };

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

  if (!showDemo) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at 85% 10%, rgba(48,146,122,0.16), transparent 30%), radial-gradient(circle at 10% 85%, rgba(6,78,70,0.09), transparent 35%), linear-gradient(135deg, #f7fbf9 0%, #edf5f1 100%)",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          color: "#102821",
          overflow: "hidden",
        }}
      >
        {/* NAV */}
        <nav
          style={{
            width: "100%",
            maxWidth: "1180px",
            margin: "0 auto",
            padding: "26px 28px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "13px",
                background:
                  "linear-gradient(135deg, #064e46, #0b796b)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "17px",
                boxShadow:
                  "0 8px 22px rgba(7,94,84,0.18)",
              }}
            >
              N
            </div>

            <div>
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "17px",
                  letterSpacing: "-0.3px",
                }}
              >
                NOMAD
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: "#71827c",
                  letterSpacing: "1.1px",
                  textTransform: "uppercase",
                  marginTop: "1px",
                }}
              >
                Property Intelligence
              </div>
            </div>
          </div>

          <button
            onClick={openDemo}
            style={{
              border: "1px solid rgba(7,94,84,0.14)",
              background: "rgba(255,255,255,0.72)",
              color: "#075e54",
              padding: "10px 17px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "13px",
              backdropFilter: "blur(10px)",
            }}
          >
            Launch Demo
          </button>
        </nav>

        {/* HERO */}
        <section
          style={{
            width: "100%",
            maxWidth: "1180px",
            margin: "0 auto",
            padding: "72px 28px 90px",
            boxSizing: "border-box",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
            gap: "70px",
          }}
        >
          {/* LEFT */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 12px",
                borderRadius: "999px",
                background: "rgba(7,94,84,0.07)",
                border: "1px solid rgba(7,94,84,0.10)",
                color: "#075e54",
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "26px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#16a085",
                  boxShadow:
                    "0 0 0 4px rgba(22,160,133,0.10)",
                }}
              />
              AI for Real Estate Sales Teams
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(48px, 6.4vw, 82px)",
                lineHeight: "0.98",
                letterSpacing: "-3.5px",
                fontWeight: "800",
                maxWidth: "760px",
              }}
            >
              Turn property
              <br />
              enquiries into
              <br />
              <span
                style={{
                  color: "#087565",
                }}
              >
                qualified leads.
              </span>
            </h1>

            <p
              style={{
                marginTop: "30px",
                marginBottom: 0,
                maxWidth: "600px",
                fontSize: "18px",
                lineHeight: "1.7",
                color: "#61716b",
              }}
            >
              NOMAD understands property requirements,
              qualifies buyers and tenants naturally, captures
              structured lead data, and hands sales-ready
              opportunities directly to your team.
            </p>

            <div
              style={{
                marginTop: "36px",
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <button
                onClick={openDemo}
                style={{
                  border: "none",
                  background:
                    "linear-gradient(135deg, #064e46 0%, #087565 100%)",
                  color: "white",
                  padding: "15px 24px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  fontWeight: "800",
                  fontSize: "14px",
                  boxShadow:
                    "0 14px 32px rgba(7,94,84,0.20)",
                }}
              >
                Try Live Demo →
              </button>

              <div
                style={{
                  padding: "14px 17px",
                  borderRadius: "14px",
                  border: "1px solid rgba(7,94,84,0.10)",
                  background: "rgba(255,255,255,0.66)",
                  color: "#66756f",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  backdropFilter: "blur(8px)",
                }}
              >
                No forms. Just conversation.
              </div>
            </div>

            {/* PROOF STRIP */}
            <div
              style={{
                marginTop: "54px",
                display: "flex",
                flexWrap: "wrap",
                gap: "28px",
              }}
            >
              {[
                ["24/7", "Lead qualification"],
                ["Instant", "Structured capture"],
                ["Live", "Sales handoff"],
              ].map(([big, small]) => (
                <div key={small}>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "800",
                      color: "#133b31",
                    }}
                  >
                    {big}
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#7c8b85",
                    }}
                  >
                    {small}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT DEMO PREVIEW */}
          <div
            style={{
              position: "relative",
              minHeight: "540px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "360px",
                height: "360px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(8,117,101,0.16), rgba(8,117,101,0))",
                filter: "blur(16px)",
              }}
            />

            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                background: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(7,94,84,0.09)",
                borderRadius: "28px",
                boxShadow:
                  "0 30px 80px rgba(24,70,57,0.16)",
                overflow: "hidden",
                position: "relative",
                backdropFilter: "blur(14px)",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #064e46, #087565)",
                  padding: "18px",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                  }}
                >
                  N
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "14px",
                    }}
                  >
                    NOMAD Property Assistant
                  </div>

                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    ● Online
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "22px",
                  minHeight: "390px",
                  background: "#f7f9f8",
                }}
              >
                <PreviewBubble left>
                  Hi! 👋 Are you looking to buy or rent a
                  property in Dubai?
                </PreviewBubble>

                <PreviewBubble>
                  I’m looking to buy a 3-bedroom villa in
                  Dubai Hills around AED 4 million.
                </PreviewBubble>

                <PreviewBubble left>
                  Are you considering ready-to-move,
                  off-plan, or both?
                </PreviewBubble>

                <PreviewBubble>
                  Both are fine. I’ll be using a mortgage.
                </PreviewBubble>

                <div
                  style={{
                    marginTop: "26px",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    background: "#edf8f4",
                    border: "1px solid #d8eee6",
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#0b7a69",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  >
                    ✓
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        color: "#174c3f",
                      }}
                    >
                      Structured qualification
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6f837b",
                        marginTop: "2px",
                      }}
                    >
                      Requirements captured in real time
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE SECTION */}
        <section
          style={{
            width: "100%",
            background: "#0d352d",
            color: "white",
            padding: "72px 28px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1120px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                maxWidth: "650px",
                marginBottom: "42px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#83c9b6",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  marginBottom: "12px",
                }}
              >
                Built for real estate teams
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "36px",
                  lineHeight: "1.15",
                  letterSpacing: "-1.4px",
                }}
              >
                From first enquiry to qualified opportunity.
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <FeatureCard
                number="01"
                title="Natural qualification"
                text="Understands buyers and renters without turning the conversation into a rigid form."
              />

              <FeatureCard
                number="02"
                title="Structured lead capture"
                text="Turns conversation into usable requirements, contact details and callback information."
              />

              <FeatureCard
                number="03"
                title="Sales handoff"
                text="Qualified opportunities are saved, surfaced to the team and ready for follow-up."
              />
            </div>

            <div
              style={{
                marginTop: "46px",
                textAlign: "center",
              }}
            >
              <button
                onClick={openDemo}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "white",
                  color: "#0d352d",
                  padding: "14px 24px",
                  borderRadius: "13px",
                  cursor: "pointer",
                  fontWeight: "800",
                  fontSize: "14px",
                }}
              >
                Experience NOMAD
              </button>
            </div>
          </div>
        </section>
      </main>
    );
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
          position: "fixed",
          top: "22px",
          left: "22px",
          zIndex: 10,
        }}
      >
        <button
          onClick={backToLanding}
          disabled={loading}
          style={{
            border: "1px solid rgba(7,94,84,0.10)",
            background: "rgba(255,255,255,0.78)",
            color: "#075e54",
            padding: "9px 13px",
            borderRadius: "11px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "12px",
            fontWeight: "700",
            opacity: loading ? 0.5 : 1,
            boxShadow: "0 5px 18px rgba(20,55,45,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          ← NOMAD
        </button>
      </div>

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
            padding: "18px",
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
                marginRight: "12px",
                flexShrink: 0,
              }}
            >
              N
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
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
                    background: loading
                      ? "#ffd166"
                      : "#65e6a7",
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
              border:
                "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontSize: "20px",
              opacity: loading ? 0.55 : 1,
            }}
          >
            ↻
          </button>
        </div>

        {/* CHAT */}
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
                    boxShadow:
                      "0 2px 9px rgba(20,45,37,0.06)",
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
                  borderRadius: "16px",
                  padding: "11px 14px",
                  color: "#77827e",
                  letterSpacing: "2px",
                }}
              >
                •••
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT */}
        <div
          style={{
            padding: "14px 14px 16px",
            background: "#ffffff",
            borderTop: "1px solid #edf0ef",
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
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "14px",
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
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
                fontSize: "17px",
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

function PreviewBubble({ children, left = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: left
          ? "flex-start"
          : "flex-end",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 13px",
          borderRadius: left
            ? "14px 14px 14px 4px"
            : "14px 14px 4px 14px",
          background: left
            ? "white"
            : "#dff7d9",
          color: "#29423a",
          fontSize: "12px",
          lineHeight: "1.5",
          boxShadow:
            "0 2px 7px rgba(30,60,50,0.05)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FeatureCard({ number, title, text }) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#7dc6b4",
          fontWeight: "800",
          letterSpacing: "0.8px",
          marginBottom: "24px",
        }}
      >
        {number}
      </div>

      <div
        style={{
          fontSize: "17px",
          fontWeight: "800",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "13px",
          lineHeight: "1.65",
          color: "rgba(255,255,255,0.64)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
