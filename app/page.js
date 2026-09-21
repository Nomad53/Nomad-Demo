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
  ink: "#101814",
  forest: "#082F27",
  forest2: "#0D4539",
  emerald: "#0B7663",
  champagne: "#B99862",
  champagneSoft: "#D8C6A6",
  sage: "#82918A",
  line: "rgba(16,24,20,0.10)",
};

const dubaiHero =
  "https://images.unsplash.com/photo-1634007626524-f47fa37810a7?auto=format&fit=crop&fm=jpg&q=88&w=2600";

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const [leadMemory, setLeadMemory] = useState(initialLeadMemory);

  // NEW:
  // Controls the structured lead summary panel.
  const [showLeadSummary, setShowLeadSummary] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!showDemo) return;

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, showDemo, leadSaved]);

  function openDemo() {
    setShowDemo(true);
  }

  function backToLanding() {
    if (loading) return;

    setShowLeadSummary(false);
    setShowDemo(false);
  }

  function startNewConversation() {
    if (loading) return;

    setMessages(initialMessages);
    setInput("");
    setLoading(false);
    setLeadSaved(false);
    setLeadMemory(initialLeadMemory);
    setShowLeadSummary(false);
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
          background: colors.ivorySoft,
          color: colors.ink,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        }}
      >
        <style>{`
          * {
            box-sizing: border-box;
          }

          html {
            scroll-behavior: smooth;
          }

          body {
            margin: 0;
          }

          button,
          a {
            font-family: inherit;
          }

          .nomadButton {
            transition:
              transform .22s ease,
              box-shadow .22s ease,
              background .22s ease;
          }

          .nomadButton:hover {
            transform: translateY(-2px);
          }

          .nomadGlass {
            transition:
              transform .35s ease,
              box-shadow .35s ease;
          }

          .nomadGlass:hover {
            transform: translateY(-5px);
            box-shadow:
              0 45px 110px rgba(0,0,0,.22),
              0 12px 40px rgba(5,45,35,.16);
          }

          .navLink {
            color: #2E3934;
            text-decoration: none;
            font-size: 10px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            font-weight: 700;
            position: relative;
            padding: 8px 0;
            transition: color .2s ease;
          }

          .navLink::after {
            content: "";
            position: absolute;
            left: 0;
            bottom: 2px;
            width: 0;
            height: 1px;
            background: #A9844D;
            transition: width .25s ease;
          }

          .navLink:hover {
            color: #082F27;
          }

          .navLink:hover::after {
            width: 100%;
          }

          @keyframes floatNomad {
            0% {
              transform: translateY(0px);
            }

            50% {
              transform: translateY(-9px);
            }

            100% {
              transform: translateY(0px);
            }
          }

          @keyframes glowPulse {
            0%, 100% {
              opacity: .45;
              transform: scale(1);
            }

            50% {
              opacity: .72;
              transform: scale(1.05);
            }
          }

          @keyframes successIn {
            0% {
              opacity: 0;
              transform: translateY(14px) scale(.985);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes successCheck {
            0% {
              transform: scale(.6);
              opacity: 0;
            }

            60% {
              transform: scale(1.1);
            }

            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @media (max-width: 960px) {
            .heroGrid {
              grid-template-columns: 1fr !important;
            }

            .heroContent {
              padding-top: 30px !important;
            }

            .heroPreview {
              min-height: 570px !important;
            }

            .desktopNavLinks {
              display: none !important;
            }
          }

          @media (max-width: 600px) {
            .heroSection {
              padding-left: 18px !important;
              padding-right: 18px !important;
            }

            .heroTitle {
              font-size: 48px !important;
              letter-spacing: -2.5px !important;
            }

            .heroStats {
              grid-template-columns: 1fr 1fr !important;
            }

            .floatingIntent,
            .floatingStatus {
              display: none !important;
            }

            .previewCard {
              max-width: 100% !important;
            }
          }
        `}</style>

        {/* HERO */}

        <section
          style={{
            minHeight: "100vh",
            position: "relative",
            overflow: "hidden",
            backgroundImage: `url("${dubaiHero}")`,
            backgroundSize: "cover",
            backgroundPosition: "center 48%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(248,244,235,.98) 0%, rgba(248,244,235,.94) 28%, rgba(248,244,235,.72) 49%, rgba(248,244,235,.28) 72%, rgba(8,40,33,.10) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,252,245,.25), transparent 45%, rgba(8,32,27,.22))",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              right: "13%",
              top: "13%",
              background:
                "radial-gradient(circle, rgba(195,159,99,.22), rgba(195,159,99,.05) 46%, transparent 72%)",
              filter: "blur(12px)",
              animation: "glowPulse 8s ease-in-out infinite",
            }}
          />

          <nav
            style={{
              maxWidth: "1360px",
              margin: "0 auto",
              padding: "28px 38px",
              position: "relative",
              zIndex: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <BrandMark />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "34px",
              }}
            >
              <div
                className="desktopNavLinks"
                style={{
                  display: "flex",
                  gap: "30px",
                  alignItems: "center",
                }}
              >
                <a href="#solutions" className="navLink">
                  Solutions
                </a>

                <a href="#for-teams" className="navLink">
                  For Teams
                </a>

                <a href="#how-it-works" className="navLink">
                  How It Works
                </a>
              </div>

              <button
                className="nomadButton"
                onClick={openDemo}
                style={{
                  border: "1px solid rgba(211,181,126,.68)",
                  background:
                    "linear-gradient(135deg, #082F27, #0D483B)",
                  color: "white",
                  padding: "13px 21px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontWeight: "800",
                  fontSize: "12px",
                  boxShadow:
                    "0 14px 38px rgba(8,47,39,.20)",
                }}
              >
                Enter Live Experience
                <span style={{ marginLeft: "12px" }}>↗</span>
              </button>
            </div>
          </nav>

          <div
            className="heroSection"
            style={{
              width: "100%",
              maxWidth: "1360px",
              margin: "0 auto",
              padding: "66px 38px 72px",
              position: "relative",
              zIndex: 5,
            }}
          >
            <div
              className="heroGrid"
              style={{
                display: "grid",
                gridTemplateColumns: "1.02fr .98fr",
                gap: "76px",
                alignItems: "center",
              }}
            >
              <div className="heroContent">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#A57F43",
                    textTransform: "uppercase",
                    letterSpacing: "1.8px",
                    fontSize: "10px",
                    fontWeight: "800",
                    marginBottom: "28px",
                  }}
                >
                  <span
                    style={{
                      width: "34px",
                      height: "1px",
                      background: "#A57F43",
                    }}
                  />

                  Intelligent Property Qualification
                </div>

                <h1
                  className="heroTitle"
                  style={{
                    margin: 0,
                    maxWidth: "680px",
                    fontSize: "clamp(62px, 6vw, 94px)",
                    lineHeight: ".94",
                    letterSpacing: "-5px",
                    fontWeight: "710",
                  }}
                >
                  Every enquiry
                  <br />
                  deserves a
                  <br />

                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "7px",
                      fontFamily:
                        'Georgia, "Times New Roman", serif',
                      fontWeight: "400",
                      fontStyle: "italic",
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
                    margin: "32px 0 0",
                    color: "#5D6862",
                    fontSize: "16px",
                    lineHeight: "1.75",
                  }}
                >
                  NOMAD qualifies buyers and tenants naturally,
                  understands intent in real time, structures every
                  requirement, and hands your sales team an
                  opportunity ready for action.
                </p>

                <div
                  style={{
                    marginTop: "36px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <button
                    className="nomadButton"
                    onClick={openDemo}
                    style={{
                      border: "none",
                      background: colors.forest,
                      color: "white",
                      borderRadius: "999px",
                      padding: "16px 25px",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: "pointer",
                      boxShadow:
                        "0 17px 38px rgba(8,47,39,.22)",
                    }}
                  >
                    Experience NOMAD
                    <span style={{ marginLeft: "13px" }}>→</span>
                  </button>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#696F6B",
                    }}
                  >
                    No forms. No scripts. Just conversation.
                  </div>
                </div>

                <div
                  className="heroStats"
                  style={{
                    marginTop: "56px",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, minmax(100px,1fr))",
                    maxWidth: "570px",
                    borderTop:
                      "1px solid rgba(17,25,21,.13)",
                  }}
                >
                  <Metric
                    value="24/7"
                    label="Qualification"
                  />

                  <Metric
                    value="Live"
                    label="Lead capture"
                  />

                  <Metric
                    value="Instant"
                    label="Sales handoff"
                  />
                </div>
              </div>

              <div
                className="heroPreview"
                style={{
                  minHeight: "620px",
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "78%",
                    height: "82%",
                    right: "-2%",
                    top: "4%",
                    border:
                      "1px solid rgba(201,166,106,.35)",
                    borderRadius: "240px 240px 24px 24px",
                  }}
                />

                <div
                  className="previewCard nomadGlass"
                  style={{
                    width: "100%",
                    maxWidth: "465px",
                    borderRadius: "26px",
                    overflow: "hidden",
                    background:
                      "rgba(255,253,248,.91)",
                    backdropFilter: "blur(20px)",
                    border:
                      "1px solid rgba(255,255,255,.72)",
                    boxShadow:
                      "0 38px 95px rgba(11,31,26,.24), 0 10px 30px rgba(7,55,44,.10)",
                    position: "relative",
                    zIndex: 3,
                    animation:
                      "floatNomad 8s ease-in-out infinite",
                  }}
                >
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg,#062F27,#0A473A)",
                      color: "white",
                      padding: "19px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
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
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "linear-gradient(135deg,#226654,#0F4035)",
                          border:
                            "1px solid rgba(255,255,255,.14)",
                          fontWeight: "800",
                          fontSize: "13px",
                        }}
                      >
                        N
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "750",
                          }}
                        >
                          NOMAD Property Assistant
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "10px",
                            color:
                              "rgba(255,255,255,.64)",
                          }}
                        >
                          <span
                            style={{
                              color: "#69C19B",
                            }}
                          >
                            ●
                          </span>{" "}
                          Available now
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        color: "#D6BC8E",
                        fontSize: "9px",
                        fontWeight: "800",
                        letterSpacing: "1.4px",
                      }}
                    >
                      LIVE
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "28px 24px",
                      background:
                        "rgba(253,250,244,.94)",
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
                        marginTop: "27px",
                        paddingTop: "18px",
                        borderTop:
                          "1px solid rgba(16,24,20,.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#A9844D",
                            fontSize: "9px",
                            letterSpacing: "1.35px",
                            textTransform: "uppercase",
                            fontWeight: "800",
                          }}
                        >
                          Qualification engine
                        </div>

                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "13px",
                            fontWeight: "750",
                            color: colors.forest,
                          }}
                        >
                          Requirement captured
                        </div>

                        <div
                          style={{
                            marginTop: "3px",
                            color: "#7C847F",
                            fontSize: "10px",
                          }}
                        >
                          Structured automatically in real time
                        </div>
                      </div>

                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: colors.forest,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "800",
                        }}
                      >
                        ✓
                      </div>
                    </div>
                  </div>
                </div>

                <FloatingTag
                  className="floatingIntent"
                  style={{
                    position: "absolute",
                    top: "100px",
                    left: "-8px",
                    zIndex: 4,
                  }}
                  eyebrow="LIVE INTENT"
                  text="Buy · Villa"
                />

                <FloatingTag
                  className="floatingStatus"
                  style={{
                    position: "absolute",
                    right: "-5px",
                    bottom: "90px",
                    zIndex: 4,
                  }}
                  eyebrow="LEAD STATUS"
                  text="Qualified"
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                color: "#9A7844",
                fontSize: "9px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "1.7px",
              }}
            >
              <span
                style={{
                  width: "38px",
                  height: "1px",
                  background: "#A9844D",
                }}
              />

              Built for Dubai&apos;s real estate teams
            </div>
          </div>
        </section>

        {/* POSITIONING */}

        <section
          id="solutions"
          style={{
            background: colors.forest,
            color: "white",
            position: "relative",
            overflow: "hidden",
            padding: "82px 34px 76px",
            scrollMarginTop: "20px",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "540px",
              height: "540px",
              right: "-180px",
              top: "-200px",
              borderRadius: "50%",
              border:
                "1px solid rgba(211,185,137,.14)",
            }}
          />

          <div
            style={{
              maxWidth: "1180px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <div
              style={{
                color: colors.champagneSoft,
                fontSize: "10px",
                fontWeight: "800",
                letterSpacing: "1.7px",
                textTransform: "uppercase",
                marginBottom: "18px",
              }}
            >
              Designed for the modern brokerage
            </div>

            <h2
              style={{
                maxWidth: "980px",
                margin: 0,
                fontSize: "clamp(40px,4.3vw,60px)",
                lineHeight: "1.03",
                letterSpacing: "-2.6px",
                fontWeight: "620",
              }}
            >
              Not another chatbot.
              <br />

              <span
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                  fontWeight: "400",
                  fontStyle: "italic",
                  color: colors.champagneSoft,
                }}
              >
                The intelligence layer
              </span>{" "}
              between your enquiry and your sales team.
            </h2>

            <div
              id="for-teams"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(230px,1fr))",
                marginTop: "52px",
                borderTop:
                  "1px solid rgba(255,255,255,.10)",
                scrollMarginTop: "28px",
              }}
            >
              <EditorialFeature
                number="01"
                title="Understands naturally"
                text="NOMAD adapts to the customer instead of forcing them through a rigid form or scripted decision tree."
              />

              <EditorialFeature
                number="02"
                title="Structures automatically"
                text="Property type, budget, location, timing, financing and contact details become usable sales intelligence."
              />

              <EditorialFeature
                number="03"
                title="Hands off intelligently"
                text="Your consultant receives a qualified opportunity with context before the first human call."
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}

        <section
          id="how-it-works"
          style={{
            background: colors.ivorySoft,
            padding: "92px 34px 96px",
            scrollMarginTop: "20px",
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
                  "repeat(auto-fit,minmax(300px,1fr))",
                gap: "70px",
                alignItems: "end",
              }}
            >
              <div>
                <div
                  style={{
                    color: colors.champagne,
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "1.7px",
                    fontWeight: "800",
                    marginBottom: "18px",
                  }}
                >
                  The NOMAD journey
                </div>

                <h2
                  style={{
                    fontSize: "clamp(40px,4vw,56px)",
                    lineHeight: "1.04",
                    letterSpacing: "-2.2px",
                    margin: 0,
                    fontWeight: "640",
                  }}
                >
                  From hello to
                  <br />
                  sales-ready.
                </h2>
              </div>

              <p
                style={{
                  margin: 0,
                  maxWidth: "490px",
                  fontSize: "15px",
                  lineHeight: "1.8",
                  color: "#66716B",
                }}
              >
                Every conversation becomes useful before a
                consultant ever needs to step in. NOMAD captures
                intent, qualifies the opportunity, structures the
                data and creates the handoff.
              </p>
            </div>

            <div
              style={{
                marginTop: "54px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(220px,1fr))",
                background: colors.line,
                gap: "1px",
                border: `1px solid ${colors.line}`,
              }}
            >
              <ProcessStep
                number="01"
                title="Enquiry"
                text="A buyer or tenant begins a natural conversation."
              />

              <ProcessStep
                number="02"
                title="Qualification"
                text="NOMAD understands property requirements and intent."
              />

              <ProcessStep
                number="03"
                title="Intelligence"
                text="Conversation becomes structured lead data automatically."
              />

              <ProcessStep
                number="04"
                title="Handoff"
                text="Your sales team receives a qualified opportunity ready to act."
              />
            </div>

            <div
              style={{
                marginTop: "56px",
                textAlign: "center",
              }}
            >
              <button
                className="nomadButton"
                onClick={openDemo}
                style={{
                  border: "none",
                  background: colors.forest,
                  color: "white",
                  borderRadius: "999px",
                  padding: "16px 28px",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow:
                    "0 18px 38px rgba(8,47,39,.18)",
                }}
              >
                Start a live conversation
                <span style={{ marginLeft: "12px" }}>↗</span>
              </button>
            </div>
          </div>
        </section>

        <footer
          style={{
            background: colors.ink,
            padding: "31px 34px",
          }}
        >
          <div
            style={{
              maxWidth: "1180px",
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <BrandMark dark />

            <div
              style={{
                color: "rgba(255,255,255,.46)",
                fontSize: "10px",
                letterSpacing: ".35px",
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

  /*
    ======================================================
    LIVE DEMO
    ======================================================
  */

  const qualifiedLead = leadMemory?.lead || {};

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 78% 18%, rgba(184,154,103,.15), transparent 30%), linear-gradient(135deg,#F5F0E7,#FBF9F4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        padding: "20px",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes successIn {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes checkPop {
          0% {
            transform: scale(.55);
            opacity: 0;
          }

          65% {
            transform: scale(1.1);
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <button
        onClick={backToLanding}
        disabled={loading}
        style={{
          position: "fixed",
          top: "22px",
          left: "22px",
          zIndex: 10,
          border: `1px solid ${colors.line}`,
          background: "rgba(255,253,248,.88)",
          color: colors.forest,
          padding: "10px 15px",
          borderRadius: "999px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "800",
          fontSize: "11px",
          boxShadow:
            "0 8px 22px rgba(16,24,20,.05)",
          backdropFilter: "blur(12px)",
        }}
      >
        ← Back to NOMAD
      </button>

      <div
        style={{
          width: "100%",
          maxWidth: "470px",
          height: "min(730px, calc(100vh - 40px))",
          minHeight: "580px",
          background: colors.paper,
          borderRadius: "28px",
          boxShadow:
            "0 35px 90px rgba(16,24,20,.17)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border:
            "1px solid rgba(16,24,20,.08)",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background: colors.forest,
            color: "white",
            padding: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg,#206250,#0F4035)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                marginRight: "12px",
              }}
            >
              N
            </div>

            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "750",
                }}
              >
                NOMAD Property Assistant
              </div>

              <div
                style={{
                  marginTop: "4px",
                  color: "rgba(255,255,255,.62)",
                  fontSize: "10px",
                }}
              >
                <span
                  style={{
                    color: loading
                      ? "#D4C2A1"
                      : "#71C3A3",
                  }}
                >
                  ●
                </span>{" "}
                {loading ? "Typing..." : "Available now"}
              </div>
            </div>
          </div>

          <button
            onClick={startNewConversation}
            disabled={loading}
            title="Start a new conversation"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border:
                "1px solid rgba(255,255,255,.14)",
              background:
                "rgba(255,255,255,.06)",
              color: "white",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontSize: "18px",
            }}
          >
            ↻
          </button>
        </div>

        {/* CHAT BODY */}

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
              color: colors.champagne,
              fontSize: "9px",
              fontWeight: "800",
              letterSpacing: "1.3px",
              textTransform: "uppercase",
            }}
          >
            Private Property Concierge
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
                      color: "white",
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
                      ? "#E8E3D7"
                      : colors.paper,
                    color: colors.ink,
                    padding: "11px 14px",
                    borderRadius: isUser
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    maxWidth: "78%",
                    fontSize: "13px",
                    lineHeight: "1.55",
                    whiteSpace: "pre-line",
                    boxShadow:
                      "0 2px 8px rgba(16,24,20,.05)",
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
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: colors.forest,
                  color: "white",
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
                  padding: "11px 14px",
                  borderRadius: "16px",
                  background: colors.paper,
                  color: "#8B8579",
                  letterSpacing: "2px",
                }}
              >
                •••
              </div>
            </div>
          )}

          {/* NEW QUALIFIED SUCCESS MOMENT */}

          {leadSaved && (
            <div
              style={{
                marginTop: "22px",
                animation:
                  "successIn .45s ease-out both",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg,#0A392F,#0B4B3D)",
                  color: "white",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow:
                    "0 18px 38px rgba(8,47,39,.15)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: "-40px",
                    top: "-60px",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    border:
                      "1px solid rgba(216,198,166,.18)",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "13px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        "rgba(255,255,255,.10)",
                      border:
                        "1px solid rgba(255,255,255,.14)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "15px",
                      animation:
                        "checkPop .5s ease-out both",
                    }}
                  >
                    ✓
                  </div>

                  <div>
                    <div
                      style={{
                        color: colors.champagneSoft,
                        textTransform: "uppercase",
                        letterSpacing: "1.25px",
                        fontSize: "8px",
                        fontWeight: "800",
                      }}
                    >
                      Qualification complete
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "16px",
                        fontWeight: "750",
                      }}
                    >
                      Lead qualified
                    </div>

                    <div
                      style={{
                        marginTop: "7px",
                        color:
                          "rgba(255,255,255,.64)",
                        fontSize: "11px",
                        lineHeight: "1.6",
                      }}
                    >
                      Requirement captured · Callback scheduled ·
                      Consultant handoff ready
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setShowLeadSummary(true)
                  }
                  style={{
                    width: "100%",
                    marginTop: "17px",
                    border:
                      "1px solid rgba(255,255,255,.14)",
                    background:
                      "rgba(255,255,255,.08)",
                    color: "white",
                    borderRadius: "12px",
                    padding: "11px 14px",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: ".35px",
                  }}
                >
                  View Lead Summary →
                </button>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* COMPOSER */}

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
              padding: "5px 5px 5px 16px",
              background: "#F3EFE7",
              borderRadius: "999px",
              border:
                "1px solid rgba(16,24,20,.07)",
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
              placeholder={
                leadSaved
                  ? "Lead qualified"
                  : "Ask NOMAD..."
              }
              disabled={loading || leadSaved}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "10px 0",
                fontSize: "13px",
                color: colors.ink,
                opacity: leadSaved ? 0.5 : 1,
              }}
            />

            <button
              onClick={sendMessage}
              disabled={
                loading ||
                !input.trim() ||
                leadSaved
              }
              style={{
                width: "40px",
                height: "40px",
                border: "none",
                borderRadius: "50%",
                background: colors.forest,
                color: "white",
                fontSize: "15px",
                cursor:
                  loading ||
                  !input.trim() ||
                  leadSaved
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loading ||
                  !input.trim() ||
                  leadSaved
                    ? 0.3
                    : 1,
              }}
            >
              ↑
            </button>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "9px",
              color: "#999186",
              fontSize: "9px",
              letterSpacing: ".4px",
            }}
          >
            Intelligent qualification · Real-time lead capture
          </div>
        </div>
      </div>

      {/* NEW LEAD SUMMARY MODAL */}

      {showLeadSummary && (
        <LeadSummaryModal
          lead={qualifiedLead}
          onClose={() =>
            setShowLeadSummary(false)
          }
          onNewConversation={() => {
            setShowLeadSummary(false);
            startNewConversation();
          }}
        />
      )}
    </main>
  );
}

