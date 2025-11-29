// ====================================================================
// 1. STATE MANAGEMENT AND UTILITIES
// ====================================================================

// Default user state structure
const DEFAULT_GAME_STATE = {
    username: 'PlayerOne',
    xp: 0,
    coins: 1000,
    highScores: {
        'budget-master': 0,
        'trivia-race': 0,
        'investment-sim': 0,
        'save-to-win': 0,
        'fraud-detective': 0,
        'wealth-world': 0,
    },
    gameData: {
        budget: { score: 0, month: 1, balance: 50000, emergencyFund: 0, savings: 0, expenses: 0 },
        trivia: { score: 0, position: 0, lives: 3, questionIndex: 0 },
        wealth: { stockWallet: 5000, netWorth: 55000, assets: [], day: 1, invested: 0, totalReturn: 0 },
    },
};

let gameState = {};
let currentActiveGame = null;

// Simulated Leaderboard Data (Public data simulation)
const LEADERBOARD_DATA = [
    { rank: 1, name: 'CyberShark', score: 12500 },
    { rank: 2, name: 'NeoTrader', score: 11900 },
    { rank: 3, name: 'MatrixFlow', score: 10500 },
    { rank: 4, name: 'SynthBucks', score: 9800 },
    { rank: 5, name: 'RaptorFin', score: 8750 },
];

// --- Local Storage Functions ---
function getGameState() {
    const savedState = localStorage.getItem('fundflow_game_state');
    if (savedState) {
        return JSON.parse(savedState);
    }
    // Initialize with default state if none found
    return { ...DEFAULT_GAME_STATE };
}

function saveGameState() {
    localStorage.setItem('fundflow_game_state', JSON.stringify(gameState));
    updateUIStats();
}

function updateUIStats() {
    document.getElementById('user-xp').textContent = gameState.xp.toLocaleString();
    document.getElementById('user-coins').textContent = gameState.coins.toLocaleString();

    // Update Game Selection high scores
    Object.keys(gameState.highScores).forEach(key => {
        const scoreElement = document.getElementById(`${key.split('-')[0]}-high-score`);
        if (scoreElement) scoreElement.textContent = gameState.highScores[key].toLocaleString();
    });
}

function logout() {
    alert("Logging out and resetting game state for demo.");
    localStorage.removeItem('fundflow_game_state');
    window.location.href = 'home.html';
}

// ====================================================================
// 2. UI NAVIGATION AND VIEW MANAGEMENT
// ====================================================================

function showGameSelection() {
    // Hide all game sections
    document.querySelectorAll('.game-section').forEach(section => {
        section.classList.remove('active');
    });
    // Show selection screen
    document.getElementById('game-selection').classList.add('active');
    currentActiveGame = null;
    saveGameState(); // Save state when leaving a game
}

function selectGame(gameId) {
    // Hide all game sections
    document.querySelectorAll('.game-section').forEach(section => {
        section.classList.remove('active');
    });

    // Determine target section ID
    const targetSectionId = `${gameId}-game`;
    const targetSection = document.getElementById(targetSectionId);

    if (targetSection) {
        targetSection.classList.add('active');
        currentActiveGame = gameId;

        // Initialize specific game logic
        if (gameId === 'budget-master') {
            initBudgetMaster();
        } else if (gameId === 'trivia-race') {
            initTriviaRace();
        } else if (gameId === 'investment-sim') {
            initInvestmentSim();
        } else if (gameId === 'save-to-win') {
            initSaveToWin();
        } else if (gameId === 'fraud-detective') {
            initFraudDetective();
        } else if (gameId === 'wealth-world') {
            initWealthWorld();
        }
    } else {
        alert(`Game "${gameId}" not found. Returning to selection.`);
        showGameSelection();
    }
}

// ====================================================================
// 3. BUDGET MASTER GAME LOGIC
// ====================================================================

