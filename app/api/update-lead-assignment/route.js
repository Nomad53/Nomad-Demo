export async function POST(req) {
  try {
    const { id, assigned_to } = await req.json();

    if (!id) {
      return Response.json(
        { success: false, error: "Missing lead id" },
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
          assigned_to: assigned_to || null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Assignment update error:", data);

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
    console.error("Assignment update failed:", error);

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}
