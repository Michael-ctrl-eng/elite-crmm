import { useCustomersStore } from '../../customers/stores/useCustomersStore';
import { useCompaniesStore } from '../../companies/stores/useCompaniesStore';

export const getCompanyOptions = () => {
    const { companies } = useCompaniesStore.getState();
    const options = companies.map((company) => ({
        id: company.id,
        value: company.id,
        label: company.fullName || 'Unnamed Company'
    }));

    // Add "Add Company" option
    options.push({
        id: "add-company",
        value: "add-company",
        label: "+ Add Company"
    });

    return options;
};

export const getContactOptions = () => {
    const { customers } = useCustomersStore.getState();
    const options = customers.map((customer) => ({
        id: customer.id,
        value: customer.id,
        label: customer.fullName || 'Unnamed Customer'
    }));

    // Add "Add Contact" option
    options.push({
        id: "add-contact",
        value: "add-contact",
        label: "+ Add Contact"
    });

    return options;
};

// For backward compatibility, export the functions that return the options
export const companyOptions = getCompanyOptions();
export const contactOptions = getContactOptions();