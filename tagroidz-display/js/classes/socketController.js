var socket =  io.connect('http://192.168.1.37:3000/monitor');

socket.on('init', function (msg){
    var players = msg.players;
    for(var player in players){
        var toAdd = true;
        _.each(allPlayers,function(existingPlayer){
            if(player.name===existingPlayer.name){
                toAdd = false;
            }
        });

        if(toAdd){
            console.log("Create new player :"+player.name);
            var joueur = new Personnage(player.name,"exemple.png",
                player.pos.x,
                player.pos.y,
                DIRECTION.BAS);
            allPlayers.add(joueur);
            map.addPersonnage(joueur);
        }
    }
});

socket.on('newPlayer', function (msg){
    var players = msg.players;
    for(var player in players){
        var toAdd = true;
        for(var existingPlayer in allPlayers){
            if(player.name===existingPlayer.name){
                toAdd = false;
            }
        }
        if(toAdd){
            console.log("Create new player :"+player.name);
            var joueur = new Personnage(player.name,"exemple.png",
                                        player.pos.x,
                                        player.pos.y,
                                        DIRECTION.BAS);
            allPlayers.add(joueur);
            map.addPersonnage(joueur);
        }
    }
});

socket.on('movePlayer', function (msg) {
    console.log("Move player to :"+msg.pos.x+"-"+msg.pos.y);
    for(var joueur in allPlayers){
        if(joueur.name===msg.name){
            joueur.deplacerVers(pos,map);
        }
    }
});