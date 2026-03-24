'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AutomationsFormProps {
  settings: {
    id: string
    easycronApiKey?: string | null
    easycronEnabled?: boolean | null
    easycronWebhookUrl?: string | null
  }
}

export function AutomationsForm({ settings }: AutomationsFormProps) {
  const [apiKey, setApiKey] = useState(settings.easycronApiKey || '')
  const [enabled, setEnabled] = useState(settings.easycronEnabled || false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)


  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          easycronApiKey: apiKey,
          easycronEnabled: enabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Automation settings saved successfully')
    } catch (error) {
      toast.error('Failed to save automation settings')
      console.error('Error saving automation settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key first')
      return
    }

    setIsTesting(true)

    try {
      const response = await fetch('/api/admin/automations/easycron/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      })

      if (response.ok) {
        toast.success('EasyCron connection successful!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'EasyCron connection failed')
      }
    } catch (error) {
      toast.error('Failed to test EasyCron connection')
      console.error('Error testing EasyCron connection:', error)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>EasyCron Configuration</CardTitle>
          <CardDescription>
            Configure EasyCron for automated task scheduling and execution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your EasyCron API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://www.easycron.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  EasyCron.com
                </a>
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="enabled">Enable</Label>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              variant="outline"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>


        </CardContent>
      </Card>


    </div>
  )
} 