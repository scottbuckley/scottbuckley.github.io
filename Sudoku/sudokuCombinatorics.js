
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

  function zeroesList(length) {
    var out = [];
    for (var i=0; i<length; i++)
      out.push(0);
    return out;
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

  function waysToSumGeneral(total, vals=[1,2,3,4,5,6,7,8,9], minLength=1, maxLength=9999, maxrepeat=1, used=zeroesList(vals.length)) {
    return decorateWaysList(waysToSumGeneralAux(total, vals, minLength, maxLength, maxrepeat, used));
  }

  function waysToSumSWLen(total,len) {
    return waysToSumGeneral(total, [2,3,4,5,6,7,8], len, len);
  }

  // vals must be in strictly increasing order
  function waysToSumGeneralAux(total, vals=[1,2,3,4,5,6,7,8,9], minLength=1, maxLength=9999, maxrepeat=1, used=zeroesList(vals.length)) {

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

/* given a set of sets, choose `n` non-overlapping sets */
function chooseNonOverlapping(sets, n) {
    
}