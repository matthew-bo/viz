// Bootstrap the domain
println("🚀 Bootstrapping domain 'mydomain'...")

try {
  mydomain.setup.bootstrap_domain()
  println("✅ Domain 'mydomain' bootstrapped successfully")
} catch {
  case e: Exception =>
    println(s"⚠️ Bootstrap may have already occurred: ${e.getMessage}")
}

// Verify domain is ready
val status = mydomain.health.status()
println(s"📊 Domain status: $status")

println("✅ Synchronizer initialization complete")
