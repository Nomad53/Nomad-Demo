"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

const STATUS_OPTIONS = [
  "Qualified",
  "Assigned",
  "Contacted",
  "Follow-up",
  "Won",
  "Lost",
];

const ASSIGNMENT_OPTIONS = [
  "",
  "Ahmed",
  "Sarah",
  "Ali",
  "Sales Team A",
];

export default function LeadDetailsClient({
  initialLead,
}) {
  const router = useRouter();

  const [
    lead,
    setLead,
  ] = useState(initialLead);

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  const [
    updatingAssignment,
    setUpdatingAssignment,
  ] = useState(false);

  const [
    copied,
    setCopied,
  ] = useState(false);

  const qualityScore =
    useMemo(
      () =>
        calculateLeadQuality(
          lead
        ),
      [lead]
    );

  async function updateStatus(
    nextStatus
  ) {
    setUpdatingStatus(true);

    const previous =
      lead.lead_status;

    setLead(
      (current) => ({
        ...current,
        lead_status:
          nextStatus,
      })
    );

    try {
      const response =
        await fetch(
          "/api/update-lead-status",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  lead.id,

                lead_status:
                  nextStatus,
              }),
          }
        );

      const data =
        await response.json();

      if (!data.success) {
        throw new Error(
          "Status update failed"
        );
      }
    } catch (error) {
      console.error(
        error
      );

      setLead(
        (current) => ({
          ...current,
          lead_status:
            previous,
        })
      );
    } finally {
      setUpdatingStatus(
        false
      );
    }
  }

  async function updateAssignment(
    nextPerson
  ) {
    setUpdatingAssignment(
      true
    );

    const previous =
      lead.assigned_to;

    setLead(
      (current) => ({
        ...current,
        assigned_to:
          nextPerson,
      })
    );

    try {
      const response =
        await fetch(
          "/api/update-lead-assignment",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  lead.id,

                assigned_to:
                  nextPerson,
              }),
          }
        );

      const data =
        await response.json();

      if (!data.success) {
        throw new Error(
          "Assignment update failed"
        );
      }
    } catch (error) {
      console.error(
        error
      );

      setLead(
        (current) => ({
          ...current,
          assigned_to:
            previous,
        })
      );
    } finally {
      setUpdatingAssignment(
        false
      );
    }
  }

  async function copyPhone() {
    if (!lead.phone) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        lead.phone
      );

      setCopied(true);

      window.setTimeout(
        () =>
          setCopied(false),
        1500
      );
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  }

  function callLead() {
    if (!lead.phone) {
      return;
    }

    window.location.href =
      `tel:${sanitizePhone(
        lead.phone
      )}`;
  }

  function openWhatsApp() {
    if (!lead.phone) {
      return;
    }

    const number =
      sanitizePhone(
        lead.phone
      );

    window.open(
      `https://wa.me/${number}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main
      className="leadPage"
    >
      <LeadStyles />

      <div
        className="ambient ambientOne"
      />

      <div
        className="ambient ambientTwo"
      />

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside
        className="leadSidebar"
      >
        <div>
          <div
            className="brand"
          >
            <div
              className="brandIcon"
            >
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

          <div
            className="sidebarLabel"
          >
            Opportunity
          </div>

          <button
            className="sidebarItem sidebarItemActive"
          >
            <span>
              ◎
            </span>

            Overview
          </button>

          <button
            className="sidebarItem"
            onClick={() =>
              document
                .getElementById(
                  "conversation"
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth",
                })
            }
          >
            <span>
              ◌
            </span>

            Conversation
          </button>

          <button
            className="sidebarItem"
            onClick={() =>
              document
                .getElementById(
                  "requirements"
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth",
                })
            }
          >
            <span>
              ◇
            </span>

            Requirements
          </button>
        </div>

        <div
          className="sidebarBottom"
        >
          <div
            className="systemDot"
          />

          <div>
            <strong>
              System active
            </strong>

            <span>
              Lead intelligence online
            </span>
          </div>
        </div>
      </aside>

      {/* ===================================================
          MAIN
          =================================================== */}

      <section
        className="leadMain"
      >
        {/* =================================================
            TOP NAVIGATION
            ================================================= */}

        <header
          className="leadHeader"
        >
          <button
            className="backButton"
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
          >
            ← Dashboard
          </button>

          <div
            className="headerRight"
          >
            <div
              className="liveIndicator"
            >
              <span />

              Live lead
            </div>

            <StatusBadge
              status={
                lead.lead_status
              }
            />
          </div>
        </header>

        {/* =================================================
            HERO
            ================================================= */}

        <section
          className="leadHero"
        >
          <div
            className="leadHeroIdentity"
          >
            <div
              className="heroAvatar"
            >
              {getInitials(
                lead.name
              )}
            </div>

            <div>
              <div
                className="heroEyebrow"
              >
                QUALIFIED OPPORTUNITY
              </div>

              <h1>
                {lead.name ||
                  "Unnamed Lead"}
              </h1>

              <div
                className="heroMeta"
              >
                {formatProperty(
                  lead
                )}

                {lead.location
                  ? ` · ${lead.location}`
                  : ""}
              </div>
            </div>
          </div>

          <div
            className="heroActions"
          >
            <button
              className="secondaryAction"
              onClick={
                copyPhone
              }
              disabled={
                !lead.phone
              }
            >
              {copied
                ? "Copied ✓"
                : "Copy Number"}
            </button>

            <button
              className="secondaryAction"
              onClick={
                openWhatsApp
              }
              disabled={
                !lead.phone
              }
            >
              WhatsApp ↗
            </button>

            <button
              className="primaryAction"
              onClick={
                callLead
              }
              disabled={
                !lead.phone
              }
            >
              Call Customer
            </button>
          </div>
        </section>

        {/* =================================================
            KPI STRIP
            ================================================= */}

        <div
          className="kpiGrid"
        >
          <KpiCard
            label="Intent"
            value={
              formatValue(
                lead.intent
              ) ||
              "Unknown"
            }
          />

          <KpiCard
            label="Budget"
            value={
              lead.budget ||
              "Not specified"
            }
          />

          <KpiCard
            label="Callback"
            value={
              lead.callback_time ||
              "Not scheduled"
            }
          />

          <KpiCard
            label="Assigned"
            value={
              lead.assigned_to ||
              "Unassigned"
            }
          />
        </div>

        {/* =================================================
            MAIN GRID
            ================================================= */}

        <div
          className="contentGrid"
        >
          {/* ===============================================
              LEFT
              =============================================== */}

          <div
            className="contentLeft"
          >
            {/* ---------------------------------------------
                AI SUMMARY
                --------------------------------------------- */}

            <section
              className="panel summaryPanel"
            >
              <PanelHeading
                eyebrow="NOMAD INTELLIGENCE"
                title="Opportunity summary"
              />

              <p
                className="summaryText"
              >
                {lead.summary ||
                  "No AI summary is available for this lead."}
              </p>

              <div
                className="summaryFooter"
              >
                <div
                  className="summaryFooterIcon"
                >
                  N
                </div>

                <div>
                  <strong>
                    Context prepared
                  </strong>

                  <span>
                    Consultant can enter the
                    conversation with the
                    customer requirement
                    already understood.
                  </span>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------
                REQUIREMENTS
                --------------------------------------------- */}

            <section
              id="requirements"
              className="panel"
            >
              <PanelHeading
                eyebrow="CAPTURED REQUIREMENTS"
                title="Property requirement"
              />

              <div
                className="requirementsGrid"
              >
                <Requirement
                  label="Intent"
                  value={
                    formatValue(
                      lead.intent
                    )
                  }
                />

                <Requirement
                  label="Property"
                  value={
                    formatProperty(
                      lead
                    )
                  }
                />

                <Requirement
                  label="Location"
                  value={
                    lead.location
                  }
                />

                <Requirement
                  label="Budget"
                  value={
                    lead.budget
                  }
                />

                <Requirement
                  label="Property Status"
                  value={
                    formatValue(
                      lead.property_status
                    )
                  }
                />

                <Requirement
                  label="Financing"
                  value={
                    formatValue(
                      lead.financing
                    )
                  }
                />

                <Requirement
                  label="Timeline"
                  value={
                    lead.timeline
                  }
                />

                <Requirement
                  label="Callback Time"
                  value={
                    lead.callback_time
                  }
                />

                <Requirement
                  label="Phone"
                  value={
                    lead.phone
                  }
                />

                <Requirement
                  label="Lead Status"
                  value={
                    lead.lead_status
                  }
                />
              </div>
            </section>

            {/* ---------------------------------------------
                CONVERSATION
                --------------------------------------------- */}

            <section
              id="conversation"
              className="panel conversationPanel"
            >
              <PanelHeading
                eyebrow="CUSTOMER CONVERSATION"
                title="Conversation history"
              />

              {Array.isArray(
                lead.conversation
              ) &&
              lead.conversation
                .length > 0 ? (
                <div
                  className="conversationStream"
                >
                  {lead.conversation.map(
                    (
                      message,
                      index
                    ) => (
                      <ConversationMessage
                        key={
                          index
                        }
                        message={
                          message
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div
                  className="emptyConversation"
                >
                  No conversation history
                  available.
                </div>
              )}
            </section>
          </div>

          {/* ===============================================
              RIGHT
              =============================================== */}

          <aside
            className="contentRight"
          >
            {/* ---------------------------------------------
                QUALITY
                --------------------------------------------- */}

            <section
              className="panel qualityPanel"
            >
              <PanelHeading
                eyebrow="NOMAD INTELLIGENCE"
                title="Lead quality"
              />

              <QualityRing
                score={
                  qualityScore
                }
              />

              <div
                className="qualityLines"
              >
                <QualityLine
                  label="Intent"
                  value={
                    lead.intent
                      ? "Known"
                      : "Missing"
                  }
                  good={
                    Boolean(
                      lead.intent
                    )
                  }
                />

                <QualityLine
                  label="Budget"
                  value={
                    lead.budget
                      ? "Known"
                      : "Missing"
                  }
                  good={
                    Boolean(
                      lead.budget
                    )
                  }
                />

                <QualityLine
                  label="Location"
                  value={
                    lead.location
                      ? "Known"
                      : "Missing"
                  }
                  good={
                    Boolean(
                      lead.location
                    )
                  }
                />

                <QualityLine
                  label="Timeline"
                  value={
                    lead.timeline
                      ? "Known"
                      : "Missing"
                  }
                  good={
                    Boolean(
                      lead.timeline
                    )
                  }
                />

                <QualityLine
                  label="Callback"
                  value={
                    lead.callback_time
                      ? "Scheduled"
                      : "Missing"
                  }
                  good={
                    Boolean(
                      lead.callback_time
                    )
                  }
                />

                <QualityLine
                  label="Phone"
                  value={
                    lead.phone
                      ? "Captured"
                      : "Missing"
                  }
                  good={
                    Boolean(
                      lead.phone
                    )
                  }
                />
              </div>
            </section>

            {/* ---------------------------------------------
                SALES OWNERSHIP
                --------------------------------------------- */}

            <section
              className="panel managementPanel"
            >
              <PanelHeading
                eyebrow="SALES WORKFLOW"
                title="Lead management"
              />

              <div
                className="controlGroup"
              >
                <label>
                  Assigned to
                </label>

                <select
                  value={
                    lead.assigned_to ||
                    ""
                  }
                  disabled={
                    updatingAssignment
                  }
                  onChange={(
                    event
                  ) =>
                    updateAssignment(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Unassigned
                  </option>

                  <option value="Ahmed">
                    Ahmed
                  </option>

                  <option value="Sarah">
                    Sarah
                  </option>

                  <option value="Ali">
                    Ali
                  </option>

                  <option value="Sales Team A">
                    Sales Team A
                  </option>
                </select>

                {updatingAssignment && (
                  <span
                    className="updatingText"
                  >
                    Saving assignment...
                  </span>
                )}
              </div>

              <div
                className="controlGroup"
              >
                <label>
                  Lead status
                </label>

                <select
                  value={
                    lead.lead_status ||
                    "Qualified"
                  }
                  disabled={
                    updatingStatus
                  }
                  onChange={(
                    event
                  ) =>
                    updateStatus(
                      event.target
                        .value
                    )
                  }
                >
                  {STATUS_OPTIONS.map(
                    (
                      status
                    ) => (
                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >
                        {
                          status
                        }
                      </option>
                    )
                  )}
                </select>

                {updatingStatus && (
                  <span
                    className="updatingText"
                  >
                    Saving status...
                  </span>
                )}
              </div>

              <div
                className="recommendationBox"
              >
                <span>
                  NOMAD
                </span>

                <p>
                  {buildRecommendation(
                    lead
                  )}
                </p>
              </div>
            </section>

            {/* ---------------------------------------------
                CONTACT
                --------------------------------------------- */}

            <section
              className="panel contactPanel"
            >
              <PanelHeading
                eyebrow="CONTACT"
                title="Customer"
              />

              <ContactRow
                label="Name"
                value={
                  lead.name
                }
              />

              <ContactRow
                label="Phone"
                value={
                  lead.phone
                }
              />

              <ContactRow
                label="Callback"
                value={
                  lead.callback_time
                }
              />

              {lead.created_at && (
                <ContactRow
                  label="Lead created"
                  value={
                    formatDate(
                      lead.created_at
                    )
                  }
                />
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function PanelHeading({
  eyebrow,
  title,
}) {
  return (
    <div
      className="panelHeading"
    >
      <span>
        {eyebrow}
      </span>

      <h2>
        {title}
      </h2>
    </div>
  );
}

function KpiCard({
  label,
  value,
}) {
  return (
    <div
      className="kpiCard"
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Requirement({
  label,
  value,
}) {
  return (
    <div
      className="requirement"
    >
      <span>
        {label}
      </span>

      <strong>
        {value || "Not specified"}
      </strong>
    </div>
  );
}

function ContactRow({
  label,
  value,
}) {
  return (
    <div
      className="contactRow"
    >
      <span>
        {label}
      </span>

      <strong>
        {value || "Not available"}
      </strong>
    </div>
  );
}

function QualityLine({
  label,
  value,
  good,
}) {
  return (
    <div
      className="qualityLine"
    >
      <span>
        {label}
      </span>

      <strong
        className={
          good
            ? "good"
            : "missing"
        }
      >
        {value}
      </strong>
    </div>
  );
}

function QualityRing({
  score,
}) {
  const angle =
    Math.round(
      score * 3.6
    );

  return (
    <div
      className="qualityRing"
      style={{
        background: `conic-gradient(
          #D8C6A6 0deg ${angle}deg,
          rgba(255,255,255,.07) ${angle}deg 360deg
        )`,
      }}
    >
      <div
        className="qualityRingInner"
      >
        <strong>
          {score}
        </strong>

        <span>
          QUALITY SCORE
        </span>
      </div>
    </div>
  );
}

function ConversationMessage({
  message,
}) {
  const user =
    message.role ===
    "user";

  return (
    <div
      className={
        user
          ? "conversationRow conversationUser"
          : "conversationRow conversationAssistant"
      }
    >
      {!user && (
        <div
          className="conversationAvatar"
        >
          N
        </div>
      )}

      <div>
        <div
          className="conversationRole"
        >
          {user
            ? "Customer"
            : "NOMAD"}
        </div>

        <div
          className="conversationBubble"
        >
          {message.text ||
            message.content}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  return (
    <div
      className={`statusBadge status${String(
        status ||
          "Qualified"
      ).replace(
        /[^a-zA-Z]/g,
        ""
      )}`}
    >
      <span />

      {status ||
        "Qualified"}
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function calculateLeadQuality(
  lead
) {
  const fields = [
    lead.intent,
    lead.property_type,
    lead.location,
    lead.budget,
    lead.timeline,
    lead.name,
    lead.phone,
    lead.callback_time,
  ];

  if (
    String(
      lead.property_type ||
        ""
    ).toLowerCase() !==
    "studio"
  ) {
    fields.push(
      lead.bedrooms
    );
  }

  if (
    String(
      lead.intent ||
        ""
    ).toLowerCase() ===
    "buy"
  ) {
    fields.push(
      lead.financing,
      lead.property_status
    );
  }

  const known =
    fields.filter(
      Boolean
    ).length;

  return Math.round(
    (known /
      fields.length) *
      100
  );
}

function formatProperty(
  lead
) {
  const parts =
    [];

  if (
    lead.bedrooms
  ) {
    parts.push(
      `${lead.bedrooms}BR`
    );
  }

  if (
    lead.property_type
  ) {
    parts.push(
      formatValue(
        lead.property_type
      )
    );
  }

  return (
    parts.join(
      " "
    ) ||
    "Property requirement"
  );
}

function formatValue(
  value
) {
  if (!value) {
    return "";
  }

  return String(
    value
  )
    .replaceAll(
      "-",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function getInitials(
  name
) {
  if (!name) {
    return "N";
  }

  const pieces =
    String(name)
      .trim()
      .split(/\s+/);

  if (
    pieces.length === 1
  ) {
    return pieces[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }

  return (
    pieces[0][0] +
    pieces[
      pieces.length - 1
    ][0]
  ).toUpperCase();
}

function sanitizePhone(
  phone
) {
  return String(
    phone || ""
  ).replace(
    /[^\d]/g,
    ""
  );
}

function formatDate(
  value
) {
  try {
    return new Date(
      value
    ).toLocaleString(
      "en-AE",
      {
        day:
          "numeric",

        month:
          "short",

        year:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit",
      }
    );
  } catch {
    return value;
  }
}

function buildRecommendation(
  lead
) {
  if (
    !lead.assigned_to
  ) {
    return "This opportunity is qualified but still unassigned. Assign a consultant before the scheduled follow-up.";
  }

  if (
    lead.lead_status ===
    "Won"
  ) {
    return `This opportunity is marked as won and assigned to ${lead.assigned_to}.`;
  }

  if (
    lead.lead_status ===
    "Lost"
  ) {
    return "This opportunity is marked as lost. The original conversation remains available for context.";
  }

  if (
    lead.callback_time
  ) {
    return `${lead.assigned_to} has the customer requirement and callback preference available for follow-up.`;
  }

  return `${lead.assigned_to} has the captured property requirement available for consultant follow-up.`;
}

/* =========================================================
   CSS
   ========================================================= */

function LeadStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        background: #082F27;
      }

      button,
      select {
        font-family: inherit;
      }

      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(216,198,166,.17);
        border-radius: 999px;
      }

      .leadPage {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 220px minmax(0,1fr);
        background:
          radial-gradient(
            circle at 85% 5%,
            rgba(11,118,99,.10),
            transparent 30%
          ),
          #082F27;
        color: white;
        font-family:
          Inter,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          Arial,
          sans-serif;
        position: relative;
      }

      .ambient {
        position: fixed;
        border-radius: 50%;
        pointer-events: none;
      }

      .ambientOne {
        width: 500px;
        height: 500px;
        top: -220px;
        right: -120px;
        background:
          radial-gradient(
            circle,
            rgba(216,198,166,.08),
            transparent 68%
          );
      }

      .ambientTwo {
        width: 500px;
        height: 500px;
        left: 100px;
        bottom: -300px;
        background:
          radial-gradient(
            circle,
            rgba(11,118,99,.10),
            transparent 68%
          );
      }

      /* SIDEBAR */

      .leadSidebar {
        height: 100vh;
        position: sticky;
        top: 0;
        padding: 26px 20px;
        border-right: 1px solid rgba(255,255,255,.07);
        background: #082F27;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        z-index: 10;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .brandIcon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #164F42;
        border: 1px solid rgba(216,198,166,.13);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 850;
      }

      .brand strong {
        display: block;
        font-size: 14px;
      }

      .brand span {
        display: block;
        margin-top: 2px;
        color: rgba(255,255,255,.38);
        font-size: 9px;
      }

      .sidebarLabel {
        margin: 42px 10px 12px;
        color: rgba(255,255,255,.30);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.1px;
        text-transform: uppercase;
      }

      .sidebarItem {
        width: 100%;
        min-height: 42px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: rgba(255,255,255,.44);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 11px;
        cursor: pointer;
        font-size: 10px;
        text-align: left;
        transition: .2s ease;
      }

      .sidebarItem span {
        color: #D8C6A6;
      }

      .sidebarItem:hover,
      .sidebarItemActive {
        color: white;
        background: rgba(255,255,255,.06);
      }

      .sidebarBottom {
        padding: 13px;
        border-radius: 12px;
        background: rgba(255,255,255,.035);
        border: 1px solid rgba(255,255,255,.05);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .systemDot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #78C6A6;
        box-shadow: 0 0 0 5px rgba(120,198,166,.06);
      }

      .sidebarBottom strong {
        display: block;
        font-size: 10px;
      }

      .sidebarBottom span {
        display: block;
        margin-top: 2px;
        color: rgba(255,255,255,.38);
        font-size: 8px;
      }

      /* MAIN */

      .leadMain {
        min-width: 0;
        padding: 30px;
        position: relative;
        z-index: 2;
        background:
          linear-gradient(
            145deg,
            rgba(10,46,39,.97),
            rgba(8,43,36,.98)
          );
      }

      .leadHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .backButton {
        border: none;
        background: transparent;
        color: rgba(255,255,255,.60);
        cursor: pointer;
        font-size: 11px;
        padding: 8px 0;
      }

      .backButton:hover {
        color: white;
      }

      .headerRight {
        display: flex;
        gap: 9px;
        align-items: center;
      }

      .liveIndicator {
        height: 34px;
        padding: 0 11px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.03);
        display: flex;
        align-items: center;
        gap: 7px;
        color: rgba(255,255,255,.52);
        font-size: 9px;
      }

      .liveIndicator span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #78C6A6;
      }

      .statusBadge {
        height: 34px;
        padding: 0 11px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 9px;
        font-weight: 750;
      }

      .statusBadge span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
      }

      .statusQualified {
        color: #75D0AC;
        background: rgba(117,208,172,.08);
      }

      .statusQualified span {
        background: #75D0AC;
      }

      .statusAssigned {
        color: #D8C6A6;
        background: rgba(216,198,166,.08);
      }

      .statusAssigned span {
        background: #D8C6A6;
      }

      .statusContacted {
        color: #8CB4D8;
        background: rgba(140,180,216,.08);
      }

      .statusContacted span {
        background: #8CB4D8;
      }

      .statusFollowup {
        color: #E1A771;
        background: rgba(225,167,113,.08);
      }

      .statusFollowup span {
        background: #E1A771;
      }

      .statusWon {
        color: #66CE90;
        background: rgba(102,206,144,.08);
      }

      .statusWon span {
        background: #66CE90;
      }

      .statusLost {
        color: #D98383;
        background: rgba(217,131,131,.08);
      }

      .statusLost span {
        background: #D98383;
      }

      /* HERO */

      .leadHero {
        margin-top: 32px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 30px;
      }

      .leadHeroIdentity {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .heroAvatar {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background:
          linear-gradient(
            145deg,
            rgba(216,198,166,.16),
            rgba(216,198,166,.07)
          );
        border: 1px solid rgba(216,198,166,.14);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 800;
      }

      .heroEyebrow {
        color: #D8C6A6;
        font-size: 9px;
        letter-spacing: 1.4px;
        font-weight: 800;
      }

      .leadHero h1 {
        margin: 7px 0 0;
        font-size: clamp(34px,4vw,52px);
        letter-spacing: -2px;
        line-height: 1;
        font-weight: 620;
      }

      .heroMeta {
        margin-top: 9px;
        color: rgba(255,255,255,.46);
        font-size: 12px;
      }

      .heroActions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .heroActions button {
        min-height: 40px;
        border-radius: 999px;
        padding: 0 15px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 750;
      }

      .secondaryAction {
        border: 1px solid rgba(255,255,255,.07);
        background: rgba(255,255,255,.04);
        color: rgba(255,255,255,.72);
      }

      .primaryAction {
        border: none;
        background: #D8C6A6;
        color: #082F27;
      }

      .heroActions button:disabled {
        opacity: .35;
        cursor: not-allowed;
      }

      /* KPI */

      .kpiGrid {
        margin-top: 30px;
        display: grid;
        grid-template-columns: repeat(4,minmax(0,1fr));
        gap: 10px;
      }

      .kpiCard {
        min-height: 92px;
        padding: 16px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.036);
      }

      .kpiCard span {
        color: rgba(255,255,255,.38);
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .8px;
      }

      .kpiCard strong {
        display: block;
        margin-top: 10px;
        color: white;
        font-size: 15px;
        line-height: 1.35;
      }

      /* CONTENT */

      .contentGrid {
        margin-top: 16px;
        display: grid;
        grid-template-columns: minmax(0,1.55fr) minmax(280px,.65fr);
        gap: 14px;
        align-items: start;
      }

      .contentLeft,
      .contentRight {
        display: grid;
        gap: 14px;
      }

      .contentRight {
        position: sticky;
        top: 20px;
      }

      .panel {
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.034);
        padding: 22px;
      }

      .panelHeading span {
        color: #D8C6A6;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 1.15px;
      }

      .panelHeading h2 {
        margin: 6px 0 0;
        font-size: 17px;
        font-weight: 650;
      }

      .summaryText {
        margin: 20px 0 0;
        color: rgba(255,255,255,.63);
        font-size: 12px;
        line-height: 1.8;
      }

      .summaryFooter {
        margin-top: 20px;
        padding: 14px;
        border-radius: 12px;
        background: rgba(216,198,166,.065);
        border: 1px solid rgba(216,198,166,.08);
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .summaryFooterIcon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(216,198,166,.10);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 800;
      }

      .summaryFooter strong {
        display: block;
        font-size: 10px;
      }

      .summaryFooter span {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,.40);
        font-size: 9px;
        line-height: 1.5;
      }

      /* REQUIREMENTS */

      .requirementsGrid {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 1px;
        background: rgba(255,255,255,.055);
        border: 1px solid rgba(255,255,255,.055);
      }

      .requirement {
        min-height: 88px;
        padding: 16px;
        background: #0C342C;
      }

      .requirement span {
        color: rgba(255,255,255,.38);
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .8px;
      }

      .requirement strong {
        display: block;
        margin-top: 9px;
        color: rgba(255,255,255,.88);
        font-size: 12px;
        line-height: 1.45;
      }

      /* CONVERSATION */

      .conversationStream {
        margin-top: 22px;
        display: grid;
        gap: 17px;
      }

      .conversationRow {
        display: flex;
        gap: 10px;
      }

      .conversationUser {
        justify-content: flex-end;
      }

      .conversationAssistant {
        justify-content: flex-start;
      }

      .conversationAvatar {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border-radius: 50%;
        background: #164F42;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: 800;
      }

      .conversationRole {
        margin-bottom: 5px;
        color: rgba(255,255,255,.28);
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .7px;
      }

      .conversationUser .conversationRole {
        text-align: right;
      }

      .conversationBubble {
        max-width: 610px;
        padding: 12px 15px;
        border-radius: 14px;
        font-size: 11px;
        line-height: 1.65;
        white-space: pre-line;
      }

      .conversationAssistant .conversationBubble {
        background: rgba(255,255,255,.055);
        border-radius: 14px 14px 14px 4px;
        color: rgba(255,255,255,.74);
      }

      .conversationUser .conversationBubble {
        background: rgba(216,198,166,.10);
        border-radius: 14px 14px 4px 14px;
        color: rgba(255,255,255,.84);
      }

      .emptyConversation {
        margin-top: 20px;
        color: rgba(255,255,255,.35);
        font-size: 11px;
      }

      /* QUALITY */

      .qualityRing {
        width: 155px;
        height: 155px;
        margin: 25px auto;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qualityRingInner {
        width: 125px;
        height: 125px;
        border-radius: 50%;
        background: #0D352D;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .qualityRingInner strong {
        font-size: 32px;
        font-weight: 620;
      }

      .qualityRingInner span {
        margin-top: 3px;
        color: rgba(255,255,255,.38);
        font-size: 8px;
        letter-spacing: .7px;
      }

      .qualityLine {
        min-height: 39px;
        border-top: 1px solid rgba(255,255,255,.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .qualityLine span {
        color: rgba(255,255,255,.42);
        font-size: 9px;
      }

      .qualityLine strong {
        font-size: 9px;
      }

      .good {
        color: rgba(255,255,255,.80);
      }

      .missing {
        color: #D98383;
      }

      /* MANAGEMENT */

      .controlGroup {
        margin-top: 18px;
      }

      .controlGroup label {
        display: block;
        margin-bottom: 7px;
        color: rgba(255,255,255,.40);
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .8px;
      }

      .controlGroup select {
        width: 100%;
        min-height: 40px;
        padding: 0 11px;
        border-radius: 9px;
        border: 1px solid rgba(255,255,255,.06);
        outline: none;
        background: rgba(255,255,255,.045);
        color: rgba(255,255,255,.80);
        font-size: 10px;
        cursor: pointer;
      }

      .controlGroup select option {
        background: white;
        color: #101814;
      }

      .updatingText {
        display: block;
        margin-top: 5px;
        color: #D8C6A6;
        font-size: 8px;
      }

      .recommendationBox {
        margin-top: 18px;
        padding: 13px;
        border-radius: 11px;
        border: 1px solid rgba(216,198,166,.08);
        background: rgba(216,198,166,.065);
      }

      .recommendationBox > span {
        color: #D8C6A6;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: .8px;
      }

      .recommendationBox p {
        margin: 6px 0 0;
        color: rgba(255,255,255,.53);
        font-size: 9px;
        line-height: 1.6;
      }

      /* CONTACT */

      .contactRow {
        min-height: 42px;
        border-top: 1px solid rgba(255,255,255,.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }

      .contactRow:first-of-type {
        margin-top: 16px;
      }

      .contactRow span {
        color: rgba(255,255,255,.38);
        font-size: 9px;
      }

      .contactRow strong {
        color: rgba(255,255,255,.78);
        font-size: 9px;
        text-align: right;
      }

      /* RESPONSIVE */

      @media (max-width: 1050px) {
        .leadPage {
          grid-template-columns: 190px minmax(0,1fr);
        }

        .leadSidebar {
          padding: 24px 15px;
        }

        .leadMain {
          padding: 24px;
        }

        .contentGrid {
          grid-template-columns: 1fr;
        }

        .contentRight {
          position: static;
          grid-template-columns: repeat(2,minmax(0,1fr));
        }

        .contactPanel {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 820px) {
        .leadPage {
          display: block;
        }

        .leadSidebar {
          display: none;
        }

        .leadHero {
          align-items: flex-start;
          flex-direction: column;
        }

        .heroActions {
          justify-content: flex-start;
        }

        .kpiGrid {
          grid-template-columns: repeat(2,minmax(0,1fr));
        }
      }

      @media (max-width: 600px) {
        .leadMain {
          padding: 18px;
        }

        .headerRight .liveIndicator {
          display: none;
        }

        .leadHeroIdentity {
          align-items: flex-start;
        }

        .heroAvatar {
          width: 52px;
          height: 52px;
          font-size: 14px;
        }

        .leadHero h1 {
          font-size: 34px;
        }

        .heroActions {
          width: 100%;
        }

        .heroActions button {
          flex: 1;
        }

        .requirementsGrid {
          grid-template-columns: 1fr;
        }

        .contentRight {
          grid-template-columns: 1fr;
        }

        .contactPanel {
          grid-column: auto;
        }

        .conversationBubble {
          max-width: 80vw;
        }
      }
    `}</style>
  );
}
