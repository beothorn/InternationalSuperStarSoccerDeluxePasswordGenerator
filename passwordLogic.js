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
        sum += data[currentByte] & 0xff;
        sum &= 0xff;
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
 * Bit shift right a 8 bit value, rotating the bit.
 * Example: 0b00000000_00000001 rotated 1 becomes 0b10000000_00000000
 * @param {*} value 
 * @param {*} bitShift 
 * @returns 
 */
function bitShiftRightEightBitsWithCarry(value, bitShift) {
    let shiftedValue = value & 0xff;
    for(let i = 0; i < bitShift; i++) {
        const carry = shiftedValue & 1; // Extract rightmost bit as the new carry
        shiftedValue >>= 1; // Shift right
        if (carry) {
            shiftedValue |= 0b1000_0000; // If there was a carry, set the leftmost bit
        }
    }
    return shiftedValue;
}

/**
 * Values is supposed to be an array of bytes, representing 16 bits little endian.
 * This will encode values in a six bit array.
 * This array can then be converted to a password string using the chars mapping.
 * 
 * @param {*} values 
 * @returns 
 */
function encodeValues(values) {
    if (values.length < 2) throw new Error("values too short");

    const terminator = values[values.length - 1];
    if (terminator !== 0x00) {
        throw new Error("Invalid terminator " + terminator.toString(16));
    }

    // Data bytes that actually get encoded (exclude trailing 0x00 terminator)
    const data = values.slice(0, -1);

    // data is interpreted as an array 16 bits Little endian, with each array item having a byte
    const totalBits = data.length * 8;
    // We will break it down in 6 bit chars (our characters have 6 bits of information, since we have 64 chars)
    const passCharCount = totalBits / 6;

    const out = [];
    for (let charCursor = 0; charCursor < passCharCount; charCursor++) {
        const bitPos = charCursor * 6;
        const byteIndex = bitPos >> 3;      // floor(bitPos / 8)
        const shift = bitPos & 7;           // bitPos % 8

        // We read two values of 8 bits, this will be our 16 bit value, little endian, so the first byte is the low part and the second byte is the high part
        const b0 = data[byteIndex] ?? 0;
        const b1 = data[byteIndex + 1] ?? 0;

        // Encoding falls mainly on three cases
        // cccc_bbbb bb_aaaaaa - b0 >> 0 bb_aaaaaa
        // cccc_bbbb bb_aaaaaa - b0 >> 6 0000bb | b1 << (8-6) cc_bbbb00 ORed is bbbbbb 
        // dddddd_cc cccc_bbbb - b0 >> 4 0000_cccc | b1 << (8-4) dd_cc0000 ORed is cccccc
        // ff_eeeeee dddddd_cc - b0 >> 2 00dddddd

        // Extract 6 bits starting at (byteIndex, shift), Least Significant Bit-first within bytes
        let sym = (b0 >> shift);
        if (shift > 2) { // We only need the high part when shift is greater than 2, otherwise the whole 6 bits are on the low part
            sym |= (b1 << (8 - shift)); // We only need to shift the hight part right till it is on place. When we OR with the low part, we get the full 6 bits.
        }
        sym &= 0b111111; // 6 bit mask (char size), needed since the array is actually 8 bits

        if (sym > biggestPossibleChar) {
            throw new Error(`Symbol out of range at ${charCursor}: ${sym}`);
        }
        out.push(sym);
    }

    out.push(0xff);
    return out;
}

function generatePasswordFromParameters(params) {
    const bitPackedParams = packBits(params);
    const fullValues = addMaskAndChecksum(bitPackedParams); 
    const passwordEncodedValues = encodeValues(fullValues);
    const passwordString = encodedValuesToPasswordString(passwordEncodedValues);
    return passwordString;
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
        if (i == encodedValues.length - 1 && currentValue == 0xff) {
            // skip terminator 0xff
            continue;
        }
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