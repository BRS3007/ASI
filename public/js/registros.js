document.addEventListener('DOMContentLoaded', () => {
    console.log("registros.js: Script cargado y DOMContentLoaded.");

    // Obtener referencias a los elementos del DOM
    const productosTableBody = document.querySelector('#productos-table tbody');
    const noProductsMessage = document.getElementById('no-products-message');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const fechaInicioInput = document.getElementById('fecha-inicio'); // Nuevo: Input de fecha inicio
    const fechaFinInput = document.getElementById('fecha-fin');     // Nuevo: Input de fecha fin
    const filterBtn = document.getElementById('filter-btn');       // Nuevo: Boton de filtrar
    const clearFilterBtn = document.getElementById('clear-filter-btn'); // Nuevo: Boton de limpiar filtro
    const exportExcelBtn = document.getElementById('export-excel-btn'); // Boton de exportar
    const exportIcon = document.querySelector('.export-icon'); // Icono de exportar
    const logoutBtnNav = document.getElementById('logout-btn-nav'); // Boton de logout en nav

    let allProducts = []; // Para almacenar todos los productos sin filtrar

    // --- Funciones Auxiliares ---

    // Funcion para mostrar u ocultar el mensaje de "No hay productos"
    function toggleNoProductsMessage() {
        if (productosTableBody.rows.length === 0) {
            noProductsMessage.style.display = 'block';
        } else {
            noProductsMessage.style.display = 'none';
        }
    }

    // Funcion para obtener y mostrar productos
    async function fetchAndDisplayProducts() {
        console.log("CLIENTE: fetchAndDisplayProducts() llamado.");
        try {
            const response = await fetch('/api/productos');
            if (!response.ok) {
                if (response.status === 403) {
                    alert('Acceso denegado. No tienes permisos para ver los registros.');
                    // Puedes redirigir o simplemente no mostrar nada
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            allProducts = products; // Guardar todos los productos
            displayProducts(allProducts); // Mostrar todos los productos inicialmente
            console.log("CLIENTE: Productos cargados y mostrados.");
        } catch (error) {
            console.error('CLIENTE ERROR: Error al obtener productos:', error);
            alert('No se pudieron cargar los productos. Por favor, intenta de nuevo.');
        }
    }

    // Funcion para mostrar los productos en la tabla (filtrados o no)
    function displayProducts(productsToDisplay) {
        console.log("CLIENTE: Inicia displayProducts(). Productos a mostrar:", productsToDisplay.length);
        console.log("CLIENTE: Primeros 3 productos en displayProducts para inspeccion:", productsToDisplay.slice(0, 3));

        if (!productosTableBody) {
            console.error("CLIENTE ERROR: No se puede mostrar productos, '#productos-table tbody' no existe.");
            return;
        }

        productosTableBody.innerHTML = ''; // Limpiar la tabla

        if (productsToDisplay.length === 0) {
            console.log("CLIENTE: productsToDisplay es vacio. Mostrando mensaje 'No hay productos registrados aun'.");
            toggleNoProductsMessage();
            return;
        }

        productsToDisplay.forEach(producto => {
            const row = productosTableBody.insertRow();
            
            row.insertCell(0).textContent = producto.codigo_de_barras || ''; 
            row.insertCell(1).textContent = producto.codigo || '';          
            
            const descripcionCell = row.insertCell(2);
            let descripcionTexto = producto.descripcion || '';
            if (producto.nombre_usuario_registro) {
                descripcionTexto += ` (Reg. por: ${producto.nombre_usuario_registro})`; 
            }
            descripcionCell.textContent = descripcionTexto; 
            
            row.insertCell(3).textContent = producto.cantidad; 
            row.insertCell(4).textContent = producto.fecha ? new Date(producto.fecha).toLocaleDateString() : ''; 
            row.insertCell(5).textContent = producto.precio ? parseFloat(producto.precio).toFixed(2) : ''; 
            row.insertCell(6).textContent = producto.pasillo || '';         

            const actionsCell = row.insertCell(7); 
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.className = 'btn-edit';
            editButton.addEventListener('click', () => editarProducto(producto.id)); 
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.className = 'btn-delete';
            deleteButton.addEventListener('click', () => eliminarProducto(producto.id)); 
            actionsCell.appendChild(deleteButton);
            
            row.cells[0].setAttribute('data-label', 'Codigo de Barras');
            row.cells[1].setAttribute('data-label', 'Codigo');
            row.cells[2].setAttribute('data-label', 'Descripcion'); 
            row.cells[3].setAttribute('data-label', 'Cantidad');
            row.cells[4].setAttribute('data-label', 'Fecha');
            row.cells[5].setAttribute('data-label', 'Precio');
            row.cells[6].setAttribute('data-label', 'Pasillo');
            row.cells[7].setAttribute('data-label', 'Acciones'); 
        });
        toggleNoProductsMessage(); 
        console.log("CLIENTE: Finaliza displayProducts(). Tabla actualizada.");
    }

    // Funciones de edicion y eliminacion (mantener las que ya tienes)
    async function editarProducto(id) {
        console.log('Editar producto con ID:', id);
        // Implementar la logica de edicion (ej. abrir un modal con el formulario pre-rellenado)
        alert('Funcionalidad de edición en desarrollo para ID: ' + id);
    }

    async function eliminarProducto(id) {
        console.log('Eliminar producto con ID:', id);
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                const response = await fetch(`/api/productos/${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (result.success) {
                    alert(result.message);
                    fetchAndDisplayProducts(); // Recargar productos
                } else {
                    alert('Error al eliminar producto: ' + result.message);
                }
            } catch (error) {
                console.error('Error al eliminar producto:', error);
                alert('Ocurrió un error al intentar eliminar el producto.');
            }
        }
    }

    // --- Lógica de Filtrado y Búsqueda ---

    // Funcion para filtrar productos por termino de busqueda
    function filterProductsBySearchTerm() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredProducts = allProducts.filter(producto =>
            (producto.codigo_de_barras && producto.codigo_de_barras.toLowerCase().includes(searchTerm)) ||
            (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm)) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm)) ||
            (producto.pasillo && producto.pasillo.toLowerCase().includes(searchTerm))
        );
        displayProducts(filteredProducts);
    }

    // Funcion para filtrar productos por rango de fechas
    function filterProductsByDateRange() {
        const fechaInicio = fechaInicioInput.value;
        const fechaFin = fechaFinInput.value;

        if (!fechaInicio && !fechaFin) {
            alert('Por favor, selecciona al menos una fecha para filtrar.');
            displayProducts(allProducts); // Mostrar todos si no hay filtro
            return;
        }

        const filteredProducts = allProducts.filter(producto => {
            const productDate = new Date(producto.fecha);
            const start = fechaInicio ? new Date(fechaInicio) : null;
            const end = fechaFin ? new Date(fechaFin) : null;

            let matchesStartDate = true;
            if (start) {
                start.setHours(0, 0, 0, 0); // Ajustar a inicio del dia
                matchesStartDate = productDate >= start;
            }

            let matchesEndDate = true;
            if (end) {
                end.setHours(23, 59, 59, 999); // Ajustar a fin del dia
                matchesEndDate = productDate <= end;
            }

            return matchesStartDate && matchesEndDate;
        });
        displayProducts(filteredProducts);
    }

    // --- Event Listeners ---

    // Cargar productos al cargar la pagina
    fetchAndDisplayProducts();

    // Event listeners para busqueda
    if (searchBtn) {
        searchBtn.addEventListener('click', filterProductsBySearchTerm);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterProductsBySearchTerm();
            }
        });
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            displayProducts(allProducts); // Mostrar todos los productos
        });
    }

    // Event listeners para filtrado por fecha
    if (filterBtn) {
        filterBtn.addEventListener('click', filterProductsByDateRange);
    }
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            fechaInicioInput.value = '';
            fechaFinInput.value = '';
            displayProducts(allProducts); // Mostrar todos los productos
        });
    }

    // --- LÓGICA DE EXPORTACIÓN A EXCEL (XLSX) ---
    function handleExportClick() {
        const fechaInicio = fechaInicioInput.value;
        const fechaFin = fechaFinInput.value;

        let exportUrl = '/exportar-productos-xlsx';
        const params = new URLSearchParams();

        if (fechaInicio) {
            params.append('fechaInicio', fechaInicio);
        }
        if (fechaFin) {
            params.append('fechaFin', fechaFin);
        }

        if (params.toString()) {
            exportUrl += '?' + params.toString();
        }
        
        console.log("CLIENTE EXPORTAR: URL de exportacion generada:", exportUrl);
        window.location.href = exportUrl; 
        alert('¡Exportando productos! Se descargara un archivo XLSX.'); 
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', handleExportClick); 
    }

    if (exportIcon) {
        exportIcon.addEventListener('click', handleExportClick);
    }

    // --- LÓGICA: Cerrar sesion (manejada por common.js) ---
    // Este bloque ya no es necesario si common.js lo maneja globalmente
    // if (logoutBtnNav) {
    //     logoutBtnNav.addEventListener('click', async (e) => {
    //         e.preventDefault();
    //         // La logica de logout esta en common.js
    //     });
    // }

}); // Cierre del DOMContentLoaded
