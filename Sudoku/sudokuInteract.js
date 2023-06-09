
$(document).ready(function(){
  $(window).off("resize").on("resize", function(){
    makeSq();
  });
  onReady();
});

/*
  ######## ##     ##    ###    ##     ## ########  ##       ########  ######
  ##        ##   ##    ## ##   ###   ### ##     ## ##       ##       ##    ##
  ##         ## ##    ##   ##  #### #### ##     ## ##       ##       ##
  ######      ###    ##     ## ## ### ## ########  ##       ######    ######
  ##         ## ##   ######### ##     ## ##        ##       ##             ##
  ##        ##   ##  ##     ## ##     ## ##        ##       ##       ##    ##
  ######## ##     ## ##     ## ##     ## ##        ######## ########  ######
*/

// some example sudokus to test various strategies
const data_extreme1     = "000000050050793000430008006307000061000000000600002803900100032000654080000000000";
const data_expert1      = "001004900009000800020100070800005000100700342007090000000007005900200000600000010";
const data_xwing        = "000000004760010050090002081070050010000709000080030060240100070010090045900000000";
const data_ywing        = "900040000000600031020000090000700020002935600070002000060000073510009000000080009";
const data_zwing        = "090001700500200008000030200070004960200060005069700030008090000700003009003800040";
const data_zwing2       = "600000000500900007820001030340209080000080000080307025050400092900005004000000003";
const data_htriples     = "000000000231090000065003100008924000100050006000136700009300570000010843000000000";
const data_nakedpairs   = "400000938032094100095300240370609004529001673604703090957008300003900400240030709";
const data_hiddenpairs  = "720408030080000047401076802810739000000851000000264080209680413340000008168943275";
const data_hiddenquad   = "901500046425090081860010020502000000019000460600000002196040253200060817000001694";
const data_intersection = "016007803000800000070001060048000300600000002009000650060900020000002000904600510";
const data_nakedquads   = "000030086000020000000008500371000094900000005400007600200700800030005000700004030";
const data_nakedquads2  = "000030086000020040090078520371856294900142375400397618200703859039205467700904132"; // disable intersection
const data_swordfish    = "050030602642895317037020800023504700406000520571962483214000900760109234300240170";
const data_swordfish2   = "020040069003806200060020000890500010000000000030001026000010070009604300270050090";
const data_colors1      = "007083600039706800826419753640190387080367000073048060390870026764900138208630970";
const data_finned1      = "900040000704080050080000100007600820620400000000000019000102000890700000000050003"; // current can't solve this (nor can andoku)
const data_finned2      = "030605000800000030004010059000701006060000010500302000950020300070000008000107090"; // current can't solve this (nor can andoku)
const data_default = undefined; // this one will be loaded automatically.

// sandwich 1: ?sandwich=true&edge=15,9,26,8,8,12,0,12,6,7,14,20,2,8,26,10,31,16&data=000000000000900000010000000000009000000000000000800000000000050000005000000000000
// sandwich 2 (plus "9s follow 2s"): ?sandwich=true&edge=,29,,,2,,,20,20,24,13,7,10,12,4,25,0,2&data=0000029000000000000000000000000000000000000002000000009
// sandwich 3: ?sandwich=true&edge=17,17,17,17,20,22,27,17,0,17,17,17,17,20,22,27,17,0&data=00000000004002003000000000000000000002000001000000000000000000006009005
// sandwich 4 (not solved): ?sandwich=true&edge=19,7,15,19,4,0,6,9,35,5,13,20,9,12,0,4,14,5&data=00000000100000000000000000000000000000001

// antiknight 1: ?antiknight=true&data=000010000000302000009000300020000040300000005040000060004000700000108000000090000

// x-sudoku 1 (needs scc on diags): ?xsudoku=true&data=000000000001408300080020070070364050008209700040781090060090010002807500000000000
// x-sudoku 2:

/*
   ######   #######  ##    ## ######## ####  ######
  ##    ## ##     ## ###   ## ##        ##  ##    ##
  ##       ##     ## ####  ## ##        ##  ##
  ##       ##     ## ## ## ## ######    ##  ##   ####
  ##       ##     ## ##  #### ##        ##  ##    ##
  ##    ## ##     ## ##   ### ##        ##  ##    ##
   ######   #######  ##    ## ##       ####  ######
*/

// how long to wait between applying solving steps.
const stepDelay = 0;
const flashDelay = Math.max(10, stepDelay*0.9);

const NOTATION_BASE_CLR = "#BBB";

const SWATCH_COLORS = [
  '#1bd56f', 
  '#77eee7', 
  '#4aa3e8', 
  '#9dee77', 
  '#ffb4ff', 
  '#ac77ee', 
  '#eee777', 
  '#eeac77', 
  '#ee777e'
];


/*
   ######  ########    ###    ######## ########
  ##    ##    ##      ## ##      ##    ##
  ##          ##     ##   ##     ##    ##
   ######     ##    ##     ##    ##    ######
        ##    ##    #########    ##    ##
  ##    ##    ##    ##     ##    ##    ##
   ######     ##    ##     ##    ##    ########
*/

// input globals
const SETNOTHING = 0;
const SETFULL = 1;
const SETCAND = 2;
const SETCOLOR = 3;
const SETTHERMO = 4;
const SETLINE = 5;
const SETARROW = 6;

const NUM_COLORS = 18;

// input state
var inputState = SETNOTHING;
var dragState  = undefined; // undefined = nothing. -1 = clear. 0-(NUM_COLORS-1) = set swatch. -2 = select
var inputNum   = undefined;

var ls = window.localStorage;


/*
  #### ##    ## #### ########
   ##  ###   ##  ##     ##
   ##  ####  ##  ##     ##
   ##  ## ## ##  ##     ##
   ##  ##  ####  ##     ##
   ##  ##   ###  ##     ##
  #### ##    ## ####    ##
*/

function queryBool(value) {
  return (value==="true");
}

function enableStrats(stratCat) {
  for (var i=0; i<strats.length; i++)
    if (strats[i].category === stratCat)
      strats[i].enabled = true;
}

// when the page is loaded, check if there is a query variable,
// otherwise load the example from the settings.
function onReady(buildUI=true) {
  // prepare the board with the appropriate givens.
  var data = getQueryVariable("data");
  var edge = getQueryVariable("edge", false);
  var sandwich = queryBool(getQueryVariable("sandwich"));
  var antiknight = queryBool(getQueryVariable("antiknight"));
  var xsudoku = queryBool(getQueryVariable("xsudoku"));

  if (data) {
    initSudoku(data);
  } else {
    initSudoku(data_default);
  }

  if (edge) initEdges(edge);

  parseSwatches();

  parseRegions();

  // get region labels from the URL
  parseRegionLabels();

  parseDescription();

  // get thermos
  parseThermos();

  // get arrows
  parseArrows();

  // get kropkis
  parseKropkis();

  // maybe set display mode
  parseDisplayMode();

  // get thermos
  parseLines();

  buildUI && loadSavedEnabledStrats();
  if (sandwich) enableStrats("Sandwich");
  if (antiknight) enableStrats("Anti-Knight");
  if (xsudoku) enableStrats("X Sudoku")
  setupAutoClearOption();

  // set up the individual solver buttons
  buildUI && initSolverButtons();

  // set up controls behaviour
  initControls();

  // kb and mouse global
  initKeyboardMouse();

  // show the board
  buildTable();
  refreshHighlights();

  // make the board square (also happens on resize)
  makeSq();
}

function loadSavedEnabledStrats() {
  for (var i=0; i<strats.length; i++) {
    var strat = strats[i];
    if (strat.specialty) continue;
    var storedState = ls.getItem(strat.name);
    if (storedState === "true") strat.enabled = true;
    else if (storedState === "false") strat.enabled = false;
  }
}

function getFlagString() {
  var out = [];
  var sandwich = queryBool(getQueryVariable("sandwich"));
  var antiknight = queryBool(getQueryVariable("antiknight"));
  var xsudoku = queryBool(getQueryVariable("xsudoku"));
  if (sandwich)   out.push(`sandwich=${sandwich}`);
  if (antiknight) out.push(`antiknight=${antiknight}`);
  if (xsudoku)    out.push(`xsudoku=${xsudoku}`);
  return out.join(",");
}


// set up the solver buttons
function initSolverButtons() {
  var cont = $("#solvers");

  // list strategies by their category
  for (var c=0; c<strat_categories.length; c++) {
    // category heading
    var cat = strat_categories[c];
    cont.append($("<div>").text(cat).addClass("stratcat"));

    // buttons for category
    for (var i=0; i<strats.length; i++) {
      var strat = strats[i];
      if (strat.category !== cat) continue;
      var button = $("<button>")
        .addClass('solvebutton')
        .text(strat.name)
        .click(solverButton(strat));
      var check = $("<input>")
        .attr('type', 'checkbox')
        .prop('checked', strat.enabled)
        .change(stratCheckboxUpdated(strat));
      var btndiv = $("<div>")
        .append(check)
        .append(button)
        .addClass('btndiv');
        cont.append(btndiv);

      // tell the start about these controls
      // (in case we want to manipulate them later)
      strat.button = button;
      strat.checkbox = check;
    }
  }
}

