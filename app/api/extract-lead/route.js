export async function POST(req) {
  try {
    const { messages } = await req.json();

    // IMPORTANT:
    // Extraction should only use information explicitly provided by the customer.
    const customerMessages = Array.isArray(messages)
      ? messages.filter((message) => message.role === "user")
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
You extract structured lead state from CUSTOMER messages in a property conversation.

You will ONLY receive messages written by the customer.

Never guess missing information.

Return ONLY valid JSON in exactly this structure:

{
  "lead": {
    "name": null,
    "phone": null,
    "intent": null,
    "property_type": null,
    "bedrooms": null,
    "budget": null,
    "location": null,
    "property_status": null,
    "financing": null,
    "timeline": null,
    "callback_time": null,
    "lead_status": "Incomplete",
    "summary": null
  },
  "state": {
    "location_options": [],
    "property_type_options": [],
    "property_status_options": [],
    "uncertainties": [],
    "missing_fields": []
  }
}

GENERAL RULES

- Use only information explicitly stated by the customer.
- Never invent or infer a detail just because it would normally be expected.
- If the customer changes a requirement, the latest statement wins.
- Preserve approximate information.
- Preserve uncertainty.
- Multiple acceptable options are valid.

INTENT

Examples:
- buy / buying / purchase => "buy"
- rent / renting / lease => "rent"

PROPERTY TYPE

Examples:
- apartment
- townhouse
- villa
- penthouse
- studio

If the customer remains open to multiple property types:
- property_type = null
- place the acceptable options inside property_type_options

BEDROOMS

Preserve the latest customer requirement.

Example:
Earlier: "2 bedrooms"
Later: "Actually make it 3 bedrooms"

Result:
"bedrooms": "3"

BUDGET

Preserve the customer's meaning.

Examples:
- "AED 2 million"
- "around AED 1.5 million"
- "AED 1.5 to 1.8 million"
- "around AED 1.5 million, flexible"

Do not turn an approximate budget into an exact maximum.

LOCATION

If one location remains:
- store that location normally.

If multiple locations remain acceptable:
- combine them into a readable location string
- also list them separately in location_options

Example:

"location": "Dubai Marina, JLT"
"location_options": ["Dubai Marina", "JLT"]

If the customer later narrows the choice:
use only the latest location or locations.

PROPERTY STATUS

Allowed values:
- "ready-to-move"
- "off-plan"
- "both"

If the customer is open to both or says they are unsure between them:

"property_status": "both"

and:

"property_status_options": [
  "ready-to-move",
  "off-plan"
]

This counts as known information.

FINANCING

Examples:

mortgage / bank financing / home loan
=> "mortgage"

cash / cash buyer / self-funded
=> "cash"

If genuinely undecided:
- financing = null
- record the uncertainty

TIMELINE

Preserve approximate timing.

Examples:
- "within 3 months"
- "within 6 months"
- "by year-end"
- "sometime next year"
- "no rush"

NAME

Extract only when the customer explicitly gives their name.

PHONE

Extract only when the customer explicitly gives a phone number.

CALLBACK TIME

This rule is extremely important.

callback_time must ONLY contain a time explicitly supplied by the CUSTOMER for when they want to be contacted.

Examples that count:

"Tomorrow at 10 AM"
"Call me after 4"
"Monday morning"
"Anytime after lunch"
"Tonight around 7"

If the customer has NOT explicitly given a preferred callback time:

"callback_time": null

Never invent callback_time.
Never assume one.
Never infer it from another timeline.

CHANGES

The latest customer instruction wins.

Example:

Earlier:
"Marina or JLT"

Later:
"JLT only"

Result:

"location": "JLT"
"location_options": ["JLT"]

UNCERTAINTIES

Use uncertainties for genuine unresolved choices.

Examples:
- "budget is flexible"
- "undecided about financing"
- "open to several property types"

Do not treat a deliberately open option as missing if it is already sufficient for qualification.

MISSING FIELDS

List only genuinely missing qualification fields from:

- intent
- property_type
- bedrooms
- budget
- location
- property_status
- timeline
- financing
- name
- phone
- callback_time

If callback_time is null:
"callback_time" MUST appear in missing_fields.

SUMMARY

Write one concise internal sales summary using customer-provided information only.

Do not invent anything.

IMPORTANT:

Return JSON only.
`,
            },

            ...customerMessages,
          ],

          temperature: 0,
          max_completion_tokens: 650,
          reasoning_effort: "low",
          include_reasoning: false,
          stream: false,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Extraction error:", data);

      return Response.json(
        {
          success: false,
          error: "Extraction request failed",
        },
        { status: 500 }
      );
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No extraction content returned:", data);

      return Response.json(
        {
          success: false,
          error: "No extraction content",
        },
        { status: 500 }
      );
    }

    const cleanedContent = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let result;

    try {
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Extraction JSON parse failed:", cleanedContent);

      return Response.json(
        {
          success: false,
          error: "Invalid extraction JSON",
        },
        { status: 500 }
      );
    }

    if (!result?.lead) {
      console.error("Missing lead object:", result);

      return Response.json(
        {
          success: false,
          error: "Invalid extraction structure",
        },
        { status: 500 }
      );
    }

    const lead = result.lead;

    const propertyType = String(lead.property_type || "").toLowerCase();

    // Studio does not need a bedroom count.
    const bedroomsKnown =
      Boolean(lead.bedrooms) || propertyType === "studio";

    // QUALIFICATION IS DECIDED HERE, NOT BY THE AI.
    const requiredFieldsKnown =
      Boolean(lead.intent) &&
      Boolean(lead.property_type) &&
      bedroomsKnown &&
      Boolean(lead.budget) &&
      Boolean(lead.location) &&
      Boolean(lead.property_status) &&
      Boolean(lead.timeline) &&
      Boolean(lead.financing) &&
      Boolean(lead.name) &&
      Boolean(lead.phone) &&
      Boolean(lead.callback_time);

    lead.lead_status = requiredFieldsKnown
      ? "Qualified"
      : "Incomplete";

    const state = result.state || {
      location_options: [],
      property_type_options: [],
      property_status_options: [],
      uncertainties: [],
      missing_fields: [],
    };

    // Make sure missing_fields reflects reality.
    const missingFields = [];

    if (!lead.intent) missingFields.push("intent");
    if (!lead.property_type) missingFields.push("property_type");
    if (!bedroomsKnown) missingFields.push("bedrooms");
    if (!lead.budget) missingFields.push("budget");
    if (!lead.location) missingFields.push("location");
    if (!lead.property_status) missingFields.push("property_status");
    if (!lead.timeline) missingFields.push("timeline");
    if (!lead.financing) missingFields.push("financing");
    if (!lead.name) missingFields.push("name");
    if (!lead.phone) missingFields.push("phone");
    if (!lead.callback_time) missingFields.push("callback_time");

    state.missing_fields = missingFields;

    return Response.json({
      success: true,
      lead,
      state,
    });
  } catch (error) {
    console.error("Lead extraction failed:", error);

    return Response.json(
      {
        success: false,
        error: "Lead extraction failed",
      },
      { status: 500 }
    );
  }
}
