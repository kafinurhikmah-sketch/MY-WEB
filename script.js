// Constants & State
const STORAGE_HABITS = 'tracker_habits';
const STORAGE_SAVINGS = 'tracker_savings';
const STORAGE_FINANCE = 'tracker_finance';

let todayStr = getLocalISODate(new Date());
let selectedDateStr = todayStr;

// Default Data
let habits = JSON.parse(localStorage.getItem(STORAGE_HABITS)) || {
    workouts: [
        { id: generateId(), name: "Push Up", reps: "3x15", checkedDates: [] },
        { id: generateId(), name: "Sit Up", reps: "3x15", checkedDates: [] },
        { id: generateId(), name: "Squat", reps: "3x15", checkedDates: [] }
    ],
    studies: [],
    diet: [] // array of dates
};

let savings = JSON.parse(localStorage.getItem(STORAGE_SAVINGS)) || {
    total: 0,
    logs: []
};

let finances = JSON.parse(localStorage.getItem(STORAGE_FINANCE)) || [];

// DOM Elements
const elDateFilter = document.getElementById('date-filter');
const elThemeToggle = document.getElementById('theme-toggle');
const elGreeting = document.getElementById('greeting');
const elCurrentDateText = document.querySelector('#current-date span');
const elHabitProgress = document.getElementById('habit-progress');
const elHabitProgressText = document.getElementById('habit-progress-text');

// Init
function init() {
    // Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Sembunyikan preloader setelah 2 detik
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
        }
    }, 2000);

    // Date Filter Setup
    elDateFilter.value = selectedDateStr;

    // Header Info
    updateHeader();
    setInterval(updateHeader, 60000); // update every minute (for greeting and diet warning)

    // Render Data
    renderAll();

    // Event Listeners
    setupEventListeners();

    // Init 3D Effects
    init3DTilt();
}

// Helpers
function getLocalISODate(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 10);
    return localISOTime;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function parseRupiah(rupiahString) {
    return parseInt(rupiahString.replace(/[^0-9]/g, ''), 10) || 0;
}

// Update Header (Greeting, Date text, Diet Warning)
function updateHeader() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Selamat Pagi Kafi!';

    if (hour >= 10 && hour < 15) greeting = 'Selamat Siang Kafi!';
    else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore Kafi!';
    else if (hour >= 18) greeting = 'Selamat Malam Kafi!';

    elGreeting.textContent = greeting;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elCurrentDateText.textContent = new Date(selectedDateStr).toLocaleDateString('id-ID', options);

    // Diet warning logic (Only relevant if looking at today)
    const dietWarning = document.getElementById('diet-warning');
    if (selectedDateStr === todayStr && hour >= 18) {
        dietWarning.classList.remove('hidden');
    } else {
        dietWarning.classList.add('hidden');
    }
}