// set up controls
function initControls() {
  $("table#confirm").find("td").each(function(ind){
    var that = $(this);
    that.off("click").click(function(){
      controlClicked.call(that, ind, SETFULL);
    });
  });
  $("table#candidate").find("td").each(function(ind){
    var that = $(this);
    that.off("click").click(function(){
      controlClicked.call(that, ind, SETCAND);
    });
  });
  $("table#swatches").find("td").each(function(ind){
    var that = $(this);
    that.attr("swatch",ind);
    that.off("click").click(function(){
      controlClicked.call(that, ind, SETCOLOR);
    });
  });

  $("select#displaymode").change(function(){
    setDisplayMode($(this).val());
  });
}

function initKeyboardMouse() {
  $(document).off("keydown").keydown(processKeys);
  $(document).off("keyup").keyup(processKeysUp);
  $(document).off("mouseup").on("mouseup", function(){
    dragState = undefined;
  });
}

/* AUTO-CLEAR BUTTON */
function setupAutoClearOption() {
  var check = $("#autoclearadjs");

  // load saved state
  var rawval = ls.getItem("autoclearadjs");
  var checked = (rawval === null) || (rawval === 'true');
  check.prop("checked", checked);

  // set up save behaviour
  check.off("change").change(function(){
    ls.setItem("autoclearadjs", $(this).prop("checked"));
  });
}



/* DISPLAY MODES */
const DEFAULT_DISPLAY_MODE = "display_normal"
var display_mode = DEFAULT_DISPLAY_MODE;

function getDisplayMode() {
  if (display_mode === undefined)
    display_mode = DEFAULT_DISPLAY_MODE;
  return display_mode;
}

function setDisplayMode(mode, overrideGUI=false) {
  display_mode = mode;
  if (overrideGUI) overrideDisplayMode(display_mode);

  if (display_mode === "display_noboxes") {
    $("table#tbl").toggleClass("withboxes", false);
  } else if (display_mode === "display_normal") {
    $("table#tbl").toggleClass("withboxes", true);
  }
}

// update the drop down for "display mode" (whether or not to show box lines)
function overrideDisplayMode(mode) {
  $("select#displaymode>option").each(function(index, t) {
    var opt = $(t);
    opt.prop('selected', opt.val() === mode);
  });
}


/*
   #######  ##    ##  ######  ##       ####  ######  ##    ##    ######## ########  ######
  ##     ## ###   ## ##    ## ##        ##  ##    ## ##   ##     ##          ##    ##    ##
  ##     ## ####  ## ##       ##        ##  ##       ##  ##      ##          ##    ##
  ##     ## ## ## ## ##       ##        ##  ##       #####       ######      ##    ##
  ##     ## ##  #### ##       ##        ##  ##       ##  ##      ##          ##    ##
  ##     ## ##   ### ##    ## ##        ##  ##    ## ##   ##     ##          ##    ##    ##
   #######  ##    ##  ######  ######## ####  ######  ##    ##    ########    ##     ######
*/


function autoButton(e) {
saveUndoState("AUTOSOLVE");
autoSolve(e.shiftKey);
}

function setCellsOnly() {
setCellsOnlyPropmt(getSelectedCells());
}

function setCellsNot() {
setCellsNotPropmt(getSelectedCells());
}

function setCellsSame() {
setCellsSameActual(getSelectedCells());
}

function moveSelection(relnFn) {
var cells = getSelectedCells();
var cellsMoved = cells.map(relnFn);
var hasUndefined = cellsMoved.some(c => c === undefined);
if (!hasUndefined)
  setSelectedCells(cellsMoved);
}

function moveSelectionUp()    { moveSelection(cellAbove); }
function moveSelectionDown()  { moveSelection(cellBelow); }
function moveSelectionLeft()  { moveSelection(cellLeft); }
function moveSelectionRight() { moveSelection(cellRight); }

function setCellsOnlyPropmt(cells) {
if (cells.length===0) return;
var pText = "Enter the digits to intersect as candidates for this cell. 0=force all";
if (cells.length>1)
    pText = "Enter the digits to intersect as candidates for these cells. 0=force all";
var input = prompt(pText);
if (input === null) return;
clearSolvedCache();
storeUndoState();
for (var c=0; c<cells.length; c++) {
  var cell = cells[c];
  if (isSolved(cell)) continue;
  if (input === "0") {
    cell.solved = undefined;
    cell.isSolved = undefined;
    for (var v=0; v<9; v++)
      cell[v] = true;
  } else if (input.length === 1) {
    var v = parseInt(input);
    confirmCell(cell,v-1);
  } else if (input.length > 1) {
    cell.solved = undefined;
    cell.isSolved = undefined;
    var cands = [];
    for (var i=0; i<input.length; i++)
      cands.push(parseInt(input.charAt(i))-1);
    for (var v=0; v<9; v++) {
      if (cell[v] && cands.indexOf(v)===-1)
        cell[v] = false;
    }
  }
}
saveStoredUndoState("Set "+cells.map((c)=>c.pos).join("+")+" to "+input);
refresh();
}

function setCellsNotPropmt(cells) {
if (cells.length===0) return;
var pText = "Enter the digits to remove as candidates for this cell. 0=no change";
if (cells.length>1)
    pText = "Enter the digits to remove as candidates for these cells. 0=no change";
var input = prompt(pText);
if (input === null) return;
clearSolvedCache();
storeUndoState();
for (var c=0; c<cells.length; c++) {
  var cell = cells[c];
  if (isSolved(cell)) continue;
  if (input === "0") {
    cell.solved = undefined;
    cell.isSolved = undefined;
    for (var v=0; v<9; v++)
      cell[v] = true;
  } else {
    cell.solved = undefined;
    cell.isSolved = undefined;
    for (var i=0; i<input.length; i++) {
      var v=parseInt(input.charAt(i));
      cell[v-1] = false;
    }
  }
}
saveStoredUndoState("Removed "+input+" from "+cells.map((c)=>c.pos).join("+"));
refresh();
}

function setCellsSameActual(cells, confirmCells=false) {
if (cells.length<2) {
  alert("Select multiple cells before using this feature.");
  return;
};
clearSolvedCache();
storeUndoState();

// figure out which candidates are in all cells
var candIntersection = [true, true, true, true, true, true, true, true, true];
for (var v=0; v<9; v++) {
  var all = true;
  for (var c=0; c<cells.length; c++)
    if (!cells[c][v]) {
      candIntersection[v] = false;
      break;
    }
}
var changed = false;
for (var v=0; v<9; v++) {
  if (candIntersection[v] === false) {
    for (var c=0; c<cells.length; c++) {
      if (!changed && cells[c][v]) changed = true;
      cells[c][v] = false;
    }
  }
}

if (changed)
  saveStoredUndoState("Intersected candidates in "+cells.map((c)=>c.pos).join("+"));
refresh();
}


function checkButton() {
var [err, report] = checkErrors();
if (err) {
  alert(report);
} else {
  alert(report)
}
}

function resetButton() {
onReady(false);
}

function setDblClick(element, cell) {
element.dblclick(function(e){
    if (!e.shiftKey) {
      if (inputState !== SETNOTHING) return;
      setCellsOnlyPropmt([cell]);
    }
  });
}

// a solver button has been clicked
// strat:the strategy for that button
function solverButton(strat) {
// return a function that saves an undo state
// if the strat's function succeeds
return function() {
  storeUndoState();
  if (!strat.func()) return false;
  saveStoredUndoState(strat.sname);
  refresh();
  return true;
};
}


function setCellBehaviour(td, cell) {
setDblClick(td,cell);
setCellMouseDown(td,cell);
}

function setEdgeBehaviour(td, edgeind, ind) {
td.dblclick(function(){
  var input = prompt("Enter an edge/corner value");
  if (input === undefined) return;
  var input = maybeIntify(input);
  sudokuEdges[edgeind][ind] = input;
  sandwichStaticFinished = false;
  refresh();
});
// why the fuck is this backwards lol
// edit a year later: still don't know.
var isSet = false;
if (edgeind===1 || edgeind===2)
  if (sudokuCols[ind].sandwichFullySet)
    isSet = true;
else
  if (sudoku[ind].sandwichFullySet)
    isSet = true;
if (isSet) {
  td.addClass("fullyset");
}
}

// a control button (confirm/candidate/color) has been clicked
// ind:index of button, state:state for button, this:the td of the button
var prevSelectedControl = undefined;
function controlClicked(ind, state) {

// if we click on a color during some other modes, modify that mode.
if (state === SETCOLOR && inputState === SETLINE) {
  setWorkingLineColor(ind);
  refreshOverlay();
  return;
}

// deselect previous control
if (prevSelectedControl) prevSelectedControl.removeClass("selected");

// pressing the selected button again turns the controls off
if (inputState===state && inputNum===ind) {
  inputState = SETNOTHING;
  inputNum = undefined;
  refreshHighlights();
  return;
}

// change the current state
inputState = state;
inputNum = ind;

// refresh highlights to account for the new state
refreshHighlights();

// select this control and remember it for next time
this.addClass("selected");
prevSelectedControl = this;
}

