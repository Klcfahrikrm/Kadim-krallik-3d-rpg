// ============================================================
//  Fantasy Quest – 3D Action RPG (Graphical Overhaul)
//  Classes: Savaşçı (Warrior), Büyücü (Mage), Okçu (Archer)
//  Elements: Ateş (Fire), Su (Water), Toprak (Earth), Hava (Air)
//  Three.js r160 + Web Audio API + Procedural Textures & Shading
// ============================================================

// ==================== CONSTANTS =============================
const PLAYER_BASE_SPEED   = 0.14;
const PLAYER_TURN_SPEED   = 0.16;
const CAM_SMOOTH          = 0.09;
const CAM_MIN_DIST        = 4.5;
const CAM_MAX_DIST        = 24;
const CAM_INIT_DIST       = 13;
const CAM_INIT_PHI        = 0.95;
const ATTACK_RANGE        = 3.8;
const ATTACK_COOLDOWN_MS  = 520;
const AGGRO_RANGE         = 13;
const MONSTER_ATK_RANGE   = 2.3;
const MONSTER_BASE_SPEED  = 0.045;
const MONSTER_ATK_CD      = 1300;
const RESPAWN_MS          = 10000;
const WORLD_HALF          = 95;

function rng(min, max) {
    return min + Math.random() * (max - min);
}

function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ==================== CLASS & ELEMENT CONFIG ================
const CLASSES = {
    warrior: {
        name: 'Savaşçı',
        icon: '⚔️',
        weaponName: 'Kılıç',
        hpBonus: 25,
        atkBonus: 3,
        defBonus: 2,
        speedBonus: 0,
        critChance: 0.18,
        skillCd: 3.4,
        skillPowerMult: 1.0,
        tunicColor: 0x244275,
    },
    mage: {
        name: 'Büyücü',
        icon: '🪄',
        weaponName: 'Asa',
        hpBonus: -10,
        atkBonus: 0,
        defBonus: 0,
        speedBonus: 0,
        critChance: 0.15,
        skillCd: 2.2,
        skillPowerMult: 1.45,
        tunicColor: 0x482372,
    },
    archer: {
        name: 'Okçu',
        icon: '🏹',
        weaponName: 'Yay',
        hpBonus: 0,
        atkBonus: 1,
        defBonus: 1,
        speedBonus: 0.025,
        critChance: 0.35,
        skillCd: 3.0,
        skillPowerMult: 1.05,
        tunicColor: 0x224f1c,
    }
};

const ELEMENTS = {
    fire: {
        name: 'Ateş',
        icon: '🔥',
        skillName: 'Alev Patlaması',
        color: 0xff4500,
        glowColor: 0xff6600,
        speed: 0.68,
        radius: 0.45,
        aoe: 4.8,
        dmgMult: 1.05,
        lightColor: 0xff5500,
    },
    water: {
        name: 'Su',
        icon: '💧',
        skillName: 'Su & Buz Dalgası',
        color: 0x00d2ff,
        glowColor: 0x66e5ff,
        speed: 0.64,
        radius: 0.44,
        aoe: 5.0,
        dmgMult: 1.0,
        lightColor: 0x00ccff,
    },
    earth: {
        name: 'Toprak',
        icon: '🌿',
        skillName: 'Sarsıcı Doğa Küresi',
        color: 0x2ecc71,
        glowColor: 0x55ef94,
        speed: 0.58,
        radius: 0.48,
        aoe: 5.6,
        dmgMult: 1.15,
        lightColor: 0x27ae60,
    },
    air: {
        name: 'Hava',
        icon: '💨',
        skillName: 'Hızlı Fırtına Hortumu',
        color: 0xfff066,
        glowColor: 0xfffa99,
        speed: 0.82,
        radius: 0.40,
        aoe: 4.2,
        dmgMult: 0.95,
        lightColor: 0xffea00,
    }
};

// ==================== SOUND SYNTHESIZER =====================
class SoundFX {
    constructor() { this.ctx = null; }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
    playSwing() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.16);
    }
    playHit() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.12);
    }
    playShoot() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.22);
    }
    playBlast() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.4);
    }
    playThunder() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(24, now + 0.65);
        gain.gain.setValueAtTime(0.48, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.7);
    }
    playDefeat() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [220, 180, 140].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.15, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.16);
        });
    }
    playLevelUp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.11);
            gain.gain.setValueAtTime(0.22, now + i * 0.11);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.11 + 0.22);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now + i * 0.11); osc.stop(now + i * 0.11 + 0.24);
        });
    }
    playPotion() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.23);
    }
    playPickup() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.21);
    }
    playElementSelect(elemKey) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        if(elemKey === 'fire'){
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        } else if(elemKey === 'water'){
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        } else if(elemKey === 'earth'){
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        } else { // air
            osc.type = 'sine';
            osc.frequency.setValueAtTime(659.25, now);
            osc.frequency.linearRampToValueAtTime(1174.66, now + 0.2);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        }
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.3);
    }
    playHurt() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.16);
    }
}
const sfx = new SoundFX();

// ==================== ITEM & MONSTER DEFINITIONS ============
const ITEMS = {
    healthPotion : { name:'Health Potion', emoji:'🧪', desc:'Canı 35 HP doldurur (Kısayol: 1)', effect:'heal', value:35 },
    attackGem    : { name:'Attack Gem',    emoji:'💎', desc:'Tıkla: Kalıcı +3 Saldırı Gücü',    effect:'attackUp', value:3 },
    ironShield   : { name:'Iron Shield',   emoji:'🛡️', desc:'Tıkla: Kalıcı +2 Savunma',        effect:'defenseUp', value:2 },
    goldCoin     : { name:'Gold Coin',     emoji:'🪙', desc:'Canavarlardan düşen saf altın',    effect:'none', value:0 },
};

const MON = {
    slime: {
        name:'Wild Slime',  lvl:1, hp:35,  atk:5,  exp:25,  spd:1.0, color:0x3bd43b,  sz:0.65,
        drops:[{id:'healthPotion',ch:.45},{id:'goldCoin',ch:.65}]
    },
    boar: {
        name:'Fierce Boar', lvl:3, hp:70,  atk:10, exp:50,  spd:0.95, color:0x7a431c, sz:0.85,
        drops:[{id:'healthPotion',ch:.35},{id:'attackGem',ch:.22},{id:'goldCoin',ch:.60}]
    },
    wolf: {
        name:'Shadow Wolf', lvl:5, hp:100, atk:16, exp:85,  spd:1.45, color:0x34424f, sz:0.75,
        drops:[{id:'healthPotion',ch:.40},{id:'attackGem',ch:.28},{id:'goldCoin',ch:.70}]
    },
    troll: {
        name:'Forest Troll',lvl:8, hp:180, atk:24, exp:140, spd:0.75, color:0x466034, sz:1.25,
        drops:[{id:'healthPotion',ch:.60},{id:'attackGem',ch:.35},{id:'ironShield',ch:.30},{id:'goldCoin',ch:.80}]
    },
    boss_urgathok: {
        name:'Ur-Gathok (Orman Lordu)', isBoss: true, lvl:5, hp:1000, atk:26, exp:450, spd:0.82, sz:2.5, color:0x4a121a,
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    }
};

// ==================== GAME STATE ============================
const G = {
    running : false,
    selectedClass: 'warrior',
    selectedElement: 'fire',
    bossSpawned: false,
    dayNightTime: 0.25,
    activeMeteors: [],
    arrowRainZones: [],
    player  : {
        className: 'warrior',
        element: 'fire',
        hp:120, maxHp:120, level:1, exp:0, expNext:100,
        atk:16, def:2, speed:PLAYER_BASE_SPEED, critChance:0.18,
        skillCd: 3.4, skillPowerMult: 1.0,
        ultCd: 12.0, lastUltTime: -999999,
        alive:true, lastAtk:0, lastSkillTime: -999999,
        inventory: { healthPotion: 2 },
        stats: { str: 14, int: 8, dex: 10, vit: 14 },
        statPoints: 0,
        kills: 0,
        vy: 0,
        onGround: true,
        isWhirlwind: false,
        whirlwindEndTime: 0,
        lastWhirlHit: 0
    },
    cam     : { dist:CAM_INIT_DIST, phi:CAM_INIT_PHI, theta:0, rmb:false, lmb:false },
    keys    : {},
    monsters: [],
    drops   : [],
    projectiles: [],
    particles: [],
    clouds: [],
    grassTufts: [],
    smokePuffs: [],
    fireflies: [],
    target  : null,
    attackAnim: 0,
    walkCycle: 0,
    isMoving: false,
    inventoryDirty: true,
};

// ==================== THREE.JS SETUP ========================
const canvas   = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x7ec1e4);
scene.fog = new THREE.FogExp2(0x82c6e6, 0.0075);

const camera = new THREE.PerspectiveCamera(54, window.innerWidth/window.innerHeight, 0.1, 350);
const clock  = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouseVec2 = new THREE.Vector2();

// Minimap Context
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');

