// File: infrastructure/canton/scripts/upload-dar.sc

println("Uploading DAR to all participants...")

val darPath = "/canton/payment-demo-0.0.1.dar"

// Upload to all three participants
participant1.dars.upload(darPath)
println("✓ Uploaded to participant1")

participant2.dars.upload(darPath)
println("✓ Uploaded to participant2")

participant3.dars.upload(darPath)
println("✓ Uploaded to participant3")

println("DAR successfully uploaded to all participants!")

