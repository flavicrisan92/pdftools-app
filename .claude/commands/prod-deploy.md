# Production Deploy

Deploy la production cu auto-increment versiune - prin browser pentru transparență.

## Steps

1. **Get latest tag** - ia ultimul tag git
2. **Increment version** - incrementează patch version (ex: v1.0.2 -> v1.0.3)
3. **Create & push tag** - creează tag-ul nou și îl trimite la origin
4. **Open browser** - deschide GitHub Actions în Chrome
5. **Run workflow** - click pe Run workflow, pune tag-ul (acum e required, nu mai e dropdown de environment)
6. **Confirm** - arată user-ului că deploy-ul a pornit

## Workflow Changes

- Staging: se deployează **automat** la push pe master
- Production: se deployează **manual** prin workflow_dispatch cu tag required
- Versiunea (tag-ul) apare în footer pe production

## Important

- Folosește Chrome MCP pentru a rula workflow-ul (NU GitHub CLI)
- User-ul vede tot ce se întâmplă în browser
- Cere confirmare înainte de a crea tag-ul
