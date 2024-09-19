function quickSort<T>(arr: T[]): T[] {
    if (arr.length <= 1) {
        return arr;
    }

    const pivot = arr[Math.floor(arr.length / 2)];
    const left: T[] = [];
    const right: T[] = [];
    const equal: T[] = [];

    for (const element of arr) {
        if (element < pivot) {
            left.push(element);
        } else if (element > pivot) {
            right.push(element);
        } else {
            equal.push(element);
        }
    }

    return [...quickSort(left), ...equal, ...quickSort(right)];
}

// Example usage:
// const unsortedArray: number[] = [3, 6, 8, 10, 1, 2, 1];
// const sortedArray: number[] = quickSort(unsortedArray);
// console.log(sortedArray); // Output: [1, 1, 2, 3, 6, 8, 10]
