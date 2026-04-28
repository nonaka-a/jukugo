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

    // 基本範囲（花火パワーアップで2に拡張）
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
    // 十字パワーアップ
    if (state.powerUps.isCross) {
        for (let i = 0; i < GRID_SIZE; i++) {
            if (i !== x) coords.add(`${i},${y}`);
            if (i !== y) coords.add(`${x},${i}`);
        }
    }
    // 対角パワーアップ
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
    
    // 重複除去
    const uniqueCoords = Array.from(new Set(coords));

    uniqueCoords.forEach(key => {
        if (!state.grid[key]) return;

        if (state.grid[key] === 'ENEMY' && state.enemies[key]) {
            state.enemies[key].hp -= 1;
            if (state.enemies[key].hp <= 0) {
                const [ex, ey] = key.split(',').map(Number);
                killEnemy(ex, ey);
            } else {
                if (cellDOMs[key]) {
                    cellDOMs[key].style.filter = 'brightness(2) contrast(2)';
                    setTimeout(() => {
                        if (cellDOMs[key]) cellDOMs[key].style.filter = '';
                    }, 200);
                }
            }
        } else {
            const isObstacle = state.grid[key] === 'OBSTACLE';
            delete state.grid[key];
            const cell = cellDOMs[key];
            if (cell) {
                cell.textContent = '';
                cell.classList.remove('occupied', 'obstacle', 'exploding', 'fast', 'faster');
            }
            const [ex, ey] = key.split(',').map(Number);
            createParticles(ex, ey);
            if (!isObstacle && state.grid[key] !== 'ENEMY') state.score++;
        }
    });
}

function killEnemy(x, y) {
    const key = `${x},${y}`;
    createParticles(x, y);
    delete state.grid[key];
    delete state.enemies[key];
    const cell = cellDOMs[key];
    cell.classList.remove('enemy', 'occupied');
    updateStatsUI();
}

function checkStageClear() {
    const remainingEnemies = Object.keys(state.enemies).length;
    if (remainingEnemies === 0) {
        setTimeout(() => {
            showStageClearModal();
        }, 500);
    }
}