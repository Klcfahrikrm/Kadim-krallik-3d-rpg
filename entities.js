// ============================================================
//  Fantasy Quest – Entities & Combat Module
//  (Player controls, raycast targeting, aiming reticle, abilities,
//   ultimates, monster AI, 4-Biome Bosses, stats, permadeath)
// ============================================================

// ==================== 1-100 LEVEL MONSTER STAT CALCULATION ============
function calculateMonsterStats(type, targetLevel = null){
    const d = MON[type];
    if(!d) return { hp: 50, atk: 8, exp: 30, lvl: 1 };

    let lvl = targetLevel;
    if(!lvl){
        if(d.isBoss){
            lvl = d.lvl;
        } else {
            const pLvl = (G.player && G.player.level) ? G.player.level : 1;
            lvl = Math.max(d.lvl, Math.min(d.lvl + 14, pLvl));
        }
    }
    lvl = Math.min(100, Math.max(1, lvl));

    // Exact mathematical formulas requested by user:
    // Canavar Canı (HP): BaseHP * (1 + (Level * 0.45) + Math.pow(Level, 1.42) * 0.18)
    // Canavar Hasarı: BaseDamage * (1 + (Level * 0.28) + Math.pow(Level, 1.25) * 0.10)
    const hpMult = 1 + (lvl * 0.45) + Math.pow(lvl, 1.42) * 0.18;
    const atkMult = 1 + (lvl * 0.28) + Math.pow(lvl, 1.25) * 0.10;
    const expMult = 1 + (lvl * 0.30) + Math.pow(lvl, 1.35) * 0.12;

    const hp = Math.max(15, Math.round(d.hp * hpMult));
    const atk = Math.max(3, Math.round(d.atk * atkMult));
    const exp = Math.max(20, Math.round(d.exp * expMult));

    return { hp, atk, exp, lvl };
}

// ==================== SPAWN MONSTERS ========================
function spawnMonster(type, x, z, fixedLevel = null){
    const d = MON[type];
    if(!d) return null;
    const model = monsterModel(type);
    model.position.set(x, 0, z);
    scene.add(model);

    const hpBar = makeHPBar();
    const isBoss = d.isBoss || false;
    const barH = isBoss ? d.sz * 2.95 : type === 'troll' || type === 'frost_troll' || type === 'golem' ? d.sz * 2.8 : type === 'boar' ? d.sz * 1.65 : d.sz * 2.1;
    hpBar.position.set(x, barH, z);
    if(isBoss) hpBar.scale.set(2.2, 1.4, 1);
    scene.add(hpBar);

    const stats = calculateMonsterStats(type, fixedLevel);

    const m = {
        type, model, hpBar, barH,
        sz: d.sz, isBoss: isBoss,
        level: stats.lvl,
        hp: stats.hp, maxHp: stats.hp, atk: stats.atk, exp: stats.exp,
        spawnX: x, spawnZ: z,
        alive: true, state: 'idle',
        lastAtk: 0, idleAng: rng(0, Math.PI * 2), idleT: 0,
        respawnTimer: 0,
    };
    model.userData.sz = d.sz;
    model.userData.monsterObj = m;
    G.monsters.push(m);
    return m;
}

// ==================== 4-TIER WORLD BOSS SYSTEM ===================
function spawnBoss(type){
    const d = MON[type];
    if(!d || !d.arenaPos) return null;
    const existing = G.monsters.find(m => m.type === type);
    if(existing){
        if(!existing.alive){
            const stats = calculateMonsterStats(type, d.lvl);
            existing.hp = existing.maxHp = stats.hp;
            existing.atk = stats.atk;
            existing.alive = true;
            existing.model.position.set(d.arenaPos.x, 0, d.arenaPos.z);
            existing.model.visible = true;
            existing.hpBar.visible = true;
            existing.state = 'idle';
        }
        return existing;
    }
    const b = spawnMonster(type, d.arenaPos.x, d.arenaPos.z, d.lvl);
    if(typeof sfx !== 'undefined' && sfx.playThunder) sfx.playThunder();
    if(typeof notify === 'function') notify(`⚡ KADİM DÜNYA BOSS'U BELİRDİ: ${d.name} (${d.arenaPos.x}, ${d.arenaPos.z})!`, 'warn');
    return b;
}

function spawnBossUrGathok(){ return spawnBoss('boss_urgathok'); }
function spawnBossGorgar(){ return spawnBoss('boss_gorgar'); }
function spawnBossMorghul(){ return spawnBoss('boss_morghul'); }
function spawnBossAmunKhet(){ return spawnBoss('boss_amunkhet'); }
function spawnBossYmirath(){ return spawnBoss('boss_ymirath'); }
function spawnBossRiftBreaker(){ return spawnBoss('boss_riftbreaker'); }
function spawnBossKharDraz(){ return spawnBoss('boss_khardraz'); }
function spawnBossRaikor(){ return spawnBoss('boss_raikor'); }
function spawnBossVaneHelm(){ return spawnBoss('boss_vanehelm'); }
function spawnBossAethelgard(){ return spawnBoss('boss_aethelgard'); }

// 10-Zone Monster Population Across Rectangular Map
(function spawnAllMonsters(){
    // Helper to spawn group in a rectangle
    function spawnZoneGroup(type, count, minX, maxX, minZ, maxZ, avoidCenterDist = 0){
        for(let i = 0; i < count; i++){
            let x, z;
            do {
                x = rng(minX, maxX);
                z = rng(minZ, maxZ);
            } while(avoidCenterDist > 0 && Math.hypot(x, z) < avoidCenterDist);
            spawnMonster(type, x, z);
        }
    }

    // Zone 1 (1-10): Zümrüt Vadi (Z: -50 to 45)
    spawnZoneGroup('slime', 7, -80, 80, -45, 42, 22);
    spawnZoneGroup('wolf', 6, -85, 85, -45, 42, 24);

    // Zone 2 (11-20): Kızıl Çoraklık (Z: 55 to 105)
    spawnZoneGroup('boar', 6, -85, 85, 56, 104);
    spawnZoneGroup('scorpion', 6, -85, 85, 58, 105);

    // Zone 3 (21-30): Lanetli Bataklık (Z: 115 to 165)
    spawnZoneGroup('swamp_snake', 6, -85, 85, 116, 164);
    spawnZoneGroup('mud_golem', 5, -85, 85, 118, 165);

    // Zone 4 (31-40): Kayıp Çöl & Vaha (Z: 175 to 225)
    spawnZoneGroup('desert_bandit', 6, -85, 85, 176, 224);
    spawnZoneGroup('sand_worm', 5, -85, 85, 178, 225);

    // Zone 5 (41-50): Donmuş Geçit (Z: 235 to 285)
    spawnZoneGroup('frost_wolf', 6, -85, 85, 236, 284);
    spawnZoneGroup('frost_troll', 5, -85, 85, 238, 285);

    // Zone 6 (51-60): Obsidyen Kanyon (Z: 295 to 345)
    spawnZoneGroup('crystal_spider', 6, -85, 85, 296, 344);
    spawnZoneGroup('shadow_guard', 5, -85, 85, 298, 345);

    // Zone 7 (61-70): Kızıl Cehennem Ağzı (Z: 355 to 405)
    spawnZoneGroup('flame_hound', 6, -85, 85, 356, 404);
    spawnZoneGroup('lava_demon', 5, -85, 85, 358, 405);

    // Zone 8 (71-80): Fırtına Tepeleri (Z: 415 to 465)
    spawnZoneGroup('storm_bird', 6, -85, 85, 416, 464);
    spawnZoneGroup('armored_titan', 5, -85, 85, 418, 465);

    // Zone 9 (81-90): Karanlık Ruhlar Diyarı (Z: 475 to 525)
    spawnZoneGroup('wraith_knight', 6, -85, 85, 476, 524);
    spawnZoneGroup('soul_eater', 5, -85, 85, 478, 525);

    // Zone 10 (91-100): Kadim Kozmik Taht (Z: 535 to 615)
    spawnZoneGroup('cosmic_guardian', 6, -85, 85, 536, 614);
    spawnZoneGroup('void_watcher', 5, -85, 85, 538, 615);

    // Pre-place all 10 World Bosses in their respective landmark arenas
    spawnBoss('boss_gorgar');
    spawnBoss('boss_urgathok');
    spawnBoss('boss_morghul');
    spawnBoss('boss_amunkhet');
    spawnBoss('boss_ymirath');
    spawnBoss('boss_riftbreaker');
    spawnBoss('boss_khardraz');
    spawnBoss('boss_raikor');
    spawnBoss('boss_vanehelm');
    spawnBoss('boss_aethelgard');
})();

// Towering Boss Beacon Light Beam
(function createBossBeacon(){
    const beaconGeo = new THREE.CylinderGeometry(0.35, 0.45, 45, 12);
    const beaconMat = new THREE.MeshBasicMaterial({color: 0xff1800, transparent: true, opacity: 0.45, side: THREE.DoubleSide});
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 22.5, 68);
    beacon.visible = false;
    scene.add(beacon);
    G.bossBeacon = beacon;
})();

// ==================== INPUT HANDLERS ========================
(function setupInput(){
    document.addEventListener('keydown', e => {
        G.keys[e.code] = true;
        G.keys[e.key.toLowerCase()] = true;
        if(e.code === 'KeyI' || e.key.toLowerCase() === 'i') toggleInventory();
        if(e.code === 'KeyC' || e.key.toLowerCase() === 'c') toggleStats();
        if(e.code === 'Digit1' || e.key === '1') usePotion();
        if(e.code === 'Digit2' || e.key === '2' || e.code === 'KeyQ' || e.key.toLowerCase() === 'q') castElementalSkill();
        if(e.code === 'KeyR' || e.key.toLowerCase() === 'r' || e.code === 'Digit3' || e.key === '3') castUltimateSkill();
    });
    document.addEventListener('keyup', e => {
        G.keys[e.code] = false;
        G.keys[e.key.toLowerCase()] = false;
    });
    window.addEventListener('blur', () => {
        G.keys = {};
        G.cam.rmb = false;
        G.cam.lmb = false;
    });

    canvas.addEventListener('mousedown', e => {
        sfx.init();
        if(e.button === 2) {
            G.cam.rmb = true;
        } else if(e.button === 0) {
            G.cam.lmb = true;
            if(G.running) handleRaycastClick(e);
        }
    });

    window.addEventListener('mouseup', e => {
        if(e.button === 2) G.cam.rmb = false;
        if(e.button === 0) G.cam.lmb = false;
    });

    window.addEventListener('mousemove', e => {
        if(G.cam.rmb){
            G.cam.theta -= e.movementX * 0.0045;
            G.cam.phi = Math.max(0.18, Math.min(Math.PI / 2.05, G.cam.phi - e.movementY * 0.0045));
        }
    });

    canvas.addEventListener('wheel', e => {
        G.cam.dist = Math.max(CAM_MIN_DIST, Math.min(CAM_MAX_DIST, G.cam.dist + e.deltaY * 0.012));
    }, { passive: true });

    document.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if(window.composer) window.composer.setSize(window.innerWidth, window.innerHeight);
    });
})();

// ==================== RAYCAST TARGETING =====================
function handleRaycastClick(event){
    mouseVec2.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseVec2.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVec2, camera);

    const isRanged = (G.player.className === 'mage' || G.player.className === 'archer');
    const effectiveRange = isRanged ? 36.0 : ATTACK_RANGE;

    const hitObjects = [];
    G.monsters.forEach(m => {
        if(m.alive && m.model.visible) hitObjects.push(m.model);
    });

    const intersects = raycaster.intersectObjects(hitObjects, true);
    if(intersects.length > 0){
        let hit = intersects[0].object;
        while(hit && !hit.userData.monsterObj && hit.parent){
            hit = hit.parent;
        }
        if(hit && hit.userData.monsterObj){
            const targetM = hit.userData.monsterObj;
            G.target = targetM;
            const pp = playerGroup.position;
            const dx = targetM.model.position.x - pp.x;
            const dz = targetM.model.position.z - pp.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            playerGroup.rotation.y = Math.atan2(dx, dz);

            if(dist <= effectiveRange){
                performAttack(targetM);
            } else if(!isRanged) {
                notify(`Hedef uzakta: ${MON[targetM.type]?.name || 'Canavar'} (Saldırmak için yaklaş)`, 'warn');
            } else {
                performAttack(targetM);
            }
            return;
        }
    }

    performAttack(null);
}

// ==================== CAMERA UPDATE & TRAUMA SHAKE ==========
const BASE_CAMERA_FOV = 54;
const idealCamPos = new THREE.Vector3(0, 10, 18);
let camShakeTime = 0;

function addCameraTrauma(amount, fovPunch = 0){
    G.cam.trauma = Math.min(1.0, (G.cam.trauma || 0) + amount);
    if(fovPunch > 0){
        camera.fov = Math.max(30, camera.fov - fovPunch);
        camera.updateProjectionMatrix();
    }
}

function updateCamera(dt){
    const dtSafe = Math.min(dt || 0.016, 0.05);
    const c = G.cam, pp = playerGroup.position;

    // 1. Orbital position around player
    const ox = c.dist * Math.sin(c.phi) * Math.sin(c.theta);
    const oy = c.dist * Math.cos(c.phi);
    const oz = c.dist * Math.sin(c.phi) * Math.cos(c.theta);

    const tx = pp.x + ox;
    const ty = Math.max(pp.y + oy + 1.8, 1.4);
    const tz = pp.z + oz;

    const smooth = 0.16;
    idealCamPos.x += (tx - idealCamPos.x) * smooth;
    idealCamPos.y += (ty - idealCamPos.y) * smooth;
    idealCamPos.z += (tz - idealCamPos.z) * smooth;

    // 2. FOV Punch recovery: spring back to BASE_CAMERA_FOV
    if(Math.abs(camera.fov - BASE_CAMERA_FOV) > 0.05){
        camera.fov = THREE.MathUtils.lerp(camera.fov, BASE_CAMERA_FOV, 10.0 * dtSafe);
        camera.updateProjectionMatrix();
    } else if(camera.fov !== BASE_CAMERA_FOV){
        camera.fov = BASE_CAMERA_FOV;
        camera.updateProjectionMatrix();
    }

    // 3. Trauma Decay: Shake = Trauma^2 (Non-linear quadratic decay)
    c.trauma = Math.max(0, (c.trauma || 0) - 1.5 * dtSafe);
    const shake = c.trauma * c.trauma;

    const targetLookAt = new THREE.Vector3(pp.x, pp.y + 1.45, pp.z);

    if(shake > 0.0001){
        camShakeTime += dtSafe * 55.0;
        const t = camShakeTime;

        // Amplitudes (Balanced by 50% for solid, grounded ARPG combat feel: 0.65 units offset, 0.055 rad roll)
        const maxTranslation = 0.65;
        const maxRoll = 0.055;

        // Harmonic trigonometric offsets
        const localX = (Math.sin(t * 1.1) + Math.cos(t * 2.3) * 0.45) * (maxTranslation * shake);
        const localY = (Math.cos(t * 1.3) + Math.sin(t * 2.7) * 0.45) * (maxTranslation * 0.75 * shake);
        const localZ = (Math.sin(t * 1.7) * 0.3) * (maxTranslation * shake);
        const roll   = (Math.sin(t * 1.5) + Math.cos(t * 0.85) * 0.5) * (maxRoll * shake);

        camera.position.copy(idealCamPos);
        camera.lookAt(targetLookAt);

        // Transform local offset by camera orientation
        const shakeOffset = new THREE.Vector3(localX, localY, localZ);
        shakeOffset.applyQuaternion(camera.quaternion);
        camera.position.add(shakeOffset);

        camera.lookAt(targetLookAt);

        if(Math.abs(roll) > 0.0001){
            const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll);
            camera.quaternion.multiply(rollQuat);
        }
    } else {
        camera.position.copy(idealCamPos);
        camera.lookAt(targetLookAt);
    }
}

