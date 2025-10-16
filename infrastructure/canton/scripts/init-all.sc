// Canton Initialization Script for Remote Console
// This script connects to running Canton daemons and initializes them

println("=" * 80)
println("🚀 Starting Canton Network Initialization")
println("=" * 80)

// Step 1: Bootstrap Domain
println("\n[1/5] Bootstrapping domain 'mydomain'...")
try {
  mydomain.setup.bootstrap_domain()
  println("✅ Domain bootstrapped successfully")
} catch {
  case e: Exception => 
    println(s"⚠️  Warning: Domain may already be bootstrapped: ${e.getMessage}")
}

// Step 2: Connect Participants to Domain
println("\n[2/5] Connecting participants to domain...")

println("  → Connecting participant1 (TechBank)...")
try {
  participant1.domains.connect_local(
    sequencerConnection = SequencerConnection.Grpc(
      "http://synchronizer:5018",
      transportSecurity = false
    ),
    alias = "mydomain"
  )
  println("  ✅ Participant1 connected")
} catch {
  case e: Exception => 
    println(s"  ⚠️  Warning: ${e.getMessage}")
}

println("  → Connecting participant2 (GlobalCorp)...")
try {
  participant2.domains.connect_local(
    sequencerConnection = SequencerConnection.Grpc(
      "http://synchronizer:5018",
      transportSecurity = false
    ),
    alias = "mydomain"
  )
  println("  ✅ Participant2 connected")
} catch {
  case e: Exception => 
    println(s"  ⚠️  Warning: ${e.getMessage}")
}

println("  → Connecting participant3 (RetailFinance)...")
try {
  participant3.domains.connect_local(
    sequencerConnection = SequencerConnection.Grpc(
      "http://synchronizer:5018",
      transportSecurity = false
    ),
    alias = "mydomain"
  )
  println("  ✅ Participant3 connected")
} catch {
  case e: Exception => 
    println(s"  ⚠️  Warning: ${e.getMessage}")
}

// Step 3: Create Parties
println("\n[3/5] Creating parties...")

println("  → Creating TechBank party on participant1...")
val techBankParty = participant1.parties.enable("TechBank")
println(s"  ✅ TechBank: ${techBankParty}")

println("  → Creating GlobalCorp party on participant2...")
val globalCorpParty = participant2.parties.enable("GlobalCorp")
println(s"  ✅ GlobalCorp: ${globalCorpParty}")

println("  → Creating RetailFinance party on participant3...")
val retailParty = participant3.parties.enable("RetailFinance")
println(s"  ✅ RetailFinance: ${retailParty}")

// Step 4: Save Party IDs to JSON file
println("\n[4/5] Saving party IDs to party-ids.json...")
import java.nio.file.{Files, Paths}
val partyIds = s"""{
  "TechBank": "${techBankParty}",
  "GlobalCorp": "${globalCorpParty}",
  "RetailFinance": "${retailParty}"
}"""
Files.write(Paths.get("/canton-config/party-ids.json"), partyIds.getBytes)
println("✅ Party IDs saved")

// Step 5: Upload DARs
println("\n[5/5] Uploading DAR files...")

println("  → Uploading to participant1...")
participant1.dars.upload("/daml/payment-demo-0.0.1.dar")
println("  ✅ DAR uploaded to participant1")

println("  → Uploading to participant2...")
participant2.dars.upload("/daml/payment-demo-0.0.1.dar")
println("  ✅ DAR uploaded to participant2")

println("  → Uploading to participant3...")
participant3.dars.upload("/daml/payment-demo-0.0.1.dar")
println("  ✅ DAR uploaded to participant3")

// Verification
println("\n" + "=" * 80)
println("🔍 VERIFICATION")
println("=" * 80)

println("\n📊 Domain Status:")
println(s"  mydomain: ${mydomain.health.status()}")

println("\n📊 Connected Participants:")
println(s"  participant1: ${participant1.domains.list_connected()}")
println(s"  participant2: ${participant2.domains.list_connected()}")
println(s"  participant3: ${participant3.domains.list_connected()}")

println("\n👥 Created Parties:")
println(s"  participant1: ${participant1.parties.list()}")
println(s"  participant2: ${participant2.parties.list()}")
println(s"  participant3: ${participant3.parties.list()}")

println("\n📦 Uploaded DARs:")
println(s"  participant1: ${participant1.dars.list()}")
println(s"  participant2: ${participant2.dars.list()}")
println(s"  participant3: ${participant3.dars.list()}")

println("\n" + "=" * 80)
println("🎉 Canton Initialization Complete!")
println("=" * 80)
println("\n📄 Party IDs saved to: /canton-config/party-ids.json")
println("✅ You can now start Phase 3 (Backend Development)")
println("=" * 80)

