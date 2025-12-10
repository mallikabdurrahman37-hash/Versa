import { auth, db, emailConfig } from '../firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Init EmailJS
emailjs.init(emailConfig.publicKey);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verify Admin Role
        const u = await getDoc(doc(db, "users", user.uid));
        if (u.data().role !== 'admin') {
            window.location.href = 'dashboard.html';
        } else {
            loadAdminData();
        }
    } else {
        window.location.href = 'index.html';
    }
});

function loadAdminData() {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('admin-orders-list');
        container.innerHTML = "";
        let total = 0;
        let pending = 0;

        snapshot.forEach(docSnap => {
            total++;
            const order = docSnap.data();
            const oid = docSnap.id;
            if(order.status === 'received') pending++;

            const div = document.createElement('div');
            div.className = 'order-card';
            div.style.background = order.status === 'received' ? '#fff' : '#f8fafc';
            
            div.innerHTML = `
                <div style="width:100%">
                    <div style="display:flex; justify-content:space-between;">
                        <h4>${order.service} (${order.subtype})</h4>
                        <span>${order.userName}</span>
                    </div>
                    <p class="text-muted">${order.description}</p>
                    ${order.fileLink ? `<a href="${order.fileLink}" target="_blank">View File</a>` : ''}
                    <div style="background:#f1f5f9; padding:10px; margin:10px 0; font-size:0.9rem;">
                        <strong>UTR:</strong> ${order.paymentUTR || 'N/A (Trial)'} <br>
                        <strong>Phone:</strong> ${order.phone}
                    </div>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <select onchange="updateStatus('${oid}', this.value, '${order.email}')">
                            <option value="received" ${order.status === 'received' ? 'selected' : ''}>Received</option>
                            <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="rejected" ${order.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                        ${order.paymentRequired ? `<button class="btn btn-outline" onclick="verifyPayment('${oid}')">Verify Pay</button>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

        document.getElementById('total-orders').innerText = total;
        document.getElementById('pending-orders').innerText = pending;
    });
}

// Expose functions to window for HTML buttons
window.updateStatus = async (orderId, newStatus, userEmail) => {
    if(!confirm("Update status to " + newStatus + "?")) return;
    
    await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
    });

    // Email Notification
    emailjs.send(emailConfig.serviceID, emailConfig.templateID, {
        to_name: "Client",
        from_name: "Versa Admin",
        message: `Your order status has been updated to: ${newStatus.toUpperCase()}`,
        reply_to: "mallikabdurrahman37@gmail.com",
        to_email: userEmail // Note: Free EmailJS tier might restrict sending to arbitrary emails, checks logs.
    });
};

window.verifyPayment = async (orderId) => {
    const price = prompt("Enter confirmed Price for this order (₹):", "999");
    if(!price) return;
    
    await updateDoc(doc(db, "orders", orderId), {
        priceAtBooking: parseInt(price),
        status: 'in_progress'
    });
    alert("Payment Verified & Price Set");
};

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
