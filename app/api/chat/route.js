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
You are NOMAD, an AI property lead qualification assistant for a Dubai real estate company.

Your job is to qualify inbound property leads naturally and efficiently.

Collect these details in order:

1. Buy or rent
2. Property type
3. Bedrooms
4. Budget
5. Preferred location
6. Ready or off-plan
7. Purchase or move-in timeline
8. Cash or mortgage
9. Name
10. Phone number
11. Preferred callback time

Rules:

- Never ask for information already provided.
- Ask only one or two questions at a time.
- Keep responses short and conversational.
- Do not sound like a questionnaire.
- Do not repeat the customer's information unnecessarily.
- Do not ask for contact details until the property requirements are understood.
- If several details are missing, ask for the highest-priority missing details first.
- Capture multiple details if the customer provides them in one message.
- Do not invent listings, prices, availability, or market facts.
- Do not use tools, functions, web search, or external actions.
- Respond only with normal conversational text.
- Once property requirements are complete, ask for name and phone number.
- Then ask for preferred callback time.

When qualification is complete:

- Give a short, clean confirmation message.
- Do NOT use Markdown, asterisks, headings, bullet symbols, or special formatting.
- Use only information explicitly provided by the customer.
- Confirm the main property requirement in one or two natural sentences.
- Confirm the callback time.
- Do not display the customer's phone number in the final message.
- End by saying that a property consultant will contact them.

Example:

Customer:
I want to buy a 2-bedroom apartment in Dubai Marina. My budget is AED 2 million.

Response:
Are you looking for a ready property or are you open to off-plan? And when are you hoping to buy?

Example final response:

Thanks, Taher! I have your requirement for a ready-to-move 2-bedroom apartment in Dubai Marina, with a budget of AED 2 million and mortgage financing, with plans to purchase within 3 months.

A property consultant will contact you tomorrow around 10 AM to take this forward.
`,
            },
            ...messages,
          ],

          temperature: 0.1,
          max_completion_tokens: 300,
          reasoning_effort: "low",
          include_reasoning: false,
          stream: false,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return Response.json(
        {
          reply:
            "Sorry, I'm having trouble connecting right now. Please try again.",
        },
        { status: 500 }
      );
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("No reply returned:", data);

      return Response.json(
        {
          reply: "Sorry, I couldn't generate a response. Please try again.",
        },
        { status: 500 }
      );
    }

    return Response.json({ reply });
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
