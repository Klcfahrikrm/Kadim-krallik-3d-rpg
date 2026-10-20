// ============================================================
// FANTASY RPG: MEDIEVAL REALMS - USER INTERFACE & HUD (ui.js)
// Minimap Radar, Inventory System, HUD updates, Notifications,
// Floating Numbers, Action Bar & 3D Character Preview Modal
// ============================================================

// ==================== MINIMAP RADAR RENDERER ================
function updateMinimap(){
    if(!minimapCtx) return;
    const w = 130, h = 130;
    const cx = w / 2, cy = h / 2;
    const mapScale = 0.55; // pixels per world unit

    minimapCtx.clearRect(0, 0, w, h);

    const pp = playerGroup.position;

    // Default void background
    minimapCtx.fillStyle = '#0b0f17';
    minimapCtx.fillRect(0, 0, w, h);

    // Screen bounds of the 200x690 Rectangular Map (X: [-100, 100], Z: [-60, 630])
    const mapLeft   = cx + (-100 - pp.x) * mapScale;
    const mapRight  = cx + ( 100 - pp.x) * mapScale;
    const mapTop    = cy + ( -60 - pp.z) * mapScale;
    const mapBottom = cy + ( 630 - pp.z) * mapScale;
    const mapW = mapRight - mapLeft;

    // Draw the 10 Biome Zones within the rectangular map bounds
    if(mapRight > 0 && mapLeft < w){
        const zoneSplits = [-60, 50, 110, 170, 230, 290, 350, 410, 470, 530, 630];
        const zoneColors = [
            '#2b5420', // Z1: Zümrüt Vadi
            '#7a421e', // Z2: Kızıl Çoraklık
            '#1c3822', // Z3: Lanetli Bataklık
            '#8a6828', // Z4: Kayıp Çöl
            '#2a4c62', // Z5: Donmuş Geçit
            '#2d1838', // Z6: Obsidyen Kanyon
            '#4a1008', // Z7: Kızıl Cehennem
            '#1f3652', // Z8: Fırtına Tepeleri
            '#141624', // Z9: Ruhlar Diyarı
            '#1c0f33'  // Z10: Kozmik Taht
        ];

        for(let zi = 0; zi < 10; zi++){
            const zTop = cy + (zoneSplits[zi] - pp.z) * mapScale;
            const zBottom = cy + (zoneSplits[zi + 1] - pp.z) * mapScale;
            if(zBottom > 0 && zTop < h){
                minimapCtx.fillStyle = zoneColors[zi];
                const y1 = Math.max(0, zTop);
                const y2 = Math.min(h, zBottom);
                minimapCtx.fillRect(Math.max(0, mapLeft), y1, Math.min(w, mapRight) - Math.max(0, mapLeft), y2 - y1);
            }
        }

        // Outer Rectangular Map Boundary Stroke
        minimapCtx.save();
        minimapCtx.strokeStyle = '#bfa363';
        minimapCtx.lineWidth = 2.0;
        minimapCtx.strokeRect(mapLeft, mapTop, mapW, mapBottom - mapTop);
        minimapCtx.restore();
    }

    // Cobblestone Village Plaza Circle at (0, 0)
    const vilX = cx + (0 - pp.x) * mapScale;
    const vilZ = cy + (0 - pp.z) * mapScale;
    minimapCtx.beginPath();
    minimapCtx.arc(vilX, vilZ, 19 * mapScale, 0, Math.PI * 2);
    minimapCtx.fillStyle = '#6e5841';
    minimapCtx.fill();
    minimapCtx.strokeStyle = '#8c7457';
    minimapCtx.lineWidth = 1.5;
    minimapCtx.stroke();

    // Imperial Highway extending across all 10 zones
    minimapCtx.strokeStyle = '#7d674b';
    minimapCtx.lineWidth = 2.5;
    minimapCtx.beginPath();
    minimapCtx.moveTo(vilX, vilZ - 36 * mapScale);
    minimapCtx.lineTo(vilX, vilZ + 580 * mapScale);
    // East & West Village Roads
    minimapCtx.moveTo(vilX - 35 * mapScale, vilZ);
    minimapCtx.lineTo(vilX + 38 * mapScale, vilZ);
    minimapCtx.stroke();

    // ==================== 9 CASTLE WALLS & GATES ====================
    if(window.gateBarriers && window.gateBarriers.length > 0){
        const curLvl = G.player.level || 1;
        for(let gi = 0; gi < window.gateBarriers.length; gi++){
            const b = window.gateBarriers[gi];
            const wallY = cy + (b.z - pp.z) * mapScale;
            const gateX = cx + (0 - pp.x) * mapScale;

            if(wallY >= -10 && wallY <= h + 10){
                const wallLeftX = Math.max(mapLeft, 0);
                const wallRightX = Math.min(mapRight, w);

                minimapCtx.save();
                minimapCtx.strokeStyle = '#38332c';
                minimapCtx.lineWidth = 3.2;

                if(gateX - 4 > wallLeftX){
                    minimapCtx.beginPath();
                    minimapCtx.moveTo(wallLeftX, wallY);
                    minimapCtx.lineTo(gateX - 4, wallY);
                    minimapCtx.stroke();
                }
                if(wallRightX > gateX + 4){
                    minimapCtx.beginPath();
                    minimapCtx.moveTo(gateX + 4, wallY);
                    minimapCtx.lineTo(wallRightX, wallY);
                    minimapCtx.stroke();
                }

                // Gate Icon
                const isLocked = curLvl < b.requiredLevel;
                minimapCtx.beginPath();
                minimapCtx.arc(gateX, wallY, 5.5, 0, Math.PI * 2);
                minimapCtx.fillStyle = isLocked ? '#520612' : '#0a421b';
                minimapCtx.fill();
                minimapCtx.strokeStyle = isLocked ? '#ff1e38' : '#22ee55';
                minimapCtx.lineWidth = 1.6;
                minimapCtx.stroke();

                minimapCtx.font = 'bold 7.5px sans-serif';
                minimapCtx.textAlign = 'center';
                minimapCtx.textBaseline = 'middle';
                minimapCtx.fillText(isLocked ? '🔒' : '🔓', gateX, wallY);
                minimapCtx.restore();
            }
        }
    }

    // Draw Monsters & Bosses
    G.monsters.forEach(m => {
        if(!m.alive) return;
        const mx = cx + (m.model.position.x - pp.x) * mapScale;
        const mz = cy + (m.model.position.z - pp.z) * mapScale;
        const distFromCenter = Math.sqrt((mx - cx)**2 + (mz - cy)**2);

        // World Bosses: Ur-Gathok, Azrakar, Ymir-Khor, Malakor
        if(m.isBoss){
            const angle = Math.atan2(mz - cy, mx - cx);
            const clampedDist = Math.min(distFromCenter, cx - 8);
            const bx = cx + Math.cos(angle) * clampedDist;
            const bz = cy + Math.sin(angle) * clampedDist;

            const strokeColor = m.type === 'boss_malakor' ? '#ff0033' : m.type === 'boss_ymirkhor' ? '#00ffff' : m.type === 'boss_azrakar' ? '#ffaa00' : '#44ff44';
            const bgColor = m.type === 'boss_malakor' ? '#440510' : '#1a1a1a';

            minimapCtx.save();
            minimapCtx.beginPath();
            minimapCtx.arc(bx, bz, 6.5, 0, Math.PI * 2);
            minimapCtx.fillStyle = bgColor;
            minimapCtx.fill();
            minimapCtx.strokeStyle = strokeColor;
            minimapCtx.lineWidth = 2.0;
            minimapCtx.stroke();

            minimapCtx.font = 'bold 9px sans-serif';
            minimapCtx.textAlign = 'center';
            minimapCtx.textBaseline = 'middle';
            minimapCtx.fillText('💀', bx, bz);
            minimapCtx.restore();
            return;
        }

        // Regular monster dots (clipped to radar circle)
        if(distFromCenter < cx - 4){
            minimapCtx.beginPath();
            const dotR = (m.type === 'troll' || m.type === 'frost_troll' || m.type === 'golem') ? 4 : 2.8;
            minimapCtx.arc(mx, mz, dotR, 0, Math.PI * 2);

            if(G.target === m){
                minimapCtx.fillStyle = '#ffff00';
                minimapCtx.strokeStyle = '#ffffff';
                minimapCtx.lineWidth = 1.5;
                minimapCtx.stroke();
            } else {
                minimapCtx.fillStyle = m.type === 'slime' ? '#33ee33' : m.type === 'frost_wolf' ? '#77ddff' : m.type === 'scorpion' ? '#ffaa33' : '#ff3333';
            }
            minimapCtx.fill();
        }
    });

    // Draw Player Arrow at Center
    minimapCtx.save();
    minimapCtx.translate(cx, cy);
    minimapCtx.rotate(-playerGroup.rotation.y + Math.PI);

    minimapCtx.beginPath();
    minimapCtx.moveTo(0, -6);
    minimapCtx.lineTo(4, 5);
    minimapCtx.lineTo(0, 3);
    minimapCtx.lineTo(-4, 5);
    minimapCtx.closePath();
    minimapCtx.fillStyle = '#ffd700';
    minimapCtx.fill();
    minimapCtx.strokeStyle = '#000000';
    minimapCtx.lineWidth = 1;
    minimapCtx.stroke();
    minimapCtx.restore();
}

