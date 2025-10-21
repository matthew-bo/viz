// Upload DAR to all participants in Docker

println("=== Uploading DAR to Participant1 ===")
val darPath1 = "/tmp/payment.dar"
participant1.dars.upload(darPath1)
println("✓ DAR uploaded to participant1")

println("\n=== Uploading DAR to Participant2 ===")
val darPath2 = "/tmp/payment.dar"
participant2.dars.upload(darPath2)
println("✓ DAR uploaded to participant2")

println("\n=== Uploading DAR to Participant3 ===")
val darPath3 = "/tmp/payment.dar"
participant3.dars.upload(darPath3)
println("✓ DAR uploaded to participant3")

println("\n=== All DARs uploaded successfully! ===")

