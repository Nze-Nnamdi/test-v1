const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

// Load .env
const envPath = path.join(__dirname, "..", ".env")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error("Error listing buckets:", listError.message)
    process.exit(1)
  }

  const existingBucket = buckets.find((b) => b.name === "voices")
  if (existingBucket) {
    console.log('Bucket "voices" already exists')
  } else {
    const { error: createError } = await supabase.storage.createBucket("voices", {
      public: true,
    })
    if (createError) {
      console.error("Error creating bucket:", createError.message)
      process.exit(1)
    }
    console.log('Bucket "voices" created successfully')
  }
}

main()
