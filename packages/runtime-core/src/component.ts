import { reactive } from "@vue/reactivity"
import { hasOwn, isFunction } from "@vue/shared"

export function createComponentInstance (vnode, parent){
     // vue2的源码中组件的虚拟节点叫$vnode  渲染的内容叫_vnode
     // vue3中虚拟节点叫 vnode，渲染的内容叫subTree
    const instance = {
        data: null, // 状态
        vnode, // 组件的虚拟节点
        subTree: null, // 子树
        props: {},
        attrs: {},
        slots: {},
        propsOptions: vnode.type.props, // 用户声明的哪些属性是组件的属性
        componet: null,
        proxy: null, // 用来代理props attrs data，方便用户访问
        update: null, // 组件的更新的函数
    }
    return instance
}

// 初始化属性
export const initProps = (instance, rawProps) => {
    const props = {}
    const attrs = {}
    const propsOptions = instance.propsOptions || {} // 组件中定义的
    if(rawProps){
        for (const key in rawProps) {
            const value = rawProps[key]
            if(key in propsOptions){
                props[key] = value
            }else{
                attrs[key] = value
            }
        }
    }

    instance.attrs = attrs
    // props是响应式的，这里应该用shallowReactive，遵循单向数据流原则
    instance.props = reactive(props)
}

const publicProperty = {
    $attrs: (instance)=> instance.attrs,
    $slots: (instance)=> instance.slots,
}

const PublicInstanceProxyHandlers = {
    get(target, key){
        // data 和 props 属性中的名字不要重名
        const { data, props, setupState } = target
        if(data && hasOwn(data, key)){
            return data[key]
        }else if(props && hasOwn(props, key)){
            return props[key]
        }else if(setupState && hasOwn(setupState, key)){
            return setupState[key]
        }

        // 特殊属性访问策略
        const specialGetter = publicProperty[key]
        if(specialGetter){
            return specialGetter(target)
        }
    },
    set(target, key, value){
        const { data, props, setupState } = target
        if(data && hasOwn(data, key)){
            data[key] = value
        }else if(props && hasOwn(props, key)){
            console.warn(`Attempting to mutate prop "${key}". Props are readonly.`)
            return false;
        }else if(setupState && hasOwn(setupState, key)){
            setupState[key] = value
        }

        return true
    }
}

export const setupComponent = (instance) => {
    const { vnode } = instance
    initProps(instance, vnode.props)
    // 属性访问代理
    instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers)

    const { setup, render, data = ()=>({}) } = vnode.type

    // setup 处理
    
    // data 数据处理
    if(!isFunction(data)){
        console.warn("data must be a function")
    }else{
        instance.data = reactive(data.call(instance.proxy))
    }

    instance.render = render
}