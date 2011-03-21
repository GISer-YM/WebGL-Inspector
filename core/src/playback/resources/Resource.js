(function () {
    var resources = glinamespace("gli.playback.resources");

    var Resource = function Resource(session, source) {
        this.id = source.id;
        this.type = source.type;
        this.update(source);

        this.versions = [];
    };

    Resource.prototype.update = function update(source) {
        this.alive = source.alive;
        this.creationStack = source.creationStack;
        this.deletionStack = source.deletionStack;
        this.displayName = source.displayName;
    };

    Resource.prototype.getName = function getName() {
        if (this.displayName) {
            return this.displayName;
        } else {
            return this.type + " " + this.id;
        }
    };

    Resource.prototype.setName = function setName(name, ifNeeded) {
        if (ifNeeded && this.displayName) {
            return;
        }
        this.displayName = name;
    };

    Resource.prototype.getVersion = function getVersion(versionNumber) {
        for (var n = 0; n < this.versions.length; n++) {
            var version = this.versions[n];
            if (version.versionNumber === versionNumber) {
                return version;
            }
        }
        return version;
    }

    Resource.prototype.createTarget = function createTarget(pool, version, valueHost) {
        var gl = pool.gl;
        var options = pool.options;
        var mutators = pool.mutators;

        // TODO: cache?
        var preHandlers = [];
        var postHandlers = [];
        var callHandlers = [];
        for (var n = 0; n < mutators.length; n++) {
            var mutator = mutators[n];
            var handlers = mutator.resourceHandlers[this.type];
            if (handlers) {
                for (var m = 0; m < handlers.length; m++) {
                    if (handlers[m].pre) {
                        preHandlers.push(handlers[m].pre);
                    }
                    if (handlers[m].post) {
                        postHandlers.push(handlers[m].post);
                    }
                    if (handlers[m].call) {
                        callHandlers.push(handlers[m].call);
                    }
                }
            }
        }

        for (var n = 0; n < preHandlers.length; n++) {
            var handler = preHandlers[n];
            version = handler(pool, version);
        }

        var result = this.createTargetValue(gl, options, version);
        valueHost.value = result;
        
        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            for (var m = 0; m < callHandlers.length; m++) {
                var handler = callHandlers[m];
                call = handler(pool, call);
            }

            call.issue(pool);
        }

        for (var n = postHandlers.length - 1; n >= 0; n--) {
            var handler = postHandlers[n];
            handler(pool, version, result);
        }

        return result;
    };

    Resource.prototype.deleteTarget = function deleteTarget(pool, value) {
        var gl = pool.gl;
        this.deleteTargetValue(gl, value);
    };

    resources.Resource = Resource;

})();
