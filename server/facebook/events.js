function getEventAttendees(eventName) {
	//Search for the ID of the event
	var eventIDquery = "SELECT eid FROM event WHERE name='" + eventName + "'";
	console.log("Event search Query: " + eventIDquery);
	var eventIDresponse = Meteor.HTTP.get("graph.facebook.com/fql?" + eventIDquery
		+ "&access_token=" + Meteor.user.services.facebook.accessToken);
	var eventsFound = eventIDresponse.data;
	var eventID = eventsFound[0].eid;

	//Get the attendees for the event
	var eventAttendeesResponse = Meteor.HTTP.get("graph.facebook.com/" + eventID + "/attending"
		+ "&access_token=" + Meteor.user.services.facebook.accessToken);
	var eventAttendeesArray = eventAttendeesResponse.data;
	return eventAttendeesArray;
}