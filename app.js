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
    // Gimnásticos
    { name: 'Pull-up', category: 'Gymnastics' },
    { name: 'Push-up', category: 'Gymnastics' },
    { name: 'Handstand Push-up', category: 'Gymnastics' },
    { name: 'Muscle-up', category: 'Gymnastics' },
    { name: 'Toes-to-bar', category: 'Gymnastics' },
    { name: 'Bar Muscle-up', category: 'Gymnastics' },
    { name: 'Ring Muscle-up', category: 'Gymnastics' },
    { name: 'Dip', category: 'Gymnastics' },
    { name: 'Handstand Walk', category: 'Gymnastics' },
    { name: 'Pistol', category: 'Gymnastics' },
    { name: 'Rope Climb', category: 'Gymnastics' },
    
    // Halterofilia
    { name: 'Clean', category: 'Weightlifting' },
    { name: 'Snatch', category: 'Weightlifting' },
    { name: 'Jerk', category: 'Weightlifting' },
    { name: 'Thruster', category: 'Weightlifting' },
    { name: 'Deadlift', category: 'Weightlifting' },
    { name: 'Bench Press', category: 'Weightlifting' },
    { name: 'Squat', category: 'Weightlifting' },
    { name: 'Shoulder Press', category: 'Weightlifting' },
    { name: 'Push Press', category: 'Weightlifting' },
    { name: 'Overhead Squat', category: 'Weightlifting' },
    { name: 'Front Squat', category: 'Weightlifting' },
    { name: 'Sumo Deadlift High Pull', category: 'Weightlifting' },
    
    // Cardio
    { name: 'Run', category: 'Cardio' },
    { name: 'Row', category: 'Cardio' },
    { name: 'Bike', category: 'Cardio' },
    { name: 'Ski Erg', category: 'Cardio' },
    { name: 'Double Under', category: 'Cardio' },
    { name: 'Single Under', category: 'Cardio' },
    
    // Bodyweight
    { name: 'Burpee', category: 'Bodyweight' },
    { name: 'Wall Ball', category: 'Bodyweight' },
    { name: 'Air Squat', category: 'Bodyweight' },
    { name: 'Lunge', category: 'Bodyweight' },
    { name: 'Sit-up', category: 'Bodyweight' },
    { name: 'GHD Sit-up', category: 'Bodyweight' },
    { name: 'Back Extension', category: 'Bodyweight' },
    { name: 'Kettlebell Swing', category: 'Bodyweight' },
    { name: 'Box Jump', category: 'Bodyweight' }
];

// --- FUNCIONES DE NAVEGACIÓN ---
document.addEventListener('DOMContentLoaded', function() {
    // Configurar navegación por pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('dash' + this.id.slice(3)).classList.remove('hidden');

            // Cargar datos específicos para cada pestaña
            switch(this.id) {
                case 'tabHistoric': renderHistoric(); break;
                case 'tabProgress': renderProgress(); break;
                case 'tabStats': renderStats(); break;
                case 'tabRM': renderRM(); break;
                case 'tabWODMov': renderWODAnalysis(); break;
            }
        });
    });

    // Configurar modo oscuro
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Cargar tipos de WOD
    loadCondTypes();
    
    // Configurar fecha por defecto
    document.getElementById('condDate').valueAsDate = new Date();
    
    // Configurar RPE
    document.querySelectorAll('#rpeIcons i').forEach(i => {
        i.addEventListener('click', function() {
            selRPE = this.dataset.val;
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
        });
    });

    // Configurar botón para añadir movimientos
    document.getElementById('addLift').addEventListener('click', createLiftBlock);

    // Configurar guardar y cancelar
    document.getElementById('saveBtn').addEventListener('click', saveSession);
    document.getElementById('cancelBtn').addEventListener('click', function() {
        if (confirm("¿Descartar cambios?")) resetForm(); 
    });

    // Cargar datos de ejemplo si no hay nada
    if (entries.length === 0) {
        const exampleDate = new Date();
        exampleDate.setDate(exampleDate.getDate() - 7);
        
        entries = [
            {
                id: Date.now() - 2,
                cond: {
                    date: exampleDate.toISOString().split('T')[0],
                    type: "AMRAP",
                    wodText: "20 min AMRAP:\n5 Pull-ups\n10 Push-ups\n15 Air Squats",
                    result: "8 rounds + 5 Pull-ups",
                    rpe: "3"
                },
                wl: []
            },
            {
                id: Date.now() - 1,
                cond: {
                    date: new Date().toISOString().split('T')[0],
                    type: "For Time",
                    wodText: "21-15-9\nDeadlift 100kg\nHandstand Push-ups",
                    result: "9:45",
                    rpe: "4"
                },
                wl: [
                    {
                        move: "Deadlift",
                        roundsData: [
                            { reps: 5, weights: [80, 85, 90] },
                            { reps: 3, weights: [90, 95, 100] }
                        ]
                    }
                ]
            }
        ];
        localStorage.setItem('rtCrossData_vFinal', JSON.stringify(entries));
    }
    
    // Mostrar pestaña de registro por defecto
    document.getElementById('tabInput').click();
});

// [Aquí irían todas las demás funciones (renderHistoric, renderProgress, etc.)...]
// Por cuestiones de espacio, he omitido el resto de las funciones, pero deben incluirse
// exactamente como aparecen en el código HTML original desde la línea 1457 hasta el final