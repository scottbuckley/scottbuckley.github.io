  
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
    "Extreme",
    "X Sudoku",
    "Regions",
    "Thermos",
    "Sandwich",
    "Anti-Knight",
    "Non-Consecutive"
  ];

  const strats = [
    { name:  "Clear Adjacents",
      sname: "Clr Adjs",
      func:  clearAdjacents,
      enabled: true,
      category: "Simple",
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
      category: "Anti-Knight",
      specialty: true,
    },
    { name:  "X Sudoku Eliminations",
      sname: "X Elims",
      func:  xsudokuElims,
      enabled:false,
      category: "X Sudoku",
      specialty: true,
    },
    { name:  "No Repeats",
      sname: "Region Uniq",
      func:  regionUniques,
      enabled: false,
      category: "Regions",
      specialty: false
    },
    { name:  "Thermo Basic",
      sname: "Thermo Basic",
      func:  thermoBasic,
      enabled: false,
      category: "Thermos",
      specialty: false
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
      category: "Sandwich",
      specialty: true,
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
    {
      name: "Non-Consecutive",
      sname: "Non Con",
      func: nonConsec,
      category: "Non-Consecutive"
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
      enabled: true,
      category: "Tough"
    },
    { name:  "Swordfish",
      sname: "Swordfish",
      func:  swordfish,
      enabled: true,
      category: "Tough"
    },
    { name:  "Simple Color Chains",
      sname: "Smpl Clrs",
      func:  simpleColors,
      enabled: false,
      category: "Tough",
      aka: "Singles Chains"
    },
    { name:  "Finned X-Wings",
      sname: "Finned",
      func:  FinnedXWings,
      enabled: false,
      category: "Extreme"
    },
    {
      name:  "X-Cycles",
      sname: "X-Cycles",
      func: xCycles,
      enabled: false,
      category: "Diabolical"
    }
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
  var sudokuCellsTL = []; // grouping by the sum of row and col
  var sudokuEdges = [[],[],[],[]];
  
  var sudokuRegions = [];
  var sudokuThermos = [];
  var sudokuLines = [];
  var sudokuArrows = [];
  var sudokuKropkis = [];

  var undoStack = [];



  // solve the sudoku as far as you can.
  // return the solution or "ERROR" or "INCOMPLETE".
  function completeSilently(data) {
    logging = false;
    initSudokuData(data);
    while(makeSomeChange(false));
    if (fst(checkErrors())) return "ERROR";
    if (getSolvedCount() < 81) return "INCOMPLETE";
    logging = true;
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
  function autoSolve(firstError=false) {
    // consolelog("Attempting to solve...");
    // make a single step, then wait before doing it again.
    var makestep = function() {
      if (makeSomeChange()) {
        refresh();
        if (firstError) {
          var [flag, err] = checkErrors();
          if (flag) {
            alert(err);
            return;
          }
        }
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
        if (fst(checkErrors())) {
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
    ########  ########  ######   ########  ########  ######   ######  ####  #######  ##    ##
    ##     ## ##       ##    ##  ##     ## ##       ##    ## ##    ##  ##  ##     ## ###   ##
    ##     ## ##       ##        ##     ## ##       ##       ##        ##  ##     ## ####  ##
    ########  ######   ##   #### ########  ######    ######   ######   ##  ##     ## ## ## ##
    ##   ##   ##       ##    ##  ##   ##   ##             ##       ##  ##  ##     ## ##  ####
    ##    ##  ##       ##    ##  ##    ##  ##       ##    ## ##    ##  ##  ##     ## ##   ###
    ##     ## ########  ######   ##     ## ########  ######   ######  ####  #######  ##    ##
*/

  var regressionTests = [
    { name: "X-Wings",
      strategies: ["Clear Adjacents", "Naked Singles", "Hidden Singles", "Intersection Removal", "Naked Pairs", "Hidden Pairs", "Hidden Triples", "X-Wings"],
      datas: ["000400602006000100090500080050300000301206405000007020030002060004000900507009000",
              "005000400020940000900700008003000290100203007079000300400008001000014060006000700",
              "003910700000003400100040006060700000002109600000002010700080003008200000005071900",
              "010037000000000010600008029070049600100000003009350070390200008040000000000790060"],
      url: "https://www.sudokuwiki.org/X_Wing_Strategy",
    }, {
      name: "Y-Wings",
      strategies: ["Clear Adjacents", "Naked Singles", "Hidden Singles", "Intersection Removal", "Naked Pairs", "Y-Wings"],
      datas: ["007000400060070030090203000005047609000000000908130200000705080070020090001000500",
              "600000002208000400000520896030080057000060000720090080574012000002000701800000009",
              "000000001004060208070320400900018000005000600000540009008037040609080300100000000",
              "091700050700801000008469000073000000000396000000000280000684500000902001020007940"],
      url: "https://www.sudokuwiki.org/Y_Wing_Strategy",
    }, {
      name: "Z-Wings",
      strategies: ["Clear Adjacents", "Naked Singles", "Hidden Singles", "Intersection Removal", "Naked Triples", "Z-Wings"],
      datas: ["072000680000700000500016000000028100200371006004560000000130004000007000015000890",
              "000100000000000980705062310109007403000000000807200105091740802053000000000001000",
              "008207090000000420400010056000980000006000100000023000760090004082000000040801200",
              "900850000050201000600030008005070012080000070730010500100020003000109020000043006"],
      url: "https://www.sudokuwiki.org/XYZ_Wing",
    }, {
      name: "Swordfish",
      strategies: ["Clear Adjacents", "Naked Singles", "Hidden Singles", "Intersection Removal", "Hidden Pairs", "Swordfish"],
      datas: ["008009000300057001000100009230000070005406100060000038900003000700840003000700600",
              "980010020002700000000009010700040800600107002009030005040900000000005700070020039",
              "108000067000050000000000030006100040450000900000093000200040010003002700807001005",
              "107300040800006000050870630090000510000000007700060080000904000080100002410000000",
              "300040000000007048000000907010003080400050020050008070500300000000000090609025300"],
      url: "https://www.sudokuwiki.org/Sword_Fish_Strategy",
    }, {
      name: "Finned X-Wing",
      strategies: ["Clear Adjacents", "Naked Singles", "Hidden Singles", "Intersection Removal", "Hidden Pairs", "Finned X-Wings"],
      datas: ["900040000704080050080000100007600820620400000000000019000102000890700000000050003", ],
      url: "https://www.sudokuwiki.org/Finned_X_Wing",
    }, {
      name: "Simple Color Chains",
      strategies: ["Clear Adjacents", "Naked Singles", "Hidden Singles", "Intersection Removal", "Hidden Pairs", "Hidden Quads", "Simple Color Chains"],
      datas: ["100400006046091080005020000000500109090000050402009000000010900080930560500008004",
              "000906000600008007100370009006000750004030100095000800200065008900800005000103000",
              "400800003006010409000005000010060092000301000640050080000600000907080100800009004",
              "090200350012003000300008000000017000630000089000930000000700002000300190078009030",
              "000000070000090810500203004800020000045000720000000003400308006072010000030000000",
              "062900000004308000709000400600801000003000200000207003001000904000709300000004120",],
      url: "https://www.sudokuwiki.org/Singles_Chains",
    }, {
      name: "X-Cycles",
      strategies: ["Clear Adjacents", "Naked Singles", "Hidden Singles", "Hidden Pairs", "Intersection Removal", "X-Cycles"],
      datas: ["024100670060070410700964020246591387135487296879623154400009760350716940697040031", // rule 1
              "804537000023614085605982034000105870500708306080203450200859003050371208008426507", // rule 2
              "000010960000680450056942307000008009380094625900200004673029540508476203240050006", // rule 2
              "000078000003000590090200010004006000000134000000700680020009070008000300000320000", // rule 3
              "000050000001203900050007000900020008060708020400060001000500080007304500000010000", // rule 3
            ],
      extraFunc: [
        function() {
          if (sudoku[2][2][7]) return false;
          if (sudoku[6][2][7]) return false;
          if (sudoku[6][8][7]) return false;
          return true;
        }
      ],
      url: "https://www.sudokuwiki.org/X_Cycles",
    }
  ];

  function runAllTests() {
    var failure = false;
    for (var t=0; t<regressionTests.length; t++)
      failure = !runRegressionTest(regressionTests[t]) || failure;
    if (failure) console.error("NOT ALL TESTS PASSED");
    else console.log("ALL TESTS PASSED");
    return !failure;
  }

  function loadTestStrats(name) {
    for (var i=0; i<regressionTests.length; i++) {
      if (regressionTests[i].name === name) {
        setStrats(regressionTests[i].strategies);
        updateAllCheckboxes();
      }
    }
  }

  function runRegressionTest(test) {
    console.log(`Running test "${test.name}".`);
    console.log("settings strategies...");
    setStrats(test.strategies);
    updateAllCheckboxes();
    var allPassed = true;
    for (var d=0; d<test.datas.length; d++) {
      var data = test.datas[d];
      var extraFunc;
      if (test.extraFunc) extraFunc = test.extraFunc[d];
      console.log(`running test ${d+1} of ${test.datas.length}...`);
      console.log(`solving: ${data}`);
      var result = completeSilently(data);
      if (result === "ERROR" || (result === "INCOMPLETE" && extraFunc===undefined)) {
        console.warn(`Test "${test.name}" failed with data "${data}"`);
        allPassed = false;
      } else if (result === "INCOMPLETE") {
        if (extraFunc()) {
          console.log(`Test "${test.name}" #${d} passed with alternative success function`, extraFunc);
          result = "PASSED ALT TEST";
        } else {
          console.error(`Test "${test.name}" failed with data "${data}"`);
          allPassed = false;
        }
      }
      console.log(`result: ${result}`);
    }
    return allPassed;    
  }

  function setStrats(stratlist) {
    for (var i=0; i<strats.length; i++)
      strats[i].enabled = (stratlist.indexOf(strats[i].name)!==-1);
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
  var solvedCellsCache = [];
  function getSolvedUnsolvedCells(group) {
    var name = group.groupName;
    if (solvedCellsCache[name] === undefined) {
      var solved = [];
      var unsolved = [];
      solvedCellsCache[name] = [solved, unsolved];
      for (var c=0; c<group.length; c++) {
        var cell = group[c];
        if (isSolved(cell))
          solved.push(cell);
        else
          unsolved.push(cell);
      }
    }
    return solvedCellsCache[name];
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

  // this is safe to cache, as a cell's neighbours will never change.
  // (as in, it will always have the same cells neighbouring it)
  function getCellNbrs(cell) {
    if (cell.nbrs===undefined)
      cell.nbrs = [cellLeft(cell), cellRight(cell), cellAbove(cell), cellBelow(cell)].filter((x)=>x!==undefined);
    return cell.nbrs;
  }

  function moreThanTwoLeft(group)   { return moreThanLeft(group, 2) };
  function moreThanThreeLeft(group) { return moreThanLeft(group, 3) };
  function moreThanFourLeft(group)  { return moreThanLeft(group, 4) };


  // the cells that have two candidates
  function getTwos(group) {
    if (group.canCache) return getUnsolvedCells(group).filter(hasNCandidates(2));
    else                return group                  .filter(hasNCandidates(2));
  }

  // the cells that have three candidates
  function getThrees(group) {
    if (group.canCache) return getUnsolvedCells(group).filter(hasNCandidates(3));
    else                return group                  .filter(hasNCandidates(3));
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

  //todo: allownonstandardgroups should include x-sudoku groups etc (maybe?)
  function everyGroupPush(groupFunc, allowNonStandardGroups=false) {
    var changes = [];
    var groupings = [sudoku, sudokuCols, sudokuBoxes];
    for (var g=0; g<3; g++) {
      var grouping = groupings[g];
      for (var i=0; i<grouping.length; i++) {
        var group = grouping[i];
        var ch = groupFunc(group);
        if (ch !== false) changes.push(ch);
      }
    }
    return changes;
  }

  /**
   * Runs a function on every cell in the sudoku, and returns
   * the OR of all these values.
   * @param {fun} func - a boolean function to call on each cell
   */

  function everyCell(func) {
    var changed = false;
    for (var r=0; r<9; r++)
      for (var c=0; c<9; c++)
        if (func(sudoku[r][c]))
          changed = true;
    return changed;
  }

  function everyCellFilter(filter) {
    var result = [];
    for (var r=0; r<9; r++)
      for (var c=0; c<9; c++)
        if (filter(sudoku[r][c]))
          result.push(sudoku[r][c]);
    return result;
  }

  function everyVal(func, multiple=true) {
    var changed = false;
    for (var v=0; v<9; v++)
      if (func(v)) {
        changed = true;
        if (!multiple) return true;
      }
    return changed;
  }

  function everyRowCol(groupFunc, multiple=true) {
    var changed = false;
    var groupings = [sudoku, sudokuCols];
    for (var g=0; g<2; g++) {
      var grouping = groupings[g];
      for (var i=0; i<9; i++)
        if (groupFunc(grouping[i])) {
          if (!multiple) return true;
          changed = true;
        }
    }
    return changed;
  }

  function everyBox(groupFunc, multiple=true) {
    var changed = false;
    for (var b=0; b<9; b++)
      if (groupFunc(sudokuBoxes[b])) {
        if (!multiple) return true;
        changed = true;
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


  function countPossibleCells(group, v, max=99) {
    var count = 0;
    for (var c=0; c<group.length; c++)
      if (group[c][v])
        if (++count >= max) return max;
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

  /** 
   * Clear every cell in a group of all given cands.
   * @param {cell[]} group - a group of cells (any length).
   * @param {int[]} cands - a list of candidate values. Safe to include outside 0-8.
   */
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

  function notInGroup(cell, group) {
    if (group.canCache) {
      return (cell[group.groupType] !== group.index);
    } else {
      for (var c=0; c<group.length; c++)
        if (sameCell(cell,group[c])) return false;
      return true;
    }
  }

  function indicesFromMap(map) {
    var out = [];
    for (var i=0; i<map.length; i++)
      if (map[i]==="1") out.push(i);
    return out;
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
    everyCell(c => c.nonConsCleared = false);
    clearSolvedCache();
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
  clearSolvedCache();
  return changed;
}

function clearSolvedCache() {
  solvedCellsCache = [];
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
    if (moreThanTwoLeft(group)){
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
    for (var c=0; c<group.length; c++) {
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
            return true;
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
      var possibleCells = countPossibleCells(unsolved, v, 3);
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
      var possibleCells = countPossibleCells(unsolved, v, 4);
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
            // there can only be one in this box, as two would mean a naked pair
            if (wing2 && !sameCell(wing2, cell2) && notInGroup(wing2, group)) {
              var pivot = cell1; var wing1 = cell2;
              if (clearYWing(pivot, wing1, wing2)) return true;
            } else {
              wing2 = findByCands(sudokuBoxes[cell2.box], finalCellCands);
              if (wing2 && !sameCell(wing2, cell1) && notInGroup(wing2, group)) {
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
    ZZZZZ        WW      WW IIIII NN   NN   GGGG   SSSSS
       ZZ        WW      WW  III  NNN  NN  GG  GG SS
      ZZ  _____  WW   W  WW  III  NN N NN GG       SSSSS
     ZZ           WW WWW WW  III  NN  NNN GG   GG      SS
    ZZZZZ          WW   WW  IIIII NN   NN  GGGGGG  SSSSS
*/

  // also known as XYZ-wings
  function ZWings() {
    return everyBox(ZWingsBox);
  }

  function ZWingsBox(box) {
    // get the cells in this box with two and three candidates
    var twos   = getTwos(box);
    var threes = getThrees(box);

    // needs to be at least one of each
    if (twos.length   === 0) return false;
    if (threes.length === 0) return false;
    
    for (var i2=0; i2<twos.length; i2++) {
      for (var i3=0; i3<threes.length; i3++) {
        if (combinedCandidateCount(twos[i2], threes[i3]) === 3) {
          // this box has an XY and an XYZ
          var cellXYZ = threes[i3];
          var cellXZ  = twos[i2];
          
          var groupsToCheck = [];
          if (cellXZ.col !== cellXYZ.col) groupsToCheck.push(sudokuCols);
          if (cellXZ.row !== cellXYZ.row) groupsToCheck.push(sudoku);

          for (var g=0; g<groupsToCheck.length; g++) {
            var grouping = groupsToCheck[g];
            var group = grouping[cellXYZ[grouping.groupingType]];
            // 'group' is the pivot's row or col
            for (var c=0; c<9; c++) {
              var cellYZ = group[c];
              if (cellYZ.box === cellXYZ.box) continue;
              if (candidateCount(cellYZ) === 2 && combinedCandidateCount(cellYZ, cellXYZ) === 3 && !sameCandidates(cellYZ, cellXZ)) {
                // we have an XYZ-wing
                var Z = commonCandidate(cellXZ, cellYZ); // can only be one
                if (clearZWing(group, Z, cellXYZ.box, cellXYZ)) {
                  var cands = getCandidates(cellXYZ);
                  consolelog(`Z-Wing ${vstr(...cands)} pivoted on ${cellXYZ.pos} with wings at ${cellXZ.pos} and ${cellYZ.pos}.`);
                  return true;
                } else break; // there can't be another YZ - that would be a naked pair/triple
              }
            }
          }
        }
      }
    }
    return false;
  }

  function clearZWing(group, z, box, pivot) {
    var changed = false;
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (cell.box === box && !sameCell(cell, pivot))
        if (cell[z]) {
          cell[z] = false;
          changed = true;
        }
    }
    return changed;
  }




/*
     SSSSS  WW      WW  OOOOO  RRRRRR  DDDDD   FFFFFFF IIIII  SSSSS  HH   HH
    SS      WW      WW OO   OO RR   RR DD  DD  FF       III  SS      HH   HH
     SSSSS  WW   W  WW OO   OO RRRRRR  DD   DD FFFF     III   SSSSS  HHHHHHH
         SS  WW WWW WW OO   OO RR  RR  DD   DD FF       III       SS HH   HH
     SSSSS    WW   WW   OOOO0  RR   RR DDDDDD  FF      IIIII  SSSSS  HH   HH
*/

  function swordfish() {
    return swordfishAux(sudoku, "rows") || swordfishAux(sudokuCols, "cols");
  }

  function swordfishAux(groups, groupType) {
    // consider values separately
    for (var v=0; v<9; v++) {
      var possibleGroups = [];
      var maps = [];
      // consider each group (row or col)
      for (var g=0; g<9; g++) {
        var group = groups[g];
        // we only care about groups with two or three candidates for v
        var groupCellCount = countPossibleCells(group, v, 3);
        if (groupCellCount === 3 || groupCellCount === 2) {
          // get a candidate map for v for this group
          var map = getGroupMap(group, v);
          // rememeber it for later
          possibleGroups.push(group);
          maps.push(map);
          // look through all the previous maps to see if there are matches
          for (var g2i=0; g2i<possibleGroups.length-1; g2i++) {
            if (mapOrCount(map, maps[g2i]) === 3) {
              // there are two groups that have three options together. find a third.
              var map12 = mapOr(map, maps[g2i]); // save the first two for later
              for (var g3i=g2i+1; g3i<possibleGroups.length-1; g3i++) {
                if (mapOrCount(map12, maps[g3i]) === 3) {
                  // there are three groups that have three options together.
                  // this is a swordfish.
                  var group2 = possibleGroups[g2i];
                  var group3 = possibleGroups[g3i];
                  var [y1, y2, y3] = indicesFromMap(map12);
                  var [g1,g2,g3] = [group.index, group2.index, group3.index];
                  if (clearSwordfish(groups,v,g1,g2,g3,y1,y2,y3)) {
                    consolelog(`Swordfish on value ${v+1} found on ${group.groupType} ${comand3(g2,g3,g1)}`);
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

  function clearSwordfish(groups, v, i1, i2, i3, y1, y2, y3) {
    var changed = false;
    for (var g=0; g<9; g++)
      if (g!==i1 && g!==i2 && g!==i3)
        if (groups[g][y1][v] || groups[g][y2][v] || groups[g][y3][v]) {
          changed = true;
          groups[g][y1][v] = false;
          groups[g][y2][v] = false;
          groups[g][y3][v] = false;
        }
    return changed;
  }





/*
    FFFFFFF IIIII NN   NN NN   NN EEEEEEE DDDDD      XX    XX
    FF       III  NNN  NN NNN  NN EE      DD  DD      XX  XX
    FFFF     III  NN N NN NN N NN EEEEE   DD   DD      XXXX
    FF       III  NN  NNN NN  NNN EE      DD   DD     XX  XX
    FF      IIIII NN   NN NN   NN EEEEEEE DDDDDD     XX    XX
*/

  function FinnedXWings() {
    return FinnedXWingsAux(sudoku) || FinnedXWingsAux(sudokuCols);
  }

  function FinnedXWingsAux(groups) {
    // consider each value independently
    for (var v=0; v<9; v++) {
      var otherMaps = [];
      
      var twoGroups = [];
      var twoMaps = [];
      var finGroups = [];
      var finMaps = [];
      
      // map out groups 
      for (var g=0; g<9; g++) {
        var group = groups[g];
        var cellCount = countPossibleCells(group,v,5);
        if (cellCount === 2) {
          twoGroups.push(group);
          twoMaps.push(getGroupMap(group, v));
        } else if (cellCount === 3 || cellCount === 4) {
          finGroups.push(group);
          finMaps.push(getGroupMap(group, v));
        }
      }

      // at this point twoGroups contains the group index of every group with exactly 2 candidates
      // also 'twoMaps' contains the string map (0s and 1s) of value 'v' for that group.
      // the same for 3/4 candidates and twoGroups/twoMaps.
      for (var ti=0; ti<twoGroups.length; ti++) {
        for (var fi=0; fi<finGroups.length; fi++) {
          var twoMap = twoMaps[ti];
          var moreMap = finMaps[fi];
          var finMatch = finnedMapMatch(twoMap, moreMap);
          if (finMatch !== false) {
            // we have a finned x-wing
            var twoGroup = twoGroups[ti];
            var finGroup = finGroups[fi];
            if (clearFinnedXWing(v, twoGroup, finGroup, finMatch)) {
              consolelog(`Finned X-Wing on value ${v+1} found on ${twoGroup.groupName} and (fin) ${finGroup.groupName}.`);
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  function clearFinnedXWing(v, twoGroup, finGroup, fin) {
    var crossGroup = sudoku[fin];
    if (twoGroup.groupType === 'row')
      crossGroup = sudokuCols[fin];
    
    var changed = false;
    var finBlock = blockInd(finGroup.index);

    // iterate through the crossGroup's intersection with the fin's block
    for (var i=finBlock*3; i<(finBlock+1)*3; i++)
      if (i!==twoGroup.index && i!==finGroup.index)
        if (crossGroup[i][v]) {
          crossGroup[i][v] = false;
          changed = true;
        }
    return changed;
  }

  // input: list of nine 0s and 1s representing candidate presence.
  // twoMap has exactly two 1s and moreMap has 3 or 4.
  // output: if these maps constitute a finned xwing, the index
  // of the side of the xwing with the fin. otherwise "false".
  function finnedMapMatch(twoMap, moreMap) {
    var y1 = twoMap.indexOf("1");
    var y2 = twoMap.lastIndexOf("1");
    var b1 = blockInd(y1);
    var b2 = blockInd(y2);

    // a finned x-wing must be over two blocks
    if (b1===b2) return false;

    // make sure moreMap includes the x-wing
    if (moreMap[y1] !== '1') return false;
    if (moreMap[y2] !== '1') return false;
    
    // figure out where the finned wing is
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
    if (withB1) return y1;
    if (withB2) return y2;
    return false;
  }

  function blockInd(cellInd) {
    if (cellInd<3) return 0;
    if (cellInd<6) return 1;
    return 2;
  }
  

  /*
     CCCCC  LL      RRRRRR   SSSSS      CCCCC  HH   HH   AAA   IIIII NN   NN  SSSSS
    CC    C LL      RR   RR SS         CC    C HH   HH  AAAAA   III  NNN  NN SS
    CC      LL      RRRRRR   SSSSS     CC      HHHHHHH AA   AA  III  NN N NN  SSSSS
    CC    C LL      RR  RR       SS    CC    C HH   HH AAAAAAA  III  NN  NNN      SS
     CCCCC  LLLLLLL RR   RR  SSSSS      CCCCC  HH   HH AA   AA IIIII NN   NN  SSSSS
  */

  // it's important that these both pass if()
  const RED   = 1;
  const GREEN = 2;

  function simpleColors() {
    return everyVal(simpleColorsVal, false);
  }

  function simpleColorsVal(v) {
    // get all the strong links for this value
    var strongLinks = everyGroupPush(g => getOnlyTwoPossibleCells(g, v), true);
    
    // there needs to be at least three links to solve anything
    if (strongLinks.length < 3) return false;
    
    // build a set of links between nodes (this represents the graph)
    var links  = [];
    for (var i=0; i<strongLinks.length; i++) {
      placeLink(links, strongLinks[i][0].pos, strongLinks[i][1].pos);
      placeLink(links, strongLinks[i][1].pos, strongLinks[i][0].pos);
    }
    
    // each node's color
    var colors = [];
    // one node for each separated graph
    var graphStarts = [];

    // get a list of separated graphs, and colour these graphs
    for (var i=0; i<strongLinks.length; i++) {
      var node = strongLinks[i][0].pos;
      if (colors[node] === undefined) {
        // this node is uncolored. it is the start of a new graph.
        graphStarts.push(node);
        alternateColors(links, colors, node);
      }
    }

    // take a look at each graph
    for (var i=0; i<graphStarts.length; i++) {
      // get all the red and green nodes in this graph
      var [reds,grns] = getRedsGreens(links, colors, graphStarts[i]);
      // need at least four points to be a useful graph
      if (reds.length + grns.length > 3) {
        // check if any color occurs twice in a group (Rule 2)
        var [group, cell1, cell2] = colorOccursTwiceInOneGroup(reds);
        var colorWithConflict = RED;
        if (!group) {
          [group, cell1, cell2] = colorOccursTwiceInOneGroup(grns);
          colorWithConflict = GREEN;
        }
        if (group) {
          // there is a conflict! (Rule 2) the conflicted color is "colorWithConflict"
          if (colorWithConflict === RED)   confirmByPos(grns, v);
          if (colorWithConflict === GREEN) confirmByPos(reds, v);
          // report the logic that was followed.
          var path = getPathBetweenCells(links,cell1.pos,cell2.pos).join("->");
          consolelog(`Simple Color Chain on value ${v+1}. ${path} starts and ends with odd nodes in ${group.groupName}. Confirming even nodes.`);
          return true;
        } else {
          // there are no "two reds in one group" style conflicts.
          // look for co-visible nodes. (Rule 4)
          var cellsChanged = clearCovisibleToColors(v,reds,grns);
          if (cellsChanged.length>0) {
            consolelog(`Simple Color Chain on value ${v+1} excludes ${cellsChanged.map(c=>c.pos).join(',')}. Reds:${reds.join(',')}. Greens:${grns.join(',')}.`);
            return true;
          }
        }
      }
    }
    return false;
  }

  // add a link from 'from' to 'to' in the graph (no repeats)
  function placeLink(graph, from, to) {
      if (graph[from] === undefined)
        graph[from] = [to];
      else if(graph[from].indexOf(to)===-1)
        graph[from].push(to);
  }

  function otherClr(clr) {
    if (clr===RED)   return GREEN;
    return RED;
  }

  // walk the graph
  function alternateColors(links, colors, start, color=RED) {
    // this point has already been touched. do nothing.
    if (colors[start]) return;

    // set the color of this node.
    colors[start] = color;
    
    // color from each of the adjacent nodes.
    var adjs = links[start];
    // start with the 'other' color.
    var nextColor = otherClr(color);
    for (var i=0; i<adjs.length; i++)
      alternateColors(links, colors, adjs[i], nextColor);
  }

  function getRedsGreens(links, colors, start) {
    var grns = [];
    var reds = [];

    function step(node) {
      // disregard nodes we have already looked at
      if (grns.indexOf(node)>=0) return;
      if (reds.indexOf(node)>=0) return;

      // put this noe in the right box
      if (colors[node]===RED)
        reds.push(node);
      else if (colors[node]===GREEN)
        grns.push(node);

      // look at all adjacent nodes
      for (var i=0; i<links[node].length; i++)
        step(links[node][i]);
    }

    // step through this graph
    step(start);

    return [reds,grns];
  }

  // if a color occurs twice in any group, return the group
  // it occurs in, and the two cells in that group.
  //todo include nonstandard groups?
  function colorOccursTwiceInOneGroup(labels) {
    var rows = []; var cols = []; var boxes = [];
    for (var i=0; i<labels.length; i++) {
      var cell = sudokuCellsByPos[labels[i]];
      if (rows[cell.row])  return [sudoku[cell.row],      rows[cell.row],  cell];
      if (cols[cell.col])  return [sudokuCols[cell.col],  cols[cell.col],  cell];
      if (boxes[cell.box]) return [sudokuBoxes[cell.box], boxes[cell.box], cell];
      rows[cell.row] = cols[cell.col] = boxes[cell.box] = cell;
    }
    return [false];
  }

  // for all cells whose pos are in 'poses', confirm that
  // cell for value 'v'.
  function confirmByPos(poses, v) {
    for (var i=0; i<poses.length; i++)
      confirmCell(sudokuCellsByPos[poses[i]], v);
  }

  // return the two cells in group that can hold 'v',
  // or false if there are not exactly two of them.
  function getOnlyTwoPossibleCells(group, v) {
    if (group.canCache) group = getUnsolvedCells(group);
    var out = [];
    for (var c=0; c<group.length; c++)
      if (group[c][v]) {
        out.push(group[c]);
        if (out.length > 2) return false;
      }
    if (out.length === 2) return out;
    return false;
  }

  // given two cells, return a list of cells
  // that are visible to both.
  //todo add feature for nonstandard groups?
  function coVisibleCellsContaining(cellA, cellB, v) {
    var cells = [];

    // add a cell, if it contains the right value and is not
    // cellA or cellB.
    function maybeCell(cell) {
      if (cell[v] && !sameCell(cell, cellA) && !sameCell(cell, cellB))
        cells.push(cell);
    }

    var simpleGroupings = [sudoku, sudokuCols, sudokuBoxes];
    for (var g=0; g<simpleGroupings.length; g++) {
      var grouping = simpleGroupings[g];
      var groupingType = grouping.groupingType;
      if (cellA[groupingType] === cellB[groupingType]) {
        var group = grouping[cellA[groupingType]];
        for (var c=0; c<group.length; c++)
          maybeCell(group[c]);
      }
    }

    var sameRow = cellA.row===cellB.row;
    var sameCol = cellA.col===cellB.col;
    var sameBox = cellA.box===cellB.box;

    // different row, different box, but same boxRow
    if(!sameRow && !sameBox && boxRow(cellA.box)===boxRow(cellB.box)) {
      var boxA = sudokuBoxes[cellA.box];
      var boxB = sudokuBoxes[cellB.box];
      for (var c=0; c<9; c++) {
        var cellA2 = boxA[c];
        var cellB2 = boxB[c];
        if (cellA2.row===cellB.row) maybeCell(cellA2);
        if (cellB2.row===cellA.row) maybeCell(cellB2);
      }
    }

    // different col, different box, but same boxCol
    if(!sameCol && !sameBox && boxCol(cellA.box)===boxCol(cellB.box)) {
      // cells are in the same 'box col' but not in the same box
      var boxA = sudokuBoxes[cellA.box];
      var boxB = sudokuBoxes[cellB.box];
      for (var c=0; c<9; c++) {
        var cellA2 = boxA[c];
        var cellB2 = boxB[c];
        if (cellA2.col===cellB.col) maybeCell(cellA2);
        if (cellB2.col===cellA.col) maybeCell(cellB2);
      }
    }

    // check the cells of the opposite corners
    maybeCell(sudoku[cellA.row][cellB.col]);
    maybeCell(sudoku[cellB.row][cellA.col]);

    return cells;
  }

  // Search for instance of Rule 4 (https://www.sudokuwiki.org/Singles_Chains),
  // given a value and a list of 'red' and 'green' cell positions. Return
  // the number of cells that changed.
  //todo: pass 'covisiblecells' a flag to include non-standard groupings (xsudoku etc)
  function clearCovisibleToColors(v,reds,grns) {
    var changes = [];
    for (var r=0; r<reds.length; r++) {
      for (var g=0; g<grns.length; g++) {
        var red = sudokuCellsByPos[reds[r]];
        var grn = sudokuCellsByPos[grns[g]];
        var covis = coVisibleCellsContaining(red,grn,v);
        for (var c=0; c<covis.length; c++) {
          var cell = covis[c];
          if (cell[v]) {
            changes.push(cell);
            cell[v] = false;
          }
        }
      }
    }
    return changes;
  }

  // given a set of links, return a list of labels that gets
  // you from 'start' to 'end'.
  function getPathBetweenCells(links, start, end, ignore=[]) {
    var adjs = links[start];
    if (adjs.indexOf(end)>=0) {
      // we get there immediately
      return [start, end];
    } else {
      // try recursively
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



/*
    XX    XX         CCCCC  HH   HH   AAA   IIIII NN   NN  SSSSS
     XX  XX         CC    C HH   HH  AAAAA   III  NNN  NN SS
      XXXX   _____  CC      HHHHHHH AA   AA  III  NN N NN  SSSSS
     XX  XX         CC    C HH   HH AAAAAAA  III  NN  NNN      SS
    XX    XX         CCCCC  HH   HH AA   AA IIIII NN   NN  SSSSS
*/

  function xCycles() {
    return everyVal(xCyclesVal, false);
  }

  function xCyclesVal(v, showGraph=false) {

    // get a list of all strong links
    var stLinks = everyGroupPush(g => getOnlyTwoPossibleCells(g, v), true)
        .map(([a, b]) => [a.pos, b.pos]);

    // make a list of all nodes with a strong link
    var nodeLabels = [];
    for (var i=0; i<stLinks.length; i++) {
      var [start, end] = stLinks[i];
      if (nodeLabels.indexOf(start)===-1) nodeLabels.push(start);
      if (nodeLabels.indexOf(end)  ===-1) nodeLabels.push(end);
    }

    // add all strong links to a graph ('nodes')
    var nodes = [];
    nodes["labels"] = nodeLabels;
    for (var i=0; i<stLinks.length; i++) {
      writeStrongLink(nodes, stLinks[i][0], stLinks[i][1]);
      writeStrongLink(nodes, stLinks[i][1], stLinks[i][0]);
    }

    // get a list of all groups (prepping for calculating weak links)
    var groupings = getAllGroupings(true);
    var groupingInhabitants = [];
    for (var g=0; g<groupings.length; g++) {
      var grouping = groupings[g];
      var groupingType = grouping.groupingType;
      groupingInhabitants[groupingType] = [];
      for (var i=0; i<grouping.length; i++)
        groupingInhabitants[groupingType].push([]);
    }

    // add weak links to the graph
    for (var i=0; i<nodeLabels.length; i++) {
      var pos  = nodeLabels[i];
      var cell = nodes[pos].cell;
      for (var g=0; g<groupings.length; g++) {
        var grouping = groupings[g];
        var groupingType = grouping.groupingType;

        // cells we've seen so far that share a group with this one
        var adjs = groupingInhabitants[groupingType][cell[groupingType]];
        // the group they share
        var group = grouping[cell[groupingType]];
        // record these weak links (noting the shared group)
        for (var a=0; a<adjs.length; a++) {
          var adjPos = adjs[a];
          writeWeakLink(nodes, pos, adjPos, group);
          writeWeakLink(nodes, adjPos, pos, group);
        }
        // record this one for future cells
        adjs.push(pos);
      }
    }

    
    var findCycles = function(home, here, tag, strong, pathTaken=[]) {
      if (here.visited===tag) return [];
      here.visited = tag;
      var result = [];

      // if we're only looking for strong links, or including weak links as well
      var adjs = strong ? here.strong : here.weak.concat(here.strong);

      // try each applicable neighbour
      for (var a=0; a<adjs.length; a++) {
        var adj = adjs[a];
        if (adj === home) {
          // if we have reached the home node, a loop was found.
          if (pathTaken.length%2===0)
            // return immediately if it's an odd-length total path (will make major changes)
            return [pathTaken.concat(here.pos)];
          else
            // otherwise include this in the cycles we have found.
            result = result.concat([pathTaken.concat(here.pos)]);
        } else if (adj.visited !== tag) {
          // otherwise, if this is an unvisited neighbour, recurse to that neighbour
          var cycles = findCycles(home, nodes[adj], tag, !strong, pathTaken.concat([here.pos]));

          // include all cycles found, but if there is an odd one return that only
          for (var c=0; c<cycles.length; c++) {
            var cycle = cycles[c];
            if (cycle.length%2===1)
              return [cycle];
            else
            result.push(cycle);
          }
        }
      }
      return result;
    }

    // if the flag is given, draw the graph we have (so far).
    // this should NOT happen during autosolving.
    showGraph && drawGraph(nodes);


    // starting with a node, check its cycles, try to make some
    // changes to the grid
    var tag = 1; // to differentiate between cycle-finding passes
    var cyclesFromNodeYieldChange = function(pos) {
      var changed = false;
      var node = nodes[pos];
      // get all cycles (starting with strong links)
      var cycles = findCycles(pos, node, ++tag, true);
      // if there are more than two weak links here, get all cycles that start with
      // weak links. continue only if there is a single result (possible nice loops rule 3).
      if (node.weak.length>=2) {
        var weakCycles = findCycles(pos, node, ++tag, false);
        if (weakCycles.length===1) {
          weakCycles[0].isWeak = true;
          cycles.push(weakCycles[0]);
        }
      }
      for (var c=0; c<cycles.length; c++) {
        var cycle = cycles[c];
        if (cycle.length%2===1) {
          var startCell = sudokuCellsByPos[cycle[0]];
          if (cycle.isWeak===true) {
            startCell[v] = false;
            consolelog(`X-Cycle in value ${v+1} eliminates ${startCell.pos} (Nice Loops Rule 3). [unlikely]`);
            console.warn("NOTE: UNLIKELY RULE 3 FOUND.");
          } else {
            confirmCell(startCell, v);
            consolelog(`X-Cycle in value ${v+1} confirms ${startCell.pos} (Nice Loops Rule 2).`);
          }
          return true;
        } else {
          // nice loops (rule 1)
          if (clearXCycleNiceLoop(nodes, cycle, v)) {
            consolelog(`X-Cycle in value ${v+1} eliminates candidates from some cells (Nice Loops Rule 1).`);
            changed = true;
          }
        }
      }
      return changed;
    };

    // check if any of the nodes *with strong links*
    // create any changes
    for (var i=0; i<nodeLabels.length; i++) {
      var pos = nodeLabels[i];
      nodes[pos].terminusConsidered = true;
      if (cyclesFromNodeYieldChange(pos))  return true;
    }

    // the only option left is for rule 3 - we need to get
    // the rest of the weak links (not just between strong link nodes)
    var allCandCells = everyCellFilter(c => c[v]);
    var rule3Changed = false;
    for (var i=0; i<allCandCells.length; i++) {
      var cell = allCandCells[i];
      // ignore cells that have a strong link
      if (nodes[cell.pos]!==undefined) continue;

      // get cells with strong links that are neighbours
      var strongAdjs = [];
      for (var g=0; g<groupings.length; g++) {
        var groupingType = groupings[g].groupingType;
        // cells we've seen so far that share a group with this one
        var adjs = groupingInhabitants[groupingType][cell[groupingType]];
        for (var a=0; a<adjs.length; a++)
          if (strongAdjs.indexOf(adjs[a])===-1) strongAdjs.push(adjs[a]);
      }

      // we need at least two
      if (strongAdjs.length<2) continue;

      // try to get from one to the other, by hacking the cycle finder
      for (var a1=1; a1<strongAdjs.length; a1++) {
        var adj1 = strongAdjs[a1];
        for (var a2=0; a2<a1; a2++) {
          var adj2 = strongAdjs[a2];
          // the two strong nodes we're looking at can't share a weak link
          if (nodes[adj1].weak.indexOf(adj2)!==-1) continue;

          // this cell is the possible point of a rule 3 loop, with
          // the first and last strong nodes being adj1 and adj2.
          // see if they connect to eachother using the cycle finder
          var cycles = findCycles(adj1,nodes[adj2],++tag,true);
          for (var c=0; c<cycles.length; c++) {
            if (cycles[c].length%2===0) continue;
            // rule 3 found
            rule3Changed = true;
            cell[v] = false;
            consolelog(`X-Cycle in value ${v+1} eliminates ${cell.pos} (Nice Loops Rule 3).`);
          }
        }
      }
    }
    return rule3Changed;
  }

  function getAllGroupings(allowNonStandardGroups=false) {
    return [sudoku, sudokuCols, sudokuBoxes];
  }

  function clearXCycleNiceLoop(nodes, loop, v) {
    var changed = false;
    // here we assume that we're starting with a strong link.
    var weakLinks = getWeakPairsFromNiceLoop(loop);
    for (var w=0; w<weakLinks.length; w++) {
      var [pos1, pos2] = weakLinks[w];
      if (nodes[pos1].strong.indexOf(pos2)!==-1) continue; // actually a strong link
      var group = nodes[pos1].linkGroups[pos2];
      var notThese = (c) => c.pos!==pos1 && c.pos!==pos2;
      if (clearCands(group.filter(notThese),[v]))
        changed = true;
    }
    return changed;
  }

  function getWeakPairsFromNiceLoop(loop) {
    var result = [];
    for (var i=1; i<loop.length-1; i+=2)
      result.push([loop[i], loop[i+1]]);
    result.push([loop[loop.length-1], loop[0]]);
    return result;
  }

  function writeStrongLink(nodes,start,end) {
    if (nodes[start] === undefined) nodes[start] = {pos:start, cell:sudokuCellsByPos[start], strong: [end], weak: [], linkGroups:[]};
    else if (nodes[start].strong.indexOf(end)===-1) nodes[start].strong.push(end);
  }

  // we know that all nodes exist in 'nodes' already, and that 'weak' is never undefined
  function writeWeakLink(nodes, start, end, group) {
    if (nodes[start].strong.indexOf(end)!==-1) return;
    if (nodes[start].weak.indexOf(end)!==-1) return;
    nodes[start].weak.push(end);
    nodes[start].linkGroups[end] = group;
  }



/*
    ########  ########  ######   ####  #######  ##    ##  ######
    ##     ## ##       ##    ##   ##  ##     ## ###   ## ##    ##
    ##     ## ##       ##         ##  ##     ## ####  ## ##
    ########  ######   ##   ####  ##  ##     ## ## ## ##  ######
    ##   ##   ##       ##    ##   ##  ##     ## ##  ####       ##
    ##    ##  ##       ##    ##   ##  ##     ## ##   ### ##    ##
    ##     ## ########  ######   ####  #######  ##    ##  ######
*/

  function regionUniques() {
    var changed = false;
    for (var i=0; i<sudokuRegions.length; i++) {
      var region = sudokuRegions[i];
      if (clearAdjGroup(region, "[regions] ")) changed = true;
      if (nakedPairsGroup(region, "[regions] ")) changed = true;
    }
    return changed;
  }

/*
       ###    ########  ########   #######  ##      ##  ######
      ## ##   ##     ## ##     ## ##     ## ##  ##  ## ##    ##
     ##   ##  ##     ## ##     ## ##     ## ##  ##  ## ##
    ##     ## ########  ########  ##     ## ##  ##  ##  ######
    ######### ##   ##   ##   ##   ##     ## ##  ##  ##       ##
    ##     ## ##    ##  ##    ##  ##     ## ##  ##  ## ##    ##
    ##     ## ##     ## ##     ##  #######   ###  ###   ######
*/

/*
    ######## ##     ## ######## ########  ##     ##  #######   ######
       ##    ##     ## ##       ##     ## ###   ### ##     ## ##    ##
       ##    ##     ## ##       ##     ## #### #### ##     ## ##
       ##    ######### ######   ########  ## ### ## ##     ##  ######
       ##    ##     ## ##       ##   ##   ##     ## ##     ##       ##
       ##    ##     ## ##       ##    ##  ##     ## ##     ## ##    ##
       ##    ##     ## ######## ##     ## ##     ##  #######   ######
*/

  function thermoBasic() {
    var changed = false;
    sudokuThermos = sudokuThermos.filter((t) => (t.length>0));
    for (var i=0; i<sudokuThermos.length; i++) 
      if (thermoBasicSingle(sudokuThermos[i]))
        changed = true;
    return changed;
  }

  function cellMax(cell) {
    if (isSolved(cell)) return cell.solved;
    for (var v=9; v>=0; v--)
      if (cell[v]) return v;
    return -1;
  }

  function cellMin(cell) {
    if (isSolved(cell)) return cell.solved;
    for (var v=0; v<9; v++)
      if (cell[v]) return v;
    return -1;
  }

  function setCellMin(cell, min) {
    if (isSolved(cell)) return false;
    var changed = false;
    for (var v=0; v<min; v++) {
      changed = changed || cell[v];
      cell[v] = false;
    }
    return changed;
  }

  function setCellMax(cell, max) {
    if (isSolved(cell)) return false;
    var changed = false;
    for (var v=8; v>max; v--) {
      changed = changed || cell[v];
      cell[v] = false;
    }
    return changed;
  }

  function thermoBasicSingle(thermo) {
    // bulb to tip
    var changed = false;

    var min = cellMin(thermo[0])+1;
    for (var i=1; i<thermo.length; i++) {
      var cell = thermo[i];
      if (setCellMin(cell, min)) changed = true;
      min = cellMin(cell)+1;
    }

    // tip to bulb
    var max = cellMax(thermo[thermo.length-1])-1;
    for (var i=thermo.length-2; i>=0; i--) {
      var cell = thermo[i];
      if (setCellMax(cell, max)) changed = true;
      max = cellMax(cell)-1;
    }

    return changed;
  }

/*
    ##    ##  #######  ##    ##  ######   #######  ##    ##  ######
    ###   ## ##     ## ###   ## ##    ## ##     ## ###   ## ##    ##
    ####  ## ##     ## ####  ## ##       ##     ## ####  ## ##
    ## ## ## ##     ## ## ## ## ##       ##     ## ## ## ##  ######
    ##  #### ##     ## ##  #### ##       ##     ## ##  ####       ##
    ##   ### ##     ## ##   ### ##    ## ##     ## ##   ### ##    ##
    ##    ##  #######  ##    ##  ######   #######  ##    ##  ######
*/

function nonConsec() {
  if (nonConsNbrs()) return true;
  if (nonConsRowColHiddens()) return true;
  if (nonConsPairCells()) return true;
  return false;
}

function nonConsNbrs() {
  if (everyCell(cell => {
    if (!isSolved(cell)) return false;
    if (cell.nonConsCleared) return false;
    cell.nonConsCleared = true;
    return clearnonConsNbrs(cell);
  })) {
    consolelog('[non-consec] cleared consecutive candidates adjacent to confirmed cells.');
    return true;
  } return false;
}

function clearCons(cell, v) {
  var changed = false;
  if (cell[v-1]) {
    changed = true;
    cell[v-1] = false;
  }
  if (cell[v+1]) {
    changed = true;
    cell[v+1] = false;
  }
  return changed;
}

/** Clear a (confirmed) cell's neighbours of consecutive candidates. */ 
function clearnonConsNbrs(cell) {
  if (!isSolved(cell)) return false;
  return clearCands(getCellNbrs(cell), [cell.solved-1, cell.solved+1]);
}


function nonConsRowColHiddens() {
  return everyRowCol(function(group) {
    // each value
    var changed = false;
    for (var v=0; v<9; v++) {
      var mini = 9;
      var maxi = -1;
      var solved=false;
      for (var i=0; i<9; i++) {
        var cell = group[i];
        if (cell[v]) {
          if (i<mini) mini = i;
          else if (i>maxi) {
            maxi = i;
            if (maxi-mini>3) continue;
          }
        } else if (cell.solved === v) {
          solved = true;
          continue;
        }
      }
      if (solved) continue;
      if (maxi-mini>3) continue;
      if (nonConsClearRowColHidden(group, v, mini, maxi)) {
        consolelog(`[non-consec] cleared candidates that would eliminate ${v+1} in ${group.groupName}.`);
        changed = true;
      }
    }
    return changed;
  });
}

function nonConsClearRowColHidden(group, val, mini, maxi) {
  var clearCells = [];
  // if there are only two, we clear both. if there are three, we clear the middle one.
  if      (maxi===mini+1) clearCells = [group[mini], group[maxi]];
  else if (maxi===mini+2) clearCells = [group[mini+1]];
  var changed = false;
  for (var i=0; i<clearCells.length; i++) {
    var cell = clearCells[i];
    if (clearCons(cell, val)) changed = true;
  }
  return changed;
}

function nonConsPairCells() {
  return (everyCell(cell => {
    if (!hasNCandidates(2)(cell)) return false;
    var [v1, v2] = getCandidates(cell);
    if (v1+1===v2) {
      // for example 5 and 6 means neither can be neighbouring
      if (clearCands(getCellNbrs(cell), [v1, v2])) {
        consolelog(`[non-consec] cleared ${v1} and ${v2} from ${cell.pos} neighbours.`);
        return true;
      } return false;
    }
    else if (v1+2===v2) {
      // for example 2 and 4 means 3 cannot be neighbouring
      if (clearCands(getCellNbrs(cell), [v1+1])) {
        consolelog(`[non-consec] cleared ${v1+1} from ${cell.pos} neighbours.`);
        return true;
      } return false;
    }
  }));
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

  // this breaks it ?sandwich=true&edge=0,2,,0,2,,,20,20,22,,11,,33,,,,22&data=0,0,0,0,0,0,0,0,0,0,0,0,0A,0A,0A,0,0,0,0,0,0A,0,0,0,0A,0,0,0,0,0A,0,0,!4,0A,0,0,0,0,0,0,0,!6,0A,0,0,0,0,0,0A,0A,!9A,0,0,0,0,0,0A,0,0,0,0,0,0,0,0,0A,0A,0A,0A,0A,0,0,0,0,0,0,0,0,0,0,!8

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

    var [close, far] = waysToSumRange(sw, true);

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
    var cands = SWsumCandidates(sw, dist, dist);
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
    var [close, far] = waysToSumRange(sw, true);
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

    var [minSpread, maxSpread] = waysToSumRange(sw, true);
    
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

  function oneWayToSum(sw, sandwich=false) {
    var ways = waysToSum(sw, sandwich);
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
    var wayToSum = oneWayToSum(35-sw, true);
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

  //... i have no idea what this does
  function ensureIndices(arr) {
    if (arguments.length<3) return;
    if (arr[arguments[1]]===undefined)
      arr[arguments[1]] = [];
    // call the same function with a modified version of the arguments
    ensureIndices(arr[arguments[1]], ...(Array.from(arguments).slice(2)));
  }

  // the candidates for a sandwich sum with a minimum and maximum length.
  // e.g. if we must sum to 21 in between 3 and 4 cells, what are the cands?
  var SWsumCandidatesCache = [];
  function SWsumCandidates(sw, min=0, max=9) {
    // use cache if it exists
    ensureIndices(SWsumCandidatesCache,sw,min,max);
    if (SWsumCandidatesCache[sw][min][max] !== undefined)
      return SWsumCandidatesCache[sw][min][max];

    // figure out the candidates
    var ways = waysToSum(sw, true);
    var cands = [];
    for (var w=0; w<ways.length; w++) {
      var way = ways[w];
      if (way.length < min || way.length > max) continue;
      for (var i=0; i<way.length; i++)
        cands[way[i]-1] = true;
    }

    // cache result
    SWsumCandidatesCache[sw][min][max] = cands;
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

  function lenRange(list) {
    if (list.length===0) return [0, 0];
    var min = list[0].length;
    var max = list[0].length;
    for (var i=0; i<list.length; i++) {
      if (list[i].length < min) min = list[i].length;
      if (list[i].length > max) max = list[i].length;
    }
    return [min, max];
  }

  function waysToSumRange(total, sandwich=false) {
    var ways = waysToSum(total, sandwich);
    return [ways.minLength, ways.maxLength];
  }

  function sumCands(total, length=undefined) {
    var ways = waysToSum(total);
    var flags = [];
    for (var i=0; i<ways.length; i++) {
      var way = ways[i];
      if (length===undefined || way.length===length)
        for (var j=0; j<way.length; j++)
          flags[way[j]] = true;
    }
    var cands = [];
    for (var v=0; v<9; v++)
      if (flags[v])
        cands.push(v);
    return cands;
  }

  var waysToSumCache = [];
  var waysToSumCacheSW = [];
  function waysToSum(total, sandwich=false) {
    var cache = sandwich ? waysToSumCacheSW : waysToSumCache;
    if (cache[total] === undefined) {
      var cands = sandwich ? [2,3,4,5,6,7,8] : [1,2,3,4,5,6,7,8,9];
      cache[total] = decorateWaysList(waysToSumAux(total, cands, sandwich));
    }
    return cache[total];
  }

  // waysToSum, but enforce that each way of summing must include
  // the digit that is its own length.
  function waysToSumInclLength(total) {
    return waysToSum(total).filter(includesLength);
  }

  // whether a list of numbers includes its own length as an element.
  function includesLength(list) {
    return (list.indexOf(list.length)!==-1);
  }

  function waysToSumAux(total, vals=[1,2,3,4,5,6,7,8,9], sandwich=false) {
    if (sandwich) {
      // can't sum to less than 2 or more than 35
      if (total<2)  return [];
      if (total>35) return [];
    } else {
      // can't sum to less than 1 or more than 45
      if (total<1)  return [];
      if (total>45) return [];
    }
    

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
        var subWays = waysToSumAux(total-val, smallerVals, sandwich);
        for (var w=0; w<subWays.length; w++) {
          subWays[w].push(val);
        }
        ways = ways.concat(subWays);
      }
    }
    return ways;
  }
  
  function decorateWaysList(ways) {
    if (ways.length===0) {
      ways.minLength = 0;
      ways.maxLength = 0;
      return ways;
    }

    ways.sort(function(a, b){
      return a.length - b.length;
    });
  
    ways.minLength = ways[0].length;
    ways.maxLength = ways[ways.length-1].length;

    return ways;
  }

  function zeroesList(length) {
    var out = [];
    for (var i=0; i<length; i++)
      out.push(0);
    return out;
  }

  function waysToSumGeneral() {
    return decorateWaysList(waysToSumGeneralAux(...arguments));
  }

  function waysToSumSWLen(total,len) {
    return waysToSumGeneral(total, [2,3,4,5,6,7,8], len, len);
  }

  // vals must be in strictly increasing order
  function waysToSumGeneralAux(total, vals=[2,3,4,5,6,7,8], minLength=1, maxLength=9999, maxrepeat=1, used=zeroesList(vals.length)) {

    // reached max length
    if (maxLength===0) return [];
    // can't sum to less than 1 obviously
    if (total<1)  return [];

    // base case
    if (vals.length===0) return [];

    
    var ways = [];
    for (var i=vals.length-1; i>=0; i--) {
      var val = vals[i];

      // we have already use this value too many times
      if (used[i] >= maxrepeat) continue;

      if (val > total) {
        continue;
      } else if (val === total) {
          // only accept this as a way to finish the sum if we have already reached the minimum length
          if (minLength<=1)
            ways.push([val]);
      } else if (val < total) {
        // clone used, and mark this val as used once more
        var subUsed = used.slice(0, i+1);
        subUsed[i]++;

        // only use this value and smaller from now on
        var subVals = vals.slice(0,i+1);
        
        // get all the ways we can complete if after using this value
        var subWays = waysToSumGeneralAux(total-val, subVals, minLength-1, maxLength-1, maxrepeat, subUsed);

        // add this value to each of those ways
        for (var w=0; w<subWays.length; w++) {
          subWays[w].push(val);
        }

        // add all those ways to the final list
        ways = ways.concat(subWays);
      }
    }
  
    return ways;
  }





  // static
  function sandwichOneWayInside(group, sw, groupLabel) {
    // if the sw can only be summed one way (usually only 1 digit but not always),
    // then its one way of summing can't be right on the edge.
    var wayToSum = oneWayToSum(sw, true);
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
    var inWays = waysToSum(sw, true);
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
    var outWays = waysToSum(35-sw, true);
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
    var outsideCands = SWsumCandidates(35-sw, minOutsideCells);
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
        consolelog("There can be no " + (v+1) + " in " + group.groupName);
        error = true;
      }
    }
    return error;
  }

  function checkGroupForDuplicates(group) {
    var error = false;
    var solveds = [false,false,false,false,false,false,false,false,false];
    for (var c=0; c<9; c++) {
      var cell = group[c];
      if (isSolved(cell)) {
        if (solveds[cell.solved-1]) {
          error = true;
          consolelog("Found two confirmed " + (cell.solved+1) + "s in " + group.groupName);
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

  function nonConEnabled() {
    for (var i=0; i<strats.length; i++)
      if (strats[i].category==="Non-Consecutive" && strats[i].enabled) return true;
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

  function checkNonConErrors() {
    return everyCell((cell) => {
      if (!isSolved(cell)) return false;
      var nbrs = getCellNbrs(cell);
      for (var i=0; i<nbrs.length; i++) {
        var nbr = nbrs[i];
        if (!isSolved(nbr)) continue;
        if (Math.abs(cell.solved-nbr.solved)===1) return true;
      }
      return false;
    });
  }

  function sandwichErrors(group, sw) {
    console.log(group.groupName, sw);
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

    var report = "Checking basic sudoku rules... ";
    for (var i=0; i<9; i++) {
      errors = checkGroupForDuplicates(sudoku[i])      || errors;
      errors = checkGroupForEmpties(sudoku[i])         || errors;
      errors = checkGroupForDuplicates(sudokuCols[i])  || errors;
      errors = checkGroupForEmpties(sudokuCols[i])     || errors;
      errors = checkGroupForDuplicates(sudokuBoxes[i]) || errors;
      errors = checkGroupForEmpties(sudokuBoxes[i])    || errors;
    }
    if (errors) report += "ERRORS FOUND.\n";
    else        report += "GOOD.\n";

    var checkSpecialErrors = function(desc, enabledBool, checkFunc) {
      if (enabledBool) {
        report += `Checking ${desc} rules... `;
        if (checkFunc()) {
          errors = true;
          report += "ERRORS FOUND.\n";
        } else report += "GOOD.\n";
      }
    };

    checkSpecialErrors("sandwich", sandwichEnabled(), function(){return everyRowColSandwich(sandwichErrors, false);});
    checkSpecialErrors("anti-knight", antiknightEnabled(), checkAntiknightErrors);
    checkSpecialErrors("non-consecutive", nonConEnabled(), checkNonConErrors);

    return [errors, report];
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

  function initSudoku(data) {
    if (data) initSudokuData(data);
    else initSudokuBlank();
  }

  function makeBlankCell() {
    var cell = [];
    cell.isCell = true;
    return cell;
  }

  function initSudokuBlank() {
    // init lists to zero
    sudoku = [];
    sudokuCols = [];
    sudokuBoxes = [];
    sudokuCellsByPos = [];
    sudokuCellsTL = [];

    // for special strategies
    sudokuDiags = undefined;
    sandwichStaticFinished = false;

    // fill lists with empty lists
    for(var i=0; i<9; i++) {
      sudoku.push([]);
      sudokuCols.push([]);
      sudokuBoxes.push([]);
    }

    //TODO: there is an issue with caching causing errors
    var someCaching = false;
    for (var i=0; i<9; i++) {
      sudoku[i].groupName = "Row " + (i+1);
      sudoku[i].groupType = "row";
      sudoku[i].index = i;
      sudoku[i].canCache = someCaching;
      sudokuCols[i].groupName = "Col " + (i+1);
      sudokuCols[i].groupType = "col";
      sudokuCols[i].index = i;
      sudokuCols[i].canCache = someCaching;
      sudokuBoxes[i].groupName = "Box " + (i+1);
      sudokuBoxes[i].groupType = "box";
      sudokuBoxes[i].index = i;
      sudokuBoxes[i].canCache = someCaching;
    }
    sudoku.groupingType="row";
    sudokuCols.groupingType="col";
    sudokuBoxes.groupingType="box";

    for (var i=0; i<17; i++) {
      sudokuCellsTL.push([]);
      sudokuCellsTL[i].groupName = "TLSum " + (i+2);
      sudokuCellsTL[i].index = i;
    }

    // make all cells
    for (var c=0; c<9; c++) {
      for(var r=0; r<9; r++) {
        var b = boxNum(r,c);

        // make the cell and fill it with 'true'
        var cell = makeBlankCell();
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
        sudokuCellsTL[r+c].push(cell);
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

