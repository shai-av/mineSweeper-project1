'use strict'
const MINE = '💣';

var gBoardLastInstance;
var gGameLastInstance;
var gClock = document.querySelector('.clock');
var gclockInterval;
var gLevel = { size: 4, mines: 2 };
var gIsFirstClick;
var gBoard;

var gGame = {
    isGameOn: false,
    lives: 3,
    markedCount: 0
};

function init() {

    gBoard = createBoard();
    console.table(gBoard);
    renderBoard(gBoard);
    if (gclockInterval) stopClock();
    setNewGameValues();

}

function setNewGameValues() {
    gGame = {
        isGameOn: false,
        lives: 3,
    };
    gIsFirstClick = true;
    gGame.markedCount = gLevel.mines;
    updateMarked();
    updateLives();
    gBoardLastInstance = null;
    gGameLastInstance = null;
}

function createBoard() {
    var board = [];
    var row = [];
    for (var i = 0; i < gLevel.size; i++) {
        row = [];
        for (var j = 0; j < gLevel.size; j++) {
            row[j] = {
                isShown: false,
                isMine: false,
                isMarked: false,
                minesAroundCount: 0
            }
        }
        board.push(row);
    }
    return board;
}

function renderBoard(board) {
    var strHTML = '<table oncontextmenu="return false;"><tbody>';

    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';

        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            var className = 'cell ';
            var spanClassName = '';
            var cellText = ''
            if (cell.isMine) className += 'mine ', cellText = MINE;
            else if (cell.minesAroundCount > 0) spanClassName += `nextToMine${cell.minesAroundCount} `, cellText = cell.minesAroundCount;
            if (!cell.isShown) className += 'cover ';
            if (gBoard[i][j].isMarked) className += 'marked ';
            strHTML += `<td data-i="${i}" data-j="${j}"
              oncontextmenu="mouseRightClick(this,${i},${j})"
              onclick="cellClicked(this,${i} ,${j})"
              style="width:${100 / gLevel.size}% ;height:${100 / gLevel.size}%" 
              class="${className}" ><span class="${spanClassName}">${cellText}<span></td>`;
        }

        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>'

    var elBoard = document.querySelector('.board-container');
    elBoard.innerHTML = strHTML;

}

function createMines(firstClick_I, firstClick_J) {
    for (var i = 0; i < gLevel.mines; i++) {
        var location = getRandomLocation(firstClick_I, firstClick_J);
        gBoard[location.i][location.j].isMine = true;
    }
}

function getRandomLocation(Xi, Xj) {
    var i = Math.floor(Math.random() * gLevel.size);
    var j = Math.floor(Math.random() * gLevel.size);

    if (i === Xi && j === Xj) getRandomLocation(i, j)
    else {
        console.log({ i, j });
    } return { i, j };
}

function countMinesAround(cellI, cellJ) {
    var minesCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= gBoard[i].length) continue;

            if (gBoard[i][j].isMine) minesCount++;
        }
    }
    return minesCount;
}

function runMinesAroundCount(board) {
    var minesAround;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            minesAround = countMinesAround(i, j);
            board[i][j].minesAroundCount = minesAround;
        }
    }
}

function cellClicked(cell, i, j) {
    if (!gGame.isGameOn && !gIsFirstClick) return;
    if (gBoard[i][j].isMarked) return;
    if (gBoard[i][j].isShown) return;
    saveLastInstance();
    gBoard[i][j].isShown = true;
    if (gIsFirstClick) onFirstClick(i, j);
    cell.classList.remove('cover');
    if (isCellEmpty(i, j)) emptyCellClick(i, j);
    else if (isCellMine(i, j)) mineCellClick();
    if (isGameOver()) endGame();
}

function onFirstClick(i, j) {
    createMines(i, j);
    gIsFirstClick = false;
    gGame.isGameOn = true;
    runMinesAroundCount(gBoard);
    renderBoard(gBoard);
    startClock();
}

function mouseRightClick(cell, i, j) {
    if (!gGame.isGameOn) return;
    if (gIsFirstClick) return;
    if (gBoard[i][j].isShown) return;
    saveLastInstance();
    if (gBoard[i][j].isMarked) {
        gBoard[i][j].isMarked = false;
        cell.classList.remove('marked');
        gGame.markedCount++;
        updateMarked();
    } else if (gGame.markedCount > 0) {
        gBoard[i][j].isMarked = true;
        cell.classList.add('marked');
        gGame.markedCount--;
        updateMarked();
    }
}

function updateMarked() {
    document.querySelector('.markLeft').innerText = gGame.markedCount;
}

function emptyCellClick(cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= gBoard[i].length) continue;

            if (isCellEmpty(i, j) && !gBoard[i][j].isShown) {
                gBoard[i][j].isShown = true;
                emptyCellClick(i, j);
            } else if (!gBoard[i][j].isShown && gBoard[i][j].minesAroundCount > 0) {
                gBoard[i][j].isShown = true;
            }
        }
    }
    renderBoard(gBoard);
}

function mineCellClick() {
    gGame.lives--;
    updateLives();
}

function isCellEmpty(i, j) {
    return gBoard[i][j].minesAroundCount === 0 && !gBoard[i][j].isMine;
}

function isCellMine(i, j) {
    return gBoard[i][j].isMine;
}

function isGameOver() {
    if (gGame.lives === 0) return true;
    var cellsToWinCount = gLevel.size ** 2 - gLevel.mines;
    var cellsCleared = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (!gBoard[i][j].isMine && (gBoard[i][j].isShown || gBoard[i][j].isMarked)) cellsCleared++;
        }
    }
    if (cellsToWinCount === cellsCleared) return true;
    return false;
}
function endGame() {
    gGame.isGameOn = false;
    stopClock();
    console.log('GAME OVER');
}

function difficulty(level) {
    switch (level) {
        case 'easy':
            gLevel.size = 4;
            gLevel.mines = 2;
            break;
        case 'medium':
            gLevel.size = 8;
            gLevel.mines = 12;
            break;
        case 'hard':
            gLevel.size = 12;
            gLevel.mines = 30;
            break;
    }
    init();
}

function updateLives() {
    var life = '🖤'
    var strHTML = ''
    for (var i = 0; i < gGame.lives; i++) {
        strHTML += life;
    }
    if (gGame.lives === 0) strHTML = ' 💀💀💀'
    document.querySelector('.lives').innerText = strHTML;
}

function startClock() {
    var startingTime = new Date;
    gclockInterval = setInterval(function () {
        var currentTime = new Date;
        gClock.innerText = parseInt((currentTime - startingTime) / 1000);
    }, 1000 * 1);
}

function stopClock() {
    if (gclockInterval) {
        clearInterval(gclockInterval);
        gClock.innerText = '0';
    }
}

function saveLastInstance() {
    if (!gGame.isGameOn) return;
    if (gIsFirstClick) return;

    gBoardLastInstance = copy_2d_Array(gBoard);
    gGameLastInstance = gGame;
}

function undo() {
    if (!gGame.isGameOn) return;
    if (gIsFirstClick) return;
    // if(!gGame.gBoardLastInstance)return;
    gBoard = gBoardLastInstance;
    gGame = gGameLastInstance;
    renderBoard(gBoard);
}

function copy_2d_Array(arr) {
    var newArray = [];
    for (var i = 0; i < arr.length; i++) {
        var subArray = [];
        for (var j = 0; j < arr[i].length; j++) {
            var obj = JSON.parse(JSON.stringify(arr[i][j]));
            subArray.push(obj);
        }
        newArray.push(subArray);
    }
    return newArray;
}