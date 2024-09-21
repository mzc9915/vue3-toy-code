export const isObject = (val)=>{
    return typeof val === 'object' && val !== null
}

export const isFunction = (val)=>{
    return typeof val === 'function'
}

export const isString = (val)=>{
    return typeof val === 'string'
}

const hasOwnProperty = Object.prototype.hasOwnProperty

export const hasOwn = (value, key)=> hasOwnProperty.call(value, key)

export * from './shapeFlags'
export * from "./patchFlags";
