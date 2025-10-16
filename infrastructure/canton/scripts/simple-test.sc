// Simple Canton 2.7.6 API test
println("Testing Canton 2.7.6 Remote Console...")

// Test 1: Check domain status (without calling it as a function)
println("\n[1] Domain status:")
println(mydomain.health.status)

// Test 2: List participant1's current domain registrations
println("\n[2] Participant1 registered domains:")
println(participant1.domains.list_registered())

println("\n[3] Participant1 connected domains:")
println(participant1.domains.list_connected())

// Test 3: Try to get help on domains
println("\n[4] Getting help for participant1.domains:")
participant1.domains.help()

println("\n[5] Listing current parties:")
println(participant1.parties.list())

println("\n[6] Listing current DARs:")
println(participant1.dars.list())

println("\nTests complete!")

