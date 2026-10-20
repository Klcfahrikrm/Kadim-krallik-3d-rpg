// ============================================================
//  Fantasy Quest – World Module (Scene, Terrain, Day/Night, Lighting)
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
const WORLD_HALF          = 100;
const MAP_MIN_X           = -100;
const MAP_MAX_X           = 100;
const MAP_MIN_Z           = -60;
const MAP_MAX_Z           = 630;
const WALL_Z              = 50;

// 10-Zone Gate Z positions (each separating 10 levels)
const GATE_ZONES          = [50, 110, 170, 230, 290, 350, 410, 470, 530];
const GATE_LEVELS         = [10, 20, 30, 40, 50, 60, 70, 80, 90];

// ==================== SOLID OBSTACLE & WALL SLIDING PHYSICS ====================
window.collisionObstacles = [];

function addBoxObstacle(minX, maxX, minZ, maxZ, maxY = 15, tag = 'wall'){
    const obs = { type: 'box', minX, maxX, minZ, maxZ, maxY, tag, active: true };
    window.collisionObstacles.push(obs);
    return obs;
}

function addCircleObstacle(cx, cz, radius, maxY = 15, tag = 'pillar'){
    const obs = { type: 'circle', cx, cz, radius, maxY, tag, active: true };
    window.collisionObstacles.push(obs);
    return obs;
}

function checkObstacleCollision(x, z, r = 0.55){
    const list = window.collisionObstacles;
    for(let i = 0; i < list.length; i++){
        const ob = list[i];
        if(!ob.active) continue;
        if(ob.type === 'box'){
            if(x + r > ob.minX && x - r < ob.maxX && z + r > ob.minZ && z - r < ob.maxZ){
                return ob;
            }
        } else if(ob.type === 'circle'){
            const dx = x - ob.cx, dz = z - ob.cz;
            const minDist = ob.radius + r;
            if(dx * dx + dz * dz < minDist * minDist){
                return ob;
            }
        }
    }
    return null;
}

function resolveMovementSliding(currX, currZ, targetX, targetZ, r = 0.55){
    // 1. Try full movement (both axes)
    if(!checkObstacleCollision(targetX, targetZ, r)){
        return { x: targetX, z: targetZ, collided: false };
    }

    // 2. Try movement along X axis only (sliding against Z obstacle)
    const canMoveX = !checkObstacleCollision(targetX, currZ, r);

    // 3. Try movement along Z axis only (sliding against X obstacle)
    const canMoveZ = !checkObstacleCollision(currX, targetZ, r);

    if(canMoveX && !canMoveZ){
        return { x: targetX, z: currZ, collided: true, slideAxis: 'X' };
    }
    if(!canMoveX && canMoveZ){
        return { x: currX, z: targetZ, collided: true, slideAxis: 'Z' };
    }
    if(canMoveX && canMoveZ){
        // Both single axes work individually; pick axis with largest motion delta
        const dx = Math.abs(targetX - currX);
        const dz = Math.abs(targetZ - currZ);
        if(dx >= dz){
            return { x: targetX, z: currZ, collided: true, slideAxis: 'X' };
        } else {
            return { x: currX, z: targetZ, collided: true, slideAxis: 'Z' };
        }
    }

    // Both axes blocked -> stay in place
    return { x: currX, z: currZ, collided: true, slideAxis: 'none' };
}

function rng(min, max) {
    return min + Math.random() * (max - min);
}