function enableStrat(strat) {
strat.enabled = true;
if (strat.specialty) return;
ls.setItem(strat.name, true);
}

function disableStrat(strat) {
strat.enabled = false;
if (strat.specialty) return;
ls.setItem(strat.name, false);
}

// the checkbox for a particular strategy has been updated
function stratCheckboxUpdated(strat) {
// return the function to define that checkbox's behaviour
return function() {
  if ($(this).prop('checked'))
    enableStrat(strat);
  else
    disableStrat(strat);
}
}

function updateAllCheckboxes() {
for (var i=0; i<strats.length; i++) {
  var strat = strats[i];
  strat.checkbox.prop('checked', strat.enabled);
}
}

function spaceClear() {
// space means clear. unclick whatever is selected.
$("#ctrl").find(".selected").click();
$("#bottombuttons").find(".selected").click();
// if (inputState===SETTHERMO) clearEmptyThermos();
// if (inputState===SETLINE)   clearEmptyLines();
inputState = SETNOTHING;
// also clear selected cells from the grid
clearSelected();
}

// remember when a shift key is released (hack for numpad keys)
var shiftUpTime = Date.now();
function processKeysUp(e) {
if (e.code.startsWith("Shift"))
  shiftUpTime = Date.now();
}

// deal with key presses
function processKeys(e) {
var shift = e.shiftKey;
var code  = e.code;
var modKey = e.shiftKey || e.metaKey || e.ctrlKey || e.altKey;

if (code.startsWith("Digit") || code.startsWith("Numpad")) {
  // deal with digits
  if (code === "Digit0" || code === "Numpad0") return true;
  var num = code.substring(5); // digit
  if (code.startsWith("Numpad"))  {
    num = code.substring(6);
    if (!shift && (Date.now() - shiftUpTime)<50) {
      // if the shift key ONLY JUST went up, pretend it's still down
      // this is to account for windows removing the shift key when
      // numpad keys are pressed.
      shift = true;
    }
  }

  if (shift)
    $("table#candidate").find("td:contains('"+num+"')").click();
  else
    $("table#confirm").find("td:contains('"+num+"')").click();
  return false;
} else if (code==="Space") {
  spaceClear();
  return false;
} else if (code==="KeyU") {
  // undo. flash the button and perform an undo
  flashButton($("#undobutton"));
  undo();
} else if (code==="KeyD" && !modKey) {
  descriptionButton();
} else if (code==="KeyR" && !modKey) {
  regionsButton();
} else if (code==="KeyL" && !modKey) {
  addLine();
} else if (code==="KeyT" && !modKey) {
  addThermo();
} else if (code==="KeyA" && !modKey) {
  addArrow();
} else if (code==="KeyK" && !modKey) {
  addKropki();
} else if (code==="KeyS" && !modKey) {
  setCellsOnly();
} else if (code==="KeyN" && !modKey) {
  setCellsNot();
} else if (code==="KeyM" && !modKey) {
  setCellsSame();
} else if (code==="ArrowUp" && !modKey) {
  moveSelectionUp();
} else if (code==="ArrowDown" && !modKey) {
  moveSelectionDown();
} else if (code==="ArrowLeft" && !modKey) {
  moveSelectionLeft();
} else if (code==="ArrowRight" && !modKey) {
  moveSelectionRight();
}
return true;
}

// unselect any selected cells in the grid
function clearSelected() {
$("#tbl").find("td.selected").removeClass("selected");
}

function setSelectedCells(cells) {
clearSelected();
cells.forEach(c => {
  c.td.addClass("selected");
});
}

function hideVs() {
for (var i=1; i<10; i++)
  $(`v${i}`).hide();
}

function showVs() {
for (var i=1; i<10; i++)
  $(`v${i}`).show();
}

const regularRegexp  = /^[0-9]+$/;
const b64Regexp = /^[0-9A-Za-z\-\_]+$/;
function importSudokuData(data) {
if (typeof data !== "string") return;

if (data.match(regularRegexp)) {
  // simple comma-separated values
  for (var i=0; i<data.length; i++) {
    var r = Math.floor(i/9);
    var c = i % 9;
    var ch = parseInt(data.charAt(i));
    if (ch > 0)
      confirmCell(sudoku[r][c], ch-1);
    else
      blankCell(sudoku[r][c]);
  }
} else if (data.includes(",")) {
  // complex comma-separated values
  data = data.split(',');
  for (var i=0; i<data.length; i++) {
    var r = Math.floor(i/9);
    var c = i % 9;
    setCellFromState(sudoku[r][c], data[i]);
  }
} else if (data.match(b64Regexp)) {
  // b64 data
  var list = b64ListDecompress(listifyB64CellString(data));
  for (var i=0; i<list.length; i++) {
    var r = Math.floor(i/9);
    var c = i % 9;
    setCellFromState(sudoku[r][c], b64ToStatefulString(list[i]));
  }

}
refreshRegionLabels();
}

const reData = /^(!?[0-9]*)(c([A-Z]))?(r([0-9]+))?$/;
function setCellFromState(cell, data) {
cell.solved = undefined;
cell.isSolved = undefined;
cell.adjCleared = undefined;

res = data.match(reData);

var cands = res[1];
var swatch = res[3];
var region = res[5];

// candidates
if (cands.length>1 && cands[0]==='!') {
  var v = parseInt(cands[1]);
  confirmCell(cell,v-1)
} else if (cands==="0") {
  blankCell(cell);
} else {
  for (var i=0; i<9; i++) cell[i]=false;
  for (var i=0; i<cands.length; i++) {
    var v = parseInt(cands[i])-1;
    cell[v] = true;
  }
}

// swatch
cell.swatch = swatchFromChar(swatch);

// region
if (region !== undefined)
  cell.region = parseInt(region);

}


const candsAndSwatch = /^!?[0-9]*[A-I]$/
function setCellFromState2(cell, data) {
cell.solved = undefined;
cell.isSolved = undefined;
cell.adjCleared = undefined;

var swatch = '';
var cands = '';
if (data.match(candsAndSwatch)) {
  swatch = data.substring(data.length-1);
  cands = data.substring(0,data.length-1);
} else {
  cands = data;
}
cell.swatch = swatchFromChar(swatch);
if (cands.length>1 && cands[0]==='!') {
  var v = parseInt(cands[1]);
  confirmCell(cell,v-1)
} else if (cands==="0") {
  blankCell(cell);
} else {
  for (var i=0; i<9; i++) cell[i]=false;
  for (var i=0; i<cands.length; i++) {
    var v = parseInt(cands[i])-1;
    cell[v] = true;
  }
}
}

function importButton() {
var input = "" + prompt("Enter 81 digits, like \"0814\"... 0 means unknown. Alternatively, enter a stateful export string provided by this app (containing commas and letters)");
initSudoku(input);
refresh();
}

function descriptionButton() {
var input = prompt("Enter a description (HTML is allowed)", getDescription());
if (input === null) return;
setDescription(input);
refreshHighlights();
}

function setDescription(html) {
$("#description").html(html);
}

function getDescription() {
return $("#description").html();
}

function encodeURIComponentPlus(s) {
return encodeURIComponent(s).replaceAll("+", "%2B").replaceAll("%20", "+");
}

function decodeURIComponentPlus(s) {
return decodeURIComponent(s.replaceAll("+", "%20"));
}

function getDescriptionExportString() {
return encodeURIComponentPlus(getDescription());
}

function parseDescription() {
var descriptionHTML = getQueryVariable('desc');
setDescription(descriptionHTML);
}

function edgesButton() {
var input = "" + prompt("Enter 36 values, comma separated. Top (LTR), Left (TTB), Right (LTR), Bottom(TTB).");
if (input!=="null" && input !== undefined) {
  initEdges(input);
  refresh();
}
}

const edgeReg = /^[0-9]+$/
function maybeIntify(str) {
if (str===undefined) return undefined;
if (str.match(edgeReg)) {
  return parseInt(str);
}
return str;
}


function initEdges(data){
// check if we are dividing by "," or "-"
var commaCount = (data.match(/,/g) || []).length;
var dashCount  = (data.match(/-/g) || []).length;
// console.log(`edge has ${commaCount} commas`);
// console.log(`edge has ${dashCount} dashes`);
var delim = (commaCount > dashCount) ? "," : "-";

sudokuEdges = [[],[],[],[]];
var data = data.split(delim);
for (var i=0; i<data.length; i++) {
  // which edge i'm on (top left bottom right)
  var edge = Math.floor(i/9);
  // where on the edge this value is
  var ind  = i%9;
  if (edge>3) break; // if there's too much data here
  var edgeVal = maybeIntify(decodeURIComponent(data[i]));
  sudokuEdges[edge][ind] = edgeVal;
}
}

function getEdgeExportString() {
var out = [];
for (var i=0; i<sudokuEdges.length; i++) {
  for (var e=0; e<9; e++) {
    var edge = sudokuEdges[i][e];
    if (edge===undefined)edge="";
    edge = encodeURIComponent(edge);
    out.push(edge);
  }
}
return out.join("-").replace(/-+$/,'');
}