// ==================== PROCEDURAL TEXTURES ===================
function createProceduralGrassTexture(){
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#42882c';
    ctx.fillRect(0, 0, 256, 256);

    // Fine blade texture flecks
    for(let i = 0; i < 3000; i++){
        const x = Math.random() * 256, y = Math.random() * 256;
        const w = 1.5 + Math.random() * 2, h = 3 + Math.random() * 5;
        ctx.fillStyle = Math.random() > 0.5 ? '#4da233' : '#387325';
        ctx.fillRect(x, y, w, h);
    }
    // Subtle wildflowers
    for(let i = 0; i < 40; i++){
        const x = Math.random() * 256, y = Math.random() * 256;
        ctx.fillStyle = Math.random() > 0.5 ? '#fff477' : '#ffffff';
        ctx.fillRect(x, y, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    return tex;
}

function createProceduralCobbleTexture(){
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6e5a44';
    ctx.fillRect(0, 0, 256, 256);

    for(let y = 0; y < 256; y += 18){
        const rowOffset = (y / 18) % 2 * 9;
        for(let x = 0; x < 256; x += 18){
            ctx.fillStyle = Math.random() > 0.4 ? '#8a745b' : '#9b846a';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x + rowOffset + 1, y + 1, 16, 16, 3) : ctx.rect(x + rowOffset + 1, y + 1, 16, 16);
            ctx.fill();
        }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
}

// ==================== LIGHTING & DAY/NIGHT ===================
let mainSunLight = null, mainAmbLight = null, mainHemiLight = null;
(function setupLighting(){
    mainAmbLight = new THREE.AmbientLight(0x7a92b5, 0.65);
    scene.add(mainAmbLight);

    mainHemiLight = new THREE.HemisphereLight(0x99ddff, 0x476b32, 0.45);
    scene.add(mainHemiLight);

    mainSunLight = new THREE.DirectionalLight(0xfffae6, 1.4);
    mainSunLight.position.set(40, 65, 30);
    mainSunLight.castShadow = true;
    const s = mainSunLight.shadow;
    s.mapSize.width = s.mapSize.height = 2048;
    s.camera.near = 1;   s.camera.far = 160;
    s.camera.left = -65; s.camera.right = 65;
    s.camera.top  =  65; s.camera.bottom = -65;
    s.bias = -0.0005;
    scene.add(mainSunLight);
})();

function updateDayNight(dt){
    G.dayNightTime = (G.dayNightTime + dt / 90.0) % 1.0;
    const isDay = G.dayNightTime < 0.5;

    // Smooth sun movement across sky
    const sunAngle = G.dayNightTime * Math.PI * 2;
    if(mainSunLight){
        mainSunLight.position.x = Math.cos(sunAngle) * 55;
        mainSunLight.position.y = Math.max(8, Math.sin(sunAngle) * 65);
        mainSunLight.position.z = Math.sin(sunAngle) * 45;

        if(isDay){
            mainSunLight.color.setHex(0xfff4d6);
            mainSunLight.intensity = 1.45;
            if(mainAmbLight) {
                mainAmbLight.color.setHex(0x7a92b5);
                mainAmbLight.intensity = 0.65;
            }
            scene.background.setHex(0x7ec1e4);
            scene.fog.color.setHex(0x82c6e6);
        } else {
            mainSunLight.color.setHex(0x4a70b0);
            mainSunLight.intensity = 0.42;
            if(mainAmbLight) {
                mainAmbLight.color.setHex(0x151d30);
                mainAmbLight.intensity = 0.45;
            }
            scene.background.setHex(0x080c18);
            scene.fog.color.setHex(0x0b1122);
        }
    }

    // Update HUD Celestial Indicator
    const indicator = document.getElementById('day-night-indicator');
    const timeIcon = document.getElementById('time-icon');
    const timeText = document.getElementById('time-text');
    const buffBadge = document.getElementById('buff-badge');
    if(indicator){
        if(isDay){
            indicator.className = 'daytime';
            if(timeIcon) timeIcon.textContent = '☀️';
            if(timeText) timeText.textContent = 'GÜNDÜZ';
            if(buffBadge) buffBadge.textContent = '+%50 Canavar Gücü';
        } else {
            indicator.className = 'nighttime';
            if(timeIcon) timeIcon.textContent = '🌙';
            if(timeText) timeText.textContent = 'GECE';
            if(buffBadge) buffBadge.textContent = 'Canavarlar Sakin';
        }
    }
}

// ==================== PROCEDURAL SKY & CLOUDS ===============
(function createAtmosphere(){
    // Sky gradient dome
    const skyGeo = new THREE.SphereGeometry(240, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 16; skyCanvas.height = 256;
    const sCtx = skyCanvas.getContext('2d');
    const grad = sCtx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#2272a8');
    grad.addColorStop(0.6, '#6db5db');
    grad.addColorStop(1.0, '#a5dbf2');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 16, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);

    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    // 16 Floating 3D Low-Poly Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true,
        transparent: true,
        opacity: 0.88,
    });

    for(let i = 0; i < 16; i++){
        const cg = new THREE.Group();
        const numPuffs = 4 + Math.floor(Math.random() * 4);
        for(let p = 0; p < numPuffs; p++){
            const puff = new THREE.Mesh(
                new THREE.DodecahedronGeometry(rng(2.8, 5.5), 1),
                cloudMat
            );
            puff.position.set(rng(-4, 4), rng(-1, 1.8), rng(-3, 3));
            cg.add(puff);
        }
        cg.position.set(rng(-110, 110), rng(45, 65), rng(-110, 110));
        cg.userData.speed = rng(0.3, 0.8);
        scene.add(cg);
        G.clouds.push(cg);
    }
})();

// ==================== TERRAIN & ENVIRONMENT =================
(function createTerrain(){
    const grassTex = createProceduralGrassTexture();
    const cobbleTex = createProceduralCobbleTexture();

    // Main grass terrain
    const gnd = new THREE.Mesh(
        new THREE.PlaneGeometry(WORLD_HALF * 2.4, WORLD_HALF * 2.4, 32, 32),
        new THREE.MeshStandardMaterial({
            map: grassTex,
            roughness: 0.88,
            metalness: 0.04
        })
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.receiveShadow = true;
    scene.add(gnd);

    // Cobblestone village center
    const vil = new THREE.Mesh(
        new THREE.CircleGeometry(19, 36),
        new THREE.MeshStandardMaterial({
            map: cobbleTex,
            roughness: 0.85,
            metalness: 0.08
        })
    );
    vil.rotation.x = -Math.PI / 2;
    vil.position.y = 0.03;
    vil.receiveShadow = true;
    scene.add(vil);

    // Roads
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x9e8765,
        roughness: 0.92,
        metalness: 0.02
    });

    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 55), roadMat);
    p1.rotation.x = -Math.PI / 2;
    p1.position.set(0, 0.04, 38);
    p1.receiveShadow = true;
    scene.add(p1);

    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 32), roadMat);
    p2.rotation.x = -Math.PI / 2; p2.rotation.z = Math.PI / 3.6;
    p2.position.set(16, 0.04, 22);
    p2.receiveShadow = true;
    scene.add(p2);

    const p3 = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 32), roadMat);
    p3.rotation.x = -Math.PI / 2; p3.rotation.z = -Math.PI / 3.6;
    p3.position.set(-16, 0.04, 22);
    p3.receiveShadow = true;
    scene.add(p3);

    // Scattered 3D Grass Tufts in meadows (animate in wind)
    const tuftMat = new THREE.MeshStandardMaterial({
        color: 0x48962c,
        roughness: 0.85,
        metalness: 0.05,
        side: THREE.DoubleSide
    });
    const tuftGeo = new THREE.ConeGeometry(0.25, 0.75, 4);

    for(let i = 0; i < 110; i++){
        let x, z;
        do {
            x = rng(-WORLD_HALF, WORLD_HALF);
            z = rng(-WORLD_HALF, WORLD_HALF);
        } while(Math.sqrt(x*x + z*z) < 20);

        const tg = new THREE.Group();
        for(let b = 0; b < 3; b++){
            const blade = new THREE.Mesh(tuftGeo, tuftMat);
            blade.position.set(rng(-0.15, 0.15), 0.35, rng(-0.15, 0.15));
            blade.rotation.set(rng(-0.2, 0.2), rng(0, Math.PI), rng(-0.2, 0.2));
            tg.add(blade);
        }
        tg.position.set(x, 0, z);
        scene.add(tg);
        G.grassTufts.push(tg);
    }
})();

