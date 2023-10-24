type ArrayTail<T extends any[]> = T extends [T[0], ...infer TT] ? TT : never

function memo<T extends any[],U>(fn:(...a:T)=>U) {
    type restT = ArrayTail<T>
    // not yet sure which kind of cache we will use
    const constCache = new Array<U>()
    const valCache = new Map<T[0],U>()
    var fnCache = new Map<T[0],(...b:restT)=>U>()
    return function(...params:T):U {
        console.log("entering with " + params)
        const paramsHead:T[0] = params[0]
        if (params.length === 1) {
            // console.log("easy, a single param")
            // single parameter. use the value cache.
            if (valCache.has(paramsHead)) {
                console.log("we have a cached value for " + paramsHead)
                return valCache.get(paramsHead)!
            }
            console.log("need to cache a value for " + paramsHead)
            // still passing in potential (uncached) rest parameters
            const u = fn(...params)
            valCache.set(paramsHead, u);
            return u
        } else if (params.length === 0) {
            console.log("oh heck. no parameters?")
            // no parameters. this is weird. i guess use a constant cache.
            // using an array like an option
            if (constCache.length === 0)
                constCache.push(fn(...params))
            return constCache[0]
        } else {
            // console.log("oh boy multiple parameters")
            // more than 1 parameter. recursively memoise
            const paramsRest = params.slice(1) as restT
            if (fnCache.has(paramsHead)) {
                console.log("we have a cached fn for " + paramsHead)
                return fnCache.get(paramsHead)!(...paramsRest)
            }
            console.log("need to cache this thing recursively for " + paramsHead)
            const restFn = memo(function(...params2:restT):U {
                return fn(...[paramsHead, ...params2] as T)
            })
            fnCache.set(paramsHead, restFn)
            return restFn(...paramsRest)
        }
    }
}

function curry<T,U,V>(fn:(t:T, u:U) => V) : (t:T) => (u:U) => V {
  return (t:T) : (u:U) => V =>
    (u:U) : V =>
      fn(t, u);
}

// empty an array
function clearArray<T>(a:T[]) {
  while(a.length>0) a.pop();
}
