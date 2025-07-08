# Obsidian MDX Heading Indexer

[English](README.md) | [日本語](README.ja.md)

## English

### Overview
This plugin enables heading link suggestions and jump-to-heading support for `.mdx` files in Obsidian. It allows you to use `[[filename.mdx#heading]]` syntax to link to specific headings within MDX files.

### Features
- **MDX Support**: Treats `.mdx` files as markdown for Obsidian's internal linking system
- **Heading Indexing**: Automatically extracts and indexes headings from MDX files
- **Link Navigation**: Click on `[[filename.mdx#heading]]` links to jump directly to headings
- **Auto-sync**: Automatically re-indexes MDX files when they are modified

### Installation
1. Download the latest release
2. Extract the files to your Obsidian plugins folder: `{vault}/.obsidian/plugins/obsidian-mdx-heading-indexer/`
3. Enable the plugin in Obsidian Settings > Community Plugins

### Usage
1. Create or edit `.mdx` files in your vault
2. Use standard markdown heading syntax (`# Heading`, `## Subheading`, etc.)
3. Link to headings using `[[filename.mdx#heading]]` syntax
4. The plugin will automatically index headings and enable navigation

### Development
```bash
npm run install-deps  # Install dependencies
npm run dev           # Build in watch mode
npm run build         # Build for production
```

### How It Works
- Registers `.mdx` files as markdown extensions
- Creates cached heading indexes in `.obsidian/mdx-cache/`
- Monitors file changes to keep indexes updated
- Intercepts link clicks to handle MDX heading navigation