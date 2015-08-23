'use strict';

var opposites = {
    right: "left",
    left: "right",
    bottom: "top",
    top: "bottom",
    bottomLeft: "topRight",
    bottomRight: "topLeft",
    topLeft: "bottomRight",
    topRight: "topLeft"
};

function calc(target, prop1, prop2) {
    var name = prop1 + prop2.charAt(0).toUpperCase() + prop2.slice(1);
    Object.defineProperty(target, name, {
        get: function() {
            if (target[prop1] === null) {
                return null;
            }
            return target[prop1][prop2];
        }
    });
}

//Bullet - is a representation of a game piece, allows to use the gameboard as a network

function Bullet(value) {
    this.value = value || null;
    this.left = null;
    this.right = null;
    this.top = null;
    this.bottom = null;
    calc(this, "top", "left");
    calc(this, "top", "right");
    calc(this, "bottom", "left");
    calc(this, "bottom", "right");
}

Bullet.prototype.link = function(otherBullet, dir) {
    switch (dir) {
        case "bottom":
            this.bottom = otherBullet;
            otherBullet.top = this;
            break;
        case "left":
            this.left = otherBullet;
            otherBullet.right = this;
            break;
    }
};

Bullet.prototype.getStreak = function(dir) {
    var value = null;
    var bullet = this;
    var streak = [];

    while (bullet[dir] != null && bullet[dir].value != null) {
        if (value == null) value = bullet[dir].value;
        if (value != bullet[dir].value) break;
        bullet = bullet[dir];
        streak.push(bullet);
    }

    dir = opposites[dir];
    bullet = this;

    while (bullet[dir] != null && bullet[dir].value != null) {
        if (value == null) value = bullet[dir].value;
        if (value != bullet[dir].value) break;
        bullet = bullet[dir];
        streak.push(bullet);
    }

    return {
        items: streak,
        value: value,
        size: streak.length,
        bullet: this
    };

};

//Algorithm - the game I.A. 

function Algorithm() {

    this.bulletMap = null;

}

Algorithm.prototype.initializeMap = function(gameBoard) {
    var allNull = true;
    var bulletMap = [];
    var line;
    var bullet;

    var cols = gameBoard.length;
    var rows = gameBoard[0].length;

    for (var col = 0; col < cols; col += 1) {
        line = [];
        bulletMap.push(line);
        for (var row = 0; row < rows; row += 1) {
            bullet = new Bullet(gameBoard[col][row]);
            if (bullet.value != null) allNull = false;
            bullet.x = row;
            bullet.y = col;
            if (col > 0) {
                bullet.link(bulletMap[col - 1][row], "left");
            }
            if (row > 0) {
                bullet.link(bulletMap[col][row - 1], "bottom");
            }

            line.push(bullet)
        }
    }

    this.bulletMap = bulletMap;
    this.gameBoard = gameBoard;
    return allNull;
};

Algorithm.prototype.updateMap = function(gameBoard) {
    var cols = gameBoard.length;
    var rows = gameBoard[0].length;
    var bulletMap = this.bulletMap;
    for (var col = 0; col < cols; col += 1) {
        for (var row = 0; row < rows; row += 1) {
            bulletMap[col][row].value = gameBoard[col][row];
        }
    }
    this.gameBoard = gameBoard;
};

Algorithm.prototype.getEmptyOfCol = function(colNum) {
    var col = this.bulletMap[colNum];
    var bullet = col[0];

    while (bullet && bullet.value != null) {

        bullet = bullet.top;
    }
    
    return bullet;
};

Algorithm.prototype.analyzeMove = function(moveBullet) {

    var positions = ["right", "left", "topRight", "topLeft", "bottom", "bottomLeft", "bottomRight"];

    var streaks = positions.map(function(position) {
        return moveBullet.getStreak(position);
    });

    streaks.forEach(function(streak) {

        if (streak.value == 'castrolol') {
            if (streak.size >= 3) {
                streak.moveThreshold = 2;
            } else {
                streak.moveThreshold = streak.size * 0.33;
            }
        } else {
            if (streak.size >= 3) {
                streak.moveThreshold = 1.6;
            } else {
                streak.moveThreshold = streak.size * .35;
            }
        }

    });


    return streaks.sort(function(streakA, streakB) {
        return streakB.moveThreshold - streakA.moveThreshold;
    });

};

Algorithm.prototype.prepareGameBoard = function(gameBoard) {
    gameBoard.forEach(function(col) {
        col.reverse();
    });
    var isFirst = false;
    if (this.bulletMap == null) {
        isFirst = this.initializeMap(gameBoard);
    } else {
        this.updateMap(gameBoard);
    }
    return isFirst;
};

Algorithm.prototype.getPossibleMoves = function(availableColumns) {
    var getEmpty = this.getEmptyOfCol.bind(this);

    return availableColumns.map(getEmpty).filter(function(move) {
        return move;
    });
};

Algorithm.prototype.calcMovesThresholds = function(possibleMoves) {
    var analyzeMove = this.analyzeMove.bind(this);
    return possibleMoves.map(function(possibleMove) {
        return analyzeMove(possibleMove)[0];
    }).sort(function(dataA, dataB) {
        return dataB.moveThreshold - dataA.moveThreshold;
    });
};


Algorithm.prototype.move = function(availableColumns, gameBoard) {

    var isFirst = this.prepareGameBoard(gameBoard);
    
    if (isFirst) {
        return availableColumns[Math.floor(availableColumns.length / 2)];
    }

    var possibleMoves = this.getPossibleMoves(availableColumns);

    var movesWithThresholds = this.calcMovesThresholds(possibleMoves);

    var moveData = movesWithThresholds[0];

    //a second-level of thresholds calc is needed, to get a move prevision


    if (moveData) {
        return moveData.bullet.y;
    }

    return availableColumns[Math.round(availableColumns.length / 2)];
};
