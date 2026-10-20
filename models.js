// ============================================================
//  Fantasy Quest – Models Module (Organic Low-Poly Characters, Monsters, Weapons, Nature)
// ============================================================

// ==================== NATURE & BIOME PROPS =================
function makeTree(x, z, sc){
    sc = sc || 1;
    const g = new THREE.Group();
    if(window.createContactShadow) g.add(window.createContactShadow(1.8 * sc, 1.8 * sc, 0.42));
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16*sc, 0.28*sc, 2.3*sc, 8), new THREE.MeshStandardMaterial({color:0x543016, roughness:0.85, flatShading:false}));
    trunk.position.y = 1.15*sc; trunk.castShadow = true; g.add(trunk);

    const fc = choice([0x228B22, 0x278742, 0x1d7525, 0x2fa83a]);
    [
        { r:1.25, y:2.6 },
        { r:0.95, y:3.3, ox:0.4, oz:0.3 },
        { r:0.75, y:3.7, ox:-0.3, oz:-0.25 }
    ].forEach(d => {
        const leafGeo = new THREE.SphereGeometry(d.r * sc, 10, 8);
        leafGeo.computeVertexNormals();
        const leaf = new THREE.Mesh(
            leafGeo,
            new THREE.MeshStandardMaterial({color:fc, roughness:0.65, metalness:0.02, flatShading:false})
        );
        leaf.position.set((d.ox || 0)*sc, d.y*sc, (d.oz || 0)*sc);
        leaf.castShadow = true; g.add(leaf);
    });

    g.position.set(x, 0, z); scene.add(g);
    return g;
}

function makeRock(x, z, sc){
    sc = sc || 1;
    const rk = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.58*sc, 1),
        new THREE.MeshStandardMaterial({color: Math.random() > 0.5 ? 0x757575 : 0x626262, roughness:0.9, metalness:0.1, flatShading:true})
    );
    rk.position.set(x, 0.28*sc, z);
    rk.rotation.set(rng(0, 0.5), rng(0, Math.PI), rng(0, 0.5));
    rk.castShadow = true; rk.receiveShadow = true;
    scene.add(rk);
    return rk;
}

// Desert Cacti for Kızıl Çoraklık
function makeCactus(x, z, sc){
    sc = sc || 1;
    const g = new THREE.Group();
    if(window.createContactShadow) g.add(window.createContactShadow(1.0 * sc, 1.0 * sc, 0.40));
    const cMat = new THREE.MeshStandardMaterial({color: 0x4d7528, roughness: 0.8, metalness: 0.05, flatShading: false});

    // Central Stem
    const stemGeo = new THREE.CapsuleGeometry(0.24 * sc, 2.0 * sc, 8, 8);
    stemGeo.computeVertexNormals();
    const stem = new THREE.Mesh(stemGeo, cMat);
    stem.position.y = 1.2 * sc; stem.castShadow = true; g.add(stem);

    // Left Arm
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * sc, 0.12 * sc, 0.7 * sc, 6), cMat);
    armL.rotation.z = Math.PI / 2; armL.position.set(-0.35 * sc, 1.1 * sc, 0); g.add(armL);
    const armLTip = new THREE.Mesh(new THREE.CapsuleGeometry(0.12 * sc, 0.65 * sc, 6, 6), cMat);
    armLTip.position.set(-0.65 * sc, 1.45 * sc, 0); armLTip.castShadow = true; g.add(armLTip);

    // Right Arm
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * sc, 0.12 * sc, 0.6 * sc, 6), cMat);
    armR.rotation.z = Math.PI / 2; armR.position.set(0.32 * sc, 0.85 * sc, 0); g.add(armR);
    const armRTip = new THREE.Mesh(new THREE.CapsuleGeometry(0.12 * sc, 0.55 * sc, 6, 6), cMat);
    armRTip.position.set(0.58 * sc, 1.15 * sc, 0); armRTip.castShadow = true; g.add(armRTip);

    g.position.set(x, 0, z);
    scene.add(g);
    return g;
}

// Desert Canyon Rock
function makeDesertRock(x, z, sc){
    sc = sc || 1;
    const rk = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.7 * sc, 1),
        new THREE.MeshStandardMaterial({color: choice([0xa35a2c, 0xb86c38, 0x944a22]), roughness: 0.92, metalness: 0.08, flatShading: true})
    );
    rk.position.set(x, 0.35 * sc, z);
    rk.rotation.set(rng(0, 0.4), rng(0, Math.PI), rng(0, 0.4));
    rk.castShadow = true; rk.receiveShadow = true;
    scene.add(rk);
    return rk;
}

// Frozen North Ice Spire / Glacier Shard
function makeIceSpire(x, z, sc){
    sc = sc || 1;
    const spireGeo = new THREE.CylinderGeometry(0.08 * sc, 0.52 * sc, 2.6 * sc, 6);
    spireGeo.computeVertexNormals();
    const spire = new THREE.Mesh(
        spireGeo,
        new THREE.MeshStandardMaterial({color: 0x8fe2ff, roughness: 0.18, metalness: 0.35, transparent: true, opacity: 0.82, flatShading: true})
    );
    spire.position.set(x, 1.3 * sc, z);
    spire.rotation.set(rng(-0.15, 0.15), rng(0, Math.PI), rng(-0.15, 0.15));
    spire.castShadow = true;
    scene.add(spire);
    return spire;
}

// Snow-Covered Pine Tree for Donmuş Kuzey
function makeSnowTree(x, z, sc){
    sc = sc || 1;
    const g = new THREE.Group();
    if(window.createContactShadow) g.add(window.createContactShadow(1.8 * sc, 1.8 * sc, 0.42));
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14*sc, 0.24*sc, 2.1*sc, 8), new THREE.MeshStandardMaterial({color:0x3a2517, roughness:0.9}));
    trunk.position.y = 1.05*sc; trunk.castShadow = true; g.add(trunk);

    const snowMat = new THREE.MeshStandardMaterial({color: 0xebf6fa, roughness: 0.6, metalness: 0.1});
    const pineMat = new THREE.MeshStandardMaterial({color: 0x1f4738, roughness: 0.7, metalness: 0.05});

    // Tiered pine foliage with snow on top
    [
        { r: 1.35, h: 1.4, y: 1.9 },
        { r: 1.05, h: 1.3, y: 2.7 },
        { r: 0.75, h: 1.1, y: 3.4 }
    ].forEach(t => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r * sc, t.h * sc, 7), pineMat);
        cone.position.y = t.y * sc; cone.castShadow = true; g.add(cone);
        const snowCap = new THREE.Mesh(new THREE.ConeGeometry((t.r * 0.72) * sc, (t.h * 0.45) * sc, 7), snowMat);
        snowCap.position.y = (t.y + t.h * 0.28) * sc; g.add(snowCap);
    });

    g.position.set(x, 0, z);
    scene.add(g);
    return g;
}

// Volcanic Basalt Hexagonal Column for Karanlık Boşluk
function makeBasaltPillar(x, z, sc){
    sc = sc || 1;
    const h = (1.8 + Math.random() * 2.2) * sc;
    const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38 * sc, 0.45 * sc, h, 6),
        new THREE.MeshStandardMaterial({color: 0x160e15, roughness: 0.85, metalness: 0.25, flatShading: true})
    );
    pillar.position.set(x, h * 0.5, z);
    pillar.rotation.y = rng(0, Math.PI);
    pillar.castShadow = true;
    scene.add(pillar);
    return pillar;
}

// Volcanic Glowing Ground Lava Crack
function makeLavaCrack(x, z, sc){
    sc = sc || 1;
    const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4 * sc, 0.45 * sc),
        new THREE.MeshBasicMaterial({color: 0xff3b00, side: THREE.DoubleSide, transparent: true, opacity: 0.85})
    );
    crack.rotation.x = -Math.PI / 2;
    crack.rotation.z = rng(0, Math.PI);
    crack.position.set(x, 0.035, z);
    scene.add(crack);
    return crack;
}

// 4-Biome Nature Population
(function populateNature(){
    for(let i = 0; i < 210; i++){
        let x, z;
        let attempts = 0;
        do {
            x = rng(-94, 94);
            z = rng(-134, 204);
            attempts++;
            if(attempts > 50) break;
        } while(
            Math.sqrt(x*x + z*z) < 22 || // Village
            Math.abs(z - 60) < 4.5 ||   // Castle Wall
            (Math.abs(x) < 4.2 && z >= 18 && z <= 120) || // South Highway
            (Math.abs(x) < 3.8 && z <= -18 && z >= -48) || // North Road
            (Math.abs(z) < 3.5 && Math.abs(x) < 42) ||    // East/West Roads
            Math.hypot(x - (-50), z - (-10)) < 16 ||      // Ur-Gathok Arena
            Math.hypot(x - 35, z - 92) < 17 ||           // Azrakar Arena
            Math.hypot(x - (-30), z - 148) < 18 ||        // Ymir-Khor Arena
            Math.hypot(x - 0, z - 190) < 20              // Malakor Arena
        );

        const b = getBiomeAt(x, z);
        if(b.id === 'grasslands'){
            if(Math.random() > 0.3) makeTree(x, z, rng(0.7, 1.1));
            else makeRock(x, z, rng(0.5, 1.4));
        }
        else if(b.id === 'badlands'){
            if(Math.random() > 0.45) makeCactus(x, z, rng(0.75, 1.25));
            else makeDesertRock(x, z, rng(0.6, 1.8));
        }
        else if(b.id === 'frozen'){
            if(Math.random() > 0.45) makeSnowTree(x, z, rng(0.75, 1.2));
            else makeIceSpire(x, z, rng(0.7, 1.6));
        }
        else if(b.id === 'volcanic'){
            if(Math.random() > 0.35) makeBasaltPillar(x, z, rng(0.75, 1.4));
            else makeLavaCrack(x, z, rng(0.8, 1.6));
        }
    }

    // Glowing Fireflies hovering in green plains
    const fireflyMat = new THREE.MeshBasicMaterial({color:0xd4ff55});
    for(let i = 0; i < 35; i++){
        const ff = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), fireflyMat);
        ff.position.set(rng(-65, 15), rng(1.0, 3.5), rng(-25, 30));
        ff.userData.baseY = ff.position.y;
        ff.userData.phase = rng(0, Math.PI * 2);
        scene.add(ff);
        G.fireflies.push(ff);
    }
})();

// ==================== PLAYER MODEL & WEAPONS ================
let playerGroup, playerWeapon, playerSlashArc;
let leftLeg, rightLeg, leftArm, rightArm, playerCape, playerTorso;
let playerShield = null, playerStaffOrb = null, playerStaffRing = null, staffOrbLight = null;

function createPlayerWeapon(className, elementKey){
    const g = new THREE.Group();
    const elem = ELEMENTS[elementKey] || ELEMENTS.fire;

    if(className === 'warrior'){
        // Ornate Broadsword with tapered diamond cross-section blade (Zero BoxGeometry)
        const bladeMat = new THREE.MeshStandardMaterial({color:0xe8edf2, roughness:0.22, metalness:0.92, flatShading:false});
        const bladeGeo = new THREE.CylinderGeometry(0.015, 0.08, 1.35, 4);
        bladeGeo.computeVertexNormals();
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.scale.set(1.4, 1.0, 0.28);
        blade.position.y = 0.65; blade.castShadow = true; g.add(blade);

        // Glowing elemental rune channel along the sword blade with central fuller groove
        const runeGeo = new THREE.CylinderGeometry(0.008, 0.038, 1.05, 4);
        runeGeo.computeVertexNormals();
        const runeGlow = new THREE.Mesh(
            runeGeo,
            new THREE.MeshStandardMaterial({
                color: elem.color,
                emissive: elem.color,
                emissiveIntensity: 0.95,
                roughness: 0.2,
                flatShading: false
            })
        );
        runeGlow.scale.set(1.15, 1.0, 0.35);
        runeGlow.position.y = 0.60; g.add(runeGlow);

        // Metallic blade fuller groove (longitudinal indentation)
        const fullerGeo = new THREE.CylinderGeometry(0.005, 0.012, 1.12, 4);
        const fuller = new THREE.Mesh(fullerGeo, new THREE.MeshStandardMaterial({color: 0x1f242b, roughness: 0.4, metalness: 0.85}));
        fuller.scale.set(0.6, 1.0, 0.4);
        fuller.position.set(0, 0.62, 0.03);
        g.add(fuller);

        // Ornate Gold Crossguard with flared wing cones & spherical caps
        const guardMat = new THREE.MeshStandardMaterial({color:0xffd700, roughness:0.25, metalness:0.88, flatShading:false});
        const guardGeo = new THREE.CylinderGeometry(0.045, 0.035, 0.44, 8);
        guardGeo.computeVertexNormals();
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.rotation.z = Math.PI / 2;
        g.add(guard);

        [-0.24, 0.24].forEach(side => {
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 6), guardMat);
            tip.position.set(side, 0.04, 0); tip.rotation.z = side > 0 ? -1.1 : 1.1; g.add(tip);
            const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), guardMat);
            ball.position.set(side * 0.9, 0, 0); g.add(ball);
        });

        // Leather wrapped ribbed cylindrical hilt
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.3, 8), new THREE.MeshStandardMaterial({color:0x3a2010, roughness:0.85, flatShading:false}));
        hilt.position.y = -0.16; g.add(hilt);

        // Gem faceted pommel
        const pommel = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 1), new THREE.MeshStandardMaterial({color: elem.color, emissive: elem.color, emissiveIntensity: 0.7, metalness: 0.8, roughness: 0.2}));
        pommel.position.y = -0.33; g.add(pommel);

        g.position.set(0, -0.55, 0.22);
        g.rotation.x = Math.PI / 4;
    }
    else if(className === 'mage'){
        // Ornate Elderwood Archmage Staff with floating Octahedron crystal & orbital rune ring
        const shaftMat = new THREE.MeshStandardMaterial({color:0x3c2414, roughness:0.8, flatShading:false});
        const shaftLower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.1, 8), shaftMat);
        shaftLower.position.y = 0.55; shaftLower.castShadow = true; g.add(shaftLower);
        const shaftUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.95, 8), shaftMat);
        shaftUpper.position.y = 1.45; shaftUpper.castShadow = true; g.add(shaftUpper);

        // Gold carved spiral band around shaft
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.016, 8, 16), new THREE.MeshStandardMaterial({color:0xffd700, roughness:0.25, metalness:0.9}));
        band.position.y = 1.05; band.rotation.x = Math.PI / 2; g.add(band);

        // Golden 3-claw crown holding the crystal
        const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.05, 0.18, 8), new THREE.MeshStandardMaterial({color:0xffd700, roughness:0.25, metalness:0.9, flatShading:false}));
        crownBase.position.y = 1.95; g.add(crownBase);

        for(let i = 0; i < 3; i++){
            const angle = (i / 3) * Math.PI * 2;
            const claw = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.34, 6), new THREE.MeshStandardMaterial({color:0xffd700, metalness:0.9, roughness:0.25}));
            claw.position.set(Math.cos(angle) * 0.14, 2.12, Math.sin(angle) * 0.14);
            claw.rotation.x = Math.sin(angle) * 0.45;
            claw.rotation.z = -Math.cos(angle) * 0.45;
            g.add(claw);
        }

        // Glowing Floating Octahedron Crystal (flatShading: true on crystal)
        const crystalOrb = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.22, 0),
            new THREE.MeshStandardMaterial({
                color: elem.color,
                emissive: elem.color,
                emissiveIntensity: 1.25,
                roughness: 0.12,
                metalness: 0.2,
                flatShading: true
            })
        );
        crystalOrb.position.y = 2.22; g.add(crystalOrb);
        g.userData.crystalOrb = crystalOrb;

        // Orbiting celestial rune ring and floating crystal shards
        const orbitRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.34, 0.018, 8, 24),
            new THREE.MeshBasicMaterial({color: elem.glowColor, wireframe: false})
        );
        orbitRing.position.y = 2.22;
        orbitRing.rotation.x = Math.PI / 3;
        g.add(orbitRing);
        g.userData.orbitRing = orbitRing;

        // 3 floating hovering crystal shards orbiting the staff
        for(let s = 0; s < 3; s++){
            const shard = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.065, 0),
                new THREE.MeshStandardMaterial({
                    color: elem.glowColor,
                    emissive: elem.glowColor,
                    emissiveIntensity: 1.4,
                    flatShading: true
                })
            );
            const sAng = (s / 3) * Math.PI * 2;
            shard.position.set(Math.cos(sAng) * 0.44, 2.22, Math.sin(sAng) * 0.44);
            g.add(shard);
        }

        staffOrbLight = new THREE.PointLight(elem.color, 1.5, 9);
        staffOrbLight.position.y = 2.22; g.add(staffOrbLight);
        g.userData.staffLight = staffOrbLight;

        g.position.set(0, -0.4, 0.12);
        g.rotation.x = Math.PI / 8;
    }
    else if(className === 'archer'){
        // Detailed Recurve Composite Bow using TorusGeometry arc per instructions!
        const woodMat = new THREE.MeshStandardMaterial({color:0x5e3314, roughness:0.7, flatShading:false});
        const goldMat = new THREE.MeshStandardMaterial({color:0xffd700, roughness:0.3, metalness:0.85, flatShading:false});
        const bowCurve = new THREE.Group();

        // Authentic Curved Bow Limb using TorusGeometry arc!
        const limbGeo = new THREE.TorusGeometry(0.68, 0.034, 8, 24, Math.PI * 0.76);
        limbGeo.computeVertexNormals();
        const bowLimb = new THREE.Mesh(limbGeo, woodMat);
        bowLimb.rotation.z = -Math.PI * 0.38;
        bowLimb.position.set(0, 0, 0.12);
        bowCurve.add(bowLimb);

        // Golden ornate tips
        [[-0.56, 0.44], [-0.56, -0.44]].forEach(([tx, ty]) => {
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.18, 6), goldMat);
            tip.position.set(0, ty, tx);
            tip.rotation.x = ty > 0 ? -0.7 : 0.7;
            bowCurve.add(tip);
        });

        // Ergonomic leather center grip
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.045, 0.22, 8), goldMat);
        handle.position.set(0, 0, 0.12);
        bowCurve.add(handle);

        // White drawn bowstring
        const str = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1.42, 4), new THREE.MeshBasicMaterial({color:0xffffff}));
        str.position.set(0, 0, -0.28); bowCurve.add(str);

        // Nocked Arrow with glowing element arrowhead
        const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.08, 6), new THREE.MeshStandardMaterial({color:0xced4da, metalness:0.7, roughness:0.3, flatShading:false}));
        arrowShaft.position.set(0, 0, 0.22); arrowShaft.rotation.x = Math.PI / 2; bowCurve.add(arrowShaft);

        const arrowTip = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.18, 5), new THREE.MeshStandardMaterial({
            color: elem.color,
            emissive: elem.color,
            emissiveIntensity: 1.0,
            metalness: 0.9,
            flatShading: false
        }));
        arrowTip.position.set(0, 0, 0.80); arrowTip.rotation.x = Math.PI / 2; bowCurve.add(arrowTip);

        bowCurve.castShadow = true; g.add(bowCurve);

        g.position.set(0, -0.35, 0.26);
        g.rotation.y = Math.PI / 6;
        g.rotation.x = Math.PI / 4;
    }

    return g;
}

