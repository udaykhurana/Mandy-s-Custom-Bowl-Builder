// Your Firebase Config (from Firebase Project Settings) - ALREADY UPDATED WITH YOUR CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBgJImFtnnZF8nBd-DIZgUvHaAVZn7Ajwg",
    authDomain: "mycustombowls.firebaseapp.com",
    projectId: "mycustombowls",
    storageBucket: "mycustombowls.firebasestorage.app",
    messagingSenderId: "528721723762",
    appId: "1:528721723762:web:9c63b50c81d804419a9deb",
    measurementId: "G-62S674CEBP"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const customBowlsCollection = db.collection("customBowls");

// --- Auth UI Elements ---
const googleSignInButton = document.getElementById('googleSignInButton');
const signOutButton = document.getElementById('signOutButton');
const userStatusElement = document.getElementById('user-status');
const allSavedBowlsSection = document.getElementById('allSavedBowls');

// --- Google Sign-In Function ---
googleSignInButton.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        // User signed in successfully. The onAuthStateChanged listener will handle UI update.
    } catch (error) {
        console.error("Google Sign-In Error:", error.message);
        alert("Sign-in failed: " + error.message);
    }
});

// --- Sign Out Function ---
signOutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
        // User signed out successfully. The onAuthStateChanged listener will handle UI update.
    } catch (error) {
        console.error("Sign-Out Error:", error.message);
        alert("Sign-out failed: " + error.message);
    }
});

// --- Authentication State Listener (CRUCIAL FOR ACCESS CONTROL) ---
// This function runs whenever the user's login status changes
auth.onAuthStateChanged((user) => {
    // --- IMPORTANT: REPLACE "YOUR_UDAY_FIREBASE_UID_HERE" WITH YOUR ACTUAL UID ---
    // You get your UID from Firebase Console -> Authentication -> Users tab AFTER you log in to your app once.
    const UDAY_FIREBASE_UID = "YOUR_UDAY_FIREBASE_UID_HERE"; 

    if (user) {
        // User is signed in.
        userStatusElement.textContent = `Logged in as: ${user.email}`;
        googleSignInButton.style.display = 'none';
        signOutButton.style.display = 'inline-block';

        if (user.uid === UDAY_FIREBASE_UID) {
            // It's Uday! Show the 'All Saved Bowls' section and load bowls.
            allSavedBowlsSection.style.display = 'block';
            displayAllSavedBowls(); // This function will now be called only for Uday
        } else {
            // It's another logged-in user, but not Uday. Hide the section.
            allSavedBowlsSection.style.display = 'none';
            allSavedBowlsSection.innerHTML = '<p>You do not have permission to view all saved bowls.</p>';
        }
    } else {
        // User is signed out.
        userStatusElement.textContent = `You are not logged in.`;
        googleSignInButton.style.display = 'inline-block';
        signOutButton.style.display = 'none';
        allSavedBowlsSection.style.display = 'none'; // Hide when logged out
        allSavedBowlsSection.innerHTML = ''; // Clear content when logged out
    }
});


// --- Existing Bowl Builder Functions (Modified to use customBowlsCollection) ---

function getSelectedValue(name) {
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    return radio ? radio.value : '';
}

