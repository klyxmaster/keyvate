// Retrieve or prompt for the secretKey and encryptionPassword
function initializeKeys() {
    var secretKey = localStorage.getItem('secretKey');
    var encryptionPassword = localStorage.getItem('encryptionPassword');

    // Prompt the user to enter keys if they don't exist in localStorage
    if (!secretKey || !encryptionPassword) {
        secretKey = prompt("Enter your secret key for encryption:");
        encryptionPassword = prompt("Enter your encryption password:");

        if (secretKey && encryptionPassword) {
            // Save keys in localStorage for future use
            localStorage.setItem('secretKey', secretKey);
            localStorage.setItem('encryptionPassword', encryptionPassword);
        } else {
            alert("Encryption keys are required for this application.");
        }
    }

    return { secretKey, encryptionPassword };
}


// Generate a password based on user-defined length
function generatePassword() {
    const lengthInput = document.getElementById('password-length');
    const length = parseInt(lengthInput.value) || 16;

    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    // Ensure display element exists
    const passwordDisplay = ensurePasswordDisplay();
    passwordDisplay.textContent = password;
}

function copyGeneratedPassword() {
    const passwordElement = ensurePasswordDisplay();
    if (!passwordElement || !passwordElement.textContent) {
        console.error("No password available to copy.");
        return;
    }

    const password = passwordElement.textContent;

    navigator.clipboard.writeText(password).then(() => {
        alert("Password copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy password:", err);
    });
}


function ensurePasswordDisplay() {
    let passwordDisplay = document.getElementById('generated-password-display');
    if (!passwordDisplay) {
        // Create the element if it doesn't exist
        passwordDisplay = document.createElement('div');
        passwordDisplay.id = 'generated-password-display';
        document.getElementById('password-generator').appendChild(passwordDisplay);
    }
    return passwordDisplay;
}


function copyGeneratedPassword() {
    const passwordElement = document.getElementById('generated-password-display');
    console.log(passwordElement); // Check if the element exists
    if (!passwordElement || !passwordElement.textContent) {
        console.error("No password available to copy or element not found.");
        return;
    }

    const password = passwordElement.textContent;
    console.log("Password to copy:", password); // Log the password to ensure it's correct

    navigator.clipboard.writeText(password).then(() => {
        alert("Password copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy password:", err);
    });
}



function resetPasswordGenerator() {
    const generatorDiv = document.getElementById('password-generator');
    generatorDiv.innerHTML = `
        <span id="pwgen-label">pwgen</span>
        <input type="number" id="password-length" value="16" min="16" max="64" title="Password Length">
        <button id="generate-btn" onclick="generatePassword()">></button>
    `;
}





// Call initializeKeys to retrieve the keys
var { secretKey, encryptionPassword } = initializeKeys();


// Declare global variables
var db;
var currentEditingId = null; // Declare only once at the top
var interval; // Global variable for the timer interval


// Show Add Site Form and hide other elements
function showAddSiteForm() {
    document.getElementById('add-site-form').style.display = 'block';
    document.getElementById('add-card-form').style.display = 'none';
    document.getElementById('item-details').style.display = 'none';
}

// Show Add Card Form and hide other elements
function showAddCardForm() {
    document.getElementById('add-card-form').style.display = 'block';
    document.getElementById('add-site-form').style.display = 'none';
    document.getElementById('item-details').style.display = 'none';
}

// Cancel and hide form, showing details view
function cancelForm(formId) {
    document.getElementById(formId).style.display = 'none';
    document.getElementById('item-details').style.display = 'block';
}

// Toggle password visibility
function togglePasswordVisibility(password) {
    const passwordField = document.getElementById('password-field');
    passwordField.textContent = passwordField.textContent === "******" ? password : "******";
}

// Copy password to clipboard
function copyPassword(password) {
    navigator.clipboard.writeText(password).then(() => {
        alert("Password copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy password: ", err);
    });
}

