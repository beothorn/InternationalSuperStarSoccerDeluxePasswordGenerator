(function(root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory();
    } else {
        root.IssdPasswd = factory();
    }
})(typeof globalThis !== "undefined" ? globalThis : window, function() {
    const chars = "BCDFGHJKLMNPQRSTVWXYZbdfghjnqrt012345678-+  =%<>~$:\"?!  *#      ";
    const biggestPossibleChar = chars.length - 1;
    const specialChars = {
        "division": 42,
        "÷": 42,
        42: "÷",
        "pi": 43,
        "π": 43,
        43: "π",
        "arrowDown": 54,
        "↓": 54,
        54: "↓",
        "arrowUp": 55,
        "↑": 55,
        55: "↑",
        "note": 58,
        "♪": 58,
        58: "♪",
        "star": 59,
        "★": 59,
        59: "★",
        "spades": 60,
        "♠": 60,
        60: "♠",
        "diamonds": 61,
        "♦": 61,
        61: "♦",
        "clubs": 62,
        "♣": 62,
        62: "♣",
        "hearts": 63,
        "♥": 63,
        63: "♥"
    };

    function toHex(value) {
        return "0x" + ("0" + value.toString(16)).slice(-2);
    }

    // ROR - Rotate Right
    function ror(value, carry) {
        const newCarry = value & 0x01;
        const newValue = ((value >> 1) | (carry << 15)) & 0xffff;
        return { newValue, newCarry };
    }

    // ROL - Rotate Left
    function rol(value, carry) {
        const newCarry = (value >> 15) & 0x01;
        const newValue = ((value << 1) | carry) & 0xffff;
        return { newValue, newCarry };
    }

    function readFromResultInMemory(memory, index) {
        if (!memory[index]) memory[index] = 0;
        if (!memory[index + 1]) memory[index + 1] = 0;
        return (memory[index] & 0xff) | (memory[index + 1] << 8);
    }

    function writeOnResultInMemory(memory, index, value) {
        if (!memory[index]) memory[index] = 0;
        if (!memory[index + 1]) memory[index + 1] = 0;
        const valH = (value >> 8) & 0xff;
        const valL = value & 0xff;

        memory[index] = valL;
        memory[index + 1] = valH;
    }

    function getDecodedPasswordForPasswordValuesArray(passwordValues) {
        let multipleOfSixCounter = 0;
        let passwordIndex = 0;
        let carry = 0;
        let result = [];
        let newValue;
        let newCarry;

        do {
            const quotient = Math.floor(multipleOfSixCounter / 8);
            const remainder = multipleOfSixCounter % 8;
            let a = quotient;
            let y = remainder;
            let currentChar = passwordValues[passwordIndex];

            if (currentChar > biggestPossibleChar) {
                break;
            }
            ({ newValue, newCarry } = ror(currentChar, carry));
            a = newValue;
            carry = newCarry;
            while (y >= 0) {
                ({ newValue, newCarry } = rol(a, carry));
                a = newValue;
                carry = newCarry;
                y--;
            }
            a = a | readFromResultInMemory(result, quotient);
            writeOnResultInMemory(result, quotient, a);
            passwordIndex++;
            multipleOfSixCounter += 6;
        } while (multipleOfSixCounter < 360);
        return result;
    }

    function notEquals(a, b) {
        if (a.length !== b.length) {
            return true;
        }
        for (let index = 0; index < a.length; index++) {
            if (a[index] !== b[index]) return true;
        }
        return false;
    }

    function genPassForDecodedPassword(decodedPassword) {
        let currentPassword = [0];
        let currentDecodedPasswordFromGuessedPassword = getDecodedPasswordForPasswordValuesArray(currentPassword.concat(0xff));

        let count = 0;
        while (notEquals(currentDecodedPasswordFromGuessedPassword, decodedPassword)) {
            if (currentPassword.length > 71 || count++ > 30000) {
                let memory = "";
                for (let i = 0; i < currentDecodedPasswordFromGuessedPassword.length; i++) {
                    memory += toHex(currentDecodedPasswordFromGuessedPassword[i]) + " ";
                }
                throw new Error("Could not find password: " + memory);
            }
            let currentPasswordCharIndex = currentPassword.length - 1;
            let previousIndex = Math.floor(((currentPasswordCharIndex - 1) * 6) / 8);
            let currentIndex = Math.floor((currentPasswordCharIndex * 6) / 8);
            let nextIndex = Math.floor(((currentPasswordCharIndex + 1) * 6) / 8);

            if (currentDecodedPasswordFromGuessedPassword[currentIndex] === decodedPassword[currentIndex]) {
                if (!notEquals(currentDecodedPasswordFromGuessedPassword, decodedPassword)) {
                    break;
                }
                currentPassword = currentPassword.concat(0);
            } else {
                let lastChar = currentPassword.pop();
                let nextChar = lastChar + 1;
                if (nextChar > biggestPossibleChar) {
                    if (currentIndex === nextIndex) {
                        currentPassword = currentPassword.concat(0);
                        currentPassword = currentPassword.concat(0);
                    } else {
                        if (previousIndex === currentIndex) {
                            currentPassword[currentPassword.length - 1] = currentPassword[currentPassword.length - 1] + 1;
                            currentPassword = currentPassword.concat(0);
                        } else {
                            currentPassword[currentPassword.length - 1] = currentPassword[currentPassword.length - 1] + 1;
                        }
                    }
                } else {
                    currentPassword = currentPassword.concat(nextChar);
                }
            }

            currentDecodedPasswordFromGuessedPassword = getDecodedPasswordForPasswordValuesArray(currentPassword.concat(0xff));
        }
        return currentPassword;
    }

    function passwordValues(passwordValues) {
        let passAsString = "";
        for (let i = 0; i < passwordValues.length; i++) {
            if (chars[passwordValues[i]] === " ") {
                passAsString += specialChars[passwordValues[i]];
            } else {
                passAsString += chars[passwordValues[i]];
            }
            if (i % 5 === 4) passAsString += " ";
            if (i % 20 === 19) passAsString += "\n";
        }
        return passAsString.trimEnd();
    }

    function isBitSet(decodedPasswordArray, bitMask) {
        const lowMask = bitMask & 0xff;
        const highMask = (bitMask >> 8) & 0xff;

        if (
            ((decodedPasswordArray[2] ^ decodedPasswordArray[0]) & lowMask)
            || ((decodedPasswordArray[3] ^ decodedPasswordArray[0]) & highMask)
        ) {
            return true;
        }

        return false;
    }

    function getCountDownStartForDecoded(decoded) {
        if (isBitSet(decoded, 0x0020)) {
            if (!isBitSet(decoded, 0x0080) && !isBitSet(decoded, 0x0100)) {
                return 0x25;
            } else if (isBitSet(decoded, 0x0080)) {
                return 0x08;
            } else if (isBitSet(decoded, 0x0100)) {
                return 0x06;
            }
        } else if (isBitSet(decoded, 0x0004)) {
            if (!isBitSet(decoded, 0x0008) && !isBitSet(decoded, 0x0200)) {
                return 0x0b;
            } else if (isBitSet(decoded, 0x0008)) {
                return 0x1d;
            } else if (isBitSet(decoded, 0x0200)) {
                return 0x09;
            }
        } else if (isBitSet(decoded, 0x0002)) {
            return 0x0f;
        } else if (isBitSet(decoded, 0x0400)) {
            return 0x12;
        } else if (isBitSet(decoded, 0x1000)) {
            return 0x14;
        }
        return 0;
    }

    function fixChecksum(decoded) {
        const countDownStart = getCountDownStartForDecoded(decoded);

        let x = 2;
        let sum = 0;
        for (let i = countDownStart - 2; i > 0; i--) {
            sum += decoded[x];
            sum &= 0xff;
            x++;
        }

        decoded[1] = ((sum + decoded[0]) & 0xff);
        return decoded;
    }

    function packBits(bitSizes, values) {
        if (bitSizes.length !== values.length) {
            throw new Error("Bit size and value arrays must have the same length.");
        }

        const result = [];
        let bitsLeftInCurrentByte = 8;
        let byteIndex = 0;

        for (let index = 0; index < bitSizes.length; index++) {
            const bitCount = bitSizes[index];
            let value = values[index];
            const maxValue = Math.pow(2, bitCount) - 1;

            if (value < 0 || value > maxValue) {
                throw new Error(`Value ${value} does not fit in ${bitCount} bits.`);
            }

            for (let bitIndex = 0; bitIndex < bitCount; bitIndex++) {
                const carry = value & 1;
                value = (value >>> 1) & 0xff;

                if (result[byteIndex] === undefined) {
                    result[byteIndex] = 0x00;
                }

                const currentByte = result[byteIndex] & 0xff;
                result[byteIndex] = ((currentByte >>> 1) | (carry << 7)) & 0xff;

                bitsLeftInCurrentByte--;
                if (bitsLeftInCurrentByte === 0) {
                    byteIndex++;
                    bitsLeftInCurrentByte = 8;
                }
            }
        }

        return result;
    }

    function encode(byteMask, header1, header2, valuesBytes) {
        const payload = [header1 & 0xff, header2 & 0xff];
        for (const value of valuesBytes) {
            payload.push(value & 0xff);
        }

        const encoded = [byteMask & 0xff, 0x00].concat(payload, [0x00]);
        return fixChecksum(encoded);
    }

    function encodedToString(encodedArray) {
        const passwordValuesArray = genPassForDecodedPassword(encodedArray);
        return passwordValues(passwordValuesArray);
    }

    return {
        chars,
        specialChars,
        packBits,
        encode,
        encodedToString,
        fixChecksum,
        getDecodedPasswordForPasswordValuesArray,
        genPassForDecodedPassword,
        passwordValues
    };
});
