import { auth, db, emailConfig } from '../firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let trialsRemaining = 0;
let selectedService = "";

// Init EmailJS
emailjs.init(emailConfig.publicKey);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        setupDashboard(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// Setup Dashboard Data
function setupDashboard(uid) {
    // 1. Listen to User Data (Trials)
    onSnapshot(doc(db, "users", uid), (doc) => {
        const data = doc.data();
        trialsRemaining = data.freeTrialsRemaining || 0;
        document.getElementById('trials-count').innerText = trialsRemaining;
    });

    // 2. Listen to Orders
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('orders-list');
        list.innerHTML = "";
        let active = 0;
        
        snapshot.forEach(docSnap => {
            const order = docSnap.data();
            if(order.status !== 'delivered' && order.status !== 'rejected') active++;
            
            const div = document.createElement('div');
            div.className = 'order-card';
            div.innerHTML = `
                <div>
                    <strong>${order.service}</strong> <small>(${new Date(order.createdAt.seconds * 1000).toLocaleDateString()})</small><br>
                    <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
                    ${order.paymentRequired ? `<br><small>UTR: ${order.paymentUTR || 'Pending'}</small>` : ''}
                </div>
                <div>
                    <strong>${order.paymentRequired && order.priceAtBooking == 0 ? 'FREE TRIAL' : '₹' + order.priceAtBooking}</strong>
                </div>
            `;
            list.appendChild(div);
        });
        document.getElementById('active-count').innerText = active;
    });
}

// Open Booking Form
window.openBooking = (service) => {
    selectedService = service;
    document.getElementById('booking-form-container').classList.remove('hidden');
    document.getElementById('form-service-title').innerText = "Booking: " + service;
    
    // Setup Dynamic Fields
    const dyn = document.getElementById('dynamic-fields');
    dyn.innerHTML = "";
    
    if(service === 'Video Editing') {
        dyn.innerHTML = `
            <div class="form-group"><label>Style Preference</label>
            <select id="bk-subtype"><option>Cinematic</option><option>Vlog</option><option>Reels/Shorts</option></select></div>`;
    } else if (service === 'Development') {
        dyn.innerHTML = `
            <div class="form-group"><label>Project Type</label>
            <select id="bk-subtype"><option>Website</option><option>App</option></select></div>
            <div class="form-group"><label>Need Custom Domain? (Extra Cost)</label>
            <select id="bk-domain"><option value="no">No</option><option value="yes">Yes</option></select></div>`;
    }
    
    // Check Trial Status
    const paySection = document.getElementById('payment-section');
    const utrInput = document.getElementById('bk-utr');
    
    if(trialsRemaining > 0) {
        paySection.classList.add('hidden');
        utrInput.required = false;
    } else {
        paySection.classList.remove('hidden');
        utrInput.required = true;
    }
};

// Handle Booking Submit
document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('bk-phone').value;
    const desc = document.getElementById('bk-desc').value;
    const fileLink = document.getElementById('bk-link').value;
    const utr = document.getElementById('bk-utr').value;
    
    const subtype = document.getElementById('bk-subtype') ? document.getElementById('bk-subtype').value : 'Standard';
    const domainReq = document.getElementById('bk-domain') ? document.getElementById('bk-domain').value : 'no';

    // Pricing Logic (Simplified simulation)
    // In a real app, calculate strictly on server. Here we assume 0 if trial, else fetch price later.
    const isFree = trialsRemaining > 0;
    
    try {
        // Create Order
        await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            userName: currentUser.displayName,
            email: currentUser.email,
            phone: phone,
            service: selectedService,
            subtype: subtype,
            description: desc,
            fileLink: fileLink,
            domainRequested: domainReq,
            priceAtBooking: isFree ? 0 : 999, // Base placeholder, Admin adjusts
            paymentRequired: !isFree,
            paymentUTR: isFree ? null : utr,
            status: 'received',
            createdAt: new Date()
        });

        // Decrement Trial if used
        if(isFree) {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                freeTrialsRemaining: trialsRemaining - 1
            });
        }

        // Send Email Notification
        emailjs.send(emailConfig.serviceID, emailConfig.templateID, {
            to_name: "Admin",
            from_name: currentUser.displayName,
            message: `New Order: ${selectedService}. Desc: ${desc}`,
            reply_to: currentUser.email
        });

        alert("Booking Successful!");
        document.getElementById('booking-form-container').classList.add('hidden');
        document.getElementById('booking-form').reset();
        
    } catch (err) {
        alert("Error: " + err.message);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});
