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

// var Hoisting
console.log(a);
var a = 10;

function test() {
  console.log(a);
  var a = 20;
  console.log(a);
}

test();
console.log(a);

//let and Temporal Dead Zone (TDZ)
let x = 100;

function tbz() {
  //console.log("A", x); //ReferenceError: Cannot access 'x' before initialization
  let x = 200;
  console.log("B", x);
}

tbz();
console.log("C", x);

//const and Reassignment
const hoistNum = 100;

function test2() {
    const hoistNum = 200;
    console.log("A", hoistNum);

    const user = {
        name: "Ali"
    };

    user.name = "Ahmed";
    console.log("B", user.name);
    //hoistNum = 30; //TypeError: Assignment to constant variable.
    console.log("C", hoistNum);
}

test2();
console.log("D", hoistNum);

//Write a function returning a number or an error message
const validatePrice = priceText => {
    if (typeof priceText !== "number") {
        return "Error: Price is not a number";
    }
    //return Number(priceText);
};

console.log(validatePrice("200")); 


//Callstack with an Error
function saveCustomer() {
    console.log("Customer Saved");
}

function validateCustomer(customer) {
    console.log("Validating...");

    //console.log(customer.name.toUpperCase()); 
    //Error stops to execute saveCustome()
    
    saveCustomer();
}

function submitCustomer() {
    console.log("Submitting...");

    const customer = {
        name: null
    };

    validateCustomer(customer);

    console.log("Submission Complete");
}

submitCustomer();


//Closure
function outer(){
  let count = 2;

  function inner(){
    count = count * 2;
    console.log(count);
  }
  return inner;
}
const countResult = outer();
countResult();


//try/catch example 1

try {
  let count = 10;
  console.log("A");
  console.log("B");
  count = 5;
  if (count < 10){
    throw new Error ('Count is below 10');
  }
  console.log("C");
} catch (error) {
  console.log(error.message);
}
console.log("D");


//try/catch example 2
let email = "zain@gmal.com";

try {
  if (email === "") {
    throw new Error("Email is required");
  }

  console.log("Customer is valid");
} catch (error) {
  console.log(error.message);
}


//try/catch example 3
let productPrice = -200;

try {
  if (productPrice <= 0) {
    throw new Error("Invalid product price");
  }

  console.log("Product price is valid");
} catch (error) {
  console.log("Error:", error.message);
}



function validCustomer(email) {
  if (email === "") {
    throw new Error("Email is invalid");
  }
}

function subCustomer(email) {
  try {
    validCustomer(email);

    console.log("Customer is valid");
  } catch (error) {
    console.log("Error:", error.message);
  }
}

// Test 1: Invalid email
subCustomer("");

// Test 2: Valid email
subCustomer("test@example.com");


// async function getUser() {
//   try {
//     const response = await fetch("https://jsonplaceholder.typicode.com/users/1");

//     if (!response.ok) {
//       throw new Error("Failed to load user");
//     }

//     const user = await response.json();

//     console.log("User:", user.name);

//   } catch (error) {
//     console.log("Error:", error.message);
//   }
// }

// getUser();


fetch("https://jsonplaceholder.typicode.com/users/1")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    return response.json();
  })
  .then((user) => {
    console.log(user.name);
  })
  .catch((error) => {
    console.log("Error:", error.message);
  });


const product = {
  id: 1,
  name: "Coffee",
  price: 450,
  details: {
    stock: 10,
    category: "Drinks"
  }
};

const updatedProduct = {
  ...product,
  price: 600,
   details: {
    ...product.details,
    stock: 20
   }
}

console.log(product.price);                // 450
console.log(product.details.stock);        // 10

console.log(updatedProduct.price);         // 600
console.log(updatedProduct.details.stock); // 20

console.log(product === updatedProduct);                 // false
console.log(product.details === updatedProduct.details); // false