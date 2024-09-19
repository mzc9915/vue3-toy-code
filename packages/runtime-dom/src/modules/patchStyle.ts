export function patchStyle(el, prevVal, nextVal) {
    const style = el.style;

    // 新的样式全都要生效
    for (const key in nextVal) {
        style[key] = nextVal[key];
    }

    if(prevVal){
        for (const key in prevVal) {
            // 以前的属性，现在有没有，如果没有删除掉
            if(!nextVal?.[key]){
                style[key] = null;
            }
        }
    }
}