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

const toBinaryArray = (arr) => arr.map(x => x.toString(2).padStart(8, '0')).join(' ');

function runTests() {
    try {
        testPackBits();
        testChecksum();
        testDecodeValues();
        testDecodeValuesEdgeCases();
        testBitShiftRightWithCarry();
        testEncodeValueAtZero();
        testEncodeValueAtOne();
        testEncodeValueAtTwo();

        // testEncodeDecode();
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

    // Encode simple first value, no shifts, only repeating indexes 
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

    // the indexes goes 0, 0, 1, 2, 3, 3, 4 ... and the bitshifts goes 0, 6, 4, 2, 0, 6, 4 ...
    // or value 0 = [0,0 on decoded shifts 0,6]; value 1 = [1 on decoded shift 4]; value 2 = [2 on decoded shift 2]; value 3 = [3,3 on decoded shifts 0,6] ....
    // meaning that value zero gets two slots result[0] and result[1] on encoded, but on decoded it is index 0
    // value one gets one slot result[2]
    // value two gets one slot result[3]
    // value three gets two slots result[4] and result[5]
    // second value is index 2 shift 2 

    // value at one is slot 2 shift 4  
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

    // the indexes goes 0, 0, 1, 2, 3, 3, 4 ... and the bitshifts goes 0, 6, 4, 2, 0, 6, 4 ...
    // or value 0 = [0,0 on decoded shifts 0,6]; value 1 = [1 on decoded shift 4]; value 2 = [2 on decoded shift 2]; value 3 = [3,3 on decoded shifts 0,6] ....
    // meaning that value zero gets two slots result[0] and result[1] on encoded, but on decoded it is index 0
    // value one gets one slot result[2]
    // value two gets one slot result[3]
    // value three gets two slots result[4] and result[5]
    // second value is index 2 shift 2 

    // second value is index 2 shift 2  
    const simpleArrayToBeEncoded = [0b00000000, 0b00000000, 0b00000100];
    const encodedSimple = encodeValues(simpleArrayToBeEncoded); // pass BBBCB
    const expectedSimple = [0b00000000, 0b00000000, 0b00000000, 0b00000001, 0b00000000, 0xff]; // it becomes 16 bit little endian withot shifts
    assertArrayEquals(encodedSimple, expectedSimple, `Encoding simple value failed ${toBinaryArray(encodeValues(simpleArrayToBeEncoded))}`);
    const simpleDecoded = decodeValues(encodedSimple);
    assertArrayEquals(simpleDecoded, [0b00000000, 0b00000000, 0b00000100, 0b00000000, 0b00000000], `Decoding simple value failed ${toBinaryArray(decodeValues(encodedSimple))}`);

    console.log("testEncodeValueAtTwo finished.");
}

function testEncodeDecode() {
    console.log("Running testEncodeDecode...");
    const originalValues = [1, 2, 3];
    const encoded = encodeValues(originalValues);
    const decoded = decodeValues(encoded);
    
    assertArrayEquals(decoded, originalValues, `Encode-decode mismatch. Original: ${toBinaryArray(originalValues)}, Decoded: ${toBinaryArray(decoded)}`);

    console.log("testEncodeDecode finished.");
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