function enterEditMode(itemId) {
    currentEditingId = itemId;  // Set the current editing item ID

    // Retrieve the item from IndexedDB
    const transaction = db.transaction(["websites"], "readonly");
    const store = transaction.objectStore("websites");
    const getRequest = store.get(itemId);

    getRequest.onsuccess = () => {
        const item = getRequest.result;

        // Populate form fields with existing data for editing
        document.getElementById('site-name').value = item.name;
        document.getElementById('site-url').value = item.url;
        document.getElementById('site-username').value = item.username;
        document.getElementById('site-password').value = decryptData(item.password);  // Decrypt password
        document.getElementById('site-notes').value = item.notes;
        document.getElementById('site-2fa-secret').value = item.twoFASecret ? decryptData(item.twoFASecret) : '';

        // Show the form and hide the details view
        document.getElementById('add-site-form').style.display = 'block';
        document.getElementById('item-details').style.display = 'none';
    };

    getRequest.onerror = (event) => {
        console.error("Error retrieving item for editing:", event.target.error);
    };
}


function loadItems(type) {
    const itemList = document.getElementById('item-list');
    itemList.innerHTML = '';  // Clear the list

    const transaction = db.transaction(type, "readonly");
    const store = transaction.objectStore(type);
    const getRequest = store.getAll();

    getRequest.onsuccess = () => {
        const items = getRequest.result;
        items.sort((a, b) => (a.name || a.cardType).localeCompare(b.name || b.cardType));

        items.forEach(item => {
            const listItem = document.createElement('li');
            let label = type === 'websites' ? item.name : item.cardType;

            if (type === 'cards') {
                // Check for expiring cards and mark with *
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1;
                const isExpiringSoon = 
                    (item.expirationYear == currentYear && item.expirationMonth <= (currentMonth + 3)) ||
                    (item.expirationYear == (currentYear + 1) && item.expirationMonth <= (currentMonth - 9));

                if (isExpiringSoon) {
                    label += " *";
                    listItem.style.color = "red";
                }

                listItem.onclick = () => displayCardDetails(item);
            } else {
                listItem.onclick = () => displayItemDetails(item);
            }

            listItem.textContent = label;
            itemList.appendChild(listItem);
        });
    };

    getRequest.onerror = (event) => {
        console.error("Error loading items:", event.target.error);
    };
}


function setupSearchFilter() {
    const searchInput = document.getElementById('search-query');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        loadItems('websites', query);
    });
}



function displayItemDetails(item) {
    const decryptedPassword = decryptData(item.password);
    const decryptedTwoFASecret = item.twoFASecret ? decryptData(item.twoFASecret) : null;

    const detailsContainer = document.getElementById('item-details');
    
    let detailsHTML = `
        <p><strong>Site:</strong> ${item.name}</p>
        <p><strong>Username:</strong> ${item.username}</p>
        <p><strong>Password:</strong> <span id="password-field">******</span>
            <button onclick="togglePasswordVisibility('${decryptedPassword}')">👁️</button>
            <button onclick="copyPassword('${decryptedPassword}')">Copy</button>
        </p>
    `;

    if (decryptedTwoFASecret) {
        detailsHTML += `
            <p><strong>2FA Code:</strong> <span id="otp">Loading...</span>
                <button onclick="copyOTP()">Copy OTP</button>
            </p>
            <p id="countdown">New code in 30 seconds</p>
        `;
        
        load2FAKeyFromDB(item.id);
    }

    detailsHTML += `<p><strong>Notes:</strong> ${item.notes}</p>`;
    detailsHTML += `<button onclick="enterEditMode(${item.id})">Edit</button>`;

    detailsContainer.innerHTML = detailsHTML;
}