// ==================== ITEM DROPS & OBJECT POOL ============================
window.DropPool = {
    healthPotion: [],
    attackGem: [],
    ironShield: [],
    goldCoin: []
};
const DropPool = window.DropPool;

function spawnDrop(itemId, x, z){
    const def = ITEMS[itemId];
    let mesh;
    if(DropPool[itemId] && DropPool[itemId].length > 0){
        mesh = DropPool[itemId].pop();
        mesh.position.set(x, 0.5, z);
        mesh.rotation.set(0, 0, 0);
        mesh.visible = true;
    } else {
        const colors = { healthPotion:0xff3333, attackGem:0xdd33ff, ironShield:0x7799dd, goldCoin:0xffd700 };
        const geo = itemId === 'goldCoin' ? new THREE.CylinderGeometry(0.2, 0.2, 0.06, 8) : new THREE.DodecahedronGeometry(0.24, 0);
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
            color: colors[itemId] || 0xffffff,
            emissive: colors[itemId] || 0xffffff,
            emissiveIntensity: 0.45,
            roughness: 0.3,
            metalness: itemId === 'goldCoin' ? 0.9 : 0.2
        }));
        mesh.position.set(x, 0.5, z);
        mesh.castShadow = true;
        scene.add(mesh);
    }

    G.drops.push({ itemId, mesh, time:0 });
    notify(`${def.emoji} ${def.name} düştü!`, 'item');
}

