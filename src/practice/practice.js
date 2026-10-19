// JavaScript Fundamentals practice

console.log("10" + 5); // 105
console.log("10" - 5); // 5
console.log("10" * 5); // 50
console.log("10" / 5); // 2
console.log("10" % 5); // 0
console.log("10" ** 5); // 100000
console.log("10" ** 5); // 100000
console.log(5+ " 10"); // 510

const developer = "Frontend Developer";
console.log("Role:", developer);

function greet(name) {
  return `Welcome, ${name}`;
}

console.log(greet("Zain"));

const isEven = (number) => {
  return number % 2 === 0;
}
console.log(isEven(10)); // true
console.log(isEven(11)); // false


let price = "250";
let quantity = 2;
let total = price + quantity;
console.log(total); //2052
console.log(typeof total); //string 



const numbers = [2, 4, 6];
const result = numbers.map((num) => {
    return num + 5;
});
console.log(result); //7, 9, 11


const prices = [100, 200, 300];
const result2 = prices.map((price) => {
  if (price > 150) {
    return price * 2;
  }
});
console.log(result2);// [undefined, 400, 600]


const prodNumbers = [2, 5, 8, 10];
const prodResult = prodNumbers
  .filter((num) => num > 5)
  .map((num) => num * 2);

console.log(result); // 7, 9, 11


let scopePrice = 100;
function updatePrice() {
  let price = 200;
  if (true) {
    price = 300;
  }
  console.log(price);
}
updatePrice();
console.log(scopePrice); //300, 100