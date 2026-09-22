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
   FINAL DASHBOARD
   ========================================================= */

const STATUS_OPTIONS = [
  "Qualified",
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

const ANALYTICS_PERIODS = [
  {
    value: "7",
    label: "7 Days",
  },
  {
    value: "30",
    label: "30 Days",
  },
  {
    value: "90",
    label: "90 Days",
  },
  {
    value: "all",
    label: "All Time",
  },
];

const TEAM_MEMBERS = [
  "Ahmed",
  "Sarah",
  "Ali",
  "Sales Team A",
];

/* =========================================================
   MAIN DASHBOARD
   ========================================================= */

export default function Dashboard() {
  const router =
    useRouter();

  const [
    leads,
    setLeads,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    updatingStatusId,
    setUpdatingStatusId,
  ] = useState(null);

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

  const [
    analyticsPeriod,
    setAnalyticsPeriod,
  ] = useState("30");

  useEffect(() => {
    loadLeads();
  }, []);

  /* =========================================================
     LOAD LEADS
     ========================================================= */

  async function loadLeads({
    silent = false,
  } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response =
        await fetch(
          "/api/leads",
          {
            cache:
              "no-store",
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

  /* =========================================================
     UPDATE STATUS
     ========================================================= */

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
            method:
              "POST",

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

  /* =========================================================
     UPDATE ASSIGNMENT
     ========================================================= */

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
            method:
              "POST",

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

  function openLead(
    id
  ) {
    router.push(
      `/dashboard/lead/${id}`
    );
  }

  function selectLead(
    id
  ) {
    setSelectedLeadId(
      id
    );
  }

  /* =========================================================
     EXCEL EXPORT
     ========================================================= */

  function exportLeadsToExcel() {
    if (
      !Array.isArray(
        leads
      ) ||
      leads.length ===
        0
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
            lead.phone || "",

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
            lead.bedrooms || "",

          Budget:
            lead.budget || "",

          Location:
            lead.location || "",

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
            lead.timeline || "",

          "Callback Time":
            lead.callback_time ||
            "",

          "Assigned To":
            lead.assigned_to ||
            "Unassigned",

          "Lead Status":
            normalizeStatus(
              lead.lead_status
            ),

          "Sales Notes":
            lead.notes || "",

          "AI Summary":
            lead.summary || "",

          Source:
            lead.source || "",

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
      { wch: 45 },
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
        .slice(
          0,
          10
        );

    XLSX.writeFile(
      workbook,
      `NOMAD-Leads-${dateStamp}.xlsx`
    );
  }

  /* =========================================================
     OPERATIONAL FILTERS
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
              normalizeStatus(
                lead.lead_status
              ) ===
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
              .join(
                " "
              )
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

  /* =========================================================
     SELECTED LEAD

     Selected preview now respects the active filter.
     ========================================================= */

  const selectedLead =
    useMemo(() => {
      if (
        filteredLeads.length ===
        0
      ) {
        return null;
      }

      if (
        selectedLeadId
      ) {
        const matching =
          filteredLeads.find(
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
        null
      );
    }, [
      filteredLeads,
      selectedLeadId,
    ]);

  /* =========================================================
     TOP DASHBOARD STATS
     ========================================================= */

  const stats =
    useMemo(() => {
      const total =
        leads.length;

      const qualified =
        leads.filter(
          (lead) =>
            normalizeStatus(
              lead.lead_status
            ) ===
            "Qualified"
        ).length;

      const assigned =
        leads.filter(
          (lead) =>
            Boolean(
              lead.assigned_to
            )
        ).length;

      const contacted =
        leads.filter(
          (lead) =>
            normalizeStatus(
              lead.lead_status
            ) ===
            "Contacted"
        ).length;

      const followUp =
        leads.filter(
          (lead) =>
            normalizeStatus(
              lead.lead_status
            ) ===
            "Follow-up"
        ).length;

      const followUps =
        contacted +
        followUp;

      const won =
        leads.filter(
          (lead) =>
            normalizeStatus(
              lead.lead_status
            ) ===
            "Won"
        ).length;

      const lost =
        leads.filter(
          (lead) =>
            normalizeStatus(
              lead.lead_status
            ) ===
            "Lost"
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
        contacted,
        followUp,
        followUps,
        won,
        lost,
        unassigned,
      };
    }, [
      leads,
    ]);

  /* =========================================================
     ANALYTICS PERIOD DATA
     ========================================================= */

  const analyticsLeads =
    useMemo(() => {
      return filterLeadsByPeriod(
        leads,
        analyticsPeriod
      );
    }, [
      leads,
      analyticsPeriod,
    ]);

  /* =========================================================
     ANALYTICS
     ========================================================= */

  const analytics =
    useMemo(() => {
      const total =
        analyticsLeads.length;

      const assigned =
        analyticsLeads.filter(
          (lead) =>
            Boolean(
              lead.assigned_to
            )
        ).length;

      const unassigned =
        total -
        assigned;

      const won =
        analyticsLeads.filter(
          (lead) =>
            normalizeStatus(
              lead.lead_status
            ) ===
            "Won"
        ).length;

      const qualityScores =
        analyticsLeads.map(
          (lead) =>
            calculateLeadQuality(
              lead
            )
        );

      const averageQuality =
        qualityScores.length >
        0
          ? Math.round(
              qualityScores.reduce(
                (
                  totalScore,
                  score
                ) =>
                  totalScore +
                  score,
                0
              ) /
                qualityScores.length
            )
          : 0;

      const assignmentRate =
        total > 0
          ? Math.round(
              (assigned /
                total) *
                100
            )
          : 0;

      const winRate =
        total > 0
          ? Math.round(
              (won /
                total) *
                100
            )
          : 0;

      const statusData =
        [
          "Qualified",
          "Contacted",
          "Follow-up",
          "Won",
          "Lost",
        ].map(
          (status) => ({
            label:
              status,

            value:
              analyticsLeads.filter(
                (lead) =>
                  normalizeStatus(
                    lead.lead_status
                  ) ===
                  status
              ).length,
          })
        );

      const assignmentData =
        [
          ...TEAM_MEMBERS,
          "Unassigned",
        ].map(
          (
            person
          ) => ({
            label:
              person,

            value:
              person ===
              "Unassigned"
                ? analyticsLeads.filter(
                    (
                      lead
                    ) =>
                      !lead.assigned_to
                  ).length
                : analyticsLeads.filter(
                    (
                      lead
                    ) =>
                      lead.assigned_to ===
                      person
                  ).length,
          })
        );

      const buyCount =
        analyticsLeads.filter(
          (lead) =>
            String(
              lead.intent ||
                ""
            ).toLowerCase() ===
            "buy"
        ).length;

      const rentCount =
        analyticsLeads.filter(
          (lead) =>
            String(
              lead.intent ||
                ""
            ).toLowerCase() ===
            "rent"
        ).length;

      const otherIntent =
        Math.max(
          0,
          total -
            buyCount -
            rentCount
        );

      const intentData =
        [
          {
            label:
              "Buy",
            value:
              buyCount,
          },
          {
            label:
              "Rent",
            value:
              rentCount,
          },
          {
            label:
              "Other",
            value:
              otherIntent,
          },
        ];

      const locationMap =
        {};

      analyticsLeads.forEach(
        (lead) => {
          const location =
            cleanLocation(
              lead.location
            );

          if (
            !location
          ) {
            return;
          }

          locationMap[
            location
          ] =
            (
              locationMap[
                location
              ] ||
              0
            ) + 1;
        }
      );

      const topLocations =
        Object.entries(
          locationMap
        )
          .map(
            ([
              label,
              value,
            ]) => ({
              label,
              value,
            })
          )
          .sort(
            (
              a,
              b
            ) =>
              b.value -
              a.value
          )
          .slice(
            0,
            5
          );

      const trendData =
        buildLeadTrend(
          analyticsLeads,
          analyticsPeriod
        );

      return {
        total,
        assigned,
        unassigned,
        won,
        averageQuality,
        assignmentRate,
        winRate,
        statusData,
        assignmentData,
        intentData,
        topLocations,
        trendData,
      };
    }, [
      analyticsLeads,
      analyticsPeriod,
    ]);

  const qualityScore =
    useMemo(() => {
      return calculateLeadQuality(
        selectedLead
      );
    }, [
      selectedLead,
    ]);

  /* =========================================================
     RENDER
     ========================================================= */

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
        {/* ===================================================
            SIDEBAR
            =================================================== */}

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
                  stats.followUp
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

        {/* ===================================================
            MAIN
            =================================================== */}

        <section
          className="dashboardMain"
        >
          {/* =================================================
              HEADER
              ================================================= */}

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

          {/* =================================================
              TOP KPI CARDS
              ================================================= */}

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
              detail="Contacted + follow-up"
            />
          </div>

          {/* =================================================
              ANALYTICS SECTION
              ================================================= */}

          <section
            className="analyticsSection"
          >
            <div
              className="analyticsHeader"
            >
              <div>
                <span
                  className="sectionEyebrow"
                >
                  MANAGEMENT ANALYTICS
                </span>

                <h2>
                  Performance overview
                </h2>

                <p>
                  Live analysis of lead flow,
                  team allocation and conversion
                  signals.
                </p>
              </div>

              <div
                className="analyticsPeriodSelector"
              >
                {ANALYTICS_PERIODS.map(
                  (
                    period
                  ) => (
                    <button
                      key={
                        period.value
                      }
                      className={
                        analyticsPeriod ===
                        period.value
                          ? "analyticsPeriodButton analyticsPeriodButtonActive"
                          : "analyticsPeriodButton"
                      }
                      onClick={() =>
                        setAnalyticsPeriod(
                          period.value
                        )
                      }
                    >
                      {
                        period.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              className="analyticsKpiGrid"
            >
              <AnalyticsKpi
                label="Leads in period"
                value={
                  analytics.total
                }
                detail={
                  getAnalyticsPeriodLabel(
                    analyticsPeriod
                  )
                }
              />

              <AnalyticsKpi
                label="Average quality"
                value={`${analytics.averageQuality}%`}
                detail="Qualification completeness"
              />

              <AnalyticsKpi
                label="Assignment rate"
                value={`${analytics.assignmentRate}%`}
                detail={`${analytics.assigned} of ${analytics.total} allocated`}
              />

              <AnalyticsKpi
                label="Win rate"
                value={`${analytics.winRate}%`}
                detail={`${analytics.won} won opportunities`}
              />
            </div>

            <div
              className="analyticsGrid"
            >
              <div
                className="analyticsCard analyticsTrendCard"
              >
                <AnalyticsCardHeader
                  eyebrow="LEAD MOMENTUM"
                  title="Lead creation trend"
                  caption={getAnalyticsPeriodLabel(
                    analyticsPeriod
                  )}
                />

                <TrendChart
                  data={
                    analytics.trendData
                  }
                />
              </div>

              <div
                className="analyticsCard"
              >
                <AnalyticsCardHeader
                  eyebrow="PIPELINE"
                  title="Status distribution"
                  caption={`${analytics.total} leads`}
                />

                <AnalyticsBarList
                  data={
                    analytics.statusData
                  }
                  emptyText="No lead status data yet."
                />
              </div>

              <div
                className="analyticsCard"
              >
                <AnalyticsCardHeader
                  eyebrow="SALES OWNERSHIP"
                  title="Team allocation"
                  caption={`${analytics.assigned} assigned`}
                />

                <AnalyticsBarList
                  data={
                    analytics.assignmentData
                  }
                  emptyText="No assignment data yet."
                />
              </div>

              <div
                className="analyticsCard analyticsSplitCard"
              >
                <AnalyticsCardHeader
                  eyebrow="ASSIGNMENT HEALTH"
                  title="Assigned vs unassigned"
                  caption={`${analytics.assignmentRate}% coverage`}
                />

                <DonutChart
                  centerValue={`${analytics.assignmentRate}%`}
                  centerLabel="Assigned"
                  items={[
                    {
                      label:
                        "Assigned",
                      value:
                        analytics.assigned,
                      color:
                        "#D8C6A6",
                    },
                    {
                      label:
                        "Unassigned",
                      value:
                        analytics.unassigned,
                      color:
                        "rgba(255,255,255,.12)",
                    },
                  ]}
                />
              </div>

              <div
                className="analyticsCard analyticsSplitCard"
              >
                <AnalyticsCardHeader
                  eyebrow="CUSTOMER INTENT"
                  title="Buy vs rent"
                  caption={`${analytics.total} enquiries`}
                />

                <DonutChart
                  centerValue={
                    analytics.total
                  }
                  centerLabel="Leads"
                  items={[
                    {
                      label:
                        "Buy",
                      value:
                        getAnalyticsValue(
                          analytics.intentData,
                          "Buy"
                        ),
                      color:
                        "#78C6A6",
                    },
                    {
                      label:
                        "Rent",
                      value:
                        getAnalyticsValue(
                          analytics.intentData,
                          "Rent"
                        ),
                      color:
                        "#D8C6A6",
                    },
                    {
                      label:
                        "Other",
                      value:
                        getAnalyticsValue(
                          analytics.intentData,
                          "Other"
                        ),
                      color:
                        "rgba(255,255,255,.16)",
                    },
                  ]}
                />
              </div>

              <div
                className="analyticsCard"
              >
                <AnalyticsCardHeader
                  eyebrow="DEMAND MAP"
                  title="Top locations"
                  caption="Most requested areas"
                />

                <AnalyticsBarList
                  data={
                    analytics.topLocations
                  }
                  emptyText="Location data will appear here as leads grow."
                />
              </div>
            </div>
          </section>

          {/* =================================================
              OPERATIONAL TOOLBAR
              ================================================= */}

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

          {/* =================================================
              OPERATIONAL LEAD FEED
              ================================================= */}

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
                    <span>
                      Showing{" "}
                      {
                        filteredLeads.length
                      }{" "}
                      of{" "}
                      {
                        leads.length
                      }{" "}
                      leads
                    </span>

                    <span>
                      Click any row to preview ·
                      Open for full conversation
                    </span>
                  </div>
                )}
            </section>

            {/* ===============================================
                SELECTED LEAD INTELLIGENCE
                =============================================== */}

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
                        NOMAD INTELLIGENCE
                      </span>

                      <h2>
                        Opportunity quality
                      </h2>
                    </div>

                    <StatusBadge
                      status={
                        normalizeStatus(
                          selectedLead.lead_status
                        )
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
                        Lead summary
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
                      Assigned to
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
                      {ASSIGNMENT_OPTIONS.map(
                        (
                          person
                        ) => (
                          <option
                            key={
                              person ||
                              "unassigned"
                            }
                            value={
                              person
                            }
                          >
                            {person ||
                              "Unassigned"}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className="intelligenceControlGroup"
                  >
                    <label>
                      Lead status
                    </label>

                    <select
                      value={
                        normalizeStatus(
                          selectedLead.lead_status
                        )
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
                    Open full lead

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

/* =========================================================
   SIDEBAR
   ========================================================= */

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

/* =========================================================
   TOP STATS
   ========================================================= */

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

/* =========================================================
   ANALYTICS COMPONENTS
   ========================================================= */

function AnalyticsKpi({
  label,
  value,
  detail,
}) {
  return (
    <div
      className="analyticsKpi"
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

function AnalyticsCardHeader({
  eyebrow,
  title,
  caption,
}) {
  return (
    <div
      className="analyticsCardHeader"
    >
      <div>
        <span>
          {eyebrow}
        </span>

        <h3>
          {title}
        </h3>
      </div>

      {caption && (
        <small>
          {caption}
        </small>
      )}
    </div>
  );
}

function AnalyticsBarList({
  data,
  emptyText,
}) {
  const usable =
    Array.isArray(
      data
    )
      ? data.filter(
          (item) =>
            item.value >
            0
        )
      : [];

  if (
    usable.length ===
    0
  ) {
    return (
      <div
        className="analyticsEmpty"
      >
        {emptyText}
      </div>
    );
  }

  const max =
    Math.max(
      ...usable.map(
        (item) =>
          item.value
      ),
      1
    );

  return (
    <div
      className="analyticsBars"
    >
      {usable.map(
        (
          item
        ) => (
          <div
            className="analyticsBarRow"
            key={
              item.label
            }
          >
            <div
              className="analyticsBarMeta"
            >
              <span>
                {
                  item.label
                }
              </span>

              <strong>
                {
                  item.value
                }
              </strong>
            </div>

            <div
              className="analyticsBarTrack"
            >
              <div
                className="analyticsBarFill"
                style={{
                  width:
                    `${Math.max(
                      7,
                      Math.round(
                        (
                          item.value /
                          max
                        ) *
                          100
                      )
                    )}%`,
                }}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}

function DonutChart({
  centerValue,
  centerLabel,
  items,
}) {
  const usable =
    items.filter(
      (item) =>
        item.value >
        0
    );

  const total =
    usable.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.value,
      0
    );

  let current =
    0;

  const segments =
    usable.map(
      (
        item
      ) => {
        const start =
          total >
          0
            ? (
                current /
                total
              ) *
              360
            : 0;

        current +=
          item.value;

        const end =
          total >
          0
            ? (
                current /
                total
              ) *
              360
            : 0;

        return `${item.color} ${start}deg ${end}deg`;
      }
    );

  const background =
    total > 0
      ? `conic-gradient(${segments.join(
          ", "
        )})`
      : "rgba(255,255,255,.06)";

  return (
    <div
      className="donutLayout"
    >
      <div
        className="donutChart"
        style={{
          background,
        }}
      >
        <div
          className="donutInner"
        >
          <strong>
            {centerValue}
          </strong>

          <span>
            {centerLabel}
          </span>
        </div>
      </div>

      <div
        className="donutLegend"
      >
        {items.map(
          (
            item
          ) => (
            <div
              className="donutLegendRow"
              key={
                item.label
              }
            >
              <div>
                <span
                  className="donutLegendDot"
                  style={{
                    background:
                      item.color,
                  }}
                />

                <span>
                  {
                    item.label
                  }
                </span>
              </div>

              <strong>
                {
                  item.value
                }
              </strong>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TrendChart({
  data,
}) {
  if (
    !Array.isArray(
      data
    ) ||
    data.length ===
      0
  ) {
    return (
      <div
        className="analyticsEmpty analyticsTrendEmpty"
      >
        Lead trend will appear as new
        enquiries are captured.
      </div>
    );
  }

  const width =
    640;

  const height =
    220;

  const padX =
    28;

  const padTop =
    22;

  const padBottom =
    40;

  const chartHeight =
    height -
    padTop -
    padBottom;

  const maxValue =
    Math.max(
      ...data.map(
        (item) =>
          item.value
      ),
      1
    );

  const stepX =
    data.length >
    1
      ? (
          width -
          padX *
            2
        ) /
        (
          data.length -
          1
        )
      : 0;

  const points =
    data.map(
      (
        item,
        index
      ) => {
        const x =
          padX +
          index *
            stepX;

        const y =
          padTop +
          chartHeight -
          (
            item.value /
            maxValue
          ) *
            chartHeight;

        return {
          x,
          y,
          ...item,
        };
      }
    );

  const linePoints =
    points
      .map(
        (
          point
        ) =>
          `${point.x},${point.y}`
      )
      .join(
        " "
      );

  const areaPoints =
    [
      `${points[0].x},${height - padBottom}`,
      ...points.map(
        (
          point
        ) =>
          `${point.x},${point.y}`
      ),
      `${points[points.length - 1].x},${height - padBottom}`,
    ].join(
      " "
    );

  return (
    <div
      className="trendChartWrap"
    >
      <svg
        className="trendChart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
      >
        <defs>
          <linearGradient
            id="nomadTrendArea"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#D8C6A6"
              stopOpacity=".22"
            />

            <stop
              offset="100%"
              stopColor="#D8C6A6"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map(
          (
            step
          ) => {
            const y =
              padTop +
              chartHeight -
              chartHeight *
                step;

            return (
              <line
                key={
                  step
                }
                x1={
                  padX
                }
                x2={
                  width -
                  padX
                }
                y1={
                  y
                }
                y2={
                  y
                }
                stroke="rgba(255,255,255,.06)"
                strokeWidth="1"
              />
            );
          }
        )}

        <polygon
          points={
            areaPoints
          }
          fill="url(#nomadTrendArea)"
        />

        <polyline
          points={
            linePoints
          }
          fill="none"
          stroke="#D8C6A6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map(
          (
            point,
            index
          ) => (
            <g
              key={`${point.label}-${index}`}
            >
              <circle
                cx={
                  point.x
                }
                cy={
                  point.y
                }
                r="5"
                fill="#0D352D"
                stroke="#D8C6A6"
                strokeWidth="3"
              />

              <text
                x={
                  point.x
                }
                y={
                  Math.max(
                    14,
                    point.y -
                      11
                  )
                }
                textAnchor="middle"
                fill="rgba(255,255,255,.82)"
                fontSize="11"
                fontWeight="700"
              >
                {
                  point.value
                }
              </text>

              <text
                x={
                  point.x
                }
                y={
                  height -
                  13
                }
                textAnchor="middle"
                fill="rgba(255,255,255,.38)"
                fontSize="10"
              >
                {
                  point.label
                }
              </text>
            </g>
          )
        )}
      </svg>
    </div>
  );
}

/* =========================================================
   LEAD ROW
   ========================================================= */

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
  const normalizedStatus =
    normalizeStatus(
      lead.lead_status
    );

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
          {ASSIGNMENT_OPTIONS.map(
            (
              person
            ) => (
              <option
                key={
                  person ||
                  "unassigned"
                }
                value={
                  person
                }
              >
                {person ||
                  "Unassigned"}
              </option>
            )
          )}
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
            normalizedStatus
          }
        />

        <select
          value={
            normalizedStatus
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

/* =========================================================
   STATUS
   ========================================================= */

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

/* =========================================================
   QUALITY
   ========================================================= */

function QualityRing({
  score,
}) {
  const degrees =
    Math.round(
      (
        score /
        100
      ) *
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

/* =========================================================
   EMPTY / LOADING
   ========================================================= */

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
        Loading sales intelligence
      </strong>

      <p>
        Retrieving live NOMAD
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
        No opportunity selected
      </strong>

      <p>
        Select a lead from the opportunity
        feed to view NOMAD intelligence.
      </p>
    </div>
  );
}

/* =========================================================
   DATA HELPERS
   ========================================================= */

function normalizeStatus(
  status
) {
  if (
    !status ||
    status ===
      "Assigned"
  ) {
    return "Qualified";
  }

  if (
    STATUS_OPTIONS.includes(
      status
    )
  ) {
    return status;
  }

  return "Qualified";
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
      .slice(
        0,
        2
      )
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

  const parts =
    [
      bedrooms,
      type,
    ].filter(
      Boolean
    );

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
      (
        letter
      ) =>
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
      normalizeStatus(
        lead.lead_status
      ) ===
      filter
  ).length;
}

function calculateLeadQuality(
  lead
) {
  if (!lead) {
    return 0;
  }

  const fields =
    [
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
    (
      completed /
      fields.length
    ) *
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

  const status =
    normalizeStatus(
      lead.lead_status
    );

  if (
    status ===
    "Won"
  ) {
    return `Opportunity is marked as won and assigned to ${lead.assigned_to}.`;
  }

  if (
    status ===
    "Lost"
  ) {
    return "Opportunity is marked as lost. Review the conversation and sales notes if further context is required.";
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
    normalizeStatus(
      status
    )
  ) {
    case "Qualified":
      return "statusDotQualified";

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
    normalizeStatus(
      status
    )
  ) {
    case "Won":
      return "statusBadgeWon";

    case "Lost":
      return "statusBadgeLost";

    case "Follow-up":
      return "statusBadgeFollow";

    case "Contacted":
      return "statusBadgeContacted";

    default:
      return "statusBadgeQualified";
  }
}

/* =========================================================
   ANALYTICS HELPERS
   ========================================================= */

function filterLeadsByPeriod(
  leads,
  period
) {
  if (
    period ===
    "all"
  ) {
    return leads;
  }

  const days =
    Number(
      period
    );

  if (
    !Number.isFinite(
      days
    )
  ) {
    return leads;
  }

  const cutoff =
    new Date();

  cutoff.setHours(
    0,
    0,
    0,
    0
  );

  cutoff.setDate(
    cutoff.getDate() -
      (
        days -
        1
      )
  );

  return leads.filter(
    (lead) => {
      if (
        !lead.created_at
      ) {
        return false;
      }

      const created =
        new Date(
          lead.created_at
        );

      if (
        Number.isNaN(
          created.getTime()
        )
      ) {
        return false;
      }

      return (
        created >=
        cutoff
      );
    }
  );
}

function getAnalyticsPeriodLabel(
  period
) {
  if (
    period ===
    "all"
  ) {
    return "All-time performance";
  }

  return `Last ${period} days`;
}

function cleanLocation(
  value
) {
  if (!value) {
    return "";
  }

  return String(
    value
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function getAnalyticsValue(
  data,
  label
) {
  return (
    data.find(
      (item) =>
        item.label ===
        label
    )?.value ||
    0
  );
}

function buildLeadTrend(
  leads,
  period
) {
  if (
    period ===
    "7"
  ) {
    return buildDayBuckets(
      leads,
      7,
      1
    );
  }

  if (
    period ===
    "30"
  ) {
    return buildDayBuckets(
      leads,
      30,
      5
    );
  }

  if (
    period ===
    "90"
  ) {
    return buildDayBuckets(
      leads,
      90,
      15
    );
  }

  return buildMonthBuckets(
    leads
  );
}

function buildDayBuckets(
  leads,
  totalDays,
  bucketDays
) {
  const now =
    new Date();

  now.setHours(
    23,
    59,
    59,
    999
  );

  const bucketCount =
    Math.ceil(
      totalDays /
        bucketDays
    );

  const buckets =
    [];

  for (
    let i =
      bucketCount -
      1;
    i >= 0;
    i -= 1
  ) {
    const end =
      new Date(
        now
      );

    end.setDate(
      end.getDate() -
        i *
          bucketDays
    );

    const start =
      new Date(
        end
      );

    start.setDate(
      start.getDate() -
        (
          bucketDays -
          1
        )
    );

    start.setHours(
      0,
      0,
      0,
      0
    );

    end.setHours(
      23,
      59,
      59,
      999
    );

    const value =
      leads.filter(
        (lead) => {
          if (
            !lead.created_at
          ) {
            return false;
          }

          const date =
            new Date(
              lead.created_at
            );

          return (
            !Number.isNaN(
              date.getTime()
            ) &&
            date >=
              start &&
            date <=
              end
          );
        }
      ).length;

    buckets.push({
      label:
        bucketDays ===
        1
          ? formatShortDate(
              end
            )
          : `${formatShortDate(
              start
            )}`,

      value,
    });
  }

  return buckets;
}

function buildMonthBuckets(
  leads
) {
  const validDates =
    leads
      .map(
        (lead) =>
          lead.created_at
            ? new Date(
                lead.created_at
              )
            : null
      )
      .filter(
        (date) =>
          date &&
          !Number.isNaN(
            date.getTime()
          )
      );

  if (
    validDates.length ===
    0
  ) {
    return [];
  }

  let earliest =
    new Date(
      Math.min(
        ...validDates.map(
          (date) =>
            date.getTime()
        )
      )
    );

  const latest =
    new Date();

  earliest =
    new Date(
      earliest.getFullYear(),
      earliest.getMonth(),
      1
    );

  const months =
    [];

  let cursor =
    new Date(
      earliest
    );

  while (
    cursor <=
      latest &&
    months.length <
      24
  ) {
    const monthStart =
      new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        1
      );

    const monthEnd =
      new Date(
        cursor.getFullYear(),
        cursor.getMonth() +
          1,
        0,
        23,
        59,
        59,
        999
      );

    const value =
      leads.filter(
        (lead) => {
          if (
            !lead.created_at
          ) {
            return false;
          }

          const date =
            new Date(
              lead.created_at
            );

          return (
            !Number.isNaN(
              date.getTime()
            ) &&
            date >=
              monthStart &&
            date <=
              monthEnd
          );
        }
      ).length;

    months.push({
      label:
        monthStart.toLocaleDateString(
          "en-AE",
          {
            month:
              "short",
          }
        ),

      value,
    });

    cursor.setMonth(
      cursor.getMonth() +
        1
    );
  }

  if (
    months.length >
    12
  ) {
    return months.slice(
      -12
    );
  }

  return months;
}

function formatShortDate(
  date
) {
  return date.toLocaleDateString(
    "en-AE",
    {
      day:
        "numeric",

      month:
        "short",
    }
  );
}

/* =========================================================
   FINAL CSS
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
        background: rgba(216,198,166,.25);
      }

      ::-webkit-scrollbar {
        width: 9px;
        height: 9px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(255,255,255,.02);
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(216,198,166,.18);
        border-radius: 999px;
      }

      .dashboardPage {
        min-height: 100vh;
        background:
          radial-gradient(
            circle at 82% 4%,
            rgba(12,120,101,.11),
            transparent 28%
          ),
          radial-gradient(
            circle at 10% 65%,
            rgba(216,198,166,.03),
            transparent 25%
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
        grid-template-columns:
          232px
          minmax(0,1fr);
      }

      /* =====================================================
         SIDEBAR
         ===================================================== */

      .dashboardSidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 28px 21px;
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
        gap: 11px;
      }

      .sidebarBrandIcon {
        width: 39px;
        height: 39px;
        border-radius: 50%;
        background:
          linear-gradient(
            145deg,
            #1B5D4E,
            #123F35
          );
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 850;
        border: 1px solid rgba(216,198,166,.16);
        box-shadow: 0 12px 30px rgba(0,0,0,.15);
      }

      .sidebarBrand strong {
        display: block;
        color: white;
        font-size: 16px;
        letter-spacing: .5px;
      }

      .sidebarBrand span {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,.46);
        font-size: 11px;
        letter-spacing: .5px;
      }

      .sidebarSectionLabel {
        margin: 40px 10px 12px;
        color: rgba(255,255,255,.34);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.25px;
        text-transform: uppercase;
      }

      .sidebarSecondLabel {
        margin-top: 36px;
      }

      .sidebarMenu {
        display: grid;
        gap: 6px;
      }

      .sidebarMenuItem {
        width: 100%;
        min-height: 46px;
        padding: 0 12px;
        border: none;
        border-radius: 11px;
        background: transparent;
        color: rgba(255,255,255,.56);
        display: grid;
        grid-template-columns:
          20px
          1fr
          auto;
        gap: 10px;
        align-items: center;
        text-align: left;
        cursor: pointer;
        transition:
          background .2s ease,
          color .2s ease,
          transform .2s ease;
      }

      .sidebarMenuItem:hover {
        color: rgba(255,255,255,.88);
        background: rgba(255,255,255,.04);
        transform: translateX(2px);
      }

      .sidebarMenuItemActive {
        color: white;
        background:
          linear-gradient(
            90deg,
            rgba(216,198,166,.09),
            rgba(255,255,255,.04)
          );
        box-shadow:
          inset 2px 0 0 rgba(216,198,166,.45);
      }

      .sidebarMenuIcon {
        color: #D8C6A6;
        text-align: center;
        font-size: 13px;
      }

      .sidebarMenuLabel {
        font-size: 12px;
        font-weight: 650;
      }

      .sidebarMenuCount {
        min-width: 25px;
        padding: 4px 7px;
        border-radius: 999px;
        background: rgba(255,255,255,.05);
        color: rgba(255,255,255,.52);
        text-align: center;
        font-size: 10px;
      }

      .sidebarMenuItemActive .sidebarMenuCount {
        color: #D8C6A6;
        background: rgba(216,198,166,.10);
      }

      .sidebarMiniStats {
        display: grid;
        grid-template-columns:
          1fr
          1fr;
        gap: 8px;
      }

      .sidebarMiniStat {
        padding: 13px;
        border-radius: 11px;
        border: 1px solid rgba(255,255,255,.055);
        background: rgba(255,255,255,.03);
      }

      .sidebarMiniStat span {
        display: block;
        color: rgba(255,255,255,.42);
        font-size: 10px;
      }

      .sidebarMiniStat strong {
        display: block;
        margin-top: 7px;
        color: white;
        font-size: 20px;
        font-weight: 620;
      }

      .sidebarSystem {
        padding: 14px;
        border-radius: 13px;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.055);
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .systemPulse {
        width: 8px;
        height: 8px;
        flex-shrink: 0;
        border-radius: 50%;
        background: #78C6A6;
        box-shadow: 0 0 0 5px rgba(120,198,166,.07);
        animation: systemPulse 2s ease-in-out infinite;
      }

      @keyframes systemPulse {
        0%,
        100% {
          transform: scale(1);
          opacity: .75;
        }

        50% {
          transform: scale(1.22);
          opacity: 1;
        }
      }

      .sidebarSystem strong {
        display: block;
        color: white;
        font-size: 11px;
      }

      .sidebarSystem span {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,.43);
        font-size: 9px;
      }

      /* =====================================================
         MAIN
         ===================================================== */

      .dashboardMain {
        min-width: 0;
        padding: 32px;
        background:
          linear-gradient(
            145deg,
            #0A2E27,
            #082B24
          );
      }

      /* =====================================================
         HEADER
         ===================================================== */

      .dashboardHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
      }

      .headerIdentity {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .headerEyebrow {
        color: rgba(255,255,255,.46);
        font-size: 11px;
        font-weight: 750;
        letter-spacing: 1.25px;
      }

      .dashboardHeader h1 {
        margin: 7px 0 0;
        color: white;
        font-size: 32px;
        line-height: 1;
        letter-spacing: -1px;
        font-weight: 620;
      }

      .headerActions {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .headerLive {
        height: 39px;
        padding: 0 13px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.03);
        color: rgba(255,255,255,.64);
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 11px;
      }

      .headerLive span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #78C6A6;
      }

      .exportButton,
      .refreshButton {
        height: 39px;
        padding: 0 14px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 700;
        transition:
          background .2s ease,
          border .2s ease,
          transform .2s ease;
      }

      .exportButton {
        border: 1px solid rgba(216,198,166,.18);
        background: rgba(216,198,166,.09);
        color: #D8C6A6;
      }

      .exportButton:hover:not(:disabled) {
        background: rgba(216,198,166,.14);
        border-color: rgba(216,198,166,.27);
        transform: translateY(-1px);
      }

      .refreshButton {
        border: 1px solid rgba(255,255,255,.07);
        background: rgba(255,255,255,.04);
        color: rgba(255,255,255,.76);
      }

      .refreshButton:hover:not(:disabled) {
        background: rgba(255,255,255,.07);
      }

      .exportButton:disabled,
      .refreshButton:disabled {
        cursor: not-allowed;
        opacity: .4;
      }

      .exportIcon {
        font-size: 15px;
        line-height: 1;
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
        width: 39px;
        height: 39px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.07);
        background: rgba(255,255,255,.04);
        color: white;
        cursor: pointer;
      }

      /* =====================================================
         TOP KPI CARDS
         ===================================================== */

      .statsGrid {
        margin-top: 28px;
        display: grid;
        grid-template-columns:
          repeat(
            4,
            minmax(0,1fr)
          );
        gap: 11px;
      }

      .dashboardStat {
        min-height: 122px;
        padding: 20px;
        border-radius: 15px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.04);
        position: relative;
        overflow: hidden;
        transition:
          transform .25s ease,
          background .25s ease,
          border .25s ease;
      }

      .dashboardStat:hover {
        transform: translateY(-2px);
        background: rgba(255,255,255,.052);
        border-color: rgba(255,255,255,.085);
      }

      .dashboardStatAccent::after {
        content: "";
        position: absolute;
        width: 125px;
        height: 125px;
        border-radius: 50%;
        right: -62px;
        top: -62px;
        border: 1px solid rgba(216,198,166,.10);
      }

      .dashboardStat > span {
        color: rgba(255,255,255,.47);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .8px;
      }

      .dashboardStat strong {
        display: block;
        margin-top: 10px;
        color: white;
        font-size: 32px;
        line-height: 1;
        font-weight: 620;
      }

      .dashboardStat small {
        display: block;
        margin-top: 10px;
        color: #78C6A6;
        font-size: 11px;
      }

      /* =====================================================
         ANALYTICS
         ===================================================== */

      .analyticsSection {
        margin-top: 22px;
        padding: 22px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,.06);
        background:
          linear-gradient(
            145deg,
            rgba(255,255,255,.042),
            rgba(255,255,255,.022)
          );
        box-shadow:
          0 24px 70px rgba(0,0,0,.08);
      }

      .analyticsHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 30px;
      }

      .sectionEyebrow {
        display: block;
        color: #D8C6A6;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.15px;
      }

      .analyticsHeader h2 {
        margin: 7px 0 0;
        color: white;
        font-size: 22px;
        font-weight: 650;
        letter-spacing: -.35px;
      }

      .analyticsHeader p {
        margin: 7px 0 0;
        color: rgba(255,255,255,.44);
        font-size: 12px;
        line-height: 1.55;
      }

      .analyticsPeriodSelector {
        display: flex;
        align-items: center;
        padding: 4px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.025);
      }

      .analyticsPeriodButton {
        min-height: 34px;
        padding: 0 12px;
        border: none;
        border-radius: 9px;
        background: transparent;
        color: rgba(255,255,255,.46);
        cursor: pointer;
        font-size: 10px;
        font-weight: 650;
        white-space: nowrap;
        transition:
          color .2s ease,
          background .2s ease;
      }

      .analyticsPeriodButton:hover {
        color: rgba(255,255,255,.78);
      }

      .analyticsPeriodButtonActive {
        background: rgba(216,198,166,.11);
        color: #D8C6A6;
      }

      .analyticsKpiGrid {
        margin-top: 20px;
        display: grid;
        grid-template-columns:
          repeat(
            4,
            minmax(0,1fr)
          );
        gap: 10px;
      }

      .analyticsKpi {
        min-height: 102px;
        padding: 16px;
        border-radius: 13px;
        background: rgba(3,24,20,.25);
        border: 1px solid rgba(255,255,255,.05);
      }

      .analyticsKpi > span {
        display: block;
        color: rgba(255,255,255,.43);
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: .7px;
      }

      .analyticsKpi strong {
        display: block;
        margin-top: 9px;
        color: white;
        font-size: 25px;
        line-height: 1;
        font-weight: 620;
      }

      .analyticsKpi small {
        display: block;
        margin-top: 9px;
        color: rgba(255,255,255,.42);
        font-size: 10px;
        line-height: 1.35;
      }

      .analyticsGrid {
        margin-top: 11px;
        display: grid;
        grid-template-columns:
          repeat(
            3,
            minmax(0,1fr)
          );
        gap: 11px;
      }

      .analyticsCard {
        min-width: 0;
        min-height: 285px;
        padding: 18px;
        border-radius: 14px;
        background: rgba(5,29,24,.30);
        border: 1px solid rgba(255,255,255,.05);
        overflow: hidden;
      }

      .analyticsTrendCard {
        grid-column:
          span 2;
      }

      .analyticsCardHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 15px;
      }

      .analyticsCardHeader > div > span {
        display: block;
        color: rgba(216,198,166,.82);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: .95px;
      }

      .analyticsCardHeader h3 {
        margin: 6px 0 0;
        color: white;
        font-size: 16px;
        font-weight: 650;
      }

      .analyticsCardHeader > small {
        color: rgba(255,255,255,.35);
        font-size: 9px;
        text-align: right;
      }

      .analyticsEmpty {
        min-height: 190px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: rgba(255,255,255,.34);
        font-size: 11px;
        line-height: 1.6;
      }

      .analyticsTrendEmpty {
        min-height: 210px;
      }

      /* ANALYTICS BARS */

      .analyticsBars {
        margin-top: 20px;
        display: grid;
        gap: 16px;
      }

      .analyticsBarRow {
        min-width: 0;
      }

      .analyticsBarMeta {
        margin-bottom: 7px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .analyticsBarMeta span {
        color: rgba(255,255,255,.60);
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .analyticsBarMeta strong {
        color: rgba(255,255,255,.88);
        font-size: 11px;
        font-weight: 700;
      }

      .analyticsBarTrack {
        width: 100%;
        height: 7px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,.06);
      }

      .analyticsBarFill {
        height: 100%;
        border-radius: 999px;
        background:
          linear-gradient(
            90deg,
            #B99862,
            #D8C6A6
          );
        box-shadow:
          0 0 18px rgba(216,198,166,.08);
      }

      /* DONUT */

      .donutLayout {
        margin-top: 22px;
        display: grid;
        grid-template-columns:
          145px
          minmax(0,1fr);
        align-items: center;
        gap: 22px;
      }

      .donutChart {
        width: 145px;
        height: 145px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .donutInner {
        width: 108px;
        height: 108px;
        border-radius: 50%;
        background: #0B3028;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,.025);
      }

      .donutInner strong {
        color: white;
        font-size: 27px;
        font-weight: 620;
      }

      .donutInner span {
        margin-top: 4px;
        color: rgba(255,255,255,.38);
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .6px;
      }

      .donutLegend {
        display: grid;
        gap: 10px;
      }

      .donutLegendRow {
        min-height: 31px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid rgba(255,255,255,.045);
      }

      .donutLegendRow > div {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .donutLegendDot {
        width: 7px;
        height: 7px;
        flex-shrink: 0;
        border-radius: 50%;
      }

      .donutLegendRow span {
        color: rgba(255,255,255,.55);
        font-size: 10px;
      }

      .donutLegendRow strong {
        color: rgba(255,255,255,.84);
        font-size: 11px;
      }

      /* TREND */

      .trendChartWrap {
        width: 100%;
        margin-top: 12px;
        overflow: hidden;
      }

      .trendChart {
        display: block;
        width: 100%;
        height: 220px;
      }

      /* =====================================================
         TOOLBAR
         ===================================================== */

      .dashboardToolbar {
        margin-top: 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .filterRail {
        display: flex;
        align-items: center;
        gap: 7px;
        overflow-x: auto;
        padding-bottom: 3px;
      }

      .filterButton {
        flex-shrink: 0;
        min-height: 38px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.025);
        color: rgba(255,255,255,.56);
        cursor: pointer;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition:
          background .2s ease,
          color .2s ease,
          border .2s ease;
      }

      .filterButton span {
        min-width: 21px;
        padding: 3px 6px;
        border-radius: 999px;
        background: rgba(255,255,255,.05);
        font-size: 9px;
      }

      .filterButton:hover {
        color: rgba(255,255,255,.86);
      }

      .filterButtonActive {
        border-color: rgba(216,198,166,.22);
        background: rgba(216,198,166,.10);
        color: #D8C6A6;
      }

      .searchBox {
        width: 300px;
        min-height: 42px;
        flex-shrink: 0;
        padding: 0 13px;
        border-radius: 11px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.035);
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .searchBox > span {
        color: rgba(255,255,255,.38);
        font-size: 15px;
      }

      .searchBox input {
        min-width: 0;
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        color: white;
        font-size: 12px;
      }

      .searchBox input::placeholder {
        color: rgba(255,255,255,.32);
      }

      .searchBox button {
        border: none;
        background: transparent;
        color: rgba(255,255,255,.45);
        cursor: pointer;
        font-size: 17px;
      }

      /* =====================================================
         FEED + INTELLIGENCE
         ===================================================== */

      .dashboardContentGrid {
        margin-top: 18px;
        display: grid;
        grid-template-columns:
          minmax(0,1.65fr)
          minmax(270px,.62fr);
        gap: 14px;
        align-items: start;
      }

      .opportunityPanel,
      .intelligencePanel {
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.037);
      }

      .opportunityPanel {
        min-width: 0;
        padding: 20px;
      }

      .panelTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
      }

      .panelEyebrow {
        display: block;
        color: rgba(255,255,255,.43);
        font-size: 10px;
        font-weight: 750;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .panelTop h2,
      .intelligenceTop h2 {
        margin: 6px 0 0;
        color: white;
        font-size: 18px;
        font-weight: 650;
      }

      .liveChip {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 10px;
        border-radius: 999px;
        color: #78C6A6;
        background: rgba(120,198,166,.08);
        font-size: 10px;
      }

      .liveChip span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #78C6A6;
      }

      .leadHeaderRow {
        margin-top: 19px;
        min-height: 36px;
        display: grid;
        grid-template-columns:
          minmax(220px,1.55fr)
          minmax(100px,.7fr)
          minmax(120px,.8fr)
          minmax(120px,.75fr)
          34px;
        gap: 10px;
        align-items: center;
        padding: 0 9px;
        color: rgba(255,255,255,.35);
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .8px;
        border-bottom: 1px solid rgba(255,255,255,.05);
      }

      .leadRows {
        min-width: 0;
      }

      .realLeadRow {
        min-height: 84px;
        display: grid;
        grid-template-columns:
          minmax(220px,1.55fr)
          minmax(100px,.7fr)
          minmax(120px,.8fr)
          minmax(120px,.75fr)
          34px;
        gap: 10px;
        align-items: center;
        padding: 11px 9px;
        border-bottom: 1px solid rgba(255,255,255,.05);
        cursor: pointer;
        border-radius: 10px;
        transition:
          background .22s ease,
          transform .22s ease;
      }

      .realLeadRowHovered {
        background: rgba(255,255,255,.04);
        transform: translateX(2px);
      }

      .realLeadRowSelected {
        background:
          linear-gradient(
            90deg,
            rgba(216,198,166,.085),
            rgba(255,255,255,.025)
          );
        box-shadow:
          inset 2px 0 0 rgba(216,198,166,.60);
      }

      .leadPrimary {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .leadAvatar {
        width: 39px;
        height: 39px;
        flex-shrink: 0;
        border-radius: 50%;
        background: rgba(216,198,166,.11);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 850;
        border: 1px solid rgba(216,198,166,.09);
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
        font-size: 13px;
      }

      .leadIdentity span {
        display: block;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: rgba(255,255,255,.51);
        font-size: 11px;
      }

      .leadIdentity small {
        display: block;
        margin-top: 4px;
        color: rgba(255,255,255,.36);
        font-size: 10px;
      }

      .leadBudget strong {
        display: block;
        color: rgba(255,255,255,.85);
        font-size: 12px;
        font-weight: 700;
      }

      .leadBudget span {
        display: block;
        margin-top: 4px;
        color: rgba(255,255,255,.43);
        font-size: 10px;
      }

      .leadControlCell {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .leadControlCell select {
        min-width: 0;
        width: 100%;
        border: none;
        outline: none;
        padding: 8px 7px;
        border-radius: 8px;
        background: rgba(255,255,255,.045);
        color: rgba(255,255,255,.80);
        cursor: pointer;
        font-size: 11px;
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
        width: 6px;
        height: 6px;
        flex-shrink: 0;
        border-radius: 50%;
      }

      .assignmentDot {
        background: rgba(255,255,255,.18);
      }

      .assignmentDotActive {
        background: #D8C6A6;
        box-shadow: 0 0 0 4px rgba(216,198,166,.055);
      }

      .leadOpenButton {
        width: 32px;
        height: 32px;
        border-radius: 9px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.028);
        color: rgba(255,255,255,.50);
        cursor: pointer;
        font-size: 12px;
        transition:
          background .2s ease,
          color .2s ease;
      }

      .leadOpenButton:hover {
        background: rgba(216,198,166,.09);
        color: #D8C6A6;
      }

      .tableFooter {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,.05);
        color: rgba(255,255,255,.41);
        font-size: 10px;
        display: flex;
        justify-content: space-between;
        gap: 20px;
      }

      /* STATUS COLORS */

      .statusDotQualified {
        background: #75D0AC;
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

      /* =====================================================
         INTELLIGENCE PANEL
         ===================================================== */

      .intelligencePanel {
        position: sticky;
        top: 30px;
        padding: 22px;
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
        max-width: 125px;
        padding: 7px 10px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 750;
        white-space: nowrap;
      }

      .statusBadge span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .statusBadgeQualified {
        background: rgba(117,208,172,.09);
        color: #75D0AC;
      }

      .statusBadgeQualified span {
        background: #75D0AC;
      }

      .statusBadgeContacted {
        background: rgba(140,180,216,.09);
        color: #8CB4D8;
      }

      .statusBadgeContacted span {
        background: #8CB4D8;
      }

      .statusBadgeFollow {
        background: rgba(225,167,113,.09);
        color: #E1A771;
      }

      .statusBadgeFollow span {
        background: #E1A771;
      }

      .statusBadgeWon {
        background: rgba(102,206,144,.09);
        color: #66CE90;
      }

      .statusBadgeWon span {
        background: #66CE90;
      }

      .statusBadgeLost {
        background: rgba(217,131,131,.09);
        color: #D98383;
      }

      .statusBadgeLost span {
        background: #D98383;
      }

      .qualityRing {
        margin: 27px auto 23px;
        width: 155px;
        height: 155px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
          0 0 45px rgba(216,198,166,.04);
      }

      .qualityRingInner {
        width: 124px;
        height: 124px;
        border-radius: 50%;
        background: #0D352D;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .qualityRingInner strong {
        color: white;
        font-size: 35px;
        font-weight: 620;
      }

      .qualityRingInner span {
        margin-top: 4px;
        color: rgba(255,255,255,.42);
        font-size: 9px;
        letter-spacing: .75px;
      }

      .selectedLeadIdentity {
        display: flex;
        align-items: center;
        gap: 11px;
        padding-bottom: 17px;
        border-bottom: 1px solid rgba(255,255,255,.05);
      }

      .selectedLeadAvatar {
        width: 41px;
        height: 41px;
        border-radius: 50%;
        background: rgba(216,198,166,.11);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 850;
      }

      .selectedLeadIdentity strong {
        display: block;
        color: white;
        font-size: 13px;
      }

      .selectedLeadIdentity span {
        display: block;
        margin-top: 4px;
        color: rgba(255,255,255,.48);
        font-size: 11px;
      }

      .qualityDetails {
        margin-top: 6px;
      }

      .qualityLine {
        min-height: 43px;
        border-bottom: 1px solid rgba(255,255,255,.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .qualityLine > span {
        color: rgba(255,255,255,.47);
        font-size: 11px;
      }

      .qualityLine strong {
        font-size: 11px;
      }

      .qualityGood {
        color: rgba(255,255,255,.82);
      }

      .qualityMissing {
        color: #D98383;
      }

      .intelligenceSummary {
        margin-top: 17px;
        padding: 14px;
        border-radius: 12px;
        background: rgba(255,255,255,.038);
        border: 1px solid rgba(255,255,255,.055);
      }

      .intelligenceSummary span {
        color: #D8C6A6;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .9px;
        font-weight: 750;
      }

      .intelligenceSummary p {
        margin: 8px 0 0;
        color: rgba(255,255,255,.62);
        font-size: 11px;
        line-height: 1.65;
      }

      .intelligenceControlGroup {
        margin-top: 15px;
      }

      .intelligenceControlGroup label {
        display: block;
        margin-bottom: 7px;
        color: rgba(255,255,255,.42);
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .75px;
      }

      .intelligenceControlGroup select {
        width: 100%;
        min-height: 42px;
        padding: 0 11px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.06);
        outline: none;
        background: rgba(255,255,255,.045);
        color: rgba(255,255,255,.82);
        cursor: pointer;
        font-size: 11px;
      }

      .intelligenceControlGroup select option {
        color: #101814;
        background: white;
      }

      .qualityRecommendation {
        margin-top: 17px;
        padding: 14px;
        border-radius: 12px;
        background: rgba(216,198,166,.075);
        border: 1px solid rgba(216,198,166,.09);
        color: rgba(255,255,255,.60);
        font-size: 11px;
        line-height: 1.65;
      }

      .qualityRecommendation > span {
        display: block;
        margin-bottom: 5px;
        color: #D8C6A6;
        font-size: 9px;
        font-weight: 850;
        letter-spacing: .8px;
      }

      .openLeadButton {
        width: 100%;
        min-height: 44px;
        margin-top: 15px;
        border: none;
        border-radius: 11px;
        background: #D8C6A6;
        color: #082F27;
        cursor: pointer;
        font-size: 11px;
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

      /* =====================================================
         LOADING / EMPTY
         ===================================================== */

      .loadingState,
      .emptyState,
      .noSelectedLead {
        min-height: 340px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .loadingOrbit {
        position: relative;
        width: 62px;
        height: 62px;
        margin-bottom: 18px;
        border-radius: 50%;
        border: 1px solid rgba(216,198,166,.16);
        animation:
          loadingOrbitRotate
          2s linear infinite;
      }

      .loadingOrbit span {
        position: absolute;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        top: -3px;
        left: 27px;
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
        color: rgba(255,255,255,.80);
        font-size: 13px;
      }

      .loadingState p,
      .emptyState p,
      .noSelectedLead p {
        margin: 7px 0 0;
        max-width: 280px;
        color: rgba(255,255,255,.42);
        font-size: 11px;
        line-height: 1.6;
      }

      .emptyIcon,
      .noSelectedLead > div {
        width: 43px;
        height: 43px;
        margin-bottom: 13px;
        border-radius: 50%;
        background: rgba(216,198,166,.07);
        color: #D8C6A6;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .emptyState button {
        margin-top: 15px;
        border: 1px solid rgba(216,198,166,.13);
        background: rgba(216,198,166,.07);
        color: #D8C6A6;
        border-radius: 999px;
        padding: 9px 13px;
        cursor: pointer;
        font-size: 10px;
      }

      .sidebarBackdrop {
        display: none;
      }

      /* =====================================================
         RESPONSIVE
         ===================================================== */

      @media (max-width: 1280px) {
        .dashboardShell {
          grid-template-columns:
            205px
            minmax(0,1fr);
        }

        .dashboardSidebar {
          padding:
            25px
            16px;
        }

        .dashboardMain {
          padding:
            27px;
        }

        .analyticsGrid {
          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );
        }

        .analyticsTrendCard {
          grid-column:
            span 2;
        }
      }

      @media (max-width: 1080px) {
        .dashboardShell {
          grid-template-columns:
            1fr;
        }

        .dashboardSidebar {
          position: fixed;
          z-index: 100;
          left: 0;
          top: 0;
          width: 255px;
          transform:
            translateX(
              -105%
            );
          box-shadow:
            18px
            0
            60px
            rgba(0,0,0,.28);
          transition:
            transform
            .28s ease;
        }

        .dashboardSidebarOpen {
          transform:
            translateX(
              0
            );
        }

        .sidebarBackdrop {
          display: block;
          position: fixed;
          z-index: 90;
          inset: 0;
          border: none;
          background:
            rgba(
              0,
              0,
              0,
              .48
            );
          backdrop-filter:
            blur(
              4px
            );
        }

        .mobileMenuButton {
          display: block;
        }

        .dashboardContentGrid {
          grid-template-columns:
            1fr;
        }

        .intelligencePanel {
          position: static;
        }

        .statsGrid {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        .analyticsKpiGrid {
          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );
        }
      }

      @media (max-width: 820px) {
        .dashboardMain {
          padding:
            20px;
        }

        .dashboardHeader {
          align-items:
            flex-start;
        }

        .headerLive {
          display:
            none;
        }

        .dashboardToolbar {
          flex-direction:
            column;
          align-items:
            stretch;
        }

        .searchBox {
          width:
            100%;
        }

        .analyticsHeader {
          flex-direction:
            column;
        }

        .analyticsPeriodSelector {
          width:
            100%;
          overflow-x:
            auto;
        }

        .analyticsPeriodButton {
          flex:
            1;
        }

        .analyticsGrid {
          grid-template-columns:
            1fr;
        }

        .analyticsTrendCard {
          grid-column:
            auto;
        }

        .opportunityPanel {
          overflow-x:
            auto;
        }

        .leadHeaderRow,
        .realLeadRow {
          min-width:
            800px;
        }

        .tableFooter {
          min-width:
            800px;
        }
      }

      @media (max-width: 600px) {
        .dashboardMain {
          padding:
            17px;
        }

        .dashboardHeader {
          gap:
            16px;
        }

        .dashboardHeader h1 {
          font-size:
            27px;
        }

        .headerActions {
          gap:
            5px;
        }

        .exportButton,
        .refreshButton {
          padding:
            0
            10px;
          font-size:
            9px;
        }

        .statsGrid {
          grid-template-columns:
            1fr
            1fr;
          gap:
            8px;
        }

        .dashboardStat {
          min-height:
            112px;
          padding:
            15px;
        }

        .dashboardStat > span {
          font-size:
            9px;
        }

        .dashboardStat strong {
          font-size:
            27px;
        }

        .dashboardStat small {
          font-size:
            9px;
        }

        .analyticsSection {
          padding:
            16px;
        }

        .analyticsHeader h2 {
          font-size:
            20px;
        }

        .analyticsKpiGrid {
          grid-template-columns:
            1fr
            1fr;
        }

        .analyticsKpi {
          padding:
            13px;
        }

        .analyticsKpi strong {
          font-size:
            22px;
        }

        .donutLayout {
          grid-template-columns:
            1fr;
          justify-items:
            center;
        }

        .donutLegend {
          width:
            100%;
        }

        .analyticsCard {
          min-height:
            auto;
        }

        .trendChart {
          min-width:
            560px;
        }

        .trendChartWrap {
          overflow-x:
            auto;
        }
      }

      @media (max-width: 430px) {
        .statsGrid {
          grid-template-columns:
            1fr;
        }

        .analyticsKpiGrid {
          grid-template-columns:
            1fr;
        }

        .dashboardHeader {
          flex-direction:
            column;
        }

        .headerActions {
          width:
            100%;
        }

        .exportButton,
        .refreshButton {
          flex:
            1;
          justify-content:
            center;
        }
      }
    `}</style>
  );
}