const BUDGET_EVENTS = [
    { title: "Rent Day", desc: "Your monthly rent is due.", choices: [
        { label: "Pay Standard Rent (-$10000)", cost: 10000, tip: "Housing is your largest expense. Budget wisely!" },
        { label: "Find cheaper place (+5000 XP)", cost: 5000, effect: { xp: 5000 }, tip: "Reducing fixed costs increases long-term savings." }
    ]},
    { title: "Unexpected Medical Bill", desc: "You have a sudden medical emergency.", choices: [
        { label: "Use Emergency Fund (if > $5000)", cost: -5000, effect: { ef: 5000 }, tip: "Emergency funds prevent debt during crises.", required: { ef: 5000 } },
        { label: "Take out Loan (-$10000 balance, -1000 XP)", cost: 10000, effect: { xp: -1000 }, tip: "High-interest debt destroys wealth." }
    ]},
    { title: "Investment Opportunity", desc: "A reliable mutual fund is open.", choices: [
        { label: "Invest $5000 (+2500 XP)", cost: 5000, effect: { savings: 5000, xp: 2500 }, tip: "Pay yourself first. Investing consistently is key." },
        { label: "Buy New Gaming PC ($3000)", cost: 3000, effect: { expenses: 3000 }, tip: "Prioritize needs over wants to reach financial goals." }
    ]}
];
let budgetData = {};

function initBudgetMaster() {
    budgetData = gameState.gameData.budget;
    if (budgetData.month === 1) {
        budgetData.balance = 50000;
        budgetData.score = 0;
        budgetData.emergencyFund = 0;
        budgetData.savings = 0;
        budgetData.expenses = 0;
    }
    renderBudgetEvent();
}

function renderBudgetEvent() {
    if (budgetData.month > 12) {
        endBudgetMaster();
        return;
    }
    const event = BUDGET_EVENTS[Math.floor(Math.random() * BUDGET_EVENTS.length)];
    document.getElementById('event-title').textContent = `${event.title} (Month ${budgetData.month})`;
    document.getElementById('event-description').textContent = event.desc;
    
    const choicesEl = document.getElementById('budget-choices');
    choicesEl.innerHTML = '';

    event.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.label;
        btn.onclick = () => handleBudgetChoice(choice);
        
        // Disable button if requirement not met
        if (choice.required && choice.required.ef && budgetData.emergencyFund < choice.required.ef) {
             btn.disabled = true;
             btn.textContent += " (Insufficient Fund)";
             btn.style.opacity = 0.5;
        }

        choicesEl.appendChild(btn);
    });

    updateBudgetUI();
}

function handleBudgetChoice(choice) {
    if (choice.cost && budgetData.balance < choice.cost) {
        showPopup('Debt Warning', 'You cannot afford this. Avoid going into negative balance!');
        return;
    }

    if (choice.required && choice.required.ef) {
        budgetData.emergencyFund -= choice.required.ef;
    }

    if (choice.cost) {
        budgetData.balance -= choice.cost;
        budgetData.expenses += choice.cost;
    }

    if (choice.effect) {
        if (choice.effect.xp) gameState.xp += choice.effect.xp;
        if (choice.effect.savings) budgetData.savings += choice.effect.savings;
        if (choice.effect.ef) budgetData.emergencyFund += choice.effect.ef;
        // In reality, this should be handled by reducing cost/increasing balance, but this keeps the logic simple
    }

    budgetData.score += 100 + (choice.cost ? Math.floor(choice.cost / 100) : 0);
    
    // Show educational tip
    showPopup(choice.title || 'Financial Lesson', choice.tip);
    
    // Advance to next month (and receive income)
    budgetData.month++;
    budgetData.balance += 50000;
    
    saveGameState();
    renderBudgetEvent();
}

