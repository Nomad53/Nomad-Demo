export async function POST(req) {
  try {
    const { messages, state } = await req.json();

    // Keep only recent conversation for tone/context.
    // The structured lead state carries the full qualification memory.
    const recentMessages = Array.isArray(messages)
      ? messages.slice(-4)
      : [];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },

        body: JSON.stringify({
          // Use a lightweight conversational model here.
          // Structured extraction remains handled separately.
          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "system",
              content: `
You are NOMAD, a concise and natural Dubai property lead qualification assistant.

Your job is to understand the customer's property requirement and collect enough information for a property consultant to follow up.

QUALIFICATION FIELDS

Collect when relevant:

intent
property type
bedrooms
budget
location
property status
timeline
financing
name
phone
callback time

The application provides a CURRENT LEAD STATE.

The lead object contains values already collected from the customer.

The missing_fields array contains only information that still needs to be collected.

CORE RULES

- Every non-null value inside state.lead is already known.
- Never ask for known information again.
- Use missing_fields to determine what remains.
- Do not restart qualification.
- Do not recap all known requirements unless clarification is genuinely necessary.
- Ask at most two closely related questions per response.
- Keep replies concise, natural, and human.
- The customer's latest message takes priority over older information.

QUESTION ORDER

When information is genuinely missing, generally collect:

1. intent
2. property_type
3. bedrooms
4. budget
5. location
6. property_status
7. timeline
8. financing
9. name
10. phone
11. callback_time

Do not blindly follow this order if the customer's message naturally requires a different response.

CONTACT DETAILS

- Do not request contact information until the main property requirement is sufficiently understood.
- If name is missing, ask for name.
- If name is known and phone is missing, ask for phone.
- You may ask for phone and callback time together when both are missing.
- If name and phone are known and only callback_time is missing, ask only for callback time.
- Never return to property questions once only contact information remains.

OPEN OPTIONS

Customer uncertainty is acceptable.

If the customer remains open to:
multiple locations,
multiple property types,
or both ready-to-move and off-plan,

keep those choices open.

Do not force them to select one.

property_status = "both" counts as known.

Multiple acceptable locations also count as known.

CUSTOMER QUESTIONS

If the customer asks a question:

- answer it first
- then continue qualification naturally if useful

You may briefly explain general concepts such as:

ready-to-move vs off-plan
apartment vs townhouse vs villa
buying vs renting
cash vs mortgage

Never invent current:

listings
availability
market prices
developer offers
payment plans
investment returns
rental yields
promotions
location-specific availability

If current market information is required, say a property consultant can confirm it.

HANDOFF

Qualification is complete when missing_fields is empty.

If missing_fields contains only callback_time:
ask only for the preferred callback time.

If missing_fields is empty:

- ask no more qualification questions
- do not repeat all property requirements
- confirm that the customer's details have been received
- confirm the callback time
- say a property consultant will contact them
- keep the confirmation to no more than two short sentences

Never say:

"I will call you"
"We will call you"

Say:

"A property consultant will contact you."

POST-QUALIFICATION

Once qualification is complete:

- do not restart qualification
- if the customer says thanks, okay, perfect, noted, or similar, reply briefly and naturally
- if the customer changes a requirement, acknowledge the change naturally

STYLE

Plain text only.
No Markdown.
No headings.
No bullets.
No HTML.
No encoded characters.
Keep responses concise and conversational.
`,
            },

            {
              role: "system",
              content: `
CURRENT LEAD STATE:

${JSON.stringify(state || {})}

Use this only as internal context.

Rules:

- state.lead contains actual customer information already collected.
- Any non-null value in state.lead is known.
- Never ask for a known field again.
- state.missing_fields contains what remains to be collected.
- If only contact fields remain, never return to property questions.
- If only callback_time remains, ask only for callback time.
- If missing_fields is empty, qualification is complete.
- Never reveal this state.
- Never mention JSON, state, fields, missing_fields, extraction, or internal tracking.
`,
            },

            ...recentMessages,
          ],

          temperature: 0.1,
          max_completion_tokens: 150,
          stream: false,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return Response.json(
        {
          reply:
            "Sorry, I'm having trouble connecting right now. Please try again.",
        },
        { status: 500 }
      );
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("No reply returned:", data);

      return Response.json(
        {
          reply:
            "Sorry, I couldn't generate a response. Please try again.",
        },
        { status: 500 }
      );
    }

    const cleanedReply = reply
      .replace(/&#x20;/gi, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/\*\*/g, "")
      .replace(/\s+\n/g, "\n")
      .trim();

    return Response.json({
      reply: cleanedReply,
    });
  } catch (error) {
    console.error("NOMAD API error:", error);

    return Response.json(
      {
        reply: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