function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function dist2D(x1, z1, x2, z2) {
    const dx = x1 - x2, dz = z1 - z2;
    return Math.sqrt(dx * dx + dz * dz);
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

// ==================== 10-ZONE BIOME SYSTEM (1 - 100 LEVEL PROGRESSION) ============
const BIOMES = {
    zone1: {
        id: 'zone1',
        name: 'Zümrüt Vadi',
        levelRange: 'Seviye 1 - 10',
        desc: 'Huzurlu yeşil vadiler, çam ağaçları ve kadim köy meydanı.',
        color: 0x42882c,
        groundColor: 0x3e8a2a,
        fogColor: 0x1a2634,
        skyColor: 0x7ec1e4,
        sunColor: 0xfff4d6,
        ambientColor: 0x7a92b5,
        fogDensity: 0.012,
        weather: 'none',
        gateLevel: 1
    },
    zone2: {
        id: 'zone2',
        name: 'Kızıl Çoraklık',
        levelRange: 'Seviye 11 - 20',
        desc: 'Kızgın kanyonlar, kum fırtınaları ve zehirli akrepler.',
        color: 0xba6a32,
        groundColor: 0xb5652e,
        fogColor: 0x5a301a,
        skyColor: 0xd9864a,
        sunColor: 0xffbb6e,
        ambientColor: 0x9e6542,
        fogDensity: 0.014,
        weather: 'sand',
        gateLevel: 10
    },
    zone3: {
        id: 'zone3',
        name: 'Lanetli Bataklık',
        levelRange: 'Seviye 21 - 30',
        desc: 'Zehirli sisle kaplı bataklık suları, çamur golemleri ve yılanlar.',
        color: 0x2e4f32,
        groundColor: 0x243e26,
        fogColor: 0x1e3324,
        skyColor: 0x4a6d48,
        sunColor: 0xa4d49a,
        ambientColor: 0x415b46,
        fogDensity: 0.018,
        weather: 'rain',
        gateLevel: 20
    },
    zone4: {
        id: 'zone4',
        name: 'Kayıp Çöl & Vaha',
        levelRange: 'Seviye 31 - 40',
        desc: 'Sonsuz kum tepeleri, antik piramit kalıntıları ve kum solucanları.',
        color: 0xd9b362,
        groundColor: 0xc89d48,
        fogColor: 0x6e5229,
        skyColor: 0xebc378,
        sunColor: 0xfffae0,
        ambientColor: 0x997b4a,
        fogDensity: 0.015,
        weather: 'sand',
        gateLevel: 30
    },
    zone5: {
        id: 'zone5',
        name: 'Donmuş Geçit',
        levelRange: 'Seviye 41 - 50',
        desc: 'Buzul dağlar, dondurucu kar fırtınası ve buz trolleri.',
        color: 0xcbe3f0,
        groundColor: 0xd7e9f2,
        fogColor: 0x2e4256,
        skyColor: 0xa4cbe8,
        sunColor: 0xd8eeff,
        ambientColor: 0x7292b0,
        fogDensity: 0.020,
        weather: 'snow',
        gateLevel: 40
    },
    zone6: {
        id: 'zone6',
        name: 'Obsidyen Kanyon',
        levelRange: 'Seviye 51 - 60',
        desc: 'Mor kristal damarları, gölge muhafızları ve uzay-zaman yarıkları.',
        color: 0x402b4d,
        groundColor: 0x362444,
        fogColor: 0x261430,
        skyColor: 0x684280,
        sunColor: 0xdf9eff,
        ambientColor: 0x5b3870,
        fogDensity: 0.022,
        weather: 'ember',
        gateLevel: 50
    },
    zone7: {
        id: 'zone7',
        name: 'Kızıl Cehennem Ağzı',
        levelRange: 'Seviye 61 - 70',
        desc: 'Akan lav nehirleri, alev köpekleri ve cehennem iblisleri.',
        color: 0x8a2014,
        groundColor: 0x4d1610,
        fogColor: 0x380b06,
        skyColor: 0x8f2c18,
        sunColor: 0xff5522,
        ambientColor: 0x6e2418,
        fogDensity: 0.024,
        weather: 'ember',
        gateLevel: 60
    },
    zone8: {
        id: 'zone8',
        name: 'Fırtına Tepeleri',
        levelRange: 'Seviye 71 - 80',
        desc: 'Sürekli çakan yıldırımlar, fırtına kuşları ve zırhlı titanlar.',
        color: 0x3a4b63,
        groundColor: 0x2c3b52,
        fogColor: 0x1d293d,
        skyColor: 0x4b678f,
        sunColor: 0x8ab8ff,
        ambientColor: 0x38557a,
        fogDensity: 0.022,
        weather: 'storm',
        gateLevel: 70
    },
    zone9: {
        id: 'zone9',
        name: 'Karanlık Ruhlar Diyarı',
        levelRange: 'Seviye 81 - 90',
        desc: 'Hayalet kuleler, hortlak şövalyeler ve ruh emici yaratıklar.',
        color: 0x1c1e29,
        groundColor: 0x161822,
        fogColor: 0x0f1118,
        skyColor: 0x2a2b3d,
        sunColor: 0x6774a3,
        ambientColor: 0x262b3d,
        fogDensity: 0.025,
        weather: 'ember',
        gateLevel: 80
    },
    zone10: {
        id: 'zone10',
        name: 'Kadim Kozmik Taht',
        levelRange: 'Seviye 91 - 100',
        desc: 'Yıldız tozu vadisi, kozmik muhafızlar ve Evrenin Efendisi Aethelgard.',
        color: 0x191433,
        groundColor: 0x130e26,
        fogColor: 0x100824,
        skyColor: 0x28194d,
        sunColor: 0xd98bff,
        ambientColor: 0x442878,
        fogDensity: 0.022,
        weather: 'cosmic',
        gateLevel: 90
    }
};

// Aliases for backward compatibility
BIOMES.grasslands = BIOMES.zone1;
BIOMES.badlands = BIOMES.zone2;
BIOMES.frozen = BIOMES.zone5;
BIOMES.volcanic = BIOMES.zone7;

function getBiomeAt(x, z){
    if(z < 50)  return BIOMES.zone1;
    if(z < 110) return BIOMES.zone2;
    if(z < 170) return BIOMES.zone3;
    if(z < 230) return BIOMES.zone4;
    if(z < 290) return BIOMES.zone5;
    if(z < 350) return BIOMES.zone6;
    if(z < 410) return BIOMES.zone7;
    if(z < 470) return BIOMES.zone8;
    if(z < 530) return BIOMES.zone9;
    return BIOMES.zone10;
}

// ==================== ITEM & MONSTER DEFINITIONS ============
const ITEMS = {
    healthPotion : { name:'Health Potion', emoji:'🧪', desc:'Canı 35 HP doldurur (Kısayol: 1)', effect:'heal', value:35 },
    attackGem    : { name:'Attack Gem',    emoji:'💎', desc:'Tıkla: Kalıcı +3 Saldırı Gücü',    effect:'attackUp', value:3 },
    ironShield   : { name:'Iron Shield',   emoji:'🛡️', desc:'Tıkla: Kalıcı +2 Savunma',        effect:'defenseUp', value:2 },
    goldCoin     : { name:'Gold Coin',     emoji:'🪙', desc:'Canavarlardan düşen saf altın',    effect:'none', value:0 },
};

const MON = {
    // ---------------- Bölge 1 (1-10): Zümrüt Vadi ----------------
    slime: {
        name:'Vahşi Balçık', lvl:1, hp:22, atk:5, exp:25, spd:1.0, color:0x3bd43b, sz:0.65,
        aiType:'melee', biome:'zone1', drops:[{id:'healthPotion',ch:.45},{id:'goldCoin',ch:.65}]
    },
    wolf: {
        name:'Vadi Kurdu', lvl:5, hp:34, atk:8, exp:65, spd:1.45, color:0x3c4c5a, sz:0.78,
        aiType:'melee', biome:'zone1', drops:[{id:'healthPotion',ch:.40},{id:'attackGem',ch:.25},{id:'goldCoin',ch:.70}]
    },
    boss_gorgar: {
        name:'Gorgar (Kütük Savuran)', isBoss:true, aiType:'boss', lvl:10, hp:125, atk:14, exp:450, spd:0.80, sz:2.6, color:0x3f5c2a,
        biome:'zone1', arenaPos:{x:0, z:25},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 2 (11-20): Kızıl Çoraklık ----------------
    boar: {
        name:'Yaban Domuzu', lvl:12, hp:42, atk:10, exp:90, spd:1.05, color:0x7a431c, sz:0.88,
        aiType:'melee', biome:'zone2', drops:[{id:'healthPotion',ch:.40},{id:'attackGem',ch:.28},{id:'goldCoin',ch:.75}]
    },
    scorpion: {
        name:'Kum Akrebi', lvl:16, hp:48, atk:12, exp:130, spd:1.35, color:0xc87d2b, sz:0.95,
        aiType:'melee', biome:'zone2', drops:[{id:'healthPotion',ch:.50},{id:'attackGem',ch:.35},{id:'goldCoin',ch:.80}]
    },
    boss_urgathok: {
        name:'Ur-Gathok (Çoraklık Lordu)', isBoss:true, aiType:'boss', lvl:20, hp:175, atk:18, exp:900, spd:0.82, sz:2.8, color:0x5e2218,
        biome:'zone2', arenaPos:{x:0, z:85},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 3 (21-30): Lanetli Bataklık ----------------
    swamp_snake: {
        name:'Bataklık Yılanı', lvl:22, hp:56, atk:15, exp:180, spd:1.40, color:0x2f6b3a, sz:0.90,
        aiType:'melee', biome:'zone3', drops:[{id:'healthPotion',ch:.50},{id:'attackGem',ch:.35},{id:'goldCoin',ch:.85}]
    },
    mud_golem: {
        name:'Çamur Golemi', lvl:26, hp:74, atk:18, exp:240, spd:0.70, color:0x4d3b28, sz:1.40,
        aiType:'heavy_tank', biome:'zone3', drops:[{id:'healthPotion',ch:.60},{id:'ironShield',ch:.45},{id:'goldCoin',ch:.90}]
    },
    boss_morghul: {
        name:'Morghul (Zehir Efendisi)', isBoss:true, aiType:'boss', lvl:30, hp:235, atk:23, exp:1600, spd:0.85, sz:3.0, color:0x1b4022,
        biome:'zone3', arenaPos:{x:0, z:145},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 4 (31-40): Kayıp Çöl & Vaha ----------------
    desert_bandit: {
        name:'Çöl Haydutu', lvl:32, hp:68, atk:20, exp:310, spd:1.25, color:0xa88448, sz:1.0,
        aiType:'melee', biome:'zone4', drops:[{id:'healthPotion',ch:.55},{id:'attackGem',ch:.40},{id:'goldCoin',ch:.90}]
    },
    sand_worm: {
        name:'Kum Solucanı', lvl:36, hp:88, atk:23, exp:390, spd:1.15, color:0xd4a055, sz:1.25,
        aiType:'ranged', biome:'zone4', drops:[{id:'healthPotion',ch:.60},{id:'attackGem',ch:.45},{id:'goldCoin',ch:.95}]
    },
    boss_amunkhet: {
        name:'Amun-Khet (Kum Firavunu)', isBoss:true, aiType:'boss', lvl:40, hp:300, atk:28, exp:2400, spd:0.90, sz:3.2, color:0xb8860b,
        biome:'zone4', arenaPos:{x:0, z:205},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 5 (41-50): Donmuş Geçit ----------------
    frost_wolf: {
        name:'Buz Kurdu', lvl:42, hp:82, atk:25, exp:480, spd:1.50, color:0xa8d5e5, sz:0.92,
        aiType:'melee', biome:'zone5', drops:[{id:'healthPotion',ch:.60},{id:'attackGem',ch:.45},{id:'goldCoin',ch:.95}]
    },
    frost_troll: {
        name:'Kırağı Trolü', lvl:46, hp:110, atk:29, exp:600, spd:0.75, color:0x5d8aa8, sz:1.55,
        aiType:'heavy_tank', biome:'zone5', drops:[{id:'healthPotion',ch:.70},{id:'ironShield',ch:.55},{id:'goldCoin',ch:1.0}]
    },
    boss_ymirath: {
        name:'Ymirath (Buzul Dev)', isBoss:true, aiType:'boss', lvl:50, hp:380, atk:34, exp:3500, spd:0.82, sz:3.4, color:0x206085,
        biome:'zone5', arenaPos:{x:0, z:265},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 6 (51-60): Obsidyen Kanyon ----------------
    crystal_spider: {
        name:'Kristal Örümcek', lvl:52, hp:98, atk:31, exp:720, spd:1.35, color:0x8844aa, sz:1.05,
        aiType:'melee', biome:'zone6', drops:[{id:'healthPotion',ch:.65},{id:'attackGem',ch:.50},{id:'goldCoin',ch:1.0}]
    },
    shadow_guard: {
        name:'Gölge Muhafızı', lvl:56, hp:125, atk:35, exp:880, spd:1.20, color:0x301844, sz:1.25,
        aiType:'ranged', biome:'zone6', drops:[{id:'healthPotion',ch:.70},{id:'ironShield',ch:.60},{id:'goldCoin',ch:1.0}]
    },
    boss_riftbreaker: {
        name:'Rift-Breaker (Yarık Muhafızı)', isBoss:true, aiType:'boss', lvl:60, hp:470, atk:41, exp:4800, spd:0.88, sz:3.5, color:0x581d7a,
        biome:'zone6', arenaPos:{x:0, z:325},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 7 (61-70): Kızıl Cehennem Ağzı ----------------
    flame_hound: {
        name:'Alev Köpeği', lvl:62, hp:115, atk:38, exp:1050, spd:1.55, color:0xd44018, sz:1.0,
        aiType:'melee', biome:'zone7', drops:[{id:'healthPotion',ch:.70},{id:'attackGem',ch:.55},{id:'goldCoin',ch:1.0}]
    },
    lava_demon: {
        name:'Lav İblisi', lvl:66, hp:145, atk:43, exp:1250, spd:1.15, color:0x7a180e, sz:1.45,
        aiType:'heavy_tank', biome:'zone7', drops:[{id:'healthPotion',ch:.75},{id:'ironShield',ch:.65},{id:'goldCoin',ch:1.0}]
    },
    boss_khardraz: {
        name:'Khar-Draz (Cehennem Hakimi)', isBoss:true, aiType:'boss', lvl:70, hp:580, atk:49, exp:6400, spd:0.90, sz:3.8, color:0x94160c,
        biome:'zone7', arenaPos:{x:0, z:385},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 8 (71-80): Fırtına Tepeleri ----------------
    storm_bird: {
        name:'Şimşek Kuşu', lvl:72, hp:130, atk:45, exp:1450, spd:1.60, color:0x5a88c4, sz:1.15,
        aiType:'ranged', biome:'zone8', drops:[{id:'healthPotion',ch:.75},{id:'attackGem',ch:.60},{id:'goldCoin',ch:1.0}]
    },
    armored_titan: {
        name:'Zırhlı Titan', lvl:76, hp:175, atk:51, exp:1750, spd:0.80, sz:1.65,
        aiType:'heavy_tank', biome:'zone8', drops:[{id:'healthPotion',ch:.80},{id:'ironShield',ch:.70},{id:'goldCoin',ch:1.0}]
    },
    boss_raikor: {
        name:'Raikor (Fırtına Tanrısı)', isBoss:true, aiType:'boss', lvl:80, hp:710, atk:58, exp:8500, spd:0.95, sz:4.0, color:0x2e4f7a,
        biome:'zone8', arenaPos:{x:0, z:445},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 9 (81-90): Karanlık Ruhlar Diyarı ----------------
    wraith_knight: {
        name:'Hortlak Şövalye', lvl:82, hp:155, atk:56, exp:2100, spd:1.35, color:0x2e354a, sz:1.30,
        aiType:'melee', biome:'zone9', drops:[{id:'healthPotion',ch:.80},{id:'attackGem',ch:.65},{id:'goldCoin',ch:1.0}]
    },
    soul_eater: {
        name:'Ruh Emici', lvl:86, hp:190, atk:62, exp:2550, spd:1.25, color:0x1b1f2e, sz:1.45,
        aiType:'ranged', biome:'zone9', drops:[{id:'healthPotion',ch:.85},{id:'attackGem',ch:.70},{id:'goldCoin',ch:1.0}]
    },
    boss_vanehelm: {
        name:'Vane-Helm (Ruh Yiyen Şövalye)', isBoss:true, aiType:'boss', lvl:90, hp:860, atk:68, exp:11000, spd:0.92, sz:4.0, color:0x181c2b,
        biome:'zone9', arenaPos:{x:0, z:505},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // ---------------- Bölge 10 (91-100): Kadim Kozmik Taht ----------------
    cosmic_guardian: {
        name:'Kozmik Muhafız', lvl:92, hp:195, atk:68, exp:3100, spd:1.30, color:0x3d2866, sz:1.40,
        aiType:'melee', biome:'zone10', drops:[{id:'healthPotion',ch:.85},{id:'attackGem',ch:.75},{id:'goldCoin',ch:1.0}]
    },
    void_watcher: {
        name:'Boşluk Gözcüsü', lvl:95, hp:225, atk:74, exp:3700, spd:1.20, color:0x221340, sz:1.55,
        aiType:'ranged', biome:'zone10', drops:[{id:'healthPotion',ch:.90},{id:'attackGem',ch:.80},{id:'goldCoin',ch:1.0}]
    },
    boss_aethelgard: {
        name:'Aethelgard (Kozmik Tahtın Hakimi)', isBoss:true, aiType:'boss', lvl:100, hp:1150, atk:85, exp:18000, spd:0.96, sz:4.5, color:0x4d1f85,
        biome:'zone10', arenaPos:{x:0, z:585},
        drops:[{id:'healthPotion',ch:1.0},{id:'attackGem',ch:1.0},{id:'ironShield',ch:1.0},{id:'goldCoin',ch:1.0}]
    },

    // Backward compatibility aliases
    troll: { name:'Orman Trolü', lvl:8, hp:46, atk:11, exp:100, spd:0.75, color:0x466034, sz:1.25, aiType:'heavy_tank', biome:'zone1', drops:[{id:'healthPotion',ch:.60},{id:'goldCoin',ch:.80}] },
    golem: { name:'Taş Golem', lvl:26, hp:74, atk:18, exp:240, spd:0.70, color:0x8a6245, sz:1.45, aiType:'heavy_tank', biome:'zone2', drops:[{id:'healthPotion',ch:.65},{id:'goldCoin',ch:.90}] },
    frost_mage: { name:'Buz Büyücüsü', lvl:45, hp:78, atk:26, exp:520, spd:1.15, color:0x5da8d0, sz:1.0, aiType:'ranged', biome:'zone5', drops:[{id:'healthPotion',ch:.65},{id:'goldCoin',ch:.90}] },
    infernal_knight: { name:'Cehennem Şövalyesi', lvl:65, hp:135, atk:42, exp:1200, spd:1.25, color:0x2b151b, sz:1.3, aiType:'melee', biome:'zone7', drops:[{id:'healthPotion',ch:.75},{id:'goldCoin',ch:1.0}] },
    shadow_demon: { name:'Gölge İblisi', lvl:68, hp:150, atk:45, exp:1400, spd:1.35, color:0x1f0b24, sz:1.4, aiType:'ranged', biome:'zone7', drops:[{id:'healthPotion',ch:.85},{id:'goldCoin',ch:1.0}] },
    boss_azrakar: { name:'Azrakar', isBoss:true, aiType:'boss', lvl:20, hp:175, atk:18, exp:900, spd:0.82, sz:2.8, color:0xd4501a, biome:'zone2', arenaPos:{x:0, z:85}, drops:[{id:'goldCoin',ch:1.0}] },
    boss_ymirkhor: { name:'Ymir-Khor', isBoss:true, aiType:'boss', lvl:50, hp:380, atk:34, exp:3500, spd:0.82, sz:3.4, color:0x206085, biome:'zone5', arenaPos:{x:0, z:265}, drops:[{id:'goldCoin',ch:1.0}] },
    boss_malakor: { name:'Malakor', isBoss:true, aiType:'boss', lvl:100, hp:1150, atk:85, exp:18000, spd:0.96, sz:4.5, color:0x470514, biome:'zone10', arenaPos:{x:0, z:585}, drops:[{id:'goldCoin',ch:1.0}] }
};

// ==================== GAME STATE ============================
const G = {
    running : false,
    selectedClass: 'warrior',
    selectedElement: 'fire',
    currentBiome: 'grasslands',
    bossSpawned: false,
    bossesDefeated: {},
    dayNightTime: 0.25,
    activeMeteors: [],
    arrowRainZones: [],
    player  : {
        className: 'warrior',
        element: 'fire',
        hp:120, maxHp:120, level:1, exp:0, expNext:155,
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
    cam     : { dist:CAM_INIT_DIST, phi:CAM_INIT_PHI, theta:0, rmb:false, lmb:false, trauma:0 },
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
    hitStopTimer: 0,
    gateBarrier: null,
    gateBarrierLight: null,
    gateBarrierMesh: null,
    gateBarrierRune1: null,
    gateBarrierRune2: null,
};

// ==================== THREE.JS SETUP ========================
const canvas   = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0xfdd4aa);
scene.fog = new THREE.FogExp2(0xfdd4aa, 0.0075);

const camera = new THREE.PerspectiveCamera(54, window.innerWidth/window.innerHeight, 0.1, 350);
const clock  = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouseVec2 = new THREE.Vector2();

// Post-Processing Composer (EffectComposer + UnrealBloomPass)
let composer = null;
try {
    if(typeof THREE.EffectComposer !== 'undefined' && typeof THREE.RenderPass !== 'undefined' && typeof THREE.UnrealBloomPass !== 'undefined'){
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6, // strength
            0.4, // radius
            0.8  // threshold
        );
        composer.addPass(bloomPass);
    }
} catch(e) {
    console.warn('Post-processing composer could not be initialized:', e);
}

// Minimap Context
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

// ==================== PROCEDURAL TEXTURES ===================
function createProceduralGrassTexture(){
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#42882c';
    ctx.fillRect(0, 0, 256, 256);

    for(let i = 0; i < 3000; i++){
        const x = Math.random() * 256, y = Math.random() * 256;
        const w = 1.5 + Math.random() * 2, h = 3 + Math.random() * 5;
        ctx.fillStyle = Math.random() > 0.5 ? '#4da233' : '#387325';
        ctx.fillRect(x, y, w, h);
    }
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

// ==================== CONTACT SHADOW GENERATOR ===============
let contactShadowTex = null;
function getContactShadowTexture(){
    if(contactShadowTex) return contactShadowTex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.0, 'rgba(12, 16, 26, 0.65)');
    grad.addColorStop(0.4, 'rgba(12, 16, 26, 0.40)');
    grad.addColorStop(0.75, 'rgba(12, 16, 26, 0.15)');
    grad.addColorStop(1.0, 'rgba(12, 16, 26, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    contactShadowTex = new THREE.CanvasTexture(c);
    return contactShadowTex;
}

function createContactShadow(radiusX = 1.5, radiusZ = 1.5, opacity = 0.45){
    const geo = new THREE.PlaneGeometry(radiusX * 2, radiusZ * 2);
    const mat = new THREE.MeshBasicMaterial({
        map: getContactShadowTexture(),
        transparent: true,
        opacity: opacity,
        depthWrite: false
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    return m;
}
window.createContactShadow = createContactShadow;

// ==================== LIGHTING & DAY/NIGHT ===================
let mainSunLight = null, mainAmbLight = null, mainHemiLight = null;
let visualSunGroup = null, sunCorona = null;

(function setupLighting(){
    mainAmbLight = new THREE.AmbientLight(0x6b7f99, 0.55);
    scene.add(mainAmbLight);

    // Warm daylight sky + dark navy ground shadows
    mainHemiLight = new THREE.HemisphereLight(0x9bc5ff, 0x202838, 0.65);
    scene.add(mainHemiLight);

    mainSunLight = new THREE.DirectionalLight(0xffefa0, 1.45);
    mainSunLight.position.set(55, 85, 35);
    mainSunLight.castShadow = true;
    const s = mainSunLight.shadow;
    s.mapSize.width = s.mapSize.height = 2048;
    s.camera.near = 1;   s.camera.far = 240;
    s.camera.left = -85; s.camera.right = 85;
    s.camera.top  =  85; s.camera.bottom = -85;
    s.bias = -0.0005;
    scene.add(mainSunLight);
})();

function updateDayNight(dt){
    // Keep daytime warm and bright
    G.dayNightTime = 0.25;
    if(mainSunLight && visualSunGroup){
        mainSunLight.position.copy(visualSunGroup.position);
        mainSunLight.color.setHex(0xffefa0);
        mainSunLight.intensity = 1.45;
    }
    if(mainHemiLight){
        mainHemiLight.color.setHex(0x9bc5ff);
        mainHemiLight.groundColor.setHex(0x202838);
        mainHemiLight.intensity = 0.65;
    }
    if(sunCorona && camera){
        sunCorona.lookAt(camera.position);
    }
}

// ==================== PROCEDURAL SKY & CLOUDS ===============
function createSunCoronaTexture(){
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0.0, 'rgba(255, 255, 240, 1.0)');
    grad.addColorStop(0.18, 'rgba(255, 235, 175, 0.85)');
    grad.addColorStop(0.45, 'rgba(255, 185, 85, 0.45)');
    grad.addColorStop(0.72, 'rgba(255, 135, 35, 0.15)');
    grad.addColorStop(1.0, 'rgba(255, 95, 10, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
}

(function createAtmosphere(){
    // 1. Sky Dome with Pastel Gold Horizon & Deep Azure Zenith
    const skyGeo = new THREE.SphereGeometry(260, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 16; skyCanvas.height = 256;
    const sCtx = skyCanvas.getContext('2d');
    const grad = sCtx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#16548e'); // deep azure zenith
    grad.addColorStop(0.45, '#4290cb'); // celestial azure
    grad.addColorStop(0.78, '#82bce2'); // soft sky
    grad.addColorStop(0.92, '#fed7aa'); // warm pastel gold/orange
    grad.addColorStop(1.0, '#ffe0b2'); // horizon
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 16, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);

    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    // 2. Visible Glowing Sun with Corona Halo
    visualSunGroup = new THREE.Group();
    visualSunGroup.position.set(55, 85, 35);

    const sunSphere = new THREE.Mesh(
        new THREE.SphereGeometry(5.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false })
    );
    visualSunGroup.add(sunSphere);

    const coronaTex = createSunCoronaTexture();
    const coronaGeo = new THREE.PlaneGeometry(36, 36);
    const coronaMat = new THREE.MeshBasicMaterial({
        map: coronaTex,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
    });
    sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
    visualSunGroup.add(sunCorona);
    scene.add(visualSunGroup);

    // 3. 10-12 Stylized Puffy Low-Poly Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0.04,
        flatShading: true,
        transparent: true,
        opacity: 0.90,
    });

    for(let i = 0; i < 12; i++){
        const cg = new THREE.Group();
        const numPuffs = 5 + Math.floor(Math.random() * 4);
        for(let p = 0; p < numPuffs; p++){
            const puff = new THREE.Mesh(
                new THREE.DodecahedronGeometry(rng(3.2, 6.2), 1),
                cloudMat
            );
            puff.position.set(rng(-5.5, 5.5), rng(-1.2, 2.0), rng(-4, 4));
            puff.scale.y = rng(0.65, 0.85); // slightly flattened stylized shape
            cg.add(puff);
        }
        cg.position.set(rng(-120, 120), rng(48, 68), rng(-130, 200));
        cg.userData.speed = rng(0.35, 0.75);
        scene.add(cg);
        G.clouds.push(cg);
    }
})();

// ==================== TERRAIN & ENVIRONMENT =================
(function createTerrain(){
    const grassTex = createProceduralGrassTexture();
    const cobbleTex = createProceduralCobbleTexture();

    // Rectangular 10-Biome Procedural Ground with Vertex Colors (Width X: 200 [-100..100], Length Z: 690 [-60..630])
    // Ground plane size 200x690, centered at (0, 0, 285) so Z spans exactly -60 to 630
    const gndGeo = new THREE.PlaneGeometry(200, 690, 80, 240);
    const count = gndGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = gndGeo.attributes.position;
    const tempCol = new THREE.Color();

    for(let i = 0; i < count; i++){
        const wx = pos.getX(i);
        const wz = 285 - pos.getY(i); // rotation.x = -PI/2 maps -y to world z offset by center 285
        const b = getBiomeAt(wx, wz);

        tempCol.setHex(b.groundColor || 0x3e8a2a);

        // Subtle organic color micro-variation
        const noise = (Math.sin(wx * 0.16) * Math.cos(wz * 0.16)) * 0.04;
        tempCol.r = THREE.MathUtils.clamp(tempCol.r + noise, 0, 1);
        tempCol.g = THREE.MathUtils.clamp(tempCol.g + noise, 0, 1);
        tempCol.b = THREE.MathUtils.clamp(tempCol.b + noise, 0, 1);

        colors[i * 3]     = tempCol.r;
        colors[i * 3 + 1] = tempCol.g;
        colors[i * 3 + 2] = tempCol.b;
    }
    gndGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const gnd = new THREE.Mesh(
        gndGeo,
        new THREE.MeshStandardMaterial({
            map: grassTex,
            vertexColors: true,
            roughness: 0.88,
            metalness: 0.04
        })
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.position.set(0, 0, 285);
    gnd.receiveShadow = true;
    scene.add(gnd);
    G.groundMesh = gnd;

    // Cobblestone Village Center Plaza (Preserved exactly at 0, 0)
    const vil = new THREE.Mesh(
        new THREE.CircleGeometry(19, 36),
        new THREE.MeshStandardMaterial({
            map: cobbleTex,
            roughness: 0.85,
            metalness: 0.08
        })
    );
    vil.rotation.x = -Math.PI / 2;
    vil.position.set(0, 0.03, 0);
    vil.receiveShadow = true;
    scene.add(vil);

    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x9e8765,
        roughness: 0.92,
        metalness: 0.02
    });

    // 1. Grand Imperial Highway connecting Village through all 9 Gates to the Cosmic Throne (Z = 19 to 590)
    const pHighway = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 572), roadMat);
    pHighway.rotation.x = -Math.PI / 2;
    pHighway.position.set(0, 0.04, 305);
    pHighway.receiveShadow = true;
    scene.add(pHighway);

    // 2. North Road into Emerald Plains forest (Z = -19 to -52)
    const pNorth = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 34), roadMat);
    pNorth.rotation.x = -Math.PI / 2;
    pNorth.position.set(0, 0.04, -36);
    pNorth.receiveShadow = true;
    scene.add(pNorth);

    // 3. East & West Village Crossroads
    const pEast = new THREE.Mesh(new THREE.PlaneGeometry(40, 4.2), roadMat);
    pEast.rotation.x = -Math.PI / 2;
    pEast.position.set(32, 0.04, 0);
    pEast.receiveShadow = true;
    scene.add(pEast);

    const pWest = new THREE.Mesh(new THREE.PlaneGeometry(38, 4.2), roadMat);
    pWest.rotation.x = -Math.PI / 2;
    pWest.position.set(-30, 0.04, 0);
    pWest.receiveShadow = true;
    scene.add(pWest);

    // Grass Tuft Scatter in Zone 1 (Emerald Plains: Z < 48)
    const tuftMat = new THREE.MeshStandardMaterial({
        color: 0x48962c,
        roughness: 0.85,
        metalness: 0.05,
        side: THREE.DoubleSide
    });
    const tuftGeo = new THREE.ConeGeometry(0.25, 0.75, 4);

    for(let i = 0; i < 90; i++){
        let x, z;
        do {
            x = rng(-85, 85);
            z = rng(-50, 45);
        } while(Math.sqrt(x*x + z*z) < 20 || (Math.abs(x) < 4.5 && z > 15));

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

// ==================== NATURAL PERIMETER BOUNDARIES ====================
(function createPerimeterObstacles(){
    const cliffMatStone = new THREE.MeshStandardMaterial({ color: 0x42403c, roughness: 0.92, metalness: 0.08 });
    const cliffMatIce   = new THREE.MeshStandardMaterial({ color: 0x7da4be, roughness: 0.25, metalness: 0.35 });
    const cliffMatVolc  = new THREE.MeshStandardMaterial({ color: 0x181016, roughness: 0.88, metalness: 0.22 });
    const fenceMat      = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.85 });

    function makeRockPillar(x, z, h, r, mat){
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 1.25, h, 6), mat);
        m.position.set(x, h * 0.48, z);
        m.rotation.y = rng(0, Math.PI * 2);
        m.rotation.x = rng(-0.06, 0.06);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        return m;
    }

    // 1. North Mountain Wall (Z = -60, X: -100 to 100)
    for(let x = -100; x <= 100; x += 6.5){
        const h = rng(9, 15);
        const r = rng(3.8, 5.5);
        makeRockPillar(x, -60 + rng(-2, 2), h, r, cliffMatStone);
    }

    // 2. South Cosmic Horizon Wall (Z = 630, X: -100 to 100)
    for(let x = -100; x <= 100; x += 6.5){
        const h = rng(10, 16);
        const r = rng(4.0, 5.8);
        makeRockPillar(x, 630 + rng(-2, 2), h, r, cliffMatVolc);
    }

    // 3. West & East Boundary Cliffs (X = -100 and X = +100, Z: -60 to 630)
    for(let z = -60; z <= 630; z += 10.0){
        const b = getBiomeAt(-100, z);
        let mat = cliffMatStone;
        if(b.id === 'zone5') mat = cliffMatIce;
        else if(b.id === 'zone7' || b.id === 'zone9' || b.id === 'zone10') mat = cliffMatVolc;

        makeRockPillar(-100 + rng(-2, 2), z, rng(8, 14), rng(3.5, 5.2), mat);
        makeRockPillar(100 + rng(-2, 2), z, rng(8, 14), rng(3.5, 5.2), mat);
    }

    // Register 4 solid outer perimeter boundaries in collision system (Wall Sliding & Containment)
    addBoxObstacle(-105, 105, -75, -58, 20, 'perimeter_north');
    addBoxObstacle(-105, 105, 628, 645, 20, 'perimeter_south');
    addBoxObstacle(-120, -98, -75, 645, 20, 'perimeter_west');
    addBoxObstacle(98, 120, -75, 645, 20, 'perimeter_east');
})();

// ==================== 9 CASTLE WALLS & GATEHOUSES (ZONE BARRIERS) ====================
window.gateBarriers = [];

(function createAllCastleWalls(){
    const wallStoneMat = new THREE.MeshStandardMaterial({
        color: 0x48443e,
        roughness: 0.88,
        metalness: 0.12
    });
    const towerTrimMat = new THREE.MeshStandardMaterial({
        color: 0x36332e,
        roughness: 0.92,
        metalness: 0.08
    });
    const roofMat = new THREE.MeshStandardMaterial({
        color: 0x78271e,
        roughness: 0.82,
        metalness: 0.05
    });

    const WALL_H = 7.5;
    const WALL_D = 2.6;

    // Thematic barrier glow palettes for each of the 9 gates (Level 10, 20, ..., 90)
    const barrierPalettes = [
        { color: 0xeeaa11, emissive: 0xffbb22, light: 0xffaa00, name: 'Zümrüt Mührü' },       // Gate 1 (Lvl 10)
        { color: 0xff5511, emissive: 0xff7722, light: 0xff4400, name: 'Çoraklık Mührü' },     // Gate 2 (Lvl 20)
        { color: 0x44dd22, emissive: 0x66ff33, light: 0x33cc11, name: 'Bataklık Mührü' },     // Gate 3 (Lvl 30)
        { color: 0xffd700, emissive: 0xffea00, light: 0xffcc00, name: 'Çöl Mührü' },         // Gate 4 (Lvl 40)
        { color: 0x22d4ff, emissive: 0x55eeff, light: 0x00c8ff, name: 'Buzul Mührü' },       // Gate 5 (Lvl 50)
        { color: 0xaa33ff, emissive: 0xcc55ff, light: 0x9922ee, name: 'Obsidyen Mührü' },    // Gate 6 (Lvl 60)
        { color: 0xff1122, emissive: 0xff3344, light: 0xee0011, name: 'Cehennem Mührü' },    // Gate 7 (Lvl 70)
        { color: 0x3388ff, emissive: 0x55aaff, light: 0x2277ee, name: 'Fırtına Mührü' },     // Gate 8 (Lvl 80)
        { color: 0xff22bb, emissive: 0xff55dd, light: 0xee11aa, name: 'Ruhlar Mührü' }       // Gate 9 (Lvl 90)
    ];

    for(let gIdx = 0; gIdx < GATE_ZONES.length; gIdx++){
        const wZ = GATE_ZONES[gIdx];
        const reqLvl = GATE_LEVELS[gIdx];
        const pal = barrierPalettes[gIdx] || barrierPalettes[0];

        // 1. Left Wall Segment: from X = -100 to X = -4.0 (Span = 96 units, Center X = -52)
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(96, WALL_H, WALL_D), wallStoneMat);
        leftWall.position.set(-52, WALL_H / 2, wZ);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        scene.add(leftWall);

        // 2. Right Wall Segment: from X = 4.0 to X = 100 (Span = 96 units, Center X = 52)
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(96, WALL_H, WALL_D), wallStoneMat);
        rightWall.position.set(52, WALL_H / 2, wZ);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        scene.add(rightWall);

        // 3. Battlements (Crenellations) atop Left & Right Wall
        const merlonGeo = new THREE.BoxGeometry(1.6, 1.25, WALL_D + 0.3);
        for(let x = -98; x <= -5.5; x += 3.2){
            const m = new THREE.Mesh(merlonGeo, wallStoneMat);
            m.position.set(x, WALL_H + 0.62, wZ);
            m.castShadow = true;
            scene.add(m);
        }
        for(let x = 5.5; x <= 98; x += 3.2){
            const m = new THREE.Mesh(merlonGeo, wallStoneMat);
            m.position.set(x, WALL_H + 0.62, wZ);
            m.castShadow = true;
            scene.add(m);
        }

        // 4. Fortified Bastion Towers along the Wall
        [-100, -70, -35, 35, 70, 100].forEach(tx => {
            const t = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 9.8, 8), towerTrimMat);
            t.position.set(tx, 4.9, wZ);
            t.castShadow = true;
            scene.add(t);

            const r = new THREE.Mesh(new THREE.ConeGeometry(2.8, 3.2, 8), roofMat);
            r.position.set(tx, 11.4, wZ);
            scene.add(r);
        });

        // 5. Grand Arched Gatehouse at X = 0, Z = wZ
        const gateFlankRadius = 2.2;
        const gateFlankH = 11.5;

        // Left Gate Tower (X = -5.5)
        const towerL = new THREE.Mesh(new THREE.CylinderGeometry(gateFlankRadius, gateFlankRadius * 1.15, gateFlankH, 14), towerTrimMat);
        towerL.position.set(-5.5, gateFlankH / 2, wZ);
        towerL.castShadow = true;
        scene.add(towerL);
        const roofL = new THREE.Mesh(new THREE.ConeGeometry(gateFlankRadius * 1.35, 3.8, 14), roofMat);
        roofL.position.set(-5.5, gateFlankH + 1.9, wZ);
        scene.add(roofL);

        // Right Gate Tower (X = +5.5)
        const towerR = new THREE.Mesh(new THREE.CylinderGeometry(gateFlankRadius, gateFlankRadius * 1.15, gateFlankH, 14), towerTrimMat);
        towerR.position.set(5.5, gateFlankH / 2, wZ);
        towerR.castShadow = true;
        scene.add(towerR);
        const roofR = new THREE.Mesh(new THREE.ConeGeometry(gateFlankRadius * 1.35, 3.8, 14), roofMat);
        roofR.position.set(5.5, gateFlankH + 1.9, wZ);
        scene.add(roofR);

        // Arched Stone Lintel over Archway
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.6, 2.2, WALL_D + 0.6), wallStoneMat);
        lintel.position.set(0, 7.8, wZ);
        lintel.castShadow = true;
        scene.add(lintel);

        // Crown Battlements atop Lintel
        [-2.2, 0, 2.2].forEach(ax => {
            const crown = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, WALL_D + 0.8), wallStoneMat);
            crown.position.set(ax, 9.5, wZ);
            scene.add(crown);
        });

        // Gatehouse Torches
        const torchWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.85 });
        [-4.2, 4.2].forEach(tx => {
            const torchPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 5), torchWoodMat);
            torchPost.position.set(tx, 4.2, wZ - 2.2);
            torchPost.rotation.x = 0.35;
            scene.add(torchPost);

            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff7700 }));
            flame.position.set(tx, 4.8, wZ - 2.6);
            scene.add(flame);

            const pLight = new THREE.PointLight(0xff9922, 1.1, 12);
            pLight.position.set(tx, 5.0, wZ - 2.6);
            scene.add(pLight);
        });

        // 6. MAGICAL FORCEFIELD BARRIER (LEVEL REQUIREMENT)
        const barrierGroup = new THREE.Group();
        barrierGroup.position.set(0, 2.8, wZ);

        const barrierGeo = new THREE.PlaneGeometry(7.0, 5.6);
        const barrierMat = new THREE.MeshStandardMaterial({
            color: pal.color,
            emissive: pal.emissive,
            emissiveIntensity: 1.85,
            roughness: 0.15,
            metalness: 0.1,
            transparent: true,
            opacity: 0.66,
            side: THREE.DoubleSide
        });
        const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
        barrierGroup.add(barrierMesh);

        // Concentric Glowing Arcane Rune Rings
        const runeMat1 = new THREE.MeshBasicMaterial({ color: pal.emissive, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
        const rune1 = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.8, 24), runeMat1);
        rune1.position.z = 0.05;
        barrierGroup.add(rune1);

        const runeMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
        const rune2 = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.45, 32), runeMat2);
        rune2.position.z = -0.05;
        barrierGroup.add(rune2);

        const barrierLight = new THREE.PointLight(pal.light, 2.2, 12);
        barrierLight.position.set(0, 0, 0);
        barrierGroup.add(barrierLight);

        scene.add(barrierGroup);

        // Register solid wall and tower obstacles into collision system
        addBoxObstacle(-100, -3.8, wZ - 1.5, wZ + 1.5, WALL_H, 'wall_left_' + gIdx);
        addBoxObstacle(3.8, 100, wZ - 1.5, wZ + 1.5, WALL_H, 'wall_right_' + gIdx);
        addCircleObstacle(-5.5, wZ, 2.3, 12, 'tower_L_' + gIdx);
        addCircleObstacle(5.5, wZ, 2.3, 12, 'tower_R_' + gIdx);

        // Register the dynamic barrier obstacle (blocks passage until unlocked)
        const bObstacle = addBoxObstacle(-4.0, 4.0, wZ - 1.2, wZ + 1.2, 8, 'gate_barrier_' + gIdx);
        bObstacle.gateIndex = gIdx;
        bObstacle.requiredLevel = reqLvl;

        const barrierData = {
            gateIndex: gIdx,
            z: wZ,
            requiredLevel: reqLvl,
            name: pal.name,
            group: barrierGroup,
            mesh: barrierMesh,
            light: barrierLight,
            rune1: rune1,
            rune2: rune2,
            obstacle: bObstacle,
            isUnlocked: false
        };
        window.gateBarriers.push(barrierData);

        if(gIdx === 0){
            G.gateBarrier = barrierGroup;
            G.gateBarrierMesh = barrierMesh;
            G.gateBarrierLight = barrierLight;
            G.gateBarrierRune1 = rune1;
            G.gateBarrierRune2 = rune2;
        }
    }
})();

