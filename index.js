const express = require("express");
const bodyParser = require("body-parser");
const { Server, Socket } = require("socket.io");
const io = new Server({
  cors: true,
});
const app = express();

app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();
io.on("connection", (socket) => {
  console.log("new connection");

  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    console.log("user", emailId, "joined room", roomId);

    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("incomming-call", { from: fromEmail, offer });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });
});

app.get("/", (req, res) => {
  try {
    res.status(200).send("Welcome to Video Call Backend Server");
  } catch (error) {
    res.status(error).send("Error: " + error);
  }
});
app.listen(8000, () => console.log("Http server listening on 8000"));
io.listen(8001);
