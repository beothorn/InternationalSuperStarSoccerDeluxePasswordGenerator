function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
}

function assertArrayEquals(actual, expected, message) {
    if (actual.length !== expected.length) {
        throw new Error(`${message}\nExpected length: ${expected.length}\nActual length: ${actual.length}`);
    }
    for (let i = 0; i < expected.length; i++) {
        if (actual[i] !== expected[i]) {
            throw new Error(`${message}\nExpected[${i}]: ${expected[i]}\nActual[${i}]: ${actual[i]}`);
        }
    }
}

function assertExceptionThrown(func, expectedMessage, message) {
    try {
        func();
        throw new Error(`${message}\nExpected an exception to be thrown with message: ${expectedMessage}`);
    } catch (e) {
        if (e.message !== expectedMessage) {
            throw new Error(`${message}\nExpected exception message: ${expectedMessage}\nActual exception message: ${e.message}`);
        }
    }
}

const toBinaryArray = (arr) => arr.map(x => x.toString(2).padStart(8, '0')).join(' ');
const toHexArray = (arr) => arr.map(x => '0x' + x.toString(16).padStart(2, '0')).join(' ');

function runTests() {
    try {

        testFullPasswordDecoding();

        testFullPasswordGenerationFromParameters();

        testPackBits();
        testChecksum();
        testPasswordToEncodedValues();
        testDecodeValues();
        testDecodeValuesEdgeCases();
        testBitShiftRightWithCarry();
        testEncodeValueAtZero();
        testEncodeValueAtOne();
        testEncodeValueAtTwo();
        testEncodeValueAtThree();
        testEncodeFourValuesAtTheSameTime();
        testEncodedArrayToPassword();
        testEncodedArrayToPasswordFailWithBigValue();

        console.log("All tests executed!");
    } catch (e) {
        console.error(e.message);
        throw e;
    }
}

function testPackBits() {
    console.log("Running testPackBits...");

    const result = packBits([[8, 0xff], [8, 0xff], [2, 0x3], [6, 0x1e]]);
    const actualValues = unpackBits(result, [8, 8, 2, 6]);

    assertEquals(actualValues[0], 0xff, "Test 1 Failed");
    assertEquals(actualValues[1], 0xff, "Test 2 Failed");
    assertEquals(actualValues[2], 0x3, "Test 3 Failed");
    assertEquals(actualValues[3], 0x1e, "Test 3 Failed");

    console.log("testPackBits finished.");
}

function testChecksum() {
    console.log("Running testChecksum...");
    // for [0x04 0x02 0x11 0x90 0x07 0x7e 0x80] the checksum should be 0xac 
    // Add checksum tests here  
    const checksum = calculateChecksum([0x04, 0x02, 0x11, 0x90, 0x07, 0x7e, 0x80]);
    assertEquals(checksum, 0xac, "Checksum test failed");
    console.log("testChecksum finished.");
}

function testDecodeValues() {
    console.log("Running testDecodeValues...");
    
    const encoded = [0b00000001, 0b00000010, 0b00000011, 0xff]; // 0xff is the string end marker, this is CDE
    const decoded = decodeValues(encoded);
    // the indexes goes 0, 0, 1, 2, 3, 3, 4 ... and the bitshifts goes 0, 6, 4, 2, 0, 6, 4 ...
    // first value is:  index 0 bitshift 0, so we write 0b00000001 << 8 = 0b00000001_00000000 >> 0 = 0b00000001_00000000, high part on index 0 and the low part on index 1
    // decoded is [0b00000001, 0b00000000] at this point
    // second value is: index 0 bitshift 6, so we write 0b00000010 << 8 = 0b00000010_00000000 >> 6 = 0b10000000_00000000, high part on index 0 and the low part on index 1, using OR to not lose previous values
    // decoded is [0b10000001, 0b00000000] at this point
    // third value is:  index 1 bitshift 4, so we write 0b00000011 << 8 = 0b00000011_00000000 >> 4 = 0b00110000_00000000, high part on index 1 and the low part on index 2, using OR to not lose previous values
    // decoded is [0b10000001, 0b00110000, 0b00000000] at this point
    
    const expected = [0b10000001, 0b00110000, 0x00];
    
    assertEquals(decoded.length, expected.length, "Decoded length mismatch");
    for (let i = 0; i < expected.length; i++) {
        assertEquals(decoded[i], expected[i], `Decoded value mismatch at index ${i} for value ${expected} where actual value is ${decoded}`);
    }

    console.log("testDecodeValues finished.");
}