// ==================== VILLAGE PROPS =========================
function makeHouse(x, z, rot, wc, rc, sc){
    sc = sc || 1;
    const g = new THREE.Group();

    // 1. Contact shadow disk on ground
    g.add(createContactShadow(2.6 * sc, 2.2 * sc, 0.45));

    // 2. Stone Foundation Base (slightly protruding)
    const stoneBaseMat = new THREE.MeshStandardMaterial({ color: 0x544e47, roughness: 0.92, metalness: 0.08 });
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(4.45 * sc, 1.15 * sc, 3.65 * sc), stoneBaseMat);
    baseMesh.position.y = 0.58 * sc;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    g.add(baseMesh);

    // 3. Upper Tudor Walls (Cream/Plaster)
    const plasterMat = new THREE.MeshStandardMaterial({ color: wc || 0xf2ecd9, roughness: 0.88, metalness: 0.02 });
    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2 * sc, 2.5 * sc, 3.4 * sc), plasterMat);
    wallMesh.position.y = 2.4 * sc;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    g.add(wallMesh);

    // 4. Dark Timber Framing (Tudor Beams)
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x2b1b10, roughness: 0.82, metalness: 0.05 });

    // Corner vertical posts
    const postGeo = new THREE.BoxGeometry(0.18 * sc, 2.52 * sc, 0.18 * sc);
    [
        [-2.08, 1.68], [2.08, 1.68],
        [-2.08, -1.68], [2.08, -1.68]
    ].forEach(([tx, tz]) => {
        const p = new THREE.Mesh(postGeo, timberMat);
        p.position.set(tx * sc, 2.4 * sc, tz * sc);
        p.castShadow = true;
        g.add(p);
    });

    // Horizontal sill and eave beams
    const beamFrontGeo = new THREE.BoxGeometry(4.24 * sc, 0.14 * sc, 0.12 * sc);
    [1.18, 3.62].forEach(by => {
        const bFront = new THREE.Mesh(beamFrontGeo, timberMat);
        bFront.position.set(0, by * sc, 1.71 * sc);
        g.add(bFront);
        const bBack = new THREE.Mesh(beamFrontGeo, timberMat);
        bBack.position.set(0, by * sc, -1.71 * sc);
        g.add(bBack);
    });

    // Diagonal Tudor Braces on Front & Back
    const braceGeo = new THREE.BoxGeometry(0.12 * sc, 1.6 * sc, 0.1 * sc);
    [-1.2, 1.2].forEach(bx => {
        const br1 = new THREE.Mesh(braceGeo, timberMat);
        br1.position.set(bx * sc, 2.6 * sc, 1.71 * sc);
        br1.rotation.z = bx > 0 ? 0.45 : -0.45;
        g.add(br1);

        const br2 = new THREE.Mesh(braceGeo, timberMat);
        br2.position.set(bx * sc, 2.6 * sc, -1.71 * sc);
        br2.rotation.z = bx > 0 ? -0.45 : 0.45;
        g.add(br2);
    });

    // 5. Tudor Roof with Overhanging Eaves / Fascia Boards
    const roofMat = new THREE.MeshStandardMaterial({ color: rc, roughness: 0.76, metalness: 0.1 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6 * sc, 2.3 * sc, 4), roofMat);
    roof.position.y = 4.75 * sc;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    g.add(roof);

    // Eaves trim (fascia board)
    const eaveMat = new THREE.MeshStandardMaterial({ color: 0x24160c, roughness: 0.85 });
    const eaveMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5 * sc, 0.16 * sc, 3.7 * sc), eaveMat);
    eaveMesh.position.y = 3.65 * sc;
    g.add(eaveMesh);

    // 6. Arched Wooden Door with Iron Knocker
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.95 * sc, 1.85 * sc), new THREE.MeshStandardMaterial({ color: 0x3d2514, side: THREE.DoubleSide, roughness: 0.88 }));
    door.position.set(0, 1.25 * sc, 1.72 * sc);
    g.add(door);
    const knocker = new THREE.Mesh(new THREE.TorusGeometry(0.07 * sc, 0.02 * sc, 4, 8), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
    knocker.position.set(0.22 * sc, 1.35 * sc, 1.74 * sc);
    g.add(knocker);

    // 7. Windows with Cross-Grille Mullions and Warm Candlelight Glow
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xffdf77, side: THREE.DoubleSide });
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x22150b, roughness: 0.8 });

    [-1.25, 1.25].forEach(wx => {
        // Glowing Window pane
        const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.68 * sc, 0.68 * sc), glassMat);
        wn.position.set(wx * sc, 2.45 * sc, 1.72 * sc);
        g.add(wn);

        // Mullion cross-grille (+)
        const barH = new THREE.Mesh(new THREE.BoxGeometry(0.68 * sc, 0.05 * sc, 0.03 * sc), grilleMat);
        barH.position.set(wx * sc, 2.45 * sc, 1.73 * sc);
        g.add(barH);
        const barV = new THREE.Mesh(new THREE.BoxGeometry(0.05 * sc, 0.68 * sc, 0.03 * sc), grilleMat);
        barV.position.set(wx * sc, 2.45 * sc, 1.73 * sc);
        g.add(barV);
    });

    // 8. Stone Chimney with Chimney Pot
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.62 * sc, 1.8 * sc, 0.62 * sc), stoneBaseMat);
    chim.position.set(1.2 * sc, 4.7 * sc, -0.6 * sc);
    chim.castShadow = true;
    g.add(chim);

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * sc, 0.22 * sc, 0.4 * sc, 8), new THREE.MeshStandardMaterial({ color: 0x8a452d, roughness: 0.8 }));
    pot.position.set(1.2 * sc, 5.7 * sc, -0.6 * sc);
    g.add(pot);

    g.userData.chimneyTop = new THREE.Vector3(x + 1.2 * sc, 5.9 * sc, z - 0.6 * sc);

    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    return g;
}

