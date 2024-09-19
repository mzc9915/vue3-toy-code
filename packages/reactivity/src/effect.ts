import { DirtyLevels } from "./constants"

export const effect = (fn, options)=>{
    // 默认执行effect时会对属性，进行依赖收集

    // 创建一个effect，只要依赖的属性发生变化，就会重新执行effect
    const _effect = new ReactiveEffect(fn, ()=>{
        // scheduler
        _effect.run()
    })

    if(options){
        Object.assign(_effect, options)
    }

    _effect.run()

    const runner = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

const preCleanEffect = (effect) => {
    effect._depsLength = 0
    // 每次执行effect时，都会更新id；如果是同一个 effect，id 就是相同的
    effect._trackId++
}

const postCleanEffect = (effect) => {
    // [flag, xx, yy, zz] -> [flag, cc]

    // 主要通过：effect.deps.length 和 effect._depsLength 来管理依赖
    // 0~_depsLength 之间的才是有效的依赖，其他的是无效的依赖
    if(effect.deps.length > effect._depsLength){
        for (let i = effect._depsLength; i < effect.deps.length; i++) {
            // 删除映射表中对应的effect
            cleanDepEffect(effect.deps[i], effect)
        }

        // 更新依赖列表的长度
        effect.deps.length = effect._depsLength
    }
}

export let activeEffect;

export class ReactiveEffect {
    _trackId = 0 // 用于记录当前effet 执行了几次
    _depsLength = 0
    _running = 0
    _dirtyLevel = DirtyLevels.DIRTY
    active = true
    deps = [] // 收集 effect 中使用到的属性

    // 如果fn中依赖的数据发生变化后，需要重新调用 -> run()
    constructor(public fn, public scheduler){} 

    get dirty(){
        return this._dirtyLevel === DirtyLevels.DIRTY
    }
    set dirty(val){
        this._dirtyLevel = val ? DirtyLevels.DIRTY : DirtyLevels.NOT_DIRTY
    }

    // vue3.4 和 之前解决 嵌套 effect 有何不同
    // 1. 使用栈的方式解决
    // 2. 通过 currentEffect 属性解决

    // 执行run，代表页面重新渲染
    run(){
        // 每次运行后，让effect 的 dirty NO_DIRTY
        this._dirtyLevel = DirtyLevels.NOT_DIRTY

        if(!this.active){
            return this.fn()
        }

        const currentEffect = activeEffect
        
        try{
            activeEffect = this

            // effect 重新执行前，需要清除上一次的依赖
            preCleanEffect(this)
            this._running++;
            // 进行依赖收集工作
            return this.fn()
        }finally{
            this._running--;
            postCleanEffect(this)
            activeEffect = currentEffect
        }
    }

    stop() {
        if (this.active) {
          this.active = false; // 后续来实现
          preCleanEffect(this);
          postCleanEffect(this);
        }
      }
}

const cleanDepEffect = (dep, effect)=>{
    dep.delete(effect)
    if(dep.size === 0){
        // 如果map为空，则删除这个属性
        dep.cleanup()
    }
}

// effect 和 dep 双向记忆
export const trackEffect = (effect, dep) => {
    /**
     * 存在收集多余依赖的问题
     *  dep.set(effect, effect._trackId)
     *  effect.deps[effect._depsLength++] = dep
     */

    // 依赖收集时，是一个一个进行收集的，在重新收集时，需要将不要的依赖移除掉
    // 1. _trackId 记录执行次数， 用于标识effect是否已经收集过依赖，防止一个属性在当前effect中重复收集，一个属性在一个effect中只收集一次
    // 清理操作是在 effect 的 run 方法中进行的，所以，一个 effect 在 同一个执行过程中， _trackId是相同的
    if(dep.get(effect) !== effect._trackId){
        // 更新id
        dep.set(effect, effect._trackId)

        let oldDep = effect.deps[effect._depsLength]

        if(oldDep !== dep){
            if(oldDep){
                // 删除老的依赖
                cleanDepEffect(oldDep, effect)
            }

            // 替换成新的依赖
            effect.deps[effect._depsLength++] = dep
        }else{
            effect._depsLength++
        }
    }

    // if(dep.get(effect) !== effect._trackId){
    //     // 更新id
    //     dep.set(effect, effect._trackId)


    // }
}

export const triggerEffects = (dep) => {
    for(const effect of dep.keys()){
        // 属性依赖了计算属性，需要让计算属性的dirty变为true
        if(effect._dirtyLevel < DirtyLevels.DIRTY){
            effect._dirtyLevel = DirtyLevels.DIRTY
        }

        if(!effect._running){
            if(effect.scheduler){
                effect.scheduler()
            }
        }
    }
}