function saveSite(event) {
	event.preventDefault();

	const name = document.getElementById('site-name').value;
	const url = document.getElementById('site-url').value;
	const username = document.getElementById('site-username').value;
	const password = document.getElementById('site-password').value;
	const notes = document.getElementById('site-notes').value;
	const twoFASecret = document.getElementById('site-2fa-secret').value;

	const encryptedPassword = encryptData(password);
	const encryptedTwoFASecret = encryptData(twoFASecret);

	const itemData = { name, url, username, password: encryptedPassword, notes, twoFASecret: encryptedTwoFASecret };

	const transaction = db.transaction(["websites"], "readwrite");
	const store = transaction.objectStore("websites");

	if (currentEditingId !== null) {
		itemData.id = currentEditingId;
		const updateRequest = store.put(itemData);

		updateRequest.onsuccess = () => {
			loadItems('websites');
			clearAddSiteForm();
			cancelForm('add-site-form');
			currentEditingId = null;
		};
	} else {
		const addRequest = store.add(itemData);

		addRequest.onsuccess = () => {
			loadItems('websites');
			clearAddSiteForm();
			cancelForm('add-site-form');
		};
	}
}

function encryptData(data) {
	return CryptoJS.AES.encrypt(data, encryptionPassword).toString();
}

function decryptData(encryptedData) {
	const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionPassword);
	return bytes.toString(CryptoJS.enc.Utf8);
}

function clearAddSiteForm() {
	document.getElementById('site-name').value = '';
	document.getElementById('site-url').value = '';
	document.getElementById('site-username').value = '';
	document.getElementById('site-password').value = '';
	document.getElementById('site-notes').value = '';
}

function exportDatabase() {
    const transaction = db.transaction("websites", "readonly");
    const store = transaction.objectStore("websites");
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (event) => {
        const items = event.target.result;

        // Convert the items to JSON
        const jsonString = JSON.stringify(items, null, 2);

        // Create a blob and download it
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "websites_db_export.json";
        a.click();

        URL.revokeObjectURL(url);  // Clean up the URL object
    };

    getAllRequest.onerror = (event) => {
        console.error("Failed to export database:", event.target.error);
        alert("Error exporting database. Please try again.");
    };
}


function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) {
        alert("No file selected.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);

        // Open a transaction with readwrite access
        const transaction = db.transaction("websites", "readwrite");
        const store = transaction.objectStore("websites");

        // Clear the current data in the store
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => {
            console.log("Existing database records cleared.");

            // Add each item from the JSON data to the database
            data.forEach(item => {
                store.add(item);
            });

            transaction.oncomplete = () => {
                alert("Database imported successfully, and old data replaced!");
                loadItems('websites');  // Refresh the items after import
            };
        };

        clearRequest.onerror = (event) => {
            console.error("Error clearing existing database records:", event.target.error);
            alert("Failed to clear existing database records. Import aborted.");
        };
    };

    reader.onerror = (e) => {
        console.error("File reading error:", e);
        alert("Error reading the file. Please try again.");
    };

    reader.readAsText(file);
}

function wipeDatabase() {
    const confirmation = confirm("Are you sure you want to wipe the database? This action is not reversible.");
    if (!confirmation) {
        return; // Exit if the user cancels
    }

    const transaction = db.transaction("websites", "readwrite");
    const store = transaction.objectStore("websites");
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
        alert("Database wiped successfully!");
        loadItems('websites'); // Refresh the UI to show an empty list
    };

    clearRequest.onerror = (event) => {
        console.error("Error wiping database:", event.target.error);
        alert("Failed to wipe the database. Please try again.");
    };
}

function saveCard(event) {
    event.preventDefault();

    const cardType = document.getElementById('card-type').value;
    const cardNumber = document.getElementById('card-number').value;
    const expirationMonth = document.getElementById('expiration-month').value;
    const expirationYear = document.getElementById('expiration-year').value;
    const cvv = document.getElementById('cvv').value;
    const balance = document.getElementById('balance').value || null; // Optional
    const limit = document.getElementById('limit').value || null; // Optional

    const encryptedCardNumber = encryptData(cardNumber);
    const encryptedCVV = encryptData(cvv);

    const cardData = {
        cardType,
        cardNumber: encryptedCardNumber,
        expirationMonth,
        expirationYear,
        cvv: encryptedCVV,
        balance,
        limit,
    };

    const transaction = db.transaction(["cards"], "readwrite");
    const store = transaction.objectStore("cards");
    store.add(cardData);

    transaction.oncomplete = () => {
        alert("Credit card saved successfully!");
        loadItems('cards'); // Refresh the card list
        clearAddCardForm();
    };
}

