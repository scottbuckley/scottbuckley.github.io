function memoise1(fn, debug=false) {
  const cache = [];
  return function(a) {
    if (cache.hasOwnProperty(a)) {
      debug && console.log("Retrieving result from cache.")
      return cache[a];
    } else {
      debug && console.log("Computing result and storing in cache.")
      return (cache[a] = fn(...arguments));
    }
  }
}

function memoise(argCount, fn, debug=false) {
  // there is a faster single-argument version we might be able to use.
  if (argCount===1) return memoise1(fn, debug);

  const topLevelCache = [];

  // check whether the given args are already cached or not
  var cacheKeyExists = function(args) {
    var cache = topLevelCache;
    for (var i=0; i<argCount; i++) {
      if (!cache.hasOwnProperty(args[i])) return false;
      cache = cache[args[i]];
    }
    return true;
  };

  // store a value in cache with the given args
  var storeCachedValue = function(args, val) {
    var cache = topLevelCache;
    for (var i=0; i<argCount-1; i++) {
      if (!cache.hasOwnProperty(args[i]))
        cache[args[i]] = [];
      cache = cache[args[i]];
    }
    cache[args[argCount-1]] = val;
  };

  // retrieve a value from cache
  var getCachedValue = function(args) {
    var result = topLevelCache
    for (var i=0; i<argCount; i++)
      result = result[args[i]];
    return result;
  }

  // the evaluation function
  return function() {
    if (cacheKeyExists(arguments)) {
      debug && console.log("Retrieving result from cache.")
      return getCachedValue(arguments);
    } else {
      debug && console.log("Computing result and storing in cache.")
      var value = fn(...arguments);
      storeCachedValue(arguments, value);
      return value;
    }
  }
}

// empty an array
function clearArray(a) {
  while(a.length>0) a.pop();
}

// return `count` [x, y] coordinates, between 0 and 1, that evenly
// spread out `count` candidates.
const distributeCandidates = memoise(1, function(count, padding=0.15) {
  const out = [];
  const numRows = Math.round(Math.sqrt(count));
  const numCols = Math.ceil(count/numRows);
  var spreadX = (1-padding*2)/numCols;
  const spreadY = (1-padding*2)/numRows;
  const nonSquare = !(numRows*numCols === count);

  var i=-1;
  for (var r=0; r<numRows; r++) {
    for (var c=0; c<numCols; c++) {
      i = i + 1;
      if (i >= count) return out;
      if (nonSquare && r === numRows-1) {
        out.push([0.5-(spreadX*(count%numCols)/2)+spreadX*(c+0.5), padding+spreadY*(r+0.5)]);
      } else {
        out.push([padding+spreadX*(c+0.5), padding+spreadY*(r+0.5)]);
      }
    }
  }
  return out;
});