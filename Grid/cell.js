
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
  

  #cands = [];

  constructor(r, c) {
    this.#row = r;
    this.#col = c;

    this.selected = false;

    this.#cands = [];
    for (c of Cell.cands) {
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

  canBe(c) {
    return !!this.#cands[c];
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

  candIsHighlit(ind) {
    return false;
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