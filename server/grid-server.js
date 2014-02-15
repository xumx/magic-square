var cheerio = Meteor.require('cheerio');

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

Meteor.startup(function() {
	// Meteor.call('clearAll');
	Meteor.call('initialize', 'public');
});

//TESTING CODE
Meteor.methods({
	'fbTest': function(eventName) {
		var response = getEventAttendees(eventName);
		console.log(response);
	},
	'search-fb': function(input) {
		return Meteor.http.call("GET", 
							'https://graph.facebook.com/search?' + 
								'q=' + input.q + 
								'&type=' + input.type +
								'&limit=' + 20 +
								'&access_token=' + Meteor.user().services.facebook.accessToken
							);
	}
});
/*
    FACEBOOK METHODS
*/
function getEventAttendees(eventName) {
    //Search for the ID of the event
    var eventIDquery = "SELECT eid FROM event WHERE name='" + eventName + "'";
    console.log("Event search Query: " + eventIDquery);
    var eventIDresponse = HTTP.get("https://graph.facebook.com/fql?q=" + eventIDquery
        + "&access_token=" + Meteor.user().services.facebook.accessToken);
    var eventsFound = eventIDresponse.data.data;
    var eventID = eventsFound[0].eid;
    console.log("Event ID: " + eventID);

    //Get the attendees for the event
    var eventAttendeesResponse = HTTP.get("https://graph.facebook.com/" + eventID + "/attending"
        + "?access_token=" + Meteor.user().services.facebook.accessToken);
    var eventAttendeesArray = eventAttendeesResponse.data;
    return eventAttendeesArray;
}