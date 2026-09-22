import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const { id, notes } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SECRET_KEY
    ) {
      console.error(
        "Missing Supabase environment variables."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error.",
        },
        {
          status: 500,
        }
      );
    }

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/leads?id=eq.${encodeURIComponent(
        id
      )}`,
      {
        method: "PATCH",

        headers: {
          apikey: process.env.SUPABASE_SECRET_KEY,

          Authorization:
            `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

          "Content-Type": "application/json",

          Prefer: "return=representation",
        },

        body: JSON.stringify({
          notes:
            typeof notes === "string"
              ? notes
              : "",
        }),
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Supabase notes update error:",
        response.status,
        errorText
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to save sales notes.",
        },
        {
          status: response.status,
        }
      );
    }

    const updatedLeads =
      await response.json();

    if (
      !Array.isArray(updatedLeads) ||
      updatedLeads.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead was not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      lead: updatedLeads[0],
    });
  } catch (error) {
    console.error(
      "Update lead notes API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred while saving sales notes.",
      },
      {
        status: 500,
      }
    );
  }
}
