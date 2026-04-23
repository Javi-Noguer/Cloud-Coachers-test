import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getContacts from '@salesforce/apex/AccountContactController.getContacts';

const COLUMNS = [
    { label: 'Nombre', fieldName: 'Name', type: 'text', sortable: true },
    { label: 'Teléfono', fieldName: 'Phone', type: 'phone' },
    { label: 'Email', fieldName: 'Email', type: 'email' },
    { label: 'Role', fieldName: 'Title', type: 'text' },
    {
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: 'Editar', name: 'edit' },
                { label: 'Eliminar', name: 'delete' }
            ]
        }
    }
];

export default class AccountContactsList extends NavigationMixin(LightningElement) {
    @api recordId;

    columns = COLUMNS;
    contacts = [];
    error;
    sortedBy = 'Name';
    sortDirection = 'asc';
    wiredContactsResult;
    isModalOpen = false;

    @wire(getContacts, { accountId: '$recordId' })
    wiredContacts(result) {
        this.wiredContactsResult = result;

        const { error, data } = result;
        if (data) {
            this.contacts = [...data];
            this.error = undefined;
            this.sortData(this.sortedBy, this.sortDirection);
        } else if (error) {
            this.contacts = [];
            this.error = error;
        }
    }

    handleNewContact() {
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        fields.AccountId = this.recordId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    async handleSuccess() {
        this.isModalOpen = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Contacto creado',
                message: 'El contacto se ha creado correctamente.',
                variant: 'success'
            })
        );

        await refreshApex(this.wiredContactsResult);
    }

    handleError() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'No se pudo crear el contacto.',
                variant: 'error'
            })
        );
    }

    handleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        this.sortedBy = sortedBy;
        this.sortDirection = sortDirection;
        this.sortData(sortedBy, sortDirection);
    }

    sortData(fieldName, direction) {
        const cloneData = [...this.contacts];

        cloneData.sort((a, b) => {
            const valueA = a[fieldName] ? a[fieldName].toLowerCase() : '';
            const valueB = b[fieldName] ? b[fieldName].toLowerCase() : '';

            if (valueA > valueB) {
                return direction === 'asc' ? 1 : -1;
            }
            if (valueA < valueB) {
                return direction === 'asc' ? -1 : 1;
            }
            return 0;
        });

        this.contacts = cloneData;
    }

    async handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'edit') {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id,
                    objectApiName: 'Contact',
                    actionName: 'edit'
                }
            });
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

    get hasData() {
        return this.contacts.length > 0;
    }

    get hasError() {
        return !!this.error;
    }

    get isEmpty() {
        return !this.hasError && this.contacts.length === 0;
    }
}