function getUsedRegions() {
var rgns = [];
for (var r=0; r<9; r++) {
  for (var c=0; c<9; c++) {
    var rgn = sudoku[r][c].region;
    if (rgn===undefined) continue;
    if (rgns.indexOf(rgn)===-1)
      rgns.push(rgn);
  }
}
return rgns;
}

function getRegionLabelExportString() {
var out = [];
var regions = getUsedRegions();
for (var i=0; i<regions.length; i++) {
  var region = regions[i];
  var label = regionLabels[region];
  out.push(`rgn${region}=${encodeURIComponent(label)}`);
}
return out.join("&");
}

function parseRegionLabels() {
var regions = getUsedRegions();
for (var i=0; i<regions.length; i++) {
  var region = regions[i];
  var label = getQueryVariable(`rgn${region}`);
  regionLabels[region] = label;
}
}

function getCellListsExportString(cellLists) {
return cellLists.map(getCellListExportString).join(",");
}

function getCellListExportString(cellList) {
return cellList.map(c => c.pos).join("");
}

function not_undefined(x) { return (x !== undefined); }


function getColorAndCellsListExportString(colorAndCellsList) {
return colorAndCellsList.map(getColorAndCellsExportString).join(",");
}

function getColorAndCellsExportString(colorAndCells) {
if (colorAndCells.color === undefined)
  return getCellListExportString(colorAndCells.cells);
return [swatchToChar(colorAndCells.color % 9), getCellListExportString(colorAndCells.cells)].join("|");
}

function parseColorAndCellsList(colorAndCellsListString) {
if (colorAndCellsListString === undefined) return [];
return colorAndCellsListString
  .split(",")
  .map(parseColorAndCells);
}

function parseColorAndCells(colorAndCellsString) {
var color = undefined;
var cellsString = colorAndCellsString;
if (colorAndCellsString.includes("|")) {
  [color, cellsString] = colorAndCellsString.split("|");
  color = swatchFromChar(color);
}
return {color: color, cells: parseCells(cellsString)};
}

function parseCells(cellsString) {
if (cellsString===undefined) return undefined;
return cellsString
  .match(/.{4}/g)
  .map(p => sudokuCellsByPos[p]);
}

function parseCellsList(cellsListString) {
if (cellsListString===undefined) return [];
return cellsListString
  .split(",")
  .map(parseCells)
  .filter(not_undefined);
}

function parseArrowList(arrowListString) {
var out = [];
if (arrowListString===undefined) return [];
var arrows = arrowListString.split(",");
for (var i=0; i<arrows.length; i++) {
  var [base, shoulder, shaft] = arrows[i].split("|");
  var baseCellRefs  = base.match(/.{4}/g);
  var baseCells = baseCellRefs.map((r) => sudokuCellsByPos[r]);
  var shoulderCell = undefined;
  var shaftCells = [];

  if (arrows[i].indexOf("|") !== -1) {
    // this arrow has more than just a base
    shoulderCell = sudokuCellsByPos[shoulder];
    var shaftCellRefs = shaft.match(/.{4}/g);
    shaftCells = shaftCellRefs.map((r) => sudokuCellsByPos[r]);
  }

  var arrow = {base: baseCells, shoulder: shoulderCell, shaft: shaftCells};
  out.push(arrow);
}
return out;
}

function getThermosExportString() {
return getCellListsExportString(sudokuThermos);
}

function getLinesExportString() {
return getColorAndCellsListExportString(sudokuLines);
}

function getArrowsExportString() {
var out = [];
for (var i=0; i<sudokuArrows.length; i++) {
  var arrow = sudokuArrows[i];
  var base = arrow.base.map((c)=>c.pos).join("");
  if (arrow.shaft.length === 0) {
    out.push(base)
  } else {
    var shoulder = arrow.shoulder.pos;
    var shaft = arrow.shaft.map((c)=>c.pos).join("");
    out.push([base, shoulder, shaft].join("|"));
  }
}
return out.join(",");
}

function getKropkisExportString() {
var out = [];
for (var i=0; i<sudokuKropkis.length; i++) {
  var krop = sudokuKropkis[i];
  out.push([krop.cell1.pos, krop.cell2.pos, krop.style].join("|"));
}
return out.join("||");
}

function parseKropkiList(kropkiListString) {
var out = [];
if (kropkiListString===undefined) return [];
var krops = kropkiListString.split("||");
for (var i=0; i<krops.length; i++) {
  var [c1pos, c2pos, style] = krops[i].split("|");
  var kropki = {cell1: sudokuCellsByPos[c1pos],
                cell2: sudokuCellsByPos[c2pos],
                style: style};
  out.push(kropki);
}
return out;
}

function parseKropkis() {
sudokuKropkis = parseKropkiList(getQueryVariable('krops'));
}

function parseThermos() {
sudokuThermos = parseCellsList(getQueryVariable('thermos'));
}

function parseArrows() {
sudokuArrows = parseArrowList(getQueryVariable('arrows'));
}

function parseLines() {
sudokuLines = parseColorAndCellsList(getQueryVariable('lines'));
}

function parseDisplayMode() {
var mode = getQueryVariable('display');
setDisplayMode(mode, true);
}


// briefly flash the button given
// this is sometimes called by the (auto)solver
function flashButton(btn) {
btn.removeClass("highlight").addClass("highlight");
setTimeout(function(){
  btn.removeClass("highlight");
}, flashDelay);
}

function getQueryVariable(variable, decode=true) {
var query = window.location.search.substring(1);
var vars = query.split("&");
for (var i=0;i<vars.length;i++) {
  var pair = vars[i].split("=");
  if(pair[0] == variable) {
    if (decode) return decodeURIComponentPlus(pair[1]);
    return pair[1];
  }
}
return undefined;
}


/*
######## ##     ## ########   #######  ########  ########
##        ##   ##  ##     ## ##     ## ##     ##    ##
##         ## ##   ##     ## ##     ## ##     ##    ##
######      ###    ########  ##     ## ########     ##
##         ## ##   ##        ##     ## ##   ##      ##
##        ##   ##  ##        ##     ## ##    ##     ##
######## ##     ## ##         #######  ##     ##    ##
*/

// this is how we generate a full export link.
function makeExportLink() {
var URLentries = [];

// var meow = get81ExportString();
// if (meow) URLentries.push(`meow=${meow}`);

var data = getB64StatefulExportString();
if (data) URLentries.push(`data=${data}`);

var colors = getSwatchesExportString();
if (colors) URLentries.push(`clr=${colors}`);

var regions = getRegionsExportString();
if (regions) URLentries.push(`rgn=${regions}`)

var flags = getFlagString();
if (flags) URLentries.push(flags);

var edge = getEdgeExportString();
if (edge) URLentries.push(`edge=${edge}`);

var labels = getRegionLabelExportString();
if (labels) URLentries.push(labels);

var thermos = getThermosExportString();
if (thermos) URLentries.push(`thermos=${thermos}`);

var arrows = getArrowsExportString();
if (arrows) URLentries.push(`arrows=${arrows}`);

var krops = getKropkisExportString();
if (krops) URLentries.push(`krops=${krops}`);

var lines = getLinesExportString();
if (lines) URLentries.push(`lines=${lines}`);

if (getDisplayMode() !== DEFAULT_DISPLAY_MODE)
  URLentries.push(`display=${getDisplayMode()}`);

var description = getDescriptionExportString();
if (description) URLentries.push(`desc=${description}`);

var URL = "?" + URLentries.join("&");

// var URL = `?${flags}${edges}&data=${data}`
$("#exportLink").attr("href", URL);
}

/*
 ___  .____  .     .          __    __     .    .     .     . .____    _____
.'   \ /      /     /          |     |     /|    /     /     / /       (
|      |__.   |     |           \    /    /  \   |     |     | |__.     `--.
|      |      |     |            \  /    /---'\  |     |     | |           |
`.__, /----/ /---/ /---/         \/   ,'      \ /---/  `._.'  /----/ \___.'
*/

function getB64StatefulExportString() {
if (noCellsOnBoard(c => getB64Cell(c)!=="0")) return undefined;
return b64ListCompress(sudokuCells.map(getB64Cell)).join("");
}

/*
HOW THE B64 CELL EXPORT WORKS:
We use either one or two b64 characters to represent a cell.
If it's a single character, it's 0-9 (simple cell states).
If it starts with a non-numeral, the second character might be numeral.
Starting with "A" or "B" means the previous character is being repeated (simple compression).
Starting with anything else means we represent

Values:
0 - 639    : untouched or solved, *OR*
640 - 767  : repeat the last cell N (1-80) times *OR*
768 - 1280 : candidates (9 bits)

Characters:
"0" - "9" : simple cells
"A0" or "B_" : repeating previous cell
"C0" - "J_" : complex cell
*/

function getB64Cell(cell) {
if (isSolved(cell))
  return ""+(cell.solved+1);
var bits = 0;
var power = 1;
for (var v=0; v<9; v++) {
  if (cell[v]) bits += power;
  power *= 2;
}
if (bits===511)
  return "0";
return toB64(768+bits);
}


/* simple base64 encoding and decoding */
const b64Chars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
function toB64(x, pad=0) {
return x
.toString(2)
.split(/(?=(?:.{6})+(?!.))/g)
.map(v=>b64Chars[parseInt(v,2)])
.join("")
.padStart(pad,"0");
}

