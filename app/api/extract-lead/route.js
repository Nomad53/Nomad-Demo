export async function POST(req) {
  try {
    const { messages, previous } = await req.json();

    const customerMessages = Array.isArray(messages)
      ? messages.filter((message) => message.role === "user")
      : [];

    const latestCustomerMessage =
      customerMessages[customerMessages.length - 1];

    const previousLead = previous?.lead || {};
    const previousState = previous?.state || {};

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
You update structured Dubai property lead information.

You receive:
1. previously known lead information
2. the customer's latest message

Extract ONLY information explicitly provided or changed in the latest customer message.

Return valid JSON only:

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
    "summary": null
  },
  "state": {
    "location_options": [],
    "property_type_options": [],
    "property_status_options": [],
    "uncertainties": []
  }
}

IMPORTANT:

null means:
"the customer did not provide or change this field in the latest message."

Do NOT use null to erase previous information.

The application will merge new information with previous information.

Normalize:

BUY:
buy / purchase => "buy"

RENT:
rent / lease => "rent"

PROPERTY STATUS:

ready / ready-to-move => "ready-to-move"

off-plan => "off-plan"

If customer accepts both:
=> "both"

Examples:
"both are fine"
"either is fine"
"I'm open to both"
"ready or off-plan"
=> property_status = "both"

FINANCING:

mortgage / home loan / bank finance => "mortgage"

cash / self-funded => "cash"

BUDGET:

Preserve customer meaning and flexibility.

Examples:
"around AED 4 million"
"AED 120k to 140k yearly"

TIMELINE:

Preserve approximate wording.

Examples:
"within 6 months"
"next month"
"no rush"

CALLBACK TIME:

Only extract a callback time explicitly provided by customer.

Never confuse purchase/move-in timeline with callback time.

LOCATION:

If customer gives multiple acceptable locations:
put readable combined value in location
and separate values in location_options.

If customer narrows previous choices:
return the new selected location.

PROPERTY TYPE:

apartment
villa
townhouse
penthouse
studio

BEDROOMS:

Preserve latest explicit bedroom count.

NAME:

Only customer-provided name.

PHONE:

Only customer-provided phone.

Never invent.
Never infer from assistant messages.
Never erase previous information.
`,
            },

            {
              role: "system",
              content: `
PREVIOUS LEAD:

${JSON.stringify(previousLead)}

PREVIOUS STATE:

${JSON.stringify(previousState)}
`,
            },

            ...(latestCustomerMessage
              ? [latestCustomerMessage]
              : []),
          ],

          temperature: 0,
          max_completion_tokens: 400,
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

    let extracted;

    try {
      extracted = JSON.parse(cleanedContent);
    } catch (error) {
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

    const newLead = extracted?.lead || {};
    const newState = extracted?.state || {};

    // Preserve old values unless customer explicitly supplied a new one
    const mergedLead = {
      name: newLead.name ?? previousLead.name ?? null,
      phone: newLead.phone ?? previousLead.phone ?? null,
      intent: newLead.intent ?? previousLead.intent ?? null,
      property_type:
        newLead.property_type ??
        previousLead.property_type ??
        null,
      bedrooms:
        newLead.bedrooms ??
        previousLead.bedrooms ??
        null,
      budget:
        newLead.budget ??
        previousLead.budget ??
        null,
      location:
        newLead.location ??
        previousLead.location ??
        null,
      property_status:
        newLead.property_status ??
        previousLead.property_status ??
        null,
      financing:
        newLead.financing ??
        previousLead.financing ??
        null,
      timeline:
        newLead.timeline ??
        previousLead.timeline ??
        null,
      callback_time:
        newLead.callback_time ??
        previousLead.callback_time ??
        null,
      summary: null,
      lead_status: "Incomplete",
    };

    const mergedState = {
      location_options:
        Array.isArray(newState.location_options) &&
        newState.location_options.length > 0
          ? newState.location_options
          : previousState.location_options || [],

      property_type_options:
        Array.isArray(newState.property_type_options) &&
        newState.property_type_options.length > 0
          ? newState.property_type_options
          : previousState.property_type_options || [],

      property_status_options:
        Array.isArray(newState.property_status_options) &&
        newState.property_status_options.length > 0
          ? newState.property_status_options
          : previousState.property_status_options || [],

      uncertainties:
        Array.isArray(newState.uncertainties) &&
        newState.uncertainties.length > 0
          ? newState.uncertainties
          : previousState.uncertainties || [],

      missing_fields: [],
    };

    const intent = String(
      mergedLead.intent || ""
    ).toLowerCase();

    const propertyType = String(
      mergedLead.property_type || ""
    ).toLowerCase();

    const isBuy = intent === "buy";
    const isRent = intent === "rent";

    const bedroomsKnown =
      Boolean(mergedLead.bedrooms) ||
      propertyType === "studio";

    const missingFields = [];

    if (!mergedLead.intent) {
      missingFields.push("intent");
    }

    if (!mergedLead.property_type) {
      missingFields.push("property_type");
    }

    if (!bedroomsKnown) {
      missingFields.push("bedrooms");
    }

    if (!mergedLead.budget) {
      missingFields.push("budget");
    }

    if (!mergedLead.location) {
      missingFields.push("location");
    }

    // Buyer only
    if (isBuy && !mergedLead.property_status) {
      missingFields.push("property_status");
    }

    if (!mergedLead.timeline) {
      missingFields.push("timeline");
    }

    // Buyer only
    if (isBuy && !mergedLead.financing) {
      missingFields.push("financing");
    }

    if (!mergedLead.name) {
      missingFields.push("name");
    }

    if (!mergedLead.phone) {
      missingFields.push("phone");
    }

    if (!mergedLead.callback_time) {
      missingFields.push("callback_time");
    }

    mergedState.missing_fields = missingFields;

    mergedLead.lead_status =
      missingFields.length === 0
        ? "Qualified"
        : "Incomplete";

    // Deterministic summary
    const summaryParts = [];

    if (mergedLead.name) {
      summaryParts.push(mergedLead.name);
    } else {
      summaryParts.push("Customer");
    }

    if (mergedLead.intent) {
      summaryParts.push(
        `wants to ${mergedLead.intent}`
      );
    }

    if (mergedLead.bedrooms) {
      summaryParts.push(
        `a ${mergedLead.bedrooms}-bedroom`
      );
    }

    if (mergedLead.property_type) {
      summaryParts.push(mergedLead.property_type);
    }

    if (mergedLead.location) {
      summaryParts.push(
        `in ${mergedLead.location}`
      );
    }

    if (mergedLead.budget) {
      summaryParts.push(
        `with a budget of ${mergedLead.budget}`
      );
    }

    if (mergedLead.timeline) {
      summaryParts.push(
        `and timeline ${mergedLead.timeline}`
      );
    }

    if (isBuy && mergedLead.financing) {
      summaryParts.push(
        `using ${mergedLead.financing}`
      );
    }

    mergedLead.summary =
      summaryParts.join(" ") + ".";

    return Response.json({
      success: true,
      lead: mergedLead,
      state: mergedState,
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
