Actúa como un Arquitecto de Software Senior y Frontend Lead.

OBJETIVO:
Crear una "Aplicación Web de Gestión de Pacientes" tipo PWA, responsive, para uso en PC, Tablet y Celular. El foco es optimizar rutas de visitas domiciliarias.

STACK TECNICO SUGERIDO:
Frontend: React + Vite + TailwindCSS + Shadcn/ui
Backend: Node.js + Express
Base de Datos: PostgreSQL o Supabase
Mapas: Google Maps API + Directions API
Extra: xlsx para importar Excel, whatsapp-web.js para exportar a WhatsApp

MODULOS Y FUNCIONALIDADES PRINCIPALES:

1.  GESTION DE DATOS DE PACIENTES - CRUD
    Tabla principal 100% editable con teclado y tactil.
    Columnas configurables por el usuario. Ejemplo de columnas por defecto:
    [ ] Fila
    [ ] Apellido y Nombre
    [ ] Direccion
    [ ] Obra Social: PAMI, Otras
    [ ] Abona: Checkbox Si/No con X
    [ ] Determinaciones de Laboratorio: Texto
    [ ] Monto Pagado: $
    [ ] Cobro Semanal: $ Calculado
    [ ] Cobro Mensual: $ Calculado
    [ ] Notas
    Requisitos: Fuente tamaño 24 configurable, arrastrar y soltar filas/columnas, ordenar, filtrar, buscar.

2.  IMPORTACION/EXPORTACION DE DATOS
    Importar: Subir archivo .xlsx/.csv y mapear columnas a los campos de la app.
    Exportar: Exportar la tabla actual a .xlsx
    Integracion: Boton "Enviar por WhatsApp" que tome los pacientes seleccionados y genere un mensaje con sus datos + link de ubicacion.

3.  MODULO DE RUTEO INTELIGENTE CON GOOGLE MAPS
    Seleccion: Poder seleccionar 1, varios o "Todos" los pacientes desde la tabla con checkboxes.
    Generacion Automatica: Al hacer click en "Generar Recorrido", la app debe tomar las direcciones de los seleccionados y llamar a Google Maps Directions API para optimizar la ruta con el menor tiempo/distancia.
    Visualizacion: Mostrar la ruta en un mapa, con marcadores numerados del orden de visita.
    Reordenamiento: Permitir reordenar la ruta arrastrando los puntos en la lista y que el mapa se actualice.

4.  UI/UX - INTERFAZ FLOTANTE Y MOVIL
    Tabla Dinamica: La tabla debe ser "mobile-first". Deslizamiento horizontal, y congelar las primeras 2 columnas.
    Panel Flotante: Al hacer "Click" o "Mantener presionado" sobre 1 o mas filas, debe aparecer una pestaña/panel flotante lateral o modal que muestre todos los datos detallados de los pacientes seleccionados.
    Botones de Accion Rapida: Botones flotantes para: Añadir Paciente, Modificar, Eliminar, Generar Ruta, Sumatoria por Obra Social.
    Dashboard: Tarjetas que muestren: Sumatoria total de montos pagados por cada Obra Social, Total Cobro Semanal, Total Cobro Mensual.

5.  ESCALABILIDAD Y BASE DE DATOS
    La app debe conectarse a una BD para persistir todos los datos.
    Arquitectura pensada para escalar: añadir modulo de usuarios, login, roles, historial de visitas, facturacion, etc a futuro.

REGLAS DE ESTILO:
Diseño limpio, estetico, profesional, con modo claro/oscuro. Usar colores #F7F4EE fondo y #1C2B39 primario.
Todo debe funcionar offline basico con Service Worker.

ENTREGABLE:
Dame el codigo base completo con: Estructura de carpetas, componentes de la tabla, conexion a Supabase, y la logica para generar la ruta con Google Maps.
