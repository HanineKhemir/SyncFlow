'use client'
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3000'; // Adjust to your backend URL

export default function ChatPage() {
  const { token, user, isManager } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    socketRef.current = io(`${API_BASE_URL}/chat`, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token
      },
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: false
    });

    const socket = socketRef.current;

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Connected to chat server');
      // Get online users
      socket.emit('getOnlineUsers');
    });

    socket.on('newMessage', (data) => {
      if (data.chatId === selectedChat?.id) {
        // Only add message if it's not from the current user (to avoid duplicates)
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === data.message.id);
          if (!messageExists && data.message.sender.id !== user?.id) {
            return [...prev, data.message];
          }
          return prev;
        });
      }
      // Update chat list to show new message
      fetchChats();
    });

    socket.on('userOnline', (data) => {
      setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
    });

    socket.on('userOffline', (data) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    socket.on('userTyping', (data) => {
      if (data.chatId === selectedChat?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, selectedChat?.id]);

  // Fetch chats
  const fetchChats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Fetch messages for selected chat
  const fetchMessages = async (chatId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Create new chat
  const createChat = async () => {
    if (!newChatName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newChatName })
      });

      if (response.ok) {
        setNewChatName('');
        setShowCreateChat(false);
        fetchChats();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage;
    setNewMessage('');
    setIsTyping(false);
    
    // Stop typing indicator
    socketRef.current?.emit('typing', {
      chatId: selectedChat.id,
      isTyping: false
    });

    try {
      // Send via HTTP API to ensure message is saved
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: selectedChat.id,
          content: messageContent
        })
      });

      if (response.ok) {
        const newMessageData = await response.json();
        
        // Add message to local state immediately
        setMessages(prev => [...prev, newMessageData]);
        
        // Also emit via socket for other users
        socketRef.current?.emit('sendMessage', {
          chatId: selectedChat.id,
          content: messageContent
        });
      } else {
        // If HTTP request fails, restore the message input
        setNewMessage(messageContent);
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message input on error
      setNewMessage(messageContent);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing', {
        chatId: selectedChat.id,
        isTyping: true
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing', {
        chatId: selectedChat.id,
        isTyping: false
      });
    }, 2000);
  };

  // Select chat
  const selectChat = (chat) => {
    // Leave previous chat room
    if (selectedChat) {
      socketRef.current?.emit('leaveChat', { chatId: selectedChat.id });
    }
    
    setSelectedChat(chat);
    fetchMessages(chat.id);
    
    // Join new chat room
    socketRef.current?.emit('joinChat', { chatId: chat.id });
  };

  // Delete chat
  const deleteChat = async (chatId) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        if (selectedChat?.id === chatId) {
          setSelectedChat(null);
          setMessages([]);
        }
        fetchChats();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chats on mount
  useEffect(() => {
    if (token) {
      fetchChats();
    }
  }, [token]);

  if (!user) {
    return <div style={{ padding: '20px' }}>Please log in to access chat.</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: '300px', 
        borderRight: '1px solid #ddd', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #ddd',
          backgroundColor: 'white'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Chats</h2>
          {isManager && (
            <button 
              onClick={() => setShowCreateChat(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              New Chat
            </button>
          )}
        </div>

        {/* Create Chat Modal */}
        {showCreateChat && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '300px'
            }}>
              <h3 style={{ marginTop: 0 }}>Create New Chat</h3>
              <input
                type="text"
                placeholder="Chat name..."
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createChat()}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={createChat}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
                <button 
                  onClick={() => setShowCreateChat(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => selectChat(chat)}
              style={{
                padding: '15px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                backgroundColor: selectedChat?.id === chat.id ? '#e3f2fd' : 'white',
                position: 'relative'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    margin: '0 0 5px 0', 
                    fontSize: '16px',
                    fontWeight: selectedChat?.id === chat.id ? 'bold' : 'normal'
                  }}>
                    {chat.name}
                  </h4>
                  {chat.lastMessage && (
                    <p style={{ 
                      margin: 0, 
                      fontSize: '12px', 
                      color: '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {chat.lastMessage.senderUsername}: {chat.lastMessage.content}
                    </p>
                  )}
                  <span style={{ fontSize: '10px', color: '#999' }}>
                    {chat.messageCount} messages
                  </span>
                </div>
                {isManager && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px 6px'
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Online Users */}
        <div style={{ 
          padding: '15px', 
          borderTop: '1px solid #ddd',
          backgroundColor: 'white'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            Online Users ({onlineUsers.length})
          </h4>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {onlineUsers.map(user => (
              <div key={user.userId} style={{ marginBottom: '2px' }}>
                🟢 {user.username}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #ddd',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>
                {selectedChat.name}
              </h2>
            </div>

            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {messages.map(message => (
                <div 
                  key={message.id}
                  style={{
                    alignSelf: message.sender.id === user.id ? 'flex-end' : 'flex-start',
                    maxWidth: '70%'
                  }}
                >
                  <div style={{
                    padding: '10px 15px',
                    borderRadius: '18px',
                    backgroundColor: message.sender.id === user.id ? '#007bff' : '#e9ecef',
                    color: message.sender.id === user.id ? 'white' : 'black'
                  }}>
                    {message.sender.id !== user.id && (
                      <div style={{ 
                        fontSize: '12px', 
                        opacity: 0.8, 
                        marginBottom: '4px',
                        fontWeight: 'bold'
                      }}>
                        {message.sender.username}
                      </div>
                    )}
                    <div>{message.content}</div>
                    <div style={{ 
                      fontSize: '10px', 
                      opacity: 0.7, 
                      marginTop: '4px',
                      textAlign: 'right'
                    }}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  fontStyle: 'italic',
                  padding: '5px 15px'
                }}>
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{ 
              padding: '20px', 
              borderTop: '1px solid #ddd',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: newMessage.trim() ? '#007bff' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#666'
          }}>
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}