"use client"
import {Plus} from "lucide-react"
import {DropDown} from "../../../components/ui/DropDown"
import {useState, useRef, useEffect} from "react"
import {useRouter} from "next/navigation"
import {useCustomerModalStore} from "@/feature/customers/stores/useCustomersModel"
import {useMeetingModalStore} from "@/feature/meetings/stores/meetingModelStore"
import {useDealModalStore} from "@/feature/deals/stores/dealsModelStore"
import {useTaskModalStore} from "@/feature/todo/stores/taskModelStore"
import {useProspectModelStore} from "@/feature/prospects/stores/prospectModelStore";

const userOptions = [
    {value: "all", label: "All Users"},
    {value: "active", label: "Active Users"},
    {value: "inactive", label: "Inactive Users"},
]


const timePeriodOptions = [
    {value: "this_week", label: "This Week"},
    {value: "this_month", label: "This Month"},
    {value: "this_year", label: "This Year"},
]

export function DashboardHeader({
                                    selectedTimePeriod = "this-month",
                                    onTimePeriodChange
                                }: {
    selectedTimePeriod?: string;
    onTimePeriodChange?: (value: string) => void;
}) {
    const [selectedUser, setSelectedUser] = useState("all")
    const [actionLabel, setActionLabel] = useState("New Deal")

    // Handle time period changes
    const handleTimePeriodChange = (value: string) => {
        if (onTimePeriodChange) {
            onTimePeriodChange(value)
        }
    }


    // state for arrow dropdown
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Navigate based on the selected primary action
    const handlePrimaryAction = (label?: string) => {
        const currentLabel = label ?? actionLabel;
        switch (currentLabel) {
            case "New Deal":
                useDealModalStore.getState().openModal("add");
                break
            case "New Task":
                useTaskModalStore.getState().openModal("add");
                break
            case "New Meeting":
                useMeetingModalStore.getState().openModal("add");
                break
            case "New Contact":
                useCustomerModalStore.getState().openModal("add");
                break
            case "New Prospect":
                useProspectModelStore.getState().openModal("add");
                break
            default:
                break
        }
    }

    return (
        <header>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 sm:h-9">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <DropDown
                        options={timePeriodOptions}
                        value={selectedTimePeriod}
                        onChange={handleTimePeriodChange}
                    />
                    <DropDown options={userOptions} value={selectedUser} onChange={setSelectedUser}/>
                </div>

                {/* New Deal + Arrow */}
                <div
                    className="relative flex min-w-[140px] sm:min-w-[155px] h-9 border border-[var(--border-gray)] rounded-lg bg-white shadow-sm"
                    ref={menuRef}>
                    <button onClick={() => handlePrimaryAction()}
                            className="flex items-center gap-1.5 justify-center px-3 sm:px-4 hover:bg-gray-50 transition-colors whitespace-nowrap">
                        <Plus size={16} className="text-[var(--foreground)]"/>
                        <span className="text-xs sm:text-sm text-[var(--foreground)] tracking-[0%]">{actionLabel}</span>
                    </button>

                    <div className="w-px h-full bg-gray-300"></div>

                    <button
                        onClick={() => setMenuOpen((prev) => !prev)}
                        className="px-2 sm:px-3 hover:bg-gray-50 rounded-r-lg transition-colors"
                    >
                        <img src="/icons/Down-Arrow.svg" alt="" className="w-[14px] sm:w-[16px] h-[15px] sm:h-[17px]"/>
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen && (
                        <div
                            className="absolute w-[180px] sm:w-[224px] right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md z-20">
                            {["New Task", "New Meeting", "New Contact", "New Deal", "New Prospect"]
                                .filter((item) => item !== actionLabel)
                                .map((item) => (
                                    <button
                                        key={item}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                        onClick={() => {
                                            setActionLabel(item)
                                            setMenuOpen(false)
                                            handlePrimaryAction(item)
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
