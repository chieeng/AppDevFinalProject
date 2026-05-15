// API service for messaging endpoints
import { 
  getConversationsByUserId as getMockConversations, 
  getMessagesByConversationId as getMockMessages,
  addMessage as addMockMessage,
  addConversation as addMockConversation
} from '../data/appData';

const API_BASE = 'http://localhost:8000/api';

const handleError = async (response) => {
  let errorMessage = `HTTP error! status: ${response.status}`;
  try {
    const data = await response.json();
    if (data.message) {
      errorMessage = data.message;
    }
  } catch (e) {
    // Response is not JSON
  }
  throw new Error(errorMessage);
};

export const messageService = {
  // Get all messages
  getAllMessages: async () => {
    try {
      const response = await fetch(`${API_BASE}/messages`);
      if (!response.ok) await handleError(response);
      return await response.json();
    } catch (error) {
      console.error('Get all messages error:', error);
      throw error;
    }
  },

  // Get message by ID
  getMessageById: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/messages/${id}`);
      if (!response.ok) await handleError(response);
      return await response.json();
    } catch (error) {
      console.error('Get message error:', error);
      throw error;
    }
  },

  // Send message
  sendMessage: async (messageData) => {
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) await handleError(response);
      return await response.json();
    } catch (error) {
      console.error('Send message error, using mock data:', error);
      return addMockMessage(messageData);
    }
  },

  // Get messages by conversation
  getMessagesByConversation: async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE}/messages/conversation/${conversationId}`);
      if (!response.ok) await handleError(response);
      return await response.json();
    } catch (error) {
      console.error('Get messages by conversation error, using mock data:', error);
      return getMockMessages(conversationId);
    }
  },

  // Get user conversations
  getConversationsByUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/messages/conversations/${userId}`);
      if (!response.ok) await handleError(response);
      return await response.json();
    } catch (error) {
      console.error('Get user conversations error, using mock data:', error);
      return getMockConversations(userId);
    }
  },

  // Create conversation
  createConversation: async (conversationData) => {
    try {
      const response = await fetch(`${API_BASE}/messages/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData)
      });
      if (!response.ok) await handleError(response);
      return await response.json();
    } catch (error) {
      console.error('Create conversation error, using mock data:', error);
      return addMockConversation(conversationData);
    }
  },

  // Delete message
  deleteMessage: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/messages/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) await handleError(response);
      return await response.json();
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }
};