// ==================== VILLAGE PROPS & ENHANCEMENTS ==========
function makeHouse(x, z, rot, wc, rc, sc){
    sc = sc || 1;
    const g = new THREE.Group();
    // Walls
    const w = new THREE.Mesh(new THREE.BoxGeometry(4.2*sc, 3.2*sc, 3.4*sc), new THREE.MeshStandardMaterial({color:wc, roughness:0.85, metalness:0.05}));
    w.position.y = 1.6*sc; w.castShadow = true; w.receiveShadow = true; g.add(w);
    // Roof
    const r = new THREE.Mesh(new THREE.ConeGeometry(3.4*sc, 2.2*sc, 4), new THREE.MeshStandardMaterial({color:rc, roughness:0.75, metalness:0.1}));
    r.position.y = 4.3*sc; r.rotation.y = Math.PI/4; r.castShadow = true; g.add(r);
    // Door
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.9*sc, 1.8*sc), new THREE.MeshStandardMaterial({color:0x422915, side:THREE.DoubleSide, roughness:0.9}));
    d.position.set(0, 0.9*sc, 1.71*sc); g.add(d);
    // Lit Windows
    [-1.2, 1.2].forEach(s => {
        const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.6*sc, 0.6*sc), new THREE.MeshBasicMaterial({color:0xfff099, side:THREE.DoubleSide}));
        wn.position.set(s*sc, 1.9*sc, 1.71*sc); g.add(wn);
    });
    // Stone Chimney with Smoke
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.55*sc, 1.6*sc, 0.55*sc), new THREE.MeshStandardMaterial({color:0x6b6b6b, roughness:0.9}));
    chim.position.set(1.1*sc, 4.4*sc, -0.6*sc); chim.castShadow = true; g.add(chim);
    g.userData.chimneyTop = new THREE.Vector3(x + 1.1*sc, 5.2*sc, z - 0.6*sc);

    g.position.set(x, 0, z); g.rotation.y = rot;
    scene.add(g);
    return g;
}

function makeWell(x, z){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.85, 14), new THREE.MeshStandardMaterial({color:0x6b6b6b, roughness:0.85}));
    base.position.set(0, 0.42, 0); base.castShadow = true; base.receiveShadow = true;
    g.add(base);

    // Reflective shiny water
    const water = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 14), new THREE.MeshStandardMaterial({
        color: 0x2288ee,
        roughness: 0.1,
        metalness: 0.15,
        transparent: true,
        opacity: 0.85
    }));
    water.position.set(0, 0.75, 0); g.add(water);

    [-0.85, 0.85].forEach(s => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.3, 6), new THREE.MeshStandardMaterial({color:0x4a3219, roughness:0.85}));
        post.position.set(s, 1.8, 0); post.castShadow = true; g.add(post);
    });

    const rf = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.1, 4), new THREE.MeshStandardMaterial({color:0x8B4513, roughness:0.8}));
    rf.position.set(0, 3.4, 0); rf.rotation.y = Math.PI/4; rf.castShadow = true; g.add(rf);

    g.position.set(x, 0, z); scene.add(g);
}

function makeTorch(x, z){
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.5, 6), new THREE.MeshStandardMaterial({color:0x3e2815, roughness:0.9}));
    post.position.set(x, 1.25, z); post.castShadow = true; scene.add(post);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 7), new THREE.MeshBasicMaterial({color:0xff7700}));
    flame.position.set(x, 2.6, z); scene.add(flame);

    const light = new THREE.PointLight(0xff9933, 0.95, 16);
    light.position.set(x, 2.8, z); scene.add(light);
}

function makeStall(x, z){
    const g = new THREE.Group();
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.5), new THREE.MeshStandardMaterial({color:0x8B6914, roughness:0.8}));
    table.position.y = 1.05; table.castShadow = true; g.add(table);

    [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 5), new THREE.MeshStandardMaterial({color:0x4a3219}));
        leg.position.set(lx, 0.52, lz); g.add(leg);
    });

    const canopy = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), new THREE.MeshStandardMaterial({color:0xcc2929, side:THREE.DoubleSide, roughness:0.7}));
    canopy.position.set(0, 2.5, 0); canopy.rotation.x = -Math.PI/2 + 0.15; g.add(canopy);

    [0xff4444, 0x44ff44, 0xffff44, 0xff8844].forEach((c, i) => {
        const pot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 7), new THREE.MeshStandardMaterial({color:c, roughness:0.3}));
        pot.position.set(-0.6 + i * 0.4, 1.22, 0); g.add(pot);
    });

    // Barrels & crates next to stall
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.9, 10), new THREE.MeshStandardMaterial({color:0x5e3a1e, roughness:0.8}));
    barrel.position.set(1.8, 0.45, 0.2); barrel.castShadow = true; g.add(barrel);

    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshStandardMaterial({color:0x7d542a, roughness:0.85}));
    crate.position.set(1.9, 0.35, -0.9); crate.castShadow = true; g.add(crate);

    g.position.set(x, 0, z); scene.add(g);
}

const villageHouses = [];
(function buildVillage(){
    villageHouses.push(makeHouse(-9, -9,  0.35, 0xd4b07e, 0x8b4513, 1.05));
    villageHouses.push(makeHouse( 9, -8, -0.45, 0xc8aa80, 0x654321, 1.15));
    villageHouses.push(makeHouse(-8,  8,  0.80, 0xebd3a7, 0x8b0000, 0.95));
    villageHouses.push(makeHouse(11,  6, -0.65, 0xb2ad63, 0x556b2f, 1.0));
    villageHouses.push(makeHouse(-12, 1,  1.25, 0xc8641c, 0x4a3520, 0.85));

    makeWell(-4.5, -2.5);
    makeStall(4.5, -2.5);

    [[-7, -5], [7, -5], [-5, 8], [5, 8]].forEach(([x, z]) => makeTorch(x, z));

    // Wooden fences around the plaza
    const fm = new THREE.MeshStandardMaterial({color:0x5e391e, roughness:0.85});
    for(let i = -16; i <= 16; i += 2.2){
        if(Math.abs(i) < 3.5) continue;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.15, 5), fm);
        post.position.set(i, 0.58, -14); post.castShadow = true; scene.add(post);

        [0.8, 0.4].forEach(h => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.05), fm);
            rail.position.set(i, h, -14); scene.add(rail);
        });
    }

    // Directional Village Exit Signpost
    const signGroup = new THREE.Group();
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 6), fm);
    signPost.position.y = 1.1; signGroup.add(signPost);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.06), new THREE.MeshStandardMaterial({color:0x8a5b2d, roughness:0.8}));
    signBoard.position.set(0, 1.8, 0); signGroup.add(signBoard);
    signGroup.position.set(3.5, 0, 14);
    signGroup.rotation.y = -Math.PI / 6;
    scene.add(signGroup);
})();

// ==================== NATURE (Trees & Rocks) =================
function makeTree(x, z, sc){
    sc = sc || 1;
    const g = new THREE.Group();
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
}

(function populateNature(){
    for(let i = 0; i < 95; i++){
        let x, z;
        do {
            x = rng(-WORLD_HALF * 1.1, WORLD_HALF * 1.1);
            z = rng(-WORLD_HALF * 1.1, WORLD_HALF * 1.1);
        } while(Math.sqrt(x*x + z*z) < 22);
        makeTree(x, z, rng(0.65, 1.05));
    }
    for(let i = 0; i < 50; i++){
        const x = rng(-WORLD_HALF, WORLD_HALF), z = rng(-WORLD_HALF, WORLD_HALF);
        if(Math.sqrt(x*x + z*z) > 13) makeRock(x, z, rng(0.4, 1.7));
    }

    // 35 Glowing Fireflies hovering in wilderness
    const fireflyMat = new THREE.MeshBasicMaterial({color:0xd4ff55});
    for(let i = 0; i < 35; i++){
        const ff = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), fireflyMat);
        ff.position.set(rng(-75, 75), rng(1.0, 3.5), rng(-75, 75));
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

        // Glowing elemental rune channel along the sword blade
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

        // Glowing Floating Octahedron Crystal (Per requirement: OctahedronGeometry kristal, flatShading: true on crystal)
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

        // Orbiting celestial rune ring
        const orbitRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.34, 0.018, 8, 24),
            new THREE.MeshBasicMaterial({color: elem.glowColor, wireframe: false})
        );
        orbitRing.position.y = 2.22;
        orbitRing.rotation.x = Math.PI / 3;
        g.add(orbitRing);
        g.userData.orbitRing = orbitRing;

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

    // Organic materials with soft shading (flatShading: false, roughness: 0.45-0.7, metalness: 0.1-0.6)
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

        // Curved Heraldic Kite Shield (curved flattened sphere with steel rim & glowing elemental boss)
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

        // Ranger Hooded Cowl with Eagle Feather
        const cowlGeo = new THREE.SphereGeometry(0.28, 12, 10);
        cowlGeo.computeVertexNormals();
        const cowl = new THREE.Mesh(cowlGeo, mantleMat);
        cowl.scale.set(1.02, 1.1, 1.08);
        cowl.position.set(0, 2.28, -0.02); root.add(cowl);

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

    // Articulated Arms using CapsuleGeometry & Spheres (Zero BoxGeometry)
    const armL = new THREE.Group();
    armL.position.set(-0.52, 1.62, 0);
    const laUpperGeo = new THREE.CapsuleGeometry(0.11, 0.22, 6, 10);
    laUpperGeo.computeVertexNormals();
    const laUpper = new THREE.Mesh(laUpperGeo, torsoMat);
    laUpper.position.y = -0.16; laUpper.castShadow = true; armL.add(laUpper);

    const laForearmGeo = new THREE.CapsuleGeometry(0.115, 0.24, 6, 10);
    laForearmGeo.computeVertexNormals();
    const laForearm = new THREE.Mesh(laForearmGeo, leatherMat);
    laForearm.position.y = -0.46; laForearm.castShadow = true; armL.add(laForearm);

    const laHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    laHand.position.y = -0.66; armL.add(laHand);

    if(shieldMesh) armL.add(shieldMesh);
    root.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.52, 1.62, 0);
    const raUpperGeo = new THREE.CapsuleGeometry(0.11, 0.22, 6, 10);
    raUpperGeo.computeVertexNormals();
    const raUpper = new THREE.Mesh(raUpperGeo, torsoMat);
    raUpper.position.y = -0.16; raUpper.castShadow = true; armR.add(raUpper);

    const raForearmGeo = new THREE.CapsuleGeometry(0.115, 0.24, 6, 10);
    raForearmGeo.computeVertexNormals();
    const raForearm = new THREE.Mesh(raForearmGeo, leatherMat);
    raForearm.position.y = -0.46; raForearm.castShadow = true; armR.add(raForearm);

    const raHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    raHand.position.y = -0.66; armR.add(raHand);

    const weapon = createPlayerWeapon(className, elementKey);
    armR.add(weapon);
    root.add(armR);

    // Legs & Boots using CapsuleGeometry (Zero BoxGeometry)
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

    // Dynamic Crescent Sword Slash Arc
    const arcGeo = new THREE.RingGeometry(1.4, 2.2, 16, 1, 0, Math.PI * 0.7);
    const arcMat = new THREE.MeshBasicMaterial({color: elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false});
    const slashArc = new THREE.Mesh(arcGeo, arcMat);
    slashArc.position.set(0, 1.25, 1.1); slashArc.rotation.x = Math.PI / 2; root.add(slashArc);

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
}

