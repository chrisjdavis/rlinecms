import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { auth } from "@/lib/auth"
import { uploadToS3 } from "@/lib/s3"

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Validate file type using magic bytes
function validateFileType(buffer: Buffer, filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return false
  }
  
  // Basic magic byte validation
  const header = buffer.slice(0, 4)
  const headerHex = header.toString('hex')
  
  // JPEG
  if (headerHex.startsWith('ffd8')) return true
  // PNG
  if (headerHex.startsWith('89504e47')) return true
  // GIF
  if (headerHex.startsWith('47494638')) return true
  // WebP
  if (headerHex.startsWith('52494646')) return true
  // SVG (text file, check for SVG tag)
  if (ext === 'svg') {
    const content = buffer.toString('utf8', 0, 100)
    return content.includes('<svg')
  }
  
  return false
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only images are allowed." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase()
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate file content using magic bytes
    if (!validateFileType(buffer, filename)) {
      return NextResponse.json(
        { message: "Invalid file content. File appears to be corrupted or not an image." },
        { status: 400 }
      )
    }

    let url: string

    if (process.env.NODE_ENV === "production") {
      // Upload to Digital Ocean Spaces in production
      url = await uploadToS3(buffer, filename, file.type)
    } else {
      // Save to local filesystem in development
      const uploadDir = join(process.cwd(), "public", "uploads")
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch {
        // Directory might already exist, ignore error
      }

      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      url = `/uploads/${filename}`
    }

    return NextResponse.json({ url })

  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
} 