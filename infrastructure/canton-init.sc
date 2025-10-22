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

println("👥 Creating/verifying parties...")
// Try to create parties - if they exist, just get the existing ones
val allParties = participant1.parties.list()

val techBank = try {
  participant1.parties.enable("TechBank")
  println("✓ TechBank party created")
} catch {
  case e: Exception => {
    println("⚠️  TechBank party already exists")
    // Get existing party from list (parties.list returns tuples of (PartyId, participants))
    allParties.find(_._1.toString.startsWith("TechBank")).get._1
  }
}

val globalCorp = try {
  participant1.parties.enable("GlobalCorp")
  println("✓ GlobalCorp party created")
} catch {
  case e: Exception => {
    println("⚠️  GlobalCorp party already exists")
    allParties.find(_._1.toString.startsWith("GlobalCorp")).get._1
  }
}

val retailFinance = try {
  participant1.parties.enable("RetailFinance")
  println("✓ RetailFinance party created")
} catch {
  case e: Exception => {
    println("⚠️  RetailFinance party already exists")
    allParties.find(_._1.toString.startsWith("RetailFinance")).get._1
  }
}

println("")
println("=== PARTY IDs (COPY THESE EXACTLY) ===")
val techBankId = techBank.toProtoPrimitive
val globalCorpId = globalCorp.toProtoPrimitive
val retailFinanceId = retailFinance.toProtoPrimitive
println("TECHBANK_PARTY_ID=" + techBankId)
println("GLOBALCORP_PARTY_ID=" + globalCorpId)
println("RETAILFINANCE_PARTY_ID=" + retailFinanceId)
println("=== END PARTY IDs ===")
println("")

// Write to file for easy extraction
val writer = new java.io.PrintWriter("/tmp/party-ids.env")
try {
  writer.println("TECHBANK_PARTY_ID=" + techBankId)
  writer.println("GLOBALCORP_PARTY_ID=" + globalCorpId)
  writer.println("RETAILFINANCE_PARTY_ID=" + retailFinanceId)
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

