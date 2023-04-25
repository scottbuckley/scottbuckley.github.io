var cnv = undefined;
var ctx = undefined;

const gridWidth = 10;
const gridHeight = 10;

const cells = [];
const cellsCR = []
var cands = [1, 2, 3, "W", "T", "F", 7, 8];
var regions3x3 = true;

// little configs
// how much of a corner is ignored when dragging
const cornerSize = 0.2;
const selectionBorderSize = 0.15;

$(document).ready(function(){
  $(window).off("resize").on("resize", onResize);
  $(window).off("keydown").on("keydown", onKeyDown);
  $(window).off("keyup").on("keyup", onKeyUp);
  onReady();
});

function setupCells() {
  Cell.gridWidth = gridWidth;
  Cell.gridHeight = gridHeight;
  Cell.cands = cands;
  clearArray(cells);
  clearArray(cellsCR);
  for (var c=0; c<gridWidth; c++) {
    cellsCR[c] = [];
    for (var r=0; r<gridHeight; r++) {
      var cell = new Cell(r+1, c+1);
      cells.push(cell);
      cellsCR[c][r] = cell;
    }
  }
}

function onReady() {
  createCandidteTool();
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
    grid.css("flex-basis", grid.width()*gridHeight/gridWidth+"px");
  }
}

// CLICK DRAG ETS ON CANVAS
var dragAction = 0;
const DRAG_NOTHING = 0;
const DRAG_SELECT = 1;
const DRAG_DESELECT = 2;
function canvasMouseDown(e) {
  if (e.which !== 1 && e.type !== "touchstart") return;
  for (cell of getClickedCells(getClickedCoords(getCursorPositions(e)))) {
    if (cell===undefined) {
      clearSelectedCells(true);
      return;
    }
    e.preventDefault(); // prevent mousedown from also being called
    if (dragAction === DRAG_DESELECT) {
      cell.selected = false;
    } else if (dragAction === DRAG_SELECT) {
      cell.selected = true;
    } else if (checkSelectMultiple(e)) {
      // multi-selection mode
      if (cell.selected) {
        cell.selected = false;
        dragAction = DRAG_DESELECT;
      } else {
        cell.selected = true;
        dragAction = DRAG_SELECT;
      }
    } else {
      // single selection mode
      clearSelectedCells(false);
      cell.selected = true;
      dragAction = DRAG_SELECT;
    }
  }
  needsRedraw = true;
}

function clearSelectedCells(redraw = true) {
  cells.map(c => c.selected = false);
  if (redraw) needsRedraw = true;
}

function checkSelectMultiple(e) {
  if (e.shiftKey) return true;
  return $("#opt_select_multiple").prop("checked");
}

function canvasMouseUp(e) {
  // console.log(e.touches.length);
  if (e.touches && e.touches.length > 0) return;
  if (e.which !== 1 && e.type !== "touchend") return;
  dragAction = DRAG_NOTHING;
}

function canvasMouseMove(e) {
  if (e.which !== 1 && e.type !== "touchmove") return;
  for ([x, y, xr, yr] of getClickedCoords(getCursorPositions(e))) {
    // if (e.type === "touchmove")
      // e.preventDefault(); // prevent mousedown from also being called

    // ignore this action if we are right in the corner of a cell.
    var a = Math.abs(xr+yr-1);
    var b = Math.abs(xr-yr);
    if (b>(1-cornerSize) || a>(1-cornerSize)) continue;
     
    var cell = getClickedCell(x, y);
    if (cell === undefined) return;
    
    if (dragAction === DRAG_SELECT && cell.selected === false) {
      cell.selected = true;
      needsRedraw = true;
    } else if (dragAction === DRAG_DESELECT && cell.selected === true) {
      cell.selected = false;
      needsRedraw = true;
    }
  }
}

function getClickedCell(x, y) {
  if (x===undefined || y===undefined) return undefined;
  return cellsCR[x][y];
}

function* getClickedCells(xys) {
  for ([x, y] of xys) {
    if (x===undefined || y===undefined) continue;
    yield cellsCR[x][y];
  }
}

function* getClickedCoords(xys) {
  for ([x, y] of xys) {
    var xFloat = (x - Cell.displayStartX)/Cell.size;
    var yFloat = (y - Cell.displayStartY)/Cell.size;

    var x = Math.floor(xFloat);
    var y = Math.floor(yFloat);

    if (x>=0 && y >= 0 && x < Cell.gridWidth && y < Cell.gridHeight)
      yield ([x, y, xFloat%1, yFloat%1]);
  }
}

function* getCursorPositions(e) {
  const rect = cnv.getBoundingClientRect();
  if (e.type === "touchstart" || e.type === "touchmove") {
    for (touch of e.changedTouches)
      yield [(touch.clientX - rect.left) * devicePixelRatio, (touch.clientY - rect.top) * devicePixelRatio];
  } else {
    yield [(e.clientX - rect.left) * devicePixelRatio, (e.clientY - rect.top) * devicePixelRatio];
  }
}


// key presses and stuff
function onKeyDown(e) {
  if (e.which === 16) { // SHIFT
    $("#opt_select_multiple").prop("checked", true);
  }
}

function onKeyUp(e) {
  if (e.which === 16) { // SHIFT
    $("#opt_select_multiple").prop("checked", false);
  }
}


// candidate tool
function createCandidteTool() {
  var cont = $("#cand_tool");
  cont.empty();
  var numRows = Math.round(Math.sqrt(cands.length));
  var numCols = Math.ceil(cands.length/numRows);
  var itemWidth = cont.innerWidth()/numCols;

  cont
    .css("font-size", itemWidth*0.4)
    .css("line-height", (itemWidth*0.9)+"px")

  for (cand of cands) {
    var candElement = $("<div>");
    candElement
      .text(cand)
      .addClass("cand_tool_cand")
      .width(itemWidth-2);
    cont.append(candElement);
  }
}