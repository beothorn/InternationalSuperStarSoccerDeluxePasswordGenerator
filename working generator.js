//const passwordString = "BCDF(note)G";
const passwordString = "P(note)(diamonds)3n (division)*DN< *3P<* 3P<*3 P<*3N <L";
//const passwordString = "CDF";

const chars = "BCDFGHJKLMNPQRSTVWXYZbdfghjnqrt012345678-+  =%<>~$:\"?!  *#      ";
const specialChars = {
  "division": 42,
  42: "(division)",
  "pi": 43,
  43: "(pi)",
  "arrowDown": 54,
  54: "(arrowDown)",
  "arrowUp": 55,
  55: "(arrowUp)",
  "note": 58,
  58: "(note)",
  "star": 59,
  59: "(star)",
  "spades": 60,
  60: "(spades)",
  "diamonds": 61,
  61: "(diamonds)",
  "clubs": 62,
  62: "(clubs)",
  "hearts": 63,
  63: "(hearts)",
};

let result = [];
let carry = 0;
let sixBitCounter = 0;
let passwordIndex = 0;
let a = 0;
let y = -1;

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

function getGeneratedConfigForPasswordArray(passNumberArray) {
    result = [];
    carry = 0;
    sixBitCounter = 0;
    passwordIndex = 0;
    a = 0;
    y = -1;
    do {
        const quotient = Math.floor(sixBitCounter/8);
        const remainder = sixBitCounter % 8;
        a = quotient;
        y = remainder;
        let currentChar = passNumberArray[passwordIndex];
        
        if(currentChar > 64) {
            break;
        }
        a = ror(currentChar);
        while(y >= 0){
            a = rol(a);
            y--;
        }
        a =  a | readFromResultInMemory(quotient);
        writeOnResultInMemory(quotient, a);
        passwordIndex++;
        sixBitCounter += 6;
    }while(sixBitCounter < 360);
    return result;
}


let demo = false;

if(demo){
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
}

function notEquals(a, b) {
    if(a.length != b.length) {
        return true;
    }
    for (let index = 0; index < a.length; index++) {
        if(a[index] !== b[index]) return true;
    }
    return false;
}

function genPassForConfig(expectedConfig) {
    let currentPassword = [0];
    let config = getGeneratedConfigForPasswordArray(currentPassword.concat(0xff));

    let count =0;
    while(notEquals(config, expectedConfig)) {
        count++;
        if(count > 30000){
            console.log("infinite loop");
            console.log(currentPassword);
            let memory = "";
            for(let i = 0; i < config.length ;i++) {
                    memory +=  toHex(config[i]) + " ";
            }
            console.log(memory);
            memory = "";
            for(let i = 0; i < currentPassword.length ;i++) {
                    memory +=  currentPassword[i] + " ";
            }
            console.log(memory);
            return null;
        }
        let currentPasswordCharIndex = currentPassword.length - 1;
        let previousIndex = Math.floor(((currentPasswordCharIndex - 1) * 6) / 8);
        let currentIndex = Math.floor((currentPasswordCharIndex * 6) / 8);
        let nextIndex = Math.floor(((currentPasswordCharIndex + 1) * 6) / 8);
        
        if(config[currentIndex] === expectedConfig[currentIndex]) {
            if(config.length == expectedConfig.length){
                break;
            }
            currentPassword = currentPassword.concat(0);
        } else {
            let lastChar = currentPassword.pop();
            let nextChar = lastChar + 1;
            if(nextChar > 63) {
                // We need to know if next number may be able to fix value
                // If yes, we go back to zero and continue
                if(currentIndex === nextIndex) {
                    currentPassword = currentPassword.concat(0);
                    currentPassword = currentPassword.concat(0);
                } else {
                    if(previousIndex === currentIndex){
                        currentPassword[currentPassword.length - 1] = currentPassword[currentPassword.length - 1]+1;
                        currentPassword = currentPassword.concat(0);
                    }else{
                        // lets hope the previous one will fix it
                        currentPassword[currentPassword.length - 1] = currentPassword[currentPassword.length - 1]+1;
                    }
                }
            } else {
                currentPassword = currentPassword.concat(nextChar);
            }
        }
        
        config = getGeneratedConfigForPasswordArray(currentPassword.concat(0xff));
    }
    return currentPassword;
}

// let genPass = genPassForConfig([0x8b, 0xde, 0x8b, 0x9b, 0x8a, 0x0b, 0x8a, 0x8b, 
//                               0x8b, 0x8b, 
//                               0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 
//                               0x8a, 0x8b, 0x00])

