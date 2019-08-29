import "@testing-library/jest-dom/extend-expect";
import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import createStore from "unistore";
import { Store } from "unistore";
import { connect, Provider, useAction, useSelector } from ".";

interface State {
  a: any;
  b: any;
}

describe("react-unistore", () => {
  let store: Store<State>;
  let Parent: (props: any) => any;
  let Child: (props: any) => any;

  beforeEach(() => {
    store = createStore({ a: 1, b: 1 });
    Parent = ({ children }) => {
      return <Provider value={store}>{children}</Provider>;
    };
  });
  afterEach(cleanup);

  describe("useSelector", () => {
    beforeEach(() => {
      Child = jest.fn(() => {
        const value = useSelector<State, number>(state => state.a);
        return <div>{`A = ${value}`}</div>;
      });
    });
    it("should render with the given state", () => {
      store.setState({ a: 2 });

      expect(Child).toHaveBeenCalledTimes(0);
      const { getByText } = render(
        <Parent>
          <Child />
        </Parent>
      );
      expect(Child).toHaveBeenCalledTimes(1);
      expect(getByText("A = 2")).toBeInTheDocument();
    });
    it("should not re-render on irrelevant changes", () => {
      const initialValue = "initialValue";
      const newValue = "newValue";

      store.setState({ a: initialValue });

      expect(Child).toHaveBeenCalledTimes(0);
      render(
        <Parent>
          <Child />
        </Parent>
      );
      expect(Child).toHaveBeenCalledTimes(1);

      act(() => {
        store.setState({
          b: newValue,
        });
      });
      expect(Child).toHaveBeenCalledTimes(1);
    });
    it("should re-render on relevant changes", () => {
      const initialValue = "initialValue";
      const newValue = "newValue";

      store.setState({ a: initialValue });
      expect(Child).toHaveBeenCalledTimes(0);
      render(
        <Parent>
          <Child />
        </Parent>
      );
      expect(Child).toHaveBeenCalledTimes(1);

      act(() => {
        store.setState({
          a: newValue,
        });
      });
      expect(Child).toHaveBeenCalledTimes(2);
    });
    describe("equalityFn", () => {
      it("should re-render on new objects by default", () => {
        const initialValue = { a: 1 };
        const newValue = { ...initialValue };

        Child = jest.fn(() => {
          const value = useSelector<State, number>(state => state.a);
          return <div>{`A = ${value}`}</div>;
        });

        store.setState({ a: initialValue });

        expect(Child).toHaveBeenCalledTimes(0);
        render(
          <Parent>
            <Child />
          </Parent>
        );

        act(() => {
          store.setState({
            a: newValue,
          });
        });
        expect(Child).toHaveBeenCalledTimes(2);
      });
      it("should ignore state changes that return truthy", () => {
        const initialValue = { a: 1 };
        const newValue = { ...initialValue };

        const equalityFn = jest.fn(() => true);

        Child = jest.fn(() => {
          const value = useSelector<State, number>(
            state => state.a,
            equalityFn
          );
          return <div>{`A = ${value}`}</div>;
        });

        store.setState({ a: initialValue });

        expect(Child).toHaveBeenCalledTimes(0);
        render(
          <Parent>
            <Child />
          </Parent>
        );

        act(() => {
          store.setState({
            a: newValue,
          });
        });

        expect(equalityFn).toHaveBeenCalledTimes(1);
        expect(equalityFn).toHaveBeenCalledWith(initialValue, newValue);
        expect(Child).toHaveBeenCalledTimes(1);
      });
      it("should re-render when equality returns falsey", () => {
        const initialValue = { a: 1 };
        const newValue = { ...initialValue };

        const equalityFn = jest.fn(() => false);

        Child = jest.fn(() => {
          const value = useSelector<State, number>(
            state => state.a,
            equalityFn
          );
          return <div>{`A = ${value}`}</div>;
        });

        store.setState({ a: initialValue });

        expect(Child).toHaveBeenCalledTimes(0);
        render(
          <Parent>
            <Child />
          </Parent>
        );

        act(() => {
          store.setState({
            a: newValue,
          });
        });

        expect(equalityFn).toHaveBeenCalledTimes(1);
        // @ts-ignore: Check for exact object reference
        expect(equalityFn.mock.calls[0][0]).toBe(initialValue);
        // @ts-ignore: Check for exact object reference
        expect(equalityFn.mock.calls[0][1]).toBe(newValue);
        expect(Child).toHaveBeenCalledTimes(2);
      });
    });
  });
  describe("useAction", () => {
    it("should update state", () => {
      const initialValue = "initialValue";
      const newValue = "newValue";
      const useUpdateA = () =>
        useAction((_state: State, val: string) => ({
          a: val,
        }));
      Child = jest.fn(() => {
        const updateA = useUpdateA();
        return (
          <div>
            <button onClick={() => updateA(newValue)}>Update</button>
          </div>
        );
      });

      store.setState({ a: initialValue, b: initialValue });
      expect(Child).toHaveBeenCalledTimes(0);

      const { container } = render(
        <Parent>
          <Child />
        </Parent>
      );
      expect(Child).toHaveBeenCalledTimes(1);

      act(() => {
        const button = container.querySelector("button");
        button.click();
      });
      expect(store.getState().a).toEqual(newValue);
      expect(store.getState().b).toEqual(initialValue);
    });
  });
  describe("connect", () => {
    it("should exist", () => {
      expect(connect).toEqual(expect.any(Function));
    });
    it("should connect to the store", () => {
      const initialValue = "initialValue";
      const newValue = "newValue";
      store.setState({ a: initialValue });
      const mapStateToProps = (state: State) => ({ a: state.a });
      const actions: any[] = [];

      const ChildComponent = jest.fn(props => <div>{`A = ${props.a}`}</div>);

      // @ts-ignore
      Child = connect(
        mapStateToProps,
        actions
      )(ChildComponent);

      const { getByText } = render(
        <Parent>
          <Child />
        </Parent>
      );
      expect(getByText(`A = ${initialValue}`)).toBeInTheDocument();
      expect(ChildComponent).toHaveBeenCalledTimes(1);
      act(() => store.setState({ a: newValue }));
      expect(getByText(`A = ${newValue}`)).toBeInTheDocument();

      expect(ChildComponent).toHaveBeenCalledTimes(2);
      expect(ChildComponent).toHaveBeenNthCalledWith(2, { a: newValue }, {});

      act(() => store.setState({ b: newValue }));
      expect(ChildComponent).toHaveBeenCalledTimes(2);
    });
    it("should check for shallow equality in mapped state", () => {
      const objValue = { val: "initialValue" };

      store.setState({ a: objValue });
      const mapStateToProps = jest.fn((state: State) => ({ a: state.a }));
      const actions: any[] = [];

      const ChildComponent = jest.fn(props => (
        <div>{`A = ${JSON.stringify(props.a)}`}</div>
      ));

      // @ts-ignore
      Child = connect(
        mapStateToProps,
        actions
      )(ChildComponent);

      render(
        <Parent>
          <Child />
        </Parent>
      );

      expect(ChildComponent).toHaveBeenCalledTimes(1);
      expect(mapStateToProps).toHaveBeenCalledTimes(1);

      // Same Relevant value
      act(() => store.setState({ a: objValue }));
      expect(ChildComponent).toHaveBeenCalledTimes(1);
      expect(mapStateToProps).toHaveBeenCalledTimes(2);
      expect(ChildComponent).toHaveBeenNthCalledWith(1, { a: objValue }, {});

      // Irrelevant change
      act(() => store.setState({ b: objValue }));
      expect(ChildComponent).toHaveBeenCalledTimes(1);
      expect(mapStateToProps).toHaveBeenCalledTimes(3);

      // New Relevant Value
      act(() => store.setState({ a: { ...objValue } }));
      expect(ChildComponent).toHaveBeenCalledTimes(2);
      expect(mapStateToProps).toHaveBeenCalledTimes(4);
    });
  });
});
