import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { MessageSquare, Send, Plus, X, Users, RefreshCw, LogIn, Award } from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  created_by: string | User;
  created_at: string;
  members: (string | User)[];
}

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export const ChatView: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Form states
  const [newChatName, setNewChatName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [manageMembers, setManageMembers] = useState<string[]>([]);

  // Loading/Polling states
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadChats();
    loadUsers();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id, true);
      // Start polling for new messages every 3 seconds
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        loadMessages(selectedChat.id, false);
      }, 3000);
    } else {
      setMessages([]);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const data = await api.getChats();
      setChats(data);
      // If a chat is currently selected, refresh its details in case members changed
      if (selectedChat) {
        const refreshed = data.find(c => c.id === selectedChat.id);
        if (refreshed) setSelectedChat(refreshed);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadMessages = async (chatId: string, showLoading = false) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const data = await api.getChatMessages(chatId);
      // Only update state if message count or IDs changed to avoid layout flashes
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatName.trim()) return;

    try {
      const res = await api.createChat(newChatName, selectedMembers);
      setNewChatName('');
      setSelectedMembers([]);
      setIsCreateModalOpen(false);
      await loadChats();
      // Select the newly created chat
      if (res.chat) {
        setSelectedChat(res.chat);
      }
    } catch (err) {
      alert('Failed to create chat room');
    }
  };

  const handleManageMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat) return;

    try {
      await api.updateChatMembers(selectedChat.id, manageMembers);
      setIsManageModalOpen(false);
      await loadChats();
    } catch (err) {
      alert('Failed to update members');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const text = newMessage.trim();
      setNewMessage('');
      await api.sendChatMessage(selectedChat.id, text);
      await loadMessages(selectedChat.id, false);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const toggleMemberSelection = (userId: string, isCreate: boolean) => {
    if (isCreate) {
      setSelectedMembers(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    } else {
      setManageMembers(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    }
  };

  const openManageModal = () => {
    if (!selectedChat) return;
    const currentMemberIds = (selectedChat.members || []).map(m =>
      typeof m === 'string' ? m : m.id
    );
    setManageMembers(currentMemberIds);
    setIsManageModalOpen(true);
  };

  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin' || user?.role === 'Manager';

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Chats Sidebar */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm font-['Outfit']">Common Chats</h3>
          </div>
          {isManagerOrAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              title="Create Chat Room"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingChats ? (
            <div className="text-center text-xs text-slate-400 py-8">Loading channels...</div>
          ) : chats.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-8 px-4">
              No chat rooms found. {isManagerOrAdmin ? 'Create one to get started!' : 'You must be added to a chat by a Manager.'}
            </div>
          ) : (
            chats.map((c) => {
              const isSelected = selectedChat?.id === c.id;
              const creator = typeof c.created_by === 'object' ? c.created_by?.name : 'Manager';
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedChat(c)}
                  className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200/80 text-indigo-900 shadow-sm'
                      : 'border-transparent text-slate-700 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <h4 className="font-bold text-xs truncate font-['Outfit']">{c.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Created by: {creator}</p>
                  </div>
                  <span className="badge badge-todo text-[9px] px-1.5 py-0.5 border-slate-200 flex items-center gap-1 shrink-0 bg-slate-100">
                    <Users className="w-2.5 h-2.5" />
                    {c.members?.length || 0}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col bg-white h-full relative">
        {selectedChat ? (
          <>
            {/* Active Chat Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white z-10 sticky top-0">
              <div className="truncate pr-4">
                <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit'] truncate">
                  {selectedChat.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedChat.members?.length || 0} members added
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => loadMessages(selectedChat.id, true)}
                  className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  title="Reload Messages"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
                </button>
                {isManagerOrAdmin && (
                  <button
                    onClick={openManageModal}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Manage Members
                  </button>
                )}
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  Fetching chat stream...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">No Messages Yet</h5>
                    <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                      Be the first to send a message in this common channel!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <UserAvatar name={m.sender_name} size="sm" />
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 text-[10px] ${isMe ? 'justify-end' : ''}`}>
                          <span className="font-bold text-slate-700">{m.sender_name}</span>
                          <span className="text-slate-400 font-mono">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Type a message to the group..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="input-field text-xs"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="btn-primary py-2 px-4 shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-6 bg-slate-50/20">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 font-['Outfit']">Start Communicating</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Select a channel from the left sidebar to send and receive work logs, team updates, and messages.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Create Chat Room */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit'] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Create Common Chat Room
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Chat Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Development Team"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="input-field text-xs"
                  required
                />
              </div>

              {/* Members check list */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Add Team Members</span>
                  <span className="text-[9px] text-slate-400 font-normal">{selectedMembers.length} selected</span>
                </label>
                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-2.5 space-y-1.5 bg-slate-50/50">
                  {users
                    .filter(u => u.id !== user?.id)
                    .map(u => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 cursor-pointer text-xs font-semibold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(u.id)}
                          onChange={() => toggleMemberSelection(u.id, true)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <div className="truncate">
                          <div>{u.name}</div>
                          <div className="text-[9px] text-slate-400 font-normal">{u.email} • {u.role}</div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChatName.trim()}
                  className="btn-primary text-xs py-2 px-4 shadow-indigo-500/20 disabled:opacity-50"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manage Members */}
      {isManageModalOpen && selectedChat && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit'] flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Manage Chat Members
              </h3>
              <button onClick={() => setIsManageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManageMembers} className="space-y-4">
              {/* Members check list */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Add/Remove Team Members</span>
                  <span className="text-[9px] text-slate-400 font-normal">
                    {manageMembers.filter(m => m !== (typeof selectedChat.created_by === 'object' ? selectedChat.created_by.id : selectedChat.created_by)).length} added
                  </span>
                </label>
                <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto p-2.5 space-y-1.5 bg-slate-50/50">
                  {users
                    .filter(u => u.id !== (typeof selectedChat.created_by === 'object' ? selectedChat.created_by.id : selectedChat.created_by))
                    .map(u => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 cursor-pointer text-xs font-semibold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={manageMembers.includes(u.id)}
                          onChange={() => toggleMemberSelection(u.id, false)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <div className="truncate">
                          <div>{u.name}</div>
                          <div className="text-[9px] text-slate-400 font-normal">{u.email} • {u.role}</div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-4 shadow-indigo-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
