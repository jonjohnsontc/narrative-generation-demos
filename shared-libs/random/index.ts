// Based off of Durstenfield's implementation of Fisher-Yates shuffle
// https://www.w3docs.com/snippets/javascript/how-to-randomize-shuffle-a-javascript-array.html
export const shuffleArray = function cloneAndShuffleArray(arr: any[]) {
    const newArr = Array.from(arr);
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]]
    }
    return newArr
}