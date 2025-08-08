// Este script es exclusivo para ingreso-productos.html
    document.addEventListener('DOMContentLoaded', () => {
        console.log("ingreso-productos.js: Script cargado y DOMContentLoaded.");

        // Obtener referencias a los elementos del DOM de esta pagina
        const formIngresoProductos = document.getElementById('form-ingreso-productos');
        const btnGuardarProducto = document.querySelector('#form-ingreso-productos button[type="submit"]');

        // Referencias a los campos individuales del formulario de ingreso de productos
        const inputCodigoDeBarras = document.getElementById('codigo_de_barras');
        const inputCodigo = document.getElementById('codigo');
        const inputDescripcion = document.getElementById('descripcion');
        const inputCantidad = document.getElementById('cantidad');
        const inputFecha = document.getElementById('fecha');
        const inputPrecio = document.getElementById('precio');
        const inputPasillo = document.getElementById('pasillo');

        // Referencia al datalist para sugerencias de descripcion
        const datalistSugerenciasDescripcion = document.getElementById('sugerencias-descripcion');


        // --- DEBUG: Listeners para ver cuando los campos cambian (mas detallado) ---
        if (inputCodigoDeBarras) {
            inputCodigoDeBarras.addEventListener('input', () => {
                console.log(`DEBUG: inputCodigoDeBarras 'input' event. Valor actual: '${inputCodigoDeBarras.value.trim()}'`);
            });
            inputCodigoDeBarras.addEventListener('change', () => {
                console.log(`DEBUG: inputCodigoDeBarras 'change' event. Valor final: '${inputCodigoDeBarras.value.trim()}'`);
            });
        }
        if (inputCodigo) {
            inputCodigo.addEventListener('input', () => {
                console.log(`DEBUG: inputCodigo 'input' event. Valor actual: '${inputCodigo.value.trim()}'`);
            });
        }
        if (inputDescripcion) {
            inputDescripcion.addEventListener('input', () => {
                console.log(`DEBUG: inputDescripcion 'input' event. Valor actual: '${inputDescripcion.value.trim()}'`);
            });
            inputDescripcion.addEventListener('change', () => {
                console.log(`DEBUG: inputDescripcion 'change' event. Valor final: '${inputDescripcion.value.trim()}'`);
            });
        }
        // Fin DEBUG Listeners

        // Referencias a los botones de esta pagina
        const exportExcelBtn = document.getElementById('export-excel-btn');
        const logoutBtn = document.getElementById('logout-btn');

        // --- FUNCIONES AUXILIARES REFINADAS ---

        // Funcion para rellenar los campos del formulario con los datos de un producto
        function fillFormFields(product) {
            console.log("DEBUG: fillFormFields() llamado con producto:", product);
            console.log("DEBUG: fillFormFields() - product.codigo_de_barras a establecer:", product.codigo_de_barras);
            inputCodigoDeBarras.value = product.codigo_de_barras || '';
            console.log("DEBUG: fillFormFields() - inputCodigoDeBarras DESPUES de establecer:", inputCodigoDeBarras.value);
            
            inputCodigo.value = product.codigo || '';
            inputDescripcion.value = product.descripcion || ''; 
            inputCantidad.value = product.cantidad || '';
            if (product.fecha) {
                const date = new Date(product.fecha);
                inputFecha.value = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD para input type="date"
            } else {
                inputFecha.value = '';
            }
            inputPrecio.value = product.precio || '';
            inputPasillo.value = product.pasillo || '';
            console.log("DEBUG: Campos del formulario rellenados.");
        }

        // Funcion para limpiar solo los campos de detalle del producto, sin tocar codigo de barras ni descripcion
        function clearNonKeyFields() {
            console.trace("DEBUG: clearNonKeyFields() llamado. Estado inicial: CodigoBarras='", inputCodigoDeBarras.value.trim(), "', Descripcion='", inputDescripcion.value.trim(), "'"); // ¡CLAVE: console.trace()!
            inputCodigo.value = '';
            inputCantidad.value = '';
            inputFecha.value = '';
            inputPrecio.value = '';
            inputPasillo.value = '';
            console.log(`DEBUG: Campos de detalles limpiados. inputCodigo='${inputCodigo.value}', inputCantidad='${inputCantidad.value}', etc.`);
            console.log(`DEBUG: clearNonKeyFields() finalizado. Estado final: CodigoBarras='`, inputCodigoDeBarras.value.trim(), "', Descripcion='", inputDescripcion.value.trim(), "'");
        }

        // Funcion para limpiar todos los campos del formulario
        function clearAllFormFields() {
            console.trace("DEBUG: clearAllFormFields() llamado. Reseteando todo el formulario."); // ¡CLAVE: console.trace()!
            formIngresoProductos.reset();
            console.log(`DEBUG: clearAllFormFields() finalizado. inputCodigoDeBarras='${inputCodigoDeBarras.value.trim()}', inputDescripcion='${inputDescripcion.value.trim()}'`);
        }


        // --- Logica para guardar productos ---
        if (formIngresoProductos && btnGuardarProducto) {
            btnGuardarProducto.addEventListener('click', async (e) => {
                e.preventDefault(); 

                // ¡CLAVE! Log para verificar el valor del codigo de barras justo antes de enviarlo
                console.log(`DEBUG: GUARDAR - Valor de inputCodigoDeBarras JUSTO ANTES de crear 'data': '${inputCodigoDeBarras.value.trim()}'`);

                const data = {
                    codigo_de_barras: inputCodigoDeBarras.value,
                    codigo: inputCodigo.value,
                    descripcion: inputDescripcion.value,
                    cantidad: inputCantidad.value,
                    fecha: inputFecha.value,
                    precio: inputPrecio.value,
                    pasillo: inputPasillo.value
                };

                console.log("FRONTEND: Intentando guardar producto."); 
                console.log("FRONTEND: Datos a enviar:", data); // Verifica el objeto 'data' completo

                try {
                    const response = await fetch('/guardar-producto', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data) 
                    });

                    console.log("FRONTEND: Respuesta recibida del servidor. Status:", response.status); 

                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const result = await response.json();
                        console.log("FRONTEND: Resultado JSON del servidor:", result); 

                        if (result.success) {
                            alert(result.message); 
                            clearAllFormFields(); // Limpiar todo el formulario al guardar
                        } else {
                            alert('Error al guardar el producto: ' + result.message);
                        }
                    } else {
                        const textResponse = await response.text();
                        console.error("FRONTEND: La respuesta del servidor no es JSON:", textResponse); 
                        alert('Ocurrio un error inesperado al guardar el producto. El servidor no devolvio una respuesta JSON valida. Revisa la consola del navegador.');
                    }
                } catch (error) {
                    console.error('FRONTEND: Error en el bloque catch (posiblemente de red o parseo):', error); 
                    alert('Ocurrio un error al guardar el producto. Intenta de nuevo. Revisa la consola del navegador para mas detalles.');
                }
            });
        }


        // --- Logica de Autocompletado por Codigo de Barras ---
        if (inputCodigoDeBarras) {
            let typingTimerBarcode; 
            const doneTypingIntervalBarcode = 500; 

            inputCodigoDeBarras.addEventListener('input', () => {
                clearTimeout(typingTimerBarcode);
                const barcode = inputCodigoDeBarras.value.trim(); 
                console.log(`DEBUG: BARCODE INPUT - Valor: '${barcode}'`);

                if (barcode.length >= 3) { 
                    typingTimerBarcode = setTimeout(async () => {
                        console.log(`FRONTEND AUTOCOMPLETE (BARCODE): Buscando producto para codigo de barras: ${barcode}`);
                        try {
                            const response = await fetch(`/api/productos/barcode/${barcode}`);
                            const result = await response.json();

                            if (result.success && result.product) {
                                console.log("FRONTEND AUTOCOMPLETE (BARCODE): Producto encontrado, rellenando campos.");
                                fillFormFields(result.product);
                            } else {
                                console.log("FRONTEND AUTOCOMPLETE (BARCODE): Producto no encontrado. Limpiando campos de detalles.");
                                clearNonKeyFields(); 
                            }
                        } catch (error) {
                            console.error('FRONTEND AUTOCOMPLETE (BARCODE): Error al buscar producto por codigo de barras:', error);
                        }
                    }, doneTypingIntervalBarcode);
                } else if (barcode.length === 0) {
                    console.log("FRONTEND AUTOCOMPLETE (BARCODE): Codigo de barras vacio. Limpiando todo el formulario.");
                    clearAllFormFields(); 
                }
            });
        }

        // --- Logica de Sugerencias de Descripcion y Autocompletado por Descripcion ---
        if (inputDescripcion && datalistSugerenciasDescripcion) {
            let typingTimerSuggestions;
            const doneTypingIntervalSuggestions = 300; 

            // Evento 'input' para las sugerencias del datalist
            inputDescripcion.addEventListener('input', () => {
                clearTimeout(typingTimerSuggestions);
                const query = inputDescripcion.value.trim();
                console.log(`DEBUG: DESCRIPCION INPUT - Valor: '${query}'`);

                if (query.length >= 2) { 
                    typingTimerSuggestions = setTimeout(async () => {
                        console.log(`FRONTEND SUGERENCIAS: Buscando sugerencias para: ${query}`);
                        try {
                            const response = await fetch(`/api/productos/sugerencias-descripcion?q=${encodeURIComponent(query)}`);
                            const result = await response.json();

                            if (result.success && result.suggestions) {
                                datalistSugerenciasDescripcion.innerHTML = ''; 
                                result.suggestions.forEach(suggestion => {
                                    const option = document.createElement('option');
                                    option.value = suggestion;
                                    datalistSugerenciasDescripcion.appendChild(option);
                                });
                                console.log("FRONTEND SUGERENCIAS: Datalist actualizado con:", result.suggestions.length, "sugerencias.");
                            } else {
                                console.log("FRONTEND SUGERENCIAS: No se encontraron sugerencias o error.");
                                datalistSugerenciasDescripcion.innerHTML = ''; 
                            }
                        } catch (error) {
                            console.error('FRONTEND SUGERENCIAS: Error al obtener sugerencias de descripcion:', error);
                        }
                    }, doneTypingIntervalSuggestions);
                } else {
                    datalistSugerenciasDescripcion.innerHTML = ''; 
                }
            });

            // Evento 'change' para autocompletar el formulario cuando la descripcion se selecciona o se completa
            inputDescripcion.addEventListener('change', async () => {
                const description = inputDescripcion.value.trim();
                console.log(`DEBUG: DESCRIPCION CHANGE - Valor: '${description}'`);
                console.log(`DEBUG: DESCRIPCION CHANGE - Valor de Codigo de Barras al inicio del change: '${inputCodigoDeBarras.value.trim()}'`);

                if (description) { 
                    console.log(`FRONTEND AUTOCOMPLETE (DESC): Intentando autocompletar por descripcion: ${description}`);
                    try {
                        const response = await fetch(`/api/productos/description/${encodeURIComponent(description)}`);
                        const result = await response.json();

                        if (result.success && result.product) {
                            console.log("FRONTEND AUTOCOMPLETE (DESC): Producto encontrado por descripcion, rellenando campos.");
                            fillFormFields(result.product);
                        } else {
                            console.log("FRONTEND AUTOCOMPLETE (DESC): Producto no encontrado por descripcion.");
                            // Si el codigo de barras tiene un valor, asumimos que es un producto nuevo o se esta editando.
                            // Solo limpiar los campos de detalles si la descripcion no es de un producto existente Y el codigo de barras esta vacio.
                            // O si el codigo de barras fue rellenado por el autocompletado y ahora la descripcion no coincide.
                            // Para este caso, si la descripcion no encontro un producto, y el codigo de barras no esta vacio,
                            // NO LIMPIAMOS NADA, porque el usuario puede estar creando un producto nuevo con un codigo de barras unico.
                            if (!inputCodigoDeBarras.value.trim()) { // Si el codigo de barras esta vacio, limpiar detalles
                                console.log("FRONTEND AUTOCOMPLETE (DESC): Codigo de barras vacio. Limpiando campos de detalles.");
                                clearNonKeyFields(); 
                            } else {
                                // Si el codigo de barras NO esta vacio, y la descripcion no encontro un producto,
                                // NO HACEMOS NADA para preservar el codigo de barras y la descripcion ingresada.
                                console.log("FRONTEND AUTOCOMPLETE (DESC): Codigo de barras NO vacio. No se limpian los detalles.");
                            }
                        }
                    } catch (error) {
                        console.error('FRONTEND AUTOCOMPLETE (DESC): Error al buscar producto por descripcion:', error);
                    }
                } else {
                    // Si el campo de descripcion se vacia, limpiar solo los detalles, manteniendo el codigo de barras
                    console.log("FRONTEND AUTOCOMPLETE (DESC): Descripcion vacia. Llamando a clearNonKeyFields().");
                    clearNonKeyFields(); 
                }
            });
        }


        // --- LÓGICA DE EXPORTACIÓN A EXCEL (XLSX) de TODOS los productos ---
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => {
                window.location.href = '/exportar-productos-xlsx'; 
                alert('¡Exportando todos los productos! Se descargara un archivo XLSX.'); 
            });
        }
    }); // Cierre del DOMContentLoaded
