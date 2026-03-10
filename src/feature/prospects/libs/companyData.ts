import { useCompaniesStore } from "@/feature/companies/stores/useCompaniesStore";

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
export const companyOptions = getCompanyOptions();
