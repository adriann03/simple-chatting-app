import { LocalSession, LocalContact, LocalGroup, LocalMessage, MessageType } from '../types';

export const initDB = (): LocalSession | null => {
  const existingSession = localStorage.getItem('local_session');
  if (!existingSession) return null;
  return JSON.parse(existingSession);
};

export const createSession = (username: string, pin: string, customId: string): LocalSession => {
  const session: LocalSession = {
    my_id: customId,
    my_username: username,
    pin: pin,
    is_logged_in: false,
    bio: 'Available'
  };
  localStorage.setItem('local_session', JSON.stringify(session));
  localStorage.setItem('local_contacts', JSON.stringify([]));
  localStorage.setItem('local_groups', JSON.stringify([]));
  localStorage.setItem('local_messages', JSON.stringify([]));
  return session;
};

export const updateProfile = (username: string, bio: string, customId: string, profilePicture?: string) => {
  const session = getSession();
  if (session) {
    session.my_username = username;
    session.bio = bio;
    session.my_id = customId;
    if (profilePicture !== undefined) {
      session.profile_picture = profilePicture;
    }
    saveSession(session);
  }
};

export const clearAllData = () => {
  localStorage.removeItem('local_session');
  localStorage.removeItem('local_contacts');
  localStorage.removeItem('local_groups');
  localStorage.removeItem('local_messages');
};

export const getSession = (): LocalSession | null => {
  const session = localStorage.getItem('local_session');
  return session ? JSON.parse(session) : null;
};

export const saveSession = (session: LocalSession) => {
  localStorage.setItem('local_session', JSON.stringify(session));
};

export const lockSession = () => {
  const session = getSession();
  if (session) {
    session.is_logged_in = false;
    saveSession(session);
  }
};

export const getMessages = (chatId: string): LocalMessage[] => {
  const all: LocalMessage[] = JSON.parse(localStorage.getItem('local_messages') || '[]');
  return all.filter(m => m.chat_id === chatId).sort((a, b) => a.timestamp - b.timestamp);
};

export const saveMessage = (msg: Partial<LocalMessage> & { chat_id: string, sender_id: string, message_type: MessageType }) => {
  const all: LocalMessage[] = JSON.parse(localStorage.getItem('local_messages') || '[]');
  
  const newMsg: LocalMessage = {
    message_id: msg.message_id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    chat_id: msg.chat_id,
    sender_id: msg.sender_id,
    message_type: msg.message_type,
    message_text: msg.message_text || '',
    media_data: msg.media_data,
    file_name: msg.file_name,
    timestamp: msg.timestamp || Date.now(),
    is_read: msg.is_read || false
  };

  if (!all.find(m => m.message_id === newMsg.message_id)) {
    all.push(newMsg);
    try {
      localStorage.setItem('local_messages', JSON.stringify(all));
    } catch (e) {
      console.error("Storage limit exceeded. Cannot save message.", e);
      return null;
    }
  }
  
  return newMsg;
};

export const markMessagesAsReadLocal = (messageIds: string[]) => {
  const all: LocalMessage[] = JSON.parse(localStorage.getItem('local_messages') || '[]');
  let updated = false;
  all.forEach(m => {
    if (messageIds.includes(m.message_id)) {
      m.is_read = true;
      updated = true;
    }
  });
  if (updated) {
    localStorage.setItem('local_messages', JSON.stringify(all));
  }
};

export const getContacts = (): LocalContact[] => {
  return JSON.parse(localStorage.getItem('local_contacts') || '[]');
};

export const saveContact = (contactId: string, name: string) => {
  const contacts: LocalContact[] = getContacts();
  if (!contacts.find(c => c.contact_id === contactId)) {
    contacts.push({ contact_id: contactId, contact_name: name });
    localStorage.setItem('local_contacts', JSON.stringify(contacts));
  }
};

export const getGroups = (): LocalGroup[] => {
  return JSON.parse(localStorage.getItem('local_groups') || '[]');
};

export const saveGroup = (group: LocalGroup) => {
  const groups: LocalGroup[] = getGroups();
  if (!groups.find(g => g.group_id === group.group_id)) {
    groups.push(group);
    localStorage.setItem('local_groups', JSON.stringify(groups));
  }
};
