import React from 'react'
type IconButtonProps = {
  icon: React.ReactNode;
  className?: string;
};


const IconButton = ({ icon, className }: IconButtonProps) => {
    const sizeClasses = className ?? "h-10 w-10";
    return (
        <button className={`${sizeClasses} flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors cursor-pointer`}>
            {icon}
        </button>
    )
}

export default IconButton
