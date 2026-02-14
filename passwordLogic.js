// ROR - Rotate Right
function ror(value, carry) {
    const newCarry = value & 0x01; // Extract rightmost bit as the new carry
    const newValue = ((value >> 1) | (carry << 15)) & 0xFFFF; // Shift right and insert carry into the leftmost bit
    return {
        newValue,
        newCarry
    };
}

// ROL - Rotate Left
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
        let y = remainder; // Y is another regiistry, used as index for memory accesses (X is anotehr one)
        let currentChar = passwordValues[passwordIndex];

        if (currentChar > biggestPossibleChar) { // string end marker is 0xff, which is bigger than any possible char, so we can stop decoding
            break;
        }
        ({ newValue, newCarry } = ror(currentChar, carry)); // rotate right, don't know why
        a = newValue;
        carry = newCarry; // we need the carry to rotate, on the SNES cpu this is the flag C
        while (y >= 0) { // rotate left the number of times we got from the division remainder
            ({ newValue, newCarry } = rol(a, carry));
            a = newValue;
            carry = newCarry;
            y--;
        }
        a = a | readFromResultInMemory(result, quotient); // if there is already somethingn on the position, the result is the OR
        writeOnResultInMemory(result, quotient, a); // maybe A has values on the high part so we write it in a way the next position gets the high value 
        passwordIndex++; // next char from password
        multipleOfSixCounter += 6; // next 6 multiplier
    } while (multipleOfSixCounter < 360); // from the ISSD code, we know the password is 60 characters long
    return result;
}

/**
 * Given a set of values, encode them according to the algorithm used by ISSD.
 * @param {*} values 
 * @returns 
 */
function encodeValues(values) {
}

function generatePassword(checksum, mask, values) {
    // Implementation goes here
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