function updateDrops(dt){
    const pp = playerGroup.position;
    for(let i = G.drops.length - 1; i >= 0; i--){
        const dr = G.drops[i];
        dr.time += dt;
        dr.mesh.rotation.y += dt * 2.2;
        dr.mesh.position.y = 0.5 + Math.sin(dr.time * 3.5) * 0.12;

        const dx = dr.mesh.position.x - pp.x;
        const dz = dr.mesh.position.z - pp.z;
        if(Math.sqrt(dx * dx + dz * dz) < 2.0){
            pickupItem(dr.itemId);
            dr.mesh.visible = false;
            if(!DropPool[dr.itemId]) DropPool[dr.itemId] = [];
            DropPool[dr.itemId].push(dr.mesh);
            G.drops.splice(i, 1);
        } else if(dr.time > 35){
            dr.mesh.visible = false;
            if(!DropPool[dr.itemId]) DropPool[dr.itemId] = [];
            DropPool[dr.itemId].push(dr.mesh);
            G.drops.splice(i, 1);
        }
    }
}

// ==================== INVENTORY SYSTEM ======================
function pickupItem(itemId){
    if(!G.player.inventory[itemId]) G.player.inventory[itemId] = 0;
    G.player.inventory[itemId]++;
    if(itemId === 'goldCoin') G.player.gold = G.player.inventory['goldCoin'];
    const def = ITEMS[itemId];
    sfx.playPickup();
    notify(`${def.emoji} ${def.name} çantana eklendi`, 'item');
    G.inventoryDirty = true;
    if(typeof saveGame === 'function') saveGame();
}

function usePotion(){
    const cnt = G.player.inventory['healthPotion'] || 0;
    if(cnt <= 0){ notify('Hiç can iksiri kalmadı!', 'warn'); return; }
    if(G.player.hp >= G.player.maxHp){ notify('Canın zaten dolu!', 'warn'); return; }

    G.player.inventory['healthPotion']--;
    if(G.player.inventory['healthPotion'] <= 0) delete G.player.inventory['healthPotion'];

    const heal = ITEMS.healthPotion.value;
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + heal);
    sfx.playPotion();
    spawnDmgNumber(playerGroup.position, heal, 'heal');
    notify(`🧪 İksir kullanıldı: +${heal} HP!`);
    G.inventoryDirty = true;
    if(typeof saveGame === 'function') saveGame();
}

function useInventoryItem(itemId){
    const cnt = G.player.inventory[itemId] || 0;
    if(cnt <= 0) return;
    const def = ITEMS[itemId];

    if(itemId === 'healthPotion'){
        usePotion();
    } else if(def.effect === 'attackUp'){
        G.player.atk += def.value;
        G.player.inventory[itemId]--;
        if(G.player.inventory[itemId] <= 0) delete G.player.inventory[itemId];
        sfx.playPickup();
        notify(`💎 Saldırı gücü kalıcı olarak +${def.value} arttı! (Toplam: ${G.player.atk})`, 'item');
        G.inventoryDirty = true;
        if(typeof saveGame === 'function') saveGame();
    } else if(def.effect === 'defenseUp'){
        G.player.def += def.value;
        G.player.inventory[itemId]--;
        if(G.player.inventory[itemId] <= 0) delete G.player.inventory[itemId];
        sfx.playPickup();
        notify(`🛡️ Savunma gücü kalıcı olarak +${def.value} arttı! (Toplam: ${G.player.def})`, 'item');
        G.inventoryDirty = true;
        if(typeof saveGame === 'function') saveGame();
    } else if(itemId === 'goldCoin'){
        notify(`🪙 Altın Kesesi: Toplam ${cnt} altın taşıyorsun.`);
    }
}

