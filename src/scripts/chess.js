document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        chessboard.appendChild(square);
    }
});