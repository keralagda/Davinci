import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Page =
  | 'dashboard'
  | 'writer'
  | 'article-wizard'
  | 'smart-editor'
  | 'rewriter'
  | 'chat'
  | 'image'
  | 'code'
  | 'ai-vision'
  | 'file-chat'
  | 'web-chat'
  | 'speech-to-text'
  | 'text-to-speech'
  | 'documents'
  | 'pricing'
  | 'settings'
  | 'admin'

interface User {
  id: string
  email: string
  name: string
  role: string
  plan: string
  image?: string
}

interface AppState {
  // Navigation
  activePage: Page
  setActivePage: (page: Page) => void

  // Auth
  user: User | null
  setUser: (user: User | null) => void
  isLoggedIn: boolean

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Writer
  selectedTemplateId: string | null
  setSelectedTemplateId: (id: string | null) => void
  selectedCategoryId: string | null
  setSelectedCategoryId: (id: string | null) => void

  // Chat
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void

  // Theme
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      activePage: 'dashboard' as Page,
      setActivePage: (page: Page) => set({ activePage: page }),

      // Auth
      user: null,
      setUser: (user: User | null) => set({ user, isLoggedIn: !!user }),
      isLoggedIn: false,

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      // Writer
      selectedTemplateId: null,
      setSelectedTemplateId: (id: string | null) =>
        set({ selectedTemplateId: id }),
      selectedCategoryId: null,
      setSelectedCategoryId: (id: string | null) =>
        set({ selectedCategoryId: id }),

      // Chat
      activeConversationId: null,
      setActiveConversationId: (id: string | null) =>
        set({ activeConversationId: id }),

      // Theme
      darkMode: false,
      setDarkMode: (dark: boolean) => set({ darkMode: dark }),
    }),
    {
      name: 'davinci-ai-store',
      partialize: (state) => ({
        activePage: state.activePage,
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        sidebarOpen: state.sidebarOpen,
        selectedTemplateId: state.selectedTemplateId,
        selectedCategoryId: state.selectedCategoryId,
        activeConversationId: state.activeConversationId,
        darkMode: state.darkMode,
      }),
    }
  )
)
