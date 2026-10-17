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


let colors = ["Red", "Blue", "Green", "Yellow", "White"];

  colors.forEach((color , index) => {
    console.log(color , index);
    console.log(`${color} ${index}`);
  });