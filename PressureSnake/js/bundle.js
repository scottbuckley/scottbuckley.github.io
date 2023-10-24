"use strict";
// class NothingCell {
//   constructor() {
//     this.selected = false
//   }
// }
class Cell {
    constructor(r, c) {
        this.selected = false;
        this.row = r;
        this.col = c;
    }
    get row0() { return this.row - 1; }
    get col0() { return this.col - 1; }
    get cellNum() {
        return this.col + (this.row0 * Cell.gridWidth);
    }
    // display stuff
    get displayStartXY() {
        return [Cell.displayStartX + this.col0 * Cell.size,
            Cell.displayStartY + this.row0 * Cell.size];
    }
    get displayRect() {
        return [Cell.displayStartX + this.col0 * Cell.size,
            Cell.displayStartY + this.row0 * Cell.size,
            Cell.size, Cell.size];
    }
    displayPointXY(x, y, max = 1.0) {
        return [Cell.displayStartX + this.col0 * Cell.size + Cell.size * (x / max),
            Cell.displayStartY + this.row0 * Cell.size + Cell.size * (y / max)];
    }
    get displayCenterXY() {
        return this.displayPointXY(0.5, 0.5);
    }
    get cellAbove() {
        return this.cellRelative(0, -1);
    }
    get cellBelow() {
        return this.cellRelative(0, 1);
    }
    get cellLeft() {
        return this.cellRelative(-1, 0);
    }
    get cellRight() {
        return this.cellRelative(1, 0);
    }
    cellRelative(xdiff, ydiff) {
        var x = this.col0 + xdiff;
        var y = this.row0 + ydiff;
        var out;
        if (cellsCR[x] && (out = cellsCR[x][y])) {
            return out;
        }
        return Cell.nothingCell;
    }
}
class NothingCell extends Cell {
    constructor() {
        super(0, 0);
        this.selected = false;
    }
}
Cell.nothingCell = new NothingCell();
// external cell utility functions
function cellsAllHoldProperty(cs, P) {
    for (var cell of cs)
        if (!P(cell))
            return false;
    return true;
}
//@ts-check
const outerLineWidth = 4;
const innerLineWidth = 1;
const regionBorderLineWidth = 4;
var alwaysRedraw = true;
var needsRedraw = false;
setInterval(function () {
    if (alwaysRedraw || needsRedraw) {
        needsRedraw = false;
        drawEverything();
    }
}, 100);
function resizeCanvas() {
    cnv.width = window.devicePixelRatio * cnv.clientWidth;
    cnv.height = window.devicePixelRatio * cnv.clientHeight;
    var [displayWidth, displayHeight, startX, startY, cellSize] = getGridDimensions(gridWidth + 1, gridHeight + 1, window.devicePixelRatio * cnv.clientWidth, window.devicePixelRatio * cnv.clientHeight);
    Cell.size = cellSize;
    Cell.gridWidth = gridWidth;
    Cell.gridHeight = gridHeight;
    Cell.displayWidth = displayWidth;
    Cell.displayHeight = displayHeight;
    Cell.displayStartX = startX + cellSize / 2;
    Cell.displayStartY = startY + cellSize / 2;
    Cell.displayEndX = Cell.displayStartX + Cell.displayWidth - Cell.size;
    Cell.displayEndY = Cell.displayStartY + Cell.displayHeight - Cell.size;
}
function drawEverything() {
    clearCanvas();
    for (var cell of cells) {
        drawCellBackground(cell);
    }
    drawGrid();
    drawSelection();
}
function clearCanvas() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
}
function getGridDimensions(gridWidth, gridHeight, pageWidth, pageHeight) {
    // defaults
    var displayWidth = pageWidth;
    var displayHeight = pageHeight;
    var startX = 0;
    var startY = 0;
    const gridRatio = gridWidth / gridHeight;
    // maybe change some of them
    if (displayWidth / displayHeight > gridRatio) {
        displayWidth = displayHeight * gridRatio;
        startX = pageWidth / 2 - displayWidth / 2;
    }
    else {
        displayHeight = displayWidth * gridRatio;
        startY = pageHeight / 2 - displayHeight / 2;
    }
    var cellSize = displayHeight / gridHeight;
    return [displayWidth, displayHeight, startX, startY, cellSize];
}
function drawGrid() {
    var [displayWidth, displayHeight, startX, startY, endX, endY, cellSize] = [Cell.displayWidth, Cell.displayHeight, Cell.displayStartX, Cell.displayStartY, Cell.displayEndX, Cell.displayEndY, Cell.size];
    ctx.strokeStyle = "#000";
    // bounding rectangle
    ctx.beginPath();
    ctx.rect(startX, startY, displayWidth - cellSize, displayHeight - cellSize);
    ctx.lineWidth = outerLineWidth;
    ctx.stroke();
    // basic grid
    ctx.beginPath();
    for (var i = 1; i < gridWidth; i++) {
        ctx.moveTo(startX + i * cellSize, startY);
        ctx.lineTo(startX + i * cellSize, endY);
    }
    for (var i = 1; i < gridHeight; i++) {
        ctx.moveTo(startX, startY + i * cellSize);
        ctx.lineTo(endX, startY + i * cellSize);
    }
    ctx.lineWidth = innerLineWidth;
    ctx.stroke();
}
function drawSelection() {
    ctx.beginPath();
    for (var cell of cells)
        drawCellSelection(cell);
    ctx.lineWidth = Cell.size * selectionBorderSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0004";
    ctx.stroke();
}
function drawCellSelection(cell) {
    if (!cell.selected)
        return;
    var [x, y] = cell.displayStartXY;
    ctx.fillStyle = "#0001";
    ctx.fillRect(x, y, Cell.size, Cell.size);
    /* // border (inset method)
    ctx.fillStyle = "#0003";
    if (!cell.cellAbove.selected)
      ctx.fillRect(x, y, Cell.size, Cell.size*selectionBorderSize);
    if (!cell.cellLeft.selected)
      ctx.fillRect(x, y, Cell.size*selectionBorderSize, Cell.size);
    if (!cell.cellBelow.selected)
      ctx.fillRect(x, y+Cell.size, Cell.size, Cell.size*selectionBorderSize*-1);
    if (!cell.cellRight.selected)
      ctx.fillRect(x+Cell.size, y, Cell.size*selectionBorderSize*-1, Cell.size);
    */
    // ctx.beginPath();
    if (!cell.cellAbove.selected) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + Cell.size, y);
    }
    if (!cell.cellLeft.selected) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + Cell.size);
    }
    if (!cell.cellBelow.selected) {
        ctx.moveTo(x, y + Cell.size);
        ctx.lineTo(x + Cell.size, y + Cell.size);
    }
    if (!cell.cellRight.selected) {
        ctx.moveTo(x + Cell.size, y);
        ctx.lineTo(x + Cell.size, y + Cell.size);
    }
    // ctx.stroke();
}
function drawCellBackground(cell) {
}
//@ts-check
var cnv;
var ctx;
const gridWidth = 3;
const gridHeight = 7;
const cells = [];
const cellsCR = [];
// little configs
// how much of a corner is ignored when dragging
const cornerSize = 0.2;
const selectionBorderSize = 0.15;
$(function () {
    $(window).off("resize").on("resize", onResize);
    $(window).off("keydown").on("keydown", onKeyDown);
    $(window).off("keyup").on("keyup", onKeyUp);
    onReady();
});
function setupCells() {
    Cell.gridWidth = gridWidth;
    Cell.gridHeight = gridHeight;
    clearArray(cells);
    clearArray(cellsCR);
    for (var c = 0; c < gridWidth; c++) {
        cellsCR[c] = [];
        for (var r = 0; r < gridHeight; r++) {
            var cell = new Cell(r + 1, c + 1);
            cells.push(cell);
            cellsCR[c][r] = cell;
        }
    }
}
function onReady() {
    setupCells();
    setupCanvas();
    onResize();
}
function setupCanvas() {
    cnv = $("canvas#canv")[0];
    ctx = cnv.getContext("2d");
    resizeCanvas();
    $(cnv).off("mousedown").on("mousedown", canvasMouseDown);
    $(cnv).off("mouseup").on("mouseup", canvasMouseUp);
    $(cnv).off("mousemove").on("mousemove", canvasMouseMove);
    $(cnv).off("touchstart").on("touchstart", canvasMouseDown);
    $(cnv).off("touchmove").on("touchmove", canvasMouseMove);
    $(cnv).off("touchend").on("touchend", canvasMouseUp);
}
function onResize() {
    resizeCanvasContainer();
    resizeCanvas();
    drawEverything();
}
function isMobilePortrait() {
    return $("div#toplevel").css("flex-direction") === "column-reverse";
}
function resizeCanvasContainer() {
    if (isMobilePortrait()) {
        // resize grid container to appropriate aspect
        var grid = $("div#grid");
        grid.css("flex-basis", grid.width() * gridHeight / gridWidth + "px");
    }
}
var dragAction = "nothing";
function canvasMouseDown(e) {
    if (e.type === "mousedown" && e.button !== 0)
        return;
    var clickedCells = getClickedCells(getClickedCoords(getCursorPositions(e)));
    if (clickedCells.length === 0)
        clearSelectedCells(true);
    for (var cell of clickedCells) {
        e.preventDefault(); // prevent mousedown from also being called
        if (dragAction === "deselect") {
            cell.selected = false;
        }
        else if (dragAction === "select") {
            cell.selected = true;
        }
        else if (checkSelectMultiple(e)) {
            // multi-selection mode
            if (cell.selected) {
                cell.selected = false;
                dragAction = "deselect";
            }
            else {
                cell.selected = true;
                dragAction = "select";
            }
        }
        else {
            // single selection mode
            clearSelectedCells(false);
            cell.selected = true;
            dragAction = "select";
        }
    }
    needsRedraw = true;
}
function clearSelectedCells(redraw = true) {
    cells.map(c => c.selected = false);
    if (redraw)
        needsRedraw = true;
}
function checkSelectMultiple(e) {
    if (e.shiftKey)
        return true;
    return $("#opt_select_multiple").prop("checked");
}
function canvasMouseUp(e) {
    if (e.type === "touchend" && e.touches.length > 0)
        return;
    if (e.button !== 0)
        return;
    dragAction = "nothing";
}
function canvasMouseMove(e) {
    if (e.type === "mousemove" && e.button != 0)
        return; // we only care about primary-click drag
    var cursorCoords = getClickedCoords(getCursorPositions(e));
    if (cursorCoords === "outside")
        return;
    for (var [x, y, xr, yr] of cursorCoords) {
        // if (e.type === "touchmove")
        // e.preventDefault(); // prevent mousedown from also being called
        // i don't remember why this is commented out lol
        // ignore this action if we are right in the corner of a cell.
        var a = Math.abs(xr + yr - 1);
        var b = Math.abs(xr - yr);
        if (b > (1 - cornerSize) || a > (1 - cornerSize))
            continue;
        var cell = getClickedCell(x, y);
        if (cell === undefined)
            return;
        if (dragAction === "select" && cell.selected === false) {
            cell.selected = true;
            needsRedraw = true;
        }
        else if (dragAction === "deselect" && cell.selected === true) {
            cell.selected = false;
            needsRedraw = true;
        }
    }
}
function getClickedCell(x, y) {
    return cellsCR[x][y];
}
// function* getClickedCells(xys) {
//   for (xy of xys) {
//     if (xy === undefined) yield undefined;
//     var [x, y] = xy;
//     if (x===undefined || y===undefined) yield undefined;
//     yield cellsCR[x][y];
//   }
// }
function getClickedCells(xys) {
    if (xys === "outside")
        return [];
    return Array.from(xys, ([x, y]) => cellsCR[x][y]);
}
// turn page coordinates into cell coordinates.
// if any of the xys are outside the canvas, instead return "outside"
function getClickedCoords(xys) {
    var cells = [];
    for (var [x, y] of xys) {
        var xFloat = (x - Cell.displayStartX) / Cell.size;
        var yFloat = (y - Cell.displayStartY) / Cell.size;
        var cx = Math.floor(xFloat);
        var cy = Math.floor(yFloat);
        if (cx >= 0 && cy >= 0 && cx < Cell.gridWidth && cy < Cell.gridHeight)
            cells.push([cx, cy, xFloat % 1, yFloat % 1]);
        else
            return "outside";
    }
    return cells;
}
function* getCursorPositions(e) {
    const rect = cnv.getBoundingClientRect();
    if (e.type === "touchstart" || e.type === "touchmove") {
        for (var touch of e.changedTouches)
            yield [(touch.clientX - rect.left) * devicePixelRatio, (touch.clientY - rect.top) * devicePixelRatio];
    }
    else if (e.type === "mousemove" || e.type === "mousedown") {
        yield [(e.clientX - rect.left) * devicePixelRatio, (e.clientY - rect.top) * devicePixelRatio];
    }
}
// key presses and stuff
function onKeyDown(e) {
    const k = e.key;
    if (isClearKey(k)) {
        clearSelectedCells(true);
    }
    else if (isWallKey(k)) {
        // do wall stuff!
    }
    if (isSelectMultipleKey(k)) {
        $("#opt_select_multiple").prop("checked", true);
    }
}
function onKeyUp(e) {
    const k = e.key;
    if (isSelectMultipleKey(k)) {
        $("#opt_select_multiple").prop("checked", false);
    }
}
// get selected cells etc
function getSelectedCells() {
    return cells.filter(c => c.selected);
}
const isClearKey = (k) => (k === " ");
const isSelectMultipleKey = (k) => (k === "Shift");
const isWallKey = (k) => (k === "w" || k === "W");
function memo(fn) {
    // not yet sure which kind of cache we will use
    const constCache = new Array();
    const valCache = new Map();
    var fnCache = new Map();
    return function (...params) {
        console.log("entering with " + params);
        const paramsHead = params[0];
        if (params.length === 1) {
            // console.log("easy, a single param")
            // single parameter. use the value cache.
            if (valCache.has(paramsHead)) {
                console.log("we have a cached value for " + paramsHead);
                return valCache.get(paramsHead);
            }
            console.log("need to cache a value for " + paramsHead);
            // still passing in potential (uncached) rest parameters
            const u = fn(...params);
            valCache.set(paramsHead, u);
            return u;
        }
        else if (params.length === 0) {
            console.log("oh heck. no parameters?");
            // no parameters. this is weird. i guess use a constant cache.
            // using an array like an option
            if (constCache.length === 0)
                constCache.push(fn(...params));
            return constCache[0];
        }
        else {
            // console.log("oh boy multiple parameters")
            // more than 1 parameter. recursively memoise
            const paramsRest = params.slice(1);
            if (fnCache.has(paramsHead)) {
                console.log("we have a cached fn for " + paramsHead);
                return fnCache.get(paramsHead)(...paramsRest);
            }
            console.log("need to cache this thing recursively for " + paramsHead);
            const restFn = memo(function (...params2) {
                return fn(...[paramsHead, ...params2]);
            });
            fnCache.set(paramsHead, restFn);
            return restFn(...paramsRest);
        }
    };
}
function curry(fn) {
    return (t) => (u) => fn(t, u);
}
// empty an array
function clearArray(a) {
    while (a.length > 0)
        a.pop();
}
