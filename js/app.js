var map,
    mapOptions     = {},
    polyline       = {},
    path           = [],
    segments       = [],
    markers        = [],
    service        = new google.maps.DirectionsService(),
    ERROR_STATUSES = [
        {
            constant    : "INVALID_REQUEST",
            description : "The DirectionsRequest provided was invalid.",
            remedy      : "Email ruthie@cyclingcoder.com."
        },
        {
            constant    : "MAX_WAYPOINTS_EXCEEDED",
            description : "Too many DirectionsWaypoints were provided in the DirectionsRequest. The total allowed waypoints is 8, plus the origin and destination. Maps API for Business customers are allowed 23 waypoints, plus the origin, and destination.",
            remedy      : "Email ruthie@cyclingcoder.com."
        },
        {
            constant    : "NOT_FOUND",
            description : "At least one of the origin, destination, or waypoints could not be geocoded.",
            remedy      : "Email ruthie@cyclingcoder.com."
        },
        {
            constant    : "OVER_QUERY_LIMIT",
            description : "The webpage has gone over the requests limit in too short a period of time.",
            remedy      : "Email ruthie@cyclingcoder.com."
        },
        {
            constant    : "REQUEST_DENIED",
            description : "The webpage is not allowed to use the directions service.",
            remedy      : "Email ruthie@cyclingcoder.com."
        },
        {
            constant    : "UNKNOWN_ERROR",
            description : "A directions request could not be processed due to a server error. The request may succeed if you try again.",
            remedy      : "Email ruthie@cyclingcoder.com."
        },
        {
            constant    : "ZERO_RESULTS",
            description : "No route could be found between the origin and destination.",
            remedy      : "Try not crossing over country boundaries."
        }
    ];

/**
 * ROUTE METHODS
 * {method} createRoute
 * {method} destroyRoute
 * {method} extendRoute
 * {method} curtailRoute
 */

function createRoute(event) {

    console.log('== CREATE ROUTE ==');

    var location = event.latLng,
        origin   = _createMarker(location);

    // Set the clicked location, the path's origin, to be the first point.
    path.push(location);

    // Create the polyline and draw the path.
    polyline = new google.maps.Polyline({ map: map });
    polyline.setPath(path);
}

function destroyRoute() {

    console.log('== DESTROY ROUTE ==');

    if (polyline.setPath !== undefined) {
        path = [];
        polyline.setPath(path);
    }

    // Remove the markers and underlying marker data.
    for (var i = markers.length - 1; i >= 0; i--) {
        _destroyMarker(i);
    }
}

function extendRoute(event) {

    console.log('== EXTEND ROUTE ==');

    // Calculate directions between the previous point and the current point.
    service.route({

        origin:      path[path.length - 1],

        destination: event.latLng,

        travelMode:  google.maps.DirectionsTravelMode.BICYCLING

    }, function(result, status) {

        if (status === "OK") {

            _addSegment(result);

        } else {

            for (var s = 0, slen = ERROR_STATUSES.length; s < slen; s++) {
                if (status === ERROR_STATUSES[s]['constant']) {
                    throwError(ERROR_STATUSES[s], result);
                    return;
                }
            }
        }
    });
}

function curtailRoute(event) {

    console.log('== CURTAIL ROUTE ==');

    _removeSegment();
}

/**
 * SEGMENT METHODS
 * {method} _addSegment
 * {method} _removeSegment
 */

function _addSegment(result) {

    console.log('== _addSegment() ==');

    var segment = result.routes[0].overview_path        || [],
        seg_pts = result.routes[0].overview_path.length || 0;

    // If the path contains more than one point, erase the old final point's marker.
    if (path.length > 1) {
        _eraseMarker(markers.length - 1);
    }

    segments.push(seg_pts);

    // Add this segment's points to the path array.
    path = path.concat(segment);

    // Place a marker at the new final point.
    _createMarker(path[path.length - 1]);

    // Redraw the path.
    polyline.setPath(path);
}

function _removeSegment() {

    console.log('== _removeSegment() ==');
 
    var pointsToRemove = segments[segments.length - 1];

    // If no segments to remove, reset the route.
    if (segments.length === 0) {

        destroyRoute();

    } else {

        // Destroy the last marker in the marker's array
        _destroyMarker(markers.length - 1);

        // Remove the last (segment's number of) items from the path array
        path.splice(-pointsToRemove, pointsToRemove);

        // Draw the marker at the new last point.
        _drawMarker(markers.length - 1);

        // Redraw the path.
        polyline.setPath(path);

        // Remove the last item in the segment array.
        segments.splice(-1, 1);
    }
}

/**
 * MARKER METHODS
 * {method} _createMarker
 * {method} _destroyMarker
 * {method} _drawMarker
 * {method} _eraseMarker
 */

function _createMarker(location) {

    console.log('== _createMarker() ==');

    // Draw a marker at the provided location.
    var marker = new google.maps.Marker({
            position: location,
            map: map
        });

    markers.push(marker);
}

function _destroyMarker(index) {

    console.log('== _destroyMarker() ==');

    // Erase this marker from the map.
    _eraseMarker(index);

    console.log('how many markers?',markers.length);

    // Remove this marker's data from the markers array.
    markers.splice(index, 1);

    console.log('how many markers?',markers.length);
}

function _drawMarker(index) {

    console.log('== _drawMarker() ==');

    markers[index].setMap(map);
}

function _eraseMarker(index) {

    console.log('== _eraseMarker() ==');

    markers[index].setMap();
}


/**
 * ERROR METHOD
 */

function throwError(status, result) {

    console.log('[DayTrip] ERROR.');
    console.log('|  type  |', status['constant']);
    console.log('|  desc  |', status['description']);
    console.log('| remedy |', status['remedy']);
    // console.log('debug result object from google', result);
}


/**
 * init()
 */

function init() {

    console.log('== INIT ==');

    // Set map options
    mapOptions = {
        center:    new google.maps.LatLng(40.25275, -108.64038),
        zoom:      15,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    // Assign map to HTML element
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

    // Kick off controls
    controls();

    // On click
    google.maps.event.addListener(map, "click", function(event) {

        if (path.length == 0) {
            createRoute(event);
        } else {
            extendRoute(event);
        }

    });
}


/**
 * controls()
 */

function controls() {

    var $resetBtn = $('#control-reset'),
        $undoBtn  = $('#control-undo');

    $resetBtn.on('click', function(event) {
        destroyRoute();
    });

    $undoBtn.on('click', function(event) {
        curtailRoute();
    });

}

// Kickoff
google.maps.event.addDomListener(window, 'load', init);