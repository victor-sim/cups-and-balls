// Enumeration value for game status
var enStep = {
	nInit: 0
	,nStarting: 1
	,nLuigiInit: 2
	,nCharacterInit: 3
	,nPlaying: 4
	,nSelect: 5
	,nOver: 6
	,nEndLevel:7
}

// Mario game main global value
var marioGame = {
	enStatus: enStep.nInit // Current status
				// 0 : Before user start the game, One Luigi character will roam around the playground alone. (Before start play) 
				// 1 : User selected to play. But still waiting until previous action(movement) is done.
				// 2 : Level initializing, System transforms Luigi to Mario
				// 3 : Level initializing, System creates new Mario objects and initializes those objects
				// 4 : Game Playing
				// 5 : A level is done, waiting user input
				// 6 : Game Over, When user select wrong answer twice
				// 7 : User selected right answer
	,nLevel: 0 // Current Level
	,nTurn: 0 // Number of turn in this level
	,nFrame: 0 // Number of frame at current turn
	,nTips: 5 // Number of tip and hack
	,nWrong: 0
};

marioGame.Action = [
	'Idle', 'Walk', 'Run' , 'Jump',
];
marioGame.Direction = [
	'L', 'R',
];
marioGame.Motion = [
	'IdleL', 'IdleR',
	'RunL', 'RunR',
	'WalkL1', 'WalkL2', 'WalkL3', 'WalkL4', 'WalkL5', 'WalkL6',
	'WalkR1', 'WalkR2', 'WalkR3', 'WalkR4', 'WalkR5', 'WalkR6',
	'SitL', 'SitR',
	'JumpL', 'JumpR',
];
marioGame.Character = [
	'Mario', 'Luigi',
];

// array to allocate and reallocate positions of characters
marioGame.Position = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9
];

/*
 *		This game's main starting function
 */
$(function(){
	// Initialize Luigi character
	// Set initial position of Luigi
	$("#characters").children().attr("destPos", 4);
	$("#characters").children().attr("srcPos", 5);
	// Create Luigi character and initialize images/motions
	initLuigi();
	
	// Initialize some sound resources
	initSound();
	
	// set number of game level
	document.getElementById('levelnum').innerHTML= marioGame.nLevel+1;

	// set game to initial status
	marioGame.enStatus = enStep.nInit;
		
	// start main game loop
	setInterval(gameLoop, 30);
});

/*
  main loop of the game
*/
function gameLoop(){
	if(marioGame.enStatus == enStep.nInit) // before user start the game
	{
		if(marioGame.nTurn == 0 && marioGame.nFrame == 0)
		{
			initGame();
		}
	}
	else if(marioGame.enStatus == enStep.nStarting) // User selected to play but wait until previous action is done
	{
		// Wait until previous motion is done
		if(marioGame.nFrame == 0) // if previous motion is done
		{
			// disable click event of some clickable objects, characters/items
			disableElements();
			// goes to next step
			marioGame.enStatus = enStep.nLuigiInit;
			marioGame.nTurn = 0;
			return;
		}
	}
	else if(marioGame.enStatus == enStep.nLuigiInit) // Level initializing, System transforms Luigi to Mario
	{
		transformLuigi();
		return;
	}
	else if(marioGame.enStatus == enStep.nCharacterInit) // Level initializing, System creates new Mario objects
	{
		// create and initialize characters
		initCharacters();
		// Goes to next step
		marioGame.enStatus = enStep.nPlaying;
		
		// init stage attributes
		marioGame.nTurn = 0;
		marioGame.nWrong = 0;
		
		// plays theme song
		marioGame.audMainTheme.play();
		return;
	}
	else if (marioGame.enStatus == enStep.nPlaying) // game playing
	{
		// do nothing
		// only draw updated images after this if-else statement
		;
	}
	else if (marioGame.enStatus == enStep.nSelect) // A level is done, waiting user input
	{
		if(marioGame.nFrame == 0){ // Runs only at first time
			// enable mouse event of characters and item elements
			enableElements();
			
			// Display "select where is Luigi" text for a while
			$("#select").addClass("appear").removeClass("disappear");
			setTimeout(disappearDiv, 2500);
			
			// stop main theme song and play user input mode song
			marioGame.audMainTheme.pause();
			if ( marioGame.audMainTheme.currentTime > 0 )
				marioGame.audMainTheme.currentTime = 0;
			marioGame.audSelect.play();
			
			marioGame.nFrame++;	
		}
		return;
	}
	else if (marioGame.enStatus == enStep.nOver) // Game Over, When user select wrong answer twice
	{
		// Display game over pop-up div for a while and initialize game properties
		if(marioGame.nFrame == 0)
		{
			gameOver();
			marioGame.nFrame++;
		}
		
		return;
	}
	else if (marioGame.enStatus == enStep.nEndLevel) // User selected right answer, Initialize Luigi character and goes back to level start step
	{
		disableElements();
		if(marioGame.nTurn == 0 && marioGame.nFrame == 0) // runs only at first time, Initialize Luigi character
		{
			initLuigi();
		}
		else if (marioGame.nTurn == 6) // Goes back to level start step after Luigi roam around 6 times
		{
			marioGame.enStatus = enStep.nStarting;
		}		
	}

	
	// Update character object images
	update();
	// One turn is done. Re-allocate character objects to new positions
	if(marioGame.nFrame ==0)
	{	
		nextTurn();
	}
}