// ==================== MOVEMENT, DUST, BARRIER & ANIMATION ============
let lastDustTime = 0;
let lastGateWarningTime = 0;

function triggerGateSealWarning(reqLvl = 10, barrierObj = null){
    const now = performance.now();
    if(barrierObj){
        if(barrierObj.light) barrierObj.light.intensity = 4.5;
        if(barrierObj.mesh && barrierObj.mesh.material) barrierObj.mesh.material.emissiveIntensity = 3.5;
    } else if(G.gateBarrierLight){
        G.gateBarrierLight.intensity = 4.5;
        if(G.gateBarrierMesh && G.gateBarrierMesh.material) G.gateBarrierMesh.material.emissiveIntensity = 3.5;
    }

    if(now - lastGateWarningTime > 2600){
        lastGateWarningTime = now;
        if(typeof sfx !== 'undefined' && sfx.playFireball) sfx.playFireball();
        addCameraTrauma(0.10);
        notify(`⚠️ Bu geçit Kadim Mühür ile kilitli! (Gereken Seviye: ${reqLvl})`, 'warn');
    }
}

function updateMovement(dt){
    if(!G.player.alive) return;
    const k = G.keys;
    let fwd = 0, rgt = 0;
    if(k['KeyW'] || k['w'] || k['ArrowUp'] || k['arrowup'])    fwd += 1;
    if(k['KeyS'] || k['s'] || k['ArrowDown'] || k['arrowdown'])  fwd -= 1;
    if(k['KeyA'] || k['a'] || k['ArrowLeft'] || k['arrowleft'])  rgt -= 1;
    if(k['KeyD'] || k['d'] || k['ArrowRight'] || k['arrowright']) rgt += 1;
    if(G.cam.lmb && G.cam.rmb) fwd += 1;

    // SPRINT (Shift)
    const isSprint = (k['ShiftLeft'] || k['ShiftRight'] || k['shift']);
    const speedMult = isSprint ? 1.45 : 1.0;

    // JUMP (Space)
    if((k['Space'] || k[' '] || k['space']) && G.player.onGround){
        G.player.vy = 0.22;
        G.player.onGround = false;
        sfx.playSwing();
        spawnFootstepDust(playerGroup.position);
    }

    // Apply vertical physics
    if(!G.player.onGround){
        playerGroup.position.y += G.player.vy;
        G.player.vy -= 0.012;
        if(playerGroup.position.y <= 0){
            playerGroup.position.y = 0;
            G.player.vy = 0;
            G.player.onGround = true;
            spawnFootstepDust(playerGroup.position);
        }
    }

    G.isMoving = (fwd !== 0 || rgt !== 0);

    if(G.isMoving){
        const len = Math.sqrt(fwd * fwd + rgt * rgt);
        fwd /= len; rgt /= len;

        const th = G.cam.theta;
        const fx = -Math.sin(th), fz = -Math.cos(th);
        const rx =  Math.cos(th), rz = -Math.sin(th);

        const currentSpd = (G.player.speed || PLAYER_BASE_SPEED) * speedMult;
        const mx = (fx * fwd + rx * rgt) * currentSpd;
        const mz = (fz * fwd + rz * rgt) * currentSpd;

        // WALL SLIDING PHYSICS: Decoupled X and Z motion collision test
        const targetX = playerGroup.position.x + mx;
        const targetZ = playerGroup.position.z + mz;
        let resolvedX = targetX;
        let resolvedZ = targetZ;

        if(typeof resolveMovementSliding === 'function'){
            const res = resolveMovementSliding(playerGroup.position.x, playerGroup.position.z, targetX, targetZ, 0.55);
            resolvedX = res.x;
            resolvedZ = res.z;
        }

        playerGroup.position.x = clamp(resolvedX, -98.0, 98.0);
        playerGroup.position.z = clamp(resolvedZ, -58.0, 626.0);

        const targetRot = Math.atan2(mx, mz);
        let diff = targetRot - playerGroup.rotation.y;
        while(diff >  Math.PI) diff -= Math.PI * 2;
        while(diff < -Math.PI) diff += Math.PI * 2;
        playerGroup.rotation.y += diff * 0.28;

        // Balanced banking/tilt along Z axis (50% reduction for grounded stride: 0.14 rad)
        const directBank = (rgt !== 0) ? -rgt * 0.14 : -diff * 0.9;
        const turnLean = clamp(directBank, -0.14, 0.14);
        playerTorso.rotation.z = lerp(playerTorso.rotation.z, turnLean, 0.28);

        G.walkCycle += dt * (isSprint ? 15 : 10.5);
        // Solid, rhythmic stride leg & arm swing angles (~0.75 rad)
        const swing = Math.sin(G.walkCycle) * 0.75;
        if(G.player.onGround){
            leftLeg.rotation.x = swing;
            rightLeg.rotation.x = -swing;
        } else {
            leftLeg.rotation.x = 0.55;
            rightLeg.rotation.x = -0.45;
        }
        leftArm.rotation.x = -swing * 0.85;
        if(G.attackAnim <= 0){
            rightArm.rotation.x = swing * 0.75;
        }
        playerCape.rotation.x = -0.22 - Math.abs(Math.sin(G.walkCycle)) * (isSprint ? 0.65 : 0.45);

        // Tok ve dengeli Y-ekseni yaylanması (0.16 birim genlik - 50% azaltılmış)
        playerTorso.position.y = 1.35 + Math.abs(Math.sin(G.walkCycle)) * 0.16;

        const now = performance.now();
        if(now - lastDustTime > (isSprint ? 110 : 180)){
            lastDustTime = now;
            spawnFootstepDust(playerGroup.position, mx, mz);
        }
    } else {
        if(G.player.onGround){
            leftLeg.rotation.x *= 0.8;
            rightLeg.rotation.x *= 0.8;
        }
        leftArm.rotation.x *= 0.8;
        if(G.attackAnim <= 0){
            rightArm.rotation.x *= 0.8;
        }
        playerTorso.rotation.z = lerp(playerTorso.rotation.z, 0, 0.18);
        const breath = Math.sin(performance.now() * 0.003) * 0.025;
        playerTorso.position.y = 1.35 + breath;
        playerCape.rotation.x = -0.05 + breath * 2;
    }

    // 10-ZONE GATE BARRIERS INTERACTION & REQUISITE LEVEL CHECK
    if(window.gateBarriers && window.gateBarriers.length > 0){
        const curLvl = G.player.level || 1;
        const px = playerGroup.position.x;
        const pz = playerGroup.position.z;

        for(let bi = 0; bi < window.gateBarriers.length; bi++){
            const b = window.gateBarriers[bi];
            if(curLvl >= b.requiredLevel){
                if(!b.isUnlocked){
                    b.isUnlocked = true;
                    b.group.visible = false;
                    if(b.obstacle) b.obstacle.active = false;
                    notify(`🔓 ${b.name} AÇILDI! (Seviye ${b.requiredLevel}+)`, 'xp');
                    if(typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
                }
            } else {
                // Locked Barrier Proximity check (X within archway, Z touching barrier)
                if(Math.abs(px) < 4.8 && Math.abs(pz - b.z) < 3.2){
                    triggerGateSealWarning(b.requiredLevel, b);
                    if(pz < b.z) playerGroup.position.z = Math.min(playerGroup.position.z, b.z - 1.4);
                    else playerGroup.position.z = Math.max(playerGroup.position.z, b.z + 1.4);
                }
            }
        }
    }

    // Mage rotating crystal orb & orbital rune ring
    if(playerStaffOrb){
        playerStaffOrb.rotation.y += dt * 2.5;
        playerStaffOrb.rotation.x += dt * 1.5;
    }
    if(playerStaffRing){
        playerStaffRing.rotation.z += dt * 3.5;
        playerStaffRing.rotation.y += dt * 2.0;
    }
}

// ==================== OBJECT POOLING SYSTEM (PERFORMANCE) ====================
window.ParticlePool = {
    sparks: [],
    rings: [],
    dust: []
};
const ParticlePool = window.ParticlePool;

window.ProjectilePool = {
    magicBolt: [],
    arrow: [],
    bladeWave: [],
    cataclysmOrb: [],
    piercingArrow: [],
    enemyOrb: []
};
const ProjectilePool = window.ProjectilePool;

function spawnPooledSpark(pos, color, vel, life = 0.45, customScale = 1.0){
    let mesh;
    if(ParticlePool.sparks.length > 0){
        mesh = ParticlePool.sparks.pop();
        mesh.material.color.set(color);
        mesh.position.copy(pos);
        mesh.scale.set(customScale, customScale, customScale);
        mesh.visible = true;
    } else {
        mesh = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.12, 0),
            new THREE.MeshBasicMaterial({ color: color })
        );
        mesh.position.copy(pos);
        mesh.scale.set(customScale, customScale, customScale);
        scene.add(mesh);
    }
    G.particles.push({ mesh, vel, life, type: 'spark' });
    return mesh;
}

function spawnPooledRing(pos, color, expandSpeed, life = 0.55, customScale = 1.0){
    let mesh;
    if(ParticlePool.rings.length > 0){
        mesh = ParticlePool.rings.pop();
        mesh.material.color.set(color);
        mesh.material.opacity = 0.95;
        mesh.position.copy(pos);
        mesh.rotation.x = -Math.PI / 2;
        mesh.scale.set(customScale, customScale, customScale);
        mesh.visible = true;
    } else {
        mesh = new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.8, 24),
            new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.copy(pos);
        mesh.scale.set(customScale, customScale, customScale);
        scene.add(mesh);
    }
    G.particles.push({ mesh, vel: new THREE.Vector3(), isRing: true, expandSpeed, life, type: 'ring' });
    return mesh;
}

function spawnPooledDust(pos, color = 0xb59e7a, vel, life = 0.45, customScale = 1.0){
    let mesh;
    if(ParticlePool.dust.length > 0){
        mesh = ParticlePool.dust.pop();
        mesh.material.color.set(color);
        mesh.material.opacity = 0.7;
        mesh.position.copy(pos);
        mesh.scale.set(customScale, customScale, customScale);
        mesh.visible = true;
    } else {
        mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 5, 5),
            new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7 })
        );
        mesh.position.copy(pos);
        mesh.scale.set(customScale, customScale, customScale);
        scene.add(mesh);
    }
    G.particles.push({ mesh, vel, life, isDust: true, type: 'dust' });
    return mesh;
}

function recycleProjectile(p){
    p.group.visible = false;
    if(ProjectilePool[p.type]){
        ProjectilePool[p.type].push(p.group);
    } else {
        scene.remove(p.group);
    }
}

function spawnFootstepDust(pos, dirX = 0, dirZ = 0){
    const dustCount = 3;
    for(let i = 0; i < dustCount; i++){
        const p = new THREE.Vector3(
            pos.x + rng(-0.16, 0.16),
            0.08 + rng(0, 0.06),
            pos.z + rng(-0.16, 0.16)
        );
        const backX = -dirX * rng(0.03, 0.08) + rng(-0.015, 0.015);
        const backZ = -dirZ * rng(0.03, 0.08) + rng(-0.015, 0.015);
        const upY   = rng(0.015, 0.035);
        spawnPooledDust(p, 0xb59e7a, new THREE.Vector3(backX, upY, backZ), 0.45, rng(0.7, 1.3));
    }
}

// ==================== MOUSE RAYCASTING & AIMING =============
const mouseScreen = new THREE.Vector2(0, 0);
const aimRaycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let lastAimPoint = new THREE.Vector3(0, 0, -10);

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseScreen.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseScreen.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    aimRaycaster.setFromCamera(mouseScreen, camera);
    const hit = new THREE.Vector3();
    if(aimRaycaster.ray.intersectPlane(groundPlane, hit)){
        lastAimPoint.copy(hit);
    }
});

// ==================== VISUAL ABILITY GROUND RETICLE & TRAJECTORY =
const aimReticleGroup = new THREE.Group();

const reticleOuterRing = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.38, 32),
    new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
);
reticleOuterRing.rotation.x = -Math.PI / 2;
aimReticleGroup.add(reticleOuterRing);

const reticleInnerRune = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.45, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
);
reticleInnerRune.rotation.x = -Math.PI / 2;
aimReticleGroup.add(reticleInnerRune);

const crossMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
const crossH = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.8), crossMat);
crossH.rotation.x = -Math.PI / 2;
const crossV = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.08), crossMat);
crossV.rotation.x = -Math.PI / 2;
aimReticleGroup.add(crossH);
aimReticleGroup.add(crossV);

const aimBeamMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.32, side: THREE.DoubleSide });
const aimBeam = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 1), aimBeamMat);
aimBeam.rotation.x = -Math.PI / 2;
scene.add(aimBeam);

scene.add(aimReticleGroup);

function updateAimReticle(dt){
    if(!G.running || !G.player.alive){
        aimReticleGroup.visible = false;
        aimBeam.visible = false;
        return;
    }
    aimReticleGroup.visible = true;
    aimBeam.visible = true;

    aimReticleGroup.position.set(lastAimPoint.x, 0.05, lastAimPoint.z);
    reticleInnerRune.rotation.z += dt * 2.2;

    const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
    reticleOuterRing.material.color.set(elem.color);
    reticleInnerRune.material.color.set(elem.glowColor);
    crossMat.color.set(elem.color);
    aimBeamMat.color.set(elem.color);

    const isMage = G.player.className === 'mage';
    const isArcher = G.player.className === 'archer';
    const scale = isMage ? 1.15 : (isArcher ? 0.72 : 0.95);
    aimReticleGroup.scale.set(scale, scale, scale);

    const pp = playerGroup.position;
    const dx = lastAimPoint.x - pp.x;
    const dz = lastAimPoint.z - pp.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    aimBeam.position.set(pp.x + dx * 0.5, 0.04, pp.z + dz * 0.5);
    aimBeam.scale.set(1, dist, 1);
    aimBeam.rotation.z = Math.atan2(dx, dz);
}

