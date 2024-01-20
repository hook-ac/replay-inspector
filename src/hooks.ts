export interface Hook<T> {
  event: T;
  callback: (...args: any) => boolean | void;
}

export enum Events {
  setup,
  draw,
  preload,
  resize,
  mousePressed,
  mouseDragged,
  mouseReleased,
  mouseWheel,
  KeyPressed,
  KeyReleased,
}

const hooks: Map<any, Hook<Events>[]> = new Map();

export function hook({ event, callback }: Hook<any>) {
  if (!hooks.get(event)) {
    hooks.set(event, []);
  }
  hooks.set(event, [...hooks.get(event)!, { event, callback }]);
}

export function hookable(event: Events) {
  return (...args: any) => {
    const hookList = hooks.get(event);

    if (!hookList?.length) return;

    for (const hook of hookList) {
      hook.callback(...args);
    }
  };
}
