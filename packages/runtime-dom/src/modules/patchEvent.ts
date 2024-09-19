function createInvoker(value) {
    const invoker = (e) => invoker.value(e);
    invoker.value = value;
    return invoker;
}

export function patchEvent(el, name, nextValue) {
    // vue_event_invoker
    const invokers = el._vei || (el._vei = {});

    const eventName = name.slice(2).toLowerCase();

    // 是否存在同名的事件绑定
    const exsitingInvoker = invokers[eventName];
    if(nextValue && exsitingInvoker){
        // 事件换绑定
        exsitingInvoker.value = nextValue;
    }

    if(nextValue){
        // 缓存函数
        const invoker = (invokers[eventName] = createInvoker(nextValue))
        return el.addEventListener(eventName, invoker);
    }

    // 现在没有，以前有
    if(exsitingInvoker){
        el.removeEventListener(eventName, exsitingInvoker);
        invokers[eventName] = undefined;
    }
}