/* ======================================================
   COMPONENTS
   ====================================================== */

function BrandMark({ dark = false }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: dark
            ? colors.champagne
            : colors.forest,
          color: dark ? colors.ink : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "800",
          fontSize: "14px",
          boxShadow: dark
            ? "none"
            : "0 12px 28px rgba(8,47,39,.16)",
        }}
      >
        N
      </div>

      <div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "850",
            letterSpacing: "1px",
            color: dark
              ? "white"
              : colors.ink,
          }}
        >
          NOMAD
        </div>

        <div
          style={{
            marginTop: "2px",
            color: dark
              ? "rgba(255,255,255,.44)"
              : "#757D78",
            fontSize: "8px",
            letterSpacing: "1.8px",
            textTransform: "uppercase",
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
          color: colors.forest,
          fontSize: "17px",
          fontWeight: "850",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#7F8882",
          marginTop: "4px",
          fontSize: "9px",
          textTransform: "uppercase",
          letterSpacing: "1px",
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
          maxWidth: "80%",
          padding: "11px 13px",
          borderRadius: left
            ? "14px 14px 14px 4px"
            : "14px 14px 4px 14px",
          background: left
            ? colors.paper
            : "#E9E4D8",
          color: "#303A35",
          fontSize: "11px",
          lineHeight: "1.55",
          boxShadow:
            "0 3px 9px rgba(16,24,20,.045)",
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
  className = "",
  style = {},
}) {
  return (
    <div
      className={className}
      style={{
        minWidth: "122px",
        padding: "12px 14px",
        background:
          "rgba(255,253,248,.92)",
        backdropFilter: "blur(14px)",
        borderRadius: "12px",
        border:
          "1px solid rgba(16,24,20,.07)",
        boxShadow:
          "0 15px 35px rgba(16,24,20,.12)",
        ...style,
      }}
    >
      <div
        style={{
          color: colors.champagne,
          fontSize: "8px",
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          fontWeight: "850",
        }}
      >
        {eyebrow}
      </div>

      <div
        style={{
          marginTop: "5px",
          color: colors.forest,
          fontSize: "11px",
          fontWeight: "750",
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
        padding: "28px 32px 30px 0",
        borderRight:
          "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div
        style={{
          color: colors.champagneSoft,
          fontSize: "9px",
          letterSpacing: "1.4px",
          fontWeight: "800",
          marginBottom: "22px",
        }}
      >
        {number}
      </div>

      <div
        style={{
          fontSize: "17px",
          fontWeight: "700",
        }}
      >
        {title}
      </div>

      <div
        style={{
          maxWidth: "285px",
          marginTop: "10px",
          fontSize: "12px",
          lineHeight: "1.7",
          color: "rgba(255,255,255,.52)",
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
        minHeight: "180px",
      }}
    >
      <div
        style={{
          color: colors.champagne,
          fontSize: "9px",
          fontWeight: "850",
          letterSpacing: "1.3px",
        }}
      >
        {number}
      </div>

      <div
        style={{
          marginTop: "30px",
          color: colors.forest,
          fontSize: "17px",
          fontWeight: "780",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "9px",
          color: "#77817B",
          fontSize: "12px",
          lineHeight: "1.65",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/*
  ======================================================
  NEW: STRUCTURED LEAD SUMMARY
  ======================================================
*/

function LeadSummaryModal({
  lead,
  onClose,
  onNewConversation,
}) {
  const rows = [
    ["Intent", lead.intent],
    ["Property", lead.property_type],
    ["Bedrooms", lead.bedrooms],
    ["Budget", lead.budget],
    ["Location", lead.location],
    ["Property status", lead.property_status],
    ["Financing", lead.financing],
    ["Timeline", lead.timeline],
    ["Name", lead.name],
    ["Phone", lead.phone],
    ["Callback", lead.callback_time],
  ].filter(([, value]) => value);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background:
          "rgba(8,20,17,.58)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation:
          "successIn .28s ease-out both",
      }}
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        style={{
          width: "100%",
          maxWidth: "510px",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          background: colors.paper,
          borderRadius: "26px",
          boxShadow:
            "0 40px 100px rgba(0,0,0,.30)",
          border:
            "1px solid rgba(255,255,255,.55)",
        }}
      >
        <div
          style={{
            padding: "24px 24px 22px",
            background: colors.forest,
            color: "white",
            borderRadius:
              "26px 26px 0 0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "170px",
              height: "170px",
              borderRadius: "50%",
              right: "-55px",
              top: "-80px",
              border:
                "1px solid rgba(216,198,166,.18)",
            }}
          />

          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: "18px",
              top: "18px",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border:
                "1px solid rgba(255,255,255,.14)",
              background:
                "rgba(255,255,255,.06)",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
              zIndex: 2,
            }}
          >
            ×
          </button>

          <div
            style={{
              color: colors.champagneSoft,
              textTransform: "uppercase",
              fontSize: "8px",
              fontWeight: "800",
              letterSpacing: "1.35px",
            }}
          >
            NOMAD qualification
          </div>

          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "11px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background:
                  "rgba(255,255,255,.09)",
                border:
                  "1px solid rgba(255,255,255,.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
              }}
            >
              ✓
            </div>

            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "750",
                }}
              >
                Qualified Lead
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color:
                    "rgba(255,255,255,.58)",
                  fontSize: "10px",
                }}
              >
                Ready for consultant follow-up
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "22px 24px 25px",
          }}
        >
          {lead.summary && (
            <div
              style={{
                marginBottom: "22px",
                padding: "15px 16px",
                background: "#F3EFE6",
                borderRadius: "14px",
                color: "#59635D",
                fontSize: "12px",
                lineHeight: "1.65",
              }}
            >
              {lead.summary}
            </div>
          )}

          <div
            style={{
              color: colors.champagne,
              textTransform: "uppercase",
              letterSpacing: "1.25px",
              fontSize: "8px",
              fontWeight: "800",
              marginBottom: "7px",
            }}
          >
            Captured requirements
          </div>

          <div>
            {rows.map(
              ([label, value], index) => (
                <div
                  key={label}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "135px 1fr",
                    gap: "18px",
                    padding: "12px 0",
                    borderBottom:
                      index === rows.length - 1
                        ? "none"
                        : `1px solid ${colors.line}`,
                  }}
                >
                  <div
                    style={{
                      color: "#8A918C",
                      fontSize: "10px",
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      color: colors.forest,
                      fontSize: "11px",
                      fontWeight: "700",
                      textAlign: "right",
                    }}
                  >
                    {formatLeadValue(
                      label,
                      value
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "13px 14px",
              borderRadius: "13px",
              background: "#EDF4F0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: colors.forest,
                color: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              ✓
            </div>

            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  color: colors.forest,
                }}
              >
                Consultant handoff ready
              </div>

              <div
                style={{
                  marginTop: "2px",
                  color: "#77827C",
                  fontSize: "9px",
                }}
              >
                Lead captured and sent to the sales workflow
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${colors.line}`,
                background: "white",
                color: colors.forest,
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              Back to Conversation
            </button>

            <button
              onClick={onNewConversation}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: colors.forest,
                color: "white",
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              New Conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatLeadValue(label, value) {
  if (!value) return "";

  if (
    label === "Intent" ||
    label === "Property" ||
    label === "Property status" ||
    label === "Financing"
  ) {
    return String(value)
      .replaceAll("-", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  return String(value);
}
