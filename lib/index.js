"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
const mobx_1 = require("mobx");
const shallowEqual_1 = require("recompose/shallowEqual");
const redux_scoop_1 = require("redux-scoop");
const instance_1 = require("redux-scoop/lib/instance");
function createObjectFromPseudoNamedConstructor(name) {
    function ObservableObject() { }
    const object = new ObservableObject();
    object.constructor = { name };
    return object;
}
exports.observable = (target, name, ...others) => {
    if (typeof target == 'function' || others.filter(other => other != null).length > 0)
        throw new Error("`observable` decorator can only be applied to instance property");
    const descriptor = redux_scoop_1.field(target, name);
    const observableObjects = new WeakMap();
    function get() {
        if (!observableObjects.has(this)) {
            const observableObject = mobx_1.extendShallowObservable(createObjectFromPseudoNamedConstructor(target.constructor.name), { [name]: descriptor.get.call(this) });
            instance_1.default.get(this).onFieldValue(name, value => {
                if (!shallowEqual_1.default(observableObject[name], value))
                    observableObject[name] = value;
            });
            observableObjects.set(this, observableObject);
        }
        return observableObjects.get(this)[name];
    }
    return __assign({}, descriptor, { get });
};
