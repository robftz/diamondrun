//set main namespace
goog.provide('diamondrun');

//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');

goog.require('diamondrun.Tile');
goog.require('diamondrun.Hand');
goog.require('diamondrun.Deck');
goog.require('diamondrun.Graveyard');
goog.require('diamondrun.Player');
goog.require('diamondrun.Rubble');

var IPHONE_4_W = 640;
var IPHONE_4_H = 960;

var game = {
    player1: null, //friendly
    player2: null, //enemy
    turn: 0,
    unitLayer: null
}

var Phases = {
    p1_start: 0,
    p1_draw: 1,
    p1_play1: 2,
    p1_attack: 3,
    p1_play2: 4,
    p1_end: 5,

    p2_start: 6,
    p2_draw: 7,
    p2_play1: 8,
    p2_attack: 9,
    p2_play2: 10,
    p2_end: 11,

    current: -1,

    next: function() {

        this.current ++;

        if (this.current > Phases.p2_end) {
            this.current = 0;  
            game.turn ++;
        }

        switch (this.current) {

            case Phases.p1_start:
				// Signal P1 board that turn is starting
				game.player1.board.startTurn();
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p1_draw:
                var drawNum = 2;
                if (game.turn == 0) drawNum = 5;
                
                Commands.add(new diamondrun.DrawCardCommand(game.player1, drawNum));
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p1_play1:
            case Phases.p1_play2:
                //wait for user action
                game.player1.beginPlayPhase(function() {
                    Commands.add(new diamondrun.NextPhaseCommand());
                });
                break;

            case Phases.p1_attack:
                game.player1.doAttack();
                break;

            case Phases.p1_end:
				// Signal P2 board that turn is ending
				game.player1.board.endTurn();
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p2_start:
				// Signal P1 board that turn is starting
				game.player2.board.startTurn();
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p2_play1:
            case Phases.p2_play2:
                
                var dummyCard = new diamondrun.Card(game.player2, 'melee', 1, 2);
                var targets = game.player2.board.getValidTargets(dummyCard);
                var dummyTarget = targets[Math.floor(Math.random()*targets.length)];
                Commands.add(new diamondrun.PlayCardCommand(game.player2, dummyCard, dummyTarget));
                
                Commands.add(new diamondrun.NextPhaseCommand());
                break;
            
            case Phases.p2_attack:
                game.player2.doAttack();
                break;

            case Phases.p2_draw:
				Commands.add(new diamondrun.NextPhaseCommand());
				break;

            case Phases.p2_end:
				// Signal P2 board that turn is ending
				game.player2.board.endTurn();
                Commands.add(new diamondrun.NextPhaseCommand());
                break;
        }
    }


};

var Commands = {
    history: [],
    queue: [],
    add: function(command) {
        this.queue.push(command);
    },
    doNext: function() {
        if (this.queue.length > 0) {
            var cmd = this.queue.shift();
            cmd.execute();
            this.history.push(cmd);    
        }
    }
};

// entrypoint
diamondrun.start = function(){

    var director = new lime.Director(document.body,IPHONE_4_W,IPHONE_4_H),
        scene = new lime.Scene();

    var player = new diamondrun.Player(true);
    game.player1 = player;

    game.unitLayer = new lime.Layer();
	game.rubbleLayer = new lime.Layer();

    game.player2 = new diamondrun.Player(false);
    game.player2.getBoard().setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 - 265);

    scene.appendChild(player.getBoard()).appendChild(game.player2.getBoard()).appendChild(player.getHand()).appendChild(game.rubbleLayer).appendChild(game.unitLayer);

    var phase_label = new lime.Label().setText('P').setPosition(50, 50);
    scene.appendChild(phase_label);
    lime.scheduleManager.schedule(function(dt) {
        phase_label.setText('P' + Phases.current);
    });

    director.makeMobileWebAppCapable();

    // set current scene active
    director.replaceScene(scene);
    lime.scheduleManager.schedule(function(dt) {
        Commands.doNext();
    });

    //Commands.add(new diamondrun.NextPhaseCommand());
    Phases.next();

    player.getBoard().connectAttackPaths(game.player2.getBoard());
    game.player2.getBoard().connectAttackPaths(player.getBoard());
}

goog.exportSymbol('diamondrun.start', diamondrun.start);


Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.shuffle = function() {
    var counter = this.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = (Math.random() * counter--) | 0;

        // And swap the last element with it
        temp = this[counter];
        this[counter] = this[index];
        this[index] = temp;
    }
};
