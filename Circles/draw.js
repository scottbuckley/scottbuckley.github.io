const outerLineWidth = 4;
const innerLineWidth = 1;
const regionBorderLineWidth = 4;

var needsRedraw = false;
setInterval(function(){
  if (needsRedraw) {
    needsRedraw = false;
    drawEverything();
  }
}, 100);

function resizeCanvas() {
  cnv.width = window.devicePixelRatio * cnv.clientWidth;
  cnv.height = window.devicePixelRatio * cnv.clientHeight;

  var [displayWidth, displayHeight, startX, startY, cellSize]
    = getGridDimensions(gridWidth+1, gridHeight+1,
                        window.devicePixelRatio * cnv.clientWidth, window.devicePixelRatio * cnv.clientHeight);
  Cell.size = cellSize;
  Cell.gridWidth = gridWidth;
  Cell.gridHeight = gridHeight;
  Cell.displayWidth = displayWidth;
  Cell.displayHeight = displayHeight;
  Cell.displayStartX = startX+cellSize/2;
  Cell.displayStartY = startY+cellSize/2;
  Cell.displayEndX = Cell.displayStartX + Cell.displayWidth - Cell.size;
  Cell.displayEndY = Cell.displayStartY + Cell.displayHeight - Cell.size;
}

function drawEverything() {
  clearCanvas();
  for (cell of cells) {
    drawCellBackground(cell);
    drawCellCandidates(cell);
  }
  drawGrid();
  drawSelection();
}

function clearCanvas() {
  ctx.clearRect(0, 0, cnv.width, cnv.height);
}

function getGridDimensions(gridWidth, gridHeight, pageWidth, pageHeight) {
  var displayWidth = pageWidth;
  var displayHeight = pageHeight;
  var startX = 0;
  var startY = 0;
  if (displayWidth/displayHeight > gridWidth/gridHeight) {
    displayWidth = displayHeight * (gridWidth/gridHeight);
    startX = pageWidth/2 - displayWidth/2;
  } else {
    displayHeight = displayWidth * (gridHeight/gridWidth);
    startY = pageHeight/2 - displayHeight/2;
  }
  var cellSize = displayHeight/gridHeight;
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

  //todo: when implenting custom regions, replace this with a specific instance
  // of custom regions.
  if (regions3x3) {
    ctx.beginPath();
  for (var i=3; i<gridWidth; i+=3) {
    ctx.moveTo(startX + i*cellSize, startY);
    ctx.lineTo(startX + i*cellSize, endY);
  }
  for (var i=3; i<gridHeight; i+=3) {
    ctx.moveTo(startX, startY + i*cellSize);
    ctx.lineTo(endX, startY + i*cellSize);
  }
  ctx.lineWidth = regionBorderLineWidth;
  ctx.stroke();
  }
}


function drawSelection() {
  ctx.beginPath();
  for (cell of cells)
    drawCellSelection(cell);
  ctx.lineWidth = Cell.size*selectionBorderSize;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#0004";
  ctx.stroke();
}

function drawCellSelection(cell) {
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

function drawCellBackground(cell) {
  
}

function drawCellCandidates(cell) {
  var numCands = cands.length;
  var fontSize = Cell.size/(1+Math.sqrt(numCands));
  var yOffset = 0.075 / Math.sqrt(numCands);
  var font     = `${fontSize}px 'Courier New'`;
  var boldFont = "bold " + font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = "center";
  ctx.fillStyle = "#555";

  var candLocs = distributeCandidates(numCands);
  for (var i=0; i<numCands; i++) {
    var cand = Cell.cands[i];
    var [px, py] = candLocs[i];
    if (cell.canBe(cand)) {
      if (cell.candIsHighlit(i)) {
        // this candidate is highlit
        ctx.font = boldFont;
        ctx.fillStyle = "#000E";
        ctx.fillText(cand, ...cell.displayPointXY(px, py+yOffset));
      } else {
        // remaining candidate
        ctx.font = font;
        ctx.fillStyle = "#0008";
        ctx.fillText(cand, ...cell.displayPointXY(px, py+yOffset));
      }
    } else {
      // disqualified candidate
      // ctx.font = font;
      // ctx.fillStyle = "#0000000A";
      // ctx.fillText(cands[i], ...cell.displayPointXY(px, py+yOffset));
    }
  }
}