function updateBudgetUI() {
    document.getElementById('budget-score').textContent = budgetData.score.toLocaleString();
    document.getElementById('budget-month').textContent = budgetData.month;
    document.getElementById('budget-balance').textContent = budgetData.balance.toLocaleString();
    document.getElementById('emergency-fund').textContent = `₹${budgetData.emergencyFund.toLocaleString()}`;
    document.getElementById('total-savings').textContent = `₹${budgetData.savings.toLocaleString()}`;
    document.getElementById('total-expenses').textContent = `₹${budgetData.expenses.toLocaleString()}`;
}

function endBudgetMaster() {
    gameState.highScores['budget-master'] = Math.max(gameState.highScores['budget-master'], budgetData.score);
    const finalMessage = `Game Over! You finished 12 months with a final score of ${budgetData.score.toLocaleString()} and a balance of ₹${budgetData.balance.toLocaleString()}.`;
    showPopup('Budget Master Complete', finalMessage);
    showGameSelection();
}

// ====================================================================
// 4. TRIVIA RACE GAME LOGIC
// ====================================================================

const TRIVIA_QUESTIONS = [
    { q: "What is compound interest?", answers: ["Interest on interest", "Flat interest rate", "Loan fee"], correct: 0, xp: 500 },
    { q: "Which asset is typically highest risk?", answers: ["Government bonds", "Blue chip stocks", "Cryptocurrency"], correct: 2, xp: 700 },
    { q: "What does ROI stand for?", answers: ["Rate of Interest", "Return on Investment", "Revenue Optimization"], correct: 1, xp: 400 }
];
let triviaData = {};

function initTriviaRace() {
    triviaData = gameState.gameData.trivia;
    if (triviaData.lives === 3) {
        triviaData.score = 0;
        triviaData.position = 0;
        triviaData.questionIndex = 0;
    }
    renderTriviaQuestion();
}

function renderTriviaQuestion() {
    if (triviaData.lives <= 0 || triviaData.position >= 10) {
        endTriviaRace();
        return;
    }
    const q = TRIVIA_QUESTIONS[triviaData.questionIndex % TRIVIA_QUESTIONS.length];
    document.getElementById('question-text').textContent = q.q;
    
    const choicesEl = document.getElementById('trivia-choices');
    choicesEl.innerHTML = '';

    q.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = answer;
        btn.onclick = () => handleTriviaAnswer(index, q.correct, q.xp);
        choicesEl.appendChild(btn);
    });

    updateTriviaUI();
}