function testDecodeValuesEdgeCases() {
    console.log("Running testDecodeValues edge...");
    // Biggest possible char is 00111110
    assertArrayEquals(decodeValues([0b00111110, 0xff]), [0b00111110, 0x00], `Edge case with high bit set failed ${decodeValues([0b00111110, 0xff])}`);
    // Biggest possible char with different shifts
    // value 0 - 0b00100000 16 bit 0b00000000_00100000 shift 0 0b00000000_00100000, Little endian = [0b00100000, 0b00000000]
    // [0b00000000, 0b00000000] OR [0b00100000, 0b00000000] = [0b00100000, 0b00000000]
    // value 1 - 0b00100000 16 bit 0b00000000_00100000 shift 6 0b00001000_00000000 , Little endian = [0b00000000, 0b00001000]
    // [0b00100000, 0b00000000] OR [0b00000000, 0b00001000] = [0b00100000, 0b00001000]
    // value 2 - 0b00100000 16 bit 0b00000000_00100000 shift 4 0b00000010_00000000, Little endian = [0b00000000, 0b00000010]
    // [0b00100000, 0b00001000] OR [0b00000000, 0b00000010] = [0b00100000, 0b00001000, 0b00000010]
    assertArrayEquals(decodeValues([0b00100000, 0b00100000, 0b00100000, 0xff]), 
        [0b00100000, 0b00001000, 0b00000010], `Edge case with high bit set failed ${toBinaryArray(decodeValues([0b00100000, 0b00100000, 0b00100000, 0xff]))}`);
    

    console.log("testDecodeValues edge finished.");
}

function testEncodeValueAtZero() {
    console.log("Running testEncodeValueAtZero...");
    // the indexes goes 0, 0, 1, 2, 3, 3, 4 ... and the bitshifts goes 0, 6, 4, 2, 0, 6, 4 ...
    // or value 0 = [0,0 on decoded shifts 0,6]; value 1 = [1 on decoded shift 4]; value 2 = [2 on decoded shift 2]; value 3 = [3,3 on decoded shifts 0,6] ....
    // meaning that value zero gets two slots result[0] and result[1] on encoded, but on decoded it is index 0
    // value one gets one slot result[2]
    // value two gets one slot result[3]
    // value three gets two slots result[4] and result[5]
    // second value is index 2 shift 2 

    // Encode simple first value, shifts 0,6, encoded on result[0] and result[1]
    const simpleArrayToBeEncoded = [0b00000001];
    const encodedSimple = encodeValues(simpleArrayToBeEncoded); // pass CB
    const expectedSimple = [0b00000001, 0b00000000, 0xff]; // it becomes 16 bit little endian withot shifts
    assertArrayEquals(encodedSimple, expectedSimple, `Encoding simple value failed ${toBinaryArray(encodeValues(simpleArrayToBeEncoded))}`);
    const simpleDecoded = decodeValues(encodedSimple);
    assertArrayEquals(simpleDecoded, [0b00000001, 0b00000000], `Decoding simple value failed ${toBinaryArray(decodeValues(encodedSimple))}`);
    console.log("testEncodeValueAtZero finished.");
}

function testEncodeValueAtOne() {
    console.log("Running testEncodeValueAtOne...");

    // Encode value at index 1, shifts 4, encoded on result[2] (and 3 because roteting makes it 16 bits)
    const simpleArrayToBeEncoded = [0b00000000, 0b00010000]; // interesting, 0b00000001 is not valid as second value, as it is too big after shift
    const encodedSimple = encodeValues(simpleArrayToBeEncoded);  // pass BBCB
    const expectedSimple = [0b00000000, 0b00000000, 0b00000001, 0b00000000, 0xff]; // it becomes 16 bit little endian withot shifts
    assertArrayEquals(encodedSimple, expectedSimple, `Encoding simple value failed ${toBinaryArray(encodeValues(simpleArrayToBeEncoded))}`);
    const simpleDecoded = decodeValues(encodedSimple);
    assertArrayEquals(simpleDecoded, [0b00000000, 0b00010000, 0b00000000, 0b00000000], `Decoding simple value failed ${toBinaryArray(decodeValues(encodedSimple))}`);

    console.log("testEncodeValueAtOne finished.");
}

function testEncodeValueAtTwo() {
    console.log("Running testEncodeValueAtTwo...");

    // Encode value at index 2, shifts 2, encoded on result[3] (and 4 because roteting makes it 16 bits)
    const simpleArrayToBeEncoded = [0b00000000, 0b00000000, 0b00000100];
    const encodedSimple = encodeValues(simpleArrayToBeEncoded); // pass BBBCB
    const expectedSimple = [0b00000000, 0b00000000, 0b00000000, 0b00000001, 0b00000000, 0xff]; // it becomes 16 bit little endian withot shifts
    assertArrayEquals(encodedSimple, expectedSimple, `Encoding simple value failed ${toBinaryArray(encodeValues(simpleArrayToBeEncoded))}`);
    const simpleDecoded = decodeValues(encodedSimple);
    assertArrayEquals(simpleDecoded, [0b00000000, 0b00000000, 0b00000100, 0b00000000, 0b00000000], `Decoding simple value failed ${toBinaryArray(decodeValues(encodedSimple))}`);

    console.log("testEncodeValueAtTwo finished.");
}

