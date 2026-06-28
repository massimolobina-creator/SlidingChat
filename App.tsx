
// Trigger to force sync code and update deployment bundle
import React, { useState, useEffect, useCallback } from 'react';
import { IntroScreen } from './components/IntroScreen';
import { MapView } from './components/MapView';
import { UserListView } from './components/UserListView';
import { ChatInterface } from './components/ChatInterface';
import { SettingsScreen } from './components/SettingsScreen';
import { UserSettings, Coordinates, NearbyUser, AppScreen, ViewMode, Message, RetroactiveCheckIn } from './types';
import { initP2P, connectToPeer, onP2PMessage, setSocketFallbackHandler, triggerIncomingMessage } from './services/p2pService';
import { playSound } from './services/soundService';
import { translateText, transcribeAudio, generateBotReply } from './services/geminiService';
import { io, Socket } from 'socket.io-client';
import { RetroactiveMenu } from './components/RetroactiveMenu';
import { AdBanner } from './components/AdBanner';
import { Geolocation } from '@capacitor/geolocation';

// Color definitions for themes
const THEME_COLORS: Record<string, Record<string, string>> = {
  turquoise: {
    50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 
    500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a'
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 
    500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 
    500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87'
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 
    500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12'
  },
  pink: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 
    500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843'
  }
};

