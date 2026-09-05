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


/*
====================================================
RAY / PLAYER HIT DETECTION
====================================================
*/

/*
  Finds the closest point on a ray to a point.

  rayOrigin = bullet starting position
  rayDirection = normalized shooting direction
  point = target position
*/
function distanceFromRayToPoint(
  rayOrigin,
  rayDirection,
  point
) {
  const toPoint = {
    x: point.x - rayOrigin.x,
    y: point.y - rayOrigin.y,
    z: point.z - rayOrigin.z
  };

  const projection =
    toPoint.x * rayDirection.x +
    toPoint.y * rayDirection.y +
    toPoint.z * rayDirection.z;

  if (projection < 0) {
    return {
      distance: Infinity,
      projection
    };
  }

  const closestPoint = {
    x:
      rayOrigin.x +
      rayDirection.x * projection,

    y:
      rayOrigin.y +
      rayDirection.y * projection,

    z:
      rayOrigin.z +
      rayDirection.z * projection
  };

  const dx =
    closestPoint.x - point.x;

  const dy =
    closestPoint.y - point.y;

  const dz =
    closestPoint.z - point.z;

  return {
    distance: Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    ),

    projection
  };
}


/*
====================================================
SOCKET CONNECTION
====================================================
*/

io.on("connection", (socket) => {

  console.log(
    "Player connected:",
    socket.id
  );


  /*
  ==================================================
  JOIN GAME
  ==================================================
  */

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


    for (
      const other of players.values()
    ) {

      if (
        other.id !== player.id
      ) {

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


  /*
  ==================================================
  PLAYER MOVEMENT
  ==================================================
  */

  socket.on(
    "playerMove",
    (data) => {

      const player =
        players.get(socket.id);


      if (
        !player ||
        !data ||
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


      /*
        Prevent impossible teleports.
      */
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

    }
  );


  /*
  ==================================================
  SHOOTING + HIT DETECTION
  ==================================================
  */

  socket.on(
    "shoot",
    (data) => {

      const player =
        players.get(socket.id);


      if (
        !player ||
        !data
      ) {
        return;
      }


      /*
      ----------------------------------------------
      GET GUN
      ----------------------------------------------
      */

      const gunId =
        typeof data.gunId === "string"
          ? data.gunId
          : "pistol";


      const gun =
        GUNS[gunId];


      if (!gun) {
        return;
      }


      /*
      Make sure the player actually owns
      the gun they're trying to use.
      */

      if (
        !player.ownedGuns[gunId]
      ) {
        return;
      }


      /*
      Make sure this is their equipped gun.
      */

      if (
        player.currentGun !== gunId
      ) {
        return;
      }


      /*
      ----------------------------------------------
      FIRE RATE CHECK
      ----------------------------------------------
      */

      const now = Date.now();


      if (
        now - player.lastShot <
        gun.cooldown
      ) {
        return;
      }


      player.lastShot = now;


      /*
      ----------------------------------------------
      CHECK SHOT DATA
      ----------------------------------------------
      */

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


      /*
      ----------------------------------------------
      NORMALIZE DIRECTION
      ----------------------------------------------
      */

      const length =
        Math.sqrt(
          dx * dx +
          dy * dy +
          dz * dz
        );


      if (
        length < 0.0001
      ) {
        return;
      }


      const direction = {

        x: dx / length,

        y: dy / length,

        z: dz / length

      };


      /*
      ----------------------------------------------
      SHOW BULLET TO EVERY PLAYER
      ----------------------------------------------
      */

      io.emit(
        "playerShot",
        {

          id: player.id,

          origin,

          direction,

          gunId

        }
      );


      /*
      ----------------------------------------------
      FIND CLOSEST TARGET
      ----------------------------------------------
      */

      let closestPlayer = null;

      let closestDistance = Infinity;


      for (
        const target of players.values()
      ) {

        /*
        Don't shoot yourself.
        */

        if (
          target.id === player.id
        ) {
          continue;
        }


        /*
        --------------------------------------------
        PLAYER HITBOX
        --------------------------------------------

        The old code used:

          y + 1.1

        which put the hit point too high.

        We now use a much larger center point
        covering the player's body/head.
        */

        const hitboxCenter = {

          x: target.position.x,

          y: target.position.y + 1.35,

          z: target.position.z

        };


        /*
        Radius of player's hitbox.

        1.15 makes normal FPS aiming much
        more forgiving and actually matches
        the visible player model.
        */

        const hitboxRadius = 1.15;


        const result =
          distanceFromRayToPoint(
            origin,
            direction,
            hitboxCenter
          );


        /*
        Ignore targets behind us.
        */

        if (
          result.projection < 0
        ) {
          continue;
        }


        /*
        Maximum shooting distance.
        */

        if (
          result.projection > 150
        ) {
          continue;
        }


        /*
        Check whether the bullet ray
        intersects the player's hitbox.
        */

        if (
          result.distance <=
          hitboxRadius
        ) {

          if (
            result.projection <
            closestDistance
          ) {

            closestDistance =
              result.projection;

            closestPlayer =
              target;

          }

        }

      }


      /*
      ----------------------------------------------
      NO HIT
      ----------------------------------------------
      */

      if (
        !closestPlayer
      ) {
        return;
      }


      /*
      ----------------------------------------------
      APPLY DAMAGE
      ----------------------------------------------
      */

      closestPlayer.health =
        Math.max(
          0,
          closestPlayer.health -
            gun.damage
        );


      console.log(
        `${player.username} hit ${closestPlayer.username} for ${gun.damage} damage`
      );


      /*
      ----------------------------------------------
      SEND HIT TO TARGET
      ----------------------------------------------
      */

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


      /*
      ----------------------------------------------
      PLAYER SURVIVED
      ----------------------------------------------
      */

      if (
        closestPlayer.health > 0
      ) {
        return;
      }


      /*
      ----------------------------------------------
      ELIMINATION
      ----------------------------------------------
      */

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


      /*
      ----------------------------------------------
      RESPAWN AFTER 1.5 SECONDS
      ----------------------------------------------
      */

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


        closestPlayer.health =
          100;


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
  );


  /*
  ==================================================
  BUY GUN
  ==================================================
  */

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


      const gun =
        GUNS[gunId];


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


      player.ownedGuns[gunId] =
        true;


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


  /*
  ==================================================
  EQUIP GUN
  ==================================================
  */

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


      if (
        !GUNS[gunId]
      ) {
        return;
      }


      if (
        !player.ownedGuns[gunId]
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


  /*
  ==================================================
  DISCONNECT
  ==================================================
  */

  socket.on(
    "disconnect",
    () => {

      const player =
        players.get(socket.id);


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


/*
====================================================
SERVER ROUTES
====================================================
*/

app.get(
  "/",
  (req, res) => {

    res.send(
      "Game server is running!"
    );

  }
);


app.get(
  "/health",
  (req, res) => {

    res.json({

      status: "online",

      players:
        players.size,

      uptime:
        process.uptime()

    });

  }
);


/*
====================================================
START SERVER
====================================================
*/

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running at http://localhost:${PORT}`
    );

  }
);
