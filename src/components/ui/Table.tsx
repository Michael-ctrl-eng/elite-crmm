"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"

export interface TableColumn<T> {
  key: string
  title: string
  dataIndex: keyof T | string
  sortable?: boolean
  render?: (value: any, record: T) => React.ReactNode
  avatar?: {
    srcIndex: string
    altIndex: string
    size?: number
  }
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  selectable?: boolean
  loading?: boolean
  onSelectionChange?: (selectedKeys: string[], selectedRows: T[]) => void
  onRowClick?: (record: T) => void
  className?: string
}

function Table<T extends { id: string | number }>({
  columns,
  data,
  selectable = false,
  loading = false,
  onSelectionChange,
  onRowClick,
  className,
}: TableProps<T>) {
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string | number>>(new Set())
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allKeys = new Set(data.map((item) => item.id))
      setSelectedKeys(allKeys)
      onSelectionChange?.(Array.from(allKeys).map(String), data)
    } else {
      setSelectedKeys(new Set())
      onSelectionChange?.([], [])
    }
  }

  const handleSelectItem = (id: string | number) => {
    const newSelected = new Set(selectedKeys)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedKeys(newSelected)
    const selectedRows = data.filter((item) => newSelected.has(item.id))
    onSelectionChange?.(Array.from(newSelected).map(String), selectedRows)
  }

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T]
      const bValue = b[sortConfig.key as keyof T]
      if (aValue === undefined || bValue === undefined || aValue === null || bValue === null) return 0
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  return (
    <div className={cn("relative w-full overflow-auto border border-gray-200 rounded-xl", className)}>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
          <tr>
            {selectable && (
              <th className="px-4 py-4 w-12">
                <input
                  type="checkbox"
                  className="size-4 rounded border-gray-300 text-black focus:ring-black"
                  onChange={handleSelectAll}
                  checked={data.length > 0 && selectedKeys.size === data.length}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-4 font-semibold tracking-wider",
                  column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors"
                )}
                onClick={() => {
                  if (column.sortable) {
                    setSortConfig({
                      key: column.key,
                      direction: sortConfig?.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                    })
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  {column.title}
                  {column.sortable && (
                    <span className="text-gray-400">
                      {sortConfig?.key === column.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '⇅'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium tracking-tight">Updating table...</span>
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">No records found</span>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((record) => (
              <tr
                key={record.id}
                className={cn(
                  "bg-white hover:bg-gray-50/80 transition-all duration-200",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(record)}
              >
                {selectable && (
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="size-4 rounded border-gray-300 text-black focus:ring-black"
                      checked={selectedKeys.has(record.id)}
                      onChange={() => handleSelectItem(record.id)}
                    />
                  </td>
                )}
                {columns.map((column) => {
                  const value = record[column.dataIndex as keyof T]
                  return (
                    <td key={column.key} className="px-4 py-3.5 text-gray-600">
                      <div className="flex items-center gap-3">
                        {column.avatar && (
                          <Avatar className="size-8 ring-1 ring-gray-100">
                            <AvatarImage src={String(record[column.avatar.srcIndex as keyof T] || '')} alt={String(record[column.avatar.altIndex as keyof T] || 'User')} />
                            <AvatarFallback className="bg-gray-100 text-[10px] font-bold text-gray-600">
                              {String(record[column.avatar.altIndex as keyof T] || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="truncate max-w-[200px]">
                          {column.render ? column.render(value, record) : String(value || '-')}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// Keep primitive components for shadcn compatibility if needed, but export the main Table
const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => <thead className={cn("[&_tr]:border-b", className)} {...props} />
const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
const TableFooter = ({ className, ...props }: React.ComponentProps<"tfoot">) => <tfoot className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)} {...props} />
const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => <tr className={cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)} {...props} />
const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => <th className={cn("text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)} {...props} />
const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => <td className={cn("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)} {...props} />
const TableCaption = ({ className, ...props }: React.ComponentProps<"caption">) => <caption className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
