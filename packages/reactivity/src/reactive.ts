import { isObject } from "@vue/shared";
import { ReactiveFlags } from "./constants";
import { mutableHandlers } from "./baseHandler";

const reactiveMap = new WeakMap();

function createReactiveObject(target) {
  // 统一做判断，响应式对象必须是对象才可以
  if (!isObject(target)) {
    return target;
  }

  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

export const reactive = (target) => {
  return createReactiveObject(target);
};

export const toReactive = (value) => {
  return isObject(value) ? reactive(value) : value;
};

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}
