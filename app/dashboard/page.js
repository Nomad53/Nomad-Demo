"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [updatingAssignmentId, setUpdatingAssignmentId] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      const response = await fetch("/api/leads", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setLeads(data.leads);
      } else {
        console.error("Failed to load leads:", data);
      }
    } catch (error) {
      console.error("Lead loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateLeadStatus(id, lead_status) {
    setUpdatingStatusId(id);

    try {
      const response = await fetch("/api/update-lead-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          lead_status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === id ? { ...lead, lead_status } : lead
          )
        );
      } else {
        console.error("Status update failed:", data);
      }
    } catch (error) {
      console.error("Status update error:", error);
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function updateLeadAssignment(id, assigned_to) {
    setUpdatingAssignmentId(id);

    try {
      const response = await fetch("/api/update-lead-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          assigned_to,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === id ? { ...lead, assigned_to } : lead
          )
        );
      } else {
        console.error("Assignment update failed:", data);
      }
    } catch (error) {
      console.error("Assignment update error:", error);
    } finally {
      setUpdatingAssignmentId(null);
    }
  }

  function openLead(id) {
    router.push(`/dashboard/lead/${id}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7f6",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "32px" }}>
            NOMAD Lead Dashboard
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#666",
            }}
          >
            Qualified property leads captured by NOMAD
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "16px",
            overflow: "auto",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#777",
              }}
            >
              Loading leads...
            </div>
          ) : (
            <>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1400px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#075e54",
                      color: "white",
                      textAlign: "left",
                    }}
                  >
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Intent</th>
                    <th style={thStyle}>Property</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Budget</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Financing</th>
                    <th style={thStyle}>Timeline</th>
                    <th style={thStyle}>Callback</th>
                    <th style={thStyle}>Assigned To</th>
                    <th style={thStyle}>Lead Status</th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => openLead(lead.id)}
                      style={{
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8faf9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <td style={tdStyle}>{lead.name || "-"}</td>
                      <td style={tdStyle}>{lead.phone || "-"}</td>
                      <td style={tdStyle}>{lead.intent || "-"}</td>

                      <td style={tdStyle}>
                        {lead.bedrooms
                          ? `${lead.bedrooms} Bedroom ${
                              lead.property_type || ""
                            }`
                          : lead.property_type || "-"}
                      </td>

                      <td style={tdStyle}>{lead.location || "-"}</td>
                      <td style={tdStyle}>{lead.budget || "-"}</td>
                      <td style={tdStyle}>{lead.property_status || "-"}</td>
                      <td style={tdStyle}>{lead.financing || "-"}</td>
                      <td style={tdStyle}>{lead.timeline || "-"}</td>
                      <td style={tdStyle}>{lead.callback_time || "-"}</td>

                      <td
                        style={tdStyle}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={lead.assigned_to || ""}
                          disabled={updatingAssignmentId === lead.id}
                          onChange={(e) =>
                            updateLeadAssignment(lead.id, e.target.value)
                          }
                          style={selectStyle}
                        >
                          <option value="">Unassigned</option>
                          <option value="Ahmed">Ahmed</option>
                          <option value="Sarah">Sarah</option>
                          <option value="Ali">Ali</option>
                          <option value="Sales Team A">Sales Team A</option>
                        </select>
                      </td>

                      <td
                        style={tdStyle}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={lead.lead_status || "Qualified"}
                          disabled={updatingStatusId === lead.id}
                          onChange={(e) =>
                            updateLeadStatus(lead.id, e.target.value)
                          }
                          style={selectStyle}
                        >
                          <option value="Qualified">Qualified</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {leads.length === 0 && (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#777",
                  }}
                >
                  No leads yet.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const thStyle = {
  padding: "16px",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "16px",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

const selectStyle = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "white",
  cursor: "pointer",
};
