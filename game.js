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
    document.body
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
/* ======================================================
   MOBILE CONTROLS
====================================================== */

const mobileControls =
  document.getElementById("mobileControls");

const joystickZone =
  document.getElementById("joystickZone");

const joystickKnob =
  document.getElementById("joystickKnob");

const lookZone =
  document.getElementById("lookZone");

const mobileJump =
  document.getElementById("mobileJump");

const mobileFire =
  document.getElementById("mobileFire");

const mobileShop =
  document.getElementById("mobileShop");

const isTouchDevice =
  window.matchMedia("(pointer: coarse)").matches;

let mobileActive = false;

let joystickActive = false;

let joystickTouchId = null;

let lookTouchId = null;

let lastLookX = 0;

let lastLookY = 0;

const mobileLookSensitivity = 0.004;

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
   SMALL CONCRETE BLOCKS
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

    maxY: 1.5,

    minZ:
      z - depth / 2,

    maxZ:
      z + depth / 2
  });
}

createBarrier(
  -17,
  22,
  0
);

createBarrier(
  17,
  22,
  0
);

createBarrier(
  -22,
  -2,
  Math.PI / 2
);

createBarrier(
  22,
  -2,
  Math.PI / 2
);


/* ======================================================
   INDUSTRIAL PILLARS
====================================================== */

function createPillar(
  x,
  z
) {
  const pillar =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.4,
        7,
        1.4
      ),
      metalMaterial
    );

  pillar.position.set(
    x,
    3.5,
    z
  );

  pillar.castShadow = true;

  pillar.receiveShadow = true;

  scene.add(pillar);

  collisionBoxes.push({
    minX:
      x - 0.7,

    maxX:
      x + 0.7,

    minY: 0,

    maxY: 7,

    minZ:
      z - 0.7,

    maxZ:
      z + 0.7
  });
}

createPillar(-20, -25);
createPillar(20, -25);
createPillar(-20, 15);
createPillar(20, 15);


/* ======================================================
   PIPES
====================================================== */

function createPipe(
  x,
  y,
  z,
  length,
  rotationY = 0
) {
  const pipe =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.45,
        0.45,
        length,
        16
      ),
      metalMaterial
    );

  pipe.position.set(
    x,
    y,
    z
  );

  pipe.rotation.z =
    Math.PI / 2;

  pipe.rotation.y =
    rotationY;

  pipe.castShadow = true;

  scene.add(pipe);
}

createPipe(
  -32,
  5.5,
  -17,
  14
);

createPipe(
  32,
  5.5,
  -17,
  14
);

createPipe(
  0,
  6,
  -30,
  24,
  Math.PI / 2
);


/* ======================================================
   STREET LIGHTS
====================================================== */

function createStreetLight(
  x,
  z
) {
  const pole =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.12,
        0.18,
        7,
        10
      ),
      metalMaterial
    );

  pole.position.set(
    x,
    3.5,
    z
  );

  pole.castShadow = true;

  scene.add(pole);

  const lamp =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1,
        0.25,
        0.5
      ),
      metalMaterial
    );

  lamp.position.set(
    x,
    7,
    z
  );

  scene.add(lamp);

  const light =
    new THREE.PointLight(
      0xffc66d,
      2.2,
      20,
      2
    );

  light.position.set(
    x,
    6.7,
    z
  );

  scene.add(light);
}

createStreetLight(-30, -35);
createStreetLight(30, -35);
createStreetLight(-30, 35);
createStreetLight(30, 35);


/* ======================================================
   RED WARNING LIGHTS
====================================================== */

function createWarningLight(
  x,
  y,
  z
) {
  const light =
    new THREE.PointLight(
      0xff2438,
      3,
      12,
      2
    );

  light.position.set(
    x,
    y,
    z
  );

  scene.add(light);

  const bulb =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.18,
        10,
        10
      ),
      new THREE.MeshBasicMaterial({
        color: 0xff2438
      })
    );

  bulb.position.copy(
    light.position
  );

  scene.add(bulb);
}

