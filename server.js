// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const gameController = require("./controller");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

io.on("connection", (socket) => {
    console.log("Nuevo jugador conectado:", socket.id.toString());

    // Agregar jugador
    socket.on("addPlayer", (name) => {
        gameController.addPlayer(socket.id, name);
        io.emit("updatePlayers", gameController.players);
    });

    // Iniciar el juego
    socket.on("startGame", () => {
        console.log('start game lol');
        gameController.reset();
        gameController.dealCards();
        gameController.startGame(io);
    });

    socket.on("startRound", () => {
        gameController.startRound(io);
    })

    // Jugar una carta
    socket.on("playCard", (card) => {
        const player = gameController.players.find(p => p.id === socket.id);
        if (player && socket.id !== gameController.currentJudge) {
            console.log(card);
            gameController.cardsSelected.push({ playerId: socket.id, card: card });
            if(gameController.cardsSelected.length === gameController.players.length-1-gameController.nextPlayers.length) {
                io.emit("allCardsPlayed", gameController.cardsSelected);
            }
        }
    });

    // Seleccionar ganador
    socket.on("selectWinner", (winningPlayerId) => {
        if (socket.id === gameController.currentJudge) {
            gameController.selectWinner(winningPlayerId);
            console.log('winner: ' + winningPlayerId);
            io.emit("roundWinner", winningPlayerId);
        }
    });

    // Desconexión de jugador
    socket.on("disconnect", () => {
        gameController.removePlayer(socket.id);
        console.log('jugadores:' + gameController.players.length);
        if(gameController.players.length === 0) {
            gameController.reset();
        }
        io.emit("PlayerRemoved", socket.id);
    });
});

server.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
