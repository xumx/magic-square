Magic Square 
============

Magic Square reimagines Excel for the web, and accept javascript as a cell's formula.


v0.1 by @xumx

Demo Link:
http://grid.meteor.com


Demo 1: (Move cursor, Menu, Hotkeys, Merge Cell, Copy, Paste)
Hello World!

Demo 2: (Function, Links, Remove Links)
Window height
X^2
Fibonacci

Demo 3: Full Example
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


Copyright 2013 Max Xu