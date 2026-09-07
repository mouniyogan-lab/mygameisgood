const SERVER_URL = "https://mygameisgood.onrender.com";

const socket = io(SERVER_URL, {
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true
});

const scene = new THREE.Scene();

scene.background =
  new THREE.Color(0x02050a);

scene.fog =
  new THREE.Fog(
    0x02050a,
    45,
    190
  );

const camera =
  new THREE.PerspectiveCamera(
    76,
    window.innerWidth /
      window.innerHeight,
    0.05,
    500
  );

camera.position.set(
  0,
  2.1,
  25
);

const renderer =
  new THREE.WebGLRenderer({
    antialias: true,
    powerPreference:
      "high-performance"
  });

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.shadowMap.enabled =
  true;

renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

renderer.outputEncoding =
  THREE.sRGBEncoding;

document
  .getElementById("game")
  .appendChild(renderer.domElement);

const controls =
  new THREE.PointerLockControls(
    camera,
    renderer.domElement
  );

const healthValue =
  document.getElementById(
    "healthValue"
  );

const scoreValue =
  document.getElementById(
    "scoreValue"
  );

const coinsValue =
  document.getElementById(
    "coinsValue"
  );

const playerCountValue =
  document.getElementById(
    "playerCountValue"
  );

const gunValue =
  document.getElementById(
    "gunValue"
  );

const startOverlay =
  document.getElementById(
    "startOverlay"
  );

const playButton =
  document.getElementById(
    "playButton"
  );

const usernameInput =
  document.getElementById(
    "usernameInput"
  );

const statusText =
  document.getElementById(
    "statusText"
  );

const damageFlash =
  document.getElementById(
    "damageFlash"
  );

const hitMarker =
  document.getElementById(
    "hitMarker"
  );

const killMessage =
  document.getElementById(
    "killMessage"
  );

const shopButton =
  document.getElementById(
    "shopButton"
  );

const shopPanel =
  document.getElementById(
    "shopPanel"
  );

const closeShop =
  document.getElementById(
    "closeShop"
  );

const shopCoins =
  document.getElementById(
    "shopCoins"
  );

const gunList =
  document.getElementById(
    "gunList"
  );

let localPlayerId =
  null;

let playerName = "";

let playerJoined =
  false;

let health = 100;

let score = 0;

let coins = 0;

let currentGun =
  "pistol";

let ownedGuns = {
  pistol: true
};

const GUNS = {
  pistol: {
    name: "Pistol",
    price: 0,
    damage: 25,
    cooldown: 115,
    color: 0x6d7881,
    barrelScale: 1
  },

  smg: {
    name: "SMG",
    price: 20,
    damage: 15,
    cooldown: 75,
    color: 0x00d9ff,
    barrelScale: 0.78
  },

  shotgun: {
    name: "Shotgun",
    price: 40,
    damage: 55,
    cooldown: 550,
    color: 0xffa52f,
    barrelScale: 1.18
  },

  rifle: {
    name: "Assault Rifle",
    price: 60,
    damage: 35,
    cooldown: 180,
    color: 0x62ff75,
    barrelScale: 1.25
  },

  railgun: {
    name: "Railgun",
    price: 100,
    damage: 80,
    cooldown: 850,
    color: 0xff47ff,
    barrelScale: 1.55
  }
};

const movement = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

let verticalVelocity = 0;

let isGrounded = true;

const jumpStrength = 10;

const gravity = 28;

const groundY = 2.1;

const otherPlayers =
  new Map();

const projectiles = [];

const collisionBoxes = [];

const clock =
  new THREE.Clock();

const arenaSize = 120;

const playerRadius = 0.65;

let lastShotTime = 0;

let networkTimer = 0;


/* ======================================================
   LIGHTING
====================================================== */

const ambient =
  new THREE.AmbientLight(
    0x5c7698,
    0.3
  );

scene.add(ambient);

const moon =
  new THREE.DirectionalLight(
    0x7ca7ff,
    1
  );

moon.position.set(
  -25,
  55,
  35
);

moon.castShadow = true;

moon.shadow.mapSize.width =
  2048;

moon.shadow.mapSize.height =
  2048;

scene.add(moon);

const cyan =
  new THREE.PointLight(
    0x00bbff,
    3,
    45,
    2
  );

cyan.position.set(
  0,
  7,
  0
);

scene.add(cyan);

const red =
  new THREE.PointLight(
    0xff254f,
    2.5,
    35,
    2
  );

red.position.set(
  0,
  8,
  -42
);

scene.add(red);


/* ======================================================
   MAP MATERIALS
====================================================== */

const floorMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x25292d,
    roughness: 0.92,
    metalness: 0.08
  });

const wallMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x30353a,
    roughness: 0.82,
    metalness: 0.18
  });

const darkWallMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x1d2227,
    roughness: 0.78,
    metalness: 0.25
  });

const concreteMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x4b5054,
    roughness: 0.9,
    metalness: 0.08
  });

const metalMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x343a40,
    roughness: 0.38,
    metalness: 0.82
  });

const crateMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x695039,
    roughness: 0.86,
    metalness: 0.02
  });

const warningMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x8a741f,
    roughness: 0.65,
    metalness: 0.2
  });

const redMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x70242c,
    roughness: 0.7,
    metalness: 0.3
  });


/* ======================================================
   FLOOR
====================================================== */

const floor =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      arenaSize,
      0.7,
      arenaSize
    ),
    floorMaterial
  );

floor.position.y =
  -0.35;

floor.receiveShadow = true;

scene.add(floor);


/* ======================================================
   FLOOR TILES
====================================================== */

const tileMaterial =
  new THREE.LineBasicMaterial({
    color: 0x39444b,
    transparent: true,
    opacity: 0.35
  });

for (
  let i = -arenaSize / 2;
  i <= arenaSize / 2;
  i += 6
) {
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry()
        .setFromPoints([
          new THREE.Vector3(
            i,
            0.015,
            -arenaSize / 2
          ),
          new THREE.Vector3(
            i,
            0.015,
            arenaSize / 2
          )
        ]),
      tileMaterial
    )
  );

  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry()
        .setFromPoints([
          new THREE.Vector3(
            -arenaSize / 2,
            0.016,
            i
          ),
          new THREE.Vector3(
            arenaSize / 2,
            0.016,
            i
          )
        ]),
      tileMaterial
    )
  );
}


/* ======================================================
   COLLISION BOX HELPER
====================================================== */

function addBox(
  x,
  y,
  z,
  width,
  height,
  depth,
  material = concreteMaterial
) {
  const mesh =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth
      ),
      material
    );

  mesh.position.set(
    x,
    y + height / 2,
    z
  );

  mesh.castShadow = true;

  mesh.receiveShadow = true;

  scene.add(mesh);

  collisionBoxes.push({
    minX:
      x - width / 2,

    maxX:
      x + width / 2,

    minY: 0,

    maxY:
      height,

    minZ:
      z - depth / 2,

    maxZ:
      z + depth / 2
  });

  return mesh;
}


/* ======================================================
   OUTER WALLS
====================================================== */