createWarningLight(
  -49,
  6,
  -49
);

createWarningLight(
  49,
  6,
  -49
);

createWarningLight(
  -49,
  6,
  49
);

createWarningLight(
  49,
  6,
  49
);


/* ======================================================
   MAP DETAIL STRIPES
====================================================== */

function createStripe(
  x,
  z,
  width,
  depth,
  rotation = 0
) {
  const stripe =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        0.025,
        depth
      ),
      warningMaterial
    );

  stripe.position.set(
    x,
    0.025,
    z
  );

  stripe.rotation.y =
    rotation;

  scene.add(stripe);
}

createStripe(-8, -43, 10, 0.35);
createStripe(8, -43, 10, 0.35);
createStripe(-8, 43, 10, 0.35);
createStripe(8, 43, 10, 0.35);


/* ======================================================
   ATMOSPHERE
====================================================== */

scene.fog =
  new THREE.Fog(
    0x080b0f,
    38,
    155
  );


/* ======================================================
   GUN
====================================================== */

const gun =
  new THREE.Group();

const gunBody =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.34,
      0.24,
      0.85
    ),
    new THREE.MeshStandardMaterial({
      color: 0x252a30,
      roughness: 0.36,
      metalness: 0.8
    })
  );

gunBody.position.set(
  0.42,
  -0.31,
  -0.76
);

gun.add(gunBody);

const upper =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.22,
      0.13,
      0.6
    ),
    new THREE.MeshStandardMaterial({
      color: 0x4b5964,
      roughness: 0.3,
      metalness: 0.86
    })
  );

upper.position.set(
  0.42,
  -0.22,
  -0.98
);

gun.add(upper);

const grip =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.18,
      0.48,
      0.23
    ),
    new THREE.MeshStandardMaterial({
      color: 0x111419,
      roughness: 0.78,
      metalness: 0.26
    })
  );

grip.rotation.x =
  -0.28;

grip.position.set(
  0.42,
  -0.53,
  -0.62
);

gun.add(grip);

const gunBarrel =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.045,
      0.06,
      0.72,
      12
    ),
    new THREE.MeshStandardMaterial({
      color: 0x6d7881,
      roughness: 0.25,
      metalness: 0.9
    })
  );

gunBarrel.rotation.x =
  Math.PI / 2;

gunBarrel.position.set(
  0.42,
  -0.28,
  -1.55
);

gun.add(gunBarrel);

const muzzle =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.085,
      0.085,
      0.12,
      12
    ),
    new THREE.MeshStandardMaterial({
      color: 0x111316,
      roughness: 0.2,
      metalness: 0.95
    })
  );

muzzle.rotation.x =
  Math.PI / 2;

muzzle.position.set(
  0.42,
  -0.28,
  -1.91
);

gun.add(muzzle);

const energy =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.07,
      0.06,
      0.55
    ),
    new THREE.MeshBasicMaterial({
      color: 0x00eaff
    })
  );

energy.position.set(
  0.42,
  -0.18,
  -1.03
);

gun.add(energy);

const muzzlePoint =
  new THREE.Object3D();

muzzlePoint.position.set(
  0.42,
  -0.28,
  -1.98
);

gun.add(muzzlePoint);

camera.add(gun);

scene.add(camera);

const muzzleFlash =
  new THREE.PointLight(
    0x44ddff,
    0,
    8,
    2
  );

muzzleFlash.position.set(
  0.42,
  -0.28,
  -2
);

gun.add(muzzleFlash);


/* ======================================================
   GUN VISUALS
====================================================== */

function applyGunVisual() {
  const weapon =
    GUNS[currentGun];

  if (!weapon) {
    return;
  }

  gunBarrel.material.color.setHex(
    weapon.color
  );

  energy.material.color.setHex(
    weapon.color
  );

  muzzleFlash.color.setHex(
    weapon.color
  );

  gunBarrel.scale.z =
    weapon.barrelScale;

  gunValue.textContent =
    weapon.name.toUpperCase();
}


/* ======================================================
   TRACERS
====================================================== */

