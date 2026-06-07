import React, { useState, useEffect, useRef } from "react";
import { NearbyUser, Message, UserSettings } from "../types";
import { transcribeAudio, translateText } from "../services/geminiService";
import { sendP2PMessage, onP2PMessage } from "../services/p2pService";
import { playSound } from "../services/soundService";

interface ChatInterfaceProps {
  myId: string;
  recipient: NearbyUser;
  userSettings: UserSettings;
  onClose: () => void;
}

const TIMER_OPTIONS = [0, 5, 10, 30, 60]; // 0 = Off

const CHAT_TRANSLATIONS: Record<string, any> = {
  English: {
    reportedEncounter: "Reported Encounter",
    p2pEncrypted: "P2P Encrypted",
    crossedPathsOn: "Crossed paths on",
    typing: "typing...",
    clearConfirm: "Delete all messages in this chat?"
  },
  Italian: {
    reportedEncounter: "Incontro Segnalato",
    p2pEncrypted: "Crittografia P2P",
    crossedPathsOn: "Incrocio segnalato il",
    typing: "sta scrivendo...",
    clearConfirm: "Cancellare tutti i messaggi in questa chat?"
  },
  Spanish: {
    reportedEncounter: "Encuentro Registrado",
    p2pEncrypted: "Cifrado P2P",
    crossedPathsOn: "Se cruzaron el",
    typing: "escribiendo...",
    clearConfirm: "¿Eliminar todos los mensajes de este chat?"
  },
  French: {
    reportedEncounter: "Rencontre Signalée",
    p2pEncrypted: "Chiffré P2P",
    crossedPathsOn: "Croisé le",
    typing: "écrit...",
    clearConfirm: "Supprimer tous les messages de ce chat ?"
  },
  German: {
    reportedEncounter: "Gemeldete Begegnung",
    p2pEncrypted: "P2P-verschlüsselt",
    crossedPathsOn: "Wege gekreuzt am",
    typing: "schreibt...",
    clearConfirm: "Alle Nachrichten in diesem Chat löschen?"
  },
  Portuguese: {
    reportedEncounter: "Encontro Registrado",
    p2pEncrypted: "Criptografado P2P",
    crossedPathsOn: "Cruzaram-se em",
    typing: "digitando...",
    clearConfirm: "Excluir todas as mensagens deste chat?"
  },
  Chinese: {
    reportedEncounter: "重合足迹",
    p2pEncrypted: "P2P 端到端加密",
    crossedPathsOn: "相遇时间：",
    typing: "正在输入...",
    clearConfirm: "删除此聊天的所有消息吗？"
  },
  Japanese: {
    reportedEncounter: "すれ違いを検出",
    p2pEncrypted: "P2P 暗号化接続",
    crossedPathsOn: "すれ違い検出日時：",
    typing: "入力中...",
    clearConfirm: "このチャットのすべてのメッセージを削除しますか？"
  },
  Russian: {
    reportedEncounter: "Зарегистрированная встреча",
    p2pEncrypted: "P2P шифрование",
    crossedPathsOn: "Пути пересеклись",
    typing: "печатает...",
    clearConfirm: "Удалить все сообщения в этом чате?"
  },
  Arabic: {
    reportedEncounter: "لقاء مسجَّل",
    p2pEncrypted: "تشفير P2P",
    crossedPathsOn: "تقاطعت الطرق في",
    typing: "يكتب الآن...",
    clearConfirm: "هل تريد حذف جميع الرسائل في هذه الدردشة؟"
  },
  Hindi: {
    reportedEncounter: "दर्ज की गई मुठभेड़",
    p2pEncrypted: "P2P एन्क्रिप्टेड",
    crossedPathsOn: "मुठभेड़ की तारीख",
    typing: "टाइपिंग...",
    clearConfirm: "क्या आप इस चैट के सभी संदेशों को हटाना चाहते हैं?"
  }
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  myId,
  recipient,
  userSettings,
  onClose,
}) => {
  const ct = CHAT_TRANSLATIONS[userSettings.language] || CHAT_TRANSLATIONS['English'];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [timerIndex, setTimerIndex] = useState(0); // Index for TIMER_OPTIONS

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Storage key namespace
  const chatId = `p2p_storage_${myId}_${recipient.id}`;

  const currentTimer = TIMER_OPTIONS[timerIndex];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper to update messages and save to storage
  const updateMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    try {
      localStorage.setItem(chatId, JSON.stringify(newMessages));
    } catch (e) {
      console.warn("localStorage setItem failed:", e);
    }
  };

  const clearChat = () => {
    if (confirm(ct.clearConfirm)) {
      try {
        localStorage.removeItem(chatId);
      } catch (e) {
        console.warn("localStorage removeItem failed:", e);
      }
      setMessages([]);
    }
  };

  // Load messages & Process Pending Timers (Lazy Start)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(chatId);
      if (stored) {
        let loadedMessages: Message[] = JSON.parse(stored);
        let hasUpdates = false;
        const now = Date.now();

        // Check for incoming messages that have a duration but NO expiresAt (pending start)
        loadedMessages = loadedMessages.map((msg) => {
          // If it's NOT from me (it's incoming) AND has duration AND timer hasn't started yet
          if (
            msg.senderId !== "me" &&
            msg.senderId !== myId &&
            msg.duration &&
            !msg.expiresAt
          ) {
            hasUpdates = true;
            const expiration = now + msg.duration * 1000;

            // Send receipt to sender so THEIR timer starts too
            setTimeout(() => {
              const receipt: Message = {
                id: Date.now().toString() + Math.random(),
                senderId: myId,
                type: "system",
                systemAction: "read_receipt",
                refId: msg.id,
                timestamp: Date.now(),
                // We piggyback the info that the timer started
              };
              if (recipient.peerId) sendP2PMessage(recipient.peerId, receipt);
            }, 100);

            return { ...msg, expiresAt: expiration, status: "read" };
          }
          return msg;
        });

        if (hasUpdates) {
          updateMessages(loadedMessages);
        } else {
          setMessages(loadedMessages);
        }
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }, [chatId]); // Run once when chat opens (or chatId changes)

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isRecording]);

  // Expiration Logic (Countdown)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => {
        // Only filter out messages that HAVE an expiresAt and it has passed
        // Messages with duration but undefined expiresAt are "pending" and safe
        const remaining = prev.filter((msg) => {
          if (!msg.expiresAt) return true; // Keep pending messages
          return msg.expiresAt > now; // Keep valid messages
        });

        if (remaining.length !== prev.length) {
          try {
            localStorage.setItem(chatId, JSON.stringify(remaining));
          } catch (e) {
            console.warn("localStorage setItem failed in interval:", e);
          }
        }
        return remaining;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [chatId]);

  // P2P Listener
  useEffect(() => {
    const removeListener = onP2PMessage(async (msg: Message) => {
      // Filter messages strictly for this chat
      // Ignore my own messages (loopback prevention)
      if (msg.senderId === myId || msg.senderId === "me") return;

      if (msg.senderId !== recipient.id) {
        return;
      }

      // Handle Read Receipts / Timer Start Signals from the other person
      if (
        msg.type === "system" &&
        msg.systemAction === "read_receipt" &&
        msg.refId
      ) {
        setMessages((prev) => {
          const updated = prev.map((m) => {
            if (m.id === msg.refId) {
              // If this was a timer message and hasn't started yet, START IT NOW
              // Syncing with the recipient's read time
              let newExpiresAt = m.expiresAt;
              if (m.duration && !m.expiresAt) {
                newExpiresAt = Date.now() + m.duration * 1000;
              }
              return { ...m, status: "read", expiresAt: newExpiresAt };
            }
            return m;
          });
          try {
            localStorage.setItem(chatId, JSON.stringify(updated));
          } catch (e) {
            console.warn("localStorage setItem failed:", e);
          }
          return updated;
        });
        return;
      }

      // Handle Normal Incoming Messages
      if (msg.type !== "system") {
        // Perform Translation Logic
        // Only translate if the sender's language is DIFFERENT from mine
        let finalMsg = { ...msg };

        const needsTranslation =
          msg.language && msg.language !== userSettings.language;

        if (needsTranslation) {
          if (msg.type === "text" && msg.text) {
            const translated = await translateText(
              msg.text,
              userSettings.language,
            );
            finalMsg.translatedText = translated;
          } else if (msg.type === "audio" && msg.text) {
            // For audio, translate the transcript
            const translated = await translateText(
              msg.text,
              userSettings.language,
            );
            finalMsg.translatedText = translated;
          }
        } else {
          // No translation needed, text is already in my language or language not specified
          // We rely on the 'text' field for display in this case
          finalMsg.translatedText = undefined;
        }

        setMessages((prev) => {
          if (prev.find((m) => m.id === finalMsg.id)) return prev;

          // If incoming message has a timer, TRIGGER IT IMMEDIATELY because chat is open
          if (finalMsg.duration && !finalMsg.expiresAt) {
            finalMsg.expiresAt = Date.now() + finalMsg.duration * 1000;

            // Send Read Receipt immediately
            setTimeout(() => {
              const receipt: Message = {
                id: Date.now().toString(),
                senderId: myId,
                type: "system",
                systemAction: "read_receipt",
                refId: finalMsg.id,
                timestamp: Date.now(),
              };
              if (recipient.peerId) sendP2PMessage(recipient.peerId, receipt);
            }, 200);
          }

          const updated = [...prev, finalMsg];
          try {
            localStorage.setItem(chatId, JSON.stringify(updated));
          } catch (e) {
            console.warn("localStorage setItem failed:", e);
          }
          return updated;
        });

        if (userSettings.notificationsEnabled) playSound("receive");
      }
    });
    return () => removeListener();
  }, [
    recipient.id,
    recipient.peerId,
    userSettings.notificationsEnabled,
    myId,
    chatId,
    userSettings.language,
  ]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      try {
        localStorage.setItem(chatId, JSON.stringify(updated));
      } catch (e) {
        console.warn("localStorage setItem failed in addMessage:", e);
      }
      return updated;
    });
    if (msg.senderId === "me" && userSettings.notificationsEnabled) {
      playSound("send");
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;

    const userMsgText = inputText;
    setInputText("");

    // We set duration but NO expiresAt.
    // It expires only when the other person reads it.
    const duration = currentTimer > 0 ? currentTimer : undefined;

    // 1. Create message for LOCAL display (Sender is 'me')
    const localMsg: Message = {
      id: Date.now().toString(),
      senderId: "me",
      type: "text",
      text: userMsgText,
      timestamp: Date.now(),
      status: "sent",
      duration: duration,
      expiresAt: undefined, // Pending start
      language: userSettings.language, // Attach my language
    };

    addMessage(localMsg);

    // 2. Create message for NETWORK (Sender is my Real ID)
    if (recipient.peerId) {
      const networkMsg = { ...localMsg, senderId: myId };
      sendP2PMessage(recipient.peerId, networkMsg);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const timerValue = currentTimer;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;

      const duration = timerValue > 0 ? timerValue : undefined;

      const localMsg: Message = {
        id: Date.now().toString(),
        senderId: "me",
        type: "image",
        mediaData: base64,
        timestamp: Date.now(),
        status: "sent",
        duration: duration,
        expiresAt: undefined,
        language: userSettings.language,
      };

      addMessage(localMsg);

      if (recipient.peerId) {
        const networkMsg = { ...localMsg, senderId: myId };
        sendP2PMessage(recipient.peerId, networkMsg);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      alert("Audio requires HTTPS.");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Audio not supported or permission denied.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (blob.size < 100) return;

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = reader.result as string;

          const duration = currentTimer > 0 ? currentTimer : undefined;

          const localMsg: Message = {
            id: Date.now().toString(),
            senderId: "me",
            type: "audio",
            mediaData: base64,
            timestamp: Date.now(),
            status: "sent",
            duration: duration,
            expiresAt: undefined,
            language: userSettings.language,
          };

          const transcription = await transcribeAudio(base64);
          if (transcription) {
            localMsg.text = transcription;
          }

          addMessage(localMsg);

          if (recipient.peerId) {
            const networkMsg = { ...localMsg, senderId: myId };
            sendP2PMessage(recipient.peerId, networkMsg);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      if (userSettings.notificationsEnabled) playSound("record_start");
    } catch (err) {
      console.error("Recording start error:", err);
      alert("Could not access microphone.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (userSettings.notificationsEnabled) playSound("record_stop");
  };

  const toggleTimer = () => {
    setTimerIndex((prev) => (prev + 1) % TIMER_OPTIONS.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#efe7dd]">
      {/* HEADER */}
      <div className="bg-turquoise-600 p-3 flex items-center text-white shadow-md z-20">
        <button
          onClick={onClose}
          className="mr-2 p-2 hover:bg-turquoise-700 rounded-full transition"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="relative">
          <img
            src={recipient.avatar}
            alt={recipient.nickname}
            className="w-10 h-10 rounded-full bg-gray-300 border border-white"
          />
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-turquoise-600 rounded-full ${recipient.status === "online" ? "bg-green-400" : "bg-gray-400"}`}
          ></div>
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight truncate">
            {recipient.nickname}
          </h3>
          <p className="text-xs text-turquoise-100 opacity-90 truncate">
            {isTyping
              ? ct.typing
              : recipient.isRetroactive
                ? ct.reportedEncounter
                : ct.p2pEncrypted}
          </p>
        </div>

        {/* Clear Chat Button */}
        <button
          onClick={clearChat}
          className="p-2 hover:bg-turquoise-700 rounded-full transition ml-2 text-turquoise-100 hover:text-white"
          title="Clear Chat History"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Retroactive Info Banner */}
      {recipient.isRetroactive && recipient.checkInTime && (
        <div className="bg-purple-100 border-b border-purple-200 px-4 py-2 flex flex-col gap-1 text-purple-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {`${ct.crossedPathsOn} ${new Date(recipient.checkInTime).toLocaleString()}`}
            </span>
          </div>
          {recipient.checkInCaption && (
            <div className="pl-6 italic text-purple-600">
              "{recipient.checkInCaption}"
            </div>
          )}
        </div>
      )}

      {/* Retroactive Info Banner */}
      {recipient.isRetroactive && recipient.checkInTime && (
        <div className="bg-purple-100 border-b border-purple-200 px-4 py-2 flex flex-col gap-1 text-purple-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {`${ct.crossedPathsOn} ${new Date(recipient.checkInTime).toLocaleString()}`}
            </span>
          </div>
          {recipient.checkInCaption && (
            <div className="pl-6 italic text-purple-600">
              "{recipient.checkInCaption}"
            </div>
          )}
        </div>
      )}

      {/* MESSAGES */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-repeat"
        style={{
          backgroundImage:
            'url("https://www.transparenttextures.com/patterns/cubes.png")',
        }}
      >
        {messages.map((msg) => {
          // STRICT Check: It is ME if senderId is 'me' OR if senderId matches my ID
          const isMe = msg.senderId === "me" || msg.senderId === myId;

          // Determine Timer State
          const hasTimer = !!msg.duration;
          const isTimerRunning = !!msg.expiresAt;
          const timeLeft = msg.expiresAt
            ? Math.max(0, Math.ceil((msg.expiresAt - Date.now()) / 1000))
            : msg.duration || 0;

          const renderTicks = () => {
            if (!isMe) return null;
            if (msg.status === "read") {
              return (
                <svg
                  className="w-4 h-4 text-green-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              );
            }
            return (
              <svg
                className="w-4 h-4 text-turquoise-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            );
          };

          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-lg shadow-sm relative overflow-hidden transition-all duration-300 ${
                  isMe
                    ? "bg-turquoise-600 text-white rounded-tr-none ml-auto"
                    : "bg-white text-gray-800 rounded-tl-none mr-auto"
                } ${hasTimer ? "border-2 border-red-400" : ""}`}
              >
                {!isMe && (
                  <div className="text-[10px] font-bold text-turquoise-600 mb-0.5 px-3 pt-2">
                    {recipient.nickname}
                  </div>
                )}

                {hasTimer && (
                  <div className="absolute top-1 right-1 z-20 text-[9px] text-red-600 font-bold flex items-center bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-red-200">
                    {isTimerRunning ? (
                      <>
                        <svg
                          className="w-3 h-3 mr-0.5 animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {timeLeft}s
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3 h-3 mr-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Wait
                      </>
                    )}
                  </div>
                )}

                <div className="px-3 py-2 pt-3">
                  {msg.type === "image" && msg.mediaData && (
                    <div className="relative">
                      <img
                        src={msg.mediaData}
                        alt="Shared"
                        className={`rounded-lg max-h-64 object-cover w-full ${hasTimer ? "opacity-90" : ""}`}
                      />
                      {hasTimer && (
                        <div className="absolute inset-0 bg-red-500/10 border-4 border-red-400/50 rounded-lg pointer-events-none animate-pulse flex items-center justify-center">
                          <span className="text-4xl">💣</span>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.type === "audio" && msg.mediaData && (
                    <div>
                      <div
                        className={`flex items-center gap-2 min-w-[200px] mt-1 p-1 rounded border ${isMe ? "bg-turquoise-700 border-turquoise-500" : "bg-gray-50 border-gray-100"}`}
                      >
                        <audio
                          controls
                          className="w-full h-8 outline-none"
                          controlsList="nodownload"
                          src={msg.mediaData}
                          preload="metadata"
                        />
                      </div>
                      {/* Display text: Prefer translated if it exists AND is not empty */}
                      {(msg.translatedText || msg.text) && (
                        <div className="mt-1">
                          <p
                            className={`text-sm italic leading-tight ${isMe ? "text-turquoise-50" : "text-gray-700"}`}
                          >
                            "{msg.translatedText || msg.text}"
                          </p>
                          {!isMe && msg.translatedText && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Original: {msg.text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.type === "text" && (
                    <>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.translatedText || msg.text}
                      </p>
                      {!isMe && msg.translatedText && (
                        <div className="border-t border-gray-200/50 mt-1 pt-1">
                          <p className="text-[10px] text-gray-400 italic">
                            Original: {msg.text}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 px-2 pb-1 bg-gradient-to-t from-black/5 to-transparent">
                  <span
                    className={`text-[10px] ${isMe ? "text-turquoise-200" : "text-gray-400"}`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {renderTicks()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="bg-gray-100 p-2 border-t border-gray-200">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageSelect}
        />

        {isRecording ? (
          <div className="flex items-center justify-between bg-white rounded-full p-2 pl-4 shadow-md border border-red-200 animate-pulse">
            <div className="flex items-center gap-2 text-red-500 font-mono font-bold">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              {formatTime(recordingDuration)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase font-bold mr-2">
                Rec
              </span>
              <button
                onClick={stopRecording}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition shadow-sm flex items-center justify-center w-10 h-10"
              >
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex gap-1 pb-1">
              <button
                onClick={toggleTimer}
                className={`p-2 rounded-full transition flex items-center justify-center relative ${
                  currentTimer > 0
                    ? "bg-red-100 text-red-600 ring-2 ring-red-300"
                    : "text-gray-500 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {currentTimer > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                    {currentTimer}s
                  </span>
                )}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-turquoise-600 hover:bg-gray-200 rounded-full transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            <div
              className={`flex-1 bg-white rounded-2xl border transition shadow-sm overflow-hidden flex items-center min-h-[46px] ${currentTimer > 0 ? "border-red-300 ring-1 ring-red-100" : "border-gray-300 focus-within:border-turquoise-500"}`}
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                placeholder={
                  currentTimer > 0
                    ? `BOMB: ${currentTimer}s (Starts on read)`
                    : "Message..."
                }
                className="w-full max-h-32 py-3 px-4 outline-none resize-none bg-transparent text-sm scrollbar-hide"
                rows={1}
              />
            </div>

            {inputText.trim() ? (
              <button
                onClick={handleSendText}
                className="p-3 rounded-full shadow-md transition transform active:scale-95 bg-turquoise-500 text-white hover:bg-turquoise-600 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9-2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="p-3 rounded-full shadow-md transition transform active:scale-95 bg-turquoise-500 text-white hover:bg-turquoise-600 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
