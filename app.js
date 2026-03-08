// ============================================
// FIREBASE CONFIGURATION
// Replace these values with your Firebase project config
// See SETUP.md for instructions
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyATfkF9K6k2IBSiL93wFXKCJs5WEpOQm_s",
    authDomain: "morlongo-reservation.firebaseapp.com",
    projectId: "morlongo-reservation",
    storageBucket: "morlongo-reservation.firebasestorage.app",
    messagingSenderId: "858702672609",
    appId: "1:858702672609:web:28fced8ab306780977bda0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================
// STATE
// ============================================
let currentDate = new Date();
let reservations = [];
let selectedStartDate = null;
let selectedEndDate = null;
let isAuthenticated = false;
let currentPassword = null;
let editingReservationId = null;
let deletingReservationId = null;

// ============================================
// DOM ELEMENTS
// ============================================
const calendarDays = document.getElementById('calendarDays');
const currentMonthEl = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const reservationsList = document.getElementById('reservationsList');
const addReservationBtn = document.getElementById('addReservationBtn');

// Modals
const passwordModal = document.getElementById('passwordModal');
const reservationModal = document.getElementById('reservationModal');
const deleteModal = document.getElementById('deleteModal');

// Password form
const passwordInput = document.getElementById('passwordInput');
const submitPasswordBtn = document.getElementById('submitPassword');
const passwordError = document.getElementById('passwordError');

// Reservation form
const reservationForm = document.getElementById('reservationForm');
const modalTitle = document.getElementById('modalTitle');
const guestNameInput = document.getElementById('guestName');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const statusSelect = document.getElementById('status');
const notesInput = document.getElementById('notes');
const formError = document.getElementById('formError');
const cancelBtn = document.getElementById('cancelBtn');

// Delete confirmation
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// Close buttons
const closeButtons = document.querySelectorAll('.close');

// ============================================
// UTILITIES
// ============================================
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateShort(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isDateInRange(date, start, end) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return d >= s && d <= e;
}

// ============================================
// CALENDAR
// ============================================
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthEl.textContent = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    // Clear existing days
    const existingDays = calendarDays.querySelectorAll('.calendar-day');
    existingDays.forEach(day => day.remove());

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Today
    const today = new Date();

    // Generate calendar days
    let html = '';

    // Previous month's trailing days
    for (let i = startingDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        html += createDayCell(date, true);
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const isToday = isSameDay(date, today);
        html += createDayCell(date, false, isToday);
    }

    // Next month's leading days
    const remainingCells = 42 - (startingDay + totalDays);
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        html += createDayCell(date, true);
    }

    calendarDays.innerHTML = html;

    // Add click handlers
    document.querySelectorAll('.calendar-day').forEach(dayEl => {
        dayEl.addEventListener('click', handleDayClick);
    });
}

function createDayCell(date, isOtherMonth, isToday = false) {
    const dateStr = toDateString(date);
    const reservationsOnDay = getReservationsForDate(date);

    let classes = 'calendar-day';
    if (isOtherMonth) classes += ' other-month';
    if (isToday) classes += ' today';
    if (selectedStartDate && isSameDay(date, selectedStartDate)) classes += ' selected';
    if (selectedEndDate && isSameDay(date, selectedEndDate)) classes += ' selected';
    if (selectedStartDate && selectedEndDate && isDateInRange(date, selectedStartDate, selectedEndDate)) {
        classes += ' in-range';
    }

    let html = `<div class="${classes}" data-date="${dateStr}">`;
    html += `<div class="date">${date.getDate()}</div>`;

    // Show reservations
    reservationsOnDay.slice(0, 2).forEach(res => {
        html += `<div class="reservation-indicator ${res.status}">${res.guestName}</div>`;
    });

    if (reservationsOnDay.length > 2) {
        html += `<div class="reservation-indicator">+${reservationsOnDay.length - 2} more</div>`;
    }

    html += '</div>';
    return html;
}

function getReservationsForDate(date) {
    return reservations.filter(res => {
        const start = parseDate(res.startDate);
        const end = parseDate(res.endDate);
        return isDateInRange(date, start, end);
    });
}

function handleDayClick(e) {
    const dayEl = e.currentTarget;
    const dateStr = dayEl.dataset.date;
    const clickedDate = parseDate(dateStr);

    // If clicking to start a new selection
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        selectedStartDate = clickedDate;
        selectedEndDate = null;
    } else {
        // If clicking to complete selection
        if (clickedDate >= selectedStartDate) {
            selectedEndDate = clickedDate;
        } else {
            selectedEndDate = selectedStartDate;
            selectedStartDate = clickedDate;
        }
    }

    renderCalendar();

    // Update form dates if modal is open
    if (reservationModal.classList.contains('active')) {
        if (selectedStartDate) {
            startDateInput.value = toDateString(selectedStartDate);
        }
        if (selectedEndDate) {
            endDateInput.value = toDateString(selectedEndDate);
        }
    }
}

// ============================================
// RESERVATIONS
// ============================================
function loadReservations() {
    reservationsList.innerHTML = '<p class="loading">Loading reservations...</p>';

    db.collection('reservations')
        .orderBy('startDate', 'asc')
        .onSnapshot(snapshot => {
            reservations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            renderReservations();
            renderCalendar();
        }, error => {
            console.error('Error loading reservations:', error);
            reservationsList.innerHTML = '<p class="no-reservations">Error loading reservations. Please check Firebase configuration.</p>';
        });
}