function makeWell(x, z){
    const g = new THREE.Group();
    g.add(createContactShadow(2.2, 2.2, 0.45));

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.85, 14), new THREE.MeshStandardMaterial({color:0x6b6b6b, roughness:0.85}));
    base.position.set(0, 0.42, 0); base.castShadow = true; base.receiveShadow = true;
    g.add(base);

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
    g.add(createContactShadow(2.4, 1.8, 0.45));

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

    // Register village solid obstacles for Wall Sliding
    addBoxObstacle(-12, -6, -12, -6, 6, 'village_house_1');
    addBoxObstacle(6, 12, -11, -5, 6, 'village_house_2');
    addBoxObstacle(-11, -5, 5, 11, 6, 'village_house_3');
    addBoxObstacle(8, 14, 3, 9, 6, 'village_house_4');
    addBoxObstacle(-15, -9, -2, 4, 6, 'village_house_5');
    addCircleObstacle(-4.5, -2.5, 1.8, 3.5, 'village_well');
    addBoxObstacle(3.0, 6.0, -3.5, -1.5, 3.5, 'village_stall');

    [[-7, -5], [7, -5], [-5, 8], [5, 8]].forEach(([x, z]) => makeTorch(x, z));

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

    const signGroup = new THREE.Group();
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 6), fm);
    signPost.position.y = 1.1; signGroup.add(signPost);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.06), new THREE.MeshStandardMaterial({color:0x8a5b2d, roughness:0.8}));
    signBoard.position.set(0, 1.8, 0); signGroup.add(signBoard);
    signGroup.position.set(3.5, 0, 14);
    signGroup.rotation.y = -Math.PI / 6;
    scene.add(signGroup);
})();