function createMapWall(
  x,
  y,
  z,
  width,
  height,
  depth
) {
  const wall =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth
      ),
      wallMaterial
    );

  wall.position.set(
    x,
    y,
    z
  );

  wall.castShadow = true;

  wall.receiveShadow = true;

  scene.add(wall);

  const top =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        0.08,
        depth
      ),
      metalMaterial
    );

  top.position.set(
    x,
    y + height / 2,
    z
  );

  scene.add(top);

  collisionBoxes.push({
    minX:
      x - width / 2,

    maxX:
      x + width / 2,

    minY: 0,

    maxY:
      height,

    minZ:
      z - depth / 2,

    maxZ:
      z + depth / 2
  });
}

createMapWall(
  0,
  5,
  -arenaSize / 2,
  arenaSize,
  10,
  1.2
);

createMapWall(
  0,
  5,
  arenaSize / 2,
  arenaSize,
  10,
  1.2
);

createMapWall(
  -arenaSize / 2,
  5,
  0,
  1.2,
  10,
  arenaSize
);

createMapWall(
  arenaSize / 2,
  5,
  0,
  1.2,
  10,
  arenaSize
);


/* ======================================================
   NEON STRIKE 2.0 MAP
   Multi-level futuristic arena
====================================================== */

/* ---------- NEON TRIM ---------- */

const neonMaterial =
  new THREE.MeshBasicMaterial({
    color: 0x00ffff
  });

function addNeonTrim(
  x,
  y,
  z,
  width,
  height,
  depth
) {
  const edges =
    new THREE.LineSegments(
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
          width,
          height,
          depth
        )
      ),
      neonMaterial
    );

  edges.position.set(
    x,
    y + height / 2,
    z
  );

  scene.add(edges);
}


/* ---------- BUILDING ---------- */

function createArenaBuilding(
  x,
  z,
  width,
  depth,
  height
) {

  addBox(
    x,
    0,
    z,
    width,
    height,
    depth,
    darkWallMaterial
  );

  addNeonTrim(
    x,
    0,
    z,
    width + 0.15,
    height + 0.15,
    depth + 0.15
  );

  /* rooftop rim */

  addBox(
    x,
    height,
    z,
    width + 0.5,
    0.35,
    depth + 0.5,
    metalMaterial
  );

  addNeonTrim(
    x,
    height,
    z,
    width + 0.6,
    0.15,
    depth + 0.6
  );
}


/* ======================================================
   OUTER BUILDINGS
====================================================== */

createArenaBuilding(
  -43,
  -32,
  18,
  20,
  9
);

createArenaBuilding(
  43,
  -32,
  18,
  20,
  9
);

createArenaBuilding(
  -43,
  32,
  16,
  18,
  7
);

createArenaBuilding(
  43,
  32,
  16,
  18,
  7
);


/* ======================================================
   CENTRAL FORTRESS
====================================================== */

/* lower center */

addBox(
  0,
  0,
  -18,
  30,
  7,
  4,
  concreteMaterial
);

addNeonTrim(
  0,
  0,
  -18,
  30.2,
  7.2,
  4.2
);


/* left tower */

addBox(
  -13,
  0,
  -8,
  4,
  9,
  20,
  concreteMaterial
);

addNeonTrim(
  -13,
  0,
  -8,
  4.2,
  9.2,
  20.2
);


/* right tower */

addBox(
  13,
  0,
  -8,
  4,
  9,
  20,
  concreteMaterial
);

addNeonTrim(
  13,
  0,
  -8,
  4.2,
  9.2,
  20.2
);


/* ======================================================
   SECOND LEVEL CENTER PLATFORM
====================================================== */

addBox(
  0,
  7,
  -8,
  22,
  2,
  12,
  metalMaterial
);

addNeonTrim(
  0,
  7,
  -8,
  22.2,
  2.2,
  12.2
);


/* ======================================================
   CENTRAL UPPER BLOCK
====================================================== */

addBox(
  0,
  9,
  -8,
  10,
  4,
  7,
  darkWallMaterial
);

addNeonTrim(
  0,
  9,
  -8,
  10.2,
  4.2,
  7.2
);


/* ======================================================
   ROOFTOP COVER
====================================================== */

addBox(
  -7,
  9,
  -8,
  3,
  2,
  5,
  concreteMaterial
);

addBox(
  7,
  9,
  -8,
  3,
  2,
  5,
  concreteMaterial
);


/* ======================================================
   ELEVATED BRIDGES
====================================================== */

/* left bridge */

addBox(
  -27,
  5,
  -8,
  14,
  1.5,
  3,
  metalMaterial
);

addNeonTrim(
  -27,
  5,
  -8,
  14.2,
  1.7,
  3.2
);


/* right bridge */

addBox(
  27,
  5,
  -8,
  14,
  1.5,
  3,
  metalMaterial
);

addNeonTrim(
  27,
  5,
  -8,
  14.2,
  1.7,
  3.2
);


/* ======================================================
   SIDE COVER
====================================================== */

addBox(
  -30,
  0,
  5,
  15,
  3,
  2.5,
  concreteMaterial
);

addNeonTrim(
  -30,
  0,
  5,
  15.2,
  3.2,
  2.7
);


addBox(
  30,
  0,
  5,
  15,
  3,
  2.5,
  concreteMaterial
);

addNeonTrim(
  30,
  0,
  5,
  15.2,
  3.2,
  2.7
);


/* ======================================================
   FRONT COVER
====================================================== */

addBox(
  -18,
  0,
  18,
  9,
  3,
  3,
  concreteMaterial
);

addNeonTrim(
  -18,
  0,
  18,
  9.2,
  3.2,
  3.2
);


addBox(
  18,
  0,
  18,
  9,
  3,
  3,
  concreteMaterial
);

addNeonTrim(
  18,
  0,
  18,
  9.2,
  3.2,
  3.2
);


/* ======================================================
   SMALL COVER BLOCKS
====================================================== */

addBox(
  -27,
  0,
  -16,
  6,
  3,
  4,
  concreteMaterial
);

addBox(
  27,
  0,
  -16,
  6,
  3,
  4,
  concreteMaterial
);

addBox(
  -25,
  0,
  25,
  7,
  4,
  4,
  concreteMaterial
);

addBox(
  25,
  0,
  25,
  7,
  4,
  4,
  concreteMaterial
);


/* ======================================================
   ROOFTOP PILLARS
====================================================== */

addBox(
  -39,
  9,
  -32,
  3,
  3,
  3,
  concreteMaterial
);

addBox(
  -47,
  9,
  -32,
  3,
  3,
  3,
  concreteMaterial
);

addBox(
  39,
  9,
  -32,
  3,
  3,
  3,
  concreteMaterial
);

addBox(
  47,
  9,
  -32,
  3,
  3,
  3,
  concreteMaterial
);


/* ======================================================
   EXTRA LOW COVER
====================================================== */

addBox(
  -8,
  0,
  27,
  10,
  2,
  2,
  concreteMaterial
);

addBox(
  8,
  0,
  27,
  10,
  2,
  2,
  concreteMaterial
);


/* ======================================================
   NEON CENTER PLATFORM
====================================================== */

addBox(
  0,
  0,
  8,
  10,
  1,
  10,
  metalMaterial
);

