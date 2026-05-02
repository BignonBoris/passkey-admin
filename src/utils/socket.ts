import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") || "http://localhost:3000";
// const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") || "https://passkey-api.onrender.com";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connecté au serveur Socket.io:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Déconnecté du serveur Socket.io");
});
