// ROR - Rotate Right, 16 bits
function ror(value, carry) {
    const newCarry = value & 0x01; // Extract rightmost bit as the new carry
    const newValue = ((value >> 1) | (carry << 15)) & 0xFFFF; // Shift right and insert carry into the leftmost bit
    return {
        newValue,
        newCarry
    };
}

// ROL - Rotate Left, 16 bits
function rol(value, carry) {
    const newCarry = (value >> 15) & 0x01; // Extract leftmost bit as the new carry
    const newValue = ((value << 1) | carry) & 0xFFFF; // Shift left and insert carry into the rightmost bit 
    return {
        newValue,
        newCarry
    };
}

function readFromResultInMemory(memory, index) {
    if (!memory[index]) memory[index] = 0;
    if (!memory[index + 1]) memory[index + 1] = 0;
    // each address is 8 bit, but we have the 16 bit on on this logic
    return (memory[index] & 0xFF) | (memory[index + 1] << 8);
}

// Writes an 16 bit value on two 8 bit memory addresses, little endian
function writeOnResultInMemory(memory, index, value) {
    if (!memory[index]) memory[index] = 0;
    if (!memory[index + 1]) memory[index + 1] = 0;
    const valH = (value >> 8) & 0xFF;
    const valL = value & 0xFF;

    memory[index] = valL;
    memory[index + 1] = valH;
}


/**
 * Given an array of tuples [bitCount, value], pack the values into a bit-packed array
 * according to the algorithm used by the game.
 * 
 * @param {*} values
 * @returns 
 */
function packBits(values) {
    const result = [];

    let bitsLeftInCurrentByte = 8; // corresponds to bits remaining. When 0, advance to next byte.
    let currentIndex = 0;         

    for (const [bitCount, value] of values) {
        let src = value  & 0xff;

        for (let i = 0; i < bitCount; i++) {
            // We read the last bit of src and shift src to the right to throw away the bit we just read
            let bit = src & 1;
            src = (src >>> 1);

            // expand result array if needed
            if (currentIndex >= result.length) {
                result.push(0x00);
            }

            let dest = result[currentIndex];
            // We move one bit to the right and write the bit on the 8 bit
            // In other words, the bit enters on the left
            dest = ((dest >>> 1) | (bit << 7));
            result[currentIndex] = dest;
            
            bitsLeftInCurrentByte--;
            if (bitsLeftInCurrentByte === 0) { // no more space, advance one byte
                currentIndex++;
                bitsLeftInCurrentByte = 8;
            }
        }
    }
    return result; 
}

/**
 * Calculates checksum, prepends mask, checksum and appends a terminator.
 * @param {*} bitPackedParams 
 * @returns 
 */
function addMaskAndChecksum(bitPackedParams) {
    const checksum = calculateChecksum(bitPackedParams);
    // 0 is a mask applied to the whole password, we use zero to skip this masking, on the game it is random to scramble the password
    return [0, checksum, ...bitPackedParams, 0]; 
}

/**
 * Given a bit-packed array and an array of bitCounts, unpack the values.
 * @param {*} values 
 * @param {*} bitCounts 
 * @returns 
 */
function unpackBits(values, bitCounts) {
    const result = [];
    let bitsLeftInCurrentByte = 8; // corresponds to bits remaining. When 0, advance to next byte.
    let currentIndex = 0;         

    for (const bitCount of bitCounts) {
        let dest = 0;
        for (let i = 0; i < bitCount; i++) {
            // expand result array if needed
            if (currentIndex >= values.length) {
                throw new Error("Not enough data to unpack");
            }

            let src = values[currentIndex];
            // We read the last bit of src
            let bit = src & 1;

            // We move dest one bit to the right and write the bit on the left
            dest = ((dest >>> 1) | (bit << (bitCount - 1)));

            // We move src one bit to the right to throw away the bit we just read
            src = (src >>> 1);
            values[currentIndex] = src;
            
            bitsLeftInCurrentByte--;
            if (bitsLeftInCurrentByte === 0) { // no more space, advance one byte
                currentIndex++;
                bitsLeftInCurrentByte = 8;
            }
        }
        result.push(dest);
    }
    return result; 
}

/**
 * Calculates and returns the checksum for the given data.
 * @param {*} data 
 * @returns 
 */
function calculateChecksum(data) {
    let sum = 0;
    for(let currentByte = 0; currentByte < data.length; currentByte++) {
        sum += data[currentByte];
        sum &= 0xFF;
    }
    return sum;
}

/**
 * Given a set of values, decode them according to the algorithm used by ISSD.
 * @param {*} passwordValues 
 * @returns 
 */
