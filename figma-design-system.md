# Figma Design System - Betting Application

## 📋 Project Overview
Complete Figma design system for your betting application with mobile-first responsive design.

## 🎨 Design Tokens

### Color Palette
**Primary Colors:**
- Primary 50: #eff6ff
- Primary 100: #dbeafe  
- Primary 200: #bfdbfe
- Primary 300: #93c5fd
- Primary 400: #60a5fa
- Primary 500: #3b82f6
- Primary 600: #2563eb
- Primary 700: #1d4ed8
- Primary 800: #1e40af
- Primary 900: #1e3a8a

**Semantic Colors:**
- Success 50: #ecfdf5 → Success 600: #059669
- Warning 50: #fffbeb → Warning 600: #d97706
- Error 50: #fef2f2 → Error 600: #dc2626
- Gray 50: #f9fafb → Gray 900: #111827

### Typography Scale
**Font Family:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

**Mobile Sizes:**
- xs: 12px, sm: 14px, base: 16px
- lg: 18px, xl: 20px, 2xl: 24px, 3xl: 30px

**Desktop Sizes:**
- 4xl: 36px (increased from 3xl)

### Spacing System
- xs: 4px, sm: 8px, md: 16px
- lg: 24px, xl: 32px, 2xl: 48px

### Border Radius
- sm: 2px, md: 6px, lg: 8px
- xl: 12px, 2xl: 16px

## 📱 Mobile Components

### Bottom Navigation Bar
**Frame:** 375x83px (iPhone 14)
**Background:** #FFFFFF with 0.95 blur
**Border:** 1px #E5E7EB top border
**Icons:** 24x24px, active color #2563EB, inactive #6B7280
**Labels:** 10px font size

### Game Cards
**Frame:** 343x120px (full width mobile)
**Background:** #FFFFFF with 8px radius
**Shadow:** 0 4px 6px -1px rgba(0,0,0,0.1)
**Padding:** 16px all sides
**Game Icon:** 32x32px emoji
**Multiplier Badge:** 44x28px with gradient background

### Betting Controls
**Quick Bet Buttons:** 44x44px minimum
**Custom Input:** 44px height with 6px radius
**CTA Buttons:** Full width, 44px height, gradient background

## 🖥️ Desktop Components

### Hero Section
**Layout:** 1440x600px
**Background:** Gradient from #1e293b → #7c3aed → #1e293b
**Headline:** 48px/56px bold, white text
**Subheadline:** 20px/28px, #d1d5db
**CTA Buttons:** 160x48px with hover states

### Feature Grid
**Layout:** 3-4 column grid on desktop
**Cards:** 280x200px with 12px radius
**Icons:** 32x32px with gradient backgrounds
**Spacing:** 32px between cards

### Game Preview Section
**Layout:** 3 column grid on desktop
**Cards:** 360x200px with hover effects
**Images:** 360x160px with 8px top radius
**Content:** 40px bottom section

## 🎯 Interactive States

### Button States
**Default:** Gradient background, white text
**Hover:** Darker gradient, shadow-lg
**Active:** Scale(0.98) transform
**Disabled:** 50% opacity, cursor-not-allowed

### Navigation States
**Active:** #2563EB color with subtle background
**Inactive:** #6B7280 color
**Hover:** #374151 color transition

### Card Hover States
**Default:** shadow-md
**Hover:** shadow-lg with 2px y-offset
**Transition:** 300ms ease-in-out

## 📊 Admin Dashboard Components

### Stats Cards
**Layout:** 4-column grid on desktop
**Cards:** 240x120px with gradient backgrounds
**Numbers:** 32px bold, white text
**Labels:** 14px, #9ca3af

### Data Tables
**Header:** 48px height, #f9fafb background
**Rows:** 64px height, alternating backgrounds
**Actions:** 32x32px icon buttons
**Pagination:** 44px height controls

## 🎮 Game Interface Components

### Game Selection
**Cards:** 160x120px with game previews
**Hover State:** Scale(1.05) with shadow
**Active State:** 2px #2563EB border

### Betting Interface
**Balance Display:** 120x48px with gradient
**Bet Input:** 200x44px with number controls
**Quick Buttons:** 60x44px with percentage labels

### Game Results
**Modal:** 320x240px centered
**Background:** #FFFFFF with 12px radius
**Animation:** Fade in with scale effect

## 🔄 Animations & Transitions

### Micro-interactions
**Fade In:** 300ms opacity + translateY
**Scale:** 200ms ease-in-out
**Slide:** 250ms ease-out
**Pulse:** 2s infinite for loading states

### Loading States
**Shimmer:** 2s linear gradient animation
**Spinner:** 1s rotate animation
**Skeleton:** 16px radius placeholders

## 📱 Responsive Breakpoints

### Mobile: 320px - 768px
- Single column layout
- Bottom navigation
- Full-width buttons
- 16px horizontal padding

### Tablet: 768px - 1024px
- 2-column grid for cards
- Side navigation appears
- 24px horizontal padding
- Larger touch targets

### Desktop: 1024px+
- Multi-column layouts
- Hover states enabled
- 32px horizontal padding
- Enhanced animations

## 🎨 Figma File Structure

### Pages
1. **Cover Page** - Project overview
2. **Design Tokens** - Colors, typography, spacing
3. **Mobile Components** - All mobile-first components
4. **Desktop Components** - Desktop-optimized layouts
5. **Game Interfaces** - All game screens
6. **Admin Dashboard** - Management interfaces
7. **User Flows** - Complete user journeys
8. **Responsive Examples** - Breakpoint demonstrations
h
### Components
- **Atoms:** Buttons, inputs, icons, typography
- **Molecules:** Cards, navigation items, form groups
- **Organisms:** Headers, footers, game interfaces
- **Templates:** Page layouts, responsive grids
- **Pages:** Complete screen designs

## 🚀 Implementation Notes

### Export Settings
- **Icons:** 24x24px SVG
- **Images:** 2x resolution for retina
- **Spacing:** 8px grid system
- **Colors:** Hex codes with alpha transparency

### Accessibility
- **Color Contrast:** WCAG 2.1 AA compliant
- **Touch Targets:** 44x44px minimum
- **Focus Indicators:** 2px outline offset
- **Screen Reader:** Proper labeling

## 📋 Figma Setup Instructions

1. **Create new Figma file** named "Betting App Design System"
2. **Set up color styles** using provided hex codes
3. **Create text styles** for all typography scales
4. **Build component library** starting with atoms
5. **Create auto-layout frames** for responsive behavior
6. **Add interactive components** with all states
7. **Create prototype flows** for user testing
8. **Share for development** with inspect mode enabled

This design system provides everything needed to create a professional Figma file that matches your implemented betting application design.
