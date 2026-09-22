import { NextResponse } from "next/server";

/*
  ============================================================
  NOMAD WHATSAPP PILOT
  Taher Real Estate
  ============================================================

  FLOW

  Customer WhatsApp
        ↓
  Meta WhatsApp webhook
        ↓
  /api/whatsapp
        ↓
  Load persistent WhatsApp session from Supabase
        ↓
  /api/extract-lead
        ↓
  /api/chat
        ↓
  Save session
        ↓
  Send NOMAD reply through WhatsApp
        ↓
  If qualified:
  save to normal NOMAD leads table
        ↓
  Existing NOMAD dashboard

  ============================================================
*/


/* ============================================================
   CONFIG
   ============================================================ */

const WHATSAPP_API_VERSION =
  "v26.0";


/* ============================================================
   META WEBHOOK VERIFICATION
   ============================================================ */

export async function GET(request) {
  const {
    searchParams,
  } = new URL(
    request.url
  );

  const mode =
    searchParams.get(
      "hub.mode"
    );

  const token =
    searchParams.get(
      "hub.verify_token"
    );

  const challenge =
    searchParams.get(
      "hub.challenge"
    );

  const verifyToken =
    process.env
      .WHATSAPP_VERIFY_TOKEN;

  if (
    mode ===
      "subscribe" &&
    token ===
      verifyToken
  ) {
    console.log(
      "WhatsApp webhook verified successfully."
    );

    return new Response(
      challenge,
      {
        status: 200,

        headers: {
          "Content-Type":
            "text/plain",
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


/* ============================================================
   WHATSAPP WEBHOOK
   ============================================================ */

export async function POST(
  request
) {
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

    /*
      Meta also sends webhook events for:

      - sent messages
      - delivered messages
      - read receipts
      - failures
      - account events

      Those events do not necessarily
      contain an incoming customer message.

      We only continue when an actual
      WhatsApp message exists.
    */

    const value =
      body?.entry?.[0]
        ?.changes?.[0]
        ?.value;

    const message =
      value?.messages?.[0];

    if (!message) {
      return NextResponse.json(
        {
          success: true,
          ignored:
            "No incoming message.",
        }
      );
    }

    /*
      Customer WhatsApp ID / phone number.

      Example:

      923001234567
    */

    const waUserId =
      message.from;

    const messageId =
      message.id;

    const messageType =
      message.type;

    if (
      !waUserId ||
      !messageId
    ) {
      console.warn(
        "WhatsApp message missing sender or message ID."
      );

      return NextResponse.json(
        {
          success: true,
        }
      );
    }

    console.log(
      "Incoming WhatsApp message:",
      {
        waUserId,
        messageId,
        messageType,
      }
    );


    /* ========================================================
       LOAD EXISTING WHATSAPP SESSION
       ======================================================== */

    let session =
      await getWhatsAppSession(
        waUserId
      );


    /* ========================================================
       CREATE NEW SESSION
       ======================================================== */

    if (!session) {
      session =
        await createWhatsAppSession(
          waUserId
        );

      if (!session) {
        throw new Error(
          "Could not create WhatsApp session."
        );
      }
    }


    /* ========================================================
       DUPLICATE MESSAGE PROTECTION

       Meta can retry webhook deliveries.

       If we already handled this exact message,
       do nothing.
       ======================================================== */

    if (
      session.last_message_id ===
      messageId
    ) {
      console.log(
        "Duplicate WhatsApp message ignored:",
        messageId
      );

      return NextResponse.json(
        {
          success: true,
          duplicate: true,
        }
      );
    }


    /* ========================================================
       FOR NOW NOMAD SUPPORTS TEXT INPUT

       We will add image/audio/document support later
       if required.
       ======================================================== */

    if (
      messageType !==
      "text"
    ) {
      await updateWhatsAppSession(
        waUserId,
        {
          last_message_id:
            messageId,
        }
      );

      await sendWhatsAppText(
        waUserId,
        "For now, please send your property requirement as a text message."
      );

      return NextResponse.json(
        {
          success: true,
          unsupported_type:
            messageType,
        }
      );
    }


    const customerText =
      message?.text?.body
        ?.trim();

    if (!customerText) {
      await updateWhatsAppSession(
        waUserId,
        {
          last_message_id:
            messageId,
        }
      );

      return NextResponse.json(
        {
          success: true,
          ignored:
            "Empty text message.",
        }
      );
    }


    /* ========================================================
       EXISTING CONVERSATION
       ======================================================== */

    const previousConversation =
      Array.isArray(
        session.conversation
      )
        ? session.conversation
        : [];


    /* ========================================================
       CUSTOMER MESSAGE
       ======================================================== */

    const customerMessage =
      {
        role: "user",
        content:
          customerText,
        text:
          customerText,
      };


    const conversationWithCustomer =
      [
        ...previousConversation,
        customerMessage,
      ];


    /* ========================================================
       PREVIOUS STRUCTURED LEAD

       IMPORTANT:

       WhatsApp already gives us the sender's phone number.

       Therefore NOMAD should never ask the WhatsApp
       customer to provide their phone number again.
       ======================================================== */

    const previousLead =
      {
        ...(
          session.lead ||
          {}
        ),

        phone:
          session?.lead
            ?.phone ||
          waUserId,
      };


    const previousState =
      session.state ||
      {};


    /* ========================================================
       CALL EXISTING NOMAD EXTRACTOR
       ======================================================== */

    const origin =
      new URL(
        request.url
      ).origin;


    const extractionResponse =
      await fetch(
        `${origin}/api/extract-lead`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          cache:
            "no-store",

          body:
            JSON.stringify({
              messages:
                conversationWithCustomer,

              previous: {
                lead:
                  previousLead,

                state:
                  previousState,
              },
            }),
        }
      );


    const extractionData =
      await extractionResponse.json();


    if (
      !extractionResponse.ok ||
      !extractionData.success
    ) {
      console.error(
        "WhatsApp lead extraction failed:",
        extractionData
      );

      await updateWhatsAppSession(
        waUserId,
        {
          conversation:
            conversationWithCustomer,

          lead:
            previousLead,

          state:
            previousState,

          last_message_id:
            messageId,
        }
      );

      await sendWhatsAppText(
        waUserId,
        "Sorry, I'm having trouble understanding that right now. Could you try again?"
      );

      return NextResponse.json(
        {
          success: true,
          extraction_failed:
            true,
        }
      );
    }


    /*
      Force phone again after extraction.

      The extractor already preserves it,
      but this guarantees WhatsApp phone
      remains authoritative.
    */

    const extractedLead =
      {
        ...(
          extractionData.lead ||
          {}
        ),

        phone:
          waUserId,
      };


    const extractedState =
      extractionData.state ||
      {};


    const missingFields =
      Array.isArray(
        extractedState
          .missing_fields
      )
        ? extractedState
            .missing_fields
        : [];


    /*
      Because WhatsApp already supplied
      the customer's number, phone must
      never remain missing.
    */

    const correctedMissingFields =
      missingFields.filter(
        (
          field
        ) =>
          field !==
          "phone"
      );


    const correctedState =
      {
        ...extractedState,

        missing_fields:
          correctedMissingFields,
      };


    /*
      Qualification may become complete
      after removing phone from missing_fields.
    */

    const finalLead =
      {
        ...extractedLead,

        lead_status:
          correctedMissingFields
            .length ===
          0
            ? "Qualified"
            : "Incomplete",
      };


    /* ========================================================
       CALL EXISTING NOMAD CHAT ENGINE
       ======================================================== */

    const chatResponse =
      await fetch(
        `${origin}/api/chat`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          cache:
            "no-store",

          body:
            JSON.stringify({
              messages:
                conversationWithCustomer,

              state: {
                ...correctedState,

                lead:
                  finalLead,

                missing_fields:
                  correctedMissingFields,
              },
            }),
        }
      );


    const chatData =
      await chatResponse.json();


    if (
      !chatResponse.ok ||
      !chatData.reply
    ) {
      console.error(
        "WhatsApp NOMAD chat failed:",
        chatData
      );

      await updateWhatsAppSession(
        waUserId,
        {
          conversation:
            conversationWithCustomer,

          lead:
            finalLead,

          state:
            correctedState,

          last_message_id:
            messageId,
        }
      );

      await sendWhatsAppText(
        waUserId,
        "Sorry, I'm having trouble responding right now. Please try again in a moment."
      );

      return NextResponse.json(
        {
          success: true,
          chat_failed:
            true,
        }
      );
    }


    const nomadReply =
      String(
        chatData.reply
      ).trim();


    /* ========================================================
       ADD NOMAD RESPONSE TO CONVERSATION
       ======================================================== */

    const assistantMessage =
      {
        role:
          "assistant",

        content:
          nomadReply,

        text:
          nomadReply,
      };


    const updatedConversation =
      [
        ...conversationWithCustomer,
        assistantMessage,
      ];


    /* ========================================================
       SAVE UPDATED WHATSAPP SESSION
       ======================================================== */

    const qualificationComplete =
      correctedMissingFields
        .length ===
      0;


    const updatedSession =
      await updateWhatsAppSession(
        waUserId,
        {
          phone:
            waUserId,

          conversation:
            updatedConversation,

          lead:
            finalLead,

          state:
            correctedState,

          qualified:
            qualificationComplete,

          last_message_id:
            messageId,
        }
      );


    /* ========================================================
       SAVE QUALIFIED LEAD INTO NORMAL NOMAD LEADS TABLE

       Only save once.
       ======================================================== */

    let savedLeadId =
      updatedSession
        ?.saved_lead_id ||
      session
        ?.saved_lead_id ||
      null;


    if (
      qualificationComplete &&
      !savedLeadId
    ) {
      try {
        const leadToSave =
          {
            name:
              finalLead.name ||
              null,

            phone:
              finalLead.phone ||
              waUserId,

            intent:
              finalLead.intent ||
              null,

            property_type:
              finalLead.property_type ||
              null,

            bedrooms:
              finalLead.bedrooms ||
              null,

            budget:
              finalLead.budget ||
              null,

            location:
              finalLead.location ||
              null,

            property_status:
              finalLead.property_status ||
              null,

            financing:
              finalLead.financing ||
              null,

            timeline:
              finalLead.timeline ||
              null,

            callback_time:
              finalLead.callback_time ||
              null,

            summary:
              finalLead.summary ||
              null,

            lead_status:
              "Qualified",

            assigned_to:
              null,

            source:
              "WhatsApp",

            conversation:
              updatedConversation,

            notes:
              null,
          };


        const saveResponse =
          await fetch(
            `${origin}/api/save-lead`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              cache:
                "no-store",

              body:
                JSON.stringify(
                  leadToSave
                ),
            }
          );


        const saveData =
          await saveResponse.json();


        if (
          saveResponse.ok &&
          saveData.success &&
          saveData.lead?.id
        ) {
          savedLeadId =
            saveData.lead.id;

          await updateWhatsAppSession(
            waUserId,
            {
              qualified:
                true,

              saved_lead_id:
                savedLeadId,
            }
          );

          console.log(
            "Qualified WhatsApp lead saved:",
            savedLeadId
          );
        } else {
          console.error(
            "Qualified WhatsApp lead could not be saved:",
            saveData
          );
        }
      } catch (
        saveError
      ) {
        console.error(
          "WhatsApp qualified lead save error:",
          saveError
        );
      }
    }


    /* ========================================================
       SEND NOMAD REPLY THROUGH WHATSAPP
       ======================================================== */

    const sendResult =
      await sendWhatsAppText(
        waUserId,
        nomadReply
      );


    console.log(
      "WhatsApp reply sent:",
      sendResult
    );


    /* ========================================================
       WEBHOOK ACKNOWLEDGEMENT
       ======================================================== */

    return NextResponse.json(
      {
        success: true,

        processed:
          true,

        qualified:
          qualificationComplete,

        saved_lead_id:
          savedLeadId,
      }
    );
  } catch (error) {
    /*
      IMPORTANT

      Meta may retry failed webhooks.

      During the pilot we acknowledge the webhook
      with HTTP 200 so one unexpected processing
      failure does not create an infinite retry loop.

      We still log the error for debugging.
    */

    console.error(
      "NOMAD WhatsApp webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: true,
        processing_error:
          true,
      }
    );
  }
}


