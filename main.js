function startSpawnInterval() {
    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        spawnRandomTile();
        spawnRandomTile();
        spawnObstacle();
    }, state.spawnSpeed);
}

function updateDifficulty() {
    const select = document.getElementById('speed-select');
    state.spawnSpeed = parseInt(select.value);
    startSpawnInterval();
}

function loadStage(index) {
    state.currentStage = index;
    state.grid = {};
    state.enemies = {};
    
    // 背景・盤面の切り替え
    const bgNum = (index % 3) + 1;
    const bgName = bgNum === 1 ? 'BG.jpg' : `BG${bgNum}.jpg`;
    const banmenName = bgNum === 1 ? 'banmen.png' : `banmen${bgNum}.png`;
    
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.style.backgroundImage = `url('assets/${bgName}')`;
    }
    const gameWindow = document.getElementById('game-window');
    if (gameWindow) {
        gameWindow.style.backgroundImage = `url('assets/${banmenName}')`;
    }
    
    if (state.moveInterval) {
        clearInterval(state.moveInterval);
        state.moveInterval = null;
    }

    Object.keys(cellDOMs).forEach(key => {
        const cell = cellDOMs[key];
        cell.textContent = '';
        cell.className = 'cell';
    });

    const stage = STAGES[index % STAGES.length];
    
    if (stage.obstacles) {
        stage.obstacles.forEach(o => {
            const key = `${o.x},${o.y}`;
            const hp = o.hp || 1;
            const cell = cellDOMs[key];
            if (!cell) return;

            if (o.type === 'j2') {
                state.grid[key] = 'OBSTACLE_J2';
                cell.classList.add('occupied', 'obstacle-j2');
            } else {
                state.grid[key] = (hp > 1) ? 'OBSTACLE_HARD' : 'OBSTACLE';
                cell.classList.add('occupied', hp > 1 ? 'obstacle-hard' : 'obstacle');
            }
            cell.textContent = '■';
        });
    }

    let enemiesPlaced = 0;
    const normalCount = stage.enemyCount || 0;
    const movingCount = stage.movingEnemies || 0;
    const totalEnemies = normalCount + movingCount;

    let attempts = 0;
    const maxAttempts = 1000;
    while (enemiesPlaced < totalEnemies && attempts < maxAttempts) {
        attempts++;
        // 出現範囲をグリッド全体（0〜GRID_SIZE-1）に拡大
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        const key = `${rx},${ry}`;
        if (!state.grid[key]) {
            state.grid[key] = 'ENEMY';
            const isMoving = enemiesPlaced >= normalCount;
            state.enemies[key] = { hp: isMoving ? 2 : 1, type: isMoving ? 'moving' : 'normal' };
            const cell = cellDOMs[key];
            cell.classList.add(isMoving ? 'enemy-i' : 'enemy');
            enemiesPlaced++;
        }
    }

    if (stage.bosses) {
        stage.bosses.forEach(b => {
            const bossData = { hp: b.hp, type: 'boss', size: b.size, asset: b.asset, rootKey: `${b.x},${b.y}` };
            for (let dy = 0; dy < b.size; dy++) {
                for (let dx = 0; dx < b.size; dx++) {
                    const key = `${b.x + dx},${b.y + dy}`;
                    state.grid[key] = 'ENEMY';
                    state.enemies[key] = bossData;
                    const cell = cellDOMs[key];
                    if (dx === 0 && dy === 0) {
                        cell.classList.add(b.size === 2 ? 'boss-dai-root' : 'boss-toku-root');
                    }
                    cell.classList.add('boss-part');
                }
            }
        });
    }

    if (movingCount > 0) {
        state.moveInterval = setInterval(moveMovingEnemies, 20000);
    }
    
    const initialCount = 8;
    let placed = 0;
    while (placed < initialCount) {
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        const key = `${rx},${ry}`;
        if (!state.grid[key]) {
            const char = hubKanji[Math.floor(Math.random() * hubKanji.length)];
            placeTile(rx, ry, char);
            placed++;
        }
    }
    
    refreshHighlights();
    updateStatsUI();
}

function updateBGM() {
    bgm.src = BGM_LIST[state.bgmIndex];
    state.bgmIndex = (state.bgmIndex + 1) % BGM_LIST.length;
}

// BGM終了時に次の曲を再生
bgm.addEventListener('ended', () => {
    updateBGM();
    if (state.isSoundOn) {
        bgm.play().catch(e => console.log("BGM auto-next error:", e));
    }
});

function startGame(difficulty) {
    state.difficulty = difficulty;
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('stats-container').style.display = 'flex';
    
    updateBGM(); // 追加
    if (state.isSoundOn) {
        bgm.play().catch(e => console.log("BGM再生エラー:", e));
    }

    // パワーアップ状態の初期化（新規ゲーム開始時のみ）
    state.lampCount = 0;
    state.powerUps = { explosionRange: 1, isCross: false, isDiagonal: false };
    state.isPowerUpActive = false;

    loadStage(0);
    state.score = 0;
    setupDeck();
    fillHand();
    renderHand();
    refreshHighlights();
}

function backToTitle() {
    document.getElementById('title-screen').style.display = 'flex';
    document.getElementById('stats-container').style.display = 'none';
    
    if (state.moveInterval) {
        clearInterval(state.moveInterval);
        state.moveInterval = null;
    }
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
    }

    // 設定画面が開いていれば閉じる
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay && settingsOverlay.style.display === 'flex') {
        toggleSettings();
    }
}

function init() {
    gridElement = document.getElementById('grid-container');
    gameWindow = document.getElementById('game-window');
    playerHandElement = document.getElementById('player-hand-container');
    launcherElement = document.getElementById('launcher');
    guideLineElement = document.getElementById('guide-line');

    setupDeck();
    initGridDOM();
    initLampsUI();
    
    resetView();
    fillHand();
    renderHand();
    setupEvents();
    
    startSpawnInterval();
    
    window.addEventListener('click', () => {
        if (!bgmInteracted) {
            bgmInteracted = true;
            
            // iOS/iPadOSの音声再生制限を解除するためのダミー再生
            if (window.speechSynthesis) {
                const dummy = new SpeechSynthesisUtterance("");
                window.speechSynthesis.speak(dummy);
            }

            // SEの再生制限解除
            seFirework.play().then(() => {
                seFirework.pause();
                seFirework.currentTime = 0;
            }).catch(e => console.log("SE Unlock Failed", e));
            
            if (!bgm.src && BGM_LIST.length > 0) {
                bgm.src = BGM_LIST[state.bgmIndex];
            }
            bgm.play().then(() => {
                isBgmPlaying = true;
            }).catch(e => console.log("BGM Blocked", e));
        }
    }, { once: true });
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', resetView);