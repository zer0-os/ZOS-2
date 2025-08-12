import React from 'react'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  icon?: LucideIcon
  label: string
  onClick?: () => void
  onMouseEnter?: () => void
  isExpanded: boolean
  wrapper?: React.ComponentType<{ children: React.ReactNode }>
  customContent?: React.ReactNode
}

export function SidebarItem({ 
  icon: Icon, 
  label, 
  onClick, 
  onMouseEnter, 
  isExpanded,
  wrapper: Wrapper,
  customContent
}: SidebarItemProps) {
  const content = customContent || (Icon && (
    <Button
      variant="ghost"
      size="icon"
      className="absolute left-3 h-10 w-10"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <Icon className="h-6 w-6" strokeWidth={1} />
    </Button>
  ))

  return (
    <div className="relative group h-10" onMouseEnter={onMouseEnter}>
      {Wrapper ? <Wrapper>{content}</Wrapper> : content}
      <div
        className={`absolute left-16 top-0 h-10 flex items-center pointer-events-none transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
        }`}
      >
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  )
}
