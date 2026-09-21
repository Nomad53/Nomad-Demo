export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Extraction only trusts information explicitly provided by the customer.
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
You extract structured lead information from CUSTOMER messages in a Dubai property conversation.

You receive only customer messages.

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
- Never invent or infer a requirement simply because it is common.
- The latest explicit customer instruction replaces older information.
- Preserve approximate information.
- Preserve uncertainty.
- Multiple acceptable options are valid.
- Buying and renting are different journeys.
- Do not assume buyer-only information is required for a rental lead.

INTENT

Normalize:

buy / buying / purchase / purchasing
=> "buy"

rent / renting / lease / leasing
=> "rent"

PROPERTY TYPE

Examples:

apartment
villa
townhouse
penthouse
studio

If the customer remains open to multiple property types:

"property_type": null

and list acceptable options in:

"property_type_options"

BEDROOMS

Preserve the latest bedroom requirement.

Example:

Earlier:
"I need 2 bedrooms."

Later:
"Actually make it 3."

Result:

"bedrooms": "3"

A studio does not require a bedroom count.

BUDGET

Preserve the customer's intended meaning.

Buying examples:

"AED 2 million"
"around AED 1.5 million"
"AED 1.5 to 1.8 million"
"around AED 1.5 million, flexible"

Rental examples:

"AED 120k yearly"
"AED 120k to 140k per year"
"around AED 10k monthly"
"up to AED 150k annually"

Do not convert an approximate or flexible budget into a strict maximum.

Preserve whether the customer states monthly or annual rent.

LOCATION

If one location remains:

store it normally.

If multiple locations remain acceptable:

combine them into a readable string and also list them separately.

Example:

"location": "Dubai Marina, JLT"

"location_options": [
  "Dubai Marina",
  "JLT"
]

If the customer later narrows the choice, use only the latest remaining location or locations.

PROPERTY STATUS

This field is mainly relevant to BUYERS.

Allowed values:

"ready-to-move"
"off-plan"
"both"

For BUY leads:

If the customer is open to both ready-to-move and off-plan:

"property_status": "both"

and:

"property_status_options": [
  "ready-to-move",
  "off-plan"
]

For RENT leads:

- property_status is NOT required for qualification.
- Do not invent a property_status.
- If the customer explicitly says something such as "ready to move", you may preserve it.
- Otherwise property_status may remain null.

FINANCING

This field is relevant to BUYERS.

Normalize:

mortgage
home loan
bank financing
finance
=> "mortgage"

cash
cash buyer
self-funded
=> "cash"

For BUY leads:

- preserve financing when explicitly stated.
- if undecided, use null and record the uncertainty.

For RENT leads:

- financing is NOT required.
- Do not ask or infer whether the renter will use cash or mortgage.
- financing should normally remain null unless the customer explicitly says something relevant.

TIMELINE

Preserve approximate timing.

Buying examples:

"within 3 months"
"within 6 months"
"by year-end"
"sometime next year"
"no rush"

Rental examples:

"next month"
"within 2 months"
"moving in December"
"as soon as possible"
"no rush"

Do not force unnecessary precision.

NAME

Extract only when explicitly provided by the customer.

PHONE

Extract only when explicitly provided by the customer.

CALLBACK TIME

callback_time must ONLY contain a time explicitly supplied by the CUSTOMER for when they want to be contacted.

Examples that count:

"Tomorrow at 10 AM"
"Call me after 4"
"Monday morning"
"Anytime after lunch"
"Tonight around 7"

If the customer has NOT explicitly provided a callback time:

"callback_time": null

Never invent it.
Never infer it from their purchase or move-in timeline.

CHANGES

The latest customer instruction wins.

Example:

Earlier:
"Marina or JLT"

Later:
"JLT only"

Result:

"location": "JLT"

"location_options": [
  "JLT"
]

UNCERTAINTIES

Use uncertainties for unresolved choices.

Examples:

"budget is flexible"
"open to multiple locations"
"open to several property types"
"undecided between cash and mortgage"

Do not treat intentionally open options as missing if they are already sufficient for qualification.

SUMMARY

Write one concise internal sales summary using customer-provided information only.

BUY example:

"Customer wants to buy a 3-bedroom apartment in JLT around AED 1.5 million, is open to ready-to-move or off-plan, and plans to purchase within 6 months using a mortgage."

RENT example:

"Customer wants to rent a 2-bedroom apartment in Dubai Marina or JLT for AED 120k–140k annually and plans to move within 2 months."

Do not invent anything.

IMPORTANT

lead_status and missing_fields will be validated by application code after your response.

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
      console.error(
        "Extraction JSON parse failed:",
        cleanedContent
      );

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

    const intent = String(lead.intent || "").toLowerCase();

    const propertyType = String(
      lead.property_type || ""
    ).toLowerCase();

    const isBuy = intent === "buy";
    const isRent = intent === "rent";

    // Studio does not require a bedroom count.
    const bedroomsKnown =
      Boolean(lead.bedrooms) ||
      propertyType === "studio";

    /*
      QUALIFICATION RULES

      BUY:
      intent
      property type
      bedrooms (unless studio)
      budget
      location
      property status
      timeline
      financing
      name
      phone
      callback time

      RENT:
      intent
      property type
      bedrooms (unless studio)
      budget
      location
      timeline
      name
      phone
      callback time

      Rent does NOT require:
      property_status
      financing
    */

    let requiredFieldsKnown = false;

    if (isBuy) {
      requiredFieldsKnown =
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
    }

    if (isRent) {
      requiredFieldsKnown =
        Boolean(lead.intent) &&
        Boolean(lead.property_type) &&
        bedroomsKnown &&
        Boolean(lead.budget) &&
        Boolean(lead.location) &&
        Boolean(lead.timeline) &&
        Boolean(lead.name) &&
        Boolean(lead.phone) &&
        Boolean(lead.callback_time);
    }

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

    /*
      Rebuild missing_fields in code so the AI
      cannot accidentally force buyer questions
      into a rental conversation.
    */

    const missingFields = [];

    if (!lead.intent) {
      missingFields.push("intent");
    }

    if (!lead.property_type) {
      missingFields.push("property_type");
    }

    if (!bedroomsKnown) {
      missingFields.push("bedrooms");
    }

    if (!lead.budget) {
      missingFields.push("budget");
    }

    if (!lead.location) {
      missingFields.push("location");
    }

    /*
      Buyer-only property stage.
    */
    if (isBuy && !lead.property_status) {
      missingFields.push("property_status");
    }

    if (!lead.timeline) {
      missingFields.push("timeline");
    }

    /*
      Buyer-only financing.
    */
    if (isBuy && !lead.financing) {
      missingFields.push("financing");
    }

    if (!lead.name) {
      missingFields.push("name");
    }

    if (!lead.phone) {
      missingFields.push("phone");
    }

    if (!lead.callback_time) {
      missingFields.push("callback_time");
    }

    state.missing_fields = missingFields;

    return Response.json({
      success: true,
      lead,
      state,
    });
  } catch (error) {
    console.error(
      "Lead extraction failed:",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Lead extraction failed",
      },
      { status: 500 }
    );
  }
}