addNeonTrim(
  0,
  0,
  8,
  10.2,
  1.2,
  10.2
);

/* ======================================================
   CRATES
====================================================== */

function createCrate(
  x,
  z,
  scaleY = 1
) {
  const size = 2.8;

  return addBox(
    x,
    0,
    z,
    size,
    size * scaleY,
    size,
    crateMaterial
  );
}

createCrate(-38, -8);
createCrate(-35, -8);
createCrate(-38, -5);
createCrate(-35, -5);

createCrate(38, -8);
createCrate(35, -8);
createCrate(38, -5);
createCrate(35, -5);

createCrate(-10, 35);
createCrate(-7, 35);
createCrate(10, 35);
createCrate(7, 35);


/* ======================================================
   METAL BARRIERS
====================================================== */

function createBarrier(
  x,
  z,
  rotation = 0
) {
  const barrier =
    new THREE.Group();

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        5,
        1.4,
        0.55
      ),
      warningMaterial
    );

  body.castShadow = true;

  body.receiveShadow = true;

  barrier.add(body);

  for (
    let i = -1;
    i <= 1;
    i++
  ) {
    const leg =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.35,
          1.8,
          0.35
        ),
        metalMaterial
      );

    leg.position.set(
      i * 1.8,
      -0.2,
      0
    );

    barrier.add(leg);
  }

  barrier.position.set(
    x,
    0.8,
    z
  );

  barrier.rotation.y =
    rotation;

  scene.add(barrier);

  const cos =
    Math.abs(
      Math.cos(rotation)
    );

  const sin =
    Math.abs(
      Math.sin(rotation)
    );

  const width =
    5 * cos +
    0.55 * sin;

  const depth =
    5 * sin +
    0.55 * cos;

  collisionBoxes.push({
    minX:
      x - width / 2,

    maxX:
      x + width / 2,

    minY: 0,
    maxY: 1.8,
    minZ: z - depth / 2,
    maxZ: z + depth / 2
  });
}

createBarrier(-20, 8, 0);
createBarrier(20, 8, 0);
createBarrier(0, 28, Math.PI / 2);

