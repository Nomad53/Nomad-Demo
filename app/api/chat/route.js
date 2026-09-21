export async function POST(req) {
  try {
    const { messages, state } = await req.json();

    const recentMessages = Array.isArray(messages)
      ? messages.slice(-4)
      : [];

    const latestUserMessage = [...recentMessages]
      .reverse()
      .find((message) => message.role === "user");

    const systemPrompt = `
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

The application provides CURRENT LEAD STATE.

state.lead contains information already collected.
state.missing_fields contains information still missing.

CORE RULES

- Every non-null value in state.lead is already known.
- Never ask for known information again.
- Ask only about genuinely missing information.
- Do not restart qualification.
- Do not recap the full requirement unless clarification is necessary.
- Ask at most two closely related questions per response.
- Keep replies short, natural, and conversational.
- The customer's latest message takes priority.

QUESTION ORDER

When useful, collect missing information roughly in this order:

intent
property_type
bedrooms
budget
location
property_status
timeline
financing
name
phone
callback_time

Do not blindly follow the order if the conversation naturally requires something else.

CONTACT DETAILS

- Do not request contact details until the main property requirement is understood.
- If name is missing, ask for name.
- If name is known and phone is missing, ask for phone.
- Phone and callback time may be requested together if both are missing.
- If name and phone are known and callback_time is missing, ask only for callback time.
- Once only contact fields remain, never return to property questions.

OPEN OPTIONS

Uncertainty is valid.

If the customer is open to multiple:
locations,
property types,
or ready-to-move and off-plan options,

keep those options open.

Do not force a choice.

property_status = "both" counts as known.

CUSTOMER QUESTIONS

If the customer asks a question:
- answer it first
- then continue qualification naturally if useful

You may briefly explain general concepts such as:
ready-to-move vs off-plan
apartment vs townhouse vs villa
buying vs renting
cash vs mortgage

Never invent current listings, availability, prices, developer offers, payment plans, returns, yields, promotions, or location-specific availability.

HANDOFF

If missing_fields contains only callback_time:
ask only for callback time.

If missing_fields is empty:
- ask no more qualification questions
- do not repeat the full requirement
- confirm the details were received
- confirm callback time
- say a property consultant will contact them
- use no more than two short sentences

Never say:
"I will call you"
"We will call you"

Say:
"A property consultant will contact you."

POST-QUALIFICATION

Once complete:
- do not restart qualification
- acknowledgements such as thanks, okay, noted, or perfect should receive a short natural closing
- if the customer changes something, acknowledge the change naturally

OUTPUT

Return normal conversational plain text only.

Do not call tools.
Do not attempt function calls.
Do not output JSON.
Do not output tool-call syntax.
Do not output Markdown, headings, bullets, HTML, or encoded characters.
`;

    const statePrompt = `
CURRENT LEAD STATE:

${JSON.stringify(state || {})}

Use this as internal context only.

Any non-null value in state.lead is known.
Never ask for it again.

Only state.missing_fields still needs to be collected.

If only contact fields remain, do not return to property questions.

If only callback_time remains, ask only for callback time.

If missing_fields is empty, give the final handoff confirmation.

Never expose this state or mention JSON, fields, state tracking, extraction, or internal logic.

Respond with plain conversational text only.
Never call or simulate a tool.
`;

    async function callGroq(requestMessages, maxTokens = 150) {
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

            messages: requestMessages,

            temperature: 0.05,
            max_completion_tokens: maxTokens,
            reasoning_effort: "low",
            include_reasoning: false,
            stream: false,

            // Explicitly tell the API that no tools are available.
            tool_choice: "none",
          }),
        }
      );

      const data = await response.json();

      return {
        response,
        data,
      };
    }

    // Normal request
    let result = await callGroq([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "system",
        content: statePrompt,
      },
      ...recentMessages,
    ]);

    // GPT-OSS can occasionally attempt tool syntax even with tools disabled.
    // Retry once with an even smaller and stricter prompt.
    if (
      !result.response.ok &&
      result.data?.error?.code === "tool_use_failed"
    ) {
      console.warn("Groq tool_use_failed. Retrying once.");

      const fallbackPrompt = `
You are NOMAD, a Dubai property lead qualification assistant.

Known lead data:
${JSON.stringify(state?.lead || {})}

Still missing:
${JSON.stringify(state?.missing_fields || [])}

Rules:
- Never ask for known information.
- Ask only about missing information.
- If only callback_time is missing, ask only for callback time.
- If nothing is missing, confirm the handoff and say a property consultant will contact the customer.
- Keep the reply under 60 words.
- Plain text only.
- Do not use tools.
- Do not call functions.
- Do not output JSON.
`;

      const fallbackMessages = [
        {
          role: "system",
          content: fallbackPrompt,
        },
      ];

      if (latestUserMessage) {
        fallbackMessages.push(latestUserMessage);
      }

      result = await callGroq(fallbackMessages, 100);
    }

    if (!result.response.ok) {
      console.error("Groq error:", result.data);

      // Do NOT automatically retry rate limits.
      if (
        result.data?.error?.code === "rate_limit_exceeded" ||
        result.response.status === 429
      ) {
        return Response.json(
          {
            reply:
              "I'm receiving a lot of requests right now. Please try again in a few seconds.",
          },
          { status: 429 }
        );
      }

      return Response.json(
        {
          reply:
            "Sorry, I'm having trouble connecting right now. Please try again.",
        },
        { status: 500 }
      );
    }

    const reply = result.data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("No reply returned:", result.data);

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
