```js
/* ======================================================
   REALISTIC FPS MAP
====================================================== */

/* ======================================================
   FLOOR
====================================================== */

const floorMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x25292d,
    roughness: 0.92,
    metalness: 0.08
  });

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

floor.receiveShadow =
  true;

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
   MAP MATERIALS
====================================================== */

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

  wall.castShadow =
    true;

  wall.receiveShadow =
    true;

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
   BUILDING HELPER
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

  building.castShadow =
    true;

  building.receiveShadow =
    true;

  scene.add(building);

  // Roof
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

  roof.castShadow =
    true;

  scene.add(roof);

  collisionBoxes.push({
    minX:
      x - width / 2,

    maxX:
      x + width / 2,

    minY:
      0,

    maxY:
      height,

    minZ:
      z - depth / 2,

    maxZ:
      z + depth / 2
  });

  return building;
}


/* ======================================================
   BUILDINGS
====================================================== */

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

createMapBox(
  0,
  3.5,
  -17,
  28,
  7,
  3,
  concreteMaterial
);

createMapBox(
  -14,
  3.5,
  -8,
  3,
  7,
  18,
  concreteMaterial
);

createMapBox(
  14,
  3.5,
  -8,
  3,
  7,
  18,
  concreteMaterial
);


/* ======================================================
   LONG COVER WALLS
====================================================== */

createMapBox(
  -30,
  1.5,
  2,
  14,
  3,
  2,
  concreteMaterial
);

createMapBox(
  30,
  1.5,
  2,
  14,
  3,
  2,
  concreteMaterial
);

createMapBox(
  -7,
  1.5,
  12,
  12,
  3,
  2,
  concreteMaterial
);

createMapBox(
  7,
  1.5,
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

  return createMapBox(
    x,
    (size * scaleY) / 2,
    z,
    size,
    size * scaleY,
    size,
    crateMaterial
  );
}


// Left warehouse crates

createCrate(
  -38,
  -8
);

createCrate(
  -35,
  -8
);

createCrate(
  -38,
  -5
);

createCrate(
  -35,
  -5
);


// Right warehouse crates

createCrate(
  38,
  -8
);

createCrate(
  35,
  -8
);

createCrate(
  38,
  -5
);

createCrate(
  35,
  -5
);


// Front crates

createCrate(
  -10,
  35
);

createCrate(
  -7,
  35
);

createCrate(
  10,
  35
);

createCrate(
  7,
  35
);


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

  body.castShadow =
    true;

  body.receiveShadow =
    true;

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

    minY:
      0,

    maxY:
      1.5,

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

  pillar.castShadow =
    true;

  pillar.receiveShadow =
    true;

  scene.add(pillar);

  collisionBoxes.push({
    minX:
      x - 0.7,

    maxX:
      x + 0.7,

    minY:
      0,

    maxY:
      7,

    minZ:
      z - 0.7,

    maxZ:
      z + 0.7
  });
}

createPillar(
  -20,
  -25
);

createPillar(
  20,
  -25
);

createPillar(
  -20,
  15
);

createPillar(
  20,
  15
);


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

  pipe.castShadow =
    true;

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

  pole.castShadow =
    true;

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

createStreetLight(
  -30,
  -35
);

createStreetLight(
  30,
  -35
);

createStreetLight(
  -30,
  35
);

createStreetLight(
  30,
  35
);


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

createStripe(
  -8,
  -43,
  10,
  0.35
);

createStripe(
  8,
  -43,
  10,
  0.35
);

createStripe(
  -8,
  43,
  10,
  0.35
);

createStripe(
  8,
  43,
  10,
  0.35
);


/* ======================================================
   ATMOSPHERE
====================================================== */

scene.fog =
  new THREE.Fog(
    0x080b0f,
    38,
    155
  );
```
