import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { API_URL } from '../config';

interface Message {
  sender: string;
  text: string;
  createdAt: string;
}

interface RideChatProps {
  rideId: string;
  rideTitle: string;
  token: string;
  userEmail: string;
  onClose: () => void;
}

export default function RideChat({ rideId, rideTitle, token, userEmail, onClose }: RideChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rides/${rideId}/chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  // Poll for new messages every 3 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [rideId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await fetch(`${API_URL}/api/rides/${rideId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="chat-widget glass-panel">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={16} style={{ color: 'var(--accent-color)' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Ride Chat</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rideTitle}</div>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            No messages yet. Send a message to start chatting with the driver/riders!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === userEmail;
            return (
              <div 
                key={idx} 
                className={`chat-bubble-wrapper ${isMe ? 'me' : 'other'}`}
              >
                <div className="chat-bubble-sender">
                  {isMe ? 'You' : msg.sender.split('@')[0]}
                </div>
                <div className={`chat-bubble ${isMe ? 'me' : 'other'}`}>
                  {msg.text}
                </div>
                <div className="chat-bubble-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
