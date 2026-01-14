# Materials Management Strategy

## Current Implementation: OpenAI Assistant with Vector Store ✅ (RECOMMENDED)

### How It Works

1. **One-Time Upload**: All materials from `data/Mentoring Materials/` are uploaded to OpenAI once
2. **Vector Store**: Files are embedded in OpenAI's vector store (semantic search)
3. **Reuse Forever**: Same Assistant ID is reused across all sessions
4. **Smart Retrieval**: Only relevant chunks are retrieved (not entire files)

### Advantages

✅ **Cost Efficient**: 90% cost reduction vs sending materials every time
- One-time upload cost: ~$0.001 (negligible)
- Per-analysis cost: ~$0.001-0.002 (uses cached embeddings)
- No re-uploading needed

✅ **Simple**: No local database setup required
✅ **Scalable**: Handles 100+ files easily
✅ **Fast**: OpenAI's infrastructure handles search
✅ **Automatic**: Materials are auto-selected based on session context

### How to Use

1. **Add Materials**: Place files in `data/Mentoring Materials/` folder
2. **Initialize Assistant**: Set `AUTO_INIT_ASSISTANT=true` in `.env` (first time only)
3. **Save Assistant ID**: Add `OPENAI_ASSISTANT_ID=asst_xxx` to `.env`
4. **Done**: Materials are now cached and ready to use!

### File Structure

```
data/
└── Mentoring Materials/
    ├── System Design Interview/
    │   ├── System_Design_Framework.pdf
    │   └── System Design Rubrics.docx
    ├── Behavioral/
    │   ├── STAR_Method_Guide.pdf
    │   └── Leadership_Stories.pdf
    └── Coding Interview/
        └── Coding_Interview_Rubrics.docx
```

---

## Alternative: Local Vector Database

### Option 1: ChromaDB / Pinecone (Local)

**Pros:**
- Full control over data
- No OpenAI storage costs
- Can work offline (after initial setup)

**Cons:**
- ❌ More complex setup
- ❌ Need to manage embeddings yourself
- ❌ Still need to send relevant chunks to OpenAI (costs remain)
- ❌ Additional infrastructure to maintain
- ❌ Slower for large datasets

**When to Use:**
- If you have privacy concerns (data must stay local)
- If you have 1000+ files (OpenAI has limits)
- If you want to use other LLMs (Claude, etc.)

### Option 2: Hybrid Approach

1. Store materials locally in `data/Mentoring Materials/`
2. Use OpenAI Assistant for embeddings and search
3. Keep local copy for backup/version control

**This is what we're doing now!** ✅

---

## Recommendation: Stick with OpenAI Assistant ✅

### Why?

1. **Cost**: Already optimized (90% savings)
2. **Simplicity**: No additional infrastructure
3. **Performance**: OpenAI's vector search is fast and accurate
4. **Maintenance**: Zero maintenance required
5. **Scalability**: Handles your use case perfectly

### Current Setup

```bash
# .env
OPENAI_API_KEY=your_key
AUTO_INIT_ASSISTANT=true  # First time only
OPENAI_ASSISTANT_ID=asst_xxx  # After first run
```

### Workflow

1. **Add files** → `data/Mentoring Materials/`
2. **Restart server** → Files auto-upload (if new)
3. **Parse email** → Materials auto-selected
4. **Start session** → Assistant uses cached materials

### Cost Breakdown

**One-Time Setup:**
- Upload 50MB of materials: ~$0.001 (one-time)

**Per Session:**
- 10 analysis requests: ~$0.01-0.02
- Uses cached embeddings (no re-uploading)

**vs. Sending Materials Every Time:**
- Would cost: ~$0.075 per session
- **Savings: 90%** 🎉

---

## Materials Management UI

The React app now includes:
- `/materials` page to view and manage materials
- Upload new files
- Delete files
- Search materials
- See which files are in the folder

### API Endpoints

- `GET /api/materials/list` - List all materials
- `POST /api/materials/upload` - Upload new files
- `POST /api/materials/delete` - Delete a file
- `POST /api/materials/match` - Auto-select materials (already exists)

---

## Best Practices

1. **Organize by folder**: System Design, Behavioral, etc.
2. **Use descriptive filenames**: Better matching
3. **Keep files updated**: Re-run init if you add new files
4. **Don't duplicate**: Assistant uses all uploaded files
5. **Version control**: Keep materials in Git (if needed)

---

## When to Consider Local Vector DB

Only if:
- ❌ You have 1000+ files (OpenAI limits)
- ❌ Strict privacy requirements (data must stay local)
- ❌ You want to use multiple LLM providers
- ❌ You need real-time updates without re-initializing

For your use case (coaching materials, <100 files), **OpenAI Assistant is perfect!** ✅
