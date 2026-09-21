export async function POST(req) {
  try {
    const { messages, state } = await req.json();

    const lead = state?.lead || {};
    const missingFields = Array.isArray(state?.missing_fields)
      ? state.missing_fields
      : [];

    const recentMessages = Array.isArray(messages)
      ? messages.slice(-4)
      : [];

    const latestUserMessage = [...recentMessages]
      .reverse()
      .find((message) => message.role === "user");

    /*
      =========================================================
      DETERMINISTIC CONTACT + HANDOFF STAGE
      =========================================================

      Once only contact fields remain, DO NOT let the AI model
      decide what to ask.

      This prevents NOMAD from returning to old property
      questions such as ready/off-plan, budget, bedrooms, etc.
    */

    const contactFields = [
      "name",
      "phone",
      "callback_time",
    ];

    const onlyContactFieldsRemain =
      missingFields.length > 0 &&
      missingFields.every((field) =>
        contactFields.includes(field)
      );

    /*
      QUALIFICATION COMPLETE

      No Groq call is made here.
    */
    if (missingFields.length === 0) {
      const firstName = lead.name
        ? String(lead.name).trim().split(/\s+/)[0]
        : null;

      const callbackTime = lead.callback_time || null;

      let reply;

      if (firstName && callbackTime) {
        reply = `All set, ${firstName}. A property consultant will contact you ${callbackTime}.`;
      } else if (callbackTime) {
        reply = `All set. A property consultant will contact you ${callbackTime}.`;
      } else if (firstName) {
        reply = `All set, ${firstName}. A property consultant will contact you shortly.`;
      } else {
        reply =
          "All set. A property consultant will contact you shortly.";
      }

      return Response.json({
        reply,
      });
    }

    /*
      CONTACT STAGE

      Also deterministic.
      No Groq call is made here.
    */
    if (onlyContactFieldsRemain) {
      const needsName =
        missingFields.includes("name");

      const needsPhone =
        missingFields.includes("phone");

      const needsCallback =
        missingFields.includes("callback_time");

      const firstName = lead.name
        ? String(lead.name).trim().split(/\s+/)[0]
        : null;

      let reply = "";

      if (
        needsName &&
        needsPhone &&
        needsCallback
      ) {
        reply =
          "Could you share your name and phone number, please?";
      } else if (
        needsName &&
        needsPhone
      ) {
        reply =
          "Could you share your name and phone number, please?";
      } else if (
        needsName &&
        needsCallback
      ) {
        reply =
          "Could you share your name and a convenient time for a property consultant to contact you?";
      } else if (needsName) {
        reply =
          "May I have your name, please?";
      } else if (
        needsPhone &&
        needsCallback
      ) {
        reply = firstName
          ? `Thanks, ${firstName}. Could you share your phone number and a convenient time for a callback?`
          : "Could you share your phone number and a convenient time for a callback?";
      } else if (needsPhone) {
        reply = firstName
          ? `Thanks, ${firstName}. Could you share your phone number?`
          : "Could you share your phone number, please?";
      } else if (needsCallback) {
        reply =
          "When would be a convenient time for a property consultant to contact you?";
      }

      if (reply) {
        return Response.json({
          reply,
        });
      }
    }

    /*
      =========================================================
      AI PROPERTY DISCOVERY STAGE
      =========================================================

      Groq is used only while genuine property qualification
      fields are still missing.
    */

    const systemPrompt = `
You are NOMAD, a concise and natural Dubai property lead qualification assistant.

Your job is to understand the customer's property requirement and collect useful information for a property consultant.

The application gives you authoritative structured lead memory.

IMPORTANT

state.lead contains information already known.

state.missing_fields contains ONLY information that still needs to be collected.

Never ask for a field that already has a non-null value in state.lead.

Never restart qualification.

Never repeat a question that has already been answered.

Ask at most two closely related questions at a time.

Keep replies natural, concise, and conversational.

Do not recap the full requirement unless clarification is genuinely needed.

The customer's latest message takes priority if they explicitly change a requirement.

BUY JOURNEY

For a buyer, relevant property requirements may include:

property type
bedrooms
budget
location
ready-to-move / off-plan / both
purchase timeline
cash / mortgage

Ask ONLY about fields present in state.missing_fields.

If property_status is already:
"ready-to-move"
"off-plan"
or
"both"

do NOT ask about ready/off-plan again.

If financing is already:
"cash"
or
"mortgage"

do NOT ask about financing again.

RENT JOURNEY

For a renter, relevant requirements may include:

property type
bedrooms
rental budget
location
move-in timeline

For rental customers:

Never ask about mortgage.
Never ask about financing.
Never ask about off-plan.
Never ask about ready-to-move vs off-plan.

If intent is rent, financing and property_status are irrelevant unless the customer independently asks about them.

OPEN OPTIONS

If the customer accepts multiple locations, keep them open.

If property_status = "both", that requirement is complete.

If the customer says both options are fine, do not ask them to choose again.

Do not force unnecessary decisions.

CUSTOMER QUESTIONS

If the customer asks a question, answer it first.

You may give short general explanations about:

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

If current market information is required, say a property consultant can confirm it.

CONTACT DETAILS

Do not request contact details during property discovery unless state.missing_fields shows that the property qualification fields are already complete.

The application handles the final contact and handoff stage separately.

OUTPUT

Return plain conversational text only.

Do not output JSON.
Do not use tools.
Do not call functions.
Do not simulate tool calls.
Do not output Markdown.
Do not output HTML.
Do not output headings or bullet symbols.
`;

    const statePrompt = `
CURRENT LEAD STATE:

${JSON.stringify(state || {})}

This state is authoritative.

Rules:

- Any non-null value inside state.lead is already known.
- NEVER ask about a known value again.
- Ask ONLY about fields inside state.missing_fields.
- Do not invent additional qualification requirements.

If intent = "rent":
- ignore financing
- ignore property_status
- never ask cash/mortgage
- never ask ready/off-plan

If intent = "buy":
- financing is relevant only if "financing" is in missing_fields
- property status is relevant only if "property_status" is in missing_fields

If property_status = "both":
- it is already complete
- never ask ready/off-plan again

Never reveal the structured state or mention JSON, fields, missing_fields, extraction, or internal logic.
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

    /*
      NORMAL AI REQUEST
    */
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

    /*
      GPT-OSS occasionally attempts tool syntax even though
      tools are disabled.

      Retry once using an even smaller prompt.
    */
    if (
      !result.response.ok &&
      result.data?.error?.code === "tool_use_failed"
    ) {
      console.warn(
        "Groq tool_use_failed. Retrying once."
      );

      const fallbackPrompt = `
You are NOMAD, a Dubai property qualification assistant.

KNOWN LEAD DATA:

${JSON.stringify(lead)}

STILL MISSING:

${JSON.stringify(missingFields)}

RULES:

Ask only about the missing property information.

Never ask about anything already known.

If intent is "rent":
never ask financing, mortgage, ready-to-move, or off-plan.

If intent is "buy":
ask financing only if financing is missing.
ask property status only if property_status is missing.

If property_status is "both":
never ask about ready/off-plan again.

Keep the response under 60 words.

Plain conversational text only.

No JSON.
No tools.
No function calls.
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

    /*
      ERROR HANDLING
    */
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

    /*
      CLEAN OUTPUT
    */
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
