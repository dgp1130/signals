import 'jasmine';

import { createEffect, createSignal } from './signal';

describe('signals', () => {
  it('access initial value', () => {
    const [value] = createSignal(1);
    expect(value()).toBe(1);
  });

  it('updates self', () => {
    const [value, setValue] = createSignal(1);
    setValue(2);
    expect(value()).toBe(2);
  });

  it('effect', () => {
    const [value, setValue] = createSignal(1);

    let output = 0;
    const dispose = createEffect(() => {
      output = value();
    });

    // Executes immediately.
    expect(output).toBe(1);

    // Executes on change.
    setValue(2);
    expect(output).toBe(2);

    dispose();
  });

  it('effect disposes', () => {
    const [value, setValue] = createSignal(1);

    let output = 0;
    const dispose = createEffect(() => {
      output = value();
    });
    expect(output).toBe(1);

    dispose();

    // Does *not* execute after being disposed.
    setValue(2);
    expect(output).toBe(1);
  });

  it('effect logs errors', () => {
    spyOn(console, 'error');

    const [value, setValue] = createSignal(1);

    let output = 0;
    const dispose = createEffect(() => {
      output = value();
      throw new Error('Oh noes, bad signal!');
    });
    expect(output).toBe(1);
    expect(console.error).toHaveBeenCalledTimes(1);

    // Error doesn't stop subsequent executions.
    setValue(2);
    expect(output).toBe(2);
    expect(console.error).toHaveBeenCalledTimes(2);

    dispose();
  });

  it('computed', () => {
    const [value, setValue] = createSignal(1);

    let output = 0;
    const dispose = createEffect(() => {
      output = value() + 1;
    });
    expect(output).toBe(2);

    setValue(2);
    expect(output).toBe(3);

    dispose();
  });

  it('computed multi-signal', () => {
    const [first, setFirst] = createSignal(1);
    const [second, setSecond] = createSignal(2);

    let output = 0;
    const dispose = createEffect(() => {
      output = first() + second();
    });
    expect(output).toBe(3);

    setFirst(3);
    expect(output).toBe(5);

    setSecond(4);
    expect(output).toBe(7);

    dispose();
  });

  it('computed multi-signal if', () => {
    const [condition, setCondition] = createSignal(false);
    const [t, setT] = createSignal(1);
    const [f] = createSignal(2);

    let output = 0;
    const dispose = createEffect(() => {
      output = condition() ? t() : f();
    });
    expect(output).toBe(2);

    setCondition(true);
    expect(output).toBe(1);

    setT(3);
    expect(output).toBe(3);

    dispose();
  });

  it('computed multi-signal rebind', () => {
    const [condition, setCondition] = createSignal(false);
    const [t, setT] = createSignal(1);
    const [f, setF] = createSignal(2);

    let output = 0;
    const effect = jasmine.createSpy('effect', () => {
      output = condition() ? t() : f();
    }).and.callThrough();

    const dispose = createEffect(effect);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(output).toBe(2);

    // Modifying `t` should *not* re-evaluate the effect because it was not
    // needed in the previous execution.
    setT(3);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(output).toBe(2);

    // Updating the condition should now use `t` and re-evaluate the effect.
    setCondition(true);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(output).toBe(3);

    // Modifying `t` should re-evaluate the effect.
    setT(4);
    expect(effect).toHaveBeenCalledTimes(3);
    expect(output).toBe(4);

    // Modifying `f` should *not* re-evaluate the effect because it was not
    // needed in the previous execution.
    setF(5);
    expect(effect).toHaveBeenCalledTimes(3);
    expect(output).toBe(4);

    dispose();
  });
});
