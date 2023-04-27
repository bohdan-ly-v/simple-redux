function deepFreeze(o) {
  Object.freeze(o);

  Object.keys(o).forEach((key) => {
    if (
      o.hasOwnProperty(key) &&
      o[key] !== null &&
      (typeof o[key] === 'object' || typeof o[key] === 'function') &&
      !Object.isFrozen(o[key])
    ) {
      deepFreeze(o[key]);
    }
  });

  return o;
}

const redux = (() => {
  const observers = {};
  let store = {};
  let isDispatching = false;

  const once = (fn) => {
    let result;

    return function () {
      if (fn) {
        result = fn.apply(this, arguments);
        fn = null;
      }
      return result;
    };
  };

  function createStore(initialStore = {}) {
    if (!(this instanceof createStore)) return new createStore(initialStore);

    store = initialStore;

    return {
      dispatch,
      subscribe,
      getState,
      unsubscribe,
    };
  }

  const getState = () => {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the dispatch is executing.',
      );
    }
    return store;
  };

  const dispatch = ({ type, payload }) => {
    try {
      isDispatching = true;

      if (!observers.hasOwnProperty(type)) {
        console.error(`Event "${type}" does not exists`);
        return false;
      }

      store = { ...store, ...payload };

      [...observers[type]].forEach((callback) => {
        callback(deepFreeze(store));

        // if (dep.length == 0) {
        //   callback(deepFreeze(store));
        // } else {
        //   const derivedStore = {};

        //   dep.forEach((k) => {
        //     if (store.hasOwnProperty(k)) derivedStore[k] = store[k];
        //   });

        //   callback(derivedStore);
        // }
      });
    } finally {
      isDispatching = false;
    }

    return true;
  };

  const subscribe = ({ type, callback, dep = [] }) => {
    if (!observers.hasOwnProperty(type)) observers[type] = new Set();

    observers[type].add(callback);

    return callback;
  };

  const unsubscribe = ({ type, unsubscribeId }) => {
    if (!observers.hasOwnProperty(type)) return;

    if (observers[type].has(unsubscribeId)) {
      observers[type].delete(unsubscribeId);
    }

    return true;
  };

  return {
    createStore: once(createStore),
  };
})();

const store = redux.createStore({
  username: 'John',
  age: 23,
});
console.log(store.getState());

const unsubscribeId = store.subscribe({
  type: 'SET_AGE',
  callback: (state) => {
    console.log(state);
  },
});

store.dispatch({
  type: 'SET_AGE',
  payload: { age: 25 },
});

store.unsubscribe({
  type: 'SET_AGE',
  unsubscribeId,
});

store.dispatch({
  type: 'SET_AGE',
  payload: { age: 27 },
});
