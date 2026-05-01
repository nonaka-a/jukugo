// --- 定数 ---
const GRID_SIZE = 8;
const TILE_SIZE = 60;
const GAME_SIZE = 630; // 追加：ゲームウィンドウの縦横サイズ（px）

const STAGES = [
    { enemyCount: 3, obstacles: [] }, // STAGE 1
    { enemyCount: 5, obstacles: [{x: 3, y: 2}, {x: 4, y: 5}] }, // STAGE 2
    { enemyCount: 6, obstacles: [{x: 3, y: 3, hp: 2}, {x: 4, y: 4, hp: 2}] }, // STAGE 3
    { enemyCount: 6, obstacles: [{x: 0, y: 0, hp: 2}, {x: 7, y: 0, hp: 2}, {x: 0, y: 7, hp: 2}], movingEnemies: 2 }, // STAGE 4
    { enemyCount: 2, obstacles: [], bosses: [{x: 3, y: 3, size: 2, hp: 5, asset: 'toge_dai'}] }, // STAGE 5 BOSS (HP:5)
    { enemyCount: 8, obstacles: [{x: 2, y: 2, hp: 2}, {x: 5, y: 5, hp: 2}], movingEnemies: 3 }, // STAGE 6
    { enemyCount: 9, obstacles: [{x: 1, y: 1, hp: 2}, {x: 6, y: 6, hp: 2}], movingEnemies: 4 }, // STAGE 7
    { enemyCount: 6, obstacles: [], bosses: [{x: 1, y: 1, size: 2, hp: 5, asset: 'toge_dai'}, {x: 5, y: 5, size: 2, hp: 5, asset: 'toge_dai'}], movingEnemies: 1 }, // STAGE 8
    { enemyCount: 10, obstacles: [{x: 3, y: 0, hp: 2}, {x: 4, y: 0, hp: 2}, {x: 3, y: 7, hp: 2}], movingEnemies: 5 }, // STAGE 9
    { enemyCount: 2, obstacles: [
        {x: 0, y: 7, type: 'j2'}, {x: 7, y: 0, type: 'j2'}, 
        {x: 3, y: 0, type: 'j2'}
    ], bosses: [
        {x: 2, y: 2, size: 3, hp: 10, asset: 'toge_toku'},
        {x: 0, y: 0, size: 2, hp: 5, asset: 'toge_dai'},
        {x: 6, y: 6, size: 2, hp: 5, asset: 'toge_dai'}
    ], movingEnemies: 2 } // STAGE 10 FINAL BOSS (HP:10 + HP:5x2)
];

const hubKanji = "用的力学不内生物地人動中定行合通化一自作意大理対外会成出事体電目国日分野気法実名面性入文和度最路感花火爆発札十字角".split("");

// --- 状態管理 ---
const state = {
    grid: {},
    playerHand: [],
    deck: [],
    selectedHandIndex: 0,
    launcher: { x: -1, y: -1, dir: null, char: '' },
    isShooting: false,
    score: 0,
    spawnSpeed: 20000,
    isSoundOn: true,
    currentStage: 0,
    enemies: {},
    difficulty: 'normal',
    bgmIndex: 0,
    history: [],
    lampCount: 0,
    powerUps: {
        explosionRange: 1,
        isCross: false,
        isDiagonal: false
    },
    isRouletteActive: false,
    isPowerUpActive: false,
    moveInterval: null
};

// --- BGM・システム制御 ---
const BGM_LIST = ['assets/BGM.mp3', 'assets/BGM2.mp3', 'assets/BGM3.mp3'];
const bgm = new Audio();
bgm.loop = false;
bgm.volume = 0.4;
const seFirework = new Audio('assets/firework.mp3');
let isBgmPlaying = false;
let bgmInteracted = false;
let spawnInterval = null;

// --- 表示関連 ---
let scale = 1.0;
const cellDOMs = {};

// --- DOM要素の参照 (main.jsのinitで代入されます) ---
let gridElement, gameWindow, playerHandElement, launcherElement, guideLineElement;