// ==================== INSTANCED SCATTERING (GRASS, FLOWERS, PEBBLES) ====================
(function createInstancedEnvironment(){
    const dummy = new THREE.Object3D();

    // 1. 1,400 Stylized Grass Tufts (Zone 1: Z < 48)
    const grassCount = 1400;
    const tuftGeo = new THREE.ConeGeometry(0.24, 0.72, 4);
    tuftGeo.translate(0, 0.36, 0);
    const tuftMat = new THREE.MeshStandardMaterial({
        color: 0x48962c,
        roughness: 0.85,
        metalness: 0.05,
        side: THREE.DoubleSide
    });
    const grassInstanced = new THREE.InstancedMesh(tuftGeo, tuftMat, grassCount);
    grassInstanced.receiveShadow = true;

    let placedGrass = 0;
    while(placedGrass < grassCount){
        const gx = rng(-92, 92);
        const gz = rng(-50, 45);
        const distVillage = Math.sqrt(gx * gx + gz * gz);
        if(distVillage < 19.5) continue;
        if(Math.abs(gx) < 3.8 && gz > 15) continue;

        dummy.position.set(gx, 0, gz);
        dummy.rotation.set(rng(-0.1, 0.1), rng(0, Math.PI * 2), rng(-0.1, 0.1));
        const s = rng(0.75, 1.35);
        dummy.scale.set(s, s * rng(0.85, 1.25), s);
        dummy.updateMatrix();
        grassInstanced.setMatrixAt(placedGrass, dummy.matrix);
        placedGrass++;
    }
    grassInstanced.instanceMatrix.needsUpdate = true;
    scene.add(grassInstanced);

    // 2. 350 Wildflowers (White, Buttercup Yellow, Lavender Violet, Poppy Red, Bluebell)
    const flowerCount = 350;
    const flowerGeo = new THREE.DodecahedronGeometry(0.18, 0);
    flowerGeo.translate(0, 0.35, 0);
    const flowerMat = new THREE.MeshStandardMaterial({
        roughness: 0.65,
        metalness: 0.05
    });
    const flowerInstanced = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
    flowerInstanced.receiveShadow = true;

    const flowerPalettes = [
        new THREE.Color(0xffffff),
        new THREE.Color(0xffe033),
        new THREE.Color(0xb57bee),
        new THREE.Color(0xee3b3b),
        new THREE.Color(0x44bbff)
    ];

    let placedFlowers = 0;
    while(placedFlowers < flowerCount){
        const fx = rng(-90, 90);
        const fz = rng(-50, 45);
        const distVillage = Math.sqrt(fx * fx + fz * fz);
        if(distVillage < 20) continue;
        if(Math.abs(fx) < 3.8 && fz > 15) continue;

        dummy.position.set(fx, 0, fz);
        dummy.rotation.set(0, rng(0, Math.PI * 2), 0);
        const fs = rng(0.8, 1.4);
        dummy.scale.set(fs, fs, fs);
        dummy.updateMatrix();
        flowerInstanced.setMatrixAt(placedFlowers, dummy.matrix);

        const col = choice(flowerPalettes);
        flowerInstanced.setColorAt(placedFlowers, col);
        placedFlowers++;
    }
    flowerInstanced.instanceMatrix.needsUpdate = true;
    if(flowerInstanced.instanceColor) flowerInstanced.instanceColor.needsUpdate = true;
    scene.add(flowerInstanced);

    // 3. 200 Road & Plaza Pebbles
    const pebbleCount = 200;
    const pebbleGeo = new THREE.DodecahedronGeometry(0.16, 0);
    pebbleGeo.translate(0, 0.08, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({
        color: 0x7a6c5b,
        roughness: 0.94,
        metalness: 0.06,
        flatShading: true
    });
    const pebbleInstanced = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
    pebbleInstanced.receiveShadow = true;

    for(let i = 0; i < pebbleCount; i++){
        let px, pz;
        if(i < 80){
            const ang = rng(0, Math.PI * 2);
            const r = rng(17.8, 20.2);
            px = Math.sin(ang) * r;
            pz = Math.cos(ang) * r;
        } else if(i < 140){
            px = rng(-2.8, 2.8);
            pz = rng(18, 48);
        } else {
            const branch = Math.random();
            if(branch < 0.4){
                px = rng(-2.6, 2.6);
                pz = rng(-38, -18);
            } else if(branch < 0.7){
                px = rng(18, 38);
                pz = rng(-2.4, 2.4);
            } else {
                px = rng(-38, -18);
                pz = rng(-2.4, 2.4);
            }
        }
        dummy.position.set(px, 0.02, pz);
        dummy.rotation.set(rng(0, 0.4), rng(0, Math.PI * 2), rng(0, 0.4));
        const ps = rng(0.65, 1.5);
        dummy.scale.set(ps, ps * rng(0.5, 0.8), ps);
        dummy.updateMatrix();
        pebbleInstanced.setMatrixAt(i, dummy.matrix);
    }
    pebbleInstanced.instanceMatrix.needsUpdate = true;
    scene.add(pebbleInstanced);

    // 4. Village Props: Hay Bales, Barrels, Stacked Crates
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xd6b149, roughness: 0.92 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x6e4926, roughness: 0.85 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x51351e, roughness: 0.82 });

    function makeHayBale(hx, hz, rot = 0){
        const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.85, 8), hayMat);
        hb.rotation.z = Math.PI / 2;
        hb.rotation.y = rot;
        hb.position.set(hx, 0.42, hz);
        hb.castShadow = true;
        scene.add(hb);
        scene.add(createContactShadow(0.7, 0.7, 0.4));
    }

    makeHayBale(-6.8, -11.5, 0.3);
    makeHayBale(-6.2, -12.1, 0.9);
    makeHayBale(7.2, -10.8, -0.4);
    makeHayBale(12.5, 3.8, 0.6);

    const cr1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), crateMat);
    cr1.position.set(6.2, 0.38, -1.8); cr1.castShadow = true; scene.add(cr1);
    const cr2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), crateMat);
    cr2.position.set(6.2, 1.05, -1.8); cr2.rotation.y = 0.25; cr2.castShadow = true; scene.add(cr2);

    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.95, 10), barrelMat);
    b1.position.set(-6.2, 0.48, 6.2); b1.castShadow = true; scene.add(b1);
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.95, 10), barrelMat);
    b2.position.set(-5.3, 0.48, 6.5); b2.castShadow = true; scene.add(b2);
})();