window.addEventListener(
  "keydown",
  (event) => {
    if (event.code === "KeyW") movement.forward = true;
    if (event.code === "KeyS") movement.backward = true;
    if (event.code === "KeyA") movement.left = true;
    if (event.code === "KeyD") movement.right = true;

    if (
      event.code === "Space" &&
      isGrounded &&
      controls.isLocked
    ) {
      verticalVelocity = jumpStrength;
      isGrounded = false;
      event.preventDefault();
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    if (event.code === "KeyW") movement.forward = false;
    if (event.code === "KeyS") movement.backward = false;
    if (event.code === "KeyA") movement.left = false;
    if (event.code === "KeyD") movement.right = false;
  }
);


/* ======================================================
   POINTER LOCK
====================================================== */

playButton.addEventListener(
  "click",
  () => {

    const name =
      usernameInput.value.trim();

    if (!name) {
      statusText.textContent =
        "Enter a username";
      return;
    }

    playerName = name;

    socket.emit(
      "joinGame",
      {
        username: playerName
      }
    );
  }
);

controls.addEventListener(
  "lock",
  () => {
    startOverlay.style.display =
      "none";
  }
);

controls.addEventListener(
  "unlock",
  () => {

    if (
      playerJoined &&
      health > 0
    ) {
      startOverlay.style.display =
        "flex";
    }
  }
);


/* ======================================================
   SHOOTING
====================================================== */

function shoot() {

  if (
    !controls.isLocked ||
    !playerJoined
  ) {
    return;
  }

  const weapon =
    GUNS[currentGun];

  if (!weapon) {
    return;
  }

  const now =
    performance.now();

  if (
    now - lastShotTime <
    weapon.cooldown
  ) {
    return;
  }

  lastShotTime = now;

  const origin =
    new THREE.Vector3();

  const direction =
    new THREE.Vector3();

  muzzlePoint.getWorldPosition(
    origin
  );

  camera.getWorldDirection(
    direction
  );

  direction.normalize();

  createTracer(
    origin,
    direction,
    localPlayerId
  );

  muzzleFlash.intensity =
    5;

  setTimeout(
    () => {
      muzzleFlash.intensity =
        0;
    },
    45
  );

  gun.position.z =
    0.08;

  setTimeout(
    () => {
      gun.position.z =
        0;
    },
    65
  );

  socket.emit(
    "shoot",
    {
      origin: {
        x: origin.x,
        y: origin.y,
        z: origin.z
      },

      direction: {
        x: direction.x,
        y: direction.y,
        z: direction.z
      },

      gunId:
        currentGun
    }
  );
}

window.addEventListener(
  "mousedown",
  (event) => {

    if (
      event.button === 0
    ) {
      shoot();
    }
  }
);


/* ======================================================
   SOCKET CONNECTION
====================================================== */

socket.on(
  "connect",
  () => {

    console.log(
      "CONNECTED TO SERVER:",
      socket.id
    );

    statusText.textContent =
      "Connected";

    localPlayerId =
      socket.id;

    playerJoined =
      false;

    if (
      playerName &&
      playerName.trim() !== ""
    ) {

      console.log(
        "REJOINING GAME AS:",
        playerName
      );

      socket.emit(
        "joinGame",
        {
          username:
            playerName
        }
      );
    }
  }
);

socket.on(
  "disconnect",
  (reason) => {

    console.log(
      "DISCONNECTED:",
      reason
    );

    playerJoined =
      false;

    localPlayerId =
      null;

    statusText.textContent =
      "Disconnected - reconnecting...";
  }
);

socket.on(
  "connect_error",
  (error) => {

    console.log(
      "CONNECTION ERROR:",
      error.message
    );

    statusText.textContent =
      "Server waking up...";
  }
);

socket.on(
  "reconnect",
  (attempt) => {

    console.log(
      "RECONNECTED AFTER ATTEMPT:",
      attempt
    );
  }
);

socket.on(
  "reconnect_attempt",
  (attempt) => {

    console.log(
      "RECONNECT ATTEMPT:",
      attempt
    );
  }
);


/* ======================================================
   GAME JOIN
====================================================== */

socket.on(
  "legacyJoinedGame",
  (data) => {

    console.log(
      "JOINED GAME:",
      data
    );

    localPlayerId =
      data.id;

    playerJoined =
      true;

    health =
      Number(data.health) || 100;

    score =
      Number(data.score) || 0;

    coins =
      Number(data.coins) || 0;

    currentGun =
      data.currentGun ||
      "pistol";

    ownedGuns =
      data.ownedGuns ||
      {
        pistol: true
      };

    camera.position.set(
      data.position.x,
      data.position.y,
      data.position.z
    );

    healthValue.textContent =
      health;

    scoreValue.textContent =
      score;

    coinsValue.textContent =
      coins;

    shopCoins.textContent =
      coins;

    applyGunVisual();

    statusText.textContent =
      "Ready";

    startOverlay.style.display =
      "flex";

    startOverlay.style.display =
      "none";

    controls.lock();
  }
);


/* ======================================================
   EXISTING PLAYERS
====================================================== */

socket.on(
  "legacyCurrentPlayers",
  (players) => {

    for (
      const id in players
    ) {

      if (
        id === localPlayerId
      ) {
        continue;
      }

      const p =
        players[id];

      const remote =
        createOtherPlayer(
          id,
          p.username
        );

      remote.position.set(
        p.position.x,
        p.position.y,
        p.position.z
      );

      remote.rotation.y =
        p.rotationY || 0;
    }
  }
);


/* ======================================================
   NEW PLAYER
====================================================== */

socket.on(
  "legacyPlayerJoined",
  (data) => {

    if (
      data.id === localPlayerId
    ) {
      return;
    }

    if (
      otherPlayers.has(
        data.id
      )
    ) {
      return;
    }

    const remote =
      createOtherPlayer(
        data.id,
        data.username
      );

    remote.position.set(
      data.position.x,
      data.position.y,
      data.position.z
    );

    remote.rotation.y =
      data.rotationY || 0;
  }
);


/* ======================================================
   PLAYER MOVEMENT
====================================================== */

socket.on(
  "legacyPlayerMoved",
  (data) => {

    if (
      data.id === localPlayerId
    ) {
      return;
    }

    let remote =
      otherPlayers.get(
        data.id
      );

    if (!remote) {

      remote =
        createOtherPlayer(
          data.id,
          data.username ||
            "Player"
        );
    }

    remote.targetPosition.set(
      data.position.x,
      data.position.y,
      data.position.z
    );

    remote.targetRotationY =
      data.rotationY || 0;
  }
);


/* ======================================================
   PLAYER LEFT
====================================================== */

socket.on(
  "legacyPlayerLeft",
  (id) => {

    const remote =
      otherPlayers.get(id);

    if (!remote) {
      return;
    }

    scene.remove(
      remote.group
    );

    otherPlayers.delete(id);
  }
);


/* ======================================================
   PLAYER HIT
====================================================== */

socket.on(
  "legacyPlayerHit",
  (data) => {

    console.log(
      "PLAYER HIT EVENT RECEIVED:",
      data
    );

    if (
      data.targetId !==
      localPlayerId
    ) {
      return;
    }

    health =
      Math.max(
        0,
        Number(data.health)
      );

    healthValue.textContent =
      health;

    damageFlash.style.opacity =
      "1";

    setTimeout(
      () => {
        damageFlash.style.opacity =
          "0";
      },
      120
    );

    hitMarker.style.opacity =
      "1";

    setTimeout(
      () => {
        hitMarker.style.opacity =
          "0";
      },
      120
    );

    if (
      health <= 0
    ) {

      health = 0;

      healthValue.textContent =
        "0";

      controls.unlock();

      startOverlay.style.display =
        "flex";

      statusText.textContent =
        `Eliminated by ${
          data.attackerName ||
          "enemy"
        }`;
    }
  }
);


/* ======================================================
   PLAYER KILL
====================================================== */

socket.on(
  "legacyPlayerKill",
  (data) => {

    if (
      data.attackerId !==
      localPlayerId
    ) {
      return;
    }

    score += 1;

    coins += 10;

    scoreValue.textContent =
      score;

    coinsValue.textContent =
      coins;

    shopCoins.textContent =
      coins;

    killMessage.textContent =
      `ELIMINATED ${
        data.targetName ||
        "PLAYER"
      }`;

    killMessage.style.opacity =
      "1";

    setTimeout(
      () => {
        killMessage.style.opacity =
          "0";
      },
      1300
    );
  }
);


/* ======================================================
   PLAYER RESPAWN
====================================================== */

socket.on(
  "playerRespawned",
  (data) => {

    if (
      data.id !==
      localPlayerId
    ) {
      return;
    }

    health =
      Number(data.health) ||
      100;

    healthValue.textContent =
      health;

    camera.position.set(
      data.position.x,
      data.position.y,
      data.position.z
    );

    verticalVelocity =
      0;

    isGrounded =
      true;

    statusText.textContent =
      "Respawned";

    if (
      !controls.isLocked
    ) {
      controls.lock();
    }
  }
);


/* ======================================================
   PLAYER COUNT
====================================================== */

socket.on(
  "playerCount",
  (count) => {

    playerCountValue.textContent =
      count;
  }
);


/* ======================================================
   GUN SHOP
====================================================== */

function openGunShop() {

  shopPanel.style.display =
    "block";

  shopCoins.textContent =
    coins;

  renderGunShop();
}

function closeGunShop() {

  shopPanel.style.display =
    "none";
}

shopButton.addEventListener(
  "click",
  () => {

    if (
      shopPanel.style.display ===
      "block"
    ) {
      closeGunShop();
    } else {
      openGunShop();
    }
  }
);

closeShop.addEventListener(
  "click",
  () => {
    closeGunShop();
  }
);

function renderGunShop() {

  gunList.innerHTML =
    "";

  for (
    const id in GUNS
  ) {

    const weapon =
      GUNS[id];

    const owned =
      ownedGuns[id];

    const equipped =
      currentGun === id;

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "gun-item";

    const name =
      document.createElement(
        "div"
      );

    name.className =
      "gun-name";

    name.textContent =
      weapon.name;

    const price =
      document.createElement(
        "div"
      );

    price.className =
      "gun-price";

    price.textContent =
      owned
        ? equipped
          ? "EQUIPPED"
          : "OWNED"
        : `${weapon.price} COINS`;

    const button =
      document.createElement(
        "button"
      );

    if (equipped) {

      button.textContent =
        "EQUIPPED";

      button.disabled =
        true;

    } else if (owned) {

      button.textContent =
        "EQUIP";

      button.addEventListener(
        "click",
        () => {

          socket.emit(
            "equipGun",
            {
              gunId: id
            }
          );
        }
      );

    } else {

      button.textContent =
        "BUY";

      button.addEventListener(
        "click",
        () => {

          socket.emit(
            "buyGun",
            {
              gunId: id
            }
          );
        }
      );
    }

    row.appendChild(name);

    row.appendChild(price);

    row.appendChild(button);

    gunList.appendChild(row);
  }
}


/* ======================================================
   SHOP EVENTS
====================================================== */

socket.on(
  "gunPurchased",
  (data) => {

    coins =
      Number(data.coins);

    ownedGuns =
      data.ownedGuns ||
      ownedGuns;

    coinsValue.textContent =
      coins;

    shopCoins.textContent =
      coins;

    renderGunShop();
  }
);

socket.on(
  "gunEquipped",
  (data) => {

    currentGun =
      data.gunId ||
      "pistol";

    ownedGuns =
      data.ownedGuns ||
      ownedGuns;

    applyGunVisual();

    renderGunShop();
  }
);

socket.on(
  "shopError",
  (message) => {

    console.log(
      "SHOP ERROR:",
      message
    );
  }
);


/* ======================================================
   REMOTE SHOTS
====================================================== */

socket.on(
  "playerShot",
  (data) => {

    if (
      data.ownerId ===
      localPlayerId
    ) {
      return;
    }

    const origin =
      new THREE.Vector3(
        data.origin.x,
        data.origin.y,
        data.origin.z
      );

    const direction =
      new THREE.Vector3(
        data.direction.x,
        data.direction.y,
        data.direction.z
      );

    direction.normalize();

    createTracer(
      origin,
      direction,
      data.ownerId
    );
  }
);


/* ======================================================
   COLLISION
====================================================== */

function collides(
  x,
  z
) {

  for (
    const box of collisionBoxes
  ) {

    if (
      x + playerRadius >
        box.minX &&
      x - playerRadius <
        box.maxX &&
      z + playerRadius >
        box.minZ &&
      z - playerRadius <
        box.maxZ
    ) {
      return true;
    }
  }

  return false;
}


/* ======================================================
   MOVEMENT
====================================================== */

function updateMovement(delta) {
  if (!controls.isLocked) {
    return;
  }

  move.set(0, 0, 0);

  if (movement.forward) {
    move.z -= 1;
  }

  if (movement.backward) {
    move.z += 1;
  }

  if (movement.left) {
    move.x -= 1;
  }

  if (movement.right) {
    move.x += 1;
  }

  if (move.lengthSq() > 0) {
    move.normalize();

    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() > 0) {
      forward.normalize();
    }

    right.crossVectors(
      forward,
      camera.up
    );

    if (right.lengthSq() > 0) {
      right.normalize();
    }

    const velocity =
      new THREE.Vector3();

    velocity.addScaledVector(
      forward,
      -move.z
    );

    velocity.addScaledVector(
      right,
      move.x
    );

    if (velocity.lengthSq() > 0) {
      velocity.normalize();

      velocity.multiplyScalar(
        20 * delta
      );
    }

    const nextX =
      camera.position.clone();

    nextX.x += velocity.x;

    if (!collides(nextX)) {
      camera.position.x =
        nextX.x;
    }

    const nextZ =
      camera.position.clone();

    nextZ.z += velocity.z;

    if (!collides(nextZ)) {
      camera.position.z =
        nextZ.z;
    }
  }

  verticalVelocity -=
    gravity * delta;

  camera.position.y +=
    verticalVelocity * delta;

  if (
    camera.position.y <=
    groundY
  ) {
    camera.position.y =
      groundY;

    verticalVelocity =
      0;

    isGrounded =
      true;
  }

  networkTimer += delta;

  if (
    networkTimer >= 0.05
  ) {
    networkTimer = 0;

    socket.emit(
      "playerMove",
      {
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        },

        rotation: {
          x: camera.rotation.x,
          y: camera.rotation.y,
          z: camera.rotation.z
        }
      }
    );
  }
}

