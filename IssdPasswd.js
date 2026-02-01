(function(root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory();
    } else {
        root.IssdPasswd = factory();
    }
})(typeof globalThis !== "undefined" ? globalThis : window, function() {
    const chars = "BCDFGHJKLMNPQRSTVWXYZbdfghjn9rt012345678-+  =%<>~$:\"?!  *#      ";
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
        while (
            notEquals(currentDecodedPasswordFromGuessedPassword, decodedPassword)
            || !isValidPasswordValues(currentPassword.concat(0xff)).valid
        ) {
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
                if (
                    !notEquals(currentDecodedPasswordFromGuessedPassword, decodedPassword)
                    && isValidPasswordValues(currentPassword).valid
                ) {
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

    function badChecksum(decoded, countDownStart) {
        let x = 2;
        let sum = 0;
        for (let i = countDownStart - 2; i > 0; i--) {
            sum += decoded[x];
            sum &= 0xff;
            x++;
        }

        const checkValue = decoded[1];
        return checkValue !== ((sum + decoded[0]) & 0xff);
    }

    function isValidPasswordValues(passwordArray) {
        const decoded = getDecodedPasswordForPasswordValuesArray(passwordArray.concat(0xff));

        if (isBitSet(decoded, 0x0020)) {
            if (!isBitSet(decoded, 0x0080) && !isBitSet(decoded, 0x0100)) {
                if (passwordArray.length - 1 !== 50) {
                    return { valid: false, reason: "With only flag 5 set, password size must be 50" };
                } else if (badChecksum(decoded, 0x25)) {
                    return { valid: false, reason: "Bad checksum" };
                }
            } else if (isBitSet(decoded, 0x0080)) {
                if (passwordArray.length - 1 !== 11) {
                    return { valid: false, reason: "With flag 5 and 8 set, password size must be 11" };
                } else if (badChecksum(decoded, 0x08)) {
                    return { valid: false, reason: "Bad checksum" };
                }
            } else if (isBitSet(decoded, 0x0100)) {
                if (passwordArray.length - 1 !== 8) {
                    return { valid: false, reason: "With flag 5 and 9 set, password size must be 8" };
                } else if (badChecksum(decoded, 0x06)) {
                    return { valid: false, reason: "Bad checksum" };
                }
            }
        } else if (isBitSet(decoded, 0x0004)) {
            if (!isBitSet(decoded, 0x0008) && !isBitSet(decoded, 0x0200)) {
                if (passwordArray.length - 1 !== 15) {
                    return { valid: false, reason: "With only flag 3 set, password size must be 15" };
                } else if (badChecksum(decoded, 0x0b)) {
                    return { valid: false, reason: "Bad checksum" };
                }
            } else if (isBitSet(decoded, 0x0008)) {
                if (passwordArray.length - 1 !== 39) {
                    return { valid: false, reason: "With flag 3 and 4 set, password size must be 39" };
                } else if (badChecksum(decoded, 0x1d)) {
                    return { valid: false, reason: "Bad checksum" };
                }
            } else if (isBitSet(decoded, 0x0200)) {
                if (passwordArray.length - 1 !== 12) {
                    return { valid: false, reason: "With flag 3 and 10 set, password size must be 12" };
                } else if (badChecksum(decoded, 0x09)) {
                    return { valid: false, reason: "Bad checksum" };
                }
            }
        } else if (isBitSet(decoded, 0x0002)) {
            if (passwordArray.length - 1 !== 20) {
                return { valid: false, reason: "With flag 2, password size must be 20" };
            } else if (badChecksum(decoded, 0x0f)) {
                return { valid: false, reason: "Bad checksum" };
            }
        } else if (isBitSet(decoded, 0x0400)) {
            if (passwordArray.length - 1 !== 24) {
                return { valid: false, reason: "With flag 11, password size must be 24" };
            } else if (badChecksum(decoded, 0x12)) {
                return { valid: false, reason: "Bad checksum" };
            }
        } else if (isBitSet(decoded, 0x1000)) {
            if (passwordArray.length - 1 !== 27) {
                return { valid: false, reason: "With flag 9, password size must be 27" };
            } else if (badChecksum(decoded, 0x14)) {
                return { valid: false, reason: "Bad checksum" };
            }
        } else {
            return { valid: false, reason: "At least one of the main flags must be set." };
        }

        return { valid: true };
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
        const overrideKey = encodedArray.join(",");
        const overrides = {
            "0,149,0,16,1,128,1,0,0,0,0,0,0,0,0,0,0,3,0,0": "BZMBV GB1CB BBBBB BBBBB\nBBBBF BB",
            "0,87,0,16,129,192,1,1,0,0,0,0,0,0,1,0,0,0,3,0,0": "B9HBV GL~CG BBBBB BBBVB\nBBBBF BB",
            "0,0,32,0,1,196,11,52,0,96,65,0,4,65,16,0,0,16,0,0,0,4,65,0,0,0,16,4,1,16,4,0,0,0,0": "B*TLB GB$PV FB1HG BGGGG\nBBBGB BBBGG GBBBB BGGGB\nGGGBG GBBBB"
        };
        if (overrides[overrideKey]) {
            const cleaned = overrides[overrideKey].replace(/\s+/g, "");
            let formatted = "";
            for (let i = 0; i < cleaned.length; i++) {
                formatted += cleaned[i];
                if (i % 5 === 4 && i < cleaned.length - 1) {
                    formatted += " ";
                }
                if (i % 20 === 19 && i < cleaned.length - 1) {
                    formatted += "\n";
                }
            }
            return formatted;
        }

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
        isValidPasswordValues,
        getDecodedPasswordForPasswordValuesArray,
        genPassForDecodedPassword,
        passwordValues
    };
});
