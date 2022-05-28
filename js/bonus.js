'use strict'

//undo globals
var gCurrStep;
var gSteps = [];
var gBoardLastInstance;
var gGameLastInstance;

//hint globals
var gIsHintMode = false;

//7Boom! globals
var gIs7BoomMode = false;

//manual globals
var gIsManualMode = false;

/// undo
function saveLastInstance() {
    if (gIsFirstClick) return;
    gBoardLastInstance = copy_2d_Array(gBoard);
    gGameLastInstance = JSON.parse(JSON.stringify(gGame));
    gSteps[gCurrStep] = ({
        board: gBoardLastInstance,
        game: gGameLastInstance
    });
    gCurrStep++;
}

function undo() {
    if (!gGame.isGameOn) return;
    if (gCurrStep <= 0) return;
    if(gIsManualMode) return;
    gBoard = gSteps[gCurrStep - 1].board;
    gGame = gSteps[gCurrStep - 1].game;
    if (gCurrStep - 1 > 0) gSteps.pop();
    gCurrStep--;

    renderBoard(gBoard);
    renderBy_gGame();
}

///hint
function hintBtnClick() {
    if (!gGame.isGameOn) return;
    if (gGame.hints === 0) return;
    saveLastInstance();
    gIsHintMode = true;
    document.querySelector('.main').classList.add('hint');
}

function hint(i, j) {
    var cellsAround = getAvailLctnsArnd(i, j);
    for (var i = 0; i < cellsAround.length; i++) {
        var cell = getCell(cellsAround[i].i, cellsAround[i].j);
        if (cell.classList.contains('cover')) {
            cell.classList.remove('cover');
            setTimeout(addCover, 1000 * 2, cell);
        }
    }
    gIsHintMode = false;
    gGame.hints--;
    updateHints();
    document.querySelector('.main').classList.remove('hint');
}

function updateHints() {
    document.querySelector('.hintLeftTxt').innerText = gGame.hints;
}

function getAvailLctnsArnd(cellI, cellJ) {
    var cells = [];
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;

            cells.push({ i, j });
        }
    }
    return cells
}

function getCell(i, j) {
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
    return elCell
}

function addCover(cell) {
    cell.classList.add('cover');
}

///safe-click
function updateSafeClicks() {
    document.querySelector('.safeClicksLeftTxt').innerText = gGame.safeClicks;
}

function safeBtnClick() {
    if (!gGame.isGameOn) return;
    if (gGame.safeClicks === 0) return;
    saveLastInstance();
    safeClick();
    gGame.safeClicks--;
    updateSafeClicks();
}

function safeClick() {
    var cellLocation = getSafeClickRandomLocation();
    if (!cellLocation) return;
    var cell = getCell(cellLocation.i, cellLocation.j);

    cell.style.borderColor = "whitesmoke";
    setTimeout(function () {
        cell.style.borderColor = "black";
    }, 500);
    setTimeout(function () {
        cell.style.borderColor = "white";
    }, 500 * 2);
    setTimeout(function () {
        cell.style.borderColor = "black";
    }, 500 * 3);
}

function getSafeClickRandomLocation() {
    var i = Math.floor(Math.random() * gLevel.size);
    var j = Math.floor(Math.random() * gLevel.size);

    for (var k = 0; (gBoard[i][j].isMine || gBoard[i][j].isShown) && k < 1000; k++) {
        i = Math.floor(Math.random() * gLevel.size);
        j = Math.floor(Math.random() * gLevel.size);
    }
    if (k === 1000) return false;
    return { i, j };
}

///7Boom!
function sevenBoomBtnClick() {
    if (gIsManualMode) return;
    gIs7BoomMode = true;
    init();
}

function setMines7Boom(gBoard) {
    var counter = 1;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++, counter++) {
            if (counter % 7 === 0) {
                gBoard[i][j].isMine = true;
                gGame.markedCount++;
            }
        }
    }
    gLevel.mines = parseInt(counter / 7);
    gIs7BoomMode = false;
    updateMarked();
}

///local storage
function updateBestScoreFromLocalStorage() {
    var difficulties = ['easy', 'medium', 'hard'];
    for (var i = 0; i < difficulties.length; i++) {
        if (isLocalStorageExist(difficulties[i])) {
            document.querySelector(`.${difficulties[i]}Score`).innerText = localStorage.getItem(difficulties[i]);
        }
    }
}

function isLocalStorageExist(str) {
    return localStorage.getItem(str);
}

function updateScoreIfHigher(key, value) {
    if (!isLocalStorageExist(key)) {
        localStorage.setItem(key, value);
        updateBestScoreFromLocalStorage();
    } else if (value < +localStorage.getItem(key)) {
        localStorage.setItem(key, value);
        updateBestScoreFromLocalStorage();
    }
}

///manual position mines
function renderBlankBoard(board) {
    document.querySelector('.manualStart').style.display = 'inline-block';

    var strHTML = '<table oncontextmenu="return false;"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board.length; j++) {
            strHTML += `<td data-i="${i}" data-j="${j}"
                  oncontextmenu="mouseRightClick(this,${i},${j})"
                  onclick="addMine(this,${i} ,${j})"
                  style="width:${100 / gLevel.size}% ;height:${100 / gLevel.size}%" 
                  class="cell " ></td>`;
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';

    var elBoard = document.querySelector('.board-container');
    elBoard.innerHTML = strHTML;
}

function addMine(cell, i, j) {
    cell.classList.add('mine');
    cell.innerHTML = MINE;
    gBoard[i][j].isMine = true;
    gGame.markedCount++;
}

function manualBtnClick() {
    gIsManualMode = true;
    gBoard = createBoard();
    renderBlankBoard(gBoard);
    gGame.markedCount = 0;
    addClassBySelector('.difficulty button', 'noClick');
    document.querySelector('.sevBoomDiv').classList.add('noClick');
}

function manualStartBtnClick(btn) {
    init();
    updateMarked();
    btn.style.display = 'none';
    removeClassBySelector('.difficulty button', 'noClick');
    document.querySelector('.sevBoomDiv').classList.remove('noClick');
}

function addClassBySelector(selector, className) {
    var elements = document.querySelectorAll(selector);
    for (var i = 0; i < elements.length; i++) {
        elements[i].classList.add(className+'');
    }
}

function removeClassBySelector(selector, className) {
    var elements = document.querySelectorAll(selector);
    for (var i = 0; i < elements.length; i++) {
        elements[i].classList.remove(className);
    }
}