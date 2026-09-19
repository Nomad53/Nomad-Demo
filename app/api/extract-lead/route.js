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
Extract structured lead information from this Dubai property conversation.

Return ONLY valid JSON in exactly this format:

{
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
}

Extraction rules:

- Use only information explicitly stated by the customer.
- Never guess.
- Use null only when the information is genuinely missing.

Field mapping:

- intent:
  - "buy", "purchase", "looking to buy" => "buy"
  - "rent", "lease", "looking to rent" => "rent"

- property_type:
  - apartment, villa, townhouse, penthouse, etc.

- bedrooms:
  - preserve the bedroom count, e.g. "2"

- budget:
  - preserve the customer's stated budget in readable form, e.g. "AED 2 million"

- location:
  - preserve the stated preferred area, e.g. "Dubai Marina"

- property_status:
  - "ready", "ready to move", "ready-to-move" => "ready-to-move"
  - "off plan", "off-plan" => "off-plan"

- financing:
  - "mortgage", "home loan", "bank financing", "finance" => "mortgage"
  - "cash", "cash buyer", "self funded", "self-funded" => "cash"
  - If the customer clearly says they will use a mortgage, financing MUST be "mortgage".
  - If the customer clearly says they will pay cash, financing MUST be "cash".

- timeline:
  - preserve the stated purchase or move-in timeline, e.g. "within 3 months"

- callback_time:
  - preserve the requested callback time, e.g. "tomorrow morning at 10 AM"

Lead status:
- "Qualified" only if all of these are known:
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

- Otherwise use "Incomplete".

Summary:
- Write one concise sentence summarizing the lead.
- Do not invent any detail.
- Example:
  "Taher wants to buy a ready-to-move 2-bedroom apartment in Dubai Marina with a budget of AED 2 million, using a mortgage, within 3 months."

Return JSON only.
`,
            },
            ...messages,
          ],
          temperature: 0,
          max_completion_tokens: 450,
          reasoning_effort: "low",
          include_reasoning: false,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Extraction error:", data);
      return Response.json({ success: false }, { status: 500 });
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No extraction content returned:", data);
      return Response.json({ success: false }, { status: 500 });
    }

    const cleanedContent = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const lead = JSON.parse(cleanedContent);

    return Response.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error("Lead extraction failed:", error);

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}
