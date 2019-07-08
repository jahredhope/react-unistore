import { Action, Store } from "unistore";

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

export const assign = Object.assign;
