//debugmode false in prod
var debugmode = true;

var states = Object.freeze({
   GetReadyScreen: 0,
   GameScreen: 1,
});

var currentstate;

var gravity = 0.25;
var velocity = 0;
var position = 180;
var rotation = 0;
var jump = -4.6;

var score = 0;

var pipeheight = 90;
var pipewidth = 52;
var pipes = new Array();

//sounds
var volume = 30;
var soundJump = new buzz.sound("assets/sounds/snd_wing.ogg");
var soundScore = new buzz.sound("assets/sounds/snd_point.ogg");
var soundHit = new buzz.sound("assets/sounds/snd_hitflames.ogg");
var soundDie = new buzz.sound("assets/sounds/snd_die.ogg");
var soundMenu = new buzz.sound("assets/sounds/snd_menu.ogg");
buzz.all().setVolume(volume);

//loops
var loopGameloop;
var loopPipeloop;

$(document).ready(function() {

  //start with the get ready screen
  showGetReady();
});

function showGetReady() {
  currentstate = states.GetReadyScreen;

  //set the defaults (again)
  velocity = 0;
  position = 180;
  rotation = 0;
  score = 0;

  //update the player in preparation for the next game
  $("#player").css({ y: 0, x: 0});
  updatePlayer($("#player"));

  soundMenu.stop();
  soundMenu.play();

  //clear out all the pipes if there are any
  $(".pipe").remove();
  pipes = new Array();

  //make everything animated again
  $(".animated").css('animation-play-state', 'running');
  $(".animated").css('-webkit-animation-play-state', 'running');

  //fade in the getready
  $("#getready").transition({ opacity: 1 }, 2000, 'ease');
}

function startGame() {
  currentstate = states.GameScreen;

  //fade out the getready
  $("#getready").stop();
  $("#getready").transition({ opacity: 0 }, 500, 'ease');

  //update the big score
  setBigScore();

  //debug mode ?
  if(debugmode)
  {
    //show the bounding boxes
    $(".boundingbox").show();
  }

  //start up our loops
  var updaterate = 1000.0 / 60.0 ; //60 times a second
  loopGameloop = setInterval(gameloop, updaterate);
  loopPipeloop = setInterval(updatePipes, 1400);

  //jump from the start!
  playerJump();
}

function updatePlayer(player) {
  //rotation
  rotation = Math.min((velocity / 10) * 90, 90);

  //apply rotation and position
  $(player).css({ rotate: rotation, top: position });
}

function gameloop() {
  var player = $("#player");

  //update the player speed/position
  velocity += gravity;
  position += velocity;

  //update the player
  updatePlayer(player);

  //create the bounding box
  var box = document.getElementById('player').getBoundingClientRect();
  var origwidth = 34.0;
  var origheight = 24.0;

  var boxwidth = origwidth - (Math.sin(Math.abs(rotation) / 90) * 8);
  var boxheight = (origheight + box.height) / 2;
  var boxleft = ((box.width - boxwidth) / 2) + box.left;
  var boxtop = ((box.height - boxheight) / 2) + box.top;
  var boxright = boxleft + boxwidth;
  var boxbottom = boxtop + boxheight;

  //if we're in debug mode, draw the bounding box on player
  if(debugmode)
  {
    var boundingbox = $("#playerbox");
    boundingbox.css('left', boxleft);
    boundingbox.css('top', boxtop);
    boundingbox.css('height', boxheight);
    boundingbox.css('width', boxwidth);
  }

  //did we hit the ground?
  if(box.bottom >= $("#land").offset().top)
  {
    playerDead();
    return;
  }

  //have they tried to escape on the top
  var brick = $("#brick");
  if(boxtop <= (brick.offset().top + brick.height()))
    position = 0;

  //we can't go any further without a pipe
  if(pipes[0] == null)
    return;

  //determine the bounding box of the next pipes inner area
  var nextpipe = pipes[0];
  var nextpipeupper = nextpipe.children(".pipe-upper");

  var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
  var pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
  var piperight = pipeleft + pipewidth;
  var pipebottom = pipetop + pipeheight;

  //if we're in debug mode, draw the bounding box between pipes
  if(debugmode)
  {
    var boundingbox = $("#pipebox");
    boundingbox.css('left', pipeleft);
    boundingbox.css('top', pipetop);
    boundingbox.css('height', pipeheight);
    boundingbox.css('width', pipewidth);
  }

  //have we gotten inside the pipe yet?
  if(boxright > pipeleft)
  {
    //we're within the pipe, have we passed between upper and lower pipes?
    if(boxtop > pipetop && boxbottom < pipebottom)
    {
       // makers gona make

    }
    else
    {
       //no! we touched the pipe
       playerDead();
       return;
    }
  }

  //have we passed the imminent danger?
  if(boxleft > piperight)
  {
    //yes, remove it
    pipes.splice(0, 1);

    //and score a point
    playerScore();
  }
}

//Handle space bar
$(document).keydown(function(e){
  //space bar!
  if(e.keyCode == 32) {
    screenClick();
  }
});

//Handle mouse down OR touch start
if("ontouchstart" in window)
   $(document).on("touchstart", screenClick);
else
   $(document).on("mousedown", screenClick);

function screenClick() {
  if(currentstate == states.GameScreen)
  {
    playerJump();
  }
  else if(currentstate == states.GetReadyScreen)
  {
    startGame();
  }
}

function playerJump() {
  velocity = jump;

  soundJump.stop();
  soundJump.play();
}

function setBigScore(erase)
{
   var elemscore = $("#bigscore");
   elemscore.empty();

   if(erase)
      return;

   var digits = score.toString().split('');
   for(var i = 0; i < digits.length; i++)
      elemscore.append("<img src='assets/font/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function playerDead() {
  //stop animating everything!
  $(".animated").css('animation-play-state', 'paused');
  $(".animated").css('-webkit-animation-play-state', 'paused');

  //drop the bird to the floor
  var playerbottom = $("#player").position().top + $("#player").width(); //we use width because he'll be rotated 90 deg
  var floor = $("#flyarea").height();
  var movey = Math.max(0, floor - playerbottom);
  $("#player").transition({ y: movey + 'px', rotate: 90}, 1000, 'easeInOutCubic');

  //destroy our gameloops
  clearInterval(loopGameloop);
  clearInterval(loopPipeloop);
  loopGameloop = null;
  loopPipeloop = null;


  //play the hit sound and then the dead sound
  soundHit.play().bindOnce("ended", function() {
     soundDie.play().bindOnce("ended", function() {
     });
  });

}

function playerScore()
{
   score += 1;

   //play score sound
   soundScore.stop();
   soundScore.play();
   setBigScore();
}

function updatePipes() {
  //Do any pipes need removal?
  $(".pipe").filter(function() { return $(this).position().left <= -100; }).remove()

  //add a new pipe (top height + bottom height  + pipeheight == 420) and put it in our tracker
  var padding = 80;
  var constraint = 420 - pipeheight - (padding * 2); //double padding (for top and bottom)
  var topheight = Math.floor((Math.random()*constraint) + padding); //add lower padding
  var bottomheight = (420 - pipeheight) - topheight;
  var newpipe = $('<div class="pipe animated"><div class="pipe-upper" style="height: ' + topheight + 'px;"></div><div class="pipe-lower" style="height: ' + bottomheight + 'px;"></div></div>');
  $("#flyarea").append(newpipe);
  pipes.push(newpipe);
}
