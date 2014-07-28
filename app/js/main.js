var debugmode = false;

var states = Object.freeze({
    GetReadyScreen: 0,
    GameScreen: 1,
    ScoreScreen: 2
});

var currentstate;

var gravity = 0.25;
var velocity = 0;
var position = 180;
var rotation = 0;
var jump = -4.6;

var score = 0;
var highscore = 0;

var pipeheight = 120;
var pipewidth = 52;
var pipes = new Array();

var replayclickable = false;

//sounds
var volume = 30;
var soundJump = new buzz.sound("sounds/snd_wing.ogg");
var soundScore = new buzz.sound("sounds/snd_point.ogg");
var soundHit = new buzz.sound("sounds/snd_hitflames.ogg");
var soundDie = new buzz.sound("sounds/snd_die.ogg");
var soundMenu = new buzz.sound("sounds/snd_menu.ogg");
buzz.all().setVolume(volume);

//loops
var loopGameloop;
var loopPipeloop;

$(document).ready(function() {

  //get the highscore
   var savedscore = getCookie("highscore");
   if(savedscore != "")
      highscore = parseInt(savedscore);

  //start with the get ready screen
  showGetReady();
});

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++)
  {
    var c = ca[i].trim();
    if (c.indexOf(name)==0) return c.substring(name.length,c.length);
  }
  return "";
}

function setCookie(cname,cvalue,exdays) {
  var d = new Date();
  d.setTime(d.getTime()+(exdays*24*60*60*1000));
  var expires = "expires="+d.toGMTString();
  document.cookie = cname + "=" + cvalue + "; " + expires;
}

function showGetReady() {
  currentstate = states.GetReadyScreen;

  //set the defaults (again)
  velocity = 0;
  position = 180;
  rotation = 0;
  score = 0;

  //update the player for the next game
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

  //start up loops
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

  //if debug mode, draw the bounding box on player
  if(debugmode)
  {
    var boundingbox = $("#playerbox");
    boundingbox.css('left', boxleft);
    boundingbox.css('top', boxtop);
    boundingbox.css('height', boxheight);
    boundingbox.css('width', boxwidth);
  }

  //hit the ground?
  if(box.bottom >= $("#land").offset().top)
  {
    playerDead();
    return;
  }

  //don't try to escape on the top
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

  //if debug mode, draw the bounding box between pipes
  if(debugmode)
  {
    var boundingbox = $("#pipebox");
    boundingbox.css('left', pipeleft);
    boundingbox.css('top', pipetop);
    boundingbox.css('height', pipeheight);
    boundingbox.css('width', pipewidth);
  }

  //gotten inside the pipe yet?
  if(boxright > pipeleft)
  {
    //within the pipe, passed between upper and lower pipes?
    if(boxtop > pipetop && boxbottom < pipebottom)
    {
      // makers gona make
    }
    else
    {
     //touch the pipe
     playerDead();
     return;
    }
  }

  //passed the imminent danger?
  if(boxleft > piperight)
  {
    //yes, remove it
    pipes.splice(0, 1);

    //and score a point
    playerScore();
  }
}

//Handle space bar
$(document).keydown(function(e) {
  //space bar!
  if(e.keyCode == 32) {
    //in ScoreScreen, hitting space should click the "replay" button. else it's just a regular spacebar hit
    if(currentstate == states.ScoreScreen)
      $("#replay").click();
    else
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

function setBigScore(erase) {
  var elemscore = $("#bigscore");
  elemscore.empty();

  if(erase)
    return;

  var digits = score.toString().split('');
  for(var i = 0; i < digits.length; i++)
    elemscore.append("<img src='font/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setSmallScore() {
  var elemscore = $("#currentscore");
  elemscore.empty();

  var digits = score.toString().split('');
  for(var i = 0; i < digits.length; i++)
    elemscore.append("<img src='font/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setHighScore() {
  var elemscore = $("#highscore");
  elemscore.empty();

  var digits = highscore.toString().split('');
  for(var i = 0; i < digits.length; i++)
    elemscore.append("<img src='font/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setMedal() {
  var elemmedal = $("#medal");
  elemmedal.empty();

  if(score < 10)
    //signal that no medal has been won
    return false;

  if(score >= 10)
    medal = "bronze";
  if(score >= 20)
    medal = "silver";
  if(score >= 30)
    medal = "gold";
  if(score >= 40)
    medal = "platinum";

  elemmedal.append('<img src="images/medal_' + medal +'.png" alt="' + medal +'">');

  //signal that a medal has been won
  return true;
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

  //it's time to change states to scoreScreen to disable left click/flying
  currentstate = states.ScoreScreen;

  //destroy our gameloops
  clearInterval(loopGameloop);
  clearInterval(loopPipeloop);
  loopGameloop = null;
  loopPipeloop = null;


  //play the hit sound and then the dead sound
  soundHit.play().bindOnce("ended", function() {
     soundDie.play().bindOnce("ended", function() {
      showScore();
     });
  });
}

function showScore() {
  //unhide the menu
  $("#scoreboard").css("display", "block");

  //remove the big score
  setBigScore(true);

  //beaten the highscore?
  if(score > highscore)
  {
    //GG !
    highscore = score;
    //save
    setCookie("highscore", highscore, 999);
  }

  //update the scoreboard
  setSmallScore();
  setHighScore();
  var wonmedal = setMedal();

  //sound menu!
  soundMenu.stop();
  soundMenu.play();

  //show the scoreboard
  $("#scoreboard").css({ y: '40px', opacity: 0 }); //move it down so we can slide it up
  $("#replay").css({ y: '40px', opacity: 0 });
  $("#scoreboard").transition({ y: '0px', opacity: 1}, 600, 'ease', function() {
    //When the animation is done, animate in the replay button and SWOOSH!
    soundMenu.stop();
    soundMenu.play();
    $("#replay").transition({ y: '0px', opacity: 1}, 600, 'ease');

    //also animate in the MEDAL!
    if(wonmedal)
    {
      $("#medal").css({ scale: 2, opacity: 0 });
      $("#medal").transition({ opacity: 1, scale: 1 }, 1200, 'ease');
    }

  });

  //make the replay button clickable
  replayclickable = true;
}

$("#replay").click(function() {
  //make sure we can only click once
  if(!replayclickable)
    return;
  else
    replayclickable = false;
  //SWOOSH!
  soundMenu.stop();
  soundMenu.play();

  //fade out the scoreboard
  $("#scoreboard").transition({ y: '-40px', opacity: 0}, 1000, 'ease', function() {
    //when that's done, display us back to nothing
    $("#scoreboard").css("display", "none");

    //start the game over!
    showGetReady();
  });
});

function playerScore() {
  score += 1;

  //play score sound
  soundScore.stop();
  soundScore.play();
  setBigScore();
}

function updatePipes() {
  //Do any pipes need removal?
  $(".pipe").filter(function() { return $(this).position().left <= -100; }).remove()

  //add a new pipe (top height + bottom height  + pipeheight == 420)
  var padding = 80;
  var constraint = 420 - pipeheight - (padding * 2); //double padding (for top and bottom)
  var topheight = Math.floor((Math.random()*constraint) + padding); //add lower padding
  var bottomheight = (420 - pipeheight) - topheight;
  var newpipe = $('<div class="pipe animated"><div class="pipe-upper" style="height: ' + topheight + 'px;"></div><div class="pipe-lower" style="height: ' + bottomheight + 'px;"></div></div>');
  $("#flyarea").append(newpipe);
  pipes.push(newpipe);
}
