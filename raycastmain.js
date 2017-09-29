
var NUM_PLAYERS = 4;
var MAP_NAME = 'ndu';

canvas = document.getElementById('cvs');
var canvasBuffer = {};
canvasBuffer.floor = [];
canvasBuffer.walls = [];
canvasBuffer.blood = [];

var CANVAS_WIDTH = 640*2;
var CANVAS_HEIGHT = 480*2; // to fix unknown drawimage lag at parts of map...

for(var i=0;i<4;i++){

canvasBuffer.floor[i] = document.createElement('canvas');
canvasBuffer.floor[i].width = CANVAS_WIDTH*8;
canvasBuffer.floor[i].height = CANVAS_HEIGHT*8;
canvasBuffer.floor[i].ctx = canvasBuffer.floor[i].getContext('2d');

canvasBuffer.walls[i] = document.createElement('canvas');
canvasBuffer.walls[i].width = CANVAS_WIDTH*8;
canvasBuffer.walls[i].height = CANVAS_HEIGHT*8;
canvasBuffer.walls[i].ctx = canvasBuffer.walls[i].getContext('2d');

canvasBuffer.blood[i] = document.createElement('canvas');
canvasBuffer.blood[i].width = CANVAS_WIDTH*8;
canvasBuffer.blood[i].height = CANVAS_HEIGHT*8;
canvasBuffer.blood[i].ctx = canvasBuffer.blood[i].getContext('2d');
}

var drawLayers = [];
for(var i = 0;i<4;i++){
drawLayers[i]= document.createElement('canvas');
drawLayers[i].width = CANVAS_WIDTH*8;
drawLayers[i].height = CANVAS_HEIGHT*8;
drawLayers[i].ctx = drawLayers[i].getContext('2d');
}

var secondCanvas = document.createElement('canvas');
secondCanvas.width = CANVAS_WIDTH/2;
secondCanvas.height = CANVAS_HEIGHT/2;
secondCanvas.ctx = secondCanvas.getContext('2d');

var thirdCanvas = document.createElement('canvas');
thirdCanvas.width = CANVAS_WIDTH/2;
thirdCanvas.height = CANVAS_HEIGHT/2;
thirdCanvas.ctx = thirdCanvas.getContext('2d');


var fourthCanvas = document.createElement('canvas');
fourthCanvas.width = CANVAS_WIDTH/2;
fourthCanvas.height = CANVAS_HEIGHT/2;
fourthCanvas.ctx = fourthCanvas.getContext('2d');

if(NUM_PLAYERS>1){
var loc = 'container';
if(NUM_PLAYERS==2){loc='container2';}
document.getElementById(loc).appendChild(secondCanvas);
if(NUM_PLAYERS>2){document.getElementById('container2').appendChild(thirdCanvas);}
if(NUM_PLAYERS>3){document.getElementById('container2').appendChild(fourthCanvas);}
}


//document.body.appendChild(canvasBuffer);

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

    menu

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
            - collision physics (could cop out and use box2d, most likely would lag it to hell though)
            - 'walls', dynamic doors and mystery box animations
            - fun gameplay: how to make snipers unique, more arcadey movement
            - 2.5d/3d remake

*/


canvas.onmousedown= regen;
canvas.onmouseup = mouseUpHandler;
window.onmousemove = mouseMove;
window.onkeydown = keyDownHandler;
window.onkeyup = keyUpHandler;
ctx = canvas.getContext('2d');
window.onload = function(){this.main();}
var fps = 60;
var interval = 1000/fps;
var d = new Date().getTime();
var lastTime = 0;
var currentTime  =    d;
var delta = 0;


var w=640,
    h=480;

var runGame = true;
var gameEnded = false;

CanvasRenderingContext2D.prototype.fillCircle = function(xpos,ypos,radius) {
    this.beginPath();
    this.arc(xpos,ypos,radius,0,2*Math.PI);
    this.fill();
    this.closePath();
};
CanvasRenderingContext2D.prototype.strokeCircle = function(xpos,ypos,radius) {
    this.beginPath();
    this.arc(xpos,ypos,radius,0,2*Math.PI);
    this.stroke();
    this.closePath();
};

class Vector2D {
    constructor(x=0,y=0) {
        this.x = x;
        this.y = y;
    }
    static distance(a,b,squared = false) {
        //return distance between two vectors;
        if(typeof(a)=='undefined' || typeof(b)=='undefined'){return Infinity;}
        if(squared) {
            return (a.x - b.x)**2 + (a.y - b.y)**2;
        }
        else{
            return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
        }
    }
    static dot(a,b) {
        return a.x*b.x + a.y*b.y;
    }
    dot(a){
        return this.x*a.x + this.y*a.y;
    }
    static angleBetween(a,b) {
        return Math.acos(this.dot(a,b)/(a.magnitude()*b.magnitude()));
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
    }
    static sub(a,b) {
        return new Vector2D(a.x - b.x,a.y - b.y);
    }
    static add(a,b) {
        return new Vector2D(a.x+b.x,a.y+b.y);
    }
    div(a) {
        this.x = this.x/a;this.y =this.y/a;
    }
    mult(a) {
        this.x = this.x*a;this.y = this.y*a;
    }
    magnitude() {
        return Math.sqrt(this.x**2 + this.y**2);
    }
    magnitudesq() {
        return this.x**2 + this.y**2;
    }
    normalize() {
        var m = this.magnitude();
        if(m > 0) {this.div(m);}
    }
    limit(maxSize) {
        if(maxSize<=0){this.x=0;this.y=0;}
        else if(this.magnitude() > maxSize) {
            var ratio = this.magnitude() / maxSize;
            this.div(ratio);
        }
    }
    rotate(a){
        this.x = this.x * Math.cos(a) - this.y*Math.sin(a);
        this.y = this.x*Math.sin(a) + this.y*Math.cos(a);
    }
    static getNormalPoint(p,a,b){
        var ap = Vector2D.sub(p,a);
        var ab = Vector2D.sub(b,a);
        ab.normalize();
        ab.mult(ap.dot(ab));
        var normalPoint = Vector2D.add(a,ab);
        return normalPoint;
    }
    static project(p,angle,dist){
        var g = new Vector2D();
        g.x = Math.cos(angle)*dist;
        g.y = Math.sin(angle)*dist;
        g.add(p);
        g.x = parseFloat(g.x.toFixed(4));
        g.y = parseFloat(g.y.toFixed(4));
        return g;
    }

}

class Tile {

    constructor(loc,size) {
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
        if(a=='.'){a='grass';}
        else if(a==','){a='tile';}
        else if(a=='W'){a='window';this.walkable=false;this.passable=true,this.shootThrough =true;}
        else if(a=='D'){a='door';this.passable=false;this.walkable = false;this.shootThrough = false;}
        else if(a=='-'){a='carpet';}
        else if(a=='X'){a='wall';this.passable=false;this.walkable= false;this.shootThrough = false;}
        else if(a=='F'){a='mesh';this.passable=false;this.walkable=false;this.shootThrough = true;}
        else if(a=='V'){a='void';this.passable=true;this.walkable=true;this.shootThrough = true;}
        else if(a=='B'){a='voidBlock';this.passable=false;this.walkable=false;this.shootThrough = true;}
        
        this.type = a;
    }
}

