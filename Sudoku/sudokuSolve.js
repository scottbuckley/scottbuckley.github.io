  
  //  ######  ######## ########     ###    ########  ######
  // ##    ##    ##    ##     ##   ## ##      ##    ##    ##
  // ##          ##    ##     ##  ##   ##     ##    ##
  //  ######     ##    ########  ##     ##    ##     ######
  //       ##    ##    ##   ##   #########    ##          ##
  // ##    ##    ##    ##    ##  ##     ##    ##    ##    ##
  //  ######     ##    ##     ## ##     ##    ##     ######
  const strat_categories = [
    "Simple",
    "Tough",
    "Diabolical",
    "Anti-Knight",
    "Sandwich"
  ];

  const strats = [
    { name:  "Clear Adjacents",
      sname: "Clr Adjs",
      func:  clearAdjacents,
      enabled: true,
      category: "Simple"
    },
    { name:  "Naked Singles",
      sname: "Nkd 1s",
      func:  nakedSingles,
      enabled: true,
      category: "Simple"
    },
    { name:  "Antiknight Eliminations",
      sname: "AK Elims",
      func:  antiknightElims,
      enabled:false,
      category: "Anti-Knight"
    },
    { name:  "Hidden Singles",
      sname: "Hdn 1s",
      func:  hiddenSingles,
      enabled: true,
      category: "Simple"
    },
    { name:  "Intersection Removal",
      sname: "Intersect",
      func:  intersectionRemoval,
      enabled: true,
      category: "Simple"
    },
    { name:  "Naked Pairs",
      sname: "Nkd 2s",
      func:  nakedPairs,
      enabled: true,
      category: "Simple"
    },
    { name:  "Hidden Pairs",
      sname: "Hdn 2s",
      func:  hiddenPairs,
      enabled: true,
      category: "Simple"
    },
    { name:  "Sandwich Eliminations",
      sname: "Sand Elim",
      func:  sandwichElims,
      enabled: false,
      category: "Sandwich"
    },
    { name:  "Naked Triples",
      sname: "Nkd 3s",
      func:  nakedTriples,
      enabled: true,
      category: "Simple"
    },
    { name:  "Hidden Triples",
      sname: "Hdn 3s",
      func:  hiddenTriples,
      enabled: true,
      category: "Simple"
    },
    { name:  "Naked Quads",
      sname: "Nkd 4s",
      func:  nakedQuads,
      enabled: true,
      category: "Simple"
    },
    { name:  "X-Wings",
      sname: "XWings",
      func:  XWings,
      enabled: true,
      category: "Tough"
    },
    { name:  "Y-Wings",
      sname: "YWings",
      func:  YWings,
      enabled: true,
      category: "Tough"
    },
    { name:  "Z-Wings",
      sname: "ZWings",
      func:  ZWings,
      enabled: true,
      category: "Tough"
    },
    { name:  "Swordfish",
      sname: "Swordfish",
      func:  swordfish,
      enabled: true,
      category: "Tough"
    },
    { name:  "Simple Colors Chain",
      sname: "Smpl Clrs",
      func:  simpleColors,
      enabled: true,
      category: "Tough",
      aka: "Singles Chains"
    },
    { name:  "Finned X-Wings",
      sname: "Finned",
      func:  FinnedXWings,
      enabled: true,
      category: "Diabolical"
    },
  ];

  //  ######   #######  ##    ## ######## ####  ######
  // ##    ## ##     ## ###   ## ##        ##  ##    ##
  // ##       ##     ## ####  ## ##        ##  ##
  // ##       ##     ## ## ## ## ######    ##  ##   ####
  // ##       ##     ## ##  #### ##        ##  ##    ##
  // ##    ## ##     ## ##   ### ##        ##  ##    ##
  //  ######   #######  ##    ## ##       ####  ######

  // whether or not to print info on how the solve is achieved
  var logging = true;


  //  ######  ########    ###    ######## ########
  // ##    ##    ##      ## ##      ##    ##
  // ##          ##     ##   ##     ##    ##
  //  ######     ##    ##     ##    ##    ######
  //       ##    ##    #########    ##    ##
  // ##    ##    ##    ##     ##    ##    ##
  //  ######     ##    ##     ##    ##    ########

  // we store the sudoku in various ways simultaneously.
  var sudoku = [];
  var sudokuCols = [];
  var sudokuBoxes = [];
  var sudokuCellsByPos = [];      
  var sudokuEdges = [[],[],[],[]];

  var newCellsConfirmed = []; // keep track of new cells as they are confirmed.
  var undoStack = [];



  // solve the sudoku as far as you can.
  // return the solution or "ERROR" or "INCOMPLETE".
  function completeSilently(data) {
    initSudokuData(data);
    while(makeSomeChange(false));
    if (checkErrors()) return "ERROR";
    if (getSolvedCount() < 81) return "INCOMPLETE";
    return getExportString();
  }

  // log to console iff "logging" is true.
  function consolelog() {
    logging && console.log(...arguments)
  }

  // apply one strategy. flash the associated button if "flash"=true.
  // try all strategies from the easiest to hardest. return true if
  // some progress was made.
  function makeSomeChange(flash=true) {
    for (var s=0; s<strats.length; s++) {
      // only (auto) clear adj if new cells listed
      if (s===0 &&newCellsConfirmed.length===0) continue;

      // perform strategy and optionally flash button
      var strat = strats[s];
      if (strat.enabled && strat.func()) {
        stepDelay && flash && flashButton(strat.button);
        return true;
      }
    }
    return false;
  }
  
  // attempt to solve the whole sudoku, one step at a time.
  // includes a delay between solve steps.
  function autoSolve() {
    // consolelog("Attempting to solve...");
    // make a single step, then wait before doing it again.
    var makestep = function() {
      if (makeSomeChange()) {
        refresh();
        if (stepDelay)
          setTimeout(makestep, stepDelay);
        else
          makestep();
      } else {
        if (getSolvedCount() === 81) {
          consolelog("Sudoku is solved!");
        } else {
          consolelog("Could not make any further progress.");
        }
        if (checkErrors()) {
          consolelog("The current board has errors!");
        } else {
          consolelog("No errors were found in the current board.");
        }
      }
    }
    // start the first step
    makestep();
  }

  // check how many cells are solved.
  function getSolvedCount() {
    var count = 0;
    for (var r=0; r<9; r++)
      for (var c=0; c<9; c++)
        if (isSolved(sudoku[r][c]))
          count++;
    return count;
  }

/*
    ##     ## ######## ##       ########  ######## ########   ######
    ##     ## ##       ##       ##     ## ##       ##     ## ##    ##
    ##     ## ##       ##       ##     ## ##       ##     ## ##
    ######### ######   ##       ########  ######   ########   ######
    ##     ## ##       ##       ##        ##       ##   ##         ##
    ##     ## ##       ##       ##        ##       ##    ##  ##    ##
    ##     ## ######## ######## ##        ######## ##     ##  ######
*/
//meowmeow


function isNumber(v) {
  if (isNaN(v)) return false;
  if (v === null) return false;
  if (typeof v === "number") return true;
  return false;
}

function isSolved(cell) {
  return isNumber(cell.solved);
}

function clearAfterConfirm(cell) {
  var changed = false;
  if (isSolved(cell)) {
    var v = cell.solved;
    cell[v] = false;
    var row = sudoku[cell.row];
    var col = sudokuCols[cell.col];
    var box = sudokuBoxes[cell.box]
    for (var i=0; i<row.length; i++) {
      changed = changed || row[i][v] || col[i][v] || box[i][v];
      row[i][v] = false;
      col[i][v] = false;
      box[i][v] = false;
    }
  }
  return changed;
}

function confirmCell(cell, v) {
  var changed = !isSolved(cell) || v!==cell.solved;
  newCellsConfirmed.push(cell);
  for (var i=0; i<cell.length; i++) {
    cell[i] = false;
  }
  cell[v] = true;
  cell['solved'] = v;
  return changed;
}

function toggleCandidate(cell, v) {
  if (isSolved(cell)) return false;
  cell[v] = !cell[v];
  return true;
}

function topEdge()    { return sudokuEdges[0]; }
function leftEdge()   { return sudokuEdges[1]; }
function rightEdge()  { return sudokuEdges[2]; }
function bottomEdge() { return sudokuEdges[3]; }


