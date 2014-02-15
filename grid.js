Squares = new Meteor.Collection('square');
Stencils = new Meteor.Collection('stencil');
Canvas = new Meteor.Collection('canvas');

API = {
    embedly: "1b7350d8cb894d1f9b5fffd18cc0ba56",
    google: {
        server: "AIzaSyCXobbe29WEsE7k1nxAXj5w",
        client: "AIzaSyBbEd2KpEdLZYMSxcQzhxD0mDHtab3nne0"
    }
}

// Facebook Singapore Hackathon": 574877579268704
// HACKATHON_EVENTID = ""

_.templateSettings = {
    interpolate: /(link\[[0-9]+\])/g
};

Utility = {
    deselect: function() {
        Squares.find({
            selected: true
        }, {
            transform: function(e) {
                Squares.update(e._id, {
                    $set: {
                        selected: false
                    }
                });
            }
        }).fetch();
    },
    findNextSquare: function(currentSquare, direction, offset) {
        if (offset === undefined) offset = 1;

        //Direction : up down left right
        switch (direction) {
            case 'up':
                return Squares.findOne({
                    x: currentSquare.x,
                    y: currentSquare.y - offset
                })
                break;

            case 'down':
                return Squares.findOne({
                    x: currentSquare.x,
                    y: currentSquare.y + offset
                })
                break;

            case 'left':
                return Squares.findOne({
                    x: currentSquare.x - offset,
                    y: currentSquare.y
                })
                break;

            case 'right':
                return Squares.findOne({
                    x: currentSquare.x + offset,
                    y: currentSquare.y
                })
                break;

            default:
                return Squares.findOne({
                    x: currentSquare.x,
                    y: currentSquare.y + offset
                })
                break;

        }
    }
}

