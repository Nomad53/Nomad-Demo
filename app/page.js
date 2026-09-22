"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

/* =========================================================
   NOMAD
   Premium interactive proptech experience
   ========================================================= */

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
  forest3: "#164F42",

  emerald: "#0B7663",
  emerald2: "#15A087",

  champagne: "#B99862",
  champagneSoft: "#D8C6A6",
  champagneLight: "#E9DDC8",

  sage: "#82918A",

  line: "rgba(16,24,20,0.10)",
  lineLight: "rgba(255,255,255,0.10)",
};

const dubaiHero =
  "https://images.unsplash.com/photo-1634007626524-f47fa37810a7?auto=format&fit=crop&fm=jpg&q=90&w=2800";

/* =========================================================
   DEMO DATA
   ========================================================= */

const intelligenceStages = [
  {
    eyebrow: "Incoming enquiry",
    title: "Natural language",
    value:
      "Looking for a 3-bedroom villa in Dubai Hills around AED 4M. Mortgage. Ready or off-plan is fine.",
    accent: "Conversation",
  },
  {
    eyebrow: "Intent detected",
    title: "Purchase",
    value: "BUY",
    accent: "Intent",
  },
  {
    eyebrow: "Requirement understood",
    title: "Villa",
    value: "3 Bedrooms",
    accent: "Property",
  },
  {
    eyebrow: "Financial context",
    title: "AED 4M",
    value: "Mortgage",
    accent: "Budget",
  },
  {
    eyebrow: "Location context",
    title: "Dubai Hills",
    value: "Ready + Off-plan",
    accent: "Preference",
  },
  {
    eyebrow: "Qualification state",
    title: "Ready for handoff",
    value: "QUALIFIED",
    accent: "Sales",
  },
];

const channelData = [
  {
    id: "whatsapp",
    number: "01",
    title: "WhatsApp",
    description:
      "Meet buyers and tenants where conversations already happen.",
    short: "WA",
  },
  {
    id: "website",
    number: "02",
    title: "Website",
    description:
      "Turn anonymous website enquiries into structured opportunities.",
    short: "WEB",
  },
  {
    id: "campaign",
    number: "03",
    title: "Campaign Leads",
    description:
      "Qualify inbound campaign demand before it reaches the sales floor.",
    short: "ADS",
  },
  {
    id: "portal",
    number: "04",
    title: "Property Portals",
    description:
      "Bring fragmented property enquiries into one qualification layer.",
    short: "PORTAL",
  },
];

const commandCenterLeads = [
  {
    initials: "TM",
    name: "Taher M.",
    request: "3BR Villa · Dubai Hills",
    budget: "AED 4M",
    status: "Qualified",
    source: "WhatsApp",
    age: "Now",
  },
  {
    initials: "SA",
    name: "Sara A.",
    request: "2BR Apartment · Marina",
    budget: "AED 180K / year",
    status: "Qualified",
    source: "Website",
    age: "2m",
  },
  {
    initials: "MK",
    name: "Mohammed K.",
    request: "Townhouse · Open location",
    budget: "AED 2.8M",
    status: "In progress",
    source: "Campaign",
    age: "5m",
  },
  {
    initials: "RN",
    name: "Rania N.",
    request: "1BR Apartment · Downtown",
    budget: "AED 1.7M",
    status: "Callback due",
    source: "Portal",
    age: "12m",
  },
];