function fromB64(x) {
return x
  .split("")
  .reduce((s,v)=>s*64+b64Chars.indexOf(v),0)
}


// this assumes DECOMPRESSED b64 (i.e. no repeat characters)
function b64ToStatefulString(b64) {
if (b64.length === 1) {
  // simple case. add a ! if it's not "0"
  if (b64 === "0")
    return "0";
  return "!"+b64;
}
var val = fromB64(b64);
if (val < 768) return "0"; // this should never happen
var bitsString = (val-768).toString(2).padStart(9);
var out = "";
for (var v=0; v<9; v++) {
  if (bitsString[8-v]==="1")
    out = out + (v+1);
}
return out;
}

function listifyB64CellString(data) {
return data.match(/[0-9]|.{2}/g);
}

function b64ListCompress(list, rptStart=640) {
var out = [];
var prevB64 = undefined;
var repeatCount = 0;

const pushrepeats = function() {
  if (repeatCount===0) {
    // nothing to do.
    return;
  } else if (repeatCount===1) {
    // no point adding a repeat character if it only repeats once.
    out.push(prevB64);
  } else if (repeatCount===2 && prevB64.length===1) {
    // if the previous was single character, no point adding a 
    // repeat character if it only repeats twice.
    out.push(prevB64);
    out.push(prevB64);
  } else {
    // otherwise, add the repeat character.
    out.push(toB64(rptStart+repeatCount, 2, b64Chars));
  }
  repeatCount = 0;
};

list.forEach(b64 => {
  if (b64 === prevB64) {
    repeatCount++;
  } else {
    pushrepeats();
    out.push(b64);
  }
  prevB64 = b64;
});
pushrepeats();
return out;
}

function b64ListDecompress(list, rptStart=640, rptEnd=767) {
var out = [];
var prevB64 = undefined;
list.forEach(b64 => {
  var val = fromB64(b64, b64Chars);
  if (val >= rptStart && (rptEnd===-1 || val <= rptEnd)) {
    // repeat character
    const repeats = val-rptStart;
    for (var i=0; i<repeats; i++)
      out.push(prevB64);
  } else {
    out.push(b64);
    prevB64 = b64;
  }
});
return out;
}

function statefulExportButton() {
makeExportLink();
}


// this is the old method of exporting, that was used for a long time.
// i'm leaving it here for now as the "undo" function still uses this.
// however, it's otherwise deprecated.
function getStatefulExportString() {
var output = [];
for (var r=0; r<9; r++) {
  for (var c=0; c<9; c++) {
    var cell = sudoku[r][c];
    var cellstring = "";
    if (isSolved(cell)) {
      cellstring = "!"+(cell.solved+1);
    } else {
      for (var v=0; v<9; v++) {
        if (cell[v]) {
          cellstring = cellstring + (v+1);
        }
      }
      if (cellstring==="123456789")
        cellstring = "0";
    }
    cellstring = cellstring + exportSwatch(cell) + exportRegion(cell);
    output.push(cellstring);
  }
}
return output.join(",");
}

/*    _____ .       __     .     _______   ___  __  __ .____    _____
/*   (      /       |     /|    '   /    .'   \ |   |  /       (
/*    `--.  |       |    /  \       |    |      |___|  |__.     `--.
/*       |  |  /\   /   /---'\      |    |      |   |  |           |
/*  \___.'  |,'  \,'  ,'      \     /     `.__, /   /  /----/ \___.'
*/

function getSwatchesExportString() {
if (noCellsOnBoard(c => c.swatch !== undefined)) return undefined;
return b64ListCompress(sudokuCells.map(cellToB64Swatch), fromB64("-0")).join("");
}

function parseSwatches() {
var clr = getQueryVariable('clr');
if (clr === undefined) return;
var clrList = b64ListDecompress(listifyB64SingleCelledWithRepeats(clr, "-"), fromB64("-0"), -1).map(b64ToSwatchValue);
sudokuCells.map((c, i) => { c.swatch = clrList[i]; });
}

function cellToB64Swatch(cell) {
if (cell.swatch === undefined) return toB64(0);
return toB64(cell.swatch+1);
}

function b64ToSwatchValue(b64) {
var val = fromB64(b64);
if (val===0) return undefined;
return val-1;
}

/* old stuff */
function swatchToChar(swatch) {
if (swatch === undefined || swatch === NaN) return undefined;
return String.fromCharCode(65+swatch);
}

function exportSwatch(cell) {
if (cell.swatch === undefined) return '';
return 'c'+swatchToChar(cell.swatch);
}

function swatchFromChar(char) {
if (char===undefined) return undefined;
if (char==='') return undefined;
if (char < 'A') return undefined;
if (char > 'Z') return undefined;
return char.charCodeAt(0)-65;
}
/* end old stuff (only here for legacy undo stuff) */




/* GENERIC HELPERS for swatches and regions (for now) */
function noCellsOnBoard(fn) {
for (var i=0; i<sudokuCells.length; i++)
  if (fn(sudokuCells[i])) return false;
return true;
}
// combine elements of an array when `fn` matches on them
// (combine using joinfn)
Object.defineProperty(Array.prototype, 'pinch', {
value: function(fn, joinfn=(a, b)=>{return a+b; }) {
  // return this;
  return this.reduce((l, e) => {
    if (l.length>1 && fn(l[l.length-1], e))
      l[l.length-1] = joinfn(l[l.length-1], e);
      // l[l.length-1] += e;
    else l.push(e);
    return l;
  }, []);
}
});

// given a list of B64 chars, split this into a list of single characters,
// but group into two chars when 
function listifyB64SingleCelledWithRepeats(data, repeatStartChar) {  
var repeatStartVal = fromB64(repeatStartChar);
return data
  .split("")
  .pinch((a, b) => (a.length===1 && (fromB64(a) >= repeatStartVal)));
}


/*  .___  .____    ___   _   ___   __    _   _____
/*  /   \ /      .'   \  | .'   `. |\   |   (
/*  |__-' |__.   |       | |     | | \  |    `--.
/*  |  \  |      |    _  | |     | |  \ |       |
/*  /   \ /----/  `.___| /  `.__.' |   \|  \___.'
*/

function getRegionsExportString() {
if (noCellsOnBoard(c => c.region !== undefined)) return undefined;
return b64ListCompress(sudokuCells.map(cellToB64Region), fromB64("-0")).join("");
}

function parseRegions() {
var rgn = getQueryVariable('rgn');
if (rgn === undefined) return;
var rgnList = b64ListDecompress(listifyB64SingleCelledWithRepeats(rgn, "-"), fromB64("-0"), -1).map(b64ToRegionValue);
sudokuCells.map((c, i) => { c.region = rgnList[i]; });
refreshRegionLabels();
}

function cellToB64Region(cell) {
if (cell.region === undefined) return toB64(0);
return toB64(cell.region+1);
}

function b64ToRegionValue(b64) {
var val = fromB64(b64);
if (val===0) return undefined;
return val-1;
}

/* deprecated for export, still used for undo for now */
function exportRegion(cell) {
if (cell.region === undefined) return '';
return 'r'+cell.region;
}
/* end deprecated */



const b81Chars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_!#$%()*+;=?@^{|}~";
function toB81(x, pad=0) {
if (x<81) return b81Chars[x];
return toB81(Math.floor(x/81)) + toB81(x % 81);
}

function fromB81(x) {
return x
  .split("")
  .reduce((s,v)=>s*81+b81Chars.indexOf(v),0)
}

function cellToB81Pos(cell) {
return toB81(cell.ind)
}

function get81ExportString() {
return sudokuCells
  .filter(c => c.swatch === 1)
  .map(cellToB81Pos)
  .join("");
}


// if a test file is loaded, parse all sudokus in it and attempt to complete them.
function testFileLoaded() {
var total      = 0;
var finished   = 0;
var incomplete = 0;
var errors     = 0;

console.log("Total / Completed / Incomplete / Errors");
logging = false;
var file = $("#testFile")[0].files[0];
new LineReader(file).readLines(function(line){
  var [givens, solution] = line.split(",");
  if (total%1000===0) {
    console.log([total, finished, incomplete, errors].join(" / "));
    // refresh();
  }
  total = total + 1;
  var myOutput = completeSilently(givens);
  if (myOutput === solution) {
    finished = finished + 1;
  } else if (myOutput==="INCOMPLETE") {
    incomplete = incomplete + 1;
  } else if (myOutput==="ERROR") {
    errors = errors + 1;
  }
}, function(){
  console.log(total + " sudokus attempted.");
  console.log(finished +" solved correctly.");
  console.log(incomplete +" incomplete.");
  console.log(errors+" resulted in errors.");
  logging = true;
  // refresh();
});
}

