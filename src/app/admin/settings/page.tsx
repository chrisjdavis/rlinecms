'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { NavigationForm, NavigationItem } from './NavigationForm'
import { RebuildButton } from './RebuildButton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SiteSettingsForm } from './SiteSettingsForm'
import { LocationSettingsForm } from './LocationSettingsForm'
import { AISettingsForm } from './AISettingsForm'
import { AnalyticsSettingsForm } from './AnalyticsSettingsForm'
import { AutomationsForm } from './AutomationsForm'
import { ThemeSelector } from './ThemeSelector'
import { section } from '@/components/theme/admin'
import type { Page } from '@/types/theme'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('site')
  const [settings, setSettings] = useState<{
    id: string
    title: string
    description: string | null
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    analyticsSnippet?: string | null
    aiKey?: string | null
    easycronApiKey?: string | null
    easycronEnabled?: boolean
    easycronWebhookUrl?: string | null
  } | null>(null)
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, navRes, pagesRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/navigation'),
          fetch('/api/admin/pages')
        ])
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          setSettings(settingsData)
        }
        
        if (navRes.ok) {
          const navData = await navRes.json()
          setNavigationItems(navData)
        }
        
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json()
          setPages(pagesData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!searchParams) return
    
    const tab = searchParams.get('tab')
    
    if (tab && tab !== 'cron-jobs') {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin/settings?tab=${value}`)
  }

  const handleSaveNavigation = async (items: NavigationItem[]) => {
    try {
      const response = await fetch('/api/admin/navigation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(items),
      })

      if (response.ok) {
        // Refresh navigation data
        const navRes = await fetch('/api/admin/navigation')
        if (navRes.ok) {
          const navData = await navRes.json()
          setNavigationItems(navData)
        }
      }
    } catch (error) {
      console.error('Error saving navigation:', error)
    }
  }



  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className={section({ spacing: 'lg' })}>
        <TabsList className="mb-6">
          <TabsTrigger value="site">Site</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="nav">Nav Menus</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai">AI Setup</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
        </TabsList>
        <TabsContent value="site">
          <div className={section({ spacing: 'lg' })}>
            <div className="mb-6">
              <ThemeSelector />
            </div>
            <RebuildButton />
            <SiteSettingsForm settings={settings || {
              id: 'new',
              title: '',
              description: null
            }} />
          </div>
        </TabsContent>
        <TabsContent value="location">
          <div className={section({ spacing: 'lg' })}>
            <LocationSettingsForm settings={
              settings
                ? {
                    id: settings.id,
                    location: settings.location ?? null,
                    latitude: settings.latitude ?? null,
                    longitude: settings.longitude ?? null,
                  }
                : {
                    id: 'new',
                    location: null,
                    latitude: null,
                    longitude: null,
                  }
            } />
          </div>
        </TabsContent>
        <TabsContent value="nav">
          <div className={section({ spacing: 'lg' })}>
            <NavigationForm 
              items={navigationItems} 
              pages={pages}
              onSave={handleSaveNavigation} 
            />
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <div className={section({ spacing: 'lg' })}>
            <AnalyticsSettingsForm settings={settings || {
              id: 'new',
              analyticsSnippet: null
            }} />
          </div>
        </TabsContent>
        <TabsContent value="ai">
          <div className={section({ spacing: 'lg' })}>
            <AISettingsForm settings={settings || { id: 'new', aiKey: '' }} />
          </div>
        </TabsContent>
        <TabsContent value="automations">
          <div className={section({ spacing: 'lg' })}>
            <AutomationsForm settings={settings || { 
              id: 'new', 
              easycronApiKey: null, 
              easycronEnabled: false, 
              easycronWebhookUrl: null 
            }} />
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
} 