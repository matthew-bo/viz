// Bootstrap script for Canton participant3
import java.io.File

val darPath = "/canton/payment-demo-0.0.1.dar"
val darFile = new File(darPath)

if (darFile.exists()) {
  println(s"[Participant3] Uploading DAR from $darPath...")
  participant3.dars.upload(darPath)
  println("[Participant3] DAR uploaded successfully!")
} else {
  println(s"WARNING: DAR file not found at $darPath")
}

