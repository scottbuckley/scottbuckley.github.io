
class NothingCell {
  constructor() {
    this.selected = false;
  }
}

class Cell {

  static nothingCell = new NothingCell();

  static gridWidth;
  static gridHeight;
  static displayWidth;
  static displayHeight;
  static displayStartX;
  static displayStartY;
  static displayEndX;
  static displayEndY;
  static size;

  #row;
  #col;
  #solved;

  #cands = [];

  constructor(r, c) {
    this.#row = r;
    this.#col = c;
    this.#solved = false;

    this.selected = false;

    this.#cands = [];
    for (var c=0; c<Cell.cands.length; c++) {
      this.#cands[c] = true;
    }
  }

  get row()  { return this.#row; }
  set row(r) { throw Error("row is immutable"); }
  get col()  { return this.#col; }
  set col(c) { throw Error("col is immutable"); }

  get row0() { return this.row-1 };
  get col0() { return this.col-1 };

  get cellNum() {
    return this.col + (this.row0 * Cell.gridWidth);
  }

  // check candidates

  canBe(c) {
    ensureInt(c);
    return !!this.#cands[c];
  }

  canBeOrSolved(c) {
    ensureInt(c);
    if (this.#solved) return true;
    return this.canBe(c);
  }

  candIsHighlit(ind) {
    ensureInt(ind);
    return false;
  }

  // modify candidates

  setCand(c, b) {
    ensureInt(c);
    this.#cands[c] = b;
  }

  eliminateCand(c) {
    this.setCand(c, false);
  }

  allowCand(c) {
    this.setCand(c, true);
  }

  // display stuff
  
  get displayStartXY()  { return [Cell.displayStartX + this.col0*Cell.size,
                                  Cell.displayStartY + this.row0*Cell.size]; }
  get displayRect() { return [Cell.displayStartX + this.col0*Cell.size,
                              Cell.displayStartY + this.row0*Cell.size,
                              Cell.size, Cell.size]; };

  displayPointXY(x, y, max=1.0) {
    return [Cell.displayStartX + this.col0*Cell.size + Cell.size*(x/max),
            Cell.displayStartY + this.row0*Cell.size + Cell.size*(y/max)];
  }
  
  get displayCenterXY() { return this.displayPointXY(0.5, 0.5); }

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





// external cell utility functions
function cellsAllHoldProperty(cs, P) {
  for (cell of cs)
    if (!P(cell)) return false;
  return true;
}