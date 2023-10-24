//@ts-check

var cnv:HTMLCanvasElement
var ctx:CanvasRenderingContext2D

const gridWidth  = 3 as cellCount
const gridHeight = 7 as cellCount

const cells   : Cell[]   = []
const cellsCR : Cell[][] = []

// little configs
// how much of a corner is ignored when dragging
const cornerSize = 0.2 as portion
const selectionBorderSize = 0.15 as portion

$(function(){
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
  for (var c=0; c<gridWidth; c++) {
    cellsCR[c] = [];
    for (var r=0; r<gridHeight; r++) {
      var cell = new Cell(r+1 as cellCoord, c+1 as cellCoord);
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
  cnv = $("canvas#canv")[0] as HTMLCanvasElement;
  ctx = cnv.getContext("2d")!;
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
    grid.css("flex-basis", grid.width()!*gridHeight/gridWidth+"px");
  }
}

// CLICK DRAG ETS ON CANVAS
type dragType = "nothing" | "select" | "deselect"
var dragAction : dragType = "nothing";

function canvasMouseDown(e:JQuery.MouseDownEvent|JQuery.TouchStartEvent) {
  if (e.type==="mousedown" && e.button !== 0) return

  var clickedCells = getClickedCells(getClickedCoords(getCursorPositions(e)))
  if (clickedCells.length === 0) clearSelectedCells(true);

  for (var cell of clickedCells) {
    e.preventDefault(); // prevent mousedown from also being called
    if (dragAction === "deselect") {
      cell.selected = false;
    } else if (dragAction === "select") {
      cell.selected = true;
    } else if (checkSelectMultiple(e)) {
      // multi-selection mode
      if (cell.selected) {
        cell.selected = false;
        dragAction = "deselect";
      } else {
        cell.selected = true;
        dragAction = "select";
      }
    } else {
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
  if (redraw) needsRedraw = true;
}

function checkSelectMultiple(e:JQuery.MouseEventBase|JQuery.TouchEventBase):boolean {
  if (e.shiftKey) return true;
  return $("#opt_select_multiple").prop("checked");
}

function canvasMouseUp(e:JQuery.MouseUpEvent|JQuery.TouchEndEvent) {
  if (e.type === "touchend" && e.touches.length > 0) return
  if (e.button !==0) return
  dragAction = "nothing";
}

function canvasMouseMove(e:JQuery.MouseMoveEvent|JQuery.TouchMoveEvent) {
  if (e.type === "mousemove" && e.button != 0) return // we only care about primary-click drag
  var cursorCoords = getClickedCoords(getCursorPositions(e))
  if (cursorCoords === "outside") return
  for (var [x, y, xr, yr] of cursorCoords) {
    // if (e.type === "touchmove")
      // e.preventDefault(); // prevent mousedown from also being called
      // i don't remember why this is commented out lol

    // ignore this action if we are right in the corner of a cell.
    var a = Math.abs(xr+yr-1);
    var b = Math.abs(xr-yr);
    if (b>(1-cornerSize) || a>(1-cornerSize)) continue;
    
    var cell = getClickedCell(x, y);
    if (cell === undefined) return;
    
    if (dragAction === "select" && cell.selected === false) {
      cell.selected = true;
      needsRedraw = true;
    } else if (dragAction === "deselect" && cell.selected === true) {
      cell.selected = false;
      needsRedraw = true;
    }
  }
}

function getClickedCell(x:cellCoord, y:cellCoord):Cell {
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

function getClickedCells(xys:Iterable<[cellCoord, cellCoord, ...any]>|"outside"):Cell[] {
  if (xys === "outside") return []
  return Array.from(xys, ([x,y]) => cellsCR[x][y])
}

// turn page coordinates into cell coordinates.
// if any of the xys are outside the canvas, instead return "outside"
function getClickedCoords(xys: Iterable<[canvCoord, canvCoord]>):[cellCoord, cellCoord, portion, portion][]|"outside" {
  var cells:[cellCoord, cellCoord, portion, portion][] = []
  for (var [x, y] of xys) {
    var xFloat = (x - Cell.displayStartX)/Cell.size
    var yFloat = (y - Cell.displayStartY)/Cell.size

    var cx = Math.floor(xFloat) 
    var cy = Math.floor(yFloat)

    if (cx>=0 && cy >= 0 && cx < Cell.gridWidth && cy < Cell.gridHeight)
      cells.push([cx as cellCoord, cy as cellCoord, xFloat%1 as portion, yFloat%1 as portion])
    else
      return "outside"
  }
  return cells
}

function* getCursorPositions(e:JQuery.MouseDownEvent|JQuery.TouchStartEvent|JQuery.MouseMoveEvent|JQuery.TouchMoveEvent):Generator<[canvCoord, canvCoord]> {
  const rect = cnv.getBoundingClientRect();
  if (e.type === "touchstart" || e.type === "touchmove") {
    for (var touch of e.changedTouches)
      yield [(touch.clientX - rect.left) * devicePixelRatio as canvCoord, (touch.clientY - rect.top) * devicePixelRatio as canvCoord];
  } else if (e.type === "mousemove" || e.type === "mousedown") {
    yield [(e.clientX - rect.left) * devicePixelRatio as canvCoord, (e.clientY - rect.top) * devicePixelRatio as canvCoord];
  }
}


// key presses and stuff
function onKeyDown(e:JQuery.KeyDownEvent) {
  const k = e.key
  if (isClearKey(k)) {
    clearSelectedCells(true)
  } else if (isWallKey(k)) {
    // do wall stuff!
  }
  if (isSelectMultipleKey(k)) {
    $("#opt_select_multiple").prop("checked", true);
  }
}

function onKeyUp(e:JQuery.KeyUpEvent) {
  const k = e.key
  if (isSelectMultipleKey(k)) {
    $("#opt_select_multiple").prop("checked", false);
  }
}

// get selected cells etc
function getSelectedCells():Cell[] {
  return cells.filter(c => c.selected);
}

const isClearKey          = (k:string) => (k === " ")
const isSelectMultipleKey = (k:string) => (k === "Shift")
const isWallKey           = (k:string) => (k === "w" || k === "W")

