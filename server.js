const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const ExcelJS = require('exceljs'); 

const app = express();
const port = 3000;

// --- 1. Configuracion de Middlewares ---
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    secret: '85735afd-7b6b-4e21-9e24-881a04b5a0d67206fe94-be0e-4a5f-ad71-5bc1e210a076', 
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        maxAge: 5 * 60 * 1000 
    }
}));

// Servir archivos estaticos desde la carpeta 'public'
// Esto sirve index.html, style.css, script.js, etc.
app.use(express.static(path.join(__dirname, 'public')));

// ¡CLAVE! Servir la carpeta 'locales' para las traducciones
// Esto mapea la URL /locales a la carpeta public/locales en el servidor.
// Por ejemplo, una solicitud a /locales/es/translation.json buscará en public/locales/es/translation.json
app.use('/locales', express.static(path.join(__dirname, 'public', 'locales')));


// --- 2. Configuracion de la Conexion a la Base de Datos ---
const db = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: 'JuanyNathalia', 
    database: 'sistema_login' 
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexion a la base de datos establecida');
});


// --- 3. Definicion de Rutas de la Aplicacion ---

// Ruta principal: Redirige al login o a la pagina de ingreso de productos
app.get('/', (req, res) => {
    if (req.session.loggedIn) {
        res.redirect('/ingreso-productos'); 
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Ruta para manejar el inicio de sesion
app.post('/login', async (req, res) => {
    const { id_personal, contrasena } = req.body; 

    if (!id_personal || !contrasena) {
        return res.status(400).json({ success: false, message: 'Por favor, ingresa ID Personal y contrasena.' });
    }

    const query = 'SELECT * FROM usuarios WHERE id_personal = ?'; 
    db.query(query, [id_personal], async (err, results) => {
        if (err) {
            console.error('Error al buscar usuario en la DB:', err);
            return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'ID Personal o contrasena incorrectos.' });
        }

        const usuario = results[0];
        const contrasenaCoincide = await bcrypt.compare(contrasena, usuario.contrasena);

        if (contrasenaCoincide) {
            req.session.loggedIn = true;
            req.session.id_personal = usuario.id_personal; 
            req.session.nombre_usuario = usuario.nombre_usuario; 
            req.session.role = usuario.role; 
            console.log(`Usuario ${usuario.nombre_usuario} (${usuario.id_personal}) ha iniciado sesion con rol: ${usuario.role}`); 
            return res.json({ success: true, message: 'Inicio de sesion exitoso.' });
        } else {
            return res.status(401).json({ success: false, message: 'ID Personal o contrasena incorrectos.' });
        }
    });
});

// Ruta para el registro de nuevos usuarios
app.post('/register', async (req, res) => { 
    const { nombre_usuario, id_personal, contrasena } = req.body;

    if (!nombre_usuario || !id_personal || !contrasena) {
        return res.status(400).json({ success: false, message: 'Por favor, ingresa Nombre de Usuario, ID Personal y Contrasena.' });
    }

    try {
        const saltRounds = 10;
        const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);

        const query = 'INSERT INTO usuarios (nombre_usuario, id_personal, contrasena) VALUES (?, ?, ?)';
        
        db.query(query, [nombre_usuario, id_personal, contrasenaHasheada], (err, results) => {
            if (err) {
                console.error('Error al registrar usuario en la DB:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ success: false, message: 'El nombre de usuario o el ID personal ya estan en uso.' });
                }
                return res.status(500).json({ success: false, message: 'Error interno del servidor al registrar.' });
            }
            res.json({ success: true, message: 'Usuario registrado exitosamente. Ahora puedes iniciar sesion.' });
        });
    } catch (error) {
        console.error('Error al hashear la contrasena:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// --- RUTAS PARA LAS PAGINAS HTML ---
app.get('/ingreso-productos', (req, res) => {
    if (req.session.loggedIn) {
        res.sendFile(path.join(__dirname, 'public', 'ingreso-productos.html')); 
    } else {
        res.redirect('/'); 
    }
});

// Ruta para la pagina de Ingresos Realizados (¡Con control de acceso por rol!)
app.get('/registros', (req, res) => {
    if (!req.session.loggedIn) {
        console.log('Acceso a /registros: Usuario no autenticado. Redirigiendo a login.');
        return res.redirect('/'); 
    }

    if (req.session.role === 'admin') {
        console.log(`Acceso a /registros: Usuario ${req.session.id_personal} con rol 'admin'. Acceso concedido.`);
        res.sendFile(path.join(__dirname, 'public', 'registros.html')); 
    } else {
        console.log(`Acceso a /registros: Usuario ${req.session.id_personal} con rol '${req.session.role}'. Acceso denegado.`);
        res.sendFile(path.join(__dirname, 'public', 'acceso-denegado.html')); 
    }
});

// NUEVA RUTA: Para la pagina de Reportar Averias
app.get('/averias', (req, res) => {
    if (req.session.loggedIn) {
        res.sendFile(path.join(__dirname, 'public', 'averias.html'));
    } else {
        res.redirect('/');
    }
});


// --- RUTAS API ---

// Ruta para guardar productos
app.post('/guardar-producto', (req, res) => {
    console.log('BACKEND: Solicitud POST recibida en /guardar-producto.'); 

    if (!req.session.loggedIn) {
        console.log('BACKEND: Usuario no autenticado para guardar producto. Denegando acceso.'); 
        return res.status(401).json({ success: false, message: 'No autorizado. Por favor, inicia sesion para guardar productos.' });
    }

    const producto = req.body;
    const id_personal_usuario = req.session.id_personal; 

    console.log('BACKEND: Datos del producto recibidos:', producto); 
    console.log('BACKEND: ID Personal del usuario que registra:', id_personal_usuario); 

    if (!producto.codigo_de_barras || !producto.codigo || !producto.descripcion || !producto.cantidad || !producto.fecha || !producto.precio || !producto.pasillo) {
        console.log('BACKEND: Faltan campos obligatorios en el producto.'); 
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para el producto.' });
    }

    const query = `
        INSERT INTO inventario (codigo_de_barras, codigo, descripcion, cantidad, fecha, precio, pasillo, id_personal_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
        producto.codigo_de_barras,
        producto.codigo,
        producto.descripcion,
        producto.cantidad,
        producto.fecha, 
        producto.precio,
        producto.pasillo,
        id_personal_usuario 
    ], (err, results) => {
        if (err) {
            console.error('BACKEND: Error al insertar el producto en la base de datos:', err); 
            console.error('BACKEND: Detalles del error de MySQL:', err.message); 
            return res.status(500).json({ success: false, message: 'Error al guardar el producto en la base de datos: ' + err.message }); 
        }
        console.log('BACKEND: Producto guardado correctamente. ID:', results.insertId); 
        res.json({ success: true, message: 'Producto guardado correctamente en el inventario.' });
    });
});

// Ruta para obtener todos los productos (o filtrados por fecha)
app.get('/api/productos', (req, res) => {
    console.log('BACKEND: Solicitud GET recibida en /api/productos.'); 
    if (!req.session.loggedIn) {
        console.log('API /api/productos: Usuario no autenticado.'); 
        return res.status(401).json({ success: false, message: 'No autorizado. Por favor, inicia sesion.' });
    }

    if (req.session.role !== 'admin') {
        console.log(`API /api/productos: Usuario ${req.session.id_personal} con rol '${req.session.role}'. Acceso a datos denegado.`);
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores pueden ver los registros.' });
    }

    const query = `
        SELECT 
            i.id, i.codigo_de_barras, i.codigo, i.descripcion, i.cantidad, i.fecha, i.precio, i.pasillo,
            u.nombre_usuario AS nombre_usuario_registro, u.id_personal AS id_personal_registro
        FROM inventario i
        LEFT JOIN usuarios u ON i.id_personal_usuario = u.id_personal
        ORDER BY i.fecha DESC
    `; 
    console.log('API /api/productos: Ejecutando consulta con JOIN:', query); 
    db.query(query, (err, results) => {
        if (err) {
            console.error('API /api/productos: Error al obtener productos del inventario:', err); 
            return res.status(500).json({ success: false, message: 'Error al cargar productos del inventario desde la base de datos.' });
        }
        console.log('API /api/productos: Productos obtenidos:', results.length, 'registros.'); 
        if (results.length > 0) {
            console.log('API /api/productos: Ejemplo de producto (primeros 5):', results.slice(0, 5)); 
        }
        res.json(results);
    });
});

// Ruta: Buscar producto por Codigo de Barras para autocompletar
app.get('/api/productos/barcode/:barcode', (req, res) => {
    console.log('BACKEND AUTOCOMPLETE: Solicitud GET recibida para buscar por codigo de barras.');
    if (!req.session.loggedIn) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }

    const barcode = req.params.barcode;
    console.log('BACKEND AUTOCOMPLETE: Buscando producto con codigo de barras:', barcode);

    const query = 'SELECT codigo_de_barras, codigo, descripcion, cantidad, fecha, precio, pasillo FROM inventario WHERE codigo_de_barras = ? LIMIT 1';
    db.query(query, [barcode], (err, results) => {
        if (err) {
            console.error('BACKEND AUTOCOMPLETE: Error al buscar producto por codigo de barras:', err);
            return res.status(500).json({ success: false, message: 'Error al buscar producto.' });
        }

        if (results.length > 0) {
            console.log('BACKEND AUTOCOMPLETE: Producto encontrado:', results[0]);
            res.json({ success: true, product: results[0] });
        } else {
            console.log('BACKEND AUTOCOMPLETE: Producto no encontrado para codigo de barras:', barcode);
            res.json({ success: false, message: 'Producto no encontrado.' });
        }
    });
});

// Ruta: Obtener sugerencias de descripcion
app.get('/api/productos/sugerencias-descripcion', (req, res) => {
    console.log('BACKEND SUGERENCIAS: Solicitud GET recibida para sugerencias de descripcion.');
    if (!req.session.loggedIn) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }

    const queryTerm = req.query.q || ''; 
    console.log('BACKEND SUGERENCIAS: Buscando sugerencias para:', queryTerm);

    const query = `
        SELECT DISTINCT descripcion 
        FROM inventario 
        WHERE descripcion LIKE ? 
        ORDER BY descripcion 
        LIMIT 10
    `;
    db.query(query, [`%${queryTerm}%`], (err, results) => {
        if (err) {
            console.error('BACKEND SUGERENCIAS: Error al obtener sugerencias de descripcion:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener sugerencias.' });
        }

        const suggestions = results.map(row => row.descripcion);
        console.log('BACKEND SUGERENCIAS: Sugerencias encontradas:', suggestions);
        res.json({ success: true, suggestions: suggestions });
    });
});

// Ruta: Buscar producto por Descripcion para autocompletar
app.get('/api/productos/description/:description', (req, res) => {
    console.log('BACKEND AUTOCOMPLETE (DESC): Solicitud GET recibida para buscar por descripcion.');
    if (!req.session.loggedIn) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }

    const description = req.params.description;
    console.log('BACKEND AUTOCOMPLETE (DESC): Buscando producto con descripcion:', description);

    const query = `
        SELECT codigo_de_barras, codigo, cantidad, fecha, precio, pasillo 
        FROM inventario 
        WHERE descripcion = ? 
        ORDER BY fecha DESC 
        LIMIT 1
    `;
    db.query(query, [description], (err, results) => {
        if (err) {
            console.error('BACKEND AUTOCOMPLETE (DESC): Error al buscar producto por descripcion:', err);
            return res.status(500).json({ success: false, message: 'Error al buscar producto por descripcion.' });
        }

        if (results.length > 0) {
            console.log('BACKEND AUTOCOMPLETE (DESC): Producto encontrado por descripcion:', results[0]);
            res.json({ success: true, product: results[0] });
        } else {
            console.log('BACKEND AUTOCOMPLETE (DESC): Producto no encontrado para descripcion:', description);
            res.json({ success: false, message: 'Producto no encontrado.' });
        }
    });
});

// Ruta: Para guardar una averia
app.post('/guardar-averia', (req, res) => {
    console.log('BACKEND AVERIA: Solicitud POST recibida en /guardar-averia.');

    if (!req.session.loggedIn) {
        console.log('BACKEND AVERIA: Usuario no autenticado para guardar averia. Denegando acceso.');
        return res.status(401).json({ success: false, message: 'No autorizado. Por favor, inicia sesion para reportar averias.' });
    }

    const { codigo_de_barras, descripcion_averia, fecha_averia, estado } = req.body;
    const reportado_por_id_personal = req.session.id_personal; // Obtener el ID personal del usuario de la sesion

    console.log('BACKEND AVERIA: Datos de la averia recibidos:', { codigo_de_barras, descripcion_averia, fecha_averia, estado, reportado_por_id_personal });

    if (!codigo_de_barras || !descripcion_averia || !fecha_averia || !estado || !reportado_por_id_personal) {
        console.log('BACKEND AVERIA: Faltan campos obligatorios para la averia.');
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para reportar la averia.' });
    }

    const query = `
        INSERT INTO averias (codigo_de_barras, descripcion_averia, fecha_averia, estado, reportado_por_id_personal)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [
        codigo_de_barras,
        descripcion_averia,
        fecha_averia,
        estado,
        reportado_por_id_personal
    ], (err, results) => {
        if (err) {
            console.error('BACKEND AVERIA: Error al insertar la averia en la base de datos:', err);
            console.error('BACKEND AVERIA: Detalles del error de MySQL:', err.message);
            return res.status(500).json({ success: false, message: 'Error al guardar la averia en la base de datos: ' + err.message });
        }
        console.log('BACKEND AVERIA: Averia guardada correctamente. ID:', results.insertId);
        res.json({ success: true, message: 'Averia reportada correctamente.' });
    });
});


// Rutas de Edicion/Eliminacion
app.delete('/api/productos/:id', (req, res) => {
    if (!req.session.loggedIn || req.session.role !== 'admin') {
        console.log(`Acceso a DELETE /api/productos: Usuario ${req.session.id_personal} con rol '${req.session.role}'. Acceso denegado.`);
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores pueden eliminar productos.' });
    }
    const productId = req.params.id;
    const query = 'DELETE FROM inventario WHERE id = ?';
    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).json({ success: false, message: 'Error al eliminar el producto.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        res.json({ success: true, message: 'Producto eliminado exitosamente.' });
    });
});

app.patch('/api/productos/:id', (req, res) => {
    if (!req.session.loggedIn || req.session.role !== 'admin') {
        console.log(`Acceso a PATCH /api/productos: Usuario ${req.session.id_personal} con rol '${req.session.role}'. Acceso denegado.`);
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores pueden actualizar productos.' });
    }
    const productId = req.params.id;
    const { codigo_de_barras, codigo, descripcion, cantidad, fecha, precio, pasillo } = req.body;
    const query = `
        UPDATE inventario
        SET codigo_de_barras = ?, codigo = ?, descripcion = ?, cantidad = ?, fecha = ?, precio = ?, pasillo = ?
        WHERE id = ?
    `;
    db.query(query, [codigo_de_barras, codigo, descripcion, cantidad, fecha, precio, pasillo, productId], (err, results) => {
        if (err) {
            console.error('Error al actualizar producto:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar el producto.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado para actualizar.' });
        }
        res.json({ success: true, message: 'Producto actualizado exitosamente.' });
    });
});

// Ruta de exportacion a XLSX (con o sin filtro de fecha) (¡CORREGIDA!)
app.get('/exportar-productos-xlsx', async (req, res) => { 
    if (!req.session.loggedIn || req.session.role !== 'admin') {
        console.log(`Acceso a /exportar-productos-xlsx: Usuario ${req.session.id_personal} con rol '${req.session.role}'. Acceso denegado.`);
        return res.status(403).send('No autorizado para exportar productos. Solo administradores pueden exportar.');
    }

    const { fechaInicio, fechaFin } = req.query; 
    console.log(`BACKEND EXPORTAR: Recibido fechaInicio: ${fechaInicio}, fechaFin: ${fechaFin}`);

    let query = `
        SELECT 
            i.codigo_de_barras, i.codigo, i.descripcion, i.cantidad, i.fecha, i.precio, i.pasillo,
            u.nombre_usuario AS usuario_que_registro
        FROM inventario i
        LEFT JOIN usuarios u ON i.id_personal_usuario = u.id_personal
    `;
    const queryParams = [];
    const conditions = [];

    if (fechaInicio) {
        conditions.push('DATE(i.fecha) >= ?'); 
        queryParams.push(fechaInicio);
    }
    if (fechaFin) {
        conditions.push('DATE(i.fecha) <= ?'); 
        queryParams.push(fechaFin);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY i.fecha DESC'; 
    console.log('BACKEND EXPORTAR: Consulta SQL generada:', query);
    console.log('BACKEND EXPORTAR: Parametros de consulta:', queryParams);

    try {
        db.query(query, queryParams, async (err, results) => { 
            if (err) {
                console.error('Error al exportar productos desde la DB con filtro de fecha:', err);
                return res.status(500).send('Error interno del servidor al exportar datos con filtro: ' + err.message);
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Productos');

            worksheet.columns = [
                { header: 'Codigo de Barras', key: 'codigo_de_barras', width: 20 },
                { header: 'Codigo', key: 'codigo', width: 15 },
                { header: 'Descripcion', key: 'descripcion', width: 30 },
                { header: 'Cantidad', key: 'cantidad', width: 10 },
                { header: 'Fecha', key: 'fecha', width: 15, style: { numFmt: 'dd/mm/yyyy' } }, 
                { header: 'Precio', key: 'precio', width: 15, style: { numFmt: '0.00' } }, 
                { header: 'Pasillo', key: 'pasillo', width: 15 },
                { header: 'Usuario que Registro', key: 'usuario_que_registro', width: 25 } 
            ];

            if (results.length > 0) {
                results.forEach(row => {
                    const formattedRow = {
                        ...row,
                        fecha: row.fecha ? new Date(row.fecha) : null 
                    };
                    worksheet.addRow(formattedRow);
                });
            }

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' } 
                };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            let filename = 'productos_inventario.xlsx';
            if (fechaInicio || fechaFin) {
                filename = `productos_inventario_${fechaInicio || 'inicio'}_${fechaFin || 'fin'}.xlsx`;
            }
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            await workbook.xlsx.write(res);
            res.end(); 
            console.log('BACKEND EXPORTAR: Archivo XLSX enviado con exito.');
        });
    } catch (error) {
        console.error('Error en la ruta /exportar-productos-xlsx:', error);
        res.status(500).send('Error interno del servidor al exportar datos XLSX.');
    }
});

// NUEVA RUTA: Generar y descargar un archivo XLSX con productos masivos
app.get('/generar-productos-masivos', async (req, res) => {
    console.log('BACKEND MASIVO: Solicitud GET recibida para generar productos masivos.');

    if (!req.session.loggedIn || req.session.role !== 'admin') {
        console.log('BACKEND MASIVO: Usuario no autenticado o no es admin para generar productos masivos. Denegando acceso.');
        return res.status(403).send('No autorizado. Solo administradores pueden generar productos masivos.');
    }

    const numProducts = 30000; 
    const products = [];
    const startDate = new Date(2023, 0, 1); 
    const endDate = new Date(); 

    console.log(`BACKEND MASIVO: Generando ${numProducts} productos...`);

    for (let i = 1; i <= numProducts; i++) {
        const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        
        products.push({
            codigo_de_barras: `BAR${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            codigo: `COD${i}`,
            descripcion: `Producto de Prueba ${i}`,
            cantidad: Math.floor(Math.random() * 1000) + 1,
            fecha: randomDate.toISOString().split('T')[0], 
            precio: (Math.random() * 500 + 10).toFixed(2),
            pasillo: String.fromCharCode(65 + Math.floor(Math.random() * 5)) + Math.floor(Math.random() * 20 + 1)
        });
    }
    console.log(`BACKEND MASIVO: ${numProducts} productos generados en memoria.`); 

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos Masivos');

    worksheet.columns = [
        { header: 'Codigo de Barras', key: 'codigo_de_barras', width: 20 },
        { header: 'Codigo', key: 'codigo', width: 15 },
        { header: 'Descripcion', key: 'descripcion', width: 30 },
        { header: 'Cantidad', key: 'cantidad', width: 10 },
        { header: 'Fecha', key: 'fecha', width: 15, style: { numFmt: 'yyyy-mm-dd' } }, 
        { header: 'Precio', key: 'precio', width: 15, style: { numFmt: '0.00' } }, 
        { header: 'Pasillo', key: 'pasillo', width: 15 }
    ];

    worksheet.addRows(products);
    console.log('BACKEND MASIVO: Productos anadidos a la hoja de calculo.');

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' } 
        };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="productos_masivos.xlsx"');
    
    console.log('BACKEND MASIVO: Cabeceras de respuesta configuradas. Iniciando descarga.');

    await workbook.xlsx.write(res);
    res.end();
    console.log('BACKEND MASIVO: Archivo XLSX masivo enviado y respuesta finalizada.');
});


// Ruta para cerrar sesion
app.get('/logout', (req, res) => {
    req.session.destroy(err => { 
        if (err) {
            console.error('Error al cerrar sesion:', err);
            return res.status(500).json({ success: false, message: 'Error al cerrar sesion.' });
        }
        res.clearCookie('connect.sid'); 
        res.json({ success: true, message: 'Sesion cerrada exitosamente.' }); 
    });
});


// --- 4. Iniciar el servidor ---
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});