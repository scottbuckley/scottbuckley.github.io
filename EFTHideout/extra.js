
// returns a promise
function importTTProgress(store, callback=()=>{}) {
    var api_token = store['tarkovTravker_API_token'];
    if (!api_token) {
        let new_token = prompt("You need a TarkovTracker API token to import progress (which you can find in TarkovTracker's settings page). Paste it here.");
        if (new_token) {
            store['tarkovTravker_API_token'] = new_token;
            api_token = new_token;
        } else return;
    }

    // let impString = prompt("Paste the progress JSON you got from TarkovTravker.io here");
    // let progress = JSON.parse(impString);
    d3.json("https://tarkovtracker.io/api/v2/progress", {
        headers: {Authorization: `Bearer ${api_token}`}
      }).then(function (result) {
        console.info("Retrieved quest progress from TarkovTracker.");
        applyTTProgress(result);
        callback(result);
      });
}

// returns a promise
function applyTTProgress(progress) {
    return d3.json("quests.json").then(function (g) {
        let completedTasks = progress.data.tasksProgress.filter(t=>t.complete).map(t=>t.id);
        for (let task of g) {
            let gId = task.gameId;
            let completed = (completedTasks.includes(gId));
            store[`completed_${gId}`] = completed ? "Y" : "N";
            // getQuest(task.id).completed = completed;
        }
    });
}






function generateTextArc(radius) {
    const wings_angle = 15*Math.PI/180;
    const arc_start_x = - radius * Math.cos(wings_angle);
    const arc_start_y = radius * Math.sin(wings_angle);
    const wing_length = radius*8;
    const wing_span_x = wing_length * Math.sin(wings_angle);
    const wing_span_y = wing_length * Math.cos(wings_angle);
    return `M${arc_start_x-wing_span_x},${arc_start_y-wing_span_y}
            L${arc_start_x},${arc_start_y}
            A${radius},${radius} 0 0,0 ${-arc_start_x},${arc_start_y}
            l${wing_span_x},${-wing_span_y}`;
    // return `M0,${-radius} a${radius},${radius} 0 1,0 0,${radius*2} a${radius},${radius} 0 1,0 0,-${radius*2}`;
}










function computeDistToCompletable(graph) {
    return computeDistsToParentWithProp(graph, n => {
        return graph.getParentNodes(n).filter(p=>!p.completed).length===0;
    }, "complDist");
}

// sets the 'label' property on each node to:
// 0, if 'prop' holds.
// n, if the nth ancestor of this node holds the property.
// Infinity if no ancestor holds this property.
function computeDistsToParentWithProp(graph, prop, label) {
    let visited = new Array(graph.nodes.length);
    let calculateDist = (node) => {
        // don't recalculate if it already exists.
        let idx = node.idx;
        if (visited[idx]) return node[label];
        visited[idx] = true;

        // prop holds here
        if (prop(node)) return node[label] = 0;

        // calculate dists on parents
        let parDists = graph.getParentNodes(node)
                            .map(calculateDist);
        
        // return the minimum ()
        return node[label] = Math.min(...parDists) + 1;
    };

    graph.nodes.forEach(calculateDist);
}










// Custom force to put all nodes in a box
function boundaryForce(xLeft, xRight, yTop, yBottom) {
    const radius = 500;

    for (let node of nodes) {
        // Of the positions exceed the box, set them to the boundary position.
        // You may want to include your nodes width to not overlap with the box.
        node.x = Math.max(-radius, Math.min(radius, node.x));
        node.y = Math.max(-radius, Math.min(radius, node.y));
    }
}

function keepInBox(node, xLeft, xRight, yTop, yBottom) {
    if (node.x < xLeft) {
        node.x = xLeft;
        node.vx = Math.abs(node.vx);
    } else if (node.x > xRight) {
        node.x = xRight;
        node.vx = -Math.abs(node.vx);
    }

    if (node.y < yTop) {
        node.y = yTop;
        node.vy = Math.abs(node.vy);
    } else if (node.y > yBottom) {
        node.y = yBottom;
        node.vy = -Math.abs(node.vy);
    }
    // d.x = Math.max(-width/2+defaultRadius, Math.min(width/2 - defaultRadius, d.x));
    // d.y = Math.max(-height/2+defaultRadius, Math.min(height/2 - defaultRadius, d.y));
}

function nodeDistance(node, nbrIdx) {
    return 100 / ((10 + node.distMap.get(nbrIdx)) || Infinity);
}

