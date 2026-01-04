'use client'

import * as LucideIcons from 'lucide-react'
import { LucideProps } from 'lucide-react'

interface DynamicIconProps extends LucideProps {
    name: string
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
    // Map internal name to Lucide component name
    // Constant names in constants.ts like 'at-sign' need mapping to 'AtSign'
    const componentName = name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') as keyof typeof LucideIcons

    const IconComponent = LucideIcons[componentName] as React.ElementType

    if (!IconComponent) {
        return <LucideIcons.Globe {...props} />
    }

    return <IconComponent {...props} />
}
