// packages/shared/src/index.ts
var isObject = (val) => {
  return typeof val === "object" && val !== null;
};
var isFunction = (val) => {
  return typeof val === "function";
};

// packages/reactivity/src/effect.ts
var effect = (fn, options) => {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  if (options) {
    Object.assign(_effect, options);
  }
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
};
var preCleanEffect = (effect2) => {
  effect2._depsLength = 0;
  effect2._trackId++;
};
var postCleanEffect = (effect2) => {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanDepEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
};
var activeEffect;
var ReactiveEffect = class {
  // 收集 effect 中使用到的属性
  // 如果fn中依赖的数据发生变化后，需要重新调用 -> run()
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._trackId = 0;
    // 用于记录当前effet 执行了几次
    this._depsLength = 0;
    this._running = 0;
    this._dirtyLevel = 4 /* DIRTY */;
    this.active = true;
    this.deps = [];
  }
  get dirty() {
    return this._dirtyLevel === 4 /* DIRTY */;
  }
  set dirty(val) {
    this._dirtyLevel = val ? 4 /* DIRTY */ : 0 /* NOT_DIRTY */;
  }
  // vue3.4 和 之前解决 嵌套 effect 有何不同
  // 1. 使用栈的方式解决
  // 2. 通过 currentEffect 属性解决
  // 执行run，代表页面重新渲染
  run() {
    this._dirtyLevel = 0 /* NOT_DIRTY */;
    if (!this.active) {
      return this.fn();
    }
    const currentEffect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      this._running++;
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = currentEffect;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      preCleanEffect(this);
      postCleanEffect(this);
    }
  }
};
var cleanDepEffect = (dep, effect2) => {
  dep.delete(effect2);
  if (dep.size === 0) {
    dep.cleanup();
  }
};
var trackEffect = (effect2, dep) => {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    let oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanDepEffect(oldDep, effect2);
      }
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
  }
};
var triggerEffects = (dep) => {
  for (const effect2 of dep.keys()) {
    if (effect2._dirtyLevel < 4 /* DIRTY */) {
      effect2._dirtyLevel = 4 /* DIRTY */;
    }
    if (!effect2._running) {
      if (effect2.scheduler) {
        effect2.scheduler();
      }
    }
  }
};

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
var createDep = (cleanup, key) => {
  const dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  dep._name = key;
  return dep;
};
var track = (target, key) => {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(
        key,
        dep = createDep(() => depsMap.delete(key), key)
      );
    }
    trackEffect(activeEffect, dep);
  }
};
var trigger = (target, key, newVal, oldVal) => {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
};

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  // Reflect 提供的方法可帮助我们避免在 Proxy handler 中直接对目标对象进行操作，从而减少潜在的错误和代码复杂度
  get(target, key, recevier) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    let res = Reflect.get(target, key, recevier);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, recevier) {
    let oldVal = target[key];
    let result = Reflect.set(target, key, value, recevier);
    if (oldVal !== value) {
      trigger(target, key, value, oldVal);
    }
    return result;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
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
var reactive = (target) => {
  return createReactiveObject(target);
};
var toReactive = (value) => {
  return isObject(value) ? reactive(value) : value;
};
function isReactive(value) {
  return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
}

// packages/reactivity/src/ref.ts
function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow);
}
function ref(value) {
  return createRef(value);
}
function shallowRef() {
}
var RefImpl = class {
  // 用于收集对应的 effect
  constructor(rawValue, _shallow) {
    this.rawValue = rawValue;
    this._shallow = _shallow;
    // 用来保存ref 的值
    this._v_isRef = true;
    this._value = _shallow ? rawValue : toReactive(rawValue);
  }
  get value() {
    console.log("get value");
    trackRefValue(this);
    return this._value;
  }
  set value(newVal) {
    if (newVal !== this.rawValue) {
      this.rawValue = newVal;
      this._value = this._shallow ? newVal : toReactive(newVal);
      triggerRefValue(this);
    }
  }
};
var trackRefValue = (ref2) => {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      ref2.dep = ref2.dep || createDep(() => ref2.dep = void 0, "undefined")
    );
  }
};
var triggerRefValue = (ref2) => {
  let dep = ref2.dep;
  if (dep) {
    triggerEffects(dep);
  }
};
var ObjectRefImpl = class {
  constructor(_object, key) {
    this._object = _object;
    this.key = key;
    this._v_isRef = true;
  }
  get value() {
    console.log(this._object, this.key);
    return this._object[this.key];
  }
  set value(newVal) {
    this._object[this.key] = newVal;
  }
};
var toRef = (object, key) => {
  return new ObjectRefImpl(object, key);
};
var toRefs = (object) => {
  const res = {};
  for (const key in object) {
    res[key] = new ObjectRefImpl(object, key);
  }
  return res;
};
var proxyRefs = (objectWithRef) => {
  return new Proxy(objectWithRef, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver);
      return r._v_isRef ? r.value : r;
    },
    set(target, key, value, reciever) {
      const oldVal = target[key];
      if (oldVal._v_isRef) {
        oldVal.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, reciever);
      }
    }
  });
};
function isRef(value) {
  return value && value.__v_isRef;
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = new ReactiveEffect(
      // 用户的 fn，这里就是：访问 各个响应式属性
      () => getter(),
      () => {
        triggerRefValue(this);
      }
    );
  }
  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
    }
    return this._value;
  }
  set value(val) {
    this.setter(val);
  }
};
var computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
};

// packages/reactivity/src/apiWatch.ts
var watch = (source, cb, options = {}) => {
  return doWatch(source, cb, options);
};
var watchEffect = (source, options = {}) => {
  return doWatch(source, null, options);
};
function traverse(source, depth, currentDepth = 0, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    currentDepth++;
  }
  if (seen.has(source)) {
    return source;
  }
  for (const key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }
  return source;
}
var reactiveGetter = (source, deep) => {
  const depth = deep === false ? 1 : void 0;
  traverse(source, depth);
};
function doWatch(source, cb, { deep = false, immediate }) {
  debugger;
  let oldValue;
  let getter;
  if (isReactive(source)) {
    getter = () => reactiveGetter(source, deep);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }
  let clean;
  const onCleanup = (fn) => {
    clean = () => {
      fn();
      clean = void 0;
    };
  };
  const job = () => {
    if (cb) {
      const newValue = effect2.run();
      if (clean) {
        clean();
      }
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      effect2.run();
    }
  };
  const effect2 = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect2.run();
    }
  } else {
    effect2.run();
  }
  const unwatch = () => {
    effect2.stop();
  };
  return unwatch;
}
export {
  ReactiveEffect,
  activeEffect,
  computed,
  effect,
  isReactive,
  isRef,
  proxyRefs,
  reactive,
  ref,
  shallowRef,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  trackRefValue,
  triggerEffects,
  triggerRefValue,
  watch,
  watchEffect
};
//# sourceMappingURL=reactivity.js.map