function makeSq() {
var tbl = $("#tbl");
tbl.width(tbl.height());

canvas = $("#cnv")[0];
ctx = canvas.getContext("2d");
cnv.width = tbl.width();
cnv.height = tbl.height();

refreshOverlay();
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
var newRegionInd = 1;
var regionLabels = [];
function regionsButton() {
var thisRegion = newRegionInd;
newRegionInd++;

var oldLabel = "";

var cells = getSelectedCells();
if (cells.length===0) return;

cells.map(function(cell){
  if (cell.region!==undefined) {
    if (regionLabels[cell.region] !== undefined)
      oldLabel = regionLabels[cell.region];
  }
});

var input = "" + prompt("Enter a label for this region.", oldLabel);
if (input==="null") return;

regionLabels[thisRegion] = input;

cells.map(function(cell){
  cell.region = thisRegion;
});

refreshRegionLabels();
clearSelected();
refresh();
}

function getSelectedCells() {
var cells = [];
for (var r=0;r<sudoku.length; r++) {
  var row = sudoku[r];
  for (var c=0; c<row.length; c++) {
    var cell = row[c];
    if (cell.td.hasClass("selected"))
      cells.push(cell);
  }
}
return cells;
}

function setRegionAttrs(cell) {
if (cell.region === undefined) return;
var td = cell.td;
var region = cell.region;
var dirs = [
  ['rgnup', cellAbove],
  ['rgndown', cellBelow],
  ['rgnleft', cellLeft],
  ['rgnright', cellRight]
];
for (var i=0; i<4; i++) {
  var [dirLabel, dirFn] = dirs[i];
  var adjCell = dirFn(cell);
  if (adjCell && adjCell.region === region)
    td.attr(dirLabel, 'yes');
  else
    td.attr(dirLabel, 'no');
}
if (cell.isTL) {
  td.attr('TL', 'yes');
  td.find('div.caption').html(regionLabels[cell.region]);
} else {
  td.attr('TL', 'no');
}
}

function cellAbove(cell) {
if (cell.row===0) return undefined;
return sudoku[cell.row-1][cell.col];
}

function cellBelow(cell) {
if (cell.row===8) return undefined;
return sudoku[cell.row+1][cell.col];
}

function cellLeft(cell) {
if (cell.col===0) return undefined;
return sudoku[cell.row][cell.col-1];
}

function cellRight(cell) {
if (cell.col===8) return undefined;
return sudoku[cell.row][cell.col+1];
}

function refreshRegionLabels() {
// clear region label tags errywhere, pick the 'topleft' cell
// for region labeling, and maybe set that label up.
var labeledRegions = [];
var regionsAssoc = [];
for (var d=0; d<sudokuCellsTL.length; d++) {
  var diag = sudokuCellsTL[d];
  for (var i=diag.length-1; i>=0; i--) {
    var cell = diag[i];
    cell.isTL = false;
    if (cell.region !== undefined && labeledRegions.indexOf(cell.region) === -1) {
      newRegionInd = Math.max(newRegionInd, cell.region+1);
      cell.isTL = true;
      labeledRegions.push(cell.region);
      regionsAssoc[cell.region] = [cell];
    } else if (cell.region !== undefined) {
      regionsAssoc[cell.region].push(cell);
    }
  }
}
sudokuRegions = [];
for (var i=0; i<labeledRegions.length; i++) {
  var regionNum = labeledRegions[i];
  sudokuRegions[i] = regionsAssoc[regionNum];
  sudokuRegions[i].regionNum = regionNum;
  sudokuRegions[i].groupName = "Region "+regionNum;
}
}

/*
   ######   ########  #### ########     ##     ##  ######   ##     ## ########
  ##    ##  ##     ##  ##  ##     ##    ###   ### ##    ##  ###   ###    ##
  ##        ##     ##  ##  ##     ##    #### #### ##        #### ####    ##
  ##   #### ########   ##  ##     ##    ## ### ## ##   #### ## ### ##    ##
  ##    ##  ##   ##    ##  ##     ##    ##     ## ##    ##  ##     ##    ##
  ##    ##  ##    ##   ##  ##     ##    ##     ## ##    ##  ##     ##    ##
   ######   ##     ## #### ########     ##     ##  ######   ##     ##    ##
*/

// display the current state of the sudoku board.
function refresh() {
refreshTable();
refreshHighlights();
}

// highlight some of the sudoku board
function refreshHighlights() {
// check each individual cell
for (var r=0;r<sudoku.length; r++) {
  var row = sudoku[r];
  for (var c=0; c<row.length; c++) {
    var cell = row[c];

    // highlight (or unhighlight) this cell
    if ((inputState===SETFULL || inputState===SETCAND) && (cell[inputNum] || cell.solved===inputNum))
      cell.td.toggleClass("highlit", true);
    else
      cell.td.toggleClass("highlit", false);

    // set the swatch as appropriate
    if (cell.swatch===undefined)
      cell.td.attr('swatch', '');
    else
      cell.td.attr('swatch', cell.swatch);

    // set the region borders as appropriate
    if (cell.region===undefined)
      cell.td.attr('region','no');
    else {
      cell.td.attr('region', 'yes');
      setRegionAttrs(cell);
    }
  }
}
}

function refreshTable() {
for (var r=0; r<sudoku.length; r++) {
  var row = sudoku[r];
  refreshEdges(row, leftEdge()[r], rightEdge()[r]);
  refreshEdges(sudokuCols[r], topEdge()[r], bottomEdge()[r]);
  for (var c=0; c<row.length; c++) {
    refreshTableCell(row[c]);
  }
}
}

var cHTML = ["<c1>1</c1>", "<c2>2</c2>", "<c3>3</c3>", "<c4>4</c4>", "<c5>5</c5>", "<c6>6</c6>", "<c7>7</c7>", "<c8>8</c8>", "<c9>9</c9>",];
var vHTML = ["<v1>1</v1>", "<v2>2</v2>", "<v3>3</v3>", "<v4>4</v4>", "<v5>5</v5>", "<v6>6</v6>", "<v7>7</v7>", "<v8>8</v8>", "<v9>9</v9>"];
var postHTML = '<div class="caption">';
function refreshTableCell(cell) {
var td = cell.td;
if(isSolved(cell)) {
  td.html(cHTML[cell.solved]+postHTML);
} else {
  var html = "";
  for (var v=0; v<9; v++)
    if (cell[v])
      html += vHTML[v];
  td.html(html+postHTML);
}
}

function refreshEdges(group, val1, val2) {
// if (group.edge1 && group.edge2) {
  group.edge1.toggleClass("fullySet", group.sandwichFullySet===true);
  group.edge2.toggleClass("fullySet", group.sandwichFullySet===true);
  group.edge1.text(val1);
  group.edge2.text(val2);
// }
}

// build the table
function buildTable() {
var table = $("#tbl");
table.empty();

// top edge
var tEdge = topEdge();
var tr = $("<tr>").addClass("row").addClass("toprow");
tr.append($("<td>").addClass("corner"));
for (var e=0; e<9; e++) {
  var td = $("<td>").addClass("edge tbedge").text(tEdge[e]);
  setEdgeBehaviour(td, 0, e);
  sudokuCols[e].edge1 = td;
  tr.append(td);
}
tr.append($("<td>").addClass("corner"));
table.append(tr);

// table (including edges)
var lEdge = leftEdge();
var rEdge = rightEdge();
for (var r=0; r<sudoku.length; r++) {
  var tr = $("<tr>").addClass("row");
  var td = $("<td>")
    .addClass("edge ledge")
    .text(lEdge[r]);
  setEdgeBehaviour(td, 1, r);
  sudoku[r].edge1 = td;
  tr.append(td);
  for (var c=0; c<sudoku[r].length; c++) {
    var cell = sudoku[r][c];
    var td = $("<td>").addClass("cell");
    td.attr('id', cell.pos);
    cell['td'] = td;
    setCellBehaviour(td, cell);
    if(isSolved(cell)) {
      td.append($("<c"+(cell.solved+1)+">"));
    } else {
      for (var i=0; i<cell.length; i++) {
        if (cell[i])
          td.append($("<v"+(i+1)+">"));
      }
    }
    td.append($(`<div class="caption">`));
    tr.append(td);
  }
  var td = $("<td>")
    .addClass("edge redge")
    .text(rEdge[r]);
  setEdgeBehaviour(td, 2, r);
  sudoku[r].edge2 = td;
  tr.append(td);
  table.append(tr);
}

// bottom edge
var bEdge = bottomEdge();
var tr = $("<tr>").addClass("row").addClass("bottomrow");
tr.append($("<td>").addClass("corner"));
for (var e=0; e<9; e++) {
  var td = $("<td>")
    .addClass("edge tbedge")
    .text(bEdge[e]);
  setEdgeBehaviour(td, 3, e);
  sudokuCols[e].edge2 = td;
  tr.append(td);
}
tr.append($("<td>").addClass("corner"));
table.append(tr);


for (var i=0; i<=10; i++) {
  $("v"+i).text(i);
  $("c"+i).text(i);
}
}



function blankCell(cell) {
cell.solved = undefined;
cell.isSolved = undefined;
for (var i=0; i<9; i++)
  cell[i] = true;
}

function toggleCandidate(cell, v) {
if (isSolved(cell)) return false;
cell[v] = !cell[v];
return true;
}




/*
  ##     ## ##    ## ########   #######
  ##     ## ###   ## ##     ## ##     ##
  ##     ## ####  ## ##     ## ##     ##
  ##     ## ## ## ## ##     ## ##     ##
  ##     ## ##  #### ##     ## ##     ##
  ##     ## ##   ### ##     ## ##     ##
   #######  ##    ## ########   #######
*/

function undoButton() {
undo();
}


function undo() {
if (undoStack.length===0) {
  console.log("nothing to undo");
  return;
}
var [label, state] = undoStack.pop();
console.log(`undoing "${label}"`);
importSudokuData(state);
clearSolvedCache();
refresh();
refreshUndoLog();
undoWipe();
}

function refreshUndoLog() {
var labels = undoStack.map(d => d[0]).reverse();
$("#history").html("History:<br>"+labels.join("<br>"));
}

function spamUndoStack() {
for (var i=0; i<200; i++)
  undoStack.push(["meow "+i, "meow"]);
refreshUndoLog();
setDescription("skdjfnksdnfksdnfksdnfkjnsdfkjnsdfkjnsdkf jnsdkjfnsdkfjnskdjfnskdjfnksdjfnksdjfnksjdnf skdjfnksdnfksdnfksdnfkjnsdfkjnsdfkjnsdkfjnsdkjfnsdkfjnskdjfn skdjfnksdjfnksdjfnksjdnf");
}
// setTimeout(spamUndoStack, 500);

function saveUndoState(label, state=getStatefulExportString()) {
// console.log(label);
undoStack.push([label, state]);
refreshUndoLog();
}

function zoneName(swatch) {
if (swatch===undefined) return "none";
switch (swatch) {
  case 0: return "darkgreen";
  case 1: return "lightblue";
  case 2: return "darkblue";
  case 3: return "lightgreen";
  case 4: return "pink";
  case 5: return "purple";
  case 6: return "yellow";
  case 7: return "orange";
  case 8: return "red";
  case 9: return "darkgreen 2";
  case 10: return "lightblue 2";
  case 11: return "darkblue 2";
  case 12: return "lightgreen 2";
  case 13: return "pink 2";
  case 14: return "purple 2";
  case 15: return "yellow 2";
  case 16: return "orange 2";
  case 17: return "red 2";
}
}

var tempUndoState = "";
function storeUndoState() {
tempUndoState = getStatefulExportString();
}

function saveStoredUndoState(label) {
saveUndoState(label, tempUndoState);
}

function setCellMouseDown(td, cell) {
td.off("mousedown").on("mousedown", function(e){

  // confirm the cell
  if (inputState===SETFULL) {
    storeUndoState();
    if (confirmCell(cell, inputNum))
      saveStoredUndoState(cell.pos + " = " + (inputNum+1));
    if ($("#autoclearadjs").prop('checked')) {
      clearAfterConfirm(cell);
    }
    refresh();
    return;
  }

  // toggle the cell
  else if (inputState === SETCAND) {
    storeUndoState();
    if (toggleCandidate(cell, inputNum)) {
      var plusminus = cell[inputNum] ? '+' : '-';
      saveStoredUndoState(cell.pos+" "+plusminus+" "+(inputNum+1));
      refresh();
    }
    return;
  }

  // set the color
  else if (inputState===SETCOLOR) {
    if (cell.swatch === inputNum) {
      saveUndoState(cell.pos+" blank");
      cell.swatch = undefined;
      dragState = -1; // CLEARING COLORS
    } else {
      saveUndoState(cell.pos+" "+zoneName(inputNum));
      cell.swatch = inputNum;
      dragState = inputNum; // SPREADING THIS COLOR
    }
    refreshHighlights();
  }

  // selecting cells
  else if (inputState===SETNOTHING) {
    if (!e.shiftKey) clearSelected();
    dragState = -2;
    td.toggleClass("selected");
  }

  else if (inputState===SETTHERMO) {
    addCellToCurrentThermo(cell);
  }

  else if (inputState===SETARROW) {
    addCellToCurrentArrow(cell);
  }

  else if (inputState===SETLINE) {
    addCellToCurrentLine(cell);
  }

});

td.off("mouseenter").on("mouseenter", function(e){
  if (dragState === undefined) return;
  if (dragState === -1 && cell.swatch !== undefined) {
    saveUndoState(cell.pos+" blank");
    cell.swatch = undefined;
  } else if (dragState >= 0 && dragState <= NUM_COLORS) {
    if (cell.swatch !== dragState) {
      saveUndoState(cell.pos+" "+zoneName(dragState));
      cell.swatch = dragState;
    }
  } else if (dragState === -2) {
    td.addClass("selected");
  }
  refreshHighlights();
});
}


/*
   #######  ##     ## ######## ########  ##          ###    ##    ##
  ##     ## ##     ## ##       ##     ## ##         ## ##    ##  ##
  ##     ## ##     ## ##       ##     ## ##        ##   ##    ####
  ##     ## ##     ## ######   ########  ##       ##     ##    ##
  ##     ##  ##   ##  ##       ##   ##   ##       #########    ##
  ##     ##   ## ##   ##       ##    ##  ##       ##     ##    ##
   #######     ###    ######## ##     ## ######## ##     ##    ##
*/

function refreshOverlay() {
initCanvas();
drawLines();
drawThermos();
drawArrows();
drawKropkis();
}

var canvas;
var ctx;
function initCanvas() {
canvas = $("#cnv")[0];
ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
// ctx.beginPath();
// ctx.rect(2, 2, canvas.width-4, canvas.height-4);
// ctx.stroke();
}

/*
  ##    ## ########   #######  ########  ##    ## ####
  ##   ##  ##     ## ##     ## ##     ## ##   ##   ##
  ##  ##   ##     ## ##     ## ##     ## ##  ##    ##
  #####    ########  ##     ## ########  #####     ##
  ##  ##   ##   ##   ##     ## ##        ##  ##    ##
  ##   ##  ##    ##  ##     ## ##        ##   ##   ##
  ##    ## ##     ##  #######  ##        ##    ## ####
*/

// kropki dot styles
const KROPDIAMOND = "D";
const KROPWALL = "W";
const KROPBLACK = "B"
const KROPCIRCLE = "C"

function getKropkiStyle() {
var kropstyle = $("select#kropkistyle").val();
return kropstyle;
}

function addKropki() {
var kropkiStyle = getKropkiStyle();
var kropkiCells = getSelectedCells();
if (kropkiCells.length!=2) {
  alert("Select exactly two cells before pressing the Kropki button.");
  return;
}
sudokuKropkis.push({cell1:kropkiCells[0], cell2:kropkiCells[1], style:kropkiStyle});
clearSelected();
refreshOverlay();
}

function drawKropkis() {
for (var i=0; i<sudokuKropkis.length; i++) {
  drawKropki(sudokuKropkis[i]);
}
}

function drawKropki(kropki) {
var c1 = getCellCenter(kropki.cell1);
var c2 = getCellCenter(kropki.cell2);
var center = midpoint(c1, c2);
var angle = midangle(c1, c2);
canvKropkiDot(center, kropki.style, angle);
}


/*
     ###    ########  ########   #######  ##      ##
    ## ##   ##     ## ##     ## ##     ## ##  ##  ##
   ##   ##  ##     ## ##     ## ##     ## ##  ##  ##
  ##     ## ########  ########  ##     ## ##  ##  ##
  ######### ##   ##   ##   ##   ##     ## ##  ##  ##
  ##     ## ##    ##  ##    ##  ##     ## ##  ##  ##
  ##     ## ##     ## ##     ##  #######   ###  ###
*/
function addArrow() {
controlClicked.call($("#arrowButton"), 0, SETARROW);
if (inputState===SETARROW) {
  // starting an arrow
  var baseCells = getSelectedCells();
  if (baseCells.length<1) {
    alert("You need to first select a cell/cells to be the base of the arrow");
    controlClicked.call($("#arrowButton"), 0, SETARROW);
    return;
  }
  sudokuArrows.push({base: baseCells, shaft: [], shoulder: baseCells[0]});
  clearSelected();
  refreshOverlay();
} else {
  // ending an arrow
  // clearEmptyArrows();
}
}

function cellDistance(cell1, cell2) {
return (Math.abs(cell1.row-cell2.row)
      + Math.abs(cell1.col-cell2.col));
}

function addCellToCurrentArrow(cell) {
var arrow = sudokuArrows[sudokuArrows.length-1];
if (arrow.shaft.length===0) {
  // first shaft cell. need to decide which base cell
  // connects to the shaft (the shoulder).
  var base = arrow.base;
  var closeCell = base[0];
  var closeDist = cellDistance(cell, base[0]);
  for (var i=1; i<base.length; i++)
    if (cellDistance(cell, base[i]) < closeDist) {
      closeCell = base[i];
      closeDist = cellDistance(cell, base[i]);
    }
  arrow.shoulder = closeCell;
}
arrow.shaft.push(cell);
refreshOverlay();
}

function drawArrows() {
for (var i=0; i<sudokuArrows.length; i++) {
  drawArrow(sudokuArrows[i]);
}
}

function drawArrow(arrow) {
// the 'shaft' of the arrow
if (arrow.shaft.length>0) {
  canvArrow([arrow.shoulder].concat(arrow.shaft), 0.15);
}

// the 'base' of the arrow
canvLine(arrow.base, 0.85);
canvLine(arrow.base, 0.6, '#fff');
}

function clearEmptyArrows() {
for (var i=sudokuArrows.length-1; i>=0; i--) {
  if (sudokuArrows[i].shaft.length<1) {
    sudokuArrows.splice(i, 1);
  }
}
}


/*
  ######## ##     ## ######## ########  ##     ##  #######
     ##    ##     ## ##       ##     ## ###   ### ##     ##
     ##    ##     ## ##       ##     ## #### #### ##     ##
     ##    ######### ######   ########  ## ### ## ##     ##
     ##    ##     ## ##       ##   ##   ##     ## ##     ##
     ##    ##     ## ##       ##    ##  ##     ## ##     ##
     ##    ##     ## ######## ##     ## ##     ##  #######
*/

function addThermo() {
controlClicked.call($("#thermoButton"), 0, SETTHERMO);
if (inputState===SETTHERMO) sudokuThermos.push([]);
else clearEmptyThermos();
}

function addCellToCurrentThermo(cell) {
sudokuThermos[sudokuThermos.length-1].push(cell);
refreshOverlay();
}

function drawThermos() {
for (var i=0; i<sudokuThermos.length; i++) {
  drawThermo(sudokuThermos[i]);
}
}

function drawThermo(cells) {
if (cells.length < 1) return;
canvCircle(cells[0], 0.35, '#fff'),
canvLine(cells, 0.25, '#fff');
canvLine(cells, 0.2);
canvCircle(cells[0], 0.3);
}

function clearEmptyLists(lists, fn = (a => a)) {
for (var i=lists.length-1; i>=0; i--) {
  if (fn(lists[i]).length<1) {
    lists.splice(i, 1);
  }
}
}

function clearEmptyThermos() {
clearEmptyLists(sudokuThermos);
}

/*
  ##       #### ##    ## ########  ######
  ##        ##  ###   ## ##       ##    ##
  ##        ##  ####  ## ##       ##
  ##        ##  ## ## ## ######    ######
  ##        ##  ##  #### ##             ##
  ##        ##  ##   ### ##       ##    ##
  ######## #### ##    ## ########  ######
*/

function addLine() {
controlClicked.call($("#lineButton"), 0, SETLINE);
if (inputState===SETLINE)
  // start a line
  sudokuLines.push({cells: [], color: undefined});
else
  // finish a line
  finishLine();
}

function addCellToCurrentLine(cell) {
sudokuLines.at(-1).cells.push(cell);
refreshOverlay();
}

function setWorkingLineColor(color) {
sudokuLines.at(-1).color = color;
}

function drawLines() {
for (var i=0; i<sudokuLines.length; i++) {
  drawLine(sudokuLines[i]);
}
}

function drawLine(line) {
var cells = line.cells;
if (cells.length < 1) return;
var color = NOTATION_BASE_CLR;
if (line.color !== undefined)
  color = SWATCH_COLORS[line.color % 9];
canvLine(cells, 0.35, '#fff'); //outline
canvLine(cells, 0.3, color);
}

function finishLine() {
var mostRecentLine = sudokuLines[sudokuLines.length-1];
clearEmptyLines();
}

function clearEmptyLines() {
clearEmptyLists(sudokuLines, l=>l.cells);
}

/*
   ######     ###    ##    ## ##     ##    ###     ######
  ##    ##   ## ##   ###   ## ##     ##   ## ##   ##    ##
  ##        ##   ##  ####  ## ##     ##  ##   ##  ##
  ##       ##     ## ## ## ## ##     ## ##     ##  ######
  ##       ######### ##  ####  ##   ##  #########       ##
  ##    ## ##     ## ##   ###   ## ##   ##     ## ##    ##
   ######  ##     ## ##    ##    ###    ##     ##  ######
*/
function getCellCenter(cell) {
var td = cell.td[0];
// seems to be slightly more accurate if i add 0.5 to x and y this way
return [td.offsetLeft+(td.offsetWidth)/2,
        td.offsetTop + (td.offsetHeight)/2];
}

function midpoint(p1, p2) {
return [
  (p1[0]+p2[0])/2,
  (p1[1]+p2[1])/2
];
}

function midangle(p1, p2) {
return Math.atan2(p2[0]-p1[0], p1[1]-p2[1]);
}

function getSomeCellWidth() {
return getCellWidth(sudoku[0][0]);
}

function getCellWidth(cell) {
return cell.td[0].offsetWidth;
}

function canvLine(cells, width=0.2, style=NOTATION_BASE_CLR, cap="round", join="round") {
var cellWidth = getCellWidth(cells[0]);
ctx.beginPath();
ctx.lineWidth = cellWidth * width;
ctx.strokeStyle = style;
ctx.lineCap = cap;
ctx.lineJoin = join;
ctx.moveTo(...getCellCenter(cells[0]));
for (var i=1; i<cells.length; i++) {
  ctx.lineTo(...getCellCenter(cells[i]));
}
if (cells.length===1) {
  // only one cell. draw a line to itself to make sure something is drawn
  ctx.lineTo(...getCellCenter(cells[0]));
}
ctx.stroke();
}

function canvKropkiDot(center, style, angle) {

var size = getSomeCellWidth()*0.15;

// the style here indicates which kropki dot will be drawn
ctx.fillStyle = NOTATION_BASE_CLR;
ctx.strokeStyle = "#FFF";
var [x, y] = center;


if (style===KROPWALL) {
  var d = getSomeCellWidth()*0.5;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(angle)*d, y + Math.sin(angle)*d);
  ctx.lineTo(x - Math.cos(angle)*d, y - Math.sin(angle)*d);
  // ctx.lineTo(x + Math.sin(angle)*d, y - Math.cos(angle)*d);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
} else if (style===KROPDIAMOND) {
  var d = size;
  ctx.lineWidth = d*0.3;
  ctx.beginPath();
  ctx.moveTo(x, y-d);
  ctx.lineTo(x+d, y);
  ctx.lineTo(x, y+d);
  ctx.lineTo(x-d, y);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
} else if (style===KROPCIRCLE) {
  ctx.beginPath();
  ctx.arc(center[0], center[1], size*0.6, 0, 2*Math.PI);
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 3;
  ctx.stroke();
} else if (style===KROPBLACK) {
  ctx.beginPath();
  ctx.arc(center[0], center[1], size*0.6, 0, 2*Math.PI);
  ctx.fillStyle = "#666";
  ctx.fill();
} else {
  ctx.beginPath();
  ctx.arc(center[0], center[1], size, 0, 2 * Math.PI);
  ctx.fill();
}
}

