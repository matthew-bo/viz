// Wait a moment for domain to be ready
Thread.sleep(5000)

println("🚀 Initializing participant3...")

// Connect to domain
println("🔗 Connecting to domain 'mydomain'...")
try {
  participant3.domains.connect_local(
    com.digitalasset.canton.sequencing.GrpcSequencerConnection.tryCreate("http://synchronizer:5018"),
    alias = "mydomain",
    manualConnect = false
  )
  println("✅ Connected to domain")
} catch {
  case e: Exception =>
    println(s"⚠️ Connection may already exist: ${e.getMessage}")
}

// Create party
println("👤 Creating party 'RetailFinance'...")
val retailParty = try {
  participant3.parties.enable("RetailFinance")
} catch {
  case e: Exception =>
    println(s"⚠️ Party may already exist: ${e.getMessage}")
    participant3.parties.list().find(_.party.filterString.contains("RetailFinance")).get.party
}
println(s"✅ RetailFinance party: $retailParty")

// Upload DAR
println("📦 Uploading DAR...")
try {
  participant3.dars.upload("/canton/payment-demo-0.0.1.dar")
  println("✅ DAR uploaded")
} catch {
  case e: Exception =>
    println(s"⚠️ DAR may already be uploaded: ${e.getMessage}")
}

// Save party ID to file
println("💾 Saving party ID...")
import java.nio.file.{Files, Paths, StandardOpenOption}
val partyIdJson = s""""$retailParty""""
try {
  Files.write(
    Paths.get("/canton/party-ids/retailfinance.txt"),
    partyIdJson.getBytes,
    StandardOpenOption.CREATE,
    StandardOpenOption.TRUNCATE_EXISTING
  )
  println("✅ Party ID saved to /canton/party-ids/retailfinance.txt")
} catch {
  case e: Exception =>
    println(s"⚠️ Could not save party ID: ${e.getMessage}")
}

println("✅ Participant3 initialization complete")

