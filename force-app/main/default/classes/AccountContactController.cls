public with sharing class AccountContactController {
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId) {
        if (accountId == null) {
            return new List<Contact>();
        }

        return [
                SELECT Id, Name, Phone, Email, Title
                FROM Contact
                WHERE AccountId = :accountId
                ORDER BY Name ASC
        ];
    }
}