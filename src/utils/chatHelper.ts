export interface ChatMessage {
  id: string;
  sender: 'client' | 'lawyer';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatRoom {
  clientId: string;
  clientName: string;
  lawyerId: string;
  lawyerName: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

// Get all chat rooms from localStorage
export function getChatRooms(): ChatRoom[] {
  const saved = localStorage.getItem('yurid_lawyer_chats');
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error("Error parsing yurid_lawyer_chats", e);
    return [];
  }
}

// Save chat rooms to localStorage
export function saveChatRooms(rooms: ChatRoom[]) {
  localStorage.setItem('yurid_lawyer_chats', JSON.stringify(rooms));
  // Dispatch a custom event to notify components in the same tab
  window.dispatchEvent(new Event('yurid_chats_updated'));
}

// Get or create a chat room between a client and a lawyer
export function getOrCreateChatRoom(clientId: string, clientName: string, lawyerId: string, lawyerName: string): ChatRoom {
  const rooms = getChatRooms();
  let room = rooms.find(r => r.clientId === clientId && r.lawyerId === lawyerId);
  
  if (!room) {
    room = {
      clientId,
      clientName,
      lawyerId,
      lawyerName,
      messages: [],
      lastUpdated: new Date().toISOString()
    };
    rooms.push(room);
    saveChatRooms(rooms);
  }
  
  return room;
}

// Send a message
export function sendChatMessage(clientId: string, clientName: string, lawyerId: string, lawyerName: string, sender: 'client' | 'lawyer', text: string): ChatRoom {
  const rooms = getChatRooms();
  let roomIndex = rooms.findIndex(r => r.clientId === clientId && r.lawyerId === lawyerId);
  
  const newMessage: ChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    sender,
    text,
    timestamp: new Date().toISOString(),
    read: sender === 'client' ? false : true // Default read to false for recipient
  };

  if (roomIndex === -1) {
    const newRoom: ChatRoom = {
      clientId,
      clientName,
      lawyerId,
      lawyerName,
      messages: [newMessage],
      lastUpdated: new Date().toISOString()
    };
    rooms.push(newRoom);
    saveChatRooms(rooms);
    return newRoom;
  } else {
    rooms[roomIndex].messages.push(newMessage);
    rooms[roomIndex].lastUpdated = new Date().toISOString();
    // Keep names up to date
    rooms[roomIndex].clientName = clientName;
    rooms[roomIndex].lawyerName = lawyerName;
    saveChatRooms(rooms);
    return rooms[roomIndex];
  }
}

// Mark messages as read for a specific recipient role
export function markRoomMessagesAsRead(clientId: string, lawyerId: string, viewedBy: 'client' | 'lawyer') {
  const rooms = getChatRooms();
  const roomIndex = rooms.findIndex(r => r.clientId === clientId && r.lawyerId === lawyerId);
  
  if (roomIndex !== -1) {
    let changed = false;
    rooms[roomIndex].messages = rooms[roomIndex].messages.map(m => {
      // If client is viewing, mark lawyer's messages as read
      // If lawyer is viewing, mark client's messages as read
      if (viewedBy === 'client' && m.sender === 'lawyer' && !m.read) {
        changed = true;
        return { ...m, read: true };
      }
      if (viewedBy === 'lawyer' && m.sender === 'client' && !m.read) {
        changed = true;
        return { ...m, read: true };
      }
      return m;
    });
    
    if (changed) {
      saveChatRooms(rooms);
    }
  }
}

// Get total unread messages count for a client or lawyer
export function getUnreadCount(id: string, role: 'client' | 'lawyer'): number {
  const rooms = getChatRooms();
  let count = 0;
  
  rooms.forEach(r => {
    if (role === 'client' && r.clientId === id) {
      count += r.messages.filter(m => m.sender === 'lawyer' && !m.read).length;
    }
    if (role === 'lawyer' && r.lawyerId === id) {
      count += r.messages.filter(m => m.sender === 'client' && !m.read).length;
    }
  });
  
  return count;
}

// Simple lawyer simulated reply
export function getLawyerSimReply(lawyerId: string, text: string, lang: 'uz' | 'ru' = 'uz'): string {
  const replies = {
    uz: [
      "Assalomu alaykum. Xabaringizni qabul qildim. Hozirda sud majlisidaman, tez orada batafsil javob beraman.",
      "Salom. Ariza hujjatlaringizni o'rganib chiqyapman. Ushbu masala bo'yicha imkoniyatlarimiz juda yuqori.",
      "Xabaringiz uchun rahmat. Hujjatlaringizni to'liq ko'rib chiqib, 10 daqiqa ichida siz bilan bog'lanaman.",
      "Assalomu alaykum. Ushbu vaziyatda qonuniy huquqlaringizni to'liq himoya qila olamiz. Batafsil ma'lumot bera olasizmi?",
      "Tushunarli. Siz kiritgan ma'lumotlar sudgacha bo'lgan da'vo arizasini tayyorlashga yetarli. Hozirda arizani loyihasini yozyapman."
    ],
    ru: [
      "Здравствуйте. Я получил ваше сообщение. Сейчас я на судебном заседании, скоро отвечу вам подробно.",
      "Приветствую. Я изучаю документы вашего дела. У нас очень хорошие шансы на успешное решение вопроса.",
      "Спасибо за сообщение. Я внимательно изучу все детали и свяжусь с вами в течение 10 минут.",
      "Здравствуйте. В данной ситуации мы можем полностью защитить ваши законные права. Не могли бы вы предоставить больше деталей?",
      "Понятно. Предоставленной вами информации достаточно для подготовки досудебной претензии. Я уже составляю проект."
    ]
  }[lang];
  
  const idx = Math.floor(Math.random() * replies.length);
  return replies[idx];
}