function testEncodeValueAtThree() {
    console.log("Running testEncodeValueAtThree...");

    // Encode value at index 3, shifts 0,6, encoded on result[4] and result[5]
    const simpleArrayToBeEncoded = [0b00000000, 0b00000000, 0b00000000, 0b00000001];
    const encodedSimple = encodeValues(simpleArrayToBeEncoded); // pass BBBBCB
    const expectedSimple = [0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000001, 0b00000000 , 0xff]; // it becomes 16 bit little endian withot shifts
    assertArrayEquals(encodedSimple, expectedSimple, `Encoding simple value failed ${toBinaryArray(encodeValues(simpleArrayToBeEncoded))}`);
    const simpleDecoded = decodeValues(encodedSimple);
    assertArrayEquals(simpleDecoded, [0b00000000, 0b00000000, 0b00000000, 0b00000001, 0b00000000], `Decoding simple value failed ${toBinaryArray(decodeValues(encodedSimple))}`);

    console.log("testEncodeValueAtThree finished.");
}


function testEncodeFourValuesAtTheSameTime() {
    console.log("Running testEncodeFourValuesAtTheSameTime...");

    const simpleArrayToBeEncoded = [0b00000001, 0b00010000, 0b00000100, 0b00000001];
    const encodedSimple = encodeValues(simpleArrayToBeEncoded); // pass CBCCCB
    const expectedSimple = [0b00000001, 0b00000000, 0b00000001, 0b00000001, 0b00000001, 0b00000000 , 0xff]; // it becomes 16 bit little endian withot shifts
    assertArrayEquals(encodedSimple, expectedSimple, `Encoding simple value failed ${toBinaryArray(encodeValues(simpleArrayToBeEncoded))}`);
    const simpleDecoded = decodeValues(encodedSimple);
    assertArrayEquals(simpleDecoded, [0b00000001, 0b00010000, 0b00000100, 0b00000001, 0b00000000], `Decoding simple value failed ${toBinaryArray(decodeValues(encodedSimple))}`);

    console.log("testEncodeFourValuesAtTheSameTime finished.");
}

function testBitShiftRightWithCarry() {
    console.log("Running testBitShiftRightWithCarry...");
    // tests for no shift
    const newValue = bitShiftRightWithCarry(0b00000000_00100000, 0);
    assertEquals(newValue, 0b00000000_00100000, "Bit shift right with carry failed for shift 0");

    // tests for bit rotating
    const newValue2 = bitShiftRightWithCarry(0b00000000_0000001, 1);
    assertEquals(newValue2, 0b10000000_00000000, "Bit shift right with carry failed for shift 1");

    // test for full 16 bit rotation
    const newValue3 = bitShiftRightWithCarry(0b00000000_00000001, 16);
    assertEquals(newValue3, 0b00000000_00000001, "Bit shift right with carry failed for shift 16");

    // test for values on high bit
    const newValue4 = bitShiftRightWithCarry(0b10000000_00000000, 1);
    assertEquals(newValue4, 0b01000000_00000000, "Bit shift right with carry failed for high bit shift");

    console.log("testBitShiftRightWithCarry finished.");
}

function testEncodedArrayToPassword() {
    console.log("Running testEncodedArrayToPassword...");
    const pass = encodedValuesToPasswordString([0,1,2,3,4,5,6,7,8]);
    assertEquals(pass, "BCDFG HJKL", "Encoded array to password string failed");
    console.log("testEncodedArrayToPassword finished.");
}

function testEncodedArrayToPasswordFailWithBigValue() {
    console.log("Running testEncodedArrayToPasswordFailWithBigValue...");
    const invalidChar = biggestPossibleChar + 1;
    assertExceptionThrown( 
        () => encodedValuesToPasswordString([invalidChar]) , 
        "Invalid encoded value " + invalidChar + " at index 0", 
        "Expected it to fail");
    console.log("testEncodedArrayToPasswordFailWithBigValue finished.");
}

function testPasswordToEncodedValues() {
     // Will use "International Elimination Phase game 2" password, which is "B$NCD GC5K# K1"
    
    const password = "B$NCD GC5K# K1";
    const actual = passwordStringTo8bitArray(password);
    const expected = [0x00, 0x30, 0x0a, 0x01, 0x02, 0x04, 0x01, 0x24, 0x07, 0x38, 0x07, 0x20, 0xff];
    assertArrayEquals(actual, expected, "Password to encoded values failed " + actual);
}

