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
  for (xy of xys) {
    if (xy === undefined) yield undefined;
    var [x, y] = xy;
    if (x===undefined || y===undefined) yield undefined;
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
    else
      yield undefined;
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

// get selected cells etc
function getSelectedCells() {
  return cells.filter(c => c.selected);
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
    .css("line-height", (itemWidth*0.9)+"px") // for text vertical spacing

  for (var r=0; r<numRows; r++) {
    var row = $("<div>");
    row.addClass("cand_tool_row");
    for (var c=0; c<numCols; c++) {
      const i = r*numCols+c;
      if (i >= cands.length) break;
      var candElement = $("<div>");
      candElement
        .text(cands[i])
        .addClass("cand_tool_cand")
        .css("width", itemWidth)
        .on("click", candToolClicked(i));
      row.append(candElement);
    }
    cont.append(row);
  }
}

const CAND_CONFIRM = 1;
const CAND_TOGGLE = 2;
const CAND_HIGHLIGHT = 4;
const CAND_REMOVE = 8;
const CAND_INTERSECT = 16;

function getCandToolFunction() {
  const fn = $("#opt_form input[type='radio']:checked").val();
  if (fn === "toggle") return CAND_TOGGLE;
  if (fn === "highlight") return CAND_HIGHLIGHT;
  return CAND_TOGGLE;
}




function candToolClicked(cand) {
  return function(e) {
    const fn = getCandToolFunction();
    if (fn === CAND_TOGGLE) {
      var selected = getSelectedCells();
      console.log(selected);
      var allOn = cellsAllHoldProperty(selected, c => c.canBeOrSolved(cand))
      if (allOn) {
        // disable this candidate for all selected cells
        console.log("killing cand", cand);
        selected.map(c => c.eliminateCand(cand));
      } else {
        // enable this candidate for all selected cells
        selected.map(c => c.allowCand(cand));
      }
    }

    needsRedraw = true;
  };
}