function buildCompleteCharacter(className, elementKey, isPreview = false){
    const root = new THREE.Group();
    const cls = CLASSES[className] || CLASSES.warrior;
    const elem = ELEMENTS[elementKey] || ELEMENTS.fire;

    // Organic materials with soft shading
    const torsoMat = new THREE.MeshStandardMaterial({color: cls.tunicColor, roughness: 0.55, metalness: 0.15, flatShading: false});
    const skinMat = new THREE.MeshStandardMaterial({color: 0xf5c99e, roughness: 0.60, flatShading: false});
    const leatherMat = new THREE.MeshStandardMaterial({color: 0x422614, roughness: 0.70, metalness: 0.1, flatShading: false});
    const goldMat = new THREE.MeshStandardMaterial({color: 0xffd700, roughness: 0.25, metalness: 0.90, flatShading: false});

    // Anatomical Torso: Athletic Capsule Chest & Tapered Cylinder Abdomen
    const chestGeo = new THREE.CapsuleGeometry(0.32, 0.36, 8, 12);
    chestGeo.computeVertexNormals();
    const chest = new THREE.Mesh(chestGeo, torsoMat);
    chest.scale.set(1.18, 1.0, 0.72);
    chest.position.y = 1.55; chest.castShadow = true; root.add(chest);

    const abdomenGeo = new THREE.CylinderGeometry(0.32, 0.27, 0.40, 12);
    abdomenGeo.computeVertexNormals();
    const abdomen = new THREE.Mesh(abdomenGeo, torsoMat);
    abdomen.position.y = 1.14; abdomen.castShadow = true; root.add(abdomen);

    // Leather belt with gold lion buckle
    const beltGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.14, 14);
    beltGeo.computeVertexNormals();
    const belt = new THREE.Mesh(beltGeo, leatherMat);
    belt.position.y = 0.94; root.add(belt);

    const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.024, 8, 16), goldMat);
    buckle.position.set(0, 0.94, 0.28); root.add(buckle);

    // Neck & Head
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.18, 8);
    neckGeo.computeVertexNormals();
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.90; root.add(neck);

    const headGeo = new THREE.SphereGeometry(0.24, 14, 12);
    headGeo.computeVertexNormals();
    const head = new THREE.Mesh(headGeo, skinMat);
    head.scale.set(0.92, 1.06, 0.96);
    head.position.y = 2.15; head.castShadow = true; root.add(head);

    // Eyes with soft curves
    [-0.10, 0.10].forEach(s => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), new THREE.MeshBasicMaterial({color: 0x1b2838}));
        eye.position.set(s, 2.18, 0.23); root.add(eye);
    });

    let shieldMesh = null;

    // ==================== WARRIOR EQUIPMENT ====================
    if(className === 'warrior'){
        const plateMat = new THREE.MeshStandardMaterial({color: 0xc8d0d8, roughness: 0.22, metalness: 0.88, flatShading: false});
        
        // Sculpted Knight Breastplate
        const breastPlateGeo = new THREE.CapsuleGeometry(0.33, 0.36, 8, 12);
        breastPlateGeo.computeVertexNormals();
        const breastPlate = new THREE.Mesh(breastPlateGeo, plateMat);
        breastPlate.scale.set(1.22, 1.0, 0.78);
        breastPlate.position.set(0, 1.56, 0.02); breastPlate.castShadow = true; root.add(breastPlate);

        // Gold gorget collar
        const gorget = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16), goldMat);
        gorget.position.set(0, 1.84, 0); gorget.rotation.x = Math.PI / 2; root.add(gorget);

        // Gold heraldic crest
        const crest = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.45, roughness: 0.2, metalness: 0.9}));
        crest.position.set(0, 1.62, 0.26); root.add(crest);

        // Spherical Curved Pauldrons with Gold Trim Ring
        [-0.52, 0.52].forEach(side => {
            const pauldronGeo = new THREE.SphereGeometry(0.24, 10, 8);
            pauldronGeo.computeVertexNormals();
            const pauldron = new THREE.Mesh(pauldronGeo, plateMat);
            pauldron.position.set(side, 1.84, 0); pauldron.castShadow = true; root.add(pauldron);

            const pTrim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 16), goldMat);
            pTrim.position.set(side, 1.76, 0); pTrim.rotation.x = Math.PI / 2; root.add(pTrim);
        });

        // Visored Knight Helmet with Dome & Crimson Plume
        const helmGeo = new THREE.SphereGeometry(0.29, 14, 12);
        helmGeo.computeVertexNormals();
        const helm = new THREE.Mesh(helmGeo, plateMat);
        helm.scale.set(0.98, 1.05, 1.02);
        helm.position.set(0, 2.22, 0); helm.castShadow = true; root.add(helm);

        const visor = new THREE.Mesh(
            new THREE.CylinderGeometry(0.27, 0.27, 0.08, 12, 1, false, -Math.PI * 0.35, Math.PI * 0.7),
            new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.35})
        );
        visor.position.set(0, 2.22, 0.03); root.add(visor);

        // Sweeping Knight Plume
        const plume = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.52, 8), new THREE.MeshStandardMaterial({color: 0xb31929, roughness: 0.6, flatShading: false}));
        plume.position.set(0, 2.58, -0.15); plume.rotation.x = -0.6; root.add(plume);

        // Tassets (Thigh Armor Plates)
        [-0.24, 0.24].forEach(side => {
            const tasset = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.28, 8, 1, false, 0, Math.PI), plateMat);
            tasset.position.set(side, 0.78, 0.16); tasset.rotation.y = side > 0 ? 0.3 : -0.3; root.add(tasset);
        });

        // Curved Heraldic Kite Shield
        shieldMesh = new THREE.Group();
        const shieldWoodGeo = new THREE.SphereGeometry(0.52, 12, 10);
        shieldWoodGeo.computeVertexNormals();
        const shieldWood = new THREE.Mesh(shieldWoodGeo, new THREE.MeshStandardMaterial({color: 0x7a1818, roughness: 0.65, flatShading: false}));
        shieldWood.scale.set(0.85, 1.35, 0.18);
        shieldMesh.add(shieldWood);

        const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 8, 20), plateMat);
        shieldRim.scale.set(0.85, 1.35, 1.0);
        shieldMesh.add(shieldRim);

        const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshStandardMaterial({color: elem.color, emissive: elem.color, emissiveIntensity: 0.85, metalness: 0.85}));
        shieldBoss.position.z = 0.12; shieldMesh.add(shieldBoss);
        shieldMesh.position.set(0, -0.32, 0.18);
        shieldMesh.rotation.y = -Math.PI / 4;

        // Warrior Leather Scabbard mounted on hip
        const scabbardMat = new THREE.MeshStandardMaterial({color: 0x331e12, roughness: 0.75, metalness: 0.2});
        const scabbard = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 1.25, 6), scabbardMat);
        scabbard.position.set(-0.38, 1.05, -0.15);
        scabbard.rotation.z = -0.45;
        scabbard.rotation.x = 0.25;
        root.add(scabbard);
        const scabbardLocket = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.14, 6), goldMat);
        scabbardLocket.position.set(-0.38, 1.58, -0.15);
        scabbardLocket.rotation.z = -0.45;
        root.add(scabbardLocket);
    }
    // ==================== MAGE EQUIPMENT ====================
    else if(className === 'mage'){
        const robeMat = new THREE.MeshStandardMaterial({color: cls.tunicColor, roughness: 0.75, flatShading: false});
        
        // Flowing Robe Skirt with gold hem
        const robeGeo = new THREE.CylinderGeometry(0.36, 0.64, 0.98, 14);
        robeGeo.computeVertexNormals();
        const robe = new THREE.Mesh(robeGeo, robeMat);
        robe.position.y = 0.84; robe.castShadow = true; root.add(robe);

        const robeHem = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.035, 8, 18), goldMat);
        robeHem.position.y = 0.38; robeHem.rotation.x = Math.PI / 2; root.add(robeHem);

        // Spellbook / Grimoire on belt
        const book = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.28, 8), new THREE.MeshStandardMaterial({color: 0x4a1820, roughness: 0.75, flatShading: false}));
        book.position.set(-0.36, 0.85, 0.08); book.rotation.z = 0.15; root.add(book);

        // Archmage Cowl & Wizard Hat
        const hatGroup = new THREE.Group();
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.035, 16), robeMat);
        hatBrim.position.y = 2.45; hatGroup.add(hatBrim);

        const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.95, 14), robeMat);
        hatCone.position.set(0, 2.88, -0.09); hatCone.rotation.x = -0.22; hatCone.castShadow = true; hatGroup.add(hatCone);

        const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 16), goldMat);
        hatBand.position.y = 2.49; hatBand.rotation.x = Math.PI / 2; hatGroup.add(hatBand);

        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), new THREE.MeshStandardMaterial({color: elem.color, emissive: elem.color, emissiveIntensity: 1.1, flatShading: true}));
        gem.position.set(0, 2.50, 0.34); hatGroup.add(gem);
        root.add(hatGroup);
    }
    // ==================== ARCHER EQUIPMENT ====================
    else if(className === 'archer'){
        const mantleMat = new THREE.MeshStandardMaterial({color: 0x1f4a33, roughness: 0.75, flatShading: false});
        
        // Quilted Gambeson & Leather Brigandine
        const vestGeo = new THREE.CapsuleGeometry(0.34, 0.38, 8, 12);
        vestGeo.computeVertexNormals();
        const vest = new THREE.Mesh(vestGeo, mantleMat);
        vest.scale.set(1.18, 1.0, 0.74);
        vest.position.set(0, 1.55, 0.01); vest.castShadow = true; root.add(vest);

        // Ranger Hooded Cowl with Eagle Feather & Face Mask
        const cowlGeo = new THREE.SphereGeometry(0.28, 12, 10);
        cowlGeo.computeVertexNormals();
        const cowl = new THREE.Mesh(cowlGeo, mantleMat);
        cowl.scale.set(1.02, 1.1, 1.08);
        cowl.position.set(0, 2.28, -0.02); root.add(cowl);

        const faceMask = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.16, 10, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({color: 0x182e1c, roughness: 0.85}));
        faceMask.position.set(0, 2.10, 0.14); root.add(faceMask);

        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.38, 5), new THREE.MeshStandardMaterial({color: 0x2d6a4f, roughness: 0.6, flatShading: false}));
        feather.position.set(-0.24, 2.48, -0.05); feather.rotation.z = 0.45; root.add(feather);

        // Cross-Chest Quiver with Fletched Arrows
        const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.95, 8), leatherMat);
        quiver.position.set(-0.18, 1.48, -0.34); quiver.rotation.z = -0.35; root.add(quiver);
        [-0.06, 0, 0.06].forEach(ox => {
            const arr = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.52, 6), new THREE.MeshStandardMaterial({color: 0xdedede}));
            arr.position.set(-0.26 + ox, 2.05, -0.34); arr.rotation.z = -0.35; root.add(arr);
            const fletch = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 4), new THREE.MeshStandardMaterial({color: 0x3d7055, roughness: 0.6}));
            fletch.position.set(-0.26 + ox, 2.24, -0.34); fletch.rotation.z = -0.35; root.add(fletch);
        });
    }

    // Articulated Arms with Elbow Cops & Gauntlet Knuckle Contours
    const knuckleMat = new THREE.MeshStandardMaterial({color: 0x2b3038, metalness: 0.85, roughness: 0.3});
    const elbowCopMat = new THREE.MeshStandardMaterial({color: 0x48505e, metalness: 0.75, roughness: 0.35});

    const armL = new THREE.Group();
    armL.position.set(-0.52, 1.62, 0);
    const laUpperGeo = new THREE.CapsuleGeometry(0.11, 0.22, 6, 10);
    laUpperGeo.computeVertexNormals();
    const laUpper = new THREE.Mesh(laUpperGeo, torsoMat);
    laUpper.position.y = -0.16; laUpper.castShadow = true; armL.add(laUpper);

    // Articulated Elbow Cop
    const laElbow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), elbowCopMat);
    laElbow.position.set(0, -0.32, -0.04); armL.add(laElbow);

    const laForearmGeo = new THREE.CapsuleGeometry(0.115, 0.24, 6, 10);
    laForearmGeo.computeVertexNormals();
    const laForearm = new THREE.Mesh(laForearmGeo, leatherMat);
    laForearm.position.y = -0.46; laForearm.castShadow = true; armL.add(laForearm);

    const laHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    laHand.position.y = -0.66; armL.add(laHand);

    // Gauntlet knuckle plate contour
    const laKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.06), knuckleMat);
    laKnuckle.position.set(0, -0.68, 0.04); armL.add(laKnuckle);

    if(shieldMesh) armL.add(shieldMesh);
    root.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.52, 1.62, 0);
    const raUpperGeo = new THREE.CapsuleGeometry(0.11, 0.22, 6, 10);
    raUpperGeo.computeVertexNormals();
    const raUpper = new THREE.Mesh(raUpperGeo, torsoMat);
    raUpper.position.y = -0.16; raUpper.castShadow = true; armR.add(raUpper);

    // Articulated Elbow Cop
    const raElbow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), elbowCopMat);
    raElbow.position.set(0, -0.32, -0.04); armR.add(raElbow);

    const raForearmGeo = new THREE.CapsuleGeometry(0.115, 0.24, 6, 10);
    raForearmGeo.computeVertexNormals();
    const raForearm = new THREE.Mesh(raForearmGeo, leatherMat);
    raForearm.position.y = -0.46; raForearm.castShadow = true; armR.add(raForearm);

    const raHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    raHand.position.y = -0.66; armR.add(raHand);

    // Gauntlet knuckle plate contour
    const raKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.06), knuckleMat);
    raKnuckle.position.set(0, -0.68, 0.04); armR.add(raKnuckle);

    const weapon = createPlayerWeapon(className, elementKey);
    armR.add(weapon);
    root.add(armR);

    // Legs & Boots using CapsuleGeometry
    const legL = new THREE.Group();
    legL.position.set(-0.20, 0.88, 0);
    const llThighGeo = new THREE.CapsuleGeometry(0.12, 0.26, 6, 10);
    llThighGeo.computeVertexNormals();
    const llThigh = new THREE.Mesh(llThighGeo, new THREE.MeshStandardMaterial({color: 0x222633, roughness: 0.65, flatShading: false}));
    llThigh.position.y = -0.22; llThigh.castShadow = true; legL.add(llThigh);

    const llBootGeo = new THREE.CapsuleGeometry(0.13, 0.28, 6, 10);
    llBootGeo.computeVertexNormals();
    const llBoot = new THREE.Mesh(llBootGeo, leatherMat);
    llBoot.position.set(0, -0.56, 0.02); llBoot.castShadow = true; legL.add(llBoot);

    const llFoot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), leatherMat);
    llFoot.position.set(0, -0.74, 0.08); legL.add(llFoot);
    root.add(legL);

    const legR = new THREE.Group();
    legR.position.set(0.20, 0.88, 0);
    const rlThighGeo = new THREE.CapsuleGeometry(0.12, 0.26, 6, 10);
    rlThighGeo.computeVertexNormals();
    const rlThigh = new THREE.Mesh(rlThighGeo, new THREE.MeshStandardMaterial({color: 0x222633, roughness: 0.65, flatShading: false}));
    rlThigh.position.y = -0.22; rlThigh.castShadow = true; legR.add(rlThigh);

    const rlBootGeo = new THREE.CapsuleGeometry(0.13, 0.28, 6, 10);
    rlBootGeo.computeVertexNormals();
    const rlBoot = new THREE.Mesh(rlBootGeo, leatherMat);
    rlBoot.position.set(0, -0.56, 0.02); rlBoot.castShadow = true; legR.add(rlBoot);

    const rlFoot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), leatherMat);
    rlFoot.position.set(0, -0.74, 0.08); legR.add(rlFoot);
    root.add(legR);

    // Flowing Cape
    const capeColor = className === 'warrior' ? 0x941c1c : className === 'mage' ? 0x1f224a : 0x1b4028;
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.05), new THREE.MeshStandardMaterial({color: capeColor, side: THREE.DoubleSide, roughness: 0.7, flatShading: false}));
    cape.position.set(0, 1.36, -0.26); cape.castShadow = true; root.add(cape);

    // Dynamic Crescent Sword Slash Arc (Luminous Sweep Trail)
    const arcGeo = new THREE.RingGeometry(1.15, 2.35, 32, 1, 0, Math.PI * 0.75);
    const arcMat = new THREE.MeshBasicMaterial({
        color: elem.glowColor || elem.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const slashArc = new THREE.Mesh(arcGeo, arcMat);
    slashArc.position.set(0, 1.25, 0.3);
    slashArc.rotation.x = Math.PI / 2;

    const innerArcGeo = new THREE.RingGeometry(1.45, 1.95, 32, 1, 0, Math.PI * 0.75);
    const innerArcMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const innerSlashArc = new THREE.Mesh(innerArcGeo, innerArcMat);
    innerSlashArc.position.z = 0.01;
    slashArc.add(innerSlashArc);
    slashArc.userData.innerArc = innerSlashArc;

    root.add(slashArc);

    root.userData = {
        leftArm: armL,
        rightArm: armR,
        leftLeg: legL,
        rightLeg: legR,
        torso: chest,
        head: head,
        cape: cape,
        weapon: weapon,
        shield: shieldMesh,
        staffOrb: weapon ? weapon.userData.crystalOrb : null,
        staffRing: weapon ? weapon.userData.orbitRing : null,
        staffLight: weapon ? weapon.userData.staffLight : null,
        slashArc: slashArc
    };

    return root;
}

function rebuildPlayerCharacter(className, elementKey){
    if(!playerGroup){
        playerGroup = new THREE.Group();
        scene.add(playerGroup);
    } else {
        while(playerGroup.children.length > 0){
            playerGroup.remove(playerGroup.children[0]);
        }
    }

    const charMesh = buildCompleteCharacter(className, elementKey, false);
    playerGroup.add(charMesh);

    // Wire global animation references
    leftLeg = charMesh.userData.leftLeg;
    rightLeg = charMesh.userData.rightLeg;
    leftArm = charMesh.userData.leftArm;
    rightArm = charMesh.userData.rightArm;
    playerCape = charMesh.userData.cape;
    playerTorso = charMesh.userData.torso;
    playerWeapon = charMesh.userData.weapon;
    playerShield = charMesh.userData.shield;
    playerStaffOrb = charMesh.userData.staffOrb;
    playerStaffRing = charMesh.userData.staffRing;
    staffOrbLight = charMesh.userData.staffLight;
    playerSlashArc = charMesh.userData.slashArc;

    playerGroup.position.set(0, 0, 6);
    playerGroup.rotation.y = Math.PI;

    // Update window references
    window.playerGroup = playerGroup;
    window.leftLeg = leftLeg;
    window.rightLeg = rightLeg;
    window.leftArm = leftArm;
    window.rightArm = rightArm;
    window.playerCape = playerCape;
    window.playerTorso = playerTorso;
    window.playerWeapon = playerWeapon;
    window.playerShield = playerShield;
    window.playerStaffOrb = playerStaffOrb;
    window.playerStaffRing = playerStaffRing;
    window.staffOrbLight = staffOrbLight;
    window.playerSlashArc = playerSlashArc;
}

// Initial Build
rebuildPlayerCharacter('warrior', 'fire');

// ==================== MONSTER MODELS ========================
function monsterModel(type){
    const d = MON[type], s = d.sz, g = new THREE.Group();
    const mat = (c, r=0.55, m=0.15) => new THREE.MeshStandardMaterial({color:c, roughness:r, metalness:m, flatShading:false});

    if(type === 'slime'){
        // Translucent shiny organic jelly slime with inner core
        const slimeGeo = new THREE.SphereGeometry(s, 16, 14);
        slimeGeo.computeVertexNormals();
        const body = new THREE.Mesh(slimeGeo, new THREE.MeshStandardMaterial({
            color: d.color,
            roughness: 0.10,
            metalness: 0.15,
            transparent: true,
            opacity: 0.85,
            flatShading: false
        }));
        body.scale.y = 0.72; body.position.y = s * 0.72; body.castShadow = true; g.add(body);
        g.userData.slimeBody = body;

        // Glowing nucleus core inside
        const coreGeo = new THREE.SphereGeometry(s * 0.36, 10, 10);
        coreGeo.computeVertexNormals();
        const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({color: 0xaaffaa}));
        core.position.y = s * 0.72; g.add(core);
        g.userData.slimeCore = core;

        // Expressive spherical eyes
        [-0.22, 0.22].forEach(side => {
            const ew = new THREE.Mesh(new THREE.SphereGeometry(s * 0.16, 10, 8), new THREE.MeshBasicMaterial({color:0xffffff}));
            ew.position.set(side * s, s * 0.82, s * 0.62); g.add(ew);
            const ep = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 8, 8), new THREE.MeshBasicMaterial({color:0x111111}));
            ep.position.set(side * s, s * 0.82, s * 0.74); g.add(ep);
        });
    }
    else if(type === 'boar'){
        // Organic Capsule Body
        const bodyGeo = new THREE.CapsuleGeometry(s * 0.46, s * 0.88, 8, 12);
        bodyGeo.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeo, mat(d.color, 0.75));
        body.rotation.x = Math.PI / 2;
        body.position.y = s * 0.62; body.castShadow = true; g.add(body);

        // Dark bristled spine ridge
        const spineGeo = new THREE.CylinderGeometry(s * 0.08, s * 0.14, s * 1.05, 8);
        spineGeo.computeVertexNormals();
        const spine = new THREE.Mesh(spineGeo, mat(0x3a1e0b, 0.85));
        spine.rotation.x = Math.PI / 2;
        spine.position.set(0, s * 1.05, -s * 0.05); g.add(spine);

        const hd = new THREE.Group();
        hd.position.set(0, s * 0.65, s * 0.85);

        // Tapered organic head
        const hdGeo = new THREE.CylinderGeometry(s * 0.26, s * 0.38, s * 0.65, 10);
        hdGeo.computeVertexNormals();
        const hdMesh = new THREE.Mesh(hdGeo, mat(d.color, 0.75));
        hdMesh.rotation.x = Math.PI / 2;
        hdMesh.castShadow = true; hd.add(hdMesh);

        // Tapered snout
        const snGeo = new THREE.CylinderGeometry(s * 0.16, s * 0.22, s * 0.28, 10);
        snGeo.computeVertexNormals();
        const sn = new THREE.Mesh(snGeo, mat(0xcca377, 0.7));
        sn.rotation.x = Math.PI / 2;
        sn.position.set(0, -s * 0.08, s * 0.42); hd.add(sn);

        // Curved Ivory Tusks (TorusGeometry slice with cone tips)
        const tuskMat = new THREE.MeshStandardMaterial({color:0xfffff0, roughness:0.25, metalness:0.3, flatShading:false});
        [-0.22, 0.22].forEach(side => {
            const tuskArc = new THREE.Mesh(new THREE.TorusGeometry(s * 0.18, s * 0.038, 8, 14, Math.PI * 0.5), tuskMat);
            tuskArc.position.set(side * s, -s * 0.14, s * 0.36);
            tuskArc.rotation.z = side > 0 ? 0.35 : -0.35;
            tuskArc.rotation.y = side > 0 ? 0.4 : -0.4;
            hd.add(tuskArc);

            const tuskTip = new THREE.Mesh(new THREE.ConeGeometry(s * 0.045, s * 0.12, 6), tuskMat);
            tuskTip.position.set(side * s * 1.15, s * 0.02, s * 0.42);
            tuskTip.rotation.x = -0.5;
            hd.add(tuskTip);
        });

        // Pointed ears
        [-0.22, 0.22].forEach(side => {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.22, 6), mat(d.color));
            ear.position.set(side * s, s * 0.32, -s * 0.08); ear.rotation.z = side > 0 ? -0.4 : 0.4; hd.add(ear);
        });

        g.add(hd);
        g.userData.head = hd;

        // 4 Articulated Capsule Legs
        const legs = [];
        [[-0.32, -0.45], [0.32, -0.45], [-0.32, 0.45], [0.32, 0.45]].forEach(([lx, lz]) => {
            const leg = new THREE.Group();
            leg.position.set(lx * s, s * 0.4, lz * s);
            const legGeo = new THREE.CapsuleGeometry(s * 0.09, s * 0.38, 6, 8);
            legGeo.computeVertexNormals();
            const legMesh = new THREE.Mesh(legGeo, mat(d.color));
            legMesh.position.y = -s * 0.19; legMesh.castShadow = true; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;

        const tail = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.03, s * 0.05, s * 0.35, 6), mat(d.color));
        tail.position.set(0, s * 0.75, -s * 0.85); tail.rotation.x = -0.8; g.add(tail);
        g.userData.tail = tail;
    }
    else if(type === 'wolf'){
        // Lean athletic capsule wolf body
        const bodyGeo = new THREE.CapsuleGeometry(s * 0.32, s * 1.15, 8, 12);
        bodyGeo.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeo, mat(d.color, 0.70));
        body.rotation.x = Math.PI / 2;
        body.position.y = s * 0.70; body.castShadow = true; g.add(body);

        const hd = new THREE.Group();
        hd.position.set(0, s * 0.90, s * 0.95);

        // Sculpted canine head
        const hdGeo = new THREE.SphereGeometry(s * 0.28, 10, 8);
        hdGeo.computeVertexNormals();
        const hdMesh = new THREE.Mesh(hdGeo, mat(d.color, 0.70));
        hdMesh.scale.set(0.9, 0.95, 1.15);
        hdMesh.castShadow = true; hd.add(hdMesh);

        // Tapered cone snout
        const sn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.16, s * 0.48, 8), mat(0x202830, 0.8));
        sn.rotation.x = Math.PI / 2;
        sn.position.set(0, -s * 0.06, s * 0.38); hd.add(sn);

        // Pointed Predator Ears
        [-0.15, 0.15].forEach(side => {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(s * 0.09, s * 0.32, 6), mat(d.color));
            ear.position.set(side * s, s * 0.28, -s * 0.05); hd.add(ear);
        });

        // Glowing red eyes
        [-0.12, 0.12].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.065, 8, 8), new THREE.MeshBasicMaterial({color:0xff1800}));
            ey.position.set(side * s, s * 0.08, s * 0.22); hd.add(ey);
        });

        g.add(hd);
        g.userData.head = hd;

        // Long Bushy Tail
        const tail = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.8, 8), mat(d.color));
        tail.position.set(0, s * 0.75, -s * 1.05); tail.rotation.x = -Math.PI / 3; g.add(tail);
        g.userData.tail = tail;

        // 4 Articulated Slender Capsule Legs
        const legs = [];
        [[-0.24, -0.55], [0.24, -0.55], [-0.24, 0.55], [0.24, 0.55]].forEach(([lx, lz]) => {
            const leg = new THREE.Group();
            leg.position.set(lx * s, s * 0.45, lz * s);
            const legGeo = new THREE.CapsuleGeometry(s * 0.07, s * 0.46, 6, 8);
            legGeo.computeVertexNormals();
            const legMesh = new THREE.Mesh(legGeo, mat(d.color));
            legMesh.position.y = -s * 0.23; legMesh.castShadow = true; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'troll'){
        // Massive Muscular Troll Body: Spherical Upper Chest & Tapered Abdomen
        const chestGeo = new THREE.SphereGeometry(s * 0.72, 12, 10);
        chestGeo.computeVertexNormals();
        const chest = new THREE.Mesh(chestGeo, mat(d.color, 0.85));
        chest.scale.set(1.22, 0.95, 0.85);
        chest.position.y = s * 1.45; chest.castShadow = true; g.add(chest);

        const abdomenGeo = new THREE.CylinderGeometry(s * 0.62, s * 0.46, s * 0.85, 10);
        abdomenGeo.computeVertexNormals();
        const abdomen = new THREE.Mesh(abdomenGeo, mat(d.color, 0.85));
        abdomen.position.y = s * 0.95; abdomen.castShadow = true; g.add(abdomen);
        g.userData.body = chest;

        // Rocky crags on back
        const rockHump = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.42, 0), new THREE.MeshStandardMaterial({color: 0x354823, roughness: 0.95, flatShading: true}));
        rockHump.position.set(0, s * 1.65, -s * 0.42); g.add(rockHump);

        const hd = new THREE.Group();
        hd.position.set(0, s * 2.15, 0.12);
        const hdGeo = new THREE.SphereGeometry(s * 0.44, 10, 10);
        hdGeo.computeVertexNormals();
        const hdMesh = new THREE.Mesh(hdGeo, mat(0x384c26, 0.85));
        hdMesh.castShadow = true; hd.add(hdMesh);

        // Jutting lower jaw & tusks
        const jaw = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.24, s * 0.28, s * 0.28, 8), mat(0x2f421e, 0.85));
        jaw.position.set(0, -s * 0.22, s * 0.22); hd.add(jaw);
        [-0.12, 0.12].forEach(side => {
            const tk = new THREE.Mesh(new THREE.ConeGeometry(s * 0.05, s * 0.18, 5), new THREE.MeshStandardMaterial({color:0xeee8d5, roughness:0.4}));
            tk.position.set(side * s, -s * 0.12, s * 0.36); tk.rotation.x = -Math.PI / 4; hd.add(tk);
        });

        // Glowing amber eyes under heavy brow
        [-0.14, 0.14].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 8, 8), new THREE.MeshBasicMaterial({color:0xffcc00}));
            ey.position.set(side * s, 0, s * 0.4); hd.add(ey);
        });
        g.add(hd);
        g.userData.head = hd;

        // Massive muscular arms (CapsuleGeometry & Spheres)
        const armL = new THREE.Group();
        armL.position.set(-s * 0.85, s * 1.8, 0);
        const armLUpper = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.18, s * 0.65, 8, 8), mat(d.color));
        armLUpper.position.y = -s * 0.38; armLUpper.castShadow = true; armL.add(armLUpper);
        const fist = new THREE.Mesh(new THREE.SphereGeometry(s * 0.26, 8, 8), mat(d.color));
        fist.position.y = -s * 0.85; armL.add(fist);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 0.85, s * 1.8, 0);
        const armRUpper = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.18, s * 0.65, 8, 8), mat(d.color));
        armRUpper.position.y = -s * 0.38; armRUpper.castShadow = true; armR.add(armRUpper);

        // Giant Spiked Wooden War Club
        const club = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.12, s * 0.28, s * 1.8, 8), mat(0x45250e, 0.85));
        shaft.position.y = s * 0.4; shaft.castShadow = true; club.add(shaft);
        for(let sp = 0; sp < 6; sp++){
            const spikeAngle = (sp / 6) * Math.PI * 2;
            const spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.06, s * 0.22, 5), new THREE.MeshStandardMaterial({color:0x999999, metalness:0.8, roughness:0.25}));
            spike.position.set(Math.cos(spikeAngle) * s * 0.26, s * 0.7 + (sp % 2) * 0.25, Math.sin(spikeAngle) * s * 0.26);
            spike.rotation.x = Math.sin(spikeAngle) * 1.2;
            spike.rotation.z = -Math.cos(spikeAngle) * 1.2;
            club.add(spike);
        }
        club.position.set(0, -s * 0.85, s * 0.2);
        club.rotation.x = Math.PI / 4;
        armR.add(club);
        g.add(armR);
        g.userData.rightArm = armR;
        g.userData.club = club;

        // 2 Heavy Stumpy Capsule Legs
        const legs = [];
        [-0.35, 0.35].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(side * s, s * 0.65, 0);
            const legGeo = new THREE.CapsuleGeometry(s * 0.22, s * 0.55, 8, 8);
            legGeo.computeVertexNormals();
            const legMesh = new THREE.Mesh(legGeo, mat(d.color));
            legMesh.position.y = -s * 0.28; legMesh.castShadow = true; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_urgathok'){
        // ==================== BOSS: UR-GATHOK (KADİM ORMAN LORDU) ====================
        const bossMat = mat(0x241016, 0.55, 0.35); // Obsidian demon hide
        const ironMat = new THREE.MeshStandardMaterial({color: 0x1b191c, roughness: 0.30, metalness: 0.88, flatShading: false});
        const magmaMat = new THREE.MeshStandardMaterial({color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 1.25, roughness: 0.20, flatShading: false});

        // Muscular V-shaped demon chest & abdomen
        const chestGeo = new THREE.CapsuleGeometry(s * 0.68, s * 0.65, 10, 12);
        chestGeo.computeVertexNormals();
        const body = new THREE.Mesh(chestGeo, bossMat);
        body.scale.set(1.3, 1.0, 0.85);
        body.position.y = s * 1.55; body.castShadow = true; g.add(body);

        const abdomenGeo = new THREE.CylinderGeometry(s * 0.65, s * 0.48, s * 0.95, 12);
        abdomenGeo.computeVertexNormals();
        const abdomen = new THREE.Mesh(abdomenGeo, bossMat);
        abdomen.position.y = s * 1.05; abdomen.castShadow = true; g.add(abdomen);

        // Heavy Spiked Iron Chestplate
        const chestArmorGeo = new THREE.CapsuleGeometry(s * 0.72, s * 0.55, 10, 12);
        chestArmorGeo.computeVertexNormals();
        const chestArmor = new THREE.Mesh(chestArmorGeo, ironMat);
        chestArmor.scale.set(1.34, 1.0, 0.88);
        chestArmor.position.set(0, s * 1.60, 0.02); chestArmor.castShadow = true; g.add(chestArmor);

        // Glowing Magma Core Runes on Chest (flatShading: true for crystal)
        const runeCore = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.34, 0), new THREE.MeshStandardMaterial({color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 1.3, roughness: 0.2, flatShading: true}));
        runeCore.position.set(0, s * 1.65, s * 0.65); g.add(runeCore);

        // Head & Horns
        const hd = new THREE.Group();
        hd.position.set(0, s * 2.38, 0.08);
        const hdGeo = new THREE.SphereGeometry(s * 0.48, 12, 10);
        hdGeo.computeVertexNormals();
        const hdMesh = new THREE.Mesh(hdGeo, bossMat);
        hdMesh.castShadow = true; hd.add(hdMesh);

        // Sweeping Curved Demon Horns using TorusGeometry arc per instructions!
        [-0.38, 0.38].forEach(side => {
            const horn = new THREE.Mesh(
                new THREE.TorusGeometry(s * 0.44, s * 0.11, 8, 16, Math.PI * 0.65),
                new THREE.MeshStandardMaterial({color: 0xa81122, roughness: 0.25, metalness: 0.5, flatShading: false})
            );
            horn.position.set(side * s * 0.75, s * 0.35, -s * 0.05);
            horn.rotation.z = side > 0 ? -0.7 : 0.7;
            horn.rotation.y = side > 0 ? 0.35 : -0.35;
            hd.add(horn);

            // Horn tip flare
            const hornTip = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.45, 6), magmaMat);
            hornTip.position.set(side * s * 1.15, s * 0.78, -s * 0.22);
            hornTip.rotation.z = -side * 0.85;
            hornTip.rotation.x = -0.55;
            hd.add(hornTip);
        });

        // Blazing Crimson Demon Eyes
        [-0.16, 0.16].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.1, 8, 8), new THREE.MeshBasicMaterial({color: 0xff002b}));
            ey.position.set(side * s * 0.42, 0.05, s * 0.44); hd.add(ey);
        });

        g.add(hd);
        g.userData.head = hd;

        // Massive Heavy Spiked Pauldrons (Curved Spheres + Magma Spikes)
        [-1.0, 1.0].forEach(side => {
            const pauldron = new THREE.Mesh(new THREE.SphereGeometry(s * 0.46, 10, 8), ironMat);
            pauldron.position.set(side * s, s * 2.05, 0);
            pauldron.castShadow = true;
            g.add(pauldron);

            const pSpike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.45, 5), magmaMat);
            pSpike.position.set(side * s * 1.25, s * 2.25, 0);
            pSpike.rotation.z = -side * Math.PI / 3;
            g.add(pSpike);
        });

        // Massive Muscular Arms & Iron Gauntlets (Capsule & Cylinders)
        const armL = new THREE.Group();
        armL.position.set(-s * 0.95, s * 1.85, 0);
        const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.22, s * 0.85, 8, 8), bossMat);
        armLMesh.position.y = -s * 0.48; armLMesh.castShadow = true; armL.add(armLMesh);
        const gauntletL = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.26, s * 0.22, s * 0.62, 8), ironMat);
        gauntletL.position.y = -s * 0.95; armL.add(gauntletL);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 0.95, s * 1.85, 0);
        const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.22, s * 0.85, 8, 8), bossMat);
        armRMesh.position.y = -s * 0.48; armRMesh.castShadow = true; armR.add(armRMesh);
        const gauntletR = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.26, s * 0.22, s * 0.62, 8), ironMat);
        gauntletR.position.y = -s * 0.95; armR.add(gauntletR);

        // Giant Two-Handed Spiked War Mace
        const club = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.12, s * 0.22, s * 2.4, 8), ironMat);
        shaft.position.y = s * 0.6; shaft.castShadow = true; club.add(shaft);

        // Massive Flanged Mace Head
        const headBlock = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.48, 1), ironMat);
        headBlock.position.y = s * 1.35; headBlock.castShadow = true; club.add(headBlock);

        // Glowing Fiery Core inside Mace Head
        const maceCore = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.32, 0), magmaMat);
        maceCore.position.y = s * 1.35; club.add(maceCore);

        for(let sp = 0; sp < 8; sp++){
            const spAng = (sp / 8) * Math.PI * 2;
            const spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.09, s * 0.38, 5), magmaMat);
            spike.position.set(Math.cos(spAng) * s * 0.38, s * 1.35 + (sp % 2) * 0.15, Math.sin(spAng) * s * 0.38);
            spike.rotation.x = Math.sin(spAng) * 1.2;
            spike.rotation.z = -Math.cos(spAng) * 1.2;
            club.add(spike);
        }

        club.position.set(0, -s * 0.85, s * 0.3);
        club.rotation.x = Math.PI / 4;
        armR.add(club);
        g.add(armR);
        g.userData.rightArm = armR;
        g.userData.club = club;

        // 2 Heavy Armored Capsule Legs
        const legs = [];
        [-0.4, 0.4].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(side * s, s * 0.75, 0);
            const legGeo = new THREE.CapsuleGeometry(s * 0.28, s * 0.65, 8, 8);
            legGeo.computeVertexNormals();
            const legMesh = new THREE.Mesh(legGeo, bossMat);
            legMesh.position.y = -s * 0.32; legMesh.castShadow = true; leg.add(legMesh);
            const greave = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.32, s * 0.26, s * 0.65, 8), ironMat);
            greave.position.set(0, -s * 0.38, 0.02); leg.add(greave);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;

        // Demonic Ground Fiery Aura Ring
        const bossAura = new THREE.Mesh(
            new THREE.RingGeometry(s * 0.9, s * 1.55, 28),
            new THREE.MeshBasicMaterial({color: 0xff1800, side: THREE.DoubleSide, transparent: true, opacity: 0.65})
        );
        bossAura.rotation.x = -Math.PI / 2;
        bossAura.position.y = 0.05;
        g.add(bossAura);
        g.userData.bossAura = bossAura;
    }
    else if(type === 'scorpion'){
        // ==================== KUM AKREBİ (SCORPION) ====================
        const scorpMat = mat(d.color, 0.65, 0.25);
        const darkChitin = mat(0x4a240e, 0.75, 0.2);

        // Segmented Chitin Body
        const bodyGeo = new THREE.CapsuleGeometry(s * 0.38, s * 0.75, 8, 8);
        bodyGeo.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeo, scorpMat);
        body.rotation.x = Math.PI / 2;
        body.position.y = s * 0.38;
        body.castShadow = true;
        g.add(body);
        g.userData.body = body;

        // Cephalothorax Head & Eyes
        const hd = new THREE.Mesh(new THREE.SphereGeometry(s * 0.28, 8, 8), darkChitin);
        hd.position.set(0, s * 0.38, s * 0.55);
        g.add(hd);
        g.userData.head = hd;

        // Front Pincers (Two articulated arms with claw pincers)
        const arms = [];
        [-0.35, 0.35].forEach(side => {
            const pincerArm = new THREE.Group();
            pincerArm.position.set(side * s, s * 0.36, s * 0.45);

            const b1 = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.07, s * 0.09, s * 0.45, 6), darkChitin);
            b1.rotation.z = side > 0 ? -0.6 : 0.6;
            b1.rotation.y = side > 0 ? 0.5 : -0.5;
            pincerArm.add(b1);

            // Curved Claws
            const clawL = new THREE.Mesh(new THREE.ConeGeometry(s * 0.06, s * 0.32, 5), scorpMat);
            clawL.position.set(side * s * 0.25, 0, s * 0.35);
            clawL.rotation.x = Math.PI / 2; clawL.rotation.y = side > 0 ? -0.3 : 0.3;
            pincerArm.add(clawL);

            const clawR = new THREE.Mesh(new THREE.ConeGeometry(s * 0.05, s * 0.26, 5), scorpMat);
            clawR.position.set(side * s * 0.32, 0, s * 0.32);
            clawR.rotation.x = Math.PI / 2; clawR.rotation.y = side > 0 ? 0.3 : -0.3;
            pincerArm.add(clawR);

            g.add(pincerArm);
            arms.push(pincerArm);
        });
        g.userData.pincers = arms;

        // Arching Stinger Tail (5 Segmented spheres arching up and forwards)
        const tailGrp = new THREE.Group();
        tailGrp.position.set(0, s * 0.4, -s * 0.45);
        for(let seg = 0; seg < 5; seg++){
            const tSeg = new THREE.Mesh(new THREE.SphereGeometry(s * (0.16 - seg * 0.015), 6, 6), darkChitin);
            const ty = Math.sin(seg * 0.6) * s * 0.75 + seg * s * 0.18;
            const tz = -Math.cos(seg * 0.6) * s * 0.55 + s * 0.35;
            tSeg.position.set(0, ty, tz);
            tailGrp.add(tSeg);
        }
        // Venom Stinger Tip
        const stinger = new THREE.Mesh(new THREE.ConeGeometry(s * 0.07, s * 0.32, 6), new THREE.MeshStandardMaterial({color: 0x33ff00, roughness: 0.3, emissive: 0x228800, emissiveIntensity: 0.6}));
        stinger.position.set(0, s * 1.15, s * 0.1);
        stinger.rotation.x = -Math.PI / 3;
        tailGrp.add(stinger);
        g.add(tailGrp);
        g.userData.tail = tailGrp;

        // 6 Spidery Legs
        const legs = [];
        [-0.35, 0, 0.35].forEach((lz, idx) => {
            [-0.32, 0.32].forEach(side => {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.03, s * 0.045, s * 0.45, 4), scorpMat);
                leg.position.set(side * s * 1.15, s * 0.22, lz * s);
                leg.rotation.z = side > 0 ? -Math.PI / 3 : Math.PI / 3;
                g.add(leg);
                legs.push(leg);
            });
        });
        g.userData.legs = legs;
    }
    else if(type === 'golem'){
        // ==================== TAŞ GOLEM (ROCK GOLEM) ====================
        const stoneMat = new THREE.MeshStandardMaterial({color: 0x7a6350, roughness: 0.95, metalness: 0.1, flatShading: true});
        const mossMat = new THREE.MeshStandardMaterial({color: 0x5a6345, roughness: 0.9, flatShading: true});
        const runeMat = new THREE.MeshBasicMaterial({color: 0xffaa00});

        // Heavy Multi-Faceted Rock Torso
        const chest = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.68, 0), stoneMat);
        chest.scale.set(1.25, 1.0, 0.9);
        chest.position.y = s * 1.35;
        chest.castShadow = true;
        g.add(chest);
        g.userData.body = chest;

        // Glowing Core Eye in chest
        const eyeCore = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.22, 0), runeMat);
        eyeCore.position.set(0, s * 1.4, s * 0.58);
        g.add(eyeCore);

        // Stone Head Block
        const hd = new THREE.Mesh(new THREE.DodecahedronGeometry(s * 0.35, 0), mossMat);
        hd.position.set(0, s * 2.05, 0.05);
        hd.castShadow = true;
        g.add(hd);
        g.userData.head = hd;

        // Massive Boulder Arms & Fists
        const armL = new THREE.Group();
        armL.position.set(-s * 0.85, s * 1.45, 0);
        const boulderL = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.32, 0), stoneMat);
        boulderL.position.y = -s * 0.35; boulderL.castShadow = true; armL.add(boulderL);
        const fistL = new THREE.Mesh(new THREE.DodecahedronGeometry(s * 0.38, 0), stoneMat);
        fistL.position.y = -s * 0.8; fistL.castShadow = true; armL.add(fistL);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 0.85, s * 1.45, 0);
        const boulderR = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.32, 0), stoneMat);
        boulderR.position.y = -s * 0.35; boulderR.castShadow = true; armR.add(boulderR);
        const fistR = new THREE.Mesh(new THREE.DodecahedronGeometry(s * 0.38, 0), stoneMat);
        fistR.position.y = -s * 0.8; fistR.castShadow = true; armR.add(fistR);
        g.add(armR);
        g.userData.rightArm = armR;

        // 2 Heavy Stone Pillar Legs
        const legs = [];
        [-0.38, 0.38].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(side * s, s * 0.65, 0);
            const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.22, s * 0.28, s * 0.65, 6), stoneMat);
            legMesh.position.y = -s * 0.25; legMesh.castShadow = true; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_azrakar'){
        // ==================== BOSS: AZRAKAR (KIZIL ÇORAKLIK HÜKÜMDARI) ====================
        const goldMat = new THREE.MeshStandardMaterial({color: 0xcca038, roughness: 0.35, metalness: 0.85, flatShading: false});
        const sandDemonMat = mat(0x8a3814, 0.65, 0.3);
        const amberGlow = new THREE.MeshStandardMaterial({color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 1.1, roughness: 0.2});

        // Golden Pharaonic Torso
        const chestGeo = new THREE.CapsuleGeometry(s * 0.65, s * 0.7, 10, 10);
        chestGeo.computeVertexNormals();
        const chest = new THREE.Mesh(chestGeo, sandDemonMat);
        chest.scale.set(1.25, 1.0, 0.85);
        chest.position.y = s * 1.5;
        chest.castShadow = true;
        g.add(chest);

        // Golden Ceremonial Collar & Sun Core
        const sunCore = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.32, 0), amberGlow);
        sunCore.position.set(0, s * 1.6, s * 0.58);
        g.add(sunCore);

        // Jackal / Falcon Demon Head with Pharaonic Crown
        const hd = new THREE.Group();
        hd.position.set(0, s * 2.3, 0.1);
        const hdGeo = new THREE.SphereGeometry(s * 0.42, 10, 10);
        hdGeo.computeVertexNormals();
        const hdMesh = new THREE.Mesh(hdGeo, sandDemonMat);
        hd.add(hdMesh);

        // Curved Horns & Crown
        [-0.32, 0.32].forEach(side => {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, s * 0.65, 6), goldMat);
            horn.position.set(side * s * 0.65, s * 0.45, -s * 0.1);
            horn.rotation.z = -side * 0.6;
            hd.add(horn);
        });
        g.add(hd);
        g.userData.head = hd;

        // Dual Crescent Scimitar Arms
        const armL = new THREE.Group();
        armL.position.set(-s * 0.9, s * 1.7, 0);
        const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.2, s * 0.7, 8, 8), sandDemonMat);
        armLMesh.position.y = -s * 0.4; armL.add(armLMesh);
        // Scimitar Blade
        const bladeL = new THREE.Mesh(new THREE.TorusGeometry(s * 0.6, s * 0.08, 6, 12, Math.PI * 0.5), goldMat);
        bladeL.position.set(-s * 0.2, -s * 0.8, s * 0.2);
        bladeL.rotation.y = Math.PI / 2;
        armL.add(bladeL);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 0.9, s * 1.7, 0);
        const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.2, s * 0.7, 8, 8), sandDemonMat);
        armRMesh.position.y = -s * 0.4; armR.add(armRMesh);
        const bladeR = new THREE.Mesh(new THREE.TorusGeometry(s * 0.6, s * 0.08, 6, 12, Math.PI * 0.5), goldMat);
        bladeR.position.set(s * 0.2, -s * 0.8, s * 0.2);
        bladeR.rotation.y = Math.PI / 2;
        armR.add(bladeR);
        g.add(armR);
        g.userData.rightArm = armR;

        // Armored Legs
        const legs = [];
        [-0.38, 0.38].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(side * s, s * 0.7, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.24, s * 0.6, 8, 8), goldMat);
            legMesh.position.y = -s * 0.3; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;

        // Sandfire Aura
        const sandAura = new THREE.Mesh(
            new THREE.RingGeometry(s * 0.9, s * 1.5, 24),
            new THREE.MeshBasicMaterial({color: 0xff8800, side: THREE.DoubleSide, transparent: true, opacity: 0.6})
        );
        sandAura.rotation.x = -Math.PI / 2; sandAura.position.y = 0.05;
        g.add(sandAura);
        g.userData.bossAura = sandAura;
    }
    else if(type === 'frost_wolf'){
        // ==================== BUZ KURDU (FROST WOLF) ====================
        const frostFur = mat(0xc2e4f0, 0.6, 0.2);
        const iceShardMat = new THREE.MeshStandardMaterial({color: 0x7fe3ff, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.85});

        // Lean Frost Canine Body
        const bodyGeo = new THREE.CapsuleGeometry(s * 0.32, s * 1.15, 8, 10);
        bodyGeo.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeo, frostFur);
        body.rotation.x = Math.PI / 2; body.position.y = s * 0.7; body.castShadow = true;
        g.add(body);

        // Ice Shard Spikes along spine
        for(let sp = 0; sp < 4; sp++){
            const spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.35, 5), iceShardMat);
            spike.position.set(0, s * 1.05, -s * 0.4 + sp * s * 0.28);
            spike.rotation.x = -0.3;
            g.add(spike);
        }

        // Head with glowing cyan eyes
        const hd = new THREE.Group();
        hd.position.set(0, s * 0.92, s * 0.95);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.28, 8, 8), frostFur);
        hd.add(hdMesh);
        const sn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.15, s * 0.45, 6), mat(0x94c1d4));
        sn.rotation.x = Math.PI / 2; sn.position.set(0, -s * 0.05, s * 0.36); hd.add(sn);
        [-0.12, 0.12].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.065, 6, 6), new THREE.MeshBasicMaterial({color: 0x00ffff}));
            ey.position.set(side * s, s * 0.08, s * 0.22); hd.add(ey);
        });
        g.add(hd);
        g.userData.head = hd;

        // Tail & Legs
        const tail = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.8, 6), frostFur);
        tail.position.set(0, s * 0.75, -s * 1.05); tail.rotation.x = -Math.PI / 3; g.add(tail);
        g.userData.tail = tail;

        const legs = [];
        [[-0.24, -0.55], [0.24, -0.55], [-0.24, 0.55], [0.24, 0.55]].forEach(([lx, lz]) => {
            const leg = new THREE.Group();
            leg.position.set(lx * s, s * 0.45, lz * s);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.07, s * 0.46, 6, 6), frostFur);
            legMesh.position.y = -s * 0.23; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'frost_mage'){
        // ==================== BUZ BÜYÜCÜSÜ (FROST MAGE - RANGED) ====================
        const robeMat = mat(0x23495d, 0.65, 0.25);
        const iceShardMat = new THREE.MeshStandardMaterial({color: 0x7be2ff, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.85});
        const glowEyeMat = new THREE.MeshBasicMaterial({color: 0x00ffff});

        // Levitating Conical Frost Robe
        const robeGeo = new THREE.ConeGeometry(s * 0.52, s * 1.35, 8);
        robeGeo.computeVertexNormals();
        const robe = new THREE.Mesh(robeGeo, robeMat);
        robe.position.y = s * 0.85; robe.castShadow = true;
        g.add(robe);

        // Hooded Cowl
        const hd = new THREE.Group();
        hd.position.set(0, s * 1.55, 0);
        const cowl = new THREE.Mesh(new THREE.SphereGeometry(s * 0.34, 8, 8), robeMat);
        hd.add(cowl);
        // Shadowy Visor & Glowing Cyan Eyes
        [-0.11, 0.11].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.065, 6, 6), glowEyeMat);
            ey.position.set(side * s, 0, s * 0.28); hd.add(ey);
        });
        g.add(hd);
        g.userData.head = hd;

        // Ice Crystal Shoulder Spikes
        [-0.42, 0.42].forEach(side => {
            const spk = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.42, 5), iceShardMat);
            spk.position.set(side * s, s * 1.45, 0); spk.rotation.z = -side * 0.6;
            g.add(spk);
        });

        // Floating Frost Staff
        const staffGrp = new THREE.Group();
        staffGrp.position.set(s * 0.55, s * 1.1, s * 0.2);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.04, s * 0.05, s * 1.6, 6), mat(0x182c38));
        staffGrp.add(shaft);
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.22, 0), iceShardMat);
        orb.position.y = s * 0.85; staffGrp.add(orb);
        g.add(staffGrp);
        g.userData.rightArm = staffGrp;
        g.userData.staff = staffGrp;
    }
    else if(type === 'frost_troll'){
        // ==================== BUZ TROLÜ (FROST TROLL) ====================
        const trollBlue = mat(0x567e9c, 0.75, 0.2);
        const iceMat = new THREE.MeshStandardMaterial({color: 0x88e0ff, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.85});

        // Frost Giant Muscular Torso
        const chest = new THREE.Mesh(new THREE.SphereGeometry(s * 0.72, 10, 8), trollBlue);
        chest.scale.set(1.2, 0.95, 0.85); chest.position.y = s * 1.45; chest.castShadow = true;
        g.add(chest);

        // Frozen Icicle Spikes on Back
        const iceCrag = new THREE.Mesh(new THREE.ConeGeometry(s * 0.22, s * 0.85, 5), iceMat);
        iceCrag.position.set(0, s * 1.75, -s * 0.45); iceCrag.rotation.x = -0.5; g.add(iceCrag);

        const hd = new THREE.Group();
        hd.position.set(0, s * 2.15, 0.12);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.44, 8, 8), trollBlue);
        hd.add(hdMesh);
        [-0.14, 0.14].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 6, 6), new THREE.MeshBasicMaterial({color: 0x00ffff}));
            ey.position.set(side * s, 0, s * 0.4); hd.add(ey);
        });
        g.add(hd);
        g.userData.head = hd;

        // Arms & Ice Warhammer
        const armL = new THREE.Group();
        armL.position.set(-s * 0.85, s * 1.8, 0);
        const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.18, s * 0.65, 6, 6), trollBlue);
        armLMesh.position.y = -s * 0.38; armL.add(armLMesh);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 0.85, s * 1.8, 0);
        const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.18, s * 0.65, 6, 6), trollBlue);
        armRMesh.position.y = -s * 0.38; armR.add(armRMesh);

        // Glacial Ice Warhammer
        const warhammer = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.14, s * 1.8, 6), mat(0x283b4a));
        shaft.position.y = s * 0.4; warhammer.add(shaft);
        const hammerHead = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.32, s * 0.32, s * 0.85, 6), iceMat);
        hammerHead.rotation.z = Math.PI / 2; hammerHead.position.y = s * 1.1; warhammer.add(hammerHead);
        warhammer.position.set(0, -s * 0.85, s * 0.2); warhammer.rotation.x = Math.PI / 4;
        armR.add(warhammer);
        g.add(armR);
        g.userData.rightArm = armR;
        g.userData.club = warhammer;

        const legs = [];
        [-0.35, 0.35].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(side * s, s * 0.65, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.22, s * 0.55, 6, 6), trollBlue);
            legMesh.position.y = -s * 0.28; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_ymirkhor'){
        // ==================== BOSS: YMIR-KHOR (BUZUL DEV) ====================
        const frostTitanMat = mat(0x1a4563, 0.5, 0.35);
        const crystalIce = new THREE.MeshStandardMaterial({color: 0x9be8ff, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.88});
        const blizzardGlow = new THREE.MeshBasicMaterial({color: 0x55ffff});

        // Colossal Frost Titan Torso
        const chestGeo = new THREE.CapsuleGeometry(s * 0.7, s * 0.75, 10, 10);
        chestGeo.computeVertexNormals();
        const chest = new THREE.Mesh(chestGeo, frostTitanMat);
        chest.scale.set(1.3, 1.0, 0.85); chest.position.y = s * 1.6; chest.castShadow = true;
        g.add(chest);

        // Glowing Blizzard Rune in chest
        const runeCore = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.38, 0), blizzardGlow);
        runeCore.position.set(0, s * 1.7, s * 0.62); g.add(runeCore);

        // Titan Head & Crown of Ice Spires
        const hd = new THREE.Group();
        hd.position.set(0, s * 2.45, 0.1);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.48, 10, 10), frostTitanMat);
        hd.add(hdMesh);

        // Jagged Crown of 5 Ice Spires
        for(let sp = 0; sp < 5; sp++){
            const spire = new THREE.Mesh(new THREE.ConeGeometry(s * 0.09, s * 0.55, 5), crystalIce);
            spire.position.set((-0.35 + sp * 0.175) * s, s * 0.55, -s * 0.05);
            spire.rotation.z = (-0.35 + sp * 0.175) * -0.8;
            hd.add(spire);
        }
        [-0.18, 0.18].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.11, 6, 6), blizzardGlow);
            ey.position.set(side * s * 0.4, 0.06, s * 0.44); hd.add(ey);
        });
        g.add(hd);
        g.userData.head = hd;

        // Ice Armor Pauldrons & Arms
        [-1.0, 1.0].forEach(side => {
            const p = new THREE.Mesh(new THREE.SphereGeometry(s * 0.48, 8, 8), crystalIce);
            p.position.set(side * s, s * 2.1, 0); g.add(p);
        });

        const armL = new THREE.Group();
        armL.position.set(-s * 0.95, s * 1.9, 0);
        const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.22, s * 0.85, 8, 8), frostTitanMat);
        armLMesh.position.y = -s * 0.48; armL.add(armLMesh);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 0.95, s * 1.9, 0);
        const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.22, s * 0.85, 8, 8), frostTitanMat);
        armRMesh.position.y = -s * 0.48; armR.add(armRMesh);

        // Giant Glacial Mace
        const mace = new THREE.Group();
        const maceShaft = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.1, s * 0.18, s * 2.3, 6), crystalIce);
        maceShaft.position.y = s * 0.6; mace.add(maceShaft);
        const maceHead = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.55, 0), crystalIce);
        maceHead.position.y = s * 1.45; mace.add(maceHead);
        mace.position.set(0, -s * 0.85, s * 0.3); mace.rotation.x = Math.PI / 4;
        armR.add(mace);
        g.add(armR);
        g.userData.rightArm = armR;
        g.userData.club = mace;

        // Legs
        const legs = [];
        [-0.42, 0.42].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(side * s, s * 0.75, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.28, s * 0.65, 8, 8), frostTitanMat);
            legMesh.position.y = -s * 0.32; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;

        // Blizzard Aura Ring
        const iceAura = new THREE.Mesh(
            new THREE.RingGeometry(s * 0.95, s * 1.6, 28),
            new THREE.MeshBasicMaterial({color: 0x55eeff, side: THREE.DoubleSide, transparent: true, opacity: 0.65})
        );
        iceAura.rotation.x = -Math.PI / 2; iceAura.position.y = 0.05;
        g.add(iceAura);
        g.userData.bossAura = iceAura;
    }
    else if(type === 'infernal_knight'){
        // ==================== CEHENNEM ŞÖVALYESİ ====================
        const darkArmor = new THREE.MeshStandardMaterial({color: 0x1f1418, roughness: 0.3, metalness: 0.85});
        const fireMat = new THREE.MeshBasicMaterial({color: 0xff3b00});

        // Armored Obsidian Knight Torso
        const chestGeo = new THREE.CapsuleGeometry(s * 0.45, s * 0.65, 8, 8);
        chestGeo.computeVertexNormals();
        const chest = new THREE.Mesh(chestGeo, darkArmor);
        chest.position.y = s * 1.25; chest.castShadow = true; g.add(chest);

        // Horned Greathelm
        const hd = new THREE.Group();
        hd.position.set(0, s * 1.85, 0);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.32, 8, 8), darkArmor);
        hd.add(hdMesh);
        // Glowing Fiery Visor Slit
        const visor = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.36, s * 0.08), fireMat);
        visor.position.set(0, s * 0.02, s * 0.33); hd.add(visor);
        // Horns
        [-0.24, 0.24].forEach(side => {
            const h = new THREE.Mesh(new THREE.ConeGeometry(s * 0.07, s * 0.45, 5), darkArmor);
            h.position.set(side * s, s * 0.28, -s * 0.05); h.rotation.z = -side * 0.5; hd.add(h);
        });
        g.add(hd);
        g.userData.head = hd;

        // Arms & Two-Handed Flaming Greatsword
        const armL = new THREE.Group();
        armL.position.set(-s * 0.6, s * 1.4, 0);
        const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.14, s * 0.55, 6, 6), darkArmor);
        armLMesh.position.y = -s * 0.28; armL.add(armLMesh);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 0.6, s * 1.4, 0);
        const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.14, s * 0.55, 6, 6), darkArmor);
        armRMesh.position.y = -s * 0.28; armR.add(armRMesh);

        // Flaming Greatsword
        const sword = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.03, s * 0.08, s * 1.7, 5), new THREE.MeshStandardMaterial({color: 0xff3b00, emissive: 0xff2200, emissiveIntensity: 1.2}));
        blade.position.y = s * 0.6; sword.add(blade);
        sword.position.set(0, -s * 0.45, s * 0.25); sword.rotation.x = Math.PI / 4;
        armR.add(sword);
        g.add(armR);
        g.userData.rightArm = armR;

        // Legs
        const legs = [];
        [-0.24, 0.24].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(side * s, s * 0.55, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.16, s * 0.5, 6, 6), darkArmor);
            legMesh.position.y = -s * 0.22; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'shadow_demon'){
        // ==================== GÖLGE İBLİSİ (SHADOW DEMON) ====================
        const shadowMat = mat(0x180a22, 0.4, 0.4);
        const voidPurple = new THREE.MeshBasicMaterial({color: 0xcc22ff});

        // Levitating Shadow Torso
        const chestGeo = new THREE.ConeGeometry(s * 0.45, s * 1.2, 8);
        chestGeo.computeVertexNormals();
        const chest = new THREE.Mesh(chestGeo, shadowMat);
        chest.rotation.x = Math.PI; chest.position.y = s * 1.35; chest.castShadow = true;
        g.add(chest);

        // Horned Shadow Head with Piercing Violet Eyes
        const hd = new THREE.Group();
        hd.position.set(0, s * 1.95, 0.05);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.35, 8, 8), shadowMat);
        hd.add(hdMesh);
        [-0.14, 0.14].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.07, 6, 6), voidPurple);
            ey.position.set(side * s, 0, s * 0.32); hd.add(ey);
        });
        [-0.28, 0.28].forEach(side => {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.6, 5), shadowMat);
            horn.position.set(side * s, s * 0.35, -s * 0.1); horn.rotation.z = -side * 0.6; hd.add(horn);
        });
        g.add(hd);
        g.userData.head = hd;

        // Shadow Wings (Levitating Bat Wings)
        [-1, 1].forEach(side => {
            const wing = new THREE.Mesh(new THREE.ConeGeometry(s * 0.5, s * 1.4, 4), shadowMat);
            wing.position.set(side * s * 0.7, s * 1.5, -s * 0.3);
            wing.rotation.z = side * 1.1; wing.rotation.y = side * 0.4;
            g.add(wing);
        });

        // Claws
        const armL = new THREE.Group();
        armL.position.set(-s * 0.55, s * 1.4, 0);
        const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.12, s * 0.65, 6, 6), shadowMat);
        armLMesh.position.y = -s * 0.3; armL.add(armLMesh);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 0.55, s * 1.4, 0);
        const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.12, s * 0.65, 6, 6), shadowMat);
        armRMesh.position.y = -s * 0.3; armR.add(armRMesh);
        g.add(armR);
        g.userData.rightArm = armR;
    }
    else if(type === 'boss_malakor'){
        // ==================== FINAL BOSS: KADİM YIKICI MALAKOR (LEVEL 100) ====================
        const dreadMat = mat(0x18060f, 0.45, 0.4);
        const dreadPlate = new THREE.MeshStandardMaterial({color: 0x0f070d, roughness: 0.25, metalness: 0.9});
        const hellfire = new THREE.MeshStandardMaterial({color: 0xff1500, emissive: 0xff0500, emissiveIntensity: 1.5, roughness: 0.15});

        // Colossal Overlord Torso & Dread Armor
        const chestGeo = new THREE.CapsuleGeometry(s * 0.75, s * 0.85, 10, 12);
        chestGeo.computeVertexNormals();
        const chest = new THREE.Mesh(chestGeo, dreadMat);
        chest.scale.set(1.35, 1.0, 0.9); chest.position.y = s * 1.75; chest.castShadow = true;
        g.add(chest);

        // Heart of Malakor: Blazing Magma Core in chest
        const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.45, 0), hellfire);
        heartCore.position.set(0, s * 1.85, s * 0.72); g.add(heartCore);

        // Dread Head with Quad Obsidian Demon Horns
        const hd = new THREE.Group();
        hd.position.set(0, s * 2.7, 0.12);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.52, 10, 10), dreadMat);
        hd.add(hdMesh);

        // Primary Colossal Horns
        [-0.45, 0.45].forEach(side => {
            const h1 = new THREE.Mesh(new THREE.TorusGeometry(s * 0.55, s * 0.13, 8, 16, Math.PI * 0.7), dreadPlate);
            h1.position.set(side * s * 0.85, s * 0.45, -s * 0.05);
            h1.rotation.z = side > 0 ? -0.75 : 0.75; h1.rotation.y = side > 0 ? 0.35 : -0.35;
            hd.add(h1);
        });
        // Secondary Inner Spikes
        [-0.2, 0.2].forEach(side => {
            const h2 = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, s * 0.55, 6), hellfire);
            h2.position.set(side * s * 0.5, s * 0.75, 0); h2.rotation.z = -side * 0.35;
            hd.add(h2);
        });

        // Blazing Hellfire Eyes
        [-0.18, 0.18].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 8, 8), new THREE.MeshBasicMaterial({color: 0xff0033}));
            ey.position.set(side * s * 0.45, 0.08, s * 0.48); hd.add(ey);
        });
        g.add(hd);
        g.userData.head = hd;

        // Quad Wings of Doom (Huge Demonic Wings spanning 5 units)
        [-1, 1].forEach(side => {
            const wingUpper = new THREE.Mesh(new THREE.ConeGeometry(s * 0.6, s * 2.2, 4), dreadPlate);
            wingUpper.position.set(side * s * 1.2, s * 2.1, -s * 0.5);
            wingUpper.rotation.z = side * 1.25; wingUpper.rotation.y = side * 0.35;
            g.add(wingUpper);

            const wingLower = new THREE.Mesh(new THREE.ConeGeometry(s * 0.45, s * 1.8, 4), hellfire);
            wingLower.position.set(side * s * 1.1, s * 1.4, -s * 0.6);
            wingLower.rotation.z = side * 1.45;
            g.add(wingLower);
        });

        // Massive Pauldrons
        [-1.1, 1.1].forEach(side => {
            const p = new THREE.Mesh(new THREE.SphereGeometry(s * 0.52, 10, 8), dreadPlate);
            p.position.set(side * s, s * 2.25, 0); g.add(p);
            const pSpike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.14, s * 0.65, 5), hellfire);
            pSpike.position.set(side * s * 1.35, s * 2.5, 0); pSpike.rotation.z = -side * 0.75;
            g.add(pSpike);
        });

        // Arms & Colossal World-Breaker Hellfire Blade
        const armL = new THREE.Group();
        armL.position.set(-s * 1.1, s * 2.0, 0);
        const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.25, s * 0.95, 8, 8), dreadMat);
        armLMesh.position.y = -s * 0.52; armL.add(armLMesh);
        g.add(armL);
        g.userData.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(s * 1.1, s * 2.0, 0);
        const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.25, s * 0.95, 8, 8), dreadMat);
        armRMesh.position.y = -s * 0.52; armR.add(armRMesh);

        // Colossal World-Breaker Hellfire Greatsword
        const greatsword = new THREE.Group();
        const swordHilt = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.12, s * 0.18, s * 2.8, 8), dreadPlate);
        swordHilt.position.y = s * 0.7; greatsword.add(swordHilt);
        const swordBlade = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.38, s * 2.5, 6), hellfire);
        swordBlade.position.y = s * 2.1; greatsword.add(swordBlade);
        greatsword.position.set(0, -s * 0.95, s * 0.35); greatsword.rotation.x = Math.PI / 4;
        armR.add(greatsword);
        g.add(armR);
        g.userData.rightArm = armR;
        g.userData.club = greatsword;

        // Legs
        const legs = [];
        [-0.45, 0.45].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(side * s, s * 0.85, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.32, s * 0.75, 8, 8), dreadMat);
            legMesh.position.y = -s * 0.38; leg.add(legMesh);
            g.add(leg);
            legs.push(leg);
        });
        g.userData.legs = legs;

        // Hellfire Summoning Pentagram Ring
        const malakorAura = new THREE.Mesh(
            new THREE.RingGeometry(s * 1.1, s * 1.85, 32),
            new THREE.MeshBasicMaterial({color: 0xff0500, side: THREE.DoubleSide, transparent: true, opacity: 0.75})
        );
        malakorAura.rotation.x = -Math.PI / 2; malakorAura.position.y = 0.05;
        g.add(malakorAura);
        g.userData.bossAura = malakorAura;
    }
    // ==================== 10-ZONE BOSSES & REGULAR MONSTERS ====================
    else if(type === 'boss_gorgar'){
        // Zone 1 Boss: Gorgar (Primal Forest Titan swinging massive spiked tree trunk log)
        const mossMat = mat(0x354a24, 0.85);
        const barkMat = mat(0x422a18, 0.90);
        const leafMat = mat(0x487a2a, 0.75);

        const chest = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.65, s * 0.60, 8, 10), mossMat);
        chest.position.y = s * 1.5; chest.scale.set(1.25, 1.0, 0.9); chest.castShadow = true; g.add(chest);

        const hd = new THREE.Group();
        hd.position.set(0, s * 2.2, 0.1);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.42, 10, 8), mossMat);
        hd.add(hdMesh);
        // Antler twigs on head
        [-0.3, 0.3].forEach(side => {
            const twig = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.05, s * 0.09, s * 0.8, 5), barkMat);
            twig.position.set(side * s * 0.5, s * 0.45, 0); twig.rotation.z = side > 0 ? -0.5 : 0.5; hd.add(twig);
        });
        [-0.14, 0.14].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 6, 6), new THREE.MeshBasicMaterial({color: 0xaaff44}));
            ey.position.set(side * s * 0.45, 0.05, s * 0.38); hd.add(ey);
        });
        g.add(hd);

        // Arms & Gigantic Spiked Wooden Trunk Log
        const armL = new THREE.Group(); armL.position.set(-s * 0.95, s * 1.8, 0);
        const alMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.22, s * 0.75, 6, 8), mossMat);
        alMesh.position.y = -s * 0.4; armL.add(alMesh); g.add(armL); g.userData.leftArm = armL;

        const armR = new THREE.Group(); armR.position.set(s * 0.95, s * 1.8, 0);
        const arMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.22, s * 0.75, 6, 8), mossMat);
        arMesh.position.y = -s * 0.4; armR.add(arMesh);

        // Colossal Spiked Tree Trunk Log
        const log = new THREE.Group();
        const logTrunk = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.28, s * 0.35, s * 2.6, 8), barkMat);
        logTrunk.position.y = s * 0.9; log.add(logTrunk);
        for(let sp = 0; sp < 8; sp++){
            const spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.35, 5), mat(0x7a6c58, 0.8));
            const sang = (sp / 8) * Math.PI * 2;
            spike.position.set(Math.cos(sang) * s * 0.32, s * (0.6 + (sp % 4) * 0.45), Math.sin(sang) * s * 0.32);
            spike.rotation.x = Math.sin(sang) * 0.5; spike.rotation.z = -Math.cos(sang) * 0.5;
            log.add(spike);
        }
        log.position.set(0, -s * 0.8, s * 0.3); log.rotation.x = Math.PI / 4;
        armR.add(log); g.add(armR); g.userData.rightArm = armR; g.userData.club = log;

        // Legs
        const legs = [];
        [-0.38, 0.38].forEach(side => {
            const leg = new THREE.Group(); leg.position.set(side * s, s * 0.8, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.26, s * 0.65, 6, 8), mossMat);
            legMesh.position.y = -s * 0.35; leg.add(legMesh); g.add(leg); legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_morghul'){
        // Zone 3 Boss: Morghul (Cursed Swamp Hydra Abomination with dripping toxic scythe claws)
        const swampMat = mat(0x183820, 0.75);
        const venomMat = new THREE.MeshStandardMaterial({color: 0x44ff22, emissive: 0x44ff22, emissiveIntensity: 1.2, roughness: 0.2});

        const chest = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.7, s * 0.7, 8, 10), swampMat);
        chest.position.y = s * 1.5; chest.scale.set(1.3, 1.0, 0.95); g.add(chest);

        const hd = new THREE.Group(); hd.position.set(0, s * 2.3, 0.2);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.46, 10, 8), swampMat); hd.add(hdMesh);
        [-0.15, 0.15].forEach(side => {
            const ey = new THREE.Mesh(new THREE.SphereGeometry(s * 0.09, 6, 6), venomMat);
            ey.position.set(side * s * 0.45, 0.05, s * 0.4); hd.add(ey);
        });
        g.add(hd);

        const armR = new THREE.Group(); armR.position.set(s * 1.0, s * 1.8, 0);
        const arMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.22, s * 0.8, 6, 8), swampMat);
        arMesh.position.y = -s * 0.4; armR.add(arMesh);

        // Toxic Curved Scythe Claw
        const scythe = new THREE.Group();
        const scytheHandle = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.1, s * 2.4, 6), mat(0x2d2218));
        scytheHandle.position.y = s * 0.8; scythe.add(scytheHandle);
        const blade = new THREE.Mesh(new THREE.TorusGeometry(s * 0.55, s * 0.08, 6, 14, Math.PI * 0.55), venomMat);
        blade.position.set(s * 0.35, s * 1.8, 0); blade.rotation.z = -0.5; scythe.add(blade);
        scythe.position.set(0, -s * 0.8, s * 0.3); scythe.rotation.x = Math.PI / 4;
        armR.add(scythe); g.add(armR); g.userData.rightArm = armR; g.userData.club = scythe;

        const legs = [];
        [-0.4, 0.4].forEach(side => {
            const leg = new THREE.Group(); leg.position.set(side * s, s * 0.8, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.28, s * 0.7, 6, 8), swampMat);
            legMesh.position.y = -s * 0.35; leg.add(legMesh); g.add(leg); legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_amunkhet'){
        // Zone 4 Boss: Amun-Khet (Pharaoh Lord with golden khopesh & sand tornado)
        const goldMat = new THREE.MeshStandardMaterial({color: 0xffd700, roughness: 0.25, metalness: 0.9});
        const royalMat = mat(0x183b54, 0.6);

        const chest = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.6, s * 0.65, 8, 10), royalMat);
        chest.position.y = s * 1.5; g.add(chest);
        const collar = new THREE.Mesh(new THREE.TorusGeometry(s * 0.5, s * 0.1, 8, 16), goldMat);
        collar.position.y = s * 1.85; collar.rotation.x = Math.PI / 2; g.add(collar);

        const hd = new THREE.Group(); hd.position.set(0, s * 2.3, 0);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.4, 10, 8), goldMat); hd.add(hdMesh);
        // Nemes headdress
        const nemes = new THREE.Mesh(new THREE.ConeGeometry(s * 0.65, s * 0.85, 4), royalMat);
        nemes.position.set(0, s * 0.2, -s * 0.1); nemes.rotation.y = Math.PI / 4; hd.add(nemes);
        g.add(hd);

        const armR = new THREE.Group(); armR.position.set(s * 0.95, s * 1.8, 0);
        const arMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.18, s * 0.75, 6, 8), royalMat);
        arMesh.position.y = -s * 0.4; armR.add(arMesh);

        // Golden Curved Khopesh
        const khopesh = new THREE.Group();
        const khHandle = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.06, s * 0.08, s * 1.8, 6), goldMat);
        khHandle.position.y = s * 0.6; khopesh.add(khHandle);
        const khCurve = new THREE.Mesh(new THREE.TorusGeometry(s * 0.42, s * 0.06, 6, 12, Math.PI * 0.6), goldMat);
        khCurve.position.set(s * 0.25, s * 1.3, 0); khopesh.add(khCurve);
        khopesh.position.set(0, -s * 0.6, s * 0.2); khopesh.rotation.x = Math.PI / 4;
        armR.add(khopesh); g.add(armR); g.userData.rightArm = armR; g.userData.club = khopesh;

        // Swirling sand base
        const sandVortex = new THREE.Mesh(new THREE.ConeGeometry(s * 1.1, s * 1.2, 8), mat(0xc49d48, 0.9));
        sandVortex.position.y = s * 0.55; sandVortex.rotation.x = Math.PI; g.add(sandVortex);
    }
    else if(type === 'boss_ymirath'){
        // Zone 5 Boss: Ymirath (Glacial Frost Giant with icicle mace)
        const icePlate = new THREE.MeshStandardMaterial({color: 0x88d4f5, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.88});
        const frostMat = mat(0x28587a, 0.6);

        const chest = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.7, s * 0.7, 8, 10), frostMat);
        chest.position.y = s * 1.6; g.add(chest);

        const hd = new THREE.Group(); hd.position.set(0, s * 2.4, 0.1);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.45, 10, 8), frostMat); hd.add(hdMesh);
        // Ice Crown
        const crown = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.6, 5), icePlate);
        crown.position.set(0, s * 0.5, 0); hd.add(crown);
        g.add(hd);

        const armR = new THREE.Group(); armR.position.set(s * 1.05, s * 1.9, 0);
        const arMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.24, s * 0.8, 6, 8), frostMat);
        arMesh.position.y = -s * 0.4; armR.add(arMesh);

        // Glacial Ice Mace
        const mace = new THREE.Group();
        const mHandle = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.09, s * 0.12, s * 2.4, 6), frostMat);
        mHandle.position.y = s * 0.8; mace.add(mHandle);
        const mHead = new THREE.Mesh(new THREE.DodecahedronGeometry(s * 0.45, 0), icePlate);
        mHead.position.y = s * 1.9; mace.add(mHead);
        mace.position.set(0, -s * 0.8, s * 0.3); mace.rotation.x = Math.PI / 4;
        armR.add(mace); g.add(armR); g.userData.rightArm = armR; g.userData.club = mace;

        const legs = [];
        [-0.42, 0.42].forEach(side => {
            const leg = new THREE.Group(); leg.position.set(side * s, s * 0.85, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.28, s * 0.75, 6, 8), frostMat);
            legMesh.position.y = -s * 0.38; leg.add(legMesh); g.add(leg); legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_riftbreaker'){
        // Zone 6 Boss: Rift-Breaker (Amethyst/Obsidian Void Automaton with Arm Cannon)
        const voidMat = mat(0x1a0f26, 0.6, 0.4);
        const riftMat = new THREE.MeshStandardMaterial({color: 0xaa22ff, emissive: 0xaa22ff, emissiveIntensity: 1.4, roughness: 0.15});

        const chest = new THREE.Mesh(new THREE.BoxGeometry(s * 1.2, s * 1.3, s * 0.8), voidMat);
        chest.position.y = s * 1.6; g.add(chest);
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.3, 0), riftMat);
        core.position.set(0, s * 1.6, s * 0.45); g.add(core);

        const hd = new THREE.Group(); hd.position.set(0, s * 2.45, 0);
        const hdMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 0.6, s * 0.6, s * 0.6), voidMat); hd.add(hdMesh);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.12, s * 0.1), riftMat);
        visor.position.set(0, 0, s * 0.32); hd.add(visor);
        g.add(hd);

        const armR = new THREE.Group(); armR.position.set(s * 1.0, s * 1.8, 0);
        // Heavy Void Cannon Arm
        const cannon = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.22, s * 0.28, s * 2.2, 8), voidMat);
        cannon.position.set(0, -s * 0.4, s * 0.5); cannon.rotation.x = Math.PI / 2; armR.add(cannon);
        const cannonGlow = new THREE.Mesh(new THREE.TorusGeometry(s * 0.24, s * 0.05, 6, 12), riftMat);
        cannonGlow.position.set(0, -s * 0.4, s * 1.5); armR.add(cannonGlow);
        g.add(armR); g.userData.rightArm = armR; g.userData.club = cannon;

        const legs = [];
        [-0.45, 0.45].forEach(side => {
            const leg = new THREE.Group(); leg.position.set(side * s, s * 0.85, 0);
            const legMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 0.4, s * 0.9, s * 0.45), voidMat);
            legMesh.position.y = -s * 0.45; leg.add(legMesh); g.add(leg); legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_khardraz'){
        // Zone 7 Boss: Khar-Draz (Balrog with flaming horns, wings & dual flaming broadswords)
        const demonMat = mat(0x2e0c08, 0.6, 0.3);
        const fireMat = new THREE.MeshStandardMaterial({color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 1.3});

        const chest = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.72, s * 0.75, 8, 10), demonMat);
        chest.position.y = s * 1.65; g.add(chest);

        const hd = new THREE.Group(); hd.position.set(0, s * 2.5, 0.1);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.48, 10, 8), demonMat); hd.add(hdMesh);
        [-0.35, 0.35].forEach(side => {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.8, 6), fireMat);
            horn.position.set(side * s * 0.6, s * 0.5, -s * 0.1); horn.rotation.z = -side * 0.6; hd.add(horn);
        });
        g.add(hd);

        // Flaming demon wings
        [-1, 1].forEach(side => {
            const wing = new THREE.Mesh(new THREE.ConeGeometry(s * 0.5, s * 2.0, 4), demonMat);
            wing.position.set(side * s * 1.1, s * 2.1, -s * 0.4); wing.rotation.z = side * 1.2; g.add(wing);
        });

        const armR = new THREE.Group(); armR.position.set(s * 1.1, s * 1.9, 0);
        const arMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.24, s * 0.8, 6, 8), demonMat);
        arMesh.position.y = -s * 0.4; armR.add(arMesh);

        // Flaming Obsidian Broadsword
        const sword = new THREE.Group();
        const sBlade = new THREE.Mesh(new THREE.BoxGeometry(s * 0.25, s * 2.2, s * 0.08), fireMat);
        sBlade.position.y = s * 1.1; sword.add(sBlade);
        sword.position.set(0, -s * 0.6, s * 0.3); sword.rotation.x = Math.PI / 4;
        armR.add(sword); g.add(armR); g.userData.rightArm = armR; g.userData.club = sword;

        const legs = [];
        [-0.45, 0.45].forEach(side => {
            const leg = new THREE.Group(); leg.position.set(side * s, s * 0.85, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.3, s * 0.8, 6, 8), demonMat);
            legMesh.position.y = -s * 0.4; leg.add(legMesh); g.add(leg); legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_raikor'){
        // Zone 8 Boss: Raikor (Storm Titan with crackling lightning plate & twin electric spear)
        const titanMat = new THREE.MeshStandardMaterial({color: 0x223b5c, roughness: 0.3, metalness: 0.85});
        const lightningMat = new THREE.MeshStandardMaterial({color: 0x33bbff, emissive: 0x33bbff, emissiveIntensity: 1.5});

        const chest = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.75, s * 0.75, 8, 10), titanMat);
        chest.position.y = s * 1.7; g.add(chest);

        const hd = new THREE.Group(); hd.position.set(0, s * 2.55, 0.1);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.48, 10, 8), titanMat); hd.add(hdMesh);
        const crest = new THREE.Mesh(new THREE.ConeGeometry(s * 0.15, s * 0.7, 5), lightningMat);
        crest.position.set(0, s * 0.55, 0); hd.add(crest);
        g.add(hd);

        const armR = new THREE.Group(); armR.position.set(s * 1.15, s * 2.0, 0);
        const arMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.25, s * 0.85, 6, 8), titanMat);
        arMesh.position.y = -s * 0.42; armR.add(arMesh);

        // Dual-bladed Electric Lightning Spear
        const spear = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.08, s * 3.2, 6), titanMat);
        spear.add(shaft);
        [-1, 1].forEach(side => {
            const tip = new THREE.Mesh(new THREE.ConeGeometry(s * 0.16, s * 0.7, 4), lightningMat);
            tip.position.y = side * s * 1.7; tip.rotation.x = side < 0 ? Math.PI : 0; spear.add(tip);
        });
        spear.position.set(0, -s * 0.5, s * 0.3); spear.rotation.x = Math.PI / 4;
        armR.add(spear); g.add(armR); g.userData.rightArm = armR; g.userData.club = spear;

        const legs = [];
        [-0.45, 0.45].forEach(side => {
            const leg = new THREE.Group(); leg.position.set(side * s, s * 0.9, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.32, s * 0.85, 6, 8), titanMat);
            legMesh.position.y = -s * 0.42; leg.add(legMesh); g.add(leg); legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_vanehelm'){
        // Zone 9 Boss: Vane-Helm (Dark Gothic Death Knight with Soul Steal Runesword)
        const darkMat = new THREE.MeshStandardMaterial({color: 0x14161f, roughness: 0.35, metalness: 0.8});
        const soulMat = new THREE.MeshStandardMaterial({color: 0xdd1166, emissive: 0xdd1166, emissiveIntensity: 1.3});

        const chest = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.72, s * 0.75, 8, 10), darkMat);
        chest.position.y = s * 1.65; g.add(chest);

        const hd = new THREE.Group(); hd.position.set(0, s * 2.5, 0.1);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.46, 10, 8), darkMat); hd.add(hdMesh);
        // Visor slit with glowing soul eyes
        const visor = new THREE.Mesh(new THREE.BoxGeometry(s * 0.45, s * 0.08, s * 0.1), soulMat);
        visor.position.set(0, 0, s * 0.4); hd.add(visor);
        g.add(hd);

        const armR = new THREE.Group(); armR.position.set(s * 1.1, s * 1.95, 0);
        const arMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.24, s * 0.8, 6, 8), darkMat);
        arMesh.position.y = -s * 0.4; armR.add(arMesh);

        // Life-Stealing Dark Runesword
        const bladeGroup = new THREE.Group();
        const rBlade = new THREE.Mesh(new THREE.BoxGeometry(s * 0.22, s * 2.4, s * 0.06), darkMat);
        rBlade.position.y = s * 1.2; bladeGroup.add(rBlade);
        const runeLine = new THREE.Mesh(new THREE.BoxGeometry(s * 0.06, s * 1.8, s * 0.08), soulMat);
        runeLine.position.y = s * 1.2; bladeGroup.add(runeLine);
        bladeGroup.position.set(0, -s * 0.6, s * 0.3); bladeGroup.rotation.x = Math.PI / 4;
        armR.add(bladeGroup); g.add(armR); g.userData.rightArm = armR; g.userData.club = bladeGroup;

        const legs = [];
        [-0.45, 0.45].forEach(side => {
            const leg = new THREE.Group(); leg.position.set(side * s, s * 0.85, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.3, s * 0.8, 6, 8), darkMat);
            legMesh.position.y = -s * 0.4; leg.add(legMesh); g.add(leg); legs.push(leg);
        });
        g.userData.legs = legs;
    }
    else if(type === 'boss_aethelgard'){
        // Zone 10 Final Boss: Aethelgard (Celestial God with 4 astral wings, halo & Cosmic Sunblade)
        const astralMat = new THREE.MeshStandardMaterial({color: 0x221340, roughness: 0.2, metalness: 0.9});
        const starMat = new THREE.MeshStandardMaterial({color: 0xe099ff, emissive: 0xe099ff, emissiveIntensity: 1.5, roughness: 0.1});
        const goldMat = new THREE.MeshStandardMaterial({color: 0xffd700, roughness: 0.25, metalness: 0.9});

        const chest = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.78, s * 0.8, 8, 10), astralMat);
        chest.position.y = s * 1.75; g.add(chest);

        const hd = new THREE.Group(); hd.position.set(0, s * 2.65, 0.1);
        const hdMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 10, 8), goldMat); hd.add(hdMesh);

        // Floating Starlight Corona Halo
        const halo = new THREE.Mesh(new THREE.TorusGeometry(s * 0.65, s * 0.06, 8, 24), starMat);
        halo.position.set(0, s * 0.4, -s * 0.15); hd.add(halo);
        g.add(hd);

        // 4 Hovering Radiant Astral Wings
        [[-1.2, 2.3], [1.2, 2.3], [-1.0, 1.4], [1.0, 1.4]].forEach(([wx, wy]) => {
            const wing = new THREE.Mesh(new THREE.ConeGeometry(s * 0.45, s * 2.6, 4), starMat);
            wing.position.set(wx * s, wy * s, -s * 0.5);
            wing.rotation.z = (wx > 0 ? 1 : -1) * 1.35;
            g.add(wing);
        });

        const armR = new THREE.Group(); armR.position.set(s * 1.2, s * 2.1, 0);
        const arMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.25, s * 0.85, 6, 8), astralMat);
        arMesh.position.y = -s * 0.42; armR.add(arMesh);

        // Legendary Cosmic Sunblade
        const sunblade = new THREE.Group();
        const sBlade = new THREE.Mesh(new THREE.BoxGeometry(s * 0.28, s * 2.8, s * 0.08), starMat);
        sBlade.position.y = s * 1.4; sunblade.add(sBlade);
        const sGuard = new THREE.Mesh(new THREE.TorusGeometry(s * 0.35, s * 0.08, 6, 12), goldMat);
        sGuard.position.y = s * 0.2; sGuard.rotation.x = Math.PI / 2; sunblade.add(sGuard);
        sunblade.position.set(0, -s * 0.6, s * 0.35); sunblade.rotation.x = Math.PI / 4;
        armR.add(sunblade); g.add(armR); g.userData.rightArm = armR; g.userData.club = sunblade;

        const legs = [];
        [-0.45, 0.45].forEach(side => {
            const leg = new THREE.Group(); leg.position.set(side * s, s * 0.95, 0);
            const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.32, s * 0.9, 6, 8), astralMat);
            legMesh.position.y = -s * 0.45; leg.add(legMesh); g.add(leg); legs.push(leg);
        });
        g.userData.legs = legs;

        // Radiant Celestial Ground Aura
        const starAura = new THREE.Mesh(new THREE.RingGeometry(s * 1.4, s * 2.2, 32), starMat);
        starAura.rotation.x = -Math.PI / 2; starAura.position.y = 0.05; g.add(starAura);
        g.userData.bossAura = starAura;
    }
    // ==================== REGULAR MONSTERS FOR ALL 10 ZONES ====================
    else if(type === 'swamp_snake'){
        // Zone 3: Coiled venomous swamp serpent
        const snMat = mat(0x286334, 0.7);
        for(let i = 0; i < 5; i++){
            const seg = new THREE.Mesh(new THREE.SphereGeometry(s * (0.35 - i * 0.04), 8, 8), snMat);
            seg.position.set(Math.sin(i * 0.8) * s * 0.4, s * 0.25 + i * 0.08, -i * s * 0.4);
            g.add(seg);
        }
        const hd = new THREE.Mesh(new THREE.ConeGeometry(s * 0.28, s * 0.5, 6), snMat);
        hd.position.set(0, s * 0.6, s * 0.3); hd.rotation.x = -Math.PI / 3; g.add(hd);
    }
    else if(type === 'mud_golem'){
        // Zone 3: Heavy Mud Golem
        const mudMat = mat(0x423220, 0.9);
        const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(s * 0.65, 0), mudMat);
        torso.position.y = s * 0.9; g.add(torso);
        const armL = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.25, s * 0.6, 6, 6), mudMat);
        armL.position.set(-s * 0.8, s * 0.8, 0); g.add(armL);
        const armR = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.25, s * 0.6, 6, 6), mudMat);
        armR.position.set(s * 0.8, s * 0.8, 0); g.add(armR);
    }
    else if(type === 'desert_bandit'){
        // Zone 4: Desert Bandit with curved scimitar
        const bMat = mat(0xa88548, 0.8);
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.35, s * 0.5, 6, 6), bMat);
        torso.position.y = s * 0.9; g.add(torso);
        const turban = new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 8, 8), mat(0xdedede));
        turban.position.y = s * 1.55; g.add(turban);
    }
    else if(type === 'sand_worm'){
        // Zone 4: Segmented Sand Worm bursting from dunes
        const wMat = mat(0xcfa055, 0.85);
        for(let i = 0; i < 4; i++){
            const ring = new THREE.Mesh(new THREE.CylinderGeometry(s * (0.45 - i * 0.08), s * (0.5 - i * 0.08), s * 0.35, 8), wMat);
            ring.position.y = s * 0.3 + i * s * 0.3; g.add(ring);
        }
    }
    else if(type === 'crystal_spider'){
        // Zone 6: Multi-legged crystal spider
        const spMat = new THREE.MeshStandardMaterial({color: 0x8844aa, roughness: 0.2, metalness: 0.5});
        const spBody = new THREE.Mesh(new THREE.DodecahedronGeometry(s * 0.45, 0), spMat);
        spBody.position.y = s * 0.45; g.add(spBody);
        for(let i = 0; i < 6; i++){
            const ang = (i / 6) * Math.PI * 2;
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.04, s * 0.06, s * 0.8, 4), spMat);
            leg.position.set(Math.cos(ang) * s * 0.5, s * 0.3, Math.sin(ang) * s * 0.5);
            leg.rotation.z = Math.cos(ang) * 0.6; leg.rotation.x = Math.sin(ang) * 0.6; g.add(leg);
        }
    }
    else if(type === 'shadow_guard'){
        // Zone 6: Shadow Guard in dark obsidian armor
        const shMat = mat(0x241433, 0.5, 0.5);
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.38, s * 0.6, 6, 8), shMat);
        torso.position.y = s * 1.0; g.add(torso);
        const helm = new THREE.Mesh(new THREE.ConeGeometry(s * 0.3, s * 0.6, 5), shMat);
        helm.position.y = s * 1.7; g.add(helm);
    }
    else if(type === 'flame_hound'){
        // Zone 7: Quadruped Flame Hound with flaming mane
        const hMat = mat(0xd43815, 0.7);
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.38, s * 0.8, 6, 8), hMat);
        body.rotation.x = Math.PI / 2; body.position.y = s * 0.55; g.add(body);
        const mane = new THREE.Mesh(new THREE.DodecahedronGeometry(s * 0.45, 0), new THREE.MeshBasicMaterial({color: 0xff6600}));
        mane.position.set(0, s * 0.8, s * 0.4); g.add(mane);
    }
    else if(type === 'lava_demon'){
        // Zone 7: Horned Lava Demon
        const lvMat = mat(0x6e140a, 0.7);
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.45, s * 0.7, 6, 8), lvMat);
        torso.position.y = s * 1.1; g.add(torso);
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.22, 0), new THREE.MeshBasicMaterial({color: 0xff3300}));
        core.position.set(0, s * 1.1, s * 0.35); g.add(core);
    }
    else if(type === 'storm_bird'){
        // Zone 8: Storm Bird with electric crest
        const bMat = mat(0x426899, 0.6);
        const body = new THREE.Mesh(new THREE.ConeGeometry(s * 0.4, s * 0.9, 6), bMat);
        body.position.y = s * 0.9; body.rotation.x = -0.5; g.add(body);
        [-0.6, 0.6].forEach(side => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(s * 0.8, s * 0.05, s * 0.4), bMat);
            wing.position.set(side * s * 0.6, s * 1.0, 0); g.add(wing);
        });
    }
    else if(type === 'armored_titan'){
        // Zone 8: Armored Titan Juggernaut
        const tMat = mat(0x2a384d, 0.4, 0.8);
        const torso = new THREE.Mesh(new THREE.BoxGeometry(s * 0.9, s * 1.1, s * 0.6), tMat);
        torso.position.y = s * 1.1; g.add(torso);
    }
    else if(type === 'wraith_knight'){
        // Zone 9: Spectral Wraith Knight
        const wMat = mat(0x222638, 0.6, 0.4);
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.38, s * 0.65, 6, 8), wMat);
        torso.position.y = s * 1.0; g.add(torso);
        const shroud = new THREE.Mesh(new THREE.ConeGeometry(s * 0.5, s * 1.2, 5), new THREE.MeshBasicMaterial({color: 0x111626, transparent: true, opacity: 0.8}));
        shroud.position.y = s * 0.8; g.add(shroud);
    }
    else if(type === 'soul_eater'){
        // Zone 9: Floating Soul Eater Horror
        const seMat = new THREE.MeshBasicMaterial({color: 0x161929, transparent: true, opacity: 0.85});
        const orb = new THREE.Mesh(new THREE.SphereGeometry(s * 0.55, 8, 8), seMat);
        orb.position.y = s * 0.9; g.add(orb);
        const eye = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.2, 0), new THREE.MeshBasicMaterial({color: 0xee2299}));
        eye.position.set(0, s * 0.9, s * 0.4); g.add(eye);
    }
    else if(type === 'cosmic_guardian'){
        // Zone 10: Cosmic Sentinel
        const cMat = new THREE.MeshStandardMaterial({color: 0x2b1d4a, roughness: 0.25, metalness: 0.85});
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.42, s * 0.7, 6, 8), cMat);
        torso.position.y = s * 1.1; g.add(torso);
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.25, 0), new THREE.MeshBasicMaterial({color: 0xdf88ff}));
        star.position.set(0, s * 1.1, s * 0.38); g.add(star);
    }
    else if(type === 'void_watcher'){
        // Zone 10: Void Watcher Floating Cosmic Eye
        const eyeMat = new THREE.MeshBasicMaterial({color: 0xdf88ff});
        const eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 12, 12), eyeMat);
        eye.position.y = s * 1.1; g.add(eye);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(s * 0.75, s * 0.05, 6, 20), new THREE.MeshBasicMaterial({color: 0x7722cc}));
        ring.position.y = s * 1.1; ring.rotation.x = Math.PI / 3; g.add(ring);
    }

    g.traverse(child => {
        if(child.isMesh) child.userData.monsterParent = g;
    });

    return g;
}

