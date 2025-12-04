// Bootstrap script for Canton participant2
import java.io.File

val darPath = "/canton/payment-demo-0.0.1.dar"
val darFile = new File(darPath)

if (darFile.exists()) {
  println(s"[Participant2] Uploading DAR from $darPath...")
  participant2.dars.upload(darPath)
  println("[Participant2] DAR uploaded successfully!")
} else {
  println(s"WARNING: DAR file not found at $darPath")
}