function boxNum(r, c) {
  if (r<3) {
    if (c<3) return 0;
    if (c<6) return 1;
    if (c<9) return 2;
  } else if (r<6) {
    if (c<3) return 3;
    if (c<6) return 4;
    if (c<9) return 5;
  } else if (r<9) {
    if (c<3) return 6;
    if (c<6) return 7;
    if (c<9) return 8;
  } else return -1;
}







  //  ######   #######  ##       ##     ## ######## ########   ######
  // ##    ## ##     ## ##       ##     ## ##       ##     ## ##    ##
  // ##       ##     ## ##       ##     ## ##       ##     ## ##
  //  ######  ##     ## ##       ##     ## ######   ########   ######
  //       ## ##     ## ##        ##   ##  ##       ##   ##         ##
  // ##    ## ##     ## ##         ## ##   ##       ##    ##  ##    ##
  //  ######   #######  ########    ###    ######## ##     ##  ######





  //  EEEEEEE DDDDD     GGGG  EEEEEEE
  //  EE      DD  DD   GG  GG EE
  //  EEEEE   DD   DD GG      EEEEE
  //  EE      DD   DD GG   GG EE
  //  EEEEEEE DDDDDD   GGGGGG EEEEEEE

  function getSingleEdgeValue_Col(ind) {
    if (ind>=9) return undefined;
    var top    = topEdge()[ind];
    var bottom = bottomEdge()[ind];
    if (isNumber(top)) return top;
    if (isNumber(bottom)) return bottom;
    return undefined;
  }

  function getSingleEdgeValue_Row(ind) {
    if (ind>=9) return undefined;
    var left  = leftEdge()[ind];
    var right = rightEdge()[ind];
    if (isNumber(left)) return left;
    if (isNumber(right)) return right;
    return undefined;
  }




  //   SSSSS    AAA   NN   NN DDDDD   WW      WW IIIII  CCCCC  HH   HH
  //  SS       AAAAA  NNN  NN DD  DD  WW      WW  III  CC    C HH   HH
  //   SSSSS  AA   AA NN N NN DD   DD WW   W  WW  III  CC      HHHHHHH
  //       SS AAAAAAA NN  NNN DD   DD  WW WWW WW  III  CC    C HH   HH
  //   SSSSS  AA   AA NN   NN DDDDDD    WW   WW  IIIII  CCCCC  HH   HH

  // call a function on every row and column, given
  // the row/col, its edge value, and its label.
  function everyRowColSandwich(func, skipFullySet=true) {
    var changed = false;
    for (var i=0; i<9; i++) {
      var row = sudoku[i];
      if (!skipFullySet || !row.sandwichFullySet) {
        var rowSW = getSingleEdgeValue_Row(i);
        if (isNumber(rowSW) && func(row, rowSW, "row "+(i+1))) changed = true;
      }

      var col = sudokuCols[i];
      if (!skipFullySet || !col.sandwichFullySet) {
        var colSW = getSingleEdgeValue_Col(i);
        if (isNumber(colSW) && func(col, colSW, "col "+(i+1))) changed = true;
      }
    }
    return changed;
  }

  function everyRowColSandwichAllTrue(func) {
    // invert the function, call above, then invert the result.
    // it will return true iff func always returned true.
    return !everyRowColSandwich(function(a,b,c){return !func(a,b,c);}, false);
  }

  // set a cell to only 1 and 9. true if a change was made.
  function set19only(cell) {
    if (isSolved(cell)) return false;
    var changed = false;
    for (var v=1; v<8; v++) {
      changed = changed || cell[v];
      cell[v] = false;
    }
    return changed;
  }

  // turn 1 and 9 off on a cell. true if change was made.
  function set19off(cell) {
    if (!cell[0] && !cell[8]) return false;
    cell[0] = cell[8] = false;
    return true;
  }

  // check if this cell is a known 1/9
  function isOnly1or9(cell) {
    if (isSolved(cell))
      return (cell.solved===0 || cell.solved===8);
    for (var v=1; v<8; v++)
      if (cell[v] || cell.solved===v)
        return false;
    return true;
  }

  function couldBeVal(cell, v) {
    return (cell[v] || cell.solved===v);
  }

  function couldBe1(cell) { return couldBeVal(cell, 0); }
  function couldBe9(cell) { return couldBeVal(cell, 8); }
  function couldBe1or9(cell) { return couldBe1(cell) || couldBe9(cell);}

  // returns the indexes in group that match the filter
  // returns [] if more than 'max' are found
  function filterIndexes(group, filter, max=group.length) {
    var out = [];
    for (var i=0; i<group.length; i++) {
      if (filter(group[i])) {
        out.push(i);
        if (out.length > max) return [];
      }
    }
    return out;
  }


  // non-static (doesn't care if group is set)
  // checks if the existing cells on the outside of a group
  // constitute the outer sum.
  function sandwichOuterDone(group, sw, groupLabel) {
    var changed = false;
    var found19s = 0;
    var startSum = 0;
    var startInd = 0;
    var endSum = 0;
    var endInd = 8;
    for (var c=0; c<9; c++) {
      startInd = c;
      var cell = group[c];
      if (!isSolved(cell)) break;
      if (cell.solved===0 || cell.solved===8) { found19s++; break; }
      startSum += cell.solved+1;
    }
    for (var c=8; c>=startInd; c--) {
      endInd = c;
      var cell = group[c];
      if (!isSolved(cell)) break;
      if (cell.solved===0 || cell.solved===8) { found19s++; break; }
      endSum += cell.solved+1;
    }

    // only useful if there are unknown 1s and 9s
    if (found19s === 2) return false;

    // there are two or fewer unsolved cells
    if (startInd >= (endInd+1)) return false;

    // outer sum is already completed
    if ((startSum + endSum) === (35-sw)) {
      group.sandwichFullySet = true;
      changed = set19only(group[startInd]) || changed;
      changed = set19only(group[endInd]) || changed;
      for (var c=startInd+1; c<endInd; c++) {
        var cell = group[c];
        changed = set19off(cell) || changed;
      }
    }
    if (changed) {
      consolelog(`[sandwich] outer numbers of ${groupLabel} sum to its complement, so 1/9 positions known.`);
      return true;
    } return false;
  }


  // if there's exactly one known 1/9, the sw value gives us hints
  // about where the other could be.
  function sandwichKnown19Distances(group, sw, groupLabel) {
    // check if there is a (single) 1/9
    var ind19s = filterIndexes(group, isOnly1or9, 1);
    if (ind19s.length !==1) return false;
    var ind = ind19s[0];

    var [close, far] = waysToSumRange(sw);

    var changed = false;
    for (var c=0; c<9; c++) {
      if (c===ind) continue;
      if (c > ind-close-1 && c < ind+close+1) {
        if (set19off(group[c])) changed = true;
      } else if (c < ind-far-1 || c > ind+far+1) {
        if (set19off(group[c])) changed = true;
      }
    }

    if (changed) {
      consolelog(`[sandwich] cleared 1/9s too close or far from an existing 1/9 in ${groupLabel}`);
      return true;
    }
    return false;
  }

  var useRangeCheck = true;
  function rangeCanSupportSum(group, sw, ind1, ind2) {
    if (!useRangeCheck) return true;
    if (ind2 <= ind1) return false; // should never happen
    var dist = ind2-ind1-1;
    var cands = sumCandidates(sw, dist,dist);
    var candList = candidatesToList(cands);
    for (var i=ind1+1; i<ind2; i++) {
      var cell = group[i];
      var thisCellOK = false;
      for (var vi=0; vi<candList.length; vi++) {
        var v = candList[vi];
        if (cell[v] || cell.solved === v) {
          thisCellOK = true;
          break;
        }
      }
      if (!thisCellOK) return false;
    }
    return true;
  }


  function checkForCandInRange(group, ind, cand, close, far, sw) {
    for (var i=ind-far-1; i<ind-close; i++) {
      if (i<0) continue;
      var cell = group[i];
      if (cell[cand] || cell.solved===cand)
        if (rangeCanSupportSum(group, sw, i, ind))
          return true;
    }
    for (var i=ind+close+1; i<=ind+far+1; i++) {
      if (i>=9) continue;
      var cell = group[i];
      if (cell[cand] || cell.solved===cand)
        if (rangeCanSupportSum(group,sw,ind,i))
          return true;
    }
    return false;
  }

  function sanwichIndividual19Eligibility(group, sw, groupLabel) {
    // i don't think this is useful for more than like 5 candidates, but unsure
    var [close, far] = waysToSumRange(sw);
    var changed = false;
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (cell[0] && !checkForCandInRange(group,c,8,close,far,sw)) {
        cell[0] = false;
        changed = true;
      }
      if (cell[8] && !checkForCandInRange(group,c,0,close,far,sw)) {
        cell[8] = false;
        changed = true;
      }
    }
    if (changed) {
      consolelog(`[sandwich] removed candidate 1/9s in ${groupLabel} due to having no complementary 1/9s in range.`);
    }
    return changed;
  }


  // non-static
  function sandwichClearMiddle19s(group, sw, groupLabel) {
    var startInd = 0;
    var endInd = 8;
    for (var i=0; i<9; i++) {
      var cell = group[i];
      if (cell.solved===0 || cell.solved===8) return false;
      if (!cell[0] && !cell[8])
        startInd = i+1;
      else break;
    }
    for (var i=8; i>=startInd; i--) {
      var cell = group[i];
      if (cell.solved===0 || cell.solved===8) return false;
      if (!cell[0] && !cell[8])
        endInd = i-1;
      else break;
    }
    
    // not sure if this applies for being closer together
    if (endInd-startInd < 2) return false;

    var [minSpread, maxSpread] = waysToSumRange(sw);
    
    // disable 1/9 for any cells that are too close to both sides
    var changed = false;
    for (var i=startInd; i<=endInd; i++) {
      if (i <= startInd+minSpread && i >= endInd-minSpread) {
        if (set19off(group[i])) changed = true;
      }
    }
    if (changed) {
      consolelog(`[sandwich] removed 1/9 from middle of ${groupLabel} due to adjusted outer bounds.`);
      return true;
    } return false;
  }

  function oneWayToSum(sw) {
    var ways = waysToSum(sw);
    if (ways.length === 1)
      return ways[0];
    return undefined;
  }

  function arrayContains(arr, val) {
    for (var i=0; i<arr.length; i++)
      if (arr[i]===val) return true;
    return false;
  }

  function sandwichOneWayOutside(group, sw, groupLabel) {

    // if the sw complement can only be summed one way (usually only 1 digit but not always),
    // then its one way of summing can't be right on the edge.
    var wayToSum = oneWayToSum(35-sw);
    if (wayToSum === undefined) return false;

    // the cells that must be on the outside of the 1/9
    // cannot be too close to the middle
    var changed = false;
    for (var c=wayToSum.length; c<9-wayToSum.length; c++) {
      var cell = group[c];
      for (var i=0; i<wayToSum.length; i++) {
        var v = wayToSum[i]-1;
        if (cell[v]) {
          cell[v] = false;
          changed = true;
        }
      }
    }

    // the cells on the edge can only be values from the sum
    for (var v=1; v<8; v++) {
      if (arrayContains(wayToSum, v+1)) continue;
      if (group[0][v] || group[8][v]) changed = true;
      group[0][v] = group[8][v] = false;
    }

    if (changed) {
      consolelog(`[sandwich] ${groupLabel}'s outside sandwich value ${35-sw} limits edge cells to ${wayToSum}, and may limit these values towards the center.`);
      return true;
    }
    return false;
  }


  function ensureIndices(arr) {
    if (arguments.length<3) return;
    if (arr[arguments[1]]===undefined)
      arr[arguments[1]] = [];
    // call the same function with a modified version of the arguments
    ensureIndices(arr[arguments[1]], ...(Array.from(arguments).slice(2)));
  }

  var sumCandidatesCache = [];
  function sumCandidates(sw, min=0, max=9) {
    // use cache if it exists
    ensureIndices(sumCandidatesCache,sw,min,max);
    if (sumCandidatesCache[sw][min][max] !== undefined)
      return sumCandidatesCache[sw][min][max];

    // figure out the candidates
    var ways = waysToSum(sw);
    var cands = [];
    for (var w=0; w<ways.length; w++) {
      var way = ways[w];
      if (way.length < min || way.length > max) continue;
      for (var i=0; i<way.length; i++)
        cands[way[i]-1] = true;
    }

    // cache result
    sumCandidatesCache[sw][min][max] = cands;
    return cands;
  }

  function candidatesToList(cands) {
    var out = [];
    for (var v=1; v<8; v++)
      if (cands[v])
        out.push(v);
    return out;
  }

  function candidatesToNegativeList(cands) {
    var out = [];
    for (var v=1; v<8; v++)
      if (!cands[v])
        out.push(v);
    return out;
  }

  var waysToSumRangeCache = [];
  function waysToSumRange(total) {
    if (waysToSumRangeCache[total])
      return waysToSumRangeCache[total];

    var ways = waysToSum(total)
    if (ways.length>0) {
      var minLength = 99;
      var maxLength = -1;
      for (var i=0; i<ways.length; i++) {
        var len = ways[i].length;
        if (len < minLength) minLength = len;
        if (len > maxLength) maxLength = len;
      }
      var result = [minLength, maxLength];
      waysToSumRangeCache[total] = result;
      return result;
    } else {
      waysToSumRangeCache[total] = [0,0];
      return [0,0];
    }
  }

  var waysToSumCache = [];
  function waysToSum(total) {
    if (waysToSumCache[total] === undefined)
      waysToSumCache[total] = waysToSumAux(total, [2,3,4,5,6,7,8]);
    return waysToSumCache[total];
  }

  function waysToSumAux(total, vals) {
    // can't sum to less than 2 or more than 35
    if (total<2)  return [];
    if (total>35) return [];

    // base case
    if (vals.length===0) return [];

    // single case
    if (vals.length===1)
      if (vals[0]===total)
        return [[vals[0]]];
      else
        return [];

    // two or more
    var ways = [];
    for (var i=vals.length-1; i>=0; i--) {
      var val = vals[i];
      if (val > total) continue;
      else if (val === total) {
        ways.push([val]);
      } else {
        var smallerVals = vals.slice(0,i);
        var subWays = waysToSumAux(total-val, smallerVals);
        for (var w=0; w<subWays.length; w++) {
          subWays[w].push(val);
        }
        ways = ways.concat(subWays);
      }
    }
    return ways;
  }

  // static
  function sandwichOneWayInside(group, sw, groupLabel) {
    // if the sw can only be summed one way (usually only 1 digit but not always),
    // then its one way of summing can't be right on the edge.
    var wayToSum = oneWayToSum(sw);
    if (wayToSum === undefined) return false;

    var changed = false;
    for (var i=0; i<wayToSum.length; i++) {
      var v = wayToSum[i]-1;
      if (group[0][v] || group[8][v]) {
        group[0][v] = group[8][v] = false;
        changed = true;
      }
    }

    if (changed) {
      consolelog(`[sandwich] ${groupLabel}'s sandwich value ${sw} eliminates ${wayToSum} from edge cells, and may limit these values towards the center.`);
      return true;
    }
    return false;
  }

  function sandwichTwoKnown19s(group, sw, groupLabel) {
    // fullySet means that we have now extracted all possible
    // information from the sandwich value for this group.
    var fullySet = false;

    var ind19s = filterIndexes(group, isOnly1or9, 2);
    if (ind19s.length !== 2) return;

    // the indexes of the two 19s
    var [ind1,ind2] = ind19s;

    // the number of cells between the 19s
    var cellsBetween = ind2-ind1-1;

    // the cells inside and outside the 19s
    var cellsOut = [];
    var cellsIn = [];
    for (var i=0; i<9; i++) {
      var cell = group[i];
      if (i<ind1)           cellsOut.push(cell);
      if (i>ind1 && i<ind2) cellsIn.push(cell);
      if (i>ind2)           cellsOut.push(cell);
    }

    // the possible candidates for the in and out sets
    var candsIn = [];
    var candsOut = [];
    for (var c=0; c<cellsIn.length; c++) {
      var cell = cellsIn[c];
      for (var v=1; v<8; v++)
        if (cell[v] || cell.solved===v)
          candsIn[v] = true;
    }
    for (var c=0; c<cellsOut.length; c++) {
      var cell = cellsOut[c];
      for (var v=1; v<8; v++)
        if (cell[v] || cell.solved===v)
          candsOut[v] = true;
    }

    // candidates for between the 19s
    var inWays = waysToSum(sw);
    var inAllowed = [];
    var inWaysConsidered = 0;
    for (var w=0; w<inWays.length; w++) {
      var way = inWays[w];
      // only ways of the right length
      if (way.length !== cellsBetween) continue;

      // only ways where each number can be placed
      if (inWays.length !== 1) {
        var wayValid = true;
        for (var i=0; i<way.length; i++) {
          if (candsIn[way[i]-1]) continue;
          wayValid = false;
          break;
        }
        if (!wayValid) continue;
      }

      // mark all the candidates for this way
      inWaysConsidered++;
      for (var c=0; c<way.length; c++)
        inAllowed[way[c]-1] = true;
    }
    // if there was only one valid way to sum the inside,
    // this group is now fully set
    if (inWaysConsidered === 1)
      fullySet = true;


    // candidates for outside the 19s
    var outWays = waysToSum(35-sw);
    var outAllowed = [];
    var outWaysConsidered = 0;
    for (var w=0; w<outWays.length; w++) {
      var way = outWays[w];

      // only ways of the right length
      if (way.length !== 7-cellsBetween) continue;

      // only ways where each number can be placed
      if (outWays.length !== 1) {
        var wayValid = true;
        for (var i=0; i<way.length; i++) {
          if (candsOut[way[i]-1]) continue;
          wayValid = false;
          break;
        }
        if (!wayValid) continue;
      }

      // mark all the candidates for this way
      outWaysConsidered++;
      for (var c=0; c<way.length; c++)
        outAllowed[way[c]-1] = true;
    }
    // if there was only one valid way to sum the outside,
    // this group is now fully set
    if (outWaysConsidered === 1)
      fullySet = true;

    // MAKE ACTUAL CHANGES FINALLY
    var changed = false;
    // set candidates for inCells
    for (var i=0; i<cellsIn.length; i++) {
      var cell = cellsIn[i];
      for (var v=1; v<8; v++) {
        if (cell[v]===false) continue;
        if (inAllowed[v]) continue;
        cell[v] = false;
        changed = true;
      }
    }

    for (var i=0; i<cellsOut.length; i++) {
      var cell = cellsOut[i];
      for (var v=1; v<8; v++) {
        if (cell[v]===false) continue;
        if (outAllowed[v]) continue;
        cell[v] = false;
        changed = true;
      }
    }

    // if this group is now fully set, mark it
    // so we don't waste time on it later.
    if (fullySet && group.sandwichFullySet!==true) {
      group.sandwichFullySet = true;
      changed = true;
    }

    if (changed) {
      consolelog(`[sandwich] due to known distance between 1/9s in ${groupLabel}, we can restrict candidates within and without them.`);
      return true;
    } return false;

    // we should mark groups "sandwichComplete" SOMETIMES after this
    // operation. if we have done all we can from the sw constraint
    // (including naked quads etc) we won't need the info any more.
  }


  function outsideCandidates(group, sw, groupLabel) {
    var ind19s = filterIndexes(group, couldBe1or9);
    if (ind19s.length < 2) return false;

    // figure out known outside cells
    var startInd = ind19s[0];
    var endInd   = ind19s[ind19s.length-1];
    var minOutsideCells = 8-(endInd-startInd);

    // figure out which candidates could be part of an outside sum
    var outsideCands = sumCandidates(35-sw, minOutsideCells);
    var outDisallowed = candidatesToNegativeList(outsideCands);
    
    // this is useless if the outside candidates cover all values
    if (outDisallowed.length >= 7) return false;

    // check if any confirmed-outside cells have outside disallowe values
    var changed = false;
    for (var c=0; c<=startInd; c++) {
      var cell = group[c];
      for (var i=0; i<outDisallowed.length; i++) {
        var v = outDisallowed[i];
        if (cell[v]) {
          cell[v] = false;
          changed = true;
        }
      }
    }
    for (var c=8; c>=endInd; c--) {
      var cell = group[c];
      for (var i=0; i<outDisallowed.length; i++) {
        var v = outDisallowed[i];
        if (cell[v]) {
          cell[v] = false;
          changed = true;
        }
      }
    }

    if (changed) consolelog(`[sandwich] eliminated candidates in cells of ${groupLabel} known to be on the outside of the 1/9.`);
    return changed;
  }

  
  var sandwichStaticFinished = false;
  function sandwichElims() {
    if (!sandwichStaticFinished) {
      // these do ALMOST the same thing, but not exactly the same thing
      // if i improved one of them, they would be equivalent
      if (everyRowColSandwich(sandwichOneWayInside)) return true;
      if (everyRowColSandwich(sandwichOneWayOutside)) return true;
      else sandwichStaticFinished = true; // all static analyses are finished, so don't try again later
    }

    // clear impossible distances from 1/9s
    if (everyRowColSandwich(sandwichKnown19Distances)) return true;

    // clear 1/9s too close to both sides (dynamic to cells with 1/9s disabled)
    if (everyRowColSandwich(sandwichClearMiddle19s)) return true;

    // set known 1/9s when outer sum is done
    if (everyRowColSandwich(sandwichOuterDone)) return true;

    // consider if every candidate 1 OR 9 has any 9s or 1s in range
    // if (everyRowColSandwich(sandwichOtherCandInRange)) return true;

    // when there are exactly two known 1/9s, sometimes we can restrict candidates
    // inside and outside these cells
    if (everyRowColSandwich(sandwichTwoKnown19s)) return true;

    // check every candidate 1 and 9 to see if there could be a 9 or 1 in range
    if (everyRowColSandwich(sanwichIndividual19Eligibility)) return true;

    // restrict cells known to be outside to outside-applicable candidates
    if (everyRowColSandwich(outsideCandidates)) return true;

    return false;
  }






