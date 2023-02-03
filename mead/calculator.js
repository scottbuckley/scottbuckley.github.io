// INTERFACE

// helpers / abbrevs
const getid = (id => document.getElementById(id));

// set the value of a number input, saving the precise value in the DOM
// tree, but displaying a simplified number.
const showRoundedValue = true;
function setnum(id, val, dp=3) {
    const el = getid(id);
    el.preciseValue = val;
    el.preciseValueRounding = dp;
    if (showRoundedValue)
        el.value = val.toFixed(dp);
        // el.value = val;
    else
        el.value = val;
}

// get the value of a number input/output, using the precise value if it is
// available (checking that is is close to the)
function getnum(id) {
    const el = getid(id);
    if (el.preciseValue === undefined || el.preciseValueRounding === undefined)
        return Number(el.value);
    if (Number(el.preciseValue.toFixed(el.preciseValueRounding)) === Number(el.value)) {
        return el.preciseValue;
    } else {
        console.log("no match from preciseValue", id, ". Defaulting to displayed value.");
        // console.log(el.value);
        // console.log(el.preciseValue);
        // console.log(el.preciseValueRounding);
        // console.log(Number(el.preciseValue.toFixed(el.preciseValueRounding)));
        return Number(el.value);
    }
}

// if a field is edited by the user, set their preciseValue to be the
// same as that new input.
function updatePreciseOnInput(el) {
    el.preciseValue = Number(el.value);
}

// disables the target element (of the main three), and enables the other two.
function setTargetElement(target) {
    ["og", "fg", "abv"].forEach(id => {
        getid(id).disabled = (id === target);
    });
}

// get the id of the currently disabled element (this is the target element)
function getTargetElement() {
    return ["og", "fg", "abv"].find(id => getid(id).disabled);
}

// when the "target" (solve for) radio selection is changed.
function targetChanged(el) {
    const newTarget = document.forms.calc.elements.target.value;
    setTargetElement(newTarget);
    updateCalculations();
}

function tempCorrectionToggle() {
    if (performingTempCorrection()) {
        $(".tempcorrectionon").removeClass("d-none");
        $(".tempcorrectionoff").addClass("d-none");
    } else {
        $(".tempcorrectionon").addClass("d-none");
        $(".tempcorrectionoff").removeClass("d-none");
    }
    updateCalculations();
}

// update calculations when some input has changed.
// this is called on update by some forms, in which case we will update
// their preciseValue too.
function updateCalculations(el) {
    // this method is often called by an input as it is updated. If this is
    // true, we do nothing if that input is disabled (we update disabled inputs
    // programatically). The browser probably protects us from this, but we are
    // just being careful
    if (el) {
        if (el.disabled) return;
        else updatePreciseOnInput(el);
    }

    // figure out what we are solving for
    var target = getTargetElement();
    switch (target) {
        case "abv": updateABV(); break;
        case "og": updateOG(); break;
        case "fg": updateFG(); break;
    }

    // always update the secondary fields
    updateTemps();
    updateSecondary();

    saveInputs();
}

function updateSecondary() {
    const fg = getMaybeTempCorrected("fg");
    const abv = getnum("abv");
    const nafg = updateNAFG(abv, fg);
    updateRS(nafg);
    updateDelle(abv);
}

function updateOG(fg, abv) {
    if (fg===undefined) fg = getMaybeTempCorrected("fg");
    if (abv===undefined) abv = getnum("abv");
    const og = OGFromFGABV(fg, abv);
    setMaybeTempCorrected("og", og, 3);
    // setnum("og", og, 3);
    return og;
}

function updateFG(og, abv) {
    if (og===undefined) og = getMaybeTempCorrected("og");
    if (abv===undefined) abv = getnum("abv");
    const fg = FGFromOGABV(og, abv);
    setMaybeTempCorrected("fg", fg, 3);
    // setnum("fg", fg, 3);
    return fg;
}

function updateABV(og, fg) {
    if (og===undefined) og = getMaybeTempCorrected("og");
    if (fg===undefined) fg = getMaybeTempCorrected("fg");
    const abv = ABVFromSGs(og, fg);
    setnum("abv", abv, 2);
    return abv;
}

function updateNAFG(abv, fg) {
    if (abv === undefined) abv = getnum("abv");
    if (fg === undefined)  fg = getMaybeTempCorrected("fg");
    const nafg = adjustForAlcohol(fg, abv);
    setnum("nafg", nafg, 4);
    return nafg;
}

function updateRS(nafg) {
    if (nafg === undefined) nafg = getnum("nafg");
    const rs = BrixFromSG(nafg) * nafg;
    setnum("rs", rs, 2);
    return rs;
}

function updateDelle(abv, rs) {
    if (abv === undefined) abv = getnum("abv");
    if (rs === undefined) rs = getnum("rs");
    const delle = DelleFromRSABV(rs, abv);
    setnum("delle", delle, 1);
    return delle;
}


// conversions
function getABVMethod() {
    return (getid("abvmethod").value);
}