const APP_TRANSLATIONS: Record<string, any> = {
  English: {
    online: "Online",
    offline: "Offline",
    hint: "Tap Green marker to chat",
    loading: "Acquiring Location...",
    geoError: "Geolocation failed. Using default.",
    geoNotSupported: "Geolocation not supported.",
    youAreHere: "You are here (Approx)",
    map: "Map",
    list: "List",
    reportEncounter: "Report Encounter",
    tapMapToPlace: "Tap the map to place your memory"
  },
  Italian: {
    online: "Online",
    offline: "Offline",
    hint: "Tocca segnaposto verde per chattare",
    loading: "Acquisizione posizione...",
    geoError: "GPS fallito. Uso posizione default.",
    geoNotSupported: "Geo non supportata.",
    youAreHere: "Sei qui (Approx)",
    map: "Mappa",
    list: "Elenco",
    reportEncounter: "Segnala Incontro",
    tapMapToPlace: "Tocca la mappa per posizionare il ricordo"
  },
  Spanish: {
    online: "En línea",
    offline: "Offline",
    hint: "Toca marcador verde para chatear",
    loading: "Obteniendo ubicación...",
    geoError: "Fallo de GPS. Usando defecto.",
    geoNotSupported: "Geo no soportada.",
    youAreHere: "Estás aquí (Aprox)",
    map: "Mapa",
    list: "Lista",
    reportEncounter: "Registrar Encuentro",
    tapMapToPlace: "Toca el mapa para colocar el recuerdo"
  },
  French: {
    online: "En ligne",
    offline: "Hors ligne",
    hint: "Appuyez sur marqueur vert",
    loading: "Acquisition position...",
    geoError: "Erreur GPS. Mode par défaut.",
    geoNotSupported: "Non supportée.",
    youAreHere: "Vous êtes ici (Approx)",
    map: "Carte",
    list: "Liste",
    reportEncounter: "Signaler Rencontre",
    tapMapToPlace: "Touchez la carte pour placer le souvenir"
  },
  German: {
    online: "Online",
    offline: "Offline",
    hint: "Tippe grünen Marker",
    loading: "Standort...",
    geoError: "GPS Fehler. Standardpos.",
    geoNotSupported: "Nicht unterstützt.",
    youAreHere: "Du bist hier (Ungefähr)",
    map: "Karte",
    list: "Liste",
    reportEncounter: "Begegnung melden",
    tapMapToPlace: "Tippen Sie auf die Karte, um die Erinnerung zu platzieren"
  },
  Portuguese: {
    online: "Online",
    offline: "Offline",
    hint: "Toque marcador verde",
    loading: "Localizando...",
    geoError: "Erro GPS. Usando padrão.",
    geoNotSupported: "Não suportada.",
    youAreHere: "Você está aqui (Aprox)",
    map: "Mapa",
    list: "Lista",
    reportEncounter: "Registrar Encontro",
    tapMapToPlace: "Toque no mapa para posicionar a lembrança"
  },
  Chinese: {
    online: "在线",
    offline: "离线",
    hint: "点击绿色标记聊天",
    loading: "获取位置...",
    geoError: "定位失败。使用默认值。",
    geoNotSupported: "不支持地理位置。",
    youAreHere: "您在这里（大约）",
    map: "地图",
    list: "列表",
    reportEncounter: "标记相遇",
    tapMapToPlace: "点击地图以标记您的足迹"
  },
  Japanese: {
    online: "オンライン",
    offline: "オフライン",
    hint: "緑のマーカーをタップ",
    loading: "位置情報を取得中...",
    geoError: "GPSエラー。デフォルト使用。",
    geoNotSupported: "位置情報はサポートされていません。",
    youAreHere: "現在地（概算）",
    map: "地図",
    list: "リスト",
    reportEncounter: "すれ違いを登録",
    tapMapToPlace: "タップしてすれ違い場所を指定"
  },
  Russian: {
    online: "В сети",
    offline: "Не в сети",
    hint: "Нажми на зеленый маркер",
    loading: "Поиск местоположения...",
    geoError: "Ошибка GPS. По умолчанию.",
    geoNotSupported: "Гео не поддерживается.",
    youAreHere: "Вы здесь (Прибл.)",
    map: "Карта",
    list: "Список",
    reportEncounter: "Записать встречу",
    tapMapToPlace: "Коснитесь карты, чтобы разместить воспоминание"
  },
  Arabic: {
    online: "متصل",
    offline: "غير متصل",
    hint: "اضغط على العلامة الخضراء للدردشة",
    loading: "جارٍ تحديد الموقع...",
    geoError: "فشل GPS. استخدام الافتراضي.",
    geoNotSupported: "الموقع الجغرافي غير مدعوم.",
    youAreHere: "أنت هنا (تقريبي)",
    map: "خريطة",
    list: "قائمة",
    reportEncounter: "تسجيل لقاء",
    tapMapToPlace: "اضغط على الخريطة لتحديد مكان الذكرى"
  },
  Hindi: {
    online: "オンライン",
    offline: "ऑफ़लाइन",
    hint: "चैट के लिए हरे मार्कर पर टैप करें",
    loading: "स्थान प्राप्त कर रहा है...",
    geoError: "GPS विफल। डिफ़ॉल्ट का उपयोग।",
    geoNotSupported: "समर्थित नहीं है।",
    youAreHere: "आप यहाँ हैं (अनुमानित)",
    map: "मानचित्र",
    list: "सूची",
    reportEncounter: "मुठभेड़ दर्ज करें",
    tapMapToPlace: "अपनी याद रखने के लिए मानचित्र पर टैप करें"
  }
};

// Distance calc (Haversine)
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Helper to fuzz location (add +/- ~200-500 meters)
const fuzzLocation = (coords: Coordinates): Coordinates => {
  const getOffset = () => {
     const sign = Math.random() < 0.5 ? -1 : 1;
     const val = 0.002 + (Math.random() * 0.003); 
     return sign * val;
  };
  return {
    lat: coords.lat + getOffset(),
    lng: coords.lng + getOffset()
  };
};

