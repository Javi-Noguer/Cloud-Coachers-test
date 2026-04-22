import { LightningElement, api, wire } from 'lwc';
import getContacts from '@salesforce/apex/AccountContactController.getContacts';

const COLUMNS = [
    { label: 'Nombre', fieldName: 'Name', type: 'text', sortable: true },
    { label: 'Teléfono', fieldName: 'Phone', type: 'phone' },
    { label: 'Email', fieldName: 'Email', type: 'email' },
    { label: 'Role', fieldName: 'Title', type: 'text' }
];

export default class AccountContactsList extends LightningElement {
    @api recordId;

    columns = COLUMNS;
    contacts = [];
    error;

    @wire(getContacts, { accountId: '$recordId' })
    wiredContacts({ error, data }) {
        if (data) {
            this.contacts = data;
            this.error = undefined;
        } else if (error) {
            this.contacts = [];
            this.error = error;
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