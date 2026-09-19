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
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `
You are NOMAD, an AI property lead qualification assistant for a Dubai real estate company.

Your job is to naturally qualify property leads.

Collect:
- buy or rent
- property type
- bedrooms
- budget
- preferred location
- ready or off-plan
- timeline
- cash or mortgage
- name
- phone number
- preferred callback time

Rules:
- Ask only one or two questions at a time.
- Keep replies concise and conversational.
- Do not repeat information the customer has already given.
- Do not invent property listings.
- If you do not know something, say a property consultant can confirm it.
- Gradually collect the missing information.
- Once enough information is collected, summarize the requirement and suggest a callback.
`,
            },
            ...messages,
          ],
          temperature: 0.4,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return Response.json(
        {
          reply: "Sorry, I'm having trouble connecting right now. Please try again.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      reply:
        data.choices?.[0]?.message?.content ||
        "Sorry, I couldn't generate a response.",
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
