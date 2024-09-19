import { isObject } from "@vue/shared"
import { ReactiveFlags } from "./constants"
import { reactive } from "./reactive"
import { track, trigger } from "./reactiveEffect"

export const mutableHandlers = {
    // Reflect 提供的方法可帮助我们避免在 Proxy handler 中直接对目标对象进行操作，从而减少潜在的错误和代码复杂度
    get(target, key, recevier){
        if(key === ReactiveFlags.IS_REACTIVE){
            return true
        }

        // 当取值时，让响应式属性 和 effect 映射起来
        track(target, key)

        let res = Reflect.get(target, key, recevier)

        if(isObject(res)){
            return reactive(res)
        }

        return res
    },
    set(target, key, value, recevier){
        let oldVal = target[key]

        // 找到属性，让对应的 effect 重新执行
        let result = Reflect.set(target, key, value, recevier)

        if(oldVal !== value){
            trigger(target, key, value, oldVal)
        }

        return result
    }
}