import { patchAttr } from "./modules/patchAttr"
import { patchClass } from "./modules/patchClass"
import { patchEvent } from "./modules/patchEvent"
import { patchStyle } from "./modules/patchStyle"

export default function patchProp (el, key, prevValue, nextValue) {
    if(key === 'class'){
        // 如果是 class 属性
        patchClass(el, nextValue)
    }else if(key === 'style'){
        // 如果是 style 属性
        patchStyle(el, prevValue, nextValue)
    }else if(/^on[^a-z]/.test(key)){
        // 如果是事件
        patchEvent(el, key, nextValue)
    }else{
        // 其他属性
        patchAttr(el, key, nextValue)
    }
}