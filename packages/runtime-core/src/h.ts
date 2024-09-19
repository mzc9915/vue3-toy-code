import { isObject } from "@vue/shared";
import { createVnode, isVNode } from "./createVnode";

export function h (type, propsOrChildren?, children?) {
    const l = arguments.length;

    if(l === 2){
        // h('div', 虚拟节点|属性)
        if(isObject(propsOrChildren) && !Array.isArray(propsOrChildren)){
            if(isVNode(propsOrChildren)){
                return createVnode(type, null, [propsOrChildren])
            }else{
                return createVnode(type, propsOrChildren)
            }
        }else{
            return createVnode(type, null, propsOrChildren)
        }
    }else{
        if(l > 3){
            children = Array.from(arguments).slice(2)
        }

        if(l === 3 && isVNode(children)){
            children = [children]
        }

        return createVnode(type, propsOrChildren, children)
    }
}