/*
     CCCCC  LL      EEEEEEE   AAA   RRRRRR       AAA   DDDDD       JJJ
    CC    C LL      EE       AAAAA  RR   RR     AAAAA  DD  DD      JJJ
    CC      LL      EEEEE   AA   AA RRRRRR     AA   AA DD   DD     JJJ
    CC    C LL      EE      AAAAAAA RR  RR     AAAAAAA DD   DD JJ  JJJ
     CCCCC  LLLLLLL EEEEEEE AA   AA RR   RR    AA   AA DDDDDD   JJJJJ
*/

  // clear candidates from all cells visible to newly confirmed cells.
  function clearAdjacents() {
    var changed = false;
    while(newCellsConfirmed.length > 0) {
      var cell = newCellsConfirmed.pop();
      if (isSolved(cell)) {
        changed = clearAfterConfirm(cell) || changed;
      } else {
        // somehow one of the cells in newCellsConfirmed isn't solved.
        // this should never happen - something is broken somewhere.
        console.error("Something went very wrong with newCellsConfirmed.");
      }
    }
    if (changed) consolelog("Cleared candidates adjacent to confirmed cells.");
    return changed;
  }


/*
    HH   HH DDDDD   NN   NN     SSSSS  IIIII NN   NN   GGGG  LL      EEEEEEE  SSSSS
    HH   HH DD  DD  NNN  NN    SS       III  NNN  NN  GG  GG LL      EE      SS
    HHHHHHH DD   DD NN N NN     SSSSS   III  NN N NN GG      LL      EEEEE    SSSSS
    HH   HH DD   DD NN  NNN         SS  III  NN  NNN GG   GG LL      EE           SS
    HH   HH DDDDDD  NN   NN     SSSSS  IIIII NN   NN  GGGGGG LLLLLLL EEEEEEE  SSSSS
*/
  function findSingleCase(coll, val) {
    for (var i=0; i<9; i++)
      if (coll[i][val]) return coll[i];
    return false;
  }

  function hiddenSingles() {
    // var changedCells = [];
    // var changedCellLabels = [];
    var changedGroups = [];
    for (var i=0; i<9; i++) {
      var row = sudoku[i];
      var col = sudokuCols[i];
      var box = sudokuBoxes[i];
      var groups = [row, col, box];
      var counts = [[0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0]];

      // count each item's possibility count in each row/col/box
      for (var g=0; g<groups.length; g++) {
        var group = groups[g]; // row, col, or box
        for (var c=0; c<9; c++) {
          var cell = group[c];
          for (var v=0; v<9; v++) {
            if (cell[v]) counts[g][v]++;
          }
        }
      }

      // set any 1s to that cell
      for (var g=0; g<groups.length; g++) {
        var group = groups[g];
        for (var v=0; v<9; v++) {
          if (counts[g][v] === 1) {
            var cell = findSingleCase(group, v);
            confirmCell(cell, v);
            if (changedGroups.indexOf(group.groupName) === -1) {
              changedGroups.push(group.groupName);
            }
          }
        }
      }
    }
    if (changedGroups.length > 0) {
      changedGroups.sort();
      consolelog("Hidden Singles found in " + changedGroups.join(", ") + ".");
      return true;
    }
    return false;
  }

/*
    NN   NN KK  KK DDDDD       SSSSS  IIIII NN   NN   GGGG  LL      EEEEEEE  SSSSS
    NNN  NN KK KK  DD  DD     SS       III  NNN  NN  GG  GG LL      EE      SS
    NN N NN KKKK   DD   DD     SSSSS   III  NN N NN GG      LL      EEEEE    SSSSS
    NN  NNN KK KK  DD   DD         SS  III  NN  NNN GG   GG LL      EE           SS
    NN   NN KK  KK DDDDDD      SSSSS  IIIII NN   NN  GGGGGG LLLLLLL EEEEEEE  SSSSS
*/

  function candidateCount(cell) {
    var n = 0;
    for (var i=0; i<9; i++) if (cell[i]) n++;
    return n;
  }

  function getSingleOption(cell) {
    for (var i=0; i<9; i++) if (cell[i]) return i;
    return -1;
  }

  function nakedSingles() {
    var singles = [];
    for (var r=0; r<9; r++) {
      for (var c=0; c<9; c++) {
        var cell = sudoku[r][c];
        if (candidateCount(cell) === 1) {
          singles.push(cell);
        }
      }
    }
    var changes = [];
    var changeVal = -1;
    for (var i=0; i<singles.length; i++) {
      var cell = singles[i];
      var v = getSingleOption(cell);
      confirmCell(cell, v);
      changes.push(cell.pos);
      changeVal = v;
    }
    if (changes.length === 1) {
      consolelog("Naked Single (" + (changeVal+1) + ") found at " + changes[0] + ".");
      return true;
    } else if (changes.length > 1) {
      consolelog("Naked Singles found at " + changes.join(", ") + ".");
      return true;
    }
    return false;
  }

