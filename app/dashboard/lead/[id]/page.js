import LeadDetailsClient from "./LeadDetailsClient";

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

  const lead =
    Array.isArray(data) && data.length > 0
      ? data[0]
      : null;

  if (!lead) {
    return <LeadNotFound />;
  }

  return <LeadDetailsClient initialLead={lead} />;
}

function LeadNotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#082F27",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          textAlign: "center",
          padding: "45px",
          borderRadius: "22px",
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.07)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: "rgba(216,198,166,.08)",
            color: "#D8C6A6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
          }}
        >
          ◌
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "24px",
          }}
        >
          Lead not found
        </h1>

        <p
          style={{
            margin: "10px 0 0",
            color: "rgba(255,255,255,.45)",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          This opportunity may have been removed or is no longer
          available.
        </p>

        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            marginTop: "25px",
            padding: "12px 18px",
            borderRadius: "999px",
            background: "#D8C6A6",
            color: "#082F27",
            textDecoration: "none",
            fontWeight: "800",
            fontSize: "12px",
          }}
        >
          ← Back to Dashboard
        </a>
      </div>
    </main>
  );
}
