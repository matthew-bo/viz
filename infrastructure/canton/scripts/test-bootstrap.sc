// Test script to discover available Canton 2.7.6 APIs
println("Testing Canton 2.7.6 bootstrap APIs...")

// Try to inspect what's available on mydomain
println(s"mydomain type: ${mydomain.getClass.getName}")

// List available methods (this will show in error message if it fails)
try {
  // Try old API
  mydomain.setup.bootstrap_domain()
} catch {
  case e: Exception =>
    println(s"Old API failed: ${e.getMessage}")
    // Try without setup
    try {
      mydomain.bootstrap()
    } catch {
      case e2: Exception =>
        println(s"Direct bootstrap failed: ${e2.getMessage}")
    }
}

println("Test complete")

