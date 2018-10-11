//begin sat additions
class Polygon {
    constructor(pos, points,floor=0) {
        this.pos = new Vector();
        this.points = points || [];
        this.floor = floor;
        this.enabled = true;
        this.setPos(pos);
    }
    draw(context) {
        
        var points = this.points;
        var i = points.length;
        
        //ctx.transform(1,0,0,1,this.pos.x,this.pos.y);

        context.beginPath();
        context.moveTo(points[0].x ,points[0].y);
        while(i--) context.lineTo(points[i].x, points[i].y);
        context.closePath();
        //ctx.fillStyle = '#FF8800';
        context.fill();
        //if(fill){ctx.fillStyle = '#FF2222';ctx.fill();}
        //ctx.stroke();
        //ctx.transform(1,0,0,1,-this.pos.x,-this.pos.y)
    }

    setPos(pos) {
        var diff = pos.Subtract(this.pos);
        this.pos = pos;
        for(var i = 0; i < this.points.length; i++) {
            this.points[i].x += diff.x;
            this.points[i].y += diff.y;
        }
    }

     setType(type) {
        this.type = type;
        return this;
    }

     setId(id) {
        this.id = id;
        return this;
    }

}

class Circle {

    constructor(pos, radius) {
        this.pos = pos || new Vector();
        this.radius = radius || 5;
    }

    draw(fill = false) {
        ctx.fillStyle = '#88AA00';
        if(fill){ctx.fillCircle(this.pos.x,this.pos.y,this.radius);}
        ctx.strokeCircle(this.pos.x,this.pos.y,this.radius);

    }

    setPos(pos) {
        this.pos = pos;
    }

    setId(type) {
        this.obstacles[this.obstacles.length-1].type = type;
        return this.obstacles[this.obstacles.length-1];
    }

}
//should combine with vector2d later
class Vector {
    constructor(x=0,y=0){
        this.x = x;
        this.y = y;
    }
    Subtract(v) {
        return new Vector(this.x - v.x,this.y - v.y);
    }
    Unit() {
        var m = this.Magnitude();
        return new Vector(this.x/m, this.y/m);
    }
    Magnitude() {
        return Math.sqrt(this.x**2 + this.y**2);
    }
    Normal() {
        return new Vector(this.y, -this.x);
    }
    DotProduct(vec) {
        return this.x*vec.x + this.y*vec.y;
    }
    Add(vec) {
        return new Vector(this.x + vec.x, this.y + vec.y);
    }
    Multiply(val) {
        return new Vector(this.x * val, this.y * val);
    }

}

class Range {
    constructor(a,b) {
        this.Start = a < b ? a : b;
        this.End = a < b ? b : a;
    }
    Length() {
        return this.End - this.Start;
    }
    Intersect(other) {

        var firstRange = this.Start < other.Start ? this : other;
        var secondRange = firstRange == this ? other : this;
        if(firstRange.End < secondRange.Start) {
            return new Range(0,0);
        }

        return new Range(secondRange.Start,Math.min(firstRange.End,secondRange.End));
    }
}

class ObstacleContainer {
    constructor() {
        this.obstacles = [];
        this.interior = [[],[],[]];
    }
    Add(ob) {
        this.obstacles.push(ob);
        this.obstacles[this.obstacles.length-1].type = "";
        return this.obstacles[this.obstacles.length-1];
    }
    AddInterior(ob) {
        this.interior[ob.floor].push(ob);
    }

    GetObstaclesById(id) {
        var results = [];
        for(var i = 0; i < this.obstacles.length; i++) {
            if(this.obstacles[i].id == id) {
                results.push(this.obstacles[i]);
            }
        }
        return results;
    }

}


function jCirclePolyCollision(circle, poly) {
    var circleRange;
    var polyRange;
    
    //resolution
    var smallestDisplacement = {vec: new Vector(), range: new Range(-Number.MAX_VALUE,Number.MAX_VALUE)};
    //
    //first check polygon normals, then check vector circle centre to closest vertex
    var prevPoint = poly.points[0];
    for(var i = 1; i < poly.points.length+1; i ++) {
        var currentPoint = poly.points[i%poly.points.length];
        var sideVector = currentPoint.Subtract(prevPoint);
        var axisVector = sideVector.Unit().Normal();
        //
        //var displacementFromOrigin = axisVector.DotProduct(prevPoint);
        //console.log(displacementFromOrigin);
        //
        //project each polygon's vertices along this axis
        polyRange = ProjectOntoAxis(axisVector, poly);
        circleRange = ProjectCircleOntoAxis(axisVector, circle);
        /*if(i==4){console.log(circleRange);
                    console.log(polyRange);
                DisplayCollisionLine(axisVector);}*/
               
        var intersect = polyRange.Intersect(circleRange);
        
        if(intersect.Length() < 0.0001) {
            //there exists a separating axis between the convex polygons, so no collision
            return false;
        }

        //resolution
        if(intersect.Length() < smallestDisplacement.range.Length()) {
            //smallestDisplacement.vec = axisVector;
            smallestDisplacement.range = intersect;

            //choose axis direction that is closest to the side?
            //smallestDisplacement.vec = Math.abs(axisVector.DotProduct(prevPoint)) < Math.abs(axisVector.Multiply(-1).DotProduct(prevPoint)) ? axisVector : axisVector.Multiply(-1);
            //didn't work
            //find each direction's distance along line 0 to prevpoint - choose one with highest displacement?
            //temp solution - find largest projection along direction vector between the 2 shapes
            //reoslves first object argument only
            var n1 = axisVector.DotProduct(circle.pos.Subtract(poly.pos));
            var n2 = axisVector.Multiply(-1).DotProduct(circle.pos.Subtract(poly.pos));
            if(n1 < n2) {smallestDisplacement.vec = axisVector}
                else{smallestDisplacement.vec = axisVector.Multiply(-1);}
        }

        prevPoint = currentPoint;
    }

    //find vertex closest to centre of circle
    var closestVertex = 0;
    for(var i = 0; i < poly.points.length; i++) {

        if(circle.pos.Subtract(poly.points[i]).Magnitude() < circle.pos.Subtract(poly.points[closestVertex]).Magnitude()) {
            closestVertex = i;
        }
    }
    
    //check this axis
    var circAxis = circle.pos.Subtract(poly.points[closestVertex]);
    polyRange = ProjectOntoAxis(circAxis, poly);
    circleRange = ProjectCircleOntoAxis(circAxis, circle);
    var intersect = polyRange.Intersect(circleRange);

    if(intersect.Length() < 0.0001) {
        //there exists a separating axis between the convex polygons, so no collision
        return false;
    }

    /*ctx.beginPath();
    ctx.moveTo(circle.pos.x,circle.pos.y);
    ctx.lineTo(poly.points[closestVertex].x,poly.points[closestVertex].y);
    ctx.stroke();
    ctx.closePath();*/
    //resolution
    if(intersect.Length() < smallestDisplacement.range.Length()) {
        //smallestDisplacement.vec = axisVector;
        smallestDisplacement.range = intersect;

        //choose axis direction that is closest to the side?
        //smallestDisplacement.vec = Math.abs(axisVector.DotProduct(prevPoint)) < Math.abs(axisVector.Multiply(-1).DotProduct(prevPoint)) ? axisVector : axisVector.Multiply(-1);
        //didn't work
        //find each direction's distance along line 0 to prevpoint - choose one with highest displacement?
        //temp solution - find largest projection along direction vector between the 2 shapes
        //reoslves first object argument only
        var n1 = axisVector.DotProduct(circle.pos.Subtract(poly.pos));
        var n2 = axisVector.Multiply(-1).DotProduct(circle.pos.Subtract(poly.pos));
        if(n1 < n2) {smallestDisplacement.vec = axisVector}
            else{smallestDisplacement.vec = axisVector.Multiply(-1);}
    }
    
    //can cause NaN error if duplicate points are in polygon - need unique points otherwise the vector is (0,
    return {result:true,displacement:smallestDisplacement};
}


function ProjectOntoAxis(axisVec, obj, org=new Vector()) {
    var max = -Number.MAX_VALUE;
    var min = Number.MAX_VALUE;
    axisVec = axisVec.Subtract(org).Unit();
    for(var i = 0; i<obj.points.length; i++){
        var currentPoint = obj.points[i];

        //var projectionSize = axisVec.DotProduct(currentPoint);
        var projectionSize = currentPoint.Subtract(org).DotProduct(axisVec);
        if(projectionSize < min) {min = projectionSize;}
        if(projectionSize > max) {max = projectionSize};

    }

    return new Range(min,max);
}

function ProjectCircleOntoAxis(axisVec, circ, org = new Vector()) {

    var max = -Number.MAX_VALUE;
    var min = Number.MAX_VALUE;
    axisVec = axisVec.Subtract(org).Unit();
    
    var currentPoint = circ.pos.Add(axisVec.Multiply(circ.radius));
    //var projectionSize = axisVec.DotProduct(currentPoint);
    var projectionSize = currentPoint.Subtract(org).DotProduct(axisVec);
    if(projectionSize < min) {min = projectionSize;}
    if(projectionSize > max) {max = projectionSize};

    currentPoint = circ.pos.Subtract(axisVec.Multiply(circ.radius));
    //var projectionSize = axisVec.DotProduct(currentPoint);
    var projectionSize = currentPoint.Subtract(org).DotProduct(axisVec);
    if(projectionSize < min) {min = projectionSize;}
    if(projectionSize > max) {max = projectionSize};
    

    return new Range(min,max);

}



/// end sat additions


class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    static distance(a, b, squared = false) {
        //return distance between two vectors;
        if(typeof(a) == 'undefined' || typeof(b) == 'undefined') {
            return Infinity;
        }
        if(squared) {
            return(a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        } else {
            return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        }
    }
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    dot(a) {
        return this.x * a.x + this.y * a.y;
    }
    static angleBetween(a, b) {
        return Math.acos(this.dot(a, b) / (a.magnitude() * b.magnitude()));
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
    }
    static sub(a, b) {
        return new Vector2D(a.x - b.x, a.y - b.y);
    }
    static add(a, b) {
        return new Vector2D(a.x + b.x, a.y + b.y);
    }
    div(a) {
        this.x = this.x / a;
        this.y = this.y / a;
    }
    mult(a) {
        this.x = this.x * a;
        this.y = this.y * a;
    }
    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    magnitudesq() {
        return this.x ** 2 + this.y ** 2;
    }
    normalize() {
        var m = this.magnitude();
        if(m > 0) {
            this.div(m);
        }
    }
    limit(maxSize) {
        if(maxSize <= 0) {
            this.x = 0;
            this.y = 0;
        } else if(this.magnitude() > maxSize) {
            var ratio = this.magnitude() / maxSize;
            this.div(ratio);
        }
    }
    rotate(a) {
        this.x = this.x * Math.cos(a) - this.y * Math.sin(a);
        this.y = this.x * Math.sin(a) + this.y * Math.cos(a);
    }
    static getNormalPoint(p, a, b) {
        var ap = Vector2D.sub(p, a);
        var ab = Vector2D.sub(b, a);
        ab.normalize();
        ab.mult(ap.dot(ab));
        var normalPoint = Vector2D.add(a, ab);
        return normalPoint;
    }
    static project(p, angle, dist) {
        var g = new Vector2D();
        g.x = Math.cos(angle) * dist;
        g.y = Math.sin(angle) * dist;
        g.add(p);
        g.x = parseFloat(g.x.toFixed(4));
        g.y = parseFloat(g.y.toFixed(4));
        return g;
    }

}

class Tile {

    constructor(loc, size) {
        this.pos = loc;
        this.size = size;
        this.passable = true;
        this.walkable = true;
        this.shootThrough = true;
        this.type = 'grass';
    }

    setType(a) {
        //passable - zombies can walk
        //walkable - player and zombies can walk
        if(a == '.') {
            a = 'grass';
        } else if(a == ',') {
            a = 'tile';
        } else if(a == 'W') {
            a = 'window';
            this.walkable = false;
            this.passable = true, this.shootThrough = true;
        } else if(a == 'D') {
            a = 'door';
            this.passable = false;
            this.walkable = false;
            this.shootThrough = false;
        } else if(a == '-') {
            a = 'carpet';
        } else if(a == 'X') {
            a = 'wall';
            this.passable = false;
            this.walkable = false;
            this.shootThrough = false;
        } else if(a == 'F') {
            a = 'mesh';
            this.passable = false;
            this.walkable = false;
            this.shootThrough = true;
        } else if(a == 'V') {
            a = 'void';
            this.passable = true;
            this.walkable = true;
            this.shootThrough = true;
        } else if(a == 'B') {
            a = 'voidBlock';
            this.passable = false;
            this.walkable = false;
            this.shootThrough = true;
        } else if(a == 'A') {
            a = 'windowAttractor';
            this.passable = true;
            this.walkable = true;
            this.shootThrough = true;
        } else if(a==' ') {
            a = 'air';
            this.passable = false;
            this.walkable = false;
        }
        this.type = a;
    }
}

class WindowInstance {
    constructor(id) {
        this.id = id || "";
        this.health = 140;
        this.maxHealth = 140;
        this.readyToBeHit = true;
        this.readyToBeRepaired = true;
        this.repairCount = 0;
        this.newlyPlacedImmunity = false;
        //console.log(this.id, this.health);
    }
    damage(val) {
        if(this.readyToBeHit && !this.newlyPlacedImmunity) {
        this.health -= val;
        //console.log(this.health, this.id);
        if(this.health <= 0) {Sounds.playSound('windowsmash');}
        else {Sounds.playSound('windowhit'+(Math.floor(Math.random()*3)+1));}
        //add scope to setTimeout
        var self = this;
        this.readyToBeHit = false;
        //console.log(self);

       
        setTimeout((function(){this.readyToBeHit = true;}).bind(this),2000+Math.random()*1000);
        }
    }

    repair() {
        if(this.readyToBeRepaired && this.health < this.maxHealth) {
            this.repairCount++;
            this.readyToBeRepaired = false;
            Sounds.playSound('windowrepair' + (1+Math.floor(Math.random()*3)));
            if(this.health <= 0) {
                this.newlyPlacedImmunity = true;
                setTimeout((function(){this.newlyPlacedImmunity = false;}).bind(this),2000);
            }
            this.health = Math.min(this.health + this.maxHealth/7, this.maxHealth);
            setTimeout((function(){this.readyToBeRepaired = true;}).bind(this),1200);

            return true;
        }
        return false;
    }
    getHitsLeft() {
        return Math.floor(this.health/20);
    }
}

class DoorInstance {
    constructor(id, graphics) {
        this.id = id;
        this.graphics = graphics || [];
        this.active = true;
        //{image, x, y, floor}
    }
}

class Raytrace {
    static castRay(p1, p2, floor = 0, range = 'na', requireWalkable = false) {
        //initialisation phase
        //identify which voxel in which the ray origin lies
        //set distance of ray
        var dist = 2000;
        if(range !== 'na') {
            dist = range;
        }

        var diff = Vector2D.sub(p2, p1);

        var m = diff.magnitude();

        var ratio = dist / m;
        diff.mult(ratio);
        p2.x = p1.x + diff.x;
        p2.y = p1.y + diff.y;


        var X = Math.floor(p1.x / tileSize);
        var Y = Math.floor(p1.y / tileSize);

        if(X < 0 || X > map.width - 1 || Y < 0 || Y > map.height - 1) {
            //exit early, start point outside of map :(
            return p1;
        }

        if(tiles[floor][Y][X].shootThrough == false) {
            return p1;
        }
        var endTileX = Math.floor(p2.x / tileSize);
        var endTileY = Math.floor(p2.y / tileSize);
        //TODO: if this is outside the grid we find the point in which the ray enters the grid and take the adjacent voxel
        var u = p1;
        var v = Vector2D.sub(p2, p1);

        v.normalize();

        //console.log(v);
        //ray: u + t.v
        var stepX = (v.x > 0 ? 1 : -1);
        if(v.x == 0) {
            stepX = 0;
        }
        var stepY = (v.y > 0 ? 1 : -1);
        if(v.y == 0) {
            stepY = 0;
        }
        // next we determine the value of t at which the ray crosses the first vertical voxel
        // boundary and store it in tMaxX, similar for tMaxY. The min of these tells us how far we need to travel
        // to reach the next voxel.


        var tMaxX = 0;
        if(stepX > 0) {
            tMaxX = ((X + 1) * tileSize - u.x) / v.x;
        }
        if(stepX < 0) {
            tMaxX = (X * tileSize - u.x) / v.x;
        }

        var tMaxY = 0;
        if(stepY > 0) {
            tMaxY = ((Y + 1) * tileSize - u.y) / v.y;
        }
        if(stepY < 0) {
            tMaxY = (Y * tileSize - u.y) / v.y;
        }

        // now compute how far along the ray, in units of t, we must move for the horiz/vert movement to
        // equal the width/height of a voxel

        var tDeltaX = Math.abs(tileSize / v.x);
        var tDeltaY = Math.abs(tileSize / v.y);
       
        var collisionPoint = new Vector2D();
        var allowedCollisions = 1;
        var currentCollisions = 0;
        while(!(X == endTileX) || !(Y == endTileY)) {
            if((tMaxX < tMaxY && Math.abs(tDeltaX) < Infinity) || Math.abs(tDeltaY) == Infinity) {
                tMaxX += tDeltaX;
                X += stepX;

                var stop = false;
                // console.log(X);
                if(X < tiles[floor][0].length && Y < tiles[floor].length && X >= 0 && Y >= 0) {
                    if(getTiles()[floor][Y][X].shootThrough == false) {
                        stop = true;
                    }
                    if(requireWalkable && getTiles()[floor][Y][X].walkable == false) {
                        stop = true;
                    }
                } else {
                    stop = true;
                }
                if(stop == true) {
                    currentCollisions++;
                    if(currentCollisions == allowedCollisions) {
                        // console.log('tile hit with stepx');
                        //hit a wall, stop and work out coordinates
                        //fix for a problem when step is negative    
                        var extra = (stepX < 0 ? 1 : 0);
                        collisionPoint.x = (X + extra) * tileSize;
                        // now work out y coordinate
                        // t dist is:
                        var t = (collisionPoint.x - u.x) / v.x;
                        //if(Math.abs(v.y)>10**10){v.y=0};
                        collisionPoint.y = u.y + t * v.y;
                        //scale up?
                        //collisionPoint.mult(tileSize);
                        return collisionPoint;
                    }
                }
            } else if(Math.abs(tDeltaY) < Infinity){
                tMaxY += tDeltaY;
                Y += stepY;
                var stop = false;
                if(X < tiles[floor][0].length && Y < tiles[floor].length && X >= 0 && Y >= 0) {
                    if(getTiles()[floor][Y][X].shootThrough == false) {
                        stop = true;
                    }
                    if(requireWalkable && getTiles()[floor][Y][X].walkable == false) {
                        stop = true;
                    }
                } else {
                    stop = true;
                }
                if(stop == true) {
                    currentCollisions++;
                    if(currentCollisions == allowedCollisions) {
                        //console.log('tile hit with stepy');
                        //fix for a problem when step is negative
                        var extra = (stepY < 0 ? 1 : 0);
                        collisionPoint.y = (Y + extra) * tileSize;
                        //work out X coordinate;
                        var t = (collisionPoint.y - u.y) / v.y;
                        //if(Math.abs(v.x)>10**10){v.x=0};
                        collisionPoint.x = u.x + t * v.x;
                        //scale up?
                        //collisionPoint.mult(tileSize);
                        return collisionPoint;
                    }
                }
            }
        }
        //no collision, return end point    
        return p2;
        // we want to loop until either we find a voxel with a non-empty object list or until
        // we fall out of the end of the grid.
    }

    static collideRayGeneral(p1, p2, objects, floor = 0) {
        //x(t) = (x1-x0)t + x0
        //y(t) = (y1-y0)t + y0
        // 0<t<1
        //circle equation is (x-h)**2 + (y-k)**2 = r**2
        var x0 = p1.x;
        var y0 = p1.y;
        var x1 = p2.x;
        var y1 = p2.y;

        var currentMinT = 1; //>1
        var collisionPosList = [];
        var collisionDists = [];
        var closestCollisionPos = -1;

        for(var i = 0; i < objects.length; i++) {
            if(objects[i].currentFloor == floor) {
                var h = objects[i].pos.x;
                var k = objects[i].pos.y;
                var r = objects[i].size;
                var qa = (x1 - x0) ** 2 + (y1 - y0) ** 2;
                var qb = 2 * (x1 - x0) * (x0 - h) + 2 * (y1 - y0) * (y0 - k);
                var qc = (x0 - h) ** 2 + (y0 - k) ** 2 - r ** 2;
                //check discriminant > 0
                if(qb ** 2 - 4 * qa * qc > 0) {
                    var checkt = (2 * qc) / (-qb + Math.sqrt(qb ** 2 - 4 * qa * qc));
                    if(checkt > 0 && checkt < 1) {
                        if(checkt < currentMinT) {
                            currentMinT = checkt;
                            closestCollisionPos = i;
                        }
                        collisionDists.push(checkt);
                        collisionPosList.push(i);
                    } else { //fix for if we are already intersecting an object
                        var checkt2 = (2 * qc) / (-qb - Math.sqrt(qb ** 2 - 4 * qa * qc));
                        if(checkt2 > 0 && checkt2 < 1) {
                            if(checkt2 < currentMinT) {
                                currentMinT = checkt2;
                                closestCollisionPos = i;
                            }
                            collisionDists.push(checkt2);
                            collisionPosList.push(i);
                        }

                    }


                }
            }
        }

        return {
            x0: x0,
            y0: y0,
            x1: x1,
            y1: y1,
            currentMinT: currentMinT,
            collisionPosList: collisionPosList,
            collisionDists: collisionDists
        };
    }

    static collideBullet(p1, p2, objects, floor = 0, owner) {

        var coll = Raytrace.collideRayGeneral(p1, p2, objects, floor);

        if(coll.collisionPosList.length > 0) {
            //objects[closestCollisionPos].pos.x = 200;
            //objects[closestCollisionPos].pos.y = 700;
            //sort collided object by increasing distance so the correct on is hit
            coll.collisionPosList = refSort(coll.collisionPosList, coll.collisionDists);
            var weaponPower = 1;
            for(var j = 0; j < coll.collisionPosList.length; j++) {

                //only play hit once to reduce lag
                if(j == 0) {
                    Sounds.playSound('zombiehit');
                }
                // canvasBuffer.getContext('2d').globalAlpha = 0.3;

                //draw blood
                // bufferctx.globalCompositeOperation = 'darken'; //multiply gets too dark
                //  bufferctx.fillStyle = '#AA2222';
                drawBloodAt(objects[coll.collisionPosList[j]].pos.x, objects[coll.collisionPosList[j]].pos.y, objects[coll.collisionPosList[j]].currentFloor);

                // canvasBuffer.getContext('2d').globalAlpha = 1;
                // bufferctx.globalCompositeOperation = 'source-over';
                objects[coll.collisionPosList[j]].takeDamage(owner, weaponPower);


                weaponPower *= owner.weapon.penetrationMult;
                if(owner.weapon.penetration == 'na') {
                    j = coll.collisionPosList.length;
                } else {
                    coll.currentMinT = 1;
                }

            }

        }
        var finalRay = new Vector2D();
        finalRay.x = coll.x0 + coll.currentMinT * (coll.x1 - coll.x0);
        finalRay.y = coll.y0 + coll.currentMinT * (coll.y1 - coll.y0);
        return finalRay;
    }

    static collideList(p1, p2, objects, floor = 0) {
        var coll = Raytrace.collideRayGeneral(p1, p2, objects, floor);
        return refSort(coll.collisionPosList, coll.collisionDists);
    }

    /* static collideBullet(p1,p2,objects,floor=0,owner) {
         //x(t) = (x1-x0)t + x0
         //y(t) = (y1-y0)t + y0
         // 0<t<1
         //circle equation is (x-h)**2 + (y-k)**2 = r**2
         var x0 = p1.x;
         var y0 = p1.y;
         var x1 = p2.x;
         var y1 = p2.y;
         var currentMinT = 1; //>1
         var collisionPosList = [];
         var collisionDists = [];
         var closestCollisionPos = -1;

         for(var i = 0; i < objects.length; i++){
             if(objects[i].currentFloor == floor){
             var h = objects[i].pos.x;
             var k = objects[i].pos.y;
             var r = objects[i].size;
             var qa = (x1-x0)**2 + (y1-y0)**2;
             var qb = 2*(x1-x0)*(x0-h) + 2*(y1-y0)*(y0-k);
             var qc = (x0-h)**2 + (y0-k)**2-r**2;
             //check discriminant > 0
             if(qb**2-4*qa*qc > 0){
                 var checkt = (2*qc)/(-qb + Math.sqrt(qb**2-4*qa*qc));
                 if(checkt > 0 && checkt < 1){
                     if(checkt<currentMinT){
                          currentMinT = checkt;
                          closestCollisionPos = i;
                     }
                     collisionDists.push(checkt);
                     collisionPosList.push(i);
                 }
                 else{//fix for if we are already intersecting an object
                     var checkt2 = (2*qc)/(-qb - Math.sqrt(qb**2-4*qa*qc));
                     if(checkt2 > 0 && checkt2 < 1){
                     if(checkt2<currentMinT){
                          currentMinT = checkt2;
                          closestCollisionPos = i;
                     }
                     collisionDists.push(checkt2);
                     collisionPosList.push(i);
                 }
                 
                 }
                    
                 
                     }
             }
         }

         if(closestCollisionPos>=0){
             //objects[closestCollisionPos].pos.x = 200;
             //objects[closestCollisionPos].pos.y = 700;
            //sort collided object by increasing distance so the correct on is hit
             collisionPosList = refSort(collisionPosList,collisionDists);
             var weaponPower = 1;
             for(var j = 0; j<collisionPosList.length;j++){
                 
                 //only play hit once to reduce lag
             if(j==0){   

              Sounds.playSound('zombiehit');}
                // canvasBuffer.getContext('2d').globalAlpha = 0.3;
               
                 //draw blood
               // bufferctx.globalCompositeOperation = 'darken'; //multiply gets too dark
               //  bufferctx.fillStyle = '#AA2222';
                 drawBloodAt(objects[collisionPosList[j]].pos.x,objects[collisionPosList[j]].pos.y,objects[collisionPosList[j]].currentFloor);
               
               // canvasBuffer.getContext('2d').globalAlpha = 1;
                       // bufferctx.globalCompositeOperation = 'source-over';
                objects[collisionPosList[j]].takeDamage(owner,weaponPower);


                 weaponPower *= owner.weapon.penetrationMult;
                 if(owner.weapon.penetration=='na'){j=collisionPosList.length;}
                 else{currentMinT=1;}

             }
             
         }
         var finalRay = new Vector2D();
         finalRay.x = x0 + currentMinT*(x1-x0);
         finalRay.y = y0 + currentMinT*(y1-y0);
         return finalRay;
     }*/
}

class Camera {

    constructor() {
        this.floor = 0;
        this.x = 0;
        this.y = 0;
        this.bounds = {};
        this.prevxs = [0,0,0,0];
        this.prevys = [0,0,0,0];
    }
    follow(obj,p) {
        //this.x = obj.pos.x - w / 2;
        //this.y = obj.pos.y - h / 2;
        this.x = this.prevxs[p];
        this.y = this.prevys[p];
        //want smooth panning to borders so will do some horrible code duplication to bound the target position
        var targx = obj.pos.x - w / 2;
        var targy = obj.pos.y - h / 2;

        if(targx > (this.bounds.x + this.bounds.w) * tileSize - w) {
            targx = (this.bounds.x + this.bounds.w) * tileSize - w;
        }
        if(targx < this.bounds.x * tileSize) {
            targx = this.bounds.x * tileSize;
        }

        if(targy > (this.bounds.y + this.bounds.h) * tileSize - h) {
            targy = (this.bounds.y + this.bounds.h) * tileSize - h;
        }
        if(targy < this.bounds.y * tileSize) {
            targy = this.bounds.y * tileSize;
        }


        this.x += 0.04*((targx)-this.x);
        this.y += 0.04*((targy)-this.y);
        this.floor = obj.currentFloor;
        this.prevxs[p] = this.x;
        this.prevys[p] = this.y;
        this.constrainBounds();
    }
    setBoundingRect(rect) {
        this.bounds = rect;
    }
    constrainBounds() {

        if(this.x > (this.bounds.x + this.bounds.w) * tileSize - w) {
            this.x = (this.bounds.x + this.bounds.w) * tileSize - w;
        }
        if(this.x < this.bounds.x * tileSize) {
            this.x = this.bounds.x * tileSize;
        }

        if(this.y > (this.bounds.y + this.bounds.h) * tileSize - h) {
            this.y = (this.bounds.y + this.bounds.h) * tileSize - h;
        }
        if(this.y < this.bounds.y * tileSize) {
            this.y = this.bounds.y * tileSize;
        }
        // this.x = Math.floor(this.x);
        // this.y = Math.floor(this.y);
    }
}



class ProximityAction {
    constructor() {
        this.pos = new Vector2D();
        // this.radius = 0;
        this.tooltip = '';
        this.singleUse = false;
        this.price = 0;
        this.reward = 0;
        this.type = '';
        this.gunName = '';
        // this.floor = 0;
        this.doorCoords = [];
        this.teleportConditions = {};
        this.triggers = [];
        this.customFunction = function() {};
        this.tooltipFunction = function() {return "";};

        this.id = '';
        this.windowId = '';
        this.doorId = '';

        //this.id = '';
    }
    setTeleportDestination(f, x = 0, y = 0, relative = true) {
        this.teleportConditions = {
            floor: f,
            x: x,
            y: y,
            relative: relative
        };
    }
    /*setId(id){
        this.id = id;
    }
    setFloor(f){
        this.floor = f;
    }
    setPos(x,y){
        this.pos  = new Vector2D(x,y);
    }
    setRadius(r){
        this.radius  = r;
    }*/
    setTooltip(str) {
        this.tooltip = str;
    }
    setSingleUse(bool) {
        this.singleUse = bool;
    }
    setPrice(p) {
        this.price = p;
    }
    setGunName(n) {
        this.setType('gun');
        this.gunName = n;
    }
    setType(t) {
        this.type = t;
        if(t == 'window') {
            this.tooltipFunction = function() {
                    return " (" + getMapClass().getWindowById(this.windowId).getHitsLeft() + "/7)";
            };
            this.customFunction = function() {
            return getMapClass().getWindowById(this.windowId).repair();
            };
        }
    }
    addDoorCoord(x, y, f, type = ',') {
        this.doorCoords.push({
            x: x,
            y: y,
            floor: f,
            type: type
        });

    }
    addTrigger(x, y, f, r) {
        this.triggers.push({
            pos: new Vector2D(x, y),
            floor: f,
            radius: r
        });
    }
}

class Powerup {
    constructor(x,y,f) {
        this.pos = new Vector(x,y);
        this.floor = f;
        this.dropped = true;
        this.type = "";
        this.rotation = Math.random() * Math.PI * 0.5;
        this.lifeLeft = 30;
        this.timer = setInterval((function() {
            this.lifeLeft -= 0.25;
            if(this.lifeLeft == 0) {
                clearTimeout(this.timer);
                this.dropped = false;
            }
        }).bind(this),250);
        var r = Math.random();
        //r = 0.2;
        //carpenter should only spawn if there are 5 or more breached barricades
        var step = roundManager.getDestroyedBarricades() >= 5 ? 0.2 : 0.25;
        if(r < step) {this.type = '2xp';}
        else if(r < 2*step){this.type = 'ik';}
        else if(r < 3*step){this.type = 'nuke';}
        else if(r < 4*step){this.type = 'ma';}
        else {this.type = 'carpenter';}
    }

    activate() {
        this.dropped = false;
        roundManager.activatePowerup(this.type);
    }
}

