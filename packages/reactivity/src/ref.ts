import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

function createRef(rawValue, shallow = false) {
    return new RefImpl(rawValue, shallow);
}

export function ref(value){
    return createRef(value);
}

export function shallowRef(){

}

class RefImpl {
    public _value; // 用来保存ref 的值
    public _v_isRef = true; // 增加ref标识
    public dep; // 用于收集对应的 effect

    constructor(public rawValue, public _shallow){
        this._value = _shallow ? rawValue : toReactive(rawValue)
    }

    get value(){
        console.log('get value');
        trackRefValue(this)
        return this._value
    }
    set value(newVal){
        if(newVal !== this.rawValue){
            this.rawValue = newVal
            this._value = this._shallow ? newVal : toReactive(newVal)
            triggerRefValue(this)
        }
    }
}


export const trackRefValue = (ref)=>{
    if(activeEffect){
        trackEffect(
            activeEffect,
            ref.dep = ref.dep || createDep(()=>ref.dep = undefined, 'undefined')
        )
    }
}

export const triggerRefValue = (ref)=>{
    debugger
    let dep = ref.dep

    if(dep){
        // 触发依赖更新
        triggerEffects(dep)
    }
}

class ObjectRefImpl {
    public _v_isRef = true

    constructor(public _object, public key){}

    get value(){
        console.log(this._object, this.key);
        return this._object[this.key]
    }
    set value(newVal){
        this._object[this.key] = newVal
    }
}

export const toRef = (object, key)=>{
    return new ObjectRefImpl(object, key)
}

export const toRefs = (object)=>{
    const res = {}

    for(const key in object){
        res[key] = new ObjectRefImpl(object, key)
    }

    return res
}

export const proxyRefs = (objectWithRef)=>{
    return new Proxy(objectWithRef, {
        get(target, key, receiver){
            let r = Reflect.get(target, key, receiver)
            return r._v_isRef ? r.value : r
        },
        set(target, key, value, reciever){
            const oldVal = target[key]
            if(oldVal._v_isRef){
                oldVal.value = value
                return true
            }else{
                return Reflect.set(target, key, value, reciever)
            }
        }
    })
}

export function isRef(value) {
    return value && value.__v_isRef;
  }