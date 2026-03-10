"use client";
import React, { Children, cloneElement, isValidElement, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: "parent" | "child";
  route?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  children,
  onClick,
  variant = "parent",
  route,
}) => {
  const hasChildren = Boolean(children);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
    const pathname = usePathname(); 


  const handleClick = () => {
    if (hasChildren) {
      setIsOpen((prev) => !prev);
    } else if (route) {
      router.push(route);
    } else if (onClick) {
      onClick();
    }
  };
  const isActive = route && pathname === route;

  // Ensure image-based icons turn white when active. Lucide icons already follow currentColor.
  const renderedIcon = (() => {
    if (!icon || !isValidElement(icon)) return icon;

    // Determine if the provided icon is an <img> and add filter when active
    const isImgTag = (icon as React.ReactElement).type === 'img';
    if (isImgTag) {
      const imgEl = icon as React.ReactElement<{ className?: string }>;
      const existing = imgEl.props?.className ?? '';
      const activeFilter = isActive ? ' brightness-0 invert' : '';
      return cloneElement(imgEl, {
        className: `${existing}${activeFilter}`.trim(),
      });
    }
    return icon;
  })();

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex cursor-pointer items-center justify-between ${
          variant === "child" ? "w-[191px] h-[28px] pl-2" : "w-full h-[32px] p-2"
        } gap-2 rounded-md ${
          variant === "child" ? "leading-[16px] text-xs" : "leading-[20px] text-sm"
        } font-normal transition-colors ${
          isActive
            ? "bg-[var(--foreground)] text-white"
            : "text-[var(--foreground)] hover:bg-gray-100"
        }`}
        aria-expanded={hasChildren ? isOpen : undefined}
      >
        <span className="flex items-center gap-2 w-full">
          {renderedIcon}
          <span>{label}</span>
        </span>
        {hasChildren && (
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="ml-4 mt-1 overflow-hidden flex flex-col gap-1 border-l border-[var(--border-gray)] pl-3">
          {Children.map(children, (child) => {
            if (isValidElement(child)) {
              return cloneElement(child as React.ReactElement<SidebarItemProps>, {
                variant: "child",
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