rebuildPlayerCharacter('warrior', 'fire');

// ==================== MONSTER MODELS ========================
function monsterModel(type){
    const d = MON[type], s = d.sz, g = new THREE.Group();
    const mat = (c, r=0.55, m=0.15) => new THREE.MeshStandardMaterial({color:c, roughness:r, metalness:m, flatShading:false});

    if(type === 'slime'){
        // Translucent shiny organic jelly slime with inner core (Zero BoxGeometry)
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
        // Organic Capsule Body (Zero BoxGeometry)
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

        // Curved Ivory Tusks (TorusGeometry slice with cone tips per instructions!)
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
        // Lean athletic capsule wolf body (Zero BoxGeometry)
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
        // Massive Muscular Troll Body: Spherical Upper Chest & Tapered Abdomen (Zero BoxGeometry)
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

        // Rocky crags on back (flatShading: true on rocks per instructions)
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
        // Spikes on club head
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
        // Massive Obsidian Demonic Overlord (3.2m tall, Zero BoxGeometry)
        const bossMat = mat(0x241016, 0.55, 0.35); // Obsidian demon hide
        const ironMat = new THREE.MeshStandardMaterial({color: 0x1b191c, roughness: 0.30, metalness: 0.88, flatShading: false});
        const magmaMat = new THREE.MeshStandardMaterial({color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 1.25, roughness: 0.20, flatShading: false});

        // Muscular V-shaped demon chest & abdomen (Capsule + Tapered Cylinder)
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

        // Massive Flanged Mace Head (IcosahedronGeometry with fiery magma spikes)
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

// ==================== SPAWN MONSTERS ========================
function spawnMonster(type, x, z){
    const d = MON[type];
    const model = monsterModel(type);
    model.position.set(x, 0, z);
    scene.add(model);

    const hpBar = makeHPBar();
    const barH = type === 'boss_urgathok' ? d.sz * 2.85 : type === 'troll' ? d.sz * 2.95 : type === 'boar' ? d.sz * 1.65 : d.sz * 2.1;
    hpBar.position.set(x, barH, z);
    if(type === 'boss_urgathok') hpBar.scale.set(1.9, 1.4, 1);
    scene.add(hpBar);

    const pLvl = (G.player && G.player.level) ? G.player.level : 1;
    const tier = Math.floor((pLvl - 1) / 5);
    const scale = 1.0 + tier * 0.45;
    const maxHp = Math.round(d.hp * scale);
    const atk = Math.round(d.atk * scale);
    const exp = Math.round(d.exp * (1.0 + tier * 0.30));

    const m = {
        type, model, hpBar, barH,
        sz: d.sz,
        hp: maxHp, maxHp: maxHp, atk: atk, exp: exp,
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

function spawnBossUrGathok(){
    const existing = G.monsters.find(m => m.type === 'boss_urgathok');
    if(existing){
        existing.alive = true;
        existing.hp = existing.maxHp;
        existing.model.position.set(0, 0, 68);
        existing.model.visible = true;
        existing.hpBar.visible = true;
        existing.state = 'idle';
        G.bossSpawned = true;
        return existing;
    }
    G.bossSpawned = true;
    const b = spawnMonster('boss_urgathok', 0, 68);
    return b;
}

(function createBossArenaLandmark(){
    const monolithMat = new THREE.MeshStandardMaterial({color: 0x1c1418, roughness: 0.85, metalness: 0.2});
    for(let i = 0; i < 8; i++){
        // Offset angle by 0.5 so (x=0, z=51) entrance is an open ceremonial gateway!
        const ang = ((i + 0.5) / 8) * Math.PI * 2;
        const px = Math.sin(ang) * 17;
        const pz = 68 + Math.cos(ang) * 17;
        // Hexagonal ancient carved monolith pillar (Zero BoxGeometry)
        const mono = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.15, 6.2, 6), monolithMat);
        mono.position.set(px, 3.1, pz);
        mono.rotation.y = ang;
        mono.castShadow = true;
        scene.add(mono);

        const flameRune = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), new THREE.MeshBasicMaterial({color: 0xff1800}));
        flameRune.position.set(px, 6.5, pz);
        scene.add(flameRune);
    }
    // Arena Center Ritual Circle
    const ritualDisc = new THREE.Mesh(
        new THREE.RingGeometry(2.5, 12, 28),
        new THREE.MeshBasicMaterial({color: 0x3d1018, side: THREE.DoubleSide})
    );
    ritualDisc.rotation.x = -Math.PI / 2;
    ritualDisc.position.set(0, 0.02, 68);
    scene.add(ritualDisc);

    // Towering Boss Beacon Light Beam (visible across the entire map once awakened at Lv.5)
    const beaconGeo = new THREE.CylinderGeometry(0.35, 0.45, 45, 12);
    const beaconMat = new THREE.MeshBasicMaterial({color: 0xff1800, transparent: true, opacity: 0.45, side: THREE.DoubleSide});
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 22.5, 68);
    beacon.visible = false;
    scene.add(beacon);
    G.bossBeacon = beacon;
})();