/* ============================================================
   SUPABASE
   ============================================================ */

function getSupabaseHeaders() {
  return {
    apikey:
      process.env
        .SUPABASE_SECRET_KEY,

    Authorization:
      `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

    "Content-Type":
      "application/json",
  };
}


/* ============================================================
   GET WHATSAPP SESSION
   ============================================================ */

async function getWhatsAppSession(
  waUserId
) {
  const url =
    `${process.env.SUPABASE_URL}` +
    `/rest/v1/whatsapp_sessions` +
    `?wa_user_id=eq.${encodeURIComponent(
      waUserId
    )}` +
    `&select=*` +
    `&limit=1`;


  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers:
          getSupabaseHeaders(),

        cache:
          "no-store",
      }
    );


  if (!response.ok) {
    const text =
      await response.text();

    console.error(
      "Supabase WhatsApp session GET failed:",
      response.status,
      text
    );

    throw new Error(
      "Could not load WhatsApp session."
    );
  }


  const data =
    await response.json();


  if (
    !Array.isArray(
      data
    ) ||
    data.length ===
      0
  ) {
    return null;
  }


  return data[0];
}


/* ============================================================
   CREATE WHATSAPP SESSION
   ============================================================ */

async function createWhatsAppSession(
  waUserId
) {
  const response =
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/whatsapp_sessions`,
      {
        method:
          "POST",

        headers: {
          ...getSupabaseHeaders(),

          Prefer:
            "return=representation",
        },

        body:
          JSON.stringify({
            wa_user_id:
              waUserId,

            phone:
              waUserId,

            conversation:
              [],

            lead: {
              phone:
                waUserId,
            },

            state: {
              missing_fields:
                [],
            },

            qualified:
              false,
          }),
      }
    );


  if (!response.ok) {
    const text =
      await response.text();

    /*
      Two webhook requests could theoretically
      attempt creation at nearly the same time.

      Since wa_user_id is unique, retry loading
      the session before failing.
    */

    console.warn(
      "WhatsApp session create response:",
      response.status,
      text
    );

    const existing =
      await getWhatsAppSession(
        waUserId
      );

    if (existing) {
      return existing;
    }

    throw new Error(
      "Could not create WhatsApp session."
    );
  }


  const data =
    await response.json();


  return (
    data?.[0] ||
    null
  );
}


