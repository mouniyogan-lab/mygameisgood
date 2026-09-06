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

app.use(express.json());

/* ======================================================
   SERVER
====================================================== */

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Neon Strike server is online!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    players: players.size
  });
});


/* ======================================================
   PLAYERS
====================================================== */

const players = new Map();

/* ======================================================
   MAP COLLISION BOXES
====================================================== */

const collisionBoxes = [];

function addCollisionBox(
  x,
  y,
  z,
  width,
  height,
  depth
) {
  collisionBoxes.push({
    minX: x - width / 2,
    maxX: x + width / 2,

    minY: 0,
    maxY: height,

    minZ: z - depth / 2,
    maxZ: z + depth / 2
  });
}

/* ======================================================
   CRATES
====================================================== */

const crateSize = 2.8;

function addCrateCollision(x, z, scaleY = 1) {

  addCollisionBox(
    x,
    0,
    z,
    crateSize,
    crateSize * scaleY,
    crateSize
  );

}


addCrateCollision(-38, -8);
addCrateCollision(-35, -8);

addCrateCollision(-38, -5);
addCrateCollision(-35, -5);


addCrateCollision(38, -8);
addCrateCollision(35, -8);

addCrateCollision(38, -5);
addCrateCollision(35, -5);


addCrateCollision(-10, 35);
addCrateCollision(-7, 35);

addCrateCollision(10, 35);
addCrateCollision(7, 35);

/* ======================================================
   OUTER WALLS
====================================================== */

const arenaSize = 120;

addCollisionBox(
  0, 5, -arenaSize / 2,
  arenaSize, 10, 1.2
);

addCollisionBox(
  0, 5, arenaSize / 2,
  arenaSize, 10, 1.2
);

addCollisionBox(
  -arenaSize / 2, 5, 0,
  1.2, 10, arenaSize
);

addCollisionBox(
  arenaSize / 2, 5, 0,
  1.2, 10, arenaSize
);


/* ======================================================
   BUILDINGS
====================================================== */

addCollisionBox(
  -40, 0, -27,
  20, 8, 18
);

addCollisionBox(
  40, 0, -27,
  20, 8, 18
);

addCollisionBox(
  -43, 0, 30,
  14, 6, 17
);

addCollisionBox(
  43, 0, 30,
  14, 6, 17
);


/* ======================================================
   CENTRAL STRUCTURE
====================================================== */

addCollisionBox(
  0, 0, -17,
  28, 7, 3
);

addCollisionBox(
  -14, 0, -8,
  3, 7, 18
);

addCollisionBox(
  14, 0, -8,
  3, 7, 18
);


/* ======================================================
   LONG COVER WALLS
====================================================== */

addCollisionBox(
  -30, 0, 2,
  14, 3, 2
);

addCollisionBox(
  30, 0, 2,
  14, 3, 2
);

addCollisionBox(
  -7, 0, 12,
  12, 3, 2
);

addCollisionBox(
  7, 0, 12,
  12, 3, 2
);


/* ======================================================
   SMALL CONCRETE BLOCKS
====================================================== */

addCollisionBox(
  -27, 0, -16,
  6, 3, 4
);

addCollisionBox(
  27, 0, -16,
  6, 3, 4
);

addCollisionBox(
  -25, 0, 25,
  7, 4, 4
);

addCollisionBox(
  25, 0, 25,
  7, 4, 4
);


/* ======================================================
   GUNS
====================================================== */

const GUNS = {

  pistol: {
    name: "Pistol",
    price: 0,
    damage: 25,
    cooldown: 115
  },

  smg: {
    name: "SMG",
    price: 20,
    damage: 15,
    cooldown: 75
  },

  shotgun: {
    name: "Shotgun",
    price: 40,
    damage: 55,
    cooldown: 550
  },

  rifle: {
    name: "Assault Rifle",
    price: 60,
    damage: 35,
    cooldown: 180
  },

  railgun: {
    name: "Railgun",
    price: 100,
    damage: 80,
    cooldown: 850
  }

};


/* ======================================================
   SPAWN POINTS
====================================================== */

