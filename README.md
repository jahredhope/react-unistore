# react-unistore

Connects [unistore](https://github.com/developit/unistore) to [React](https://github.com/facebook/react)

- Full TypeScript support
- [Redux](https://github.com/reduxjs/react-redux) like API

## Install

```bash
$ yarn add react-unistore
# OR
$ npm install --save react-unistore
```

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
      <span>Hi {user.firstName || "you"},</span>
      <button onClick={() => setFirstName("Fred")}>Update</button>
    </div>
  );
}
```