/* ======================================================
   UPDATE REMOTE PLAYERS
====================================================== */

function updateOtherPlayers(
  delta
) {

  const alpha =
    Math.min(
      1,
      delta * 12
    );

  for (
    const remote of
      otherPlayers.values()
  ) {

    remote.group.position.lerp(
      remote.targetPosition,
      alpha
    );

    remote.group.rotation.y +=
      (
        remote.targetRotationY -
        remote.group.rotation.y
      ) * alpha;
  }
}


/* ======================================================
   UPDATE PROJECTILES
====================================================== */

function updateProjectiles(
  delta
) {

  for (
    let i =
      projectiles.length - 1;
    i >= 0;
    i--
  ) {

    const projectile =
      projectiles[i];

    projectile.age +=
      delta;

    projectile.mesh.position.addScaledVector(
      projectile.velocity,
      delta
    );

    if (
      projectile.age >
      1.5
    ) {

      scene.remove(
        projectile.mesh
      );

      projectiles.splice(
        i,
        1
      );
    }
  }
}


/* ======================================================
   RESIZE
====================================================== */

window.addEventListener(
  "resize",
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);


/* ======================================================
   INITIAL UI
====================================================== */

healthValue.textContent =
  health;

scoreValue.textContent =
  score;

coinsValue.textContent =
  coins;

shopCoins.textContent =
  coins;

playerCountValue.textContent =
  "0";

applyGunVisual();


/* ======================================================
   GAME LOOP
====================================================== */

function animate() {

  requestAnimationFrame(
    animate
  );

  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    );

  updateMovement(
    delta
  );

  updateOtherPlayers(
    delta
  );

  updateProjectiles(
    delta
  );

  renderer.render(
    scene,
    camera
  );
}

animate();

window.addEventListener(
  "blur",
  () => {
    movement.forward = false;

    movement.backward = false;

    movement.left = false;

    movement.right = false;
  }
);


/* ======================================================
   COLLISION
====================================================== */

function collides(
  position
) {
  const limit =
    arenaSize / 2 -
    playerRadius -
    1;

  if (
    position.x < -limit ||
    position.x > limit ||
    position.z < -limit ||
    position.z > limit
  ) {
    return true;
  }

  const minX =
    position.x -
    playerRadius;

  const maxX =
    position.x +
    playerRadius;

  const minZ =
    position.z -
    playerRadius;

  const maxZ =
    position.z +
    playerRadius;

  for (
    const box of collisionBoxes
  ) {
    if (
      maxX > box.minX &&
      minX < box.maxX &&
      maxZ > box.minZ &&
      minZ < box.maxZ
    ) {
      return true;
    }
  }

  return false;
}


/* ======================================================
   MOVEMENT
====================================================== */

const forward =
  new THREE.Vector3();

const right =
  new THREE.Vector3();

const move =
  new THREE.Vector3();

function updateMovement(delta) {
  if (
    !controls.isLocked ||
    !playerJoined
  ) {
    return;
  }

  move.set(0, 0, 0);

  if (movement.forward) {
    move.z -= 1;
  }

  if (movement.backward) {
    move.z += 1;
  }

  if (movement.left) {
    move.x -= 1;
  }

  if (movement.right) {
    move.x += 1;
  }

  if (move.lengthSq() > 0) {
    move.normalize();

    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() > 0) {
      forward.normalize();
    }

    right.crossVectors(
      forward,
      camera.up
    );

    if (right.lengthSq() > 0) {
      right.normalize();
    }

    const velocity =
      new THREE.Vector3();

    velocity.addScaledVector(
      forward,
      -move.z
    );

    velocity.addScaledVector(
      right,
      move.x
    );

    if (velocity.lengthSq() > 0) {
      velocity.normalize();

      velocity.multiplyScalar(
        20 * delta
      );
    }

    /*
      Move X and Z separately.
      This lets the player slide along a wall
      instead of getting completely stuck on corners.
    */
    const nextX =
      camera.position.clone();

    nextX.x += velocity.x;

    if (!collides(nextX)) {
      camera.position.x =
        nextX.x;
    }

    const nextZ =
      camera.position.clone();

    nextZ.z += velocity.z;

    if (!collides(nextZ)) {
      camera.position.z =
        nextZ.z;
    }
  }

  verticalVelocity -=
    gravity * delta;

  camera.position.y +=
    verticalVelocity * delta;

  if (
    camera.position.y <=
    groundY
  ) {
    camera.position.y =
      groundY;

    verticalVelocity =
      0;

    isGrounded =
      true;
  }

  networkTimer += delta;

  if (
    networkTimer >= 0.05
  ) {
    networkTimer = 0;

    socket.emit(
      "playerMove",
      {
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        },

        rotation: {
          x: camera.rotation.x,
          y: camera.rotation.y,
          z: camera.rotation.z
        }
      }
    );
  }
}


