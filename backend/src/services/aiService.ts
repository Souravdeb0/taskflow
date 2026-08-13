import { safeMerge } from '../config/db.js';
import { StringRecordId } from 'surrealdb';

const requestCounts = new Map<string, { count: number, resetTime: number }>();

// Read dynamically to avoid import hoisting loading issues with dotenv
function getAIConfig() {
  return {
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/',
    modelName: process.env.AI_MODEL_NAME || 'gemini-1.5-flash'
  };
}

if (process.env.AI_API_KEY) {
  console.log(`AI Service initialized natively with model: ${process.env.AI_MODEL_NAME}`);
} else {
  // It might still be undefined here if this file is imported before dotenv config runs
}

// Generate summary for a ticket
export async function generateTicketSummary(ticket: any): Promise<string> {
  const { apiKey, baseURL, modelName } = getAIConfig();

  if (!apiKey) {
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
    const response = await fetch(`${baseURL.replace(/\/$/, '')}/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You generate professional, structured markdown summaries of project tickets.' }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      })
    });
    
    if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded (HTTP 429). The Gemini API free tier allows a limited number of requests per minute. Please wait a moment and try again.');
        }
        throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate summary.';
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
  const { apiKey, baseURL, modelName } = getAIConfig();

  if (!apiKey) {
    return `Hi ${currentUser.name}! I am currently running in **demo mode** because no **AI_API_KEY** is configured in your project settings.

However, I can see that there are currently **${tickets.length} tickets** and **${users.length} team members** in your workspace!

To activate my full brain using your custom open-source LLM, please add the following environment variables in Vercel or your local \`.env\` file:
*   \`AI_API_URL\`
*   \`AI_API_KEY\`
*   \`AI_MODEL_NAME\``;
  }

  const now = Date.now();
  const userRate = requestCounts.get(currentUser.name) || { count: 0, resetTime: now + 60000 };
  if (now > userRate.resetTime) {
    userRate.count = 1;
    userRate.resetTime = now + 60000;
  } else {
    if (userRate.count >= 10) {
      return 'Rate limit exceeded (Backend limits). Please wait a minute before sending more messages.';
    }
    userRate.count++;
  }
  requestCounts.set(currentUser.name, userRate);

  const systemPrompt = `You are TaskFlow Copilot, an AI assistant for the TaskFlow project management platform.
You are helping user ${currentUser.name} who has the role of ${currentUser.role}.

Guidelines:
1. You do not have the tickets or users in your context by default. If the user asks about tickets or team members, you MUST use the fetchTickets or fetchUsers tools to retrieve them.
2. If the user asks to update a ticket, use the updateTicket tool.
3. Be professional, clear, and use markdown formatting for lists or tables.
4. Keep your answers concise and focused.
`;

  const mappedHistory = chatHistory.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }]
  }));

  const contents = [
    ...mappedHistory,
    { role: 'user', parts: [{ text: message }] }
  ];

  const tools = [{
    functionDeclarations: [
      {
        name: 'updateTicket',
        description: 'Updates the status or priority of a ticket based on user request.',
        parameters: {
          type: 'OBJECT',
          properties: {
            ticketId: { type: 'STRING', description: 'The exact ID of the ticket, e.g. ticket:v982nulkqq468q0z3uwz' },
            status: { type: 'STRING', description: 'The new status to set, e.g., Todo, In Progress, Done' },
            priority: { type: 'STRING', description: 'The new priority to set, e.g., Low, Medium, High' }
          },
          required: ['ticketId']
        }
      },
      {
        name: 'fetchTickets',
        description: 'Fetches tickets from the workspace. Use this when the user asks about tickets.',
        parameters: {
          type: 'OBJECT',
          properties: {
            priority: { type: 'STRING', description: 'Optional priority filter, e.g., Low, Medium, High' },
            status: { type: 'STRING', description: 'Optional status filter, e.g., Todo, In Progress, Done' }
          }
        }
      },
      {
        name: 'fetchUsers',
        description: 'Fetches all team members in the workspace.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      }
    ]
  }];

  try {
    const makeRequest = async (currentContents: any[]) => {
      const response = await fetch(`${baseURL.replace(/\/$/, '')}/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: currentContents,
          tools: tools
        })
      });
      
      if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded (HTTP 429). The Gemini API free tier allows a limited number of requests per minute. Please wait a moment and try again.');
          }
          throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
      }
      return await response.json();
    };

    let data = await makeRequest(contents);
    let part = data.candidates?.[0]?.content?.parts?.[0];

    // Loop to handle potential multiple sequential function calls
    while (part?.functionCall) {
      const call = part.functionCall;
      
      // Add the model's full message (including any thought_signatures) to context
      contents.push(data.candidates[0].content);

      let resultData: any = '';

      if (call.name === 'updateTicket') {
        const { ticketId, status, priority } = call.args;
        let resultMessage = 'Ticket updated successfully.';
        try {
          const tRecordId = ticketId.startsWith('ticket:') ? ticketId : `ticket:${ticketId}`;
          await safeMerge(new StringRecordId(tRecordId), {
            ...(status && { status }),
            ...(priority && { priority }),
            updated_at: new Date().toISOString()
          });
        } catch (dbError: any) {
          console.error('Database update failed:', dbError);
          resultMessage = `Failed to update ticket: ${dbError.message}`;
        }
        resultData = resultMessage;
      } else if (call.name === 'fetchTickets') {
        const { priority, status } = call.args || {};
        const filtered = tickets.filter(t => 
          (!priority || t.priority?.toLowerCase() === priority.toLowerCase()) &&
          (!status || t.status?.toLowerCase() === status.toLowerCase())
        );
        resultData = filtered.length ? filtered.map(t => `- [${t.id}] ${t.title} (${t.status}, Priority: ${t.priority}, Assignee: ${t.assignee || 'Unassigned'})`).join('\n') : 'No tickets found matching criteria.';
      } else if (call.name === 'fetchUsers') {
        resultData = users.map(u => `- ${u.name} (${u.email}, Role: ${u.role})`).join('\n');
      }

      // Add the function response to context
      contents.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name: call.name,
            response: { name: call.name, content: resultData }
          }
        }]
      });

      // Request final text answer from the model (or another function call)
      data = await makeRequest(contents);
      part = data.candidates?.[0]?.content?.parts?.[0];
    }

    return part?.text || 'No response from assistant.';
  } catch (error: any) {
    console.error('Error calling LLM for Copilot chat:', error);
    throw new Error(`LLM Chat call failed: ${error.message || error}`);
  }
}
