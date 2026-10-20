// ============================================================
// FANTASY RPG: MEDIEVAL REALMS - MAIN ENTRY & GAME LOOP (main.js)
// Environmental Effects, Game Initialization & Render Cycle
// ============================================================

// ==================== ENVIRONMENTAL ANIMATIONS & POOLING =====
let smokeTimer = 0;
let biomeParticleTimer = 0;
let autoSaveTimer = 0;
const biomeParticles = [];

// Object Pools for Environmental FX
const SmokePool = [];
const BiomeWeatherPool = {
    frozen: [],
    volcanic: [],
    badlands: []
};

function updateEnvironmentFX(dt){
    const time = clock.getElapsedTime();
    const pp = playerGroup ? playerGroup.position : { x: 0, z: 0 };

    // 0. Pulsing Magical Forcefield Barriers across all 9 Zone Gates
    const pulse = 1.6 + Math.sin(time * 3.5) * 0.45;
    if(window.gateBarriers && window.gateBarriers.length > 0){
        for(let bi = 0; bi < window.gateBarriers.length; bi++){
            const b = window.gateBarriers[bi];
            if(b.group && b.group.visible){
                if(b.light) b.light.intensity = pulse;
                if(b.mesh && b.mesh.material){
                    b.mesh.material.emissiveIntensity = lerp(b.mesh.material.emissiveIntensity, pulse, dt * 3.0);
                    b.mesh.material.opacity = 0.62 + Math.sin(time * 3.0) * 0.12;
                }
                if(b.rune1) b.rune1.rotation.z += dt * 1.4;
                if(b.rune2) b.rune2.rotation.z -= dt * 0.95;
            }
        }
    } else if(G.gateBarrier && G.gateBarrier.visible){
        if(G.gateBarrierLight) G.gateBarrierLight.intensity = pulse;
        if(G.gateBarrierMesh && G.gateBarrierMesh.material){
            G.gateBarrierMesh.material.emissiveIntensity = lerp(G.gateBarrierMesh.material.emissiveIntensity, pulse, dt * 3.0);
            G.gateBarrierMesh.material.opacity = 0.62 + Math.sin(time * 3.0) * 0.12;
        }
        if(G.gateBarrierRune1) G.gateBarrierRune1.rotation.z += dt * 1.4;
        if(G.gateBarrierRune2) G.gateBarrierRune2.rotation.z -= dt * 0.95;
    }

    // 1. Drifting 3D Clouds
    G.clouds.forEach(cg => {
        cg.position.x += dt * cg.userData.speed;
        if(cg.position.x > 115) cg.position.x = -115;
    });

    // 2. Swaying Grass Tufts in Wind (Distance Culled > 120)
    const wind = Math.sin(time * 2.2) * 0.12;
    G.grassTufts.forEach((tg, idx) => {
        const dx = tg.position.x - pp.x;
        const dz = tg.position.z - pp.z;
        if(dx * dx + dz * dz > 120 * 120) return; // Skip distant grass
        const offset = Math.sin(time * 2.5 + idx * 0.3) * 0.08;
        tg.rotation.z = wind + offset;
    });

    // 3. Floating Fireflies (Distance Culled > 120)
    G.fireflies.forEach(ff => {
        const dx = ff.position.x - pp.x;
        const dz = ff.position.z - pp.z;
        if(dx * dx + dz * dz > 120 * 120) return; // Skip distant fireflies
        ff.position.y = ff.userData.baseY + Math.sin(time * 1.8 + ff.userData.phase) * 0.35;
        ff.position.x += Math.sin(time * 0.8 + ff.userData.phase) * 0.01;
    });

    // 4. Chimney Smoke Puffs (Object Pooled)
    smokeTimer += dt;
    if(smokeTimer > 0.45){
        smokeTimer = 0;
        villageHouses.forEach(h => {
            if(h.userData.chimneyTop){
                const top = h.userData.chimneyTop;
                let puff;
                if(SmokePool.length > 0){
                    puff = SmokePool.pop();
                    puff.scale.set(1, 1, 1);
                    puff.material.opacity = 0.45;
                    puff.position.set(top.x + rng(-0.08, 0.08), top.y, top.z + rng(-0.08, 0.08));
                    puff.visible = true;
                } else {
                    puff = new THREE.Mesh(
                        new THREE.DodecahedronGeometry(rng(0.2, 0.35), 0),
                        new THREE.MeshBasicMaterial({color:0xd8d8d8, transparent:true, opacity:0.45})
                    );
                    puff.position.set(top.x + rng(-0.08, 0.08), top.y, top.z + rng(-0.08, 0.08));
                    scene.add(puff);
                }
                G.smokePuffs.push({
                    mesh: puff,
                    vel: new THREE.Vector3(rng(0.01, 0.03), rng(0.03, 0.06), rng(-0.01, 0.01)),
                    life: 1.0
                });
            }
        });
    }

    for(let i = G.smokePuffs.length - 1; i >= 0; i--){
        const sp = G.smokePuffs[i];
        sp.life -= dt * 0.8;
        sp.mesh.position.add(sp.vel);
        sp.mesh.scale.multiplyScalar(1 + dt * 0.7);
        sp.mesh.material.opacity = Math.max(0, sp.life * 0.45);
        if(sp.life <= 0){
            sp.mesh.visible = false;
            SmokePool.push(sp.mesh);
            G.smokePuffs.splice(i, 1);
        }
    }

    // 5. Dynamic Biome Weather Particles (Object Pooled)
    if(playerGroup){
        biomeParticleTimer += dt;
        if(biomeParticleTimer > 0.08 && biomeParticles.length < 55){
            biomeParticleTimer = 0;
            const px = playerGroup.position.x + rng(-18, 18);
            const pz = playerGroup.position.z + rng(-18, 18);
            const b = typeof getBiomeAt === 'function' ? getBiomeAt(px, pz) : null;

            if(b && b.id === 'frozen'){
                let snow;
                if(BiomeWeatherPool.frozen.length > 0){
                    snow = BiomeWeatherPool.frozen.pop();
                    snow.position.set(px, rng(8, 14), pz);
                    snow.scale.set(1, 1, 1);
                    snow.visible = true;
                } else {
                    snow = new THREE.Mesh(
                        new THREE.SphereGeometry(rng(0.05, 0.12), 4, 4),
                        new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.85})
                    );
                    snow.position.set(px, rng(8, 14), pz);
                    scene.add(snow);
                }
                biomeParticles.push({mesh: snow, vel: new THREE.Vector3(rng(-0.03, 0.03), -rng(0.08, 0.16), rng(-0.03, 0.03)), life: 2.5, type: 'frozen'});
            }
            else if(b && b.id === 'volcanic'){
                let ember;
                if(BiomeWeatherPool.volcanic.length > 0){
                    ember = BiomeWeatherPool.volcanic.pop();
                    ember.position.set(px, rng(0.2, 1.5), pz);
                    ember.scale.set(1, 1, 1);
                    ember.visible = true;
                } else {
                    ember = new THREE.Mesh(
                        new THREE.DodecahedronGeometry(rng(0.06, 0.14), 0),
                        new THREE.MeshBasicMaterial({color: Math.random() > 0.5 ? 0xff2200 : 0xff7700, transparent: true, opacity: 0.9})
                    );
                    ember.position.set(px, rng(0.2, 1.5), pz);
                    scene.add(ember);
                }
                biomeParticles.push({mesh: ember, vel: new THREE.Vector3(rng(-0.02, 0.02), rng(0.04, 0.09), rng(-0.02, 0.02)), life: 2.0, type: 'volcanic'});
            }
            else if(b && b.id === 'badlands'){
                let dust;
                if(BiomeWeatherPool.badlands.length > 0){
                    dust = BiomeWeatherPool.badlands.pop();
                    dust.position.set(px, rng(0.3, 2.0), pz);
                    dust.scale.set(1, 1, 1);
                    dust.visible = true;
                } else {
                    dust = new THREE.Mesh(
                        new THREE.SphereGeometry(rng(0.05, 0.1), 4, 4),
                        new THREE.MeshBasicMaterial({color: 0xd49b55, transparent: true, opacity: 0.6})
                    );
                    dust.position.set(px, rng(0.3, 2.0), pz);
                    scene.add(dust);
                }
                biomeParticles.push({mesh: dust, vel: new THREE.Vector3(rng(0.04, 0.12), rng(-0.01, 0.02), rng(-0.02, 0.02)), life: 1.8, type: 'badlands'});
            }
        }

        for(let i = biomeParticles.length - 1; i >= 0; i--){
            const bp = biomeParticles[i];
            bp.life -= dt;
            bp.mesh.position.add(bp.vel);
            if(bp.life <= 0 || bp.mesh.position.y < 0.05){
                bp.mesh.visible = false;
                if(bp.type && BiomeWeatherPool[bp.type]){
                    BiomeWeatherPool[bp.type].push(bp.mesh);
                } else {
                    scene.remove(bp.mesh);
                }
                biomeParticles.splice(i, 1);
            }
        }
    }
}

