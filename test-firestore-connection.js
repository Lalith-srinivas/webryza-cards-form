import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, limit, query, serverTimestamp, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0klqmY-B4RwyoPdMSmC2zILlrPD27bU8",
  authDomain: "webryza-admin.firebaseapp.com",
  projectId: "webryza-admin",
  storageBucket: "webryza-admin.firebasestorage.app",
  messagingSenderId: "812029553523",
  appId: "1:812029553523:web:cfa165843b1745c31a7306",
  measurementId: "G-46ZVVN789J"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  console.log("Checking Firestore connection to project:", firebaseConfig.projectId);
  try {
    // 1. Try reading wedding_partners
    console.log("Checking collection 'wedding_partners'...");
    const partnersQuery = query(collection(db, "wedding_partners"), limit(5));
    const partnersSnap = await getDocs(partnersQuery);
    console.log(`Found ${partnersSnap.docs.length} partner documents in 'wedding_partners'.`);
    partnersSnap.forEach(d => {
      console.log(`- Partner Doc ID: ${d.id}`, d.data());
    });

    // 2. Test inserting a test registration into wedding_cards
    console.log("\nTesting insertion of a valid test registration into 'wedding_cards'...");
    const testDoc = {
      brideName: "Priya",
      groomName: "Rahul",
      brideParents: "Srinivas and Lakshmi",
      groomParents: "Ramesh and Sita",
      phone: "9876543210",
      email: "priya@example.com",
      weddingDate: Timestamp.now(),
      weddingTime: "10:30 AM",
      venueName: "Grand Convention Hall",
      venueAddress: "Tirupati",
      venueLocation: "https://maps.google.com/?q=Tirupati",
      additionalDetails: "Automated verification test",
      events: [
        {
          eventName: "Haldi",
          date: "2026-12-13",
          time: "10:00 AM",
          venueName: "Bride's Residence",
          venueAddress: "Tirupati",
          locationLink: "",
          description: ""
        }
      ],
      aiVideoRequired: true,
      aiVideoStatus: "pending",
      partnerId: "SHOP001",
      partnerShopName: "Sri Lakshmi Wedding Cards",
      source: "partner",
      amountCharged: 2000,
      webryzaShare: 1500,
      partnerCommission: 500,
      amountReceivedByWebryza: 0,
      amountDueToWebryza: 1500,
      status: "confirmed",
      paymentStatus: "pending",
      websiteUrl: "",
      adminNotes: "Test submission from verification suite",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "wedding_cards"), testDoc);
    console.log("SUCCESS! Test registration created in Firestore 'wedding_cards' collection with Auto-ID:", docRef.id);
  } catch (err) {
    console.error("Firestore test notice/error:", err.message);
  }
}

testConnection().then(() => {
  console.log("Firestore test completed.");
  process.exit(0);
}).catch(e => {
  console.error("Unhandled test error:", e);
  process.exit(1);
});
