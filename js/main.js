'use strict'
const MINE = '💣';

var gClock = document.querySelector('.clock');
var gClockInterval;
var gIsFirstClick;
var gBoard;
var gLevel;
var gGame;
var gLevel = { size: 4, mines: 2, difficulty: 'easy' };
var gGame = {
    isGameOn: false,
    lives: 3,
    hints: 3,
    markedCount: 0
};

function init() {
    if (!gIsManualMode) gBoard = createBoard();
    renderBoard(gBoard);
    if (gClockInterval) stopClock();
    setNewGameValues();
    updateBestScoreFromLocalStorage();
}

function setNewGameValues() {
    gGame.isGameOn = false;
    gGame.lives = 3;
    gGame.hints = 3;
    gGame.safeClicks = 3;

    gIsFirstClick = true;
    console.log(gGame.markedCount);
    if (!gIsManualMode) gGame.markedCount = 0;
    renderBy_gGame();
    resetStepsBackup();
    document.querySelector('.smile').innerText = '😄';
    gClock.innerText = '0';
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
            ///
            var spanClassName = '';
            var cellText = '';
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
    strHTML += '</tbody></table>';

    var elBoard = document.querySelector('.board-container');
    elBoard.innerHTML = strHTML;
}

function createMines(firstClick_I, firstClick_J) {
    if (gIs7BoomMode) {
        setMines7Boom(gBoard);
    } else {
        for (var i = 0; i < gLevel.mines; i++) {
            var location = getMineRandomLocation(firstClick_I, firstClick_J);
            gBoard[location.i][location.j].isMine = true;
            gGame.markedCount++;

        }
    }
    updateMarked();
}

function getMineRandomLocation(Xi, Xj) {
    var i = Xi;
    var j = Xj;

    while (gBoard[i][j].isMine || (i === Xi && j === Xj)) {
        var i = Math.floor(Math.random() * gLevel.size);
        var j = Math.floor(Math.random() * gLevel.size);
    }
    return { i, j };
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
    if (gIsHintMode) {
        hint(i, j);
        return;
    }
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
    if (!gIsManualMode) {
        createMines(i, j);
    } else {
        gIsManualMode = false;
    }
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
    if (isGameOver()) endGame('win');
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
    if (!gGame.lives === 0) {
        document.querySelector('.smile').innerText = '😖';
        setTimeout(function () {
            document.querySelector('.smile').innerText = '😄';
        }, 750);
    }
}

function isCellEmpty(i, j) {
    return gBoard[i][j].minesAroundCount === 0 && !gBoard[i][j].isMine;
}

function isCellMine(i, j) {
    return gBoard[i][j].isMine;
}

function isGameOver() {
    if (gGame.lives === 0) return true;
    var cellsToWinCount = gLevel.size ** 2;
    var minesCleared = 0;
    var cellsCleared = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isShown && !gBoard[i][j].isMine) cellsCleared++;
            if (gBoard[i][j].isMine && (gBoard[i][j].isMarked || gBoard[i][j].isShown)) minesCleared++;
        }
    }
    if (cellsToWinCount === cellsCleared + minesCleared) return true;
    return false;
}

function endGame() {
    gGame.isGameOn = false;
    stopClock();
    if (gGame.lives === 0) {
        var mines = document.querySelectorAll('.mine');
        for (var i = 0; i < mines.length; i++) {
            if (!mines[i].isMarked) {
                mines[i].classList.remove('cover');
            }
        }
        document.querySelector('.smile').innerText = '😵';
        console.log('GAME OVER');
    } else {
        document.querySelector('.smile').innerText = '😎';
        var score = +gClock.innerText;
        var difficulty = gLevel.difficulty;

        updateScoreIfHigher(difficulty, score);
        console.log('you WON !');
    }
}

function difficulty(level) {
    switch (level) {
        case 'easy':
            gLevel.size = 4;
            gLevel.mines = 2;
            gLevel.difficulty = 'easy';
            break;
        case 'medium':
            gLevel.size = 8;
            gLevel.mines = 12;
            gLevel.difficulty = 'medium';
            break;
        case 'hard':
            gLevel.size = 12;
            gLevel.mines = 30;
            gLevel.difficulty = 'hard';
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
    gClockInterval = setInterval(function () {
        var currentTime = new Date;
        gClock.innerText = parseInt((currentTime - startingTime) / 1000);
    }, 1000 * 1);
}

function stopClock() {
    if (gClockInterval) {
        clearInterval(gClockInterval);
    }
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

function renderBy_gGame() {
    updateLives();
    updateMarked();
    updateHints();
    updateSafeClicks();
}

function resetStepsBackup() {
    gCurrStep = 0;
    gSteps = [];
    gBoardLastInstance = null;
    gGameLastInstance = null;
}