class Maps {
    static getName(abbr) {
        var names = {ndu: "Nacht der Untöten",vkt: "Verrückt", test: "Test Map", five: "FIVE"};
        return names[abbr];
    }
    constructor() {
        this.maps = [];


        /// map ndu

    // 888b    888                   888      888             888                      888     888          888             888                      
    // 8888b   888                   888      888             888                      888     888          888             888                      
    // 88888b  888                   888      888             888                      888     888          888             888                      
    // 888Y88b 888  8888b.   .d8888b 88888b.  888888      .d88888  .d88b.  888d888     888     888 88888b.  888888  .d88b.  888888  .d88b.  88888b.  
    // 888 Y88b888     "88b d88P"    888 "88b 888        d88" 888 d8P  Y8b 888P"       888     888 888 "88b 888    d88""88b 888    d8P  Y8b 888 "88b 
    // 888  Y88888 .d888888 888      888  888 888        888  888 88888888 888         888     888 888  888 888    888  888 888    88888888 888  888 
    // 888   Y8888 888  888 Y88b.    888  888 Y88b.      Y88b 888 Y8b.     888         Y88b. .d88P 888  888 Y88b.  Y88..88P Y88b.  Y8b.     888  888 
    // 888    Y888 "Y888888  "Y8888P 888  888  "Y888      "Y88888  "Y8888  888          "Y88888P"  888  888  "Y888  "Y88P"   "Y888  "Y8888  888  888 
                                                                                                                                                  
  

        this.maps['ndu'] = {
            width: 40,
            height: 29,
            floors: 2,
            floor: [{
                data:   '........................................' +
                        '.......FFFF.............................' +
                        '...........FF...........FFF.............' +
                        '.............F.........F................' +
                        '..............F.......F.................' +
                        '..............F......F..................' +
                        '............A.F..A....F.A...............' +
                        '..........XXWXXXXWXXXXXFWXXXXXXXXXXXXX..' +
                        '..FFF.....X,,,,X,,,,,,,,,,X----XXXXX-X..' +
                        '.....FFFFFX,,,,X,,,,,,,,,,X----X---XDX..' +
                        '..........X,,,,,,,,,,,,,,,D----------X..' +
                        '..........X,,,,,,X-XX,X,X,X--------XXX..' +
                        '.........AW,,,,,,XD-X,,,,,X--------XXX..' +
                        '..........XXXXXWXXXXXXXXXXXX-------XXXXX' +
                        '.........F.....A...XX.,,XXXX-------WA...' +
                        '........F........FFXX.XXXX.X---X---WA...' +
                        '.......F.......FF......F...X-------XX...' +
                        '......F.......FF......F...AW-------XX...' +
                        '.....F.......F.......F.....X---X---XX...' +
                        '............F.......F...FFFX-------XX...' +
                        '...........................X-------XX...' +
                        '..........................AW---X---XXXXX' +
                        '...........................X-------X....' +
                        '...........................XXXXXXWXX....' +
                        '..............................FF.A.F....' +
                        '.............................F.....F....' +
                        '.............................F.....F....' +
                        '............................F.......F...' +
                        '........................................'
                },

                {
                    data: '                                        ' +
                        '                                        ' +
                        '                                        ' +
                        '                                        ' +
                        '                                        ' +
                        '                                        ' +
                        '                                        ' +
                        '          XXXXXXXXXXXXXXXXXXXXXXXXXXXX  ' +
                        '          XXX  X,,,,,,,,,,X----------X  ' +
                        '          X    XB,,,,,,,,,X--------XDX  ' +
                        '          X    XBBB,,,,,,,,--------XBX  ' +
                        '          XX   XBBB,,,,,,,X--------XXX  ' +
                        '          XXX  XBBD-,,,,,,X--------XXX  ' +
                        '          XXXXXXXXXXWXXXXXXX-------X    ' +
                        '                  F,ABVV,FAW-------X    ' +
                        '                  F,,,,,,F,X---X---X    ' +
                        '                  FFFFFFFF X-------X    ' +
                        '                           X-------WA   ' +
                        '                           X---X---X    ' +
                        '                           X-------XFFFF' +
                        '                           X---X-XXX    ' +
                        '                           X---X---WA   ' +
                        '                           X-------X    ' +
                        '                           XXXXXXWXX    ' +
                        '                                        ' +
                        '                                        ' +
                        '                                        ' +
                        '                                        ' +
                        '                                        '
                }
            ]
        };
        this.maps['ndu'].actions = [];
        this.maps['ndu'].teleportPoints = [];
        this.maps['ndu'].spawnPoints = [];
        this.maps['ndu'].windows = [];
        this.maps['ndu'].doors = [];
        this.maps['ndu'].powerups = [];
        this.maps['ndu'].zombieSpawns = [{x:288,y:24,f:0,enabled:true},
                                         {x:384,y:24,f:0,enabled:true},
                                         {x:576,y:8,f:0,enabled:true},
                                         {x:896,y:32,f:0,enabled:true},
                                         {x:64,y:392,f:0,enabled:true},
                                         {x:88,y:744,f:0,enabled:true},
                                         {x:368,y:912,f:0,enabled:true},
                                         //help room
                                         {x:1300,y:630,f:0,enabled:false},
                                         {x:1060,y:950,f:0,enabled:false}];
        this.maps['ndu'].spawnPoints.push({
            x: 22.5 * tileSize,
            y: 9.5 * tileSize,
            floor: 0
        });
        this.maps['ndu'].spawnPoints.push({
            x: 12.5 * tileSize,
            y: 9.5 * tileSize,
            floor: 0
        });
        this.maps['ndu'].spawnPoints.push({
            x: 14.5 * tileSize,
            y: 11.5 * tileSize,
            floor: 0
        });
        this.maps['ndu'].spawnPoints.push({
            x: 23.5 * tileSize,
            y: 12.5 * tileSize,
            floor: 0
        });

        //windows - floor 0
        this.maps['ndu'].windows.push(new WindowInstance('1'));
        var act = new ProximityAction();
        act.windowId = '1';
        act.reward = 10;
        act.addTrigger(12.5 * tileSize, 7.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('2'));
        var act = new ProximityAction();
        act.windowId = '2';
        act.reward = 10;
        act.addTrigger(17.5 * tileSize, 7.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);


        this.maps['ndu'].windows.push(new WindowInstance('3'));
        var act = new ProximityAction();
        act.windowId = '3';
        act.reward = 10;
        act.addTrigger(24.5 * tileSize, 7.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('4'));
        var act = new ProximityAction();
        act.windowId = '4';
        act.reward = 10;
        act.addTrigger(35.5 * tileSize, 14.5 * tileSize, 0, tileSize/2);
        act.addTrigger(35.5 * tileSize, 15.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('5'));
        var act = new ProximityAction();
        act.windowId = '5';
        act.reward = 10;
        act.addTrigger(33.5 * tileSize, 23.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('6'));
        var act = new ProximityAction();
        act.windowId = '6';
        act.reward = 10;
        act.addTrigger(27.5 * tileSize, 21.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('7'));
        var act = new ProximityAction();
        act.windowId = '7';
        act.reward = 10;
        act.addTrigger(27.5 * tileSize, 17.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('8'));
        var act = new ProximityAction();
        act.windowId = '8';
        act.reward = 10;
        act.addTrigger(15.5 * tileSize, 13.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('9'));
        var act = new ProximityAction();
        act.windowId = '9';
        act.reward = 10;
        act.addTrigger(10.5 * tileSize, 12.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);


        //windows - floor 1
        this.maps['ndu'].windows.push(new WindowInstance('10'));
        var act = new ProximityAction();
        act.windowId = '10';
        act.reward = 10;
        act.addTrigger(35.5 * tileSize, 17.5 * tileSize, 1, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('11'));
        var act = new ProximityAction();
        act.windowId = '11';
        act.reward = 10;
        act.addTrigger(35.5 * tileSize, 21.5 * tileSize, 1, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('12'));
        var act = new ProximityAction();
        act.windowId = '12';
        act.reward = 10;
        act.addTrigger(27.5 * tileSize, 14.5 * tileSize, 1, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);

        this.maps['ndu'].windows.push(new WindowInstance('13'));
        var act = new ProximityAction();
        act.windowId = '13';
        act.reward = 10;
        act.addTrigger(20.5 * tileSize, 13.5 * tileSize, 1, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['ndu'].actions.push(act);


        //if this is our map, block windows that shouldn't be accessed at the start
        if(MAP_NAME == 'ndu'){
            this.setTileType('F',35,14,0,'N');
            this.setTileType('F',35,15,0,'N');
            this.setTileType('F',33,23,0,'N');
            this.setTileType('F',27,21,0,'N');
            this.setTileType('F',27,17,0,'N'); 
        }

        //help room door
        var act = new ProximityAction();
        act.addTrigger(26.5 * tileSize, 10.5 * tileSize, 0, tileSize);
        act.setTooltip('Open door [$1000]');
        act.price = 1000;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'help_door';
        act.addDoorCoord(26, 10, 0);
        //allow zombie pathing to help room
        act.customFunction = function() {
            getMapClass().setTileType('W',35,14,0);
            getMapClass().setTileType('W',35,15,0);
            getMapClass().setTileType('W',33,23,0);
            getMapClass().setTileType('W',27,21,0);
            getMapClass().setTileType('W',27,17,0); 
            //help room spawns
            getMap().zombieSpawns[7].enabled = true;
            getMap().zombieSpawns[8].enabled = true;
        }
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].doors.push(new DoorInstance('help_door', [{image: Images.door_small, x: 26 * tileSize, y: 10 * tileSize, floor: 0}]));

        //start stairs door
        var act = new ProximityAction();
        act.addTrigger(18.5 * tileSize, 12 * tileSize, 0, .5 * tileSize);
        act.addTrigger(19 * tileSize, 12.5 * tileSize, 1, .5 * tileSize);
        act.setTooltip('Clear Stairs [$1000]');
        act.price = 1000;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'ascend_stairs_door';
        act.addDoorCoord(18, 12, 0, '-');
        act.addDoorCoord(18, 12, 1, 'V');
        act.customFunction = function() {
            //help room spawns
            getMap().zombieSpawns[7].enabled = true;
            getMap().zombieSpawns[8].enabled = true;
        }
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].doors.push(new DoorInstance('ascend_stairs_door', [{image: Images.door_small, x: 18 * tileSize, y: 12 * tileSize, floor: 0},
                                                                            {image: Images.door_small, x: 18 * tileSize, y: 12 * tileSize, floor: 1}]));


        //help room stairs door
        var act = new ProximityAction();
        act.addTrigger(36.5 * tileSize, 10 * tileSize, 0, .5 * tileSize);
        act.addTrigger(36.5 * tileSize, 9 * tileSize, 1, .5 * tileSize);
        act.setTooltip('Clear Stairs [$1000]');
        act.price = 1000;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'help_stairs_door';
        act.addDoorCoord(36, 9, 0, '-');
        act.addDoorCoord(36, 9, 1, 'V');
        //allow zombie pathing to help room
        act.customFunction = function() {
            getMapClass().setTileType('W',35,14,0);
            getMapClass().setTileType('W',35,15,0);
            getMapClass().setTileType('W',33,23,0);
            getMapClass().setTileType('W',27,21,0);
            getMapClass().setTileType('W',27,17,0); 
        }
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].doors.push(new DoorInstance('help_stairs_door', [{image: Images.door_small, x: 36 * tileSize, y: 9 * tileSize, floor: 0},
                                                                            {image: Images.door_small, x: 36 * tileSize, y: 9 * tileSize, floor: 1}]));


        act = new ProximityAction();
        act.addTrigger(20.5 * tileSize, 8 * tileSize, 0, .75 * tileSize);
        act.setTooltip('Buy Kar98k [$500]');
        act.price = 500;
        act.setGunName('Kar98k')
        this.maps['ndu'].actions.push(act);

        act = new ProximityAction();
        act.addTrigger(35 * tileSize, 20.5 * tileSize, 0, .75 * tileSize);
        act.setTooltip('Buy M1 Thompson [$1200]');
        act.setGunName('M1Thompson');
        act.price = 1200;
        this.maps['ndu'].actions.push(act);

        act = new ProximityAction();
        act.addTrigger(30 * tileSize, 23 * tileSize, 0, .75 * tileSize);
        act.setTooltip('Buy Double-Barreled Shotgun [$1200]');
        act.setGunName('doublebarreled');
        act.price = 1200;
        this.maps['ndu'].actions.push(act);

        act = new ProximityAction();
        act.addTrigger(15 * tileSize, 9.5 * tileSize, 0, .5 * tileSize);
        act.setGunName('M1Carbine');
        act.setTooltip('Buy M1 Carbine [$750]');
        act.price = 750;
        this.maps['ndu'].actions.push(act);

        act = new ProximityAction();
        act.addTrigger(28.5 * tileSize, 9.5 * tileSize, 0, .5 * tileSize);
        act.setTooltip('Open Mystery Box [$950]');
        act.setType('mysteryboxbuy');
        act.price = 950;
        act.id = 'mb1';
        this.maps['ndu'].actions.push(act);

        act = new ProximityAction();
        act.addTrigger(28.5 * tileSize, 9.5 * tileSize, 0, 0);
        act.setTooltip('Pick up ');
        act.setType('mysteryboxgun');
        act.id = 'mb1gun';
        act.price = 0;
        this.maps['ndu'].actions.push(act);

        //help room stairs
        var act = new ProximityAction();
        act.addTrigger(36.5 * tileSize, 8.5 * tileSize, 0, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(1);
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })


        var act = new ProximityAction();
        act.addTrigger(36.5 * tileSize, 9.5 * tileSize, 1, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(0);
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })

        //outside stairs left
        var act = new ProximityAction();
        act.addTrigger(23.5 * tileSize, 14.5 * tileSize, 0, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(1);
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })


        var act = new ProximityAction();
        act.addTrigger(22.5 * tileSize, 14.5 * tileSize, 1, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(0);
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })

        //outside stairs right
        var act = new ProximityAction();
        act.addTrigger(26.5 * tileSize, 15 * tileSize, 0, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(1);
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })


        var act = new ProximityAction();
        act.addTrigger(26.5 * tileSize, 16 * tileSize, 1, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(0);
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })

        //start room stairs
        var act = new ProximityAction();
        act.addTrigger(19.5 * tileSize, 12.5 * tileSize, 0, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(1);
        this.maps['ndu'].actions.push(act);
        this.maps['ndu'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })


        var act = new ProximityAction();
        act.addTrigger(18.5 * tileSize, 12.5 * tileSize, 1, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(0);
        this.maps['ndu'].actions.push(act);
        //console.log(act.triggers[0].floor)
        this.maps['ndu'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })

        //

        //upstairs
        var act = new ProximityAction();
        act.addTrigger(36.5 * tileSize, 8 * tileSize, 1, .5 * tileSize);
        act.setTooltip('Buy BAR [$1800]');
        act.price = 1800;
        act.setGunName('BAR')
        this.maps['ndu'].actions.push(act);

        //vkt

    // 888     888                                            888      888    
    // 888     888                                            888      888    
    // 888     888                                            888      888    
    // Y88b   d88P  .d88b.  888d888 888d888 888  888  .d8888b 888  888 888888 
    //  Y88b d88P  d8P  Y8b 888P"   888P"   888  888 d88P"    888 .88P 888    
    //   Y88o88P   88888888 888     888     888  888 888      888888K  888    
    //    Y888P    Y8b.     888     888     Y88b 888 Y88b.    888 "88b Y88b.  
    //     Y8P      "Y8888  888     888      "Y88888  "Y8888P 888  888  "Y888 
                                                                       
                                                                       
                                                                       

        this.maps['vkt'] = {
            width: 80,
            height: 47,
            floors: 2,

            //80x80
            floor: [ //floor 0 
                {
                  data: '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '...................................XXXXXXXXXXXXXXXXXXXX.........................' +
                        '...................................XXXXXXXXXXXXXXXXXXXX.........................' +
                        '...................................XXXXXXXXXXXXXXXXXXXX.........................' +
                        '.............XXWXXXXXXX............XXXXXXXXXXXXXXXXXXXX.........................' +
                        '.............X,,,,X-D-X............XXXXXXXXXXXXXXXXXXXX.........................' +
                        '.............X,,,,X-XXXXXXXXX.......XXXXXXXXXXXXXXXXXXX.........................' +
                        '.............X,,,,X-X,,,,X,,X..X.X..XXXXXXXXXXXXXXXXXXX.........................' +
                        '.............X,,,,X,,,,,,X,,W.......XXXXXXXXXXXXXXXXXXX.........................' +
                        '.............X,,,,,,,,,,,,,,X.......XXXXXXXXXXXXXXXXXXX.........................' +
                        '........XXXXXX,,,,,,,,,,,XXXX..X.X..XXXXXXXXXXXXXXXXXXX.........................' +
                        '........X,,,,,,,,,X,,,,,,X.............XXX....X,,,,,,,X.........................' +
                        '........X,,,,,,,XXX,,,,,,W............XXXX..X.X,,,,,,,X.........................' +
                        '........W,,,,,,,,,,,,,,,,XXFXX........,,XX....W,,,,,,,X.........................' +
                        '........X,,,,,,,,,,,,,,,,F,,,X........XXXX..X.X,,,,,,-X.........................' +
                        '........X,,,,,,,,,X,,,,,,F,,,W................XXXXXXX-X.........................' +
                        '........X,,,,,,,,,X,,,,,,X,,,X............XXXXXXXXXX--X.........................' +
                        '........XXXXXXXXXXXXDDXXXX,,,F............XXXXXXXXXXXXXXXX......................' +
                        '........X,,,,,,,,,X,,,,,,X,,,X............XXXXXXXXXXXXXXXX......................' +
                        '........W,,,,,,,,,,,,,,,,,,,,F............XXXXXXXXXXXXXXXX......................' +
                        '........X,,,,,,,,,,,,,,,,,,,,X............XXXXXXXXXXXXXXXX......................' +
                        '........X,,,,,,,,,X,,,,,,X,,,F............XXXXXXXXXXXXXXXX......................' +
                        '........XXXXXXXDDXX,,,,,,X,,,X..............,,,,XXXXXXXXXX......................' +
                        '..............X,,,X,,,,,,XXFXX..............,,,,XXXXXXXXX.......................' +
                        '..............X,,,X,,,,,,W.................XXX,,XXXXXXXXX.......................' +
                        '..............X,,,X,,,,,,X................XXXX,,XXXXXXXXX.......................' +
                        '..............X,,,XXXDDXXXXFXFXWXFXFWXX...XXXXXXXXXXXXXXX.......................' +
                        '..............X,,,X,,,,,,,,,,,,,,,,,,,X.X.XXXXXXXXXXXXXXXX......................' +
                        '..............X,,,F,,,,,,,,,,,,,,,,,,,X...XXXXXXXXXXXXXXXX......................' +
                        '..............X,,,F,,,,,,,,,,,,,,,,XXXX...XXXXXXXXXXXXXXXX......................' +
                        '..............X,,,X,,,,,,,,,,,,,,,,---X.X.XXXXXXXXXXXXXXXX......................' +
                        '..............XXXXXXXX,,,X,,,XX,,,,---X...XXXXXXXXXXXXXXXX......................' +
                        '.....................X,,,,,,,,X,,,XXDDX...XXXXXXXXXXXXXX........................' +
                        '.....................W,,,,,,,,XXXXXX--X.X.XXXXXXXXXXXXXX........................' +
                        '.....................X,,,,,,,,XXXXXX--X...XXXXXXXXXXXXXX........................' +
                        '.....................XXXXXXXWXXXXXXXXXX...XXXXXXXXXXXXXX........................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................'
                },
                //floor 1
                {
                  data: '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '...............................XXWXXXXXXXXXXXXXXXXXXXXX.........................' +
                        '...............................X,,,,,,,,,,,,,,,,,,,,,,W.........................' +
                        '...............................X,,,,,,,,,,,,,,,,,,,,,,X.........................' +
                        '..................XXXXX......XXXXDDDXXXXXXXXXXXX,,,,XXX.........................' +
                        '..................XBD-XXXXXXXXX,,,,,,,F,,,,,,,,,,,,,,,X.........................' +
                        '.................XXBX-,,,,,,,,,,,,,,,,F,,,,,,,,,,,,,,,X.........................' +
                        '.................X,,,,,,,,,,,,,,,,,,,,F,,,,,,,,,,,,,,,X.........................' +
                        '.................X,,,,X,,,,,,,,,,,,,,,F,,,,,,,,,,,,,,,X.........................' +
                        '.................X,,,,XXXXXXXXXXX,,,XXXXXXXXXDDDXXXXXXX.........................' +
                        '.................X,,,,,,,,,,,,,,,,,,,,,,,,X,,,,,,,,,,,X.........................' +
                        '.................X,,,,,,,,,,,,,,,,,,,,,,,,X,,,,,,,,,,,X.........................' +
                        '.................XXXXXX,,XXXXXXXXXXXXXXXWXX,,,,,,,,,,,X.........................' +
                        '......................X,,X............V,,,X,,,,,,,,,,,X.........................' +
                        '......................XXXX................X,,,,,,,,,XBX.........................' +
                        '..........................................X,,,,,,,XXXVX.........................' +
                        '..........................................X,,,,,,,----X.........................' +
                        '..........................................XXXDDDXXXXXXXXXX......................' +
                        '..........................................X,,,,,,,,,X,,,,X......................' +
                        '..........................................X,,,,,,,,,,,,,,X......................' +
                        '..........................................X,,,,,,,,,,,,,,X......................' +
                        '..........................................XXXXXXX,,,X,,,,X......................' +
                        '.................XXWWXX.......................BBX,,,X,,,XX......................' +
                        '.................X,,,,X......................BVVX,,,X,,,X.......................' +
                        '.................X,,,,XXXXXXXXXXXXXXXXXXXXXXXXVVX,,,X,,,W.......................' +
                        '.................X,,,,,,,,,,,,,,,,,,,,,,,,W,,,,,X,,,X,,,X.......................' +
                        '.................X,,,,,,,,,,,,,,,,,,,,,,,,X,,,,,X,,,X,,,X.......................' +
                        '.................XXXXXXXXXXXXXXXXXXXX,,,XXXXXXXXXXXXXDDXXX......................' +
                        '....................XXXXXX,,,,,,,,,,,,,,,,X,,,,,,,,,,,,,,X......................' +
                        '....................X,,,,X,,,,,,,,,,,,,,,,D,,,,,,,,,,,,,,X......................' +
                        '....................X,,,,,,,,,,,,,,XBBX,,,D,,,,,,,,,,,,,,X......................' +
                        '....................X,,,,,,,,,,,,,,XVVX,,,XX,,XXXXX,,,XXXX......................' +
                        '....................X,,,,,,,,,,,,,XXDDX,,,X,,,,,,,,,,,,X........................' +
                        '....................W,,,,,,,,,,,,,----X,,,X,,,,,,,,,,,,X........................' +
                        '....................W,,,,,,,,,,,,,----X,,,X,,,,,,,,,,,,X........................' +
                        '....................X,,,,X,,,,,,,,XXXXX,,XXXXXXXXXXXXWXX........................' +
                        '....................X,,,,XXXXXXX,,,,,,,,,X......................................' +
                        '....................X,,,,X.....X,,,,,,,,,X......................................' +
                        '....................XXXXXX.....XXXXXXXXXXX......................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................' +
                        '................................................................................'
                }
            ]
        };

        this.maps['vkt'].teleportPoints = [];
        this.maps['vkt'].actions = [];
        this.maps['vkt'].spawnPoints = [];
        this.maps['vkt'].windows = [];
        this.maps['vkt'].powerups = [];
        this.maps['vkt'].doors = [];
        this.maps['vkt'].spawnPoints.push({
            x: 22.5 * tileSize,
            y: 24.5 * tileSize,
            floor: 0
        });
        this.maps['vkt'].spawnPoints.push({
            x: 23.5 * tileSize,
            y: 16.5 * tileSize,
            floor: 0
        });
        this.maps['vkt'].spawnPoints.push({
            x: 20.5 * tileSize,
            y: 26.5 * tileSize,
            floor: 0
        });
        this.maps['vkt'].spawnPoints.push({
            x: 20.5 * tileSize,
            y: 18.5 * tileSize,
            floor: 0
        });


        //actions
       
       //downstairs

       //windows
        this.maps['vkt'].windows.push(new WindowInstance('1'));
        var act = new ProximityAction();
        act.windowId = '1';
        act.reward = 10;
        act.addTrigger(15.5 * tileSize, 7.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('2'));
        var act = new ProximityAction();
        act.windowId = '2';
        act.reward = 10;
        act.addTrigger(8.5 * tileSize, 16.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('3'));
        var act = new ProximityAction();
        act.windowId = '3';
        act.reward = 10;
        act.addTrigger(8.5 * tileSize, 22.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('4'));
        var act = new ProximityAction();
        act.windowId = '4';
        act.reward = 10;
        act.addTrigger(21.5 * tileSize, 36.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('5'));
        var act = new ProximityAction();
        act.windowId = '5';
        act.reward = 10;
        act.addTrigger(28.5 * tileSize, 38.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('6'));
        var act = new ProximityAction();
        act.windowId = '6';
        act.reward = 10;
        act.addTrigger(31.5 * tileSize, 29.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('7'));
        var act = new ProximityAction();
        act.windowId = '7';
        act.reward = 10;
        act.addTrigger(36.5 * tileSize, 29.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('8'));
        var act = new ProximityAction();
        act.windowId = '8';
        act.reward = 10;
        act.addTrigger(25.5 * tileSize, 27.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('9'));
        var act = new ProximityAction();
        act.windowId = '9';
        act.reward = 10;
        act.addTrigger(29.5 * tileSize, 18.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('10'));
        var act = new ProximityAction();
        act.windowId = '10';
        act.reward = 10;
        act.addTrigger(25.5 * tileSize, 15.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('11'));
        var act = new ProximityAction();
        act.windowId = '11';
        act.reward = 10;
        act.addTrigger(28.5 * tileSize, 11.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('12'));
        var act = new ProximityAction();
        act.windowId = '12';
        act.reward = 10;
        act.addTrigger(46.5 * tileSize, 16.5 * tileSize, 0, tileSize/2);
        //act.debug = true;
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        //left room
        act = new ProximityAction();
        act.addTrigger(21 * tileSize, 20.5 * tileSize, 0, tileSize);
        act.setTooltip('Requires Power');
        act.price = Infinity;
        act.setType('tooltip');
        act.id = 'spawnDoorTooltip';
        this.maps['vkt'].actions.push(act);

        //left room
        act = new ProximityAction();
        act.addTrigger(25 * tileSize, 14 * tileSize, 0, .75 * tileSize);
        act.setTooltip('Buy Kar98k [$500]');
        act.price = 500;
        act.setGunName('Kar98k')
        this.maps['vkt'].actions.push(act);

        //right room
        act = new ProximityAction();
        act.addTrigger(17 * tileSize, 21 * tileSize, 0, .75 * tileSize);
        act.setTooltip('Buy Kar98k [$500]');
        act.price = 500;
        act.setGunName('Kar98k')
        this.maps['vkt'].actions.push(act);

        //right hallway
        act = new ProximityAction();
        act.addTrigger(32.5 * tileSize, 36 * tileSize, 0, .75 * tileSize);
        act.setTooltip('Buy M1 Thompson [$1000]');
        act.price = 1000;
        act.setGunName('M1Thompson')
        this.maps['vkt'].actions.push(act);

        //left room stairs
        var act = new ProximityAction();
        act.addTrigger(20.5 * tileSize, 8.5 * tileSize, 0, tileSize);
        act.addTrigger(20.5 * tileSize, 8.5 * tileSize, 1, tileSize);
        act.setTooltip('Clear Stairs [$1000]');
        act.price = 1000;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'north_stairs';
        act.addDoorCoord(20, 8, 0, '-');
        act.addDoorCoord(20, 8, 1, 'V');
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('north_stairs', [{image: Images.door_small, x: 20 * tileSize, y: 8 * tileSize, floor: 0},
                                                                      {image: Images.door_small, x: 20 * tileSize, y: 8 * tileSize, floor: 1}]));

        //up tp
        var act = new ProximityAction();
        act.addTrigger(21.5 * tileSize, 8.5 * tileSize, 0, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(1)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })
        //down tp
        var act = new ProximityAction();
        act.addTrigger(20.5 * tileSize, 8.5 * tileSize, 1, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(0)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })


        //right hallway
        var act = new ProximityAction();
        act.addTrigger(22 * tileSize, 29.5 * tileSize, 0, tileSize);
        act.setTooltip('Open door [$750]');
        act.price = 750;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'south_room';
        act.addDoorCoord(21, 29, 0);
        act.addDoorCoord(22, 29, 0);
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('south_room', [{image: Images.door_small, x: 21 * tileSize, y: 29 * tileSize, floor: 0},
                                                                    {image: Images.door_small, x: 22 * tileSize, y: 29 * tileSize, floor: 0}]));


        //right back room
        var act = new ProximityAction();
        act.addTrigger(16 * tileSize, 25.5 * tileSize, 0, tileSize);
        act.setTooltip('Open door [$750]');
        act.price = 750;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'pap_room'
        act.addDoorCoord(15, 25, 0);
        act.addDoorCoord(16, 25, 0);
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('pap_room', [{image: Images.door_small, x: 15 * tileSize, y: 25 * tileSize, floor: 0},
                                                                    {image: Images.door_small, x: 16 * tileSize, y: 25 * tileSize, floor: 0}]));


        var act = new ProximityAction();
        act.addTrigger(15 * tileSize, 32.5 * tileSize, 0, .75 * tileSize);
        act.setTooltip('Buy BAR [$1800]');
        act.price = 1800;
        act.setGunName('BAR')
        this.maps['vkt'].actions.push(act);

        //right hallway stairs
        var act = new ProximityAction();
        act.addTrigger(37 * tileSize, 35.5 * tileSize, 0, tileSize);
        act.addTrigger(37 * tileSize, 35.5 * tileSize, 1, tileSize);
        act.setTooltip('Clear Stairs [$1000]');
        act.price = 1000;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'south_room_stairs'
        act.addDoorCoord(36, 35, 0, '-');
        act.addDoorCoord(37, 35, 0, '-');
        act.addDoorCoord(36, 35, 1, '-');
        act.addDoorCoord(37, 35, 1, '-');
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('south_room_stairs', [{image: Images.door_small, x: 36 * tileSize, y: 35 * tileSize, floor: 0},
                                                                    {image: Images.door_small, x: 37 * tileSize, y: 35 * tileSize, floor: 0},
                                                                    {image: Images.door_small, x: 36 * tileSize, y: 35 * tileSize, floor: 1},
                                                                    {image: Images.door_small, x: 37 * tileSize, y: 35 * tileSize, floor: 1}]));


        //up tp
        var act = new ProximityAction();
        act.addTrigger(36.5 * tileSize, 35.5 * tileSize, 0, 0.5 * tileSize);
        act.addTrigger(37.5 * tileSize, 35.5 * tileSize, 0, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(1)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[1].pos.x,
            y: act.triggers[1].pos.y,
            floor: act.triggers[1].floor,
            destFloor: act.teleportConditions.floor
        })

        //down tp
        var act = new ProximityAction();
        act.addTrigger(36.5 * tileSize, 34.5 * tileSize, 1, 0.5 * tileSize);
        act.addTrigger(37.5 * tileSize, 34.5 * tileSize, 1, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(0)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[1].pos.x,
            y: act.triggers[1].pos.y,
            floor: act.triggers[1].floor,
            destFloor: act.teleportConditions.floor
        })

        //upstairs

        //windows
        this.maps['vkt'].windows.push(new WindowInstance('13'));
        var act = new ProximityAction();
        act.windowId = '13';
        act.reward = 10;
        act.addTrigger(33.5 * tileSize, 4.5 * tileSize, 1, tileSize/2);
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('14'));
        var act = new ProximityAction();
        act.windowId = '14';
        act.reward = 10;
        act.addTrigger(54.5 * tileSize, 5.5 * tileSize, 1, tileSize/2);
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('15'));
        var act = new ProximityAction();
        act.windowId = '15';
        act.reward = 10;
        act.addTrigger(56.5 * tileSize, 27.5 * tileSize, 1, tileSize/2);
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('16'));
        var act = new ProximityAction();
        act.windowId = '16';
        act.reward = 10;
        act.addTrigger(53.5 * tileSize, 38.5 * tileSize, 1, tileSize/2);
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('17'));
        var act = new ProximityAction();
        act.windowId = '17';
        act.reward = 10;
        act.addTrigger(20.5 * tileSize, 36.5 * tileSize, 1, tileSize/2);
        act.addTrigger(20.5 * tileSize, 37.5 * tileSize, 1, tileSize/2);
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);

        this.maps['vkt'].windows.push(new WindowInstance('18'));
        var act = new ProximityAction();
        act.windowId = '18';
        act.reward = 10;
        act.addTrigger(19.5 * tileSize, 25.5 * tileSize, 1, tileSize/2);
        act.addTrigger(20.5 * tileSize, 25.5 * tileSize, 1, tileSize/2);
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);    

        this.maps['vkt'].windows.push(new WindowInstance('19'));
        var act = new ProximityAction();
        act.windowId = '19';
        act.reward = 10;
        act.addTrigger(42.5 * tileSize, 28.5 * tileSize, 1, tileSize/2);
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);  

        this.maps['vkt'].windows.push(new WindowInstance('20'));
        var act = new ProximityAction();
        act.windowId = '20';
        act.reward = 10;
        act.addTrigger(40.5 * tileSize, 15.5 * tileSize, 1, tileSize/2);
        act.setTooltip('Repair barricade');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('window');
        this.maps['vkt'].actions.push(act);  

        //left door 1
        var act = new ProximityAction();
        act.addTrigger(34.5 * tileSize, 7.5 * tileSize, 1, tileSize);
        act.setTooltip('Open Door [$750]');
        act.price = 750;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'upstairs_left_door_1';
        act.addDoorCoord(33, 7, 1, ',');
        act.addDoorCoord(34, 7, 1, ',');
        act.addDoorCoord(35, 7, 1, ',');
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('upstairs_left_door_1', [{image: Images.door_small, x: 33 * tileSize, y: 7 * tileSize, floor: 1},
                                                                              {image: Images.door_small, x: 34 * tileSize, y: 7 * tileSize, floor: 1},
                                                                              {image: Images.door_small, x: 35 * tileSize, y: 7 * tileSize, floor: 1}]));
        //power room door left
        var act = new ProximityAction();
        act.addTrigger(46.5 * tileSize, 12.5 * tileSize, 1, tileSize);
        act.setTooltip('Open Door [$750]');
        act.price = 750;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'left_power_room_door';
        act.addDoorCoord(45, 12, 1, ',');
        act.addDoorCoord(46, 12, 1, ',');
        act.addDoorCoord(47, 12, 1, ',');
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('left_power_room_door', [{image: Images.door_small, x: 45 * tileSize, y: 12 * tileSize, floor: 1},
                                                                              {image: Images.door_small, x: 46 * tileSize, y: 12 * tileSize, floor: 1},
                                                                              {image: Images.door_small, x: 47 * tileSize, y: 12 * tileSize, floor: 1}]));

        //power room door right
        var act = new ProximityAction();
        act.addTrigger(46.5 * tileSize, 20.5 * tileSize, 1, tileSize);
        act.setTooltip('Open Door [$750]');
        act.price = 750;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'right_power_room_door';
        act.addDoorCoord(45, 20, 1, ',');
        act.addDoorCoord(46, 20, 1, ',');
        act.addDoorCoord(47, 20, 1, ',');
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('right_power_room_door', [{image: Images.door_small, x: 45 * tileSize, y: 20 * tileSize, floor: 1},
                                                                               {image: Images.door_small, x: 46 * tileSize, y: 20 * tileSize, floor: 1},
                                                                               {image: Images.door_small, x: 47 * tileSize, y: 20 * tileSize, floor: 1}]));

        //turning on the power (open spawn door)
        //make a new decal layer with lighting?
        var act = new ProximityAction();
        act.addTrigger(43.25 * tileSize, 16.3 * tileSize, 1, 0.75 * tileSize);
        act.setTooltip('Turn Power On');
        act.price = 0;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'power_door';
        act.addDoorCoord(20, 20, 0, ',');
        act.addDoorCoord(21, 20, 0, ',');
        act.customFunction = function() {
            getActionsById('spawnDoorTooltip')[0].triggers[0].radius = 0;
        }
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('power_door', [{image: Images.door_small, x: 20 * tileSize, y: 20 * tileSize, floor: 0},
                                                                    {image: Images.door_small, x: 21 * tileSize, y: 20 * tileSize, floor: 0}]));



        //right door 2
        var act = new ProximityAction();
        act.addTrigger(54 * tileSize, 30.5 * tileSize, 1, tileSize);
        act.setTooltip('Open Door [$1000]');
        act.price = 1000;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'upstairs_right_door_2';
        act.addDoorCoord(53, 30, 1, ',');
        act.addDoorCoord(54, 30, 1, ',');
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('upstairs_right_door_2', [{image: Images.door_small, x: 53 * tileSize, y: 30 * tileSize, floor: 1},
                                                                               {image: Images.door_small, x: 54 * tileSize, y: 30 * tileSize, floor: 1}]));

        //right door 1
        var act = new ProximityAction();
        act.addTrigger(42.5 * tileSize, 33 * tileSize, 1, tileSize);
        act.setTooltip('Open Door [$750]');
        act.price = 750;
        act.setSingleUse(true);
        act.setType('door');
        act.doorId = 'upstairs_right_door_1';
        act.addDoorCoord(42, 32, 1, ',');
        act.addDoorCoord(42, 33, 1, ',');
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].doors.push(new DoorInstance('upstairs_right_door_1', [{image: Images.door_small, x: 42 * tileSize, y: 32 * tileSize, floor: 1},
                                                                               {image: Images.door_small, x: 42 * tileSize, y: 33 * tileSize, floor: 1}]));


        //outside

        //outside courtyard stairs 1
        //up tp
        var act = new ProximityAction();
        act.addTrigger(39.5 * tileSize, 16.5 * tileSize, 0, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(1)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })
        //down tp
        var act = new ProximityAction();
        act.addTrigger(38.5 * tileSize, 16.5 * tileSize, 1, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(0)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })

        //outside courtyard stairs 2
        //up tp
        var act = new ProximityAction();
        act.addTrigger(53.5 * tileSize, 19.5 * tileSize, 0, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(1)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })
        //down tp
        var act = new ProximityAction();
        act.addTrigger(53.5 * tileSize, 18.5 * tileSize, 1, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(0)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })

        //outside courtyard big stairs 3
        //up tp
        var act = new ProximityAction();
        act.addTrigger(46.5 * tileSize, 28.5 * tileSize, 0, 0.5 * tileSize);
        act.addTrigger(47.5 * tileSize, 28.5 * tileSize, 0, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(1)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[1].pos.x,
            y: act.triggers[1].pos.y,
            floor: act.triggers[1].floor,
            destFloor: act.teleportConditions.floor
        })

        //down tp
        var act = new ProximityAction();
        act.addTrigger(46.5 * tileSize, 27.5 * tileSize, 1, 0.5 * tileSize);
        act.addTrigger(47.5 * tileSize, 27.5 * tileSize, 1, 0.5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setType('teleport');
        act.setTeleportDestination(0)
        this.maps['vkt'].actions.push(act);
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })
        this.maps['vkt'].teleportPoints.push({
            x: act.triggers[1].pos.x,
            y: act.triggers[1].pos.y,
            floor: act.triggers[1].floor,
            destFloor: act.teleportConditions.floor
        })


        //FIVE
    // 8888888888 d8b                   
    // 888        Y8P                   
    // 888                              
    // 8888888    888 888  888  .d88b.  
    // 888        888 888  888 d8P  Y8b 
    // 888        888 Y88  88P 88888888 
    // 888        888  Y8bd8P  Y8b.     
    // 888        888   Y88P    "Y8888  

        this.maps['five'] = {
            width: 32,
            height: 32,
            floors: 1,
            floor: [{
                   data:',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,' +
                        ',,,,,,XXX,,,,,,,,,X,,,,,,,,,,,,,' +
                        ',,,,,,XFF,,XX,,,,,X,,XXXX,,,,,,,' +
                        ',,,,,,XF,,,,X,,,,,X,,XF,,,,,,,,,' +
                        ',,,,,,X,,,,,XFFFF,X,,X,,,,,,,,,,' +
                        ',,,,,,X,,,,,XFFFF,X,,X,XX,,,,,,,' +
                        ',,,,,,XWXXXXXXXXXWXXXXWXXXXX,,,,' +
                        ',,,,,,X-----------------X,,X,,,,' +
                        ',,,,,,X-----X------------,,X,,,,' +
                        ',,,,,,X-----------------X,,X,,,,' +
                        ',,,,,,XX-XFFFFX-XXXXFFXWXXXX,,,,' +
                        ',,,,,,X,,,,,,,,,,,,X,,X---X,,,,,' +
                        ',,,,,,W,,,,,,,,,,,,W,,X---X,,,,,' +
                        ',,,,,,X,FF,,FFFF,X,X,,XX--X,,,,,' +
                        ',,,,,,X,FF,,FFFF,,,X,,,,--X,,,,,' +
                        ',,,,,,X,FF,,FFFF,,,X,,,,--X,,,,,' +
                        ',,,,,,X,FF,,FFF,,,,X,,,,--X,,,,,' +
                        ',,,,,,X,FF,,FFF,,,,X,,,,--X,,,,,' +
                        ',,,,,,X,FF,,FFF,,,,X,,,,--X,,,,,' +
                        ',,,,,,X,,F,,FFF,,X,X,,,,--X,,,,,' +
                        ',,,,,,W,,,,,,,,,,,,W,,,,--,,,,,,' +
                        ',,,,,,X,,,,,,,,,,,,X,,,,--,,,,,,' +
                        ',,,,,XXXX-XFFFFFX-XXX,,,--,,,,,,' + 
                        ',,,,,,,X------------X,,,--,,,,,,' +
                        ',,,,,,,X--------X---X,,,--,,,,,,' +
                        ',,,,,,,X------------X,,,--,,,,,,' +
                        ',,,,,,,XXWXXXXXXXXWXX,,,--,,,,,,' +
                        ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,' +
                        ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,' +
                        ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,' +
                        ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,' +
                        ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,'
                }/*,

                {
                   data:'........................................' +
                        '........................................' +
                        '........................................' +
                        '........................................' +
                        '........................................' +
                        '........................................' +
                        '........................................' +
                        '..........XXXXXXXXXXXXXXXXXXXXXXXXXXXX..' +
                        '..........XXX..X,,,,,,,,,,X----------X..' +
                        '..........X....XB,,,,,,,,,X--------XDX..' +
                        '..........X....XBBB,,,,,,,,--------XBX..' +
                        '..........XX...XBBB,,,,,,,X--------XXX..' +
                        '..........XXX..XBBD-,,,,,,X--------XXX..' +
                        '..........XXXXXXXXXXWXXXXXXX-------X....' +
                        '...................,,BVV,,,W-------X....' +
                        '...................,,,,,,,,X---X---X....' +
                        '...........................X-------X....' +
                        '...........................X-------W....' +
                        '...........................X---X---X....' +
                        '...........................X-------X....' +
                        '...........................X---X-XXX....' +
                        '...........................X---X---W....' +
                        '...........................X-------X....' +
                        '...........................XXXXXXWXX....' +
                        '........................................' +
                        '........................................' +
                        '........................................' +
                        '........................................' +
                        '........................................'
                }*/
            ]
        };
        this.maps['five'].actions = [];
        this.maps['five'].teleportPoints = [];
        this.maps['five'].spawnPoints = [];
        this.maps['five'].windows = [];
        this.maps['five'].powerups = [];
        this.maps['five'].doors = [];
        this.maps['five'].spawnPoints.push({
            x: 22.5 * tileSize,
            y: 9.5 * tileSize,
            floor: 0
        });



        //test map

        this.maps['test'] = {
            width: 20,
            height: 15,
            floors: 2,
            floor: [{
                    data: '....................' +
                        '....................' +
                        '....................' +
                        '....................' +
                        '......XXFXFXXXX.....' +
                        '......F,,,,,,,X.....' +
                        '...XWXX,,,,,,,X.....' +
                        '...F..W,,,,,,,X.....' +
                        '...XXXX,,,,,FFX.....' +
                        '......F,,,,,--X.....' +
                        '......XXFXFXXXX.....' +
                        '....................' +
                        '....................' +
                        '....................' +
                        '....................'
                },
                {
                    data: '....................' +
                        '....................' +
                        '....................' +
                        '....................' +
                        '......XXXXXXXXX.....' +
                        '......F,,,,,,,X.....' +
                        '...XXXX,,,,,,,X.....' +
                        '...XXXX,,,,,,,X.....' +
                        '...XXXX,,,,XX-X.....' +
                        '......F,,,,X--X.....' +
                        '......XXFXFXXXX.....' +
                        '....................' +
                        '....................' +
                        '....................' +
                        '....................'
                }
            ]
        };

        this.maps['test'].actions = [];
        this.maps['test'].teleportPoints = [];
        this.maps['test'].spawnPoints = [];
        this.maps['test'].windows = [];
        this.maps['test'].spawnPoints.push({
            x: 11.5 * tileSize,
            y: 7.5 * tileSize,
            floor: 0
        });
        var act = new ProximityAction();
        act.addTrigger(13.5 * tileSize, 9.5 * tileSize, 0, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(1);
        this.maps['test'].actions.push(act);
        this.maps['test'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })


        var act = new ProximityAction();
        act.addTrigger(12.5 * tileSize, 9.5 * tileSize, 1, .5 * tileSize);
        act.setTooltip('');
        act.price = 0;
        act.setSingleUse(false);
        act.setType('teleport');
        act.setTeleportDestination(0);
        this.maps['test'].actions.push(act);
        this.maps['test'].teleportPoints.push({
            x: act.triggers[0].pos.x,
            y: act.triggers[0].pos.y,
            floor: act.triggers[0].floor,
            destFloor: act.teleportConditions.floor
        })

        //windows
        //this.maps['test'].windows.push(new WindowInstance('one'));
        //console.log(this.maps['test'].windows);



        //player revive triggers
        //hopefully in correct order for tooltips
        for(var i = NUM_PLAYERS-1; i >= 0; i--) {
            var act = new ProximityAction();
            act.setTooltip('Revive player ' + (i+1));
            act.id = 'revive_player_' + i;
            act.setType('revive');
            act.addTrigger(-100,-100,-1,0);
            
            this.maps[MAP_NAME].actions.push(act);
        }

        /* act = new ProximityAction();
        act.addTrigger(21 * tileSize, 20.5 * tileSize, 0, tileSize);
        act.setTooltip('Requires Power');
        act.price = Infinity;
        act.setType('tooltip');
        act.id = 'spawnDoorTooltip';
        this.maps['vkt'].actions.push(act);*/


    }

    getMap() {
        return this.maps[MAP_NAME];
    }

    setTileType(type,x,y,f,zPath='Y') {
        this.getMap().floor[f].data = this.getMap().floor[f].data.substring(0, this.getMap().width * y + x) + type + this.getMap().floor[f].data.substring(this.getMap().width * y + x + 1);
        if(dijkstraMap) {  
           dijkstraMap.map.floor[f].data = dijkstraMap.map.floor[f].data.substring(0, this.getMap().width * y + x) + zPath + dijkstraMap.map.floor[f].data.substring(map.width * y + x + 1);
        }
    }

    getWindowById(id) {
        for(var i = 0; i < this.getMap().windows.length; i++) {
            if(this.getMap().windows[i].id == id) {
                return this.getMap().windows[i];
            }
        }
    }

    getDoorById(id) {
        for(var i = 0; i < this.getMap().doors.length; i++) {
            if(this.getMap().doors[i].id == id) {
                return this.getMap().doors[i];
            }
        }
    }

}

