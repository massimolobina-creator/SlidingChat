
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { connectToPeer } from '../services/p2pService';

interface SettingsScreenProps {
  settings: UserSettings;
  onUpdate: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
  onLogout: () => void;
}

const LANGUAGES = [
  { code: 'English', label: 'English', flag: '🇬🇧' },
  { code: 'Italian', label: 'Italiano', flag: '🇮🇹' },
  { code: 'Spanish', label: 'Español', flag: '🇪🇸' },
  { code: 'French', label: 'Français', flag: '🇫🇷' },
  { code: 'German', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'Portuguese', label: 'Português', flag: '🇵🇹' },
  { code: 'Chinese', label: '中文', flag: '🇨🇳' },
  { code: 'Japanese', label: '日本語', flag: '🇯🇵' },
  { code: 'Russian', label: 'Русский', flag: '🇷🇺' },
  { code: 'Arabic', label: 'العربية', flag: '🇸🇦' },
  { code: 'Hindi', label: 'हिन्दी', flag: '🇮🇳' },
];

const THEMES = [
  { id: 'turquoise', color: '#14b8a6', name: 'Turquoise' },
  { id: 'blue', color: '#3b82f6', name: 'Blue' },
  { id: 'purple', color: '#a855f7', name: 'Purple' },
  { id: 'orange', color: '#f97316', name: 'Orange' },
  { id: 'pink', color: '#ec4899', name: 'Pink' },
];

