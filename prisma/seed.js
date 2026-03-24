import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    console.error(
      'Seed requires SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (used only to create the initial admin).'
    )
    console.error('Alternatively create an admin with: npm run create-admin -- <email> <password>')
    process.exit(1)
  }

  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Admin'
  const password = await hash(adminPassword, 12)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password,
      role: "ADMIN",
    },
  })

  console.log('Admin user created:', { id: admin.id, email: admin.email, role: admin.role })

  // Create default theme directory
  const themePath = path.join(process.cwd(), 'public/themes/default')
  await fs.mkdir(themePath, { recursive: true })
  await fs.mkdir(path.join(themePath, 'templates'), { recursive: true })

  // Create theme.json
  const themeConfig = {
    name: 'Default',
    description: 'A clean and modern theme for your website',
    version: '1.0.0',
    author: 'RLine CMS',
    styles: {
      colors: {
        primary: '#0070f3',
        secondary: '#7928ca',
        background: '#ffffff',
        foreground: '#000000',
        muted: '#666666'
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '16px',
        lineHeight: '1.5'
      }
    }
  }
  await fs.writeFile(
    path.join(themePath, 'theme.json'),
    JSON.stringify(themeConfig, null, 2)
  )

  // Create styles.css
  const styles = `
:root {
  --color-primary: #0070f3;
  --color-secondary: #7928ca;
  --color-background: #ffffff;
  --color-foreground: #000000;
  --color-muted: #666666;
  
  --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-size: 16px;
  --line-height: 1.5;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: var(--line-height);
  color: var(--color-foreground);
  background-color: var(--color-background);
  margin: 0;
  padding: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.posts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.post {
  border: 1px solid #eee;
  padding: 1.5rem;
  border-radius: 8px;
}

.content {
  line-height: 1.8;
}`
  await fs.writeFile(path.join(themePath, 'styles.css'), styles)

  // Create template files
  const templates = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ site.title }}</title>
  <link rel="stylesheet" href="/themes/default/styles.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>{{ site.title }}</h1>
      <p>{{ site.description }}</p>
    </header>
    
    <main>
      <h2>Latest Posts</h2>
      <div class="posts">
        {% for post in posts %}
        <article class="post">
          <h3><a href="/posts/{{ post.slug }}">{{ post.title }}</a></h3>
          <p>{{ post.excerpt }}</p>
          <small>By {{ post.author.name }} on {{ post.createdAt | date }}</small>
        </article>
        {% endfor %}
      </div>
    </main>
    
    <footer>
      <p>&copy; {{ "now" | date: "%Y" }} {{ site.title }}</p>
    </footer>
  </div>
</body>
</html>`,
    'post.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ post.title }} - {{ site.title }}</title>
  <link rel="stylesheet" href="/themes/default/styles.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>{{ post.title }}</h1>
      <p>By {{ post.author.name }} on {{ post.createdAt | date }}</p>
    </header>
    
    <main class="content">
      {{ post.content }}
    </main>
    
    <footer>
      <p>&copy; {{ "now" | date: "%Y" }} {{ site.title }}</p>
    </footer>
  </div>
</body>
</html>`,
    'page.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ page.title }} - {{ site.title }}</title>
  <link rel="stylesheet" href="/themes/default/styles.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>{{ page.title }}</h1>
    </header>
    
    <main class="content">
      {{ page.content }}
    </main>
    
    <footer>
      <p>&copy; {{ "now" | date: "%Y" }} {{ site.title }}</p>
    </footer>
  </div>
</body>
</html>`
  }

  for (const [filename, content] of Object.entries(templates)) {
    await fs.writeFile(path.join(themePath, 'templates', filename), content)
  }

  // Create theme record in database
  const defaultTheme = await prisma.theme.create({
    data: {
      name: 'Default',
      description: 'A clean and modern theme for your website',
      version: '1.0.0',
      author: 'RLine CMS',
      isActive: true,
      themePath: '/themes/default',
      authorId: admin.id
    }
  })

  console.log('Default theme created:', defaultTheme)

  // Create default blocks
  const defaultBlocks = await Promise.all([
    prisma.block.create({
      data: {
        type: 'text',
        content: {
          text: 'Welcome to your new website!',
          format: 'markdown'
        },
        order: 0
      }
    }),
    prisma.block.create({
      data: {
        type: 'image',
        content: {
          url: '/images/placeholder.jpg',
          alt: 'Placeholder image',
          caption: 'A beautiful placeholder image'
        },
        order: 1
      }
    }),
    prisma.block.create({
      data: {
        type: 'code',
        content: {
          language: 'javascript',
          code: 'console.log("Hello, world!");'
        },
        order: 2
      }
    })
  ])

  console.log('Default blocks created:', defaultBlocks)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 