const SPAWN_POINTS = [

  { x: 0, z: 25 },

  { x: 0, z: -25 },

  { x: 25, z: 0 },

  { x: -25, z: 0 },

  { x: 35, z: 35 },

  { x: -35, z: 35 },

  { x: 35, z: -35 },

  { x: -35, z: -35 }

];


function getSpawnPoint() {

  return SPAWN_POINTS[
    Math.floor(
      Math.random() *
      SPAWN_POINTS.length
    )
  ];

}


/* ======================================================
   SAFE NUMBER
====================================================== */

function safeNumber(value, fallback = 0) {

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;

}


/* ======================================================
   DISTANCE FROM RAY TO POINT
====================================================== */

function distanceFromRayToPoint(
  rayOrigin,
  rayDirection,
  point
) {

  /* ======================================================
   RAY VS WALL
====================================================== */

function rayHitsBox(
  origin,
  direction,
  box,
  maxDistance = 150
) {

  let tMin = 0;
  let tMax = maxDistance;


  /* X */

  if (Math.abs(direction.x) < 0.000001) {

    if (
      origin.x < box.minX ||
      origin.x > box.maxX
    ) {
      return false;
    }

  } else {

    let tx1 =
      (box.minX - origin.x) /
      direction.x;

    let tx2 =
      (box.maxX - origin.x) /
      direction.x;

    if (tx1 > tx2) {
      [tx1, tx2] = [tx2, tx1];
    }

    tMin = Math.max(tMin, tx1);
    tMax = Math.min(tMax, tx2);

    if (tMin > tMax) {
      return false;
    }
  }


  /* Y */

  if (Math.abs(direction.y) < 0.000001) {

    if (
      origin.y < box.minY ||
      origin.y > box.maxY
    ) {
      return false;
    }

  } else {

    let ty1 =
      (box.minY - origin.y) /
      direction.y;

    let ty2 =
      (box.maxY - origin.y) /
      direction.y;

    if (ty1 > ty2) {
      [ty1, ty2] = [ty2, ty1];
    }

    tMin = Math.max(tMin, ty1);
    tMax = Math.min(tMax, ty2);

    if (tMin > tMax) {
      return false;
    }
  }


  /* Z */

  if (Math.abs(direction.z) < 0.000001) {

    if (
      origin.z < box.minZ ||
      origin.z > box.maxZ
    ) {
      return false;
    }

  } else {

    let tz1 =
      (box.minZ - origin.z) /
      direction.z;

    let tz2 =
      (box.maxZ - origin.z) /
      direction.z;

    if (tz1 > tz2) {
      [tz1, tz2] = [tz2, tz1];
    }

    tMin = Math.max(tMin, tz1);
    tMax = Math.min(tMax, tz2);

    if (tMin > tMax) {
      return false;
    }
  }


  return tMin <= tMax;
}

  const toPoint = {

    x:
      point.x -
      rayOrigin.x,

    y:
      point.y -
      rayOrigin.y,

    z:
      point.z -
      rayOrigin.z

  };


  const projection =

    toPoint.x *
      rayDirection.x +

    toPoint.y *
      rayDirection.y +

    toPoint.z *
      rayDirection.z;


  if (projection < 0) {

    return {
      distance: Infinity,
      projection
    };

  }


  const closestPoint = {

    x:
      rayOrigin.x +
      rayDirection.x *
        projection,

    y:
      rayOrigin.y +
      rayDirection.y *
        projection,

    z:
      rayOrigin.z +
      rayDirection.z *
        projection

  };


  const dx =
    closestPoint.x -
    point.x;

  const dy =
    closestPoint.y -
    point.y;

  const dz =
    closestPoint.z -
    point.z;


  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    );


  return {
    distance,
    projection
  };

}


/* ======================================================
   SOCKET CONNECTION
====================================================== */

