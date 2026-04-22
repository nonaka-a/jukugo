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
    
    Object.keys(cellDOMs).forEach(key => {
        const cell = cellDOMs[key];
        cell.textContent = '';
        cell.className = 'cell';
    });

    const stage = STAGES[index % STAGES.length];
    
    if (stage.obstacles) {
        stage.obstacles.forEach(o => {
            const key = `${o.x},${o.y}`;
            state.grid[key] = 'OBSTACLE';
            const cell = cellDOMs[key];
            cell.textContent = '■';
            cell.classList.add('occupied', 'obstacle');
        });
    }

    let enemiesPlaced = 0;
    while (enemiesPlaced < stage.enemyCount) {
        const rx = 2 + Math.floor(Math.random() * (GRID_SIZE - 4));
        const ry = 2 + Math.floor(Math.random() * (GRID_SIZE - 4));
        const key = `${rx},${ry}`;
        if (!state.grid[key]) {
            state.grid[key] = 'ENEMY';
            state.enemies[key] = { hp: 1 };
            const cell = cellDOMs[key];
            cell.classList.add('enemy');
            enemiesPlaced++;
        }
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

function startGame(difficulty) {
    state.difficulty = difficulty;
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('stats-container').style.display = 'flex';
    
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
    toggleSettings();
}

function init() {
    gridElement = document.getElementById('grid-container');
    gameWindow = document.getElementById('game-window');
    playerHandElement = document.getElementById('player-hand-container');
    launcherElement = document.getElementById('launcher');
    guideLineElement = document.getElementById('guide-line');

    setupDeck();
    initGridDOM();
    
    resetView();
    fillHand();
    renderHand();
    setupEvents();
    
    startSpawnInterval();
    
    window.addEventListener('click', () => {
        if (!bgmInteracted) {
            bgmInteracted = true;
            bgm.play().then(() => {
                isBgmPlaying = true;
            }).catch(e => console.log("BGM Blocked", e));
        }
    }, { once: true });
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', resetView);