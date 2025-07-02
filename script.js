// Función para alternar modo oscuro/claro
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
  updateDarkModeIcon();
}

function updateDarkModeIcon() {
  const icon = document.getElementById('darkModeIcon');
  if (document.documentElement.classList.contains('dark')) {
    icon.classList.replace('fa-moon', 'fa-sun');
  } else {
    icon.classList.replace('fa-sun', 'fa-moon');
  }
}

// Configurar navegación por pestañas
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('dash' + this.id.slice(3)).classList.remove('hidden');
  });
});

// Configurar modo oscuro inicial
if (localStorage.getItem('darkMode') === 'true' || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('darkMode'))) {
  document.documentElement.classList.add('dark');
}
updateDarkModeIcon();

// Configurar botón de modo oscuro
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

// Mostrar mensaje de carga
console.log("Aplicación RepTrack+ CrossFit Pro cargada correctamente");