/************************************************************************
 *	Attributes initializing functions
 *
 *
 ************************************************************************/
/*
	func initLuigi
	Initialize attributes of Luigi object 
	This function will be called at the very beginning,
	And after one level is done
*/
function initLuigi(){
	// set initial attributes
	$(".character:first-child").css({
		"left" : getPosX($("#characters").children().attr("srcPos")),
		"top" : 367,
		"z-index" : 10
	});
	$(".character:first-child").attr("character", marioGame.Character[1]);
	$(".character:first-child").removeClass( $("#characters").children().attr("motion") );
	// save current motion
	$(".character:first-child").attr("motion", $("#characters").children().attr("character")+marioGame.Motion[0]);
	// visually apply movement image
	$(".character:first-child").addClass( $("#characters").children().attr("motion") );
	
	// just for debugging
	$(".character:first-child").attr("index", 0);
}

/*
	func initSound
	make some background theme song loop-back play
	this function should be called at the very first time only
*/
function initSound(){
	var audio = new Audio();

	// check available audio type and set audio resources
	if (audio.canPlayType('audio/ogg')) {
		marioGame.audMainTheme = new Audio('./audio/bgMusic.ogg');
		marioGame.audTrans = new Audio('./audio/smb_warning.ogg');
		marioGame.audJump = new Audio('./audio/smb_jumpsmall.ogg');
		marioGame.audEnd = new Audio('./audio/smb_mariodie.ogg');
		marioGame.audNext = new Audio('./audio/smb_stage_clear.ogg');
		marioGame.audDie = new Audio('./audio/smb_die.ogg');
		marioGame.audSelect = new Audio('./audio/bgMusic2.ogg');
		marioGame.audBoom = new Audio('./audio/boom.ogg');
		// Audio resources
	}else if(audio.canPlayType('audio/mpeg')) {
		marioGame.audMainTheme = new Audio('./audio/bgMusic.mp3');
		marioGame.audTrans = new Audio('./audio/smb_warning.mp3');
		marioGame.audJump = new Audio('./audio/smb_jumpsmall.mp3');
		marioGame.audEnd = new Audio('./audio/smb_mariodie.mp3');
		marioGame.audNext = new Audio('./audio/smb_stage_clear.mp3');
		marioGame.audDie = new Audio('./audio/smb_die.mp3');
		marioGame.audSelect = new Audio('./audio/bgMusic2.mp3');
		marioGame.audBoom = new Audio('./audio/boom.mp3');
	} 

	// Initialized audio volume
	$("#sound").addClass("soundoff");
	soundControl();
		
	// register event handler of sound on/off button
	$("#sound").click(soundControl);
	
	$(marioGame.audMainTheme).bind('ended', function()  {
    	marioGame.audMainTheme.play();
	});
	$(marioGame.audSelect).bind('ended', function()  {
    	marioGame.audSelect.play();
	});
}

/*
	func initGame
	initialize game environment to the initial status
	this function should be called at gameLoop when its status is nInit status
*/
function initGame(){
	// init available number of hidden tip
	marioGame.nTips = 5;
	$("#level").click(tipNhack);
	$("#level").css({
		"cursor" : "help"
	});
	
	setTimeout( displayStart, 500);
	
}

/*
	func enableElements / disableElements
	This function enables or disables click event and mouse cursor type of some elements which are
	only clickable during user selection phase. such as Items, and game characters
 */
function enableElements(){
	// change mouse pointer type of character objects and item objects
	$("#characters").children().each(function(index) {
		$(this).css({
			"cursor" : "pointer"
		});	
		$(this).click(selectCharacter);
	});
	$('#items').children().each(function(index) {
		$(this).css({
			"cursor" : "pointer"
		});	
		$(this).click(useItem);
	});
}