// ==================== 10-ZONE BOSS ARENA LANDMARKS ===================
(function createBossArenaLandmarks(){
    // Helper to build a ring of monolithic columns around an arena
    function buildArenaPillars(centerX, centerZ, radius, numPillars, colMat, runeCol, pillarH = 5.2, colR = 0.8){
        for(let i = 0; i < numPillars; i++){
            const ang = (i / numPillars) * Math.PI * 2;
            const px = centerX + Math.sin(ang) * radius;
            const pz = centerZ + Math.cos(ang) * radius;

            const col = new THREE.Mesh(new THREE.CylinderGeometry(colR * 0.75, colR * 1.15, pillarH, 6), colMat);
            col.position.set(px, pillarH * 0.48, pz);
            col.rotation.y = ang;
            col.castShadow = true;
            col.receiveShadow = true;
            scene.add(col);

            const rune = new THREE.Mesh(new THREE.OctahedronGeometry(colR * 0.6, 0), new THREE.MeshBasicMaterial({ color: runeCol }));
            rune.position.set(px, pillarH + 0.45, pz);
            scene.add(rune);

            // Register solid pillar obstacle for cover and kiting
            addCircleObstacle(px, pz, colR * 1.1, pillarH, 'arena_pillar');
        }
    }

    // 1. Zone 1: Gorgar Arena (0, 25) - Emerald Mossy Monoliths
    const z1Mat = new THREE.MeshStandardMaterial({color: 0x2e4420, roughness: 0.85});
    buildArenaPillars(0, 25, 15, 6, z1Mat, 0x44ff55, 4.6, 0.8);
    const d1 = new THREE.Mesh(new THREE.RingGeometry(2.5, 11, 24), new THREE.MeshBasicMaterial({color: 0x1f4418, side: THREE.DoubleSide}));
    d1.rotation.x = -Math.PI / 2; d1.position.set(0, 0.03, 25); scene.add(d1);

    // 2. Zone 2: Ur-Gathok Arena (0, 85) - Crimson Canyon Monoliths
    const z2Mat = new THREE.MeshStandardMaterial({color: 0x7a301a, roughness: 0.9});
    buildArenaPillars(0, 85, 15, 6, z2Mat, 0xff5511, 5.0, 0.85);
    const d2 = new THREE.Mesh(new THREE.RingGeometry(2.5, 11, 24), new THREE.MeshBasicMaterial({color: 0x824419, side: THREE.DoubleSide}));
    d2.rotation.x = -Math.PI / 2; d2.position.set(0, 0.03, 85); scene.add(d2);

    // 3. Zone 3: Morghul Arena (0, 145) - Toxic Swamp Totems
    const z3Mat = new THREE.MeshStandardMaterial({color: 0x1d3824, roughness: 0.85});
    buildArenaPillars(0, 145, 16, 6, z3Mat, 0x66ff33, 5.2, 0.85);
    const d3 = new THREE.Mesh(new THREE.RingGeometry(3.0, 12, 24), new THREE.MeshBasicMaterial({color: 0x184022, side: THREE.DoubleSide}));
    d3.rotation.x = -Math.PI / 2; d3.position.set(0, 0.03, 145); scene.add(d3);

    // 4. Zone 4: Amun-Khet Arena (0, 205) - Golden Desert Sand Obelisks
    const z4Mat = new THREE.MeshStandardMaterial({color: 0xb58c38, roughness: 0.88});
    buildArenaPillars(0, 205, 16, 6, z4Mat, 0xffd700, 5.5, 0.85);
    const d4 = new THREE.Mesh(new THREE.RingGeometry(3.0, 12, 24), new THREE.MeshBasicMaterial({color: 0xa87c24, side: THREE.DoubleSide}));
    d4.rotation.x = -Math.PI / 2; d4.position.set(0, 0.03, 205); scene.add(d4);

    // 5. Zone 5: Ymirath Arena (0, 265) - Glacial Ice Spires
    const z5Mat = new THREE.MeshStandardMaterial({color: 0x68a5c4, roughness: 0.25, metalness: 0.35, transparent: true, opacity: 0.88});
    buildArenaPillars(0, 265, 17, 8, z5Mat, 0x55eeff, 6.0, 0.9);
    const d5 = new THREE.Mesh(new THREE.RingGeometry(3.5, 13, 28), new THREE.MeshBasicMaterial({color: 0x336688, side: THREE.DoubleSide}));
    d5.rotation.x = -Math.PI / 2; d5.position.set(0, 0.03, 265); scene.add(d5);

    // 6. Zone 6: Rift-Breaker Arena (0, 325) - Obsidian Canyon Void Spires
    const z6Mat = new THREE.MeshStandardMaterial({color: 0x2d1838, roughness: 0.85, metalness: 0.3});
    buildArenaPillars(0, 325, 17, 8, z6Mat, 0xcc44ff, 6.2, 0.95);
    const d6 = new THREE.Mesh(new THREE.RingGeometry(3.5, 13, 28), new THREE.MeshBasicMaterial({color: 0x3e1854, side: THREE.DoubleSide}));
    d6.rotation.x = -Math.PI / 2; d6.position.set(0, 0.03, 325); scene.add(d6);

    // 7. Zone 7: Khar-Draz Arena (0, 385) - Hellfire Basalt Pillars
    const z7Mat = new THREE.MeshStandardMaterial({color: 0x42100a, roughness: 0.85, metalness: 0.2});
    buildArenaPillars(0, 385, 18, 8, z7Mat, 0xff2211, 6.5, 1.0);
    const d7 = new THREE.Mesh(new THREE.RingGeometry(3.5, 14, 28), new THREE.MeshBasicMaterial({color: 0x5a100a, side: THREE.DoubleSide}));
    d7.rotation.x = -Math.PI / 2; d7.position.set(0, 0.03, 385); scene.add(d7);

    // 8. Zone 8: Raikor Arena (0, 445) - Storm Conductor Pylons
    const z8Mat = new THREE.MeshStandardMaterial({color: 0x223652, roughness: 0.8, metalness: 0.35});
    buildArenaPillars(0, 445, 18, 8, z8Mat, 0x44aaff, 6.8, 1.0);
    const d8 = new THREE.Mesh(new THREE.RingGeometry(4.0, 14, 28), new THREE.MeshBasicMaterial({color: 0x1f3c66, side: THREE.DoubleSide}));
    d8.rotation.x = -Math.PI / 2; d8.position.set(0, 0.03, 445); scene.add(d8);

    // 9. Zone 9: Vane-Helm Arena (0, 505) - Gothic Soul Crypt Pillars
    const z9Mat = new THREE.MeshStandardMaterial({color: 0x161824, roughness: 0.88, metalness: 0.25});
    buildArenaPillars(0, 505, 19, 8, z9Mat, 0xdd22aa, 7.0, 1.05);
    const d9 = new THREE.Mesh(new THREE.RingGeometry(4.0, 15, 28), new THREE.MeshBasicMaterial({color: 0x221836, side: THREE.DoubleSide}));
    d9.rotation.x = -Math.PI / 2; d9.position.set(0, 0.03, 505); scene.add(d9);

    // 10. Zone 10: Final Boss Aethelgard Arena (0, 585) - Cosmic Throne with Star Altar
    const z10Mat = new THREE.MeshStandardMaterial({color: 0x191033, roughness: 0.75, metalness: 0.5});
    buildArenaPillars(0, 585, 22, 10, z10Mat, 0xe0a0ff, 8.0, 1.2);
    const d10 = new THREE.Mesh(new THREE.RingGeometry(5.0, 18, 32), new THREE.MeshBasicMaterial({color: 0x3b1666, side: THREE.DoubleSide}));
    d10.rotation.x = -Math.PI / 2; d10.position.set(0, 0.03, 585); scene.add(d10);

    // Cosmic Throne Dais at the Center of Zone 10
    const throneBase = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.0, 1.4, 8), z10Mat);
    throneBase.position.set(0, 0.7, 585); throneBase.castShadow = true; scene.add(throneBase);
    const thronePillar = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 3.8, 6), z10Mat);
    thronePillar.position.set(0, 3.3, 583); thronePillar.castShadow = true; scene.add(thronePillar);
    addBoxObstacle(-4.5, 4.5, 581, 589, 4, 'cosmic_throne');
})();

