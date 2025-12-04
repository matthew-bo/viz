// Bootstrap script for Canton participant3
// Connects to domain and uploads DAR on startup

import java.io.File

// Wait for domain to be ready
Thread.sleep(9000)

println("[Participant3] Connecting to domain...")
try {
  participant3.domains.connect_local(
    com.digitalasset.canton.sequencing.GrpcSequencerConnection.tryCreate("http://canton-synchronizer:5018"),
    alias = "mydomain",
    manualConnect = false
  )
  println("[Participant3] Connected to domain")
} catch {
  case e: Exception =>
    println(s"[Participant3] Domain connection: ${e.getMessage}")
}

// Upload DAR
val darPath = "/canton/payment-demo-0.0.1.dar"
val darFile = new File(darPath)

if (darFile.exists()) {
  println(s"[Participant3] Uploading DAR from $darPath...")
  try {
    participant3.dars.upload(darPath)
    println("[Participant3] DAR uploaded successfully!")
  } catch {
    case e: Exception =>
      println(s"[Participant3] DAR upload: ${e.getMessage}")
  }
} else {
  println(s"[Participant3] WARNING: DAR file not found at $darPath")
}

// Create party if not exists
println("[Participant3] Ensuring RetailFinance party exists...")
try {
  participant3.parties.enable("RetailFinance")
  println("[Participant3] RetailFinance party created")
} catch {
  case e: Exception =>
    println(s"[Participant3] Party: ${e.getMessage}")
}