function getAimDirection(origin){
    aimRaycaster.setFromCamera(mouseScreen, camera);
    const hit = new THREE.Vector3();
    let target = lastAimPoint;
    if(aimRaycaster.ray.intersectPlane(groundPlane, hit)){
        target = hit;
        lastAimPoint.copy(hit);
    }
    const dir = new THREE.Vector3(target.x - origin.x, 0, target.z - origin.z);
    if(dir.lengthSq() < 0.001){
        dir.set(Math.sin(playerGroup.rotation.y), 0, Math.cos(playerGroup.rotation.y));
    } else {
        dir.normalize();
    }
    // Orient player character towards aim direction
    playerGroup.rotation.y = Math.atan2(dir.x, dir.z);
    return dir;
}

function dealDamageToMonster(target, baseAtk, critChance, tag = ''){
    if(!target || !target.alive) return;
    const crit = Math.random() < (critChance || 0.18);
    const dmg = Math.max(1, Math.floor(baseAtk + rng(-2, 4))) * (crit ? 2 : 1);
    target.hp -= dmg;

    // 45ms hit-stop micro freeze for crunchy ARPG impact feel
    G.hitStopTimer = 0.045;

    // Critical Hit: Heavy FOV Punch (16 degrees) + Strong Trauma (+0.50 trauma)
    if(crit){
        addCameraTrauma(0.50, 16);
    }

    sfx.playHit();
    flashMesh(target.model);
    spawnDmgNumber(target.model.position, dmg, crit ? 'crit' : tag);

    const pp = playerGroup.position;
    const kx = target.model.position.x - pp.x;
    const kz = target.model.position.z - pp.z;
    const klen = Math.sqrt(kx * kx + kz * kz) || 1;
    if(target.type !== 'boss_urgathok'){
        target.model.position.x += (kx / klen) * 0.18;
        target.model.position.z += (kz / klen) * 0.18;
    }

    const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
    const sparkCount = Math.floor(rng(8, 13));
    for(let k = 0; k < sparkCount; k++){
        const spPos = target.model.position.clone();
        spPos.y += rng(0.4, 1.4);
        const theta = rng(0, Math.PI * 2);
        const phi = rng(0, Math.PI);
        const speed = rng(0.08, 0.22);
        const vel = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed + rng(0.02, 0.08),
            Math.sin(phi) * Math.sin(theta) * speed
        );
        const sparkCol = crit ? 0xffea00 : (Math.random() > 0.35 ? elem.color : elem.glowColor);
        spawnPooledSpark(spPos, sparkCol, vel, rng(0.35, 0.75), rng(0.7, 1.3));
    }

    if(target.state === 'idle') target.state = 'chase';
    G.target = target;

    if(target.hp <= 0){
        killMonster(target);
    }
}

// ==================== ATTACK SYSTEM =========================
function performAttack(explicitTarget = null){
    if(!G.player.alive) return;
    const now = performance.now();
    if(now - G.player.lastAtk < ATTACK_COOLDOWN_MS) return;
    G.player.lastAtk = now;
    G.attackAnim = 1.0;

    const className = G.player.className || 'warrior';
    const pp = playerGroup.position;
    const aimDir = getAimDirection(pp);

    if(className === 'warrior'){
        sfx.playSwing();
        const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
        if(playerSlashArc){
            playerSlashArc.material.color.set(elem.color);
            playerSlashArc.material.opacity = 0.95;
            if(playerSlashArc.userData && playerSlashArc.userData.innerArc){
                playerSlashArc.userData.innerArc.material.opacity = 0.9;
            }
        }
        // Shed 4-6 blade tip sparks along the swing arc
        for(let s = 0; s < 5; s++){
            const ang = Math.atan2(aimDir.x, aimDir.z) + rng(-0.6, 0.6);
            const dist = rng(1.2, 2.2);
            const spPos = new THREE.Vector3(pp.x + Math.sin(ang) * dist, 1.25 + rng(-0.2, 0.2), pp.z + Math.cos(ang) * dist);
            const vel = new THREE.Vector3(aimDir.x * 0.05 + rng(-0.02, 0.02), rng(0.02, 0.06), aimDir.z * 0.05 + rng(-0.02, 0.02));
            spawnPooledSpark(spPos, elem.glowColor, vel, rng(0.3, 0.5), rng(0.6, 1.0));
        }

        let target = explicitTarget;
        if(!target || !target.alive){
            let bestDist = ATTACK_RANGE;
            G.monsters.forEach(m => {
                if(!m.alive) return;
                const dx = m.model.position.x - pp.x;
                const dz = m.model.position.z - pp.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if(dist < bestDist){
                    bestDist = dist;
                    target = m;
                }
            });
        }
        if(!target || !target.alive) return;
        dealDamageToMonster(target, G.player.atk, G.player.critChance);
    }
    else if(className === 'mage'){
        sfx.playShoot();
        spawnMagicBolt(pp, aimDir);
    }
    else if(className === 'archer'){
        sfx.playShoot();
        spawnArrow(pp, aimDir);
    }
}

function spawnMagicBolt(origin, dir){
    const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
    let boltGrp, halo;
    if(ProjectilePool.magicBolt.length > 0){
        boltGrp = ProjectilePool.magicBolt.pop();
        const d = boltGrp.userData;
        d.boltMesh.material.color.set(elem.color);
        d.halo.material.color.set(elem.glowColor);
        d.pLight.color.set(elem.color);
        if(d.mote1) d.mote1.material.color.set(elem.glowColor);
        if(d.mote2) d.mote2.material.color.set(0xffffff);
        halo = d.halo;
    } else {
        boltGrp = new THREE.Group();
        const boltMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.24, 8, 8),
            new THREE.MeshBasicMaterial({ color: elem.color })
        );
        boltGrp.add(boltMesh);

        halo = new THREE.Mesh(
            new THREE.SphereGeometry(0.38, 6, 6),
            new THREE.MeshBasicMaterial({ color: elem.glowColor, transparent: true, opacity: 0.6 })
        );
        boltGrp.add(halo);

        // 2 Fast-Orbiting Luminous Spark Motes
        const moteGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const mote1 = new THREE.Mesh(moteGeo, new THREE.MeshBasicMaterial({ color: elem.glowColor }));
        const mote2 = new THREE.Mesh(moteGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        boltGrp.add(mote1);
        boltGrp.add(mote2);

        const pLight = new THREE.PointLight(elem.color, 1.8, 10);
        boltGrp.add(pLight);
        boltGrp.userData = { boltMesh, halo, pLight, mote1, mote2 };
        scene.add(boltGrp);
    }

    boltGrp.position.set(origin.x + dir.x * 0.8, 1.45, origin.z + dir.z * 0.8);
    boltGrp.visible = true;

    const speed = 0.75;
    G.projectiles.push({
        group: boltGrp,
        halo,
        orbitAngle: 0,
        vx: dir.x * speed,
        vz: dir.z * speed,
        distTraveled: 0,
        maxDist: 34,
        element: G.player.element,
        elemConfig: elem,
        type: 'magicBolt',
        radius: 0.28,
        dmg: G.player.atk * 1.15
    });
}

function spawnArrow(origin, dir){
    const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
    // Bow muzzle shockwave ring on release
    spawnPooledRing(new THREE.Vector3(origin.x + dir.x * 0.85, 1.35, origin.z + dir.z * 0.85), elem.glowColor, 6.5, 0.22, 0.65);

    let arrowGrp;
    if(ProjectilePool.arrow.length > 0){
        arrowGrp = ProjectilePool.arrow.pop();
    } else {
        arrowGrp = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({color:0x6b4423, roughness:0.8});
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 4), woodMat);
        shaft.rotation.x = Math.PI / 2;
        arrowGrp.add(shaft);

        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.2, 4), new THREE.MeshStandardMaterial({color:0xd4d8dc, metalness:0.9, roughness:0.2}));
        tip.position.z = 0.6; tip.rotation.x = Math.PI / 2;
        arrowGrp.add(tip);

        const fletchMat = new THREE.MeshBasicMaterial({color:0x2d6a4f});
        [-0.04, 0.04].forEach(ox => {
            const f = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 4), fletchMat);
            f.rotation.x = Math.PI / 2;
            f.position.set(ox, 0, -0.45);
            arrowGrp.add(f);
        });
        scene.add(arrowGrp);
    }

    arrowGrp.position.set(origin.x + dir.x * 0.8, 1.35, origin.z + dir.z * 0.8);
    arrowGrp.rotation.y = Math.atan2(dir.x, dir.z);
    arrowGrp.visible = true;

    const speed = 0.95;
    G.projectiles.push({
        group: arrowGrp,
        vx: dir.x * speed,
        vz: dir.z * speed,
        distTraveled: 0,
        maxDist: 40,
        type: 'arrow',
        radius: 0.25,
        dmg: G.player.atk * 1.05,
        critChance: (G.player.critChance || 0.35)
    });
}

function flashMesh(grp){
    grp.traverse(c => {
        if(c.isMesh && c.material && c.material.emissive){
            c.material.emissive.set(0xffffff);
            setTimeout(() => {
                if(c && c.material && c.material.emissive) c.material.emissive.set(0x000000);
            }, 120);
        }
    });
}

function updateAttackAnim(dt){
    if(G.attackAnim > 0){
        G.attackAnim -= dt * 4.2;
        if(G.attackAnim < 0) G.attackAnim = 0;

        // 1. Radical Anticipation (~0.1s: 1.0 -> 0.72)
        // Torso coils backward 45-60 degrees (-0.85 rad) and pulls back
        if(G.attackAnim > 0.72){
            const antiP = (1.0 - G.attackAnim) / 0.28;
            playerTorso.rotation.y = -0.85 * antiP; // 45-55 deg torso coil back
            playerTorso.position.z = -0.28 * antiP;
            playerTorso.scale.z = 1.0 - 0.08 * antiP;
            playerTorso.scale.y = 1.0 + 0.05 * antiP;
            rightArm.rotation.x = -Math.PI * 0.65 - antiP * 0.45;
            if(playerWeapon) playerWeapon.rotation.z = -antiP * 0.55;
            if(playerSlashArc){
                playerSlashArc.material.opacity = 0;
                if(playerSlashArc.userData && playerSlashArc.userData.innerArc) playerSlashArc.userData.innerArc.material.opacity = 0;
            }
        }
        // 2. Radical Strike & Explosive Stretch (0.72 -> 0.22)
        // Torso snaps forward (+0.80 rad), scale.z launches to 1.25, forward lunge
        else if(G.attackAnim > 0.22){
            const strikeP = (0.72 - G.attackAnim) / 0.50;
            playerTorso.rotation.y = lerp(-0.85, 0.80, strikeP);
            playerTorso.scale.z = 1.25; // 1.25 forward stretch!
            playerTorso.scale.y = 0.90; // squash & stretch
            playerTorso.position.z = 0.35 * Math.sin(strikeP * Math.PI);
            rightArm.rotation.x = -Math.PI * 0.62 + strikeP * (Math.PI * 1.35);
            if(playerWeapon) playerWeapon.rotation.z = Math.sin(strikeP * Math.PI) * 1.35;

            // Arc trail follows blade tip in element color with luminous glow
            if(playerSlashArc && G.player.className === 'warrior'){
                const op = Math.sin(strikeP * Math.PI) * 1.0;
                playerSlashArc.material.opacity = op;
                if(playerSlashArc.userData && playerSlashArc.userData.innerArc){
                    playerSlashArc.userData.innerArc.material.opacity = op * 0.9;
                }
                playerSlashArc.rotation.z = -1.25 + strikeP * 2.85;
                playerSlashArc.scale.set(1.2 + strikeP * 0.25, 1.2 + strikeP * 0.25, 1.2);
            }
        }
        // 3. Elastic Spring Settle (0.22 -> 0, within ~0.15s)
        // Smoothly springs back to 1.0 scale and resets rotation
        else {
            const recovP = G.attackAnim / 0.22;
            playerTorso.scale.z = 1.0 + 0.25 * recovP;
            playerTorso.scale.y = 1.0 - 0.10 * recovP;
            playerTorso.position.z = 0.35 * recovP;
            playerTorso.rotation.y = 0.80 * recovP;
            rightArm.rotation.x = rightArm.rotation.x * 0.8;
            if(playerWeapon) playerWeapon.rotation.z *= 0.8;
            if(playerSlashArc){
                playerSlashArc.material.opacity = recovP * 0.3;
                if(playerSlashArc.userData && playerSlashArc.userData.innerArc) playerSlashArc.userData.innerArc.material.opacity = recovP * 0.3;
            }
        }
    } else {
        playerTorso.scale.set(1, 1, 1);
        playerTorso.position.z = 0;
        playerTorso.rotation.y = 0;
        if(playerSlashArc){
            playerSlashArc.material.opacity = 0;
            if(playerSlashArc.userData && playerSlashArc.userData.innerArc) playerSlashArc.userData.innerArc.material.opacity = 0;
        }
    }
}