class RoundManager {

    constructor() {
        this.round = 0;
        this.zombiesKilled = 0;
        this.zombiesSpawned = 0;
        this.totalZombieKills = 0;

        this.powerups = {};
        this.powerups.doublePoints = {enabled: false, timer: 0, interval: null};
        this.powerups.instaKill = {enabled: false, timer: 0, interval: null};
        this.powerupsSpawned = 0; //counter for each round

        //this reference is lost with setInterval, .bind(this) works!!
        this.timer = window.setInterval(this.spawnZombies.bind(this), 1000);
    }

    getRound() {
        return this.round;
    }
    nextRound() {
        //new Howl({src: ['audio/roundstart.mp3'],html5:true}).play();
        if(getLivingPlayers() > 0) {
            this.round++;
            this.zombiesKilled = 0;
            this.zombiesSpawned = 0;
            this.powerupsSpawned = 0;

            Sounds.playSound('nextround');

            for(var p = 0; p < NUM_PLAYERS; p++) {
                if(players[p].down == true) {
                    players[p].health = players[p].maxHealth;
                    players[p].down = false;
                    players[p].dead = false;
                    players[p].currentReviver = -1;
                    getActionsById('revive_player_' + p)[0].triggers[0].radius = 0;

                    players[p].currentWeapon = 0;
                    players[p].weapon = null;
                    players[p].weaponsList = [];
                    players[p].addWeapon('M1911');

                }
                //reset repair money limit each round
                players[p].roundRepairMoney = 0;
                for(var i = 0; i < getMap().windows.length; i++) {
                    getMapClass().getWindowById(getMap().windows[i].id).repairCount = 0;
                }
            }

        }



    }

    getDestroyedBarricades() {
        var count = 0;
        for(var i = 0; i < getMap().windows.length; i++) {
            if(getMap().windows[i].health <= 0) {count++;}
        }
       // console.log(count);
        return count;
    }

    numActivePowerups() {
        return this.powerups.doublePoints.enabled + this.powerups.instaKill.enabled;
    }

    activatePowerup(name) {
        if(name == '2xp') {
            //console.log('activate double points');
            //double points
            Sounds.playSound('dppickup');
            this.powerups.doublePoints.timer = 30;
            if(!this.powerups.doublePoints.enabled) {
                this.powerups.doublePoints.enabled = true;
                this.powerups.doublePoints.interval = 
                setInterval((function() {
                    this.powerups.doublePoints.timer -= 0.25;
                 //   console.log(this.powerups.doublePoints.timer);
                    if(this.powerups.doublePoints.timer == 0) {
                        this.powerups.doublePoints.enabled = false;
                        Sounds.playSound('dpexpired');
                        clearTimeout(this.powerups.doublePoints.interval);
                    }
                }).bind(this), 250);

            }
        }

        if(name == 'ik') {
            //console.log('activate instakill');
            //double points
            Sounds.playSound('ikpickup');
            this.powerups.instaKill.timer = 30;
            if(!this.powerups.instaKill.enabled) {
                this.powerups.instaKill.enabled = true;
                this.powerups.instaKill.interval = 
                setInterval((function() {
                    this.powerups.instaKill.timer -= 0.25;
                   // console.log(this.powerups.doublePoints.timer);
                    if(this.powerups.instaKill.timer == 0) {
                        this.powerups.instaKill.enabled = false;
                        Sounds.playSound('ikexpired');
                        clearTimeout(this.powerups.instaKill.interval);
                    }
                }).bind(this), 250);

            }
        }

        if(name == 'ma') {
            //console.log('activate max ammo');
            //double points
            //todo: only fill primary weapon of downed player (wiki)
            Sounds.playSound('mapickup');
            for(var p = 0; p < players.length; p++) {
                for(var i = 0; i < players[p].weaponsList.length; i++) {
                    players[p].weaponsList[i].currentReserve = players[p].weaponsList[i].maxAmmo;
                }
            }
            
        }

        if(name == 'nuke') {
            Sounds.playSound('nukepickup');
            for(var p = 0; p < players.length; p++) {
                if(players[p].down == false) {
                    players[p].money += 400 * (1 + roundManager.powerups.doublePoints.enabled);
                }
            }
            for(var z = 0; z < zombies.length; z++) {
                if(zombies[z].alive) {
                    zombies[z].kill('nuke');
                    roundManager.addZombieKill();
                }
            }
        }

        if(name == 'carpenter') {
            Sounds.playSound('carpenterpickup');
            for(var i = 0; i < getMap().windows.length; i++) {
                getMap().windows[i].health = getMap().windows[i].maxHealth;
            }
            for(var p = 0; p < players.length; p++) {
                if(players[p].down == false) {
                    players[p].money += 200 * (1 + roundManager.powerups.doublePoints.enabled);
                }
            }
        }
    }

    addZombieKill() {
        this.totalZombieKills++;
        this.zombiesKilled++;
       // console.log(this.zombiesKilled);
        if(this.zombiesKilled == this.getZombieCount(this.round, NUM_PLAYERS)) {
            setTimeout(function() {
                Sounds.playSound('endround');
            }, 750);
            setTimeout(this.nextRound.bind(this), 10000);
        }
    }
    getZombieHealth(a) {
        var b = 0;
        if(a < 10) {
            return 100 * a;
        }
        return Math.round(900 * Math.pow(1.1, a - 9));
    }
    getMaxZombies(pcount) {
        return(24 + (pcount - 1) * 6);
    }
    spawnZombies(yes = true) {

        //small error at start of earlier rounds, maybe until reached 24 zombies for the first time?
        if(yes) {
            var max = this.getMaxZombies(NUM_PLAYERS);
           // console.log('max zombies on screen', max);
            //console.log('max this round: ' + this.getZombieCount(this.round, NUM_PLAYERS));
            //console.log('total this round: ' +this.zombiesSpawned);
            if(this.zombiesSpawned < this.getZombieCount(this.round, NUM_PLAYERS) && this.zombiesSpawned - this.zombiesKilled < max) {
                //we need additional zombies
                for(var z = 0; z < getZombies().length; z++) {
                    if(getZombies()[z].alive == false) {
                        getZombies()[z].alive = true;
                        getZombies()[z].health = this.getZombieHealth(this.round);
                        this.zombiesSpawned++;

                        if(getMap().zombieSpawns) {
                        var newSpawn = chooseZombieSpawn();
                        getZombies()[z].pos.x = newSpawn.x;
                        getZombies()[z].pos.y = newSpawn.y;
                        getZombies()[z].floor = newSpawn.floor;
                    }
                       // console.log('spawned zombie ' + z);
                        break; //try adding only 1 zombie per call
                        //we spawned a new zombie, stop loop if we have enough for now
                       /* if(this.zombiesSpawned == this.getZombieCount(this.round, NUM_PLAYERS)) {
                            //z = getZombies().length; //exit the for loop
                            break; //exit loop properly
                        }*/

                    }
                }
            }
        }
    }

    // credit: zombulator.com

    getZombieCount(b, a = 1) {
        if(1 == a) {
            if(b < 20) {
                var c = [6, 8, 13, 18, 24, 27, 28, 28, 29, 33, 34, 36, 39, 41, 44, 47, 50, 53, 56];
                return c[b - 1];
            }
            return Math.round(.09 * b * b - .0029 * b + 23.958);
        }
        if(2 == a) {
            if(b < 20) {
                var c = [7, 9, 15, 21, 27, 31, 32, 33, 34, 42, 45, 49, 54, 59, 64, 70, 76, 82, 89];
                return c[b - 1];
            }
            return Math.round(.1882 * b * b - .4313 * b + 29.212);
        }
        if(3 == a) {
            if(b < 20) {
                var c = [11, 14, 23, 32, 41, 47, 48, 50, 51, 62, 68, 74, 81, 89, 97, 105, 114, 123, 133];
                return c[b - 1];
            }
            return Math.round(.2637 * b * b + .1802 * b + 35.015);
        }
        if(4 == a) {
            if(b < 20) {
                var c = [14, 18, 30, 42, 54, 62, 64, 66, 68, 83, 91, 99, 108, 118, 129, 140, 152, 164, 178];
                return c[b - 1];
            }
            return Math.round(.35714 * b * b - .0714 * b + 50.4286);
        }
    }


}

class SoundManager {
    constructor() {
        this.sounds = [];

        this.sounds['M1911fire'] = new Howl({
            src: ['audio/M1911fire.ogg'],
            html5: true,
            buffer: true,
            volume: 0.05
        });
        this.sounds['M1911reload'] = new Howl({
            src: ['audio/M1911_reload.ogg'],
            html5: true,
            buffer: true,
            volume: 0.15
        });

        this.sounds['Kar98kfire'] = new Howl({
            src: ['audio/Kar98kfire.ogg'],
            html5: true,
            buffer: true,
            volume: 0.12
        });
        this.sounds['Kar98kbolt'] = new Howl({
            src: ['audio/Kar98k_boltpull.ogg'],
            html5: true,
            buffer: true,
            volume: 0.15
        });
        this.sounds['Kar98kreload'] = new Howl({
            src: ['audio/Kar98k_reload.ogg'],
            html5: true,
            buffer: true,
            volume: 0.15
        });

        this.sounds['M1Carbinefire'] = new Howl({
            src: ['audio/M1Carbinefire.ogg'],
            html5: true,
            buffer: true,
            volume: 0.1
        });
        this.sounds['M1Carbinereload'] = new Howl({
            src: ['audio/M1Carbine_reload.ogg'],
            html5: true,
            buffer: true,
            volume: 0.3
        });

        this.sounds['M1Thompsonfire'] = new Howl({
            src: ['audio/M1Thompsonfire.ogg'],
            html5: true,
            buffer: true,
            volume: 0.1
        });
        this.sounds['M1Thompsonreload'] = new Howl({
            src: ['audio/M1Thompson_reload.ogg'],
            html5: true,
            buffer: true,
            volume: 0.2
        });

        this.sounds['BARfire'] = new Howl({
            src: ['audio/BARfire.mp3'],
            html5: true,
            buffer: true,
            volume: 0.1
        });
        this.sounds['BARreload'] = new Howl({
            src: ['audio/BAR_reload.mp3'],
            html5: true,
            buffer: true,
            volume: 0.2
        });


        this.sounds['raygunfire'] = new Howl({
            src: ['audio/raygunfire.mp3'],
            html5: true,
            buffer: true,
            volume: 0.2
        });
        this.sounds['raygunreload'] = new Howl({
            src: ['audio/raygunreload.mp3'],
            html5: true,
            buffer: true,
            volume: 0.5
        });


        this.sounds['doublebarreledfire'] = new Howl({
            src: ['audio/doublebarreledfire.mp3'],
            html5: true,
            buffer: true,
            volume: 0.25
        });

        this.sounds['gunEmpty'] = new Howl({
            src: ['audio/gunempty.mp3'],
            html5: true,
            volume: 0.2,
            sprite: {
                short: [900, 200]
            }
        });

        this.sounds['hitmarker'] = new Howl({
            src: ['audio/hitmarker.wav'],
            html5: true,
            volume: 0.3
        });
        this.sounds['purchase'] = new Howl({
            src: ['audio/purchase.wav'],
            html5: true,
            volume: 0.2
        });

        this.sounds['endround'] = new Howl({
            src: ['audio/endround.mp3'],
            html5: true,
            volume: 1
        });
        this.sounds['nextround'] = new Howl({
            src: ['audio/nextround.mp3'],
            html5: true,
            volume: 1
        });
        this.sounds['playerhurt'] = new Howl({
            src: ['audio/pain.mp3'],
            html5: true,
            volume: 0.2
        });
        this.sounds['zombiehit'] = new Howl({
            src: ['audio/fleshwound.mp3'],
            html5: true,
            volume: 1
        });

        this.sounds['knife'] = new Howl({
            src: ['audio/knife.mp3'],
            html5: true,
            volume: 0.5
        });

        this.sounds['windowhit1'] = new Howl({
            src: ['audio/windowhit1.mp3'],
            html5: true,
            volume: 0.15
        });
        this.sounds['windowhit2'] = new Howl({
            src: ['audio/windowhit2.mp3'],
            html5: true,
            volume: 0.8
        });
        this.sounds['windowhit3'] = new Howl({
            src: ['audio/windowhit3.mp3'],
            html5: true,
            volume: 0.8
        });
        this.sounds['windowsmash'] = new Howl({
            src: ['audio/windowsmash.mp3'],
            html5: true,
            volume: 0.25
        });
        this.sounds['windowrepair1'] = new Howl({
            src: ['audio/windowrepair1.mp3'],
            html5: true,
            volume: 0.15
        });
        this.sounds['windowrepair2'] = new Howl({
            src: ['audio/windowrepair2.mp3'],
            html5: true,
            volume: 0.15
        });
        this.sounds['windowrepair3'] = new Howl({
            src: ['audio/windowrepair3.mp3'],
            html5: true,
            volume: 0.15
        });

        this.sounds['ikpickup'] = new Howl({
            src: ['audio/ikbegin.wav'],
            html5: true,
            volume: 0.5
        });
        this.sounds['ikexpired'] = new Howl({
            src: ['audio/ikend.wav'],
            html5: true,
            volume: 0.5
        });
        this.sounds['mapickup'] = new Howl({
            src: ['audio/mapickup.wav'],
            html5: true,
            volume: 0.5
        });
        this.sounds['nukepickup'] = new Howl({
            src: ['audio/nukepickup.wav'],
            html5: true,
            volume: 1
        });
        this.sounds['dppickup'] = new Howl({
            src: ['audio/dppickup.wav'],
            html5: true,
            volume: 0.35
        });
        this.sounds['dpexpired'] = new Howl({
            src: ['audio/dpend.wav'],
            html5: true,
            volume: 0.35
        });
        this.sounds['carpenterpickup'] = new Howl({
            src: ['audio/carpenterpickup.mp3'],
            html5: true,
            volume: 0.5
        });
        this.sounds['dooropen'] = new Howl({
            src: ['audio/dooropen.mp3'],
            html5: true,
            volume: 1
        });
        this.sounds['mysterybox'] = new Howl({
            src: ['audio/mysterybox.mp3'],
            html5: true,
            volume: 0.5
        });


    }
    playSound(str, seekT = 0) {
        //return;
        if(seekT == 0) {
            this.sounds[str].play();
        } else {
            this.sounds[str].seek(seekT).play();
        }
    }
    stopSound(str) {
        //each Howl sound has a pool of 5 (default) instances to choose from.
        //instead of making a sound manager instance for each player, could store the id of different sounds in each player
        //this might be premature optimization, should really test if 4 copies of every sound impacts performance/memory usage
        //could just make copies of 'important' noticeable sounds within the original class, e.g. all reloading sounds
        //if done by id, could do id1, id2 etc on each player where id1 is primary reload sound, id2 misc sound e.g. bolt pull
        //for the moment just making 4 copies of sound manager
        try{
        this.sounds[str].stop();
        }
        catch(e) {
            console.log('no such sound ' + str + ' exists to stop!');
        }
    }
    playSprite(str, spr) {
        this.sounds[str].play(spr);
    }
}

class Sprite {
    constructor() {
        this.currentFrame = 0;
        this.frames = 9;
        this.rotation = 0;
        this.x = 0;
        this.y = 0;
        this.size = 32;
        this.img = new Image();
    }
    nextFrame() {
        this.currentFrame++;
    }

}

class Stage {
    constructor() {
        this.objects = [];
    }
    addChild(spr) {
        this.objects.push(spr);
    }
    removeChild(a) {
        this.objects.splice(a, 1);
    }
}


class ImageManager {
    constructor() {
        this.character = new Image();
        this.character.src = "images/character.png";
        this.character.frames = 4;
        this.character.currentFrame = 0;
        this.character.size = 32;

        this.wall = new Image();
        this.wall.src = "images/brickwall.jpg";
        this.wall.size = 32;

        this.grass = new Image();
        this.grass.src = "images/grass.jpg";
        this.grass.size = 32;

        this.tile = new Image();
        this.tile.src = "images/tile.jpg";
        this.tile.size = 32;

        this.door = new Image();
        this.door.src = "images/door.jpg";
        this.door.size = 32;

        this.door_small = new Image();
        this.door_small.src = "images/door_small.jpg";
        this.door_small.size = 32;

        this.carpet = new Image();
        this.carpet.src = "images/carpet.jpg";
        this.carpet.size = 32;

        this.fence = new Image();
        this.fence.src = "images/fence.png";
        this.fence.size = 32;

        this.zombiedeath = new Image();
        this.zombiedeath.src = 'images/flash test/zombiedeath2.png';

        this.zombie = new Image();
        // this.zombie.src="images/hazmatzombie.png";
        this.zombie.src = "images/flash test/newzombies.png";
        this.zombie.frames = 4;
        // this.zombie.currentFrame = 0;
        this.zombie.size = 32;

        //hud
        this.hudbase = new Image();
        this.hudbase.src = "images/hudbase.png";

        this.hpbar = new Image();
        this.hpbar.src = "images/healthbar.png";

        this.bleedoutbar = new Image();
        this.bleedoutbar.src = "images/bleedoutbar.png";

        this.reloadIndicator = new Image();
        this.reloadIndicator.src = "images/reloadindicator.png";

        this.reviveIndicator = new Image();
        this.reviveIndicator.src = "images/reviveindicator.png";
        //powerups - ground
        this.powerupGlow = new Image();
        this.powerupGlow.src = "images/powerupglow.png";

        this.doublePoints = new Image();
        this.doublePoints.src = "images/doublepoints.png";

        this.instaKill = new Image();
        this.instaKill.src = "images/instakill.png";

        this.maxAmmo = new Image();
        this.maxAmmo.src = "images/maxammo.png";

        this.nuke = new Image();
        this.nuke.src = "images/nuke.png";

        this.carpenter = new Image();
        this.carpenter.src = "images/carpenter.png";

        //powerups - hud
        this.doublePointsHud = new Image();
        this.doublePointsHud.src = "images/huddoublepoints.png";

        this.instaKillHud = new Image();
        this.instaKillHud.src = "images/hudinstakill.png";

        this.floorDecals = [];
        this.wallDecals = [];
        //ndu
        this.floorDecals['ndu'] = [];
        this.floorDecals['ndu'][0] = new Image();
        this.floorDecals['ndu'][0].src = 'images/maps/ndu/floor_decals_0.png';
        this.floorDecals['ndu'][1] = new Image();
        this.floorDecals['ndu'][1].src = 'images/maps/ndu/floor_decals_1.png';

        this.wallDecals['ndu'] = [];
        this.wallDecals['ndu'][0] = new Image();
        this.wallDecals['ndu'][0].src = 'images/maps/ndu/wall_decals_0.png';
        this.wallDecals['ndu'][1] = new Image();
        this.wallDecals['ndu'][1].src = 'images/maps/ndu/wall_decals_1.png';



        //vkt
        this.floorDecals['vkt'] = [];
        //=document.createElement("img"); better?
        this.floorDecals['vkt'][0] = new Image();
        this.floorDecals['vkt'][0].src = 'images/maps/vkt/floor_decals_0.png';
        this.floorDecals['vkt'][1] = new Image();
        this.floorDecals['vkt'][1].src = 'images/maps/vkt/floor_decals_1.png';
        this.wallDecals['vkt'] = [];
        this.wallDecals['vkt'][0] = new Image();
        this.wallDecals['vkt'][0].src = 'images/maps/vkt/wall_decals_0.png';
        this.wallDecals['vkt'][1] = new Image();
        this.wallDecals['vkt'][1].src = 'images/maps/vkt/wall_decals_1.png';


        //five
        this.floorDecals['five'] = [];
        this.floorDecals['five'][0] = new Image();
        this.floorDecals['five'][0].src = 'images/maps/five/floor_decals_0.png';

        this.wallDecals['five'] = [];
        this.wallDecals['five'][0] = new Image();
        this.wallDecals['five'][0].src = 'images/maps/five/wall_decals_0.png';

        //test
        this.floorDecals['test'] = [];
        this.floorDecals['test'][0] = new Image();
        this.floorDecals['test'][0].src = 'images/maps/ndu/floor_decals_0.png';
        this.floorDecals['test'][1] = new Image();
        this.floorDecals['test'][1].src = 'images/maps/ndu/floor_decals_1.png';

        this.wallDecals['test'] = [];
        this.wallDecals['test'][0] = new Image();
        this.wallDecals['test'][0].src = 'images/maps/ndu/wall_decals_0.png';
        this.wallDecals['test'][1] = new Image();
        this.wallDecals['test'][1].src = 'images/maps/ndu/wall_decals_1.png';

        // this.ndu_decal_floor = new Image();
        // this.ndu_decal_floor.src = 'images/maps/ndu-map-decals-floor.png';

        this.blood = new Image();
        //this.blood.src = 'images/blood-splat.png';
        this.blood.src = 'images/untitled-1.png';

        //melee test
        this.characterMelee = new Image();
        this.characterMelee.src = 'images/flash test/melee_attack.png';

        var weapons = ['M1911', 'Kar98k', 'M1Carbine', 'M1Thompson', 'raygun', 'BAR'];
        this.weaponIcon = [];
        for(var i = 0; i < weapons.length; i++) {
            this.weaponIcon[weapons[i]] = new Image();
            this.weaponIcon[weapons[i]].src = "images/weapons/" + weapons[i] + ".png";
        }
    }
    nextFrame() {
        this.character.currentFrame++;
        if(this.character.currentFrame == this.character.frames) {
            this.character.currentFrame = 0;
        }
    }
}

class MysteryBoxManager {
    constructor() {
        //will make rewards map-specific if enough progress is made
        this.rewards = [//'M1911',
                        //'Kar98k', 
                        //'M1Carbine', 
                        //'M1Thompson', 
                        'raygun', 
                        //'BAR', 
                        'doublebarreled',
                        'commando',
                        'rpk',
                        'cz75',
                        'aug',
                        'famas',
                        'hk21',
                        'hs-10',
                        'galil',
                        'dragunov',
                        'fnfal',
                        'spas-12',
                        'spectre',
                        'python',
                        'l96a1']; 

        this.defaultboxid = 'mb1';
        this.currentboxid = this.defaultboxid;
        this.numBoxes = 1;
        this.lastUser = 0; //used so that only the player who purchases a weapon can pick it up
        this.currentWeaponObj = 0; //used to hold a weapon object to use both internal and pretty names
        this.expirationTimer = 0;
    }
    setupBox() {
        getActionsById(this.currentboxid)[0].triggers[0].radius = 0.5*tileSize;
    }
    purchase(p) {
        Sounds.playSound('mysterybox');
        Sounds.playSound('purchase')
        getActionsById(this.currentboxid)[0].triggers[0].radius = 0;
        var mbreference = this.currentboxid + 'gun';
        this.lastUser = p;
        //enable gun pickup trigger after a few seconds
        setTimeout((function() {this.spawnGunPickup();}).bind(this), 4500);
    }

    chooseGunName() {
        //could exclude guns the player already has?
        this.currentWeaponObj = new Weapon(this.rewards[Math.floor(Math.random() * this.rewards.length)]);
        return this.currentWeaponObj.internalName;
    }

    spawnGunPickup() {
        var act = getActionsById(this.currentboxid+'gun')[0];
        act.triggers[0].radius = 0.5 * tileSize;
        act.owner = this.lastUser;
        this.chooseGunName();
        act.gunName = this.currentWeaponObj.internalName;
        act.tooltip = 'Pick up ' + this.currentWeaponObj.name;
        this.expirationTimer = setTimeout((function(){this.endCycle()}).bind(this),8000);
    }

    endCycle() {
        clearTimeout(this.expirationTimer); //stop this timer in case player picked the weapon up to avoid any weirdness
        getActionsById(this.currentboxid + 'gun')[0].triggers[0].radius = 0;
        setTimeout((function(){this.setupBox()}).bind(this), 3000);
    }
}

