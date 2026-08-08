import OpenAI from 'openai';

const apiKey = process.env.AI_API_KEY;
const baseURL = process.env.AI_API_URL || 'https://api.openai.com/v1';
const modelName = process.env.AI_MODEL_NAME || 'gpt-3.5-turbo';

let openai: OpenAI | null = null;

if (apiKey) {
  openai = new OpenAI({
    apiKey,
    baseURL,
  });
  console.log(`AI Service initialized with base URL: ${baseURL}, model: ${modelName}`);
} else {
  console.warn('AI_API_KEY is missing. AI Service will run in DEMO/MOCK mode.');
}

// Generate summary for a ticket
export async function generateTicketSummary(ticket: any): Promise<string> {
  if (!openai) {
    return `### [DEMO SUMMARY] ${ticket.title}
This is a mock ticket summary because no **AI_API_KEY** was configured in the environment variables.

*   **Status:** ${ticket.status}
*   **Priority:** ${ticket.priority}
*   **Assignee:** ${ticket.assignee || 'Unassigned'}
*   **Description:** ${ticket.description || 'No description provided.'}
*   **Mock Analysis:** Please configure your custom open-source LLM endpoint to enable intelligent summaries!`;
  }

  const prompt = `You are a helpful project manager. Summarize the following ticket details, updates, and comments. 
Generate a clear, structured summary in Markdown including:
1. Current Status & Progress
2. Critical Decisions or Blockers (if any)
3. Recommended Next Actions

Ticket Details:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description'}
- Status: ${ticket.status}
- Priority: ${ticket.priority}
- Assignee: ${ticket.assignee || 'Unassigned'}
- Reporter: ${ticket.reporter || 'Unknown'}
- Created At: ${ticket.created_at || 'Unknown'}
`;

  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: 'You generate professional, structured markdown summaries of project tickets.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
    });
    return response.choices[0]?.message?.content || 'Failed to generate summary.';
  } catch (error: any) {
    console.error('Error calling LLM for ticket summary:', error);
    throw new Error(`LLM Summary call failed: ${error.message || error}`);
  }
}

// Chat assistant with project context
export async function chatWithCopilot(
  message: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  tickets: any[],
  users: any[],
  currentUser: { name: string; role: string }
): Promise<string> {
  if (!openai) {
    return `Hi ${currentUser.name}! I am currently running in **demo mode** because no **AI_API_KEY** is configured in your project settings.

However, I can see that there are currently **${tickets.length} tickets** and **${users.length} team members** in your workspace!

To activate my full brain using your custom open-source LLM, please add the following environment variables in Vercel or your local \`.env\` file:
*   \`AI_API_URL\`
*   \`AI_API_KEY\`
*   \`AI_MODEL_NAME\``;
  }

  // Format tickets context
  const ticketsContext = tickets
    .slice(0, 30) // Limit to latest 30 tickets to save tokens
    .map(t => `- [${t.id}] ${t.title} (${t.status}, Priority: ${t.priority}, Assignee: ${t.assignee || 'Unassigned'})`)
    .join('\n');

  // Format users context
  const usersContext = users
    .map(u => `- ${u.name} (${u.email}, Role: ${u.role})`)
    .join('\n');

  const systemPrompt = `You are TaskFlow Copilot, an AI assistant for the TaskFlow project management platform.
You are helping user ${currentUser.name} who has the role of ${currentUser.role}.

Below is the current state of the workspace fetched from the database:
=== TICKETS ===
${ticketsContext || 'No tickets found in database.'}

=== TEAM MEMBERS ===
${usersContext || 'No users found in database.'}

Guidelines:
1. Answer the user's question based strictly on the provided workspace state.
2. If the user asks about tickets, reference them using their ID (e.g. ticket:id).
3. Be professional, clear, and use markdown formatting for lists or tables.
4. Keep your answers concise and focused. Do not hallucinate tickets or users not present in the lists.
`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: messages as any,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content || 'No response from assistant.';
  } catch (error: any) {
    console.error('Error calling LLM for Copilot chat:', error);
    throw new Error(`LLM Chat call failed: ${error.message || error}`);
  }
}
