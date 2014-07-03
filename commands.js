goog.provide('diamondrun.PlayCardCommand');
goog.provide('diamondrun.PlaySpellCommand');
goog.provide('diamondrun.TimeOutCommand');
goog.provide('diamondrun.DrawCardCommand');
goog.provide('diamondrun.NextPhaseCommand');
goog.provide('diamondrun.EndGameCommand');

goog.require('lime.transitions.SlideInRight');
goog.require('lime.transitions.SlideInLeft');
goog.require('lime.transitions.SlideInUp');
goog.require('lime.GlossyButton');


diamondrun.PlayCardCommand = function(player, card, targetTile) {
    this.player = player;
    this.card = card;
    this.targetTile = targetTile;
};

diamondrun.PlayCardCommand.prototype.execute = function() {
    
    // apply effect to board depending on Card type
    var unit = new diamondrun.Unit(this.player, this.targetTile, this.card.movement, this.card.attack, this.card.hp);    
    if (this.targetTile.addUnit(unit)) {
        // move from hand to graveyard
        this.player.getGraveyard().takeCard(this.card);
    }
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.PlaySpellCommand = function(player, card, targetTile) {
    this.player = player;
    this.card = card;
    this.targetTile = targetTile;
};

diamondrun.PlaySpellCommand.prototype.execute = function() {
    
    // apply effect to board
    var effect = new diamondrun.Effect(this.player, this.targetTile, this.card.type, this.card.attack);
    this.targetTile.addEffect(effect)
    
    // move from hand to graveyard
    this.player.getGraveyard().takeCard(this.card);
    
    // Activate effect instantly
    effect.activate()
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.TimeOutCommand = function() {
    if (game.player1.canActThisPhase) this.player = game.player1;
    else this.player = game.player2;
    this.card = this.player.getHand().cards[0];
    this.targetTile = this.player.board.techTile;
};

diamondrun.TimeOutCommand.prototype.execute = function() {
    // Need to pass something into Tech Tile
    var effect = new diamondrun.Effect(this.player, this.targetTile, this.card.type, this.card.attack);
    this.targetTile.addEffect(effect)
    
    // move from hand to graveyard
    this.player.getGraveyard().takeCard(this.card);
    this.player.endPlayPhase();
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.DrawCardCommand = function(player, numCards) {
    this.player = player;
    this.numCards = numCards;
};

diamondrun.DrawCardCommand.prototype.execute = function() {
    for (var i = 0; i < this.numCards; i ++) {
        this.player.draw(i);
    }
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.NextPhaseCommand = function() {
};

diamondrun.NextPhaseCommand.prototype.execute = function() {
    Phases.next();
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.EndGameCommand = function(loser) {
    this.loser = loser;
    //if (this.loser == game.player1) this.winner = game.player1; // Unnecassary now, might be useful later.
    //else this.winner = game.player2;
};

diamondrun.EndGameCommand.prototype.execute = function() {
    var gameOverScene = new lime.Scene();
    var newBackground = new lime.Sprite().setSize(IPHONE_4_W, IPHONE_4_H).setFill(255, 255, 255).setAnchorPoint(0, 0);
    var button = new lime.GlossyButton("New Game").setPosition(IPHONE_4_W/2, IPHONE_4_H*2/3).setSize(150, 38).setRenderer(lime.Renderer.CANVAS);
    goog.events.listen(button, 'click', newGame);
    
    var title = new lime.Label().setPosition(IPHONE_4_W/2, IPHONE_4_H/3).setFontSize(72);
    var transition;
    
    gameOverScene.appendChild(game.background)
    if (this.loser.isPlayer1) {
        title.setText("You Lose").setFontColor("Red");
        transition = lime.transitions.SlideInRight;
    }
    else {
        title.setText("You Win").setFontColor("Blue");
        transition = lime.transitions.SlideInLeft;
    }
    gameOverScene.appendChild(newBackground).appendChild(title).appendChild(button);
    
    game.director.replaceScene(gameOverScene, transition);
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

var newGame = function() {
    var oldDirector = game.director; 
    game = {
        player1: null, //friendly
        player2: null, //enemy
        turn: 0,
        unitLayer: null,
        director: null
    }
    game.director = oldDirector;
    
    Phases.current = -1;

    var scene = new lime.Scene();

    game.background = new lime.Sprite();
    game.background.setSize(IPHONE_4_W, IPHONE_4_H).setFill(0, 0, 0).setAnchorPoint(0, 0);

    scene.appendChild(game.background);


    var player = new diamondrun.Player(true);
    game.player1 = player;
    
    game.player2 = new diamondrun.AIPlayer(false);
    game.player2.getBoard().setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 - 265);

    game.effectLayer = new lime.Layer();
    game.unitLayer = new lime.Layer();
    game.rubbleLayer = new lime.Layer();

    scene.appendChild(player.getBoard()).appendChild(game.player2.getBoard()).appendChild(player.getHand()).appendChild(game.rubbleLayer).appendChild(game.unitLayer).appendChild(game.effectLayer);

    // set current scene active
    game.director.replaceScene(scene, lime.transitions.SlideInUp);
    
    var phase_label = new lime.Label().setText('P').setPosition(50, 50);
    scene.appendChild(phase_label);
    lime.scheduleManager.schedule(function(dt) {
        phase_label.setText('P' + Phases.current);
    });

    game.director.makeMobileWebAppCapable();

    lime.scheduleManager.schedule(function(dt) {
        Commands.doNext();
    });

    //Commands.add(new diamondrun.NextPhaseCommand());
    Phases.next();
    
    player.getBoard().connectAttackPaths(game.player2.getBoard());
    game.player2.getBoard().connectAttackPaths(player.getBoard());

    style(game);
}