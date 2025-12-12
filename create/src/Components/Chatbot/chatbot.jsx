import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../axiosConfig';
import './chatbot.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  
  const [messages, setMessages] = useState([
    { 
      text: "Hi! I'm your budget assistant. How can I help you today?", 
      sender: 'bot' 
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    setError(null);

    const userMessage = { text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    const messageToSend = input;
    setInput('');
    
    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/chatbot', {
        message: messageToSend
      });

      if (response.data.success) {
        const botMessage = { 
          text: response.data.message, 
          sender: 'bot' 
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }
      
    } catch (err) {
      console.error('Chatbot error:', err);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Please log in to use the chatbot.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      const errorBotMessage = { 
        text: errorMessage, 
        sender: 'bot' 
      };
      setMessages(prevMessages => [...prevMessages, errorBotMessage]);
      setError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with Assistant"
        aria-label="Toggle chatbot"
      >
        💬
      </button>

      {isOpen && (
        <div className="chatbot-window">
          
          {/* HEADER */}
          <div className="chatbot-header">
            <h4>Budget Assistant</h4>
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          {/* MESSAGES AREA */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`message ${msg.sender}`}
              >
                {msg.text}
              </div>
            ))}
            
            {/* LOADING INDICATOR */}
            {isLoading && (
              <div className="message bot loading">
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <form className="chatbot-input-form" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              aria-label="Message input"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}