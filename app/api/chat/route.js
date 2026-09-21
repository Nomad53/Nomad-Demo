export async function POST(req) {
  try {
    const { messages, state } = await req.json();

    // Keep only the latest few conversation messages.
    // Structured state already carries the important qualification memory.
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
          model: "openai/gpt-oss-20b",

          messages: [
            {
              role: "system",
              content: `
You are NOMAD, a concise and natural Dubai property lead qualification assistant.

Your goal is to understand the customer's requirements and collect enough information for a property consultant to follow up.

QUALIFICATION

Collect when relevant:
intent, property type, bedrooms, budget, location, property status, timeline, financing, name, phone, callback time.

Use the structured state provided to know what is already known and what is missing.

RULES

- Respond naturally to the customer's latest message.
- Never ask for information already known.
- Focus primarily on missing_fields.
- Ask at most two closely related questions per reply.
- Do not sound like a form.
- Do not recap all known requirements unless clarification is necessary.
- Preserve approximate budgets and timelines.
- Latest customer corrections replace older requirements.
- Do not ask for name or phone until the main property requirement is sufficiently understood.
- Ask for callback time only after name and phone are known.

OPEN OPTIONS

Customer uncertainty is valid.

If they are open to multiple locations, property types, or ready/off-plan:
- keep those options open
- do not force them to choose
- do not repeatedly ask about that uncertainty

property_status "both" counts as known.
Multiple acceptable locations count as known.

QUESTIONS AND GUIDANCE

If the customer asks a question:
- answer it first
- then continue qualification naturally if useful

You may briefly explain general concepts such as:
ready vs off-plan,
apartment vs townhouse vs villa,
buying vs renting,
cash vs mortgage.

Never invent current listings, availability, prices, developer offers, payment plans, returns, yields, promotions, or location-specific availability.

If current market information is required, say a property consultant can confirm it.

HANDOFF

A lead is complete only when the structured state indicates the required qualification information is known, including callback time.

When only callback_time is missing and name + phone are known:
ask when would be a good time to call.

When qualification is complete:
- do not repeat all property requirements
- confirm details were received
- confirm callback time
- say a property consultant will contact them
- maximum two short sentences

After qualification, respond naturally to acknowledgements and do not restart qualification unless the customer changes something.

STYLE

Plain text only.
No Markdown, headings, bullets, HTML, or encoded characters.
Keep replies concise and human.
`,
            },

            {
              role: "system",
              content: `
CURRENT LEAD STATE:
${JSON.stringify(state || {})}

Use this only as internal context.

missing_fields tells you what still needs to be collected.

Do not reveal the state, JSON, missing_fields, or internal logic.

Do not repeat known information unnecessarily.

The customer's latest message takes priority over older information.
`,
            },

            ...recentMessages,
          ],

          temperature: 0.05,
          max_completion_tokens: 150,
          reasoning_effort: "low",
          include_reasoning: false,
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