function ABVFromSGs(og, fg) {
    switch (getABVMethod()) {
        case "BAUME":
            return BaumeABV(og, fg);
        case "LINEAR":
            return LinearABV(og, fg);
        case "DUNCANACTON":
            return DuncanActonABV(og, fg);
        default:
            alert("something went wrong. I guess we haven't finished developing this ABV calculation method yet."); return;
    }
}

function OGFromFGABV(fg, abv) {
    switch (getABVMethod()) {
        case "BAUME":
            return BaumeOG(fg, abv);
        case "LINEAR":
            return LinearOG(fg, abv);
        case "DUNCANACTON":
            return DuncanActonOG(fg, abv);
        default:
            alert("something went wrong. I guess we haven't finished developing this ABV calculation method yet."); return;
    }
}

function FGFromOGABV(og, abv) {
    switch (getABVMethod()) {
        case "BAUME":
            return BaumeFG(og, abv);
        case "LINEAR":
            return LinearFG(og, abv);
        case "DUNCANACTON":
            return DuncanActonFG(og, abv);
        default:
            alert("something went wrong. I guess we haven't finished developing this ABV calculation method yet."); return;
    }
}

// the Baume method
function BaumeABV(og, fg) {
    return 145-145/(1+og-fg);
}

function BaumeFG(og, abv) {
    return (1+og) - 145/(145-abv);
}

function BaumeOG(fg, abv) {
    return 145/(145-abv) - (1-fg);
}

// the linear method
function LinearABV(og, fg) {
    return (og-fg)*131.25;
}

function LinearFG(og, abv) {
    return og - (abv/131.25);
}

function LinearOG(fg, abv) {
    return (abv/131.25) + fg;
}

// the Duncan Acton method
function DuncanActonABV(og, fg, k) {
    if (k === undefined) k = 0.007;
    const abv = (1000 * (og - fg)) / (7.75 - (3.75 * (og - k - 1)));
    return abv;
}

function DuncanActonFG(og, abv, k) {
    if (k === undefined) k = 0.007;
    const fg = og + (abv*3.75*og - abv*(3.75*k + 11.5))/1000;
    return fg;
}

function DuncanActonOG(fg, abv, k) {
    if (k === undefined) k = 0.007;
    const og = (1000*fg + abv*(3.75*k + 11.5))/(1000 + abv*3.75);
    return og;
}

// "Smart" rounding. Do a small round if you ever find '000' or '999'
// in the decimal places. This is a weird round with a base 10 bias, but
// it makes numbers that look nice, and it often corrects for rounding
// errors created by recalculating using complex calculated numbers, as
// often happens when you change target.
function smartRound(n) {
    // ignore if already simple under 4dp
    if (n == Number(n.toFixed(4))) return n;

    const decimals = n.toString().substring(n.toString().indexOf('.')+1);
    const zeroes = decimals.indexOf('000');
    const nines  = decimals.indexOf('999');

    var cutoff;
    if (zeroes === -1 && nines === -1) return n;
    if (zeroes > -1 && nines > -1) cutoff = Math.min(zeroes, nines);
    else cutoff = Math.max(zeroes, nines);

    const simpleN = Number(n.toFixed(cutoff));
    console.log("simplified", n, "to", simpleN);
    return simpleN;
}

function adjustForAlcohol(sg, abv) {
    /* const removeEthanol = (sg*100 - 0.789*abv) / (100-abv);
    const diluteBackToVolume = (removeEthanol*(100-abv) + abv) / 100;
    return diluteBackToVolume;
    this simplifies to the following */
    return sg + 0.00211 * abv;
}


function BrixFromSG(sg) {
    const brix = 182.4601 * Math.pow(sg, 3)
                - 775.6821 * Math.pow(sg, 2)
                + 1262.7794 * sg
                - 669.5622;
    return brix;
}

function DelleFromRSABV(rs, abv) {
    if (rs === undefined) rs = getnum("rs");
    if (abv === undefined) abv = getnum("abv");
    return 4.5 * abv + rs;
}

function performingTempCorrection() {
    return getTemperatureUnit() !== 'OFF';
}

function getMaybeTempCorrected(id) {
    if (!performingTempCorrection())
        return getnum(id);
    if (id === "og") return getTempCorrectedOG();
    if (id === "fg") return getTempCorrectedFG();
    return getnum(id);
}

// returning setnum(...), which is undefined, but thats ok.
function setMaybeTempCorrected(id, val, dp=3) {
    if (!performingTempCorrection())
        return setnum(id, val, dp);
    if (id === "og") return setnum("og", getReverseTempCorrectedOG(val), dp);
    if (id === "fg") return setnum("fg", getReverseTempCorrectedFG(val), dp);
    return setnum(id, val, dp);
}

function getReverseTempCorrectedOG(og) {
    const readTemp = getnum("ogtemp");
    const basisTemp = getTemperatureBasis();

    if (getTemperatureUnit() === 'F')
        return adjustSGForTempF(og, readTemp, basisTemp);
    return adjustSGForTempC(og, readTemp, basisTemp);
}

