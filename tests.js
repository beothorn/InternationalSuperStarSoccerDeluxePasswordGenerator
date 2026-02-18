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
        testFullPasswordGenerationFromParametersElim2();
        testFullPasswordGenerationFromParametersElim3();

        testPackBits();
        testChecksum();
        testPasswordToEncodedValues();
        testDecodeValues();
        testDecodeValuesEdgeCases();
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
    
    const password = "B$NCD GC5K# K1";
    const encodedValues = passwordStringTo8bitArray(password); // [0x00, 0x30, 0x0a, 0x01, 0x02, 0x04, 0x01, 0x24, 0x07, 0x38, 0x07, 0x20, 0xff]
    const decodedValues = decodeValues(encodedValues);
    const expectedValues = [0x00, 0xac, 0x04, 0x02, 0x11, 0x90, 0x07, 0x7e, 0x80, 0x00];
    assertArrayEquals(decodedValues, expectedValues, "Full password decoding failed " + toHexArray(decodedValues));

    encodeValues(decodedValues); // this should not throw an error, as the decoded values are valid and can be encoded back to the same password
}

function testFullPasswordGenerationFromParametersElim2() {
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

function testFullPasswordGenerationFromParametersElim3() {
    // Will use "International Elimination Phase game 3"

    // parameter tuples [bit count, value]


    const parameters = [
        [8, 0x05],
        [8, 0x00],
        [4, 0x02],
        [7, 0x00],
        [3, 0x02],
        [3, 0x04],
        [6, 0x1e],
        [6, 0x0d],
        [6, 0x16],
        [6, 0x01],
        [6, 0x44],
        [2, 0x00],
        [2, 0x00],
        [2, 0x00],
        [2, 0x00],
    ];

    const bitPackedParams = packBits(parameters);
    const checksum = calculateChecksum(bitPackedParams);
    assertEquals(checksum, 0xac, "Checksum calculation failed for parameters");
    const fullValues = addMaskAndChecksum(bitPackedParams); 
    const expectedFullValue = [0x00, 0xac, 0x05, 0x00, 0x02, 0x10, 0xbd, 0xc6, 0x0a, 0x08, 0x00, 0x00];
    assertArrayEquals(fullValues, expectedFullValue, "Value to encode is incorrect " + toHexArray(fullValues))
    const passwordEncodedValues = encodeValues(fullValues);
    const decodedRoundTrip = decodeValues(passwordEncodedValues);
    assertArrayEquals(decodedRoundTrip, expectedFullValue, "Encoded values do not decode back to expected full values");
}
