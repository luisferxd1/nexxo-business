// src/components/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, doc, addDoc, setDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'react-hot-toast';
import { Send, X, Paperclip, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Chat = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserName, setOtherUserName] = useState('');
  const [otherUserLogo, setOtherUserLogo] = useState(null); // Para el logo del negocio
  const [otherUserId, setOtherUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isTyping, setIsTyping] = useState(false); // Indicador de escritura
  const messagesEndRef = useRef(null); // Para auto-scroll

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !chatId) return;

    const determineRoles = async () => {
      try {
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatDocRef);
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          const businessId = data.businessId;
          const clientId = data.clientId;

          if (user.uid === businessId) {
            setCurrentUserRole('business');
            setOtherUserId(clientId);
          } else if (user.uid === clientId) {
            setCurrentUserRole('client');
            setOtherUserId(businessId);
          } else {
            toast.error('No tienes acceso a este chat.');
            navigate('/client');
            return;
          }
        } else {
          toast.error('El chat no existe.');
          navigate('/client');
        }
      } catch (error) {
        console.error('Error al determinar los roles:', error);
        toast.error('Error al cargar el chat.');
      }
    };

    determineRoles();
  }, [user, chatId, navigate]);

  useEffect(() => {
    if (!otherUserId) return;

    const fetchUserDetails = async () => {
      try {
        const userDocRef = doc(db, 'users', otherUserId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOtherUserName(userData.clientInfo?.businessName || userData.name || userData.email || 'Usuario desconocido');
          setOtherUserLogo(userData.logo || null);
        } else {
          setOtherUserName('Usuario no encontrado');
          setOtherUserLogo(null);
        }
      } catch (error) {
        console.error('Error al cargar los detalles del usuario:', error);
        setOtherUserName('Error al cargar usuario');
        setOtherUserLogo(null);
      }
    };

    fetchUserDetails();
  }, [otherUserId]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const unsubscribe = onSnapshot(
      messagesRef,
      (snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(loadedMessages.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
      },
      (error) => {
        console.error('Error al cargar mensajes:', error);
        toast.error('Error al cargar los mensajes.');
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  // Simulación de indicador de escritura (esto podría integrarse con Firestore en un caso real)
  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    return () => clearTimeout(typingTimeout);
  }, [newMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error('El mensaje no puede estar vacío.');
      return;
    }

    if (!user || !otherUserId || !currentUserRole) {
      toast.error('No se pudo enviar el mensaje. Faltan datos del usuario.');
      return;
    }

    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const businessId = currentUserRole === 'business' ? user.uid : otherUserId;
      const clientId = currentUserRole === 'business' ? otherUserId : user.uid;
      await setDoc(
        chatDocRef,
        {
          createdAt: serverTimestamp(),
          businessId: businessId,
          clientId: clientId,
          participants: [businessId, clientId],
        },
        { merge: true }
      );

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage,
        senderId: user.uid,
        senderRole: currentUserRole,
        receiverId: otherUserId,
        timestamp: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        userId: otherUserId,
        type: currentUserRole === 'business' ? 'client' : 'business',
        message: `Nuevo mensaje de chat de ${currentUserRole === 'business' ? 'un negocio' : 'un cliente'}.`,
        read: false,
        createdAt: new Date().toISOString(),
        chatId: chatId,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar el mensaje.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      toast.success(`Archivo ${file.name} seleccionado. (Funcionalidad de carga pendiente)`);
      // Aquí podrías implementar la lógica para subir el archivo a Firebase Storage y enviar el enlace como mensaje
    }
  };

  const closeChat = () => {
    navigate('/client');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-screen w-full bg-gray-50"
    >
      {/* Encabezado del Chat */}
      <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {otherUserLogo ? (
            <img
              src={otherUserLogo}
              alt={otherUserName}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-200"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/50')}
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              {otherUserName}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {currentUserRole === 'business' ? 'Cliente' : 'Negocio'}
            </p>
          </div>
        </div>
        <Button
          onClick={closeChat}
          className="bg-gray-200 text-gray-600 hover:bg-gray-300 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[60%] p-3 rounded-2xl shadow-sm transition-all duration-200 ${
                  msg.senderId === user.uid
                    ? 'bg-custom-blue text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-sm sm:text-base break-words">{msg.text}</p>
                <p className="text-xs mt-1 opacity-70 text-right">
                  {msg.timestamp
                    ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Enviando...'}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm sm:text-base text-center">
              No hay mensajes aún. ¡Inicia la conversación!
            </p>
          </div>
        )}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-200 text-gray-600 p-3 rounded-2xl text-sm">
              Escribiendo...
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario para Enviar Mensajes */}
      <div className="sticky bottom-0 bg-white p-4 sm:p-6 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
          <label className="cursor-pointer">
            <Paperclip className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 hover:text-gray-700 transition-colors" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setIsTyping(true);
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 text-sm sm:text-base py-2 sm:py-3 rounded-2xl border-gray-300 focus:ring-2 focus:ring-custom-blue"
          />
          <Button
            type="submit"
            className="bg-custom-blue text-white p-2 sm:p-3 rounded-full hover:bg-custom-blue/90 transition-colors"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default Chat;