function createTracer(
  origin,
  direction,
  ownerId
) {
  const group =
    new THREE.Group();

  const core =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.095,
        8,
        8
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffffff
      })
    );

  const glow =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.19,
        8,
        8
      ),
      new THREE.MeshBasicMaterial({
        color: 0x00eaff,
        transparent: true,
        opacity: 0.42
      })
    );

  const trail =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.025,
        0.06,
        0.85,
        8
      ),
      new THREE.MeshBasicMaterial({
        color: 0x25dfff,
        transparent: true,
        opacity: 0.8
      })
    );

  trail.rotation.x =
    Math.PI / 2;

  trail.position.z =
    0.35;

  group.add(core);

  group.add(glow);

  group.add(trail);

  group.position.copy(
    origin
  );

  group.lookAt(
    group.position
      .clone()
      .add(direction)
  );

  scene.add(group);

  projectiles.push({
    mesh: group,

    velocity:
      direction
        .clone()
        .normalize()
        .multiplyScalar(105),

    ownerId,

    age: 0
  });
}


/* ======================================================
   NAME TAG
====================================================== */

function createNameTag(
  username
) {
  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 512;

  canvas.height = 128;

  const ctx =
    canvas.getContext(
      "2d"
    );

  ctx.fillStyle =
    "rgba(3,8,15,0.84)";

  ctx.fillRect(
    20,
    25,
    472,
    78
  );

  ctx.strokeStyle =
    "rgba(0,220,255,0.7)";

  ctx.lineWidth = 4;

  ctx.strokeRect(
    20,
    25,
    472,
    78
  );

  ctx.font =
    "bold 48px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    username,
    256,
    64
  );

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  const sprite =
    new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      })
    );

  sprite.scale.set(
    3.2,
    0.8,
    1
  );

  return sprite;
}


/* ======================================================
   OTHER PLAYER
====================================================== */

function createOtherPlayer(
  id,
  username
) {
  const group =
    new THREE.Group();

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.9,
        1.35,
        0.52
      ),
      new THREE.MeshStandardMaterial({
        color: 0x174e67,
        roughness: 0.62,
        metalness: 0.35
      })
    );

  body.position.y =
    1.15;

  body.castShadow = true;

  group.add(body);

  const chest =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.52,
        0.4,
        0.04
      ),
      new THREE.MeshBasicMaterial({
        color: 0x00dfff
      })
    );

  chest.position.set(
    0,
    1.2,
    -0.285
  );

  group.add(chest);

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.38,
        16,
        16
      ),
      new THREE.MeshStandardMaterial({
        color: 0x6c7f8e,
        roughness: 0.5,
        metalness: 0.5
      })
    );

  head.position.y =
    2.08;

  group.add(head);

  const visor =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.4,
        0.14,
        0.42
      ),
      new THREE.MeshBasicMaterial({
        color: 0xff315a
      })
    );

  visor.position.set(
    0,
    2.08,
    -0.31
  );

  group.add(visor);

  const limbMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x0e171e,
      roughness: 0.73,
      metalness: 0.35
    });

  const leftLeg =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.28,
        0.95,
        0.32
      ),
      limbMaterial
    );

  leftLeg.position.set(
    -0.22,
    0.45,
    0
  );

  group.add(leftLeg);

  const rightLeg =
    leftLeg.clone();

  rightLeg.position.x =
    0.22;

  group.add(rightLeg);

  const leftArm =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.23,
        1,
        0.28
      ),
      limbMaterial
    );

  leftArm.position.set(
    -0.62,
    1.15,
    0
  );

  group.add(leftArm);

  const rightArm =
    leftArm.clone();

  rightArm.position.x =
    0.62;

  group.add(rightArm);

  const tag =
    createNameTag(
      username
    );

  tag.position.set(
    0,
    3.05,
    0
  );

  group.add(tag);

  scene.add(group);

  const remote = {
    id,
    username,
    group,
    targetPosition:
      new THREE.Vector3(),
    targetRotationY: 0
  };

  otherPlayers.set(
    id,
    remote
  );

  return group;
}


