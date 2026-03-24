import { useState } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

export interface Metadata {
  id?: string
  key: string
  value: string | number | boolean | object
  type: string
}

interface MetadataEditorProps {
  metadata: Metadata[]
  onChange: (metadata: Metadata[]) => void
}

export function MetadataEditor({ metadata = [], onChange }: MetadataEditorProps) {
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [newType, setNewType] = useState<string>("string")
  const [showForm, setShowForm] = useState(false)

  const handleAddMetadata = () => {
    if (!newKey.trim()) {
      toast.error("Please enter a key")
      return
    }

    if (metadata.some(m => m.key === newKey.trim())) {
      toast.error("Key already exists")
      return
    }

    let parsedValue: string | number | boolean | object = newValue

    try {
      // Try to parse the value based on the selected type
      switch (newType) {
        case "number":
          parsedValue = Number(newValue)
          if (isNaN(parsedValue)) throw new Error("Invalid number")
          break
        case "boolean":
          parsedValue = newValue.toLowerCase() === "true"
          break
        case "json":
          parsedValue = JSON.parse(newValue)
          break
        default:
          parsedValue = newValue
      }

      const newMetadata = {
        key: newKey.trim(),
        value: parsedValue,
        type: newType
      }

      onChange([...metadata, newMetadata])
      setNewKey("")
      setNewValue("")
      setNewType("string")
      setShowForm(false) // Hide form after adding metadata
    } catch {
      toast.error(`Invalid ${newType} value`)
    }
  }

  const handleRemoveMetadata = (key: string) => {
    onChange(metadata.filter(m => m.key !== key))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddMetadata()
    }
  }

  const toggleForm = () => {
    setShowForm(!showForm)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="block mb-2">Metadata</Label>
        <div className="space-y-2">
          {metadata.filter(item => {
            // First check for null/undefined
            if (item.value === null || item.value === undefined) return false;
            
            // Then check by type
            if (typeof item.value === "string") return item.value.trim() !== "";
            if (typeof item.value === "object") return item.value !== null && Object.keys(item.value).length > 0;
            if (typeof item.value === "number") return true;
            if (typeof item.value === "boolean") return true;
            
            return false;
          }).map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.key}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMetadata(item.key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground break-all">
                  {typeof item.value === "object" 
                    ? JSON.stringify(item.value)
                    : String(item.value)
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!showForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={toggleForm}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Metadata
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <div className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Add New Metadata</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleForm}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meta-key">Key</Label>
            <Input
              id="meta-key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-value">Value</Label>
            <Input
              id="meta-value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter value"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-type">Type</Label>
            <select
              id="meta-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <Button
            type="button"
            onClick={handleAddMetadata}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Metadata
          </Button>
        </div>
      )}
    </div>
  )
} 