// --- 定数 ---
const GRID_SIZE = 8;
const TILE_SIZE = 60;
const GAME_SIZE = 630;

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

const COLLECTION_DATA = [
    { name: "時間", words: ["現在", "将来", "未来", "以前", "以後"] },
    { name: "政治", words: ["政治", "政府", "政党", "国家", "主権"] },
    { name: "仕事", words: ["作業", "労働", "事務", "任務", "勤務"] },
    { name: "理科", words: ["植物", "大気", "地球", "惑星", "衛星"] },
    { name: "勝負", words: ["成功", "失敗", "勝利", "優勝", "成果"] },
    { name: "捜査", words: ["捜査", "犯人", "犯行", "証言", "被告"] },
    { name: "天気", words: ["天気", "気象", "予報", "暴風", "気温"] },
    { name: "病院", words: ["病院", "入院", "退院", "手術", "看護"] },
    { name: "料理", words: ["食事", "料理", "調理", "夕食", "和食"] }
];

// コレクションに含まれる全漢字をSetとして保持（高速判定用）
const COLLECTION_KANJI = new Set(
    COLLECTION_DATA.flatMap(group => group.words.flatMap(word => word.split("")))
);

const COLLECTION_TITLES = [
    { rank: "熟語見習い", desc: "さあ熟語収集をスタートさせよう！" },
    { rank: "熟語初級", desc: "熟語の集め方がつかめてきたね" },
    { rank: "熟語愛好家", desc: "熟語を嗜んでおります" },
    { rank: "熟語中級", desc: "この熟語力、もう素人とはいわせない" },
    { rank: "熟語目利き", desc: "鋭い観察眼！良い熟語の構成を見抜けます" },
    { rank: "熟語これくたー", desc: "かなりの種類の熟語たちがあなたの手元に" },
    { rank: "熟語くろうと", desc: "熟語を変幻自在に使いこなす" },
    { rank: "熟語博士", desc: "知識の深さは折り紙付き" },
    { rank: "熟語ますたー", desc: "熟語ぱずるの極致" },
    { rank: "熟語花火士", desc: "夜空に知識の大輪を咲かせる者" }
];

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
    collection: [], // 獲得済み熟語
    newlyCompletedGroups: [], // 演出待ちのコンプリートグループ
    lampCount: 0,
    powerUps: {
        explosionRange: 1,
        isCross: false,
        isDiagonal: false
    },
    isRouletteActive: false,
    isPowerUpActive: false,
    moveInterval: null,
    timeLimit: 200,
    timerInterval: null
};

// --- BGM・システム制御 ---
const BGM_LIST = ['assets/BGM.mp3', 'assets/BGM2.mp3', 'assets/BGM3.mp3'];
const bgm = new Audio();
bgm.loop = false;
bgm.volume = 0.4;
const seFireworkList = [
    new Audio('assets/firework.mp3'),
    new Audio('assets/firework_2.mp3'),
    new Audio('assets/firework_3.mp3')
];
const seThrow = new Audio('assets/Throw.mp3');
const seClear = new Audio('assets/Clear.mp3');
let isBgmPlaying = false;
let bgmInteracted = false;
let spawnInterval = null;

// --- 表示関連 ---
let scale = 1.0;
const cellDOMs = {};

// --- DOM要素の参照 ---
let gridElement, gameWindow, playerHandElement, launcherElement, guideLineElement;