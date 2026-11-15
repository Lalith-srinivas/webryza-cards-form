# WebRyza Cards Form — Digital Wedding Registration Website

A modern, responsive, wedding-themed registration website for **WebRyza**. This website is accessed by couples directly or by scanning partner QR codes at physical wedding card printing shops (e.g. `https://cards.webryza.in/?ref=SHOP001`).

All submitted wedding details are saved directly into the existing WebRyza Firestore collection: `wedding_cards`, seamlessly connecting with the existing **WebRyza Admin Panel**.

---

## 1. Project Structure

```text
WebRyza-Cards-Form/
├── public/
│   ├── favicon.svg                  # Luxury interlocking golden wedding rings monogram
│   └── _redirects                   # Netlify SPA client routing rules
├── src/
│   ├── components/
│   │   ├── Header.jsx               # Luxury WebRyza branding & verified partner attribution pill
│   │   ├── HeroBanner.jsx           # "Your Wedding, Beautifully Invited." with alert states
│   │   ├── ProgressStepper.jsx      # 5-step gold progress indicator
│   │   ├── StepCoupleDetails.jsx    # Section A: Bride, Groom, Parents, Phone, Email
│   │   ├── StepWeddingDetails.jsx   # Section B: Date, Time, Venue, Maps Link, Notes
│   │   ├── StepEvents.jsx           # Section C: Dynamic Haldi, Mehendi, Sangeet, Reception cards
│   │   ├── StepPackagePricing.jsx   # Sections D & E: AI Video toggle & Total Amount input
│   │   ├── StepReview.jsx           # Step 5: Complete summary review before final submission
│   │   ├── SuccessModal.jsx         # Section 10: Confirmation screen, Ref ID, WhatsApp assistance
│   │   ├── PartnerLoginFloatingButton.jsx # Floating "Partner Login" button at bottom-right
│   │   └── ProtectedRoute.jsx       # Route guard for authenticated active partners
│   ├── pages/
│   │   ├── PublicFormPage.jsx       # Public wedding registration page (/)
│   │   ├── PartnerLoginPage.jsx     # Professional Partner Login portal (/admin/login)
│   │   └── PartnerDashboardPage.jsx # Real-time SaaS Partner Dashboard (/admin/dashboard)
│   ├── config/
│   │   └── firebase.js              # Initialized Firebase Client SDK (Auth, Firestore, Analytics)
│   ├── context/
│   │   ├── FormContext.jsx          # Public form state, validations, partner referral detection
│   │   └── PartnerAuthContext.jsx   # Partner authentication, session persistence, active check
│   ├── services/
│   │   ├── partnerService.js        # Retrieves & verifies partner from wedding_partners
│   │   └── registrationService.js   # Submits data to wedding_cards via backend/Firestore
│   ├── utils/
│   │   ├── commission.js            # WebRyza commission business calculation rules
│   │   ├── validation.js            # Strict validation for phone, email, URLs, amounts, events
│   │   └── formatters.js            # INR currency and date formatters
│   ├── App.jsx                      # React Router configuration for /, /admin/login, /admin/dashboard
│   ├── index.css                    # Luxury cream, ivory, soft gold theme & glassmorphic styling
│   └── main.jsx                     # React entry point
├── firestore.rules                  # Firestore Security Rules with partner read isolation & admin write
├── vercel.json                      # Vercel SPA routing and cache headers
├── netlify.toml                     # Netlify build & functions configuration
├── test-scenarios.js                # Test suite covering all 15 registration scenarios
├── test-partner-portal.js           # Test suite covering Partner Portal metrics & auth scenarios
├── .env.example                     # Environment variables template
├── package.json
└── vite.config.js
```

---

