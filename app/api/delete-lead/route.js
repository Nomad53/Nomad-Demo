import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { id } = body;

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
        method: "DELETE",

        headers: {
          apikey:
            process.env.SUPABASE_SECRET_KEY,

          Authorization:
            `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

          Prefer:
            "return=representation",
        },
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Supabase delete error:",
        response.status,
        errorText
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete lead.",
        },
        {
          status: response.status,
        }
      );
    }

    const deletedLeads =
      await response.json();

    if (
      !Array.isArray(deletedLeads) ||
      deletedLeads.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Lead was not found or has already been deleted.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      deletedLead: deletedLeads[0],
    });
  } catch (error) {
    console.error(
      "Delete lead API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred while deleting the lead.",
      },
      {
        status: 500,
      }
    );
  }
}
