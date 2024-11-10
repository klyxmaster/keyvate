# Keyvate: Online Password Manager

**Keyvate** is a free, open-source password manager designed with maximum security and privacy in mind. Unlike other password managers, Keyvate stores your encrypted data locally within your browser, ensuring that only you have access to your sensitive information. With **Keyvate**, you can rest assured that your data stays offline and private.

## Key Features
- **Local Storage Only**: Passwords and sensitive data are stored locally in your browser, meaning your data never leaves your device.
- **Full User Control**: With full control over your encryption keys and data, no third parties can access or decrypt your information.
- **Remote Access to the App**: Access Keyvate from any browser, but keep your data stored securely on each specific device.

## Pros and Cons

### Pros:
1. **Enhanced Security and Privacy**: Keyvate’s local storage ensures that your data isn’t exposed to cloud-based breaches, making it one of the safest options for managing passwords.
2. **Complete User Control**: Only you have access to your encryption keys and data, giving you full ownership and control.
3. **No Internet Dependence for Data Access**: Your data is stored in IndexedDB, so it remains accessible even if you’re offline.

### Cons:
1. **Browser-Specific Storage**: Each browser stores data independently, so you’ll need to manually export and import your database when switching between browsers.
2. **Manual Cross-Device Sync**: If you need access across devices, export and import functionality allows data sharing, though it lacks auto-syncing.
3. **Potential Data Loss on iOS**: Some mobile platforms, like iOS, may occasionally clear IndexedDB storage under low storage conditions. Regular export is recommended.

## Security Notice
Keyvate uses **IndexedDB** for local data storage and AES encryption for password security, ensuring that your data remains accessible only to you. With no centralized database, Keyvate provides a highly secure solution that minimizes remote access risks.

---

## Getting Started

Setting up Keyvate is quick and requires no installation! For the highest security, Keyvate operates entirely within your browser with data stored locally. Follow the steps below to start securely managing your passwords with Keyvate.

### Requirements
- **Browser**: Compatible with Chrome, Firefox, Safari, and Edge.
- **No Server Required**: Keyvate runs locally in your browser, but it’s compatible with local server setups like XAMPP, WAMP, or MAMP if desired.

### Setup Instructions

1. **Download and Open Keyvate**
   - Open Keyvate in your browser. It’s fully local, so no installation is necessary!

2. **Create Your Encryption Keys**
   - When you first open Keyvate, you’ll be prompted to create two unique passwords:
     - **Secret Key**: Used to encrypt your database.
     - **Encryption Password**: Adds an additional layer of security.
   - **Important**: Save these passwords somewhere safe. They will be required each time you open Keyvate and are needed to decrypt and access your database.

3. **Start Managing Passwords**
   - Once your keys are set, you can start adding sites and passwords to Keyvate.
   - Export your data periodically to ensure you have a backup copy that can be imported into other browsers if needed.

## Optional: Using a Local Server
While Keyvate works directly in your browser, you may optionally use a local server environment (such as XAMPP, WAMP, or MAMP). Running Keyvate on a local server provides some additional flexibility, but it’s not required for normal operation.

### Steps for Local Server Setup
1. Place Keyvate files in your server’s root directory (e.g., `htdocs` for XAMPP).
2. Start the local server and access Keyvate by entering `localhost` followed by the directory path in your browser’s URL bar.

## Exporting and Importing Data
- **Export**: Regularly export your data for backup or to transfer to another browser.
- **Import**: To restore data, import the JSON file you previously exported.

By following these steps, you’re set to start using Keyvate—the secure, local-first password manager that gives you total control over your data!
