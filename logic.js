function loadCollection() {
    try {
        const saved = localStorage.getItem('jukugo_firework_collection');
        if (saved) {
            const data = JSON.parse(saved);
            state.collection = data.collection || [];
        }
    } catch (e) {
        console.error("Save load failed", e);
    }
}

function saveCollection() {
    try {
        localStorage.setItem('jukugo_firework_collection', JSON.stringify({
            collection: state.collection
        }));
    } catch (e) {
        console.error("Save failed", e);
    }
}

function checkCollection(word) {
    let saved = false;
    COLLECTION_DATA.forEach(group => {
        if (group.words.includes(word)) {
            // 元々コンプリートしていたか
            const wasCompleted = group.words.every(w => state.collection.includes(w));
            
            if (!state.collection.includes(word)) {
                state.collection.push(word);
                saved = true;
            }
            
            // 獲得後のコンプリート状態
            const isCompleted = group.words.every(w => state.collection.includes(w));
            
            if (!wasCompleted && isCompleted) {
                if (!state.newlyCompletedGroups.includes(group.name)) {
                    state.newlyCompletedGroups.push(group.name);
                }
            }
        }
    });
    if (saved) saveCollection();
}

function setupDeck() {
    state.deck = [...uniqueKanjiList];
    for (let i = state.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
}

function popNewHandChar() {
    if (state.deck.length === 0) setupDeck();
    
    const usefulIndices = getUsefulKanji();
    if (usefulIndices.length > 0 && Math.random() < 0.5) {
        const idx = usefulIndices[Math.floor(Math.random() * usefulIndices.length)];
        return state.deck.splice(idx, 1)[0];
    } else {
        return state.deck.pop();
    }
}

function fillHand() {
    while (state.playerHand.length < 8) {
        state.playerHand.push(popNewHandChar());
    }
}

function getUsefulKanji() {
    const useful = [];
    const directions = [
        { dir: 'down', range: Array.from({length: GRID_SIZE}, (_, i) => [i, 0]) },
        { dir: 'up', range: Array.from({length: GRID_SIZE}, (_, i) => [i, GRID_SIZE - 1]) },
        { dir: 'right', range: Array.from({length: GRID_SIZE}, (_, i) => [0, i]) },
        { dir: 'left', range: Array.from({length: GRID_SIZE}, (_, i) => [GRID_SIZE - 1, i]) }
    ];

    const scanSize = Math.min(state.deck.length, 50);
    for (let i = state.deck.length - 1; i >= state.deck.length - scanSize; i--) {
        const char = state.deck[i];
        let canForm = false;
        
        for (const {dir, range} of directions) {
            for (const [ex, ey] of range) {
                if (state.grid[`${ex},${ey}`]) continue;
                const landing = getLandingCell(ex, ey, dir);
                if (landing) {
                    state.grid[`${landing.x},${landing.y}`] = char;
                    if (validateLine(landing.x, landing.y, true).isValid || 
                        validateLine(landing.x, landing.y, false).isValid) {
                        canForm = true;
                    }
                    delete state.grid[`${landing.x},${landing.y}`];
                }
                if (canForm) break;
            }
            if (canForm) break;
        }
        if (canForm) useful.push(i);
    }
    return useful;
}

function shuffleHand() {
    state.deck.push(...state.playerHand);
    state.playerHand = [];
    setupDeck();
    fillHand();
    renderHand();
    refreshHighlights();
}

function validateLine(x, y, isH) {
    let minD = 0, maxD = 0, i = 1;
    while (isH ? state.grid[`${x-i},${y}`] : state.grid[`${x},${y-i}`]) { minD = -i; i++; }
    i = 1;
    while (isH ? state.grid[`${x+i},${y}`] : state.grid[`${x},${y+i}`]) { maxD = i; i++; }
    
    let isValid = false, coordLists = [], words = [];
    for (let len = 2; len <= 4; len++) {
        for (let offset = -len + 1; offset <= 0; offset++) {
            const s = offset, e = offset + len - 1;
            if (s >= minD && e <= maxD) {
                let word = "", currentCoords = [];
                for (let d = s; d <= e; d++) {
                    const cx = isH ? x+d : x, cy = isH ? y : y+d;
                    word += state.grid[`${cx},${cy}`];
                    currentCoords.push(`${cx},${cy}`);
                }
                if (dictionary.has(word)) { 
                    isValid = true; 
                    coordLists.push(currentCoords);
                    words.push(word);
                }
            }
        }
    }
    return { isValid, coordLists, words };
}

function getLandingCell(startX, startY, dir) {
    let curX = startX, curY = startY;
    const dx = { 'right': 1, 'left': -1, 'up': 0, 'down': 0 }[dir];
    const dy = { 'right': 0, 'left': 0, 'up': -1, 'down': 1 }[dir];

    while (true) {
        let nextX = curX + dx, nextY = curY + dy;
        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE || state.grid[`${nextX},${nextY}`]) {
            return { x: curX, y: curY };
        }
        curX = nextX;
        curY = nextY;
    }
}

