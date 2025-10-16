// Bootstrap synchronizer domain
println("Bootstrapping domain 'mydomain'...")
mydomain.setup.bootstrap_domain(Seq())
println("Domain 'mydomain' successfully bootstrapped!")
println(s"Domain ID: ${mydomain.id}")

