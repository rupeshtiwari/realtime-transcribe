# Cost Optimization Guide

## Overview

This app uses OpenAI Assistants API with pre-embedded materials to **dramatically reduce costs** compared to sending materials with every request.

## How It Works

### Before (Expensive):
- Every analysis request sends all materials (100+ files, ~50MB+) to ChatGPT
- Cost: ~$0.15 per 1M input tokens
- Materials sent = ~50,000 tokens per request
- **Cost per analysis: ~$0.0075** (just for materials!)
- With 10 analyses per session = **$0.075 per session just for materials**

### After (Optimized):
- Materials uploaded **once** to OpenAI (one-time cost)
- Materials are embedded/cached in OpenAI's vector store
- Assistant API uses file_search to find relevant materials automatically
- Only relevant parts of materials are retrieved (not entire files)
- **Cost per analysis: ~$0.001-0.002** (90% reduction!)

## Setup Instructions

### 1. Initial Setup (One-Time)

```bash
# Set in .env
AUTO_INIT_ASSISTANT=true
OPENAI_API_KEY=your_key_here
```

When you start the server, it will:
1. Scan `data/Mentoring Materials/` folder
2. Upload all PDF, TXT, MD, DOCX files to OpenAI
3. Create a vector store with embedded materials
4. Create an Assistant with file_search capability
5. Print the ASSISTANT_ID - **save this to .env!**

### 2. Save Assistant ID

After first run, add to `.env`:
```
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
```

This prevents re-uploading materials on every restart.

### 3. Cost Breakdown

**One-Time Setup Cost:**
- File uploads: ~$0.10 per 1M tokens (one-time)
- ~50MB of materials = ~12,500 tokens
- **One-time cost: ~$0.001** (negligible)

**Per-Session Cost:**
- Analysis requests: ~$0.001-0.002 each (uses cached embeddings)
- 10 analyses per session = **~$0.01-0.02 per session**
- **Savings: 90% reduction vs sending materials every time**

## Material Auto-Selection

When you parse an email:
1. Server scans `data/Mentoring Materials/` folder
2. Matches files based on:
   - Role (e.g., "Senior Software Engineer" → matches SDE files)
   - Coaching Type (e.g., "System Design" → matches System Design folder)
   - Keywords in filenames and folder names
3. Returns top 10 matching materials
4. These are automatically selected for the session

## Manual Setup (If Auto-Init Fails)

```bash
# Start server
npm start

# In another terminal, call init endpoint
curl -X POST http://localhost:3000/api/assistant/init
```

## File Support

Supported file types:
- `.pdf` - PDF documents
- `.txt` - Text files
- `.md` - Markdown files
- `.docx` - Word documents

Files are automatically:
- Uploaded to OpenAI
- Embedded in vector store
- Made searchable via file_search

## Monitoring Costs

Check OpenAI dashboard:
- https://platform.openai.com/usage
- Filter by "Assistants API"
- Monitor file storage costs (minimal)

## Best Practices

1. **Keep materials organized** in `data/Mentoring Materials/`
2. **Use descriptive filenames** for better matching
3. **Organize by folder** (System Design, Behavioral, etc.)
4. **Don't duplicate files** - Assistant uses all uploaded files
5. **Update materials** - Re-run init if you add new files

## Troubleshooting

**Assistant not working?**
- Check `.env` has `OPENAI_ASSISTANT_ID`
- Verify materials folder exists
- Check OpenAI API key is valid
- Review server logs for errors

**Materials not matching?**
- Ensure filenames contain keywords (role, type, etc.)
- Check folder structure matches coaching types
- Review `/api/materials/match` endpoint response

**High costs?**
- Verify Assistant API is being used (check server logs)
- Ensure materials aren't being re-uploaded
- Check OpenAI dashboard for actual usage