function getExplosionCoords(x, y) {
    const coords = new Set();
    const range = state.powerUps.explosionRange;

    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            if (dx === 0 && dy === 0) continue;
            coords.add(`${x + dx},${y + dy}`);
        }
    }
    return Array.from(coords).filter(key => {
        const [ex, ey] = key.split(',').map(Number);
        return ex >= 0 && ex < GRID_SIZE && ey >= 0 && ey < GRID_SIZE;
    });
}

function getPowerUpLines(x, y) {
    const coords = new Set();
    if (state.powerUps.isCross) {
        for (let i = 0; i < GRID_SIZE; i++) {
            if (i !== x) coords.add(`${i},${y}`);
            if (i !== y) coords.add(`${x},${i}`);
        }
    }
    if (state.powerUps.isDiagonal) {
        for (let i = -GRID_SIZE; i <= GRID_SIZE; i++) {
            if (i === 0) continue;
            coords.add(`${x + i},${y + i}`);
            coords.add(`${x + i},${y - i}`);
        }
    }
    return Array.from(coords).filter(key => {
        const [ex, ey] = key.split(',').map(Number);
        return ex >= 0 && ex < GRID_SIZE && ey >= 0 && ey < GRID_SIZE;
    });
}

function damageNearbyEnemies(x, y, skipLines = false) {
    const coords = getExplosionCoords(x, y);
    if (!skipLines) {
        coords.push(...getPowerUpLines(x, y));
    }
    
    const uniqueCoords = Array.from(new Set(coords));
    const damagedBosses = new Set();

    uniqueCoords.forEach(key => {
        if (!state.grid[key]) return;

        if (state.grid[key] === 'ENEMY' && state.enemies[key]) {
            const enemy = state.enemies[key];
            
            if (enemy.type === 'boss') {
                if (damagedBosses.has(enemy)) return;
                damagedBosses.add(enemy);
            }

            enemy.hp -= 1;
            if (enemy.hp <= 0) {
                const [ex, ey] = key.split(',').map(Number);
                killEnemy(ex, ey);
            } else {
                if (enemy.type === 'boss') {
                    const rootCell = cellDOMs[enemy.rootKey];
                    if (rootCell) {
                        rootCell.style.transition = 'filter 0.1s ease-out';
                        rootCell.style.filter = 'brightness(3) contrast(1.5)';
                        setTimeout(() => { 
                            if (rootCell) rootCell.style.filter = 'brightness(1) contrast(1)';
                        }, 300);
                    }
                    if (typeof spawnBossCounterObstacles === 'function') {
                        if (enemy.asset === 'toge_dai') spawnBossCounterObstacles(2, 'J1');
                        else if (enemy.asset === 'toge_toku') spawnBossCounterObstacles(2, 'J2');
                    }
                } else if (cellDOMs[key]) {
                    cellDOMs[key].style.filter = 'brightness(2) contrast(2)';
                    setTimeout(() => {
                        if (cellDOMs[key]) cellDOMs[key].style.filter = '';
                    }, 200);
                }
            }
        } else {
            const isHardObstacle = state.grid[key] === 'OBSTACLE_HARD';
            const isObstacle = state.grid[key] === 'OBSTACLE' || state.grid[key] === 'OBSTACLE_J2' || state.grid[key] === '■';

            if (isHardObstacle) {
                state.grid[key] = 'OBSTACLE';
                const cell = cellDOMs[key];
                if (cell) {
                    cell.classList.remove('obstacle-hard');
                    cell.classList.add('obstacle');
                }
            } else {
                const isRealObstacle = isObstacle;
                delete state.grid[key];
                const cell = cellDOMs[key];
                if (cell) {
                    cell.textContent = '';
                    cell.classList.remove('occupied', 'obstacle', 'obstacle-hard', 'exploding', 'fast', 'faster', 'obstacle-j2');
                }
                const [ex, ey] = key.split(',').map(Number);
                createParticles(ex, ey);
                if (!isRealObstacle && state.grid[key] !== 'ENEMY') state.score++;
            }
        }
    });
}

