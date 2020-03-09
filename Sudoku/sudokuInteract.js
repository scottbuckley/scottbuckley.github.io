
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
  const data_triples      = "070008029002000004854020000008374200000000000003261700000090612200000400130600070";
  const data_htriples     = "000000000231090000065003100008924000100050006000136700009300570000010843000000000";
  const data_nakedpairs   = "400000938032094100095300240370609004529001673604703090957008300003900400240030709";
  const data_hiddenpairs  = "720408030080000047401076802810739000000851000000264080209680413340000008168943275";
  const data_intersection = "016007803000800000070001060048000300600000002009000650060900020000002000904600510";
  const data_nakedquads   = "000030086000020000000008500371000094900000005400007600200700800030005000700004030";
  const data_swordfish    = "050030602642895317037020800023504700406000520571962483214000900760109234300240170";
  const data_swordfish2   = "020040069003806200060020000890500010000000000030001026000010070009604300270050090";
  const data_colors1      = "007083600039706800826419753640190387080367000073048060390870026764900138208630970";
  const data_finned1      = "900040000704080050080000100007600820620400000000000019000102000890700000000050003"; // current can't solve this (nor can andoku)
  const data_finned2      = "030605000800000030004010059000701006060000010500302000950020300070000008000107090"; // current can't solve this (nor can andoku)
  const data_default = undefined; // this one will be loaded automatically.


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
  const stepDelay = 20;
  const flashDelay = Math.max(10, stepDelay*0.9);


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

  // input state
  var inputState = SETNOTHING;
  var dragState  = undefined; // undefined = nothing. -1 = clear. 0-8 = set swatch. -2 = select
  var inputNum   = undefined;

  

/*
    #### ##    ## #### ########
     ##  ###   ##  ##     ##
     ##  ####  ##  ##     ##
     ##  ## ## ##  ##     ##
     ##  ##  ####  ##     ##
     ##  ##   ###  ##     ##
    #### ##    ## ####    ##
*/

  // when the page is loaded, check if there is a query variable,
  // otherwise load the example from the settings.
  function onReady(buildUI=true) {
    // prepare the board with the appropriate givens.
    var data = getQueryVariable("data");
    var edge = getQueryVariable("edge");
    var sandwich = getQueryVariable("sandwich");

    if (data) {
      initSudoku(data);
    } else {
      initSudoku(data_default);
    }

    if (edge) {
      initEdges(edge);
    }

    if (sandwich) {
      for (var i=0; i<strats.length; i++)
        if (strats[i].category === "Sandwich")
          strats[i].enabled = true;
    }

    // set up the individual solver buttons
    buildUI && initSolverButtons();

    // set up controls behaviour
    initControls();

    // kb and mouse global
    initKeyboardMouse();

    // show the board
    buildTable();

    makeSq();
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
  }

  function initKeyboardMouse() {
    $(document).off("keydown").keydown(processKeys);
    $(document).off("mouseup").on("mouseup", function(){
      dragState = undefined;
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

function resetButton() {
  onReady(false);
}

function setDblClick(element, cell) {
  element.dblclick(function(){changeCell(cell)});
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
      if (!isNaN(parseInt(input)))
        input = parseInt(input);
      if (input === undefined) return;
      sudokuEdges[edgeind][ind] = input;
      sandwichStaticFinished = false;
      refreshTable();
    });
    // why the fuck is this backwards lol
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

  // a control button (confirm/candidate/colour) has been clicked
  // ind:index of button, state:state for button, this:the td of the button
  var prevSelectedControl = undefined;
  function controlClicked(ind, state) {
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
  
  // the checkbox for a particular strategy has been updated
  function stratCheckboxUpdated(strat) {
    // return the function to define that checkbox's behaviour
    return function() {
      if ($(this).prop('checked'))
        strat.enabled = true;
      else
        strat.enabled = false;
    }
  }

  // deal with key presses
  function processKeys(e) {
    var shift = e.shiftKey;
    var code  = e.code;

    if (code.startsWith("Digit")) {
      // deal with digits
      if (code === "Digit0") return true;
      var num = code.substring(5);
      if (shift)
        $("table#candidate").find("td:contains('"+num+"')").click();
      else
        $("table#confirm").find("td:contains('"+num+"')").click();
      return false;
    } else if (code==="Space") {
      // space means clear. unclick whatever is selected.
      $("#ctrl").find(".selected").click();
      // also clear selected cells from the grid
      clearSelected();
      return false;
    } else if (code==="KeyU") {
      // undo. flash the button and perform an undo
      flashButton($("#undobutton"));
      undo();
    }
    return true;
  }

  // unselect any selected cells in the grid
  function clearSelected() {
    $("#tbl").find("td.selected").removeClass("selected");
  }

  
  function hideVs() {
    for (var i=1; i<10; i++)
      $(`v${i}`).hide();
  }

  function showVs() {
    for (var i=1; i<10; i++)
      $(`v${i}`).show();
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
  function refreshTableCell(cell) {
    var td = cell.td;
    if(isSolved(cell)) {
      td.html(cHTML[cell.solved]);
    } else {
      var html = "";
      for (var v=0; v<9; v++)
        if (cell[v])
          html += vHTML[v];
      td.html(html);
    }
  }

  function refreshEdges(group, val1, val2) {
    group.edge1.toggleClass("fullySet", group.sandwichFullySet===true);
    group.edge2.toggleClass("fullySet", group.sandwichFullySet===true);
    group.edge1.text(val1);
    group.edge2.text(val2);
  }

  // rebuild the table
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
    undoWipe();
    refresh();
    refreshUndoLog();
  }

  // clears stateful information after an 'undo'
  function undoWipe() {
    sandwichStaticFinished = false;
    for (var i=0; i<9; i++) {
      var row = sudoku[i];
      var col = sudokuCols[i];
      row.sandwichFullySet = col.sandwichFullySet = false;
    }
  }


  function refreshUndoLog() {
    var labels = undoStack.map(d => d[0]).reverse();
    $("#history").html("History:<br>"+labels.join("<br>"));
  }

  function saveUndoState(label, state=getStatefulExportString()) {
    // console.log(label);
    undoStack.push([label, state]);
    refreshUndoLog();
  }

  function zoneName(swatch) {
    if (swatch===undefined) return "none";
    switch (swatch) {
      case 0: return "blue";
      case 1: return "green 1";
      case 2: return "red";
      case 3: return "yellow";
      case 4: return "purple";
      case 5: return "orange";
      case 6: return "cyan";
      case 7: return "green 2";
      case 8: return "pink";
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
          dragState = -1; // CLEARING COLOURS
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
        td.addClass("selected");
      }

    });

    td.off("mouseenter").on("mouseenter", function(e){
      if (dragState === undefined) return;
      if (dragState === -1 && cell.swatch !== undefined) {
        saveUndoState(cell.pos+" blank");
        cell.swatch = undefined;
      } else if (dragState >= 0 && dragState <= 8) {
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
