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
Extract the lead information from this property conversation.

Return ONLY valid JSON in this exact format:

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

Rules:
- Use null when information is missing.
- lead_status should be "Qualified" only when the property requirements, name, phone, and callback time are all known.
- Otherwise lead_status should be "Incomplete".
- Return JSON only.
`,
            },
            ...messages,
          ],
          temperature: 0,
          max_completion_tokens: 400,
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

    const lead = JSON.parse(content);

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
