import { extendShallowObservable } from 'mobx';
import shallowEqual from 'recompose/shallowEqual';
import { field } from 'redux-scoop';
// TODO(tim): Expose publicly at top level? Or expose function that uses
// `Instance` instead?
import Instance from 'redux-scoop/lib/instance';

// TODO(tim): Oh mi gado this is insanity.
function createObjectFromPseudoNamedConstructor(name) {
  function ObservableObject() {}
  // We can get MobX to give an observable object a name (other than
  // `ObservableObject`) if it is extended from a non-plain object…
  const object = new ObservableObject();
  // … which appears to be created from a constructor function with a name.
  object.constructor = { name };
  return object;
}

export const observable: PropertyDecorator = <T>(target, name: string, ...others): TypedPropertyDescriptor<T> => {
  if (typeof target == 'function' || others.filter(other => other != null).length > 0)
    throw new Error("`observable` decorator can only be applied to instance property");
  
  const descriptor = (field as Function)(target, name);

  const observableObjects: WeakMap<Object, any> = new WeakMap();

  function get(): T {
    if (!observableObjects.has(this)) {
      // Create an observable object with a single property, named after this
      // decorated property and its host object, such that this property is
      // presented intuitively in MobX dev tool's dependency tree (and any other
      // tool that somehow displays the name of the observable object and its
      // property).
      const observableObject = extendShallowObservable(
        createObjectFromPseudoNamedConstructor(target.constructor.name),
        { [name]: descriptor.get.call(this) }
      );
      Instance.get(this).onFieldValue(name, value => {
        // TODO(tim): This check should not be necessary if instance fields
        // were always guaranteed to be up-to-date with the latest value.
        if (!shallowEqual(observableObject[name], value))
          observableObject[name] = value;
      });
      observableObjects.set(this, observableObject);
    }
    return observableObjects.get(this)[name];
  }

  return { ...descriptor, get };
}
