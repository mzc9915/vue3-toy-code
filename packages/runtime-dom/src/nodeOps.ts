// 对元素增删改查的操作
export const nodeOps = {
    // 如果第三个元素不传递 === appendChild
    insert: (el, parent, anchor)=> parent.insertBefore(el, anchor || null),
    remove: (el)=>{
        const parent = el.parentNode;
        parent && parent.removeChild(el);
    },
    createElement: (type)=> document.createElement(type),
    createText: (text)=>document.createTextNode(text),
    setText: (node,text)=>node.nodeValue = text,
    setElementText: (el,text)=>el.textContent = text,
    parentNode: (node)=>node.parentNode,
    nextSibling: (node)=>node.nextSibling,
}