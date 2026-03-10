import { Contact } from "../types/types";

export const prospectsData: Contact[] = [
  {
    id: '1',
    name: 'Sophie Lambert',
    company: 'Groupe Orion',
    email: 'sophie@orion.fr',
    phone: '+33 6 12 34 56 78',
    owner: 'Claire Brunet',
    ownerAvatar: 'https://i.pravatar.cc/32?img=1',
    status: 'New',
    lastContact: 'Aug 15 - Call',
    tags: 'Contract, High Priority',
  },
  {
    id: '2',
    name: 'Marc Lefebvre',
    company: 'AEC Partners',
    email: 'marc.lefeb@aec.com',
    phone: '+1 415 889 3321',
    owner: 'Claire Brunet',
    ownerAvatar: 'https://i.pravatar.cc/32?img=2',
    status: 'Warm Lead',
    lastContact: 'Jul 30 - Email',
    tags: 'SaaS, New Prospect',
  },
  {
    id: '3',  // even if data is duplicated, id must be unique
    name: 'Marc Lefebvre',
    company: 'AEC Partners',
    email: 'marc.lefeb@aec.com',
    phone: '+1 415 889 3321',
    owner: 'Claire Brunet',
    ownerAvatar: 'https://i.pravatar.cc/32?img=2',
    status: 'Cold',
    lastContact: 'Jul 30 - Email',
    tags: 'SaaS, New Prospect',
  },
  {
    id: '4',  // even if data is duplicated, id must be unique
    name: 'Marc Lefebvre',
    company: 'AEC Partners',
    email: 'marc.lefeb@aec.com',
    phone: '+1 415 889 3321',
    owner: 'Claire Brunet',
    ownerAvatar: 'https://i.pravatar.cc/32?img=2',
    status: 'Qualified',
    lastContact: 'Jul 30 - Email',
    tags: 'SaaS, New Prospect',
  },
  {
    id: '5',  // even if data is duplicated, id must be unique
    name: 'Marc Lefebvre',
    company: 'AEC Partners',
    email: 'marc.lefeb@aec.com',
    phone: '+1 415 889 3321',
    owner: 'Claire Brunet',
    ownerAvatar: 'https://i.pravatar.cc/32?img=2',
    status: 'Converted',
    lastContact: 'Jul 30 - Email',
    tags: 'SaaS, New Prospect',
  },
  {
    id: '6',  // even if data is duplicated, id must be unique
    name: 'Marc Lefebvre',
    company: 'AEC Partners',
    email: 'marc.lefeb@aec.com',
    phone: '+1 415 889 3321',
    owner: 'Claire Brunet',
    ownerAvatar: 'https://i.pravatar.cc/32?img=2',
    status: 'Not Interested',
    lastContact: 'Jul 30 - Email',
    tags: 'SaaS, New Prospect',
  },
 
];