// ==================== START GAME ============================
function startGame(){
    sfx.init();

    const cls = CLASSES[G.selectedClass] || CLASSES.warrior;
    const elem = ELEMENTS[G.selectedElement] || ELEMENTS.fire;

    G.player.className = G.selectedClass;
    G.player.element = G.selectedElement;

    // Initial stats based on chosen class
    if(G.selectedClass === 'warrior'){
        G.player.stats = { str: 14, int: 8, dex: 10, vit: 14 };
    } else if(G.selectedClass === 'mage'){
        G.player.stats = { str: 8, int: 16, dex: 10, vit: 10 };
    } else {
        G.player.stats = { str: 10, int: 10, dex: 16, vit: 10 };
    }
    G.player.statPoints = 0;
    recalculatePlayerStats();
    G.player.hp = G.player.maxHp;

    rebuildPlayerCharacter(G.selectedClass, G.selectedElement);

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
    if(window.gateBarriers && window.gateBarriers.length > 0){
        window.gateBarriers.forEach(b => {
            const shouldBeVisible = ((G.player.level || 1) < b.requiredLevel);
            b.group.visible = shouldBeVisible;
            b.isUnlocked = !shouldBeVisible;
            if(b.obstacle) b.obstacle.active = shouldBeVisible;
        });
    } else if(G.gateBarrier){
        G.gateBarrier.visible = ((G.player.level || 1) < 10);
    }
    notify(`Hoş geldin! ${cls.name} [${elem.name}] olarak maceraya başladın.`);
    if(typeof saveGame === 'function') saveGame();
}

