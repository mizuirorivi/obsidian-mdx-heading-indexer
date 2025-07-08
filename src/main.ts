// src/main.ts
import { Plugin, TFile } from "obsidian";

export default class MdxHeadingIndexer extends Plugin {
  async onload() {
    console.log("MdxHeadingIndexer loaded");

    // 拡張子としてmdxをmarkdown扱いに
    this.registerExtensions(["mdx"], "markdown");

    // 起動時の初期インデックス
    await this.indexAllMdxFiles();

    // ファイル変更監視
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (file instanceof TFile && file.extension === "mdx") {
          await this.indexMdxFile(file);
        }
      })
    );

    // カスタムクリックハンドラ
    this.registerDomEvent(document, "click", async (evt) => {
      const target = evt.target as HTMLElement;
      if (target.tagName === "A" && target.classList.contains("internal-link")) {
        const href = target.getAttribute("href");
        if (!href) return;

        // mdxファイルへの見出しリンクを検出
        const match = href.match(/^([^#]+)\.mdx#(.+)$/);
        if (match) {
          evt.preventDefault();
          const [_, fileName, heading] = match;
          const file = this.app.metadataCache.getFirstLinkpathDest(fileName + ".mdx", "");
          if (!file) return;

          const content = await this.app.vault.read(file);
          const lines = content.split("\n");
          const headingLineIndex = lines.findIndex((line) => line.trim().replace(/^#+\s*/, "") === decodeURIComponent(heading));

          await this.app.workspace.getLeaf().openFile(file);
          if (headingLineIndex !== -1) {
            this.app.workspace.activeEditor?.editor?.setCursor({ line: headingLineIndex, ch: 0 });
          }
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
    const cacheFilePath = `${cacheDir}/${file.basename}.md`;

    try {
      const content = await this.app.vault.read(file);
      const headings = this.extractHeadings(content);

      const outContent = headings.map((h) => `${"#".repeat(h.level)} ${h.text}`).join("\n");

      const folder = this.app.vault.getAbstractFileByPath(cacheDir);
      if (!folder) {
        await this.app.vault.createFolder(cacheDir);
      }

      const existing = this.app.vault.getAbstractFileByPath(cacheFilePath);
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, outContent);
      } else {
        await this.app.vault.create(cacheFilePath, outContent);
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
