
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Clear any existing debug log at start
  try {
    fs.writeFileSync(path.join(process.cwd(), "server.log"), `--- Server Started at ${new Date().toISOString()} ---\n`);
  } catch (err) {}

  // Logging middleware to trace all HTTP requests
  app.use((req, res, next) => {
    try {
      const logMsg = `[HTTP FETCH] ${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip} - User-Agent: ${req.headers["user-agent"]}\n`;
      fs.appendFileSync(path.join(process.cwd(), "server.log"), logMsg);
    } catch (err) {}
    next();
  });

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Store users in memory (for discovery)
  // In a production app, this would be in a database like Redis
  const users = new Map<string, any>();
  const retroactiveCheckIns: any[] = [];

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    try {
      const logLine = `[SOCKET CONNECT] ${new Date().toISOString()} - ID: ${socket.id} - Transport: ${socket.conn.transport.name} - Headers: ${JSON.stringify(socket.handshake.headers)}\n`;
      fs.appendFileSync(path.join(process.cwd(), "server.log"), logLine);
    } catch (err) {}

    // Send existing retroactive check-ins to the new user
    socket.emit("retroactive_list", retroactiveCheckIns);

    socket.on("request_retroactive_list", () => {
      socket.emit("retroactive_list", retroactiveCheckIns);
    });

    socket.on("update_location", (userData) => {
      // userData should contain: id, nickname, language, coords, peerId, avatar, etc.
      if (!userData.id) return;
      
      users.set(userData.id, {
        ...userData,
        socketId: socket.id,
        lastSeen: Date.now()
      });

      // Broadcast the updated user list to everyone
      io.emit("users_update", Array.from(users.values()));
    });

    socket.on("update_status", ({ id, status }) => {
      console.log(`User ${id} status updated to: ${status}`);
      if (status === 'offline') {
        users.delete(id);
      } else {
        const user = users.get(id);
        if (user) {
          user.status = status;
          user.lastSeen = Date.now();
        }
      }
      io.emit("users_update", Array.from(users.values()));
    });

    socket.on("send_message", ({ recipientId, message }) => {
      console.log(`Routing message from ${message.senderId} to ${recipientId} via Socket.IO proxy`);
      const recipientUser = users.get(recipientId);
      if (recipientUser && recipientUser.socketId) {
        io.to(recipientUser.socketId).emit("receive_message", message);
      } else {
        // Search by list fallback
        for (const user of users.values()) {
          if (user.id === recipientId && user.socketId) {
            io.to(user.socketId).emit("receive_message", message);
            break;
          }
        }
      }
    });

    socket.on("add_retroactive", (checkIn) => {
      console.log("Adding retroactive check-in:", checkIn.nickname);
      const newCheckIn = {
        ...checkIn,
        id: `retro_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: Date.now()
      };
      retroactiveCheckIns.push(newCheckIn);
      
      // Keep only last 1000 check-ins to prevent memory issues
      if (retroactiveCheckIns.length > 1000) {
        retroactiveCheckIns.shift();
      }

      io.emit("retroactive_update", newCheckIn);
    });

    socket.on("update_retroactive", (updatedCheckIn) => {
      const index = retroactiveCheckIns.findIndex(c => c.id === updatedCheckIn.id);
      if (index !== -1) {
        // Security check: only allow updating if userId matches (simple check for now)
        if (retroactiveCheckIns[index].userId === updatedCheckIn.userId) {
          retroactiveCheckIns[index] = {
            ...retroactiveCheckIns[index],
            ...updatedCheckIn,
            updatedAt: Date.now()
          };
          io.emit("retroactive_list", retroactiveCheckIns);
        }
      }
    });

    socket.on("delete_retroactive", ({ id, userId }) => {
      const index = retroactiveCheckIns.findIndex(c => c.id === id);
      if (index !== -1) {
        if (retroactiveCheckIns[index].userId === userId) {
          retroactiveCheckIns.splice(index, 1);
          io.emit("retroactive_list", retroactiveCheckIns);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Find the user with this socketId and remove them
      for (const [id, user] of users.entries()) {
        if (user.socketId === socket.id) {
          users.delete(id);
          break;
        }
      }
      // Broadcast the updated user list
      io.emit("users_update", Array.from(users.values()));
    });
  });

  // Prune stale users periodically (e.g., every 30 seconds)
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, user] of users.entries()) {
      if (now - user.lastSeen > 120000) { // 2 minute timeout
        users.delete(id);
        changed = true;
      }
    }
    if (changed) {
      io.emit("users_update", Array.from(users.values()));
    }
  }, 30000);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