if (Meteor.isClient) {

    Session.setDefault('fb-result', '');
    Deps.autorun(function() {
        var result = Session.get('fb-result');
        if (typeof result == 'object') {
            Squares.update(result.squareId, {
                $set: {
                    value: result.value
                }
            });
        }
    });

    Template.canvas.squares = function() {
        return Squares.find({}, {
            sort: {
                y: 1,
                x: 2
            }
        });
    }

    Template.canvas.xpos = function() {
        return this.x * 100
    }

    Template.canvas.ypos = function() {
        return this.y * 100
    }

    Template.canvas.heightpx = function() {
        return this.height * 100;
    }

    Template.canvas.widthpx = function() {
        return this.width * 100;
    }

    Template.canvas.read = function() {
        var query, value = this.value;

        //Priority
        if (typeof value == 'string' && value.match(/link\[[0-9]+\]/)) {

            var linkArray = _.map(this.link, function(link) {
                return Squares.findOne(link).value;
            });

            value = _.template(value, linkArray, {
                variable: 'link'
            });

            //No return, so that the value is carried forward
        }

        if (typeof value == 'string' && value.match(/^https?:\/\/.+\.(?:jpe?g|gif|png)$/i)) {
            return new Handlebars.SafeString('<img src="' + value + '">');
        }

        if (typeof value == 'string' && value.match(/^(map|map of) /i)) {
            query = value.replace(/^(map|map of) /, '');
            return new Handlebars.SafeString('<img src="http://maps.googleapis.com/maps/api/staticmap?center=' + query + '&markers=color:green|' + query + '&zoom=14&size=' + this.width * 100 + 'x' + this.height * 100 + '&sensor=false">');
        }

        // push url to url 
        if (typeof value == 'string' && value.match(/^https?:\/\/.+/)) {
            // return new Handlebars.SafeString('<img src="' + value + '">');
        }

        //# Detect Array and build List UI
        //Expected format ["London" ,"Tokyo" ,"Paris"]
        //Alternate format [{text:"Appple", href:"http://apple.com"} , {text:"Amazon",href:"http://amazon.com"}]

        if (Array.isArray(value)) {



            result = '<ul class="' + _.sample(['fly', 'cards', 'wave', 'curl', 'papercut']) + '">\n';

            _.each(value, function(row) {
                if (typeof row == 'object') {

                    if (row.name) {//This is an FB user result
                        result += '<li><img src="http://graph.facebook.com/' + row.id + '/picture"/>' + row.name + '</li>\n'
                    } else if (typeof row.href == 'string' && typeof row.text == 'string') {
                        result += '<li><a href="' + row.href + '">' + row.text + '</a></li>\n'
                    }

                } else {
                    result += '<li>' + row + '</li>\n'
                }
            })

            result += '</ul>'

            _.defer(function() {
                stroll.bind('.square ul');
            });

            return new Handlebars.SafeString(result);

        }
        return new Handlebars.SafeString(value);
    }

    function renderFBArray(value) {
        result = '<ul class="' + _.sample(['fly', 'cards', 'wave', 'curl', 'papercut']) + '">\n';
        _.each(value, function(row) {
            if (typeof row == 'object' && row.href && row.text) {
                if (typeof row.href == 'string' && typeof row.text == 'string') {
                    result += '<li><a href="' + row.href + '">' + row.text + '</a></li>\n'
                }
            } else if (typeof row == 'object' && row.name) {
                //This is an FB user result
                result += '<li><img src="http://graph.facebook.com/' + row.id + '/picture"/>' + row.name + '</li>\n'
            } else {
                result += '<li>' + row + '</li>\n'
            }
        })
        result += '</ul>'
        _.defer(function() {
            stroll.bind('.square ul');
        });
        return result;
    }

    Template.toolbox.stencils = function() {
        return Stencils.find({});
    }

    Grid = {
        startSelect: null,
        endSelect: null,
        copy: null,
        cut: null
    }

    Action = {
        login: function() {
            Meteor.loginWithFacebook({
                requestPermissions: [
                    'user_events',
                    'user_friends'
                ]
            }, function(err) {
                if (err) console.log(err);
                else console.log('Logged in!');
            });
        },
        logout: function() {
            Meteor.logout();
        },
        trySubscribe: function(error) {
            var password = null;

            if (error) {
                console.error(error);
                bootbox.prompt('Password', function(p) {

                    if (p == null) {
                        bootbox.alert('Unable to view canvas because it is secured by a canvas password.');
                        return;
                    } else {
                        password = p;

                        Meteor.subscribe('canvas', Session.get('canvasId'), password, {
                            onError: Action.trySubscribe,
                            onReady: Action.subscribeReady
                        });
                    }

                });
            } else {

                Meteor.subscribe('canvas', Session.get('canvasId'), password, {
                    onError: Action.trySubscribe,
                    onReady: Action.subscribeReady
                });
            }
        },
        subscribeReady: function() {
            Squares.find({
                selected: true
            }, {
                transform: function(e) {
                    Squares.update(e._id, {
                        $set: {
                            selected: false
                        }
                    });
                }
            }).fetch();
        },
        copy: function() {
            Grid.copy = _.pick(Grid.startSelect, 'fn', 'value', 'style', 'link', 'url');
        },
        paste: function() {
            Squares.update(Grid.startSelect._id, {
                $set: Grid.copy
            });
        },
        cut: function() {
            Action.copy();
            Action.delete();
        },
        delete: function() {

            var toDelete = Squares.find({
                selected: true
            }).fetch();

            if (toDelete.length > 1) {

                _.each(toDelete, function(square) {
                    Squares.update(square._id, {
                        $unset: {
                            value: 1,
                            fn: 1,
                            style: 1,
                            url: 1
                        },
                        $set: {
                            link: [],
                        }
                    });
                });

            } else if (Grid.startSelect.value != undefined) {

                Squares.update(Grid.startSelect._id, {
                    $unset: {
                        value: 1,
                        fn: 1,
                        style: 1,
                        url: 1
                    },
                    $set: {
                        link: [],
                    }
                });

            } else {

                Action.split();

            }
        },

        newCanvas: function() {
            bootbox.prompt('Canvas Name (Optional)', function(name) {
                if (name !== null && name !== '') {

                    bootbox.prompt('Password (Optional)', function(password) {

                        Meteor.call('create', name, password, function(error) {
                            if (error) {
                                console.error(error);
                                bootbox.alert('Name already taken. Please choose another name.', Action.newCanvas)
                            } else {
                                Router.go('home', {
                                    canvasId: name
                                });
                            }
                        });

                    });
                }
            })

        },

        resetCanvas: function() {
            var canvasId = Session.get('canvasId');
            if (canvasId) {
                Meteor.call('reset', canvasId);
            }
        },

        addStencil: function() {
            bootbox.prompt({
                title: 'Title for Stencil',
                inputType: 'text',
                callback: function(title) {
                    if (title == null) return;
                    var stencil = _.pick(Grid.startSelect, 'fn', 'value', 'style', 'url');
                    stencil.title = title;

                    Stencils.insert(stencil);
                }
            });
        },
        copyStencil: function() {
            Grid.copy = _.pick(this, 'fn', 'value', 'style', 'url');
        },
        deleteStencil: function() {
            Stencils.remove(this._id);
        },

        //TODO think about how to reduce refresh
        refresh: function(target) {
            var value, linkArray, url;

            if (_(target).has('url')) {
                url = target.url;

                //Fill references with link data
                if (typeof target.url == 'string' && target.url.match(/link\[[0-9]+\]/)) {

                    linkArray = _.map(target.link, function(link) {
                        return Squares.findOne(link).value;
                    });

                    url = _.template(url, linkArray, {
                        variable: 'link'
                    });
                }

                $.embedly.oembed(url, {
                    key: API.embedly,
                    query: {
                        autoplay: 'true'
                    }
                }).done(function(results) {
                    if (results.length > 0) {



                        if (results[0].data) {
                            value = results[0].data;
                        } else if (results[0].html) {
                            value = results[0].html;
                        } else if (results[0].thumbnail_url) {
                            value = '<a target="_blank" data-toggle="tooltip" title="first tooltip" href="' + results[0].url + '"><img src="' + results[0].thumbnail_url + '"></a>';
                        }

                        Squares.update(target._id, {
                            $set: {
                                value: value
                            }
                        });
                    }
                });

                // Action.fetch(target.url);
            } else {
                try {
                    var fn = new Function(['$', 'link', 'id'], target.fn);

                    var linkArray = _.map(target.link, function(link) {
                        return Squares.findOne(link);
                    });

                    var result = fn($, linkArray, target._id);

                    if (result == null || result == undefined) return;

                    Squares.update(target._id, {
                        $set: {
                            value: result
                        }
                    });
                } catch (error) {
                    bootbox.alert(error.message);
                }
            }
        },
        refreshAll: function() {
            //Placeholder
        },
        editLinks: function() {
            if (Grid.selectLink) {

                Grid.selectLink = false;
                $('.main-container .square').css('cursor', 'default');

                Squares.find({
                    linked: true
                }, {
                    transform: function(e) {
                        Squares.update(e._id, {
                            $set: {
                                linked: false
                            }
                        });
                    }
                }).fetch();

            } else {

                Grid.selectLink = true;
                $('.main-container .square').css('cursor', 'cell');

                Squares.find({
                    _id: {
                        $in: Grid.startSelect.link
                    }
                }, {
                    transform: function(e) {
                        Squares.update(e._id, {
                            $set: {
                                linked: true
                            }
                        });
                    }
                }).fetch();
            }
        },
        moveCursor: function(direction) {
            var newX = Grid.startSelect.x,
                newY = Grid.startSelect.y;

            if (!(direction == 'up' || direction == 'down' || direction == 'left' || direction == 'right')) {
                return;
            }

            switch (direction) {
                case 'up':
                    newY--;
                    break;
                case 'down':
                    newY++;
                    break;
                case 'left':
                    newX--;
                    break;

                case 'right':
                    newX++;
                    break;

            }

            var newSquare = Squares.findOne({
                x: newX,
                y: newY
            });

            if (newSquare) {
                Grid.startSelect = newSquare;

                Session.set('menu.x', Grid.startSelect.x + (Grid.startSelect.width - 1) / 2);
                Session.set('menu.y', Grid.startSelect.y + (Grid.startSelect.height - 1) / 2);
            }
        },
        edit: function() {
            bootbox.prompt({
                title: 'Cell Value',
                inputType: 'text',
                instruction: $('<b>You can try these examples:</b><br><ul><li>map of singapore management university</li></ul>'),
                value: Grid.startSelect.value,
                callback: function(input) {
                    if (input == null) {
                        return;
                    }

                    //TESTING FACEBOOK
                    if (typeof input == 'string' && input.match(/^(friends of) /i)) {
                        var query = input.replace(/^(friends of) /, '');
                        
                        if (query.match(/(link\[[0-9]+\])/)) {
                            query = query + '.value';
                        } else {
                            query = '\'' + query + '\'';
                        }

                        var statements = "var data = {q: "+query+" ,type: 'user'};Meteor.call('search-fb', data, function(err, searchReturn) {if (err) console.log(err);if (searchReturn && searchReturn.data.data.length > 1) {Squares.update(id, {$set: {value: searchReturn.data.data}});}});";

                        try {
                            var fn = new Function(['$', 'link', 'id'], statements);

                            Squares.update(Grid.startSelect._id, {
                                $set: {
                                    fn: statements
                                }
                            }, function() {
                                Action.refresh(Grid.startSelect);
                            });
                        } catch (error) {
                            bootbox.alert(error.message);
                        }
                    }

                    try {
                        input = JSON.parse(input);
                    } catch (e) {
                        console.log(input)
                        console.warn("Cannot parse value as JSON: " + e.message);
                    }

                    //if there is a change
                    if (input != Grid.startSelect.value) {
                        Squares.update(Grid.startSelect._id, {
                            $set: {
                                value: input
                            }
                        });

                        //TODO Recursive propagation
                        //Propagate changes
                        Squares.find({
                            link: Grid.startSelect._id
                        }, {
                            transform: function(e) {
                                Action.refresh(e);
                            }
                        }).fetch();
                    }
                }
            });
        },

        escape: function() {
            Utility.deselect();

            if (Grid.selectLink) {
                Action.editLinks();
            }
        },

        editURL: function() {
            bootbox.prompt({
                title: 'What is the URL to call?',
                inputType: 'text',
                instruction: $('<div class="well">If this URL points to a standard HTML page, the result will be wrapped in a $ object. You can then use the standard jQuery style CSS selector and traversal to extract the information you are interested in. If the URL points to a RESTful webservice endpoint, the JSON response will be wrapped in an object named as "data". <br><b>You can try these examples:</b><br><ul><li>map of singapore management university</li><li>http://www.youtube.com/watch?v=tqgO-SwnIEY</li><li>http://mozorg.cdn.mozilla.net/media/img/firefox/new/header-firefox.png</li></ul></div>'),
                value: Grid.startSelect.url,
                callback: function(input) {

                    if (input == null) {
                        return;
                    }

                    if (input.match(/^www/)) {
                        input = 'http://' + input;
                    }

                    if (input.match(/^(http|https):\/\/[^"]+$/)) {
                        if (input != Grid.startSelect.url) {
                            Squares.update(Grid.startSelect._id, {
                                $set: {
                                    url: input
                                }
                            }, function() {
                                Grid.startSelect.url = input;
                                Action.refresh(Grid.startSelect);
                            });
                        }
                    } else {
                        bootbox.alert('Invalid URL');
                    }
                }
            });
        },
        editFunction: function() {
            bootbox.prompt({
                title: 'Attach a Javascript Function',
                inputType: 'function',
                mode: 'javascript',
                instruction: $('<b>Objects available: </b><br><ul><li>$: jQuery Object</li><li>link: javascript array of linked cells</li><li>data: JSON response from webservice</li></ul>'),
                value: Grid.startSelect.fn || "return null;",
                callback: function(statements) {
                    if (statements == null) {
                        return;
                    }

                    try {
                        var fn = new Function(['$', 'link'], statements);

                        Squares.update(Grid.startSelect._id, {
                            $set: {
                                fn: statements
                            }
                        }, function() {
                            Action.refresh(Grid.startSelect);
                        });

                    } catch (error) {
                        bootbox.alert(error.message);
                    }
                }
            });
        },
        editStyle: function() {
            bootbox.prompt({
                title: 'Custom CSS Style',
                inputType: 'function',
                mode: 'css',
                value: Grid.startSelect.style || "font-size: 2em;\nline-height: 100px;\ntext-align: center;",
                callback: function(css) {
                    if (css == null) {
                        return;
                    }

                    // css = css.replace(/\n/g, '');

                    Squares.update(Grid.startSelect._id, {
                        $set: {
                            style: css,
                        }
                    });
                }
            });
        },
        split: function() {

            var height = Grid.startSelect.height
            var width = Grid.startSelect.width

            if (height > 1 || width > 1) {

                var x = Grid.startSelect.x
                var y = Grid.startSelect.y

                var id = Grid.startSelect._id;

                for (yoffset = 0; yoffset < height; yoffset++) {
                    for (xoffset = 0; xoffset < width; xoffset++) {

                        if (xoffset == 0 && yoffset == 0) {
                            Squares.update(id, {
                                $set: {
                                    height: 1,
                                    width: 1
                                }
                            });
                        } else {
                            Squares.insert({
                                x: x + xoffset,
                                y: y + yoffset,
                                height: 1,
                                width: 1,
                                link: [],
                                selected: false,
                                canvasId: Session.get('canvasId')
                            });
                        }
                    }
                }
            }
        },
        merge: function() {
            var toMerge = Squares.find({
                selected: true
            }).fetch();

            var result = _.reduce(toMerge, function(memo, e) {
                //Memo [maxX, maxY, minX, minY]
                if (memo[0] == null || e.x > memo[0]) {
                    memo[0] = e.x;
                }
                if (memo[1] == null || e.y > memo[1]) {
                    memo[1] = e.y;
                }

                if (memo[2] == null || e.x < memo[2]) {
                    memo[2] = e.x;
                }
                if (memo[3] == null || e.y < memo[3]) {
                    memo[3] = e.y;
                }

                return memo;
            }, [null, null, null, null]);

            var width = result[0] - result[2] + 1;
            var height = result[1] - result[3] + 1;;

            _.each(toMerge, function(e) {
                if (e.x == result[2] && e.y == result[3]) {
                    Squares.update(e._id, {
                        $set: {
                            height: height,
                            width: width,
                            selected: false
                        }
                    });

                    Grid.startSelect = e;
                } else {
                    Squares.remove(e._id);
                }
            });

            // TODO            
            // //Remove self from other cells linking to it. 
            // Squares.find({
            //     link: id
            // }, {
            //     transform: function(e) {
            //         Squares.update(e._id)
            //     }
            // })

            // Squares.remove(id);

        },
        fetch: function(url) {
            Meteor.call('fetch', url, Grid.startSelect.fn, Grid.startSelect._id)
        }
    }

    Template.canvas.events({
        'mousedown .main-container': function(e) {
            console.log(e);

            Grid.drag = _.pick(e, 'x', 'y');
            Grid.drag.scrollTop = $('body').scrollTop();
            Grid.drag.scrollLeft = $('body').scrollLeft();
        },
        'mousemove .main-container': function(e) {
            var sensitivity = 10;

            if (Grid.drag != null) {
                if (Math.abs(e.x - Grid.drag.x) > sensitivity || Math.abs(e.y - Grid.drag.y) > sensitivity) {
                    $('body').css('cursor', 'move');
                    $('body').scrollTop(Grid.drag.scrollTop - e.y + Grid.drag.y);
                    $('body').scrollLeft(Grid.drag.scrollLeft - e.x + Grid.drag.x);
                }
            }
        },
        'mouseup .main-container': function(e) {
            Grid.drag = null;
            $('body').css('cursor', 'default');
        },
        'dblclick .square': function(e) {
            var next, link;

            var direction = 'down';
            var offset = 0;

            while (true) {

                next = Utility.findNextSquare(Grid.startSelect, direction, offset);

                var payload = _.pick(Grid.startSelect, 'fn', 'value', 'style', 'url');

                payload.link = [];

                for (var i = 0; i < Grid.startSelect.link.length; i++) {
                    link = Squares.findOne(Grid.startSelect.link[i]);
                    nextLink = Utility.findNextSquare(link, direction, offset);

                    //If cell is blank
                    if (!nextLink.value || typeof nextLink.value !== typeof link.value) {
                        return;
                    }

                    payload.link.push(nextLink._id);
                }

                Squares.update(next._id, {
                    $set: payload
                }, (function(id) {
                    return function() {
                        Action.refresh(Squares.findOne(id));
                    }
                })(next._id));

                offset++;
            }
        },
        'click .square': function(e) {

            if (e.shiftKey) {
                Grid.endSelect = this;

                var largerX, largerY, smallerX, smallerY;

                if (Grid.endSelect.x > Grid.startSelect.x) {
                    largerX = Grid.endSelect.x;
                    smallerX = Grid.startSelect.x;
                } else {
                    smallerX = Grid.endSelect.x;
                    largerX = Grid.startSelect.x;
                }

                if (Grid.endSelect.y > Grid.startSelect.y) {
                    largerY = Grid.endSelect.y;
                    smallerY = Grid.startSelect.y;
                } else {
                    smallerY = Grid.endSelect.y;
                    largerY = Grid.startSelect.y;
                }

                Utility.deselect();

                Squares.find({
                    x: {
                        $gte: smallerX,
                        $lte: largerX,
                    },
                    y: {
                        $gte: smallerY,
                        $lte: largerY,
                    },
                    selected: false
                }, {
                    transform: function(e) {
                        Squares.update(e._id, {
                            $set: {
                                selected: true
                            }
                        });
                    }
                }).fetch();

                Session.set('menu.x', (Grid.startSelect.x + Grid.endSelect.x) / 2);
                Session.set('menu.y', (Grid.startSelect.y + Grid.endSelect.y) / 2);

            } else if (Grid.selectLink) {

                if (this.linked) {
                    //Remove link
                    Squares.update(Grid.startSelect._id, {
                        $pull: {
                            link: this._id
                        }
                    }, function() {
                        Action.refresh(Grid.startSelect);
                    });

                    Squares.update(this._id, {
                        $set: {
                            linked: false
                        }
                    });

                } else {
                    //Add link
                    Squares.update(Grid.startSelect._id, {
                        $push: {
                            link: this._id
                        }
                    }, function() {
                        Action.refresh(Grid.startSelect);
                    });

                    Squares.update(this._id, {
                        $set: {
                            linked: true
                        }
                    });
                }
            } else if (e.metaKey || e.ctrlKey) {
                //Add Link
                Squares.update(Grid.startSelect._id, {
                    $push: {
                        link: this._id
                    }
                }, function() {
                    Action.refresh(Grid.startSelect);
                });

                Squares.update(this._id, {
                    $set: {
                        linked: true
                    }
                }, (function(_id) {
                    return function() {
                        Meteor.setTimeout(function() {
                            Squares.update(_id, {
                                $set: {
                                    linked: false
                                }
                            });
                        }, 2500);
                    }
                })(this._id));
            } else {

                Grid.startSelect = this;

                Session.set('menu.x', this.x + (this.width - 1) / 2);
                Session.set('menu.y', this.y + (this.height - 1) / 2);


            }
        },

        'dragover .square': function(event) {
            event.preventDefault()
        },

        'drop .square': function(event) {
            var value = event.dataTransfer.getData('text');

            console.log(event.target.id);

            Grid.startSelect = Squares.findOne(event.target.id);

            if (value.match(/^www/)) {
                value = 'http://' + value;
            }

            if (typeof value == 'string' && value.match(/^https?:\/\/.+/)) {
                Squares.update(Grid.startSelect._id, {
                    $set: {
                        url: value
                    }
                }, function() {
                    Grid.startSelect.url = value;
                    Action.refresh(Grid.startSelect);
                });
            } else {
                //swap
            }

            event.preventDefault();
        }
    });

    Session.set('menu.page', 1);

    Template.menu.xpos = function() {
        return Session.get('menu.x') * 100;
    };

    Template.menu.ypos = function() {
        return Session.get('menu.y') * 100;
    };

    Template.menu.isPage = function(p) {
        return Session.get('menu.page') == p;
    };

    Template.menu.nextPage = function() {
        Session.set('menu.page', Session.get('menu.page') + 1);
        _.defer(function() {
            $('.open-close-button').focus();
        });
    };

    Template.menu.prevPage = function() {
        Session.set('menu.page', Session.get('menu.page') - 1);
        _.defer(function() {
            $('.open-close-button').focus();
        });
    };

    Template.menu.events = {
        //Page 1
        'click .edit-button': Action.edit,
        'click .function-button': Action.editFunction,
        'click .url-button': Action.editURL,
        'click .style-button': Action.editStyle,
        'click .next-page-button': Template.menu.nextPage,

        //Page 2
        'click .previous-page-button': Template.menu.prevPage,
        'click .link-button': Action.editLinks,
        'click .merge-button': Action.merge,
        'click .pin-button': Action.addStencil,
        'click .next-page-button': Template.menu.nextPage,

        //Page 3
        'click .previous-page-button': Template.menu.prevPage,
        'click .cut-button': Action.cut,
        'click .copy-button': Action.copy,
        'click .paste-button': Action.paste,
        'click .delete-button': Action.delete


    };

    Template.toolbox.events = {
        'click button.login-button': Action.login,
        'click button.logout-button': Action.logout,
        'click button.new-canvas-button': Action.newCanvas,
        'click button.add-stencil-button': Action.addStencil,
        'click button.clear-canvas-button': Action.resetCanvas,
        'click .square': Action.copyStencil,
        'dblclick .square': Action.deleteStencil
    }

    Meteor.startup(function() {

        // Basic Router
        Router.map(function() {
            this.route('home', {
                path: '/:canvasId',
                before: [
                    function() {

                        var reservedNames = ['about', 'canvas', 'admin']

                        if (_.contains(reservedNames, this.params.canvasId)) {
                            console.error('reserved name');
                            return;
                        }

                        Session.set('canvasId', this.params.canvasId);
                        Action.trySubscribe();
                    }
                ]
            });

            this.route('public', {
                path: '/',
                before: [
                    function() {
                        Session.set('canvasId', 'public');
                        Action.trySubscribe();
                    }
                ]
            })
        })

        //No idea when this will load.
        setTimeout(function() {
            Meteor.Keybindings.add({
                'delete': function(e) {
                    if ($(e.target).is('body')) {
                        e.preventDefault();
                        Action.delete();
                    }
                },
                'backspace': function(e) {
                    if ($(e.target).is('body')) {
                        e.preventDefault();
                        Action.delete();
                    }
                },
                'escape': function(e) {
                    if ($(e.target).is('body')) {
                        e.preventDefault();
                        Action.escape();
                    }
                },
                'super+c': function(e) {
                    if ($(e.target).is('body')) {
                        Action.copy();
                    }
                },
                'ctrl+c': function(e) {
                    if ($(e.target).is('body')) {
                        Action.copy();
                    }
                },
                // 'super+v': function(e) {
                //     if ($(e.target).is('body')) {
                //         Action.paste();
                //     }
                // },
                // 'ctrl+v': function(e) {
                //     if ($(e.target).is('body')) {
                //         Action.paste();
                //     }
                // },
                'super+x': function(e) {
                    if ($(e.target).is('body')) {
                        Action.cut();
                    }
                },
                'ctrl+x': function(e) {
                    if ($(e.target).is('body')) {
                        Action.cut();
                    }
                },
                'l': function(e) {
                    if ($(e.target).is('body')) {
                        Action.editLinks();
                    }
                },
                'm': function(e) {
                    if ($(e.target).is('body')) {
                        var count = Squares.find({
                            selected: true
                        }).count();

                        if (count > 1) {
                            Action.merge();
                        } else {

                            Action.split();
                        }
                    }
                },
                'f': function(e) {
                    if ($(e.target).is('body')) {
                        Action.editFunction();
                    }
                },
                'enter': function(e) {
                    if ($(e.target).is('body')) {
                        Action.edit();
                    }
                },
                'r': function(e) {
                    if ($(e.target).is('body')) {
                        Action.refresh(Grid.startSelect);
                    }
                },
                'c': function(e) {
                    if ($(e.target).is('body')) {
                        Action.editStyle();
                    }
                },
                's': function(e) {
                    if ($(e.target).is('body')) {
                        Action.editStyle();
                    }
                },
                'u': function(e) {
                    if ($(e.target).is('body')) {
                        Action.editURL();
                    }
                },
                'up': function(e) {
                    if ($(e.target).is('body')) {
                        Action.moveCursor('up');
                    }
                },
                'down': function(e) {
                    if ($(e.target).is('body')) {
                        Action.moveCursor('down');
                    }
                },
                'left': function(e) {
                    if ($(e.target).is('body')) {
                        Action.moveCursor('left');
                    }
                },
                'right': function(e) {
                    if ($(e.target).is('body')) {
                        Action.moveCursor('right');
                    }
                }
            });

            $('body').bind('paste', function(e) {

                var value = e.originalEvent.clipboardData.getData('text');

                if (value.match(/^www/)) {
                    value = 'http://' + value;
                }

                if (typeof value == 'string' && value.match(/^https?:\/\/.+/)) {
                    Squares.update(Grid.startSelect._id, {
                        $set: {
                            url: value
                        }
                    }, function() {
                        Grid.startSelect.url = value;
                        Action.refresh(Grid.startSelect);
                    });
                } else {
                    Action.paste()
                }
            });
            // $('.loading').remove();

        }, 500);
    });
}
