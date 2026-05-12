/**
 * FARZOON BOT - MINI GAMES
 * X/O (Tic-Tac-Toe) Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const gameOverlay = document.getElementById('game-overlay');
    const closeGameBtn = document.getElementById('close-game-btn');
    const gameSelection = document.getElementById('game-selection');
    const gameBoardArea = document.getElementById('game-board-area');
    const gameStatus = document.getElementById('game-status');
    const cells = document.querySelectorAll('.cell');
    const restartBtn = document.getElementById('restart-game-btn');
    
    // Buttons
    const selectXBtn = document.getElementById('select-x');
    const selectOBtn = document.getElementById('select-o');

    // Game State
    let board = Array(9).fill(null);
    let playerMark = 'X';
    let botMark = 'O';
    let isGameOver = false;
    let isPlayerTurn = true;

    // --- Farzon Personality Reactions ---
    const reactions = {
        botWin: [
            "ههه فرزون كسبك 😏",
            "خسرت تاني قدام فرزون 👀",
            "شكلها مش ليلتك 😭",
            "المرة دي ليا 🔥",
            "فرزون سابق بخطوة دايمًا 😌",
            "كنت قريب بس فرزون أذكى 😏"
        ],
        userWin: [
            "اوووف دي جات عليا 😭",
            "استنى الريماتش 😏",
            "الحركة دي مش هتتكرر 👀",
            "كسبت المرة دي بس 😤",
            "واضح إنك مركز النهاردة 🔥"
        ],
        draw: [
            "تعادل محترم 😌",
            "لا أنا كسبت ولا انت 😏",
            "احنا الاتنين جامدين بصراحة 👀",
            "دي كانت قريبة اوي 😭"
        ]
    };

    function getRandomGameReaction(type) {
        const list = reactions[type];
        if (!list) return "";
        return list[Math.floor(Math.random() * list.length)];
    }

    // --- Core Logic ---
    function initGame(mark) {
        playerMark = mark;
        botMark = mark === 'X' ? 'O' : 'X';
        isPlayerTurn = playerMark === 'X'; // X always goes first
        
        board = Array(9).fill(null);
        isGameOver = false;
        
        // Reset UI
        cells.forEach(cell => {
            cell.innerText = '';
            cell.className = 'cell';
        });
        
        gameSelection.classList.add('hidden');
        gameBoardArea.classList.remove('hidden');
        restartBtn.classList.add('hidden');
        
        if (isPlayerTurn) {
            gameStatus.innerText = 'دورك يا فرزاوي! 😎';
        } else {
            gameStatus.innerText = 'دوري... بفكّر 🤔';
            setTimeout(botPlay, 600);
        }
    }

    function handleCellClick(e) {
        if (!isPlayerTurn || isGameOver) return;
        
        const index = e.target.getAttribute('data-index');
        if (board[index] !== null) return;
        
        // Player move
        makeMove(index, playerMark);
        
        if (!checkWinner() && !isBoardFull()) {
            isPlayerTurn = false;
            gameStatus.innerText = 'دوري... بفكّر 🤔';
            setTimeout(botPlay, 600); // Natural delay
        }
    }

    function makeMove(index, mark) {
        board[index] = mark;
        cells[index].innerText = mark;
        cells[index].classList.add(mark.toLowerCase());
    }

    function botPlay() {
        if (isGameOver) return;
        
        const bestMove = getBestMove();
        makeMove(bestMove, botMark);
        
        if (!checkWinner() && !isBoardFull()) {
            isPlayerTurn = true;
            gameStatus.innerText = 'دورك يا فرزاوي! 😎';
        }
    }

    // --- Lightweight AI (Rule-based) ---
    function getBestMove() {
        // 1. Can Bot Win?
        const winMove = findWinningMove(botMark);
        if (winMove !== -1) return winMove;
        
        // 2. Can Player Win? (Block them)
        const blockMove = findWinningMove(playerMark);
        if (blockMove !== -1) return blockMove;
        
        // 3. Take Center
        if (board[4] === null) return 4;
        
        // 4. Take Opposite Corner
        const corners = [0, 2, 6, 8];
        const oppCorners = [[0, 8], [2, 6], [6, 2], [8, 0]];
        for (let [c1, c2] of oppCorners) {
            if (board[c1] === playerMark && board[c2] === null) return c2;
        }
        
        // 5. Take Any Empty Corner
        for (let i of corners) {
            if (board[i] === null) return i;
        }
        
        // 6. Take Any Empty Side
        const sides = [1, 3, 5, 7];
        for (let i of sides) {
            if (board[i] === null) return i;
        }
        
        // Fallback
        return board.indexOf(null);
    }

    function findWinningMove(mark) {
        const winCombos = [
            [0,1,2], [3,4,5], [6,7,8], // Rows
            [0,3,6], [1,4,7], [2,5,8], // Cols
            [0,4,8], [2,4,6]           // Diagonals
        ];
        
        for (let combo of winCombos) {
            const [a, b, c] = combo;
            if (board[a] === mark && board[b] === mark && board[c] === null) return c;
            if (board[a] === mark && board[c] === mark && board[b] === null) return b;
            if (board[b] === mark && board[c] === mark && board[a] === null) return a;
        }
        return -1;
    }

    // --- Game End Checks ---
    function checkWinner() {
        const winCombos = [
            [0,1,2], [3,4,5], [6,7,8], 
            [0,3,6], [1,4,7], [2,5,8], 
            [0,4,8], [2,4,6]           
        ];
        
        for (let combo of winCombos) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                isGameOver = true;
                highlightWin(combo);
                
                // Track game completion for achievements
                if (typeof Achievements !== 'undefined') {
                    const result = board[a] === playerMark ? 'win' : 'loss';
                    Achievements.track('game', { result });
                }
                
                if (board[a] === playerMark) {
                    gameStatus.innerText = getRandomGameReaction('userWin');
                } else {
                    gameStatus.innerText = getRandomGameReaction('botWin');
                }
                restartBtn.classList.remove('hidden');
                return true;
            }
        }
        return false;
    }

    function isBoardFull() {
        if (!board.includes(null) && !isGameOver) {
            isGameOver = true;
            // Track game completion for achievements
            if (typeof Achievements !== 'undefined') {
                Achievements.track('game', { result: 'draw' });
            }
            gameStatus.innerText = getRandomGameReaction('draw');
            restartBtn.classList.remove('hidden');
            return true;
        }
        return false;
    }

    function highlightWin(combo) {
        combo.forEach(index => {
            cells[index].classList.add('win');
        });
    }

    // --- Global Hooks ---
    window.openGameOverlay = function() {
        gameOverlay.classList.add('active');
        // Show selection screen
        gameSelection.classList.remove('hidden');
        gameBoardArea.classList.add('hidden');
    }
    
    function closeGameOverlay() {
        gameOverlay.classList.remove('active');
    }

    // --- Event Listeners ---
    selectXBtn.addEventListener('click', () => initGame('X'));
    selectOBtn.addEventListener('click', () => initGame('O'));
    
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    restartBtn.addEventListener('click', () => {
        gameSelection.classList.remove('hidden');
        gameBoardArea.classList.add('hidden');
    });

    closeGameBtn.addEventListener('click', closeGameOverlay);
});
