import { Response } from 'express';
import { Table, StringRecordId } from 'surrealdb';
import { db, safeQuery, safeSelect, safeMerge } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Create a new common chat room
export async function createChatHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, members } = req.body;
    const creatorId = req.user!.id;

    if (req.user?.role !== 'Admin' && req.user?.role !== 'Manager') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can create chat rooms' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Chat room name is required' });
    }

    const now = new Date().toISOString();
    // Normalize member IDs to ensure they are StringRecordIds
    const memberRecordIds = (members || []).map((m: string) => new StringRecordId(m.startsWith('user:') ? m : `user:${m}`));

    // Add creator to members if not already present
    if (!memberRecordIds.some((m: any) => m.toString() === creatorId)) {
      memberRecordIds.push(new StringRecordId(creatorId));
    }

    const rawChat = await (db as any).create(new Table('chat'), {
      name: name.trim(),
      created_by: new StringRecordId(creatorId),
      members: memberRecordIds,
      created_at: now,
    });

    const chat = Array.isArray(rawChat) ? rawChat[0] : rawChat;
    res.status(201).json({ message: 'Chat room created successfully', chat });
  } catch (error) {
    console.error('Failed to create chat:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
}

// Get all chats the user has access to
export async function getChatsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let queryStr = '';
    const bindings: any = {};

    if (userRole === 'Admin') {
      queryStr = 'SELECT * FROM chat ORDER BY created_at DESC FETCH members, created_by';
    } else {
      queryStr = 'SELECT * FROM chat WHERE created_by = $userId OR $userId IN members ORDER BY created_at DESC FETCH members, created_by';
      bindings.userId = new StringRecordId(userId);
    }

    const rawChats = await safeQuery(queryStr, bindings);
    const chats = Array.isArray(rawChats[0]) ? rawChats[0] : [];

    res.json({ chats });
  } catch (error) {
    console.error('Failed to get chats:', error);
    res.status(500).json({ error: 'Failed to retrieve chat rooms' });
  }
}

// Update members of a chat room (add/remove employees)
export async function updateChatMembersHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { members } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const chatRecordId = id.startsWith('chat:') ? id : `chat:${id}`;
    const rawChat = await safeSelect(new StringRecordId(chatRecordId));
    const chat = Array.isArray(rawChat) ? rawChat[0] : rawChat;

    if (!chat) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const creatorIdStr = typeof chat.created_by === 'string' ? chat.created_by : chat.created_by.id;
    if (userRole !== 'Admin' && creatorIdStr !== userId) {
      return res.status(403).json({ error: 'Forbidden: Only the chat creator or an Admin can manage members' });
    }

    const memberRecordIds = (members || []).map((m: string) => new StringRecordId(m.startsWith('user:') ? m : `user:${m}`));

    // Ensure the creator remains in the chat
    if (!memberRecordIds.some((m: any) => m.toString() === creatorIdStr)) {
      memberRecordIds.push(new StringRecordId(creatorIdStr));
    }

    const updatedChat = await safeMerge(new StringRecordId(chatRecordId), {
      members: memberRecordIds,
    });

    res.json({ message: 'Chat room members updated successfully', chat: updatedChat });
  } catch (error) {
    console.error('Failed to update chat members:', error);
    res.status(500).json({ error: 'Failed to update chat members' });
  }
}

// Fetch messages for a chat room
export async function getChatMessagesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const chatRecordId = id.startsWith('chat:') ? id : `chat:${id}`;
    const rawChat = await safeSelect(new StringRecordId(chatRecordId));
    const chat = Array.isArray(rawChat) ? rawChat[0] : rawChat;

    if (!chat) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Verify access
    const creatorIdStr = typeof chat.created_by === 'string' ? chat.created_by : chat.created_by.id;
    const isMember = (chat.members || []).some((m: any) => {
      const mId = typeof m === 'string' ? m : m.id;
      return mId === userId;
    });

    if (userRole !== 'Admin' && creatorIdStr !== userId && !isMember) {
      return res.status(403).json({ error: 'Forbidden: You are not a member of this chat room' });
    }

    const rawMessages = await safeQuery(
      'SELECT * FROM chat_message WHERE chat_id = $chatId ORDER BY created_at ASC FETCH sender_id',
      { chatId: new StringRecordId(chatRecordId) }
    );
    const messages = Array.isArray(rawMessages[0]) ? rawMessages[0] : [];

    res.json({ messages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
}

// Send a message in a chat room
export async function sendMessageHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const chatRecordId = id.startsWith('chat:') ? id : `chat:${id}`;
    const rawChat = await safeSelect(new StringRecordId(chatRecordId));
    const chat = Array.isArray(rawChat) ? rawChat[0] : rawChat;

    if (!chat) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Verify access
    const creatorIdStr = typeof chat.created_by === 'string' ? chat.created_by : chat.created_by.id;
    const isMember = (chat.members || []).some((m: any) => {
      const mId = typeof m === 'string' ? m : m.id;
      return mId === userId;
    });

    if (userRole !== 'Admin' && creatorIdStr !== userId && !isMember) {
      return res.status(403).json({ error: 'Forbidden: You cannot send messages to this chat room' });
    }

    const now = new Date().toISOString();
    const rawMsg = await (db as any).create(new Table('chat_message'), {
      chat_id: new StringRecordId(chatRecordId),
      sender_id: new StringRecordId(userId),
      sender_name: req.user!.name,
      message: message.trim(),
      created_at: now,
    });

    const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    res.status(201).json({ message: 'Message sent successfully', chat_message: msg });
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}
