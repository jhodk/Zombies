       
//####
var haveEvents = 'ongamepadconnected' in window;
var controllers = {};
var input = [];
var KEYBOARD_INPUT = true;
var keyboardInput = {left:0,right:0,up:0,down:0,reload:0,action:0,switch:0,melee:0,angle:0,switch:0,hasReleasedSwitch:1,hasReleasedMelee:1};
var KEYS = {w: 87,a:65,s:83,d:68,e:69,r:82,space:32,q:81,c:67};
//init inputs
for(var i = 0;i<4;i++){
  input[i] = {axis0:0,axis1:0,axis2:0,axis3:0};
}
function connecthandler(e) {
  addgamepad(e.gamepad);
  //console.log('connecthandler');
}

function addgamepad(gamepad) {
  controllers[gamepad.index] = gamepad;
 // controllers[0] = gamepad;

  // See https://github.com/luser/gamepadtest/blob/master/index.html
  requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  delete controllers[gamepad.index];
  //delete controllers[0];
}

function buttonPressed(b){
    if(typeof(b)=="object") {
        return b.pressed;
    }
    return b == 1.0;
}

function updateStatus() {
  if (!haveEvents) {
    scangamepads();
  }

  var i = 0;
  var j;
  //if p1 uses m+kb then start at 1
  var realGamepadIndex = 0 + KEYBOARD_INPUT;
  for (j in controllers) {
      
    var controller = controllers[j];//fixes an issue with controllers being charged producing ghost controllers
    a = controller.index;
    if(controller.timestamp !== 0 && !(realGamepadIndex==0 && KEYBOARD_INPUT==true) && realGamepadIndex < NUM_PLAYERS){
      p = realGamepadIndex;
      //hopefully deals with ghost controllers
    /*for (i = 0; i < controller.buttons.length; i++) {
      var b = 
      
      [i];
      var val = controller.buttons[i];
      var pressed = val == 1.0;
      if (typeof(val) == "object") {
        pressed = val.pressed;
        val = val.value;
      }

      if (pressed) {
        b.className = "button pressed";
      } else {
        b.className = "button";
      }
    }*/
    
    /*if(buttonPressed(controller.buttons[0])){players[a].up = true;}
    else{players[a].up = false;}
    if(buttonPressed(controller.buttons[5])){players[a].firingPrimary = true;players[a].firingSecondary = false;}
    else{players[a].firingPrimary = false;}
    if(buttonPressed(controller.buttons[4])){players[a].firingPrimary = false;players[a].firingSecondary = true;}
    else{players[a].firingSecondary = false;}
    xaxis = controller.axes[0].toFixed(4);
    yaxis = controller.axes[1].toFixed(4);
    if(xaxis > 0.2){players[a].right = true;players[a].xmulti = xaxis/(1-0.2);}
    else{players[a].right = false;}
    if(xaxis < -0.2){players[a].left = true;players[a].xmulti = xaxis/(-1+0.2);}
    else{players[a].left = false;}

    if(Math.pow(yaxis,2) + Math.pow(xaxis,2) > 0.5) {
        
        angle = Math.atan2(yaxis,xaxis);
         
        
        angle = Math.floor((angle+Math.PI/8)/(Math.PI/4))*(Math.PI/4);
        
        players[a].facing = angle;
       
        }*/
        //for(var p=0;p<NUM_PLAYERS;p++){
       if(runGame != undefined) {
          if(runGame && runGame==true) {
       
      if(buttonPressed(controller.buttons[2])){players[p].reload = true;}else{players[p].reload=false;}
      //if(buttonPressed(controller.buttons[4])){players[0].sprint = true;}else{players[0].sprint=false;}
      if(buttonPressed(controller.buttons[5]) && players[p].hasReleasedFire){players[p].fire = true;players[p].hasReleasedFire = false;}
      else if(!buttonPressed(controller.buttons[5])){players[p].hasReleasedFire = true;players[p].fire=false;}

        if( (buttonPressed(controller.buttons[1]) || buttonPressed(controller.buttons[11])) && players[p].hasReleasedMelee){
         players[p].melee = true; players[p].hasReleasedMelee = false;
        }
        else if(!(buttonPressed(controller.buttons[1]) || buttonPressed(controller.buttons[11]))){
        players[p].hasReleasedMelee = true; players[p].melee = false;
      }

      if(buttonPressed(controller.buttons[3]) && players[p].hasReleasedSwitch){players[p].nextWeapon();players[p].hasReleasedSwitch = false;}
      else if(!buttonPressed(controller.buttons[3])){players[p].hasReleasedSwitch = true;}
      

      if(buttonPressed(controller.buttons[4])){players[p].action = true;}else{players[p].action = false;}
     //}
     
      input[p].axis0 = controller.axes[0].toFixed(4);
      input[p].axis1 = controller.axes[1].toFixed(4);
      input[p].axis2 = controller.axes[2].toFixed(4);
      input[p].axis3 = controller.axes[3].toFixed(4);

          realGamepadIndex++;

    }

  }
}

    }
  requestAnimationFrame(updateStatus);
}

function scangamepads() {
  
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
        //players[i].gamepad = true;
      if (gamepads[i].index in controllers) {
        controllers[gamepads[i].index] = gamepads[i];
       // controllers[0] = gamepads[i];
        //set there to be only 1 controller for now
      } else {
        addgamepad(gamepads[i]);
      }
    }
  }
}


window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
  setInterval(scangamepads, 500);
}

//####