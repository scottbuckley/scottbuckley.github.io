  
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
    "X Sudoku",
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
    { name:  "Antiknight Eliminations",
      sname: "AK Elims",
      func:  antiknightElims,
      enabled:false,
      category: "Anti-Knight"
    },
    { name:  "X Sudoku Eliminations",
      sname: "X Elims",
      func:  xsudokuElims,
      enabled:false,
      category: "X Sudoku"
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
    {
      name:  "Hidden Quads",
      sname: "Hdn 4s",
      func:  hiddenQuads,
      enabled:true,
      category:"Simple"
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
      enabled: false,
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

  var undoStack = [];



  // solve the sudoku as far as you can.
  // return the solution or "ERROR" or "INCOMPLETE".
  function completeSilently(data) {
    initSudokuData(data);
    while(makeSomeChange(false));
    if (checkErrors()) return "ERROR";
    if (getSolvedCount() < 81) return "INCOMPLETE";
    return getSolvedString();
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



  function isNumber(v) {
    if (isNaN(v)) return false;
    if (v === null) return false;
    if (typeof v === "number") return true;
    return false;
  }

  function isSolved(cell) {
    return cell.isSolved;
  }

  /* CANDIDATE STATS */
  function getSolvedUnsolvedCells(group) {
    if (group.canCache!==true || group.solvedCellsCache === undefined || group.unsolvedCellsCache === undefined) {
      group.solvedCellsCache = [];
      group.unsolvedCellsCache = [];
      for (var c=0; c<group.length; c++) {
        var cell = group[c];
        if (isSolved(cell))
          group.solvedCellsCache.push(cell);
        else
          group.unsolvedCellsCache.push(cell);
      }
    }
    return [group.solvedCellsCache, group.unsolvedCellsCache];
  }

  function getSolvedCells(  group) { return fst(getSolvedUnsolvedCells(group)); };
  function getUnsolvedCells(group) { return snd(getSolvedUnsolvedCells(group)); };

  function candidateCount(cell) {
    var n = 0;
    for (var i=0; i<9; i++) if (cell[i]) n++;
    return n;
  }

  function hasNCandidates(n) {
    return function(cell) {
      var count = 0;
      for (var v=0; v<9; v++)
        if (cell[v])
          if (++count > n) return false;
      return (count===n);
    };
  }

  function hasLessThanNCandidates(n) {
    return function(cell) {
      var count = 0;
      for (var v=0; v<9; v++)
        if (cell[v])
          if (++count >= n) return false;
      return (count<n);
    };
  }

  function fst(arr) { return arr[0]; };
  function snd(arr) { return arr[1]; };

  function moreThanLeft(group, n) {
    return (getUnsolvedCells(group).length > n);
  }

  function moreThanThreeLeft(group) { return moreThanLeft(group, 3) };
  function moreThanFourLeft(group)  { return moreThanLeft(group, 4) };


  // the cells that have two candidates
  function getTwos(group) {
    if (group.canCache) return getUnsolvedCells(group).filter(hasNCandidates(2));
    else                return group                  .filter(hasNCandidates(2));
  }

  // get the cells that have three candidates
  function getThreesOrLess(group) {
    return getUnsolvedCells(group)
      .filter(hasLessThanNCandidates(4))
  }



  /* BOX NUMBERS */
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

  /* EDGES */
  function topEdge()    { return sudokuEdges[0]; }
  function leftEdge()   { return sudokuEdges[1]; }
  function rightEdge()  { return sudokuEdges[2]; }
  function bottomEdge() { return sudokuEdges[3]; }

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


  // the values that are in two cells
  function getValCounts(group) {
    var counts = [0,0,0,0,0,0,0,0,0];
    var unsolved = getUnsolvedCells(group);
    for (var c=0; c<unsolved.length; c++) {
      var cell = unsolved[c];
        for (var v=0; v<9; v++)
          if (cell[v]) counts[v]++;
    }
    return counts;
  }

  function getValTwos(group) {
    var vals = [];
    var counts = getValCounts(group);
    for (var v=0; v<9; v++)
      if (counts[v]===2) vals.push(v);
    return vals;
  }

  function getCandidates(cell) {
    var candidates = [];
    for (var v=0; v<9; v++)
      if (cell[v]) candidates.push(v);
    return candidates;
  }

  function sameCandidates(cell1, cell2) {
    for (var v=0; v<9; v++)
      if (cell1[v] ^ cell2[v]) return false;
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

  function everyCell(func) {
    var changed = false;
    for (var r=0; r<9; r++)
      for (var c=0; c<9; c++)
        if (func(sudoku[r][c]))
          changed = true;
    return changed;
  }

  function everyRowCol(groupFunc, multiple=true) {
    var changed = false;
    var groupings = [sudoku, sudokuCols];
    for (var g=0; g<2; g++) {
      var grouping = groupings[g];
      for (var i=0; i<9; i++) {
        if (groupFunc(grouping[i])) {
          if (!multiple) return true;
          changed = true;
        }
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

  function groupHasNCells(group, v, total) {
    var count = 0;
    for (var i=0; i<group.length; i++)
      if (group[i][v]) if (++count > total) return false;
    return (count === total);
  }


  function countPossibleCells(group, v) {
    var count = 0;
    for (var c=0; c<group.length; c++)
      if (group[c][v]) count++;
    return count;
  }

  function getGroupMap(group, v) {
    var map = "";
    for (var c=0; c<group.length; c++)
        if (group[c][v]) map += "1";
        else             map += "0";
    return map;
  }


  function combinedCandidateCount(cell1, cell2) {
    var count=0;
    for (var v=0; v<9; v++)
      if (cell1[v] || cell2[v]) count++;
    return count;
  }

  function combinedCandidateCount3(cell1, cell2, cell3) {
    var count=0;
    for (var v=0; v<9; v++)
      if (cell1[v] || cell2[v] || cell3[v]) count++;
    return count;
  }

  function combinedCandidateCount4(cell1, cell2, cell3, cell4) {
    var count=0;
    for (var v=0; v<9; v++)
      if (cell1[v] || cell2[v] || cell3[v] || cell4[v]) count++;
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
    for (var v=0; v<9; v++)
      if (cell1[v] || cell2[v] || cell3[v])
        candidates.push(v);
    return candidates;
  }

  function combinedCandidates4(cell1, cell2, cell3, cell4) {
    var candidates = [];
    for (var v=0; v<9; v++)
      if (cell1[v] || cell2[v] || cell3[v] || cell4[v])
        candidates.push(v);
    return candidates;
  }

  function clearCands(group, cands) {
    var changed = false;
    for (var c=0; c<group.length; c++) {
      var cell = group[c];
      for (var i=0; i<cands.length; i++) {
        var v = cands[i];
        if (cell[v]) {
          changed = true;
          cell[v] = false;
        }
      }
    }
    return changed;
  }



  // "or" on binary strings
  function mapOr(map1, map2) {
    var out = "";
    for (var i=0; i<map1.length; i++)
      if (map1.charAt(i)==="1" || map2.charAt(i)==="1")
        out = out + "1";
      else
        out = out + "0";
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

  function mapOrCount4(map1, map2, map3, map4) {
    var count = 0;
    for (var i=0; i<map1.length; i++)
      if (map1.charAt(i)==="1" || map2.charAt(i)==="1" || map3.charAt(i)==="1" || map4.charAt(i)==="1") count++;
    return count;
  }



  function cellHasCands(cell, cands) {
    for (var i=0; i<cands.length; i++)
      if (cell[cands[i]]) return true;
    return false;
  }


  function vstr() {
    return "(" + Array.from(arguments).map(v => v+1).join(",") + ")";
  }

  function comand3(a, b, c) {
    return "" + (a+1) + ", " + (b+1) + ", and " + (c+1);
  }


  function candidateXOR(cell1, cell2) {
    var out = [];
    for (var v=0; v<9; v++)
      if (cell1[v] !== cell2[v])
        out.push(v);
    return out;
  }

  function cellHasExactlyCands(cell, cands) {
    for (var v=0; v<9; v++) {
      if (cell[v]) {
        if (cands.indexOf(v)===-1) return false;
      } else {
        if (cands.indexOf(v)!==-1) return false;
      }
    }
    return true;
  }

  function findByCands(group, cands) {
    for (var c=0; c<group.length; c++)
      if (cellHasExactlyCands(group[c], cands))
        return group[c];
    return undefined;
  }

  function boxRow(box) {
    if (box<0 || box>8) return -1;
    if (box<3) return 0;
    if (box<6) return 1;
    if (box<9) return 2;
  }
  function boxCol(box) {
    if (box<0 || box>8) return -1;
    return box%3;
  }

  // returns ONE common candidate between cell1 and cell2
  // returns -1 if there are none.
  function commonCandidate(cell1, cell2) {
    for (var v=0; v<9; v++)
      if (cell1[v] && cell2[v]) return v;
    return -1;
  }





  //  ######   #######  ##       ##     ## ######## ########   ######
  // ##    ## ##     ## ##       ##     ## ##       ##     ## ##    ##
  // ##       ##     ## ##       ##     ## ##       ##     ## ##
  //  ######  ##     ## ##       ##     ## ######   ########   ######
  //       ## ##     ## ##        ##   ##  ##       ##   ##         ##
  // ##    ## ##     ## ##         ## ##   ##       ##    ##  ##    ##
  //  ######   #######  ########    ###    ######## ##     ##  ######

  // sometimes there is state that helps to avoid
  // recalculation. after an 'undo' all of this should
  // be wiped clean, as this state can be corrupt.
  function undoWipe() {
    sandwichStaticFinished = false;
    everyRowCol(g => g.sandwichFullySet = false);
    everyCell(c => c.adjCleared = false);
  }

/*
     CCCCC   OOOOO  NN   NN FFFFFFF IIIII RRRRRR  MM    MM
    CC    C OO   OO NNN  NN FF       III  RR   RR MMM  MMM
    CC      OO   OO NN N NN FFFF     III  RRRRRR  MM MM MM
    CC    C OO   OO NN  NNN FF       III  RR  RR  MM    MM
     CCCCC   OOOO0  NN   NN FF      IIIII RR   RR MM    MM
*/


function confirmCell(cell, v) {
  var changed = !isSolved(cell) || v!==cell.solved;
  for (var i=0; i<9; i++)
    cell[i] = false;
  cell[v] = true;
  cell.isSolved = true;
  cell.solved = v;
  clearSolvedLists(cell);
  return changed;
}

function clearSolvedLists(cell) {
  var row = sudoku[cell.row];
  var col = sudokuCols[cell.col];
  var box = sudokuBoxes[cell.box];
  row.solvedCellsCache = row.unsolvedCellsCache = undefined;
  col.solvedCellsCache = col.unsolvedCellsCache = undefined;
  box.solvedCellsCache = box.unsolvedCellsCache = undefined;
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
    if (everyCell(cell => {
      if (!isSolved(cell)) return false;
      if (cell.adjCleared) return false;
      cell.adjCleared = true;
      return clearAfterConfirm(cell);
    })) {
      consolelog('Cleared candidates adjacent to confirmed cells.');
      return true;
    } return false;
  }

  function clearAfterConfirm(cell) {
    var changed = false;
    if (!isSolved(cell)) return false;
    var v = cell.solved;
    var row = sudoku[cell.row];
    var col = sudokuCols[cell.col];
    var box = sudokuBoxes[cell.box]
    for (var i=0; i<9; i++) {
      changed = changed || row[i][v] || col[i][v] || box[i][v];
      row[i][v] = false;
      col[i][v] = false;
      box[i][v] = false;
    }
    return changed;
  }


  /*
    NN   NN KK  KK DDDDD       SSSSS  IIIII NN   NN   GGGG  LL      EEEEEEE  SSSSS
    NNN  NN KK KK  DD  DD     SS       III  NNN  NN  GG  GG LL      EE      SS
    NN N NN KKKK   DD   DD     SSSSS   III  NN N NN GG      LL      EEEEE    SSSSS
    NN  NNN KK KK  DD   DD         SS  III  NN  NNN GG   GG LL      EE           SS
    NN   NN KK  KK DDDDDD      SSSSS  IIIII NN   NN  GGGGGG LLLLLLL EEEEEEE  SSSSS
  */


  function nakedSingles() {
    return everyCell(cell => {
      var v = getOnlyCandidate(cell);
      if (v===undefined) return false;
      confirmCell(cell,v);
      consolelog(`Naked Single ${v+1} at ${cell.pos}.`);
      return true;
    });
  }

  function getOnlyCandidate(cell) {
    var knownCand = undefined;
    for (var v=0; v<9; v++) if (cell[v]) {
      if (knownCand !== undefined) return undefined;
      knownCand = v;
    }
    return knownCand;
  }



  /*
      HH   HH DDDDD   NN   NN     SSSSS  IIIII NN   NN   GGGG  LL      EEEEEEE  SSSSS
      HH   HH DD  DD  NNN  NN    SS       III  NNN  NN  GG  GG LL      EE      SS
      HHHHHHH DD   DD NN N NN     SSSSS   III  NN N NN GG      LL      EEEEE    SSSSS
      HH   HH DD   DD NN  NNN         SS  III  NN  NNN GG   GG LL      EE           SS
      HH   HH DDDDDD  NN   NN     SSSSS  IIIII NN   NN  GGGGGG LLLLLLL EEEEEEE  SSSSS
  */

  function hiddenSingles() {
    var changed = false;
    for (var g=0; g<9; g++) {
      if (hiddenSinglesGroup(sudoku[g]))      changed = true;
      if (hiddenSinglesGroup(sudokuCols[g]))  changed = true;
      if (hiddenSinglesGroup(sudokuBoxes[g])) changed = true;
    }
    return changed;
  }

  function hiddenSinglesGroup(group, prependText="") {
    var counts = [0,0,0,0,0,0,0,0,0];
    var inds = [];
    for (var v=0; v<9; v++)
      for (var c=0; c<9; c++)
        if (group[c][v]) {
          counts[v]++;
          inds[v] = c;
        }
    
    var changed = false;
    for (var v=0; v<9; v++) {
      if (counts[v]===1) {
        var cell = group[inds[v]];
        if (confirmCell(cell,v)) {
          consolelog(prependText + `Hidden Single ${v+1} found in ${group.groupName}.`);
          changed = true;
        }
      }
    }
    return changed;
  } 


/*
    IIIII NN   NN TTTTTTT EEEEEEE RRRRRR   SSSSS  EEEEEEE  CCCCC  TTTTTTT    RRRRRR  MM    MM VV     VV LL
     III  NNN  NN   TTT   EE      RR   RR SS      EE      CC    C   TTT      RR   RR MMM  MMM VV     VV LL
     III  NN N NN   TTT   EEEEE   RRRRRR   SSSSS  EEEEE   CC        TTT      RRRRRR  MM MM MM  VV   VV  LL
     III  NN  NNN   TTT   EE      RR  RR       SS EE      CC    C   TTT      RR  RR  MM    MM   VV VV   LL
    IIIII NN   NN   TTT   EEEEEEE RR   RR  SSSSS  EEEEEEE  CCCCC    TTT      RR   RR MM    MM    VVV    LLLLLLL
*/

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
    consolelog(`Intersection on value ${v+1} between ${group1.groupName} and ${group2.groupName}.`);
  }
  return true;
}

// return a list of indexes (values of 'otherGrop')
// where v's candidates are all in otherGroup=out[v]
function optionsConfined(group, otherGroup) {
  var useFun = (typeof otherGroup === "function");
  var mins = [10, 10, 10, 10, 10, 10, 10, 10, 10];
  var maxs = [-1, -1, -1, -1, -1, -1, -1, -1, -1];

  // get the min and max value for grouptype (row/col/box) for
  // each cell holding each value.
  for (var c=0; c<9; c++) {
    var cell = group[c];
    for (var v=0; v<9; v++) {
      if (cell[v]) {
        if (useFun) {
          mins[v] = Math.min(mins[v], otherGroup(cell));
          maxs[v] = Math.max(maxs[v], otherGroup(cell));
        } else {
          mins[v] = Math.min(mins[v], cell[otherGroup]);
          maxs[v] = Math.max(maxs[v], cell[otherGroup]);
        }
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


function clearExceptGroup(thisgroup, otherGroupType, otherGroupVal, v) {
  var useFun = (typeof otherGroupType === "function");
  var changed = false;
  for (var i=0; i<9; i++) {
    var cell = thisgroup[i];
    if ((useFun && (otherGroupType(cell) !== otherGroupVal))
    || (!useFun && (cell[otherGroupType] !== otherGroupVal))) {
      if (cell[v]) {
        cell[v] = false;
        changed = true;
      }
    }
  }
  return changed;
}



/*
    NN   NN KK  KK DDDDD      PPPPPP    AAA   IIIII RRRRRR   SSSSS
    NNN  NN KK KK  DD  DD     PP   PP  AAAAA   III  RR   RR SS
    NN N NN KKKK   DD   DD    PPPPPP  AA   AA  III  RRRRRR   SSSSS
    NN  NNN KK KK  DD   DD    PP      AAAAAAA  III  RR  RR       SS
    NN   NN KK  KK DDDDDD     PP      AA   AA IIIII RR   RR  SSSSS
*/

  function nakedPairs() {
    return everyGroup(nakedPairsGroup);
  }

  function nakedPairsGroup(group, preText="") {
    var changed = false;
    if (moreThanLeft(group)){
      var twos = getTwos(group);
      for (var t1=0; t1<twos.length; t1++) {
        for (var t2=0; t2<t1; t2++) {
          if (sameCandidates(twos[t1], twos[t2])) {
            var [cand1, cand2] = getCandidates(twos[t1])
            if (clearNakedPair(group,cand1,cand2,twos[t1],twos[t2])) {
              consolelog(preText+`Naked Pair ${vstr(cand1,cand2)} found in ${group.groupName}.`);
              changed = true;
            }
          }
        }
      }
    }
    return changed;
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


  /*
      HH   HH DDDDD   NN   NN    PPPPPP    AAA   IIIII RRRRRR   SSSSS
      HH   HH DD  DD  NNN  NN    PP   PP  AAAAA   III  RR   RR SS
      HHHHHHH DD   DD NN N NN    PPPPPP  AA   AA  III  RRRRRR   SSSSS
      HH   HH DD   DD NN  NNN    PP      AAAAAAA  III  RR  RR       SS
      HH   HH DDDDDD  NN   NN    PP      AA   AA IIIII RR   RR  SSSSS
  */


  function hiddenPairs() {
    return everyGroup(hiddenPairsGroup);
  }

  function hiddenPairsGroup(group, preText="") {
    var unsolved = getUnsolvedCells(group);
    if (unsolved.length <= 2) return false;

    // the values that are only in two cells
    var vals = getValTwos(group);

    // make a map (over the unsolveds) of where each value is available.
    // check if any two values are available in the same two cells.
    var maps = [];
    for (var i1=0; i1<vals.length; i1++) {
      var v1 = vals[i1];
      maps[i1] = getGroupMap(unsolved, v1);
      for (var i2=0; i2<i1; i2++) {
        var v2 = vals[i2];
        if (maps[i2] === maps[i1])
          if (clearHidden(unsolved,[v2,v1])) {
            consolelog(preText+`Hidden Pair ${vstr(v1,v2)} found in ${group.groupName}.`);
            return true;
          }
      }
    }
    return false;
  }

  function clearHidden(group, vals) {
    var changed = false;
    for (var c=0; c<group.length; c++) {
      var cell = group[c];
      if (!cellHasCands(cell, vals)) continue;
      for (var v=0; v<9; v++)
        if (cell[v] && vals.indexOf(v)===-1) {
          cell[v] = false;
          changed = true;
        }
    }
    return changed;
  }


/*
    NN   NN KK  KK DDDDD      TTTTTTT RRRRRR  IIIII PPPPPP  LL      EEEEEEE
    NNN  NN KK KK  DD  DD       TTT   RR   RR  III  PP   PP LL      EE
    NN N NN KKKK   DD   DD      TTT   RRRRRR   III  PPPPPP  LL      EEEEE
    NN  NNN KK KK  DD   DD      TTT   RR  RR   III  PP      LL      EE
    NN   NN KK  KK DDDDDD       TTT   RR   RR IIIII PP      LLLLLLL EEEEEEE
*/

  function nakedTriples() {
    return everyGroup(nakedTriplesGroup);
  }

  function nakedTriplesGroup(group, preText="") {
    var unsolved = getUnsolvedCells(group);
    if (unsolved.length <= 3) return false;

    var threeOrLess = unsolved.filter(hasLessThanNCandidates(4));

    // there needs to be at least three
    if (threeOrLess.length < 3) return false;

    for (var i1=0; i1<threeOrLess.length; i1++) {
      var cell1 = threeOrLess[i1];
      for (var i2=0; i2<i1; i2++) {
        var cell2 = threeOrLess[i2];
        if (combinedCandidateCount(cell1, cell2) !== 3) continue;
        // at this point we have two cells whose combined cell count is 3.
        // if we can find a third that still holds this, we are in business.
        for (var i3=i1+1; i3<threeOrLess.length; i3++) {
          var cell3 = threeOrLess[i3];
          var cands = combinedCandidates3(cell1, cell2, cell3);
          if (combinedCandidateCount3(cell1, cell2, cell3) !== 3)  continue;
          // at this point we have three cells (cell1,cell2,cell3) with a combined
          // candidate count of 3.
          var cands = combinedCandidates3(cell1, cell2, cell3);
          var notThese = (c) => c.pos!==cell1.pos && c.pos!==cell2.pos && c.pos!==cell3.pos;
          if (clearCands(group.filter(notThese), cands)) {
            consolelog(preText+`Naked Triple ${vstr(...cands)} found in ${group.groupName}.`);
          }
        }
      }
    }
    return false;
  }



  /*
      HH   HH DDDDD   NN   NN    TTTTTTT RRRRRR  IIIII PPPPPP  LL      EEEEEEE
      HH   HH DD  DD  NNN  NN      TTT   RR   RR  III  PP   PP LL      EE
      HHHHHHH DD   DD NN N NN      TTT   RRRRRR   III  PPPPPP  LL      EEEEE
      HH   HH DD   DD NN  NNN      TTT   RR  RR   III  PP      LL      EE
      HH   HH DDDDDD  NN   NN      TTT   RR   RR IIIII PP      LLLLLLL EEEEEEE
  */

  function hiddenTriples() {
    return everyGroup(hiddenTripleGroup);
  }

  function hiddenTripleGroup(group, preText="") {
    // we need four or more open cells for this to work
    var unsolved = getUnsolvedCells(group);
    if (unsolved.length <= 3) return false;

    //get the values that are found in three or fewer cells
    var vals = [];
    for (var v=0; v<9; v++) {
      var possibleCells = countPossibleCells(unsolved, v);
      if (possibleCells <= 3 && possibleCells > 0)
        vals.push(v);
    }

    // get group maps for all values
    var maps = [];
    for (var vi=0; vi<vals.length; vi++)
      maps.push(getGroupMap(unsolved, vals[vi]));

    // check if any three overlap to three cells
    for (var i1=0; i1<maps.length; i1++) {
      for (var i2=0; i2<i1; i2++) {
        if (mapOrCount(maps[i1], maps[i2]) === 3) {
          for (var i3=i1+1; i3<maps.length; i3++) {
            if (mapOrCount3(maps[i1], maps[i2], maps[i3]) === 3) {
              if (clearHidden(unsolved, [vals[i1], vals[i2], vals[i3]])){
                consolelog(preText+`Hidden Triple ${vstr(vals[i2],vals[i1],vals[i3])} found in ${group.groupName}.`);
                return true;
              }
            }
          }
        }
      }
    }
  }



/*
    NN   NN KK  KK DDDDD       QQQQQ  UU   UU   AAA   DDDDD
    NNN  NN KK KK  DD  DD     QQ   QQ UU   UU  AAAAA  DD  DD
    NN N NN KKKK   DD   DD    QQ   QQ UU   UU AA   AA DD   DD
    NN  NNN KK KK  DD   DD    QQ  QQ  UU   UU AAAAAAA DD   DD
    NN   NN KK  KK DDDDDD      QQQQ Q  UUUUU  AA   AA DDDDDD
*/


  function nakedQuads() {
    return everyGroup(nakedQuadsGroup);
  }

  function nakedQuadsGroup(group, preText="") {

    // need at least five cells
    var unsolved = getUnsolvedCells(group);
    if (unsolved.length < 5) return false;

    var fourOrLess = unsolved.filter(hasLessThanNCandidates(5));

    // there needs to be at least four
    if (fourOrLess.length < 4) return false;

    // find out if any four of these cells contain four candidates in total
    for (var i1=0; i1<fourOrLess.length; i1++) {
      var cell1 = fourOrLess[i1];
      for (var i2=i1+1; i2<fourOrLess.length; i2++) {
        var cell2 = fourOrLess[i2];
        var candCount_c1c2 = combinedCandidateCount(cell1, cell2);
        if (candCount_c1c2 === 3 || candCount_c1c2 === 4) {
          // at this point we have two cells with a combined candidate count of three or four.
          for (var i3=i2+1; i3<fourOrLess.length; i3++) {
            var cell3 = fourOrLess[i3];
            var candCount_c1c2c3 = combinedCandidateCount3(cell1, cell2, cell3);
            if (candCount_c1c2c3 === 4) {
              // at this point we have three cells with a combined candidate count of four.
              for (var i4=i3+1; i4<fourOrLess.length; i4++) {
                var cell4 = fourOrLess[i4];
                var candCount_all = combinedCandidateCount4(cell1, cell2, cell3, cell4);
                if (candCount_all === 4) {
                  // we have four cells that can only be four values. this is a naked quad.
                  var cands = combinedCandidates4(cell1, cell2, cell3, cell4);
                  var notThese = (c) => c.pos!==cell1.pos && c.pos!==cell2.pos && c.pos!==cell3.pos && c.pos !== cell4.pos;
                  if (clearCands(unsolved.filter(notThese), cands)) {
                    consolelog(preText+`Naked Quad ${vstr(...cands)} found in ${group.groupName}.`);
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


/*
    HH   HH DDDDD   NN   NN     QQQQQ  UU   UU   AAA   DDDDD
    HH   HH DD  DD  NNN  NN    QQ   QQ UU   UU  AAAAA  DD  DD
    HHHHHHH DD   DD NN N NN    QQ   QQ UU   UU AA   AA DD   DD
    HH   HH DD   DD NN  NNN    QQ  QQ  UU   UU AAAAAAA DD   DD
    HH   HH DDDDDD  NN   NN     QQQQ Q  UUUUU  AA   AA DDDDDD
*/

  function hiddenQuads() {
    return everyGroup(hiddenQuadGroup);
  }

  function hiddenQuadGroup(group, preText="") {
    // we need four or more open cells for this to work
    var unsolved = getUnsolvedCells(group);
    if (unsolved.length <= 4) return false;

    //get the values that are found in four or fewer cells
    var vals = [];
    for (var v=0; v<9; v++) {
      var possibleCells = countPossibleCells(unsolved, v);
      if (possibleCells <= 4 && possibleCells > 0)
        vals.push(v);
    }

    // get group maps for all values
    var maps = [];
    for (var vi=0; vi<vals.length; vi++)
      maps.push(getGroupMap(unsolved, vals[vi]));

    // check if any three overlap to three cells
    for (var i1=0; i1<maps.length; i1++) {
      for (var i2=i1+1; i2<maps.length; i2++) {
        if (mapOrCount(maps[i1], maps[i2]) > 4) continue;
        for (var i3=i2+1; i3<maps.length; i3++) {
          if (mapOrCount3(maps[i1], maps[i2], maps[i3]) > 4) continue;
          for (var i4=i3+1; i4<maps.length; i4++) {
            if (mapOrCount4(maps[i1], maps[i2], maps[i3], maps[i4]) === 4) {
              if (clearHidden(group, [vals[i1], vals[i2], vals[i3], vals[i4]])) {
                consolelog(preText+`Hidden Quad ${vstr(vals[i1],vals[i2],vals[i3],vals[i4])} found in ${group.groupName}.`);
                return true;
              }
            }
          }
        }
      }
    }
  }



/*
    XX    XX        WW      WW IIIII NN   NN   GGGG   SSSSS
     XX  XX         WW      WW  III  NNN  NN  GG  GG SS
      XXXX   _____  WW   W  WW  III  NN N NN GG       SSSSS
     XX  XX          WW WWW WW  III  NN  NNN GG   GG      SS
    XX    XX          WW   WW  IIIII NN   NN  GGGGGG  SSSSS
*/

  function XWings() {
    return XWingsAux(sudoku) || XWingsAux(sudokuCols);
  }

  function XWingsAux(groups) {
    for (var v=0; v<9; v++) {
      var twoGroups = [];
      var maps = [];
      for (var g=0; g<9; g++) {
        var group = groups[g];
        if (groupHasNCells(group, v, 2)) {
          var map = getGroupMap(group, v);
          twoGroups.push(group);
          maps.push(map);
          for (var g2i=0; g2i<twoGroups.length-1; g2i++) {
            if (maps[g2i] === map) {
              // we have an x-wing
              var y1 = map.indexOf("1");
              var y2 = map.lastIndexOf("1");
              var group2 = twoGroups[g2i];
              if (clearXWing(groups, v, group, group2, y1, y2)) {
                consolelog(`X-Wing on value ${v+1} found in ${group2.groupName} and ${group.groupName}.`);
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  function clearXWing(groups, v, group1, group2, y1, y2) {
    var changed = false;
    for (var g=0; g<9; g++) {
      if (g!==group1.index && g!==group2.index) {
        if (groups[g][y1][v] || groups[g][y2][v]) {
          groups[g][y1][v] = false;
          groups[g][y2][v] = false;
          changed = true;
        }
      }
    }
    return changed;
  }



/*
    YY   YY        WW      WW IIIII NN   NN   GGGG   SSSSS
    YY   YY        WW      WW  III  NNN  NN  GG  GG SS
     YYYYY  _____  WW   W  WW  III  NN N NN GG       SSSSS
      YYY           WW WWW WW  III  NN  NNN GG   GG      SS
      YYY            WW   WW  IIIII NN   NN  GGGGGG  SSSSS
*/

  function YWings() {
    return everyRowCol(YWingAux, false);
  }

  function YWingAux(group) {

    var unsolved = getUnsolvedCells(group);
    if (unsolved.length < 3) return false;

    // all members must have two candidates
    var twos = getTwos(unsolved);
    for (var t1=0; t1<twos.length; t1++) {
      for (var t2=t1+1; t2<twos.length; t2++) {
        var cell1 = twos[t1];
        var cell2 = twos[t2];
        if (combinedCandidateCount(cell1, cell2) === 3) {
          // two 2-cells in this group can be three candidates together
          // if there's a cell visible to one of them that completes the three,
          // that forms a Y-wing.

          // the final cell needs the candidates apart from the common one
          var finalCellCands = candidateXOR(cell1, cell2);

          // if they are not in the same box, search the boxes of both ends for the final cell
          if (cell1.box !== cell2.box) {
            var wing2 = findByCands(sudokuBoxes[cell1.box], finalCellCands);
            if (wing2 && !sameCell(wing2, cell2)) {
              var pivot = cell1; var wing1 = cell2;
              if (clearYWing(pivot, wing1, wing2)) return true;
            } else {
              wing2 = findByCands(sudokuBoxes[cell2.box], finalCellCands);
              if (wing2 && !sameCell(wing2, cell1)) {
                var pivot = cell2; var wing1 = cell1;
                if (clearYWing(pivot, wing1, wing2)) return true;
              }
            }
          }

          // figure out which group is perpendicular (rows/cols)
          var otherGroups, otherGroupIndex;
          if (group.groupType === "row") {
            otherGroups = sudokuCols;
            otherGroupIndex = "col";
          } else {
            otherGroups = sudoku;
            otherGroupIndex = "row";
          }

          // search the perpendicular group for the final cell
          var wing2 = findByCands(otherGroups[cell1[otherGroupIndex]], finalCellCands);
          if (wing2) {
            var pivot = cell1; var wing1 = cell2;
            if (clearYWing(pivot, wing1, wing2)) return true;
          } else {
            wing2 = findByCands(otherGroups[cell2[otherGroupIndex]], finalCellCands);
            if (wing2) {
              var pivot = cell2; var wing1 = cell1;
              if (clearYWing(pivot, wing1, wing2)) return true;
            }
          }          
        }
      }
    }
    return false;
  }

  // given a Y-Wing with given pivot and wings, try to clear some candidates
  function clearYWing(pivot, wing1, wing2) {
    var changed = false;
    var v = commonCandidate(wing1, wing2);
    var covisible = YWcoVisibleCells(wing1, wing2, v);
    for (var i=0; i<covisible.length; i++) {
      var cell = covisible[i];
      if (cell[v] && !sameCell(cell, pivot)) {
        changed = true;
        cell[v] = false;
      }
    }
    if (changed) {
      var cands = combinedCandidates3(pivot, wing1, wing2);
      consolelog(`Y-Wing ${vstr(...cands)} pivoted on ${pivot.pos} with wings ${wing1.pos} and ${wing2.pos}.`);
    }
    return changed;
  }

  // cells visible to both cell1 and cell2 (not in the same box)
  // also need to contain the candidate "v"
  function YWcoVisibleCells(cell1, cell2, v) {
    var cells = [];
    if (boxRow(cell1.box)===boxRow(cell2.box)) {
      // wings share a box row
      var box1 = sudokuBoxes[cell1.box];
      var box2 = sudokuBoxes[cell2.box];
      for (var i=0; i<9; i++) {
        if (box1[v] && box1[i].row === cell2.row && !sameCell(box1[i],cell2)) cells.push(box1[i]);
        if (box2[v] && box2[i].row === cell1.row && !sameCell(box2[i],cell1)) cells.push(box2[i]);
      }
    } else if (boxCol(cell1.box)===boxCol(cell2.box)) {
      // wings share a box col
      var box1 = sudokuBoxes[cell1.box];
      var box2 = sudokuBoxes[cell2.box];
      for (var i=0; i<9; i++) {
        if (box1[v] && box1[i].col === cell2.col && !sameCell(box1[i],cell2)) cells.push(box1[i]);
        if (box2[v] && box2[i].col === cell1.col && !sameCell(box2[i],cell1)) cells.push(box2[i]);
      }
    } else {
      // no common box row or col. can only be two shared cells (one will be the pivot)
      var corner1 = sudoku[cell1.row][cell2.col];
      var corner2 = sudoku[cell2.row][cell1.col];
      if (corner1[v]) cells.push(corner1);
      if (corner2[v]) cells.push(corner2);
    }
    return cells;
  }














































































/*
    XX    XX     SSSSS  UU   UU DDDDD    OOOOO  KK  KK UU   UU
     XX  XX     SS      UU   UU DD  DD  OO   OO KK KK  UU   UU
      XXXX       SSSSS  UU   UU DD   DD OO   OO KKKK   UU   UU
     XX  XX          SS UU   UU DD   DD OO   OO KK KK  UU   UU
    XX    XX     SSSSS   UUUUU  DDDDDD   OOOO0  KK  KK  UUUUU
*/

  var sudokuDiags = undefined;
  function xsudokuElims() {
    if (sudokuDiags===undefined)
      buildSudokuDiags();

    if (xsudokuClearAdjs()) return true;
    if (xsudokuHiddenSingles()) return true;
    if (xsudokuIntersections()) return true;
    if (xsudokuNakedPairs()) return true;
    return false;
  }

  function clearAdjGroup(group, prependText="") {
    var [solved,unsolved] = getSolvedUnsolvedCells(group);

    var changed = false;
    for (var s=0; s<solved.length; s++) {
      var v = solved[s].solved;
      for (var i=0; i<unsolved.length; i++) {
        if (unsolved[i][v]) {
          unsolved[i][v] = false;
          changed = true;
        }
      }
    }
    
    if (changed) consolelog(prependText+`Cleared adjacent candidates to confirmed cells in ${group.groupName}`);
    return changed;
  }

  function xsudokuClearAdjs() {
    var changed = false;
    for (var i=0; i<sudokuDiags.length; i++)
      if (clearAdjGroup(sudokuDiags[i], "[x sudoku] ")) changed = true;
    return changed;
  }

  function buildSudokuDiags() {
    sudokuDiags = [[],[]];
    for (var i=0; i<9; i++) {
      sudokuDiags[0].push(sudoku[i][i]);
      sudokuDiags[1].push(sudoku[i][8-i]);
    }
    sudokuDiags[0].groupName = "Diagonal \\";
    sudokuDiags[1].groupName = "Diagonal /";
  }

  function xsudokuHiddenSingles() {
    var changed = false;
    for (var i=0; i<sudokuDiags.length; i++)
      if (hiddenSinglesGroup(sudokuDiags[i], "[x sudoku] ")) changed = true;
    return changed;
  }

  function xsudokuNakedPairs() {
    var changed = false;
    for (var i=0; i<sudokuDiags.length; i++)
      if (nakedPairsGroup(sudokuDiags[i],"[x sudoku] ")) changed = true;
    return changed;
  }

  function xsudokuIntersections() {
    var changed = false;

    // diag only having cands in one box
    for (var i=0; i<sudokuDiags.length; i++) {
      var diag = sudokuDiags[i];
      var confined = optionsConfined(diag,"box");
      for (var v=0; v<9; v++) {
        if (confined[v]>=0) {
          var box = sudokuBoxes[confined[v]];
          if (clearExceptGroup(box,isDiag(i),true,v)) {
            changed = true;
            consolelog(`[x sudoku] Intersection on ${v+1} between ${diag.groupName} and ${box.groupName}.`);
          }
        }
      }
    }

    // boxes only having cands in one diag
    for (var b=0; b<9; b+=2) {
      var box = sudokuBoxes[b];
      var confined = optionsConfined(box, isEitherDiag);
      for (var v=0; v<9; v++) {
        if (confined[v]>=0) {
          var diag = sudokuDiags[confined[v]];
          if (clearExceptGroup(diag,"box",b,v)) {
            changed = true;
            consolelog(`[x sudoku] Intersection on ${v+1} between ${box.groupName} and ${diag.groupName}.`);
          }
        }
      }
    }

    return changed;
  }

  function isDiag(ind) {
    if (ind===0) return function(cell) {
      return (cell.row===cell.col)
    };
    else return function(cell) {
      return (cell.row===(8-cell.col));
    };
  }

  function isEitherDiag(cell) {
    if (cell.row===cell.col) return 0;
    if (cell.row===(8-cell.col)) return 1;
    return -1;
  }

  



  //   SSSSS    AAA   NN   NN DDDDD   WW      WW IIIII  CCCCC  HH   HH
  //  SS       AAAAA  NNN  NN DD  DD  WW      WW  III  CC    C HH   HH
  //   SSSSS  AA   AA NN N NN DD   DD WW   W  WW  III  CC      HHHHHHH
  //       SS AAAAAAA NN  NNN DD   DD  WW WWW WW  III  CC    C HH   HH
  //   SSSSS  AA   AA NN   NN DDDDDD    WW   WW  IIIII  CCCCC  HH   HH


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

    // when there are exactly two known 1/9s, sometimes we can restrict candidates
    // inside and outside these cells
    if (everyRowColSandwich(sandwichTwoKnown19s)) return true;

    // check every candidate 1 and 9 to see if there could be a 9 or 1 in range
    if (everyRowColSandwich(sanwichIndividual19Eligibility)) return true;

    // restrict cells known to be outside to outside-applicable candidates
    if (everyRowColSandwich(outsideCandidates)) return true;

    return false;
  }

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
      if (cell[v])
        return false;
    return true;
  }

  function couldBe1or9(cell) { return cell[0] || cell[8]; }

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
        if (cell[v]) {
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
      if (cell[cand])
        if (rangeCanSupportSum(group, sw, i, ind))
          return true;
    }
    for (var i=ind+close+1; i<=ind+far+1; i++) {
      if (i>=9) continue;
      var cell = group[i];
      if (cell[cand])
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
        if (cell[v])
          candsIn[v] = true;
    }
    for (var c=0; c<cellsOut.length; c++) {
      var cell = cellsOut[c];
      for (var v=1; v<8; v++)
        if (cell[v])
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
    var y1 = twoMap.indexOf("y1");
    var y2 = twoMap.lastIndexOf("y1");
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
    ZZZZZ        WW      WW IIIII NN   NN   GGGG   SSSSS
       ZZ        WW      WW  III  NNN  NN  GG  GG SS
      ZZ  _____  WW   W  WW  III  NN N NN GG       SSSSS
     ZZ           WW WWW WW  III  NN  NNN GG   GG      SS
    ZZZZZ          WW   WW  IIIII NN   NN  GGGGGG  SSSSS
*/
// 901500046425090081860010020502000000019000460600000002196040253200060817000001694
// breaks this
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
    var threes = getThreesOrLess(box);

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
                consolelog("XYZ-Wing "+vstr(...cands)+" pivoted on "+cellXYZ.pos+" with wings at "+cellXZ.pos+" and "+cellYZ.pos+".");
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
                consolelog("XYZ-Wing "+vstr(...cands)+" pivoted on "+cellXYZ.pos+" with wings at "+cellXZ.pos+" and "+cellYZ.pos+".");
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


  String.prototype.nthIndexOf = function(pattern, n) {
    var i = -1;
    while (n-- && i++ < this.length) {
      i = this.indexOf(pattern, i);
      if (i < 0) break;
    }
    return i;
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
      if (strats[i].category==="Sandwich" && strats[i].enabled) return true;
    return false;
  }

  function antiknightEnabled() {
    for (var i=0; i<strats.length; i++)
      if (strats[i].category==="Anti-Knight" && strats[i].enabled) return true;
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

    // for special strategies
    sudokuDiags = undefined;
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
      sudoku[i].index = i;
      sudoku[i].canCache = true;
      sudokuCols[i].groupName = "Col " + (i+1);
      sudokuCols[i].groupType = "col";
      sudokuCols[i].index = i;
      sudokuCols[i].canCache = true;
      sudokuBoxes[i].groupName = "Box " + (i+1);
      sudokuBoxes[i].groupType = "box";
      sudokuBoxes[i].index = i;
      sudokuBoxes[i].canCache = true;
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