const startBtn = document.getElementById('start-btn');
if(startBtn){
    startBtn.addEventListener('click', startGame);
}

// ==================== GAME LOOP =============================
function gameLoop(){
    requestAnimationFrame(gameLoop);
    if(!G.running){
        if(window.composer) window.composer.render();
        else renderer.render(scene, camera);
        return;
    }

    const dt = Math.min(clock.getDelta(), 0.05);

    // Periodic 10-Second Auto-Save
    autoSaveTimer += dt;
    if(autoSaveTimer >= 10.0){
        autoSaveTimer = 0;
        if(typeof saveGame === 'function') saveGame();
    }

    // Hit-Stop Micro Freeze (45ms pause on damage for crunchy ARPG kinetic weight)
    if(G.hitStopTimer > 0){
        G.hitStopTimer -= dt;
        if(window.composer) window.composer.render();
        else renderer.render(scene, camera);
        return;
    }

    updateDayNight(dt);
    if(typeof updateBiomes === 'function') updateBiomes(dt);
    updateMovement(dt);
    updateCamera(dt);
    updateAimReticle(dt);
    updateUltimates(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateEnvironmentFX(dt);
    updateMonsters(dt);
    updateDrops(dt);
    updateAttackAnim(dt);
    updateHUD();

    if(window.composer) window.composer.render();
    else renderer.render(scene, camera);
}

// Initial camera position & render
camera.position.set(0, 10, 18);
camera.lookAt(0, 1.5, 6);

renderInventory();
gameLoop();

// Initial Check for Saved Game on Load
if(typeof checkAndDisplaySavedGame === 'function') checkAndDisplaySavedGame();

// Global Exports
window.updateEnvironmentFX = updateEnvironmentFX;
window.startGame = startGame;
window.gameLoop = gameLoop;