function updateThemeIcon(theme) {
    elThemeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function saveData() {
    localStorage.setItem(STORAGE_HABITS, JSON.stringify(habits));
    localStorage.setItem(STORAGE_SAVINGS, JSON.stringify(savings));
    localStorage.setItem(STORAGE_FINANCE, JSON.stringify(finances));
    updateProgress();
}

function renderAll() {
    renderWorkouts();
    renderStudies();
    renderDiet();
    renderSavings();
    renderFinances();
    updateProgress();
}

// Habits - Workouts
function renderWorkouts() {
    const container = document.getElementById('workout-list');
    container.innerHTML = '';

    habits.workouts.forEach(wo => {
        const isChecked = wo.checkedDates.includes(selectedDateStr);
        const item = document.createElement('div');
        item.className = `checklist-item ${isChecked ? 'checked' : ''}`;
        item.innerHTML = `
            <div class="d-flex align-items-center" style="width: 100%;">
                <label class="custom-checkbox w-100">
                    <input type="checkbox" onchange="toggleWorkout('${wo.id}')" ${isChecked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    <div>
                        <span class="check-text">${wo.name}</span>
                        <span class="check-meta">${wo.reps}</span>
                    </div>
                </label>
            </div>
        `;
        container.appendChild(item);
    });
}

window.toggleWorkout = function (id) {
    const wo = habits.workouts.find(w => w.id === id);
    if (wo) {
        const index = wo.checkedDates.indexOf(selectedDateStr);
        if (index > -1) {
            wo.checkedDates.splice(index, 1);
        } else {
            wo.checkedDates.push(selectedDateStr);
        }
        saveData();
        renderWorkouts();
    }
}

// Habits - Studies
function renderStudies() {
    const container = document.getElementById('study-list');
    container.innerHTML = '';

    const todaysStudies = habits.studies.filter(s => s.date === selectedDateStr);

    if (todaysStudies.length === 0) {
        container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center;">Belum ada sesi belajar hari ini.</p>';
        return;
    }

    todaysStudies.forEach(st => {
        const item = document.createElement('div');
        item.className = 'study-item';
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <h4>${st.topic}</h4>
                <button class="delete-btn" onclick="deleteStudy('${st.id}')"><i class="fas fa-trash"></i></button>
            </div>
            <p><strong>Durasi:</strong> ${st.duration}</p>
            <p>${st.notes}</p>
        `;
        container.appendChild(item);
    });
}

window.deleteStudy = function (id) {
    habits.studies = habits.studies.filter(s => s.id !== id);
    saveData();
    renderStudies();
}

// Habits - Diet
function renderDiet() {
    const isChecked = habits.diet.includes(selectedDateStr);
    const cb = document.getElementById('diet-check');
    cb.checked = isChecked;
    const parent = cb.closest('.checklist-item');
    if (isChecked) parent.classList.add('checked');
    else parent.classList.remove('checked');
}

// Savings
function renderSavings() {
    document.getElementById('total-savings-display').textContent = formatRupiah(savings.total);

    const container = document.getElementById('savings-history');
    container.innerHTML = '';

    // Tampilkan semua riwayat dari yang terbaru
    const displaySavings = savings.logs.slice().reverse();

    if (displaySavings.length === 0) {
        container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center;">Belum ada riwayat tabungan.</p>';
        return;
    }

    displaySavings.forEach(log => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-info">
                <p>${log.note}</p>
                <small><i class="far fa-calendar-alt"></i> ${log.date}</small>
            </div>
            <div class="history-amount">+ ${formatRupiah(log.amount)}</div>
        `;
        container.appendChild(item);
    });
}

// Finances
function renderFinances() {
    const todaysFinances = finances.filter(f => f.date === selectedDateStr);

    let totalIncome = 0;
    let totalExpense = 0;

    // Hitung ringkasan hari ini saja
    todaysFinances.forEach(fin => {
        if (fin.type === 'income') totalIncome += fin.amount;
        else totalExpense += fin.amount;
    });

    const tbody = document.getElementById('finance-history');
    tbody.innerHTML = '';

    // Tampilkan semua riwayat transaksi dari yang terbaru
    const displayFinances = finances.slice().reverse();

    displayFinances.forEach(fin => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-size: 0.8rem; color: var(--text-muted);"><i class="far fa-calendar-alt"></i> ${fin.date}</td>
            <td>${fin.category}</td>
            <td>${fin.note}</td>
            <td class="${fin.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ${fin.type === 'income' ? '+' : '-'} ${formatRupiah(fin.amount)}
            </td>
            <td>
                <button class="delete-btn" onclick="deleteFinance('${fin.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (displayFinances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Belum ada riwayat transaksi.</td></tr>';
    }

    const cashflow = totalIncome - totalExpense;

    document.getElementById('today-income').textContent = formatRupiah(totalIncome);
    document.getElementById('today-expense').textContent = formatRupiah(totalExpense);
    document.getElementById('today-cashflow').textContent = formatRupiah(cashflow);
}

window.deleteFinance = function (id) {
    const fin = finances.find(f => f.id === id);
    if (fin) {
        if (fin.type === 'income') {
            savings.total -= fin.amount;
        } else if (fin.type === 'expense') {
            savings.total += fin.amount;
        }
    }
    finances = finances.filter(f => f.id !== id);
    saveData();
    renderFinances();
    renderSavings();
}

// Progress Calculation
function updateProgress() {
    // Total checklist items: workouts + 1 (diet) + (if has study > 0, +1)
    let totalItems = habits.workouts.length + 1;
    let completedItems = 0;

    habits.workouts.forEach(wo => {
        if (wo.checkedDates.includes(selectedDateStr)) completedItems++;
    });

    if (habits.diet.includes(selectedDateStr)) completedItems++;

    const hasStudyToday = habits.studies.some(s => s.date === selectedDateStr);
    if (hasStudyToday) {
        // Study is just an indicator if they did any study
        totalItems++;
        completedItems++;
    } else {
        totalItems++; // still counts as a habit to fulfill
    }

    const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    elHabitProgress.style.width = `${percentage}%`;
    elHabitProgressText.textContent = `${percentage}% Selesai`;
}

// Event Listeners
function setupEventListeners() {
    // Date Filter
    elDateFilter.addEventListener('change', (e) => {
        selectedDateStr = e.target.value;
        updateHeader();
        renderAll();
    });

    // Theme Toggle
    elThemeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Diet Check
    document.getElementById('diet-check').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const index = habits.diet.indexOf(selectedDateStr);
        if (isChecked && index === -1) {
            habits.diet.push(selectedDateStr);
        } else if (!isChecked && index > -1) {
            habits.diet.splice(index, 1);
        }
        saveData();
        renderDiet();
    });

    // Modals
    const workoutModal = document.getElementById('add-workout-modal');
    const resetModal = document.getElementById('reset-modal');

    document.getElementById('add-workout-btn').addEventListener('click', () => {
        workoutModal.classList.add('active');
    });

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetModal.classList.add('active');
        });
    }

    // Close all modals via close button or cancel button
    document.querySelectorAll('.close-modal, .btn-modal-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    });

    // Reset Handlers
    const btnResetToday = document.getElementById('btn-reset-today');
    if (btnResetToday) {
        btnResetToday.addEventListener('click', () => {
            if (confirm(`Apakah Anda yakin ingin mereset checklist dan sesi belajar untuk tanggal ${selectedDateStr}?`)) {
                resetTodayData();
                resetModal.classList.remove('active');
            }
        });
    }

    const btnResetAll = document.getElementById('btn-reset-all');
    if (btnResetAll) {
        btnResetAll.addEventListener('click', () => {
            if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset SEMUA data? Seluruh riwayat tabungan, transaksi keuangan, kebiasaan, dan catatan belajar akan dihapus permanen!')) {
                resetAllData();
                resetModal.classList.remove('active');
            }
        });
    }

    // Add Custom Workout
    document.getElementById('custom-workout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('workout-name').value;
        const reps = document.getElementById('workout-reps').value;
        habits.workouts.push({
            id: generateId(),
            name: name,
            reps: reps,
            checkedDates: []
        });
        saveData();
        renderWorkouts();
        e.target.reset();
        workoutModal.classList.remove('active');
    });

    // Add Study
    document.getElementById('save-study-btn').addEventListener('click', () => {
        const topic = document.getElementById('study-topic').value;
        const duration = document.getElementById('study-duration').value;
        const notes = document.getElementById('study-notes').value;

        if (!topic || !duration) return alert('Topik dan Durasi harus diisi!');

        habits.studies.push({
            id: generateId(),
            date: selectedDateStr,
            topic,
            duration,
            notes
        });
        saveData();
        renderStudies();

        document.getElementById('study-topic').value = '';
        document.getElementById('study-duration').value = '';
        document.getElementById('study-notes').value = '';
    });

    // Currency Formatting for Inputs
    const currencyInputs = document.querySelectorAll('.currency-input');
    currencyInputs.forEach(input => {
        input.addEventListener('keyup', function (e) {
            let val = this.value.replace(/[^0-9]/g, '');
            if (val !== '') {
                this.value = 'Rp ' + parseInt(val, 10).toLocaleString('id-ID');
            } else {
                this.value = '';
            }
        });
    });

    // Add Savings
    document.getElementById('savings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const amountStr = document.getElementById('saving-amount').value;
        const note = document.getElementById('saving-note').value;
        const amount = parseRupiah(amountStr);

        if (amount > 0) {
            savings.total += amount;
            savings.logs.push({
                id: generateId(),
                date: selectedDateStr,
                amount,
                note
            });
            saveData();
            renderSavings();
            e.target.reset();
        }
    });

    // Add Finance
    document.getElementById('finance-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('finance-type').value;
        const category = document.getElementById('finance-category').value;
        const amountStr = document.getElementById('finance-amount').value;
        const note = document.getElementById('finance-note').value;
        const amount = parseRupiah(amountStr);

        if (amount > 0) {
            finances.push({
                id: generateId(),
                date: selectedDateStr,
                type,
                category,
                amount,
                note
            });

            if (type === 'income') {
                savings.total += amount;
            } else if (type === 'expense') {
                savings.total -= amount;
            }

            saveData();
            renderFinances();
            renderSavings();

            document.getElementById('finance-amount').value = '';
            document.getElementById('finance-note').value = '';
        }
    });
}