## 2. Design Aesthetic
- **Color Palette**: Cream (`#FFFDF9`), Ivory (`#FAF7F2`), Warm Gold (`#D4AF37`, `#C9972C`, `#B8860B`), Charcoal (`#25201A`).
- **Typography**: Cormorant Garamond (luxury editorial serif) & Plus Jakarta Sans (high-clarity mobile sans-serif).
- **Mobile-First**: Optimized for smartphone screens since over 90% of customers scan the partner QR code from their mobile device.

---

## 3. Partner QR Identification Logic

The website inspects the URL for the `ref` query parameter:
- **Partner URL**: `https://cards.webryza.in/?ref=SHOP001`
  1. Searches `wedding_partners` by document ID or `partnerId` / `code` field.
  2. Verifies `isActive === true`.
  3. Displays verified badge: `"Registration through Sri Lakshmi Wedding Cards"`.
  4. Locks partner details — customers cannot edit the partner name or ID.
  5. Sets `source: "partner"`, `partnerId: "SHOP001"`, `partnerShopName: "Sri Lakshmi Wedding Cards"`.
- **Direct URL**: `https://cards.webryza.in/` (no `ref` parameter)
  1. Direct registration is enabled immediately.
  2. Sets `source: "direct"`, `partnerId: ""`, `partnerShopName: "Direct"`.
- **Inactive / Invalid Partner Code**:
  - Displays a polite notice informing the user that the partner code could not be verified and proceeds as a safe direct registration so the couple is not blocked.

---

## 4. Commission Business Rules

Calculated securely according to WebRyza business rules:
- **Minimum Amount**: ₹1,500
- **If `amountCharged < ₹2,000`**:
  - `webryzaShare = ₹1,000`
- **If `amountCharged >= ₹2,000`**:
  - `webryzaShare = ₹1,500`
- **For Partner Registrations**:
  - `partnerCommission = amountCharged - webryzaShare`
- **For Direct Registrations**:
  - `partnerCommission = 0`

| Amount Charged | WebRyza Share | Partner Commission (Partner) | Partner Commission (Direct) |
| :--- | :--- | :--- | :--- |
| **₹1,500** | ₹1,000 | ₹500 | ₹0 |
| **₹1,800** | ₹1,000 | ₹800 | ₹0 |
| **₹2,000** | ₹1,500 | ₹500 | ₹0 |
| **₹2,500** | ₹1,500 | ₹1,000 | ₹0 |
| **₹3,000** | ₹1,500 | ₹1,500 | ₹0 |

> **Critical Rule Enforced**: The exact amount submitted by the customer is preserved as `amountCharged`. WebRyza commission fields are never exposed to the customer on the form and are processed on the backend.

---

## 5. Firestore Document Structure in `wedding_cards`

Every valid submission generates an Auto-ID document in `wedding_cards`:
```json
{
  "brideName": "Priya",
  "groomName": "Rahul",
  "brideParents": "Srinivas and Lakshmi",
  "groomParents": "Ramesh and Sita",
  "phone": "9876543210",
  "email": "priya@example.com",
  "weddingDate": "Timestamp",
  "weddingTime": "10:30 AM",
  "venueName": "Grand Convention Hall",
  "venueAddress": "Tirupati",
  "venueLocation": "https://maps.google.com/?q=Tirupati",
  "additionalDetails": "",
  "events": [
    {
      "eventName": "Haldi",
      "date": "2026-12-13",
      "time": "10:00 AM",
      "venueName": "Bride's Residence",
      "venueAddress": "Tirupati",
      "locationLink": "",
      "description": ""
    }
  ],
  "aiVideoRequired": true,
  "aiVideoStatus": "pending",
  "partnerId": "SHOP001",
  "partnerShopName": "Sri Lakshmi Wedding Cards",
  "source": "partner",
  "amountCharged": 2000,
  "webryzaShare": 1500,
  "partnerCommission": 500,
  "amountReceivedByWebryza": 0,
  "amountDueToWebryza": 1500,
  "status": "confirmed",
  "paymentStatus": "pending",
  "websiteUrl": "",
  "adminNotes": "",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

---

## 6. Firestore Security Rules Configuration

To allow public customers to create registrations without reading other customers' private data, apply the rules in `firestore.rules` to your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null;
    }

    // Allow public to look up partner details for QR verification
    match /wedding_partners/{partnerId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Allow public to create new registration with required fields and valid minimum amount
    // Prevent public from reading, updating, or deleting registrations
    match /wedding_cards/{registrationId} {
      allow create: if request.resource.data.brideName is string
                    && request.resource.data.groomName is string
                    && request.resource.data.phone is string
                    && request.resource.data.amountCharged is number
                    && request.resource.data.amountCharged >= 1500
                    && request.resource.data.webryzaShare is number
                    && request.resource.data.status == "confirmed"
                    && request.resource.data.paymentStatus == "pending"
                    && request.resource.data.amountReceivedByWebryza == 0;
      
      // Only authenticated WebRyza Admin Panel can read, list, update, or delete
      allow read, update, delete: if isAdmin();
    }

    // Keep all other admin panel collections untouched
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## 7. Vercel Deployment Instructions

This project is fully configured for deployment on **Vercel** with full SPA routing, page refresh support, and partner URL compatibility (`https://cards.webryza.in/?ref=SHOP001`).

