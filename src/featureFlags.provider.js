function FeatureFlags($q, featureFlagOverrides, initialFlags) {
    var serverFlagCache = {},
        flags = [],

        resolve = function(val) {
            var deferred = $q.defer();
            deferred.resolve(val);
            return deferred.promise;
        },

        isOverridden = function(key) {
            return featureFlagOverrides.isPresent(key);
        },

        isOn = function(key) {
            if (!serverFlagCache.hasOwnProperty(key)) {
                return false;
            }

            return serverFlagCache[key].overridable && isOverridden(key) ? featureFlagOverrides.get(key) === 'true' : serverFlagCache[key].active;
        },

        isOnByDefault = function(key) {
            if (!serverFlagCache.hasOwnProperty(key)) {
                return false;
            }

            return serverFlagCache[key].active;
        },

        updateFlagsAndGetAll = function(newFlags) {
            newFlags.forEach(function(flag) {
                serverFlagCache[flag.key] = {
                    active: flag.active,
                    overridable: flag.overridable
                };
                flag.active = isOn(flag.key);
            });
            angular.copy(newFlags, flags);

            return flags;
        },

        updateFlagsWithPromise = function(promise) {
            return promise.then(function(value) {
                return updateFlagsAndGetAll(value.data || value);
            });
        },

        get = function() {
            return flags;
        },

        set = function(newFlags) {
            return angular.isArray(newFlags) ? resolve(updateFlagsAndGetAll(newFlags)) : updateFlagsWithPromise(newFlags);
        },

        enable = function(flag) {
            flag.active = true;
            featureFlagOverrides.set(flag.key, true);
        },

        disable = function(flag) {
            flag.active = false;
            featureFlagOverrides.set(flag.key, false);
        },

        reset = function(flag) {
            flag.active = serverFlagCache[flag.key].active;
            featureFlagOverrides.remove(flag.key);
        },

        init = function() {
            if (initialFlags) {
                set(initialFlags);
            }
        };
    init();

    return {
        set: set,
        get: get,
        enable: enable,
        disable: disable,
        reset: reset,
        isOn: isOn,
        isOnByDefault: isOnByDefault,
        isOverridden: isOverridden
    };
}

angular.module('feature-flags').provider('featureFlags', function() {
    var initialFlags = [];

    this.setInitialFlags = function(flags) {
        initialFlags = flags;
    };

    this.$get = function($q, featureFlagOverrides) {
        return new FeatureFlags($q, featureFlagOverrides, initialFlags);
    };
});