function toggleInventory(){
    const panel = document.getElementById('inventory-panel');
    if(!panel) return;
    panel.classList.toggle('hidden');
    if(!panel.classList.contains('hidden')){
        renderInventory();
    }
}

function renderInventory(){
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = '';
    const entries = Object.entries(G.player.inventory);

    for(let i = 0; i < 16; i++){
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        if(i < entries.length){
            const [id, cnt] = entries[i];
            const def = ITEMS[id];
            slot.innerHTML = `
                <div class="slot-icon">${def.emoji}</div>
                <span class="item-count">${cnt}</span>
                <span class="item-tooltip"><b>${def.name}</b><br><small>${def.desc}</small></span>
            `;
            slot.style.cursor = 'pointer';
            slot.addEventListener('click', () => useInventoryItem(id));
        }
        grid.appendChild(slot);
    }
    const potEl = document.getElementById('potion-count');
    if(potEl) potEl.textContent = G.player.inventory['healthPotion'] || 0;
    G.inventoryDirty = false;
}

// ==================== HUD UPDATE ============================
function updateHUD(){
    const p = G.player;
    const cls = CLASSES[p.className] || CLASSES.warrior;
    const elem = ELEMENTS[p.element] || ELEMENTS.fire;

    const lvlEl = document.getElementById('player-level');
    if(lvlEl) lvlEl.textContent = `Lv. ${p.level}`;
    const badgeEl = document.getElementById('player-class-badge');
    if(badgeEl) badgeEl.textContent = `[${cls.name} • ${elem.name}]`;

    // HP Bar (Authentic Blood Ruby)
    const hpPct = Math.max(0, (p.hp / p.maxHp) * 100);
    const hpFill = document.getElementById('hp-bar');
    if(hpFill){
        hpFill.style.width = hpPct + '%';
        if(hpPct < 25)      hpFill.style.background = 'linear-gradient(to bottom, #d41717, #590000)';
        else if(hpPct < 50)  hpFill.style.background = 'linear-gradient(to bottom, #bd2424, #730e0e)';
        else                  hpFill.style.background = 'linear-gradient(to bottom, #c91818, #780909)';
    }
    const hpText = document.getElementById('hp-text');
    if(hpText) hpText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;

    // EXP Bar
    const xpPct = p.expNext > 0 ? (p.exp / p.expNext) * 100 : 0;
    const expBar = document.getElementById('exp-bar');
    if(expBar) expBar.style.width = xpPct + '%';
    const expText = document.getElementById('exp-text');
    if(expText) expText.textContent = `${p.exp} / ${p.expNext}`;

    // Target Panel (Sleek and hidden during Boss encounters to prevent overlap)
    const ti = document.getElementById('target-info');
    const bossBar = document.getElementById('boss-bar-container');
    const bossVisible = bossBar && !bossBar.classList.contains('hidden');

    if(ti){
        if(G.target && G.target.alive && !bossVisible){
            ti.classList.remove('hidden');
            const md = MON[G.target.type];
            const tn = document.getElementById('target-name');
            if(tn) tn.textContent = `[Lv.${md.lvl}] ${md.name}`;
            const tHp = Math.max(0, (G.target.hp / G.target.maxHp) * 100);
            const thpBar = document.getElementById('target-hp-bar');
            if(thpBar) thpBar.style.width = tHp + '%';
            const thpText = document.getElementById('target-hp-text');
            if(thpText) thpText.textContent = `${Math.ceil(G.target.hp)} / ${G.target.maxHp}`;
        } else {
            ti.classList.add('hidden');
        }
    }

    // Skill Cooldown Overlay
    const now = performance.now();
    const cdMs = (p.skillCd || 3.4) * 1000;
    const elapsed = now - p.lastSkillTime;
    const cdOverlay = document.getElementById('skill-cd-overlay');
    const cdText = document.getElementById('skill-cd-text');
    const skillSlot = document.getElementById('slot-skill');

    if(cdOverlay && cdText && skillSlot){
        if(elapsed < cdMs){
            cdOverlay.classList.remove('hidden');
            skillSlot.classList.add('on-cooldown');
            cdText.textContent = ((cdMs - elapsed) / 1000).toFixed(1) + 's';
        } else {
            cdOverlay.classList.add('hidden');
            skillSlot.classList.remove('on-cooldown');
        }
    }

    // Ultimate Cooldown (Level requirement temporarily lifted)
    const ultSlot = document.getElementById('slot-ult');
    const ultLock = document.getElementById('ult-lock');
    const ultCdOverlay = document.getElementById('ult-cd-overlay');
    const ultCdText = document.getElementById('ult-cd-text');

    if(ultSlot) ultSlot.classList.remove('locked');
    if(ultLock) ultLock.classList.add('hidden');
    const ultElapsed = now - (p.lastUltTime !== undefined ? p.lastUltTime : -999999);
    const ultCdMs = (p.ultCd || 12.0) * 1000;
    if(ultElapsed < ultCdMs){
        if(ultSlot) ultSlot.classList.add('on-cooldown');
        if(ultCdOverlay) ultCdOverlay.classList.remove('hidden');
        if(ultCdText) ultCdText.textContent = ((ultCdMs - ultElapsed) / 1000).toFixed(1) + 's';
    } else {
        if(ultSlot) ultSlot.classList.remove('on-cooldown');
        if(ultCdOverlay) ultCdOverlay.classList.add('hidden');
    }

    // Stat Badge
    const statBadge = document.getElementById('stat-badge');
    if(statBadge){
        if(p.statPoints > 0){
            statBadge.textContent = p.statPoints;
            statBadge.classList.remove('hidden');
        } else {
            statBadge.classList.add('hidden');
        }
    }

    // Minimap Radar update
    updateMinimap();

    if(G.inventoryDirty){
        renderInventory();
    }
}

