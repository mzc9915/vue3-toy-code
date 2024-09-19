import { nodeOps } from './nodeOps'
import patchProp from './patchProp'

import { createRenderer, h, createVnode } from '@vue/runtime-core'

const rendererOptions = Object.assign({patchProp}, nodeOps)

export const render = (vnode, container) => {
    return createRenderer(rendererOptions).render(vnode, container)
}

export * from '@vue/runtime-core'
