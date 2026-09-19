export async function POST(req) {
  try {
    const { id, lead_status } = await req.json();

    if (!id || !lead_status) {
      return Response.json(
        { success: false, error: "Missing id or lead_status" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/leads?id=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          lead_status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Supabase status update error:", data);

      return Response.json(
        { success: false, error: data },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      lead: data[0],
    });
  } catch (error) {
    console.error("Status update failed:", error);

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}
