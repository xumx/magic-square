Squares = new Meteor.Collection('square');

if (Meteor.isClient) {

    Meteor.startup(function() {

        //No idea when this will load.
        setTimeout(function() {
            Meteor.Keybindings.add({
                'delete': function(e) {
                    e.preventDefault();
                    Squares.update(Grid.startSelect._id, {
                        $unset: {
                            value: 1,
                            fn: 1
                        }
                    });
                },
                //Delete
                'backspace': function(e) {
                    e.preventDefault();
                    Squares.update(Grid.startSelect._id, {
                        $unset: {
                            value: 1,
                            fn: 1
                        }
                    });
                },
                //Copy
                'super+c': function() {
                    Grid.copy = _.pick(Grid.startSelect, 'fn', 'value');
                },
                //Paste
                'super+v': function() {
                    Squares.update(Grid.startSelect._id, {
                        $set: Grid.copy
                    });
                },
                //Select All
                'super+a': function(e) {
                    a.preventDefault();

                    Squares.find({}, {
                        transform: function(e) {
                            Squares.update(e._id, {
                                $set: {
                                    selected: true
                                }
                            });
                        }
                    });
                }
            });
        }, 500);

    });

    Template.hello.grid = function() {
        return Squares.find({}, {
            sort: {
                y: 1,
                x: 2
            }
        });
    };

    Template.hello.xpos = function() {
        return this.x * 100
    }

    Template.hello.ypos = function() {
        return this.y * 100
    }

    Template.hello.heightpx = function() {
        return this.height * 100;
    }

    Template.hello.widthpx = function() {
        return this.width * 100;
    }

    Template.hello.evaluate = function(fn) {
        return fn();
    }

    Grid = {
        startSelect: null,
        endSelect: null
    }



    Template.hello.events({
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

                Squares.find({}, {
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

                Session.set('menu.x', this.x);
                Session.set('menu.y', this.y);

                Session.set('singleSelection', true); //temp

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

                Squares.update(this._id, {
                    $set: {
                        selected: true
                    }
                });
            }

            //Same as original
            // if (this == Grid.startSelect) {
            //     Grid.startSelect = null;
            //     Session.set('menu.x', -1000);
            //     Session.set('menu.y', -1000);

            //     Squares.find({
            //         selected: true
            //     }, {
            //         transform: function(e) {
            //             Squares.update(e._id, {
            //                 $set: {
            //                     selected: false
            //                 }
            //             });
            //         }
            //     }).fetch();
            //     return;
            // }
        }
    });

    Template.menu.xpos = function() {
        // var offset = parseInt($('.main-container').css('margin-left'));

        return Session.get('menu.x') * 100;
    };

    Template.menu.ypos = function() {
        return Session.get('menu.y') * 100;
    };

    Template.menu.singleSelection = function() {
        return Session.get('singleSelection');
    }

    Template.menu.events = {
        'click .merge-button': function() {
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

        'click .text-button': function() {
            var original;

            if (Grid.startSelect.value !== undefined) {
                original = Grid.startSelect.value;
            } else {
                original = "";
            }

            bootbox.prompt('Input', 'Cancel', 'Save', function(input) {
            	if (input == null) {
            		return;
            	}
            	
                if (!isNaN(parseFloat(input)) && isFinite(input)) {
                    input = parseFloat(input)
                }

                Squares.update(Grid.startSelect._id, {
                    $set: {
                        value: input
                    }
                });

            }, original);
        },

        'click .function-button': function() {
            var original;

            if (Grid.startSelect.fn !== undefined) {
                original = Grid.startSelect.fn;
            } else {
                original = "var a = $(window).height()\nreturn a;";
            }

            bootbox.promptFn('Attach Javascript Function', 'Cancel', 'Save', function(statements) {
                if (statements == null) {
                    return;
                }

                //TODO
                //replace with cell reference

                var fn = new Function('$', statements);

                if (typeof fn == 'function') {
                    Squares.update(Grid.startSelect._id, {
                        $set: {
                            fn: statements,
                            value: fn($)
                        }
                    });
                } else {
                    alert('Invalid function');
                }

            }, original);
        },

        'click .delete-button': function() {
            Squares.update(Grid.startSelect._id, {
                $unset: {
                    value: 1,
                    fn: 1
                }
            });
        }
    };
}

if (Meteor.isServer) {
    Meteor.startup(function() {
        // Squares.remove({})

        // Initialize empty cells
        if (Squares.find().count() == 0) {
            for (var i = 0; i < 15; i++) {
                for (var j = 0; j < 10; j++) {
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