const App: React.FC = () => {
  // Use sessionStorage so each TAB has a unique ID (allowing self-testing on same browser),
  // but also check localStorage for persistence in a native Capacitor/mobile context.
  // Wrapped in try/catch to fully protect against strict WebView SecurityErrors.
  const [myId] = useState(() => {
    try {
      // Direct session privilege for testing multiple tabs on the same browser/device
      const sessionStored = sessionStorage.getItem('slidingchat_my_id');
      if (sessionStored) {
        return sessionStored;
      }

      // Check if we are physically running in a standard desktop web browser or in a native hybrid/mobile wrapper
      const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isWeb = typeof window !== 'undefined' && 
                    !window.hasOwnProperty('Capacitor') && 
                    !(window as any).Capacitor &&
                    !navigator.userAgent.includes('Capacitor') &&
                    !isMobileDevice &&
                    window.location.protocol.startsWith('http');

      if (isWeb) {
        // Generates unique IDs per browser tab so that testing of two tabs on the same environment is instant and painless!
        const newId = 'user_' + Math.random().toString(36).substr(2, 9);
        try { sessionStorage.setItem('slidingchat_my_id', newId); } catch (err) {}
        return newId;
      } else {
        // App/Capacitor context where persistence across launches is key
        const stored = localStorage.getItem('slidingchat_my_id');
        if (stored) {
          try { sessionStorage.setItem('slidingchat_my_id', stored); } catch (err) {}
          return stored;
        }
        const newId = 'user_' + Math.random().toString(36).substr(2, 9);
        try { sessionStorage.setItem('slidingchat_my_id', newId); } catch (err) {}
        try { localStorage.setItem('slidingchat_my_id', newId); } catch (err) {}
        return newId;
      }
    } catch (e) {
      console.warn("Storage APIs are blocked or restricted in this environment:", e);
      return 'user_' + Math.random().toString(36).substr(2, 9);
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem('slidingchat_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          nickname: '',
          language: 'English',
          isOnline: true,
          setupComplete: false,
          theme: 'turquoise',
          notificationsEnabled: true,
          blockedUsers: [],
          ...parsed
        };
      }
    } catch (e) {
      console.warn("Storage APIs are blocked or restricted in this environment:", e);
    }
    return {
      nickname: '',
      language: 'English',
      isOnline: true,
      setupComplete: false,
      theme: 'turquoise',
      notificationsEnabled: true,
      blockedUsers: [],
      peerId: undefined
    };
  });

  const [location, setLocation] = useState<Coordinates | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    try {
      const stored = localStorage.getItem('slidingchat_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.setupComplete) {
          return AppScreen.MAP;
        }
      }
    } catch (e) {}
    return AppScreen.INTRO;
  });
  const [viewMode, setViewMode] = useState<ViewMode>('MAP');
  const [activeChatUser, setActiveChatUser] = useState<NearbyUser | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [detectedSocketUrl, setDetectedSocketUrl] = useState('');
  const [retroactiveCheckIns, setRetroactiveCheckIns] = useState<RetroactiveCheckIn[]>([]);
  const [showRetroactiveMenu, setShowRetroactiveMenu] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<RetroactiveCheckIn | null>(null);
  const [placementMode, setPlacementMode] = useState<{ active: boolean; timestamp: number; caption?: string } | null>(null);

  const t = APP_TRANSLATIONS[settings.language] || APP_TRANSLATIONS['English'];

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('slidingchat_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn("Saving settings to localStorage failed:", e);
    }
  }, [settings]);

  // Inject Theme Colors
  useEffect(() => {
    const root = document.documentElement;
    const colors = THEME_COLORS[settings.theme] || THEME_COLORS['turquoise'];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });
  }, [settings.theme]);

  // Initialize Socket.io
  useEffect(() => {
    console.log("Connecting to socket...");
    
    // Connect to current origin's socket backend if it's a real web deployment (dev, prod/pre),
    // and fallback to PRE server only for local mock file schemas or native Capacitor apps
    let serverUrl = settings.serverUrl || '';
    if (typeof window !== 'undefined') {
      const origin = window.location.origin || '';
      const protocol = window.location.protocol || '';

      // Differentiate standard web browsers from compiled native apps (Capacitor/Cordova)
      const isNative = !!(window as any).Capacitor || 
                       window.hasOwnProperty('Capacitor') || 
                       navigator.userAgent.includes('Capacitor') ||
                       protocol.startsWith('file') || 
                       protocol.startsWith('capacitor') || 
                       protocol.startsWith('ionic');

      if (origin && origin.startsWith('http') && !isNative) {
        // Desktop and mobile web browsers (local server, Dev App, or Shared App Deployment)
        // If they have a custom server, use it unless it points to any platform cloudrun URL, in which case we prefer the current origin
        if (!serverUrl || serverUrl.includes('run.app')) {
          serverUrl = origin;
          console.log("Auto-detected web connection (using page origin):", serverUrl);
        }
      } else {
        // Compiled native mobile apps must connect to the centralized production/shared server relay
        if (!serverUrl) {
          serverUrl = import.meta.env.VITE_BACKEND_URL || 'https://ais-pre-k5bidgl56ur536euruihgy-578586033231.europe-west2.run.app';
          console.log("Auto-detected native framework runtime, using cloud relay fallback:", serverUrl);
        }
      }
    } else {
      if (!serverUrl) {
        serverUrl = import.meta.env.VITE_BACKEND_URL || 'https://ais-pre-k5bidgl56ur536euruihgy-578586033231.europe-west2.run.app';
      }
    }
    
    // Strip trailing slash to avoid double slash problems during connection handshakes
    if (serverUrl && serverUrl.endsWith('/')) {
      serverUrl = serverUrl.slice(0, -1);
    }

    setDetectedSocketUrl(serverUrl);
    console.log("Socket server URL determined:", serverUrl);
    
     // Instantiate with robust cross-platform options to guarantee connection over mobile/carrier lines.
     // By placing 'websocket' ONLY, we force Socket.io to establish a raw binary connection immediately,
     // which completely avoids the HTTP long-polling load balancer mismatch issues on serverless Cloud Run.
     const newSocket = io(serverUrl, {
       transports: ['websocket'],
       upgrade: false,
       autoConnect: true,
       reconnection: true,
       reconnectionAttempts: Infinity,
       reconnectionDelay: 1000,
       timeout: 20000
     });
    
    // Bridge our P2P message sender to route over Socket.io fallback instantly
    setSocketFallbackHandler((recipientId, message) => {
      newSocket.emit("send_message", { recipientId, message });
    });

    // Handle incoming bridged/proxied messages
    newSocket.on("receive_message", (message: Message) => {
      console.log("Proxied event received over Socket.io from server:", message);
      triggerIncomingMessage(message);
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setSocketConnected(true);
      setSocketError(null);
      // Request initial data
      newSocket.emit("request_retroactive_list");
    });

    newSocket.on("disconnect", () => {
      setSocketConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setSocketError(err.message || String(err));
      setSocketConnected(false);
    });

    setSocket(newSocket);
    return () => {
      newSocket.close();
      setSocketConnected(false);
    };
  }, [settings.serverUrl]);

  // Listen for retroactive check-ins (Always listen if socket exists)
  useEffect(() => {
    if (!socket) return;

    socket.on("retroactive_list", (list: RetroactiveCheckIn[]) => {
        console.log("Received retroactive list:", list.length);
        setRetroactiveCheckIns(list);
    });

    socket.on("retroactive_update", (checkIn: RetroactiveCheckIn) => {
        console.log("Received retroactive update:", checkIn.id);
        setRetroactiveCheckIns(prev => {
            if (prev.find(c => c.id === checkIn.id)) return prev;
            return [...prev, checkIn];
        });
    });

    return () => {
        socket.off("retroactive_list");
        socket.off("retroactive_update");
    };
  }, [socket]);

  // Initialize P2P
  useEffect(() => {
      if (settings.setupComplete) {
          initP2P(myId);
          // Clean ID for sharing
          const p2pId = myId.replace(/[^a-zA-Z0-9]/g, '');
          if (settings.peerId !== p2pId) {
              setSettings(prev => ({...prev, peerId: p2pId}));
          }
      }
  }, [settings.setupComplete, myId, settings.peerId]);


  // Initialize Geolocation
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        console.log("Attempting Capacitor Geolocation...");
        try {
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== 'granted') {
            await Geolocation.requestPermissions();
          }
        } catch (e) {
          console.warn("Permission check/request failed, proceeding anyway", e);
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        
        const realCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log("Capacitor location success:", realCoords);
        const fuzzedCoords = fuzzLocation(realCoords);
        setLocation(fuzzedCoords);
        setCurrentScreen(AppScreen.MAP);
        setNearbyUsers([]);
      } catch (capError) {
        console.warn("Capacitor GPS failed, trying standard navigator.geolocation...", capError);
        
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const realCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              console.log("Standard location success:", realCoords);
              const fuzzedCoords = fuzzLocation(realCoords);
              setLocation(fuzzedCoords);
              setCurrentScreen(AppScreen.MAP);
              setNearbyUsers([]); 
            },
            (err) => {
              console.error("Standard location failed too", err);
              // Default Fallback (e.g., Rome) so app still works
              const defaultLocation = { lat: 41.9028, lng: 12.4964 };
              setLocation(fuzzLocation(defaultLocation));
              setCurrentScreen(AppScreen.MAP);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          console.error("No geolocation API available");
          const defaultLocation = { lat: 41.9028, lng: 12.4964 };
          setLocation(fuzzLocation(defaultLocation));
          setCurrentScreen(AppScreen.MAP);
        }
      }
    };

    if (settings.setupComplete && !location) {
      fetchLocation();
    }
  }, [settings.setupComplete, location]);

  // Global P2P Message Listener
  useEffect(() => {
      if (!settings.setupComplete) return;

      const removeListener = onP2PMessage(async (msg: Message) => {
          // If system message, ignore
          if (msg.type === 'system') return;
          // If message is from ME (local loopback check) or my ID, ignore
          if (msg.senderId === 'me' || msg.senderId === myId) return;

          // Check if this message is from the currently active chat
          const isActiveChat = activeChatUser && activeChatUser.id === msg.senderId;

          if (!isActiveChat) {
              // 1. Increment Unread Count
              setUnreadCounts(prev => ({
                  ...prev,
                  [msg.senderId]: (prev[msg.senderId] || 0) + 1
              }));
              
              if (settings.notificationsEnabled) {
                  playSound('receive');
              }

              // 2. Background Save to localStorage with TRANSLATION
              try {
                  const chatId = `p2p_storage_${myId}_${msg.senderId}`;
                  const stored = localStorage.getItem(chatId);
                  let history: Message[] = stored ? JSON.parse(stored) : [];
                  
                  if (!history.find(m => m.id === msg.id)) {
                      let finalMsg = { ...msg };
                      
                      const needsTranslation = msg.language && msg.language !== settings.language;
                      
                      // Perform translation before saving IF needed
                      if (needsTranslation) {
                          if (msg.type === 'text' && msg.text) {
                              const translated = await translateText(msg.text, settings.language);
                              finalMsg.translatedText = translated;
                          } else if (msg.type === 'audio' && msg.text) {
                              // For audio, text is the transcript. Translate it.
                              const translated = await translateText(msg.text, settings.language);
                              finalMsg.translatedText = translated;
                          }
                      } else {
                          // No translation needed, store as is
                          finalMsg.translatedText = undefined;
                      }

                      history.push(finalMsg); 
                      localStorage.setItem(chatId, JSON.stringify(history));
                  }
              } catch (e) {
                  console.error("Background save failed", e);
              }
          }
      });

      return () => removeListener();
  }, [settings.setupComplete, activeChatUser, myId, settings.notificationsEnabled, settings.language]);

  // Peer Discovery Logic (Using Socket.io for real-time discovery)
  useEffect(() => {
    if (!settings.setupComplete || !settings.isOnline || !location || !socket) return;

    const myData: NearbyUser = {
        id: myId,
        nickname: settings.nickname,
        language: settings.language,
        coords: location,
        distance: 0,
        avatar: `https://ui-avatars.com/api/?name=${settings.nickname}&background=random&color=fff`,
        status: 'online',
        lastSeen: Date.now(),
        isBot: false,
        peerId: settings.peerId
    };

    // 1. Send my data to the server
    const sendLocationUpdate = () => {
        console.log("Emitting location update to server:", myData.nickname);
        socket.emit("update_location", myData);
    };

    sendLocationUpdate();

    // Instantly refresh location payload upon any socket connection or reconnection event
    socket.on("connect", sendLocationUpdate);

    // 2. Listen for user list updates
    const handleUsersUpdate = (allUsers: any[]) => {
        const others = allUsers
            .filter(p => p.id !== myId && p.coords)
            .map(p => ({
                ...p,
                distance: getDistanceInMeters(location.lat, location.lng, p.coords.lat, p.coords.lng)
            }));
        setNearbyUsers(others);
    };

    socket.on("users_update", handleUsersUpdate);

    // Update periodically
    const syncInterval = setInterval(() => {
        socket.emit("update_location", {
            ...myData,
            lastSeen: Date.now()
        });
    }, 5000); // Every 5 seconds

    return () => {
        clearInterval(syncInterval);
        socket.off("users_update", handleUsersUpdate);
        socket.off("connect", sendLocationUpdate);
    };
  }, [settings.setupComplete, settings.isOnline, location, settings.nickname, settings.language, myId, settings.peerId, socket]);

  // Instant online/offline transition sync to avoid stale locations on other maps
  useEffect(() => {
    if (!socket || !settings.setupComplete) return;

    socket.emit("update_status", {
      id: myId,
      status: settings.isOnline ? 'online' : 'offline'
    });
  }, [settings.isOnline, socket, settings.setupComplete, myId]);

  // Simulates Bot Interaction
  const generateFakeUsers = () => {
      if (!location) return;
      const fakeUsers: NearbyUser[] = [
          { 
              id: 'bot_alice', 
              nickname: 'Alice (EN)', 
              language: 'English', 
              coords: fuzzLocation(location), 
              distance: 0, 
              avatar: 'https://ui-avatars.com/api/?name=Alice&background=FF5722&color=fff', 
              status: 'online', 
              lastSeen: Date.now(),
              isBot: true 
          },
          { 
              id: 'bot_luigi', 
              nickname: 'Luigi (IT)', 
              language: 'Italian', 
              coords: fuzzLocation(location), 
              distance: 0, 
              avatar: 'https://ui-avatars.com/api/?name=Luigi&background=4CAF50&color=fff', 
              status: 'online', 
              lastSeen: Date.now(),
              isBot: true 
          },
          { 
              id: 'bot_hiro', 
              nickname: 'Hiro (JP)', 
              language: 'Japanese', 
              coords: fuzzLocation(location), 
              distance: 0, 
              avatar: 'https://ui-avatars.com/api/?name=Hiro&background=2196F3&color=fff', 
              status: 'online', 
              lastSeen: Date.now(),
              isBot: true 
          }
      ];

      // Merge with current nearby users
      setNearbyUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newBots = fakeUsers.filter(u => !existingIds.has(u.id));
          return [...prev, ...newBots].map(p => ({
              ...p,
              distance: getDistanceInMeters(location.lat, location.lng, p.coords.lat, p.coords.lng)
          }));
      });
  };


  const handleIntroComplete = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSettingsUpdate = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleLogout = () => {
    setSettings({
        nickname: '',
        language: 'English',
        isOnline: false,
        setupComplete: false,
        theme: 'turquoise',
        notificationsEnabled: true,
        blockedUsers: [],
        peerId: undefined
    });
    setLocation(null);
    setCurrentScreen(AppScreen.INTRO);
    setActiveChatUser(null);
    setUnreadCounts({});
    // Clean peers on logout too
    try {
      localStorage.removeItem('slidingchat_peers');
    } catch (e) {
      console.warn("Storage APIs blocked on logout:", e);
    }
  };

  const handleUserClick = (user: NearbyUser) => {
    if (settings.blockedUsers.includes(user.id)) return;
    
    // Clear unread count for this user
    setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[user.id];
        return next;
    });

    setActiveChatUser(user);
    setCurrentScreen(AppScreen.CHAT);
  };

  const handleAddRetroactive = (coords: Coordinates, timestamp: number, caption?: string) => {
    if (!socket) return;
    
    const checkIn: Omit<RetroactiveCheckIn, 'id' | 'createdAt'> = {
        userId: myId,
        nickname: settings.nickname,
        avatar: `https://ui-avatars.com/api/?name=${settings.nickname}&background=random&color=fff`,
        coords,
        timestamp,
        language: settings.language,
        caption
    };

    socket.emit("add_retroactive", checkIn);
    setShowRetroactiveMenu(false);
    setPlacementMode(null);
  };

  const handleUpdateRetroactive = (id: string, coords: Coordinates, timestamp: number, caption?: string) => {
    if (!socket) return;
    socket.emit("update_retroactive", { id, userId: myId, coords, timestamp, caption });
    setEditingCheckIn(null);
    setShowRetroactiveMenu(false);
  };

  const handleDeleteRetroactive = (id: string) => {
    if (!socket) return;
    socket.emit("delete_retroactive", { id, userId: myId });
    setEditingCheckIn(null);
    setShowRetroactiveMenu(false);
  };

  const toggleOnlineStatus = () => {
    setSettings(prev => ({ ...prev, isOnline: !prev.isOnline }));
  };

  if (!settings.setupComplete) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  if (!location && currentScreen !== AppScreen.CHAT && currentScreen !== AppScreen.SETTINGS) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-500 animate-pulse">
        <svg className="w-12 h-12 mb-4 text-turquoise-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative font-sans bg-gray-100 flex flex-col">
      
      {/* Top Ad Banner */}
      <AdBanner position="top" adUnitId="ca-app-pub-3940256099942544/6300978111" />

      {/* Main Screen Content */}
      <div className={`flex-1 relative transition-transform duration-300 ${currentScreen === AppScreen.CHAT ? 'translate-x-[-20%] opacity-50 pointer-events-none' : 'translate-x-0'}`}>
        
        {/* Floating Header */}
        <div className="absolute top-0 left-0 right-0 z-[1010] p-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto gap-2">
            
            {/* Left: Avatar & Settings */}
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => setCurrentScreen(AppScreen.SETTINGS)}
                    className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white text-gray-700 active:scale-95 transition"
                 >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </button>
                 <div className="bg-white/90 backdrop-blur-md p-1.5 pl-2 pr-3 rounded-full shadow-lg flex items-center gap-2 max-w-[140px]">
                    <div className="w-7 h-7 rounded-full bg-turquoise-500 flex items-center justify-center text-white text-xs font-bold border border-white">
                        {settings.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm truncate">{settings.nickname}</span>
                </div>
                
                {/* Retroactive Action Button */}
                <button 
                    onClick={() => setShowRetroactiveMenu(true)}
                    className="bg-purple-600 p-2 rounded-full shadow-lg hover:bg-purple-700 text-white active:scale-95 transition flex items-center gap-2 px-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs font-bold hidden sm:inline">
                        {t.reportEncounter}
                    </span>
                </button>
            </div>

            {/* Middle: Map/List Toggle */}
            <div className="bg-white/90 backdrop-blur-md p-1 rounded-full shadow-lg flex items-center">
                 <button 
                    onClick={() => setViewMode('MAP')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'MAP' ? 'bg-turquoise-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                 >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </button>
                 <button 
                    onClick={() => setViewMode('LIST')}
                    className={`p-2 rounded-full transition-all relative ${viewMode === 'LIST' ? 'bg-turquoise-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                 >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                     {Object.keys(unreadCounts).length > 0 && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></div>
                     )}
                 </button>
            </div>

            {/* Right: Status */}
            <button 
              onClick={toggleOnlineStatus}
              className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg font-bold text-sm transition ${
                settings.isOnline 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-400 text-white hover:bg-gray-50'
              }`}
            >
              {settings.isOnline ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              ) : (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* View Content */}
        {location && (
            <div className="h-full w-full pb-[50px]">
                {viewMode === 'MAP' ? (
                    <MapView 
                        coords={location} 
                        nearbyUsers={nearbyUsers} 
                        onUserClick={handleUserClick}
                        isOnline={settings.isOnline}
                        currentLocationLabel={t.youAreHere}
                        unreadCounts={unreadCounts}
                        retroactiveCheckIns={retroactiveCheckIns}
                        language={settings.language}
                        onMapClick={(coords) => {
                            if (placementMode?.active) {
                                handleAddRetroactive(coords, placementMode.timestamp, placementMode.caption);
                            }
                        }}
                        onRetroactiveClick={(checkIn) => {
                            if (checkIn.userId === myId) {
                                setEditingCheckIn(checkIn);
                                setShowRetroactiveMenu(true);
                            } else {
                                // Existing behavior: start chat
                                const tempUser: NearbyUser = {
                                    id: checkIn.userId,
                                    nickname: checkIn.nickname,
                                    language: checkIn.language,
                                    coords: checkIn.coords,
                                    distance: 0,
                                    avatar: checkIn.avatar,
                                    status: 'online',
                                    isRetroactive: true,
                                    checkInTime: checkIn.timestamp,
                                    checkInCaption: checkIn.caption
                                };
                                handleUserClick(tempUser);
                            }
                        }}
                    />
                ) : (
                    <UserListView 
                        nearbyUsers={nearbyUsers}
                        onUserClick={handleUserClick}
                        isLoading={false}
                        unreadCounts={unreadCounts}
                        onSimulate={generateFakeUsers}
                    />
                )}
            </div>
        )}
        
        {/* Helper Badge (Only on map) */}
        {viewMode === 'MAP' && nearbyUsers.length > 0 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1010] pointer-events-none">
             <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-xl text-xs text-gray-600 font-medium border border-white">
                {t.hint}
             </div>
          </div>
        )}
      </div>

      {/* Settings Overlay */}
      {currentScreen === AppScreen.SETTINGS && (
        <SettingsScreen 
            settings={settings} 
            onUpdate={handleSettingsUpdate} 
            onClose={() => setCurrentScreen(AppScreen.MAP)} 
            onLogout={handleLogout}
            socketConnected={socketConnected}
            detectedSocketUrl={detectedSocketUrl}
            socketError={socketError}
        />
      )}

      {/* Chat Overlay / Slide-in */}
      <div className={`absolute inset-0 bg-white z-[1200] transition-transform duration-300 ease-in-out ${currentScreen === AppScreen.CHAT ? 'translate-x-0' : 'translate-x-full'}`}>
        {activeChatUser && (
          <ChatInterface 
            myId={myId}
            recipient={activeChatUser} 
            userSettings={settings}
            onClose={() => {
              setActiveChatUser(null);
              // Return to previous view, don't force map
              setCurrentScreen(AppScreen.MAP);
            }} 
          />
        )}
      </div>

      {/* Retroactive Menu Overlay */}
      {showRetroactiveMenu && location && (
        <RetroactiveMenu 
            initialCoords={location}
            language={settings.language}
            editingCheckIn={editingCheckIn || undefined}
            onClose={() => {
                setShowRetroactiveMenu(false);
                setEditingCheckIn(null);
            }}
            onAdd={handleAddRetroactive}
            onUpdate={handleUpdateRetroactive}
            onDelete={handleDeleteRetroactive}
            onManualPlacement={(timestamp, caption) => {
                setPlacementMode({ active: true, timestamp, caption });
                setShowRetroactiveMenu(false);
            }}
        />
      )}

      {/* Placement Mode Banner */}
      {placementMode?.active && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1200] bg-purple-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-bold text-sm">
                {t.tapMapToPlace}
            </span>
            <button 
                onClick={() => setPlacementMode(null)}
                className="bg-white/20 hover:bg-white/30 p-1 rounded-full transition"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      )}

      {/* Bottom Ad Banner */}
      <AdBanner position="bottom" adUnitId="ca-app-pub-3940256099942544/6300978111" />
    </div>
  );
};

export default App;
