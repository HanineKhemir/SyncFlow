'use client'
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { io } from 'socket.io-client';
import styles from './chat.module.css';

const API_BASE_URL = 'http://localhost:3000'; // Adjust to your backend URL

export default function ChatPage() {
  const { token, user, isManager } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io('ws://localhost:3000/chat', {
      query: {
        Authorization: token
      }
    });

    socketRef.current = newSocket;

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      // Request current connected users
      newSocket.emit('getConnectedUsers', (response) => {
        if (response.success) {
          console.log('Connected users:', response.connectedUsers);
          setConnectedUsers(response.connectedUsers);
        }
      });
    });

    // Listen for connected users updates
    newSocket.on('connectedUsers', (users) => {
      console.log('Connected users:', users);
      // users is an array of {userId: number, username: string}
      setConnectedUsers(users);
    });

    newSocket.on('newMessage', (data) => {
      if (data.chatId === selectedChat?.id) {
        // Only add message if it's not already in the messages array (avoid duplicates)
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === data.message.id);
          if (!messageExists) {
            return [...prev, data.message];
          }
          return prev;
        });
      }
      // Update chat list to show new message
      fetchChats();
    });

    newSocket.on('userTyping', (data) => {
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
      newSocket.disconnect();
    };
  }, [token, user, selectedChat?.id]);

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
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage;
    setNewMessage('');
    setIsTyping(false);

    // Stop typing indicator
    socketRef.current?.emit('typing', {
      chatId: selectedChat.id,
      isTyping: false
    });

    // Emit message via WebSocket (Socket server should handle saving to DB)
    socketRef.current?.emit('sendMessage', {
      chatId: selectedChat.id,
      content: messageContent
    });
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
    return (
      <div className={styles.loginPrompt}>
        Please log in to access chat.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Chats</h2>
          {isManager && (
            <button 
              onClick={() => setShowCreateChat(true)}
              className={styles.newChatButton}
            >
              New Chat
            </button>
          )}
        </div>

        {/* Create Chat Modal */}
        {showCreateChat && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>Create New Chat</h3>
              <input
                type="text"
                placeholder="Chat name..."
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createChat()}
                className={styles.modalInput}
              />
              <div className={styles.modalButtons}>
                <button 
                  onClick={createChat}
                  className={styles.createButton}
                >
                  Create
                </button>
                <button 
                  onClick={() => setShowCreateChat(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className={styles.chatList}>
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.chatItemActive : ''}`}
            >
              <div className={styles.chatItemContent}>
                <div className={styles.chatItemMain}>
                  <h4 className={`${styles.chatItemTitle} ${selectedChat?.id === chat.id ? styles.chatItemTitleActive : ''}`}>
                    {chat.name}
                  </h4>
                  {chat.lastMessage && (
                    <p className={styles.chatItemLastMessage}>
                      {chat.lastMessage.senderUsername}: {chat.lastMessage.content}
                    </p>
                  )}
                  <span className={styles.chatItemCount}>
                    {chat.messageCount} messages
                  </span>
                </div>
                {isManager && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Connected Users */}
        <div className={styles.connectedUsers}>
          <h4 className={styles.connectedUsersTitle}>
            Connected Users ({connectedUsers.length})
          </h4>
          <div className={styles.connectedUsersList}>
            {connectedUsers.map(user => (
              <div key={user.userId} className={styles.connectedUser}>
                <div className={styles.onlineIndicator}></div>
                {user.username}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <h2 className={styles.chatHeaderTitle}>
                {selectedChat.name}
              </h2>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messages.map(message => (
                <div 
                  key={message.id}
                  className={`${styles.messageWrapper} ${
                    message.sender.id === user.id 
                      ? styles.messageWrapperSent 
                      : styles.messageWrapperReceived
                  }`}
                >
                  <div className={`${styles.message} ${
                    message.sender.id === user.id 
                      ? styles.messageSent 
                      : styles.messageReceived
                  }`}>
                    {message.sender.id !== user.id && (
                      <div className={styles.messageSender}>
                        {message.sender.username}
                      </div>
                    )}
                    <div className={styles.messageContent}>{message.content}</div>
                    <div className={styles.messageTime}>
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
                <div className={styles.typingIndicator}>
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className={styles.messageInputContainer}>
              <div className={styles.messageInputWrapper}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className={styles.messageInput}
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`${styles.sendButton} ${!newMessage.trim() ? styles.sendButtonDisabled : ''}`}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>💬</div>
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}