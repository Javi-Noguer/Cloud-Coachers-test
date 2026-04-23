# Cloud Coachers - Salesforce Developer Technical Test

## Descripción

Este repositorio contiene la solución al ejercicio práctico de Salesforce Developer propuesto por Cloud Coachers.

El objetivo del desarrollo es mostrar, en la página de detalle de una **Account**, un listado personalizado de los **Contact** asociados, incorporando funcionalidades de gestión directa desde el propio componente.

## Funcionalidades implementadas

### Requisitos obligatorios

- Componente personalizado en la página de detalle de **Account**.
- Visualización de los contactos asociados a la cuenta.
- Ordenación por nombre del contacto.
- Edición de contactos desde el propio listado.
- Eliminación de contactos desde el propio listado.
- Visualización de los campos:
    - Nombre
    - Teléfono
    - Email
    - Role
- Creación de nuevos contactos desde el propio listado.
- Asociación automática del nuevo contacto a la cuenta actual.
- Refresco automático del listado tras crear, editar o eliminar un contacto.

### Funcionalidades opcionales

- Buscador de contactos dentro del listado.
- Configuración de campos visibles desde **Lightning App Builder** mediante una propiedad del componente (`fieldsToDisplay`), sin modificar código.


## Decisiones técnicas

La solución se ha implementado con:

- **LWC (Lightning Web Components)** para la interfaz.
- **Apex** para recuperar los contactos de la cuenta.
- **lightning-datatable** para mostrar los registros.
- **lightning-record-edit-form** para crear y editar contactos mediante modal.
- **refreshApex** para refrescar automáticamente el listado.

### Consideración sobre el campo "Role"

En el enunciado se solicita mostrar el campo **Role** del contacto.  
En esta implementación se ha utilizado el campo estándar **`Title`** como aproximación funcional a ese requerimiento, mostrándolo en la columna "Role".
La evolución natural sería sustituirlo por un campo Role__c si el cliente confirmase que necesita un rol de negocio específico.
## Estructura del proyecto

```text
force-app/main/default/
  classes/
    AccountContactController.cls
    AccountContactController.cls-meta.xml
  lwc/
    accountContactsList/
      accountContactsList.html
      accountContactsList.js
      accountContactsList.js-meta.xml