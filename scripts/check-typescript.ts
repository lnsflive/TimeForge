import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const excludedDirectories = new Set([
  '.git', '.local', '.nuxt', '.output', 'node_modules', 'patches', 'playwright-report', 'static', 'test-results',
])
const errors: string[] = []

function inspectTypes(source: string, projectPath: string): void {
  const file = ts.createSourceFile(projectPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  function visit(node: ts.Node): void {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      errors.push(`${projectPath}: untyped escape hatch is not allowed`)
    }
    if (
      ts.isAsExpression(node)
      && ts.isAsExpression(node.expression)
      && node.expression.type.kind === ts.SyntaxKind.UnknownKeyword
    ) {
      errors.push(`${projectPath}: double-cast escape hatch found`)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
}

async function visit(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (excludedDirectories.has(entry.name)) continue
      await visit(path)
      continue
    }

    const projectPath = relative(root, path)
    const extension = extname(path)
    if (['.js', '.mjs', '.cjs'].includes(extension)) {
      errors.push(`${projectPath}: project-owned JavaScript must be TypeScript`)
      continue
    }
    if (extension !== '.vue' && extension !== '.ts') continue

    const source = await readFile(path, 'utf8')
    if (extension === '.vue' && source.includes('<script') && !source.includes('<script setup lang="ts">')) {
      errors.push(`${projectPath}: Vue scripts must use <script setup lang="ts">`)
    }
    if (/\bexport\s+default\s*\{/.test(source) && extension === '.vue') {
      errors.push(`${projectPath}: Options API export found`)
    }
    const script = extension === '.vue'
      ? source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)?.[1] ?? ''
      : source
    inspectTypes(script, projectPath)
  }
}

await visit(root)

if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write('Composition API and TypeScript checks passed.\n')
}
