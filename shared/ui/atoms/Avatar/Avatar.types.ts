import { PolymorphicComponentPropWithRef } from '@/utils'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AvatarShape = 'circle' | 'square'

export type AvatarProps<C extends React.ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Avatar size
     * @default 'md'
     */
    size?: AvatarSize
    /**
     * Avatar shape
     * @default 'circle'
     */
    shape?: AvatarShape
    /**
     * Image source URL
     */
    src?: string
    /**
     * Alt text for image
     */
    alt?: string
    /**
     * Fallback text (initials)
     */
    fallback?: string
    /**
     * Status indicator
     */
    status?: 'online' | 'offline' | 'away' | 'busy'
  }
>