// ==================== NOTIFICATIONS =========================
function notify(text, cls){
    const c = document.getElementById('notifications');
    if(!c) return;
    while(c.children.length >= 5){
        c.removeChild(c.firstChild);
    }
    const el = document.createElement('div');
    el.className = 'notification' + (cls ? ' ' + cls : '');
    el.textContent = text;
    c.appendChild(el);
    setTimeout(() => el.remove(), 2400);
}

// ==================== FLOATING NUMBERS ======================
const _v = new THREE.Vector3();
function spawnDmgNumber(worldPos, value, type){
    _v.copy(worldPos); _v.y += 2.4;
    _v.project(camera);
    if(_v.z > 1.0) return;

    const x = (_v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_v.y * 0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'damage-number' + (type ? ' ' + type : '');
    el.textContent = (type === 'heal' || type === 'xp' ? '+' : '-') + value;
    el.style.left = (x - 20) + 'px';
    el.style.top  = (y - 20) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1050);
}

// ==================== UI EVENT LISTENERS ====================
(function setupUIEventListeners(){
    // Permadeath reset buttons
    const respawnBtn = document.getElementById('respawn-btn');
    if(respawnBtn) respawnBtn.addEventListener('click', () => {
        sfx.init();
        restartGameFromScratch(false);
    });
    const restartSelectBtn = document.getElementById('restart-select-btn');
    if(restartSelectBtn) restartSelectBtn.addEventListener('click', () => {
        sfx.init();
        restartGameFromScratch(true);
    });

    // Action bar buttons
    const slotAtk = document.getElementById('slot-attack');
    if(slotAtk) slotAtk.addEventListener('click', () => {
        sfx.init();
        if(G.running) performAttack();
    });
    const slotSkill = document.getElementById('slot-skill');
    if(slotSkill) slotSkill.addEventListener('click', () => {
        sfx.init();
        if(G.running) castElementalSkill();
    });
    const slotUlt = document.getElementById('slot-ult');
    if(slotUlt) slotUlt.addEventListener('click', () => {
        sfx.init();
        if(G.running) castUltimateSkill();
    });
    const slotPot = document.getElementById('slot-potion');
    if(slotPot) slotPot.addEventListener('click', () => {
        sfx.init();
        usePotion();
    });
    const invToggle = document.getElementById('inventory-toggle');
    if(invToggle) invToggle.addEventListener('click', () => {
        sfx.init();
        toggleInventory();
    });
    const invClose = document.getElementById('inventory-close');
    if(invClose) invClose.addEventListener('click', () => {
        const invPanel = document.getElementById('inventory-panel');
        if(invPanel) invPanel.classList.add('hidden');
    });
    const statsToggle = document.getElementById('stats-toggle');
    if(statsToggle) statsToggle.addEventListener('click', () => {
        sfx.init();
        toggleStats();
    });
    const statsClose = document.getElementById('stats-close');
    if(statsClose) statsClose.addEventListener('click', () => {
        const statsPanel = document.getElementById('stats-panel');
        if(statsPanel) statsPanel.classList.add('hidden');
    });

    document.querySelectorAll('.stat-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = btn.getAttribute('data-stat');
            if(G.player.statPoints > 0 && G.player.stats[s] !== undefined){
                G.player.stats[s]++;
                G.player.statPoints--;
                sfx.playLevelUp();
                recalculatePlayerStats();
                notify(`+1 ${s.toUpperCase()} artırıldı!`, 'xp');
                if(typeof saveGame === 'function') saveGame();
            }
        });
    });
})();

