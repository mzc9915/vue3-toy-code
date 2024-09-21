const queue = []
let isFlushing = false
const resolvedPromise = Promise.resolve()

// 如果同时在一个组件中更新多个状态 job肯定是同一个
// 通过事件环的机制，延迟更新操作
export function queueJob(job) {
    if(!queue.includes(job)){
        // 去重
        queue.push(job)
    }

    if(!isFlushing){
        isFlushing = true
        resolvedPromise.then(()=>{
            isFlushing = false
            const copy = queue.slice(0)
            // 这里要先清空，防止在执行过程中在加入新的job, 先拷贝在执行
            queue.length = 0

            copy.forEach(job=>job())
            copy.length = 0
        })
    }
}