function decodeValues(passwordValues) {
    /*
    The loop increases multipleOfSixCounter by six on each pass
    From this we get the quotient and the remainder from a division by 8
    the quotient is the possition on the decoded password that will be changed
    and the remainder is the number of times we will rotate the bits
    since the position is a 8 bit value, and the value we are working with is 16 bit
    if the rotation results in a result that occupies more than 8 bits
    the next position will also be affected.
    This way there is a overlap and if a value is repeating, it is not that apparent
    The quotient also repeats due to the division, so it can also be that two values are 
    written to the same position (using bitwise OR)
    */
    let multipleOfSixCounter = 0;
    let passwordIndex = 0;
    let carry = 0;
    let result = [];
    do {
        const quotient = Math.floor(multipleOfSixCounter / 8); // it goes like 0 0 1 2 3 3 4 ...
        const remainder = multipleOfSixCounter % 8; // it goes like 0 6 4 2 0 6 4 2 repeating
        // so, for character 0 on password we shift the value 0 and apply to position 0
        // for character 1 we shift the value 1 right and 6 and apply to position 0
        // for character 3 we shift the value 1 right and 4 and apply to position 1
        // for character 4 we shift the value 1 right and 2 and apply to position 2
        let a = quotient; // A is the acumulator registry
        let y = remainder; // Y is another registry, used as index for memory accesses (X is anotehr one)
        let currentChar = passwordValues[passwordIndex];

        if (currentChar > biggestPossibleChar) { 
            if (currentChar != 0xff) {// invalid password value
                throw new Error("Invalid password value " + currentChar + " at index " + passwordIndex);
            }
            break;  // string end marker is 0xff, so we can stop decoding
        }
        
        ({ newValue, newCarry } = ror(currentChar, carry)); // rotate right
        a = newValue;
        carry = newCarry; // we need the carry to rotate, on the SNES cpu this is the flag C
        while (y >= 0) { // rotate left the number of times we got from the division remainder
            ({ newValue, newCarry } = rol(a, carry));
            a = newValue;
            carry = newCarry;
            y--;
        }
        a = a | readFromResultInMemory(result, quotient); // if there is already something on the position, the result is the OR
        writeOnResultInMemory(result, quotient, a); // maybe A has values on the high part so we write it in a way the next position gets the high value 

        // print result, values in binary for debugging
        // const resultInBinary = result.map(x => x.toString(2).padStart(8, '0')).join(' ');
        // console.log("Current char: " + currentChar.toString(16) + " Quotient: " + quotient + " Remainder: " + remainder + " Result: " + result.map(x => x.toString(16).padStart(2, '0')).join(' ') + " Binary: " + resultInBinary);

        passwordIndex++; // next char from password
        multipleOfSixCounter += 6; // next 6 multiplier
    } while (multipleOfSixCounter < 360); // from the ISSD code, we know the password is 60 characters long
    return result;
}

/**
 * Write to index or expand array until write is possible
 */
function writeToArray(array, index, value) {
    while (index >= array.length) {
        array.push(0);
    }
    array[index] = value;
}

/**
 * Bit shift right a 16 bit value, rotating the bit.
 * Example: 0b00000000_00000001 rotated 1 becomes 0b10000000_00000000
 * @param {*} value 
 * @param {*} bitShift 
 * @returns 
 */
function bitShiftRightWithCarry(value, bitShift) {
    let shiftedValue = value & 0xffff;
    for(let i = 0; i < bitShift; i++) {
        const carry = shiftedValue & 0x01; // Extract rightmost bit as the new carry
        shiftedValue >>= 1; // Shift right
        if (carry) {
            shiftedValue |= 0x8000; // If there was a carry, set the leftmost bit
        }
    }
    return shiftedValue;
}

/**
 * Given a set of values, encode them according to the algorithm used by ISSD.
 * We can think encoding as spreading the bits of a single value.  
 * Decoding uses a sixCounter, dividing it by eigth and using the division result as the index to write and the remainder as the bitshift.
 * So, the division goes like: 0, 0, 1, 2, 3, 3
 * And the remainder: 0, 6, 4, 2, 0, 6
 * For example, the first value gets written on position 0 and 1 because the division goes 0, 0 (with shifts 0 and 6)
 * the second value gets written only on position 1 (because the index does not repeat) with shift 4
 * The encoded values are the password chars, and that means there is a maximum limit of 62 because the last char is chars[62] == '♥'
 * Many encoded are possible, as for example (ignoring the shif) [0b10, 0b01] is the same as [0b00, 0b11]
 * We are just generating valid password in the simplest way possible.
 * Since the only constraint is maximum size, we can try writing it to the first byte, and if it does't fit and there is an extra byte, we try 
 * moving the high part to the next byte, if there is one.
 * That means that there are values that cannot be encoded since we cannot have a byte bigger than 62 (after the shift)
 * 
 * So the basic algorithm is:
 * Get next value from values to encode
 * Get next index on result array
 * Get next index from the sixCounter
 * Get next bit right shift from the sixCounter
 * Do current shift
 * Is the value less or equals 62?
 * Yes - write it to result, increase sixCounter and write 0 on result until index from sixCounter increases
 * example, first value has no shift (sixCounter == 0), if the value is 1, we write [1, 0] (because 16 bit little endian), then increase sixCounter (+6), 
 * realize it is still same index and write [1,0] 
 * No - We use 0b11000000 and shift left with the current shift (example 4 0b00001100_00000000)
 * 
 * We do AND 0b11000000 (to get the 2 highest bits), and an AND to 0b00111111 get the lower part to write on results
 * We increase the six counter, if the index increases we throw an exception (value can't be decoded)
 * if the index can be increased, we get the value from the first mask, shift the current sixCounter and write 
 * the value if is less or equals 62, if more, we fail
 * Increase counts and loop until the end
 * 
 * @param {*} values 
 * @returns 
 */
