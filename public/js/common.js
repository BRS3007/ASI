// common.js
// Este script contiene funciones comunes para toda la aplicacion.

document.addEventListener('DOMContentLoaded', () => {
    console.log("common.js: Script cargado y DOMContentLoaded.");

    // Funcion para manejar el cierre de sesion
    async function handleLogout() {
        try {
            const response = await fetch('/logout'); // Llama a la ruta de logout en el servidor
            const result = await response.json();

            if (result.success) {
                alert(result.message); // Muestra el mensaje de exito
                window.location.href = '/'; // ¡Redirige a la pagina de inicio de sesion!
            } else {
                alert('Error al cerrar sesion: ' + result.message); // Muestra el mensaje de error del servidor
            }
        } catch (error) {
            console.error('Error al cerrar sesion (fetch):', error); // Log de errores de red/fetch
            alert('Ocurrio un error al intentar cerrar sesion. Por favor, intenta de nuevo.');
        }
    }

    // Buscar todos los botones/enlaces con el ID 'logout-btn-nav' y adjuntar el evento
    const logoutButtons = document.querySelectorAll('#logout-btn-nav');
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevenir la accion por defecto del enlace
                await handleLogout(); // Llama a la funcion de cierre de sesion
            });
            console.log("common.js: Listener de logout adjuntado al elemento con ID 'logout-btn-nav'.");
        }
    });
});