/* =========================================================
   MAIN
   ========================================================= */

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const [leadMemory, setLeadMemory] =
    useState(initialLeadMemory);

  const [pointer, setPointer] = useState({
    x: 0,
    y: 0,
  });

  const [intelligenceStage, setIntelligenceStage] =
    useState(0);

  const [perspective, setPerspective] =
    useState("customer");

  const [activeChannel, setActiveChannel] =
    useState("whatsapp");

  const [dashboardHover, setDashboardHover] =
    useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!showDemo) return;

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    messages,
    loading,
    showDemo,
    leadSaved,
  ]);

  useEffect(() => {
    if (!showDemo) return;
    if (loading) return;
    if (leadSaved) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus({
        preventScroll: true,
      });
    });

    return () =>
      cancelAnimationFrame(frame);
  }, [
    loading,
    showDemo,
    leadSaved,
  ]);

  useEffect(() => {
    if (showDemo) return;

    const interval =
      window.setInterval(() => {
        setIntelligenceStage(
          (current) =>
            (current + 1) %
            intelligenceStages.length
        );
      }, 2200);

    return () =>
      window.clearInterval(interval);
  }, [showDemo]);

  function handleHeroPointer(event) {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const x =
      (event.clientX - rect.left) /
        rect.width -
      0.5;

    const y =
      (event.clientY - rect.top) /
        rect.height -
      0.5;

    setPointer({
      x,
      y,
    });
  }

  function resetHeroPointer() {
    setPointer({
      x: 0,
      y: 0,
    });
  }

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
    if (
      !input.trim() ||
      loading ||
      leadSaved
    ) {
      return;
    }

    const userMessage = {
      role: "user",
      text: input.trim(),
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const formattedMessages =
        updatedMessages.map(
          (message) => ({
            role: message.role,
            content: message.text,
          })
        );

      const extractionResponse =
        await fetch(
          "/api/extract-lead",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              messages:
                formattedMessages,

              previous:
                leadMemory,
            }),
          }
        );

      let extractionData = {
        success: false,

        lead:
          leadMemory.lead || {},

        state:
          leadMemory.state ||
          initialLeadMemory.state,
      };

      try {
        extractionData =
          await extractionResponse.json();
      } catch (error) {
        console.error(
          "Could not read extraction response:",
          error
        );
      }

      if (
        !extractionResponse.ok ||
        !extractionData.success
      ) {
        console.error(
          "Lead extraction failed:",
          extractionData
        );
      }

      const currentState =
        extractionData.success
          ? {
              lead:
                extractionData.lead ||
                {},

              location_options:
                extractionData.state
                  ?.location_options ||
                [],

              property_type_options:
                extractionData.state
                  ?.property_type_options ||
                [],

              property_status_options:
                extractionData.state
                  ?.property_status_options ||
                [],

              uncertainties:
                extractionData.state
                  ?.uncertainties ||
                [],

              missing_fields:
                extractionData.state
                  ?.missing_fields ||
                [],
            }
          : {
              lead:
                leadMemory.lead ||
                {},

              location_options:
                leadMemory.state
                  ?.location_options ||
                [],

              property_type_options:
                leadMemory.state
                  ?.property_type_options ||
                [],

              property_status_options:
                leadMemory.state
                  ?.property_status_options ||
                [],

              uncertainties:
                leadMemory.state
                  ?.uncertainties ||
                [],

              missing_fields:
                leadMemory.state
                  ?.missing_fields ||
                [],
            };

      if (
        extractionData.success
      ) {
        setLeadMemory({
          lead:
            extractionData.lead ||
            {},

          state:
            extractionData.state ||
            initialLeadMemory.state,
        });
      }

      const response =
        await fetch(
          "/api/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              messages:
                formattedMessages,

              state:
                currentState,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Chat API failed:",
          data
        );

        throw new Error(
          "Chat API request failed"
        );
      }

      const assistantMessage = {
        role: "assistant",

        text:
          data.reply ||
          "Sorry, I couldn't respond. Please try again.",
      };

      const conversationWithReply =
        [
          ...updatedMessages,
          assistantMessage,
        ];

      setMessages(
        conversationWithReply
      );

      if (
        extractionData.success &&
        extractionData.lead
          ?.lead_status ===
          "Qualified" &&
        !leadSaved
      ) {
        const leadToSave = {
          ...extractionData.lead,

          conversation:
            conversationWithReply,
        };

        const saveResponse =
          await fetch(
            "/api/save-lead",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                leadToSave
              ),
            }
          );

        const saveData =
          await saveResponse.json();

        if (saveData.success) {
          setLeadSaved(true);

          console.log(
            "Lead saved successfully"
          );

          try {
            const notifyResponse =
              await fetch(
                "/api/notify-lead",
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify(
                      extractionData.lead
                    ),
                }
              );

            const notifyData =
              await notifyResponse.json();

            if (
              notifyData.success
            ) {
              console.log(
                "Lead notification sent"
              );
            } else {
              console.error(
                "Lead notification failed:",
                notifyData
              );
            }
          } catch (
            notifyError
          ) {
            console.error(
              "Notification request failed:",
              notifyError
            );
          }
        } else {
          console.error(
            "Lead save failed:",
            saveData
          );
        }
      }
    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      setMessages(
        (previous) => [
          ...previous,

          {
            role:
              "assistant",

            text:
              "Sorry, something went wrong. Please try again.",
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  if (!showDemo) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          background:
            colors.ivorySoft,

          color:
            colors.ink,

          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',

          overflow:
            "hidden",
        }}
      >
        <GlobalStyles />

        <section
          onMouseMove={
            handleHeroPointer
          }
          onMouseLeave={
            resetHeroPointer
          }
          style={{
            minHeight:
              "100vh",

            position:
              "relative",

            overflow:
              "hidden",

            backgroundImage: `url("${dubaiHero}")`,

            backgroundSize:
              "cover",

            backgroundPosition:
              "center 48%",
          }}
        >
          <div
            style={{
              position:
                "absolute",

              inset:
                "-3%",

              backgroundImage: `url("${dubaiHero}")`,

              backgroundSize:
                "cover",

              backgroundPosition:
                "center 48%",

              transform: `translate(${pointer.x * -10}px, ${pointer.y * -6}px) scale(1.02)`,

              transition:
                "transform .16s linear",

              opacity:
                0.98,
            }}
          />

          <div
            style={{
              position:
                "absolute",

              inset: 0,

              background:
                "linear-gradient(90deg, rgba(248,244,235,.99) 0%, rgba(248,244,235,.96) 25%, rgba(248,244,235,.80) 46%, rgba(248,244,235,.38) 68%, rgba(8,40,33,.12) 100%)",
            }}
          />

          <div
            style={{
              position:
                "absolute",

              inset: 0,

              background:
                "linear-gradient(180deg, rgba(255,252,245,.20), transparent 42%, rgba(8,32,27,.28))",
            }}
          />

          <div
            style={{
              position:
                "absolute",

              width:
                "620px",

              height:
                "620px",

              borderRadius:
                "50%",

              right:
                "7%",

              top:
                "11%",

              background:
                "radial-gradient(circle, rgba(212,179,119,.22), rgba(212,179,119,.07) 38%, transparent 70%)",

              filter:
                "blur(16px)",

              transform: `translate(${pointer.x * 32}px, ${pointer.y * 26}px)`,

              transition:
                "transform .12s linear",

              pointerEvents:
                "none",
            }}
          />

          <HeroGridOverlay />

          <nav
            className="siteNav"
          >
            <BrandMark />

            <div
              className="navRight"
            >
              <div
                className="desktopNavLinks"
              >
                <a
                  href="#intelligence"
                  className="navLink"
                >
                  Intelligence
                </a>

                <a
                  href="#channels"
                  className="navLink"
                >
                  Channels
                </a>

                <a
                  href="#perspective"
                  className="navLink"
                >
                  Experience
                </a>

                <a
                  href="#vision"
                  className="navLink"
                >
                  Platform
                </a>
              </div>

              <button
                className="primaryPill"
                onClick={
                  openDemo
                }
              >
                Enter Live Experience

                <span>
                  ↗
                </span>
              </button>
            </div>
          </nav>

          <div
            className="heroOuter"
          >
            <div
              className="heroGrid"
            >
              <div
                className="heroCopy"
                style={{
                  transform: `translate(${pointer.x * 3}px, ${pointer.y * 2}px)`,

                  transition:
                    "transform .16s linear",
                }}
              >
                <Eyebrow>
                  Intelligent Property Qualification
                </Eyebrow>

                <h1
                  className="heroTitle"
                >
                  Every enquiry
                  <br />

                  deserves a
                  <br />

                  <span>
                    better conversation.
                  </span>
                </h1>

                <p
                  className="heroDescription"
                >
                  NOMAD understands property
                  intent, qualifies buyers and
                  tenants naturally, structures
                  every requirement and hands
                  your sales team an opportunity
                  ready for action.
                </p>

                <div
                  className="heroActions"
                >
                  <button
                    className="heroPrimaryButton"
                    onClick={
                      openDemo
                    }
                  >
                    Experience NOMAD

                    <span>
                      →
                    </span>
                  </button>

                  <div
                    className="heroMicroCopy"
                  >
                    <span className="tinyPulse" />

                    No forms. No scripts.
                    Just conversation.
                  </div>
                </div>

                <div
                  className="heroStats"
                >
                  <Metric
                    value="24/7"
                    label="Qualification"
                  />

                  <Metric
                    value="Live"
                    label="Lead intelligence"
                  />

                  <Metric
                    value="Instant"
                    label="Sales handoff"
                  />
                </div>

                <div
                  className="heroLocation"
                >
                  <span />

                  Built for Dubai&apos;s
                  real estate teams
                </div>
              </div>

              <div
                className="heroProductStage"
              >
                <HeroOrbit
                  pointer={
                    pointer
                  }
                />

                <div
                  className="heroArchitectureArc"
                  style={{
                    transform: `translate(${pointer.x * -12}px, ${pointer.y * -8}px)`,
                  }}
                />

                <div
                  className="heroArchitectureArc heroArchitectureArc2"
                  style={{
                    transform: `translate(${pointer.x * 9}px, ${pointer.y * 5}px)`,
                  }}
                />

                <div
                  className="heroFloatingCard"
                  style={{
                    transform: `
                      perspective(1200px)
                      rotateY(${pointer.x * 4}deg)
                      rotateX(${pointer.y * -3}deg)
                      translate(${pointer.x * 10}px, ${pointer.y * 8}px)
                    `,

                    transition:
                      "transform .12s linear",
                  }}
                >
                  <DemoCardHeader />

                  <div
                    className="previewConversation"
                  >
                    <PreviewBubble assistant>
                      Hi 👋 Are you looking
                      to buy or rent a
                      property in Dubai?
                    </PreviewBubble>

                    <PreviewBubble>
                      I&apos;m looking to buy
                      a 3-bedroom villa in
                      Dubai Hills around
                      AED 4 million.
                    </PreviewBubble>

                    <PreviewBubble assistant>
                      Are you considering
                      ready-to-move,
                      off-plan, or both?
                    </PreviewBubble>

                    <PreviewBubble>
                      Both are fine. I&apos;ll
                      be using a mortgage.
                    </PreviewBubble>

                    <div
                      className="previewInsight"
                    >
                      <div>
                        <div
                          className="previewInsightLabel"
                        >
                          Intelligence
                          engine
                        </div>

                        <div
                          className="previewInsightTitle"
                        >
                          Requirement
                          understood
                        </div>

                        <div
                          className="previewInsightText"
                        >
                          Structured
                          automatically in
                          real time
                        </div>
                      </div>

                      <div
                        className="previewCheck"
                      >
                        ✓
                      </div>
                    </div>
                  </div>
                </div>

                <FloatingIntelligenceTag
                  className="heroIntentTag"
                  label="LIVE INTENT"
                  value="Buy · Villa"
                  detail="Dubai Hills"
                />

                <FloatingIntelligenceTag
                  className="heroStatusTag"
                  label="QUALIFICATION"
                  value="Ready"
                  detail="Mortgage"
                />

                <FloatingIntelligenceTag
                  className="heroBudgetTag"
                  label="BUDGET"
                  value="AED 4M"
                  detail="Customer stated"
                />
              </div>
            </div>
          </div>

          <HeroBottomFade />
        </section>

        {/* ===================================================
            INTELLIGENCE LAB
            =================================================== */}

        <section
          id="intelligence"
          className="intelligenceSection"
        >
          <SectionOrb position="left" />

          <div className="sectionInner">
            <div className="sectionHeaderSplit">
              <div>
                <Eyebrow light>
                  Watch intelligence happen
                </Eyebrow>

                <h2 className="sectionTitleLight">
                  Conversation
                  <br />
                  becomes
                  <span> intelligence.</span>
                </h2>
              </div>

              <p className="sectionLeadLight">
                NOMAD does not simply answer
                questions. It continuously
                understands what the customer
                means, preserves context and
                turns natural language into
                usable sales information.
              </p>
            </div>

            <div className="intelligenceWorkspace">
              <div className="intelligenceInputPanel">
                <PanelLabel>
                  Customer conversation
                </PanelLabel>

                <div className="intelligenceMessage">
                  <div className="miniAvatar">
                    TM
                  </div>

                  <div>
                    <div className="miniPersonName">
                      Incoming enquiry
                    </div>

                    <p>
                      Looking for a
                      3-bedroom villa in
                      Dubai Hills around
                      AED 4M. I&apos;ll need a
                      mortgage and I&apos;m
                      open to ready or
                      off-plan.
                    </p>
                  </div>
                </div>

                <div className="signalDivider">
                  <span />
                  NOMAD is understanding
                  the conversation
                  <span />
                </div>

                <div className="thinkingRows">
                  <ThinkingRow
                    active={intelligenceStage >= 1}
                    label="Intent"
                    value="Buy"
                  />

                  <ThinkingRow
                    active={intelligenceStage >= 2}
                    label="Property"
                    value="3BR Villa"
                  />

                  <ThinkingRow
                    active={intelligenceStage >= 3}
                    label="Budget"
                    value="AED 4M"
                  />

                  <ThinkingRow
                    active={intelligenceStage >= 4}
                    label="Location"
                    value="Dubai Hills"
                  />

                  <ThinkingRow
                    active={intelligenceStage >= 4}
                    label="Status"
                    value="Ready + Off-plan"
                  />

                  <ThinkingRow
                    active={intelligenceStage >= 3}
                    label="Financing"
                    value="Mortgage"
                  />
                </div>
              </div>

              <div className="intelligenceCore">
                <div className="coreRing ringOne" />
                <div className="coreRing ringTwo" />
                <div className="coreRing ringThree" />
                <div className="coreGlow" />

                <div className="coreNode">
                  <div className="coreN">
                    N
                  </div>

                  <span>
                    NOMAD
                  </span>
                </div>

                <div className="coreSignal signalOne" />
                <div className="coreSignal signalTwo" />
                <div className="coreSignal signalThree" />
              </div>

              <div className="structuredLeadPanel">
                <div className="structuredLeadTop">
                  <div>
                    <PanelLabel>
                      Sales intelligence
                    </PanelLabel>

                    <h3>
                      Qualified opportunity
                    </h3>
                  </div>

                  <div className="qualifiedBadge">
                    <span />
                    READY
                  </div>
                </div>

                <StructuredDataRow
                  label="Intent"
                  value="Purchase"
                  active={intelligenceStage >= 1}
                />

                <StructuredDataRow
                  label="Property"
                  value="3BR Villa"
                  active={intelligenceStage >= 2}
                />

                <StructuredDataRow
                  label="Budget"
                  value="AED 4M"
                  active={intelligenceStage >= 3}
                />

                <StructuredDataRow
                  label="Location"
                  value="Dubai Hills"
                  active={intelligenceStage >= 4}
                />

                <StructuredDataRow
                  label="Financing"
                  value="Mortgage"
                  active={intelligenceStage >= 3}
                />

                <StructuredDataRow
                  label="Availability"
                  value="Ready + Off-plan"
                  active={intelligenceStage >= 4}
                />

                <div
                  className={`handoffIndicator ${
                    intelligenceStage ===
                    intelligenceStages.length - 1
                      ? "handoffActive"
                      : ""
                  }`}
                >
                  <div className="handoffIcon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Consultant handoff
                    </strong>

                    <span>
                      Context ready before
                      the first call
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="intelligenceStageRail">
              {intelligenceStages.map(
                (stage, index) => (
                  <button
                    key={stage.accent}
                    onClick={() =>
                      setIntelligenceStage(index)
                    }
                    className={
                      index === intelligenceStage
                        ? "stageRailItem stageRailItemActive"
                        : "stageRailItem"
                    }
                  >
                    <span>
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    {stage.accent}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            PERSPECTIVE SWITCH
            =================================================== */}

        <section
          id="perspective"
          className="perspectiveSection"
        >
          <div className="sectionInner">
            <div className="perspectiveHeading">
              <Eyebrow>
                One conversation.
                Two realities.
              </Eyebrow>

              <h2 className="sectionTitleDark">
                Simple for the
                customer.
                <br />

                <span>
                  Powerful for the
                  business.
                </span>
              </h2>

              <p>
                The customer experiences a
                natural conversation.
                Behind the scenes, the
                brokerage receives
                structured context it can
                actually use.
              </p>
            </div>

            <PerspectiveSwitcher
              perspective={perspective}
              setPerspective={setPerspective}
            />

            <div className="perspectiveStage">
              <div
                className={
                  perspective === "customer"
                    ? "perspectiveScene perspectiveSceneVisible"
                    : "perspectiveScene perspectiveSceneHidden"
                }
              >
                <CustomerPerspective />
              </div>

              <div
                className={
                  perspective === "sales"
                    ? "perspectiveScene perspectiveSceneVisible"
                    : "perspectiveScene perspectiveSceneHidden"
                }
              >
                <SalesPerspective />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            CHANNEL NETWORK
            =================================================== */}

        <section
          id="channels"
          className="channelSection"
        >
          <ChannelBackground />

          <div className="sectionInner">
            <div className="channelHeader">
              <div>
                <Eyebrow light>
                  One intelligence layer
                </Eyebrow>

                <h2 className="sectionTitleLight">
                  Meet the customer
                  <br />

                  <span>
                    wherever they start.
                  </span>
                </h2>
              </div>

              <p className="sectionLeadLight">
                Website, campaigns,
                portals or messaging. The
                source can change. The
                qualification experience
                stays consistent.
              </p>
            </div>

            <div className="channelExperience">
              <div className="channelList">
                {channelData.map(
                  (channel) => (
                    <button
                      key={channel.id}
                      onClick={() =>
                        setActiveChannel(
                          channel.id
                        )
                      }
                      className={
                        activeChannel ===
                        channel.id
                          ? "channelButton channelButtonActive"
                          : "channelButton"
                      }
                    >
                      <span className="channelNumber">
                        {channel.number}
                      </span>

                      <div>
                        <strong>
                          {channel.title}
                        </strong>

                        <p>
                          {channel.description}
                        </p>
                      </div>

                      <span className="channelArrow">
                        →
                      </span>
                    </button>
                  )
                )}
              </div>

              <div className="channelMap">
                <ChannelUniverse
                  activeChannel={activeChannel}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            PRODUCT VISION
            =================================================== */}

        <section
          id="vision"
          className="visionSection"
        >
          <div className="sectionInner">
            <div className="visionTop">
              <div>
                <Eyebrow>
                  Product vision
                </Eyebrow>

                <h2 className="sectionTitleDark">
                  From conversation
                  <br />

                  to
                  <span>
                    {" "}
                    command center.
                  </span>
                </h2>
              </div>

              <div className="visionSideCopy">
                <p>
                  Imagine every enquiry
                  arriving with context
                  already understood,
                  prioritised and ready for
                  a human sales team.
                </p>

                <div className="visionDisclaimer">
                  Conceptual platform
                  visualization
                </div>
              </div>
            </div>

            <div className="commandCenter">
              <CommandCenterSidebar />

              <div className="commandCenterMain">
                <CommandCenterHeader />

                <CommandStats />

                <div className="commandMainGrid">
                  <div className="commandLeadTable">
                    <div className="tableTitleRow">
                      <div>
                        <span>
                          Live opportunity
                          feed
                        </span>

                        <strong>
                          Qualified leads
                        </strong>
                      </div>

                      <div className="liveChip">
                        <span />
                        Live
                      </div>
                    </div>

                    <div className="leadRows">
                      {commandCenterLeads.map(
                        (lead, index) => (
                          <CommandLeadRow
                            key={lead.name}
                            lead={lead}
                            index={index}
                            active={
                              dashboardHover === index
                            }
                            onEnter={() =>
                              setDashboardHover(index)
                            }
                            onLeave={() =>
                              setDashboardHover(null)
                            }
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div className="commandIntelligencePanel">
                    <div className="commandPanelLabel">
                      NOMAD intelligence
                    </div>

                    <h3>
                      Opportunity quality
                    </h3>

                    <QualityRing />

                    <div className="qualityDetails">
                      <QualityLine
                        label="Property intent"
                        value="Strong"
                      />

                      <QualityLine
                        label="Budget clarity"
                        value="Known"
                      />

                      <QualityLine
                        label="Timeline"
                        value="Known"
                      />

                      <QualityLine
                        label="Callback"
                        value="Scheduled"
                      />
                    </div>

                    <div className="qualityRecommendation">
                      <span>
                        NOMAD
                      </span>

                      Ready for consultant
                      follow-up.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            OPERATIONAL STORY
            =================================================== */}

        <section className="storySection">
          <div className="storyTrack">
            <StoryPoint
              number="01"
              title="Enquiry"
              description="A buyer or tenant starts naturally."
            />

            <StoryConnector />

            <StoryPoint
              number="02"
              title="Understanding"
              description="NOMAD preserves context and intent."
            />

            <StoryConnector />

            <StoryPoint
              number="03"
              title="Qualification"
              description="Missing information is collected intelligently."
            />

            <StoryConnector />

            <StoryPoint
              number="04"
              title="Handoff"
              description="The consultant receives a sales-ready opportunity."
            />
          </div>
        </section>

        {/* ===================================================
            CTA
            =================================================== */}

        <section className="finalCTASection">
          <FinalCTAVisual />

          <div className="finalCTAContent">
            <Eyebrow light>
              Experience NOMAD
            </Eyebrow>

            <h2>
              Don&apos;t imagine the
              conversation.
              <br />

              <span>
                Have one.
              </span>
            </h2>

            <p>
              Enter the live experience
              and qualify a property
              enquiry yourself.
            </p>

            <button
              onClick={openDemo}
              className="finalCTAButton"
            >
              Launch Live NOMAD

              <span>
                ↗
              </span>
            </button>
          </div>
        </section>

        {/* ===================================================
            FOOTER
            =================================================== */}

        <footer className="siteFooter">
          <BrandMark dark />

          <div className="footerMiddle">
            Intelligent property
            qualification for modern real
            estate teams.
          </div>

          <div className="footerRight">
            Dubai · UAE
          </div>
        </footer>
      </main>
    );
  }

  /* =========================================================
     LIVE EXPERIENCE
     ========================================================= */

  return (
    <main className="liveDemoPage">
      <GlobalStyles />

      <div className="demoAmbientOne" />
      <div className="demoAmbientTwo" />

      <button
        className="backToNomadButton"
        onClick={backToLanding}
        disabled={loading}
      >
        ← Back to NOMAD
      </button>

      <div className="demoExperienceFrame">
        <div className="demoStoryPanel">
          <div>
            <BrandMark dark />

            <div className="demoStoryEyebrow">
              LIVE PRODUCT EXPERIENCE
            </div>

            <h1>
              Experience the
              <br />

              <span>
                customer side
              </span>

              <br />

              of NOMAD.
            </h1>

            <p>
              Talk naturally. NOMAD will
              understand what you need,
              qualify the enquiry and
              prepare the handoff.
            </p>
          </div>

          <div className="demoStoryRail">
            <DemoRailItem
              number="01"
              label="Conversation"
              active={!leadSaved}
            />

            <DemoRailItem
              number="02"
              label="Qualification"
              active={loading}
            />

            <DemoRailItem
              number="03"
              label="Handoff"
              active={leadSaved}
            />
          </div>

          <div className="demoStoryFooter">
            The customer sees a natural
            conversation.
            <br />
            Structured sales intelligence
            remains behind the scenes.
          </div>
        </div>

        <div className="chatShell">
          <div className="chatHeader">
            <div className="chatIdentity">
              <div className="chatAvatar">
                N
              </div>

              <div>
                <div className="chatTitle">
                  NOMAD Property Assistant
                </div>

                <div className="chatStatus">
                  <span
                    className={
                      loading
                        ? "statusDot statusDotBusy"
                        : "statusDot"
                    }
                  />

                  {loading
                    ? "Understanding..."
                    : leadSaved
                    ? "Request received"
                    : "Available now"}
                </div>
              </div>
            </div>

            <button
              className="newConversationButton"
              onClick={startNewConversation}
              disabled={loading}
              title="Start a new conversation"
            >
              ↻
            </button>
          </div>

          <div className="chatBody">
            <div className="chatSessionLabel">
              Private Property Concierge
            </div>

            {messages.map(
              (message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                />
              )
            )}

            {loading && (
              <TypingMessage />
            )}

            {leadSaved && (
              <CustomerRequestReceived />
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="chatComposerArea">
            <div
              className={
                leadSaved
                  ? "composer composerComplete"
                  : "composer"
              }
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  leadSaved
                    ? "Request received"
                    : "Ask NOMAD..."
                }
                disabled={
                  loading ||
                  leadSaved
                }
              />

              <button
                onClick={sendMessage}
                disabled={
                  loading ||
                  leadSaved ||
                  !input.trim()
                }
              >
                {loading
                  ? "•••"
                  : "↑"}
              </button>
            </div>

            <div className="composerFooter">
              {leadSaved
                ? "Your property request has been shared with the team."
                : "Intelligent qualification · Real-time lead capture"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   GLOBAL CSS
   ========================================================= */

function GlobalStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
        max-width: 100%;
        overflow-x: hidden;
      }

      body {
        margin: 0;
        background: #FBF9F4;
        max-width: 100%;
        overflow-x: hidden;
      }

      button,
      input,
      textarea,
      a {
        font-family: inherit;
      }

      button {
        -webkit-tap-highlight-color: transparent;
      }

      ::selection {
        background: rgba(185, 152, 98, .25);
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(8, 47, 39, .16);
        border-radius: 20px;
      }

      .siteNav {
        width: 100%;
        max-width: 1380px;
        margin: 0 auto;
        padding: 28px 38px;
        position: relative;
        z-index: 30;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .navRight {
        display: flex;
        align-items: center;
        gap: 34px;
      }

      .desktopNavLinks {
        display: flex;
        align-items: center;
        gap: 30px;
      }

      .navLink {
        position: relative;
        color: #2E3934;
        text-decoration: none;
        font-size: 9px;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        font-weight: 800;
        padding: 9px 0;
        transition:
          color .25s ease,
          opacity .25s ease;
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

      .primaryPill {
        border: 1px solid rgba(211,181,126,.68);
        background:
          linear-gradient(135deg, #082F27, #0D483B);
        color: white;
        padding: 13px 21px;
        border-radius: 999px;
        cursor: pointer;
        font-weight: 800;
        font-size: 11px;
        box-shadow:
          0 14px 38px rgba(8,47,39,.20);
        transition:
          transform .25s ease,
          box-shadow .25s ease;
        white-space: nowrap;
      }

      .primaryPill span {
        margin-left: 12px;
      }

      .primaryPill:hover {
        transform: translateY(-2px);
        box-shadow:
          0 18px 48px rgba(8,47,39,.27);
      }

      .heroOuter {
        width: 100%;
        max-width: 1380px;
        margin: 0 auto;
        padding: 56px 38px 85px;
        position: relative;
        z-index: 10;
      }

      .heroGrid {
        display: grid;
        grid-template-columns:
          minmax(0, 1.02fr)
          minmax(0, .98fr);
        gap: 78px;
        align-items: center;
      }

      .heroCopy {
        padding-bottom: 20px;
        min-width: 0;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        color: #9C7740;
        text-transform: uppercase;
        letter-spacing: 1.9px;
        font-size: 9px;
        font-weight: 850;
      }

      .eyebrowLight {
        color: #D8C6A6;
      }

      .eyebrowLine {
        width: 34px;
        height: 1px;
        background: currentColor;
        opacity: .8;
        flex-shrink: 0;
      }

      .heroTitle {
        margin: 28px 0 0;
        max-width: 720px;
        font-size: clamp(62px, 6.15vw, 96px);
        line-height: .94;
        letter-spacing: -5px;
        font-weight: 710;
      }

      .heroTitle span {
        display: inline-block;
        margin-top: 8px;
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-weight: 400;
        font-style: italic;
        color: #0B7663;
        letter-spacing: -3px;
      }

      .heroDescription {
        margin: 34px 0 0;
        max-width: 610px;
        color: #5D6862;
        font-size: 15px;
        line-height: 1.8;
      }

      .heroActions {
        margin-top: 37px;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 18px;
      }

      .heroPrimaryButton {
        border: none;
        background: #082F27;
        color: white;
        border-radius: 999px;
        padding: 16px 25px;
        font-size: 12px;
        font-weight: 850;
        cursor: pointer;
        box-shadow:
          0 17px 38px rgba(8,47,39,.22);
        transition:
          transform .25s ease,
          box-shadow .25s ease;
      }

      .heroPrimaryButton span {
        margin-left: 13px;
      }

      .heroPrimaryButton:hover {
        transform: translateY(-2px);
        box-shadow:
          0 22px 48px rgba(8,47,39,.28);
      }

      .heroMicroCopy {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #696F6B;
        font-size: 11px;
      }

      .tinyPulse {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #0B7663;
        box-shadow:
          0 0 0 5px rgba(11,118,99,.08);
        animation:
          tinyPulse 2s ease-in-out infinite;
        flex-shrink: 0;
      }

      @keyframes tinyPulse {
        0%,
        100% {
          transform: scale(1);
          opacity: .8;
        }

        50% {
          transform: scale(1.2);
          opacity: 1;
        }
      }

      .heroStats {
        margin-top: 58px;
        display: grid;
        grid-template-columns:
          repeat(3, minmax(100px, 1fr));
        max-width: 580px;
        border-top:
          1px solid rgba(17,25,21,.13);
      }

      .heroLocation {
        margin-top: 42px;
        display: flex;
        align-items: center;
        gap: 14px;
        color: #9A7844;
        font-size: 8px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: 1.7px;
      }

      .heroLocation span {
        width: 38px;
        height: 1px;
        background: #A9844D;
        flex-shrink: 0;
      }

      .heroProductStage {
        position: relative;
        min-height: 660px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-width: 0;
      }

      .heroArchitectureArc {
        position: absolute;
        width: 79%;
        height: 83%;
        right: -1%;
        top: 3%;
        border:
          1px solid rgba(201,166,106,.38);
        border-radius:
          260px 260px 28px 28px;
        transition: transform .15s linear;
      }

      .heroArchitectureArc2 {
        width: 61%;
        height: 65%;
        right: 8%;
        top: 13%;
        opacity: .55;
      }

      .heroFloatingCard {
        width: 100%;
        max-width: 470px;
        border-radius: 27px;
        overflow: hidden;
        background:
          rgba(255,253,248,.92);
        backdrop-filter:
          blur(20px);
        border:
          1px solid rgba(255,255,255,.76);
        box-shadow:
          0 45px 110px rgba(11,31,26,.23),
          0 12px 34px rgba(7,55,44,.10);
        position: relative;
        z-index: 6;
        transform-style:
          preserve-3d;
      }

      .demoCardHeader {
        background:
          linear-gradient(
            135deg,
            #062F27,
            #0A473A
          );
        color: white;
        padding: 19px 20px;
        display: flex;
        justify-content:
          space-between;
        align-items: center;
      }

      .demoCardIdentity {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .demoMiniAvatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background:
          linear-gradient(
            135deg,
            #226654,
            #0F4035
          );
        border:
          1px solid rgba(255,255,255,.14);
        font-weight: 850;
        font-size: 12px;
        flex-shrink: 0;
      }

      .demoCardTitle {
        font-size: 12px;
        font-weight: 750;
      }

      .demoCardStatus {
        margin-top: 4px;
        font-size: 9px;
        color: rgba(255,255,255,.62);
      }

      .demoCardStatus span {
        color: #69C19B;
      }

      .demoLiveLabel {
        color: #D6BC8E;
        font-size: 8px;
        font-weight: 850;
        letter-spacing: 1.4px;
      }

      .previewConversation {
        padding: 28px 24px;
        background:
          rgba(253,250,244,.95);
      }

      .previewBubbleRow {
        display: flex;
        margin-bottom: 13px;
      }

      .previewBubbleAssistant {
        justify-content: flex-start;
      }

      .previewBubbleUser {
        justify-content: flex-end;
      }

      .previewBubble {
        max-width: 80%;
        padding: 11px 13px;
        color: #303A35;
        font-size: 10.5px;
        line-height: 1.55;
        box-shadow:
          0 3px 9px rgba(16,24,20,.045);
      }

      .previewBubbleAssistant .previewBubble {
        border-radius:
          14px 14px 14px 4px;
        background: #FFFDF8;
      }

      .previewBubbleUser .previewBubble {
        border-radius:
          14px 14px 4px 14px;
        background: #E9E4D8;
      }

      .previewInsight {
        margin-top: 28px;
        padding-top: 18px;
        border-top:
          1px solid rgba(16,24,20,.08);
        display: flex;
        justify-content:
          space-between;
        align-items: center;
        gap: 20px;
      }

      .previewInsightLabel {
        color: #A9844D;
        font-size: 8px;
        letter-spacing: 1.35px;
        text-transform: uppercase;
        font-weight: 850;
      }

      .previewInsightTitle {
        margin-top: 6px;
        font-size: 12px;
        font-weight: 780;
        color: #082F27;
      }

      .previewInsightText {
        margin-top: 3px;
        color: #7C847F;
        font-size: 9px;
      }

      .previewCheck {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #082F27;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 850;
        flex-shrink: 0;
      }

      .floatingIntelligenceTag {
        position: absolute;
        z-index: 10;
        min-width: 128px;
        padding: 12px 14px;
        background:
          rgba(255,253,248,.88);
        backdrop-filter:
          blur(18px);
        border-radius: 12px;
        border:
          1px solid rgba(16,24,20,.07);
        box-shadow:
          0 16px 40px rgba(16,24,20,.13);
        animation:
          tagFloat 5s ease-in-out infinite;
      }

      .floatingIntelligenceTagLabel {
        color: #B99862;
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        font-weight: 850;
      }

      .floatingIntelligenceTagValue {
        margin-top: 5px;
        color: #082F27;
        font-size: 11px;
        font-weight: 780;
      }

      .floatingIntelligenceTagDetail {
        margin-top: 2px;
        color: #8B918D;
        font-size: 8px;
      }

      .heroIntentTag {
        top: 105px;
        left: -9px;
      }

      .heroStatusTag {
        right: -6px;
        bottom: 105px;
        animation-delay: -1.8s;
      }

      .heroBudgetTag {
        left: 30px;
        bottom: 45px;
        animation-delay: -3.2s;
      }

      @keyframes tagFloat {
        0%,
        100% {
          transform: translateY(0);
        }

        50% {
          transform: translateY(-7px);
        }
      }

      .heroOrbit {
        position: absolute;
        width: 540px;
        height: 540px;
        border-radius: 50%;
        pointer-events: none;
      }

      .heroOrbitRing {
        position: absolute;
        inset: 0;
        border:
          1px solid rgba(185,152,98,.12);
        border-radius: 50%;
        animation:
          rotateOrbit 28s linear infinite;
      }

      .heroOrbitRing::before,
      .heroOrbitRing::after {
        content: "";
        position: absolute;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #B99862;
        box-shadow:
          0 0 20px rgba(185,152,98,.45);
      }

      .heroOrbitRing::before {
        left: 49%;
        top: -4px;
      }

      .heroOrbitRing::after {
        right: -4px;
        top: 49%;
      }

      @keyframes rotateOrbit {
        to {
          transform: rotate(360deg);
        }
      }

      .heroGridOverlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: .22;
        background-image:
          linear-gradient(
            rgba(8,47,39,.06) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(8,47,39,.06) 1px,
            transparent 1px
          );
        background-size:
          84px 84px;
        mask-image:
          linear-gradient(
            to right,
            transparent,
            black 48%,
            black
          );
      }

      .heroBottomFade {
        position: absolute;
        z-index: 9;
        left: 0;
        right: 0;
        bottom: 0;
        height: 130px;
        background:
          linear-gradient(
            transparent,
            rgba(8,47,39,.10)
          );
        pointer-events: none;
      }

      .sectionInner {
        width: 100%;
        max-width: 1220px;
        margin: 0 auto;
        position: relative;
        z-index: 3;
      }

      .sectionHeaderSplit {
        display: grid;
        grid-template-columns:
          minmax(0, 1.15fr)
          minmax(0, .85fr);
        gap: 90px;
        align-items: end;
      }

      .sectionTitleLight,
      .sectionTitleDark {
        margin: 24px 0 0;
        font-size:
          clamp(42px, 5vw, 70px);
        line-height: 1.02;
        letter-spacing: -3px;
        font-weight: 650;
      }

      .sectionTitleLight {
        color: white;
      }

      .sectionTitleDark {
        color: #101814;
      }

      .sectionTitleLight span {
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-weight: 400;
        font-style: italic;
        color: #D8C6A6;
      }

      .sectionTitleDark span {
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-weight: 400;
        font-style: italic;
        color: #0B7663;
      }

      .sectionLeadLight {
        margin: 0;
        color:
          rgba(255,255,255,.54);
        font-size: 14px;
        line-height: 1.85;
        max-width: 470px;
      }

      .intelligenceSection {
        position: relative;
        background: #082F27;
        padding: 112px 34px 100px;
        color: white;
        overflow: hidden;
      }

      .sectionOrb {
        position: absolute;
        width: 620px;
        height: 620px;
        border-radius: 50%;
        border:
          1px solid rgba(216,198,166,.12);
        pointer-events: none;
      }

      .sectionOrbLeft {
        left: -280px;
        top: 80px;
      }

      .sectionOrbRight {
        right: -280px;
        top: 80px;
      }

      .intelligenceWorkspace {
        margin-top: 72px;
        min-height: 590px;
        display: grid;
        grid-template-columns:
          minmax(0, 1fr)
          240px
          minmax(0, 1fr);
        gap: 34px;
        align-items: center;
      }

      .intelligenceInputPanel,
      .structuredLeadPanel {
        min-height: 500px;
        border-radius: 22px;
        background:
          rgba(255,255,255,.055);
        border:
          1px solid rgba(255,255,255,.09);
        backdrop-filter:
          blur(20px);
        padding: 24px;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.04);
        min-width: 0;
      }

      .panelLabel {
        color: #D8C6A6;
        font-size: 8px;
        font-weight: 850;
        letter-spacing: 1.35px;
        text-transform: uppercase;
      }

      .intelligenceMessage {
        margin-top: 26px;
        padding: 18px;
        border-radius: 16px;
        background:
          rgba(255,255,255,.07);
        display: flex;
        gap: 13px;
      }

      .miniAvatar {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        border-radius: 50%;
        background: #D8C6A6;
        color: #082F27;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 850;
      }

      .miniPersonName {
        font-size: 9px;
        color: rgba(255,255,255,.45);
        text-transform: uppercase;
        letter-spacing: .8px;
      }

      .intelligenceMessage p {
        margin: 7px 0 0;
        color: rgba(255,255,255,.82);
        font-size: 12px;
        line-height: 1.7;
      }

      .signalDivider {
        margin: 28px 0 22px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: rgba(255,255,255,.32);
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 1.1px;
        white-space: nowrap;
      }

      .signalDivider span {
        height: 1px;
        flex: 1;
        background:
          rgba(255,255,255,.10);
      }

      .thinkingRows {
        display: grid;
        gap: 9px;
      }

      .thinkingRow {
        display: grid;
        grid-template-columns:
          28px 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 11px 12px;
        border-radius: 12px;
        background:
          rgba(255,255,255,.025);
        border:
          1px solid rgba(255,255,255,.05);
        opacity: .34;
        transform:
          translateX(-4px);
        transition:
          opacity .45s ease,
          transform .45s ease,
          background .45s ease;
      }

      .thinkingRowActive {
        opacity: 1;
        transform:
          translateX(0);
        background:
          rgba(255,255,255,.055);
      }

      .thinkingCheck {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        background:
          rgba(255,255,255,.05);
        color:
          rgba(255,255,255,.25);
      }

      .thinkingRowActive .thinkingCheck {
        background:
          rgba(216,198,166,.15);
        color: #D8C6A6;
      }

      .thinkingLabel {
        font-size: 9px;
        color:
          rgba(255,255,255,.45);
      }

      .thinkingValue {
        font-size: 9px;
        color: white;
        font-weight: 750;
      }

      .intelligenceCore {
        position: relative;
        height: 360px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .coreGlow {
        position: absolute;
        width: 190px;
        height: 190px;
        border-radius: 50%;
        background:
          radial-gradient(
            circle,
            rgba(216,198,166,.22),
            rgba(11,118,99,.07) 48%,
            transparent 68%
          );
        animation:
          coreGlowPulse 3s ease-in-out infinite;
      }

      @keyframes coreGlowPulse {
        0%,
        100% {
          transform: scale(.96);
          opacity: .65;
        }

        50% {
          transform: scale(1.08);
          opacity: 1;
        }
      }

      .coreRing {
        position: absolute;
        border-radius: 50%;
        border:
          1px solid rgba(216,198,166,.16);
      }

      .ringOne {
        width: 150px;
        height: 150px;
        animation:
          rotateCore 16s linear infinite;
      }

      .ringTwo {
        width: 220px;
        height: 220px;
        opacity: .72;
        border-style: dashed;
        animation:
          rotateCoreReverse 25s linear infinite;
      }

      .ringThree {
        width: 300px;
        height: 300px;
        opacity: .33;
        animation:
          rotateCore 36s linear infinite;
      }

      @keyframes rotateCore {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes rotateCoreReverse {
        to {
          transform: rotate(-360deg);
        }
      }

      .coreNode {
        position: relative;
        z-index: 4;
        width: 104px;
        height: 104px;
        border-radius: 50%;
        background:
          linear-gradient(
            135deg,
            #154E41,
            #082F27
          );
        border:
          1px solid rgba(216,198,166,.35);
        box-shadow:
          0 0 45px rgba(216,198,166,.10);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .coreN {
        font-size: 28px;
        font-weight: 760;
      }

      .coreNode span {
        margin-top: 2px;
        color: #D8C6A6;
        font-size: 7px;
        letter-spacing: 1.5px;
      }

      .coreSignal {
        position: absolute;
        z-index: 6;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #D8C6A6;
        box-shadow:
          0 0 16px rgba(216,198,166,.50);
      }

      .signalOne {
        animation:
          orbitSignalOne 5s linear infinite;
      }

      .signalTwo {
        animation:
          orbitSignalTwo 7s linear infinite;
      }

      .signalThree {
        animation:
          orbitSignalThree 10s linear infinite;
      }

      @keyframes orbitSignalOne {
        from {
          transform:
            rotate(0deg)
            translateX(74px);
        }

        to {
          transform:
            rotate(360deg)
            translateX(74px);
        }
      }

      @keyframes orbitSignalTwo {
        from {
          transform:
            rotate(120deg)
            translateX(108px);
        }

        to {
          transform:
            rotate(480deg)
            translateX(108px);
        }
      }

      @keyframes orbitSignalThree {
        from {
          transform:
            rotate(240deg)
            translateX(148px);
        }

        to {
          transform:
            rotate(600deg)
            translateX(148px);
        }
      }

      .structuredLeadTop {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
        margin-bottom: 22px;
      }

      .structuredLeadTop h3 {
        margin: 7px 0 0;
        font-size: 19px;
        font-weight: 650;
      }

      .qualifiedBadge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 10px;
        border-radius: 999px;
        background:
          rgba(111,205,166,.09);
        color: #81D4B3;
        font-size: 7px;
        font-weight: 850;
        letter-spacing: 1px;
      }

      .qualifiedBadge span {
        width: 5px;
        height: 5px;
        background: #81D4B3;
        border-radius: 50%;
        box-shadow:
          0 0 0 4px rgba(129,212,179,.08);
      }

      .structuredDataRow {
        min-height: 48px;
        border-top:
          1px solid rgba(255,255,255,.07);
        display: flex;
        align-items: center;
        justify-content: space-between;
        opacity: .26;
        transform:
          translateY(4px);
        transition:
          opacity .45s ease,
          transform .45s ease;
      }

      .structuredDataRowActive {
        opacity: 1;
        transform:
          translateY(0);
      }

      .structuredDataLabel {
        color:
          rgba(255,255,255,.40);
        font-size: 9px;
      }

      .structuredDataValue {
        color: white;
        font-size: 10px;
        font-weight: 720;
      }

      .handoffIndicator {
        margin-top: 20px;
        padding: 14px;
        border-radius: 13px;
        background:
          rgba(255,255,255,.04);
        border:
          1px solid rgba(255,255,255,.06);
        display: flex;
        align-items: center;
        gap: 11px;
        opacity: .28;
        transition:
          opacity .45s ease,
          background .45s ease;
      }

      .handoffActive {
        opacity: 1;
        background:
          rgba(216,198,166,.08);
      }

      .handoffIcon {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border-radius: 50%;
        background:
          rgba(216,198,166,.12);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      }

      .handoffIndicator strong {
        display: block;
        font-size: 10px;
      }

      .handoffIndicator span {
        display: block;
        margin-top: 2px;
        color:
          rgba(255,255,255,.42);
        font-size: 8px;
      }

      .intelligenceStageRail {
        margin-top: 42px;
        display: grid;
        grid-template-columns:
          repeat(6, 1fr);
        border-top:
          1px solid rgba(255,255,255,.10);
      }

      .stageRailItem {
        position: relative;
        border: none;
        background: transparent;
        color:
          rgba(255,255,255,.34);
        padding: 17px 8px;
        text-align: left;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        transition:
          color .25s ease;
      }

      .stageRailItem span {
        margin-right: 8px;
        color: #D8C6A6;
      }

      .stageRailItem::before {
        content: "";
        position: absolute;
        top: -1px;
        left: 0;
        width: 0;
        height: 1px;
        background: #D8C6A6;
        transition:
          width .35s ease;
      }

      .stageRailItemActive {
        color: white;
      }

      .stageRailItemActive::before {
        width: 100%;
      }

      .perspectiveSection {
        position: relative;
        background: #F7F3EB;
        padding: 110px 34px;
        overflow: hidden;
      }

      .perspectiveHeading {
        max-width: 850px;
      }

      .perspectiveHeading p {
        margin: 28px 0 0;
        max-width: 560px;
        color: #67716B;
        font-size: 14px;
        line-height: 1.8;
      }

      .perspectiveSwitcher {
        margin-top: 50px;
        display: inline-flex;
        padding: 4px;
        border-radius: 999px;
        background: #ECE6DB;
        border:
          1px solid rgba(16,24,20,.06);
      }

      .perspectiveSwitcher button {
        border: none;
        background: transparent;
        padding: 11px 20px;
        border-radius: 999px;
        color: #748078;
        font-size: 9px;
        font-weight: 850;
        letter-spacing: .8px;
        cursor: pointer;
        transition:
          background .25s ease,
          color .25s ease,
          box-shadow .25s ease;
      }

      .perspectiveSwitcher .perspectiveSwitcherActive {
        background: #082F27;
        color: white;
        box-shadow:
          0 8px 24px rgba(8,47,39,.14);
      }

      .perspectiveStage {
        position: relative;
        margin-top: 36px;
        min-height: 620px;
      }

      .perspectiveScene {
        position: absolute;
        inset: 0;
        transition:
          opacity .45s ease,
          transform .45s ease;
      }

      .perspectiveSceneVisible {
        opacity: 1;
        transform:
          translateY(0);
        pointer-events: auto;
      }

      .perspectiveSceneHidden {
        opacity: 0;
        transform:
          translateY(15px);
        pointer-events: none;
      }

      .customerPerspective {
        min-height: 590px;
        border-radius: 28px;
        background:
          linear-gradient(
            135deg,
            #EFE9DE,
            #FBF8F2
          );
        border:
          1px solid rgba(16,24,20,.07);
        display: grid;
        grid-template-columns:
          1.05fr .95fr;
        overflow: hidden;
        box-shadow:
          0 30px 80px rgba(16,24,20,.08);
      }

      .customerPerspectiveCopy {
        padding: 64px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .perspectiveMiniLabel {
        color: #A9844D;
        font-size: 8px;
        font-weight: 850;
        letter-spacing: 1.4px;
        text-transform: uppercase;
      }

      .customerPerspectiveCopy h3 {
        margin: 19px 0 0;
        max-width: 490px;
        font-size: 42px;
        line-height: 1.08;
        letter-spacing: -2px;
        font-weight: 620;
      }

      .customerPerspectiveCopy h3 span {
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-style: italic;
        font-weight: 400;
        color: #0B7663;
      }

      .customerPerspectiveCopy p {
        margin: 23px 0 0;
        max-width: 480px;
        color: #68736D;
        font-size: 13px;
        line-height: 1.8;
      }

      .customerPerspectiveList {
        margin-top: 30px;
        display: grid;
        gap: 13px;
      }

      .customerPerspectivePoint {
        display: flex;
        gap: 11px;
        align-items: center;
        color: #47544E;
        font-size: 11px;
      }

      .customerPerspectivePoint span {
        width: 23px;
        height: 23px;
        border-radius: 50%;
        background: #E4DED1;
        color: #082F27;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: 850;
        flex-shrink: 0;
      }

      .customerPhoneStage {
        position: relative;
        background:
          linear-gradient(
            145deg,
            #0B3A30,
            #06251F
          );
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 45px;
        overflow: hidden;
      }

      .customerPhoneStage::before {
        content: "";
        position: absolute;
        width: 460px;
        height: 460px;
        border-radius: 50%;
        border:
          1px solid rgba(216,198,166,.10);
      }

      .customerPhone {
        width: 300px;
        max-width: 100%;
        border-radius: 30px;
        background: #FAF8F3;
        overflow: hidden;
        box-shadow:
          0 32px 80px rgba(0,0,0,.30);
        position: relative;
        z-index: 2;
        border:
          1px solid rgba(255,255,255,.14);
      }

      .customerPhoneHeader {
        background: #082F27;
        padding: 16px;
        color: white;
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .customerPhoneAvatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #175143;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 850;
        flex-shrink: 0;
      }

      .customerPhoneHeader strong {
        font-size: 10px;
      }

      .customerPhoneHeader span {
        display: block;
        margin-top: 2px;
        color:
          rgba(255,255,255,.48);
        font-size: 7px;
      }

      .customerPhoneBody {
        padding: 18px;
        min-height: 410px;
        background: #F7F4ED;
      }

      .customerPhoneBubble {
        max-width: 84%;
        margin-bottom: 11px;
        padding: 9px 11px;
        border-radius: 12px;
        font-size: 8px;
        line-height: 1.5;
      }

      .customerPhoneBubbleBot {
        background: white;
        border-radius:
          12px 12px 12px 3px;
      }

      .customerPhoneBubbleUser {
        margin-left: auto;
        background: #E7E0D4;
        border-radius:
          12px 12px 3px 12px;
      }

      .customerSuccessBubble {
        margin-top: 17px;
        padding: 13px;
        border-radius: 13px;
        background: #E9F2EE;
        border:
          1px solid #D7E8E1;
      }

      .customerSuccessBubble strong {
        display: block;
        color: #082F27;
        font-size: 9px;
      }

      .customerSuccessBubble span {
        display: block;
        margin-top: 3px;
        color: #6E7A74;
        font-size: 7.5px;
        line-height: 1.55;
      }

      .salesPerspective {
        min-height: 590px;
        border-radius: 28px;
        background: #0A3129;
        overflow: hidden;
        border:
          1px solid rgba(255,255,255,.06);
        box-shadow:
          0 30px 80px rgba(16,24,20,.16);
        display: grid;
        grid-template-columns:
          300px 1fr;
      }

      .salesPerspectiveSidebar {
        padding: 36px 30px;
        border-right:
          1px solid rgba(255,255,255,.08);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .salesPerspectiveSidebar h3 {
        margin: 22px 0 0;
        color: white;
        font-size: 27px;
        line-height: 1.12;
        letter-spacing: -1px;
        font-weight: 620;
      }

      .salesPerspectiveSidebar p {
        margin: 18px 0 0;
        color:
          rgba(255,255,255,.45);
        font-size: 11px;
        line-height: 1.75;
      }

      .salesDataTags {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .salesDataTag {
        padding: 7px 9px;
        border-radius: 999px;
        background:
          rgba(255,255,255,.06);
        color:
          rgba(255,255,255,.55);
        border:
          1px solid rgba(255,255,255,.06);
        font-size: 7px;
      }

      .salesPerspectiveMain {
        padding: 36px;
        min-width: 0;
      }

      .salesOpportunityTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 25px;
      }

      .salesOpportunityTop h3 {
        margin: 7px 0 0;
        color: white;
        font-size: 28px;
        font-weight: 620;
      }

      .salesQualifiedBadge {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 7px 10px;
        border-radius: 999px;
        background:
          rgba(92,199,156,.10);
        color: #7DD5B2;
        font-size: 7px;
        font-weight: 850;
        letter-spacing: 1px;
      }

      .salesQualifiedBadge span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #7DD5B2;
      }

      .salesLeadSummary {
        margin-top: 28px;
        padding: 18px;
        background:
          rgba(255,255,255,.05);
        border:
          1px solid rgba(255,255,255,.06);
        border-radius: 15px;
      }

      .salesLeadSummary p {
        margin: 0;
        color:
          rgba(255,255,255,.65);
        font-size: 11px;
        line-height: 1.7;
      }

      .salesStructuredGrid {
        margin-top: 22px;
        display: grid;
        grid-template-columns:
          repeat(2, 1fr);
        gap: 10px;
      }

      .salesStructuredItem {
        padding: 14px;
        border-radius: 13px;
        border:
          1px solid rgba(255,255,255,.06);
        background:
          rgba(255,255,255,.035);
      }

      .salesStructuredItem span {
        display: block;
        color:
          rgba(255,255,255,.34);
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .salesStructuredItem strong {
        display: block;
        margin-top: 6px;
        color: white;
        font-size: 11px;
      }

      .salesHandoffStrip {
        margin-top: 20px;
        padding: 15px;
        border-radius: 14px;
        background:
          rgba(216,198,166,.08);
        border:
          1px solid rgba(216,198,166,.13);
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .salesHandoffIcon {
        width: 31px;
        height: 31px;
        border-radius: 50%;
        background:
          rgba(216,198,166,.13);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        flex-shrink: 0;
      }

      .salesHandoffStrip strong {
        display: block;
        color: white;
        font-size: 9px;
      }

      .salesHandoffStrip span {
        display: block;
        margin-top: 2px;
        color:
          rgba(255,255,255,.40);
        font-size: 7px;
      }

      .channelSection {
        position: relative;
        padding: 110px 34px;
        background: #061F1A;
        overflow: hidden;
      }

      .channelBackground {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .channelBackgroundGrid {
        position: absolute;
        inset: 0;
        opacity: .22;
        background-image:
          linear-gradient(
            rgba(216,198,166,.05) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(216,198,166,.05) 1px,
            transparent 1px
          );
        background-size:
          70px 70px;
      }

      .channelBackgroundGlow {
        position: absolute;
        width: 620px;
        height: 620px;
        border-radius: 50%;
        right: 8%;
        top: 8%;
        background:
          radial-gradient(
            circle,
            rgba(11,118,99,.12),
            transparent 66%
          );
      }

      .channelHeader {
        display: grid;
        grid-template-columns:
          1.1fr .9fr;
        gap: 90px;
        align-items: end;
      }

      .channelExperience {
        margin-top: 72px;
        min-height: 560px;
        display: grid;
        grid-template-columns:
          410px 1fr;
        gap: 50px;
      }

      .channelList {
        display: grid;
        align-content: center;
        min-width: 0;
      }

      .channelButton {
        width: 100%;
        border: none;
        background: transparent;
        border-top:
          1px solid rgba(255,255,255,.08);
        padding: 20px 5px;
        text-align: left;
        display: grid;
        grid-template-columns:
          34px 1fr 25px;
        gap: 15px;
        align-items: center;
        cursor: pointer;
        color: white;
        opacity: .38;
        transition:
          opacity .3s ease,
          padding .3s ease,
          background .3s ease;
      }

      .channelButton:last-child {
        border-bottom:
          1px solid rgba(255,255,255,.08);
      }

      .channelButtonActive {
        opacity: 1;
        padding-left: 13px;
        background:
          linear-gradient(
            90deg,
            rgba(216,198,166,.06),
            transparent
          );
      }

      .channelNumber {
        color: #D8C6A6;
        font-size: 8px;
        font-weight: 850;
      }

      .channelButton strong {
        display: block;
        font-size: 12px;
      }

      .channelButton p {
        margin: 4px 0 0;
        color:
          rgba(255,255,255,.42);
        font-size: 9px;
        line-height: 1.5;
      }

      .channelArrow {
        text-align: right;
        color: #D8C6A6;
      }

      .channelMap {
        position: relative;
        min-height: 520px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
      }

      .channelUniverse {
        position: relative;
        width: 540px;
        height: 540px;
        flex: 0 0 auto;
      }

      .universeRing {
        position: absolute;
        border-radius: 50%;
        border:
          1px solid rgba(216,198,166,.10);
        left: 50%;
        top: 50%;
        transform:
          translate(-50%, -50%);
      }

      .universeRingOne {
        width: 250px;
        height: 250px;
      }

      .universeRingTwo {
        width: 390px;
        height: 390px;
      }

      .universeRingThree {
        width: 520px;
        height: 520px;
      }

      .universeCore {
        position: absolute;
        z-index: 10;
        left: 50%;
        top: 50%;
        transform:
          translate(-50%, -50%);
        width: 150px;
        height: 150px;
        border-radius: 50%;
        background:
          linear-gradient(
            145deg,
            #164F42,
            #082F27
          );
        border:
          1px solid rgba(216,198,166,.25);
        box-shadow:
          0 0 80px rgba(11,118,99,.20);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .universeCore strong {
        font-size: 27px;
        color: white;
      }

      .universeCore span {
        margin-top: 3px;
        color: #D8C6A6;
        font-size: 7px;
        letter-spacing: 1.5px;
      }

      .channelNode {
        position: absolute;
        z-index: 15;
        width: 112px;
        height: 72px;
        border-radius: 15px;
        background:
          rgba(255,255,255,.055);
        border:
          1px solid rgba(255,255,255,.08);
        backdrop-filter:
          blur(14px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color:
          rgba(255,255,255,.45);
        transition:
          transform .35s ease,
          color .35s ease,
          background .35s ease,
          border .35s ease;
      }

      .channelNode strong {
        font-size: 10px;
      }

      .channelNode span {
        margin-top: 3px;
        font-size: 7px;
      }

      .channelNodeActive {
        transform: scale(1.08);
        color: white;
        background:
          rgba(216,198,166,.09);
        border:
          1px solid rgba(216,198,166,.22);
        box-shadow:
          0 14px 35px rgba(0,0,0,.18);
      }

      .nodeWhatsapp {
        left: 0;
        top: 84px;
      }

      .nodeWebsite {
        right: 0;
        top: 84px;
      }

      .nodeCampaign {
        left: 0;
        bottom: 84px;
      }

      .nodePortal {
        right: 0;
        bottom: 84px;
      }

      .channelLine {
        position: absolute;
        z-index: 1;
        left: 50%;
        top: 50%;
        width: 190px;
        height: 1px;
        background:
          linear-gradient(
            90deg,
            rgba(216,198,166,.36),
            transparent
          );
        transform-origin: left;
        opacity: .20;
        transition:
          opacity .35s ease;
      }

      .channelLineActive {
        opacity: .90;
      }

      .lineWhatsapp {
        transform:
          rotate(210deg);
      }

      .lineWebsite {
        transform:
          rotate(-30deg);
      }

      .lineCampaign {
        transform:
          rotate(150deg);
      }

      .linePortal {
        transform:
          rotate(30deg);
      }

      .visionSection {
        padding: 112px 34px;
        background: #F7F3EB;
      }

      .visionTop {
        display: grid;
        grid-template-columns:
          1.1fr .9fr;
        gap: 90px;
        align-items: end;
      }

      .visionSideCopy p {
        margin: 0;
        max-width: 480px;
        color: #68736D;
        font-size: 13px;
        line-height: 1.8;
      }

      .visionDisclaimer {
        margin-top: 18px;
        display: inline-block;
        padding: 7px 10px;
        border-radius: 999px;
        background: #ECE5D9;
        color: #938267;
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 850;
      }

      .commandCenter {
        margin-top: 65px;
        min-height: 690px;
        border-radius: 28px;
        overflow: hidden;
        background: #0A2E27;
        display: grid;
        grid-template-columns:
          220px 1fr;
        box-shadow:
          0 40px 100px rgba(8,47,39,.17);
        border:
          1px solid rgba(16,24,20,.08);
      }

      .commandSidebar {
        padding: 26px 20px;
        border-right:
          1px solid rgba(255,255,255,.07);
        display: flex;
        flex-direction: column;
      }

      .commandSidebarBrand {
        display: flex;
        align-items: center;
        gap: 10px;
        color: white;
      }

      .commandSidebarBrandIcon {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #164F42;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 850;
      }

      .commandSidebarBrand strong {
        font-size: 11px;
      }

      .commandSidebarBrand span {
        display: block;
        margin-top: 2px;
        color:
          rgba(255,255,255,.35);
        font-size: 7px;
      }

      .commandMenu {
        margin-top: 40px;
        display: grid;
        gap: 5px;
      }

      .commandMenuItem {
        padding: 10px 11px;
        border-radius: 10px;
        color:
          rgba(255,255,255,.38);
        font-size: 8px;
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .commandMenuItemActive {
        color: white;
        background:
          rgba(255,255,255,.06);
      }

      .commandMenuIcon {
        width: 17px;
        text-align: center;
        color: #D8C6A6;
      }

      .commandSidebarBottom {
        margin-top: auto;
        padding: 13px;
        border-radius: 12px;
        background:
          rgba(255,255,255,.04);
        border:
          1px solid rgba(255,255,255,.05);
      }

      .commandSidebarBottom strong {
        display: block;
        color: white;
        font-size: 8px;
      }

      .commandSidebarBottom span {
        display: block;
        margin-top: 3px;
        color:
          rgba(255,255,255,.35);
        font-size: 7px;
      }

      .commandCenterMain {
        padding: 30px;
        min-width: 0;
      }

      .commandHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 25px;
      }

      .commandHeader span {
        color:
          rgba(255,255,255,.34);
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 1.2px;
      }

      .commandHeader h3 {
        margin: 6px 0 0;
        color: white;
        font-size: 23px;
        font-weight: 620;
      }

      .commandHeaderActions {
        display: flex;
        gap: 8px;
      }

      .commandHeaderButton {
        padding: 8px 11px;
        border-radius: 9px;
        border:
          1px solid rgba(255,255,255,.06);
        background:
          rgba(255,255,255,.035);
        color:
          rgba(255,255,255,.48);
        font-size: 7px;
      }

      .commandStats {
        margin-top: 26px;
        display: grid;
        grid-template-columns:
          repeat(4, 1fr);
        gap: 10px;
      }

      .commandStat {
        padding: 16px;
        border-radius: 13px;
        background:
          rgba(255,255,255,.04);
        border:
          1px solid rgba(255,255,255,.055);
      }

      .commandStat span {
        color:
          rgba(255,255,255,.34);
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: .8px;
      }

      .commandStat strong {
        display: block;
        margin-top: 8px;
        color: white;
        font-size: 22px;
        font-weight: 620;
      }

      .commandStat small {
        display: block;
        margin-top: 3px;
        color: #78C6A6;
        font-size: 7px;
      }

      .commandMainGrid {
        margin-top: 18px;
        display: grid;
        grid-template-columns:
          minmax(0, 1.6fr)
          minmax(230px, .65fr);
        gap: 14px;
      }

      .commandLeadTable,
      .commandIntelligencePanel {
        border-radius: 15px;
        border:
          1px solid rgba(255,255,255,.055);
        background:
          rgba(255,255,255,.035);
        min-width: 0;
      }

      .commandLeadTable {
        padding: 18px;
      }

      .tableTitleRow {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
      }

      .tableTitleRow span {
        display: block;
        color:
          rgba(255,255,255,.32);
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .tableTitleRow strong {
        display: block;
        margin-top: 5px;
        color: white;
        font-size: 12px;
      }

      .liveChip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border-radius: 999px;
        color: #78C6A6;
        background:
          rgba(120,198,166,.08);
        font-size: 7px;
      }

      .liveChip span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #78C6A6;
      }

      .leadRows {
        margin-top: 17px;
      }

      .commandLeadRow {
        display: grid;
        grid-template-columns:
          34px 1fr 90px 82px 40px;
        gap: 10px;
        align-items: center;
        padding: 12px 8px;
        border-top:
          1px solid rgba(255,255,255,.055);
        transition:
          background .25s ease,
          transform .25s ease;
      }

      .commandLeadRowActive {
        background:
          rgba(255,255,255,.045);
        transform:
          translateX(3px);
      }

      .commandLeadAvatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background:
          rgba(216,198,166,.10);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 7px;
        font-weight: 850;
      }

      .commandLeadIdentity {
        min-width: 0;
      }

      .commandLeadIdentity strong {
        display: block;
        color: white;
        font-size: 8px;
      }

      .commandLeadIdentity span {
        display: block;
        margin-top: 3px;
        color:
          rgba(255,255,255,.34);
        font-size: 7px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .commandLeadBudget {
        color:
          rgba(255,255,255,.65);
        font-size: 7px;
      }

      .commandLeadStatus {
        font-size: 7px;
        font-weight: 750;
      }

      .statusQualified {
        color: #75D0AC;
      }

      .statusProgress {
        color: #D8C6A6;
      }

      .statusDue {
        color: #E5A785;
      }

      .commandLeadAge {
        text-align: right;
        color:
          rgba(255,255,255,.25);
        font-size: 7px;
      }

      .commandIntelligencePanel {
        padding: 20px;
      }

      .commandPanelLabel {
        color: #D8C6A6;
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 850;
      }

      .commandIntelligencePanel h3 {
        margin: 6px 0 0;
        color: white;
        font-size: 15px;
        font-weight: 620;
      }

      .qualityRing {
        margin: 25px auto 20px;
        width: 145px;
        height: 145px;
        border-radius: 50%;
        background:
          conic-gradient(
            #D8C6A6 0deg 308deg,
            rgba(255,255,255,.07)
            308deg 360deg
          );
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qualityRingInner {
        width: 116px;
        height: 116px;
        border-radius: 50%;
        background: #0D352D;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .qualityRingInner strong {
        color: white;
        font-size: 26px;
        font-weight: 620;
      }

      .qualityRingInner span {
        margin-top: 2px;
        color:
          rgba(255,255,255,.32);
        font-size: 7px;
      }

      .qualityDetails {
        display: grid;
      }

      .qualityLine {
        min-height: 35px;
        border-top:
          1px solid rgba(255,255,255,.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .qualityLine span {
        color:
          rgba(255,255,255,.34);
        font-size: 7px;
      }

      .qualityLine strong {
        color:
          rgba(255,255,255,.72);
        font-size: 7px;
      }

      .qualityRecommendation {
        margin-top: 16px;
        padding: 12px;
        border-radius: 11px;
        background:
          rgba(216,198,166,.07);
        color:
          rgba(255,255,255,.48);
        font-size: 7px;
        line-height: 1.5;
      }

      .qualityRecommendation span {
        display: block;
        margin-bottom: 4px;
        color: #D8C6A6;
        font-weight: 850;
        letter-spacing: .8px;
      }

      .storySection {
        padding: 74px 34px;
        background: #FFFDF8;
        border-top:
          1px solid rgba(16,24,20,.06);
        border-bottom:
          1px solid rgba(16,24,20,.06);
      }

      .storyTrack {
        max-width: 1160px;
        margin: 0 auto;
        display: grid;
        grid-template-columns:
          1fr 65px 1fr 65px 1fr 65px 1fr;
        align-items: center;
      }

      .storyPoint {
        text-align: center;
      }

      .storyPointNumber {
        color: #B99862;
        font-size: 8px;
        letter-spacing: 1px;
        font-weight: 850;
      }

      .storyPoint h3 {
        margin: 11px 0 0;
        color: #082F27;
        font-size: 15px;
      }

      .storyPoint p {
        margin: 6px auto 0;
        max-width: 180px;
        color: #7A847E;
        font-size: 9px;
        line-height: 1.55;
      }

      .storyConnector {
        height: 1px;
        background:
          linear-gradient(
            90deg,
            rgba(185,152,98,.10),
            rgba(185,152,98,.70),
            rgba(185,152,98,.10)
          );
      }

      .finalCTASection {
        position: relative;
        min-height: 690px;
        background: #082F27;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        text-align: center;
        padding: 85px 30px;
      }

      .finalCTAVisual {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .finalCTARing {
        position: absolute;
        left: 50%;
        top: 50%;
        border-radius: 50%;
        border:
          1px solid rgba(216,198,166,.11);
        transform:
          translate(-50%, -50%);
      }

      .finalCTARing1 {
        width: 360px;
        height: 360px;
        animation:
          rotateCore 28s linear infinite;
      }

      .finalCTARing2 {
        width: 560px;
        height: 560px;
        animation:
          rotateCoreReverse 38s linear infinite;
      }

      .finalCTARing3 {
        width: 780px;
        height: 780px;
        opacity: .55;
      }

      .finalCTAContent {
        position: relative;
        z-index: 5;
      }

      .finalCTAContent h2 {
        margin: 24px 0 0;
        font-size:
          clamp(48px, 6vw, 84px);
        line-height: .98;
        letter-spacing: -4px;
        font-weight: 620;
      }

      .finalCTAContent h2 span {
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-style: italic;
        font-weight: 400;
        color: #D8C6A6;
      }

      .finalCTAContent p {
        margin: 26px auto 0;
        max-width: 520px;
        color:
          rgba(255,255,255,.48);
        font-size: 13px;
        line-height: 1.8;
      }

      .finalCTAButton {
        margin-top: 34px;
        border: none;
        border-radius: 999px;
        padding: 16px 26px;
        background: #FFFDF8;
        color: #082F27;
        font-size: 11px;
        font-weight: 850;
        cursor: pointer;
        box-shadow:
          0 16px 40px rgba(0,0,0,.18);
        transition:
          transform .25s ease,
          box-shadow .25s ease;
      }

      .finalCTAButton span {
        margin-left: 12px;
      }

      .finalCTAButton:hover {
        transform: translateY(-2px);
        box-shadow:
          0 23px 55px rgba(0,0,0,.25);
      }

      .siteFooter {
        padding: 30px 38px;
        background: #101814;
        display: grid;
        grid-template-columns:
          1fr auto 1fr;
        align-items: center;
        gap: 20px;
      }

      .footerMiddle {
        text-align: center;
        color:
          rgba(255,255,255,.36);
        font-size: 8px;
      }

      .footerRight {
        text-align: right;
        color:
          rgba(255,255,255,.34);
        font-size: 8px;
        letter-spacing: .8px;
      }

      .liveDemoPage {
        height: 100dvh;
        min-height: 100dvh;
        background:
          linear-gradient(
            135deg,
            #F0E9DE,
            #FBF9F4
          );
        color: #101814;
        font-family:
          Inter,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          Arial,
          sans-serif;
        position: relative;
        overflow: hidden;
        padding: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .demoAmbientOne,
      .demoAmbientTwo {
        position: fixed;
        border-radius: 50%;
        pointer-events: none;
      }

      .demoAmbientOne {
        width: 650px;
        height: 650px;
        right: -160px;
        top: -160px;
        background:
          radial-gradient(
            circle,
            rgba(185,152,98,.22),
            transparent 68%
          );
      }

      .demoAmbientTwo {
        width: 560px;
        height: 560px;
        left: -180px;
        bottom: -200px;
        background:
          radial-gradient(
            circle,
            rgba(11,118,99,.10),
            transparent 68%
          );
      }

      .backToNomadButton {
        position: fixed;
        top: 14px;
        left: 14px;
        z-index: 30;
        border:
          1px solid rgba(16,24,20,.08);
        background:
          rgba(255,253,248,.88);
        color: #082F27;
        padding: 9px 14px;
        border-radius: 999px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
        box-shadow:
          0 8px 22px rgba(16,24,20,.05);
        backdrop-filter:
          blur(12px);
      }

      .demoExperienceFrame {
        width: min(1180px, calc(100vw - 48px));
        height: min(760px, calc(100dvh - 48px));
        min-height: 0;
        display: grid;
        grid-template-columns:
          minmax(0, 1fr)
          minmax(390px, 470px);
        border-radius: 26px;
        overflow: hidden;
        box-shadow:
          0 35px 90px rgba(16,24,20,.16);
        border:
          1px solid rgba(16,24,20,.07);
        position: relative;
        z-index: 5;
      }

      .demoStoryPanel {
        min-width: 0;
        min-height: 0;
        padding: clamp(28px, 3.5vw, 48px);
        background:
          linear-gradient(
            145deg,
            #082F27,
            #0D4035
          );
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
      }

      .demoStoryEyebrow {
        margin-top: clamp(28px, 6vh, 62px);
        color: #D8C6A6;
        font-size: 8px;
        letter-spacing: 1.6px;
        font-weight: 850;
      }

      .demoStoryPanel h1 {
        margin: 18px 0 0;
        max-width: 550px;
        font-size:
          clamp(38px, 4vw, 54px);
        line-height: .98;
        letter-spacing: -2.6px;
        font-weight: 620;
      }

      .demoStoryPanel h1 span {
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-style: italic;
        font-weight: 400;
        color: #D8C6A6;
      }

      .demoStoryPanel p {
        margin: 20px 0 0;
        max-width: 510px;
        color:
          rgba(255,255,255,.47);
        font-size: 12px;
        line-height: 1.65;
      }

      .demoStoryRail {
        display: grid;
        grid-template-columns:
          repeat(3, 1fr);
        border-top:
          1px solid rgba(255,255,255,.10);
      }

      .demoRailItem {
        position: relative;
        padding: 13px 7px 0;
        color:
          rgba(255,255,255,.30);
        transition:
          color .3s ease;
      }

      .demoRailItem::before {
        content: "";
        position: absolute;
        top: -1px;
        left: 0;
        width: 0;
        height: 1px;
        background: #D8C6A6;
        transition:
          width .35s ease;
      }

      .demoRailItemActive {
        color: white;
      }

      .demoRailItemActive::before {
        width: 100%;
      }

      .demoRailItem span {
        display: block;
        color: #D8C6A6;
        font-size: 7px;
      }

      .demoRailItem strong {
        display: block;
        margin-top: 5px;
        font-size: 8px;
      }

      .demoStoryFooter {
        color:
          rgba(255,255,255,.29);
        font-size: 8px;
        line-height: 1.6;
      }

      .chatShell {
        min-width: 0;
        min-height: 0;
        height: 100%;
        background: #FFFDF8;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .chatHeader {
        flex: 0 0 auto;
        background: #082F27;
        color: white;
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content:
          space-between;
        gap: 15px;
      }

      .chatIdentity {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .chatAvatar {
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        border-radius: 50%;
        background:
          linear-gradient(
            135deg,
            #206250,
            #0F4035
          );
        border:
          1px solid rgba(255,255,255,.12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 850;
        font-size: 13px;
      }

      .chatTitle {
        font-size: 12px;
        font-weight: 760;
      }

      .chatStatus {
        margin-top: 4px;
        color:
          rgba(255,255,255,.58);
        font-size: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .statusDot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #71C3A3;
      }

      .statusDotBusy {
        background: #D8C6A6;
      }

      .newConversationButton {
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        border-radius: 50%;
        border:
          1px solid rgba(255,255,255,.13);
        background:
          rgba(255,255,255,.05);
        color: white;
        cursor: pointer;
        font-size: 16px;
      }

      .chatBody {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        background: #F9F6EF;
        padding: 20px 18px 24px;
        scroll-padding-bottom: 20px;
      }

      .chatSessionLabel {
        text-align: center;
        margin-bottom: 20px;
        color: #B99862;
        font-size: 7px;
        font-weight: 850;
        letter-spacing: 1.4px;
        text-transform: uppercase;
      }

      .chatMessageRow {
        display: flex;
        margin-bottom: 14px;
      }

      .chatMessageAssistant {
        justify-content: flex-start;
      }

      .chatMessageUser {
        justify-content: flex-end;
      }

      .chatMiniAvatar {
        width: 27px;
        height: 27px;
        margin-right: 8px;
        margin-top: 2px;
        flex-shrink: 0;
        border-radius: 50%;
        background: #082F27;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: 850;
      }

      .chatMessageBubble {
        max-width: 79%;
        padding: 11px 14px;
        color: #101814;
        font-size: 12px;
        line-height: 1.58;
        white-space: pre-line;
        overflow-wrap: anywhere;
        box-shadow:
          0 2px 8px rgba(16,24,20,.05);
      }

      .chatMessageAssistant .chatMessageBubble {
        background: #FFFDF8;
        border-radius:
          16px 16px 16px 4px;
      }

      .chatMessageUser .chatMessageBubble {
        background: #E8E3D7;
        border-radius:
          16px 16px 4px 16px;
      }

      .typingBubble {
        background: #FFFDF8;
        padding: 11px 14px;
        border-radius:
          16px 16px 16px 4px;
        color: #948C80;
        letter-spacing: 2px;
      }

      .requestReceived {
        margin-top: 22px;
        padding: 20px;
        border-radius: 18px;
        background:
          linear-gradient(
            145deg,
            #EDF4F0,
            #F5F7F3
          );
        border:
          1px solid #DDEAE4;
        animation:
          requestReceivedIn .45s ease both;
      }

      @keyframes requestReceivedIn {
        from {
          opacity: 0;
          transform:
            translateY(12px);
        }

        to {
          opacity: 1;
          transform:
            translateY(0);
        }
      }

      .requestReceivedTop {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .requestReceivedIcon {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        border-radius: 50%;
        background: #082F27;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 850;
      }

      .requestReceivedLabel {
        color: #9B7A47;
        text-transform: uppercase;
        letter-spacing: 1.15px;
        font-size: 7px;
        font-weight: 850;
      }

      .requestReceived h3 {
        margin: 5px 0 0;
        color: #082F27;
        font-size: 14px;
        font-weight: 760;
      }

      .requestReceived p {
        margin: 10px 0 0 48px;
        color: #69766F;
        font-size: 9px;
        line-height: 1.65;
      }

      .chatComposerArea {
        flex: 0 0 auto;
        padding: 12px 14px 14px;
        background: #FFFDF8;
        border-top:
          1px solid rgba(16,24,20,.08);
      }

      .composer {
        display: flex;
        align-items: center;
        gap: 10px;
        padding:
          5px 5px 5px 16px;
        background: #F3EFE7;
        border-radius: 999px;
        border:
          1px solid rgba(16,24,20,.07);
        transition:
          opacity .25s ease;
      }

      .composerComplete {
        opacity: .50;
      }

      .composer input {
        flex: 1;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        padding: 10px 0;
        font-size: 11px;
        color: #101814;
      }

      .composer button {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border: none;
        border-radius: 50%;
        background: #082F27;
        color: white;
        cursor: pointer;
        font-size: 13px;
        transition:
          opacity .2s ease,
          transform .2s ease;
      }

      .composer button:disabled {
        opacity: .28;
        cursor: not-allowed;
      }

      .composer button:not(:disabled):hover {
        transform: scale(1.04);
      }

      .composerFooter {
        margin-top: 8px;
        text-align: center;
        color: #999186;
        font-size: 7px;
        letter-spacing: .4px;
      }

      @media (max-width: 1120px) {
        .heroGrid,
        .sectionHeaderSplit,
        .channelHeader,
        .visionTop {
          gap: 50px;
        }

        .intelligenceWorkspace {
          grid-template-columns:
            minmax(0, 1fr)
            170px
            minmax(0, 1fr);
        }

        .commandCenter {
          grid-template-columns:
            180px 1fr;
        }

        .demoExperienceFrame {
          grid-template-columns:
            minmax(0, .9fr)
            minmax(390px, 450px);
        }

        .demoStoryPanel {
          padding: 34px;
        }

        .demoStoryPanel h1 {
          font-size: 44px;
        }
      }

      @media (max-width: 960px) {
        .desktopNavLinks {
          display: none;
        }

        .heroOuter {
          padding-top: 35px;
        }

        .heroGrid {
          grid-template-columns: 1fr;
        }

        .heroProductStage {
          min-height: 610px;
        }

        .heroTitle {
          font-size: 65px;
        }

        .sectionHeaderSplit,
        .channelHeader,
        .visionTop {
          grid-template-columns: 1fr;
          gap: 30px;
        }

        .intelligenceWorkspace {
          grid-template-columns: 1fr;
        }

        .intelligenceCore {
          height: 280px;
        }

        .structuredLeadPanel,
        .intelligenceInputPanel {
          min-height: auto;
        }

        .intelligenceStageRail {
          overflow-x: auto;
          grid-template-columns:
            repeat(6, 125px);
        }

        .customerPerspective,
        .salesPerspective {
          grid-template-columns: 1fr;
        }

        .customerPhoneStage {
          min-height: 580px;
        }

        .salesPerspectiveSidebar {
          border-right: none;
          border-bottom:
            1px solid rgba(255,255,255,.08);
        }

        .channelExperience {
          grid-template-columns: 1fr;
        }

        .channelList {
          order: 2;
        }

        .channelMap {
          order: 1;
        }

        .commandCenter {
          grid-template-columns: 1fr;
        }

        .commandSidebar {
          display: none;
        }

        .commandMainGrid {
          grid-template-columns: 1fr;
        }

        .storyTrack {
          grid-template-columns: 1fr;
          gap: 28px;
        }

        .storyConnector {
          width: 1px;
          height: 28px;
          margin: auto;
        }

        .siteFooter {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .siteFooter > * {
          justify-self: center;
        }

        .footerRight {
          text-align: center;
        }

        .liveDemoPage {
          padding: 18px;
        }

        .demoExperienceFrame {
          width: min(520px, calc(100vw - 36px));
          height: calc(100dvh - 36px);
          max-height: none;
          grid-template-columns: 1fr;
          border-radius: 24px;
        }

        .demoStoryPanel {
          display: none;
        }

        .chatShell {
          height: 100%;
          min-height: 0;
        }
      }

      @media (max-width: 620px) {
        .siteNav {
          padding:
            18px 16px;
          align-items: center;
        }

        .navRight {
          gap: 10px;
        }

        .siteNav .primaryPill {
          padding:
            10px 12px;
          font-size: 8px;
        }

        .siteNav .primaryPill span {
          margin-left: 6px;
        }

        .heroOuter {
          padding:
            32px 18px 58px;
        }

        .heroGrid {
          gap: 22px;
        }

        .heroCopy {
          padding-bottom: 0;
        }

        .eyebrow {
          gap: 8px;
          font-size: 7.5px;
          letter-spacing: 1.3px;
        }

        .eyebrowLine {
          width: 24px;
        }

        .heroTitle {
          margin-top: 22px;
          font-size:
            clamp(44px, 13.5vw, 56px);
          line-height: .96;
          letter-spacing: -2.8px;
        }

        .heroTitle span {
          letter-spacing: -2px;
        }

        .heroDescription {
          margin-top: 24px;
          font-size: 13px;
          line-height: 1.65;
        }

        .heroActions {
          margin-top: 26px;
          align-items: flex-start;
          flex-direction: column;
          gap: 14px;
        }

        .heroPrimaryButton {
          width: 100%;
          min-height: 48px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 11px;
        }

        .heroMicroCopy {
          font-size: 10px;
        }

        .heroStats {
          margin-top: 38px;
          grid-template-columns:
            repeat(3, 1fr);
          max-width: 100%;
        }

        .heroLocation {
          margin-top: 28px;
          font-size: 7px;
          letter-spacing: 1.25px;
        }

        .heroProductStage {
          min-height: 460px;
          width: 100%;
          overflow: hidden;
        }

        .heroFloatingCard {
          width: calc(100% - 18px);
          max-width: 390px;
          border-radius: 22px;
        }

        .demoCardHeader {
          padding: 15px 16px;
        }

        .demoMiniAvatar {
          width: 34px;
          height: 34px;
          font-size: 10px;
        }

        .demoCardTitle {
          font-size: 10px;
        }

        .demoCardStatus {
          font-size: 8px;
        }

        .previewConversation {
          padding: 20px 16px;
        }

        .previewBubble {
          max-width: 88%;
          font-size: 10px;
        }

        .previewInsight {
          margin-top: 20px;
        }

        .floatingIntelligenceTag {
          display: none;
        }

        .heroArchitectureArc {
          width: 92%;
          height: 82%;
          right: 4%;
          top: 4%;
        }

        .heroArchitectureArc2 {
          width: 72%;
          right: 14%;
          top: 13%;
        }

        .heroOrbit {
          width: 360px;
          height: 360px;
        }

        .intelligenceSection,
        .perspectiveSection,
        .channelSection,
        .visionSection {
          padding:
            72px 18px;
        }

        .sectionTitleLight,
        .sectionTitleDark {
          margin-top: 18px;
          font-size:
            clamp(38px, 11.5vw, 46px);
          letter-spacing: -2px;
          line-height: 1.03;
        }

        .sectionLeadLight,
        .perspectiveHeading p {
          font-size: 13px;
          line-height: 1.7;
        }

        .intelligenceWorkspace {
          margin-top: 44px;
          gap: 22px;
          min-height: 0;
        }

        .intelligenceInputPanel,
        .structuredLeadPanel {
          padding: 18px;
          border-radius: 18px;
        }

        .intelligenceMessage {
          margin-top: 18px;
          padding: 14px;
        }

        .intelligenceMessage p {
          font-size: 11px;
          line-height: 1.6;
        }

        .signalDivider {
          white-space: normal;
          text-align: center;
          font-size: 6px;
        }

        .thinkingRow {
          grid-template-columns:
            26px 1fr auto;
          gap: 8px;
        }

        .intelligenceCore {
          height: 250px;
          transform: scale(.82);
        }

        .structuredLeadTop {
          flex-direction: column;
          gap: 12px;
        }

        .qualifiedBadge {
          align-self: flex-start;
        }

        .intelligenceStageRail {
          margin-top: 28px;
          grid-template-columns:
            repeat(6, 105px);
        }

        .stageRailItem {
          font-size: 7px;
          padding: 14px 6px;
        }

        .perspectiveSwitcher {
          width: 100%;
          margin-top: 34px;
        }

        .perspectiveSwitcher button {
          flex: 1;
          padding: 11px 10px;
          font-size: 8px;
        }

        .perspectiveStage {
          margin-top: 26px;
          min-height: 790px;
        }

        .customerPerspective,
        .salesPerspective {
          min-height: 760px;
          border-radius: 22px;
        }

        .customerPerspectiveCopy {
          padding: 32px 22px;
        }

        .customerPerspectiveCopy h3 {
          font-size: 32px;
          letter-spacing: -1.4px;
        }

        .customerPerspectiveCopy p {
          font-size: 12px;
          line-height: 1.65;
        }

        .customerPerspectivePoint {
          font-size: 10px;
        }

        .customerPhoneStage {
          min-height: 420px;
          padding: 24px 14px;
        }

        .customerPhone {
          width: min(300px, 100%);
          border-radius: 24px;
        }

        .customerPhoneBody {
          min-height: 350px;
        }

        .salesPerspectiveMain,
        .salesPerspectiveSidebar {
          padding: 26px 20px;
        }

        .salesPerspectiveSidebar h3 {
          font-size: 24px;
        }

        .salesStructuredGrid {
          grid-template-columns: 1fr;
        }

        .channelExperience {
          margin-top: 42px;
          gap: 26px;
          min-height: 0;
        }

        .channelMap {
          min-height: 350px;
          width: 100%;
          overflow: hidden;
        }

        .channelUniverse {
          width: 320px;
          height: 320px;
          max-width: 100%;
          margin: 0 auto;
          transform: none;
        }

        .universeRingOne {
          width: 145px;
          height: 145px;
        }

        .universeRingTwo {
          width: 225px;
          height: 225px;
        }

        .universeRingThree {
          width: 310px;
          height: 310px;
        }

        .universeCore {
          width: 92px;
          height: 92px;
        }

        .universeCore strong {
          font-size: 20px;
        }

        .universeCore span {
          font-size: 5.5px;
          letter-spacing: 1px;
        }

        .channelNode {
          width: 92px;
          height: 58px;
          border-radius: 12px;
        }

        .channelNode strong {
          font-size: 9px;
        }

        .channelNode span {
          font-size: 6px;
        }

        .nodeWhatsapp {
          left: 4px;
          top: 44px;
        }

        .nodeWebsite {
          right: 4px;
          top: 44px;
        }

        .nodeCampaign {
          left: 4px;
          bottom: 44px;
        }

        .nodePortal {
          right: 4px;
          bottom: 44px;
        }

        .channelLine {
          width: 105px;
        }

        .channelButton {
          grid-template-columns:
            26px 1fr 20px;
          gap: 10px;
          padding: 17px 4px;
        }

        .channelButtonActive {
          padding-left: 8px;
        }

        .channelButton strong {
          font-size: 12px;
        }

        .channelButton p {
          font-size: 9px;
          line-height: 1.5;
        }

        .visionTop {
          gap: 24px;
        }

        .commandCenter {
          margin-top: 42px;
          min-height: 0;
          border-radius: 20px;
        }

        .commandCenterMain {
          padding: 16px;
        }

        .commandHeader {
          align-items: flex-start;
        }

        .commandHeader h3 {
          font-size: 18px;
        }

        .commandHeaderActions {
          display: none;
        }

        .commandStats {
          grid-template-columns:
            repeat(2, 1fr);
          gap: 8px;
        }

        .commandStat {
          padding: 13px;
        }

        .commandStat strong {
          font-size: 19px;
        }

        .commandMainGrid {
          gap: 10px;
        }

        .commandLeadTable {
          padding: 13px;
        }

        .commandLeadRow {
          grid-template-columns:
            30px minmax(0, 1fr) 36px;
          gap: 8px;
          padding: 11px 4px;
        }

        .commandLeadBudget,
        .commandLeadStatus {
          display: none;
        }

        .commandLeadIdentity strong {
          font-size: 9px;
        }

        .commandLeadIdentity span {
          font-size: 7px;
        }

        .commandLeadAge {
          font-size: 7px;
        }

        .commandIntelligencePanel {
          padding: 17px;
        }

        .storySection {
          padding:
            62px 18px;
        }

        .storyTrack {
          gap: 22px;
        }

        .storyPoint h3 {
          font-size: 17px;
        }

        .storyPoint p {
          font-size: 10px;
          max-width: 230px;
        }

        .finalCTASection {
          min-height: 600px;
          padding: 70px 18px;
        }

        .finalCTAContent h2 {
          font-size:
            clamp(44px, 13vw, 54px);
          letter-spacing: -2.6px;
        }

        .finalCTAContent p {
          font-size: 12px;
        }

        .finalCTAButton {
          width: 100%;
          max-width: 320px;
          min-height: 48px;
        }

        .siteFooter {
          padding: 28px 18px;
        }

        .liveDemoPage {
          height: 100dvh;
          min-height: 100dvh;
          padding: 0;
          display: block;
          background: #FFFDF8;
        }

        .demoAmbientOne,
        .demoAmbientTwo {
          display: none;
        }

        .backToNomadButton {
          top: max(10px, env(safe-area-inset-top));
          left: 10px;
          padding: 8px 12px;
          font-size: 8px;
          background:
            rgba(255,253,248,.92);
        }

        .demoExperienceFrame {
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;
          max-height: none;
          border-radius: 0;
          border: none;
          box-shadow: none;
        }

        .chatShell {
          height: 100dvh;
          min-height: 0;
        }

        .chatHeader {
          padding:
            calc(14px + env(safe-area-inset-top))
            14px
            14px;
          min-height: 74px;
        }

        .chatAvatar {
          width: 38px;
          height: 38px;
          font-size: 11px;
        }

        .chatTitle {
          font-size: 11px;
        }

        .chatStatus {
          font-size: 7.5px;
        }

        .newConversationButton {
          width: 36px;
          height: 36px;
        }

        .chatBody {
          padding:
            18px 14px 22px;
        }

        .chatSessionLabel {
          margin-bottom: 18px;
          font-size: 6.5px;
        }

        .chatMessageRow {
          margin-bottom: 12px;
        }

        .chatMiniAvatar {
          width: 25px;
          height: 25px;
        }

        .chatMessageBubble {
          max-width: 84%;
          padding: 11px 13px;
          font-size: 13px;
          line-height: 1.5;
        }

        .requestReceived {
          padding: 16px;
        }

        .requestReceived p {
          margin-left: 0;
          font-size: 10px;
        }

        .chatComposerArea {
          padding:
            10px
            12px
            calc(10px + env(safe-area-inset-bottom));
        }

        .composer {
          padding:
            4px 4px 4px 14px;
        }

        .composer input {
          min-height: 42px;
          padding: 8px 0;
          font-size: 16px;
        }

        .composer button {
          width: 42px;
          height: 42px;
          font-size: 14px;
        }

        .composerFooter {
          display: none;
        }
      }

      @media (max-width: 380px) {
        .siteNav {
          padding:
            16px 12px;
        }

        .siteNav .primaryPill {
          padding:
            9px 10px;
          font-size: 7px;
        }

        .heroOuter {
          padding-left: 14px;
          padding-right: 14px;
        }

        .heroTitle {
          font-size: 42px;
        }

        .heroStats {
          grid-template-columns:
            repeat(3, 1fr);
        }

        .heroProductStage {
          min-height: 430px;
        }

        .intelligenceSection,
        .perspectiveSection,
        .channelSection,
        .visionSection {
          padding-left: 14px;
          padding-right: 14px;
        }

        .channelMap {
          min-height: 325px;
        }

        .channelUniverse {
          width: 300px;
          height: 300px;
        }

        .universeRingOne {
          width: 136px;
          height: 136px;
        }

        .universeRingTwo {
          width: 210px;
          height: 210px;
        }

        .universeRingThree {
          width: 290px;
          height: 290px;
        }

        .universeCore {
          width: 84px;
          height: 84px;
        }

        .channelNode {
          width: 84px;
          height: 54px;
        }

        .nodeWhatsapp {
          left: 2px;
          top: 42px;
        }

        .nodeWebsite {
          right: 2px;
          top: 42px;
        }

        .nodeCampaign {
          left: 2px;
          bottom: 42px;
        }

        .nodePortal {
          right: 2px;
          bottom: 42px;
        }

        .channelLine {
          width: 96px;
        }

        .chatMessageBubble {
          max-width: 86%;
          font-size: 12.5px;
        }
      }

      @media (
        min-width: 961px
      ) and (
        max-height: 820px
      ) {
        .liveDemoPage {
          padding: 18px;
        }

        .demoExperienceFrame {
          width: min(1140px, calc(100vw - 36px));
          height: calc(100dvh - 36px);
          grid-template-columns:
            minmax(0, 1fr)
            minmax(390px, 455px);
        }

        .demoStoryPanel {
          padding: 30px 36px;
        }

        .demoStoryEyebrow {
          margin-top: 30px;
        }

        .demoStoryPanel h1 {
          margin-top: 15px;
          font-size: 42px;
        }

        .demoStoryPanel p {
          margin-top: 16px;
          font-size: 11px;
          line-height: 1.6;
        }

        .chatHeader {
          padding: 13px 16px;
        }

        .chatAvatar {
          width: 38px;
          height: 38px;
        }

        .chatBody {
          padding:
            16px 16px 18px;
        }

        .chatSessionLabel {
          margin-bottom: 16px;
        }

        .chatMessageRow {
          margin-bottom: 11px;
        }

        .chatMessageBubble {
          padding: 10px 12px;
          font-size: 11px;
          line-height: 1.5;
        }

        .chatComposerArea {
          padding: 9px 12px 11px;
        }

        .composer input {
          padding: 8px 0;
        }

        .composer button {
          width: 36px;
          height: 36px;
        }

        .composerFooter {
          margin-top: 6px;
        }
      }

      @media (
        min-width: 961px
      ) and (
        max-height: 700px
      ) {
        .demoStoryEyebrow {
          margin-top: 18px;
        }

        .demoStoryPanel h1 {
          font-size: 36px;
        }

        .demoStoryPanel p {
          font-size: 10px;
        }

        .demoStoryFooter {
          display: none;
        }

        .chatBody {
          padding-top: 13px;
        }
      }
    `}</style>
  );
}

/* =========================================================
   SMALL SHARED COMPONENTS
   ========================================================= */

function Eyebrow({
  children,
  light = false,
}) {
  return (
    <div
      className={
        light
          ? "eyebrow eyebrowLight"
          : "eyebrow"
      }
    >
      <span className="eyebrowLine" />

      {children}
    </div>
  );
}

function Metric({
  value,
  label,
}) {
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
          marginTop: "4px",
          color: "#7F8882",
          fontSize: "8px",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   BRAND
   ========================================================= */

function BrandMark({
  dark = false,
}) {
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
          color: dark
            ? colors.ink
            : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "850",
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
            fontSize: "15px",
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
            fontSize: "7px",
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

/* =========================================================
   HERO COMPONENTS
   ========================================================= */

function HeroGridOverlay() {
  return (
    <div className="heroGridOverlay" />
  );
}

function HeroBottomFade() {
  return (
    <div className="heroBottomFade" />
  );
}

function HeroOrbit({
  pointer,
}) {
  return (
    <div
      className="heroOrbit"
      style={{
        transform: `translate(${pointer.x * 14}px, ${pointer.y * 10}px)`,
      }}
    >
      <div className="heroOrbitRing" />
    </div>
  );
}

function DemoCardHeader() {
  return (
    <div className="demoCardHeader">
      <div className="demoCardIdentity">
        <div className="demoMiniAvatar">
          N
        </div>

        <div>
          <div className="demoCardTitle">
            NOMAD Property Assistant
          </div>

          <div className="demoCardStatus">
            <span>
              ●
            </span>{" "}
            Available now
          </div>
        </div>
      </div>

      <div className="demoLiveLabel">
        LIVE
      </div>
    </div>
  );
}

function PreviewBubble({
  children,
  assistant = false,
}) {
  return (
    <div
      className={
        assistant
          ? "previewBubbleRow previewBubbleAssistant"
          : "previewBubbleRow previewBubbleUser"
      }
    >
      <div className="previewBubble">
        {children}
      </div>
    </div>
  );
}

function FloatingIntelligenceTag({
  label,
  value,
  detail,
  className = "",
}) {
  return (
    <div
      className={`floatingIntelligenceTag ${className}`}
    >
      <div className="floatingIntelligenceTagLabel">
        {label}
      </div>

      <div className="floatingIntelligenceTagValue">
        {value}
      </div>

      <div className="floatingIntelligenceTagDetail">
        {detail}
      </div>
    </div>
  );
}

/* =========================================================
   INTELLIGENCE LAB
   ========================================================= */

function SectionOrb({
  position = "left",
}) {
  return (
    <div
      className={
        position === "left"
          ? "sectionOrb sectionOrbLeft"
          : "sectionOrb sectionOrbRight"
      }
    />
  );
}

function PanelLabel({
  children,
}) {
  return (
    <div className="panelLabel">
      {children}
    </div>
  );
}

function ThinkingRow({
  active,
  label,
  value,
}) {
  return (
    <div
      className={
        active
          ? "thinkingRow thinkingRowActive"
          : "thinkingRow"
      }
    >
      <div className="thinkingCheck">
        {active
          ? "✓"
          : "·"}
      </div>

      <div className="thinkingLabel">
        {label}
      </div>

      <div className="thinkingValue">
        {active
          ? value
          : "Reading"}
      </div>
    </div>
  );
}

function StructuredDataRow({
  label,
  value,
  active,
}) {
  return (
    <div
      className={
        active
          ? "structuredDataRow structuredDataRowActive"
          : "structuredDataRow"
      }
    >
      <span className="structuredDataLabel">
        {label}
      </span>

      <strong className="structuredDataValue">
        {active
          ? value
          : "—"}
      </strong>
    </div>
  );
}

/* =========================================================
   PERSPECTIVE SWITCH
   ========================================================= */

function PerspectiveSwitcher({
  perspective,
  setPerspective,
}) {
  return (
    <div className="perspectiveSwitcher">
      <button
        className={
          perspective === "customer"
            ? "perspectiveSwitcherActive"
            : ""
        }
        onClick={() =>
          setPerspective("customer")
        }
      >
        CUSTOMER VIEW
      </button>

      <button
        className={
          perspective === "sales"
            ? "perspectiveSwitcherActive"
            : ""
        }
        onClick={() =>
          setPerspective("sales")
        }
      >
        SALES VIEW
      </button>
    </div>
  );
}

function CustomerPerspective() {
  return (
    <div className="customerPerspective">
      <div className="customerPerspectiveCopy">
        <div className="perspectiveMiniLabel">
          CUSTOMER EXPERIENCE
        </div>

        <h3>
          They never need to know
          they&apos;re being
          <span>
            {" "}
            qualified.
          </span>
        </h3>

        <p>
          The customer simply has a
          useful conversation. NOMAD asks
          only what matters, remembers
          what has already been said and
          finishes with a human handoff.
        </p>

        <div className="customerPerspectiveList">
          <CustomerPerspectivePoint>
            Natural conversation
          </CustomerPerspectivePoint>

          <CustomerPerspectivePoint>
            No rigid lead form
          </CustomerPerspectivePoint>

          <CustomerPerspectivePoint>
            No internal CRM language
          </CustomerPerspectivePoint>

          <CustomerPerspectivePoint>
            Clear consultant handoff
          </CustomerPerspectivePoint>
        </div>
      </div>

      <div className="customerPhoneStage">
        <div className="customerPhone">
          <div className="customerPhoneHeader">
            <div className="customerPhoneAvatar">
              N
            </div>

            <div>
              <strong>
                NOMAD
              </strong>

              <span>
                Property Assistant
              </span>
            </div>
          </div>

          <div className="customerPhoneBody">
            <div className="customerPhoneBubble customerPhoneBubbleBot">
              What type of property are
              you looking for?
            </div>

            <div className="customerPhoneBubble customerPhoneBubbleUser">
              3-bedroom villa in Dubai
              Hills.
            </div>

            <div className="customerPhoneBubble customerPhoneBubbleBot">
              Around what budget are you
              considering?
            </div>

            <div className="customerPhoneBubble customerPhoneBubbleUser">
              Around AED 4 million.
            </div>

            <div className="customerPhoneBubble customerPhoneBubbleBot">
              Perfect. When would be a
              convenient time for a
              property consultant to
              contact you?
            </div>

            <div className="customerPhoneBubble customerPhoneBubbleUser">
              Tomorrow at 11 AM.
            </div>

            <div className="customerSuccessBubble">
              <strong>
                ✓ Request received
              </strong>

              <span>
                Your property requirements
                have been shared with our
                team. A consultant will
                contact you at your
                preferred time.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerPerspectivePoint({
  children,
}) {
  return (
    <div className="customerPerspectivePoint">
      <span>
        ✓
      </span>

      {children}
    </div>
  );
}

function SalesPerspective() {
  return (
    <div className="salesPerspective">
      <div className="salesPerspectiveSidebar">
        <div>
          <div className="perspectiveMiniLabel">
            SALES INTELLIGENCE
          </div>

          <h3>
            The same conversation,
            transformed.
          </h3>

          <p>
            The consultant receives
            context before speaking to the
            customer.
          </p>
        </div>

        <div className="salesDataTags">
          <span className="salesDataTag">
            Intent
          </span>

          <span className="salesDataTag">
            Budget
          </span>

          <span className="salesDataTag">
            Location
          </span>

          <span className="salesDataTag">
            Financing
          </span>

          <span className="salesDataTag">
            Timeline
          </span>

          <span className="salesDataTag">
            Callback
          </span>
        </div>
      </div>

      <div className="salesPerspectiveMain">
        <div className="salesOpportunityTop">
          <div>
            <div className="panelLabel">
              NEW OPPORTUNITY
            </div>

            <h3>
              Taher M.
            </h3>
          </div>

          <div className="salesQualifiedBadge">
            <span />

            QUALIFIED
          </div>
        </div>

        <div className="salesLeadSummary">
          <p>
            Buyer looking for a
            3-bedroom villa in Dubai
            Hills around AED 4 million.
            Open to ready-to-move and
            off-plan. Plans to use
            mortgage financing. Callback
            requested tomorrow at 11 AM.
          </p>
        </div>

        <div className="salesStructuredGrid">
          <SalesDataItem
            label="Intent"
            value="Buy"
          />

          <SalesDataItem
            label="Property"
            value="3BR Villa"
          />

          <SalesDataItem
            label="Budget"
            value="AED 4M"
          />

          <SalesDataItem
            label="Location"
            value="Dubai Hills"
          />

          <SalesDataItem
            label="Status"
            value="Ready + Off-plan"
          />

          <SalesDataItem
            label="Financing"
            value="Mortgage"
          />

          <SalesDataItem
            label="Timeline"
            value="Within 6 months"
          />

          <SalesDataItem
            label="Callback"
            value="Tomorrow · 11 AM"
          />
        </div>

        <div className="salesHandoffStrip">
          <div className="salesHandoffIcon">
            ✓
          </div>

          <div>
            <strong>
              Consultant ready
            </strong>

            <span>
              Full customer context is
              available before the call.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesDataItem({
  label,
  value,
}) {
  return (
    <div className="salesStructuredItem">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   CHANNELS
   ========================================================= */

function ChannelBackground() {
  return (
    <div className="channelBackground">
      <div className="channelBackgroundGrid" />

      <div className="channelBackgroundGlow" />
    </div>
  );
}

function ChannelUniverse({
  activeChannel,
}) {
  return (
    <div className="channelUniverse">
      <div className="universeRing universeRingOne" />

      <div className="universeRing universeRingTwo" />

      <div className="universeRing universeRingThree" />

      <div
        className={
          activeChannel === "whatsapp"
            ? "channelLine lineWhatsapp channelLineActive"
            : "channelLine lineWhatsapp"
        }
      />

      <div
        className={
          activeChannel === "website"
            ? "channelLine lineWebsite channelLineActive"
            : "channelLine lineWebsite"
        }
      />

      <div
        className={
          activeChannel === "campaign"
            ? "channelLine lineCampaign channelLineActive"
            : "channelLine lineCampaign"
        }
      />

      <div
        className={
          activeChannel === "portal"
            ? "channelLine linePortal channelLineActive"
            : "channelLine linePortal"
        }
      />

      <ChannelNode
        className="nodeWhatsapp"
        active={
          activeChannel === "whatsapp"
        }
        title="WhatsApp"
        subtitle="Messaging"
      />

      <ChannelNode
        className="nodeWebsite"
        active={
          activeChannel === "website"
        }
        title="Website"
        subtitle="Owned channel"
      />

      <ChannelNode
        className="nodeCampaign"
        active={
          activeChannel === "campaign"
        }
        title="Campaign"
        subtitle="Paid demand"
      />

      <ChannelNode
        className="nodePortal"
        active={
          activeChannel === "portal"
        }
        title="Portal"
        subtitle="Property lead"
      />

      <div className="universeCore">
        <strong>
          N
        </strong>

        <span>
          INTELLIGENCE
        </span>
      </div>
    </div>
  );
}

function ChannelNode({
  className,
  active,
  title,
  subtitle,
}) {
  return (
    <div
      className={
        active
          ? `channelNode channelNodeActive ${className}`
          : `channelNode ${className}`
      }
    >
      <strong>
        {title}
      </strong>

      <span>
        {subtitle}
      </span>
    </div>
  );
}

/* =========================================================
   COMMAND CENTER
   ========================================================= */

function CommandCenterSidebar() {
  return (
    <aside className="commandSidebar">
      <div>
        <div className="commandSidebarBrand">
          <div className="commandSidebarBrandIcon">
            N
          </div>

          <div>
            <strong>
              NOMAD
            </strong>

            <span>
              Intelligence OS
            </span>
          </div>
        </div>

        <div className="commandMenu">
          <CommandMenuItem
            icon="⌂"
            label="Overview"
            active
          />

          <CommandMenuItem
            icon="◎"
            label="Opportunities"
          />

          <CommandMenuItem
            icon="◌"
            label="Conversations"
          />

          <CommandMenuItem
            icon="⌁"
            label="Sources"
          />

          <CommandMenuItem
            icon="◇"
            label="Performance"
          />
        </div>
      </div>

      <div className="commandSidebarBottom">
        <strong>
          System active
        </strong>

        <span>
          Qualification engine online
        </span>
      </div>
    </aside>
  );
}

function CommandMenuItem({
  icon,
  label,
  active = false,
}) {
  return (
    <div
      className={
        active
          ? "commandMenuItem commandMenuItemActive"
          : "commandMenuItem"
      }
    >
      <span className="commandMenuIcon">
        {icon}
      </span>

      {label}
    </div>
  );
}

function CommandCenterHeader() {
  return (
    <div className="commandHeader">
      <div>
        <span>
          LIVE OPERATIONS
        </span>

        <h3>
          Sales Intelligence
        </h3>
      </div>

      <div className="commandHeaderActions">
        <div className="commandHeaderButton">
          Today
        </div>

        <div className="commandHeaderButton">
          All sources
        </div>
      </div>
    </div>
  );
}

function CommandStats() {
  return (
    <div className="commandStats">
      <CommandStat
        label="New enquiries"
        value="14"
        detail="+18% today"
      />

      <CommandStat
        label="Qualified"
        value="9"
        detail="64% conversion"
      />

      <CommandStat
        label="Attention"
        value="3"
        detail="Review required"
      />

      <CommandStat
        label="Callbacks due"
        value="2"
        detail="Next 60 min"
      />
    </div>
  );
}

function CommandStat({
  label,
  value,
  detail,
}) {
  return (
    <div className="commandStat">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {detail}
      </small>
    </div>
  );
}

function CommandLeadRow({
  lead,
  active,
  onEnter,
  onLeave,
}) {
  let statusClass =
    "commandLeadStatus";

  if (
    lead.status === "Qualified"
  ) {
    statusClass +=
      " statusQualified";
  }

  if (
    lead.status === "In progress"
  ) {
    statusClass +=
      " statusProgress";
  }

  if (
    lead.status === "Callback due"
  ) {
    statusClass +=
      " statusDue";
  }

  return (
    <div
      className={
        active
          ? "commandLeadRow commandLeadRowActive"
          : "commandLeadRow"
      }
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="commandLeadAvatar">
        {lead.initials}
      </div>

      <div className="commandLeadIdentity">
        <strong>
          {lead.name}
        </strong>

        <span>
          {lead.request}
        </span>
      </div>

      <div className="commandLeadBudget">
        {lead.budget}
      </div>

      <div className={statusClass}>
        {lead.status}
      </div>

      <div className="commandLeadAge">
        {lead.age}
      </div>
    </div>
  );
}

function QualityRing() {
  return (
    <div className="qualityRing">
      <div className="qualityRingInner">
        <strong>
          86
        </strong>

        <span>
          QUALITY SCORE
        </span>
      </div>
    </div>
  );
}

function QualityLine({
  label,
  value,
}) {
  return (
    <div className="qualityLine">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   STORY
   ========================================================= */

function StoryPoint({
  number,
  title,
  description,
}) {
  return (
    <div className="storyPoint">
      <div className="storyPointNumber">
        {number}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>
    </div>
  );
}

function StoryConnector() {
  return (
    <div className="storyConnector" />
  );
}

/* =========================================================
   FINAL CTA
   ========================================================= */

function FinalCTAVisual() {
  return (
    <div className="finalCTAVisual">
      <div className="finalCTARing finalCTARing1" />

      <div className="finalCTARing finalCTARing2" />

      <div className="finalCTARing finalCTARing3" />
    </div>
  );
}

/* =========================================================
   LIVE DEMO COMPONENTS
   ========================================================= */

function DemoRailItem({
  number,
  label,
  active,
}) {
  return (
    <div
      className={
        active
          ? "demoRailItem demoRailItemActive"
          : "demoRailItem"
      }
    >
      <span>
        {number}
      </span>

      <strong>
        {label}
      </strong>
    </div>
  );
}

function ChatMessage({
  message,
}) {
  const isUser =
    message.role === "user";

  return (
    <div
      className={
        isUser
          ? "chatMessageRow chatMessageUser"
          : "chatMessageRow chatMessageAssistant"
      }
    >
      {!isUser && (
        <div className="chatMiniAvatar">
          N
        </div>
      )}

      <div className="chatMessageBubble">
        {message.text}
      </div>
    </div>
  );
}

function TypingMessage() {
  return (
    <div className="chatMessageRow chatMessageAssistant">
      <div className="chatMiniAvatar">
        N
      </div>

      <div className="typingBubble">
        •••
      </div>
    </div>
  );
}

function CustomerRequestReceived() {
  return (
    <div className="requestReceived">
      <div className="requestReceivedTop">
        <div className="requestReceivedIcon">
          ✓
        </div>

        <div>
          <div className="requestReceivedLabel">
            Confirmation
          </div>

          <h3>
            Request received
          </h3>
        </div>
      </div>

      <p>
        Your property requirements have
        been shared with the team. A
        property consultant will contact
        you at your preferred time.
      </p>
    </div>
  );
}