/* ======================================================
   SHOOT
====================================================== */

function shoot() {
  if (
    !controls.isLocked ||
    !playerJoined
  ) {
    return;
  }

  const weapon =
    GUNS[currentGun];

  if (!weapon) {
    return;
  }

  const now =
    performance.now();

  if (
    now -
      lastShotTime <
    weapon.cooldown
  ) {
    return;
  }

  lastShotTime =
    now;

  const origin =
    new THREE.Vector3();

  const direction =
    new THREE.Vector3();

  muzzlePoint.getWorldPosition(
    origin
  );

  camera.getWorldDirection(
    direction
  );

  direction.normalize();

  createTracer(
    origin,
    direction,
    localPlayerId
  );

  muzzleFlash.intensity =
    5;

  setTimeout(
    () => {
      muzzleFlash.intensity =
        0;
    },
    45
  );

  gun.position.z =
    0.08;

  setTimeout(
    () => {
      gun.position.z =
        0;
    },
    65
  );

  socket.emit(
    "shoot",
    {
      origin: {
        x:
          origin.x,

        y:
          origin.y,

        z:
          origin.z
      },

      direction: {
        x:
          direction.x,

        y:
          direction.y,

        z:
          direction.z
      },

      gunId:
        currentGun
    }
  );
}

window.addEventListener(
  "mousedown",
  (event) => {
    if (
      event.button === 0
    ) {
      shoot();
    }
  }
);


/* ======================================================
   SHOP
====================================================== */

function openGunShop() {
  if (
    !playerJoined
  ) {
    return;
  }

  renderShop();

  shopPanel.style.display =
    "block";
}

function closeGunShop() {
  shopPanel.style.display =
    "none";
}

shopButton.addEventListener(
  "click",
  openGunShop
);

closeShop.addEventListener(
  "click",
  closeGunShop
);

function renderShop() {
  shopCoins.textContent =
    `Coins: ${coins}`;

  gunList.innerHTML =
    "";

  for (
    const [
      gunId,
      weapon
    ] of Object.entries(
      GUNS
    )
  ) {
    const card =
      document.createElement(
        "div"
      );

    card.className =
      "gunCard";

    const owned =
      !!ownedGuns[gunId];

    const equipped =
      currentGun ===
      gunId;

    let action = "";

    if (
      equipped
    ) {
      action = `
        <button
          class="gunAction equippedButton"
          disabled
        >
          EQUIPPED
        </button>
      `;
    } else if (
      owned
    ) {
      action = `
        <button
          class="gunAction equipButton"
          data-equip="${gunId}"
        >
          EQUIP
        </button>
      `;
    } else {
      action = `
        <button
          class="gunAction buyButton"
          data-buy="${gunId}"
        >
          BUY ${weapon.price}
        </button>
      `;
    }

    const hex =
      weapon.color
        .toString(16)
        .padStart(
          6,
          "0"
        );

    card.innerHTML = `
      <div class="gunTop">
        <div>
          <div
            class="gunName"
            style="color:#${hex}"
          >
            ${weapon.name}
          </div>

          <div class="gunStats">
            Damage:
            ${weapon.damage}
            &nbsp; | &nbsp;
            Fire Rate:
            ${weapon.cooldown}ms
            &nbsp; | &nbsp;
            ${
              weapon.price === 0
                ? "FREE"
                : `${weapon.price} COINS`
            }
          </div>
        </div>

        ${action}
      </div>
    `;

    gunList.appendChild(
      card
    );
  }

  document
    .querySelectorAll(
      "[data-buy]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            socket.emit(
              "buyGun",
              button.dataset.buy
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      "[data-equip]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            socket.emit(
              "equipGun",
              button.dataset.equip
            );
          }
        );
      }
    );
}


/* ======================================================
   POINTER LOCK / PLAY
====================================================== */

playButton.addEventListener(
  "click",
  () => {
    let name =
      usernameInput.value
        .trim()
        .replace(
          /[^\w\- ]/g,
          ""
        )
        .slice(
          0,
          16
        );

    if (!name) {
      name =
        "Player" +
        Math.floor(
          Math.random() *
            9000 +
            1000
        );
    }

    playerName =
      name;

    statusText.textContent =
      "Connecting to server...";

    /*
      Request pointer lock directly from the PLAY click.
      Browsers require pointer-lock requests to happen
      from a user gesture.
    */
    if (!controls.isLocked) {
      controls.lock();
    }

    if (playerJoined) {
      return;
    }

    if (
      socket.connected
    ) {
      socket.emit(
        "joinGame",
        {
          username:
            playerName
        }
      );
    } else {
      socket.connect();
    }
  }
);

controls.addEventListener(
  "lock",
  () => {
    startOverlay.style.display =
      "none";
  }
);

controls.addEventListener(
  "unlock",
  () => {
    if (
      health > 0
    ) {
      startOverlay.style.display =
        "flex";

      if (
        playerJoined
      ) {
        statusText.textContent =
          "Click PLAY to resume";
      }
    }
  }
);

usernameInput.addEventListener(
  "keydown",
  (event) => {
    if (
      event.code ===
      "Enter"
    ) {
      playButton.click();
    }
  }
);


/* ======================================================
   SOCKET CONNECTION
====================================================== */

socket.on(
  "connect",
  () => {
    console.log(
      "CONNECTED TO SERVER:",
      socket.id
    );

    statusText.textContent =
      "Connected";

    if (
      playerName &&
      !playerJoined
    ) {
      socket.emit(
        "joinGame",
        {
          username:
            playerName
        }
      );
    }
  }
);

socket.on(
  "disconnect",
  (reason) => {
    console.log(
      "DISCONNECTED:",
      reason
    );

    playerJoined =
      false;

    statusText.textContent =
      "Disconnected - reconnecting...";
  }
);

socket.on(
  "connect_error",
  (error) => {
    console.log(
      "CONNECTION ERROR:",
      error.message
    );

    statusText.textContent =
      "Server waking up...";
  }
);


/* ======================================================
   JOIN ACCEPTED
====================================================== */

socket.on(
  "joinAccepted",
  (data) => {
    localPlayerId =
      data.id;

    playerJoined =
      true;

    health =
      Number(
        data.health
      );

    score =
      Number(
        data.score
      );

    coins =
      Number(
        data.coins || 0
      );

    ownedGuns =
      data.ownedGuns ||
      {
        pistol: true
      };

    currentGun =
      data.currentGun ||
      "pistol";

    camera.position.set(
      data.position.x,
      2.1,
      data.position.z
    );

    verticalVelocity = 0;

    isGrounded = true;

    healthValue.textContent =
      health;

    scoreValue.textContent =
      score;

    coinsValue.textContent =
      coins;

    applyGunVisual();

    renderShop();

    updatePlayerCount();

    statusText.textContent =
      "Connected";

    startOverlay.style.display =
      "none";
  }
);


/* ======================================================
   EXISTING PLAYERS
====================================================== */

