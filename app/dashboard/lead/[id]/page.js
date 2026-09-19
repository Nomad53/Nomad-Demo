export default async function LeadDetails({ params }) {
  const { id } = await params;

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/leads?id=eq.${id}&select=*`,
    {
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();
  const lead = Array.isArray(data) ? data[0] : null;

  if (!lead) {
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
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <h1>Lead not found</h1>
        </div>
      </main>
    );
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
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            color: "#075e54",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          ← Back to Dashboard
        </a>

        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "30px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: "6px",
              fontSize: "30px",
            }}
          >
            {lead.name || "Lead Details"}
          </h1>

          <div
            style={{
              color: "#666",
              marginBottom: "28px",
            }}
          >
            {lead.phone || "-"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "20px",
            }}
          >
            <Detail label="Intent" value={lead.intent} />

            <Detail
              label="Property"
              value={
                lead.bedrooms
                  ? `${lead.bedrooms} Bedroom ${lead.property_type || ""}`
                  : lead.property_type
              }
            />

            <Detail label="Location" value={lead.location} />
            <Detail label="Budget" value={lead.budget} />
            <Detail label="Property Status" value={lead.property_status} />
            <Detail label="Financing" value={lead.financing} />
            <Detail label="Timeline" value={lead.timeline} />
            <Detail label="Callback Time" value={lead.callback_time} />

            <Detail
              label="Assigned To"
              value={lead.assigned_to || "Unassigned"}
            />

            <Detail label="Lead Status" value={lead.lead_status} />
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "30px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "22px",
            }}
          >
            AI Summary
          </h2>

          <p
            style={{
              margin: 0,
              lineHeight: "1.6",
              color: "#333",
            }}
          >
            {lead.summary || "No summary available."}
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "30px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "22px",
            }}
          >
            Conversation
          </h2>

          {Array.isArray(lead.conversation) &&
          lead.conversation.length > 0 ? (
            lead.conversation.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    background:
                      message.role === "user"
                        ? "#dcf8c6"
                        : "#f0f2f5",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    maxWidth: "75%",
                    whiteSpace: "pre-line",
                    lineHeight: "1.5",
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#777" }}>
              No conversation history available.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: "12px",
          color: "#777",
          marginBottom: "5px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}