const TEXTS: Record<string, any> = {
  English: {
    title: "Settings",
    general: "General",
    nickname: "Nickname",
    language: "Language",
    appearance: "Appearance & Sound",
    theme: "Theme Color",
    sounds: "Notifications & Sounds",
    privacy: "Privacy",
    blocked: "Blocked Users",
    noBlocked: "No blocked users",
    unblock: "Unblock",
    close: "Close",
    legalTitle: "Legal & Data Privacy",
    legalText: "SlidingChat operates entirely WITHOUT a central database. We respect your privacy by design (GDPR & CCPA compliant). Your messages and location data are processed in real-time and are NOT stored on our servers. All data resides solely on your local device.",
    helpTitle: "Help & Instructions",
    helpMap: "Map: Green markers are other users. The Red marker is you.",
    helpChat: "Chat: Tap a user to chat. Messages are translated automatically to your language.",
    helpPrivacy: "Privacy: Your location is approximate for safety.",
    helpFeatures: "Features: Audio messages, Self-destructing messages (Timer icon), and Read receipts (Blue ticks).",
    copyright: "Rights reserved by SlidingSoft.",
    logout: "Log Out",
    logoutConfirm: "Are you sure you want to log out? Your current session data will be cleared.",
    p2pTitle: "P2P Connection",
    p2pDesc: "Share your ID or enter a friend's ID to connect directly.",
    myId: "My ID",
    connectTo: "Connect to ID",
    connect: "Connect"
  },
  Italian: {
    title: "Impostazioni",
    general: "Generale",
    nickname: "Nickname",
    language: "Lingua",
    appearance: "Aspetto e Suoni",
    theme: "Colore Tema",
    sounds: "Notifiche e Suoni",
    privacy: "Privacy",
    blocked: "Utenti Bloccati",
    noBlocked: "Nessun utente bloccato",
    unblock: "Sblocca",
    close: "Chiudi",
    legalTitle: "Legale e Privacy Dati",
    legalText: "SlidingChat opera interamente SENZA un database centrale. Rispettiamo la tua privacy by design (conforme a GDPR e CCPA). I tuoi messaggi e la tua posizione vengono elaborati in tempo reale e NON vengono salvati sui nostri server. Tutti i dati risiedono esclusivamente sul tuo dispositivo.",
    helpTitle: "Aiuto e Istruzioni",
    helpMap: "Mappa: I segnaposto Verdi sono altri utenti. Il segnaposto Rosso sei tu.",
    helpChat: "Chat: Tocca un utente per chattare. I messaggi vengono tradotti automaticamente nella tua lingua.",
    helpPrivacy: "Privacy: La tua posizione è approssimativa per sicurezza.",
    helpFeatures: "Funzioni: Audio, Messaggi a tempo (Icona Cronometro) e Spunte di lettura (Blu).",
    copyright: "Diritti riservati a SlidingSoft.",
    logout: "Disconnetti",
    logoutConfirm: "Sei sicuro di voler uscire? I dati della sessione corrente verranno cancellati.",
    p2pTitle: "Connessione P2P",
    p2pDesc: "Condividi il tuo ID o inserisci quello di un amico per connetterti.",
    myId: "Mio ID",
    connectTo: "Connetti a ID",
    connect: "Connetti"
  },
  Spanish: {
    title: "Ajustes",
    general: "General",
    nickname: "Apodo",
    language: "Idioma",
    appearance: "Apariencia y sonido",
    theme: "Color del tema",
    sounds: "Notificaciones y sonidos",
    privacy: "Privacidad",
    blocked: "Usuarios bloqueados",
    noBlocked: "No hay usuarios bloqueados",
    unblock: "Desbloquear",
    close: "Cerrar",
    legalTitle: "Legal y Privacidad de Datos",
    legalText: "SlidingChat funciona completamente SIN una base de datos central. Respetamos su privacidad por diseño (cumple con GDPR y CCPA). Sus mensajes y datos de ubicación se procesan en tiempo real y NO se almacenan en nuestros servidores. Todos los datos residen únicamente en su dispositivo.",
    helpTitle: "Ayuda e Instrucciones",
    helpMap: "Mapa: Marcadores Verdes son otros. El Rojo eres tú.",
    helpChat: "Chat: Toca usuario para chatear. Traducción automática.",
    helpPrivacy: "Privacidad: Ubicación aproximada por seguridad.",
    helpFeatures: "Funciones: Audio, Mensajes temporales (Cronómetro) y Confirmación de lectura.",
    copyright: "Derechos reservados por SlidingSoft.",
    logout: "Cerrar Sesión",
    logoutConfirm: "¿Seguro que quieres salir? Se borrarán los datos de la sesión.",
    p2pTitle: "Conexión P2P",
    p2pDesc: "Comparte tu ID para conectar directamente.",
    myId: "Mi ID",
    connectTo: "Conectar a ID",
    connect: "Conectar"
  },
  French: {
    title: "Paramètres",
    general: "Général",
    nickname: "Pseudo",
    language: "Langue",
    appearance: "Apparence et Son",
    theme: "Couleur du thème",
    sounds: "Notifications et Sons",
    privacy: "Confidentialité",
    blocked: "Utilisateurs bloqués",
    noBlocked: "Aucun utilisateur bloqué",
    unblock: "Débloquer",
    close: "Fermer",
    legalTitle: "Juridique et Confidentialité",
    legalText: "SlidingChat fonctionne entièrement SANS base de données centrale. Nous respectons votre vie privée (conforme RGPD & CCPA). Vos messages et données de localisation sont traités en temps réel et NE SONT PAS stockés sur nos serveurs.",
    helpTitle: "Aide et Instructions",
    helpMap: "Carte: Les marqueurs Verts sont les autres. Le Rouge c'est vous.",
    helpChat: "Chat: Touchez un utilisateur. Traduction automatique.",
    helpPrivacy: "Confidentialité: Position approximative pour sécurité.",
    helpFeatures: "Fonctions: Audio, Messages éphémères (Chronomètre) et Accusés de lecture.",
    copyright: "Droits réservés par SlidingSoft.",
    logout: "Déconnexion",
    logoutConfirm: "Voulez-vous vraiment vous déconnecter ?",
    p2pTitle: "Connexion P2P",
    p2pDesc: "Partagez votre ID pour connecter.",
    myId: "Mon ID",
    connectTo: "Connecter à ID",
    connect: "Connecter"
  },
  German: {
    title: "Einstellungen",
    general: "Allgemein",
    nickname: "Spitzname",
    language: "Sprache",
    appearance: "Aussehen & Ton",
    theme: "Themenfarbe",
    sounds: "Benachrichtigungen & Töne",
    privacy: "Privatsphäre",
    blocked: "Blockierte Benutzer",
    noBlocked: "Keine blockierten Benutzer",
    unblock: "Entsperren",
    close: "Schließen",
    legalTitle: "Rechtliches & Datenschutz",
    legalText: "SlidingChat arbeitet komplett OHNE zentrale Datenbank. Wir respektieren Ihre Privatsphäre (DSGVO & CCPA konform). Ihre Nachrichten und Standortdaten werden in Echtzeit verarbeitet und NICHT auf unseren Servern gespeichert.",
    helpTitle: "Hilfe & Anleitung",
    helpMap: "Karte: Grüne Marker sind andere. Der Rote sind Sie.",
    helpChat: "Chat: Benutzer antippen. Automatische Übersetzung.",
    helpPrivacy: "Privatsphäre: Ungefährer Standort zur Sicherheit.",
    helpFeatures: "Funktionen: Audio, Selbstzerstörende Nachrichten und Lesebestätigungen.",
    copyright: "Rechte vorbehalten von SlidingSoft.",
    logout: "Abmelden",
    logoutConfirm: "Möchten Sie sich wirklich abmelden?",
    p2pTitle: "P2P Verbindung",
    p2pDesc: "Teilen Sie Ihre ID.",
    myId: "Meine ID",
    connectTo: "Verbinden mit ID",
    connect: "Verbinden"
  },
  Portuguese: {
    title: "Configurações",
    general: "Geral",
    nickname: "Apelido",
    language: "Idioma",
    appearance: "Aparência e Som",
    theme: "Cor do Tema",
    sounds: "Notificações e Sons",
    privacy: "Privacidade",
    blocked: "Usuários Bloqueados",
    noBlocked: "Nenhum usuário bloqueado",
    unblock: "Desbloquear",
    close: "Fechar",
    legalTitle: "Legal e Privacidade de Dados",
    legalText: "SlidingChat opera inteiramente SEM um banco de dados central. Respeitamos sua privacidade (compatível com GDPR e CCPA). Suas mensagens e dados de localização são processados em tempo real e NÃO são armazenados em nossos servidores.",
    helpTitle: "Ajuda e Instruções",
    helpMap: "Mapa: Marcadores Verdes são outros. O Vermelho é você.",
    helpChat: "Chat: Toque no usuário. Tradução automática.",
    helpPrivacy: "Privacidade: Localização aproximada para segurança.",
    helpFeatures: "Recursos: Áudio, Mensagens temporárias e Recibos de leitura.",
    copyright: "Direitos reservados por SlidingSoft.",
    logout: "Sair",
    logoutConfirm: "Tem certeza que deseja sair?",
    p2pTitle: "Conexão P2P",
    p2pDesc: "Compartilhe seu ID.",
    myId: "Meu ID",
    connectTo: "Conectar ao ID",
    connect: "Conectar"
  },
  Chinese: {
    title: "设置",
    general: "常规",
    nickname: "昵称",
    language: "语言",
    appearance: "外观与声音",
    theme: "主题颜色",
    sounds: "通知与声音",
    privacy: "隐私",
    blocked: "已屏蔽用户",
    noBlocked: "无屏蔽用户",
    unblock: "解除屏蔽",
    close: "关闭",
    legalTitle: "法律与数据隐私",
    legalText: "SlidingChat 完全没有中央数据库。我们从设计上尊重您的隐私（符合 GDPR 和 CCPA）。您的消息和位置数据是实时处理的，不会存储在我们的服务器上。所有数据仅存储在您的本地设备上。",
    helpTitle: "帮助与说明",
    helpMap: "地图：绿色标记是其他用户。红色标记是您。",
    helpChat: "聊天：点击用户进行聊天。消息会自动翻译成您的语言。",
    helpPrivacy: "隐私：为了安全起见，您的位置是近似的。",
    helpFeatures: "功能：语音消息，自毁消息（计时器）和已读回执。",
    copyright: "版权所有 SlidingSoft。",
    logout: "登出",
    logoutConfirm: "确定要登出吗？当前的会话数据将被清除。",
    p2pTitle: "P2P 连接",
    p2pDesc: "分享您的ID或输入好友的ID进行直连。",
    myId: "我的 ID",
    connectTo: "连接到 ID",
    connect: "连接"
  },
  Japanese: {
    title: "設定",
    general: "一般",
    nickname: "ニックネーム",
    language: "言語",
    appearance: "外観とサウンド",
    theme: "テーマカラー",
    sounds: "通知とサウンド",
    privacy: "プライバシー",
    blocked: "ブロック済みユーザー",
    noBlocked: "ブロックされたユーザーはいません",
    unblock: "ブロック解除",
    close: "閉じる",
    legalTitle: "法的およびデータプライバシー",
    legalText: "SlidingChatは中央データベースなしで完全に動作します。設計段階からプライバシーを尊重しています（GDPRおよびCCPA準拠）。メッセージと位置情報はリアルタイムで処理され、サーバーには保存されません。すべてのデータはローカルデバイスにのみ保存されます。",
    helpTitle: "ヘルプと手順",
    helpMap: "地図: 緑のマーカーは他のユーザーです。赤のマーカーはあなたです。",
    helpChat: "チャット: ユーザーをタップしてチャットします。メッセージは自動的に翻訳されます。",
    helpPrivacy: "プライバシー: 安全のため、位置情報は概算です。",
    helpFeatures: "機能：音声メッセージ、自動消滅メッセージ（タイマー）、既読確認。",
    copyright: "SlidingSoftによる著作権。",
    logout: "ログアウト",
    logoutConfirm: "ログアウトしてもよろしいですか？現在のセッションデータは消去されます。",
    p2pTitle: "P2P 接続",
    p2pDesc: "IDを共有するか、友達のIDを入力して直接接続します。",
    myId: "自分のID",
    connectTo: "IDに接続",
    connect: "接続"
  },
  Russian: {
    title: "Настройки",
    general: "Общие",
    nickname: "Никнейм",
    language: "Язык",
    appearance: "Вид и звук",
    theme: "Цвет темы",
    sounds: "Уведомления и звуки",
    privacy: "Конфиденциальность",
    blocked: "Заблокированные",
    noBlocked: "Нет заблокированных",
    unblock: "Разблокировать",
    close: "Закрыть",
    legalTitle: "Правовая информация",
    legalText: "SlidingChat работает БЕЗ центральной базы данных. Мы уважаем вашу конфиденциальность (GDPR и CCPA). Ваши сообщения и местоположение обрабатываются в реальном времени и НЕ сохраняются на серверах.",
    helpTitle: "Помощь и инструкции",
    helpMap: "Карта: Зеленые - другие. Красный - вы.",
    helpChat: "Чат: Нажмите, чтобы начать. Автоперевод сообщений.",
    helpPrivacy: "Приватность: Местоположение приблизительное.",
    helpFeatures: "Функции: Аудио, Самоуничтожение сообщений и Галочки прочтения.",
    copyright: "Права защищены SlidingSoft.",
    logout: "Выйти",
    logoutConfirm: "Вы уверены? Данные сессии будут удалены.",
    p2pTitle: "P2P Соединение",
    p2pDesc: "Поделитесь ID или введите ID друга.",
    myId: "Мой ID",
    connectTo: "Подкл. к ID",
    connect: "Подключить"
  },
  Arabic: {
    title: "الإعدادات",
    general: "عام",
    nickname: "اللقب",
    language: "اللغة",
    appearance: "المظهر والصوت",
    theme: "لون السمة",
    sounds: "الإشعارات والأصوات",
    privacy: "الخصوصية",
    blocked: "المستخدمون المحظورون",
    noBlocked: "لا يوجد مستخدمون محظورون",
    unblock: "إلغاء الحظر",
    close: "إغلاق",
    legalTitle: "قانوني وخصوصية البيانات",
    legalText: "يعمل SlidingChat بالكامل بدون قاعدة بيانات مركزية. نحن نحترم خصوصيتك حسب التصميم. تتم معالجة رسائلك وبيانات موقعك في الوقت الفعلي ولا يتم تخزينها على خوادمنا.",
    helpTitle: "المساعدة والتعليمات",
    helpMap: "الخريطة: العلامات الخضراء هي مستخدمين آخرين. العلامة الحمراء هي أنت.",
    helpChat: "الدردشة: اضغط للدردشة. تترجم الرسائل تلقائيًا.",
    helpPrivacy: "الخصوصية: موقعك تقريبي للأمان.",
    helpFeatures: "الميزات: رسائل صوتية، تدمير ذاتي (مؤقت)، وإيصالات القراءة.",
    copyright: "حقوق النشر محفوظة لـ SlidingSoft.",
    logout: "تسجيل خروج",
    logoutConfirm: "هل أنت متأكد؟ سيتم مسح بيانات الجلسة الحالية.",
    p2pTitle: "اتصال P2P",
    p2pDesc: "شارك معرفك أو أدخل معرف صديق للاتصال.",
    myId: "معرفي",
    connectTo: "اتصال بالمعرف",
    connect: "اتصال"
  },
  Hindi: {
    title: "सेटिंग्स",
    general: "सामान्य",
    nickname: "उपनाम",
    language: "भाषा",
    appearance: "दिखावट और ध्वनि",
    theme: "थीम का रंग",
    sounds: "सूचनाएं और ध्वनियां",
    privacy: "गोपनीयता",
    blocked: "अवरुद्ध उपयोगकर्ता",
    noBlocked: "कोई अवरुद्ध उपयोगकर्ता नहीं",
    unblock: "अनब्लॉक करें",
    close: "बंद करें",
    legalTitle: "कानूनी और डेटा गोपनीयता",
    legalText: "SlidingChat पूरी तरह से केंद्रीय डेटाबेस के बिना काम करता है। हम डिज़ाइन द्वारा आपकी गोपनीयता का सम्मान करते हैं। आपके संदेश और स्थान डेटा रीयल-टाइम में संसाधित होते हैं और हमारे सर्वर पर संग्रहीत नहीं होते हैं।",
    helpTitle: "सहायता और निर्देश",
    helpMap: "मानचित्र: हरे मार्कर अन्य उपयोगकर्ता हैं। लाल मार्कर आप हैं।",
    helpChat: "चैट: चैट करने के लिए टैप करें। संदेश स्वचालित रूप से अनुवादित होते हैं।",
    helpPrivacy: "गोपनीयता: सुरक्षा के लिए आपका स्थान अनुमानित है।",
    helpFeatures: "विशेषताएं: ऑडियो संदेश, स्व-विनाश संदेश (टाइमर) और रीड रिसीप्ट।",
    copyright: "SlidingSoft द्वारा सर्वाधिकार सुरक्षित।",
    logout: "लॉग आउट",
    logoutConfirm: "क्या आप निश्चित हैं? वर्तमान सत्र डेटा साफ़ कर दिया जाएगा।",
    p2pTitle: "P2P कनेक्शन",
    p2pDesc: "अपना आईडी साझा करें या कनेक्ट करने के लिए मित्र का आईडी दर्ज करें।",
    myId: "मेरा आईडी",
    connectTo: "आईडी से कनेक्ट करें",
    connect: "कनेक्ट करें"
  }
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onUpdate, onClose, onLogout }) => {
  const [nickname, setNickname] = useState(settings.nickname);
  const [connectId, setConnectId] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const t = TEXTS[settings.language] || TEXTS['English'];

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNickname(e.target.value);
      onUpdate({ nickname: e.target.value });
  };

  const toggleNotifications = () => {
      onUpdate({ notificationsEnabled: !settings.notificationsEnabled });
  };

  const handleUnblock = (userId: string) => {
      const updatedBlocked = settings.blockedUsers.filter(id => id !== userId);
      onUpdate({ blockedUsers: updatedBlocked });
  };

  const handleP2PConnect = () => {
      if (connectId.trim()) {
          connectToPeer(connectId.trim());
          alert(`Connecting to ${connectId}... check Map/List soon.`);
          setConnectId('');
      }
  };

  return (
    <div className="absolute inset-0 z-50 bg-gray-100 flex flex-col animate-slideUp">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800">{t.title}</h2>
        <button 
          onClick={onClose}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
        >
           <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        {/* General Section */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.general}</h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.nickname}</label>
                <input 
                    type="text" 
                    value={nickname}
                    onChange={handleNicknameChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-turquoise-500 outline-none transition"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.language}</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => onUpdate({ language: lang.code })}
                            className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                                settings.language === lang.code 
                                ? 'border-turquoise-500 bg-turquoise-50 text-turquoise-700 font-medium' 
                                : 'border-gray-100 hover:bg-gray-50'
                            }`}
                        >
                            <span>{lang.flag}</span>
                            <span className="text-sm">{lang.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>

        {/* P2P Section */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.p2pTitle}</h3>
            <p className="text-xs text-gray-500 mb-3">{t.p2pDesc}</p>
            
            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{t.myId}</label>
                <div className="bg-gray-100 p-3 rounded-lg text-sm font-mono break-all select-all text-gray-700 border border-gray-200">
                    {settings.peerId || "Generating..."}
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{t.connectTo}</label>
                     <input 
                        type="text" 
                        value={connectId}
                        onChange={(e) => setConnectId(e.target.value)}
                        placeholder="e.g. user123abc"
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                     />
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={handleP2PConnect}
                        className="bg-turquoise-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-turquoise-600 transition"
                    >
                        {t.connect}
                    </button>
                </div>
            </div>
        </section>

        {/* Help & Instructions */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-turquoise-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t.helpTitle}</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                    <span className="text-green-500">•</span>
                    <span>{t.helpMap}</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{t.helpChat}</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-purple-500">•</span>
                    <span>{t.helpFeatures}</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{t.helpPrivacy}</span>
                </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                 <p className="text-xs text-gray-400 font-semibold">{t.copyright}</p>
            </div>
        </section>

        {/* Legal & Data Privacy Section */}
        <section className="bg-blue-50 border border-blue-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">{t.legalTitle}</h3>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed text-justify">
                {t.legalText}
            </p>
        </section>

        {/* Appearance & Sound */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.appearance}</h3>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.theme}</label>
                <div className="flex flex-wrap gap-3">
                    {THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => onUpdate({ theme: theme.id })}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
                                settings.theme === theme.id ? 'border-gray-600 scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: theme.color }}
                            aria-label={theme.name}
                        >
                             {settings.theme === theme.id && (
                                 <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">{t.sounds}</span>
                <button 
                    onClick={toggleNotifications}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${
                        settings.notificationsEnabled ? 'bg-turquoise-500' : 'bg-gray-300'
                    }`}
                >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                </button>
            </div>
        </section>

        {/* Blocked Users */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.blocked}</h3>
            
            {settings.blockedUsers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">{t.noBlocked}</p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {settings.blockedUsers.map(userId => (
                        <li key={userId} className="py-3 flex items-center justify-between">
                            <span className="text-gray-600">User {userId}</span>
                            <button 
                                onClick={() => handleUnblock(userId)}
                                className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded-full transition"
                            >
                                {t.unblock}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>

        {/* Logout Section */}
        <div className="pt-4">
            {showLogoutConfirm ? (
                <div className="bg-red-50 p-4 rounded-2xl text-center animate-fadeIn">
                    <p className="text-red-800 font-medium mb-3 text-sm">{t.logoutConfirm}</p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setShowLogoutConfirm(false)}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 font-bold shadow-sm"
                        >
                            {t.logout}
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-4 bg-white border border-gray-200 text-red-500 rounded-2xl font-bold hover:bg-red-50 transition shadow-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    {t.logout}
                </button>
            )}
        </div>

      </div>
    </div>
  );
};