class Player {
    constructor(id = -1) {
        this.pos = new Vector2D();
        this.angleFacing = 0;
        this.speed = 1.7;
        this.hasReleasedFire = true;
        this.hasReleasedSwitch = true;
        this.fire = false;
        this.action = false;
        this.sprint = false;
        this.referenceRay = [new Vector2D()];
        this.shootInterval = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.reload = false;
        this.displayTooltip = '';
        this.money = 0;
        this.roundRepairMoney = 0;
        this.weaponsList = [];
        this.maxWeapons = 2;
        this.currentWeapon = 0;
        this.weapon = null;
        this.currentFloor = 0;
        this.drawLaser = 0;
        this.ray = [new Vector2D(), new Vector2D()];
        this.origin = new Vector2D();
        this.down = false;
        this.dead = false;
        this.currentFrame = 0;
        this.maxFrames = 4;
        this.moving = false;
        this.kills = 0;
        this.noclip = false;
        this.isMeleeing = false;
        this.melee = false;
        this.id = id;
        this.currentReviver = -1;
       

        this.meleeWeapon = new MeleeWeapon('knife');
        this.meleeWeapon.setParentPlayer(this);
    }
    nextWeapon() {

     
        if(this.weaponsList.length > 1) {
            this.hasReleasedFire = false;
            this.fire = false;
            this.weapon.interruptReload();
            
            this.currentWeapon++;
            if(this.currentWeapon == this.weaponsList.length) {
                this.currentWeapon = 0;
            }
            this.weapon = this.weaponsList[this.currentWeapon];
            
        }
        //show name on hud
            this.weapon.weaponSwitchTimer = 90;
    }
    addWeapon(name) {
        if(this.weaponsList.length == this.maxWeapons || this.weaponsList.length == 0) {
            this.weaponsList[this.currentWeapon] = new Weapon(name);
            this.weaponsList[this.currentWeapon].setParentPlayer(this);
            this.weapon = this.weaponsList[this.currentWeapon];
        } else {
            this.weaponsList.push(new Weapon(name));
            this.weaponsList[this.weaponsList.length - 1].setParentPlayer(this);
            for(var i = 0; i < this.weaponsList.length - this.currentWeapon; i++) {
                this.nextWeapon();
            }
        }
        this.weapon.weaponSwitchTimer = 90;
    }
    hasWeapon(name) {
        for(var i = 0; i < this.weaponsList.length; i++) {
            if(this.weaponsList[i].internalName == name) {
                return true;
            }
        }
        return false;
    }
    damage(amount) {
        if(!this.godmode) {
            this.health -= amount;
            if(this.health <= 0 && this.down == false) {
                this.downPlayer();
            }
        }
    }

    downPlayer() {
        this.down = true;
        this.health = 100;
        this.reviveMeter = 0;
        this.weapon.interruptReload();
        this.money = Math.round(this.money * 0.95);
        //assume it exists
        var act = getActionsById('revive_player_' + this.id)[0];
        act.triggers[0] = {pos: this.pos, floor: this.currentFloor, radius: 10};
    }
}

class MeleeWeapon {
    constructor(type) {
        this.angle = Math.PI / 2;
        this.range = 20;
        this.sweep = 11; //how to subdivide the cone of fire
        this.meleeTimer = 0;
        this.cooldown = 25;
        this.cooldownTimer = 0;
        this.attacking = false;
        this.currentAngle = 0;
        this.parentPlayer = {};
        this.hitList = [];
        this.maxTargets = 1;
        if(type == 'knife') {
            this.type = type;
            this.damage = 135;
        }
    }

    canAttack() {
        return !this.attacking;
    }

    attack() {
        // console.log('melee attack');
        this.attacking = true;
        this.hitList = [];
        this.currentAngle = this.parentPlayer.playerFacing + this.angle / 2;
        this.meleeTimer = 10;

        this.parentPlayer.isMeleeing = true;
    }
    tickUpdate() {
        if(this.meleeTimer > 0) {
            this.meleeTimer--;
            this.attackStep();
            //this.currentAngle -= this.angle/this.sweep;



            if(this.meleeTimer == 0) {
                this.cooldownTimer = this.cooldown;
                // console.log('end attack phase');

            }

        }
        if(this.cooldownTimer > 0) {
            this.cooldownTimer--;
            if(this.cooldownTimer == 0) {
                this.attacking = false;
                this.parentPlayer.isMeleeing = false;
            }
        }

    }
    attackStep() {
        //parentplayer.canshoot = false;

        //raycast a few times for each angle
        //hit detection
        //check if already hit
        //increment angle
        var oldLength = this.hitList.length;
        
        for(var j = 0; j < 3; j++) {
            var list = Raytrace.collideList(this.parentPlayer.pos, Vector2D.project(this.parentPlayer.pos, this.currentAngle, this.range), getZombies(), this.parentPlayer.currentFloor);

            for(var i = 0; i < list.length; i++) {
                if(!this.hitList.includes(list[i])) {
                   
                    if(this.hitList.length < this.maxTargets) {   
                        this.hitList.push(list[i]);
                        //console.log('hit on ',this.meleeTimer);
                        drawBloodAt(getZombies()[this.hitList[this.hitList.length - 1]].pos.x, getZombies()[this.hitList[this.hitList.length - 1]].pos.y, getZombies()[this.hitList[this.hitList.length - 1]].currentFloor);

                        // canvasBuffer.getContext('2d').globalAlpha = 1;
                        // bufferctx.globalCompositeOperation = 'source-over';
                        getZombies()[this.hitList[this.hitList.length - 1]].takeDamage(this.parentPlayer, 1, 'melee', this.damage);

                   }


                }
            }

            this.currentAngle -= this.angle / (3 * this.sweep);

        }

        if(this.hitList.length > oldLength) {
            Sounds.playSound('zombiehit');
        }
    }

    setParentPlayer(player) {
        this.parentPlayer = player;

    }

}

class Weapon {
    constructor(type) {
        this.reloading = false;
        this.currentMag = 0;
        this.currentReserve = 0;
        this.reloadTimer = 0;
        this.shootTimer = 0;
        this.rotateSpeed = 1; //angle speed limited to reciprocal
        this.parentPlayer = {};
        this.specialType = '';
        this.weaponSwitchTimer = 0;
        this.shotsFired = 1;
        this.lastReloadTime = 0;
        if(type == 'M1911') {
            this.name = 'M1911 Handgun';
            this.internalName = 'M1911';
            this.magSize = 8;
            this.maxAmmo = 80; //so set currentReserve to 80
            this.startingAmmo = 40;
            this.semiAuto = true;
            this.fireRate = 6;
            this.damage = 20;
            this.reloadTime = 1.8;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.5;
            this.stoppingPower = 15;
            this.rotateSpeed = 3;
        }
        if(type == 'Kar98k') {
            this.name = 'Kar98k Bolt-Action Rifle';
            this.internalName = 'Kar98k';
            this.magSize = 5;
            this.maxAmmo = 50; 
            this.startingAmmo = 55;
            this.semiAuto = true; //coded as semi auto with long fire delay
            this.fireRate = 75;
            this.damage = 100;
            this.reloadTime = 2;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.95;
            this.boltSound = null;
            this.stoppingPower = 40;
            this.rotateSpeed = 10;
        }
        if(type == 'M1Carbine') {
            this.name = 'M1 Carbine';
            this.internalName = 'M1Carbine';
            this.magSize = 15;
            this.maxAmmo = 120; 
            this.startingAmmo = 135;
            this.semiAuto = true;
            this.fireRate = 8;
            this.damage = 120;
            this.reloadTime = 2.7;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.9;
            this.stoppingPower = 30;
            this.rotateSpeed = 10;
        }
        if(type == 'M1Thompson') {
            this.name = 'M1 Thompson Submachine Gun';
            this.internalName = 'M1Thompson';
            this.magSize = 20;
            this.maxAmmo = 200; 
            this.startingAmmo = 220;
            this.semiAuto = false;
            this.fireRate = 5;
            this.damage = 110;
            this.reloadTime = 2.7;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.8;
            this.stoppingPower = 20;
            this.rotateSpeed = 7;
        }
        if(type == 'BAR') {
            this.name = 'BAR';
            this.internalName = 'BAR';
            this.magSize = 20;
            this.maxAmmo = 160; 
            this.startingAmmo = 180;
            this.semiAuto = false;
            this.fireRate = 10;
            this.damage = 140;
            this.reloadTime = 2.75;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.95;
            this.stoppingPower = 25;
            this.rotateSpeed = 8;
        }

        
        if(type == 'doublebarreled') {
            this.name = 'Double-Barreled Shotgun';
            this.internalName = 'doublebarreled';
            this.specialType = 'shotgun';
            this.shotsFired = 8;
            this.magSize = 2;
            this.maxAmmo = 60;
            this.startingAmmo = 62;
            this.semiAuto = true;
            this.fireRate = 4;
            this.damage = 150;
            //will add extra reload time when empty as an exception at some point
            this.reloadTime = 2.65;

            this.range = 200;
            this.penetration = 'full';
            this.penetrationMult = 0.7;
            this.stoppingPower = 30;
            this.rotateSpeed = 8;
        }

        if(type == 'famas') {
            this.name = 'FAMAS';
            this.internalName = 'famas';
            this.magSize = 30;
            this.maxAmmo = 120; 
            this.startingAmmo = 150;
            this.semiAuto = false;
            this.fireRate = 4;
            this.damage = 100;
            this.reloadTime = 3.3;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.8;
            this.stoppingPower = 22;
            this.rotateSpeed = 7;
        }

        if(type == 'commando') {
            this.name = 'Commando';
            this.internalName = 'commando';
            this.magSize = 30;
            this.maxAmmo = 240; 
            this.startingAmmo = 270;
            this.semiAuto = false;
            this.fireRate = 5;
            this.damage = 125;
            this.reloadTime = 2.55;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.8;
            this.stoppingPower = 23;
            this.rotateSpeed = 6;
        }

        if(type == 'rpk') {
            this.name = 'RPK';
            this.internalName = 'rpk';
            this.magSize = 100;
            this.maxAmmo = 400; 
            this.startingAmmo = 500;
            this.semiAuto = false;
            this.fireRate = 5;
            this.damage = 120;
            this.reloadTime = 5.5;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.85;
            this.stoppingPower = 25;
            this.rotateSpeed = 13;
        }

        if(type == 'cz75') {
            this.name = 'CZ75';
            this.internalName = 'cz75';
            this.magSize = 15;
            this.maxAmmo = 135; 
            this.startingAmmo = 150;
            this.semiAuto = true;
            this.fireRate = 6;
            this.damage = 125;
            this.reloadTime = 2;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.55;
            this.stoppingPower = 15;
            this.rotateSpeed = 3;
        }

        if(type == 'aug') {
            this.name = 'AUG';
            this.internalName = 'aug';
            this.magSize = 30;
            this.maxAmmo = 270; 
            this.startingAmmo = 300;
            this.semiAuto = false;
            this.fireRate = 4;
            this.damage = 115;
            this.reloadTime = 3.05;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.8;
            this.stoppingPower = 24;
            this.rotateSpeed = 7;
        }

        if(type == 'hk21') {
            this.name = 'HK21';
            this.internalName = 'hk21';
            this.magSize = 125;
            this.maxAmmo = 500; 
            this.startingAmmo = 625;
            this.semiAuto = false;
            this.fireRate = 7;
            this.damage = 130;
            this.reloadTime = 4.75;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.85;
            this.stoppingPower = 26;
            this.rotateSpeed = 14;
        }

        if(type == 'hs-10') {
            this.name = 'HS-10';
            this.internalName = 'hs-10';
            this.magSize = 6;
            this.maxAmmo = 36; 
            this.startingAmmo = 42;
            this.semiAuto = true;
            this.specialType = 'shotgun';
            this.shotsFired = 8;
            this.fireRate = 10;
            this.damage = 130;
            this.reloadTime = 3.4;
            this.range = '180'; //if set to na will crash for shotguns
            this.penetration = 'full';
            this.penetrationMult = 0.65;
            this.stoppingPower = 28;
            this.rotateSpeed = 8;
        }

        if(type == 'galil') {
            this.name = 'Galil';
            this.internalName = 'galil';
            this.magSize = 35;
            this.maxAmmo = 315; 
            this.startingAmmo = 350;
            this.semiAuto = false;
            this.fireRate = 5;
            this.damage = 125;
            this.reloadTime = 3.8;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.85;
            this.stoppingPower = 23;
            this.rotateSpeed = 7;
        }

        if(type == 'dragunov') {
            this.name = 'Dragunov';
            this.internalName = 'dragunov';
            this.magSize = 10;
            this.maxAmmo = 40; 
            this.startingAmmo = 50;
            this.semiAuto = true;
            this.fireRate = 18;
            this.damage = 550;
            this.reloadTime = 3.75;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.95;
            this.stoppingPower = 35;
            this.rotateSpeed = 12;
        }
        
        //skip g11 for now - need burst fire code

        if(type == 'fnfal') {
            this.name = 'FN FAL';
            this.internalName = 'fnfal';
            this.magSize = 20;
            this.maxAmmo = 180; 
            this.startingAmmo = 200;
            this.semiAuto = true;
            this.fireRate = 6;
            this.damage = 145;
            this.reloadTime = 3.1;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.85;
            this.stoppingPower = 26;
            this.rotateSpeed = 8;
        }

        if(type == 'spas-12') {
            this.name = 'SPAS-12';
            this.internalName = 'spas-12';
            this.magSize = 8;
            this.maxAmmo = 32; 
            this.startingAmmo = 40;
            this.semiAuto = true;
            this.specialType = 'shotgun';
            this.shotsFired = 8;
            this.fireRate = 12;
            this.damage = 120;
            this.reloadTime = 4.5;
            this.range = '170'; //if set to na will crash for shotguns
            this.penetration = 'full';
            this.penetrationMult = 0.6;
            this.stoppingPower = 28;
            this.rotateSpeed = 6;
        }

        if(type == 'spectre') {
            this.name = 'Spectre';
            this.internalName = 'spectre';
            this.magSize = 30;
            this.maxAmmo = 120; 
            this.startingAmmo = 150;
            this.semiAuto = false;
            this.fireRate = 4;
            this.damage = 70;
            this.reloadTime = 3.0;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.55;
            this.stoppingPower = 16;
            this.rotateSpeed = 3;
        }

        if(type == 'python') {
            this.name = 'Python';
            this.internalName = 'python';
            this.magSize = 6;
            this.maxAmmo = 84; 
            this.startingAmmo = 90;
            this.semiAuto = true;
            this.fireRate = 6;
            this.damage = 610;
            this.reloadTime = 3.9;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.7;
            this.stoppingPower = 27;
            this.rotateSpeed = 3;
        }

        if(type == 'l96a1') {
            this.name = 'L96A1';
            this.internalName = 'l96a1';
            this.magSize = 5;
            this.maxAmmo = 45; 
            this.startingAmmo = 50;
            this.semiAuto = true;
            this.fireRate = 72;
            this.damage = 500;
            this.reloadTime = 3.5;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.98;
            this.stoppingPower = 38;
            this.rotateSpeed = 10;
        }

        if(type == 'raygun') {
            this.name = 'Ray Gun';
            this.internalName = 'raygun';
            this.magSize = 20;
            this.maxAmmo = 160; 
            this.startingAmmo = 180;
            this.semiAuto = true;
            this.fireRate = 20;
            this.damage = 1000;
            this.reloadTime = 3;
            this.range = 'na';
            this.penetration = 'na';
            this.penetrationMult = 0;
            this.stoppingPower = 20;
            this.rotateSpeed = 4;
        }



        this.setupGun();

    }
    setupGun() {
        this.currentMag = this.magSize;
        this.currentReserve = this.startingAmmo - this.magSize;
    }
    setParentPlayer(player) {
        this.parentPlayer = player;

    }
    canFire() {
        return(this.currentMag > 0 && !this.reloading && !this.parentPlayer.isMeleeing);
    }
    fire() {
        // drawLaser = true;
        //drawlaser needs to die
        this.parentPlayer.drawLaser = 2;
        this.currentMag--;
        if(this.internalName == 'M1911') {
            Sounds.playSound('M1911fire');
        } else if(this.internalName == 'Kar98k') {
            Sounds.playSound('Kar98kfire');
            if(this.canFire()) {
                //bolt pull sound
                //this.boltSound = new Howl({src: ['audio/Kar98k_boltpull.ogg'],html5:true,volume:0.15});
                Sounds.stopSound('Kar98kbolt');
                Sounds.playSound('Kar98kbolt', 0.3);
                //this.boltSound.seek(0.3).play();
            }

        } else if(this.internalName == 'M1Carbine') {
            Sounds.playSound('M1Carbinefire');
        } else if(this.internalName == 'M1Thompson') {
            Sounds.playSound('M1Thompsonfire');
        } else if(this.internalName == 'BAR') {
            Sounds.playSound('BARfire');
        } else if(this.internalName == 'raygun') {
            Sounds.playSound('raygunfire');
        } else if(this.internalName == 'doublebarreled') {
            Sounds.playSound('doublebarreledfire');
        }

        this.parentPlayer.ray[1] = Raytrace.collideBullet(this.parentPlayer.origin, Raytrace.castRay(this.parentPlayer.origin, this.parentPlayer.referenceRay[0], this.parentPlayer.currentFloor, this.range), zombies, this.parentPlayer.currentFloor, this.parentPlayer);
        //copy this for later rendering
        this.parentPlayer.ray[0].x = this.parentPlayer.origin.x;
        this.parentPlayer.ray[0].y = this.parentPlayer.origin.y;

        if(this.specialType == 'shotgun') {
            for(var i = 2; i < this.shotsFired + 1; i++){
                this.parentPlayer.ray[i] = Raytrace.collideBullet(this.parentPlayer.origin, Raytrace.castRay(this.parentPlayer.origin, this.parentPlayer.referenceRay[i], this.parentPlayer.currentFloor, this.range*(1+Math.random()/5)), zombies, this.parentPlayer.currentFloor, this.parentPlayer);
                
            }
        }
        else if(this.parentPlayer.ray.length > 2) {
            this.parentPlayer.ray.splice(2);
        }

        if(this.internalName == 'raygun') { //create splash damage at location (I'll ignore walls for now?)
            createExplosion(this.parentPlayer, this.parentPlayer.ray[1], 32, this.parentPlayer.currentFloor, 300, 1500);
            //in future create explosion with several rays?
        }
        if(this.canFire()) {
            this.shootTimer = this.fireRate;
        }


    }
    click() {
        Sounds.playSprite('gunEmpty', 'short');
    }
    canReload() {
        return(this.currentReserve > 0 && this.currentMag < this.magSize && !this.reloading && !this.parentPlayer.isMeleeing);
    }
    startReload() {
        this.reloadTimer = Math.floor(this.reloadTime * 60);
        this.reloading = true;
        //currently no good way to stop multiple reload sounds playing - 
        //solution: per-player sound manager?
        var Sounds = SMInstance[this.parentPlayer.id];
        if(this.internalName == 'M1911') {
            Sounds.playSound('M1911reload', 0.25);
        } else if(this.internalName == 'M1Carbine') {
            Sounds.playSound('M1Carbinereload', 0.2);
        } else if(this.internalName == 'M1Thompson') {
            Sounds.playSound('M1Thompsonreload');
        } else if(this.internalName == 'BAR') {
            Sounds.playSound('BARreload');
        } else if(this.internalName == 'raygun') {
            Sounds.playSound('raygunreload');
        } else if(this.internalName == 'Kar98k') {
            Sounds.stopSound('Kar98kbolt');
            Sounds.playSound('Kar98kreload', 0.2);
        } else if(this.internalName == 'doublebarreled') {
            if(this.currentMag == 0) {this.reloadTimer += Math.floor(0.8 * 60);}
        }
        this.lastReloadTime = this.reloadTimer/60;
    }
    endReload() { //end of a successful reload
        var amount = Math.min(this.currentReserve, this.magSize - this.currentMag);
        this.currentReserve -= amount;
        this.currentMag += amount;
    }
    interruptReload() { 
        this.reloading = false;
        this.reloadTimer = 0;
        try {
        SMInstance[this.parentPlayer.id].sounds[this.internalName + "reload"].stop();
        }
        catch(e) {
            console.log('no reload sound found to stop!');
        }

        //this.parentPlayer.id
    }
    tickUpdate() {
        if(this.reloadTimer > 0) {
            this.reloadTimer--;
            if(this.reloadTimer == 0) {
                this.reloading = false;
                this.endReload();
            }
        }
        if(this.shootTimer > 0) {
            this.shootTimer--;
        }

        if(this.weaponSwitchTimer > 0) {
            this.weaponSwitchTimer--;
        }


    }

}

class Path {
    constructor() {
        this.points = [];
        //this.start = a;
        //this.end = b;
        this.radius = 10;
    }
    addPoint(x, y) {
        this.points.push(new Vector2D(x, y));
    }
}

class Zombie {
    constructor(x, y) {
        this.pos = new Vector2D(x, y);
        this.angleFacing = 0;
        this.maxSpeed = .5;
        this.maxForce = 1;
        this.velocity = new Vector2D();
        this.desiredVelocity = new Vector2D();
        this.acceleration = new Vector2D();
        this.goSlow = false;
        this.path = new Path();
        this.maxFrames = 4;
        this.currentFrame = Math.floor(Math.random() * 4);
        this.frameCounter = 0;
        this.attackCooldown = 60;
        this.currentCooldown = 0;
        this.attackDamage = 30;
        this.size = 10;
        this.debugPath = false;
        this.health = 100;
        this.alive = false;
        this.slowTimer = 0;
        this.sinOffset = Math.round(Math.random() * 100);
        this.currentFloor = 0;
        this.preference = [0,1,2,3];

    }
    setHealth(health) {
        this.health = health;
    }
    update() {
        if(this.alive) {
            this.velocity.add(this.acceleration);
            this.velocity.limit(this.maxSpeed);
            if(this.goSlow) {
                this.goSlow = false;
                this.velocity.limit(this.maxSpeed);
                this.velocity.mult(0.1);
            }
            if(this.slowTimer > 0) {
                this.slowTimer--;

                this.velocity.mult(stoppingPower(this.slowTimer));
            }

            //add sinusoidal wandering
            this.sinOffset += 0.5 * this.velocity.magnitude() / this.maxSpeed;
            if(this.sinOffset > 200) {
                this.sinOffset = 0;
            }
            this.velocity.rotate((this.velocity.magnitude() / this.maxSpeed) * 0.01 * Math.sin(Math.PI * 2 * this.sinOffset / 200));
            //could use optimisastion maybe, precompute values of sin


            this.pos.add(this.velocity);
            this.acceleration.mult(0);

            this.angleFacing -= AngleDifference(Math.atan2(this.velocity.y, this.velocity.x), this.angleFacing) / 10;

            if(this.currentCooldown > 0) {
                this.currentCooldown--;
            }



        }
    }
    attack() {
        this.currentCooldown = this.attackCooldown;
    }
    canAttack() {
        return(this.currentCooldown == 0);
    }
    takeDamage(player, mult = 1, type = 'gun', dmg = 0) {
        //assume weapon for now
        //zombies taking damage when already dead messes up counter - not sure why this happens
        if(this.alive==false) {return;};
        if(type == 'gun') {
            this.slowTimer = player.weapon.stoppingPower * mult;

            this.health -= player.weapon.damage * mult * (1 + roundManager.powerups.instaKill.enabled*999999);
            player.money += 10 * (roundManager.powerups.doublePoints.enabled + 1);
            if(this.health <= 0) {
                this.kill();
                player.money += 60 * (roundManager.powerups.doublePoints.enabled + 1);
                roundManager.addZombieKill();
                player.kills++;
            }
        } else if(type == 'splash') {
            this.health -= dmg * (1 + roundManager.powerups.instaKill.enabled*999999);
            player.money += 10 * (roundManager.powerups.doublePoints.enabled + 1);
            if(this.health <= 0) {
                this.kill();
                player.money += 60 * (roundManager.powerups.doublePoints.enabled + 1);
                roundManager.addZombieKill();
                player.kills++;
            }
        } else if(type == 'melee') {
            this.health -= dmg * (1 + roundManager.powerups.instaKill.enabled*999999);
            player.money += 10 * (roundManager.powerups.doublePoints.enabled + 1);
            if(this.health <= 0) {
                this.kill();
                player.money += 120 * (roundManager.powerups.doublePoints.enabled + 1);
                roundManager.addZombieKill();
                player.kills++;
            }
        }

    }
    kill(reason='combat') {
        //  this.pos.x = -100;
        //  this.pos.y = -100;
        var deathSprite = new Sprite();
        deathSprite.x = this.pos.x;
        deathSprite.y = this.pos.y;
        deathSprite.rotation = Math.random() * Math.PI * 2;
        deathSprite.img = Images.zombiedeath;
        deathSprite.floor = this.currentFloor;
        GameStage.addChild(deathSprite);

        if(reason == 'combat')  {
            for(var i = 0; i < obstacleContainer.interior[this.currentFloor].length; i++) {

                //was the zombie killed in an interior?
                if(jCirclePolyCollision(new Circle(new Vector(this.pos.x,this.pos.y),8),obstacleContainer.interior[this.currentFloor][i])) {
                    //console.log('I died inside ' + i);
                    //if(Math.random() > 0.95) {spawnPowerup(this.pos.x,this.pos.y,this.currentFloor);}
                    //0.95 maybe slightly too good - real game uses 0.98
                    if(Math.random() > 0.95 && roundManager.powerupsSpawned < 4) {
                        spawnPowerup(this.pos.x,this.pos.y,this.currentFloor);
                        roundManager.powerupsSpawned++;
                        break;
                    }
                }

            }
        }


        this.alive = false;

        var r = Math.random();
        var xpos = 0;
        var ypos = 0;
        if(r < 0.25) {
            xpos = tileSize * (-4 + Math.random() * (map.width + 4));
            ypos = -2 - Math.random() * 2 * tileSize;
        }
        else if(r < 0.5) {
            xpos = (-4 + Math.random() * (map.width + 4)) * tileSize;
            ypos = (map.height + 2 + Math.random() * 2) * tileSize;
        }
        else if(r < 0.75) {
            ypos = (-4 + Math.random() * (map.height + 4)) * tileSize;
            xpos = -2 - Math.random() * 2 * tileSize;
        } else {
            ypos = (-4 + Math.random() * (map.height + 4)) * tileSize;
            xpos = (map.width + 2 + Math.random() * 2) * tileSize;
        }
        this.pos.x = xpos;
        this.pos.y = ypos;
        this.currentFloor = 0;
        this.maxSpeed = 0.4 + Math.random() * 0.4;
        this.preference = shuffle(this.preference);


    }
    seek(target) {
        this.desiredVelocity = Vector2D.sub(target, this.pos);
        this.desiredVelocity.normalize();
        this.desiredVelocity.mult(this.maxSpeed);

        var steer = Vector2D.sub(this.desiredVelocity, this.velocity);
        steer.limit(this.maxForce);
        //  steer.mult(2);

        this.applyForce(steer);
    }
    arrive(target) {
        this.desiredVelocity = Vector2D.sub(target, this.pos);
        var d = this.desiredVelocity.magnitude();
        this.desiredVelocity.normalize();
        if(d < 35) {
            var newSpeed = this.maxSpeed * (d) / 35;
            this.desiredVelocity.limit(newSpeed);
        } else {
            this.desiredVelocity.limit(this.maxSpeed);
        }
        var steer = Vector2D.sub(this.desiredVelocity, this.velocity);
        steer.limit(this.maxForce);
        steer.mult(1);
        this.applyForce(steer);
        if(d < 35) {
            //this.acceleration.limit(this.maxForce*d/50);
            //this.velocity.limit(this.maxVelocity*(-0.5 + d/50));
            this.acceleration.limit(0.05 + (d / 35) * .2);
            this.velocity.limit(this.maxSpeed * (0.2 + (d / 35) * .8));
            // this.velocity.limit(0.01);
            //this isn't doing anything...
            //find a better way to do this - limit max speed?
        }
    }
    follow(p) {

        var predict = this.velocity;
        predict.normalize();
        predict.mult(4);

        var predictLoc = Vector2D.add(this.pos, predict);
        var target = null;
        var bestDist = 100000;
        var dir = null;
        for(var i = 0; i < p.points.length - 1; i++) {
            var a = p.points[i]
            var b = p.points[i + 1];
            var normalPoint = Vector2D.getNormalPoint(predictLoc, a, b);
            if(normalPoint.x > Math.max(a.x, b.x) || normalPoint.x < Math.min(a.x, b.x) ||
                normalPoint.y > Math.max(a.y, b.y) || normalPoint.y < Math.min(a.y, b.y)) {
                normalPoint = new Vector2D(b.x, b.y);
                // if normal outside path just set point to the end of the current segment
            }
            var dist = Vector2D.distance(predictLoc, normalPoint);
            if(dist < bestDist) {
                target = normalPoint;
                bestDist = dist;
                dir = Vector2D.sub(b, a);
            }
        }
        if(dir == null) {
            dir = new Vector2D(1, 0);
            target = new Vector2D(1, 0);
        }
        dir.normalize();
        dir.mult(30);
        target.add(dir);

        var distance = Vector2D.distance(normalPoint, predictLoc);
        if(distance > p.radius) {
            this.seek(target);
        }

    }
    separate(units) {
        var desiredSeparation = 24;
        var sum = new Vector2D();
        var count = 0;
        //project a point in front of unit to draw sight circle around
        var visionPoint = new Vector2D(this.pos.x + 20 * Math.cos(this.angleFacing), this.pos.y + 20 * Math.sin(this.angleFacing));
        for(var i = 0; i < units.length; i++) {
            if(this.currentFloor == units[i].currentFloor) {
                var d = Vector2D.distance(this.pos, units[i].pos, true); //squared distances
                var d2 = Vector2D.distance(visionPoint, units[i].pos, true);
                if(d > 0 && d < desiredSeparation ** 2 && d2 < 20 ** 2) {
                    var diff = Vector2D.sub(this.pos, units[i].pos);
                    diff.normalize();
                    //diff.div(d);
                    sum.add(diff);
                    count++;
                    if(units[i].velocity.magnitude() <= this.velocity.magnitude()) {
                        this.goSlow = true;
                    }
                }
            }
        }
        if(count > 0) {
            sum.div(count);
            var steer = Vector2D.sub(sum, this.velocity);
            steer.limit(this.maxForce);

            steer.mult(2);
            //  this.brake();
            this.applyForce(steer);

        }

    }
    brake() {
        //var brakeForce = new Vector2D(-this.velocity.x,-this.velocity.y);
        //brakeForce.mult(0.5);
        //   this.applyForce(brakeForce);
        //  this.velocity.limit(0.001);
    }
    applyForce(force) {
        this.acceleration.add(force);
    }
}