function displayCardDetails(item) {
    const decryptedCardNumber = decryptData(item.cardNumber);
    const decryptedCVV = decryptData(item.cvv);

    const detailsContainer = document.getElementById('item-details');
    detailsContainer.innerHTML = `
        <p><strong>Card Type:</strong> ${item.cardType}</p>
        <p><strong>Card Number:</strong> 
            <span id="card-number-field">******</span>
            <button onclick="toggleCardNumberVisibility('${decryptedCardNumber}')">👁️</button>
            <button onclick="copyToClipboard('${decryptedCardNumber}')">Copy</button>
        </p>
        <p><strong>Expiration:</strong> ${item.expirationMonth}/${item.expirationYear}</p>
        <p><strong>CVV:</strong> ${decryptedCVV}</p>
        ${item.balance ? `<p><strong>Balance:</strong> $${item.balance}</p>` : ""}
        ${item.limit ? `<p><strong>Limit:</strong> $${item.limit}</p>` : ""}
        <button onclick="enterCardEditMode(${item.id})">Edit</button>
    `;
}



function enterCardEditMode(cardId) {
    currentEditingId = cardId;

    const transaction = db.transaction(["cards"], "readonly");
    const store = transaction.objectStore("cards");
    const getRequest = store.get(cardId);

    getRequest.onsuccess = () => {
        const card = getRequest.result;

        document.getElementById('card-type').value = card.cardType;
        document.getElementById('card-number').value = decryptData(card.cardNumber);
        document.getElementById('expiration-month').value = card.expirationMonth;
        document.getElementById('expiration-year').value = card.expirationYear;
        document.getElementById('cvv').value = decryptData(card.cvv);
        document.getElementById('balance').value = card.balance || '';
        document.getElementById('limit').value = card.limit || '';

        document.getElementById('add-card-form').style.display = 'block';
        document.getElementById('item-details').style.display = 'none';
    };
}


function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy text:", err);
    });
}

function clearAddCardForm() {
    document.getElementById('card-type').value = '';
    document.getElementById('card-number').value = '';
    document.getElementById('expiration-month').value = '';
    document.getElementById('expiration-year').value = '';
    document.getElementById('cvv').value = '';
    document.getElementById('balance').value = '';
    document.getElementById('limit').value = '';
}

function toggleCardNumberVisibility(decryptedCardNumber) {
    const cardNumberField = document.getElementById('card-number-field');

    if (cardNumberField.textContent === "******") {
        // Show the actual card number
        cardNumberField.textContent = decryptedCardNumber;
    } else {
        // Mask the card number again
        cardNumberField.textContent = "******";
    }
}

function toggleAddButton(type) {
    document.getElementById('add-website-button').style.display = type === 'websites' ? 'block' : 'none';
    document.getElementById('add-card-button').style.display = type === 'cards' ? 'block' : 'none';
    loadItems(type); // Call loadItems with the selected type to refresh the list
}



// Initialize database and load items on page load
window.onload = function() {
	initializeKeys();  // Initialize encryption keys
    initDatabase();

    function initDatabase() {
        const request = indexedDB.open("PersistentDB", 3);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains("websites")) {
                const websiteStore = db.createObjectStore("websites", { keyPath: "id", autoIncrement: true });
                websiteStore.createIndex("name", "name", { unique: false });
            }
            if (!db.objectStoreNames.contains("cards")) {
                const cardStore = db.createObjectStore("cards", { keyPath: "id", autoIncrement: true });
                cardStore.createIndex("cardType", "cardType", { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            loadItems('websites');  // Default to loading websites on startup
        };

        request.onerror = (event) => {
            console.error("Database failed to open:", event.target.errorCode);
        };
    }
};
