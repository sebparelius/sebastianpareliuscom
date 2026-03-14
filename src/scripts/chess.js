document.addEventListener('DOMContentLoaded', () => {
    const GLYPHS = {
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };

    const INITIAL = [
        'r','n','b','q','k','b','n','r',
        'p','p','p','p','p','p','p','p',
        null,null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,null,
        'P','P','P','P','P','P','P','P',
        'R','N','B','Q','K','B','N','R'
    ];

    let board = [];
    let selected = null;
    let validMoves = [];
    let currentTurn = 'white';
    let gameOver = false;

    function initBoard() {
        board = [...INITIAL];
        selected = null;
        validMoves = [];
        currentTurn = 'white';
        gameOver = false;
    }

    const isWhite = p => p && p === p.toUpperCase();
    const isBlack = p => p && p === p.toLowerCase();
    const isEnemy = (piece, p) => isWhite(piece) ? isBlack(p) : isWhite(p);
    const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const idx = (r, c) => r * 8 + c;

    function getValidMoves(fromIdx) {
        const piece = board[fromIdx];
        if (!piece) return [];

        const white = isWhite(piece);
        const row = Math.floor(fromIdx / 8);
        const col = fromIdx % 8;
        const moves = [];
        const type = piece.toUpperCase();

        const canLand = (r, c) => {
            if (!inBounds(r, c)) return false;
            const t = board[idx(r, c)];
            return !t || isEnemy(piece, t);
        };

        const slide = (dr, dc) => {
            let r = row + dr, c = col + dc;
            while (inBounds(r, c)) {
                const t = board[idx(r, c)];
                if (t) {
                    if (isEnemy(piece, t)) moves.push(idx(r, c));
                    break;
                }
                moves.push(idx(r, c));
                r += dr; c += dc;
            }
        };

        switch (type) {
            case 'P': {
                const dir = white ? -1 : 1;
                const startRow = white ? 6 : 1;
                const nr = row + dir;
                // Forward
                if (inBounds(nr, col) && !board[idx(nr, col)]) {
                    moves.push(idx(nr, col));
                    if (row === startRow && !board[idx(nr + dir, col)]) {
                        moves.push(idx(nr + dir, col));
                    }
                }
                // Diagonal captures
                [-1, 1].forEach(dc => {
                    const nc = col + dc;
                    if (inBounds(nr, nc)) {
                        const t = board[idx(nr, nc)];
                        if (t && isEnemy(piece, t)) moves.push(idx(nr, nc));
                    }
                });
                break;
            }
            case 'R':
                slide(-1, 0); slide(1, 0); slide(0, -1); slide(0, 1);
                break;
            case 'B':
                slide(-1, -1); slide(-1, 1); slide(1, -1); slide(1, 1);
                break;
            case 'Q':
                slide(-1, 0); slide(1, 0); slide(0, -1); slide(0, 1);
                slide(-1, -1); slide(-1, 1); slide(1, -1); slide(1, 1);
                break;
            case 'N':
                [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
                    .forEach(([dr, dc]) => {
                        if (canLand(row + dr, col + dc)) moves.push(idx(row + dr, col + dc));
                    });
                break;
            case 'K':
                [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
                    .forEach(([dr, dc]) => {
                        if (canLand(row + dr, col + dc)) moves.push(idx(row + dr, col + dc));
                    });
                break;
        }

        return moves;
    }

    function makeMove(fromIdx, toIdx) {
        const captured = board[toIdx];
        board[toIdx] = board[fromIdx];
        board[fromIdx] = null;

        // Pawn promotion to queen
        if (board[toIdx] === 'P' && Math.floor(toIdx / 8) === 0) board[toIdx] = 'Q';
        if (board[toIdx] === 'p' && Math.floor(toIdx / 8) === 7) board[toIdx] = 'q';

        if (captured === 'K' || captured === 'k') {
            gameOver = true;
        } else {
            currentTurn = currentTurn === 'white' ? 'black' : 'white';
        }
    }

    function render() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';

        for (let i = 0; i < 64; i++) {
            const r = Math.floor(i / 8), c = i % 8;
            const square = document.createElement('div');
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.idx = i;

            if (selected === i) square.classList.add('selected');
            if (validMoves.includes(i)) {
                square.classList.add(board[i] ? 'valid-capture' : 'valid-move');
            }

            if (board[i]) {
                const piece = document.createElement('span');
                piece.className = 'piece';
                piece.textContent = GLYPHS[board[i]];
                square.appendChild(piece);
            }

            square.addEventListener('click', handleClick);
            chessboard.appendChild(square);
        }

        const statusEl = document.getElementById('status');
        const turnDot = document.getElementById('turn-dot');
        const turnLabel = document.getElementById('turn-label');

        if (gameOver) {
            const winner = currentTurn === 'white' ? 'Black' : 'White';
            statusEl.textContent = `${winner} wins!`;
            turnDot.className = 'turn-dot';
            turnLabel.textContent = 'Game over';
        } else {
            statusEl.textContent = '';
            turnDot.className = `turn-dot ${currentTurn}`;
            turnLabel.textContent = `${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)} to move`;
        }
    }

    function handleClick(e) {
        if (gameOver) return;
        const i = parseInt(e.currentTarget.dataset.idx);
        const piece = board[i];

        if (selected !== null && validMoves.includes(i)) {
            makeMove(selected, i);
            selected = null;
            validMoves = [];
            render();
            return;
        }

        const isCurrentPlayer = currentTurn === 'white' ? isWhite(piece) : isBlack(piece);
        if (piece && isCurrentPlayer) {
            if (selected === i) {
                selected = null;
                validMoves = [];
            } else {
                selected = i;
                validMoves = getValidMoves(i);
            }
        } else {
            selected = null;
            validMoves = [];
        }

        render();
    }

    document.getElementById('new-game').addEventListener('click', () => {
        initBoard();
        render();
    });

    initBoard();
    render();
});
