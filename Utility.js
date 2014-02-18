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
