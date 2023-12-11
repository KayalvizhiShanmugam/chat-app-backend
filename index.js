const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const registeredUsernames = {};
const socketIdToUsername = {};


const messages = [];

function emitActiveUsers() {
  const activeUserNames = Object.values(registeredUsernames);
  io.emit("activeUsers", activeUserNames);
  io.emit("Allmessages", messages)
}


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  
  socket.emit("messages", messages);
  emitActiveUsers();

  
  socket.on("message", (message) => {
  
    messages.push({
      message,
      userId: socket.id,
      userName: registeredUsernames[socket.id],
    });
    
    io.emit("message", {
      message,
      userId: socket.id,
      userName: registeredUsernames[socket.id],
    });
  });

  
  socket.on("register", (userName, callback) => {
    if (
      !socketIdToUsername[socket.id] &&
      !Object.values(registeredUsernames).includes(userName)
    ) {
      console.log("User registered:", userName);
      registeredUsernames[socket.id] = userName;
      socketIdToUsername[socket.id] = userName;
      emitActiveUsers();
      callback({ success: true });
    } else {
      console.log("User registration failed:", userName);
      callback({
        success: false,
        message: "Username already taken. Please try another.",
      });
    }
  });

  
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    const userName = socketIdToUsername[socket.id];
    delete registeredUsernames[socket.id];
    delete socketIdToUsername[socket.id];
    emitActiveUsers();
  });
});


app.use(cors());


const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