// 3D Tilt Effect
function init3DTilt() {
    const cards = document.querySelectorAll('.card:not(.modal-content)');

    // Check if user is on mobile (touch device), if so, disable 3D hover to save performance
    if (window.matchMedia("(hover: none)").matches) return;

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none'; // Remove transition for instant mouse tracking
        });

        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation (max 6 degrees for smooth realistic tilt)
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            // Restore smooth transition to return to original state
            card.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.6s ease';
            card.style.transform = ''; // Fallback to CSS default

            // Cleanup inline transition after animation finishes
            setTimeout(() => {
                card.style.transition = '';
            }, 600);
        });
    });
}

// Reset Functions
function resetTodayData() {
    // Uncheck workouts for selected date
    habits.workouts.forEach(wo => {
        const idx = wo.checkedDates.indexOf(selectedDateStr);
        if (idx > -1) {
            wo.checkedDates.splice(idx, 1);
        }
    });

    // Reset diet check for selected date
    const dietIdx = habits.diet.indexOf(selectedDateStr);
    if (dietIdx > -1) {
        habits.diet.splice(dietIdx, 1);
    }

    // Remove study logs for selected date
    habits.studies = habits.studies.filter(s => s.date !== selectedDateStr);

    saveData();
    renderAll();
    showToast(`Checklist untuk tanggal ${selectedDateStr} berhasil direset!`, 'info');
}

