pnpm -w : 表示所有包都需要

```ts
// proxy 和 Reflect 的使用
// 在处理 getter 或 inherited properties 时可能会导致 subtle bugs。
// 使用 Reflect.set 来处理属性的设置，同样确保了正确的上下文和返回值：没有处理复杂情况，例如定义了 setter 的对象，或者当对象属性是不可写的（writable: false）时
// receiver 参数确保 this 指向代理对象 proxyPerson，而不是目标对象 person。这样当计算属性或 getter 方法内部访问 this 时，会使用代理对象的上下文。

const person = {
  name: "jw",
  get aliasName() {
    return this.name + "handsome";
  },
};

// aliasName 是一个 getter 方法，它依赖于 this 上下文来访问 name 属性。
// 直接返回 target[key] 会导致 this 指向原始对象 target，而不是代理对象 recevier，从而导致 this.name 无法正确解析。

let proxyPerson = new Proxy(person, {
  get(target, key, recevier) {
    // recevier 是代理对象
    console.log(key);
    // aliasName
    // jwhandsome
    return target[key];
    // aliasName
    // name
    // jwhandsome
    // return Reflect.get(target, key, recevier); // (recevier[key]); // person.name 不会触发get
  },
});

// 取aliasName时，我希望可以收集aliasName属性和name属性
console.log(proxyPerson.aliasName);
```