// Window Globals
window.PLAYER_BASE_SPEED = PLAYER_BASE_SPEED;
window.PLAYER_TURN_SPEED = PLAYER_TURN_SPEED;
window.CAM_SMOOTH = CAM_SMOOTH;
window.CAM_MIN_DIST = CAM_MIN_DIST;
window.CAM_MAX_DIST = CAM_MAX_DIST;
window.CAM_INIT_DIST = CAM_INIT_DIST;
window.CAM_INIT_PHI = CAM_INIT_PHI;
window.ATTACK_RANGE = ATTACK_RANGE;
window.ATTACK_COOLDOWN_MS = ATTACK_COOLDOWN_MS;
window.AGGRO_RANGE = AGGRO_RANGE;
window.MONSTER_ATK_RANGE = MONSTER_ATK_RANGE;
window.MONSTER_BASE_SPEED = MONSTER_BASE_SPEED;
window.MONSTER_ATK_CD = MONSTER_ATK_CD;
window.RESPAWN_MS = RESPAWN_MS;
window.WORLD_HALF = WORLD_HALF;
window.MAP_MIN_X = MAP_MIN_X;
window.MAP_MAX_X = MAP_MAX_X;
window.MAP_MIN_Z = MAP_MIN_Z;
window.MAP_MAX_Z = MAP_MAX_Z;
window.WALL_Z = WALL_Z;
window.GATE_ZONES = GATE_ZONES;
window.GATE_LEVELS = GATE_LEVELS;

