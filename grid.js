Squares = new Meteor.Collection('square');
Stencils = new Meteor.Collection('stencil');

if (Meteor.isClient) {

    Template.canvas.squares = function() {
        return Squares.find({}, {
            sort: {
                y: 1,
                x: 2
            }
        });
    };

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

    Template.canvas.read = function(value) {
        var query;

        if (typeof value == 'string') {
            if (value.match(/^https?:\/\/(?:[a-z\-]+\.)+[a-z]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png)$/)) {
                return new Handlebars.SafeString('<img src="' + value + '">');
            }

            if (value.match(/^(map|map of) /)) {
                query = value.replace(/^(map|map of) /, '');

                return new Handlebars.SafeString('<img src="http://maps.googleapis.com/maps/api/staticmap?center=' + query + '&markers=color:green|' + query + '&zoom=14&size=' + this.height * 100 + 'x' + this.width * 100 + '&sensor=false">');
            }

            if (value.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/)) {
                var match = value.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                if (match && match[2].length == 11) {
                    return new Handlebars.SafeString('<iframe width="' + this.width * 100 + '" height="' + this.height * 100 + '" src="//www.youtube.com/embed/' + match[2] + '" frameborder="0" allowfullscreen></iframe>');
                } else {
                    return value;
                }
            }

            if (value.match(/(crawl|scrape) (http|https):\/\/[^"]+$/)) {
                return new Handlebars.SafeString('<span class="glyphicon glyphicon-link">');
            }

            return new Handlebars.SafeString(value);
        }

        return value;
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
            Squares.update(Grid.startSelect._id, {
                $unset: {
                    value: 1,
                    fn: 1,
                    style: 1
                }
            });
        },
        resetCanvas: function() {
            Meteor.call('reset');
        },
        addStencil: function() {
            options = {
                title: 'Title for Stencil',
                inputType: 'text',
                callback: function(title) {
                    if (title == null) return;

                    var stencil = _.pick(Grid.startSelect, 'fn', 'value', 'style');
                    stencil.title = title;

                    Stencils.insert(stencil);
                }
            }

            bootbox.prompt(options);
        },
        refresh: function(target) {
            if (target.url) {
                Action.fetch(target.url);
            } else {
                try {
                    var fn = new Function(['$', 'link'], target.fn);

                    var linkArray = _.map(target.link, function(link) {
                        return Squares.findOne(link);
                    });

                    Squares.update(target._id, {
                        $set: {
                            value: fn($, linkArray),
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

            var options = {
                title: 'Raw Input or URL to crawl',
                inputType: 'text',
                instruction: $('<b>You can try these examples:</b><br><ul><li>map of singapore management university</li><li>http://www.youtube.com/watch?v=tqgO-SwnIEY</li><li>http://mozorg.cdn.mozilla.net/media/img/firefox/new/header-firefox.png</li></ul>'),
                value: Grid.startSelect.value,
                callback: function(input) {
                    if (input == null) {
                        return;
                    }

                    if (!isNaN(parseFloat(input)) && isFinite(input)) {
                        input = parseFloat(input)
                    } else if (input.match(/^(http|https):\/\/[^"]+$/)) {
                        Squares.update(Grid.startSelect._id, {
                            $set: {
                                url: input
                            }
                        });
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
                            link: {
                                $elemMatch: Grid.startSelect._id
                            }
                        }, {
                            transform: function(e) {
                                Action.refresh(e);
                            }
                        }).fetch();
                    }
                }
            }

            bootbox.prompt(options);
        },
        editFunction: function() {

            var options = {
                title: 'Attach a Javascript Function',
                inputType: 'function',
                mode: 'javascript',
                value: Grid.startSelect.fn || "var a = $(window).height()\nreturn a;",
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
                        });

                        Action.refresh(Grid.startSelect);
                    } catch (error) {
                        bootbox.alert(error.message);
                    }
                }
            }

            bootbox.prompt(options);

        },
        editStyle: function() {
            var options = {
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
            }

            bootbox.prompt(options);

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
                } else {
                    Squares.remove(e._id);
                }
            });

            Grid.startSelect = null;
        },
        fetch: function(url) {
            Squares.update(Grid.startSelect._id, {
                $set: {
                    url: url
                }
            });

            Meteor.call('fetch', url, Grid.startSelect.fn, Grid.startSelect._id)
        }
    }

    Template.canvas.events({
        'mousedown .main-container': function(e) {
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

            } else if (Grid.selectLink || e.metaKey || e.ctrlKey) {
                if (this.linked) {

                    Squares.update(Grid.startSelect._id, {
                        $pull: {
                            link: this._id
                        }
                    });

                    Squares.update(this._id, {
                        $set: {
                            linked: false
                        }
                    });

                } else {

                    Squares.update(Grid.startSelect._id, {
                        $push: {
                            link: this._id
                        }
                    });

                    Squares.update(this._id, {
                        $set: {
                            linked: true
                        }
                    });

                }
            } else {

                Grid.startSelect = this;

                Session.set('menu.x', this.x + (this.width - 1) / 2);
                Session.set('menu.y', this.y + (this.height - 1) / 2);


            }
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
        'click li.merge-button': Action.merge,
        'click li.edit-button': Action.edit,
        'click li.function-button': Action.editFunction,
        'click li.style-button': Action.editStyle,
        'click li.next-page-button': Template.menu.nextPage,

        //Page 2
        'click li.previous-page-button': Template.menu.prevPage,
        'click li.link-button': Action.editLinks,
        'click li.delete-button': Action.delete
    };

    Template.toolbox.events = {
        'click button.add-stencil-button': Action.addStencil,
        'click button.clear-canvas-button': Action.resetCanvas
    }

    Meteor.startup(function() {
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
                'super+v': function(e) {
                    if ($(e.target).is('body')) {
                        Action.paste();
                    }
                },
                'ctrl+v': function(e) {
                    if ($(e.target).is('body')) {
                        Action.paste();
                    }
                },
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
                        Action.merge();
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
        }, 500);
    });
}

if (Meteor.isServer) {
    var cheerio = Meteor.require('cheerio');

    Meteor.methods({
        fetch: function(url, statements, _id) {

            Meteor.http.get(url, function(error, response) {
                var $, data, fn;

                if (response.headers['content-type'].match(/text\/html/)) {

                    $ = cheerio.load(response.content);
                    fn = new Function('$', statements);

                } else if (response.headers['content-type'].match(/application\/json/)) {

                    $ = JSON.parse(response.content)
                    fn = new Function('data', statements);

                }

                Squares.update(_id, {
                    $set: {
                        value: fn($),
                    }
                });
            });
        },
        reset: function() {
            Meteor.call('clear');
            Meteor.call('initialize');
        },
        clear: function() {
            Squares.remove({});
        },
        initialize: function() {
            // Initialize empty cells
            if (Squares.find().count() == 0) {
                for (var i = 0; i < 15; i++) {
                    for (var j = 0; j < 15; j++) {
                        Squares.insert({
                            x: i,
                            y: j,
                            height: 1,
                            width: 1,
                            selected: false
                        });
                    };
                };
            }
        }
    });

    Meteor.startup(function() {
        // Meteor.call('clear');
        Meteor.call('initialize');
    });
}