function fixIssDeluxePasswordSimple(arr) {
  // 1) Force the first byte to 0x8B (satisfies the typical bit checks).
  arr[0] = 0x8B;
  
  // 2) Compute the partial sum over bytes [2..19] (18 bytes) in 8-bit arithmetic.
  let partialSum = 0;
  for (let i = 2; i <= 19; i++) {
    partialSum = (partialSum + (arr[i] & 0xFF)) & 0xFF;
  }
  
  // 3) Fix arr[1] so that (arr[0] + partialSum) == arr[1] in 8-bit.
  arr[1] = (arr[0] + partialSum) & 0xFF;
  
  return arr;
}

/**
 * Fixes an ISS Deluxe password array so that:
 *   - Certain bits in the first 16-bit word are forced set (mask).
 *   - The partial-sum checksum at arr[1] matches (arr[0] + sum of bytes [2..19]).
 * 
 * @param {number[]} arr - A (possibly larger) array of bytes. 
 * @returns {number[]} The same array, modified in place.
 */
function fixIssDeluxePassword(arr) {
  // 1) Force required bits in the first word:
  //    bits #1, #2, #5, #10, #12 must be set => mask = 0x141E (binary 0001010000011110).
  //    Low byte bits: 0x1E (bits #1, #2, #3, #4)
  //    High byte bits: 0x14 (bits #2, #4 in the high byte)
  if (arr.length < 2) {
    throw new Error("Need at least 2 bytes to set the bitmask on arr[0..1].");
  }
  const REQUIRED_BITS_MASK = 0x141E; // sets 0x0020, 0x0004, 0x0002, 0x0400, 0x1000
  let word16 = (arr[0] & 0xFF) | ((arr[1] & 0xFF) << 8);
  word16 |= REQUIRED_BITS_MASK;
  arr[0] = word16 & 0xFF;
  arr[1] = (word16 >> 8) & 0xFF;

  // 2) Compute partial sum over bytes [2..19] to maintain the classic ISSD checksum logic:
  //    partialSum + arr[0] == arr[1] (8-bit).
  let partialSum = 0;
  const startIndex = 2;
  // We'll sum up to index 19 (which is 18 bytes total: 2..19 inclusive).
  // If array is shorter, we'll just do up to whatever is available.
  const endIndex = Math.min(arr.length - 1, 19);

  for (let i = startIndex; i <= endIndex; i++) {
    partialSum = (partialSum + (arr[i] & 0xFF)) & 0xFF;
  }

  // 3) Fix arr[1] to match the final condition: arr[1] = (arr[0] + partialSum) & 0xFF
  arr[1] = ((arr[0] & 0xFF) + partialSum) & 0xFF;

  // 4) Optionally zero out the last 4 bytes if you want to mimic typical ISSD trailing zeros.
  //    Uncomment this if desired:
  /*
  for (let i = arr.length - 4; i < arr.length; i++) {
    if (i >= 0) arr[i] = 0;
  }
  */

  return arr;
}



// first byte checks

// let genPass = genPassForConfig(fixIssDeluxePasswordSimple([0x8c, 0xde, 0x8b, 0x9b, 0x8a, 0x0b, 0x8a, 0x8b, 
//                               0x8b, 0x8b, 
//                               0x8b, 0x8e, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 
//                               0x8a, 0x8b, 0x00]))

//let genPass = genPassForConfig(fixIssDeluxePasswordSimple([0x8b, 0xde, 0x8b, 0x9b, 0x8a, 0x0b, 0x8a, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8b, 0x8a, 0x8b, 0x00, 0x00, 0x00, 0x00]))

let genPass = genPassForConfig(fixIssDeluxePasswordSimple([0x8b, 0xde, 
0x8b, 
0x9b, 
0b11111111, // Cleared games ?
0x0b, 
0x8a, 
0x8b, 
0x8b, 
0x8b, 
0x8b, 
0x8b, 
0x8b, 
0x8b, 
0x8b, 
0x8b, 
0x8b, 
0x8b, 
0x8a, 
0x8b, 
0x00]))


let passAsString = "";
for (let i = 0; i < genPass.length; i++) {
    if( chars[genPass[i]] === " "){
        passAsString += specialChars[genPass[i]];
    }else{
        passAsString += chars[genPass[i]];
    }
    if(i % 5 == 4) passAsString += " ";
}

console.log(passAsString)