function disableElements(){
	// change mouse pointer type of character objects and item objectsrs
	$("#characters").children().each(function(index) {
		if( !$(this).hasClass("character-removed") )
		{
			$(this).css({
					"cursor" : "not-allowed"
				});
			$(this).unbind();
		}	
	});
	$('#items').children().each(function(index) {
		if( !$(this).hasClass("character-removed") )
		{
			$(this).css({
				"cursor" : "not-allowed"
			});	
			$(this).unbind();
		}
	});
}

/*
	func initCharacters
	this function makes new character objects and initializes those new characters
*/
function initCharacters(){
	//make other character objects
	for(var i=0 ; i< getNumberOfCharacters() ;i++ ){
		$(".character:first-child").clone().appendTo("#characters");
	}
	$("#characters").children().each(function(index) {
		if(index != 0) // initialize Mario
		{
			// put new characters on the out side of play ground
			$(this).attr("srcPos", -1);
			$(this).attr("character", marioGame.Character[0]);
			$(this).css({
					"left" : getPosX($(this).attr("srcPos")),
					"z-index" : 10 - index
				});	
			
			$(this).attr("index", index);
			$(this).removeClass( $(this).attr("motion") );
			$(this).attr("motion", $(this).attr("character")+marioGame.Motion[0]);
			// save destination position for each character
			$(this).attr("destPos", marioGame.Position[index]); //marioGame.Position[index]);
			// visually apply movement image
			$(this).addClass( $(this).attr("motion") );
		}
		else{
			$(this).attr("destPos", marioGame.Position[index]);
		}
	});
}




/*************************************************************
 *		Event Handling Functions
 *
 *
 *************************************************************/
/*
	func startGame
	Event handler for game start button DIV
*/
 function startGame(){
	$("#start").unbind();
	
	//if(isCompatible() == true){ // for chrome
		$("#start").addClass("character-removed");
		$("#start").bind("webkitTransitionEnd", removeDiv);
		$("#start").bind("oTransitionEnd", removeDiv);
		$("#start").bind("otransitionend", removeDiv);
		$("#start").bind("transitionend", removeDiv);
		$("#start").bind("msTransitionEnd", removeDiv);
	/*}
	else // for IE and firefox
	{
		$("#start").empty();
		$("#start").remove();
	}*/
	
	// Initialize game items
	$("#items").append("<div class='item'></div>");
	$(".item:last-child").addClass("bomb");
	$("#items").append("<div class='item'></div>");
	$(".item:last-child").addClass("indicator");
	$("#items").append("<div class='item'></div>");
	$(".item:last-child").addClass("eraser");

	// Goes to next step
	marioGame.enStatus = enStep.nStarting;
	marioGame.nTurn = 0;
}

/*
	func soundControl
	Event handler function for sound on/off button DIV
*/
function soundControl(){
	// if it's sound on mode at the moment, toggle to sound off
	if( $("#sound").hasClass("soundon") )
	{
		$("#sound").removeClass("soundon");
		$("#sound").addClass("soundoff");
		marioGame.audMainTheme.volume=0;
		marioGame.audTrans.volume=0;
		marioGame.audEnd.volume=0;
		marioGame.audNext.volume=0;
		marioGame.audDie.volume=0;
		marioGame.audSelect.volume=0;
		marioGame.audBoom.volume=0;
		marioGame.audJump.volume=0;
	}
	else // if not, toggle to sound on mode
	{
		$("#sound").removeClass("soundoff");
		$("#sound").addClass("soundon");
		marioGame.audMainTheme.volume=1;
		marioGame.audTrans.volume=1;
		marioGame.audEnd.volume=1;
		marioGame.audNext.volume=1;
		marioGame.audDie.volume=1;
		marioGame.audSelect.volume=1;
		marioGame.audBoom.volume=1;
		marioGame.audJump.volume=0.6;
	}
}

