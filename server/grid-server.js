if (Meteor.isServer) {
    var cheerio = Meteor.require('cheerio');
    var FB_ACCESS_TOKEN = "CAACEdEose0cBABAHkbhceC7SmNlZBapcGmlhPJDFYoMCeFl8r9ns3kHTf1gSrmkGiCX92qRemQApFMuf8juvqCsqtYO54QoCneOJXKp8RmO7L0wZC7RqNzBAxkdCZCL8ADqa6NRS9pwrSVdXEKZCxkZC63jZC4OTkxEm46ZBJh6hlykp8lbXVWTHNZC66SrugQIZD";

    Meteor.methods({
        fetch: function(url, statements, _id) {

            Meteor.http.get(url, function(error, response) {
                var $, data, fn;

                if (response.headers['content-type'].match(/text\/html/)) {

                    $ = cheerio.load(response.content);
                    fn = new Function(['$', 'ID'], statements);

                } else if (response.headers['content-type'].match(/application\/json/)) {

                    $ = JSON.parse(response.content)
                    fn = new Function(['data', 'ID'], statements);

                }

                var result = fn($, _id);

                if (result === undefined || result === null) return;

                Squares.update(_id, {
                    $set: {
                        value: result,
                    }
                });
            });
        },
        create: function(canvasId, password) {

            if (Canvas.findOne(canvasId) !== undefined) {

                return new Meteor.Error(null, "Canvas name already taken", null);

            } else {

                if (password) {

                    Canvas.insert({
                        _id: canvasId,
                        created: new Date(),
                        password: password
                    });

                } else {

                    Canvas.insert({
                        _id: canvasId,
                        created: new Date(),
                    });

                }

                Meteor.call('initialize', canvasId);
            }
        },
        reset: function(canvasId) {
            Meteor.call('clear', canvasId);
            Meteor.call('initialize', canvasId);
        },
        clear: function(canvasId) {
            Squares.remove({
                canvasId: canvasId
            });
        },
        clearAll: function() {
            Squares.remove({});

            Stencils.update({}, {
                $set: {
                    canvasId: 'public'
                }
            })
        },
        //'canvasId: public' will be used as public demo
        initialize: function(canvasId) {
            // Initialize empty cells
            if (Squares.find({
                canvasId: canvasId
            }).count() == 0) {
                for (var i = 0; i < 10; i++) {
                    for (var j = 0; j < 10; j++) {
                        Squares.insert({
                            x: i,
                            y: j,
                            height: 1,
                            width: 1,
                            link: [],
                            selected: false,
                            canvasId: canvasId
                        });
                    };
                };
            }
        }
    });

    Meteor.publish('users', function() {
        return Meteor.users.find({});
    })

    Meteor.publish('canvas', function(canvasId, password) {

        var canvas = Canvas.findOne({
            _id: canvasId
        });

        if (canvas) {

            if (canvas.password == undefined || canvas.password === password) {

                return [Squares.find({
                    canvasId: canvasId
                }), Stencils.find({
                    // canvasId: canvasId
                })];

            } else {
                this.error(new Meteor.Error(null, "Invalid Password", "Try again."));
            }

        } else {
            this.error(new Meteor.Error(null, "Canvas not found", "need to check pub/sub"));
        }
    })


    /*********************************************************************
        FACEBOOK API METHODS
    *********************************************************************/
    Meteor.methods({
        test: function() {
            var eventObj = Meteor.call("getEventMetaData", "574877579268704");
            console.log(eventObj);
            return;
        },
        'search-fb': function(input) {
            var result = Meteor.http.call("GET",
                'https://graph.facebook.com/search?' +
                'q=' + input.q +
                '&type=' + input.type +
                '&limit=' + 20 +
                '&access_token=' + FB_ACCESS_TOKEN
            );

            console.log(result);
            return result;
        },
        getEventAttendees: function(eventID) {
            // if (!eventName || eventName.length === 0) return null; //No event name found
            // //Search for the ID of the event
            // var eventIDquery = "SELECT eid FROM event WHERE name='" + eventName + "'";
            // var eventIDresponse = HTTP.get("https://graph.facebook.com/fql?q=" + eventIDquery
            //     + "&access_token=" + FB_ACCESS_TOKEN);
            // var eventsFound = eventIDresponse.data.data;
            // var eventID = eventsFound[0].eid;
            // console.log("Event ID: " + eventID);

            //Get the attendees for the event
            var eventAttendeesResponse = HTTP.get("https://graph.facebook.com/" + eventID + "/attending"
                + "?access_token=" + FB_ACCESS_TOKEN);
            var eventAttendeesArray = eventAttendeesResponse.data.data;
            return eventAttendeesArray;
        },
        getEventAttendeesByEventName: function(eventName) {
            if (!eventName || eventName.length === 0) return null; //No event name found
            //Search for the ID of the event
            var eventIDquery = "SELECT eid FROM event WHERE name='" + eventName + "'";
            var eventIDresponse = HTTP.get("https://graph.facebook.com/fql?q=" + eventIDquery
                + "&access_token=" + FB_ACCESS_TOKEN);
            var eventsFound = eventIDresponse.data.data;
            var eventID = eventsFound[0].eid;
            console.log("Event ID: " + eventID);

            //Get the attendees for the event
            var eventAttendeesResponse = HTTP.get("https://graph.facebook.com/" + eventID + "/attending"
                + "?access_token=" + FB_ACCESS_TOKEN);
            var eventAttendeesArray = eventAttendeesResponse.data.data;
            return eventAttendeesArray;
        },
        getMutualFriends: function(facebookUserID) {
            var response = HTTP.get("https://graph.facebook.com/" + facebookUserID + "/mutualfriends" + "?access_token=" + FB_ACCESS_TOKEN);
            var friendsFound = response.data.data;
            return friendsFound;
        },
        getFavouriteMusic: function(facebookUserID) {
            var response = HTTP.get("https://graph.facebook.com/" + facebookUserID + "/music"
                + "?access_token=" + FB_ACCESS_TOKEN
                + "&limit=100");
            var artistsFound = response.data.data;
            return artistsFound;
        },
        getFavouriteMoviesAndTVShows: function(facebookUserID) {
            var tvResponse = HTTP.get("https://graph.facebook.com/" + facebookUserID + "/television"
                + "?access_token=" + FB_ACCESS_TOKEN);
            var tvShowsFound = tvResponse.data.data;
            
            var movieResponse = HTTP.get("https://graph.facebook.com/" + facebookUserID + "/movies"
                + "?access_token=" + FB_ACCESS_TOKEN);
            var moviesFound = movieResponse.data.data;
            var mergedArr = _.union(tvShowsFound, moviesFound);
            return mergedArr;
        },
        getFavouriteMusicBatched: function(usersArray) { //Method to get music likes for all users through batching
            if (usersArray.length > 50) {
                console.log("Batch query limit exceeded. Max 50 only.");
                return;
            }

            var batchJSONArray = new Array();

            _.each(usersArray, function(userID) {
                var requestObj = {
                    method: "GET",
                    relative_url: userID + "/music"
                };
                batchJSONArray.push(requestObj);
            });

            var batchRequestURL = "https://graph.facebook.com/"
                + "?batch=" + JSON.stringify(batchJSONArray)
                + "&access_token=" + FB_ACCESS_TOKEN;

            var batchResponse = HTTP.post(batchRequestURL);
            var dataChunk = batchResponse.data;
            var dataParts = new Array();
            _.each(dataChunk, function(dataChunk) {
                var dataChunkBody = _.pick(dataChunk, "body");
                var bodyContent = JSON.parse(dataChunkBody.body);
                dataParts.push(bodyContent.data);
            });
            return dataParts;
        },
        aggregateMusicLikes: function (userIDArray) {
            var startTime = new Date();
            if (!userIDArray && userIDArray.length === 0) return null;
            
            var userMusicLikes = new Array();
            var batchUserIDs = new Array(); //Array to store the user IDs to make the batched API call

            //Get music likes for each individual user
            _.each(userIDArray, function(userID, index, list) {
                batchUserIDs.push(userID);
                if (batchUserIDs.length === 50 || index === (list.length - 1)) {
                    var musicLikes = Meteor.call("getFavouriteMusicBatched", batchUserIDs);
                    batchUserIDs = new Array(); //resetting the array to store new user IDs

                    _.each(musicLikes, function(likesPerUser) {
                        _.each(likesPerUser, function(like){
                            userMusicLikes.push(like);
                        });
                    });
                }
            });

            var groupedMusicObj = _.groupBy(userMusicLikes, function(like) {
                return like.id;
            });

            var groupedMusicArray = new Array();

            _.each(_.keys(groupedMusicObj), function(key) {
                var aggrLikes = this[key];
                var aggrLikeObj = {
                    count: aggrLikes.length,
                    name: aggrLikes[0]["name"],
                    id: aggrLikes[0]["id"]
                };
                groupedMusicArray.push(aggrLikeObj);
            }, groupedMusicObj);

            groupedMusicArray = _.sortBy(groupedMusicArray, function(artist) {
                return - artist.count;
            });
            
            groupedMusicArray = groupedMusicArray.slice(0,Math.min(groupedMusicArray.length, 10));

            var endTime = new Date();
            console.log("Time Taken = " + (endTime - startTime));
            
            return groupedMusicArray;
        },
        getEventMetaData: function(eventID) {
            var response = HTTP.get("https://graph.facebook.com/" + eventID
                + "?access_token=" + FB_ACCESS_TOKEN);
            var eventObj = response.data;
            var eventMeta = _.pick(eventObj, "id", "name", "owner", "start_time", "end_time", "location", "venue");
            return eventMeta;
        }
    });

    Meteor.startup(function() {
        // Meteor.call('clearAll');
        Meteor.call('initialize', 'public');
    });

}