// allocate radial positions to the set of nodes, but try to group nodes with
// common parents together.
function allocateRadialPositions(nodes, radius, parentFn, childFn, getQuest) {
    
    // give all nodes in the family tree blank maps, which will store relationship weights
    var mapsMade = new Set();
    function makeBlankMaps(node) {
        if (mapsMade.has(node)) return;
        mapsMade.add(node);
        node.distMap = new Map();
        parentFn(node).forEach(makeBlankMaps);
    }
    nodes.forEach(makeBlankMaps);
    
    // const weight_reduction_upwards = 0.5;
    var roots = new Set();
    function propagateUpwards(node, key, distance) {
        var parents = parentFn(node);
        if (parents.length === 0) {
            roots.add(node);
        } else {
            parents.forEach((par) => {
                var curDist = par.distMap.get(key);
                if (curDist === undefined) {
                    // haven't seen this node before
                    par.distMap.set(key, distance);
                    propagateUpwards(par, key, distance+1);
                } else if (curDist > distance) {
                    // have seen it before, but this path is faster
                    par.distMap.set(key, distance);
                    propagateUpwards(par, key, distance+1);
                } else {
                    // have seen it before, and this path is slower. do nothing.
                }
            });
        }
    }

    // propagate neighbour distances up the tree
    nodes.forEach((n) => { propagateUpwards(n, n.idx, 1); });

    function distMapInsert(childMap, parentMap) {
        parentMap.forEach((dist, nd) => {
            const cur = childMap.get(nd);
            if (cur === undefined || cur > dist)
                childMap.set(nd, dist);
        });
    }

    // now propagate this information back down from the roots
    var curLevel = roots;
    while (curLevel.size > 0) {
        var nextLevel = new Set();
        curLevel.forEach((n) => {
            childFn(n).forEach((ch) => {
                if (ch.distMap !== undefined) {
                    distMapInsert(ch.distMap, n.distMap);
                    nextLevel.add(ch);
                }
            });
        });
        curLevel = nextLevel;
    }
    
    // set up the new nodes list, and add three items already
    var newNodes = [];
    for (var i=0; i<nodes.length && i < 3; i++)
        newNodes.push(nodes[i].idx);

    // console.log(newNodes);

    function entryWeight(node, index) {
        const len = newNodes.length;
        const searchDist = Math.min(len-2, 5);
        var curWeight = 0;
        for (var i=0; i<searchDist; i++) {
            const i1 = (index-i+len) % len;
            const i2 = (index+1+i) % len;
            // console.log(newNodes.length, i1, i2);
            curWeight += nodeDistance(node, newNodes[i1]) / (1 + (i));
            curWeight += nodeDistance(node, newNodes[i2]) / (1 + (i));
        }
        return curWeight;
    }

    const monitor_index = 206;

    nodes.forEach((node) => {
        // if (node.idx === 101) console.log("meow"); 
        // console.log(node, node.idx);
        var bestWeight = 0;
        var bestWeightIndex = 0;
        for (var i=0; i<newNodes.length; i++) {
            const weight = entryWeight(node, i);
            // if (node.idx === monitor_index) console.log(i, weight); 
            if (weight > bestWeight) {
                bestWeight = weight;
                bestWeightIndex = i;
            }
        }
        // console.log("best new index is", bestWeightIndex);
        // if (node.idx === monitor_index) console.log(node, bestWeight, bestWeightIndex);
        // if (node.idx === monitor_index) console.log(newNodes);
        newNodes.splice(bestWeightIndex, 0, node.idx)
        // if (node.idx === monitor_index) console.log(newNodes);
    });



    // console.log(newNodes);

    newNodes = newNodes.map(getQuest);

    const radianGap = Math.PI*2/nodes.length;
    const circumference = 2 * Math.PI * radius;
    for (var i=0; i<nodes.length; i++) {
        const theta = i * radianGap;
        newNodes[i].x = Math.cos(theta) * radius;
        newNodes[i].y = Math.sin(theta) * radius;
    }

}

/*
algorithm notes:
place items progressively, giving them their best position?
but will this fuck up the positions of previous elements

    X -.
   / \  \
  Y   Z  \       W
 / \ /    \     / \
A   B      C   D   E

// closer common ancestors are worth more than further ones
AB = 2
AC = 1.5      // 1 + 0.5
AD = 0
AE = 0

BC = 0.5
BD = 0
BE = 0

CD = 0
CE = 0

DE = 1


// add them in the following order:
C, D, A, E, B


[C]

[C, D]

// placing the third one is still arbitrary

[C, D, A]

// now we decide what the best place for E is : we have 3 options (we are thinking radially)

[E, C, D, A]
 ^

[C, E, D, A]
    ^

[C, D, E, A]
       ^

// maybe we just check all options, give each a score, then choose the best score.
// this would require some kind of weighting system, where being right next to another
// node gives exactly their relationship score, and it fades a bit as you consider further-away
// neighbours?

// can this be done as some kind of running-average? maybe, but i'm not sure how.




*/

// move all nodes into a ring around the center, with the given radius.
// just places them according to their indices
function allocateRadialPositions_simple(nodes, radius) {
    const radianGap = Math.PI*2/nodes.length;
    const circumference = 2 * Math.PI * radius;
    for (var i=0; i<nodes.length; i++) {
        const theta = i * radianGap;
        nodes[i].x = Math.cos(theta) * radius;
        nodes[i].y = Math.sin(theta) * radius;
    }
}