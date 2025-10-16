// Discover Canton 2.7.6 API for participant operations
println("=" * 80)
println("Canton 2.7.6 API Discovery")
println("=" * 80)

// Test 1: Check domain status
println("\n[TEST 1] Checking domain status...")
try {
  val status = mydomain.health.status
  println(s"✅ Domain status: $status")
} catch {
  case e: Exception => println(s"❌ Error: ${e.getMessage}")
}

// Test 2: Try to connect participant1
println("\n[TEST 2] Attempting to connect participant1 to domain...")

// Try method 1: connect_local
println("  Trying: participant1.domains.connect_local(...)")
try {
  participant1.domains.connect_local(
    com.digitalasset.canton.sequencing.GrpcSequencerConnection.tryCreate("http://synchronizer:5018"),
    alias = "mydomain"
  )
  println("  ✅ connect_local worked!")
} catch {
  case e: Exception => 
    println(s"  ❌ connect_local failed: ${e.getMessage}")
    
    // Try method 2: Simple string syntax
    println("  Trying simpler syntax: participant1.domains.connect_local(url, alias)")
    try {
      participant1.domains.connect_local("synchronizer:5018", "mydomain")
      println("  ✅ Simple syntax worked!")
    } catch {
      case e2: Exception =>
        println(s"  ❌ Simple syntax failed: ${e2.getMessage}")
    }
}

// Test 3: Check if connected
println("\n[TEST 3] Checking participant1 connections...")
try {
  val registered = participant1.domains.list_registered()
  println(s"  Registered domains: $registered")
  
  val connected = participant1.domains.list_connected()
  println(s"  Connected domains: $connected")
} catch {
  case e: Exception => println(s"  ❌ Error: ${e.getMessage}")
}

// Test 4: Create a party
println("\n[TEST 4] Attempting to create party...")
try {
  val party = participant1.parties.enable("TestParty")
  println(s"  ✅ Party created: $party")
} catch {
  case e: Exception => println(s"  ❌ parties.enable failed: ${e.getMessage}")
}

// Test 5: Upload DAR
println("\n[TEST 5] Attempting to upload DAR...")
try {
  participant1.dars.upload("/dars/payment-demo-0.0.1.dar")
  println("  ✅ DAR uploaded successfully")
} catch {
  case e: Exception => println(s"  ❌ DAR upload failed: ${e.getMessage}")
}

// Test 6: List available methods
println("\n[TEST 6] Discovering available methods...")
println("  participant1.domains methods:")
println("  " + participant1.domains.getClass.getMethods.map(_.getName).mkString(", "))

println("\n" + "=" * 80)
println("API Discovery Complete")
println("=" * 80)

