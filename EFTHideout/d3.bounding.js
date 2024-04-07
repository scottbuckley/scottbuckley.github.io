function constant$4(x) {
    return function() {
      return x;
    };
  }

function boundingBox(xLeft, xRight, yTop, yBottom, padding, strength) {
    var nodes,
        wallDists,
        radii,
        strengths;
  
    if (typeof padding !== "function") padding = constant$4(padding == null ? 0 : +padding);
    if (typeof strength !== "function") strength = constant$4(strength == null ? 1 : +strength);

    if (isNaN(xLeft)) xLeft = 0;
    if (isNaN(xRight)) xRight = 100;
    if (isNaN(yTop)) yTop = 0;
    if (isNaN(yBottom)) yBottom = 100;
  
    function force(alpha) {
      for (var i = 0, n = nodes.length, node, r, pad; i < n; ++i) {
        node = nodes[i];
        r = radii[i];
        pad = wallDists[i];
        str = strengths[i];
        // padding = 10
        // xleft = -100
        // xleftpad = -90
        // x = -98
        // dist_from_padding = 8;

        let xDist = (node.x-r)-xLeft;
        if (xDist < pad) {
            if (xDist < 0) { xDist=0; node.x = xLeft+r; }
            node.vx += str*alpha*(pad - xDist);
        } else {
            xDist = xRight-(node.x+r);
            if (xDist < pad) {
                if (xDist < 0) { xDist=0; node.x = xRight-r; }
                node.vx -= str*alpha*(pad - xDist);
            }
        }


        let yDist = (node.y-r)-yTop;
        if (yDist < pad) {
            if (yDist < 0) { yDist=0; node.y = yTop+r; }
            node.vy += str*alpha*(pad-yDist);
        } else {
            yDist = yBottom-(node.y+r);
            if (yDist < pad) {
                if (yDist < 0) { yDist=0; node.y = yBottom-r; }
                node.vy -= str*alpha*(pad-yDist);
            }
        }
        
        
        // if (node.x > xRight-r) {
        //     node.x = xRight-r;
        // }

        // if (node.y < yTop+r) {
        //     node.y = yTop+r;
        // } else if (node.y > yBottom-r) {
        //     node.y = yBottom-r;
        // }
        // node.vx += (xz[i] - node.x) * strengths[i] * alpha;
      }
    }
  
    function initialize() {
      if (!nodes) return;
      var i, n = nodes.length;
      wallDists = new Array(n);
      radii = new Array(n);
      strengths = new Array(n);
      for (i = 0; i < n; ++i) {
        radii[i] = nodes[i].radius;
        strengths[i] = +strength(nodes[i], i, nodes);
        if (isNaN(wallDists[i] = +padding(nodes[i], i, nodes)))
            wallDists[i] = 0;
      }
    }
  
    force.initialize = function(_) {
      nodes = _;
      initialize();
    };
  
    force.padding = function(_) {
      return arguments.length ? (padding = typeof _ === "function" ? _ : constant$4(+_), initialize(), force) : padding;
    };
  
    // force.x = function(_) {
    //   return arguments.length ? (x = typeof _ === "function" ? _ : constant$4(+_), initialize(), force) : x;
    // };
  
    return force;
  }