(function spawnAllMonsters(){
    // Regular monsters spawn in the fields. World Boss awakens at Level 5!
    for(let i = 0; i < 7; i++){
        const a = (i / 7) * Math.PI * 2, d = 24 + rng(0, 9);
        spawnMonster('slime', Math.cos(a) * d, Math.sin(a) * d);
    }
    for(let i = 0; i < 5; i++){
        const a = (i / 5) * Math.PI * 2 + 0.5, d = 35 + rng(0, 10);
        spawnMonster('boar', Math.cos(a) * d, Math.sin(a) * d);
    }
    for(let i = 0; i < 5; i++){
        const a = (i / 5) * Math.PI * 2 + 1.1, d = 50 + rng(0, 10);
        spawnMonster('wolf', Math.cos(a) * d, Math.sin(a) * d);
    }
    for(let i = 0; i < 3; i++){
        const a = (i / 3) * Math.PI * 2 + 0.3, d = 65 + rng(0, 10);
        spawnMonster('troll', Math.cos(a) * d, Math.sin(a) * d);
    }
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

// ==================== CAMERA UPDATE =========================
function updateCamera(){
    const c = G.cam, pp = playerGroup.position;
    const ox = c.dist * Math.sin(c.phi) * Math.sin(c.theta);
    const oy = c.dist * Math.cos(c.phi);
    const oz = c.dist * Math.sin(c.phi) * Math.cos(c.theta);

    const tx = pp.x + ox;
    const ty = Math.max(pp.y + oy + 1.8, 1.4);
    const tz = pp.z + oz;

    const smooth = 0.16;
    camera.position.x += (tx - camera.position.x) * smooth;
    camera.position.y += (ty - camera.position.y) * smooth;
    camera.position.z += (tz - camera.position.z) * smooth;
    camera.lookAt(pp.x, pp.y + 1.45, pp.z);
}

// ==================== MOVEMENT, DUST & ANIMATION ============
let lastDustTime = 0;
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
        G.player.vy -= 0.012; // Gravity
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

        playerGroup.position.x += mx;
        playerGroup.position.z += mz;

        const targetRot = Math.atan2(mx, mz);
        let diff = targetRot - playerGroup.rotation.y;
        while(diff >  Math.PI) diff -= Math.PI * 2;
        while(diff < -Math.PI) diff += Math.PI * 2;
        playerGroup.rotation.y += diff * 0.28;

        playerGroup.position.x = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, playerGroup.position.x));
        playerGroup.position.z = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, playerGroup.position.z));

        G.walkCycle += dt * (isSprint ? 16 : 11);
        const swing = Math.sin(G.walkCycle) * 0.55;
        if(G.player.onGround){
            leftLeg.rotation.x = swing;
            rightLeg.rotation.x = -swing;
        } else {
            leftLeg.rotation.x = 0.35;
            rightLeg.rotation.x = -0.25;
        }
        leftArm.rotation.x = -swing * 0.75;
        if(G.attackAnim <= 0){
            rightArm.rotation.x = swing * 0.6;
        }
        playerCape.rotation.x = -0.2 - Math.abs(Math.sin(G.walkCycle)) * (isSprint ? 0.55 : 0.35);
        playerTorso.position.y = 1.35 + Math.abs(Math.sin(G.walkCycle)) * 0.06;

        // Spawn Footstep Dust Puffs
        const now = performance.now();
        if(now - lastDustTime > (isSprint ? 100 : 160)){
            lastDustTime = now;
            spawnFootstepDust(playerGroup.position);
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
        const breath = Math.sin(performance.now() * 0.003) * 0.025;
        playerTorso.position.y = 1.35 + breath;
        playerCape.rotation.x = -0.05 + breath * 2;
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

function spawnFootstepDust(pos){
    const dust = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 5, 5),
        new THREE.MeshBasicMaterial({color:0xb09874, transparent:true, opacity:0.65})
    );
    dust.position.set(pos.x + rng(-0.2, 0.2), 0.12, pos.z + rng(-0.2, 0.2));
    scene.add(dust);
    G.particles.push({
        mesh: dust,
        vel: new THREE.Vector3(rng(-0.01, 0.01), 0.015, rng(-0.01, 0.01)),
        life: 0.4
    });
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

    sfx.playHit();
    flashMesh(target.model);
    spawnDmgNumber(target.model.position, dmg, crit ? 'crit' : tag);

    // Flinch & slight knockback on hit
    const pp = playerGroup.position;
    const kx = target.model.position.x - pp.x;
    const kz = target.model.position.z - pp.z;
    const klen = Math.sqrt(kx * kx + kz * kz) || 1;
    if(target.type !== 'boss_urgathok'){
        target.model.position.x += (kx / klen) * 0.18;
        target.model.position.z += (kz / klen) * 0.18;
    }

    // Impact spark burst
    const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
    for(let k = 0; k < 6; k++){
        const sp = new THREE.Mesh(
            new THREE.DodecahedronGeometry(rng(0.06, 0.12), 0),
            new THREE.MeshBasicMaterial({color: crit ? 0xffea00 : elem.color})
        );
        sp.position.copy(target.model.position);
        sp.position.y += rng(0.5, 1.3);
        const theta = rng(0, Math.PI * 2);
        const vel = new THREE.Vector3(Math.cos(theta) * 0.08, rng(0.04, 0.14), Math.sin(theta) * 0.08);
        scene.add(sp);
        G.particles.push({mesh: sp, vel, life: 0.35});
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
        // WARRIOR: Melee Sword Slash
        sfx.playSwing();
        if(playerSlashArc){
            const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
            playerSlashArc.material.color.set(elem.color);
            playerSlashArc.material.opacity = 0.9;
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
        // MAGE: Ranged Magic Bolt from Staff (directed towards mouse)
        sfx.playShoot();
        spawnMagicBolt(pp, aimDir);
    }
    else if(className === 'archer'){
        // ARCHER: Ranged Arrow from Bow (directed towards mouse)
        sfx.playShoot();
        spawnArrow(pp, aimDir);
    }
}

