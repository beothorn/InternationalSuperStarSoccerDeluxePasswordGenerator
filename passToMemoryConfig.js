//const passwordString = "BCDF(note)G";
const passwordString = "P(note)(diamonds)3n (division)*DN< *3P<* 3P<*3 P<*3N <L";
//const passwordString = "CDF";

const chars = "BCDFGHJKLMNPQRSTVWXYZbdfghjnqrt012345678-+  =%<>~$:\"?!  *#      ";
const specialChars = {
  "division": 42,
  "pie": 43,
  "arrowDown": 54,
  "arrowUp": 55,
  "note": 58,
  "star": 59,
  "spades": 60,
  "diamonds": 61,
  "clubs": 62,
  "hearts": 63,
};

// Function to process the password string and generate the password array
function generatePassword(passwordString) {
  // Remove spaces and split by special character markers
  const parts = passwordString.replace(/\s+/g, '').split(/[()]/);
  let password = [];

  for (const part of parts) {
    if (specialChars[part] !== undefined) {
      // If part is a special character, get its value from specialChars
      password.push(specialChars[part]);
    } else {
      // Otherwise, map each character to its index in chars
      for (const char of part) {
        const index = chars.indexOf(char);
        if (index !== -1) {
          password.push(index);
        }
      }
    }
  }

  // Add the final value of 255
  password.push(255);

  return password;
}

const password = generatePassword(passwordString);
// for BCDFG is [64, 32, 12, 4,] or 0x40, 0x20, 0x0c, 0x04, 0x00
let result = [];
let carry = 0;
let sixBitCounter = 0;
let passwordIndex = 0;
let a = 0;
let y = -1;

function printMemory(){
    let memory = "";
    for(let i = 0; i < result.length ;i++) {
        if(result[i]) {
            memory +=  ('0' +  result[i].toString(16)).slice(-2) + " "; 
        }
    }
    
    console.log("Current memory "+memory);
}

function toHex(value) {
    return "0x"+ ('0' +  value.toString(16)).slice(-2);
}

function printMemoryBinary(){
    let memory = "";
    for(let i = 0; i < result.length ;i++) {
        if(result[i]) {
            memory +=  ('0' +  result[i].toString(2)).slice(-8) + " "; 
        }
    }
    
    console.log("Current memory "+memory);
}

function printBinaryLE(value) {
    // Ensure the value is represented as a 16-bit binary number
    let binary = value.toString(2).padStart(16, '0');

    // Split the binary into two 8-bit parts for little-endian representation
    let lowByte = binary.slice(8, 16); // Lower 8 bits
    let highByte = binary.slice(0, 8); // Higher 8 bits

    // Combine in little-endian order
    binary = lowByte + " " + highByte + " - "+ toHex(value & 0xFF) + " " +  toHex((value >> 8) & 0xFF);

    return binary;
}

function printBinary(value) {
    // Ensure the value is represented as a 16-bit binary number
    let binary = value.toString(2).padStart(16, '0');

    // Split the binary into two 8-bit parts for little-endian representation
    let lowByte = binary.slice(8, 16); // Lower 8 bits
    let highByte = binary.slice(0, 8); // Higher 8 bits

    binary = highByte + " " + lowByte + " - " +  toHex((value >> 8) & 0xFF) + " "+ toHex(value & 0xFF);

    return binary;
}

function ror(value) {
    const newCarry = value & 0x01; // Extract rightmost bit as the new carry
    value = (value >> 1) | (carry << 15); // Shift right and insert carry into the leftmost bit
    carry = newCarry; // Update global carry
    return value & 0xFFFF; // Ensure 16-bit value
}
function rol(value) {
    const newCarry = (value >> 15) & 0x01; // Extract leftmost bit as the new carry
    value = ((value << 1) | carry) & 0xFFFF; // Shift left and insert carry into the rightmost bit
    carry = newCarry; // Update global carry
    return value & 0xFFFF; // Ensure 16-bit value
}

function readFromResultInMemory(index){
    if(!result[index]) result[index] = 0;
    if(!result[index+1]) result[index+1] = 0;
    // each address is 8 bit, but we have the 16 bit on on this logic
    const value = (result[index] & 0xFF) | (result[index+1]<<8);
    return value;
}

function writeOnResultInMemory(index, value){
    if(!result[index]) result[index] = 0;
    if(!result[index+1]) result[index+1] = 0;
    const valH = (value >> 8) & 0xFF;
    const valL = value & 0xFF;
    
    result[index] = valL;
    result[index+1] = valH;
}

do {
    const quotient = Math.floor(sixBitCounter/8);
    const remainder = sixBitCounter % 8;
    console.log("On pass "+ (passwordIndex + 1) + ":");
    console.log("- The character value is "+ password[passwordIndex]);
    console.log("- The shift will be the remainder from "+sixBitCounter+"/8 which is "+ remainder);
    console.log("- The memory position is the quotient from "+sixBitCounter+"/8 which is "+ quotient);
    a = quotient;
    y = remainder;
    let currentChar = password[passwordIndex];
    
    if(currentChar > 64) {
        break;
    }
    a = ror(currentChar);
    while(y >= 0){
        a = rol(a);
        y--;
    }
    console.log("The value "+password[passwordIndex]+" represented in 16 bits little endian ");
    console.log(printBinaryLE(password[passwordIndex]));
    console.log("Shifted left "+ remainder + " times" );
    console.log(printBinaryLE(a));
    console.log("An or is done with the value already in address "+quotient+":");
    console.log(printBinaryLE(password[passwordIndex]));
    console.log(printBinary(readFromResultInMemory(quotient)));
    console.log("____________________");
    a =  a | readFromResultInMemory(quotient);
    console.log(printBinaryLE(a));
    console.log("Final value written on position "+quotient+" and "+ (quotient + 1) +": "+ toHex(a & 0xFF)) + " "+   toHex((a >> 8) & 0xFF);
    writeOnResultInMemory(quotient, a);
    printMemory();
    passwordIndex++;
    sixBitCounter += 6;
    console.log("Counter increases by 6: "+ sixBitCounter);
}while(sixBitCounter < 360);

printMemory();
printMemoryBinary();