/*
    IIIII NN   NN TTTTTTT EEEEEEE RRRRRR   SSSSS  EEEEEEE  CCCCC  TTTTTTT    RRRRRR  MM    MM VV     VV LL
     III  NNN  NN   TTT   EE      RR   RR SS      EE      CC    C   TTT      RR   RR MMM  MMM VV     VV LL
     III  NN N NN   TTT   EEEEE   RRRRRR   SSSSS  EEEEE   CC        TTT      RRRRRR  MM MM MM  VV   VV  LL
     III  NN  NNN   TTT   EE      RR  RR       SS EE      CC    C   TTT      RR  RR  MM    MM   VV VV   LL
    IIIII NN   NN   TTT   EEEEEEE RR   RR  SSSSS  EEEEEEE  CCCCC    TTT      RR   RR MM    MM    VVV    LLLLLLL
*/

  function optionsConfined(group, otherGroupType) {
    var mins = [10, 10, 10, 10, 10, 10, 10, 10, 10];
    var maxs = [-1, -1, -1, -1, -1, -1, -1, -1, -1];

    // get the min and max value for grouptype (row/col/box) for
    // each cell holding each value.
    for (var c=0; c<9; c++) {
      var cell = group[c];
      for (var v=0; v<9; v++) {
        if (cell[v]) {
          mins[v] = Math.min(mins[v], cell[otherGroupType]);
          maxs[v] = Math.max(maxs[v], cell[otherGroupType]);
        }
      }
    }

    // when the min is the max, store that value in the below array.
    var totals = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
    for (var v=0; v<9; v++) {
      if (mins[v] == maxs[v]) {
        totals[v] = mins[v];
      }
    }

    return totals;
  }


  function clearExceptGroup(thisgroup, othergrouptype, othergroup, v) {
    var changed = false;
    for (var i=0; i<9; i++) {
      var cell = thisgroup[i];
      if (cell[othergrouptype] !== othergroup) {
        if (cell[v]) {
          cell[v] = false;
          changed = true;
        }
      }
    }
    return changed;
  }

  function intersectionRemoval() {
    var changes = [];

    for (var i=0; i<9; i++) {
      var row = sudoku[i];
      var col = sudokuCols[i];
      var box = sudokuBoxes[i];

      var rowConfines    = optionsConfined(row, 'box');
      var colConfines    = optionsConfined(col, 'box');
      var boxConfinesRow = optionsConfined(box, 'row');
      var boxConfinesCol = optionsConfined(box, 'col');
      
      for (var v=0; v<9; v++) {
        if (rowConfines[v] >= 0) {
          // clear v from the box, apart from this row
          var intersectedBox = sudokuBoxes[rowConfines[v]];
          if (clearExceptGroup(intersectedBox, 'row', i, v)) {
            changes.push([row, intersectedBox, v]);
          }
        }
        if (colConfines[v] >= 0) {
          // clear v from the box, apart rom this col
          var intersectedBox = sudokuBoxes[colConfines[v]];
          if (clearExceptGroup(intersectedBox, 'col', i, v)) {
            changes.push([col, intersectedBox, v]);
          }
        }
        if (boxConfinesRow[v] >= 0) {
          // clear v from the row, apart from this box
          var intersectedRow = sudoku[boxConfinesRow[v]];
          if (clearExceptGroup(intersectedRow, 'box', i, v)) {
            changes.push([box, intersectedRow, v]);
          }
        }
        if (boxConfinesCol[v] >= 0) {
          // clear v from the col, apart from this box
          var intersectedCol = sudokuCols[boxConfinesCol[v]];
          if (clearExceptGroup(intersectedCol, 'box', i, v)) {
            changes.push([box, intersectedCol, v]);
          }
        }
      } 
    } 

    if (changes.length === 0) return false;
    for (var i=0; i<changes.length; i++) {
      var [group1,group2,v] = changes[i];
      consolelog("Intersection on value " + (v+1) + " between " + group1.groupName + " and " + group2.groupName + ".");
    }
    return true;
  }


/*
    NN   NN KK  KK DDDDD      PPPPPP    AAA   IIIII RRRRRR   SSSSS
    NNN  NN KK KK  DD  DD     PP   PP  AAAAA   III  RR   RR SS
    NN N NN KKKK   DD   DD    PPPPPP  AA   AA  III  RRRRRR   SSSSS
    NN  NNN KK KK  DD   DD    PP      AAAAAAA  III  RR  RR       SS
    NN   NN KK  KK DDDDDD     PP      AA   AA IIIII RR   RR  SSSSS
*/

  function moreThanLeft(group, n) {
    var count = 0;
    for (var i=0; i<9; i++)
      if (!isSolved(group[i]))
        count++;
    return (count > n);
  }

  function moreThanTwoLeft(group)   { return moreThanLeft(group, 2); }
  function moreThanThreeLeft(group) { return moreThanLeft(group, 3); }
  function moreThanFourLeft(group)  { return moreThanLeft(group, 4); }

  // the cells that have two candidates
  function getTwos(group) {
    var cells = [];
    for (var c=0; c<9; c++)
      if (candidateCount(group[c]) === 2)
        cells.push(group[c]);
    return cells;
  }

  // get the cells that have three candidates
  function getThrees(group) {
    var cells = [];
    for (var c=0; c<9; c++)
      if (candidateCount(group[c]) === 3)
        cells.push(group[c]);
    return cells;
  }

  // the values that are in two cells
  function getValTwos(group) {
    var vals = [];
    for (var v=0; v<9; v++)
      if (countPossibleCells(group, v) === 2)
      vals.push(v);
    return vals;
  }

  function getCandidates(cell) {
    var candidates = [];
    for (var v=0; v<9; v++) {
      if (cell[v])
        candidates.push(v);
    }
    return candidates;
  }

  function sameCandidates(cell1, cell2) {
    for (var v=0; v<9; v++) {
      if (cell1[v] ^ cell2[v])
        return false;
    }
    return true;
  }

  function everyGroupConcat(groupFunc) {
    var changes = [];
    var groupings = [sudoku, sudokuCols, sudokuBoxes];
    for (var g=0; g<3; g++) {
      var grouping = groupings[g];
      for (var i=0; i<9; i++) {
        var group = grouping[i];
        var ch = groupFunc(group);
        changes = changes.concat(ch);
      }
    }
    return changes;
  }

  function everyGroupPush(groupFunc) {
    var changes = [];
    var groupings = [sudoku, sudokuCols, sudokuBoxes];
    for (var g=0; g<3; g++) {
      var grouping = groupings[g];
      for (var i=0; i<grouping.length; i++) {
        var group = grouping[i];
        var ch = groupFunc(group);
        if (ch) changes.push(ch);
      }
    }
    return changes;
  }

  function everyRowCol(groupFunc) {
    var changed = false;
    var groupings = [sudoku, sudokuCols];
    for (var g=0; g<3; g++) {
      var grouping = groupings[g];
      for (var i=0; i<9; i++) {
        var group = grouping[i];
        changed = groupFunc(group) || changed;
      }
    }
    return changed;
  }

  function everyGroup(groupFunc, noBoxes=false) {
    var changed = false;
    var groupings = [sudoku, sudokuCols, sudokuBoxes];
    if (noBoxes) groupings = [sudoku,sudokuCols];
    for (var g=0; g<3; g++) {
      var grouping = groupings[g];
      for (var i=0; i<9; i++) {
        var group = grouping[i];
        changed = groupFunc(group) || changed;
      }
    }
    return changed;
  }


  function sameCell(cell1, cell2) {
    return (cell1.pos === cell2.pos);
  }

  function clearNakedPair(group, val1, val2, cell1, cell2) {
    var changed = false;
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (!sameCell(cell, cell1) && !sameCell(cell, cell2)) {
        changed = changed || cell[val1] || cell[val2];
        cell[val1] = false;
        cell[val2] = false;
      }
    }
    return changed;
  }

  function nakedPairsGroup(group) {
    // changed = false;
    var changes = [];
    if (moreThanTwoLeft(group)){
      var twos = getTwos(group);
      for (var t1=0; t1<twos.length; t1++) {
        for (var t2=0; t2<t1; t2++) {
          if (sameCandidates(twos[t1], twos[t2])) {
            var [cand1, cand2] = getCandidates(twos[t1])
            if (clearNakedPair(group,cand1,cand2,twos[t1],twos[t2])) {
              changes.push([group, cand1, cand2]);
            }
          }
        }
      }
    }
    return changes;
  }

  function nakedPairs() {
    var changes = everyGroupConcat(nakedPairsGroup);
    if (changes.length === 0) return false;
    for (var i=0; i<changes.length; i++) {
      var [group,cand1,cand2] = changes[i];
      consolelog("Naked Pair " + vstr2(cand1,cand2) + " found in " + group.groupName + ".");
    }
    return true;
  }

/*
    NN   NN KK  KK DDDDD      TTTTTTT RRRRRR  IIIII PPPPPP  LL      EEEEEEE
    NNN  NN KK KK  DD  DD       TTT   RR   RR  III  PP   PP LL      EE
    NN N NN KKKK   DD   DD      TTT   RRRRRR   III  PPPPPP  LL      EEEEE
    NN  NNN KK KK  DD   DD      TTT   RR  RR   III  PP      LL      EE
    NN   NN KK  KK DDDDDD       TTT   RR   RR IIIII PP      LLLLLLL EEEEEEE
*/

  function combinedCandidateCount(cell1, cell2) {
    var count=0;
    for (var v=0; v<9; v++) {
      if (cell1[v] || cell2[v]) count++;
    }
    return count;
  }

  function combinedCandidateCount3(cell1, cell2, cell3) {
    var count=0;
    for (var v=0; v<9; v++) {
      if (cell1[v] || cell2[v] || cell3[v]) count++;
    }
    return count;
  }

  function combinedCandidateCount4(cell1, cell2, cell3, cell4) {
    var count=0;
    for (var v=0; v<9; v++) {
      if (cell1[v] || cell2[v] || cell3[v] || cell4[v]) count++;
    }
    return count;
  }

  function combinedCandidates(cell1, cell2) {
    var candidates = [];
    for (var v=0; v<9; v++) {
      if (cell1[v] || cell2[v]) {
        candidates.push(v);
      }
    }
    return candidates;
  }

  function combinedCandidates3(cell1, cell2, cell3) {
    var candidates = [];
    for (var v=0; v<9; v++) {
      if (cell1[v] || cell2[v] || cell3[v]) {
        candidates.push(v);
      }
    }
    return candidates;
  }

  function combinedCandidates4(cell1, cell2, cell3, cell4) {
    var candidates = [];
    for (var v=0; v<9; v++) {
      if (cell1[v] || cell2[v] || cell3[v] || cell4[v]) {
        candidates.push(v);
      }
    }
    return candidates;
  }

  function clearNakedTriple(group, i1, i2, i3, cand1, cand2, cand3) {
    var changed = false;
    for (var c=0; c<9; c++) {
      if (c!==i1 && c!==i2 && c!==i3) {
        var cell = group[c];
        changed = changed || cell[cand1] || cell[cand2] || cell[cand3];
        cell[cand1] = false;
        cell[cand2] = false;
        cell[cand3] = false;
      }
    }
    return changed;
  }

  function clearNakedQuad(group, i1, i2, i3, i4, cand1, cand2, cand3, cand4) {
    var changed = false;
    for (var c=0; c<9; c++) {
      if (c!==i1 && c!==i2 && c!==i3 && c!==i4) {
        var cell = group[c];
        changed = changed || cell[cand1] || cell[cand2] || cell[cand3] || cell[cand4];
        cell[cand1] = false;
        cell[cand2] = false;
        cell[cand3] = false;
        cell[cand4] = false;
      }
    }
    return changed;
  }

  function nakedTriplesGroup(group) {
    if (!moreThanThreeLeft(group)) return false;

    //get the indexes of items with three or fewer options
    var threeOrLessInds = [];
    for (var c=0; c<9; c++) {
      if ( (!isSolved(group[c])) && candidateCount(group[c]) <= 3) {
        threeOrLessInds.push(c);
      }
    }

    // there needs to be at least three
    if (threeOrLessInds.length < 3) return false;

    // find if any three of these cells contain three candidates in total
    for (var i1=0; i1<threeOrLessInds.length; i1++) {
      var ii1 = threeOrLessInds[i1];
      for (var i2=0; i2<i1; i2++) {
        var ii2 = threeOrLessInds[i2];
        if (combinedCandidateCount(group[ii1], group[ii2]) === 3) {
          // at this point we have two cells whose combined cell count is 3.
          // if we can find a third that still holds this, we are in business.
          for (var i3=i1+1; i3<threeOrLessInds.length; i3++) {
            var ii3 = threeOrLessInds[i3];
            if (combinedCandidateCount3(group[ii1], group[ii2], group[ii3]) === 3) {
              var cands = combinedCandidates3(group[ii1], group[ii2], group[ii3]);
              if (clearNakedTriple(group, ii1,ii2,ii3, cands[0], cands[1], cands[2])) {
                consolelog("Naked Triple " + vstr3(...cands) + " found in " + group.groupName + ".");
                return true;
              }
            }
          }
        }
      }
    }
  }

  function nakedTriples() {
    return everyGroup(nakedTriplesGroup);
  }

