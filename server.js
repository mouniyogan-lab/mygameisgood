const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

const players = new Map();

const GUNS = {
  pistol: {
    price: 0,
    damage: 25,
    cooldown: 115
  },
  smg: {
    price: 20,
    damage: 15,
    cooldown: 75
  },
  shotgun: {
    price: 40,
    damage: 55,
    cooldown: 550
  },
  rifle: {
    price: 60,
    damage: 35,
    cooldown: 180
  },
  railgun: {
    price: 100,
    damage: 80,
    cooldown: 850
  }
};

const spawnPoints = [
  { x: 0, y: 2.1, z: 25 },
  { x: -36, y: 2.1, z: 25 },
  { x: 36, y: 2.1, z: 25 },
  { x: -38, y: 2.1, z: 0 },
  { x: 38, y: 2.1, z: 0 },
  { x: -36, y: 2.1, z: -38 },
  { x: 36, y: 2.1, z: -38 },
  { x: 0, y: 2.1, z: -42 }
];

function getSpawnPoint() {
  return {
    ...spawnPoints[
      Math.floor(
        Math.random() * spawnPoints.length
      )
    ]
  };
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
    score: player.score,
    coins: player.coins,
    currentGun: player.currentGun
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

      username: cleanName(
        data?.username
      ),

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
      coins: 0,

      ownedGuns: {
        pistol: true
      },

      currentGun: "pistol",
      lastShot: 0
    };

    players.set(
      socket.id,
      player
    );

    const existingPlayers = [];

    for (const other of players.values()) {
      if (other.id !== player.id) {
        existingPlayers.push(
          getPublicPlayer(other)
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
        score: player.score,
        coins: player.coins,
        ownedGuns: player.ownedGuns,
        currentGun: player.currentGun
      }
    );

    socket.broadcast.emit(
      "playerJoined",
      getPublicPlayer(player)
    );

    io.emit(
      "playerCount",
      players.size
    );

    console.log(
      `${player.username} joined`
    );
  });

  socket.on("playerMove", (data) => {
    const player =
      players.get(socket.id);

    if (!player || !data) {
      return;
    }

    if (
      !data.position ||
      !data.rotation
    ) {
      return;
    }

    const x =
      Number(data.position.x);

    const z =
      Number(data.position.z);

    const rx =
      Number(data.rotation.x);

    const ry =
      Number(data.rotation.y);

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(z) ||
      !Number.isFinite(rx) ||
      !Number.isFinite(ry)
    ) {
      return;
    }

    const dx =
      x - player.position.x;

    const dz =
      z - player.position.z;

    const distance =
      Math.sqrt(
        dx * dx +
        dz * dz
      );

    if (distance > 3) {
      return;
    }

    player.position.x = x;
    player.position.y = 2.1;
    player.position.z = z;

    player.rotation.x = rx;
    player.rotation.y = ry;
    player.rotation.z = 0;

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
    const player =
      players.get(socket.id);

    if (!player || !data) {
      return;
    }

    const gunId =
      typeof data.gunId === "string"
        ? data.gunId
        : "pistol";

    const gun = GUNS[gunId];

    if (!gun) {
      return;
    }

    if (!player.ownedGuns[gunId]) {
      return;
    }

    if (player.currentGun !== gunId) {
      return;
    }

    const now = Date.now();

    if (
      now - player.lastShot <
      gun.cooldown
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

    const origin = {
      x: Number(data.origin.x),
      y: Number(data.origin.y),
      z: Number(data.origin.z)
    };

    const dx =
      Number(data.direction.x);

    const dy =
      Number(data.direction.y);

    const dz =
      Number(data.direction.z);

    if (
      !Number.isFinite(origin.x) ||
      !Number.isFinite(origin.y) ||
      !Number.isFinite(origin.z) ||
      !Number.isFinite(dx) ||
      !Number.isFinite(dy) ||
      !Number.isFinite(dz)
    ) {
      return;
    }

    const length =
      Math.sqrt(
        dx * dx +
        dy * dy +
        dz * dz
      );

    if (length < 0.0001) {
      return;
    }

    const direction = {
      x: dx / length,
      y: dy / length,
      z: dz / length
    };

    io.emit(
      "playerShot",
      {
        id: player.id,
        origin,
        direction,
        gunId
      }
    );

    let closestPlayer = null;
    let closestDistance = Infinity;

    for (
      const target of players.values()
    ) {
      if (
        target.id === player.id
      ) {
        continue;
      }

      const center = {
        x: target.position.x,
        y: target.position.y + 1.1,
        z: target.position.z
      };

      const toTarget = {
        x: center.x - origin.x,
        y: center.y - origin.y,
        z: center.z - origin.z
      };

      const projection =
        toTarget.x * direction.x +
        toTarget.y * direction.y +
        toTarget.z * direction.z;

      if (
        projection < 0 ||
        projection > 120
      ) {
        continue;
      }

      const closestPoint = {
        x:
          origin.x +
          direction.x *
            projection,

        y:
          origin.y +
          direction.y *
            projection,

        z:
          origin.z +
          direction.z *
            projection
      };

      const hitX =
        closestPoint.x -
        center.x;

      const hitY =
        closestPoint.y -
        center.y;

      const hitZ =
        closestPoint.z -
        center.z;

      const distance =
        Math.sqrt(
          hitX * hitX +
          hitY * hitY +
          hitZ * hitZ
        );

      if (
        distance <= 1.0 &&
        projection < closestDistance
      ) {
        closestDistance =
          projection;

        closestPlayer =
          target;
      }
    }

    if (!closestPlayer) {
      return;
    }

    closestPlayer.health =
      Math.max(
        0,
        closestPlayer.health -
          gun.damage
      );

    io.to(
      closestPlayer.id
    ).emit(
      "playerHit",
      {
        targetId:
          closestPlayer.id,

        attackerId:
          player.id,

        attackerName:
          player.username,

        health:
          closestPlayer.health,

        damage:
          gun.damage
      }
    );

    if (
      closestPlayer.health > 0
    ) {
      return;
    }

    player.score += 100;

    player.coins += 10;

    socket.emit(
      "scoreUpdate",
      {
        id: player.id,
        score: player.score
      }
    );

    socket.emit(
      "currencyUpdate",
      {
        id: player.id,
        coins: player.coins
      }
    );

    io.emit(
      "playerEliminated",
      {
        targetId:
          closestPlayer.id,

        attackerId:
          player.id,

        attackerName:
          player.username,

        reward: 10
      }
    );

    setTimeout(() => {
      if (
        !players.has(
          closestPlayer.id
        )
      ) {
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
  });

  socket.on(
    "buyGun",
    (gunId) => {
      const player =
        players.get(socket.id);

      if (
        !player ||
        typeof gunId !== "string"
      ) {
        return;
      }

      const gun = GUNS[gunId];

      if (!gun) {
        return;
      }

      if (
        player.ownedGuns[gunId]
      ) {
        socket.emit(
          "gunPurchaseFailed",
          {
            message:
              "You already own this gun."
          }
        );

        return;
      }

      if (
        player.coins <
        gun.price
      ) {
        socket.emit(
          "gunPurchaseFailed",
          {
            message:
              "Not enough coins."
          }
        );

        return;
      }

      player.coins -=
        gun.price;

      player.ownedGuns[
        gunId
      ] = true;

      player.currentGun =
        gunId;

      socket.emit(
        "gunPurchased",
        {
          ownedGuns:
            player.ownedGuns,

          coins:
            player.coins,

          currentGun:
            player.currentGun
        }
      );
    }
  );

  socket.on(
    "equipGun",
    (gunId) => {
      const player =
        players.get(socket.id);

      if (
        !player ||
        typeof gunId !== "string"
      ) {
        return;
      }

      if (!GUNS[gunId]) {
        return;
      }

      if (
        !player.ownedGuns[
          gunId
        ]
      ) {
        return;
      }

      player.currentGun =
        gunId;

      socket.emit(
        "gunInventory",
        {
          ownedGuns:
            player.ownedGuns,

          currentGun:
            player.currentGun
        }
      );
    }
  );

  socket.on(
    "disconnect",
    () => {
      const player =
        players.get(
          socket.id
        );

      if (player) {
        console.log(
          `${player.username} left`
        );
      }

      players.delete(
        socket.id
      );

      socket.broadcast.emit(
        "playerLeft",
        socket.id
      );

      io.emit(
        "playerCount",
        players.size
      );
    }
  );
});
app.get("/", (req, res) => {
  res.send("Game server is running!");
});
app.get(
  "/health",
  (req, res) => {
    res.json({
      status: "online",
      players: players.size,
      uptime: process.uptime()
    });
  }
);

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running at http://localhost:${PORT}`
    );
  }
);