io.on("connection", (socket) => {

  console.log(
    "PLAYER CONNECTED:",
    socket.id
  );


  /* ====================================================
     JOIN GAME
  ==================================================== */

  socket.on(
    "joinGame",
    (data) => {

      const username =
        String(
          data?.username ||
          "Player"
        )
        .replace(
          /[^\w\- ]/g,
          ""
        )
        .slice(
          0,
          16
        ) ||
        "Player";


      const spawn =
        getSpawnPoint();


      const player = {

        id:
          socket.id,

        username,

        health:
          100,

        score:
          0,

        coins:
          0,

        ownedGuns: {
          pistol: true
        },

        currentGun:
          "pistol",

        position: {

          x:
            spawn.x,

          y:
            2.1,

          z:
            spawn.z

        },

        rotation: {

          x:
            0,

          y:
            0,

          z:
            0

        },

        lastShot:
          0

      };


      players.set(
        socket.id,
        player
      );


      /* Send existing players to new player */

      const existingPlayers =
        [];


      for (
        const other of
        players.values()
      ) {

        if (
          other.id ===
          socket.id
        ) {

          continue;

        }


        existingPlayers.push({

          id:
            other.id,

          username:
            other.username,

          position:
            other.position,

          rotation:
            other.rotation

        });

      }


      socket.emit(
        "joinAccepted",
        {

          id:
            player.id,

          health:
            player.health,

          score:
            player.score,

          coins:
            player.coins,

          ownedGuns:
            player.ownedGuns,

          currentGun:
            player.currentGun,

          position:
            player.position

        }
      );


      socket.emit(
        "existingPlayers",
        existingPlayers
      );


      /* Tell everyone else */

      socket.broadcast.emit(
        "playerJoined",
        {

          id:
            player.id,

          username:
            player.username,

          position:
            player.position,

          rotation:
            player.rotation

        }
      );


      io.emit(
        "playerCount",
        players.size
      );


      console.log(
        `${username} joined the game`
      );

    }
  );


  /* ====================================================
     PLAYER MOVEMENT
  ==================================================== */

  socket.on(
    "playerMove",
    (data) => {

      const player =
        players.get(
          socket.id
        );


      if (!player) {
        return;
      }


      if (
        !data ||
        !data.position ||
        !data.rotation
      ) {

        return;

      }


      const newX =
        safeNumber(
          data.position.x,
          player.position.x
        );

      const newY =
        safeNumber(
          data.position.y,
          player.position.y
        );

      const newZ =
        safeNumber(
          data.position.z,
          player.position.z
        );


      const newRotX =
        safeNumber(
          data.rotation.x,
          player.rotation.x
        );

      const newRotY =
        safeNumber(
          data.rotation.y,
          player.rotation.y
        );

      const newRotZ =
        safeNumber(
          data.rotation.z,
          player.rotation.z
        );


      /* Prevent huge teleporting */

      const dx =
        newX -
        player.position.x;

      const dy =
        newY -
        player.position.y;

      const dz =
        newZ -
        player.position.z;


      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy +
          dz * dz
        );


      if (
        distance > 3
      ) {

        return;

      }


      player.position = {

        x:
          newX,

        y:
          newY,

        z:
          newZ

      };


      player.rotation = {

        x:
          newRotX,

        y:
          newRotY,

        z:
          newRotZ

      };


      socket.broadcast.emit(
        "playerMoved",
        {

          id:
            socket.id,

          position:
            player.position,

          rotation:
            player.rotation

        }
      );

    }
  );


  /* ====================================================
     SHOOT
  ==================================================== */

  socket.on(
    "shoot",
    (data) => {

      const player =
        players.get(
          socket.id
        );


      if (!player) {

        console.log(
          "SHOT REJECTED: player not found"
        );

        return;

      }


      /* -----------------------------------------------
         GET GUN
      ------------------------------------------------ */

      const gunId =
        data?.gunId ||
        player.currentGun ||
        "pistol";


      const gun =
        GUNS[gunId];


      if (!gun) {

        console.log(
          "SHOT REJECTED: invalid gun",
          gunId
        );

        return;

      }


      /* -----------------------------------------------
         SERVER-SIDE FIRE RATE
      ------------------------------------------------ */

      const now =
        Date.now();


      if (
        now -
          player.lastShot <
        gun.cooldown
      ) {

        return;

      }


      player.lastShot =
        now;


      /* -----------------------------------------------
         SHOT ORIGIN
      ------------------------------------------------ */

      if (
        !data ||
        !data.origin ||
        !data.direction
      ) {

        console.log(
          "SHOT REJECTED: missing origin/direction"
        );

        return;

      }


      const origin = {

        x:
          safeNumber(
            data.origin.x
          ),

        y:
          safeNumber(
            data.origin.y
          ),

        z:
          safeNumber(
            data.origin.z
          )

      };


      /* -----------------------------------------------
         SHOT DIRECTION
      ------------------------------------------------ */

      const direction = {

        x:
          safeNumber(
            data.direction.x
          ),

        y:
          safeNumber(
            data.direction.y
          ),

        z:
          safeNumber(
            data.direction.z
          )

      };


      /* Normalize direction */

      const length =
        Math.sqrt(

          direction.x *
            direction.x +

          direction.y *
            direction.y +

          direction.z *
            direction.z

        );


      if (
        length <= 0.0001
      ) {

        console.log(
          "SHOT REJECTED: zero direction"
        );

        return;

      }


      direction.x /=
        length;

      direction.y /=
        length;

      direction.z /=
        length;


      /* -----------------------------------------------
         BROADCAST SHOT VISUAL
      ------------------------------------------------ */

      io.emit(
        "playerShot",
        {

          id:
            socket.id,

          origin,

          direction

        }
      );


      console.log(
        `${player.username} fired ${gun.name}`
      );

/* =================================================
   CHECK WALL COLLISION FIRST
================================================= */

let closestWallDistance =
  Infinity;


for (const box of collisionBoxes) {

  if (
    rayHitsBox(
      origin,
      direction,
      box,
      150
    )
  ) {

    /* Find the approximate distance to the wall */

    let wallDistance = Infinity;

    /*
      Test the ray in small increments so we know
      approximately where the wall is.
    */

    for (
      let distance = 0;
      distance <= 150;
      distance += 0.25
    ) {

      const x =
        origin.x +
        direction.x *
          distance;

      const y =
        origin.y +
        direction.y *
          distance;

      const z =
        origin.z +
        direction.z *
          distance;


      if (
        x >= box.minX &&
        x <= box.maxX &&
        y >= box.minY &&
        y <= box.maxY &&
        z >= box.minZ &&
        z <= box.maxZ
      ) {

        wallDistance =
          distance;

        break;

      }

    }


    if (
      wallDistance <
      closestWallDistance
    ) {

      closestWallDistance =
        wallDistance;

    }

  }

}

      /* -----------------------------------------------
         FIND TARGET
      ------------------------------------------------ */

      let closestPlayer =
        null;

      let closestDistance =
        Infinity;


      for (
        const [
          targetId,
          target
        ] of players.entries()
      ) {

        /* Never hit yourself */

        if (
          targetId ===
          socket.id
        ) {

          continue;

        }


        /* ---------------------------------------------
           ENEMY HITBOX

           The client's enemy group is at Y = 0.

           Body:
             center Y ≈ 1.15

           Head:
             center Y ≈ 2.08

           We therefore use a large capsule-like
           spherical hit area centered around Y = 1.35.
        --------------------------------------------- */

        const hitboxCenter = {

          x:
            target.position.x,

          y:
            1.35,

          z:
            target.position.z

        };


        const result =
          distanceFromRayToPoint(
            origin,
            direction,
            hitboxCenter
          );


        /* Target must be in front */

        if (
          result.projection < 0
        ) {

          continue;

        }


        /* Maximum shooting distance */

        if (
          result.projection > 150
        ) {

          continue;

        }


        /*
          Large enough to hit the body/head,
          but still requires the shot to be
          reasonably close to the player.
        */

        const hitboxRadius =
          1.45;


        if (
  result.distance <=
  hitboxRadius
) {

  /* Wall is between shooter and player */

  if (
    closestWallDistance <
    result.projection
  ) {

    continue;

  }


  if (
    result.projection <
    closestDistance
  ) {

            closestDistance =
              result.projection;

            closestPlayer = {

              id:
                targetId,

              player:
                target

            };

          }

        }

      }


      /* -----------------------------------------------
         MISS
      ------------------------------------------------ */

      if (
        !closestPlayer
      ) {

        console.log(
          `${player.username} MISSED`
        );

        return;

      }


      /* -----------------------------------------------
         APPLY DAMAGE
      ------------------------------------------------ */

      const target =
        closestPlayer.player;


      target.health =
        Math.max(
          0,
          target.health -
            gun.damage
        );


      console.log(
        `${player.username} HIT ${target.username} for ${gun.damage} damage | HP: ${target.health}`
      );


      /* -----------------------------------------------
         SEND DAMAGE TO VICTIM
      ------------------------------------------------ */
console.log("SENDING PLAYER HIT TO:", closestPlayer.id);

      io.to(
        closestPlayer.id
      ).emit(
        "playerHit",
        {

          targetId:
            closestPlayer.id,

          attackerId:
            socket.id,

          attackerName:
            player.username,

          damage:
            gun.damage,

          health:
            target.health

        }
      );


      /* -----------------------------------------------
         ELIMINATION
      ------------------------------------------------ */

      if (
        target.health <= 0
      ) {

        console.log(
          `${target.username} was eliminated by ${player.username}`
        );


        /* Give attacker score */

        player.score +=
          1;


        /* Give attacker coins */

        player.coins +=
          10;


        /* Tell everyone */

        io.emit(
          "playerEliminated",
          {

            attackerId:
              socket.id,

            targetId:
              closestPlayer.id,

            attackerName:
              player.username,

            targetName:
              target.username

          }
        );


        /* Update attacker score */

        io.to(
          socket.id
        ).emit(
          "scoreUpdate",
          {

            id:
              socket.id,

            score:
              player.score

          }
        );


        /* Update attacker coins */

        io.to(
          socket.id
        ).emit(
          "currencyUpdate",
          {

            id:
              socket.id,

            coins:
              player.coins

          }
        );


        /* ---------------------------------------------
           RESPAWN
        --------------------------------------------- */

        const spawn =
          getSpawnPoint();


        target.health =
          100;


        target.position = {

          x:
            spawn.x,

          y:
            2.1,

          z:
            spawn.z

        };


        target.rotation = {

          x:
            0,

          y:
            0,

          z:
            0

        };


        /* Tell victim */

        io.to(
          closestPlayer.id
        ).emit(
          "respawn",
          {

            health:
              100,

            position:
              target.position

          }
        );


        /* Tell everyone about new position */

        io.emit(
          "playerMoved",
          {

            id:
              closestPlayer.id,

            position:
              target.position,

            rotation:
              target.rotation

          }
        );

      }

    }
  );


  /* ====================================================
     BUY GUN
  ==================================================== */

  socket.on(
    "buyGun",
    (gunId) => {

      const player =
        players.get(
          socket.id
        );


      if (!player) {
        return;
      }


      const gun =
        GUNS[gunId];


      if (!gun) {
        return;
      }


      /* Already owned */

      if (
        player.ownedGuns[gunId]
      ) {

        return;

      }


      /* Not enough coins */

      if (
        player.coins <
        gun.price
      ) {

        socket.emit(
          "gunPurchaseFailed",
          {
            message:
              "Not enough coins"
          }
        );

        return;

      }


      /* Buy */

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


      socket.emit(
        "currencyUpdate",
        {

          id:
            socket.id,

          coins:
            player.coins

        }
      );


      console.log(
        `${player.username} bought ${gun.name}`
      );

    }
  );


  /* ====================================================
     EQUIP GUN
  ==================================================== */

  socket.on(
    "equipGun",
    (gunId) => {

      const player =
        players.get(
          socket.id
        );


      if (!player) {
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


      console.log(
        `${player.username} equipped ${gunId}`
      );

    }
  );


  /* ====================================================
     DISCONNECT
  ==================================================== */

  socket.on(
    "disconnect",
    (reason) => {

      const player =
        players.get(
          socket.id
        );


      if (player) {

        console.log(
          `${player.username} disconnected: ${reason}`
        );

      } else {

        console.log(
          `Player disconnected: ${socket.id}`
        );

      }


      players.delete(
        socket.id
      );


      io.emit(
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


/* ======================================================
   START SERVER
====================================================== */

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Neon Strike server running on port ${PORT}`
    );

  }
);