/*
	func useItem
	Event handler function for item button DIVs
	This handler will perform some specific action according to its type of item
*/
function useItem(){
	if($(this).is( ".bomb" ))
	{		
		// Bomb!!!
		if( $(".character:first-child").attr("srcPos") < 5 ) // if Luigi is in left half
		{
			// Throw a bomb
			$("#bomb").addClass("throwBombRight");
			setTimeout(function(){
				$("#bomb").removeClass("throwBombRight");
				marioGame.audBoom.play();
				$('#bomb').append("<div id='blastRight'></div>");
				$("#blastRight").addClass("blastBoomRight");
				setTimeout(function(){
					removeRight();
					$("#blastRight").removeClass("blastBoomRight");
					$("#blastRight").remove();
				}, 700);
			}, 900);
		}
		else // if Luigi is in right half
		{
			// Throw a bomb
			$("#bomb").addClass("throwBombLeft");
			setTimeout(function(){$("#bomb").removeClass("throwBombLeft");}, 900);
			setTimeout(function(){
				$("#bomb").removeClass("throwBombLeft");
				marioGame.audBoom.play();
				$('#bomb').append("<div id='blastLeft'></div>");
				$("#blastLeft").addClass("blastBoomLeft");
				removeLeft();
				setTimeout(function(){
					$("#blastLeft").removeClass("blastBoomLeft");
					$("#blastLeft").remove();
				}, 700);
			}, 900);
		}
	}
	else if ($(this).is( ".indicator" ))
	{
		// 3 characters, including Luigi will be indicated for 0.3 sec
		$("#characters").children().each(function(index) {
			if(index < 3)
			{
				$(this).removeClass($(this).attr("motion"));
				$(this).addClass(marioGame.Character[1]+marioGame.Motion[0]);
			}
		});
		setTimeout(returnCharacter, 300);
	}
	else // eraser, remove one Mario caracter
	{
		// if there are any Marios to remove
		if($("#characters").children().length > 1)
		{
			//if(isCompatible() == true)
			{
				$(".character:last-child").addClass("character-removed");
				$(".character:last-child").bind("webkitTransitionEnd", removeDiv);
				$(".character:last-child").bind("oTransitionEnd", removeDiv);
				$(".character:last-child").bind("otransitionend", removeDiv);
				$(".character:last-child").bind("transitionend", removeDiv);
				$(".character:last-child").bind("msTransitionEnd", removeDiv);
			}
			/*else
			{
				$(".character:last-child").empty();
				$(".character:last-child").remove();
			}*/
		}
		else // if there's no Marios, donot use item
		{
			return;
		}
	}
	// remove Item
	//if(isCompatible() == true)
	{
		$(this).addClass("character-removed");
		$(this).bind("webkitTransitionEnd", removeDiv);
		$(this).bind("oTransitionEnd", removeDiv);
		$(this).bind("otransitionend", removeDiv);
		$(this).bind("transitionend", removeDiv);
		$(this).bind("msTransitionEnd", removeDiv);
	}
	/*else
	{
		$(this).empty();
		$(this).remove();
	}*/

}

/*
	func selectCharacter
	event handler of character object when it was clicked
*/
function selectCharacter(){
	if( parseInt($(this).css("z-index"), 10) == 10 ) // if user input right answer
	{
		marioGame.enStatus = enStep.nEndLevel;
		marioGame.nTurn = 0;
		marioGame.nFrame = 0;
		marioGame.nLevel++;
		document.getElementById('levelnum').innerHTML= marioGame.nLevel+1;
		if(marioGame.nWrong == 0)
			addNewItem();
		removeAll();
		marioGame.audSelect.pause();
		if( marioGame.audSelect.currentTime > 0 )
			marioGame.audSelect.currentTime = 0;
		marioGame.audNext.play();
	}
	else // if user input wrong answer
	{
		marioGame.audDie.play();
		$(this).unbind();
		marioGame.nWrong++;
		// when it was first wrong answer
		if(marioGame.nWrong < 2  )
		{
			//if(isCompatible() == true)
			{
				$(this).addClass("character-removed");
				$(this).bind("webkitTransitionEnd", removeDiv);
				$(this).bind("oTransitionEnd", removeDiv);
				$(this).bind("otransitionend", removeDiv);
				$(this).bind("transitionend", removeDiv);
				$(this).bind("msTransitionEnd", removeDiv);
			}
			/*else
			{
				$(this).empty();
				$(this).remove();
			}*/
		}
		else // when user answered wrong twice
		{
			marioGame.audSelect.pause();
			if ( marioGame.audSelect.currentTime > 0 )
				marioGame.audSelect.currentTime = 0;
			marioGame.audEnd.play();
			$(this).unbind();
			//if(isCompatible() == true){
				$(this).addClass("character-removed");
				$(this).bind("webkitTransitionEnd", removeDiv);
				$(this).bind("oTransitionEnd", removeDiv);
				$(this).bind("otransitionend", removeDiv);
				$(this).bind("transitionend", removeDiv);
				$(this).bind("msTransitionEnd", removeDiv);
			/*}
			else
			{
				$(this).empty();
				$(this).remove();
			}*/
			setTimeout(removeAll,500);
			marioGame.enStatus = enStep.nOver;
			marioGame.nFrame = 0;
			marioGame.nTurn = 0;
		}
			
	}
}


/**************************************************************
 *
 * Simple functions
 *
 *
 ***************************************************************/

