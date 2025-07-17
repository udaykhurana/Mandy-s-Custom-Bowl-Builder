// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // REPLACE WITH YOUR ACTUAL API KEY
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const bowlsCollection = db.collection("customBowls");

function buildBowl() {
  const bowlName = document.getElementById('bowlName').value || 'Unnamed Bowl';
  const selectedIngredients = {};

  // Get selected base (radio button)
  const selectedBase = document.querySelector('input[name="base"]:checked');
  if (selectedBase) {
      selectedIngredients['Base'] = [selectedBase.value];
  } else {
      selectedIngredients['Base'] = []; // No base selected
  }

  // Get other categories (checkboxes)
  const categories = {
    'Fresh Herbs': [], 'Vegetables': [], 'Fruits': [], 'Crunchies': [], 'Cheese': [],
    'Proteins': [], 'Dressings': [], 'Extras': []
  };

  document.querySelectorAll('.category input[type="checkbox"]:checked').forEach(checkbox => {
    // Find which category this checkbox belongs to
    let parentCategory = checkbox.closest('.category');
    let categoryLabel = parentCategory.querySelector('label') ? parentCategory.querySelector('label').innerText.replace(':', '').trim() : '';

    // Fallback for categories without direct label (like the ones generated from list)
    if (!categoryLabel) {
      let h2Element = parentCategory.previousElementSibling;
      while(h2Element && h2Element.tagName !== 'H2') {
          h2Element = h2Element.previousElementSibling;
      }
      if (h2Element) {
          categoryLabel = h2Element.innerText.trim();
      }
    }

    // Special handling for the Base category, which is now radio buttons
    if (categoryLabel && !['Salad Bases', 'Grain Bowl Bases'].includes(categoryLabel)) {
      if (categories[categoryLabel]) {
        categories[categoryLabel].push(checkbox.value);
      }
    }
  });

  // Merge non-base categories into selectedIngredients
  Object.assign(selectedIngredients, categories);


  let summaryText = `--- ${bowlName} ---\n\n`;
  for (const category in selectedIngredients) {
    if (selectedIngredients[category].length > 0) {
      summaryText += `${category}:\n- ${selectedIngredients[category].join('\n- ')}\n\n`;
    }
  }

  document.getElementById('summary').innerText = summaryText;
  document.getElementById('copyButton').style.display = 'block';

  // Save to Firestore
  bowlsCollection.add({
    name: bowlName,
    ingredients: selectedIngredients,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then((docRef) => {
    console.log("Document written with ID: ", docRef.id);
    summaryText += `Shareable ID: ${docRef.id}`;
    document.getElementById('summary').innerText = summaryText; // Update summary with ID
    fetchAndDisplayAllBowls(); // Refresh the list of all bowls
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
  });
}

function copySummary() {
  const summaryText = document.getElementById('summary').innerText;
  navigator.clipboard.writeText(summaryText).then(() => {
    alert('Bowl summary copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

function loadBowl() {
  const bowlId = document.getElementById('loadBowlId').value.trim();
  if (!bowlId) {
    alert('Please enter a Shareable ID.');
    return;
  }

  bowlsCollection.doc(bowlId).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const ingredients = data.ingredients;

      // Clear all current selections
      document.getElementById('bowlName').value = data.name || '';
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      document.querySelectorAll('input[type="radio"]').forEach(rb => rb.checked = false);

      // Set selected ingredients
      for (const category in ingredients) {
        ingredients[category].forEach(item => {
          // Handle radio buttons for Base
          if (category === 'Base') {
            const radioInput = document.querySelector(`input[name="base"][value="${item}"]`);
            if (radioInput) radioInput.checked = true;
          } else { // Handle checkboxes for other categories
            const checkboxInput = document.querySelector(`input[type="checkbox"][value="${item}"]`);
            if (checkboxInput) checkboxInput.checked = true;
          }
        });
      }
      buildBowl(); // Rebuild summary for the loaded bowl
      alert(`Bowl "${data.name}" loaded successfully!`);
    } else {
      alert('No bowl found with that ID.');
    }
  }).catch((error) => {
    console.error("Error getting document:", error);
    alert('Error loading bowl. Please check the ID.');
  });
}

function fetchAndDisplayAllBowls() {
  bowlsCollection.orderBy("createdAt", "desc").get().then((querySnapshot) => {
    const allSavedBowlsDiv = document.getElementById('allSavedBowls');
    allSavedBowlsDiv.innerHTML = '';
    if (querySnapshot.empty) {
      allSavedBowlsDiv.innerHTML = '<p>No bowls saved yet.</p>';
      return;
    }
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let bowlHtml = `<div class="bowl-card"><strong>${data.name || 'Unnamed Bowl'}</strong> (ID: ${doc.id})<br>`;
      if (data.ingredients) {
          for (const category in data.ingredients) {
              if (data.ingredients[category].length > 0) {
                  bowlHtml += `<strong>${category}:</strong> ${data.ingredients[category].join(', ')}<br>`;
              }
          }
      }
      bowlHtml += `</div>`;
      allSavedBowlsDiv.innerHTML += bowlHtml;
    });
  }).catch((error) => {
    console.error("Error fetching all bowls: ", error);
    allSavedBowlsDiv.innerHTML = '<p>Error loading saved bowls.</p>';
  });
}

// Fetch all bowls when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayAllBowls);