// ==================== 3D BILLBOARD HEALTH BAR ===============
function makeHPBar(){
    const bg = new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 0.08),
        new THREE.MeshBasicMaterial({color:0x1b1b1b, side:THREE.DoubleSide, depthTest:false, transparent:true, opacity:0.88})
    );
    bg.renderOrder = 998;

    const fg = new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 0.08),
        new THREE.MeshBasicMaterial({color:0xff3333, side:THREE.DoubleSide, depthTest:false, transparent:true, opacity:0.95})
    );
    fg.position.z = 0.005; fg.renderOrder = 999;

    const grp = new THREE.Group();
    grp.add(bg); grp.add(fg);
    grp.userData.fg = fg;
    return grp;
}

// Window Globals
window.makeTree = makeTree;
window.makeRock = makeRock;
window.makeCactus = makeCactus;
window.makeDesertRock = makeDesertRock;
window.makeIceSpire = makeIceSpire;
window.makeSnowTree = makeSnowTree;
window.makeBasaltPillar = makeBasaltPillar;
window.makeLavaCrack = makeLavaCrack;
window.createPlayerWeapon = createPlayerWeapon;
window.buildCompleteCharacter = buildCompleteCharacter;
window.rebuildPlayerCharacter = rebuildPlayerCharacter;
window.monsterModel = monsterModel;
window.makeHPBar = makeHPBar;