/*
    NN   NN KK  KK DDDDD       QQQQQ  UU   UU   AAA   DDDDD
    NNN  NN KK KK  DD  DD     QQ   QQ UU   UU  AAAAA  DD  DD
    NN N NN KKKK   DD   DD    QQ   QQ UU   UU AA   AA DD   DD
    NN  NNN KK KK  DD   DD    QQ  QQ  UU   UU AAAAAAA DD   DD
    NN   NN KK  KK DDDDDD      QQQQ Q  UUUUU  AA   AA DDDDDD
*/

  function nakedQuadsGroup(group) {
    if (!moreThanFourLeft(group)) return false;

    //get the indexes of items with four or fewer options
    var fourOrLessInds = [];
    for (var c=0; c<9; c++) {
      if ( (!isSolved(group[c])) && candidateCount(group[c]) <= 4) {
        fourOrLessInds.push(c);
      }
    }

    // there needs to be at least four
    if (fourOrLessInds.length < 4) return false;

    // find out if any four of these cells contain four candidates in total
    for (var i1=0; i1<fourOrLessInds.length; i1++) {
      var c1 = fourOrLessInds[i1];
      for (var i2=i1+1; i2<fourOrLessInds.length; i2++) {
        var c2 = fourOrLessInds[i2];
        var candCount_c1c2 = combinedCandidateCount(group[c1], group[c2]);
        if (candCount_c1c2 === 3 || candCount_c1c2 === 4) {
          // at this point we have two cells with a combined candidate count of three or four.
          for (var i3=i2+1; i3<fourOrLessInds.length; i3++) {
            var c3 = fourOrLessInds[i3];
            var candCount_c1c2c3 = combinedCandidateCount3(group[c1], group[c2], group[c3]);
            if (candCount_c1c2c3 === 4) {
              // at this point we have three cells with a combined candidate count of four.
              for (var i4=i3+1; i4<fourOrLessInds.length; i4++) {
                var c4 = fourOrLessInds[i4];
                var candCount_all = combinedCandidateCount4(group[c1], group[c2], group[c3], group[c4]);
                if (candCount_all === 4) {
                  // we have four cells that can only be four values. this is a naked quad.
                  var candidates = combinedCandidates4(group[c1], group[c2], group[c3], group[c4]);
                  var [cand1,cand2,cand3,cand4] = candidates;
                  if (clearNakedQuad(group, c1, c2, c3, c4, cand1, cand2, cand3, cand4)) {
                    consolelog("Naked Quad " + vstr4(cand1,cand2,cand3,cand4) + " found in " + group.groupName + ".");
                    return true;
                  }
                }
              }
            }
          }
        }
      }
    }
    return false;
  }

  function nakedQuads() {
    return everyGroup(nakedQuadsGroup);
  }

/*
    HH   HH DDDDD   NN   NN    TTTTTTT RRRRRR  IIIII PPPPPP  LL      EEEEEEE
    HH   HH DD  DD  NNN  NN      TTT   RR   RR  III  PP   PP LL      EE
    HHHHHHH DD   DD NN N NN      TTT   RRRRRR   III  PPPPPP  LL      EEEEE
    HH   HH DD   DD NN  NNN      TTT   RR  RR   III  PP      LL      EE
    HH   HH DDDDDD  NN   NN      TTT   RR   RR IIIII PP      LLLLLLL EEEEEEE
*/

  function mapCount(map) {
    var count = 0;
    for (var i=0; i<map.length; i++)
      if (map.charAt(i) === "1") count++;
    return count;
  }

  function mapOr(map1, map2) {
    var out = "";
    for (var i=0; i<map1.length; i++) {
      if (map1.charAt(i)==="1" || map2.charAt(i)==="1")
        out = out + "1";
      else
        out = out + "0";
    }
    return out;
  }

  function mapOrCount(map1, map2) {
    var count = 0;
    for (var i=0; i<map1.length; i++)
      if (map1.charAt(i)==="1" || map2.charAt(i)==="1") count++;
    return count;
  }

  function mapOrCount3(map1, map2, map3) {
    var count = 0;
    for (var i=0; i<map1.length; i++)
      if (map1.charAt(i)==="1" || map2.charAt(i)==="1" || map3.charAt(i)==="1") count++;
    return count;
  }

  function clearHiddenTriple(group, v1, v2, v3) {
    var changed = false;
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if ((!isSolved(cell)) && (cell[v1] || cell[v2] || cell[v2])) {
        for (var v=0; v<9; v++) {
          if (v!==v1 && v!==v2 && v!==v3) {
            changed = changed || cell[v];
            cell[v] = false;
          }
        }
      }
    }
    return changed;
  }

  function hiddenTripleGroup(group) {
    // we need four or more open cells for this to work
    if (!moreThanThreeLeft(group)) return false;

    //get the values that are found in three or fewer cells
    var vals = [];
    for (var v=0; v<9; v++) {
      var possibleCells = countPossibleCells(group, v);
      if (possibleCells <= 3 && possibleCells > 0)
        vals.push(v);
    }

    // get group maps for all values
    var maps = [];
    for (var vi=0; vi<vals.length; vi++) {
      maps.push(getGroupMap(group, vals[vi]));
    }

    // check if any three overlap to three cells
    for (var i1=0; i1<maps.length; i1++) {
      for (var i2=0; i2<i1; i2++) {
        if (mapOrCount(maps[i1], maps[i2]) === 3) {
          for (var i3=i1+1; i3<maps.length; i3++) {
            // consolelog(maps, i1, i2, i3);
            if (mapOrCount3(maps[i1], maps[i2], maps[i3]) === 3) {
              if (clearHiddenTriple(group, vals[i1], vals[i2], vals[i3])){
                consolelog("Hidden Triple " + vstr3(vals[i2],vals[i1],vals[i3]) + " found in " + group.groupName + ".");
                return true;
              }
            }
          }
        }
      }
    }
  }

  function vstr2(a, b) {
    return "(" + (a+1) + ", " + (b+1) + ")";
  }

  function vstr3(a, b, c) {
    return "(" + (a+1) + ", " + (b+1) + ", " + (c+1) + ")";
  }

  function vstr4(a, b, c, d) {
    return "(" + (a+1) + ", " + (b+1) + ", " + (c+1) + ", " + (d+1) + ")";
  }

  function comand3(a, b, c) {
    return "" + (a+1) + ", " + (b+1) + ", and " + (c+1);
  }

  function hiddenTriples() {
    return everyGroup(hiddenTripleGroup);
  }

/*
    HH   HH DDDDD   NN   NN    PPPPPP    AAA   IIIII RRRRRR   SSSSS
    HH   HH DD  DD  NNN  NN    PP   PP  AAAAA   III  RR   RR SS
    HHHHHHH DD   DD NN N NN    PPPPPP  AA   AA  III  RRRRRR   SSSSS
    HH   HH DD   DD NN  NNN    PP      AAAAAAA  III  RR  RR       SS
    HH   HH DDDDDD  NN   NN    PP      AA   AA IIIII RR   RR  SSSSS
*/

  function countPossibleCells(group, v) {
    var count = 0;
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (!isSolved(cell)) {
        if (cell[v])
          count++;
      }
    }
    return count;
  }

  function getCellMap(cell) {
    if (isSolved(cell)) return "000000000";
    var map = "";
    for (var v=0; v<9; v++) {
      if (cell[v])
        map = map + "1";
      else
        map = map + "0";
    }
    return map;
  }

  function getGroupMap(group, v) {
    var map = "";
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (isSolved(cell)) {
        map = map + "0";
      } else {
        if (cell[v])
          map = map + "1";
        else
          map = map + "0";
      }
    }
    return map;
  }

  function listOfNine(x) {
    return [x,x,x,x,x,x,x,x,x];
  }
  function listOf(x, n) {
    var out = [];
    for (var i=0; i<n; i++)
      out.push(x);
    return out;
  }

  function clearHiddenPair(group, v1, v2, map) {
    var changed = false;
    for (var c=0; c<9; c++) {
      if (map.charAt(c) === "1") {
        var cell = group[c];
        for (var v=0; v<9; v++) {
          if (v !== v1 && v !== v2) {
            if (cell[v]) {
              changed = true;
              cell[v] = false;
            }
          }
        }
      }
    }
    return changed;
  }

  
  function hiddenPairsGroup(group) {
    if (!moreThanTwoLeft(group)) return []
    var vals = getValTwos(group); // the values that are only in two cells
    var maps = [];
    for (var i1=0; i1<vals.length; i1++) {
      var v1 = vals[i1];
      maps.push(getGroupMap(group, v1));
      for (var i2=0; i2<i1; i2++) {
        var v2 = vals[i2];
        if (maps[i2] === maps[i1]) {
          if (clearHiddenPair(group, v2, v1, maps[i1])) {
            return [[group, v2, v1]];
          }
        }
      }
    }
    return [];
  }

  function hiddenPairs() {
    var changes = everyGroupConcat(hiddenPairsGroup);
    if (changes.length === 0) return false;
    for (var i=0; i<changes.length; i++) {
      var [group,v1,v2] = changes[i];
      consolelog("Hidden Pair " + vstr2(v1,v2) + " found in " + group.groupName + ".");
    }
    return true;
  }