function resetAllData() {
    // Clear localStorage
    localStorage.removeItem(STORAGE_HABITS);
    localStorage.removeItem(STORAGE_SAVINGS);
    localStorage.removeItem(STORAGE_FINANCE);

    // Reset in-memory state to defaults
    habits = {
        workouts: [
            { id: generateId(), name: "Push Up", reps: "3x15", checkedDates: [] },
            { id: generateId(), name: "Sit Up", reps: "3x15", checkedDates: [] },
            { id: generateId(), name: "Squat", reps: "3x15", checkedDates: [] }
        ],
        studies: [],
        diet: []
    };

    savings = {
        total: 0,
        logs: []
    };

    finances = [];

    // Save defaults back to storage
    saveData();

    // Re-render entire UI
    renderAll();

    showToast('Seluruh data web berhasil direset ke setelan awal!', 'success');
}

// Toast notification helper
let toastTimeout = null;
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = toast ? toast.querySelector('.toast-icon') : null;

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;

    // Reset type classes
    toast.className = 'toast show';
    if (type === 'success') {
        toast.classList.add('toast-success');
        if (toastIcon) toastIcon.className = 'toast-icon fas fa-check-circle';
    } else if (type === 'danger') {
        toast.classList.add('toast-danger');
        if (toastIcon) toastIcon.className = 'toast-icon fas fa-exclamation-circle';
    } else {
        toast.classList.add('toast-info');
        if (toastIcon) toastIcon.className = 'toast-icon fas fa-info-circle';
    }

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// Run
document.addEventListener('DOMContentLoaded', init);
