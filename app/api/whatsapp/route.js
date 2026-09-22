import { NextResponse } from "next/server";

/*
  NOMAD WhatsApp Webhook

  GET:
  Used by Meta to verify the webhook.

  POST:
  Receives incoming WhatsApp webhook events.

  For now we only log the incoming payload.
  We are NOT replying automatically yet.
*/

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token === verifyToken
  ) {
    console.log(
      "WhatsApp webhook verified successfully."
    );

    return new Response(
      challenge,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }

  console.error(
    "WhatsApp webhook verification failed."
  );

  return new Response(
    "Forbidden",
    {
      status: 403,
    }
  );
}

export async function POST(request) {
  try {
    const body =
      await request.json();

    console.log(
      "=========================================="
    );

    console.log(
      "NOMAD WHATSAPP WEBHOOK RECEIVED"
    );

    console.log(
      JSON.stringify(
        body,
        null,
        2
      )
    );

    console.log(
      "=========================================="
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "WhatsApp webhook error:",
      error
    );

    return NextResponse.json({
      success: true,
    });
  }
}