// ==================== CLASS-SPECIFIC ELEMENTAL ABILITIES ====
function castElementalSkill(){
    if(!G.player.alive || !G.running) return;
    sfx.init();

    const now = performance.now();
    const cdMs = (G.player.skillCd || 3.4) * 1000;
    const elapsed = now - G.player.lastSkillTime;

    if(elapsed < cdMs){
        const remainSec = ((cdMs - elapsed) / 1000).toFixed(1);
        notify(`Yetenek doluyor! (${remainSec}s)`, 'warn');
        return;
    }

    G.player.lastSkillTime = now;
    G.attackAnim = 0.85;

    const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
    const pp = playerGroup.position;
    const aimDir = getAimDirection(pp);
    const className = G.player.className || 'warrior';

    if(className === 'warrior'){
        sfx.playSwing();
        sfx.playBlast();
        let waveGrp, crescent;
        if(ProjectilePool.bladeWave.length > 0){
            waveGrp = ProjectilePool.bladeWave.pop();
            crescent = waveGrp.userData.crescent;
            crescent.material.color.set(elem.color);
            waveGrp.userData.pLight.color.set(elem.color);
        } else {
            waveGrp = new THREE.Group();
            const crescentGeo = new THREE.RingGeometry(0.6, 1.6, 16, 1, 0, Math.PI * 0.8);
            const crescentMat = new THREE.MeshBasicMaterial({color: elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0.95});
            crescent = new THREE.Mesh(crescentGeo, crescentMat);
            crescent.rotation.x = -Math.PI / 2;
            crescent.rotation.z = Math.PI / 2 - 0.4;
            waveGrp.add(crescent);

            const pLight = new THREE.PointLight(elem.color, 2.0, 12);
            waveGrp.add(pLight);
            waveGrp.userData = { crescent, pLight };
            scene.add(waveGrp);
        }

        waveGrp.position.set(pp.x + aimDir.x * 0.9, 0.4, pp.z + aimDir.z * 0.9);
        waveGrp.rotation.y = Math.atan2(aimDir.x, aimDir.z);
        waveGrp.visible = true;

        const speed = 0.72;
        G.projectiles.push({
            group: waveGrp,
            crescent,
            vx: aimDir.x * speed,
            vz: aimDir.z * speed,
            distTraveled: 0,
            maxDist: 30,
            element: G.player.element,
            elemConfig: elem,
            type: 'bladeWave',
            piercing: true,
            hitMonsters: new Set(),
            radius: 1.2
        });
        notify(`⚔️ ${elem.name} Kılıç Dalgası!`);
    }
    else if(className === 'mage'){
        sfx.playShoot();
        let orbGrp, halo, ring;
        if(ProjectilePool.cataclysmOrb.length > 0){
            orbGrp = ProjectilePool.cataclysmOrb.pop();
            const d = orbGrp.userData;
            d.core.material.color.set(elem.color);
            d.halo.material.color.set(elem.glowColor);
            d.ring.material.color.set(elem.glowColor);
            d.pLight.color.set(elem.lightColor);
            halo = d.halo;
            ring = d.ring;
        } else {
            orbGrp = new THREE.Group();
            const core = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.65, 1),
                new THREE.MeshBasicMaterial({ color: elem.color })
            );
            orbGrp.add(core);

            halo = new THREE.Mesh(
                new THREE.SphereGeometry(0.95, 8, 8),
                new THREE.MeshBasicMaterial({ color: elem.glowColor, transparent: true, opacity: 0.6 })
            );
            orbGrp.add(halo);

            ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.05, 0.08, 6, 16),
                new THREE.MeshBasicMaterial({ color: elem.glowColor, transparent: true, opacity: 0.8 })
            );
            orbGrp.add(ring);

            const pLight = new THREE.PointLight(elem.lightColor, 2.8, 20);
            orbGrp.add(pLight);
            orbGrp.userData = { core, halo, ring, pLight };
            scene.add(orbGrp);
        }

        orbGrp.position.set(pp.x + aimDir.x * 1.0, 1.5, pp.z + aimDir.z * 1.0);
        orbGrp.visible = true;

        const speed = 0.62;
        G.projectiles.push({
            group: orbGrp,
            halo, ring,
            vx: aimDir.x * speed,
            vz: aimDir.z * speed,
            distTraveled: 0,
            maxDist: 35,
            element: G.player.element,
            elemConfig: elem,
            type: 'cataclysmOrb',
            radius: 0.65
        });
        notify(`🪄 ${elem.name} Kıyamet Küresi!`);
    }
    else if(className === 'archer'){
        sfx.playShoot();
        let arrowGrp, vortex;
        if(ProjectilePool.piercingArrow.length > 0){
            arrowGrp = ProjectilePool.piercingArrow.pop();
            const d = arrowGrp.userData;
            d.shaft.material.color.set(elem.color);
            d.tip.material.color.set(elem.glowColor);
            d.vortex.material.color.set(elem.glowColor);
            d.pLight.color.set(elem.color);
            vortex = d.vortex;
        } else {
            arrowGrp = new THREE.Group();
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.035, 0.035, 1.4, 6),
                new THREE.MeshBasicMaterial({ color: elem.color })
            );
            shaft.rotation.x = Math.PI / 2;
            arrowGrp.add(shaft);

            const tip = new THREE.Mesh(
                new THREE.ConeGeometry(0.1, 0.35, 5),
                new THREE.MeshBasicMaterial({ color: elem.glowColor })
            );
            tip.position.z = 0.8; tip.rotation.x = Math.PI / 2;
            arrowGrp.add(tip);

            vortex = new THREE.Mesh(
                new THREE.TorusGeometry(0.35, 0.04, 6, 16),
                new THREE.MeshBasicMaterial({ color: elem.glowColor, transparent: true, opacity: 0.75 })
            );
            vortex.position.z = 0.2;
            arrowGrp.add(vortex);

            const pLight = new THREE.PointLight(elem.color, 2.2, 14);
            arrowGrp.add(pLight);
            arrowGrp.userData = { shaft, tip, vortex, pLight };
            scene.add(arrowGrp);
        }

        arrowGrp.position.set(pp.x + aimDir.x * 1.0, 1.4, pp.z + aimDir.z * 1.0);
        arrowGrp.rotation.y = Math.atan2(aimDir.x, aimDir.z);
        arrowGrp.visible = true;

        const speed = 1.15;
        G.projectiles.push({
            group: arrowGrp,
            vortex,
            vx: aimDir.x * speed,
            vz: aimDir.z * speed,
            distTraveled: 0,
            maxDist: 42,
            element: G.player.element,
            elemConfig: elem,
            type: 'piercingArrow',
            piercing: true,
            hitMonsters: new Set(),
            radius: 0.45
        });
        notify(`🏹 ${elem.name} Delici Fırtına Oku!`);
    }
}

// ==================== ULTIMATE ABILITIES (LEVEL 10) =============
function unlockUltimateSkill(){
    const ultSlot = document.getElementById('slot-ult');
    if(ultSlot) ultSlot.classList.remove('locked');
    const ultLock = document.getElementById('ult-lock');
    if(ultLock) ultLock.classList.add('hidden');
    sfx.playThunder();
    notify('⚜️ KADİM ULTİ YETENEĞİNİZ UYANDI! (Tuş: R) ⚜️', 'item');
}

function castUltimateSkill(){
    if(!G.player.alive || !G.running) return;
    sfx.init();

    const now = performance.now();
    const cdMs = (G.player.ultCd || 12.0) * 1000;
    const elapsed = now - (G.player.lastUltTime !== undefined ? G.player.lastUltTime : -999999);
    if(elapsed < cdMs){
        const remainSec = ((cdMs - elapsed) / 1000).toFixed(1);
        notify(`Kadim Ulti doluyor! (${remainSec}s)`, 'warn');
        return;
    }

    G.player.lastUltTime = now;
    const pp = playerGroup.position;
    const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
    const className = G.player.className || 'warrior';

    // R Ultimate detonation: Major screen shake (+0.85 trauma) & Deep FOV zoom punch (16 degrees)
    addCameraTrauma(0.85, 16);

    if(className === 'warrior'){
        G.player.isWhirlwind = true;
        G.player.whirlwindEndTime = now + 3200;
        G.player.lastWhirlHit = 0;
        sfx.playThunder();
        notify(`⚔️ KILIÇ FIRTINASI! Çevredeki düşmanlar biçiliyor!`);

        // 3-Tiered Whirlwind Rings (Lower, Mid, Upper)
        const r1 = new THREE.Mesh(
            new THREE.RingGeometry(0.8, 2.5, 24),
            new THREE.MeshBasicMaterial({ color: elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        );
        r1.rotation.x = -Math.PI / 2;
        r1.position.y = 0.35;
        playerGroup.add(r1);

        const r2 = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 3.2, 28),
            new THREE.MeshBasicMaterial({ color: elem.glowColor, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        r2.rotation.x = -Math.PI / 2;
        r2.position.y = 1.35;
        playerGroup.add(r2);

        const r3 = new THREE.Mesh(
            new THREE.RingGeometry(1.5, 3.8, 28),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
        );
        r3.rotation.x = -Math.PI / 2;
        r3.position.y = 2.25;
        playerGroup.add(r3);

        G.particles.push({ mesh: r1, isRing: true, expandSpeed: 0.8, life: 3.2 });
        G.particles.push({ mesh: r2, isRing: true, expandSpeed: 0.8, life: 3.2 });
        G.particles.push({ mesh: r3, isRing: true, expandSpeed: 0.8, life: 3.2 });
    }
    else if(className === 'mage'){
        sfx.playThunder();
        notify(`🪄 KOZMİK METEOR YAĞMURU! Gökten alevli meteorlar düşüyor!`);
        const targetPos = lastAimPoint.clone();

        for(let i = 0; i < 6; i++){
            G.activeMeteors.push({
                delay: i * 0.14,
                targetX: targetPos.x + rng(-1.5, 1.5),
                targetZ: targetPos.z + rng(-1.5, 1.5),
                currentY: 26 + i * 3.5,
                elem
            });
        }
    }
    else if(className === 'archer'){
        sfx.playThunder();
        notify(`🏹 GÖK YARAN OK YAĞMURU! Hedef alana oklar yağıyor!`);
        G.player.vy = 0.25;
        G.player.onGround = false;
        const targetPos = lastAimPoint.clone();

        // Skyward Flare Arrow
        const flareArrow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2, 6), new THREE.MeshBasicMaterial({ color: 0xffea55 }));
        flareArrow.position.set(pp.x, pp.y + 1.5, pp.z);
        scene.add(flareArrow);
        G.particles.push({ mesh: flareArrow, vel: new THREE.Vector3(0, 48, 0), life: 0.65 });
        spawnPooledRing(pp, 0xffea55, 8.0, 0.4, 1.2);

        G.arrowRainZones.push({
            x: targetPos.x,
            z: targetPos.z,
            life: 2.8,
            lastSpawn: 0,
            elem
        });

        const rainRing = new THREE.Mesh(
            new THREE.RingGeometry(0.35, 2.8, 28),
            new THREE.MeshBasicMaterial({ color: elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        );
        rainRing.rotation.x = -Math.PI / 2;
        rainRing.position.set(targetPos.x, 0.06, targetPos.z);
        scene.add(rainRing);
        G.particles.push({ mesh: rainRing, isRing: true, expandSpeed: 0.6, life: 2.8 });
    }
}

function updateWhirlwind(dt){
    if(!G.player.isWhirlwind) return;
    const now = performance.now();
    if(now > G.player.whirlwindEndTime){
        G.player.isWhirlwind = false;
        sfx.playBlast();
        const shock = new THREE.Mesh(
            new THREE.RingGeometry(0.5, 3.2, 28),
            new THREE.MeshBasicMaterial({ color: 0xffdd44, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
        );
        shock.rotation.x = -Math.PI / 2;
        shock.position.set(playerGroup.position.x, 0.08, playerGroup.position.z);
        scene.add(shock);
        G.particles.push({ mesh: shock, isRing: true, expandSpeed: 6.5, life: 0.5 });
        addCameraTrauma(0.5, 4);
        return;
    }

    playerGroup.rotation.y += dt * 26;
    rightArm.rotation.x = Math.PI / 4;
    leftArm.rotation.x = Math.PI / 4;

    if(now - G.player.lastWhirlHit > 220){
        G.player.lastWhirlHit = now;
        sfx.playSwing();
        const pp = playerGroup.position;
        const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
        const baseDmg = Math.round(G.player.atk * 1.5 * (G.player.skillPowerMult || 1.0));

        // Expanding Ground Energy Fissure Crack Wave
        spawnPooledRing(new THREE.Vector3(pp.x, 0.06, pp.z), elem.color, 7.5, 0.45, 1.2);
        for(let sp = 0; sp < 4; sp++){
            const theta = rng(0, Math.PI * 2);
            const vel = new THREE.Vector3(Math.cos(theta) * 0.12, rng(0.04, 0.08), Math.sin(theta) * 0.12);
            spawnPooledSpark(new THREE.Vector3(pp.x, 0.2, pp.z), elem.glowColor, vel, 0.35, 0.8);
        }

        G.monsters.forEach(m => {
            if(!m.alive) return;
            const dx = m.model.position.x - pp.x;
            const dz = m.model.position.z - pp.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if(dist <= 5.2){
                m.model.position.x -= dx * 0.16;
                m.model.position.z -= dz * 0.16;
                dealDamageToMonster(m, baseDmg, G.player.critChance, 'whirlwind');
            }
        });
    }
}

function updateUltimates(dt){
    updateWhirlwind(dt);

    // Mage Meteors
    for(let i = G.activeMeteors.length - 1; i >= 0; i--){
        const m = G.activeMeteors[i];
        if(m.delay > 0){
            m.delay -= dt;
            continue;
        }

        m.currentY -= dt * 42;
        if(m.currentY <= 0.2){
            sfx.playBlast();
            addCameraTrauma(0.95, 18); // Cataclysmic meteor impact: massive shake (+0.95) & deep FOV punch (18 deg)!
            const impactPos = new THREE.Vector3(m.targetX, 0.08, m.targetZ);

            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.3, 1.4, 20),
                new THREE.MeshBasicMaterial({ color: m.elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.copy(impactPos);
            scene.add(ring);
            G.particles.push({ mesh: ring, isRing: true, expandSpeed: 5.5, life: 0.55 });

            for(let k = 0; k < 10; k++){
                const spk = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(rng(0.14, 0.24), 0),
                    new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? m.elem.color : 0xffdd44 })
                );
                spk.position.copy(impactPos);
                const theta = rng(0, Math.PI * 2);
                const vel = new THREE.Vector3(Math.cos(theta) * rng(0.12, 0.25), rng(0.1, 0.25), Math.sin(theta) * rng(0.12, 0.25));
                scene.add(spk);
                G.particles.push({ mesh: spk, vel, life: 0.7 });
            }

            const dmg = Math.round(G.player.atk * 2.2 * (G.player.skillPowerMult || 1.0));
            G.monsters.forEach(tgt => {
                if(!tgt.alive) return;
                const dx = tgt.model.position.x - m.targetX;
                const dz = tgt.model.position.z - m.targetZ;
                if(Math.sqrt(dx * dx + dz * dz) <= 4.0){
                    dealDamageToMonster(tgt, dmg, G.player.critChance, 'meteor');
                }
            });

            G.activeMeteors.splice(i, 1);
        }
    }

    // Archer Arrow Rain
    for(let i = G.arrowRainZones.length - 1; i >= 0; i--){
        const z = G.arrowRainZones[i];
        z.life -= dt;
        const now = performance.now();
        if(now - z.lastSpawn > 90){
            z.lastSpawn = now;
            const ax = z.x + rng(-2.0, 2.0);
            const az = z.z + rng(-2.0, 2.0);

            const arrow = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.65, 4),
                new THREE.MeshBasicMaterial({ color: z.elem.glowColor })
            );
            arrow.rotation.x = Math.PI;
            arrow.position.set(ax, 15, az);
            scene.add(arrow);
            G.particles.push({
                mesh: arrow,
                vel: new THREE.Vector3(0, -32, 0),
                life: 0.5
            });

            // Impact shock & ground embedding sparks
            spawnPooledRing(new THREE.Vector3(ax, 0.05, az), z.elem.glowColor, 4.5, 0.25, 0.55);
            for(let sp = 0; sp < 3; sp++){
                const vel = new THREE.Vector3(rng(-0.06, 0.06), rng(0.04, 0.09), rng(-0.06, 0.06));
                spawnPooledSpark(new THREE.Vector3(ax, 0.08, az), z.elem.glowColor, vel, 0.3, 0.6);
            }

            const dmg = Math.round(G.player.atk * 0.9 * (G.player.skillPowerMult || 1.0));
            G.monsters.forEach(tgt => {
                if(!tgt.alive) return;
                const dx = tgt.model.position.x - ax;
                const dz = tgt.model.position.z - az;
                if(Math.sqrt(dx * dx + dz * dz) <= 2.2){
                    dealDamageToMonster(tgt, dmg, G.player.critChance * 1.5, 'arrow');
                }
            });
        }

        if(z.life <= 0){
            G.arrowRainZones.splice(i, 1);
        }
    }
}

// ==================== PROJECTILES & PARTICLES ===============
function spawnEnemyProjectile(origin, targetPos, type, damage, sourceMonster){
    const dx = targetPos.x - origin.x;
    const dz = targetPos.z - origin.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const dirX = dx / len;
    const dirZ = dz / len;

    const isFrost = type === 'frost_mage';
    const color = isFrost ? 0x44ddff : 0xaa22ff;
    const emissive = isFrost ? 0x1188cc : 0x660099;

    let grp, ring;
    if(ProjectilePool.enemyOrb.length > 0){
        grp = ProjectilePool.enemyOrb.pop();
        const d = grp.userData;
        d.core.material.color.set(color);
        d.core.material.emissive.set(emissive);
        d.ring.material.color.set(color);
        ring = d.ring;
    } else {
        grp = new THREE.Group();
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 8, 8),
            new THREE.MeshStandardMaterial({color: color, emissive: emissive, emissiveIntensity: 1.4, roughness: 0.2})
        );
        grp.add(core);

        ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.42, 0.06, 6, 12),
            new THREE.MeshBasicMaterial({color: color, wireframe: true})
        );
        grp.add(ring);
        grp.userData = { core, ring };
        scene.add(grp);
    }

    grp.position.set(origin.x, 1.25, origin.z);
    grp.visible = true;

    G.projectiles.push({
        group: grp,
        ring: ring,
        vx: dirX * 0.28,
        vz: dirZ * 0.28,
        distTraveled: 0,
        maxDist: 34,
        radius: 0.35,
        isEnemy: true,
        damage: damage,
        source: sourceMonster,
        element: isFrost ? 'ice' : 'shadow',
        type: 'enemyOrb'
    });
}

