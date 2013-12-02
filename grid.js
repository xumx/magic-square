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

            if (value.match(/(crawl|scrape) ^(http|https):\/\/[^"]+$/)) {
                return new Handlebars.SafeString('<span class="glyphicon glyphicon-link">');
            }
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
            Grid.copy = _.pick(Grid.startSelect, 'fn', 'value', 'style');
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
        clearCanvas: function() {
            Meteor.call('clear');
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
        refresh: function() {
            var fn = new Function('$', Grid.startSelect.fn);

            if (Grid.startSelect.url) {
                Action.scrape(Grid.startSelect.url);
            } else {
                Squares.update(Grid.startSelect._id, {
                    $set: {
                        value: fn($),
                    }
                });
            }
        },
        refreshAll: function() {
            //Placeholder
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
                Grid.startSelect.selected = false;
                newSquare.selected = true;

                Grid.startSelect = newSquare;

                Session.set('menu.x', Grid.startSelect.x + (Grid.startSelect.width - 1) / 2);
                Session.set('menu.y', Grid.startSelect.y + (Grid.startSelect.height - 1) / 2);

                Session.set('singleSelection', true); //temp
            }
        },
        edit: function() {

            var options = {
                title: 'Raw Input or URL to crawl',
                inputType: 'text',
                message: '<b>You can try these examples:</b><br><ul><li>map of singapore management university</li><li>http://www.youtube.com/watch?v=tqgO-SwnIEY</li><li>http://mozorg.cdn.mozilla.net/media/img/firefox/new/header-firefox.png</li></ul>',
                value: Grid.startSelect.value,
                callback: function(input) {
                    if (input == null) {
                        return;
                    }

                    if (!isNaN(parseFloat(input)) && isFinite(input)) {
                        input = parseFloat(input)
                    }

                    if (input.match(/^(http|https):\/\/[^"]+$/)) {
                        Squares.update(Grid.startSelect._id, {
                            $set: {
                                url: input
                            }
                        });
                    }

                    Squares.update(Grid.startSelect._id, {
                        $set: {
                            value: input
                        }
                    });

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

                    //TODO
                    //replace with cell reference
                    var fn = new Function('$', statements);

                    if (typeof fn == 'function') {
                        Squares.update(Grid.startSelect._id, {
                            $set: {
                                fn: statements
                            }
                        });
                    } else {
                        alert('Invalid function');
                    }


                    if (Grid.startSelect.url) {

                        //Run function on server
                        Action.scrape(Grid.startSelect.url);

                    } else {

                        //Run function locally
                        Squares.update(Grid.startSelect._id, {
                            $set: {
                                value: fn($)
                            }
                        });
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
        scrape: function(url) {
            Squares.update(Grid.startSelect._id, {
                $set: {
                    url: url
                }
            });

            Meteor.call('scrape', url, Grid.startSelect.fn, Grid.startSelect._id)
        }
    }

    Template.canvas.events({
        'click .square': function(e) {
            if (e.shiftKey) {
                Grid.endSelect = this;

                Session.set('singleSelection', false); //temp

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

            } else {

                Grid.startSelect = this;

                Session.set('menu.x', this.x + (this.width - 1) / 2);
                Session.set('menu.y', this.y + (this.height - 1) / 2);

                Session.set('singleSelection', true); //temp

                Grid.startSelect.selected = true;

                // Squares.find({
                //     selected: true
                // }, {
                //     transform: function(e) {
                //         Squares.update(e._id, {
                //             $set: {
                //                 selected: false
                //             }
                //         });
                //     }
                // }).fetch();

                // Squares.update(this._id, {
                //     $set: {
                //         selected: true
                //     }
                // });
            }
        }
    });

    Template.menu.xpos = function() {
        return Session.get('menu.x') * 100;
    };

    Template.menu.ypos = function() {
        return Session.get('menu.y') * 100;
    };

    Template.menu.singleSelection = function() {
        return Session.get('singleSelection');
    }

    Template.menu.events = {
        'click li.merge-button': Action.merge,
        'click li.edit-button': Action.edit,
        'click li.function-button': Action.editFunction,
        'click li.delete-button': Action.delete,
        'click li.style-button': Action.editStyle
    };

    Template.toolbox.events = {
        'click button.add-stencil-button': Action.addStencil,
        'click button.clear-canvas-button': Action.clearCanvas
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
                        Action.refresh();
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
        scrape: function(url, statements, _id) {
            var $ = cheerio.load(Meteor.http.get(url).content);
            var fn = new Function('$', statements);

            Squares.update(_id, {
                $set: {
                    value: fn($)
                }
            });
        },
        clear: function() {
            Squares.remove({});
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
    });
}
