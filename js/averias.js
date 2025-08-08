document.addEventListener('DOMContentLoaded', () => {
    console.log("averias.js: Script cargado y DOMContentLoaded.");

    const formReportarAveria = document.getElementById('form-reportar-averia');
    const inputCodigoDeBarrasAveria = document.getElementById('codigo_de_barras_averia');
    const inputDescripcionProductoAveria = document.getElementById('descripcion_producto_averia');
    const inputDescripcionAveria = document.getElementById('descripcion_averia');
    const inputFechaAveria = document.getElementById('fecha_averia');
    const selectEstadoAveria = document.getElementById('estado_averia');
    const btnLimpiarAveria = document.getElementById('btn-limpiar-averia');

    // --- Funciones Auxiliares ---

    // Funcion para rellenar la descripcion del producto basado en el codigo de barras
    async function fetchProductDetails(barcode) {
        if (!barcode) {
            inputDescripcionProductoAveria.value = '';
            return;
        }
        try {
            const response = await fetch(`/api/productos/barcode/${barcode}`);
            const result = await response.json();

            if (result.success && result.product) {
                inputDescripcionProductoAveria.value = result.product.descripcion || 'Producto sin descripción';
            } else {
                inputDescripcionProductoAveria.value = 'Producto no encontrado';
            }
        } catch (error) {
            console.error('Error al buscar detalles del producto por codigo de barras:', error);
            inputDescripcionProductoAveria.value = 'Error al cargar descripción';
        }
    }

    // Funcion para limpiar el formulario
    function clearAveriaForm() {
        formReportarAveria.reset();
        setTodayDate(); // Vuelve a establecer la fecha actual
        inputDescripcionProductoAveria.value = ''; // Asegurar que este campo se limpia
    }

    // Funcion para establecer la fecha actual por defecto
    function setTodayDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Enero es 0
        const dd = String(today.getDate()).padStart(2, '0');
        inputFechaAveria.value = `${yyyy}-${mm}-${dd}`;
    }

    // --- Event Listeners ---

    // Establecer la fecha actual al cargar la pagina
    setTodayDate();

    // Autocompletado de descripcion de producto al ingresar codigo de barras
    let typingTimerBarcode;
    const doneTypingIntervalBarcode = 500; // 0.5 segundos

    inputCodigoDeBarrasAveria.addEventListener('input', () => {
        clearTimeout(typingTimerBarcode);
        const barcode = inputCodigoDeBarrasAveria.value.trim();
        if (barcode.length >= 3) { // Buscar despues de 3 caracteres
            typingTimerBarcode = setTimeout(() => fetchProductDetails(barcode), doneTypingIntervalBarcode);
        } else {
            inputDescripcionProductoAveria.value = ''; // Limpiar si el codigo es muy corto
        }
    });

    // Evento 'change' para asegurar la busqueda si el usuario pega un codigo o sale del campo
    inputCodigoDeBarrasAveria.addEventListener('change', () => {
        const barcode = inputCodigoDeBarrasAveria.value.trim();
        fetchProductDetails(barcode);
    });


    // Manejar el envio del formulario de averia
    if (formReportarAveria) {
        formReportarAveria.addEventListener('submit', async (e) => {
            e.preventDefault();

            const data = {
                codigo_de_barras: inputCodigoDeBarrasAveria.value.trim(),
                descripcion_averia: inputDescripcionAveria.value.trim(),
                fecha_averia: inputFechaAveria.value,
                estado: selectEstadoAveria.value,
                // reportado_por_id_personal se obtiene en el backend de la sesion
            };

            console.log("FRONTEND AVERIA: Datos a enviar:", data);

            try {
                const response = await fetch('/guardar-averia', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const result = await response.json();
                    if (result.success) {
                        alert(result.message);
                        clearAveriaForm(); // Limpiar formulario al guardar exitosamente
                    } else {
                        alert('Error al reportar avería: ' + result.message);
                    }
                } else {
                    const textResponse = await response.text();
                    console.error("FRONTEND AVERIA: Respuesta del servidor no es JSON:", textResponse);
                    alert('Ocurrió un error inesperado al reportar la avería. Revisa la consola del navegador.');
                }
            } catch (error) {
                console.error('FRONTEND AVERIA: Error en el bloque catch:', error);
                alert('Ocurrió un error de conexión al reportar la avería.');
            }
        });
    }

    // Boton para limpiar el formulario
    if (btnLimpiarAveria) {
        btnLimpiarAveria.addEventListener('click', clearAveriaForm);
    }

}); // Cierre del DOMContentLoaded
