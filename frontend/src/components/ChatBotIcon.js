import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useLocation, useParams } from 'react-router-dom';
import apiClient from '../utils/axiosConfig';
import './ChatBotIcon.css';

// an exportable component that will open the chatbot modal
const ChatBotIcon = () => {
  const { 
    messages, 
    addMessage, 
    isOpen, 
    toggleChat, 
    isLoading, 
    setIsLoading 
  } = useChat();
  
  const [input, setInput] = useState('');
  const messageEndRef = useRef(null);
  const chatModalRef = useRef(null);
  const location = useLocation();
  const params = useParams();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle click outside to close chat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && chatModalRef.current && !chatModalRef.current.contains(event.target)) {
        toggleChat();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleChat]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = input.trim();
    addMessage({ role: 'user', content: userMessage });
    
    // Clear input
    setInput('');
    
    // Reset textarea height
    if (e.target.querySelector('.chat-textarea')) {
      e.target.querySelector('.chat-textarea').style.height = 'auto';
    }
    
    // Process the message
    await processTextMessage(userMessage);
  };

  const processTextMessage = async (text) => {
    setIsLoading(true);
    
    try {
      // Get all messages except the initial welcome message
      const conversationHistory = messages.slice(1);
      
      // Get current page context
      const currentPage = {
        path: location.pathname,
        data: {}
      };

      // Add invoice ID if on an invoice page
      if (params.invoiceId) {
        currentPage.data.invoiceId = params.invoiceId;
      }

      const response = await apiClient.post('/v1/ai/assistant', { 
        prompt: text,
        conversation: conversationHistory,
        currentPage
      });
      
      if (response.data.success) {
        // Add AI response to messages
        addMessage({ 
          role: 'assistant', 
          content: response.data.message
        });
      } else {
        // Handle error
        addMessage({ 
          role: 'assistant', 
          content: 'I\'m having trouble processing your request. Can you provide more details?' 
        });
      }
    } catch (error) {
      console.error('Error processing text:', error);
      addMessage({ 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      });
    }
    
    setIsLoading(false);
  };

  const renderMessage = (message, index) => {
    return (
      <div 
        key={index} 
        className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
      >
        <div className="message-container">
          <div className="message-avatar">
            {message.role === 'user' ? (
              <div className="user-avatar">👤</div>
            ) : (
              <div className="assistant-avatar">🍣</div>
            )}
          </div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">{message.role === 'user' ? 'You' : 'Sushi AI'}</span>
              <span className="message-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p>{message.content}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button 
        className="chat-bot-button"
        onClick={toggleChat}
        aria-label="Open chat"
      >
        <span className="chat-bot-icon">🍣</span>
      </button>

      {isOpen && (
        <div className="chat-modal" ref={chatModalRef}>
          <div className="chat-modal-content">
            <div className="chat-header">
              <h2>
                <span className="logo-icon">🍣</span>
                Sushi AI Assistant
                <div className="status-indicator">
                  <span className="status-dot"></span>
                  <span className="status-text">Online</span>
                </div>
              </h2>
              <button 
                className="close-button"
                onClick={toggleChat}
                aria-label="Close chat"
              >
              </button>
            </div>
            
            <div className="chat-messages">
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="chat-message assistant-message">
                  <div style={{ display: 'flex' }}>
                    <div className="message-avatar">
                      <div className="assistant-avatar">🍣</div>
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>
            
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <div className="chat-input-container">
                <textarea 
                  value={input} 
                  onChange={handleInputChange} 
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  rows="1"
                  className="chat-textarea"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBotIcon;