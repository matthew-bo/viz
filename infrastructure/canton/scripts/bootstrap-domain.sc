// File: infrastructure/canton/scripts/bootstrap-domain.sc

println("Bootstrapping domain 'mydomain'...")

// Initialize domain with empty parameters (uses defaults)
mydomain.setup.bootstrap_domain(Seq())

println("Domain 'mydomain' successfully bootstrapped!")
println(s"Domain ID: ${mydomain.id}")

