//@ts-check

const outerLineWidth = 4 as canvMeasure;
const innerLineWidth = 1 as canvMeasure;
const regionBorderLineWidth = 4 as canvMeasure;

var alwaysRedraw = true;
var needsRedraw = false;
setInterval(function(){
  if (alwaysRedraw || needsRedraw) {
    needsRedraw = false;
    drawEverything();
  }
}, 100);

function resizeCanvas() {
  cnv.width = window.devicePixelRatio * cnv.clientWidth;
  cnv.height = window.devicePixelRatio * cnv.clientHeight;

  var [displayWidth, displayHeight, startX, startY, cellSize]
      = getGridDimensions(
          gridWidth+1 as cellCount, gridHeight+1 as cellCount,
          window.devicePixelRatio * cnv.clientWidth as canvMeasure, window.devicePixelRatio * cnv.clientHeight as canvMeasure
        );
  Cell.size = cellSize;
  Cell.gridWidth = gridWidth;
  Cell.gridHeight = gridHeight;
  Cell.displayWidth = displayWidth;
  Cell.displayHeight = displayHeight;
  Cell.displayStartX = startX+cellSize/2 as canvMeasure;
  Cell.displayStartY = startY+cellSize/2 as canvMeasure;
  Cell.displayEndX = Cell.displayStartX + Cell.displayWidth - Cell.size as canvMeasure;
  Cell.displayEndY = Cell.displayStartY + Cell.displayHeight - Cell.size as canvMeasure;
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

function getGridDimensions
  (gridWidth:cellCount, gridHeight:cellCount, pageWidth:canvMeasure, pageHeight:canvMeasure)
  :[canvMeasure,canvMeasure,canvMeasure,canvMeasure,canvMeasure] {
  // defaults
  var displayWidth = pageWidth;
  var displayHeight = pageHeight;
  var startX = 0 as canvMeasure;
  var startY = 0 as canvMeasure;
  const gridRatio = gridWidth/gridHeight;

  // maybe change some of them
  if (displayWidth/displayHeight > gridRatio) {
    displayWidth = displayHeight * gridRatio as canvMeasure;
    startX = pageWidth/2 - displayWidth/2 as canvMeasure;
  } else {
    displayHeight = displayWidth * gridRatio as canvMeasure;
    startY = pageHeight/2 - displayHeight/2 as canvMeasure;
  }
  var cellSize = displayHeight/gridHeight as canvMeasure;
  return [displayWidth, displayHeight, startX, startY, cellSize];
}

function drawGrid() {
  var [displayWidth, displayHeight, startX, startY, endX, endY, cellSize]
   = [Cell.displayWidth, Cell.displayHeight, Cell.displayStartX, Cell.displayStartY, Cell.displayEndX, Cell.displayEndY, Cell.size];

  ctx.strokeStyle = "#000";

  // bounding rectangle
  ctx.beginPath();
  ctx.rect(startX, startY, displayWidth-cellSize, displayHeight-cellSize);
  ctx.lineWidth = outerLineWidth;
  ctx.stroke();

  // basic grid
  ctx.beginPath();
  for (var i=1; i<gridWidth; i++) {
    ctx.moveTo(startX + i*cellSize, startY);
    ctx.lineTo(startX + i*cellSize, endY);
  }
  for (var i=1; i<gridHeight; i++) {
    ctx.moveTo(startX, startY + i*cellSize);
    ctx.lineTo(endX, startY + i*cellSize);
  }
  ctx.lineWidth = innerLineWidth;
  ctx.stroke();
}


function drawSelection() {
  ctx.beginPath();
  for (var cell of cells)
    drawCellSelection(cell);
  ctx.lineWidth = Cell.size*selectionBorderSize;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#0004";
  ctx.stroke();
}

function drawCellSelection(cell:Cell) {
  if (!cell.selected) return;

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
    ctx.lineTo(x+Cell.size, y);
  }
  if (!cell.cellLeft.selected) {
    ctx.moveTo(x, y);
    ctx.lineTo(x, y+Cell.size);
  }
  if (!cell.cellBelow.selected) {
    ctx.moveTo(x, y+Cell.size);
    ctx.lineTo(x+Cell.size, y+Cell.size);
  }
  if (!cell.cellRight.selected) {
    ctx.moveTo(x+Cell.size, y);
    ctx.lineTo(x+Cell.size, y+Cell.size);
  }
  // ctx.stroke();

}

function drawCellBackground(cell:Cell) {
  
}