function updateProjectiles(dt){
    for(let i = G.projectiles.length - 1; i >= 0; i--){
        const p = G.projectiles[i];
        p.group.position.x += p.vx * (dt * 60);
        p.group.position.z += p.vz * (dt * 60);
        p.distTraveled += Math.sqrt(p.vx * p.vx + p.vz * p.vz) * (dt * 60);

        if(p.halo) p.halo.rotation.y += dt * 7;
        if(p.ring){
            p.ring.rotation.x += dt * 9;
            p.ring.rotation.y += dt * 6;
        }
        if(p.vortex) p.vortex.rotation.z += dt * 20;

        // Magic Bolt: 2 Orbiting Motes & Sparkle Trail
        if(p.type === 'magicBolt' && p.group.userData && p.group.userData.mote1){
            p.orbitAngle = (p.orbitAngle || 0) + dt * 16;
            const r = 0.38;
            p.group.userData.mote1.position.set(Math.cos(p.orbitAngle) * r, Math.sin(p.orbitAngle) * r, 0);
            p.group.userData.mote2.position.set(Math.cos(p.orbitAngle + Math.PI) * r, Math.sin(p.orbitAngle + Math.PI) * r, 0);
            if(Math.random() < 0.45){
                const col = p.elemConfig ? p.elemConfig.color : 0xaa66ff;
                spawnPooledSpark(p.group.position, col, new THREE.Vector3(rng(-0.02, 0.02), rng(-0.02, 0.02), rng(-0.02, 0.02)), 0.25, 0.45);
            }
        }
        // Arrow: Ribbon Sparkle Trail
        if(p.type === 'arrow'){
            if(Math.random() < 0.55){
                const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
                spawnPooledSpark(
                    new THREE.Vector3(p.group.position.x - p.vx * 0.35, p.group.position.y, p.group.position.z - p.vz * 0.35),
                    elem.glowColor,
                    new THREE.Vector3(rng(-0.01, 0.01), rng(0, 0.02), rng(-0.01, 0.01)),
                    0.24,
                    0.4
                );
            }
        }
        // Elemental projectile trails
        if(p.element === 'fire' && Math.random() < 0.35){
            spawnPooledSpark(p.group.position, 0xff4500, new THREE.Vector3(rng(-0.02, 0.02), rng(0.01, 0.04), rng(-0.02, 0.02)), 0.3, 0.5);
        }
        if(p.element === 'earth' && Math.random() < 0.35){
            spawnPooledDust(p.group.position, 0x8a6245, new THREE.Vector3(rng(-0.02, 0.02), 0.02, rng(-0.02, 0.02)), 0.3, 0.5);
        }

        // Projectile Line of Sight & Solid Obstacle Collision (Blocks damage behind walls/houses)
        if(typeof checkObstacleCollision === 'function'){
            const hitObs = checkObstacleCollision(p.group.position.x, p.group.position.z, p.radius || 0.4);
            if(hitObs){
                for(let k = 0; k < 6; k++){
                    const vel = new THREE.Vector3(rng(-0.06, 0.06), rng(0.02, 0.08), rng(-0.06, 0.06));
                    spawnPooledSpark(p.group.position, 0xffaa44, vel, 0.28, 0.6);
                }
                if(typeof sfx !== 'undefined' && sfx.playSwing) sfx.playSwing();
                recycleProjectile(p);
                G.projectiles.splice(i, 1);
                continue;
            }
        }

        // Enemy Projectile Collision with Player
        if(p.isEnemy){
            const pp = playerGroup.position;
            const pDist = dist2D(p.group.position.x, p.group.position.z, pp.x, pp.z);
            if(pDist <= (p.radius + 0.65)){
                damagePlayer(p.damage, p.source);
                sfx.playHurt();
                for(let k = 0; k < 6; k++){
                    const vel = new THREE.Vector3(rng(-0.06, 0.06), rng(0.03, 0.08), rng(-0.06, 0.06));
                    spawnPooledSpark(p.group.position, p.element === 'ice' ? 0x77eeff : 0xcc44ff, vel, 0.35, 0.8);
                }
                recycleProjectile(p);
                G.projectiles.splice(i, 1);
                continue;
            } else if(p.distTraveled >= p.maxDist){
                recycleProjectile(p);
                G.projectiles.splice(i, 1);
                continue;
            }
            continue;
        }

        if(p.piercing){
            for(let j = 0; j < G.monsters.length; j++){
                const m = G.monsters[j];
                if(!m.alive || p.hitMonsters.has(m)) continue;
                const dx = m.model.position.x - p.group.position.x;
                const dz = m.model.position.z - p.group.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if(dist <= (m.sz || 0.8) + p.radius + 0.4){
                    p.hitMonsters.add(m);
                    const baseDmg = G.player.atk * 1.8 * (p.elemConfig ? p.elemConfig.dmgMult : 1.0) * (G.player.skillPowerMult || 1.0);
                    dealDamageToMonster(m, baseDmg, G.player.critChance, p.element);
                }
            }

            if(p.distTraveled >= p.maxDist){
                recycleProjectile(p);
                G.projectiles.splice(i, 1);
            }
        }
        else {
            let hit = false;
            let hitTarget = null;
            for(let j = 0; j < G.monsters.length; j++){
                const m = G.monsters[j];
                if(!m.alive) continue;
                const dx = m.model.position.x - p.group.position.x;
                const dz = m.model.position.z - p.group.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                const colRadius = (m.sz || 0.8) + (p.radius || 0.3) + 0.45;
                if(dist <= colRadius){
                    hit = true;
                    hitTarget = m;
                    break;
                }
            }

            if(hit){
                detonateProjectile(p, hitTarget);
                G.projectiles.splice(i, 1);
            } else if(p.distTraveled >= p.maxDist){
                detonateProjectile(p, null);
                G.projectiles.splice(i, 1);
            }
        }
    }
}

