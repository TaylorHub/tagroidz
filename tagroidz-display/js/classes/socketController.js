var socket = io.connect();

socket.on('newPlayer', function (msg){
    console.log("Create new player :"+msg.name);
    var joueur = new Personnage(msg.name,"exemple.png",msg.pos.x,pos.y,DIRECTION.BAS);
    joueurs.add(joueur);
    map.addPersonnage(joueur);
});

socket.on('movePlayer', function (msg) {
    console.log("Move player to :"+msg.pos.x+"-"+msg.pos.y);
    for(var joueur in joueurs){
        if(joueur.name===msg.name){
            joueur.deplacerVers(pos,map);
        }
    }
});