import { Events, hook } from "@/hooks";

export function Hook(event: Events): any {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    hook({ event, callback: descriptor.value });
  };
}
