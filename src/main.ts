// src/main.ts
import { Plugin, TFile, TFolder } from "obsidian";

export default class MdxHeadingIndexer extends Plugin {
  async onload() {
    

    this.app.workspace.onLayoutReady(() => {
      try {
        // @ts-ignore
        const markdownExtensions = this.app.vault.getMarkdownExtensions();
        if (!markdownExtensions.includes("mdx")) {
          this.registerExtensions(["mdx"], "markdown");
        }
      } catch (_) {
        console.warn("Skipping extension registration check; assuming 'mdx' is already registered.");
      }
    });

    await this.indexAllMdxFiles();

    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (file instanceof TFile && file.extension === "mdx") {
          await this.indexMdxFile(file);
        }
      })
    );

    this.registerDomEvent(document, "click", async (evt: MouseEvent) => {
      const target = evt.target as HTMLElement;
      

      const linkEl = target.closest("a[href*='#']") as HTMLElement;
      

      if (!linkEl) return;

      const rawHref = linkEl.getAttribute("data-href") ?? linkEl.getAttribute("href");
      
      
      

      const match = rawHref?.match(/^([^#]+?)(?:\.mdx)?#(.+)$/) || rawHref?.match(/^#(.+)$/);
      

      evt.preventDefault();
      let heading: string | undefined;
      let fileName: string | undefined;

      if (match) {
        heading = decodeURIComponent(match[2] ?? match[1]);
        fileName = match[2] ? match[1] : this.app.workspace.getActiveFile()?.name.replace(/\.mdx$/, "");
      } else {
        heading = linkEl.textContent?.trim();
        fileName = this.app.workspace.getActiveFile()?.name.replace(/\.mdx$/, "");
      }

      if (!fileName || !heading) return;

      const targetPath = `${fileName}.mdx`;
const targetFile = this.app.vault.getFiles().find(f => f.path.endsWith(targetPath));
if (!targetFile) {
  
  return;
}


const leaf = this.app.workspace.getLeaf(false);
await leaf.openFile(targetFile);
const editor = this.app.workspace.activeEditor?.editor;
if (editor) {
  const lines = editor.getValue().split("\n");
  const targetLine = lines.findIndex(line => line.trim().startsWith("#") && line.includes(heading));
  if (targetLine !== -1) {
    editor.setCursor({ line: targetLine, ch: 0 });
    editor.scrollIntoView({ from: { line: targetLine, ch: 0 }, to: { line: targetLine + 1, ch: 0 } }, true);
    
  } else {
    
  }
}
    });
  }

  async indexAllMdxFiles() {
    const mdxFiles = this.app.vault.getFiles().filter((f) => f.extension === "mdx");
    for (const file of mdxFiles) {
      await this.indexMdxFile(file);
    }
  }

  async indexMdxFile(file: TFile) {
    const cacheDir = ".obsidian/mdx-cache";
    const safePath = file.path.split("/").join("__");
    const cacheFilePath = `${cacheDir}/${safePath}.md`;

    try {
      const content = await this.app.vault.read(file);
      const headings = this.extractHeadings(content);

      const outContent = headings.map((h) => `${"#".repeat(h.level)} ${h.text}`).join("\n");

      try {
        const folder = this.app.vault.getAbstractFileByPath(cacheDir);
        if (!folder) {
          await this.app.vault.createFolder(cacheDir);
        } else if (!(folder instanceof TFolder)) {
          
          return;
        }
      } catch (e) {
        if (!String(e).includes("Folder already exists")) throw e;
      }

      const existing = this.app.vault.getAbstractFileByPath(cacheFilePath);
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, outContent);
      } else {
        try {
          await this.app.vault.create(cacheFilePath, outContent);
        } catch (e) {
          if (!String(e).includes("File already exists")) throw e;
          
        }
      }

    } catch (e) {
      console.error("[mdx-heading-indexer] Failed to index:", file.path, e);
    }
  }

  extractHeadings(content: string): { text: string; level: number }[] {
    const lines = content.split("\n");
    const headings = [];
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.*)/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
        });
      }
    }
    return headings;
  }
}
