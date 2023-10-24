// class NothingCell {
//   constructor() {
//     this.selected = false
//   }
// }
class Cell {

  selected : boolean = false

  static nothingCell:Cell

  static gridWidth:cellCount
  static gridHeight:cellCount
  static displayWidth:canvMeasure
  static displayHeight:canvMeasure
  static displayStartX:canvMeasure
  static displayStartY:canvMeasure
  static displayEndX:canvMeasure
  static displayEndY:canvMeasure
  static size:canvMeasure

  readonly row: cellCoord
  readonly col: cellCoord

  constructor(r:cellCoord, c:cellCoord) {
    this.row = r
    this.col = c
  }

  get row0() { return this.row - 1 }
  get col0() { return this.col - 1 }

  get cellNum() {
    return this.col + (this.row0 * Cell.gridWidth)
  }


  // display stuff
  
  get displayStartXY() : [canvMeasure, canvMeasure] {
    return [Cell.displayStartX + this.col0*Cell.size as canvMeasure,
            Cell.displayStartY + this.row0*Cell.size as canvMeasure] }
  get displayRect() : [canvMeasure, canvMeasure, canvMeasure, canvMeasure] {
    return [Cell.displayStartX + this.col0*Cell.size as canvMeasure,
            Cell.displayStartY + this.row0*Cell.size as canvMeasure,
            Cell.size, Cell.size] }

  
  displayPointXY(x:portion, y:portion, max=1.0 as portion) : [canvMeasure, canvMeasure] {
    return [Cell.displayStartX + this.col0*Cell.size + Cell.size*(x/max) as canvMeasure,
            Cell.displayStartY + this.row0*Cell.size + Cell.size*(y/max) as canvMeasure]
  }
  
  get displayCenterXY() {
    return this.displayPointXY(0.5 as portion, 0.5 as portion)
  }

  get cellAbove() {
    return this.cellRelative(0, -1)
  }

  get cellBelow() {
    return this.cellRelative(0, 1)
  }

  get cellLeft() {
    return this.cellRelative(-1, 0)
  }

  get cellRight() {
    return this.cellRelative(1, 0)
  }

  cellRelative(xdiff: number, ydiff: number) {
    var x = this.col0 + xdiff
    var y = this.row0 + ydiff

    var out:Cell
    if (cellsCR[x] && (out = cellsCR[x][y])) {
      return out
    }
    return Cell.nothingCell
  }

}

class NothingCell extends Cell {
  readonly selected = false
  constructor() {
    super(0 as cellCoord, 0 as cellCoord)
  }
}
Cell.nothingCell = new NothingCell()

// external cell utility functions
function cellsAllHoldProperty(cs:Cell[], P:(c: Cell) => boolean) : boolean {
  for (var cell of cs)
    if (!P(cell)) return false
  return true
}