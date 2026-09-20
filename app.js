// ===== CONFIGURACIÓN =====
const SLOTS = [
  { id: '08:00', label: 'Mañana', time: '08:00' },
  { id: '11:00', label: 'Mediodía', time: '11:00' },
  { id: '14:00', label: 'Tarde', time: '14:00' }
];

// Clave para localStorage
const STORAGE_KEY = 'reservas_endoscopia';

// ===== ESTADO =====
let currentDate = new Date();
let selectedDate = null;   // YYYY-MM-DD
let selectedSlot = null;   // '08:00' | '11:00' | '14:00'

// ===== UTILIDADES =====
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getReservations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveReservation(dateStr, slotId, data) {
  const reservations = getReservations();
  if (!reservations[dateStr]) reservations[dateStr] = {};
  reservations[dateStr][slotId] = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

function isSlotTaken(dateStr, slotId) {
  const reservations = getReservations();
  return !!(reservations[dateStr] && reservations[dateStr][slotId]);
}

function getDayStatus(dateStr) {
  const today = formatDate(new Date());
  if (dateStr < today) return 'past';

  let taken = 0;
  SLOTS.forEach(s => {
    if (isSlotTaken(dateStr, s.id)) taken++;
  });

  if (taken === 0) return 'available';
  if (taken === 3) return 'full';
  return 'partial';
}

// ===== VISTAS =====
function showView(viewId) {
  ['calendar-view', 'slots-view', 'form-view', 'success-view'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(viewId).classList.remove('hidden');
}

// ===== CALENDARIO =====
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById('month-year').textContent =
    currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Lunes = 0

  const container = document.getElementById('calendar-days');
  container.innerHTML = '';

  // Días vacíos al inicio
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'day empty';
    container.appendChild(empty);
  }

  // Días del mes
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    const status = getDayStatus(dateStr);

    const el = document.createElement('div');
    el.className = `day ${status}`;
    if (dateStr === formatDate(new Date())) el.classList.add('today');

    el.innerHTML = `<span>${day}</span>`;

    if (status !== 'past' && status !== 'full') {
      el.addEventListener('click', () => openSlots(dateStr));
    }

    container.appendChild(el);
  }
}

// ===== TURNOS =====
function openSlots(dateStr) {
  selectedDate = dateStr;
  document.getElementById('selected-date-title').textContent =
    formatDisplayDate(dateStr);

  const container = document.getElementById('slots-container');
  container.innerHTML = '';

  SLOTS.forEach(slot => {
    const taken = isSlotTaken(dateStr, slot.id);
    const el = document.createElement('div');
    el.className = `slot ${taken ? 'occupied' : ''}`;

    el.innerHTML = `
      <div>
        <div class="time">${slot.time}</div>
        <div class="label">${slot.label}</div>
      </div>
      <span class="badge ${taken ? 'busy' : 'free'}">
        ${taken ? 'Ocupado' : 'Disponible'}
      </span>
    `;

    if (!taken) {
      el.addEventListener('click', () => openForm(slot));
    }

    container.appendChild(el);
  });

  showView('slots-view');
}

// ===== FORMULARIO =====
function openForm(slot) {
  selectedSlot = slot.id;
  document.getElementById('form-slot-info').textContent =
    `${formatDisplayDate(selectedDate)} · ${slot.time} (${slot.label})`;

  document.getElementById('reservation-form').reset();
  showView('form-view');
}

// ===== ENVIAR RESERVA =====
document.getElementById('reservation-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const data = {
    nombre: document.getElementById('nombre').value.trim(),
    documento: document.getElementById('documento').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    email: document.getElementById('email').value.trim(),
    procedimiento: document.getElementById('procedimiento').value,
    notas: document.getElementById('notas').value.trim(),
    fecha: selectedDate,
    turno: selectedSlot,
    creado: new Date().toISOString()
  };

  // Guardar
  saveReservation(selectedDate, selectedSlot, data);

  // Mostrar confirmación
  const slotLabel = SLOTS.find(s => s.id === selectedSlot)?.label || selectedSlot;
  document.getElementById('success-details').innerHTML = `
    <strong>${data.nombre}</strong><br>
    ${formatDisplayDate(selectedDate)} · ${selectedSlot} (${slotLabel})<br>
    Procedimiento: ${data.procedimiento}<br>
    Teléfono: ${data.telefono}
  `;

  showView('success-view');
});

// ===== NAVEGACIÓN =====
document.getElementById('prev-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

document.getElementById('back-to-calendar').addEventListener('click', () => {
  showView('calendar-view');
  renderCalendar();
});

document.getElementById('back-to-slots').addEventListener('click', () => {
  openSlots(selectedDate);
});

document.getElementById('new-reservation').addEventListener('click', () => {
  showView('calendar-view');
  renderCalendar();
});

// ===== INICIO =====
renderCalendar();