/* ============================================================
   UPDATE WHATSAPP SESSION
   ============================================================ */

async function updateWhatsAppSession(
  waUserId,
  updates
) {
  const response =
    await fetch(
      `${process.env.SUPABASE_URL}` +
        `/rest/v1/whatsapp_sessions` +
        `?wa_user_id=eq.${encodeURIComponent(
          waUserId
        )}`,
      {
        method:
          "PATCH",

        headers: {
          ...getSupabaseHeaders(),

          Prefer:
            "return=representation",
        },

        body:
          JSON.stringify({
            ...updates,

            updated_at:
              new Date()
                .toISOString(),
          }),
      }
    );


  if (!response.ok) {
    const text =
      await response.text();

    console.error(
      "Supabase WhatsApp session PATCH failed:",
      response.status,
      text
    );

    throw new Error(
      "Could not update WhatsApp session."
    );
  }


  const data =
    await response.json();


  return (
    data?.[0] ||
    null
  );
}


/* ============================================================
   SEND WHATSAPP TEXT
   ============================================================ */

async function sendWhatsAppText(
  recipient,
  text
) {
  const accessToken =
    process.env
      .WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env
      .WHATSAPP_PHONE_NUMBER_ID;


  if (
    !accessToken ||
    !phoneNumberId
  ) {
    console.error(
      "WhatsApp credentials are missing."
    );

    throw new Error(
      "WhatsApp credentials are not configured."
    );
  }


  const response =
    await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            messaging_product:
              "whatsapp",

            recipient_type:
              "individual",

            to:
              recipient,

            type:
              "text",

            text: {
              preview_url:
                false,

              body:
                text,
            },
          }),
      }
    );


  const data =
    await response.json();


  if (!response.ok) {
    console.error(
      "WhatsApp send API failed:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "WhatsApp message could not be sent."
    );
  }


  return data;
}
