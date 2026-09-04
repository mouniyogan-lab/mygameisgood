const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname)));

const players = new Map();

const spawnPoints = [
  { x: 0, y: 2.1, z: 38 },
  { x: -36, y: 2.1, z: 38 },
  { x: 36, y: 2.1, z: 38 },
  { x: -38, y: 2.1, z: 0 },
  { x: 38, y: 2.1, z: 0 },
  { x: -36, y: 2.1, z: -38 },
  { x: 36, y: 2.1, z: -38 },
  { x: 0, y: 2.1, z: -42 }
];

function getSpawnPoint() {
  return spawnPoints[
    Math.floor(Math.random() * spawnPoints.length)
  ];
}

function cleanName(name) {
  if (typeof name !== "string") {
    return "Player";
  }

  const cleaned = name
    .replace(/[^\w\- ]/g, "")
    .trim()
    .slice(0, 16);

  return cleaned || "Player";
}

function sendPlayerCount() {
  io.emit("playerCount", players.size);
}

function getPublicPlayer(player) {
  return {
    id: player.id,
    username: player.username,
    position: {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z
    },
    rotation: {
      x: player.rotation.x,
      y: player.rotation.y,
      z: player.rotation.z
    },
    health: player.health,
    score: player.score
  };
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinGame", (data) => {
    if (players.has(socket.id)) {
      return;
    }

    const spawn = getSpawnPoint();

    const player = {
      id: socket.id,
      username: cleanName(data?.username),
      position: {
        x: spawn.x,
        y: spawn.y,
        z: spawn.z
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      health: 100,
      score: 0,
      lastShot: 0
    };

    players.set(socket.id, player);

    const existingPlayers = [];

    for (const otherPlayer of players.values()) {
      if (otherPlayer.id !== socket.id) {
        existingPlayers.push(
          getPublicPlayer(otherPlayer)
        );
      }
    }

    socket.emit(
      "existingPlayers",
      existingPlayers
    );

    socket.emit(
      "joinAccepted",
      {
        id: player.id,
        username: player.username,
        position: player.position,
        health: player.health,
        score: player.score
      }
    );

    socket.broadcast.emit(
      "playerJoined",
      getPublicPlayer(player)
    );

    sendPlayerCount();

    console.log(
      `${player.username} joined the game`
    );
  });

  socket.on("playerMove", (data) => {
    const player = players.get(socket.id);

    if (!player || !data) {
      return;
    }

    if (
      !data.position ||
      !data.rotation
    ) {
      return;
    }

    const x = Number(data.position.x);
    const y = Number(data.position.y);
    const z = Number(data.position.z);

    const rx = Number(data.rotation.x);
    const ry = Number(data.rotation.y);
    const rz = Number(data.rotation.z);

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(z) ||
      !Number.isFinite(rx) ||
      !Number.isFinite(ry) ||
      !Number.isFinite(rz)
    ) {
      return;
    }

    const dx = x - player.position.x;
    const dz = z - player.position.z;

    const distance = Math.sqrt(
      dx * dx + dz * dz
    );

    if (distance > 3) {
      return;
    }

    player.position.x = x;
    player.position.y = 2.1;
    player.position.z = z;

    player.rotation.x = rx;
    player.rotation.y = ry;
    player.rotation.z = rz;

    socket.broadcast.emit(
      "playerMoved",
      {
        id: player.id,
        position: player.position,
        rotation: player.rotation
      }
    );
  });

  socket.on("shoot", (data) => {
    const player = players.get(socket.id);

    if (!player || !data) {
      return;
    }

    const now = Date.now();

    if (
      now - player.lastShot <
      100
    ) {
      return;
    }

    player.lastShot = now;

    if (
      !data.origin ||
      !data.direction
    ) {
      return;
    }

    const ox = Number(data.origin.x);
    const oy = Number(data.origin.y);
    const oz = Number(data.origin.z);

    const dx = Number(data.direction.x);
    const dy = Number(data.direction.y);
    const dz = Number(data.direction.z);

    if (
      !Number.isFinite(ox) ||
      !Number.isFinite(oy) ||
      !Number.isFinite(oz) ||
      !Number.isFinite(dx) ||
      !Number.isFinite(dy) ||
      !Number.isFinite(dz)
    ) {
      return;
    }

    socket.broadcast.emit(
      "playerShot",
      {
        id: player.id,
        origin: {
          x: ox,
          y: oy,
          z: oz
        },
        direction: {
          x: dx,
          y: dy,
          z: dz
        }
      }
    );

    /*
      Simple server-side hit detection.
      The projectile visual is handled by game.js.
    */

    const directionLength = Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    );

    if (directionLength === 0) {
      return;
    }

    const ndx = dx / directionLength;
    const ndy = dy / directionLength;
    const ndz = dz / directionLength;

    let closestPlayer = null;
    let closestDistance = Infinity;

    for (const target of players.values()) {
      if (target.id === player.id) {
        continue;
      }

      const tx =
        target.position.x - ox;

      const ty =
        (target.position.y + 1.1) - oy;

      const tz =
        target.position.z - oz;

      const projection =
        tx * ndx +
        ty * ndy +
        tz * ndz;

      if (
        projection < 0 ||
        projection > 120
      ) {
        continue;
      }

      const closestX =
        ox + ndx * projection;

      const closestY =
        oy + ndy * projection;

      const closestZ =
        oz + ndz * projection;

      const hitX =
        target.position.x;

      const hitY =
        target.position.y + 1.1;

      const hitZ =
        target.position.z;

      const hx =
        closestX - hitX;

      const hy =
        closestY - hitY;

      const hz =
        closestZ - hitZ;

      const distanceFromLine =
        Math.sqrt(
          hx * hx +
          hy * hy +
          hz * hz
        );

      if (
        distanceFromLine < 1.1 &&
        projection < closestDistance
      ) {
        closestPlayer = target;
        closestDistance = projection;
      }
    }

    if (!closestPlayer) {
      return;
    }

    closestPlayer.health -= 25;

    socket.emit(
      "scoreUpdate",
      {
        id: player.id,
        score: player.score
      }
    );

    io.to(closestPlayer.id).emit(
      "playerHit",
      {
        targetId: closestPlayer.id,
        attackerId: player.id,
        attackerName: player.username,
        health: closestPlayer.health
      }
    );

    if (closestPlayer.health <= 0) {
      player.score += 100;

      socket.emit(
        "scoreUpdate",
        {
          id: player.id,
          score: player.score
        }
      );

      io.emit(
        "playerEliminated",
        {
          targetId: closestPlayer.id,
          attackerId: player.id,
          attackerName: player.username
        }
      );

      setTimeout(() => {
        if (!players.has(closestPlayer.id)) {
          return;
        }

        const newSpawn =
          getSpawnPoint();

        closestPlayer.health = 100;

        closestPlayer.position = {
          x: newSpawn.x,
          y: newSpawn.y,
          z: newSpawn.z
        };

        closestPlayer.rotation = {
          x: 0,
          y: 0,
          z: 0
        };

        io.to(
          closestPlayer.id
        ).emit(
          "respawn",
          {
            health: 100,
            position:
              closestPlayer.position
          }
        );
      }, 1500);
    }
  });

  socket.on("disconnect", () => {
    const player = players.get(socket.id);

    if (player) {
      console.log(
        `${player.username} left the game`
      );
    }

    players.delete(socket.id);

    socket.broadcast.emit(
      "playerLeft",
      socket.id
    );

    sendPlayerCount();
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    players: players.size
  });
});

const PORT =
  process.env.PORT || 3000;

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running at http://localhost:${PORT}`
    );
  }
);