const SERVER_URL = "https://mygameisgood.onrender.com";

/* ======================================================
   SOCKET.IO
====================================================== */

const socket = io(SERVER_URL, {
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true
});

/* ======================================================
   THREE.JS SCENE
====================================================== */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x02050a);

scene.fog = new THREE.Fog(
  0x02050a,
  45,
  190
);

/* ======================================================
   CAMERA
====================================================== */

const camera = new THREE.PerspectiveCamera(
  76,
  window.innerWidth / window.innerHeight,
  0.05,
  500
);

camera.position.set(
  0,
  2.1,
  25
);

/* ======================================================
   RENDERER
====================================================== */

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

if (
  "outputColorSpace" in renderer &&
  typeof THREE.SRGBColorSpace !== "undefined"
) {
  renderer.outputColorSpace =
    THREE.SRGBColorSpace;
} else if (
  "outputEncoding" in renderer &&
  typeof THREE.sRGBEncoding !== "undefined"
) {
  renderer.outputEncoding =
    THREE.sRGBEncoding;
}

document
  .getElementById("game")
  .appendChild(renderer.domElement);

/* ======================================================
   POINTER LOCK
====================================================== */

const controls =
  new THREE.PointerLockControls(
    camera,
    renderer.domElement
  );

/* ======================================================
   DOM
====================================================== */

const healthValue =
  document.getElementById("healthValue");

const scoreValue =
  document.getElementById("scoreValue");

const coinsValue =
  document.getElementById("coinsValue");

const playerCountValue =
  document.getElementById("playerCountValue");

const gunValue =
  document.getElementById("gunValue");

const startOverlay =
  document.getElementById("startOverlay");

const playButton =
  document.getElementById("playButton");

const usernameInput =
  document.getElementById("usernameInput");

const statusText =
  document.getElementById("statusText");

const damageFlash =
  document.getElementById("damageFlash");

const hitMarker =
  document.getElementById("hitMarker");

const killMessage =
  document.getElementById("killMessage");

const shopButton =
  document.getElementById("shopButton");

const shopPanel =
  document.getElementById("shopPanel");

const closeShop =
  document.getElementById("closeShop");

const shopCoins =
  document.getElementById("shopCoins");

const gunList =
  document.getElementById("gunList");

/* ======================================================
   GAME STATE
====================================================== */

let localPlayerId = null;

let playerName = "";

let playerJoined = false;

let joinRequested = false;

let health = 100;

let score = 0;

let coins = 0;

let currentGun = "pistol";

let ownedGuns = {
  pistol: true
};

/* ======================================================
   GUNS
====================================================== */

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

/* ======================================================
   MOVEMENT
====================================================== */

const movement = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const velocity = new THREE.Vector3();

let verticalVelocity = 0;
let isGrounded = true;

const jumpStrength = 10;
const gravity = 28;
const groundY = 2.1;

let networkTimer = 0;

/* ======================================================
   WORLD STATE
====================================================== */

const otherPlayers = new Map();

const collisionBoxes = [];

const clock = new THREE.Clock();

const arenaSize = 120;

const playerRadius = 0.65;

let lastShotTime = 0;

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

moon.shadow.mapSize.width = 2048;
moon.shadow.mapSize.height = 2048;

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

floor.position.y = -0.35;

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
   COLLISION BOX
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
    minX: x - width / 2,
    maxX: x + width / 2,

    minY: y,
    maxY: y + height,

    minZ: z - depth / 2,
    maxZ: z + depth / 2
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
    minX: x - width / 2,
    maxX: x + width / 2,

    minY: y - height / 2,
    maxY: y + height / 2,

    minZ: z - depth / 2,
    maxZ: z + depth / 2
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
   BUILDINGS
====================================================== */

function createBuilding(
  x,
  z,
  width,
  depth,
  height
) {
  const building =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth
      ),
      darkWallMaterial
    );

  building.position.set(
    x,
    height / 2,
    z
  );

  building.castShadow = true;
  building.receiveShadow = true;

  scene.add(building);

  const roof =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width + 0.4,
        0.35,
        depth + 0.4
      ),
      metalMaterial
    );

  roof.position.set(
    x,
    height + 0.15,
    z
  );

  roof.castShadow = true;

  scene.add(roof);

  collisionBoxes.push({
    minX: x - width / 2,
    maxX: x + width / 2,

    minY: 0,
    maxY: height,

    minZ: z - depth / 2,
    maxZ: z + depth / 2
  });

  return building;
}

