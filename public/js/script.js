// Este script maneja la logica de cambio de formulario y el inicio de sesion/registro
document.addEventListener('DOMContentLoaded', () => {

    // Obtener referencias a los botones de cambio de formulario
    const btnIniciarSesion = document.getElementById("btn__iniciar-Sesion");
    const btnRegistrarse = document.getElementById("btn__registrarse");

    // Obtener referencias a los contenedores y formularios
    var contenedor_login_register = document.querySelector(".contenedor__login-register"); 
    var formulario_login = document.querySelector(".formulario__login");
    var formulario_register = document.querySelector(".formulario__register");
    var caja_trasera_login = document.querySelector(".caja__trasera-login");
    var caja_trasera_register = document.querySelector(".caja__trasera-register");

    // Referencias a los formularios y divs de mensaje
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const mensajeLoginDiv = document.getElementById('mensaje-login');
    const mensajeRegistroDiv = document.getElementById('mensaje-registro'); 

    // --- Event Listeners para los botones de cambio de formulario ---
    if (btnIniciarSesion) {
        btnIniciarSesion.addEventListener("click", iniciarSesion);
    }
    if (btnRegistrarse) {
        btnRegistrarse.addEventListener("click", register);
    }

    // --- Event Listener para el envio del formulario de REGISTRO (usa Fetch API) ---
    if (registerForm) { 
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const formData = new FormData(registerForm); 
            const data = Object.fromEntries(formData.entries()); 

            try {
                const response = await fetch('/register', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data) 
                });

                const result = await response.json(); 

                if (result.success) {
                    mensajeRegistroDiv.style.color = 'orange';
                    // Usar i18next.t con una verificacion de existencia
                    mensajeRegistroDiv.textContent = typeof i18next !== 'undefined' ? i18next.t('common.register_success') : result.message; 
                    
                    setTimeout(() => {
                        iniciarSesion(); 
                        mensajeRegistroDiv.textContent = ''; 
                        registerForm.reset(); 
                        // ¡CLAVE! Re-aplicar traducciones despues de cambiar el DOM
                        if (typeof window.updateContent === 'function') {
                            window.updateContent(); 
                        }
                    }, 3000); 

                } else {
                    mensajeRegistroDiv.style.color = 'red';
                    let errorMessage = typeof i18next !== 'undefined' ? i18next.t('common.error_message') : 'Error!';
                    if (result.message.includes('Faltan campos obligatorios')) {
                        errorMessage += ' ' + (typeof i18next !== 'undefined' ? i18next.t('common.register_failed_missing') : 'Missing required fields.');
                    } else if (result.message.includes('ya estan en uso')) {
                        errorMessage += ' ' + (typeof i18next !== 'undefined' ? i18next.t('common.register_failed_duplicate') : 'Username or Personal ID already in use.');
                    } else if (result.message.includes('Error interno del servidor al registrar')) {
                        errorMessage += ' ' + (typeof i18next !== 'undefined' ? i18next.t('common.register_failed_server') : 'Internal server error during registration.');
                    } else {
                        errorMessage += ' ' + result.message;
                    }
                    mensajeRegistroDiv.textContent = errorMessage; 
                }

            } catch (error) {
                console.error('Error al enviar el formulario de registro (cliente):', error);
                mensajeRegistroDiv.style.color = 'red';
                mensajeRegistroDiv.textContent = typeof i18next !== 'undefined' ? i18next.t('common.connection_error') + ' ' + i18next.t('common.try_again') : 'An unexpected error occurred. Please try again.'; 
            }
        });
    }

    // --- Event Listener para el envio del formulario de LOGIN (usa Fetch API) ---
    if (loginForm) { 
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/login', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json(); 

                if (result.success) {
                    mensajeLoginDiv.style.color = 'green';
                    mensajeLoginDiv.textContent = typeof i18next !== 'undefined' ? i18next.t('common.success_message') : result.message; 

                    setTimeout(() => {
                        window.location.href = '/ingreso-productos'; 
                    }, 1500); 

                } else {
                    mensajeLoginDiv.style.color = 'red';
                    let errorMessage = typeof i18next !== 'undefined' ? i18next.t('common.error_message') : 'Error!';
                    if (result.message.includes('ID Personal o contrasena incorrectos')) {
                        errorMessage += ' ' + (typeof i18next !== 'undefined' ? i18next.t('common.login_failed_credentials') : 'Personal ID or password incorrect.');
                    } else if (result.message.includes('Error interno del servidor')) {
                        errorMessage += ' ' + (typeof i18next !== 'undefined' ? i18next.t('common.login_failed_server') : 'Internal server error.');
                    } else {
                        errorMessage += ' ' + result.message;
                    }
                    mensajeLoginDiv.textContent = errorMessage; 
                }

            } catch (error) {
                console.error('Error al enviar el formulario de login (cliente):', error);
                mensajeLoginDiv.textContent = typeof i18next !== 'undefined' ? i18next.t('common.connection_error') + ' ' + i18next.t('common.try_again') : 'An unexpected error occurred. Please try again.'; 
                mensajeLoginDiv.style.color = 'red';
            }
        });
    }

    // --- Funciones de cambio de layout (ya existentes) ---
    function anchoPagina(){
        if(window.innerWidth > 850){
            caja_trasera_login.style.display = "block";
            caja_trasera_register.style.display = "block";
        }else{
            caja_trasera_register.style.display = "block";
            caja_trasera_register.style.opacity = "1";
            caja_trasera_login.style.display = "none"; 
            formulario_login.style.display = "block";
            formulario_register.style.display = "none"; 
            contenedor_login_register.style.left = "0px";
        }
        // ¡CLAVE! Llamar a window.updateContent() para traducir el contenido visible
        if (typeof window.updateContent === 'function') {
            console.log("script.js: Llamando a window.updateContent() desde anchoPagina().");
            window.updateContent(); 
        }
    }

    function iniciarSesion(){
        if(window.innerWidth > 850){
            formulario_register.style.display = "none";
            contenedor_login_register.style.left = "10px"; 
            formulario_login.style.display = "block";
            caja_trasera_register.style.opacity = "1";
            caja_trasera_login.style.opacity = "0"; 
        } else{ 
            formulario_register.style.display = "none";
            contenedor_login_register.style.left = "0px";
            formulario_login.style.display = "block";
            caja_trasera_register.style.display = "block";
            caja_trasera_login.style.display = "none"; 
        }
        // ¡CLAVE! Llamar a window.updateContent() para traducir el contenido visible
        if (typeof window.updateContent === 'function') {
            console.log("script.js: Llamando a window.updateContent() desde iniciarSesion().");
            window.updateContent(); 
        }
    }

    function register(){
        if(window.innerWidth > 850){
            formulario_register.style.display = "block";
            contenedor_login_register.style.left = "410px"; 
            formulario_login.style.display = "none";
            caja_trasera_register.style.opacity = "0";
            caja_trasera_login.style.opacity = "1";
        } else{ 
            formulario_register.style.display = "block";
            contenedor_login_register.style.left = "0px";
            formulario_login.style.display = "none";
            caja_trasera_register.style.display = "none";
            caja_trasera_login.style.display = "block";
            caja_trasera_login.style.opacity = "1";
        }
        // ¡CLAVE! Llamar a window.updateContent() para traducir el contenido visible
        if (typeof window.updateContent === 'function') {
            console.log("script.js: Llamando a window.updateContent() desde register().");
            window.updateContent(); 
        }
    }

    // Inicializar el layout y aplicar traducciones al cargar la pagina
    window.addEventListener("resize", anchoPagina);
    // Llamada inicial a anchoPagina para establecer el layout y activar la traduccion inicial
    anchoPagina(); 
}); 