function killEnemy(x, y) {
    const key = `${x},${y}`;
    const enemy = state.enemies[key];
    
    if (enemy && enemy.type === 'boss') {
        if (enemy.isDying) return;
        enemy.isDying = true;

        const rootKey = enemy.rootKey;
        const size = enemy.size;
        const [rx, ry] = rootKey.split(',').map(Number);
        
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const k = `${rx + dx},${ry + dy}`;
                if (state.grid[k] === 'ENEMY') {
                    createParticles(rx + dx, ry + dy);
                    delete state.grid[k];
                    delete state.enemies[k];
                    const cell = cellDOMs[k];
                    if (cell) {
                        cell.classList.remove('enemy', 'enemy-i', 'occupied', 'boss-dai-root', 'boss-toku-root', 'boss-part', 'boss-hit-flash', 'obstacle-j2');
                    }
                    state.timeLimit += 10;
                    if (typeof showTimePlusPopup === 'function') showTimePlusPopup(10);
                }
            }
        }
        state.score += 50;
    } else if (enemy) {
        createParticles(x, y);
        delete state.grid[key];
        delete state.enemies[key];
        const cell = cellDOMs[key];
        if (cell) {
            cell.classList.remove('enemy', 'enemy-i', 'occupied');
        }
        state.timeLimit += 10;
        if (typeof showTimePlusPopup === 'function') showTimePlusPopup(10);
        state.score += 10;
    }
    updateStatsUI();
}

let isClearing = false;
function checkStageClear() {
    if (isClearing) return;
    const remainingEnemies = Object.keys(state.enemies).length;
    if (remainingEnemies === 0) {
        isClearing = true;
        if (state.moveInterval) {
            clearInterval(state.moveInterval);
            state.moveInterval = null;
        }
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
        setTimeout(() => {
            showStageClearModal();
            isClearing = false;
        }, 800);
    }
}

function moveMovingEnemies() {
    if (state.isShooting || state.isRouletteActive) return;

    const movingKeys = Object.keys(state.enemies).filter(key => state.enemies[key].type === 'moving');
    const reserved = new Set();

    movingKeys.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const adjacents = [
            {nx: x, ny: y - 1}, {nx: x, ny: y + 1},
            {nx: x - 1, ny: y}, {nx: x + 1, ny: y}
        ].filter(({nx, ny}) => {
            const nKey = `${nx},${ny}`;
            return nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !state.grid[nKey] && !reserved.has(nKey);
        });

        if (adjacents.length > 0) {
            const next = adjacents[Math.floor(Math.random() * adjacents.length)];
            const nKey = `${next.nx},${next.ny}`;
            reserved.add(nKey);
            
            const enemyData = state.enemies[key];
            delete state.grid[key];
            delete state.enemies[key];
            
            state.grid[nKey] = 'ENEMY';
            state.enemies[nKey] = enemyData;
            
            const oldCell = cellDOMs[key];
            const newCell = cellDOMs[nKey];
            
            if (oldCell) oldCell.classList.remove('enemy-i');
            if (newCell) {
                newCell.classList.add('enemy-i');
                newCell.style.animation = 'none';
                void newCell.offsetWidth;
                newCell.style.animation = '';
            }
        }
    });
    if (typeof refreshHighlights === 'function') refreshHighlights();
}

function explodeAllEnemies() {
    const keys = Object.keys(state.enemies);
    keys.forEach(key => {
        if (state.enemies[key]) {
            const [x, y] = key.split(',').map(Number);
            killEnemy(x, y);
        }
    });
    checkStageClear();
}