class DijkstraMap {
    //need to work across all floors :(
    //3d time
    constructor(map) {
        //be careful when setting object properties, sometimes it's just a pointer!
        //map keeps getting pointed to instead of cloned...
        this.isCalculating = false;
        this.finishedCalculating = true;
        this.counter = 0;
        this.windowCost = 1234; //large value
        this.map = {};
        this.map = JSON.parse(JSON.stringify(getMap()));
        //this.map = {floor: map.floor, floors:map.floors, width:map.width, height:map.height};
        this.clear = '.,W-SVA';
        this.block = 'XDFB';
        this.cells = [];
        for(var i = 0; i < this.clear.length; i++) {
            for(var f = 0; f < this.map.floors; f++) {
                this.map.floor[f].data = this.map.floor[f].data.replaceAll(escapeRegExp(this.clear.substring(i, i + 1)), 'Y');
            }
        }
        for(var i = 0; i < this.block.length; i++) {
            for(var f = 0; f < this.map.floors; f++) {
                this.map.floor[f].data = this.map.floor[f].data.replaceAll(escapeRegExp(this.block.substring(i, i + 1)), 'N');
            }
        }

        for(var f = 0; f < this.map.floors; f++) {
            this.cells[f] = [];
            for(var i = 0; i < this.map.height; i++) {
                this.cells[f][i] = [];
                for(var j = 0; j < this.map.width; j++) {
                    this.cells[f][i][j] = -1;
                    var type = this.map.floor[f].data.charAt(i * this.map.width + j);

                    if(type == 'Y') {
                        this.cells[f][i][j] = 100000;
                    }
                }

            }
        }
        //arbitrary test value
        //this.setGoal(600, 300, 0);
        //full grid reset
        this.resetGrid(true);
    }
    setGoal(x, y, f = 0) {

        //console.log(this.cells);
        var xpos = Math.floor(x / tileSize);
        var ypos = Math.floor(y / tileSize);
        //  console.log(xpos,ypos,f);
        //  console.log(this.cells[f][ypos][xpos]);
        if(this.cells[f][ypos][xpos] >= 0) {
            this.resetGrid();
            this.cells[f][ypos][xpos] = 0;
            this.calculate();
        }


    }
    //goals = {x:,y:,floor:}
    setGoals(goals) {
        this.resetGrid();
        for(var g = 0; g < goals.length; g++) {
            var xpos = Math.floor(goals[g].x / tileSize);
            var ypos = Math.floor(goals[g].y / tileSize);
            var f = goals[g].floor;
            if(this.cells[f][ypos][xpos] >= 0) {
                this.cells[f][ypos][xpos] = 0;
            }
        }
        //this.calculate();
    }
    calculate() {
        if(this.finishedCalculating) {
            this.counter = 0;
        }
        this.isCalculating = true;
        this.finishedCalculating = false;
        //optimise: run over several frames?
        //had slow down on vkt but potentially due to graphics instead

        //dijkstra map algorithm
        //Iterate through the map's "floor" cells -- skip the impassable wall cells. 
        //If any floor tile has a value that is at least 2 greater than its lowest-value 
        //floor neighbour (in a cardinal direction - i.e. up, down, left or right), set it 
        //to be exactly 1 greater than its lowest value neighbour. 
        //Repeat until no changes are made.
        //let's ignore edge cases lol
        //console.log('being calculating');
        //error when zombie in same cell as player? length of path 0?

        //maybe write to a temporary map then overwrite when finished? Not really needed if we wait for calculation to finish before updating paths

        //new method - 2 step process. First use windows as goals set to a high value, then use players as goals but stop when reaching a window value
        //hopefully results in one-way behaviour

        //thoughts 09/18: might have to enable one way window pathfinding on a per-map basis, e.g. suitable on ndu but not verruckt
        //windowAttractor tile 'A' being used, pathing breaks if player enters these tiles however.
        //still having issues here - exterior calculation is ignoring stairs so have issues on first floor

        var hasChanged = true;
        var frameLimit = 10;
        var stepCounter = 0;
        var windowCost = this.windowCost;
        while(hasChanged == true && stepCounter < frameLimit) {
            //debugger;
            stepCounter++;
            this.counter++;
            //  console.log('iteration ',counter);
            hasChanged = false;
            for(var f = 0; f < this.map.floors; f++) {
                //  console.log('floor ',f);
                for(var i = 1; i < this.map.height - 1; i++) {
                    for(var j = 1; j < this.map.width - 1; j++) {
                        //stairs at (x,y)=
                        // 36,8 down
                        //36,9 up
                        //now go through list
                        if(this.cells[f][i][j] >= 0) {
                            //look at all neighbours
                            //how to check in 3d? :o

                            //3d stuff?

                            for(var a = 0; a < map.teleportPoints.length; a++) {
                                // to do: account for teleports to different positions, not just floor
                                var stairInfo = map.teleportPoints[a];

                                var diff = stairInfo.destFloor - f;
                                // console.log(diff);
                                if(f == stairInfo.floor && j == Math.floor(stairInfo.x / tileSize) && i == Math.floor(stairInfo.y / tileSize)) {

                                    if(this.cells[f + diff][i][j] >= 0 && this.cells[f + diff][i][j] - this.cells[f][i][j] < -1) {
                                        
                                        if(this.cells[f][i][j] !== windowCost && (this.cells[f + diff][i][j] < windowCost || this.cells[f][i][j] < windowCost)) {
                                            this.cells[f][i][j] = this.cells[f + diff][i][j] + 1;
                                            hasChanged = true;
                                        }

                                    }
                                }
                            }
                            /* if(f==0 && j==36&&i==8){
                             if(this.cells[f+1][i][j] >= 0 && this.cells[f+1][i][j] - this.cells[f][i][j] < -1){
                                 this.cells[f][i][j]=this.cells[f+1][i][j]+1;hasChanged=true;
                             }
                             }
                             if(f==1 && j==36&&i==9){
                             if(this.cells[f-1][i][j] >= 0 && this.cells[f-1][i][j] - this.cells[f][i][j] < -1){
                                 this.cells[f][i][j]=this.cells[f-1][i][j]+1;hasChanged=true;
                             }
                             }*/
                            /* if(f==0 && j==19&&i==11){
                             if(this.cells[f+1][i][j] >= 0 && this.cells[f+1][i][j] - this.cells[f][i][j] < -1){
                                 this.cells[f][i][j]=this.cells[f+1][i][j]+1;hasChanged=true;
                             }
                             }*/


                            //end 3d stuff (please make it work)
                            if(this.cells[f][i - 1][j] >= 0 && this.cells[f][i - 1][j] - this.cells[f][i][j] < -1) {
                                //don't change a window value or if neither of the values are below the windowCost threshold
                                if(this.cells[f][i][j] !== windowCost && (this.cells[f][i-1][j] < windowCost || this.cells[f][i][j] < windowCost)) {
                                    this.cells[f][i][j] = this.cells[f][i - 1][j] + 1;
                                    hasChanged = true;
                                }
                            }
                            if(this.cells[f][i + 1][j] >= 0 && this.cells[f][i + 1][j] - this.cells[f][i][j] < -1) {
                                if(this.cells[f][i][j] !== windowCost && (this.cells[f][i+1][j] < windowCost || this.cells[f][i][j] < windowCost)) {
                                    this.cells[f][i][j] = this.cells[f][i + 1][j] + 1;
                                    hasChanged = true;
                                }
                            }
                            if(this.cells[f][i][j - 1] >= 0 && this.cells[f][i][j - 1] - this.cells[f][i][j] < -1) {
                                if(this.cells[f][i][j] !== windowCost && (this.cells[f][i][j-1] < windowCost || this.cells[f][i][j] < windowCost)) {
                                    this.cells[f][i][j] = this.cells[f][i][j - 1] + 1;
                                    hasChanged = true;
                                }
                            }
                            if(this.cells[f][i][j + 1] >= 0 && this.cells[f][i][j + 1] - this.cells[f][i][j] < -1) {
                                if(this.cells[f][i][j] !== windowCost && (this.cells[f][i][j+1] < windowCost || this.cells[f][i][j] < windowCost)) {
                                    this.cells[f][i][j] = this.cells[f][i][j + 1] + 1;
                                    hasChanged = true;
                                }
                            }

                        }

                    }
                }

            }
        }
        if(hasChanged == false) {
            // console.log('Dijkstra Map calculation complete after '+this.counter+'iterations');
            this.isCalculating = false;
            this.finishedCalculating = true;
        }


    }
    resetGrid(full = false) {
        //set full to true to temporarily fix pathing issues? didn't work
       
        for(var f = 0; f < this.map.floors; f++) {
            for(var i = 0; i < this.map.height; i++) {
                if(full) {this.cells[f][i] = [];}
                for(var j = 0; j < this.map.width; j++) {
                    
                    var type = this.map.floor[f].data.charAt(i * this.map.width + j);

                    if(full) {
                        this.cells[f][i][j] = -1;
                        if(type == 'Y') {
                            this.cells[f][i][j] = 100000;
                        }
                    }
                    else { //partial reset
                        if(this.cells[f][i][j] < this.windowCost && type == 'Y') {
                            this.cells[f][i][j] = 100000;
                        }
                    }
                    /*if(getMap().floor[f].data.charAt(i * getMap().width + j) == 'W') {
                      //  this.cells[f][i][j] = 999;
                    }*/
                }

            }
        }

        //can block zombies in once they enter interior, but this has issues e.g. on verruckt, can't get to other players
        //or don't restrict but then some interior routes don't get used
        //could maybe use two maps in parallel, switching to the other once a window is reached...

        if(full) {
            console.log('full reset');
            for(var f = 0; f < this.map.floors; f++) {
                for(var i = 1; i < this.map.height - 1; i++) {
                    for(var j = 1; j < this.map.width - 1; j++) {
                        //changed from == 'W' to == 'A'
                        if(getMap().floor[f].data.charAt(i * getMap().width + j) == 'A') {
                            //uncomment to separate exterior/interior
                            //this.cells[f][i][j] = this.windowCost;
                        }
                    }
                }

            }

            //generate the dijkstra map using windows as targets set to windowCost
            //duplicate code for now
            //assume task can complete
            var hasChanged = true;
            while(hasChanged == true) {
                
                hasChanged = false;
                for(var f = 0; f < this.map.floors; f++) {
                    for(var i = 1; i < this.map.height - 1; i++) {
                        for(var j = 1; j < this.map.width - 1; j++) {
                            if(this.cells[f][i][j] >= 0) {
                                //look at all neighbours
                                for(var a = 0; a < map.teleportPoints.length; a++) {
                                    // to do: account for teleports to different positions, not just floor
                                    var stairInfo = map.teleportPoints[a];
                                    var diff = stairInfo.destFloor - f;
                                    if(f == stairInfo.floor && j == Math.floor(stairInfo.x / tileSize) && i == Math.floor(stairInfo.y / tileSize)) {

                                        if(this.cells[f + diff][i][j] >= 0 && this.cells[f + diff][i][j] - this.cells[f][i][j] < -1) {
                                                this.cells[f][i][j] = this.cells[f + diff][i][j] + 1;
                                                hasChanged = true;
                                        }
                                    }
                                }

                                if(this.cells[f][i - 1][j] >= 0 && this.cells[f][i - 1][j] - this.cells[f][i][j] < -1) {
                                     this.cells[f][i][j] = this.cells[f][i - 1][j] + 1;
                                    hasChanged = true;  
                                }
                                if(this.cells[f][i + 1][j] >= 0 && this.cells[f][i + 1][j] - this.cells[f][i][j] < -1) {
                                    this.cells[f][i][j] = this.cells[f][i + 1][j] + 1;
                                    hasChanged = true;
                                }
                                if(this.cells[f][i][j - 1] >= 0 && this.cells[f][i][j - 1] - this.cells[f][i][j] < -1) {
                                    this.cells[f][i][j] = this.cells[f][i][j - 1] + 1;
                                    hasChanged = true;
                                }
                                if(this.cells[f][i][j + 1] >= 0 && this.cells[f][i][j + 1] - this.cells[f][i][j] < -1) {
                                    this.cells[f][i][j] = this.cells[f][i][j + 1] + 1;
                                    hasChanged = true;
                                }
                            }


                        }

                    }
                }

            }
        }

        

    }
    findPath(startx, starty, f, preference = [0,1,2,3]) {
        startx = Math.floor(startx / tileSize);
        starty = Math.floor(starty / tileSize);

        //look at neighbouring point, if lower (lowest?) add to path and repeat

        var path = new Path();
        var searchx = startx;
        var searchy = starty;
        var searchF = f;
        var currentValue = 0;
        var continueSearch = true;
        var nextx = 0;
        var nexty = 0;
        var nextF = 0;

        var maxLoops = 7;
        var loopCount = 0;

        try {
            path.addPoint(tileSize / 2 + startx * tileSize, tileSize / 2 + starty * tileSize);
            while(continueSearch && loopCount < maxLoops) {
                loopCount++;
                continueSearch = false;
                currentValue = this.cells[searchF][searchy][searchx];

                //horrible method to make direction preferences for each zombie
                //appears to have some positive impact - sometimes zombies are very quick
                //to change entry attack points which is undesirable
                switch(preference[0]) {
                //up0
                case 0: if(this.cells[searchF][searchy - 1][searchx] >= 0 && this.cells[searchF][searchy - 1][searchx] < currentValue) {
                            continueSearch = true;
                            nextx = searchx;
                            nexty = searchy - 1;
                            nextF = searchF;
                        }
                        break;

                        //down1
                case 1: if(this.cells[searchF][searchy + 1][searchx] >= 0 && this.cells[searchF][searchy + 1][searchx] < currentValue) {
                            continueSearch = true;
                            nextx = searchx;
                            nexty = searchy + 1;
                            nextF = searchF;
                        }
                        break;

                //left2
                case 2: if(this.cells[searchF][searchy][searchx - 1] >= 0 && this.cells[searchF][searchy][searchx - 1] < currentValue) {
                            continueSearch = true;
                            nextx = searchx - 1;
                            nexty = searchy;
                            nextF = searchF;
                        }
                        break;
                //right3
                case 3: if(this.cells[searchF][searchy][searchx + 1] >= 0 && this.cells[searchF][searchy][searchx + 1] < currentValue) {
                            continueSearch = true;
                            nextx = searchx + 1;
                            nexty = searchy;
                            nextF = searchF;
                        }
                        break;
                }
                switch(preference[1]) {
                //up0
                case 0: if(this.cells[searchF][searchy - 1][searchx] >= 0 && this.cells[searchF][searchy - 1][searchx] < currentValue) {
                            continueSearch = true;
                            nextx = searchx;
                            nexty = searchy - 1;
                            nextF = searchF;
                        }
                        break;

                        //down1
                case 1: if(this.cells[searchF][searchy + 1][searchx] >= 0 && this.cells[searchF][searchy + 1][searchx] < currentValue) {
                            continueSearch = true;
                            nextx = searchx;
                            nexty = searchy + 1;
                            nextF = searchF;
                        }
                        break;

                //left2
                case 2: if(this.cells[searchF][searchy][searchx - 1] >= 0 && this.cells[searchF][searchy][searchx - 1] < currentValue) {
                            continueSearch = true;
                            nextx = searchx - 1;
                            nexty = searchy;
                            nextF = searchF;
                        }
                        break;
                //right3
                case 3: if(this.cells[searchF][searchy][searchx + 1] >= 0 && this.cells[searchF][searchy][searchx + 1] < currentValue) {
                            continueSearch = true;
                            nextx = searchx + 1;
                            nexty = searchy;
                            nextF = searchF;
                        }
                        break;
                }
                switch(preference[2]) {
                //up0
                case 0: if(this.cells[searchF][searchy - 1][searchx] >= 0 && this.cells[searchF][searchy - 1][searchx] < currentValue) {
                            continueSearch = true;
                            nextx = searchx;
                            nexty = searchy - 1;
                            nextF = searchF;
                        }
                        break;

                        //down1
                case 1: if(this.cells[searchF][searchy + 1][searchx] >= 0 && this.cells[searchF][searchy + 1][searchx] < currentValue) {
                            continueSearch = true;
                            nextx = searchx;
                            nexty = searchy + 1;
                            nextF = searchF;
                        }
                        break;

                //left2
                case 2: if(this.cells[searchF][searchy][searchx - 1] >= 0 && this.cells[searchF][searchy][searchx - 1] < currentValue) {
                            continueSearch = true;
                            nextx = searchx - 1;
                            nexty = searchy;
                            nextF = searchF;
                        }
                        break;
                //right3
                case 3: if(this.cells[searchF][searchy][searchx + 1] >= 0 && this.cells[searchF][searchy][searchx + 1] < currentValue) {
                            continueSearch = true;
                            nextx = searchx + 1;
                            nexty = searchy;
                            nextF = searchF;
                        }
                        break;
                }
                switch(preference[3]) {
                //up0
                case 0: if(this.cells[searchF][searchy - 1][searchx] >= 0 && this.cells[searchF][searchy - 1][searchx] < currentValue) {
                            continueSearch = true;
                            nextx = searchx;
                            nexty = searchy - 1;
                            nextF = searchF;
                        }
                        break;

                        //down1
                case 1: if(this.cells[searchF][searchy + 1][searchx] >= 0 && this.cells[searchF][searchy + 1][searchx] < currentValue) {
                            continueSearch = true;
                            nextx = searchx;
                            nexty = searchy + 1;
                            nextF = searchF;
                        }
                        break;

                //left2
                case 2: if(this.cells[searchF][searchy][searchx - 1] >= 0 && this.cells[searchF][searchy][searchx - 1] < currentValue) {
                            continueSearch = true;
                            nextx = searchx - 1;
                            nexty = searchy;
                            nextF = searchF;
                        }
                        break;
                //right3
                case 3: if(this.cells[searchF][searchy][searchx + 1] >= 0 && this.cells[searchF][searchy][searchx + 1] < currentValue) {
                            continueSearch = true;
                            nextx = searchx + 1;
                            nexty = searchy;
                            nextF = searchF;
                        }
                        break;
                }
                //stairs - stop search so that zombies don't go the wrong way
                //scaleable version with list
                //seems to have some issues going down on side stairs ndu, may be something I intended?

                for(var a = 0; a < map.teleportPoints.length; a++) {
                    var stairInfo = map.teleportPoints[a];
                    var diff = stairInfo.destFloor - searchF;

                    //j==Math.floor(stairInfo.y/tileSize) && i==Math.floor(stairInfo.x/tileSize
                    if(searchF == stairInfo.floor && searchx == Math.floor(stairInfo.x / tileSize) && searchy == Math.floor(stairInfo.y / tileSize) &&
                        this.cells[searchF + diff][searchy][searchx] < currentValue) {
                        nextx = searchx;
                        nexty = searchy;
                        nextF = searchF + diff;
                        continueSearch = false;
                        //  console.log('stairs');
                        //don't bother with next floor as it confuses zombies
                    }
                }
                /*  if(searchF==0 && searchx==36&&searchy==8 && this.cells[searchF+1][searchy][searchx]<currentValue){
                     continueSearch = true;
                     nextx = searchx;
                     nexty = searchy;
                     nextF = searchF+1; 
                     continueSearch = false;

                 }
                 
                 if(searchF==1 && searchx==36&&searchy==9 && this.cells[searchF-1][searchy][searchx]<currentValue){
                     continueSearch = true;
                     nextx = searchx;
                     nexty = searchy;
                     nextF = searchF-1;  
                      continueSearch = false;    
                  }*/
                //end stairs
                if(continueSearch == true) {
                    path.addPoint(tileSize / 2 + nextx * tileSize, tileSize / 2 + nexty * tileSize);
                }
                searchx = nextx;
                searchy = nexty;
                searchF = nextF;

            }
        } catch(e) {
            //console.log(e);
            //console.log('pathfinding error, sending zombie directly to player');
            //if out of map bounds, either send to player (if same floor) or to centre of map
            path = new Path();
            path.addPoint(startx, starty);
        }
        // taken out for now as not sure how to determine what the current target is (could run findpath fully maybe if more accuracy needed)
        //   if(f==players[0].currentFloor){path.addPoint(players[0].pos.x,players[0].pos.y);}
        if(path.points.length == 1) {
            path.addPoint(map.width * tileSize / 2, map.height * tileSize / 2);
        }

        //now check if we can take a shortcut for more 'natural' paths
        // console.log(path.points);

        // use new Vector2D otherwise path is affected by function
        var dest = Raytrace.castRay(new Vector2D(path.points[0].x, path.points[0].y), new Vector2D(path.points[path.points.length - 1].x, path.points[path.points.length - 1].y), f, 'na', true);

        //  console.log(path.points);
        //console.log(Vector2D.distance(path.points[0],dest,true) - Vector2D.distance(path.points[0],path.points[path.points.length-1],true));

        if(Vector2D.distance(path.points[0], dest, true) >= Vector2D.distance(path.points[0], path.points[path.points.length - 1], true)) {
            path.points.splice(1, path.points.length - 2); // remove middle points
            // console.log(path.points);
        }

        return path;
        //error detection code has screwed with pathfinding somehow? Maybe
        //improve path following somehow, maybe add random component to vector
    }

}

// TODO
/*
    Zombie pathfinding... go to window first? But how to implement with Dijkstra map,
    only want one-way entry...
    Window triggers - if zombie in trigger then attack window
    need different movement behaviour
    set deactivated windows to solid for zombies
    activate windows upon door purchase so path is found
    animations - can't help but feel this would be so much easier with a MovieClip

    Different weapons for player to hold

    wall weapons x

    different floors??? x

    death animations? explosion? x

    barrels

    a defined 'interior' where powerups are allowed to spawn, could maybe use crude rectangles customised for each map

    knife - mechanics done, animation? x

    triggers require new keypress

    add blood layer which only affects the floor - done, but overlaps floor holes, could fix with source-remove and yet another canvas

    maybe lag when zombies get lost off map?

    too many zombies spawning sometimes - round 3? When off map kills happen maybe

    weapon spread/accuracy

    complete weapon list - shotguns

    grenades

    mystery box functionality

    sin wave motion for zombies x

    fix zombies snapping to angle x

    walk slowed when walking backwards? x

    menu x

    camera panning after death

    wall edges on tiles

    stop gun sounds on weapon change

    fix camera bounds issue... x

    can't see bullets from other players beneath you

    extra decal layers for lightning, power on and off?

    collisions for decals

    could shorten zombie paths if they can see a few steps ahead

    bullets not detected if already inside zombie at start x

    knife doesn't work on other floors than 1 x

    massive drawimage lag in lower stairs room upstairs, sometimes in kitchen on vkt
    - two rectangles, same y coordinates? WHY
    - MAGICAL FIX doubling size of CANVAS_WIDTH and CANVAS_HEIGHT, no idea why this made any difference
    - partially solved by not drawing layers underneath?

    massive lag when first seeing a different floor (higher)

    player can't 'slide' against walls in some directions

    don't need to redraw entire map buffer for doors

    reloading progress bar

    reviving

    perks

    framerate drop when rendering death red screen

    Dreams: - many tile shape types complete with perfect collision detection
            - collision physics (box2d?)
            - 'walls', dynamic doors and mystery box animations
            - fun gameplay: how to make snipers unique, more arcadey movement
            - 2.5d/3d remake

    //march 2018 update

    polygon raycasting
    polygon pathfinding - approximate fine(r) grid and generate at start?
    zombies pathfinding - how to deal with windows? Can treat as walkable if destroyed, but may result in zombies getting stuck inside, or attempted destruction from inside which is undersirable
                          - probably need to use triggers outside each window to aggro the zombie until the barricade is destroyed
                          - could revert to finding a window if path to player unavailable, but then after one window is opened all zombies would go there
                          - could always go to a window... but then can't have player in outside areas ever :/ would be a nice feature
                          - use a line as window and calculate normal vector and determine side? Use this when ray casting for zombie path?

    - feedback: could use some sort of aiming reticule as it's hard for new players to aim
    -           -> maybe switch from angle-based aiming to reticule for certain weapons
*/


//begin initialization

//globals


//sat - level polygons

