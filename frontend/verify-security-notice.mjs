import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const frontendRoot = path.dirname(fileURLToPath(import.meta.url))
const i18nRoot = path.join(frontendRoot, 'src/i18n')
const registration = fs.readFileSync(path.join(i18nRoot, 'index.ts'), 'utf8')
const languages = [...registration.matchAll(/from ['"]\.\/locales\/([^'"]+)['"]/g)]
  .map((match) => match[1])
assert.ok(languages.length > 0, 'No registered languages found')
assert.equal(new Set(languages).size, languages.length, 'Duplicate language imports')

for (const language of languages) {
  const filename = path.join(i18nRoot, 'locales', `${language}.ts`)
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true)
  const exported = source.statements.find(ts.isExportAssignment)
  assert.ok(exported && ts.isObjectLiteralExpression(exported.expression), `${language}: missing translation object`)
  const security = exported.expression.properties.find((property) =>
    ts.isPropertyAssignment(property) && property.name.getText(source) === 'security')
  assert.ok(security && ts.isObjectLiteralExpression(security.initializer), `${language}: missing security messages`)
  const messages = {}
  for (const property of security.initializer.properties) {
    assert.ok(ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer), `${language}: expected literal message`)
    const key = property.name.getText(source)
    assert.equal(messages[key], undefined, `${language}: duplicate ${key}`)
    messages[key] = property.initializer.text
    assert.ok(messages[key].trim().length > 0, `${language}: empty ${key}`)
    assert.ok(!messages[key].includes('\uFFFD'), `${language}: invalid text encoding`)
  }
  assert.deepEqual(Object.keys(messages).sort(), ['description', 'title'], `${language}: inconsistent security keys`)
}

console.log(`PASS: risk notice title and description are present in all ${languages.length} registered languages`)
