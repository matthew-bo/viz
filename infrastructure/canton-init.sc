// Canton 2.7.8 Initialization Script
// Runs automatically via --bootstrap flag
// Creates parties, connects to domain, uploads DAR

println("=== Canton Privacy Demo Initialization ===")

// Wait for nodes to be ready
println("⏳ Waiting for Canton nodes to initialize...")
utils.retry_until_true(30, 1.second) {
  try {
    participant1.health.status().isActive && local.health.status().isActive
  } catch {
    case _: Exception => false
  }
}
println("✓ Canton nodes are ready")

// Connect participant to local domain
println("🔗 Connecting participant to domain...")
try {
  participant1.domains.connect_local(local, "local")
  println("✓ Participant connected to domain")
} catch {
  case e: Exception => {
    println(s"⚠️  Connection may already exist: ${e.getMessage}")
  }
}

// Wait for connection to stabilize
println("⏳ Waiting for connection to stabilize...")
utils.retry_until_true(20, 1.second) {
  try {
    participant1.domains.list_connected().nonEmpty
  } catch {
    case _: Exception => false
  }
}
println("✓ Connection stable")

// Enable parties
println("👥 Creating parties...")
val techBank = participant1.parties.enable("TechBank")
val globalCorp = participant1.parties.enable("GlobalCorp")
val retailFinance = participant1.parties.enable("RetailFinance")

// Print party IDs in format easy to copy
println("")
println("=== PARTY IDs (SAVE THESE TO backend/.env) ===")
println(s"TECHBANK_PARTY_ID=${techBank}")
println(s"GLOBALCORP_PARTY_ID=${globalCorp}")
println(s"RETAILFINANCE_PARTY_ID=${retailFinance}")
println("=== END PARTY IDs ===")
println("")

// Upload DAR
println("📦 Uploading DAR...")
val darPath = "/canton/daml/.daml/dist/payment-demo-0.0.1.dar"
try {
  participant1.dars.upload(darPath)
  println("✓ DAR uploaded successfully")
} catch {
  case e: Exception => {
    println(s"⚠️  DAR upload may have already occurred: ${e.getMessage}")
  }
}

// Verify parties are visible
println("")
println("🔍 Verifying parties...")
val parties = participant1.parties.list()
println(s"✓ Found ${parties.length} parties on participant")
parties.foreach(p => println(s"  - ${p}"))

println("")
println("✨ Canton initialization complete!")
println("Next steps:")
println("  1. Copy the PARTY IDs above to backend/.env")
println("  2. Restart backend: docker compose restart backend")
println("  3. Test: curl http://localhost:3001/health")

