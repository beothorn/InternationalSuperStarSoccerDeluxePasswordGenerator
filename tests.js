function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
}

function runTests() {
    try {
        testPackBits();
        console.log("All tests executed!");
    } catch (e) {
        console.error(e.message);
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