function getCheckedValues(category) {
    const checkboxes = document.querySelectorAll(`.${category} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function clearForm() {
    document.getElementById('bowlName').value = '';
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => radio.checked = false);
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => checkbox.checked = false);
    document.getElementById('summary').innerHTML = '';
    document.getElementById('copyButton').style.display = 'none';
}

async function buildBowl() {
    const bowlName = document.getElementById('bowlName').value || 'Unnamed Bowl';
    const base = getSelectedValue('base');
    const freshHerbs = getCheckedValues('category').filter(item => ['Basil', 'Mint', 'Cilantro', 'Parsley'].includes(item));
    const vegetables = getCheckedValues('category').filter(item => ['Avocado', 'Carrots', 'Chickpeas', 'Cucumber', 'Green Onions', 'Mushrooms', 'Pickled Red Onions', 'Red Pepper', 'Broccoli', 'Cherry Tomatoes', 'Corn', 'Edamame', 'Kalamata Olives', 'Purple Cabbage', 'Red Onions', 'Roasted Sweet Potato'].includes(item));
    const fruits = getCheckedValues('category').filter(item => ['Apple', 'Dried Figs', 'Mango', 'Dried Cranberries', 'Mandarins', 'Pomegranate'].includes(item));
    const crunchies = getCheckedValues('category').filter(item => ['Baked Pita Chips', 'Crispy Noodles', 'Peanuts', 'Sunflower Seeds', 'Walnuts', 'Nori Strips', 'Tortilla Chips', 'Cashews', 'Pecans', 'Sesame Seeds', 'Tempura Onions', 'Wonton Strips', 'Crispy Capers'].includes(item));
    const cheese = getCheckedValues('category').filter(item => ['Mozzarella', 'Parmesan', 'Vegan Feta', 'Feta', 'Goat', 'Cheddar'].includes(item));
    const proteins = getCheckedValues('category').filter(item => ['Coconut Curry Shrimp', 'Togarashi Seared Tuna', 'Grilled Chicken', 'Tamari Mock Chicken', 'Peanut Mock Chicken', 'Bacon', 'Roasted Turkey', 'Free Run Hard-boiled Egg', 'White Tuna', 'Hoisin Duck', 'Balsamic Tofu'].includes(item));
    const dressings = getCheckedValues('category').filter(item => ['Caesar', 'Cilantro Cumin', 'Wasabi Ginger', 'Chili Lime', 'Green Goddess', 'Lemon Dill', 'Summer', 'Tamari', 'Carrot Ginger', 'Classic Balsamic', 'Honey Mustard', 'Lemon Olive Oil', 'Sweet Sesame', 'Tangy Citrus'].includes(item));
    const extras = getCheckedValues('category').filter(item => ['Extra Dressing', 'Hot Sauce'].includes(item));


    let summaryText = `--- ${bowlName} ---\n\n`;
    if (base) summaryText += `Base: ${base}\n`;
    if (freshHerbs.length > 0) summaryText += `Fresh Herbs: ${freshHerbs.join(', ')}\n`;
    if (vegetables.length > 0) summaryText += `Vegetables: ${vegetables.join(', ')}\n`;
    if (fruits.length > 0) summaryText += `Fruits: ${fruits.join(', ')}\n`;
    if (crunchies.length > 0) summaryText += `Crunchies: ${crunchies.join(', ')}\n`;
    if (cheese.length > 0) summaryText += `Cheese: ${cheese.join(', ')}\n`;
    if (proteins.length > 0) summaryText += `Proteins: ${proteins.join(', ')}\n`;
    if (dressings.length > 0) summaryText += `Dressings: ${dressings.join(', ')}\n`;
    if (extras.length > 0) summaryText += `Extras: ${extras.join(', ')}\n`;

    const summaryDiv = document.getElementById('summary');
    summaryDiv.textContent = summaryText;
    document.getElementById('copyButton').style.display = 'inline-block';

    const bowlData = {
        name: bowlName,
        base: base,
        freshHerbs: freshHerbs,
        vegetables: vegetables,
        fruits: fruits,
        crunchies: crunchies,
        cheese: cheese,
        proteins: proteins,
        dressings: dressings,
        extras: extras,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const docRef = await customBowlsCollection.add(bowlData);
        summaryDiv.textContent += `\n\nShareable ID: ${docRef.id}`;
        // Automatically refresh saved bowls if Uday is logged in
        if (auth.currentUser && auth.currentUser.uid === UDAY_FIREBASE_UID) { // UDAY_FIREBASE_UID is defined at the top of script.js
             displayAllSavedBowls();
        }
        clearForm();
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Error saving bowl. Please check your console for details.");
    }
}

async function copySummary() {
    const summaryDiv = document.getElementById('summary');
    try {
        await navigator.clipboard.writeText(summaryDiv.textContent);
        alert('Bowl summary and ID copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

async function loadBowl() {
    const bowlId = document.getElementById('loadBowlId').value.trim();
    if (!bowlId) {
        alert('Please enter a Shareable ID to load.');
        return;
    }

    try {
        const doc = await customBowlsCollection.doc(bowlId).get();
        if (doc.exists) {
            const bowlData = doc.data();
            let loadedSummaryText = `--- Loaded Bowl: ${bowlData.name || 'Unnamed Bowl'} ---\n\n`;
            if (bowlData.base) loadedSummaryText += `Base: ${bowlData.base}\n`;
            if (bowlData.freshHerbs && bowlData.freshHerbs.length > 0) loadedSummaryText += `Fresh Herbs: ${bowlData.freshHerbs.join(', ')}\n`;
            if (bowlData.vegetables && bowlData.vegetables.length > 0) loadedSummaryText += `Vegetables: ${bowlData.vegetables.join(', ')}\n`;
            if (bowlData.fruits && bowlData.fruits.length > 0) loadedSummaryText += `Fruits: ${bowlData.fruits.join(', ')}\n`;
            if (bowlData.crunchies && bowlData.crunchies.length > 0) loadedSummaryText += `Crunchies: ${bowlData.crunchies.join(', ')}\n`;
            if (bowlData.cheese && bowlData.cheese.length > 0) loadedSummaryText += `Cheese: ${bowlData.cheese.join(', ')}\n`;
            if (bowlData.proteins && bowlData.proteins.length > 0) loadedSummaryText += `Proteins: ${bowlData.proteins.join(', ')}\n`;
            if (bowlData.dressings && bowlData.dressings.length > 0) loadedSummaryText += `Dressings: ${bowlData.dressings.join(', ')}\n`;
            if (bowlData.extras && bowlData.extras.length > 0) loadedSummaryText += `Extras: ${bowlData.extras.join(', ')}\n`;
            loadedSummaryText += `\n\nLoaded from ID: ${bowlId}`;
            document.getElementById('summary').textContent = loadedSummaryText;
            document.getElementById('copyButton').style.display = 'inline-block';
            document.getElementById('loadBowlId').value = ''; // Clear the input field
        } else {
            alert('No bowl found with that ID.');
        }
    } catch (error) {
        console.error("Error loading document: ", error);
        alert("Error loading bowl. Please check your console for details.");
    }
}

// Function to display all saved bowls (now called conditionally for Uday)
async function displayAllSavedBowls() {
    const allSavedBowlsDiv = document.getElementById('allSavedBowls');
    allSavedBowlsDiv.innerHTML = '<h3>Loading your saved bowls...</h3>'; // Loading message

    try {
        // This query will only succeed if Uday is logged in AND your Firestore rules allow it for his UID
        const querySnapshot = await customBowlsCollection.orderBy("timestamp", "desc").limit(20).get(); 
        let bowlsHtml = '<h3>Your Saved Bowls:</h3>';
        if (querySnapshot.empty) {
            bowlsHtml += '<p>No bowls saved yet.</p>';
        } else {
            querySnapshot.forEach(doc => {
                const bowl = doc.data();
                const timestamp = bowl.timestamp ? new Date(bowl.timestamp.toDate()).toLocaleString() : 'N/A';
                bowlsHtml += `
                    <div class="bowl-card">
                        <strong>${bowl.name || 'Unnamed Bowl'}</strong> (ID: ${doc.id})<br>
                        Saved: ${timestamp}<br>
                        Base: ${bowl.base || 'None'}<br>
                        Ingredients: ${[...bowl.freshHerbs, ...bowl.vegetables, ...bowl.fruits, ...bowl.crunchies, ...bowl.cheese, ...bowl.proteins, ...bowl.dressings, ...bowl.extras].filter(Boolean).join(', ') || 'None'}<br>
                        <button onclick="deleteBowl('${doc.id}')" style="background-color: #dc3545; margin-top: 5px;">Delete</button>
                    </div>
                `;
            });
        }
        allSavedBowlsDiv.innerHTML = bowlsHtml;
    } catch (error) {
        console.error("Error fetching documents: ", error);
        allSavedBowlsDiv.innerHTML = "<p>Error loading bowls. (Check Firebase rules and your login status)</p>";
    }
}

// Function to delete a bowl (manual deletion via button)
async function deleteBowl(bowlId) {
    if (confirm("Are you sure you want to delete this bowl?")) {
        try {
            await customBowlsCollection.doc(bowlId).delete();
            alert("Bowl deleted successfully!");
            // After deletion, refresh the list if Uday is logged in
            // UDAY_FIREBASE_UID needs to be defined at the top of script.js
            if (auth.currentUser && auth.currentUser.uid === UDAY_FIREBASE_UID) { 
                displayAllSavedBowls();
            }
        } catch (error) {
            console.error("Error removing document: ", error);
            alert("Error deleting bowl: " + error.message);
        }
    }
}
