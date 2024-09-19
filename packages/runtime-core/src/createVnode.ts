import { isString, ShapeFlags } from "@vue/shared"

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export const isVNode = (val: any)=>{
    return val ? val._v_isVNode === true : false
}

export function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }

// createVnode 的写法比较死板
export const createVnode = (type, props, children = null) => {
    const shapeFlag  = isString(type) ? ShapeFlags.ELEMENT : 0

    const vnode = {
        _v_isVNode: true,
        type,
        props,
        key: props?.['key'],
        el: null,
        children,
        shapeFlag
    }

    if(children){
        let type = 0

        if(Array.isArray(children)){
            type = ShapeFlags.ARRAY_CHILDREN
        }else{
            children = String(children)
            type = ShapeFlags.TEXT_CHILDREN
        }

        // 如果shapeFlag为9 说明元素中包含一个文本
        // 如果shapeFlag为17 说明元素中有多个子节点
        vnode.shapeFlag |= type
    }

    return vnode
}