function handleTriviaAnswer(selectedIndex, correctAnswerIndex, xpReward) {
    const isCorrect = selectedIndex === correctAnswerIndex;
    
    // Disable all buttons immediately
    document.querySelectorAll('#trivia-choices button').forEach(btn => btn.disabled = true);

    if (isCorrect) {
        showPopup('Correct!', 'You gained knowledge and advanced in the race!');
        triviaData.score += 100;
        triviaData.position += 1;
        gameState.xp += xpReward;
    } else {
        showPopup('Incorrect!', 'That\'s okay, keep learning! You lost a life.');
        triviaData.lives -= 1;
    }
    
    // Highlight choice (Cyber effect)
    document.querySelectorAll('#trivia-choices button')[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
    
    // Advance game state
    setTimeout(() => {
        triviaData.questionIndex++;
        saveGameState();
        initTriviaRace();
    }, 1500); // 1.5 second pause
}

function updateTriviaUI() {
    document.getElementById('trivia-score').textContent = triviaData.score.toLocaleString();
    document.getElementById('trivia-position').textContent = `${triviaData.position}/10`;
    document.getElementById('trivia-lives').textContent = triviaData.lives;
    
    // Update player avatar position (0% to 80%)
    const trackWidth = 80;
    const playerPosition = Math.min(triviaData.position * 8, trackWidth);
    document.getElementById('player-avatar').style.left = `${20 + playerPosition}%`;
}

function endTriviaRace() {
    gameState.highScores['trivia-race'] = Math.max(gameState.highScores['trivia-race'], triviaData.score);
    const finalMessage = triviaData.lives > 0 
        ? `Race Complete! You scored ${triviaData.score.toLocaleString()}.` 
        : `Race Over! You ran out of lives. Score: ${triviaData.score.toLocaleString()}.`;
    showPopup('Trivia Race Finished', finalMessage);
    showGameSelection();
}


// ====================================================================
// 5. WEALTH WORLD GAME LOGIC (Simplified Shop/Advance Time)
// ====================================================================

const ASSET_SHOP_ITEMS = [
    { id: 'stock_fund', name: 'Tech Index Fund', type: 'stock', price: 1000, risk: 'Medium', return: '8%' },
    { id: 'art_piece', name: 'Digital Art NFT', type: 'art', price: 5000, risk: 'High', return: '25%' },
    { id: 'car', name: 'Electric Sports Car', type: 'car', price: 20000, risk: 'Low', return: '-5%' },
    { id: 'business', name: 'AI Startup Stake', type: 'business', price: 50000, risk: 'Very High', return: '40%' },
];
let wealthData = {};

function initWealthWorld() {
    wealthData = gameState.gameData.wealth;
    if (wealthData.day === 1) {
        wealthData.stockWallet = 50000;
        wealthData.netWorth = 50000;
        wealthData.assets = [];
        wealthData.invested = 0;
        wealthData.totalReturn = 0;
    }
    renderWealthShop();
    renderWealthPortfolio();
    updateWealthUI();
}

function renderWealthShop() {
    const shopEl = document.getElementById('shop-items');
    shopEl.innerHTML = '';

    const assetCategories = {};
    ASSET_SHOP_ITEMS.forEach(item => {
        if (!assetCategories[item.type]) {
            assetCategories[item.type] = [];
        }
        assetCategories[item.type].push(item);
    });

    Object.keys(assetCategories).forEach(category => {
        const section = document.createElement('div');
        section.className = 'asset-section';
        section.innerHTML = `
            <div class="section-header" onclick="toggleSection(this)">
                <div class="section-header-content">
                    <div class="section-title">
                        <span class="category-icon">${getAssetIcon(category)}</span> 
                        ${category.toUpperCase()}
                    </div>
                    <span class="section-summary">Total Assets: ${assetCategories[category].length} items</span>
                </div>
                <span class="expand-icon">▼</span>
            </div>
            <div class="section-content">
                <div class="shop-grid" id="shop-grid-${category}"></div>
            </div>
        `;
        shopEl.appendChild(section);

        const gridEl = document.getElementById(`shop-grid-${category}`);
        assetCategories[category].forEach(item => {
            const itemEl = createShopItemCard(item);
            gridEl.appendChild(itemEl);
        });
    });
}

function createShopItemCard(item) {
    const div = document.createElement('div');
    const canAfford = wealthData.stockWallet >= item.price;
    const affordabilityClass = canAfford ? 'affordable' : 'expensive';
    
    div.className = `shop-item ${affordabilityClass}`;
    div.onclick = () => buyAsset(item.id, item.price);

    div.innerHTML = `
        <div class="shop-item-header">
            <div class="shop-item-img">
                <span class="placeholder-img">${getAssetIcon(item.type)}</span>
            </div>
            <div class="affordability-badge ${affordabilityClass}">
                ${canAfford ? '✔' : 'X'}
            </div>
        </div>
        <div class="shop-item-content">
            <h4 class="asset-name">${item.name}</h4>
            <div class="shop-item-price">
                <span class="price-amount">₹${item.price.toLocaleString()}</span>
                <span class="price-percentage">Expected Return: ${item.return}</span>
            </div>
            <p class="shop-item-description">Risk: ${item.risk} | Type: ${item.type}</p>
            <div class="buy-status ${canAfford ? 'buy-available' : 'buy-unavailable'}">
                ${canAfford ? 'Click to Buy' : 'Insufficient Funds'}
            </div>
        </div>
    `;
    return div;
}

function toggleSection(header) {
    const content = header.nextElementSibling;
    header.classList.toggle('expanded');
    content.classList.toggle('active');
}

function buyAsset(assetId, price) {
    if (wealthData.stockWallet < price) {
        showPopup('Transaction Failed', 'You do not have enough funds in your Stock Wallet to purchase this asset.');
        return;
    }
    
    const asset = ASSET_SHOP_ITEMS.find(a => a.id === assetId);
    if (!asset) return;
    
    // Execute purchase
    wealthData.stockWallet -= price;
    wealthData.assets.push({ ...asset, purchasePrice: price, currentValue: price, dayBought: wealthData.day, uniqueId: Date.now() + Math.random() });
    wealthData.invested += price;
    
    updateWealthUI();
    renderWealthShop();
    renderWealthPortfolio();
    showPopup('Asset Purchased', `Successfully bought ${asset.name} for ₹${price.toLocaleString()}`);
}

function advanceTime() {
    let marketEvent = simulateMarketEvent();
    
    wealthData.assets.forEach(asset => {
        // Simple simulation: base return + random fluctuation + market event
        const baseReturn = parseFloat(asset.return) / 100 / 30; // Monthly return converted to daily
        const fluctuation = (Math.random() - 0.5) * 0.005; // +/- 0.5% fluctuation
        
        let dailyChange = baseReturn + fluctuation;
        
        // Apply market event impact (e.g., tech event affects 'stock' asset type)
        if (marketEvent.impact === asset.type) {
            dailyChange += marketEvent.change;
        }

        asset.currentValue *= (1 + dailyChange);
    });

    wealthData.day++;
    updateWealthUI();
    renderWealthPortfolio();
    renderMarketEvents(marketEvent);
    saveGameState();
    
    if (wealthData.day > 100) {
        endWealthWorld();
    }
}

function simulateMarketEvent() {
    const events = [
        { title: 'Tech Sector Boom', desc: 'AI breakthroughs boost tech stocks.', impact: 'stock', change: 0.015, type: 'positive' },
        { title: 'New Luxury Tax', desc: 'Government imposes high tax on luxury goods.', impact: 'car', change: -0.02, type: 'negative' },
        { title: 'Art Market Collapse', desc: 'NFT bubble bursts.', impact: 'art', change: -0.04, type: 'negative' },
        { title: 'Stable Day', desc: 'Market holds steady.', impact: 'none', change: 0, type: 'neutral' },
    ];
    return events[Math.floor(Math.random() * events.length)];
}

function renderMarketEvents(event) {
    const logEl = document.getElementById('market-events-log');
    const item = document.createElement('div');
    item.className = `event-item ${event.type}`;
    
    item.innerHTML = `
        <div class="event-title">${event.title} (Day ${wealthData.day})</div>
        <p class="event-description">${event.desc}</p>
    `;
    
    // Prepend the newest event
    logEl.prepend(item);
}

function renderWealthPortfolio() {
    const portfolioEl = document.getElementById('portfolio-items');
    portfolioEl.innerHTML = '';

    if (wealthData.assets.length === 0) {
        portfolioEl.innerHTML = `<p style="color:rgba(224, 224, 224, 0.8); text-align:center;">You have no assets. Buy something from the Asset Shop!</p>`;
        return;
    }

    wealthData.assets.forEach(asset => {
        const profit = asset.currentValue - asset.purchasePrice;
        const percentChange = (profit / asset.purchasePrice) * 100;
        const statusClass = profit >= 0 ? 'profitable' : 'loss';
        const changeClass = profit >= 0 ? 'positive' : 'negative';
        const changeArrow = profit >= 0 ? '▲' : '▼';
        
        const div = document.createElement('div');
        div.className = `portfolio-item ${statusClass}`;
        
        div.innerHTML = `
            <div class="asset-type-indicator ${asset.type}" style="right: 15px; top: 15px;"></div>
            <span class="portfolio-item-icon">${getAssetIcon(asset.type)}</span>
            <h4>${asset.name}</h4>
            <div class="portfolio-item-value">₹${asset.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div class="portfolio-item-change ${changeClass}">
                ${changeArrow} ${Math.abs(percentChange).toFixed(2)}% (${profit >= 0 ? '+' : '-'}₹${Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })})
            </div>
            
            <div class="portfolio-item-actions">
                <button class="portfolio-btn sell" onclick="sellAsset(${asset.uniqueId})">Sell</button>
            </div>
        `;
        portfolioEl.appendChild(div);
    });
}

function sellAsset(uniqueId) {
    const index = wealthData.assets.findIndex(a => a.uniqueId === uniqueId);
    if (index === -1) return;

    const asset = wealthData.assets[index];
    wealthData.stockWallet += asset.currentValue;
    wealthData.assets.splice(index, 1);
    
    const profit = asset.currentValue - asset.purchasePrice;
    
    // Update total net worth for score tracking
    gameState.gameData.wealth.netWorth += profit;
    
    showPopup('Sold Asset', `Sold ${asset.name} for ₹${asset.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}. Profit: ₹${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    
    updateWealthUI();
    renderWealthPortfolio();
    saveGameState();
}

function endWealthWorld() {
    const finalNetWorth = wealthData.stockWallet + wealthData.assets.reduce((sum, a) => sum + a.currentValue, 0);
    gameState.highScores['wealth-world'] = Math.max(gameState.highScores['wealth-world'], finalNetWorth);
    const finalMessage = `Game Over (100 Days)! Your final Net Worth is ₹${finalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`;
    showPopup('Wealth World Complete', finalMessage);
    showGameSelection();
}

function updateWealthUI() {
    const currentNetWorth = wealthData.stockWallet + wealthData.assets.reduce((sum, a) => sum + a.currentValue, 0);
    
    document.getElementById('stock-wallet-balance').textContent = wealthData.stockWallet.toLocaleString(undefined, { maximumFractionDigits: 0 });
    document.getElementById('wealth-net-worth').textContent = currentNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 });
    document.getElementById('wealth-assets-count').textContent = wealthData.assets.length;
    document.getElementById('wealth-day').textContent = wealthData.day;
}

function getAssetIcon(type) {
    switch (type) {
        case 'stock': return '📊';
        case 'art': return '🖼️';
        case 'car': return '🚗';
        case 'business': return '🏢';
        default: return '💰';
    }
}

// ====================================================================
// 6. MODAL/POPUP LOGIC
// ====================================================================

function showPopup(title, content) {
    document.getElementById('popup-title').textContent = title;
    document.getElementById('popup-content').textContent = content;
    document.getElementById('educational-popup').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePopup() {
    document.getElementById('educational-popup').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showMarketAnalysis() {
    const modal = document.getElementById('market-analysis-modal');
    const dataEl = document.getElementById('market-analysis-data');
    dataEl.innerHTML = '';
    
    // --- Sample Analysis Data ---
    const analysis = [
        { label: "Day Count", value: wealthData.day, type: 'neutral' },
        { label: "Total Invested", value: `₹${wealthData.invested.toLocaleString()}`, type: 'neutral' },
        { label: "Wallet Liquidity", value: `₹${wealthData.stockWallet.toLocaleString()}`, type: 'neutral' },
    ];
    
    let returnRate = 0;
    if (wealthData.invested > 0) {
        const currentNetWorth = wealthData.stockWallet + wealthData.assets.reduce((sum, a) => sum + a.currentValue, 0);
        returnRate = (currentNetWorth - DEFAULT_GAME_STATE.gameData.wealth.netWorth) / DEFAULT_GAME_STATE.gameData.wealth.netWorth * 100;
    }
    
    analysis.push({ 
        label: "Overall Return (%)", 
        value: `${returnRate.toFixed(2)}%`, 
        type: returnRate >= 0 ? 'positive' : 'negative' 
    });
    
    // --- Render ---
    let html = '<div class="analysis-section"><h4>Portfolio Metrics</h4>';
    analysis.forEach(item => {
        html += `
            <div class="analysis-item">
                <span class="analysis-label">${item.label}</span>
                <span class="analysis-value ${item.type}">${item.value}</span>
            </div>
        `;
    });
    html += '</div>';

    dataEl.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMarketAnalysis() {
    document.getElementById('market-analysis-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ====================================================================
// 7. DAILY CHALLENGES & LEADERBOARD (Static/Dummy)
// ====================================================================

function populateDailyChallenges() {
    const challenges = [
        { title: 'Save 10% Income', desc: 'Successfully allocate 10% of monthly income to savings.', reward: 500, status: 'Incomplete' },
        { title: 'Trivia Master', desc: 'Answer 5 trivia questions correctly in a row.', reward: 1000, status: 'Incomplete' },
        { title: 'Detect 3 Scams', desc: 'Successfully identify 3 financial fraud attempts.', reward: 750, status: 'Incomplete' },
    ];
    const listEl = document.getElementById('challenges-list');
    listEl.innerHTML = '';

    challenges.forEach(challenge => {
        const item = document.createElement('div');
        item.className = 'challenge-item';
        item.innerHTML = `
            <h4>${challenge.title}</h4>
            <p>${challenge.desc}</p>
            <div class="challenge-reward">
                <span class="xp-icon">⭐</span> ${challenge.reward} XP
            </div>
        `;
        listEl.appendChild(item);
    });
}

function populateLeaderboard() {
    const listEl = document.getElementById('leaderboard');
    listEl.innerHTML = '';

    // Sort by score and assign rank based on position in array
    const sortedLeaderboard = [...LEADERBOARD_DATA, { rank: 0, name: gameState.username, score: gameState.xp }].sort((a, b) => b.score - a.score);

    // Re-rank and render
    sortedLeaderboard.forEach((player, index) => {
        const rank = index + 1;
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        // Highlight current player
        if (player.name === gameState.username) {
             item.style.borderLeftColor = 'var(--cyber-pink)';
             item.style.background = 'rgba(179, 0, 255, 0.1)';
        }

        item.innerHTML = `
            <span class="leaderboard-rank">${rank}</span>
            <span class="leaderboard-name">${player.name}</span>
            <span class="leaderboard-score">${player.score.toLocaleString()} XP</span>
        `;
        listEl.appendChild(item);

        // Limit to top 10 display
        if (rank >= 10) return;
    });
}


// ====================================================================
// 8. INITIALIZATION
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load state
    gameState = getGameState();
    
    // 2. Set default username if not set (for clean UI)
    if (!gameState.username || gameState.username === DEFAULT_GAME_STATE.username) {
        // Simple way to simulate unique users in a local demo
        gameState.username = 'User_' + Math.floor(Math.random() * 1000);
    }

    // 3. Update top navbar
    updateUIStats();
    
    // 4. Populate static sections
    populateDailyChallenges();
    populateLeaderboard();
    
    // 5. Check URL for direct game launch (optional: for external linking)
    const params = new URLSearchParams(window.location.search);
    const initialGame = params.get('game');
    if (initialGame) {
        selectGame(initialGame);
    } else {
        showGameSelection();
    }
    
    // Expose necessary global functions
    window.selectGame = selectGame;
    window.showGameSelection = showGameSelection;
    window.handleBudgetChoice = handleBudgetChoice;
    window.handleTriviaAnswer = handleTriviaAnswer;
    window.closePopup = closePopup;
    window.logout = logout;
    
    // Wealth World functions
    window.advanceTime = advanceTime;
    window.sellAsset = sellAsset;
    window.closeMarketAnalysis = closeMarketAnalysis;
    window.showMarketAnalysis = showMarketAnalysis;
    
});