socket.on(
  "existingPlayers",
  (players) => {
    for (
      const player of players
    ) {
      if (
        player.id ===
        localPlayerId
      ) {
        continue;
      }

      if (
        otherPlayers.has(
          player.id
        )
      ) {
        continue;
      }

      const avatar =
        createOtherPlayer(
          player.id,
          player.username
        );

      avatar.position.set(
        player.position.x,
        0,
        player.position.z
      );

      avatar.rotation.y =
        player.rotation.y;

      const remote =
        otherPlayers.get(
          player.id
        );

      if (remote) {
        remote.targetPosition.copy(
          avatar.position
        );

        remote.targetRotationY =
          player.rotation.y;
      }
    }

    updatePlayerCount();
  }
);


/* ======================================================
   PLAYER JOINED
====================================================== */

socket.on(
  "playerJoined",
  (player) => {
    if (
      player.id ===
      localPlayerId
    ) {
      return;
    }

    if (
      !otherPlayers.has(
        player.id
      )
    ) {
      const avatar =
        createOtherPlayer(
          player.id,
          player.username
        );

      avatar.position.set(
        player.position.x,
        0,
        player.position.z
      );

      avatar.rotation.y =
        player.rotation.y;
    }

    updatePlayerCount();
  }
);


/* ======================================================
   PLAYER MOVED
====================================================== */

socket.on(
  "playerMoved",
  (data) => {
    if (
      data.id ===
      localPlayerId
    ) {
      return;
    }

    const remote =
      otherPlayers.get(
        data.id
      );

    if (!remote) {
      return;
    }

    remote.targetPosition.set(
      data.position.x,
      0,
      data.position.z
    );

    remote.targetRotationY =
      data.rotation.y;
  }
);


/* ======================================================
   PLAYER LEFT
====================================================== */

socket.on(
  "playerLeft",
  (id) => {
    const remote =
      otherPlayers.get(
        id
      );

    if (!remote) {
      return;
    }

    scene.remove(
      remote.group
    );

    otherPlayers.delete(
      id
    );

    updatePlayerCount();
  }
);


/* ======================================================
   PLAYER COUNT
====================================================== */

socket.on(
  "playerCount",
  (count) => {
    playerCountValue.textContent =
      count;
  }
);


/* ======================================================
   REMOTE SHOTS
====================================================== */

socket.on(
  "playerShot",
  (data) => {
    if (
      data.id ===
      localPlayerId
    ) {
      return;
    }

    createTracer(
      new THREE.Vector3(
        data.origin.x,
        data.origin.y,
        data.origin.z
      ),

      new THREE.Vector3(
        data.direction.x,
        data.direction.y,
        data.direction.z
      ),

      data.id
    );
  }
);


/* ======================================================
   PLAYER HIT
====================================================== */

socket.on(
  "playerHit",
  (data) => {
    if (
      data.targetId !==
      localPlayerId
    ) {
      return;
    }

    health =
      Math.max(
        0,
        Number(
          data.health
        )
      );

    healthValue.textContent =
      health;

    damageFlash.style.opacity =
      "1";

    setTimeout(
      () => {
        damageFlash.style.opacity =
          "0";
      },
      120
    );

    hitMarker.style.opacity =
      "1";

    setTimeout(
      () => {
        hitMarker.style.opacity =
          "0";
      },
      120
    );

    if (
      health <= 0
    ) {
      health = 0;

      healthValue.textContent =
        "0";

      controls.unlock();

      startOverlay.style.display =
        "flex";

      statusText.textContent =
        `Eliminated by ${
          data.attackerName ||
          "enemy"
        }`;
    }
  }
);


/* ======================================================
   SCORE
====================================================== */

socket.on(
  "scoreUpdate",
  (data) => {
    if (
      data.id !==
      localPlayerId
    ) {
      return;
    }

    score =
      Number(
        data.score
      );

    scoreValue.textContent =
      score;
  }
);


/* ======================================================
   CURRENCY
====================================================== */

socket.on(
  "currencyUpdate",
  (data) => {
    if (
      data.id !==
      localPlayerId
    ) {
      return;
    }

    coins =
      Number(
        data.coins
      );

    coinsValue.textContent =
      coins;

    shopCoins.textContent =
      `Coins: ${coins}`;

    renderShop();
  }
);


/* ======================================================
   GUN INVENTORY
====================================================== */

socket.on(
  "gunInventory",
  (data) => {
    ownedGuns =
      data.ownedGuns ||
      {
        pistol: true
      };

    currentGun =
      data.currentGun ||
      "pistol";

    applyGunVisual();

    renderShop();
  }
);

socket.on(
  "gunPurchased",
  (data) => {
    ownedGuns =
      data.ownedGuns ||
      {
        pistol: true
      };

    coins =
      Number(
        data.coins
      );

    currentGun =
      data.currentGun ||
      "pistol";

    coinsValue.textContent =
      coins;

    applyGunVisual();

    renderShop();
  }
);

socket.on(
  "gunPurchaseFailed",
  (data) => {
    statusText.textContent =
      data.message ||
      "Purchase failed";

    setTimeout(
      () => {
        if (
          controls.isLocked
        ) {
          statusText.textContent =
            "Connected";
        }
      },
      1200
    );
  }
);


/* ======================================================
   ELIMINATION
====================================================== */

socket.on(
  "playerEliminated",
  (data) => {
    if (
      data.attackerId ===
      localPlayerId
    ) {
      killMessage.textContent =
        "+10 COINS";

      killMessage.style.opacity =
        "1";

      setTimeout(
        () => {
          killMessage.style.opacity =
            "0";
        },
        900
      );
    }
  }
);


/* ======================================================
   RESPAWN
====================================================== */

socket.on(
  "respawn",
  (data) => {
    health =
      Number(
        data.health
      );

    healthValue.textContent =
      health;

    camera.position.set(
      data.position.x,
      data.position.y,
      data.position.z
    );

    verticalVelocity = 0;

    isGrounded = true;

    playerJoined =
      true;

    startOverlay.style.display =
      "flex";

    statusText.textContent =
      "Click PLAY to resume";
  }
);


/* ======================================================
   REMOTE PLAYERS
====================================================== */

function updateRemotePlayers(
  delta
) {
  const alpha =
    1 -
    Math.pow(
      0.0001,
      delta
    );

  for (
    const player of
    otherPlayers.values()
  ) {
    player.group.position.lerp(
      player.targetPosition,
      alpha
    );

    let difference =
      player.targetRotationY -
      player.group.rotation.y;

    difference =
      Math.atan2(
        Math.sin(
          difference
        ),
        Math.cos(
          difference
        )
      );

    player.group.rotation.y +=
      difference *
      alpha;
  }
}


/* ======================================================
   PROJECTILES
====================================================== */

function pointInsideCollisionBox(position, box) {
  return (
    position.x >= box.minX &&
    position.x <= box.maxX &&
    position.y >= box.minY &&
    position.y <= box.maxY &&
    position.z >= box.minZ &&
    position.z <= box.maxZ
  );
}

