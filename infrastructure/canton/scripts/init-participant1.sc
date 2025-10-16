// Wait a moment for domain to be ready
Thread.sleep(5000)

println("🚀 Initializing participant1...")

// Connect to domain
println("🔗 Connecting to domain 'mydomain'...")
try {
  participant1.domains.connect_local(
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
println("👤 Creating party 'TechBank'...")
val techBankParty = try {
  participant1.parties.enable("TechBank")
} catch {
  case e: Exception =>
    println(s"⚠️ Party may already exist: ${e.getMessage}")
    participant1.parties.list().find(_.party.filterString.contains("TechBank")).get.party
}
println(s"✅ TechBank party: $techBankParty")

// Upload DAR
println("📦 Uploading DAR...")
try {
  participant1.dars.upload("/canton/payment-demo-0.0.1.dar")
  println("✅ DAR uploaded")
} catch {
  case e: Exception =>
    println(s"⚠️ DAR may already be uploaded: ${e.getMessage}")
}

// Save party ID to file
println("💾 Saving party ID...")
import java.nio.file.{Files, Paths, StandardOpenOption}
val partyIdJson = s""""$techBankParty""""
try {
  Files.write(
    Paths.get("/canton/party-ids/techbank.txt"),
    partyIdJson.getBytes,
    StandardOpenOption.CREATE,
    StandardOpenOption.TRUNCATE_EXISTING
  )
  println("✅ Party ID saved to /canton/party-ids/techbank.txt")
} catch {
  case e: Exception =>
    println(s"⚠️ Could not save party ID: ${e.getMessage}")
}

println("✅ Participant1 initialization complete")

