Meteor.methods({
	'search-fb': function(input) {
		var searchTest = Meteor.http.call("GET", 
							'https://graph.facebook.com/search?' + 
								'q=' + input.q + 
								'&type=' + input.type +
								'&access_token=' + Meteor.user().services.facebook.accessToken
							);
		return searchTest;
	}
});