function getReverseTempCorrectedFG(fg) {
    const readTemp = getnum("fgtemp");
    const basisTemp = getTemperatureBasis();

    if (getTemperatureUnit() === 'F')
        return adjustSGForTempF(fg, readTemp, basisTemp);
    return adjustSGForTempC(fg, readTemp, basisTemp);
}

// temperature adjustments
function getTempCorrectedOG() {
    const readOG = getnum("og");
    if (!performingTempCorrection()) return readOG;
    const readTemp = getnum("ogtemp");
    const basisTemp = getTemperatureBasis();

    if (getTemperatureUnit() === 'F')
        return adjustSGForTempF(readOG, basisTemp, readTemp);
    return adjustSGForTempC(readOG, basisTemp, readTemp);
}

function getTempCorrectedFG() {
    const readOF = getnum("fg");
    if (!performingTempCorrection()) return readOF;
    const readTemp = getnum("fgtemp");
    const basisTemp = getTemperatureBasis();

    if (getTemperatureUnit() === 'F')
        return adjustSGForTempF(readOF, basisTemp, readTemp);
    return adjustSGForTempC(readOF, basisTemp, readTemp);
}

function updateTemps() {
    // update temperature symbol on form.
    $(".show-temp-unit").html(getTemperatureSymbol());
    $(".show-basis-temp").html(Number(getTemperatureBasis().toFixed(2)));
    $("#ogtempcorrected").html(getTempCorrectedOG().toFixed(3));
    $("#fgtempcorrected").html(getTempCorrectedFG().toFixed(3));
}

function getTemperatureBasis(unit) {
    if (unit===undefined) unit=getTemperatureUnit();
    const basis = getTemperatureBasisC();
    if (unit === 'C')
        return basis;
    return CtoF(basis);
}

function CtoF(c) {
    return c*1.8 + 32;
}

function FtoC(f) {
    return (f-32)/1.8;
}

function getTemperatureBasisC() {
    switch (getABVMethod()) {
        case "BAUME":
            // fixme: Find out what the basis temp for Baume is
            return 20;
        case "LINEAR":
            return FtoC(60);
        case "DUNCANACTON":
            return FtoC(60);
        default:
            return 20;
    }
}

function getTemperatureUnit() {
    return document.forms.calc.elements.tempunit.value;
}

function getTemperatureSymbol(tempunit) {
    if (tempunit===undefined) tempunit = getTemperatureUnit();
    if (tempunit==="F")
        return "&#8457";
    return "&#8451";
}

// adjust specific gravity for temperature (Farenheit)
// this is the same polynomial as used by VinoCalc https://www.vinolab.hr/calculator/hydrometer-temperature-correction-en31
// and other places. I just rearranged it a little.
function adjustSGForTempF(sg, ctF, rtF) {
    const coeff = ((100130.346 - (rtF * 13.4722124) + (rtF*rtF * 0.204052596) - (rtF*rtF*rtF * 0.000232820948))
                    / (100130.346 - (ctF * 13.4722124) + (ctF*ctF * 0.204052596) - (ctF*ctF*ctF * 0.000232820948)));
    return (sg * coeff);
}

// adjust specific gravity for temperature (Celcius)
function adjustSGForTempC(sg, ctC, rtC) {
    const coeff = (99900.5559846799 - (rtC * 2.03052997486) + (rtC*rtC * 0.5887137834) - (rtC*rtC*rtC * 0.001357811768736))
                / (99900.5559846799 - (ctC * 2.03052997486) + (ctC*ctC * 0.5887137834) - (ctC*ctC*ctC * 0.001357811768736));
    return (sg * coeff);
}



// localStorage
const ls = window.localStorage;
const ls_numericInputs = ["og", "fg", "abv"];
const ls_optionInputs = ["target", "tempunit"];
const ls_checkboxInputs = [];

function saveInputs() {
    ls_numericInputs.forEach(id => {
        const val = getnum(id);
        ls.setItem(id, val);
    });
    ls_optionInputs.forEach(id => {
        const val = document.forms.calc.elements[id].value;
        ls.setItem(id, val);
    });
    ls_checkboxInputs.forEach(id => {
        const val = getid(id).checked;
        ls.setItem(id, val);
    });
}

function loadInputs() {
    if (ls.getItem("og") === null) return;
    ls_numericInputs.forEach(id => {
        const val = Number(ls.getItem(id));
        const dp = (id==="abv")?2:3; // the number of decimal points to display
        setnum(id, val, dp);
    });
    ls_optionInputs.forEach(id => {
        const val = ls.getItem(id);
        document.forms.calc.elements[id].value = val;
    });
    ls_checkboxInputs.forEach(id => {
        const val = ls.getItem(id);
        getid(id).checked = (val==='true');
    });
}


function init() {
    // INIT
    loadInputs();
    targetChanged();
    tempCorrectionToggle();
    updateCalculations();

    // interface stuff
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl, {html:true, container: 'body'});
    });
}
