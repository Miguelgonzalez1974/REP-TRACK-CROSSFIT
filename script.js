// Datos y configuración global
let entries = JSON.parse(localStorage.getItem('rtCrossData_vFinal') || '[]');
let editId = null;
let selRPE = null;
let chartInstances = {};
let currentFilterMovement = null;
let currentPage = 1;
const itemsPerPage = 5;

// Lista de movimientos WOD con categorías
const WOD_MOVEMENTS = [
    { name: 'Pull-up', category: 'Gymnastics' },
    { name: 'Push-up', category: 'Gymnastics' },
    // ... (resto de movimientos)
];

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Configurar navegación por pestañas
    setupNavigation();
    
    // Configurar modo oscuro
    setupDarkMode();
    
    // Cargar tipos de WOD
    loadCondTypes();
    
    // Configurar fecha por defecto
    document.getElementById('condDate').valueAsDate = new Date();
    
    // Configurar RPE
    setupRPE();
    
    // Configurar formulario de registro
    setupRegistrationForm();
    
    // Cargar datos de ejemplo si no hay nada
    loadSampleData();
    
    // Mostrar pestaña de registro por defecto
    showSection('dashInput');
}

function setupNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            showSection(target);
        });
    });
}

function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('section').forEach(s => {
        s.classList.add('hidden');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Actualizar pestañas activas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-target') === sectionId) {
            btn.classList.add('active');
        }
    });
    
    // Cargar datos específicos para cada sección
    switch(sectionId) {
        case 'dashHistoric': renderHistoric(); break;
        case 'dashProgress': renderProgress(); break;
        case 'dashStats': renderStats(); break;
        case 'dashRM': renderRM(); break;
        case 'dashWODMov': renderWODAnalysis(); break;
    }
}

function setupDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Configurar modo oscuro inicial
    if (localStorage.getItem('darkMode') === 'true' || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('darkMode'))) {
        document.documentElement.classList.add('dark');
    }
    updateDarkModeIcon();
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
    updateDarkModeIcon();
    updateChartThemes();
}