function spawnMagicBolt(origin, dir){
    const elem = ELEMENTS[G.player.element] || ELEMENTS.fire;
    const boltGrp = new THREE.Group();

    const boltMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 8, 8),
        new THREE.MeshBasicMaterial({ color: elem.color })
    );
    boltGrp.add(boltMesh);

    const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 6, 6),
        new THREE.MeshBasicMaterial({ color: elem.glowColor, transparent: true, opacity: 0.6 })
    );
    boltGrp.add(halo);

    const pLight = new THREE.PointLight(elem.color, 1.6, 8);
    boltGrp.add(pLight);

    boltGrp.position.set(origin.x + dir.x * 0.8, 1.45, origin.z + dir.z * 0.8);
    scene.add(boltGrp);

    const speed = 0.75;
    G.projectiles.push({
        group: boltGrp,
        halo,
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
    const arrowGrp = new THREE.Group();

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

    arrowGrp.position.set(origin.x + dir.x * 0.8, 1.35, origin.z + dir.z * 0.8);
    arrowGrp.rotation.y = Math.atan2(dir.x, dir.z);
    scene.add(arrowGrp);

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
        G.attackAnim -= dt * 4.8;
        if(G.attackAnim < 0) G.attackAnim = 0;
        const swingProgress = Math.sin((1 - G.attackAnim) * Math.PI);
        rightArm.rotation.x = -Math.PI / 3 + swingProgress * (Math.PI * 0.85);
        playerWeapon.rotation.z = Math.sin((1 - G.attackAnim) * Math.PI) * 0.8;

        if(playerSlashArc){
            if(G.player.className === 'warrior'){
                playerSlashArc.material.opacity = Math.max(0, G.attackAnim * 0.85);
                playerSlashArc.rotation.z = (1 - G.attackAnim) * 1.5;
            } else {
                playerSlashArc.material.opacity = 0;
            }
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
        // Savaşçı Yeteneği: Elementel Kılıç Dalgası (Hilal Şok Dalgası)
        sfx.playSwing();
        sfx.playBlast();
        const waveGrp = new THREE.Group();

        const crescentGeo = new THREE.RingGeometry(0.6, 1.6, 16, 1, 0, Math.PI * 0.8);
        const crescentMat = new THREE.MeshBasicMaterial({color: elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0.95});
        const crescent = new THREE.Mesh(crescentGeo, crescentMat);
        crescent.rotation.x = -Math.PI / 2;
        crescent.rotation.z = Math.PI / 2 - 0.4;
        waveGrp.add(crescent);

        const pLight = new THREE.PointLight(elem.color, 2.0, 12);
        waveGrp.add(pLight);

        waveGrp.position.set(pp.x + aimDir.x * 0.9, 0.4, pp.z + aimDir.z * 0.9);
        waveGrp.rotation.y = Math.atan2(aimDir.x, aimDir.z);
        scene.add(waveGrp);

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
        // Büyücü Yeteneği: Elementel Kıyamet Küresi / Meteor
        sfx.playShoot();
        const orbGrp = new THREE.Group();

        const core = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.65, 1),
            new THREE.MeshBasicMaterial({ color: elem.color })
        );
        orbGrp.add(core);

        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(0.95, 8, 8),
            new THREE.MeshBasicMaterial({ color: elem.glowColor, transparent: true, opacity: 0.6 })
        );
        orbGrp.add(halo);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.05, 0.08, 6, 16),
            new THREE.MeshBasicMaterial({ color: elem.glowColor, transparent: true, opacity: 0.8 })
        );
        orbGrp.add(ring);

        const pLight = new THREE.PointLight(elem.lightColor, 2.8, 20);
        orbGrp.add(pLight);

        orbGrp.position.set(pp.x + aimDir.x * 1.0, 1.5, pp.z + aimDir.z * 1.0);
        scene.add(orbGrp);

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
        // Okçu Yeteneği: Elementel Delici Fırtına Oku
        sfx.playShoot();
        const arrowGrp = new THREE.Group();

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

        const vortex = new THREE.Mesh(
            new THREE.TorusGeometry(0.35, 0.04, 6, 16),
            new THREE.MeshBasicMaterial({ color: elem.glowColor, transparent: true, opacity: 0.75 })
        );
        vortex.position.z = 0.2;
        arrowGrp.add(vortex);

        const pLight = new THREE.PointLight(elem.color, 2.2, 14);
        arrowGrp.add(pLight);

        arrowGrp.position.set(pp.x + aimDir.x * 1.0, 1.4, pp.z + aimDir.z * 1.0);
        arrowGrp.rotation.y = Math.atan2(aimDir.x, aimDir.z);
        scene.add(arrowGrp);

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

    if(className === 'warrior'){
        // WARRIOR ULT: KILIÇ FIRTINASI (Kompakt ve Seri Fırtına)
        G.player.isWhirlwind = true;
        G.player.whirlwindEndTime = now + 3200;
        G.player.lastWhirlHit = 0;
        sfx.playThunder();
        notify(`⚔️ KILIÇ FIRTINASI! Çevredeki düşmanlar biçiliyor!`);

        const cycloneRing = new THREE.Mesh(
            new THREE.RingGeometry(0.8, 2.5, 24),
            new THREE.MeshBasicMaterial({ color: elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        );
        cycloneRing.rotation.x = -Math.PI / 2;
        cycloneRing.position.y = 0.35;
        playerGroup.add(cycloneRing);
        G.particles.push({ mesh: cycloneRing, isRing: true, expandSpeed: 0.8, life: 3.2 });
    }
    else if(className === 'mage'){
        // MAGE ULT: KOZMİK METEOR YAĞMURU (Hedef Odaklı Darbeli Meteor)
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
        // ARCHER ULT: GÖK YARAN OK YAĞMURU (Konsantre Hedef Ok Fırtınası)
        sfx.playThunder();
        notify(`🏹 GÖK YARAN OK YAĞMURU! Hedef alana oklar yağıyor!`);
        G.player.vy = 0.25;
        G.player.onGround = false;
        const targetPos = lastAimPoint.clone();

        G.arrowRainZones.push({
            x: targetPos.x,
            z: targetPos.z,
            life: 2.8,
            lastSpawn: 0,
            elem
        });

        const rainRing = new THREE.Mesh(
            new THREE.RingGeometry(0.35, 2.4, 24),
            new THREE.MeshBasicMaterial({ color: elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
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
        return;
    }

    playerGroup.rotation.y += dt * 26;
    rightArm.rotation.x = Math.PI / 4;
    leftArm.rotation.x = Math.PI / 4;

    if(now - G.player.lastWhirlHit > 220){
        G.player.lastWhirlHit = now;
        sfx.playSwing();
        const pp = playerGroup.position;
        const baseDmg = Math.round(G.player.atk * 1.5 * (G.player.skillPowerMult || 1.0));

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
    const baseCrit = c.critChance;
    const baseSpd = PLAYER_BASE_SPEED + c.speedBonus;
    const baseSkill = c.skillPowerMult;

    p.maxHp = baseHp + (p.stats.vit - 10) * 15 + (p.level - 1) * 12;
    p.hp = Math.min(p.hp, p.maxHp);

    p.atk = Math.round(baseAtk + (p.stats.str - 10) * (isWar ? 2.4 : 1.2) + (p.stats.dex - 10) * (isArcher ? 2.2 : 0.8) + (p.level - 1) * 2.5);
    p.def = baseDef + Math.floor((p.stats.vit - 10) * 0.4) + Math.floor((p.stats.str - 10) * 0.2);
    p.critChance = Math.min(0.85, baseCrit + (p.stats.dex - 10) * 0.012);
    p.speed = baseSpd + (p.stats.dex - 10) * 0.0025;
    p.skillPowerMult = Number((baseSkill + (p.stats.int - 10) * (isMage ? 0.06 : 0.03)).toFixed(2));

    updateHUD();
    updateStatsSheet();
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
    renderInventory();

    playerGroup.position.set(0, 0, 6);
    playerGroup.rotation.y = Math.PI;

    // Reset and respawn regular monsters (Boss only awakens at Level 5!)
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
        if(p.vortex) p.vortex.rotation.z += dt * 16;

        // Piercing Projectiles (Blade Wave, Piercing Arrow)
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
                scene.remove(p.group);
                G.projectiles.splice(i, 1);
            }
        }
        // Single-target / Detonating Projectiles
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
    scene.remove(p.group);

    // Basic Attack Magic Bolt
    if(p.type === 'magicBolt'){
        sfx.playBlast();
        if(directTarget){
            dealDamageToMonster(directTarget, p.dmg, G.player.critChance, p.element);
        }
        // Small spark burst
        for(let k = 0; k < 8; k++){
            const spark = new THREE.Mesh(
                new THREE.DodecahedronGeometry(rng(0.08, 0.14), 0),
                new THREE.MeshBasicMaterial({ color: p.elemConfig.color })
            );
            spark.position.copy(blastPos);
            const theta = rng(0, Math.PI * 2);
            const vel = new THREE.Vector3(Math.cos(theta) * 0.12, rng(0.02, 0.14), Math.sin(theta) * 0.12);
            scene.add(spark);
            G.particles.push({ mesh: spark, vel, life: 0.5 });
        }
        return;
    }

    // Basic Attack Arrow
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

    // Expanding Ground Shockwave Ring
    const shockRing = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.8, 24),
        new THREE.MeshBasicMaterial({ color: elem.color, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    shockRing.position.set(blastPos.x, 0.08, blastPos.z);
    shockRing.rotation.x = -Math.PI / 2;
    scene.add(shockRing);

    G.particles.push({
        mesh: shockRing,
        vel: new THREE.Vector3(0, 0, 0),
        isRing: true,
        expandSpeed: 8.5,
        life: 0.65
    });

    // 20 Burst Sparks
    for(let k = 0; k < 20; k++){
        const spark = new THREE.Mesh(
            new THREE.DodecahedronGeometry(rng(0.14, 0.28), 0),
            new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? elem.color : elem.glowColor })
        );
        spark.position.copy(blastPos);
        const theta = rng(0, Math.PI * 2);
        const phi = rng(0, Math.PI);
        const speed = rng(0.12, 0.3);
        const vel = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed + 0.08,
            Math.sin(phi) * Math.sin(theta) * speed
        );
        scene.add(spark);
        G.particles.push({ mesh: spark, vel, life: 1.0 });
    }

    // AoE Damage
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

        if(pt.isRing){
            pt.mesh.scale.multiplyScalar(1 + dt * pt.expandSpeed);
            pt.mesh.material.opacity = Math.max(0, pt.life * 1.5);
        } else {
            pt.mesh.position.add(pt.vel);
            pt.vel.y -= dt * 0.25;
            pt.mesh.scale.multiplyScalar(0.94);
        }

        if(pt.life <= 0 || pt.mesh.scale.x < 0.05){
            scene.remove(pt.mesh);
            G.particles.splice(i, 1);
        }
    }
}

