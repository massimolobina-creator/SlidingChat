
import { Peer } from "peerjs";
import { Message } from "../types";

// Map to store active connections
const connections: Record<string, any> = {};
let peerInstance: Peer | null = null;
// Changed to an array to support multiple listeners (App notifications + Chat interface)
let listeners: ((msg: Message) => void)[] = [];

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
           listeners.forEach(listener => listener(data as Message));
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
        listeners.forEach(listener => listener(data as Message));
    });
};

export const sendP2PMessage = (peerId: string, message: Message) => {
    // Determine the connection key (try exact match or clean match)
    const cleanPeerId = peerId.replace(/[^a-zA-Z0-9]/g, '');
    const conn = connections[peerId] || connections[cleanPeerId];
    
    if (conn && conn.open) {
        conn.send(message);
    } else {
        // Try to reconnect and send
        connectToPeer(peerId);
        // Simple retry once (could be improved)
        setTimeout(() => {
             const retryConn = connections[peerId] || connections[cleanPeerId];
             if (retryConn && retryConn.open) retryConn.send(message);
        }, 1000);
    }
};

export const onP2PMessage = (callback: (msg: Message) => void) => {
    listeners.push(callback);
    // Return unsubscribe function
    return () => { 
        listeners = listeners.filter(l => l !== callback);
    };
};
