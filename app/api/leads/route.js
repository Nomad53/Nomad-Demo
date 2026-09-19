export async function GET() {
  try {
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

    if (!response.ok) {
      console.error("Lead fetch error:", leads);

      return Response.json(
        {
          success: false,
          error: leads,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      leads,
    });
  } catch (error) {
    console.error("Lead fetch failed:", error);

    return Response.json(
      {
        success: false,
      },
      { status: 500 }
    );
  }
}
