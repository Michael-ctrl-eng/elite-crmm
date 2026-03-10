export async function validateCompany(idCompany: string): Promise<boolean> {
    try {
        const res = await fetch(`/api/admin/companies/${idCompany}`, {
            method: "GET",
            cache: "no-store"
        });

        return res.ok; // 200 → ok, 404 → false
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function validateOwner(idUser: string): Promise<boolean> {
    try {
        const res = await fetch(`/api/admin/users/${idUser}`, {
            method: "GET",
            cache: "no-store"
        });
        return res.ok; // 200 → ok, 404 → false
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function validateContact(idContact: string): Promise<boolean> {
    try {
        const res = await fetch(`/api/admin/contacts/${idContact}`, {
            method: "GET",
            cache: "no-store",
        });

        return res.ok; // 200 → ok, 404 → false
    } catch (e) {
        console.error(e);
        return false;
    }
}
