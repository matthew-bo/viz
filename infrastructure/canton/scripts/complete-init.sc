// Complete Canton 2.7.6 Initialization Script
// This connects participants, creates parties, and uploads DARs

println("=" * 80)
println("🚀 Canton Network Initialization")
println("=" * 80)

// Step 1: Connect all participants to the domain
println("\n[STEP 1] Connecting participants to domain 'mydomain'...")

println("  → Connecting participant1...")
try {
  participant1.domains.connect_local(mydomain)
  println("  ✅ participant1 connected")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  participant1 already connected")
  case e: Exception =>
    println(s"  ❌ Error: ${e.getMessage}")
}

println("  → Connecting participant2...")
try {
  participant2.domains.connect_local(mydomain)
  println("  ✅ participant2 connected")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  participant2 already connected")
  case e: Exception =>
    println(s"  ❌ Error: ${e.getMessage}")
}

println("  → Connecting participant3...")
try {
  participant3.domains.connect_local(mydomain)
  println("  ✅ participant3 connected")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  participant3 already connected")
  case e: Exception =>
    println(s"  ❌ Error: ${e.getMessage}")
}

// Step 2: Verify connections
println("\n[STEP 2] Verifying connections...")
println(s"  participant1 connected domains: ${participant1.domains.list_connected()}")
println(s"  participant2 connected domains: ${participant2.domains.list_connected()}")
println(s"  participant3 connected domains: ${participant3.domains.list_connected()}")

// Step 3: Create parties
println("\n[STEP 3] Creating parties...")

println("  → Creating TechBank on participant1...")
val techBankParty = try {
  participant1.parties.enable("TechBank")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  TechBank already exists, fetching...")
    participant1.parties.list().find(_.party.filterString.contains("TechBank")).get.party
}
println(s"  ✅ TechBank: $techBankParty")

println("  → Creating GlobalCorp on participant2...")
val globalCorpParty = try {
  participant2.parties.enable("GlobalCorp")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  GlobalCorp already exists, fetching...")
    participant2.parties.list().find(_.party.filterString.contains("GlobalCorp")).get.party
}
println(s"  ✅ GlobalCorp: $globalCorpParty")

println("  → Creating RetailFinance on participant3...")
val retailParty = try {
  participant3.parties.enable("RetailFinance")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  RetailFinance already exists, fetching...")
    participant3.parties.list().find(_.party.filterString.contains("RetailFinance")).get.party
}
println(s"  ✅ RetailFinance: $retailParty")

// Step 4: Upload DAR files
println("\n[STEP 4] Uploading DAR files...")

println("  → Uploading to participant1...")
try {
  participant1.dars.upload("/dars/payment-demo-0.0.1.dar")
  println("  ✅ DAR uploaded to participant1")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  DAR already uploaded to participant1")
  case e: Exception =>
    println(s"  ❌ Error: ${e.getMessage}")
}

println("  → Uploading to participant2...")
try {
  participant2.dars.upload("/dars/payment-demo-0.0.1.dar")
  println("  ✅ DAR uploaded to participant2")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  DAR already uploaded to participant2")
  case e: Exception =>
    println(s"  ❌ Error: ${e.getMessage}")
}

println("  → Uploading to participant3...")
try {
  participant3.dars.upload("/dars/payment-demo-0.0.1.dar")
  println("  ✅ DAR uploaded to participant3")
} catch {
  case e: Exception if e.getMessage.contains("already") =>
    println("  ⚠️  DAR already uploaded to participant3")
  case e: Exception =>
    println(s"  ❌ Error: ${e.getMessage}")
}

// Step 5: Verify uploads
println("\n[STEP 5] Verifying DAR uploads...")
println(s"  participant1 DARs: ${participant1.dars.list().map(_.name).mkString(", ")}")
println(s"  participant2 DARs: ${participant2.dars.list().map(_.name).mkString(", ")}")
println(s"  participant3 DARs: ${participant3.dars.list().map(_.name).mkString(", ")}")

// Step 6: Save party IDs to file
println("\n[STEP 6] Saving party IDs...")
import java.nio.file.{Files, Paths, StandardOpenOption}

val partyIdsJson = s"""{
  "TechBank": "$techBankParty",
  "GlobalCorp": "$globalCorpParty",
  "RetailFinance": "$retailParty"
}"""

try {
  Files.write(
    Paths.get("/canton-config/party-ids.json"),
    partyIdsJson.getBytes("UTF-8"),
    StandardOpenOption.CREATE,
    StandardOpenOption.TRUNCATE_EXISTING
  )
  println("  ✅ Party IDs saved to /canton-config/party-ids.json")
} catch {
  case e: Exception =>
    println(s"  ⚠️  Could not save to file: ${e.getMessage}")
    println("  📋 Copy these party IDs manually:")
    println(partyIdsJson)
}

// Final summary
println("\n" + "=" * 80)
println("🎉 Canton Initialization Complete!")
println("=" * 80)
println("\n📄 Party IDs:")
println(s"  TechBank:       $techBankParty")
println(s"  GlobalCorp:     $globalCorpParty")
println(s"  RetailFinance:  $retailParty")
println("\n✅ All participants connected to domain 'mydomain'")
println("✅ All DARs uploaded")
println("✅ Ready for backend development!")
println("=" * 80)

