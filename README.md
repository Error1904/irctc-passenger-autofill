# 🚂 IRCTC Passenger Autofill

A Chrome Extension that helps travelers quickly fill passenger details during train ticket booking on IRCTC, reducing repetitive data entry and saving valuable booking time.

---

## Problem Statement

Frequent train travelers often book tickets for the same family members, friends, or colleagues. Every time a ticket is booked on IRCTC, users must manually enter passenger information such as:

* Name
* Age
* Gender
* Nationality
* Berth Preference

This process becomes repetitive and time-consuming, especially when:

* Booking tickets regularly
* Booking for multiple passengers
* Booking during Tatkal or high-demand periods
* Managing passenger information for family trips

Manual entry also increases the chances of typing mistakes and slows down the booking process.

---

## Solution

IRCTC Passenger Autofill allows users to save passenger profiles locally within the browser and automatically fill passenger details on the IRCTC booking page with a single click.

Instead of entering the same information repeatedly, users can store their passenger details once and reuse them whenever needed.

---

## Features

### Passenger Profile Management

* Save up to 6 passenger profiles
* Edit existing passenger information
* Delete passenger profiles
* Store data locally using Chrome Storage

### One-Click Autofill

Automatically fills:

* Passenger Name
* Age
* Gender
* Nationality
* Berth Preference

on the IRCTC passenger details page.

### Privacy Focused

* All data is stored locally on the user's device
* No cloud storage
* No analytics or tracking
* No external servers involved

---

## How It Works

### Step 1: Save Passenger Details

1. Open the extension popup.
2. Enter passenger information.
3. Click **Save**.
4. Repeat for additional passengers.

### Step 2: Fill Details on IRCTC

1. Log in to IRCTC manually.
2. Search for a train and select your preferred class.
3. Proceed to the passenger details page.
4. Open the extension popup.
5. Click **Fill Passengers on IRCTC**.
6. Verify the information and continue with booking.

---

## Installation

### Install from Source

1. Clone this repository:

```bash
git clone https://github.com/YOUR_USERNAME/irctc-passenger-autofill.git
```

2. Open Chrome and navigate to:

```text
chrome://extensions/
```

3. Enable **Developer Mode**.
4. Click **Load Unpacked**.
5. Select the extension folder.
6. The extension is now ready to use.

---

## Project Structure

```text
irctc-passenger-autofill/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
├── background.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## Technologies Used

* HTML
* CSS
* JavaScript
* Chrome Extensions API
* Chrome Storage API
* Manifest V3

---

## Security & Privacy

Passenger data is stored using:

```javascript
chrome.storage.local
```

The extension:

* Does not collect user data
* Does not transmit passenger information
* Does not communicate with external servers
* Does not track browsing activity

All information remains on the user's device.

---

## Limitations

This extension is designed only to assist with passenger form filling.

It does NOT:

* Bypass IRCTC login
* Solve CAPTCHA challenges
* Handle OTP verification
* Process payments
* Select seats automatically
* Book tickets automatically
* Interact with Tatkal queues or waiting rooms

Users must complete all booking and verification steps manually.

---

## Future Enhancements

Potential future improvements include:

* Passenger import/export
* Multiple passenger groups
* Senior citizen preference support
* Meal preference support
* Cloud backup (optional)
* Firefox compatibility
* Additional booking form automation within allowed limits

---

## Contributing

Contributions, bug reports, feature requests, and suggestions are welcome.

If you would like to contribute:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Submit a pull request

---

## Disclaimer

This project is an independent productivity tool created for educational and personal-use purposes.

This extension is not affiliated with, endorsed by, sponsored by, or associated with IRCTC in any way.

Users are responsible for reviewing all passenger details before completing their booking.

---

## License

MIT License

Feel free to use, modify, and distribute this project in accordance with the license terms.
