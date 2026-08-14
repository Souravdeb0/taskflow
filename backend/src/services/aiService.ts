import { safeMerge } from '../config/db.js';
import { StringRecordId } from 'surrealdb';

const requestCounts = new Map<string, { count: number, resetTime: number }>();

function getAIConfig() {
  return {
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/',
    modelName: process.env.AI_MODEL_NAME || 'gemini-3.5-flash'
  };
}

if (process.env.AI_API_KEY) {
  console.log(`AI Service initialized natively with model: ${process.env.AI_MODEL_NAME}`);
}

export async function* generateTicketSummaryStream(ticket: any): AsyncGenerator<string, void, unknown> {
  const { apiKey, baseURL, modelName } = getAIConfig();

  if (!apiKey) {
    yield `### [DEMO SUMMARY] ${ticket.title}\n`;
    yield `This is a mock ticket summary because no **AI_API_KEY** was configured.\n\n`;
    yield `*   **Status:** ${ticket.status}\n`;
    yield `*   **Priority:** ${ticket.priority}\n`;
    yield `*   **Assignee:** ${ticket.assignee || 'Unassigned'}\n`;
    return;
  }

  const prompt = `You are a helpful project manager. Summarize the following ticket details.
Generate a clear, structured summary in Markdown including:
1. Current Status & Progress
2. Critical Decisions or Blockers
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
    let response: Response;
    let retries = 3;
    for (let attempt = 1; attempt <= retries; attempt++) {
      response = await fetch(`${baseURL.replace(/\/$/, '')}/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'You generate professional, structured markdown summaries of project tickets.' }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });
      
      if (!response.ok) {
          if (response.status === 429 || response.status === 503) {
            if (attempt < retries) {
              console.warn(`Summary rate limit or 503 hit (${response.status}). Retrying in ${attempt * 3} seconds...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 3000));
              continue;
            }
            throw new Error(`API error (${response.status}) after multiple retries.`);
          }
          throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
      }
      break;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of response!.body as any) {
      buffer += decoder.decode(chunk, { stream: true });
      let lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.trim().slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) yield text;
          } catch (e) {
            // Ignore parse errors for incomplete chunks if any
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Error calling LLM for ticket summary:', error);
    yield `\n\n**Error:** ${error.message || error}`;
  }
}

export async function* chatWithCopilotStream(
  message: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  tickets: any[],
  users: any[],
  currentUser: { name: string; role: string }
): AsyncGenerator<string, void, unknown> {
  const { apiKey, baseURL, modelName } = getAIConfig();

  if (!apiKey) {
    yield `Hi ${currentUser.name}! I am currently running in **demo mode**.\n`;
    yield `Please add the AI_API_KEY environment variable.`;
    return;
  }

  const now = Date.now();
  const userRate = requestCounts.get(currentUser.name) || { count: 0, resetTime: now + 60000 };
  if (now > userRate.resetTime) {
    userRate.count = 1;
    userRate.resetTime = now + 60000;
  } else {
    if (userRate.count >= 10) {
      yield 'Rate limit exceeded (Backend limits). Please wait a minute before sending more messages.';
      return;
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
4. Keep your answers concise and focused.`;

  const mappedHistory = chatHistory.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }]
  }));

  const contents = [...mappedHistory, { role: 'user', parts: [{ text: message }] }];

  const tools = [{
    functionDeclarations: [
      {
        name: 'updateTicket',
        description: 'Updates the status or priority of a ticket based on user request.',
        parameters: {
          type: 'OBJECT',
          properties: {
            ticketId: { type: 'STRING', description: 'The exact ID of the ticket' },
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
            priority: { type: 'STRING', description: 'Optional priority filter' },
            status: { type: 'STRING', description: 'Optional status filter' }
          }
        }
      },
      {
        name: 'fetchUsers',
        description: 'Fetches all team members in the workspace.',
        parameters: { type: 'OBJECT', properties: {} }
      }
    ]
  }];

  const makeRequestStream = async function* (currentContents: any[], retries = 3): AsyncGenerator<string, any, unknown> {
    let response: Response;
    for (let attempt = 1; attempt <= retries; attempt++) {
      response = await fetch(`${baseURL.replace(/\/$/, '')}/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: currentContents,
          tools: tools
        })
      });
      
      if (!response.ok) {
          if (response.status === 429 || response.status === 503) {
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, attempt * 3000));
              continue;
            }
            throw new Error(`API error (${response.status}) after multiple retries.`);
          }
          throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
      }
      break;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullFunctionCall: any = null;
    let modelParts: any[] = [];

    for await (const chunk of response!.body as any) {
      buffer += decoder.decode(chunk, { stream: true });
      let lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.trim().slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            const parts = data.candidates?.[0]?.content?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.text) yield part.text;
                if (part.functionCall) fullFunctionCall = part.functionCall;
                if (!part.text) modelParts.push(part); // Capture thought_signature, executableCode, etc.
              }
            }
          } catch (e) {}
        }
      }
    }
    return { fullFunctionCall, modelParts };
  };

  try {
    let currentContents = contents;
    while (true) {
      let streamResult: any = yield* makeRequestStream(currentContents);
      
      if (!streamResult?.fullFunctionCall) {
        break; // Text generation finished natively
      }

      const call = streamResult.fullFunctionCall;
      
      // Push all accumulated non-text parts (including thought_signature and the functionCall itself) back to context
      currentContents.push({ role: 'model', parts: streamResult.modelParts.length ? streamResult.modelParts : [{ functionCall: call }] });

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
          resultMessage = `Failed to update ticket: ${dbError.message}`;
        }
        resultData = resultMessage;
      } else if (call.name === 'fetchTickets') {
        const { priority, status } = call.args || {};
        const filtered = tickets.filter(t => 
          (!priority || t.priority?.toLowerCase() === priority.toLowerCase()) &&
          (!status || t.status?.toLowerCase() === status.toLowerCase())
        );
        resultData = filtered.length ? filtered.map(t => `- [${t.id}] ${t.title} (${t.status}, ${t.priority})`).join('\n') : 'No tickets found.';
      } else if (call.name === 'fetchUsers') {
        resultData = users.map(u => `- ${u.name} (${u.role})`).join('\n');
      }

      currentContents.push({
        role: 'user',
        parts: [{ functionResponse: { name: call.name, response: { name: call.name, content: resultData } } }]
      });
      // The while loop will now recurse and trigger makeRequestStream again with the new context!
    }
  } catch (error: any) {
    console.error('Error in chat loop:', error);
    yield `\n\n**Error:** ${error.message || error}`;
  }
}
