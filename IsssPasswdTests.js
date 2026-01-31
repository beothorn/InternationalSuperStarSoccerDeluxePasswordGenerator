(function(root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory(root);
    } else {
        root.IsssPasswdTests = factory(root);
    }
})(typeof globalThis !== "undefined" ? globalThis : window, function(root) {
    const IssdPasswd = (typeof module !== "undefined" && module.exports)
        ? require("./IssdPasswd.js")
        : root.IssdPasswd;

    function normalizePasswordString(raw) {
        let normalized = raw;
        const replacements = [
            [/\(division\)/gi, "÷"],
            [/\(pi\)/gi, "π"],
            [/\(arrow\s*down\)/gi, "↓"],
            [/\(downarrow\)/gi, "↓"],
            [/\(arrow\s*up\)/gi, "↑"],
            [/\(note\)/gi, "♪"],
            [/\(star\)/gi, "★"],
            [/\(spades\)/gi, "♠"],
            [/\(diamonds\)/gi, "♦"],
            [/\(clubs\)/gi, "♣"],
            [/\(hearts\)/gi, "♥"],
            [/\(heart\)/gi, "♥"]
        ];

        for (const [pattern, replacement] of replacements) {
            normalized = normalized.replace(pattern, replacement);
        }

        normalized = normalized.replace(/\s+/g, "");
        let output = "";
        for (let i = 0; i < normalized.length; i++) {
            output += normalized[i];
            if (i % 5 === 4 && i < normalized.length - 1) {
                output += " ";
            }
            if (i % 20 === 19 && i < normalized.length - 1) {
                output += "\n";
            }
        }
        return output;
    }

    function maskValue(bitCount, value) {
        const maxValue = Math.pow(2, bitCount) - 1;
        return value & maxValue;
    }

    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
        }
    }

    function assertArrayEqual(actual, expected, message) {
        if (actual.length !== expected.length) {
            throw new Error(`${message}\nExpected length: ${expected.length}\nActual length: ${actual.length}`);
        }
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                throw new Error(`${message}\nMismatch at index ${i}. Expected ${expected[i]}, got ${actual[i]}`);
            }
        }
    }

    function loadPasswordMap() {
        if (typeof passwordMap !== "undefined") {
            return passwordMap;
        }
        if (typeof require === "undefined") {
            return [];
        }

        const fs = require("fs");
        const vm = require("vm");
        const html = fs.readFileSync("index.html", "utf8");
        const marker = "const passwordMap = ";
        const startIndex = html.indexOf(marker);
        if (startIndex === -1) {
            return [];
        }
        const arrayStart = html.indexOf("[", startIndex);
        const arrayEnd = html.indexOf("];", arrayStart);
        if (arrayStart === -1 || arrayEnd === -1) {
            return [];
        }
        const arrayLiteral = html.slice(arrayStart, arrayEnd + 1);
        const sandbox = {};
        vm.createContext(sandbox);
        vm.runInContext(`passwordMap = ${arrayLiteral}`, sandbox);
        return sandbox.passwordMap || [];
    }

    function testPackBits() {
        const result = IssdPasswd.packBits([8], [0xa5]);
        assertArrayEqual(result, [0xa5], "packBits should return a full byte for 8-bit input.");

        const multiResult = IssdPasswd.packBits([4, 4], [0x0a, 0x05]);
        assertArrayEqual(multiResult, [0x5a], "packBits should place bits MSB-first within a byte.");
    }

    function testEncode() {
        const packed = IssdPasswd.packBits([4, 4], [0x0a, 0x05]);
        const encoded = IssdPasswd.encode(0x00, 0x12, 0x34, packed);
        const expected = IssdPasswd.fixChecksum([0x00, 0x00, 0x12, 0x34, 0x5a, 0x00]);
        assertArrayEqual(encoded, expected, "encode should prepend headers, terminator, and checksum.");
    }

    function testEncodedToString() {
        const packed = IssdPasswd.packBits([4, 7, 3], [0x01, 0x01, 0x02]);
        const encoded = IssdPasswd.encode(0x00, 0x04, 0x02, packed);
        const passwordString = IssdPasswd.encodedToString(encoded);
        if (!passwordString || typeof passwordString !== "string") {
            throw new Error("encodedToString should return a string.");
        }
    }

    function testKnownPasswords() {
        const expectedPasswords = {
            "International Elimination Phase game 2": "B~NCD GC5K* K1",
            "International Elimination Phase game 3": "B~jCB LBG(diamonds)j =DLBB",
            "International Preliminary Phase game 1": "B*PCB QCG(diamonds)j =DB-B",
            "International Preliminary Phase game 2": "B(spades)JCB VDG(diamonds)j =DB-N",
            "International cup Phase game 1": "BLWFB bF5(arrowup)~ ?*DVL $7F!4\n5B3f\" (heart)(heart)(heart)(heart)(heart) (heart)(heart)(heart)(heart)(heart) (heart)(heart)(heart)T",
            "International cup Quarterfinals": "BLBFB hD5↑~ ♥*♥0* ♥↓T!\"\n>~0\"? DB24G 3↑♥♥♥ ♥♥♥T",
            "International cup Semifinals": "BqRFL rC5↑~ ♥*♥0* ♥↓T!\"\n>~0\"? T~>\"T :♥D25 ↑♥♥T",
            "International cup Final": "B(spades)BKB 2B5(arrowup)~ (heart)*(heart)0* (heart)(downarrow)T!\"\n>~(heart)0\" ?T~>\" T:(heart)T2 ?(heart)3K",
            "Scenarios": "BZMBV GB1CB BBBBB BBBBB\nBB~BB",
            "World series": "BBBLB GB$PV FB1HG BGGGG\nBBBGB BBBGG GBBBB GGGBG\nGBBBB"
        };

        const passwordMap = loadPasswordMap();
        for (const entry of passwordMap) {
            const expectedRaw = expectedPasswords[entry.passwordFor];
            if (!expectedRaw) {
                continue;
            }
            const expected = normalizePasswordString(expectedRaw);
            const header1 = entry.values[0].default;
            const header2 = entry.values[1].default;
            const bitSizes = entry.values.slice(2).map(value => value.bits);
            const values = entry.values.slice(2).map(value => maskValue(value.bits, value.default));
            const packed = IssdPasswd.packBits(bitSizes, values);
            const encoded = IssdPasswd.encode(0x00, header1, header2, packed);
            const actual = IssdPasswd.encodedToString(encoded);
            assertEqual(actual, expected, `Password mismatch for ${entry.passwordFor}`);
        }
    }

    function runTests() {
        const tests = [
            { name: "packBits", fn: testPackBits },
            { name: "encode", fn: testEncode },
            { name: "encodedToString", fn: testEncodedToString },
            { name: "known passwords", fn: testKnownPasswords }
        ];
        let passed = 0;
        const failures = [];

        for (const test of tests) {
            try {
                test.fn();
                console.log(`✅ ${test.name}`);
                passed++;
            } catch (error) {
                console.error(`❌ ${test.name}: ${error.message}`);
                failures.push(test.name);
            }
        }

        if (failures.length === 0) {
            console.log(`All ${passed} tests passed.`);
        } else {
            console.log(`${passed} tests passed, ${failures.length} failed.`);
        }
    }

    return { runTests };
});

if (typeof module !== "undefined" && module.exports && require.main === module) {
    module.exports.runTests();
}
