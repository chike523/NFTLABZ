"use client"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFormInputProps {
  label: string
  type: "text" | "email" | "password"
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

export default function AuthFormInput({
  label,
  type,
  placeholder,
  value,
  onChange,
  required = false,
  className
}: AuthFormInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const getIcon = () => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5 text-muted-foreground" />
      case "password":
        return <Lock className="h-5 w-5 text-muted-foreground" />
      default:
        return <User className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getInputType = () => {
    if (type === "password") {
      return showPassword ? "text" : "password"
    }
    return type
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getIcon()}
        </div>
        
        <input
          type={getInputType()}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={cn(
            "w-full pl-10 pr-10 py-3 border border-border rounded-lg",
            "bg-card text-foreground placeholder-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "transition-all duration-200",
            isFocused && "ring-2 ring-ring border-transparent"
          )}
        />
        
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            ) : (
              <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