createBuilding(
  -40,
  -27,
  20,
  18,
  8
);

createBuilding(
  40,
  -27,
  20,
  18,
  8
);

createBuilding(
  -43,
  30,
  14,
  17,
  6
);

createBuilding(
  43,
  30,
  14,
  17,
  6
);

/* ======================================================
   CENTRAL STRUCTURE
====================================================== */

addBox(
  0,
  0,
  -17,
  28,
  7,
  3,
  concreteMaterial
);

addBox(
  -14,
  0,
  -8,
  3,
  7,
  18,
  concreteMaterial
);

addBox(
  14,
  0,
  -8,
  3,
  7,
  18,
  concreteMaterial
);

/* ======================================================
   LONG COVER WALLS
====================================================== */

addBox(
  -30,
  0,
  2,
  14,
  3,
  2,
  concreteMaterial
);

addBox(
  30,
  0,
  2,
  14,
  3,
  2,
  concreteMaterial
);

addBox(
  -7,
  0,
  12,
  12,
  3,
  2,
  concreteMaterial
);

addBox(
  7,
  0,
  12,
  12,
  3,
  2,
  concreteMaterial
);

/* ======================================================
   SMALL BLOCKS
====================================================== */

addBox(
  -27,
  0,
  -16,
  6,
  3,
  4
);

addBox(
  27,
  0,
  -16,
  6,
  3,
  4
);

addBox(
  -25,
  0,
  25,
  7,
  4,
  4
);

addBox(
  25,
  0,
  25,
  7,
  4,
  4
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
    Math.abs(Math.cos(rotation));

  const sin =
    Math.abs(Math.sin(rotation));

  const width =
    5 * cos +
    0.55 * sin;

  const depth =
    5 * sin +
    0.55 * cos;

  collisionBoxes.push({
    minX: x - width / 2,
    maxX: x + width / 2,

    minY: 0,
    maxY: 1.8,

    minZ: z - depth / 2,
    maxZ: z + depth / 2
  });
}

createBarrier(
  -20,
  8,
  0
);

createBarrier(
  20,
  8,
  0
);

createBarrier(
  0,
  28,
  Math.PI / 2
);

/* ======================================================
   GUN MODEL
====================================================== */

const gun =
  new THREE.Group();

const gunBodyMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x6d7881,
    metalness: 0.8,
    roughness: 0.3
  });

const gunBarrelMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x101419,
    metalness: 0.9,
    roughness: 0.2
  });

const gunGlowMaterial =
  new THREE.MeshBasicMaterial({
    color: 0x00d9ff
  });

const gunBody =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.22,
      0.18,
      0.72
    ),
    gunBodyMaterial
  );

gunBody.position.set(
  0,
  0,
  -0.3
);

gunBody.castShadow = true;

gun.add(gunBody);

const gunBarrel =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.08,
      0.08,
      0.7
    ),
    gunBarrelMaterial
  );

gunBarrel.position.set(
  0,
  0.01,
  -0.85
);

gunBarrel.castShadow = true;

gun.add(gunBarrel);

const gunGlow =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.04,
      0.04,
      0.62
    ),
    gunGlowMaterial
  );

gunGlow.position.set(
  0,
  0,
  -0.86
);

gun.add(gunGlow);

const gunHandle =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.14,
      0.35,
      0.16
    ),
    gunBodyMaterial
  );

gunHandle.position.set(
  0,
  -0.22,
  -0.2
);

gunHandle.rotation.x =
  -0.18;

gunHandle.castShadow = true;

gun.add(gunHandle);

const muzzlePoint =
  new THREE.Object3D();

muzzlePoint.position.set(
  0,
  0.02,
  -1.2
);

gun.add(muzzlePoint);

const muzzleFlash =
  new THREE.PointLight(
    0xffcc66,
    0,
    4
  );

muzzlePoint.add(muzzleFlash);

