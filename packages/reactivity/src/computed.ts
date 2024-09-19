import { isFunction } from "@vue/shared"
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

class ComputedRefImpl {
    public _value;
    public effect;
    public dep;
    constructor(getter, public setter){
        this.effect = new ReactiveEffect(
            // 用户的 fn，这里就是：访问 各个响应式属性
            ()=> getter(),
            ()=> {
                // 计算属性依赖的值变化了，应该触发effect重新执行，并把 dirty 变为true
                triggerRefValue(this)
            }
        )
    }

    get value(){
        // 需要收集当前计算属性对应的effect
        if(this.effect.dirty){
            // 默认取值一定是脏的，执行一次 run 就不脏了
            // computed 的 run 方法，会执行 fn: ()=> getter(),这个方法里可能就会访问到 其他的响应式属性，
            //   进而访问属性时，会将 computed自身的effect 进行收集
            this._value = this.effect.run()

            // 收集 用到当前计算属性的 effect
            trackRefValue(this)
        }

        return this._value
    }
    set value(val){
        this.setter(val)
    }
}

/**
 * 描述实现原理：
 *  1.计算属性维护了一个dirty属性，默认就是true，稍后运行过一次会将dirty变为false，并且稍后依赖的值变化后会再次让dirty变为true
 *  2.计算属性也是一个effect，依赖的属性会收集这个计算属性，当前值变化后，会让computedEffect里面dirty 变为true
 *  3.计算属性具备收集能力的，可以收集对应的effect，依赖的值变化后会触发effect重新执行
 * 
 * 计算属性aLiasName，计算属性依赖的值name
 *  - 计算属性本身就是一个 effect ，有一个标识dirty = true，访问的时候会，触发name属性的get方法（依赖收集） 
 *          将name属性和计算属性做一个映射，稍后name变化后会触发计算属性的scheduler
 *  - 计算属性可能在effect中使用，当取计算属性的时候，
 *          会对当前的effect进行依赖收集如果name属性变化了，会通知计算属性将dirty 变为trueK触发计算属性收集的effect）
 */

export const computed = (getterOrOptions) => {
    let onlyGetter = isFunction(getterOrOptions)

    let getter;
    let setter;

    if(onlyGetter){
        getter = getterOrOptions
        setter = ()=>{}
    }else{
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }

    // 计算属性ref
    return new ComputedRefImpl(getter, setter)
}