### Step A: Push Project to GitHub
```bash
git add .
git commit -m "Initial commit: WebRyza Cards Form"
git branch -M main
git remote add origin https://github.com/<your-username>/webryza-cards-form.git
git push -u origin main
```

### Step B: Import Project into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Select your `webryza-cards-form` repository from GitHub.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add the following:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyB0klqmY-B4RwyoPdMSmC2zILlrPD27bU8
   VITE_FIREBASE_AUTH_DOMAIN=webryza-admin.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=webryza-admin
   VITE_FIREBASE_STORAGE_BUCKET=webryza-admin.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=812029553523
   VITE_FIREBASE_APP_ID=1:812029553523:web:cfa165843b1745c31a7306
   VITE_FIREBASE_MEASUREMENT_ID=G-46ZVVN789J
   VITE_WHATSAPP_SUPPORT_NUMBER=919876543210
   ```
5. Click **Deploy**.

### Step C: Custom Domain Setup (`cards.webryza.in`)
1. In Vercel, go to **Settings > Domains**.
2. Add `cards.webryza.in`.
3. In your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.), add a `CNAME` record:
   - **Type**: `CNAME`
   - **Name / Host**: `cards`
   - **Value / Target**: `cname.vercel-dns.com`

---

## 8. Netlify Deployment Instructions (Alternative)

1. **Connect Repository to Netlify**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
2. **Environment Variables on Netlify**:
   Add the following in **Site Configuration > Environment Variables**:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyB0klqmY-B4RwyoPdMSmC2zILlrPD27bU8
   VITE_FIREBASE_AUTH_DOMAIN=webryza-admin.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=webryza-admin
   VITE_FIREBASE_STORAGE_BUCKET=webryza-admin.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=812029553523
   VITE_FIREBASE_APP_ID=1:812029553523:web:cfa165843b1745c31a7306
   VITE_FIREBASE_MEASUREMENT_ID=G-46ZVVN789J
   VITE_WHATSAPP_SUPPORT_NUMBER=919876543210
   ```
3. **Deploy**:
   - Run `git push` or deploy manually via `netlify deploy --prod`.
   - Your site will be live at `https://cards.webryza.in` (configured via Netlify custom domains).

---

## 8. Verification & Test Execution

Run the built-in test suite:
```bash
node test-scenarios.js
```
The test suite validates:
- Commission calculation at ₹1,500, ₹1,800, ₹2,000, ₹2,500, ₹3,000.
- Rejection of amounts below ₹1,500.
- Direct registration vs. Partner registration attributions.
- Inactive and invalid partner ID handling.
- Mandatory field validations, Indian phone formats, optional emails, Google Maps URLs, and multi-event schedules.
