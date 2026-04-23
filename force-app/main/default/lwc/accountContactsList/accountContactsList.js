import { LightningElement, api, wire } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getContacts from '@salesforce/apex/AccountContactController.getContacts';

const FIELD_CONFIG = {
    Name: { label: 'Nombre', fieldName: 'Name', type: 'text', sortable: true },
    Phone: { label: 'Teléfono', fieldName: 'Phone', type: 'phone' },
    Email: { label: 'Email', fieldName: 'Email', type: 'email' },
    Title: { label: 'Role', fieldName: 'Title', type: 'text' }
};

const ACTION_COLUMN = {
    type: 'action',
    typeAttributes: {
        rowActions: [
            { label: 'Editar', name: 'edit' },
            { label: 'Eliminar', name: 'delete' }
        ]
    }
};

export default class AccountContactsList extends LightningElement {
    @api recordId;

    _fieldsToDisplay = 'Name,Phone,Email,Title';

    @api
    get fieldsToDisplay() {
        return this._fieldsToDisplay;
    }

    set fieldsToDisplay(value) {
        this._fieldsToDisplay = value || 'Name,Phone,Email,Title';
        this.columns = this.buildColumns();
        this.ensureValidSortField();
        this.applyFiltersAndSort();
    }

    columns = [];
    contacts = [];
    allContacts = [];
    error;
    sortedBy = 'Name';
    sortDirection = 'asc';
    wiredContactsResult;
    isModalOpen = false;
    editRecordId = null;
    searchKey = '';

    connectedCallback() {
        this.columns = this.buildColumns();
        this.ensureValidSortField();
    }

    @wire(getContacts, { accountId: '$recordId' })
    wiredContacts(result) {
        this.wiredContactsResult = result;

        const { error, data } = result;
        if (data) {
            this.allContacts = [...data];
            this.error = undefined;
            this.applyFiltersAndSort();
        } else if (error) {
            this.contacts = [];
            this.allContacts = [];
            this.error = error;
        }
    }

    getConfiguredFieldNames() {
        const rawFields = (this.fieldsToDisplay || 'Name,Phone,Email,Title')
            .split(',')
            .map((field) => field.trim())
            .filter((field) => !!field);

        const validFields = rawFields.filter((field) => FIELD_CONFIG[field]);

        // Mantengo Name siempre visible para no romper el requisito obligatorio
        // de ordenar por nombre.
        if (!validFields.includes('Name')) {
            validFields.unshift('Name');
        }

        return [...new Set(validFields)];
    }

    buildColumns() {
        const dynamicColumns = this.getConfiguredFieldNames().map((fieldApiName) => ({
            ...FIELD_CONFIG[fieldApiName]
        }));

        return [...dynamicColumns, ACTION_COLUMN];
    }

    ensureValidSortField() {
        const visibleFields = this.getConfiguredFieldNames();
        if (!visibleFields.includes(this.sortedBy)) {
            this.sortedBy = 'Name';
            this.sortDirection = 'asc';
        }
    }

    handleNewContact() {
        this.editRecordId = null;
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.editRecordId = null;
    }

    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;

        if (!this.editRecordId) {
            fields.AccountId = this.recordId;
        }

        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    async handleSuccess() {
        const isEditing = !!this.editRecordId;

        this.isModalOpen = false;
        this.editRecordId = null;

        this.dispatchEvent(
            new ShowToastEvent({
                title: isEditing ? 'Contacto actualizado' : 'Contacto creado',
                message: isEditing
                    ? 'El contacto se ha actualizado correctamente.'
                    : 'El contacto se ha creado correctamente.',
                variant: 'success'
            })
        );

        await refreshApex(this.wiredContactsResult);
    }

    handleError() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: this.editRecordId
                    ? 'No se pudo actualizar el contacto.'
                    : 'No se pudo crear el contacto.',
                variant: 'error'
            })
        );
    }

    handleSearch(event) {
        this.searchKey = event.target.value ? event.target.value.trim().toLowerCase() : '';
        this.applyFiltersAndSort();
    }

    handleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        this.sortedBy = sortedBy;
        this.sortDirection = sortDirection;
        this.applyFiltersAndSort();
    }

    applyFiltersAndSort() {
        let filteredData = [...this.allContacts];

        if (this.searchKey) {
            filteredData = filteredData.filter((contact) => {
                const name = contact.Name ? contact.Name.toLowerCase() : '';
                const phone = contact.Phone ? String(contact.Phone).toLowerCase() : '';
                const email = contact.Email ? contact.Email.toLowerCase() : '';
                const title = contact.Title ? contact.Title.toLowerCase() : '';

                return (
                    name.includes(this.searchKey) ||
                    phone.includes(this.searchKey) ||
                    email.includes(this.searchKey) ||
                    title.includes(this.searchKey)
                );
            });
        }

        filteredData.sort((a, b) => {
            const valueA = a[this.sortedBy] ? String(a[this.sortedBy]).toLowerCase() : '';
            const valueB = b[this.sortedBy] ? String(b[this.sortedBy]).toLowerCase() : '';

            if (valueA > valueB) {
                return this.sortDirection === 'asc' ? 1 : -1;
            }
            if (valueA < valueB) {
                return this.sortDirection === 'asc' ? -1 : 1;
            }
            return 0;
        });

        this.contacts = filteredData;
    }

    async handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'edit') {
            this.editRecordId = row.Id;
            this.isModalOpen = true;
        } else if (actionName === 'delete') {
            try {
                await deleteRecord(row.Id);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Contacto eliminado',
                        message: 'El contacto se ha eliminado correctamente.',
                        variant: 'success'
                    })
                );
                await refreshApex(this.wiredContactsResult);
            } catch (e) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'No se pudo eliminar el contacto.',
                        variant: 'error'
                    })
                );
            }
        }
    }

    get modalTitle() {
        return this.editRecordId ? 'Editar contacto' : 'Nuevo contacto';
    }

    get submitLabel() {
        return this.editRecordId ? 'Guardar cambios' : 'Guardar';
    }

    get hasData() {
        return this.contacts.length > 0;
    }

    get hasError() {
        return !!this.error;
    }

    get isEmpty() {
        return !this.hasError && this.allContacts.length === 0;
    }

    get showNoResults() {
        return !this.hasError && this.allContacts.length > 0 && this.contacts.length === 0 && !!this.searchKey;
    }
}