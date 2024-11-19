// controllers/gameController.js

const fs = require("fs");

class GameController {
    constructor() {
        this.players = [];
        this.nextPlayers = [];
        this.blackCards = [];
        this.whiteCards = [];
        this.currentRound = 1;
        this.currentJudge = null;
        this.cardsSelected = [];
        this.loadCards();
    }

    // Cargar las cartas desde archivos JSON
    loadCards() {
        this.blackCards = JSON.parse(fs.readFileSync("./data/black_cards.json"));
        this.whiteCards = JSON.parse(fs.readFileSync("./data/white_cards.json"));
    }

    reset() {
        this.players = [];
        this.nextPlayers = [];
        this.blackCards = [];
        this.whiteCards = [];
        this.currentRound = 1;
        this.currentJudge = null;
        this.cardsSelected = [];
        this.loadCards();
    }

    // Agregar un jugador al juego
    addPlayer(id, name) {
        const newPlayer = { id, name, hand: [], points: 0 };
        this.players.push(newPlayer);
        if(this.currentRound !== 1){
            this.nextPlayers.push(newPlayer);
        }
        // Asignar el primer jugador como juez si es el primero en unirse
        if (this.players.length === 1) this.currentJudge = id;
    }

    // Eliminar un jugador
    removePlayer(id) {
        console.log('jugador desconectado');
        this.players = this.players.filter(player => player.id !== id);
        if (id === this.currentJudge) this.nextJudge();  // Cambiar juez si el juez se va
    }

    // Repartir cartas a cada jugador
    dealCards() {
        console.log(this.whiteCards.length);
        this.players.forEach(player => {
            player.hand = [];
            for (let i = 0; i < 5; i++) {
                const randomCard = this.drawWhiteCard();
                player.hand.push(randomCard);
            }
        });
    }

    // Sacar una carta blanca del mazo
    drawWhiteCard() {
        const index = Math.floor(Math.random() * this.whiteCards.length);
        return this.whiteCards.splice(index, 1)[0];
    }

    // Iniciar una nueva ronda
    startRound(io) {
        if (this.players.length < 3) return; // Necesita al menos 3 jugadores
        this.currentRound++;
        this.cardsSelected = [];
        console.log('empieza la ronda: ' + this.currentRound);
        const lastJudge = this.currentJudge;
        this.currentJudge = this.players[this.currentRound % this.players.length-this.nextPlayers.length].id;
        const blackCard = this.blackCards[Math.floor(Math.random() * this.blackCards.length)];
        
        // Emitimos el evento "newRound" a cada jugador con su mano
        this.players.forEach(player => {
            io.to(player.id).emit("newRound", {
                blackCard,
                judge: this.currentJudge,
                whiteCard: lastJudge !== player.id ? this.drawWhiteCard() : ''
            });
        });
    }

    // Iniciar nuevo juego
    startGame(io) {
        if (this.players.length < 3) return; // Necesita al menos 3 jugadores
        if (this.nextPlayers.length !== 0) {
            this.nextPlayers = [];
        }

        this.currentRound = 1;
        this.currentJudge = this.players[this.currentRound % this.players.length].id;
        const blackCard = this.blackCards[Math.floor(Math.random() * this.blackCards.length)];
        
        // Emitimos el evento "newRound" a cada jugador con su mano
        this.players.forEach(player => {
            io.to(player.id).emit("newGame", {
                blackCard,
                judge: this.currentJudge,
                hand: player.hand  // Enviar solo la mano correspondiente al jugador
            });
        });
    }

    // Cambiar al próximo juez
    nextJudge() {
        if (this.players.length > 0) {
            this.currentJudge = this.players[(this.players.indexOf(this.currentJudge) + 1) % this.players.length].id;
        }
    }

    // Manejar el final de la ronda cuando el juez selecciona un ganador
    selectWinner(winningPlayerId) {
        const winningPlayer = this.players.find(player => player.id === winningPlayerId);
        if (winningPlayer) winningPlayer.points += 1;
    }
}

module.exports = new GameController();
