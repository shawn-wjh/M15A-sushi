import React, { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m Sushi AI, your invoice creation assistant. How can I help you today?'
    }
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m Sushi AI, your invoice creation assistant. How can I help you today?'
      }
    ]);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const value = {
    messages,
    addMessage,
    clearMessages,
    isOpen,
    toggleChat,
    isLoading,
    setIsLoading
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 