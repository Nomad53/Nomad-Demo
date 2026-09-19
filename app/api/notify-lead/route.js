export async function POST(req) {
  try {
    const lead = await req.json();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NOMAD <onboarding@resend.dev>",
        to: ["taherbahrain@gmail.com"],
        subject: `New Qualified Lead - ${lead.name || "Customer"}`,
        html: `
          <h2>New Qualified Lead</h2>

          <p><strong>Name:</strong> ${lead.name || "-"}</p>
          <p><strong>Phone:</strong> ${lead.phone || "-"}</p>
          <p><strong>Intent:</strong> ${lead.intent || "-"}</p>
          <p><strong>Property:</strong> ${lead.bedrooms || "-"} Bedroom ${lead.property_type || "-"}</p>
          <p><strong>Location:</strong> ${lead.location || "-"}</p>
          <p><strong>Budget:</strong> ${lead.budget || "-"}</p>
          <p><strong>Status:</strong> ${lead.property_status || "-"}</p>
          <p><strong>Financing:</strong> ${lead.financing || "-"}</p>
          <p><strong>Timeline:</strong> ${lead.timeline || "-"}</p>
          <p><strong>Callback:</strong> ${lead.callback_time || "-"}</p>

          <hr />

          <p><strong>Summary:</strong><br />
          ${lead.summary || "-"}</p>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);

      return Response.json(
        { success: false, error: data },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Notification error:", error);

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}