// ==================== 3D CHARACTER PREVIEW & CREATION UI ====
let previewAnimId = null;
(function setupCharacterCreationPreview(){
    const previewCanvas = document.getElementById('preview-canvas');
    if(!previewCanvas) return;

    let previewRenderer, previewScene, previewCamera;
    let previewCharGroup = null, previewPedestal, previewRuneRing, previewElemLight;
    let previewParticles = [];
    let isDragging = false, prevPointerX = 0;

    try {
        previewRenderer = new THREE.WebGLRenderer({ canvas: previewCanvas, antialias: true, alpha: true });
        previewRenderer.setSize(280, 320, false);
        previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        previewRenderer.shadowMap.enabled = true;
        previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

        previewScene = new THREE.Scene();

        previewCamera = new THREE.PerspectiveCamera(38, 280 / 320, 0.1, 50);
        previewCamera.position.set(0, 1.45, 4.2);
        previewCamera.lookAt(0, 1.25, 0);

        // Studio Lighting
        const ambLight = new THREE.AmbientLight(0x404855, 1.1);
        previewScene.add(ambLight);

        const dirLight = new THREE.DirectionalLight(0xfff7e6, 1.8);
        dirLight.position.set(2.5, 4.5, 3.5);
        dirLight.castShadow = true;
        previewScene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0x4466aa, 0.8);
        backLight.position.set(-2, 3, -3);
        previewScene.add(backLight);

        previewElemLight = new THREE.PointLight(0xff5500, 2.0, 7);
        previewElemLight.position.set(0, 1.6, 1.4);
        previewScene.add(previewElemLight);

        // Circular Ancient Stone Pedestal
        previewPedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(1.22, 1.34, 0.22, 28),
            new THREE.MeshStandardMaterial({color: 0x1f242d, roughness: 0.85, metalness: 0.15})
        );
        previewPedestal.position.y = -0.11;
        previewPedestal.receiveShadow = true;
        previewScene.add(previewPedestal);

        previewRuneRing = new THREE.Mesh(
            new THREE.RingGeometry(0.85, 1.15, 28),
            new THREE.MeshBasicMaterial({color: 0xff4500, side: THREE.DoubleSide})
        );
        previewRuneRing.rotation.x = -Math.PI / 2;
        previewRuneRing.position.y = 0.005;
        previewScene.add(previewRuneRing);

    } catch (e) {
        console.warn('Could not initialize 3D preview renderer:', e);
        return;
    }

    // Function to build orbiting elemental particles
    function buildPreviewParticles(color){
        previewParticles.forEach(p => previewScene.remove(p.mesh));
        previewParticles = [];

        const pGeo = new THREE.DodecahedronGeometry(0.045, 0);
        const pMat = new THREE.MeshBasicMaterial({color: color});

        for(let i = 0; i < 22; i++){
            const mesh = new THREE.Mesh(pGeo, pMat);
            const angle = (i / 22) * Math.PI * 2;
            const radius = 0.9 + rng(0, 0.4);
            const y = rng(0.1, 2.2);
            mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
            previewScene.add(mesh);
            previewParticles.push({
                mesh,
                angle,
                radius,
                speed: rng(0.8, 1.8),
                baseY: y,
                bobSpeed: rng(1.5, 3.5)
            });
        }
    }

    // Update 3D Character & UI Stats in Preview
    let currentStep = 1;
    function updatePreview(){
        const className = G.selectedClass || 'warrior';
        const elementKey = G.selectedElement || 'fire';
        const cls = CLASSES[className] || CLASSES.warrior;
        const elem = ELEMENTS[elementKey] || ELEMENTS.fire;

        // In step 1, show neutral golden medieval aura; in step 2, show element aura
        const themeColor = (currentStep === 1) ? 0xc59b27 : elem.color;

        // Rebuild 3D Model on Pedestal
        if(previewCharGroup){
            previewScene.remove(previewCharGroup);
        }
        previewCharGroup = buildCompleteCharacter(className, elementKey, true);
        previewCharGroup.position.set(0, 0, 0);
        previewScene.add(previewCharGroup);

        // Update Pedestal Glow & Lights
        if(previewRuneRing) previewRuneRing.material.color.setHex(themeColor);
        if(previewElemLight) previewElemLight.color.setHex(themeColor);

        buildPreviewParticles(themeColor);

        // Update Text Info
        const titleEl = document.getElementById('preview-hero-title');
        const subtitleEl = document.getElementById('preview-hero-subtitle');
        const badgeEl = document.getElementById('preview-element-badge');

        const classSubtitles = {
            warrior: 'Çelik Kılıç & Kalkan Ustası',
            mage: 'Kadim Kristal & Elementel Büyü',
            archer: 'Çevik Avcı & Ölümcül İsabet'
        };
        const elementBadges = {
            fire: { text: '🔥 Ateş Muhafızı', cls: 'badge-fire' },
            water: { text: '💧 Su & Buz Efendisi', cls: 'badge-water' },
            earth: { text: '🌿 Doğa & Toprak Koruyucusu', cls: 'badge-earth' },
            air: { text: '💨 Fırtına & Rüzgar Hakimi', cls: 'badge-air' }
        };

        if(titleEl) titleEl.textContent = cls.name;
        if(subtitleEl) subtitleEl.textContent = classSubtitles[className] || '';
        if(badgeEl){
            const b = elementBadges[elementKey] || elementBadges.fire;
            badgeEl.textContent = b.text;
            badgeEl.className = b.cls;
            if(currentStep === 1) badgeEl.classList.add('hidden');
            else badgeEl.classList.remove('hidden');
        }

        // Update Animated Stat Bars
        const statHp = document.getElementById('stat-hp');
        const statAtk = document.getElementById('stat-atk');
        const statDef = document.getElementById('stat-def');
        const statSpd = document.getElementById('stat-spd');

        const statsConfig = {
            warrior: { hp: '95%', atk: '80%', def: '85%', spd: '50%' },
            mage:    { hp: '60%', atk: '95%', def: '40%', spd: '70%' },
            archer:  { hp: '75%', atk: '75%', def: '60%', spd: '95%' }
        };
        const st = statsConfig[className] || statsConfig.warrior;
        if(statHp) statHp.style.width = st.hp;
        if(statAtk) statAtk.style.width = st.atk;
        if(statDef) statDef.style.width = st.def;
        if(statSpd) statSpd.style.width = st.spd;
    }

    // Drag to Rotate Interactive Pedestal
    const previewBox = document.getElementById('preview-box');
    if(previewBox){
        previewBox.addEventListener('pointerdown', e => {
            isDragging = true;
            prevPointerX = e.clientX;
        });
        window.addEventListener('pointermove', e => {
            if(!isDragging || !previewCharGroup) return;
            const dx = e.clientX - prevPointerX;
            prevPointerX = e.clientX;
            previewCharGroup.rotation.y += dx * 0.015;
        });
        window.addEventListener('pointerup', () => { isDragging = false; });
        window.addEventListener('pointercancel', () => { isDragging = false; });
    }

    // Setup Mystical Sequential Step Navigation
    const step1Content = document.getElementById('step-1-content');
    const step2Content = document.getElementById('step-2-content');
    const nextBtn = document.getElementById('next-to-element-btn');
    const backBtn = document.getElementById('back-to-class-btn');
    const modalTitle = document.getElementById('instructions-title');
    const modalSubtitle = document.getElementById('instructions-subtitle');

    function goToStep(stepNum){
        sfx.init();
        currentStep = stepNum;
        if(stepNum === 1){
            if(modalTitle) modalTitle.textContent = '⚔️ FANTASY QUEST ⚔️';
            if(modalSubtitle) modalSubtitle.textContent = 'Kaderini Mühürleyecek Kahramanı Seç';
            if(step1Content) step1Content.classList.remove('hidden');
            if(step2Content) step2Content.classList.add('hidden');
            sfx.playPickup();
            updatePreview();
        } else if(stepNum === 2){
            if(modalTitle) modalTitle.textContent = '⚜️ KADİM MÜHÜR UYANDI ⚜️';
            if(modalSubtitle) modalSubtitle.textContent = 'Kahramanının Ruhunu Hangi Kadim Güç Yönetecek?';
            if(step2Content) step2Content.classList.remove('hidden');
            if(step1Content) step1Content.classList.add('hidden');
            sfx.playElementSelect(G.selectedElement || 'fire');
            updatePreview();
        }
    }

    if(nextBtn) nextBtn.addEventListener('click', () => goToStep(2));
    if(backBtn) backBtn.addEventListener('click', () => goToStep(1));

    // Class selection cards
    const classCards = document.querySelectorAll('#class-options .option-card');
    classCards.forEach(card => {
        card.addEventListener('click', () => {
            sfx.init();
            classCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            G.selectedClass = card.getAttribute('data-class');
            sfx.playPickup();
            updatePreview();
        });
    });

    // Element selection cards
    const elementCards = document.querySelectorAll('#element-options .option-card');
    elementCards.forEach(card => {
        card.addEventListener('click', () => {
            sfx.init();
            elementCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            G.selectedElement = card.getAttribute('data-element');
            sfx.playElementSelect(G.selectedElement);
            updatePreview();
        });
    });

    // Animation Loop for Preview Scene
    let lastPreviewTime = performance.now();
    function animatePreview(){
        if(G.running){
            if(previewAnimId) cancelAnimationFrame(previewAnimId);
            return;
        }
        previewAnimId = requestAnimationFrame(animatePreview);

        const now = performance.now();
        const dt = Math.min((now - lastPreviewTime) * 0.001, 0.05);
        lastPreviewTime = now;

        // Auto Turntable Rotation when not dragging
        if(!isDragging && previewCharGroup){
            previewCharGroup.rotation.y += dt * 0.45;
        }

        // Idle breathing on preview character
        if(previewCharGroup && previewCharGroup.userData){
            const u = previewCharGroup.userData;
            const breath = Math.sin(now * 0.003) * 0.025;
            if(u.torso) u.torso.position.y = 1.35 + breath;
            if(u.cape) u.cape.rotation.x = -0.05 + breath * 2;
            if(u.staffOrb){
                u.staffOrb.rotation.y += dt * 2.5;
                u.staffOrb.rotation.x += dt * 1.5;
            }
            if(u.staffRing){
                u.staffRing.rotation.z += dt * 3.5;
                u.staffRing.rotation.y += dt * 2.0;
            }
        }

        // Orbiting particles
        previewParticles.forEach(p => {
            p.angle += dt * p.speed;
            p.mesh.position.x = Math.cos(p.angle) * p.radius;
            p.mesh.position.z = Math.sin(p.angle) * p.radius;
            p.mesh.position.y = p.baseY + Math.sin(now * 0.002 * p.bobSpeed) * 0.12;
            p.mesh.rotation.y += dt * 2;
        });

        previewRenderer.render(previewScene, previewCamera);
    }

    // Initial build & start loop
    updatePreview();
    animatePreview();
})();

