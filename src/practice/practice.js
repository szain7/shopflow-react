// JavaScript Fundamentals practice
console.log("10" + 5); // 105
console.log("10" - 5); // 5
console.log("10" * 5); // 50
console.log("10" / 5); // 2
console.log("10" % 5); // 0
console.log("10" ** 5); // 100000
console.log("10" ** 5); // 100000
console.log(5+ " 10"); // 510

// variable assignment
const developer = "Frontend Developer";
console.log("Role:", developer);

// function greet
function greet(name) {
  return `Welcome, ${name}`;
}

console.log(greet("Zain"));

// Modulus function
const isEven = (number) => {
  return number % 2 === 0;
}
console.log(isEven(10)); // true
console.log(isEven(11)); // false

// check result & typeof
let price = "250";
let quantity = 2;
let total = price + quantity;
console.log(total); //2052
console.log(typeof total); //string 

//map function
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

//scope practice
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

//Hoisting
console.log(a); 
var a = 5; //undefined

//console.log(b); 
//let b = 5; //ReferenceError

//const and Reassignment
const cPrice = 100;
console.log(cPrice); // 100
//cPrice = 200; // TypeError
console.log(cPrice); // Never executes

//const prevents reassignment, not object mutation.
const user = {
  name: "Ali"
};

user.name = "Ahmed"; // Allowed
console.log(user.name); // Ahmed
//user = { name: "Sara" }; // TypeError


const users = ["Ali", "Ahmed"];
users.push("Sara");
console.log(users.length);
console.log(users[2]);