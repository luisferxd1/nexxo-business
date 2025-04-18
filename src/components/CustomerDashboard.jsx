// src/components/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom'; // Añadimos useNavigate
import { Button } from './ui/button';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // Para redirigir
  const [conversations, setConversations] = useState([]);

  // Obtener las conversaciones del cliente
  useEffect(() => {
    if (!user) return;

    console.log('User UID:', user.uid);
    console.log('doc:', doc);
    console.log('db:', db);

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
      console.log('Snapshot docs:', snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      const chatDocs = [];

      for (const chatDoc of snapshot.docs) {
        const chatId = chatDoc.id;
        const data = chatDoc.data();
        const businessId = data.businessId;

        const businessDocRef = doc(db, 'users', businessId);
        const businessDoc = await getDoc(businessDocRef);
        const businessName = businessDoc.exists()
          ? businessDoc.data().name || businessDoc.data().email || businessId
          : 'Negocio desconocido';

        chatDocs.push({ chatId, businessId, businessName });
      }

      const fetchMessagesPromises = chatDocs.map(({ chatId, businessId, businessName }) => {
        return new Promise((resolve) => {
          const messagesRef = collection(db, 'chats', chatId, 'messages');
          const unsubscribeMessages = onSnapshot(messagesRef, (messagesSnapshot) => {
            const messages = messagesSnapshot.docs.map((msgDoc) => ({
              id: msgDoc.id,
              ...msgDoc.data(),
            }));
            resolve({ chatId, businessId, businessName, messages: messages.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)) });
          }, (error) => {
            console.error(`Error al cargar mensajes para el chat ${chatId}:`, error);
            resolve({ chatId, businessId, businessName, messages: [] });
          });

          return () => unsubscribeMessages();
        });
      });

      Promise.all(fetchMessagesPromises).then((conversationsWithMessages) => {
        console.log('Conversations loaded:', conversationsWithMessages);
        setConversations(conversationsWithMessages);
      });
    }, (error) => {
      console.error('Error al cargar conversaciones:', error);
    });

    return () => unsubscribeChats();
  }, [user]);

  // Abrir un chat automáticamente si venimos desde una notificación
  useEffect(() => {
    const { openChatId } = location.state || {};
    if (openChatId) {
      const chat = conversations.find((convo) => convo.chatId === openChatId);
      if (chat) {
        // Redirigir al chat en la misma pestaña
        navigate(`/chat/${openChatId}`);
      } else {
        console.error(`No se encontró el chat con chatId: ${openChatId}`);
        const loadChatManually = async () => {
          try {
            const chatDocRef = doc(db, 'chats', openChatId);
            const chatDoc = await getDoc(chatDocRef);
            if (chatDoc.exists()) {
              const data = chatDoc.data();
              const businessId = data.businessId;

              const businessDocRef = doc(db, 'users', businessId);
              const businessDoc = await getDoc(businessDocRef);
              const businessName = businessDoc.exists()
                ? businessDoc.data().name || businessDoc.data().email || businessId
                : 'Negocio desconocido';

              const messagesRef = collection(db, 'chats', openChatId, 'messages');
              const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
                const messages = snapshot.docs.map((msgDoc) => ({
                  id: msgDoc.id,
                  ...msgDoc.data(),
                }));
                setConversations((prev) => [
                  ...prev.filter(convo => convo.chatId !== openChatId),
                  {
                    chatId: openChatId,
                    businessId,
                    businessName,
                    messages: messages.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)),
                  },
                ]);
                // Redirigir al chat en la misma pestaña
                navigate(`/chat/${openChatId}`);
              }, (error) => {
                console.error('Error al cargar mensajes manualmente:', error);
              });

              return () => unsubscribeMessages();
            } else {
              console.error('El documento del chat no existe:', openChatId);
            }
          } catch (error) {
            console.error('Error al cargar el chat manualmente:', error);
          }
        };
        loadChatManually();
      }
    }
  }, [location.state, conversations, navigate]);

  const openChat = (chatId) => {
    // Redirigir al chat en la misma pestaña
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Dashboard del Cliente</h1>
      {conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map((convo) => (
            <div
              key={convo.chatId}
              className="p-4 bg-gray-100 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-gray-200"
              onClick={() => openChat(convo.chatId)}
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{convo.businessName}</p>
                <p className="text-xs text-gray-500">
                  {convo.messages.length > 0
                    ? convo.messages[convo.messages.length - 1].text
                    : 'Inicia la conversación'}
                </p>
              </div>
              <Button variant="ghost" className="text-custom-blue">
                Abrir Chat
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">
          No tienes conversaciones aún. ¡Chatea con un negocio para empezar!
        </p>
      )}
    </div>
  );
};

export default CustomerDashboard;