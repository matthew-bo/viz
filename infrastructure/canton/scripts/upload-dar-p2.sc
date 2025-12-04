// Bootstrap script for Canton participant2
// Connects to domain and uploads DAR on startup

import java.io.File

// Wait for domain to be ready
Thread.sleep(7000)

println("[Participant2] Connecting to domain...")
try {
  participant2.domains.connect_local(
    com.digitalasset.canton.sequencing.GrpcSequencerConnection.tryCreate("http://canton-synchronizer:5018"),
    alias = "mydomain",
    manualConnect = false
  )
  println("[Participant2] Connected to domain")
} catch {
  case e: Exception =>
    println(s"[Participant2] Domain connection: ${e.getMessage}")
}

// Upload DAR
val darPath = "/canton/payment-demo-0.0.1.dar"
val darFile = new File(darPath)

if (darFile.exists()) {
  println(s"[Participant2] Uploading DAR from $darPath...")
  try {
    participant2.dars.upload(darPath)
    println("[Participant2] DAR uploaded successfully!")
  } catch {
    case e: Exception =>
      println(s"[Participant2] DAR upload: ${e.getMessage}")
  }
} else {
  println(s"[Participant2] WARNING: DAR file not found at $darPath")
}

// Create party if not exists
println("[Participant2] Ensuring GlobalCorp party exists...")
try {
  participant2.parties.enable("GlobalCorp")
  println("[Participant2] GlobalCorp party created")
} catch {
  case e: Exception =>
    println(s"[Participant2] Party: ${e.getMessage}")
}
