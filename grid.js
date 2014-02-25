Squares = new Meteor.Collection('square');
Stencils = new Meteor.Collection('stencil');
Canvas = new Meteor.Collection('canvas');
Fn = new Meteor.Collection('function');

API = {
    facebook: "CAACEdEose0cBALZChm57fCpiWM6CHKfxQoqfpgdETINFQjsvHZCiZAN0RTKc7N3ZBqIAKkCxwUpmfo1hvdoVhpCEhtY1jfQEwA6C39lw0d1M1AfTWhF70z8u34fKwpsdQvPhjwt3Lws9vvOGNFhiGHZCFmIH9dwRQQ4ydlq4w4kTEQb59flLtyqK2vj3IPjsZD",
    embedly: "1b7350d8cb894d1f9b5fffd18cc0ba56",
    google: {
        server: "AIzaSyCXobbe29WEsE7k1nxAXj5w",
        client: "AIzaSyBbEd2KpEdLZYMSxcQzhxD0mDHtab3nne0"
    }
};

// Facebook Singapore Hackathon event ID: 574877579268704

_.templateSettings = {
    interpolate: /(link\[[0-9]+\])/g
};

Meteor.methods({
    fillBox: function(box, canvasId) {

        console.log('fill box', box);

        var s;
        for (var i = box.top; i < box.bottom; i++) {
            for (var j = box.left; j < box.right; j++) {
                s = Squares.findOne({
                    x: j,
                    y: i,
                    canvasId: canvasId
                });

                if (s === undefined) {
                    console.log("insert", i, j);

                    Squares.insert({
                        x: j,
                        y: i,
                        canvasId: canvasId,
                        height: 1,
                        width: 1,
                        link: [],
                        selected: false
                    });

                    
                }
            }
        }
    }
});
