# Draggable Windows - React SPA

A beautiful single-page React application featuring draggable windows with modern UI design.

## 🚀 Features

- **Draggable Windows**: Click and drag windows around the screen
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Beautiful Backgrounds**: Animated gradient backgrounds with glassmorphism effects
- **Responsive Design**: Works on desktop and mobile devices
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Lucide React** - Icon library

## 🎨 Design Features

- **Main Background**: Dynamic gradient with animated floating orbs
- **Window Background**: Contrasting gradient with glassmorphism effects
- **Smooth Animations**: CSS transitions and animations
- **Modern Glass Effect**: Backdrop blur and transparency

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser and visit:** `http://localhost:5173`

## 📦 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── DraggableWindow.tsx  # Main draggable window component
├── hooks/
│   └── useDraggable.ts  # Custom hook for drag functionality
├── App.tsx              # Main application component
└── index.css           # Global styles with Tailwind
```

## 🎮 Usage

- **Add Window**: Click the "Add Window" button to create new draggable windows
- **Drag Windows**: Click and hold the title bar to drag windows around
- **Close Windows**: Click the X button in the top-right corner of any window
- **Window Controls**: Minimize and maximize buttons (functionality can be extended)

## 🎨 Customization

The application is highly customizable:

- **Colors**: Modify the gradient colors in `App.tsx` and `DraggableWindow.tsx`
- **Animations**: Adjust animation timing in `tailwind.config.js`
- **Window Content**: Customize the content passed to `DraggableWindow` components
- **Styling**: Extend the Tailwind configuration for additional design tokens

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📝 License

This project is open source and available under the [MIT License](LICENSE).