import { isFunction, isObject } from "@vue/shared"
import { isReactive } from "./reactive"
import { isRef } from "./ref"
import { ReactiveEffect } from "./effect"

export const watch = (source, cb, options = {} as any) => {
    return doWatch(source, cb, options)
}

export const watchEffect = (source, options = {}) => {
    return doWatch(source, null, options as any)
}

// 控制 depth 已经当前遍历到了那一层
// seen 用来记录已经遍历过的对象，避免循环引用
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
    if(!isObject(source)){
        return source
    }

    if(depth){
        if(currentDepth >= depth){
            return source
        }
        // 根据 deep 属性来看是否是深度
        currentDepth++
    }

    if(seen.has(source)){
        return source
    }

    for (const key in source) {
        traverse(source[key], depth, currentDepth, seen)
    }

    return source
}

const reactiveGetter = (source, deep) => {
    const depth = deep === false ? 1 : undefined
    traverse(source, depth)
}

function doWatch(source, cb, { deep = false, immediate }) {
    debugger
    // watch 的核心就是观测一个响应式数据，当数据变化时通知并执行回调 （那也就是说它本身就是一个 effect）

    let oldValue;
    let getter
    // 1. Ref：通过 `ref` 创建的响应式变量。
    // 2. Reactive Object：通过 `reactive` 创建的响应式对象。
    // 3. Computed Ref：通过 `computed` 创建的计算属性。
    // 4. Array of Refs：一个包含多个 `ref` 的数组。
    // 5. Getter Function：一个返回值的函数。
    if(isReactive(source)) {
        getter = () => reactiveGetter(source, deep)
    }else if(isRef(source)){
        getter = () => source.value
    }else if(isFunction(source)){
        getter = source
    }

    let clean;
    const onCleanup = (fn) => {
        clean = () => {
            fn()
            clean = undefined
        }
    }

    const job = () => {
        // 执行 effect.run() 时，会触发 getter 函数, getter 函数会触发依赖收集
        if(cb){
            const newValue = effect.run()

            //  在执行回调前，先调用上一次的清理操作进行清理
            if(clean){
                clean()
            }

            cb(newValue, oldValue, onCleanup)
            oldValue = newValue
        }else{
            effect.run() // watchEffect
        }
    }

    const effect = new ReactiveEffect(getter, job)

    if(cb){
        if(immediate){
            // 立即先执行一次用户的回调，传递新值和老值
            job()
        }else{
            oldValue = effect.run()
        }
    }else{
        // 没有cb 就 直接执行即可，这也就是 watchEffect
        effect.run()
    }

    const unwatch = () => {
        effect.stop()
    }

    return unwatch
}