/*
	Check transition and event binding function compatibility.
	Works well on chrome but not works well on IE or FF
	return false for non-compatible browsers
	
	
	It needs more investigation about webkit compatibility.
	at the moment latest version of all main browser is compatible with this game
*/
function isCompatible()
{
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf("MSIE ");
	var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
	var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
	var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
	var isMSIE = ((msie > 0) || (!!navigator.userAgent.match(/Trident.*rv\:11\./)));
	
	if(isChrome || isSafari)
		return true;
	else
		return false;
}

// transition effect-end binding function, to remove disappearing elements
function removeDiv(){
	$(".character-removed").remove();
}

// input parameter is position index of character, return value is X point of that position
function getPosX(nIndex){
	return 30+(90 * nIndex);
}


// make disappear disappear class elements
// binded to timeout function
function disappearDiv(){
	($(".appear").removeClass("appear")).addClass("disappear");
}


/*
	return total number of character objects - 1 in current level.
	Number of character objects can be varied by its level.
	eg> level 1 - 3 characters, level 2 - 4 characters...
	return value: number of total objects -1  (eg> level 1 = 2)
*/
function getNumberOfCharacters(){
	return ((2+parseInt((marioGame.nLevel+1)/2,10))>8 ? 9 : (2+parseInt((marioGame.nLevel+1)/2,10)));
}


// check this audio is playing or not to block resource wasting by duplicated playing at the same time
function isPlaying(playElem) {
    return !playElem.paused && !playElem.ended && 0 < playElem.currentTime;
}



function shuffle() {
	return 0.5 - Math.random();
}



/*************************************************************************
 *
 *   Game logics
 *
 *
 *
 ***************************************************************************/

/*
	Reset game properties to play again.
	Display Game Over image for a while and then display game start button
*/
function gameOver(){
	marioGame.nLevel = 0;
	document.getElementById('levelnum').innerHTML= marioGame.nLevel+1;
	marioGame.nTurn = 0;
	marioGame.nFrame = 0;
	disableElements();
	$('#items').children().each(function(index) {
		//if(isCompatible() == true){
			$(this).addClass("character-removed");
			$(this).bind("webkitTransitionEnd", removeDiv);
			$(this).bind("oTransitionEnd", removeDiv);
			$(this).bind("otransitionend", removeDiv);
			$(this).bind("transitionend", removeDiv);
			$(this).bind("msTransitionEnd", removeDiv);
		/*}
		else
		{
			$(this).empty();
			$(this).remove();
		}*/
	});	
	$('#game').append("<div id='gameover'></div>");
	
	// Remove Game over image and display start button
	setTimeout(restart, 5000);
}

// remove game over image and display start button again. And then goes back to initial status of the game
function restart(){
	marioGame.enStatus = enStep.nInit;
	$("#gameover").unbind();
	//if(isCompatible() == true){
		$("#gameover").addClass("character-removed");
		$("#gameover").bind("webkitTransitionEnd", removeDiv);
		$("#gameover").bind("oTransitionEnd", removeDiv);
		$("#gameover").bind("otransitionend", removeDiv);
		$("#gameover").bind("transitionend", removeDiv);
		$("#gameover").bind("msTransitionEnd", removeDiv);
	/*}
	else
	{
		$("#gameover").empty();
		$("#gameover").remove();
	}*/
	marioGame.nTurn = 0;
	marioGame.nFrame = 0;
}

/*
 	func displayStart
 	when it goes to initial, display start game button on the screen
 */
function displayStart(){
	// Display game start button again
	$('#game').append("<div id='start'></div>");
	$("#start").unbind();
	$("#start").click(startGame);
	// Play main theme song again
	marioGame.audMainTheme.play();
}

/*
	This function is called when one turn is done
	It generate new turn properties (reset position
	And if all the turns in a level is done, it makes system goes to next step (user input waiting stetp)
*/
function nextTurn(){
	// save destination index to source index
	$("#characters").children().each(function(index) {
		$(this).attr("srcPos", $(this).attr("destPos"));
	});
	
	// if it came to specific level, make playground wider
	if(marioGame.enStatus == enStep.nInit)
		marioGame.Position = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	else
	{
		if(marioGame.nLevel == 0)
			marioGame.Position = [3, 4, 5, 6, 7];
		else if(marioGame.nLevel == 1)
			marioGame.Position = [2, 3, 4, 5, 6, 7];
		else if(marioGame.nLevel == 2)
			marioGame.Position = [2, 3, 4, 5, 6, 7, 8];
		else if(marioGame.nLevel == 3)
			marioGame.Position = [1, 2, 3, 4, 5, 6, 7, 8];
		else if(marioGame.nLevel == 4)
			marioGame.Position = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		else if(marioGame.nLevel == 5)
			marioGame.Position = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	}
		
	// disorder, player's position randomly
	marioGame.Position.sort(shuffle);
	
	// save new destination position of each character
	$("#characters").children().each(function(index) {
		$(this).attr("destPos", marioGame.Position[index]);
	});
	
	marioGame.nFrame = 0;
	
	// Check turns of this level are all done
	if( (marioGame.enStatus == enStep.nPlaying)&& (marioGame.nTurn > (5+marioGame.nLevel) ) )
	{
		marioGame.enStatus = enStep.nSelect;
		return;
	}
}