const gunBasePosition =
  new THREE.Vector3(
    0.48,
    -0.38,
    -0.75
  );

const gunBaseRotation =
  new THREE.Euler(
    -0.04,
    -0.08,
    0
  );

let gunRecoil = 0;

gun.position.copy(
  gunBasePosition
);

gun.rotation.copy(
  gunBaseRotation
);

camera.add(gun);

scene.add(camera);

/* ======================================================
   GUN VISUAL
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

  gun.position.copy(
    gunBasePosition
  );

  gun.rotation.copy(
    gunBaseRotation
  );

  gunValue.textContent =
    weapon.name;
}

/* ======================================================
   REMOTE PLAYER
====================================================== */

function createOtherPlayer(
  id,
  username = "Player"
) {
  if (otherPlayers.has(id)) {
    return otherPlayers.get(id).group;
  }

  const group =
    new THREE.Group();

  /* BODY */

  const bodyMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x00a8ff,
      roughness: 0.6,
      metalness: 0.25
    });

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.9,
        1.35,
        0.55
      ),
      bodyMaterial
    );

  body.position.y =
    0.95;

  body.castShadow = true;
  body.receiveShadow = true;

  group.add(body);

  /* HEAD */

  const headMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xd7e4ef,
      roughness: 0.75,
      metalness: 0.05
    });

  const head =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.62,
        0.62,
        0.62
      ),
      headMaterial
    );

  head.position.y =
    1.92;

  head.castShadow = true;

  group.add(head);

  /* VISOR */

  const visorMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x00ffff
    });

  const visor =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.44,
        0.14,
        0.04
      ),
      visorMaterial
    );

  visor.position.set(
    0,
    1.97,
    -0.315
  );

  group.add(visor);

  /* SHOULDERS */

  const shoulderMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x343c44,
      metalness: 0.7,
      roughness: 0.3
    });

  const leftShoulder =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.3,
        0.28,
        0.65
      ),
      shoulderMaterial
    );

  leftShoulder.position.set(
    -0.58,
    1.25,
    0
  );

  group.add(leftShoulder);

  const rightShoulder =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.3,
        0.28,
        0.65
      ),
      shoulderMaterial
    );

  rightShoulder.position.set(
    0.58,
    1.25,
    0
  );

  group.add(rightShoulder);

  /* SIMPLE GUN */

  const remoteGun =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.12,
        0.12,
        0.65
      ),
      gunBarrelMaterial
    );

  remoteGun.position.set(
    0.48,
    1.05,
    -0.38
  );

  remoteGun.rotation.x =
    Math.PI / 2;

  remoteGun.castShadow = true;

  group.add(remoteGun);

  group.position.set(
    0,
    0,
    0
  );

  scene.add(group);

  otherPlayers.set(
    id,
    {
      id,
      username,
      group,
      targetPosition:
        group.position.clone(),
      targetRotationY:
        group.rotation.y
    }
  );

  return group;
}

/* ======================================================
   TRACER
====================================================== */

function findTracerEnd(
  start,
  direction,
  maxDistance = 120
) {
  const end =
    start.clone().add(
      direction
        .clone()
        .multiplyScalar(maxDistance)
    );

  let closestDistance =
    maxDistance;

  const segment =
    end.clone().sub(start);

  for (
    const box of collisionBoxes
  ) {
    const hit =
      segmentHitDistance(
        start,
        segment,
        box
      );

    if (
      hit !== null &&
      hit < closestDistance
    ) {
      closestDistance = hit;
    }
  }

  return start.clone().add(
    direction
      .clone()
      .multiplyScalar(
        Math.max(
          0.25,
          closestDistance
        )
      )
  );
}

