import {
  Component,
  createContext,
  createElement,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { Action, Listener, StateMapper, Store } from "unistore";

export function mapActions(
  actions: Action<any>[] | ((store: Store<any>) => Action<any>[]),
  store: Store<any>
) {
  if (typeof actions === "function") {
    actions = actions(store);
  }
  const mapped: Record<any, any> = {};
  for (const i in actions) {
    mapped[i] = store.action(actions[i]);
  }
  return mapped;
}

export function select(properties: string | string[]) {
  if (typeof properties === "string") {
    properties = properties.split(/\s*,\s*/);
  }
  return (state: any) => {
    const selected: Record<any, any> = {};
    for (let i = 0; i < properties.length; i++) {
      selected[properties[i]] = state[properties[i]];
    }
    return selected;
  };
}

const UnistoreContext = createContext<Store<any>>(null);

export const Provider = UnistoreContext.Provider;

export const useStore = () => {
  const store = useContext(UnistoreContext);
  if (!store) {
    throw new Error("Missing context. Ensure you've rendered a Provider.");
  }
  return store;
};

export type UseAction = <State, Args extends any[]>(
  action: (
    state: State,
    ...args: Args
  ) => Promise<Partial<State>> | Partial<State> | void
) => (...args: Args) => void;

/**
 * Used to add state definition to useAction
 * e.g.
 * export const useAction: TypedUseAction<State> = _useAction;
 */
export type TypedUseAction<State> = <Args extends any[]>(
  action: (
    state: State,
    ...args: Args
  ) => Promise<Partial<State>> | Partial<State> | void
) => (...args: Args) => void;

export const useAction = <State, Args extends any[]>(
  action: (
    state: State,
    ...args: Args
  ) => Promise<Partial<State>> | Partial<State> | void
): ((...args: Args) => void) => useStore().action(action);

export type UseSelector<State, Selected> = (
  selector: (state: State) => Selected
) => Selected;

/**
 * Used to add state definition to useSelector
 * e.g.
 * export const useSelector: TypedUseSelector<State> = _useSelector;
 */
export type TypedUseSelector<State> = <Selected>(
  selector: (state: State) => Selected
) => Selected;

type EqualityFn = (a: any, b: any) => any;

export const useSelector = <State, Selected>(
  selector: (state: State) => Selected,
  equalityFn?: EqualityFn
): Selected => {
  const store = useStore();

  // Allow store subscriptions to force render updates
  // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const resultRef = useRef(null);

  resultRef.current = selector(store.getState());

  useEffect(() => {
    const listener: Listener<any> = state => {
      const result = selector(state);
      if (
        equalityFn
          ? !equalityFn(resultRef.current, result)
          : resultRef.current !== result
      ) {
        forceUpdate({});
      }
    };
    store.subscribe(listener);
    return () => {
      store.unsubscribe(listener);
    };
  }, []);

  return resultRef.current;
};

/** Wire a component up to the store. Passes state as props, re-renders on change.
 *  @param {Function|Array|String} mapStateToProps  A function mapping of store state to prop values, or an array/CSV of properties to map.
 *  @param {Function|Object} [actions] 				Action functions (pure state mappings), or a factory returning them. Every action function gets current state as the first parameter and any other params next
 *  @returns {Component} ConnectedComponent
 *  @example
 *    const Foo = connect('foo,bar')( ({ foo, bar }) => <div /> )
 *  @example
 *    const actions = { someAction }
 *    const Foo = connect('foo,bar', actions)( ({ foo, bar, someAction }) => <div /> )
 *  @example
 *    @connect( state => ({ foo: state.foo, bar: state.bar }) )
 *    export class Foo { render({ foo, bar }) { } }
 */
export function connect<State, Props, Selected>(
  mapStateToProps?: StateMapper<Props, State, Selected>,
  actions?: Action<State>[]
) {
  if (typeof mapStateToProps !== "function") {
    // @ts-ignore
    mapStateToProps = select(mapStateToProps || []);
  }
  return (Child: any) => {
    function Wrapper(props: Props, context: any) {
      Component.call(this, props, context);
      const store = context;
      let state = mapStateToProps(store ? store.getState() : {}, props);
      const boundActions = actions ? mapActions(actions, store) : { store };
      const update = () => {
        const mapped = mapStateToProps(store ? store.getState() : {}, props);
        for (const i in mapped) {
          if (mapped[i] !== state[i]) {
            state = mapped;
            return this.forceUpdate();
          }
        }
        for (const i in state) {
          if (!(i in mapped)) {
            state = mapped;
            return this.forceUpdate();
          }
        }
      };
      this.UNSAFE_componentWillReceiveProps = (p: Props) => {
        props = p;
        update();
      };
      this.componentDidMount = () => {
        store.subscribe(update);
      };
      this.componentWillUnmount = () => {
        store.unsubscribe(update);
      };
      this.render = () =>
        createElement(Child, { ...boundActions, ...this.props, ...state });
    }
    Wrapper.contextType = UnistoreContext;
    return ((Wrapper.prototype = Object.create(
      Component.prototype
    )).constructor = Wrapper);
  };
}
