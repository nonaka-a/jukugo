// --- 定数 ---
const GRID_SIZE = 10;
const TILE_SIZE = 60;

const STAGES = [
    { enemyCount: 4, obstacles: [] },
    { enemyCount: 8, obstacles: [{x: 4, y: 3}, {x: 5, y: 3}, {x: 4, y: 6}, {x: 5, y: 6}] },
    { enemyCount: 12, obstacles: [{x: 4, y: 4}, {x: 5, y: 4}, {x: 4, y: 5}, {x: 5, y: 5}] }
];

const hubKanji = "用的力学不内生物地人動中定行合通化一自作意大理対外会成出事体電目国日分野気法実名面性入文和度最路感".split("");

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
    difficulty: 'normal'
};

// --- BGM・システム制御 ---
const bgm = new Audio('BGM.mp3');
bgm.loop = true;
let isBgmPlaying = false;
let bgmInteracted = false;
let spawnInterval = null;

// --- 表示関連 ---
let scale = 1.0;
const cellDOMs = {};

// --- DOM要素の参照 (main.jsのinitで代入されます) ---
let gridElement, gameWindow, playerHandElement, launcherElement, guideLineElement;