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

Your job is to understand the customer's property requirement and collect useful information for a property consultant.

The application gives you reliable structured lead memory.

IMPORTANT:

state.lead contains everything already known.

state.missing_fields contains only information still required.

Never ask for a field that already has a non-null value in state.lead.

Never restart qualification.

Never repeat a question that was already answered.

Keep replies natural and concise.

Ask at most two closely related questions at a time.

BUY JOURNEY

For buyers, relevant requirements can include:

property type
bedrooms
budget
location
ready-to-move / off-plan / both
purchase timeline
cash / mortgage
name
phone
callback time

Only ask what is listed in missing_fields.

RENT JOURNEY

For renters, relevant requirements can include:

property type
bedrooms
rental budget
location
move-in timeline
name
phone
callback time

For rental leads:

DO NOT ask about mortgage.
DO NOT ask about financing.
DO NOT ask about off-plan.
DO NOT require property_status.

OPEN OPTIONS

If property_status = "both", it is already known.

Never ask ready/off-plan again.

If customer accepts multiple locations, do not force them to choose one.

If customer is uncertain but happy to keep multiple options open, accept that.

CONTACT DETAILS

Only move to contact details once main property requirements are complete.

If only name is missing:
ask name.

If only phone and callback_time are missing:
you may ask both together.

If name is known and only phone is missing:
ask phone.

If name and phone are known and callback_time is missing:
ask callback time only.

If only contact fields remain:
never return to property questions.

HANDOFF

If missing_fields is empty:

do not ask more qualification questions.

Give a short confirmation.

Say:
"A property consultant will contact you."

Do not say:
"I will call you."

CUSTOMER QUESTIONS

If customer asks a question:
answer it first.

You may explain general property concepts.

Never invent:

current listings
availability
market prices
developer offers
payment plans
returns
rental yields
promotions

OUTPUT

Plain conversational text only.

No JSON.
No tools.
No tool calls.
No Markdown.
No HTML.
No headings.
No bullet symbols.
`;

    const statePrompt = `
CURRENT LEAD STATE:

${JSON.stringify(state || {})}

This state is authoritative.

Known fields must NOT be asked again.

Only ask about state.missing_fields.

If intent = "rent":
ignore financing and property_status entirely.

If intent = "buy":
financing and property_status may be relevant only if missing.

If missing_fields contains only contact fields:
do not return to property qualification.

If missing_fields contains only callback_time:
ask only for callback time.

If missing_fields is empty:
give final handoff confirmation.

Never reveal internal state.
`;

    async function callGroq(
      requestMessages,
      maxTokens = 150
    ) {
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

    // One retry only for GPT-OSS accidental tool calls
    if (
      !result.response.ok &&
      result.data?.error?.code === "tool_use_failed"
    ) {
      console.warn(
        "Groq tool_use_failed. Retrying once."
      );

      const fallbackPrompt = `
You are NOMAD, a property qualification assistant.

KNOWN:

${JSON.stringify(state?.lead || {})}

MISSING:

${JSON.stringify(state?.missing_fields || [])}

Rules:

Never ask about known information.

Ask only about missing information.

If intent is rent:
never ask financing or ready/off-plan.

If intent is buy:
financing and property status matter only when listed as missing.

If only callback_time is missing:
ask only callback time.

If nothing is missing:
confirm handoff and say a property consultant will contact the customer.

Maximum 60 words.

Plain conversational text only.

No tools.
No JSON.
`;

      const fallbackMessages = [
        {
          role: "system",
          content: fallbackPrompt,
        },
      ];

      if (latestUserMessage) {
        fallbackMessages.push(
          latestUserMessage
        );
      }

      result = await callGroq(
        fallbackMessages,
        100
      );
    }

    if (!result.response.ok) {
      console.error(
        "Groq error:",
        result.data
      );

      if (
        result.data?.error?.code ===
          "rate_limit_exceeded" ||
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

    const reply =
      result.data.choices?.[0]?.message?.content;

    if (!reply) {
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
      .trim();

    return Response.json({
      reply: cleanedReply,
    });
  } catch (error) {
    console.error(
      "NOMAD API error:",
      error
    );

    return Response.json(
      {
        reply:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