function detonateProjectile(p, directTarget){
    const blastPos = p.group.position.clone();
    recycleProjectile(p);

    if(p.type === 'magicBolt'){
        sfx.playBlast();
        if(directTarget){
            dealDamageToMonster(directTarget, p.dmg, G.player.critChance, p.element);
        }
        for(let k = 0; k < 8; k++){
            const theta = rng(0, Math.PI * 2);
            const vel = new THREE.Vector3(Math.cos(theta) * 0.12, rng(0.02, 0.14), Math.sin(theta) * 0.12);
            spawnPooledSpark(blastPos, p.elemConfig.color, vel, 0.5, rng(0.8, 1.2));
        }
        return;
    }

    if(p.type === 'arrow'){
        sfx.playHit();
        if(directTarget){
            dealDamageToMonster(directTarget, p.dmg, p.critChance, 'arrow');
        }
        return;
    }

    // Elemental Skill Cataclysm Orb / AoE Detonation
    sfx.playBlast();
    const elem = p.elemConfig || ELEMENTS.fire;

    spawnPooledRing(blastPos, elem.color, 8.5, 0.65, 1.0);

    for(let k = 0; k < 20; k++){
        const theta = rng(0, Math.PI * 2);
        const phi = rng(0, Math.PI);
        const speed = rng(0.12, 0.3);
        const vel = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed + 0.08,
            Math.sin(phi) * Math.sin(theta) * speed
        );
        spawnPooledSpark(blastPos, Math.random() > 0.4 ? elem.color : elem.glowColor, vel, 1.0, rng(1.1, 2.0));
    }

    // 4 Elemental Special Ground Effects
    if(p.element === 'fire'){
        // Fire Ground Burning Lava Fissure / Flame Circle (lasts 1.5s with rising embers)
        const fissure = new THREE.Mesh(
            new THREE.RingGeometry(0.5, 4.4, 28),
            new THREE.MeshBasicMaterial({ color: 0xff3300, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
        );
        fissure.rotation.x = -Math.PI / 2;
        fissure.position.set(blastPos.x, 0.05, blastPos.z);
        scene.add(fissure);
        G.particles.push({ mesh: fissure, isLava: true, pos: blastPos.clone(), life: 1.5 });
    }
    else if(p.element === 'water' || p.element === 'ice'){
        // Frost Freeze Flash Ring & Shattering Ice Shards
        spawnPooledRing(blastPos, 0x77eeff, 9.0, 0.65, 1.4);
        for(let s = 0; s < 8; s++){
            const shard = new THREE.Mesh(
                new THREE.ConeGeometry(0.12, 0.7, 4),
                new THREE.MeshStandardMaterial({ color: 0xaeeeff, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 })
            );
            shard.position.copy(blastPos);
            const ang = (s / 8) * Math.PI * 2;
            const sVel = new THREE.Vector3(Math.cos(ang) * rng(0.12, 0.22), rng(0.08, 0.18), Math.sin(ang) * rng(0.12, 0.22));
            scene.add(shard);
            G.particles.push({ mesh: shard, vel: sVel, life: 0.65 });
        }
    }
    else if(p.element === 'earth'){
        // Tumbling Jagged Rock Debris & Earth Shockwave
        spawnPooledRing(blastPos, 0x8a6245, 7.5, 0.6, 1.3);
        for(let r = 0; r < 10; r++){
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(rng(0.14, 0.26), 0),
                new THREE.MeshStandardMaterial({ color: 0x6e5239, roughness: 0.9, flatShading: true })
            );
            rock.position.copy(blastPos);
            const theta = rng(0, Math.PI * 2);
            const rVel = new THREE.Vector3(Math.cos(theta) * rng(0.1, 0.22), rng(0.1, 0.22), Math.sin(theta) * rng(0.1, 0.22));
            scene.add(rock);
            G.particles.push({ mesh: rock, vel: rVel, life: 0.7 });
        }
    }
    else if(p.element === 'air'){
        // Upward Spiral Air Lift (spinning expanding vortex rings)
        for(let a = 0; a < 3; a++){
            const vRing = new THREE.Mesh(
                new THREE.TorusGeometry(0.6 + a * 0.4, 0.06, 6, 16),
                new THREE.MeshBasicMaterial({ color: 0xccffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
            );
            vRing.rotation.x = -Math.PI / 2;
            vRing.position.set(blastPos.x, blastPos.y + a * 0.4, blastPos.z);
            scene.add(vRing);
            G.particles.push({ mesh: vRing, isAirLift: true, vel: new THREE.Vector3(0, 0.08 + a * 0.04, 0), life: 0.65 });
        }
    }

    const aoeRadius = elem.aoe || 5.0;
    G.monsters.forEach(m => {
        if(!m.alive) return;
        const dx = m.model.position.x - blastPos.x;
        const dz = m.model.position.z - blastPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if(dist <= aoeRadius){
            const crit = Math.random() < (G.player.critChance || 0.18);
            const baseDmg = G.player.atk * 1.8 * elem.dmgMult * (G.player.skillPowerMult || 1.0);
            const finalDmg = Math.max(1, Math.floor(baseDmg + rng(-3, 6))) * (crit ? 2 : 1);

            m.hp -= finalDmg;
            flashMesh(m.model);
            spawnDmgNumber(m.model.position, finalDmg, crit ? 'crit' : p.element);

            if(m.state === 'idle') m.state = 'chase';
            G.target = m;

            if(m.hp <= 0){
                killMonster(m);
            }
        }
    });
}

function updateParticles(dt){
    for(let i = G.particles.length - 1; i >= 0; i--){
        const pt = G.particles[i];
        pt.life -= dt * 2.2;

        if(pt.isLava){
            pt.mesh.material.opacity = (pt.life / 1.5) * 0.85;
            if(Math.random() < 0.35){
                spawnPooledSpark(
                    new THREE.Vector3(pt.pos.x + rng(-2.0, 2.0), 0.1, pt.pos.z + rng(-2.0, 2.0)),
                    0xff5500,
                    new THREE.Vector3(rng(-0.02, 0.02), rng(0.04, 0.08), rng(-0.02, 0.02)),
                    0.35,
                    0.5
                );
            }
        } else if(pt.isAirLift){
            pt.mesh.position.add(pt.vel);
            pt.mesh.rotation.z += dt * 14;
            pt.mesh.scale.multiplyScalar(1 + dt * 1.5);
            pt.mesh.material.opacity = Math.max(0, pt.life * 1.2);
        } else if(pt.isRing){
            pt.mesh.scale.multiplyScalar(1 + dt * pt.expandSpeed);
            pt.mesh.material.opacity = Math.max(0, pt.life * 1.5);
        } else if(pt.isDust){
            pt.mesh.position.add(pt.vel);
            pt.vel.multiplyScalar(0.91);
            pt.mesh.scale.multiplyScalar(1 + dt * 0.85);
            pt.mesh.material.opacity = Math.max(0, pt.life * 1.6);
        } else {
            pt.mesh.position.add(pt.vel);
            pt.vel.y -= dt * 0.25;
            pt.mesh.scale.multiplyScalar(0.94);
        }

        if(pt.life <= 0 || pt.mesh.scale.x < 0.05){
            pt.mesh.visible = false;
            if(pt.type === 'spark') ParticlePool.sparks.push(pt.mesh);
            else if(pt.type === 'ring') ParticlePool.rings.push(pt.mesh);
            else if(pt.type === 'dust') ParticlePool.dust.push(pt.mesh);
            else scene.remove(pt.mesh); // fallback for any external meshes
            G.particles.splice(i, 1);
        }
    }
}

// ==================== STAT SYSTEM & ALLOCATION ==================
function recalculatePlayerStats(){
    const p = G.player;
    const c = CLASSES[p.className] || CLASSES.warrior;
    const isWar = p.className === 'warrior';
    const isMage = p.className === 'mage';
    const isArcher = p.className === 'archer';

    const baseHp = 100 + c.hpBonus;
    const baseAtk = 12 + c.atkBonus;
    const baseDef = c.defBonus;
    const baseCrit = 0.05 + c.critChance * 0.2;
    const baseSpd = PLAYER_BASE_SPEED + c.speedBonus;
    const baseSkill = c.skillPowerMult;

    // Exact formulas requested by user:
    // VIT: Maksimum canı BaseHP + VIT * 18 ve doğal zırhı VIT * 2.5 artırır
    p.maxHp = Math.round(baseHp + p.stats.vit * 18 + (p.level - 1) * 22);
    p.hp = Math.min(p.hp, p.maxHp);
    p.def = Math.round(baseDef + p.stats.vit * 2.5 + Math.floor(p.level * 0.8));

    // STR: Her puan yakın dövüş saldırısına BaseAtk + STR * 1.6 ve fiziksel darbe gücüne katkı
    const flatAtk = baseAtk + p.stats.str * 1.6 + (p.level - 1) * 2.5;
    const mainStatPct = 1.0 + (isWar ? (p.stats.str - 10) * 0.015 : isArcher ? (p.stats.dex - 10) * 0.015 : (p.stats.int - 10) * 0.018);
    p.atk = Math.round(flatAtk * Math.max(1.0, mainStatPct));

    // INT: Büyü hasarını yüzdesel olarak 1.0 + INT * 0.04 katına çıkarır
    p.skillPowerMult = Number((baseSkill * (1.0 + p.stats.int * 0.04)).toFixed(2));

    // DEX: Kritik vuruş şansını %5 + DEX * 0.18% artırır ve hareket hızına hafif bonus verir
    p.critChance = Math.min(0.85, 0.05 + p.stats.dex * 0.0018 + (p.level - 1) * 0.001);
    p.speed = Math.min(0.20, baseSpd + p.stats.dex * 0.0008);

    if(typeof updateHUD === 'function') updateHUD();
    if(typeof updateStatsSheet === 'function') updateStatsSheet();
}

function updateStatsSheet(){
    const p = G.player;
    const heroNameEl = document.getElementById('stat-hero-name');
    if(heroNameEl){
        const cName = CLASSES[p.className]?.name || 'Savaşçı';
        const eName = ELEMENTS[p.element]?.name || 'Ateş';
        heroNameEl.textContent = `${cName} [${eName}]`;
    }
    const heroLvlEl = document.getElementById('stat-hero-level');
    if(heroLvlEl) heroLvlEl.textContent = `Seviye ${p.level}`;
    const ptsEl = document.getElementById('stat-points-val');
    if(ptsEl) ptsEl.textContent = p.statPoints;

    ['str', 'int', 'dex', 'vit'].forEach(s => {
        const valEl = document.getElementById(`val-${s}`);
        if(valEl) valEl.textContent = p.stats[s];
        const btn = document.querySelector(`.stat-add-btn[data-stat="${s}"]`);
        if(btn){
            if(p.statPoints > 0){
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        }
    });

    const dHp = document.getElementById('derived-hp');
    if(dHp) dHp.textContent = p.maxHp;
    const dAtk = document.getElementById('derived-atk');
    if(dAtk) dAtk.textContent = p.atk;
    const dDef = document.getElementById('derived-def');
    if(dDef) dDef.textContent = p.def;
    const dCrit = document.getElementById('derived-crit');
    if(dCrit) dCrit.textContent = `%${Math.round(p.critChance * 100)}`;
    const dSpd = document.getElementById('derived-spd');
    if(dSpd) dSpd.textContent = p.speed > PLAYER_BASE_SPEED ? 'Çok Hızlı' : 'Normal';
    const dSkill = document.getElementById('derived-skill');
    if(dSkill) dSkill.textContent = `x${p.skillPowerMult.toFixed(2)}`;

    const badge = document.getElementById('stat-badge');
    if(badge){
        if(p.statPoints > 0){
            badge.textContent = p.statPoints;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function toggleStats(){
    const panel = document.getElementById('stats-panel');
    if(!panel) return;
    panel.classList.toggle('hidden');
    if(!panel.classList.contains('hidden')){
        updateStatsSheet();
    }
}

// ==================== PERMADEATH / RESTART LOGIC =================
function restartGameFromScratch(openHeroSelection = false){
    G.player.alive = true;
    G.player.level = 1;
    G.player.exp = 0;
    G.player.expNext = 100;
    G.player.statPoints = 0;
    G.player.kills = 0;
    G.player.isWhirlwind = false;
    G.bossSpawned = false;
    G.activeMeteors = [];
    G.arrowRainZones = [];

    if(G.player.className === 'warrior'){
        G.player.stats = { str: 14, int: 8, dex: 10, vit: 14 };
    } else if(G.player.className === 'mage'){
        G.player.stats = { str: 8, int: 16, dex: 10, vit: 10 };
    } else {
        G.player.stats = { str: 10, int: 10, dex: 16, vit: 10 };
    }
    recalculatePlayerStats();
    G.player.hp = G.player.maxHp;

    const ultSlot = document.getElementById('slot-ult');
    if(ultSlot) ultSlot.classList.remove('locked');
    const ultLock = document.getElementById('ult-lock');
    if(ultLock) ultLock.classList.add('hidden');

    G.player.inventory = { healthPotion: 2 };
    if(typeof renderInventory === 'function') renderInventory();

    playerGroup.position.set(0, 0, 6);
    playerGroup.rotation.y = Math.PI;

    G.monsters.forEach(m => {
        if(m.type === 'boss_urgathok'){
            m.alive = false;
            m.model.visible = false;
            m.hpBar.visible = false;
        } else {
            m.alive = true;
            m.hp = m.maxHp;
            m.model.position.set(m.spawnX, 0, m.spawnZ);
            m.model.visible = true;
            m.hpBar.visible = false;
            m.state = 'idle';
        }
    });
    if(G.bossBeacon) G.bossBeacon.visible = false;
    if(G.gateBarrier) G.gateBarrier.visible = true;
    G.target = null;
    document.getElementById('target-info').classList.add('hidden');
    document.getElementById('boss-bar-container').classList.add('hidden');
    document.getElementById('death-screen').classList.add('hidden');

    if(openHeroSelection){
        G.running = false;
        document.getElementById('instructions').classList.remove('hidden');
    } else {
        notify('⚔️ Macera Seviye 1\'den Baştan Başladı!', 'xp');
    }
}

// ==================== TELEGRAPHED AoE ATTACK SYSTEM ============
function createTelegraphIndicator(x, z, radius){
    const group = new THREE.Group();
    group.position.set(x, 0.04, z);

    // 1. Semi-transparent outer red warning ring (fixed size)
    const outerGeo = new THREE.RingGeometry(radius * 0.94, radius, 36);
    const outerMat = new THREE.MeshBasicMaterial({
        color: 0xff1522,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    const outerRing = new THREE.Mesh(outerGeo, outerMat);
    outerRing.rotation.x = -Math.PI / 2;
    group.add(outerRing);

    // 2. Growing inner filling circle (expands from 0 to full radius over 1.5s)
    const innerGeo = new THREE.CircleGeometry(radius * 0.94, 36);
    const innerMat = new THREE.MeshBasicMaterial({
        color: 0xff0022,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
    });
    const innerCircle = new THREE.Mesh(innerGeo, innerMat);
    innerCircle.rotation.x = -Math.PI / 2;
    innerCircle.scale.set(0.001, 0.001, 1);
    group.add(innerCircle);

    scene.add(group);

    return {
        group,
        outerRing,
        innerCircle,
        radius,
        x,
        z,
        updateProgress(prog){
            const p = Math.max(0.001, Math.min(1.0, prog));
            innerCircle.scale.set(p, p, 1);
            innerMat.opacity = 0.25 + p * 0.40;
        },
        destroy(){
            scene.remove(group);
            outerGeo.dispose();
            outerMat.dispose();
            innerGeo.dispose();
            innerMat.dispose();
        }
    };
}

// ==================== MONSTER AI & BEHAVIOR =================
function updateMonsters(dt){
    const pp = playerGroup.position;
    const now = performance.now();

    G.monsters.forEach(m => {
        if(!m.alive){
            if(m.respawnTimer > 0){
                m.respawnTimer -= dt * 1000;
                if(m.respawnTimer <= 0) respawnMonster(m);
            }
            return;
        }

        const dx = pp.x - m.model.position.x;
        const dz = pp.z - m.model.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // DISTANCE CULLING OPTIMIZATION (Skip calculations for monsters > 120 units away)
        if(dist > 120 && !m.isBoss){
            if(m.model.visible){
                m.model.visible = false;
                m.hpBar.visible = false;
            }
            return;
        }
        if(!m.model.visible){
            m.model.visible = true;
        }

        m.hpBar.position.set(m.model.position.x, m.model.position.y + m.barH, m.model.position.z);
        m.hpBar.quaternion.copy(camera.quaternion);
        const ratio = Math.max(0, m.hp / m.maxHp);
        m.hpBar.userData.fg.scale.x = Math.max(0.001, ratio);
        m.hpBar.userData.fg.position.x = -(1 - ratio) * 0.425;
        const isCombat = (m.hp < m.maxHp) || (G.target === m) || (m.state === 'chase' || m.state === 'attack' || m.state === 'telegraphing' || m.state === 'ranged_combat') || m.isBoss;
        m.hpBar.visible = isCombat && (dist < 26);

        const md = MON[m.type];
        const aiType = md ? (md.aiType || (m.isBoss ? 'boss' : 'melee')) : 'melee';

        // ---------------- BOSS ÖFKE FAZI (ENRAGE AT < 40% HP) ----------------
        if(m.isBoss && !m.enraged && (m.hp / m.maxHp) <= 0.40){
            m.enraged = true;
            m.model.scale.multiplyScalar(1.20);
            m.barH *= 1.20;

            if(m.model.userData.bossAura){
                m.model.userData.bossAura.material.color.setHex(0xff0044);
                m.model.userData.bossAura.scale.multiplyScalar(1.25);
            }

            sfx.playThunder();
            addCameraTrauma(0.85, 12);
            notify(`🔥 DİKKAT: ${md.name.toUpperCase()} ÖFKE MODUNA GİRDİ! (+%30 Hız ve Güç)`, 'warn');
        }

        const baseSpd = MONSTER_BASE_SPEED * (md ? md.spd : 1.0);
        const spd = baseSpd * (m.enraged ? 1.30 : 1.0);
        const aggroR = m.isBoss ? 35 : AGGRO_RANGE;
        const atkR = m.isBoss ? 4.8 : MONSTER_ATK_RANGE;

        if(m.isBoss){
            const bossBar = document.getElementById('boss-bar-container');
            if(bossBar){
                if(dist < 48 || m.state === 'chase' || m.state === 'attack' || m.state === 'telegraphing'){
                    bossBar.classList.remove('hidden');
                    if(m.enraged) bossBar.classList.add('enraged');
                    else bossBar.classList.remove('enraged');
                    const bNameEl = document.getElementById('boss-name');
                    if(bNameEl && md){
                        const enragePrefix = m.enraged ? '⚡ [ÖFKELİ] ' : '👑 ';
                        bNameEl.textContent = `${enragePrefix}${md.name.toUpperCase()} (SEVİYE ${m.level || md.lvl})`;
                    }
                    const bPct = Math.max(0, (m.hp / m.maxHp) * 100);
                    const bFill = document.getElementById('boss-hp-fill');
                    if(bFill) bFill.style.width = bPct + '%';
                    const bTxt = document.getElementById('boss-hp-text');
                    if(bTxt) bTxt.textContent = `${Math.ceil(m.hp)} / ${m.maxHp}`;
                } else if(dist > 55 && m.state === 'idle'){
                    bossBar.classList.add('hidden');
                    bossBar.classList.remove('enraged');
                }
            }
        }

        switch(m.state){
            case 'idle':
                m.idleT += dt;
                if(m.idleT > 2.5){
                    m.idleT = 0;
                    m.idleAng = rng(0, Math.PI * 2);
                }
                m.model.position.x += Math.sin(m.idleAng) * 0.008;
                m.model.position.z += Math.cos(m.idleAng) * 0.008;
                m.model.rotation.y = m.idleAng;
                if(dist < aggroR && G.player.alive){
                    if(aiType === 'ranged') m.state = 'ranged_combat';
                    else m.state = 'chase';

                    if(!m.lastAggroNotif || (now - m.lastAggroNotif > 12000)){
                        m.lastAggroNotif = now;
                        notify(`${md.name} seni fark etti!`, 'warn');
                    }
                }
                break;

            case 'chase': {
                if(aiType === 'ranged'){
                    m.state = 'ranged_combat';
                    break;
                }

                const ang = Math.atan2(dx, dz);
                const stepX = Math.sin(ang) * spd;
                const stepZ = Math.cos(ang) * spd;
                const nextX = m.model.position.x + stepX;
                const nextZ = m.model.position.z + stepZ;

                // Obstacle Avoidance & Tangent Steering around solid obstacles/walls
                if(typeof checkObstacleCollision === 'function' && checkObstacleCollision(nextX, nextZ, m.sz * 0.65)){
                    const canMoveX = !checkObstacleCollision(nextX, m.model.position.z, m.sz * 0.65);
                    const canMoveZ = !checkObstacleCollision(m.model.position.x, nextZ, m.sz * 0.65);
                    if(canMoveX && !canMoveZ){
                        m.model.position.x = nextX;
                    } else if(!canMoveX && canMoveZ){
                        m.model.position.z = nextZ;
                    } else {
                        const tanX = -Math.cos(ang) * spd;
                        const tanZ = Math.sin(ang) * spd;
                        if(!checkObstacleCollision(m.model.position.x + tanX, m.model.position.z + tanZ, m.sz * 0.65)){
                            m.model.position.x += tanX;
                            m.model.position.z += tanZ;
                        }
                    }
                } else {
                    m.model.position.x = nextX;
                    m.model.position.z = nextZ;
                }
                m.model.rotation.y = ang;

                // Heavy Tank / Boss Telegraphed Attack Trigger
                if(aiType === 'heavy_tank' || aiType === 'boss'){
                    const aoeCd = m.enraged ? 2200 : 3200;
                    if(dist <= (atkR * 1.6) && (now - (m.lastAtk || 0) > aoeCd)){
                        m.state = 'telegraphing';
                        m.telegraphElapsed = 0;
                        m.telegraphDuration = m.enraged ? 1.1 : 1.5;
                        const radius = m.isBoss ? (m.type === 'boss_aethelgard' ? 7.5 : m.type === 'boss_malakor' ? 7.2 : 5.8) : 4.4;
                        m.telegraph = createTelegraphIndicator(pp.x, pp.z, radius);
                        break;
                    }
                }

                if(dist <= atkR) m.state = 'attack';

                const spawnDist = Math.sqrt(Math.pow(m.model.position.x - m.spawnX, 2) + Math.pow(m.model.position.z - m.spawnZ, 2));
                if(spawnDist > aggroR * 2.8 || dist > aggroR * 2.2){
                    m.state = 'returning';
                    m.hp = m.maxHp;
                }
                break;
            }

            case 'telegraphing': {
                // Monster winds up its attack overhead towards telegraph center
                if(m.telegraph){
                    const tang = Math.atan2(m.telegraph.x - m.model.position.x, m.telegraph.z - m.model.position.z);
                    m.model.rotation.y = tang;

                    m.telegraphElapsed += dt;
                    const prog = Math.min(1.0, m.telegraphElapsed / m.telegraphDuration);
                    m.telegraph.updateProgress(prog);

                    // Raise weapon high overhead in anticipation
                    if(m.model.userData.rightArm) m.model.userData.rightArm.rotation.x = -Math.PI * 0.85;
                    if(m.model.userData.club) m.model.userData.club.rotation.x = -0.5;

                    if(m.telegraphElapsed >= m.telegraphDuration){
                        sfx.playBlast();
                        const slamX = m.telegraph.x;
                        const slamZ = m.telegraph.z;
                        const radius = m.telegraph.radius;

                        // Shockwave Ring (Pooled)
                        spawnPooledRing(new THREE.Vector3(slamX, 0.08, slamZ), m.isBoss ? 0xff2200 : 0xff9900, radius * 3.8, 0.55, radius * 0.85);

                        // Erupting stone & spark chunks (Pooled)
                        for(let sp = 0; sp < 14; sp++){
                            const p = new THREE.Vector3(slamX + rng(-0.5, 0.5), 0.3, slamZ + rng(-0.5, 0.5));
                            const theta = rng(0, Math.PI * 2);
                            const speed = rng(0.08, 0.18);
                            const vel = new THREE.Vector3(Math.cos(theta) * speed, rng(0.12, 0.28), Math.sin(theta) * speed);
                            spawnPooledSpark(p, choice([0x554433, 0xff5500, 0x887766]), vel, 0.85, rng(1.2, 2.2));
                        }

                        if(m.model.userData.rightArm) m.model.userData.rightArm.rotation.x = Math.PI * 0.35;

                        // Check if player is still inside the red danger zone!
                        const playerDist = dist2D(pp.x, pp.z, slamX, slamZ);
                        if(playerDist <= radius){
                            const rawDmg = Math.round(m.atk * (m.enraged ? 2.0 : 1.6));
                            damagePlayer(rawDmg, m);

                            // Vane-Helm Dark Runesword Life Steal (Heals boss)
                            if(m.type === 'boss_vanehelm'){
                                m.hp = Math.min(m.maxHp, m.hp + Math.round(rawDmg * 0.5));
                                notify('🩸 Vane-Helm Karanlık Kılıcıyla Canını Çaldı!', 'warn');
                            }

                            const knockAng = Math.atan2(pp.x - slamX, pp.z - slamZ);
                            playerGroup.position.x += Math.sin(knockAng) * (m.isBoss ? 4.8 : 3.2);
                            playerGroup.position.z += Math.cos(knockAng) * (m.isBoss ? 4.8 : 3.2);

                            G.player.vy = 8.5;
                            G.player.onGround = false;

                            addCameraTrauma(m.isBoss ? 0.45 : 0.30, 8);
                            notify(`💥 ${md.name} Ağır Alan Darbesiyle Seni Vurdu ve Geriye Savurdu!`, 'warn');
                        } else {
                            notify('⚡ Ağır Darbeden Kaçtın! (Kusursuz Kaçış)', 'xp');
                        }

                        m.telegraph.destroy();
                        m.telegraph = null;
                        m.lastAtk = now;
                        m.state = 'chase';
                    }
                } else {
                    m.state = 'chase';
                }
                break;
            }

            case 'ranged_combat': {
                // Ranged / Kiting AI (Buz Büyücüsü, Gölge İblisi)
                if(dist < 8.5){
                    // Player is too close! Kiting / Fleeing backwards away from player!
                    const fleeAng = Math.atan2(-dx, -dz);
                    m.model.position.x += Math.sin(fleeAng) * spd * 1.15;
                    m.model.position.z += Math.cos(fleeAng) * spd * 1.15;
                    m.model.rotation.y = Math.atan2(dx, dz); // Faces player while backing up!
                }
                else if(dist <= 24){
                    // Optimal firing range! Stand ground and cast glowing projectiles!
                    m.model.rotation.y = Math.atan2(dx, dz);
                    const rangedCd = m.type === 'frost_mage' ? 2200 : 2500;
                    if(now - (m.lastAtk || 0) > rangedCd){
                        m.lastAtk = now;
                        spawnEnemyProjectile(m.model.position, pp, m.type, m.atk, m);
                        if(typeof sfx.playMagic === 'function') sfx.playMagic();
                        else if(typeof sfx.playWhoosh === 'function') sfx.playWhoosh();
                    }
                }
                else {
                    // Too far, close distance:
                    const ang = Math.atan2(dx, dz);
                    m.model.position.x += Math.sin(ang) * spd;
                    m.model.position.z += Math.cos(ang) * spd;
                    m.model.rotation.y = ang;
                }

                const spawnDist = Math.sqrt(Math.pow(m.model.position.x - m.spawnX, 2) + Math.pow(m.model.position.z - m.spawnZ, 2));
                if(spawnDist > aggroR * 2.8 || dist > aggroR * 2.4){
                    m.state = 'returning';
                    m.hp = m.maxHp;
                }
                break;
            }

            case 'attack': {
                const ang = Math.atan2(dx, dz);
                m.model.rotation.y = ang;
                const atkCd = m.enraged ? MONSTER_ATK_CD * 0.65 : MONSTER_ATK_CD;
                if(now - m.lastAtk > atkCd){
                    m.lastAtk = now;
                    damagePlayer(m.atk, m);
                }
                if(dist > atkR * 1.5) m.state = 'chase';
                if(!G.player.alive) m.state = 'returning';
                break;
            }

            case 'returning': {
                const rdx = m.spawnX - m.model.position.x;
                const rdz = m.spawnZ - m.model.position.z;
                const rd = Math.sqrt(rdx * rdx + rdz * rdz);
                if(rd < 1.0){
                    m.state = 'idle';
                    m.hp = m.maxHp;
                } else {
                    const ra = Math.atan2(rdx, rdz);
                    m.model.position.x += Math.sin(ra) * spd;
                    m.model.position.z += Math.cos(ra) * spd;
                    m.model.rotation.y = ra;
                }
                break;
            }
        }

        // Procedural Monster Animations
        const isMoving = (m.state === 'chase' || m.state === 'returning' || m.state === 'ranged_combat' || (m.state === 'idle' && Math.abs(m.model.position.x - m.spawnX) > 0.05));
        const animTime = now * 0.001;

        // Floating Levitation for Ranged Casters
        if(m.type === 'frost_mage' || m.type === 'shadow_demon'){
            m.model.position.y = 0.25 + Math.sin(animTime * 3.5) * 0.15;
            if(m.model.userData.staff) m.model.userData.staff.rotation.y += dt * 2.2;
        }

        if(m.type === 'slime'){
            m.slimeTime = (m.slimeTime || 0) + dt * (isMoving ? 9 : 3.5);
            const bounce = Math.abs(Math.sin(m.slimeTime));
            m.model.position.y = bounce * (isMoving ? 0.45 : 0.15);
            if(m.model.userData.slimeBody){
                m.model.userData.slimeBody.scale.y = 0.72 + (1 - bounce) * 0.28 - bounce * 0.22;
                m.model.userData.slimeBody.scale.x = m.model.userData.slimeBody.scale.z = 1.0 + bounce * 0.16 - (1 - bounce) * 0.14;
            }
            if(m.model.userData.slimeCore){
                m.model.userData.slimeCore.rotation.y += dt * 3;
                m.model.userData.slimeCore.rotation.x += dt * 2;
                const corePulse = 0.35 + Math.sin(animTime * 5) * 0.06;
                m.model.userData.slimeCore.scale.set(corePulse, corePulse, corePulse);
            }
        }
        else if(m.type === 'boar'){
            m.walkTime = (m.walkTime || 0) + (isMoving ? dt * 10 : 0);
            const swing = Math.sin(m.walkTime) * 0.45;
            const legs = m.model.userData.legs;
            if(legs && legs.length === 4){
                legs[0].rotation.x = swing;
                legs[1].rotation.x = -swing;
                legs[2].rotation.x = -swing;
                legs[3].rotation.x = swing;
            }
            if(m.model.userData.head){
                if(m.state === 'attack' && (now - m.lastAtk < 350)){
                    m.model.userData.head.rotation.x = -0.55 + Math.sin((now - m.lastAtk) / 350 * Math.PI) * 0.7;
                } else {
                    m.model.userData.head.rotation.x = Math.sin(m.walkTime) * 0.12;
                }
            }
            if(m.model.userData.tail){
                m.model.userData.tail.rotation.z = Math.sin(animTime * 8) * 0.3;
            }
        }
        else if(m.type === 'wolf' || m.type === 'frost_wolf'){
            m.walkTime = (m.walkTime || 0) + (isMoving ? dt * 12 : 0);
            const swing = Math.sin(m.walkTime) * 0.55;
            const legs = m.model.userData.legs;
            if(legs && legs.length === 4){
                legs[0].rotation.x = swing;
                legs[1].rotation.x = -swing;
                legs[2].rotation.x = -swing * 0.8;
                legs[3].rotation.x = swing * 0.8;
            }
            if(m.model.userData.tail){
                m.model.userData.tail.rotation.y = Math.sin(m.walkTime * 1.5) * 0.45;
            }
            if(m.model.userData.head){
                if(m.state === 'attack' && (now - m.lastAtk < 320)){
                    m.model.userData.head.position.z = 1.05 + Math.sin((now - m.lastAtk) / 320 * Math.PI) * 0.35;
                    m.model.position.y = Math.sin((now - m.lastAtk) / 320 * Math.PI) * 0.25;
                } else {
                    m.model.userData.head.position.z = 1.05;
                    m.model.position.y = 0;
                }
            }
        }
        else if(m.type === 'troll' || m.type === 'frost_troll' || m.type === 'golem' || m.isBoss){
            m.walkTime = (m.walkTime || 0) + (isMoving ? dt * (m.isBoss ? 4.2 : 3.8) : 0);
            const swing = Math.sin(m.walkTime) * 0.4;
            const legs = m.model.userData.legs;
            if(legs && legs.length === 2){
                legs[0].rotation.x = swing;
                legs[1].rotation.x = -swing;
            }
            m.model.rotation.z = isMoving ? Math.sin(m.walkTime) * (m.isBoss ? 0.05 : 0.1) : 0;

            if(m.state !== 'telegraphing'){
                const atkDur = m.isBoss ? 850 : 650;
                if(m.state === 'attack' && (now - m.lastAtk < atkDur)){
                    const prog = (now - m.lastAtk) / atkDur;
                    if(prog < 0.42){
                        if(m.model.userData.rightArm) m.model.userData.rightArm.rotation.x = -Math.PI * 0.8;
                        if(m.model.userData.club) m.model.userData.club.rotation.x = -0.4;
                    } else {
                        const slamProg = (prog - 0.42) / 0.58;
                        if(m.model.userData.rightArm) m.model.userData.rightArm.rotation.x = -Math.PI * 0.8 + slamProg * Math.PI * 1.25;
                        if(m.model.userData.club) m.model.userData.club.rotation.x = Math.PI / 3;
                    }
                } else {
                    if(m.model.userData.rightArm) m.model.userData.rightArm.rotation.x = -swing * 0.5;
                    if(m.model.userData.leftArm) m.model.userData.leftArm.rotation.x = swing * 0.5;
                }
            }

            if(m.model.userData.bossAura){
                m.model.userData.bossAura.rotation.z += dt * (m.enraged ? 2.8 : 0.85);
            }
        }
    });
}

// ==================== MONSTER DEATH & RESPAWN ===============
function killMonster(m){
    m.alive = false;
    m.state = 'idle';
    if(m.telegraph){
        m.telegraph.destroy();
        m.telegraph = null;
    }
    m.model.visible = false;
    m.hpBar.visible = false;
    m.respawnTimer = (m.isBoss ? 60000 : RESPAWN_MS);
    G.player.kills = (G.player.kills || 0) + 1;

    if(m.isBoss){
        G.bossesDefeated[m.type] = true;
        const bossBar = document.getElementById('boss-bar-container');
        if(bossBar){
            bossBar.classList.add('hidden');
            bossBar.classList.remove('enraged');
        }
        const bName = MON[m.type] ? MON[m.type].name : 'KADİM BOSS';
        notify(`🏆 ${bName.toUpperCase()} YENİLDİ! EFSANEVİ GANİMET KAZANDINIZ!`, 'item');
        sfx.playLevelUp();
        addCameraTrauma(1.0, 18); // World Boss defeat: Maximum trauma (+1.0) & deep FOV punch (18 deg)!
    }

    sfx.playDefeat();
    grantExp(m.exp);

    const md = MON[m.type];
    if(md && md.drops){
        md.drops.forEach(dr => {
            if(Math.random() < dr.ch){
                spawnDrop(dr.id, m.model.position.x + rng(-0.8, 0.8), m.model.position.z + rng(-0.8, 0.8));
            }
        });
    }

    if(G.target === m) G.target = null;
}

function respawnMonster(m){
    const stats = calculateMonsterStats(m.type, m.level || null);
    m.maxHp = stats.hp;
    m.hp = stats.hp;
    m.atk = stats.atk;
    m.alive = true;
    m.enraged = false;
    if(m.isBoss){
        m.model.scale.set(1, 1, 1);
        if(m.model.userData.bossAura){
            const defColor = m.type === 'boss_malakor' ? 0xff0500 : m.type === 'boss_ymirkhor' ? 0x55eeff : m.type === 'boss_azrakar' ? 0xff8800 : 0xff1800;
            m.model.userData.bossAura.material.color.setHex(defColor);
            m.model.userData.bossAura.scale.set(1, 1, 1);
        }
    }
    m.model.position.set(m.spawnX, 0, m.spawnZ);
    m.model.visible = true;
    m.hpBar.visible = true;
    m.state = 'idle';
    if(m.isBoss){
        const bName = MON[m.type] ? MON[m.type].name : 'BOSS';
        notify(`⚠️ ${bName} ARENASINDA YENİDEN DOĞDU!`, 'warn');
    }
}

// ==================== DAMAGE PLAYER (DIMINISHING RETURNS ARMOR) =========================
function damagePlayer(rawAtk, attacker = null){
    if(!G.player.alive) return;
    const effectiveAtk = Math.round(rawAtk);

    // Exact formula: HasarAzaltma = Zırh / (Zırh + 120 + (Level * 8)), max 85%
    const rawReduction = G.player.def / (G.player.def + 120 + ((G.player.level || 1) * 8));
    const damageReduction = Math.min(0.85, Math.max(0, rawReduction));
    const dmg = Math.max(1, Math.round(effectiveAtk * (1 - damageReduction)));
    G.player.hp -= dmg;

    sfx.playHurt();
    spawnDmgNumber(playerGroup.position, dmg, 'player');

    // Trauma: Normal hit (+0.10), heavy hit (+0.30), Boss hit (+0.45)
    if(attacker && attacker.isBoss){
        addCameraTrauma(0.45, 8);
    } else if(dmg >= (G.player.maxHp * 0.15)){
        addCameraTrauma(0.30, 6);
    } else {
        addCameraTrauma(0.10, 2);
    }

    if((!G.target || !G.target.alive) && attacker){
        G.target = attacker;
    }

    if(G.player.hp <= 0){
        G.player.hp = 0;
        G.player.alive = false;
        const dLvl = document.getElementById('death-level');
        if(dLvl) dLvl.textContent = G.player.level;
        const dKills = document.getElementById('death-kills');
        if(dKills) dKills.textContent = G.player.kills || 0;
        document.getElementById('death-screen').classList.remove('hidden');
        notify('Savaşta mağlup oldun!', 'warn');
    }
}

// ==================== EXP & LEVEL SYSTEM (1 - 100 PROGRESSION) ====================
function grantExp(xp){
    if(G.player.level >= 100){
        G.player.exp = G.player.expNext;
        return;
    }
    G.player.exp += xp;
    spawnDmgNumber(playerGroup.position, xp, 'xp');
    notify(`+${xp} EXP`, 'xp');

    while(G.player.exp >= G.player.expNext && G.player.level < 100){
        levelUp();
    }
}

function levelUp(){
    if(G.player.level >= 100) return;
    G.player.exp -= G.player.expNext;
    G.player.level++;

    // Balanced polynomial curve to Level 100
    G.player.expNext = Math.round(120 * G.player.level + 35 * Math.pow(G.player.level, 1.65));
    G.player.statPoints = (G.player.statPoints || 0) + 4;
    recalculatePlayerStats();
    G.player.hp = G.player.maxHp;

    sfx.playLevelUp();

    const el = document.getElementById('level-up-overlay');
    if(el){
        el.classList.remove('hidden');
        const txt = document.getElementById('level-up-text');
        if(txt){
            txt.textContent = G.player.level === 100 ? '★ MAX LEVEL 100! ★' : `LEVEL ${G.player.level}!`;
            txt.style.animation = 'none';
            void txt.offsetHeight;
            txt.style.animation = '';
        }
        setTimeout(() => el.classList.add('hidden'), 2300);
    }

    notify(`★ SEVİYE ATLADIN! Seviye ${G.player.level} (+4 Nitelik Puanı)`, 'item');

    // Auto-Save progression immediately on level up!
    saveGame();

    // Kadim Mühür (Level 25) Castle Gate Unlock
    if(G.player.level === 25){
        if(G.gateBarrier){
            G.gateBarrier.visible = false;
        }
        if(typeof sfx !== 'undefined' && sfx.playThunder) sfx.playThunder();
        if(typeof addCameraTrauma === 'function') addCameraTrauma(0.65);
        notify('🔓 GEÇİT AÇILDI! Kadim Mühür dağıldı. Kızıl Çoraklık seni bekliyor...', 'warn');

        // Burst of magical dissipation particles at the gatehouse
        for(let i = 0; i < 40; i++){
            const pPos = new THREE.Vector3(rng(-3.2, 3.2), rng(0.5, 5.0), 60 + rng(-0.5, 0.5));
            const pVel = new THREE.Vector3(rng(-0.15, 0.15), rng(0.05, 0.25), rng(-0.15, 0.15));
            if(typeof spawnPooledSpark === 'function'){
                spawnPooledSpark(pPos, Math.random() > 0.5 ? 0xff1155 : 0xdd33ff, pVel, 0.95, 1.6);
            }
        }
    }

    // Check unlocking for all 9 Castle Gate Barriers (every 10 levels)
    if(window.gateBarriers && window.gateBarriers.length > 0){
        for(let bi = 0; bi < window.gateBarriers.length; bi++){
            const b = window.gateBarriers[bi];
            if(G.player.level >= b.requiredLevel && !b.isUnlocked){
                b.isUnlocked = true;
                b.group.visible = false;
                if(b.obstacle) b.obstacle.active = false;
                notify(`🔓 ${b.name} AÇILDI! (Seviye ${b.requiredLevel}+)`, 'xp');

                // Burst of celebratory sparks at the gate archway
                for(let i = 0; i < 30; i++){
                    const pPos = new THREE.Vector3(rng(-3.2, 3.2), rng(0.5, 5.0), b.z + rng(-0.5, 0.5));
                    const pVel = new THREE.Vector3(rng(-0.15, 0.15), rng(0.05, 0.25), rng(-0.15, 0.15));
                    if(typeof spawnPooledSpark === 'function'){
                        spawnPooledSpark(pPos, Math.random() > 0.5 ? 0xffbb22 : 0xdd33ff, pVel, 0.95, 1.6);
                    }
                }
            }
        }
    }

    // 10-Tier Boss Awakenings
    const bossTiers = [
        { lvl: 10, type: 'boss_gorgar' },
        { lvl: 20, type: 'boss_urgathok' },
        { lvl: 30, type: 'boss_morghul' },
        { lvl: 40, type: 'boss_amunkhet' },
        { lvl: 50, type: 'boss_ymirath' },
        { lvl: 60, type: 'boss_riftbreaker' },
        { lvl: 70, type: 'boss_khardraz' },
        { lvl: 80, type: 'boss_raikor' },
        { lvl: 90, type: 'boss_vanehelm' },
        { lvl: 100, type: 'boss_aethelgard' }
    ];
    bossTiers.forEach(bt => {
        if(G.player.level >= bt.lvl && !G.bossesDefeated[bt.type]){
            spawnBoss(bt.type);
        }
    });
}

// ==================== 4-BIOME ATMOSPHERE LERP & NOTIFICATIONS ===================
const targetFogColor = new THREE.Color(0x1a2634);
const targetSkyColor = new THREE.Color(0x7ec1e4);
const targetSunColor = new THREE.Color(0xfff4d6);
const targetAmbColor = new THREE.Color(0x7a92b5);
let targetFogDensity = 0.015;

function updateBiomes(dt){
    if(!playerGroup) return;
    const px = playerGroup.position.x;
    const pz = playerGroup.position.z;
    const b = getBiomeAt(px, pz);

    if(b && b.id !== G.currentBiome){
        G.currentBiome = b.id;

        // Trigger Biome Discovery Banner on UI
        showBiomeBanner(b);
        notify(`📍 BÖLGE: ${b.name} (${b.levelRange})`, 'item');

        const mLabel = document.getElementById('minimap-label');
        if(mLabel) mLabel.textContent = `${b.name} [${b.levelRange}]`;

        targetFogColor.setHex(b.fogColor);
        targetSkyColor.setHex(b.skyColor);
        targetSunColor.setHex(b.sunColor);
        targetAmbColor.setHex(b.ambientColor);
        targetFogDensity = b.fogDensity;
    }

    // Smooth Lerp of Scene Atmosphere
    const lerpRate = Math.min(1.0, dt * 2.2);
    if(scene && scene.fog){
        scene.fog.color.lerp(targetFogColor, lerpRate);
        scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetFogDensity, lerpRate);
    }
    if(scene && scene.background && scene.background.isColor){
        scene.background.lerp(targetSkyColor, lerpRate);
    }
    if(mainSunLight){
        mainSunLight.color.lerp(targetSunColor, lerpRate);
    }
    if(mainAmbLight){
        mainAmbLight.color.lerp(targetAmbColor, lerpRate);
    }
}

function showBiomeBanner(biome){
    let banner = document.getElementById('biome-banner');
    if(!banner){
        banner = document.createElement('div');
        banner.id = 'biome-banner';
        document.body.appendChild(banner);
    }
    banner.innerHTML = `
        <div class="biome-banner-inner">
            <div class="biome-badge">BÖLGE KEŞFEDİLDİ</div>
            <div class="biome-title">${biome.name}</div>
            <div class="biome-range">Önerilen Seviye: ${biome.levelRange}</div>
            <div class="biome-desc">${biome.desc}</div>
        </div>
    `;
    banner.classList.remove('hidden', 'banner-fade-out');
    banner.classList.add('banner-fade-in');

    if(banner._timer) clearTimeout(banner._timer);
    banner._timer = setTimeout(() => {
        banner.classList.remove('banner-fade-in');
        banner.classList.add('banner-fade-out');
        setTimeout(() => banner.classList.add('hidden'), 900);
    }, 3800);
}

// Window Globals
window.spawnMonster = spawnMonster;
window.spawnBoss = spawnBoss;
window.spawnBossUrGathok = spawnBossUrGathok;
window.calculateMonsterStats = calculateMonsterStats;
window.handleRaycastClick = handleRaycastClick;
window.updateCamera = updateCamera;
window.addCameraTrauma = addCameraTrauma;
window.updateMovement = updateMovement;
window.spawnFootstepDust = spawnFootstepDust;
window.updateAimReticle = updateAimReticle;
window.getAimDirection = getAimDirection;
window.dealDamageToMonster = dealDamageToMonster;
window.performAttack = performAttack;
window.spawnMagicBolt = spawnMagicBolt;
window.spawnArrow = spawnArrow;
window.flashMesh = flashMesh;
window.updateAttackAnim = updateAttackAnim;
window.castElementalSkill = castElementalSkill;
window.unlockUltimateSkill = unlockUltimateSkill;
window.castUltimateSkill = castUltimateSkill;
window.updateUltimates = updateUltimates;
window.updateProjectiles = updateProjectiles;
window.detonateProjectile = detonateProjectile;
window.updateParticles = updateParticles;
window.recalculatePlayerStats = recalculatePlayerStats;
window.updateStatsSheet = updateStatsSheet;
window.toggleStats = toggleStats;
window.restartGameFromScratch = restartGameFromScratch;
window.updateMonsters = updateMonsters;
window.killMonster = killMonster;
window.respawnMonster = respawnMonster;
window.damagePlayer = damagePlayer;
window.grantExp = grantExp;
window.levelUp = levelUp;
window.updateBiomes = updateBiomes;
window.showBiomeBanner = showBiomeBanner;
window.createTelegraphIndicator = createTelegraphIndicator;
window.spawnEnemyProjectile = spawnEnemyProjectile;

// ==================== LOCALSTORAGE SAVE / LOAD SYSTEM ====================
window.SAVE_KEY = 'fantasy_quest_rpg_save';
const SAVE_KEY = window.SAVE_KEY;

function saveGame(showNotice = false){
    if(!G.player || !G.player.className || !G.running) return;
    try {
        const goldCount = (G.player.inventory && G.player.inventory['goldCoin']) || G.player.gold || 0;
        const data = {
            className: G.player.className,
            element: G.player.element,
            level: G.player.level || 1,
            exp: G.player.exp || 0,
            expNext: G.player.expNext || 155,
            hp: G.player.hp || G.player.maxHp || 120,
            maxHp: G.player.maxHp || 120,
            gold: goldCount,
            stats: {
                str: G.player.stats?.str || 10,
                int: G.player.stats?.int || 10,
                dex: G.player.stats?.dex || 10,
                vit: G.player.stats?.vit || 10
            },
            statPoints: G.player.statPoints || 0,
            inventory: Object.assign({}, G.player.inventory || {}),
            kills: G.player.kills || 0,
            bossesDefeated: Object.assign({}, G.bossesDefeated || {}),
            savedAt: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        if(showNotice && typeof notify === 'function'){
            notify('💾 Oyun kaydedildi!', 'item');
        }
    } catch(e) {
        console.warn('Oyun kaydedilemedi:', e);
    }
}

function getSavedGame(){
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if(!raw) return null;
        const data = JSON.parse(raw);
        if(!data || !data.className || !data.level) return null;
        return data;
    } catch(e) {
        return null;
    }
}

function deleteSavedGame(){
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch(e) {}
}

function loadSavedGame(){
    const data = getSavedGame();
    if(!data) return false;

    sfx.init();

    G.selectedClass = data.className;
    G.selectedElement = data.element;
    G.player.className = data.className;
    G.player.element = data.element;
    G.player.level = data.level;
    G.player.exp = data.exp;
    G.player.expNext = data.expNext || Math.round(120 * data.level + 35 * Math.pow(data.level, 1.65));
    G.player.stats = Object.assign({}, data.stats);
    G.player.statPoints = data.statPoints || 0;
    G.player.inventory = Object.assign({}, data.inventory || {});
    G.player.kills = data.kills || 0;
    if(data.bossesDefeated) G.bossesDefeated = Object.assign({}, data.bossesDefeated);

    recalculatePlayerStats();
    G.player.hp = Math.min(G.player.maxHp, data.hp || G.player.maxHp);

    rebuildPlayerCharacter(data.className, data.element);

    const cls = CLASSES[data.className] || CLASSES.warrior;
    const elem = ELEMENTS[data.element] || ELEMENTS.fire;

    const atkIcon = document.getElementById('attack-icon');
    const skillIcon = document.getElementById('skill-icon');
    if(atkIcon) atkIcon.textContent = cls.icon;
    if(skillIcon) skillIcon.textContent = elem.icon;

    const instructionsEl = document.getElementById('instructions');
    if(instructionsEl) instructionsEl.classList.add('hidden');

    G.running = true;
    clock.getDelta();
    renderInventory();
    updateStatsSheet();
    updateHUD();

    if(G.gateBarrier){
        G.gateBarrier.visible = (data.level < 25);
    }

    notify(`💾 Kayıt yüklendi! Seviye ${data.level} ${cls.name} [${elem.name}] olarak maceraya devam ediyorsun.`, 'item');
    return true;
}

window.saveGame = saveGame;
window.getSavedGame = getSavedGame;
window.deleteSavedGame = deleteSavedGame;
window.loadSavedGame = loadSavedGame;
window.ParticlePool = ParticlePool;
window.ProjectilePool = ProjectilePool;
window.spawnPooledSpark = spawnPooledSpark;
window.spawnPooledRing = spawnPooledRing;
window.spawnPooledDust = spawnPooledDust;
window.recycleProjectile = recycleProjectile;