function canvArrow() {
canvLine(...arguments);
canvArrowHead(...arguments);
}

function canvArrowHead(cells, width=0.2, style=NOTATION_BASE_CLR, cap="round", join="round") {
var lastTwo = cells.slice(-2);
var cellWidth = getCellWidth(lastTwo[1]);
var from = getCellCenter(lastTwo[0]);
var to   = getCellCenter(lastTwo[1]);
var angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
var rad = cellWidth*0.4;
var point_forward = cellWidth*0.1;
var pitch = Math.PI*1.25;

// this is 'to', but pushed a little further forward
var middle = [to[0]+point_forward*Math.cos(angle),
              to[1]+point_forward*Math.sin(angle)]

// the left and right points of the arrow
var left  = [middle[0]+rad*Math.cos(angle+pitch),
              middle[1]+rad*Math.sin(angle+pitch)];
var right = [middle[0]+rad*Math.cos(angle-pitch),
              middle[1]+rad*Math.sin(angle-pitch)];

ctx.beginPath();
ctx.lineWidth = cellWidth * width;
ctx.strokeStyle = style;
ctx.lineCap = cap;
ctx.lineJoin = join;

ctx.moveTo(...left);
ctx.lineTo(...middle);
ctx.lineTo(...right);
ctx.stroke();
}