function loadMapGeometry(name) {

    if(name=='ndu') {
        //floor 0
        obstacleContainer.Add(new Polygon(new Vector(352,240), [new Vector(-32,-16),new Vector(32,-16),new Vector(32,16),new Vector(-32,16)]));
        obstacleContainer.Add(new Polygon(new Vector(336,320), [new Vector(-16,-64),new Vector(16,-64),new Vector(16,64),new Vector(-16,64)]));
        obstacleContainer.Add(new Polygon(new Vector(400,432), [new Vector(-80,-16),new Vector(80,-16),new Vector(80,16),new Vector(-80,16)]));
        obstacleContainer.Add(new Polygon(new Vector(480,240), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(496,288), [new Vector(16,-32),new Vector(16,32),new Vector(-16,32),new Vector(-16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(656,240), [new Vector(-80,-16),new Vector(-80,16),new Vector(80,16),new Vector(80,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(864,240), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(848,288), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(848,400), [new Vector(-16,-48),new Vector(-16,48),new Vector(16,48),new Vector(16,-48)]));
        obstacleContainer.Add(new Polygon(new Vector(672,432), [new Vector(160,-16),new Vector(-160,-16),new Vector(-160,16),new Vector(160,16)]));
        obstacleContainer.Add(new Polygon(new Vector(560,384), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(640,368), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(656,400), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(720,368), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(784,368), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(461,269), [new Vector(-21,-13),new Vector(-13,3),new Vector(-5,11),new Vector(19,11),new Vector(19,-13)]));
       // obstacleContainer.Add(new Polygon(new Vector(467,298), [new Vector(-11,-18),new Vector(-11,-2),new Vector(-3,14),new Vector(13,22),new Vector(13,-18)]));
        obstacleContainer.Add(new Polygon(new Vector(752,240), [new Vector(-16,-16),new Vector(16,-16),new Vector(16,16),new Vector(-16,16)]));
        obstacleContainer.Add(new Polygon(new Vector(640,480), [new Vector(-32,-32),new Vector(-32,32),new Vector(32,32),new Vector(32,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(768,496), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(880,496), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(832,464), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(880,432), [new Vector(-16,-16),new Vector(16,-16),new Vector(16,16),new Vector(-16,16)]));
        obstacleContainer.Add(new Polygon(new Vector(1168,600), [new Vector(-16,-88),new Vector(16,-88),new Vector(16,88),new Vector(-16,88)]));
        obstacleContainer.Add(new Polygon(new Vector(1216,432), [new Vector(-64,16),new Vector(64,16),new Vector(64,-16),new Vector(-64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1245,184), [new Vector(35,-88),new Vector(-69,40),new Vector(35,48)]));
        obstacleContainer.Add(new Polygon(new Vector(1248,320), [new Vector(-32,-96),new Vector(-32,96),new Vector(32,96),new Vector(32,-96)]));
        obstacleContainer.Add(new Polygon(new Vector(1232,672), [new Vector(-48,16),new Vector(-48,-16),new Vector(48,-16),new Vector(48,16)]));

        //mystery box
       // obstacleContainer.Add(new Polygon(new Vector(896,282), [new Vector(-31,-2),new Vector(-20,24),new Vector(31,1),new Vector(19,-24)]));
        obstacleContainer.Add(new Polygon(new Vector(899,282), [new Vector(-34,-1),new Vector(-21,24),new Vector(28,1),new Vector(29,-26)]));



        obstacleContainer.Add(new Polygon(new Vector(1072,240), [new Vector(-144,-16),new Vector(-144,16),new Vector(144,16),new Vector(144,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1200,336), [new Vector(16,80),new Vector(16,-80),new Vector(-16,-80),new Vector(-16,80)]));
        obstacleContainer.Add(new Polygon(new Vector(1168,384), [new Vector(16,32),new Vector(-16,32),new Vector(-16,-32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(1136,288), [new Vector(16,32),new Vector(-16,32),new Vector(-16,-32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(1072,272), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1008,288), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(1136,400), [new Vector(-16,-48),new Vector(16,-48),new Vector(16,48),new Vector(-16,48)]));
        obstacleContainer.Add(new Polygon(new Vector(1136,640), [new Vector(-16,-128),new Vector(16,-128),new Vector(16,128),new Vector(-16,128)]));
        obstacleContainer.Add(new Polygon(new Vector(1104,752), [new Vector(-16,-16),new Vector(16,-16),new Vector(16,16),new Vector(-16,16)]));
        obstacleContainer.Add(new Polygon(new Vector(960,752), [new Vector(96,-16),new Vector(96,16),new Vector(-96,16),new Vector(-96,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(880,720), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(880,624), [new Vector(-16,-48),new Vector(-16,48),new Vector(16,48),new Vector(16,-48)]));
        obstacleContainer.Add(new Polygon(new Vector(880,528), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1008,688), [new Vector(-16,16),new Vector(16,16),new Vector(16,-16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1008,592), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1008,496), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        //floor 0 windows

        obstacleContainer.Add(new Polygon(new Vector(400,228), [new Vector(-32,-4),new Vector(-32,4),new Vector(32,4),new Vector(32,-4)])).setType('window').setId('1');
        obstacleContainer.Add(new Polygon(new Vector(560,228), [new Vector(-32,-4),new Vector(-32,4),new Vector(32,4),new Vector(32,-4)])).setType('window').setId('2');
        obstacleContainer.Add(new Polygon(new Vector(784,228), [new Vector(-32,-4),new Vector(-32,4),new Vector(32,4),new Vector(32,-4)])).setType('window').setId('3');
        obstacleContainer.Add(new Polygon(new Vector(1148,480), [new Vector(4,-48),new Vector(-4,-48),new Vector(-4,48),new Vector(4,48)])).setType('window').setId('4');
        obstacleContainer.Add(new Polygon(new Vector(1072,764), [new Vector(32,4),new Vector(32,-4),new Vector(-32,-4),new Vector(-32,4)])).setType('window').setId('5');
        obstacleContainer.Add(new Polygon(new Vector(868,688), [new Vector(-4,32),new Vector(4,32),new Vector(4,-32),new Vector(-4,-32)])).setType('window').setId('6');
        obstacleContainer.Add(new Polygon(new Vector(868,560), [new Vector(-4,32),new Vector(4,32),new Vector(4,-32),new Vector(-4,-32)])).setType('window').setId('7');
        obstacleContainer.Add(new Polygon(new Vector(496,444), [new Vector(32,4),new Vector(32,-4),new Vector(-32,-4),new Vector(-32,4)])).setType('window').setId('8');
        obstacleContainer.Add(new Polygon(new Vector(324,400), [new Vector(-4,32),new Vector(4,32),new Vector(4,-32),new Vector(-4,-32)])).setType('window').setId('9');

        //floor 0 doors
        //help door
        obstacleContainer.Add(new Polygon(new Vector(848,336), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)])).setType('door').setId('help_door');
        //help room stairs
        obstacleContainer.Add(new Polygon(new Vector(1168,304), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)])).setType('door').setId('help_stairs_door');
        obstacleContainer.Add(new Polygon(new Vector(1168,304), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1)).setType('door').setId('help_stairs_door');
       
        //ascend from darkness stairs
        obstacleContainer.Add(new Polygon(new Vector(592,400), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)])).setType('door').setId('ascend_stairs_door');
        obstacleContainer.Add(new Polygon(new Vector(592,400), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)],1)).setType('door').setId('ascend_stairs_door');


        //floor 0 interior
        obstacleContainer.AddInterior(new Polygon(new Vector(736,336), [new Vector(-384,-80),new Vector(-384,80),new Vector(384,80),new Vector(384,-80)],0));
        obstacleContainer.AddInterior(new Polygon(new Vector(1152,304), [new Vector(-32,-48),new Vector(32,-48),new Vector(32,48),new Vector(-32,48)],0));
        obstacleContainer.AddInterior(new Polygon(new Vector(1008,576), [new Vector(-112,-160),new Vector(-112,160),new Vector(112,160),new Vector(112,-160)],0));
        //floor 1
        obstacleContainer.Add(new Polygon(new Vector(1435,704), [new Vector(-11,-16),new Vector(21,0),new Vector(-11,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(336,336), [new Vector(-16,-112),new Vector(-16,112),new Vector(16,112),new Vector(16,-112)],1));
        obstacleContainer.Add(new Polygon(new Vector(784,240), [new Vector(-432,-16),new Vector(432,-16),new Vector(432,16),new Vector(-432,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1200,336), [new Vector(16,-80),new Vector(16,80),new Vector(-16,80),new Vector(-16,-80)],1));
        obstacleContainer.Add(new Polygon(new Vector(1168,384), [new Vector(-16,-32),new Vector(16,-32),new Vector(16,32),new Vector(-16,32)],1));
        obstacleContainer.Add(new Polygon(new Vector(1136,416), [new Vector(-16,-128),new Vector(16,-128),new Vector(16,128),new Vector(-16,128)],1));
        obstacleContainer.Add(new Polygon(new Vector(1136,608), [new Vector(-16,-32),new Vector(16,-32),new Vector(16,32),new Vector(-16,32)],1));
        obstacleContainer.Add(new Polygon(new Vector(1104,656), [new Vector(48,-16),new Vector(48,16),new Vector(-48,16),new Vector(-48,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1136,736), [new Vector(-16,-32),new Vector(16,-32),new Vector(16,32),new Vector(-16,32)],1));
        obstacleContainer.Add(new Polygon(new Vector(1104,752), [new Vector(16,16),new Vector(-16,16),new Vector(-16,-16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(960,752), [new Vector(96,-16),new Vector(96,16),new Vector(-96,16),new Vector(-96,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(880,608), [new Vector(16,128),new Vector(-16,128),new Vector(-16,-128),new Vector(16,-128)],1));
        obstacleContainer.Add(new Polygon(new Vector(784,432), [new Vector(112,-16),new Vector(112,16),new Vector(-112,16),new Vector(-112,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(480,432), [new Vector(160,-16),new Vector(160,16),new Vector(-160,16),new Vector(-160,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(384,272), [new Vector(32,-16),new Vector(32,16),new Vector(-32,16),new Vector(-32,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(368,384), [new Vector(-16,-32),new Vector(16,-32),new Vector(16,32),new Vector(-16,32)],1));
        obstacleContainer.Add(new Polygon(new Vector(400,400), [new Vector(-16,-16),new Vector(16,-16),new Vector(16,16),new Vector(-16,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(496,336), [new Vector(-16,80),new Vector(-16,-80),new Vector(16,-80),new Vector(16,80)],1));
        obstacleContainer.Add(new Polygon(new Vector(557,320), [new Vector(-45,-32),new Vector(-13,-32),new Vector(51,0),new Vector(51,32),new Vector(-45,32)],1));
        obstacleContainer.Add(new Polygon(new Vector(544,384), [new Vector(32,32),new Vector(-32,32),new Vector(-32,-32),new Vector(32,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(848,384), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(848,288), [new Vector(16,32),new Vector(-16,32),new Vector(-16,-32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(1008,656), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(720,528), [new Vector(144,-16),new Vector(144,16),new Vector(-144,16),new Vector(-144,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(592,480), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(688,464), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(592,368), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1008,688), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1008,592), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1008,496), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(816,480), [new Vector(16,-32),new Vector(16,32),new Vector(-16,32),new Vector(-16,-32)],1));

        
        //bottom fence, not window
        obstacleContainer.Add(new Polygon(new Vector(1072,752), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)],1));


        //floor 1 windows
        //might need to block some of these... maybe have a triggered zombie spawn?
        obstacleContainer.Add(new Polygon(new Vector(1148,560), [new Vector(4,-24),new Vector(4,24),new Vector(-4,24),new Vector(-4,-24)],1)).setType('window').setId('10');
        obstacleContainer.Add(new Polygon(new Vector(1148,688), [new Vector(4,-24),new Vector(4,24),new Vector(-4,24),new Vector(-4,-24)],1)).setType('window').setId('11');
        obstacleContainer.Add(new Polygon(new Vector(868,464), [new Vector(4,-24),new Vector(4,24),new Vector(-4,24),new Vector(-4,-24)],1)).setType('window').setId('12');
        obstacleContainer.Add(new Polygon(new Vector(656,444), [new Vector(24,4),new Vector(-24,4),new Vector(-24,-4),new Vector(24,-4)],1)).setType('window').setId('13');

        //floor 1 interior
        obstacleContainer.AddInterior(new Polygon(new Vector(736,336), [new Vector(-384,-80),new Vector(-384,80),new Vector(384,80),new Vector(384,-80)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(1152,304), [new Vector(-32,-48),new Vector(32,-48),new Vector(32,48),new Vector(-32,48)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(1008,576), [new Vector(-112,-160),new Vector(-112,160),new Vector(112,160),new Vector(112,-160)],1));
        
    }

    if(name == 'vkt') {
        //floor 0
        obstacleContainer.Add(new Polygon(new Vector(464,240), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(432,320), [new Vector(16,-96),new Vector(-16,-96),new Vector(-16,96),new Vector(16,96)]));
        obstacleContainer.Add(new Polygon(new Vector(368,432), [new Vector(80,-16),new Vector(80,16),new Vector(-80,16),new Vector(-80,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(272,464), [new Vector(16,-48),new Vector(-16,-48),new Vector(-16,48),new Vector(16,48)]));
        obstacleContainer.Add(new Polygon(new Vector(272,624), [new Vector(16,-80),new Vector(-16,-80),new Vector(-16,80),new Vector(16,80)]));
        obstacleContainer.Add(new Polygon(new Vector(464,656), [new Vector(176,16),new Vector(176,-16),new Vector(-176,-16),new Vector(-176,16)]));
        obstacleContainer.Add(new Polygon(new Vector(592,640), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)]));
        obstacleContainer.Add(new Polygon(new Vector(272,768), [new Vector(-16,-32),new Vector(16,-32),new Vector(16,32),new Vector(-16,32)]));
        obstacleContainer.Add(new Polygon(new Vector(368,816), [new Vector(-112,-16),new Vector(-112,16),new Vector(112,16),new Vector(112,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(464,960), [new Vector(-16,-128),new Vector(-16,128),new Vector(16,128),new Vector(16,-128)]));
        obstacleContainer.Add(new Polygon(new Vector(576,1104), [new Vector(-128,-16),new Vector(-128,16),new Vector(128,16),new Vector(128,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(592,1072), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(560,816), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(592,880), [new Vector(-16,-112),new Vector(16,-112),new Vector(16,112),new Vector(-16,112)]));
        obstacleContainer.Add(new Polygon(new Vector(640,944), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(544,496), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(592,480), [new Vector(-16,32),new Vector(16,32),new Vector(16,-32),new Vector(-16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(624,240), [new Vector(-112,-16),new Vector(-112,16),new Vector(112,16),new Vector(112,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(592,320), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)]));
        obstacleContainer.Add(new Polygon(new Vector(656,320), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(800,304), [new Vector(-128,-16),new Vector(-128,16),new Vector(128,16),new Vector(128,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(720,272), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(816,352), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(912,336), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(912,416), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(864,432), [new Vector(32,-16),new Vector(-32,-16),new Vector(-32,16),new Vector(32,16)]));
        obstacleContainer.Add(new Polygon(new Vector(816,448), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(752,656), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(816,608), [new Vector(-16,-96),new Vector(-16,96),new Vector(16,96),new Vector(16,-96)]));
        obstacleContainer.Add(new Polygon(new Vector(896,528), [new Vector(64,16),new Vector(-64,16),new Vector(-64,-16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(944,560), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(944,736), [new Vector(-16,-128),new Vector(-16,128),new Vector(16,128),new Vector(16,-128)]));
        obstacleContainer.Add(new Polygon(new Vector(880,848), [new Vector(48,-16),new Vector(-48,-16),new Vector(-48,16),new Vector(48,16)]));
        obstacleContainer.Add(new Polygon(new Vector(816,816), [new Vector(-16,-48),new Vector(16,-48),new Vector(16,48),new Vector(-16,48)]));
        obstacleContainer.Add(new Polygon(new Vector(816,912), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(864,944), [new Vector(-128,-16),new Vector(-128,16),new Vector(128,16),new Vector(128,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1088,944), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(816,1104), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(688,1136), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(688,1216), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(800,1232), [new Vector(-96,-16),new Vector(-96,16),new Vector(96,16),new Vector(96,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(960,1104), [new Vector(-32,-16),new Vector(32,-16),new Vector(32,16),new Vector(-32,16)]));
        obstacleContainer.Add(new Polygon(new Vector(976,1168), [new Vector(-16,-48),new Vector(-16,48),new Vector(16,48),new Vector(16,-48)]));
        obstacleContainer.Add(new Polygon(new Vector(1088,1232), [new Vector(-160,-16),new Vector(-160,16),new Vector(160,16),new Vector(160,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1120,1136), [new Vector(-32,-16),new Vector(32,-16),new Vector(32,16),new Vector(-32,16)]));
        obstacleContainer.Add(new Polygon(new Vector(1072,1184), [new Vector(80,-32),new Vector(80,32),new Vector(-80,32),new Vector(-80,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(1168,1040), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1200,944), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1232,1072), [new Vector(-16,-144),new Vector(16,-144),new Vector(16,144),new Vector(-16,144)]));
        obstacleContainer.Add(new Polygon(new Vector(1008,336), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1072,336), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1008,432), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1072,432), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1296,976), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1296,1072), [new Vector(-16,16),new Vector(-16,-16),new Vector(16,-16),new Vector(16,16)]));
        obstacleContainer.Add(new Polygon(new Vector(1296,1168), [new Vector(-16,-16),new Vector(16,-16),new Vector(16,16),new Vector(-16,16)]));
        obstacleContainer.Add(new Polygon(new Vector(1136,208), [new Vector(16,80),new Vector(-16,80),new Vector(-16,-80),new Vector(16,-80)]));
        obstacleContainer.Add(new Polygon(new Vector(1440,144), [new Vector(-288,-16),new Vector(288,-16),new Vector(288,16),new Vector(-288,16)]));
        obstacleContainer.Add(new Polygon(new Vector(1168,336), [new Vector(-16,-80),new Vector(16,-80),new Vector(16,80),new Vector(-16,80)]));
        obstacleContainer.Add(new Polygon(new Vector(1744,384), [new Vector(-16,-256),new Vector(16,-256),new Vector(16,256),new Vector(-16,256)]));
        obstacleContainer.Add(new Polygon(new Vector(1440,432), [new Vector(288,-16),new Vector(288,16),new Vector(-288,16),new Vector(-288,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1488,480), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(1440,784), [new Vector(-96,-16),new Vector(-96,16),new Vector(96,16),new Vector(96,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1552,864), [new Vector(-16,96),new Vector(16,96),new Vector(16,-96),new Vector(-16,-96)]));
        obstacleContainer.Add(new Polygon(new Vector(1488,944), [new Vector(48,-16),new Vector(48,16),new Vector(-48,16),new Vector(-48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1424,880), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1424,880), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1408,912), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1360,1088), [new Vector(16,-160),new Vector(-16,-160),new Vector(-16,160),new Vector(16,160)]));
        obstacleContainer.Add(new Polygon(new Vector(1568,1232), [new Vector(-192,-16),new Vector(-192,16),new Vector(192,16),new Vector(192,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1776,1168), [new Vector(-16,80),new Vector(-16,-80),new Vector(16,-80),new Vector(16,80)]));
        obstacleContainer.Add(new Polygon(new Vector(1824,1104), [new Vector(-32,-16),new Vector(32,-16),new Vector(32,16),new Vector(-32,16)]));
        obstacleContainer.Add(new Polygon(new Vector(1840,1024), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)]));
        obstacleContainer.Add(new Polygon(new Vector(1808,896), [new Vector(16,96),new Vector(-16,96),new Vector(-16,-96),new Vector(16,-96)]));
        obstacleContainer.Add(new Polygon(new Vector(1840,736), [new Vector(-16,-96),new Vector(-16,96),new Vector(16,96),new Vector(16,-96)]));
        obstacleContainer.Add(new Polygon(new Vector(1728,656), [new Vector(-96,-16),new Vector(-96,16),new Vector(96,16),new Vector(96,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1424,496), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1424,560), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1488,480), [new Vector(-16,32),new Vector(-16,-32),new Vector(16,-32),new Vector(16,32)]));
        obstacleContainer.Add(new Polygon(new Vector(1280,464), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1328,512), [new Vector(-16,-64),new Vector(16,-64),new Vector(16,64),new Vector(-16,64)]));
        obstacleContainer.Add(new Polygon(new Vector(1264,560), [new Vector(48,16),new Vector(-48,16),new Vector(-48,-16),new Vector(48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1296,512), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(1248,496), [new Vector(32,16),new Vector(-32,16),new Vector(-32,-16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1488,576), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(1600,592), [new Vector(-96,-16),new Vector(-96,16),new Vector(96,16),new Vector(96,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1648,624), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(1424,688), [new Vector(-80,80),new Vector(-80,-80),new Vector(80,-80),new Vector(80,80)]));
        obstacleContainer.Add(new Polygon(new Vector(592,1008), [new Vector(-16,-80),new Vector(-16,80),new Vector(16,80),new Vector(16,-80)]));

        //floor 0 windows
        obstacleContainer.Add(new Polygon(new Vector(496,228), [new Vector(-32,-4),new Vector(-32,4),new Vector(32,4),new Vector(32,-4)])).setType('window').setId('1');
        obstacleContainer.Add(new Polygon(new Vector(260,528), [new Vector(-4,-32),new Vector(4,-32),new Vector(4,32),new Vector(-4,32)])).setType('window').setId('2');
        obstacleContainer.Add(new Polygon(new Vector(260,720), [new Vector(-4,-32),new Vector(4,-32),new Vector(4,32),new Vector(-4,32)])).setType('window').setId('3');
        obstacleContainer.Add(new Polygon(new Vector(676,1168), [new Vector(-4,-32),new Vector(4,-32),new Vector(4,32),new Vector(-4,32)])).setType('window').setId('4');
        obstacleContainer.Add(new Polygon(new Vector(912,1244), [new Vector(-32,-4),new Vector(-32,4),new Vector(32,4),new Vector(32,-4)])).setType('window').setId('5');
        obstacleContainer.Add(new Polygon(new Vector(1008,932), [new Vector(-32,-4),new Vector(-32,4),new Vector(32,4),new Vector(32,-4)])).setType('window').setId('6');
        obstacleContainer.Add(new Polygon(new Vector(1168,932), [new Vector(-16,-4),new Vector(-16,4),new Vector(16,4),new Vector(16,-4)])).setType('window').setId('7');
        obstacleContainer.Add(new Polygon(new Vector(828,880), [new Vector(4,-32),new Vector(-4,-32),new Vector(-4,32),new Vector(4,32)])).setType('window').setId('8');
        obstacleContainer.Add(new Polygon(new Vector(956,592), [new Vector(-4,-32),new Vector(-4,32),new Vector(4,32),new Vector(4,-32)])).setType('window').setId('9');
        obstacleContainer.Add(new Polygon(new Vector(828,496), [new Vector(-4,-32),new Vector(4,-32),new Vector(4,32),new Vector(-4,32)])).setType('window').setId('10');
        obstacleContainer.Add(new Polygon(new Vector(924,368), [new Vector(-4,-32),new Vector(4,-32),new Vector(4,32),new Vector(-4,32)])).setType('window').setId('11');
        obstacleContainer.Add(new Polygon(new Vector(1476,528), [new Vector(-4,-32),new Vector(4,-32),new Vector(4,32),new Vector(-4,32)])).setType('window').setId('12');

        //floor 0 interior
        obstacleContainer.AddInterior(new Polygon(new Vector(544,544), [new Vector(-256,-96),new Vector(-256,96),new Vector(256,96),new Vector(256,-96)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(576,352), [new Vector(-128,-96),new Vector(-128,96),new Vector(128,96),new Vector(128,-96)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(752,384), [new Vector(48,64),new Vector(-48,64),new Vector(-48,-64),new Vector(48,-64)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(848,368), [new Vector(-48,-48),new Vector(-48,48),new Vector(48,48),new Vector(48,-48)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(880,688), [new Vector(-48,-144),new Vector(48,-144),new Vector(48,144),new Vector(-48,144)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(560,736), [new Vector(-272,-64),new Vector(-272,64),new Vector(272,64),new Vector(272,-64)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(528,944), [new Vector(-48,-144),new Vector(-48,144),new Vector(48,144),new Vector(48,-144)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(672,656), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(704,944), [new Vector(-96,-144),new Vector(-96,144),new Vector(96,144),new Vector(96,-144)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(960,1152), [new Vector(-256,-64),new Vector(-256,64),new Vector(256,64),new Vector(256,-64)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(1008,1024), [new Vector(-208,-64),new Vector(-208,64),new Vector(208,64),new Vector(208,-64)],1));
        obstacleContainer.AddInterior(new Polygon(new Vector(1616,544), [new Vector(-112,-96),new Vector(-112,96),new Vector(112,96),new Vector(112,-96)],1));

        //floor 1
        obstacleContainer.Add(new Polygon(new Vector(656,240), [new Vector(80,-16),new Vector(80,16),new Vector(-80,16),new Vector(-80,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(592,272), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(608,304), [new Vector(64,-16),new Vector(64,16),new Vector(-64,16),new Vector(-64,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(560,416), [new Vector(-16,-96),new Vector(-16,96),new Vector(16,96),new Vector(16,-96)],1));
        obstacleContainer.Add(new Polygon(new Vector(656,496), [new Vector(-80,-16),new Vector(80,-16),new Vector(80,16),new Vector(-80,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(720,544), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(784,560), [new Vector(-48,-16),new Vector(48,-16),new Vector(48,16),new Vector(-48,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(816,528), [new Vector(16,16),new Vector(-16,16),new Vector(-16,-16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1040,496), [new Vector(-240,-16),new Vector(-240,16),new Vector(240,16),new Vector(240,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1328,496), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(720,368), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(880,400), [new Vector(-176,-16),new Vector(-176,16),new Vector(176,16),new Vector(176,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(848,272), [new Vector(-144,-16),new Vector(-144,16),new Vector(144,16),new Vector(144,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(992,240), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1008,176), [new Vector(-16,48),new Vector(-16,-48),new Vector(16,-48),new Vector(16,48)],1));
        obstacleContainer.Add(new Polygon(new Vector(1040,144), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1424,144), [new Vector(-336,-16),new Vector(-336,16),new Vector(336,16),new Vector(336,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1744,416), [new Vector(-16,-224),new Vector(-16,224),new Vector(16,224),new Vector(16,-224)],1));
        obstacleContainer.Add(new Polygon(new Vector(1696,240), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1344,240), [new Vector(-192,-16),new Vector(-192,16),new Vector(192,16),new Vector(192,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1232,320), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)],1));
        obstacleContainer.Add(new Polygon(new Vector(1296,400), [new Vector(-144,-16),new Vector(-144,16),new Vector(144,16),new Vector(144,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1632,400), [new Vector(-96,-16),new Vector(-96,16),new Vector(96,16),new Vector(96,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1360,608), [new Vector(-16,-192),new Vector(-16,192),new Vector(16,192),new Vector(16,-192)],1));
        obstacleContainer.Add(new Polygon(new Vector(1408,656), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1696,656), [new Vector(-160,-16),new Vector(160,-16),new Vector(160,16),new Vector(-160,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1680,688), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1840,752), [new Vector(-16,-80),new Vector(-16,80),new Vector(16,80),new Vector(16,-80)],1));
        obstacleContainer.Add(new Polygon(new Vector(1808,832), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(1808,928), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(1680,864), [new Vector(-16,-96),new Vector(-16,96),new Vector(16,96),new Vector(16,-96)],1));
        obstacleContainer.Add(new Polygon(new Vector(1472,784), [new Vector(96,-16),new Vector(96,16),new Vector(-96,16),new Vector(-96,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1552,880), [new Vector(16,-80),new Vector(16,80),new Vector(-16,80),new Vector(-16,-80)],1));
        obstacleContainer.Add(new Polygon(new Vector(1488,976), [new Vector(-208,-16),new Vector(-208,16),new Vector(208,16),new Vector(208,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1808,976), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1840,1056), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)],1));
        obstacleContainer.Add(new Polygon(new Vector(1776,1104), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1360,944), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1360,1008), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1392,1104), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1552,1104), [new Vector(-80,-16),new Vector(-80,16),new Vector(80,16),new Vector(80,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1648,592), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1696,560), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1776,1184), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)],1));
        obstacleContainer.Add(new Polygon(new Vector(1744,1232), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1520,1232), [new Vector(176,-16),new Vector(176,16),new Vector(-176,16),new Vector(-176,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1360,1152), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)],1));
        obstacleContainer.Add(new Polygon(new Vector(1328,1280), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)],1));
        obstacleContainer.Add(new Polygon(new Vector(1104,880), [new Vector(368,-16),new Vector(368,16),new Vector(-368,16),new Vector(-368,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(720,848), [new Vector(-16,-48),new Vector(-16,48),new Vector(16,48),new Vector(16,-48)],1));
        obstacleContainer.Add(new Polygon(new Vector(688,816), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(592,816), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(560,896), [new Vector(-16,-96),new Vector(-16,96),new Vector(16,96),new Vector(16,-96)],1));
        obstacleContainer.Add(new Polygon(new Vector(880,976), [new Vector(304,-16),new Vector(304,16),new Vector(-304,16),new Vector(-304,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(720,1008), [new Vector(-80,-16),new Vector(-80,16),new Vector(80,16),new Vector(80,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(816,1024), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(656,1088), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)],1));
        obstacleContainer.Add(new Polygon(new Vector(656,1280), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)],1));
        obstacleContainer.Add(new Polygon(new Vector(752,1328), [new Vector(-80,-16),new Vector(-80,16),new Vector(80,16),new Vector(80,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(816,1264), [new Vector(-16,-48),new Vector(-16,48),new Vector(16,48),new Vector(16,-48)],1));
        obstacleContainer.Add(new Polygon(new Vector(928,1264), [new Vector(-96,-16),new Vector(-96,16),new Vector(96,16),new Vector(96,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1008,1312), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(1168,1328), [new Vector(144,-16),new Vector(144,16),new Vector(-144,16),new Vector(-144,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1168,1232), [new Vector(-80,-16),new Vector(-80,16),new Vector(80,16),new Vector(80,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1232,1152), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)],1));
        obstacleContainer.Add(new Polygon(new Vector(1120,1136), [new Vector(-32,-16),new Vector(32,-16),new Vector(32,16),new Vector(-32,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1136,1088), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));
        obstacleContainer.Add(new Polygon(new Vector(1200,1072), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1379,526), [new Vector(-2,-23),new Vector(2,-14),new Vector(4,1),new Vector(1,13),new Vector(-4,19)],1));
        obstacleContainer.Add(new Polygon(new Vector(1280,560), [new Vector(64,-16),new Vector(64,16),new Vector(-64,16),new Vector(-64,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(1200,544), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1));

        //floor 1 windows
        obstacleContainer.Add(new Polygon(new Vector(1072,132), [new Vector(-16,-4),new Vector(-16,4),new Vector(16,4),new Vector(16,-4)],1)).setType('window').setId('13');
        obstacleContainer.Add(new Polygon(new Vector(1756,176), [new Vector(-4,-16),new Vector(-4,16),new Vector(4,16),new Vector(4,-16)],1)).setType('window').setId('14');
        obstacleContainer.Add(new Polygon(new Vector(1820,880), [new Vector(-4,-16),new Vector(-4,16),new Vector(4,16),new Vector(4,-16)],1)).setType('window').setId('15');
        obstacleContainer.Add(new Polygon(new Vector(1712,1244), [new Vector(16,4),new Vector(-16,4),new Vector(-16,-4),new Vector(16,-4)],1)).setType('window').setId('16');
        obstacleContainer.Add(new Polygon(new Vector(644,1184), [new Vector(4,32),new Vector(-4,32),new Vector(-4,-32),new Vector(4,-32)],1)).setType('window').setId('17');
        obstacleContainer.Add(new Polygon(new Vector(640,804), [new Vector(-32,4),new Vector(-32,-4),new Vector(32,-4),new Vector(32,4)],1)).setType('window').setId('18');
        obstacleContainer.Add(new Polygon(new Vector(1372,912), [new Vector(4,16),new Vector(-4,16),new Vector(-4,-16),new Vector(4,-16)],1)).setType('window').setId('19');
        obstacleContainer.Add(new Polygon(new Vector(1296,508), [new Vector(16,4),new Vector(-16,4),new Vector(-16,-4),new Vector(16,-4)],1)).setType('window').setId('20');


        //doors
        obstacleContainer.Add(new Polygon(new Vector(656,272), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)])).setType('door').setId('north_stairs');
        obstacleContainer.Add(new Polygon(new Vector(656,272), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)],1)).setType('door').setId('north_stairs');
        obstacleContainer.Add(new Polygon(new Vector(672,656), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)])).setType('door').setId('power_door');
        obstacleContainer.Add(new Polygon(new Vector(512,816), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)])).setType('door').setId('pap_room');
        obstacleContainer.Add(new Polygon(new Vector(704,944), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)])).setType('door').setId('south_room');
        obstacleContainer.Add(new Polygon(new Vector(1184,1136), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)])).setType('door').setId('south_room_stairs');
        obstacleContainer.Add(new Polygon(new Vector(1184,1136), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)],1)).setType('door').setId('south_room_stairs');

        obstacleContainer.Add(new Polygon(new Vector(1104,240), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)],1)).setType('door').setId('upstairs_left_door_1');
        obstacleContainer.Add(new Polygon(new Vector(1488,400), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)],1)).setType('door').setId('left_power_room_door');
        obstacleContainer.Add(new Polygon(new Vector(1488,656), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)],1)).setType('door').setId('right_power_room_door');
        obstacleContainer.Add(new Polygon(new Vector(1728,976), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)],1)).setType('door').setId('upstairs_right_door_2');
        obstacleContainer.Add(new Polygon(new Vector(1360,1056), [new Vector(-16,-32),new Vector(-16,32),new Vector(16,32),new Vector(16,-32)],1)).setType('door').setId('upstairs_right_door_1');

        //floor 1 interior
        obstacleContainer.AddInterior(new Polygon(new Vector(800,368), [new Vector(-224,-112),new Vector(-224,112),new Vector(224,112),new Vector(224,-112)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(768,512), [new Vector(-32,-32),new Vector(-32,32),new Vector(32,32),new Vector(32,-32)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(1552,624), [new Vector(-176,-144),new Vector(-176,144),new Vector(176,144),new Vector(176,-144)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(1376,320), [new Vector(-352,-160),new Vector(-352,160),new Vector(352,160),new Vector(352,-160)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(1776,736), [new Vector(-48,-64),new Vector(-48,64),new Vector(48,64),new Vector(48,-64)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(1680,880), [new Vector(-112,112),new Vector(-112,-112),new Vector(112,-112),new Vector(112,112)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(1008,1088), [new Vector(-336,-192),new Vector(-336,192),new Vector(336,192),new Vector(336,-192)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(640,896), [new Vector(-64,-64),new Vector(-64,64),new Vector(64,64),new Vector(64,-64)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(736,1296), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(1168,1296), [new Vector(-144,-16),new Vector(-144,16),new Vector(144,16),new Vector(144,-16)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(1552,1104), [new Vector(-208,-112),new Vector(-208,112),new Vector(208,112),new Vector(208,-112)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(1792,1040), [new Vector(-32,-48),new Vector(-32,48),new Vector(32,48),new Vector(32,-48)]));

    }


    if(name == 'five') {
        //floor 0
        obstacleContainer.Add(new Polygon(new Vector(448,848), [new Vector(-128,-16),new Vector(-128,16),new Vector(128,16),new Vector(128,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(640,848), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(656,768), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)]));
        obstacleContainer.Add(new Polygon(new Vector(608,720), [new Vector(32,-16),new Vector(32,16),new Vector(-32,16),new Vector(-32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(528,720), [new Vector(16,16),new Vector(-16,16),new Vector(-16,-16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(528,784), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(256,848), [new Vector(32,-16),new Vector(32,16),new Vector(-32,16),new Vector(-32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(240,784), [new Vector(16,48),new Vector(-16,48),new Vector(-16,-48),new Vector(16,-48)]));
        obstacleContainer.Add(new Polygon(new Vector(224,720), [new Vector(64,-16),new Vector(64,16),new Vector(-64,16),new Vector(-64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(208,688), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(336,720), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(432,720), [new Vector(-80,-16),new Vector(-80,16),new Vector(80,16),new Vector(80,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(624,688), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(624,528), [new Vector(-16,-112),new Vector(-16,112),new Vector(16,112),new Vector(16,-112)]));
        obstacleContainer.Add(new Polygon(new Vector(624,368), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(576,336), [new Vector(64,-16),new Vector(64,16),new Vector(-64,16),new Vector(-64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(672,336), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(720,384), [new Vector(-16,-64),new Vector(16,-64),new Vector(16,64),new Vector(-16,64)]));
        obstacleContainer.Add(new Polygon(new Vector(752,432), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(464,336), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(384,336), [new Vector(64,-16),new Vector(64,16),new Vector(-64,16),new Vector(-64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(304,336), [new Vector(16,-16),new Vector(-16,-16),new Vector(-16,16),new Vector(16,16)]));
        obstacleContainer.Add(new Polygon(new Vector(208,528), [new Vector(16,112),new Vector(-16,112),new Vector(-16,-112),new Vector(16,-112)]));
        obstacleContainer.Add(new Polygon(new Vector(208,368), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(224,336), [new Vector(32,-16),new Vector(32,16),new Vector(-32,16),new Vector(-32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(208,256), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)]));
        obstacleContainer.Add(new Polygon(new Vector(400,208), [new Vector(-144,-16),new Vector(-144,16),new Vector(144,16),new Vector(144,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(400,272), [new Vector(16,-16),new Vector(16,16),new Vector(-16,16),new Vector(-16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(640,208), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(688,128), [new Vector(16,-64),new Vector(16,64),new Vector(-16,64),new Vector(-16,-64)]));
        obstacleContainer.Add(new Polygon(new Vector(752,80), [new Vector(-48,-16),new Vector(-48,16),new Vector(48,16),new Vector(48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(768,192), [new Vector(-32,-32),new Vector(-32,32),new Vector(32,32),new Vector(32,-32)]));
        obstacleContainer.Add(new Polygon(new Vector(784,240), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(848,208), [new Vector(-48,16),new Vector(-48,-16),new Vector(48,-16),new Vector(48,16)]));
        obstacleContainer.Add(new Polygon(new Vector(864,292), [new Vector(0,-68),new Vector(0,68)]));
        obstacleContainer.Add(new Polygon(new Vector(880,288), [new Vector(-16,-64),new Vector(-16,64),new Vector(16,64),new Vector(16,-64)]));
        obstacleContainer.Add(new Polygon(new Vector(816,336), [new Vector(48,-16),new Vector(48,16),new Vector(-48,16),new Vector(-48,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(784,304), [new Vector(-16,16),new Vector(-16,-16),new Vector(16,-16),new Vector(16,16)]));
        obstacleContainer.Add(new Polygon(new Vector(848,496), [new Vector(-16,-144),new Vector(-16,144),new Vector(16,144),new Vector(16,-144)]));

        obstacleContainer.Add(new Polygon(new Vector(304,528), [new Vector(-16,-112),new Vector(16,-112),new Vector(16,112),new Vector(-16,112)]));
        obstacleContainer.Add(new Polygon(new Vector(448,432), [new Vector(-64,-16),new Vector(-64,16),new Vector(64,16),new Vector(64,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(560,432), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(560,624), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(269,501), [new Vector(19,-85),new Vector(-13,-77),new Vector(-13,-53),new Vector(-13,107),new Vector(19,107)]));
        obstacleContainer.Add(new Polygon(new Vector(400,542), [new Vector(-16,-94),new Vector(-16,98),new Vector(16,90),new Vector(16,-94)]));
        obstacleContainer.Add(new Polygon(new Vector(448,544), [new Vector(-32,-96),new Vector(-32,96),new Vector(32,96),new Vector(32,-96)]));
        obstacleContainer.Add(new Polygon(new Vector(496,480), [new Vector(16,-32),new Vector(16,32),new Vector(-16,32),new Vector(-16,-32)]));

        obstacleContainer.Add(new Polygon(new Vector(208,112), [new Vector(-16,-80),new Vector(-16,80),new Vector(16,80),new Vector(16,-80)]));
        obstacleContainer.Add(new Polygon(new Vector(256,48), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(384,80), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(400,144), [new Vector(-16,-48),new Vector(-16,48),new Vector(16,48),new Vector(16,-48)]));
        obstacleContainer.Add(new Polygon(new Vector(624,108), [new Vector(-48,-84),new Vector(-48,84),new Vector(48,84),new Vector(48,-84)]));
        obstacleContainer.Add(new Polygon(new Vector(472,180), [new Vector(56,12),new Vector(56,-12),new Vector(-56,-12),new Vector(-56,12)]));
        obstacleContainer.Add(new Polygon(new Vector(532,152), [new Vector(-4,16),new Vector(4,8),new Vector(4,-8),new Vector(-4,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(483,139), [new Vector(45,-3),new Vector(45,-27),new Vector(-67,-27),new Vector(-67,29),new Vector(45,29)]));
        obstacleContainer.Add(new Polygon(new Vector(640,229), [new Vector(-19,-5),new Vector(-16,1),new Vector(-5,4),new Vector(8,4),new Vector(16,1),new Vector(19,-5)]));
        obstacleContainer.Add(new Polygon(new Vector(759,234), [new Vector(-4,-8),new Vector(-8,-3),new Vector(-8,3),new Vector(-3,8),new Vector(4,8),new Vector(9,4),new Vector(9,-10)]));
        obstacleContainer.Add(new Polygon(new Vector(633,785), [new Vector(7,-18),new Vector(0,-16),new Vector(-4,-12),new Vector(-5,0),new Vector(-4,12),new Vector(3,17),new Vector(8,18)]));
        obstacleContainer.Add(new Polygon(new Vector(332,165), [new Vector(-17,-2),new Vector(1,17),new Vector(18,1),new Vector(-3,-17)]));
        obstacleContainer.Add(new Polygon(new Vector(356,152), [new Vector(-16,6),new Vector(-7,13),new Vector(14,-6),new Vector(7,-12)]));
        obstacleContainer.Add(new Polygon(new Vector(353,139), [new Vector(1,7),new Vector(-8,0),new Vector(-4,-8),new Vector(10,2)]));
        obstacleContainer.Add(new Polygon(new Vector(234,104), [new Vector(-10,23),new Vector(10,23),new Vector(10,-23),new Vector(-11,-22)]));
        obstacleContainer.Add(new Polygon(new Vector(257,97), [new Vector(-12,3),new Vector(-2,13),new Vector(14,-4),new Vector(-1,-12)]));
        obstacleContainer.Add(new Polygon(new Vector(269,74), [new Vector(19,-10),new Vector(19,10),new Vector(-18,11),new Vector(-19,-11)]));


        //floor 0 interior
        obstacleContainer.AddInterior(new Polygon(new Vector(544,272), [new Vector(-320,-48),new Vector(320,-48),new Vector(320,48),new Vector(-320,48)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(416,512), [new Vector(-192,-192),new Vector(192,-192),new Vector(192,192),new Vector(-192,192)]));
        obstacleContainer.AddInterior(new Polygon(new Vector(448,768), [new Vector(-192,-64),new Vector(-192,64),new Vector(192,64),new Vector(192,-64)]));

        //at round start choose only 4 of the 6 windows to spawn zombies. A new set of 4 is chosen after the power is turned on
    }

    if(name == 'test') {
        //floor 0
        obstacleContainer.Add(new Polygon(new Vector(112,240), [new Vector(-16,-48),new Vector(16,-48),new Vector(16,48),new Vector(-16,48)]));
        obstacleContainer.Add(new Polygon(new Vector(160,272), [new Vector(-32,-16),new Vector(32,-16),new Vector(32,16),new Vector(-32,16)]));
        obstacleContainer.Add(new Polygon(new Vector(208,304), [new Vector(-16,-48),new Vector(16,-48),new Vector(16,48),new Vector(-16,48)]));
        obstacleContainer.Add(new Polygon(new Vector(176,208), [new Vector(-16,-16),new Vector(-16,16),new Vector(16,16),new Vector(16,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(208,176), [new Vector(-16,48),new Vector(16,48),new Vector(16,-48),new Vector(-16,-48)]));
        obstacleContainer.Add(new Polygon(new Vector(352,144), [new Vector(-128,-16),new Vector(128,-16),new Vector(128,16),new Vector(-128,16)]));
        obstacleContainer.Add(new Polygon(new Vector(464,256), [new Vector(-16,-96),new Vector(-16,96),new Vector(16,96),new Vector(16,-96)]));
        obstacleContainer.Add(new Polygon(new Vector(336,336), [new Vector(112,-16),new Vector(112,16),new Vector(-112,16),new Vector(-112,-16)]));
        obstacleContainer.Add(new Polygon(new Vector(416,272), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)]));

        //window
        obstacleContainer.Add(new Polygon(new Vector(200,240), [new Vector(-8,-32),new Vector(-2,-32),new Vector(-2,32),new Vector(-8,32)])).setType('window').setId('one');


            //floor 1

        obstacleContainer.Add(new Polygon(new Vector(464,240), [new Vector(-16,-112),new Vector(16,-112),new Vector(16,112),new Vector(-16,112)],1));
        obstacleContainer.Add(new Polygon(new Vector(320,144), [new Vector(128,-16),new Vector(128,16),new Vector(-128,16),new Vector(-128,-16)],1));
        obstacleContainer.Add(new Polygon(new Vector(208,240), [new Vector(16,-80),new Vector(16,80),new Vector(-16,80),new Vector(-16,-80)],1));
        obstacleContainer.Add(new Polygon(new Vector(144,240), [new Vector(-48,-48),new Vector(48,-48),new Vector(48,48),new Vector(-48,48)],1));
        obstacleContainer.Add(new Polygon(new Vector(320,336), [new Vector(-128,-16),new Vector(128,-16),new Vector(128,16),new Vector(-128,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(368,304), [new Vector(16,16),new Vector(16,-16),new Vector(-16,-16),new Vector(-16,16)],1));
        obstacleContainer.Add(new Polygon(new Vector(384,272), [new Vector(-32,-16),new Vector(-32,16),new Vector(32,16),new Vector(32,-16)],1));

    }
}


//some setgoals error when hitting corner?
//

//polygon container
var obstacleContainer = new ObstacleContainer();
var cols = ['#558844', '#DD2244'];
var tileTypes = {
    grass: '#077524',
    wall: '#7c746c',
    tile: '#bfc9c2',
    carpet: '#0d684a',
    door: '#684b0d',
    window: '#c3ebf7'
};

var NUM_PLAYERS = 0;
var MAP_NAME = '';

var canvasBuffer = {};
canvasBuffer.floor = [];
canvasBuffer.walls = [];
canvasBuffer.blood = [];



var w = 640, h = 480;

//heavily affects lag...
var CANVAS_WIDTH = w; //640;
var CANVAS_HEIGHT = h; //480; // increases this fixed unknown drawimage lag at parts of map...
//xxx*1 from xxx*2 helped, gpu acceleration still falls over when many floors are rendered
//buffer height/width in tiles, size 32
var BUFFER_WIDTH = 70;
var BUFFER_HEIGHT = 50;
//making buffers too large destroys performance...
//resolution for multiple players may need adjusting



var fps = 60;
var interval = 1000 / fps;
var d = new Date().getTime();
var lastTime = 0;
var currentTime = d;
var delta = 0;


var runGame = false;
var gameEnded = false;

CanvasRenderingContext2D.prototype.fillCircle = function(xpos, ypos, radius) {
    this.beginPath();
    this.arc(xpos, ypos, radius, 0, 2 * Math.PI);
    this.fill();
    this.closePath();
};
CanvasRenderingContext2D.prototype.strokeCircle = function(xpos, ypos, radius) {
    this.beginPath();
    this.arc(xpos, ypos, radius, 0, 2 * Math.PI);
    this.stroke();
    this.closePath();
};


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


var scrollSpeed = 1.25;
var scrollVector = new Vector2D();
Mousetrap.bind('a', function() {
    scrollVector.x = scrollSpeed;
});
Mousetrap.bind('a', function() {
    scrollVector.x = 0;
}, 'keyup');
Mousetrap.bind('d', function() {
    scrollVector.x = -scrollSpeed;
});
Mousetrap.bind('d', function() {
    scrollVector.x = 0;
}, 'keyup');
Mousetrap.bind('w', function() {
    scrollVector.y = scrollSpeed;
});
Mousetrap.bind('w', function() {
    scrollVector.y = 0;
}, 'keyup');
Mousetrap.bind('s', function() {
    scrollVector.y = -scrollSpeed;
});
Mousetrap.bind('s', function() {
    scrollVector.y = 0;
}, 'keyup');

var transformVector = new Vector2D();

var mousePos = new Vector2D();
var tileSize = 32;
var tilesWidth = Math.floor(w / tileSize);
var tilesHeight = Math.floor(h / tileSize);
var tiles = [];

var map;
var mapClassInstance;
// = new Maps().getMap();
//map.data = map.floor[0].data;



var canvases = [];

var cameraLocation = {
    x: 0,
    y: 0,
    floor: 0
};

var cameraBorders = [];
//if x/y 0, then will screw up at top left corner? :/
cameraBorders['test'] = {
    x: -1,
    y: -1,
    w: 20,
    h: 16
};
cameraBorders['ndu'] = {
    x: 5,
    y: 2,
    w: 34,
    h: 26
};
cameraBorders['vkt'] = {
    x: 3,
    y: 1,
    w: 65,
    h: 43
};
cameraBorders['five'] = {
    x: 3,
    y: 3,
    w: 27,
    h: 26
};
var cameraBorder = cameraBorders[MAP_NAME];

var Images = new ImageManager();

//try 4 copies of sound manager for ease
//player-specific sounds should be played/stopped in the respective manager
//var Sounds = new SoundManager();
var SMInstance = [];
for(var i = 0; i < 4; i++) {
    SMInstance.push(new SoundManager);
}
var Sounds = SMInstance[0];

var MysteryBox = new MysteryBoxManager();

var playerFacing = 0;
var spriteTestNum = 0;
var spriteTestNumZom = 0;

var dijkstraMap;


var players = [];


//players[0].weapon = new Weapon('Kar98k');
//players[0].weapon = new Weapon('M1Carbine');
//players[0].weapon = new Weapon('M1Thompson');

var GameStage = new Stage();

//var ray = new Vector2D();
var gameCamera = new Camera();
//gameCamera.setBoundingRect(cameraBorders[MAP_NAME]);
//init zombies
var zombies = [];

var roundManager;
var gameStarted = false;

var offset = Math.round(Math.random() * 4);



//var asd = Raytrace.castRay(new Vector2D(200,200),new Vector2D(300,100));
//var origin = new Vector2D(100,100);

var thinkCount = 1;
var filterStrength = 5;
var frameTime = 0,
    lastLoop = new Date,
    thisLoop;

// Report the fps only every second, to only lightly affect measurements
/*var fpsOut = document.getElementById('fps');
setInterval(function(){
  fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps";
},1000);*/

var hasDrawnBuffer = false;

/*
window.onload = function() {
    this.main();
}
*/

//end initialization


function init(mapName='vkt', numPlayers = 1, resWidth = 640, resHeight = 480) {
   
    NUM_PLAYERS = numPlayers;
    MAP_NAME = mapName;


    w = resWidth;
    h = resHeight;
    CANVAS_WIDTH = resWidth;
    CANVAS_HEIGHT = resHeight;
    //set up canvas buffers
    for(var i = 0; i < 4; i++) {

        canvasBuffer.floor[i] = document.createElement('canvas');
        canvasBuffer.floor[i].width = BUFFER_WIDTH * 32;
        canvasBuffer.floor[i].height = BUFFER_HEIGHT * 32;
        canvasBuffer.floor[i].ctx = canvasBuffer.floor[i].getContext('2d');

        canvasBuffer.walls[i] = document.createElement('canvas');
        canvasBuffer.walls[i].width = BUFFER_WIDTH * 32;
        canvasBuffer.walls[i].height = BUFFER_HEIGHT * 32;
        canvasBuffer.walls[i].ctx = canvasBuffer.walls[i].getContext('2d');

        canvasBuffer.blood[i] = document.createElement('canvas');
        canvasBuffer.blood[i].width = BUFFER_WIDTH * 32;
        canvasBuffer.blood[i].height = BUFFER_HEIGHT * 32;
        canvasBuffer.blood[i].ctx = canvasBuffer.blood[i].getContext('2d');
    }

    //drawlayers not currently used!
    /*var drawLayers = [];
    for(var i = 0;i<4;i++){
    drawLayers[i]= document.createElement('canvas');
    drawLayers[i].width = CANVAS_WIDTH*8;
    drawLayers[i].height = CANVAS_HEIGHT*8;
    drawLayers[i].ctx = drawLayers[i].getContext('2d');
    }*/

    var firstCanvas = document.createElement('canvas');
    firstCanvas.width = CANVAS_WIDTH;
    firstCanvas.height = CANVAS_HEIGHT;
    firstCanvas.ctx = firstCanvas.getContext('2d');


    var secondCanvas = document.createElement('canvas');
    secondCanvas.width = CANVAS_WIDTH;
    secondCanvas.height = CANVAS_HEIGHT;
    secondCanvas.ctx = secondCanvas.getContext('2d');

    var thirdCanvas = document.createElement('canvas');
    thirdCanvas.width = CANVAS_WIDTH;
    thirdCanvas.height = CANVAS_HEIGHT;
    thirdCanvas.ctx = thirdCanvas.getContext('2d');


    var fourthCanvas = document.createElement('canvas');
    fourthCanvas.width = CANVAS_WIDTH;
    fourthCanvas.height = CANVAS_HEIGHT;
    fourthCanvas.ctx = fourthCanvas.getContext('2d');

    canvases = [firstCanvas.ctx, secondCanvas.ctx, thirdCanvas.ctx, fourthCanvas.ctx];

    roundManager = new RoundManager();

    loadMapGeometry(MAP_NAME);

for(var n = 0; n < NUM_PLAYERS; n++) {
    players.push(new Player(n));

    players[n].playerFacing = 2 * Math.PI * Math.random();
    players[n].addWeapon('M1911');
    //players[n].addWeapon('doublebarreled');
}

    if(NUM_PLAYERS >= 1) {
        var loc = 'container';
        document.getElementById(loc).appendChild(firstCanvas);
        if(NUM_PLAYERS == 2) {
            loc = 'container2';
            document.getElementById(loc).appendChild(secondCanvas);
        }
        if(NUM_PLAYERS > 2) {
            document.getElementById('container').appendChild(secondCanvas);
            document.getElementById('container2').appendChild(thirdCanvas);
        }
        if(NUM_PLAYERS > 3) {
            document.getElementById('container2').appendChild(fourthCanvas);
        }
    }

    firstCanvas.onmousedown = regen;
    firstCanvas.onmouseup = mouseUpHandler;
    window.onmousemove = mouseMove;
    window.onkeydown = keyDownHandler;
    window.onkeyup = keyUpHandler;

    runGame = true;
    gameEnded = false;

    tiles = [];

    mapClassInstance = new Maps();
    map = mapClassInstance.getMap();
    map.data = map.floor[0].data;

    cameraLocation = {x: 0,y: 0,floor: 0};
    cameraBorder = cameraBorders[MAP_NAME];

    //new image/soundmanager/???

    playerFacing = 0;
    spriteTestNum = 0;
    spriteTestNumZom = 0;
    dijkstraMap = new DijkstraMap(map);

    /*players = [];

    for(var n = 0; n < NUM_PLAYERS; n++) {
        players.push(new Player());

        players[n].playerFacing = 2 * Math.PI * Math.random();
        players[n].addWeapon('M1911');
    }*/

    GameStage = new Stage();
    gameCamera = new Camera();
    gameCamera.setBoundingRect(cameraBorders[MAP_NAME]);
    zombies = [];

    for(var i = 0; i < 40; i++) {
        var r = Math.random();
        var xpos = 0;
        var ypos = 0;
        if(r < 0.25) {
            xpos = Math.random() * map.width * tileSize;
            ypos = -Math.random() * 4 * tileSize;
        }
        if(r < 0.5) {
            xpos = Math.random() * map.width * tileSize;
            ypos = (map.height + Math.random() * 4) * tileSize;
        }
        if(r < 0.75) {
            ypos = Math.random() * map.height * tileSize;
            xpos = -Math.random() * 4 * tileSize;
        } else {
            ypos = Math.random() * map.height * tileSize;
            xpos = (map.width + Math.random() * 4) * tileSize;
        }
        zombies[i] = new Zombie(xpos, ypos);
        zombies[i].maxSpeed = 0.8 + Math.random() * 0.25;
        //speed range 1+1.25 is fastest for high difficulty - need to adjust turning though
        zombies[i].maxForce = 1;
        zombies[i].velocity.x = 1;
        zombies[i].alive = false;
        zombies[i].preference = shuffle(zombies[i].preference);
    }

    //roundManager = new RoundManager();
    gameStarted = false;

    

    for(var f = 0; f < map.floors; f++) {
        tiles[f] = [];
        for(var i = 0; i < map.height; i++) {
            tiles[f][i] = [];
            for(var j = 0; j < map.width; j++) {
                tiles[f][i][j] = new Tile(new Vector2D(tileSize * (j % map.width), i * tileSize), tileSize);
                //tiles[i][j].setType('hello');
                var type = map.floor[f].data.charAt(i * map.width + j);

                tiles[f][i][j].setType(type);
                //replace grass tiles to air (old lazy method of map defining)
                /*if(f !== 0 && tiles[f][i][j].type == 'grass') {
                    tiles[f][i][j].walkable = false;
                    tiles[f][i][j].passable = false;
                }*/
                // if(Math.random() > 0.8){tiles[i][j].passable = false;}
            }
        }
    }

    offset = Math.round(Math.random() * 4);
    for(var n = 0; n < NUM_PLAYERS; n++) {
        players[n].pos.x = map.spawnPoints[(n + offset) % map.spawnPoints.length].x;
        players[n].pos.y = map.spawnPoints[(n + offset) % map.spawnPoints.length].y;
        players[n].currentFloor = map.spawnPoints[(n + offset) % map.spawnPoints.length].floor;
        //console.log('Player ', n, 'spawned');
    }

    hasDrawnBuffer = false;

    setTimeout(function() {
        roundManager.nextRound();
         gameStarted = true;
        }, 7500);

    main();


}



function main() {

    var thisFrameTime = (thisLoop = new Date) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;

    window.requestAnimationFrame(main);

    currentTime = (new Date()).getTime();
    delta = (currentTime - lastTime);

    if(delta > interval && runGame == true) {
        //main game loop

        // ctx.transform(1,0,0,1,0,0);
        // ctx.clearRect(0,0,w,h);
        thinkCount++;
        if(thinkCount > 60) {

            //test for exterior/interior divide
            //if(dijkstraMap.cells[0][21][10] < 1234) {console.log('exterior failed');}
            
            //start calculation of a new dijkstra map
            if(!dijkstraMap.isCalculating) {
                var goals = [];
                for(var p = 0; p < NUM_PLAYERS; p++) {
                    if(getLivingPlayers() == 0 || players[p].down == false) {
                        goals.push({
                            x: players[p].pos.x,
                            y: players[p].pos.y,
                            floor: players[p].currentFloor
                        });
                    }
                }
                //console.log(goals);
                dijkstraMap.setGoals(goals);
            }

            //march commented
            dijkstraMap.calculate();

            //updatezombiepaths when complete - hopefully no map is so yuge that it will take more than 600 iterations
            if(dijkstraMap.finishedCalculating) {
                updateZombiePath();
                thinkCount = 0;
            }


        }

        spriteTestNum++;
        spriteTestNumZom++;

        if(spriteTestNum % 12 == 0) {
            spriteTestNum = 0;

            for(var p = 0; p < NUM_PLAYERS; p++) {
                // Images.nextFrame();spriteTestNum=0;
                if(!players[p].down && players[p].moving) {
                    players[p].currentFrame++;
                    if(players[p].currentFrame == players[p].maxFrames) {
                        players[p].currentFrame = 0;
                    }
                } else {
                    players[p].currentFrame = 0;
                }
            }
        }



        if(spriteTestNumZom % 18 == 0) {
            for(var i = 0; i < zombies.length; i++) {
                zombies[i].currentFrame++;
                if(zombies[i].currentFrame == zombies[i].maxFrames) {
                    zombies[i].currentFrame = 0;
                }
            }
        }
        updatePositions();
        //cameraLocation = new Vector2D(200,200);
        //     ctx.setTransform(1,0,0,1,-Math.floor(cameraLocation.x),-Math.floor(cameraLocation.y));

        checkProximityActions();
        if(!hasDrawnBuffer) {
            redrawMapBuffer();
        }
        //if(cameraLocation.x !== 0 && cameraLocation.y !== 0){

        //ctx.setTransform(1,0,0,1,-Math.floor(cameraLocation.x),-Math.floor(cameraLocation.y));
        //ctx.setTransform(1,0,0,1,0,0);

        // }
        for(var p = 0; p < NUM_PLAYERS; p++) {
            var ctx = canvases[p];
            //currently use one gamecamera object for all players
            gameCamera.follow(players[p],p);
            ctx.setTransform(1, 0, 0, 1, -gameCamera.x, -gameCamera.y);
            //does clearrect have any effect?
            //ctx.clearRect(0,0,w,h);
            renderAssets(ctx);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            renderHud(ctx, p);
        }
        // var f = parseInt(players[0].currentFloor);
        //    players[0].currentFloor = 1;

        /*  gameCamera.follow(players[1]);
          secondCanvas.ctx.clearRect(0,0,w,h);
         secondCanvas.ctx.setTransform(1,0,0,1,-gameCamera.x,-gameCamera.y);
           renderAssets(secondCanvas.ctx);
           secondCanvas.ctx.setTransform(1,0,0,1,0,0);
        //players[0].currentFloor = f;

         gameCamera.follow(players[2]);
              thirdCanvas.ctx.clearRect(0,0,w,h);
        thirdCanvas.ctx.setTransform(1,0,0,1,-gameCamera.x,-gameCamera.y);
           renderAssets(thirdCanvas.ctx);
           thirdCanvas.ctx.setTransform(1,0,0,1,0,0);
           

             gameCamera.follow(players[3]);
              fourthCanvas.ctx.clearRect(0,0,w,h);
        fourthCanvas.ctx.setTransform(1,0,0,1,-gameCamera.x,-gameCamera.y);
           renderAssets(fourthCanvas.ctx);
           fourthCanvas.ctx.setTransform(1,0,0,1,0,0);
           

           renderHud(ctx,0);
           renderHud(secondCanvas.ctx,1);
           renderHud(thirdCanvas.ctx,2);
           renderHud(fourthCanvas.ctx,3);
            */



        for(var i = 0; i < NUM_PLAYERS; i++) {
            //render player bullet over multiple frames to avoid issue with them sometimes not being shown
            if(players[i].drawLaser > 0) {
                players[i].drawLaser--;
            }
        }
    }



    lastTime = currentTime - (delta % interval);

}

    //var asd = 0;
    //something is screwing up here when input is true...
function updatePositions() {

    for(var p = 0; p < NUM_PLAYERS; p++) {
        var isRotating = false;
        if(players[p].down == false) {
            // p=1;
            var ang = Math.atan2(input[p].axis1, input[p].axis0);
            if(input[p].axis0) {
                if(Math.abs(input[p].axis2) + Math.abs(input[p].axis3) > 0.4) {
                    // players[0].playerFacing = Math.atan2(input.axis3*(Math.abs(input.axis3)>0.1?1:0),input.axis2*(Math.abs(input.axis2)?1:0));
                    var angDiff = limit(AngleDifference(Math.atan2(input[p].axis3 * (Math.abs(input[p].axis3) > 0.1 ? 1 : 0), input[p].axis2 * (Math.abs(input[p].axis2) ? 1 : 0)), players[p].playerFacing), Math.PI * 2 / players[p].weapon.rotateSpeed) / 5;

                    players[p].playerFacing -= angDiff;
                    if(Math.abs(angDiff) > 0.01) {
                        isRotating = true;
                    }
                }
                var speedMult = 1; //speed penalty for walking backwards
                if(Math.abs(AngleDifference(players[p].playerFacing, Math.atan2(input[p].axis1 * (Math.abs(input[p].axis1) > 0.1 ? 1 : 0), input[p].axis0 * (Math.abs(input[p].axis0) ? 1 : 0)))) > Math.PI / 2) {
                    speedMult = 0.75;
                }
                scrollVector.x = -Math.cos(ang) * (Math.abs(input[p].axis0) > 0.1 ? 1 : 0) * speedMult;

                scrollVector.y = -Math.sin(ang) * (Math.abs(input[p].axis1) > 0.1 ? 1 : 0) * speedMult;
                if(scrollVector.magnitude() > 0 || isRotating) {
                    players[p].moving = true;
                } else {
                    players[p].moving = false;
                }
                // scrollVector.mult(scrollVector.magnitude()*scrollSpeed);

            }

            //keyboard input
            if(KEYBOARD_INPUT == true && p == 0) {
                var angDiff = limit(AngleDifference(keyboardInput.angle, players[0].playerFacing), Math.PI * 2 / players[0].weapon.rotateSpeed) / 5;

                players[0].playerFacing -= angDiff;
                if(Math.abs(angDiff) > 0.01) {
                    isRotating = true;
                }
                var speedMult = 1;
                
                //mouse movement
                /*scrollVector.x = -Math.cos(keyboardInput.angle)*speedMult*keyboardInput.speed;
            scrollVector.y = -Math.sin(keyboardInput.angle)*speedMult*keyboardInput.speed;
               if(keyboardInput.speed > 0){players[0].moving = true}
            else{players[0].moving = false;}
        */

                var vel = new Vector2D();
                vel.x = -(keyboardInput.left * -1 + keyboardInput.right * 1);
                vel.y = -(keyboardInput.up * -1 + keyboardInput.down * 1);
                vel.normalize();
                if(Math.abs(AngleDifference(Math.atan2(-vel.y, -vel.x), keyboardInput.angle)) > Math.PI / 2) {
                    speedMult = 0.75;
                }


                if(vel.magnitude() > 0 || isRotating) {
                    players[0].moving = true;
                } else {
                    players[0].moving = false;
                }
                scrollVector.x = vel.x * speedMult;
                scrollVector.y = vel.y * speedMult;


                if(keyboardInput.melee && players[0].hasReleasedMelee) {
                    players[0].melee = true;
                    players[0].hasReleasedMelee = false;
                } else if(keyboardInput.melee == false) {
                    players[0].hasReleasedMelee = true;
                    players[0].melee = false;
                }


                if(keyboardInput.fire && players[0].hasReleasedFire) {
                    players[0].fire = true;
                    players[0].hasReleasedFire = false;
                } else if(keyboardInput.fire == false) {
                    players[0].hasReleasedFire = true;
                    players[0].fire = false;
                }

                players[0].action = keyboardInput.action;
                players[0].reload = keyboardInput.reload;

                if(keyboardInput.switch && players[0].hasReleasedSwitch) {
                    players[0].nextWeapon();
                    players[0].hasReleasedSwitch = false;
                } else if(keyboardInput.switch == false) {
                    players[0].switch = false;
                    players[0].hasReleasedSwitch = true;
                }


            }
            //basic square collision detection for now

            if(players[p].noclip == false) {
                
                //SAT collision test

                for(var i = 0; i < obstacleContainer.obstacles.length; i++) {
                    if(obstacleContainer.obstacles[i].enabled && obstacleContainer.obstacles[i].floor == players[p].currentFloor){
                    var collision = jCirclePolyCollision(new Circle(new Vector(players[p].pos.x,players[p].pos.y),8),obstacleContainer.obstacles[i]);
                    if(collision.result){
                        var displace = collision.displacement.vec.Multiply(collision.displacement.range.Length());
                        
                        players[p].pos.x -= displace.x;
                         players[p].pos.y -= displace.y; 
                        //circ.setPos(circ.pos.Subtract(displace));

                        //ctx.beginPath();
                        //ctx.moveTo(300,500);
                        
                        }
                    }
                    
                 }


            }

            scrollVector.mult(-1);
            if(players[p].sprint) {
                scrollVector.mult(2);
            }

            //faster movement
            scrollVector.mult(players[p].speed);

            if(!(KEYBOARD_INPUT && p == 0)) {
                scrollVector.mult(Math.max((new Vector2D(input[p].axis0, input[p].axis1).magnitude())), 1);
            }
            players[p].pos.add(scrollVector);
            scrollVector.mult(-1);

            //regen player health
            players[p].health = Math.min(100, players[p].health + 0.025);           
            
        }
        //played is downed
        else if(players[p].dead == false) {
                if(players[p].reviveMeter >= 100) {
                    //revive player and remove weapons
                    //lost points go to reviver
                    players[players[p].currentReviver].money += Math.round(0.052 * players[p].money);
                    players[p].health = players[p].maxHealth;
                    players[p].down = false;
                    players[p].currentReviver = -1;
                    getActionsById('revive_player_' + p)[0].triggers[0].radius = 0;
                }
                else if(players[p].health <= 0) {
                    players[p].dead = true;
                    getActionsById('revive_player_' + p)[0].triggers[0].radius = 0;
                    for(var i = 0; i < NUM_PLAYERS; i++) {
                        //all players lose 10% money
                        players[i].money = Math.round(players[i].money * 0.9);
                    }
                }
                else if(players[p].reviveHealthAmount == 0) {
                    //nobody trying to revive so reset progress
                    players[p].reviveMeter = 0;
                    players[p].currentReviver = -1;
                    //bleed out for 45 secs
                    players[p].health -= 100/(45 * 60);
                }
                //add health regen
                players[p].reviveMeter += players[p].reviveHealthAmount;
                players[p].reviveHealthAmount = 0;
        }

    }
    //zombie  behaviour


    for(var i = 0; i < zombies.length; i++) {
        if(zombies[i].alive) {
            //zombies[i].arrive(players[0].pos);
            var isTargetingPlayer = false;
            for(var p = 0; p < NUM_PLAYERS; p++) {
                if(players[p].down == false) {
                    var r = Raytrace.castRay(new Vector2D(zombies[i].pos.x, zombies[i].pos.y), new Vector2D(players[p].pos.x, players[p].pos.y), zombies[i].currentFloor);

                    //check zombie is close and can see player and is on same floor
                    if(!isTargetingPlayer && zombies[i].currentFloor == players[p].currentFloor && Vector2D.distance(zombies[i].pos, players[p].pos) < 50 && Vector2D.distance(zombies[i].pos, players[p].pos) + Vector2D.distance(players[p].pos, r) >= Vector2D.distance(zombies[i].pos, r) - 1) {
                        zombies[i].separate(zombies);
                        zombies[i].follow(zombies[i].path);

                        zombies[i].arrive(players[p].pos);
                        isTargetingPlayer = true;
                        //this is sometimes causing zombies to get stuck in walls looking up e.g.
                        //   P
                        //XXXX
                        //   X
                        //   X
                        //   z

                        //zombies[i].arrive(players[0].pos);

                        //  zombies[i].angleFacing = Math.atan2(players[0].pos.y-zombies[i].pos.y,players[0].pos.x-zombies[i].pos.x;)
                    }
                    // if(Vector2D.distance(zombies[i].pos,players[0].pos)<50){
                    //     zombies[i].arrive(players[0].pos);zombies[i].separate(zombies);}

                    //    zombies[i].arrive(players[0].pos);zombies[i].separate(zombies);
                    // }
                }
            }
            if(!isTargetingPlayer) {
                zombies[i].follow(zombies[i].path);
                zombies[i].separate(zombies);
            }

            zombies[i].update();
        }
    }
    // let's try for the zombies yay...
    // zombie collision detection
    for(var z = 0; z < zombies.length; z++) {
        if(zombies[z].alive) {

            //sat method zombie collison
              for(var i = 0; i < obstacleContainer.obstacles.length; i++) {
                    if(obstacleContainer.obstacles[i].enabled && obstacleContainer.obstacles[i].floor == zombies[z].currentFloor){
                    var collision = jCirclePolyCollision(new Circle(new Vector(zombies[z].pos.x,zombies[z].pos.y),8),obstacleContainer.obstacles[i]);
                    if(collision.result){

                        if(obstacleContainer.obstacles[i].type == 'window') {
                            //get id - damage?
                            if(getMapClass().getWindowById(obstacleContainer.obstacles[i].id).health > 0) {
                                
                                if(zombies[z].canAttack() && getMapClass().getWindowById(obstacleContainer.obstacles[i].id).readyToBeHit) {
                                    //console.log('attack window');
                                    getMapClass().getWindowById(obstacleContainer.obstacles[i].id).damage(20);
                                    zombies[z].attack();
                                }
                                //slight acceleration back to movement
                                zombies[z].slowTimer = 40;
                            }
                            else{continue;}
                        }

                        var displace = collision.displacement.vec.Multiply(collision.displacement.range.Length());
                        zombies[z].pos.x -= displace.x;
                        zombies[z].pos.y -= displace.y; 
                        //circ.setPos(circ.pos.Subtract(displace));

                        //ctx.beginPath();
                        //ctx.moveTo(300,500);
                        
                        }
                    }
                    
                 }

        }

    }

    
    for(var i = 0; i < NUM_PLAYERS; i++) {
        if(players[i].down == false) {
            players[i].origin.x = players[i].pos.x + 18 * Math.cos(players[i].playerFacing) - 5 * Math.sin(players[i].playerFacing);
            players[i].origin.y = players[i].pos.y + 18 * Math.sin(players[i].playerFacing) + 5 * Math.cos(players[i].playerFacing);
            var randSpread = Math.random() * 1 - 0.5;
            players[i].referenceRay[0].x = players[i].pos.x + 36 * Math.cos(players[i].playerFacing) - (5 + randSpread) * Math.sin(players[i].playerFacing);
            players[i].referenceRay[0].y = players[i].pos.y + 36 * Math.sin(players[i].playerFacing) + (5 + randSpread) * Math.cos(players[i].playerFacing);

            //handle weapons and shooting

            players[i].weapon.tickUpdate();
            players[i].meleeWeapon.tickUpdate();

            if(players[i].melee && players[i].meleeWeapon.canAttack()) {
                players[i].meleeWeapon.attack();
                players[i].hasReleasedFire = false;
                players[i].hasReleasedMelee = false;
                players[i].melee = false;
                players[i].fire = false;
                players[i].reload = false;
                players[i].weapon.interruptReload();

                Sounds.playSound('knife');

            }
            if(players[i].fire && players[i].weapon.shootTimer == 0) {
                if(players[i].weapon.canFire()) {
                    players[i].fire = false;
                   
                    //create additional bullets if needed
                    if(players[i].weapon.shotsFired > 1) {
                        for(var j = 1; j < players[i].weapon.shotsFired + 1; j++) {
                            randSpread = Math.random() * 6 - 3;
                            players[i].referenceRay[j] = new Vector2D();
                            players[i].referenceRay[j].x = players[i].pos.x + 36 * Math.cos(players[i].playerFacing) - (5 + randSpread) * Math.sin(players[i].playerFacing);
                            players[i].referenceRay[j].y = players[i].pos.y + 36 * Math.sin(players[i].playerFacing) + (5 + randSpread) * Math.cos(players[i].playerFacing);

                        }
                    }

                    players[i].weapon.fire();
                    if(players[i].weapon.shootTimer == 0 && players[i].weapon.currentMag == 0 && players[i].weapon.canReload()) {
                        players[i].weapon.startReload();
                    }
                    if(!players[i].weapon.semiAuto) {
                        players[i].hasReleasedFire = true;
                    }


                } else {
                    players[i].fire = false;
                    players[i].weapon.click();
                    //auto reload
                    if(players[i].weapon.canReload()) {
                        players[i].weapon.startReload();
                    }
                }


            }
            if(players[i].reload && players[i].weapon.canReload()) {
                players[i].weapon.startReload();
            }
            if(players[i].fire && players[i].weapon.shootTimer > 0 && players[i].weapon.semiAuto) {
                players[i].hasReleasedFire = false;
                players[i].fire = false;
            }
            //semi auto
            //players[i].fire=false;fire();

            // origin.x = players[i].pos.x + 18*Math.cos(playerFacing)-5*Math.sin(playerFacing);
            // origin.y = players[i].pos.y + 18*Math.sin(playerFacing)+5*Math.cos(playerFacing);
            //console.log(playerFacing);

            // console.log(cameraLocation);
        }
    }

    //zombie attack players
    for(var p = 0; p < NUM_PLAYERS; p++) {
        if(players[p].down == false) {
            for(var i = 0; i < zombies.length; i++) {
                if(zombies[i].alive && zombies[i].currentFloor == players[p].currentFloor) {
                    if(Vector2D.distance(zombies[i].pos, players[p].pos) < 24) {
                        // make sure zombies are vaguely facing player (might need tweaking)
                        if(zombies[i].canAttack() && Math.abs(AngleDifference(zombies[i].angleFacing, Math.atan2(players[p].pos.y - zombies[i].pos.y, players[p].pos.x - zombies[i].pos.x)) < Math.PI / 4)) {
                            players[p].damage(zombies[i].attackDamage);

                            zombies[i].attack();
                            if(players[0].godmode !== 1) {
                                Sounds.playSound('playerhurt');
                                Sounds.playSound('hitmarker');

                                drawBloodAt(players[p].pos.x, players[p].pos.y, players[p].currentFloor);
                            }
                        }
                    }
                }
            }
        }
    }
}


function getTiles() {
    return tiles;
}

//draw map tiles

//draw map to hidden canvas
function redrawMapBuffer() {

    //loop 3 times for redundancy? later
    //bufferctx.fillStyle='F00';
    //background buffer
   // console.log('filling buffer');
    //draw background (below blood)
    for(var f = 0; f < map.floors; f++) {
        canvasBuffer.floor[f].ctx.clearRect(0, 0, canvasBuffer.floor[f].width, canvasBuffer.floor[f].height);
        var bufferctx = canvasBuffer.floor[f].ctx;
        bufferctx.fillStyle = '#000';
        /*for(var i = 0; i < tiles[f].length; i++) {
            for(var j = 0; j < tiles[f][i].length; j++) {
                //  bufferctx.fillStyle = tileTypes[tiles[f][i][j].type];

                if(tiles[f][i][j].type == 'grass' && f == 0) {
                    bufferctx.drawImage(Images.grass, 32 * (j % 4), 32 * (i % 4), Images.grass.size, Images.grass.size, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.grass.size, Images.grass.size);
                } else if(tiles[f][i][j].type == 'tile') {
                    bufferctx.drawImage(Images.tile, 64 * (j % 4), 64 * (i % 4), Images.tile.size * 2, Images.tile.size * 2, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.tile.size, Images.tile.size);
                } else if(tiles[f][i][j].type == 'carpet') {
                    bufferctx.drawImage(Images.carpet, 64 * (j % 4), 64 * (i % 4), Images.carpet.size * 2, Images.carpet.size * 2, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.carpet.size, Images.carpet.size);
                } else if(tiles[f][i][j].type == 'window') {
                    bufferctx.drawImage(Images.grass, 32 * (j % 4), 32 * (i % 4), Images.grass.size, Images.grass.size, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.grass.size, Images.grass.size);
                } else if(tiles[f][i][j].type == 'mesh') {
                    bufferctx.drawImage(Images.tile, 64 * (j % 4), 64 * (i % 4), Images.tile.size * 2, Images.tile.size * 2, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.tile.size, Images.tile.size);
                } else {

                    //bufferctx.fillRect(tiles[f][i][j].pos.x,tiles[f][i][j].pos.y,tiles[f][i][j].size,tiles[f][i][j].size);
                }
            }
        }*/
        //fill ground decorations
        bufferctx.drawImage(Images.floorDecals[MAP_NAME][f], 0, 0);
    }
    //draw other layers in render
    for(var f = 0; f < map.floors; f++) {
        canvasBuffer.walls[f].ctx.clearRect(0, 0, canvasBuffer.walls[f].width, canvasBuffer.walls[f].height);
        var bufferctx = canvasBuffer.walls[f].ctx;
        /*for(var i = 0; i < tiles[f].length; i++) {
            for(var j = 0; j < tiles[f][i].length; j++) {
                //bufferctx.fillStyle = tileTypes[tiles[f][i][j].type];
                if(tiles[f][i][j].type == 'wall') {
                    bufferctx.drawImage(Images.wall, 128 * (j % 2), 128 * (i % 2), Images.wall.size * 4, Images.wall.size * 4, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.wall.size, Images.wall.size);
                } else if(tiles[f][i][j].type == 'door') {
                    bufferctx.drawImage(Images.door, 0, 0, Images.door.size * 4, Images.door.size * 4, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.door.size, Images.door.size);
                } else if(tiles[f][i][j].type == 'window') {
                    bufferctx.drawImage(Images.fence, 0, 0, Images.fence.size * 2.5, Images.fence.size * 2.5, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.fence.size, Images.fence.size);
                } else if(tiles[f][i][j].type == 'mesh') {
                    bufferctx.drawImage(Images.fence, 0, 0, Images.fence.size * 2.5, Images.fence.size * 2.5, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y, Images.fence.size, Images.fence.size);
                }
            }

        }*/

        //draw wall decals
        bufferctx.drawImage(Images.wallDecals[MAP_NAME][f], 0, 0);

    }

    //didn't load in time without putting into image class

    //draw something as empty canvases render slowly for some reason
    for(var i = 0; i < canvasBuffer.blood.length; i++) {
        canvasBuffer.blood[i].ctx.fillRect(0, 0, 0.1, 0.1);
    }
    //drawLayers[0].ctx.drawImage(canvasBuffer.floor[players[0].currentFloor],0,0);
    //separate floor and other decals at some point
    //drawLayers[0].ctx.drawImage(Images.ndu_decal_floor,0,0);

    //drawLayers[3].ctx.clearRect(0,0,drawLayers[3].width,drawLayers[3].height);
    //drawLayers[3].ctx.drawImage(Images.ndu_decal,0,0);


    hasDrawnBuffer = true;
}

//rendering function
function renderAssets(context) {

    //optimize: drawImage is slowest function by far, don't draw off-screen sprites


    var ctx = context;
    //ok this is way too slow... store to another canvas? later optimise to only draw tiles - minimal impact
    //need to make map drawing faster

    //try rendering an off-screen canvas
    //drawing empty canvases slows it down




    /*for(var i=0;i<4;i++){
        if(i==1){
            ctx.globalCompositeOperation='darken';
             ctx.drawImage(drawLayers[i],0,0);
           ctx.globalCompositeOperation='source-over';
        }
   else{ 
   ctx.drawImage(drawLayers[i],0,0);
   }
    }*/


    for(var f = 0; f < gameCamera.floor + 1; f++) {
        // for(var f=0;f<2;f++){
        //for(var f= gameCamera.floor; f<gameCamera.floor+1;f++){
        //draw trasparent fog layer
        if(f > 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvases[0].canvas.width, canvases[0].canvas.height);
            ctx.globalAlpha = 1;
            //ctx.setTransform(1,0,0,1,-Math.floor(gameCamera.x),-Math.floor(gameCamera.y));
            ctx.setTransform(1, 0, 0, 1, -(gameCamera.x), -(gameCamera.y));
        }
        //still something fishy going on
        // try using draw with img,sx,sy,sw,sh,dx,dy,dw,dh, might have an impact if not already optimised for drawing off canvas? :(
        //ctx.drawImage(canvasBuffer.floor[f],0,0);

        //option to halve resolution for more players
        // black lines on second floor - perhaps render the 35% black onto the floor buffer?

        //PROBLEM AREA

        ctx.drawImage(canvasBuffer.floor[f], gameCamera.x, gameCamera.y, w, h, gameCamera.x, gameCamera.y, w, h);

        ctx.globalAlpha = 0.8;
        ctx.globalCompositeOperation = 'darken';
        ctx.drawImage(canvasBuffer.blood[f], gameCamera.x, gameCamera.y, w, h, gameCamera.x, gameCamera.y, w, h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        //sat objects
            //ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#784300';
            for(var i = 0; i < obstacleContainer.obstacles.length; i++) 
                if(obstacleContainer.obstacles[i].floor == f && obstacleContainer.obstacles[i].type == 'window') {
                if(getMapClass().getWindowById(obstacleContainer.obstacles[i].id).health > 0) {obstacleContainer.obstacles[i].draw(ctx)};
            }
            ///
            //ctx.globalAlpha = 1;
        ctx.drawImage(canvasBuffer.walls[f], gameCamera.x, gameCamera.y, w, h, gameCamera.x, gameCamera.y, w, h);

        //doors
        for(var d = 0; d < getMap().doors.length; d++) {
            var d_var = getMap().doors[d];
           // console.log(d_var);
            if(d_var.active){
                for(var g = 0; g<d_var.graphics.length; g++) {
                    if(d_var.graphics[g].floor == f) {
                        //ctx.fillRect(d_var.graphics[g].x, d_var.graphics[g].y, 50,50);
                        ctx.drawImage(d_var.graphics[g].image, d_var.graphics[g].x, d_var.graphics[g].y);
                    }
                }
            }
        }
        //end doors
        

        // end PROBLEM AREA

        //draw zombies on that floor



        //draw zombies new style
        for(var i = 0; i < zombies.length; i++) {
            if(zombies[i].alive && zombies[i].currentFloor == f) {
                ctx.translate(zombies[i].pos.x, zombies[i].pos.y);
                ctx.rotate(zombies[i].angleFacing + Math.PI / 2);
                ctx.drawImage(Images.zombie, zombies[i].currentFrame * Images.zombie.size, 0, Images.zombie.size, Images.zombie.size, -16, -21, Images.character.size, Images.character.size);
                ctx.rotate(-zombies[i].angleFacing - Math.PI / 2);
                ctx.translate(-zombies[i].pos.x, -zombies[i].pos.y);
            }
        }

        //draw death sprites/animations
        for(var i = 0; i < GameStage.objects.length; i++) {
            if(GameStage.objects[i].floor == f) {
                ctx.translate(GameStage.objects[i].x, GameStage.objects[i].y);
                ctx.rotate(GameStage.objects[i].rotation + Math.PI / 2);
                ctx.drawImage(GameStage.objects[i].img, GameStage.objects[i].currentFrame * GameStage.objects[i].size, 0, GameStage.objects[i].size, GameStage.objects[i].size, -16, -21, GameStage.objects[i].size, GameStage.objects[i].size);
                ctx.rotate(-GameStage.objects[i].rotation - Math.PI / 2);
                ctx.translate(-GameStage.objects[i].x, -GameStage.objects[i].y);
            }
            if(thinkCount % 2 == 0) {
                GameStage.objects[i].nextFrame();
            } //animate at 30fps
            if(GameStage.objects[i].currentFrame >= GameStage.objects[i].frames) {
                GameStage.removeChild(i);
            }
        }

        var puList = getMap().powerups
        for(var i = 0; i < puList.length; i++) {
            if(puList[i].dropped && puList[i].floor == f) {
                ctx.translate(puList[i].pos.x, puList[i].pos.y);
                ctx.rotate(puList[i].rotation);
                if((puList[i].lifeLeft < 16 && puList[i].lifeLeft % 2 == 0) ||
                   (puList[i].lifeLeft < 8 && puList[i].lifeLeft % 1 == 0) ||
                   (puList[i].lifeLeft < 4 && puList[i].lifeLeft % 0.5 == 0)) {
                    //blinking;
                    ctx.drawImage(Images.powerupGlow, -16, -16, 32, 32);
                }
                else if(puList[i].type == '2xp') {
                    ctx.drawImage(Images.doublePoints, -16, -16, 32, 32);
                }
                else if(puList[i].type == 'ik') {
                    ctx.drawImage(Images.instaKill, -16, -16, 32, 32);
                }
                else if(puList[i].type == 'ma') {
                    ctx.drawImage(Images.maxAmmo, -16, -16, 32, 32);
                }
                else if(puList[i].type == 'nuke') {
                    ctx.drawImage(Images.nuke, -16, -16, 32, 32);
                }
                else if(puList[i].type == 'carpenter') {
                    ctx.drawImage(Images.carpenter, -16, -16, 32, 32);
                }
                else{
                //ctx.fillCircle(getMap().powerups[i].pos.x,getMap().powerups[i].pos.y, 10);
                }

                ctx.rotate(-puList[i].rotation);
                ctx.translate(-puList[i].pos.x, -puList[i].pos.y);

            }
        }

    }



    /* ctx.fillStyle='#00FF00';
     */
     /*
    ctx.font = "7px sans-serif";
     ctx.fillStyle="#F80";
     for(var i =0;i<dijkstraMap.map.height;i++){
         for(var j=0;j<dijkstraMap.map.width;j++){
             ctx.fillText(dijkstraMap.cells[0][i][j].toString(), 3+(j%dijkstraMap.map.width)*tileSize,12+i*tileSize);
         }
     }
     ctx.fillStyle="#F00";
     for(var i =0;i<dijkstraMap.map.height;i++){
         for(var j=0;j<dijkstraMap.map.width;j++){
             ctx.fillText(dijkstraMap.cells[1][i][j].toString(), 8+(j%dijkstraMap.map.width)*tileSize,24+i*tileSize);
         }
     }
    */

    /*  ctx.beginPath();
      ctx.strokeStyle = '#FF0000';
      ctx.moveTo(origin.x,origin.y);
      ctx.lineTo(mousePos.x,mousePos.y);
      ctx.stroke();*/

    for(var i = 0; i < NUM_PLAYERS; i++) {
        if(players[i].drawLaser > 0 && players[i].currentFloor == gameCamera.floor) {
            //console.log('drawlaser');
            
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.strokeStyle = '#FF0';
            //  ctx.strokeStyle = '#000';
            if(players[i].weapon.internalName == 'raygun') {
                ctx.strokeStyle = '#0F0';
                ctx.lineWidth = 4;
            }
            if(players[i].weapon.internalName == 'doublebarreled') {
                ctx.lineWidth = 0.25;
               
            }
            //ctx.globalCompositeOperation='lighten';
            //ctx.globalAlpha=0.5;
            //draw each bullet
            for(var j = 1; j < players[i].ray.length; j++) {
                ctx.moveTo(players[i].ray[0].x, players[i].ray[0].y);
                ctx.lineTo(players[i].ray[j].x, players[i].ray[j].y);
                ctx.stroke();
            }
            // ctx.globalAlpha = 1;
            //ctx.globalCompositeOperation='source-over';

        }

        ctx.strokeStyle = '#FFFF00';
    }
    //ctx.strokeCircle(ray.x, ray.y,5);

    // ctx.fillStyle='#40F';

    //draw player
    // ctx.translate(Math.floor(players[0].pos.x),Math.floor(players[0].pos.y));
    for(var p = 0; p < NUM_PLAYERS; p++) {
        if(gameCamera.floor == players[p].currentFloor) {
            if(players[p].down) {
                ctx.globalAlpha = 0.65;
            }
            if(players[p].dead) {
                ctx.globalAlpha = 0;
            }
            ctx.translate((players[p].pos.x), (players[p].pos.y));
            ctx.rotate(players[p].playerFacing + Math.PI / 2);

            //test rendering for melee attack
            if(players[p].meleeWeapon.meleeTimer > 0) {
                ctx.drawImage(Images.characterMelee, 0 + (10 - players[p].meleeWeapon.meleeTimer) * Images.character.size, 32*p, Images.character.size, Images.character.size, -16, -21, Images.character.size, Images.character.size);
            } else {
                ctx.drawImage(Images.character, players[p].currentFrame * Images.character.size, p * Images.character.size, Images.character.size, Images.character.size, -16, -21, Images.character.size, Images.character.size);
            }

            ctx.rotate(-players[p].playerFacing - Math.PI / 2);
            // ctx.translate(-Math.floor(players[0].pos.x),-Math.floor(players[0].pos.y));
            ctx.translate(-(players[p].pos.x), -(players[p].pos.y));
            //  ctx.fillCircle(players[0].pos.x,players[0].pos.y,2);
            if(players[p].down) {
                ctx.globalAlpha = 1;
            }
        }
    }
    //draw actions debug circles
    ctx.globalAlpha = 0.4;

    for(var a = 0; a < map.actions.length; a++) {
        if(map.actions[a].debug == true) {
            for(var t = 0; t < map.actions[a].triggers.length; t++) {
                if(map.actions[a].triggers[t].floor == gameCamera.floor) {
                    ctx.fillCircle(map.actions[a].triggers[t].pos.x, map.actions[a].triggers[t].pos.y, map.actions[a].triggers[t].radius);
                }
            }
        }
    }

    ctx.globalAlpha = 1;

    //draw zombies old sty
    /* ctx.fillStyle = '#558844';
          for(var i = 0; i<zombies.length;i++){
            ctx.fillCircle(zombies[i].pos.x,zombies[i].pos.y,8);
            ctx.beginPath();
            ctx.moveTo(zombies[i].pos.x,zombies[i].pos.y);
            ctx.lineTo(zombies[i].pos.x + 8*Math.cos(zombies[i].angleFacing),zombies[i].pos.y + 8*Math.sin(zombies[i].angleFacing));
            ctx.stroke();
        }*/



    /*var r = Raytrace.castRay(new Vector2D(zombies[i].pos.x,zombies[i].pos.y),new Vector2D(players[0].pos.x,players[0].pos.y));
       
        ctx.strokeStyle = '#0000FF';
         ctx.beginPath();
        ctx.moveTo(zombies[i].pos.x,zombies[i].pos.y);
        ctx.lineTo(r.x,r.y);
        //ctx.lineTo(500,500);
        ctx.stroke();*/



    ctx.strokeStyle = '#FF0000';
    for(var z = 0; z < zombies.length; z++) {
        if(zombies[z].debugPath) {
            ctx.beginPath();
            for(var i = 0; i < zombies[z].path.points.length - 1; i++) {

                ctx.moveTo(zombies[z].path.points[i].x, zombies[z].path.points[i].y);
                ctx.lineTo(zombies[z].path.points[i + 1].x, zombies[z].path.points[i + 1].y);
                ctx.stroke();

            }
        }
    }


    // ctx.closePath();


    //extra viewports :o
    //  secondCanvas.ctx.drawImage(canvas,-Math.floor(cameraLocation.x),-Math.floor(cameraLocation.y));
    //  secondCanvas.ctx.drawImage(canvas,-100,-100,CANVAS_WIDTH,CANVAS_HEIGHT,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    //ctx.drawImage(Images.hpbar,sourcex,0,sourcewidth,50,destx,h-50,sourcewidth,50);

    
}

function renderHud(ctx, playerNum = 0) {
    var p = playerNum;
    var ctx = ctx;


    //reload indicator

    if(players[p].weapon.reloading) {
        //console.log('reloading');
        ctx.translate(-gameCamera.x + players[p].pos.x, -gameCamera.y + players[p].pos.y - 32);
        //img, sx, sy, sw, sh, dx, dy, dw, dh
        //full
        ctx.globalAlpha = 1;
        ctx.drawImage(Images.reloadIndicator, 0, 0, 32, 32, -16, -16, 32, 32);
        //empty

        //changed to last reload time for variable reload weapons
        var maxTime = Math.floor(players[p].weapon.lastReloadTime * 60);
        var pctComplete = (maxTime - players[p].weapon.reloadTimer) / maxTime;
        // console.log(pctComplete);
        ctx.globalAlpha = 0.5;
        ctx.drawImage(Images.reloadIndicator, 32, 32 * (1 - pctComplete), 32, 32 * (pctComplete), -16, -16 + 32 * (1 - pctComplete), 32, 32 * (pctComplete));

        ctx.translate(-(-gameCamera.x + players[p].pos.x), -(-gameCamera.y + players[p].pos.y - 32));

    }

    for(var i = 0; i < NUM_PLAYERS; i++) {
        if(players[i].currentReviver == p) {

            ctx.translate(-gameCamera.x + players[p].pos.x, -gameCamera.y + players[p].pos.y - 32);
            //img, sx, sy, sw, sh, dx, dy, dw, dh
            //full
            ctx.globalAlpha = 1;
            ctx.drawImage(Images.reviveIndicator, 0, 0, 32, 32, -16, -16, 32, 32);
            //empty

            //changed to last reload time for variable reload weapons
            var maxHealth = 100;
            var pctComplete = (maxHealth - players[i].reviveMeter) / maxHealth;
            // console.log(pctComplete);
            ctx.globalAlpha = 0.5;
            ctx.drawImage(Images.reviveIndicator, 32, 0, 32, 32 * (pctComplete), -16, -16, 32, 32 * (pctComplete));
            ctx.drawImage(Images.reviveIndicator, 64, 32 * (pctComplete), 32, 32 * (1-pctComplete), -16, -16 + 32 * (pctComplete), 32, 32 * (1-pctComplete));
            ctx.translate(-(-gameCamera.x + players[p].pos.x), -(-gameCamera.y + players[p].pos.y - 32));

        }
    }




    //hud bars
    ctx.globalAlpha = 0.5;
    var sourcex = 5 + ((100 - players[p].health) / 100) * 122;
    var sourcewidth = 160 - 5 - ((100 - players[p].health) / 100) * 122;
    var destx = w - 160 + sourcex;
    if(players[p].down == false) {
        ctx.drawImage(Images.hpbar, sourcex, 0, sourcewidth, 50,
        destx, h - 50, sourcewidth, 50);
    }
    else {
        ctx.drawImage(Images.bleedoutbar, sourcex, 0, sourcewidth, 50,
        destx, h - 50, sourcewidth, 50);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(Images.hudbase, w - 160, h - 50);
    ctx.font = "14px sans-serif";
    
    ctx.fillStyle = "#000";
    if(players[p].weapon.specialType == 'shotgun') {
        if(players[p].weapon.currentMag < 2) {ctx.fillStyle = "#C54";}
    }
    else if(players[p].weapon.currentMag <= Math.max(2, players[p].weapon.magSize * 0.2)) {
        ctx.fillStyle = "#C54";
    } 
    
    ctx.textAlign = "right";
    ctx.fillText(players[p].weapon.currentMag.toString(), w - 75, h - 15);
    ctx.textAlign = "left";
    ctx.font = "10px sans-serif";
    if(players[p].weapon.currentReserve <= players[p].weapon.magSize * 2) {
        ctx.fillStyle = "#C54";
    } else {
        ctx.fillStyle = "#000";
    }
    ctx.fillText('/ ' + players[p].weapon.currentReserve.toString(), w - 73, h - 15);

    if(Images.weaponIcon[players[p].weapon.internalName]) {
    ctx.drawImage(Images.weaponIcon[players[p].weapon.internalName], w - 50, h - 50);}

    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = '#FFF'
    ctx.fillText(players[p].displayTooltip, w / 2, h - 70);
    ctx.textAlign = 'right';
    ctx.font = "20px sans-serif";
    ctx.fillText('$' + players[p].money, w - 7, h - 55);

    //center icons
    var puIconsX = w/2 - 32;
    puIconsX -= (roundManager.numActivePowerups()-1)*32;

    if(roundManager.powerups.doublePoints.enabled) {
        if((roundManager.powerups.doublePoints.timer < 16 && roundManager.powerups.doublePoints.timer % 2 == 0) ||
                   (roundManager.powerups.doublePoints.timer < 8 && roundManager.powerups.doublePoints.timer % 1 == 0) ||
                   (roundManager.powerups.doublePoints.timer < 4 && roundManager.powerups.doublePoints.timer % 0.5 == 0)) {
                    //blinking;
                    //do nothing and leave space
        }
        else{ctx.drawImage(Images.doublePointsHud, puIconsX, h-64);}
        puIconsX += 64;
    }
    if(roundManager.powerups.instaKill.enabled) {
        if((roundManager.powerups.instaKill.timer < 16 && roundManager.powerups.instaKill.timer % 2 == 0) ||
                   (roundManager.powerups.instaKill.timer < 8 && roundManager.powerups.instaKill.timer % 1 == 0) ||
                   (roundManager.powerups.instaKill.timer < 4 && roundManager.powerups.instaKill.timer % 0.5 == 0)) {
                    //blinking;
                    //do nothing and leave space
        }
        else{
            ctx.drawImage(Images.instaKillHud, puIconsX, h-64);
        }
        puIconsX += 64;
    }
   

    //weapon name on switch
    if(players[p].weapon.weaponSwitchTimer > 0) {
        ctx.globalAlpha = Math.min(1,players[p].weapon.weaponSwitchTimer/35);
        ctx.textAlign = "end";
        ctx.font = '16px sans-serif';
        ctx.fillText(players[p].weapon.name, w-115, h-13);
        ctx.globalAlpha = 1;
    }

    //red effect when dead
    if(players[p].down == true) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#600';
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;

        if(getLivingPlayers() == 0) {
            ctx.textAlign = 'center';
            ctx.font = '80px serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('GAME OVER', w / 2, h / 2 - 50);

        }
    }

    ctx.textAlign = 'left';
    ctx.font = "20px sans-serif";
    ctx.fillStyle = '#fff';
    ctx.fillText('Round: ' + roundManager.getRound(), 15, h - 15);
    ctx.fillText('Kills: ' + players[playerNum].kills, 15, h - 35);
}


function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}




function refSort(targetData, refData) {
    // Create an array of indices [0, 1, 2, ...N].
    var indices = Object.keys(refData);

    // Sort array of indices according to the reference data.
    indices.sort(function(indexA, indexB) {
        if(refData[indexA] < refData[indexB]) {
            return -1;
        } else if(refData[indexA] > refData[indexB]) {
            return 1;
        }
        return 0;
    });

    // Map array of indices to corresponding values of the target array.
    return indices.map(function(index) {
        return targetData[index];
    });
}

function getMap() {
    return map;
}

function getMapClass() {
    return mapClassInstance;
}


function mouseMove(e) {

    //follow code fixes aiming issue
    //gameCamera.follow(players[0],0);

    var rect = canvases[0].canvas.getBoundingClientRect();
    //mousePos.x = e.clientX - rect.left + gameCamera.x;
    //mousePos.y = e.clientY - rect.top + gameCamera.y;
    mousePos.x = e.clientX - rect.left + gameCamera.prevxs[0];
    mousePos.y = e.clientY - rect.top + gameCamera.prevys[0];
    keyboardInput.angle = Math.atan2(mousePos.y - players[0].pos.y, mousePos.x - players[0].pos.x)
    var vec = new Vector2D();
    vec.y = mousePos.y - players[0].pos.y;
    vec.x = mousePos.x - players[0].pos.x;
    var speed = vec.magnitude();

    if(speed > 100) {
        keyboardInput.speed = 1;
    } else {
        keyboardInput.speed = 0;
    }
    //console.log(mousePos.x,mousePos.y);
    //ray = Raytrace.castRay(origin,mousePos);
    // players[0].playerFacing -= limit(AngleDifference(Math.atan2(mousePos.y - players[0].pos.y,mousePos.x-players[0].pos.x),players[0].playerFacing),Math.PI*2/players[0].weapon.rotateSpeed)/5;

    // players[0].playerFacing = Math.atan2(mousePos.y - players[0].pos.y,mousePos.x-players[0].pos.x);
}

/*function fire() {
    drawLaser = true;
    new Howl({src: ['audio/M1911fire.ogg'],html5:true,volume:0.05}).play();
   
    ray = Raytrace.castRay(origin,players[0].referenceRay);

}*/

function updateZombiePath() {
    //dijkstraMap.setGoal(players[0].pos.x,players[0].pos.y,players[0].currentFloor);


    for(var i = 0; i < zombies.length; i++) {
        if(zombies[i].alive) {
            // future - add penalty to paths already being travelled on somehow to avoid zombie trains
            // simpler - add 'favourite direction' to zombie, up left down or right to create more splits
            zombies[i].path = dijkstraMap.findPath(zombies[i].pos.x, zombies[i].pos.y, zombies[i].currentFloor, zombies[i].preference);
        }
    }
}

//click handler
function regen(e) {
    keyboardInput.fire = true;
    keyboardInput.hasReleasedFire = false;
    players[0].fire = true;
    players[0].hasReleasedFire = false;
    //  players[0].hasReleasedFire=true;
    // main();
    //updateZombiePath();
    /*
    for(var i = 0;i<map.height;i++){
        for(var j = 0;j<map.width;j++){
            if(tiles[i][j].type == 'window'){
                tiles[i][j].passable = true;
            }
        }*/


    // drawLaser = !drawLaser;
    /*   drawLaser = true;
       var sound = new Howl({src: ['audio/M1911fire.ogg'],html5:true}).play();
       var rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX-rect.left + transformVector.x;
        mousePos.y = e.clientY-rect.top + transformVector.y;
        ray = Raytrace.castRay(origin,players[0].referenceRay);
        */
    //playerFacing = Math.atan2(mousePos.y - players[0].pos.y,mousePos.x-players[0].pos.x);
    //ray = new Vector2D(50,50);
    /* var rect = canvas.getBoundingClientRect();
        origin.x = e.clientX-rect.left + transformVector.x;
        origin.y = e.clientY-rect.top + transformVector.y;
    */
}

function mouseUpHandler(e) {
    keyboardInput.hasReleasedFire = true;
    keyboardInput.fire = false;
    //players[0].hasReleasedFire = true;
}

function keyDownHandler(e) {
    //  console.log(e.keyCode);
    if(e.keyCode == KEYS.w) {
        keyboardInput.up = true;
    }
    if(e.keyCode == KEYS.s) {
        keyboardInput.down = true;
    }
    if(e.keyCode == KEYS.a) {
        keyboardInput.left = true;
    }
    if(e.keyCode == KEYS.d) {
        keyboardInput.right = true;
    }
    if(e.keyCode == KEYS.space) {
        keyboardInput.pauseRotation = true;
    }
    if(e.keyCode == KEYS.e) {
        keyboardInput.action = true;
    }
    if(e.keyCode == KEYS.r) {
        keyboardInput.reload = true;
    }
    if(e.keyCode == KEYS.q) {
        keyboardInput.switch = true;
        keyboardInput.hasReleasedSwitch = false;
    }
    if(e.keyCode == KEYS.c) {
        keyboardInput.melee = true;
        keyboardInput.hasReleasedMelee = false;
    }

}

function keyUpHandler(e) {
    if(e.keyCode == KEYS.w) {
        keyboardInput.up = false;
    }
    if(e.keyCode == KEYS.s) {
        keyboardInput.down = false;
    }
    if(e.keyCode == KEYS.a) {
        keyboardInput.left = false;
    }
    if(e.keyCode == KEYS.d) {
        keyboardInput.right = false;
    }
    if(e.keyCode == KEYS.space) {
        keyboardInput.pauseRotation = false;
    }
    if(e.keyCode == KEYS.e) {
        keyboardInput.action = false;
    }
    if(e.keyCode == KEYS.r) {
        keyboardInput.reload = false;
    }
    if(e.keyCode == KEYS.q) {
        keyboardInput.switch = false;
        keyboardInput.hasReleasedSwitch = true;
    }
    if(e.keyCode == KEYS.c) {
        keyboardInput.melee = false;
        keyboardInput.hasReleasedMelee = true;
    }

}

function testSound() {
    new Howl({
        src: ['audio/Kar98kfire.ogg'],
        html5: true,
        volume: 0.15
    }).play();
}

function checkProximityActions() {

    for(var p = 0; p < NUM_PLAYERS; p++) {

        players[p].displayTooltip = '';
        if(players[p].down == false) {
            for(var a = 0; a < map.actions.length; a++) {

                var actions = map.actions[a];
                // if(players[0].currentFloor==actions.floor){
                for(var t = 0; t < actions.triggers.length; t++) {
                    if(players[p].currentFloor == actions.triggers[t].floor && Vector2D.distance(players[p].pos, actions.triggers[t].pos, true) < actions.triggers[t].radius ** 2) {
                        players[p].displayTooltip = actions.tooltip + actions.tooltipFunction(p);
                        if(players[p].action && players[p].money >= actions.price) {

                            //run custom action
                            //at the moment only windows return true when they can be interacted with
                            //so reward player
                            if(actions.customFunction()==true) {
                                //add limit on repair bonus per round
                                if(actions.type == 'window' && players[p].roundRepairMoney < Math.min(490,40 + (roundManager.getRound()-1)*50)){
                                    if(getMapClass().getWindowById(actions.windowId).repairCount < 7) {  
                                    //also limit to 6 rewarded repairs per window per round  
                                        players[p].money += actions.reward * (1 + roundManager.powerups.doublePoints.enabled);
                                        players[p].roundRepairMoney += actions.reward;
                                    }
                                } 
                            }

                            if(actions.singleUse) { //only run once
                                for(var tr = 0; tr < actions.triggers.length; tr++) {
                                    actions.triggers[tr].radius = 0;
                                }
                            }

                            if(actions.type == 'gun') {

                                if(players[p].weapon.internalName != actions.gunName) {

                                    //purchase weapon
                                    if(!players[p].hasWeapon(actions.gunName)) {
                                        players[p].money -= actions.price;
                                        players[p].addWeapon(actions.gunName);
                                        Sounds.playSound('purchase');


                                    }
                                } else {
                                    //purchase ammo
                                    if(players[p].weapon.currentReserve < players[p].weapon.maxAmmo) {
                                        players[p].money -= Math.round(actions.price / 2);
                                        players[p].weapon.currentReserve = players[p].weapon.maxAmmo;
                                        Sounds.playSound('purchase');
                                    }
                                }




                            } else if(actions.type == 'door') {
                                players[p].money -= actions.price;
                                for(var i = 0; i < actions.doorCoords.length; i++) {
                                    getTiles()[actions.doorCoords[i].floor][actions.doorCoords[i].y][actions.doorCoords[i].x].setType(actions.doorCoords[i].type);
                                    getTiles()[actions.doorCoords[i].floor][actions.doorCoords[i].y][actions.doorCoords[i].x].walkable = true;
                                    getTiles()[actions.doorCoords[i].floor][actions.doorCoords[i].y][actions.doorCoords[i].x].passable = true;
                                    getTiles()[actions.doorCoords[i].floor][actions.doorCoords[i].y][actions.doorCoords[i].x].shootThrough = true;

                                    getMapClass().setTileType(actions.doorCoords[i].type,actions.doorCoords[i].x,actions.doorCoords[i].y,actions.doorCoords[i].floor);
                                    //map.floor[actions.doorCoords[i].floor].data = map.floor[actions.doorCoords[i].floor].data.substring(0, map.width * actions.doorCoords[i].y + actions.doorCoords[i].x) + actions.doorCoords[i].type + map.floor[actions.doorCoords[i].floor].data.substring(map.width * actions.doorCoords[i].y + actions.doorCoords[i].x + 1);
                                    dijkstraMap.map.floor[actions.doorCoords[i].floor].data = dijkstraMap.map.floor[actions.doorCoords[i].floor].data.substring(0, map.width * actions.doorCoords[i].y + actions.doorCoords[i].x) + 'Y' + dijkstraMap.map.floor[actions.doorCoords[i].floor].data.substring(map.width * actions.doorCoords[i].y + actions.doorCoords[i].x + 1);
                                    dijkstraMap.resetGrid(true); //full reset
                                    var obs = obstacleContainer.GetObstaclesById(actions.doorId);
                                    for(var j = 0; j < obs.length; j++) {
                                        obs[j].enabled = false;
                                    }
                                    getMapClass().getDoorById(actions.doorId).active = false;

                                }
                                Sounds.playSound('dooropen');
                                //  console.log(map.data[actions.doorCoord.y]);
                                if(actions.price > 0) {
                                    Sounds.playSound('purchase');
                                }
                                redrawMapBuffer();

                            }
                        }
                        //fix bug where you couldn't buy ammo if you didn't have the full price
                        //instead of making a separate action to buy ammo... which I might do later
                        else if(actions.type == 'gun' && players[p].action && players[p].money >= Math.round(actions.price / 2)) {
                            if(players[p].weapon.internalName == actions.gunName) {

                                if(players[p].weapon.currentReserve < players[p].weapon.maxAmmo) {
                                    players[p].money -= Math.round(actions.price / 2);
                                    players[p].weapon.currentReserve = players[p].weapon.maxAmmo;
                                    Sounds.playSound('purchase');
                                }
                            }
                        }

                        else if(actions.type == 'teleport') {
                            //console.log('teleport)');
                            players[p].currentFloor = actions.teleportConditions.floor;

                            //  redrawMapBuffer();


                        }
                        //make sure that you can always revive a player as a priority?
                        if(actions.type == 'revive' && players[p].action && players[p].isMeleeing == false) {
                         
                            var downedPlayerId = Number(actions.id.slice(-1));
                            var isReviving = false;
                            for(var i = 0; i < downedPlayerId; i++) {
                                if(players[i].currentReviver == p) {
                                    isReviving = true;
                                }
                            }
                            if(!isReviving && (players[downedPlayerId].currentReviver == -1 || players[downedPlayerId].currentReviver == p)) {
                                //ok to revive

                                //cancel reload
                                players[p].weapon.interruptReload()

                                players[downedPlayerId].currentReviver = p;
                                players[downedPlayerId].reviveHealthAmount = 0.45;
                            }
                        }

                        else if(actions.type == 'mysteryboxbuy' && players[p].action && players[p].money >= actions.price) {
                            players[p].money -= actions.price;
                            MysteryBox.purchase(p);
                        }
                        else if(actions.type == 'mysteryboxgun' && players[p].action && actions.owner == p) {
                            if(players[p].weapon.internalName != actions.gunName && !players[p].hasWeapon(actions.gunName)) {
                                players[p].addWeapon(actions.gunName);
                                MysteryBox.endCycle();
                            }       
                        }






                        /* if(actions.type=='customPassive'){
                             actions.customFunction();
                         }*/


                    }

                }
                //}

            }

        }

         //check powerups
        for(var i = 0; i < getMap().powerups.length; i++) {
            var powerup = getMap().powerups[i];
            if(powerup.floor == players[p].currentFloor && powerup.dropped == true) {
                //console.log(Vector2D.distance(powerup.pos,players[p].pos));
               if(Vector2D.distance(powerup.pos,players[p].pos) < 18) {
                //console.log('picked up powerup '+powerup.floor);
                powerup.activate();
               } 
            }
        }

    }

    for(var a = 0; a < map.actions.length; a++) {
        var actions = map.actions[a];
        for(var t = 0; t < actions.triggers.length; t++) {
            if(actions.type == 'teleport') {
                for(var z = 0; z < zombies.length; z++) {
                    if(Vector2D.distance(zombies[z].pos, actions.triggers[t].pos, true) < actions.triggers[t].radius ** 2) {
                        zombies[z].currentFloor = actions.teleportConditions.floor;

                    }
                }
            }
        }



    }


}

function createExplosion(owner, vec, radius, floor, mindmg, maxdmg) {
    var dist = 0;
    for(var i = 0; i < getZombies().length; i++) {
        if(zombies[i].alive) {
            dist = Vector2D.distance(vec, getZombies()[i].pos);
            if(dist < radius && getZombies()[i].currentFloor == floor) {
                //percentage how close to center??
                drawBloodAt(getZombies()[i].pos.x, getZombies()[i].pos.y, getZombies()[i].currentFloor);
                getZombies()[i].takeDamage(owner, 1, 'splash', mindmg + ((radius - dist) / radius) * (maxdmg - mindmg));


            }
        }
    }
    for(var p = 0; p < NUM_PLAYERS; p++) {
        if(players[0].down == false) {
            dist = Vector2D.distance(vec, players[p].pos);
            if(dist < radius && players[p].currentFloor == floor) {
                players[p].damage(10 + ((radius - dist) / radius) * 70);
                drawBloodAt(players[p].pos.x, players[p].pos.y, players[p].currentFloor);
                Sounds.playSound('playerhurt');
            }
        }
    }
}

function drawBloodAt(x, y, floor) {
    canvasBuffer.blood[floor].ctx.translate(x, y);
    var randang = Math.random() * 2 * Math.PI;
    canvasBuffer.blood[floor].ctx.rotate(randang);
    //canvasBuffer.blood[floor].ctx.drawImage(Images.blood,0,0,178,178,-20,-14,35,35);
    canvasBuffer.blood[floor].ctx.drawImage(Images.blood, 0, 0, 124, 114, -12, -11, 25, 25);
    canvasBuffer.blood[floor].ctx.rotate(-randang);
    canvasBuffer.blood[floor].ctx.translate(-x, -y);

}

function stoppingPower(x) {
    //max around 45, 0 to 1
    return 2 - 2 * Math.E ** (x / 10) / (1 + Math.E ** (x / 10));

}

function getZombies() {
    return zombies;
}

function endGame() {

    gameEnded = true;

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#600';
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    renderHud();
    ctx.textAlign = 'center';
    ctx.font = '80px serif';
    ctx.fillText('GAME OVER', w / 2, h / 2 - 100);

}

function spawnPowerup(x,y,f) {
    getMap().powerups.push(new Powerup(x,y,f));
}

function AngleDifference(angle1, angle2) {
    var diff = (angle2 - angle1 + Math.PI) % (2 * Math.PI) - Math.PI;
    return diff < -Math.PI ? diff + 2 * Math.PI : diff;
}

//limit the absolute value
function limit(num, lim) {
    if(Math.abs(num) > lim) {
        return(num < lim) ? -lim : lim;
    }
    return num;
}

function debugZombiePaths() {
    for(var i = 0; i < zombies.length; i++) {
        zombies[i].debugPath = !zombies[i].debugPath;
    }
}


//http://stackoverflow.com/questions/9362716/how-to-duplicate-object-properties-in-another-object
function assign(object, source) {
    Object.keys(source).forEach(function(key) {
        object[key] = source[key];
    });
}

function getLivingPlayers() {
    var count = 0;
    for(var p = 0; p < NUM_PLAYERS; p++) {
        if(players[p].down == false) {
            count++;
        }
    }
    return count;
}

function getActionsById(id) {
    actionList = [];
    for(var i = 0; i < map.actions.length; i++) {
        if(map.actions[i].id == id) {
            actionList.push(map.actions[i]);
        }
    }
    return actionList;

}

function chooseZombieSpawn() {

    var options = [];

    for(var i = 0; i < getMap().zombieSpawns.length; i++) {
        if(getMap().zombieSpawns[i].enabled) {
            options.push(i);
        }
    }
  //  console.log(options);
    return getMap().zombieSpawns[options[Math.floor(Math.random()*options.length)]];
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


function activateCheats() {
    players[0].godmode = 1;
    players[0].noclip = 1;
    players[0].money = 999999;
    players[0].sprint = 1;
}

function testLag() {
    players[0].pos.x = 1100;
    players[0].pos.y = 1100;
    players[0].currentFloor = 1;
}