/*
    XX    XX        WW      WW IIIII NN   NN   GGGG   SSSSS
     XX  XX         WW      WW  III  NNN  NN  GG  GG SS
      XXXX   _____  WW   W  WW  III  NN N NN GG       SSSSS
     XX  XX          WW WWW WW  III  NN  NNN GG   GG      SS
    XX    XX          WW   WW  IIIII NN   NN  GGGGGG  SSSSS
*/

  String.prototype.nthIndexOf = function(pattern, n) {
    var i = -1;
    while (n-- && i++ < this.length) {
      i = this.indexOf(pattern, i);
      if (i < 0) break;
    }
    return i;
  }

  function getFirst1(str) {
    for (var i=0; i<str.length; i++) {
      if (str.charAt(i)==="1") return i;
    }
    return -1;
  }
  function getSecond1(str) {
    var passed1 = false;
    for (var i=0; i<str.length; i++) {
      if (str.charAt(i)==="1") {
        if (passed1) {
          return i;
        } else {
          passed1 = true;
        }
      }
    }
    return -1;
  }

  function clearXWing(groups, v, g1, g2, y1, y2) {
    var changed = false;
    for (var g=0; g<9; g++) {
      if (g!==g1 && g!==g2) {
        changed = changed || groups[g][y1][v] || groups[g][y2][v];
        groups[g][y1][v] = false;
        groups[g][y2][v] = false;
      }
    }
    return changed;
  }

  function XWingsAux(groups, groupType) {
    for (var v=0; v<9; v++) {
      // var maps = listOfNine("000000000");
      var groupInds = [];
      var maps = [];
      for (var g=0; g<9; g++) {
        var group = groups[g];
        if (countPossibleCells(group, v) === 2) {
          groupInds.push(g);
          var map = getGroupMap(group, v);
          maps.push(map);
          for (var g2i=0; g2i<groupInds.length-1; g2i++) { //don't compare with yourself
            if (maps[g2i] === map) {
              var y1 = getFirst1(map);
              var y2 = getSecond1(map);
              var g2 = groupInds[g2i];
              if (clearXWing(groups, v, g2, g, y1, y2)) {
                consolelog("X-Wing on value " + (v+1) + " found on " + groupType + " " + (g2+1) + " and " + (g+1) + ".");
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  function XWings() {
    return XWingsAux(sudoku, "rows") || XWingsAux(sudokuCols, "cols");
  }

/*
    FFFFFFF IIIII NN   NN NN   NN EEEEEEE DDDDD      XX    XX
    FF       III  NNN  NN NNN  NN EE      DD  DD      XX  XX
    FFFF     III  NN N NN NN N NN EEEEE   DD   DD      XXXX
    FF       III  NN  NNN NN  NNN EE      DD   DD     XX  XX
    FF      IIIII NN   NN NN   NN EEEEEEE DDDDDD     XX    XX
*/

  function clearFinnedXWing(v, y1, y2, x, groupType) {
    var group = sudoku[x];
    if (groupType === 'rows')
      group = sudokuCols[x];
    
    var changed = false;
    var clearBlock = blockInd(y2);
    for (var i=clearBlock*3; i<(clearBlock+1)*3; i++) {
      if (i!==y1 && i!==y2) {
        changed = group[i][v] || changed;
        group[i][v] = false;
      }
    }
    return changed;
  }


  function blockInd(cellInd) {
    if (cellInd<3) return 0;
    if (cellInd<6) return 1;
    return 2;
  }

  // input: list of nine 0s and 1s representing candidate presence.
  // twoMap has exactly two 1s and moreMap has 3 or 4.
  // output: if these maps constitute a finned xwing, the index (base 1)
  // of the side of the xwing with the fin. otherwise "false".
  function FinnedMapMatch(twoMap, moreMap) {
    var y1 = getFirst1(twoMap);
    var y2 = getSecond1(twoMap);
    var b1 = blockInd(y1);
    var b2 = blockInd(y2);

    // a finned x-wing must be over two blocks
    if (b1===b2) return false;

    // make sure moreMap includes the x-wing
    if (moreMap[y1] !== '1') return false;
    if (moreMap[y2] !== '1') return false;
    
    var withB1 = false;
    var withB2 = false;
    for (var i=0; i<9; i++) {
      if (i !== y1 && i !== y2 && moreMap[i]==='1') {
        var ib = blockInd(i);
        if      (ib === b1) withB1 = true;
        else if (ib === b2) withB2 = true;
        else                return false; // candidates with neither blocks
      }
    }
    if (withB1 &&  withB2) return false; // candidates with both blocks
    // return which one index we start with
    if (withB1) return y1 + 1;
    if (withB2) return y2 + 1;
    return false;
  }

  function FinnedXWingsAux(groups, groupType) {
    for (var v=0; v<9; v++) { // values
      var groupInds = [];
      var otherGroupInds = [];
      var maps = [];
      var otherMaps = [];
      // map out groups
      for (var g=0; g<9; g++) {
        var group = groups[g];
        var cellCount = countPossibleCells(group, v);
        if (cellCount === 2) {
          groupInds.push(g);
          maps.push(getGroupMap(group, v));
        } else if (cellCount === 3 || cellCount === 4) {
          otherGroupInds.push(g);
          otherMaps.push(getGroupMap(group, v));
        }
      }
      // at this point groupInds contains the group index of every group with exactly 2 candidates
      // also 'maps' contains the string map (0s and 1s) of value 'v' for that group
      for (var gi=0; gi<groupInds.length; gi++) {
        for (var ogi=0; ogi<otherGroupInds.length; ogi++) {
          var twoMap = maps[gi];
          var moreMap = otherMaps[ogi];
          var finMatch = FinnedMapMatch(twoMap, moreMap);
          if (finMatch) {
            // we have a finned x-wing
            var twoInd = groupInds[gi];
            var moreInd = otherGroupInds[ogi];
            if (clearFinnedXWing(v, twoInd, moreInd, (finMatch-1), groupType)) {
              consolelog("Finned X-Wing (" + (v+1) + ") found on " + groupType + " " + (twoInd+1) + " and (fin) " + (moreInd+1));
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  function FinnedXWings() {
    return FinnedXWingsAux(sudoku, "rows") || FinnedXWingsAux(sudokuCols, "cols");
  }


/*
      AAA   NN   NN TTTTTTT IIIII KK  KK NN   NN IIIII   GGGG  HH   HH TTTTTTT
     AAAAA  NNN  NN   TTT    III  KK KK  NNN  NN  III   GG  GG HH   HH   TTT
    AA   AA NN N NN   TTT    III  KKKK   NN N NN  III  GG      HHHHHHH   TTT
    AAAAAAA NN  NNN   TTT    III  KK KK  NN  NNN  III  GG   GG HH   HH   TTT
    AA   AA NN   NN   TTT   IIIII KK  KK NN   NN IIIII  GGGGGG HH   HH   TTT
*/


  function antiknightElims() {
    if (antiknightAdjs()) return true;
    if (antiknightKillsBox()) return true;
    if (antiknightKillsLine()) return true;
    return false;
  }

  function isKnightAdjacent(cell1, cell2) {
    var r = Math.abs(cell1.row-cell2.row);
    var c = Math.abs(cell1.col-cell2.col);
    if (r===1 && c===2) return true;
    if (r===2 && c===1) return true;
    return false;
  }

  function isRowColAdjacent(cell1, cell2) {
    return (cell1.row===cell2.row || cell1.col===cell2.col);
  }

  function isRowColBoxAdjacent(cell1, cell2) {
    return ( cell1.box===cell2.box || cell1.row===cell2.row || cell1.col===cell2.col);
  }

  function antiknightLineKilled(group, v) {
    // get all the candidates for this value
    var candCells = [];
    var min = -1;
    var max = -1;
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (isSolved(cell)) {
        if (cell.solved===v) return false;
      } else if (cell[v]) {
        candCells.push(cell);
        if (min===-1) min = c;
        else max = c;
      }
    }

    // they can't be spread too far
    if (max-min>4) return false;

    // get all the knight adjacent cells outside this box
    var adjCells = [];
    var adjPos = [];
    for (var c=0; c<candCells.length; c++) {
      var cell = candCells[c];
      var adjs = knightAdjs(cell.col,cell.row);
      for (var a=0; a<adjs.length; a++) {
        var adj = adjs[a];
        if (!adj[v]) continue;
        if (adjPos.indexOf(adj.pos) !== -1) continue;
        adjCells.push(adj);
        adjPos.push(adj.pos);
      }
    }

    // check if any adjacents would kill the group
    for (var a=0; a<adjCells.length; a++) {
      var adj = adjCells[a];
      var allAdjacent = true;
      for (var c=0; c<candCells.length; c++) {
        var cell = candCells[c];
        if (!isKnightAdjacent(cell,adj) && !isRowColBoxAdjacent(cell,adj)) {
          allAdjacent = false;
          break;
        }
      }
      if (allAdjacent) {
        adj[v] = false;
        consolelog(`[antiknight] Cell at ${adj.pos} would eliminate all ${v+1}s from ${group.groupName}`);
        return true;
      }
    }


  }

  function antiknightBoxKilled(b, v) {
    var box = sudokuBoxes[b];

    // get all the candidates for this value
    var candCells = [];
    for (var c=0; c<9; c++) {
      var cell = box[c];
      if (isSolved(cell)) {
        if (cell.solved===v) return false;
      } else if (cell[v])
        candCells.push(cell);
    }

    // a knight can only block 5 cells in a box
    if (candCells.length>5) return false;

    // get all the knight adjacent cells outside this box
    var adjCells = [];
    var adjPos = [];
    for (var c=0; c<candCells.length; c++) {
      var cell = candCells[c];
      var adjs = knightAdjs(cell.col,cell.row);
      for (var a=0; a<adjs.length; a++) {
        var adj = adjs[a];
        if (adj.box===b) continue;
        if (!adj[v]) continue;
        if (adjPos.indexOf(adj.pos) !== -1) continue;
        adjCells.push(adj);
        adjPos.push(adj.pos);
      }
    }

    // check if any adjacents would kill the box
    for (var a=0; a<adjCells.length; a++) {
      var adj = adjCells[a];
      var allAdjacent = true;
      for (var c=0; c<candCells.length; c++) {
        var cell = candCells[c];
        if (!isKnightAdjacent(cell,adj) && !isRowColAdjacent(cell,adj)) {
          allAdjacent = false;
          break;
        }
      }
      if (allAdjacent) {
        adj[v] = false;
        consolelog(`[antiknight] Cell at ${adj.pos} would eliminate all ${v+1}s from Box ${b+1}`);
        return true;
      }
    }
    return false;
  }

  function antiknightKillsBox() {
    var changed = false;
    for (var b=0; b<9; b++)
      for (var v=0; v<9; v++)
        if (antiknightBoxKilled(b,v))
          changed = true;
    return changed;
  }

  function antiknightKillsLine() {
    var changed = false;
    for (var g=0; g<9; g++)
      for (var v=0; v<9; v++) {
        if (antiknightLineKilled(sudoku[g],v)) changed = true;
        if (antiknightLineKilled(sudokuCols[g],v)) changed = true;
      }
    return changed;
  }

  function knightAdjs(x, y) {
    var out = [];
    for (var xx=-2; xx<=2; xx++) {
      if (xx===0) continue;
      for (var yy=-2; yy<=2; yy++) {
        if (yy===0 || Math.abs(xx)===Math.abs(yy)) continue;
        var xout = x+xx;
        if (xout<0 || xout>=9) continue;
        var yout = y+yy;
        if (yout<0 || yout>=9) continue;
        out.push(sudoku[yout][xout]);
      }
    }
    return out;
  }

  function antiknightAdjs() {
    var changed = false;
    for (var r=0; r<9; r++) {
      var row = sudoku[r];
      for (var c=0; c<9; c++) {
        var cell = row[c];
        if (!isSolved(cell)) continue;
        var v = cell.solved;
        var adjs = knightAdjs(c,r);
        for (var i=0; i<adjs.length; i++) {
          var adj = adjs[i];
          changed = changed || adj[v];
          adj[v] = false;
        }
      }
    }
    if (changed) consolelog(`[antiknight] cleared antiknight adjacents`);
    return changed;
  }



/*
    YY   YY        WW      WW IIIII NN   NN   GGGG   SSSSS
    YY   YY        WW      WW  III  NNN  NN  GG  GG SS
     YYYYY  _____  WW   W  WW  III  NN N NN GG       SSSSS
      YYY           WW WWW WW  III  NN  NNN GG   GG      SS
      YYY            WW   WW  IIIII NN   NN  GGGGGG  SSSSS
*/

  function candidateXOR(cell1, cell2) {
    var out = [];
    for (var v=0; v<9; v++)
      if (cell1[v] !== cell2[v])
        out.push(v);
    return out;
  }

  function cellHasExactlyCands(cell, cands) {
    for (var v=0; v<9; v++) {
      if (cands.indexOf(v)===-1) {
        if (cell[v]) return false;
      } else {
        if (!cell[v]) return false;
      }
    }
    return true;
  }

  function findByCands(group, cands) {
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (cellHasExactlyCands(cell, cands)) {
        return cell;
      }
    }
    return false;
  }

  function boxRow(box) {
    if (box===0 || box===1 || box===2) return 0;
    if (box===3 || box===4 || box===5) return 1;
    if (box===6 || box===7 || box===8) return 2;
    return -1;
  }
  function boxCol(box) {
    if (box===0 || box===3 || box===6) return 0;
    if (box===1 || box===4 || box===7) return 1;
    if (box===2 || box===5 || box===8) return 2;
    return -1;
  }

  function YWcoVisibleCells(cell1, cell2) {
    var cells = [];
    if (boxRow(cell1.box)===boxRow(cell2.box)) {
      // wings share a box row
      var box1 = sudokuBoxes[cell1.box];
      var box2 = sudokuBoxes[cell2.box];
      for (var i=0; i<9; i++) {
        if (box1[i].row === cell2.row && box1[i]!==cell2 && !isSolved(box1[i])) cells.push(box1[i]);
        if (box2[i].row === cell1.row && box2[i]!==cell1 && !isSolved(box2[i])) cells.push(box2[i]);
      }
    } else if (boxCol(cell1.box)===boxCol(cell2.box)) {
      // wings share a box col
      var box1 = sudokuBoxes[cell1.box];
      var box2 = sudokuBoxes[cell2.box];
      for (var i=0; i<9; i++) {
        if (box1[i].col === cell2.col && box1[i]!==cell2 && !isSolved(box1[i])) cells.push(box1[i]);
        if (box2[i].col === cell1.col && box2[i]!==cell1 && !isSolved(box2[i])) cells.push(box2[i]);
      }
    } else {
      // no common box row or col. must only be two shared cells (one will be the pivot)
      var corner1 = sudoku[cell1.row][cell2.col];
      var corner2 = sudoku[cell2.row][cell1.col];
      if (!isSolved(corner1)) cells.push(corner1);
      if (!isSolved(corner2)) cells.push(corner2);
    }
    return cells;
  }

  function commonCandidate(cell1, cell2) {
    // returns ONE common candidate between cell1 and cell2
    // returns -1 if there are none.
    for (var v=0; v<9; v++) {
      if (cell1[v] && cell2[v]) return v;
    }
    return -1;
  }

  function clearYWing(pivot, wing1, wing2) {
    var changed = false;
    var covisible = YWcoVisibleCells(wing1, wing2);
    var v = commonCandidate(wing1, wing2);
    for (var i=0; i<covisible.length; i++) {
      var cell = covisible[i];
      if (cell !== pivot) {
        changed = changed || cell[v];
        cell[v] = false;
      }
    }
    if (changed) {
      var cands = combinedCandidates3(pivot, wing1, wing2);
      consolelog("Y-Wing "+vstr3(...cands)+" pivoted on " + pivot.pos + " with wings at " + wing1.pos + " and " + wing2.pos + ".");
      return true;
    }
    return false;
  }

  function YWingRC(group) {
    // consolelog("checking for y-wings...");
    // there needs to be at least three open spots in this group
    if (moreThanTwoLeft(group)){
      // all members must have two candidates
      var twos = getTwos(group);
      for (var t1=0; t1<twos.length; t1++) {
        for (var t2=t1+1; t2<twos.length; t2++) {
          var cell1 = twos[t1];
          var cell2 = twos[t2];
          if (combinedCandidateCount(cell1, cell2) === 3) {
            // two 2-cells in this group can be three candidates together
            var finalCellCands = candidateXOR(cell1, cell2);

            // if they are not in the same box, search the boxes of both ends for the final cell
            if (cell1.box !== cell2.box) {
              var wing2 = findByCands(sudokuBoxes[cell1.box], finalCellCands);
              if (wing2 && wing2.row!==cell2.row && wing2.col!==cell2.col) {
                var pivot = cell1; var wing1 = cell2;
                if (clearYWing(pivot, wing1, wing2)) return true;
              } else {
                wing2 = findByCands(sudokuBoxes[cell2.box], finalCellCands);
                if (wing2 && wing2.row!==cell1.row && wing2.col!==cell1.col) {
                  var pivot = cell2; var wing1 = cell1;
                  if (clearYWing(pivot, wing1, wing2)) return true;
                }
              }
            }

            // search the perpendicular group for the final cell
            if (group.groupType === "row") {
              var wing2 = findByCands(sudokuCols[cell1.col], finalCellCands);
              if (wing2) {
                var pivot = cell1; var wing1 = cell2;
                if (clearYWing(pivot, wing1, wing2)) return true;
              } else {
                wing2 = findByCands(sudokuCols[cell2.col], finalCellCands);
                if (wing2) {
                  var pivot = cell2; var wing1 = cell1;
                  if (clearYWing(pivot, wing1, wing2)) return true;
                }
              }
            } else if (group.groupType === "col") {
              var wing2 = findByCands(sudoku[cell1.row], finalCellCands);
              if (wing2) {
                var pivot = cell1; var wing1 = cell2;
                if (clearYWing(pivot, wing1, wing2)) return true;
              } else {
                wing2 = findByCands(sudoku[cell2.row], finalCellCands);
                if (wing2) {
                  var pivot = cell2; var wing1 = cell1;
                  if (clearYWing(pivot, wing1, wing2)) return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
  }

  function YWings() {
    for (var g=0; g<9; g++) {
      if (YWingRC(sudoku[g]))     return true;
      if (YWingRC(sudokuCols[g])) return true;
    }
    return false;
  }

/*
    ZZZZZ        WW      WW IIIII NN   NN   GGGG   SSSSS
       ZZ        WW      WW  III  NNN  NN  GG  GG SS
      ZZ  _____  WW   W  WW  III  NN N NN GG       SSSSS
     ZZ           WW WWW WW  III  NN  NNN GG   GG      SS
    ZZZZZ          WW   WW  IIIII NN   NN  GGGGGG  SSSSS
*/

  function clearZWing(rowcol, z, box, pivot) {
    var changed = false;
    for (var c=0; c<9; c++) {
      var cell = rowcol[c];
      if (cell.box === box && !sameCell(cell, pivot)) {
        changed = changed || cell[z];
        cell[z] = false;
      }
    }
    return changed;
  }

  function ZWingsBox(box) {
    // get the cells in this box with two and three candidates
    var twos   = getTwos(box);
    var threes = getThrees(box);

    if (twos.length   === 0) return false;
    if (threes.length === 0) return false;
    
    for (var i2=0; i2<twos.length; i2++) {
      for (var i3=0; i3<threes.length; i3++) {
        if (combinedCandidateCount(twos[i2], threes[i3]) === 3) {
          // this box has an XY and an XYZ
          var cellXYZ = threes[i3];
          var cellXZ  = twos[i2];

          // look for the YZ cell in the pivot's column
          if (cellXZ.col !== cellXYZ.col) for (var c=0; c<9; c++) {
            var cellYZ = sudokuCols[cellXYZ.col][c];
            if (cellYZ.box !== cellXYZ.box
              && candidateCount(cellYZ) === 2
              && combinedCandidateCount(cellYZ, cellXYZ) === 3
              && !sameCandidates(cellYZ, cellXZ)) {
              // we have a XYZ-wing
              var Z = commonCandidate(cellXZ, cellYZ);
              if (clearZWing(sudokuCols[cellXYZ.col], Z, cellXYZ.box, cellXYZ)) {
                var cands = getCandidates(cellXYZ);
                consolelog("XYZ-Wing "+vstr3(...cands)+" pivoted on "+cellXYZ.pos+" with wings at "+cellXZ.pos+" and "+cellYZ.pos+".");
                return true;
              } else {
                break; // there can't be another YZ - that would be a naked pair/triple
              }
            }
          }

          // look for the YZ cell in the pivot's row
          if (cellXZ.row !== cellXYZ.row) for (var c=0; c<9; c++) {
            var cellYZ = sudoku[cellXYZ.row][c];
            if (cellYZ.box !== cellXYZ.box
              && candidateCount(cellYZ) === 2
              && combinedCandidateCount(cellYZ, cellXYZ) === 3
              && !sameCandidates(cellYZ, cellXZ)) {
              // we have a XYZ-wing
              var Z = commonCandidate(cellXZ, cellYZ);
              if (clearZWing(sudoku[cellXYZ.row], Z, cellXYZ.box, cellXYZ)) {
                var cands = getCandidates(cellXYZ);
                consolelog("XYZ-Wing "+vstr3(...cands)+" pivoted on "+cellXYZ.pos+" with wings at "+cellXZ.pos+" and "+cellYZ.pos+".");
                return true;
              } else {
                break; // there can't be another YZ - that would be a naked pair/triple
              }
            }
          }
        }
      }
    }
    return false;
  }

  function ZWings() {
    for (var b=0; b<9; b++)
      if (ZWingsBox(sudokuBoxes[b])) return true;
    return false;
  }

/*
     SSSSS  WW      WW  OOOOO  RRRRRR  DDDDD   FFFFFFF IIIII  SSSSS  HH   HH
    SS      WW      WW OO   OO RR   RR DD  DD  FF       III  SS      HH   HH
     SSSSS  WW   W  WW OO   OO RRRRRR  DD   DD FFFF     III   SSSSS  HHHHHHH
         SS  WW WWW WW OO   OO RR  RR  DD   DD FF       III       SS HH   HH
     SSSSS    WW   WW   OOOO0  RR   RR DDDDDD  FF      IIIII  SSSSS  HH   HH
*/

  function clearSwordfish(groups, v, g1, g2, g3, y1, y2, y3) {
    var changed = false;
    for (var g=0; g<9; g++) {
      if (g!==g1 && g!==g2 && g!==g3) {
        changed = changed || groups[g][y1][v] || groups[g][y2][v] || groups[g][y3][v];
        groups[g][y1][v] = false;
        groups[g][y2][v] = false;
        groups[g][y3][v] = false;
      }
    }
    return changed;
  }

  function swordfishAux(groups, groupType) {
    // consider values separately
    for (var v=0; v<9; v++) {
      var groupInds = [];
      var maps = [];
      // consider each group (row or col)
      for (var g=0; g<9; g++) {
        var group = groups[g];
        // we only care about groups with two or three candidates for v
        var groupCellCount = countPossibleCells(group, v);
        if (groupCellCount === 3 || groupCellCount === 2) {
          groupInds.push(g);
          // get a candidate map for v for this group
          var map = getGroupMap(group, v);
          // rememeber it for later
          maps.push(map);
          // look through all the previous maps to see if there are matches
          for (var g2i=0; g2i<groupInds.length-1; g2i++) {
            if (mapOrCount(map, maps[g2i]) === 3) {
              // there are two groups that have three options together. find a third.
              var map12 = mapOr(map, maps[g2i]); // save the first two for later
              for (var g3i=g2i+1; g3i<groupInds.length-1; g3i++) {
                if (mapOrCount(map12, maps[g3i]) === 3) {
                  // there are three groups that have three options together.
                  // this is a swordfish.
                  var g2 = groupInds[g2i];
                  var g3 = groupInds[g3i];
                  var y1 = map12.nthIndexOf("1",1);
                  var y2 = map12.nthIndexOf("1",2);
                  var y3 = map12.nthIndexOf("1",3);
                  if (clearSwordfish(groups,v,g,g2,g3,y1,y2,y3)) {
                    consolelog("Swordfish on value "+(v+1)+" found on "+groupType+" "+comand3(g2,g3,g)+".");
                    return true;
                  }
                }
              }
            }
          }
        }
      }
    }
    return false;
  }

  function swordfish() {
    return swordfishAux(sudoku, "rows") || swordfishAux(sudokuCols, "cols");
  }

/*
     CCCCC  LL      RRRRRR   SSSSS      CCCCC  HH   HH   AAA   IIIII NN   NN  SSSSS
    CC    C LL      RR   RR SS         CC    C HH   HH  AAAAA   III  NNN  NN SS
    CC      LL      RRRRRR   SSSSS     CC      HHHHHHH AA   AA  III  NN N NN  SSSSS
    CC    C LL      RR  RR       SS    CC    C HH   HH AAAAAAA  III  NN  NNN      SS
     CCCCC  LLLLLLL RR   RR  SSSSS      CCCCC  HH   HH AA   AA IIIII NN   NN  SSSSS
*/

  function getOnlyTwoCells(group, v) {
    var out = [];
    for (var c=0; c<9; c++) {
      if (group[c][v]) {
        out.push(group[c]);
      }
    }
    if (out.length === 2)
      return out;
    return false;
  }


  function placeLink(graph, from, to) {
      if (graph[from] === undefined) {
        graph[from] = [to];
      } else if(graph[from].indexOf(to)===-1) {
        graph[from].push(to);
      }
  }

  function otherClr(clr) {
    if (clr==='red')   return 'green';
    if (clr==='green') return 'red';
    return 'whatthefuck';
  }

  function fillStarting(links, colors, start, color) {
    // this point has already been touched. do nothing.
    if (colors[start]) return;

    // set the color of this node.
    colors[start] = color;
    
    // color from each of the adjacent nodes.
    // start with the 'other' color.
    var adjs = links[start];
    var nextColor = otherClr(color);
    for (var i=0; i<adjs.length; i++) {
      fillStarting(links, colors, adjs[i], nextColor);
    }
  }

  function getRedsGreens(links, colors, start) {
    var grns = [];
    var reds = [];

    function step(node) {
      // disregard nodes we have already looked at
      if (grns.indexOf(node)>=0) return;
      if (reds.indexOf(node)>=0) return;

      // put this noe in the right box
      if (colors[node]==='red') {
        reds.push(node);
      } else if (colors[node]==='green') {
        grns.push(node);
      }

      // look at all adjacent nodes
      for (var i=0; i<links[node].length; i++) {
        step(links[node][i]);
      }
    }

    // step through this graph
    step(start);

    return [reds,grns];
  }

  function colorOccursTwiceInOneGroup(labels) {
    var rows = []; var cols = []; var boxes = [];
    for (var i=0; i<labels.length; i++) {
      var cell = sudokuCellsByPos[labels[i]];
      if (rows[cell.row] || cols[cell.col] || boxes[cell.box]) {
        if (rows[cell.row]) {
          return [sudoku[cell.row], rows[cell.row], cell];
        } else if (cols[cell.col]) {
          return [sudokuCols[cell.col], cols[cell.col], cell];
        } else if (boxes[cell.box]) {
          return [sudokuBoxes[cell.box], boxes[cell.box], cell];
        }
      }
      rows[cell.row] = cols[cell.col] = boxes[cell.box] = cell;
    }
    return [false];
  }

  function confirmColor(labels, v) {
    for (var i=0; i<labels.length; i++)
      confirmCell(sudokuCellsByPos[labels[i]], v);
  }

  function simpleColorsVal(v) {
    var links  = [];
    var colors = [];

    // get all the strong links for this value
    var strongLinks = everyGroupPush(g => getOnlyTwoCells(g, v));

    // there needs to be at least three links to solve anything
    if (strongLinks.length < 3) return false;

    // build a set of links between nodes (this represents the graph)
    for (var i=0; i<strongLinks.length; i++) {
      placeLink(links, strongLinks[i][0].pos, strongLinks[i][1].pos);
      placeLink(links, strongLinks[i][1].pos, strongLinks[i][0].pos);
    }

    // get a list of separated graphs, and colour these graphs
    var graphStarts = [];
    for (var i=0; i<strongLinks.length; i++) {
      var node = strongLinks[i][0].pos;
      if (colors[node] === undefined) {
        graphStarts.push(node); // this node is uncolored. it is the start of a new graph.
        fillStarting(links, colors, node, 'red');
      }
    }

    // take a look at each graph
    for (var i=0; i<graphStarts.length; i++) {
      var [reds,grns] = getRedsGreens(links, colors, graphStarts[i]);
      // need at least four points to be a useful graph
      if (reds.length + grns.length > 3) {
        // check if any color occurs twice in a group (Rule 2)
        var [group, cell1, cell2] = colorOccursTwiceInOneGroup(reds);
        var colorWithConflict = 'red';
        if (!group) {
          [group, cell1, cell2] = colorOccursTwiceInOneGroup(grns);
          colorWithConflict = 'green';
        }
        if (group) {
          // there is a conflict! the conflicted color is "colorWithConflict"
          if (colorWithConflict === 'red')   confirmColor(grns, v);
          if (colorWithConflict === 'green') confirmColor(reds, v);
          // report the logic that was followed.
          var path = getPathBetweenCells(links,cell1.pos,cell2.pos).join("->");
          consolelog("Found simple colors chain on value "+(v+1)+". "+path+" starts and ends with odds in "+group.groupName+". Confirming evens.");
          return true;
        } else {
          // there are no "two reds in one group" style conflicts.
          // look for co-visible nodes. (Rule 4)
          var numChanged = findCovisibleToColors(v,reds,grns);
          if (numChanged>0) {
            consolelog("Simple colors chain found on value "+(v+1)+", removing candidates from "+numChanged+" cells. Red: "+reds.join(",")+". Green: "+grns.join(",")+".");
            return true;
          }
        }
      }
    }
    return false;
  }

  function coVisibleCells(cellA, cellB) {
    var cells = [];

    function maybeCell(cell) {
      if (!isSolved(cell) && cell!==cellA && cell!==cellB)
        cells.push(cell);
    }

    if (cellA.box===cellB.box) {
      // cells are in the same box
      var box = sudokuBoxes[cellA.box];
      for (var c=0; c<9; c++) {
        maybeCell(box[c]);
      }
    }

    if (cellA.row===cellB.row) {
      // cells are in the same row
      var row = sudoku[cellA.row];
      for (var c=0; c<9; c++) {
        maybeCell(row[c]);
      }
    } else if(boxRow(cellA.box)===boxRow(cellB.box) && cellA.box!==cellB.box) {
      // cells are in the same 'box row' but not in the same box
      var boxA = sudokuBoxes[cellA.box];
      var boxB = sudokuBoxes[cellB.box];
      for (var c=0; c<9; c++) {
        var cellA2 = boxA[c];
        var cellB2 = boxB[c];
        if (cellA2.row===cellB.row)
          maybeCell(cellA2);
        if (cellB2.row===cellA.row)
          maybeCell(cellB2);
      }
    }

    if (cellA.col===cellB.col) {
      // cells are in the same column
      var col = sudokuCols[cellA.col];
      for (var c=0; c<9; c++) {
        maybeCell(col[c]);
      }
    } else if(boxCol(cellA.box)===boxCol(cellB.box) && cellA.box!==cellB.box) {
      // cells are in the same 'box col' but not in the same box
      var boxA = sudokuBoxes[cellA.box];
      var boxB = sudokuBoxes[cellB.box];
      for (var c=0; c<9; c++) {
        var cellA2 = boxA[c];
        var cellB2 = boxB[c];
        if (cellA2.col===cellB.col)
          maybeCell(cellA2);
        if (cellB2.col===cellA.col)
          maybeCell(cellB2);
      }
    }

    // get the opposite corner cells
    maybeCell(sudoku[cellA.row][cellB.col]);
    maybeCell(sudoku[cellB.row][cellA.col]);

    return cells;
  }

  function findCovisibleToColors(v,reds,grns) {
    var changes = 0;
    for (var r=0; r<reds.length; r++) {
      for (var g=0; g<grns.length; g++) {
        var red = sudokuCellsByPos[reds[r]];
        var grn = sudokuCellsByPos[grns[g]];
        var covis = coVisibleCells(red,grn);
        for (var c=0; c<covis.length; c++) {
          var cell = covis[c];
          if (cell[v]) {
            changes = changes + 1;
            cell[v] = false;
          }
        }
      }
    }
    return changes;
  }

  function getPathBetweenCells(links, start, end, ignore=[]) {
    var adjs = links[start];
    if (adjs.indexOf(end)>=0) {
      return [start, end];
    } else {
      for (var i=0; i<adjs.length; i++) {
        var next = adjs[i];
        if (ignore.indexOf(next)===-1) {
          var path = getPathBetweenCells(links,next,end,ignore.concat([start]));
          if (path) {
            return [start].concat(path);
          }
        }
      }
    }
    return false;
  }

  function partialApply2nd(fn, arg2) {
    return (function(arg1) {
      return fn(arg1, arg2);
    });
  }

  function simpleColors() {
    for (var v=0; v<9; v++)
      if (simpleColorsVal(v)) return true;
  }

/*
     ######  ##     ## ########  ######  ##    ## #### ##    ##  ######
    ##    ## ##     ## ##       ##    ## ##   ##   ##  ###   ## ##    ##
    ##       ##     ## ##       ##       ##  ##    ##  ####  ## ##
    ##       ######### ######   ##       #####     ##  ## ## ## ##   ####
    ##       ##     ## ##       ##       ##  ##    ##  ##  #### ##    ##
    ##    ## ##     ## ##       ##    ## ##   ##   ##  ##   ### ##    ##
     ######  ##     ## ########  ######  ##    ## #### ##    ##  ######
*/

  function checkGroupForEmpties(group, desc) {
    var error = false;
    var counts = [0,0,0,0,0,0,0,0,0];
    // get the number of possibilities for each number in this group
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (isSolved(cell)) {
        counts[cell.solved]++;
      } else {
        for (var v=0; v<9; v++) {
          if (cell[v])
            counts[v]++;
        }
      }
    }

    // check if any are zero
    for (var v=0; v<9; v++) {
      if (counts[v] === 0) {
        consolelog("There can be no " + (v+1) + " in " + desc);
        error = true;
      }
    }
    return error;
  }

  function checkGroupForDuplicates(group, desc) {
    var error = false;
    var solveds = [false,false,false,false,false,false,false,false,false];
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (isSolved(cell)) {
        if (solveds[cell.solved-1]) {
          error = true;
          consolelog("Found two confirmed " + (cell.solved+1) + "s in " + desc);
        }
        solveds[cell.solved-1] = true;
      }
    }
    return error;
  }

  function sandwichEnabled() {
    for (var i=0; i<strats.length; i++)
      if (strats[i].category="Sandwich" && strats[i].enabled) return true;
    return false;
  }

  function antiknightEnabled() {
    for (var i=0; i<strats.length; i++)
      if (strats[i].category="Anti-Knight" && strats[i].enabled) return true;
    return false;
  }

  function checkAntiknightErrors() {
    var errors = false;
    for (var r=0; r<9; r++) {
      var row = sudoku[r];
      for (var c=0; c<9; c++) {
        var cell = row[c];
        if (isSolved(cell)) {
          var adjs = knightAdjs(c,r);
          for (var a=0; a<adjs.length; a++) {
            var adj = adjs[a];
            if (isSolved(adj)) {
              if (adj.solved === cell.solved) {
                errors = true;
                console.error(`Cell at ${cell.pos} has antiknight collisions`);
              }
            }
          }
        }
      }
    }
    return errors;
  }

  function sandwichErrors(group, sw) {
    var outSum = 0;
    var inSum = 0;
    var allSolved = true;
    var inSandwich = false;
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (isSolved(cell)) {
        if (cell.solved===0 || cell.solved===8) {
          inSandwich = !inSandwich;
          continue;
        } else {
          if (inSandwich) inSum  += (cell.solved+1);
          else            outSum += (cell.solved+1);
        }
      } else { 
        allSolved = false;
      }
    }
    if (allSolved && inSum === sw) return false;
    if (!allSolved && inSum <= sw && outSum <= (35-sw)) return false;
    console.error(`${group.groupName} does not match Sandwich constraints.`);
    return true;
  }

  function checkErrors() {
    var errors = false;
    // errors = checkGroupForEmpties(sudoku[0], "row " + (0+1)) || errors;
    for (var r=0; r<9; r++) {
      errors = checkGroupForDuplicates(sudoku[r], "row " + (r+1)) || errors;
      errors = checkGroupForEmpties(sudoku[r], "row " + (r+1)) || errors;
    }

    for (var c=0; c<9; c++) {
      errors = checkGroupForDuplicates(sudokuCols[c], "col " + (c+1)) || errors;
      errors = checkGroupForEmpties(sudokuCols[c], "col " + (c+1)) || errors;
    }

    for (var b=0; b<9; b++) {
      errors = checkGroupForDuplicates(sudokuBoxes[b], "box " + (b+1)) || errors;
      errors = checkGroupForEmpties(sudokuBoxes[b], "box " + (b+1)) || errors;
    }

    if (sandwichEnabled())
      errors = everyRowColSandwich(sandwichErrors, false) || errors;
    
    if (antiknightEnabled())
      errors = checkAntiknightErrors() || errors;

    return errors;
  }

/*
    #### ##    ## #### ######## ####    ###    ##       ####  ######  ########
     ##  ###   ##  ##     ##     ##    ## ##   ##        ##  ##    ## ##
     ##  ####  ##  ##     ##     ##   ##   ##  ##        ##  ##       ##
     ##  ## ## ##  ##     ##     ##  ##     ## ##        ##   ######  ######
     ##  ##  ####  ##     ##     ##  ######### ##        ##        ## ##
     ##  ##   ###  ##     ##     ##  ##     ## ##        ##  ##    ## ##
    #### ##    ## ####    ##    #### ##     ## ######## ####  ######  ########
*/

  // const edgeRegexp = /^(.*(,.*)*)?$/
  function initEdges(data){
    sudokuEdges = [[],[],[],[]];
    var data = data.split(",");
    for (var i=0; i<data.length; i++) {
      var edge = Math.floor(i/9);
      var ind  = i%9;
      if (edge>3) break;
      var edgeVal = data[i];
      var edgeValInt = parseInt(edgeVal);
      if (isNaN(edgeValInt)) {
        sudokuEdges[edge][ind] = edgeVal;
      } else
        sudokuEdges[edge][ind] = edgeValInt;
    }
  }

  function initSudoku(data) {
    if (data) initSudokuData(data);
    else initSudokuBlank();
  }

  function initSudokuBlank() {
    // init lists to zero
    sudoku = [];
    sudokuCols = [];
    sudokuBoxes = [];
    sudokuCellsByPos = [];
    // sudokuEdges = [];
    newCellsConfirmed = [];
    sandwichStaticFinished = false;

    // fill lists with empty lists
    for(var i=0; i<9; i++) {
      sudoku.push([]);
      sudokuCols.push([]);
      sudokuBoxes.push([]);
    }

    for (var i=0; i<9; i++) {
      sudoku[i].groupName = "Row " + (i+1);
      sudoku[i].groupType = "row";
      sudokuCols[i].groupName = "Col " + (i+1);
      sudokuCols[i].groupType = "col";
      sudokuBoxes[i].groupName = "Box " + (i+1);
      sudokuBoxes[i].groupType = "box";
    }

    // make all cells
    for (var c=0; c<9; c++) {
      for(var r=0; r<9; r++) {
        var b = boxNum(r,c);

        // make the cell and fill it with 'true'
        var cell = [];
        for (var v=0; v<9; v++) {
          cell.push(true);
        }
        // record its position on the board
        cell['row'] = r;
        cell['col'] = c;
        cell['box'] = b;
        cell['pos'] = "R" + (r+1) + "C" + (c+1);

        // add it to the lists
        sudoku[r][c] = cell;
        sudokuCols[c][r] = cell;
        sudokuBoxes[b].push(cell);
        sudokuCellsByPos[cell.pos] = cell;
      }
    }
  }

  function makeEmptyCell() {
    var out = [];
    for (var i=1; i<=9; i++)
      out[i] = true;
    return out;
  }
  
  function makeKnownCell(v) {
    var out = [];
    for (var i=1; i<=9; i++)
      out[i] = false;
    out[v-1] = true;
    out['solved'] = v;
    return out;
  }

  function initSudokuData(data) {
    initSudokuBlank();
    importSudokuData(data);
  }