function canvCircle(cell, rad=0.5, style=NOTATION_BASE_CLR) {
var wid = getCellWidth(cell);
var [x, y] = getCellCenter(cell);
ctx.fillStyle = style;
ctx.beginPath();
ctx.arc(x, y, rad*wid, 0, 2 * Math.PI);
ctx.fill();
}

/*
   ######   ########     ###    ########  ##     ##
  ##    ##  ##     ##   ## ##   ##     ## ##     ##
  ##        ##     ##  ##   ##  ##     ## ##     ##
  ##   #### ########  ##     ## ########  #########
  ##    ##  ##   ##   ######### ##        ##     ##
  ##    ##  ##    ##  ##     ## ##        ##     ##
   ######   ##     ## ##     ## ##        ##     ##
*/


function drawGraph(nodes) {
clearLines();
var alreadyDrawn = [];
var labels = nodes.labels;

var maybeDraw = function(from, to, lineClass) {
  if (alreadyDrawn[from+to] || alreadyDrawn[to+from]) return;
  makeLine(from, to, lineClass);
};

for (var i=0; i<labels.length; i++) {
  var pos = labels[i];
  var node = nodes[pos];
  for (var s=0; s<node.strong.length; s++)
    maybeDraw(pos, node.strong[s], "strong");
  for (var w=0; w<node.weak.length; w++)
    maybeDraw(pos, node.weak[w], "weak");

}
}