function segmentHitsCollisionBox(start, end, box) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;

  let tMin = 0;
  let tMax = 1;

  if (Math.abs(dx) < 0.000001) {
    if (start.x < box.minX || start.x > box.maxX) {
      return false;
    }
  } else {
    let tx1 = (box.minX - start.x) / dx;
    let tx2 = (box.maxX - start.x) / dx;

    if (tx1 > tx2) {
      [tx1, tx2] = [tx2, tx1];
    }

    tMin = Math.max(tMin, tx1);
    tMax = Math.min(tMax, tx2);

    if (tMin > tMax) {
      return false;
    }
  }

  if (Math.abs(dy) < 0.000001) {
    if (start.y < box.minY || start.y > box.maxY) {
      return false;
    }
  } else {
    let ty1 = (box.minY - start.y) / dy;
    let ty2 = (box.maxY - start.y) / dy;

    if (ty1 > ty2) {
      [ty1, ty2] = [ty2, ty1];
    }

    tMin = Math.max(tMin, ty1);
    tMax = Math.min(tMax, ty2);

    if (tMin > tMax) {
      return false;
    }
  }

  if (Math.abs(dz) < 0.000001) {
    if (start.z < box.minZ || start.z > box.maxZ) {
      return false;
    }
  } else {
    let tz1 = (box.minZ - start.z) / dz;
    let tz2 = (box.maxZ - start.z) / dz;

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

function projectileHitsWall(start, end) {
  for (const box of collisionBoxes) {
    if (segmentHitsCollisionBox(start, end, box)) {
      return true;
    }
  }

  return false;
}

function updateProjectiles(delta) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];

    projectile.age += delta;

    const oldPosition =
      projectile.mesh.position.clone();

    const movement =
      projectile.velocity
        .clone()
        .multiplyScalar(delta);

    const newPosition =
      oldPosition.clone().add(movement);

    /*
      Check the entire path, not only the final position.
      This prevents fast bullets from tunneling through
      thin walls between frames.
    */
    if (
      projectileHitsWall(
        oldPosition,
        newPosition
      )
    ) {
      scene.remove(projectile.mesh);
      projectiles.splice(i, 1);
      continue;
    }

    projectile.mesh.position.copy(newPosition);

    if (
      projectile.age > 1.4 ||
      Math.abs(projectile.mesh.position.x) >
        arenaSize / 2 + 20 ||
      Math.abs(projectile.mesh.position.z) >
        arenaSize / 2 + 20
    ) {
      scene.remove(projectile.mesh);
      projectiles.splice(i, 1);
    }
  }
}

/* ======================================================
   GUN VISUAL SYSTEM
====================================================== */

const gun = new THREE.Group();

const gunBodyMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x6d7881,
    metalness: 0.8,
    roughness: 0.3
  });

const gunBarrelMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x15191d,
    metalness: 0.95,
    roughness: 0.2
  });

const gunGlowMaterial =
  new THREE.MeshBasicMaterial({
    color: 0x00ffff
  });

/* Main gun body */

const gunBody =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.22,
      0.18,
      0.55
    ),
    gunBodyMaterial
  );

gunBody.position.set(
  0,
  0,
  0
);

gun.add(gunBody);


/* Gun barrel */

const gunBarrel =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.035,
      0.045,
      0.45,
      12
    ),
    gunBarrelMaterial
  );

gunBarrel.rotation.x =
  Math.PI / 2;

gunBarrel.position.set(
  0,
  0.02,
  -0.43
);

gun.add(gunBarrel);


/* Cyan energy strip */

const gunGlow =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.045,
      0.025,
      0.42
    ),
    gunGlowMaterial
  );

gunGlow.position.set(
  0,
  0.1,
  -0.05
);

gun.add(gunGlow);


/* Handle */

const gunHandle =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.14,
      0.3,
      0.16
    ),
    gunBodyMaterial
  );

gunHandle.position.set(
  0,
  -0.2,
  0.08
);

gunHandle.rotation.x =
  -0.18;

gun.add(gunHandle);


/* Position gun in first person */

gun.position.set(
  0.48,
  -0.38,
  -0.75
);

gun.rotation.set(
  -0.04,
  -0.08,
  0
);

camera.add(gun);


/* ======================================================
   MUZZLE POINT
====================================================== */

const muzzlePoint =
  new THREE.Object3D();

muzzlePoint.position.set(
  0,
  0.02,
  -0.67
);

gun.add(muzzlePoint);


/* ======================================================
   MUZZLE FLASH
====================================================== */

const muzzleFlash =
  new THREE.PointLight(
    0xffcc66,
    0,
    4
  );

muzzlePoint.add(
  muzzleFlash
);


/* ======================================================
   APPLY GUN VISUAL
====================================================== */

function applyGunVisual() {

  const weapon =
    GUNS[currentGun];

  if (!weapon) {
    return;
  }

  const color =
    new THREE.Color(
      weapon.color
    );

  gunBodyMaterial.color.copy(
    color
  );

  gunGlowMaterial.color.copy(
    color
  );

  const scale =
    weapon.barrelScale || 1;

  gunBarrel.scale.set(
    1,
    scale,
    1
  );

  gun.position.set(
    0.48,
    -0.38,
    -0.75
  );

  gun.rotation.set(
    -0.04,
    -0.08,
    0
  );

  gunValue.textContent =
    weapon.name;
}


/* ======================================================
   TRACER
====================================================== */

function createTracer(
  origin,
  direction,
  ownerId
) {

  const tracerMaterial =
    new THREE.MeshBasicMaterial({
      color:
        GUNS[currentGun]
          ? GUNS[currentGun].color
          : 0x00ffff
    });

  const tracer =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.025,
        0.025,
        1.2,
        8
      ),
      tracerMaterial
    );

  tracer.position.copy(
    origin
  );

  const end =
    origin.clone().add(
      direction.clone()
        .multiplyScalar(1.2)
    );

  tracer.position.lerp(
    end,
    0.5
  );

  tracer.quaternion.setFromUnitVectors(
    new THREE.Vector3(
      0,
      1,
      0
    ),
    direction.clone().normalize()
  );

  scene.add(tracer);

  setTimeout(
    () => {
      scene.remove(tracer);
      tracer.geometry.dispose();
      tracer.material.dispose();
    },
    70
  );
}

/* ======================================================
   GUN ANIMATION
====================================================== */

function updateGun() {
  const moving =
    movement.forward ||
    movement.backward ||
    movement.left ||
    movement.right;

  if (
    controls.isLocked &&
    moving
  ) {
    const t =
      performance.now() *
      0.008;

    gun.position.y =
      Math.sin(t) *
      0.008;

    gun.position.x =
      Math.cos(t * 0.5) *
      0.008;
  } else {
    gun.position.y *=
      0.85;

    gun.position.x *=
      0.85;
  }
}


/* ======================================================
   PLAYER COUNT
====================================================== */

function updatePlayerCount() {
  playerCountValue.textContent =
    String(
      otherPlayers.size +
      (
        playerJoined
          ? 1
          : 0
      )
    );
}


/* ======================================================
   RESIZE
====================================================== */

window.addEventListener(
  "resize",
  () => {
    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);


/* ======================================================
   START
====================================================== */

usernameInput.focus();


/* ======================================================
   GAME LOOP
====================================================== */

function animate() {
  requestAnimationFrame(
    animate
  );

  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    );

  updateMovement(
    delta
  );

  updateRemotePlayers(
    delta
  );

  updateProjectiles(
    delta
  );

  updateGun();

  renderer.render(
    scene,
    camera
  );
}