function testFullPasswordDecoding() {
    // Will use "International Elimination Phase game 2" password, which is "B$NCD GC5K# K1"
    // encoded
    // [0x00, 0x30, 0x0a, 0x01, 0x02, 0x04, 0x01, 0x24, 0x07, 0x38, 0x07, 0x20, 0xff]
    // decoded
    // [0x00, 0xac, 0x04, 0x02, 0x11, 0x90, 0x07, 0x7e, 0x80, 0x00]
    // how does 0xac becomes 0x0a?
    // Lets look at the binaries
    // index  0         0         1         2         3         3         4         5         6         6         7         8
    // shift  0         6         4         2         0         6         4         2         0         6         4         2
    // enc   '0000_0000 0011_0000 0000_1010 0000_0001 0000_0010 0000_0100 0000_0001 0010_0100 0000_0111 0011_1000 0000_0111 0010_0000 11111111'
    // dec   '0000_0000 1010_1100 0000_0100 0000_0010 0001_0001 1001_0000 0000_0111 0111_1110 1000_0000 00000000'
    //        0         1         2         3         4         5         6         7         8         9         10        11
    // 0011_0000 shifted 6 times is 0000_1100
    // so why the first decoded is not 0000_1100?
    // 0000_1010 shifted 4 times is 1010_0000 
    // 0000_1100 and 1010_0000 is 1010_1100 which matches 1
    // 0000_0001 shifted 2 times is 0000_0100 
    // which matches 0000_0100
    // so it is a relation of 1 decoded to one or two encodeds (there seems to be an offset)
    // 0 - [0]     [0000_0000] to [0000_0000]             shift [0]
    // 1 - [1, 2]  [1010_1100] to [0011_0000, 0000_1010]  shift [6, 4]  index+1 [1,1] (0,0)
    // 2 - [3]     [0000_0100] to [0000_0001]             shift [2]     index+1 [2]   (1)
    // 3 - [4]     [0000_0010] to [0000_0010]             shift [0]     index+1 [3]   (2)
    // 4 - [5,6]   [0001_0001] to [0000_0100, 0000_0001]  shift [6, 4]  index+1 [4,4] (3,3)
    // 5 - [7]     [1001_0000] to [0010_0100]             shift [2]     index+1 [5]   (4)
    // 6 - [8]     [0000_0111] to [0000_0111]             shift [0]     index+1 [6]   (5)
    // 7 - [9,10]  [0111_1110] to [0011_1000, 0000_0111]  shift [6,4]   index+1 [7,7] (6,6)
    // 8 - [11]    [1000_0000] to [0010_0000]             shift [2]     index+1 [8]   (7)

    const password = "B$NCD GC5K# K1";
    const encodedValues = passwordStringTo8bitArray(password); // [0x00, 0x30, 0x0a, 0x01, 0x02, 0x04, 0x01, 0x24, 0x07, 0x38, 0x07, 0x20, 0xff]
    const decodedValues = decodeValues(encodedValues);
    const expectedValues = [0x00, 0xac, 0x04, 0x02, 0x11, 0x90, 0x07, 0x7e, 0x80, 0x00];
    assertArrayEquals(decodedValues, expectedValues, "Full password decoding failed " + toHexArray(decodedValues));

    encodeValues(decodedValues); // this should not throw an error, as the decoded values are valid and can be encoded back to the same password
}

function testFullPasswordGenerationFromParameters() {
    // Will use "International Elimination Phase game 2"

    // parameter tuples [bit count, value]
    const parameters = [
        [8,4],
        [8,2],
        [4,1],
        [7,1],
        [3,2],
        [6,30],
        [6,32],
        [6,31],
        [2,2]
    ];

    const bitPackedParams = packBits(parameters);
    const checksum = calculateChecksum(bitPackedParams);
    assertEquals(checksum, 0xac, "Checksum calculation failed for parameters");
    const fullValues = addMaskAndChecksum(bitPackedParams); 
    const expectedFullValue = [0x00, 0xac, 0x04, 0x02, 0x11, 0x90, 0x07, 0x7e, 0x80, 0x00];
    assertArrayEquals(fullValues, expectedFullValue, "Value to encode is incorrect " + toHexArray(fullValues))
    const passwordEncodedValues = encodeValues(fullValues);
    const finalPassword = encodedValuesToPasswordString(passwordEncodedValues);
    assertEquals(finalPassword, "B$NCD GC5K# K1", "Password generation from parameters failed, outputed " + finalPassword);
}