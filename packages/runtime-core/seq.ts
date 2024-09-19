/**
 * 维持一个 "最佳可能序列"
 * @param arr 
 * @returns 
 */
export default function getSquence(arr) {
    // 算法的核心思想是，维持一个 "最佳可能序列"
    // 中间可能会有元素替换操作，但并没有改变"最佳可能序列"的长度，
    // 相反，交换操作使 对应长度的递增子序列的最小尾元素变小了，这使得后续有更多的机会可以添加新元素到"最佳可能序列"末尾，扩展成更长的序列
    // 这个"最佳可能序列"不一定是实际的LIS，但它的长度在上述操作下，最终一定等于最长递增子序列的长度。

    // 保存最长递增子序列的索引
    const result = [0] 
    const p = result.slice(0) // 存放索引
    
    let start, end, middle;
    let resultLastIndex;

    const len = arr.length

    for (let i = 0; i < len; i++) {
        const arrI = arr[i]

        // 为了vue3, 0 没有意义, 需要忽略掉数组中 0 的情况  [5,3,4,0] 
        if(arrI !== 0){
            resultLastIndex = result[result.length - 1]

            // 拿出结果集中的最后一项，和当前项比较
            if(arr[resultLastIndex] < arrI){
                // 正常放入的时候，前一个节点索引就是result中的最后一个
                p[i] = result[result.length - 1]
                result.push(i)
                // 当前的值 比上一个人大 ，直接push ，并且让这个人得记录他的前一个
                continue;
            }

            // 二分查找优化, 找到比当前值大的那一个
            start = 0;
            end = result.length - 1;
            while(start < end){
                middle = ((start + end) / 2) | 0 // 向下取整

                if(arr[result[middle]] < arrI){
                    start = middle + 1
                }else{
                    end = middle
                }
            }

            // 找到结果集 中 比当前这一项大的数
            if(arrI < arr[result[start]]){ // 如果相同 或者 比当前的还大就不换了
                if(start > 0){
                    // 将它替换的前一个记住
                    p[i] = result[start - 1]
                }
                result[start] = i
            }
        }
    }
    
    // 前驱节点追溯
    // p 为前驱节点的列表，需要根据最后一个节点做追溯
    let l = result.length
    let last = result[l - 1]
    while(l-- > 0){
        // 倒序向前找，因为p的列表是前驱节点
        result[l] = last
        last = p[last]
    }

    return result
}

// [2,3,1,5,6,8,7,9,4]
// 2 : 2 的前一个是 null
// 2 3 : 3 的前一个是 2
// 1 3 : 1 的前一个是 null
// 1 3 5 : 5 的前一个是 3
// ...
// 1 3 4 6 7 9 : 9 的前一个是 7
