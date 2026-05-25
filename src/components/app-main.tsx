'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { DashboardPage } from '@/components/pages/dashboard-page'
import { WriterPage } from '@/components/pages/writer-page'
import { ChatPage } from '@/components/pages/chat-page'
import { ImagePage } from '@/components/pages/image-page'
import { CodePage } from '@/components/pages/code-page'
import { ArticleWizardPage } from '@/components/pages/article-wizard-page'
import { SmartEditorPage } from '@/components/pages/smart-editor-page'
import { RewriterPage } from '@/components/pages/rewriter-page'
import { AiVisionPage } from '@/components/pages/ai-vision-page'
import { FileChatPage } from '@/components/pages/file-chat-page'
import { WebChatPage } from '@/components/pages/web-chat-page'
import { SpeechToTextPage } from '@/components/pages/speech-to-text-page'
import { TextToSpeechPage } from '@/components/pages/text-to-speech-page'
import { DocumentsPage } from '@/components/pages/documents-page'
import { PricingPage } from '@/components/pages/pricing-page'
import { SettingsPage } from '@/components/pages/settings-page'
import { AdminPage } from '@/components/pages/admin-page'
import { useAppStore, type Page } from '@/lib/store'

const pageComponents: Record<Page, React.ComponentType> = {
  dashboard: DashboardPage,
  writer: WriterPage,
  'article-wizard': ArticleWizardPage,
  'smart-editor': SmartEditorPage,
  rewriter: RewriterPage,
  chat: ChatPage,
  image: ImagePage,
  code: CodePage,
  'ai-vision': AiVisionPage,
  'file-chat': FileChatPage,
  'web-chat': WebChatPage,
  'speech-to-text': SpeechToTextPage,
  'text-to-speech': TextToSpeechPage,
  documents: DocumentsPage,
  pricing: PricingPage,
  settings: SettingsPage,
  admin: AdminPage,
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function AppMain() {
  const { activePage } = useAppStore()
  const PageComponent = pageComponents[activePage] || DashboardPage

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
