export async function POST(req) {
  try {
    const { messages } = await req.json();

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
You extract structured lead state from a property conversation.

Your job is to understand what the CUSTOMER has explicitly said.

IMPORTANT:
- Customer messages are the source of truth.
- Do NOT treat suggestions, assumptions, examples, or wording from the assistant as customer requirements.
- If the customer changes a requirement later, the latest explicit customer statement replaces the earlier one.
- Never guess missing information.
- Preserve uncertainty instead of forcing a single choice.

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

LEAD EXTRACTION RULES

intent:
- buy / purchase / buying => "buy"
- rent / lease / renting => "rent"

property_type:
- apartment, villa, townhouse, penthouse, studio, etc.
- If the customer is still open between multiple types, use null for property_type and list the options under state.property_type_options.

bedrooms:
- Preserve the latest explicit bedroom requirement.
- Example: customer first says 2 bedrooms and later says 3 bedrooms => "3"

budget:
- Preserve the customer's meaning.
- Examples:
  "AED 2 million"
  "around AED 1.5 million"
  "AED 1.5 to 1.8 million"
  "around AED 1.5 million, flexible"
- Do not convert an approximate or flexible budget into an exact maximum.

location:
- If one location is selected, store it normally.
- If multiple locations remain acceptable, combine them into one readable string.
- Example: "Dubai Marina, JLT"
- Also list each location separately under state.location_options.
- If the customer later removes one location, use only the latest remaining location(s).

property_status:
Use:
- "ready-to-move"
- "off-plan"
- "both"

If the customer says they are unsure between ready-to-move and off-plan, or explicitly wants both kept open:
- property_status MUST be "both"
- state.property_status_options MUST contain ["ready-to-move", "off-plan"]
- Do not treat this as missing information.

financing:
- mortgage / home loan / bank financing => "mortgage"
- cash / self-funded / cash buyer => "cash"
- If genuinely undecided, use null and record the uncertainty.

timeline:
- Preserve approximate timelines.
- Examples:
  "within 3 months"
  "within 6 months"
  "by year-end"
  "sometime next year"
  "no rush"
- Do not force unnecessary precision.

name:
- Extract only when explicitly provided by the customer.

phone:
- Preserve the customer's phone number as text.

callback_time:
- Preserve the customer's wording.
- Example: "tomorrow morning at 10 AM"

UNCERTAINTY

Record unresolved uncertainty under state.uncertainties.

Examples:
- "unsure about property type"
- "budget is flexible"
- "open to multiple locations"
- "undecided between cash and mortgage"

Do NOT mark something as missing when the customer has intentionally left multiple acceptable options open.

CHANGES AND CORRECTIONS

The latest customer instruction wins.

Examples:

Customer earlier:
"I need 2 bedrooms."

Customer later:
"Actually make it 3 bedrooms."

Result:
"bedrooms": "3"

Customer earlier:
"Marina or JLT."

Customer later:
"I think JLT only."

Result:
"location": "JLT"
"location_options": ["JLT"]

Customer earlier:
"I'm open to ready or off-plan."

Result:
"property_status": "both"

MISSING FIELDS

state.missing_fields should contain only genuinely unknown qualification fields from:

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

Do NOT include a field in missing_fields if:
- multiple acceptable values are already known
- the customer explicitly chose to keep multiple options open
- the field already has sufficient approximate information

LEAD STATUS

lead_status is "Qualified" only when these are sufficiently known:

- intent
- property_type
- bedrooms when relevant
- budget
- location
- property_status
- timeline
- financing
- name
- phone
- callback_time

property_status = "both" counts as known.

Multiple locations count as known.

An approximate budget counts as known.

Otherwise:
"lead_status": "Incomplete"

SUMMARY

Write one short internal sales summary.

Use only customer-provided information.

Do not invent anything.

Example:

"Customer wants to buy a 3-bedroom apartment in JLT around AED 1.5 million, is open to ready-to-move or off-plan, and plans to purchase within 6 months using a mortgage."

Return JSON only.
`,
            },
            ...messages,
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

    return Response.json({
      success: true,
      lead: result.lead,
      state: result.state || {
        location_options: [],
        property_type_options: [],
        property_status_options: [],
        uncertainties: [],
        missing_fields: [],
      },
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
