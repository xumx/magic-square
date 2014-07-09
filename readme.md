Magic Square 
============

Magic Square reimagines Excel for the web. It introduces a new concept of linking cells together and enables users to input custom JavaScript functions as a cell's formula. It also allows you to call various web services/APIs by invoking keywords and providing the required parameters.

This project was extended for a proof of concept built for the Facebook Singapore Hackathon held from 15th to 16th Feb 2014. Click <a href="#facebook-singapore-hackathon">here</a> for more information about the prototype.

## Supported Web Services/APIs
* Facebook Graph API
* Spotify
* Google Maps
* YouTube

## Facebook Singapore Hackathon
We built a prototype to demonstrate how Facebook's Graph search (search box on top of the Facebook page) could be extended to provide more meaningful information to users and allow them do interesting things with it. For the hackathon, we built two examples/use cases around Facebook events.

### Demo Use Case 1: Music Preferences Amongst Event Attendees
We allowed people to find out the favourite music artists/bands amongst all the people attending a particular event. Once they know the artists, we gave them an option to play songs from those artists through Spotify.

1. Enter `Facebook Singapore Hackathon` in a cell of your choice
2. In another cell, type in `event called` and link it to the cell used in step 1 (Cmd/Ctrl + click)
3. The cell will load the event picture and title. This cell can now be used to identify the event in future API calls
4. In any blank cell, type in `people going to` and link it to the cell used in step 3 (Cmd/Ctrl + click)
5. A list of all the people attending the event will be rendered in the chosen cell. This cell can be used to identify the event attendees in future API calls
6. In yet another blank cell, enter `favourite music of` and then link it to the list of people created in step 5
7. A list of the most popular artists amongst all the attendees will be rendered within the cell (in descending order)

### Demo Use Case 2: Mutual Friends Amongst Event Attendees
Second, we built an example from the point of view of an attendee. We allowed people to search for mutual friends amongst all the people attending an event.

1. Enter `Facebook Singapore Hackathon` in a cell of your choice
2. In another cell, type in `event called` and link it to the cell used in step 1 (Cmd/Ctrl + click)
3. The cell will load the event picture and title. This cell can now be used to identify the event in future Facebook Graph API calls
4. In any blank cell, type in `people going to` and link it to the cell used in step 3 (Cmd/Ctrl + click)
5. A list of all the people attending the event will be rendered in the chosen cell. This cell can be used to identify the event attendees in future API calls
6. In yet another blank cell, enter `mutual friends of` and then link it to the list of people created in step 5
7. A list of people you share mutual friends with will be rendered within the cell (in descending order)

==

### Demo
http://graphpaper.meteor.com

### How to run the app on your own machine

Step 1: Install Meteor

`curl https://install.meteor.com | /bin/sh`


Step 2: download this repository, unzip, and navigate to the directory


Step 3: Start the server

`meteor`


#### Demo 1: (Move cursor, Menu, Hotkeys, Merge Cell, Copy, Paste)

Hello World!


#### Demo 2: (Function, Links, Remove Links)

Window height

X^2

Fibonacci



#### Demo 3: Full Example

map of London bridge

map of Tokyo Station

streetview stencil

music search


Features Overview
-----------------
* Realtime sync across multiple clients

* `Click` to select a cell
* `Shift + Click` to select multiple cells

* `Enter` to edit value
* `f` to edit function
* `r` to re-compute value
* `c or s` to edit css/style
* `l` to edit links
* `u` to edit url
* `m` to merge multiple selected cells
* `m` again to unmerge the single selected cell

* `Cmd + C` to Copy
* `Cmd + V` to Paste
* `Cmd + X` to Cut
* `Backspace` to clear cell's value
* `Backspace` again on a empty big merged cell will split the cell

* Arrow keys to move cursor

### Value field
* Accept natural language values e.g. "map of tokyo station"
* Accept Youtube URL
* Accept links to other cells e.g. "Hello link[0], welcome to link[1]."
* Accept Array object and automatically renders a List in flat UI

### Function field
* Accept javascript code as input. (requires 'return' statement)
* Javascript can access Underscore (_), jQuery ($), linked cells as an array (link)
* Accept HTML string as return value
* Accpet Array object as return value


## Advanced Function examples
`
	//Use underscore defer to delay a function's execution
	_.defer(function() {
	    var bryantPark = new google.maps.LatLng(37.869260, -122.254811);
	    var panoramaOptions = {
	        position: bryantPark,
	        pov: {
	            heading: 165,
	            pitch: 0
	        },
	        zoom: 1
	    };

	    var myPano = new google.maps.StreetViewPanorama(
	        $('#streetview-' + ID)[0], //reference to an element that 
	        panoramaOptions);
	    myPano.setVisible(true);
	});

	return '<div id="streetview-' + ID + '"></div>'
`

### Style
* Accept special CSS style for each individual cell
* Accept Server side web crawling using input URL and Javascript function
* Toolbox to save a cell for later use

* Pan the canvas using mouse drag

## In the pipeline
* Multiple canvas instance (pastebin style)
* Option for password protected canvas
* Increase canvas size (1024 * 1024)?
* Intro Tour
* More sidebar features
* Auto parsing of objects
* Add full Google Maps Javascript features

## Architecture and Technology Stack
Magic Square is a web application running on top of the Meteor Framework http://meteor.com 
Client and Server share the same database API (MongoDB). Every client includes an in-memory database cache (minimongo). To manage the client cache, the server publishes sets of JSON documents, and the client subscribes to those sets. As documents in a set change, the server patches each client's cache. Details of how Meteor works can be found on http://docs.meteor.com/


## Security
Magic Square makes use of multiple javascript techniques that are considered insecure. The author is well aware of the security issues with allowing eval(), new Function(), and user generated HTML. However, as the dynamic modifiability of javascript functions, css, and HTML is a core feature of this application, it does not make sense to enforce strict browser policy. Hacking techniques like cross-site scripting and clickjacking are likely to occur on the publicly hosted version of this app. Infact, users are encouraged to utilize these techniques to augment the application's functionalities. Do not use this site for sensitive transactions.



&copy; 2014 Max Xu