class Raytrace {
    static castRay(p1,p2,floor=0, range='na', requireWalkable=false) {
        //initialisation phase
        //identify which voxel in which the ray origin lies
        //set distance of ray
        var dist = 2000;
        if(range !== 'na'){dist = range;}
        
        var diff = Vector2D.sub(p2,p1);

        var m = diff.magnitude();

        var ratio = dist/m;
        diff.mult(ratio);
        p2.x = p1.x + diff.x;
        p2.y = p1.y + diff.y;

        
        var X = Math.floor(p1.x/tileSize);
        var Y = Math.floor(p1.y/tileSize);

        if(X<0 || X>map.width-1 || Y<0 || Y>map.height-1){
            //exit early, start point outside of map :(
            return p1;
        }
        
        if(tiles[floor][Y][X].shootThrough==false){return p1;}
        var endTileX = Math.floor(p2.x/tileSize);
        var endTileY = Math.floor(p2.y/tileSize);
        //TODO: if this is outside the grid we find the point in which the ray enters the grid and take the adjacent voxel
        var u = p1;
        var v = Vector2D.sub(p2,p1);
      
        v.normalize();
      
        //console.log(v);
        //ray: u + t.v
        var stepX = (v.x > 0 ? 1: -1);
        if(v.x == 0){stepX = 0;}
        var stepY = (v.y > 0 ? 1: -1);
        if(v.y == 0){stepY = 0;}
        // next we determine the value of t at which the ray crosses the first vertical voxel
        // boundary and store it in tMaxX, similar for tMaxY. The min of these tells us how far we need to travel
        // to reach the next voxel.

        
        var tMaxX = 0;
        if(stepX > 0) {tMaxX = ((X+1)*tileSize - u.x)/v.x;}
        if(stepX < 0) {tMaxX = (X*tileSize - u.x)/v.x;}

        var tMaxY = 0;
        if(stepY > 0) {tMaxY = ((Y+1)*tileSize - u.y)/v.y;}
        if(stepY < 0) {tMaxY = (Y*tileSize - u.y)/v.y;}
     
        // now compute how far along the ray, in units of t, we must move for the horiz/vert movement to
        // equal the width/height of a voxel

        var tDeltaX = Math.abs(tileSize/v.x);
        var tDeltaY = Math.abs(tileSize/v.y);
        
        var collisionPoint = new Vector2D();
        var allowedCollisions = 1;
        var currentCollisions = 0;
        while(!(X==endTileX) || !(Y==endTileY)) {
            if(tMaxX < tMaxY) {
                tMaxX += tDeltaX;
                X += stepX;

                var stop = false;
               // console.log(X);
                if(X < tiles[floor][0].length && Y < tiles[floor].length && X >= 0 && Y >= 0) {
                    if(getTiles()[floor][Y][X].shootThrough==false){stop=true;}
                    if(requireWalkable && getTiles()[floor][Y][X].walkable==false){stop=true;}
                }
                else{
                    stop=true;
                }
                if(stop==true){
                    currentCollisions++;
                    if(currentCollisions == allowedCollisions) {
                    // console.log('tile hit with stepx');
                    //hit a wall, stop and work out coordinates
                    //fix for a problem when step is negative    
                    var extra = (stepX<0 ? 1: 0);
                    collisionPoint.x = (X+extra)*tileSize;
                    // now work out y coordinate
                    // t dist is:
                    var t = (collisionPoint.x - u.x)/v.x;                 
                    //if(Math.abs(v.y)>10**10){v.y=0};
                    collisionPoint.y = u.y + t*v.y;                  
                    //scale up?
                    //collisionPoint.mult(tileSize);
                    return collisionPoint;
                }
                }
            }

            else {
                tMaxY += tDeltaY;
                Y += stepY;
                var stop = false;
                if(X < tiles[floor][0].length && Y < tiles[floor].length && X >= 0 && Y >= 0){
                    if(getTiles()[floor][Y][X].shootThrough==false){stop=true;}
                    if(requireWalkable && getTiles()[floor][Y][X].walkable==false){stop=true;}
                }
                else{
                    stop=true;
                }
                if(stop==true){
                    currentCollisions++;
                    if(currentCollisions == allowedCollisions){
                    //console.log('tile hit with stepy');
                    //fix for a problem when step is negative
                    var extra = (stepY<0 ? 1: 0);
                    collisionPoint.y = (Y+extra)*tileSize;
                    //work out X coordinate;
                    var t = (collisionPoint.y - u.y)/v.y;         
                    //if(Math.abs(v.x)>10**10){v.x=0};
                    collisionPoint.x = u.x + t*v.x;
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

    static collideRayGeneral(p1,p2,objects,floor=0) {
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

        return {x0:x0,
                y0:y0,
                x1:x1,
                y1:y1,
                currentMinT:currentMinT,
                collisionPosList:collisionPosList,
                collisionDists:collisionDists};
    }

    static collideBullet(p1,p2,objects,floor=0,owner) {
        
        var coll = Raytrace.collideRayGeneral(p1,p2,objects,floor);

        if(coll.collisionPosList.length>0){
            //objects[closestCollisionPos].pos.x = 200;
            //objects[closestCollisionPos].pos.y = 700;
           //sort collided object by increasing distance so the correct on is hit
            coll.collisionPosList = refSort(coll.collisionPosList,coll.collisionDists);
            var weaponPower = 1;
            for(var j = 0; j<coll.collisionPosList.length;j++){
                
                //only play hit once to reduce lag
            if(j==0){Sounds.playSound('zombiehit');}
               // canvasBuffer.getContext('2d').globalAlpha = 0.3;
              
                //draw blood
              // bufferctx.globalCompositeOperation = 'darken'; //multiply gets too dark
              //  bufferctx.fillStyle = '#AA2222';
                drawBloodAt(objects[coll.collisionPosList[j]].pos.x,objects[coll.collisionPosList[j]].pos.y,objects[coll.collisionPosList[j]].currentFloor);
              
              // canvasBuffer.getContext('2d').globalAlpha = 1;
                      // bufferctx.globalCompositeOperation = 'source-over';
               objects[coll.collisionPosList[j]].takeDamage(owner,weaponPower);


                weaponPower *= owner.weapon.penetrationMult;
                if(owner.weapon.penetration=='na'){j=coll.collisionPosList.length;}
                else{coll.currentMinT=1;}

            }
            
        }
        var finalRay = new Vector2D();
        finalRay.x = coll.x0 + coll.currentMinT*(coll.x1-coll.x0);
        finalRay.y = coll.y0 + coll.currentMinT*(coll.y1-coll.y0);
        return finalRay;
    }

    static collideList(p1,p2,objects,floor=0){
        var coll = Raytrace.collideRayGeneral(p1,p2,objects,floor);
        return refSort(coll.collisionPosList,coll.collisionDists);
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
    }
    follow(obj){
        this.x = obj.pos.x -w/2;
        this.y = obj.pos.y -h/2;
        this.floor = obj.currentFloor;
        this.constrainBounds();
    }
    setBoundingRect(rect){
        this.bounds = rect;
    }
    constrainBounds(){

        if(this.x > (this.bounds.x + this.bounds.w)*tileSize -w){this.x = (this.bounds.x + this.bounds.w)*tileSize -w;}
        if(this.x < this.bounds.x*tileSize){this.x = this.bounds.x*tileSize;}
        
        if(this.y > (this.bounds.y + this.bounds.h)*tileSize -h){this.y = (this.bounds.y + this.bounds.h)*tileSize -h;}
        if(this.y < this.bounds.y*tileSize ){this.y = this.bounds.y*tileSize;}
       // this.x = Math.floor(this.x);
       // this.y = Math.floor(this.y);
    }


}

var cols = ['#558844','#DD2244'];
var tileTypes = {grass: '#077524',
                 wall: '#7c746c',
                 tile: '#bfc9c2',
                 carpet: '#0d684a',
                 door: '#684b0d',
                 window: '#c3ebf7'};

class ProximityAction {
    constructor() {
        this.pos = new Vector2D();
       // this.radius = 0;
        this.tooltip = '';
        this.singleUse = false;
        this.price = 0;
        this.type = 'gun';
        this.gunName = '';
       // this.floor = 0;
        this.doorCoords = [];
        this.teleportConditions = {};
        this.triggers = [];
        this.customFunction = function(){};
        this.id = '';

        //this.id = '';
    }
    setTeleportDestination(f,x=0,y=0,relative=true){
        this.teleportConditions = {floor:f,x:x,y:y,relative:relative};
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
    setTooltip(str){
        this.tooltip = str;
    }
    setSingleUse(bool){
        this.singleUse = bool;
    }
    setPrice(p){
        this.price = p;
    }
    setGunName(n){
        this.gunName = n;
    }
    setType(t){
        this.type = t;
    }
    addDoorCoord(x,y,f,type=','){
        this.doorCoords.push({x:x,y:y,floor:f,type:type});

    }
    addTrigger(x,y,f,r){
        this.triggers.push({pos:new Vector2D(x,y),floor:f,radius:r});
    }
}

class Maps {
   constructor() {
    this.maps = [];

    /// map ndu
    this.maps['ndu'] = {width:40,height:29,floors:2,
            floor:[{data: '........................................' +
                           '........................................' +
                           '........................................' +
                           '........................................' +
                           '........................................' +
                           '........................................' +
                           '........................................' +
                           '..........XXWXXXXWXXXXXFWXXXXXXXXXXXXX..' +
                           '..........X,,,,X,,,,,,,,,,X----XXXXX-X..' +
                           '..........X,,,,X,,,,,,,,,,X----X---XDX..' +
                           '..........X,,,,,,,,,,,,,,,D----------X..' +
                           '..........X,,,,,,X-XX,X,X,X--------XXX..' +
                           '..........W,,,,,,XD-X,,,,,X--------XXX..' +
                           '..........XXXXXWXXXXXXXXXXXX-------X....' +
                           '...................XX.,,XXXX-------W....' +
                           '...................XX.XXXXXX---X---W....' +
                           '...........................X-------X....' +
                           '...........................W-------X....' +
                           '...........................X---X---X....' +
                           '...........................X-------X....' +
                           '...........................X-------X....' +
                           '...........................W---X---X....' +
                           '...........................X-------X....' +
                           '...........................XXXXXXWXX....' +
                           '........................................' +
                           '........................................' +
                           '........................................' +
                           '........................................' +
                           '........................................'},

                   {data:  '........................................' +
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
                           '........................................'}] };
    this.maps['ndu'].actions = [];
    this.maps['ndu'].teleportPoints = [];
    this.maps['ndu'].spawnPoints = [];
    this.maps['ndu'].spawnPoints.push({x:22.5*tileSize,y:9.5*tileSize,floor:0});
    this.maps['ndu'].spawnPoints.push({x:12.5*tileSize,y:9.5*tileSize,floor:0});
    this.maps['ndu'].spawnPoints.push({x:14.5*tileSize,y:11.5*tileSize,floor:0});
    this.maps['ndu'].spawnPoints.push({x:23.5*tileSize,y:12.5*tileSize,floor:0});
    

//help room door
    var act = new ProximityAction();
    act.addTrigger(26.5*tileSize,10.5*tileSize,0,tileSize);
    act.setTooltip('Open door [$1000]');
    act.price = 1000;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(26,10,0);
    this.maps['ndu'].actions.push(act);

//start stairs door
    var act = new ProximityAction();
    act.addTrigger(18.5*tileSize,12*tileSize,0,.5*tileSize);
    act.addTrigger(19*tileSize,12.5*tileSize,1,.5*tileSize);
    act.setTooltip('Clear Stairs [$1000]');
    act.price = 1000;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(18,12,0,'-');
    act.addDoorCoord(18,12,1,'V');
    this.maps['ndu'].actions.push(act);

    //help room stairs door
    var act = new ProximityAction();
    act.addTrigger(36.5*tileSize,10*tileSize,0,.5*tileSize);
    act.addTrigger(36.5*tileSize,9*tileSize,1,.5*tileSize);
    act.setTooltip('Clear Stairs [$1000]');
    act.price = 1000;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(36,9,0,'-');
    act.addDoorCoord(36,9,1,'V');
    this.maps['ndu'].actions.push(act);

    act = new ProximityAction();
    act.addTrigger(20.5*tileSize,8*tileSize,0,.75*tileSize);
    act.setTooltip('Buy Kar98k [$500]');
    act.price = 500;
    act.setGunName('Kar98k')
    this.maps['ndu'].actions.push(act);

    act = new ProximityAction();
    act.addTrigger(35*tileSize,20.5*tileSize,0,.75*tileSize);
    act.setTooltip('Buy M1 Thompson [$1200]');
    act.setGunName('M1Thompson');
    act.price = 1200;
    this.maps['ndu'].actions.push(act);


    act = new ProximityAction();
    act.addTrigger(15*tileSize,9.5*tileSize,0,.5*tileSize);
    act.setGunName('M1Carbine');
    act.setTooltip('Buy M1 Carbine [$750]');
    act.price = 750;
    this.maps['ndu'].actions.push(act);

    act = new ProximityAction();
    act.addTrigger(28.5*tileSize,9.5*tileSize,0,.5*tileSize);
    act.setGunName('raygun');
    act.setTooltip('Open Mystery Box [$5000]');
    act.price = 5000;
    this.maps['ndu'].actions.push(act);

//help room stairs
    var act = new ProximityAction();
    act.addTrigger(36.5*tileSize,8.5*tileSize,0,.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setSingleUse(false);
    act.setType('teleport');
    act.setTeleportDestination(1);
    this.maps['ndu'].actions.push(act);
    this.maps['ndu'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})

    
    var act = new ProximityAction();
    act.addTrigger(36.5*tileSize,9.5*tileSize,1,.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setSingleUse(false);
    act.setType('teleport');
    act.setTeleportDestination(0);
    this.maps['ndu'].actions.push(act);
    this.maps['ndu'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   
//outside stairs
    var act = new ProximityAction();
    act.addTrigger(23.5*tileSize,14.5*tileSize,0,.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setSingleUse(false);
    act.setType('teleport');
    act.setTeleportDestination(1);
    this.maps['ndu'].actions.push(act);
    this.maps['ndu'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   
  
    var act = new ProximityAction();
    act.addTrigger(22.5*tileSize,14.5*tileSize,1,.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setSingleUse(false);
    act.setType('teleport');
    act.setTeleportDestination(0);
    this.maps['ndu'].actions.push(act);
    this.maps['ndu'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   
   //start room stairs
    var act = new ProximityAction();
    act.addTrigger(19.5*tileSize,12.5*tileSize,0,.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setSingleUse(false);
    act.setType('teleport');
    act.setTeleportDestination(1);
    this.maps['ndu'].actions.push(act);
    this.maps['ndu'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   
   
    var act = new ProximityAction();
    act.addTrigger(18.5*tileSize,12.5*tileSize,1,.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setSingleUse(false);
    act.setType('teleport');
    act.setTeleportDestination(0);
    this.maps['ndu'].actions.push(act);
    console.log(act.triggers[0].floor)
    this.maps['ndu'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   
//

//upstairs
    act = new ProximityAction();
    act.addTrigger(36.5*tileSize,8*tileSize,1,.5*tileSize);
    act.setTooltip('Buy BAR [$1800]');
    act.price = 1800;
    act.setGunName('BAR')
    this.maps['ndu'].actions.push(act);

    //vkt

    this.maps['vkt'] = {width:80,height:80, floors:2,

 //80x80
           floor:[    //floor 0 
                      {data:'................................................................................' + 
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
                            '..............X,,,X,,,,,,W....................,,XXXXXXXXX.......................' + 
                            '..............X,,,X,,,,,,X.................XXX,,XXXXXXXXX.......................' + 
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
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................'},
                        //floor 1
                      {data:'................................................................................' + 
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
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................' + 
                            '................................................................................'}
                    ]};

    this.maps['vkt'].teleportPoints = [];
    this.maps['vkt'].spawnPoints = [];
    this.maps['vkt'].spawnPoints.push({x:22.5*tileSize,y:24.5*tileSize,floor:0});
    this.maps['vkt'].spawnPoints.push({x:23.5*tileSize,y:16.5*tileSize,floor:0});
    this.maps['vkt'].spawnPoints.push({x:20.5*tileSize,y:26.5*tileSize,floor:0});
    this.maps['vkt'].spawnPoints.push({x:20.5*tileSize,y:18.5*tileSize,floor:0});
    

    //actions
    this.maps['vkt'].actions = [];

    //downstairs

    //left room
    act = new ProximityAction();
    act.addTrigger(21*tileSize,20.5*tileSize,0,tileSize);
    act.setTooltip('Requires Power');
    act.price = Infinity;
    act.setType('tooltip');
    act.id = 'spawnDoorTooltip';
    this.maps['vkt'].actions.push(act);

    //left room
    act = new ProximityAction();
    act.addTrigger(25*tileSize,14*tileSize,0,.75*tileSize);
    act.setTooltip('Buy Kar98k [$500]');
    act.price = 500;
    act.setGunName('Kar98k')
    this.maps['vkt'].actions.push(act);

    //right room
    act = new ProximityAction();
    act.addTrigger(17*tileSize,21*tileSize,0,.75*tileSize);
    act.setTooltip('Buy Kar98k [$500]');
    act.price = 500;
    act.setGunName('Kar98k')
    this.maps['vkt'].actions.push(act);

    //right hallway
    act = new ProximityAction();
    act.addTrigger(32.5*tileSize,36*tileSize,0,.75*tileSize);
    act.setTooltip('Buy M1 Thompson [$1000]');
    act.price = 1000;
    act.setGunName('M1Thompson')
    this.maps['vkt'].actions.push(act);

    //left room stairs
    var act = new ProximityAction();
    act.addTrigger(20.5*tileSize,8.5*tileSize,0,tileSize);
     act.addTrigger(20.5*tileSize,8.5*tileSize,1,tileSize);
    act.setTooltip('Clear Stairs [$1000]');
    act.price = 1000;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(20,8,0,'-');
    act.addDoorCoord(20,8,1,'V');
    this.maps['vkt'].actions.push(act);
    //up tp
    var act = new ProximityAction();
    act.addTrigger(21.5*tileSize,8.5*tileSize,0,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(1)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   //down tp
    var act = new ProximityAction();
    act.addTrigger(20.5*tileSize,8.5*tileSize,1,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(0)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   

    //right hallway
    var act = new ProximityAction();
    act.addTrigger(22*tileSize,29.5*tileSize,0,tileSize);
    act.setTooltip('Open door [$750]');
    act.price = 750;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(21,29,0);
    act.addDoorCoord(22,29,0);
    this.maps['vkt'].actions.push(act);

    //right back room
    var act = new ProximityAction();
    act.addTrigger(16*tileSize,25.5*tileSize,0,tileSize);
    act.setTooltip('Open door [$750]');
    act.price = 750;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(15,25,0);
    act.addDoorCoord(16,25,0);
    this.maps['vkt'].actions.push(act);

    act = new ProximityAction();
    act.addTrigger(15*tileSize,32.5*tileSize,1,.75*tileSize);
    act.setTooltip('Buy BAR [$1800]');
    act.price = 1800;
    act.setGunName('BAR')
    this.maps['ndu'].actions.push(act);

    //right hallway stairs
    var act = new ProximityAction();
    act.addTrigger(37*tileSize,35.5*tileSize,0,tileSize);
    act.addTrigger(37*tileSize,35.5*tileSize,1,tileSize);
    act.setTooltip('Clear Stairs [$1000]');
    act.price = 1000;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(36,35,0,'-');
    act.addDoorCoord(37,35,0,'-');
    act.addDoorCoord(36,35,1,'-');
    act.addDoorCoord(37,35,1,'-');
    this.maps['vkt'].actions.push(act);

    //up tp
    var act = new ProximityAction();
    act.addTrigger(36.5*tileSize,35.5*tileSize,0,0.5*tileSize);
    act.addTrigger(37.5*tileSize,35.5*tileSize,0,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(1)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
    this.maps['vkt'].teleportPoints.push({x:act.triggers[1].pos.x,y:act.triggers[1].pos.y,floor:act.triggers[1].floor,destFloor:act.teleportConditions.floor})
  
   //down tp
    var act = new ProximityAction();
    act.addTrigger(36.5*tileSize,34.5*tileSize,1,0.5*tileSize);
    act.addTrigger(37.5*tileSize,34.5*tileSize,1,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(0)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
    this.maps['vkt'].teleportPoints.push({x:act.triggers[1].pos.x,y:act.triggers[1].pos.y,floor:act.triggers[1].floor,destFloor:act.teleportConditions.floor})
   
//upstairs
    
    //left door 1
    var act = new ProximityAction();
    act.addTrigger(34.5*tileSize,7.5*tileSize,1,tileSize);
    act.setTooltip('Open Door [$750]');
    act.price = 750;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(33,7,1,',');
    act.addDoorCoord(34,7,1,',');
    act.addDoorCoord(35,7,1,',');
    this.maps['vkt'].actions.push(act);

  //power room door left
    var act = new ProximityAction();
    act.addTrigger(46.5*tileSize,12.5*tileSize,1,tileSize);
    act.setTooltip('Open Door [$750]');
    act.price = 750;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(45,12,1,',');
    act.addDoorCoord(46,12,1,',');
    act.addDoorCoord(47,12,1,',');
    this.maps['vkt'].actions.push(act);

//power room door right
    var act = new ProximityAction();
    act.addTrigger(46.5*tileSize,20.5*tileSize,1,tileSize);
    act.setTooltip('Open Door [$750]');
    act.price = 750;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(45,20,1,',');
    act.addDoorCoord(46,20,1,',');
    act.addDoorCoord(47,20,1,',');
    this.maps['vkt'].actions.push(act);

    //turning on the power (open spawn door)
    //make a new decal layer with lighting?
    var act = new ProximityAction();
    act.addTrigger(43.25*tileSize,16.3*tileSize,1,0.75*tileSize);
    act.setTooltip('Turn Power On');
    act.price = 0;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(20,20,0,',');
    act.addDoorCoord(21,20,0,',');
    act.customFunction = function(){getActionsById('spawnDoorTooltip')[0].triggers[0].radius = 0;}
    this.maps['vkt'].actions.push(act);


    //right door 2
    var act = new ProximityAction();
    act.addTrigger(54*tileSize,30.5*tileSize,1,tileSize);
    act.setTooltip('Open Door [$1000]');
    act.price = 1000;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(53,30,1,',');
    act.addDoorCoord(54,30,1,',');
    this.maps['vkt'].actions.push(act);

    //right door 1
    var act = new ProximityAction();
    act.addTrigger(42.5*tileSize,33*tileSize,1,tileSize);
    act.setTooltip('Open Door [$750]');
    act.price = 750;
    act.setSingleUse(true);
    act.setType('door');
    act.addDoorCoord(42,32,1,',');
    act.addDoorCoord(42,33,1,',');
    this.maps['vkt'].actions.push(act);


//outside

//outside courtyard stairs 1
//up tp
    var act = new ProximityAction();
    act.addTrigger(39.5*tileSize,16.5*tileSize,0,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(1)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   //down tp
    var act = new ProximityAction();
    act.addTrigger(38.5*tileSize,16.5*tileSize,1,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(0)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})

//outside courtyard stairs 2
//up tp
    var act = new ProximityAction();
    act.addTrigger(53.5*tileSize,19.5*tileSize,0,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(1)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   //down tp
    var act = new ProximityAction();
    act.addTrigger(53.5*tileSize,18.5*tileSize,1,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(0)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
   
   //outside courtyard big stairs 3
    //up tp
    var act = new ProximityAction();
    act.addTrigger(46.5*tileSize,28.5*tileSize,0,0.5*tileSize);
    act.addTrigger(47.5*tileSize,28.5*tileSize,0,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(1)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
    this.maps['vkt'].teleportPoints.push({x:act.triggers[1].pos.x,y:act.triggers[1].pos.y,floor:act.triggers[1].floor,destFloor:act.teleportConditions.floor})
  
   //down tp
    var act = new ProximityAction();
    act.addTrigger(46.5*tileSize,27.5*tileSize,1,0.5*tileSize);
    act.addTrigger(47.5*tileSize,27.5*tileSize,1,0.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setType('teleport');
    act.setTeleportDestination(0)
    this.maps['vkt'].actions.push(act);
    this.maps['vkt'].teleportPoints.push({x:act.triggers[0].pos.x,y:act.triggers[0].pos.y,floor:act.triggers[0].floor,destFloor:act.teleportConditions.floor})
    this.maps['vkt'].teleportPoints.push({x:act.triggers[1].pos.x,y:act.triggers[1].pos.y,floor:act.triggers[1].floor,destFloor:act.teleportConditions.floor})
   



//test map

    this.maps['test'] = {width:20,height:15,floors:2,
    floor:[{data: '....................'+
                  '....................'+
                  '....................'+
                  '....................'+
                  '......XXFXFXXXX.....'+
                  '......F,,,,,,,X.....'+
                  '...XWXX,,,,,,,X.....'+
                  '...F..F,,,,,,,X.....'+
                  '...XXXX,,S,,FFX.....'+
                  '......F,,,,,--X.....'+
                  '......XXFXFXXXX.....'+
                  '....................'+
                  '....................'+
                  '....................'+
                  '....................'},
           {data: '....................'+
                  '....................'+
                  '....................'+
                  '....................'+
                  '......XXXXXXXXX.....'+
                  '......F,,F,,F,X.....'+
                  '...XXXX,F,,,,,X.....'+
                  '...XXXXF,,,,,,X.....'+
                  '...XXXX,F,,XX-X.....'+
                  '......F,,F,X--X.....'+
                  '......XXFXFXXXX.....'+
                  '....................'+
                  '....................'+
                  '....................'+
                  '....................'}]};
    
    this.maps['test'].actions =[];
    var act = new ProximityAction();
    act.addTrigger(13.5*tileSize,9.5*tileSize,0,.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setSingleUse(false);
    act.setType('teleport');
    act.setTeleportDestination(1);
    this.maps['test'].actions.push(act);

    
    var act = new ProximityAction();
    act.addTrigger(12.5*tileSize,9.5*tileSize,1,.5*tileSize);
    act.setTooltip('');
    act.price = 0;
    act.setSingleUse(false);
    act.setType('teleport');
    act.setTeleportDestination(0);
    this.maps['test'].actions.push(act);


    }

    getMap(){
        return this.maps[MAP_NAME];
    }
}

class RoundManager {

    constructor(){
        this.round = 0;
        this.zombiesKilled = 0;
        this.zombiesSpawned = 0;
        this.totalZombieKills = 0;

        //this reference is lost with setInterval, .bind(this) works!!
        this.timer = setInterval(this.spawnZombies.bind(this),1000);
    }
    
    getRound(){
        return this.round;
    }
    nextRound(){
        //new Howl({src: ['audio/roundstart.mp3'],html5:true}).play();
        if(getLivingPlayers()>0){
        this.round++;
        this.zombiesKilled = 0;
        this.zombiesSpawned = 0;

        Sounds.playSound('nextround');

        for(var p=0;p<NUM_PLAYERS;p++){
            if(players[p].down==true){
                players[p].health = players[p].maxHealth;
                players[p].down=false;
                players[p].currentWeapon = 0;
                players[p].weapon = null;
                players[p].weaponsList = [];
                players[p].addWeapon('M1911');
              
            }
        }

        }

   

    }
    addZombieKill(){
        this.totalZombieKills++;
        this.zombiesKilled++;
        if(this.zombiesKilled == this.getZombieCount(this.round,NUM_PLAYERS)){
             setTimeout(function(){Sounds.playSound('endround');},750);
            setTimeout(this.nextRound.bind(this),5000);
        }
    }
     getZombieHealth(a) {
        var b = 0;
        if (a < 10) {
            return 100*a;
        }
        return Math.round(900 * Math.pow(1.1, a - 9));
    }
    getMaxZombies(pcount){
        return (24 + (pcount-1)*6);
    }
    spawnZombies(){
        //small error at start of earlier rounds, maybe until reached 24 zombies for the firrst time?

       var max = this.getMaxZombies(NUM_PLAYERS);
    
        if(this.zombiesSpawned < this.getZombieCount(this.round,NUM_PLAYERS) && this.zombiesSpawned-this.zombiesKilled < max){
            //we need additional zombies
            for(var z = 0; z<getZombies().length;z++){
                if(getZombies()[z].alive==false){
                    getZombies()[z].alive=true;
                    getZombies()[z].health = this.getZombieHealth(this.round);
                    this.zombiesSpawned++;

                    //we spawned a new zombie, stop loop if we have enough for now
                    if(this.zombiesSpawned == this.getZombieCount(this.round,NUM_PLAYERS)){
                        z = getZombies().length; //exit the for loop
                    }

                }
            }
        }
    }

 // credit: zombulator.com

    getZombieCount(b,a=1) {
    if (1 == a) {
        if (b < 20) {
            var c = [6, 8, 13, 18, 24, 27, 28, 28, 29, 33, 34, 36, 39, 41, 44, 47, 50, 53, 56];
            return c[b - 1];
        }
        return Math.round(.09 * b * b - .0029 * b + 23.958);
        }
        if (2 == a) {
            if (b < 20) {
                var c = [7, 9, 15, 21, 27, 31, 32, 33, 34, 42, 45, 49, 54, 59, 64, 70, 76, 82, 89];
                return c[b - 1];
            }
            return Math.round(.1882 * b * b - .4313 * b + 29.212);
        }
        if (3 == a) {
            if (b < 20) {
                var c = [11, 14, 23, 32, 41, 47, 48, 50, 51, 62, 68, 74, 81, 89, 97, 105, 114, 123, 133];
                return c[b - 1];
            }
            return Math.round(.2637 * b * b + .1802 * b + 35.015);
        }
        if (4 == a) {
            if (b < 20) {
                var c = [14, 18, 30, 42, 54, 62, 64, 66, 68, 83, 91, 99, 108, 118, 129, 140, 152, 164, 178];
                return c[b - 1];
            }
            return Math.round(.35714 * b * b - .0714 * b + 50.4286);
        }
    }


}   

class SoundManager {
    constructor(){
        this.sounds = [];
        
        this.sounds['M1911fire'] = new Howl({src: ['audio/M1911fire.ogg'],html5:true,buffer:true,volume:0.05});
        this.sounds['M1911reload'] = new Howl({src: ['audio/M1911_reload.ogg'],html5:true,buffer:true,volume:0.15});

        this.sounds['Kar98kfire'] = new Howl({src: ['audio/Kar98kfire.ogg'],html5:true,buffer:true,volume:0.12});
        this.sounds['Kar98kbolt'] = new Howl({src: ['audio/Kar98k_boltpull.ogg'],html5:true,buffer:true,volume:0.15});
        this.sounds['Kar98kreload'] = new Howl({src: ['audio/Kar98k_reload.ogg'],html5:true,buffer:true,volume:0.15});

        this.sounds['M1Carbinefire'] = new Howl({src: ['audio/M1Carbinefire.ogg'],html5:true,buffer:true,volume:0.1});
        this.sounds['M1Carbinereload'] = new Howl({src: ['audio/M1Carbine_reload.ogg'],html5:true,buffer:true,volume:0.3});

        this.sounds['M1Thompsonfire'] = new Howl({src: ['audio/M1Thompsonfire.ogg'],html5:true,buffer:true,volume:0.1});
        this.sounds['M1Thompsonreload'] = new Howl({src: ['audio/M1Thompson_reload.ogg'],html5:true,buffer:true,volume:0.2});

        this.sounds['BARfire'] = new Howl({src: ['audio/BARfire.mp3'],html5:true,buffer:true,volume:0.1});
        this.sounds['BARreload'] = new Howl({src: ['audio/BAR_reload.mp3'],html5:true,buffer:true,volume:0.2});


        this.sounds['raygunfire'] = new Howl({src: ['audio/raygunfire.mp3'],html5:true,buffer:true,volume:0.2});
        this.sounds['raygunreload'] = new Howl({src: ['audio/raygunreload.mp3'],html5:true,buffer:true,volume:0.5});


        this.sounds['gunEmpty'] = new Howl({src: ['audio/gunempty.mp3'],html5:true,volume:0.2,
                                            sprite: {short:[900,200]}});

        this.sounds['hitmarker'] = new Howl({src: ['audio/hitmarker.wav'],html5:true,volume:0.3});
        this.sounds['purchase'] = new Howl({src: ['audio/purchase.wav'],html5:true,volume:0.5});
    
        this.sounds['endround'] = new Howl({src: ['audio/endround.mp3'],html5:true,volume:1});
        this.sounds['nextround'] = new Howl({src: ['audio/nextround.mp3'],html5:true,volume:1});
        this.sounds['playerhurt'] = new Howl({src: ['audio/pain.mp3'],html5:true,volume:0.2});
        this.sounds['zombiehit'] = new Howl({src: ['audio/fleshwound.mp3'],html5:true,volume:1});
    
        this.sounds['knife'] = new Howl({src: ['audio/knife.mp3'],html5:true,volume:0.5});

    }
    playSound(str,seekT=0){
        if(seekT==0){this.sounds[str].play();}
        else{this.sounds[str].seek(seekT).play();}
    }
    stopSound(str){
        this.sounds[str].stop();
    }
    playSprite(str,spr){
        this.sounds[str].play(spr);
    }
}

class Sprite {
    constructor(){
        this.currentFrame = 0;
        this.frames = 9;
        this.rotation = 0;
        this.x = 0;
        this.y = 0;
        this.size = 32;
        this.img = new Image();
    }
    nextFrame(){
        this.currentFrame++;
    }

}

class Stage {
    constructor(){
        this.objects = [];
    }
    addChild(spr){
        this.objects.push(spr);
    }
    removeChild(a){
        this.objects.splice(a,1);
    }
}


class ImageManager {
    constructor(){
        this.character = new Image();
        this.character.src = "images/character.png";
        this.character.frames = 4;
        this.character.currentFrame = 0;
        this.character.size= 32;

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

        this.reloadIndicator = new Image();
        this.reloadIndicator.src = "images/reloadindicator.png";

        this.reviveIndicator = new Image();
        this.reviveIndicator.src = "images/reviveindicator.png";

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
        this.floorDecals['vkt'][0] = new Image();
        this.floorDecals['vkt'][0].src = 'images/maps/vkt/floor_decals_0.png';
        this.floorDecals['vkt'][1] = new Image();
        this.floorDecals['vkt'][1].src = 'images/maps/vkt/floor_decals_0.png';
        this.wallDecals['vkt'] = [];
        this.wallDecals['vkt'][0] = new Image();
        this.wallDecals['vkt'][0].src = 'images/maps/vkt/wall_decals_0.png';
         this.wallDecals['vkt'][1] = new Image();
        this.wallDecals['vkt'][1].src = 'images/maps/vkt/wall_decals_1.png';



       // this.ndu_decal_floor = new Image();
       // this.ndu_decal_floor.src = 'images/maps/ndu-map-decals-floor.png';

        this.blood = new Image();
        //this.blood.src = 'images/blood-splat.png';
        this.blood.src = 'images/untitled-1.png';

        //melee test
        this.characterMelee = new Image();
        this.characterMelee.src = 'images/flash test/melee_attack.png';

        var weapons = ['M1911','Kar98k','M1Carbine','M1Thompson','raygun','BAR'];
        this.weaponIcon = [];
        for(var i  = 0; i<weapons.length;i++){
            this.weaponIcon[weapons[i]] = new Image();
            this.weaponIcon[weapons[i]].src = "images/weapons/" + weapons[i] + ".png";
        }
    }
    nextFrame(){
        this.character.currentFrame++;
        if(this.character.currentFrame == this.character.frames){
            this.character.currentFrame = 0;
        }
    }
}

class Player {
    constructor(){
        this.pos = new Vector2D();
        this.angleFacing = 0;
        this.speed = 2; 
        this.hasReleasedFire = true;
        this.hasReleasedSwitch = true;
        this.fire = false;
        this.action = false;
        this.sprint = false;
        this.referenceRay = new Vector2D();
        this.shootInterval = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.reload = false;
        this.displayTooltip = '';
        this.money = 0;
        this.weaponsList = [];
        this.maxWeapons = 2;
        this.currentWeapon = 0;
        this.weapon = null;
        this.currentFloor = 0;
        this.drawLaser = 0;
        this.ray = [new Vector2D(),new Vector2D()];
        this.origin = new Vector2D();
        this.down = false;
        this.currentFrame = 0;
        this.maxFrames = 4;
        this.moving = false;
        this.kills = 0;
        this.noclip = false;
        this.isMeleeing = false;
        this.melee = false;

        this.meleeWeapon = new MeleeWeapon('knife');
        this.meleeWeapon.setParentPlayer(this);
    }
    nextWeapon() {
        if(this.weaponsList.length > 1){
            this.hasReleasedFire = false;
            this.fire = false;
            this.weapon.reloading = false;
            this.weapon.reloadTimer = 0;
            this.currentWeapon++;
            if(this.currentWeapon == this.weaponsList.length){this.currentWeapon = 0;}
            this.weapon = this.weaponsList[this.currentWeapon];
        }
    }
    addWeapon(name){
        if(this.weaponsList.length == this.maxWeapons || this.weaponsList.length==0){
            this.weaponsList[this.currentWeapon] = new Weapon(name);
            this.weaponsList[this.currentWeapon].setParentPlayer(this);
            this.weapon = this.weaponsList[this.currentWeapon];
        }
        else{
        this.weaponsList.push(new Weapon(name));
        this.weaponsList[this.weaponsList.length-1].setParentPlayer(this);
        for(var i = 0; i < this.weaponsList.length-this.currentWeapon;i++){this.nextWeapon();}
        }
    }
    hasWeapon(name){
        for(var i = 0; i < this.weaponsList.length;i++){
            if(this.weaponsList[i].internalName==name){return true;}
        }
        return false;
    }
    damage(amount){
        if(!this.godmode){
        this.health -= amount;
            if(this.health <= 0){
                this.downPlayer();
            }
        }
    }

    downPlayer(){
        this.down = true;
        this.weapon.reloading = false;
        this.weapon.reloadTimer = 0;
        this.money = Math.round(this.money*0.95);

    }
}

class MeleeWeapon {
    constructor(type){
        this.angle = Math.PI/2;
        this.range = 20;
        this.sweep = 11; //how to subdivide the cone of fire
        this.meleeTimer = 0;
        this.cooldown = 25;
        this.cooldownTimer = 0;
        this.attacking = false;
        this.currentAngle = 0;
        this.parentPlayer = {};
        this.hitList = [];
        if(type=='knife'){
            this.type = type;
            this.damage = 135;
        }
    }

    canAttack(){
        return !this.attacking;
    }

    attack(){
       // console.log('melee attack');
        this.attacking = true;
        this.hitList = [];
        this.currentAngle = this.parentPlayer.playerFacing + this.angle/2;
        this.meleeTimer = 10;

        this.parentPlayer.isMeleeing = true;
    }
    tickUpdate(){
        if(this.meleeTimer > 0){
            this.meleeTimer--;
            this.attackStep();
            //this.currentAngle -= this.angle/this.sweep;



            if(this.meleeTimer==0){
                this.cooldownTimer = this.cooldown;
               // console.log('end attack phase');
            
            }

        }
        if(this.cooldownTimer > 0){
            this.cooldownTimer--;
            if(this.cooldownTimer == 0){
                this.attacking = false;
                this.parentPlayer.isMeleeing = false;
            }
        }

    }
    attackStep(){
         //parentplayer.canshoot = false;
           
            //raycast a few times for each angle
            //hit detection
            //check if already hit
            //increment angle
            var oldLength = this.hitList.length;

            for(var j = 0; j < 3; j++){
            var list = Raytrace.collideList(this.parentPlayer.pos,Vector2D.project(this.parentPlayer.pos,this.currentAngle,this.range),getZombies(),this.parentPlayer.currentFloor);
           
            for(var i = 0;i<list.length;i++){
                if(!this.hitList.includes(list[i])){
                    this.hitList.push(list[i]);

                    
                    //console.log('hit on ',this.meleeTimer);
              drawBloodAt(getZombies()[this.hitList[this.hitList.length-1]].pos.x,getZombies()[this.hitList[this.hitList.length-1]].pos.y,getZombies()[this.hitList[this.hitList.length-1]].currentFloor);
              
              // canvasBuffer.getContext('2d').globalAlpha = 1;
                      // bufferctx.globalCompositeOperation = 'source-over';
               getZombies()[this.hitList[this.hitList.length-1]].takeDamage(this.parentPlayer,1,'melee',this.damage);



                }
            }

            this.currentAngle -= this.angle/(3*this.sweep);

            }

            if(this.hitList.length > oldLength){Sounds.playSound('zombiehit');}
    }

     setParentPlayer(player){
        this.parentPlayer = player;
      
    }

}

class Weapon {
    constructor(type){
        this.reloading = false;
        this.currentMag = 0;
        this.currentReserve = 0;
        this.reloadTimer = 0;
        this.shootTimer = 0;
        this.rotateSpeed =1; //angle speed limited to reciprocal
        this.parentPlayer = {};
        if(type=='M1911'){
            this.name = 'M1911 Handgun';
            this.internalName = 'M1911';
            this.magSize = 8;
            this.maxAmmo = 80;//so set currentReserve to 80
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
            this.setupGun();
        }
        if(type=='Kar98k'){
            this.name = 'Kar98k Bolt-Action Rifle';
            this.internalName = 'Kar98k';
            this.magSize = 5;
            this.maxAmmo = 50;//so set currentReserve to 50
            this.startingAmmo = 55;
            this.semiAuto = true;//coded as semi auto with long fire delay
            this.fireRate = 75;
            this.damage = 100;
            this.reloadTime = 2;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.95;
            this.boltSound = null;
            this.stoppingPower = 40;
            this.rotateSpeed = 10;
            this.setupGun();
        }
        if(type=='M1Carbine'){
            this.name = 'M1 Carbine';
            this.internalName = 'M1Carbine';
            this.magSize = 15;
            this.maxAmmo = 120;//so set currentReserve to 80
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
            this.setupGun();
        }
        if(type=='M1Thompson'){
            this.name = 'M1 Thompson Submachine Gun';
            this.internalName = 'M1Thompson';
            this.magSize = 20;
            this.maxAmmo = 200;//so set currentReserve to 80
            this.startingAmmo = 220;
            this.semiAuto = false;
            this.fireRate = 5;
            this.damage = 120;
            this.reloadTime = 2.7;
            this.range = 'na';
            this.penetration = 'full';
            this.penetrationMult = 0.8;
            this.stoppingPower = 20;
            this.rotateSpeed = 7;
            this.setupGun();
        }
        if(type=='BAR'){
            this.name = 'BAR';
            this.internalName = 'BAR';
            this.magSize = 20;
            this.maxAmmo = 160;//so set currentReserve to 80
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
            this.setupGun();
        }
         if(type=='raygun'){
            this.name = 'Ray Gun';
            this.internalName = 'raygun';
            this.magSize = 20;
            this.maxAmmo = 160;//so set currentReserve to 80
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
            this.setupGun();
        }

    }
    setupGun(){
        this.currentMag = this.magSize;
        this.currentReserve = this.startingAmmo-this.magSize;
    }
    setParentPlayer(player){
        this.parentPlayer = player;
      
    }
    canFire(){
        return(this.currentMag>0 && !this.reloading && !this.parentPlayer.isMeleeing);
    }
    fire(){
       // drawLaser = true;
       this.parentPlayer.drawLaser = 2;
        this.currentMag--;
        if(this.internalName=='M1911'){Sounds.playSound('M1911fire');}
        else if(this.internalName=='Kar98k'){
            Sounds.playSound('Kar98kfire');
            if(this.canFire()){
                //bolt pull sound
                //this.boltSound = new Howl({src: ['audio/Kar98k_boltpull.ogg'],html5:true,volume:0.15});
                Sounds.stopSound('Kar98kbolt'); 
                Sounds.playSound('Kar98kbolt',0.3);
                //this.boltSound.seek(0.3).play();
        }

        }
        else if(this.internalName=='M1Carbine'){Sounds.playSound('M1Carbinefire');}
        else if(this.internalName=='M1Thompson'){Sounds.playSound('M1Thompsonfire');}
        else if(this.internalName=='BAR'){Sounds.playSound('BARfire');}
        else if(this.internalName=='raygun'){Sounds.playSound('raygunfire');}
        
        this.parentPlayer.ray[1] = Raytrace.collideBullet(this.parentPlayer.origin, Raytrace.castRay(this.parentPlayer.origin,this.parentPlayer.referenceRay,this.parentPlayer.currentFloor),zombies,this.parentPlayer.currentFloor,this.parentPlayer);
        //copy this for later rendering
        this.parentPlayer.ray[0].x = this.parentPlayer.origin.x;
        this.parentPlayer.ray[0].y = this.parentPlayer.origin.y;
        if(this.internalName=='raygun'){//create splash damage at location (I'll ignore walls for now?)
            createExplosion(this.parentPlayer,this.parentPlayer.ray[1],32,this.parentPlayer.currentFloor,300,1500);
        }
        if(this.canFire()){this.shootTimer = this.fireRate;}
        

    }
    click(){
        Sounds.playSprite('gunEmpty','short');
    }
    canReload(){
        return(this.currentReserve>0 && this.currentMag<this.magSize && !this.reloading && !this.parentPlayer.isMeleeing);
    }
    startReload(){
        this.reloadTimer = Math.floor(this.reloadTime*60);
        this.reloading = true;
        if(this.internalName=='M1911'){Sounds.playSound('M1911reload',0.25);}
        else if(this.internalName=='M1Carbine'){Sounds.playSound('M1Carbinereload',0.2);}
        else if(this.internalName=='M1Thompson'){Sounds.playSound('M1Thompsonreload');}
        else if(this.internalName=='BAR'){Sounds.playSound('BARreload');}
        else if(this.internalName=='raygun'){Sounds.playSound('raygunreload');}
        else if(this.internalName=='Kar98k'){
           Sounds.stopSound('Kar98kbolt');
            Sounds.playSound('Kar98kreload',0.2);
        }
    }
    endReload(){
        var amount = Math.min(this.currentReserve,this.magSize-this.currentMag);
        this.currentReserve -= amount;
        this.currentMag += amount;
    }
    tickUpdate(){
        if(this.reloadTimer>0){
            this.reloadTimer--;
            if(this.reloadTimer==0){
                this.reloading = false;
                this.endReload();
            }
        }
        if(this.shootTimer>0){this.shootTimer--;}

    }

}

class Path {
    constructor() {
        this.points = [];
        //this.start = a;
        //this.end = b;
        this.radius = 10;
    }
    addPoint(x,y){
        this.points.push(new Vector2D(x,y));
    }
}

class Zombie {
    constructor(x,y){
        this.pos = new Vector2D(x,y);
        this.angleFacing = 0;
        this.maxSpeed = .5;
        this.maxForce = 1;
        this.velocity = new Vector2D();
        this.desiredVelocity = new Vector2D();
        this.acceleration = new Vector2D();
        this.goSlow = false;
        this.path = new Path();
        this.maxFrames = 4;
        this.currentFrame = Math.floor(Math.random()*4);
        this.frameCounter = 0;
        this.attackCooldown = 60;
        this.currentCooldown = 0;
        this.attackDamage = 30;
        this.size = 10;
        this.debugPath = false;
        this.health = 100;
        this.alive = false;
        this.slowTimer = 0;
        this.sinOffset = Math.round(Math.random()*100);
        this.currentFloor=0;
      
    }
    setHealth(health){
        this.health = health;
    }
    update(){
        if(this.alive){
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        if(this.goSlow){this.goSlow=false;
            this.velocity.limit(this.maxSpeed);
            this.velocity.mult(0.1);
        }
        if(this.slowTimer>0){
            this.slowTimer--;
           
           this.velocity.mult(stoppingPower(this.slowTimer));
        }

    //add sinusoidal wandering
        this.sinOffset+= 0.5 * this.velocity.magnitude()/this.maxSpeed;
        if(this.sinOffset>200){this.sinOffset=0;}
        this.velocity.rotate((this.velocity.magnitude()/this.maxSpeed)*0.01*Math.sin(Math.PI*2*this.sinOffset/200));
            //could use optimisastion maybe, precompute values of sin
       

        this.pos.add(this.velocity);
        this.acceleration.mult(0);
        
        this.angleFacing -= AngleDifference(Math.atan2(this.velocity.y,this.velocity.x),this.angleFacing)/10;

        if(this.currentCooldown > 0) {this.currentCooldown--;}



    }
    }
    attack(){
        this.currentCooldown = this.attackCooldown;
    }
    canAttack(){
        return(this.currentCooldown == 0);
    }
    takeDamage(player, mult=1,type='gun',dmg=0){
        //assume weapon for now
       
        if(type=='gun'){
        this.slowTimer = player.weapon.stoppingPower*mult;
       
        this.health -= player.weapon.damage*mult;
        player.money += 10;
        if(this.health <= 0) {
            this.kill();
            player.money += 60;
            roundManager.addZombieKill();
            player.kills++;
        }
        }
        else if(type=='splash'){
            this.health -= dmg;
            player.money += 10;
            if(this.health <= 0) {
            this.kill();
            player.money += 60;
            roundManager.addZombieKill();
            player.kills++;
        }
        }
        else if(type=='melee'){
            this.health -= dmg;
            player.money += 10;
            if(this.health <= 0) {
                this.kill();
                player.money += 120;
                roundManager.addZombieKill();
                player.kills++;
            }
        }

    }
    kill(){
      //  this.pos.x = -100;
      //  this.pos.y = -100;
        var deathSprite = new Sprite();
        deathSprite.x = this.pos.x;
        deathSprite.y = this.pos.y;
        deathSprite.rotation = Math.random() * Math.PI*2;
        deathSprite.img = Images.zombiedeath;
        deathSprite.floor = this.currentFloor;
        GameStage.addChild(deathSprite);


        this.alive = false;
        var r = Math.random();
        var xpos = 0;
        var ypos = 0;
        if(r<0.25){xpos = tileSize*(-4 + Math.random()*(map.width+4));ypos = -2 -Math.random()*2*tileSize;}
        if(r<0.5){xpos = (-4 + Math.random()*(map.width+4))*tileSize;ypos = (map.height+2+Math.random()*2)*tileSize;}
        if(r<0.75){ypos = (-4+Math.random()*(map.height+4))*tileSize;xpos = -2 -Math.random()*2*tileSize;}
        else{ypos = (-4+Math.random()*(map.height+4))*tileSize;xpos = (map.width+2 +Math.random()*2)*tileSize;}
        this.pos.x = xpos;
        this.pos.y = ypos;
        this.currentFloor = 0;
        this.maxSpeed= 0.4+ Math.random()*0.4;

    }
    seek(target){
        this.desiredVelocity = Vector2D.sub(target,this.pos);
        this.desiredVelocity.normalize();
        this.desiredVelocity.mult(this.maxSpeed);
        
        var steer = Vector2D.sub(this.desiredVelocity, this.velocity);
        steer.limit(this.maxForce);
      //  steer.mult(2);
      
        this.applyForce(steer);
    }
    arrive(target){
        this.desiredVelocity = Vector2D.sub(target,this.pos);
        var d = this.desiredVelocity.magnitude();
        this.desiredVelocity.normalize();
        if(d < 35) {
            var newSpeed = this.maxSpeed*(d)/35;
            this.desiredVelocity.limit(newSpeed);
        }
        else{
            this.desiredVelocity.limit(this.maxSpeed);
        }
        var steer = Vector2D.sub(this.desiredVelocity,this.velocity);
        steer.limit(this.maxForce);
        steer.mult(1);
        this.applyForce(steer);
        if(d<35){
            //this.acceleration.limit(this.maxForce*d/50);
             //this.velocity.limit(this.maxVelocity*(-0.5 + d/50));
              this.acceleration.limit(0.05 + (d/35) * .2);
             this.velocity.limit(this.maxSpeed*(0.2 + (d/35) * .8));
            // this.velocity.limit(0.01);
             //this isn't doing anything...
             //find a better way to do this - limit max speed?
        }
    }
    follow(p){

        var predict = this.velocity;
        predict.normalize();
        predict.mult(4);
       
        var predictLoc = Vector2D.add(this.pos, predict);
        var target = null;
        var bestDist = 100000;
        var dir = null;
        for(var i = 0;i<p.points.length-1;i++){
             var a = p.points[i]
             var b = p.points[i+1];
             var normalPoint = Vector2D.getNormalPoint(predictLoc,a,b);
             if (normalPoint.x > Math.max(a.x,b.x) || normalPoint.x < Math.min(a.x,b.x) ||
                 normalPoint.y > Math.max(a.y,b.y) || normalPoint.y < Math.min(a.y,b.y)) {
                normalPoint = new Vector2D(b.x,b.y);
             // if normal outside path just set point to the end of the current segment
             }
            var dist = Vector2D.distance(predictLoc, normalPoint);
            if(dist < bestDist) {
                target = normalPoint;
                bestDist = dist;
                dir = Vector2D.sub(b,a);
            }
        }
        if(dir == null){dir = new Vector2D(1,0);
                        target = new Vector2D(1,0);}
        dir.normalize();
        dir.mult(30);
        target.add(dir);

        var distance = Vector2D.distance(normalPoint, predictLoc);
            if(distance > p.radius){
                this.seek(target);
            }
        
    }
    separate(units){
        var desiredSeparation = 24;
        var sum = new Vector2D();
        var count = 0;
        //project a point in front of unit to draw sight circle around
        var visionPoint = new Vector2D(this.pos.x + 20*Math.cos(this.angleFacing),this.pos.y +20*Math.sin(this.angleFacing));
        for(var i = 0; i< units.length; i++){
            if(this.currentFloor==units[i].currentFloor){
            var d = Vector2D.distance(this.pos,units[i].pos,true); //squared distances
            var d2 = Vector2D.distance(visionPoint,units[i].pos,true);
            if(d > 0 && d < desiredSeparation**2 && d2 < 20**2) {
                var diff = Vector2D.sub(this.pos,units[i].pos);
                diff.normalize();
               //diff.div(d);
                sum.add(diff);
                count++;
                if(units[i].velocity.magnitude() <= this.velocity.magnitude()){
                    this.goSlow = true;
                }
            }
        }
    }
        if(count>0){
            sum.div(count);
            var steer = Vector2D.sub(sum,this.velocity);
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
    applyForce(force){
        this.acceleration.add(force);
    }
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
class DijkstraMap {
    //need to work across all floors :(
    //3d time
    constructor(map){
        //be careful when setting object properties, sometimes it's just a pointer!
        //map keeps gettingp ointed to instead of cloned...
        this.isCalculating = false;
        this.finishedCalculating = true;
        this.counter = 0;
        this.map = {};
        this.map = JSON.parse(JSON.stringify(getMap()));
        //this.map = {floor: map.floor, floors:map.floors, width:map.width, height:map.height};
        this.clear = '.,W-SV';
        this.block = 'XDFB';
        this.cells = [];
        for(var i=0;i<this.clear.length;i++){
            for(var f=0;f<this.map.floors;f++){
               this.map.floor[f].data =  this.map.floor[f].data.replaceAll(escapeRegExp(this.clear.substring(i,i+1)),'Y');
             }
         }
         for(var i=0;i<this.block.length;i++){
             for(var f=0;f<this.map.floors;f++){
                this.map.floor[f].data = this.map.floor[f].data.replaceAll(escapeRegExp(this.block.substring(i,i+1)),'N');
             }
         }
         
         for(var f=0;f<this.map.floors;f++){
            this.cells[f] = [];
         for(var i =0; i<this.map.height;i++){
              this.cells[f][i] = [];
              for(var j = 0; j<this.map.width;j++){
              this.cells[f][i][j] = -1;
            var type = this.map.floor[f].data.charAt(i*this.map.width + j);

             if(type == 'Y') {
            this.cells[f][i][j] = 100000;
            }
            }
        
         }
     }
     //arbitrary test value
        this.setGoal(600,300,0);
    }
    setGoal(x,y,f=0){
    
        //console.log(this.cells);
        var xpos = Math.floor(x/tileSize);
        var ypos = Math.floor(y/tileSize);
          //  console.log(xpos,ypos,f);
      //  console.log(this.cells[f][ypos][xpos]);
       if(this.cells[f][ypos][xpos] >= 0){
              this.resetGrid();
            this.cells[f][ypos][xpos]=0;
            this.calculate();
        }
    

    }
    //goals = {x:,y:,floor:}
    setGoals(goals) {
        this.resetGrid();
        for(var g = 0; g < goals.length; g++){
            var xpos = Math.floor(goals[g].x/tileSize);
            var ypos = Math.floor(goals[g].y/tileSize);
            var f = goals[g].floor;
             if(this.cells[f][ypos][xpos] >= 0){
                this.cells[f][ypos][xpos]=0;
              }
        }
        //this.calculate();
    }
    calculate(){
        if(this.finishedCalculating){this.counter = 0;}
        this.isCalculating = true;
        this.finishedCalculating = false;
//optimise: run over several frames?
//had slow down on vkt but potentially due to graphics instead

//Iterate through the map's "floor" cells -- skip the impassable wall cells. 
//If any floor tile has a value that is at least 2 greater than its lowest-value 
//floor neighbour (in a cardinal direction - i.e. up, down, left or right), set it 
//to be exactly 1 greater than its lowest value neighbor. 
//Repeat until no changes are made.
//let's ignore edge cases lol
//console.log('being calculating');
//error when zombie in same cell as player? length of path 0?

//maybe write to a temporary map then overwrite when finished? Not really needed if we wait for calculation to finish before updating paths
        var hasChanged = true;
        var frameLimit = 10;
        var stepCounter = 0;
        while(hasChanged==true && stepCounter < frameLimit){
            //debugger;
            stepCounter++;
            this.counter++;
          //  console.log('iteration ',counter);
            hasChanged = false;
        for(var f=0;f<this.map.floors;f++){
          //  console.log('floor ',f);
            for(var i =1;i<this.map.height-1;i++){
                for(var j=1;j<this.map.width-1;j++){
                    //stairs at (x,y)=
                    // 36,8 down
                    //36,9 up
                    //now go through list
                    if(this.cells[f][i][j] >= 0){
                        //look at all neighbours
                        //how to check in 3d? :o

                        //3d stuff?
                        
                        for(var a=0;a<map.teleportPoints.length;a++){
                                // to do: account for teleports to different positions, not just floor
                            var stairInfo = map.teleportPoints[a];

                            var diff = stairInfo.destFloor - f;
                           // console.log(diff);
                            if(f==stairInfo.floor && j==Math.floor(stairInfo.x/tileSize) && i==Math.floor(stairInfo.y/tileSize)){
                             
                                if(this.cells[f+diff][i][j] >= 0 && this.cells[f+diff][i][j] - this.cells[f][i][j] < -1){
                                    this.cells[f][i][j]=this.cells[f+diff][i][j]+1;hasChanged=true;

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
                        if(this.cells[f][i-1][j] >= 0 && this.cells[f][i-1][j] - this.cells[f][i][j] < -1){
                            this.cells[f][i][j]=this.cells[f][i-1][j]+1;hasChanged=true;
                        }
                        if(this.cells[f][i+1][j] >= 0 && this.cells[f][i+1][j] - this.cells[f][i][j] < -1){
                            this.cells[f][i][j]=this.cells[f][i+1][j]+1;hasChanged=true;
                        }
                        if(this.cells[f][i][j-1] >= 0 && this.cells[f][i][j-1] - this.cells[f][i][j] < -1){
                            this.cells[f][i][j]=this.cells[f][i][j-1]+1;hasChanged=true;
                        }
                        if(this.cells[f][i][j+1] >= 0 && this.cells[f][i][j+1] - this.cells[f][i][j] < -1){
                            this.cells[f][i][j]=this.cells[f][i][j+1]+1;hasChanged=true;
                        }
                    
                    }

                }
            }

        }
    }
    if(hasChanged == false){
       // console.log('Dijkstra Map calculation complete after '+this.counter+'iterations');
        this.isCalculating = false;
        this.finishedCalculating = true;
    }


    }
    resetGrid(){
        for(var f=0;f<this.map.floors;f++){
        for(var i =0; i<this.map.height;i++){
              this.cells[f][i] = [];
              for(var j = 0; j<this.map.width;j++){
              this.cells[f][i][j] = -1;
            var type = this.map.floor[f].data.charAt(i*this.map.width + j);

             if(type == 'Y') {
            this.cells[f][i][j] = 100000;
            }
            }
        
         }
     }
    }
    findPath(startx,starty,f){
        startx = Math.floor(startx/tileSize);
        starty = Math.floor(starty/tileSize);

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
     
        try{
        path.addPoint(tileSize/2+startx*tileSize,tileSize/2+starty*tileSize);
        while(continueSearch && loopCount < maxLoops){
            loopCount++;
            continueSearch = false;
            currentValue = this.cells[searchF][searchy][searchx];
            if(this.cells[searchF][searchy-1][searchx] >= 0 && this.cells[searchF][searchy-1][searchx]<currentValue){
                continueSearch = true;
                nextx = searchx;
                nexty = searchy-1;
                nextF = searchF;
            }
            if(this.cells[searchF][searchy+1][searchx] >= 0 && this.cells[searchF][searchy+1][searchx]<currentValue){
                continueSearch = true;
                nextx = searchx;
                nexty = searchy+1;
                nextF = searchF;
            }
            if(this.cells[searchF][searchy][searchx-1] >= 0 && this.cells[searchF][searchy][searchx-1]<currentValue){
                continueSearch = true;
                nextx = searchx-1;
                nexty = searchy;
                nextF = searchF;
            }
            if(this.cells[searchF][searchy][searchx+1] >= 0 && this.cells[searchF][searchy][searchx+1]<currentValue){
                continueSearch = true;
                nextx = searchx+1;
                nexty = searchy;
                nextF = searchF;
            }
                //stairs - stop search so that zombies don't go the wrong way
                //scaleable version with list
            
            for(var a = 0;a<map.teleportPoints.length;a++){
                var stairInfo = map.teleportPoints[a];
                var diff = stairInfo.destFloor - searchF;

               //j==Math.floor(stairInfo.y/tileSize) && i==Math.floor(stairInfo.x/tileSize
                if(searchF==stairInfo.floor && searchx == Math.floor(stairInfo.x/tileSize) && searchy == Math.floor(stairInfo.y/tileSize) && 
                    this.cells[searchF + diff][searchy][searchx]<currentValue){
                        nextx = searchx;
                        nexty = searchy;
                        nextF = searchF+diff; 
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
            if(continueSearch == true){
                  path.addPoint(tileSize/2+nextx*tileSize,tileSize/2+nexty*tileSize);
            }
            searchx = nextx;
            searchy = nexty;
            searchF = nextF;

        }
    }
    catch (e) {
        //console.log(e);
        //console.log('pathfinding error, sending zombie directly to player');
        //if out of map bounds, either send to player (if same floor) or to centre of map
        path = new Path();
        path.addPoint(startx,starty);
    }
    // taken out for now as not sure how to determine what the current target is (could run findpath fully maybe if more accuracy needed)
     //   if(f==players[0].currentFloor){path.addPoint(players[0].pos.x,players[0].pos.y);}
        if(path.points.length==1){path.addPoint(map.width*tileSize/2,map.height*tileSize/2);}

        //now check if we can take a shortcut for more 'natural' paths
       // console.log(path.points);

       // use new Vector2D otherwise path is affected by function
        var dest = Raytrace.castRay(new Vector2D(path.points[0].x,path.points[0].y),new Vector2D(path.points[path.points.length-1].x,path.points[path.points.length-1].y),f,'na',true);

      //  console.log(path.points);
      //console.log(Vector2D.distance(path.points[0],dest,true) - Vector2D.distance(path.points[0],path.points[path.points.length-1],true));

        if(Vector2D.distance(path.points[0],dest,true) >= Vector2D.distance(path.points[0],path.points[path.points.length-1],true) ) {
           path.points.splice(1,path.points.length-2); // remove middle points
           // console.log(path.points);
        }

        return path;
//error detection code has screwed with pathfinding somehow? Maybe
//improve path following somehow, maybe add random component to vector
    }

}

function refSort (targetData, refData) {
    // Create an array of indices [0, 1, 2, ...N].
    var indices = Object.keys(refData);

    // Sort array of indices according to the reference data.
    indices.sort(function(indexA, indexB) {
      if (refData[indexA] < refData[indexB]) {
        return -1;
      } else if (refData[indexA] > refData[indexB]) {
        return 1;
      }
      return 0;
    });

    // Map array of indices to corresponding values of the target array.
    return indices.map(function(index) {
      return targetData[index];
    });
}

var scrollSpeed = 1.25;
var scrollVector = new Vector2D();
Mousetrap.bind('a', function(){scrollVector.x = scrollSpeed;});
Mousetrap.bind('a', function(){scrollVector.x = 0;}, 'keyup');
Mousetrap.bind('d', function(){scrollVector.x = -scrollSpeed;});
Mousetrap.bind('d', function(){scrollVector.x = 0;}, 'keyup');
Mousetrap.bind('w', function(){scrollVector.y = scrollSpeed;});
Mousetrap.bind('w', function(){scrollVector.y = 0;}, 'keyup');
Mousetrap.bind('s', function(){scrollVector.y = -scrollSpeed;});
Mousetrap.bind('s', function(){scrollVector.y = 0;}, 'keyup');

var transformVector = new Vector2D();

var mousePos = new Vector2D();
var tileSize =32;
var tilesWidth = Math.floor(w/tileSize);
var tilesHeight = Math.floor(h/tileSize);
var tiles = [];

var map = new Maps().getMap();
map.data = map.floor[0].data;

function getMap(){
    return map;
}


var canvases = [ctx,secondCanvas.ctx,thirdCanvas.ctx,fourthCanvas.ctx];
            
var cameraLocation = {x:0,y:0,floor:0};

var cameraBorders = [];
//if x/y 0, then will screw up at top left corner? :/
cameraBorders['test'] = {x:-1,y:-1,w:20,h:16};
cameraBorders['ndu'] = {x:5,y:2,w:34,h:26};
cameraBorders['vkt'] = {x:3,y:1,w:65,h:43};
var cameraBorder = cameraBorders[MAP_NAME];
var Images = new ImageManager();
var Sounds = new SoundManager();
var playerFacing = 0;
var spriteTestNum = 0;
var spriteTestNumZom=0;

var dijkstraMap = new DijkstraMap(map);


var players = [];

for(var n = 0; n<NUM_PLAYERS;n++){
players.push(new Player());

players[n].playerFacing  = 2*Math.PI*Math.random();
players[n].addWeapon('M1911');
}
//players[0].weapon = new Weapon('Kar98k');
//players[0].weapon = new Weapon('M1Carbine');
//players[0].weapon = new Weapon('M1Thompson');

var GameStage = new Stage();

//var ray = new Vector2D();
var gameCamera = new Camera();
gameCamera.setBoundingRect(cameraBorders[MAP_NAME]);
//init zombies
var zombies = [];
for(var i = 0;i<40;i++){
var r = Math.random();
var xpos = 0;
var ypos = 0;
if(r<0.25){xpos = Math.random()*map.width*tileSize;ypos = -Math.random()*4*tileSize;}
if(r<0.5){xpos = Math.random()*map.width*tileSize;ypos = (map.height+Math.random()*4)*tileSize;}
if(r<0.75){ypos = Math.random()*map.height*tileSize;xpos = -Math.random()*4*tileSize;}
else{ypos = Math.random()*map.height*tileSize;xpos = (map.width+Math.random()*4)*tileSize;}
zombies[i] = new Zombie(xpos,ypos);
zombies[i].maxSpeed= 0.65+ Math.random()*0.25;
zombies[i].maxForce = 1;
zombies[i].velocity.x = 1;
zombies[i].alive = false;
}

var roundManager = new RoundManager();
var gameStarted = false;

setTimeout(function(){
    roundManager.nextRound();
gameStarted = true;},7500);
           

var drawLaser = false;
for(var f= 0;f<map.floors;f++){
    tiles[f] = [];
for(var i =0; i<map.height;i++){
    tiles[f][i] = [];
    for(var j = 0; j<map.width;j++){
        tiles[f][i][j] = new Tile(new Vector2D(tileSize*(j % map.width),i*tileSize),tileSize);
        //tiles[i][j].setType('hello');
        var type = map.floor[f].data.charAt(i*map.width + j);

        tiles[f][i][j].setType(type);
        if(f !== 0 && tiles[f][i][j].type=='grass'){
            tiles[f][i][j].walkable = false;
            tiles[f][i][j].passable = false;
        }
       // if(Math.random() > 0.8){tiles[i][j].passable = false;}
    }
}
}

var offset = Math.round(Math.random()*4);
for(var n =0;  n<NUM_PLAYERS;n++){
            players[n].pos.x = map.spawnPoints[(n+offset) % map.spawnPoints.length].x;
            players[n].pos.y = map.spawnPoints[(n+offset) % map.spawnPoints.length].y;
            players[n].currentFloor = map.spawnPoints[(n+offset) % map.spawnPoints.length].floor;
            console.log('Player ',n,'spawned');
}


//var asd = Raytrace.castRay(new Vector2D(200,200),new Vector2D(300,100));
//var origin = new Vector2D(100,100);


function getTiles(){return tiles;}

var thinkCount = 1;


var filterStrength = 5;
var frameTime = 0, lastLoop = new Date, thisLoop;


// Report the fps only every second, to only lightly affect measurements
/*var fpsOut = document.getElementById('fps');
setInterval(function(){
  fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps";
},1000);*/


var hasDrawnBuffer = false;

function main() {

    var thisFrameTime = (thisLoop=new Date) - lastLoop;
  frameTime+= (thisFrameTime - frameTime) / filterStrength;
  lastLoop = thisLoop;
     
        window.requestAnimationFrame( main );
        
        currentTime = (new Date()).getTime();
        delta = (currentTime-lastTime);
        
        if(delta > interval && runGame == true) {
           //main game loop

          // ctx.transform(1,0,0,1,0,0);
          // ctx.clearRect(0,0,w,h);
           thinkCount++;
           if(thinkCount > 60){

                //start calculation of a new dijkstra map
                if(!dijkstraMap.isCalculating){
                  var goals = [];
                 for(var p = 0;p<NUM_PLAYERS;p++){
                        if(getLivingPlayers() == 0 || players[p].down==false){
                            goals.push({x:players[p].pos.x,y:players[p].pos.y,floor:players[p].currentFloor});
                        }
                     }
                     dijkstraMap.setGoals(goals);
                 }


                 dijkstraMap.calculate();

                //updatezombiepaths when complete - hopefully no map is so yuge that it will take more than 600 iterations
                if(dijkstraMap.finishedCalculating){
                    updateZombiePath();
                    thinkCount = 0;
                }


            }
           
          spriteTestNum++;
          spriteTestNumZom++;
          
          if(spriteTestNum % 12 == 0){
             spriteTestNum=0;
            
            for(var p =0;p<NUM_PLAYERS;p++){
           // Images.nextFrame();spriteTestNum=0;
              if(!players[p].down && players[p].moving){
                   players[p].currentFrame++;
                   if(players[p].currentFrame==players[p].maxFrames){players[p].currentFrame=0;}
                }
                else{
                    players[p].currentFrame = 0;
                }
            }
          }



            if(spriteTestNumZom % 18 == 0){
            for(var i = 0; i<zombies.length;i++){
                zombies[i].currentFrame++;
                if(zombies[i].currentFrame == zombies[i].maxFrames){
                    zombies[i].currentFrame = 0;
                }
            }
        }
          updatePositions();
           //cameraLocation = new Vector2D(200,200);
      //     ctx.setTransform(1,0,0,1,-Math.floor(cameraLocation.x),-Math.floor(cameraLocation.y));

            checkProximityActions();
            if(!hasDrawnBuffer){redrawMapBuffer();}
            //if(cameraLocation.x !== 0 && cameraLocation.y !== 0){
          
          //ctx.setTransform(1,0,0,1,-Math.floor(cameraLocation.x),-Math.floor(cameraLocation.y));
          //ctx.setTransform(1,0,0,1,0,0);
          
          // }
           for(var p = 0;p<NUM_PLAYERS;p++){
                var ctx = canvases[p];
               gameCamera.follow(players[p]);
              ctx.setTransform(1,0,0,1,-gameCamera.x,-gameCamera.y);
          
               renderAssets(ctx);
               ctx.setTransform(1,0,0,1,0,0);
               renderHud(ctx,p);
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



            for(var i = 0;i<NUM_PLAYERS;i++){
                //render player bullet over multiple frames to avoid issue with them sometimes not being shown
                if(players[i].drawLaser>0){players[i].drawLaser--;}
            }
        }
      
        
      
        lastTime = currentTime - (delta % interval);

    }
var asd = 0;
    //something is screwing up here when input is true...
function updatePositions() {

    for(var p = 0;p<NUM_PLAYERS;p++){
        var isRotating = false;
        if(players[p].down==false){
       // p=1;
       var ang = Math.atan2(input[p].axis1,input[p].axis0);
      if(input[p].axis0){  
          if(Math.abs(input[p].axis2) + Math.abs(input[p].axis3) > 0.4){
                    // players[0].playerFacing = Math.atan2(input.axis3*(Math.abs(input.axis3)>0.1?1:0),input.axis2*(Math.abs(input.axis2)?1:0));
                var angDiff = limit(AngleDifference(Math.atan2(input[p].axis3*(Math.abs(input[p].axis3)>0.1?1:0),input[p].axis2*(Math.abs(input[p].axis2)?1:0)),players[p].playerFacing),Math.PI*2/players[p].weapon.rotateSpeed)/5;

                players[p].playerFacing -= angDiff;
                if(Math.abs(angDiff) > 0.01){isRotating = true;}
            }
            var speedMult = 1;//speed penalty for walking backwards
            if(Math.abs(AngleDifference(players[p].playerFacing, Math.atan2(input[p].axis1*(Math.abs(input[p].axis1)>0.1?1:0),input[p].axis0*(Math.abs(input[p].axis0)?1:0)))) > Math.PI/2){speedMult=0.5;}
              scrollVector.x = -Math.cos(ang)*(Math.abs(input[p].axis0)>0.1 ? 1: 0)*speedMult;
            
            scrollVector.y = -Math.sin(ang)*(Math.abs(input[p].axis1)>0.1? 1:0)*speedMult;
            if(scrollVector.magnitude() > 0 || isRotating){players[p].moving = true;}
            else {players[p].moving = false;}
           // scrollVector.mult(scrollVector.magnitude()*scrollSpeed);
        
      } 
      //keyboard input
      if(KEYBOARD_INPUT==true && p == 0){
            var angDiff = limit(AngleDifference(keyboardInput.angle,players[0].playerFacing),Math.PI*2/players[0].weapon.rotateSpeed)/5;
           
             players[0].playerFacing -= angDiff;
             if(Math.abs(angDiff) > 0.01){isRotating = true;} 
              var speedMult = 1;
             //no penalty for walking backwards yet

             //mouse movement
             /*scrollVector.x = -Math.cos(keyboardInput.angle)*speedMult*keyboardInput.speed;
            scrollVector.y = -Math.sin(keyboardInput.angle)*speedMult*keyboardInput.speed;
               if(keyboardInput.speed > 0){players[0].moving = true}
            else{players[0].moving = false;}
        */

            var vel = new Vector2D();
            vel.x = -(keyboardInput.left*-1 + keyboardInput.right*1);
            vel.y = -(keyboardInput.up*-1 + keyboardInput.down*1);
            vel.normalize();
            if(Math.abs(AngleDifference(Math.atan2(-vel.y,-vel.x), keyboardInput.angle)) > Math.PI/2){speedMult=0.5;}
           

            if(vel.magnitude() > 0 || isRotating){players[0].moving = true;}
            else {players[0].moving = false;}
            scrollVector.x = vel.x*speedMult;
            scrollVector.y = vel.y*speedMult;
        

            if(keyboardInput.melee && players[0].hasReleasedMelee){players[0].melee=true;players[0].hasReleasedMelee = false;}
            else if(keyboardInput.melee==false){players[0].hasReleasedMelee = true;players[0].melee=false;}


             if(keyboardInput.fire && players[0].hasReleasedFire){players[0].fire = true;players[0].hasReleasedFire = false;}
             else if(keyboardInput.fire==false){players[0].hasReleasedFire = true;players[0].fire=false;}
          
            players[0].action = keyboardInput.action;
            players[0].reload = keyboardInput.reload;
        
            if(keyboardInput.switch && players[0].hasReleasedSwitch){players[0].nextWeapon();players[0].hasReleasedSwitch = false;}
            else if(keyboardInput.switch==false){players[0].switch=false;players[0].hasReleasedSwitch = true;}


      }
        //basic square collision detection for now

        if(players[p].noclip ==false){
        var floorX = Math.floor((players[p].pos.x-10)/tileSize);
        var floorY = Math.floor((players[p].pos.y-10)/tileSize);
        var xtop = players[p].pos.x-10;
        var ytop = players[p].pos.y-10;
        //it gets stuck sometimes, but does it matter? Implement walls if you are bothered
        
        for(var i = floorY; i<floorY+2; i++){
            for(var j = floorX;j<floorX+2;j++){
             
             
                    if(tiles[players[p].currentFloor][i][j].walkable==false){

                        var xchange = 0;
                        var ychange = 0;
                   if(xtop > j*tileSize-20 && xtop < (j+1)*tileSize && ytop < (i+1)*tileSize && ytop > i*tileSize-20){
                        //move min dist on x-axis
                        if(Math.abs(xtop + 20 - j*tileSize)<Math.abs((j+1)*tileSize - xtop)){xchange = xtop + 20 - j*tileSize;}
                        else{xchange = -(j+1)*tileSize + xtop;}
                        
                        if(Math.abs(ytop+20-i*tileSize) < Math.abs((i+1)*tileSize - ytop)){ychange = ytop+20-i*tileSize;}
                        else{ychange = -(i+1)*tileSize + ytop;}
                               
                        
                    }
                    if(Math.abs(xchange)<Math.abs(ychange)){players[p].pos.x -= xchange;}
                    else{players[p].pos.y -= ychange;}

                     xtop = players[p].pos.x-10;
                    ytop = players[p].pos.y-10;

                    }
    

                    
                }
            }
        }

            scrollVector.mult(-1);
        if(players[p].sprint){scrollVector.mult(2);}
        if(!(KEYBOARD_INPUT && p==0)){scrollVector.mult(Math.max((new Vector2D(input[p].axis0,input[p].axis1).magnitude())),1);}
        players[p].pos.add(scrollVector);
        scrollVector.mult(-1);
//regen player health
    players[p].health = Math.min(100,players[p].health+0.025);
    }
}
//zombie  behaviour
     
   
       for(var i = 0; i<zombies.length;i++){
        if(zombies[i].alive){
        //zombies[i].arrive(players[0].pos);
            var isTargetingPlayer = false;
             for(var p = 0;p<NUM_PLAYERS;p++){
                if(players[p].down==false){
                var r = Raytrace.castRay(new Vector2D(zombies[i].pos.x,zombies[i].pos.y),new Vector2D(players[p].pos.x,players[p].pos.y),zombies[i].currentFloor);

                //check zombie is close and can see player and is on same floor
                if(zombies[i].currentFloor==players[p].currentFloor && Vector2D.distance(zombies[i].pos,players[p].pos) < 50 && Vector2D.distance(zombies[i].pos,players[p].pos) + Vector2D.distance(players[p].pos,r)>=Vector2D.distance(zombies[i].pos,r)-1){
                    zombies[i].separate(zombies);
                    zombies[i].follow(zombies[i].path);
                  
                    zombies[i].arrive(players[p].pos);
                    isTargetingPlayer = true;
                   

                    //zombies[i].arrive(players[0].pos);

                  //  zombies[i].angleFacing = Math.atan2(players[0].pos.y-zombies[i].pos.y,players[0].pos.x-zombies[i].pos.x;)
                }
               // if(Vector2D.distance(zombies[i].pos,players[0].pos)<50){
               //     zombies[i].arrive(players[0].pos);zombies[i].separate(zombies);}
                
                //    zombies[i].arrive(players[0].pos);zombies[i].separate(zombies);
               // }
           }
                }
                 if(!isTargetingPlayer){ zombies[i].follow(zombies[i].path);zombies[i].separate(zombies);}

          zombies[i].update();      
       }
}
        // let's try for the zombies yay...
        // zombie collision detection
        for(var z =0; z<zombies.length;z++){
            if(zombies[z].alive){

            var floorX = Math.floor((zombies[z].pos.x-8)/tileSize);
            var floorY = Math.floor((zombies[z].pos.y-8)/tileSize);
              for(var i = floorY; i<floorY+2; i++){
                    for(var j = floorX;j<floorX+2;j++){
                        if(i<0 || i >map.height-1|| j<0 || j>map.width-1){
                            //zombie is outside of map, ignore this
                        }
                        else{
                        if(tiles[zombies[z].currentFloor][i][j].passable==false){

                            var xchange = 0;
                            var ychange = 0;
                            if(zombies[z].pos.x+8 > j*tileSize && zombies[z].pos.x-8 < (j+1)*tileSize &&
                                zombies[z].pos.y+8 > i*tileSize && zombies[z].pos.y-8 < (i+1)*tileSize){
                                //move min dist in x or y axis
                                 if(Math.abs(zombies[z].pos.x +8 - j*tileSize)<Math.abs((j+1)*tileSize - zombies[z].pos.x +8)){
                                    xchange = zombies[z].pos.x + 8 - j*tileSize;}
                                  else{xchange = -(j+1)*tileSize + zombies[z].pos.x - 8;}
                        
                             if(Math.abs(zombies[z].pos.y +8 -i*tileSize) < Math.abs((i+1)*tileSize - zombies[z].pos.y + 8)){ychange = zombies[z].pos.y+8-i*tileSize;}
                             else{ychange = -(i+1)*tileSize + zombies[z].pos.y -8;}
                               

                            if(Math.abs(xchange)<Math.abs(ychange)){zombies[z].pos.x -= xchange;}
                            else{zombies[z].pos.y -= ychange;}  

                            

                            }

                        }

                    }

                    }
                
            }

        }
              
        }
  
      //keep camera in bounds of map - laggy if size of map is size of border no idea why
      // if both coords are 0?
       /* //this works
        cameraLocation.x = players[0].pos.x - w/2;
        //keep camera in bounds of map
        if(cameraLocation.x > map.width*tileSize -w){cameraLocation.x = map.width*tileSize -w;}
        else if(cameraLocation.x < 4*tileSize){cameraLocation.x = 4*tileSize;}
        cameraLocation.y = players[0].pos.y - h/2;
        if(cameraLocation.y > (map.height-1)*tileSize -h){cameraLocation.y = (map.height-1)*tileSize -h;}
        else if(cameraLocation.y < 2*tileSize ){cameraLocation.y = 2*tileSize;}*/

        //adjust for each map
        //screws up if x and y too small, works fine for others?
   /*     cameraLocation.x = players[0].pos.x - w/2;
        if(cameraLocation.x > (cameraBorder.x + cameraBorder.w)*tileSize -w){cameraLocation.x = (cameraBorder.x + cameraBorder.w)*tileSize -w;}
        if(cameraLocation.x < cameraBorder.x*tileSize){
            cameraLocation.x = cameraBorder.x*tileSize;}
        cameraLocation.y = players[0].pos.y - h/2;
        if(cameraLocation.y > (cameraBorder.y + cameraBorder.h)*tileSize -h){cameraLocation.y = (cameraBorder.y + cameraBorder.h)*tileSize -h;}
        if(cameraLocation.y < cameraBorder.y*tileSize ){cameraLocation.y = cameraBorder.y*tileSize;}
*/
   //why does this screw up so much...
    /*   
    //else if(cameraLocation.x < 4*tileSize){cameraLocation.x = 4*tileSize;}
              //  cameraLocation.x = players[0].pos.x - w/2;
              //  cameraLocation.y =players[0].pos.y - h/2;
              //  cameraLocation.x = 0;
               //  cameraLocation.y = 0;
       
       // if(map.width >cameraBorder.w && map.height > cameraBorder.h){

      /*   
        if(cameraLocation.x < cameraBorder.x*tileSize){
             cameraLocation.x = cameraBorder.x*tileSize;
            //console.log('whyy');
        }

        if(cameraLocation.x > (cameraBorder.x+cameraBorder.w)*tileSize -w){
            cameraLocation.x = (cameraBorder.x+cameraBorder.w)*tileSize-w;
        }
        else{cameraLocation.x = players[0].pos.x - w/2;}


*//*
       if(map.width > cameraBorder.w && map.height > cameraBorder.h){
            console.log('check camera');
          cameraLocation.x = players[0].pos.x- w/2;
        if(cameraLocation.x < cameraBorder.x*tileSize){

            cameraLocation.x = cameraBorder.x*tileSize;
       
        }
        else if(cameraLocation.x > (cameraBorder.x + cameraBorder.w)*tileSize -w){
            cameraLocation.x = (cameraBorder.x + cameraBorder.w)*tileSize -w;
          
        }
       
          cameraLocation.y = players[0].pos.y- h/2;
        if(cameraLocation.y < cameraBorder.y*tileSize){

            cameraLocation.y = cameraBorder.y*tileSize;
          //  console.log('y too negative, set to 0');
           // console.log(cameraLocation.y);
        }
        else if(cameraLocation.y > (cameraBorder.y + cameraBorder.h)*tileSize -h){
            cameraLocation.y = (cameraBorder.y + cameraBorder.h)*tileSize -h;
           //    console.log('y too positive, set to edge');
        }
     }
     else{
        
//do nothing
     }
         //console.log('putting camera on player');
     
     
    //}

//cameraLocation.y = players[0].pos.y- h/2;
//cameraLocation.x = players[0].pos.x - w/2;
    
 //cameraLocation.x = 0;cameraLocation.y=0;
        //cameraLocation = new Vector2D(200,200);
        //cameraLocation.y = players[0].pos.y - h/2;
      //  transformVector = cameraLocation;

      */
        for(var i = 0; i<NUM_PLAYERS;i++){
            if(players[i].down==false){
        players[i].origin.x = players[i].pos.x + 18*Math.cos(players[i].playerFacing)-5*Math.sin(players[i].playerFacing);
        players[i].origin.y = players[i].pos.y + 18*Math.sin(players[i].playerFacing)+5*Math.cos(players[i].playerFacing);
        var randSpread = Math.random() * 1 - 0.5;
        players[i].referenceRay.x = players[i].pos.x + 36*Math.cos(players[i].playerFacing)-(5+randSpread)*Math.sin(players[i].playerFacing);
        players[i].referenceRay.y = players[i].pos.y + 36*Math.sin(players[i].playerFacing)+(5+randSpread)*Math.cos(players[i].playerFacing);
      
        //handle weapons and shooting
       
        players[i].weapon.tickUpdate();
        players[i].meleeWeapon.tickUpdate();

        if(players[i].melee &&  players[i].meleeWeapon.canAttack()){
            players[i].meleeWeapon.attack();
            players[i].hasReleasedFire = false;
            players[i].hasReleasedMelee = false;
            players[i].melee = false;
            players[i].fire = false;
            players[i].reload = false;
            players[i].weapon.reloading = false;
            players[i].weapon.reloadTimer = 0;

            Sounds.playSound('knife');

        }
        if(players[i].fire && players[i].weapon.shootTimer==0){
            if(players[i].weapon.canFire()){
                    players[i].fire=false;
                   // fire();
                    players[i].weapon.fire();
                    if(players[i].weapon.shootTimer == 0 && players[i].weapon.currentMag == 0 && players[i].weapon.canReload()){
                        players[i].weapon.startReload();
                    }
                    if(!players[i].weapon.semiAuto){
                        players[i].hasReleasedFire=true;
                    }
                   

            }
            else{
                players[i].fire=false;
                players[i].weapon.click();
                //auto reload
                if(players[i].weapon.canReload()){
                    players[i].weapon.startReload();
                }
            }
    
        
        }
        if(players[i].reload && players[i].weapon.canReload()){
            players[i].weapon.startReload();
        }
        if(players[i].fire && players[i].weapon.shootTimer > 0 && players[i].weapon.semiAuto){
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
for(var p = 0;p<NUM_PLAYERS;p++){
    if(players[p].down==false){
    for(var i = 0; i<zombies.length;i++){
        if(zombies[i].alive && zombies[i].currentFloor==players[p].currentFloor){
       if(Vector2D.distance(zombies[i].pos,players[p].pos)<24){
        // make sure zombies are vaguely facing player (might need tweaking)
           if(zombies[i].canAttack() && Math.abs(AngleDifference(zombies[i].angleFacing,Math.atan2(players[p].pos.y-zombies[i].pos.y,players[p].pos.x-zombies[i].pos.x)) < Math.PI/4)){
               players[p].damage(zombies[i].attackDamage);
               
               zombies[i].attack();
               if(players[0].godmode!==1){
               Sounds.playSound('playerhurt');
               Sounds.playSound('hitmarker');

                drawBloodAt(players[p].pos.x,players[p].pos.y,players[p].currentFloor);
               }
            }
        }
    }
    }
}
       }
}






//draw map tiles

//draw map to hidden canvas
function redrawMapBuffer(){

    //loop 3 times for redundancy? later
//bufferctx.fillStyle='F00';
   //background buffer
console.log('filling buffer');
    //draw background (below blood)
    for(var f=0;f<map.floors;f++){
    canvasBuffer.floor[f].ctx.clearRect(0,0,canvasBuffer.floor[f].width,canvasBuffer.floor[f].height);
    var bufferctx = canvasBuffer.floor[f].ctx;
    bufferctx.fillStyle='#000';
    for(var i = 0; i<tiles[f].length;i++){
        for(var j=0;j<tiles[f][i].length;j++){
          //  bufferctx.fillStyle = tileTypes[tiles[f][i][j].type];
            
            if(tiles[f][i][j].type == 'grass'&&f==0){
                bufferctx.drawImage(Images.grass, 32*(j%4), 32*(i%4), Images.grass.size, Images.grass.size, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.grass.size,Images.grass.size);
            }
            else if(tiles[f][i][j].type == 'tile'){
                bufferctx.drawImage(Images.tile, 64*(j%4), 64*(i%4), Images.tile.size*2, Images.tile.size*2, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.tile.size,Images.tile.size);
            }
             
            else if(tiles[f][i][j].type == 'carpet'){
                bufferctx.drawImage(Images.carpet, 64*(j%4),64*(i%4), Images.carpet.size*2, Images.carpet.size*2, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.carpet.size,Images.carpet.size);
            }
             else if(tiles[f][i][j].type == 'window'){
                bufferctx.drawImage(Images.grass, 32*(j%4), 32*(i%4), Images.grass.size, Images.grass.size, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.grass.size,Images.grass.size);
               }
            else if(tiles[f][i][j].type == 'mesh'){
                bufferctx.drawImage(Images.tile, 64*(j%4), 64*(i%4), Images.tile.size*2, Images.tile.size*2, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.tile.size,Images.tile.size);
            }
            else{

            //bufferctx.fillRect(tiles[f][i][j].pos.x,tiles[f][i][j].pos.y,tiles[f][i][j].size,tiles[f][i][j].size);
        }
        }
    
 }

 //fill ground decorations
            bufferctx.drawImage(Images.floorDecals[MAP_NAME][f],0,0);

}

//draw other layers in render
for(var f = 0; f<map.floors;f++){
canvasBuffer.walls[f].ctx.clearRect(0,0,canvasBuffer.walls[f].width,canvasBuffer.walls[f].height);
var bufferctx = canvasBuffer.walls[f].ctx;
for(var i = 0; i<tiles[f].length;i++){
        for(var j=0;j<tiles[f][i].length;j++){
            //bufferctx.fillStyle = tileTypes[tiles[f][i][j].type];
            if(tiles[f][i][j].type=='wall'){
                bufferctx.drawImage(Images.wall, 128*(j%2), 128*(i%2), Images.wall.size*4, Images.wall.size*4, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.wall.size,Images.wall.size);
            }
             else if(tiles[f][i][j].type == 'door'){
                bufferctx.drawImage(Images.door, 0,0, Images.door.size*4, Images.door.size*4, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.door.size,Images.door.size);
            }
             else if(tiles[f][i][j].type == 'window'){
                bufferctx.drawImage(Images.fence, 0,0, Images.fence.size*2.5, Images.fence.size*2.5, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.fence.size,Images.fence.size);
            }
            else if(tiles[f][i][j].type == 'mesh'){
                bufferctx.drawImage(Images.fence, 0,0, Images.fence.size*2.5, Images.fence.size*2.5, tiles[f][i][j].pos.x, tiles[f][i][j].pos.y,Images.fence.size,Images.fence.size);
            }
           
        }
    
 }

 //draw wall decals
 bufferctx.drawImage(Images.wallDecals[MAP_NAME][f],0,0);


}

//didn't load in time without putting into image class

//draw something as empty canvases render slowly for some reason
for(var i=0;i<canvasBuffer.blood.length;i++){
    canvasBuffer.blood[i].ctx.fillRect(0,0,0.1,0.1);
    }
//drawLayers[0].ctx.drawImage(canvasBuffer.floor[players[0].currentFloor],0,0);
//separate floor and other decals at some point
//drawLayers[0].ctx.drawImage(Images.ndu_decal_floor,0,0);

//drawLayers[3].ctx.clearRect(0,0,drawLayers[3].width,drawLayers[3].height);
//drawLayers[3].ctx.drawImage(Images.ndu_decal,0,0);


 hasDrawnBuffer=true;
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

    
    for(var f=0;f<gameCamera.floor+1;f++){
    // for(var f=0;f<2;f++){
    //for(var f= gameCamera.floor; f<gameCamera.floor+1;f++){

        
        if(f>0){
            ctx.setTransform(1,0,0,1,0,0);
            ctx.globalAlpha = 0.35;
            ctx.fillStyle='#000';
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.globalAlpha=1;
            //ctx.setTransform(1,0,0,1,-Math.floor(gameCamera.x),-Math.floor(gameCamera.y));
            ctx.setTransform(1,0,0,1,-(gameCamera.x),-(gameCamera.y));
          
        }
        //still something fishy going on
        // try using draw with img,sx,sy,sw,sh,dx,dy,dw,dh, might have an impact if not already optimised for drawing off canvas? :(
    //ctx.drawImage(canvasBuffer.floor[f],0,0);

    //option to halve resolution for more players
    // black lines on second floor - perhaps render the 35% black onto the floor buffer?

    ctx.drawImage(canvasBuffer.floor[f],gameCamera.x,gameCamera.y,w,h,gameCamera.x,gameCamera.y,w,h);

    ctx.globalAlpha=0.8;
    ctx.globalCompositeOperation='darken';
    ctx.drawImage(canvasBuffer.blood[f],gameCamera.x,gameCamera.y,w,h,gameCamera.x,gameCamera.y,w,h);
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';
    ctx.drawImage(canvasBuffer.walls[f],gameCamera.x,gameCamera.y,w,h,gameCamera.x,gameCamera.y,w,h);

    //draw zombies on that floor

   

    //draw zombies new style
    for(var i = 0; i < zombies.length;i++){
        if(zombies[i].alive && zombies[i].currentFloor == f){
        
        ctx.translate(zombies[i].pos.x,zombies[i].pos.y);
        ctx.rotate(zombies[i].angleFacing+Math.PI/2);
        ctx.drawImage(Images.zombie, zombies[i].currentFrame*Images.zombie.size,0,Images.zombie.size,Images.zombie.size,
                      -16,-21,Images.character.size,Images.character.size);
        ctx.rotate(-zombies[i].angleFacing-Math.PI/2);
        ctx.translate(-zombies[i].pos.x,-zombies[i].pos.y);
       
     }
    }

     //draw death sprites/animations
    for(var i =0;i<GameStage.objects.length;i++){
        if(GameStage.objects[i].floor == f){
            ctx.translate(GameStage.objects[i].x,GameStage.objects[i].y);
            ctx.rotate(GameStage.objects[i].rotation+Math.PI/2);
            ctx.drawImage(GameStage.objects[i].img, GameStage.objects[i].currentFrame*GameStage.objects[i].size,0,GameStage.objects[i].size,GameStage.objects[i].size,
                          -16,-21,GameStage.objects[i].size,GameStage.objects[i].size);
            ctx.rotate(-GameStage.objects[i].rotation-Math.PI/2);
            ctx.translate(-GameStage.objects[i].x,-GameStage.objects[i].y);
        }
       if(thinkCount%2==0){ GameStage.objects[i].nextFrame();} //animate at 30fps
        if(GameStage.objects[i].currentFrame>=GameStage.objects[i].frames){
           
             GameStage.removeChild(i);
        }
    }



}



   /* ctx.fillStyle='#00FF00';
    */
   /* ctx.font = "7px sans-serif";
    ctx.fillStyle="#F80";
    for(var i =0;i<dijkstraMap.map.height;i++){
        for(var j=0;j<dijkstraMap.map.width;j++){
            ctx.fillText(dijkstraMap.cells[i][j].toString(), 3+(j%dijkstraMap.map.width)*tileSize,12+i*tileSize);
        }
    }*/
  
    
  /*  ctx.beginPath();
    ctx.strokeStyle = '#FF0000';
    ctx.moveTo(origin.x,origin.y);
    ctx.lineTo(mousePos.x,mousePos.y);
    ctx.stroke();*/

    for(var i = 0; i < NUM_PLAYERS;i++){
  if(players[i].drawLaser>0 && players[i].currentFloor == gameCamera.floor){
    //console.log('drawlaser');
      ctx.lineWidth=1;
    ctx.beginPath();
    ctx.strokeStyle = '#FF0';
  //  ctx.strokeStyle = '#000';
    if(players[i].weapon.internalName=='raygun'){
        ctx.strokeStyle='#0F0';
        ctx.lineWidth = 4;
    }
    //ctx.globalCompositeOperation='lighten';
    //ctx.globalAlpha=0.5;
    ctx.moveTo(players[i].ray[0].x,players[i].ray[0].y);
    ctx.lineTo(players[i].ray[1].x,players[i].ray[1].y);
    ctx.stroke();
 // ctx.globalAlpha = 1;
  //ctx.globalCompositeOperation='source-over';
    
}

    ctx.strokeStyle='#FFFF00';
}
    //ctx.strokeCircle(ray.x, ray.y,5);

   // ctx.fillStyle='#40F';

   //draw player
   // ctx.translate(Math.floor(players[0].pos.x),Math.floor(players[0].pos.y));
   for(var p = 0;p<NUM_PLAYERS;p++){
    if(gameCamera.floor == players[p].currentFloor){
        if(players[p].down){ctx.globalAlpha = 0.65;}
    ctx.translate((players[p].pos.x),(players[p].pos.y));
    ctx.rotate(players[p].playerFacing+Math.PI/2);

    //test rendering for melee attack
    if(p==0 && players[0].meleeWeapon.meleeTimer > 0){
    ctx.drawImage(Images.characterMelee, 0+(10-players[p].meleeWeapon.meleeTimer)*Images.character.size,0,Images.character.size,Images.character.size,
                  -16,-21,Images.character.size,Images.character.size);
    }
    else{
    ctx.drawImage(Images.character, players[p].currentFrame*Images.character.size,p*Images.character.size,Images.character.size,Images.character.size,
                  -16,-21,Images.character.size,Images.character.size);
    }
    ctx.rotate(-players[p].playerFacing-Math.PI/2);
   // ctx.translate(-Math.floor(players[0].pos.x),-Math.floor(players[0].pos.y));
    ctx.translate(-(players[p].pos.x),-(players[p].pos.y));
     //  ctx.fillCircle(players[0].pos.x,players[0].pos.y,2);
       if(players[p].down){ctx.globalAlpha = 1;}
    }
}
//draw actions debug circles
     ctx.globalAlpha=0.4;
  for(var a = 0; a < map.actions.length;a++){
        if(map.actions[a].debug == true){
            for(var t=0;t<map.actions[a].triggers.length;t++){
                if(map.actions[a].triggers[t].floor == gameCamera.floor){
                ctx.fillCircle(map.actions[a].triggers[t].pos.x,map.actions[a].triggers[t].pos.y,map.actions[a].triggers[t].radius);
                }
            }
       }
   }
   ctx.globalAlpha=1;

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

      

      ctx.strokeStyle='#FF0000';
      for(var z = 0;z<zombies.length;z++){
        if(zombies[z].debugPath){
      ctx.beginPath();
      for(var i = 0; i < zombies[z].path.points.length-1;i++){

        ctx.moveTo(zombies[z].path.points[i].x,zombies[z].path.points[i].y);
        ctx.lineTo(zombies[z].path.points[i+1].x,zombies[z].path.points[i+1].y);
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

function renderHud(ctx,playerNum=0){
    var p = playerNum;
    var ctx = ctx;


    //reload indicator

    if(players[p].weapon.reloading){
        //console.log('reloading');
        ctx.translate(-gameCamera.x+players[p].pos.x,-gameCamera.y+players[p].pos.y -32);
        //img, sx, sy, sw, sh, dx, dy, dw, dh
        //full
        ctx.globalAlpha = 1;
        ctx.drawImage(Images.reloadIndicator, 0, 0, 32, 32,-16,-16,32,32);
        //empty
        var maxTime = Math.floor(players[p].weapon.reloadTime*60);
         var pctComplete = (maxTime-players[p].weapon.reloadTimer)/maxTime;
        // console.log(pctComplete);
        ctx.globalAlpha = 0.5;
        ctx.drawImage(Images.reloadIndicator, 32, 32*(1-pctComplete), 32, 32*(pctComplete),-16,-16+32*(1-pctComplete),32,32*(pctComplete));

        ctx.translate(-(-gameCamera.x+players[p].pos.x),-(-gameCamera.y+players[p].pos.y -32));

    }




    //hud bars
    ctx.globalAlpha = 0.5;
    var sourcex = 5 + ((100-players[p].health)/100)*122;
    var sourcewidth = 160 - 5 - ((100-players[p].health)/100)*122;
    var destx = w-160 + sourcex;
    ctx.drawImage(Images.hpbar,sourcex,0,sourcewidth,50,
                  destx,h-50,sourcewidth,50);
    ctx.globalAlpha = 1;
    ctx.drawImage(Images.hudbase,w-160,h-50);
    ctx.font = "14px sans-serif";
    if(players[p].weapon.currentMag <= Math.max(2,players[p].weapon.magSize*0.2)){ctx.fillStyle="#C54";}
    else{ctx.fillStyle="#000";}
    ctx.textAlign ="right";
  ctx.fillText(players[p].weapon.currentMag.toString(),w-75,h-15);
  ctx.textAlign="left";
    ctx.font = "10px sans-serif";
    if(players[p].weapon.currentReserve <= players[p].weapon.magSize*2){ctx.fillStyle="#C54";}
    else{ctx.fillStyle="#000";}
  ctx.fillText('/ '+players[p].weapon.currentReserve.toString(),w-73,h-15);
    
    ctx.drawImage(Images.weaponIcon[players[p].weapon.internalName],w-50,h-50);

    ctx.font = "20px sans-serif";
    ctx.textAlign="center";
    ctx.fillStyle='#FFF'
    ctx.fillText(players[p].displayTooltip,w/2,h-20);
    ctx.textAlign='right';
    ctx.font = "20px sans-serif";
    ctx.fillText('$' + players[p].money,w-7,h-55);




    //red effect when dead
    if(players[p].down==true){
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#600';
    ctx.setTransform(1,0,0,1,0,0);

    ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = 1;

    if(getLivingPlayers() == 0){
        ctx.textAlign='center';
        ctx.font = '80px serif';
        ctx.fillStyle='#fff';
        ctx.fillText('GAME OVER',w/2,h/2 - 50);
    
    }
}

    ctx.textAlign='left';
    ctx.font = "20px sans-serif";
    ctx.fillStyle = '#fff';
    ctx.fillText('Round: ' + roundManager.getRound(),15,h-15);
    ctx.fillText('Kills: ' + players[playerNum].kills,15,h-35);







}


function mouseMove(e) {
    gameCamera.follow(players[0]);
    var rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX-rect.left + gameCamera.x;
    mousePos.y = e.clientY-rect.top + gameCamera.y;
    keyboardInput.angle = Math.atan2(mousePos.y - players[0].pos.y,mousePos.x-players[0].pos.x)
    var vec = new Vector2D();
    vec.y = mousePos.y - players[0].pos.y;
    vec.x = mousePos.x-players[0].pos.x;
    var speed = vec.magnitude();
    
    if(speed > 100){keyboardInput.speed = 1;}
    else{keyboardInput.speed = 0;}
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

function updateZombiePath(){
     //dijkstraMap.setGoal(players[0].pos.x,players[0].pos.y,players[0].currentFloor);
   

   for(var i =0; i<zombies.length;i++){
        if(zombies[i].alive){
        // future - add penalty to paths already being travelled on somehow to avoid zombie trains
        // simpler - add 'favourite direction' to zombie, up left down or right to create more splits
        zombies[i].path = dijkstraMap.findPath(zombies[i].pos.x,zombies[i].pos.y,zombies[i].currentFloor); 
    }
    }  
}
//click handler
function regen(e){
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

function mouseUpHandler(e){
    keyboardInput.hasReleasedFire = true;
    keyboardInput.fire = false;
    //players[0].hasReleasedFire = true;
}

function keyDownHandler(e){
  //  console.log(e.keyCode);
    if(e.keyCode==KEYS.w){
        keyboardInput.up = true;
    }
    if(e.keyCode==KEYS.s){
        keyboardInput.down = true;
    }
    if(e.keyCode==KEYS.a){
        keyboardInput.left = true;
    }
    if(e.keyCode==KEYS.d){
        keyboardInput.right = true;
    }
    if(e.keyCode==KEYS.space){
        keyboardInput.pauseRotation = true;
    }
    if(e.keyCode==KEYS.e){
        keyboardInput.action = true;
    }
    if(e.keyCode==KEYS.r){
        keyboardInput.reload = true;
    }
    if(e.keyCode==KEYS.q){
        keyboardInput.switch = true;
        keyboardInput.hasReleasedSwitch = false;
    }
    if(e.keyCode==KEYS.c){
        keyboardInput.melee = true;
        keyboardInput.hasReleasedMelee = false;
    }

}

function keyUpHandler(e){
    if(e.keyCode==KEYS.w){
        keyboardInput.up = false;
    }
    if(e.keyCode==KEYS.s){
        keyboardInput.down = false;
    }
    if(e.keyCode==KEYS.a){
        keyboardInput.left = false;
    }
    if(e.keyCode==KEYS.d){
        keyboardInput.right = false;
    }
    if(e.keyCode==KEYS.space){
        keyboardInput.pauseRotation = false;
    }
    if(e.keyCode==KEYS.e){
        keyboardInput.action = false;
    }
    if(e.keyCode==KEYS.r){
        keyboardInput.reload = false;
    }
    if(e.keyCode==KEYS.q){
        keyboardInput.switch = false;
        keyboardInput.hasReleasedSwitch = true;
    }
    if(e.keyCode==KEYS.c){
        keyboardInput.melee = false;
        keyboardInput.hasReleasedMelee = true;
    }

}

function testSound(){
    new Howl({src: ['audio/Kar98kfire.ogg'],html5:true,volume:0.15}).play();
}

function checkProximityActions() {
    
    for(var p = 0;p<NUM_PLAYERS;p++){

        players[p].displayTooltip = '';
        if(players[p].down==false){
    for(var a = 0; a < map.actions.length;a++){
        var actions = map.actions[a];
        // if(players[0].currentFloor==actions.floor){
        for(var t = 0; t < actions.triggers.length;t++){
        if(players[p].currentFloor == actions.triggers[t].floor && Vector2D.distance(players[p].pos,actions.triggers[t].pos,true)<actions.triggers[t].radius**2){
            players[p].displayTooltip = actions.tooltip;
            if(players[p].action && players[p].money >= actions.price){
                actions.customFunction();

                if(actions.singleUse){//only run once
                    for(var tr = 0; tr < actions.triggers.length;tr++){
                        actions.triggers[tr].radius = 0;
                    }
                }

                if(actions.type=='gun'){

                    if(players[p].weapon.internalName!=actions.gunName){

                     if(!players[p].hasWeapon(actions.gunName)){
                        players[p].money -= actions.price;
                        players[p].addWeapon(actions.gunName);
                        Sounds.playSound('purchase');
                       
                    }
                    }
                    else{
                            if(players[p].weapon.currentReserve < players[p].weapon.maxAmmo) {
                                players[p].money -= Math.round(actions.price/2);
                                players[p].weapon.currentReserve = players[p].weapon.maxAmmo;
                                Sounds.playSound('purchase');
                            }
                        }

                


                }

                else if(actions.type=='door'){
                    players[p].money -= actions.price;
                    for(var i = 0; i < actions.doorCoords.length;i++){
                    getTiles()[actions.doorCoords[i].floor][actions.doorCoords[i].y][actions.doorCoords[i].x].setType(actions.doorCoords[i].type);
                     getTiles()[actions.doorCoords[i].floor][actions.doorCoords[i].y][actions.doorCoords[i].x].walkable = true;
                      getTiles()[actions.doorCoords[i].floor][actions.doorCoords[i].y][actions.doorCoords[i].x].passable=true;
                    getTiles()[actions.doorCoords[i].floor][actions.doorCoords[i].y][actions.doorCoords[i].x].shootThrough=true;

                      map.floor[actions.doorCoords[i].floor].data=map.floor[actions.doorCoords[i].floor].data.substring(0,map.width*actions.doorCoords[i].y + actions.doorCoords[i].x) + actions.doorCoords[i].type + map.floor[actions.doorCoords[i].floor].data.substring(map.width*actions.doorCoords[i].y + actions.doorCoords[i].x+1);
                      dijkstraMap.map.floor[actions.doorCoords[i].floor].data=dijkstraMap.map.floor[actions.doorCoords[i].floor].data.substring(0,map.width*actions.doorCoords[i].y + actions.doorCoords[i].x) + 'Y' + dijkstraMap.map.floor[actions.doorCoords[i].floor].data.substring(map.width*actions.doorCoords[i].y + actions.doorCoords[i].x+1);
                     }
                    //  console.log(map.data[actions.doorCoord.y]);
                     if(actions.price > 0){Sounds.playSound('purchase');}
                       redrawMapBuffer();
                     
                    }
                }
                //fix bug where you couldn't buy ammo if you didn't have the full price
                //instead of making a separate action to buy ammo... which I might do later
                else if(players[p].action && players[p].money >= Math.round(actions.price/2)){
                if(players[p].weapon.internalName==actions.gunName){

                if(players[p].weapon.currentReserve < players[p].weapon.maxAmmo) {
                            players[p].money -= Math.round(actions.price/2);
                            players[p].weapon.currentReserve = players[p].weapon.maxAmmo;
                            Sounds.playSound('purchase');
                        }
                    }
            }




                if(actions.type=='teleport'){
                    console.log('teleport)');
                    players[p].currentFloor = actions.teleportConditions.floor;

                  //  redrawMapBuffer();


                }
               /* if(actions.type=='customPassive'){
                    actions.customFunction();
                }*/

                            
                        }

                    }
                   //}

                   }

                }

            }

   for(var a = 0; a < map.actions.length;a++){
    var actions = map.actions[a];
     for(var t = 0; t < actions.triggers.length;t++){
        if(actions.type=='teleport'){
            for(var z = 0;z<zombies.length;z++){
            if(Vector2D.distance(zombies[z].pos,actions.triggers[t].pos,true)<actions.triggers[t].radius**2){
                zombies[z].currentFloor = actions.teleportConditions.floor;

            }
        }
    }
   }

}


}

function createExplosion(owner,vec,radius,floor,mindmg,maxdmg){
    var dist =0;
    for(var i = 0; i<getZombies().length;i++){
       if(zombies[i].alive){ dist = Vector2D.distance(vec,getZombies()[i].pos);
        if(dist < radius && getZombies()[i].currentFloor == floor){
            //percentage how close to center??
              drawBloodAt(getZombies()[i].pos.x,getZombies()[i].pos.y,getZombies()[i].currentFloor);
               getZombies()[i].takeDamage(owner,1,'splash', mindmg + ((radius-dist)/radius)*(maxdmg-mindmg));
               
               
        }
    }
    }
    for(var p = 0;p<NUM_PLAYERS;p++){
        if(players[0].down==false){
    dist = Vector2D.distance(vec,players[p].pos);
    if(dist < radius && players[p].currentFloor == floor){  
    players[p].damage(10+((radius-dist)/radius)*70);
    drawBloodAt(players[p].pos.x,players[p].pos.y,players[p].currentFloor);
    Sounds.playSound('playerhurt');}
}
}
  

}

function drawBloodAt(x,y,floor){
    canvasBuffer.blood[floor].ctx.translate(x,y);
    var randang = Math.random() * 2* Math.PI;
    canvasBuffer.blood[floor].ctx.rotate(randang);
    //canvasBuffer.blood[floor].ctx.drawImage(Images.blood,0,0,178,178,-20,-14,35,35);
    canvasBuffer.blood[floor].ctx.drawImage(Images.blood,0,0,124,114,-12,-11,25,25);
    canvasBuffer.blood[floor].ctx.rotate(-randang);
    canvasBuffer.blood[floor].ctx.translate(-x,-y);
                 
}

function stoppingPower(x){
    //max around 45, 0 to 1
    return 2 - 2*Math.E**(x/10)/(1+Math.E**(x/10));

}

function getZombies(){
    return zombies;
}
 
 function endGame(){
  
    gameEnded=true;

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#600';
    ctx.setTransform(1,0,0,1,0,0);

    ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = 1;

    renderHud();
    ctx.textAlign='center';
    ctx.font = '80px serif';
    ctx.fillText('GAME OVER',w/2,h/2 - 100);
    
 }

function AngleDifference(angle1, angle2 )
{
    var diff = ( angle2 - angle1 + Math.PI) % (2*Math.PI) - Math.PI;
    return diff < -Math.PI ? diff + 2*Math.PI : diff;
}
//limit the absolute value
function limit(num,lim){
    if(Math.abs(num) > lim) {return (num < lim) ? -lim:lim;}
    return num;
}

function debugZombiePaths(){
    for(var i =0;i<zombies.length;i++){
    zombies[i].debugPath=!zombies[i].debugPath;
}
}


//http://stackoverflow.com/questions/9362716/how-to-duplicate-object-properties-in-another-object
function assign(object, source) {
  Object.keys(source).forEach(function(key) {
    object[key] = source[key];
  });
}

function getLivingPlayers(){
    var count = 0;
    for(var p = 0;p<NUM_PLAYERS;p++){
        if(players[p].down==false){count++;}
    }
    return count;
}

function getActionsById(id){
    actionList = [];
    for(var i = 0;i<map.actions.length;i++){
        if(map.actions[i].id == id){
            actionList.push(map.actions[i]);
        }
    }
    return actionList;

}

function activateCheats(){
    players[0].godmode = 1;players[0].noclip = 1;players[0].money = 999999;players[0].sprint = 1;
}
function testLag(){
    players[0].pos.x = 1100;players[0].pos.y = 1100;players[0].currentFloor = 1;
}
