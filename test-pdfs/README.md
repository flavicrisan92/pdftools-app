# Test PDFs

Fisiere PDF pentru testarea functionalitatilor aplicatiei.

## Regenerare

```bash
node test-pdfs/generate-test-pdfs.mjs
```

## Fisiere disponibile

### MERGE (Combinare PDF-uri)

| Fisier | Pagini | Descriere |
|--------|--------|-----------|
| `merge-doc1.pdf` | 2 | Document 1 - Introduction |
| `merge-doc2.pdf` | 3 | Document 2 - Main Content |
| `merge-doc3.pdf` | 1 | Document 3 - Conclusion |

**Test:** Incarca toate 3 si combina-le intr-un singur PDF.

### SPLIT (Extragere pagini)

| Fisier | Pagini | Descriere |
|--------|--------|-----------|
| `split-multipage.pdf` | 10 | Document cu multe pagini |
| `split-5pages.pdf` | 5 | Document cu 5 pagini |

**Test:** Extrage paginile 2-4 sau 1,3,5 din document.

### COMPRESS (Compresie)

| Fisier | Pagini | Dimensiune |
|--------|--------|------------|
| `compress-large.pdf` | 20 | ~16 KB |
| `compress-medium.pdf` | 10 | ~8 KB |

**Test:** Comprima fisierul si verifica diferenta de dimensiune.

### CONVERT (PDF to Image)

| Fisier | Pagini | Descriere |
|--------|--------|-----------|
| `convert-single.pdf` | 1 | O singura pagina |
| `convert-multi.pdf` | 4 | Mai multe pagini |

**Test:** Converteste in PNG/JPEG si verifica calitatea.

---

*Generat automat cu `generate-test-pdfs.mjs`*