/****************************************************************************************
 *
 *   Character animation functions
 *
 *
 *
 *
 ****************************************************************************************/

/*
	draw images of all characters
	motions and directions of characters are decided by it's source and destination position
*/
function update(){
	$("#characters").children().each(function(index) {
		if( !$(this).hasClass("character-removed") )
		{
			var srcPos = $(this).attr("srcPos"), destPos = $(this).attr("destPos");
			var destX = getPosX(destPos), srcX = getPosX(srcPos);
			var movDistance = (destX - srcX) / 32;
			var curPos = $(this).css("left");
			var nPosGap = Math.abs(destPos-srcPos);
		
			if(nPosGap == 0 ) // stay
			{
				//if(Math.random() > 0.5)
				{
					jumpMario($(this));
				}
			}
			else if(nPosGap <= 2) // walking
			{
				walkMario($(this));
			}
			else if(nPosGap <4) // jump
			{
				jumpMario($(this));
			}
			else // run
			{
				runMario($(this));
			}
		}
	});
	
	marioGame.nFrame++;
	if(marioGame.nFrame > 31){
		marioGame.nFrame = 0;
		marioGame.nTurn++;
	}
}



/*
	This function will be called when new level is started
	It transform Luigi to Mario
*/
function transformLuigi(){
	if((marioGame.nTurn == 1) && (marioGame.nFrame == 0))
	{
		marioGame.audMainTheme.pause();
		if( marioGame.audMainTheme.currentTime > 0 )
			marioGame.audMainTheme.currentTime = 0;
		marioGame.audTrans.play();
	}
	
	// Change Luigi to Mario
	if(marioGame.nTurn < 4)
	{
		// Frequency of image changing is accelerated 
		if(marioGame.nFrame %(16/Math.pow(2, marioGame.nTurn)) == 0){
			var motion;
			$(".character:first-child").removeClass( $(".character:first-child").attr("motion")  );
			if( marioGame.nFrame %(32/Math.pow(2, marioGame.nTurn)) == 0) { // if move right
				motion = marioGame.Motion[1];
				$(".character:first-child").attr("character", marioGame.Character[1]);
			}
			else
			{
				motion = marioGame.Motion[0];
				$(".character:first-child").attr("character", marioGame.Character[0]);
			}
			$(".character:first-child").attr("motion", $(".character:first-child").attr("character")+motion);
			$(".character:first-child").addClass( $(".character:first-child").attr("motion")  );
		}
	}

	marioGame.nFrame++;
	if(marioGame.nFrame > 31)
	{
		marioGame.nTurn++;
		marioGame.nFrame = 0;
	}
	// Transition is done, goes to next step
	if(marioGame.nTurn==5){
		marioGame.enStatus = enStep.nCharacterInit;
		marioGame.nTurn=0;
	}
}





/*
	Walk is 8 step procedure.
	each step consisted with 4 frames
	start from idle, 6 step walking motion and final step is idle again
	Character can move only during 6 steps of walking motion
*/
function walkMario(object){
	var curPos = object.css("left");
	var srcPos = object.attr("srcPos"), destPos = object.attr("destPos");
	if( marioGame.nFrame > 31) // end turn
	{
		return;
	}
	else if( (marioGame.nFrame < 4) || (marioGame.nFrame > 27) ) // start and end frame. idle status
	{ // start frame, set to idle image
		if(marioGame.nFrame %4 == 0){
			var motion;
			if( (destPos - srcPos) > 0) { // if move right
				motion = marioGame.Motion[1];
			}
			else
			{
				motion = marioGame.Motion[0];
			}
			object.removeClass( object.attr("motion")  );
			object.attr("motion", object.attr("character")+motion);
			object.addClass( object.attr("motion")  );
		}
	}
	else // step motion frames
	{
		// move image
		object.css("left", (getPosX(srcPos) + (marioGame.nFrame*((getPosX(destPos) - getPosX(srcPos))/24))) );
		
		// update image every single frame of each step
		if( marioGame.nFrame % 4 == 0)
		{
			var motion;
			if((destPos-srcPos) > 0 ) // right
			{
				motion = marioGame.Motion[9 + (marioGame.nFrame/4)];
			}
			else // left
			{ 
				motion = marioGame.Motion[3 + (marioGame.nFrame/4)];
			}
			object.removeClass( object.attr("motion")  );
			object.attr("motion", object.attr("character")+motion);
			object.addClass( object.attr("motion")  );
		}
	}	
}


