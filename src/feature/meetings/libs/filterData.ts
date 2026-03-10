export interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

export interface FilterData {
  status: FilterOption[];
  owner: FilterOption[];
  tags: FilterOption[];
}

export const meetingFilterData: FilterData = {
  status: [
    { id: "all", label: "All Status", checked: true },
    { id: "scheduled", label: "Scheduled", checked: false },
    { id: "confirmed", label: "Confirmed", checked: false },
    { id: "cancelled", label: "Cancelled", checked: false },
  ],
  owner: [
    { id: "all", label: "All Owners", checked: true },
  ],
  tags: [
    { id: "all", label: "All Tags", checked: true },
  ],
};
