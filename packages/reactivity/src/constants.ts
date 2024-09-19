export enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
}

export enum DirtyLevels {
    DIRTY = 4, // 脏值，意味着需要重新运行计算属性
    NOT_DIRTY = 0, // 不是脏值， 就用上一次的返回结果
}