/*
	Jump is 3 step procedure
	starts from sitting image (6 frames)
	Jumping (24 frames)
	Lading (idle image, 2 frames)
*/
function jumpMario(object){
	var curPos = parseInt(object.css("left"), 10);
	var srcPos = object.attr("srcPos"), destPos = object.attr("destPos");
	var curHeight = parseInt(object.css("top"), 10);
	if( marioGame.nFrame > 31) // end turn
	{
		return;
	}
	else if(marioGame.nFrame < 6)		
	{
		var motion;
		if( (destPos - srcPos) > 0) { // if move right
			motion = marioGame.Motion[17];
		}
		else
		{
			motion = marioGame.Motion[16];
		}
		object.removeClass( object.attr("motion")  );
		object.attr("motion", object.attr("character")+motion);
		object.addClass( object.attr("motion")  );
	}
	else if(marioGame.nFrame > 29)
	{
		if( marioGame.nFrame == 30)
		{
			var motion;
			if( (destPos - srcPos) > 0) { // if move right
				motion = marioGame.Motion[1];
			}
			else
			{
				motion = marioGame.Motion[0];
			}
			object.removeClass( object.attr("motion")  );
			object.attr("motion", object.attr("character")+motion);
			object.addClass( object.attr("motion")  );
		}
	}
	else
	{
		if(marioGame.nFrame == 6)
		{
			var motion;
			
			// Play jump audio
			// Unlike others jump sound effect can be played simultaneously by multiple character objects, check it is already playing
			if( isPlaying(marioGame.audJump) != true)
			{
				marioGame.audJump.play();
			}

			
			if( (destPos - srcPos) > 0) { // if move right
				motion = marioGame.Motion[19];
			}
			else
			{
				motion = marioGame.Motion[18];
			}
			object.removeClass( object.attr("motion")  );
			object.attr("motion", object.attr("character")+motion);
			object.addClass( object.attr("motion")  );
		}
		// move image
		object.css("left", (getPosX(srcPos) + ((marioGame.nFrame-5)*((getPosX(destPos) - getPosX(srcPos))/24))) );
		if( destPos == srcPos)
			object.css("top",  ((marioGame.nFrame <18) ?  (curHeight - 14): (curHeight + 14)) );
		else
			object.css("top",  ((marioGame.nFrame <18) ?  (curHeight - 10): (curHeight + 10)) );
	}		
}


/*
	Run is 16 step procedure.
	each step consisted with 2 frames
	start from idle, 6 step walking motion and final step is idle again
	Character can move only during 6 steps of walking motion
*/
function runMario(object){
	var curPos = object.css("left");
	var srcPos = object.attr("srcPos"), destPos = object.attr("destPos");
	if( marioGame.nFrame > 31) // end turn
	{
		return;
	}
	else if( marioGame.nFrame < 6) // start frame. run set status
	{ // start frame, set to run set motion image
		if(marioGame.nFrame %6 == 0)
		{
			var motion;
			if( (destPos - srcPos) > 0) { // if move right
				motion = marioGame.Motion[3];
			}
			else
			{
				motion = marioGame.Motion[2];
			}
			object.removeClass( object.attr("motion")  );
			object.attr("motion", object.attr("character")+motion);
			object.addClass( object.attr("motion")  );
		}
	}
	else if(marioGame.nFrame > 29) // end frame. idle status
	{ // ending frame, set to idle image
		if(marioGame.nFrame %2 == 0){
			var motion;
			if( (destPos - srcPos) > 0) { // if move right
				motion = marioGame.Motion[1];
			}
			else
			{
				motion = marioGame.Motion[0];
			}
			object.removeClass( object.attr("motion")  );
			object.attr("motion", object.attr("character")+motion);
			object.addClass( object.attr("motion")  );
		}
	}
	else // step motion frames
	{
		// move image
		object.css("left", (getPosX(srcPos) + ((marioGame.nFrame-5)*((getPosX(destPos) - getPosX(srcPos))/24))) );
		
		// update image every single frame of each step
		if( marioGame.nFrame % 2 == 0)
		{
			var walkFrame = marioGame.nFrame/2 - 2;
			var motion;
			walkFrame = (walkFrame>6) ? walkFrame-6 : walkFrame;
			if((destPos-srcPos) > 0 ) // right
			{
				motion = marioGame.Motion[9 + walkFrame];
			}
			else // left
			{ 
				motion = marioGame.Motion[3 + walkFrame];
			}
			object.removeClass( object.attr("motion")  );
			object.attr("motion", object.attr("character")+motion);
			object.addClass( object.attr("motion")  );
		}
	}
}






