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

const colors = {
  ivory: "#F7F3EB",
  ivorySoft: "#FBF9F4",
  paper: "#FFFDF8",
  ink: "#111915",
  forest: "#0C332B",
  forest2: "#123F35",
  emerald: "#0B6E5D",
  champagne: "#B89A67",
  champagneSoft: "#D4C2A1",
  sage: "#83938C",
  line: "rgba(17,25,21,0.10)",
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
          background: colors.ivory,
          color: colors.ink,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes floatNomad {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }

          @keyframes pulseSoft {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(1.05); }
          }

          @keyframes shimmerLine {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(240%); }
          }

          * {
            box-sizing: border-box;
          }

          button {
            font-family: inherit;
          }

          button:hover {
            transform: translateY(-1px);
          }

          @media (max-width: 860px) {
            .nomadHeroGrid {
              grid-template-columns: 1fr !important;
            }

            .nomadHeroTitle {
              font-size: 52px !important;
            }

            .nomadPreviewWrap {
              margin-top: 20px;
            }

            .nomadNav {
              padding-left: 18px !important;
              padding-right: 18px !important;
            }
          }

          @media (max-width: 560px) {
            .nomadHeroTitle {
              font-size: 42px !important;
              letter-spacing: -2px !important;
            }

            .nomadHeroSection {
              padding-left: 18px !important;
              padding-right: 18px !important;
            }
          }
        `}</style>

        {/* AMBIENT BACKGROUND */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 72% 16%, rgba(184,154,103,0.15), transparent 23%), radial-gradient(circle at 18% 78%, rgba(12,51,43,0.08), transparent 28%)",
          }}
        />

        {/* NAV */}
        <nav
          className="nomadNav"
          style={{
            width: "100%",
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "28px 34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 5,
          }}
        >
          <BrandMark />

          <button
            onClick={openDemo}
            style={{
              border: `1px solid ${colors.line}`,
              background: "rgba(255,253,248,0.72)",
              color: colors.forest,
              padding: "11px 18px",
              borderRadius: "999px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "12px",
              letterSpacing: "0.2px",
              backdropFilter: "blur(14px)",
              boxShadow: "0 8px 26px rgba(17,25,21,0.04)",
              transition: "0.2s ease",
            }}
          >
            Enter Live Experience
          </button>
        </nav>

        {/* HERO */}
        <section
          className="nomadHeroSection"
          style={{
            width: "100%",
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "76px 34px 116px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            className="nomadHeroGrid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.02fr 0.98fr",
              gap: "86px",
              alignItems: "center",
            }}
          >
            {/* LEFT */}
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "28px",
                  color: colors.champagne,
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "1.65px",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: "28px",
                    height: "1px",
                    background: colors.champagne,
                  }}
                />

                Intelligent Property Qualification
              </div>

              <h1
                className="nomadHeroTitle"
                style={{
                  margin: 0,
                  maxWidth: "760px",
                  fontSize: "clamp(58px, 5.8vw, 88px)",
                  lineHeight: "0.98",
                  letterSpacing: "-4.6px",
                  fontWeight: "720",
                }}
              >
                Every enquiry
                <br />
                deserves a
                <br />
                <span
                  style={{
                    fontFamily:
                      'Georgia, "Times New Roman", serif',
                    fontStyle: "italic",
                    fontWeight: "400",
                    color: colors.emerald,
                    letterSpacing: "-3px",
                  }}
                >
                  better conversation.
                </span>
              </h1>

              <p
                style={{
                  maxWidth: "610px",
                  marginTop: "34px",
                  marginBottom: 0,
                  fontSize: "17px",
                  lineHeight: "1.75",
                  color: "#5E6862",
                }}
              >
                NOMAD qualifies buyers and tenants naturally,
                understands intent in real time, structures every
                requirement, and hands your sales team a lead that
                is ready for action.
              </p>

              <div
                style={{
                  marginTop: "38px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <button
                  onClick={openDemo}
                  style={{
                    border: "none",
                    background: colors.forest,
                    color: colors.paper,
                    padding: "16px 24px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    fontWeight: "800",
                    fontSize: "13px",
                    letterSpacing: "0.15px",
                    boxShadow:
                      "0 18px 40px rgba(12,51,43,0.18)",
                    transition: "0.2s ease",
                  }}
                >
                  Experience NOMAD
                  <span style={{ marginLeft: "12px" }}>↗</span>
                </button>

                <div
                  style={{
                    color: "#767F79",
                    fontSize: "12px",
                    letterSpacing: "0.15px",
                  }}
                >
                  No forms. No scripts. Just conversation.
                </div>
              </div>

              {/* META */}
              <div
                style={{
                  marginTop: "58px",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(120px, 1fr))",
                  maxWidth: "560px",
                  borderTop: `1px solid ${colors.line}`,
                }}
              >
                <Metric
                  value="24/7"
                  label="qualification"
                />
                <Metric
                  value="Live"
                  label="lead capture"
                />
                <Metric
                  value="Instant"
                  label="sales handoff"
                />
              </div>
            </div>

            {/* RIGHT */}
            <div
              className="nomadPreviewWrap"
              style={{
                position: "relative",
                minHeight: "600px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Ambient halo */}
              <div
                style={{
                  position: "absolute",
                  width: "430px",
                  height: "430px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(184,154,103,0.16), rgba(184,154,103,0.03) 45%, transparent 70%)",
                  animation:
                    "pulseSoft 7s ease-in-out infinite",
                }}
              />

              {/* Decorative architectural frame */}
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  right: "12px",
                  width: "78%",
                  height: "78%",
                  border: `1px solid rgba(184,154,103,0.28)`,
                  borderRadius: "180px 180px 30px 30px",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  bottom: "26px",
                  left: "6%",
                  width: "72px",
                  height: "1px",
                  background: colors.champagne,
                }}
              />

              <div
                style={{
                  width: "100%",
                  maxWidth: "420px",
                  background: "rgba(255,253,248,0.92)",
                  border: `1px solid rgba(17,25,21,0.08)`,
                  borderRadius: "26px",
                  overflow: "hidden",
                  boxShadow:
                    "0 40px 90px rgba(17,25,21,0.18), 0 8px 30px rgba(12,51,43,0.08)",
                  position: "relative",
                  animation:
                    "floatNomad 8s ease-in-out infinite",
                  backdropFilter: "blur(18px)",
                }}
              >
                <div
                  style={{
                    padding: "17px 18px",
                    background: colors.forest,
                    color: colors.paper,
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
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #1D5A4B, #0F3E34)",
                        border:
                          "1px solid rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: "800",
                      }}
                    >
                      N
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        NOMAD Property Assistant
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.64)",
                        }}
                      >
                        ● Available now
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: colors.champagneSoft,
                    }}
                  >
                    Live
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    padding: "26px 22px 24px",
                    background: colors.ivorySoft,
                    minHeight: "420px",
                  }}
                >
                  <PreviewBubblePremium left>
                    Hi 👋 Are you looking to buy or rent a
                    property in Dubai?
                  </PreviewBubblePremium>

                  <PreviewBubblePremium>
                    I’m looking to buy a 3-bedroom villa in
                    Dubai Hills around AED 4 million.
                  </PreviewBubblePremium>

                  <PreviewBubblePremium left>
                    Are you considering ready-to-move,
                    off-plan, or both?
                  </PreviewBubblePremium>

                  <PreviewBubblePremium>
                    Both are fine. I’ll be using a mortgage.
                  </PreviewBubblePremium>

                  <div
                    style={{
                      marginTop: "28px",
                      borderTop: `1px solid rgba(17,25,21,0.08)`,
                      paddingTop: "18px",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: colors.champagne,
                          textTransform: "uppercase",
                          letterSpacing: "1.2px",
                          fontWeight: "800",
                        }}
                      >
                        Qualification engine
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                          marginTop: "5px",
                          color: colors.forest,
                        }}
                      >
                        Requirement captured
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#7C857F",
                          marginTop: "3px",
                        }}
                      >
                        Structured automatically in real time
                      </div>
                    </div>

                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: colors.forest,
                        color: colors.paper,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "800",
                        fontSize: "14px",
                        boxShadow:
                          "0 8px 20px rgba(12,51,43,0.16)",
                      }}
                    >
                      ✓
                    </div>
                  </div>
                </div>
              </div>

              {/* floating labels */}
              <FloatingTag
                style={{
                  position: "absolute",
                  left: "0",
                  top: "88px",
                }}
                eyebrow="LIVE INTENT"
                text="Buy · Villa"
              />

              <FloatingTag
                style={{
                  position: "absolute",
                  right: "-2px",
                  bottom: "88px",
                }}
                eyebrow="LEAD STATUS"
                text="Qualified"
              />
            </div>
          </div>
        </section>

        {/* BRAND STATEMENT */}
        <section
          style={{
            background: colors.forest,
            color: colors.paper,
            padding: "96px 34px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-80px",
              top: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              border:
                "1px solid rgba(184,154,103,0.16)",
            }}
          />

          <div
            style={{
              position: "absolute",
              right: "40px",
              top: "-15px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              border:
                "1px solid rgba(184,154,103,0.08)",
            }}
          />

          <div
            style={{
              maxWidth: "1180px",
              margin: "0 auto",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                maxWidth: "760px",
              }}
            >
              <div
                style={{
                  color: colors.champagneSoft,
                  fontSize: "10px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "1.8px",
                  marginBottom: "20px",
                }}
              >
                Built around the way property teams sell
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(38px, 5vw, 64px)",
                  lineHeight: "1.05",
                  letterSpacing: "-2.8px",
                  fontWeight: "650",
                }}
              >
                Not another chatbot.
                <br />
                <span
                  style={{
                    fontFamily:
                      'Georgia, "Times New Roman", serif',
                    fontStyle: "italic",
                    color: colors.champagneSoft,
                    fontWeight: "400",
                  }}
                >
                  A qualification layer
                </span>{" "}
                for your sales operation.
              </h2>
            </div>

            <div
              style={{
                marginTop: "68px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                borderTop:
                  "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <EditorialFeature
                number="01"
                title="Natural qualification"
                text="NOMAD adapts to the customer instead of forcing them through a rigid lead form."
              />

              <EditorialFeature
                number="02"
                title="Structured intelligence"
                text="Every requirement, preference, timeline and contact detail becomes usable sales data."
              />

              <EditorialFeature
                number="03"
                title="Immediate handoff"
                text="Qualified opportunities flow into your team’s workflow ready for follow-up."
              />
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section
          style={{
            padding: "102px 34px",
            background: colors.ivorySoft,
          }}
        >
          <div
            style={{
              maxWidth: "1180px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "60px",
                alignItems: "end",
              }}
            >
              <div>
                <div
                  style={{
                    color: colors.champagne,
                    textTransform: "uppercase",
                    letterSpacing: "1.6px",
                    fontSize: "10px",
                    fontWeight: "800",
                    marginBottom: "18px",
                  }}
                >
                  The NOMAD flow
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "46px",
                    lineHeight: "1.06",
                    letterSpacing: "-2px",
                    maxWidth: "520px",
                    fontWeight: "650",
                  }}
                >
                  From first message to sales-ready opportunity.
                </h2>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: "1.8",
                  color: "#68716B",
                  maxWidth: "500px",
                }}
              >
                NOMAD sits between the customer and your sales
                team, making every conversation useful before a
                consultant ever needs to step in.
              </p>
            </div>

            <div
              style={{
                marginTop: "64px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1px",
                background: colors.line,
                border: `1px solid ${colors.line}`,
              }}
            >
              <ProcessStep
                number="01"
                title="Enquiry"
                text="A buyer or tenant starts a natural conversation."
              />

              <ProcessStep
                number="02"
                title="Qualification"
                text="NOMAD understands intent, budget, location, timing and requirements."
              />

              <ProcessStep
                number="03"
                title="Capture"
                text="The conversation becomes structured lead data."
              />

              <ProcessStep
                number="04"
                title="Handoff"
                text="Your sales team receives a qualified opportunity ready for action."
              />
            </div>

            <div
              style={{
                marginTop: "68px",
                textAlign: "center",
              }}
            >
              <button
                onClick={openDemo}
                style={{
                  border: "none",
                  background: colors.forest,
                  color: colors.paper,
                  borderRadius: "999px",
                  padding: "16px 26px",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow:
                    "0 18px 36px rgba(12,51,43,0.16)",
                }}
              >
                Start a live conversation
                <span style={{ marginLeft: "12px" }}>↗</span>
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            padding: "30px 34px",
            background: colors.ink,
            color: "rgba(255,255,255,0.60)",
          }}
        >
          <div
            style={{
              maxWidth: "1180px",
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <BrandMark dark />

            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.25px",
              }}
            >
              Intelligent property qualification for modern real
              estate teams.
            </div>
          </div>
        </footer>
      </main>
    );
  }

  /* LIVE DEMO */
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 80% 20%, rgba(184,154,103,0.13), transparent 30%), linear-gradient(135deg, #F5F1E8 0%, #FAF8F3 100%)",
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
            border: `1px solid ${colors.line}`,
            background: "rgba(255,253,248,0.84)",
            color: colors.forest,
            padding: "10px 14px",
            borderRadius: "999px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "11px",
            fontWeight: "800",
            opacity: loading ? 0.5 : 1,
            boxShadow: "0 8px 20px rgba(17,25,21,0.05)",
            backdropFilter: "blur(12px)",
          }}
        >
          ← Back to NOMAD
        </button>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "470px",
          height: "min(730px, calc(100vh - 40px))",
          minHeight: "580px",
          background: colors.paper,
          borderRadius: "28px",
          boxShadow:
            "0 35px 90px rgba(17,25,21,0.16), 0 7px 25px rgba(12,51,43,0.06)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: `1px solid rgba(17,25,21,0.08)`,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: colors.forest,
            color: colors.paper,
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
                background:
                  "linear-gradient(135deg, #1D5A4B, #103D34)",
                border:
                  "1px solid rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
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
                  fontSize: "14px",
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
                  fontSize: "10px",
                  marginTop: "5px",
                  color: "rgba(255,255,255,0.62)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: loading
                      ? colors.champagneSoft
                      : "#78C7A9",
                  }}
                />

                {loading ? "Typing..." : "Available now"}
              </div>
            </div>
          </div>

          <button
            onClick={startNewConversation}
            disabled={loading}
            title="Start new conversation"
            style={{
              border:
                "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.06)",
              color: colors.paper,
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontSize: "18px",
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
            padding: "24px 18px 28px",
            background: colors.ivorySoft,
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "9px",
                fontWeight: "800",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: colors.champagne,
              }}
            >
              Private property concierge
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
                      background: colors.forest,
                      color: colors.paper,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
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
                      ? "#E8E4D8"
                      : colors.paper,
                    color: colors.ink,
                    padding: "11px 14px",
                    borderRadius: isUser
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    maxWidth: "78%",
                    whiteSpace: "pre-line",
                    fontSize: "13px",
                    lineHeight: "1.55",
                    boxShadow:
                      "0 2px 8px rgba(17,25,21,0.05)",
                    border: `1px solid rgba(17,25,21,0.04)`,
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
                  background: colors.forest,
                  color: colors.paper,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: "800",
                  marginRight: "8px",
                }}
              >
                N
              </div>

              <div
                style={{
                  background: colors.paper,
                  borderRadius: "16px",
                  padding: "11px 14px",
                  color: "#847F73",
                  letterSpacing: "2px",
                  border: `1px solid rgba(17,25,21,0.04)`,
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
            padding: "13px 14px 16px",
            background: colors.paper,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#F4F1E9",
              border: `1px solid rgba(17,25,21,0.07)`,
              borderRadius: "999px",
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
              placeholder="Ask NOMAD..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "13px",
                color: colors.ink,
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                border: "none",
                width: "40px",
                height: "40px",
                background: colors.forest,
                color: colors.paper,
                borderRadius: "50%",
                cursor:
                  loading || !input.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loading || !input.trim()
                    ? 0.38
                    : 1,
                fontSize: "15px",
              }}
            >
              ↑
            </button>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "9px",
              fontSize: "9px",
              color: "#999287",
              letterSpacing: "0.45px",
            }}
          >
            Intelligent qualification · Real-time lead capture
          </div>
        </div>
      </div>
    </main>
  );
}

function BrandMark({ dark = false }) {
  return (
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
          borderRadius: "50%",
          background: dark
            ? colors.champagne
            : colors.forest,
          color: dark
            ? colors.ink
            : colors.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "800",
          fontSize: "15px",
          boxShadow: dark
            ? "none"
            : "0 10px 26px rgba(12,51,43,0.14)",
        }}
      >
        N
      </div>

      <div>
        <div
          style={{
            fontWeight: "800",
            fontSize: "16px",
            letterSpacing: "0.4px",
            color: dark
              ? colors.paper
              : colors.ink,
          }}
        >
          NOMAD
        </div>

        <div
          style={{
            fontSize: "9px",
            color: dark
              ? "rgba(255,255,255,0.48)"
              : "#7A817C",
            letterSpacing: "1.55px",
            textTransform: "uppercase",
            marginTop: "2px",
          }}
        >
          Property Intelligence
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div
      style={{
        paddingTop: "18px",
      }}
    >
      <div
        style={{
          fontSize: "17px",
          fontWeight: "800",
          color: colors.forest,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "4px",
          color: "#858C87",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.85px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function PreviewBubblePremium({
  children,
  left = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: left
          ? "flex-start"
          : "flex-end",
        marginBottom: "13px",
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
            ? colors.paper
            : "#E8E4D8",
          color: "#2E3833",
          fontSize: "11px",
          lineHeight: "1.55",
          border:
            "1px solid rgba(17,25,21,0.04)",
          boxShadow:
            "0 3px 8px rgba(17,25,21,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FloatingTag({
  eyebrow,
  text,
  style = {},
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        minWidth: "118px",
        borderRadius: "12px",
        background: "rgba(255,253,248,0.90)",
        border: `1px solid rgba(17,25,21,0.07)`,
        boxShadow:
          "0 14px 34px rgba(17,25,21,0.10)",
        backdropFilter: "blur(14px)",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: "8px",
          textTransform: "uppercase",
          letterSpacing: "1.1px",
          color: colors.champagne,
          fontWeight: "800",
        }}
      >
        {eyebrow}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "11px",
          color: colors.forest,
          fontWeight: "700",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function EditorialFeature({
  number,
  title,
  text,
}) {
  return (
    <div
      style={{
        padding: "32px 26px 16px 0",
        borderRight:
          "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: colors.champagneSoft,
          fontSize: "9px",
          letterSpacing: "1.4px",
          fontWeight: "800",
          marginBottom: "28px",
        }}
      >
        {number}
      </div>

      <div
        style={{
          fontSize: "16px",
          fontWeight: "700",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "12px",
          lineHeight: "1.7",
          color: "rgba(255,255,255,0.54)",
          maxWidth: "280px",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  text,
}) {
  return (
    <div
      style={{
        background: colors.paper,
        padding: "26px 24px 28px",
        minHeight: "190px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: colors.champagne,
          fontWeight: "800",
          letterSpacing: "1.3px",
        }}
      >
        {number}
      </div>

      <div
        style={{
          marginTop: "34px",
          fontSize: "17px",
          fontWeight: "750",
          color: colors.forest,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "12px",
          lineHeight: "1.65",
          color: "#78817B",
        }}
      >
        {text}
      </div>
    </div>
  );
}
