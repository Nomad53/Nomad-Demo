export default async function Dashboard() {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  const leads = await response.json();

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
          maxWidth: "1400px",
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
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1200px",
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
                <th style={thStyle}>Lead Status</th>
              </tr>
            </thead>

            <tbody>
              {Array.isArray(leads) &&
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <td style={tdStyle}>{lead.name || "-"}</td>
                    <td style={tdStyle}>{lead.phone || "-"}</td>
                    <td style={tdStyle}>{lead.intent || "-"}</td>
                    <td style={tdStyle}>
                      {lead.bedrooms
                        ? `${lead.bedrooms} Bedroom ${lead.property_type || ""}`
                        : lead.property_type || "-"}
                    </td>
                    <td style={tdStyle}>{lead.location || "-"}</td>
                    <td style={tdStyle}>{lead.budget || "-"}</td>
                    <td style={tdStyle}>{lead.property_status || "-"}</td>
                    <td style={tdStyle}>{lead.financing || "-"}</td>
                    <td style={tdStyle}>{lead.timeline || "-"}</td>
                    <td style={tdStyle}>{lead.callback_time || "-"}</td>
                    <td style={tdStyle}>{lead.lead_status || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          {Array.isArray(leads) && leads.length === 0 && (
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
