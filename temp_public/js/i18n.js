// i18n.js
// Configuración de i18next para la internacionalización

document.addEventListener('DOMContentLoaded', () => {
    console.log("i18n.js: Script cargado y DOMContentLoaded.");

    // Cargar las librerias de i18next desde CDN
    const i18nextScript = document.createElement('script');
    i18nextScript.src = 'https://unpkg.com/i18next@23.11.5/i18next.min.js';
    document.head.appendChild(i18nextScript);

    const i18nextBrowserLanguageDetectorScript = document.createElement('script');
    i18nextBrowserLanguageDetectorScript.src = 'https://unpkg.com/i18next-browser-languagedetector@8.0.0/i18nextBrowserLanguageDetector.min.js';
    document.head.appendChild(i18nextBrowserLanguageDetectorScript);

    const i18nextHttpBackendScript = document.createElement('script');
    i18nextHttpBackendScript.src = 'https://unpkg.com/i18next-http-backend@2.5.0/i18nextHttpBackend.min.js';
    document.head.appendChild(i18nextHttpBackendScript);

    // Esperar a que TODOS los scripts de i18next se carguen
    Promise.all([
        new Promise(resolve => i18nextScript.onload = resolve),
        new Promise(resolve => i18nextBrowserLanguageDetectorScript.onload = resolve),
        new Promise(resolve => i18nextHttpBackendScript.onload = resolve) 
    ]).then(() => {
        console.log("i18next, i18next-browser-languagedetector y i18next-http-backend cargados.");

        i18next
            .use(i18nextBrowserLanguageDetector) 
            .use(i18nextHttpBackend) 
            .init({
                fallbackLng: 'es', 
                debug: true, 
                ns: ['translation'], 
                defaultNS: 'translation', 
                backend: {
                    loadPath: '/locales/{{lng}}/translation.json' 
                },
                detection: {
                    order: ['querystring', 'cookie', 'localStorage', 'navigator'],
                    caches: ['localStorage', 'cookie']
                },
                returnObjects: true // ¡CLAVE! Habilitar para que i18next pueda devolver objetos si la clave lo indica
            }, (err, t) => {
                if (err) {
                    console.error('Error al inicializar i18next:', err);
                    return;
                }
                console.log('i18next inicializado. Idioma actual:', i18next.language);

                // --- Lógica para Inyectar el Selector de Idioma Dinámicamente (SOLO EN INDEX.HTML) ---
                if (window.location.pathname === '/') { 
                    let langSelectContainer = document.querySelector('.language-switcher');
                    if (!langSelectContainer) { 
                        console.log("i18n.js: Selector de idioma no encontrado en HTML, inyectando dinámicamente.");
                        langSelectContainer = document.createElement('div');
                        langSelectContainer.className = 'language-switcher';
                        langSelectContainer.innerHTML = `
                            <select id="language-select">
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="pap">Papiamento</option>
                                <option value="zh">中文</option>
                            </select>
                        `;
                        document.body.prepend(langSelectContainer); 
                        console.log("i18n.js: Selector de idioma inyectado en el elemento body.");
                    }
                    const langSelect = langSelectContainer.querySelector('#language-select');
                    if (langSelect) {
                        setLanguageDropdownValue(i18next.language); 
                        langSelect.addEventListener('change', (event) => {
                            window.changeLanguage(event.target.value);
                        });
                        console.log("i18n.js: Listener de cambio de idioma adjuntado al select.");
                    }
                }
                // --- Fin Lógica de Inyección ---

                console.log("i18n.js: Llamando a window.updateContent() despues de la inicializacion.");
                window.updateContent(); 
            });

        // Funcion para aplicar las traducciones a los elementos con data-i18n
        window.updateContent = function() {
            if (!i18next.isInitialized) {
                console.warn("updateContent: i18next no esta inicializado aun. No se pueden aplicar traducciones.");
                return;
            }
            console.log("updateContent: Iniciando aplicacion de traducciones para idioma:", i18next.language);
            let translatedCount = 0;
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                
                // Si la clave es para un placeholder
                if (key.startsWith('[placeholder]')) {
                    const actualKey = key.substring(13); 
                    element.placeholder = i18next.t(actualKey);
                } else {
                    // Para elementos de texto (h1, p, button, etc.)
                    // Asegurarse de que la clave no sea un objeto completo (ej. 'registros' en lugar de 'registros.page_title')
                    const translatedValue = i18next.t(key);
                    if (typeof translatedValue === 'string') { // Solo asignar si es una cadena
                        element.textContent = translatedValue;
                    } else {
                        console.warn(`updateContent: La clave '${key}' no devolvio una cadena para el elemento. Tipo: ${typeof translatedValue}`);
                    }
                }
                translatedCount++;
            });
            // Actualizar el titulo de la pagina
            document.title = i18next.t(document.title);
            console.log(`updateContent: Finalizado. Se tradujeron ${translatedCount} elementos.`);
        };

        // Funcion para establecer el valor del select de idioma
        function setLanguageDropdownValue(lng) {
            const langSelect = document.getElementById('language-select');
            if (langSelect) {
                langSelect.value = lng;
                console.log("setLanguageDropdownValue: Selector de idioma establecido a:", lng);
            } else {
                console.log("setLanguageDropdownValue: Selector de idioma no encontrado para establecer valor.");
            }
        }

        // Exponer la funcion de cambio de idioma globalmente
        window.changeLanguage = (lng) => {
            console.log("changeLanguage: Intentando cambiar idioma a:", lng);
            i18next.changeLanguage(lng, (err, t) => {
                if (err) {
                    console.error('Error al cambiar idioma:', err);
                    return;
                }
                console.log("changeLanguage: Idioma cambiado exitosamente a:", lng);
                window.updateContent(); 
                setLanguageDropdownValue(lng); 
            });
        };

        i18next.on('languageChanged', (lng) => {
            console.log('i18next event: Idioma cambiado a:', lng);
        });
    });
});

