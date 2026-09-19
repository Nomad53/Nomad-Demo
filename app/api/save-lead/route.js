export async function POST(req) {
  try {
    const lead = await req.json();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/leads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(lead),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Supabase error:", data);

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
    console.error("Save lead error:", error);

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}