function segmentHitDistance(
  origin,
  direction,
  box
) {
  let tMin = 0;
  let tMax = 1;

  const dx = direction.x;
  const dy = direction.y;
  const dz = direction.z;

  if (
    Math.abs(dx) <
    0.000001
  ) {
    if (
      origin.x < box.minX ||
      origin.x > box.maxX
    ) {
      return null;
    }
  } else {
    let tx1 =
      (box.minX - origin.x) /
      dx;

    let tx2 =
      (box.maxX - origin.x) /
      dx;

    if (tx1 > tx2) {
      [tx1, tx2] =
        [tx2, tx1];
    }

    tMin =
      Math.max(
        tMin,
        tx1
      );

    tMax =
      Math.min(
        tMax,
        tx2
      );

    if (
      tMin >
      tMax
    ) {
      return null;
    }
  }

  if (
    Math.abs(dy) <
    0.000001
  ) {
    if (
      origin.y < box.minY ||
      origin.y > box.maxY
    ) {
      return null;
    }
  } else {
    let ty1 =
      (box.minY - origin.y) /
      dy;

    let ty2 =
      (box.maxY - origin.y) /
      dy;

    if (ty1 > ty2) {
      [ty1, ty2] =
        [ty2, ty1];
    }

    tMin =
      Math.max(
        tMin,
        ty1
      );

    tMax =
      Math.min(
        tMax,
        ty2
      );

    if (
      tMin >
      tMax
    ) {
      return null;
    }
  }

  if (
    Math.abs(dz) <
    0.000001
  ) {
    if (
      origin.z < box.minZ ||
      origin.z > box.maxZ
    ) {
      return null;
    }
  } else {
    let tz1 =
      (box.minZ - origin.z) /
      dz;

    let tz2 =
      (box.maxZ - origin.z) /
      dz;

    if (tz1 > tz2) {
      [tz1, tz2] =
        [tz2, tz1];
    }

    tMin =
      Math.max(
        tMin,
        tz1
      );

    tMax =
      Math.min(
        tMax,
        tz2
      );

    if (
      tMin >
      tMax
    ) {
      return null;
    }
  }

  if (
    tMin >= 0 &&
    tMin <= 1
  ) {
    return tMin *
      direction.length();
  }

  return null;
}

function createTracer(
  origin,
  direction,
  gunId = currentGun
) {
  const weapon =
    GUNS[gunId] ||
    GUNS[currentGun] ||
    GUNS.pistol;

  const end =
    findTracerEnd(
      origin,
      direction,
      120
    );

  const geometry =
    new THREE.BufferGeometry()
      .setFromPoints([
        origin,
        end
      ]);

  const material =
    new THREE.LineBasicMaterial({
      color: weapon.color,
      transparent: true,
      opacity: 0.95
    });

  const tracer =
    new THREE.Line(
      geometry,
      material
    );

  scene.add(tracer);

  setTimeout(
    () => {
      scene.remove(tracer);

      geometry.dispose();
      material.dispose();
    },
    70
  );
}

/* ======================================================
   COLLISION
====================================================== */