// ==================== CHECK & DISPLAY SAVED GAME BANNER ====================
function checkAndDisplaySavedGame(){
    const save = typeof getSavedGame === 'function' ? getSavedGame() : null;
    const continueBox = document.getElementById('continue-save-box');
    const continueBtn = document.getElementById('continue-adventure-btn');
    const resetBtn = document.getElementById('reset-save-btn');
    const saveDesc = document.getElementById('save-box-desc');

    if(!continueBox) return;

    if(!save){
        continueBox.classList.add('hidden');
        return;
    }

    const cls = (CLASSES && CLASSES[save.className]) ? CLASSES[save.className] : { name: save.className, icon: '⚔️' };
    const elem = (ELEMENTS && ELEMENTS[save.element]) ? ELEMENTS[save.element] : { name: save.element, icon: '🔥' };
    const gold = (save.inventory && save.inventory['goldCoin']) || save.gold || 0;
    const invCount = Object.values(save.inventory || {}).reduce((a, b) => a + b, 0);

    continueBox.classList.remove('hidden');
    if(continueBtn){
        continueBtn.innerHTML = `⚔️ Maceraya Devam Et (Seviye ${save.level} - ${cls.name})`;
        continueBtn.onclick = () => {
            if(typeof loadSavedGame === 'function') loadSavedGame();
        };
    }
    if(resetBtn){
        resetBtn.onclick = () => {
            if(typeof deleteSavedGame === 'function') deleteSavedGame();
            continueBox.classList.add('hidden');
            notify('⚜️ Önceki kayıt silindi. Yeni bir kahraman seç!', 'warn');
        };
    }
    if(saveDesc){
        saveDesc.innerHTML = `
            <span class="save-badge">${cls.icon} ${cls.name}</span>
            <span class="save-badge">${elem.icon} ${elem.name}</span>
            <span>• Seviye <b>${save.level}</b></span>
            <span>• 🪙 <b>${gold}</b> Altın</span>
            <span>• 🎒 <b>${invCount}</b> Eşya</span>
        `;
    }
}

// Check save state on startup
window.addEventListener('DOMContentLoaded', () => {
    checkAndDisplaySavedGame();
});
setTimeout(checkAndDisplaySavedGame, 100);

// Global Exports
window.updateMinimap = updateMinimap;
window.spawnDrop = spawnDrop;
window.updateDrops = updateDrops;
window.pickupItem = pickupItem;
window.usePotion = usePotion;
window.useInventoryItem = useInventoryItem;
window.toggleInventory = toggleInventory;
window.renderInventory = renderInventory;
window.updateHUD = updateHUD;
window.notify = notify;
window.spawnDmgNumber = spawnDmgNumber;
window.checkAndDisplaySavedGame = checkAndDisplaySavedGame;
window.DropPool = DropPool;