/********************************************************************************
 *
 *     Game Item functions
 *
 *
 *
 *
 *********************************************************************************/




// This function will add new item on the item slot
function addNewItem(){
	var nItems = $("#items").children().length;
	if(nItems < 7){
		$("#items").append("<div class='item'></div>");
		var newItem;
		var fRand = Math.random();
		if(fRand < 0.35){
			$(".item:last-child").addClass("bomb");
		}
		else if(fRand < 0.65){
			$(".item:last-child").addClass("indicator");
		}
		else{
			$(".item:last-child").addClass("eraser");
		}
		
		$(".item:last-child").click(useItem);

	}
}




// remove all the characters on the right side of the play ground, for bomb
function removeRight(){
	// kill all marios on the right half
	$("#characters").children().each(function(index) {
		if($(this).attr("srcPos") >= 5)
		{
			//if(isCompatible() == true)
			{
				$(this).addClass("character-removed");
				$(this).bind("webkitTransitionEnd", removeDiv);
				$(this).bind("oTransitionEnd", removeDiv);
				$(this).bind("otransitionend", removeDiv);
				$(this).bind("transitionend", removeDiv);
				$(this).bind("msTransitionEnd", removeDiv);
			}
			/*else
			{
				$(this).empty();
				$(this).remove();
			}*/
		}
	});
}

// Remove all the characters on the left side of the play ground for bomb
function removeLeft(){
	// kill all marios on the left half
	$("#characters").children().each(function(index) {
		if($(this).attr("srcPos") <5)
		{
			//if(isCompatible() == true)
			{
				$(this).addClass("character-removed");
				$(this).bind("webkitTransitionEnd", removeDiv);
				$(this).bind("oTransitionEnd", removeDiv);
				$(this).bind("otransitionend", removeDiv);
				$(this).bind("transitionend", removeDiv);
				$(this).bind("msTransitionEnd", removeDiv);
			}
			/*else
			{
				$(this).empty();
				$(this).remove();
			}*/
		}
	});
}


/*
	return back to original character image
	timer binded function to implement indicator item
*/
function returnCharacter(){
	$("#characters").children().each(function(index) {
		if(index < 3)
		{
			$(this).removeClass(marioGame.Character[1]+marioGame.Motion[0]);
			$(this).addClass($(this).attr("motion"));		}
	});
}



/*
	remove all character objects except Luigi
*/
function removeAll(){
$("#characters").children().each(function(index) {
	$(this).unbind();
	if(index != 0 )
	{
		//if(isCompatible() == true){
			$(this).addClass("character-removed");
			$(this).bind("webkitTransitionEnd", removeDiv);
			$(this).bind("oTransitionEnd", removeDiv);
			$(this).bind("otransitionend", removeDiv);
			$(this).bind("transitionend", removeDiv);
			$(this).bind("msTransitionEnd", removeDiv);
		/*}
		else
		{
			$(this).empty();
			$(this).remove();
		}*/
	}
	else{
		$(this).attr("character", marioGame.Character[1]);
	}
});
}



/*
	offer some tip of this game
*/
function tipNhack(){
	var tipString = [
		'Most front character is Luigi, and I am Victor(WooSeung). What?',
		'Luigi is in the left side of playground',
		'Luigi is in the right side of playground',
		'Luigi is in the middle of playground',
		'Luigi is moving to the left',
		'Luigi is staying at the same position',
		'Luigi is moving to the right',
		];
	var preFix = "Tip: ";
	
	if(marioGame.enStatus == 4) // playing
	{
		if( $(".character:first-child").attr("destPos") == $(".character:first-child").attr("srcPos") )
		{
			preFix = preFix + tipString[5];
		}
		else if( $(".character:first-child").attr("destPos") > $(".character:first-child").attr("srcPos") )
		{
			preFix = preFix + tipString[6];
		}
		else
		{
			preFix = preFix + tipString[4];
		}
	}
	else if(marioGame.enStatus == 5) // select
	{
		if( $(".character:first-child").attr("srcPos") < 4 )
		{
			preFix = preFix + tipString[1];
		}
		else if( $(".character:first-child").attr("srcPos") < 6 )
		{
			preFix = preFix + tipString[3];
		}
		else
		{
			preFix = preFix + tipString[2];
		}
	}
	else
	{
		preFix = preFix + tipString[0];
	}
	
	alert(preFix);
	
	marioGame.nTips--;
	if(marioGame.nTips <= 0)
	{
		$("#level").unbind();
		$("#level").css({
			"cursor" : "not-allowed"
		});
	}
}