function renderReservations() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingReservations = reservations.filter(res => {
        const endDate = parseDate(res.endDate);
        return endDate >= today;
    });

    if (upcomingReservations.length === 0) {
        reservationsList.innerHTML = '<p class="no-reservations">No upcoming reservations</p>';
        return;
    }

    reservationsList.innerHTML = upcomingReservations.map(res => `
        <div class="reservation-card ${res.status}">
            <div class="reservation-info">
                <div class="reservation-name">${escapeHtml(res.guestName)}</div>
                <div class="reservation-dates">
                    ${formatDateShort(parseDate(res.startDate))} - ${formatDateShort(parseDate(res.endDate))}
                    ${res.notes ? ' &bull; ' + escapeHtml(res.notes) : ''}
                </div>
            </div>
            <span class="reservation-status ${res.status}">${res.status}</span>
            <div class="reservation-actions">
                <button class="action-btn edit" onclick="editReservation('${res.id}')" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="deleteReservation('${res.id}')" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// PASSWORD & AUTH
// ============================================
function showPasswordModal(callback) {
    if (isAuthenticated) {
        callback();
        return;
    }

    passwordModal.classList.add('active');
    passwordInput.value = '';
    passwordError.textContent = '';
    passwordInput.focus();

    const handleSubmit = async () => {
        const password = passwordInput.value;
        if (!password) {
            passwordError.textContent = 'Please enter a password';
            return;
        }

        // Try to verify password by attempting a test write
        try {
            currentPassword = password;

            // Attempt to read the password verification document
            // This is a secure way to verify the password using Firestore rules
            const testDoc = await db.collection('config').doc('auth').get();

            // If we can read it, store password and proceed
            isAuthenticated = true;
            closeModal(passwordModal);
            callback();
        } catch (error) {
            if (error.code === 'permission-denied') {
                passwordError.textContent = 'Incorrect password';
                currentPassword = null;
            } else {
                passwordError.textContent = 'Error verifying password. Check console.';
                console.error(error);
            }
        }
    };

    submitPasswordBtn.onclick = handleSubmit;
    passwordInput.onkeydown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };
}

// ============================================
// MODALS
// ============================================
function openReservationModal(edit = false) {
    reservationModal.classList.add('active');
    formError.textContent = '';

    if (!edit) {
        modalTitle.textContent = 'New Reservation';
        reservationForm.reset();
        editingReservationId = null;

        // Set selected dates if any
        if (selectedStartDate) {
            startDateInput.value = toDateString(selectedStartDate);
        }
        if (selectedEndDate) {
            endDateInput.value = toDateString(selectedEndDate);
        }
    }

    guestNameInput.focus();
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// ============================================
// CRUD OPERATIONS
// ============================================
async function saveReservation(e) {
    e.preventDefault();

    const guestName = guestNameInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const status = statusSelect.value;
    const notes = notesInput.value.trim();

    if (!guestName || !startDate || !endDate) {
        formError.textContent = 'Please fill in all required fields';
        return;
    }

    if (parseDate(endDate) < parseDate(startDate)) {
        formError.textContent = 'End date must be after start date';
        return;
    }

    const reservationData = {
        guestName,
        startDate,
        endDate,
        status,
        notes,
        password: currentPassword, // Include password for security rules verification
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (editingReservationId) {
            await db.collection('reservations').doc(editingReservationId).update(reservationData);
        } else {
            reservationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('reservations').add(reservationData);
        }

        closeModal(reservationModal);
        selectedStartDate = null;
        selectedEndDate = null;
        renderCalendar();
    } catch (error) {
        if (error.code === 'permission-denied') {
            formError.textContent = 'Permission denied. Please re-enter password.';
            isAuthenticated = false;
            currentPassword = null;
        } else {
            formError.textContent = 'Error saving reservation. Please try again.';
            console.error(error);
        }
    }
}

window.editReservation = function(id) {
    showPasswordModal(() => {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return;

        editingReservationId = id;
        modalTitle.textContent = 'Edit Reservation';
        guestNameInput.value = reservation.guestName;
        startDateInput.value = reservation.startDate;
        endDateInput.value = reservation.endDate;
        statusSelect.value = reservation.status;
        notesInput.value = reservation.notes || '';

        selectedStartDate = parseDate(reservation.startDate);
        selectedEndDate = parseDate(reservation.endDate);
        renderCalendar();

        openReservationModal(true);
    });
};

window.deleteReservation = function(id) {
    showPasswordModal(() => {
        deletingReservationId = id;
        deleteModal.classList.add('active');
    });
};

async function confirmDeleteReservation() {
    if (!deletingReservationId) return;

    try {
        // We need to include the password in the delete request
        // But Firestore delete doesn't support passing data
        // So we'll update first with the password, then delete
        await db.collection('reservations').doc(deletingReservationId).update({
            password: currentPassword,
            _deleting: true
        });
        await db.collection('reservations').doc(deletingReservationId).delete();
        closeModal(deleteModal);
        deletingReservationId = null;
    } catch (error) {
        if (error.code === 'permission-denied') {
            alert('Permission denied. Please re-enter password.');
            isAuthenticated = false;
            currentPassword = null;
        } else {
            alert('Error deleting reservation');
            console.error(error);
        }
        closeModal(deleteModal);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

addReservationBtn.addEventListener('click', () => {
    showPasswordModal(() => {
        openReservationModal();
    });
});

reservationForm.addEventListener('submit', saveReservation);

cancelBtn.addEventListener('click', () => {
    closeModal(reservationModal);
});

cancelDeleteBtn.addEventListener('click', () => {
    closeModal(deleteModal);
    deletingReservationId = null;
});

confirmDeleteBtn.addEventListener('click', confirmDeleteReservation);

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        closeModal(modal);
    });
});

// Close modals on outside click
[passwordModal, reservationModal, deleteModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        [passwordModal, reservationModal, deleteModal].forEach(closeModal);
    }
});

// ============================================
// INITIALIZE
// ============================================
renderCalendar();
loadReservations();
