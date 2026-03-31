import React, { useState, useEffect } from 'react';
import { chatAPI } from '../services/api';
import ChatList   from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import MainLayout from '../components/layout/MainLayout';

const MessagesPage = () => {
  const [chats,        setChats]        = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const load = async () => {
      try { const { data } = await chatAPI.getMyChats(); setChats(data); } catch {}
    };
    load();
  }, []);

  const handleNewChat = (chat) => {
    setChats(prev => {
      const exists = prev.find(c => c._id === chat._id);
      return exists ? prev.map(c => c._id === chat._id ? chat : c) : [chat, ...prev];
    });
  };

  const handleLeft = () => {
    setChats(prev => prev.filter(c => c._id !== selectedChat?._id));
    setSelectedChat(null);
  };

  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  return (
    <MainLayout>
      <div className={`messages-page ${mobileChatOpen ? 'chat-open' : ''}`}>
      <ChatList chats={chats} selectedChat={selectedChat} onSelectChat={(chat) => { setSelectedChat(chat); setMobileChatOpen(true); }} onNewChat={handleNewChat}/>
      <div className="chat-main">
        {selectedChat
          ? <ChatWindow chat={selectedChat} key={selectedChat._id} allChats={chats} onLeft={handleLeft}/>
          : (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">💬</div>
              <p>Select a conversation or start a new one</p>
            </div>
          )
        }
      </div>
    </div>
    </MainLayout>
  );
};
export default MessagesPage;
