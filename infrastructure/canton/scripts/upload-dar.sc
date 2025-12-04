// Bootstrap script for Canton participant1
// Connects to domain and uploads DAR on startup

import java.io.File

// Wait for domain to be ready
Thread.sleep(5000)

println("[Participant1] Connecting to domain...")
try {
  participant1.domains.connect_local(
    com.digitalasset.canton.sequencing.GrpcSequencerConnection.tryCreate("http://canton-synchronizer:5018"),
    alias = "mydomain",
    manualConnect = false
  )
  println("[Participant1] Connected to domain")
} catch {
  case e: Exception =>
    println(s"[Participant1] Domain connection: ${e.getMessage}")
}

// Upload DAR
val darPath = "/canton/payment-demo-0.0.1.dar"
val darFile = new File(darPath)

if (darFile.exists()) {
  println(s"[Participant1] Uploading DAR from $darPath...")
  try {
    participant1.dars.upload(darPath)
    println("[Participant1] DAR uploaded successfully!")
  } catch {
    case e: Exception =>
      println(s"[Participant1] DAR upload: ${e.getMessage}")
  }
} else {
  println(s"[Participant1] WARNING: DAR file not found at $darPath")
}

// Create party if not exists
println("[Participant1] Ensuring TechBank party exists...")
try {
  participant1.parties.enable("TechBank")
  println("[Participant1] TechBank party created")
} catch {
  case e: Exception =>
    println(s"[Participant1] Party: ${e.getMessage}")
}
