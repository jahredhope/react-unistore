[![npm](https://img.shields.io/npm/v/react-unistore.svg)](https://www.npmjs.com/package/react-unistore)

# react-unistore

> A 778b connector between [React](https://github.com/facebook/react) and [unistore](https://github.com/developit/unistore).

- Easy to use [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- Strong [TypeScript](https://www.typescriptlang.org/docs/home.html) type safety
- [Redux](https://github.com/reduxjs/react-redux) like API
- Small footprint complements unistore nicely (350b + 778b)

[unistore](https://github.com/developit/unistore) already has great support for connecting with React by itself. However at time of writing it does not have support for [React Hooks](https://reactjs.org/docs/hooks-intro.html). This package aims to provide this capability, extending the API with something close to [Redux’s React Hooks API](https://github.com/reduxjs/react-redux).

## Install

```bash
$ yarn add unistore react-unistore
# OR
$ npm install --save unistore react-unistore
```

## API

### `Provider`

**Provider** exposes a store to context. Required for all other functions to work.

Generally an entire application is wrapped in a single `<Provider>` at the root.

```js
export default () => (
  <Provider value={store}>
    <App />
  </Provider>
);
```

### `useAction`

Used to bind an action to the store.

```js
const setUsername = useAction((state, username) => ({
  user: { ...state.user, username },
}));
```

### `useSelector`

Used to extract values from the store.

```js
const user = useSelector(state => state.user);
```

### `useStore`

Used to access the store itself. Where possible use `useAction` and `useSelector` rather than accessing the store directly.

```js
const store = useStore();
```

### `connect`

Pre-hooks method of connecting to the store. See [unistore docs](https://github.com/developit/unistore#connect) for full details.

## Usage (TypeScript)

Create your State. Whilst not necessary it can be helpful to wrap `useSelector` and `useAction` with your State:
**store.ts**

```ts
import {
  Provider,
  TypedUseAction,
  TypedUseSelector,
  useAction as _useAction,
  useSelector as _useSelector,
} from "react-unistore";

export interface State {
  user: {
    firstName?: string;
  };
}

export const useSelector: TypedUseSelector<State> = _useSelector;
export const useAction: TypedUseAction<State> = _useAction;

export { Provider };
```

**client.tsx**

```ts
import { createStore, Provider } from "react-unistore";

const initialState = {
  user: {},
};

const store = createStore(initialState);

ReactDOM.render(
  <Provider value={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
```

**ChildComponent.tsx**

```ts
import { useAction, useSelector } from "./store";

export default function ChildComponent() {
  const user = useSelector(state => state.user);
  const setFirstName = useAction((state, firstName: string) => ({
    user: { ...state, firstName },
  }));
  return (
    <div>
      <span>Hi {user.firstName || "you"}</span>
      <button onClick={() => setFirstName("Fred")}>Update</button>
    </div>
  );
}
```

## Migrating from unistore/react

If you are migrating from unistore/react to be able to use functionality available in this package you should find the API fully backwards compatiable^.
Simply change any imports from:

```js
import { Provider, connect } from "unistore/react";
```

To:

```js
import { Provider, connect } from "react-unistore";
```

^ With one exception. To align with the standard React Context API patterns the Provider must be passed as the 'value' prop.

```js
export default () => (
-  <Provider store={store}>
+  <Provider value={store}>
    <App />
  </Provider>
);
```

## Package Size of 778 Bytes

```
Raw File Size (ES6 version): 3.51 KiB
Raw File Size (ES5 version): 4.00 KiB
Minified + Gzip (ES6 version): 778 Bytes
Minified + Gzip (ES5 version): 864 Bytes
```