function collides(position) {
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

function updateMovement(delta) {
  if (
    !controls.isLocked ||
    !playerJoined
  ) {
    return;
  }

  move.set(
    0,
    0,
    0
  );

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

  if (
    move.lengthSq() > 0
  ) {
    move.normalize();

    camera.getWorldDirection(
      forward
    );

    forward.y = 0;

    if (
      forward.lengthSq() > 0
    ) {
      forward.normalize();
    }

    right.crossVectors(
      forward,
      camera.up
    );

    if (
      right.lengthSq() > 0
    ) {
      right.normalize();
    }

    velocity.set(
      0,
      0,
      0
    );

    velocity.addScaledVector(
      forward,
      -move.z
    );

    velocity.addScaledVector(
      right,
      move.x
    );

    if (
      velocity.lengthSq() > 0
    ) {
      velocity.normalize();

      velocity.multiplyScalar(
        20 * delta
      );
    }

    const nextX =
      camera.position.clone();

    nextX.x +=
      velocity.x;

    if (
      !collides(nextX)
    ) {
      camera.position.x =
        nextX.x;
    }

    const nextZ =
      camera.position.clone();

    nextZ.z +=
      velocity.z;

    if (
      !collides(nextZ)
    ) {
      camera.position.z =
        nextZ.z;
    }
  }

  verticalVelocity -=
    gravity * delta;

  camera.position.y +=
    verticalVelocity *
    delta;

  if (
    camera.position.y <=
    groundY
  ) {
    camera.position.y =
      groundY;

    verticalVelocity = 0;

    isGrounded = true;
  } else {
    isGrounded = false;
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
   REMOTE PLAYER UPDATE
====================================================== */

function updateRemotePlayers(delta) {
  const alpha =
    1 -
    Math.pow(
      0.0001,
      delta
    );

  for (
    const remote of
    otherPlayers.values()
  ) {
    remote.group.position.lerp(
      remote.targetPosition,
      alpha
    );

    let difference =
      remote.targetRotationY -
      remote.group.rotation.y;

    difference =
      Math.atan2(
        Math.sin(
          difference
        ),
        Math.cos(
          difference
        )
      );

    remote.group.rotation.y +=
      difference * alpha;
  }
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
    playerJoined
  ) {
    const t =
      performance.now() *
      0.008;

    const bobX =
      moving
        ? Math.cos(t * 0.5) * 0.008
        : 0;

    const bobY =
      moving
        ? Math.sin(t) * 0.008
        : 0;

    gunRecoil *= 0.78;

    gun.position.set(
      gunBasePosition.x + bobX,
      gunBasePosition.y + bobY,
      gunBasePosition.z + gunRecoil
    );
  } else {
    gunRecoil *= 0.78;

    gun.position.set(
      gunBasePosition.x,
      gunBasePosition.y,
      gunBasePosition.z + gunRecoil
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
    currentGun
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

  gunRecoil =
    0.08;

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

      gunId: currentGun
    }
  );
}

/* ======================================================
   INPUT
====================================================== */

window.addEventListener(
  "keydown",
  (event) => {
    if (
      event.code === "KeyW"
    ) {
      movement.forward = true;
    }

    if (
      event.code === "KeyS"
    ) {
      movement.backward = true;
    }

    if (
      event.code === "KeyA"
    ) {
      movement.left = true;
    }

    if (
      event.code === "KeyD"
    ) {
      movement.right = true;
    }

    if (
      event.code === "Space" &&
      isGrounded &&
      controls.isLocked &&
      playerJoined
    ) {
      verticalVelocity =
        jumpStrength;

      isGrounded = false;

      event.preventDefault();
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    if (
      event.code === "KeyW"
    ) {
      movement.forward = false;
    }

    if (
      event.code === "KeyS"
    ) {
      movement.backward = false;
    }

    if (
      event.code === "KeyA"
    ) {
      movement.left = false;
    }

    if (
      event.code === "KeyD"
    ) {
      movement.right = false;
    }
  }
);

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
   POINTER LOCK EVENTS
====================================================== */

controls.addEventListener(
  "lock",
  () => {
    startOverlay.style.display =
      "none";

    if (
      playerJoined &&
      health > 0
    ) {
      statusText.textContent =
        "Connected";
    }
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

/* ======================================================
   PLAY BUTTON
====================================================== */

function requestJoin() {
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

  joinRequested = true;

  statusText.textContent =
    "Connecting to server...";

  if (
    !controls.isLocked
  ) {
    controls.lock();
  }

  if (
    playerJoined
  ) {
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

playButton.addEventListener(
  "click",
  requestJoin
);

usernameInput.addEventListener(
  "keydown",
  (event) => {
    if (
      event.code === "Enter"
    ) {
      requestJoin();
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

    localPlayerId =
      socket.id;

    statusText.textContent =
      "Connected";

    if (
      joinRequested &&
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

    playerJoined = false;

    localPlayerId = null;

    statusText.textContent =
      "Disconnected - reconnecting...";

    for (
      const remote of
      otherPlayers.values()
    ) {
      scene.remove(
        remote.group
      );
    }

    otherPlayers.clear();

    updatePlayerCount();
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
    console.log(
      "JOIN ACCEPTED:",
      data
    );

    localPlayerId =
      data.id ||
      socket.id;

    playerJoined = true;

    joinRequested = true;

    health =
      Number(
        data.health
      ) || 100;

    score =
      Number(
        data.score
      ) || 0;

    coins =
      Number(
        data.coins
      ) || 0;

    ownedGuns =
      data.ownedGuns ||
      {
        pistol: true
      };

    currentGun =
      data.currentGun ||
      "pistol";

    if (
      data.position
    ) {
      camera.position.set(
        Number(data.position.x) || 0,
        Number(data.position.y) || groundY,
        Number(data.position.z) || 25
      );
    } else {
      camera.position.set(
        0,
        groundY,
        25
      );
    }

    verticalVelocity = 0;
    isGrounded = true;

    healthValue.textContent =
      health;

    scoreValue.textContent =
      score;

    coinsValue.textContent =
      coins;

    shopCoins.textContent =
      `Coins: ${coins}`;

    applyGunVisual();

    renderShop();

    updatePlayerCount();

    statusText.textContent =
      "Connected";

    startOverlay.style.display =
      "none";

    if (
      !controls.isLocked
    ) {
      controls.lock();
    }
  }
);

/* ======================================================
   EXISTING PLAYERS
====================================================== */

socket.on(
  "existingPlayers",
  (players) => {
    if (
      !Array.isArray(players)
    ) {
      return;
    }

    for (
      const player of players
    ) {
      if (
        !player ||
        player.id ===
          localPlayerId
      ) {
        continue;
      }

      const avatar =
        createOtherPlayer(
          player.id,
          player.username ||
            "Player"
        );

      const position =
        player.position || {
          x: 0,
          y: 0,
          z: 0
        };

      const rotation =
        player.rotation || {
          y: 0
        };

      avatar.position.set(
        Number(position.x) || 0,
        0,
        Number(position.z) || 0
      );

      avatar.rotation.y =
        Number(rotation.y) || 0;

      const remote =
        otherPlayers.get(
          player.id
        );

      if (remote) {
        remote.targetPosition.copy(
          avatar.position
        );

        remote.targetRotationY =
          avatar.rotation.y;
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
      !player ||
      player.id ===
        localPlayerId
    ) {
      return;
    }

    const avatar =
      createOtherPlayer(
        player.id,
        player.username ||
          "Player"
      );

    const position =
      player.position || {
        x: 0,
        y: 0,
        z: 0
      };

    const rotation =
      player.rotation || {
        y: 0
      };

    avatar.position.set(
      Number(position.x) || 0,
      0,
      Number(position.z) || 0
    );

    avatar.rotation.y =
      Number(rotation.y) || 0;

    const remote =
      otherPlayers.get(
        player.id
      );

    if (remote) {
      remote.targetPosition.copy(
        avatar.position
      );

      remote.targetRotationY =
        avatar.rotation.y;
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
      !data ||
      data.id ===
        localPlayerId
    ) {
      return;
    }

    let remote =
      otherPlayers.get(
        data.id
      );

    if (!remote) {
      createOtherPlayer(
        data.id,
        data.username ||
          "Player"
      );

      remote =
        otherPlayers.get(
          data.id
        );
    }

    if (
      !remote ||
      !data.position
    ) {
      return;
    }

    remote.targetPosition.set(
      Number(data.position.x) || 0,
      0,
      Number(data.position.z) || 0
    );

    if (
      data.rotation
    ) {
      remote.targetRotationY =
        Number(
          data.rotation.y
        ) || 0;
    }
  }
);

/* ======================================================
   PLAYER LEFT
====================================================== */

socket.on(
  "playerLeft",
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
      String(
        Number(count) || 0
      );
  }
);

/* ======================================================
   PLAYER SHOT
====================================================== */

socket.on(
  "playerShot",
  (data) => {
    if (!data) {
      return;
    }

    const shooterId =
      data.id ||
      data.ownerId;

    if (
      shooterId ===
      localPlayerId
    ) {
      return;
    }

    if (
      !data.origin ||
      !data.direction
    ) {
      return;
    }

    const origin =
      new THREE.Vector3(
        Number(data.origin.x) || 0,
        Number(data.origin.y) || 0,
        Number(data.origin.z) || 0
      );

    const direction =
      new THREE.Vector3(
        Number(data.direction.x) || 0,
        Number(data.direction.y) || 0,
        Number(data.direction.z) || -1
      );

    if (
      direction.lengthSq() === 0
    ) {
      return;
    }

    direction.normalize();

    createTracer(
      origin,
      direction,
      data.gunId ||
        "pistol"
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
      !data ||
      data.targetId !==
        localPlayerId
    ) {
      return;
    }

    health =
      Math.max(
        0,
        Number(data.health) || 0
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
   SCORE UPDATE
====================================================== */

socket.on(
  "scoreUpdate",
  (data) => {
    if (
      !data ||
      data.id !==
        localPlayerId
    ) {
      return;
    }

    score =
      Number(data.score) || 0;

    scoreValue.textContent =
      score;
  }
);

/* ======================================================
   CURRENCY UPDATE
====================================================== */

socket.on(
  "currencyUpdate",
  (data) => {
    if (
      !data ||
      data.id !==
        localPlayerId
    ) {
      return;
    }

    coins =
      Number(data.coins) || 0;

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
    if (!data) {
      return;
    }

    ownedGuns =
      data.ownedGuns ||
      {
        pistol: true
      };

    currentGun =
      data.currentGun ||
      currentGun;

    applyGunVisual();

    renderShop();
  }
);

/* ======================================================
   GUN PURCHASED
====================================================== */

socket.on(
  "gunPurchased",
  (data) => {
    if (!data) {
      return;
    }

    ownedGuns =
      data.ownedGuns ||
      ownedGuns;

    coins =
      Number(data.coins) || 0;

    if (
      data.currentGun
    ) {
      currentGun =
        data.currentGun;
    }

    coinsValue.textContent =
      coins;

    shopCoins.textContent =
      `Coins: ${coins}`;

    applyGunVisual();

    renderShop();
  }
);

/* ======================================================
   GUN EQUIPPED
====================================================== */

socket.on(
  "gunEquipped",
  (data) => {
    if (!data) {
      return;
    }

    currentGun =
      data.gunId ||
      currentGun;

    if (
      data.ownedGuns
    ) {
      ownedGuns =
        data.ownedGuns;
    }

    applyGunVisual();

    renderShop();
  }
);

/* ======================================================
   GUN PURCHASE FAILED
====================================================== */

socket.on(
  "gunPurchaseFailed",
  (data) => {
    statusText.textContent =
      data?.message ||
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
   SHOP ERROR
====================================================== */

socket.on(
  "shopError",
  (message) => {
    console.log(
      "SHOP ERROR:",
      message
    );

    statusText.textContent =
      String(
        message ||
        "Shop error"
      );

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
   PLAYER ELIMINATED
====================================================== */

socket.on(
  "playerEliminated",
  (data) => {
    if (
      !data ||
      data.attackerId !==
        localPlayerId
    ) {
      return;
    }

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
);

/* ======================================================
   RESPAWN
====================================================== */

socket.on(
  "respawn",
  (data) => {
    if (!data) {
      return;
    }

    health =
      Number(data.health) || 100;

    healthValue.textContent =
      health;

    if (
      data.position
    ) {
      camera.position.set(
        Number(data.position.x) || 0,
        Number(data.position.y) || groundY,
        Number(data.position.z) || 0
      );
    }

    verticalVelocity = 0;
    isGrounded = true;
    playerJoined = true;

    startOverlay.style.display =
      "flex";

    statusText.textContent =
      "Click PLAY to resume";
  }
);

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
   GUN SHOP
====================================================== */

function openGunShop() {
  if (!playerJoined) {
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
  closeGunShop
);

/* ======================================================
   SHOP RENDER
====================================================== */

function renderShop() {
  if (!gunList) {
    return;
  }

  shopCoins.textContent =
    `Coins: ${coins}`;

  gunList.innerHTML = "";

  for (
    const [
      gunId,
      weapon
    ] of Object.entries(GUNS)
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

    gunList.appendChild(card);
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
            const gunId =
              button.dataset.buy;

            if (!gunId) {
              return;
            }

            socket.emit(
              "buyGun",
              gunId
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
            const gunId =
              button.dataset.equip;

            if (!gunId) {
              return;
            }

            socket.emit(
              "equipGun",
              gunId
            );
          }
        );
      }
    );
}

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
  `Coins: ${coins}`;

playerCountValue.textContent =
  "0";

gunValue.textContent =
  GUNS[currentGun].name;

/*
  IMPORTANT:
  applyGunVisual() is intentionally NOT called
  before the gun materials are created.
*/

applyGunVisual();

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

  updateGun();

  renderer.render(
    scene,
    camera
  );
}

animate();