window.rng = rng;
window.choice = choice;
window.clamp = clamp;
window.lerp = lerp;
window.dist2D = dist2D;

window.BIOMES = BIOMES;
window.getBiomeAt = getBiomeAt;
window.CLASSES = CLASSES;
window.ELEMENTS = ELEMENTS;
window.ITEMS = ITEMS;
window.MON = MON;
window.G = G;

window.collisionObstacles = window.collisionObstacles;
window.addBoxObstacle = addBoxObstacle;
window.addCircleObstacle = addCircleObstacle;
window.checkObstacleCollision = checkObstacleCollision;
window.resolveMovementSliding = resolveMovementSliding;
window.gateBarriers = window.gateBarriers;

window.canvas = canvas;
window.renderer = renderer;
window.composer = composer;
window.scene = scene;
window.camera = camera;
window.clock = clock;
window.raycaster = raycaster;
window.mouseVec2 = mouseVec2;
window.minimapCanvas = minimapCanvas;
window.minimapCtx = minimapCtx;

window.mainSunLight = mainSunLight;
window.mainAmbLight = mainAmbLight;
window.mainHemiLight = mainHemiLight;
window.visualSunGroup = visualSunGroup;
window.sunCorona = sunCorona;
window.createContactShadow = createContactShadow;
window.updateDayNight = updateDayNight;
window.villageHouses = villageHouses;