/* ======================================================
   INPUT
====================================================== */

window.addEventListener(
  "keydown",
  (event) => {
    if (
      event.code ===
      "KeyW"
    ) {
      movement.forward = true;
    }

    if (
      event.code ===
      "KeyS"
    ) {
      movement.backward = true;
    }

    if (
      event.code ===
      "KeyA"
    ) {
      movement.left = true;
    }

    if (
      event.code ===
      "KeyD"
    ) {
      movement.right = true;
    }

    if (
      event.code ===
      "Space"
    ) {
      if (
        isGrounded &&
        controls.isLocked &&
        playerJoined
      ) {
        verticalVelocity =
          jumpStrength;

        isGrounded = false;
      }
    }

    if (
      event.code ===
      "KeyB"
    ) {
      if (
        playerJoined
      ) {
        if (
          shopPanel.style.display ===
          "block"
        ) {
          closeGunShop();
        } else {
          openGunShop();
        }
      }
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    if (
      event.code ===
      "KeyW"
    ) {
      movement.forward = false;
    }

    if (
      event.code ===
      "KeyS"
    ) {
      movement.backward = false;
    }

    if (
      event.code ===
      "KeyA"
    ) {
      movement.left = false;
    }

    if (
      event.code ===
      "KeyD"
    ) {
      movement.right = false;
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
   MOBILE JOYSTICK
====================================================== */

function resetJoystick() {
  joystickActive = false;
  joystickTouchId = null;

  joystickKnob.style.transform =
    "translate(0px, 0px)";

  movement.forward = false;
  movement.backward = false;
  movement.left = false;
  movement.right = false;
}

function updateJoystick(
  touch
) {
  const rect =
    joystickZone.getBoundingClientRect();

  const centerX =
    rect.left +
    rect.width / 2;

  const centerY =
    rect.top +
    rect.height / 2;

  let dx =
    touch.clientX -
    centerX;

  let dy =
    touch.clientY -
    centerY;

  const maxDistance = 42;

  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  if (
    distance >
    maxDistance
  ) {
    dx =
      (dx / distance) *
      maxDistance;

    dy =
      (dy / distance) *
      maxDistance;
  }

  joystickKnob.style.transform =
    `translate(${dx}px, ${dy}px)`;

  const threshold = 12;

  movement.left =
    dx < -threshold;

  movement.right =
    dx > threshold;

  movement.forward =
    dy < -threshold;

  movement.backward =
    dy > threshold;
}


joystickZone.addEventListener(
  "touchstart",
  (event) => {
    if (!mobileActive) {
      return;
    }

    event.preventDefault();

    const touch =
      event.changedTouches[0];

    joystickActive = true;

    joystickTouchId =
      touch.identifier;

    updateJoystick(touch);
  },
  { passive: false }
);


joystickZone.addEventListener(
  "touchmove",
  (event) => {
    if (
      !joystickActive
    ) {
      return;
    }

    event.preventDefault();

    for (
      const touch of
      event.changedTouches
    ) {
      if (
        touch.identifier ===
        joystickTouchId
      ) {
        updateJoystick(touch);
      }
    }
  },
  { passive: false }
);


joystickZone.addEventListener(
  "touchend",
  (event) => {
    for (
      const touch of
      event.changedTouches
    ) {
      if (
        touch.identifier ===
        joystickTouchId
      ) {
        resetJoystick();
      }
    }
  },
  { passive: false }
);


joystickZone.addEventListener(
  "touchcancel",
  resetJoystick,
  { passive: false }
);

/* ======================================================
   MOBILE CAMERA LOOK
====================================================== */

lookZone.addEventListener(
  "touchstart",
  (event) => {
    if (!mobileActive) {
      return;
    }

    event.preventDefault();

    const touch =
      event.changedTouches[0];

    lookTouchId =
      touch.identifier;

    lastLookX =
      touch.clientX;

    lastLookY =
      touch.clientY;
  },
  { passive: false }
);


lookZone.addEventListener(
  "touchmove",
  (event) => {
    if (
      !mobileActive ||
      lookTouchId === null
    ) {
      return;
    }

    event.preventDefault();

    for (
      const touch of
      event.changedTouches
    ) {
      if (
        touch.identifier !==
        lookTouchId
      ) {
        continue;
      }

      const dx =
        touch.clientX -
        lastLookX;

      const dy =
        touch.clientY -
        lastLookY;

      lastLookX =
        touch.clientX;

      lastLookY =
        touch.clientY;

      camera.rotation.y -=
        dx *
        mobileLookSensitivity;

      camera.rotation.x -=
        dy *
        mobileLookSensitivity;

      const maxPitch =
        Math.PI / 2 - 0.05;

      camera.rotation.x =
        Math.max(
          -maxPitch,
          Math.min(
            maxPitch,
            camera.rotation.x
          )
        );
    }
  },
  { passive: false }
);


lookZone.addEventListener(
  "touchend",
  (event) => {
    for (
      const touch of
      event.changedTouches
    ) {
      if (
        touch.identifier ===
        lookTouchId
      ) {
        lookTouchId = null;
      }
    }
  },
  { passive: false }
);


lookZone.addEventListener(
  "touchcancel",
  () => {
    lookTouchId = null;
  },
  { passive: false }
);

/* ======================================================
   MOBILE BUTTONS
====================================================== */

mobileJump.addEventListener(
  "touchstart",
  (event) => {
    event.preventDefault();

    if (
      mobileActive &&
      isGrounded &&
      playerJoined
    ) {
      verticalVelocity =
        jumpStrength;

      isGrounded = false;
    }
  },
  { passive: false }
);


mobileFire.addEventListener(
  "touchstart",
  (event) => {
    event.preventDefault();

    if (mobileActive) {
      shoot();
    }
  },
  { passive: false }
);


mobileShop.addEventListener(
  "touchstart",
  (event) => {
    event.preventDefault();

    if (
      mobileActive &&
      playerJoined
    ) {
      if (
        shopPanel.style.display ===
        "block"
      ) {
        closeGunShop();
      } else {
        openGunShop();
      }
    }
  },
  { passive: false }
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

function updateMovement(
  delta
) {
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

  if (
    movement.forward
  ) {
    move.z -= 1;
  }

  if (
    movement.backward
  ) {
    move.z += 1;
  }

  if (
    movement.left
  ) {
    move.x -= 1;
  }

  if (
    movement.right
  ) {
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

    if (
      velocity.lengthSq() > 0
    ) {
      velocity.normalize();

      velocity.multiplyScalar(
        20 * delta
      );
    }

    const next =
      camera.position.clone();

    next.x +=
      velocity.x;

    next.z +=
      velocity.z;

    if (
      !collides(next)
    ) {
      camera.position.x =
        next.x;

      camera.position.z =
        next.z;
    }
  }

  /* GRAVITY ALWAYS RUNS */

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

    isGrounded = true;
  }

  networkTimer +=
    delta;

  if (
    networkTimer >=
    0.05
  ) {
    networkTimer = 0;

    socket.emit(
      "playerMove",
      {
        position: {
          x:
            camera.position.x,

          y:
            camera.position.y,

          z:
            camera.position.z
        },

        rotation: {
          x:
            camera.rotation.x,

          y:
            camera.rotation.y,

          z:
            camera.rotation.z
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

    controls.lock();
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
      100
    );

    hitMarker.style.opacity =
      "1";

    setTimeout(
      () => {
        hitMarker.style.opacity =
          "0";
      },
      100
    );

    if (
      health <= 0
    ) {
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
      "none";

    controls.lock();
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

    projectile.mesh.position.add(
      projectile.velocity
        .clone()
        .multiplyScalar(
          delta
        )
    );

    if (
      projectile.age >
        1.4 ||
      Math.abs(
        projectile.mesh.position.x
      ) >
        arenaSize / 2 + 20 ||
      Math.abs(
        projectile.mesh.position.z
      ) >
        arenaSize / 2 + 20
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

animate();
