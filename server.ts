
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Cross-runtime compatible path resolution (ESM during dev, CJS during production bundle)
const resolvedFilename = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "";
const resolvedDirname = resolvedFilename ? path.dirname(resolvedFilename) : process.cwd();

async function startServer() {
  const app = express();

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow any requesting origin dynamically (important for local development, web preview, and Capacitor apps)
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true
  });

  const PORT = 3000;

  // Store users in memory (for discovery)
  // In a production app, this would be in a database like Redis
  const users = new Map<string, any>();
  const retroactiveCheckIns: any[] = [];

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

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

  // Cache generated PNG buffers in memory so public/ stays free of generated binaries that could block GitHub export
  const pngIconCache = new Map<number, Buffer>();

  // Serve logo and icons dynamically as true PNGs generated from src/assets/images/logo_1783246563222.jpg
  app.get(["/logo.png", "/favicon.png", "/icon-192.png", "/icon-512.png"], async (req, res) => {
    const filename = path.basename(req.path);
    const publicPngPath = path.join(process.cwd(), "public", filename);
    const assetJpgPath = path.join(process.cwd(), "src", "assets", "images", "logo_1783246563222.jpg");

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    if (fs.existsSync(publicPngPath)) {
      res.setHeader("Content-Type", "image/png");
      res.sendFile(publicPngPath);
      return;
    }

    if (fs.existsSync(assetJpgPath)) {
      const targetSize = filename === "favicon.png" || filename === "icon-192.png" ? 192 : 512;
      try {
        if (!pngIconCache.has(targetSize)) {
          const sharpMod = (await import("sharp")).default;
          const buf = await sharpMod(assetJpgPath)
            .resize(targetSize, targetSize, {
              fit: "contain",
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            })
            .png()
            .toBuffer();
          pngIconCache.set(targetSize, buf);
        }
        res.setHeader("Content-Type", "image/png");
        res.send(pngIconCache.get(targetSize));
        return;
      } catch (e) {
        res.setHeader("Content-Type", "image/jpeg");
        res.sendFile(assetJpgPath);
        return;
      }
    }

    res.status(404).end();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Explicitly prevent browser caching of ALL assets during development to avoid stale files
    app.use((req, res, next) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      next();
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production with strict cache-control headers
    const distPath = path.join(process.cwd(), "dist");
    
    // Explicitly serve index.html with Cache-Control no-store
    app.get("/", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });

    // Serve other static assets with immutable caching since they have unique hash names, except html files
    app.use(express.static(distPath, {
      etag: true,
      lastModified: true,
      setHeaders: (res, filepath) => {
        const basename = path.basename(filepath);
        if (filepath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (
          basename === "logo.png" || 
          basename === "favicon.png" || 
          basename === "icon-192.png" || 
          basename === "icon-512.png" || 
          basename === "manifest.json"
        ) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else {
          // JS, CSS, and other assets with unique hash names can be cached immutably
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));
    
    // Fallback route for SPA should also have no-store cache headers
    app.get("*all", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
