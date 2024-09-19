import { ShapeFlags } from '@vue/shared'
import { Fragment, isSameVnode, Text } from './createVnode'
import getSquence from '../seq'

export const createRenderer = (rendererOptions) => {
    // core中不关心如何渲染
    const {
        insert: hostInsert,
        remove: hostRemove,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        patchProp: hostPatchProp,
    } = rendererOptions

    const mountChildren = (chilren, container, anchor, parentComponent) => {
        for (let i = 0; i < chilren.length; i++) {
            patch(null, chilren[i], container, anchor, parentComponent)
        }
    }

    const mountElement = (vnode, container, anchor, parentComponent)=>{
        const { type, props, shapeFlag, children } = vnode

        // 创建真实元素，挂载到虚拟节点上:关联 vnode.el = 真实dom
        // 第二次渲染新的vnode，可以和上一次的vnode做比对，之后更新对应的el元素，可以后续再复用这个dom元素
        const el = (vnode.el = hostCreateElement(type))
        if(props){
            for (const key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }

        // 文本
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
            hostSetElementText(el, vnode.children)
        }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){ // 多个儿子
            mountChildren(vnode.children, el, anchor, parentComponent)
        }

        // 插入到容器中
        hostInsert(el, container, anchor)
    }
    

    const patchElement = (n1, n2, container, anchor, parentComponent) => {
        // 对比前后元素，看是否能够复用dom 元素
        // 前后元素一致则比较两个元素的属性和孩子节点
        const el = (n2.el = n1.el)
        const oldProps = n1.props || {}
        const newProps = n2.props || {}

        // hostPatchProp 只针对某一个属性来处理  class style event attr
        patchProps(oldProps, newProps, el)
        patchChildren(n1, n2, el, anchor, parentComponent)
    }

    const processElement = (n1, n2, container, anchor, parentComponent) => {
        if(n1 === null){
            mountElement(n2, container, anchor, parentComponent)
        }else{
            patchElement(n1, n2, container, anchor, parentComponent)
        }
    }

    const patchProps = (oldProps, newProps, el) => {
        // 新的属性全都要
        for (const key in newProps) {
            hostPatchProp(el, key, oldProps[key], newProps[key])
        }

        for (const key in oldProps) {
            if(!(key in newProps)){
                // 以前有，现在没有了，需要删除
                hostPatchProp(el, key, oldProps[key], null)
            }
        }
    }

    const processText = (n1, n2, container) => {
        if(n1 === null){
            // 1. 将虚拟节点要关联真实节点
            // 2. 将节点插入到容器中
            hostInsert((n2.el = hostCreateText(n2.children)), container)
        }else{
            const el = (n2.el = n1.el)
            if(n2.children !== n1.children){
                hostSetText(el, n2.children)
            }
        }
    }

    const processFragment = (n1, n2, container, anchor, parentComponent) => {
        if(n1 === null){
            mountChildren(n2.children, container, anchor, parentComponent)
        }else{
            patchChildren(n1, n2, container, anchor, parentComponent)
        }
    }

    const unmountChildren = (children, parentComponent) => {
        for (let i = 0; i < children.length; i++) {
            let child = children[i]
            unmount(child, parentComponent)
        }
    }

    // vue3 中分为 2 种 diff 算法， 全量diff（递归 diff） 和 快速diff（靶向更新）
    const patchKeyedChildren = (c1, c2, el, parentComponent) => {
        // 比较2 个儿子的差异，进而更新el
        // 主要涉及到 appnendChild insertBefore removeChild
        // 主要的策略是，减少对比的范围
        // 1. 先从头开始比，再从尾部开始比较  确定不一样的范围
        // 2. 从头对比，在从尾对比，如果有多余的或者新增的直接操作即可

        let i = 0 // 开始比对的索引
        let e1 = c1.length - 1 // 第一个数组的尾部索引
        let e2 = c2.length - 1 // 第二个数组的尾部索引

        /**
         * [a,b,c]
         * [a,b,d,e]
         * 到 c 的 位置终止了
         */
        while(i <= e1 && i <= e2){
            const n1 = c1[i]
            const n2 = c2[i]

            if(isSameVnode(n1, n2)){
                // 更新当前节点的 属性和儿子 (递归比较子节点)
                patch(n1, n2, el)
            }else{
                break
            }
            i++
        }

        /**
         * [a,b,c] -> [a,b,d,e]
         * 经过上述的比较之后，i = 1， [c] [d,e]
         * 从后往前比较
         */
        while(i <= e1 && i <= e2){
            const n1 = c1[e1]
            const n2 = c2[e2]

            if(isSameVnode(n1, n2)){
                // 更新当前节点的 属性和儿子 (递归比较子节点)
                patch(n1, n2, el)
            }else{
                break;
            }

            e1--;
            e2--;
        }

        /**
         * 同序列 2种特殊情况
         *  - 前少后多 同序列 加挂载 [a,b,c] -> [a,b,c,d,e] : i > e1 && i<= e2
         *  - 前多后少 同序列 卸载 [a,b,c,d,e] -> [a,b,c] : e
         */

        // 前少后多：i > e1 && i<= e2
        if(i > e1){
            if(i <= e2){
                // 有插入的部分，从后往前插入
                // 看一下下一个节点是否存在
                const nextPos = e2 + 1
                const anchor = c2[nextPos]?.el
                while(i <= e2){
                    patch(null, c2[i], el, anchor)
                    i++
                }
            }
        }else if(i > e2){ // 前多后少：i <= e1 && i > e2
            if(i <= e1){
                while(i <= e1){
                    unmount(c1[i], parentComponent)
                    i++
                }
            }
        }else{
            // 未知序列
            // [a,b, c,d,e, f,g] -> [a,b, e,c,d,h, f,g]
            let s1 = i;
            let s2 = i;

            // 做一个映射表用于快速查找， 看老的是否在新的里面还有，没有就删除，有的话就更新
            const keyToNewIndexMap = new Map()
            for(let j = s2; j <= e2; j++){
                const nextChild = c2[j]
                keyToNewIndexMap.set(nextChild.key, j)
            }

            // 要倒序插入的个数
            const toBePatched = e2 - s2 + 1
            // 新的元素在老的里的索引 映射表
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i]
                // 根据老的key 找到新的索引
                const newIndex = keyToNewIndexMap.get(prevChild.key)
                if(newIndex === undefined){
                    // 老的有，新的没有，直接卸载
                    unmount(prevChild, parentComponent)
                }else{
                    // 比较前后节点的差异，更新属性和儿子
                    // i 可能是0 的情况，为了保证 0 是没有对比过的元素，直接 i + 1
                    // [a,b, c,d,e, f,g] -> [a,b, e,c,d,h, f,g] -> [e,c,d,h] [5, 3, 4, 0]
                    newIndexToOldIndexMap[newIndex - s2] = i + 1
                    patch(prevChild, c2[newIndex], el)
                }
            }

            /**
             * [c,d,e] -> [e,c,d,h]， 如果按照下列的方法，需要执行4次插入操作，效率不高
             * 但其实 c,d 是可以复用
             */
            // for(let i = toBePatched - 1; i >= 0 ; i--){
            //     // [e, c, d, h]
            //     const nextIndex = s2 + i // 找到 ‘h’ 对应的索引
            //     const nextChild = c2[nextIndex]

            //     let anchor = c2[nextIndex + 1]?.el // 找它的下一个元素，作为参照物来进行插入

            //     // 这是一个新元素 直接创建插入到 当前元素的下一个即可
            //     if(newIndexToOldIndexMap[i] === 0){
            //         // 创建h 插入
            //         patch(null, nextChild, el, anchor)
            //     }else{
            //         hostInsert(nextChild.el, el, anchor)
            //     }
            // }

            /**
             * 使用 最长递增子序列 来进行优化, 求解不需要移动的元素有哪些
             */
            // 调整顺序，可以按照新的队列倒序插入insertBefore 通过参照物往前面插入        
            let increaseingSeq = getSquence(newIndexToOldIndexMap)
            let j  = increaseingSeq.length - 1

            for(let i = toBePatched - 1; i >= 0; i--){
                const newIndex = s2 + i

                let anchor = c2[newIndex + 1]?.el
                let child = c2[newIndex]

                if(newIndexToOldIndexMap[i] === 0){
                    patch(null, child, el, anchor)
                }else{
                    if(i != increaseingSeq[j]){
                        // 操作当前的 d 以d下一个作为参照物插入
                        hostInsert(child.el, el, anchor)
                    }else{
                        // 跳过不需要移动的元素， 为了减少移动操作
                        j--;
                    }
                }
            }
        }
    }

    const patchChildren = (n1, n2, el, anchor, parentComponent) => {
        // text array null
        const c1 = n1.children
        const c2 = n2.children

        const prevShapeFlag = n1.shapeFlag
        const shapeFlag = n2.shapeFlag

        // 1.新的是文本，老的是数组移除老的；
        // 2.新的是文本，老的也是文本，内容不相同替换
        // 3.老的是数组，新的是数组，全量 diff 算法
        // 4.老的是数组，新的不是数组，移除老的子节点
        // 5.老的是文本，新的是空
        // 6.老的是文本，新的是数组

        // 新的是文本
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
                // 移除老的
                unmountChildren(c1, parentComponent)
            }
            if(c1 !== c2){
                hostSetElementText(el, c2)
            }
        }else{ // 新的是数组 或 null
            // 旧的是数组
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
                if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
                    // 全量 diff
                    patchKeyedChildren(c1, c2, el, parentComponent)
                }else{
                    unmountChildren(c1, parentComponent)
                }
            }else{ // 旧的是文本 或 null
                if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN){
                    hostSetElementText(el, '')
                }
                if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
                    mountChildren(c2, el, anchor, parentComponent)
                }
            }
        }
    }

    // 初始化和 diff 在这里处理
    const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
        if(n1 === n2){
            // 两次渲染同一个元素直接跳过即可
            return;
        }

        if(n1 && !isSameVnode(n1, n2)){
            // 直接移除旧的dom 元素，初始化新的 dom 元素
            unmount(n1, parentComponent)
            n1 = null
        }

        const { type, shapeFlag, ref } = n2

        switch (type) {
            // renderer.render(h(Text,'jw handsome'),document.getElementById('app'))
            case Text:
                processText(n1, n2, container);
                break;
            case Fragment:
                processFragment(n1, n2, container, anchor, parentComponent);
                break;
            default:
                if(shapeFlag & ShapeFlags.ELEMENT){
                    // 对元素处理
                    processElement(n1, n2, container, anchor, parentComponent)
                }
        }
    }

    const unmount = (vnode, parentComponent)=>{
        const performRemove = () => {
            // 找到对应的真实节点将其卸载
            hostRemove(vnode.el)
        }

        if(vnode.type === Fragment){
            unmountChildren(vnode.children, parentComponent)
        }else{
            performRemove()
        }
    }

    // 多次调用 render 函数，会进行虚拟节点的比较，再进行更新
    const render = (vnode, container)=>{
        // 卸载当前容器中的 dom 元素
        if(vnode === null){
            if(container._vnode){
                unmount(container._vnode, null)
            }
        }else{
            // 将 虚拟节点 转换为 真实节点 进行渲染
            patch(container._vnode || null, vnode, container)
            container._vnode = vnode
        }
    }

    return {
        render
    }
}