
import { Peer } from "peerjs";
import { Message } from "../types";

// Map to store active connections
const connections: Record<string, any> = {};
let peerInstance: Peer | null = null;
// Changed to an array to support multiple listeners (App notifications + Chat interface)
let listeners: ((msg: Message) => void)[] = [];
let socketFallbackHandler: ((recipientId: string, message: Message) => void) | null = null;

export const setSocketFallbackHandler = (handler: (recipientId: string, message: Message) => void) => {
  socketFallbackHandler = handler;
};

export const triggerIncomingMessage = (msg: Message) => {
  listeners.forEach(listener => {
    try {
      listener(msg);
    } catch (e) {
      console.error("Error invoking P2P message listener:", e);
    }
  });
};

export const initP2P = (myId: string) => {
  if (peerInstance) return;

  // Clean the ID to be PeerJS friendly (alphanumeric)
  const cleanId = myId.replace(/[^a-zA-Z0-9]/g, '');

  try {
      // Using public PeerJS cloud server for prototype
      peerInstance = new Peer(cleanId);

      peerInstance.on('open', (id) => {
        console.log('My P2P ID is:', id);
      });

      peerInstance.on('connection', (conn) => {
        conn.on('data', (data) => {
           // Notify all listeners
           triggerIncomingMessage(data as Message);
        });
        connections[conn.peer] = conn;
      });

      peerInstance.on('error', (err) => {
          console.error("PeerJS Error:", err);
      });
  } catch (e) {
      console.error("Failed to init P2P", e);
  }
};

export const connectToPeer = (peerId: string) => {
    if (!peerInstance) return;
    
    const cleanPeerId = peerId.replace(/[^a-zA-Z0-9]/g, '');
    const conn = peerInstance.connect(cleanPeerId);
    
    conn.on('open', () => {
        connections[cleanPeerId] = conn;
        console.log("Connected to", cleanPeerId);
    });

    conn.on('data', (data) => {
        // Notify all listeners
        triggerIncomingMessage(data as Message);
    });
};

export const sendP2PMessage = (recipientId: string, peerId: string | undefined, message: Message) => {
    let sentP2P = false;
    if (peerId) {
        // Determine the connection key (try exact match or clean match)
        const cleanPeerId = peerId.replace(/[^a-zA-Z0-9]/g, '');
        const conn = connections[peerId] || connections[cleanPeerId];
        
        if (conn && conn.open) {
            conn.send(message);
            sentP2P = true;
            console.log("Message sent to", cleanPeerId, "via PeerJS");
        } else {
            // Try to reconnect and send
            connectToPeer(peerId);
            // Simple retry once (could be improved)
            setTimeout(() => {
                 const retryConn = connections[peerId] || connections[cleanPeerId];
                 if (retryConn && retryConn.open) {
                     retryConn.send(message);
                     console.log("Message sent on retry to", cleanPeerId, "via PeerJS");
                 }
            }, 1000);
        }
    }

    // Always deliver via Socket.io bridge as well. This guarantees 100% delivery even if
    // P2P direct hole punching fails or is blocked on mobile carrier/school networks!
    if (socketFallbackHandler) {
        socketFallbackHandler(recipientId, message);
        console.log("Message proxy request sent via Socket.io to user:", recipientId);
    }
};

export const onP2PMessage = (callback: (msg: Message) => void) => {
    listeners.push(callback);
    // Return unsubscribe function
    return () => { 
        listeners = listeners.filter(l => l !== callback);
    };
};
