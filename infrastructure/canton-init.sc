// Canton 2.7.8 Initialization Script
println("=== Canton Privacy Demo Initialization ===")
println("⏳ Waiting for Canton nodes to initialize...")
Thread.sleep(10000)
println("✓ Canton nodes should be ready")

println("🔗 Connecting participant to domain...")
try {
  participant1.domains.connect_local(local)
  println("✓ Participant connected to domain")
} catch {
  case e: Exception => {
    println(s"⚠️  Connection may already exist: ${e.getMessage}")
  }
}

println("⏳ Waiting for connection to stabilize...")
Thread.sleep(5000)
println("✓ Connection stable")

println("👥 Creating parties...")
// Canton 2.7.8 API - parties.enable() returns the PartyId directly
val techBank = participant1.parties.enable("TechBank")
println("✓ TechBank party created")

val globalCorp = participant1.parties.enable("GlobalCorp")
println("✓ GlobalCorp party created")

val retailFinance = participant1.parties.enable("RetailFinance")
println("✓ RetailFinance party created")

println("")
println("=== PARTY IDs (COPY THESE EXACTLY) ===")
println("TECHBANK_PARTY_ID=" + techBank)
println("GLOBALCORP_PARTY_ID=" + globalCorp)
println("RETAILFINANCE_PARTY_ID=" + retailFinance)
println("=== END PARTY IDs ===")
println("")

// Write to file for easy extraction
val writer = new java.io.PrintWriter("/tmp/party-ids.env")
try {
  writer.println("TECHBANK_PARTY_ID=" + techBank)
  writer.println("GLOBALCORP_PARTY_ID=" + globalCorp)
  writer.println("RETAILFINANCE_PARTY_ID=" + retailFinance)
} finally {
  writer.close()
}
println("✓ Party IDs written to /tmp/party-ids.env")

println("📦 Uploading DAR...")
try {
  participant1.dars.upload("/tmp/payment.dar")
  println("✓ DAR uploaded successfully")
} catch {
  case e: Exception => {
    if (e.getMessage().contains("DUPLICATE_PACKAGE")) {
      println("⚠️  DAR already uploaded, skipping")
    } else {
      println(s"⚠️  DAR upload failed: ${e.getMessage}")
    }
  }
}

println("")
println("✨ Canton initialization complete!")

