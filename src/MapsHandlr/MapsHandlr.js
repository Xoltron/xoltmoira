/**
 * 
 */
function MapsHandlr(settings) {
    "use strict";
    if (!this || this === window) {
        return new MapsCreatr(settings);
    }
    var self = this,
        
        // MapsCreatr container for maps from which this obtains Thing settings
        MapsCreator,
        
        // MapScreenr container for map attributes, such as "floor" or "setting"
        MapScreener,
        
        // An Array of strings representing the names of attributes to be copied
        // to the MapScreener during self.setLocation
        screenAttributes,
        
        // The currently referenced map from MapsCreator, set by self.setMap
        mapCurrent, 
        
        // The currently referenced area in a map, set by self.setLocation
        areaCurrent,
        
        // The currently referenced location in an area, set by self.setLocation
        locationCurrent,
        
        // The name of the currently edited map, set by self.setMap
        mapName,
        
        // The current area's array of prethings that are to be added in order
        // during self.spawnMap
        prethings,
        
        // When a prething is to be spawned, this function should spawn it
        onSpawn,
        
        // When a prething is to be unspawned, this function should unspawn it
        onUnspawn,
        
        // Optionally, an array of Things to stretch across the map horizontally
        stretches,
        
        // If stretches exists, the function to call to add one to the map
        stretchAdd,
        
        // If stretches exists, the function to call to stretch horizontally
        onStretch,
        
        // Optionally, an array of Things to place at the end of the map
        afters,
        
        // If afters exists, the function to call to add one to the map
        afterAdd,
        
        // If afters exists, the function to call to stretch horizontally
        on_after,
        
        // Directional equivalents for converting from directions to keys
        directionKeys = {
            "xInc": "left",
            "xDec": "right",
            "yInc": "top",
            "yDec": "bottom"
        },
        
        // Opposite directions for when finding descending order Arrays
        directionOpposites = {
            "xInc": "xDec",
            "xDec": "xInc",
            "yInc": "yDec",
            "yDec": "yInc"
        };
    
    /**
     * 
     */
    self.reset = function (settings) {
        // Maps themselves should have been created in the MapsCreator object
        if (!settings.MapsCreator) {
            throw new Error("No MapsCreator provided to MapsHandlr.");
        }
        MapsCreator = settings.MapsCreator;
        
        // Map/Area attributes will need to be stored in a MapScreenr object
        if (!settings.MapScreener) {
            throw new Error("No MapScreener provided to MapsHandlr.");
        }
        MapScreener = settings.MapScreener;
        
        screenAttributes = settings.screenAttributes || [];
        
        onSpawn = settings.onSpawn;
        onUnspawn = settings.onUnspawn;
        
        stretchAdd = settings.stretchAdd;
        onStretch = settings.onStretch;
        
        afterAdd = settings.afterAdd;
        on_after = settings.on_after;
    };
    
    
    /* Simple gets
    */
    
    /**
     * Simple getter for the MapsCreatr object that makes the actual maps.
     * 
     * @return {MapsCreatr}
     */
    self.getMapsCreator = function () {
        return MapsCreator;
    };
    
    /**
     * Simple getter for the MapScreenr object where attributes are copied.
     * 
     * @return {MapScreenr}
     */
    self.getMapScreener = function () {
        return MapScreener;
    };
    
    /**
     * Simple getter for the Array of attribute names copied to the MapScreener.
     */
    self.getScreenAttributes = function () {
        return screenAttributes;
    };
    
    /**
     * Simple getter for the key by which the current map is located in 
     * the MapCreatr. This is typically a String.
     *
     * @return {Mixed}
     */
    self.getMapName = function () {
        return mapName;
    };
    
    /** 
     * Gets the map listed under the given name. If no name is provided, the
     * mapCurrent is returned instead.
     * 
     * @param {Mixed} [name]   An optional key to find the map under. This will
     *                         typically be a String.
     * @return {Map}
     */
    self.getMap = function (name) {
        if (typeof name !== "undefined") {
            return MapsCreator.getMap(name);
        } else {
            return mapCurrent;
        }
    };
    
    /**
     * Simple getter pipe to the internal MapsCreator.getMaps() function.
     * 
     * @return {Object}   An associative array of maps, keyed by their names.
     */
    self.getMaps = function () {
        return MapsCreator.getMaps();
    };
    
    /**
     * Simple getter function for the areaCurrent object.
     * 
     * @return {Object} The current area object, included area attributes.
     */
    self.getArea = function () {
        return areaCurrent;
    };
    
    /**
     * Simple getter function for a location within the current area's map.
     * 
     * @reutrn {Object} The request location object.
     */
    self.getLocation = function (location) {
        return areaCurrent.map.locations[location];
    }
    
    /**
     * Simple getter function for the internal prethings object. This will be
     * null before the first self.setMap.
     * 
     * return {Prething[]}   An array of the current area's Prethings.
     */
    self.getPreThings = function () {
        return prethings;
    }
    
    
    /* Map / location setting
    */
    
    /**
     * Sets the currently manipulated map in the handler to be the one under a
     * given name. Note that this will do very little unless a location is 
     * provided (this is by design - an EightBitter using this should set them
     * manually).
     * 
     * @param {Mixed} name   A key to find the map under. This will typically be
     *                       a String.
     * @param {Number} [location]   An optional number for a location to
     *                              immediately start the map in. 
     *                          
     */
    self.setMap = function (name, location) {
        // Get the newly current map from self.getMap normally
        mapCurrent = self.getMap(name);
        if (!mapCurrent) {
            throw new Error("No map found under: " + name);
        }
        
        mapName = name;
        
        // Most of the work is done by setLocation (by default, the map's first)
        if (arguments.length > 1) {
            self.setLocation(location);
        }
        
        return mapCurrent;
    };
    
    /**
     * Goes to a particular location in the given map. This is the primary,
     * meaty function for resetting attributes in the MapScreenr.
     * 
     * @param [mixed] location_number   The number of the location to start in.
     */
    self.setLocation = function (name) {
        var location, attribute, len, i;

        // Query the location from the current map and ensure it exists
        location = mapCurrent.locations[name];
        if (!location) {
            throw new Error("Unknown location given: " + name);
        }
        
        // Since the location is valid, mark it as current (with its area)
        locationCurrent = location;
        areaCurrent = location.area;
        
        // Copy all the settings from that area into the MapScreenr container
        for (i = 0, len = screenAttributes.length; i < len; i += 1) {
            attribute = screenAttributes[i];
            MapScreener[attribute] = areaCurrent[attribute];
        }
        
        // Reset the prethings object, enabling it to be used as a fresh start
        // for the new Area/Location placements
        prethings = MapsCreator.getPreThings(location);
        
        if (areaCurrent.stretches) {
            setStretches(areaCurrent.stretches);
        } else {
            stretches = undefined;
        }
        
        if (areaCurrent.afters) {
            setAfters(areaCurrent.afters);
        } else {
            afters = undefined;
        }
    };
    
    /**
     * 
     */
    function setStretches(stretchesRaw) {
        if (stretchesRaw) {
            stretches = stretchesRaw.map(stretchAdd);
        } else {
            stretches = [];
        }
    }
    
    /**
     * 
     */
    function setAfters(aftersRaw) {
        if (aftersRaw) {
            afters = aftersRaw.map(afterAdd);
        } else {
            afters = [];
        }
    }
    
    /**
     * 
     * 
     * 
     */
    self.spawnMap = function (direction, top, right, bottom, left) {
        applySpawnAction(onSpawn, true, direction, top, right, bottom, left);
    };
    
    /**
     * 
     * 
     * 
     */
    self.unspawnMap = function (direction, top, right, bottom, left) {
        applySpawnAction(onUnspawn, false, direction, top, right, bottom, left);
    };
    
    /**
     *
     *
     *
     * @param {Function} [callback]   The callback to be run whenever a 
     *                                matching PreThing is found.
     * @param {Boolean} status   The spawn status to match PreThings against.
     *                           Only PreThings with .spawned === status will 
     *                           have the callback applied to them.
     *
     *
     * @todo This will almost certainly present problems when different 
     *       directions are used. For Pokemon/Zelda style games, the system
     *       will probably need to be adapted to use a Quadrants approach
     *       instead of plain Arrays.
     */
    function applySpawnAction(callback, status, direction, top, right, bottom, left) {
        var name, group, mid, start, end, i, prething;
        
        // For each group of PreThings currently able to spawn...
        for (name in prethings) {
            if (!prethings.hasOwnProperty(name)) {
                continue;
            }
            
            // Don't bother trying to spawn the group if it has no members
            group = prethings[name][direction];
            if (group.length === 0) {
                continue;
            }
            
            // Find the start and end points within the PreThings Array
            // Ex. if direction="xInc", go from .left >= left to .left <= right
            mid = (group.length / 2) | 0;
            start = findPreThingsSpawnStart(direction, group, mid, top, right, bottom, left);
            end = findPreThingsSpawnEnd(direction, group, mid, top, right, bottom, left);
            
            // Loop through all the directionally valid PreThings, spawning if 
            // they're within the bounding box
            for (i = start; i <= end; i += 1) {
                prething = group[i];
                
                // This will have to be made relative to work for Pokemon/Zelda games...
                // if (
                    // prething.top > bottom
                    // || prething.right < left
                    // || prething.bottom < top
                    // || prething.left > right
                // ) {
                    // continue;
                // }
                
                // For example: if status is true (spawned), don't spawn again
                if (prething.spawned !== status) {
                    prething.spawned = status;
                    if (callback) {
                        callback(prething);
                    }
                }
            }
        }
    }
    
    
    /**
     * Warning: very inefficient! Should switch to binary search.
     */
    function findPreThingsSpawnStart(direction, group, i, top, right, bottom, left) {
        var directionKey = directionKeys[direction],
            directionEnd = getDirectionEnd(directionKey, top, right, bottom, left);
        
        for (var i = 0; i < group.length; i += 1) {
            if (group[i][directionKey] >= directionEnd) {
                return i;
            }
        }
        
        return i;
    }
    
    /**
     * Warning: very inefficient! Should switch to binary search.
     */
    function findPreThingsSpawnEnd(direction, group, i, top, right, bottom, left) {
        var directionKey = directionKeys[direction],
            directionKeyOpposite = directionKeys[directionOpposites[direction]],
            directionEnd = getDirectionEnd(directionKeyOpposite, top, right, bottom, left),
            i;
        
        for (i = group.length - 1; i >= 0; i -= 1) {
            if (group[i][directionKey] <= directionEnd) {
                return i;
            }
        }
        
        return i;
    }
    
    /**
     * 
     */
    function getDirectionEnd(directionKey, top, right, bottom, left) {
        switch (directionKey) {
            case "top": 
                return top;
            case "right":
                return right;
            case "bottom":
                return bottom;
            case "left":
                return left;
        }
    }
    
    
    self.reset(settings || {});
}