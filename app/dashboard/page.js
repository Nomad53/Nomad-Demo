"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

/* =========================================================
   NOMAD SALES INTELLIGENCE
   Real operational dashboard
   ========================================================= */

const colors = {
  ink: "#101814",
  forest: "#082F27",
  forest2: "#0A2E27",
  forest3: "#0D352D",
  forest4: "#164F42",

  emerald: "#78C6A6",
  emeraldStrong: "#75D0AC",

  champagne: "#B99862",
  champagneSoft: "#D8C6A6",

  paper: "#FFFDF8",
  ivory: "#F7F3EB",

  whiteSoft: "rgba(255,255,255,.72)",
  whiteMuted: "rgba(255,255,255,.38)",
  line: "rgba(255,255,255,.065)",
};

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

const FILTERS = [
  "All",
  "Qualified",
  "Assigned",
  "Contacted",
  "Follow-up",
  "Won",
  "Lost",
];

/* =========================================================
   MAIN DASHBOARD
   ========================================================= */

export default function Dashboard() {
  const router = useRouter();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] =
    useState(null);
  const [
    updatingAssignmentId,
    setUpdatingAssignmentId,
  ] = useState(null);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    selectedLeadId,
    setSelectedLeadId,
  ] = useState(null);

  const [
    hoveredLeadId,
    setHoveredLeadId,
  ] = useState(null);

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads({
    silent = false,
  } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        "/api/leads",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (data.success) {
        const nextLeads =
          Array.isArray(
            data.leads
          )
            ? data.leads
            : [];

        setLeads(
          nextLeads
        );

        setSelectedLeadId(
          (current) => {
            if (
              current &&
              nextLeads.some(
                (lead) =>
                  lead.id ===
                  current
              )
            ) {
              return current;
            }

            return (
              nextLeads[0]
                ?.id ||
              null
            );
          }
        );
      } else {
        console.error(
          "Failed to load leads:",
          data
        );
      }
    } catch (error) {
      console.error(
        "Lead loading error:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateLeadStatus(
    id,
    lead_status
  ) {
    setUpdatingStatusId(
      id
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
                id,
                lead_status,
              }),
          }
        );

      const data =
        await response.json();

      if (data.success) {
        setLeads(
          (previous) =>
            previous.map(
              (lead) =>
                lead.id ===
                id
                  ? {
                      ...lead,
                      lead_status,
                    }
                  : lead
            )
        );
      } else {
        console.error(
          "Status update failed:",
          data
        );
      }
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );
    } finally {
      setUpdatingStatusId(
        null
      );
    }
  }

  async function updateLeadAssignment(
    id,
    assigned_to
  ) {
    setUpdatingAssignmentId(
      id
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
                id,
                assigned_to,
              }),
          }
        );

      const data =
        await response.json();

      if (data.success) {
        setLeads(
          (previous) =>
            previous.map(
              (lead) =>
                lead.id ===
                id
                  ? {
                      ...lead,
                      assigned_to,
                    }
                  : lead
            )
        );
      } else {
        console.error(
          "Assignment update failed:",
          data
        );
      }
    } catch (error) {
      console.error(
        "Assignment update error:",
        error
      );
    } finally {
      setUpdatingAssignmentId(
        null
      );
    }
  }

  function openLead(id) {
    router.push(
      `/dashboard/lead/${id}`
    );
  }

  function selectLead(id) {
    setSelectedLeadId(
      id
    );
  }

  /* =========================================================
     EXCEL EXPORT
     Exports ALL loaded leads, not just filtered leads
     ========================================================= */

  function exportLeadsToExcel() {
    if (
      !Array.isArray(
        leads
      ) ||
      leads.length === 0
    ) {
      window.alert(
        "There are no leads to export yet."
      );

      return;
    }

    const exportRows =
      leads.map(
        (
          lead,
          index
        ) => ({
          "Sr. No.":
            index + 1,

          "Lead ID":
            lead.id || "",

          Name:
            lead.name || "",

          Phone:
            lead.phone ||
            "",

          Intent:
            formatIntent(
              lead.intent
            ),

          "Property Type":
            lead.property_type
              ? capitalize(
                  String(
                    lead.property_type
                  )
                )
              : "",

          Bedrooms:
            lead.bedrooms ||
            "",

          Budget:
            lead.budget ||
            "",

          Location:
            lead.location ||
            "",

          "Property Status":
            lead.property_status
              ? capitalize(
                  String(
                    lead.property_status
                  )
                )
              : "",

          Financing:
            lead.financing
              ? capitalize(
                  String(
                    lead.financing
                  )
                )
              : "",

          Timeline:
            lead.timeline ||
            "",

          "Callback Time":
            lead.callback_time ||
            "",

          "Assigned To":
            lead.assigned_to ||
            "Unassigned",

          "Lead Status":
            lead.lead_status ||
            "Qualified",

          "AI Summary":
            lead.summary ||
            "",

          Source:
            lead.source ||
            "",

          "Created At":
            formatExcelDate(
              lead.created_at
            ),

          "Updated At":
            formatExcelDate(
              lead.updated_at
            ),
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        exportRows
      );

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 55 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
    ];

    if (
      worksheet[
        "!ref"
      ]
    ) {
      worksheet[
        "!autofilter"
      ] = {
        ref:
          worksheet[
            "!ref"
          ],
      };
    }

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "NOMAD Leads"
    );

    const dateStamp =
      new Date()
        .toISOString()
        .slice(0, 10);

    XLSX.writeFile(
      workbook,
      `NOMAD-Leads-${dateStamp}.xlsx`
    );
  }

  /* =========================================================
     FILTERED LEADS

     IMPORTANT:
     "Assigned" now means the lead has an assigned_to value.
     It does NOT require lead_status === "Assigned".
     ========================================================= */

  const filteredLeads =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return leads.filter(
        (lead) => {
          let matchesStatus =
            true;

          if (
            statusFilter ===
            "Assigned"
          ) {
            matchesStatus =
              Boolean(
                lead.assigned_to
              );
          } else if (
            statusFilter !==
            "All"
          ) {
            matchesStatus =
              lead.lead_status ===
              statusFilter;
          }

          if (
            !matchesStatus
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            [
              lead.name,
              lead.phone,
              lead.intent,
              lead.property_type,
              lead.bedrooms,
              lead.location,
              lead.budget,
              lead.property_status,
              lead.financing,
              lead.timeline,
              lead.callback_time,
              lead.assigned_to,
              lead.lead_status,
              lead.summary,
              lead.notes,
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      leads,
      statusFilter,
      searchQuery,
    ]);

  const selectedLead =
    useMemo(() => {
      if (
        selectedLeadId
      ) {
        const matching =
          leads.find(
            (lead) =>
              lead.id ===
              selectedLeadId
          );

        if (matching) {
          return matching;
        }
      }

      return (
        filteredLeads[0] ||
        leads[0] ||
        null
      );
    }, [
      leads,
      filteredLeads,
      selectedLeadId,
    ]);

  const stats =
    useMemo(() => {
      const total =
        leads.length;

      const qualified =
        leads.filter(
          (lead) =>
            lead.lead_status ===
            "Qualified"
        ).length;

      const assigned =
        leads.filter(
          (lead) =>
            Boolean(
              lead.assigned_to
            )
        ).length;

      const followUps =
        leads.filter(
          (lead) =>
            lead.lead_status ===
              "Follow-up" ||
            lead.lead_status ===
              "Contacted"
        ).length;

      const won =
        leads.filter(
          (lead) =>
            lead.lead_status ===
            "Won"
        ).length;

      const unassigned =
        leads.filter(
          (lead) =>
            !lead.assigned_to
        ).length;

      return {
        total,
        qualified,
        assigned,
        followUps,
        won,
        unassigned,
      };
    }, [leads]);

  const qualityScore =
    useMemo(() => {
      return calculateLeadQuality(
        selectedLead
      );
    }, [selectedLead]);

  return (
    <main
      className="dashboardPage"
    >
      <DashboardStyles />

      {sidebarOpen && (
        <button
          className="sidebarBackdrop"
          onClick={() =>
            setSidebarOpen(
              false
            )
          }
          aria-label="Close menu"
        />
      )}

      <div
        className="dashboardShell"
      >
        <aside
          className={
            sidebarOpen
              ? "dashboardSidebar dashboardSidebarOpen"
              : "dashboardSidebar"
          }
        >
          <div>
            <div
              className="sidebarBrand"
            >
              <div
                className="sidebarBrandIcon"
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
              className="sidebarSectionLabel"
            >
              Workspace
            </div>

            <nav
              className="sidebarMenu"
            >
              <SidebarItem
                icon="⌂"
                label="Overview"
                active={
                  statusFilter ===
                  "All"
                }
                count={
                  stats.total
                }
                onClick={() => {
                  setStatusFilter(
                    "All"
                  );

                  setSidebarOpen(
                    false
                  );
                }}
              />

              <SidebarItem
                icon="◎"
                label="Qualified"
                active={
                  statusFilter ===
                  "Qualified"
                }
                count={
                  stats.qualified
                }
                onClick={() => {
                  setStatusFilter(
                    "Qualified"
                  );

                  setSidebarOpen(
                    false
                  );
                }}
              />

              <SidebarItem
                icon="↗"
                label="Assigned"
                active={
                  statusFilter ===
                  "Assigned"
                }
                count={
                  stats.assigned
                }
                onClick={() => {
                  setStatusFilter(
                    "Assigned"
                  );

                  setSidebarOpen(
                    false
                  );
                }}
              />

              <SidebarItem
                icon="◌"
                label="Follow-up"
                active={
                  statusFilter ===
                  "Follow-up"
                }
                count={
                  leads.filter(
                    (lead) =>
                      lead.lead_status ===
                      "Follow-up"
                  ).length
                }
                onClick={() => {
                  setStatusFilter(
                    "Follow-up"
                  );

                  setSidebarOpen(
                    false
                  );
                }}
              />

              <SidebarItem
                icon="✓"
                label="Won"
                active={
                  statusFilter ===
                  "Won"
                }
                count={
                  stats.won
                }
                onClick={() => {
                  setStatusFilter(
                    "Won"
                  );

                  setSidebarOpen(
                    false
                  );
                }}
              />
            </nav>

            <div
              className="sidebarSectionLabel sidebarSecondLabel"
            >
              Management
            </div>

            <div
              className="sidebarMiniStats"
            >
              <SidebarMiniStat
                label="Assigned"
                value={
                  stats.assigned
                }
              />

              <SidebarMiniStat
                label="Unassigned"
                value={
                  stats.unassigned
                }
              />
            </div>
          </div>

          <div
            className="sidebarSystem"
          >
            <div
              className="systemPulse"
            />

            <div>
              <strong>
                System active
              </strong>

              <span>
                Qualification engine online
              </span>
            </div>
          </div>
        </aside>

        <section
          className="dashboardMain"
        >
          <header
            className="dashboardHeader"
          >
            <div
              className="headerIdentity"
            >
              <button
                className="mobileMenuButton"
                onClick={() =>
                  setSidebarOpen(
                    true
                  )
                }
              >
                ☰
              </button>

              <div>
                <div
                  className="headerEyebrow"
                >
                  LIVE OPERATIONS
                </div>

                <h1>
                  Sales Intelligence
                </h1>
              </div>
            </div>

            <div
              className="headerActions"
            >
              <div
                className="headerLive"
              >
                <span />
                Live data
              </div>

              <button
                className="exportButton"
                onClick={
                  exportLeadsToExcel
                }
                disabled={
                  loading ||
                  leads.length ===
                    0
                }
                title="Download all leads as an Excel file"
              >
                <span
                  className="exportIcon"
                >
                  ⇩
                </span>

                Export Excel
              </button>

              <button
                className="refreshButton"
                onClick={() =>
                  loadLeads({
                    silent:
                      true,
                  })
                }
                disabled={
                  refreshing
                }
              >
                <span
                  className={
                    refreshing
                      ? "refreshIcon refreshIconActive"
                      : "refreshIcon"
                  }
                >
                  ↻
                </span>

                {refreshing
                  ? "Refreshing"
                  : "Refresh"}
              </button>
            </div>
          </header>

          <div
            className="statsGrid"
          >
            <DashboardStat
              label="Total enquiries"
              value={
                stats.total
              }
              detail="Captured by NOMAD"
              accent
            />

            <DashboardStat
              label="Qualified"
              value={
                stats.qualified
              }
              detail="Ready for action"
            />

            <DashboardStat
              label="Assigned"
              value={
                stats.assigned
              }
              detail="With sales team"
            />

            <DashboardStat
              label="Follow-up queue"
              value={
                stats.followUps
              }
              detail="Contacted or due"
            />
          </div>

          <div
            className="dashboardToolbar"
          >
            <div
              className="filterRail"
            >
              {FILTERS.map(
                (
                  filter
                ) => (
                  <button
                    key={
                      filter
                    }
                    onClick={() =>
                      setStatusFilter(
                        filter
                      )
                    }
                    className={
                      statusFilter ===
                      filter
                        ? "filterButton filterButtonActive"
                        : "filterButton"
                    }
                  >
                    {
                      filter
                    }

                    <span>
                      {getFilterCount(
                        leads,
                        filter
                      )}
                    </span>
                  </button>
                )
              )}
            </div>

            <div
              className="searchBox"
            >
              <span>
                ⌕
              </span>

              <input
                value={
                  searchQuery
                }
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event.target
                      .value
                  )
                }
                placeholder="Search leads, locations, phone..."
              />

              {searchQuery && (
                <button
                  onClick={() =>
                    setSearchQuery(
                      ""
                    )
                  }
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div
            className="dashboardContentGrid"
          >
            <section
              className="opportunityPanel"
            >
              <div
                className="panelTop"
              >
                <div>
                  <span
                    className="panelEyebrow"
                  >
                    LIVE OPPORTUNITY FEED
                  </span>

                  <h2>
                    {statusFilter ===
                    "All"
                      ? "All leads"
                      : `${statusFilter} leads`}
                  </h2>
                </div>

                <div
                  className="liveChip"
                >
                  <span />

                  {
                    filteredLeads.length
                  }{" "}
                  shown
                </div>
              </div>

              <div
                className="leadHeaderRow"
              >
                <div>
                  Opportunity
                </div>

                <div>
                  Budget
                </div>

                <div>
                  Assigned
                </div>

                <div>
                  Status
                </div>

                <div />
              </div>

              {loading ? (
                <DashboardLoading />
              ) : (
                <div
                  className="leadRows"
                >
                  {filteredLeads.map(
                    (
                      lead
                    ) => (
                      <RealLeadRow
                        key={
                          lead.id
                        }
                        lead={
                          lead
                        }
                        selected={
                          selectedLead?.id ===
                          lead.id
                        }
                        hovered={
                          hoveredLeadId ===
                          lead.id
                        }
                        updatingStatus={
                          updatingStatusId ===
                          lead.id
                        }
                        updatingAssignment={
                          updatingAssignmentId ===
                          lead.id
                        }
                        onHover={() =>
                          setHoveredLeadId(
                            lead.id
                          )
                        }
                        onLeave={() =>
                          setHoveredLeadId(
                            null
                          )
                        }
                        onSelect={() =>
                          selectLead(
                            lead.id
                          )
                        }
                        onOpen={() =>
                          openLead(
                            lead.id
                          )
                        }
                        onStatusChange={(
                          nextStatus
                        ) =>
                          updateLeadStatus(
                            lead.id,
                            nextStatus
                          )
                        }
                        onAssignmentChange={(
                          nextPerson
                        ) =>
                          updateLeadAssignment(
                            lead.id,
                            nextPerson
                          )
                        }
                      />
                    )
                  )}

                  {filteredLeads.length ===
                    0 && (
                    <EmptyState
                      searchQuery={
                        searchQuery
                      }
                      statusFilter={
                        statusFilter
                      }
                      onReset={() => {
                        setSearchQuery(
                          ""
                        );

                        setStatusFilter(
                          "All"
                        );
                      }}
                    />
                  )}
                </div>
              )}

              {!loading &&
                filteredLeads.length >
                  0 && (
                  <div
                    className="tableFooter"
                  >
                    Showing{" "}
                    {
                      filteredLeads.length
                    }{" "}
                    of{" "}
                    {
                      leads.length
                    }{" "}
                    leads

                    <span>
                      Click any row
                      to preview ·
                      Open for full
                      conversation
                    </span>
                  </div>
                )}
            </section>

            <aside
              className="intelligencePanel"
            >
              {selectedLead ? (
                <>
                  <div
                    className="intelligenceTop"
                  >
                    <div>
                      <span
                        className="panelEyebrow champagneText"
                      >
                        NOMAD
                        INTELLIGENCE
                      </span>

                      <h2>
                        Opportunity
                        quality
                      </h2>
                    </div>

                    <StatusBadge
                      status={
                        selectedLead.lead_status
                      }
                    />
                  </div>

                  <QualityRing
                    score={
                      qualityScore
                    }
                  />

                  <div
                    className="selectedLeadIdentity"
                  >
                    <div
                      className="selectedLeadAvatar"
                    >
                      {getInitials(
                        selectedLead.name
                      )}
                    </div>

                    <div>
                      <strong>
                        {selectedLead.name ||
                          "Unnamed lead"}
                      </strong>

                      <span>
                        {formatProperty(
                          selectedLead
                        )}
                      </span>
                    </div>
                  </div>

                  <div
                    className="qualityDetails"
                  >
                    <QualityLine
                      label="Property intent"
                      value={
                        selectedLead.intent
                          ? "Known"
                          : "Missing"
                      }
                      good={
                        Boolean(
                          selectedLead.intent
                        )
                      }
                    />

                    <QualityLine
                      label="Budget clarity"
                      value={
                        selectedLead.budget
                          ? "Known"
                          : "Missing"
                      }
                      good={
                        Boolean(
                          selectedLead.budget
                        )
                      }
                    />

                    <QualityLine
                      label="Timeline"
                      value={
                        selectedLead.timeline
                          ? "Known"
                          : "Missing"
                      }
                      good={
                        Boolean(
                          selectedLead.timeline
                        )
                      }
                    />

                    <QualityLine
                      label="Callback"
                      value={
                        selectedLead.callback_time
                          ? "Scheduled"
                          : "Not set"
                      }
                      good={
                        Boolean(
                          selectedLead.callback_time
                        )
                      }
                    />

                    <QualityLine
                      label="Phone"
                      value={
                        selectedLead.phone
                          ? "Captured"
                          : "Missing"
                      }
                      good={
                        Boolean(
                          selectedLead.phone
                        )
                      }
                    />
                  </div>

                  {selectedLead.summary && (
                    <div
                      className="intelligenceSummary"
                    >
                      <span>
                        Lead
                        summary
                      </span>

                      <p>
                        {
                          selectedLead.summary
                        }
                      </p>
                    </div>
                  )}

                  <div
                    className="intelligenceControlGroup"
                  >
                    <label>
                      Assigned
                      to
                    </label>

                    <select
                      value={
                        selectedLead.assigned_to ||
                        ""
                      }
                      disabled={
                        updatingAssignmentId ===
                        selectedLead.id
                      }
                      onChange={(
                        event
                      ) =>
                        updateLeadAssignment(
                          selectedLead.id,
                          event
                            .target
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
                        Sales Team
                        A
                      </option>
                    </select>
                  </div>

                  <div
                    className="intelligenceControlGroup"
                  >
                    <label>
                      Lead
                      status
                    </label>

                    <select
                      value={
                        selectedLead.lead_status ||
                        "Qualified"
                      }
                      disabled={
                        updatingStatusId ===
                        selectedLead.id
                      }
                      onChange={(
                        event
                      ) =>
                        updateLeadStatus(
                          selectedLead.id,
                          event
                            .target
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
                  </div>

                  <div
                    className="qualityRecommendation"
                  >
                    <span>
                      NOMAD
                    </span>

                    {buildRecommendation(
                      selectedLead
                    )}
                  </div>

                  <button
                    className="openLeadButton"
                    onClick={() =>
                      openLead(
                        selectedLead.id
                      )
                    }
                  >
                    Open full
                    lead

                    <span>
                      ↗
                    </span>
                  </button>
                </>
              ) : (
                <NoSelectedLead />
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarItem({
  icon,
  label,
  count,
  active,
  onClick,
}) {
  return (
    <button
      onClick={
        onClick
      }
      className={
        active
          ? "sidebarMenuItem sidebarMenuItemActive"
          : "sidebarMenuItem"
      }
    >
      <span
        className="sidebarMenuIcon"
      >
        {icon}
      </span>

      <span
        className="sidebarMenuLabel"
      >
        {label}
      </span>

      <span
        className="sidebarMenuCount"
      >
        {count}
      </span>
    </button>
  );
}

function SidebarMiniStat({
  label,
  value,
}) {
  return (
    <div
      className="sidebarMiniStat"
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

function DashboardStat({
  label,
  value,
  detail,
  accent = false,
}) {
  return (
    <div
      className={
        accent
          ? "dashboardStat dashboardStatAccent"
          : "dashboardStat"
      }
    >
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

function RealLeadRow({
  lead,
  selected,
  hovered,
  updatingStatus,
  updatingAssignment,
  onHover,
  onLeave,
  onSelect,
  onOpen,
  onStatusChange,
  onAssignmentChange,
}) {
  return (
    <div
      className={
        selected
          ? "realLeadRow realLeadRowSelected"
          : hovered
          ? "realLeadRow realLeadRowHovered"
          : "realLeadRow"
      }
      onMouseEnter={
        onHover
      }
      onMouseLeave={
        onLeave
      }
      onClick={
        onSelect
      }
    >
      <div
        className="leadPrimary"
      >
        <div
          className="leadAvatar"
        >
          {getInitials(
            lead.name
          )}
        </div>

        <div
          className="leadIdentity"
        >
          <strong>
            {lead.name ||
              "Unnamed lead"}
          </strong>

          <span>
            {formatProperty(
              lead
            )}

            {lead.location
              ? ` · ${lead.location}`
              : ""}
          </span>

          <small>
            {lead.phone ||
              "No phone"}
          </small>
        </div>
      </div>

      <div
        className="leadBudget"
      >
        <strong>
          {lead.budget ||
            "Not specified"}
        </strong>

        <span>
          {formatIntent(
            lead.intent
          )}
        </span>
      </div>

      <div
        className="leadControlCell"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <div
          className={
            lead.assigned_to
              ? "assignmentDot assignmentDotActive"
              : "assignmentDot"
          }
        />

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
            onAssignmentChange(
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
      </div>

      <div
        className="leadControlCell"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <StatusDot
          status={
            lead.lead_status
          }
        />

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
            onStatusChange(
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
      </div>

      <button
        className="leadOpenButton"
        onClick={(
          event
        ) => {
          event.stopPropagation();

          onOpen();
        }}
        title="Open lead"
      >
        ↗
      </button>
    </div>
  );
}

function StatusDot({
  status,
}) {
  return (
    <span
      className={`statusDot ${getStatusDotClass(
        status
      )}`}
    />
  );
}

function StatusBadge({
  status,
}) {
  return (
    <div
      className={`statusBadge ${getStatusBadgeClass(
        status
      )}`}
    >
      <span />

      {status ||
        "Qualified"}
    </div>
  );
}

function QualityRing({
  score,
}) {
  const degrees =
    Math.round(
      (score /
        100) *
        360
    );

  return (
    <div
      className="qualityRing"
      style={{
        background: `conic-gradient(
          #D8C6A6 0deg ${degrees}deg,
          rgba(255,255,255,.07) ${degrees}deg 360deg
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
            ? "qualityGood"
            : "qualityMissing"
        }
      >
        {value}
      </strong>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div
      className="loadingState"
    >
      <div
        className="loadingOrbit"
      >
        <span />
      </div>

      <strong>
        Loading sales
        intelligence
      </strong>

      <p>
        Retrieving live
        NOMAD
        opportunities...
      </p>
    </div>
  );
}

function EmptyState({
  searchQuery,
  statusFilter,
  onReset,
}) {
  return (
    <div
      className="emptyState"
    >
      <div
        className="emptyIcon"
      >
        ◌
      </div>

      <strong>
        No matching leads
      </strong>

      <p>
        {searchQuery
          ? `Nothing matches "${searchQuery}".`
          : `There are currently no ${statusFilter.toLowerCase()} leads.`}
      </p>

      <button
        onClick={
          onReset
        }
      >
        Show all leads
      </button>
    </div>
  );
}

function NoSelectedLead() {
  return (
    <div
      className="noSelectedLead"
    >
      <div>
        ◌
      </div>

      <strong>
        No opportunity
        selected
      </strong>

      <p>
        Select a lead from
        the opportunity feed
        to view NOMAD
        intelligence.
      </p>
    </div>
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
      .split(/\s+/)
      .filter(
        Boolean
      );

  if (
    pieces.length ===
    1
  ) {
    return pieces[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    pieces[0][0] +
    pieces[
      pieces.length -
        1
    ][0]
  ).toUpperCase();
}

function formatIntent(
  intent
) {
  if (!intent) {
    return "Intent unknown";
  }

  const normalized =
    String(
      intent
    ).toLowerCase();

  if (
    normalized ===
    "buy"
  ) {
    return "Purchase";
  }

  if (
    normalized ===
    "rent"
  ) {
    return "Rental";
  }

  return capitalize(
    intent
  );
}

function formatProperty(
  lead
) {
  if (!lead) {
    return "Property requirement";
  }

  const bedrooms =
    lead.bedrooms
      ? `${lead.bedrooms}BR`
      : "";

  const type =
    lead.property_type
      ? capitalize(
          String(
            lead.property_type
          ).replaceAll(
            "-",
            " "
          )
        )
      : "";

  const parts = [
    bedrooms,
    type,
  ].filter(Boolean);

  if (
    parts.length ===
    0
  ) {
    return "Property requirement";
  }

  return parts.join(
    " "
  );
}

function capitalize(
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

function formatExcelDate(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      value
    );
  }

  return date.toLocaleString(
    "en-AE",
    {
      year:
        "numeric",
      month:
        "short",
      day:
        "2-digit",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  );
}

/* =========================================================
   FILTER COUNTS

   Assigned = has assigned_to value.
   Other filters = lead_status.
   ========================================================= */

function getFilterCount(
  leads,
  filter
) {
  if (
    filter ===
    "All"
  ) {
    return leads.length;
  }

  if (
    filter ===
    "Assigned"
  ) {
    return leads.filter(
      (lead) =>
        Boolean(
          lead.assigned_to
        )
    ).length;
  }

  return leads.filter(
    (lead) =>
      lead.lead_status ===
      filter
  ).length;
}

function calculateLeadQuality(
  lead
) {
  if (!lead) {
    return 0;
  }

  const fields = [
    lead.intent,
    lead.property_type,
    lead.budget,
    lead.location,
    lead.timeline,
    lead.name,
    lead.phone,
    lead.callback_time,
  ];

  if (
    String(
      lead.intent ||
        ""
    ).toLowerCase() ===
    "buy"
  ) {
    fields.push(
      lead.financing
    );

    fields.push(
      lead.property_status
    );
  }

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

  const completed =
    fields.filter(
      Boolean
    ).length;

  return Math.round(
    (completed /
      fields.length) *
      100
  );
}

function buildRecommendation(
  lead
) {
  if (!lead) {
    return "";
  }

  if (
    !lead.assigned_to
  ) {
    return "Lead requirements are captured. Assign this opportunity to a sales consultant for follow-up.";
  }

  if (
    lead.lead_status ===
    "Won"
  ) {
    return `Opportunity is marked as won and assigned to ${lead.assigned_to}.`;
  }

  if (
    lead.lead_status ===
    "Lost"
  ) {
    return "Opportunity is marked as lost. Review the conversation if further context is required.";
  }

  if (
    lead.callback_time
  ) {
    return `${lead.assigned_to} has the customer context and callback preference available for follow-up.`;
  }

  return `${lead.assigned_to} has the captured property requirements available for consultant follow-up.`;
}

function getStatusDotClass(
  status
) {
  switch (
    status
  ) {
    case "Qualified":
      return "statusDotQualified";

    case "Assigned":
      return "statusDotAssigned";

    case "Contacted":
      return "statusDotContacted";

    case "Follow-up":
      return "statusDotFollowUp";

    case "Won":
      return "statusDotWon";

    case "Lost":
      return "statusDotLost";

    default:
      return "statusDotQualified";
  }
}

function getStatusBadgeClass(
  status
) {
  switch (
    status
  ) {
    case "Won":
      return "statusBadgeWon";

    case "Lost":
      return "statusBadgeLost";

    case "Follow-up":
      return "statusBadgeFollow";

    case "Contacted":
      return "statusBadgeContacted";

    case "Assigned":
      return "statusBadgeAssigned";

    default:
      return "statusBadgeQualified";
  }
}

/* =========================================================
   CSS
   ========================================================= */

function DashboardStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        background: #082F27;
      }

      button,
      input,
      select {
        font-family: inherit;
      }

      button {
        -webkit-tap-highlight-color: transparent;
      }

      ::selection {
        background: rgba(216, 198, 166, .25);
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(255,255,255,.02);
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(216,198,166,.16);
        border-radius: 999px;
      }

      .dashboardPage {
        min-height: 100vh;
        background:
          radial-gradient(
            circle at 80% 5%,
            rgba(11,118,99,.08),
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
      }

      .dashboardShell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
      }

      .dashboardSidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 26px 20px;
        background: #082F27;
        border-right: 1px solid rgba(255,255,255,.07);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        z-index: 30;
      }

      .sidebarBrand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .sidebarBrandIcon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #164F42;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 850;
        border: 1px solid rgba(216,198,166,.14);
        box-shadow: 0 10px 28px rgba(0,0,0,.12);
      }

      .sidebarBrand strong {
        display: block;
        color: white;
        font-size: 14px;
        letter-spacing: .5px;
      }

      .sidebarBrand span {
        display: block;
        margin-top: 2px;
        color: rgba(255,255,255,.42);
        font-size: 9px;
        letter-spacing: .7px;
      }

      .sidebarSectionLabel {
        margin: 38px 10px 11px;
        color: rgba(255,255,255,.32);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
      }

      .sidebarSecondLabel {
        margin-top: 34px;
      }

      .sidebarMenu {
        display: grid;
        gap: 5px;
      }

      .sidebarMenuItem {
        width: 100%;
        min-height: 42px;
        padding: 0 11px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: rgba(255,255,255,.48);
        display: grid;
        grid-template-columns: 18px 1fr auto;
        gap: 9px;
        align-items: center;
        text-align: left;
        cursor: pointer;
        transition:
          background .2s ease,
          color .2s ease,
          transform .2s ease;
      }

      .sidebarMenuItem:hover {
        color: rgba(255,255,255,.82);
        background: rgba(255,255,255,.035);
        transform: translateX(2px);
      }

      .sidebarMenuItemActive {
        color: white;
        background: rgba(255,255,255,.065);
      }

      .sidebarMenuIcon {
        color: #D8C6A6;
        text-align: center;
        font-size: 11px;
      }

      .sidebarMenuLabel {
        font-size: 10px;
        font-weight: 650;
      }

      .sidebarMenuCount {
        min-width: 22px;
        padding: 3px 6px;
        border-radius: 999px;
        background: rgba(255,255,255,.04);
        color: rgba(255,255,255,.45);
        text-align: center;
        font-size: 8px;
      }

      .sidebarMenuItemActive .sidebarMenuCount {
        color: #D8C6A6;
        background: rgba(216,198,166,.08);
      }

      .sidebarMiniStats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
      }

      .sidebarMiniStat {
        padding: 11px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.05);
        background: rgba(255,255,255,.028);
      }

      .sidebarMiniStat span {
        display: block;
        color: rgba(255,255,255,.38);
        font-size: 8px;
      }

      .sidebarMiniStat strong {
        display: block;
        margin-top: 6px;
        color: white;
        font-size: 17px;
        font-weight: 620;
      }

      .sidebarSystem {
        padding: 13px;
        border-radius: 12px;
        background: rgba(255,255,255,.038);
        border: 1px solid rgba(255,255,255,.05);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .systemPulse {
        width: 7px;
        height: 7px;
        flex-shrink: 0;
        border-radius: 50%;
        background: #78C6A6;
        box-shadow: 0 0 0 5px rgba(120,198,166,.06);
        animation: systemPulse 2s ease-in-out infinite;
      }

      @keyframes systemPulse {
        0%,
        100% {
          transform: scale(1);
          opacity: .75;
        }

        50% {
          transform: scale(1.2);
          opacity: 1;
        }
      }

      .sidebarSystem strong {
        display: block;
        color: white;
        font-size: 10px;
      }

      .sidebarSystem span {
        display: block;
        margin-top: 2px;
        color: rgba(255,255,255,.40);
        font-size: 8px;
      }

      .dashboardMain {
        min-width: 0;
        padding: 30px;
        background:
          linear-gradient(
            145deg,
            #0A2E27,
            #082B24
          );
      }

      .dashboardHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
      }

      .headerIdentity {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .headerEyebrow {
        color: rgba(255,255,255,.42);
        font-size: 10px;
        font-weight: 750;
        letter-spacing: 1.2px;
      }

      .dashboardHeader h1 {
        margin: 6px 0 0;
        color: white;
        font-size: 28px;
        line-height: 1;
        letter-spacing: -.8px;
        font-weight: 620;
      }

      .headerActions {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .headerLive {
        height: 36px;
        padding: 0 12px;
        border-radius: 9px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.03);
        color: rgba(255,255,255,.58);
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 9px;
      }

      .headerLive span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #78C6A6;
      }

      .exportButton {
        height: 36px;
        padding: 0 13px;
        border-radius: 9px;
        border: 1px solid rgba(216,198,166,.16);
        background: rgba(216,198,166,.08);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 750;
        transition:
          background .2s ease,
          border .2s ease,
          transform .2s ease;
      }

      .exportButton:hover:not(:disabled) {
        background: rgba(216,198,166,.13);
        border-color: rgba(216,198,166,.24);
        transform: translateY(-1px);
      }

      .exportButton:disabled {
        cursor: not-allowed;
        opacity: .35;
      }

      .exportIcon {
        font-size: 13px;
        line-height: 1;
      }

      .refreshButton {
        height: 36px;
        padding: 0 12px;
        border-radius: 9px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.04);
        color: rgba(255,255,255,.72);
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        font-size: 9px;
        transition: background .2s ease;
      }

      .refreshButton:hover {
        background: rgba(255,255,255,.065);
      }

      .refreshButton:disabled {
        cursor: not-allowed;
        opacity: .55;
      }

      .refreshIcon {
        display: inline-block;
      }

      .refreshIconActive {
        animation: refreshSpin .8s linear infinite;
      }

      @keyframes refreshSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .mobileMenuButton {
        display: none;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.07);
        background: rgba(255,255,255,.04);
        color: white;
        cursor: pointer;
      }

      .statsGrid {
        margin-top: 26px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }

      .dashboardStat {
        min-height: 108px;
        padding: 17px;
        border-radius: 13px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.038);
        position: relative;
        overflow: hidden;
        transition:
          transform .25s ease,
          background .25s ease;
      }

      .dashboardStat:hover {
        transform: translateY(-2px);
        background: rgba(255,255,255,.05);
      }

      .dashboardStatAccent::after {
        content: "";
        position: absolute;
        width: 110px;
        height: 110px;
        border-radius: 50%;
        right: -55px;
        top: -55px;
        border: 1px solid rgba(216,198,166,.09);
      }

      .dashboardStat > span {
        color: rgba(255,255,255,.42);
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .85px;
      }

      .dashboardStat strong {
        display: block;
        margin-top: 8px;
        color: white;
        font-size: 27px;
        line-height: 1;
        font-weight: 620;
      }

      .dashboardStat small {
        display: block;
        margin-top: 8px;
        color: #78C6A6;
        font-size: 9px;
      }

      .dashboardToolbar {
        margin-top: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .filterRail {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 2px;
      }

      .filterButton {
        flex-shrink: 0;
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.025);
        color: rgba(255,255,255,.50);
        cursor: pointer;
        font-size: 9px;
        display: flex;
        align-items: center;
        gap: 7px;
        transition:
          background .2s ease,
          color .2s ease,
          border .2s ease;
      }

      .filterButton span {
        min-width: 18px;
        padding: 2px 5px;
        border-radius: 999px;
        background: rgba(255,255,255,.045);
        font-size: 8px;
      }

      .filterButton:hover {
        color: rgba(255,255,255,.78);
      }

      .filterButtonActive {
        border-color: rgba(216,198,166,.20);
        background: rgba(216,198,166,.08);
        color: #D8C6A6;
      }

      .searchBox {
        width: 280px;
        min-height: 38px;
        flex-shrink: 0;
        padding: 0 11px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.03);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .searchBox > span {
        color: rgba(255,255,255,.36);
        font-size: 13px;
      }

      .searchBox input {
        min-width: 0;
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        color: white;
        font-size: 10px;
      }

      .searchBox input::placeholder {
        color: rgba(255,255,255,.32);
      }

      .searchBox button {
        border: none;
        background: transparent;
        color: rgba(255,255,255,.42);
        cursor: pointer;
        font-size: 14px;
      }

      .dashboardContentGrid {
        margin-top: 18px;
        display: grid;
        grid-template-columns:
          minmax(0, 1.65fr)
          minmax(250px, .62fr);
        gap: 14px;
        align-items: start;
      }

      .opportunityPanel,
      .intelligencePanel {
        border-radius: 15px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.034);
      }

      .opportunityPanel {
        min-width: 0;
        padding: 18px;
      }

      .panelTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
      }

      .panelEyebrow {
        display: block;
        color: rgba(255,255,255,.40);
        font-size: 9px;
        font-weight: 750;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .panelTop h2,
      .intelligenceTop h2 {
        margin: 5px 0 0;
        color: white;
        font-size: 16px;
        font-weight: 650;
      }

      .liveChip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border-radius: 999px;
        color: #78C6A6;
        background: rgba(120,198,166,.07);
        font-size: 8px;
      }

      .liveChip span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #78C6A6;
      }

      .leadHeaderRow {
        margin-top: 18px;
        min-height: 32px;
        display: grid;
        grid-template-columns:
          minmax(210px, 1.55fr)
          minmax(90px, .7fr)
          minmax(112px, .8fr)
          minmax(110px, .75fr)
          30px;
        gap: 10px;
        align-items: center;
        padding: 0 8px;
        color: rgba(255,255,255,.32);
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .8px;
        border-bottom: 1px solid rgba(255,255,255,.05);
      }

      .leadRows {
        min-width: 0;
      }

      .realLeadRow {
        min-height: 76px;
        display: grid;
        grid-template-columns:
          minmax(210px, 1.55fr)
          minmax(90px, .7fr)
          minmax(112px, .8fr)
          minmax(110px, .75fr)
          30px;
        gap: 10px;
        align-items: center;
        padding: 10px 8px;
        border-bottom: 1px solid rgba(255,255,255,.05);
        cursor: pointer;
        border-radius: 9px;
        transition:
          background .22s ease,
          transform .22s ease;
      }

      .realLeadRowHovered {
        background: rgba(255,255,255,.035);
        transform: translateX(2px);
      }

      .realLeadRowSelected {
        background:
          linear-gradient(
            90deg,
            rgba(216,198,166,.07),
            rgba(255,255,255,.025)
          );
        box-shadow:
          inset 2px 0 0 rgba(216,198,166,.52);
      }

      .leadPrimary {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .leadAvatar {
        width: 34px;
        height: 34px;
        flex-shrink: 0;
        border-radius: 50%;
        background: rgba(216,198,166,.10);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 850;
        border: 1px solid rgba(216,198,166,.08);
      }

      .leadIdentity {
        min-width: 0;
      }

      .leadIdentity strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: white;
        font-size: 11px;
      }

      .leadIdentity span {
        display: block;
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: rgba(255,255,255,.46);
        font-size: 9px;
      }

      .leadIdentity small {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,.32);
        font-size: 8px;
      }

      .leadBudget strong {
        display: block;
        color: rgba(255,255,255,.82);
        font-size: 10px;
        font-weight: 700;
      }

      .leadBudget span {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,.39);
        font-size: 8px;
      }

      .leadControlCell {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .leadControlCell select {
        min-width: 0;
        width: 100%;
        border: none;
        outline: none;
        padding: 7px 6px;
        border-radius: 7px;
        background: rgba(255,255,255,.04);
        color: rgba(255,255,255,.76);
        cursor: pointer;
        font-size: 9px;
        appearance: auto;
      }

      .leadControlCell select option {
        color: #101814;
        background: white;
      }

      .leadControlCell select:disabled {
        opacity: .45;
        cursor: wait;
      }

      .assignmentDot,
      .statusDot {
        width: 5px;
        height: 5px;
        flex-shrink: 0;
        border-radius: 50%;
      }

      .assignmentDot {
        background: rgba(255,255,255,.16);
      }

      .assignmentDotActive {
        background: #D8C6A6;
        box-shadow: 0 0 0 4px rgba(216,198,166,.05);
      }

      .leadOpenButton {
        width: 29px;
        height: 29px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.025);
        color: rgba(255,255,255,.46);
        cursor: pointer;
        font-size: 10px;
        transition:
          background .2s ease,
          color .2s ease;
      }

      .leadOpenButton:hover {
        background: rgba(216,198,166,.08);
        color: #D8C6A6;
      }

      .tableFooter {
        margin-top: 13px;
        padding-top: 11px;
        border-top: 1px solid rgba(255,255,255,.05);
        color: rgba(255,255,255,.38);
        font-size: 8px;
        display: flex;
        justify-content: space-between;
        gap: 20px;
      }

      .statusDotQualified {
        background: #75D0AC;
      }

      .statusDotAssigned {
        background: #D8C6A6;
      }

      .statusDotContacted {
        background: #8CB4D8;
      }

      .statusDotFollowUp {
        background: #E1A771;
      }

      .statusDotWon {
        background: #66CE90;
      }

      .statusDotLost {
        background: #D98383;
      }

      .intelligencePanel {
        position: sticky;
        top: 30px;
        padding: 20px;
      }

      .intelligenceTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .champagneText {
        color: #D8C6A6;
      }

      .statusBadge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 115px;
        padding: 6px 8px;
        border-radius: 999px;
        font-size: 8px;
        font-weight: 750;
        white-space: nowrap;
      }

      .statusBadge span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
      }

      .statusBadgeQualified {
        background: rgba(117,208,172,.08);
        color: #75D0AC;
      }

      .statusBadgeQualified span {
        background: #75D0AC;
      }

      .statusBadgeAssigned {
        background: rgba(216,198,166,.08);
        color: #D8C6A6;
      }

      .statusBadgeAssigned span {
        background: #D8C6A6;
      }

      .statusBadgeContacted {
        background: rgba(140,180,216,.08);
        color: #8CB4D8;
      }

      .statusBadgeContacted span {
        background: #8CB4D8;
      }

      .statusBadgeFollow {
        background: rgba(225,167,113,.08);
        color: #E1A771;
      }

      .statusBadgeFollow span {
        background: #E1A771;
      }

      .statusBadgeWon {
        background: rgba(102,206,144,.08);
        color: #66CE90;
      }

      .statusBadgeWon span {
        background: #66CE90;
      }

      .statusBadgeLost {
        background: rgba(217,131,131,.08);
        color: #D98383;
      }

      .statusBadgeLost span {
        background: #D98383;
      }

      .qualityRing {
        margin: 25px auto 21px;
        width: 145px;
        height: 145px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 40px rgba(216,198,166,.04);
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
        font-size: 31px;
        font-weight: 620;
      }

      .qualityRingInner span {
        margin-top: 3px;
        color: rgba(255,255,255,.40);
        font-size: 8px;
        letter-spacing: .7px;
      }

      .selectedLeadIdentity {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(255,255,255,.05);
      }

      .selectedLeadAvatar {
        width: 37px;
        height: 37px;
        border-radius: 50%;
        background: rgba(216,198,166,.10);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 850;
      }

      .selectedLeadIdentity strong {
        display: block;
        color: white;
        font-size: 11px;
      }

      .selectedLeadIdentity span {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,.44);
        font-size: 9px;
      }

      .qualityDetails {
        margin-top: 5px;
      }

      .qualityLine {
        min-height: 39px;
        border-bottom: 1px solid rgba(255,255,255,.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .qualityLine > span {
        color: rgba(255,255,255,.43);
        font-size: 9px;
      }

      .qualityLine strong {
        font-size: 9px;
      }

      .qualityGood {
        color: rgba(255,255,255,.78);
      }

      .qualityMissing {
        color: #D98383;
      }

      .intelligenceSummary {
        margin-top: 16px;
        padding: 13px;
        border-radius: 11px;
        background: rgba(255,255,255,.035);
        border: 1px solid rgba(255,255,255,.05);
      }

      .intelligenceSummary span {
        color: #D8C6A6;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .9px;
        font-weight: 750;
      }

      .intelligenceSummary p {
        margin: 7px 0 0;
        color: rgba(255,255,255,.58);
        font-size: 9px;
        line-height: 1.6;
      }

      .intelligenceControlGroup {
        margin-top: 13px;
      }

      .intelligenceControlGroup label {
        display: block;
        margin-bottom: 6px;
        color: rgba(255,255,255,.38);
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .75px;
      }

      .intelligenceControlGroup select {
        width: 100%;
        min-height: 38px;
        padding: 0 10px;
        border-radius: 9px;
        border: 1px solid rgba(255,255,255,.055);
        outline: none;
        background: rgba(255,255,255,.04);
        color: rgba(255,255,255,.78);
        cursor: pointer;
        font-size: 10px;
      }

      .intelligenceControlGroup select option {
        color: #101814;
        background: white;
      }

      .qualityRecommendation {
        margin-top: 16px;
        padding: 12px;
        border-radius: 11px;
        background: rgba(216,198,166,.07);
        border: 1px solid rgba(216,198,166,.08);
        color: rgba(255,255,255,.56);
        font-size: 9px;
        line-height: 1.6;
      }

      .qualityRecommendation > span {
        display: block;
        margin-bottom: 4px;
        color: #D8C6A6;
        font-size: 8px;
        font-weight: 850;
        letter-spacing: .8px;
      }

      .openLeadButton {
        width: 100%;
        min-height: 40px;
        margin-top: 14px;
        border: none;
        border-radius: 10px;
        background: #D8C6A6;
        color: #082F27;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
        transition:
          transform .2s ease,
          background .2s ease;
      }

      .openLeadButton span {
        margin-left: 8px;
      }

      .openLeadButton:hover {
        transform: translateY(-1px);
        background: #E2D3B9;
      }

      .loadingState,
      .emptyState,
      .noSelectedLead {
        min-height: 320px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .loadingOrbit {
        position: relative;
        width: 58px;
        height: 58px;
        margin-bottom: 17px;
        border-radius: 50%;
        border: 1px solid rgba(216,198,166,.15);
        animation: loadingOrbitRotate 2s linear infinite;
      }

      .loadingOrbit span {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        top: -3px;
        left: 26px;
        background: #D8C6A6;
      }

      @keyframes loadingOrbitRotate {
        to {
          transform: rotate(360deg);
        }
      }

      .loadingState strong,
      .emptyState strong,
      .noSelectedLead strong {
        color: rgba(255,255,255,.76);
        font-size: 11px;
      }

      .loadingState p,
      .emptyState p,
      .noSelectedLead p {
        margin: 6px 0 0;
        max-width: 260px;
        color: rgba(255,255,255,.38);
        font-size: 9px;
        line-height: 1.6;
      }

      .emptyIcon,
      .noSelectedLead > div {
        width: 40px;
        height: 40px;
        margin-bottom: 12px;
        border-radius: 50%;
        background: rgba(216,198,166,.06);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .emptyState button {
        margin-top: 13px;
        border: 1px solid rgba(216,198,166,.12);
        background: rgba(216,198,166,.06);
        color: #D8C6A6;
        border-radius: 999px;
        padding: 8px 11px;
        cursor: pointer;
        font-size: 9px;
      }

      .sidebarBackdrop {
        display: none;
      }

      @media (max-width: 1180px) {
        .dashboardShell {
          grid-template-columns: 190px minmax(0, 1fr);
        }

        .dashboardSidebar {
          padding: 24px 15px;
        }

        .dashboardMain {
          padding: 24px;
        }

        .dashboardContentGrid {
          grid-template-columns:
            minmax(0, 1.5fr)
            minmax(230px, .65fr);
        }

        .leadHeaderRow,
        .realLeadRow {
          grid-template-columns:
            minmax(190px, 1.45fr)
            85px
            105px
            103px
            28px;
        }
      }

      @media (max-width: 980px) {
        .dashboardShell {
          grid-template-columns: 1fr;
        }

        .dashboardSidebar {
          position: fixed;
          z-index: 100;
          left: 0;
          top: 0;
          width: 240px;
          transform: translateX(-105%);
          box-shadow: 18px 0 60px rgba(0,0,0,.25);
          transition: transform .28s ease;
        }

        .dashboardSidebarOpen {
          transform: translateX(0);
        }

        .sidebarBackdrop {
          display: block;
          position: fixed;
          z-index: 90;
          inset: 0;
          border: none;
          background: rgba(0,0,0,.46);
          backdrop-filter: blur(4px);
        }

        .mobileMenuButton {
          display: block;
        }

        .dashboardContentGrid {
          grid-template-columns: 1fr;
        }

        .intelligencePanel {
          position: static;
        }

        .statsGrid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 760px) {
        .dashboardMain {
          padding: 18px;
        }

        .dashboardHeader {
          align-items: flex-start;
        }

        .headerLive {
          display: none;
        }

        .dashboardToolbar {
          flex-direction: column;
          align-items: stretch;
        }

        .searchBox {
          width: 100%;
        }

        .opportunityPanel {
          overflow-x: auto;
        }

        .leadHeaderRow,
        .realLeadRow {
          min-width: 760px;
        }

        .tableFooter {
          min-width: 760px;
        }
      }

      @media (max-width: 540px) {
        .statsGrid {
          grid-template-columns: 1fr 1fr;
        }

        .dashboardHeader h1 {
          font-size: 24px;
        }

        .dashboardStat {
          min-height: 96px;
        }

        .dashboardStat strong {
          font-size: 24px;
        }

        .headerActions {
          gap: 5px;
        }

        .exportButton,
        .refreshButton {
          padding: 0 9px;
        }

        .exportButton {
          font-size: 8px;
        }
      }
    `}</style>
  );
}
