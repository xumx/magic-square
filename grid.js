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
}

// Facebook Singapore Hackathon event ID: 574877579268704

_.templateSettings = {
    interpolate: /(link\[[0-9]+\])/g
};

// {
//     trigger: "",
//     fn: {
        
//     },
// }

FUNCTION_BANK = {
    "^(favourite music of)[ ]?": "if (query == '') {\n\tif (link[0].value._type == 'fb_user') {\n\t\tquery = link[0].value.id\n\t} else if (Array.isArray(link[0].value)) {\n\t\tvar array = link[0].value;\n\t\tvar aggIdArray = _.map(array, function(element) {\n\t\t\treturn element.id;\n\t\t});\n\t} else {\n\t\tquery = link[0].value;\n\t}\n}\nif (aggIdArray) {\n\tMeteor.call('aggregateMusicLikes', aggIdArray, function(err, result) {\n\t\tif (err) console.log(err);\n\t\tSquares.update(id, {\n\t\t\t$set: {\n\t\t\t\tvalue: result\n\t\t\t}\n\t\t});\n\t});\n} else {\n\tMeteor.call('getFavouriteMusic', query, function(err, result) {\n\t\tif (err) console.log(err);\n\t\tSquares.update(id, {\n\t\t\t$set: {\n\t\t\t\tvalue: result\n\t\t\t}\n\t\t});\n\t});\n}",
    "^(mutual friends of)[ ]?": "if (query == '') {\n\tif (link[0].value._type == 'fb_user') {\n\t\tvar aggUserArray = [{'id': link[0].value.id, 'name':link[0].value.name}];\n\t} else if (Array.isArray(link[0].value)) {\n\t\tvar aggUserArray = link[0].value;\n\t} else {\n\t\tquery = link[0].value;\n\t}\n}\nif (aggUserArray) {\n\tMeteor.call('aggregateMutualFriends', aggUserArray, function(err, result) {\n\t\tif (err) console.log(err);\n\t\tSquares.update(id, {\n\t\t\t$set: {\n\t\t\t\tvalue: result\n\t\t\t}\n\t\t});\n\t});\n}",
    "^(these people who like)[ ]?": "if (query == '') {\tif (Array.isArray(link[0].value) && link[0].value._type == 'fb_user') {\t\tvar data = {\t\t\t'users': link[0].value,\t\t\t'artistId': link[0].value.id\t\t};\t}}if (data) {\tMeteor.call('getPeopleWhoLike', data, function(err, result) {\t\tif (err) console.log(err);\t\tSquares.update(id, {\t\t\t$set: {\t\t\t\tvalue: result\t\t\t}\t\t});\t});}",
    "^(people attending)[ ]?": "if (query == '') {\tif (link[0].value._type == 'fb_event') {\t\tquery = link[0].value.id\t} else {\t\tquery = link[0].value;\t}}Meteor.call('getEventAttendees', query, function(err, result) {\tif (err) console.log(err);\tSquares.update(id, {\t\t$set: {\t\t\tvalue: result\t\t}\t});});",
    "^(user called)[ ]?": "if (query == '') {\n\tif (link[0].value._type == 'fb_user' || link[0].value._type == 'fb_event' || link[0].value._type == 'fb_music') {\n\t\tquery = link[0].value.id\n\t} else {\n\t\tquery = link[0].value;\n\t}\n}\nvar data = {\n\tq: query,\n\ttype: 'user'\n};\nMeteor.call('search-fb', data, function(err, searchReturn) {\n\tif (err) console.log(err);\n\tif (searchReturn && searchReturn.data.data.length > 1) {\n\t\tSquares.update(id, {\n\t\t\t$set: {\n\t\t\t\tvalue: searchReturn.data.data\n\t\t\t}\n\t\t});\n\t} else if (searchReturn && searchData.data.data.length == 1) {\n\t\tconsole.log('Logging sinle object...');\n\t\tconsole.log(searchReturn);\n\t\tSquares.update(id, {\n\t\t\t$set: {\n\t\t\t\tvalue: {\n\t\t\t\t\t'_type': 'fb_user',\n\t\t\t\t\t'id': searchReturn.data.data[0].id,\n\t\t\t\t\t'name': searchReturn.data.data[0].name\n\t\t\t\t}\n\t\t\t}\n\t\t});\n\t}\n});",
    "^(event called)[ ]?": "if (query == '') {\n\tif (link[0].value._type == 'fb_event') {\n\t\tquery = link[0].value.id\n\t} else {\n\t\tquery = link[0].value;\n\t}\n}\nvar data = {\n\tq: query,\n\ttype: 'event'\n};\nMeteor.call('search-fb', data, function(err, searchReturn) {\n\tif (err) console.log(err);\n\tif (searchReturn && searchReturn.data.data.length > 1) {\n\t\tSquares.update(id, {\n\t\t\t$set: {\n\t\t\t\tvalue: searchReturn.data.data\n\t\t\t}\n\t\t});\n\t} else if (searchReturn && searchReturn.data.data.length == 1) {\n\t\tSquares.update(id, {\n\t\t\t$set: {\n\t\t\t\tvalue: {\n\t\t\t\t\t'_type': 'fb_event',\n\t\t\t\t\t'id': searchReturn.data.data[0].id,\n\t\t\t\t\t'name': searchReturn.data.data[0].name\n\t\t\t\t}\n\t\t\t}\n\t\t});\n\t}\n});",
    "^(count)": "if (Array.isArray(link[0].value)) {\n\treturn link[0].value.length;\n}",
    "^(spotify)[ ]?": "if (query == '') {if (Array.isArray(link[0].value)) {query = link[0].value[0].name;} else if (typeof link[0].value == 'string') {query = link[0].value;} else if (link[0].value.name != undefined) {query = link[0].value.name;}}Meteor.http.get('http://ws.spotify.com/search/1/track.json?q=' + query, function(err, data) {var array = _.map(data.data.tracks, function(element) {return {_type: 'spotify_track',text: element.name,href: element.href}});Squares.update(id, {$set: {value: array}});});"
}