function updateDarkModeIcon() {
    const icon = document.getElementById('darkModeIcon');
    if (document.documentElement.classList.contains('dark')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

function loadCondTypes() {
    const types = JSON.parse(localStorage.getItem('condTypes_vFinal') || '["AMRAP", "For Time", "EMOM", "RFT", "Chipper"]');
    const condTypeEl = document.getElementById('condType');
    condTypeEl.innerHTML = types.map(t => `<option>${t}</option>`).join('');
    if (types.length > 0) {
        condTypeEl.value = types[0];
    }
}

function setupRPE() {
    document.querySelectorAll('#rpeIcons i').forEach(i => {
        i.addEventListener('click', function() {
            selRPE = this.dataset.val;
            updateRPEIcons();
        });
    });
}

function updateRPEIcons() {
    document.querySelectorAll('#rpeIcons i').forEach(x => {
        x.classList.remove('text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'active');
        
        if (parseInt(x.dataset.val) <= parseInt(selRPE)) {
            switch(x.dataset.val) {
                case '1': x.classList.add('text-green-400'); break;
                case '2': x.classList.add('text-blue-400'); break;
                case '3': x.classList.add('text-yellow-400'); break;
                case '4': x.classList.add('text-orange-400'); break;
                case '5': x.classList.add('text-red-400'); break;
            }
            x.classList.add('active');
        }
    });
}

function setupRegistrationForm() {
    // Configurar botón para añadir movimientos
    document.getElementById('addLift').addEventListener('click', createLiftBlock);

    // Configurar guardar y cancelar
    document.getElementById('saveBtn').addEventListener('click', saveSession);
    document.getElementById('cancelBtn').addEventListener('click', function() {
        if (confirm("¿Descartar cambios?")) resetForm(); 
    });

    // Configurar botón para añadir tipo de WOD
    document.getElementById('addCondType').addEventListener('click', function() {
        const n = prompt('Nuevo tipo de WOD:');
        if (n) {
            const types = JSON.parse(localStorage.getItem('condTypes_vFinal') || '["AMRAP", "For Time", "EMOM"]');
            types.push(n);
            localStorage.setItem('condTypes_vFinal', JSON.stringify(types));
            loadCondTypes();
        }
    });
}

let liftBlockCounter = 0;

function createLiftBlock(data = null) {
    liftBlockCounter++;
    const blockId = `lift-block-${liftBlockCounter}`;
    const div = document.createElement('div');
    div.id = blockId;
    div.className = 'border bg-white dark:bg-gray-700 p-4 rounded-lg mb-4 relative shadow-sm';
    div.innerHTML = `
        <button class="remove-lift-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition">&times;</button>
        <div class="flex gap-2 mb-2">
            <select class="lift-move border p-2 rounded flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"></select>
            <button class="add-move-btn bg-green-600 dark:bg-green-700 text-white px-2 rounded hover:bg-green-700 dark:hover:bg-green-800 transition"><i class="fas fa-plus"></i></button>
        </div>
        <div>
            <label class="font-semibold text-sm dark:text-gray-300">Nº de Rondas:</label>
            <input type="number" min="1" class="rounds-input border p-2 rounded w-full dark:bg-gray-600 dark:border-gray-500 dark:text-white"/>
        </div>
        <div class="rounds-container mt-3 space-y-3"></div>
    `;
    document.getElementById('liftContainer').appendChild(div);

    const moveSelect = div.querySelector('.lift-move');
    const moveTypes = JSON.parse(localStorage.getItem('liftTypes_vFinal') || '["Clean","Snatch","Jerk","Thruster","OHS","Deadlift","Bench Press","Squat","Shoulder Press","Push Press"]');
    moveSelect.innerHTML = moveTypes.map(m => `<option>${m}</option>`).join('');

    div.querySelector('.add-move-btn').addEventListener('click', () => {
        const n = prompt('Nuevo movimiento:');
        if (n) {
            moveTypes.push(n);
            localStorage.setItem('liftTypes_vFinal', JSON.stringify(moveTypes));
            moveSelect.innerHTML = moveTypes.map(m => `<option>${m}</option>`).join('');
            moveSelect.value = n;
        }
    });
    
    div.querySelector('.remove-lift-btn').addEventListener('click', () => div.remove());
    
    const roundsInput = div.querySelector('.rounds-input');
    const roundsContainer = div.querySelector('.rounds-container');

    roundsInput.addEventListener('input', () => {
        roundsContainer.innerHTML = '';
        const numRounds = parseInt(roundsInput.value) || 0;
        for (let i = 1; i <= numRounds; i++) {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'p-3 border rounded-md bg-gray-50 dark:bg-gray-600 lift-round';
            roundDiv.innerHTML = `
                <strong class="text-gray-700 dark:text-gray-300 text-sm">Ronda ${i}</strong>
                <div class="grid grid-cols-2 gap-4 mt-1">
                    <div>
                        <label class="text-xs dark:text-gray-400">Nº Reps</label>
                        <input type="number" class="round-reps-input w-full border p-1 rounded dark:bg-gray-500 dark:border-gray-400 dark:text-white" placeholder="Reps">
                    </div>
                    <div>
                        <label class="text-xs dark:text-gray-400">Pesos (kg)</label>
                        <input type="text" class="round-weights-input w-full border p-1 rounded dark:bg-gray-500 dark:border-gray-400 dark:text-white" placeholder="60, 65, 70">
                    </div>
                </div>
            `;
            roundsContainer.appendChild(roundDiv);
        }
    });

    if (data) {
        moveSelect.value = data.move;
        roundsInput.value = data.roundsData.length;
        roundsInput.dispatchEvent(new Event('input')); 

        const roundDivs = div.querySelectorAll('.rounds-container > div');
        data.roundsData.forEach((round, index) => {
            if (roundDivs[index]) {
                roundDivs[index].querySelector('.round-reps-input').value = round.reps;
                roundDivs[index].querySelector('.round-weights-input').value = round.weights.join(', ');
            }
        });
    }
}

function saveSession() {
    const cond = {
        date: document.getElementById('condDate').value || new Date().toISOString().split('T')[0], 
        type: document.getElementById('condType').value,
        wodText: document.getElementById('condWOD').value, 
        result: document.getElementById('condResult').value, 
        rpe: selRPE
    };

    const wl = [];
    document.getElementById('liftContainer').querySelectorAll('.border.bg-white, .border.dark\\:bg-gray-700').forEach(block => {
        const rounds = block.querySelectorAll('.rounds-container > div');
        if (rounds.length > 0) {
            const roundsData = [...rounds].map(r => ({
                reps: parseInt(r.querySelector('.round-reps-input').value) || 0,
                weights: r.querySelector('.round-weights-input').value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
            }));
            wl.push({ 
                move: block.querySelector('.lift-move').value, 
                roundsData: roundsData 
            });
        }
    });

    if (editId) {
        const index = entries.findIndex(e => e.id === editId);
        entries[index] = { id: editId, cond, wl };
        showAlert('✅ Sesión Actualizada', 'green');
    } else {
        entries.push({ id: Date.now(), cond, wl });
        showAlert('✅ Sesión Guardada', 'green');
    }

    localStorage.setItem('rtCrossData_vFinal', JSON.stringify(entries));
    resetForm();
    showSection('dashHistoric');
}

function resetForm() {
    editId = null;
    selRPE = null;
    document.getElementById('condDate').valueAsDate = new Date();
    document.getElementById('condType').selectedIndex = 0;
    document.getElementById('condWOD').value = '';
    document.getElementById('condResult').value = '';
    updateRPEIcons();
    document.getElementById('liftContainer').innerHTML = '';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit mr-3 text-indigo-600 dark:text-indigo-400"></i>Registrar Sesión';
    document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i>Guardar Sesión';
    document.getElementById('cancelBtn').classList.add('hidden');
}

function showAlert(message, color = 'blue') {
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 bg-${color}-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50`;
    alert.innerHTML = `${message} <button class="ml-2" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// [Resto de funciones para las otras secciones...]
// Nota: Por cuestiones de espacio, he omitido el resto de las funciones, pero deben incluirse
// exactamente como aparecen en el código HTML original desde la línea 1457 hasta el final