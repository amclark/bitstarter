//paper.install(window);
//window.onload = function() {
//paper.setup('canvas');
//var tool = new Tool();

(function () {

var CANVAS_OFFSET = new Point(200, 0);
var activeText;

$('#menu-btn-add-shape').click(createAddShapeDialog);
$('#menu-btn-add-text').click(function () {
    clearSelection();
    $('#text-form').val('');
    $('#add-text').removeClass('hidden');
    $('#text-form').focus();
    activeText = new PointText(new Point(300, 300));
    activeText.content = '   ';
    activeText.style = {fontSize: 20};
    activeText.strokeColor = 'black';
    activeText.sui_index = nextIndex;
    nextIndex++;
    select(activeText);
});
$('#text-form').keyup(function () {
    if (activeText) {
        console.log(group.bounds);
        activeText.content = $('#text-form').val() || '   ';
        resizeGroupBoundary();
        // this seems kind of hacky, is there a better way to get the text to refresh?
        view.draw();
    }
});
$('#btn-add-text-done').click(function () {
    $('#add-text').addClass('hidden');
    refreshMenu();
});
$('#menu-btn-group').click(groupUngroup);
$('#menu-btn-remove').click(remove);
$('#menu-btn-edit').click(function () {
    console.log(group.strokeColor);
});
$('#menu-btn-settings').click(function () {
    
});
$('#input-color').change(function () {
    group.strokeColor = $('#input-color').val();
});

var values = {
    paths: 50,
    minRadius: 30,
    maxRadius: 90
};

var hitOptions = {
    fill: true,
    tolerance: 5
};

var mode = 'edit';

var boundHitOptions = {
    bounds: true,
    tolerance: 20
};

createGrid();

function createGrid() {
    var w = view.size.width, h = view.size.height;
    var from = new Point(-w, -h), to = new Point(2*w, 2*h);
    var i;
    for (i = -w + 19.5; i < 2 * w; i += 20) {
        from.x = to.x = i;
        var path = new Path.Line(from, to);
        path.strokeColor = 'lightgray';
    }
    from.x = -w;
    to.x = 2 * w;
    for (i = -h + 19.5; i < 2 * h; i += 20) {
        from.y = to.y = i;
        var path = new Path.Line(from, to);
        path.strokeColor = 'lightgray';
    }
}

var path, resize, movePath, dragView, pinching,
    group = new Group({}),
    rect = null, prevDelta = {x: 0, y: 0},
    dialog = null, nextIndex = 0,
    zoom = 100, allItems = new Group({});

allItems.addChild(group);

function scale(s, pinchEvent) {
    var point = new Point(event.gesture.center.pageX, event.gesture.center.pageY);
    project.activeLayer.scale(s, s, point);
    zoom = zoom * s;
}

Hammer(view.element).on('pinchin', function(event) {
    path = resize = movePath = null;
    pinching = true;
    if (zoom > 30)
        scale(0.95, event);
}).on('pinchout', function(event) {
    path = resize = movePath = null;
    pinching = true;
    if (zoom < 300)
        scale(1.05, event);
}).on('dragstart', function(event) {
    if (pinching) return;

    var point = new Point(event.gesture.center.pageX, event.gesture.center.pageY) - CANVAS_OFFSET;
    if (dialog) {
        checkDialogGesture(point, 'dragstart');
        return;
    }

    var hitResult;
    if (group.children.length) {
        hitResult = rect.hitTest(point, boundHitOptions);
        if (hitResult) {
            if (hitResult.type === 'bounds' && hitResult.name.indexOf('center') === -1) {
                resize = hitResult.name;
            } else if (hitResult.type === 'fill') {
                movePath = true;
            }
            return;
        }
    }
    hitResult = project.hitTest(point, hitOptions);
    if (hitResult) {
        if (hitResult.type === 'fill') {
            select(hitResult.item);
            movePath = true;
        }
    } else {
        dragView = true;
    }
}).on('drag', function(event) {
    var point = new Point(event.gesture.center.pageX, event.gesture.center.pageY) - CANVAS_OFFSET;
    var delta = new Point(event.gesture.deltaX - prevDelta.x,
                          event.gesture.deltaY - prevDelta.y);

    if (movePath) {
        group.translate(delta);
        rect.translate(delta);
    }

    if (resize) {
        var dx = (resize.indexOf("left") !== -1 ? -1 : 1) * delta.x;
        var dy = (resize.indexOf("top") !== -1 ? -1 : 1) * delta.y;
        var center;
        if (resize === "bottom-left") {
            center = rect.bounds.topRight;
        } else if (resize === "top-left") {
            center = rect.bounds.bottomRight;
        } else if (resize === "top-right") {
            center = rect.bounds.bottomLeft;
        } else if (resize === "bottom-right") {
            center = rect.bounds.topLeft;
        }
        var hor = (rect.bounds.width + dx) / rect.bounds.width;
        var ver = (rect.bounds.height + dy) / rect.bounds.height;
        rect.scale(hor, ver, center);
        group.translate(rect.bounds.topLeft - group.bounds.topLeft + new Point(4, 4));
        group.scale((rect.bounds.width - 8) / group.bounds.width,
                    (rect.bounds.height - 8) / group.bounds.height,
                    group.bounds.topLeft);
    }

    if (dragView) {
        project.activeLayer.translate(delta);
    }
    prevDelta.x = event.gesture.deltaX;
    prevDelta.y = event.gesture.deltaY;
}).on('dragend', function(event) {
    movePath = resize = dragView = null;
    prevDelta.x = prevDelta.y = 0;
}).on('tap', function(event) {
    path = resize = movePath = dragView = null;
    var point = new Point(event.gesture.center.pageX, event.gesture.center.pageY) - CANVAS_OFFSET;
    var i;
    if (dialog) {
        checkDialogGesture(point, 'tap');
        return;
    }
    var hitResult = project.hitTest(point, hitOptions);
    if (hitResult) {
        if (hitResult.type === 'fill' && !hitResult.item.sui_menu) {
            select(hitResult.item);
        }
    } else if (group.children.length) {
        clearSelection();
    }
}).on('release', function(event) {
    pinching = null;
});

function groupUngroup() {
    if (group && group.children.length === 1 && group.children[0].sui_group) {
        // Ungroup
        group.addChildren(group.children[0].removeChildren());
        clearSelection();
    } else if (group && group.children.length >= 2) {
        // Group
        var newGroup = new Group(group.removeChildren());
        newGroup.sui_index = group.sui_index;
        newGroup.sui_group = true;
        group.addChild(newGroup);
        $('#menu-btn-group').text('Ungroup');
    }
}

function createAddShapeDialog() {
    if (dialog) return;
    clearSelection();
    createDialogGrid(new Point(100, 100), new Point(600, 600), 100);
    var shapes = [[new Path.Rectangle(new Point(110, 110), new Point(190, 190), 10), 0],
                  [new Path.Rectangle(new Point(210, 110), new Point(290, 190)), 0],
                  [new Path.Circle(new Point(350, 150), 40), 0],
                  [new Path.RegularPolygon(new Point(450, 160), 3, 45), 0],
                  [new Path.RegularPolygon(new Point(550, 153), 5, 40), 0],
                  [new Path.RegularPolygon(new Point(150, 250), 6, 40), 30],
                  [new Path.RegularPolygon(new Point(250, 250), 8, 40), 0],
                  // Ratio of inner radius to outer for 5 pt star, 1 : 0.5*(3+sqrt(5))
                  [new Path.Star(new Point(350, 250), 5, 15, 15*0.5*(3+Math.sqrt(5))), 36],
                  [new Path.Star(new Point(450, 250), 6, 25, 25*Math.sqrt(3)), 30]
                  ];
    for (i = 0; i < shapes.length; i++) {
        var shape = shapes[i][0], angle = shapes[i][1];
        shape.fillColor = '#ffffff';
        shape.strokeWidth = 2;
        shape.strokeColor = 'black';
        if (angle) {
            shape.rotate(angle);
        }
        shape.sui_handler = selectShape.bind(shape);
        dialog.addChild(shape);
    }
    refreshMenu();
}

function createDialogGrid(from, to, itemWidth) {
    var path = new Path.Rectangle(from, to, 10),
        fromX = from.x,
        toX = to.x,
        toY = to.y,
        i;
    path.fillColor = '#ffffff';
    path.strokeWidth = 2;
    path.strokeColor = 'green';
    path.sui_handler = closeDialog;
    dialog = new Group([path]);
    for (i = from.x + itemWidth - 0.5; i < toX; i += itemWidth) {
        from.x = to.x = i;
        var path = new Path.Line(from, to);
        path.strokeColor = 'green';
        dialog.addChild(path);
    }
    from.x = fromX;
    to.x = toX;
    for (i = from.y + itemWidth - 0.5; i < toY; i += itemWidth) {
        from.y = to.y = i;
        var path = new Path.Line(from, to);
        path.strokeColor = 'green';
        dialog.addChild(path);
    }
}

function checkDialogGesture(point, type) {
    var hitResult = dialog.hitTest(point, hitOptions);
    if (hitResult) {
        if (hitResult.item.sui_handler)
            hitResult.item.sui_handler(type);
        return true;
    }
    return false;
}

function selectShape(type) {
    this.sui_index = nextIndex;
    nextIndex += 1;
    select(this);
    closeDialog();
    if (type == 'dragstart')
        movePath = true;
}

function closeDialog() {
    dialog.remove();
    dialog = null;
    refreshMenu();
}

function menuTest(index, point) {
    return menuGroup.children[index].bounds.contains(point);
}

function select(item) {
    while (item.parent instanceof Group && item.parent.sui_group) {
        item = item.parent;
    }
    var index = group.children.length;
    for (var i = 0; i < group.children.length; i++) {
        if (group.children[i] === item) {
            return;
        } else if (i < index && group.children[i].sui_index > item.sui_index) {
            index = i;
        }
    }
    item.remove();
    group.matrix.set(1, 0, 0, 1, 0, 0);  // somehow this can still be set from the last drag
    group.insertChild(index, item);
    group.sui_index = group.children[0].sui_index;
    group.remove();
    index = allItems.children.length;
    for (var i = 0; i < allItems.children.length; i++) {
        if (allItems.children[i].sui_index > group.sui_index) {
            index = i;
            break;
        }
    }
    allItems.insertChild(index, group);
    resizeGroupBoundary();
    item.strokeColor = 'blue';
    refreshMenu();
}

function resizeGroupBoundary() {
    if (!rect) {
        rect = new Path.Rectangle(group.bounds);
        rect.insertAbove(group);
    }
    rect.translate(group.bounds.topLeft - rect.bounds.topLeft - new Point(4, 4));
    rect.scale((group.bounds.width + 8) / rect.bounds.width,
               (group.bounds.height + 8) / rect.bounds.height,
               rect.bounds.topLeft);
    rect.strokeColor = 'red';
    rect.selected = true;
}

function refreshMenu() {
    console.log(group);
    if (dialog) {
        $('button[id^="menu"]').attr('disabled', 'disabled');
        return;
    }
    if (!$('#add-text').hasClass('hidden')) {
        if (group.children.length === 1 && group.children[0] === activeText) {
            $('button[id^="menu"]').attr('disabled', 'disabled');
            return;
        } else {
            $('#add-text').addClass('hidden');
        }
    }
    $('#menu-btn-add-shape,#menu-btn-add-text').removeAttr('disabled');
    if (!group.children.length) {
        $('#menu-btn-group,#menu-btn-remove,#menu-btn-edit').attr('disabled', 'disabled');
        $('#menu-btn-group').text('Group');
    } else {
        $('#menu-btn-remove,#menu-btn-edit').removeAttr('disabled');
        var $btn = $('#menu-btn-group');
        if (group.children.length === 1 && !group.children[0].sui_group) {
            $btn.attr('disabled', 'disabled');
            $btn.text('Group')
        } else {
            $btn.removeAttr('disabled');
            $btn.text(group.children.length === 1 ? 'Ungroup' : 'Group');
        }
    }
}

function clearSelection() {
    var items = group.removeChildren();
    group.bringToFront();
    var allIndex = 0;
    for (var i = 0; i < items.length; i++) {
        while (allItems.children[allIndex] && allItems.children[allIndex].sui_index < items[i].sui_index) {
            allIndex += 1;
        }
        allItems.insertChild(allIndex, items[i]);
        allIndex += 1;
        items[i].strokeColor = 'black';
    }
    if (rect)
        rect.remove()
    rect = null;
    refreshMenu();
}

function remove() {
    group.removeChildren();
    clearSelection();
}

// Prevent dragging to cause scrolling on touch devices
document.body.addEventListener('touchmove', function(event){
    event.preventDefault();
}, false);

//tool.onMouseDrag = onMouseDrag;
//
//}
})();