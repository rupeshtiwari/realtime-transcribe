# How to Set Up OpenAI Assistant with Pre-Cached Materials

## Current Status ✅

Your app **already does this automatically!** When you start the server, it:
1. Scans `data/Mentoring Materials/` folder
2. Uploads all materials to OpenAI
3. Creates a vector store
4. Creates an Assistant with file search enabled
5. Caches everything for reuse

## How It Works

### 1. Automatic Initialization

When the server starts, it runs `initializeAssistant()`:

```javascript
// server.js - This runs automatically
async function initializeAssistant() {
  // 1. Scan materials folder
  const materialsPath = path.join(__dirname, "data", "Mentoring Materials");
  
  // 2. Upload all files to OpenAI
  const fileIds = await uploadMaterialsToOpenAI(materialsPath);
  
  // 3. Create vector store
  const vectorStoreId = await createVectorStore(fileIds);
  
  // 4. Create Assistant with file_search
  const assistant = await createAssistant(vectorStoreId);
  
  // 5. Save Assistant ID
  ASSISTANT_ID = assistant.id;
}
```

### 2. What Gets Cached

- ✅ All PDF files
- ✅ All TXT files
- ✅ All MD files
- ✅ All DOCX files
- ✅ Folder structure preserved
- ✅ File metadata

### 3. How It's Used

When you run an analysis:
1. Assistant automatically searches vector store
2. Finds relevant materials based on query
3. Uses only relevant chunks (not all materials)
4. **This is why it's cost-effective!**

## Manual Setup (If Needed)

### Step 1: Check Your .env File

```bash
# .env
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...  # Optional - will be auto-created
AUTO_INIT_ASSISTANT=true      # Set to true for auto-init
```

### Step 2: Start Server

```bash
npm start
```

The server will:
1. Check if `OPENAI_ASSISTANT_ID` exists
2. If not, create new Assistant automatically
3. Log the Assistant ID
4. Save it to `.env` (you need to do this manually)

### Step 3: Save Assistant ID

After first run, you'll see:
```
✅ Assistant created: asst_abc123...
💡 Save this in .env: OPENAI_ASSISTANT_ID=asst_abc123...
```

Copy the ID and add it to `.env`:
```bash
OPENAI_ASSISTANT_ID=asst_abc123...
```

### Step 4: Restart Server

```bash
npm start
```

Now it will use the existing Assistant (no re-upload needed).

## Adding New Materials

### Option 1: Via UI (Recommended)
1. Go to `/materials` page
2. Click "Upload Materials"
3. Select files
4. Files are automatically:
   - Uploaded to folder
   - Uploaded to OpenAI
   - Added to vector store
   - Ready to use!

### Option 2: Manual Upload
1. Add files to `data/Mentoring Materials/` folder
2. Restart server
3. Server will detect new files and upload them

## Verifying Setup

### Check Assistant Status
```bash
# In server logs, you should see:
✅ Assistant initialized: asst_abc123...
✅ Vector store ready with 50 files
```

### Check Materials
Visit: `http://localhost:3000/materials`

You should see all your materials listed.

## Troubleshooting

### Problem: Assistant not initializing
**Solution**: Check `.env` file has `OPENAI_API_KEY`

### Problem: Materials not uploading
**Solution**: 
1. Check `data/Mentoring Materials/` folder exists
2. Check files are supported formats (PDF, TXT, MD, DOCX)
3. Check server logs for errors

### Problem: Assistant ID not saving
**Solution**: Manually add to `.env`:
```bash
OPENAI_ASSISTANT_ID=asst_...
```

## Cost Optimization Tips

### 1. Use gpt-4o-mini (Already Done ✅)
- Cheaper than gpt-4
- Good enough for analysis
- Set in `.env`: `SUGGESTION_MODEL=gpt-4o-mini`

### 2. Limit Analysis Frequency
- Don't run analysis after every message
- Batch multiple requests
- Use debouncing (already implemented)

### 3. Use File Search (Already Done ✅)
- Assistant only uses relevant materials
- Not all materials sent every time
- Automatic relevance detection

### 4. Cache Results (Future Enhancement)
- Store analysis results
- Reuse for similar queries
- Reduce API calls

## Current Cost Breakdown

### Per Session:
- **File upload**: $0 (one-time, already done)
- **Analysis (5-10 calls)**: ~$0.01-0.05
- **Suggestions**: ~$0.001-0.005
- **Total**: ~$0.01-0.05 per session

### Monthly (100 sessions):
- **Materials storage**: $0 (free)
- **Analysis calls**: ~$1-5
- **Total**: ~$1-5/month

## Next Steps

1. ✅ **You're already set up!** - Assistant is auto-initialized
2. ✅ **Materials are cached** - No re-upload needed
3. ✅ **Cost-optimized** - Using file search

**No action needed unless you want to:**
- Add more materials (use `/materials` page)
- Switch to local vector DB (see COST_OPTIMIZATION_GUIDE.md)
- Implement hybrid approach (see COST_OPTIMIZATION_GUIDE.md)

## Questions?

- **Is Assistant working?** Check server logs
- **Are materials cached?** Check `/materials` page
- **Want to save more?** See COST_OPTIMIZATION_GUIDE.md