// ==================== ENVIRONMENTAL ANIMATIONS ==============
let smokeTimer = 0;
function updateEnvironmentFX(dt){
    const time = clock.getElapsedTime();

    // 1. Drifting 3D Clouds
    G.clouds.forEach(cg => {
        cg.position.x += dt * cg.userData.speed;
        if(cg.position.x > 115) cg.position.x = -115;
    });

    // 2. Swaying Grass Tufts in Wind
    const wind = Math.sin(time * 2.2) * 0.12;
    G.grassTufts.forEach((tg, idx) => {
        const offset = Math.sin(time * 2.5 + idx * 0.3) * 0.08;
        tg.rotation.z = wind + offset;
    });

    // 3. Floating Fireflies
    G.fireflies.forEach(ff => {
        ff.position.y = ff.userData.baseY + Math.sin(time * 1.8 + ff.userData.phase) * 0.35;
        ff.position.x += Math.sin(time * 0.8 + ff.userData.phase) * 0.01;
    });

    // 4. Chimney Smoke Puffs
    smokeTimer += dt;
    if(smokeTimer > 0.45){
        smokeTimer = 0;
        villageHouses.forEach(h => {
            if(h.userData.chimneyTop){
                const top = h.userData.chimneyTop;
                const puff = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(rng(0.2, 0.35), 0),
                    new THREE.MeshBasicMaterial({color:0xd8d8d8, transparent:true, opacity:0.45})
                );
                puff.position.set(top.x + rng(-0.08, 0.08), top.y, top.z + rng(-0.08, 0.08));
                scene.add(puff);
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
            scene.remove(sp.mesh);
            G.smokePuffs.splice(i, 1);
        }
    }
}

// ==================== MINIMAP RADAR RENDERER ================
function updateMinimap(){
    if(!minimapCtx) return;
    const w = 130, h = 130;
    const cx = w / 2, cy = h / 2;
    const mapScale = 0.55; // pixels per world unit

    minimapCtx.clearRect(0, 0, w, h);

    // Green field background
    minimapCtx.fillStyle = '#2f5922';
    minimapCtx.fillRect(0, 0, w, h);

    const pp = playerGroup.position;

    // Draw village plaza circle
    const vilX = cx + (0 - pp.x) * mapScale;
    const vilZ = cy + (0 - pp.z) * mapScale;
    minimapCtx.beginPath();
    minimapCtx.arc(vilX, vilZ, 19 * mapScale, 0, Math.PI * 2);
    minimapCtx.fillStyle = '#6e5841';
    minimapCtx.fill();
    minimapCtx.strokeStyle = '#8c7457';
    minimapCtx.lineWidth = 1.5;
    minimapCtx.stroke();

    // Draw Roads
    minimapCtx.strokeStyle = '#7d674b';
    minimapCtx.lineWidth = 3.5;
    minimapCtx.beginPath();
    minimapCtx.moveTo(vilX, vilZ);
    minimapCtx.lineTo(vilX, vilZ + 45 * mapScale);
    minimapCtx.stroke();

    // Draw Monsters
    G.monsters.forEach(m => {
        if(!m.alive) return;
        const mx = cx + (m.model.position.x - pp.x) * mapScale;
        const mz = cy + (m.model.position.z - pp.z) * mapScale;
        const distFromCenter = Math.sqrt((mx - cx)**2 + (mz - cy)**2);

        // World Boss Ur-Gathok special marker (only visible when awakened and alive)
        if(m.type === 'boss_urgathok'){
            if(!G.bossSpawned || !m.alive) return;
            const angle = Math.atan2(mz - cy, mx - cx);
            const clampedDist = Math.min(distFromCenter, cx - 8);
            const bx = cx + Math.cos(angle) * clampedDist;
            const bz = cy + Math.sin(angle) * clampedDist;

            minimapCtx.save();
            minimapCtx.beginPath();
            minimapCtx.arc(bx, bz, 6.5, 0, Math.PI * 2);
            minimapCtx.fillStyle = '#ff1100';
            minimapCtx.fill();
            minimapCtx.strokeStyle = '#ffd700';
            minimapCtx.lineWidth = 1.8;
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
            minimapCtx.arc(mx, mz, m.type === 'troll' ? 4 : 2.8, 0, Math.PI * 2);

            if(G.target === m){
                minimapCtx.fillStyle = '#ffff00';
                minimapCtx.strokeStyle = '#ffffff';
                minimapCtx.lineWidth = 1.5;
                minimapCtx.stroke();
            } else {
                minimapCtx.fillStyle = m.type === 'slime' ? '#33ee33' : '#ff3333';
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

        m.hpBar.position.set(m.model.position.x, m.model.position.y + m.barH, m.model.position.z);
        m.hpBar.quaternion.copy(camera.quaternion);
        const ratio = Math.max(0, m.hp / m.maxHp);
        m.hpBar.userData.fg.scale.x = Math.max(0.001, ratio);
        m.hpBar.userData.fg.position.x = -(1 - ratio) * 0.425;
        // In-world health bars only appear when damaged, targeted, or in combat (eliminating screen clutter!)
        const isCombat = (m.hp < m.maxHp) || (G.target === m) || (m.state === 'chase' || m.state === 'attack') || (m.type === 'boss_urgathok');
        m.hpBar.visible = isCombat && (dist < 22);

        const md = MON[m.type];
        const spd = MONSTER_BASE_SPEED * md.spd;
        const aggroR = m.type === 'boss_urgathok' ? 30 : AGGRO_RANGE;
        const atkR = m.type === 'boss_urgathok' ? 4.2 : MONSTER_ATK_RANGE;

        // Boss Bar Update
        if(m.type === 'boss_urgathok'){
            const bossBar = document.getElementById('boss-bar-container');
            if(bossBar){
                if(dist < 42 || m.state === 'chase' || m.state === 'attack'){
                    bossBar.classList.remove('hidden');
                    const bPct = Math.max(0, (m.hp / m.maxHp) * 100);
                    const bFill = document.getElementById('boss-hp-fill');
                    if(bFill) bFill.style.width = bPct + '%';
                    const bTxt = document.getElementById('boss-hp-text');
                    if(bTxt) bTxt.textContent = `${Math.ceil(m.hp)} / ${m.maxHp}`;
                } else if(dist > 50 && m.state === 'idle'){
                    bossBar.classList.add('hidden');
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
                    m.state = 'chase';
                    if(!m.lastAggroNotif || (now - m.lastAggroNotif > 12000)){
                        m.lastAggroNotif = now;
                        notify(`${md.name} seni fark etti!`, 'warn');
                    }
                }
                break;

            case 'chase': {
                const ang = Math.atan2(dx, dz);
                m.model.position.x += Math.sin(ang) * spd;
                m.model.position.z += Math.cos(ang) * spd;
                m.model.rotation.y = ang;

                if(dist <= atkR) m.state = 'attack';

                const spawnDist = Math.sqrt(Math.pow(m.model.position.x - m.spawnX, 2) + Math.pow(m.model.position.z - m.spawnZ, 2));
                if(spawnDist > aggroR * 2.8 || dist > aggroR * 2.2){
                    m.state = 'returning';
                    m.hp = m.maxHp;
                }
                break;
            }

            case 'attack': {
                const ang = Math.atan2(dx, dz);
                m.model.rotation.y = ang;
                if(now - m.lastAtk > (m.type === 'boss_urgathok' ? 1650 : MONSTER_ATK_CD)){
                    m.lastAtk = now;
                    damagePlayer(m.atk, m);

                    // Boss Club Slam Ground Shockwave
                    if(m.type === 'boss_urgathok'){
                        sfx.playBlast();
                        const bossRing = new THREE.Mesh(
                            new THREE.RingGeometry(0.5, 1.4, 24),
                            new THREE.MeshBasicMaterial({color:0xd41717, side:THREE.DoubleSide, transparent:true, opacity:0.85})
                        );
                        bossRing.rotation.x = -Math.PI / 2;
                        bossRing.position.set(m.model.position.x, 0.08, m.model.position.z);
                        scene.add(bossRing);
                        G.particles.push({mesh: bossRing, vel: new THREE.Vector3(), isRing: true, expandSpeed: 9.5, life: 0.65});
                    }
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

        // ===== PROCEDURAL MONSTER ANIMATIONS =====
        const isMoving = (m.state === 'chase' || m.state === 'returning' || (m.state === 'idle' && Math.abs(m.model.position.x - m.spawnX) > 0.05));
        const animTime = now * 0.001;

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
        else if(m.type === 'wolf'){
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
        else if(m.type === 'troll' || m.type === 'boss_urgathok'){
            m.walkTime = (m.walkTime || 0) + (isMoving ? dt * (m.type === 'boss_urgathok' ? 4.2 : 3.8) : 0);
            const swing = Math.sin(m.walkTime) * 0.4;
            const legs = m.model.userData.legs;
            if(legs && legs.length === 2){
                legs[0].rotation.x = swing;
                legs[1].rotation.x = -swing;
            }
            m.model.rotation.z = isMoving ? Math.sin(m.walkTime) * (m.type === 'boss_urgathok' ? 0.05 : 0.1) : 0;
            const atkDur = m.type === 'boss_urgathok' ? 850 : 650;
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
            if(m.model.userData.bossAura){
                m.model.userData.bossAura.rotation.z += dt * 0.75;
            }
        }
    });
}

// ==================== MONSTER DEATH & RESPAWN ===============
function killMonster(m){
    m.alive = false;
    m.state = 'idle';
    m.model.visible = false;
    m.hpBar.visible = false;
    m.respawnTimer = (m.type === 'boss_urgathok' ? 45000 : RESPAWN_MS);
    G.player.kills = (G.player.kills || 0) + 1;

    if(m.type === 'boss_urgathok'){
        const bossBar = document.getElementById('boss-bar-container');
        if(bossBar) bossBar.classList.add('hidden');
        notify('🏆 KADİM BOSS UR-GATHOK YENİLDİ! EFSANEVİ GANİMET KAZANDINIZ!', 'item');
        sfx.playLevelUp();
    }

    sfx.playDefeat();
    grantExp(m.exp);

    const md = MON[m.type];
    md.drops.forEach(dr => {
        if(Math.random() < dr.ch){
            spawnDrop(dr.id, m.model.position.x + rng(-0.8, 0.8), m.model.position.z + rng(-0.8, 0.8));
        }
    });

    if(G.target === m) G.target = null;
}

function respawnMonster(m){
    const d = MON[m.type];
    const pLvl = (G.player && G.player.level) ? G.player.level : 1;
    const tier = Math.floor((pLvl - 1) / 5);
    const scale = 1.0 + tier * 0.45;
    m.maxHp = Math.round(d.hp * scale);
    m.hp = m.maxHp;
    m.atk = Math.round(d.atk * scale);
    m.alive = true;
    m.model.position.set(m.spawnX, 0, m.spawnZ);
    m.model.visible = true;
    m.hpBar.visible = true;
    m.state = 'idle';
    if(m.type === 'boss_urgathok'){
        notify('⚠️ KADİM BOSS UR-GATHOK ARENASINDA YENİDEN DOĞDU!', 'warn');
    }
}

// ==================== DAMAGE PLAYER =========================
function damagePlayer(rawAtk, attacker = null){
    if(!G.player.alive) return;
    const isDay = G.dayNightTime < 0.5;
    const dayMult = isDay ? 1.5 : 1.0;
    const effectiveAtk = Math.round(rawAtk * dayMult);
    const dmg = Math.max(1, effectiveAtk - G.player.def);
    G.player.hp -= dmg;

    sfx.playHurt();
    spawnDmgNumber(playerGroup.position, dmg, 'player');

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

// ==================== EXP & LEVEL SYSTEM ====================
function grantExp(xp){
    G.player.exp += xp;
    spawnDmgNumber(playerGroup.position, xp, 'xp');
    notify(`+${xp} EXP`, 'xp');

    while(G.player.exp >= G.player.expNext){
        levelUp();
    }
}

function levelUp(){
    G.player.exp -= G.player.expNext;
    G.player.level++;
    G.player.expNext = Math.floor(100 * Math.pow(1.36, G.player.level - 1));
    G.player.statPoints = (G.player.statPoints || 0) + 3;
    recalculatePlayerStats();
    G.player.hp = G.player.maxHp;

    sfx.playLevelUp();

    const el = document.getElementById('level-up-overlay');
    el.classList.remove('hidden');
    const txt = document.getElementById('level-up-text');
    txt.style.animation = 'none';
    void txt.offsetHeight;
    txt.style.animation = '';
    setTimeout(() => el.classList.add('hidden'), 2300);

    notify(`★ SEVİYE ATLADIN! Seviye ${G.player.level} (+3 Nitelik Puanı)`, 'item');

    // Awakening World Boss Ur-Gathok at Level 5!
    if(G.player.level >= 5 && !G.bossSpawned){
        spawnBossUrGathok();
        if(G.bossBeacon) G.bossBeacon.visible = true;
        sfx.playThunder();
        notify('⚡ KADİM DÜNYA BOSS\'U UYANDI! Ur-Gathok Orman Arenasında Belirdi! (Köyün Güneyi)', 'warn');
    }

    // Every 5 levels: Monsters grow stronger
    if(G.player.level % 5 === 0){
        const tier = Math.floor(G.player.level / 5);
        const boostPct = tier * 45;
        notify(`⚡ DÜNYA TEHLİKESİ ARTTI! Canavarlar güçlendi (+%${boostPct} Güç, Kademe ${tier + 1})!`, 'warn');
        const scale = 1.0 + tier * 0.45;
        G.monsters.forEach(m => {
            const d = MON[m.type];
            if(d){
                const hpRatio = m.hp / m.maxHp;
                m.maxHp = Math.round(d.hp * scale);
                m.hp = Math.max(1, Math.round(m.maxHp * hpRatio));
                m.atk = Math.round(d.atk * scale);
            }
        });
    }
}

// ==================== ITEM DROPS ============================
function spawnDrop(itemId, x, z){
    const def = ITEMS[itemId];
    const colors = { healthPotion:0xff3333, attackGem:0xdd33ff, ironShield:0x7799dd, goldCoin:0xffd700 };
    const geo = itemId === 'goldCoin' ? new THREE.CylinderGeometry(0.2, 0.2, 0.06, 8) : new THREE.DodecahedronGeometry(0.24, 0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: colors[itemId] || 0xffffff,
        emissive: colors[itemId] || 0xffffff,
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: itemId === 'goldCoin' ? 0.9 : 0.2
    }));
    mesh.position.set(x, 0.5, z);
    mesh.castShadow = true;
    scene.add(mesh);

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
            scene.remove(dr.mesh);
            G.drops.splice(i, 1);
        } else if(dr.time > 35){
            scene.remove(dr.mesh);
            G.drops.splice(i, 1);
        }
    }
}

// ==================== INVENTORY SYSTEM ======================
function pickupItem(itemId){
    if(!G.player.inventory[itemId]) G.player.inventory[itemId] = 0;
    G.player.inventory[itemId]++;
    const def = ITEMS[itemId];
    sfx.playPickup();
    notify(`${def.emoji} ${def.name} çantana eklendi`, 'item');
    G.inventoryDirty = true;
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
    } else if(def.effect === 'defenseUp'){
        G.player.def += def.value;
        G.player.inventory[itemId]--;
        if(G.player.inventory[itemId] <= 0) delete G.player.inventory[itemId];
        sfx.playPickup();
        notify(`🛡️ Savunma gücü kalıcı olarak +${def.value} arttı! (Toplam: ${G.player.def})`, 'item');
        G.inventoryDirty = true;
    } else if(itemId === 'goldCoin'){
        notify(`🪙 Altın Kesesi: Toplam ${cnt} altın taşıyorsun.`);
    }
}

function toggleInventory(){
    const panel = document.getElementById('inventory-panel');
    panel.classList.toggle('hidden');
    if(!panel.classList.contains('hidden')){
        renderInventory();
    }
}

function renderInventory(){
    const grid = document.getElementById('inventory-grid');
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
    document.getElementById('potion-count').textContent = G.player.inventory['healthPotion'] || 0;
    G.inventoryDirty = false;
}

// ==================== HUD UPDATE ============================
function updateHUD(){
    const p = G.player;
    const cls = CLASSES[p.className] || CLASSES.warrior;
    const elem = ELEMENTS[p.element] || ELEMENTS.fire;

    document.getElementById('player-level').textContent = `Lv. ${p.level}`;
    document.getElementById('player-class-badge').textContent = `[${cls.name} • ${elem.name}]`;

    // HP Bar (Authentic Blood Ruby)
    const hpPct = Math.max(0, (p.hp / p.maxHp) * 100);
    const hpFill = document.getElementById('hp-bar');
    hpFill.style.width = hpPct + '%';
    document.getElementById('hp-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    if(hpPct < 25)      hpFill.style.background = 'linear-gradient(to bottom, #d41717, #590000)';
    else if(hpPct < 50)  hpFill.style.background = 'linear-gradient(to bottom, #bd2424, #730e0e)';
    else                  hpFill.style.background = 'linear-gradient(to bottom, #c91818, #780909)';

    // EXP Bar
    const xpPct = p.expNext > 0 ? (p.exp / p.expNext) * 100 : 0;
    document.getElementById('exp-bar').style.width = xpPct + '%';
    document.getElementById('exp-text').textContent = `${p.exp} / ${p.expNext}`;

    // Target Panel (Sleek and hidden during Boss encounters to prevent overlap)
    const ti = document.getElementById('target-info');
    const bossBar = document.getElementById('boss-bar-container');
    const bossVisible = bossBar && !bossBar.classList.contains('hidden');

    if(G.target && G.target.alive && !bossVisible){
        ti.classList.remove('hidden');
        const md = MON[G.target.type];
        document.getElementById('target-name').textContent = `[Lv.${md.lvl}] ${md.name}`;
        const tHp = Math.max(0, (G.target.hp / G.target.maxHp) * 100);
        document.getElementById('target-hp-bar').style.width = tHp + '%';
        document.getElementById('target-hp-text').textContent = `${Math.ceil(G.target.hp)} / ${G.target.maxHp}`;
    } else {
        ti.classList.add('hidden');
    }

    // Skill Cooldown Overlay
    const now = performance.now();
    const cdMs = (p.skillCd || 3.4) * 1000;
    const elapsed = now - p.lastSkillTime;
    const cdOverlay = document.getElementById('skill-cd-overlay');
    const cdText = document.getElementById('skill-cd-text');
    const skillSlot = document.getElementById('slot-skill');

    if(elapsed < cdMs){
        cdOverlay.classList.remove('hidden');
        skillSlot.classList.add('on-cooldown');
        cdText.textContent = ((cdMs - elapsed) / 1000).toFixed(1) + 's';
    } else {
        cdOverlay.classList.add('hidden');
        skillSlot.classList.remove('on-cooldown');
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

// ==================== RESPAWN MECHANISM (PERMADEATH RESET) ===
document.getElementById('respawn-btn').addEventListener('click', () => {
    sfx.init();
    restartGameFromScratch(false);
});
document.getElementById('restart-select-btn').addEventListener('click', () => {
    sfx.init();
    restartGameFromScratch(true);
});

// ==================== ACTION BAR BUTTONS ====================
document.getElementById('slot-attack').addEventListener('click', () => {
    sfx.init();
    if(G.running) performAttack();
});
document.getElementById('slot-skill').addEventListener('click', () => {
    sfx.init();
    if(G.running) castElementalSkill();
});
document.getElementById('slot-ult').addEventListener('click', () => {
    sfx.init();
    if(G.running) castUltimateSkill();
});
document.getElementById('slot-potion').addEventListener('click', () => {
    sfx.init();
    usePotion();
});
document.getElementById('inventory-toggle').addEventListener('click', () => {
    sfx.init();
    toggleInventory();
});
document.getElementById('inventory-close').addEventListener('click', () => {
    document.getElementById('inventory-panel').classList.add('hidden');
});
document.getElementById('stats-toggle').addEventListener('click', () => {
    sfx.init();
    toggleStats();
});
document.getElementById('stats-close').addEventListener('click', () => {
    document.getElementById('stats-panel').classList.add('hidden');
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
        }
    });
});

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
    notify(`Hoş geldin! ${cls.name} [${elem.name}] olarak maceraya başladın.`);
}

document.getElementById('start-btn').addEventListener('click', startGame);

// ==================== GAME LOOP =============================
function gameLoop(){
    requestAnimationFrame(gameLoop);
    if(!G.running){
        renderer.render(scene, camera);
        return;
    }

    const dt = Math.min(clock.getDelta(), 0.05);

    updateDayNight(dt);
    updateMovement(dt);
    updateCamera();
    updateAimReticle(dt);
    updateUltimates(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateEnvironmentFX(dt);
    updateMonsters(dt);
    updateDrops(dt);
    updateAttackAnim(dt);
    updateHUD();

    renderer.render(scene, camera);
}

// Initial camera position
camera.position.set(0, 10, 18);
camera.lookAt(0, 1.5, 6);

renderInventory();
gameLoop();
