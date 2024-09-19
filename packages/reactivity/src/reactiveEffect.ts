import { activeEffect, trackEffect, triggerEffects } from "./effect"

// 存放依赖收集的关系
const targetMap = new WeakMap()

export const createDep = (cleanup, key)=>{
    const dep = new Map() as any
    // 用于清理不需要的属性
    dep.cleanup = cleanup
    dep._name = key; // 自定义的为了标识这个映射表是给哪个属性服务的
    return dep
}

export const track = (target, key)=>{
    // activeEffect 有这个属性 说明这个key是在effect中访问的，没有说明在effect之外访问的不用进行收集
    if(activeEffect){
        // 构建数据结构：Map: {obj: {属性：Set:[effect,effect,effect]}}
        let depsMap = targetMap.get(target)

        if(!depsMap){
            targetMap.set(target, (depsMap = new Map()))
        }

        let dep = depsMap.get(key)

        if(!dep){
            depsMap.set(
                key,
                (dep = createDep(()=>depsMap.delete(key), key))
            )
        }

        // 依赖收集
        trackEffect(activeEffect, dep)
    }
}


export const trigger = (target, key, newVal, oldVal)=>{
    const depsMap = targetMap.get(target)

    if(!depsMap){
        // 找不到对象，直接 return
        return;
    }

    let dep = depsMap.get(key)

    if(dep){
        triggerEffects(dep)
    }
}
