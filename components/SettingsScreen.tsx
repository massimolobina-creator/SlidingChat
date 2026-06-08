
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
  { id: 'purple', color: '#8b5cf6', name: 'Purple' },
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
    helpRadarTitle: "Online / Invisible Status (Radar)",
    helpRadarIntro: "The round floating toggle key containing the lightning or radar signal (located at map top-right) regulates your real-time presence:",
    helpRadarBullet1: "Green (Online): Your actual location is safely fuzzed (adjusted by ~200m to secure your privacy) and shared dynamically with nearby users.",
    helpRadarBullet2: "Gray/Red (Invisible): Completely disconnects you from the network. Your coordinate streams are halted and you vanish from other maps.",
    helpViewTitle: "Map vs List",
    helpViewIntro: "You can seamlessly swap the layout view using the central control pill on the right side of the screen:",
    helpViewBullet1: "Globe Icon (Map View): Visualizes a spatial interactive map of encounters. Colored markers indicate localized matches and retroactive memory points. Tap a marker to start a chat.",
    helpViewBullet2: "List Icon (List View): Displays an ordered chronological history summary of nearby encounters, including the distance, matching info and conversation status.",
    helpRetroTitle: "Retroactive Geolocation",
    helpRetroIntro: "Crossed paths with someone in the past while the app was inactive? This feature lets you manually log retro matches!",
    helpRetroBullet1: "Press the 'Retroactive Geolocation' calendar icon in the side menu or map corner.",
    helpRetroBullet2: "Set precise Date, Time, and write a helpful caption description (e.g. 'We smiled near the bookstore, wearing a green jacket').",
    helpRetroBullet3: "Drag the marker pin on the mini-map to choose the exact place where you crossed paths.",
    helpRetroBullet4: "Alternatively, click 'Place on Main Map' to tap directly on the large primary map to position your memory pin.",
    helpRetroBullet5: "If another user registers matching details (time and location overlapping), you are instantly connected in chat!",
    helpChatTitle: "Chat & Gemini AI Features",
    helpChatIntro: "SlidingChat hosts high-quality real-time peer communication mechanisms:",
    helpChatBullet1: "Auto-Translation (Gemini): Messages sent in external foreign languages translate automatically into your language!",
    helpChatBullet2: "Audio Notes & Transcription: Record voice messages by clicking the microphone icon; an AI transcript will be added automatically.",
    helpChatBullet3: "Ephemeral Timer (Stopwatch icon): Set self-destruct timers (5s, 10s...) so messages vanish right after they are seen.",
    helpChatBullet4: "Read Receipts: Twin ticks highlight delivery status, turning blue when the recipient reads your message.",
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
    helpRadarTitle: "Stato Online / Invisibile (Radar)",
    helpRadarIntro: "Il pulsante rotondo con l'icona a forma di fulmine o segnale radar (in alto a destra sulla mappa) controlla la tua visibilità in tempo reale:",
    helpRadarBullet1: "Verde (Online): La tua posizione reale viene fusa (modificata di circa 200m per protezione privacy) e condivisa con gli utenti vicini.",
    helpRadarBullet2: "Grigio/Rosso (Invisibile): Ti disconnette dal network. Non carichi alcuna coordinata e scompari dalle mappe degli altri utenti.",
    helpViewTitle: "Mappa vs Elenco (Cambio Vista)",
    helpViewIntro: "Puoi alternare l'interfaccia principale usando la pulsantiera centrale sul lato destro dello schermo:",
    helpViewBullet1: "Icona Globo (Mappa): Visualizzazione spaziale dei tuoi incroci e ricordi geografici. Tocca ogni segnaposto verde per vedere i dettagli, i messaggi non letti ed avviare la chat.",
    helpViewBullet2: "Icona Elenco (Lista): Mostra le persone incrociate o i ricordi registrati ordinati cronologicamente, con distanze approssimative e lo stato della chat.",
    helpRetroTitle: "Geolocalizzazione Retroattiva",
    helpRetroIntro: "Vi siete incrociati in passato quando l'applicazione era spenta o offline? Questa funzione ti permette di registrarlo manualmente!",
    helpRetroBullet1: "Clicca sul pulsante della Geolocalizzazione Retroattiva (icona calendario) nel menu laterale o sulla mappa.",
    helpRetroBullet2: "Imposta data, ora precisa e scrivi una didascalia descrittiva (es. 'Ci siamo guardati all'incrocio, maglietta verde').",
    helpRetroBullet3: "Trascina liberamente il segnaposto sulla micro-mappa per scegliere il punto esatto del vostro incontro.",
    helpRetroBullet4: "In alternativa, premi 'Posiziona sulla Mappa Principale' per toccare direttamente un punto qualunque sulla mappa grande per posizionare il ricordo.",
    helpRetroBullet5: "Se qualcun altro inserisce un incrocio retroattivo negli stessi orari e zone sovrapposte, l'applicazione vi collegherà automaticamente in chat!",
    helpChatTitle: "Funzioni Chat e AI Gemini",
    helpChatIntro: "SlidingChat integra sistemi intelligenti di interazione diretta in tempo reale:",
    helpChatBullet1: "Traduzione automatica (Gemini): I messaggi inviati in lingue straniere ti verranno mostrati direttamente tradotti in italiano all'istante!",
    helpChatBullet2: "Audio Messaggi & Trascrizione: Registra e invia messaggi vocali toccando l'icona del microfono; l'algoritmo AI trascriverà il testo sul display automaticamente.",
    helpChatBullet3: "Autodistruzione (Icona Timer): Imposta un limite temporale (5s, 10s...) per far sì che il tuo messaggio svanisca per sempre una volta visualizzato.",
    helpChatBullet4: "Ricevute di Lettura: Le doppie spunte blu indicano se il tuo messaggio è stato ricevuto e letto dal destinatario.",
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
    helpRadarTitle: "Estado Online / Invisible (Radar)",
    helpRadarIntro: "El botón redondo del rayo/radar (esquina superior derecha del mapa) controla tu visibilidad en tiempo real:",
    helpRadarBullet1: "Verde (Online): Tu ubicación se fusa por seguridad (ajustada ~200m por privacidad) y se comparte con usuarios cercanos.",
    helpRadarBullet2: "Gris/Rojo (Invisible): Te desconecta de la red. No compartes coordenadas y desapareces de otros mapas.",
    helpViewTitle: "Mapa vs Lista (Alternar Vista)",
    helpViewIntro: "Puedes cambiar la vista usando el panel de control lateral derecho de la pantalla:",
    helpViewBullet1: "Icono Globo (Mapa): Visualización interactiva de encuentros. Toca un marcador verde para ver detalles e iniciar chat.",
    helpViewBullet2: "Icono Lista (Lista): Historial cronológico ordenado de encuentros, con distancia y estado de conversación.",
    helpRetroTitle: "Geolocalización Retroactiva",
    helpRetroIntro: "¿Te cruzaste con alguien en el pasado con la app apagada? ¡Registra manualmente tus encuentros retroactivos!",
    helpRetroBullet1: "Pulsa el icono de calendario de Geolocalización Retroactiva en el menú o esquina del mapa.",
    helpRetroBullet2: "Selecciona fecha, hora exacta y escribe una descripción (ej. 'Sonreímos cerca de la librería con chaqueta verde').",
    helpRetroBullet3: "Arrastra el marcador en el minimapa para ubicar el lugar exacto del encuentro.",
    helpRetroBullet4: "O elige 'Colocar en Mapa Principal' para tocar directamente el punto exacto en el mapa grande.",
    helpRetroBullet5: "¡Si otro usuario registra detalles coincidentes en la misma zona y hora, se conectarán al instante!",
    helpChatTitle: "Chat y Funciones de Gemini AI",
    helpChatIntro: "SlidingChat incluye sistemas inteligentes de comunicación directa en tiempo real:",
    helpChatBullet1: "Traducción automática (Gemini): ¡Los mensajes en idiomas extranjeros se traducen automáticamente a tu idioma!",
    helpChatBullet2: "Mensajes de Audio y Transcripción: Envía notas de voz con el micrófono; la IA transcribirá el texto automáticamente.",
    helpChatBullet3: "Autodestrucción (Icona Temporizador): Elige un tiempo (5s, 10s...) para que el mensaje desaparezca al verlo.",
    helpChatBullet4: "Confirmación de Lectura: Las dobles marcas azules indican que tu mensaje ha sido entregado y leído.",
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
    theme: "Couleur du thême",
    sounds: "Notifications et Sons",
    privacy: "Confidentialité",
    blocked: "Utilisateurs bloqués",
    noBlocked: "Aucun utilisateur bloqué",
    unblock: "Débloquer",
    close: "Fermer",
    legalTitle: "Juridique et Confidentialité",
    legalText: "SlidingChat fonctionne entièrement SANS base de données centrale. Nous respectons votre vie privée (conforme RGPD & CCPA). Vos messages et données de localisation sont traités en temps réel et NE SONT PAS stockés sur nos serveurs. Toutes les données sont stockées localement.",
    helpTitle: "Aide et Instructions",
    helpMap: "Carte: Les marqueurs Verts sont les autres. Le Rouge c'est vous.",
    helpChat: "Chat: Touchez un utilisateur. Traduction automatique.",
    helpPrivacy: "Confidentialité: Position approximative pour sécurité.",
    helpFeatures: "Fonctions: Audio, Messages éphémères (Chronomètre) et Accusés de lecture.",
    helpRadarTitle: "Statut En Ligne / Invisible (Radar)",
    helpRadarIntro: "Le bouton rond de foudre ou signal radar (en haut à droite de la carte) contrôle votre visibilité en temps réel :",
    helpRadarBullet1: "Vert (En Ligne) : Votre position réelle est floutée (~200m pour la confidentialité) et partagée avec les utilisateurs proches.",
    helpRadarBullet2: "Gris/Rouge (Invisible) : Déconnecte du réseau. Aucune coordonnée partagée et disparition des cartes des autres.",
    helpViewTitle: "Carte vs Liste (Changer de Vue)",
    helpViewIntro: "Vous pouvez basculer l'affichage à l'aide de la bague de contrôle sur le côté droit de l'écran :",
    helpViewBullet1: "Icône Globe (Carte) : Visualisation spatiale interactive de vos rencontres. Appuyez sur un repère vert pour chatter.",
    helpViewBullet2: "Icône Liste (Liste) : Affiche l'historique chronologique de vos rencontres, avec de courtes distances et statuts.",
    helpRetroTitle: "Géolocalisation Rétroactive",
    helpRetroIntro: "Vous avez croisé quelqu'un par le passé alors que l'application était fermée ? Enregistrez-le manuellement !",
    helpRetroBullet1: "Cliquez sur l'icône calendrier de Géolocalisation Rétroactive dans le menu ou sur la carte.",
    helpRetroBullet2: "Sélectionnez date, heure précise et ajoutez une description (ex. 'Regards à l'intersection, chemise jaune').",
    helpRetroBullet3: "Faites glisser le repère sur la mini-carte pour choisir le point exact de rencontre.",
    helpRetroBullet4: "Or touchez 'Placer sur la Carte Principale' et appuyez directement n'importe où sur la grande carte.",
    helpRetroBullet5: "Si un autre utilisateur signale une rencontre aux mêmes horaires et zones, l'application vous connecte !",
    helpChatTitle: "Chat & Fonctionnalités Gemini AI",
    helpChatIntro: "SlidingChat héberge des mécanismes de communication directe intelligents en temps réel :",
    helpChatBullet1: "Traduction automatique (Gemini) : Les messages de langues étrangères seront automatiquement affichés dans votre langue !",
    helpChatBullet2: "Messages Vocaux & Transcription : Enregistrez en appuyant sur le micro ; l'IA transcrira automatiquement le texte.",
    helpChatBullet3: "Autodistruction (Chronomètre) : Réglez un compte à rebours de disparition (5s, 10s...) pour effacer les messages lus.",
    helpChatBullet4: "Confirmation de lecture : Les doubles coches bleues révèlent quand votre message est vu par le destinataire.",
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
    legalText: "SlidingChat arbeitet komplett OHNE zentrale Datenbank. Wir respektieren Ihre Privatsphäre (DSGVO & CCPA konform). Ihre Nachrichten und Standortdaten werden in Echtzeit verarbeitet und NICHT auf unseren Servern gespeichert. Alle Daten liegen lokal auf dem Gerät.",
    helpTitle: "Hilfe & Anleitung",
    helpMap: "Karte: Grüne Marker sind andere. Der Rote sind Sie.",
    helpChat: "Chat: Benutzer antippen. Automatische Übersetzung.",
    helpPrivacy: "Privatsphäre: Ungefährer Standort zur Sicherheit.",
    helpFeatures: "Funktionen: Audio, Selbstzerstörende Nachrichten und Lesebestätigungen.",
    helpRadarTitle: "Status Online / Unsichtbar (Radar)",
    helpRadarIntro: "Der runde Knopf mit dem Blitz- oder Radarsymbol (oben rechts auf der Karte) steuert Ihre Echtzeitsichtbarkeit:",
    helpRadarBullet1: "Grün (Online): Ihr Standort wird aus Datenschutzgründen um ca. 200m verschoben und an Nahestehende übertragen.",
    helpRadarBullet2: "Grau/Rot (Unsichtbar): Trennt Sie vollständig vom Netzwerk. Sie verschwinden von den Karten der anderen.",
    helpViewTitle: "Karte vs Liste (Ansicht wechseln)",
    helpViewIntro: "Wechseln Sie die Ansichten über den rechten Controller auf der rechten Seite des Bildschirms:",
    helpViewBullet1: "Globus-Symbol (Karte): Interaktive räumliche Karte von Begegnungen. Tippen Sie auf einen grünen Pin, um zu chatten.",
    helpViewBullet2: "Listen-Symbol (Liste): Zeigt einen chronologisch sortierten Verlauf Ihrer Begegnungen mit ungefähren Entfernungen.",
    helpRetroTitle: "Nachträgliche Geolokalisierung",
    helpRetroIntro: "Jemanden getroffen, als die App aus war? Registrieren Sie diese Begegnung manuell!",
    helpRetroBullet1: "Tippen Sie auf das nachträgliche Geolokalisierungs-Kalender-Symbol im Menü oder Karteneck.",
    helpRetroBullet2: "Wählen Sie Datum, genaue Uhrzeit und schreiben Sie eine Beschreibung (z. B. 'Lächeln nahe der Buchhandlung, rote Mütze').",
    helpRetroBullet3: "Ziehen Sie den Pin auf der Mini-Karte an den genauen Ort Ihres Treffens.",
    helpRetroBullet4: "Oder drücken Sie 'Auf Hauptkarte platzieren' und tippen Sie den Punkt direkt auf der großen Hauptkarte an.",
    helpRetroBullet5: "Wenn ein anderer Nutzer übereinstimmende Daten eingibt, verbindet Sie die App sofort im Chat!",
    helpChatTitle: "Chat & Gemini AI-Funktionen",
    helpChatIntro: "SlidingChat verfügt über intelligente Echtzeit-Kommunikationstools:",
    helpChatBullet1: "Automatische Übersetzung (Gemini): Fremdsprachige Nachrichten werden automatisch in Ihre Sprache übersetzt!",
    helpChatBullet2: "Audionachrichten & Transkription: Nehmen Sie eine Sprachnachricht über das Mikrofon auf; die KI transkribiert sie live.",
    helpChatBullet3: "Selbstzerstörung (Stoppuhr): Stellen Sie einen Timer ein (5s, 10s...) damit die Nachricht nach dem Lesen verschwindet.",
    helpChatBullet4: "Lesebestätigung: Zwei blaue Häkchen zeigen an, dass Ihre Nachricht erfolgreich empfangen und gelesen wurde.",
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
    legalText: "SlidingChat opera inteiramente SEM um banco de dados central. Respeitando sua privacidade (compatível com GDPR e CCPA). Suas mensagens e dados de localização são processados em tempo real e NÃO são armazenados em nossos servidores. Os dados residem unicamente no dispositivo local.",
    helpTitle: "Ajuda e Instruções",
    helpMap: "Mapa: Marcadores Verdes são outros. O Vermelho é você.",
    helpChat: "Chat: Toque no usuário. Tradução automática.",
    helpPrivacy: "Privacidade: Localização aproximada para segurança.",
    helpFeatures: "Recursos: Áudio, Mensagens temporárias e Recibos de leitura.",
    helpRadarTitle: "Status Online / Invisível (Radar)",
    helpRadarIntro: "O botão redondo de raio ou radar (no canto superior direito do mapa) controla sua presença em tempo real:",
    helpRadarBullet1: "Verde (Online): Sua localização real é deslocada (~200m por privacidade) e compartilhada com usuários próximos.",
    helpRadarBullet2: "Cinza/Vermelho (Invisível): Desconecta você por completo. Você desaparece dos mapas de outros usuários.",
    helpViewTitle: "Mapa vs Lista (Alternar Visualização)",
    helpViewIntro: "Alterne de forma simples o visualizador principal usando o controle lateral direito no visor:",
    helpViewBullet1: "Ícone Globo (Mapa): Visualização no mapa interativo dos seus encontros. Toque nas tags para abrir conversas.",
    helpViewBullet2: "Ícone Lista (Lista): Mostra o histórico cronológico de encontros, com distâncias estimadas e alertas.",
    helpRetroTitle: "Geolocalização Retroativa",
    helpRetroIntro: "Cruzou caminhos com alguém no passado com o aplicativo desligado? Registre manualmente os locais!",
    helpRetroBullet1: "Toque no ícone de calendário de Geolocalização Retroativa no menu lateral ou mapa.",
    helpRetroBullet2: "Ajuste a data, hora exata e redija uma descrição (ex. 'Trocamos olhares na cafeteria, casaco azul').",
    helpRetroBullet3: "Mova o pino indicador na micro-mapa para registrar as coordenadas perfeitamente.",
    helpRetroBullet4: "Ou selecione 'Posicionar no Mapa Principal' para tocar no lugar preciso na tela principal expandida.",
    helpRetroBullet5: "Se houver cruzamento com as especificações de outro usuário na mesma hora, vocês se conectam na hora!",
    helpChatTitle: "Chat e Recursos Gemini AI",
    helpChatIntro: "SlidingChat fornece tecnologias inteligentes de comunicação peer-to-peer direta:",
    helpChatBullet1: "Tradução inteligente (Gemini): As conversas em outras línguas traduzem instantaneamente no seu idioma!",
    helpChatBullet2: "Notas de Voz e Transcrição: Grave áudio pelo ícone do microfone; a IA converte sua voz em texto no visor.",
    helpChatBullet3: "Vanish/Autodestruição (Cronômetro): Configure um temporizador para as mensagens sumirem após lidas.",
    helpChatBullet4: "Status de Leitura: Duas setas azuis indicam o envio bem-sucedido e a leitura da mensagem.",
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
    helpRadarTitle: "在线 / 隐身状态 (雷达)",
    helpRadarIntro: "地图右上角带有闪电/雷达符号的圆形雷达按钮控制您的实时在线状态：",
    helpRadarBullet1: "绿色 (在线): 您的实际位置将被安全混淆（偏移约200米以保护隐私），并与附近的在线用户实时进行P2P匹配。",
    helpRadarBullet2: "灰色/红色 (隐身): 完全断开网络连接。不再更新地理位置，并立刻从他人的地图中隐身。",
    helpViewTitle: "地图 vs 列表 (视图切换)",
    helpViewIntro: "您可以使用屏幕右侧的中央浮动控制条轻松切换主界面：",
    helpViewBullet1: "地球图标 (地图视图): 在交互式地图上查看所有的足迹与历史相遇。轻按绿色标记可看详情并开始聊天。",
    helpViewBullet2: "列表图标 (列表视图): 按时间顺序排列附近的相遇，展示双方的预估距离、匹配详情以及对话状态。",
    helpRetroTitle: "追溯历史定位 (时空漫游)",
    helpRetroIntro: "应用关闭或手机离线时与他人擦肩而过？这个功能允许您手动补充标记之前的时空交错！",
    helpRetroBullet1: "点击侧边栏菜单或地图角落的“追溯历史定位”日历图标。",
    helpRetroBullet2: "选择具体日期、精准时间并填写文字备注（例如：“我们在书店门口打过招呼，绿色长裤”）。",
    helpRetroBullet3: "在迷你地图上拖动指针至您想标记的具体相遇点。",
    helpRetroBullet4: "或者，选择“在主地图上标记”直接在大型主地图上点击具体位置定位回忆标。",
    helpRetroBullet5: "如果同时同地也有其他用户登记了相似的时间和交叉区域，系统将自动把你们连接进私密聊天！",
    helpChatTitle: "聊天与 Gemini AI 功能",
    helpChatIntro: "SlidingChat 搭载了高品质实时P2P消息通信机制及领先的AI工具：",
    helpChatBullet1: "自动翻译 (Gemini): 接收到的外语消息都会免手动操作，由 Gemini 直接贴心转换为您的本地语言！",
    helpChatBullet2: "语音消息与自动转写: 按住麦克风按钮录制语音，AI 会在气泡中全自动转录文字，方便免提收听。",
    helpChatBullet3: "阅后即焚 (秒表图标): 设定计时器（如5秒、10秒），信息一旦被对方点开便会自动彻底焚毁。",
    helpChatBullet4: "已读回执: 标准的双勾高赞，蓝色双勾表示接收人已成功收到并阅读了您的话语。",
    copyright: "版权所有 SlidingSoft。",
    logout: "登出",
    logoutConfirm: "您确定要退出登录吗？您当前的本地会话数据将被清除。",
    p2pTitle: "P2P 直接连接",
    p2pDesc: "分享您的 P2P ID，或者输入您好友的 ID 直接进行加密直连。",
    myId: "我的 P2P ID",
    connectTo: "连接到该 ID",
    connect: "开始连接"
  },
  Japanese: {
    title: "設定",
    general: "一般設定",
    nickname: "ニックネーム",
    language: "言語",
    appearance: "外観 ＆ 通知音",
    theme: "テーマカラー",
    sounds: "通知 ＆ サウンド",
    privacy: "プライバシー",
    blocked: "ブロック中ユーザー",
    noBlocked: "ブロックしているユーザーはいません",
    unblock: "ブロック解除",
    close: "閉じる",
    legalTitle: "法的免責事項 ＆ プライバシー",
    legalText: "SlidingChatは中央のデータベースを一切介さずに動作します。セキュリティ設計（GDPRおよびCCPAに準拠）により、位置情報やメッセージデータはサーバーに蓄積されず、ご使用のローカル端末にのみ記録されます。",
    helpTitle: "ヘルプと操作説明",
    helpMap: "地図: 緑のピンは周りのユーザー、赤のピンがあなたの現在地です。",
    helpChat: "チャット: ピンをタップして開始。外国語からあなたの言語へ自動で翻訳されます。",
    helpPrivacy: "プライバシー: 安全のため、共有される現在地はおおまかな広域のみです。",
    helpFeatures: "個別機能: ボイスメモ、消滅メッセージ (タイマー)、既読ダブルチェックが付いています。",
    helpRadarTitle: "オンライン / 隠し状態 (レーダー)",
    helpRadarIntro: "マップ右上にある稲妻/レーダー型の丸いボタンで、現在のリアルタイム表示情報を制御します：",
    helpRadarBullet1: "緑 (オンライン): 実際の現在地情報はおおまかに加工され (プライバシー保護のため~200m調整)、近接接続を検索します。",
    helpRadarBullet2: "グレー/赤 (隠し設定): ネットワーク接続を切断します。端末更新は送信されず、他のマップから完全に非表示になります。",
    helpViewTitle: "マップ vs リスト (画面切り替え)",
    helpViewIntro: "メイン画面の右側にあるコントロールパネルを使って、視覚表示を切り替えることができます：",
    helpViewBullet1: "地球アイコン (マップ表示): すれ違い履歴をマップ上で視覚的に探索します。緑のピンをタップすると詳細確認やチャットができます。",
    helpViewBullet2: "リストアイコン (リスト表示): 相手の近さ、詳細情報、未読メッセージ確認が時系列に整理されて表示されます。",
    helpRetroTitle: "さかのぼり位置登録",
    helpRetroIntro: "アプリが作動していないオフライン時や、過去に誰かとすれ違いましたか？手動でその場所を記憶できます！",
    helpRetroBullet1: "メニューまたはマップ角の「さかのぼり位置登録」(カレンダーアイコン) を選択します。",
    helpRetroBullet2: "日付、正確な時間を選択し、詳細説明を入力します（例: 「本屋近くですれ違った時に笑い合いました。緑の服」）。",
    helpRetroBullet3: "ミニマップ上のピンをドラッグして、出会った特定の位置を調整します。",
    helpRetroBullet4: "または「メインマップに配置」を押して、大きな画面上の一点を直接タッチして指定します。",
    helpRetroBullet5: "条件の合致するユーザー（重なる時間・場所）がマッチ登録を送信した場合、即座にチャットが接続されます！",
    helpChatTitle: "チャット ＆ Gemini AI 機能",
    helpChatIntro: "SlidingChatには便利な安全な相互リアルタイムチャットツールがあります：",
    helpChatBullet1: "自動翻訳機能 (Gemini): 外国語のテキストは自動的にご自身の言語に Gemini 経由で翻訳して表示します！",
    helpChatBullet2: "音声ノート ＆ 自動文字起こし: マイクボタンから吹き込んだボイスは、AIが自動的に分析してテキストに変換します。",
    helpChatBullet3: "自己消滅（タイマー）: 時間（5秒、10秒など）を指定して送信されたメッセージは、既読後自動的に消去され二度と閲覧できなくなります。",
    helpChatBullet4: "既読通知: ダブルブルーチェックマークは相手がそのメッセージを受信・開封したことを表します。",
    copyright: "All Rights Reserved by SlidingSoft.",
    logout: "ログアウト",
    logoutConfirm: "本当にログアウトしますか？現在のセッションデータはリセットされます。",
    p2pTitle: "P2P 直接接続",
    p2pDesc: "自分のIDを共有するか、友達のIDを入力して直接接続してください。",
    myId: "自分の P2P ID",
    connectTo: "このIDに接続する",
    connect: "接続開始"
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
    legalTitle: "القانون والخصوصية",
    legalText: "يعمل SlidingChat بالكامل بدون قاعدة بيانات مركزية. نحن نحترم خصوصيتك حسب التصميم (متوافق مع GDPR و CCPA). تتم معالجة رسائلك وبيانات موقعك في الوقت الفعلي ولا يتم تخزينها على خوادمنا. جميع البيانات توجد فقط على جهازك المحلي.",
    helpTitle: "المساعدة والتعليمات",
    helpMap: "الخريطة: العلامات الخضراء للمستخدمين الآخرين، العلامة الحمراء لك.",
    helpChat: "الدردشة: اضغط للدردشة. تُترجم الرسائل تلقائيًا.",
    helpPrivacy: "الخصوصية: موقعك تقريبي للأمان.",
    helpFeatures: "الميزات: رسائل صوتية، تدمير ذاتي، تأكيدات القراءة.",
    helpRadarTitle: "حالة متصل / غير مرئي (الرادار)",
    helpRadarIntro: "يتحكم الزر الدائري مع رمز البرق أو الرادار (أعلى يمين الخريطة) في ظهورك في الوقت الفعلي:",
    helpRadarBullet1: "أخضر (متصل): يتم تشويش موقعك الحقيقي لحماية خصوصيتك (بإزاحته حوالي 200 متر) ومشاركته مع المستخدمين القريبين للبحث عن لقاءات في الوقت الفعلي.",
    helpRadarBullet2: "رمادي/أحمر (غير مرئي): يقطع اتصالك تمامًا عن الشبكة، ويتوقف مشاركة موقعك وتختفي تمامًا من خرائط الآخرين.",
    helpViewTitle: "الخريطة مقابل القائمة (تبديل العرض)",
    helpViewIntro: "يمكنك تبديل العرض الرئيسي باستخدام شريط التحكم الأيمن على جانب الشاشة:",
    helpViewBullet1: "أيقونة الكرة الأرضية (الخريطة): عرض مكاني تفاعلي للقاءات والذكريات. اضغط على أي دبوس أخضر لرؤية التفاصيل وبدء الدردشة.",
    helpViewBullet2: "أيقونة القائمة (القائمة): يعرض سجلًا زمنيًا مرتبًا للقاءات القريبة مع المسافات التقريبية وحالة القراءة.",
    helpRetroTitle: "الموقع الجغرافي ذو الأثر الرجعي",
    helpRetroIntro: "هل قابلت أحدًا في الماضي عندما كان التطبيق مغلقًا؟ تتيح لك هذه الميزة تسجيل اللقاءات السابقة يدويًا!",
    helpRetroBullet1: "اضغط على أيقونة تقويم الموقع الجغرافي ذو الأثر الرجعي في القائمة الجانبية أو زاوية الخريطة.",
    helpRetroBullet2: "اختر التاريخ والوقت الدقيق واكتب وصفًا مناسبًا (مثل 'ابتسمنا بالقرب من المكتبة، بسترة خضراء').",
    helpRetroBullet3: "اسحب دبوس المؤشر على الخريطة الصغيرة لتحديد مكان اللقاء بدقة.",
    helpRetroBullet4: "أو اختر 'وضعه على الخريطة الرئيسية' للنقر مباشرة على أي موقع دقيق على الخريطة الكبيرة.",
    helpRetroBullet5: "إذا أدخل مستخدم آخر تفاصيل متطابقة في نفس الوقت والمنطقة المتداخلة، سيقوم التطبيق بتوصيلكما بالدردشة تلقائيًا!",
    helpChatTitle: "الدردشة وميزات Gemini AI",
    helpChatIntro: "يحتوي SlidingChat على ميزات اتصال مباشر في الوقت الفعلي وأدوات مدعومة بـ Gemini:",
    helpChatBullet1: "الترجمة التلقائية (Gemini): تُترجم رسائل اللغات الأجنبية تلقائيًا إلى لغتك بمساعدة الذكاء الاصطناعي!",
    helpChatBullet2: "الرسائل الصوتية والنسخ المكتوب: اضغط على الميكروفون لتسجيل وإرسال الرسائل الصوتية؛ ستقوم الذكاء الاصطناعي بنسخ الصوت إلى نص تلقائيًا.",
    helpChatBullet3: "التدمير الذاتي (المؤقت): اختر وقتًا محددًا (5ث، 10ث...) حتى يختفي الرسالة للأبد بعد قراءتها.",
    helpChatBullet4: "تأكيد القراءة: تشير العلامتان الزرقوان إلى تسليم رسالتك وقراءتها من قبل المستلم.",
    copyright: "جميع الحقوق محفوظة لـ SlidingSoft.",
    logout: "تسجيل الخروج",
    logoutConfirm: "هل أنت متأكد من رغبتك في الخروج؟ سيتم مسح بيانات الجلسة الحالية.",
    p2pTitle: "اتصال P2P",
    p2pDesc: "شارك معرفك أو أدخل معرف الصديق للاتصال مباشرة.",
    myId: "معرف P2P الخاص بي",
    connectTo: "الاتصال بالمعرف",
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
    legalText: "SlidingChat पूरी तरह से केंद्रीय डेटाबेस के बिना काम करता है। हम डिज़ाइन द्वारा आपकी गोपनीयता का सम्मान करते हैं (GDPR और CCPA अनुरूप)। आपके संदेश और स्थान डेटा रीयल-टाइम में संसाधित होते हैं और हमारे सर्वर पर संग्रहीत नहीं होते हैं। सभी डेटा केवल आपके स्थानीय डिवाइस पर सुरक्षित रूप से रहता है।",
    helpTitle: "सहायता और निर्देश",
    helpMap: "मानचित्र: हरे मार्कर अन्य उपयोगकर्ता हैं। लाल मार्कर आप हैं।",
    helpChat: "चैट: चैट करने के लिए टैप करें। संदेश स्वचालित रूप से अनुवादित होते हैं।",
    helpPrivacy: "गोपनीयता: सुरक्षा के लिए आपका स्थान अनुमानित है।",
    helpFeatures: "विशेषताएं: ऑडियो संदेश, स्व-विनाश संदेश (टाइमर) और रीड रिसीप्ट।",
    helpRadarTitle: "ऑनलाइन / अदृश्य स्थिति (रडार)",
    helpRadarIntro: "मानचित्र के ऊपर दाईं ओर बिजली या रडार सिग्नल वाला गोल बटन वास्तविक समय में आपकी विजिबिलिटी को नियंत्रित करता है:",
    helpRadarBullet1: "हरा (ऑनलाइन): गोपनीयता एवं सुरक्षा के लिए आपका सही स्थान लगभग 200 मीटर विचलित (फज) कर पास के उपयोगकर्ताओं के साथ साझा किया जाता है।",
    helpRadarBullet2: "ग्रे/लाल (अदृश्य): आपको नेटवर्क से पूरी तरह डिस्कनेक्ट कर देता है। आप स्थान साझा करना बंद कर देते हैं और दूसरों के मानचित्रों से गायब हो जाते हैं।",
    helpViewTitle: "मानचित्र बनाम सूची (दृश्य बदलें)",
    helpViewIntro: "आप स्क्रीन के दाईं ओर केंद्र में स्थित कंट्रोल पिल का उपयोग करके मुख्य इंटरैक्टिव लेआउट को स्वैप कर सकते हैं:",
    helpViewBullet1: "ग्लोब आइकन (मानचित्र): आपकी मुठभेड़ों और यादों का स्थानिक मानचित्र प्रदर्शित करता है। विवरण देखने और चैट शुरू करने के लिए किसी भी हरे पिन को टैप करें।",
    helpViewBullet2: "सूची आइकन (सूची): निकटवर्ती लोगों से मुठभेड़ों का कालानुक्रमिक इतिहास संक्षेप में दिखाता है, जिसमें उनकी दूरी और बातचीत की स्थिति शामिल है।",
    helpRetroTitle: "पूर्वव्यापी भौगोलिक स्थान",
    helpRetroIntro: "क्या ऐप बंद होने पर आप पहले कभी किसी से मिले थे? यह अनूठी विशेषता आपको मैन्युअल रूप से अतीत की मुठभेड़ों को रिकॉर्ड करने की सुविधा देती है!",
    helpRetroBullet1: "साइड मेनू या मानचित्र के कोने में स्थित पूर्वव्यापी भौगोलिक स्थान (कैलेंडर बटन) बटन दबाएं।",
    helpRetroBullet2: "सटीक तिथि, सही समय चुनें और एक उपयोगी विवरण लिखें (जैसे 'पुस्तक दुकान के पास हम मुस्कुराए थे, हरी जैकेट में')।",
    helpRetroBullet3: "मुठभेड़ के सटीक बिंदु को इंगित करने के लिए मिनी-मैप पर मार्कर पिन को अपनी मर्जी से ड्रैग करें।",
    helpRetroBullet4: "अथवा 'मुख्य मानचित्र पर रखें' विकल्प दबाकर सीधे मुख्य बड़े मानचित्र पर किसी भी सटीक स्थान को टैप करें।",
    helpRetroBullet5: "यदि कोई अन्य उपयोगकर्ता भी उसी समय और ओवरलैप क्षेत्र में मिलते-जुलते विवरण दर्ज करता है, तो आप तुरंत निजी चैट से जुड़ जाएंगे!",
    helpChatTitle: "चैट और जेमिनी एआई विशेषताएं",
    helpChatIntro: "SlidingChat वास्तविक-समय में उच्च गुणवत्ता वाले प्रत्यक्ष संचार तंत्र और जेमिनी संचालित टूल होस्ट करता है:",
    helpChatBullet1: "स्वचालित अनुवाद (Gemini): विदेशी भाषाओं में आए संदेश जेमिनी एआई की मदद से स्वचालित रूप से आपकी अपनी भाषा में अनुवादित हो जाते हैं!",
    helpChatBullet2: "वॉयस संदेश और ट्रांसक्रिप्शन: वॉयस रिकॉर्ड भेजने के लिए माइक बटन पर टैप करें; एआई स्वचालित रूप से टेक्स्ट में ट्रांसक्रिप्ट कर स्क्रीन पर दिखाएगा।",
    helpChatBullet3: "स्व-विनाश (स्टॉपवॉच): एक समय सीमा (5स, 10स...) चुनें ताकि प्राप्तकर्ता द्वारा संदेश देखे जाने के तुरंत बाद वह हमेशा के लिए गायब हो जाए।",
    helpChatBullet4: "रीड रिसिप्ट: डबल ब्लू टिक दर्शाते हैं कि आपका संदेश डिलीवर हो गया है और प्राप्तकर्ता ने इसे पढ़ लिया है।",
    copyright: "SlidingSoft द्वारा सर्वाधिकार सुरक्षित।",
    logout: "लॉग आउट",
    logoutConfirm: "क्या आप निश्चित हैं? वर्तमान सत्र डेटा साफ़ कर दिया जाएगा।",
    p2pTitle: "P2P कनेक्शन",
    p2pDesc: "अपना आईडी साझा करें या कनेक्ट करने के लिए मित्र का आईडी दर्ज करें।",
    myId: "मेरा आईडी",
    connectTo: "आईडी से कनेक्ट करें",
    connect: "कनेक्ट करें"
  },
  Russian: {
    title: "Настройки",
    general: "Общие",
    nickname: "Никнейм",
    language: "Язык",
    appearance: "Внешний вид и звук",
    theme: "Цвет темы",
    sounds: "Уведомления и звуки",
    privacy: "Конфиденциальность",
    blocked: "Заблокированные",
    noBlocked: "Нет заблокированных пользователей",
    unblock: "Разблокировать",
    close: "Закрыть",
    legalTitle: "Юридическая информация и конфиденциальность",
    legalText: "SlidingChat работает полностью БЕЗ центральной базы данных. Мы уважаем вашу конфиденциальность (соответствие требованиям GDPR и CCPA). Ваши сообщения и данные о местоположении обрабатываются в режиме реального времени и НЕ сохраняются на наших серверах. Все данные хранятся исключительно на вашем локальном устройстве.",
    helpTitle: "Справка и инструкции",
    helpMap: "Карта: Зеленые маркеры — другие пользователи. Красный маркер — вы.",
    helpChat: "Чат: Нажмите, чтобы начать общение. Сообщения переводятся автоматически.",
    helpPrivacy: "Конфиденциальность: Ваше местоположение является приблизительным в целях безопасности.",
    helpFeatures: "Возможности: Аудиосообщения, самоудаляющиеся сообщения (значок секундомера) и отчеты о прочтении.",
    helpRadarTitle: "Статус «В сети» / «Невидимка» (Радар)",
    helpRadarIntro: "Круглая плавающая кнопка переключения со значком молнии или радара (в правом верхнем углу карты) управляет вашим присутствием в реальном времени:",
    helpRadarBullet1: "Зеленый (В сети): Ваше фактическое местоположение безопасно скрывается (сдвигается примерно на 200 м для защиты конфиденциальности) и динамически передается ближайшим пользователям.",
    helpRadarBullet2: "Серый/Красный (Невидимка): Полностью отключает вас от сети. Передача координат прекращается, и вы исчезаете с карт остальных пользователей.",
    helpViewTitle: "Карта против Списка (Смена вида)",
    helpViewIntro: "Вы можете легко переключать режим отображения с помощью панели управления справа:",
    helpViewBullet1: "Значок глобуса (Карта): Отображает интерактивную пространственную карту встреч. Нажмите на зеленый маркер, чтобы начать чат.",
    helpViewBullet2: "Значок списка (Список): Показывает упорядоченную хронологическую историю встреч с указанием примерного расстояния и статуса общения.",
    helpRetroTitle: "Ретроактивная геолокация",
    helpRetroIntro: "Пересекались с кем-то в прошлом, когда приложение было неактивно? Эта функция позволяет вручную записать прошлые встречи!",
    helpRetroBullet1: "Нажмите значок календаря «Ретроактивная геолокация» в боковом меню или углу карты.",
    helpRetroBullet2: "Укажите точную дату, время и добавьте описание (например, «Мы улыбнулись друг другу возле книжного магазина, на мне была зеленая куртка»).",
    helpRetroBullet3: "Перетащите маркер на мини-карте, чтобы отметить точное место встречи.",
    helpRetroBullet4: "Либо нажмите «Разместить на главной карте» и коснитесь прямо на большой основной карте, чтобы установить маркер памяти.",
    helpRetroBullet5: "Если другой пользователь зарегистрирует совпадающие данные (время и место перекрываются), вы мгновенно подключитесь в чате!",
    helpChatTitle: "Чат и возможности Gemini AI",
    helpChatIntro: "SlidingChat предлагает высококачественные инструменты для прямого общения в реальном времени:",
    helpChatBullet1: "Автоперевод (Gemini): Сообщения на иностранных языках автоматически переводятся на ваш язык с помощью Gemini AI!",
    helpChatBullet2: "Голосовые заметки и транскрипция: Записывайте голосовые сообщения, нажав на микрофон. ИИ автоматически расшифрует их в текст на экране.",
    helpChatBullet3: "Исчезающие сообщения (Секундомер): Установите таймер самоликвидации (5 с, 10 с...), и сообщения навсегда исчезнут сразу после просмотра.",
    helpChatBullet4: "Отчеты о прочтении: Две синие галочки подтверждают, что получатель прочитал ваше сообщение.",
    copyright: "Все права защищены SlidingSoft.",
    logout: "Выйти",
    logoutConfirm: "Вы уверены? Текущие данные сессии будут удалены.",
    p2pTitle: "P2P Соединение",
    p2pDesc: "Поделитесь своим ID или введите ID друга для прямого подключения.",
    myId: "Мой ID",
    connectTo: "Подключиться к ID",
    connect: "Подключить"
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
            
            <div className="space-y-3">
                {/* 1. Radar Toggle */}
                <details className="group border border-gray-100 rounded-xl overflow-hidden shadow-sm" open>
                    <summary className="flex items-center justify-between p-3 select-none cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 transition font-semibold text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚡</span>
                            <span>{t.helpRadarTitle}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="19 9l-7 7-7-7"/></svg>
                    </summary>
                    <div className="p-3 bg-white text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100">
                        <p>{t.helpRadarIntro}</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>{t.helpRadarBullet1}</li>
                            <li>{t.helpRadarBullet2}</li>
                        </ul>
                    </div>
                </details>

                {/* 2. Map vs List */}
                <details className="group border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <summary className="flex items-center justify-between p-3 select-none cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 transition font-semibold text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🗺️</span>
                            <span>{t.helpViewTitle}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="19 9l-7 7-7-7"/></svg>
                    </summary>
                    <div className="p-3 bg-white text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100">
                        <p>{t.helpViewIntro}</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>{t.helpViewBullet1}</li>
                            <li>{t.helpViewBullet2}</li>
                        </ul>
                    </div>
                </details>

                {/* 3. Retroactive Geolocation */}
                <details className="group border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <summary className="flex items-center justify-between p-3 select-none cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 transition font-semibold text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📅</span>
                            <span>{t.helpRetroTitle}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="19 9l-7 7-7-7"/></svg>
                    </summary>
                    <div className="p-3 bg-white text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100">
                        <p>{t.helpRetroIntro}</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>{t.helpRetroBullet1}</li>
                            <li>{t.helpRetroBullet2}</li>
                            <li>{t.helpRetroBullet3}</li>
                            <li>{t.helpRetroBullet4}</li>
                            <li>{t.helpRetroBullet5}</li>
                        </ul>
                    </div>
                </details>

                {/* 4. Chat Features */}
                <details className="group border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <summary className="flex items-center justify-between p-3 select-none cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 transition font-semibold text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💬</span>
                            <span>{t.helpChatTitle}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="19 9l-7 7-7-7"/></svg>
                    </summary>
                    <div className="p-3 bg-white text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100">
                        <p>{t.helpChatIntro}</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>{t.helpChatBullet1}</li>
                            <li>{t.helpChatBullet2}</li>
                            <li>{t.helpChatBullet3}</li>
                            <li>{t.helpChatBullet4}</li>
                        </ul>
                    </div>
                </details>
            </div>

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
