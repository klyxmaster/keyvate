var secretKey = "5@!ru_K#&422|6;FoJ=VJU%IZ";
var interval;        // Global variable to store the timer interval
var encryptionPassword = "XLPb$8jdI>EBVtQIc%ub(mbIvAHo?Z";  // Encryption key for secure storage

// Function to load and decrypt the 2FA secret key from the database
function load2FAKeyFromDB(siteId) {
    const transaction = db.transaction(["websites"], "readonly");
    const store = transaction.objectStore("websites");
    const request = store.get(siteId);

    request.onsuccess = (event) => {
        const item = event.target.result;
        if (item.twoFASecret) {
            try {
                // Decrypt the secret key after loading it
                const bytes = CryptoJS.AES.decrypt(item.twoFASecret, encryptionPassword);
                secretKey = bytes.toString(CryptoJS.enc.Utf8);

                if (secretKey) {
                    console.log("Secret key decrypted successfully.");  // Debug without displaying the key
                    startGeneratingTOTP();
                } else {
                    alert("Decryption error: Secret key is empty.");
                }
            } catch (error) {
                console.error("Failed to decrypt the 2FA secret key:", error);
                alert("Error decrypting the 2FA secret key.");
            }
        } else {
            alert("No 2FA secret key found for this site.");
        }
    };

    request.onerror = (event) => {
        console.error("Error loading secret key from database:", event);
        alert("Failed to load 2FA secret key from the database.");
    };
}

// Function to copy OTP to clipboard
function copyOTP() {
    const otpElement = document.getElementById('otp');
    const otpCode = otpElement.innerText;

    if (otpCode) {
        navigator.clipboard.writeText(otpCode).then(() => {
            alert("OTP copied to clipboard!");
        }).catch((error) => {
            console.error("Failed to copy OTP:", error);
            alert("Failed to copy OTP. Please try again.");
        });
    } else {
        alert("No OTP code available to copy.");
    }
}

// Function to convert base32 to hex
// Convert decrypted Base32 secret key to Hex for TOTP generation
function base32ToHex(base32) {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    let hex = "";

    for (let i = 0; i < base32.length; i++) {
        const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
        if (val === -1) {
            console.error("Invalid Base32 character detected:", base32.charAt(i));
            return null;  // Return null if the character is not valid
        }
        bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 4 <= bits.length; i += 4) {
        const chunk = bits.substr(i, 4);
        hex += parseInt(chunk, 2).toString(16);
    }

    // Ensure the hex key is in byte increments by adding padding if necessary
    if (hex.length % 2 !== 0) {
        hex = "0" + hex;
    }

    return hex;
}


// Helper function for padding
function leftpad(str, len, pad) {
    return (new Array(len + 1).join(pad) + str).slice(-len);
}

function generateTOTP() {
    // Retrieve the HTML elements for OTP and countdown display
    const otpElement = document.getElementById('otp');
    const countdownElement = document.getElementById('countdown');

    // Validate that the elements exist to prevent null errors
    if (!otpElement || !countdownElement) {
        console.error("Required elements for OTP or countdown are missing from the page.");
        return; // Exit function if elements are missing
    }

    // Ensure the secret key is available
    if (!window.secretKey) {
        alert("Secret key not found.");
        return;
    }

    // Generate TOTP code
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');

    const shaObj = new jsSHA("SHA-1", "HEX");
    shaObj.setHMACKey(base32ToHex(window.secretKey), "HEX");
    shaObj.update(time);
    const hmac = shaObj.getHMAC("HEX");

    const offset = hex2dec(hmac.substring(hmac.length - 1));
    const otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')).toString();
    const totp = otp.slice(-6);  // Last 6 digits of the OTP

    // Display generated OTP
    otpElement.innerText = totp;

    // Update countdown timer
    updateCountdown();
}





function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionPassword);
    return bytes.toString(CryptoJS.enc.Utf8);
}


// Helper functions for converting between decimal and hex
function dec2hex(s) {
    return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
}

function hex2dec(s) {
    return parseInt(s, 16);
}

// Function to start generating the TOTP code every 30 seconds
function startGeneratingTOTP() {
    if (interval) {
        clearInterval(interval);
    }

    const timeLeft = 30 - (Math.floor(new Date().getTime() / 1000) % 30);

    // Generate OTP immediately and set up a timer to generate at the next 30-second interval
    generateTOTP();
    setTimeout(() => {
        generateTOTP();
        interval = setInterval(generateTOTP, 30000);  // Generate OTP every 30 seconds after the first one
    }, timeLeft * 1000);

    // Start countdown synced with the OTP generation
    updateCountdown(timeLeft);
}

// Function to update the countdown timer
// Declare countdownInterval globally to ensure it can be accessed and cleared in multiple functions
var countdownInterval;

function updateCountdown(initialTimeLeft = 30) {
    let timeLeft = initialTimeLeft;
    const countdownElement = document.getElementById('countdown');

    // Clear any existing countdown interval to avoid overlapping intervals
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    // Start a new interval for the countdown
    countdownInterval = setInterval(() => {
        countdownElement.innerText = `New code in ${timeLeft} seconds`;
        timeLeft--;

        // When timeLeft reaches 0, reset countdown to 30 for the next cycle
        if (timeLeft < 0) {
            clearInterval(countdownInterval);
            updateCountdown(30);  // Restart the countdown for the next cycle
        }
    }, 1000);
}