function encodeValues(values) {
    let multipleOfSixCounter = 0;
    let result = [];
    let resultCursor = 0;
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        
        // it goes like 0 0 1 2 3 3 4 ...
        const valuesForIndex = Math.floor(multipleOfSixCounter / 8); 
        // if it is the same, it means the current index and next one are used for a single decoded value
        // Also, max repetition is 2
        const nextSlotIndex = Math.floor((multipleOfSixCounter + 6) / 8); 
        const cantUseTwoBytes = valuesForIndex != nextSlotIndex;
        const canUseTwoBytes = valuesForIndex == nextSlotIndex;

        const bitShift = multipleOfSixCounter % 8; // it goes like 0 6 4 2 0 6 4 2 repeating
         
        // value is 8 bits, but shift is 16 bits
        const shiftedValue = bitShiftRightWithCarry(value << 1, bitShift);

        // Is the value shifted greater than the maximun?
        if (shiftedValue > biggestPossibleChar) {
            if (cantUseTwoBytes) {
                // Transfer excess
                throw new Error("Value " + value + " cannot be encoded, it is too big after shift"); 
            }
            // TODO: Take care of the edge c    ases
            throw new Error("NOT IMPLEMENTED"); 
        } else {
            // Write high part (remember, little endian)
            writeToArray(result, resultCursor, result[resultCursor] | (shiftedValue & 0xff));
            resultCursor++;
            // Write low part
            writeToArray(result, resultCursor, ((shiftedValue >> 8) & 0xff));
            // result cursor is not increased, as the next value will be ORed
            if (canUseTwoBytes) {
                resultCursor++;
                multipleOfSixCounter += 12; // next 6 multiplier
            } else {
                multipleOfSixCounter += 6; // next 6 multiplier
            }
        }
    }   
    return result.concat([0xff]); // concatenate the terminator
}

function generatePassword(checksum, mask, values) {
    // Implementation goes here

    // Steps
    // pack values into bit-packed array
    // add checksum to array with value 0
    // calculate checksum and fix it on the array
    // concatenate 0 as the terminator
    // encode the array using the algorithm used by the game, which is the reverse of the decoding algorithm
    // convert result to string
}


// From here, it will be deleted in the future

/**
 * Given an array of tuples [bitCount, value], pack the values into a bit-packed array
 * according to the algorithm used by the game.
 * @param {*} values 
 * @returns 
 */
function bitPackValues(values) {
    const result = packBits(values);
    // concatenate the two bytes for randomizer and checksum and last byte is the terminator
    const finalResult = fixChecksum([0,0].concat(result).concat([0]));
    return finalResult; 
}

/**
 * Converts an encoded array to a password string.
 * Given an array of encoded values, convert them to a password string using the chars mapping.
 * Example: [1,2,3,4,5,6,7,8] becomes "BCDFG HJKL"
 * @param {*} encodedValues 
 * @returns 
 */
function encodedValuesToPasswordString(encodedValues){
    let passAsString = "";
    for (let i = 0; i < encodedValues.length; i++) {
        const currentValue = encodedValues[i];
        if (currentValue > biggestPossibleChar) {
            throw new Error("Invalid encoded value " + currentValue + " at index " + i);
        }
        const currentChar = chars[currentValue]; 
        passAsString += currentChar;
        if (i % 5 === 4) passAsString += " ";
        if (i % 20 === 19) passAsString += "\n";
        
    }
    return passAsString;
}

/**
 * Takes a password string and converts it to a decoded array.
 * Can include spaces, they will be ignored
 * @param {*} passwordString 
 * @returns 
 */
function passwordStringTo8bitArray(passwordString) {
    // Remove spaces and split by special character markers
    const parts = passwordString.replace(/\s+/g, '').split(/[()]/);
    let passAsEightBitArray = [];

    for (const part of parts) {
        if (specialChars[part] !== undefined) {
            // If part is a special character, get its value from specialChars
            passAsEightBitArray.push(specialChars[part]);
        } else {
            // Otherwise, map each character to its index in chars
            for (const char of part) {
                const index = chars.indexOf(char);
                if (index === -1) {
                    passAsEightBitArray.push(specialChars[char]);
                } else {
                    passAsEightBitArray.push(index);
                }
            }
        }
    }
    // Add the final value of 255
    passAsEightBitArray.push(255);
    return passAsEightBitArray;
}